const test = require('node:test');
const assert = require('node:assert');
const {
    bootApp, errorResponse, validProject, twoPassGemini, geminiResponse
} = require('./helpers/app-harness.js');

// These drive the real app in a real DOM. Everything here was previously covered
// only by grepping app.js for a string, which cannot tell a working feature from
// a line of dead code, or by a human clicking through the browser once.

const KEY = 'AIzaTESTkeyForBehaviourSuite1234';
const withKey = { aetheria_key_gemini: KEY, aetheria_use_gemini: 'true' };

// =========================================================== generation is the product

test('pressing generate without a key renders no project and opens the key dialog', async () => {
    const app = await bootApp();

    app.id('btnGenerateProject').click();
    await app.flush(1500);

    assert.strictEqual(app.id('resultsWrapper').classList.contains('visible'), false,
        'anahtar yokken proje gösterildi');
    assert.strictEqual(app.id('feature2Modal').style.display, 'flex',
        'anahtar diyaloğu açılmadı');
    assert.ok(app.terminal().some(l => /hazır bir listeden seçmez/.test(l)),
        'kullanıcıya projelerin üretildiği söylenmedi');
});

test('a stored key with live mode off routes to settings, not to an example', async () => {
    const app = await bootApp({ storage: { aetheria_key_gemini: KEY, aetheria_use_gemini: 'false' } });

    app.id('btnGenerateProject').click();
    await app.flush(1500);

    assert.strictEqual(app.id('resultsWrapper').classList.contains('visible'), false);
    assert.ok(app.terminal().some(l => /üretimi kapalı/.test(l)));
    // The old message claimed the key was missing while it sat in storage
    assert.ok(!app.terminal().some(l => /anahtarı tanımlı değil/.test(l)),
        'kayıtlı anahtar "tanımlı değil" olarak raporlandı');
});

test('a failed generation says so and does not substitute a stored project', async () => {
    const app = await bootApp({
        storage: withKey,
        fetch: async () => errorResponse(500, 'sunucu hatası')
    });

    app.id('btnGenerateProject').click();
    await app.flush(2000);

    assert.strictEqual(app.id('resultsWrapper').classList.contains('visible'), false,
        'üretim başarısızken hazır proje gösterildi');
    assert.ok(app.terminal().some(l => /başarısız/.test(l)));
});

test('a successful generation renders it as generated, not as an example', async () => {
    const app = await bootApp({ storage: withKey, fetch: twoPassGemini() });

    app.id('btnGenerateProject').click();
    await app.flush(2000);

    assert.ok(app.id('resultsWrapper').classList.contains('visible'), 'sonuç gösterilmedi');
    assert.strictEqual(app.id('projectTitle').textContent, 'Test Projesi');
    assert.match(app.id('originBadge').textContent, /Yapay Zeka Üretimi/);
    assert.strictEqual(app.id('exampleNotice').style.display, 'none',
        'üretilen proje örnek uyarısıyla gösterildi');
});

