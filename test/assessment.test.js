// Fikir değerlendirme: the mode that takes the user's own idea rather than
// handing them one.
//
// Pure — no DOM, no network. The evidence layer these results lean on is tested
// in evidence.test.js and is reused here unchanged.

const test = require('node:test');
const assert = require('node:assert');
const core = require('../core.js');

const IDEA = 'Tarım sigortası hasar dosyalarını otomatik inceleyip anomali işaretleyen bir sistem.';

const scored = (over) => Object.assign({
    idea: { title: 'Test' },
    total: 62,
    breakdown: [
        { criterion: 'evidence', label: 'Kanıt gücü', score: 80, weight: 0.4, contribution: 32 },
        { criterion: 'feasibility', label: 'Uygulanabilirlik', score: 60, weight: 0.3, contribution: 18 },
        { criterion: 'gap', label: 'Pazar boşluğu', score: 40, weight: 0.2, contribution: 8 },
        { criterion: 'originality', label: 'Teknik özgünlük', score: 40, weight: 0.1, contribution: 4 }
    ]
}, over);

// ── clampIdeaText ────────────────────────────────────────────────────────────

test('clampIdeaText leaves a normal description alone', () => {
    const out = core.clampIdeaText(IDEA);
    assert.strictEqual(out.text, IDEA);
    assert.strictEqual(out.truncated, false);
});

test('clampIdeaText caps a description that runs long', () => {
    // Shorter than the source-material ceiling on purpose: this is one project
    // being described, not a document to mine, and a longer input turns the model
    // into a summariser instead of an assessor.
    assert.ok(core.IDEA_TEXT_MAX_CHARS < core.SOURCE_MATERIAL_MAX_CHARS);

    const out = core.clampIdeaText('kelime '.repeat(2000));
    assert.strictEqual(out.truncated, true);
    assert.ok(out.chars <= core.IDEA_TEXT_MAX_CHARS);
    assert.strictEqual(out.chars, out.text.length);
});

test('clampIdeaText treats junk as empty', () => {
    for (const junk of [null, undefined, 42, {}, '   ']) {
        assert.strictEqual(core.clampIdeaText(junk).text, '');
    }
});

// ── buildAssessmentPrompt ────────────────────────────────────────────────────

test('buildAssessmentPrompt carries the user idea into the prompt', () => {
    const prompt = core.buildAssessmentPrompt({ ideaText: IDEA, method: 'sector' });
    assert.ok(prompt.includes(IDEA), 'kullanıcının fikri prompt\'a girmemiş');
});

test('buildAssessmentPrompt forbids replacing the idea', () => {
    // Left to itself the model improves the idea into a different one and then
    // assesses that, which reads as an assessment of yours and is not.
    const prompt = core.buildAssessmentPrompt({ ideaText: IDEA });
    assert.ok(/FİKRİ DEĞİŞTİRME/.test(prompt), 'fikri koruma kuralı eksik');
    assert.ok(/senin fikrini değil/.test(prompt));
});

test('buildAssessmentPrompt asks for risks, not just opportunities', () => {
    // An assessment that only lists upside is a pitch deck. Naming the weak side
    // is the job.
    const prompt = core.buildAssessmentPrompt({ ideaText: IDEA });
    assert.ok(prompt.includes('risks'), 'risk alanı istenmiyor');
    assert.ok(/Fikri övme/.test(prompt), 'modele övmemesi söylenmiyor');
    assert.ok(prompt.includes('opportunities'));
});

test('buildAssessmentPrompt tells the model its scores are labelled as opinion', () => {
    const prompt = core.buildAssessmentPrompt({ ideaText: IDEA });
    assert.ok(/SENİN görüşün/.test(prompt), 'puanların model görüşü olduğu söylenmiyor');
    assert.ok(/şişirme/.test(prompt));
});

test('buildAssessmentPrompt asks for the searchable fields the evidence layer needs', () => {
    // Same three fields the sector comparison measures on. Without them the
    // evidence layer has nothing to query and the assessment loses its only
    // measured part.
    const prompt = core.buildAssessmentPrompt({ ideaText: IDEA });
    for (const field of ['concept', 'referenceSector', 'targetSector', 'referenceExample']) {
        assert.ok(prompt.includes(field), `şemada ${field} eksik`);
    }
    assert.ok(/İNGİLİZCE/.test(prompt));
});

test('buildAssessmentPrompt returns nothing without an idea', () => {
    // No idea, no assessment. Prompting anyway would have the model invent one.
    for (const junk of [undefined, null, '', '   ', 42]) {
        assert.strictEqual(core.buildAssessmentPrompt({ ideaText: junk }), '');
    }
    assert.strictEqual(core.buildAssessmentPrompt(), '');
});

