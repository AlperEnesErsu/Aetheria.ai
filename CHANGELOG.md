# Changelog

Bu projedeki önemli değişiklikler bu dosyada tutulur.
Biçim [Keep a Changelog](https://keepachangelog.com/tr/1.1.0/) temellidir.

## [Yayınlanmamış]

### Eklendi
- `core.js` — saf mantık katmanı ve `node:test` ile 25 birim testi
- ESLint yapılandırması, `package.json` script'leri ve GitHub Actions CI
- `favicon.svg`, Open Graph / Twitter kartları ve üretilmiş `og-image.png`
- `robots.txt`, `sitemap.xml`, canonical URL ve `WebApplication` JSON-LD
- `<noscript>` bilgilendirme bandı
- `CONTRIBUTING.md` ve bu changelog
- `devops` kategorisi için filtre butonu (proje veride vardı, UI'da yoktu)
- Havuzdan proje çıkarırken onay adımı

### Düzeltildi
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
