# Aetheria.ai — Üretim Tasarımı (ücretsiz katman, açık kaynak)

> **Durum:** Uygulandı (8/8 madde) · **Tarih:** 7 Ağustos 2026
> Kod içermez.

---

## 1. Kısıtlar

| Karar | Sonuç |
|---|---|
| Ticari amaç yok | Sunucu, veritabanı, hesap yok |
| Açık kaynak, lokal kurulum | Sıfır sır, sıfır bağımlılık; `git clone` + statik sunucu yeterli |
| **Ücretsiz Gemini katmanı** | **Google Search grounding kullanılamaz** |
| Kayıt lokalde | `localStorage` yeterli |

---

## 2. Ölçülen gerçek: grounding ücretsiz katmanda yok

Gerçek bir anahtarla `scripts/prototype-grounded.js --diagnose` çalıştırıldı.
Aynı model, aynı dakika:

| Model | Düz çağrı | `google_search` ile |
|---|---|---|
| `gemini-flash-latest` | ✓ | ✗ 429 |
| `gemini-3.6-flash` | ✓ | ✗ 429 |
| `gemini-3.5-flash` | ✓ | ✗ 429 |
| `gemini-3.1-flash-lite` | ✓ | ✗ 429 |

Düz çağrı çalışırken grounding'in 429 dönmesi bir hız limiti değil, **kotanın
sıfır olması** demek. Google'ın fiyat sayfası doğruluyor: ücretsiz katman için
grounding **"Not available"**. Ücretli katmanda Gemini 3.x'e ayda 5.000 arama
ücretsiz veriliyor, sonrası 1.000 sorgu başına $14.

**Sonuç:** "Sıfırdan araştırarak bulacak" hedefi ücretsiz katmanda teknik olarak
karşılanamıyor. Bu doküman grounding'i kapsam dışı bırakır.

Bu, prototipin varlık sebebiydi: varsayım kod yazılmadan önce çürütüldü.

### 2.1 Yan bulgu: sabitlenmiş model adları eskiyor

Aynı teşhis, uygulamadaki iki modelin de öldüğünü ortaya çıkardı
(`gemini-2.5-flash` → 404 "no longer available to new users",
`gemini-2.5-flash-lite` → 404). PR #10 bunu `-latest` takma adlarına geçerek
düzeltti. Ders: sürüm numarası sabitlemek, zamanla kendini bozan bir karar.

---

## 3. Dürüstlük problemi

Grounding olmadan model **araştırmıyor, kendi bilgisinden üretiyor.** Bu meşru
bir ürün — ama uygulamanın bugünkü dili bunu gizliyor:

| Nerede | Ne diyor | Gerçek |
|---|---|---|
| Terminal logları | "Küresel SaaS & GitHub Trend Veritabanı bağlandı" | Böyle bir bağlantı yok |
| Terminal logları | "Rekabet doyum oranı ve kullanıcı şikayetleri analiz ediliyor" | Hiçbir analiz yapılmıyor |
| Hero başlığı | "Otonom Sektörel Analiz Ajanı" | Sektörel analiz yok |
| README | "doymuşluk oranlarını analiz ederek" | Analiz yok |
| Anahtarsız mod | Sabit listeyi AI üretimi gibi sunuyor | Rastgele seçim |

Terminal simülasyonu bunların en ağırı: **var olmayan işlem adımlarını gerçekmiş
gibi gösteriyor.** Estetik değeri var ama içeriği uydurma.

**Karar:** Terminal kalır, ancak **gerçek** adımları gösterir — hangi model,
hangi geçiş, kaç token, geçen süre. Sahte tarama satırları kaldırılır.

Ürün dili "araştırıyor"dan **"fikir üretiyor"a** çekilir. Kaybedilen bir şey yok;
kazanılan, iddianın doğru olması.

---

## 4. Asıl mühendislik problemi: çeşitlilik

Grounding gidince "her seferinde farklı proje" tamamen prompt tasarımına kalıyor.
Aynı prompt'la 20 çağrı, 20 farklı fikir değil 6-7 fikrin varyasyonunu üretir.

### 4.1 Çözüm: önce fikir listele, sonra genişlet

Tek çağrıda tam proje istemek yerine üç adım:

```
Adım 1 — FİKİR LİSTESİ            küçük çıktı, ~300 token
  "X alanında 8 proje fikri, her biri tek cümle.
   Şunlardan farklı olsun: [görülen + kaydedilen başlıklar]"
  → 8 tek satırlık fikir

Adım 2 — YEREL SEÇİM              API çağrısı yok
  Görülenler kümesiyle karşılaştır, elenmemiş olanlardan birini seç

Adım 3 — GENİŞLETME               tam çıktı
  "Bu fikri tam projeye dönüştür: [seçilen fikir]"
  → mevcut proje şeması
```

Üç faydası var:

1. **Tekilleştirme ucuzluyor** — tek cümlelik fikirleri karşılaştırmak, tam
   blueprint'leri karşılaştırmaktan hem kolay hem doğru.
2. **Çeşitlilik yapısal hale geliyor** — model her seferinde 8 seçenek üretiyor,
   biz görülmemiş olanı seçiyoruz. Sekizi de görülmüşse yeni liste isteniyor.
