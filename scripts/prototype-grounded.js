#!/usr/bin/env node
/* ==========================================================================
   Aetheria.ai — Grounded üretim prototipi

   Amaç: docs/generation-design.md'deki en riskli varsayımı denemek —
   "google_search grounding gerçekten özgün pazar açıkları buluyor mu, yoksa
   arama sonuçlarının özetini mi çıkarıyor?"

   İki geçişli tasarımı olduğu gibi uygular:
     Geçiş 1  google_search açık, JSON modu KAPALI  → araştırma metni + kaynaklar
     Geçiş 2  JSON modu açık, grounding KAPALI      → mevcut proje şeması

   Kullanım:
     export GEMINI_API_KEY=...        (anahtar yalnızca ortam değişkeninden okunur)
     node scripts/prototype-grounded.js --category health-ai --runs 3

   Bu bir prototiptir; uygulamaya bağlı değildir ve app.js'i değiştirmez.
   ========================================================================== */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const core = require('../core.js');

// ---------------------------------------------------------------- yapılandırma

const API_KEY = process.env.GEMINI_API_KEY;
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

const CATEGORIES = {
    'health-ai': 'sağlık teknolojileri ve tıbbi yapay zeka',
    'web3': 'Web3, blokzincir ve kripto güvenliği',
    'infrastructure': 'bulut altyapısı, dağıtık sistemler ve performans',
    'edtech': 'eğitim teknolojileri',
    'sustainability': 'sürdürülebilirlik, enerji ve endüstriyel IoT',
    'devops': 'DevOps ve yazılım geliştirme araçları'
};

// Aynı kategoride arka arkaya çağrıldığında model benzer sorgular üretip benzer
// sonuçlara varıyor. Her çalıştırmada farklı bir araştırma açısı vererek arama
// sorgularının kendisini çeşitlendiriyoruz (docs/generation-design.md §4.1).
const SEARCH_ANGLES = [
    'son 12 ayda yürürlüğe giren veya girmesi beklenen regülasyon değişikliklerinin yarattığı uyum boşlukları',
    'kullanıcıların forumlarda ve inceleme sitelerinde mevcut araçlar hakkında tekrar tekrar dile getirdiği çözülmemiş şikayetler',
    'hızla büyüyen ama yazılım altyapısı henüz olgunlaşmamış alt pazarlar',
    'yakın zamanda kapanan, satın alınan veya terk edilen ürünlerin geride bıraktığı karşılanmamış ihtiyaçlar',
    'operasyonel maliyet baskısı ve manuel süreç yükünün en çok şikayet edildiği iş akışları'
];

// -------------------------------------------------------------------- yardımcı