test('generation makes exactly two calls, to the provider endpoint, key in a header', async () => {
    const app = await bootApp({ storage: withKey, fetch: twoPassGemini() });

    app.id('btnGenerateProject').click();
    await app.flush(2000);

    assert.strictEqual(app.fetchCalls.length, 2, 'iki aşamalı akış iki çağrı yapmalı');
    for (const call of app.fetchCalls) {
        assert.match(call.url, /^https:\/\/generativelanguage\.googleapis\.com\//);
        assert.ok(!/[?&]key=/.test(call.url), 'anahtar URL query stringinde');
        assert.strictEqual(call.init.headers['x-goog-api-key'], KEY);
    }
    // Pass 1 asks for a list, pass 2 expands the chosen one
    assert.match(JSON.stringify(app.fetchCalls[0].body), /ideas/);
    assert.match(JSON.stringify(app.fetchCalls[1].body), /Üretilen Fikir/);
});

test('the terminal reports the scope and constraints actually sent', async () => {
    const app = await bootApp({
        storage: { ...withKey, aetheria_scope_filter: 'national' },
        fetch: twoPassGemini()
    });

    app.id('btnGenerateProject').click();
    await app.flush(2000);

    const log = app.terminal().join('\n');
    assert.match(log, /Kapsam: 🇹🇷 Ulusal/);
    assert.match(log, /Kısıtlar:/);
    assert.match(log, /Ekosistem açısı:/);

    // ...and the scope really reached the prompt, not just the log
    const prompt = app.fetchCalls[0].body.contents[0].parts[0].text;
    assert.match(prompt, /ULUSAL/);
});

// ============================================================== showcase is separate

test('the sample link renders a stored project and labels it as one', async () => {
    const app = await bootApp();

    app.id('btnShowSample').click();
    await app.flush(900);

    assert.ok(app.id('resultsWrapper').classList.contains('visible'));
    assert.match(app.id('originBadge').textContent, /Örnek Proje/);
    assert.notStrictEqual(app.id('exampleNotice').style.display, 'none',
        'örnek uyarısı gizli');
    assert.ok(app.terminal().some(l => /şimdi üretilmedi/.test(l)));
    assert.strictEqual(app.fetchCalls.length, 0, 'örnek gösterirken ağ isteği yapıldı');
});

test('the saved pool starts empty', async () => {
    const app = await bootApp();
    assert.strictEqual(app.id('savedCountBadge').textContent, '0');
    assert.strictEqual(app.window.localStorage.getItem('aetheria_community_pool'), null,
        'havuz örneklerle önceden dolduruldu');
});

test('saving adds the project on screen to the pool', async () => {
    const app = await bootApp({ storage: withKey, fetch: twoPassGemini() });

    app.id('btnGenerateProject').click();
    await app.flush(2000);
    app.id('btnSaveProject').click();

    const pool = JSON.parse(app.window.localStorage.getItem('aetheria_community_pool'));
    assert.strictEqual(pool.length, 1);
    assert.strictEqual(pool[0].title, 'Test Projesi');
    assert.strictEqual(app.id('savedCountBadge').textContent, '1');
});

// ================================================================== scope selector

test('the scope selector persists the choice and restores it on the next boot', async () => {
    const first = await bootApp();
    first.$('.scope-btn[data-scope="national"]').click();
    assert.strictEqual(first.window.localStorage.getItem('aetheria_scope_filter'), 'national');

    const second = await bootApp({ storage: { aetheria_scope_filter: 'national' } });
    assert.strictEqual(second.$('.scope-btn.active').getAttribute('data-scope'), 'national');
    assert.strictEqual(
        second.$('.scope-btn[data-scope="national"]').getAttribute('aria-checked'), 'true');
});

test('the category filter persists and paints the restored button', async () => {
    const app = await bootApp({ storage: { aetheria_category_filter: 'devops' } });

    const active = app.$$('.filter-btn').filter(b => b.classList.contains('active'));
    assert.strictEqual(active.length, 1, 'birden fazla veya hiç aktif filtre yok');
    assert.strictEqual(active[0].getAttribute('data-category'), 'devops');
    assert.strictEqual(active[0].getAttribute('aria-pressed'), 'true');
});

test('a stored filter that no longer exists falls back instead of sticking', async () => {
    for (const bogus of ['silinmis-kategori', 'constructor', '__proto__']) {
        const app = await bootApp({ storage: { aetheria_category_filter: bogus, aetheria_scope_filter: bogus } });
        assert.strictEqual(app.$('.scope-btn.active').getAttribute('data-scope'), 'all',
            `${bogus} kapsamı varsayılana düşmedi`);
        assert.strictEqual(app.$$('.filter-btn').find(b => b.classList.contains('active'))
            .getAttribute('data-category'), 'all', `${bogus} kategorisi varsayılana düşmedi`);
    }
});

test('arrow keys move and select within the scope group', async () => {
    const app = await bootApp();
    const buttons = app.$$('.scope-btn');

    buttons[0].focus();
    const press = key => buttons.find(b => b === app.document.activeElement)
        .dispatchEvent(new app.window.KeyboardEvent('keydown', { key, bubbles: true }));

    press('ArrowRight');
    assert.strictEqual(app.document.activeElement.getAttribute('data-scope'), 'national');
    assert.strictEqual(app.window.localStorage.getItem('aetheria_scope_filter'), 'national');

    press('End');
    assert.strictEqual(app.document.activeElement.getAttribute('data-scope'), 'international');

    press('Home');
    assert.strictEqual(app.document.activeElement.getAttribute('data-scope'), 'all');

    // Wrapping: left from the first lands on the last
    press('ArrowLeft');
    assert.strictEqual(app.document.activeElement.getAttribute('data-scope'), 'international');
});

test('only the selected scope button is tabbable', async () => {
    const app = await bootApp();
    const tabbable = app.$$('.scope-btn').filter(b => b.getAttribute('tabindex') === '0');
    assert.strictEqual(tabbable.length, 1, 'radio grubunda tek tab durağı olmalı');
    assert.strictEqual(tabbable[0].getAttribute('aria-checked'), 'true');
});

// ===================================================================== rendering

test('a malicious model response cannot inject markup', async () => {
    const evil = '<img src=x onerror="globalThis.__pwned=true">';
    const app = await bootApp({
        storage: withKey,
        fetch: twoPassGemini(validProject({
            title: `Zararlı ${evil}`,
            tagline: evil,
            diagramNodes: [
                { id: 1, name: evil, type: '"><script>globalThis.__pwned=true</script>', sub: evil },
                { id: 2, name: 'B', type: 'service', sub: 'b' },
                { id: 3, name: 'C', type: 'ai', sub: 'c' },
                { id: 4, name: 'D', type: 'storage', sub: 'd' }
            ],
            step1: { marketGap: `Pazar ${evil}`, description: `Açıklama ${evil}`, tags: [evil, 'Go', 'Rust'] }
        }))
    });

    app.id('btnGenerateProject').click();
    await app.flush(2000);

    assert.strictEqual(app.window.__pwned, undefined, 'enjekte edilen kod çalıştı');
    assert.strictEqual(app.id('projectTitle').querySelector('img'), null, 'img düğümü oluştu');
    assert.match(app.id('projectTitle').textContent, /<img/, 'metin kaçırılmadan gösterilmeli');
    assert.strictEqual(app.id('resultsWrapper').querySelectorAll('script').length, 0);

    // The diagram belongs to stage 2, so it has to be revealed before the node
    // markup exists at all.
    app.id('btnTriggerStep2').click();
    await app.flush(4000);

    assert.strictEqual(app.window.__pwned, undefined, '2. aşamada enjekte edilen kod çalıştı');
    assert.strictEqual(app.id('architectureContent').querySelector('img'), null);

    const cards = app.$$('#architectureDiagramNodes .diagram-node-card');
    assert.ok(cards.length > 0, 'diyagram düğümleri render edilmedi');
    for (const card of cards) {
        // An unknown node type must fall back to an allowlisted class rather than
        // being written into the class attribute verbatim.
        assert.ok(/node-(source|service|ai|storage|client)/.test(card.className),
            `beklenmeyen düğüm sınıfı: ${card.className}`);
        assert.ok(!/script|onerror/i.test(card.className));
    }
});

test('the scope badge matches the exported blueprint', async () => {
    const app = await bootApp({ storage: withKey, fetch: twoPassGemini() });

    app.id('btnGenerateProject').click();
    await app.flush(2000);
    app.id('btnExportBlueprint').click();
    await app.flush(50);

    assert.strictEqual(app.objectUrls.length, 1, 'rapor indirilmedi');
    const text = await app.objectUrls[0].text();

    const badge = app.id('projectScopeBadge').textContent;
    assert.ok(text.includes(badge),
        `kart rozeti (${badge}) ile rapor metni ayrışmış`);
});

// ================================================================ key handling

test('each provider keeps its own key across a switch', async () => {
    const app = await bootApp({
        storage: { aetheria_key_gemini: KEY, aetheria_key_anthropic: 'sk-ant-testkey0123456789' }
    });

    const select = app.id('providerSelect');
    select.value = 'anthropic';
    select.dispatchEvent(new app.window.Event('change'));

    assert.strictEqual(app.window.localStorage.getItem('aetheria_key_gemini'), KEY,
        'sağlayıcı değişince diğerinin anahtarı silindi');
    assert.strictEqual(app.window.localStorage.getItem('aetheria_key_anthropic'),
        'sk-ant-testkey0123456789');
});

test('a key saved under the old single-slot name is migrated once', async () => {
    const app = await bootApp({ storage: { aetheria_gemini_key: KEY } });

    assert.strictEqual(app.window.localStorage.getItem('aetheria_key_gemini'), KEY,
        'eski anahtar taşınmadı');
    assert.strictEqual(app.window.localStorage.getItem('aetheria_gemini_key'), null,
        'eski slot temizlenmedi');
});

test('the key is never written back into the input', async () => {
    const app = await bootApp({ storage: withKey });

    app.id('btnFeature2Notice').click();

    assert.strictEqual(app.id('geminiApiKey').value, '', 'anahtar DOM içine geri yazıldı');
    assert.match(app.id('geminiApiKey').placeholder, /kayıtlı anahtar/i);
});

test('deleting the key clears both stores and hides the delete button', async () => {
    const app = await bootApp({ storage: withKey });

    app.id('btnFeature2Notice').click();
    app.id('btnForgetKey').click();

    assert.strictEqual(app.window.localStorage.getItem('aetheria_key_gemini'), null);
    assert.strictEqual(app.window.sessionStorage.getItem('aetheria_key_gemini'), null);
    assert.strictEqual(app.id('btnForgetKey').classList.contains('visible'), false);
    assert.strictEqual(app.window.localStorage.getItem('aetheria_use_gemini'), 'false');
});

test('a rejected key does not cost the working one already stored', async () => {
    const app = await bootApp({
        storage: withKey,
        fetch: async () => errorResponse(401, 'API key not valid')
    });

    app.id('btnFeature2Notice').click();
    app.id('geminiApiKey').value = 'AIzaBOGUSkeyThatWillBeRejected00';
    app.id('btnSaveGeminiKey').click();
    await app.flush(2000);

    assert.strictEqual(app.window.localStorage.getItem('aetheria_key_gemini'), KEY,
        'reddedilen anahtar çalışan anahtarı ezdi');
    assert.match(app.id('keyStatus').textContent, /doğrulanamadı/);
});

test('the terminal redacts every vendor key format', async () => {
    // Error bodies can echo the request; users paste terminal output into issues
    const app = await bootApp({
        storage: withKey,
        fetch: async () => errorResponse(400,
            `bad key AIzaLEAKED1234567890abcdef and sk-ant-LEAKED1234567890 and sk-LEAKED1234567890abcdefgh`)
    });

    app.id('btnGenerateProject').click();
    await app.flush(2000);

    const log = app.terminal().join('\n');
    assert.ok(!/AIzaLEAKED/.test(log), 'Google anahtarı loglandı');
    assert.ok(!/sk-ant-LEAKED/.test(log), 'Anthropic anahtarı loglandı');
    assert.ok(!/sk-LEAKED/.test(log), 'OpenAI anahtarı loglandı');
    assert.match(log, /ANAHTAR GİZLENDİ/);
});

// ================================================================== rate limiting

test('the cooldown blocks a second generation and says how long to wait', async () => {
    const app = await bootApp({ storage: withKey, fetch: twoPassGemini() });

    app.id('btnGenerateProject').click();
    await app.flush(2000);
    const callsAfterFirst = app.fetchCalls.length;

    app.id('btnGenerateProject').click();
    await app.flush(1500);

    assert.strictEqual(app.fetchCalls.length, callsAfterFirst,
        'bekleme süresi dolmadan yeni istek gönderildi');
    assert.ok(app.terminal().some(l => /saniye bekleyin/.test(l)));
});

test('a 429 is explained as a spent free allowance, not a bill', async () => {
    const app = await bootApp({
        storage: withKey,
        fetch: async () => errorResponse(429, 'check your plan and billing details')
    });

    app.id('btnGenerateProject').click();
    await app.flush(2500);

    const log = app.terminal().join('\n');
    assert.match(log, /Ücretsiz Gemini kotası doldu/);
    assert.match(log, /Ücret çıkmaz/);
    assert.ok(!/billing details/.test(log), 'Google\'ın faturalandırma metni olduğu gibi gösterildi');
});

test('a dead model is skipped and the next one serves the request', async () => {
    // The fallback list exists for exactly this; a 404 must not end the attempt
    const app = await bootApp({
        storage: withKey,
        fetch: (url, init, callNumber) => {
            if (callNumber === 1) return errorResponse(404, 'model not found');
            return twoPassGemini()(url, init);
        }
    });

    app.id('btnGenerateProject').click();
    await app.flush(2500);

    assert.ok(app.id('resultsWrapper').classList.contains('visible'),
        '404 sonrası yedek modele geçilmedi');
    assert.ok(app.fetchCalls.length >= 3, 'yedek model denenmedi');
});

// ============================================================ corrupt storage

test('a corrupt saved pool is discarded instead of breaking every pool action', async () => {
    // A hand-edited or truncated entry used to reach the app as an object, and
    // then every pool operation threw inside an event listener — the drawer
    // rendered nothing and saving did nothing, with no error the user could see.
    const app = await bootApp({ storage: { aetheria_community_pool: '{"bozuk":true}' } });

    assert.deepStrictEqual(app.errors, [], 'bozuk havuz açılışta hata fırlattı');
    assert.strictEqual(app.id('savedCountBadge').textContent, '0');

    app.id('btnSavedProjects').click();
    app.id('btnShowSample').click();
    await app.flush(900);
    app.id('btnSaveProject').click();

    assert.deepStrictEqual(app.errors, [], 'havuz işlemleri sessizce hata fırlattı');
    const pool = JSON.parse(app.window.localStorage.getItem('aetheria_community_pool'));
    assert.strictEqual(pool.length, 1, 'bozuk havuzdan sonra kaydetme çalışmadı');
});

test('entries that are not projects are filtered out of the pool', async () => {
    const app = await bootApp({ storage: { aetheria_community_pool: '[1,2,null,{"id":"ok","title":"T"}]' } });

    assert.deepStrictEqual(app.errors, []);
    assert.strictEqual(app.id('savedCountBadge').textContent, '1',
        'proje olmayan girdiler havuzda sayıldı');
});

// ============================================================= other providers

test('switching to Anthropic sends the request its own way', async () => {
    const app = await bootApp({
        storage: {
            aetheria_provider: 'anthropic',
            aetheria_key_anthropic: 'sk-ant-testkey01234567890',
            aetheria_use_gemini: 'true'
        },
        fetch: async () => ({
            ok: true,
            status: 200,
            json: async () => ({
                content: [{ type: 'text', text: JSON.stringify({ ideas: [{ title: 'A', summary: 'b' }] }) }],
                usage: { input_tokens: 10, output_tokens: 5 }
            })
        })
    });

    app.id('btnGenerateProject').click();
    await app.flush(2000);

    const first = app.fetchCalls[0];
    assert.match(first.url, /^https:\/\/api\.anthropic\.com\//);
    assert.strictEqual(first.init.headers['x-api-key'], 'sk-ant-testkey01234567890');
    assert.strictEqual(first.init.headers['anthropic-version'], '2023-06-01');
    assert.strictEqual(first.init.headers['anthropic-dangerous-direct-browser-access'], 'true');
    // Gemini's key header must not ride along on another vendor's request
    assert.strictEqual(first.init.headers['x-goog-api-key'], undefined);
});

test('a provider without a JSON mode is told to return only JSON', async () => {
    const app = await bootApp({
        storage: {
            aetheria_provider: 'anthropic',
            aetheria_key_anthropic: 'sk-ant-testkey01234567890',
            aetheria_use_gemini: 'true'
        },
        fetch: async () => ({
            ok: true, status: 200,
            json: async () => ({
                content: [{ type: 'text', text: '{"ideas":[{"title":"A","summary":"b"}]}' }],
                usage: { input_tokens: 1, output_tokens: 1 }
            })
        })
    });

    app.id('btnGenerateProject').click();
    await app.flush(2000);

    const prompt = app.fetchCalls[0].body.messages[0].content;
    assert.match(prompt, /Yalnızca istenen JSON/,
        'JSON modu olmayan sağlayıcıya yalnızca-JSON talimatı gitmedi');
});

test('copy blueprint button copies markdown and triggers toast notification', async () => {
    const app = await bootApp({ storage: withKey, fetch: twoPassGemini() });

    app.id('btnGenerateProject').click();
    await app.flush(2000);

    const copyBtn = app.id('btnCopyBlueprint');
    assert.ok(copyBtn, 'Panoya kopyala butonu bulunamadı');

    let clipboardText = '';
    app.window.navigator.clipboard = {
        writeText: async (text) => { clipboardText = text; }
    };

    copyBtn.click();
    await app.flush(100);

    assert.match(clipboardText, /^# Test Projesi — Technical Blueprint & Architecture/);
    assert.ok(copyBtn.classList.contains('is-copied'));

    const toast = app.id('copyToast');
    assert.ok(toast.classList.contains('visible'), 'Toast bildirimi görünür olmadı');
});

// =========================================================== detailed mode

// Detailed mode candidates, each carrying its own comparison, search terms and
// scores. The two differ only on evidence vs feasibility, so the weights alone
// decide which one wins.
const detailedIdeas = () => ({
    ideas: [
        {
            title: 'Dayanağı Sağlam Olan',
            summary: 'özet',
            comparison: {
                concept: 'fraud detection',
                referenceSector: 'fintech',
                targetSector: 'agriculture',
                referenceExample: 'X-Road',
                localState: 'bilinmiyor',
                structuralReason: 'sebep'
            },
            evidence: { quote: 'BELGEDEN GELEN ALINTI', kind: 'source' },
            scores: { evidence: 100, feasibility: 10, gap: 50, originality: 50 }
        },
        {
            title: 'Hemen Yapılabilir Olan',
            summary: 'özet',
            comparison: {
                concept: 'fraud detection',
                referenceSector: 'fintech',
                targetSector: 'logistics',
                referenceExample: 'Uydurulmuş Bir Ad',
                localState: 'bilinmiyor',
                structuralReason: 'sebep'
            },
            evidence: { quote: 'ikinci alıntı', kind: 'source' },
            scores: { evidence: 10, feasibility: 100, gap: 50, originality: 50 }
        }
    ]
});

// Routes the model passes to the detailed fixtures and answers every evidence
// query with whatever the test decides the sources say.
function detailedFetch({ project = validProject(), evidence, ideas = detailedIdeas() } = {}) {
    return (url, init) => {
        const target = String(url);

        if (/openalex|wikidata|api\.github\.com/.test(target)) {
            if (typeof evidence === 'function') return evidence(target);
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    meta: { count: /agriculture/.test(target) ? 276 : 1028 },
                    group_by: []
                })
            };
        }

        const prompt = JSON.parse(init.body).contents[0].parts[0].text;
        return geminiResponse(/"ideas"/.test(prompt) ? ideas : project, 512);
    };
}

