const test = require('node:test');
const assert = require('node:assert');
const core = require('../core.js');

test('escapeHtml neutralises every HTML-significant character', () => {
    assert.strictEqual(core.escapeHtml('<img src=x onerror="alert(1)">'),
        '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    assert.strictEqual(core.escapeHtml("it's & <that>"), 'it&#39;s &amp; &lt;that&gt;');
    // & must be escaped first, or the other replacements double-escape
    assert.strictEqual(core.escapeHtml('&lt;'), '&amp;lt;');
    assert.strictEqual(core.escapeHtml(42), '42');
});

test('parseMarkdown emits only its own tags', () => {
    const html = core.parseMarkdown('<script>alert(1)</script>');
    assert.ok(!html.includes('<script>'), 'script tag must not survive');
    assert.ok(html.includes('&lt;script&gt;'));
});

test('parseMarkdown still renders the supported syntax', () => {
    assert.ok(core.parseMarkdown('**kalın**').includes('<strong>kalın</strong>'));
    assert.ok(core.parseMarkdown('## Başlık').includes('<h2>Başlık</h2>'));
    assert.ok(core.parseMarkdown('### Alt').includes('<h3>Alt</h3>'));

    const list = core.parseMarkdown('* bir\n* iki');
    assert.ok(list.includes('<li>bir</li>'));
    assert.ok(list.includes('<li>iki</li>'));
    // consecutive items collapse into a single <ul>
    assert.strictEqual((list.match(/<ul>/g) || []).length, 1);
});

test('parseMarkdown handles empty input', () => {
    assert.strictEqual(core.parseMarkdown(''), '');
    assert.strictEqual(core.parseMarkdown(null), '');
    assert.strictEqual(core.parseMarkdown(undefined), '');
});

const validProject = () => ({
    title: 'Proje', tagline: 'Slogan', category: 'Kategori',
    step1: { marketGap: 'açık', description: 'açıklama' }
});

test('validateProjectShape accepts a complete project', () => {
    assert.strictEqual(core.validateProjectShape(validProject()), null);
});

test('validateProjectShape rejects malformed input', () => {
    assert.match(core.validateProjectShape(null), /proje nesnesi değil/);
    assert.match(core.validateProjectShape([]), /proje nesnesi değil/);
    assert.match(core.validateProjectShape('metin'), /proje nesnesi değil/);

    for (const field of ['title', 'tagline', 'category']) {
        const p = validProject();
        delete p[field];
        assert.match(core.validateProjectShape(p), new RegExp(field));
    }

    const blank = validProject();
    blank.title = '   ';
    assert.match(core.validateProjectShape(blank), /title/);

    const noStep1 = validProject();
    delete noStep1.step1;
    assert.match(core.validateProjectShape(noStep1), /step1/);

    for (const field of ['marketGap', 'description']) {
        const p = validProject();
        delete p.step1[field];
        assert.match(core.validateProjectShape(p), new RegExp(field));
    }
});

test('normalizeProject fills defaults and generates an id', () => {
    const p = core.normalizeProject(validProject(), 'web3', 1700000000000);
    assert.strictEqual(p.id, 'gemini-1700000000000');
    assert.strictEqual(p.categoryKey, 'web3');
    assert.deepStrictEqual(p.meta, {});
    assert.deepStrictEqual(p.diagramNodes, []);
    assert.deepStrictEqual(p.step1.tags, []);
});

test('normalizeProject keeps an explicit id and categoryKey', () => {
    const src = { ...validProject(), id: '  keep-me  ', categoryKey: 'edtech' };
    const p = core.normalizeProject(src, 'all', 1);
    assert.strictEqual(p.id, 'keep-me');
    assert.strictEqual(p.categoryKey, 'edtech');
});

test('normalizeProject filters malformed nodes and tags', () => {
    const src = {
        ...validProject(),
        diagramNodes: [{ name: 'iyi' }, 'kirli', null, 42, { sub: 'ad yok' }],
        step1: { marketGap: 'a', description: 'b', tags: ['Go', 42, null, 'Rust'] }
    };
    const p = core.normalizeProject(src, 'all', 1);
    assert.deepStrictEqual(p.diagramNodes, [{ name: 'iyi' }]);
    assert.deepStrictEqual(p.step1.tags, ['Go', 'Rust']);
});

test('normalizeProject drops a half-built step2', () => {
    const half = { ...validProject(), step2: { architecture: 'var', security: '  ' } };
    assert.strictEqual(core.normalizeProject(half, 'all', 1).step2, undefined);

    const missing = { ...validProject(), step2: { architecture: 'var' } };
    assert.strictEqual(core.normalizeProject(missing, 'all', 1).step2, undefined);

    const whole = { ...validProject(), step2: { architecture: 'a', security: 's' } };
    assert.ok(core.normalizeProject(whole, 'all', 1).step2);
});

test('normalizeProject does not mutate its input', () => {
    const src = validProject();
    core.normalizeProject(src, 'all', 1);
    assert.strictEqual(src.id, undefined);
    assert.strictEqual(src.step1.tags, undefined);
});

test('safeNodeType allows only styled types', () => {
    for (const type of core.NODE_TYPES) assert.strictEqual(core.safeNodeType(type), type);
    assert.strictEqual(core.safeNodeType('ai" onmouseover="alert(1)'), 'service');
    assert.strictEqual(core.safeNodeType(undefined), 'service');
});

const db = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

test('pickRandomProject never repeats the previous project', () => {
    for (let i = 0; i < 200; i++) {
        assert.notStrictEqual(core.pickRandomProject(db, 'b').id, 'b');
    }
});

test('pickRandomProject can still reach every project', () => {
    const seen = new Set();
    for (let i = 0; i < 500; i++) seen.add(core.pickRandomProject(db, null).id);
    assert.deepStrictEqual([...seen].sort(), ['a', 'b', 'c']);
});

test('pickRandomProject returns the only project in a single-entry category', () => {
    // The old index-based guard could loop or suppress the sole candidate here
    const single = [{ id: 'only' }];
    assert.strictEqual(core.pickRandomProject(single, 'only').id, 'only');
});

test('pickRandomProject handles an empty list', () => {
    assert.strictEqual(core.pickRandomProject([], null), null);
    assert.strictEqual(core.pickRandomProject(null, null), null);
});

test('pickRandomProject de-duplicates by id, not by position', () => {
    // 'b' sits at index 1 of the full list but index 0 of this filtered one:
    // an index-based guard would have suppressed the wrong entry.
    const filtered = [{ id: 'b' }, { id: 'c' }];
    for (let i = 0; i < 100; i++) {
        assert.strictEqual(core.pickRandomProject(filtered, 'b').id, 'c');
    }
});

test('pickUnseenProject never repeats until every project is seen', () => {
    let seen = [];
    const order = [];
    for (let i = 0; i < db.length; i++) {
        const r = core.pickUnseenProject(db, seen);
        assert.strictEqual(r.exhausted, false, `tur ${i}: erken tükenme`);
        order.push(r.project.id);
        seen = r.seen;
    }
    assert.deepStrictEqual([...order].sort(), ['a', 'b', 'c']);
    assert.strictEqual(new Set(order).size, db.length, 'aynı proje iki kez geldi');
});

test('pickUnseenProject reports exhaustion and starts a fresh cycle', () => {
    const r = core.pickUnseenProject(db, ['a', 'b', 'c']);
    assert.strictEqual(r.exhausted, true);
    assert.ok(['a', 'b', 'c'].includes(r.project.id));
    // The cycle restarts holding only the project just shown
    assert.deepStrictEqual(r.seen, [r.project.id]);
});

test('pickUnseenProject keeps seen ids from other categories on reset', () => {
    // 'x' belongs to another filter; exhausting this one must not erase its history
    const r = core.pickUnseenProject(db, ['a', 'b', 'c', 'x']);
    assert.strictEqual(r.exhausted, true);
    assert.ok(r.seen.includes('x'), 'başka kategorinin geçmişi silindi');
});

test('pickUnseenProject accumulates the seen set', () => {
    const first = core.pickUnseenProject(db, []);
    assert.deepStrictEqual(first.seen, [first.project.id]);

    const second = core.pickUnseenProject(db, first.seen);
    assert.strictEqual(second.seen.length, 2);
    assert.notStrictEqual(second.project.id, first.project.id);
});

test('pickUnseenProject handles empty and malformed input', () => {
    assert.strictEqual(core.pickUnseenProject([], []).project, null);
    assert.strictEqual(core.pickUnseenProject(null, null).project, null);
    // A corrupt seen list must not crash the picker
    assert.ok(core.pickUnseenProject(db, 'bozuk').project);
});

test('pickUnseenProject returns the only project in a single-entry category', () => {
    const single = [{ id: 'only' }];
    const r = core.pickUnseenProject(single, ['only']);
    assert.strictEqual(r.project.id, 'only');
    assert.strictEqual(r.exhausted, true);
});

test('CONSTRAINT_AXES gives the combination count the design relies on', () => {
    const axes = Object.values(core.CONSTRAINT_AXES);
    assert.strictEqual(axes.length, 4);
    for (const values of axes) {
        assert.ok(values.length >= 5, 'her eksende en az 5 değer olmalı');
        assert.strictEqual(new Set(values).size, values.length, 'eksende yinelenen değer var');
    }
    const combos = axes.reduce((n, v) => n * v.length, 1);
    assert.ok(combos >= 625, `beklenen >=625 kombinasyon, bulunan ${combos}`);
});

test('pickConstraintCombo draws one value per axis', () => {
    const combo = core.pickConstraintCombo();
    for (const [axis, values] of Object.entries(core.CONSTRAINT_AXES)) {
        assert.ok(values.includes(combo[axis]), `${axis} ekseninden geçersiz değer`);
    }
});

test('pickConstraintCombo actually varies', () => {
    const seen = new Set();
    for (let i = 0; i < 300; i++) seen.add(JSON.stringify(core.pickConstraintCombo()));
    assert.ok(seen.size > 50, `yalnızca ${seen.size} farklı kombinasyon üretildi`);
});

test('normalizeTitle ignores case, punctuation and spacing', () => {
    assert.strictEqual(core.normalizeTitle('AI-Destekli  Rapor!'), core.normalizeTitle('ai destekli rapor'));
    assert.strictEqual(core.normalizeTitle(null), '');
});

test('titleOverlap scores near-duplicates high and unrelated titles low', () => {
    assert.ok(core.titleOverlap('Akıllı Sulama Ağı', 'Akıllı Sulama Platformu') >= 0.5);
    assert.strictEqual(core.titleOverlap('Akıllı Sulama Ağı', 'Akıllı Sulama Ağı'), 1);
    assert.ok(core.titleOverlap('Akıllı Sulama Ağı', 'Blokzincir Denetim Motoru') < 0.3);
});

const ideas = [
    { title: 'Akıllı Sulama Ağı', summary: 'a' },
    { title: 'Blokzincir Denetim Motoru', summary: 'b' },
    { title: 'Karbon Takip Paneli', summary: 'c' }
];

test('selectFreshIdea skips ideas the user has already seen', () => {
    for (let i = 0; i < 50; i++) {
        const r = core.selectFreshIdea(ideas, ['Akıllı Sulama Ağı']);
        assert.notStrictEqual(r.idea.title, 'Akıllı Sulama Ağı');
        assert.strictEqual(r.exhausted, false);
        assert.strictEqual(r.freshCount, 2);
    }
});

test('selectFreshIdea also catches near-duplicates, not just exact matches', () => {
    const r = core.selectFreshIdea(ideas, ['Akıllı Sulama Platformu']);
    assert.notStrictEqual(r.idea.title, 'Akıllı Sulama Ağı', 'benzer başlık elenmedi');
    assert.strictEqual(r.freshCount, 2);
});

test('selectFreshIdea falls back to the least similar when all are known', () => {
    const r = core.selectFreshIdea(ideas, ideas.map(i => i.title));
    assert.strictEqual(r.exhausted, true);
    assert.strictEqual(r.freshCount, 0);
    assert.ok(r.idea, 'tükenmede bile bir fikir dönmeli');
});

test('selectFreshIdea reaches every fresh idea over many draws', () => {
    const picked = new Set();
    for (let i = 0; i < 300; i++) picked.add(core.selectFreshIdea(ideas, []).idea.title);
    assert.strictEqual(picked.size, 3);
});

test('selectFreshIdea rejects malformed batches', () => {
    assert.strictEqual(core.selectFreshIdea([], []).idea, null);
    assert.strictEqual(core.selectFreshIdea(null, []).idea, null);
    assert.strictEqual(core.selectFreshIdea([{ summary: 'başlıksız' }, null, 42], []).idea, null);
});

test('selectFreshIdea tolerates a corrupt known-title list', () => {
    assert.ok(core.selectFreshIdea(ideas, null).idea);
    assert.ok(core.selectFreshIdea(ideas, [null, 42, '']).idea);
});

const limits = { cooldownMs: 20000, maxPerHour: 15 };

test('evaluateRateLimit enforces the cooldown', () => {
    const v = core.evaluateRateLimit(10000, 0, [], limits);
    assert.strictEqual(v.allowed, false);
    assert.match(v.reason, /10 saniye/);
});

test('evaluateRateLimit allows a call once the cooldown expires', () => {
    assert.strictEqual(core.evaluateRateLimit(20000, 0, [], limits).allowed, true);
});

test('evaluateRateLimit enforces the hourly cap', () => {
    const now = 10_000_000;
    const history = Array.from({ length: 15 }, (_, i) => now - i * 1000);
    const v = core.evaluateRateLimit(now, 0, history, limits);
    assert.strictEqual(v.allowed, false);
    assert.match(v.reason, /15 sorgu\/saat/);
});

test('evaluateRateLimit prunes entries older than an hour', () => {
    const now = 10_000_000;
    const history = [now - 3_700_000, now - 3_600_001, now - 1000];
    const v = core.evaluateRateLimit(now, 0, history, limits);
    assert.deepStrictEqual(v.history, [now - 1000]);
    assert.strictEqual(v.allowed, true);
});

test('evaluateRateLimit survives a corrupt history', () => {
    assert.strictEqual(core.evaluateRateLimit(50000, 0, null, limits).allowed, true);
});

test('buildBlueprintMarkdown renders the stage 1 report', () => {
    const md = core.buildBlueprintMarkdown({
        ...validProject(), id: 'x',
        meta: { opportunityScore: '%97', difficulty: 'İleri' }
    });
    assert.ok(md.startsWith('# Proje —'));
    assert.ok(md.includes('%97'));
    assert.ok(md.includes('N/A'), 'missing meta falls back to N/A');
    assert.ok(md.includes('## 1. ALANDAKİ AÇIK'));
    assert.ok(md.includes('## 2. DETAYLI PROJE'));
    assert.ok(!md.includes('## 3.'), 'stage 2 sections are omitted without step2');
});

test('buildBlueprintMarkdown appends stage 2 when present', () => {
    const md = core.buildBlueprintMarkdown({
        ...validProject(), id: 'x',
        step2: { architecture: 'mimari metni', security: 'güvenlik metni' }
    });
    assert.ok(md.includes('## 3. KOD MİMARİSİ'));
    assert.ok(md.includes('mimari metni'));
    assert.ok(md.includes('## 4. GÜVENLİK'));
    assert.ok(md.includes('güvenlik metni'));
});

test('buildBlueprintMarkdown handles a missing project', () => {
    assert.strictEqual(core.buildBlueprintMarkdown(null), '');
});
