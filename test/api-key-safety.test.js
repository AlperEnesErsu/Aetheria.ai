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
const { bootApp, errorResponse } = require('./helpers/app-harness.js');

const TEST_KEY = 'AIzaTESTkeySafetySuite1234567890';
const withKey = { aetheria_key_gemini: TEST_KEY, aetheria_use_gemini: 'true' };

test('the key travels in a header, never in the URL', () => {
    // A key in the query string lands in browser history, referrer headers and any
    // proxy log on the way. It was in the URL originally; it must not go back.
    //
    // Each provider declares its own auth header, so the check runs over the
    // registry — a new vendor added without one fails here rather than shipping.
    const core = require('../core.js');
    const EXPECTED_HEADER = {
        gemini: 'x-goog-api-key',
        anthropic: 'x-api-key',
        openai: 'Authorization',
        openrouter: 'Authorization'
    };

    for (const id of Object.keys(core.PROVIDERS)) {
        const shaped = core.buildProviderRequest(id, 'test-model', 'merhaba', {});
        assert.ok(shaped.authHeader && shaped.authHeader.name,
            `${id}: kimlik doğrulama başlığı tanımlı değil`);
        assert.strictEqual(shaped.authHeader.name, EXPECTED_HEADER[id],
            `${id}: beklenmeyen kimlik doğrulama başlığı`);
        assert.ok(!/[?&]key=/i.test(shaped.url),
            `${id}: anahtar URL query string'inde taşınıyor`);
        assert.ok(!/\?/.test(shaped.url),
            `${id}: endpoint URL'inde query string var — anahtar oraya sızabilir`);
    }

    // And the app must attach it as a header, not append it to the URL
    assert.ok(/\[shaped\.authHeader\.name\]: shaped\.authHeader\.prefix/.test(appSource),
        'app.js anahtarı başlık olarak eklemiyor');
    assert.ok(!/[?&]key=/.test(appSource), 'anahtar URL query string\'inde taşınıyor');
});

