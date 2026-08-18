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
const { bootApp } = require('./helpers/app-harness.js');

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

// These two were greps for a line of source. A grep cannot tell whether the
// option is actually rendered, disabled, or labelled — it only proves someone
// once typed the string. Both now read the rendered picker.

test('a provider the browser cannot reach is not selectable', async () => {
    // Measured: api.openai.com returns no Access-Control-Allow-Origin, so a valid
    // key still fails with a network error that reads like the key was rejected.
    for (const [id, provider] of Object.entries(core.PROVIDERS)) {
        if (!provider.browserBlocked) continue;
        assert.ok(provider.blockedReason && provider.blockedReason.trim(),
            `${id}: kullanılamama nedeni yazılmamış`);
    }

    const app = await bootApp();
    for (const [id, provider] of Object.entries(core.PROVIDERS)) {
        const option = [...app.id('providerSelect').options].find(o => o.value === id);
        assert.ok(option, `${id} listede yok`);
        assert.strictEqual(option.disabled, Boolean(provider.browserBlocked),
            `${id}: seçilebilirlik browserBlocked ile uyuşmuyor`);
    }
});

test('a stored preference cannot strand the user on an unreachable provider', async () => {
    const blocked = Object.keys(core.PROVIDERS).find(id => core.PROVIDERS[id].browserBlocked);
    const app = await bootApp({ storage: { aetheria_provider: blocked } });

    assert.strictEqual(app.id('providerSelect').value, core.DEFAULT_PROVIDER,
        'kayıtlı tercih kullanılamayan sağlayıcıya kilitledi');
});

test('the paid providers are labelled as paid in the picker itself', async () => {
    // The note under the select is easy to miss; the option text is not.
    const app = await bootApp();

    for (const [id, provider] of Object.entries(core.PROVIDERS)) {
        if (provider.browserBlocked) continue;
        const option = [...app.id('providerSelect').options].find(o => o.value === id);
        const expected = provider.free ? /ücretsiz katman/ : /ücretli/;
        assert.match(option.textContent, expected,
            `${id}: seçenek metni ücret durumunu söylemiyor`);
    }
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

// The behavioural twin of this lives in app-behaviour.test.js, which drives a real
// 429 through the app and reads the terminal. This one stays as a source check so
// the wording cannot be quietly softened in a branch no test happens to exercise.
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

// ── Ayrıntılı mod ────────────────────────────────────────────────────────────

test('detailed mode still costs exactly two model calls', () => {
    // The evidence layer sits between the two passes and adds requests, but none
    // of them is billed. If a third model call ever appeared here it would raise
    // the cost of every generation against the free tier's quota.
    const detailed = appSource.slice(appSource.indexOf('async function generateDetailedProject'));
    const body = detailed.slice(0, detailed.indexOf('\n    }'));

    const modelCalls = body.match(/requestModelCompletion|expandIdea/g) || [];
    assert.strictEqual(modelCalls.length, 2,
        `ayrıntılı mod ${modelCalls.length} model çağrısı yapıyor, 2 olmalı`);
});

test('every evidence source is free and keyless', () => {
    // The whole layer only works on the free tier because none of these bills or
    // authenticates. A source that needed a key would put the cost back.
    for (const [id, source] of Object.entries(core.EVIDENCE_SOURCES)) {
        const url = source.buildUrl('test');
        assert.ok(!/key|token|auth/i.test(url), `${id}: URL kimlik bilgisi istiyor`);
        assert.ok(url.startsWith('https://'), `${id}: şifresiz`);
    }
});

test('the verification budget fits the keyless GitHub allowance', () => {
    // Measured as X-RateLimit-Limit: 10 for unauthenticated search. A country
    // comparison spends two per candidate, so the top-k cap is what keeps one
    // generation inside it.
    assert.ok(core.VERIFY_TOP_K * 2 <= 10,
        `${core.VERIFY_TOP_K} aday × 2 istek GitHub limitini aşıyor`);
});

test('the pasted material has a ceiling, because it is billed as prompt tokens', () => {
    // Material travels in pass 1 on every generation. Without a cap a pasted book
    // would burn the user's quota in a single click.
    assert.ok(core.SOURCE_MATERIAL_MAX_CHARS > 0);
    assert.ok(core.SOURCE_MATERIAL_MAX_CHARS <= 20000,
        'materyal tavanı ücretsiz katman için fazla yüksek');

    const clamped = core.clampSourceMaterial('x'.repeat(core.SOURCE_MATERIAL_MAX_CHARS * 3));
    assert.strictEqual(clamped.truncated, true);
    assert.ok(clamped.chars <= core.SOURCE_MATERIAL_MAX_CHARS);
});

test('the detailed ideation budget is raised but still bounded', () => {
    // Detailed candidates carry a comparison block, search terms, a quote and four
    // scores each, so the quick-mode ceiling truncates the JSON mid-array. Raising
    // it is necessary; leaving it unbounded would not be.
    const match = appSource.match(/DETAILED_IDEA_MAX_TOKENS\s*=\s*(\d+)/);
    assert.ok(match, 'ayrıntılı mod token tavanı tanımlı değil');

    const budget = Number(match[1]);
    assert.ok(budget > 1024, 'ayrıntılı adaylar hızlı mod tavanına sığmaz');
    assert.ok(budget <= 4096, 'ayrıntılı üretim tavanı ücretsiz katman için fazla yüksek');
});
