# Katkı Rehberi

Aetheria.ai'ye katkıda bulunduğunuz için teşekkürler.

## Geliştirme ortamı

Uygulamanın kendisi bağımlılıksız çalışır (vanilla HTML/CSS/JS). Node yalnızca lint ve testler için gerekir.

```bash
npm install          # sadece geliştirme araçları (ESLint)
npm start            # http://localhost:3000 (python -m http.server)
```

Herhangi bir statik sunucu da olur: `npx serve`, VS Code Live Server vb.

## Kod yapısı

| Dosya | Sorumluluk |
|---|---|
| `core.js` | **Saf mantık** — escaping, markdown, doğrulama, seçim, rate-limit kararı, blueprint metni. DOM ve ağ bağımlılığı yok. |
| `app.js` | Bağlama katmanı — DOM render, event handling, `localStorage`, Gemini istek/yanıt döngüsü. |
| `projects-data.js` | Dahili proje veritabanı. |
| `test/core.test.js` | `core.js` için birim testleri (`node:test`). |

**Yeni mantık eklerken:** saf olabilecek her şeyi `core.js`'e koyun ve test yazın. `app.js` yalnızca bunları DOM'a bağlamalıdır.

## Kontroller

```bash
npm run check        # lint + test
```

PR açmadan önce bu komutun temiz geçmesi gerekir; CI de aynısını çalıştırır.

## Güvenlik kuralları

Bu proje güvenilmez içerik render eder (Gemini yanıtları ve kullanıcının düzenleyebildiği `localStorage` havuzu). Bu yüzden:

- **`innerHTML`'e asla ham veri vermeyin.** Düz metin için `textContent`, markdown için `core.parseMarkdown()` (girdiyi kendisi escape eder) kullanın.
- Bir değer HTML attribute'una (özellikle `class`) gidiyorsa allowlist'ten geçirin — bkz. `safeNodeType()`.
- Yeni bir dış kaynak (font, script, API) eklerseniz `index.html`'deki CSP'yi güncellemeyi unutmayın.

## Commit ve PR

- Commit mesajları [Conventional Commits](https://www.conventionalcommits.org/) biçiminde: `fix:`, `feat:`, `chore:`, `docs:`
- PR açıklamasında **neyin bozuk olduğunu** ve **nasıl doğruladığınızı** yazın.
- Bir PR tek bir konuya odaklansın; karışık değişiklikleri bölün.
