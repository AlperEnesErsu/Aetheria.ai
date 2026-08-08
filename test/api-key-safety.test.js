const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

// The API key is the only secret this project handles. These tests pin the ways
// it must not escape, so a future change has to break an assertion rather than
// slip past review.

const root = path.join(__dirname, '..');
const appSource = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
const htmlSource = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const coreSource = fs.readFileSync(path.join(root, 'core.js'), 'utf8');

test('the key travels in a header, never in the URL', () => {
    // A key in the query string lands in browser history, referrer headers and any
    // proxy log on the way. It was in the URL originally; it must not go back.
    assert.ok(/x-goog-api-key/.test(appSource), 'x-goog-api-key başlığı kullanılmıyor');
    assert.ok(!/[?&]key=/.test(appSource), 'anahtar URL query string\'inde taşınıyor');
    assert.ok(!/generateContent\?[^`'"]*key/.test(appSource), 'endpoint URL\'inde anahtar var');
});

test('the key is never written back into the DOM', () => {
    // Prefilling the input put the raw key in the DOM on every load, where devtools,
    // a screen share or an extension could read it.
    assert.ok(!/geminiApiKeyInput\.value\s*=\s*geminiApiKey/.test(appSource),
        'anahtar input alanına geri yazılıyor');
    assert.ok(!/\.value\s*=\s*.*apiKey/i.test(appSource.replace(/\.value = ''/g, '')),
        'anahtar bir input değerine atanıyor');
});

test('the key input does not leak through autofill or spellcheck', () => {
    const field = htmlSource.match(/<input[^>]*id="geminiApiKey"[^>]*>/);
    assert.ok(field, 'geminiApiKey alanı bulunamadı');
    assert.ok(/type="password"/.test(field[0]), 'alan password tipinde değil');
    assert.ok(/autocomplete="off"/.test(field[0]), 'autocomplete kapalı değil');
    assert.ok(/spellcheck="false"/.test(field[0]), 'spellcheck kapalı değil — metin sunucuya gidebilir');
});

test('terminal output is redacted before display', () => {
    // Error text can echo request data, and users paste terminal output into bug
    // reports and screenshots.
    assert.ok(/redactSecrets/.test(appSource), 'redactSecrets yok');
    assert.ok(/escapeHtml\(redactSecrets\(/.test(appSource),
        'terminal log redaksiyondan geçmiyor');
    assert.ok(/AIza\[0-9A-Za-z_-\]/.test(appSource),
        'Google anahtar biçimi için desen yok');
});

test('the user can delete the key outright', () => {
    assert.ok(/function forgetGeminiKey/.test(appSource), 'silme fonksiyonu yok');
    assert.ok(/btnForgetKey/.test(htmlSource), 'silme butonu arayüzde yok');
    // Deleting has to clear both stores, or a copy survives in the other one
    const forget = appSource.slice(appSource.indexOf('function forgetGeminiKey'));
    assert.ok(/writeKeyToStorage\(''\)/.test(forget.slice(0, 600)),
        'silme her iki depoyu da temizlemiyor');
});

test('the key is stored in exactly one place at a time', () => {
    const writer = appSource.slice(appSource.indexOf('function writeKeyToStorage'));
    const body = writer.slice(0, 800);
    assert.ok(/sessionStorage\.removeItem/.test(body) && /localStorage\.removeItem/.test(body),
        'yazmadan önce diğer depo temizlenmiyor — anahtarın iki kopyası kalabilir');
});

test('session-only storage is offered', () => {
    assert.ok(/rememberKeyToggle/.test(htmlSource), 'saklama tercihi arayüzde yok');
    assert.ok(/sessionStorage\.setItem\(KEY_NAME/.test(appSource),
        'oturumluk saklama uygulanmamış');
});

test('the key never reaches the export or the saved pool', () => {
    // Blueprints get downloaded and pool entries get inspected; neither should be
    // able to carry the key along.
    assert.ok(!/apiKey/i.test(coreSource), 'core.js anahtara dokunuyor — export yolu risk altında');

    const blueprint = coreSource.slice(coreSource.indexOf('function buildBlueprintMarkdown'));
    assert.ok(!/key/i.test(blueprint.slice(0, 1500).replace(/KEY_NAME/g, '')),
        'blueprint üretimi anahtarla ilgili bir alana bakıyor');
});

test('CSP still restricts where requests can go', () => {
    const csp = htmlSource.match(/Content-Security-Policy"[^>]*content="([^"]+)"/s);
    assert.ok(csp, 'CSP meta yok');
    // With the key in the browser, the set of reachable hosts is the blast radius
    assert.ok(/connect-src[^;]*generativelanguage\.googleapis\.com/.test(csp[1]),
        'connect-src Gemini uç noktasıyla sınırlı değil');
    assert.ok(!/connect-src[^;]*\*/.test(csp[1]), 'connect-src joker karakter içeriyor');
    assert.ok(/script-src\s+'self'/.test(csp[1]), "script-src 'self' değil");
});

test('no key-shaped literal is committed in the sources', () => {
    for (const [name, src] of [['app.js', appSource], ['core.js', coreSource], ['index.html', htmlSource]]) {
        const hits = src.match(/AIza[0-9A-Za-z_-]{20,}/g) || [];
        assert.strictEqual(hits.length, 0, `${name} içinde gerçek görünümlü bir anahtar var`);
    }
});
