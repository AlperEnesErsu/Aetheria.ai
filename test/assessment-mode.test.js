// Fikir değerlendirme modu, gerçek DOM'da sürülerek.
//
// The pure half of this feature is tested in assessment.test.js. What is left is
// only provable by driving the app: that the mode spends exactly one call, that
// the user's idea reaches the prompt unrewritten, and — the claim the whole mode
// rests on — that the four scores arrive on screen labelled by what they rest on,
// with no single combined figure anywhere.

const test = require('node:test');
const assert = require('node:assert');
const { bootApp, geminiResponse } = require('./helpers/app-harness.js');

const KEY = 'AIzaSyTESTKEY0000000000000000000000000000';

const assessMode = {
    aetheria_key_gemini: KEY,
    aetheria_use_gemini: 'true',
    aetheria_mode: 'assess'
};

const IDEA = 'Tarım sigortası hasar dosyalarını otomatik inceleyip anomali işaretleyen bir sistem.';

const ASSESSMENT = {
    title: 'Hasar Dosyası Anomali Tarayıcı',
    restatement: 'Tarım sigortası hasar dosyalarını tarayıp şüpheli olanları işaretler.',
    comparison: {
        concept: 'anomaly detection claims',
        referenceSector: 'fintech',
        targetSector: 'agriculture',
        referenceExample: 'Shift Technology',
        localState: 'Türkiye\'de adı konmuş bir muadili bilinmiyor',
        structuralReason: 'Tarım sigortası hasar hacmi küçük, yazılım yatırımı geri dönmüyor',
        howToCheck: 'TARSİM yıllık raporlarındaki hasar dosyası sayısına bak'
    },
    opportunities: ['TARSİM ile pilot anlaşması', 'Eksper için mobil ön inceleme'],
    risks: ['Hasar verisine erişim sözleşmeye bağlı', 'Etiketli anomali verisi yok'],
    scores: { evidence: 70, feasibility: 60, gap: 80, originality: 50 }
};

// OpenAlex asymmetry: the reference sector is well researched, the target is not,
// which is exactly the shape that makes the gap claim measurable.
const COUNTS = { fintech: 1028, agriculture: 276 };

function openalexCount(url) {
    const sector = url.includes('agriculture') ? 'agriculture' : 'fintech';
    return {
        ok: true,
        status: 200,
        json: async () => ({ meta: { count: COUNTS[sector] }, group_by: [], results: [] })
    };
}

/** Answers the single assessment call, and any evidence query it triggers. */
function assessFetch(payload = ASSESSMENT) {
    return (url) => {
        if (url.includes('generativelanguage')) return geminiResponse(payload, 640);
        if (url.includes('api.openalex.org')) return openalexCount(url);
        throw new Error(`beklenmeyen istek: ${url}`);
    };
}

/** Type an idea the way a user does, so the input listener actually runs. */
function typeIdea(app, text) {
    const box = app.id('ideaTextInput');
    box.value = text;
    box.dispatchEvent(new app.window.Event('input', { bubbles: true }));
}

async function runAssessment(app, text = IDEA) {
    typeIdea(app, text);
    app.id('btnGenerateProject').click();
    await app.flush(2000);
}

const rows = app => app.$$('#assessScoreContent .score-table tbody tr')
    .map(tr => [...tr.children].map(td => td.textContent.trim()));

// ── Mod seçimi ───────────────────────────────────────────────────────────────

test('the mode survives a reload and the panel comes back with it', async () => {
    const app = await bootApp({ storage: assessMode });

    assert.ok(app.id('assessPanel').classList.contains('visible'), 'panel açılmadı');
    assert.strictEqual(app.id('detailedPanel').classList.contains('visible'), false,
        'ayrıntılı panel de açık kaldı');
    assert.deepStrictEqual(app.errors, []);
});