const args = process.argv.slice(2);
function arg(name, fallback) {
    const i = args.indexOf(`--${name}`);
    return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const CATEGORY_KEY = arg('category', 'health-ai');
const RUNS = Number(arg('runs', 3));
const MODEL = arg('model', 'gemini-2.5-flash');

const OUT_DIR = arg('out', path.join(__dirname, '..', '.prototype-output'));

function fail(msg) {
    console.error(`\n  HATA: ${msg}\n`);
    process.exit(1);
}

async function callGemini(body, label) {
    const started = Date.now();
    const res = await fetch(`${ENDPOINT}/${MODEL}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
        body: JSON.stringify(body)
    });

    const raw = await res.text();
    if (!res.ok) {
        // Hata gövdesi JSON olmayabilir; ham metni olduğu gibi göster
        let detail = raw;
        try { detail = JSON.parse(raw).error.message; } catch { /* düz metin */ }
        throw new Error(`${label}: HTTP ${res.status} — ${String(detail).slice(0, 300)}`);
    }

    return { data: JSON.parse(raw), ms: Date.now() - started };
}

function textOf(candidate) {
    const parts = (candidate && candidate.content && candidate.content.parts) || [];
    return parts.map(p => (typeof p.text === 'string' ? p.text : '')).join('');
}

// ------------------------------------------------------------------- geçiş 1

async function passResearch(categoryLabel, angle) {
    const prompt = `Sen bir pazar araştırmacısısın. ${categoryLabel} alanında GERÇEK ve GÜNCEL bir pazar açığı bul.

Araştırma açın: ${angle}

Google araması yaparak şunları tespit et:
1. Somut, bugün var olan bir problem — kim yaşıyor, neden çözülmemiş?
2. Bu problemi çözmeye çalışan mevcut araçlar neler ve tam olarak nerede yetersiz kalıyorlar?
3. Problemi destekleyen somut kanıt: sayı, tarih, şirket adı, regülasyon adı, rapor.

Kurallar:
- Genel geçer ifadeler kullanma. "Verimlilik artıyor" değil, "X regülasyonu Y tarihinde Z zorunluluğu getirdi" gibi yaz.
- Uydurma. Yalnızca arama sonuçlarında gördüğün bilgiyi kullan.
- Hâlihazırda onlarca oyuncunun olduğu doymuş bir alan seçme.

Bulgularını düz metin olarak yaz. JSON isteme, formatla uğraşma.`;

    const { data, ms } = await callGemini({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 4096 }
    }, 'Geçiş 1 (araştırma)');

    const candidate = (data.candidates || [])[0];
    if (!candidate) {
        const reason = data.promptFeedback && data.promptFeedback.blockReason;
        throw new Error(`Geçiş 1: yanıt boş${reason ? ` (blockReason: ${reason})` : ''}`);
    }

    const gm = candidate.groundingMetadata || {};
    const sources = (gm.groundingChunks || [])
        .map(c => c.web)
        .filter(Boolean)
        .map(w => ({ title: w.title, uri: w.uri }));

    return {
        text: textOf(candidate),
        queries: gm.webSearchQueries || [],
        sources,
        finishReason: candidate.finishReason,
        usage: data.usageMetadata || {},
        ms
    };
}

// ------------------------------------------------------------------- geçiş 2

async function passStructure(researchText, categoryKey, categoryLabel) {
    const prompt = `Aşağıda bir pazar araştırması bulgusu var. Bunu bir yazılım projesi önerisine dönüştür.

--- ARAŞTIRMA BULGUSU ---
${researchText}
--- BULGU SONU ---

Yanıtını tam olarak şu JSON şemasında ver:
{
  "title": "Proje adı (kısa, akılda kalıcı)",
  "tagline": "Tek cümlelik açıklama",
  "category": "${categoryLabel}",
  "categoryKey": "${categoryKey}",
  "meta": {
    "difficulty": "Orta Düzey veya İleri Düzey",
    "mvpTime": "örn. 6 Hafta",
    "monetization": "Gelir modeli",
    "opportunityScore": "örn. %92 Fırsat Skoru"
  },
  "diagramNodes": [
    { "id": 1, "name": "Bileşen", "type": "source", "sub": "Kısa açıklama" },
    { "id": 2, "name": "Bileşen", "type": "service", "sub": "Kısa açıklama" },
    { "id": 3, "name": "Bileşen", "type": "ai", "sub": "Kısa açıklama" },
    { "id": 4, "name": "Bileşen", "type": "storage", "sub": "Kısa açıklama" },
    { "id": 5, "name": "Bileşen", "type": "client", "sub": "Kısa açıklama" }
  ],
  "step1": {
    "marketGap": "Araştırma bulgusundaki somut kanıtları KORUYARAK pazar açığını anlat",
    "description": "Detaylı proje açıklaması ve madde madde özellikler",
    "tags": ["Teknoloji1", "Teknoloji2", "Teknoloji3"]
  },
  "step2": {
    "architecture": "Sistem mimarisi, katmanlar, veritabanı tasarımı",
    "security": "Güvenlik önlemleri ve tehdit modeli"
  }
}

"type" alanı yalnızca şunlardan biri olabilir: source, service, ai, storage, client.
Araştırmadaki sayıları, tarihleri ve isimleri marketGap içinde MUTLAKA koru.`;

    const { data, ms } = await callGemini({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.7,
            maxOutputTokens: 8192,
            thinkingConfig: { thinkingBudget: 0 }
        }
    }, 'Geçiş 2 (yapılandırma)');

    const candidate = (data.candidates || [])[0];
    if (!candidate) throw new Error('Geçiş 2: yanıt boş');
    if (candidate.finishReason && candidate.finishReason !== 'STOP') {
        throw new Error(`Geçiş 2: yanıt tamamlanamadı (${candidate.finishReason})`);
    }

    const text = textOf(candidate);
    let project;
    try {
        project = JSON.parse(text);
    } catch {
        throw new Error(`Geçiş 2: geçerli JSON değil — ilk 200 karakter: ${text.slice(0, 200)}`);
    }

    return { project, usage: data.usageMetadata || {}, ms };
}

// ------------------------------------------------------- çıktı değerlendirmesi

// Araştırmanın "somut" mu yoksa "genel geçer" mi olduğunu kaba ama işe yarar bir
// sinyalle ölç: somut bulgular sayı, yıl ve özel isim içerir.
function specificitySignals(text) {
    return {
        sayilar: (text.match(/\b\d[\d.,]*\s*(%|milyon|milyar|bin|kat)?/gi) || []).length,
        yillar: (text.match(/\b(20[12]\d)\b/g) || []).length,
        yuzdeler: (text.match(/%\s?\d+|\d+\s?%/g) || []).length,
        ozelIsimler: new Set(text.match(/\b[A-ZĞÜŞİÖÇ][a-zğüşıöç]{2,}(?:\s[A-ZĞÜŞİÖÇ][a-zğüşıöç]{2,})?\b/g) || []).size
    };
}

// İki metin arasındaki kaba örtüşme — çeşitliliği ölçmek için
function overlapRatio(a, b) {
    const norm = s => new Set(
        s.toLowerCase().replace(/[^a-zğüşıöç\s]/g, ' ').split(/\s+/).filter(w => w.length > 5)
    );
    const A = norm(a), B = norm(b);
    if (A.size === 0 || B.size === 0) return 0;
    let shared = 0;
    for (const w of A) if (B.has(w)) shared++;
    return shared / Math.min(A.size, B.size);
}

function hostOf(uri) {
    try { return new URL(uri).hostname.replace(/^www\./, ''); } catch { return uri; }
}

// ----------------------------------------------------------------- ana akış

async function runOnce(index) {
    const categoryLabel = CATEGORIES[CATEGORY_KEY];
    const angle = SEARCH_ANGLES[index % SEARCH_ANGLES.length];

    console.log(`\n${'─'.repeat(78)}`);
    console.log(`ÇALIŞTIRMA ${index + 1}/${RUNS}  ·  kategori: ${CATEGORY_KEY}`);
    console.log(`Araştırma açısı: ${angle.slice(0, 70)}...`);
    console.log('─'.repeat(78));

    process.stdout.write('  Geçiş 1 (grounded araştırma) çalışıyor... ');
    const research = await passResearch(categoryLabel, angle);
    console.log(`${(research.ms / 1000).toFixed(1)}s`);

    process.stdout.write('  Geçiş 2 (yapılandırma) çalışıyor...       ');
    const structured = await passStructure(research.text, CATEGORY_KEY, categoryLabel);
    console.log(`${(structured.ms / 1000).toFixed(1)}s`);

    // --- Grounding gerçekten çalıştı mı?
    console.log(`\n  ARAMA SORGULARI (${research.queries.length}):`);
    if (research.queries.length === 0) {
        console.log('    ⚠  HİÇ ARAMA YAPILMADI — grounding devreye girmemiş!');
    } else {
        research.queries.forEach(q => console.log(`    · ${q}`));
    }

    const hosts = [...new Set(research.sources.map(s => hostOf(s.uri)))];
    console.log(`\n  KAYNAKLAR (${research.sources.length} parça, ${hosts.length} farklı alan adı):`);
    hosts.slice(0, 12).forEach(h => console.log(`    · ${h}`));

    // --- Araştırma somut mu?
    const sig = specificitySignals(research.text);
    console.log(`\n  SOMUTLUK SİNYALLERİ: ${sig.sayilar} sayı · ${sig.yillar} yıl · ` +
                `${sig.yuzdeler} yüzde · ${sig.ozelIsimler} özel isim`);

    // --- Şema doğrulaması (uygulamanın kendi doğrulayıcısı)
    const shapeError = core.validateProjectShape(structured.project);
    console.log(`\n  ŞEMA DOĞRULAMASI: ${shapeError ? '✗ ' + shapeError : '✓ geçti'}`);

    const badNodes = (structured.project.diagramNodes || [])
        .filter(n => !core.NODE_TYPES.includes(n && n.type));
    console.log(`  DÜĞÜM TİPLERİ:     ${badNodes.length === 0 ? '✓ hepsi geçerli' : `✗ ${badNodes.length} geçersiz`}`);

    // --- Somut kanıt yapılandırmadan sağ çıktı mı?
    const gapSig = specificitySignals(structured.project.step1 ? structured.project.step1.marketGap : '');
    console.log(`  KANIT KORUNDU MU:  marketGap içinde ${gapSig.sayilar} sayı, ${gapSig.yillar} yıl`);

    console.log(`\n  PROJE: ${structured.project.title}`);
    console.log(`  ${structured.project.tagline}`);

    const tokens = (research.usage.totalTokenCount || 0) + (structured.usage.totalTokenCount || 0);
    console.log(`\n  TOPLAM: ${((research.ms + structured.ms) / 1000).toFixed(1)}s · ${tokens} token`);

    return { angle, research, structured, sig, shapeError, badNodes: badNodes.length, tokens };
}

async function main() {
    if (!API_KEY) {
        fail('GEMINI_API_KEY ortam değişkeni tanımlı değil.\n\n' +
             '  Anahtarını şu şekilde ver (değer bu terminale yazılır, repoya girmez):\n' +
             '    export GEMINI_API_KEY="AIza..."     # bash/git-bash\n' +
             '    $env:GEMINI_API_KEY = "AIza..."     # PowerShell\n\n' +
             '  Ücretsiz anahtar: https://aistudio.google.com/app/apikey');
    }
    if (!CATEGORIES[CATEGORY_KEY]) {
        fail(`Bilinmeyen kategori "${CATEGORY_KEY}". Seçenekler: ${Object.keys(CATEGORIES).join(', ')}`);
    }

    console.log(`\n  Model: ${MODEL}  ·  Kategori: ${CATEGORY_KEY}  ·  Çalıştırma: ${RUNS}`);

    const results = [];
    for (let i = 0; i < RUNS; i++) {
        try {
            results.push(await runOnce(i));
        } catch (err) {
            console.log(`\n  ✗ Çalıştırma ${i + 1} başarısız: ${err.message}`);
            results.push({ error: err.message });
        }
    }

    // ------------------------------------------------------------ özet rapor
    const ok = results.filter(r => !r.error);

    console.log(`\n${'═'.repeat(78)}`);
    console.log('  ÖZET');
    console.log('═'.repeat(78));
    console.log(`  Başarılı çalıştırma:  ${ok.length}/${RUNS}`);

    if (ok.length === 0) {
        console.log('\n  Hiçbir çalıştırma tamamlanmadı; yukarıdaki hatalara bakın.\n');
        return;
    }

    const grounded = ok.filter(r => r.research.queries.length > 0).length;
    console.log(`  Grounding devreye girdi: ${grounded}/${ok.length}` +
                (grounded < ok.length ? '  ⚠ bazı çalıştırmalarda arama yapılmadı' : '  ✓'));

    const allHosts = new Set();
    ok.forEach(r => r.research.sources.forEach(s => allHosts.add(hostOf(s.uri))));
    console.log(`  Toplam farklı kaynak alan adı: ${allHosts.size}`);

    const schemaOk = ok.filter(r => !r.shapeError && r.badNodes === 0).length;
    console.log(`  Şema + düğüm doğrulaması: ${schemaOk}/${ok.length}` + (schemaOk === ok.length ? '  ✓' : '  ✗'));

    console.log('\n  ÜRETİLEN PROJELER:');
    ok.forEach((r, i) => console.log(`    ${i + 1}. ${r.structured.project.title} — ${r.structured.project.tagline.slice(0, 60)}`));

    // Çeşitlilik: aynı kategoride üretilen marketGap metinlerinin örtüşmesi
    if (ok.length > 1) {
        console.log('\n  ÇEŞİTLİLİK (marketGap kelime örtüşmesi, düşük = iyi):');
        let worst = 0;
        for (let i = 0; i < ok.length; i++) {
            for (let j = i + 1; j < ok.length; j++) {
                const ratio = overlapRatio(ok[i].structured.project.step1.marketGap,
                                           ok[j].structured.project.step1.marketGap);
                worst = Math.max(worst, ratio);
                console.log(`    ${i + 1} ↔ ${j + 1}:  %${(ratio * 100).toFixed(0)}`);
            }
        }
        const titles = new Set(ok.map(r => r.structured.project.title));
        console.log(`    Benzersiz başlık: ${titles.size}/${ok.length}`);
        console.log(`    En yüksek örtüşme: %${(worst * 100).toFixed(0)}` +
                    (worst > 0.5 ? '  ⚠ model kendini tekrar ediyor olabilir' : '  ✓'));
    }

    const avgTokens = Math.round(ok.reduce((s, r) => s + r.tokens, 0) / ok.length);
    const avgMs = Math.round(ok.reduce((s, r) => s + r.research.ms + r.structured.ms, 0) / ok.length);
    console.log(`\n  Ortalama: ${(avgMs / 1000).toFixed(1)}s · ${avgTokens} token / üretim`);

    // ------------------------------------------------------------ dosyaya yaz
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(OUT_DIR, `${CATEGORY_KEY}-${stamp}.json`);
    fs.writeFileSync(file, JSON.stringify({
        model: MODEL, category: CATEGORY_KEY, runs: RUNS, results
    }, null, 2), 'utf8');

    console.log(`\n  Tam çıktı (araştırma metinleri + kaynak URL'leri dahil):\n  ${file}\n`);
}

main().catch(err => fail(err.stack || err.message));
