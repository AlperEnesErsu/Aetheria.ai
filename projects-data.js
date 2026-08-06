const PROJECTS_DATABASE = [
    {
        id: "medivision-ai",
        title: "MediVision AI",
        tagline: "Medikal Görüntüleme ve Radyoloji Raporlama Anomali Tespit Platformu",
        category: "Sağlık Teknolojileri & Yapay Zeka",
        categoryKey: "health-ai",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "8 Hafta",
            monetization: "Hastane Lisansı (B2B SaaS) + Vaka Başı Ücret",
            opportunityScore: "%96 Fırsat Skoru"
        },
        diagramNodes: [
            { id: 1, name: "PACS / DICOM Sunucusu", type: "source", sub: "Hastane Otomasyonu" },
            { id: 2, name: "Ingestion Gateway", type: "service", sub: "Go + C-STORE" },
            { id: 3, name: "AI TensorRT Engine", type: "ai", sub: "Vision Transformers (GPU)" },
            { id: 4, name: "Grad-CAM Heatmap Service", type: "service", sub: "Açıklanabilir XAI" },
            { id: 5, name: "PostgreSQL & MinIO", type: "storage", sub: "Şifreli Medikal Depo" },
            { id: 6, name: "Web Dicom Viewer", type: "client", sub: "CornerstoneJS Portal" }
        ],
        step1: {
            marketGap: `Günümüz sağlık sistemlerinde radyologların günlük röntgen, MR ve BT tarama yükü son 5 yılda %40 artmıştır. Mevcut medikal AI çözümleri ya sadece tek bir teşhise (örneğin yalnızca akciğer kanseri) odaklanmakta ya da hastane otomasyon sistemlerine (PACS/DICOM) entegre olamamaktadır. Ayrıca, mevcut yazılımlar doktorlara kararın "neden" alındığını gösteren **Açıklanabilir Yapay Zeka (XAI)** görsel haritalarını sunmamaktadır. MediVision AI, radyoloğu asiste ederek ilk taramayı 3 saniyede gerçekleştirir, anomali bölgelerini ısı haritasıyla (CAM) işaretler ve öncelikli vakaları acil sırasına sokarak doktor eksikliğinden kaynaklanan gecikmeleri ortadan kaldırır.`,
            description: `MediVision AI, hastane PACS sistemlerine DICOM web protokolü üzerinden sessizce bağlanan yapay zeka ajanıdır. 

**Temel İşlevler & Özellikler:**
• **Saniyeler İçinde Anomali Tespiti**: Gelen DICOM görüntülerini derin öğrenme modellerinden (Vision Transformers & CNN) geçirerek tümör, kırık, lezyon veya kanama bölgelerini %98 doğrulukla sınıflandırır.
• **Açıklanabilir Isı Haritaları (Grad-CAM)**: Yapay zekanın kararı verirken görüntünün tam olarak neresine odaklandığını renkli ısı haritası olarak gösterir.
• **Otomatik Medikal Rapor Taslağı**: Anomali tespit edilen vakalarda uluslararası radyo-terminolojisine (RadLex) uygun Türkçe/İngilizce taslak rapor metni oluşturur.
• **Acil Vaka Sıralaması (Triage)**: Hayati tehlike arz eden iç kanama veya beyin felci vakalarını radyoloğun öncelik listesinin en üstüne taşır.`,
            tags: ["Python", "PyTorch", "FastAPI", "DICOM", "Vision Transformers", "React"]
        },
        step2: {
            architecture: `MediVision AI, yüksek hacimli medikal veriyi (DICOM) sıfır gecikmeyle işlemek için **Event-Driven Microservices** ve **Clean Architecture** prensiplerine dayanır.

### 1. Sistem Katmanları:
• **Ingestion Service (Go)**: Hastane PACS sunucularından C-STORE/STOW-RS protokolü ile DICOM dosyalarını güvenle dinler ve Kafka mesaj kuyruğuna iletir.
• **AI Inference Service (Python/PyTorch/Triton Server)**: GPU hızlandırmalı TensorRT modelleri ile paralel çıkarım yapar.
• **Core API (Node.js / NestJS - TypeScript)**: İş mantığı, kullanıcı erişimleri, yetkilendirme ve rapor yönetimi.
• **Web Portal (React + Vite + CornerstoneJS)**: Radyologların DICOM görüntülerini tarayıcı üzerinden 3B manipüle edebildiği tıbbi görüntüleyici.

### 2. Veritabanı Mimarisi:
• **PostgreSQL**: Kullanıcılar, hastaneler, vaka geçmişi ve istatistikler.
• **MinIO / AWS S3 (Encrypted)**: DICOM dosyaları ve üretilen Grad-CAM ısı haritası görselleri.
• **Redis**: Oturum yönetimi, sıklıkla erişilen vaka önbelleği ve anlık bildirim kuyrukları.`,
            security: `Sağlık verileri en yüksek gizlilik standartlarını gerektirir. MediVision AI, **HIPAA** ve **KVKK** uyumlu **Zero-Trust Security (Sıfır Güven)** mimarisiyle korunur.

### 1. Güvenlik Önlemleri & Standartlar:
• **End-to-End Veri Anonimleştirme (De-identification)**: DICOM dosyası sisteme girdiği an hasta adı, T.C. Kimlik No gibi PII (Kişisel Tanımlanabilir Bilgiler) metadata katmanından temizlenir, SHA-256 ile hash'lenmiş rastgele takma adlar (pseudonym) kullanılır.
• **Veri Şifreleme**: 
  - *Durağan Veri (Data at Rest)*: AES-256-GCM ile veritabanı ve nesne depolama şifrelemesi.
  - *Hareketli Veri (Data in Transit)*: TLS 1.3 zorunluluğu ve mTLS (Mutlu TLS) ile mikroservisler arası kimlik doğrulamalı iletişim.
• **Erişim Kontrolü (RBAC & ABAC)**: Radyolog, Asistan Doktor ve Sistem Yöneticisi için rol tabanlı erişim kontrolü. JWT + OAuth2 + 2FA (Zorunlu İki Faktörlü Doğrulama).
• **Audit Logging (Denetim İzleri)**: Hangi doktorun hangi hasta görüntüsüne ne zaman baktığı immutable (değiştirilemez) log mimarisiyle (Elasticsearch + Append-Only storage) kaydedilir.`
        }
    },
    {
        id: "defishield-agent",
        title: "DeFiShield Agent",
        tagline: "Merkeziyetsiz Finans ve Akıllı Sözleşmeler İçin Gerçek Zamanlı AI Güvenlik Ajanı",
        category: "Web3, Blockchain & Güvenlik",
        categoryKey: "web3",
        meta: {
            difficulty: "Uzman Düzey",
            mvpTime: "10 Hafta",
            monetization: "B2B Protocol Security Retainer + MEV Revenue",
            opportunityScore: "%98 Fırsat Skoru"
        },
        diagramNodes: [
            { id: 1, name: "Blockchain Nodes", type: "source", sub: "Geth / Reth IPC" },
            { id: 2, name: "Mempool Listener", type: "service", sub: "Rust (Sub-millisecond)" },
            { id: 3, name: "Transaction Simulator", type: "ai", sub: "Isolated EVM Fork" },
            { id: 4, name: "GNN Anomaly Model", type: "ai", sub: "Graph Neural Networks" },
            { id: 5, name: "ClickHouse & Redis", type: "storage", sub: "Zaman Serisi & Kara Liste" },
            { id: 6, name: "MEV Mitigation Dispatcher", type: "client", sub: "Flashbots Bundle" }
        ],
        step1: {
            marketGap: `Web3 ve DeFi protokollerinde sadece 2023-2024 yılları arasında akıllı sözleşme (Smart Contract) açıklarından kaynaklı 3.8 milyar dolar çalındı. Geleneksel güvenlik denetimleri (Audit) statik ve tek seferliktir; kod bir kez dağıtıldıktan sonra meydana gelen yeni manipülasyon tekniklerine (Reentrancy, Flash Loan Saldırıları, Oracle Manipülasyonu) karşı koruma sağlamaz. Piyasadaki mevcut araçlar ise sadece işlem gerçekleştikten *sonra* uyarı vermektedir. DeFiShield Agent, mempool (onay bekleyen işlemler) seviyesinde dinleme yaparak zararlı işlemleri madenciler bloklamadan önce tespit eder ve koruyucu "front-running" işlemleriyle havuzları kilitler.`,
            description: `DeFiShield, Ethereum, Arbitrum, Solana ve BSC ağlarında blok zincir hareketlerini canlı izleyen otonom bir güvenlik ajanıdır.

**Temel İşlevler & Özellikler:**
• **Mempool Saldırı Analizi**: Onaylanmamış işlemleri yapay zeka güvenlik ajanıyla simüle eder, manipülatif (Flash Loan, Sandwich attack) kalıpları tespit eder.
• **Otonom Pausing (Devre Kesici)**: Bir akıllı sözleşmeye saldırı tespit edildiğinde, ajanın özel güvenlik yetkisiyle (Circuit Breaker) protokolü saniyeler içinde geçici olarak durdurur.
• **Bytecode & Decompilation Taraması**: Açık kaynak olmayan akıllı sözleşmelerin dahi makine kodunu decompile ederek gizli backdoor veya rug-pull mekanizmalarını ortaya çıkarır.
• **AI Risk Skoru API**: Web3 cüzdanlarına (MetaMask vb.) entegre olarak kullanıcının etkileşime gireceği sözleşmenin güvenlik skorunu 0-100 arasında canlı gösterir.`,
            tags: ["Rust", "Solidity", "Python", "Ethers.js", "Web3.py", "Go-Ethereum"]
        },
        step2: {
            architecture: `DeFiShield, milisaniyelerin kritik olduğu blok zincir ortamında **Ultra-Low Latency** ve **High-Throughput** mimarisi kullanır.

### 1. Sistem Katmanları:
• **Mempool Listener (Rust)**: WebSocket ve IPC soketleri üzerinden doğrudan validator node'larına (Geth/Reth) bağlı ultra-hızlı blokzincir dinleyici.
• **Transaction Simulator (Go / Foundry Engine)**: Onay bekleyen işlemleri isolated EVM (Ethereum Virtual Machine) fork'unda milisaniyelik simüle eder.
• **AI Anomaly Classifier (Python / XGBoost + GNN)**: Graph Neural Networks ile sözleşme bağımlılık grafiklerini ve token akışlarını anomali testine sokar.
• **Alert & Mitigation Dispatcher (Rust)**: Saldırıyı önleyecek MEV-boost Flashbots işlemlerini doğrudan madencilere özel kanallardan iletir.

### 2. Veritabanı Mimarisi:
• **ClickHouse**: Saniyede milyonlarca blokzincir olayını (event log) depolayan sütun tabanlı ultra hızlı zaman serisi veritabanı.
• **Redis Cluster**: Onay bekleyen mempool işlemleri ve adres kara listesi için in-memory veri saklama.`,
            security: `DeFiShield bizzat bir güvenlik ürünü olduğu için mimarisi **Defense-in-Depth (Derinlemesine Savunma)** prensibine dayanır.

### 1. Güvenlik Önlemleri & Standartlar:
• **HSM (Hardware Security Module) İmzalaması**: Otonom protokol durdurma yetkisine sahip özel anahtarlar (Private Keys) asla sunucu belleğinde tutulmaz; AWS KMS veya YubiHSM 2 donanım modüllerinde saklanır.
• **Multi-Sig & Timelock Yönetimi**: Ajanın kritik parametre güncellemeleri 3/5 Multi-Signature (Çoklu İmza) ve 24 saatlik Timelock gecikmesi şartına bağlıdır.
• **Zero-Knowledge Proofs (ZKP)**: İşlem simülasyon sonuçlarının manipüle edilmediğini doğrulayan ZK-SNARK kanıtları üretilir.
• **Smart Contract Slashing & Anti-Flashloan**: Güvenlik ajanının kendi akıllı sözleşmeleri CertiK ve OpenZeppelin standartlarına göre formal-verification (matematiksel doğrulama) testlerinden geçirilmiştir.`
        }
    },
    {
        id: "omnicache-ai",
        title: "OmniCache AI",
        tagline: "Yapay Zeka Destekli Tahminli Önbellekleme ve Depolama Yönetim Katmanı",
        category: "Altyapı, Cloud & Performans",
        categoryKey: "infrastructure",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "6 Hafta",
            monetization: "Cloud Infrastructure Usage-Based Pricing",
            opportunityScore: "%94 Fırsat Skoru"
        },
        diagramNodes: [
            { id: 1, name: "Client Traffic (RESP)", type: "source", sub: "Redis / Memcached Inbound" },
            { id: 2, name: "eBPF / DPDK Data Plane", type: "service", sub: "Kernel-Level Router (C++20)" },
            { id: 3, name: "Predictive Cache AI", type: "ai", sub: "LSTM + Time Series" },
            { id: 4, name: "Tiered Storage Manager", type: "storage", sub: "RAM -> NVMe -> S3" },
            { id: 5, name: "RocksDB & VictoriaMetrics", type: "storage", sub: "Local KV & Metrikler" },
            { id: 6, name: "Admin Dashboard", type: "client", sub: "Vue 3 Performance Portal" }
        ],
        step1: {
            marketGap: `Büyük ölçekli web uygulamalarında ve mikroservis mimarilerinde Redis veya Memcached kullanımı çoğunlukla manuel ve sezgiseldir (LRU, LFU önbellek temizleme politikaları). Bu durum yüksek RAM maliyetlerine ve "Cache Stampede" (önbellek çökmesi) sorunlarına yol açar. Geleneksel sistemler hangi verinin 5 dakika sonra popüler olacağını tahmin edemez. OmniCache AI, mikroservis trafiğini zaman serisi yapay zeka modelleriyle analiz ederek veriyi sorgu *gelmeden önce* önbelleğe alır ve erişilmeyen verileri anında RAM'den NVMe disk katmanına kaydırarak Cloud altyapı maliyetlerini %60 oranında düşürür.`,
            description: `OmniCache AI, mevcut Redis veya Memcached sunucularınızın önüne şeffaf bir proxy olarak oturan zeki bir veri katmanıdır.

**Temel İşlevler & Özellikler:**
• **Predictive Cache Warming (Tahminli Önbellek Isıtma)**: Kullanıcı davranışlarını ve geçmiş trafik dalgalanmalarını öğrenerek sorgulanacak verileri milisaniyeler öncesinden RAM'e yükler.
• **Akıllı Katmanlı Depolama (Tiered Storage)**: Sıcak veri (RAM) -> Ilık veri (NVMe SSD) -> Soğuk veri (S3) geçişini sıfır kod değişikliğiyle otomatik yönetir.
• **Cache Stampede Koruması**: Aynı anda binlerce kullanıcının önbellekte olmayan tek bir veriyi sorgulaması durumunda veritabanına sadece 1 istek gönderir, diğerlerini bekleme kuyruğunda birleştirir.
• **Otomatik TTL Entegrasyonu**: Statik TTL süreleri yerine veri güncellenme sıklığına göre dinamik TTL (Time-To-Live) belirler.`,
            tags: ["C++20", "Go", "eBPF", "Redis Protocol", "LightGBM", "Prometheus"]
        },
        step2: {
            architecture: `OmniCache AI, ağ paketlerini çekirdek (kernel) seviyesinde işlemek ve ultra düşük gecikme (sub-millisecond) sağlamak için **eBPF (Extended Berkeley Packet Filter)** ve **Zero-Copy Memory** mimarisini kullanır.

### 1. Sistem Katmanları:
• **Data Plane (C++20 / DPDK / eBPF)**: Gelen RESP (Redis Serialization Protocol) trafiğini çekirdek alanında karşılar, mikrosaniyeler seviyesinde yönlendirir.
• **Control Plane (Go)**: Küme yönetimi, düğüm sağlık kontrolleri ve metrik toplama.
• **Predictive AI Engine (Python / Rust - PyO3)**: On-line learning algoritmaları (LSTM & Prophet) ile gelecek dakika bazlı trafik eğrisini hesaplayan arka plan ajanı.
• **Admin Console (Vue.js 3 + Tailwind)**: RAM tasarrufu, önbellek isabet oranı (Hit Rate) ve gecikme metriklerinin canlı izlendiği dashboard.

### 2. Veritabanı Mimarisi:
• **RocksDB (Embedded KV)**: SSD üzerinde yüksek hızlı yerel anahtar-değer depolama.
• **Prometheus & VictoriaMetrics**: Saniye bazlı performans ve harcanan RAM bellek metrikleri depolama.`,
            security: `Önbellek katmanları hassas kullanıcı verilerinin en çok sızdırıldığı zayıf noktalardır. OmniCache AI, **Enterprise-Grade Infrastructure Security** sunar.

### 1. Güvenlik Önlemleri & Standartlar:
• **Zero-Trust Memory Isolation**: Farklı kiracıların (multi-tenant) veya mikroservislerin verileri RAM bellek seviyesinde donanımsal olarak izole edilir (Process Sandboxing).
• **TLS Termination & Passthrough**: İstemci ile önbellek arasındaki tüm trafik TLS 1.3 ile şifrelenir; dahili bellek dökümlerinde (RAM dumps) veriler şifreli saklanır.
• **Dynamic Data Masking (DDM)**: Kredi kartı, e-posta veya şifre hash'leri önbelleğe girmeden önce kural bazlı tespit edilerek RAM'de maskelenir.
• **DDoS & Rate Limiting (Token Bucket)**: Anormal yüksek sorgu gönderen IP adresleri veya yetkisiz servisler eBPF katmanında sunucu işlemcisine yük bindirmeden drop edilir.`
        }
    },
    {
        id: "eduscribe-ai",
        title: "EduScribe AI",
        tagline: "Nöroçeşitlilik Odaklı İnteraktif Görsel Öğrenme ve Zihin Haritası Platformu",
        category: "Eğitim Teknolojileri & Yapay Zeka",
        categoryKey: "edtech",
        meta: {
            difficulty: "Orta Düzey",
            mvpTime: "4 Hafta",
            monetization: "Freemium + Okul B2B Lisansı",
            opportunityScore: "%95 Fırsat Skoru"
        },
        diagramNodes: [
            { id: 1, name: "Ders Videosu / PDF", type: "source", sub: "İçerik Yükleme" },
            { id: 2, name: "Media Processing Pipeline", type: "service", sub: "FFmpeg + Whisper AI" },
            { id: 3, name: "Concept Graph Extractor", type: "ai", sub: "NLP & MindMap Generator" },
            { id: 4, name: "Neo4j & Vector DB", type: "storage", sub: "Graph DB + pgvector RAG" },
            { id: 5, name: "Disleksi UI Portal", type: "client", sub: "Next.js + D3.js MindMaps" }
        ],
        step1: {
            marketGap: `Dünya genelinde öğrencilerin %15'i Disleksi, DEHB (Dikkat Eksikliği) veya İşitsel İşleme Bozukluğundan etkilenmektedir. Geleneksel online kurslar (Coursera, Udemy vb.) uzun videolar ve yoğun metin blokları sunar; bu da bu öğrenciler için öğrenmeyi zorlaştırır. Pazardaki yapay zeka araçları ise yalnızca uzun metinleri kısa özetlere dönüştürmektedir; ancak nöroçeşitli öğrenciler için özet metinler değil, **görsel şemalar, interaktif zihin haritaları, odak odaklı seslendirmeler ve renk kodlu kavram haritaları** gereklidir. EduScribe AI, uzun ders videolarını ve PDF'leri disleksi dostu typography ve dinamik görsel haritalara dönüştürür.`,
            description: `EduScribe AI, ders içeriklerini nöroçeşitli bireylerin algılama biçimine göre yeniden yapılandıran yapay zeka destekli bir e-öğrenme ajanıdır.

**Temel İşlevler & Özellikler:**
• **Videodan Dinamik Zihin Haritasına**: Yüklenen 1 saatlik ders videosunu analiz eder, ana kavramları ve aralarındaki nedensellik bağlarını canlı tıklanabilir zihin haritasına dönüştürür.
• **Disleksi Dostu Okuma Modu**: Metinleri OpenDyslexic yazı tipinde, kelime vurgulama (Bionic Reading) ve renkli odak çizgileriyle sunar.
• **Sesli & Görsel Soru-Cevap Ajanı**: Öğrencinin anlamadığı bir kavramı mikrofonla sormasına olanak tanır ve bunu basit analojilerle ve kısa animasyonlarla açıklar.
• **Mikro-Öğrenme Modülleri**: Uzun konuları 3'er dakikalık odaklanabilir interaktif kartlara (Flashcards) ve mini quiz'lere böler.`,
            tags: ["Next.js", "Python", "Whisper AI", "LangChain", "D3.js", "Web Speech API"]
        },
        step2: {
            architecture: `EduScribe AI, medya işleme yüklerini ve gerçek zamanlı etkileşimi yönetmek için **Serverless Pipeline & Micro-Frontend** yapısını benimser.

### 1. Sistem Katmanları:
• **Media Processing Pipeline (Python / AWS Batch)**: Yüklenen video/ses dosyalarını Whisper AI ile altyazılandırır, FFmpeg ile sahne değişimlerini tespit eder.
• **NLP & Concept Graph Engine (Python / LangChain + OpenAI/Gemini)**: Ders metinlerinden kavramları, tanımları ve ilişkileri çıkararak JSON şeması oluşturur.
• **Frontend UI (Next.js 14 - App Router + D3.js)**: Zihin haritalarını SVG/Canvas üzerinde akıcı animasyonlarla çizen kullanıcı arayüzü.
• **Realtime Audio Gateway (WebSockets / Node.js)**: Öğrenci ile sesli etkileşim kuran düşük gecikmeli ses akış sunucusu.

### 2. Veritabanı Mimarisi:
• **Neo4j (Graph Database)**: Ders kavramları arasındaki hiyerarşik ve mantıksal ilişkileri depolayan çizge veritabanı.
• **PostgreSQL + pgvector**: Ders içeriklerinin semantik araması (RAG - Retrieval Augmented Generation) için vektör gömmeleri.`,
            security: `Kullanıcı kitlesinin ağırlıklı olarak öğrenciler ve çocuklar olması sebebiyle **COPPA** ve **GDPR-K (Çocukların Gizliliği)** uyumu zorunludur.

### 1. Güvenlik Önlemleri & Standartlar:
• **Strict Data Privacy & Safe Search**: Öğrencilerin sisteme yüklediği ders notları veya ses kayıtları yapay zeka modellerinin genel eğitiminde asla kullanılmaz.
• **Content Moderation Filter**: Yapay zekanın ürettiği tüm yanıtlar ve görseller içerik güvenlik filtrelerinden (LLM Guard) geçirilerek uygunsuz içerik engellenir.
• **Öğrenci Verisi Şifreleme**: Öğrenci hesapları veli/öğretmen onaylı yetkilendirme (OAuth2 Child Consent) altında çalışır ve tüm kişisel gelişim verileri AES-256 ile şifrelenir.
• **Session Limits & Health Indicators**: Aşırı ekran kullanımını önlemek için otomatik mola uyarıları veren güvenli oturum yönetimi.`
        }
    },
    {
        id: "ecochain-iot",
        title: "EcoChain Trace",
        tagline: "IoT ve Blockchain Tabanlı Otonom Karbon Ayak İzi ve Tedarik Zinciri Takibi",
        category: "Sürdürülebilirlik & IoT & Blockchain",
        categoryKey: "sustainability",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "8 Hafta",
            monetization: "SaaS Abonelik + Sertifikasyon Başı Ücret",
            opportunityScore: "%97 Fırsat Skoru"
        },
        diagramNodes: [
            { id: 1, name: "Fabrika & Lojistik IoT", type: "source", sub: "MQTT / Modbus Sayaçlar" },
            { id: 2, name: "EMQX MQTT Broker", type: "service", sub: "Go Gateway (100k msg/s)" },
            { id: 3, name: "ISO 14064 AI Calculator", type: "ai", sub: "Anlık Karbon Hesabı" },
            { id: 4, name: "TimescaleDB & Hyperledger", type: "storage", sub: "Zaman Serisi & Ledger DB" },
            { id: 5, name: "Dijital Pasaport QR Portal", type: "client", sub: "AB CBAM Uyumlu Web App" }
        ],
        step1: {
            marketGap: `Avrupa Birliği'nin kabul ettiği **CBAM (Sınırda Karbon Düzenleme Mekanizması)** uyarınca ihracatçı şirketler ürettikleri her ürünün karbon emisyonunu kanıtlamak zorundadır. Ancak mevcut şirketler karbon emisyonlarını Excel tabloları ve beyan usulü tahminlerle yönetmektedir. Bu durum "Greenwashing" (yeşil aklama) davalarına ve ağır gümrük cezalarına neden olmaktadır. Pazarda, lojistik araçlarından ve fabrika sensörlerinden **canlı veri toplayan, değiştirilemez şekilde doğrulayan ve otomatik AB uyumlu sertifika üreten** entegre bir otonom çözüm bulunmamaktadır. EcoChain Trace bu açığı kapatır.`,
            description: `EcoChain Trace, fabrikalardaki IoT sensörleri ve lojistik araçları ile entegre olarak ürün bazlı karbon ayak izini canlı hesaplayan SaaS platformudur.

**Temel İşlevler & Özellikler:**
• **IoT Sensör Entegrasyonu**: Fabrikadaki elektrik, gaz ve yakıt sayaçlarından Modbus/MQTT protokolleriyle canlı emisyon verisi çeker.
• **Değiştirilemez Emisyon Pasaportu (Digital Product Passport)**: Ürünün ham maddeden son tüketiciye kadar olan karbon serüvenini blok zincirde depolayarak QR kodlu dijital pasaport oluşturur.
• **AB CBAM / ISO 14064 Uyumlu Raporlama**: Gümrük idarelerine tek tıkla resmi onaylı karbon emisyon raporu sunar.
• **AI Destekli Emisyon Optimizasyonu**: Fabrika yöneticilerine "Üretim vardiyasını saat 22:00'ye kaydırırsanız yeşil enerji oranı artacak ve 4,200$ karbon vergisi tasarruf edilecek" önerileri sunar.`,
            tags: ["Go", "MQTT", "Hyperledger Fabric", "TimescaleDB", "React", "Python"]
        },
        step2: {
            architecture: `EcoChain Trace, binlerce sensörden gelen yoğun veri akışını işlemek için **Event Streaming & Enterprise Blockchain** mimarisi kullanır.

### 1. Sistem Katmanları:
• **IoT Gateway (Go / EMQX MQTT Broker)**: Fabrika ve lojistik araçlarından gelen MQTT/CoAP mesajlarını saniyede 100k paket kapasitesiyle karşılar.
• **Data Ingestion Engine (Apache Kafka)**: Verileri doğrular, birleştirir ve analiz servislerine dağıtır.
• **Carbon Calculation Engine (Python / NumPy)**: ISO 14064 standartlarına göre emisyon katsayılarıyla anlık hesaplama yapar.
• **Private Ledger Layer (Hyperledger Fabric)**: Kurumsal ve gizli tedarik zinciri blokzinciri.
• **Web Portal (React + Leaflet.js)**: Ürünlerin coğrafi rotasını ve emisyon haritasını gösteren dashboard.

### 2. Veritabanı Mimarisi:
• **TimescaleDB (PostgreSQL Extension)**: Sensör zaman serisi verilerinin yüksek performanslı depolanması.
• **Hyperledger CouchDB**: Blok zincir durum veritabanı (World State).`,
            security: `Endüstriyel IoT cihazları ve ticari sır niteliğindeki üretim verileri yüksek siber saldırı riski altındadır.

### 1. Güvenlik Önlemleri & Standartlar:
• **IoT Device Authentication (mTLS & Hardware Root of Trust)**: Sensörler sisteme bağlanırken donanımsal X.509 sertifikaları ile kimlik doğrular; yetkisiz cihaz eklenemez.
• **Endüstriyel Ağ İzolasyonu (DMZ)**: Fabrika OT (Operasyonel Teknoloji) ağı ile IT (Bilgi Teknolojileri) ağı arasında uni-directional (tek yönlü) veri diyotları kullanılır.
• **Ticari Gizlilik Koruması (Zero-Knowledge Range Proofs)**: Tedarikçiler rakiplerine üretim kapasitelerini ifşa etmeden emisyon limitlerine uyduklarını kanıtlayabilirler.
• **Firmware Integrity Checks (OTA)**: Sensör yazılım güncellemeleri kriptografik olarak imzalanır.`
        }
    },
    {
        id: "synthtest-ai",
        title: "SynthTest AI",
        tagline: "Yazılım Ekipleri İçin Otonom Test Senaryosu ve Sentetik Veri Üretim Ajanı",
        category: "DevOps & Yazılım Geliştirme Araçları",
        categoryKey: "devops",
        meta: {
            difficulty: "Orta Düzey",
            mvpTime: "5 Hafta",
            monetization: "Geliştirici Başı / Koltuk Başı SaaS",
            opportunityScore: "%93 Fırsat Skoru"
        },
        diagramNodes: [
            { id: 1, name: "Source Code & DB Schema", type: "source", sub: "Yerel Proje Dizini" },
            { id: 2, name: "SynthTest CLI & AST Engine", type: "service", sub: "Rust / Tree-Sitter" },
            { id: 3, name: "GAN Synthetic Generator", type: "ai", sub: "Differential Privacy Model" },
            { id: 4, name: "Sandboxed Docker Runner", type: "storage", sub: "Playwright E2E Runner" },
            { id: 5, name: "Coverage Dashboard", type: "client", sub: "Next.js Report Portal" }
        ],
        step1: {
            marketGap: `Modern yazılım geliştirmede test yazmak (Unit, Integration, End-to-End) geliştirme süresinin %30'unu alır. Ancak daha büyük sorun **Gerçekçi Test Verisi (Staging Data)** eksikliğidir. Canlı (Production) veriyi test ortamına kopyalamak KVKK/GDPR ihlallerine ve veri sızıntılarına yol açar. Geleneksel mock kütüphaneleri (Faker vb.) ise ilişkisel karmaşık veritabanı bağımlılıklarını ve uç durumları (edge cases) simüle edemez. SynthTest AI, kaynak kodunuzu ve DB şemanızı analiz ederek KVKK uyumlu, ilişkisel bütünlüğü olan milyarlarca sentetik test verisi ve otomatik E2E Playwright/Cypress test kodları üretir.`,
            description: `SynthTest AI, CI/CD süreçlerinize entegre olan ve yazılımınızın test kapsama oranını (Coverage) otonom olarak %95 üzerine çıkaran bir geliştirici ajanıdır.

**Temel İşlevler & Özellikler:**
• **İlişkisel Sentetik Veri Jeneratörü**: Veritabanı şemanızı inceleyerek yabancı anahtar (FK) ilişkilerini koruyan, istatistiksel olarak canlı veriye benzeyen ama tamamen sahte veriler üretir.
• **Otonom E2E Test Yazarı**: Web uygulamanızın DOM yapısını inceleyerek tıklama, form doldurma ve satın alma senaryolarını Playwright/TypeScript formatında otomatik kodlar.
• **Self-Healing Tests (Kendi Kendini Onaran Testler)**: Buton ID'si veya sayfa tasarımı değiştiğinde testlerin çökmesini engeller; AI öğeyi görsel olarak bulup testi günceller.
• **Mutation Testing**: Kodunuza yapay hatalar enjekte ederek mevcut testlerinizin gerçekten hataları yakalayıp yakalamadığını ölçer.`,
            tags: ["TypeScript", "Node.js", "Python", "Playwright", "Docker", "PostgreSQL"]
        },
        step2: {
            architecture: `SynthTest AI, geliştirici bilgisayarında ve CI/CD ortamında yerel (local-first) çalışabilen **CLI & Cloud-Hybrid** mimariye sahiptir.

### 1. Sistem Katmanları:
• **SynthTest CLI (Rust / Node.js)**: Geliştiricinin terminalinde çalışan, kodu tarayan ve yerel Docker konteynerlerinde sentetik veri basan komut satırı aracı.
• **AST Parser & Code Analyzer (Tree-Sitter / TypeScript Compiler API)**: Uygulamanın API uç noktalarını ve veri modellerini abstract syntax tree ile ayrıştırır.
• **Generative Data Model (Python / GANs + LLM)**: Tablosal verilerin istatistiksel dağılımını öğrenen ve sentetik türevlerini üreten makine öğrenmesi modeli.
• **Cloud Dashboard (Next.js + Tailwind)**: Test sonuçlarının, kapsama oranlarının ve sentetik veri şablonlarının yönetildiği panel.

### 2. Veritabanı Mimarisi:
• **SQLite / DuckDB**: Yerel test çalıştırmalarında kullanılan ultra-hızlı in-memory veritabanı.
• **ClickHouse**: CI/CD hatlarında geçmiş test sürelerini ve başarı oranlarını depolayan analitik veritabanı.`,
            security: `Yazılım kaynak kodları ve test verileri şirketlerin en değerli fikri mülkiyetidir.

### 1. Güvenlik Önlemleri & Standartlar:
• **Local-First & Zero Data Retention**: Kaynak kodunuz asla uzak sunuculara gönderilmez. Tüm AST analizi ve test üretimi geliştiricinin yerel makinesinde veya kendi CI/CD runner'ında gerçekleşir.
• **Differential Privacy (Farklılaşmış Gizlilik)**: Sentetik veri üretilirken canlı veritabanından alınan istatistiksel özetlere gürültü (noise) eklenerek orijinal verinin geri dönüştürülmesi imkansız kılınır.
• **Sandboxed Test Execution**: Otomatik üretilen test kodları kısıtlanmış Docker konteynerleri (görsel ve ağ erişimi izole) içinde çalıştırılır.
• **Dependency Vulnerability Scanning**: Üretilen test paketlerinin 3. taraf bağımlılıkları Snyk/Trivy ile taranır.`
        }
    },
    {
        id: "pharmaguard-ai",
        title: "PharmaGuard AI",
        tagline: "Çoklu İlaç Kullanımında Etkileşim ve Advers Reaksiyon Erken Uyarı Motoru",
        category: "Sağlık Teknolojileri & Yapay Zeka",
        categoryKey: "health-ai",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "7 Hafta",
            monetization: "Hastane & Eczane Zinciri Aboneliği (B2B) + API Çağrı Başı",
            opportunityScore: "%93 Fırsat Skoru"
        },
        diagramNodes: [
            { id: 1, name: "HBYS / e-Reçete", type: "source", sub: "HL7 FHIR Reçete Akışı" },
            { id: 2, name: "Normalization Service", type: "service", sub: "ATC / RxNorm Eşleme" },
            { id: 3, name: "Interaction Graph Engine", type: "ai", sub: "Knowledge Graph + GNN" },
            { id: 4, name: "Risk Scoring Model", type: "ai", sub: "Hasta Bazlı Bayesian Skor" },
            { id: 5, name: "Neo4j & TimescaleDB", type: "storage", sub: "İlaç Grafiği + Zaman Serisi" },
            { id: 6, name: "Hekim Uyarı Paneli", type: "client", sub: "Reçete Anı Bildirimi" }
        ],
        step1: {
            marketGap: `65 yaş üstü hastaların yarısından fazlası aynı anda beş veya daha fazla ilaç kullanıyor (polifarmasi) ve hastane yatışlarının kayda değer bir bölümü önlenebilir ilaç etkileşimlerinden kaynaklanıyor. Piyasadaki etkileşim veritabanları ise **statik sözlükler** halinde çalışıyor: "A ilacı + B ilacı = riskli" der, ancak hastanın böbrek fonksiyonunu, yaşını, genetik metabolizma profilini veya eşzamanlı kullandığı bitkisel takviyeyi hesaba katmaz. Sonuç, hekimin her reçetede onlarca alakasız uyarıyla karşılaşıp hepsini kapatmayı öğrendiği **"alarm yorgunluğu"** olur; gerçek riskli vaka da bu gürültünün içinde kaybolur. PharmaGuard AI, etkileşimi ikili bir tablo yerine hasta bağlamına oturan bir **bilgi grafiği** üzerinde değerlendirir ve hekime yalnızca o hasta için anlamlı olan, gerekçesi açıklanmış uyarıyı gösterir.`,
            description: `PharmaGuard AI, hastane bilgi sistemine ve e-reçete akışına bağlanarak reçete yazılırken devreye giren bir klinik karar destek ajanıdır.

**Temel İşlevler & Özellikler:**
• **Hasta Bağlamlı Risk Skoru**: Etkileşimi yaş, kreatinin klirensi, karaciğer fonksiyonu, kilo ve eşzamanlı tanılarla birlikte değerlendirerek her uyarıya 0-100 arası kişiselleştirilmiş bir risk puanı verir.
• **Gürültü Filtresi (Alarm Fatigue Reduction)**: Klinik olarak önemsiz etkileşimleri bastırır, hekime ortalama reçete başına yalnızca yüksek anlamlılıktaki uyarıları iletir.
• **Gerekçeli Açıklama**: Her uyarının altında etkileşimin mekanizmasını (örneğin CYP3A4 enzim inhibisyonu) ve dayandığı literatür referansını gösterir.
• **Alternatif İlaç Önerisi**: Riskli kombinasyon tespit edildiğinde aynı ATC sınıfından, hastanın profiline uygun ve geri ödeme kapsamındaki alternatifleri sıralar.
• **Bitkisel Takviye ve OTC Kapsamı**: Reçetesiz satılan ürünlerin ve yaygın bitkisel takviyelerin etkileşimlerini de kapsar.`,
            tags: ["Python", "Neo4j", "FastAPI", "HL7 FHIR", "Graph Neural Networks", "TypeScript"]
        },
        step2: {
            architecture: `PharmaGuard AI, reçete anında saniyenin altında yanıt vermesi gereken bir karar destek sistemidir; bu nedenle **okuma-ağırlıklı (read-optimized)** ve **grafik merkezli** bir mimari kullanır.

### 1. Sistem Katmanları:
• **Ingestion & Normalization (Python)**: HBYS'den HL7 FHIR MedicationRequest kaynaklarını alır; serbest metin ilaç adlarını ATC ve RxNorm kodlarına eşler. Bu katman olmadan aynı etken madde onlarca farklı ticari isimle sisteme girer.
• **Graph Engine (Neo4j + GNN)**: İlaçlar, etken maddeler, enzimler ve yan etkiler düğüm; etkileşimler kenar olarak modellenir. Graph Neural Network katmanı, literatürde doğrudan raporlanmamış dolaylı etkileşimleri (A-C üzerinden B) tahmin eder.
• **Risk Scoring Service (Python)**: Grafikten gelen ham etkileşimi hasta laboratuvar değerleriyle birleştirerek Bayesian bir skora dönüştürür.
• **Core API (Go)**: Yetkilendirme, denetim kaydı ve düşük gecikmeli uyarı dağıtımı.
• **Hekim Paneli (React + TypeScript)**: HBYS içine gömülebilen widget ve bağımsız web portalı.

### 2. Veritabanı Mimarisi:
• **Neo4j**: İlaç etkileşim bilgi grafiği; ilişki derinliğine göre sorgu bu yapıda ilişkisel veritabanından çok daha verimlidir.
• **TimescaleDB**: Hasta laboratuvar değerlerinin zaman serisi geçmişi ve uyarı telemetrisi.
• **Redis**: Sık yazılan reçete kombinasyonları için sonuç önbelleği; reçete anındaki gecikme bütçesini korur.`,
            security: `Reçete verisi özel nitelikli kişisel veridir. Sistem **KVKK**, **HIPAA** ve **GDPR** uyumlu tasarlanmıştır.

### 1. Güvenlik Önlemleri & Standartlar:
• **Minimum Veri İlkesi**: Risk hesabı için yalnızca ilaç listesi ve ilgili laboratuvar değerleri istenir; hasta kimlik bilgisi hiçbir zaman skorlama servisine geçmez, yerine oturum bazlı takma tanımlayıcı kullanılır.
• **Veri Şifreleme**: Durağan veride AES-256-GCM, iletimde TLS 1.3 ve mikroservisler arası mTLS zorunluluğu.
• **Erişim Kontrolü**: Hekim, eczacı ve denetçi rolleri için RBAC; her rol yalnızca kendi hasta kapsamındaki kayıtları görür. OAuth2 + zorunlu 2FA.
• **Klinik Sorumluluk İzleri**: Hangi uyarının hangi hekime gösterildiği ve hekimin uyarıyı kabul mu reddetmi ettiği değiştirilemez (append-only) log olarak saklanır. Bu hem tıbbi sorumluluk hem de modelin gerçek dünya başarısını ölçmek için gereklidir.
• **Model Yönetişimi**: Etkileşim modelinin her sürümü versiyonlanır; bir uyarının hangi model sürümü tarafından üretildiği geriye dönük olarak izlenebilir.`
        }
    },
    {
        id: "mindpulse-rpm",
        title: "MindPulse RPM",
        tagline: "Kronik Hastalık Takibinde Pasif Dijital Biyobelirteç ve Kötüleşme Tahmini",
        category: "Sağlık Teknolojileri & Yapay Zeka",
        categoryKey: "health-ai",
        meta: {
            difficulty: "Orta Düzey",
            mvpTime: "6 Hafta",
            monetization: "Hasta Başı Aylık Abonelik (B2B2C) + Sigorta Anlaşmaları",
            opportunityScore: "%91 Fırsat Skoru"
        },
        diagramNodes: [
            { id: 1, name: "Giyilebilir & Telefon", type: "source", sub: "HealthKit / Google Fit" },
            { id: 2, name: "Sync Gateway", type: "service", sub: "Kesintiye Dayanıklı Kuyruk" },
            { id: 3, name: "Baseline Learner", type: "ai", sub: "Kişiye Özel Normal Aralık" },
            { id: 4, name: "Deterioration Model", type: "ai", sub: "Erken Kötüleşme Sinyali" },
            { id: 5, name: "TimescaleDB", type: "storage", sub: "Yüksek Frekanslı Zaman Serisi" },
            { id: 6, name: "Klinik Takip Paneli", type: "client", sub: "Hemşire Triyaj Kuyruğu" }
        ],
        step1: {
            marketGap: `Kalp yetmezliği, KOAH ve tip 2 diyabet gibi kronik hastalıklarda hastaneye yeniden yatışların büyük kısmı, kötüleşme günler öncesinden başladığı halde fark edilmediği için gerçekleşiyor. Mevcut uzaktan hasta izleme (RPM) ürünleri iki uçta toplanmış durumda: bir yanda hastanın her gün elle veri girmesini bekleyen anket uygulamaları — ki bunlarda terk oranı ilk ayda çok yüksek — diğer yanda ham adım ve nabız sayısını grafiğe döken tüketici uygulamaları. İkisi de **kişiye özel normali** öğrenmiyor: bir hastanın istirahat nabzının 58'den 67'ye çıkması onun için kritik bir sinyal olabilirken, başka bir hasta için tamamen sıradan olabilir. MindPulse RPM, hastadan hiçbir ek eylem beklemeden giyilebilir cihaz ve telefon sensörlerinden pasif veri toplar, her hasta için kendi taban çizgisini öğrenir ve sapmayı klinik ekibe **kötüleşmeden günler önce** bildirir.`,
            description: `MindPulse RPM, kronik hasta takibini anketten çıkarıp pasif sensör verisine taşıyan bir izleme platformudur.

**Temel İşlevler & Özellikler:**
• **Sıfır Eforlu Veri Toplama**: Adım, istirahat nabzı, nabız değişkenliği, uyku bölünmesi ve ses tonu gibi sinyalleri hastadan ek bir işlem istemeden arka planda toplar.
• **Kişiye Özel Taban Çizgisi**: İlk iki haftada hastanın kendi normal aralığını öğrenir; uyarı eşiği popülasyon ortalaması yerine hastanın kendi geçmişine göre belirlenir.
• **Erken Kötüleşme Skoru**: Çoklu sinyaldeki eşzamanlı kaymayı değerlendirerek klinik ekibe gün bazında öncelikli takip listesi üretir.
• **Hemşire Triyaj Kuyruğu**: Yüzlerce hastayı grafik grafiğe gezmek yerine, ekip yalnızca skoru yükselen hastaları içeren sıralı bir kuyruk görür.
• **Cihaz Bağımsızlığı**: Apple HealthKit, Google Fit ve yaygın Bluetooth tansiyon/oksimetre cihazlarıyla çalışır; tek bir marka kilidi yoktur.`,
            tags: ["React Native", "Python", "TimescaleDB", "HealthKit", "Time Series ML", "FastAPI"]
        },
        step2: {
            architecture: `Sistem, mobil cihazın uzun süre çevrimdışı kalabileceği gerçeğine göre tasarlanmıştır: veri kaybı değil, **gecikmeli teslim** kabul edilir.

### 1. Sistem Katmanları:
• **Mobil İstemci (React Native)**: Arka planda sensör verisini yerel SQLite kuyruğuna yazar; bağlantı geldiğinde toplu olarak gönderir. Batarya tüketimini sınırlamak için örnekleme frekansı uyarlanabilir.
• **Sync Gateway (Go)**: Idempotent yazma uçları; aynı ölçüm birden çok kez gönderilse bile tekilleştirilir. Bu, çevrimdışı senkronizasyonun en sık atlanan detayıdır.
• **Baseline Learner (Python)**: Her hasta için hareketli istatistiksel taban çizgisi ve mevsimsel düzeltme hesaplar.
• **Deterioration Model (Python)**: Çok değişkenli zaman serisi modeli ile kötüleşme olasılığı üretir; çıktı ham olasılık değil, klinik ekibin eyleme dönüştürebileceği üç kademeli bir sinyaldir.
• **Klinik Panel (Next.js)**: Triyaj kuyruğu, hasta zaman çizelgesi ve not alma.

### 2. Veritabanı Mimarisi:
• **TimescaleDB**: Yüksek frekanslı sensör verisi için hypertable; eski veriler otomatik olarak saatlik/günlük özetlere sıkıştırılır (continuous aggregates).
• **PostgreSQL**: Hasta kayıtları, klinik ekip, bakım planları ve uyarı geçmişi.
• **S3 Uyumlu Nesne Depolama**: Ham sensör dökümlerinin uzun süreli arşivi ve model yeniden eğitim veri seti.`,
            security: `Sürekli sensör verisi, tıbbi kayıttan daha fazla yaşam örüntüsü açığa çıkarır; bu yüzden gizlilik tasarımın merkezindedir.

### 1. Güvenlik Önlemleri & Standartlar:
• **Cihaz Üzerinde Ön İşleme**: Ham ses ve konum verisi cihazdan hiç çıkmaz; yalnızca türetilmiş, geri döndürülemez öznitelikler (örneğin konuşma temposu göstergesi) sunucuya gönderilir.
• **Uçtan Uca Şifreleme**: Cihaz-sunucu arası TLS 1.3 ve sertifika sabitleme (certificate pinning); durağan veride AES-256.
• **Açık Rıza Yönetimi**: Hasta hangi sinyal türünün toplanacağını ayrı ayrı açıp kapatabilir; rıza geri çekildiğinde ilgili veri kalıcı olarak silinir ve bu silme işlemi denetlenebilir şekilde kaydedilir.
• **Erişim Kontrolü**: Klinik personeli yalnızca kendisine atanmış bakım kapsamındaki hastaları görebilir; kapsam dışı erişim denemesi hem engellenir hem de uyarı üretir.
• **Veri Saklama Politikası**: Ham yüksek frekanslı veri tanımlı bir süre sonra otomatik olarak özetlere indirgenir; süresiz ham veri birikimi engellenir.`
        }
    },
    {
        id: "chainproof-audit",
        title: "ChainProof",
        tagline: "Akıllı Sözleşmeler İçin Sürekli Formal Doğrulama ve Değişim Bazlı Denetim",
        category: "Web3, Blockchain & Güvenlik",
        categoryKey: "web3",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "9 Hafta",
            monetization: "Protokol Aboneliği + Denetim Raporu Başına Ücret",
            opportunityScore: "%94 Fırsat Skoru"
        },
        diagramNodes: [
            { id: 1, name: "Git Reposu / CI", type: "source", sub: "Solidity & Vyper Kaynağı" },
            { id: 2, name: "Diff Analyzer", type: "service", sub: "Semantik Değişim Tespiti" },
            { id: 3, name: "Symbolic Execution", type: "ai", sub: "Yol Keşfi + SMT Çözücü" },
            { id: 4, name: "Invariant Fuzzer", type: "ai", sub: "Özellik Tabanlı Test Üretimi" },
            { id: 5, name: "PostgreSQL & IPFS", type: "storage", sub: "Bulgu Geçmişi + Rapor Kanıtı" },
            { id: 6, name: "Denetim Portalı", type: "client", sub: "PR Yorumu + Rapor" }
        ],
        step1: {
            marketGap: `Akıllı sözleşme denetimi bugün hâlâ **tek seferlik ve el emeğine dayalı** bir hizmet: protokol lansmandan önce yüksek bedelli bir denetim satın alır, rapor alır, sonra kodu değiştirmeye devam eder. Lansman sonrası yapılan her yükseltme denetim kapsamının dışında kalır ve büyük kayıplarla sonuçlanan açıkların önemli bir kısmı tam da bu **denetim sonrası değişikliklerde** ortaya çıkar. Mevcut otomatik araçlar ise ya yüzeysel örüntü taraması yapıp yanlış pozitif yağmuru üretiyor ya da formal doğrulama sunarken protokol ekibinden matematiksel spesifikasyon yazmasını bekliyor — çoğu ekipte bunu yapacak uzmanlık yok. ChainProof, denetimi bir olay olmaktan çıkarıp CI hattına yerleştirir: her pull request'te yalnızca **değişen davranışı** analiz eder, ekibin doğal dilde tanımladığı değişmezleri (invariant) çalıştırılabilir özelliklere çevirir ve bulguları doğrudan PR'a yorum olarak düşer.`,
            description: `ChainProof, akıllı sözleşme güvenliğini sürekli entegrasyonun bir parçası haline getiren otomatik denetim ajanıdır.

**Temel İşlevler & Özellikler:**
• **Değişim Bazlı Analiz**: Tüm kod tabanını her seferinde baştan taramak yerine, değişen fonksiyonların çağrı grafiğinde eriştiği yüzeyi hesaplar ve analizi oraya yoğunlaştırır. Bu, doğrulama süresini dakikalar seviyesine indirir.
• **Doğal Dilden Değişmez Üretimi**: "Havuzun toplam bakiyesi kullanıcı bakiyeleri toplamından küçük olamaz" gibi bir cümleyi çalıştırılabilir bir özellik testine dönüştürür.
• **Sembolik Yürütme + Fuzzing**: SMT çözücü ile ulaşılabilir hata yollarını kanıtlar; kanıtlanamayan alanlarda özellik tabanlı fuzzing devreye girer.
• **Yanlış Pozitif Bastırma**: Ekip bir bulguyu gerekçesiyle kapattığında, aynı örüntü sonraki çalışmalarda otomatik olarak bastırılır; araç zamanla o protokolün kabul ettiği riskleri öğrenir.
• **Kanıtlanabilir Rapor**: Her denetim çalışması, kod hash'i ve bulgu setiyle birlikte IPFS'e sabitlenir; üçüncü taraflar raporun hangi tam koda ait olduğunu doğrulayabilir.`,
            tags: ["Rust", "Solidity", "Z3 SMT", "Symbolic Execution", "TypeScript", "IPFS"]
        },
        step2: {
            architecture: `ChainProof, hesaplama açısından pahalı bir işi (formal doğrulama) CI hattının kabul edebileceği süreye sığdırmak üzere **artımlı (incremental)** çalışacak şekilde kurgulanmıştır.

### 1. Sistem Katmanları:
• **Diff Analyzer (Rust)**: Solidity/Vyper kaynağını AST'ye çevirir, iki sürüm arasındaki semantik farkı çıkarır ve etkilenen çağrı grafiği yüzeyini belirler. Yalnızca yorum satırı değişen bir PR hiç analiz tetiklemez.
• **Verification Engine (Rust + Z3)**: Sembolik yürütme ile yol koşullarını toplar ve SMT çözücüye devreder. Zaman aşımına uğrayan yollar kaybedilmez, fuzzing katmanına aktarılır.
• **Invariant Fuzzer (Rust)**: Özellik tabanlı test üretimi; çözücünün kanıtlayamadığı alanı rastgele ama yönlendirilmiş girdilerle tarar.
• **Orchestrator (Go)**: İş kuyruğu, paralel çalıştırma ve kaynak sınırlaması. Denetim işleri birbirinden tamamen izole konteynerlerde koşar.
• **Portal (Next.js)**: Bulgu yönetimi, rapor görüntüleme ve GitHub PR entegrasyonu.

### 2. Veritabanı Mimarisi:
• **PostgreSQL**: Protokoller, denetim çalışmaları, bulgular ve bastırma kuralları.
• **Redis**: İş kuyruğu ve aynı commit için tekrar eden analizlerin sonuç önbelleği.
• **IPFS**: Değiştirilemez rapor kanıtları; rapor içeriği zincir üstünde referanslanabilir.`,
            security: `Analiz edilen kaynak kod çoğu zaman henüz yayınlanmamıştır; sızması protokol için doğrudan bir tehdittir.

### 1. Güvenlik Önlemleri & Standartlar:
• **Kiracı İzolasyonu (Tenant Isolation)**: Her denetim işi ağ erişimi kapalı, salt okunur kök dosya sistemine sahip tek kullanımlık bir konteynerde çalışır ve iş bitiminde imha edilir. Bir müşterinin kodu başka bir işin belleğine hiçbir koşulda erişemez.
• **Kaynak Kodu Saklamama Seçeneği**: Kurumsal planda kaynak kod hiç depolanmaz; yalnızca hash'i, bulgu özeti ve satır referansları saklanır.
• **Tedarik Zinciri Güvenliği**: Analiz motorunun tüm bağımlılıkları sabitlenir (pinned) ve derleme yeniden üretilebilirdir (reproducible build); denetim aracının kendisinin ele geçirilmesi en kritik risk olduğu için bu zorunludur.
• **Erişim Kontrolü**: Depo bazlı RBAC; GitHub App izinleri minimum yetki ilkesiyle istenir, kuruluş genelinde geniş yetki talep edilmez.
• **Bulgu Gizliliği**: Kapatılmamış kritik bulgular varsayılan olarak yalnızca protokol ekibine görünür; kamuya açık rapor ancak ekip onayıyla yayınlanır.`
        }
    },
    {
        id: "keyward-mpc",
        title: "KeyWard",
        tagline: "Kurumsal Dijital Varlık Saklama İçin MPC Tabanlı Politika ve İmza Motoru",
        category: "Web3, Blockchain & Güvenlik",
        categoryKey: "web3",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "10 Hafta",
            monetization: "Saklanan Varlık Hacmine Göre Kademeli Kurumsal Lisans",
            opportunityScore: "%90 Fırsat Skoru"
        },
        diagramNodes: [
            { id: 1, name: "Kurumsal İstemci", type: "source", sub: "Hazine / Finans Ekibi" },
            { id: 2, name: "Policy Engine", type: "service", sub: "Kural Değerlendirme + Onay Akışı" },
            { id: 3, name: "MPC Signing Cluster", type: "service", sub: "Eşik İmza (TSS) Düğümleri" },
            { id: 4, name: "Risk Screener", type: "ai", sub: "Adres Reputasyonu + Anomali" },
            { id: 5, name: "HSM & PostgreSQL", type: "storage", sub: "Pay Depolama + Denetim İzi" },
            { id: 6, name: "Yönetim Konsolu", type: "client", sub: "Onay & Raporlama" }
        ],
        step1: {
            marketGap: `Kurumların dijital varlık saklamada bugün iki seçeneği var ve ikisi de eksik. Birincisi, tek bir özel anahtarı donanım cüzdanında tutmak: bu, anahtarı elinde tutan kişiyi tek başına şirketin tüm hazinesini hareket ettirebilen bir noktaya dönüştürür ve hiçbir kurumsal iç kontrol çerçevesiyle bağdaşmaz. İkincisi, üçüncü taraf bir saklama şirketine devretmek: bu kez varlığın kontrolü tamamen dışarıdadır ve karşı taraf riski doğar. Aradaki boşlukta, **anahtarın hiçbir zaman tek parça halinde var olmadığı** ama kontrolün de şirkette kaldığı bir çözüm eksik. Ayrıca mevcut çözümlerin neredeyse hiçbiri, finans departmanlarının doğal çalışma biçimi olan **çok kademeli onay akışlarını** — tutar eşiği, harcama limiti, beyaz liste, görevler ayrılığı — imza katmanının kendisine gömmüyor. KeyWard, eşik imza (threshold signature) ile politika motorunu tek bir üründe birleştirir: kural sağlanmadan imza matematiksel olarak üretilemez.`,
            description: `KeyWard, kurumsal hazine ekipleri için politika güdümlü bir dijital varlık saklama ve imzalama platformudur.

**Temel İşlevler & Özellikler:**
• **Tek Parça Anahtar Yok**: Özel anahtar hiçbir aşamada bütün halinde oluşturulmaz; imza, birbirinden bağımsız düğümlerin paylarıyla eşik imza protokolü üzerinden üretilir.
• **Politika Motoru**: Tutar eşiğine göre değişen onay sayısı, günlük harcama limiti, adres beyaz listesi, saat kısıtı ve görevler ayrılığı kuralları imza öncesinde zorunlu olarak değerlendirilir.
• **İşlem Öncesi Risk Taraması**: Hedef adresin yaptırım listesi, karıştırıcı (mixer) geçmişi ve reputasyon skoru imzadan önce kontrol edilir; riskli hedefler ek onay gerektirir.
• **İnsan Okunur İşlem Özeti**: İmzalayanlara ham calldata yerine "şu sözleşmede şu kadar token'ı şu adrese aktarıyorsunuz" biçiminde çözümlenmiş bir özet gösterilir; kör imzalama önlenir.
• **Denetim ve Raporlama**: Her işlemin kim tarafından talep edildiği, hangi kurallardan geçtiği ve kimlerin onayladığı, mali denetime doğrudan sunulabilecek biçimde raporlanır.`,
            tags: ["Rust", "Threshold Signatures", "Go", "PostgreSQL", "HSM", "React"]
        },
        step2: {
            architecture: `KeyWard'ın mimarisi tek bir varsayım üzerine kuruludur: **hiçbir tekil bileşen, tek başına geçerli bir imza üretebilecek bilgiye sahip olmamalıdır.**

### 1. Sistem Katmanları:
• **Policy Engine (Go)**: İşlem talebini kural setine karşı değerlendirir. Kurallar bildirimsel (declarative) tanımlanır ve her değerlendirme kararı gerekçesiyle birlikte kaydedilir. Kural geçmeden imza kümesine talep iletilmez.
• **MPC Signing Cluster (Rust)**: Coğrafi ve ağ olarak ayrılmış en az üç düğüm; her biri anahtarın yalnızca bir payını tutar. İmza, düğümler arası protokol turlarıyla üretilir ve hiçbir turda paylar birleştirilmez.
• **Risk Screener (Python)**: Adres reputasyonu, yaptırım listesi eşleşmesi ve davranışsal anomali skoru üretir.
• **Core API (Go)**: Talep yaşam döngüsü, onay akışı ve bildirimler.
• **Yönetim Konsolu (React)**: Politika tanımlama, onay arayüzü ve raporlar.

### 2. Veritabanı Mimarisi:
• **PostgreSQL**: İşlem talepleri, politika tanımları, onay kayıtları ve kullanıcı yönetimi. Onay kayıtları yalnızca eklenebilir (append-only) tablolarda tutulur.
• **HSM (Hardware Security Module)**: Her düğümün anahtar payı ve düğüm kimlik sertifikaları donanım modülünden çıkmaz.
• **Redis**: Onay bekleyen taleplerin canlı durumu ve bildirim kuyruğu.`,
            security: `Bu ürünün tehdit modeli, kendi operatörünü de saldırgan olarak varsayar.

### 1. Güvenlik Önlemleri & Standartlar:
• **Eşik İmza (TSS)**: Anahtar hiçbir zaman tek bir bellek adresinde bütünleşmez. Bir düğümün tamamen ele geçirilmesi, saldırgana imza üretme yeteneği kazandırmaz.
• **Görevler Ayrılığı**: İşlemi talep eden, onaylayan ve politika kuralını değiştiren roller birbirinden ayrılmıştır; politika değişikliğinin kendisi de çok imzalı onaya tabidir.
• **Düğüm Çeşitliliği**: İmza düğümleri farklı bulut sağlayıcılarda ve farklı ağ bölgelerinde çalışır; tek bir sağlayıcının ihlali eşiği karşılamaya yetmez.
• **Değiştirilemez Denetim İzi**: Tüm talep, onay ve red kayıtları hash zinciriyle birbirine bağlanır; geçmişe dönük bir kaydın sessizce değiştirilmesi tespit edilebilir.
• **Anahtar Payı Yenileme (Proactive Refresh)**: Paylar periyodik olarak, temel anahtar değişmeden yenilenir. Böylece uzun süreye yayılmış kademeli bir sızıntıda saldırganın topladığı eski paylar geçersizleşir.
• **Kurtarma Prosedürü**: Düğüm kaybına karşı çevrimdışı saklanan, coğrafi olarak dağıtılmış kurtarma payları; kurtarma işlemi de çok taraflı onaya bağlıdır.`
        }
    },
    {
        id: "finops-copilot",
        title: "FinOps Copilot",
        tagline: "Kubernetes Maliyet Anomalisi Tespiti ve Otomatik Kaynak Boyutlandırma Ajanı",
        category: "Altyapı, Cloud & Performans",
        categoryKey: "infrastructure",
        meta: {
            difficulty: "Orta Düzey",
            mvpTime: "6 Hafta",
            monetization: "Yönetilen Cluster Sayısına Göre SaaS + Tasarruf Payı",
            opportunityScore: "%92 Fırsat Skoru"
        },
        diagramNodes: [
            { id: 1, name: "Cluster Metrikleri", type: "source", sub: "Prometheus + Cloud Billing" },
            { id: 2, name: "Cost Allocation Engine", type: "service", sub: "Pod Bazlı Maliyet Dağıtımı" },
            { id: 3, name: "Anomaly Detector", type: "ai", sub: "Mevsimsel Zaman Serisi" },
            { id: 4, name: "Rightsizing Advisor", type: "ai", sub: "Yüzdelik Bazlı Öneri" },
            { id: 5, name: "VictoriaMetrics & Postgres", type: "storage", sub: "Metrik + Öneri Geçmişi" },
            { id: 6, name: "GitOps PR Botu", type: "client", sub: "Otomatik Manifest Önerisi" }
        ],
        step1: {
            marketGap: `Kubernetes'te bulut faturasının büyük bir kısmı hiç kullanılmayan kaynağa gidiyor: ekipler pod'lara "her ihtimale karşı" fazla CPU ve bellek talebi (request) yazıyor, kimse geri dönüp düzeltmiyor. Mevcut bulut maliyet araçları ise sorunu **fatura seviyesinde** gösteriyor — "geçen ay hesaplama gideriniz arttı" der, ama hangi ekibin hangi deployment'ının hangi commit'ten sonra şiştiğini söylemez. Mühendis için eyleme dönüştürülemeyen bu bilgi, çoğu organizasyonda üç ayda bir yapılan manuel bir temizlik seansına dönüşüyor ve arada maliyet yeniden birikiyor. Ayrıca bu araçların neredeyse tamamı **öneriyle bitiyor**; öneriyi manifest dosyasına uygulamak yine insana kalıyor. FinOps Copilot, maliyeti pod ve ekip düzeyinde ilişkilendirir, anormal artışı ortaya çıktığı gün yakalar ve düzeltmeyi doğrudan bir GitOps pull request'i olarak açar.`,
            description: `FinOps Copilot, Kubernetes maliyetini görünür kılan ve düzeltmeyi otomatikleştiren bir maliyet mühendisliği ajanıdır.

**Temel İşlevler & Özellikler:**
• **Pod Bazlı Maliyet Dağıtımı**: Bulut faturasını namespace, deployment, ekip ve etiket bazında dağıtarak "bu servis ayda ne kadar tutuyor" sorusuna kesin yanıt verir.
• **Anomali Tespiti**: Haftalık ve günlük mevsimselliği öğrenip, gerçek sıçramayı normal trafik dalgalanmasından ayırır; gece toplu işlerin yarattığı düzenli tepe noktalarını alarma dönüştürmez.
• **Kök Neden İlişkilendirme**: Maliyet sıçramasını o pencerede yapılan deploy'lar, replica değişiklikleri ve HPA olaylarıyla eşleştirir.
• **Otomatik Rightsizing PR'ı**: Gerçek kullanımın yüzdelik dilimlerine bakarak yeni request/limit değerleri hesaplar ve manifest deposuna gerekçeli bir pull request açar.
• **Atıl Kaynak Avcısı**: Bağlantısız kalmış disk, kullanılmayan yük dengeleyici ve hiç trafik almayan deployment'ları listeler.`,
            tags: ["Go", "Kubernetes", "Prometheus", "Python", "GitOps", "React"]
        },
        step2: {
            architecture: `FinOps Copilot, cluster içine minimum ayak iziyle kurulan bir toplayıcı ve dışarıda çalışan bir analiz düzleminden oluşur.

### 1. Sistem Katmanları:
• **Metrics Collector (Go, in-cluster)**: Prometheus'tan pod kaynak kullanımını, Kubernetes API'den ise sahiplik ilişkilerini (deployment, namespace, etiket) toplar. Yalnızca toplu metrik gönderir; uygulama verisine hiç dokunmaz.
• **Cost Allocation Engine (Go)**: Bulut sağlayıcı fatura kalemlerini düğüm ve pod kullanımına orantılayarak dağıtır. Spot/on-demand ayrımı ve rezerve kapasite indirimleri hesaba katılır.
• **Anomaly Detector (Python)**: Mevsimsel ayrıştırma ile beklenen bandı üretir; bandın dışına çıkan noktaları önem derecesine göre sıralar.
• **Rightsizing Advisor (Python)**: Kullanımın yüksek yüzdelik dilimlerine güvenlik payı ekleyerek öneri üretir; OOMKill geçmişi olan iş yüklerinde daha muhafazakâr davranır.
• **GitOps Bot (Go)**: Manifest deposunda dal açar, değişikliği ve tasarruf tahminini içeren PR gönderir.

### 2. Veritabanı Mimarisi:
• **VictoriaMetrics**: Uzun vadeli metrik saklama; Prometheus'un yerel saklama süresinin ötesine geçmek için gereklidir.
• **PostgreSQL**: Maliyet dağıtım sonuçları, anomali kayıtları, öneri geçmişi ve uygulanan değişikliklerin etkisi.
• **Redis**: Panel sorguları için önbellek.`,
            security: `Ajan, müşteri cluster'ının içinde çalışır; bu yüzden yetki sınırları ürünün en kritik tasarım kararıdır.

### 1. Güvenlik Önlemleri & Standartlar:
• **Salt Okunur Cluster Erişimi**: Toplayıcının ServiceAccount'u yalnızca metrik ve nesne meta verisi okuma yetkisine sahiptir; Secret kaynaklarına erişimi RBAC düzeyinde tamamen kapalıdır ve hiçbir koşulda yazma yetkisi istemez.
• **Değişiklik Yolu İnsan Onaylı**: Ürün cluster'a doğrudan yazmaz; tüm değişiklikler Git üzerinden pull request olarak önerilir ve mevcut kod inceleme sürecinden geçer. Bu, otomasyonun üretimi tek başına bozmasını yapısal olarak imkânsız kılar.
• **Veri Minimizasyonu**: Dışarı çıkan veri toplu kaynak metrikleri ve nesne adlarıyla sınırlıdır; ortam değişkenleri, log içerikleri ve uygulama verisi hiçbir zaman toplanmaz.
• **Giden Bağlantı Kontrolü**: Toplayıcı yalnızca tek bir sabit uç noktaya giden TLS bağlantısı kurar; bu, ağ politikasıyla (NetworkPolicy) kısıtlanabilir ve müşteri tarafından doğrulanabilir.
• **Çok Kiracılı İzolasyon**: Analiz düzleminde her cluster ayrı bir kiracı kimliğiyle etiketlenir; sorgu katmanında kiracı filtresi zorunludur ve satır düzeyi güvenlik (RLS) ile veritabanında da uygulanır.`
        }
    },
    {
        id: "edgemesh-inference",
        title: "EdgeMesh",
        tagline: "Coğrafi Dağıtık Yapay Zeka Çıkarımı İçin Gecikme ve Maliyet Farkında Yönlendirici",
        category: "Altyapı, Cloud & Performans",
        categoryKey: "infrastructure",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "8 Hafta",
            monetization: "İşlenen İstek Başına Kullanım Bazlı + Kurumsal Plan",
            opportunityScore: "%89 Fırsat Skoru"
        },
        diagramNodes: [
            { id: 1, name: "İstemci İstekleri", type: "source", sub: "Global Uygulama Trafiği" },
            { id: 2, name: "Edge Router", type: "service", sub: "Anycast + Rust Proxy" },
            { id: 3, name: "Routing Policy Brain", type: "ai", sub: "Gecikme/Maliyet Optimizasyonu" },
            { id: 4, name: "Model Runtime Pool", type: "ai", sub: "GPU / CPU Havuzları" },
            { id: 5, name: "Semantic Cache", type: "storage", sub: "Vektör Benzerlik Önbelleği" },
            { id: 6, name: "Gözlemlenebilirlik Paneli", type: "client", sub: "Maliyet & Gecikme İzleme" }
        ],
        step1: {
            marketGap: `Yapay zeka özelliği ekleyen ekipler hızla aynı duvara çarpıyor: model çıkarımı hem pahalı hem de coğrafi olarak yavaş. Tek bir bölgede barındırılan bir model, uzaktaki kullanıcıya yüzlerce milisaniye ağ gecikmesi ekliyor; her isteği en güçlü ve en pahalı modele göndermek ise faturayı hızla sürdürülemez hale getiriyor. Bugün bu sorunu çözmek için ekipler kendi elleriyle yönlendirme mantığı yazıyor — hangi isteğin küçük modele, hangisinin büyük modele gideceğini kodun içine gömüyorlar — ve bu mantık her model değişiminde bozuluyor. Piyasadaki API ağ geçitleri ise trafiği taşımayı biliyor ama **isteğin içeriğine göre karar vermiyor**. EdgeMesh, çıkarım trafiğini isteğin karmaşıklığına, kullanıcının coğrafi konumuna, anlık kuyruk derinliğine ve tanımlanan maliyet bütçesine göre yönlendiren bir katman sunar; uygulama kodu tek bir uç noktayı çağırmaya devam eder.`,
            description: `EdgeMesh, yapay zeka çıkarım trafiğini yöneten, coğrafi olarak dağıtık bir yönlendirme ve önbellekleme katmanıdır.

**Temel İşlevler & Özellikler:**
• **İçerik Farkında Yönlendirme**: İsteğin karmaşıklığını hızlıca sınıflandırır; basit istekleri küçük ve ucuz modele, karmaşık olanları güçlü modele yönlendirir. Kalite eşiği altına düşen yanıtlar otomatik olarak üst modele yükseltilir.
• **Anlamsal Önbellek**: Birebir aynı olmayan ama anlamca eşdeğer istekleri vektör benzerliğiyle yakalar; tekrarlayan sorularda çıkarım maliyeti tamamen ortadan kalkar.
• **Coğrafi Yakınlık**: Anycast ile isteği en yakın kenar düğümüne çeker, model çalışma zamanını kullanıcıya en yakın uygun havuzda seçer.
• **Bütçe Koruması**: Takım veya müşteri bazında harcama tavanı tanımlanır; tavana yaklaşıldığında trafik otomatik olarak daha ucuz modele kaydırılır, kesinti yaşanmaz.
• **Sağlayıcı Bağımsızlığı**: Birden fazla model sağlayıcısını aynı arayüz altında birleştirir; biri kesintiye girdiğinde trafik saniyeler içinde diğerine devredilir.`,
            tags: ["Rust", "Go", "Anycast", "Vector Search", "Kubernetes", "OpenTelemetry"]
        },
        step2: {
            architecture: `EdgeMesh, veri düzlemi (data plane) ve kontrol düzlemi (control plane) ayrımı üzerine kuruludur; yönlendirme kararı hızlı yolda asla ağ üzerinden sorgu gerektirmez.

### 1. Sistem Katmanları:
• **Edge Router (Rust)**: Her kenar bölgesinde çalışan düşük gecikmeli proxy. Yönlendirme politikasının derlenmiş bir kopyasını bellekte tutar; karar mikrosaniyeler içinde yerel olarak verilir.
• **Routing Policy Brain (Go, kontrol düzlemi)**: Gecikme telemetrisi, kuyruk derinliği, hata oranı ve birim maliyeti değerlendirerek politikayı sürekli günceller ve kenar düğümlerine dağıtır. Kontrol düzlemi tamamen çökse bile kenar düğümleri son bilinen politikayla çalışmaya devam eder.
• **Semantic Cache (Rust + vektör indeksi)**: İstek gömülemelerini (embedding) yerel indekste arar; eşik üstü benzerlikte önbellekten yanıtlar.
• **Model Runtime Pool**: GPU ve CPU havuzları; otomatik ölçeklenir, soğuk başlatma maliyetini azaltmak için sıcak yedek bulundurur.
• **Observability (OpenTelemetry)**: İstek başına gecikme dağılımı, model seçimi ve maliyet izleri.

### 2. Veritabanı Mimarisi:
• **Vektör İndeksi (kenar yerel)**: Anlamsal önbellek; bölge bazlı, çünkü önbellek isabetinin de yakın olması gerekir.
• **ClickHouse**: Yüksek hacimli istek telemetrisi ve maliyet analitiği.
• **PostgreSQL**: Kiracılar, politika tanımları, bütçeler ve API anahtarları.
• **Redis**: Hız sınırlama sayaçları ve kısa ömürlü oturum durumu.`,
            security: `Çıkarım trafiği çoğu zaman kullanıcıların en hassas girdilerini taşır; bu katman bir yan kanal haline gelmemelidir.

### 1. Güvenlik Önlemleri & Standartlar:
• **İstek İçeriği Saklamama**: Varsayılan yapılandırmada istek ve yanıt gövdeleri hiçbir yere yazılmaz; telemetride yalnızca boyut, gecikme ve model seçimi gibi meta veriler tutulur.
• **Anlamsal Önbellekte Kiracı İzolasyonu**: Önbellek anahtarı kiracı kimliğini içerir. Bir kiracının isteği başka bir kiracının önbelleğinden asla yanıtlanamaz — çok kiracılı anlamsal önbelleklerin en tehlikeli hatası budur.
• **Uçtan Uca Şifreleme**: İstemci-kenar arası TLS 1.3; kenar-çalışma zamanı arası mTLS ile karşılıklı kimlik doğrulama.
• **API Anahtarı Yönetimi**: Anahtarlar yalnızca hash'lenmiş olarak saklanır, kapsam (scope) ve son kullanma tarihi taşır; sızıntı durumunda tek tek iptal edilebilir.
• **Hız Sınırlama ve Kötüye Kullanım Koruması**: Kiracı ve IP bazlı çok katmanlı hız sınırlama; ani maliyet patlaması yaratan örüntüler otomatik olarak yavaşlatılır.
• **Bölgesel Veri Yerleşimi**: Kiracı, isteklerinin belirli coğrafi bölgelerin dışına çıkmamasını zorunlu kılabilir; yönlendirici bu kısıtı politika düzeyinde uygular.`
        }
    },
    {
        id: "skillforge-path",
        title: "SkillForge",
        tagline: "Gerçek İş İlanı Sinyallerinden Yetenek Açığı Haritası ve Kişisel Öğrenme Rotası",
        category: "Eğitim Teknolojileri & Yapay Zeka",
        categoryKey: "edtech",
        meta: {
            difficulty: "Orta Düzey",
            mvpTime: "5 Hafta",
            monetization: "Bireysel Abonelik + Üniversite & Kurum Lisansı",
            opportunityScore: "%90 Fırsat Skoru"
        },
        diagramNodes: [
            { id: 1, name: "İş İlanı Kaynakları", type: "source", sub: "Kariyer Siteleri + Şirket Sayfaları" },
            { id: 2, name: "Skill Extraction", type: "service", sub: "NER + Taksonomi Eşleme" },
            { id: 3, name: "Gap Analysis Engine", type: "ai", sub: "Profil-Talep Farkı" },
            { id: 4, name: "Path Generator", type: "ai", sub: "Ön Koşul Grafiği Sıralaması" },
            { id: 5, name: "PostgreSQL & pgvector", type: "storage", sub: "Beceri Grafiği + Gömülemeler" },
            { id: 6, name: "Öğrenci Portalı", type: "client", sub: "Rota + İlerleme Takibi" }
        ],
        step1: {
            marketGap: `Çevrimiçi eğitim platformları içerik konusunda doymuş durumda; eksik olan içerik değil, **yön**. Kariyer değiştirmek isteyen biri yüzlerce kursla karşılaşıyor ama hangisinin gerçekten iş bulmaya yaradığını bilmiyor. Mevcut "kariyer yolu" ürünleri ise bu rotaları editörlerin elle hazırladığı statik listeler olarak sunuyor: piyasa altı ayda değiştiğinde liste olduğu yerde kalıyor ve öğrenci artık talep görmeyen bir araç setini öğrenmeye devam ediyor. Üstelik bu rotalar herkese aynı başlangıç noktasını varsayıyor — hâlihazırda benzer bir alandan gelen birine sıfırdan başlatan bir müfredat sunuluyor. SkillForge, rotayı editörden değil **canlı iş ilanı verisinden** türetir: belirli bir şehir ve rol için hangi becerilerin gerçekten arandığını, hangilerinin yükselişte olduğunu ölçer, kullanıcının mevcut profiliyle arasındaki farkı çıkarır ve yalnızca o farkı kapatan bir sıra üretir.`,
            description: `SkillForge, iş piyasası verisini kişiselleştirilmiş bir öğrenme rotasına çeviren bir kariyer yönlendirme platformudur.

**Temel İşlevler & Özellikler:**
• **Canlı Yetenek Talebi Haritası**: İş ilanlarından beceri çıkarımı yaparak rol, şehir ve sektör bazında hangi becerilerin arandığını ve trendin yönünü gösterir.
• **Kişisel Fark Analizi**: Kullanıcının özgeçmişi veya beceri beyanı ile hedef rolün talebi arasındaki farkı çıkarır; zaten bilinen konular rotadan çıkarılır.
• **Ön Koşul Farkındalığı**: Beceriler arasındaki bağımlılık grafiğini kullanarak öğrenme sırasını mantıklı hale getirir; temel bir konu atlanarak ileri seviye bir konuya geçilmez.
• **Kanıt Odaklı Proje Önerisi**: Her adımda, o beceriyi işverene gösterebilecek somut bir portföy projesi önerir; sertifika yerine çıktı vurgulanır.
• **Ücret ve Rekabet Göstergesi**: Her beceri için ilanlardaki ücret aralığı ve o beceriye sahip aday yoğunluğu gösterilir; kullanıcı çabasını nereye yatıracağına veriyle karar verir.`,
            tags: ["Python", "spaCy NER", "PostgreSQL", "pgvector", "Next.js", "FastAPI"]
        },
        step2: {
            architecture: `SkillForge'un temel zorluğu veri toplama değil, **serbest metinden tutarlı bir beceri taksonomisi çıkarmaktır**; mimari bu normalleştirme sorununun etrafında kuruludur.

### 1. Sistem Katmanları:
• **Ingestion Workers (Python)**: İlan kaynaklarını nazik hız sınırlarıyla toplar; robots.txt ve kaynak kullanım koşullarına uyar, mümkün olan yerlerde resmi API kullanır.
• **Skill Extraction (Python + spaCy)**: Adlandırılmış varlık tanıma ile ilan metninden beceri ifadelerini çıkarır; ardından eş anlamlıları tek bir kanonik beceri düğümüne eşler. "JS", "JavaScript" ve "ES6" aynı düğüme gider — bu adım olmadan tüm istatistikler anlamsızdır.
• **Gap Analysis Engine (Python)**: Kullanıcı profili ile hedef rolün beceri vektörü arasındaki farkı hesaplar; pgvector üzerinde benzerlik sorgusu kullanır.
• **Path Generator (Python)**: Ön koşul grafiği üzerinde topolojik sıralama yaparak öğrenme adımlarını dizer; kullanıcının haftalık ayırabileceği süreye göre rotayı ölçekler.
• **Portal (Next.js)**: Rota görünümü, ilerleme takibi ve piyasa panosu.

### 2. Veritabanı Mimarisi:
• **PostgreSQL**: Kanonik beceri taksonomisi, ön koşul kenarları, ilan özetleri ve kullanıcı profilleri.
• **pgvector**: Beceri ve rol gömülemeleri; benzerlik aramaları ayrı bir vektör veritabanı gerektirmeyecek ölçekte olduğu için aynı veritabanında tutulur.
• **Redis**: Piyasa panosu sorguları için önbellek; bu veriler dakika değil gün ölçeğinde değişir.`,
            security: `Sistem özgeçmiş verisi işler; bu veri hem kişiseldir hem de kötü kullanıldığında ayrımcılığa yol açabilir.

### 1. Güvenlik Önlemleri & Standartlar:
• **Özgeçmiş Verisinin Ayrıştırılması**: Yüklenen özgeçmişten yalnızca beceri ve deneyim süresi çıkarılır; ad, iletişim bilgisi, doğum tarihi ve fotoğraf ayrıştırma sonrası kalıcı olarak silinir.
• **İşveren Tarafına Kimlik Sızdırmama**: Kurumsal panolarda yalnızca toplulaştırılmış istatistikler gösterilir; bir kurum kendi çalışanlarının bireysel rota ilerlemesini göremez. Bu, ürünün kullanıcı güvenini koruyan sınırıdır.
• **Kimlik Doğrulama**: OAuth2 ile oturum, oturum jetonlarında kısa ömür ve yenileme jetonu rotasyonu; parola saklanan hesaplarda Argon2id.
• **Veri Taşınabilirliği ve Silme**: Kullanıcı tüm verisini dışa aktarabilir ve tek işlemle kalıcı silme talep edebilir; silme, türetilmiş gömülemeleri de kapsar.
• **Kaynak Toplama Etiği**: Yalnızca kamuya açık ilanlar toplanır; kişisel profil sayfaları ve aday verisi hiçbir koşulda toplanmaz.`
        }
    },
    {
        id: "labsim-xr",
        title: "LabSim XR",
        tagline: "Mesleki ve Teknik Eğitim İçin Tarayıcı Tabanlı Simülasyon Laboratuvarı",
        category: "Eğitim Teknolojileri & Yapay Zeka",
        categoryKey: "edtech",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "9 Hafta",
            monetization: "Okul & Meslek Kuruluşu Lisansı (Öğrenci Başı Yıllık)",
            opportunityScore: "%88 Fırsat Skoru"
        },
        diagramNodes: [
            { id: 1, name: "Senaryo Tanımı", type: "source", sub: "Eğitmen Tarafından Yazılan Görev" },
            { id: 2, name: "Simulation Engine", type: "service", sub: "WebGPU + Fizik Çözücü" },
            { id: 3, name: "Performance Assessor", type: "ai", sub: "Adım Doğruluğu + Güvenlik İhlali" },
            { id: 4, name: "Adaptive Coach", type: "ai", sub: "Kademeli İpucu Üretimi" },
            { id: 5, name: "PostgreSQL & S3", type: "storage", sub: "Oturum Kaydı + Varlıklar" },
            { id: 6, name: "Eğitmen Panosu", type: "client", sub: "Sınıf İlerleme Görünümü" }
        ],
        step1: {
            marketGap: `Elektrik tesisatı, CNC işleme, laboratuvar tekniği ve endüstriyel bakım gibi alanlarda öğrenmenin pratikte gerçekleşmesi gerekir; ancak fiziksel atölye kurmak pahalı, tehlikeli ve ölçeklenemez. Bir okulda genellikle tek bir cihaz vardır ve otuz öğrenci sırayla birkaç dakika deneyebilir. Mevcut dijital alternatifler ise iki uçta: bir yanda öğrencinin izlediği ama dokunmadığı videolar, diğer yanda pahalı VR başlıkları gerektiren, kurulumu okulların çoğu için erişilemez simülasyonlar. Ayrıca bu simülasyonların neredeyse tamamı **değerlendirme yapmaz** — öğrenci senaryoyu tamamlar, ama hangi adımda hata yaptığı, hangi güvenlik kuralını ihlal ettiği ölçülmez, dolayısıyla eğitmen için not verilebilir bir çıktı üretmez. LabSim XR, donanım gerektirmeden tarayıcıda çalışan, her etkileşimi adım adım değerlendiren ve eğitmene sınıf düzeyinde ilerleme raporu veren bir simülasyon laboratuvarı sunar.`,
            description: `LabSim XR, mesleki eğitimde pratik beceriyi tarayıcı üzerinden ölçülebilir hale getiren bir simülasyon platformudur.

**Temel İşlevler & Özellikler:**
• **Donanımsız Erişim**: WebGPU ile tarayıcıda çalışır; VR başlığı isteğe bağlıdır, okul bilgisayarı veya tablet yeterlidir.
• **Adım Bazlı Değerlendirme**: Öğrencinin yaptığı her işlem sıra, doğruluk ve güvenlik açısından değerlendirilir; "sonuç doğru ama sıra yanlış" durumu ayrı raporlanır.
• **Güvenlik İhlali Kaydı**: Gerçek atölyede kazaya yol açacak davranışlar (enerji kesilmeden müdahale, koruyucu ekipmanın atlanması) simülasyonda işaretlenir ve öğrenciye sonucu gösterilir.
• **Kademeli Koçluk**: Öğrenci takıldığında doğrudan cevap yerine giderek somutlaşan ipuçları verilir; öğrenmeyi kısa devre etmemek için ipucu kullanımı da raporlanır.
• **Eğitmen Panosu**: Sınıfın tamamında hangi adımın en çok hataya yol açtığını gösterir; eğitmen dersini bu veriye göre şekillendirir.`,
            tags: ["TypeScript", "WebGPU", "Rust/WASM", "Three.js", "PostgreSQL", "Node.js"]
        },
        step2: {
            architecture: `Simülasyonun ağır kısmı istemcide çalışır; sunucu ise senaryo dağıtımı, değerlendirme doğrulaması ve raporlamadan sorumludur.

### 1. Sistem Katmanları:
• **Simulation Engine (Rust → WebAssembly)**: Fizik ve devre çözücüsü WASM olarak derlenip tarayıcıda çalışır. Bu, hem gecikmeyi sıfırlar hem de sunucu maliyetini öğrenci sayısından bağımsız kılar.
• **Render Katmanı (TypeScript + WebGPU)**: Sahne çizimi; WebGPU desteklemeyen cihazlarda WebGL'e düşer.
• **Performance Assessor (Node.js, sunucu)**: İstemciden gelen etkileşim günlüğünü senaryonun beklenen adım grafiğine karşı doğrular. Değerlendirme sunucuda yapılır; istemciye güvenilmez.
• **Adaptive Coach (Python)**: Hata örüntüsüne göre ipucu seviyesini belirler.
• **Eğitmen Panosu (Next.js)**: Sınıf yönetimi, senaryo atama ve raporlar.

### 2. Veritabanı Mimarisi:
• **PostgreSQL**: Senaryolar, adım grafikleri, öğrenci oturumları ve değerlendirme sonuçları.
• **S3 Uyumlu Nesne Depolama**: 3B modeller, doku dosyaları ve oturum tekrar kayıtları.
• **Redis**: Canlı sınıf oturumlarında eğitmenin anlık ilerleme görünümü için geçici durum.`,
            security: `Kullanıcıların önemli bir kısmı reşit olmayan öğrencilerdir; bu, gizlilik yükümlülüğünü ağırlaştırır.

### 1. Güvenlik Önlemleri & Standartlar:
• **Sunucu Tarafı Değerlendirme**: Puan ve tamamlama durumu asla istemciden kabul edilmez; istemci yalnızca ham etkileşim günlüğü gönderir, karar sunucuda verilir. Aksi halde not sahtekârlığı tarayıcı konsolundan yapılabilir hale gelir.
• **Reşit Olmayan Kullanıcı Koruması**: Öğrenci hesapları okul kurumu üzerinden sağlanır; doğrudan kayıt, kişisel e-posta toplama ve üçüncü taraf reklam/izleme bileşeni bulunmaz.
• **Veri Minimizasyonu**: Öğrenciden yalnızca kurum tarafından atanan takma ad ve sınıf bilgisi tutulur; kamera, mikrofon veya biyometrik veri hiçbir senaryoda kullanılmaz.
• **Erişim Kontrolü**: Eğitmen yalnızca kendi sınıflarının verisini görür; kurum yöneticisi toplulaştırılmış raporlara erişir, bireysel oturum tekrarlarına erişimi kurum politikasıyla sınırlandırılabilir.
• **İçerik Bütünlüğü**: Senaryo paketleri imzalanır; istemci imzayı doğrulamadan bir senaryoyu yüklemez, böylece değiştirilmiş senaryolarla hatalı eğitim verilmesi engellenir.`
        }
    },
    {
        id: "gridbalance-ai",
        title: "GridBalance",
        tagline: "Yenilenebilir Üretim Tahmini ve Esnek Yük Kaydırma ile Şebeke Dengeleme Ajanı",
        category: "Sürdürülebilirlik & IoT & Blockchain",
        categoryKey: "sustainability",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "8 Hafta",
            monetization: "Tesis Başı Abonelik + Sağlanan Tasarruf Payı",
            opportunityScore: "%93 Fırsat Skoru"
        },
        diagramNodes: [
            { id: 1, name: "Sayaç & Hava Verisi", type: "source", sub: "Modbus + Meteoroloji API" },
            { id: 2, name: "Forecast Service", type: "service", sub: "Üretim & Tüketim Tahmini" },
            { id: 3, name: "Optimization Engine", type: "ai", sub: "Kısıtlı Yük Kaydırma Çözücü" },
            { id: 4, name: "Dispatch Controller", type: "service", sub: "Batarya & Yük Komutları" },
            { id: 5, name: "TimescaleDB", type: "storage", sub: "Enerji Zaman Serisi" },
            { id: 6, name: "Tesis Operatör Paneli", type: "client", sub: "Plan Onayı & İzleme" }
        ],
        step1: {
            marketGap: `Güneş paneli veya rüzgâr türbini kuran sanayi tesisleri kısa sürede beklemedikleri bir sorunla karşılaşıyor: üretim en yüksek olduğu saatte tüketim düşük oluyor, tüketim tepe yaptığında ise üretim yok. Sonuçta öz tüketim oranı düşük kalıyor, elektrik şebekeye ucuza satılıyor ve yatırımın geri dönüşü hesaplananın çok gerisinde kalıyor. Piyasadaki enerji izleme yazılımları bu tabloyu **gösteriyor ama değiştirmiyor**: güzel panolar üretiyor, operatöre "bugün şu kadar ürettiniz" diyor ve orada bitiyor. Asıl değer ise esnek yükleri — soğutma, kompresör, şarj istasyonu, pompalama — üretimin yüksek olduğu saatlere kaydırmakta; ancak bunu elle yapmak imkânsız çünkü karar her gün hava tahminine, tarife saatlerine ve üretim planına göre değişiyor. GridBalance, üretimi ve tüketimi saatlik tahmin eder, tesisin operasyonel kısıtlarını bozmadan optimum yük planını çözer ve komutları doğrudan ekipmana gönderir.`,
            description: `GridBalance, yenilenebilir enerji yatırımının getirisini yük kaydırmayla artıran bir enerji optimizasyon ajanıdır.

**Temel İşlevler & Özellikler:**
• **Saatlik Üretim Tahmini**: Meteoroloji verisi ve panel/türbin geçmiş performansını birleştirerek 48 saatlik üretim eğrisi üretir.
• **Tüketim Tahmini**: Üretim planı, vardiya takvimi ve geçmiş tüketim örüntüsünden tesisin yük eğrisini tahmin eder.
• **Kısıtlı Optimizasyon**: Esnek yükleri kaydırırken üretim sürekliliği, soğuk zincir sıcaklık limiti ve ekipman çalışma süresi gibi kısıtları ihlal etmez; çözüm bulunamazsa neden bulunamadığını açıklar.
• **Batarya Şarj/Deşarj Planı**: Depolama varsa tarife saatleri ve üretim eğrisine göre en verimli şarj-deşarj takvimini üretir.
• **Doğrulanabilir Karbon Raporu**: Sağlanan öz tüketim artışı ve önlenen emisyon, ölçüm verisine dayanan denetlenebilir bir raporla sunulur.`,
            tags: ["Python", "TimescaleDB", "Modbus", "MILP Optimizasyon", "Go", "React"]
        },
        step2: {
            architecture: `Sistem, endüstriyel ortamın iki gerçeğine göre tasarlanmıştır: ağ bağlantısı kopabilir ve yanlış bir komut üretimi durdurabilir.

### 1. Sistem Katmanları:
• **Edge Gateway (Go, tesis içi)**: Sayaç ve PLC'lerden Modbus/OPC-UA ile veri toplar, bulut bağlantısı koptuğunda son onaylı planla çalışmaya devam eder ve veriyi yerel olarak kuyruklar.
• **Forecast Service (Python)**: Üretim ve tüketim için ayrı zaman serisi modelleri; tahmin aralığı da (belirsizlik bandı) üretilir, çünkü optimizasyon tek bir nokta tahminine güvenemez.
• **Optimization Engine (Python + MILP çözücü)**: Karma tamsayılı doğrusal programlama ile yük kaydırma planını çözer. Kısıtlar bildirimsel tanımlanır; tesis mühendisi yeni bir kısıt eklediğinde kod değişmez.
• **Dispatch Controller (Go)**: Planı ekipman komutlarına çevirir; her komut için geri bildirim doğrulaması bekler.
• **Operatör Paneli (React)**: Plan önizlemesi, onay ve canlı izleme.

### 2. Veritabanı Mimarisi:
• **TimescaleDB**: Sayaç ölçümleri, tahminler ve gerçekleşen değerler; tahmin doğruluğunun geriye dönük ölçümü bu tabloların karşılaştırılmasıyla yapılır.
• **PostgreSQL**: Tesisler, ekipman envanteri, kısıt tanımları ve plan geçmişi.
• **Redis**: Canlı telemetri ve panel önbelleği.`,
            security: `Endüstriyel kontrol sistemlerine komut gönderen her yazılım, güvenlik açısından bir operasyonel teknoloji (OT) bileşeni olarak ele alınmalıdır.

### 1. Güvenlik Önlemleri & Standartlar:
• **Tek Yönlü Ağ Sınırı**: Bulut düzlemi tesis ağına doğrudan bağlanamaz; kenar ağ geçidi yalnızca giden (outbound) bağlantı kurar ve komutları kendisi çeker. Bu, IEC 62443 yaklaşımına uygun temel ayrımdır.
• **Komut Beyaz Listesi**: Kenar ağ geçidi yalnızca önceden tanımlanmış, sınırları belli komut kümesini uygular; kapsam dışı bir komut geldiğinde reddeder ve alarm üretir. Buluttaki bir ihlal, keyfi ekipman kontrolüne dönüşemez.
• **Operatör Onay Kapısı**: Varsayılan modda plan operatör onayından sonra uygulanır; tam otomatik mod ancak tesis tarafından açıkça etkinleştirilir ve her zaman acil durdurma (kill switch) ile geçersiz kılınabilir.
• **Kimlik Doğrulama**: Kenar ağ geçidi ile bulut arasında mTLS ve cihaz başına benzersiz sertifika; sertifikalar döngüsel olarak yenilenir.
• **Değiştirilemez Komut Günlüğü**: Hangi komutun hangi plan ve hangi onayla gönderildiği append-only olarak saklanır; bir üretim kaybı sonrası kök neden analizi bu izle yapılır.`
        }
    },
    {
        id: "reloop-exchange",
        title: "ReLoop",
        tagline: "Endüstriyel Yan Ürün ve Atık Akışları İçin Döngüsel Ekonomi Eşleştirme Ağı",
        category: "Sürdürülebilirlik & IoT & Blockchain",
        categoryKey: "sustainability",
        meta: {
            difficulty: "Orta Düzey",
            mvpTime: "6 Hafta",
            monetization: "Eşleşme Komisyonu + Kurumsal Raporlama Aboneliği",
            opportunityScore: "%87 Fırsat Skoru"
        },
        diagramNodes: [
            { id: 1, name: "Tesis Atık Beyanı", type: "source", sub: "Malzeme + Miktar + Konum" },
            { id: 2, name: "Material Normalizer", type: "service", sub: "Atık Kodu Standardizasyonu" },
            { id: 3, name: "Matching Engine", type: "ai", sub: "Uygunluk + Lojistik Skoru" },
            { id: 4, name: "Compliance Checker", type: "service", sub: "İzin & Mevzuat Doğrulama" },
            { id: 5, name: "PostgreSQL + PostGIS", type: "storage", sub: "Coğrafi Arz-Talep Havuzu" },
            { id: 6, name: "Pazaryeri Portalı", type: "client", sub: "Teklif & Sevkiyat Takibi" }
        ],
        step1: {
            marketGap: `Bir fabrikanın atığı çoğu zaman başka bir fabrikanın hammaddesidir: cam kırığı, metal talaşı, tekstil kırpıntısı, gıda üretiminden çıkan organik yan ürün. Ancak bu eşleşme bugün büyük ölçüde **tesadüfe ve kişisel tanışıklığa** bağlı; iki tesis birbirinden 40 kilometre uzakta olsa bile birinin arzından diğerinin haberi olmuyor ve malzeme depolama sahasına gidiyor. Var olan atık borsaları ise ilan panosu mantığında çalışıyor: serbest metin ilanlar, standart olmayan malzeme tanımları, doğrulanmamış miktarlar. Bir alıcı "polipropilen" arıyorsa, aynı malzemeyi "PP granül" diye yazan ilanı hiç görmüyor. Üstelik atık transferi izne tabi bir işlem; eşleşme bulunsa bile mevzuat uygunluğu ayrı bir engel oluşturuyor. ReLoop, malzeme tanımlarını standart atık kodlarına normalize eder, arz ve talebi coğrafi ve lojistik maliyeti hesaba katarak eşleştirir ve mevzuat uygunluğunu eşleşme anında kontrol eder.`,
            description: `ReLoop, endüstriyel yan ürünleri atık olmaktan çıkarıp girdiye dönüştüren bir eşleştirme ve uyum platformudur.

**Temel İşlevler & Özellikler:**
• **Malzeme Normalizasyonu**: Serbest metin malzeme tanımlarını standart atık kodlarına ve malzeme sınıflarına eşler; farklı isimlendirmeler aynı havuzda buluşur.
• **Lojistik Farkındalıklı Eşleştirme**: Yalnızca malzeme uyumuna değil, mesafe, taşıma maliyeti ve minimum sevkiyat miktarına da bakar; ekonomik olmayan eşleşmeleri baştan eler.
• **Mevzuat Uygunluk Kontrolü**: Alıcının ilgili atık kodu için geçerli izni olup olmadığını doğrular; izinsiz eşleşme teklife dönüşemez.
• **Doğrulanabilir Döngüsellik Raporu**: Tesisin yönlendirdiği malzeme miktarı ve önlenen bertaraf, sürdürülebilirlik raporlamasında kullanılabilecek kanıtlarla birlikte sunulur.
• **Sevkiyat Takibi**: Eşleşme sonrası taşıma belgeleri ve teslim onayı platform üzerinden izlenir; süreç e-postaya dağılmaz.`,
            tags: ["TypeScript", "NestJS", "PostgreSQL", "PostGIS", "Python", "Next.js"]
        },
        step2: {
            architecture: `ReLoop bir pazaryeri olduğu için mimarinin merkezinde **eşleştirme kalitesi** ve **güven** vardır; teknik karmaşıklık coğrafi sorgu ve normalizasyonda yoğunlaşır.

### 1. Sistem Katmanları:
• **Material Normalizer (Python)**: Serbest metin tanımı standart atık koduna eşler; belirsiz durumlarda kullanıcıya doğrulama sorar ve verdiği yanıt eşleme sözlüğünü besler.
• **Matching Engine (TypeScript)**: Malzeme uyumu, miktar aralığı, coğrafi mesafe ve zamanlama penceresini birleştiren bir skorla adayları sıralar. PostGIS mesafe sorguları bu katmanın çekirdeğidir.
• **Compliance Checker (NestJS)**: Alıcının izin kayıtlarını ve atık kodu kapsamını doğrular; süresi dolmuş izinler otomatik olarak eşleşme dışı bırakılır.
• **Core API (NestJS)**: İlan yaşam döngüsü, teklif, sözleşme ve sevkiyat durumları.
• **Portal (Next.js)**: Arz-talep girişi, harita görünümü, teklif yönetimi.

### 2. Veritabanı Mimarisi:
• **PostgreSQL + PostGIS**: Arz ve talep kayıtları coğrafi noktalarla saklanır; mesafe bazlı eşleştirme veritabanı düzeyinde indekslenir.
• **PostgreSQL (ilişkisel)**: Tesisler, izin belgeleri, teklifler, sevkiyatlar ve denetim kayıtları.
• **S3 Uyumlu Depolama**: İzin belgeleri, analiz raporları ve taşıma evrakı.`,
            security: `Pazaryerinde en büyük risk teknik ihlal değil, **ticari sırların sızması ve sahte katılımcılardır**.

### 1. Güvenlik Önlemleri & Standartlar:
• **Kademeli Görünürlük**: İlan ayrıntıları — tam miktar, tesis adı ve kesin konum — yalnızca doğrulanmış ve ilgili izne sahip karşı tarafa açılır. Atık miktarı üretim hacmini ele verdiği için bu bilgi rakip istihbaratına dönüşebilir.
• **Kurumsal Doğrulama (KYB)**: Katılımcı tesisler vergi kaydı ve çevre izin belgeleriyle doğrulanır; doğrulanmamış hesaplar teklif veremez.
• **Belge Bütünlüğü**: Yüklenen izin ve analiz belgelerinin hash'i kaydedilir; belgenin sonradan değiştirilmesi tespit edilebilir.
• **Erişim Kontrolü ve Kiracı İzolasyonu**: Satır düzeyi güvenlik (RLS) ile her tesis yalnızca kendi kayıtlarına ve kendisine açılmış eşleşmelere erişir.
• **Denetim İzi**: Teklif, kabul ve sevkiyat onayları değiştirilemez biçimde kaydedilir; bu kayıtlar hem ticari uyuşmazlıkta hem de çevre denetiminde kanıt niteliği taşır.`
        }
    },
    {
        id: "driftsentry-iac",
        title: "DriftSentry",
        tagline: "Altyapı Kodu ile Gerçek Bulut Durumu Arasındaki Sapmanın Tespiti ve Uzlaştırılması",
        category: "DevOps & Yazılım Geliştirme Araçları",
        categoryKey: "devops",
        meta: {
            difficulty: "Orta Düzey",
            mvpTime: "6 Hafta",
            monetization: "Yönetilen Kaynak Sayısına Göre SaaS + Kurumsal Self-Hosted",
            opportunityScore: "%91 Fırsat Skoru"
        },
        diagramNodes: [
            { id: 1, name: "IaC Deposu", type: "source", sub: "Terraform / Pulumi Kaynağı" },
            { id: 2, name: "State Reconciler", type: "service", sub: "Plan vs Gerçek Karşılaştırma" },
            { id: 3, name: "Drift Classifier", type: "ai", sub: "Zararsız / Riskli Ayrımı" },
            { id: 4, name: "Attribution Engine", type: "service", sub: "Bulut Denetim Kaydı Eşleme" },
            { id: 5, name: "PostgreSQL", type: "storage", sub: "Sapma Geçmişi + Politika" },
            { id: 6, name: "Uzlaştırma PR'ı", type: "client", sub: "Kod veya Bulut Düzeltmesi" }
        ],
        step1: {
            marketGap: `Altyapı kodu (IaC) benimsemiş ekiplerin neredeyse tamamı aynı sessiz sorunu yaşıyor: bir gece yarısı olayında birisi konsoldan hızlıca bir güvenlik grubu kuralı açıyor, sonra kimse kodu güncellemiyor. Aylar sonra bir plan çalıştırıldığında bu değişiklik sessizce geri alınıyor veya beklenmedik bir kesintiye yol açıyor. Terraform'un kendisi sapmayı ancak siz plan çalıştırdığınızda gösterir — yani sorunu en kötü anda, üretim değişikliği yapmak üzereyken öğrenirsiniz. Piyasadaki araçlar ise sapmayı listeliyor ama **her sapmayı eşit önemde gösteriyor**: otomatik ölçekleyicinin değiştirdiği kapasite değeri ile birinin elle açtığı 0.0.0.0/0 kuralı aynı listede yan yana duruyor. Bu gürültü, sapma raporlarının kısa sürede yok sayılmasına yol açıyor. DriftSentry sapmayı sürekli izler, gürültüyü ayıklar, değişikliği bulut denetim kaydından kimin yaptığıyla eşleştirir ve düzeltmeyi iki yönde de — kodu gerçeğe ya da gerçeği koda — pull request olarak önerir.`,
            description: `DriftSentry, altyapı kodu ile canlı bulut durumu arasındaki farkı sürekli izleyen ve kapatan bir uzlaştırma ajanıdır.

**Temel İşlevler & Özellikler:**
• **Sürekli Sapma Taraması**: Plan çalıştırmayı beklemeden, tanımlı aralıklarla gerçek bulut durumunu kodla karşılaştırır.
• **Gürültü Ayıklama**: Otomatik ölçekleme, bulut sağlayıcının kendi güncellediği alanlar ve etiket senkronizasyonu gibi beklenen farkları bastırır; ekip yalnızca gerçek sapmayı görür.
• **Risk Sınıflandırması**: Güvenlik grubu, IAM politikası ve şifreleme ayarı gibi kritik alanlardaki sapmaları en üste taşır; kozmetik farklar arka plana düşer.
• **Değişiklik Atıfı**: Bulut denetim kaydını tarayarak değişikliği kimin, ne zaman ve hangi arayüzden yaptığını gösterir. Suçlama için değil, süreç boşluğunu görmek için.
• **Çift Yönlü Uzlaştırma**: Değişiklik meşruysa kodu güncelleyen, değilse bulutu koda döndüren pull request üretir; karar her zaman insanda kalır.`,
            tags: ["Go", "Terraform", "Pulumi", "PostgreSQL", "GitOps", "TypeScript"]
        },
        step2: {
            architecture: `DriftSentry'nin çekirdeği bir karşılaştırma motorudur; zorluk, farklı sağlayıcıların aynı kavramı farklı şekillerde temsil etmesinden kaynaklanır.

### 1. Sistem Katmanları:
• **State Reconciler (Go)**: IaC durum dosyasını ve sağlayıcı API'sinden çekilen gerçek kaynak durumunu ortak bir ara temsile normalize eder, ardından alan bazında karşılaştırır. Normalizasyon olmadan aynı yapılandırma iki farklı biçimde görünüp yanlış sapma üretir.
• **Drift Classifier (Go + kural motoru)**: Sapmaları kaynak türü ve alan yoluna göre sınıflandırır; bastırma kuralları bildirimsel olarak tanımlanır ve versiyonlanır.
• **Attribution Engine (Go)**: Bulut denetim kaydını (CloudTrail ve muadilleri) sapmanın zaman penceresiyle eşleştirerek değişikliğin kaynağını bulur.
• **Reconciliation PR Bot (Go)**: Seçilen yöne göre kod yamasını veya düzeltme planını üretip pull request açar.
• **Panel (Next.js)**: Sapma envanteri, geçmiş ve politika yönetimi.

### 2. Veritabanı Mimarisi:
• **PostgreSQL**: Kaynak envanteri, sapma kayıtları, bastırma kuralları ve uzlaştırma geçmişi. Sapmanın ne zaman ortaya çıkıp ne zaman kapandığı zaman aralığı olarak saklanır; böylece "ortalama sapma yaşam süresi" ölçülebilir bir gösterge haline gelir.
• **Redis**: Tarama iş kuyruğu ve sağlayıcı API hız sınırlarını aşmamak için jeton kovası.`,
            security: `Ürün, müşterinin tüm bulut altyapısını okuyabilen bir bileşendir; bu, onu değerli bir hedef yapar.

### 1. Güvenlik Önlemleri & Standartlar:
• **Salt Okunur Bulut Erişimi**: Varsayılan kurulum yalnızca okuma yetkisi ister. Düzeltmeler Git üzerinden önerilir; ürünün buluta yazma yetkisi olması gerekmez ve önerilmez.
• **Durum Dosyası Hassasiyeti**: IaC durum dosyaları çoğu zaman düz metin sır içerir. DriftSentry durum dosyasını kalıcı olarak saklamaz; bellekte işler, karşılaştırma sonrası yalnızca alan yolu ve hash farkını tutar, değer içeriğini değil.
• **Sır Maskeleme**: Sapma raporlarında hassas alanların değerleri maskelenir; "değişti" bilgisi gösterilir, içerik gösterilmez.
• **Kimlik Federasyonu**: Uzun ömürlü bulut anahtarı yerine OIDC tabanlı geçici kimlik federasyonu kullanılır; kalıcı erişim anahtarı saklanmaz.
• **Self-Hosted Seçeneği**: Bulut erişimini hiçbir koşulda dışarı vermek istemeyen kurumlar için tüm bileşenler kendi altyapılarında çalıştırılabilir.
• **Denetim İzi**: Hangi kullanıcının hangi bastırma kuralını eklediği kaydedilir; bir sapmanın kalıcı olarak gizlenmesi sessizce yapılamaz.`
        }
    },
    {
        id: "postmortem-ai",
        title: "Postmortem AI",
        tagline: "Olay Telemetrisinden Kök Neden Hipotezi ve Suçsuz Postmortem Taslağı Üretimi",
        category: "DevOps & Yazılım Geliştirme Araçları",
        categoryKey: "devops",
        meta: {
            difficulty: "Orta Düzey",
            mvpTime: "5 Hafta",
            monetization: "Mühendis Başı Aylık Abonelik (B2B SaaS)",
            opportunityScore: "%89 Fırsat Skoru"
        },
        diagramNodes: [
            { id: 1, name: "Olay Sinyalleri", type: "source", sub: "Alarm + Log + Trace + Deploy" },
            { id: 2, name: "Timeline Builder", type: "service", sub: "Çok Kaynaklı Olay Birleştirme" },
            { id: 3, name: "Causal Hypothesis Engine", type: "ai", sub: "Değişim-Etki İlişkilendirme" },
            { id: 4, name: "Narrative Generator", type: "ai", sub: "Suçsuz Postmortem Taslağı" },
            { id: 5, name: "ClickHouse & Postgres", type: "storage", sub: "Telemetri + Olay Arşivi" },
            { id: 6, name: "Postmortem Editörü", type: "client", sub: "Ekip İncelemesi & Aksiyonlar" }
        ],
        step1: {
            marketGap: `Bir üretim olayı bittikten sonra en değerli iş başlıyor: ne olduğunu yazmak. Ama bu iş, olayı çözmek için 6 saat uyanık kalmış mühendisin önüne düşüyor ve sonuç öngörülebilir — postmortem ya hiç yazılmıyor ya da bir hafta sonra, ayrıntılar unutulmuşken üstünkörü dolduruluyor. Böylece organizasyon aynı hatayı üçüncü kez yapana kadar örüntüyü fark etmiyor. Mevcut olay yönetimi araçları çağrı yönlendirmede ve alarm toplamada iyi, fakat olay kapandıktan sonra ekibe **boş bir şablon** veriyor. Oysa gereken bilgi zaten sistemde dağınık halde duruyor: alarmın ne zaman çaldığı, o pencerede hangi dağıtımın yapıldığı, hangi metriğin ne zaman saptığı, sohbet kanalında hangi kararların alındığı. Postmortem AI bu sinyalleri tek bir zaman çizelgesinde birleştirir, olası kök neden hipotezlerini kanıtlarıyla sıralar ve ekibin üzerinde çalışabileceği, suçlayıcı olmayan bir taslak üretir.`,
            description: `Postmortem AI, olay sonrası öğrenme sürecini otomatikleştiren bir güvenilirlik asistanıdır.

**Temel İşlevler & Özellikler:**
• **Otomatik Zaman Çizelgesi**: Alarmlar, dağıtımlar, yapılandırma değişiklikleri, ölçek olayları ve sohbet kanalındaki kararları tek bir kronolojiye dizer.
• **Kök Neden Hipotezleri**: Olay penceresindeki değişiklikleri etki metrikleriyle ilişkilendirerek olasılık sırasına göre hipotez üretir; her hipotezin yanında dayandığı kanıtı gösterir. Kesin yanıt iddia etmez, mühendisin doğrulayacağı adaylar sunar.
• **Suçsuz Anlatı (Blameless)**: Taslak metin kişi yerine sistem ve süreç odaklıdır; "X kişisi hatalı deploy yaptı" yerine "değişiklik kademeli dağıtım olmadan yayına alındı" biçiminde yazar.
• **Tespit ve Kurtarma Süresi Ölçümü**: Her olay için tespit süresi ve kurtarma süresi otomatik hesaplanır; ekip bu göstergeleri elle takip etmek zorunda kalmaz.
• **Tekrar Eden Örüntü Uyarısı**: Yeni olayı geçmiş olay arşiviyle karşılaştırır; benzer bir kök neden daha önce görüldüyse ve aksiyon maddesi kapatılmadıysa bunu açıkça belirtir.`,
            tags: ["Python", "ClickHouse", "OpenTelemetry", "Go", "PostgreSQL", "React"]
        },
        step2: {
            architecture: `Sistemin değeri, birbiriyle konuşmayan kaynaklardan tek bir tutarlı kronoloji çıkarabilmesinde; mimari bu birleştirme sorununa göre kurgulanmıştır.

### 1. Sistem Katmanları:
• **Connector Layer (Go)**: İzleme, olay yönetimi, CI/CD ve sohbet platformlarından veri çeker. Her bağlayıcı olayları ortak bir şemaya çevirir; saat dilimi ve saat kayması normalize edilir, aksi halde kronoloji yanlış sıralanır.
• **Timeline Builder (Python)**: Olayları zaman ve etkilenen servise göre birleştirir, gürültülü tekrar eden alarmları tek bir olaya katlar.
• **Causal Hypothesis Engine (Python)**: Değişiklik olaylarını metrik sapmalarıyla zamansal ve topolojik yakınlığa göre eşleştirir; servis bağımlılık grafiğini kullanarak etkinin yayılma yönünü değerlendirir.
• **Narrative Generator (Python)**: Zaman çizelgesi ve hipotezlerden yapılandırılmış taslak metin üretir; çıktı her zaman insan tarafından düzenlenmek üzere işaretlenir.
• **Editör (React)**: Ekip incelemesi, aksiyon maddesi takibi ve yayınlama.

### 2. Veritabanı Mimarisi:
• **ClickHouse**: Yüksek hacimli metrik ve log özetleri; olay penceresi sorguları sütun bazlı depolamada çok daha verimlidir.
• **PostgreSQL**: Olaylar, zaman çizelgeleri, postmortem belgeleri, aksiyon maddeleri ve bunların kapanma durumu.
• **Nesne Depolama**: Ham log örnekleri ve grafik anlık görüntüleri.`,
            security: `Olay verisi, üretim sistemlerinin iç yapısını ve zaman zaman müşteri verisini içerir.

### 1. Güvenlik Önlemleri & Standartlar:
• **Log Redaksiyonu**: Toplanan log ve iz örneklerinde e-posta, jeton, API anahtarı ve kimlik numarası örüntüleri alım sırasında maskelenir; maskeleme kaynağa en yakın noktada, veri kalıcı depolamaya yazılmadan önce yapılır.
• **Örnekleme ve Saklama Sınırı**: Ham log tamamı değil, olay penceresine ait sınırlı bir örnek saklanır ve tanımlı süre sonunda otomatik silinir.
• **Anlatı Üretiminde Veri Sınırı**: Metin üretimi katmanına yalnızca redakte edilmiş özetler ve meta veriler gönderilir; ham müşteri verisi bu katmana hiçbir koşulda geçmez.
• **Erişim Kontrolü**: Postmortem belgeleri varsayılan olarak ilgili ekiple sınırlıdır; kuruluş genelinde paylaşım açık bir eylem gerektirir.
• **Bağlayıcı Yetkileri**: Tüm entegrasyonlar salt okunur kapsam ister; sohbet bağlayıcısı yalnızca olay kanallarına erişir, kişisel mesajlara erişim talep etmez.
• **Suçsuzluğun Teknik Karşılığı**: Kişi adları anlatı üretimine girmeden önce role dönüştürülür; sistem tasarım gereği bireyi işaret eden bir metin üretemez.`
        }
    }
];
