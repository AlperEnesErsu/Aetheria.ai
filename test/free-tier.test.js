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
    const models = appSource.match(/const GEMINI_MODELS = \[([^\]]+)\]/);
    assert.ok(models, 'GEMINI_MODELS bulunamadı');

    // Pro models cost several times more per token and have far tighter free limits
    assert.ok(!/pro/i.test(models[1]), `GEMINI_MODELS bir pro modeli içeriyor: ${models[1]}`);
    assert.ok(/flash/i.test(models[1]), 'GEMINI_MODELS bir flash modeli içermeli');
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
