// The evidence layer: URL building, envelope parsing, the five-valued contract
// and the re-ranking rule.
//
// Pure — no network. The envelope shapes asserted here were taken from live
// responses on 18 Aug 2026; the fixtures are trimmed copies of what the three
// services actually returned.

const test = require('node:test');
const assert = require('node:assert');
const core = require('../core.js');

// A raw entry as app.js will hand it to interpretEvidence.
const raw = (over) => Object.assign({
    sourceId: 'wikidata',
    role: 'entity',
    query: 'X-Road',
    ok: true,
    data: null,
    error: null,
    link: 'https://www.wikidata.org/'
}, over);

const entities = (labels) => ({
    kind: 'entities',
    matches: labels.map(label => ({ label, description: '', url: 'https://www.wikidata.org/entity/Q1' }))
});

const idea = (over) => Object.assign({
    title: 'Test Fikri',
    comparison: {
        concept: 'fraud detection',
        referenceSector: 'fintech',
        targetSector: 'healthcare',
        referenceExample: 'X-Road',
        localState: 'bilinmiyor',
        structuralReason: 'sebep'
    }
}, over);

// ── buildEvidenceRequest ─────────────────────────────────────────────────────

test('buildEvidenceRequest targets only the three declared origins', () => {
    // Anything else would need a CSP entry, and an origin that is in the policy
    // but not actually used is a permission granted for nothing.
    for (const id of Object.keys(core.EVIDENCE_SOURCES)) {
        const req = core.buildEvidenceRequest(id, 'test query');
        assert.ok(req && req.url, `${id}: istek kurulamadı`);
        assert.ok(req.url.startsWith(core.EVIDENCE_SOURCES[id].origin),
            `${id}: URL ilan edilen origin ile başlamıyor`);
        assert.ok(req.url.startsWith('https://'), `${id}: şifresiz istek`);
    }
});

test('buildEvidenceRequest asks OpenAlex for title and abstract, not full text', () => {
    // OpenAlex's bare `search` parameter now runs full text, which matches any
    // paper mentioning the words anywhere at all. Measured 18 Aug 2026 the same
    // three queries return 13563/42380/25391 that way against 1028/1853/276 with
    // this filter — agriculture goes from clearly under-researched to nearly twice
    // fintech. The narrow filter is the measurement, not a preference.
    const url = core.buildEvidenceRequest('openalex', 'fraud detection fintech').url;
    assert.ok(url.includes('title_and_abstract.search'), 'dar filtre kullanılmıyor');
    assert.ok(!/[?&]search=/.test(url), 'gevşek tam metin araması kullanılmış');
});

test('buildEvidenceRequest asks for a histogram only when one was requested', () => {
    const plain = core.buildEvidenceRequest('openalex', 'federated learning').url;
    const grouped = core.buildEvidenceRequest('openalex', 'federated learning', { histogram: true }).url;
    assert.ok(!plain.includes('group_by'));
    assert.ok(grouped.includes('group_by=publication_year'));
});

test('buildEvidenceRequest sends origin=* so Wikidata answers cross-origin', () => {
    assert.ok(core.buildEvidenceRequest('wikidata', 'X-Road').url.includes('origin=*'));
});

test('buildEvidenceRequest escapes the query instead of splicing it in', () => {
    const url = core.buildEvidenceRequest('github', 'a b&c=d').url;
    assert.ok(!url.includes('a b&c=d'), 'sorgu ham haliyle URL\'e girmiş');
    assert.ok(url.includes(encodeURIComponent('a b&c=d')));
});

test('buildEvidenceRequest refuses an unknown source or an empty query', () => {
    assert.strictEqual(core.buildEvidenceRequest('bilinmeyen-kaynak', 'x'), null);
    assert.strictEqual(core.buildEvidenceRequest('openalex', '   '), null);
    assert.strictEqual(core.buildEvidenceRequest('openalex', null), null);
});

// ── parseEvidenceResponse ────────────────────────────────────────────────────

test('parseEvidenceResponse reads a count out of the OpenAlex envelope', () => {
    const out = core.parseEvidenceResponse('openalex', { meta: { count: 1028 }, group_by: [], results: [] });
    assert.deepStrictEqual(out, { kind: 'count', count: 1028 });
});

