// Detailed generation: weights, scoring and the Pass 1 prompt.
//
// All pure — no DOM, no network. The evidence layer that consumes these scores
// is tested separately in evidence.test.js.

const test = require('node:test');
const assert = require('node:assert');
const core = require('../core.js');

const CRITERIA = ['evidence', 'feasibility', 'gap', 'originality'];

const sum = obj => Object.values(obj).reduce((a, b) => a + b, 0);

const idea = (title, scores) => ({
    title,
    summary: `${title} özeti`,
    searchTerms: ['test term'],
    scores
});

// ── normalizeWeights ─────────────────────────────────────────────────────────

test('normalizeWeights returns weights that sum to 1', () => {
    const w = core.normalizeWeights({ evidence: 40, feasibility: 30, gap: 20, originality: 10 });
    assert.ok(Math.abs(sum(w) - 1) < 1e-9, `toplam 1 olmalı, ${sum(w)} geldi`);
    assert.ok(w.evidence > w.feasibility, 'daha ağır kriter daha büyük paya sahip olmalı');
});

test('normalizeWeights keeps the ratio, not the raw numbers', () => {
    // 2:1 stays 2:1 whether it is written as 80/40 or 8/4.
    const big = core.normalizeWeights({ evidence: 80, feasibility: 40, gap: 0, originality: 0 });
    const small = core.normalizeWeights({ evidence: 8, feasibility: 4, gap: 0, originality: 0 });
    for (const id of CRITERIA) {
        assert.ok(Math.abs(big[id] - small[id]) < 1e-9, `${id} ölçekten etkilenmemeli`);
    }
});

test('normalizeWeights falls back to an equal split when every slider is zero', () => {
    // The panel can reach all-zero, and dividing by that total would make every
    // downstream score NaN.
    const w = core.normalizeWeights({ evidence: 0, feasibility: 0, gap: 0, originality: 0 });
    assert.ok(Math.abs(sum(w) - 1) < 1e-9);
    for (const id of CRITERIA) assert.strictEqual(w[id], 0.25);
});

test('normalizeWeights drops unknown keys and clamps out-of-range ones', () => {
    // A stale localStorage entry from an older build must not introduce a
    // criterion the scorer has no idea how to apply.
    const w = core.normalizeWeights({
        evidence: 50, feasibility: 50, gap: 0, originality: 0,
        birKriterDahaOlsun: 900
    });
    assert.strictEqual(w.birKriterDahaOlsun, undefined);
    assert.deepStrictEqual(Object.keys(w).sort(), [...CRITERIA].sort());
    assert.ok(Math.abs(sum(w) - 1) < 1e-9);

    const clamped = core.normalizeWeights({ evidence: 500, feasibility: -80, gap: 0, originality: 0 });
    assert.strictEqual(clamped.evidence, 1, 'tek pozitif kriter tüm payı almalı');
    assert.strictEqual(clamped.feasibility, 0, 'negatif ağırlık 0\'a kırpılmalı');
});

test('normalizeWeights survives junk input without producing NaN', () => {
    for (const input of [null, undefined, 'ağırlıklar', { evidence: NaN }, { evidence: Infinity }]) {
        const w = core.normalizeWeights(input);
        assert.ok(Math.abs(sum(w) - 1) < 1e-9, `${JSON.stringify(input)} için toplam bozuldu`);
        for (const id of CRITERIA) assert.ok(Number.isFinite(w[id]), `${id} sonlu değil`);
    }
});

// ── scoreIdeas ───────────────────────────────────────────────────────────────

test('scoreIdeas returns ideas best-first with a breakdown that explains the total', () => {
    const scored = core.scoreIdeas([
        idea('Zayıf', { evidence: 10, feasibility: 10, gap: 10, originality: 10 }),
        idea('Güçlü', { evidence: 90, feasibility: 90, gap: 90, originality: 90 })
    ], { evidence: 25, feasibility: 25, gap: 25, originality: 25 });

    assert.strictEqual(scored[0].idea.title, 'Güçlü', 'yüksek puanlı önce gelmeli');
    assert.strictEqual(scored.length, 2);

    // The breakdown is what the UI shows as the reason, so it has to add up to the
    // number displayed next to it.
    const top = scored[0];
    const fromBreakdown = top.breakdown.reduce((t, b) => t + b.contribution, 0);
    assert.ok(Math.abs(top.total - fromBreakdown) < 1e-9, 'breakdown toplamı total ile tutmuyor');
    assert.deepStrictEqual(top.breakdown.map(b => b.criterion), CRITERIA);
    for (const row of top.breakdown) {
        assert.ok(row.label, 'her satırın insan-okur etiketi olmalı');
    }
});