const detailed = (extra = {}) => Object.assign({
    aetheria_key_gemini: KEY,
    aetheria_use_gemini: 'true',
    aetheria_mode: 'detailed',
    aetheria_method: 'sector',
    aetheria_reference: 'fintech'
}, extra);

test('no credential ever reaches an evidence source', async () => {
    // The single most important assertion in this feature. Widening the CSP to
    // three more origins is only defensible while the key cannot travel to them,
    // and a source-level grep cannot prove what the running app actually sent.
    const app = await bootApp({ storage: detailed(), fetch: detailedFetch() });

    app.id('btnGenerateProject').click();
    await app.flush(3000);

    const evidenceCalls = app.fetchCalls.filter(c => /openalex|wikidata|api\.github\.com/.test(String(c.url)));
    assert.ok(evidenceCalls.length > 0, 'hiç kanıt sorgusu yapılmamış');

    for (const call of evidenceCalls) {
        const headers = (call.init && call.init.headers) || {};
        const names = Object.keys(headers).map(h => h.toLowerCase());

        for (const forbidden of ['authorization', 'x-goog-api-key', 'x-api-key', 'api-key']) {
            assert.ok(!names.includes(forbidden),
                `kanıt isteği ${forbidden} başlığı taşıyor: ${call.url}`);
        }

        assert.ok(!String(call.url).includes(KEY), 'anahtar kanıt URL\'sine sızmış');
        assert.strictEqual(JSON.stringify(headers).includes(KEY), false, 'anahtar başlıkta');
        assert.strictEqual(call.init && call.init.credentials, 'omit',
            'kanıt isteği ortam kimlik bilgilerini dışlamıyor');
        assert.ok(!call.body, 'kanıt isteği gövde taşıyor');
    }

    assert.deepStrictEqual(app.errors, []);
});

