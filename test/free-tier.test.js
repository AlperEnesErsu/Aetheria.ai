const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// The project is committed to running at zero cost. Some Gemini features are
// paid-only and would start billing the user the moment they appear in a
// request, so they are asserted absent rather than left to code review.
//
// Measured on 7 Aug 2026 with a real key (scripts/gemini-lab.js --diagnose):
// every google_search call returned 429 on the free tier while the same model
// answered plain calls, and the pricing page lists grounding as "Not available"
// for the free tier.

const root = path.join(__dirname, '..');
const appSource = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const core = require('../core.js');

// Fields that move a request onto a paid tier or a paid add-on
const PAID_ONLY = [
    { pattern: /google_search/, name: 'google_search (grounding)', why: 'ücretsiz katmanda kullanılamıyor' },
    { pattern: /googleSearchRetrieval/, name: 'googleSearchRetrieval', why: 'grounding aracının eski adı' },
    { pattern: /google_search_retrieval/, name: 'google_search_retrieval', why: 'grounding aracının eski adı' },
    { pattern: /urlContext/, name: 'urlContext', why: 'ücretli bağlam aracı' },
    { pattern: /codeExecution/, name: 'codeExecution', why: 'ücretli araç' }
];

test('app.js requests no paid-only Gemini features', () => {
    for (const { pattern, name, why } of PAID_ONLY) {
        assert.ok(!pattern.test(appSource),
            `app.js "${name}" kullanıyor — ${why}. Ücretsiz kalma taahhüdünü bozar.`);
    }
});

test('generation stays on the flash models, not pro', () => {
    const models = core.PROVIDERS.gemini.models;
    assert.ok(Array.isArray(models) && models.length > 0, 'Gemini model listesi boş');

    // Pro models cost several times more per token and have far tighter free limits
    for (const model of models) {
        assert.ok(!/pro/i.test(model), `Gemini model listesi bir pro modeli içeriyor: ${model}`);
    }
    assert.ok(models.some(m => /flash/i.test(m)), 'Gemini model listesi bir flash modeli içermeli');
});

// Adding paid vendors does not weaken the free-by-default promise: it moves it
// from "the app cannot cost money" to "the app cannot cost money unless the user
// deliberately picks a vendor that bills, having been told that it bills".
test('the default provider is the free one', () => {
    assert.strictEqual(core.DEFAULT_PROVIDER, 'gemini',
        'varsayılan sağlayıcı ücretsiz katmanı olan sağlayıcı olmalı');
    assert.strictEqual(core.PROVIDERS[core.DEFAULT_PROVIDER].free, true,
        'varsayılan sağlayıcı ücretsiz olarak işaretlenmemiş');
});

test('every provider declares whether it costs money, honestly', () => {
    // Anthropic and OpenAI have no free API tier. Marking either one free would
    // put a user on a metered vendor while the UI told them it was free.
    const KNOWN_PAID = ['anthropic', 'openai'];

    for (const [id, provider] of Object.entries(core.PROVIDERS)) {
        assert.strictEqual(typeof provider.free, 'boolean', `${id}: free alanı yok`);
        assert.ok(provider.costNote && provider.costNote.trim(), `${id}: costNote yok`);
        if (KNOWN_PAID.includes(id)) {
            assert.strictEqual(provider.free, false,
                `${id} ücretsiz olarak işaretlenmiş ama ücretsiz katmanı yok`);
            assert.ok(/[Üü]cretli|[Üü]cretsiz katmanı yok/.test(provider.costNote),
                `${id}: costNote ücretli olduğunu söylemiyor`);
        }
    }
});

test('a provider the browser cannot reach is not selectable', () => {
    // Measured: api.openai.com returns no Access-Control-Allow-Origin, so a valid
    // key still fails with a network error that reads like the key was rejected.
    for (const [id, provider] of Object.entries(core.PROVIDERS)) {
        if (!provider.browserBlocked) continue;
        assert.ok(provider.blockedReason && provider.blockedReason.trim(),
            `${id}: kullanılamama nedeni yazılmamış`);
    }
    assert.ok(/option\.disabled = true/.test(appSource),
        'kullanılamayan sağlayıcı listede seçilebilir kalmış');
    assert.ok(/browserBlocked\) return DEFAULT_PROVIDER/.test(appSource),
        'kayıtlı tercih kullanılamayan bir sağlayıcıya kilitleyebilir');
});

test('the paid providers are labelled as paid in the picker itself', () => {
    // The note under the select is easy to miss; the option text is not.
    assert.ok(/provider\.free \? ' — ücretsiz katman' : ' — ücretli'/.test(appSource),
        'sağlayıcı listesi ücretli/ücretsiz ayrımını göstermiyor');
});

test('no provider is wired to a paid add-on tool', () => {
    // Same guarantee as the Gemini grounding check above, applied to the shared
    // request builder: none of the vendors may be given a billable server tool.
    const coreSource = fs.readFileSync(path.join(root, 'core.js'), 'utf8');
    for (const pattern of [/web_search/, /code_interpreter/, /"tools"/, /tools:/]) {
        assert.ok(!pattern.test(coreSource),
            `core.js istek gövdesine araç ekliyor (${pattern}) — ek ücret doğurabilir`);
    }
});

test('the ideation pass keeps a small output budget', () => {
    const ideaCap = appSource.match(/const IDEA_MAX_TOKENS = (\d+)/);
    assert.ok(ideaCap, 'IDEA_MAX_TOKENS bulunamadı');
    // Pass 1 returns one-liners; a large budget here would burn tokens for nothing
    assert.ok(Number(ideaCap[1]) <= 2048,
        `IDEA_MAX_TOKENS fazla yüksek (${ideaCap[1]}) — fikir listesi kısa olmalı`);
});

test('a client-side rate limit is still in place', () => {
    // Not a billing guard on the free tier, but it paces usage so the daily
    // allowance is not spent in one sitting.
    assert.ok(/const RATE_LIMIT_COOLDOWN_MS = \d+/.test(appSource), 'cooldown kaldırılmış');
    assert.ok(/const MAX_CALLS_PER_HOUR = \d+/.test(appSource), 'saatlik limit kaldırılmış');
});

test('a 429 is explained as a spent free allowance, not a bill', () => {
    // Google's own wording ("check your plan and billing details") reads like money
    // is owed; on the free tier nothing is. The app must say so.
    assert.ok(/Ücretsiz Gemini kotası doldu/.test(appSource),
        '429 mesajı ücretsiz kota diliyle açıklanmıyor');
    assert.ok(/Ücret çıkmaz/.test(appSource),
        '429 mesajı kullanıcıyı ücret konusunda rahatlatmıyor');
});

test('the README states the cost position', () => {
    const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
    assert.ok(/[Üü]cretsiz/.test(readme), 'README ücretsiz kullanımdan söz etmiyor');
    assert.ok(/billing|faturaland/i.test(readme),
        'README faturalandırmanın kapalı kalması gerektiğini söylemiyor');
});