test('buildAssessmentPrompt carries scope and comparison method', () => {
    const national = core.buildAssessmentPrompt({ ideaText: IDEA, scope: 'national', method: 'country' });
    assert.ok(/Türkiye pazarı/.test(national));
    assert.ok(national.includes(core.COMPARISON_METHODS.country.promptGuidance));

    const global = core.buildAssessmentPrompt({ ideaText: IDEA, scope: 'international', method: 'time' });
    assert.ok(/Global pazar/.test(global));
    assert.ok(global.includes(core.COMPARISON_METHODS.time.promptGuidance));
});

// ── splitAssessment ──────────────────────────────────────────────────────────

test('splitAssessment separates what a source settled from what the model thinks', () => {
    // The whole point of the mode. Market size, revenue and competition cannot be
    // reached by anything this app talks to, so the criteria resting on judgement
    // must not be presented the way a measurement is.
    const out = core.splitAssessment(scored(), { status: 'measured', supportsClaim: true });

    assert.strictEqual(out.rows.length, 4);
    for (const row of out.rows) {
        assert.ok(['measured', 'model'].includes(row.basis), `${row.criterion}: dayanak etiketsiz`);
    }

    const basisOf = id => out.rows.find(r => r.criterion === id).basis;
    assert.strictEqual(basisOf('feasibility'), 'model', 'uygulanabilirlik ölçülmüş gibi sunulmuş');
    assert.strictEqual(basisOf('originality'), 'model', 'özgünlük ölçülmüş gibi sunulmuş');
});

test('splitAssessment reads the basis from the table rather than hardcoding it', () => {
    // A criterion must not be able to change sides quietly.
    for (const [id, basis] of Object.entries(core.CRITERION_BASIS)) {
        assert.ok(['measured', 'model'].includes(basis), `${id}: bilinmeyen dayanak`);
    }
    assert.deepStrictEqual(
        Object.keys(core.CRITERION_BASIS).sort(),
        Object.keys(core.SCORING_CRITERIA).sort(),
        'dayanak tablosu kriter tablosuyla aynı anahtarlara sahip olmalı'
    );
});

test('splitAssessment subtotals add up to the score they came from', () => {
    const row = scored();
    const out = core.splitAssessment(row, null);
    const total = out.modelTotal + out.claimTotal;
    assert.ok(Math.abs(total - row.total) < 1e-9,
        `alt toplamlar ${total}, puan ${row.total}`);
});

test('splitAssessment reports whether anything was actually measured', () => {
    // not_found, unverifiable and error all mean no source settled anything, and
    // none of them may read as a finding.
    for (const status of ['measured', 'verified']) {
        assert.strictEqual(core.splitAssessment(scored(), { status }).measured, true, status);
    }
    for (const status of ['not_found', 'unverifiable', 'error']) {
        assert.strictEqual(core.splitAssessment(scored(), { status }).measured, false, status);
    }
    assert.strictEqual(core.splitAssessment(scored(), null).measured, false);
});

test('splitAssessment never lowers a score', () => {
    // Same invariant the ranking rule carries: a query that simply missed cannot
    // cost the user anything.
    for (const status of ['verified', 'measured', 'not_found', 'unverifiable', 'error']) {
        for (const supportsClaim of [true, false, null]) {
            const out = core.splitAssessment(scored(), { status, supportsClaim });
            assert.ok(out.verificationBonus >= 0,
                `${status}/${supportsClaim} negatif katkı verdi`);
        }
    }
});

test('splitAssessment survives a missing breakdown', () => {
    for (const junk of [null, undefined, {}, { breakdown: 'yok' }]) {
        const out = core.splitAssessment(junk, null);
        assert.deepStrictEqual(out.rows, []);
        assert.strictEqual(out.modelTotal, 0);
        assert.strictEqual(out.claimTotal, 0);
    }
});

// ── normalizeAssessment ──────────────────────────────────────────────────────

const RAW = {
    title: 'Hasar Tarayıcı',
    restatement: 'Hasar dosyalarını tarar.',
    comparison: {
        concept: 'anomaly detection claims',
        referenceSector: 'fintech',
        targetSector: 'agriculture',
        referenceExample: 'Shift Technology',
        localState: 'bilinmiyor',
        structuralReason: 'hacim küçük',
        howToCheck: 'TARSİM raporuna bak'
    },
    opportunities: ['pilot', 'mobil'],
    risks: ['veri erişimi'],
    scores: { evidence: 70, feasibility: 60, gap: 80, originality: 50 }
};

test('normalizeAssessment keeps a well-formed answer intact', () => {
    const out = core.normalizeAssessment(RAW);
    assert.strictEqual(out.title, RAW.title);
    assert.deepStrictEqual(out.opportunities, RAW.opportunities);
    assert.deepStrictEqual(out.risks, RAW.risks);
    assert.deepStrictEqual(out.scores, RAW.scores);
    assert.strictEqual(out.comparison.concept, 'anomaly detection claims');
});