test('an empty group_by does not swallow the count', () => {
    // Regression. A plain count response carries group_by as an EMPTY array rather
    // than omitting it, so an Array.isArray test on its own sent every count down
    // the histogram path. It surfaced as the sector comparison reporting an error
    // with both of its counts sitting right there in the response.
    const out = core.parseEvidenceResponse('openalex', { meta: { count: 42 }, group_by: [] });
    assert.strictEqual(out.kind, 'count', 'boş group_by histogram sanılmış');
    assert.strictEqual(out.count, 42);
});

test('parseEvidenceResponse reads a year histogram when there is one', () => {
    const out = core.parseEvidenceResponse('openalex', {
        meta: { count: 3 },
        group_by: [
            { key: '2025', key_display_name: '2025', count: 19931 },
            { key: '2024', key_display_name: '2024', count: 8 },
            { key: 'unknown', key_display_name: 'unknown', count: 5 }
        ]
    });
    assert.strictEqual(out.kind, 'years');
    assert.strictEqual(out.years[2025], 19931);
    assert.strictEqual(out.years[2024], 8);
    assert.ok(!('NaN' in out.years), 'sayı olmayan yıl anahtarı sızmış');
});

test('parseEvidenceResponse reads the Wikidata and GitHub envelopes', () => {
    const wd = core.parseEvidenceResponse('wikidata', {
        search: [{ label: 'X-Road', description: 'data exchange layer', concepturi: 'http://www.wikidata.org/entity/Q1' }]
    });
    assert.strictEqual(wd.kind, 'entities');
    assert.strictEqual(wd.matches[0].label, 'X-Road');

    const gh = core.parseEvidenceResponse('github', {
        total_count: 6,
        items: [{ full_name: 'nordic-institute/X-Road', html_url: 'https://github.com/x', description: 'd', stargazers_count: 3 }]
    });
    assert.strictEqual(gh.kind, 'repos');
    assert.strictEqual(gh.total, 6);
    assert.strictEqual(gh.matches[0].label, 'nordic-institute/X-Road');
});

test('parseEvidenceResponse returns null for a shape it does not recognise', () => {
    // A surprise shape is a parse failure, which becomes an error — never a finding.
    for (const payload of [null, undefined, {}, { meta: {} }, 'düz metin']) {
        assert.strictEqual(core.parseEvidenceResponse('openalex', payload), null,
            `${JSON.stringify(payload)} için null beklenirdi`);
    }
    assert.strictEqual(core.parseEvidenceResponse('bilinmeyen', { meta: { count: 1 } }), null);
});

// ── buildEvidenceQueries ─────────────────────────────────────────────────────

test('buildEvidenceQueries compares one concept across two sectors', () => {
    // The symmetry is the measurement. Pairing the concept with a second free
    // -text term instead gave the two sides no shape in common, and the target
    // returned 0 every time — which then read as an untouched market.
    const queries = core.buildEvidenceQueries(idea(), 'sector', 'fintech');
    assert.strictEqual(queries.length, 2);
    assert.deepStrictEqual(queries.map(q => q.role), ['reference', 'target']);

    assert.strictEqual(queries[0].query, 'fraud detection fintech');
    assert.strictEqual(queries[1].query, 'fraud detection healthcare');
});

test('buildEvidenceQueries keeps every query inside the length that measures', () => {
    // Measured 18 Aug 2026: 3-4 word queries return 909-8986 works, 5-word
    // queries fall to 285 and 9. Four is the ceiling that still measures.
    const verbose = idea({
        comparison: {
            concept: 'income share agreement platform tuition tokenization',
            referenceSector: 'fintech',
            targetSector: 'education technology sector for students',
            referenceExample: 'Pave'
        }
    });

    for (const q of core.buildEvidenceQueries(verbose, 'sector', '')) {
        assert.ok(q.query.split(' ').length <= 4, `sorgu ${q.query.split(' ').length} kelime: ${q.query}`);
        assert.ok(!/[.?!]/.test(q.query), `sorguda cümle noktalaması var: ${q.query}`);
    }
});