test('moving the weights changes which idea the app actually ships', async () => {
    // The assertion a prompt-text approach cannot make. Same candidates, same
    // model output, different sliders — different project on screen.
    const byEvidence = await bootApp({
        storage: detailed({
            aetheria_weights: JSON.stringify({ evidence: 100, feasibility: 0, gap: 0, originality: 0 })
        }),
        fetch: detailedFetch()
    });
    byEvidence.id('btnGenerateProject').click();
    await byEvidence.flush(3000);

    const byFeasibility = await bootApp({
        storage: detailed({
            aetheria_weights: JSON.stringify({ evidence: 0, feasibility: 100, gap: 0, originality: 0 })
        }),
        fetch: detailedFetch()
    });
    byFeasibility.id('btnGenerateProject').click();
    await byFeasibility.flush(3000);

    const pick = app => app.terminal().find(l => /\[SELECT\]/.test(l)) || '';

    assert.match(pick(byEvidence), /Dayanağı Sağlam Olan/, 'kanıt ağırlıklı seçim yanlış');
    assert.match(pick(byFeasibility), /Hemen Yapılabilir Olan/, 'uygulanabilirlik ağırlıklı seçim yanlış');
});

test('the pasted material is not sent again in pass 2', async () => {
    // Stage 2 needs the quote the model already pulled out, not the document. If
    // the whole thing travelled twice it would double its token cost for nothing,
    // and the free tier is the constraint this app is built around.
    const marker = 'BENZERSIZ_MATERYAL_IMZASI_42';
    const app = await bootApp({ storage: detailed(), fetch: detailedFetch() });

    app.id('sourceMaterialInput').value = `Giriş cümlesi. ${marker} Kapanış cümlesi.`;
    app.id('sourceMaterialInput').dispatchEvent(new app.window.Event('input'));

    app.id('btnGenerateProject').click();
    await app.flush(3000);

    const modelCalls = app.fetchCalls.filter(c => /generativelanguage|anthropic/.test(String(c.url)));
    assert.strictEqual(modelCalls.length, 2, 'ayrıntılı mod hâlâ iki LLM çağrısı yapmalı');

    const prompts = modelCalls.map(c => c.body.contents[0].parts[0].text);
    assert.ok(prompts[0].includes(marker), 'materyal 1. geçişe girmemiş');
    assert.ok(!prompts[1].includes(marker), 'materyal 2. geçişte tekrar gönderilmiş');
});