test('scoreIdeas lets the weights decide the order', () => {
    const ideas = [
        idea('KanıtlıAma Zor', { evidence: 100, feasibility: 0, gap: 50, originality: 50 }),
        idea('Kolay Ama Dayanaksız', { evidence: 0, feasibility: 100, gap: 50, originality: 50 })
    ];

    const byEvidence = core.scoreIdeas(ideas, { evidence: 100, feasibility: 0, gap: 0, originality: 0 });
    assert.strictEqual(byEvidence[0].idea.title, 'KanıtlıAma Zor');

    const byFeasibility = core.scoreIdeas(ideas, { evidence: 0, feasibility: 100, gap: 0, originality: 0 });
    assert.strictEqual(byFeasibility[0].idea.title, 'Kolay Ama Dayanaksız');
});

test('scoreIdeas treats a missing or malformed score as zero, not as NaN', () => {
    const scored = core.scoreIdeas([
        { title: 'Puansız' },
        idea('Bozuk', { evidence: 'çok iyi', feasibility: null, gap: undefined, originality: 50 })
    ], { evidence: 25, feasibility: 25, gap: 25, originality: 25 });

    for (const row of scored) {
        assert.ok(Number.isFinite(row.total), `${row.idea.title} için total sonlu değil`);
    }
});

test('scoreIdeas ignores entries that are not ideas', () => {
    const scored = core.scoreIdeas([null, undefined, 'fikir', idea('Gerçek', { evidence: 50 })], {});
    assert.strictEqual(scored.length, 1);
    assert.strictEqual(scored[0].idea.title, 'Gerçek');
});

// ── pickWeightedIdea ─────────────────────────────────────────────────────────

test('pickWeightedIdea picks the highest score rather than at random', () => {
    // The whole point of detailed mode: the winner is determined by the weights,
    // so an rng that always returns 0 must not drag the first entry to the top.
    const ideas = [
        idea('Birinci Sırada Ama Zayıf', { evidence: 10, feasibility: 10, gap: 10, originality: 10 }),
        idea('Sonda Ama Güçlü', { evidence: 95, feasibility: 95, gap: 95, originality: 95 })
    ];

    const picked = core.pickWeightedIdea(ideas, [], { evidence: 25, feasibility: 25, gap: 25, originality: 25 }, () => 0);
    assert.strictEqual(picked.idea.title, 'Sonda Ama Güçlü');
    assert.strictEqual(picked.exhausted, false);
    assert.strictEqual(picked.freshCount, 2);
});

test('moving the weights changes which idea wins', () => {
    // This is the assertion a prompt-text approach cannot make, and the reason the
    // scoring lives in the app rather than in the model.
    const ideas = [
        idea('Dayanağı Sağlam', { evidence: 100, feasibility: 20, gap: 40, originality: 40 }),
        idea('Hemen Yapılır', { evidence: 20, feasibility: 100, gap: 40, originality: 40 })
    ];

    const a = core.pickWeightedIdea(ideas, [], { evidence: 90, feasibility: 10, gap: 0, originality: 0 }, () => 0);
    const b = core.pickWeightedIdea(ideas, [], { evidence: 10, feasibility: 90, gap: 0, originality: 0 }, () => 0);

    assert.strictEqual(a.idea.title, 'Dayanağı Sağlam');
    assert.strictEqual(b.idea.title, 'Hemen Yapılır');
    assert.notStrictEqual(a.idea.title, b.idea.title, 'ağırlık kaydırmak kazananı değiştirmeli');
});

