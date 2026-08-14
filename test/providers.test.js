const test = require('node:test');
const assert = require('node:assert');
const core = require('../core.js');

// The multi-provider layer had four exported functions with no tests at all:
// extractProviderText, parseJsonResponse, readUsageTokens and getProvider. They
// are the ones that decide whether a response is usable, so a vendor changing an
// envelope field would have surfaced as "geçerli JSON döndürmedi" with no clue
// which provider or which layer produced it.

// ---------------------------------------------------------------- getProvider

test('getProvider returns the requested provider', () => {
    assert.strictEqual(core.getProvider('anthropic').id, 'anthropic');
    assert.strictEqual(core.getProvider('gemini').id, 'gemini');
});

test('getProvider falls back to the default for anything unknown', () => {
    // A stale localStorage value must not leave the request layer without a
    // provider object; it would throw on the first property read.
    for (const bogus of ['openai-v2', '', null, undefined, 'constructor', '__proto__']) {
        assert.strictEqual(core.getProvider(bogus).id, core.DEFAULT_PROVIDER,
            `${String(bogus)} varsayılana düşmedi`);
    }
});

// ------------------------------------------------------- buildProviderRequest

test('each provider gets its own endpoint, auth header and body shape', () => {
    const gemini = core.buildProviderRequest('gemini', 'gemini-flash-latest', 'merhaba', { maxTokens: 100 });
    assert.match(gemini.url, /generativelanguage\.googleapis\.com/);
    assert.strictEqual(gemini.authHeader.name, 'x-goog-api-key');
    assert.strictEqual(gemini.body.contents[0].parts[0].text, 'merhaba');
    assert.strictEqual(gemini.body.generationConfig.maxOutputTokens, 100);

    const anthropic = core.buildProviderRequest('anthropic', 'claude-haiku-4-5', 'merhaba', { maxTokens: 100 });
    assert.match(anthropic.url, /api\.anthropic\.com/);
    assert.strictEqual(anthropic.authHeader.name, 'x-api-key');
    assert.strictEqual(anthropic.body.max_tokens, 100);
    assert.strictEqual(anthropic.body.messages[0].content, 'merhaba');

    const openai = core.buildProviderRequest('openai', 'gpt-4o-mini', 'merhaba', { maxTokens: 100 });
    assert.match(openai.url, /api\.openai\.com/);
    assert.strictEqual(openai.authHeader.name, 'Authorization');
    assert.strictEqual(openai.authHeader.prefix, 'Bearer ');
});

test('anthropic requests carry the headers the browser call needs', () => {
    const { extraHeaders } = core.buildProviderRequest('anthropic', 'claude-haiku-4-5', 'x', {});
    assert.strictEqual(extraHeaders['anthropic-version'], '2023-06-01');
    // Without this the browser rejects the request before it is sent
    assert.strictEqual(extraHeaders['anthropic-dangerous-direct-browser-access'], 'true');
});

test('anthropic requests send no sampling parameters', () => {
    // The newer Claude models reject any non-default temperature with a 400, and
    // the fallback list spans model generations, so it must work on both.
    const { body } = core.buildProviderRequest('anthropic', 'claude-sonnet-5', 'x', { temperature: 0.9 });
    assert.ok(!('temperature' in body), 'temperature gönderiliyor — yeni modeller 400 döner');
    assert.ok(!('top_p' in body));
    assert.ok(!('top_k' in body));
});

test('an unknown provider id still produces a usable Gemini request', () => {
    const shaped = core.buildProviderRequest('nope', 'some-model', 'merhaba', {});
    assert.match(shaped.url, /generativelanguage/);
    assert.ok(shaped.authHeader.name);
});

// ------------------------------------------------------- extractProviderText

test('extractProviderText reads each provider envelope', () => {
    assert.strictEqual(core.extractProviderText('gemini', {
        candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'a' }, { text: 'b' }] } }]
    }), 'ab');

    assert.strictEqual(core.extractProviderText('anthropic', {
        content: [{ type: 'text', text: 'merhaba' }]
    }), 'merhaba');

    assert.strictEqual(core.extractProviderText('openai', {
        choices: [{ finish_reason: 'stop', message: { content: 'merhaba' } }]
    }), 'merhaba');
});

test('extractProviderText ignores non-text blocks from Anthropic', () => {
    // Thinking blocks arrive alongside text and must not end up in the JSON
    const text = core.extractProviderText('anthropic', {
        content: [
            { type: 'thinking', thinking: 'iç düşünce' },
            { type: 'text', text: '{"ok":true}' }
        ]
    });
    assert.strictEqual(text, '{"ok":true}');
});

