
/* ==========================================================================
   Aetheria.ai — Örnek çıktı vitrini (SHOWCASE)

   Bu dosya bir proje kataloğu DEĞİLDİR ve uygulamanın önerdiği projelerin
   kaynağı da değildir. Uygulamanın işi, kullanıcının kendi API anahtarıyla
   sıfırdan proje üretmektir; buradaki girdiler yalnızca "üretilen çıktı neye
   benziyor" sorusunu anahtarı olmayan bir ziyaretçiye gösterir.

   Bu ayrım bir kez kaybedildi: örnekler ana üretim butonunu işgal etti,
   kaydedilen havuz bunlarla önceden dolduruldu ve dosya 167 KB'a çıkarak
   uygulamanın en büyük varlığı hâline geldi — "hazır veri seti çekmez" diyen
   bir uygulamada. Bu yüzden buradaki kurallar:

   - Kategori başına EN FAZLA bir örnek. Bu dosya büyümemeli.
   - Buradan hiçbir şey ana üretim akışına girmez; yalnızca açık "örnek çıktıyı
     gör" eylemiyle görüntülenir ve arayüzde daima statik örnek olarak etiketlenir.
   - Yeni bir kategori eklenirken buraya örnek eklemek zorunlu değildir.
   ========================================================================== */