test('pickWeightedIdea applies freshness before scoring, not after', () => {
    // A high score must not buy an idea past the repeat filter, or moving a slider
    // would start returning projects the user has already been shown.
    const ideas = [
        idea('Akıllı Sulama Ağı', { evidence: 100, feasibility: 100, gap: 100, originality: 100 }),
        idea('Kentsel Gürültü Haritası', { evidence: 30, feasibility: 30, gap: 30, originality: 30 })
    ];

    const picked = core.pickWeightedIdea(ideas, ['Akıllı Sulama Platformu'], {}, () => 0);
    assert.strictEqual(picked.idea.title, 'Kentsel Gürültü Haritası',
        'zaten görülmüş fikir yüksek puanla geri gelmemeli');
    assert.strictEqual(picked.freshCount, 1);
    assert.strictEqual(picked.exhausted, false);
});

test('pickWeightedIdea still answers when every idea is already known', () => {
    const ideas = [idea('Akıllı Sulama Ağı', { evidence: 80 }), idea('Akıllı Sulama Sistemi', { evidence: 90 })];
    const picked = core.pickWeightedIdea(ideas, ['Akıllı Sulama Ağı', 'Akıllı Sulama Sistemi'], {}, () => 0);

    assert.ok(picked.idea, 'tükenmiş partide bile bir fikir dönmeli');
    assert.strictEqual(picked.exhausted, true);
    assert.strictEqual(picked.freshCount, 0);
});

test('pickWeightedIdea reports an empty batch instead of throwing', () => {
    for (const input of [[], null, undefined, [null, { title: '   ' }]]) {
        const picked = core.pickWeightedIdea(input, [], {}, () => 0);
        assert.strictEqual(picked.idea, null);
        assert.deepStrictEqual(picked.scored, []);
    }
});

// ── clampSourceMaterial ──────────────────────────────────────────────────────

test('clampSourceMaterial leaves material under the cap untouched', () => {
    const text = 'Kısa bir kaynak metni.';
    const out = core.clampSourceMaterial(text);
    assert.strictEqual(out.text, text);
    assert.strictEqual(out.truncated, false);
    assert.strictEqual(out.chars, text.length);
});

test('clampSourceMaterial cuts oversized material and says so', () => {
    const out = core.clampSourceMaterial('kelime '.repeat(5000));
    assert.strictEqual(out.truncated, true);
    assert.ok(out.chars <= core.SOURCE_MATERIAL_MAX_CHARS, 'tavan aşıldı');
    assert.strictEqual(out.chars, out.text.length, 'chars metnin uzunluğuyla tutmalı');
});

test('clampSourceMaterial cuts at a word boundary', () => {
    const out = core.clampSourceMaterial('a'.repeat(20) + ' ' + 'kelime '.repeat(5000));
    assert.strictEqual(out.truncated, true);
    assert.ok(!/\S$/.test(out.text) || out.text.endsWith('kelime'),
        'kesme kelimenin ortasında olmamalı');
});

test('clampSourceMaterial treats a missing value as empty', () => {
    for (const input of [null, undefined, 42, {}]) {
        const out = core.clampSourceMaterial(input);
        assert.strictEqual(out.text, '');
        assert.strictEqual(out.chars, 0);
        assert.strictEqual(out.truncated, false);
    }
});

// ── buildDetailedIdeationPrompt ──────────────────────────────────────────────

test('buildDetailedIdeationPrompt carries the pasted material into the prompt', () => {
    const marker = 'BU CÜMLE KAYNAK MATERYALDEN GELİYOR';
    const prompt = core.buildDetailedIdeationPrompt({
        categoryLabel: 'sağlık teknolojileri',
        sourceMaterial: `Giriş paragrafı. ${marker} Kapanış paragrafı.`
    });

    assert.ok(prompt.includes(marker), 'materyal prompt\'a girmemiş');
    assert.ok(prompt.includes('sağlık teknolojileri'));
});

test('buildDetailedIdeationPrompt demands a verbatim quote only when there is material to quote', () => {
    const withMaterial = core.buildDetailedIdeationPrompt({ sourceMaterial: 'Ölçülmüş bir gözlem.' });
    assert.ok(/BİREBİR/.test(withMaterial), 'materyal varken birebir alıntı istenmeli');
    assert.ok(withMaterial.includes('"source"'));

    // Asking for a verbatim quote from a document that was never supplied would be
    // an instruction the model can only satisfy by inventing one.
    const without = core.buildDetailedIdeationPrompt({});
    assert.ok(!/BİREBİR/.test(without), 'materyal yokken birebir alıntı istenmemeli');
    assert.ok(without.includes('"model-knowledge"'));
});