test('extractProviderText reports a truncated answer rather than returning it', () => {
    // A partial JSON body parses as invalid further down, where the real cause
    // is no longer visible. Each provider signals truncation differently.
    assert.throws(() => core.extractProviderText('gemini', {
        candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{"a"' }] } }]
    }), /tamamlanamadı|MAX_TOKENS/);

    assert.throws(() => core.extractProviderText('anthropic', {
        stop_reason: 'max_tokens', content: [{ type: 'text', text: '{"a"' }]
    }), /token sınırına/);

    assert.throws(() => core.extractProviderText('openai', {
        choices: [{ finish_reason: 'length', message: { content: '{"a"' } }]
    }), /token sınırına/);
});

test('extractProviderText reports a refusal or filter block', () => {
    assert.throws(() => core.extractProviderText('anthropic', {
        stop_reason: 'refusal', content: []
    }), /reddetti/);

    assert.throws(() => core.extractProviderText('openai', {
        choices: [{ finish_reason: 'content_filter', message: { content: '' } }]
    }), /içerik filtresine/);

    assert.throws(() => core.extractProviderText('gemini', {
        promptFeedback: { blockReason: 'SAFETY' }
    }), /güvenlik filtresine.*SAFETY/);
});

test('extractProviderText survives a missing or empty envelope', () => {
    // Every one of these shapes threw "cannot read property of undefined" before
    // the guards, which told the user nothing about what went wrong.
    for (const providerId of ['gemini', 'anthropic', 'openai']) {
        for (const payload of [null, undefined, {}, { candidates: [] }, { content: [] }, { choices: [] }]) {
            assert.throws(() => core.extractProviderText(providerId, payload, 'Test'),
                /Test/, `${providerId} / ${JSON.stringify(payload)} anlamlı hata vermedi`);
        }
    }
});

test('extractProviderText puts the caller label in the message', () => {
    // "Fikir listesi" vs "Proje" is how the log says which pass failed
    assert.throws(() => core.extractProviderText('gemini', {}, 'Fikir listesi'), /Fikir listesi/);
    assert.throws(() => core.extractProviderText('gemini', {}), /Yanıt/);
});

// -------------------------------------------------------- parseJsonResponse

test('parseJsonResponse reads plain JSON', () => {
    assert.deepStrictEqual(core.parseJsonResponse('{"a":1}'), { a: 1 });
    assert.deepStrictEqual(core.parseJsonResponse('  {"a":1}  '), { a: 1 });
});

test('parseJsonResponse digs the object out of prose and code fences', () => {
    // Providers without a JSON mode wrap the object; rejecting those responses
    // would throw away a perfectly good answer.
    assert.deepStrictEqual(core.parseJsonResponse('```json\n{"a":1}\n```'), { a: 1 });
    assert.deepStrictEqual(core.parseJsonResponse('```\n{"a":1}\n```'), { a: 1 });
    assert.deepStrictEqual(core.parseJsonResponse('İşte cevap:\n{"a":1}\nUmarım yardımcı olur.'), { a: 1 });
});

test('parseJsonResponse handles nested braces and Turkish content', () => {
    const payload = { title: 'Şğüöçİ', step2: { architecture: 'a { b } c' }, n: [1, 2] };
    assert.deepStrictEqual(core.parseJsonResponse('cevap: ' + JSON.stringify(payload) + ' bitti'), payload);
});

test('parseJsonResponse rejects what is genuinely not an object', () => {
    for (const bad of ['', '   ', 'düz metin', '[1,2,3]', '42', 'null', '{bozuk']) {
        assert.throws(() => core.parseJsonResponse(bad, 'Proje'), /Proje.*JSON/,
            `${JSON.stringify(bad)} kabul edildi`);
    }
});

// --------------------------------------------------------- readUsageTokens

test('readUsageTokens normalises each provider accounting shape', () => {
    assert.strictEqual(core.readUsageTokens('gemini', { usageMetadata: { totalTokenCount: 900 } }), 900);
    assert.strictEqual(core.readUsageTokens('anthropic', { usage: { input_tokens: 10, output_tokens: 5 } }), 15);
    assert.strictEqual(core.readUsageTokens('openai', { usage: { total_tokens: 42 } }), 42);
});

test('readUsageTokens returns zero rather than NaN when usage is absent', () => {
    // The terminal prints this number; NaN there reads like a bug in the app
    for (const providerId of ['gemini', 'anthropic', 'openai']) {
        for (const payload of [null, undefined, {}, { usage: {} }]) {
            const value = core.readUsageTokens(providerId, payload);
            assert.strictEqual(typeof value, 'number');
            assert.ok(!Number.isNaN(value), `${providerId} NaN döndürdü`);
        }
    }
});

// ------------------------------------------------------------ JSON_ONLY_SUFFIX

test('providers without a JSON mode get an explicit instruction to add', () => {
    assert.ok(core.JSON_ONLY_SUFFIX.length > 0);
    assert.strictEqual(core.PROVIDERS.anthropic.nativeJsonMode, false,
        'Anthropic JSON modu varmış gibi işaretli — prompt eki atlanır');
    assert.strictEqual(core.PROVIDERS.gemini.nativeJsonMode, true);
});