const PROJECTS_DATABASE = [
    {
        id: "medivision-ai",
        title: "MediVision AI (TİTCK & e-Nabız Uyumlu)",
        tagline: "Radyoloji ve Medikal Görüntülemede Açıklanabilir Yapay Zeka ile Anomali Tespit ve Triyaj Platformu",
        category: "Sağlık Teknolojileri & Yapay Zeka",
        categoryKey: "health-ai",
        scope: "national",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "8 Hafta",
            monetization: "Hastane Lisansı (B2B SaaS) + TÜBİTAK 1507 Ar-Ge Hibesi",
            opportunityScore: "%97 Fırsat Skoru",
            scope: "national"
        },
        diagramNodes: [
            { id: 1, name: "PACS / DICOM Sunucusu", type: "source", sub: "Hastane Otomasyonu & e-Nabız" },
            { id: 2, name: "STOW-RS Ingestion Gateway", type: "service", sub: "Go + DICOM C-STORE" },
            { id: 3, name: "Vision Transformers (XAI)", type: "ai", sub: "NVIDIA TensorRT GPU Engine" },
            { id: 4, name: "Grad-CAM Isı Haritası Servisi", type: "service", sub: "Açıklanabilir Tıbbi Raporlama" },
            { id: 5, name: "PostgreSQL & MinIO", type: "storage", sub: "AES-256 Şifreli Tıbbi Arşiv" },
            { id: 6, name: "Web DICOM Görüntüleyici", type: "client", sub: "CornerstoneJS + React Portali" }
        ],
        step1: {
            marketGap: `Türkiye'de kamu ve özel hastanelerde radyolog başına düşen günlük MR, BT ve Röntgen inceleme sayısı OECD ortalamasının 2.5 katına ulaşmıştır. Mevcut hastane bilgi yönetim sistemleri (HBYS/PACS) görüntüleri yalnızca depolar; otomatik anomali sınıflandırması, önceliklendirme (triyaj) ve hekime kararın nedenini gösteren Açıklanabilir Yapay Zeka (XAI - Explainable AI) ısı haritaları sunmaz. Ayrıca yabancı menşeili medikal AI yazılımları Sağlık Bakanlığı e-Nabız, USS ve TİTCK (Tıbbi İlaç ve Cihaz Kurumu) tıbbi cihaz mevzuatına entegre olamamakta ve hasta verilerini yurt dışına çıkarma riski taşımaktadır (KVKK Md. 9 ihlali). MediVision AI, tamamen yerli altyapıda çalışan, KVKK uyumlu ve radyologların iş yükünü %55 azaltan otonom bir triyaj asistanıdır.`,
            description: `MediVision AI, hastane PACS sunucularına DICOM web protokolüyle bağlanan ve görüntüleri saniyeler içinde analiz eden derin öğrenme tabanlı bir klinik karar destek sistemidir.

**Temel Yetenekler & Özellikler:**
• **Saniyeler İçinde Anomali Tespiti**: DICOM görüntülerini Vision Transformers ve ResNet-50 hibrit mimarisiyle tarayarak lezyon, kırık, iç kanama veya tümör dokusunu %98.4 doğrulukla tespit eder.
• **Grad-CAM Açıklanabilir Isı Haritası**: Yapay zekanın teşhis kararını verirken görüntünün tam olarak hangi piksellerine odaklandığını renkli ısı katmanı olarak hekime sunar.
• **RadLex ve Türkçe Medikal Rapor Taslağı**: Tespit edilen bulguları Sağlık Bakanlığı standart terminolojisine ve Türkçe tıbbi literatüre uygun taslak rapor metnine dönüştürür.
• **Kritik Vaka Triyajı**: Beyin kanaması veya aort diseksiyonu gibi acil müdahale gerektiren hastaları radyoloğun iş listesinin en tepesine otomatik taşır.`,
            tags: ["Python", "PyTorch", "FastAPI", "DICOM", "Vision Transformers", "React", "KVKK Uyumlu"]
        },
        step2: {
            architecture: `MediVision AI, medikal görüntü verilerini sıfır gecikmeyle işlemek için **Event-Driven Microservices** ve **Clean Architecture (Onion Architecture)** prensiplerine dayanır.

### 1. Sistem Katmanları:
• **Domain Layer**: Hasta, Vaka, DICOM Metadata, Anomali, Radyoloji Raporu temel varlıkları ve iş kuralları.
• **Application Layer**: Görüntü ön işleme, çıkarım iş akışları (Use Cases), triyaj sıralaması ve e-Nabız senkronizasyon komutları.
• **Infrastructure Layer**: Go Ingestion Gateway (STOW-RS dinleyici), Triton Inference Server (GPU hızlandırmalı TensorRT modelleri), MinIO S3 ve PostgreSQL adaptörleri.
• **Presentation Layer**: React 18, CornerstoneJS DICOM görüntüleyici, REST API ve WebSocket canlı bildirim kanalları.

### 2. Somut Teknoloji Yığını:
• **Backend**: Go (Ingestion) + Python FastAPI (Orchestration) + Triton Server
• **Frontend**: React + TypeScript + CornerstoneJS + Vite + TailwindCSS
• **Veritabanı & Kuyruk**: PostgreSQL 16 + Redis Cluster + Apache Kafka + MinIO (S3 API)

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`patients\` (id, anonymized_token, birth_year, gender, created_at)
• \`studies\` (id, patient_id FK, modality, study_date, pacs_uid, status)
• \`inference_results\` (id, study_id FK, anomaly_detected, confidence_score, heatmap_s3_path, findings_json)
• \`radiologist_reviews\` (id, study_id FK, doctor_id FK, approved, doctor_notes, reviewed_at)

### 4. API & Protokol Kontratları:
• \`POST /api/v1/dicom/ingest\`: DICOM C-STORE web hook alımı.
• \`GET /api/v1/cases/triage-queue\`: Önceliklendirilmiş vaka listesi stream'i.
• \`WS /ws/v1/alerts\`: Acil iç kanama / kritik vaka anlık hekim bildirim soketi.`,
            security: `Sağlık Bakanlığı Bilgi Güvenliği Yönergesi ve **KVKK** standartlarına tam uyumlu **Zero-Trust** güvenlik mimarisi uygulanmıştır.

### 1. Kimlik Doğrulama & Yetkilendirme (Auth & RBAC):
• e-Devlet & e-İmza ile Hekim Doğrulama (OAuth2 / OIDC), JWT Bearer token ve rol bazlı erişim matrisi (Radyolog, Asistan, Başhekim, Sistem Yöneticisi).

### 2. Veri Güvenliği & Şifreleme:
• **PII De-identification**: DICOM dosyasındaki hasta adı, T.C. Kimlik No gibi kimlik bilgileri belleğe alınır alınmaz SHA-256 HMAC ile takma ada (pseudonym) dönüştürülür.
• **Durağan & Hareketli Veri**: AES-256-GCM disk şifrelemesi, PostgreSQL TDE (Transparent Data Encryption) ve servisler arası zorunlu mTLS (Mutual TLS 1.3).

### 3. Tehdit Modellemesi & OWASP Önlemleri:
• Rate limiting (IP & Hekim bazlı), DICOM Parser Buffer-Overflow koruması, CSRF token doğrulama ve SQL Injection'a karşı parameterized ORM mimarisi.

### 4. Denetim İzi & Mevzuat:
• Değiştirilemez (Append-Only) Audit Trail logları; hangi hekimin hangi hasta kaydını hangi IP ve saatte görüntülediği zaman damgasıyla saklanır.`
        }
    },
    {
        id: "defishield-agent",
        title: "DeFiShield Agent",
        tagline: "Merkeziyetsiz Finans ve Akıllı Sözleşmeler İçin Gerçek Zamanlı AI Mempool Güvenlik ve Tehdit Önleme Ajanı",
        category: "Web3, Blockchain & Güvenlik",
        categoryKey: "web3",
        scope: "international",
        meta: {
            difficulty: "Uzman Düzey",
            mvpTime: "10 Hafta",
            monetization: "B2B Protocol Security Retainer + Flashbots MEV Revenue",
            opportunityScore: "%98 Fırsat Skoru",
            scope: "international"
        },
        diagramNodes: [
            { id: 1, name: "Mempool Listener Nodes", type: "source", sub: "Geth / Reth IPC WebSocket" },
            { id: 2, name: "Rust EVM Simulator", type: "service", sub: "Revive Fork Engine (Sub-ms)" },
            { id: 3, name: "Graph Neural Networks (GNN)", type: "ai", sub: "Reentrancy & Flashloan Detector" },
            { id: 4, name: "ClickHouse & Redis", type: "storage", sub: "Zaman Serisi & Kara Liste DB" },
            { id: 5, name: "MEV Mitigation Dispatcher", type: "client", sub: "Flashbots Private RPC Bundle" }
        ],
        step1: {
            marketGap: `Web3 ve DeFi ekosisteminde yalnızca son iki yılda akıllı sözleşme (Smart Contract) açıkları, Flash Loan saldırıları ve Oracle manipülasyonları yüzünden 4.2 milyar doların üzerinde fon çalınmıştır. Geleneksel güvenlik denetimleri (Static Code Audits) kod dağıtılmadan önce yapılır ve dağıtım sonrası ortaya çıkan dinamik composability açıklarını koruyamaz. Mevcut izleme araçları ise saldırı blok zincire yazıldıktan sonra bildirim gönderir; bu da fonların kurtarılması için çok geçtir. DeFiShield Agent, mempool (onay bekleyen işlemler havuzu) seviyesinde milisaniyelik analiz yaparak saldırganın işlemini henüz madenciler bloklamadan önce tespit eder ve koruyucu beyaz şapkalı Flashbots paketleriyle protokolleri otonom olarak devre kesiciye (Circuit Breaker) alır.`,
            description: `DeFiShield Agent, Ethereum, Arbitrum, Base ve Solana ağlarında onay bekleyen transferleri izleyen ve sıfırıncı gün DeFi istismarlarını önleyen otonom bir AI güvenlik koruyucusudur.

**Temel Yetenekler & Özellikler:**
• **Mempool Seviyesinde İstismar Simülasyonu**: Bellekteki tüm bekleyen işlemleri izole bir EVM fork'unda çalıştırarak bakiye manipülasyonu ve reentrancy kalıplarını yakalar.
• **GNN Tabanlı Anomali Tespiti**: Graph Neural Networks ile çağrı zincirindeki anormal token transferlerini ve flashloan akışlarını 15 milisaniyede sınıflandırır.
• **Otonom Koruyucu Front-Running (Mitigation)**: Saldırı tespit edildiğinde protokolün 'pause' fonksiyonunu Flashbots private bundle ile madenciye saldırgandan önce iletir.
• **Canlı Protokol Risk Skoru API**: Web3 cüzdanları ve DEX toplayıcıları için akıllı sözleşme risk indeksini (0-100) canlı hesaplayan REST/GraphQL API.`,
            tags: ["Rust", "Solidity", "Foundry", "Python", "Graph Neural Networks", "Flashbots", "SOC2 Uyumlu"]
        },
        step2: {
            architecture: `DeFiShield, milisaniyelerin ve gas optimizasyonunun hayati olduğu blokzincir ortamında **Ultra-Low Latency** ve **Actor Model** mimarisine dayanır.

### 1. Sistem Katmanları:
• **Mempool Layer (Rust / Tokio)**: IPC ve WebSocket soketleri üzerinden doğrudan validator node'larına bağlı, sıfır kopyalı (Zero-Copy) işlem dinleyici.
• **Execution Simulation Layer (Rust / revm)**: Gelen ham bytecode işlemlerini bellek içi EVM durumunda milisaniyelik simüle eden motor.
• **AI Classification Layer (Python / C++ PyTorch bindings)**: GNN modelleriyle sözleşme bağımlılık grafiklerini analiz eden yüksek performanslı çıkarım motoru.
• **Mitigation Dispatcher (Rust / Ethers-rs)**: Flashbots Builder API ve MEV-Boost kanallarına özel bundle imzalayan güvenlik düğümü.

### 2. Somut Teknoloji Yığını:
• **Core Engine**: Rust 1.80+ (revm, alloy, tokio)
• **AI/ML**: PyTorch + DGL (Deep Graph Library) + ONNX Runtime C++
• **Veri Katmanı**: ClickHouse (Time-Series Logs) + Redis Enterprise (Mempool Cache)

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`monitored_protocols\` (id, contract_address, chain_id, pause_selector, emergency_multisig)
• \`mempool_events\` (tx_hash PK, from_addr, to_addr, gas_price, simulated_status, threat_level)
• \`mitigation_logs\` (id, tx_hash FK, target_protocol_id FK, bundle_hash, gas_spent, saved_tvl_usd)

### 4. API Kontratları:
• \`GET /api/v1/threats/live\`: Anlık tespit edilen mempool saldırı akışı (SSE).
• \`POST /api/v1/protocols/register\`: Yeni akıllı sözleşme güvenlik koruması kaydı.`,
            security: `Sistemin kendisi bir savunma aracı olduğu için **Defense-in-Depth** ve donanımsal anahtar izolasyonu zorunludur.

### 1. Kimlik & Özel Anahtar Güvenliği:
• Otonom durdurma yetkisine sahip acil durum özel anahtarları AWS CloudHSM / YubiHSM 2 donanım modüllerinde tutulur; asla sunucu belleğine düz metin olarak çıkarılmaz.
• 3/5 Multi-Signature (Gnosis Safe) ve 24 saatlik Timelock kontrolü.

### 2. Tehdit Modellemesi & Sandboxing:
• EVM simülasyonu kaynak tüketimini sınırlayan izole WebAssembly/cgroup sandbox ortamlarında çalıştırılır; DoS ve bellek tükenmesi saldırıları önlenir.

### 3. Denetim & Formal Verification:
• Akıllı sözleşme devre kesicileri CertiK ve OpenZeppelin standartlarında formal-verification matematiksel kanıt testlerinden geçirilmiştir.`
        }
    },
    {
        id: "omnicache-ai",
        title: "OmniCache AI",
        tagline: "Yapay Zeka Destekli Tahminli Önbellekleme, eBPF Ağ Katmanı ve Akıllı Depolama Optimizatörü",
        category: "Altyapı, Cloud & Performans",
        categoryKey: "infrastructure",
        scope: "international",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "6 Hafta",
            monetization: "Cloud Infrastructure Usage-Based Pricing + Enterprise Support",
            opportunityScore: "%95 Fırsat Skoru",
            scope: "international"
        },
        diagramNodes: [
            { id: 1, name: "İstemci HTTP/RESP Trafiği", type: "source", sub: "Mikroservis Trafiği" },
            { id: 2, name: "eBPF / XDP Data Plane", type: "service", sub: "Linux Çekirdek Router (C++20)" },
            { id: 3, name: "Predictive Cache AI", type: "ai", sub: "LSTM + LightGBM Zaman Serisi" },
            { id: 4, name: "Tiered Storage Katmanı", type: "storage", sub: "RAM -> NVMe SSD -> S3" },
            { id: 5, name: "VictoriaMetrics & RocksDB", type: "storage", sub: "Performans & KV Deposu" },
            { id: 6, name: "Grafana & Cloud Portal", type: "client", sub: "Maliyet & Hit-Rate Paneli" }
        ],
        step1: {
            marketGap: `Yüksek trafikli modern bulut mimarilerinde Redis veya Memcached kullanımı çoğunlukla reaktif ve sezgiseldir (LRU, LFU bellek tahliye politikaları). Bu durum sunucularda fahiş RAM maliyetlerine ve popüler verilerin aniden düşmesiyle veritabanının kilitlendiği 'Cache Stampede' krizlerine yol açar. Geleneksel önbellekler hangi verinin 5 dakika sonra talep göreceğini öngöremez. OmniCache AI, mikroservis trafiğini zaman serisi makine öğrenmesi modelleriyle analiz ederek veriyi sorgu henüz gelmeden RAM'e çeker (Pre-warming) ve erişilmeyen verileri anında NVMe disk katmanına aktararak AWS/GCP bulut önbellek maliyetlerini %65 oranında düşürür.`,
            description: `OmniCache AI, mevcut Redis veya veritabanı altyapınızın önüne şeffaf bir proxy olarak kurulan akıllı bir veri yönetim katmanıdır.

**Temel Yetenekler & Özellikler:**
• **Tahminli Önbellek Isıtma (Predictive Pre-Warming)**: Trafik eğrilerini ve kullanıcı davranış örüntülerini öğrenerek ihtiyaç duyulacak anahtarları milisaniyeler öncesinden RAM'e yükler.
• **Akıllı Katmanlı Depolama (Tiered Storage)**: Sıcak veri (RAM) -> Ilık veri (NVMe SSD / RocksDB) -> Soğuk veri (S3) geçişini sıfır kod değişikliğiyle otomatik yönetir.
• **Cache Stampede ve Thundering Herd Engelleme**: Aynı anda binlerce istek gelmesi durumunda veritabanına sadece tek bir sorgu gönderir ve sonuçları bekleyen tüm isteklere anında çoklar.
• **Dinamik TTL Optimizasyonu**: Sabit süreler yerine verinin değişim sıklığına göre kendi kendine uyarlanan akıllı TTL (Time-To-Live) belirler.`,
            tags: ["C++20", "Go", "eBPF", "Redis Protocol", "RocksDB", "VictoriaMetrics", "AWS/GCP"]
        },
        step2: {
            architecture: `OmniCache AI, ağ paketlerini Linux çekirdeği seviyesinde işlemek ve alt-milisaniye (sub-millisecond) gecikme sağlamak için **eBPF (Extended Berkeley Packet Filter)** ve **Zero-Copy Memory** mimarisini kullanır.

### 1. Sistem Katmanları:
• **Data Plane (C++20 / eBPF / DPDK)**: Gelen RESP ve HTTP paketlerini çekirdek alanında karşılar, mikrosaniyeler içinde yönlendirir.
• **Control Plane (Go)**: Küme yönetimi, düğüm sağlık kontrolleri, metrik toplama ve dinamik konfigürasyon dağıtımı.
• **Predictive AI Engine (Python / Rust PyO3)**: Çevrim içi öğrenme algoritmalarıyla sonraki 15 dakikalık trafik talebini hesaplar.
• **Tiered Storage Engine (C++)**: RAM ve RocksDB SSD depolama arasında sıfır kilitli (Lock-Free) veri taşıyıcı.

### 2. Somut Teknoloji Yığını:
• **Data Plane**: C++20 + libbpf + Linux XDP
• **Control Plane**: Go 1.22 + gRPC + Raft Consensus
• **Monitoring**: VictoriaMetrics + Prometheus + Grafana Dashboard

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`cache_clusters\` (id, cluster_name, max_ram_bytes, policy_mode, created_at)
• \`key_access_patterns\` (key_hash PK, access_count, last_access_ts, predicted_next_access, tier_level)
• \`cost_savings_metrics\` (timestamp, cluster_id FK, ram_saved_gb, db_queries_prevented, latency_p99_ms)

### 4. API Kontratları:
• Standart Redis RESP protokolü uyumlu (GET, SET, MGET komutlarını kesintisiz karşılar).
• \`GET /api/v1/metrics/hit-rate\`: Gerçek zamanlı önbellek isabet oranı ve tasarruf metrikleri.`,
            security: `Önbellek katmanları hassas kullanıcı oturumlarının ve token'ların geçtiği kritik altyapılardır; **Enterprise-Grade Infrastructure Security** ile korunur.

### 1. Kimlik & Erişim Güvenliği:
• Redis ACL v2 ve mTLS istemci sertifikası doğrulama, Role-Based Access Control (RBAC).

### 2. Bellek İzolasyonu & Maskeleme:
• Farklı kiracıların (Multi-tenant) verileri donanımsal süreç izolasyonuyla (Process Sandboxing) ayrılır.
• Kredi kartı, parola hash'i ve PII içeren anahtarlar RAM'e girmeden önce kural bazlı Dynamic Data Masking (DDM) filtresinden geçer.

### 3. DoS & DDoS Koruması:
• Anormal sorgu trafiği gönderen IP adresleri eBPF/XDP katmanında işletim sistemi çekirdeğine yük binmeden mikrosaniyede düşürülür (Kernel Drop).`
        }
    },
    {
        id: "yks-bilge-koc",
        title: "BilgeKoç AI (MEB & ÖSYM Uyumlu)",
        tagline: "YKS, LGS ve KPSS İçin MEB Müfredatına ve Bilişsel Seviyeye Dayalı Kişiselleştirilmiş Yapay Zeka Koçu",
        category: "Eğitim Teknolojileri & Yapay Zeka",
        categoryKey: "edtech",
        scope: "national",
        meta: {
            difficulty: "Orta Düzey",
            mvpTime: "6 Hafta",
            monetization: "Öğrenci Aboneliği (Freemium) + Dershane/Okul B2B Lisansı",
            opportunityScore: "%96 Fırsat Skoru",
            scope: "national"
        },
        diagramNodes: [
            { id: 1, name: "Öğrenci Soru Çözüm Verisi", type: "source", sub: "Fotoğraf & Test Çözümleri" },
            { id: 2, name: "OCR & Multimodal Gateway", type: "service", sub: "FastAPI + LaTeX / Mathpix" },
            { id: 3, name: "Bilişsel Kazanç Haritası AI", type: "ai", sub: "MEB Kazanım Grafı & RAG LLM" },
            { id: 4, name: "PostgreSQL & pgvector", type: "storage", sub: "ÖSYM Soru Bankası & Vektör DB" },
            { id: 5, name: "Mobil & Web Arayüz", type: "client", sub: "Flutter / Next.js Öğrenci Portali" }
        ],
        step1: {
            marketGap: `Türkiye'de her yıl 3.5 milyondan fazla öğrenci YKS, LGS ve KPSS sınavlarına hazırlanmaktadır. Mevcut soru çözüm uygulamaları (Kunduz vb.) yalnızca sorunun çözüm videosunu verir; ancak öğrencinin o soruyu *neden* yanlış yaptığını, MEB müfredatındaki hangi alt kazanımdan eksik kaldığını ve sınavda çıkabilecek benzer soru varyasyonlarını analiz etmez. Özel ders ve koçluk ücretlerinin aylık 15.000 TL'yi aştığı ekonomik şartlarda, fırsat eşitliği sunan yerli bir yapay zeka sınav koçuna devasa bir talep vardır. BilgeKoç AI, MEB müfredat kazanım ağacıyla entegre çalışarak öğrencinin eksik olduğu konuyu tespit eder, Sokratik yöntemle ipuçları vererek çözdürür ve ÖSYM formatında benzer özgün sorular üretir.`,
            description: `BilgeKoç AI, öğrencinin soru çözüm fotoğraflarını ve deneme sınavı sonuçlarını inceleyerek kişiye özel öğrenme rotası çizen yapay zeka eğitim asistanıdır.

**Temel Yetenekler & Özellikler:**
• **Sokratik Soru Çözüm Rehberi**: Öğrencinin yapamadığı sorunun cevabını doğrudan vermek yerine, hangi formülü veya kuralı hatırlaması gerektiğini adım adım sorularla keşfettirir.
• **MEB Kazanım Eksiklik Analizi**: Yanlış yapılan soruları MEB'in resmi kazanım kodlarıyla (örn: MAT-11.3.1 Türevde Geometrik Yorum) eşleştirerek bilişsel eksiklik haritası çıkarır.
• **ÖSYM Formatında Benzer Soru Üretimi**: Öğrencinin takıldığı sorunun mantığını içeren, ancak sayıları ve hikayesi değişmiş yeni pratik soruları anlık oluşturur.
• **Dinamik Tekrar Programı (Aralıklı Tekrar - Spaced Repetition)**: Unutma eğrisine (Ebbinghaus) göre öğrencinin 3 gün, 1 hafta ve 1 ay sonra çözmesi gereken soru paketini hazırlar.`,
            tags: ["Flutter", "Python", "FastAPI", "pgvector", "MEB Müfredatı", "Next.js", "TÜBİTAK 2209 Uyumlu"]
        },
        step2: {
            architecture: `BilgeKoç AI, yüksek eşzamanlı öğrenci trafiğini karşılamak ve multimodal soru çözümlerini işlemek için **RAG (Retrieval-Augmented Generation) & Knowledge Graph** mimarisini kullanır.

### 1. Sistem Katmanları:
• **Media & OCR Pipeline**: Fotoğrafı çekilen matematik/fen sorularını LaTeX ve metin formatına dönüştüren multimodal işleme hattı.
• **Knowledge Graph Engine (Neo4j)**: MEB kazanımları, ön koşul ders konuları ve ÖSYM soru tipleri arasındaki hiyerarşik ilişki grafı.
• **RAG & Socratic Reasoning (Python / LangChain + Llama 3 Fine-Tuned)**: Öğrenciye rehberlik eden pedagojik yapay zeka ajanı.
• **Client Layer**: Flutter cross-platform mobil uygulama ve Next.js öğretmen/veli takip paneli.

### 2. Somut Teknoloji Yığını:
• **Backend**: Python FastAPI + Celery (Arka plan OCR işleri) + Redis
• **Mobil & Web**: Flutter (iOS & Android) + Next.js 14 + TailwindCSS
• **Veritabanları**: PostgreSQL 16 (pgvector) + Neo4j (Kazanım Grafı) + MinIO (Soru Fotoğrafları)

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`students\` (id, name, grade_level, exam_target, created_at)
• \`meb_competencies\` (code PK, subject, grade, title, prerequisite_code FK)
• \`question_attempts\` (id, student_id FK, competency_code FK, image_url, is_correct, mistake_reason)
• \`personalized_roadmaps\` (id, student_id FK, weekly_schedule_json, mastery_score)

### 4. API Kontratları:
• \`POST /api/v1/questions/analyze-photo\`: Soru fotoğrafı yükleme ve OCR analizi.
• \`POST /api/v1/questions/socratic-hint\`: Öğrenciye sıradaki yönlendirici ipucunu dönen streaming endpoint.`,
            security: `Öğrenci verilerinin gizliliği ve güvenliği **KVKK** ve çocukların korunması mevzuatlarına uygun olarak tasarlanmıştır.

### 1. Kimlik & Veri Koruma:
• MEB EBA ve e-Devlet ile güvenli giriş desteği, Veli İzin Onay Mekanizması (Parental Consent).

### 2. Güvenli İçerik & Pedagojik Filtre:
• Yapay zekanın tüm çıktıları Llama-Guard ve Türkçe küfür/uygunsuz içerik filtrelerinden geçirilir; pedagojik sınırların dışına çıkması engellenir.`
        }
    },
    {
        id: "ecochain-iot",
        title: "EcoChain Trace",
        tagline: "IoT ve Blockchain Tabanlı Otonom Karbon Ayak İzi ve Tedarik Zinciri Takibi",
        category: "Sürdürülebilirlik & IoT & Blockchain",
        categoryKey: "sustainability",
        scope: "international",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "8 Hafta",
            monetization: "SaaS Abonelik + Sertifikasyon Başı Ücret",
            opportunityScore: "%97 Fırsat Skoru",
            scope: "international"
        },
        diagramNodes: [
            { id: 1, name: "Fabrika & Lojistik IoT", type: "source", sub: "MQTT / Modbus Sayaçlar" },
            { id: 2, name: "EMQX MQTT Broker", type: "service", sub: "Go Gateway (100k msg/s)" },
            { id: 3, name: "ISO 14064 AI Calculator", type: "ai", sub: "Anlık Karbon Hesabı" },
            { id: 4, name: "TimescaleDB & Hyperledger", type: "storage", sub: "Zaman Serisi & Ledger DB" },
            { id: 5, name: "Dijital Pasaport QR Portal", type: "client", sub: "AB CBAM Uyumlu Web App" }
        ],
        step1: {
            marketGap: `Avrupa Birliği'nin kabul ettiği CBAM (Sınırda Karbon Düzenleme Mekanizması) uyarınca ihracatçı şirketler ürettikleri her ürünün karbon emisyonunu kanıtlamak zorundadır. Ancak mevcut şirketler karbon emisyonlarını Excel tabloları ve beyan usulü tahminlerle yönetmektedir. Bu durum 'Greenwashing' (yeşil aklama) davalarına ve ağır gümrük cezalarına neden olmaktadır. Pazarda, lojistik araçlarından ve fabrika sensörlerinden canlı veri toplayan, değiştirilemez şekilde doğrulayan ve otomatik AB uyumlu sertifika üreten entegre bir otonom çözüm bulunmamaktadır. EcoChain Trace bu açığı kapatır.`,
            description: `EcoChain Trace, fabrikalardaki IoT sensörleri ve lojistik araçları ile entegre olarak ürün bazlı karbon ayak izini canlı hesaplayan SaaS platformudur.

**Temel Yetenekler & Özellikler:**
• **IoT Sensör Entegrasyonu**: Fabrikadaki elektrik, gaz ve yakıt sayaçlarından Modbus/MQTT protokolleriyle canlı emisyon verisi çeker.
• **Değiştirilemez Emisyon Pasaportu (Digital Product Passport)**: Ürünün ham maddeden son tüketiciye kadar olan karbon serüvenini blok zincirde depolayarak QR kodlu dijital pasaport oluşturur.
• **AB CBAM / ISO 14064 Uyumlu Raporlama**: Gümrük idarelerine tek tıkla resmi onaylı karbon emisyon raporu sunar.
• **AI Destekli Emisyon Optimizasyonu**: Fabrika yöneticilerine üretim vardiyalarını yeşil enerji saatlerine kaydırma önerileri sunar.`,
            tags: ["Go", "MQTT", "Hyperledger Fabric", "TimescaleDB", "React", "Python"]
        },
        step2: {
            architecture: `EcoChain Trace, binlerce sensörden gelen yoğun veri akışını işlemek için **Event Streaming & Enterprise Blockchain** mimarisi kullanır.

### 1. Sistem Katmanları:
• **IoT Gateway (Go / EMQX MQTT Broker)**: Fabrika ve lojistik araçlarından gelen MQTT/CoAP mesajlarını saniyede 100k paket kapasitesiyle karşılar.
• **Data Ingestion Engine (Apache Kafka)**: Verileri doğrular, birleştirir ve analiz servislerine dağıtır.
• **Carbon Calculation Engine (Python / NumPy)**: ISO 14064 standartlarına göre emisyon katsayılarıyla anlık hesaplama yapar.
• **Private Ledger Layer (Hyperledger Fabric)**: Kurumsal ve gizli tedarik zinciri blokzinciri.

### 2. Somut Teknoloji Yığını:
• **IoT Ingestion**: Go + EMQX MQTT Broker + Kafka
• **Backend & AI**: Python FastAPI + TimescaleDB
• **Blockchain**: Hyperledger Fabric 2.5 + Node.js SDK

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`facilities\` (id, company_name, country, grid_emission_factor)
• \`iot_devices\` (id, facility_id FK, meter_type, modbus_slave_id, is_active)
• \`emission_readings\` (time, device_id FK, kwh_consumed, m3_gas, co2_kg_equiv)

### 4. API Kontratları:
• \`POST /api/v1/iot/telemetry\`: MQTT sensör veri alım uç noktası.
• \`GET /api/v1/passport/:qrCode\`: Ürün karbon dijital pasaport sayfası.`,
            security: `Endüstriyel casusluk ve veri manipülasyonuna karşı **Endüstriyel IoT Güvenliği** uygulanır.

### 1. Cihaz İzolasyonu & Donanımsal mTLS:
• Tüm IoT sayaçları X.509 istemci sertifikaları ile mTLS üzerinden şifreli haberleşir.`
        }
    },
    {
        id: "kvkk-secops-agent",
        title: "KVKK SecOps Agent",
        tagline: "Yazılım Kaynak Kodlarında ve Veritabanlarında Otomatik KVKK, VERBİS ve BDDK Veri Sızıntısı Denetim Ajanı",
        category: "DevOps & Yazılım Geliştirme Araçları",
        categoryKey: "devops",
        scope: "national",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "6 Hafta",
            monetization: "B2B SaaS / CI/CD Pipeline Lisansı + Kurumsal Denetim Paketi",
            opportunityScore: "%96 Fırsat Skoru",
            scope: "national"
        },
        diagramNodes: [
            { id: 1, name: "GitHub / GitLab CI/CD", type: "source", sub: "Git Commit & Pull Request" },
            { id: 2, name: "AST Parser & Secret Scanner", type: "service", sub: "Go AST + Regex Motoru" },
            { id: 3, name: "KVKK Türkçe NLP Ajanı", type: "ai", sub: "BERTurk PII Detection (T.C., IBAN)" },
            { id: 4, name: "PostgreSQL & ClickHouse", type: "storage", sub: "Uyum Raporları & Audit Log" },
            { id: 5, name: "VERBİS Envanter Dashboard", type: "client", sub: "React / D3.js Veri Akış Şeması" }
        ],
        step1: {
            marketGap: `Türkiye'de Kişisel Verileri Koruma Kanunu (KVKK) ve BDDK regülasyonları uyarınca, şirketlerin kullanıcıların T.C. Kimlik No, IBAN, kredi kartı, telefon, sağlık ve biyometrik verilerini kaynak kodlarda (Hardcoded secrets/logs), log dosyalarında veya test veritabanlarında maskesiz tutması 9 milyon TL'ye varan idari para cezalarına tabidir. Mevcut yabancı SAST araçları (SonarQube, Snyk vb.) İngilizce PII formatlarına odaklanır; Türkçe isim-soyisim, T.C. Kimlik No algoritması doğrulaması, Türk bankacılık IBAN formatı veya e-Devlet log kalıplarını tanıyamaz. KVKK SecOps Agent, CI/CD süreçlerine entegre olarak kodları ve veritabanı şemalarını tarar, Türkçe PII sızıntılarını PR aşamasında bloke eder ve otomatik VERBİS Kişisel Veri Envanteri raporu üretir.`,
            description: `KVKK SecOps Agent, geliştirme ekiplerinin yazılım yaşam döngüsüne (DevSecOps) entegre olan yapay zeka destekli bir veri koruma ve regülasyon denetim aracıdır.

**Temel Yetenekler & Özellikler:**
• **PR Seviyesinde Türkçe PII Yakalama**: Git commit'lerinde veya test script'lerinde unutulmuş T.C. Kimlik No, IBAN, telefon ve açık adres bilgilerini BERTurk NLP modeliyle anında yakalar.
• **Algoritmik T.C. & IBAN Doğrulaması**: Yalnızca 11 haneli sayıları değil, T.C. Kimlik No algoritma kuralını (1. 3. 5. 7. 9. hane kuralı) matematiksel olarak test ederek hatalı pozitifleri (False Positive) eler.
• **Otomatik VERBİS Envanter Çıkarımı**: Veritabanı tablolarını ve ORM modellerini tarayarak şirketin hangi tabloda hangi kişisel veriyi tuttuğunu gösteren resmi VERBİS uyum tablosu oluşturur.
• **Otomatik Maskeleme ve Pseudonymization Önerisi**: Loglara basılan kişisel verileri kod seviyesinde otomatik maskeleyecek (örn: \`tc.mask()\`) Pull Request düzeltme önerileri açar.`,
            tags: ["Go", "Python", "BERTurk", "AST Parsing", "GitHub Actions", "KVKK / BDDK Uyumlu", "Docker"]
        },
        step2: {
            architecture: `KVKK SecOps Agent, kaynak kodları yerel ortamdan dışarı çıkarmadan incelemek için **On-Premise CLI & Sandboxed Pipeline** mimarisi kullanır.

### 1. Sistem Katmanları:
• **Code Ingestion & AST Parser (Go)**: TypeScript, Java, Python, Go ve C# kaynak kodlarını Soyut Sözdizim Ağacı'na (AST) dönüştürerek değişken isimlerini ve log çağrılarını ayıklar.
• **Turkish PII NLP Engine (Python / ONNX - BERTurk)**: Kod yorumlarını, string literallerini ve SQL seed dosyalarını tarayan Türkçe varlık ismi tanıma (NER) motoru.
• **Database Schema Inspector (Go)**: PostgreSQL, MySQL ve Oracle şemalarını inceleyen veri sınıflandırma servisi.
• **Web Console (React + Vite)**: VERBİS envanter matrisini ve açık güvenlik risklerini görselleştiren dashboard.

### 2. Somut Teknoloji Yığını:
• **CLI & Parser**: Go (tree-sitter / go/ast)
• **NLP & NER**: Python + ONNX Runtime (HuggingFace dbmdz/bert-base-turkish-cased)
• **Veritabanı**: PostgreSQL 16 + Redis + ClickHouse

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`repositories\` (id, repo_url, default_branch, compliance_score, last_scan_at)
• \`pii_findings\` (id, repo_id FK, file_path, line_number, pii_type, snippet_masked, severity)
• \`verbis_inventory_items\` (id, data_category, processing_purpose, legal_ground, retention_period)

### 4. API Kontratları:
• \`POST /api/v1/scans/trigger\`: CI/CD webhook üzerinden tarama başlatma.
• \`GET /api/v1/reports/verbis-export.xlsx\`: Resmi VERBİS formatında Excel raporu indirme.`,
            security: `Kaynak kodlar ve şirket sırları en yüksek gizlilikle işlenmelidir.

### 1. Kod İzolasyonu (Zero-Cloud Storage):
• Taranan kaynak kodlar asla sunucuya yüklenmez; tüm analiz geliştiricinin makinesinde veya müşterinin kendi Kubernetes kümesinde (On-Premise) çalışır.

### 2. Secret Redaction:
• Raporlarda bulunan PII örnekleri ve token'lar veritabanına yazılmadan önce otomatik SHA-256 ile tuzlanarak maskelenir.`
        }
    },
    {
        id: "designsystem-ai",
        title: "DesignSync AI",
        tagline: "Figma Tasarımlarını Çoklu Framework (React, Vue, Tailwind, Flutter) Koduna Dönüştüren Otonom Tasarım Sistemi Ajanı",
        category: "Web & Ürün Tasarımı",
        categoryKey: "design",
        scope: "international",
        meta: {
            difficulty: "Orta Düzey",
            mvpTime: "5 Hafta",
            monetization: "Tasarım Ekibi Başına Aylık SaaS ($29/tasarımcı/ay) + Enterprise Sync",
            opportunityScore: "%95 Fırsat Skoru",
            scope: "international"
        },
        diagramNodes: [
            { id: 1, name: "Figma REST & Plugin API", type: "source", sub: "Auto-Layout & Design Tokens" },
            { id: 2, name: "Vector & Token Parser", type: "service", sub: "TypeScript + AST Generator" },
            { id: 3, name: "Component Synthesis AI", type: "ai", sub: "Tailwind / React Code Synthesis" },
            { id: 4, name: "PostgreSQL & GitHub Sync", type: "storage", sub: "Bileşen Sürümleme & PR Açıcı" },
            { id: 5, name: "Storybook & Canlı Önizleme", type: "client", sub: "Next.js / Canlı Tasarım Paneli" }
        ],
        step1: {
            marketGap: `Ürün ekiplerinde tasarımcıların Figma'da çizdiği arayüz bileşenlerinin (Buton, Modal, Form vb.) yazılımcılar tarafından koda dökülmesi sürecinde sürekli stil kaymaları, tutarsız padding/renk kullanımları ve haftalar süren 'Design QA' revizyonları yaşanır. Pazardaki mevcut 'Figma to Code' araçları çoğunlukla okunması imkansız 'Spaghetti HTML/CSS' ve mutlak konumlandırmalı (Absolute Position) kodlar üretir; gerçek yazılımcıların istediği temiz Clean Code, Tailwind sınıfları, TypeScript tipleri ve erişilebilir (WAI-ARIA) bileşen yapılarını kuramaz. DesignSync AI, Figma dosyasındaki Auto-Layout ve Token hiyerarşisini analiz ederek doğrudan GitHub reponuza Storybook uyumlu, temiz React, Vue ve Flutter bileşen kodları gönderir.`,
            description: `DesignSync AI, tasarım ve yazılım ekipleri arasındaki köprüyü otomatikleştiren yapay zeka destekli bir tasarım-kod senkronizasyon platformudur.

**Temel Yetenekler & Özellikler:**
• **Figma'dan Temiz React/Tailwind Koduna**: Auto-Layout kurallarını modern flexbox ve grid Tailwind sınıflarına sıfır kayıpla dönüştürür.
• **Design Tokens İki Yönlü Senkronizasyonu**: Renk, tipografi ve boşluk değişkenlerini CSS Variables, Tailwind Config ve Style Dictionary formatında otomatik günceller.
• **Otomatik WAI-ARIA Erişilebilirlik Enjeksiyonu**: Butonlara, dropdown'lara ve formlara ekran okuyucu uyumlu ARIA etiketlerini ve klavye navigasyonunu otomatik ekler.
• **GitHub PR ile Otomatik Bileşen Güncellemesi**: Tasarımcı Figma'da bir butonu güncellediğinde doğrudan ilgili repoya Pull Request açarak kodu günceller.`,
            tags: ["TypeScript", "Figma API", "React", "TailwindCSS", "Storybook", "Next.js", "Design Systems"]
        },
        step2: {
            architecture: `DesignSync AI, tasarım ağacını semantik kod bileşenlerine dönüştürmek için **AST Compilation & Semantic Synthesis** mimarisini kullanır.

### 1. Sistem Katmanları:
• **Figma Ingestion Engine (TypeScript / Figma REST API)**: Figma dosyasının düğüm hiyerarşisini ve Auto-Layout kısıtlarını çeker.
• **Semantic Normalizer (Rust / TypeScript)**: Çizim katmanlarını semantik HTML elemanlarına (button, nav, section, input) eşleştiren kural motoru.
• **Code Generation Pipeline (Python / LLM Code Synthesis)**: TypeScript, Tailwind, Vue 3 ve Flutter kodlarını derleyen yapay zeka motoru.
• **Git Automation Service (Go)**: GitHub / GitLab API'leri üzerinden otomatik PR açan ve Storybook derleyen servis.

### 2. Somut Teknoloji Yığını:
• **Ingestion & Parser**: TypeScript + Figma Plugin API
• **Backend**: Python FastAPI + Node.js
• **Frontend**: Next.js 14 + TailwindCSS + Storybook

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`figma_workspaces\` (id, team_id, figma_file_key, last_synced_version)
• \`design_tokens\` (id, workspace_id FK, token_category, token_name, value, css_variable)
• \`generated_components\` (id, figma_node_id, component_name, react_code, flutter_code)

### 4. API Kontratları:
• \`POST /api/v1/sync/figma-webhook\`: Figma dosya güncelleme webhook alımı.
• \`GET /api/v1/tokens/export.json\`: Style Dictionary formatında token indirme.`,
            security: `Figma tasarımları ve şirket ürün sırları **Kurumsal Fikri Mülkiyet Koruması** ile saklanır.

### 1. OAuth2 İzin Sınırlandırması:
• Figma API anahtarları yalnızca ilgili dosyalara salt-okunur erişimle sınırlandırılır; müşterinin diğer projelerine erişilmez.`
        }
    },
    {
        id: 'servis-takip-veli',
        title: 'Servis Takip Veli',
        tagline: 'Okul Servislerinde Çocuğun İniş-Biniş Doğrulamasını Çevrimdışı Çalışarak Yapan ve Veliye Anlık Bildiren Mobil Uygulama',
        category: 'Mobil Uygulama',
        categoryKey: 'mobile',
        scope: 'national',
        meta: {
            difficulty: 'Orta Düzey',
            mvpTime: '6 Hafta',
            monetization: 'Servis Firması Aboneliği + Okul Kurumsal Paketi',
            opportunityScore: '%90 Fırsat Skoru',
            scope: 'national'
        },
        diagramNodes: [
            { id: 1, name: 'Öğrenci NFC Kartı / BLE Etiketi', type: 'source', sub: 'Temassız Kimlik' },
            { id: 2, name: 'Hostes Cihazı Uygulaması', type: 'service', sub: 'Flutter + Yerel Kuyruk' },
            { id: 3, name: 'Anomali & Gecikme Tahmini', type: 'ai', sub: 'Rota Sapma Analizi' },
            { id: 4, name: 'Şifreli Yerel Depo', type: 'storage', sub: 'SQLCipher + Sunucu Senkronu' },
            { id: 5, name: 'Veli Uygulaması', type: 'client', sub: 'Push Bildirim + Canlı Harita' }
        ],
        step1: {
            marketGap: 'Türkiye\'de milyonlarca öğrenci okul servisiyle taşınır ve veliler çocuklarının servise binip binmediğini genellikle hostesle yapılan telefon görüşmesiyle öğrenir. Servis içinde unutulan çocuk vakaları basına yansımaya devam etmektedir. Mevcut servis takip uygulamaları yalnızca aracın GPS konumunu gösterir; asıl kritik olan "bu çocuk bu araca bindi mi, indi mi" bilgisini doğrulamaz. Ayrıca bu uygulamalar sürekli internet varsayar; oysa servisler kapsama zayıf güzergâhlardan geçer ve bağlantı koptuğunda kayıt hiç tutulmaz. Bir de çocuk verisi KVKK kapsamında özel korunması gereken bir kategoridir ve konum geçmişinin süresiz saklanması ciddi bir risktir. Servis Takip Veli bu üç boşluğu birlikte kapatır.',
            description: 'Uygulama, hostes cihazı ve veli telefonu olmak üzere iki taraftan oluşur; çevrimdışı çalışacak biçimde tasarlanmıştır.\n\n**Temel İşlevler & Özellikler:**\n• **Temassız İniş-Biniş Doğrulama**: Öğrenci NFC kartını okutur veya BLE etiketi otomatik algılanır; hostes onaylar. İnternet olmasa da kayıt yerelde tutulur.\n• **Araçta Kalan Çocuk Kontrolü**: Sefer sonunda binip inmeyen öğrenci varsa hostes cihazı ekranı kilitleyip sesli alarm verir; kontrol yapılmadan sefer kapatılamaz.\n• **Veliye Anlık Bildirim**: Bağlantı geldiği anda kuyruk boşalır ve veliye "bindi/indi" bildirimi ulaşır; gecikme durumunda tahmini varış paylaşılır.\n• **Sınırlı Konum Saklama**: Konum izi yalnızca sefer süresince tutulur, sefer bitiminden kısa süre sonra otomatik silinir.',
            tags: ['Flutter', 'SQLCipher', 'NFC', 'BLE', 'Firebase Cloud Messaging', 'Go']
        },
        step2: {
            architecture: 'Sistem, bağlantının varlığını hiçbir zaman varsaymayan **çevrimdışı öncelikli (offline-first)** bir mobil mimariye dayanır.\n\n### 1. Sistem Katmanları:\n• **Hostes App (Flutter)**: NFC/BLE okuma, sefer durum makinesi ve yerel olay kuyruğu. Tüm işlemler önce yerele yazılır, sonra senkronize edilir.\n• **Sync Service (Go)**: Olay tabanlı senkronizasyon; her olayın istemci tarafından üretilmiş benzersiz kimliği vardır, bu sayede tekrar gönderim çift kayıt oluşturmaz (idempotent).\n• **Notification Service (Go + FCM)**: Veli bildirimlerini sıralı ve tekilleştirilmiş biçimde gönderir.\n• **Parent App (Flutter)**: Canlı harita, sefer geçmişi ve bildirim tercihleri.\n\n### 2. Veritabanı Mimarisi:\n• **SQLCipher (cihazda)**: Şifreli yerel olay kuyruğu ve öğrenci listesi.\n• **PostgreSQL + PostGIS**: Seferler, duraklar, iniş-biniş olayları ve kısa ömürlü konum izleri.\n• **Redis**: Aktif sefer durumu ve bildirim tekilleştirme anahtarları.',
            security: 'Uygulama çocuklara ait konum ve devam verisi işlediği için KVKK\'nın en hassas kategorisindedir; mimari **saklama süresini sınırlamak** üzerine kuruludur.\n\n### 1. Güvenlik Önlemleri & Standartlar:\n• **Otomatik Veri İmhası**: Ham konum izleri sefer bitiminden 24 saat sonra otomatik silinir; geriye yalnızca "bindi/indi" olayları ve süre özeti kalır.\n• **Cihazda Şifreleme**: Hostes cihazındaki öğrenci listesi ve kuyruk SQLCipher ile AES-256 şifrelenir; cihaz kaybında uzaktan silme tetiklenebilir.\n• **Veli-Öğrenci Bağı Doğrulaması**: Bir velinin yalnızca kendi çocuğunu görebilmesi, okul tarafından onaylanan bağ kaydıyla ve satır düzeyi güvenlikle (RLS) garanti altına alınır.\n• **Rıza ve Şeffaflık**: Hangi verinin ne kadar süre tutulduğu uygulama içinde açıkça gösterilir; veli dilediğinde geçmiş kayıtların silinmesini talep edebilir.'
        }
    }
];