test('buildDetailedIdeationPrompt rejects vague references and warns that the name is searched', () => {
    const prompt = core.buildDetailedIdeationPrompt({ method: 'country', reference: 'Estonya' });

    assert.ok(prompt.includes('ADI KONMUŞ'), 'aranabilir ad kuralı eksik');
    assert.ok(prompt.includes('REDDEDİLİR'), 'belirsiz ifadenin reddedileceği söylenmeli');
    assert.ok(/aranacak/.test(prompt), 'adın aranacağı modele söylenmeli');
    assert.ok(prompt.includes('Estonya'), 'referans prompt\'a girmemiş');
});

test('buildDetailedIdeationPrompt includes the chosen angle and comparison guidance', () => {
    const contrarian = core.buildDetailedIdeationPrompt({ angle: 'contrarian', method: 'time' });
    assert.ok(contrarian.includes(core.IDEATION_ANGLES.contrarian.promptGuidance));
    assert.ok(contrarian.includes(core.COMPARISON_METHODS.time.promptGuidance));

    const practical = core.buildDetailedIdeationPrompt({ angle: 'practical', method: 'sector' });
    assert.ok(practical.includes(core.IDEATION_ANGLES.practical.promptGuidance));
    assert.ok(!practical.includes(core.IDEATION_ANGLES.contrarian.promptGuidance),
        'seçilmeyen açı prompt\'a sızmamalı');
});

test('buildDetailedIdeationPrompt falls back to known values for unknown angle or method', () => {
    const prompt = core.buildDetailedIdeationPrompt({ angle: 'yok-böyle-bir-açı', method: 'yok-böyle-bir-metot' });
    assert.ok(prompt.includes(core.IDEATION_ANGLES.evidence.promptGuidance));
    assert.ok(prompt.includes(core.COMPARISON_METHODS.sector.promptGuidance));
    assert.ok(!prompt.includes('undefined'), 'prompt\'a undefined sızmış');
});

test('buildDetailedIdeationPrompt passes the avoid list through', () => {
    const prompt = core.buildDetailedIdeationPrompt({ avoidTitles: ['Akıllı Sulama Ağı', '  ', null] });
    assert.ok(prompt.includes('Akıllı Sulama Ağı'));
    assert.ok(prompt.includes('KAÇIN'));
});

test('buildDetailedIdeationPrompt asks for the schema the parser expects', () => {
    const prompt = core.buildDetailedIdeationPrompt({});
    for (const field of ['referenceExample', 'localState', 'structuralReason', 'searchTerms', 'scores']) {
        assert.ok(prompt.includes(field), `şemada ${field} eksik`);
    }
    for (const criterion of CRITERIA) {
        assert.ok(prompt.includes(criterion), `şemada ${criterion} puanı eksik`);
    }
});

// ── registries ───────────────────────────────────────────────────────────────

test('every comparison method declares an honest verifiability', () => {
    // The badge is the user's only signal that these four are not equally
    // checkable, so an unknown value must not slip through as if it were fine.
    const allowed = ['measurable', 'partial', 'unverifiable'];
    for (const [id, method] of Object.entries(core.COMPARISON_METHODS)) {
        assert.ok(allowed.includes(method.verifiability), `${id}: bilinmeyen doğrulanabilirlik`);
        assert.ok(method.label && method.referenceLabel && method.promptGuidance, `${id}: eksik alan`);
    }
});

test('the scale method claims no verification strategy', () => {
    // No free source holds the enterprise/SME distinction. Pretending otherwise is
    // exactly the structured-hallucination failure this mode exists to avoid.
    assert.strictEqual(core.COMPARISON_METHODS.scale.verifyStrategy, null);
    assert.strictEqual(core.COMPARISON_METHODS.scale.verifiability, 'unverifiable');
});

test('the default weights are the four criteria and add up to 100', () => {
    const defaults = Object.values(core.SCORING_CRITERIA).map(c => c.defaultWeight);
    assert.strictEqual(defaults.reduce((a, b) => a + b, 0), 100);
    assert.deepStrictEqual(Object.keys(core.SCORING_CRITERIA), CRITERIA);
});
