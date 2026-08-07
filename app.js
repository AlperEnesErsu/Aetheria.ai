/* ==========================================================================
   Aetheria.ai — Application Logic & AI Agent Simulation

   Wiring layer: DOM rendering, event handling, localStorage and the Gemini
   request/response cycle. Pure logic (escaping, markdown, validation,
   selection, rate-limit decisions, blueprint text) lives in core.js, which is
   unit-tested under Node by test/core.test.js.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Pure logic lives in core.js so it can be unit-tested under Node without a DOM
    const {
        escapeHtml,
        parseMarkdown,
        validateProjectShape,
        normalizeProject,
        safeNodeType,
        pickUnseenProject,
        pickConstraintCombo,
        selectFreshIdea,
        buildIdeationPrompt,
        CATEGORY_LABELS,
        evaluateRateLimit,
        buildBlueprintMarkdown
    } = window.AetheriaCore;

    // DOM Elements
    const btnGenerateProject = document.getElementById('btnGenerateProject');
    const btnTriggerStep2 = document.getElementById('btnTriggerStep2');
    const btnExportBlueprint = document.getElementById('btnExportBlueprint');
    const btnSaveProject = document.getElementById('btnSaveProject');
    const terminalContainer = document.getElementById('terminalContainer');
    const terminalBody = document.getElementById('terminalBody');
    const resultsWrapper = document.getElementById('resultsWrapper');
    const step2Container = document.getElementById('step2Container');
    const step2TriggerWrapper = document.getElementById('step2TriggerWrapper');
    const originBadge = document.getElementById('originBadge');
    const exampleNotice = document.getElementById('exampleNotice');
    const btnNoticeSetKey = document.getElementById('btnNoticeSetKey');
    const filterBar = document.getElementById('filterBar');

    // Header Action Elements
    const btnSavedProjects = document.getElementById('btnSavedProjects');
    const savedCountBadge = document.getElementById('savedCountBadge');

    // Shared Pool Drawer Elements
    const savedDrawerOverlay = document.getElementById('savedDrawerOverlay');
    const btnCloseDrawer = document.getElementById('btnCloseDrawer');
    const savedProjectsList = document.getElementById('savedProjectsList');

    // Feature 2: Gemini API Elements
    const btnFeature2Notice = document.getElementById('btnFeature2Notice');
    const feature2Modal = document.getElementById('feature2Modal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnSaveGeminiKey = document.getElementById('btnSaveGeminiKey');
    const geminiApiKeyInput = document.getElementById('geminiApiKey');
    const useGeminiApiToggle = document.getElementById('useGeminiApiToggle');

    // Result DOM Elements
    const projectCategory = document.getElementById('projectCategory');
    const projectTitle = document.getElementById('projectTitle');
    const projectTagline = document.getElementById('projectTagline');
    const projectTags = document.getElementById('projectTags');
    const marketGapContent = document.getElementById('marketGapContent');
    const descriptionContent = document.getElementById('descriptionContent');
    const architectureContent = document.getElementById('architectureContent');
    const securityContent = document.getElementById('securityContent');
    const architectureDiagramNodes = document.getElementById('architectureDiagramNodes');

    // Metadata Grid Elements
    const metricOpportunity = document.getElementById('metricOpportunity');
    const metricDifficulty = document.getElementById('metricDifficulty');
    const metricMvpTime = document.getElementById('metricMvpTime');
    const metricMonetization = document.getElementById('metricMonetization');

    // Application State
    let currentProject = null;
    let activeCategoryFilter = 'all';

    // Ids already shown to this user. Persisted so variety survives a reload —
    // without it, every refresh started the example rotation from scratch.
    let seenProjectIds = JSON.parse(localStorage.getItem('aetheria_seen_projects') || '[]');

    // SECURITY & RATE LIMITING STATE (Open-Source Protection)
    const RATE_LIMIT_COOLDOWN_MS = 20000; // 20 seconds minimum delay between Gemini API calls
    const MAX_CALLS_PER_HOUR = 15; // Max 15 Gemini API calls per hour per browser

    // Gemini request configuration.
    // Pinned model names go stale: gemini-2.5-flash now returns 404 ("no longer
    // available to new users") and gemini-2.5-flash-lite is gone entirely, so live
    // mode was dead for anyone with a recently issued key. The -latest aliases are
    // repointed by Google as models are retired, which keeps this list from
    // expiring again.
    const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest']; // primary, then fallback
    const MAX_OUTPUT_TOKENS = 8192; // must fit the full blueprint JSON
    const GEMINI_TIMEOUT_MS = 45000;

    // Pass 1 asks for a batch of one-liners; eight gives the local filter room to
    // discard repeats without needing a second round trip.
    const IDEA_BATCH_SIZE = 8;
    const IDEA_MAX_TOKENS = 1024;

    // Reasoning is kept short so it does not eat the output budget. The field name
    // is generation-specific: 2.5 took thinkingConfig.thinkingBudget, the current
    // flash models reject that with 400 and take thinkingLevel instead. Measured
    // with `node scripts/gemini-lab.js --probe-config`. requestGeminiCompletion
    // drops the whole block and retries if a future model rejects this spelling
    // too — the field has now changed twice, so it will change again.
    const THINKING_CONFIG = { thinkingLevel: 'low' };

    let lastGeminiCallTimestamp = Number(localStorage.getItem('aetheria_last_gemini_call') || 0);
    let hourlyCallHistory = JSON.parse(localStorage.getItem('aetheria_gemini_call_history') || '[]');

    // Shared Community Pool State Management
    let communityPool = JSON.parse(localStorage.getItem('aetheria_community_pool') || 'null');
    if (!communityPool) {
        communityPool = (typeof PROJECTS_DATABASE !== 'undefined') ? [...PROJECTS_DATABASE.slice(0, 3)] : [];
        localStorage.setItem('aetheria_community_pool', JSON.stringify(communityPool));
    }

    let geminiApiKey = localStorage.getItem('aetheria_gemini_key') || '';
    let useGeminiLiveMode = localStorage.getItem('aetheria_use_gemini') === 'true';

    // Initialize UI Settings
    if (geminiApiKeyInput) geminiApiKeyInput.value = geminiApiKey;
    if (useGeminiApiToggle) useGeminiApiToggle.checked = useGeminiLiveMode;
    updateGeminiBadgeStatus();
    updateSavedBadge();

    // Helper: Sleep Delay
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Helper: single place that owns the disabled/opacity pair, so no early return can
    // leave a button stuck in its busy state
    function setButtonBusy(button, busy) {
        button.disabled = busy;
        button.style.opacity = busy ? '0.7' : '1';
        button.setAttribute('aria-busy', busy ? 'true' : 'false');
    }

    // Terminal Log Writer
    function writeTerminalLog(message, type = 'info') {
        const line = document.createElement('div');
        line.className = 'terminal-line';
        
        const timestamp = new Date().toLocaleTimeString('tr-TR', { hour12: false });
        let statusTag = `<span class="prefix">[${timestamp}]</span>`;

        if (type === 'success') {
            statusTag += ` <span class="status-success">[SUCCESS]</span>`;
        } else if (type === 'agent') {
            statusTag += ` <span class="status-info">[AI AGENT]</span>`;
        } else if (type === 'warning') {
            statusTag += ` <span class="status-info" style="color: var(--accent-amber);">[SECURITY GUARD]</span>`;
        } else {
            statusTag += ` <span class="status-info">[SCAN]</span>`;
        }

        // `message` can carry a raw upstream error body (see describeHttpError), so it
        // is escaped before it becomes markup.
        line.innerHTML = `${statusTag} <span>${escapeHtml(message)}</span>`;
        terminalBody.appendChild(line);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    // Rate Limiter Enforcement Check — the decision itself is pure (core.js);
    // this wrapper supplies the clock and persists the pruned history.
    function checkRateLimits() {
        const verdict = evaluateRateLimit(Date.now(), lastGeminiCallTimestamp, hourlyCallHistory, {
            cooldownMs: RATE_LIMIT_COOLDOWN_MS,
            maxPerHour: MAX_CALLS_PER_HOUR
        });

        hourlyCallHistory = verdict.history;
        localStorage.setItem('aetheria_gemini_call_history', JSON.stringify(hourlyCallHistory));

        return verdict;
    }

    // Record Gemini Call Timestamp for rate limiting
    function recordGeminiCall() {
        const now = Date.now();
        lastGeminiCallTimestamp = now;
        hourlyCallHistory.push(now);

        localStorage.setItem('aetheria_last_gemini_call', now.toString());
        localStorage.setItem('aetheria_gemini_call_history', JSON.stringify(hourlyCallHistory));
    }

    // Update Gemini Header Badge Status
    function updateGeminiBadgeStatus() {
        if (useGeminiLiveMode && geminiApiKey) {
            btnFeature2Notice.innerHTML = `<span>⚡ Gemini Live (Korumalı)</span>`;
            btnFeature2Notice.style.borderColor = 'var(--accent-emerald)';
            btnFeature2Notice.style.color = 'var(--accent-emerald)';
        } else {
            btnFeature2Notice.innerHTML = `<span>⚡ Gemini API Ayarları</span>`;
            btnFeature2Notice.style.borderColor = 'rgba(255, 183, 3, 0.3)';
            btnFeature2Notice.style.color = 'var(--accent-amber)';
        }
    }

    // Update Shared Community Counter Badge
    function updateSavedBadge() {
        savedCountBadge.textContent = communityPool.length;
        // Otherwise a screen reader just announces a bare number
        savedCountBadge.setAttribute('aria-label', `${communityPool.length} kayıtlı proje`);
    }

    // Check if project exists in Shared Pool
    function isInCommunityPool(projectId) {
        return communityPool.some(p => p.id === projectId);
    }

    // Update Save Button Visual State
    function updateSaveButtonUI() {
        if (!currentProject) return;
        const saved = isInCommunityPool(currentProject.id);
        if (saved) {
            btnSaveProject.classList.add('is-saved');
            btnSaveProject.querySelector('span').textContent = '✓ Havuzda Kayıtlı';
        } else {
            btnSaveProject.classList.remove('is-saved');
            btnSaveProject.querySelector('span').textContent = 'Havuzuma Ekle';
        }
    }

    // Toggle Save Project to Shared Pool
    function toggleSaveCurrentProject() {
        if (!currentProject) return;

        if (isInCommunityPool(currentProject.id)) {
            communityPool = communityPool.filter(p => p.id !== currentProject.id);
        } else {
            communityPool.push(currentProject);
        }

        localStorage.setItem('aetheria_community_pool', JSON.stringify(communityPool));
        updateSavedBadge();
        updateSaveButtonUI();
        renderSavedProjectsList();
    }

    // Render Shared Community Pool Drawer List
    function renderSavedProjectsList() {
        savedProjectsList.innerHTML = '';
        if (communityPool.length === 0) {
            savedProjectsList.innerHTML = `<div style="text-align: center; color: var(--text-dark); padding: 2rem 0;">Ortak havuzda henüz kaydedilmiş proje bulunmuyor.</div>`;
            return;
        }

        // Built with DOM APIs rather than an innerHTML template: pool entries are
        // untrusted (Gemini output, or hand-edited localStorage) and interpolating
        // proj.title / proj.category into markup was directly injectable.
        communityPool.forEach(proj => {
            const card = document.createElement('div');
            card.className = 'saved-card-item';

            const cat = document.createElement('div');
            cat.className = 'saved-item-cat';
            cat.textContent = proj.category;

            const title = document.createElement('div');
            title.className = 'saved-item-title';
            title.textContent = proj.title;

            const actions = document.createElement('div');
            actions.className = 'saved-item-actions';

            [
                { cls: 'btn-inspect', label: 'İncele' },
                { cls: 'btn-download', label: '.MD İndir' },
                { cls: 'btn-delete', label: 'Havuzdan Çıkar' }
            ].forEach(({ cls, label }) => {
                const btn = document.createElement('button');
                btn.className = `btn-saved-action ${cls}`;
                btn.dataset.id = proj.id;
                btn.textContent = label;
                actions.appendChild(btn);
            });

            card.append(cat, title, actions);
            savedProjectsList.appendChild(card);
        });

        // Event delegation inside drawer
        savedProjectsList.querySelectorAll('.btn-inspect').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projId = e.target.getAttribute('data-id');
                const found = communityPool.find(p => p.id === projId);
                if (found) {
                    // Pooled projects are already "known", so show the full report immediately
                    loadProjectIntoView(found, true);
                    closeDialogOverlay();
                }
            });
        });

        savedProjectsList.querySelectorAll('.btn-download').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projId = e.target.getAttribute('data-id');
                const found = communityPool.find(p => p.id === projId);
                if (found) exportBlueprintMarkdown(found);
            });
        });

        savedProjectsList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const projId = e.target.getAttribute('data-id');
                const target = communityPool.find(p => p.id === projId);
                // Removal is permanent — the pool lives only in this browser
                if (!window.confirm(`"${target ? target.title : projId}" havuzdan kalıcı olarak çıkarılsın mı?`)) return;

                communityPool = communityPool.filter(p => p.id !== projId);
                localStorage.setItem('aetheria_community_pool', JSON.stringify(communityPool));
                updateSavedBadge();
                updateSaveButtonUI();
                renderSavedProjectsList();
            });
        });
    }

    // Render the Aşama 2 payload (diagram + architecture + security) for the active project
    function renderStep2Content() {
        if (!currentProject || !currentProject.step2) return;
        renderArchitectureDiagram(currentProject.diagramNodes);
        architectureContent.innerHTML = parseMarkdown(currentProject.step2.architecture);
        securityContent.innerHTML = parseMarkdown(currentProject.step2.security);
    }

    // Say where the project came from. An example pulled from the bundled list is
    // not an AI-generated project, and presenting it as one was the central
    // dishonesty in the old flow.
    function setOriginBadge(isExample) {
        originBadge.textContent = isExample ? '📁 Örnek Proje' : '✨ Yapay Zeka Üretimi';
        originBadge.classList.toggle('badge-example', isExample);
        originBadge.classList.toggle('badge-step1', !isExample);
        exampleNotice.style.display = isExample && !(useGeminiLiveMode && geminiApiKey) ? 'flex' : 'none';
    }

    // Toggle visibility of the "Aşama 2" section and its trigger button.
    // Step 2 stays hidden after a fresh generation so the two-stage flow is preserved;
    // it is revealed only on explicit user action or when re-opening a pooled project.
    function setStep2Visibility(revealed) {
        const hasStep2 = Boolean(currentProject && currentProject.step2);

        step2Container.style.display = revealed ? 'block' : 'none';
        step2Container.classList.toggle('visible', revealed);
        step2TriggerWrapper.style.display = (hasStep2 && !revealed) ? 'block' : 'none';
    }

    // Load any project directly into view.
    // `revealStep2` is opt-in: the generate flow leaves it false so the user still has to
    // trigger the architecture/security stage themselves.
    function loadProjectIntoView(proj, revealStep2 = false, isExample = false) {
        currentProject = proj;
        setOriginBadge(isExample);
        
        projectCategory.textContent = currentProject.category;
        projectTitle.textContent = currentProject.title;
        projectTagline.textContent = currentProject.tagline;

        const meta = currentProject.meta || {};
        metricOpportunity.textContent = meta.opportunityScore || '%95 Fırsat Skoru';
        metricDifficulty.textContent = meta.difficulty || 'Orta Düzey';
        metricMvpTime.textContent = meta.mvpTime || '6 Hafta';
        metricMonetization.textContent = meta.monetization || 'B2B SaaS';

        projectTags.innerHTML = '';
        if (currentProject.step1 && currentProject.step1.tags) {
            currentProject.step1.tags.forEach(tag => {
                const span = document.createElement('span');
                span.className = 'tag-pill';
                span.textContent = tag;
                projectTags.appendChild(span);
            });
        }

        marketGapContent.innerHTML = parseMarkdown(currentProject.step1 ? currentProject.step1.marketGap : '');
        descriptionContent.innerHTML = parseMarkdown(currentProject.step1 ? currentProject.step1.description : '');

        if (currentProject.step2 && revealStep2) {
            renderStep2Content();
        }
        setStep2Visibility(Boolean(currentProject.step2) && revealStep2);

        updateSaveButtonUI();
        resultsWrapper.classList.add('visible');
        resultsWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Filter projects based on selected category
    function getFilteredProjects() {
        if (typeof PROJECTS_DATABASE === 'undefined' || PROJECTS_DATABASE.length === 0) return [];
        if (activeCategoryFilter === 'all') return PROJECTS_DATABASE;
        return PROJECTS_DATABASE.filter(p => p.categoryKey === activeCategoryFilter);
    }

    // Pick an example the user has not seen yet (selection logic lives in core.js).
    // Returns { project, exhausted } so the caller can say when a cycle restarted.
    function getUnseenExample() {
        const result = pickUnseenProject(getFilteredProjects(), seenProjectIds);

        seenProjectIds = result.seen;
        try {
            localStorage.setItem('aetheria_seen_projects', JSON.stringify(seenProjectIds));
        } catch {
            // Quota or private-mode failure: variety degrades this session but the
            // app keeps working, so this is not worth interrupting the user for.
        }

        return result;
    }

    // Read a fetch error body defensively — Gemini returns JSON for API errors but
    // proxies and gateways happily return HTML, which would mask the real failure.
    async function describeHttpError(response) {
        let detail = '';
        try {
            const raw = await response.text();
            try {
                const parsed = JSON.parse(raw);
                detail = parsed && parsed.error && parsed.error.message ? parsed.error.message : raw;
            } catch {
                detail = raw;
            }
        } catch {
            detail = '';
        }
        detail = String(detail).replace(/\s+/g, ' ').trim().slice(0, 200);
        return `HTTP ${response.status}${detail ? ` — ${detail}` : ''}`;
    }

    // Two-pass generation.
    //
    // Asking for one complete project in a single call meant the model returned
    // variations on a handful of favourite ideas. Instead it is asked for several
    // one-line ideas first, the ones the user has already seen are dropped locally,
    // and only the survivor is expanded. Filtering one-liners is cheaper and more
    // accurate than comparing finished blueprints, and a repeat costs nothing to
    // discard.
    async function generateProjectViaGeminiApi(onProgress = () => {}) {
        if (!geminiApiKey) throw new Error('API Key girilmedi');

        const limitCheck = checkRateLimits();
        if (!limitCheck.allowed) throw new Error(limitCheck.reason);

        // Count the attempt *before* firing it. Recording only successful calls meant
        // a rejected key or a 429 storm consumed neither the cooldown nor the hourly
        // budget, which let a broken configuration hammer the endpoint unthrottled.
        // One generation is one unit even though it now costs two API calls — the
        // limiter paces the user, it does not meter Google's quota.
        recordGeminiCall();

        const combo = pickConstraintCombo();
        const categoryLabel = CATEGORY_LABELS[activeCategoryFilter] || 'yazılım';

        onProgress({ phase: 'ideate', combo });
        const ideation = await requestIdeas(categoryLabel, combo);

        const { idea, freshCount, exhausted } = selectFreshIdea(ideation.ideas, knownIdeaTitles());
        if (!idea) throw new Error('Model kullanılabilir fikir döndürmedi');

        onProgress({
            phase: 'selected',
            total: ideation.ideas.length,
            freshCount,
            exhausted,
            title: idea.title,
            model: ideation.model,
            tokens: ideation.tokens
        });

        onProgress({ phase: 'expand' });
        const expansion = await expandIdea(idea, categoryLabel, combo);

        return {
            project: expansion.project,
            model: expansion.model,
            tokens: ideation.tokens + expansion.tokens,
            ideaCount: ideation.ideas.length,
            freshCount
        };
    }

    // Titles the user has already met, so the model can be told to avoid them.
    // Capped because the whole list travels in the prompt on every call.
    function knownIdeaTitles() {
        const fromPool = communityPool.map(p => p.title);
        const fromExamples = (typeof PROJECTS_DATABASE !== 'undefined' ? PROJECTS_DATABASE : [])
            .filter(p => seenProjectIds.includes(p.id))
            .map(p => p.title);

        let fromGenerated = [];
        try {
            fromGenerated = JSON.parse(localStorage.getItem('aetheria_seen_titles') || '[]');
        } catch {
            fromGenerated = [];
        }

        return [...new Set([...fromGenerated, ...fromPool, ...fromExamples])].slice(-40);
    }

    function rememberIdeaTitle(title) {
        try {
            const titles = JSON.parse(localStorage.getItem('aetheria_seen_titles') || '[]');
            titles.push(title);
            localStorage.setItem('aetheria_seen_titles', JSON.stringify(titles.slice(-60)));
        } catch {
            // Quota or private mode: variety degrades, the app keeps working.
        }
    }

    // PASS 1 — a short list of one-line ideas. Small output, so this is cheap.
    async function requestIdeas(categoryLabel, combo) {
        // Prompt text lives in core.js so scripts/gemini-lab.js measures the exact
        // wording the app ships rather than a copy that can drift.
        const prompt = buildIdeationPrompt(categoryLabel, IDEA_BATCH_SIZE, combo, knownIdeaTitles());

        const data = await requestGeminiCompletion({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json',
                maxOutputTokens: IDEA_MAX_TOKENS,
                temperature: 1.0,   // higher than the expansion pass: this call exists to explore
                thinkingConfig: THINKING_CONFIG
            }
        });

        const parsed = readJsonCandidate(data, 'Fikir listesi');
        const ideas = Array.isArray(parsed.ideas) ? parsed.ideas : [];
        if (ideas.length === 0) throw new Error('Fikir listesi boş döndü');

        return {
            ideas,
            model: data.__model,
            tokens: (data.usageMetadata && data.usageMetadata.totalTokenCount) || 0
        };
    }

    // PASS 2 — expand the chosen one-liner into the full project schema.
    async function expandIdea(idea, categoryLabel, combo) {
        const prompt = `Aşağıdaki proje fikrini eksiksiz bir proje önerisine dönüştür.

FİKİR: ${idea.title}
AÇIKLAMA: ${idea.summary || ''}
ALAN: ${categoryLabel}
BAĞLAM: ${combo.problemSource} · ${combo.audience} · ${combo.technical} · ${combo.revenue}

Yanıtı tam olarak şu JSON şemasında ver:
{
  "title": "${idea.title}",
  "tagline": "Etkileyici tek cümlelik slogan",
  "category": "${categoryLabel}",
  "categoryKey": "${activeCategoryFilter}",
  "meta": {
     "difficulty": "Orta Düzey veya İleri Düzey",
     "mvpTime": "örn. 6 Hafta",
     "monetization": "Gelir modeli",
     "opportunityScore": "örn. %92 Fırsat Skoru"
  },
  "diagramNodes": [
     { "id": 1, "name": "Bileşen", "type": "source", "sub": "Kısa açıklama" },
     { "id": 2, "name": "Bileşen", "type": "service", "sub": "Kısa açıklama" },
     { "id": 3, "name": "Bileşen", "type": "ai", "sub": "Kısa açıklama" },
     { "id": 4, "name": "Bileşen", "type": "storage", "sub": "Kısa açıklama" },
     { "id": 5, "name": "Bileşen", "type": "client", "sub": "Kısa açıklama" }
  ],
  "step1": {
     "marketGap": "Problemi, mevcut çözümlerin nerede yetersiz kaldığını ve fırsatı anlat",
     "description": "Detaylı proje açıklaması ve madde madde özellikler",
     "tags": ["Teknoloji1", "Teknoloji2", "Teknoloji3"]
  },
  "step2": {
     "architecture": "Sistem mimarisi, Clean Architecture katmanları, veritabanı tasarımı",
     "security": "Güvenlik önlemleri, tehdit modeli, şifreleme ve yetkilendirme"
  }
}

"type" alanı yalnızca şunlardan biri olabilir: source, service, ai, storage, client.`;

        const data = await requestGeminiCompletion({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json',
                maxOutputTokens: MAX_OUTPUT_TOKENS,
                temperature: 0.7,
                thinkingConfig: THINKING_CONFIG
            }
        });

        const projectObj = readJsonCandidate(data, 'Proje');

        const shapeError = validateProjectShape(projectObj);
        if (shapeError) throw new Error(`Geçersiz proje yanıtı: ${shapeError}`);

        rememberIdeaTitle(projectObj.title);

        return {
            project: normalizeProject(projectObj, activeCategoryFilter),
            model: data.__model,
            tokens: (data.usageMetadata && data.usageMetadata.totalTokenCount) || 0
        };
    }

    // Surfaced in the log rather than swallowed: if this fires, THINKING_CONFIG needs
    // updating, and silently degrading would hide that until someone read the code.
    let thinkingConfigWarned = false;
    function onThinkingConfigRejected() {
        if (thinkingConfigWarned) return;
        thinkingConfigWarned = true;
        writeTerminalLog(
            'Model thinkingConfig alanını reddetti; o alan olmadan tekrar deneniyor. ' +
            '(node scripts/gemini-lab.js --probe-config ile doğrulanabilir)', 'warning');
    }

    // Shared unwrapping for both passes: the API does not guarantee the shape the
    // original code assumed, so every step that can be missing is checked.
    function readJsonCandidate(data, label) {
        const candidate = data && Array.isArray(data.candidates) ? data.candidates[0] : null;
        if (!candidate) {
            const blockReason = data && data.promptFeedback && data.promptFeedback.blockReason;
            throw new Error(blockReason
                ? `${label}: istek güvenlik filtresine takıldı (${blockReason})`
                : `${label}: Gemini boş yanıt döndürdü`);
        }
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            throw new Error(`${label}: yanıt tamamlanamadı (finishReason: ${candidate.finishReason})`);
        }

        const parts = candidate.content && Array.isArray(candidate.content.parts)
            ? candidate.content.parts
            : [];
        const jsonText = parts.map(part => (part && typeof part.text === 'string' ? part.text : '')).join('');
        if (!jsonText.trim()) throw new Error(`${label}: yanıtta metin bulunamadı`);

        try {
            return JSON.parse(jsonText);
        } catch {
            throw new Error(`${label}: geçerli JSON döndürmedi`);
        }
    }

    // POST to Gemini, walking the model list until one answers. The API key travels in
    // the x-goog-api-key header rather than the query string so it does not end up in
    // browser history, referrers or proxy logs.
    async function requestGeminiCompletion(requestBody) {
        let lastError = null;

        for (const model of GEMINI_MODELS) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-goog-api-key': geminiApiKey.trim()
                        },
                        body: JSON.stringify(requestBody),
                        signal: controller.signal
                    }
                );

                if (response.ok) {
                    // Tag the payload with the model that actually served it — with a
                    // fallback list, that is not always GEMINI_MODELS[0].
                    const payload = await response.json();
                    payload.__model = model;
                    return payload;
                }

                lastError = new Error(`${model}: ${await describeHttpError(response)}`);

                // A 400 with thinkingConfig present is almost always this model
                // rejecting that field's spelling — it has already changed once
                // (thinkingBudget -> thinkingLevel) and broke live mode silently.
                // Drop the block and retry the same model before giving up: a shorter
                // reasoning budget is an optimisation, not a requirement.
                if (response.status === 400 && requestBody.generationConfig
                    && requestBody.generationConfig.thinkingConfig) {
                    const { thinkingConfig, ...rest } = requestBody.generationConfig;
                    void thinkingConfig;
                    onThinkingConfigRejected();
                    return requestGeminiCompletion({ ...requestBody, generationConfig: rest });
                }

                // 404 means this particular model is gone or gated for this key, and
                // 429 is a quota answer for this model — both are exactly what the
                // fallback list exists for, so keep walking it.
                // Other 4xx (bad key, bad body) would fail identically on every model.
                const worthRetrying = response.status === 404 || response.status === 429;
                if (response.status >= 400 && response.status < 500 && !worthRetrying) {
                    throw lastError;
                }
            } catch (err) {
                if (err === lastError) throw err;
                lastError = err.name === 'AbortError'
                    ? new Error(`${model}: istek zaman aşımına uğradı (${GEMINI_TIMEOUT_MS / 1000}s)`)
                    : new Error(`${model}: ${err.message}`);
            } finally {
                clearTimeout(timeoutId);
            }
        }

        throw lastError || new Error('Gemini API Hatası');
    }

    // Render Visual Architecture Flow Graph
    function renderArchitectureDiagram(nodes) {
        architectureDiagramNodes.innerHTML = '';
        if (!nodes || nodes.length === 0) return;

        nodes.forEach((node, idx) => {
            const card = document.createElement('div');
            // node.type lands in a class name, so restrict it to the known palette
            const type = safeNodeType(node.type);
            card.className = `diagram-node-card node-${type}`;

            const name = document.createElement('div');
            name.className = 'node-name';
            name.textContent = node.name;

            const sub = document.createElement('div');
            sub.className = 'node-sub';
            sub.textContent = node.sub || '';

            card.append(name, sub);
            architectureDiagramNodes.appendChild(card);

            if (idx < nodes.length - 1) {
                const arrow = document.createElement('div');
                arrow.className = 'flow-arrow';
                arrow.innerHTML = '➔';
                architectureDiagramNodes.appendChild(arrow);
            }
        });
    }

    // Export Blueprint as Markdown
    function exportBlueprintMarkdown(projToExport) {
        const p = projToExport || currentProject;
        if (!p) return;

        const blob = new Blob([buildBlueprintMarkdown(p)], { type: 'text/markdown;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${p.id}-blueprint.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // The blob stays alive for the whole document lifetime unless revoked, so every
        // export leaked its payload. Deferred one tick so the download has started.
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    // Category Filter Handlers
    filterBar.addEventListener('click', (e) => {
        if (!e.target.classList.contains('filter-btn')) return;

        // .active alone is invisible to assistive tech; aria-pressed makes the
        // selected filter announceable as a toggle button.
        document.querySelectorAll('.filter-btn').forEach(btn => {
            const isActive = btn === e.target;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        activeCategoryFilter = e.target.getAttribute('data-category');
    });

    // Reflect the initial filter state for assistive tech on load
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.setAttribute('type', 'button');
        btn.setAttribute('aria-pressed', btn.classList.contains('active') ? 'true' : 'false');
    });

    // ==========================================
    // DIALOG PLUMBING (drawer + settings modal)
    // Both were plain divs toggled with style.display: no Escape, no focus
    // management, and keyboard users could tab straight into the page behind them.
    // ==========================================
    const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
    let openDialog = null;          // { overlay, trigger }

    function openDialogOverlay(overlay, trigger, displayMode) {
        overlay.style.display = displayMode;
        if (trigger) trigger.setAttribute('aria-expanded', 'true');
        openDialog = { overlay, trigger };

        const first = overlay.querySelector(FOCUSABLE);
        if (first) first.focus();
    }

    function closeDialogOverlay() {
        if (!openDialog) return;
        const { overlay, trigger } = openDialog;
        overlay.style.display = 'none';
        openDialog = null;

        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
            trigger.focus();   // return focus to where the user left off
        }
    }

    // Escape closes, Tab is trapped inside the open dialog
    document.addEventListener('keydown', (e) => {
        if (!openDialog) return;

        if (e.key === 'Escape') {
            e.preventDefault();
            closeDialogOverlay();
            return;
        }

        if (e.key !== 'Tab') return;

        const items = [...openDialog.overlay.querySelectorAll(FOCUSABLE)]
            .filter(el => el.offsetParent !== null);
        if (items.length === 0) return;

        const first = items[0];
        const last = items[items.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });

    // Drawer Open / Close Handlers
    btnSavedProjects.addEventListener('click', () => {
        renderSavedProjectsList();
        openDialogOverlay(savedDrawerOverlay, btnSavedProjects, 'flex');
    });
    btnCloseDrawer.addEventListener('click', closeDialogOverlay);
    savedDrawerOverlay.addEventListener('click', (e) => {
        if (e.target === savedDrawerOverlay) closeDialogOverlay();
    });

    // Save Project Button Handler
    btnSaveProject.addEventListener('click', toggleSaveCurrentProject);

    // Gemini API Modal Handlers
    btnFeature2Notice.addEventListener('click', () => openDialogOverlay(feature2Modal, btnFeature2Notice, 'flex'));
    btnNoticeSetKey.addEventListener('click', () => openDialogOverlay(feature2Modal, btnNoticeSetKey, 'flex'));
    btnCloseModal.addEventListener('click', closeDialogOverlay);
    feature2Modal.addEventListener('click', (e) => {
        if (e.target === feature2Modal) closeDialogOverlay();
    });

    // Save Gemini Key & Mode Setting
    btnSaveGeminiKey.addEventListener('click', () => {
        geminiApiKey = geminiApiKeyInput.value.trim();
        useGeminiLiveMode = useGeminiApiToggle.checked;

        localStorage.setItem('aetheria_gemini_key', geminiApiKey);
        localStorage.setItem('aetheria_use_gemini', useGeminiLiveMode ? 'true' : 'false');
        
        updateGeminiBadgeStatus();
        closeDialogOverlay();
    });

    // Export Blueprint Handler
    btnExportBlueprint.addEventListener('click', () => exportBlueprintMarkdown());

    // ==========================================
    // STEP 1: GENERATE PROJECT IDEA & MARKET GAP
    // ==========================================
    async function startStep1Simulation() {
        setButtonBusy(btnGenerateProject, true);
        try {
            await runStep1();
        } catch (err) {
            // Any unexpected failure used to leave the button permanently disabled,
            // making the app look frozen with no way to retry.
            console.error('Aetheria: proje üretimi başarısız', err);
            writeTerminalLog(`Beklenmeyen hata: ${err.message || err}. Lütfen tekrar deneyin.`, 'warning');
        } finally {
            setButtonBusy(btnGenerateProject, false);
        }
    }

    async function runStep1() {
        resultsWrapper.classList.remove('visible');
        step2Container.classList.remove('visible');
        step2Container.style.display = 'none';
        step2TriggerWrapper.style.display = 'none';

        terminalContainer.style.display = 'block';
        terminalBody.innerHTML = '';

        // Every line below reports something that actually happened. The previous
        // script announced a "Küresel SaaS & GitHub Trend Veritabanı" connection and
        // a competition-saturation analysis, neither of which exists — the terminal
        // was theatre dressed as telemetry.
        let projectToRender = null;
        let isExample = false;

        if (useGeminiLiveMode && geminiApiKey) {
            const started = Date.now();

            try {
                // Both passes report as they happen, so the log tracks real progress
                // rather than replaying a fixed script.
                const generated = await generateProjectViaGeminiApi((step) => {
                    if (step.phase === 'ideate') {
                        writeTerminalLog(
                            `Fikir listesi isteniyor · ${IDEA_BATCH_SIZE} fikir · model: ${GEMINI_MODELS[0]}`, 'agent');
                        writeTerminalLog(
                            `Kısıtlar: ${step.combo.problemSource} · ${step.combo.audience} · ` +
                            `${step.combo.technical} · ${step.combo.revenue}`, 'info');
                    } else if (step.phase === 'selected') {
                        writeTerminalLog(
                            `${step.total} fikir alındı · ${step.freshCount} tanesi yeni · ` +
                            `${step.tokens} token`, 'info');
                        if (step.exhausted) {
                            writeTerminalLog('Hepsi daha önce görülmüştü; en farklı olan seçildi.', 'warning');
                        }
                        writeTerminalLog(`Seçilen fikir: "${step.title}"`, 'agent');
                    } else if (step.phase === 'expand') {
                        writeTerminalLog('Fikir tam projeye genişletiliyor...', 'agent');
                    }
                });

                projectToRender = generated.project;

                writeTerminalLog(
                    `Tamamlandı · ${generated.model} · ${generated.tokens} token (2 çağrı) · ` +
                    `${((Date.now() - started) / 1000).toFixed(1)} sn`, 'info');
                writeTerminalLog('Şema doğrulandı, proje oluşturuldu.', 'success');
            } catch (err) {
                console.warn('Gemini üretimi başarısız:', err);
                writeTerminalLog(`Üretim başarısız: ${err.message}`, 'warning');
                writeTerminalLog('Örnek projelere geçiliyor.', 'info');
            }
        }

        // Examples are a fallback, and the log says so plainly rather than dressing
        // a lookup up as generation.
        if (!projectToRender) {
            isExample = true;

            if (!useGeminiLiveMode || !geminiApiKey) {
                writeTerminalLog('API anahtarı tanımlı değil — örnek projeler gösteriliyor.', 'info');
            }

            const { project, exhausted } = getUnseenExample();

            if (!project) {
                writeTerminalLog('Bu kategoride örnek proje bulunmuyor.', 'info');
                return;
            }
            if (exhausted) {
                writeTerminalLog('Bu kategorideki tüm örnekler gösterildi, baştan başlanıyor.', 'info');
            }

            projectToRender = project;
            writeTerminalLog(`Örnek seçildi: "${project.title}" (${seenProjectIds.length} örnek görüldü)`, 'info');
        }

        await sleep(250);   // the log is otherwise gone before it can be read
        terminalContainer.style.display = 'none';

        loadProjectIntoView(projectToRender, false, isExample);
    }

    // ==========================================
    // STEP 2: GENERATE ARCHITECTURE & SECURITY
    // ==========================================
    async function startStep2Simulation() {
        if (!currentProject) return;

        setButtonBusy(btnTriggerStep2, true);
        try {
            await runStep2();
        } catch (err) {
            console.error('Aetheria: mimari üretimi başarısız', err);
            writeTerminalLog(`Beklenmeyen hata: ${err.message || err}. Lütfen tekrar deneyin.`, 'warning');
        } finally {
            setButtonBusy(btnTriggerStep2, false);
        }
    }

    async function runStep2() {
        terminalContainer.style.display = 'block';
        terminalBody.innerHTML = '';

        writeTerminalLog(`"${currentProject.title}" için Derin Mimari Scanner çalıştırılıyor...`, 'agent');
        await sleep(350);
        writeTerminalLog('Clean Architecture katmanları ve mikroservis sınırları çiziliyor...', 'info');
        await sleep(400);
        writeTerminalLog('Sistem akış diyagramı düğümleri (Interactive Diagram Nodes) oluşturuluyor...', 'info');
        await sleep(400);
        writeTerminalLog('Veritabanı varlık ilişkileri ve storage katmanları optimizasyonu...', 'info');
        await sleep(400);
        writeTerminalLog('Tehdit Modellemesi (OWASP Top 10 & Zero-Trust) yürütülüyor...', 'info');
        await sleep(400);
        writeTerminalLog('Mimari ve Güvenlik Çözüm Raporu Başarıyla Tamamlandı!', 'success');
        await sleep(300);

        terminalContainer.style.display = 'none';

        renderStep2Content();
        setStep2Visibility(true);

        setTimeout(() => {
            step2Container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    }

    // Event Listeners
    btnGenerateProject.addEventListener('click', startStep1Simulation);
    btnTriggerStep2.addEventListener('click', startStep2Simulation);
});
