/* ==========================================================================
   Aetheria.ai - Application Logic & AI Agent Simulation
   Features Implemented:
   - 1: Visual Architecture Diagram Nodes
   - 2: FREE Gemini 2.5 Flash Live API Integration (with strict client-side rate limits & token caps)
   - 3: Export Project Blueprint (.md)
   - 4: Category & Domain Filters
   - 5: Metadata Metrics Grid
   - NEW: Shared Community Project Pool
   - SECURITY: Rate Limiter & Token Cap Guardrail (Open Source Protection)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
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
    let lastProjectId = null;
    let activeCategoryFilter = 'all';

    // SECURITY & RATE LIMITING STATE (Open-Source Protection)
    const RATE_LIMIT_COOLDOWN_MS = 20000; // 20 seconds minimum delay between Gemini API calls
    const MAX_CALLS_PER_HOUR = 15; // Max 15 Gemini API calls per hour per browser

    // Gemini request configuration
    const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite']; // primary, then fallback
    const MAX_OUTPUT_TOKENS = 8192; // must fit the full blueprint JSON (see requestBody below)
    const GEMINI_TIMEOUT_MS = 45000;

    // Diagram node types that have a matching .node-* rule in style.css
    const NODE_TYPES = ['source', 'service', 'ai', 'storage', 'client'];

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

    // Helper: escape every HTML-significant character so untrusted text can never
    // introduce markup when it is later assigned to innerHTML.
    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Helper: Simple Markdown Formatter.
    // Project content is untrusted — it comes from the Gemini API or from a
    // localStorage pool that anyone with devtools access can edit. The input is
    // escaped first, so the only tags in the output are the ones produced below.
    function parseMarkdown(text) {
        if (!text) return '';
        let html = escapeHtml(text)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^[•\*] (.*$)/gm, '<li>$1</li>');

        html = html.replace(/(<li>[\s\S]*?<\/li>)/g, (match) => `<ul>${match}</ul>`);
        html = html.replace(/<\/ul>\s*<ul>/g, '');
        return html;
    }

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

    // Rate Limiter Enforcement Check
    function checkRateLimits() {
        const now = Date.now();
        const timeSinceLastCall = now - lastGeminiCallTimestamp;

        // 1. Cooldown Check (20 seconds minimum interval)
        if (timeSinceLastCall < RATE_LIMIT_COOLDOWN_MS) {
            const secondsLeft = Math.ceil((RATE_LIMIT_COOLDOWN_MS - timeSinceLastCall) / 1000);
            return { allowed: false, reason: `Güvenlik & Kota Koruması: Lütfen ${secondsLeft} saniye bekleyin.` };
        }

        // 2. Hourly Limit Check (Max 15 per hour)
        const oneHourAgo = now - 3600000;
        hourlyCallHistory = hourlyCallHistory.filter(ts => ts > oneHourAgo);
        localStorage.setItem('aetheria_gemini_call_history', JSON.stringify(hourlyCallHistory));

        if (hourlyCallHistory.length >= MAX_CALLS_PER_HOUR) {
            return { allowed: false, reason: `Saatlik Gemini API limitine (15 sorgu/saat) ulaşıldı. Otomatik dahili motora geçiliyor.` };
        }

        return { allowed: true };
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
    function loadProjectIntoView(proj, revealStep2 = false) {
        currentProject = proj;
        
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

    // Pick random project from built-in database.
    // De-duplication tracks the project id rather than an index: indices belong to the
    // *filtered* list, so after a filter change the remembered index pointed at an
    // unrelated project and suppressed the wrong result.
    function getRandomProject() {
        const projects = getFilteredProjects();
        if (projects.length === 0) return null;

        const pickable = projects.length > 1
            ? projects.filter(p => p.id !== lastProjectId)
            : projects;

        const picked = pickable[Math.floor(Math.random() * pickable.length)];
        lastProjectId = picked.id;
        return picked;
    }

    // Validate the shape of a project object coming from an untrusted source (Gemini,
    // or a hand-edited localStorage pool) before it reaches the renderer.
    function validateProjectShape(obj) {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
            return 'Yanıt bir proje nesnesi değil';
        }
        for (const field of ['title', 'tagline', 'category']) {
            if (typeof obj[field] !== 'string' || !obj[field].trim()) {
                return `Zorunlu alan eksik veya boş: ${field}`;
            }
        }
        if (!obj.step1 || typeof obj.step1 !== 'object') return 'step1 bloğu eksik';
        for (const field of ['marketGap', 'description']) {
            if (typeof obj.step1[field] !== 'string' || !obj.step1[field].trim()) {
                return `Zorunlu alan eksik veya boş: step1.${field}`;
            }
        }
        return null;
    }

    // Fill in the optional parts of a validated project so the renderer never sees
    // half-built objects, and guarantee a unique id for pool de-duplication.
    function normalizeProject(obj) {
        const p = { ...obj };
        p.id = (typeof p.id === 'string' && p.id.trim()) ? p.id.trim() : `gemini-${Date.now()}`;
        p.categoryKey = typeof p.categoryKey === 'string' ? p.categoryKey : activeCategoryFilter;
        p.meta = (p.meta && typeof p.meta === 'object') ? p.meta : {};
        p.diagramNodes = Array.isArray(p.diagramNodes)
            ? p.diagramNodes.filter(n => n && typeof n === 'object' && typeof n.name === 'string')
            : [];
        p.step1.tags = Array.isArray(p.step1.tags)
            ? p.step1.tags.filter(tag => typeof tag === 'string')
            : [];

        // step2 is optional: drop it entirely unless both halves are present, so the
        // two-stage flow does not offer an empty report.
        const s2 = p.step2;
        const hasStep2 = s2 && typeof s2 === 'object'
            && typeof s2.architecture === 'string' && s2.architecture.trim()
            && typeof s2.security === 'string' && s2.security.trim();
        if (!hasStep2) delete p.step2;

        return p;
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

    // GEMINI LIVE API CALL WITH RATE LIMIT & TOKEN CAP GUARDRAILS
    async function generateProjectViaGeminiApi() {
        if (!geminiApiKey) throw new Error('API Key girilmedi');

        // Check Rate Limiter
        const limitCheck = checkRateLimits();
        if (!limitCheck.allowed) {
            throw new Error(limitCheck.reason);
        }

        // Count the attempt *before* firing it. Recording only successful calls meant a
        // rejected key or a 429 storm consumed neither the cooldown nor the hourly
        // budget, which let a broken configuration hammer the endpoint unthrottled.
        recordGeminiCall();

        const promptText = `Sen Aetheria.ai adında otonom bir yazılım mimarı yapay zeka ajanıısın. Kullanıcı için son derece özgün, yenilikçi ve derinlemesine hazırlanmış bir yazılım projesi üret. Kategori tercihi: ${activeCategoryFilter}.
Yanıtını kesinlikle geçerli bir JSON formatında döndür. JSON yapısı tam olarak şu şekilde olmalı:
{
  "id": "gemini-${Date.now()}",
  "title": "Proje Adı",
  "tagline": "Etkileyici Proje Sloganı",
  "category": "Kategori İsmi",
  "categoryKey": "${activeCategoryFilter}",
  "meta": {
     "difficulty": "İleri Düzey veya Orta Düzey",
     "mvpTime": "6 Hafta",
     "monetization": "B2B SaaS / Usage-Based",
     "opportunityScore": "%97 Fırsat Skoru"
  },
  "diagramNodes": [
     { "id": 1, "name": "Bileşen 1", "type": "source", "sub": "Açıklama" },
     { "id": 2, "name": "Bileşen 2", "type": "service", "sub": "Açıklama" },
     { "id": 3, "name": "Bileşen 3", "type": "ai", "sub": "Açıklama" },
     { "id": 4, "name": "Bileşen 4", "type": "storage", "sub": "Açıklama" },
     { "id": 5, "name": "Bileşen 5", "type": "client", "sub": "Açıklama" }
  ],
  "step1": {
     "marketGap": "Alandaki açık (detaylı pazar problemi, mevcut çözümlerin eksikleri, fırsat)",
     "description": "Detaylı proje açıklaması ve maddeler halinde özellikler",
     "tags": ["Python", "React", "AI", "Cloud"]
  },
  "step2": {
     "architecture": "Sistem mimarisi, Clean Architecture katmanları, veritabanı tasarımı",
     "security": "Güvenlik önlemleri, OWASP standartları, şifreleme ve yetkilendirme"
  }
}`;

        // QUOTA GUARDRAIL: the output cap has to fit the whole JSON blueprint above.
        // 1000 tokens truncated every single response mid-JSON, so live mode could
        // never succeed. Thinking is disabled explicitly because on 2.5 models
        // reasoning tokens are billed against maxOutputTokens too.
        const requestBody = {
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
                responseMimeType: 'application/json',
                maxOutputTokens: MAX_OUTPUT_TOKENS,
                temperature: 0.7,
                thinkingConfig: { thinkingBudget: 0 }
            }
        };

        const data = await requestGeminiCompletion(requestBody);

        const candidate = data && Array.isArray(data.candidates) ? data.candidates[0] : null;
        if (!candidate) {
            const blockReason = data && data.promptFeedback && data.promptFeedback.blockReason;
            throw new Error(blockReason
                ? `İstek güvenlik filtresine takıldı (${blockReason})`
                : 'Gemini boş yanıt döndürdü');
        }
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            throw new Error(`Yanıt tamamlanamadı (finishReason: ${candidate.finishReason})`);
        }

        const parts = candidate.content && Array.isArray(candidate.content.parts)
            ? candidate.content.parts
            : [];
        const jsonText = parts.map(part => (part && typeof part.text === 'string' ? part.text : '')).join('');
        if (!jsonText.trim()) throw new Error('Gemini yanıtında metin bulunamadı');

        let projectObj;
        try {
            projectObj = JSON.parse(jsonText);
        } catch {
            throw new Error('Gemini geçerli JSON döndürmedi');
        }

        const shapeError = validateProjectShape(projectObj);
        if (shapeError) throw new Error(`Geçersiz proje yanıtı: ${shapeError}`);

        return normalizeProject(projectObj);
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

                if (response.ok) return await response.json();

                lastError = new Error(`${model}: ${await describeHttpError(response)}`);

                // 4xx other than 429 means the request itself is wrong (bad key, bad
                // body); retrying another model would fail identically.
                if (response.status >= 400 && response.status < 500 && response.status !== 429) {
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
            const type = NODE_TYPES.includes(node.type) ? node.type : 'service';
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

        const meta = p.meta || {};
        
        let markdownDoc = `# ${p.title} — Technical Blueprint & Market Analysis\n\n`;
        markdownDoc += `> **Slogan**: ${p.tagline}\n`;
        markdownDoc += `> **Kategori**: ${p.category}\n`;
        markdownDoc += `> **Fırsat Skoru**: ${meta.opportunityScore || 'N/A'}\n`;
        markdownDoc += `> **Zorluk Düzeyi**: ${meta.difficulty || 'N/A'}\n`;
        markdownDoc += `> **Tahmini MVP Süresi**: ${meta.mvpTime || 'N/A'}\n`;
        markdownDoc += `> **Gelir Modeli**: ${meta.monetization || 'N/A'}\n\n`;
        markdownDoc += `---\n\n`;
        markdownDoc += `## 1. ALANDAKİ AÇIK (Pazar Problemi & Fırsat)\n\n${p.step1 ? p.step1.marketGap : ''}\n\n`;
        markdownDoc += `---\n\n`;
        markdownDoc += `## 2. DETAYLI PROJE AÇIKLAMASI & ÖZELLİKLER\n\n${p.step1 ? p.step1.description : ''}\n\n`;
        markdownDoc += `---\n\n`;
        
        if (p.step2) {
            markdownDoc += `## 3. KOD MİMARİSİ VE SİSTEM KATMANLARI\n\n${p.step2.architecture}\n\n`;
            markdownDoc += `---\n\n`;
            markdownDoc += `## 4. GÜVENLİK YAPISI & RISK ÖNLEME TEDBİRLERİ\n\n${p.step2.security}\n\n`;
        }

        markdownDoc += `---\n*Generated by Aetheria.ai (Aetheria Agent)*\n`;

        const blob = new Blob([markdownDoc], { type: 'text/markdown;charset=utf-8;' });
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

        writeTerminalLog('Aetheria AI Agent v2.4 başlatılıyor...', 'agent');
        await sleep(300);

        let projectToRender = null;

        // Try Gemini Live API if enabled
        if (useGeminiLiveMode && geminiApiKey) {
            try {
                writeTerminalLog('Gemini 2.5 Flash API bağlandı. Canlı yapay zeka pazar taraması yapılıyor...', 'agent');
                await sleep(400);
                writeTerminalLog(`Filtre Katmanı: "${activeCategoryFilter.toUpperCase()}" taranıyor...`, 'info');
                await sleep(500);

                projectToRender = await generateProjectViaGeminiApi();
                writeTerminalLog('Gemini AI canlı proje mimarisi başarıyla oluşturuldu!', 'success');
                await sleep(300);
            } catch (err) {
                console.warn('Gemini API Security Notice:', err);
                writeTerminalLog(`Güvenlik & Kota Koruması: ${err.message || 'Limit aşıldı'}.`, 'warning');
                writeTerminalLog('Kota korundu. Dahili Ajan veritabanına geçiş yapılıyor...', 'info');
                await sleep(400);
            }
        }

        // Fallback to Built-in Database
        if (!projectToRender) {
            writeTerminalLog('Küresel SaaS & GitHub Trend Veritabanı bağlandı.', 'info');
            await sleep(400);
            writeTerminalLog(`Filtre Katmanı: "${activeCategoryFilter.toUpperCase()}" taranıyor...`, 'info');
            await sleep(400);
            
            projectToRender = getRandomProject();

            if (!projectToRender) {
                writeTerminalLog('Bu kategoride henüz proje bulunamadı.', 'info');
                return;
            }

            writeTerminalLog(`Sektör Tespit Edildi: "${projectToRender.category}"`, 'info');
            await sleep(400);
            writeTerminalLog('Rekabet doyum oranı ve kullanıcı şikayetleri analiz ediliyor...', 'info');
            await sleep(400);
            writeTerminalLog('Çözülmemiş yüksek potansiyelli proje fırsatı yakalandı!', 'success');
            await sleep(300);
        }

        writeTerminalLog(`Proje Adı: "${projectToRender.title}" oluşturuluyor...`, 'agent');
        await sleep(400);

        terminalContainer.style.display = 'none';
        
        // Populate & Render Step 1
        loadProjectIntoView(projectToRender);
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