test('buildEvidenceQueries keeps the sector whole and trims the concept', () => {
    // The sector is the axis being compared, so it survives intact; the
    // concept gives up words to stay inside the budget.
    const q = core.buildEvidenceQueries(idea({
        comparison: { concept: 'fraud detection anomaly', referenceSector: 'fintech', targetSector: 'supply chain', referenceExample: 'X' }
    }), 'sector', '');

    assert.ok(q[1].query.endsWith('supply chain'), `sektör kırpılmış: ${q[1].query}`);
    assert.ok(q[1].query.split(' ').length <= 4);
});

test('the panel reference wins over the one the model suggested', () => {
    // The user typing a sector is the user saying what to compare against.
    const q = core.buildEvidenceQueries(idea(), 'sector', 'insurance');
    assert.strictEqual(q[0].query, 'fraud detection insurance');
    assert.strictEqual(q[1].query, 'fraud detection healthcare');
});

test('buildEvidenceQueries looks up the named example for a country comparison', () => {
    const queries = core.buildEvidenceQueries(idea(), 'country');
    assert.ok(queries.length > 0);
    for (const q of queries) {
        assert.strictEqual(q.query, 'X-Road', 'aranan şey modelin verdiği ad olmalı');
    }
    assert.deepStrictEqual(queries.map(q => q.sourceId).sort(), ['github', 'wikidata']);
});

test('buildEvidenceQueries asks for nothing when the claim cannot be checked', () => {
    // Scale has no strategy at all, and a sector comparison with only one side is
    // not a comparison — reporting one count as a finding would be worse than
    // reporting nothing.
    assert.deepStrictEqual(core.buildEvidenceQueries(idea(), 'scale', 'kurumsal'), []);
    assert.deepStrictEqual(core.buildEvidenceQueries(idea({ comparison: {} }), 'country'), []);

    // No concept, or only one side of the comparison, is nothing to measure.
    const noConcept = idea({ comparison: { referenceSector: 'fintech', targetSector: 'healthcare' } });
    assert.deepStrictEqual(core.buildEvidenceQueries(noConcept, 'sector', 'fintech'), []);

    const noTarget = idea({ comparison: { concept: 'fraud detection', referenceSector: 'fintech' } });
    assert.deepStrictEqual(core.buildEvidenceQueries(noTarget, 'sector', 'fintech'), []);
});

// ── interpretEvidence: the five values ───────────────────────────────────────

test('interpretEvidence reaches all five statuses', () => {
    const seen = new Set();

    seen.add(core.interpretEvidence('country', [raw({ data: entities(['X-Road']) })]).status);
    seen.add(core.interpretEvidence('sector', [
        raw({ sourceId: 'openalex', role: 'reference', data: { kind: 'count', count: 1028 } }),
        raw({ sourceId: 'openalex', role: 'target', data: { kind: 'count', count: 276 } })
    ]).status);
    seen.add(core.interpretEvidence('country', [raw({ data: entities([]) })]).status);
    seen.add(core.interpretEvidence('scale', []).status);
    seen.add(core.interpretEvidence('country', [raw({ ok: false, data: null, error: 'TimeoutError' })]).status);

    assert.deepStrictEqual([...seen].sort(),
        ['error', 'measured', 'not_found', 'unverifiable', 'verified']);
});

test('a network failure is never reported as not_found', () => {
    // Collapsing these two would reproduce, one layer down, the mistake this whole
    // contract exists to avoid: a timeout would read as an absence.
    const failed = core.interpretEvidence('country', [raw({ ok: false, data: null, error: 'TimeoutError' })]);
    assert.strictEqual(failed.status, 'error');
    assert.notStrictEqual(failed.status, 'not_found');
    assert.ok(/TimeoutError/.test(failed.detail), 'hatanın sebebi söylenmeli');

    const empty = core.interpretEvidence('country', [raw({ data: entities([]) })]);
    assert.strictEqual(empty.status, 'not_found');
});

