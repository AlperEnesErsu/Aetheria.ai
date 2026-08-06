# Aetheria.ai 🚀
> **Yapay Zeka Ajanlı Yazılım Mimarisi ve Pazar Açığı Keşif Platformu**

Aetheria.ai, sektördeki çözülmemiş problemleri, doymuşluk oranlarını ve doymamış pazar açıklarını analiz ederek geliştiricilere ve girişimcilere 2 aşamalı özgün yazılım projeleri, sistem mimarileri (Clean Architecture) ve güvenlik analizleri sunan otonom bir yapay zeka platformudur.

![Aetheria.ai Preview](https://img.shields.io/badge/AI_Engine-Gemini_2.5_Flash-00f2fe?style=for-the-badge) ![License](https://img.shields.io/badge/License-MIT-7f00ff?style=for-the-badge) ![Status](https://img.shields.io/badge/Status-Active-00f5a0?style=for-the-badge)

---

## ✨ Öne Çıkan Özellikler

- **🤖 Otonom Ajan Terminal Simülasyonu**: Pazar taraması ve anomali tespit süreçlerini canlı komut satırı logları ile görselleştirir.
- **⚡ Canlı Gemini 2.5 Flash API Entegrasyonu**: Google AI Studio'dan alınan ücretsiz API Key ile sınırsız, anlık ve %100 özgün proje üretimi.
- **📐 Görsel Sistem Mimarisi Akış Diyagramı (Interactive Diagram Nodes)**: Mikroservis katmanlarını ve veri akışını gösteren interaktif neon düğüm kartları (`Client -> Gateway -> AI Engine -> Storage`).
- **🗂️ Proje Havuzum**: Beğendiğiniz projeleri tarayıcınızda saklayan kişisel kütüphane. *(Backend olmadığı için havuz `localStorage`'da tutulur ve cihazlar arasında paylaşılmaz; paylaşmak için `.md` raporunu indirin.)*
- **📄 Blueprint (.MD) İndirme**: Üretilen teknik mimariyi ve pazar analizlerini tek tıkla Markdown raporu olarak indirme.
- **🛡️ Açık Kaynak Güvenlik Korumaları**: İstemci tarafı Cooldown (20s), Saatlik Sorgu Limiti (15/saat) ve Max Output Token sınırlamaları ile kota koruması.
- **🎯 Kategori & Teknoloji Filtreleri**: Sağlık & AI, Web3 & Güvenlik, Cloud & Altyapı, EdTech ve Sürdürülebilirlik alanlarında özel aramalar.

---

## 🛠️ Teknoloji Yığını (Tech Stack)

- **Frontend / Core**: HTML5, Vanilla JavaScript (ES6+ SPA Architecture)
- **Styling**: Modern Vanilla CSS3 (Custom Design System, Glassmorphism, HSL Design Tokens, CSS Grid/Flexbox)
- **AI Integration**: Google Gemini 2.5 Flash REST API (yedek: Gemini 2.5 Flash Lite)
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
   python -m http.server 3000
   ```
   *veya Herhangi bir statik sunucu (npx serve, VS Code Live Server vb.)*

3. Tarayıcınızda **`http://localhost:3000`** adresine gidin.

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) altında lisanslanmıştır.