test('the pasted material never lands in storage', async () => {
    const marker = 'GIZLI_BELGE_IMZASI_99';
    const app = await bootApp({ storage: detailed(), fetch: detailedFetch() });

    app.id('sourceMaterialInput').value = marker;
    app.id('sourceMaterialInput').dispatchEvent(new app.window.Event('input'));

    app.id('btnGenerateProject').click();
    await app.flush(3000);

    for (const store of [app.window.localStorage, app.window.sessionStorage]) {
        for (let i = 0; i < store.length; i += 1) {
            const key = store.key(i);
            assert.ok(!String(store.getItem(key)).includes(marker),
                `kullanıcının belgesi ${key} altında saklanmış`);
        }
    }
});

test('a dead evidence source does not take the generation down with it', async () => {
    // The evidence layer is allowed to fail; it is not allowed to cost the user
    // the project they asked for.
    const app = await bootApp({
        storage: detailed(),
        fetch: detailedFetch({ evidence: () => errorResponse(500, 'kaynak çöktü') })
    });

    app.id('btnGenerateProject').click();
    await app.flush(3000);

    assert.strictEqual(app.id('resultsWrapper').classList.contains('visible'), true,
        'kanıt kaynağı çökünce üretim de düştü');
    assert.strictEqual(app.id('evidenceCard').classList.contains('visible'), true);
    assert.match(app.id('evidenceContent').textContent, /error/,
        'başarısız kaynak error olarak raporlanmadı');
    assert.deepStrictEqual(app.errors, []);
});

