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
    }
];