test('the main button says what it will do in this mode', async () => {
    // In this mode the button produces no project at all, so a label reading
    // "PROJE ÜRET" would be describing the wrong outcome.
    const app = await bootApp({ storage: assessMode });
    assert.match(app.id('generateButtonLabel').textContent, /DEĞERLENDİR/);

    app.$('.mode-btn[data-mode="quick"]').click();
    assert.strictEqual(app.id('generateButtonLabel').textContent, 'PROJE ÜRET');
    assert.strictEqual(app.id('assessPanel').classList.contains('visible'), false);
});

test('an empty idea box spends nothing and says why', async () => {
    // The user's own box is theirs to fill. Bouncing them to the key dialog for it
    // would answer a question they did not ask, and a request would bill a call
    // for a prompt with no idea in it.
    const app = await bootApp({ storage: assessMode, fetch: assessFetch() });

    app.id('btnGenerateProject').click();
    await app.flush(1500);

    assert.strictEqual(app.fetchCalls.length, 0, 'boş fikirle çağrı yapıldı');
    assert.ok(app.terminal().some(l => /fikir yazılmadı/.test(l)));
    assert.strictEqual(app.id('assessmentWrapper').classList.contains('visible'), false);
});

// ── İstek ────────────────────────────────────────────────────────────────────

test('the user idea reaches the prompt and only one model call is made', async () => {
    // Detailed mode runs two passes because the user asked for a project. Here they
    // asked what their idea is worth, and a second call would be spent expanding it
    // into something nobody requested.
    const app = await bootApp({ storage: assessMode, fetch: assessFetch() });
    await runAssessment(app);

    const llm = app.fetchCalls.filter(c => c.url.includes('generativelanguage'));
    assert.strictEqual(llm.length, 1, `bir çağrı beklenirken ${llm.length} yapıldı`);

    const prompt = llm[0].body.contents[0].parts[0].text;
    assert.ok(prompt.includes(IDEA), 'kullanıcının fikri prompt\'a girmemiş');
    assert.match(prompt, /FİKRİ DEĞİŞTİRME/);
});

test('the evidence queries carry no credential', async () => {
    // Same invariant api-key-safety.test.js fixes for detailed mode. This mode
    // reaches the same sources through the same helper, and a mode that grew its
    // own request path is exactly how that guarantee would be lost.
    const app = await bootApp({ storage: assessMode, fetch: assessFetch() });
    await runAssessment(app);

    const evidence = app.fetchCalls.filter(c => c.url.includes('api.openalex.org'));
    assert.ok(evidence.length > 0, 'ölçüm sorgusu hiç çalışmadı');

    for (const call of evidence) {
        const headers = (call.init && call.init.headers) || {};
        assert.deepStrictEqual(Object.keys(headers), [], 'kanıt isteği başlık taşıyor');
        assert.strictEqual(call.init.credentials, 'omit');
        assert.ok(!call.url.includes(KEY), 'anahtar kanıt URL\'ine sızdı');
    }
});

// ── Sonuç ────────────────────────────────────────────────────────────────────

test('a finished assessment renders the idea, its openings and its risks', async () => {
    const app = await bootApp({ storage: assessMode, fetch: assessFetch() });
    await runAssessment(app);

    assert.ok(app.id('assessmentWrapper').classList.contains('visible'), 'sonuç gösterilmedi');
    assert.strictEqual(app.id('assessTitle').textContent, ASSESSMENT.title);
    assert.strictEqual(app.id('assessRestatement').textContent, ASSESSMENT.restatement);

    const opportunities = app.$$('#assessOpportunities .assess-item').map(li => li.textContent);
    assert.deepStrictEqual(opportunities, ASSESSMENT.opportunities);

    const risks = app.$$('#assessRisks .assess-item').map(li => li.textContent);
    assert.deepStrictEqual(risks, ASSESSMENT.risks);

    assert.deepStrictEqual(app.errors, []);
});

