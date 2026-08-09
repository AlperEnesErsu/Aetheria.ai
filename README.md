# Aetheria.ai 🚀
> **Yapay Zeka Destekli Yazılım Proje Fikri Üreteci**

Aetheria.ai, kendi Gemini API anahtarınla çalışan, tarayıcıda koşan bir proje fikri üreticisidir. Seçtiğin alanda bir proje önerir; beğenirsen ikinci aşamada sistem mimarisini (Clean Architecture) ve güvenlik tasarımını da üretir, kaydetmek istersen tarayıcına kaydeder.

> **Ne yapar, ne yapmaz:** Yapay zeka fikirleri **kendi eğitim verisinden** üretir; web'de canlı araştırma yapmaz. (Google Search grounding ücretsiz Gemini katmanında kullanılamıyor — ölçüm ve gerekçe için [tasarım dokümanına](docs/generation-design.md) bakabilirsin.) API anahtarı girilmediğinde uygulama, **açıkça etiketlenmiş örnek projeler** gösterir.

![Aetheria.ai Preview](https://img.shields.io/badge/AI_Engine-Gemini_Flash-00f2fe?style=for-the-badge) ![License](https://img.shields.io/badge/License-MIT-7f00ff?style=for-the-badge) ![Status](https://img.shields.io/badge/Status-Active-00f5a0?style=for-the-badge)

---

## ✨ Öne Çıkan Özellikler

- **🖥️ İşlem Günlüğü**: Hangi modelin yanıt verdiğini, harcanan token sayısını ve geçen süreyi canlı olarak gösterir — süslemek için değil, ne olduğunu görmen için.
- **⚡ Çoklu Sağlayıcı Desteği**: **Google Gemini** (ücretsiz katman, varsayılan) veya **Anthropic Claude** (ücretli) anahtarınla proje üretimi. Her sağlayıcının anahtarı ayrı saklanır, aralarında geçiş yaparken kaybolmaz; anahtar yalnızca senin tarayıcında durur, hiçbir sunucuya gönderilmez.
- **📐 Görsel Sistem Mimarisi Akış Diyagramı (Interactive Diagram Nodes)**: Mikroservis katmanlarını ve veri akışını gösteren interaktif neon düğüm kartları (`Client -> Gateway -> AI Engine -> Storage`).
- **🗂️ Proje Havuzum**: Beğendiğiniz projeleri tarayıcınızda saklayan kişisel kütüphane. *(Backend olmadığı için havuz `localStorage`'da tutulur ve cihazlar arasında paylaşılmaz; paylaşmak için `.md` raporunu indirin.)*
- **📄 Blueprint (.MD) İndirme**: Üretilen teknik mimariyi ve proje açıklamasını tek tıkla Markdown raporu olarak indirme.
- **🛡️ Açık Kaynak Güvenlik Korumaları**: İstemci tarafı Cooldown (20s), Saatlik Sorgu Limiti (15/saat) ve Max Output Token sınırlamaları ile kota koruması.
- **🎯 Kategori Filtreleri**: Sağlık & AI, Web3 & Güvenlik, Cloud & Altyapı, EdTech, Sürdürülebilirlik, DevOps, **Web & Ürün Tasarımı** ve **Mobil Uygulama**. Gördüğün projeler hatırlanır; aynı proje arka arkaya gelmez.

---

## 🔐 API anahtarın nasıl korunuyor

Anahtar **hiçbir sunucuya gitmiyor** — bu projede sunucu yok. Yalnızca senin tarayıcından doğrudan seçtiğin sağlayıcıya gidiyor. Bunun ötesinde:

| Önlem | Ne engelliyor |
|---|---|
| Anahtar **başlıkta** taşınıyor (`x-goog-api-key` / `x-api-key`) | Tarayıcı geçmişi, referrer ve proxy loglarına sızmasını |
| Her sağlayıcının anahtarı **ayrı slotta** | Sağlayıcı değiştirince diğerinin anahtarının silinmesini |
| Sayfa yüklenirken **input'a geri yazılmıyor** | Devtools, ekran paylaşımı ve eklentilerin okumasını |
| `type="password"` + `autocomplete="off"` + `spellcheck="false"` | Otomatik doldurma ve yazım denetimi yoluyla dışarı çıkmasını |
| Terminal çıktısı **redaksiyondan** geçiyor | Hata mesajı anahtarı yansıtırsa ekran görüntüsüne/hata raporuna girmesini |
| **Oturumluk saklama** seçeneği | Ortak bilgisayarda kalıcı iz bırakmasını |
| **"Anahtarı Sil"** butonu | Anahtarın kaldırılamamasını |
| CSP `connect-src` yalnızca desteklenen sağlayıcı uç noktaları | Anahtarın başka bir adrese gönderilmesini |

`test/api-key-safety.test.js` bunların **hepsini** test ediyor; biri bozulursa CI kırılır.

**Claude seçilirse ek bir not:** Anthropic tarayıcıdan doğrudan çağrıyı varsayılan olarak **kapatır** — tam olarak anahtarın istemcide durmasının riskli olması nedeniyle. Çağrının çalışması için `anthropic-dangerous-direct-browser-access` başlığını gönderiyoruz. Bu başlık riski *yaratmıyor*; anahtarı tarayıcıya koymak yaratıyor ve bu, sunucusuz olmayı seçmiş bu projenin baştan kabul ettiği takas. Ama sessizce olmaması için seçici, Claude seçildiğinde bunu ⚠️ ile yazıyor. Sunucu koymaya razıysan doğru çözüm anahtarı orada tutmak; bu proje bilerek o yolu seçmiyor.

> **Yine de:** anahtar tarayıcıda tutulduğu için mutlak gizlilik iddiası doğru olmaz. Ortak bir bilgisayarda çalışıyorsan "Anahtarı bu tarayıcıda sakla" seçeneğini kapat, işin bitince "Anahtarı Sil"e bas. Anahtarın sızdığından şüphelenirsen [AI Studio](https://aistudio.google.com/app/apikey)'dan iptal edip yenisini al — bu her zaman en kesin çözüm.

---

## 💸 Maliyet: sıfır

Bu proje **tamamen ücretsiz** çalışacak şekilde tasarlandı ve öyle kalması test edilerek korunuyor.

**Ücret çıkmaz, çünkü:**

- Google AI Studio anahtarı varsayılan olarak **ücretsiz katmanda** çalışır. Kota bitince para alınmaz, sadece `429` döner ve uygulama örnek projelere geçer.
- Ücretsiz katmanda **kullanılamayan** özellikler (Google Search grounding gibi) bilinçli olarak kullanılmıyor. `test/free-tier.test.js` bunları kodda arar ve eklenirse testi kırar.
- Yalnızca **flash** modelleri kullanılıyor; pro modelleri hem çok daha pahalı hem de ücretsiz limitleri çok daha dar.
- İstemci tarafı hız sınırı (20 sn bekleme, 15 üretim/saat) günlük kotanın bir oturumda tükenmesini engeller.

**Tek risk:** anahtarının bağlı olduğu Google Cloud projesinde **faturalandırma (billing) etkinse** katman otomatik ücretliye geçer. Kart bağlamadıysan bu mümkün değildir. Kontrol: [console.cloud.google.com/billing](https://console.cloud.google.com/billing)

> **Gizlilik notu:** Google, ücretsiz katmanda gönderilen içeriği ürün geliştirme için kullanabiliyor. Bu bir maliyet değil ama hassas bilgi göndermemek gerekir.

**Kota dolduğunda ne olur?** Uygulama çökmez; "Ücretsiz Gemini kotası doldu, ücret çıkmaz" der ve örnek projeleri göstermeye devam eder. Kota her gün sıfırlanır.

### Diğer sağlayıcılar ücretsiz değil

Gemini varsayılan ve **ücretsiz kalmanın tek yolu**. Anthropic Claude de destekleniyor, ama:

- **Anthropic'in ücretsiz API katmanı yok.** İlk istekten itibaren kullandığın kadar ücretlendirilirsin. Seçici bunu hem seçenek metninde ("— ücretli") hem de altındaki notta söyler; `test/free-tier.test.js` bu etiketin kaybolmadığını doğrular.
- Harcamayı sınırlamak istersen [Anthropic Console](https://console.anthropic.com/settings/limits)'dan aylık limit koy.
- Sağlayıcıyı değiştirmedikçe hiçbir şey değişmez: uygulama açıldığında her zaman Gemini seçili gelir.

**OpenAI (ChatGPT) neden yok?** Denendi ve ölçüldü: `api.openai.com` tarayıcıdan gelen isteklere `Access-Control-Allow-Origin` başlığı **hiç göndermiyor**, yani anahtarın doğru olsa bile istek tarayıcıdan çıkamıyor. Anthropic bunun için açık bir izin başlığı sunuyor, OpenAI sunmuyor. Aşmanın tek yolu araya bir sunucu koymak — bu projede sunucu yok, çünkü anahtarı senin makinende tutan şey tam olarak bu. Seçicide görünüyor ama seçilemiyor; nedeni orada yazılı. OpenAI CORS'u açarsa tek bir bayrak değişikliğiyle etkinleşir.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

- **Frontend / Core**: HTML5, Vanilla JavaScript (ES6+ SPA Architecture)
- **Styling**: Modern Vanilla CSS3 (Custom Design System, Glassmorphism, HSL Design Tokens, CSS Grid/Flexbox)
- **AI Integration**: Google Gemini REST API (`gemini-flash-latest`, yedek: `gemini-flash-lite-latest`) veya Anthropic Messages API (`claude-haiku-4-5`, yedek: `claude-sonnet-5`)
- **Typography**: Google Fonts (*Outfit* & *Fira Code*)
- **Icons & Graphics**: Inline SVG & CSS Micro-animations

---

## 🚀 Hızlı Başlangıç (Local Setup)

Herhangi bir karmaşık paket kurulumuna (npm/node_modules) gerek yoktur.

1. **Repoyu klonlayın**:
   ```bash
   git clone https://github.com/AlperEnesErsu/Aetheria.ai.git
   cd Aetheria.ai
   ```

2. **Yerel sunucuyu başlatın**:
   ```bash
   npm start
   ```
   Bu, `scripts/dev-server.js`'i çalıştırır (Node, sıfır bağımlılık) ve yanıtlara
   `Cache-Control: no-store` ekler.

   > ⚠️ **`python -m http.server` ile geliştirme yapmayın.** Hiç önbellek başlığı
   > göndermediği için tarayıcı `app.js`'i sezgisel olarak önbelleğe alır ve
   > düzenlemenizden sonra **eski kodu çalıştırmaya devam eder** — düzeltmeniz
   > hiçbir şey yapmamış gibi görünür. Bu gerçek bir hata avına mal oldu.
   > Yine de başka bir sunucu kullanacaksanız, kod değişikliğinden sonra
   > **sert yenileme** yapın (Ctrl+F5) veya sekmeyi kapatıp yeniden açın.

3. Tarayıcınızda **`http://localhost:3000`** adresine gidin.

---

## 🧪 Geliştirme

Uygulama bağımlılıksız çalışır; Node yalnızca lint ve testler için gerekir.

```bash
npm install      # sadece geliştirme araçları (ESLint)
npm run check    # lint + birim testleri
```

Saf mantık (escaping, markdown, doğrulama, seçim, rate-limit kararı) `core.js` içindedir ve `test/core.test.js` tarafından `node:test` ile test edilir. `app.js` yalnızca bunları DOM'a bağlar.

Ayrıntılar için [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.
