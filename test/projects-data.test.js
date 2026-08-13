const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../core.js');

const root = path.join(__dirname, '..');

// projects-data.js is a plain browser script declaring a top-level const, so it
// cannot be require()d. Evaluating it and reading the binding back is the
// smallest way to test the real file the browser loads.
const projects = eval(
    fs.readFileSync(path.join(root, 'projects-data.js'), 'utf8') + '; PROJECTS_DATABASE'
);

const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const filterKeys = [...html.matchAll(/data-category="([^"]+)"/g)]
    .map(m => m[1])
    .filter(key => key !== 'all');

const MIN_PER_CATEGORY = 3;

test('database is a non-empty array', () => {
    assert.ok(Array.isArray(projects));
    assert.ok(projects.length > 0);
});

test('every project satisfies the shape the renderer requires', () => {
    for (const p of projects) {
        assert.strictEqual(core.validateProjectShape(p), null, `geçersiz proje: ${p && p.id}`);
    }
});

test('project ids are present and unique', () => {
    const ids = projects.map(p => p.id);
    for (const id of ids) {
        assert.strictEqual(typeof id, 'string');
        assert.ok(id.trim().length > 0);
    }
    assert.strictEqual(new Set(ids).size, ids.length, 'yinelenen id var');
});

test('project titles are unique', () => {
    const titles = projects.map(p => p.title);
    assert.strictEqual(new Set(titles).size, titles.length, 'yinelenen başlık var');
});

test('every category has at least three projects', () => {
    const counts = {};
    for (const p of projects) counts[p.categoryKey] = (counts[p.categoryKey] || 0) + 1;

    for (const [key, count] of Object.entries(counts)) {
        assert.ok(count >= MIN_PER_CATEGORY,
            `"${key}" kategorisinde ${count} proje var, en az ${MIN_PER_CATEGORY} olmalı`);
    }
});

test('every category is reachable from a filter button', () => {
    // The devops category once existed in the data with no button in the UI,
    // which made its project unreachable through the filter bar.
    for (const p of projects) {
        assert.ok(filterKeys.includes(p.categoryKey),
            `"${p.categoryKey}" için index.html'de filtre butonu yok`);
    }
});

test('every filter button matches at least three projects', () => {
    for (const key of filterKeys) {
        const matching = projects.filter(p => p.categoryKey === key);
        assert.ok(matching.length >= MIN_PER_CATEGORY,
            `"${key}" filtresi ${matching.length} proje getiriyor, en az ${MIN_PER_CATEGORY} olmalı`);
    }
});

test('a category label is consistent across its projects', () => {
    const labels = {};
    for (const p of projects) {
        if (labels[p.categoryKey]) {
            assert.strictEqual(p.category, labels[p.categoryKey],
                `"${p.categoryKey}" için tutarsız kategori adı: ${p.id}`);
        } else {
            labels[p.categoryKey] = p.category;
        }
    }
});

test('every project carries the full metadata grid', () => {
    for (const p of projects) {
        for (const field of ['difficulty', 'mvpTime', 'monetization', 'opportunityScore']) {
            assert.ok(p.meta && typeof p.meta[field] === 'string' && p.meta[field].trim(),
                `${p.id}: meta.${field} eksik`);
        }
    }
});

test('every project ships a complete stage 2 report', () => {
    for (const p of projects) {
        assert.ok(p.step2, `${p.id}: step2 eksik`);
        for (const field of ['architecture', 'security']) {
            assert.ok(typeof p.step2[field] === 'string' && p.step2[field].trim().length > 200,
                `${p.id}: step2.${field} yok veya fazla kısa`);
        }
    }
});

test('diagram nodes are renderable and use styled types', () => {
    for (const p of projects) {
        assert.ok(Array.isArray(p.diagramNodes) && p.diagramNodes.length >= 4,
            `${p.id}: en az 4 diyagram düğümü bekleniyor`);

        for (const node of p.diagramNodes) {
            assert.ok(typeof node.name === 'string' && node.name.trim(), `${p.id}: düğüm adı eksik`);
            assert.ok(core.NODE_TYPES.includes(node.type),
                `${p.id}: "${node.type}" stilsiz bir düğüm tipi (izinliler: ${core.NODE_TYPES.join(', ')})`);
        }
    }
});