test('not_found never claims the reference is absent or invented', () => {
    // Wikidata returns zero for "Estonian e-Residency" — one of the best known
    // e-government programmes there is — purely because the phrasing does not
    // match. Wording this as "yok" or "uydurma" would turn a query miss into an
    // accusation.
    const out = core.interpretEvidence('country', [raw({ query: 'Estonian e-Residency', data: entities([]) })]);
    assert.strictEqual(out.status, 'not_found');

    for (const forbidden of ['uydurma', 'sahte', 'mevcut değil', 'diye bir şey yok']) {
        assert.ok(!out.detail.includes(forbidden), `not_found metni "${forbidden}" iddiasında bulunuyor`);
    }
    assert.ok(/bulunamadı/.test(out.detail), 'ne olduğu söylenmeli');
    assert.ok(/göstermez|olabilir/.test(out.detail), 'yokluk kanıtı olmadığı belirtilmeli');
    assert.strictEqual(out.supportsClaim, null);
});

test('a loosely matching name does not count as found', () => {
    // Regression, and the sharper half of the same problem. Both sources match
    // loosely enough that almost any phrase retrieves something: measured 18 Aug
    // 2026 the invented name "Servis Takip Veli" retrieved a repository called
    // "noktaturizm63/servisnoktam_veli". Reporting that as verified would let the
    // layer manufacture the confidence it exists to withhold.
    const fabricated = core.interpretEvidence('country', [raw({
        sourceId: 'github',
        query: 'Servis Takip Veli',
        data: { kind: 'repos', total: 1, matches: [{ label: 'noktaturizm63/servisnoktam_veli', url: 'https://github.com/x' }] }
    })]);
    assert.strictEqual(fabricated.status, 'not_found', 'uydurma ad doğrulanmış sayılmış');

    const junk = core.interpretEvidence('country', [raw({
        query: 'Estonian e-Residency',
        data: entities(['perguth/chromeos-welcome-to-estonia', 'X-Roads Warriors F.C.'])
    })]);
    assert.strictEqual(junk.status, 'not_found');

    // A genuine match still lands.
    const real = core.interpretEvidence('country', [raw({
        query: 'X-Road', data: entities(['X-Road', 'X-Roads Warriors F.C.'])
    })]);
    assert.strictEqual(real.status, 'verified');
    assert.ok(real.measurement.matches.includes('X-Road'));
    assert.ok(!real.measurement.matches.includes('X-Roads Warriors F.C.'), 'alakasız eşleşme sızmış');
});

test('interpretEvidence reports a measurement that refutes its own claim', () => {
    // The layer's reason for existing. "Fraud detection is solved in fintech but
    // not in healthcare" is a claim a model would write confidently; the counts
    // measured 18 Aug 2026 say healthcare has more work, not less.
    const out = core.interpretEvidence('sector', [
        raw({ sourceId: 'openalex', role: 'reference', query: 'fraud detection fintech', data: { kind: 'count', count: 1028 } }),
        raw({ sourceId: 'openalex', role: 'target', query: 'fraud detection healthcare', data: { kind: 'count', count: 1853 } })
    ]);

    assert.strictEqual(out.status, 'measured');
    assert.strictEqual(out.supportsClaim, false, 'çürüten ölçüm destekliyor sayılmış');
    assert.deepStrictEqual(out.measurement, { reference: 1028, target: 1853 });
    assert.ok(/desteklemiyor/.test(out.detail), 'çürüttüğü kullanıcıya söylenmeli');
});

test('a query that did not land is not a market gap', () => {
    // The sharpest lesson from running this against the real model. Every
    // over-long query it produced returned 0 works, target < reference held
    // trivially, and all three candidates were told their claim was supported —
    // so they took the same bonus and the measurement changed no ranking at all.
    //
    // A zero means the query missed. It is the §3.3 asymmetry one strategy along.
    const count = (role, n) => raw({ sourceId: 'openalex', role, query: 'q', data: { kind: 'count', count: n } });

    const emptyTarget = core.interpretEvidence('sector', [count('reference', 1044), count('target', 0)]);
    assert.strictEqual(emptyTarget.status, 'not_found', 'sıfır hedef boşluk sayılmış');
    assert.strictEqual(emptyTarget.supportsClaim, null);
    assert.ok(/göstermez/.test(emptyTarget.detail), 'yokluk kanıtı olmadığı söylenmedi');

    // A reference corpus too small to compare against is the same problem: a
    // difference between 9 and 0 is phrasing, not substance.
    const thinCorpus = core.interpretEvidence('sector', [count('reference', 9), count('target', 0)]);
    assert.strictEqual(thinCorpus.status, 'not_found');

    // A real corpus still measures.
    const real = core.interpretEvidence('sector', [count('reference', 1044), count('target', 276)]);
    assert.strictEqual(real.status, 'measured');
    assert.strictEqual(real.supportsClaim, true);
});