test('normalizeAssessment caps the lists the prompt asked to be short', () => {
    // "2-4 openings" and "2-3 risks" is the instruction. Twelve of either is a way
    // of saying nothing while looking thorough.
    const out = core.normalizeAssessment(Object.assign({}, RAW, {
        opportunities: Array.from({ length: 12 }, (_, i) => `açılım ${i}`),
        risks: Array.from({ length: 9 }, (_, i) => `risk ${i}`)
    }));
    assert.strictEqual(out.opportunities.length, core.ASSESSMENT_LIMITS.maxOpportunities);
    assert.strictEqual(out.risks.length, core.ASSESSMENT_LIMITS.maxRisks);
});

test('normalizeAssessment never invents a field the model left out', () => {
    // An absent risk list means the model named no risk, and the interface has to
    // be able to say that rather than showing a plausible default.
    const out = core.normalizeAssessment({ title: 'Sadece başlık' });
    assert.deepStrictEqual(out.opportunities, []);
    assert.deepStrictEqual(out.risks, []);
    assert.strictEqual(out.restatement, '');
    for (const field of Object.keys(core.SCORING_CRITERIA)) {
        assert.strictEqual(out.scores[field], 0, `${field} uydurulmuş`);
    }
});

test('normalizeAssessment clamps scores into range', () => {
    const out = core.normalizeAssessment(Object.assign({}, RAW, {
        scores: { evidence: 5000, feasibility: -20, gap: 'çok', originality: null }
    }));
    assert.strictEqual(out.scores.evidence, 100);
    assert.strictEqual(out.scores.feasibility, 0);
    assert.strictEqual(out.scores.gap, 0);
    assert.strictEqual(out.scores.originality, 0);
});

test('normalizeAssessment returns nothing when there is nothing to show', () => {
    // A card that renders headings over blanks reads as a result and is not one.
    for (const junk of [null, undefined, 'metin', 42, [], {}, { scores: { evidence: 90 } }]) {
        assert.strictEqual(core.normalizeAssessment(junk), null,
            `${JSON.stringify(junk)} değerlendirme sayıldı`);
    }
});

test('normalizeAssessment drops junk entries out of the lists', () => {
    const out = core.normalizeAssessment(Object.assign({}, RAW, {
        opportunities: ['gerçek', '', '   ', null, 42, { a: 1 }, 'ikinci'],
        risks: 'liste değil'
    }));
    assert.deepStrictEqual(out.opportunities, ['gerçek', 'ikinci']);
    assert.deepStrictEqual(out.risks, []);
});

// ── buildAssessmentMarkdown ──────────────────────────────────────────────────

test('buildAssessmentMarkdown carries the split into the exported text', () => {
    // A pasted report that merged the measured half into the opinion half would
    // launder the model's guesses into findings the moment it left the page.
    const assessment = core.normalizeAssessment(RAW);
    const split = core.splitAssessment(scored(), { status: 'measured', supportsClaim: true });
    const md = core.buildAssessmentMarkdown(assessment, split, 'sector');

    assert.ok(md.includes('ölçülebilir iddia'), 'ölçülen taraf etiketsiz');
    assert.ok(md.includes('model görüşü'), 'görüş tarafı etiketsiz');
    assert.ok(/İddia tarafı alt toplam/.test(md));
    assert.ok(/Model görüşü alt toplam/.test(md));
});

test('buildAssessmentMarkdown explains the missing total rather than supplying one', () => {
    const split = core.splitAssessment(scored(), null);
    const md = core.buildAssessmentMarkdown(core.normalizeAssessment(RAW), split, 'sector');

    assert.ok(/Tek bir toplam puan bilinçli olarak verilmiyor/.test(md),
        'toplamın neden yok olduğu yazılmamış');
    // The subtotals are in there; their sum must not also be, presented as a score.
    const combined = (split.modelTotal + split.claimTotal).toFixed(1);
    assert.ok(!md.includes(`**Toplam**: ${combined}`), 'birleşik puan yine de yazılmış');
});

test('buildAssessmentMarkdown includes the openings and the risks', () => {
    const md = core.buildAssessmentMarkdown(core.normalizeAssessment(RAW), null, 'sector');
    assert.ok(md.includes('## Fırsatlar'));
    assert.ok(md.includes('## Riskler'));
    assert.ok(md.includes('- veri erişimi'));
});

test('buildAssessmentMarkdown returns nothing without an assessment', () => {
    assert.strictEqual(core.buildAssessmentMarkdown(null, null, 'sector'), '');
});