test('every project has tags', () => {
    for (const p of projects) {
        assert.ok(Array.isArray(p.step1.tags) && p.step1.tags.length >= 3, `${p.id}: en az 3 etiket bekleniyor`);
        for (const tag of p.step1.tags) {
            assert.strictEqual(typeof tag, 'string', `${p.id}: etiket string olmalı`);
        }
    }
});

test('stage 1 content is substantial enough to fill the cards', () => {
    for (const p of projects) {
        assert.ok(p.step1.marketGap.trim().length > 300, `${p.id}: marketGap fazla kısa`);
        assert.ok(p.step1.description.trim().length > 300, `${p.id}: description fazla kısa`);
    }
});

test('projects survive normalization unchanged', () => {
    // Bundled projects are already complete, so normalizeProject should not need
    // to invent an id, drop step2 or strip any node.
    for (const p of projects) {
        const n = core.normalizeProject(p, 'all', 1);
        assert.strictEqual(n.id, p.id, `${p.id}: id normalizasyonda değişti`);
        assert.ok(n.step2, `${p.id}: step2 normalizasyonda düştü`);
        assert.strictEqual(n.diagramNodes.length, p.diagramNodes.length, `${p.id}: düğüm ayıklandı`);
        assert.strictEqual(n.step1.tags.length, p.step1.tags.length, `${p.id}: etiket ayıklandı`);
    }
});

test('every project renders a complete blueprint', () => {
    for (const p of projects) {
        const md = core.buildBlueprintMarkdown(p);
        assert.ok(md.includes(p.title), `${p.id}: başlık blueprint'te yok`);
        assert.ok(md.includes('## 3. KOD MİMARİSİ'), `${p.id}: mimari bölümü blueprint'te yok`);
        // Check the meta lines rather than the whole document. A bare
        // includes('N/A') matched legitimate prose — "(JSON/ARB/PO)" contains the
        // substring — and failed a project whose meta was complete.
        const placeholderLines = md.split('\n').filter(line => /^> \*\*.+\*\*: N\/A\s*$/.test(line));
        assert.strictEqual(placeholderLines.length, 0,
            `${p.id}: eksik meta yüzünden blueprint'te N/A var → ${placeholderLines.join(' | ')}`);
    }
});

// The scope picker turned one list into sixteen buckets. Guaranteeing three
// projects per category is no longer enough on its own: with a single national
// project in a category, "Ulusal + DevOps" returned the same project on every
// press. Each bucket the UI can actually select needs more than one entry.
test('every category has at least two projects in each scope', () => {
    const MIN_PER_BUCKET = 2;
    const categories = [...new Set(projects.map(p => p.categoryKey))];

    for (const categoryKey of categories) {
        for (const scope of ['national', 'international']) {
            const bucket = projects.filter(p => p.categoryKey === categoryKey && p.scope === scope);
            assert.ok(bucket.length >= MIN_PER_BUCKET,
                `${categoryKey} + ${scope}: ${bucket.length} proje var, en az ${MIN_PER_BUCKET} gerekiyor ` +
                '(aksi hâlde aynı proje arka arkaya gelir)');
        }
    }
});

test('every project has a valid scope (national or international)', () => {
    for (const p of projects) {
        assert.ok(p.scope === 'national' || p.scope === 'international', `${p.id}: geçersiz scope (${p.scope})`);
    }
    const nationalCount = projects.filter(p => p.scope === 'national').length;
    const internationalCount = projects.filter(p => p.scope === 'international').length;
    assert.ok(nationalCount >= 5, `Yeterli ulusal proje bulunamadı: ${nationalCount}`);
    assert.ok(internationalCount >= 5, `Yeterli uluslararası proje bulunamadı: ${internationalCount}`);
});