test('an assessment produces no project and touches no pool', async () => {
    // The mode assesses the user's idea. Filing the result under "projects we
    // generated" would make it look like one, and saving it would put an idea the
    // user already had into a pool of ideas the app produced.
    const app = await bootApp({ storage: assessMode, fetch: assessFetch() });
    await runAssessment(app);

    assert.strictEqual(app.id('resultsWrapper').classList.contains('visible'), false,
        'proje kartı da açıldı');
    assert.strictEqual(app.window.localStorage.getItem('aetheria_community_pool'), null,
        'havuza yazıldı');
});

test('the measurement lands in its own card with a link to the source', async () => {
    const app = await bootApp({ storage: assessMode, fetch: assessFetch() });
    await runAssessment(app);

    const item = app.$('#assessEvidenceContent .evidence-item');
    assert.ok(item, 'ölçüm kartı boş');
    assert.match(item.className, /status-measured/);
    assert.match(item.textContent, /1028/);
    assert.match(item.textContent, /276/);

    const link = item.querySelector('.evidence-link');
    assert.ok(link && link.href.startsWith('https://api.openalex.org'),
        'kaynağa bakma bağlantısı yok');
});

test('a method these tools cannot check says so instead of leaving a blank card', async () => {
    // "scale" has no verify strategy at all. The card must report that rather than
    // rendering an empty box a reader would fill in themselves.
    const app = await bootApp({
        storage: { ...assessMode, aetheria_assess_method: 'scale' },
        fetch: assessFetch()
    });
    await runAssessment(app);

    assert.strictEqual(app.fetchCalls.filter(c => c.url.includes('openalex')).length, 0,
        'doğrulanamaz metot için sorgu çalıştırıldı');

    const item = app.$('#assessEvidenceContent .evidence-item');
    assert.match(item.className, /status-unverifiable/);
    assert.match(app.terminal().join('\n'), /doğrulanamıyor/);
});

// ── Puanlar: modun asıl iddiası ──────────────────────────────────────────────

test('every score row is labelled by what it rests on', async () => {
    // Market size, revenue, competition and timing cannot be reached by anything
    // this app talks to. Two of the four criteria are therefore the model's read,
    // and presenting them the way a measurement is presented is the failure this
    // whole mode exists to avoid.
    const app = await bootApp({ storage: assessMode, fetch: assessFetch() });
    await runAssessment(app);

    const tagged = app.$$('#assessScoreContent tr.basis-measured, #assessScoreContent tr.basis-model');
    assert.strictEqual(tagged.length, 4, 'dört kriterin hepsi etiketlenmedi');

    const basisOf = label => {
        const tr = tagged.find(row => row.children[0].textContent.trim() === label);
        assert.ok(tr, `${label} satırı yok`);
        return tr.querySelector('.basis-tag').textContent.trim();
    };

    assert.strictEqual(basisOf('Uygulanabilirlik'), 'model görüşü',
        'uygulanabilirlik ölçülmüş gibi sunulmuş');
    assert.strictEqual(basisOf('Teknik özgünlük'), 'model görüşü',
        'özgünlük ölçülmüş gibi sunulmuş');
    assert.strictEqual(basisOf('Pazar boşluğu'), 'ölçülebilir iddia');
    assert.strictEqual(basisOf('Kanıt gücü'), 'ölçülebilir iddia');
});

test('there is no single combined score anywhere on the page', async () => {
    // The number a reader would quote afterwards, stripped of everything around
    // it. Two subtotals, never summed — and the reason said where the total would
    // have been.
    const app = await bootApp({ storage: assessMode, fetch: assessFetch() });
    await runAssessment(app);

    const labels = rows(app).map(cells => cells[0]);
    assert.ok(labels.includes('İddia tarafı alt toplam'));
    assert.ok(labels.includes('Model görüşü alt toplam'));
    assert.ok(!labels.includes('Toplam'), 'tek bir toplam puan satırı eklenmiş');

    const note = app.$('#assessScoreContent .score-note');
    assert.ok(note, 'toplam puanın neden verilmediği yazılmamış');
    assert.match(note.textContent, /Tek bir toplam puan verilmiyor/);
});