test('a query that did not land earns no bonus either', () => {
    // The whole failure was that it did. Pinning it at the ranking layer too.
    const scored = [
        { idea: { title: 'Önde' }, total: 50, breakdown: [] },
        { idea: { title: 'Arkada' }, total: 48, breakdown: [] }
    ];
    const after = core.applyVerificationBoost(scored, {
        Arkada: { status: 'not_found', supportsClaim: null }
    });
    assert.strictEqual(after[0].idea.title, 'Önde', 'ölçülemeyen sorgu sıralamayı değiştirmiş');
    assert.strictEqual(after.find(r => r.idea.title === 'Arkada').verificationBonus, 0);
});

test('interpretEvidence needs both sides before it calls a sector comparison measured', () => {
    const out = core.interpretEvidence('sector', [
        raw({ sourceId: 'openalex', role: 'reference', data: { kind: 'count', count: 1028 } })
    ]);
    assert.strictEqual(out.status, 'error', 'tek taraflı sayım ölçüm sayılmış');
});

test('interpretEvidence says outright when a claim type cannot be checked', () => {
    const out = core.interpretEvidence('scale', []);
    assert.strictEqual(out.status, 'unverifiable');
    assert.strictEqual(out.supportsClaim, null);
    assert.ok(/doğrulanamıyor/.test(out.detail));
});

// ── applyVerificationBoost: the rule that never subtracts ────────────────────

const scoredPair = () => ([
    { idea: { title: 'Önde' }, total: 50, breakdown: [] },
    { idea: { title: 'Arkada' }, total: 40, breakdown: [] }
]);

test('verification raises a confirmed candidate', () => {
    const out = core.applyVerificationBoost(scoredPair(), {
        Arkada: { status: 'verified', supportsClaim: true }
    });
    assert.strictEqual(out[0].idea.title, 'Arkada', 'doğrulanan aday öne geçmeli');
    assert.ok(out[0].total > out[0].baseTotal);
    assert.strictEqual(out[0].verificationBonus, core.VERIFICATION_BONUS.verified);
});

test('not_found leaves the ranking exactly as it was', () => {
    // The §3.3 regression. A real reference can return zero simply because the
    // query did not match, so a miss must never cost a candidate anything.
    const before = scoredPair();
    const after = core.applyVerificationBoost(before, {
        Önde: { status: 'not_found', supportsClaim: null }
    });

    assert.deepStrictEqual(after.map(r => r.idea.title), before.map(r => r.idea.title));
    assert.strictEqual(after[0].total, 50, 'not_found puanı değiştirmiş');
    assert.strictEqual(after[0].verificationBonus, 0);
});

test('a refuting measurement earns no bonus and takes no penalty', () => {
    const after = core.applyVerificationBoost(scoredPair(), {
        Önde: { status: 'measured', supportsClaim: false }
    });
    const front = after.find(r => r.idea.title === 'Önde');

    assert.strictEqual(front.verificationBonus, 0, 'çürüten ölçüm bonus almış');
    assert.strictEqual(front.total, 50, 'çürüten ölçüm ceza almış');
    assert.strictEqual(front.verification.supportsClaim, false, 'uyarı kullanıcıya taşınmalı');
});

test('a refuting measurement still loses to a confirmed rival it was close to', () => {
    // The ranking effect comes from rivals gaining, not from this one losing —
    // which is how the rule stays a single line with no exception.
    const close = [
        { idea: { title: 'Önde' }, total: 50, breakdown: [] },
        { idea: { title: 'Arkada' }, total: 47, breakdown: [] }
    ];
    const after = core.applyVerificationBoost(close, {
        Önde: { status: 'measured', supportsClaim: false },
        Arkada: { status: 'measured', supportsClaim: true }
    });

    assert.strictEqual(after[0].idea.title, 'Arkada', 'destekleyen ölçüm öne geçmeliydi');
    assert.strictEqual(after.find(r => r.idea.title === 'Önde').total, 50, 'çürüten aday ceza almış');
});

