/* ==========================================================================
   Aetheria.ai — Pure Core Logic

   The functions here have no DOM and no network dependencies, which is what
   makes them testable. app.js consumes them through window.AetheriaCore;
   test/core.test.js requires this file directly under Node.
   ========================================================================== */

(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    } else {
        root.AetheriaCore = api;
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // Diagram node types that have a matching .node-* rule in style.css
    const NODE_TYPES = ['source', 'service', 'ai', 'storage', 'client'];

    // The five values a verification result may carry. Listed here for the same
    // reason NODE_TYPES is: the renderer builds a CSS class out of the status, and
    // a project reloaded from the pool came out of hand-editable localStorage.
    const EVIDENCE_STATUSES = ['verified', 'measured', 'not_found', 'unverifiable', 'error'];

    // Scope definitions for targeting specific market ecosystems.
    //
    // `badge` is the single source of truth for what the UI shows. app.js used to
    // hardcode its own copies of these strings, and they had already drifted
    // ("Hibrit Kapsam" on the card vs "Hibrit Pazar" in the exported report) —
    // the same project describing itself two different ways in two places.
    const SCOPE_PRESETS = {
        all: {
            id: 'all',
            label: '🌐 Tümü (Hibrit)',
            badge: '🌐 Hibrit Kapsam',
            description: 'Hem Türkiye pazarında uygulanabilir hem de küresel ölçeklenebilir hibrit projeler'
        },
        national: {
            id: 'national',
            label: '🇹🇷 Ulusal (Türkiye Odaklı)',
            badge: '🇹🇷 Ulusal (Türkiye Odaklı)',
            description: 'Türkiye şartlarına, regülasyonlarına (KVKK, GİB, e-Devlet), hibe/teşviklerine (TÜBİTAK, TEKNOFEST, KOSGEB) ve yerel sektörel sorunlarına odaklı projeler'
        },
        international: {
            id: 'international',
            label: '🌍 Uluslararası (Global)',
            badge: '🌍 Uluslararası (Global)',
            description: 'Küresel pazara, uluslararası standartlara (SOC2, GDPR, Stripe) ve dünya çapında ölçeklenebilir SaaS/açık kaynak ekosistemine odaklı projeler'
        }
    };

    // Asked the same question repeatedly, the model returns variations on a handful
    // of favourite ideas. Rotating a constraint combination through the prompt
    // pushes it into a different corner each time: 6 × 6 × 5 × 5 = 900 combinations,
    // multiplied again by the ecosystem axis below.
    const CONSTRAINT_AXES = {
        problemSource: [
            'regülasyon ve uyum baskısı (KVKK / GDPR / GİB e-Belge / BDDK)',
            'operasyonel maliyet ve verimsizlik baskısı',
            'manuel iş yükü ve tekrarlayan süreçler',
            'birbirinden kopuk veri siloları ve entegrasyon açığı',
            'afet, güvenlik ve kriz yönetimi açığı',
            'erişilebilirlik ve kapsayıcılık açığı'
        ],
        audience: [
            'KOBİ ve yerel işletmeler',
            'kurumsal şirketler ve ekipler',
            'bağımsız profesyoneller ve geliştiriciler',
            'kamu kurumları, belediyeler ve STK\'lar',
            'araştırmacılar, akademisyenler ve üniversiteler',
            'son kullanıcılar ve vatandaşlar'
        ],
        technical: [
            'uçta (edge) ve çevrimdışı öncelikli çalışma',
            'gizlilik korumalı yerel yapay zeka (On-prem / Private LLM)',
            'gerçek zamanlı veri akışı ve IoT sensör ağı',
            'mikroservis ve olay güdümlü (Event-Driven) mimari',
            'otonom yapay zeka ajanı ve iş akışı otomasyonu'
        ],
        revenue: [
            'B2B SaaS aboneliği',
            'işlem başına komisyon / pazaryeri modeli',
            'hibe, teşvik ve kurumsal lisanslama (TÜBİTAK/KOSGEB)',
            'kullanım bazlı (Pay-as-you-go) API ücretlendirmesi',
            'açık çekirdek (Open Core) ve kurumsal destek'
        ]
    };

    // Keyed by scope id so a lookup is `ECOSYSTEM_AXES[scope]` rather than a
    // hand-written mapping. The international list was originally called `global`,
    // which meant every read site had to remember that one of the two scopes goes
    // by a different name here than everywhere else in the codebase.
    const ECOSYSTEM_AXES = {
        national: [
            'TÜBİTAK 1512 BİGG ve 1507 KOBİ Ar-Ge hibe desteği',
            'TEKNOFEST yarışma kategorileri (Sağlık, Tarım, Çevre, Ulaşım, İnsansız Sistemler)',
            'KOSGEB Ar-Ge, İnovasyon ve Dijitalleşme Fonu',
            'GİB e-Fatura, e-Arşiv, e-İrsaliye ve Luca/Zirve muhasebe entegrasyonu',
            'MERNİS, e-Devlet Kapısı ve KPS kimlik doğrulama altyapısı',
            'Yerli ödeme sistemleri (İyzico, PayTR, FAST, Troy, Papara)',
            'Deprem, AFAD, Kandilli ve erken uyarı sistemleri',
            'Akıllı tarım, DSİ sulama otomasyonu ve Çiftçi Kayıt Sistemi (ÇKS)'
        ],
        international: [
            'Global SaaS ve Product Hunt lansman ekosistemi',
            'Stripe, LemonSqueezy çoklu para birimi ve global vergilendirme',
            'SOC2 Type II, ISO 27001 ve GDPR / CCPA veri güvenliği',
            'Multi-region AWS / GCP / Cloudflare Edge dağıtık altyapısı',
            'Açık kaynak geliştirici araçları (Developer Tooling & Open Core)'
        ]
    };

    // Escape every HTML-significant character so untrusted text can never
    // introduce markup when it is later assigned to innerHTML.
    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Minimal markdown subset. Project content is untrusted — it comes from the
    // Gemini API or from a localStorage pool that anyone with devtools can edit.
    // The input is escaped first, so the only tags in the output are the ones
    // produced below.
    function parseMarkdown(text) {
        if (!text) return '';
        let html = escapeHtml(text)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^[•*] (.*$)/gm, '<li>$1</li>');

        html = html.replace(/(<li>[\s\S]*?<\/li>)/g, (match) => `<ul>${match}</ul>`);
        html = html.replace(/<\/ul>\s*<ul>/g, '');
        return html;
    }

    // Validate the shape of a project object coming from an untrusted source
    // (Gemini, or a hand-edited localStorage pool) before it reaches the renderer.
    // Returns an error string, or null when the object is usable.
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
    function normalizeProject(obj, fallbackCategoryKey, now) {
        const p = { ...obj };
        const stamp = typeof now === 'number' ? now : Date.now();

        p.id = (typeof p.id === 'string' && p.id.trim()) ? p.id.trim() : `gemini-${stamp}`;
        p.categoryKey = typeof p.categoryKey === 'string' ? p.categoryKey : fallbackCategoryKey;
        p.scope = (typeof p.scope === 'string' && ['national', 'international', 'all'].includes(p.scope))
            ? p.scope
            : (p.meta && p.meta.scope) || 'all';
        p.meta = (p.meta && typeof p.meta === 'object') ? { ...p.meta } : {};
        p.diagramNodes = Array.isArray(p.diagramNodes)
            ? p.diagramNodes.filter(n => n && typeof n === 'object' && typeof n.name === 'string')
            : [];

        p.step1 = { ...p.step1 };
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

        // Detailed mode attaches this; quick mode and the bundled examples do not, so
        // it stays optional and validateProjectShape does not ask for it. What it does
        // need is clamping: a project that has been through the pool came back out of
        // localStorage, and its status ends up in a CSS class.
        if (p.verification && typeof p.verification === 'object') {
            const v = { ...p.verification };
            v.method = COMPARISON_METHODS[v.method] ? v.method : null;
            v.results = Array.isArray(v.results)
                ? v.results.filter(r => r && typeof r === 'object').map(r => ({
                    ...r,
                    status: safeEvidenceStatus(r.status),
                    sourceId: EVIDENCE_SOURCES[r.sourceId] ? r.sourceId : null,
                    link: (typeof r.link === 'string' && r.link.startsWith('https://')) ? r.link : null
                }))
                : [];
            p.verification = v;
        } else {
            delete p.verification;
        }

        return p;
    }

    // Restrict a node type to the palette that actually has styles. The value ends
    // up in a class attribute, so an arbitrary string is also an injection risk.
    function safeNodeType(type) {
        return NODE_TYPES.includes(type) ? type : 'service';
    }

    // The same guard, one layer along. An unknown status must not reach the class
    // attribute, and 'error' is the honest fallback: a result we cannot read is not
    // a finding.
    function safeEvidenceStatus(status) {
        return EVIDENCE_STATUSES.includes(status) ? status : 'error';
    }

    // Draw one value from each constraint axis. Returned as a plain object so the
    // caller can both build a prompt from it and show it to the user.
    function pickConstraintCombo(random, scope = 'all') {
        const rng = typeof random === 'function' ? random : Math.random;
        const combo = {};
        for (const [axis, values] of Object.entries(CONSTRAINT_AXES)) {
            combo[axis] = values[Math.floor(rng() * values.length)];
        }

        // 'all' draws from both pools, so a hybrid run can still land on a Turkish
        // grant programme or a global compliance angle rather than neither.
        const pool = ECOSYSTEM_AXES[scope]
            || [...ECOSYSTEM_AXES.national, ...ECOSYSTEM_AXES.international];
        combo.ecosystem = pool[Math.floor(rng() * pool.length)];

        return combo;
    }

    // Comparison key for titles: case, punctuation and spacing differences should
    // not make "AI Destekli Rapor" and "ai-destekli rapor" look like separate ideas.
    // This app is Turkish, and plain .toLowerCase() is wrong for Turkish in both
    // directions: 'I' becomes 'i' instead of 'ı', and 'İ' becomes 'i' followed by a
    // combining dot (U+0307). That second one was the damaging case — the combining
    // mark is not a letter, so the punctuation pass turned it into a space and split
    // the word in half: "TEKNOLOJİLERİ" normalised to "teknoloji leri". An
    // all-caps title therefore shared *no* words with its own lowercase form and
    // scored 0 overlap, which is exactly the duplicate the check exists to catch.
    //
    // Switching to toLocaleLowerCase('tr') is the obvious fix and it is wrong here:
    // it also turns the ASCII "AI" into "aı", and this app's titles are full of
    // English acronyms (AI, API, IoT, CI/CD) that would then stop matching their
    // own lowercase forms. Since this text is only ever compared, never displayed,
    // the right move is to stop distinguishing the two letters at all: lowercase
    // normally, drop the combining dot the 'İ' leaves behind, then fold 'ı' onto
    // 'i'. "TARIM"/"tarım" and "AI"/"ai" both match, and neither is favoured.
    function normalizeTitle(text) {
        return String(text || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')   // combining marks, incl. the İ dot
            .normalize('NFC')
            .replace(/ı/g, 'i')
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Turkish is agglutinative, so the same root turns up with different endings:
    // "Tarım" and "Tarımsal", "Teknoloji" and "Teknolojileri". Exact word equality
    // called those unrelated and let obvious repeats through. Two words count as
    // the same root when one is a prefix of the other and the shared prefix is long
    // enough that the match is not a coincidence.
    const STEM_MIN = 5;

    function sameRoot(a, b) {
        if (a === b) return true;
        const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
        if (shorter.length < STEM_MIN) return false;
        if (!longer.startsWith(shorter)) return false;
        // A long tail means these are different words that happen to share an
        // opening ("kart" / "kartograf"), not one word plus a suffix.
        return longer.length - shorter.length <= 4;
    }

    // How much two titles share, as a fraction of the shorter one. Catches the
    // common near-duplicate ("Akıllı Sulama Ağı" vs "Akıllı Sulama Platformu")
    // that an exact-match check would let through.
    function titleOverlap(a, b) {
        const words = t => normalizeTitle(t).split(' ').filter(w => w.length > 3);
        const A = words(a);
        const B = words(b);
        if (A.length === 0 || B.length === 0) return 0;

        // Each word on the shorter side may be claimed once, so a title that
        // repeats a word cannot inflate its own score past 1.
        const unclaimed = [...B];
        let shared = 0;
        for (const w of A) {
            const hit = unclaimed.findIndex(other => sameRoot(w, other));
            if (hit !== -1) {
                unclaimed.splice(hit, 1);
                shared++;
            }
        }
        return shared / Math.min(A.length, B.length);
    }

    // Human-readable domain names for prompts — the filter keys are not descriptive
    // enough on their own ("web3" tells the model far less than the full phrase).
    const CATEGORY_LABELS = {
        all: 'herhangi bir yazılım',
        'health-ai': 'sağlık teknolojileri ve tıbbi yapay zeka',
        web3: 'Web3, blokzincir ve kripto güvenliği',
        infrastructure: 'bulut altyapısı, dağıtık sistemler ve performans',
        edtech: 'eğitim teknolojileri',
        sustainability: 'sürdürülebilirlik, enerji ve endüstriyel IoT',
        devops: 'DevOps ve yazılım geliştirme araçları',
        design: 'web ve ürün tasarımı, tasarım sistemleri, erişilebilirlik ve tasarım-kod iş akışı',
        mobile: 'mobil uygulama geliştirme (iOS, Android, çapraz platform)'
    };

    // ---- Model sağlayıcıları ------------------------------------------------
    // The app was Gemini-only. Other vendors are supported because a user may
    // already pay for one, but nothing about them is interchangeable: endpoint,
    // auth header, request body, response envelope and JSON-mode support all
    // differ. Each entry below states all five, so supporting a sixth vendor is a
    // data change rather than a rewrite of the request path.
    //
    // No secret passes through this file. A provider declares the *name* of its
    // auth header and the prefix its value carries; app.js holds the credential
    // and is the only place that fills it in.
    //
    // `free: false` means the vendor bills from the first request — there is no
    // free API tier at Anthropic or OpenAI. The UI has to say so before a key is
    // accepted, which is what `costNote` is for.
    const PROVIDERS = {
        gemini: {
            id: 'gemini',
            label: 'Google Gemini',
            free: true,
            costNote: 'Ücretsiz katman var. Faturalandırma kapalıyken ücret çıkmaz.',
            keyPlaceholder: 'AIzaSy...',
            consoleUrl: 'https://aistudio.google.com/app/apikey',
            consoleLabel: 'Google AI Studio',
            origin: 'https://generativelanguage.googleapis.com',
            // A longer fallback list is good for reliability, but the order matters
            // more than the length: every entry that fails costs a round trip before
            // the next one is tried.
            //
            // The -latest aliases go first because Google repoints them as models
            // retire, so they cannot go stale. Pinned names can and do: measured on
            // this project, gemini-2.5-flash returns 404 "no longer available to new
            // users" and gemini-2.5-flash-lite is gone entirely for new keys — which
            // is why they sit at the end rather than the front. Keys issued before
            // that change can still reach them, so they stay as a last resort.
            models: [
                'gemini-flash-latest',
                'gemini-2.0-flash',
                'gemini-flash-lite-latest',
                'gemini-2.0-flash-lite',
                'gemini-2.5-flash',
                'gemini-2.5-flash-lite'
            ],
            nativeJsonMode: true
        },
        anthropic: {
            id: 'anthropic',
            label: 'Anthropic Claude',
            free: false,
            costNote: 'Ücretsiz katmanı yok — her istek kullandığın kadar ücretlendirilir.',
            keyPlaceholder: 'sk-ant-...',
            consoleUrl: 'https://console.anthropic.com/settings/keys',
            consoleLabel: 'Anthropic Console',
            origin: 'https://api.anthropic.com',
            models: ['claude-haiku-4-5', 'claude-sonnet-5'],
            // Anthropic blocks direct browser calls by default precisely because a
            // key in a browser can be read by anything running on the page. We send
            // the opt-in header to make the call work at all, so the user should be
            // told what that opt-in means rather than it happening quietly.
            browserNote: 'Bu çağrı tarayıcıdan doğrudan yapılır; Anthropic bunu '
                + 'varsayılan olarak kapatır çünkü anahtar istemcide durur. '
                + 'Paylaşılan bir bilgisayardaysan saklamayı kapat.',
            // No JSON response mode; the prompt already pins the schema and the
            // shared extractor tolerates a fenced code block around it.
            nativeJsonMode: false
        },
        openai: {
            id: 'openai',
            label: 'OpenAI ChatGPT',
            free: false,
            costNote: 'Ücretsiz katmanı yok — her istek kullandığın kadar ücretlendirilir.',
            keyPlaceholder: 'sk-...',
            consoleUrl: 'https://platform.openai.com/api-keys',
            consoleLabel: 'OpenAI Platform',
            origin: 'https://api.openai.com',
            models: ['gpt-4o-mini', 'gpt-4o'],
            nativeJsonMode: true,
            // Measured 8 Aug 2026 against api.openai.com from a localhost page:
            // the preflight comes back with no Access-Control-Allow-Origin at all,
            // so the browser drops the request before the key is even checked.
            // Anthropic works because it ships an explicit opt-in header for this;
            // OpenAI has no equivalent. Supporting it would need a server to relay
            // the call, and this project deliberately has no backend — that is what
            // keeps the key on the user's machine.
            //
            // The entry stays so the picker can say why rather than failing with
            // "Failed to fetch", and so the day OpenAI enables CORS it is one flag.
            browserBlocked: true,
            blockedReason: 'OpenAI tarayıcıdan doğrudan çağrıya izin vermiyor (CORS). '
                + 'Bu proje sunucusuz olduğu için aradan geçecek bir servis yok.'
        }
    };

    // Gemini stays the default: it is the only one of the three a user can run
    // without a payment method, and this project promises to be free by default.
    const DEFAULT_PROVIDER = 'gemini';

    // Appended to every prompt sent to a provider that has no JSON response mode.
    // Without it those models answer in prose around the object, and while
    // parseJsonResponse recovers from that, not asking for it wastes tokens on
    // commentary nobody reads.
    const JSON_ONLY_SUFFIX = '\n\nYalnızca istenen JSON nesnesini döndür. ' +
        'Açıklama, giriş cümlesi veya kod bloğu işareti ekleme.';

    // hasOwn, not a truthiness check: PROVIDERS['constructor'] resolves up the
    // prototype chain to Object.prototype.constructor, which is truthy, so a
    // stored provider id of "constructor" or "__proto__" returned the Function
    // constructor instead of a provider — and every `.label` / `.models` read
    // after it was undefined.
    function isKnownProvider(providerId) {
        return typeof providerId === 'string' && Object.hasOwn(PROVIDERS, providerId);
    }

    function getProvider(providerId) {
        return isKnownProvider(providerId) ? PROVIDERS[providerId] : PROVIDERS[DEFAULT_PROVIDER];
    }

    // Shape one completion request. Returns the URL, the body, and the *name* and
    // prefix of the auth header — never its value.
    function buildProviderRequest(providerId, model, prompt, options) {
        const opts = options || {};
        const maxTokens = opts.maxTokens || 4096;
        const temperature = typeof opts.temperature === 'number' ? opts.temperature : 0.7;

        if (providerId === 'anthropic') {
            return {
                url: `${PROVIDERS.anthropic.origin}/v1/messages`,
                authHeader: { name: 'x-api-key', prefix: '' },
                extraHeaders: {
                    'anthropic-version': '2023-06-01',
                    // Without this the browser request is rejected before it is
                    // sent; Anthropic blocks direct browser calls by default
                    // because it means the key lives on the client.
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: {
                    model,
                    max_tokens: maxTokens,
                    // temperature is deliberately omitted: the newer Claude models
                    // reject any non-default sampling parameter with a 400, and a
                    // fallback list that spans generations must work on both.
                    messages: [{ role: 'user', content: prompt }]
                }
            };
        }

        if (providerId === 'openai') {
            return {
                url: `${PROVIDERS.openai.origin}/v1/chat/completions`,
                authHeader: { name: 'Authorization', prefix: 'Bearer ' },
                extraHeaders: {},
                body: {
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: maxTokens,
                    temperature,
                    response_format: { type: 'json_object' }
                }
            };
        }

        return {
            url: `${PROVIDERS.gemini.origin}/v1beta/models/${model}:generateContent`,
            authHeader: { name: 'x-goog-api-key', prefix: '' },
            extraHeaders: {},
            body: {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    maxOutputTokens: maxTokens,
                    temperature,
                    // Reasoning is kept short so it does not eat the output budget.
                    // The field name is generation-specific and has already changed
                    // twice; app.js drops the block and retries if a model rejects
                    // this spelling too.
                    thinkingConfig: { thinkingLevel: 'low' }
                }
            }
        };
    }

    // Pull the assistant's text out of whichever envelope came back. Every step
    // that can be missing is checked: an unguarded index here turned a refusal or a
    // truncated answer into "undefined is not an object" further down.
    function extractProviderText(providerId, payload, label) {
        const what = label || 'Yanıt';
        const data = payload || {};

        if (providerId === 'anthropic') {
            if (data.stop_reason === 'refusal') {
                throw new Error(`${what}: model isteği reddetti`);
            }
            if (data.stop_reason === 'max_tokens') {
                throw new Error(`${what}: yanıt token sınırına takıldı`);
            }
            const blocks = Array.isArray(data.content) ? data.content : [];
            const text = blocks
                .filter(b => b && b.type === 'text' && typeof b.text === 'string')
                .map(b => b.text)
                .join('');
            if (!text.trim()) throw new Error(`${what}: yanıtta metin bulunamadı`);
            return text;
        }

        if (providerId === 'openai') {
            const choice = Array.isArray(data.choices) ? data.choices[0] : null;
            if (!choice) throw new Error(`${what}: boş yanıt döndü`);
            if (choice.finish_reason === 'length') {
                throw new Error(`${what}: yanıt token sınırına takıldı`);
            }
            if (choice.finish_reason === 'content_filter') {
                throw new Error(`${what}: istek içerik filtresine takıldı`);
            }
            const text = choice.message && typeof choice.message.content === 'string'
                ? choice.message.content
                : '';
            if (!text.trim()) throw new Error(`${what}: yanıtta metin bulunamadı`);
            return text;
        }

        const candidate = Array.isArray(data.candidates) ? data.candidates[0] : null;
        if (!candidate) {
            const blockReason = data.promptFeedback && data.promptFeedback.blockReason;
            throw new Error(blockReason
                ? `${what}: istek güvenlik filtresine takıldı (${blockReason})`
                : `${what}: model boş yanıt döndürdü`);
        }
        if (candidate.finishReason && candidate.finishReason !== 'STOP') {
            throw new Error(`${what}: yanıt tamamlanamadı (finishReason: ${candidate.finishReason})`);
        }
        const parts = candidate.content && Array.isArray(candidate.content.parts)
            ? candidate.content.parts
            : [];
        const text = parts.map(p => (p && typeof p.text === 'string' ? p.text : '')).join('');
        if (!text.trim()) throw new Error(`${what}: yanıtta metin bulunamadı`);
        return text;
    }

    // Providers without a JSON mode wrap the object in prose or a fenced block, so
    // JSON.parse on the raw text fails on a perfectly good answer. Take the widest
    // brace-delimited span rather than rejecting it.
    function parseJsonResponse(text, label) {
        const what = label || 'Yanıt';
        const raw = String(text || '').trim();

        const attempts = [raw];
        const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (fenced) attempts.push(fenced[1].trim());

        const first = raw.indexOf('{');
        const last = raw.lastIndexOf('}');
        if (first !== -1 && last > first) attempts.push(raw.slice(first, last + 1));

        for (const attempt of attempts) {
            if (!attempt) continue;
            try {
                const parsed = JSON.parse(attempt);
                // Arrays are objects too, and both callers want a keyed object. An
                // array slipped through and then failed downstream as "Fikir listesi
                // boş döndü", which points at the model rather than the shape.
                if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
            } catch { /* try the next shape */ }
        }
        throw new Error(`${what}: geçerli JSON döndürmedi`);
    }

    // Token accounting is reported under a different name by each vendor; the
    // terminal shows one number, so normalise here.
    function readUsageTokens(providerId, payload) {
        const data = payload || {};
        if (providerId === 'anthropic') {
            const u = data.usage || {};
            return (u.input_tokens || 0) + (u.output_tokens || 0);
        }
        if (providerId === 'openai') {
            return (data.usage && data.usage.total_tokens) || 0;
        }
        return (data.usageMetadata && data.usageMetadata.totalTokenCount) || 0;
    }

    // The ideation prompt lives here rather than in app.js so the measurement script
    // exercises the exact text the app sends. A separate copy would drift, and then
    // the diversity numbers would describe a prompt nobody ships.
    function buildIdeationPrompt(categoryLabel, count, combo, avoidTitles, scope = 'all') {
        const avoid = (Array.isArray(avoidTitles) ? avoidTitles : [])
            .filter(t => typeof t === 'string' && t.trim());

        const avoidBlock = avoid.length
            ? '\n\nBu fikirler kullanıcıya zaten gösterildi. Bunlardan ve varyasyonlarından KAÇIN:\n'
              + avoid.map(t => '- ' + t).join('\n')
            : '';

        let scopeInstruction = '';
        if (scope === 'national') {
            scopeInstruction = '\nÖZEL ODAK: 🇹🇷 ULUSAL (Türkiye Şartları & Yerel Pazar). Fikirler Türkiye\'deki regülasyonlara (KVKK, GİB, e-Devlet, BDDK), yerli desteklere (TÜBİTAK 1512/1507, TEKNOFEST, KOSGEB) ve yerel sektörel ihtiyaçlara tam uyumlu olsun.';
        } else if (scope === 'international') {
            scopeInstruction = '\nÖZEL ODAK: 🌍 ULUSLARARASI (Global Pazar). Fikirler küresel pazara (Global SaaS, Stripe, SOC2, GDPR, Cloudflare Edge, YC/Product Hunt) hitap eden ve dünya çapında ölçeklenebilir olsun.';
        }

        const ecosystemLine = combo.ecosystem ? `\n- Ekosistem & Pazar açısı: ${combo.ecosystem}` : '';

        return `${categoryLabel} alanında ${count} farklı yazılım projesi fikri üret.${scopeInstruction}

Her fikir şu kısıtlara uysun:
- Problem kaynağı: ${combo.problemSource}
- Hedef kullanıcı: ${combo.audience}
- Teknik yaklaşım: ${combo.technical}
- Gelir modeli: ${combo.revenue}${ecosystemLine}

Kısıtlardan biri bu alana zorlama geliyorsa onu yumuşat, ama tamamen yok sayma.
Fikirler birbirinden belirgin şekilde farklı problemleri çözsün; aynı problemin
varyasyonlarını yazma.${avoidBlock}

Yanıtı şu JSON şemasında ver:
{ "ideas": [ { "title": "Kısa proje adı", "summary": "Tek cümlelik açıklama" } ] }`;
    }

    // Choose an idea the user has not already been shown.
    //
    // The model is asked for several one-line ideas rather than one full project,
    // because filtering one-liners is both cheaper and more accurate than comparing
    // finished blueprints — and it means a repeat costs nothing to discard.
    //
    // Returns { idea, freshCount, exhausted }:
    //   exhausted — every idea in the batch was already known, so the least similar
    //               one is returned rather than spending another call.
    function selectFreshIdea(ideas, knownTitles, random) {
        const rng = typeof random === 'function' ? random : Math.random;

        const usable = (Array.isArray(ideas) ? ideas : []).filter(
            i => i && typeof i.title === 'string' && i.title.trim()
        );
        if (usable.length === 0) return { idea: null, freshCount: 0, exhausted: false };

        const known = (Array.isArray(knownTitles) ? knownTitles : []).filter(
            t => typeof t === 'string' && t.trim()
        );

        const SIMILAR = 0.6;
        const fresh = usable.filter(
            idea => !known.some(t => titleOverlap(idea.title, t) >= SIMILAR)
        );

        if (fresh.length > 0) {
            return {
                idea: fresh[Math.floor(rng() * fresh.length)],
                freshCount: fresh.length,
                exhausted: false
            };
        }

        // Nothing new in this batch — fall back to whichever is least like anything
        // already seen, so the user still gets a result.
        const leastSimilar = usable.reduce((best, idea) => {
            const worst = Math.max(0, ...known.map(t => titleOverlap(idea.title, t)));
            return worst < best.score ? { idea, score: worst } : best;
        }, { idea: usable[0], score: Infinity });

        return { idea: leastSimilar.idea, freshCount: 0, exhausted: true };
    }

    // Pick a project at random, avoiding an immediate repeat.
    // De-duplication is by id, not by index: indices belong to the *filtered* list,
    // so after a filter change a remembered index points at an unrelated project.
    function pickRandomProject(projects, lastId, random) {
        if (!Array.isArray(projects) || projects.length === 0) return null;
        const rng = typeof random === 'function' ? random : Math.random;

        const pickable = projects.length > 1
            ? projects.filter(p => p.id !== lastId)
            : projects;

        return pickable[Math.floor(rng() * pickable.length)];
    }

    // Pick a project the user has not been shown yet.
    //
    // Skipping only the immediately previous project meant a category with three
    // entries still felt like it was cycling through the same two. Tracking the
    // whole seen set instead turns N examples into N distinct results before
    // anything repeats.
    //
    // Returns { project, exhausted, seen }:
    //   exhausted — every candidate had been seen, so the set was cleared and the
    //               pick is from a fresh cycle. The caller can tell the user.
    //   seen      — the updated set, for the caller to persist.
    function pickUnseenProject(projects, seenIds, random) {
        if (!Array.isArray(projects) || projects.length === 0) {
            return { project: null, exhausted: false, seen: seenIds || [] };
        }
        const rng = typeof random === 'function' ? random : Math.random;
        const seen = new Set(Array.isArray(seenIds) ? seenIds : []);

        let candidates = projects.filter(p => !seen.has(p.id));
        let exhausted = false;

        if (candidates.length === 0) {
            // Everything in this filter has been shown — start a new cycle, but keep
            // ids from other categories so their history is not lost.
            exhausted = true;
            const inThisSet = new Set(projects.map(p => p.id));
            for (const id of [...seen]) if (inThisSet.has(id)) seen.delete(id);

            // The project on screen right now must not be a candidate for the very
            // next press. Restarting the cycle over the full list made it one, so a
            // two-project bucket showed the same project twice in a row half the
            // time — the exact "it keeps suggesting the same thing" complaint the
            // rotation exists to prevent.
            const lastShownId = Array.isArray(seenIds) && seenIds.length
                ? seenIds[seenIds.length - 1]
                : null;
            const withoutLast = projects.filter(p => p.id !== lastShownId);
            candidates = withoutLast.length > 0 ? withoutLast : projects;
        }

        const project = candidates[Math.floor(rng() * candidates.length)];
        seen.add(project.id);

        return { project, exhausted, seen: [...seen] };
    }

    // Decide whether a Gemini call may proceed. Pure: callers pass the clock and
    // the recorded history, and get back both the verdict and the pruned history.
    function evaluateRateLimit(now, lastCallTimestamp, callHistory, options) {
        const cooldownMs = options.cooldownMs;
        const maxPerHour = options.maxPerHour;

        const recent = (Array.isArray(callHistory) ? callHistory : [])
            .filter(ts => ts > now - 3600000);

        const sinceLast = now - lastCallTimestamp;
        if (sinceLast < cooldownMs) {
            const secondsLeft = Math.ceil((cooldownMs - sinceLast) / 1000);
            return {
                allowed: false,
                history: recent,
                reason: `Güvenlik & Kota Koruması: Lütfen ${secondsLeft} saniye bekleyin.`
            };
        }

        if (recent.length >= maxPerHour) {
            return {
                allowed: false,
                history: recent,
                reason: `Saatlik Gemini API limitine (${maxPerHour} sorgu/saat) ulaşıldı. Otomatik dahili motora geçiliyor.`
            };
        }

        return { allowed: true, history: recent };
    }

    // Render a project as a Markdown blueprint document.
    function buildBlueprintMarkdown(p) {
        if (!p) return '';
        const meta = p.meta || {};
        const step1 = p.step1 || {};
        const scope = p.scope || meta.scope || 'all';
        const scopeLabel = (SCOPE_PRESETS[scope] || SCOPE_PRESETS.all).badge;

        let doc = `# ${p.title} — Technical Blueprint & Architecture\n\n`;
        doc += `> **Slogan**: ${p.tagline}\n`;
        doc += `> **Kategori**: ${p.category}\n`;
        doc += `> **Pazar Kapsamı**: ${scopeLabel}\n`;
        doc += `> **Fırsat Skoru**: ${meta.opportunityScore || 'N/A'}\n`;
        doc += `> **Zorluk Düzeyi**: ${meta.difficulty || 'N/A'}\n`;
        doc += `> **Tahmini MVP Süresi**: ${meta.mvpTime || 'N/A'}\n`;
        doc += `> **Gelir Modeli**: ${meta.monetization || 'N/A'}\n\n`;
        doc += `---\n\n`;
        doc += `## 1. ALANDAKİ AÇIK (Pazar Problemi & Fırsat)\n\n${step1.marketGap || ''}\n\n`;
        doc += `---\n\n`;
        doc += `## 2. DETAYLI PROJE AÇIKLAMASI & ÖZELLİKLER\n\n${step1.description || ''}\n\n`;
        doc += `---\n\n`;

        // Detailed mode attaches a verification block; quick mode and the bundled
        // examples do not. The numbering only shifts when the section is actually
        // there, so an existing report keeps the headings it has always had.
        let section = 3;

        if (p.verification) {
            doc += `## ${section}. KIYAS VE DOĞRULAMA\n\n${buildVerificationMarkdown(p.verification)}\n`;
            doc += `---\n\n`;
            section += 1;
        }

        if (p.step2) {
            doc += `## ${section}. KOD MİMARİSİ VE SİSTEM KATMANLARI\n\n${p.step2.architecture}\n\n`;
            doc += `---\n\n`;
            section += 1;
            doc += `## ${section}. GÜVENLİK YAPISI & RISK ÖNLEME TEDBİRLERİ\n\n${p.step2.security}\n\n`;
        }

        doc += `---\n*Generated by Aetheria.ai (Aetheria Agent)*\n`;
        return doc;
    }

    // ── Ayrıntılı üretim: açı, kıyas metodu ve ağırlıklı seçim ──────────────
    //
    // Detailed mode replaces quick mode's random pick with a weighted one: the
    // user says what matters, and the app shows what it chose and why.

    // How the model should come at the material. The angle changes what kind of
    // idea comes back; it has no effect on how one is scored.
    const IDEATION_ANGLES = {
        contrarian: {
            id: 'contrarian',
            label: '🔀 Aykırı Görüş',
            promptGuidance: 'Alanda yaygın kabul gören bir varsayımı tersine çevir. '
                + 'Fikir, "herkes X yapıyor ama Y daha doğru" biçiminde bir gerilim taşısın.'
        },
        story: {
            id: 'story',
            label: '📖 Kişisel Hikaye',
            promptGuidance: 'Somut, tek bir kullanıcının yaşadığı bir sıkıntıdan yola çık. '
                + 'Soyut pazar büyüklüğü değil, yaşanan an anlatılsın.'
        },
        evidence: {
            id: 'evidence',
            label: '📊 Veri / Kanıt',
            promptGuidance: 'Fikri ölçülebilir bir gözleme dayandır. '
                + 'Kaynak materyalde sayı, oran veya tarih varsa onu merkeze al.'
        },
        practical: {
            id: 'practical',
            label: '🔧 Pratik Uygulama',
            promptGuidance: 'Yarın inşa edilmeye başlanabilecek kadar somut ol. '
                + 'Kapsamı tek bir MVP içine sığacak şekilde daralt.'
        }
    };

    // How the idea is positioned against something that already exists.
    //
    // `verifiability` reaches the user as a badge and is not decoration: the four
    // methods are genuinely not equally checkable.
    //   measurable   — a free source returns a number that settles it
    //   partial      — "it exists over there" is checkable, "it is missing here" is not
    //   unverifiable — no free source holds this distinction at all
    //
    // Keeping the weak ones rather than hiding them is deliberate. Dropping the
    // unverifiable method would quietly imply the remaining three are all solid.
    const COMPARISON_METHODS = {
        sector: {
            id: 'sector',
            label: 'Sektör transferi',
            referenceLabel: 'Çözümün olgunlaştığı sektör',
            verifiability: 'measurable',
            verifyStrategy: 'sector-asymmetry',
            promptGuidance: 'Bir sektörde olgunlaşmış bir çözümün başka bir sektörde '
                + 'neden hâlâ uygulanmadığını açıkla.'
        },
        time: {
            id: 'time',
            label: 'Zaman / olgunluk',
            referenceLabel: 'Karşılaştırılacak dönem',
            verifiability: 'measurable',
            verifyStrategy: 'year-histogram',
            promptGuidance: 'Yakın zamanda ucuzlayan veya erişilebilir hale gelen bir '
                + 'teknolojinin daha önce imkânsız kıldığı şeyi anlat.'
        },
        country: {
            id: 'country',
            label: 'Ülke / pazar',
            referenceLabel: 'Referans ülke veya pazar',
            verifiability: 'partial',
            verifyStrategy: 'named-entity',
            promptGuidance: 'Başka bir pazarda adı konmuş, aranabilir bir örneği referans al. '
                + 'Türkiye\'deki karşılığını biliyorsan adını yaz, bilmiyorsan bilmediğini yaz.'
        },
        scale: {
            id: 'scale',
            label: 'Ölçek (kurumsal ↔ KOBİ)',
            referenceLabel: 'Çözümün bugün hitap ettiği ölçek',
            verifiability: 'unverifiable',
            verifyStrategy: null,
            promptGuidance: 'Yalnızca büyük kurumların erişebildiği bir yeteneği küçük '
                + 'işletmelerin kullanabileceği biçime indirgemeyi anlat.'
        }
    };

    // The four axes an idea is scored on, with the weights the panel opens at.
    // The weights belong to the user; these are only the starting position.
    const SCORING_CRITERIA = {
        evidence: { id: 'evidence', label: 'Kanıt gücü', defaultWeight: 40 },
        feasibility: { id: 'feasibility', label: 'Uygulanabilirlik', defaultWeight: 30 },
        gap: { id: 'gap', label: 'Pazar boşluğu', defaultWeight: 20 },
        originality: { id: 'originality', label: 'Teknik özgünlük', defaultWeight: 10 }
    };

    // Pasted material is billed as prompt tokens on every generation, so it is
    // capped rather than trusted to arrive short.
    const SOURCE_MATERIAL_MAX_CHARS = 12000;

    // Turn whatever the panel produced into weights that sum to 1.
    //
    // Unknown keys are dropped rather than carried through, so a stale
    // localStorage entry written by an older build cannot introduce a criterion
    // the scorer has no idea how to apply. Every slider at zero is a state the UI
    // can reach, and dividing by that total would make every score NaN — it falls
    // back to an equal split instead.
    function normalizeWeights(raw) {
        const ids = Object.keys(SCORING_CRITERIA);
        const cleaned = {};
        let sum = 0;

        for (const id of ids) {
            const value = raw && Number.isFinite(raw[id]) ? raw[id] : 0;
            const clamped = Math.min(100, Math.max(0, value));
            cleaned[id] = clamped;
            sum += clamped;
        }

        if (sum === 0) {
            const equal = 1 / ids.length;
            for (const id of ids) cleaned[id] = equal;
            return cleaned;
        }

        for (const id of ids) cleaned[id] = cleaned[id] / sum;
        return cleaned;
    }

    // Score every idea against the weights and return them best-first.
    //
    // `breakdown` travels with the total because the UI has to be able to say why
    // an idea won. A bare number would be one more thing the user has to take on
    // trust, which is the habit this mode exists to break.
    function scoreIdeas(ideas, weights) {
        const w = normalizeWeights(weights);

        return (Array.isArray(ideas) ? ideas : [])
            .filter(idea => idea && typeof idea === 'object')
            .map(idea => {
                const scores = idea.scores || {};
                const breakdown = Object.keys(SCORING_CRITERIA).map(id => {
                    const raw = Number.isFinite(scores[id]) ? scores[id] : 0;
                    const score = Math.min(100, Math.max(0, raw));
                    return {
                        criterion: id,
                        label: SCORING_CRITERIA[id].label,
                        score,
                        weight: w[id],
                        contribution: score * w[id]
                    };
                });

                return {
                    idea,
                    total: breakdown.reduce((total, b) => total + b.contribution, 0),
                    breakdown
                };
            })
            .sort((a, b) => b.total - a.total);
    }

    // Pick the idea the weights actually favour.
    //
    // Freshness is applied first and scoring second, never the other way round: a
    // high score must not buy an idea past the repeat filter, or moving a slider
    // would start handing back projects the user has already been shown.
    //
    // `random` breaks exact ties only — the winner is otherwise fully determined by
    // the weights, which is what makes "move a slider, get a different idea"
    // testable. selectFreshIdea is deliberately left alone: quick mode wants a
    // random pick, and that is the right behaviour there.
    function pickWeightedIdea(ideas, knownTitles, weights, random) {
        const rng = typeof random === 'function' ? random : Math.random;

        const usable = (Array.isArray(ideas) ? ideas : []).filter(
            i => i && typeof i.title === 'string' && i.title.trim()
        );
        if (usable.length === 0) {
            return { idea: null, scored: [], freshCount: 0, exhausted: false };
        }

        const known = (Array.isArray(knownTitles) ? knownTitles : []).filter(
            t => typeof t === 'string' && t.trim()
        );

        const SIMILAR = 0.6;
        const fresh = usable.filter(
            idea => !known.some(t => titleOverlap(idea.title, t) >= SIMILAR)
        );

        const exhausted = fresh.length === 0;
        const scored = scoreIdeas(exhausted ? usable : fresh, weights);

        const best = scored[0].total;
        const tied = scored.filter(s => s.total === best);
        const winner = tied.length > 1 ? tied[Math.floor(rng() * tied.length)] : tied[0];

        return { idea: winner.idea, scored, freshCount: fresh.length, exhausted };
    }

    // Cut pasted material down to the token budget, at a word boundary when one is
    // close enough that the cut does not cost most of the final line.
    function clampSourceMaterial(text) {
        const raw = typeof text === 'string' ? text : '';
        if (raw.length <= SOURCE_MATERIAL_MAX_CHARS) {
            return { text: raw, chars: raw.length, truncated: false };
        }

        const slice = raw.slice(0, SOURCE_MATERIAL_MAX_CHARS);
        const lastBreak = slice.search(/\s\S*$/);
        const cut = lastBreak > SOURCE_MATERIAL_MAX_CHARS * 0.9
            ? slice.slice(0, lastBreak)
            : slice;

        return { text: cut, chars: cut.length, truncated: true };
    }

    // Pass 1 of detailed mode: ask for several candidates, each already carrying
    // its comparison claim, its search terms and its own scores.
    //
    // Two of the rules in here are load-bearing rather than stylistic:
    //
    //   1. With material present the quote must be verbatim from it. A paraphrase
    //      cannot be checked against the document the user actually pasted.
    //   2. referenceExample must be a searchable name. "bazı Avrupa ülkelerinde
    //      benzer çözümler" is unfalsifiable by construction, and the model is told
    //      outright that the name will be looked up — which on its own changes what
    //      it writes.
    function buildDetailedIdeationPrompt(opts) {
        const o = opts || {};
        const count = Number.isFinite(o.count) && o.count > 0 ? Math.floor(o.count) : 8;
        const categoryLabel = o.categoryLabel || CATEGORY_LABELS.all;
        const angle = IDEATION_ANGLES[o.angle] || IDEATION_ANGLES.evidence;
        const method = COMPARISON_METHODS[o.method] || COMPARISON_METHODS.sector;
        const reference = typeof o.reference === 'string' ? o.reference.trim() : '';

        const material = clampSourceMaterial(o.sourceMaterial);
        const materialBlock = material.text
            ? '\n\nKAYNAK MATERYAL — fikirler bu metne dayansın:\n"""\n'
                + material.text + '\n"""\n'
                + (material.truncated ? '(Metin uzunluk sınırı nedeniyle kesildi.)\n' : '')
            : '';

        const avoid = (Array.isArray(o.avoidTitles) ? o.avoidTitles : [])
            .filter(t => typeof t === 'string' && t.trim());
        const avoidBlock = avoid.length
            ? '\n\nBu fikirler kullanıcıya zaten gösterildi. Bunlardan ve varyasyonlarından KAÇIN:\n'
                + avoid.map(t => '- ' + t).join('\n')
            : '';

        let scopeInstruction = '';
        if (o.scope === 'national') {
            scopeInstruction = '\nÖZEL ODAK: 🇹🇷 ULUSAL (Türkiye şartları ve yerel pazar).';
        } else if (o.scope === 'international') {
            scopeInstruction = '\nÖZEL ODAK: 🌍 ULUSLARARASI (global pazar).';
        }

        const referenceLine = reference ? `\n- ${method.referenceLabel}: ${reference}` : '';

        const quoteRule = material.text
            ? 'evidence.quote alanı KAYNAK MATERYALDEN BİREBİR alıntı olsun ve '
                + 'evidence.kind "source" olsun. Alıntıyı değiştirme, özetleme, kısaltma.'
            : 'Kaynak materyal verilmedi; evidence.kind "model-knowledge" olsun ve '
                + 'evidence.quote alanına dayandığın genel gözlemi yaz.';

        return `${categoryLabel} alanında ${count} farklı yazılım projesi fikri üret.${scopeInstruction}

FİKİR AÇISI — ${angle.label}: ${angle.promptGuidance}

KIYAS METODU — ${method.label}: ${method.promptGuidance}${referenceLine}${materialBlock}${avoidBlock}

Her fikir için şu kurallara uy:

1. ${quoteRule}

2. comparison.referenceExample ADI KONMUŞ, aranabilir bir ürün, hizmet veya program
   olmalı. "bazı Avrupa ülkelerinde benzer çözümler" gibi belirsiz ifadeler REDDEDİLİR.
   Yazdığın bu ad otomatik olarak aranacak ve sonucu kullanıcıya gösterilecek.

3. comparison.howToCheck alanına, kullanıcının bu iddiayı KENDİ BAŞINA nasıl
   doğrulayabileceğini yaz — hangi kaynağa bakacağını, ne arayacağını.

4. comparison.localState alanına Türkiye'deki karşılığın adını yaz. Karşılığı olmadığını
   düşünüyorsan bunu açıkça belirt; emin değilsen emin olmadığını yaz.

5. comparison.concept, comparison.referenceSector ve comparison.targetSector
   alanlarını İNGİLİZCE doldur. Bunlar akademik literatürde aranacak:
   - concept: çözülen teknik problem, 2-4 kelime, sektör adı İÇERMEZ
     ("fraud detection", "credit scoring", "anomaly detection" gibi)
   - referenceSector: çözümün olgunlaştığı sektör, TEK kelime ("fintech")
   - targetSector: fikrin hedeflediği sektör, TEK kelime ("healthcare")
   İkisi de aynı concept ile aranacağı için uzun ifade yazma; uzun sorgu
   hiçbir yayınla eşleşmez ve ölçüm anlamsız çıkar.

6. scores alanındaki dört değeri 0-100 arasında ver.

Yanıtı şu JSON şemasında ver:
{ "ideas": [ {
  "title": "Kısa proje adı",
  "summary": "Tek cümlelik açıklama",
  "comparison": {
    "concept": "İNGİLİZCE, 2-4 kelime, sektör adı İÇERMEZ",
    "referenceSector": "İNGİLİZCE tek sektör adı",
    "targetSector": "İNGİLİZCE tek sektör adı",
    "referenceExample": "Adı konmuş, aranabilir ürün/hizmet",
    "localState": "Türkiye'deki karşılığı: adı, ya da açıkça bilinmediği",
    "structuralReason": "Farkın yapısal sebebi",
    "howToCheck": "Kullanıcının bu iddiayı kendi başına nasıl doğrulayabileceği"
  },
  "searchTerms": ["yedek arama terimi"],
  "evidence": { "quote": "dayanak alıntı", "kind": "source" },
  "scores": { "evidence": 0, "feasibility": 0, "gap": 0, "originality": 0 }
} ] }`;
    }

    // ── Kanıt katmanı: iddiayı ölçmek ───────────────────────────────────────
    //
    // The model recalls, it does not research, and a recalled claim dressed in a
    // named reference and a table reads as far more rigorous than it is. This
    // layer measures what can actually be measured and is explicit about the rest.
    //
    // Every source here is free, keyless, read-only and CORS-open. Measured
    // 18 Aug 2026 against Origin: http://localhost:3000 — all three answer with
    // Access-Control-Allow-Origin: *.
    //
    // No credential of any kind is attached to these requests. The API key is
    // added in postToModel and nowhere else.

    const EVIDENCE_TIMEOUT_MS = 8000;

    // Only the top few candidates are verified. Verifying one reduces the evidence
    // to decoration — it cannot change the ranking. Verifying all eight burns
    // GitHub's unauthenticated search budget, measured at X-RateLimit-Limit: 10
    // per minute. Three is the cheapest number at which a measurement can still
    // overturn the order.
    const VERIFY_TOP_K = 3;

    // Below this, a count is not a measurement.
    //
    // Measured 18 Aug 2026: a well-formed "concept + sector" query lands between
    // 916 and 5335 works (fraud detection fintech 1044, credit scoring agriculture
    // 1591, anomaly detection healthcare 5335). A query that did not land returns
    // 0-9. Three orders of magnitude separate the two, so a floor anywhere between
    // is safe; 50 sits 5x above the broken cases and well under the healthy ones,
    // which leaves genuinely narrow fields room to still be measured.
    const MIN_CORPUS = 50;

    // A maturity claim needs a run of years to sit on. Real fields come back with
    // fifty-odd buckets; anything under three cannot show a trend, and a single
    // bucket makes the recent share 100% by arithmetic rather than by evidence.
    const MIN_YEARS = 3;

    // What a status is worth. Deliberately small relative to the 0-100 criteria
    // scores: evidence adjusts the ranking, it does not overrule what the user
    // said matters.
    const VERIFICATION_BONUS = { verified: 12, measured: 8 };

    const EVIDENCE_SOURCES = {
        openalex: {
            id: 'openalex',
            label: 'OpenAlex',
            origin: 'https://api.openalex.org',
            capabilities: ['count', 'year-histogram'],

            // title_and_abstract.search, not the bare `search` parameter.
            //
            // OpenAlex's default search now runs full text ("works where full text
            // has ..."), which matches any paper mentioning the words anywhere at
            // all — including once in a related-work paragraph. Measured 18 Aug
            // 2026, the same three queries return:
            //
            //   fulltext                 title_and_abstract
            //   fintech      13563       1028
            //   healthcare   42380       1853
            //   agriculture  25391        276
            //
            // Agriculture goes from clearly under-researched to nearly twice
            // fintech. The loose form would make the asymmetry unmeasurable, so
            // the narrow filter is not a preference here, it is the measurement.
            buildUrl(query, opts) {
                const o = opts || {};
                const filter = `title_and_abstract.search:${encodeURIComponent(query)}`;
                const base = `https://api.openalex.org/works?filter=${filter}`;

                // per-page truncates group_by as well as results. Sending it with a
                // grouped request returned exactly one bucket — the largest, which is
                // always a recent year — so the histogram had a single year in it and
                // the share of the last three came out at 100% every single time.
                // The comparison could then only ever agree with the claim, which is
                // the failure this whole layer exists to catch. Measured 18 Aug 2026:
                // one bucket with per-page=1, fifty-six without it.
                return o.histogram
                    ? `${base}&group_by=publication_year`
                    : `${base}&per-page=1`;
            },

            parse(payload) {
                const p = payload || {};
                // A plain count response carries group_by as an EMPTY array rather
                // than omitting it — measured 18 Aug 2026. Testing Array.isArray on
                // its own sent every count down the histogram path and dropped
                // meta.count on the floor, which surfaced as the sector comparison
                // reporting an error with both of its counts sitting right there.
                if (Array.isArray(p.group_by) && p.group_by.length > 0) {
                    const years = {};
                    for (const row of p.group_by) {
                        const year = Number(row && row.key);
                        if (Number.isFinite(year) && year > 1900) {
                            years[year] = Number(row.count) || 0;
                        }
                    }
                    return { kind: 'years', years };
                }
                const count = p.meta && Number(p.meta.count);
                if (!Number.isFinite(count)) return null;
                return { kind: 'count', count };
            }
        },

        wikidata: {
            id: 'wikidata',
            label: 'Wikidata',
            origin: 'https://www.wikidata.org',
            capabilities: ['entity-search'],

            // origin=* is what makes the MediaWiki API answer cross-origin.
            buildUrl(query) {
                return 'https://www.wikidata.org/w/api.php'
                    + '?action=wbsearchentities'
                    + `&search=${encodeURIComponent(query)}`
                    + '&language=en&format=json&origin=*';
            },

            parse(payload) {
                const hits = payload && Array.isArray(payload.search) ? payload.search : null;
                if (!hits) return null;
                return {
                    kind: 'entities',
                    matches: hits.slice(0, 3).map(hit => ({
                        label: (hit && (hit.label || hit.title)) || '',
                        description: (hit && hit.description) || '',
                        url: hit && hit.concepturi ? hit.concepturi : ''
                    }))
                };
            }
        },

        github: {
            id: 'github',
            label: 'GitHub',
            origin: 'https://api.github.com',
            capabilities: ['repo-search'],

            buildUrl(query) {
                return 'https://api.github.com/search/repositories'
                    + `?q=${encodeURIComponent(query)}&per_page=3&sort=stars`;
            },

            parse(payload) {
                const p = payload || {};
                if (!Number.isFinite(Number(p.total_count))) return null;
                const items = Array.isArray(p.items) ? p.items : [];
                return {
                    kind: 'repos',
                    total: Number(p.total_count),
                    matches: items.slice(0, 3).map(item => ({
                        label: (item && item.full_name) || '',
                        description: (item && item.description) || '',
                        url: (item && item.html_url) || ''
                    }))
                };
            }
        }
    };

    // Build the queries for a candidate.
    //
    // The app writes these, not the model. If the model handed back its own query
    // string there would be no way to test what we actually searched for, and a
    // model that phrased the query to match its own claim would be marking its own
    // homework.
    function buildEvidenceQueries(idea, methodId, reference) {
        const method = COMPARISON_METHODS[methodId];
        if (!method || !method.verifyStrategy) return [];

        const c = (idea && idea.comparison) || {};
        const field = (name) => (typeof c[name] === 'string' ? c[name].trim().replace(/\s+/g, ' ') : '');

        // Query length decides whether the measurement means anything. Measured
        // 18 Aug 2026 against OpenAlex title_and_abstract:
        //
        //   3 words   fraud detection fintech            1044
        //             predictive maintenance manufacturing 8986
        //   4 words   fraud detection supply chain         909
        //             predictive maintenance public health 2732
        //   5 words   machine learning credit scoring fintech  285
        //             income share agreement platform fintech    9
        //
        // Four holds, five falls apart. The model handed back phrases of six and
        // more, every one returned 0, and a zero then read as an untouched market.
        //
        // The sector is kept whole because it is the axis being compared; the
        // concept takes whatever is left of the four.
        const words = (text) => text.split(' ').filter(Boolean);
        const pair = (concept, sector) => {
            const s = words(sector).slice(0, 2);
            const c = words(concept).slice(0, Math.max(1, 4 - s.length));
            return [...c, ...s].join(' ');
        };

        const concept = field('concept');
        if (!concept) return [];

        const named = field('referenceExample');

        // The panel is the user saying what to compare against, so it wins over the
        // model. The target side is the idea's own domain and only the model knows it.
        const refSector = (typeof reference === 'string' && reference.trim())
            ? reference.trim().replace(/\s+/g, ' ')
            : field('referenceSector');
        const targetSector = field('targetSector');

        switch (method.verifyStrategy) {
            case 'sector-asymmetry':
                // One concept, two sectors — that symmetry is the measurement. Pairing
                // the concept with a second free-text term instead produced a query
                // that shared no shape with the first and returned nothing every time.
                if (!refSector || !targetSector) return [];
                return [
                    { sourceId: 'openalex', role: 'reference', query: pair(concept, refSector) },
                    { sourceId: 'openalex', role: 'target', query: pair(concept, targetSector) }
                ];

            case 'year-histogram':
                return [
                    { sourceId: 'openalex', role: 'histogram', query: words(concept).slice(0, 4).join(' '), options: { histogram: true } }
                ];

            case 'named-entity':
                // The named example is what gets looked up — the thing the model was
                // told outright would be searched.
                if (!named) return [];
                return [
                    { sourceId: 'wikidata', role: 'entity', query: named },
                    { sourceId: 'github', role: 'entity', query: named }
                ];

            default:
                return [];
        }
    }

    function buildEvidenceRequest(sourceId, query, opts) {
        const source = EVIDENCE_SOURCES[sourceId];
        if (!source || typeof query !== 'string' || !query.trim()) return null;
        return { url: source.buildUrl(query.trim(), opts) };
    }

    function parseEvidenceResponse(sourceId, payload) {
        const source = EVIDENCE_SOURCES[sourceId];
        if (!source) return null;
        try {
            return source.parse(payload);
        } catch {
            // A shape we did not expect is a parse failure, not a finding.
            return null;
        }
    }

    // Turn raw source answers into one five-valued result.
    //
    // `raws` is [{ sourceId, role, ok, data, error, link }].
    //
    // The five values exist because collapsing any two of them loses something
    // that matters:
    //
    //   verified     found, with a source and a link
    //   measured     a numeric asymmetry was actually computed
    //   not_found    this source did not return it for this query — NOT evidence
    //                of absence
    //   unverifiable this claim type cannot be checked with these tools at all
    //   error        the network or the service failed
    //
    // error must never merge into not_found. Wikidata returns zero results for
    // "Estonian e-Residency" — one of the best known e-government programmes there
    // is — purely because the phrasing does not match. If a timeout were reported
    // the same way a genuine zero is, the layer meant to catch invented references
    // would itself be inventing findings.
    function interpretEvidence(methodId, raws) {
        const method = COMPARISON_METHODS[methodId];
        const list = (Array.isArray(raws) ? raws : []).filter(Boolean);
        const firstLink = list.find(r => r.link);
        const link = firstLink ? firstLink.link : null;
        const sourceId = list.length ? list[0].sourceId : null;

        if (!method || !method.verifyStrategy) {
            return {
                sourceId: null,
                status: 'unverifiable',
                detail: 'Bu kıyas tipi ücretsiz ve anahtarsız kaynaklarla doğrulanamıyor. '
                    + 'Sıralamaya etkisi yok.',
                measurement: null,
                supportsClaim: null,
                link: null
            };
        }

        const usable = list.filter(r => r.ok && r.data);
        if (list.length === 0 || usable.length === 0) {
            const reason = list.find(r => r.error);
            return {
                sourceId,
                status: 'error',
                detail: 'Kaynak yanıt vermedi'
                    + (reason && reason.error ? ` (${reason.error})` : '')
                    + '. Bu bir bulgu değil; sıralamaya etkisi yok.',
                measurement: null,
                supportsClaim: null,
                link
            };
        }

        switch (method.verifyStrategy) {
            case 'sector-asymmetry': {
                const ref = usable.find(r => r.role === 'reference');
                const target = usable.find(r => r.role === 'target');
                if (!ref || !target || ref.data.kind !== 'count' || target.data.kind !== 'count') {
                    return {
                        sourceId,
                        status: 'error',
                        detail: 'Kıyas için iki sayım da gerekiyordu, ikisi birden gelmedi. '
                            + 'Sıralamaya etkisi yok.',
                        measurement: null,
                        supportsClaim: null,
                        link
                    };
                }

                const refCount = ref.data.count;
                const targetCount = target.data.count;

                // A zero, or a corpus too small to compare against, means the query
                // missed — not that the field is empty. Reading it as a gap is the
                // same mistake the named-entity branch already guards against, one
                // strategy along: measured 18 Aug 2026, every over-long query returned
                // 0 and every candidate was then told its claim held, so all three
                // took the same bonus and the measurement changed no ranking at all.
                if (refCount < MIN_CORPUS || targetCount === 0) {
                    return {
                        sourceId,
                        status: 'not_found',
                        supportsClaim: null,
                        measurement: { reference: refCount, target: targetCount },
                        detail: `Bu sorgu ölçülebilir bir sonuç vermedi (referans ${refCount}, `
                            + `hedef ${targetCount} yayın). Terimler literatürde tutmamış olabilir; `
                            + 'bu, alanın boş olduğunu göstermez. Sıralamaya etkisi yok.',
                        link
                    };
                }

                // The claim is that the target sector is the under-served one.
                const supportsClaim = targetCount < refCount;
                return {
                    sourceId,
                    status: 'measured',
                    supportsClaim,
                    measurement: { reference: refCount, target: targetCount },
                    detail: supportsClaim
                        ? `Ölçüm iddiayı destekliyor: referans alanda ${refCount}, `
                          + `hedef alanda ${targetCount} yayın.`
                        : `Ölçüm iddiayı desteklemiyor: hedef alanda ${targetCount} yayın var, `
                          + `referans alandaki ${refCount} yayından az değil.`,
                    link
                };
            }

            case 'year-histogram': {
                const hist = usable.find(r => r.data.kind === 'years');
                if (!hist) {
                    return {
                        sourceId,
                        status: 'error',
                        detail: 'Yıl dağılımı okunamadı. Sıralamaya etkisi yok.',
                        measurement: null,
                        supportsClaim: null,
                        link
                    };
                }

                const years = hist.data.years;
                const keys = Object.keys(years).map(Number).filter(Number.isFinite);
                const total = keys.reduce((sum, y) => sum + years[y], 0);
                const cutoff = Math.max(...keys, 0) - 2;
                const recent = keys.filter(y => y >= cutoff).reduce((sum, y) => sum + years[y], 0);
                const share = total > 0 ? recent / total : 0;

                // A field whose output is concentrated in the last three years is a
                // recently-opened one, which is what this comparison claims.
                // Too little to read a trend from. Reporting a share here would be
                // arithmetic dressed as a finding, so it goes back as not_found and
                // earns nothing — the same call the sector branch makes below its
                // corpus floor.
                if (keys.length < MIN_YEARS || total < MIN_CORPUS) {
                    return {
                        sourceId,
                        status: 'not_found',
                        supportsClaim: null,
                        measurement: { years, recentShare: share },
                        detail: `Bu sorgu ölçülebilir bir yıl dağılımı vermedi ` +
                            `(${keys.length} yıl, ${total} yayın). Olgunluk iddiası ` +
                            `bu veriyle değerlendirilemez; sıralamaya etkisi yok.`,
                        link
                    };
                }

                const supportsClaim = share >= 0.5;
                return {
                    sourceId,
                    status: 'measured',
                    supportsClaim,
                    measurement: { years, recentShare: share },
                    detail: `Yayınların %${Math.round(share * 100)}'i son üç yılda. `
                        + (supportsClaim
                            ? 'Alan gerçekten yeni açılmış görünüyor.'
                            : 'Alan iddia edildiği kadar yeni görünmüyor.'),
                    link
                };
            }

            case 'named-entity': {
                // A hit only counts when what came back actually resembles what was
                // searched for. Both sources match loosely enough that almost any
                // phrase retrieves something: measured 18 Aug 2026, the invented name
                // Servis Takip Veli retrieved a repository called
                // noktaturizm63/servisnoktam_veli, and Estonian e-Residency retrieved
                // perguth/chromeos-welcome-to-estonia.
                //
                // Reporting either as a found reference would let this layer
                // manufacture the confidence it exists to withhold: an invented name
                // would come back verified, with a link and a score bonus. That is the
                // structured-hallucination failure reproduced inside the check meant to
                // prevent it. titleOverlap separates the two cleanly — 1.00 for a real
                // match against 0.00-0.50 for those retrievals — at the same 0.6 the
                // freshness filter already uses.
                const NAME_MATCH = 0.6;

                for (const r of usable) {
                    if (r.data && Array.isArray(r.data.matches)) {
                        r.data.matches = r.data.matches.filter(
                            m => titleOverlap(r.query || '', (m && m.label) || '') >= NAME_MATCH
                        );
                    }
                }

                const hits = usable.filter(r => {
                    const d = r.data;
                    if (d.kind === 'entities') return d.matches.length > 0;
                    if (d.kind === 'repos') return d.matches.length > 0;
                    return false;
                });

                if (hits.length > 0) {
                    const names = hits
                        .flatMap(r => (r.data.matches || []).map(m => m.label))
                        .filter(Boolean)
                        .slice(0, 3);
                    const found = hits.find(r => (r.data.matches || []).some(m => m.url));
                    const foundUrl = found
                        ? (found.data.matches.find(m => m.url) || {}).url
                        : link;
                    return {
                        sourceId: hits[0].sourceId,
                        status: 'verified',
                        supportsClaim: true,
                        measurement: { matches: names },
                        detail: `Referans bulundu: ${names.join(', ')}.`,
                        link: foundUrl || link
                    };
                }

                // Nothing came back — and that is genuinely all this means. The
                // wording here is load-bearing: it must not read as "this does not
                // exist" or "the model made it up", because a query that simply
                // does not match returns exactly the same zero.
                return {
                    sourceId,
                    status: 'not_found',
                    supportsClaim: null,
                    measurement: null,
                    detail: 'Bu kaynaklarda bu sorguyla kayıt bulunamadı. '
                        + 'Sorgu tutmamış da olabilir; bulunamaması referansın gerçek '
                        + 'olmadığını göstermez. Sıralamaya etkisi yok.',
                    link
                };
            }

            default:
                return {
                    sourceId,
                    status: 'unverifiable',
                    supportsClaim: null,
                    measurement: null,
                    detail: 'Bu kıyas için tanımlı bir doğrulama stratejisi yok.',
                    link: null
                };
        }
    }

    // What a verification result adds to a candidate's score.
    //
    // Nothing here can return a negative number, and that is the whole rule.
    function verificationBonus(result) {
        if (!result) return 0;
        if (result.status === 'verified') return VERIFICATION_BONUS.verified;
        if (result.status === 'measured' && result.supportsClaim) return VERIFICATION_BONUS.measured;
        return 0;
    }

    // Re-rank the scored candidates once verification has run.
    //
    // Verification only ever adds. A measurement that refutes its own claim earns
    // no bonus and carries a visible warning, but takes no penalty either — its
    // rivals gaining while it does not is enough to push it down, which gets the
    // ranking effect without the rule needing an exception.
    //
    // The reason it must not subtract is Wikidata's zero for "Estonian
    // e-Residency": a real reference that simply did not match the query. A
    // penalty would let a phrasing mismatch kill a good idea.
    function applyVerificationBoost(scored, results) {
        const lookup = results instanceof Map
            ? results
            : new Map(Object.entries(results || {}));

        return (Array.isArray(scored) ? scored : [])
            .filter(row => row && row.idea)
            .map(row => {
                const result = lookup.get(row.idea.title) || null;
                const bonus = verificationBonus(result);
                return Object.assign({}, row, {
                    verification: result,
                    verificationBonus: bonus,
                    baseTotal: row.total,
                    total: row.total + bonus
                });
            })
            .sort((a, b) => b.total - a.total);
    }

    // The comparison and evidence section of the exported blueprint.
    function buildVerificationMarkdown(v) {
        if (!v) return '';
        const c = v.comparison || {};

        let out = '';
        if (c.referenceExample) out += `**Referans örnek**: ${c.referenceExample}\n\n`;
        if (c.localState) out += `**Türkiye'deki durum**: ${c.localState}\n\n`;
        if (c.structuralReason) out += `**Farkın yapısal sebebi**: ${c.structuralReason}\n\n`;

        if (v.method) {
            const method = COMPARISON_METHODS[v.method];
            if (method) {
                const badge = {
                    measurable: '🟢 ölçülebilir',
                    partial: '🟡 kısmen ölçülebilir',
                    unverifiable: '🔴 bu araçlarla doğrulanamaz'
                }[method.verifiability];
                out += `**Kıyas metodu**: ${method.label} — ${badge}\n\n`;
            }
        }

        const results = Array.isArray(v.results) ? v.results : [];
        if (results.length > 0) {
            out += '### Kanıt sonuçları\n\n';
            for (const r of results) {
                if (!r) continue;
                const source = EVIDENCE_SOURCES[r.sourceId];
                const label = source ? source.label : (r.sourceId || 'kaynak');
                out += `- **${label}** · \`${r.status}\` — ${r.detail || ''}`;
                if (r.link) out += ` ([kaynağa bak](${r.link}))`;
                out += '\n';
            }
            out += '\n';
        }

        if (c.howToCheck) out += `**Kendin nasıl doğrularsın**: ${c.howToCheck}\n\n`;
        return out;
    }

    // ── Fikir değerlendirme ─────────────────────────────────────────────────
    //
    // The other two modes hand the user an idea. This one takes the idea the user
    // already has and asks the same questions of it: is the gap it claims real,
    // where is the opening, and what is it worth.
    //
    // The honesty line runs straight through the middle of this feature. The gap
    // claim can be measured — that is what EVIDENCE_SOURCES is for. Market size,
    // revenue, competition and timing cannot be, by anything this app can reach.
    // So the four criteria stay what they are, the model's own read, and the
    // measured part is reported separately rather than folded into one number.
    // A single score would be the most trusted thing on the page and the least
    // earned.

    // The user's own idea. Shorter than SOURCE_MATERIAL_MAX_CHARS on purpose: this
    // is a description of one project, not a document to mine, and a longer input
    // makes the model summarise rather than characterise.
    const IDEA_TEXT_MAX_CHARS = 2000;

    // Which criteria are measured against a source and which are the model's
    // opinion. The renderer reads this rather than hardcoding the split, so a
    // criterion cannot quietly change sides.
    const CRITERION_BASIS = {
        evidence: 'measured',
        feasibility: 'model',
        gap: 'measured',
        originality: 'model'
    };

    function clampIdeaText(text) {
        const raw = typeof text === 'string' ? text.trim() : '';
        if (raw.length <= IDEA_TEXT_MAX_CHARS) {
            return { text: raw, chars: raw.length, truncated: false };
        }
        const slice = raw.slice(0, IDEA_TEXT_MAX_CHARS);
        const lastBreak = slice.search(/\s\S*$/);
        const cut = lastBreak > IDEA_TEXT_MAX_CHARS * 0.9 ? slice.slice(0, lastBreak) : slice;
        return { text: cut, chars: cut.length, truncated: true };
    }

    // Ask the model to characterise an idea that already exists.
    //
    // Deliberately not an ideation prompt with one candidate. The model is told
    // the idea is the user's and must not be replaced — left to its own devices it
    // will improve the idea into a different one and then assess that, which reads
    // as an assessment of yours and is not.
    function buildAssessmentPrompt(opts) {
        const o = opts || {};
        const idea = clampIdeaText(o.ideaText);
        if (!idea.text) return '';

        const method = COMPARISON_METHODS[o.method] || COMPARISON_METHODS.sector;
        const categoryLabel = o.categoryLabel || CATEGORY_LABELS.all;
        const reference = typeof o.reference === 'string' ? o.reference.trim() : '';

        let scopeInstruction = '';
        if (o.scope === 'national') {
            scopeInstruction = '\nDEĞERLENDİRME KAPSAMI: 🇹🇷 Türkiye pazarı ve şartları.';
        } else if (o.scope === 'international') {
            scopeInstruction = '\nDEĞERLENDİRME KAPSAMI: 🌍 Global pazar.';
        }

        const referenceLine = reference ? `\n- ${method.referenceLabel}: ${reference}` : '';

        return `Aşağıdaki proje fikri KULLANICIYA AİT. Onu değerlendireceksin.${scopeInstruction}

KULLANICININ FİKRİ:
"""
${idea.text}
"""${idea.truncated ? '\n(Metin uzunluk sınırı nedeniyle kesildi.)' : ''}

KIYAS METODU — ${method.label}: ${method.promptGuidance}${referenceLine}

Alan: ${categoryLabel}

Kurallar:

1. FİKRİ DEĞİŞTİRME. Daha iyi bir fikir aklına gelse bile onu değerlendirme —
   kullanıcı kendi fikrinin ne durumda olduğunu soruyor, senin fikrini değil.
   Fikir belirsizse belirsiz haliyle değerlendir ve neyin eksik olduğunu yaz.

2. comparison.concept, comparison.referenceSector ve comparison.targetSector
   alanlarını İNGİLİZCE doldur. Bunlar akademik literatürde aranacak:
   - concept: çözülen teknik problem, 2-4 kelime, sektör adı İÇERMEZ
   - referenceSector: bu çözümün olgunlaştığı sektör, TEK kelime
   - targetSector: fikrin hedeflediği sektör, TEK kelime
   Uzun ifade yazma; uzun sorgu hiçbir yayınla eşleşmez ve ölçüm anlamsız çıkar.

3. comparison.referenceExample ADI KONMUŞ, aranabilir bir ürün/hizmet olmalı.
   Bu ad otomatik olarak aranacak ve bulunup bulunmadığı kullanıcıya gösterilecek.

4. opportunities alanına 2-4 SOMUT açılım yaz. Her biri kullanıcının yarın
   yapabileceği bir şey olsun — "pazar büyük" gibi genel cümleler değil.

5. risks alanına 2-3 SOMUT risk yaz. Fikri övme; zayıf tarafını söylemek
   bu değerlendirmenin asıl işi.

6. scores alanındaki dört değeri 0-100 arasında ver. Bunların SENİN görüşün
   olduğu kullanıcıya açıkça söylenecek, o yüzden şişirme.

Yanıtı şu JSON şemasında ver:
{
  "title": "Fikrin kısa adı",
  "restatement": "Fikri kendi cümlelerinle tek cümlede özetle",
  "comparison": {
    "concept": "İNGİLİZCE, 2-4 kelime, sektör adı İÇERMEZ",
    "referenceSector": "İNGİLİZCE tek sektör adı",
    "targetSector": "İNGİLİZCE tek sektör adı",
    "referenceExample": "Adı konmuş, aranabilir ürün/hizmet",
    "localState": "Türkiye'deki karşılığı: adı, ya da açıkça bilinmediği",
    "structuralReason": "Açığın yapısal sebebi",
    "howToCheck": "Kullanıcının bu iddiayı kendi başına nasıl doğrulayabileceği"
  },
  "opportunities": ["somut açılım", "somut açılım"],
  "risks": ["somut risk", "somut risk"],
  "scores": { "evidence": 0, "feasibility": 0, "gap": 0, "originality": 0 }
}`;
    }

    // Split a scored assessment into what a source settled and what the model
    // merely thinks, so the interface can label the two differently.
    //
    // Returns the same breakdown rows the scorer produced, each tagged with its
    // basis, plus the two subtotals and the verification result. Nothing here
    // invents a combined "your idea scores N" figure — that number would be the
    // most trusted thing on screen and the least supported.
    function splitAssessment(scored, verification) {
        const rows = (scored && Array.isArray(scored.breakdown)) ? scored.breakdown : [];

        const tagged = rows.map(row => Object.assign({}, row, {
            basis: CRITERION_BASIS[row.criterion] === 'measured' ? 'measured' : 'model'
        }));

        const sumOf = basis => tagged
            .filter(r => r.basis === basis)
            .reduce((total, r) => total + r.contribution, 0);

        const measuredStatus = verification ? verification.status : null;

        return {
            rows: tagged,
            modelTotal: sumOf('model'),
            claimTotal: sumOf('measured'),
            // Only this last one rests on a source rather than on the model.
            verification: verification || null,
            verificationBonus: verificationBonus(verification),
            // True when a source actually settled something either way.
            measured: measuredStatus === 'measured' || measuredStatus === 'verified'
        };
    }

    // How much of the model's assessment is kept. The prompt asks for 2-4
    // openings and 2-3 risks; these ceilings are what happens when it ignores
    // that. Cutting rather than rendering everything matters because a list of
    // twelve "opportunities" is a way of saying nothing while looking thorough.
    const ASSESSMENT_LIMITS = {
        maxOpportunities: 4,
        maxRisks: 3,
        lineChars: 400,
        titleChars: 120
    };

    const COMPARISON_FIELDS = [
        'concept',
        'referenceSector',
        'targetSector',
        'referenceExample',
        'localState',
        'structuralReason',
        'howToCheck'
    ];

    // Bring the model's assessment down to a shape the renderer can rely on.
    //
    // Returns null when there is nothing to show, rather than an object full of
    // empty strings — a card that renders headings over blanks reads as a result
    // and is not one.
    //
    // Note what this does NOT do: it never fills a missing field with a plausible
    // default. An absent risk list means the model did not name a risk, and the
    // interface has to be able to say that.
    function normalizeAssessment(raw) {
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

        const str = (value, max) => {
            if (typeof value !== 'string') return '';
            const trimmed = value.trim().replace(/\s+/g, ' ');
            return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
        };

        const list = (value, cap) => (Array.isArray(value) ? value : [])
            .map(item => str(item, ASSESSMENT_LIMITS.lineChars))
            .filter(Boolean)
            .slice(0, cap);

        const comparison = {};
        const rawComparison = (raw.comparison && typeof raw.comparison === 'object')
            ? raw.comparison
            : {};
        for (const field of COMPARISON_FIELDS) {
            comparison[field] = str(rawComparison[field], ASSESSMENT_LIMITS.lineChars);
        }

        const scores = {};
        const rawScores = (raw.scores && typeof raw.scores === 'object') ? raw.scores : {};
        for (const id of Object.keys(SCORING_CRITERIA)) {
            const value = Number(rawScores[id]);
            scores[id] = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
        }

        const assessment = {
            title: str(raw.title, ASSESSMENT_LIMITS.titleChars),
            restatement: str(raw.restatement, ASSESSMENT_LIMITS.lineChars),
            comparison,
            opportunities: list(raw.opportunities, ASSESSMENT_LIMITS.maxOpportunities),
            risks: list(raw.risks, ASSESSMENT_LIMITS.maxRisks),
            scores
        };

        // Nothing worth rendering: no name, no summary, no comparison and no
        // prose. Scores alone are not an assessment.
        const hasProse = assessment.title
            || assessment.restatement
            || assessment.opportunities.length
            || assessment.risks.length
            || COMPARISON_FIELDS.some(f => comparison[f]);

        return hasProse ? assessment : null;
    }

    // The assessment as a markdown document, for the copy button.
    //
    // The split is preserved in the text exactly as it is on screen. A pasted
    // report that merges the measured part into the opinion part would launder
    // the model's guesses into findings the moment it left the page.
    function buildAssessmentMarkdown(assessment, split, methodId) {
        if (!assessment) return '';

        const method = COMPARISON_METHODS[methodId] || COMPARISON_METHODS.sector;
        const c = assessment.comparison || {};

        let md = `# Fikir değerlendirmesi: ${assessment.title || 'Adsız fikir'}\n\n`;
        if (assessment.restatement) md += `> ${assessment.restatement}\n\n`;

        md += '## Piyasadaki açığa uygunluk\n\n';
        if (c.referenceExample) md += `- **Referans örnek**: ${c.referenceExample}\n`;
        if (c.localState) md += `- **Türkiye'deki durum**: ${c.localState}\n`;
        if (c.structuralReason) md += `- **Açığın yapısal sebebi**: ${c.structuralReason}\n`;
        md += `- **Kıyas metodu**: ${method.label} (${method.verifiability})\n`;
        if (c.howToCheck) md += `- **Kendin nasıl doğrularsın**: ${c.howToCheck}\n`;
        md += '\n';

        if (assessment.opportunities.length) {
            md += '## Fırsatlar\n\n';
            for (const item of assessment.opportunities) md += `- ${item}\n`;
            md += '\n';
        }

        if (assessment.risks.length) {
            md += '## Riskler\n\n';
            for (const item of assessment.risks) md += `- ${item}\n`;
            md += '\n';
        }

        if (split && Array.isArray(split.rows) && split.rows.length) {
            md += '## Puanlar\n\n';
            md += '| Kriter | Dayanak | Puan | Ağırlık | Katkı |\n';
            md += '|---|---|---:|---:|---:|\n';
            for (const row of split.rows) {
                const basis = row.basis === 'measured' ? 'ölçülebilir iddia' : 'model görüşü';
                md += `| ${row.label} | ${basis} | ${Math.round(row.score)} `
                    + `| %${Math.round(row.weight * 100)} | ${row.contribution.toFixed(1)} |\n`;
            }
            md += '\n';
            md += `- **İddia tarafı alt toplam**: ${split.claimTotal.toFixed(1)}\n`;
            md += `- **Model görüşü alt toplam**: ${split.modelTotal.toFixed(1)}\n`;
            if (split.verificationBonus > 0) {
                md += `- **Doğrulama katkısı**: +${split.verificationBonus.toFixed(1)}\n`;
            }
            md += '\n';
            // Said in the document, not only in the interface. This is the one
            // number a reader will look for, and its absence has to be explained
            // wherever the report is read.
            md += 'Tek bir toplam puan bilinçli olarak verilmiyor: dört kriterden '
                + 'ikisi ücretsiz kaynaklarla ölçülebilir, ikisi yalnızca modelin '
                + 'görüşü. İkisini tek sayıda toplamak, görüşü ölçüm gibi '
                + 'gösterirdi.\n\n';
        }

        if (split && split.verification) {
            md += buildVerificationMarkdown({
                method: methodId,
                comparison: c,
                results: [split.verification]
            });
        }

        return md;
    }

    // ── Proje Havuzu: Dışa ve İçe Aktarma Mantığı ─────────────────────────

    function exportPoolToJson(pool) {
        if (!Array.isArray(pool)) return '[]';
        return JSON.stringify(pool, null, 2);
    }

    function validateAndMergePool(existingPool, importedInput) {
        const base = Array.isArray(existingPool) ? [...existingPool] : [];
        let items = importedInput;
        if (typeof importedInput === 'string') {
            try {
                items = JSON.parse(importedInput);
            } catch {
                return { error: 'Geçersiz JSON formatı', merged: base, addedCount: 0, skippedCount: 0 };
            }
        }
        if (!Array.isArray(items)) {
            return { error: 'İçe aktarılan veri bir proje listesi (dizi) değil', merged: base, addedCount: 0, skippedCount: 0 };
        }

        const existingIds = new Set(base.map(p => (p && typeof p.id === 'string' ? p.id.trim() : '')).filter(Boolean));
        const existingTitles = new Set(base.map(p => (p && typeof p.title === 'string' ? normalizeTitle(p.title) : '')).filter(Boolean));

        let addedCount = 0;
        let skippedCount = 0;

        for (const raw of items) {
            if (validateProjectShape(raw) !== null) {
                skippedCount++;
                continue;
            }
            const norm = normalizeProject(raw, 'all');
            const titleKey = normalizeTitle(norm.title);

            if (existingIds.has(norm.id) || (titleKey && existingTitles.has(titleKey))) {
                skippedCount++;
                continue;
            }

            base.push(norm);
            existingIds.add(norm.id);
            if (titleKey) existingTitles.add(titleKey);
            addedCount++;
        }

        return { error: null, merged: base, addedCount, skippedCount };
    }

    return {
        NODE_TYPES,
        SCOPE_PRESETS,
        CONSTRAINT_AXES,
        ECOSYSTEM_AXES,
        CATEGORY_LABELS,
        PROVIDERS,
        DEFAULT_PROVIDER,
        getProvider,
        isKnownProvider,
        buildProviderRequest,
        extractProviderText,
        parseJsonResponse,
        readUsageTokens,
        JSON_ONLY_SUFFIX,
        buildIdeationPrompt,
        pickConstraintCombo,
        normalizeTitle,
        titleOverlap,
        selectFreshIdea,
        escapeHtml,
        parseMarkdown,
        validateProjectShape,
        normalizeProject,
        safeNodeType,
        EVIDENCE_STATUSES,
        safeEvidenceStatus,
        pickRandomProject,
        pickUnseenProject,
        evaluateRateLimit,
        buildBlueprintMarkdown,
        IDEATION_ANGLES,
        COMPARISON_METHODS,
        SCORING_CRITERIA,
        SOURCE_MATERIAL_MAX_CHARS,
        normalizeWeights,
        scoreIdeas,
        pickWeightedIdea,
        clampSourceMaterial,
        buildDetailedIdeationPrompt,
        EVIDENCE_SOURCES,
        EVIDENCE_TIMEOUT_MS,
        VERIFY_TOP_K,
        VERIFICATION_BONUS,
        buildEvidenceQueries,
        buildEvidenceRequest,
        parseEvidenceResponse,
        interpretEvidence,
        applyVerificationBoost,
        buildVerificationMarkdown,
        IDEA_TEXT_MAX_CHARS,
        CRITERION_BASIS,
        clampIdeaText,
        buildAssessmentPrompt,
        splitAssessment,
        ASSESSMENT_LIMITS,
        normalizeAssessment,
        buildAssessmentMarkdown,
        exportPoolToJson,
        validateAndMergePool
    };
});