test('the key is never written back into the DOM', async () => {
    // Prefilling the input put the raw key in the DOM on every load, where devtools,
    // a screen share or an extension could read it. Asserted against the rendered
    // page rather than the source: a grep cannot see what the field actually holds.
    const app = await bootApp({ storage: withKey });

    app.id('btnFeature2Notice').click();
    assert.strictEqual(app.id('geminiApiKey').value, '', 'anahtar input alanına geri yazıldı');
    assert.ok(!app.document.documentElement.innerHTML.includes(TEST_KEY),
        'anahtar sayfanın DOM ağacında bir yerde duruyor');
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

test('the user can delete the key outright', async () => {
    const app = await bootApp({ storage: withKey });

    app.id('btnFeature2Notice').click();
    app.id('btnForgetKey').click();

    // Deleting has to clear both stores, or a copy survives in the other one
    assert.strictEqual(app.window.localStorage.getItem('aetheria_key_gemini'), null);
    assert.strictEqual(app.window.sessionStorage.getItem('aetheria_key_gemini'), null);
    assert.ok(!app.document.documentElement.innerHTML.includes(TEST_KEY));
});

test('the key is stored in exactly one place at a time', async () => {
    // Session-only storage is the safer choice on a shared machine, and it is only
    // safer if the persistent copy is actually gone rather than merely unused.
    const app = await bootApp({ storage: withKey, fetch: async () => errorResponse(200) });

    app.id('btnFeature2Notice').click();
    app.id('rememberKeyToggle').checked = false;
    app.id('rememberKeyToggle').dispatchEvent(new app.window.Event('change'));
    app.id('geminiApiKey').value = TEST_KEY;
    app.id('btnSaveGeminiKey').click();
    await app.flush(2500);

    const local = app.window.localStorage.getItem('aetheria_key_gemini');
    const session = app.window.sessionStorage.getItem('aetheria_key_gemini');
    assert.ok(!(local && session), 'anahtarın iki kopyası birden duruyor');
});

test('session-only storage is offered', () => {
    assert.ok(/rememberKeyToggle/.test(htmlSource), 'saklama tercihi arayüzde yok');
    assert.ok(/sessionStorage\.setItem\(KEY_NAME/.test(appSource),
        'oturumluk saklama uygulanmamış');
});

test('the key never reaches the export or the saved pool', () => {
    // Blueprints get downloaded and pool entries get inspected; neither should be
    // able to carry the key along.
    // core.js may name a vendor's key-console URL; what it must not do is hold or
    // read a credential. So the check is for a binding, not for the substring —
    // `https://aistudio.google.com/app/apikey` is a link, not a secret.
    assert.ok(!/\b(apiKey|api_key)\s*[:=,)]/i.test(coreSource),
        'core.js bir anahtar değişkeni taşıyor — export yolu risk altında');
    assert.ok(!/geminiApiKey/.test(coreSource), 'core.js uygulama anahtarına erişiyor');

    const blueprint = coreSource.slice(coreSource.indexOf('function buildBlueprintMarkdown'));
    assert.ok(!/key/i.test(blueprint.slice(0, 1500).replace(/KEY_NAME/g, '')),
        'blueprint üretimi anahtarla ilgili bir alana bakıyor');
});

test('CSP still restricts where requests can go', () => {
    const csp = htmlSource.match(/Content-Security-Policy"[^>]*content="([^"]+)"/s);
    assert.ok(csp, 'CSP meta yok');
    // With the key in the browser, the set of reachable hosts is the blast radius.
    // Every provider origin must be listed explicitly and nothing else may be.
    const connectSrc = csp[1].match(/connect-src([^;]*)/);
    assert.ok(connectSrc, 'connect-src yok');

    const core = require('../core.js');
    const reachable = Object.values(core.PROVIDERS).filter(p => !p.browserBlocked);

    for (const provider of reachable) {
        assert.ok(connectSrc[1].includes(provider.origin),
            `connect-src ${provider.label} uç noktasını içermiyor — istek engellenir`);
    }

    // A provider the browser cannot reach anyway must not widen the allowlist:
    // every extra origin here is somewhere a stolen key could be sent.
    for (const provider of Object.values(core.PROVIDERS)) {
        if (!provider.browserBlocked) continue;
        assert.ok(!connectSrc[1].includes(provider.origin),
            `connect-src kullanılamayan ${provider.label} uç noktasına izin veriyor`);
    }

    // The evidence sources are the second half of the allowlist. They differ
    // from the provider origins in the way that matters here: no credential is
    // ever attached to a request going to them, which the test below pins.
    for (const source of Object.values(core.EVIDENCE_SOURCES)) {
        assert.ok(connectSrc[1].includes(source.origin),
            `connect-src ${source.label} uç noktasını içermiyor — kanıt sorgusu engellenir`);
    }

    const allowed = connectSrc[1].trim().split(/\s+/).filter(Boolean);
    const known = [
        ...reachable.map(p => p.origin),
        ...Object.values(core.EVIDENCE_SOURCES).map(source => source.origin)
    ];
    for (const host of allowed) {
        assert.ok(known.includes(host),
            `connect-src bilinmeyen bir hedefe izin veriyor: ${host}`);
    }

    // Every origin in the policy has to be one something actually uses. An
    // origin listed but never called is a permission granted for nothing.
    for (const host of known) {
        assert.ok(allowed.includes(host),
            `${host} kullanılıyor ama connect-src içinde yok`);
    }

    assert.ok(!/connect-src[^;]*\*/.test(csp[1]), 'connect-src joker karakter içeriyor');
    assert.ok(/script-src\s+'self'/.test(csp[1]), "script-src 'self' değil");
});

test('no credential can reach an evidence source', () => {
    // The sharpest line in the whole layer. The evidence origins are public and
    // keyless, and widening the CSP to reach them is only defensible while that
    // stays true — so the request builder has to be structurally incapable of
    // carrying a secret rather than merely not carrying one today.
    const core = require('../core.js');

    for (const id of Object.keys(core.EVIDENCE_SOURCES)) {
        const request = core.buildEvidenceRequest(id, 'test query');

        // A URL and nothing else: there is no headers object to put a key into.
        assert.deepStrictEqual(Object.keys(request), ['url'],
            `${id}: istek url dışında alan taşıyor`);

        for (const marker of [/api[_-]?key/i, /authorization/i, /x-goog/i, /x-api-key/i, /bearer/i]) {
            assert.ok(!marker.test(request.url),
                `${id}: URL kimlik bilgisi taşıyor gibi görünüyor`);
        }
    }

    // And the fetch call itself has to opt out of ambient credentials, or a
    // cookie for one of these hosts would ride along without anyone writing it in.
    const start = appSource.indexOf('async function fetchEvidence');
    assert.ok(start !== -1, 'fetchEvidence bulunamadı');
    const body = appSource.slice(start, appSource.indexOf('\n    }', start));

    assert.ok(/credentials:\s*'omit'/.test(body), 'kanıt isteği credentials: omit kullanmıyor');
    assert.ok(!/headers/i.test(body), 'kanıt isteğine başlık ekleniyor');
    assert.ok(!/geminiApiKey|Authorization|x-goog-api-key|x-api-key/i.test(body),
        'kanıt isteği anahtara dokunuyor');
});

test('core.js never receives the credential', () => {
    // The provider registry shapes requests; app.js is the only place that holds
    // the secret. If core.js ever grew a key parameter, the export path and the
    // test-runner logs would both become places a key could surface.
    const core = require('../core.js');
    const shaped = core.buildProviderRequest('anthropic', 'claude-haiku-4-5', 'merhaba', {});
    const serialized = JSON.stringify(shaped);

    assert.ok(!/sk-|AIza|Bearer\s+\w/.test(serialized),
        'buildProviderRequest çıktısında anahtar benzeri bir değer var');
    assert.strictEqual(shaped.authHeader.prefix, '',
        'Anthropic auth başlığı yanlış biçimde');
    assert.strictEqual(shaped.authHeader.name, 'x-api-key');
});

test('the saved pool is read through a validating reader', () => {
    // readJson only enforces shape when its fallback is an array, and the pool
    // passed null — so a corrupt entry reached the app as an object and every
    // pool operation failed on it, silently.
    assert.ok(/readProjectArray\('aetheria_community_pool'\)/.test(appSource),
        'proje havuzu doğrulanmadan okunuyor');
    assert.ok(!/readJson\('aetheria_community_pool'/.test(appSource),
        'havuz hâlâ korumasız readJson ile okunuyor');

    const reader = appSource.slice(appSource.indexOf('function readProjectArray'));
    assert.ok(/Array\.isArray\(raw\)/.test(reader.slice(0, 700)),
        'okuyucu dizi kontrolü yapmıyor');
    assert.ok(/entry\.id !== undefined/.test(reader.slice(0, 700)),
        'okuyucu bozuk girdileri elemiyor');
});

test('each provider key is stored under its own name', () => {
    // One shared slot meant switching vendors silently discarded the other key.
    assert.ok(/aetheria_key_\$\{providerId\}/.test(appSource),
        'anahtarlar sağlayıcı başına saklanmıyor');
    assert.ok(/function migrateLegacyKey/.test(appSource),
        'eski tek-slot anahtarı taşınmıyor — kullanıcı anahtarını kaybeder');
});

test('every vendor key format is redacted from the terminal', () => {
    const redact = appSource.slice(appSource.indexOf('function redactSecrets'),
        appSource.indexOf('function redactSecrets') + 1200);
    for (const [name, pattern] of [
        ['Google', /AIza\[0-9A-Za-z_-\]/],
        ['Anthropic', /sk-ant-\[0-9A-Za-z_-\]/],
        ['OpenRouter', /sk-or-v1-\[0-9A-Za-z_-\]/],
        ['OpenAI', /sk-\[0-9A-Za-z_-\]/]
    ]) {
        assert.ok(pattern.test(redact), `${name} anahtar biçimi redaksiyondan geçmiyor`);
    }
});

test('no key-shaped literal is committed in the sources', () => {
    for (const [name, src] of [['app.js', appSource], ['core.js', coreSource], ['index.html', htmlSource]]) {
        const hits = src.match(/AIza[0-9A-Za-z_-]{20,}/g) || [];
        assert.strictEqual(hits.length, 0, `${name} içinde gerçek görünümlü bir anahtar var`);
    }
});