test('a source that returns nothing is never reported as proof of absence', async () => {
    // Wikidata returns zero for real programmes whose phrasing does not match, so
    // a miss must read as a miss and nothing more.
    const app = await bootApp({
        storage: detailed({ aetheria_method: 'country' }),
        fetch: detailedFetch({
            evidence: () => ({ ok: true, status: 200, json: async () => ({ search: [], total_count: 0, items: [] }) })
        })
    });

    app.id('btnGenerateProject').click();
    await app.flush(3000);

    const shown = app.id('evidenceContent').textContent;
    assert.match(shown, /not_found/);
    assert.match(shown, /bulunamadı/);
    assert.ok(!/uydurma|sahte/.test(shown), 'bulunamayan referans uydurma diye sunuldu');
    assert.match(shown, /göstermez|olabilir/, 'yokluk kanıtı olmadığı söylenmedi');
});

test('an unverifiable comparison says so instead of running a query', async () => {
    const app = await bootApp({
        storage: detailed({ aetheria_method: 'scale' }),
        fetch: detailedFetch()
    });

    app.id('btnGenerateProject').click();
    await app.flush(3000);

    const evidenceCalls = app.fetchCalls.filter(c => /openalex|wikidata|api\.github\.com/.test(String(c.url)));
    assert.strictEqual(evidenceCalls.length, 0, 'doğrulanamaz metot için sorgu atılmış');

    assert.ok(app.terminal().some(l => /doğrulanamıyor/.test(l)),
        'terminal doğrulamanın çalıştırılmadığını söylemedi');
    assert.match(app.id('evidenceContent').textContent, /unverifiable|doğrulanamıyor/);
});

