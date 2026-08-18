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

        return p;
    }

    // Restrict a node type to the palette that actually has styles. The value ends
    // up in a class attribute, so an arbitrary string is also an injection risk.
    function safeNodeType(type) {
        return NODE_TYPES.includes(type) ? type : 'service';
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

        if (p.step2) {
            doc += `## 3. KOD MİMARİSİ VE SİSTEM KATMANLARI\n\n${p.step2.architecture}\n\n`;
            doc += `---\n\n`;
            doc += `## 4. GÜVENLİK YAPISI & RISK ÖNLEME TEDBİRLERİ\n\n${p.step2.security}\n\n`;
        }

        doc += `---\n*Generated by Aetheria.ai (Aetheria Agent)*\n`;
        return doc;
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
        pickRandomProject,
        pickUnseenProject,
        evaluateRateLimit,
        buildBlueprintMarkdown
    };
});
