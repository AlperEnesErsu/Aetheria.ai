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