test('the note admits it when nothing could be measured at all', async () => {
    // With an unverifiable method all four scores are the model's opinion, and the
    // page has to say that outright — the labels alone would still read as "two of
    // these were checked".
    const app = await bootApp({
        storage: { ...assessMode, aetheria_assess_method: 'scale' },
        fetch: assessFetch()
    });
    await runAssessment(app);

    assert.match(app.$('#assessScoreContent .score-note').textContent,
        /hiçbir kriter\s+gerçekten ölçülemedi|dört puan da modelin görüşü/);
});

test('the weights the user set are the weights the table applies', async () => {
    const app = await bootApp({
        storage: {
            ...assessMode,
            aetheria_weights: JSON.stringify({
                evidence: 100, feasibility: 0, gap: 0, originality: 0
            })
        },
        fetch: assessFetch()
    });
    await runAssessment(app);

    const evidenceRow = rows(app).find(cells => cells[0] === 'Kanıt gücü');
    assert.strictEqual(evidenceRow[3], '%100', 'ağırlık tabloya uygulanmamış');
    assert.strictEqual(evidenceRow[4], '70.0', 'katkı ağırlığı yansıtmıyor');
});

test('both weight grids stay in step with each other', async () => {
    // The two panels read and write the same stored weights. A slider moved in one
    // must not leave the other showing a different answer to the same question.
    const app = await bootApp({ storage: assessMode });

    const slider = app.id('assessWeight_evidence');
    assert.ok(slider, 'değerlendirme paneli ağırlık ızgarası kurulmadı');

    assert.strictEqual(app.id('weightValue_evidence').textContent, '%40',
        'varsayılan pay beklenenden farklı');

    slider.value = '100';
    slider.dispatchEvent(new app.window.Event('input', { bubbles: true }));

    assert.strictEqual(app.id('weight_evidence').value, '100',
        'diğer ızgaranın kaydırıcısı eski konumda kaldı');

    // The readout is the normalised share, not the raw slider position, so raising
    // one slider to 100 while the other three hold gives 100/160 rather than 100%.
    const share = app.id('assessWeightValue_evidence').textContent;
    assert.strictEqual(share, '%63', `pay yeniden hesaplanmadı: ${share}`);
    assert.strictEqual(app.id('weightValue_evidence').textContent, share,
        'iki ızgara aynı soruya iki farklı cevap veriyor');
});

// ── Hatalar ──────────────────────────────────────────────────────────────────

test('a model answer with nothing in it is a failure, not an empty assessment', async () => {
    // Rendering headings over blanks reads as a result and is not one.
    const app = await bootApp({
        storage: assessMode,
        fetch: (url) => {
            if (url.includes('generativelanguage')) return geminiResponse({ scores: {} }, 20);
            throw new Error(`beklenmeyen istek: ${url}`);
        }
    });
    await runAssessment(app);

    assert.strictEqual(app.id('assessmentWrapper').classList.contains('visible'), false);
    assert.match(app.terminal().join('\n'), /Değerlendirme başarısız/);
    assert.deepStrictEqual(app.errors, []);
});

test('a failed measurement still produces an assessment', async () => {
    // The evidence layer is not allowed to take the generation down with it. A
    // source that did not answer is not a finding about the idea.
    const app = await bootApp({
        storage: assessMode,
        fetch: (url) => {
            if (url.includes('generativelanguage')) return geminiResponse(ASSESSMENT, 640);
            throw new Error('ağ koptu');
        }
    });
    await runAssessment(app);

    assert.ok(app.id('assessmentWrapper').classList.contains('visible'),
        'ölçüm başarısız olunca değerlendirme de kayboldu');
    assert.match(app.$('#assessEvidenceContent .evidence-item').className, /status-error/);
    assert.deepStrictEqual(app.errors, []);
});