test('a measurement that refutes its claim is shown and costs no points', async () => {
    // The candidate claims agriculture is the under-served sector. Answering with
    // a larger count for the target than the reference refutes exactly that.
    const app = await bootApp({
        storage: detailed(),
        fetch: detailedFetch({
            evidence: (url) => ({
                ok: true,
                status: 200,
                json: async () => ({
                    meta: { count: /agriculture|logistics/.test(url) ? 9999 : 1028 },
                    group_by: []
                })
            })
        })
    });

    app.id('btnGenerateProject').click();
    await app.flush(3000);

    assert.match(app.id('evidenceContent').textContent, /desteklemiyor/,
        'çürüten ölçüm kullanıcıya söylenmedi');
    assert.ok(app.terminal().some(l => /iddiayı desteklemiyor/.test(l)));

    // No bonus row means verification added nothing, which is the rule: a refuting
    // measurement earns nothing and is charged nothing.
    assert.ok(!/Doğrulama katkısı/.test(app.id('scoreBreakdownContent').textContent),
        'çürüten ölçüm bonus almış');
});

test('the score breakdown adds up to the number beside it', async () => {
    const app = await bootApp({ storage: detailed(), fetch: detailedFetch() });

    app.id('btnGenerateProject').click();
    await app.flush(3000);

    assert.strictEqual(app.id('scoreBreakdownCard').classList.contains('visible'), true);

    const rows = [...app.id('scoreBreakdownContent').querySelectorAll('tr')];
    const total = rows.find(r => r.classList.contains('total-row'));
    assert.ok(total, 'toplam satırı yok');

    const contributions = rows
        .filter(r => !r.classList.contains('total-row') && r.querySelector('td'))
        .map(r => Number([...r.children].pop().textContent.replace('+', '')))
        .filter(Number.isFinite);

    const shown = Number([...total.children].pop().textContent);
    const summed = contributions.reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(shown - summed) < 0.2, `tablo ${summed} veriyor ama ${shown} yazıyor`);
});