test('verification adjusts the ranking but cannot overrule the weights', () => {
    // The bonus is deliberately small against the 0-100 criteria scores. A
    // candidate the user's own weights put well ahead stays ahead, even when a
    // rival verifies and it does not — otherwise the sliders would be advisory.
    const wideGap = [
        { idea: { title: 'Kullanıcının Tercihi' }, total: 80, breakdown: [] },
        { idea: { title: 'Doğrulanan' }, total: 40, breakdown: [] }
    ];
    const after = core.applyVerificationBoost(wideGap, {
        Doğrulanan: { status: 'verified', supportsClaim: true }
    });

    assert.strictEqual(after[0].idea.title, 'Kullanıcının Tercihi');
    assert.ok(Math.max(...Object.values(core.VERIFICATION_BONUS)) <= 20,
        'doğrulama bonusu ağırlıkları ezecek kadar büyük');
});

test('no status can ever lower a score', () => {
    for (const status of ['verified', 'measured', 'not_found', 'unverifiable', 'error']) {
        for (const supportsClaim of [true, false, null]) {
            const after = core.applyVerificationBoost(scoredPair(), {
                Önde: { status, supportsClaim }
            });
            const front = after.find(r => r.idea.title === 'Önde');
            assert.ok(front.total >= 50,
                `${status}/${supportsClaim} puanı düşürdü: ${front.total}`);
            assert.ok(front.verificationBonus >= 0);
        }
    }
});

test('applyVerificationBoost leaves unverified candidates alone', () => {
    const after = core.applyVerificationBoost(scoredPair(), {});
    assert.deepStrictEqual(after.map(r => r.total), [50, 40]);
    for (const row of after) assert.strictEqual(row.verification, null);
});

test('applyVerificationBoost survives junk input', () => {
    assert.deepStrictEqual(core.applyVerificationBoost(null, null), []);
    assert.deepStrictEqual(core.applyVerificationBoost([null, {}], {}), []);
});

// ── buildVerificationMarkdown ────────────────────────────────────────────────

test('buildVerificationMarkdown reports the status and the verifiability badge', () => {
    const md = core.buildVerificationMarkdown({
        method: 'country',
        comparison: { referenceExample: 'X-Road', localState: 'bilinmiyor', structuralReason: 'sebep' },
        results: [{ sourceId: 'wikidata', status: 'not_found', detail: 'bulunamadı', link: 'https://www.wikidata.org/' }]
    });

    assert.ok(md.includes('X-Road'));
    assert.ok(md.includes('not_found'), 'durum rapora girmemiş');
    assert.ok(md.includes('kısmen ölçülebilir'), 'doğrulanabilirlik rozeti eksik');
    assert.ok(md.includes('https://www.wikidata.org/'), 'kullanıcının bakabileceği link eksik');
});

test('buildVerificationMarkdown marks an unverifiable method as such', () => {
    const md = core.buildVerificationMarkdown({ method: 'scale', comparison: {}, results: [] });
    assert.ok(md.includes('doğrulanamaz'));
});

test('buildVerificationMarkdown handles a missing block', () => {
    assert.strictEqual(core.buildVerificationMarkdown(null), '');
    assert.strictEqual(typeof core.buildVerificationMarkdown({}), 'string');
});

// ── registry invariants ──────────────────────────────────────────────────────

test('every evidence source is free, keyless and https', () => {
    for (const [id, source] of Object.entries(core.EVIDENCE_SOURCES)) {
        assert.ok(source.origin.startsWith('https://'), `${id}: şifresiz origin`);
        assert.ok(typeof source.buildUrl === 'function', `${id}: buildUrl yok`);
        assert.ok(typeof source.parse === 'function', `${id}: parse yok`);
        assert.ok(Array.isArray(source.capabilities) && source.capabilities.length, `${id}: yetenek ilan edilmemiş`);

        // Nothing in a built URL may look like a credential.
        const url = source.buildUrl('test');
        assert.ok(!/api[_-]?key|token|access[_-]?token|authorization/i.test(url),
            `${id}: URL kimlik bilgisi taşıyor görünüyor`);
    }
});

