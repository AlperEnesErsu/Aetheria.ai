# Changelog

Bu projedeki önemli değişiklikler bu dosyada tutulur.
Biçim [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) temellidir.

## [Yayınlanmamış]

### Eklendi
- **🎯 Fikrimi Değerlendir modu**: Elindeki fikri yapıştır, uygulama onu değiştirmeden değerlendirsin — piyasadaki açığa uygunluk, 2-4 somut fırsat, 2-3 somut risk ve dört kriter üzerinden puanlar. Ölçüm için ayrıntılı modun kanıt katmanı (OpenAlex / Wikidata / GitHub) aynen kullanılır.
  - Modele fikri **değiştirmemesi** açıkça söylenir; kendi daha iyi fikrini değerlendirmesi bu modun tek anlamlı hata biçimiydi
  - Puanlar **dayanağına göre etiketlenir**: "ölçülebilir iddia" ve "model görüşü" ayrı ayrı gösterilir, iki alt toplam verilir
  - **Tek bir toplam puan bilerek verilmez** — pazar büyüklüğü, rekabet ve zamanlama bu araçlarla ölçülemiyor, ikisini tek sayıda toplamak görüşü ölçüm gibi gösterirdi. Nedeni puan tablosunun altında yazılı
  - Değerlendirmeyi Markdown olarak panoya kopyalama; ayrım kopyalanan metinde de korunur
  - Fikir metni tarayıcıda saklanmaz; sekme kapanınca gider
- **Tek tıkla Markdown panoya kopyalama**: Teknik mimari ve blueprint çıktısını panoya kopyalayan `Panoya Kopyala` butonu ve görsel toast bildirimi
- **Yazdırma ve PDF desteği**: `@media print` stilleri ile teknik şartnameyi doğrudan tarayıcıdan temiz PDF/yazıcı çıktısı olarak alabilme
- **12 yeni proje**: veritabanı 6 → 18 projeye çıktı; her kategoride artık en az 3 proje var
  - Sağlık & AI: PharmaGuard AI, MindPulse RPM
  - Web3 & Güvenlik: ChainProof, KeyWard
  - Altyapı & Cloud: FinOps Copilot, EdgeMesh
  - EdTech: SkillForge, LabSim XR
  - Sürdürülebilirlik: GridBalance, ReLoop
  - DevOps: DriftSentry, Postmortem AI
- `test/projects-data.test.js` — veritabanı bütünlüğü için 15 test (kategori başına asgari proje sayısı, filtre kapsamı, düğüm tipleri, içerik derinliği)
- `core.js` — saf mantık katmanı ve `node:test` ile 25 birim testi
- ESLint yapılandırması, `package.json` script'leri ve GitHub Actions CI
- `favicon.svg`, Open Graph / Twitter kartları ve üretilmiş `og-image.png`
- `robots.txt`, `sitemap.xml`, canonical URL ve `WebApplication` JSON-LD
- `<noscript>` bilgilendirme bandı
- `CONTRIBUTING.md` ve bu changelog
- `devops` kategorisi için filtre butonu (proje veride vardı, UI'da yoktu)
- Havuzdan proje çıkarırken onay adımı

### Düzeltildi
- **Modal İptal butonu kontrastı**: Beyaz arka planda görünmez kalan "İptal" butonu metni ve kenarlığı modern açık tema stilleriyle düzeltildi
- **Tanımsız CSS değişkenleri**: `--accent-cyan`, `--text-muted`, `--gradient-glow`, `--accent-emerald`, `--accent-amber`, `--text-dark` değişkenleri güncel tasarım belirteçlerine (`var(--accent-primary)`, `var(--accent-success)`, `var(--accent-warning)`, `var(--text-secondary)`) eşitlendi
- **Font senkronizasyonu**: `style.css`'teki `--font-sans` ailesi `index.html`'de yüklenen `Outfit` fontuyla senkronize edildi
- **Tema meta etiketleri**: `theme-color` ve `color-scheme` açık temaya uyarlandı, işlevsiz `.bg-glow-container` DOM'dan temizlendi
- **Aşama 2 akışı**: mimari ve güvenlik raporu, proje bulunur bulunmaz açılıyordu; iki aşamalı keşif tamamen bypass ediliyordu
- **Gemini canlı modu**: `maxOutputTokens: 1000` her yanıtı JSON'un ortasında kesiyordu, canlı mod hiç çalışmıyordu
- Gemini yanıtları artık doğrulanıyor; eksik `candidates`, `finishReason`, JSON olmayan gövde ve bozuk şema ele alınıyor
- Başarısız Gemini çağrıları da kotadan düşülüyor
- **Stored XSS**: proje içeriği dört ayrı yolda escape edilmeden `innerHTML`'e veriliyordu
- Content-Security-Policy eklendi; `target="_blank"` linkine `rel="noopener noreferrer"`
- Hata durumunda kalıcı olarak devre dışı kalan butonlar (`try/finally`)
- Filtre değişiminde yanlış projeyi eleyen tekrar-önleme mantığı
- `.md` indirmelerinde `URL.revokeObjectURL()` çağrılmaması (bellek sızıntısı)
- Klavyeyle kapatılamayan, odak yönetimi olmayan diyaloglar (Escape, focus trap, odak geri dönüşü)
- `--text-dark` kontrastı WCAG AA'nın altındaydı (3.62:1 → 7.03:1)
- Render-blocking font `@import`'u; scriptler artık `defer`

### Değiştirildi
- "Ortak Proje Havuzu" → **"Proje Havuzum"**. Havuz yalnızca `localStorage`'da; kullanıcılar arası paylaşım hiç yoktu
- Yedek model `gemini-1.5-flash` (kullanımdan kaldırıldı) → `gemini-2.5-flash-lite`
- API key artık query string yerine `x-goog-api-key` header'ında
- `prefers-reduced-motion` desteği ve tablet breakpoint'i

### Kaldırıldı
- Hiçbir HTML'de kullanılmayan auth modal CSS blokları (~70 satır)

