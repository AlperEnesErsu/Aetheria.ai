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
    let lastProjectIndex = -1;
    let activeCategoryFilter = 'all';

    // SECURITY & RATE LIMITING STATE (Open-Source Protection)
    const RATE_LIMIT_COOLDOWN_MS = 20000; // 20 seconds minimum delay between Gemini API calls
    const MAX_CALLS_PER_HOUR = 15; // Max 15 Gemini API calls per hour per browser
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

    // Helper: Simple Markdown Formatter
    function parseMarkdown(text) {
        if (!text) return '';
        let html = text
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

    // Terminal Log Writer
    async function writeTerminalLog(message, type = 'info') {
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

        line.innerHTML = `${statusTag} <span>${message}</span>`;
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
            btnSaveProject.querySelector('span').textContent = 'Ortak Havuza Ekle';
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

        communityPool.forEach(proj => {
            const card = document.createElement('div');
            card.className = 'saved-card-item';
            card.innerHTML = `
                <div class="saved-item-cat">${proj.category}</div>
                <div class="saved-item-title">${proj.title}</div>
                <div class="saved-item-actions">
                    <button class="btn-saved-action btn-inspect" data-id="${proj.id}">İncele</button>
                    <button class="btn-saved-action btn-download" data-id="${proj.id}">.MD İndir</button>
                    <button class="btn-saved-action btn-delete" data-id="${proj.id}">Havuzdan Çıkar</button>
                </div>
            `;
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
                    savedDrawerOverlay.style.display = 'none';
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

    // Pick random project from built-in database
    function getRandomProject() {
        const projects = getFilteredProjects();
        if (projects.length === 0) return null;

        let randomIndex;
        do {
            randomIndex = Math.floor(Math.random() * projects.length);
        } while (randomIndex === lastProjectIndex && projects.length > 1);

        lastProjectIndex = randomIndex;
        return projects[randomIndex];
    }

    // GEMINI 2.5 FLASH LIVE API CALL WITH RATE LIMIT & TOKEN CAP GUARDRAILS
    async function generateProjectViaGeminiApi() {
        if (!geminiApiKey) throw new Error('API Key girilmedi');

        // Check Rate Limiter
        const limitCheck = checkRateLimits();
        if (!limitCheck.allowed) {
            throw new Error(limitCheck.reason);
        }

        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey.trim()}`;
        const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey.trim()}`;

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

        // SECURITY GUARDRAIL: Strict Token Limit Cap (max 1000 tokens output to preserve quota)
        const requestBody = {
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
                responseMimeType: "application/json",
                maxOutputTokens: 1000,
                temperature: 0.7
            }
        };

        let response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            response = await fetch(fallbackEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
        }

        if (!response.ok) {
            const errJson = await response.json();
            throw new Error(errJson.error ? errJson.error.message : 'Gemini API Hatası');
        }

        // Record successful call for rate limiting
        recordGeminiCall();

        const data = await response.json();
        const jsonText = data.candidates[0].content.parts[0].text;
        const projectObj = JSON.parse(jsonText);
        return projectObj;
    }

    // Render Visual Architecture Flow Graph
    function renderArchitectureDiagram(nodes) {
        architectureDiagramNodes.innerHTML = '';
        if (!nodes || nodes.length === 0) return;

        nodes.forEach((node, idx) => {
            const card = document.createElement('div');
            card.className = `diagram-node-card node-${node.type || 'service'}`;
            card.innerHTML = `
                <div class="node-name">${node.name}</div>
                <div class="node-sub">${node.sub || ''}</div>
            `;
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
    }

    // Category Filter Handlers
    filterBar.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
            document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            activeCategoryFilter = e.target.getAttribute('data-category');
        }
    });

    // Drawer Open / Close Handlers
    btnSavedProjects.addEventListener('click', () => {
        renderSavedProjectsList();
        savedDrawerOverlay.style.display = 'flex';
    });
    btnCloseDrawer.addEventListener('click', () => {
        savedDrawerOverlay.style.display = 'none';
    });
    savedDrawerOverlay.addEventListener('click', (e) => {
        if (e.target === savedDrawerOverlay) savedDrawerOverlay.style.display = 'none';
    });

    // Save Project Button Handler
    btnSaveProject.addEventListener('click', toggleSaveCurrentProject);

    // Gemini API Modal Handlers
    btnFeature2Notice.addEventListener('click', () => feature2Modal.style.display = 'flex');
    btnCloseModal.addEventListener('click', () => feature2Modal.style.display = 'none');
    feature2Modal.addEventListener('click', (e) => {
        if (e.target === feature2Modal) feature2Modal.style.display = 'none';
    });

    // Save Gemini Key & Mode Setting
    btnSaveGeminiKey.addEventListener('click', () => {
        geminiApiKey = geminiApiKeyInput.value.trim();
        useGeminiLiveMode = useGeminiApiToggle.checked;

        localStorage.setItem('aetheria_gemini_key', geminiApiKey);
        localStorage.setItem('aetheria_use_gemini', useGeminiLiveMode ? 'true' : 'false');
        
        updateGeminiBadgeStatus();
        feature2Modal.style.display = 'none';
    });

    // Export Blueprint Handler
    btnExportBlueprint.addEventListener('click', () => exportBlueprintMarkdown());

    // ==========================================
    // STEP 1: GENERATE PROJECT IDEA & MARKET GAP
    // ==========================================
    async function startStep1Simulation() {
        btnGenerateProject.disabled = true;
        btnGenerateProject.style.opacity = '0.7';
        
        resultsWrapper.classList.remove('visible');
        step2Container.classList.remove('visible');
        step2Container.style.display = 'none';
        step2TriggerWrapper.style.display = 'none';

        terminalContainer.style.display = 'block';
        terminalBody.innerHTML = '';

        await writeTerminalLog('Aetheria AI Agent v2.4 başlatılıyor...', 'agent');
        await sleep(300);

        let projectToRender = null;

        // Try Gemini Live API if enabled
        if (useGeminiLiveMode && geminiApiKey) {
            try {
                await writeTerminalLog('Gemini 2.5 Flash API bağlandı. Canlı yapay zeka pazar taraması yapılıyor...', 'agent');
                await sleep(400);
                await writeTerminalLog(`Filtre Katmanı: "${activeCategoryFilter.toUpperCase()}" taranıyor...`, 'info');
                await sleep(500);

                projectToRender = await generateProjectViaGeminiApi();
                await writeTerminalLog('Gemini AI canlı proje mimarisi başarıyla oluşturuldu!', 'success');
                await sleep(300);
            } catch (err) {
                console.warn('Gemini API Security Notice:', err);
                await writeTerminalLog(`Güvenlik & Kota Koruması: ${err.message || 'Limit aşıldı'}.`, 'warning');
                await writeTerminalLog('Kota korundu. Dahili Ajan veritabanına geçiş yapılıyor...', 'info');
                await sleep(400);
            }
        }

        // Fallback to Built-in Database
        if (!projectToRender) {
            await writeTerminalLog('Küresel SaaS & GitHub Trend Veritabanı bağlandı.', 'info');
            await sleep(400);
            await writeTerminalLog(`Filtre Katmanı: "${activeCategoryFilter.toUpperCase()}" taranıyor...`, 'info');
            await sleep(400);
            
            projectToRender = getRandomProject();

            if (!projectToRender) {
                await writeTerminalLog('Bu kategoride henüz proje bulunamadı.', 'info');
                btnGenerateProject.disabled = false;
                btnGenerateProject.style.opacity = '1';
                return;
            }

            await writeTerminalLog(`Sektör Tespit Edildi: "${projectToRender.category}"`, 'info');
            await sleep(400);
            await writeTerminalLog('Rekabet doyum oranı ve kullanıcı şikayetleri analiz ediliyor...', 'info');
            await sleep(400);
            await writeTerminalLog('Çözülmemiş yüksek potansiyelli proje fırsatı yakalandı!', 'success');
            await sleep(300);
        }

        await writeTerminalLog(`Proje Adı: "${projectToRender.title}" oluşturuluyor...`, 'agent');
        await sleep(400);

        terminalContainer.style.display = 'none';
        
        // Populate & Render Step 1
        loadProjectIntoView(projectToRender);

        btnGenerateProject.disabled = false;
        btnGenerateProject.style.opacity = '1';
    }

    // ==========================================
    // STEP 2: GENERATE ARCHITECTURE & SECURITY
    // ==========================================
    async function startStep2Simulation() {
        if (!currentProject) return;

        btnTriggerStep2.disabled = true;
        btnTriggerStep2.style.opacity = '0.7';

        terminalContainer.style.display = 'block';
        terminalBody.innerHTML = '';

        await writeTerminalLog(`"${currentProject.title}" için Derin Mimari Scanner çalıştırılıyor...`, 'agent');
        await sleep(350);
        await writeTerminalLog('Clean Architecture katmanları ve mikroservis sınırları çiziliyor...', 'info');
        await sleep(400);
        await writeTerminalLog('Sistem akış diyagramı düğümleri (Interactive Diagram Nodes) oluşturuluyor...', 'info');
        await sleep(400);
        await writeTerminalLog('Veritabanı varlık ilişkileri ve storage katmanları optimizasyonu...', 'info');
        await sleep(400);
        await writeTerminalLog('Tehdit Modellemesi (OWASP Top 10 & Zero-Trust) yürütülüyor...', 'info');
        await sleep(400);
        await writeTerminalLog('Mimari ve Güvenlik Çözüm Raporu Başarıyla Tamamlandı!', 'success');
        await sleep(300);

        terminalContainer.style.display = 'none';

        renderStep2Content();
        setStep2Visibility(true);

        setTimeout(() => {
            step2Container.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);

        btnTriggerStep2.disabled = false;
        btnTriggerStep2.style.opacity = '1';
    }

    // Event Listeners
    btnGenerateProject.addEventListener('click', startStep1Simulation);
    btnTriggerStep2.addEventListener('click', startStep2Simulation);
});