3. **Maliyet neredeyse aynı** — Adım 1 çok küçük bir çağrı.

### 4.2 Kısıt eksenleri döndürme

Adım 1'in prompt'una her çağrıda farklı bir kombinasyon enjekte edilir:

| Eksen | Örnek değerler |
|---|---|
| Problem kaynağı | regülasyon baskısı · maliyet · manuel iş yükü · veri siloları · erişilebilirlik |
| Hedef kullanıcı | kurumsal ekip · bağımsız profesyonel · son kullanıcı · araştırmacı · kamu |
| Teknik açı | uçta çalışma · gizlilik korumalı · gerçek zamanlı · çevrimdışı öncelikli · otomasyon |
| Gelir modeli | B2B SaaS · pazaryeri · API · açık çekirdek · kullanım bazlı |

5 × 5 × 5 × 5 = **625 kombinasyon**. Model aynı fikre dönmek istese bile prompt
onu farklı bir köşeye itiyor. Grounding'in yokluğunu telafi eden asıl mekanizma bu.

### 4.3 Görülenleri ele

`localStorage`'da görülen proje id'leri tutulur; hem örnek listeden seçimde hem
Adım 2'de kullanılır. Bugün `getRandomProject` yalnızca **bir önceki** projeyi
eliyor; kümeye çevrilirse 18 örnek = 18 farklı deneyim olur.

Anahtarı olmayan kullanıcı için de çalışan tek çeşitlilik mekanizması bu.

---

## 5. Örnek projelerin rolü

`PROJECTS_DATABASE` kalır, ama **"Örnek Projeler"** olarak etiketlenir:

- Anahtar yokken vitrin — boş ekran görünmez
- Çevrimdışı yedek
- Adım 1'in negatif örnek korpusunun başlangıcı

Anahtarsız kullanıcıya gösterilen mesaj açık olmalı:

> *"Bunlar örnek projeler. Yapay zekanın sana özel fikir üretmesi için ücretsiz
> Gemini anahtarını gir."*

Tezat listenin varlığından değil, sunumundan doğuyordu.

---

## 6. Anahtar akışı

Anahtar zorunlu ve tek yol; değişmesi gereken sunumu:

- Bugün: başlıkta kolayca gözden kaçan bir rozet
- Olması gereken: anahtar yokken ana buton kurulum akışına yönlendirir,
  "30 saniye, ücretsiz, kart gerekmez" vurgusuyla

Açık kaynak bir projede doğru model bu: hedef kitle geliştirici, anahtar almak
30 saniye ve hiç kimsenin faturalandırma açması gerekmiyor.

---

## 7. Yapılacak işler

| # | İş | Durum |
|---|---|---|
| 1 | Görülenleri ele (§4.3) | ✅ PR #11 |
| 2 | Örnekleri dürüst etiketle (§5) | ✅ PR #11 |
| 3 | Terminal loglarını gerçekleştir (§3) | ✅ PR #11 |
| 4 | Ürün dilini düzelt (hero, README) | ✅ PR #11 |
| 5 | Fikir listele → genişlet akışı (§4.1) | ✅ PR #12 |
| 6 | Kısıt ekseni döndürme (§4.2) | ✅ PR #12 |
| 7 | Anahtar kurulum akışı (§6) | ✅ PR #12 |
| 8 | `localStorage` kota hatası yakalama | ✅ PR #12 |

Backend yok, ikinci API yok, sır yok — planlandığı gibi.

Yol boyunca planda olmayan üç düzeltme çıktı, üçü de dışarıdan gelen bozulmalardı:
sabitlenmiş model adları emekliye ayrılmıştı (PR #10), `thinkingBudget` alanı
mevcut modellerce reddediliyordu, ve `.env` okuması Windows BOM'unda kırılıyordu.

---

## 8. Açık sorular

| # | Konu | Not |
|---|---|---|
| 1 | 8 fikrin kaçı gerçekten farklı olacak? | **Ölçüldü — cevap: hepsi.** 3 tur × 8 fikir = 24/24 benzersiz, 0 yakın-kopya, parti içi ortalama benzerlik %18. `node scripts/gemini-lab.js --diversity` |
| 2 | Kısıt eksenleri saçma kombinasyon üretir mi? | "Kamu + pazaryeri + çevrimdışı öncelikli" zorlama olabilir; modele "uymuyorsa ekseni yumuşat" izni verilmeli. |
| 3 | Ücretsiz katman günlük limiti | Ölçülmedi. Anahtar kullanıcının olduğu için kritik değil, ama limit mesajı anlaşılır olmalı. |
| 4 | Eğitim verisi güncelliği | Model kesim tarihinden sonrasını bilmiyor. Ürün dili güncellik ima etmemeli. |
| 5 | Grounding ileride açılırsa | Ücretli katmana geçen kullanıcı için opsiyonel ayar olarak eklenebilir; iki geçişli tasarım git geçmişinde (commit `7b9fd47`) duruyor. |

---

## 9. Kaynaklar

- [Gemini API fiyatlandırma](https://ai.google.dev/gemini-api/docs/pricing) — grounding ücretsiz katmanda "Not available"
- [Grounding with Google Search](https://ai.google.dev/gemini-api/docs/google-search)
- Ölçüm: `scripts/prototype-grounded.js --diagnose`, 7 Ağustos 2026