test('the verification budget stays inside the unauthenticated GitHub limit', () => {
    // GitHub answers 10 search requests per minute without a key, measured as
    // X-RateLimit-Limit: 10 on 18 Aug 2026. A country comparison spends 2 per
    // candidate, so the top-k cap is what keeps a single generation inside it.
    const worstCasePerCandidate = 2;
    assert.ok(core.VERIFY_TOP_K * worstCasePerCandidate <= 10,
        `${core.VERIFY_TOP_K} aday × ${worstCasePerCandidate} istek GitHub limitini aşıyor`);
    assert.ok(core.VERIFY_TOP_K >= 2,
        'tek aday doğrulamak sıralamayı değiştiremez, kanıtı dekorasyona indirger');
});

test('the evidence timeout is well under the generation timeout', () => {
    assert.ok(core.EVIDENCE_TIMEOUT_MS <= 10000,
        'kanıt katmanı üretimi bekletecek kadar uzun süre bekliyor');
});

// ── the year histogram ───────────────────────────────────────────────────────

test('a grouped request does not carry per-page', () => {
    // Regression, and the sharper half of it: per-page truncates group_by as well
    // as results. Sending it with a grouped request returned exactly one bucket —
    // the largest, which is always a recent year — so the share of the last three
    // years came out at 100% by arithmetic every single time and the comparison
    // could only ever agree with the claim. Measured 18 Aug 2026: one bucket with
    // per-page=1, fifty-six without it.
    const grouped = core.buildEvidenceRequest('openalex', 'federated learning', { histogram: true }).url;
    assert.ok(grouped.includes('group_by=publication_year'));
    assert.ok(!/per-page/.test(grouped), 'gruplu istek per-page taşıyor — histogram tek kovaya iner');

    // The plain count still needs it.
    const counted = core.buildEvidenceRequest('openalex', 'federated learning').url;
    assert.ok(counted.includes('per-page=1'));
    assert.ok(!/group_by/.test(counted));
});

test('a histogram too short to show a trend is not a finding', () => {
    // One bucket makes the recent share 100% whatever the field is, which is
    // arithmetic dressed as evidence. It earns nothing, like the sector branch
    // below its corpus floor.
    const hist = years => [raw({
        sourceId: 'openalex', role: 'histogram', query: 'x',
        data: { kind: 'years', years }, link: 'https://api.openalex.org/x'
    })];

    assert.strictEqual(core.interpretEvidence('time', hist({ 2025: 19845 })).status, 'not_found',
        'tek kovalı histogram ölçüm sayılmış');
    assert.strictEqual(core.interpretEvidence('time', hist({ 2025: 900, 2024: 800 })).status, 'not_found');

    // Enough years but almost no corpus behind them.
    assert.strictEqual(core.interpretEvidence('time', hist({ 2025: 5, 2024: 4, 2023: 3 })).status, 'not_found');

    const short = core.interpretEvidence('time', hist({ 2025: 19845 }));
    assert.strictEqual(short.supportsClaim, null);
    assert.ok(/değerlendirilemez/.test(short.detail));
});

test('a real year spread separates a new field from a mature one', () => {
    // Measured against OpenAlex on 18 Aug 2026: "federated learning" puts 70% of
    // its output in the last three years, "relational database" 15%. Before the
    // per-page fix both read as 100%.
    const hist = years => [raw({
        sourceId: 'openalex', role: 'histogram', query: 'x',
        data: { kind: 'years', years }, link: 'https://api.openalex.org/x'
    })];

    const fresh = core.interpretEvidence('time', hist({
        2026: 17631, 2025: 19845, 2024: 12007, 2023: 8636, 2022: 5518, 2021: 3617, 2020: 1714
    }));
    assert.strictEqual(fresh.status, 'measured');
    assert.strictEqual(fresh.supportsClaim, true, 'yeni alan yeni sayılmadı');

    const mature = core.interpretEvidence('time', hist({
        2026: 300, 2025: 400, 2024: 350, 2018: 1200, 2012: 1800, 2005: 2100, 1998: 1500
    }));
    assert.strictEqual(mature.status, 'measured');
    assert.strictEqual(mature.supportsClaim, false, 'olgun alan yeni sayıldı');
    assert.ok(/görünmüyor/.test(mature.detail), 'çürüttüğü kullanıcıya söylenmedi');
});

