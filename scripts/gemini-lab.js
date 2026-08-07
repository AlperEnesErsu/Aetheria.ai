#!/usr/bin/env node
/* ==========================================================================
   Aetheria.ai — Gemini ölçüm ve teşhis aracı

   Modlar:
     --list-models   Anahtara açık modelleri listeler
     --diagnose      Her modeli grounding açık/kapalı ayrı ayrı sınar
     --diversity     Fikir üretiminin gerçekten çeşitli olup olmadığını ölçer

   Kullanım:
     $env:GEMINI_API_KEY = "..."      (anahtar yalnızca ortam değişkeninden okunur)
     node scripts/gemini-lab.js --diversity --category health-ai --rounds 5

   Uygulamaya bağlı değildir; app.js'i değiştirmez. Prompt metni core.js'ten
   geldiği için ölçüm, uygulamanın gerçekten gönderdiği metni sınar.
   ========================================================================== */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const core = require('../core.js');

const API_KEY = process.env.GEMINI_API_KEY;
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

const args = process.argv.slice(2);
function arg(name, fallback) {
    const i = args.indexOf(`--${name}`);
    return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const CATEGORY_KEY = arg('category', 'health-ai');
const ROUNDS = Number(arg('rounds', 5));
const MODEL = arg('model', 'gemini-flash-latest');
const BATCH = Number(arg('batch', 8));
const OUT_DIR = path.join(__dirname, '..', '.prototype-output');

function fail(msg) {
    console.error(`\n  HATA: ${msg}\n`);
    process.exit(1);
}

async function post(model, body) {
    const started = Date.now();
    const res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
        body: JSON.stringify(body)
    });
    const raw = await res.text();
    if (!res.ok) {
        let detail = raw;
        try { detail = JSON.parse(raw).error.message; } catch { /* düz metin */ }
        const hint = res.status === 404 ? '  → node scripts/gemini-lab.js --list-models' : '';
        throw new Error(`HTTP ${res.status} — ${String(detail).slice(0, 200)}${hint}`);
    }
    return { data: JSON.parse(raw), ms: Date.now() - started };
}

// ------------------------------------------------------------- --list-models

