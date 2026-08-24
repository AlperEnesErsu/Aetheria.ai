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
        safeEvidenceStatus,
        pickUnseenProject,
        pickConstraintCombo,
        selectFreshIdea,
        buildIdeationPrompt,
        CATEGORY_LABELS,
        SCOPE_PRESETS,
        evaluateRateLimit,
        buildBlueprintMarkdown,
        PROVIDERS,
        DEFAULT_PROVIDER,
        getProvider,
        isKnownProvider,
        buildProviderRequest,
        extractProviderText,
        parseJsonResponse,
        readUsageTokens,
        JSON_ONLY_SUFFIX,
        IDEATION_ANGLES,
        COMPARISON_METHODS,
        SCORING_CRITERIA,
        SOURCE_MATERIAL_MAX_CHARS,
        normalizeWeights,
        pickWeightedIdea,
        clampSourceMaterial,
        buildDetailedIdeationPrompt,
        EVIDENCE_SOURCES,
        EVIDENCE_TIMEOUT_MS,
        VERIFY_TOP_K,
        buildEvidenceQueries,
        buildEvidenceRequest,
        parseEvidenceResponse,
        interpretEvidence,
        applyVerificationBoost,
        scoreIdeas,
        IDEA_TEXT_MAX_CHARS,
        clampIdeaText,
        buildAssessmentPrompt,
        splitAssessment,
        normalizeAssessment,
        buildAssessmentMarkdown
    } = window.AetheriaCore;

    // DOM Elements
    const btnGenerateProject = document.getElementById('btnGenerateProject');
    const btnTriggerStep2 = document.getElementById('btnTriggerStep2');
    const btnExportBlueprint = document.getElementById('btnExportBlueprint');
    const btnCopyBlueprint = document.getElementById('btnCopyBlueprint');
    const copyToast = document.getElementById('copyToast');
    const btnSaveProject = document.getElementById('btnSaveProject');
    const terminalContainer = document.getElementById('terminalContainer');
    const terminalBody = document.getElementById('terminalBody');
    const resultsWrapper = document.getElementById('resultsWrapper');
    const step2Container = document.getElementById('step2Container');
    const step2TriggerWrapper = document.getElementById('step2TriggerWrapper');
    const originBadge = document.getElementById('originBadge');
    const exampleNotice = document.getElementById('exampleNotice');
    const btnNoticeSetKey = document.getElementById('btnNoticeSetKey');
    const storageWarning = document.getElementById('storageWarning');
    const storageWarningText = document.getElementById('storageWarningText');
    const btnCloseStorageWarning = document.getElementById('btnCloseStorageWarning');
    const keyHint = document.getElementById('keyHint');
    const btnHeroSetKey = document.getElementById('btnHeroSetKey');
    const generateButtonLabel = document.getElementById('generateButtonLabel');
    const keyStatus = document.getElementById('keyStatus');
    const rememberKeyToggle = document.getElementById('rememberKeyToggle');
    const btnForgetKey = document.getElementById('btnForgetKey');
    const scopeSelector = document.getElementById('scopeSelector');
    const btnShowSample = document.getElementById('btnShowSample');
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
    const providerSelect = document.getElementById('providerSelect');
    const providerCostNote = document.getElementById('providerCostNote');
    const providerConsoleLink = document.getElementById('providerConsoleLink');
    const keyFieldLabel = document.getElementById('keyFieldLabel');

    // Result DOM Elements
    const projectCategory = document.getElementById('projectCategory');
    const projectScopeBadge = document.getElementById('projectScopeBadge');
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

    // Both selections survive a reload. They did not before, and the scope picker
    // made that obvious: it sits at the top of the page as a deliberate choice, and
    // a refresh silently reset it to "Tümü" while the user assumed it still held.
    // Values are validated on read — a hand-edited or stale entry must not leave a
    // filter pointing at a category or scope that no longer exists.
    let activeCategoryFilter = readStoredChoice(
        'aetheria_category_filter', 'all', id => id === 'all' || Object.hasOwn(CATEGORY_LABELS, id));
    let activeScopeFilter = readStoredChoice(
        'aetheria_scope_filter', 'all', id => Object.hasOwn(SCOPE_PRESETS, id));

    // Declared here rather than next to the rest of the panel state because
    // updateKeyHint runs during boot and now reads it: a `let` read from above its
    // own declaration throws, so the app died before painting anything.
    const MODES = ['quick', 'detailed', 'assess'];
    let activeMode = readStoredChoice('aetheria_mode', 'quick', m => MODES.includes(m));

    function readStoredChoice(key, fallback, isValid) {
        try {
            const stored = localStorage.getItem(key);
            return stored && isValid(stored) ? stored : fallback;
        } catch {
            return fallback;   // storage blocked entirely
        }
    }

    // Ids already shown to this user. Persisted so variety survives a reload —
    // without it, every refresh started the example rotation from scratch.
    let seenProjectIds = readJson('aetheria_seen_projects', []);

    // SECURITY & RATE LIMITING STATE (Open-Source Protection)
    const RATE_LIMIT_COOLDOWN_MS = 20000; // 20 seconds minimum delay between Gemini API calls
    const MAX_CALLS_PER_HOUR = 15; // Max 15 Gemini API calls per hour per browser

    // Request configuration. Endpoints, model lists and body shapes are per
    // provider and live in core.js (PROVIDERS); only the budgets are shared.
    const MAX_OUTPUT_TOKENS = 8192; // must fit the full blueprint JSON
    const REQUEST_TIMEOUT_MS = 45000;

    // Pass 1 asks for a batch of one-liners; eight gives the local filter room to
    // discard repeats without needing a second round trip.
    const IDEA_BATCH_SIZE = 8;
    const IDEA_MAX_TOKENS = 1024;

    // Detailed candidates carry a comparison block, search terms, a quote and four
    // scores each, so the quick-mode ceiling truncates the JSON mid-array.
    //
    // 2048 was a guess and it was wrong. Measured against gemini-flash-latest on
    // 18 Aug 2026, eight candidates in this schema come back around 2400 output
    // tokens and the response died on MAX_TOKENS before the array closed, taking
    // the whole generation with it. Turkish also tokenises worse per character
    // than the English these budgets are usually sized against.
    const DETAILED_IDEA_MAX_TOKENS = 4096;

    // Fewer candidates than quick mode, and not to save money on the ceiling.
    // A quick-mode candidate is a title and one line, roughly 40 tokens. A
    // detailed one carries a four-field comparison, search terms, a quote and
    // four scores — closer to 300. Only VERIFY_TOP_K of them are ever measured,
    // so candidates seven and eight are paying full price for a place they
    // cannot win from. Six still leaves the weights a real choice to make.
    const DETAILED_BATCH_SIZE = 6;

    // One idea in, one assessment out — no candidate array to fit. The ceiling is
    // still well above the schema because the four prose fields (restatement,
    // structural reason, how-to-check, plus up to four openings and three risks)
    // are the whole product here, and truncating the risk list would quietly turn
    // an assessment back into a pitch.
    const ASSESSMENT_MAX_TOKENS = 2048;

    let lastGeminiCallTimestamp = Number(localStorage.getItem('aetheria_last_gemini_call') || 0);
    let hourlyCallHistory = readJson('aetheria_gemini_call_history', []);

    // Shared Community Pool State Management
    // readJson only enforces shape when the fallback is itself an array, and this
    // call passed null to distinguish "never saved" from "saved empty" — so the one
    // value that most needed the guard was the one that skipped it. A hand-edited
    // or corrupt entry like {"a":1} is truthy, survived the check below, and then
    // every pool operation failed on it: the drawer rendered nothing, saving did
    // nothing, and generation aborted, all without telling the user why.
    // The pool starts empty. It used to be seeded with the first three showcase
    // entries, which meant "kaydettiklerim" opened with three projects the user had
    // never saved — and made the app look like it ships a catalogue. The pool holds
    // what the user chose to keep, and nothing else.
    let communityPool = readProjectArray('aetheria_community_pool') || [];

    // The key can live in localStorage (survives restarts) or sessionStorage (gone
    // when the tab closes). Session storage is the safer default on a shared or
    // borrowed machine, so the choice is the user's and is remembered.
    //
    // Keys are stored per provider. Sharing one slot would mean switching vendors
    // silently discarded the key for the previous one, and a user with both a
    // Gemini and a Claude key would have to re-paste on every switch.
    const LEGACY_KEY_NAME = 'aetheria_gemini_key';
    const keyNameFor = providerId => `aetheria_key_${providerId}`;

    let rememberKey = localStorage.getItem('aetheria_remember_key') !== 'false';
    let activeProvider = readActiveProvider();

    // Kept for the security tests and for anything that still reads a single name;
    // it always points at the provider currently selected.
    let KEY_NAME = keyNameFor(activeProvider);

    migrateLegacyKey();

    let geminiApiKey = readKeyFromStorage();
    let useGeminiLiveMode = localStorage.getItem('aetheria_use_gemini') === 'true' && Boolean(geminiApiKey);

    function readActiveProvider() {
        const stored = localStorage.getItem('aetheria_provider');
        // isKnownProvider rather than a truthiness check: PROVIDERS['constructor']
        // resolves up the prototype chain and would pass.
        if (!isKnownProvider(stored) || PROVIDERS[stored].browserBlocked) return DEFAULT_PROVIDER;
        return stored;
    }

    // Anyone who used the app before it spoke to more than one vendor has a key
    // under the old single-slot name. Move it once rather than making them paste
    // it again after an update they did not ask for.
    function migrateLegacyKey() {
        try {
            for (const store of [sessionStorage, localStorage]) {
                const legacy = store.getItem(LEGACY_KEY_NAME);
                if (!legacy) continue;
                if (!store.getItem(keyNameFor('gemini'))) {
                    store.setItem(keyNameFor('gemini'), legacy);
                }
                store.removeItem(LEGACY_KEY_NAME);
            }
        } catch { /* storage blocked; nothing to migrate */ }
    }

    function readKeyFromStorage() {
        try {
            return sessionStorage.getItem(KEY_NAME) || localStorage.getItem(KEY_NAME) || '';
        } catch {
            return '';   // storage blocked entirely
        }
    }

    // Initialize UI Settings.
    // The key deliberately does NOT go back into the input: writing it into the DOM
    // on every load exposed it to devtools, screen shares and extensions for no
    // benefit. The field stays empty and only says that a key is stored.
    if (useGeminiApiToggle) useGeminiApiToggle.checked = useGeminiLiveMode;
    if (rememberKeyToggle) rememberKeyToggle.checked = rememberKey;
    buildProviderOptions();
    updateProviderUi();
    updateGeminiBadgeStatus();
    updateKeyHint();
    updateSavedBadge();

    // Helper: Sleep Delay
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // A corrupt or hand-edited value used to throw straight out of JSON.parse during
    // start-up, taking the whole app with it — a single bad character in storage left
    // the user with a blank page and no way back.
    function readJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (raw === null) return fallback;
            const parsed = JSON.parse(raw);
            // Shape matters as much as parseability: a stored object where an array is
            // expected would fail later, further from the cause.
            if (Array.isArray(fallback) && !Array.isArray(parsed)) return fallback;
            return parsed;
        } catch (err) {
            console.warn(`localStorage okunamadı (${key}), varsayılana dönülüyor:`, err);
            return fallback;
        }
    }

    // Returns a usable array of project-shaped entries, or null when nothing has
    // been stored yet — the caller seeds the pool in that case. Anything stored but
    // unusable (an object, a number, a string) is treated as absent rather than
    // handed on: the alternative is a value that passes a truthiness check and then
    // breaks every method the rest of the app calls on it.
    //
    // Entries are filtered too, not just the container. A pool of [1,2,3] survives
    // every array method and then renders blank cards with undefined ids.
    function readProjectArray(key) {
        const raw = readJson(key, null);
        if (!Array.isArray(raw)) {
            if (raw !== null && raw !== undefined) {
                console.warn(`localStorage bozuk (${key}): dizi bekleniyordu, alınan:`, typeof raw);
            }
            return null;
        }
        return raw.filter(entry => entry && typeof entry === 'object' && entry.id !== undefined);
    }

    // Every write went straight to localStorage, which throws once the origin's
    // quota is full or when the browser is in a mode that blocks storage. That
    // surfaced as a thrown exception mid-save — the pool looked updated on screen
    // while nothing had persisted. Writes now report success so callers can decide
    // whether the user needs to hear about it.
    function persist(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (err) {
            console.warn(`localStorage yazılamadı (${key}):`, err);
            return false;
        }
    }

    // Only for writes the user would notice losing. Background bookkeeping (seen
    // ids, rate-limit counters) degrades quietly on purpose — an alert about a
    // counter would be noise.
    function persistOrWarn(key, value, whatWasLost) {
        if (persist(key, value)) return true;
        showStorageWarning(whatWasLost);
        return false;
    }

    function showStorageWarning(whatWasLost) {
        storageWarningText.textContent =
            `${whatWasLost} kaydedilemedi — tarayıcı depolama alanı dolu veya engellenmiş olabilir. ` +
            `Havuzdan birkaç projeyi çıkarmayı deneyin; raporu .md olarak indirmek her zaman çalışır.`;
        storageWarning.classList.add('visible');
    }

    // Helper: single place that owns the disabled/opacity pair, so no early return can
    // leave a button stuck in its busy state
    function setButtonBusy(button, busy) {
        button.disabled = busy;
        button.style.opacity = busy ? '0.7' : '1';
        button.setAttribute('aria-busy', busy ? 'true' : 'false');
    }

    // Strip the live key and anything shaped like a Google API key out of text that
    // is about to be displayed. Users paste terminal output into bug reports.
    function redactSecrets(text) {
        let out = String(text);
        if (geminiApiKey && geminiApiKey.length > 8) {
            out = out.split(geminiApiKey).join('[ANAHTAR GİZLENDİ]');
        }
        // Belt and braces: a key can appear in an error body without matching the
        // one currently in memory (a stale paste, a second provider). One pattern
        // per vendor key format — Google's AIza..., Anthropic's sk-ant-..., and
        // OpenAI's sk-... (listed last so the longer Anthropic prefix wins).
        return out
            .replace(/AIza[0-9A-Za-z_-]{10,}/g, '[ANAHTAR GİZLENDİ]')
            .replace(/sk-ant-[0-9A-Za-z_-]{10,}/g, '[ANAHTAR GİZLENDİ]')
            .replace(/sk-[0-9A-Za-z_-]{20,}/g, '[ANAHTAR GİZLENDİ]');
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
            // Was [SECURITY GUARD]. None of the eleven callers is a security event —
            // they are a failed generation, an exhausted idea batch, an unreadable
            // file, a measurement that refutes its claim. The label named something
            // that was not happening, which is the habit the rest of this log dropped.
            statusTag += ` <span class="status-info" style="color: var(--accent-warning);">[UYARI]</span>`;
        } else {
            statusTag += ` <span class="status-info">[SCAN]</span>`;
        }

        // `message` can carry a raw upstream error body (see describeHttpError), so it
        // is escaped before it becomes markup — and redacted first, in case an error
        // ever echoes the key back. Defence in depth: nothing today is known to do
        // that, but a log line is the easiest place for a secret to end up in a
        // screenshot or a pasted bug report.
        line.innerHTML = `${statusTag} <span>${escapeHtml(redactSecrets(message))}</span>`;
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
        persist('aetheria_gemini_call_history', JSON.stringify(hourlyCallHistory));

        return verdict;
    }

    // Record Gemini Call Timestamp for rate limiting
    function recordGeminiCall() {
        const now = Date.now();
        lastGeminiCallTimestamp = now;
        hourlyCallHistory.push(now);

        persist('aetheria_last_gemini_call', now.toString());
        persist('aetheria_gemini_call_history', JSON.stringify(hourlyCallHistory));
    }

    // The key was only reachable through a small header badge, so a first-time
    // visitor pressed the main button, got an example, and never learned that real
    // generation was one free key away. The hint sits under that button and states
    // which mode is active.
    function updateKeyHint() {
        const live = useGeminiLiveMode && geminiApiKey;

        keyHint.classList.toggle('is-live', Boolean(live));
        // The label does not change with key state: the button does one thing per
        // mode. "PROJE BUL" described looking something up, which is what the
        // button used to do without a key and no longer does. It does change with
        // mode, because in assessment mode it produces no project at all and a
        // button reading "PROJE ÜRET" would be describing the wrong outcome.
        generateButtonLabel.textContent = activeMode === 'assess'
            ? 'FİKRİMİ DEĞERLENDİR'
            : 'PROJE ÜRET';

        if (live) {
            // Naming the provider matters once more than one is possible: it is the
            // only place the user can see which vendor their requests are going to.
            keyHint.innerHTML = '';
            keyHint.append(
                'Yapay zeka üretimi ',
                Object.assign(document.createElement('strong'), { textContent: 'açık' }),
                ` · ${getProvider(activeProvider).label}.`
            );
            return;
        }

        // Rebuilt rather than toggled so the button keeps its listener
        keyHint.innerHTML = '';

        // Someone who already has a key does not need to be told to go get one;
        // pointing them at the signup flow reads as "your key did not save".
        if (geminiApiKey) {
            keyHint.append('Anahtarın kayıtlı ama yapay zeka üretimi kapalı. ');
            keyHint.appendChild(btnHeroSetKey);
            btnHeroSetKey.textContent = 'Ayarlardan aç';
            return;
        }

        keyHint.append(
            'Projeler ',
            Object.assign(document.createElement('strong'), { textContent: 'anahtarınla sıfırdan üretilir' }),
            ', hazır bir listeden seçilmez. '
        );
        btnHeroSetKey.textContent = 'Ücretsiz anahtarını ekle';
        keyHint.appendChild(btnHeroSetKey);
        keyHint.append(' — 30 saniye, kredi kartı gerekmez.');
    }

    // Update Gemini Header Badge Status
    function updateGeminiBadgeStatus() {
        if (useGeminiLiveMode && geminiApiKey) {
            // textContent, not innerHTML: the label now carries provider data.
            btnFeature2Notice.textContent = `⚡ ${getProvider(activeProvider).label} (Korumalı)`;
            btnFeature2Notice.style.borderColor = 'var(--accent-success)';
            btnFeature2Notice.style.color = 'var(--accent-success)';
        } else {
            btnFeature2Notice.innerHTML = `<span>⚡ API Ayarları</span>`;
            btnFeature2Notice.style.borderColor = 'rgba(255, 183, 3, 0.3)';
            btnFeature2Notice.style.color = 'var(--accent-warning)';
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

        persistOrWarn('aetheria_community_pool', JSON.stringify(communityPool), 'Proje havuzu');
        updateSavedBadge();
        updateSaveButtonUI();
        renderSavedProjectsList();
    }

    // Render Shared Community Pool Drawer List
    function renderSavedProjectsList() {
        savedProjectsList.innerHTML = '';
        if (communityPool.length === 0) {
            savedProjectsList.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 2rem 0;">Ortak havuzda henüz kaydedilmiş proje bulunmuyor.</div>`;
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
                persistOrWarn('aetheria_community_pool', JSON.stringify(communityPool), 'Proje havuzu');
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

        // Render Scope Badge.
        //
        // The label comes from SCOPE_PRESETS rather than being written out here.
        // The two copies had already drifted — the card said "Hibrit Kapsam" while
        // the exported blueprint said "Hibrit Pazar" for the very same project.
        if (projectScopeBadge) {
            const scope = currentProject.scope
                || (currentProject.meta && currentProject.meta.scope)
                || 'all';
            const preset = SCOPE_PRESETS[scope] || SCOPE_PRESETS.all;

            projectScopeBadge.textContent = preset.badge;
            projectScopeBadge.className = scope === 'all'
                ? 'project-scope-badge'
                : `project-scope-badge scope-${scope}`;
            projectScopeBadge.style.display = 'inline-flex';
        }

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

        // A project saved from detailed mode carries its comparison with it, so
        // reopening it from the pool brings the measurement back rather than only
        // the prose it produced. Anything without one clears the blocks, so quick
        // mode and the stored sample cannot inherit a previous detailed run.
        if (currentProject.verification) {
            renderVerification(currentProject.verification);
        } else {
            setDetailedBlocksVisible(false);
        }

        // A project card and an assessment of a different idea on screen together
        // would read as an assessment of the project.
        if (assessmentWrapper) assessmentWrapper.classList.remove('visible');

        resultsWrapper.classList.add('visible');
        resultsWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Filter examples by the selected category and scope.
    //
    // Returns the list plus whether the scope was actually honoured. The previous
    // version silently dropped the scope when a bucket was empty, so asking for
    // "Ulusal" could hand back an international project whose own badge said
    // "🌍 Uluslararası" — the card contradicting the filter that produced it, with
    // nothing to explain the gap. Examples are a fallback and the app says so
    // everywhere else; narrowing that quietly fails is not an exception to that.
    function getFilteredProjects() {
        if (typeof PROJECTS_DATABASE === 'undefined' || PROJECTS_DATABASE.length === 0) {
            return { projects: [], scopeHonoured: true, widenedFrom: null };
        }

        const byCategory = activeCategoryFilter === 'all'
            ? PROJECTS_DATABASE
            : PROJECTS_DATABASE.filter(p => p.categoryKey === activeCategoryFilter);

        if (activeScopeFilter === 'all') {
            return { projects: byCategory, scopeHonoured: true, widenedFrom: null };
        }

        const scoped = byCategory.filter(p => p.scope === activeScopeFilter);
        if (scoped.length > 0) {
            return { projects: scoped, scopeHonoured: true, widenedFrom: null };
        }

        return { projects: byCategory, scopeHonoured: false, widenedFrom: activeScopeFilter };
    }

    // Pick an example the user has not seen yet (selection logic lives in core.js).
    // Returns { project, exhausted } so the caller can say when a cycle restarted.
    function getUnseenExample() {
        const filtered = getFilteredProjects();
        const result = pickUnseenProject(filtered.projects, seenProjectIds);

        // Carried up so the terminal can report a widened search instead of the
        // caller having to re-derive it.
        result.scopeHonoured = filtered.scopeHonoured;
        result.widenedFrom = filtered.widenedFrom;
        result.poolSize = filtered.projects.length;

        seenProjectIds = result.seen;
        // Background bookkeeping: if this fails, variety degrades for the session
        // but nothing the user asked for is lost, so no warning is raised.
        persist('aetheria_seen_projects', JSON.stringify(seenProjectIds));

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

        // Google's raw 429 text ("You exceeded your current quota, please check your
        // plan and billing details") reads like a billing problem. On the free tier
        // it is not: nothing is owed, the daily allowance is simply spent. Saying so
        // matters — the alternative is a user who thinks the app just charged them.
        if (response.status === 429) {
            if (activeProvider === 'gemini') {
                // No longer promises examples: the app stopped substituting them,
                // so telling the user they are coming was a leftover from when it did.
                return 'Ücretsiz Gemini kotası doldu. Ücret çıkmaz — kota her gün sıfırlanır.';
            }
            // The paid providers rate-limit by spend and tier, so the same
            // reassurance would be false there.
            return `${getProvider(activeProvider).label} istek sınırına takıldı. ` +
                   'Biraz bekleyip tekrar deneyin.';
        }

        if (response.status === 401 || response.status === 403) {
            return `Anahtar kabul edilmedi (HTTP ${response.status}). ` +
                   `Seçili sağlayıcı: ${getProvider(activeProvider).label}. ` +
                   'Anahtarın bu sağlayıcıya ait olduğundan emin olun.';
        }

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
        recordGeminiCall();

        const combo = pickConstraintCombo(Math.random, activeScopeFilter);
        const categoryLabel = CATEGORY_LABELS[activeCategoryFilter] || 'yazılım';

        onProgress({ phase: 'ideate', combo, scope: activeScopeFilter });
        const ideation = await requestIdeas(categoryLabel, combo, activeScopeFilter);

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
        const expansion = await expandIdea(idea, categoryLabel, combo, activeScopeFilter);

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

        const fromGenerated = readJson('aetheria_seen_titles', []);

        return [...new Set([...fromGenerated, ...fromPool, ...fromExamples])].slice(-40);
    }

    function rememberIdeaTitle(title) {
        const titles = readJson('aetheria_seen_titles', []);
        titles.push(title);
        persist('aetheria_seen_titles', JSON.stringify(titles.slice(-60)));
    }

    // PASS 1 — a short list of one-line ideas. Small output, so this is cheap.
    async function requestIdeas(categoryLabel, combo, scope = 'all') {
        // Prompt text lives in core.js so scripts/gemini-lab.js measures the exact
        // wording the app ships rather than a copy that can drift.
        const prompt = buildIdeationPrompt(categoryLabel, IDEA_BATCH_SIZE, combo, knownIdeaTitles(), scope);

        const result = await requestModelCompletion(prompt, {
            maxTokens: IDEA_MAX_TOKENS,
            temperature: 1.0,   // higher than the expansion pass: this call exists to explore
            label: 'Fikir listesi'
        });

        const parsed = parseJsonResponse(result.text, 'Fikir listesi');
        const ideas = Array.isArray(parsed.ideas) ? parsed.ideas : [];
        if (ideas.length === 0) throw new Error('Fikir listesi boş döndü');

        return { ideas, model: result.model, tokens: result.tokens };
    }

    // PASS 2 — expand the chosen one-liner into the full project schema with Senior Architect depth.
    async function expandIdea(idea, categoryLabel, combo, scope = 'all') {
        let scopeGuidance = '';
        if (scope === 'national') {
            scopeGuidance = `
ÖZEL EKOSİSTEM VE REGÜLASYON GEREKSİNİMLERİ (🇹🇷 ULUSAL / TÜRKİYE ŞARTLARI):
- Türkiye Mevzuatı & Entegrasyonlar: KVKK (Kişisel Verileri Koruma Kanunu), GİB e-Belge (e-Fatura / e-Arşiv / e-İrsaliye), MERNİS / e-Devlet Kapısı, BDDK, TCMB FAST / TR-Karekod, Troy veya İyzico / PayTR yerli fintek altyapıları.
- Hibe & Yarışma Uyumu: TÜBİTAK (1512 BİGG / 1507 KOBİ Ar-Ge), TEKNOFEST yarışma alanları veya KOSGEB Dijitalleşme Fonu.
- Sektörel Acı Noktaları: Deprem/afet koordinasyonu, akıllı tarım / ÇKS / DSİ, yerel KOBİ/esnaf dijitalleşmesi veya MEB/YKS eğitim ihtiyaçları.`;
        } else if (scope === 'international') {
            scopeGuidance = `
ÖZEL EKOSİSTEM VE REGÜLASYON GEREKSİNİMLERİ (🌍 ULUSLARARASI / GLOBAL):
- Global Standartlar & Ödeme: Stripe / LemonSqueezy global faturalama, çoklu para birimi ve global vergilendirme.
- Güvenlik & Uyum: SOC2 Type II, GDPR, CCPA, ISO 27001 kurumsal standartları.
- Dağıtık Altyapı: Multi-region AWS / GCP / Cloudflare Edge dağıtık mikroservis mimarisi.`;
        }

        const prompt = `Sen kıdemli bir Baş Yazılım Mimarı ve CTO'sun (Senior Software Architect & CTO).
Aşağıdaki proje fikrini derin, teknik açıdan sağlam ve detaylı bir teknik şartnameye ve sistem mimarisine dönüştür.${scopeGuidance}

FİKİR ADI: ${idea.title}
FİKİR ÖZETİ: ${idea.summary || ''}
KATEGORİ: ${categoryLabel}
KAPSAM: ${scope === 'national' ? 'Ulusal (Türkiye Odaklı)' : scope === 'international' ? 'Uluslararası (Global)' : 'Tüm Kapsamlar (Hibrit)'}
MİMARİ KISITLAR: ${combo.problemSource} · ${combo.audience} · ${combo.technical} · ${combo.revenue}

Yanıtı tam olarak şu JSON şemasında ver:
{
  "title": "${idea.title}",
  "tagline": "Etkileyici ve teknik derinliği olan tek cümlelik slogan",
  "category": "${categoryLabel}",
  "categoryKey": "${activeCategoryFilter}",
  "scope": "${scope === 'national' ? 'national' : scope === 'international' ? 'international' : 'all'}",
  "meta": {
     "difficulty": "Orta Düzey, İleri Düzey veya Uzman Düzey",
     "mvpTime": "örn. 6 Hafta",
     "monetization": "Net gelir modeli (örn. B2B SaaS Lisansı + TÜBİTAK Hibesi)",
     "opportunityScore": "örn. %96 Fırsat Skoru",
     "scope": "${scope === 'national' ? 'national' : scope === 'international' ? 'international' : 'all'}"
  },
  "diagramNodes": [
     { "id": 1, "name": "Girdi / İstemci", "type": "source", "sub": "Kısa açıklama" },
     { "id": 2, "name": "Servis / Gateway", "type": "service", "sub": "Kısa açıklama" },
     { "id": 3, "name": "AI / İş Mantığı", "type": "ai", "sub": "Kısa açıklama" },
     { "id": 4, "name": "Veritabanı / Depolama", "type": "storage", "sub": "Kısa açıklama" },
     { "id": 5, "name": "Kullanıcı Portali", "type": "client", "sub": "Kısa açıklama" }
  ],
  "step1": {
     "marketGap": "Alandaki yapısal boşluğu, mevcut alternatiflerin neden yetersiz kaldığını ve pazar fırsatını derinlemesine analiz et (en az 320 karakter).",
     "description": "Projenin nasıl çalıştığını, teknik bileşenlerini ve temel yeteneklerini madde madde detaylandır (en az 320 karakter).",
     "tags": ["Teknoloji1", "Teknoloji2", "Teknoloji3", "Teknoloji4"]
  },
  "step2": {
     "architecture": "Clean Architecture katmanlarını (Domain, Application, Infrastructure, Presentation), somut teknoloji yığınını (Backend, Frontend, DB, Message Broker), somut veritabanı şeması tablolarını ve API kontratlarını (REST / gRPC / WS) markdown başlıklarıyla eksiksiz açıkla.",
     "security": "Kimlik doğrulama (Auth & RBAC), veri güvenliği & şifreleme (AES-256, TLS 1.3), OWASP Top 10 tehdit modellemesi ve regülasyon uyumunu (KVKK / GDPR / BDDK / SOC2) markdown başlıklarıyla detaylı açıkla."
  }
}

"type" alanı yalnızca şunlardan biri olabilir: source, service, ai, storage, client.`;

        const result = await requestModelCompletion(prompt, {
            maxTokens: MAX_OUTPUT_TOKENS,
            temperature: 0.7,
            label: 'Proje'
        });

        const projectObj = parseJsonResponse(result.text, 'Proje');

        const shapeError = validateProjectShape(projectObj);
        if (shapeError) throw new Error(`Geçersiz proje yanıtı: ${shapeError}`);

        rememberIdeaTitle(projectObj.title);

        return {
            project: normalizeProject(projectObj, activeCategoryFilter),
            model: result.model,
            tokens: result.tokens
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

    // POST one prompt to the active provider, walking its model list until one
    // answers, and hand back plain text plus the accounting the terminal reports.
    //
    // The credential is attached here and nowhere else. It travels in whichever
    // header the provider declares — never in the query string, so it cannot end up
    // in browser history, referrers or proxy logs.
    async function requestModelCompletion(prompt, options) {
        const opts = options || {};
        const providerId = activeProvider;
        const provider = getProvider(providerId);
        const label = opts.label || 'Yanıt';

        // Providers with no JSON mode need to be told in the prompt instead.
        const finalPrompt = provider.nativeJsonMode ? prompt : prompt + JSON_ONLY_SUFFIX;

        let lastError = null;

        for (const model of provider.models) {
            try {
                const payload = await postToModel(providerId, model, finalPrompt, opts);
                return {
                    text: extractProviderText(providerId, payload, label),
                    model,
                    tokens: readUsageTokens(providerId, payload)
                };
            } catch (err) {
                lastError = err;
                // A hard error (bad key, malformed body, refusal) fails identically
                // on every model in the list, so only keep walking for the two
                // statuses the fallback list exists for.
                if (!err.retryNextModel) throw err;
            }
        }

        throw lastError || new Error(`${provider.label} API Hatası`);
    }

    // Key validation only needs to know whether the credential is accepted, so it
    // checks the HTTP result and deliberately ignores the body. Parsing it would
    // reject a perfectly good key whenever a one-token answer stopped on the length
    // limit rather than on its own.
    async function probeActiveKey() {
        const provider = getProvider(activeProvider);
        let lastError = null;

        for (const model of provider.models) {
            try {
                await postToModel(activeProvider, model, 'ping', { maxTokens: 32 }, true);
                return;
            } catch (err) {
                lastError = err;
                if (!err.retryNextModel) throw err;
            }
        }

        throw lastError || new Error('Anahtar doğrulanamadı');
    }

    // One HTTP round trip against one model. Errors carry `retryNextModel` so the
    // caller can tell "try the next model" from "stop".
    async function postToModel(providerId, model, prompt, opts, dropThinking) {
        const shaped = buildProviderRequest(providerId, model, prompt, opts);

        const body = { ...shaped.body };
        if (dropThinking && body.generationConfig) {
            const { thinkingConfig, ...rest } = body.generationConfig;
            void thinkingConfig;
            body.generationConfig = rest;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

        try {
            const response = await fetch(shaped.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...shaped.extraHeaders,
                    [shaped.authHeader.name]: shaped.authHeader.prefix + geminiApiKey.trim()
                },
                body: JSON.stringify(body),
                signal: controller.signal
            });

            if (response.ok) return response.json();

            // A 400 while a thinking block is present is almost always this model
            // rejecting that field's spelling — it has already changed twice
            // (thinkingBudget -> thinkingLevel) and broke live mode silently each
            // time. Drop the block and retry: a shorter reasoning budget is an
            // optimisation, not a requirement.
            if (response.status === 400 && !dropThinking
                && shaped.body.generationConfig && shaped.body.generationConfig.thinkingConfig) {
                onThinkingConfigRejected();
                return postToModel(providerId, model, prompt, opts, true);
            }

            const error = new Error(`${model}: ${await describeHttpError(response)}`);
            // 404 means this model is gone or ungated for this key; 429 is a quota
            // answer for this model. Both are what the fallback list is for.
            error.retryNextModel = response.status === 404 || response.status === 429
                || response.status >= 500;
            throw error;
        } catch (err) {
            if (err instanceof Error && 'retryNextModel' in err) throw err;

            const wrapped = err.name === 'AbortError'
                ? new Error(`${model}: istek zaman aşımına uğradı (${REQUEST_TIMEOUT_MS / 1000}s)`)
                // A network-level failure on a browser call to Anthropic or OpenAI
                // is usually CORS or an ad blocker, not a bad key. Saying "failed to
                // fetch" alone sent people hunting for a key problem.
                : new Error(`${model}: ${err.message}`);
            wrapped.retryNextModel = true;
            throw wrapped;
        } finally {
            clearTimeout(timeoutId);
        }
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

    let copyToastTimeout = null;
    function showCopyToast(msg = '✓ Markdown panoya kopyalandı!') {
        if (!copyToast) return;
        copyToast.textContent = msg;
        copyToast.classList.add('visible');
        clearTimeout(copyToastTimeout);
        copyToastTimeout = setTimeout(() => {
            copyToast.classList.remove('visible');
        }, 2500);
    }

    async function copyCurrentBlueprintToClipboard() {
        if (!currentProject) return;
        const markdown = buildBlueprintMarkdown(currentProject);
        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(markdown);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = markdown;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }

            if (btnCopyBlueprint) {
                btnCopyBlueprint.classList.add('is-copied');
                const span = btnCopyBlueprint.querySelector('span');
                const prevText = span ? span.textContent : '';
                if (span) span.textContent = '✓ Kopyalandı';
                setTimeout(() => {
                    btnCopyBlueprint.classList.remove('is-copied');
                    if (span) span.textContent = prevText || 'Panoya Kopyala';
                }, 2000);
            }

            showCopyToast('✓ Markdown panoya kopyalandı!');
        } catch (err) {
            console.warn('Panoya kopyalama başarısız:', err);
            showCopyToast('✗ Panoya kopyalanamadı.');
        }
    }

    // Scope & Ecosystem Selector.
    //
    // The markup promises role="radiogroup" with role="radio" children. That is a
    // contract: a screen reader announces "1 of 3" and its user then presses an
    // arrow key, which did nothing — every button was also a separate tab stop,
    // which is not how a radio group behaves. Arrow keys, Home/End and a roving
    // tabindex are what make the promise true.
    if (scopeSelector) {
        const scopeButtons = () => [...scopeSelector.querySelectorAll('.scope-btn')];

        function selectScope(btn, { focus = false } = {}) {
            if (!btn) return;

            for (const b of scopeButtons()) {
                const isActive = b === btn;
                b.classList.toggle('active', isActive);
                b.setAttribute('aria-checked', isActive ? 'true' : 'false');
                // Only the checked radio is tabbable; arrows move within the group.
                b.setAttribute('tabindex', isActive ? '0' : '-1');
            }

            activeScopeFilter = btn.getAttribute('data-scope') || 'all';
            persist('aetheria_scope_filter', activeScopeFilter);

            if (focus) btn.focus();
        }

        scopeSelector.addEventListener('click', (e) => {
            const btn = e.target.closest('.scope-btn');
            if (btn) selectScope(btn);
        });

        scopeSelector.addEventListener('keydown', (e) => {
            const buttons = scopeButtons();
            const current = buttons.indexOf(document.activeElement.closest('.scope-btn'));
            if (current === -1) return;

            let next = null;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                next = buttons[(current + 1) % buttons.length];
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                next = buttons[(current - 1 + buttons.length) % buttons.length];
            } else if (e.key === 'Home') {
                next = buttons[0];
            } else if (e.key === 'End') {
                next = buttons[buttons.length - 1];
            } else {
                return;
            }

            e.preventDefault();   // stop the arrow keys from scrolling the page
            selectScope(next, { focus: true });
        });

        // Restore the stored choice, so a reload does not quietly reset a filter
        // the user believes is still applied.
        const storedBtn = scopeSelector.querySelector(`.scope-btn[data-scope="${activeScopeFilter}"]`);
        selectScope(storedBtn || scopeButtons()[0]);
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
        persist('aetheria_category_filter', activeCategoryFilter);
    });

    // Reflect the stored filter on load, for assistive tech and for the user: the
    // markup hardcodes "Tüm Kategoriler" as active, so without this a restored
    // filter would be applied while the buttons showed something else.
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const isActive = btn.getAttribute('data-category') === activeCategoryFilter;
        btn.setAttribute('type', 'button');
        btn.classList.toggle('active', isActive);
        btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
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
    btnFeature2Notice.addEventListener('click', () => openKeyDialog(btnFeature2Notice));
    btnNoticeSetKey.addEventListener('click', () => openKeyDialog(btnNoticeSetKey));
    btnCloseStorageWarning.addEventListener('click', () => storageWarning.classList.remove('visible'));
    btnHeroSetKey.addEventListener('click', () => openKeyDialog(btnHeroSetKey));

    btnForgetKey.addEventListener('click', forgetGeminiKey);

    // Stale success/error text from a previous visit would be misleading
    function openKeyDialog(trigger) {
        keyStatus.className = 'key-status';
        keyStatus.textContent = '';

        // Never repopulate the field with the real key; say a key exists instead
        geminiApiKeyInput.value = '';
        geminiApiKeyInput.placeholder = geminiApiKey
            ? '•••••••••  kayıtlı anahtar var — değiştirmek için yenisini yapıştır'
            : 'AIzaSy...';

        btnForgetKey.classList.toggle('visible', Boolean(geminiApiKey));
        rememberKeyToggle.checked = rememberKey;

        openDialogOverlay(feature2Modal, trigger, 'flex');
    }
    btnCloseModal.addEventListener('click', closeDialogOverlay);
    feature2Modal.addEventListener('click', (e) => {
        if (e.target === feature2Modal) closeDialogOverlay();
    });

    // Save Gemini Key & Mode Setting
    btnSaveGeminiKey.addEventListener('click', saveGeminiSettings);

    async function saveGeminiSettings() {
        const typed = geminiApiKeyInput.value.trim();
        rememberKey = rememberKeyToggle.checked;
        persist('aetheria_remember_key', rememberKey ? 'true' : 'false');

        // The field starts empty even when a key is stored, so "empty" means "keep
        // what is saved" — not "delete it". Deleting is the explicit button; making
        // an untouched field wipe a working key would be a trap.
        const key = typed || geminiApiKey;

        if (!key) {
            setKeyStatus('Önce bir API anahtarı girin.', 'error');
            return;
        }

        // Scope may have changed even when the key did not
        writeKeyToStorage(key);

        // Kept so a rejected new key does not cost the user a working old one
        const previousKey = geminiApiKey;
        const previousMode = useGeminiLiveMode;

        // Typing a key IS the intent to use it. Previously live mode also required
        // ticking a separate checkbox, so a user who entered a key and pressed save
        // got no generation, no explanation, and a dialog that just closed.
        geminiApiKey = key;
        useGeminiLiveMode = true;
        useGeminiApiToggle.checked = true;

        // Re-saving an unchanged key that already worked would spend a free-tier
        // request to re-learn something we know. The daily allowance is small enough
        // that a wasted call is worth avoiding.
        if (key === previousKey && previousMode) {
            applyGeminiSettings();
            setKeyStatus('Anahtar zaten etkin. Yapay zeka üretimi açık.', 'ok');
            await sleep(900);
            closeDialogOverlay();
            return;
        }

        setKeyStatus('Anahtar doğrulanıyor...', 'checking');
        setButtonBusy(btnSaveGeminiKey, true);

        try {
            // A key that is wrong should be reported here, not discovered on the next
            // generation as a silent fall back to the examples.
            await probeActiveKey();

            writeKeyToStorage(geminiApiKey);
            persist('aetheria_use_gemini', 'true');
            applyGeminiSettings();
            geminiApiKeyInput.value = '';   // do not leave it sitting in the DOM

            setKeyStatus(rememberKey
                ? '✓ Anahtar doğrulandı ve bu tarayıcıda saklandı.'
                : '✓ Anahtar doğrulandı. Yalnızca bu sekme açık kaldığı sürece tutulacak.', 'ok');
            await sleep(1400);          // long enough to read before the dialog closes
            closeDialogOverlay();
        } catch (err) {
            // Nothing is written on failure, so a rejected key leaves both memory and
            // storage exactly as they were — a bad paste cannot cost a working key.
            geminiApiKey = previousKey;
            useGeminiLiveMode = previousMode;
            useGeminiApiToggle.checked = previousMode;
            writeKeyToStorage(previousKey);
            applyGeminiSettings();

            // Dialog stays open so the user can correct what they just typed
            setKeyStatus(`✗ Anahtar doğrulanamadı: ${err.message}`, 'error');
        } finally {
            setButtonBusy(btnSaveGeminiKey, false);
        }
    }

    // One place decides where the key lives, so the two stores can never disagree —
    // a key left behind in the other one would outlive the user's choice.
    function writeKeyToStorage(key) {
        try {
            sessionStorage.removeItem(KEY_NAME);
            localStorage.removeItem(KEY_NAME);
        } catch { /* storage blocked; nothing to clean */ }

        if (!key) return;

        if (rememberKey) {
            persistOrWarn(KEY_NAME, key, 'API anahtarı');
        } else {
            try {
                sessionStorage.setItem(KEY_NAME, key);
            } catch {
                showStorageWarning('API anahtarı');
            }
        }
    }

    // An explicit way out. Clearing the input was the only route before, which is
    // not something a user would guess, and left them no way to remove a key from a
    // machine that is not theirs.
    function forgetGeminiKey() {
        geminiApiKey = '';
        useGeminiLiveMode = false;
        useGeminiApiToggle.checked = false;
        geminiApiKeyInput.value = '';

        writeKeyToStorage('');
        persist('aetheria_use_gemini', 'false');
        applyGeminiSettings();

        // The dialog stays open after deleting, so its controls have to reflect the
        // new state — offering to delete a key that is already gone is confusing.
        btnForgetKey.classList.remove('visible');
        updateProviderUi();   // resets the placeholder to this provider's format

        setKeyStatus(
            `${getProvider(activeProvider).label} anahtarı silindi. Bu tarayıcıda hiçbir kopyası kalmadı.`,
            'ok');
    }

    // ---- Sağlayıcı seçimi ---------------------------------------------------
    // The list is generated from PROVIDERS rather than written into the HTML, so a
    // provider the request layer cannot actually talk to can never appear here.
    function buildProviderOptions() {
        if (!providerSelect) return;
        providerSelect.innerHTML = '';

        for (const id of Object.keys(PROVIDERS)) {
            const provider = PROVIDERS[id];
            const option = document.createElement('option');
            option.value = id;

            if (provider.browserBlocked) {
                // Selectable-but-broken is worse than visibly unavailable: the user
                // would paste a valid key and get a network error that reads like
                // their key was wrong.
                option.disabled = true;
                option.textContent = `${provider.label} — tarayıcıdan kullanılamıyor`;
            } else {
                // Free vs paid is the first thing a user needs to know, so it is in
                // the option text itself and not only in the note underneath.
                option.textContent =
                    `${provider.label}${provider.free ? ' — ücretsiz katman' : ' — ücretli'}`;
            }

            providerSelect.appendChild(option);
        }

        providerSelect.value = activeProvider;
    }

    // Everything in the dialog that depends on which vendor is selected: the label,
    // the placeholder, where to get a key, the cost warning, and whether a key for
    // *this* provider is already stored. Leaving any of these stale was how the old
    // single-provider dialog managed to say one thing and do another.
    function updateProviderUi() {
        const provider = getProvider(activeProvider);

        if (keyFieldLabel) keyFieldLabel.textContent = provider.label;
        if (geminiApiKeyInput) {
            geminiApiKeyInput.placeholder = geminiApiKey
                ? 'Kayıtlı anahtar var — değiştirmek için yeni anahtar girin'
                : provider.keyPlaceholder;
        }
        if (providerConsoleLink) {
            providerConsoleLink.href = provider.consoleUrl;
            providerConsoleLink.textContent = `👉 API anahtarı al (${provider.consoleLabel})`;
        }
        if (providerCostNote) {
            if (provider.browserBlocked) {
                providerCostNote.textContent = `🚫 ${provider.blockedReason}`;
            } else {
                const cost = provider.free
                    ? `💚 ${provider.costNote}`
                    : `💳 ${provider.costNote} Faturayı sen ödersin; kotanı sağlayıcının panelinden sınırla.`;
                providerCostNote.textContent = provider.browserNote
                    ? `${cost}\n⚠️ ${provider.browserNote}`
                    : cost;
            }
        }
        if (btnForgetKey) btnForgetKey.classList.toggle('visible', Boolean(geminiApiKey));
    }

    // Switching providers swaps which stored key is in play. The key for the
    // provider being left is untouched — a user with two keys should not lose one
    // by looking at the other.
    function switchProvider(nextId) {
        if (!isKnownProvider(nextId) || nextId === activeProvider) return;

        // A disabled <option> cannot normally be picked, but the stored preference
        // is also a way in — a provider that becomes unreachable must not strand a
        // returning user on a picker that only produces network errors.
        if (PROVIDERS[nextId].browserBlocked) {
            providerSelect.value = activeProvider;
            setKeyStatus(PROVIDERS[nextId].blockedReason, 'error');
            return;
        }

        activeProvider = nextId;
        KEY_NAME = keyNameFor(activeProvider);
        persist('aetheria_provider', activeProvider);

        geminiApiKey = readKeyFromStorage();
        // Live mode is only meaningful with a key for the provider now selected.
        useGeminiLiveMode = localStorage.getItem('aetheria_use_gemini') === 'true'
            && Boolean(geminiApiKey);
        if (useGeminiApiToggle) useGeminiApiToggle.checked = useGeminiLiveMode;

        updateProviderUi();
        applyGeminiSettings();

        const provider = getProvider(activeProvider);
        setKeyStatus(geminiApiKey
            ? `${provider.label} için kayıtlı anahtar bulundu.`
            : `${provider.label} seçildi. Bu sağlayıcı için henüz anahtar yok.`,
            geminiApiKey ? 'ok' : 'checking');
    }

    if (providerSelect) {
        providerSelect.addEventListener('change', () => switchProvider(providerSelect.value));
    }

    // This checkbox had no listener at all: ticking it did nothing, and saving a key
    // forced it back on regardless. A visible control that silently ignores the user
    // is worse than no control — someone who wanted to keep their key but pause
    // generation had no way to say so, and no way to tell that they had failed.
    if (useGeminiApiToggle) {
        useGeminiApiToggle.addEventListener('change', () => {
            if (useGeminiApiToggle.checked && !geminiApiKey) {
                // Nothing to turn on. Bounce the control back rather than leaving it
                // ticked next to a mode that cannot start.
                useGeminiApiToggle.checked = false;
                setKeyStatus(
                    `Önce ${getProvider(activeProvider).label} için bir anahtar girin.`, 'error');
                return;
            }

            useGeminiLiveMode = useGeminiApiToggle.checked;
            persist('aetheria_use_gemini', useGeminiLiveMode ? 'true' : 'false');
            applyGeminiSettings();

            setKeyStatus(useGeminiLiveMode
                ? 'Yapay zeka üretimi açık.'
                : 'Yapay zeka üretimi kapalı. Anahtarın saklı kalmaya devam ediyor.', 'ok');
        });
    }

    function setKeyStatus(message, kind) {
        keyStatus.textContent = message;
        keyStatus.className = `key-status visible is-${kind}`;
    }

    // Settings changes have to repaint everything that depends on them. The example
    // banner and origin badge were only refreshed inside loadProjectIntoView, so
    // after saving a key the page still announced "bu bir örnek proje" until the
    // next generation.
    function applyGeminiSettings() {
        updateGeminiBadgeStatus();
        updateKeyHint();
        updateProviderUi();
        if (currentProject) setOriginBadge(originBadge.textContent.includes('Örnek'));
    }

    // Export / Copy Blueprint Handlers
    btnExportBlueprint.addEventListener('click', () => exportBlueprintMarkdown());
    if (btnCopyBlueprint) {
        btnCopyBlueprint.addEventListener('click', copyCurrentBlueprintToClipboard);
    }

    // ==========================================
    // STEP 1: GENERATE PROJECT IDEA & MARKET GAP
    // ==========================================
    async function startStep1Simulation() {
        setButtonBusy(btnGenerateProject, true);
        try {
            if (activeMode === 'assess') {
                await runAssessment();
            } else if (activeMode === 'detailed') {
                await runDetailedStep1();
            } else {
                await runStep1();
            }
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
        if (assessmentWrapper) assessmentWrapper.classList.remove('visible');
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
        // Anything this function renders was generated this run; the showcase has
        // its own entry point and never reaches here.
        let projectToRender = null;

        if (useGeminiLiveMode && geminiApiKey) {
            const started = Date.now();

            try {
                // Both passes report as they happen, so the log tracks real progress
                // rather than replaying a fixed script.
                const generated = await generateProjectViaGeminiApi((step) => {
                    if (step.phase === 'ideate') {
                        writeTerminalLog(
                            `Fikir listesi isteniyor · ${IDEA_BATCH_SIZE} fikir · ` +
                            `${getProvider(activeProvider).label} · model: ${getProvider(activeProvider).models[0]}`,
                            'agent');
                        // The scope was already being passed here and then thrown
                        // away, so the one control the user had just set was the
                        // only thing the log did not mention.
                        const scopePreset = SCOPE_PRESETS[step.scope] || SCOPE_PRESETS.all;
                        writeTerminalLog(`Kapsam: ${scopePreset.badge}`, 'info');

                        writeTerminalLog(
                            `Kısıtlar: ${step.combo.problemSource} · ${step.combo.audience} · ` +
                            `${step.combo.technical} · ${step.combo.revenue}`, 'info');

                        if (step.combo.ecosystem) {
                            writeTerminalLog(`Ekosistem açısı: ${step.combo.ecosystem}`, 'info');
                        }
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
            }
        }

        // Generation is the product. When it cannot run, the honest answer is to say
        // why and stop — not to quietly serve a stored project.
        //
        // The examples used to stand in here, which turned the main button into a
        // catalogue lookup for every visitor without a key and made the app look
        // like it suggests from a dataset. They now live behind a separate,
        // explicitly labelled "show me a sample output" action.
        if (!projectToRender) {
            if (!geminiApiKey) {
                writeTerminalLog(
                    'Üretim için bir API anahtarı gerekiyor — bu uygulama projeleri ' +
                    'hazır bir listeden seçmez, anahtarınla sıfırdan üretir.', 'warning');
                writeTerminalLog('Anahtar ekranı açılıyor...', 'info');
                await sleep(1200);
                openKeyDialog(btnFeature2Notice);
                return;
            }

            if (!useGeminiLiveMode) {
                writeTerminalLog(
                    `${getProvider(activeProvider).label} anahtarı kayıtlı ama yapay zeka üretimi kapalı.`,
                    'warning');
                writeTerminalLog('Ayarlardan açabilirsin; ekran açılıyor...', 'info');
                await sleep(1200);
                openKeyDialog(btnFeature2Notice);
                return;
            }

            // Live mode was on and the attempt failed; the reason is already in the
            // log above. Say what to do next instead of substituting a project.
            writeTerminalLog(
                'Bu deneme başarısız oldu. Tekrar deneyebilir veya örnek bir çıktıya bakabilirsin.',
                'info');
            return;
        }

        await sleep(250);   // the log is otherwise gone before it can be read
        terminalContainer.style.display = 'none';

        loadProjectIntoView(projectToRender, false, false);
    }

    // Show one stored sample so a visitor without a key can see what the generated
    // output looks like. Deliberately a separate action from the generate button:
    // when these shared one control, the app behaved like a catalogue and the
    // difference between "produced for you" and "written in advance" disappeared.
    async function showSampleOutput() {
        resultsWrapper.classList.remove('visible');
        step2Container.classList.remove('visible');
        step2Container.style.display = 'none';
        step2TriggerWrapper.style.display = 'none';

        terminalContainer.style.display = 'block';
        terminalBody.innerHTML = '';

        writeTerminalLog('Örnek çıktı gösteriliyor — bu proje şimdi üretilmedi.', 'info');

        const { project, exhausted } = getUnseenExample();

        if (!project) {
            writeTerminalLog('Bu kategori için kayıtlı bir örnek çıktı yok.', 'info');
            return;
        }

        if (exhausted) {
            writeTerminalLog('Bu kategorideki örnekler tekrar başa sarıldı.', 'info');
        }
        writeTerminalLog(`Örnek: "${project.title}"`, 'info');

        await sleep(400);
        terminalContainer.style.display = 'none';

        loadProjectIntoView(project, false, true);
    }

    if (btnShowSample) {
        btnShowSample.addEventListener('click', () => {
            setButtonBusy(btnShowSample, true);
            showSampleOutput().finally(() => setButtonBusy(btnShowSample, false));
        });
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

    // The Aşama 2 payload arrives with the project from Pass 2, so this button
    // only reveals what is already in memory. There is no work here to narrate.
    //
    // It used to open the terminal and type "Tehdit Modellemesi (OWASP Top 10 &
    // Zero-Trust) yürütülüyor..." across 1.85s of sleep() without issuing a
    // single request — the fake-scan pattern docs/generation-design.md §3 struck
    // everywhere else. This was the last place it survived.
    function runStep2() {
        renderStep2Content();
        setStep2Visibility(true);

        setTimeout(() => {
            step2Container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    }

    /* ── Ayrıntılı üretim modu ───────────────────────────────────────────────
       Quick mode is untouched. Everything below runs only when detailed mode is
       the active one. */

    const modeSelector = document.getElementById('modeSelector');
    const detailedPanel = document.getElementById('detailedPanel');
    const sourceMaterialInput = document.getElementById('sourceMaterialInput');
    const sourceMaterialFile = document.getElementById('sourceMaterialFile');
    const sourceMaterialCounter = document.getElementById('sourceMaterialCounter');
    const angleSelect = document.getElementById('angleSelect');
    const methodSelect = document.getElementById('methodSelect');
    const methodBadge = document.getElementById('methodBadge');
    const referenceInput = document.getElementById('referenceInput');
    const referenceLabel = document.getElementById('referenceLabel');
    const weightGrid = document.getElementById('weightGrid');
    const verificationCard = document.getElementById('verificationCard');
    const verificationContent = document.getElementById('verificationContent');
    const evidenceCard = document.getElementById('evidenceCard');
    const evidenceContent = document.getElementById('evidenceContent');
    const scoreBreakdownCard = document.getElementById('scoreBreakdownCard');
    const scoreBreakdownContent = document.getElementById('scoreBreakdownContent');

    const assessPanel = document.getElementById('assessPanel');
    const ideaTextInput = document.getElementById('ideaTextInput');
    const ideaTextCounter = document.getElementById('ideaTextCounter');
    const assessMethodSelect = document.getElementById('assessMethodSelect');
    const assessMethodBadge = document.getElementById('assessMethodBadge');
    const assessReferenceInput = document.getElementById('assessReferenceInput');
    const assessReferenceLabel = document.getElementById('assessReferenceLabel');
    const assessWeightGrid = document.getElementById('assessWeightGrid');
    const assessmentWrapper = document.getElementById('assessmentWrapper');
    const assessTitle = document.getElementById('assessTitle');
    const assessRestatement = document.getElementById('assessRestatement');
    const assessScopeBadge = document.getElementById('assessScopeBadge');
    const assessFitContent = document.getElementById('assessFitContent');
    const assessEvidenceContent = document.getElementById('assessEvidenceContent');
    const assessOpportunities = document.getElementById('assessOpportunities');
    const assessRisks = document.getElementById('assessRisks');
    const assessScoreContent = document.getElementById('assessScoreContent');
    const btnCopyAssessment = document.getElementById('btnCopyAssessment');

    let activeAngle = readStoredChoice('aetheria_angle', 'evidence', a => Boolean(IDEATION_ANGLES[a]));
    let activeMethod = readStoredChoice('aetheria_method', 'sector', m => Boolean(COMPARISON_METHODS[m]));
    let activeReference = readStoredChoice('aetheria_reference', '', () => true);

    const activeWeights = (() => {
        const stored = readJson('aetheria_weights', null);
        if (stored && typeof stored === 'object') return stored;
        const defaults = {};
        for (const [id, c] of Object.entries(SCORING_CRITERIA)) defaults[id] = c.defaultWeight;
        return defaults;
    })();

    // The user's own document. Deliberately a plain variable: it is never written
    // to localStorage or sessionStorage, so closing the tab is enough to be rid of
    // it. Everything else on this panel is a preference worth remembering; this is
    // the one thing that is not ours to keep.
    let sourceMaterial = '';

    // The user's own idea, held the same way and for the same reason: it is theirs,
    // not a preference of ours worth keeping. The comparison method and reference
    // are preferences and are remembered; they are stored under their own keys
    // rather than shared with the detailed panel, because the two answer different
    // questions — there, the method decides which candidate wins; here, it decides
    // what the user's existing idea gets compared against.
    let ideaText = '';
    let activeAssessMethod = readStoredChoice(
        'aetheria_assess_method', 'sector', m => Boolean(COMPARISON_METHODS[m]));
    let activeAssessReference = readStoredChoice('aetheria_assess_reference', '', () => true);

    // The rendered assessment, kept so the copy button has something to serialise.
    let currentAssessment = null;

    // The verification block rides on the project object itself, so both export
    // paths and the pool pick it up without a second source of truth.

    function populateDetailedPanel() {
        angleSelect.innerHTML = '';
        for (const angle of Object.values(IDEATION_ANGLES)) {
            const opt = document.createElement('option');
            opt.value = angle.id;
            opt.textContent = angle.label;
            angleSelect.appendChild(opt);
        }
        angleSelect.value = activeAngle;

        methodSelect.innerHTML = '';
        for (const method of Object.values(COMPARISON_METHODS)) {
            const opt = document.createElement('option');
            opt.value = method.id;
            opt.textContent = method.label;
            methodSelect.appendChild(opt);
        }
        methodSelect.value = activeMethod;

        buildWeightGrid(weightGrid, 'weight');

        renderWeightValues();
        updateMethodBadge();
    }

    // Every grid that exists, so a slider moved on one repaints the other. Both
    // read and write the same activeWeights object; leaving the second grid stale
    // would show two different answers to "what share does evidence have".
    const WEIGHT_GRID_PREFIXES = ['weight', 'assessWeight'];

    // Build one weight grid into `container`, with element ids under `prefix`.
    //
    // The prefix is not cosmetic. Two grids sharing `weight_evidence` would make
    // getElementById return whichever parsed first, so the assessment panel's
    // readouts would update the detailed panel's numbers and its own would never
    // move.
    function buildWeightGrid(container, prefix) {
        if (!container) return;
        container.innerHTML = '';

        for (const criterion of Object.values(SCORING_CRITERIA)) {
            const row = document.createElement('div');
            row.className = 'weight-row';

            const head = document.createElement('div');
            head.className = 'weight-head';

            const name = document.createElement('span');
            name.className = 'weight-name';
            name.textContent = criterion.label;

            const value = document.createElement('span');
            value.className = 'weight-value';
            value.id = `${prefix}Value_${criterion.id}`;

            head.append(name, value);

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '0';
            slider.max = '100';
            slider.step = '5';
            slider.id = `${prefix}_${criterion.id}`;
            slider.value = String(activeWeights[criterion.id] ?? criterion.defaultWeight);
            slider.setAttribute('aria-label', criterion.label);

            slider.addEventListener('input', () => {
                activeWeights[criterion.id] = Number(slider.value);
                persist('aetheria_weights', JSON.stringify(activeWeights));
                syncWeightSliders();
                renderWeightValues();
            });

            row.append(head, slider);
            container.appendChild(row);
        }
    }

    // Push the stored weights back into every slider.
    //
    // Without this, moving a slider in one mode and switching to the other showed
    // the old position next to the new percentage — the control contradicting its
    // own readout.
    function syncWeightSliders() {
        for (const prefix of WEIGHT_GRID_PREFIXES) {
            for (const id of Object.keys(SCORING_CRITERIA)) {
                const slider = document.getElementById(`${prefix}_${id}`);
                if (slider && Number(slider.value) !== activeWeights[id]) {
                    slider.value = String(activeWeights[id]);
                }
            }
        }
    }

    // Show the normalised share rather than the raw slider position, so the four
    // numbers always read as a share of one decision and add up to 100%.
    function renderWeightValues() {
        const normalized = normalizeWeights(activeWeights);
        for (const prefix of WEIGHT_GRID_PREFIXES) {
            for (const id of Object.keys(SCORING_CRITERIA)) {
                const el = document.getElementById(`${prefix}Value_${id}`);
                if (el) el.textContent = `%${Math.round(normalized[id] * 100)}`;
            }
        }
    }

    // Lifted out of updateMethodBadge because the assessment panel shows the same
    // badge. Two copies would let one panel keep calling a method measurable after
    // the other had learned better.
    const VERIFIABILITY_BADGES = {
        measurable: { text: '🟢 Ölçülebilir — kaynak bir sayı döndürüyor', cls: 'is-measurable' },
        partial: {
            text: '🟡 Kısmen — "orada var" ölçülür, "burada yok" ölçülemez',
            cls: 'is-partial'
        },
        unverifiable: {
            text: '🔴 Bu araçlarla doğrulanamaz — kanıt bölümü boş kalacak',
            cls: 'is-unverifiable'
        }
    };

    function updateMethodBadge() {
        const method = COMPARISON_METHODS[activeMethod] || COMPARISON_METHODS.sector;
        const badge = VERIFIABILITY_BADGES[method.verifiability];
        methodBadge.textContent = badge.text;
        methodBadge.className = `verifiability-badge ${badge.cls}`;

        referenceLabel.textContent = method.referenceLabel;
        referenceInput.disabled = !method.verifyStrategy;
    }

    function updateMaterialCounter() {
        const length = sourceMaterial.length;
        sourceMaterialCounter.textContent = `${length} / ${SOURCE_MATERIAL_MAX_CHARS}`;
        sourceMaterialCounter.classList.toggle('is-over', length > SOURCE_MATERIAL_MAX_CHARS);
    }

    function setMode(mode) {
        activeMode = MODES.includes(mode) ? mode : 'quick';
        persist('aetheria_mode', activeMode);

        detailedPanel.classList.toggle('visible', activeMode === 'detailed');
        if (assessPanel) assessPanel.classList.toggle('visible', activeMode === 'assess');

        for (const btn of modeSelector.querySelectorAll('.mode-btn')) {
            const isActive = btn.dataset.mode === activeMode;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', String(isActive));
        }

        // The button's label is part of the mode. Repainting the hint is what
        // updates it.
        updateKeyHint();
    }

    if (modeSelector) {
        modeSelector.addEventListener('click', (e) => {
            const btn = e.target.closest('.mode-btn');
            if (btn) setMode(btn.dataset.mode);
        });

        angleSelect.addEventListener('change', () => {
            activeAngle = angleSelect.value;
            persist('aetheria_angle', activeAngle);
        });

        methodSelect.addEventListener('change', () => {
            activeMethod = methodSelect.value;
            persist('aetheria_method', activeMethod);
            updateMethodBadge();
        });

        referenceInput.addEventListener('input', () => {
            activeReference = referenceInput.value;
            persist('aetheria_reference', activeReference);
        });

        sourceMaterialInput.addEventListener('input', () => {
            sourceMaterial = sourceMaterialInput.value;
            updateMaterialCounter();
        });

        sourceMaterialFile.addEventListener('change', async () => {
            const file = sourceMaterialFile.files && sourceMaterialFile.files[0];
            if (!file) return;
            try {
                const text = await file.text();
                sourceMaterialInput.value = text;
                sourceMaterial = text;
                updateMaterialCounter();
            } catch (err) {
                console.warn('Dosya okunamadı:', err);
                writeTerminalLog(`Dosya okunamadı: ${err.message || err}`, 'warning');
            } finally {
                // Let the same file be picked again after an edit.
                sourceMaterialFile.value = '';
            }
        });

        populateDetailedPanel();
        populateAssessPanel();
        referenceInput.value = activeReference;
        setMode(activeMode);
        updateMaterialCounter();
        updateIdeaCounter();
    }

    function populateAssessPanel() {
        if (!assessPanel) return;

        assessMethodSelect.innerHTML = '';
        for (const method of Object.values(COMPARISON_METHODS)) {
            const opt = document.createElement('option');
            opt.value = method.id;
            opt.textContent = method.label;
            assessMethodSelect.appendChild(opt);
        }
        assessMethodSelect.value = activeAssessMethod;
        assessReferenceInput.value = activeAssessReference;

        buildWeightGrid(assessWeightGrid, 'assessWeight');
        renderWeightValues();
        updateAssessMethodBadge();
    }

    // The same badge the detailed panel shows, against the same table. Told before
    // the request rather than after it: a user who picks the unverifiable method
    // should know the measurement card will be empty before spending a call on it.
    function updateAssessMethodBadge() {
        if (!assessMethodBadge) return;

        const method = COMPARISON_METHODS[activeAssessMethod] || COMPARISON_METHODS.sector;
        const badge = VERIFIABILITY_BADGES[method.verifiability];

        assessMethodBadge.textContent = badge.text;
        assessMethodBadge.className = `verifiability-badge ${badge.cls}`;

        assessReferenceLabel.textContent = method.referenceLabel;
        assessReferenceInput.disabled = !method.verifyStrategy;
    }

    function updateIdeaCounter() {
        if (!ideaTextCounter) return;
        ideaTextCounter.textContent = `${ideaText.length} / ${IDEA_TEXT_MAX_CHARS}`;
        ideaTextCounter.classList.toggle('is-over', ideaText.length > IDEA_TEXT_MAX_CHARS);
    }

    if (assessPanel) {
        assessMethodSelect.addEventListener('change', () => {
            activeAssessMethod = assessMethodSelect.value;
            persist('aetheria_assess_method', activeAssessMethod);
            updateAssessMethodBadge();
        });

        assessReferenceInput.addEventListener('input', () => {
            activeAssessReference = assessReferenceInput.value;
            persist('aetheria_assess_reference', activeAssessReference);
        });

        ideaTextInput.addEventListener('input', () => {
            ideaText = ideaTextInput.value;
            updateIdeaCounter();
        });
    }

    // ── Kanıt istekleri ─────────────────────────────────────────────────────

    // Fetch every query at once and let each one fail on its own.
    //
    // No credential is attached here, and none may be: the API key is added in
    // postToModel and nowhere else. These three services are public, keyless and
    // read-only, and a test asserts that no Authorization, x-goog-api-key or
    // x-api-key header ever reaches them.
    //
    // The timeout is EVIDENCE_TIMEOUT_MS rather than the generation timeout —
    // the evidence layer is not allowed to hold a generation open.
    async function fetchEvidence(queries) {
        const settled = await Promise.allSettled((queries || []).map(async (q) => {
            const request = buildEvidenceRequest(q.sourceId, q.query, q.options);
            if (!request) throw new Error('sorgu kurulamadı');

            const response = await fetch(request.url, {
                method: 'GET',
                credentials: 'omit',
                referrerPolicy: 'no-referrer',
                signal: AbortSignal.timeout(EVIDENCE_TIMEOUT_MS)
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = parseEvidenceResponse(q.sourceId, await response.json());
            if (!data) throw new Error('yanıt şekli tanınmadı');

            return { data, link: request.url };
        }));

        return settled.map((outcome, i) => {
            const q = queries[i];
            const base = { sourceId: q.sourceId, role: q.role, query: q.query };
            if (outcome.status === 'fulfilled') {
                return Object.assign(base, {
                    ok: true,
                    data: outcome.value.data,
                    error: null,
                    link: outcome.value.link
                });
            }
            const err = outcome.reason;
            return Object.assign(base, {
                ok: false,
                data: null,
                error: (err && (err.name === 'TimeoutError' ? 'zaman aşımı' : err.message)) || 'bilinmeyen hata',
                link: null
            });
        });
    }

    // Verify the top few candidates, then let the results re-rank them.
    //
    // Verifying one candidate could not change the order, which would reduce the
    // evidence to decoration. Verifying all eight would exhaust GitHub's keyless
    // search budget. VERIFY_TOP_K sits between the two.
    async function verifyCandidates(scored, onProgress) {
        const results = new Map();
        const method = COMPARISON_METHODS[activeMethod] || COMPARISON_METHODS.sector;

        if (!method.verifyStrategy) {
            onProgress({ phase: 'verify-skipped', method });
            for (const row of scored.slice(0, VERIFY_TOP_K)) {
                results.set(row.idea.title, interpretEvidence(activeMethod, []));
            }
            return results;
        }

        for (const row of scored.slice(0, VERIFY_TOP_K)) {
            const queries = buildEvidenceQueries(row.idea, activeMethod, activeReference);
            if (queries.length === 0) {
                onProgress({ phase: 'verify-nothing', title: row.idea.title });
                continue;
            }

            onProgress({ phase: 'verify-start', title: row.idea.title, queries });
            const raws = await fetchEvidence(queries);
            const result = interpretEvidence(activeMethod, raws);

            onProgress({ phase: 'verify-done', title: row.idea.title, raws, result });
            results.set(row.idea.title, result);
        }

        return results;
    }

    async function generateDetailedProject(onProgress = () => {}) {
        if (!geminiApiKey) throw new Error('API Key girilmedi');

        const limitCheck = checkRateLimits();
        if (!limitCheck.allowed) throw new Error(limitCheck.reason);
        recordGeminiCall();

        const categoryLabel = CATEGORY_LABELS[activeCategoryFilter] || 'yazılım';
        const material = clampSourceMaterial(sourceMaterial);

        onProgress({ phase: 'ideate', material, scope: activeScopeFilter });

        // PASS 1 — candidates that already carry their comparison and their scores.
        const prompt = buildDetailedIdeationPrompt({
            categoryLabel,
            count: DETAILED_BATCH_SIZE,
            scope: activeScopeFilter,
            angle: activeAngle,
            method: activeMethod,
            reference: activeReference,
            sourceMaterial: material.text,
            avoidTitles: knownIdeaTitles()
        });

        const ideation = await requestModelCompletion(prompt, {
            maxTokens: DETAILED_IDEA_MAX_TOKENS,
            temperature: 1.0,
            label: 'Ayrıntılı fikir listesi'
        });

        const parsed = parseJsonResponse(ideation.text, 'Ayrıntılı fikir listesi');
        const ideas = Array.isArray(parsed.ideas) ? parsed.ideas : [];
        if (ideas.length === 0) throw new Error('Fikir listesi boş döndü');

        // Local pre-ranking, no requests. pickWeightedIdea rather than scoreIdeas
        // directly, because it applies the same freshness filter quick mode uses —
        // scoring on its own would happily hand back a project already shown.
        const picked = pickWeightedIdea(ideas, knownIdeaTitles(), activeWeights);
        if (!picked.idea) throw new Error('Model kullanılabilir fikir döndürmedi');

        const preRanked = picked.scored;
        onProgress({
            phase: 'scored',
            total: ideas.length,
            freshCount: picked.freshCount,
            exhausted: picked.exhausted,
            scored: preRanked,
            model: ideation.model,
            tokens: ideation.tokens
        });

        // Free, keyless verification of the top few.
        const verifications = await verifyCandidates(preRanked, onProgress);

        // Re-rank. Verification only ever adds.
        const finalRanked = applyVerificationBoost(preRanked, verifications);
        const winner = finalRanked[0];
        if (!winner) throw new Error('Sıralama sonrası aday kalmadı');

        onProgress({ phase: 'selected', ranked: finalRanked, title: winner.idea.title });

        // PASS 2 — expand the winner only. The pasted material does NOT travel
        // again: the quote the model already pulled out of it is what stage 2
        // needs, and resending the whole document would double its token cost for
        // nothing.
        onProgress({ phase: 'expand' });
        const combo = pickConstraintCombo(Math.random, activeScopeFilter);
        const expansion = await expandIdea(winner.idea, categoryLabel, combo, activeScopeFilter);

        return {
            project: expansion.project,
            model: expansion.model,
            tokens: ideation.tokens + expansion.tokens,
            verification: {
                method: activeMethod,
                angle: activeAngle,
                reference: activeReference,
                comparison: winner.idea.comparison || {},
                evidence: winner.idea.evidence || null,
                sourceBacked: Boolean(material.text)
                    && Boolean(winner.idea.evidence)
                    && winner.idea.evidence.kind === 'source',
                results: winner.verification ? [winner.verification] : [],
                breakdown: winner.breakdown,
                baseTotal: winner.baseTotal,
                verificationBonus: winner.verificationBonus,
                total: winner.total,
                ranked: finalRanked.map(r => ({
                    title: r.idea.title,
                    total: r.total,
                    status: r.verification ? r.verification.status : null
                }))
            }
        };
    }

    // ── Ayrıntılı sonuç blokları ────────────────────────────────────────────

    function setDetailedBlocksVisible(visible) {
        for (const card of [verificationCard, evidenceCard, scoreBreakdownCard]) {
            if (card) card.classList.toggle('visible', visible);
        }
    }

    function renderVerification(v) {
        if (!v) {
            setDetailedBlocksVisible(false);
            return;
        }

        const method = COMPARISON_METHODS[v.method] || COMPARISON_METHODS.sector;
        const c = v.comparison || {};

        const badgeText = {
            measurable: '🟢 ölçülebilir',
            partial: '🟡 kısmen ölçülebilir',
            unverifiable: '🔴 bu araçlarla doğrulanamaz'
        }[method.verifiability];

        // Everything below goes through parseMarkdown, which escapes first — the
        // model wrote these strings and they are not to be trusted as markup.
        let md = '';
        if (c.referenceExample) md += `**Referans örnek:** ${c.referenceExample}\n`;
        if (c.localState) md += `**Türkiye'deki durum:** ${c.localState}\n`;
        if (c.structuralReason) md += `**Farkın yapısal sebebi:** ${c.structuralReason}\n`;
        md += `**Kıyas metodu:** ${method.label} — ${badgeText}\n`;
        // The point of the whole block: the user should be able to go and check
        // rather than take any of this on our word.
        if (c.howToCheck) md += `**Kendin nasıl doğrularsın:** ${c.howToCheck}
`;

        if (v.evidence && v.evidence.quote) {
            md += v.sourceBacked
                ? `**Kaynak materyalden alıntı:** "${v.evidence.quote}"\n`
                : `**Modelin dayanağı (belgeye değil, kendi bilgisine dayanıyor):** "${v.evidence.quote}"\n`;
        }

        verificationContent.innerHTML = parseMarkdown(md);
        renderEvidenceResults(v.results || []);
        renderScoreBreakdown(v);
        setDetailedBlocksVisible(true);
    }

    function renderEvidenceResults(results, container = evidenceContent, emptyText =
        'Bu üretim için doğrulama sorgusu çalıştırılmadı.') {
        if (!container) return;
        container.innerHTML = '';

        if (results.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'evidence-detail';
            empty.textContent = emptyText;
            container.appendChild(empty);
            return;
        }

        for (const r of results) {
            if (!r) continue;

            const item = document.createElement('div');
            // Allowlisted rather than written straight through: a pooled project
            // came out of localStorage, and this string lands in a class attribute.
            const status = safeEvidenceStatus(r.status);
            item.className = `evidence-item status-${status}`;
            if (r.status === 'measured' && r.supportsClaim === false) item.classList.add('refutes');

            const head = document.createElement('div');
            head.className = 'evidence-head';

            const source = document.createElement('span');
            source.className = 'evidence-source';
            const known = EVIDENCE_SOURCES[r.sourceId];
            source.textContent = known ? known.label : (r.sourceId || 'Kaynak');

            const statusTag = document.createElement('span');
            statusTag.className = 'evidence-status';
            statusTag.textContent = status;

            head.append(source, statusTag);

            if (r.status === 'measured' && r.supportsClaim === false) {
                const warn = document.createElement('span');
                warn.className = 'evidence-status';
                warn.textContent = '⚠ iddiayı desteklemiyor';
                head.appendChild(warn);
            }

            const detail = document.createElement('p');
            detail.className = 'evidence-detail';
            // textContent, not innerHTML: this string is partly built from model
            // output and from what a third-party service returned.
            detail.textContent = r.detail || '';

            item.append(head, detail);

            if (r.measurement) {
                const measure = document.createElement('div');
                measure.className = 'evidence-measure';
                if (typeof r.measurement.reference === 'number') {
                    measure.textContent =
                        `referans: ${r.measurement.reference} · hedef: ${r.measurement.target}`;
                } else if (Array.isArray(r.measurement.matches)) {
                    measure.textContent = `eşleşen: ${r.measurement.matches.join(', ')}`;
                } else if (typeof r.measurement.recentShare === 'number') {
                    measure.textContent =
                        `son üç yılın payı: %${Math.round(r.measurement.recentShare * 100)}`;
                }
                if (measure.textContent) item.appendChild(measure);
            }

            // The user should be able to look at the source themselves rather than
            // taking our reading of it.
            if (r.link && /^https:\/\//.test(r.link)) {
                const link = document.createElement('a');
                link.className = 'evidence-link';
                link.href = r.link;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = 'Kaynağa kendin bak →';
                item.appendChild(link);
            }

            container.appendChild(item);
        }
    }

    function renderScoreBreakdown(v) {
        scoreBreakdownContent.innerHTML = '';

        const table = document.createElement('table');
        table.className = 'score-table';

        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        for (const label of ['Kriter', 'Puan', 'Ağırlık', 'Katkı']) {
            const th = document.createElement('th');
            th.textContent = label;
            if (label !== 'Kriter') th.className = 'num';
            headRow.appendChild(th);
        }
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        for (const row of v.breakdown || []) {
            const tr = document.createElement('tr');
            const cells = [
                { text: row.label, cls: '' },
                { text: String(Math.round(row.score)), cls: 'num' },
                { text: `%${Math.round(row.weight * 100)}`, cls: 'num' },
                { text: row.contribution.toFixed(1), cls: 'num' }
            ];
            for (const cell of cells) {
                const td = document.createElement('td');
                td.textContent = cell.text;
                if (cell.cls) td.className = cell.cls;
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }

        // The verification contribution is its own row rather than being folded
        // into the total, so it is visible that it only ever added.
        if (v.verificationBonus > 0) {
            const boost = document.createElement('tr');
            boost.className = 'boost-row';
            const label = document.createElement('td');
            label.textContent = 'Doğrulama katkısı';
            boost.appendChild(label);
            for (const text of ['—', '—', `+${v.verificationBonus.toFixed(1)}`]) {
                const td = document.createElement('td');
                td.className = 'num';
                td.textContent = text;
                boost.appendChild(td);
            }
            tbody.appendChild(boost);
        }

        const totalRow = document.createElement('tr');
        totalRow.className = 'total-row';
        const totalLabel = document.createElement('td');
        totalLabel.textContent = 'Toplam';
        totalRow.appendChild(totalLabel);
        for (const text of ['', '', v.total.toFixed(1)]) {
            const td = document.createElement('td');
            td.className = 'num';
            td.textContent = text;
            totalRow.appendChild(td);
        }
        tbody.appendChild(totalRow);

        table.appendChild(tbody);
        scoreBreakdownContent.appendChild(table);
    }

    async function runDetailedStep1() {
        if (assessmentWrapper) assessmentWrapper.classList.remove('visible');
        resultsWrapper.classList.remove('visible');
        step2Container.classList.remove('visible');
        step2Container.style.display = 'none';
        step2TriggerWrapper.style.display = 'none';
        setDetailedBlocksVisible(false);

        terminalContainer.style.display = 'block';
        terminalBody.innerHTML = '';

        if (!geminiApiKey || !useGeminiLiveMode) {
            writeTerminalLog(
                'Ayrıntılı üretim de anahtarınla çalışır — fikirler sıfırdan üretilir.', 'warning');
            writeTerminalLog('Anahtar ekranı açılıyor...', 'info');
            await sleep(1200);
            openKeyDialog(btnFeature2Notice);
            return;
        }

        const started = Date.now();
        let generated = null;

        try {
            generated = await generateDetailedProject((step) => {
                if (step.phase === 'ideate') {
                    const provider = getProvider(activeProvider);
                    writeTerminalLog(
                        `Ayrıntılı üretim · ${DETAILED_BATCH_SIZE} aday · ${provider.label} · ` +
                        `model: ${provider.models[0]}`, 'agent');
                    writeTerminalLog(`Kapsam: ${(SCOPE_PRESETS[step.scope] || SCOPE_PRESETS.all).badge}`, 'info');
                    writeTerminalLog(
                        `Açı: ${IDEATION_ANGLES[activeAngle].label} · ` +
                        `Kıyas: ${COMPARISON_METHODS[activeMethod].label}`, 'info');
                    if (step.material.chars > 0) {
                        writeTerminalLog(
                            `Kaynak materyal: ${step.material.chars} karakter` +
                            (step.material.truncated ? ' (tavana göre kesildi)' : ''), 'info');
                    } else {
                        writeTerminalLog('Kaynak materyal verilmedi — alıntı model bilgisine dayanacak.', 'info');
                    }
                } else if (step.phase === 'scored') {
                    writeTerminalLog(
                        `${step.total} aday alındı · ${step.freshCount} tanesi yeni · ` +
                        `${step.tokens} token`, 'info');
                    if (step.exhausted) {
                        writeTerminalLog('Hepsi daha önce görülmüştü; en farklı olan seçildi.', 'warning');
                    }
                    const top = step.scored.slice(0, VERIFY_TOP_K)
                        .map((r, i) => `${i + 1}. "${r.idea.title}" ${r.total.toFixed(1)}`)
                        .join(' · ');
                    writeTerminalLog(`[SCORE] ${top}`, 'info');
                } else if (step.phase === 'verify-skipped') {
                    writeTerminalLog(
                        `[EVIDENCE] ${step.method.label} bu araçlarla doğrulanamıyor — sorgu çalıştırılmadı.`,
                        'warning');
                } else if (step.phase === 'verify-nothing') {
                    writeTerminalLog(
                        `[EVIDENCE] "${step.title}" için doğrulanabilir bir sorgu kurulamadı.`, 'warning');
                } else if (step.phase === 'verify-start') {
                    writeTerminalLog(
                        `[EVIDENCE] "${step.title}" · ${step.queries.length} sorgu · ` +
                        step.queries.map(q => q.sourceId).join(', '), 'agent');
                } else if (step.phase === 'verify-done') {
                    // Every raw answer is reported, not just the verdict.
                    for (const r of step.raws) {
                        if (!r.ok) {
                            writeTerminalLog(`[EVIDENCE] "${r.query}" → hata: ${r.error}`, 'warning');
                        } else if (r.data.kind === 'count') {
                            writeTerminalLog(`[EVIDENCE] "${r.query}" → ${r.data.count}`, 'info');
                        } else if (r.data.kind === 'entities' || r.data.kind === 'repos') {
                            const n = r.data.matches.length;
                            writeTerminalLog(`[EVIDENCE] "${r.query}" → ${n} eşleşme`, 'info');
                        } else if (r.data.kind === 'years') {
                            writeTerminalLog(
                                `[EVIDENCE] "${r.query}" → ${Object.keys(r.data.years).length} yıl`, 'info');
                        }
                    }
                    const verdict = step.result;
                    if (verdict.status === 'measured' && verdict.supportsClaim === false) {
                        writeTerminalLog(
                            `[EVIDENCE] ⚠ ölçüm iddiayı desteklemiyor — "${step.title}" bonus almadı`,
                            'warning');
                    } else {
                        writeTerminalLog(`[EVIDENCE] sonuç: ${verdict.status}`, 'info');
                    }
                } else if (step.phase === 'selected') {
                    const line = step.ranked
                        .map(r => `"${r.idea.title}" ${r.total.toFixed(1)}`)
                        .slice(0, VERIFY_TOP_K)
                        .join(' · ');
                    writeTerminalLog(`[SCORE] doğrulama sonrası: ${line}`, 'info');
                    writeTerminalLog(`[SELECT] "${step.title}" seçildi`, 'agent');
                } else if (step.phase === 'expand') {
                    writeTerminalLog('Kazanan aday tam projeye genişletiliyor...', 'agent');
                }
            });

            writeTerminalLog(
                `Tamamlandı · ${generated.model} · ${generated.tokens} token (2 LLM çağrısı) · ` +
                `${((Date.now() - started) / 1000).toFixed(1)} sn`, 'info');
            writeTerminalLog('Şema doğrulandı, proje oluşturuldu.', 'success');
        } catch (err) {
            console.warn('Ayrıntılı üretim başarısız:', err);
            writeTerminalLog(`Üretim başarısız: ${err.message}`, 'warning');
            writeTerminalLog('Tekrar deneyebilir veya hızlı moda dönebilirsin.', 'info');
            return;
        }

        await sleep(250);
        terminalContainer.style.display = 'none';

        // Attached before rendering so the exported blueprint and the pool carry
        // the comparison with the project rather than alongside it.
        generated.project.verification = generated.verification;

        // loadProjectIntoView renders the verification itself now that the block
        // rides on the project.
        loadProjectIntoView(generated.project, false, false);
    }

    /* ── Fikir değerlendirme modu ────────────────────────────────────────────
       One LLM call and one round of measurement against the user's own idea. The
       other two modes hand the user an idea; this one takes the one they already
       have and asks the same questions of it.

       There is no second pass. Detailed mode expands its winner into architecture
       and security because the user asked for a project; here they asked what
       their idea is worth, and generating an architecture for it would answer a
       question nobody put. */

    async function generateAssessment(onProgress = () => {}) {
        if (!geminiApiKey) throw new Error('API Key girilmedi');

        const idea = clampIdeaText(ideaText);
        if (!idea.text) throw new Error('Değerlendirilecek bir fikir yazılmadı');

        const limitCheck = checkRateLimits();
        if (!limitCheck.allowed) throw new Error(limitCheck.reason);
        recordGeminiCall();

        const categoryLabel = CATEGORY_LABELS[activeCategoryFilter] || 'yazılım';
        const method = COMPARISON_METHODS[activeAssessMethod] || COMPARISON_METHODS.sector;

        onProgress({ phase: 'assess', idea, scope: activeScopeFilter, method });

        const prompt = buildAssessmentPrompt({
            ideaText: idea.text,
            scope: activeScopeFilter,
            method: activeAssessMethod,
            reference: activeAssessReference,
            categoryLabel
        });

        // Cooler than ideation on purpose. Temperature 1.0 is what makes eight
        // candidates differ from each other; here there is one idea and the job is
        // to characterise it, so variety is just noise in the verdict.
        const answer = await requestModelCompletion(prompt, {
            maxTokens: ASSESSMENT_MAX_TOKENS,
            temperature: 0.4,
            label: 'Fikir değerlendirmesi'
        });

        const assessment = normalizeAssessment(
            parseJsonResponse(answer.text, 'Fikir değerlendirmesi'));
        if (!assessment) throw new Error('Model kullanılabilir bir değerlendirme döndürmedi');

        // Same scorer the detailed mode ranks with, over a list of one. Reusing it
        // is what makes the four criteria mean the same thing in both modes.
        const scored = scoreIdeas([assessment], activeWeights)[0];

        onProgress({
            phase: 'scored',
            assessment,
            scored,
            model: answer.model,
            tokens: answer.tokens
        });

        // Measurement. Exactly the same free, keyless sources the detailed mode
        // uses, and with the same rule: nothing here can lower a score.
        let verification;
        if (!method.verifyStrategy) {
            onProgress({ phase: 'verify-skipped', method });
            verification = interpretEvidence(activeAssessMethod, []);
        } else {
            const queries = buildEvidenceQueries(
                assessment, activeAssessMethod, activeAssessReference);

            if (queries.length === 0) {
                onProgress({ phase: 'verify-nothing' });
                verification = interpretEvidence(activeAssessMethod, []);
            } else {
                onProgress({ phase: 'verify-start', queries });
                const raws = await fetchEvidence(queries);
                verification = interpretEvidence(activeAssessMethod, raws);
                onProgress({ phase: 'verify-done', raws, result: verification });
            }
        }

        return {
            assessment,
            split: splitAssessment(scored, verification),
            method: activeAssessMethod,
            scope: activeScopeFilter,
            truncated: idea.truncated,
            model: answer.model,
            tokens: answer.tokens
        };
    }

    // ── Değerlendirme sonucu ────────────────────────────────────────────────

    function renderAssessment(result) {
        if (!assessmentWrapper || !result) return;

        currentAssessment = result;
        const { assessment, split } = result;
        const method = COMPARISON_METHODS[result.method] || COMPARISON_METHODS.sector;
        const c = assessment.comparison || {};

        assessTitle.textContent = assessment.title || 'Adsız fikir';
        assessRestatement.textContent = assessment.restatement || '';

        const preset = SCOPE_PRESETS[result.scope] || SCOPE_PRESETS.all;
        assessScopeBadge.textContent = preset.badge;
        assessScopeBadge.className = result.scope === 'all'
            ? 'project-scope-badge'
            : `project-scope-badge scope-${result.scope}`;

        // parseMarkdown escapes before it formats. The model wrote every string
        // below and none of them is trusted as markup.
        let md = '';
        if (c.referenceExample) md += `**Referans örnek:** ${c.referenceExample}\n`;
        if (c.localState) md += `**Türkiye'deki durum:** ${c.localState}\n`;
        if (c.structuralReason) md += `**Açığın yapısal sebebi:** ${c.structuralReason}\n`;
        md += `**Kıyas metodu:** ${method.label} — `
            + `${VERIFIABILITY_BADGES[method.verifiability].text}\n`;
        // The point of the block: the user should be able to go and check rather
        // than take any of this on our word.
        if (c.howToCheck) md += `**Kendin nasıl doğrularsın:** ${c.howToCheck}\n`;
        if (result.truncated) {
            md += '\n_Fikir metni uzunluk sınırına göre kesildi; değerlendirme '
                + 'kesilmiş haline dayanıyor._\n';
        }
        assessFitContent.innerHTML = parseMarkdown(md);

        renderEvidenceResults(
            split.verification ? [split.verification] : [],
            assessEvidenceContent,
            'Bu kıyas metodu için doğrulama sorgusu çalıştırılmadı.');

        renderAssessList(assessOpportunities, assessment.opportunities,
            'Model somut bir açılım yazmadı. Bu bir sonuç değil — fikri biraz daha '
            + 'ayrıntılı anlatıp tekrar dene.');
        renderAssessList(assessRisks, assessment.risks,
            'Model somut bir risk yazmadı. Risksiz bir fikir olduğu anlamına gelmez; '
            + 'değerlendirmenin bu tarafı boş kaldı.');

        renderAssessScores(split);

        assessmentWrapper.classList.add('visible');
        assessmentWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function renderAssessList(container, items, emptyText) {
        if (!container) return;
        container.innerHTML = '';

        if (!items || items.length === 0) {
            const li = document.createElement('li');
            li.className = 'assess-item is-empty';
            li.textContent = emptyText;
            container.appendChild(li);
            return;
        }

        for (const item of items) {
            const li = document.createElement('li');
            li.className = 'assess-item';
            // textContent: model output, and an opportunity is not a place markup
            // needs to be honoured.
            li.textContent = item;
            container.appendChild(li);
        }
    }

    // What a source settled, what the model merely thinks, and no single number
    // combining the two.
    //
    // The missing total is the feature. Market size, competition and timing cannot
    // be reached by anything this app talks to, so two of the four criteria are
    // opinion. Adding them into one "your idea scores N" would make that figure the
    // most trusted thing on the page and the least earned — and it is the one
    // number a reader would quote afterwards, stripped of everything around it.
    const BASIS_LABELS = {
        measured: 'ölçülebilir iddia',
        model: 'model görüşü'
    };

    function renderAssessScores(split) {
        if (!assessScoreContent) return;
        assessScoreContent.innerHTML = '';

        const table = document.createElement('table');
        table.className = 'score-table';

        const thead = document.createElement('thead');
        const headRow = document.createElement('tr');
        for (const label of ['Kriter', 'Dayanak', 'Puan', 'Ağırlık', 'Katkı']) {
            const th = document.createElement('th');
            th.textContent = label;
            if (label !== 'Kriter' && label !== 'Dayanak') th.className = 'num';
            headRow.appendChild(th);
        }
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        // Measured-basis rows first, so the two groups read as two groups rather
        // than as one list with a label column.
        const ordered = [
            ...split.rows.filter(r => r.basis === 'measured'),
            ...split.rows.filter(r => r.basis !== 'measured')
        ];

        for (const row of ordered) {
            const tr = document.createElement('tr');
            tr.className = `basis-${row.basis === 'measured' ? 'measured' : 'model'}`;

            const nameCell = document.createElement('td');
            nameCell.textContent = row.label;
            tr.appendChild(nameCell);

            const basisCell = document.createElement('td');
            const basisTag = document.createElement('span');
            basisTag.className = `basis-tag is-${row.basis === 'measured' ? 'measured' : 'model'}`;
            basisTag.textContent = BASIS_LABELS[row.basis] || BASIS_LABELS.model;
            basisCell.appendChild(basisTag);
            tr.appendChild(basisCell);

            for (const text of [
                String(Math.round(row.score)),
                `%${Math.round(row.weight * 100)}`,
                row.contribution.toFixed(1)
            ]) {
                const td = document.createElement('td');
                td.className = 'num';
                td.textContent = text;
                tr.appendChild(td);
            }

            tbody.appendChild(tr);
        }

        // Two subtotals, never summed.
        for (const [label, value] of [
            ['İddia tarafı alt toplam', split.claimTotal],
            ['Model görüşü alt toplam', split.modelTotal]
        ]) {
            const tr = document.createElement('tr');
            tr.className = 'total-row';
            const name = document.createElement('td');
            name.textContent = label;
            tr.appendChild(name);
            for (const text of ['', '', '', value.toFixed(1)]) {
                const td = document.createElement('td');
                td.className = 'num';
                td.textContent = text;
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }

        if (split.verificationBonus > 0) {
            const tr = document.createElement('tr');
            tr.className = 'boost-row';
            const name = document.createElement('td');
            name.textContent = 'Doğrulama katkısı';
            tr.appendChild(name);
            for (const text of ['', '', '', `+${split.verificationBonus.toFixed(1)}`]) {
                const td = document.createElement('td');
                td.className = 'num';
                td.textContent = text;
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }

        table.appendChild(tbody);
        assessScoreContent.appendChild(table);

        // Said on screen, next to the place the number would have been. A user
        // looking for "so what is my score" has to find the reason there is not
        // one, not hunt for it in a README.
        const note = document.createElement('p');
        note.className = 'score-note';
        note.textContent = split.measured
            ? 'Tek bir toplam puan verilmiyor. Dört kriterden ikisi ücretsiz '
                + 'kaynaklarla ölçülebilir, ikisi yalnızca modelin görüşü — '
                + 'ikisini tek sayıda toplamak görüşü ölçüm gibi gösterirdi.'
            : 'Tek bir toplam puan verilmiyor, ve bu üretimde hiçbir kriter '
                + 'gerçekten ölçülemedi: dört puan da modelin görüşü. Fikir '
                + 'hakkında bir bulgu değil, bir okumadır.';
        assessScoreContent.appendChild(note);
    }

    async function copyCurrentAssessmentToClipboard() {
        if (!currentAssessment) return;

        const markdown = buildAssessmentMarkdown(
            currentAssessment.assessment, currentAssessment.split, currentAssessment.method);

        try {
            if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(markdown);
            } else {
                const textarea = document.createElement('textarea');
                textarea.value = markdown;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            showCopyToast('✓ Değerlendirme panoya kopyalandı!');
        } catch (err) {
            console.warn('Panoya kopyalama başarısız:', err);
            showCopyToast('✗ Panoya kopyalanamadı.');
        }
    }

    async function runAssessment() {
        assessmentWrapper.classList.remove('visible');
        resultsWrapper.classList.remove('visible');
        step2Container.classList.remove('visible');
        step2Container.style.display = 'none';
        step2TriggerWrapper.style.display = 'none';
        setDetailedBlocksVisible(false);

        terminalContainer.style.display = 'block';
        terminalBody.innerHTML = '';

        // Checked before the key, because an empty box is the user's to fix and
        // sending them to the key dialog for it would be answering the wrong
        // question.
        if (!clampIdeaText(ideaText).text) {
            writeTerminalLog('Değerlendirilecek bir fikir yazılmadı.', 'warning');
            writeTerminalLog(
                'Fikrini yukarıdaki alana kendi cümlelerinle anlat — ne yapıyor, '
                + 'kimin işine yarıyor, neyi farklı yapıyor.', 'info');
            ideaTextInput.focus();
            return;
        }

        if (!geminiApiKey || !useGeminiLiveMode) {
            writeTerminalLog(
                'Değerlendirme de anahtarınla çalışır — fikrin modele senin '
                + 'anahtarınla gider.', 'warning');
            writeTerminalLog('Anahtar ekranı açılıyor...', 'info');
            await sleep(1200);
            openKeyDialog(btnFeature2Notice);
            return;
        }

        const started = Date.now();
        let result = null;

        try {
            result = await generateAssessment((step) => {
                if (step.phase === 'assess') {
                    const provider = getProvider(activeProvider);
                    writeTerminalLog(
                        `Fikir değerlendirmesi · ${provider.label} · `
                        + `model: ${provider.models[0]}`, 'agent');
                    writeTerminalLog(
                        `Kapsam: ${(SCOPE_PRESETS[step.scope] || SCOPE_PRESETS.all).badge} · `
                        + `Kıyas: ${step.method.label}`, 'info');
                    writeTerminalLog(
                        `Fikir metni: ${step.idea.chars} karakter`
                        + (step.idea.truncated ? ' (tavana göre kesildi)' : ''), 'info');
                    writeTerminalLog('Fikir değiştirilmeyecek — modele açıkça söylendi.', 'info');
                } else if (step.phase === 'scored') {
                    writeTerminalLog(`Değerlendirme alındı · ${step.tokens} token`, 'info');
                    const line = step.scored.breakdown
                        .map(r => `${r.label} ${Math.round(r.score)}`)
                        .join(' · ');
                    writeTerminalLog(`[SCORE] ${line}`, 'info');
                } else if (step.phase === 'verify-skipped') {
                    writeTerminalLog(
                        `[EVIDENCE] ${step.method.label} bu araçlarla doğrulanamıyor — `
                        + 'sorgu çalıştırılmadı.', 'warning');
                } else if (step.phase === 'verify-nothing') {
                    writeTerminalLog(
                        '[EVIDENCE] Doğrulanabilir bir sorgu kurulamadı — modelin '
                        + 'kıyas alanları boş geldi.', 'warning');
                } else if (step.phase === 'verify-start') {
                    writeTerminalLog(
                        `[EVIDENCE] ${step.queries.length} sorgu · `
                        + step.queries.map(q => q.sourceId).join(', '), 'agent');
                } else if (step.phase === 'verify-done') {
                    // Every raw answer, not just the verdict.
                    for (const r of step.raws) {
                        if (!r.ok) {
                            writeTerminalLog(`[EVIDENCE] "${r.query}" → hata: ${r.error}`, 'warning');
                        } else if (r.data.kind === 'count') {
                            writeTerminalLog(`[EVIDENCE] "${r.query}" → ${r.data.count}`, 'info');
                        } else if (r.data.kind === 'entities' || r.data.kind === 'repos') {
                            writeTerminalLog(
                                `[EVIDENCE] "${r.query}" → ${r.data.matches.length} eşleşme`, 'info');
                        } else if (r.data.kind === 'years') {
                            writeTerminalLog(
                                `[EVIDENCE] "${r.query}" → `
                                + `${Object.keys(r.data.years).length} yıl`, 'info');
                        }
                    }
                    if (step.result.status === 'measured' && step.result.supportsClaim === false) {
                        writeTerminalLog(
                            '[EVIDENCE] ⚠ ölçüm iddiayı desteklemiyor — puan düşmedi, '
                            + 'ama bonus da yok', 'warning');
                    } else {
                        writeTerminalLog(`[EVIDENCE] sonuç: ${step.result.status}`, 'info');
                    }
                }
            });

            writeTerminalLog(
                `Tamamlandı · ${result.model} · ${result.tokens} token (1 LLM çağrısı) · `
                + `${((Date.now() - started) / 1000).toFixed(1)} sn`, 'info');
            writeTerminalLog('Değerlendirme hazır.', 'success');
        } catch (err) {
            console.warn('Fikir değerlendirmesi başarısız:', err);
            writeTerminalLog(`Değerlendirme başarısız: ${err.message}`, 'warning');
            writeTerminalLog('Tekrar deneyebilir veya fikri biraz daha açabilirsin.', 'info');
            return;
        }

        await sleep(250);
        terminalContainer.style.display = 'none';

        renderAssessment(result);
    }

    // Event Listeners
    btnGenerateProject.addEventListener('click', startStep1Simulation);
    btnTriggerStep2.addEventListener('click', startStep2Simulation);
    if (btnCopyAssessment) {
        btnCopyAssessment.addEventListener('click', copyCurrentAssessmentToClipboard);
    }
});