test('quick mode is untouched by any of this', async () => {
    const app = await bootApp({
        storage: { aetheria_key_gemini: KEY, aetheria_use_gemini: 'true' },
        fetch: twoPassGemini()
    });

    app.id('btnGenerateProject').click();
    await app.flush(2500);

    assert.strictEqual(app.id('resultsWrapper').classList.contains('visible'), true);
    assert.strictEqual(app.id('detailedPanel').classList.contains('visible'), false,
        'hızlı modda ayrıntılı panel açık');

    for (const id of ['verificationCard', 'evidenceCard', 'scoreBreakdownCard']) {
        assert.strictEqual(app.id(id).classList.contains('visible'), false,
            `hızlı modda ${id} gösterildi`);
    }

    const evidenceCalls = app.fetchCalls.filter(c => /openalex|wikidata|api\.github\.com/.test(String(c.url)));
    assert.strictEqual(evidenceCalls.length, 0, 'hızlı mod kanıt sorgusu attı');
    assert.deepStrictEqual(app.errors, []);
});

test('a project saved from detailed mode brings its measurement back', async () => {
    // Saving the prose but losing the comparison would leave the pool holding a
    // claim with no record of whether it was ever checked.
    const app = await bootApp({ storage: detailed(), fetch: detailedFetch() });

    app.id('btnGenerateProject').click();
    await app.flush(3000);
    assert.strictEqual(app.id('verificationCard').classList.contains('visible'), true);

    app.id('btnSaveProject').click();
    await app.flush(200);

    // Reopen it from the pool, the way a user would on a later visit.
    app.id('btnSavedProjects').click();
    await app.flush(200);
    const load = app.$$('.btn-saved-action').find(b => !b.classList.contains('btn-delete'));
    assert.ok(load, 'havuzda projeyi açan buton yok');
    load.click();
    await app.flush(500);

    assert.strictEqual(app.id('verificationCard').classList.contains('visible'), true,
        'havuzdan açılan ayrıntılı proje ölçümünü geri getirmedi');
    assert.match(app.id('evidenceContent').textContent, /measured|not_found|error/);
    assert.deepStrictEqual(app.errors, []);
});

test('a hand-edited pool entry cannot write into the evidence class attribute', async () => {
    // The pool is localStorage, so its contents are user-editable, and the status
    // lands in a class name. Same hole safeNodeType closes for diagram nodes.
    const evil = 'x" onload=alert(1) class="pwned';
    const poisoned = {
        ...validProject(),
        id: 'zehirli',
        verification: { method: 'sector', comparison: {}, breakdown: [], total: 10,
            results: [{ sourceId: 'openalex', status: evil, detail: 'd' }] }
    };

    const app = await bootApp({
        storage: Object.assign(detailed(), {
            aetheria_community_pool: JSON.stringify([poisoned])
        }),
        fetch: detailedFetch()
    });

    app.id('btnSavedProjects').click();
    await app.flush(200);
    const load = app.$$('.btn-saved-action').find(b => !b.classList.contains('btn-delete'));
    if (load) {
        load.click();
        await app.flush(500);
    }

    assert.strictEqual(app.window.__pwned, undefined, 'enjekte edilen kod çalıştı');
    for (const item of app.$$('.evidence-item')) {
        assert.match(item.className, /status-(verified|measured|not_found|unverifiable|error)/,
            `beklenmeyen kanıt sınıfı: ${item.className}`);
        assert.ok(!/onload|pwned/i.test(item.className));
    }
    assert.deepStrictEqual(app.errors, []);
});