async function listModels() {
    const res = await fetch(`${ENDPOINT}?pageSize=200`, { headers: { 'x-goog-api-key': API_KEY } });
    if (!res.ok) fail(`Model listesi alınamadı: HTTP ${res.status}`);

    const models = ((await res.json()).models || [])
        .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
        .map(m => ({ name: m.name.replace(/^models\//, ''), out: m.outputTokenLimit, display: m.displayName || '' }));

    console.log(`\n  generateContent destekleyen ${models.length} model:\n`);
    models.forEach(m => console.log(`    ${m.name.padEnd(42)} çıktı: ${String(m.out || '?').padStart(6)}   ${m.display}`));
    console.log('');
}

// ---------------------------------------------------------------- --diagnose

async function diagnose() {
    const candidates = [
        'gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.5-flash-lite',
        'gemini-flash-lite-latest', 'gemini-flash-latest',
        'gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.6-flash'
    ];

    async function probe(model, grounded) {
        const body = {
            contents: [{ parts: [{ text: grounded ? 'Bugün İstanbul hava durumu nedir?' : 'Merhaba de.' }] }],
            generationConfig: { maxOutputTokens: 32, temperature: 0 }
        };
        if (grounded) body.tools = [{ google_search: {} }];
        try {
            await post(model, body);
            return '✓ çalışıyor';
        } catch (err) {
            const m = err.message;
            return m.includes('429') ? '✗ kota (429)' : m.includes('404') ? '✗ model yok (404)' : `✗ ${m.slice(0, 30)}`;
        }
    }

    console.log(`\n  ${'MODEL'.padEnd(26)} ${'DÜZ ÇAĞRI'.padEnd(22)} GROUNDING İLE`);
    console.log(`  ${'─'.repeat(26)} ${'─'.repeat(22)} ${'─'.repeat(22)}`);
    for (const model of candidates) {
        const plain = await probe(model, false);
        await new Promise(r => setTimeout(r, 1200));
        const ground = await probe(model, true);
        await new Promise(r => setTimeout(r, 1200));
        console.log(`  ${model.padEnd(26)} ${plain.padEnd(22)} ${ground}`);
    }
    console.log('');
}

// --------------------------------------------------------------- --diversity

// docs/generation-design.md §8, açık soru 1: "8 fikrin kaçı gerçekten farklı olacak?"
// Bu mod tam olarak onu ölçer. Uygulamanın akışını birebir taklit eder: her turda
// yeni bir kısıt kombinasyonu çekilir, kaçınma listesi birikir, seçim core.js'in
// kendi selectFreshIdea'sıyla yapılır.
async function diversity() {
    const label = core.CATEGORY_LABELS[CATEGORY_KEY];
    if (!label) fail(`Bilinmeyen kategori "${CATEGORY_KEY}". Seçenekler: ${Object.keys(core.CATEGORY_LABELS).join(', ')}`);

    console.log(`\n  Model: ${MODEL} · Kategori: ${CATEGORY_KEY} · Tur: ${ROUNDS} · Parti: ${BATCH}`);
    console.log(`  Her tur bir fikir çağrısı (genişletme yapılmaz — kota korunur).\n`);

    const known = [];          // uygulamadaki kaçınma listesinin karşılığı
    const allTitles = [];
    const rounds = [];

    for (let i = 0; i < ROUNDS; i++) {
        const combo = core.pickConstraintCombo();
        const prompt = core.buildIdeationPrompt(label, BATCH, combo, known);

        let data, ms;
        try {
            ({ data, ms } = await post(MODEL, {
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    maxOutputTokens: 1024,
                    temperature: 1.0,
                    thinkingConfig: { thinkingBudget: 0 }
                }
            }));
        } catch (err) {
            console.log(`  Tur ${i + 1}: ✗ ${err.message}\n`);
            rounds.push({ error: err.message });
            continue;
        }

        const candidate = (data.candidates || [])[0];
        const text = ((candidate && candidate.content && candidate.content.parts) || [])
            .map(p => p.text || '').join('');

        let ideas = [];
        try { ideas = JSON.parse(text).ideas || []; } catch {
            console.log(`  Tur ${i + 1}: ✗ geçersiz JSON\n`);
            rounds.push({ error: 'geçersiz JSON' });
            continue;
        }

        // Uygulamanın kendi seçim mantığı — yeniden yazılmadı
        const sel = core.selectFreshIdea(ideas, known);

        // Parti içi benzerlik: model tek çağrıda kendini tekrar ediyor mu?
        let intraMax = 0;
        for (let a = 0; a < ideas.length; a++) {
            for (let b = a + 1; b < ideas.length; b++) {
                intraMax = Math.max(intraMax, core.titleOverlap(ideas[a].title, ideas[b].title));
            }
        }

        const tokens = (data.usageMetadata && data.usageMetadata.totalTokenCount) || 0;

        console.log(`  ── Tur ${i + 1}/${ROUNDS} ${'─'.repeat(46)}`);
        console.log(`     Kısıtlar: ${combo.problemSource} · ${combo.audience}`);
        console.log(`               ${combo.technical} · ${combo.revenue}`);
        console.log(`     ${ideas.length} fikir · ${sel.freshCount} yeni` +
                    `${sel.exhausted ? '  ⚠ hepsi görülmüştü' : ''}` +
                    ` · parti içi en yüksek benzerlik %${(intraMax * 100).toFixed(0)}` +
                    ` · ${tokens} token · ${(ms / 1000).toFixed(1)}s`);
        ideas.forEach(x => {
            const dup = known.some(k => core.titleOverlap(x.title, k) >= 0.6);
            console.log(`       ${dup ? '·' : '+'} ${x.title}`);
        });
        console.log(`     → seçilen: ${sel.idea ? sel.idea.title : '(yok)'}`);

        ideas.forEach(x => allTitles.push(x.title));
        rounds.push({ combo, ideas, freshCount: sel.freshCount, exhausted: sel.exhausted, intraMax, tokens, ms });

        // Uygulama yalnızca genişletilen projeyi hatırlar
        if (sel.idea) known.push(sel.idea.title);
    }

    // ------------------------------------------------------------------ özet
    const ok = rounds.filter(r => !r.error);
    console.log(`\n  ${'═'.repeat(70)}`);
    console.log('  ÖZET');
    console.log(`  ${'═'.repeat(70)}`);
    if (ok.length === 0) { console.log('  Hiçbir tur tamamlanmadı.\n'); return; }

    const totalIdeas = allTitles.length;
    const uniqueTitles = new Set(allTitles.map(core.normalizeTitle)).size;

    // Tüm turlar arası yakın-kopya sayısı
    let nearDupes = 0;
    for (let a = 0; a < allTitles.length; a++) {
        for (let b = a + 1; b < allTitles.length; b++) {
            if (core.titleOverlap(allTitles[a], allTitles[b]) >= 0.6) nearDupes++;
        }
    }

    const freshRates = ok.map(r => r.freshCount / r.ideas.length);
    const avgFresh = freshRates.reduce((s, v) => s + v, 0) / freshRates.length;
    const avgIntra = ok.reduce((s, r) => s + r.intraMax, 0) / ok.length;
    const avgTokens = Math.round(ok.reduce((s, r) => s + r.tokens, 0) / ok.length);

    console.log(`  Tamamlanan tur:            ${ok.length}/${ROUNDS}`);
    console.log(`  Toplam fikir:              ${totalIdeas}`);
    console.log(`  Benzersiz başlık:          ${uniqueTitles}/${totalIdeas}  (%${((uniqueTitles / totalIdeas) * 100).toFixed(0)})`);
    console.log(`  Yakın-kopya çifti:         ${nearDupes}`);
    console.log(`  Ortalama "yeni" oranı:     %${(avgFresh * 100).toFixed(0)}`);
    console.log(`  Tur bazında yeni oranı:    ${freshRates.map(v => '%' + (v * 100).toFixed(0)).join('  ')}`);
    console.log(`  Parti içi ort. benzerlik:  %${(avgIntra * 100).toFixed(0)}`);
    console.log(`  Ortalama token/tur:        ${avgTokens}`);

    console.log('');
    if (avgFresh >= 0.75 && avgIntra < 0.4) {
        console.log('  ✓ Çeşitlilik mekanizması çalışıyor.');
    } else if (avgFresh >= 0.5) {
        console.log('  ⚠ Kısmi: model kendini bir miktar tekrar ediyor, prompt iyileştirilebilir.');
    } else {
        console.log('  ✗ Yetersiz: kaçınma listesine rağmen model aynı fikirlere dönüyor.');
    }
    if (freshRates.length > 2 && freshRates[freshRates.length - 1] < freshRates[0] - 0.25) {
        console.log('  ⚠ "Yeni" oranı turlar ilerledikçe düşüyor — fikir havuzu tükeniyor olabilir.');
    }

    fs.mkdirSync(OUT_DIR, { recursive: true });
    const file = path.join(OUT_DIR, `diversity-${CATEGORY_KEY}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(file, JSON.stringify({ model: MODEL, category: CATEGORY_KEY, rounds }, null, 2), 'utf8');
    console.log(`\n  Tam çıktı: ${file}\n`);
}

// -------------------------------------------------------------------- ana

async function main() {
    if (!API_KEY) {
        fail('GEMINI_API_KEY ortam değişkeni tanımlı değil.\n\n' +
             '    $env:GEMINI_API_KEY = "AIza..."     # PowerShell\n' +
             '    export GEMINI_API_KEY="AIza..."     # bash\n\n' +
             '  Ücretsiz anahtar: https://aistudio.google.com/app/apikey');
    }

    if (args.includes('--list-models')) return listModels();
    if (args.includes('--diagnose')) return diagnose();
    if (args.includes('--diversity')) return diversity();

    console.log('\n  Mod seçilmedi. Kullanılabilir modlar:\n');
    console.log('    node scripts/gemini-lab.js --list-models');
    console.log('    node scripts/gemini-lab.js --diagnose');
    console.log('    node scripts/gemini-lab.js --diversity --category health-ai --rounds 5\n');
}

main().catch(err => fail(err.stack || err.message));
