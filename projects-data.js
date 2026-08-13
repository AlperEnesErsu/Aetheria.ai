const PROJECTS_DATABASE = [
    // =========================================================================
    // 1. SAĞLIK TEKNOLOJİLERİ & YAPAY ZEKA (health-ai)
    // =========================================================================
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
        id: "genomed-pipeline",
        title: "GenoMed Cloud",
        tagline: "Yüksek Başarımlı Biyoinformatik Genomik Varyant Analizi ve İlaç Yanıt Tahmin Platformu",
        category: "Sağlık Teknolojileri & Yapay Zeka",
        categoryKey: "health-ai",
        scope: "international",
        meta: {
            difficulty: "Uzman Düzey",
            mvpTime: "10 Hafta",
            monetization: "Genom Başına İşlem Ücreti (B2B SaaS) + Onkoloji Laboratuvar Lisansı",
            opportunityScore: "%96 Fırsat Skoru",
            scope: "international"
        },
        diagramNodes: [
            { id: 1, name: "NGS FASTQ / BAM Verisi", type: "source", sub: "Illumina / PacBio Cihazları" },
            { id: 2, name: "Nextflow Workflow Engine", type: "service", sub: "GATK4 + DeepVariant" },
            { id: 3, name: "GNN Patoloji & İlaç AI", type: "ai", sub: "Varyant Etki Sınıflandırması" },
            { id: 4, name: "DuckDB & TileDB", type: "storage", sub: "Sütun Tabanlı VCF Deposu" },
            { id: 5, name: "Web IGV Genom Tarayıcısı", type: "client", sub: "React + WebGL Chromosome View" }
        ],
        step1: {
            marketGap: `Yeni Nesil Dizileme (NGS) teknolojilerinin ucuzlamasıyla hastaların tüm genom verileri (WGS/WES) saatler içinde çıkarılabilmektedir; ancak ham genetik veriden (FASTQ/BAM) klinik anlam çıkarmak günler sürmektedir. Biyoinformatik boru hatları dağınık komut satırı araçlarından (GATK, Samtools, BWA) oluşur ve ölçeklenemez. Ayrıca onkologlar için genetik mutasyonların hangi kemoterapi veya akıllı ilaca dirençli olduğunu tahmin eden entegre açıklanabilir modeller eksiktir. GenoMed Cloud, 100 GB'lık ham genom verisini 45 dakikada işleyen, VCF varyantlarını ClinVar ve PharmGKB veritabanlarıyla zenginleştiren bulut tabanlı bir hassas tıp (Precision Medicine) platformudur.`,
            description: `GenoMed Cloud, onkoloji merkezleri ve genetik tanı laboratuvarları için uçtan uca otomatik varyant çağırma ve klinik raporlama platformudur.

**Temel Yetenekler & Özellikler:**
• **GPU Hızlandırmalı Varyant Çağırma**: DeepVariant ve GATK4 algoritmalarını paralel konteynerlerde çalıştırarak germline ve somatik mutasyonları rekor sürede tespit eder.
• **Farmakogenomik İlaç Etkileşim Tahmini**: Hastanın CYP450 ve diğer enzim genotiplerine göre ilaç metabolizma hızını ve toksisite riskini hesaplar.
• **Etkileşimli Genom Gezgini (IGV Web)**: Kromozom haritası üzerinde mutasyon noktalarını WebGL ile sıfır kasmayla görselleştirir.
• **ACMG Standartlarında Otomatik Klinik Rapor**: Patolojik, Olası Patolojik ve VUS (Belirsiz Önemde Varyant) sınıflandırmasını hekim onayına hazır PDF olarak derler.`,
            tags: ["Python", "Nextflow", "Rust", "GATK4", "FastAPI", "React", "HIPAA Uyumlu"]
        },
        step2: {
            architecture: `GenoMed Cloud, terabaytlarca genomik veriyi bulutta elastik işlemek için **Serverless HPC & Event-Driven Batch Pipeline** mimarisi kullanır.

### 1. Sistem Katmanları:
• **Pipeline Orchestrator (Nextflow / AWS Batch)**: Genom boru hattı adımlarını izole Docker konteynerlerinde CPU/GPU optimizasyonuyla koşturur.
• **Variant Annotation Engine (Rust / htslib)**: Milyonlarca SNP ve Indel varyantını ClinVar, gnomAD ve dbSNP ile mikrosaniyede eşleştirir.
• **Drug-Gene Interaction AI (Python / PyTorch Geometric)**: Protein yapı modelleri ve heterojen bilgi grafikleriyle ilaç direnç skorlaması yapar.
• **Frontend Visualization (React 18 + igv.js + WebGL)**: Kromozom kapsama alanlarını canlı render eden web arayüzü.

### 2. Somut Teknoloji Yığını:
• **Orkestrasyon**: Nextflow + Kubernetes + AWS Batch
• **Core Engine**: Rust + Python FastAPI
• **Veri Katmanı**: TileDB (Genomik Matrisler) + DuckDB + PostgreSQL

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`sequencing_samples\` (id, sample_barcode, sequencing_type, status, fastq_s3_uri)
• \`called_variants\` (id, sample_id FK, chromosome, position, ref_allele, alt_allele, acmg_class)
• \`drug_recommendations\` (id, sample_id FK, drug_name, efficacy_score, evidence_level)

### 4. API Kontratları:
• \`POST /api/v1/pipelines/run\`: Yeni genom analiz boru hattı tetikleme.
• \`GET /api/v1/variants/export-vcf\`: Filtrelenmiş VCF dosyası dışa aktarma.`,
            security: `Genomik veriler değiştirilemez kişisel kimlik bilgileridir; **HIPAA, GDPR ve ISO 27701** seviyesinde korunur.

### 1. Zero-Knowledge Veri Şifreleme:
• Genom FASTQ/BAM dosyaları müşteri özel anahtarlarıyla (Customer-Managed Encryption Keys - AWS KMS) AES-256 ile şifrelenir.

### 2. Ayrılmış Kiracı Mimarisi (Tenant Isolation):
• Her laboratuvarın verisi ve hesaplama pod'ları Kubernetes namespace ve izole VPC düzeyinde birbirinden ayrılır.`
        }
    },
    {
        id: "pharmascan-ai",
        title: "PharmaScan AI (İTS & Karekod Entegrasyonlu)",
        tagline: "Eczaneler ve Hastaneler İçin İlaç Takip Sistemi (İTS) Uyumlu Otonom Etkileşim ve Yan Etki Risk Ajanı",
        category: "Sağlık Teknolojileri & Yapay Zeka",
        categoryKey: "health-ai",
        scope: "national",
        meta: {
            difficulty: "Orta Düzey",
            mvpTime: "5 Hafta",
            monetization: "Eczane Başı Aylık Abonelik (B2B SaaS) + Medula Entegrasyon Eklentisi",
            opportunityScore: "%95 Fırsat Skoru",
            scope: "national"
        },
        diagramNodes: [
            { id: 1, name: "Reçete / İTS Karekod", type: "source", sub: "2D Barkod & e-Reçete No" },
            { id: 2, name: "İTS & Medula Gateway", type: "service", sub: "Sağlık Bakanlığı SOAP / REST API" },
            { id: 3, name: "Farmakolojik Çapraz AI", type: "ai", sub: "İlaç-İlaç & İlaç-Besin Etkileşimi" },
            { id: 4, name: "PostgreSQL & Redis", type: "storage", sub: "TİTCK Prospektüs & Dozaj DB" },
            { id: 5, name: "Eczacı & Hasta Portali", type: "client", sub: "Flutter Tablet & WhatsApp Ajanı" }
        ],
        step1: {
            marketGap: `Türkiye'de her gün 1.2 milyondan fazla reçete yazılmakta ve çoklu ilaç kullanımı (Polifarmasi) sebebiyle önlenebilir ilaç-ilaç etkileşimleri acil servis başvurularının %12'sini oluşturmaktadır. Eczacıların kullandığı mevcut Medula ve İTS yazılımları yalnızca faturalandırma ve karekod bildirimi yapar; hastanın geçmiş reçetelerindeki aktif maddelerle yeni yazılan ilacın ölümcül etkileşimlerini, besin kısıtlamalarını (örn: Greyfurt-Statin etkileşimi) veya böbrek/karaciğer yetmezliği dozaj uyarılarını sesli/görsel olarak özetlemez. PharmaScan AI, İTS 2D karekodunu kameradan okuyarak saniyeler içinde prospektüs ve farmakolojik veri tabanlarını tarar, eczacıya ve hastanın WhatsApp'ına 'Bu iki ilacı aynı anda içmeyiniz, 3 saat ara veriniz' uyarısını iletir.`,
            description: `PharmaScan AI, reçeteli ve reçetesiz ilaçların çapraz etkileşim risklerini tespit eden ve hastaya özel akıllı kullanım planı oluşturan yapay zeka eczacılık asistanıdır.

**Temel Yetenekler & Özellikler:**
• **Anlık Karekod ve e-Reçete Taraması**: İTS karekodunu veya SGK Medula e-Reçete numarasını kameradan okuyarak tüm aktif maddeleri otomatik listeler.
• **Kritik Çapraz Etkileşim Alarmı**: Kalp, tansiyon, diyabet ve antibiyotik ilaçları arasındaki tehlikeli etkileşimleri renk kodlu uyarılarla (Kırmızı/Sarı) gösterir.
• **Hastaya Özel WhatsApp Kullanım Takvimi**: Yaşlı ve kronik hastalar için ilaçların sabah/öğle/akşam aç-tok kullanım saatlerini anlaşılır Türkçe WhatsApp mesajı ve sesli not olarak iletir.
• **TİTCK Geri Çekme & Sahte İlaç Kontrolü**: Sağlık Bakanlığı İTS veritabanından ilacın son kullanma tarihi, toplatma kararı ve orijinalliğini doğrular.`,
            tags: ["Python", "FastAPI", "Flutter", "İTS Entegrasyonu", "PostgreSQL", "KVKK Uyumlu", "TÜBİTAK 1512"]
        },
        step2: {
            architecture: `PharmaScan AI, hızlı sorgu yanıtları ve yüksek güvenilirlik için **Microservices & In-Memory Graph Caching** mimarisine dayanır.

### 1. Sistem Katmanları:
• **Barcode Scanner & Ingestion (Go / WebAssembly)**: Eczane barkod okuyucusundan gelen GS1-128 karekod verisini milisaniyede ayrıştırır.
• **Pharmacology Graph Engine (Python / NetworkX + Neo4j)**: 45.000 aktif madde ve 120.000 farmakolojik etkileşim kuralını barındıran çizge motoru.
• **Medula & İTS SOAP Gateway (Go)**: SGK ve Sağlık Bakanlığı protokollerini güvenle köprüleyen entegrasyon katmanı.
• **Mobile/Tablet Interface (Flutter)**: Eczane bankosunda çalışan dokunmatik tablet uygulaması.

### 2. Somut Teknoloji Yığını:
• **Backend**: Python FastAPI + Go 1.22
• **Frontend**: Flutter + TypeScript / React
• **Veritabanları**: PostgreSQL 16 + Redis Enterprise + Neo4j

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`drugs\` (its_barcode PK, commercial_name, active_ingredients_json, manufacturer, atc_code)
• \`interactions\` (id, substance_a, substance_b, severity_level, clinical_effect_tr, management_tr)
• \`prescriptions\` (id, pharmacy_gln FK, patient_hash, date_issued, drugs_list_json)

### 4. API Kontratları:
• \`POST /api/v1/scan/its-barcode\`: Karekod okuma ve anlık prospektüs kontrolü.
• \`POST /api/v1/prescriptions/check-safety\`: Reçetedeki tüm ilaçların çapraz güvenlik denetimi.`,
            security: `Hasta reçete ve teşhis bilgileri **KVKK Md. 6** uyarınca özel nitelikli kişisel veridir.

### 1. Hasta Veri Maskeleme:
• Reçete numarası ve T.C. Kimlik No sunucuda asla düz metin saklanmaz; tek yönlü SHA-256 HMAC ile şifrelenir.

### 2. Eczane Güvenliği & GLN Doğrulama:
• Sistem yalnızca Sağlık Bakanlığı GLN (Global Location Number) ruhsatına sahip yetkili eczanelerin IP ve e-İmzalarıyla erişimine açıktır.`
        }
    },

    // =========================================================================
    // 2. WEB3, BLOCKCHAIN & GÜVENLİK (web3)
    // =========================================================================
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
        id: "crossbridge-zk",
        title: "CrossBridge ZK",
        tagline: "Sıfır Bilgi İspatlı (ZK-SNARK) Güvensiz ve Çoklu Ağ Varlık Köprüleme Protokolü",
        category: "Web3, Blockchain & Güvenlik",
        categoryKey: "web3",
        scope: "international",
        meta: {
            difficulty: "Uzman Düzey",
            mvpTime: "12 Hafta",
            monetization: "Köprüleme İşlem Komisyonu (%0.05) + Kurumsal B2B Likidite Havuzu",
            opportunityScore: "%97 Fırsat Skoru",
            scope: "international"
        },
        diagramNodes: [
            { id: 1, name: "Kaynak Ağ Kilit Kontratı", type: "source", sub: "Ethereum / Arbitrum EVM" },
            { id: 2, name: "ZK-Light Client Prover", type: "service", sub: "Rust (SP1 / Risc0 zkVM)" },
            { id: 3, name: "AI Liquidity Rebalancer", type: "ai", sub: "Dinamik Kayma & Havuz Dengeleyici" },
            { id: 4, name: "PostgreSQL & IPFS", type: "storage", sub: "İşlem Durumları & ZK Kanıt Deposu" },
            { id: 5, name: "Hedef Ağ Mint Kontratı", type: "client", sub: "Optimism / Solana Doğrulayıcı" }
        ],
        step1: {
            marketGap: `Kripto para dünyasındaki en büyük hack vakaları (Ronin, Wormhole, Nomad köprüleri - toplam 2.5 milyar $ kayıp) merkezi multisig veya güvenilir oracle tabanlı köprü mimarilerinden kaynaklanmıştır. İki ağ arasında varlık transfer ederken 5 kişilik doğrulayıcı anahtarlarına güvenmek Web3'ün merkeziyetsizlik felsefesine aykırıdır. Pazarın ihtiyacı olan çözüm, hiçbir insan veya sunucu otoritesine güvenmeyen, matematiksel **Sıfır Bilgi Kanıtları (ZK-Proofs / ZK-Light Clients)** ile kaynak ağın blok başlığını hedef ağda doğrulayan kriptografik bir köprüdür. CrossBridge ZK, transfer işlemlerini zkVM ile kanıtlayarak köprüleme hack riskini matematiksel olarak sıfıra indirir.`,
            description: `CrossBridge ZK, EVM ve non-EVM ağlar arasında sıfır güven (Trustless) ve anında kesinlik (Instant Finality) ile varlık transferi sağlayan ZK-SNARK destekli yeni nesil köprüleme altyapısıdır.

**Temel Yetenekler & Özellikler:**
• **ZK-Light Client Doğrulaması**: Kaynak ağın konsensüs durumunu zkVM (Risc0/SP1) kanıtlarıyla hedef ağdaki akıllı sözleşmeye aktarır; multisig zaafiyetlerini yok eder.
• **Yapay Zeka Destekli Likidite Dengeleme**: Farklı ağlardaki havuz dengesini tahmin ederek arbitraj ve slippage (kayma) maliyetlerini %70 düşürür.
• **1-Dakika Altı Köprüleme Süresi**: İyimser (Optimistic) köprülerdeki 7 günlük bekleme süresi yerine ZK kanıtı doğrulandığı an fonları serbest bırakır.
• **Geliştirici Cross-Chain Mesajlaşma SDK'sı**: DApp geliştiricilerinin tek satır kodla zincirler arası NFT ve veri taşımasını sağlayan TypeScript/Solidity kütüphanesi.`,
            tags: ["Rust", "ZK-SNARKs", "Risc0", "Solidity", "TypeScript", "Ethers.js", "Web3"]
        },
        step2: {
            architecture: `CrossBridge ZK, ağır kriptografik kanıtları yüksek verimle üretmek için **Modular zkRollup & Prover Cluster** mimarisini kullanır.

### 1. Sistem Katmanları:
• **Consensus Witness Layer (Rust / SP1 zkVM)**: Kaynak zincirin Sync Committee imzalarını ve Merkle Patricia Trie kanıtlarını çıkaran hafif istemci motoru.
• **Prover Farm (C++ / CUDA / Rust)**: ZK-SNARK kanıtlarını GPU kümelerinde 30 saniyenin altında üreten donanım hızlandırmalı prover kümesi.
• **On-Chain Verifier Contract (Solidity / Plonk)**: Hedef zincirde ZK kanıtını 200.000 gas maliyetiyle doğrulayan akıllı sözleşme.
• **Liquidity Management API (Go / Python)**: Havuz derinliğini yöneten piyasa yapıcı yapay zeka servisi.

### 2. Somut Teknoloji Yığını:
• **ZK Engine**: SP1 (Succinct) + Halo2 / Plonky3 (Rust)
• **Smart Contracts**: Solidity 0.8.26 + Foundry
• **Backend**: Go + PostgreSQL 16 + Redis

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`bridge_transfers\` (deposit_tx_hash PK, src_chain, dst_chain, amount, token_address, proof_status)
• \`zk_proof_tasks\` (task_id, prover_node_id, proof_bytes, generation_time_ms, verified_on_chain)
• \`liquidity_pools\` (chain_id, token_symbol, available_liquidity, utilization_rate)

### 4. API Kontratları:
• \`POST /api/v1/bridge/quote\`: Anlık köprüleme gas ve süre tahmini.
• \`GET /api/v1/proofs/status/:txHash\`: ZK kanıt üretim ve doğrulama durumu.`,
            security: `Kriptografik soundness ve akıllı sözleşme güvenliği en üst seviyededir.

### 1. Kriptografik Doğruluk (Soundness):
• ZK devreleri bağımsız ZK güvenlik firmaları (Veridise, Zellic) tarafından formal audit testlerine tabi tutulmuştur.

### 2. Emergency Fallback Guard:
• Olası bir sıfırıncı gün ZK devre açığında likidite havuzunu güvenceye alan zaman kilitli (Timelock) acil durum sigortası.`
        }
    },
    {
        id: "troy-settle-zk",
        title: "TroySettle ZK (FAST & BKM Uyumlu)",
        tagline: "Yerli Troy Kart, BKM Express ve TCMB FAST Uyumlu ZK-Rollup Mikro-Mutabakat ve Sadakat Motoru",
        category: "Web3, Blockchain & Güvenlik",
        categoryKey: "web3",
        scope: "national",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "8 Hafta",
            monetization: "Banka/Fintek Başına Lisanslama + İşlem Başı Mikro Ücret (0.01 TL)",
            opportunityScore: "%96 Fırsat Skoru",
            scope: "national"
        },
        diagramNodes: [
            { id: 1, name: "Troy / FAST İşlem Akışı", type: "source", sub: "Bankalararası Kart Merkezi (BKM)" },
            { id: 2, name: "ZK-Rollup Batch Sequencer", type: "service", sub: "Rust + Plonky2 (10k tx/s)" },
            { id: 3, name: "Dolandırıcılık (Fraud) AI", type: "ai", sub: "Gerçek Zamanlı Ters İbraz / Anomali" },
            { id: 4, name: "PostgreSQL & Ledger DB", type: "storage", sub: "Değiştirilemez Mutabakat Kaydı" },
            { id: 5, name: "Banka & Üye İşyeri Paneli", type: "client", sub: "React / Fintek Dashboard" }
        ],
        step1: {
            marketGap: `Türkiye'de Troy kart kullanımı son bir yılda %300'ün üzerinde artarak 35 milyon adedi geçmiş, TCMB FAST sistemiyle günlük milyonlarca anlık para transferi yapılmaktadır. Ancak bankalar ve ödeme kuruluşları arasındaki gün sonu takas ve mutabakat (Clearing & Settlement) süreçleri halen geleneksel batch dosyalarıyla (EOD - End of Day) 24 saat gecikmeli yürütülmekte, bu da fintek şirketleri için yüksek teminat blokaj maliyetlerine ve mutabakat uyuşmazlıklarına yol açmaktadır. Ayrıca üye işyeri sadakat puanları banka silolarında hapsolmuştur. TroySettle ZK, binlerce mikro-işlemi sıfır bilgi kanıtlarıyla (ZK-Rollup) saniyeler içinde tek bir kriptografik özete sıkıştırarak anlık mutabakat sağlar ve işlem maliyetini %90 ucuzlatır.`,
            description: `TroySettle ZK, Türk bankacılık ve fintek ekosistemi için sıfır bilgi ispatlı, saniyede 10.000 işlem kapasiteli yerli bir takas ve anlık mutabakat katmanıdır.

**Temel Yetenekler & Özellikler:**
• **ZK-Rollup ile Anlık Mutabakat**: Gün sonu beklemeden binlerce Troy ve FAST işlemini tek bir ZK kanıtında birleştirerek bankalar arası anlık takas gerçekleştirir.
• **Ters İbraz (Chargeback) ve Sahtecilik Önleme AI**: Anormal işlem frekanslarını ve kart kopyalama modellerini milisaniyeler seviyesinde yakalar.
• **Birlikte Çalışabilir Sadakat Puanı Ağı**: Troy kart kullanıcılarının farklı mağazalardan kazandığı puanları birleştirmesini sağlayan gizlilik korumalı puan havuzu.
• **BDDK ve TCMB Mevzuat Uyumu**: Verilerin tamamen Türkiye sınırları içerisindeki yerli sunucularda işlendiği lisanslı altyapı.`,
            tags: ["Rust", "ZK-Rollup", "Plonky2", "Go", "PostgreSQL", "BDDK / TCMB Uyumlu", "TÜBİTAK 1507"]
        },
        step2: {
            architecture: `TroySettle ZK, yüksek işlem hacmi ve yasal denetlenebilirlik için **Private zkRollup & Sovereign Ledger** mimarisine dayanır.

### 1. Sistem Katmanları:
• **Transaction Sequencer (Rust / Tokio)**: Banka API'lerinden gelen FAST ve Troy işlem paketlerini saniyede 10.000 adet hızla sıralar.
• **ZK-SNARK Prover Engine (Rust / Plonky2)**: İşlem geçerliliklerini ve bakiye değişimlerini kanıtlayan donanım optimizasyonlu kriptografik motor.
• **Settlement Gateway (Go)**: TCMB ve BKM protokolleriyle entegre olan resmi mutabakat ara yüzü.
• **Bank Operations Console (React + Vite + Tailwind)**: Banka hazine ekiplerinin anlık likidite durumunu izlediği panel.

### 2. Somut Teknoloji Yığını:
• **ZK Engine**: Rust + Plonky2 (Recursive SNARKs)
• **Backend**: Go (Gin) + Rust (Sequencer)
• **Veritabanları**: PostgreSQL 16 (Partitioned) + Redis Cluster + Kafka

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`bank_participants\` (bkm_code PK, bank_name, public_key, settlement_account_iban)
• \`settlement_batches\` (batch_id PK, tx_count, total_amount_try, zk_proof_hash, finalized_at)
• \`transactions_rollup\` (id, batch_id FK, sender_iban_hash, receiver_iban_hash, amount_try, timestamp)

### 4. API Kontratları:
• \`POST /api/v1/settle/submit-tx\`: Banka işlem enjeksiyonu.
• \`GET /api/v1/batches/latest-proof\`: Son takas kanıtı ve doğrulama çıktısı.`,
            security: `Finansal egemenlik ve **BDDK Banka Bilgi Sistemleri Yönetmeliği** standartları uygulanır.

### 1. Donanımsal İmzalama:
• Takas paketleri bankaların kendi HSM (Hardware Security Module) donanımlarında mTLS 1.3 ile imzalanır.

### 2. Finansal Veri Gizliliği:
• Kart numaraları ve müşteri kimlikleri ZK devrelerinde gizlenir (Confidential Balances); yalnızca toplam mutabakat bakiyesi doğrulanır.`
        }
    },

    // =========================================================================
    // 3. BULUT ALTYAPISI & DAĞITIK SİSTEMLER (infrastructure)
    // =========================================================================
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
        id: "afad-mesh-sync",
        title: "AfetMesh Sync (AFAD & Kandilli Uyumlu)",
        tagline: "Deprem ve Afet Durumunda Baz İstasyonları Çöktüğünde Çevrimdışı P2P Bluetooth/Wi-Fi Mesh ve Dağıtık Koordinasyon Altyapısı",
        category: "Altyapı, Cloud & Performans",
        categoryKey: "infrastructure",
        scope: "national",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "7 Hafta",
            monetization: "Kamu/Belediye Lisansı + AFAD/AKUT Arama Kurtarma Donanım Hibesi",
            opportunityScore: "%98 Fırsat Skoru",
            scope: "national"
        },
        diagramNodes: [
            { id: 1, name: "Enkaz Altı & Vatandaş Cihazları", type: "source", sub: "BLE / Wi-Fi Direct Mesh" },
            { id: 2, name: "P2P Gossip Protokolü", type: "service", sub: "Rust libp2p + CRDTs" },
            { id: 3, name: "Ses & Yaşam Belirtisi AI", type: "ai", sub: "Mikrofon Frekans & Enkaz Analizi" },
            { id: 4, name: "SQLite & Yerel İHA Gateway", type: "storage", sub: "Gecikmeli Senkronizasyon DB" },
            { id: 5, name: "AFAD Kurtarma Komuta Paneli", type: "client", sub: "Offline Harita & Isı Katmanı" }
        ],
        step1: {
            marketGap: `6 Şubat Kahramanmaraş depremlerinde acı biçimde tecrübe edildiği üzere, büyük afet anlarında baz istasyonları ve elektrik şebekesi ilk dakikalarda çökmekte, enkaz altındaki vatandaşlar ve arama kurtarma ekipleri (AFAD, AKUT) saatlerce haberleşememektedir. Mevcut mesajlaşma uygulamaları (WhatsApp, Telegram vb.) internet bağlantısı olmadan çalışamaz. İnternet ve hücresel hatların tamamen yok olduğu bir senaryoda, telefonların Bluetooth Low Energy (BLE) ve Wi-Fi Direct üzerinden birbirine bağlanarak cihazdan cihaza seken (Multi-hop Mesh Network) otonom bir iletişim ağına hayati ihtiyaç vardır. AfetMesh Sync, internet olmasa dahi 500 metrelik atlamalarla enkaz altındaki konum ve sağlık durumunu kurtarma ekiplerinin dronlarına veya sahadaki kurtarıcılara iletir.`,
            description: `AfetMesh Sync, doğal afetlerde hücresel ağlar çöktüğünde telefonlar arasında kendiliğinden kurulan (Ad-Hoc) dağıtık bir kriz iletişim ve arama kurtarma altyapısıdır.

**Temel Yetenekler & Özellikler:**
• **Sıfır İnternet P2P Mesh Haberleşme**: Bluetooth LE ve Wi-Fi Direct üzerinden telefonları aktarıcı (Relay) düğüm haline getirerek mesajları 20+ atlamayla kilometrelerce öteye ulaştırır.
• **Enkaz Altı Akustik Yaşam Belirtisi AI**: Telefon mikrofonunu pasif dinlemeye alarak enkaz altındaki duvar vurma, yardım çığlığı veya nefes frekanslarını yapay zekayla tanır ve acil çağrı üretir.
• **Çatışmasız Dağıtık Veri Senkronizasyonu (CRDT)**: Farklı kurtarma ekiplerinin çevrimdışı topladığı enkaz koordinatlarını internet geldiğinde veya İHA'lar üzerinden sıfır veri kaybıyla birleştirir.
• **AFAD / Kandilli Koordinasyon Arayüzü**: Kurtarma ekiplerine enkaz altındaki tahmini kişi sayısını ve sinyal gücünü 3B ısı haritasıyla gösteren harita paneli.`,
            tags: ["Rust", "libp2p", "Bluetooth LE", "CRDT", "Flutter", "AFAD Uyumlu", "TÜBİTAK 1507"]
        },
        step2: {
            architecture: `AfetMesh Sync, merkezi sunucuların bulunmadığı felaket koşullarında çalışmak için **Delay-Tolerant Networking (DTN) & Peer-to-Peer** mimarisini kullanır.

### 1. Sistem Katmanları:
• **Mesh Transport Layer (Rust / libp2p + BLE Drivers)**: Cihazlar arası Bluetooth LE ve Wi-Fi Aware soketlerini yöneten, batarya dostu düşük enerjili taşıma katmanı.
• **Gossip & Routing Engine (Rust)**: Mesajları ağdaki düğümlere akıllıca yayan (Epidemic Routing / GossipSub) yönlendirme protokolü.
• **Acoustic AI Engine (C++ / TFLite)**: Mikrofon sinyalini işleyen ultra-hafif ses sınıflandırma modeli (TensorFlow Lite).
• **Command & Map UI (Flutter / Mapbox Offline)**: Vektör haritaları cihaz hafızasında yüklü kurtarma yönetim arayüzü.

### 2. Somut Teknoloji Yığını:
• **P2P Core**: Rust (libp2p, zerocopy)
• **Mobil İstemci**: Flutter (C++ FFI bağlayıcıları) + Android/iOS BLE Native
• **Veritabanı**: SQLite (SQLCipher) + Yjs / Automerge CRDTs

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`sos_signals\` (uuid PK, source_device_hash, lat, lon, battery_pct, trapped_count, sound_detected, hops_count)
• \`rescue_teams\` (id, team_name, current_lat, current_lon, assigned_sector)
• \`debris_registry\` (id, building_address, risk_level, survivors_detected, status)

### 4. API Kontratları:
• P2P Protobuf mesajlaşma formatı: \`message EmergencyBeacon { string device_id = 1; GeoPoint location = 2; int32 severity = 3; }\`.`,
            security: `Afet anlarında sahte yardım çağrıları ve panik yayılmasını engellemek için **Kriptografik Doğrulama** uygulanır.

### 1. Cihaz Kimlik Doğrulama:
• Her cihaz yerel Ed25519 asimetrik anahtar çifti üretir; yayılan her SOS mesajı cihazın özel anahtarıyla imzalanarak manipülasyon engellenir.

### 2. Batarya ve Kaynak Koruması:
• BLE tarama sıklığı batarya %20'nin altına indiğinde akıllı güç tasarrufu moduna geçer ve 48 saate kadar sinyal yaymaya devam eder.`
        }
    },
    {
        id: "cloudgate-cost",
        title: "CloudGate FinOps",
        tagline: "Çoklu Bulut (AWS, GCP, Azure) Altyapılarında Otonom Spot Instance ve Kubernetes Kaynak İsrafı Önleyici AI Ajanı",
        category: "Altyapı, Cloud & Performans",
        categoryKey: "infrastructure",
        scope: "international",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "6 Hafta",
            monetization: "Tasarruf Edilen Bulut Bütçesinden %15 Başarı Primi (FinOps SaaS)",
            opportunityScore: "%96 Fırsat Skoru",
            scope: "international"
        },
        diagramNodes: [
            { id: 1, name: "Kubernetes Metrics / CloudWatch", type: "source", sub: "Prometheus & Cloud API" },
            { id: 2, name: "FinOps Decision Engine", type: "service", sub: "Go Operator + KEDA Autoscaler" },
            { id: 3, name: "Spot Kesinti Tahmin AI", type: "ai", sub: "XGBoost Fiyat & Kesinti Tahmini" },
            { id: 4, name: "TimescaleDB & Redis", type: "storage", sub: "Maliyet Analitik & Küme Durum DB" },
            { id: 5, name: "Mühendislik Tasarruf Portali", type: "client", sub: "Next.js / Slack Bot Raporu" }
        ],
        step1: {
            marketGap: `Yazılım şirketlerinin bulut bilişim (AWS, Azure, Google Cloud) faturalarının ortalama %35'i atıl bırakılmış sunucular, aşırı kaynak ayrılmış (over-provisioned) Kubernetes pod'ları ve kullanılmayan EBS diskleri yüzünden israf edilmektedir. Geleneksel maliyet izleme araçları (Datadog, CloudHealth vb.) yalnızca faturanın neden yüksek olduğunu gösteren pasif grafikler sunar; ancak altyapıyı otonom olarak küçültmez veya riski yöneterek Spot Instance'lara geçirmez. Mühendislik ekipleri ise canlı sistemlerin çökmesinden korktukları için manuel küçültme yapmaktan çekinir. CloudGate FinOps, Spot sunucu kesintilerini 15 dakika önceden tahmin eden yapay zeka ajanıyla iş yüklerini sıfır kesintiyle Spot havuzlarına taşır ve bulut faturasını anında yarıya indirir.`,
            description: `CloudGate FinOps, Kubernetes kümelerini ve bulut sanal sunucularını canlı optimize eden otonom bir altyapı maliyet tasarrufu kontrolörüdür.

**Temel Yetenekler & Özellikler:**
• **Spot Kesinti Tahmini (Interruption Predictor)**: AWS Spot pazarındaki fiyat dalgalanmalarını izleyerek sunucunun geri çağrılacağını 15 dakika önceden tahmin eder ve pod'ları yedek düğüme tahliye eder.
• **Otonom Pod Right-Sizing**: Uygulamanın gerçek CPU/RAM tüketimini öğrenerek Kubernetes request/limit değerlerini mikro düzeyde otomatik günceller.
• **Zombi Kaynak Temizliği**: Bağlantısı kopmuş EBS birimlerini, kullanılmayan Load Balancer'ları ve unutulmuş dev ortamlarını tespit edip otomatik durdurur.
• **Slack ve GitHub PR Entegrasyonu**: 'Bu Terraform PR'ı bulut faturanızı aylık 450$ artıracak' uyarısını kod inceleme aşamasında yapan CI/CD botu.`,
            tags: ["Go", "Kubernetes Operator", "AWS/GCP API", "Terraform", "Prometheus", "Python", "FinOps"]
        },
        step2: {
            architecture: `CloudGate FinOps, doğrudan Kubernetes kontrol düzleminde çalışmak için **Kubernetes Custom Resource Definition (CRD) & Controller** mimarisine dayanır.

### 1. Sistem Katmanları:
• **Kube-Agent (Go / client-go)**: Müşterinin Kubernetes kümesine kurulan, metrikleri toplayan ve pod ölçekleme komutlarını yürüten hafif operatör.
• **Spot Market AI Engine (Python / LightGBM)**: AWS/GCP API'lerinden tüm bölgelerdeki Spot havuz derinliğini izleyen merkezi tahmin modeli.
• **Optimization Brain (Go / gRPC)**: Binlerce pod için en uygun düğüm yerleşimini hesaplayan lineer programlama çözücüsü.
• **FinOps Dashboard (Next.js 14 + Tremor)**: Tasarruf edilen net dolar tutarını ve kaynak kullanımını gösteren yönetici paneli.

### 2. Somut Teknoloji Yığını:
• **Core Operator**: Go (Kubebuilder / Operator SDK)
• **AI Inference**: Python FastAPI + Ray Serve
• **Veritabanı**: TimescaleDB + Redis + ClickHouse

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`cloud_accounts\` (id, provider, role_arn, monthly_spend_usd, optimization_status)
• \`k8s_clusters\` (id, account_id FK, cluster_version, node_count, current_savings_pct)
• \`optimization_actions\` (id, cluster_id FK, action_type, estimated_saving_usd, executed_at, rollback_status)

### 4. API Kontratları:
• \`POST /api/v1/clusters/recommendations\`: Yapay zekanın ürettiği küme optimizasyon planı.
• \`POST /api/v1/agent/telemetry\`: K8s operatöründen gelen canlı CPU/RAM kullanım akışı.`,
            security: `Müşteri bulut hesaplarına erişim **Least Privilege (En Az Yetki)** prensibiyle korunur.

### 1. Güvenli IAM Rolü (Cross-Account IAM):
• Asla statik AWS Access Key kullanılmaz; geçici süreli AWS STS AssumeRole ve harici ID (ExternalId) doğrulaması kullanılır.

### 2. Salt Okunur / Korumalı Mod:
• Müşteri dilerse 'Yalnızca Öneri Modu'nu seçerek ajanın otomatik müdahale etmesini engelleyebilir.`
        }
    },

    // =========================================================================
    // 4. EĞİTİM TEKNOLOJİLERİ & YAPAY ZEKA (edtech)
    // =========================================================================
    {
        id: "eduscribe-ai",
        title: "EduScribe AI",
        tagline: "Nöroçeşitlilik Odaklı İnteraktif Görsel Öğrenme ve Zihin Haritası Platformu",
        category: "Eğitim Teknolojileri & Yapay Zeka",
        categoryKey: "edtech",
        scope: "international",
        meta: {
            difficulty: "Orta Düzey",
            mvpTime: "4 Hafta",
            monetization: "Freemium + Okul B2B Lisansı",
            opportunityScore: "%95 Fırsat Skoru",
            scope: "international"
        },
        diagramNodes: [
            { id: 1, name: "Ders Videosu / PDF", type: "source", sub: "İçerik Yükleme" },
            { id: 2, name: "Media Processing Pipeline", type: "service", sub: "FFmpeg + Whisper AI" },
            { id: 3, name: "Concept Graph Extractor", type: "ai", sub: "NLP & MindMap Generator" },
            { id: 4, name: "Neo4j & Vector DB", type: "storage", sub: "Graph DB + pgvector RAG" },
            { id: 5, name: "Disleksi UI Portal", type: "client", sub: "Next.js + D3.js MindMaps" }
        ],
        step1: {
            marketGap: `Dünya genelinde öğrencilerin %15'i Disleksi, DEHB (Dikkat Eksikliği) veya İşitsel İşleme Bozukluğundan etkilenmektedir. Geleneksel online kurslar (Coursera, Udemy vb.) uzun videolar ve yoğun metin blokları sunar; bu da bu öğrenciler için öğrenmeyi zorlaştırır. Pazardaki yapay zeka araçları ise yalnızca uzun metinleri kısa özetlere dönüştürmektedir; ancak nöroçeşitli öğrenciler için özet metinler değil, görsel şemalar, interaktif zihin haritaları, odak odaklı seslendirmeler ve renk kodlu kavram haritaları gereklidir. EduScribe AI, uzun ders videolarını ve PDF'leri disleksi dostu typography ve dinamik görsel haritalara dönüştürür.`,
            description: `EduScribe AI, ders içeriklerini nöroçeşitli bireylerin algılama biçimine göre yeniden yapılandıran yapay zeka destekli bir e-öğrenme ajanıdır.

**Temel Yetenekler & Özellikler:**
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

### 2. Somut Teknoloji Yığını:
• **Media**: FFmpeg + Whisper AI + Web Speech API
• **Backend**: Python FastAPI + LangChain
• **Veritabanı**: Neo4j (Graph DB) + PostgreSQL (pgvector) + Redis

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`users\` (id, email, learning_profile, dyslexia_font_enabled, created_at)
• \`courses\` (id, user_id FK, original_video_url, transcript_text, mindmap_json)
• \`quiz_cards\` (id, course_id FK, concept_title, question_text, flashcard_front, flashcard_back)

### 4. API Kontratları:
• \`POST /api/v1/media/transcribe\`: Ders videosu yükleme ve altyazı çıkarımı.
• \`GET /api/v1/mindmaps/:courseId\`: İnteraktif D3.js zihin haritası JSON grafı.`,
            security: `Kullanıcı kitlesinin ağırlıklı olarak öğrenciler ve çocuklar olması sebebiyle **COPPA** ve **GDPR-K (Çocukların Gizliliği)** uyumu zorunludur.

### 1. Gizlilik ve Güvenli Arama:
• Öğrencilerin sisteme yüklediği ders notları veya ses kayıtları yapay zeka modellerinin genel eğitiminde asla kullanılmaz.

### 2. İçerik Moderasyonu:
• Yapay zekanın ürettiği tüm yanıtlar ve görseller içerik güvenlik filtrelerinden (LLM Guard) geçirilerek uygunsuz içerik engellenir.`
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
        id: "codecraft-interactive",
        title: "CodeCraft AI Mentor",
        tagline: "Yazılım Geliştiriciler İçin İzole WebAssembly Sandbox Destekli Canlı Kod Analizi ve Algoritma Koçu",
        category: "Eğitim Teknolojileri & Yapay Zeka",
        categoryKey: "edtech",
        scope: "international",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "6 Hafta",
            monetization: "B2C Aylık Pro Üyelik ($19/ay) + BootCamp / Üniversite Lisansı",
            opportunityScore: "%94 Fırsat Skoru",
            scope: "international"
        },
        diagramNodes: [
            { id: 1, name: "Tarayıcı Kod Editörü", type: "source", sub: "Monaco Editor (VS Code)" },
            { id: 2, name: "WebAssembly Sandbox", type: "service", sub: "Wasmtime / Pyodide İzolasyonu" },
            { id: 3, name: "Kod Mantığı & Hata AI", type: "ai", sub: "AST Hata & Big-O Karmaşıklık Analizi" },
            { id: 4, name: "PostgreSQL & Redis", type: "storage", sub: "Kullanıcı İlerlemesi & Kod Havuzu" },
            { id: 5, name: "İnteraktif Debug Paneli", type: "client", sub: "Bellek & Çağrı Yığını Canlandırması" }
        ],
        step1: {
            marketGap: `Yazılım öğrenen milyonlarca geliştirici LeetCode veya HackerRank gibi platformlarda kod yazarken bir test senaryosunda takıldığında (örn: 'Time Limit Exceeded' veya 'NullPointerException') neden hata yaptığını anlayamaz. Mevcut platformlar yalnızca hata çıktısını ekrana basar; ancak kodun arka planda bellekte (Heap/Stack) nasıl çalıştığını, döngünün nerede sonsuza girdiğini ve Big-O karmaşıklığının nasıl optimize edileceğini görselleştirmez. CodeCraft AI Mentor, tarayıcıda sıfır sunucu maliyetiyle koşan güvenli WebAssembly (WASM) sandbox'ında kodu satır satır çalıştırır, bellek durumunu canlı canlandırır ve yapay zeka ile kişiye özel algoritma ipuçları sunar.`,
            description: `CodeCraft AI Mentor, bilgisayar mühendisliği öğrencileri ve yazılımcılar için interaktif kod yürütme, algoritma görselleştirme ve yapay zeka mentorluk platformudur.

**Temel Yetenekler & Özellikler:**
• **Bellek & Yığın Canlı Görselleştirmesi**: Pointer'ların, bağlı listelerin (Linked List) ve ağaç yapılarının (Tree/Graph) her kod satırında nasıl değiştiğini animasyonla gösterir.
• **Otonom Big-O Karmaşıklık Analizörü**: Yazılan algoritmanın Zaman ve Alan karmaşıklığını (Time & Space Complexity) hesaplayarak O(n^2)'den O(n log n)'e nasıl optimize edileceğini anlatır.
• **İzole WebAssembly (WASM) Kod Çalıştırma**: Python, Rust, C++ ve JavaScript kodlarını tarayıcı içerisinde güvenli sandbox'ta milisaniyede derler ve çalıştırır.
• **Yapay Zeka Destekli Kod İnceleme (Code Review)**: Clean Code standartlarına, bellek sızıntılarına ve güvenlik açıklarına karşı akıllı geri bildirimler verir.`,
            tags: ["WebAssembly", "Rust", "Monaco Editor", "React", "TypeScript", "Python", "Docker"]
        },
        step2: {
            architecture: `CodeCraft AI Mentor, yüksek derleme maliyetlerini ortadan kaldırmak için **Client-Side Execution (Local-First WASM)** mimarisini kullanır.

### 1. Sistem Katmanları:
• **Client Code Sandbox (Wasmtime / Pyodide / v8)**: Kullanıcının kodunu doğrudan tarayıcı CPU'sunda çalıştıran güvenli sanal makine.
• **AST & Static Analysis Engine (Rust / tree-sitter)**: Kodun sözdizim ağacını çıkarıp döngüleri ve değişken kapsamlarını analiz eden modül.
• **AI Mentorship Service (Python / FastAPI + Claude/Gemini API)**: Hatanın nedenini Sokratik üslupla açıklayan LLM servisi.
• **UI & Visualizer (React 18 + Monaco Editor + D3.js)**: Kod editörü ve bellek yığınını senkronize canlandıran görsel arayüz.

### 2. Somut Teknoloji Yığını:
• **Frontend**: React + TypeScript + Monaco Editor + D3.js
• **Execution**: WebAssembly (Wasmtime / Pyodide)
• **Backend & DB**: Python FastAPI + PostgreSQL 16 + Redis

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`users\` (id, github_handle, coding_level, streak_days, created_at)
• \`coding_challenges\` (id, title, difficulty, test_cases_json, optimal_complexity)
• \`user_submissions\` (id, user_id FK, challenge_id FK, code_content, execution_time_ms, passed)

### 4. API Kontratları:
• \`POST /api/v1/ai/mentor-feedback\`: Kod takılma noktası için yönlendirici ipucu alma.
• \`GET /api/v1/challenges/daily\`: Günün algoritma sorusu ve test senaryoları.`,
            security: `Kullanıcı kodlarının kötü amaçlı çalıştırılmasına (RCE) karşı **Zero-Trust Client Isolation** uygulanır.

### 1. Tarayıcı İçi Sandbox (WASM Isolation):
• Kod çalıştırma istemcinin kendi tarayıcısında WebAssembly içinde gerçekleşir; sunucuya hiçbir kullanıcı kodu çalıştırılmak üzere gönderilmez, böylece sunucu hacklenme riski doğmaz.`
        }
    },

    // =========================================================================
    // 5. SÜRDÜRÜLEBİLİRLİK & ENDÜSTRİYEL IOT (sustainability)
    // =========================================================================
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
        id: "tarim-gozcusu-ai",
        title: "TarımGözcüsü AI (ÇKS & DSİ Uyumlu)",
        tagline: "Otonom Sera ve Tarla Yönetimi İçin IoT Sensörlü, ÇKS Entegrasyonlu Kuraklık ve Hastalık Erken Uyarı Ajanı",
        category: "Sürdürülebilirlik & IoT & Blockchain",
        categoryKey: "sustainability",
        scope: "national",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "8 Hafta",
            monetization: "Dönüm Başı Yıllık Abonelik + Tarım Kredi / Ziraat Bankası Teşvikleri",
            opportunityScore: "%97 Fırsat Skoru",
            scope: "national"
        },
        diagramNodes: [
            { id: 1, name: "Tarla LoRaWAN Sensörleri", type: "source", sub: "Toprak Nemi, pH, Sıcaklık" },
            { id: 2, name: "LoRaWAN Gateway & MQTT", type: "service", sub: "ChirpStack + Go MQTT Broker" },
            { id: 3, name: "Hastalık & Sulama AI Motoru", type: "ai", sub: "Meteoroloji & Uydu Analizi" },
            { id: 4, name: "TimescaleDB & PostGIS", type: "storage", sub: "Zaman Serisi & Coğrafi Parsel DB" },
            { id: 5, name: "Çiftçi Mobil Paneli", type: "client", sub: "Flutter / SMS & Sesli Ajan" }
        ],
        step1: {
            marketGap: `Türkiye'de tüketilen tatlı su kaynaklarının %74'ü tarımsal sulamada kullanılmakta olup, vahşi sulama yöntemleri yüzünden suyun %45'i buharlaşarak veya toprağı tuzlandırarak israf edilmektedir. Ayrıca iklim krizine bağlı kuraklık ve don olayları yıllık milyarlarca liralık ürün kaybına yol açmaktadır. Mevcut yabancı akıllı tarım sistemleri hem yüksek döviz maliyetlidir hem de Türkiye Tarım ve Orman Bakanlığı Çiftçi Kayıt Sistemi (ÇKS), TARSİM sigorta süreçleri ve yerel toprak haritalarıyla entegre değildir. TarımGözcüsü AI, yerli LoRaWAN sensörleri ve uydu görüntülerini harmanlayarak çiftçiye SMS ve sesli aramayla 'Yarın saat 06:00'da 22 dakika damla sulama yapın, don riski için örtü önlemi alın' talimatı veren uçtan uca bir agronomi ajanıdır.`,
            description: `TarımGözcüsü AI, tarladaki toprak nemi, yaprak ıslaklığı ve meteoroloji verilerini yapay zeka ile işleyen otonom bir tarımsal karar destek sistemidir.

**Temel Yetenekler & Özellikler:**
• **Hassas Sulama Optimizasyonu**: Toprak tipi, ürün cinsi (pamuk, buğday, mısır vb.) ve buharlaşma katsayısına göre su tüketimini %40 düşüren sulama takvimi oluşturur.
• **Kamera ile Bitki Hastalığı Teşhisi**: Çiftçinin telefonla çektiği yaprak fotoğrafından pas, külleme veya zararlı böcek türünü saniyeler içinde %96 doğrulukla teşhis eder ve reçete sunar.
• **Zirai Don ve Dolu Erken Uyarısı**: Meteoroloji Genel Müdürlüğü (MGM) radar verileri ve yerel sensörlerle don riskini 12 saat önceden haber verir.
• **ÇKS ve TARSİM Entegrasyonu**: Hasar tespit raporlarını resmi formatta hazırlayarak sigorta ve hibe başvuru süreçlerini hızlandırır.`,
            tags: ["Python", "LoRaWAN", "Go", "TimescaleDB", "Flutter", "TEKNOFEST Tarım Uyumlu", "TÜBİTAK 1512"]
        },
        step2: {
            architecture: `TarımGözcüsü AI, kırsal bölgelerdeki düşük internet bant genişliğinde kesintisiz çalışmak için **Edge-IoT & Offline-First** mimarisine dayanır.

### 1. Sistem Katmanları:
• **IoT & Edge Gateway Layer (ChirpStack / Go)**: Tarladaki güneş enerjili LoRaWAN düğümlerinden 15 km menzille gelen sensör telemetrisini toplar.
• **Agronomy AI Inference Engine (Python / XGBoost + YOLOv8)**: Sulama tahmini ve yaprak hastalık sınıflandırması yapan yapay zeka servisi.
• **Spatial & Time-Series Storage (TimescaleDB / PostGIS)**: Parsel geometrileri ve geçmiş sensör verilerini depolayan katman.
• **Farmer Notification Dispatcher (Twilio / Yerli SMS & WhatsApp)**: İnterneti olmayan çiftçilere sesli arama ve SMS ile uyarı gönderen motor.

### 2. Somut Teknoloji Yığını:
• **IoT & Gateway**: LoRaWAN + ChirpStack + MQTT + Go
• **AI & Analiz**: PyTorch (YOLOv8) + Scikit-Learn + Sentinel-2 Uydu API
• **Veritabanı**: PostgreSQL 16 (TimescaleDB + PostGIS) + Redis

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`farms\` (id, owner_tc_hash, cks_number, total_decare, polygon_geometry)
• \`sensor_nodes\` (id, farm_id FK, lora_dev_eui, battery_level, lat, lon)
• \`telemetry_logs\` (time, node_id FK, soil_moisture_pct, soil_temp_c, air_humidity)
• \`irrigation_commands\` (id, farm_id FK, start_time, duration_minutes, status)

### 4. API Kontratları:
• \`POST /api/v1/sensors/telemetry\`: LoRaWAN gateway telemetri ingest endpoint'i.
• \`POST /api/v1/diagnosis/leaf-disease\`: Yaprak fotoğrafı analizi ve tedavi önerisi.`,
            security: `Tarım arazisi ve gıda güvenliği verileri stratejik önem taşır; **KVKK ve Endüstriyel IoT Güvenliği** uygulanır.

### 1. Cihaz Kimlik Doğrulama:
• Her LoRaWAN sensör düğümü donanımsal AES-128 AppKey ve OTAA (Over-The-Air Activation) ile ağa katılır; sahte sensör verisi enjeksiyonu engellenir.`
        }
    },
    {
        id: "greenwatt-p2p",
        title: "GreenWatt P2P Energy",
        tagline: "Çatı Güneş Paneli (GES) ve Elektrikli Araçlar İçin Mikro-Şebeke P2P Yeşil Enerji Ticaret Platformu",
        category: "Sürdürülebilirlik & IoT & Blockchain",
        categoryKey: "sustainability",
        scope: "international",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "9 Hafta",
            monetization: "İşlem Başı kWh Komisyonu (%2) + Enerji Şirketi SaaS Entegrasyonu",
            opportunityScore: "%95 Fırsat Skoru",
            scope: "international"
        },
        diagramNodes: [
            { id: 1, name: "Çatı GES & Akıllı Sayaç", type: "source", sub: "Zigbee / Smart Meter Inbound" },
            { id: 2, name: "P2P Settlement Engine", type: "service", sub: "Go + Zero-Knowledge Rollup" },
            { id: 3, name: "Fiyat & Talep Tahmin AI", type: "ai", sub: "Dinamik Tarife & Batarya Optimizasyonu" },
            { id: 4, name: "TimescaleDB & Redis", type: "storage", sub: "Zaman Serisi & Enerji Takas DB" },
            { id: 5, name: "Kullanıcı Enerji Portali", type: "client", sub: "React Native Mobil + Web Paneli" }
        ],
        step1: {
            marketGap: `Konut tipi çatı güneş enerjisi (GES) ve ev tipi batarya depolama sistemleri hızla yaygınlaşmaktadır; ancak ev sahipleri ürettikleri fazla elektriği yalnızca geleneksel şebekeye çok düşük toptan fiyatlarla geri satabilmektedir. Aynı mahalledeki elektrikli araç (EV) sahibi bir komşu ise şebekeden yüksek fiyata elektrik almaktadır. Komşuların veya yerel toplulukların kendi arasında eşler arası (P2P) temiz enerji ticareti yapabileceği, anlık arz-talep dengesine göre dinamik fiyat oluşturan otonom bir mikro-şebeke borsası eksiktir. GreenWatt P2P, akıllı sayaçları birbirine bağlayarak komşular arası yeşil enerji ticaretini otomatikleştirir ve enerji maliyetlerini tüketiciler için %30 düşürür.`,
            description: `GreenWatt P2P, çatı güneş panelleri ve bataryaları akıllı bir enerji pazarında buluşturan otonom mikro-şebeke ticaret platformudur.

**Temel Yetenekler & Özellikler:**
• **Eşler Arası (P2P) Enerji Ticareti**: Fazla güneş enerjisini şebeke yerine doğrudan komşulara veya elektrikli araç şarj istasyonlarına piyasa fiyatından satar.
• **AI Destekli Batarya Yönetimi**: Hava durumu ve ertesi günkü elektrik tarifelerini öğrenerek ev bataryasını elektrik ucuzken doldurur, pahalıyken satar.
• **Otomatik Akıllı Sözleşme Mutabakatı**: Sayaçtan sayaç kilowatt-saat (kWh) transferini milisaniyeler içinde blokzincirde kaydeder ve ücretini aktarır.
• **Şebeke Yük Dengeleme (Demand-Response)**: Şebekenin en yoğun olduğu saatlerde tüketimi azaltan kullanıcılara yeşil enerji teşvik primi dağıtır.`,
            tags: ["Go", "Solidity", "TimescaleDB", "Smart Grid", "Python", "IoT", "CleanTech"]
        },
        step2: {
            architecture: `GreenWatt P2P, yüksek frekanslı enerji sayaç verilerini ve finansal mikro-ödemeleri yönetmek için **High-Throughput Streaming & Local Settlement** mimarisini kullanır.

### 1. Sistem Katmanları:
• **Meter Telemetry Ingest (Go / MQTT Broker)**: Akıllı sayaçlardan her 10 saniyede bir gelen voltaj, akım ve kWh üretim/tüketim verilerini toplar.
• **Dynamic Pricing Engine (Python / Reinforcement Learning)**: Mikro-şebekedeki anlık güneş üretimi ve araç şarj talebine göre adil piyasa fiyatı belirler.
• **P2P Settlement Ledger (Rust / Rollup)**: Mahalle bazlı enerji alışverişini birleştiren hafif takas katmanı.
• **Client Mobile App (React Native)**: Ev sahibinin anlık üretim ve kazancını gördüğü mobil uygulama.

### 2. Somut Teknoloji Yığını:
• **Data Engine**: Go + EMQX MQTT Broker + Kafka
• **AI Engine**: Python (PPO Reinforcement Learning) + FastAPI
• **Veritabanı**: TimescaleDB + Redis + PostgreSQL

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`smart_meters\` (meter_id PK, user_id, house_address, capacity_kw, battery_kwh)
• \`energy_orders\` (id, seller_meter_id FK, buyer_meter_id FK, kwh_amount, price_per_kwh, timestamp)
• \`grid_tariffs\` (id, region_code, valid_from, valid_to, buy_price, sell_price)

### 4. API Kontratları:
• \`POST /api/v1/meter/reading\`: Sayaç telemetri aktarım API'si.
• \`GET /api/v1/market/current-price\`: Anlık mahalle bazlı kWh fiyatı.`,
            security: `Enerji şebekesi güvenliği kritik altyapı statüsündedir; **Grid Cyber-Security Standards** uygulanır.

### 1. Sayaç Kriptografisi:
• Akıllı sayaçlar donanımsal Secure Element (SE) ve TLS 1.3 ile verileri imzalar; sahte üretim bildirimiyle haksız kazanç engellenir.`
        }
    },

    // =========================================================================
    // 6. DEVOPS & GELİŞTİRİCİ ARAÇLARI (devops)
    // =========================================================================
    {
        id: "devguard-ci",
        title: "DevGuard AI Reviewer",
        tagline: "GitHub ve GitLab İçin Otonom Pull Request Kod İnceleme, Güvenlik Açığı ve Flaky Test Önleme Ajanı",
        category: "DevOps & Yazılım Geliştirme Araçları",
        categoryKey: "devops",
        scope: "international",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "5 Hafta",
            monetization: "Geliştirici Başına Aylık SaaS ($15/dev/ay) + On-Premise Kurumsal Lisans",
            opportunityScore: "%96 Fırsat Skoru",
            scope: "international"
        },
        diagramNodes: [
            { id: 1, name: "GitHub / GitLab Webhook", type: "source", sub: "Pull Request Event" },
            { id: 2, name: "Diff Parser & Context Builder", type: "service", sub: "Go AST + Git Tree Engine" },
            { id: 3, name: "Code Review & Logic AI", type: "ai", sub: "LLM Code Reasoning Engine" },
            { id: 4, name: "PostgreSQL & Vector Store", type: "storage", sub: "Şirket Kod Standartları & RAG DB" },
            { id: 5, name: "GitHub PR Inline Yorumları", type: "client", sub: "Otomatik Düzeltme Önerileri" }
        ],
        step1: {
            marketGap: `Yazılım ekiplerinde kıdemli mühendislerin mesaisinin %25'i junior geliştiricilerin Pull Request'lerini incelemekle, kod standartlarını denetlemekle ve mantık hatalarını yakalamakla geçmektedir. Mevcut statik linter'lar (ESLint, Prettier vb.) yalnızca biçimlendirmeyi denetler; iş mantığındaki (Business Logic) bellek sızıntılarını, N+1 veritabanı sorgularını veya eksik sınır durumlarını (Edge Cases) yakalayamaz. Sonuç olarak kalitesiz kodlar canlıya çıkmakta ve 'Flaky' testler yüzünden CI/CD boru hatları tıkanmaktadır. DevGuard AI, şirketinizin kod tabanını ve mimari standartlarını öğrenerek Pull Request açıldığı an satır satır mantık incelemesi yapar ve tek tıkla kabul edilebilir düzeltme kodları (One-Click Suggestions) yazar.`,
            description: `DevGuard AI, GitHub ve GitLab entegrasyonuyla yazılım ekiplerinin kod kalitesini artıran ve kod inceleme sürelerini %70 kısaltan otonom bir AI eş-programcıdır.

**Temel Yetenekler & Özellikler:**
• **Satır İçi Akıllı Kod İncelemesi (Inline PR Comments)**: Kod değişikliklerini repo bağlamıyla analiz ederek doğrudan GitHub PR satırlarına açıklayıcı geri bildirimler yazar.
• **N+1 Sorgu ve Performans Açığı Tespiti**: ORM çağrılarında döngü içinde veritabanı sorgusu atılan yerleri tespit edip optimize edilmiş JOIN kodunu önerir.
• **Flaky Test Tahmini ve Otomatik Mock Üretimi**: Ağ gecikmesine veya rastgeleliğe bağlı kararsız testleri belirler ve eksik mock test senaryolarını tamamlar.
• **Şirket Mimari Kuralları RAG Motoru**: Şirketin kendi dokümantasyonunu ve Clean Architecture prensiplerini vektör veritabanında tutarak şirkete özel kural denetimi yapar.`,
            tags: ["Go", "Python", "GitHub API", "AST Tree-Sitter", "TypeScript", "Docker", "SOC2 Uyumlu"]
        },
        step2: {
            architecture: `DevGuard AI, büyük kod tabanlarını hızlı ve güvenli incelemek için **Context-Aware AST & RAG Pipeline** mimarisini kullanır.

### 1. Sistem Katmanları:
• **Webhook & Event Ingestion (Go / Fastify)**: GitHub/GitLab PR olaylarını mikrosaniyede karşılar ve Git Diff verisini ayıklar.
• **Context Extraction Engine (Tree-Sitter / Go)**: Değişen fonksiyonların çağrıldığı diğer dosyaları AST üzerinden analiz ederek semantik bağlam çıkarır.
• **LLM Reasoning Pipeline (Python / LangChain + Anthropic/Gemini)**: Mimari kuralları ve güvenlik açığı desenlerini değerlendiren çıkarım motoru.
• **GitHub App Interface (Probot / TypeScript)**: PR üzerine satır içi yorum ve düzeltme commit'i açan bot.

### 2. Somut Teknoloji Yığını:
• **Parser**: Go + Tree-Sitter
• **Backend**: Python FastAPI + Node.js (Probot)
• **Veritabanı**: PostgreSQL 16 + Qdrant (Vector DB) + Redis

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`github_installations\` (id, org_name, plan_type, custom_rules_prompt)
• \`pr_reviews\` (id, repo_name, pr_number, files_changed, issues_found_count, review_time_ms)
• \`code_guidelines\` (id, installation_id FK, rule_title, rule_description, vector_embedding)

### 4. API Kontratları:
• \`POST /api/v1/github/webhook\`: GitHub App PR webhook girişi.
• \`GET /api/v1/analytics/code-health\`: Repo kod kalitesi ve çözülen hata istatistikleri.`,
            security: `Kaynak kod gizliliği ve fikri mülkiyet hakları **Zero-Retention Guarantee** ile korunur.

### 1. Kod İzolasyonu & Eğitim Koruması:
• İncelenen müşteri kodları sunucularda kalıcı olarak saklanmaz (In-Memory Processing) ve yapay zeka modellerinin genel eğitiminde asla kullanılmaz.

### 2. GitHub App İzinleri:
• Yalnızca yetki verilen depolara salt-okunur kod erişimi ve PR yorum yazma yetkisi istenir.`
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
        id: "kubepilot-ai",
        title: "KubePilot AI",
        tagline: "Kubernetes Kümelerinde Canlı Olayları (CrashLoopBackOff, OOMKilled) Otonom Teşhis ve Onarma Ajanı",
        category: "DevOps & Yazılım Geliştirme Araçları",
        categoryKey: "devops",
        scope: "international",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "7 Hafta",
            monetization: "Küme Başına Aylık SaaS ($99/küme/ay) + Enterprise On-Prem",
            opportunityScore: "%97 Fırsat Skoru",
            scope: "international"
        },
        diagramNodes: [
            { id: 1, name: "K8s Event Stream / Logs", type: "source", sub: "K8s API & FluentBit Inbound" },
            { id: 2, name: "Log Cluster & Root Cause AI", type: "service", sub: "Go DaemonSet + Vector Aggregator" },
            { id: 3, name: "Remediation Engine", type: "ai", sub: "LLM K8s Diagnostics & Auto-Patch" },
            { id: 4, name: "ClickHouse & Redis", type: "storage", sub: "K8s Olay Günlükleri & Audit DB" },
            { id: 5, name: "DevOps Slack / PagerDuty", type: "client", sub: "Otomatik İyileştirme Onay Botu" }
        ],
        step1: {
            marketGap: `Üretim ortamındaki Kubernetes kümelerinde meydana gelen arızalarda (CrashLoopBackOff, OOMKilled, ImagePullBackOff, Deadlock) nöbetçi (on-call) SRE ve DevOps mühendisleri gece yarısı uyandırılmakta ve logları ayıklamak için saatler harcamaktadır. Pazardaki izleme araçları (Prometheus, Datadog vb.) yalnızca 'Pod öldü' şeklinde alarm gönderir; hatanın kök nedenini (Root Cause) söylemez ve düzeltici kubectl yamasını (Patch) uygulamaz. KubePilot AI, Kubernetes loglarını ve pod durumunu canlı analiz ederek hatanın nedenini tespit eder (örn: 'Veritabanı bağlantı havuzu tükendi, configmap'teki max_conn değerini artırın') ve tek tıkla veya otonom olarak kümede kendi kendine onarım (Self-Healing) gerçekleştirir.`,
            description: `KubePilot AI, Kubernetes kümelerinde ortaya çıkan arızaları insan müdahalesine gerek kalmadan çözen otonom bir Site Reliability Engineering (SRE) yapay zeka ajanıdır.

**Temel Yetenekler & Özellikler:**
• **Otomatik Kök Neden Teşhisi (Root Cause Analysis)**: Log yığınlarını, kernel dmesg mesajlarını ve K8s event'lerini birleştirerek hatanın asıl nedenini 10 saniyede belirler.
• **Otonom İyileştirme (Auto-Remediation)**: OOMKilled durumunda bellek limitini güvenle artıran veya kilitlenmiş pod'ları drain eden doğrulanmış yamaları uygular.
• **Canlı PagerDuty / Slack İnteraktif Asistanı**: SRE mühendisine 'Önbellek sunucusunu yeniden başlatıp replika sayısını 4'e çıkarmamı onaylıyor musunuz?' butonu sunar.
• **Post-Mortem Olay Raporu**: Arıza çözüldükten sonra yöneticiler için adım adım teknik olay özetini (Incident Post-Mortem) otomatik oluşturur.`,
            tags: ["Go", "Kubernetes Operator", "ClickHouse", "Python", "Slack Bot", "PagerDuty", "DevOps"]
        },
        step2: {
            architecture: `KubePilot AI, sıfır dış bağımlılıkla ve yüksek güvenilirlikle çalışmak için **Kubernetes In-Cluster Operator & eBPF Log Ingestion** mimarisini kullanır.

### 1. Sistem Katmanları:
• **K8s DaemonSet Agent (Go / eBPF)**: Düğümlerdeki konteyner loglarını ve çekirdek sinyallerini sıfır CPU yüküyle dinleyen hafif ajan.
• **Root Cause AI Engine (Python / ONNX)**: Log kalıplarını kümeleyen ve geçmiş incident çözümleriyle eşleştiren makine öğrenmesi motoru.
• **Action Controller (Go / client-go)**: Onaylanan kubectl patch, restart ve rollback işlemlerini denetimli şekilde yürüten operatör.
• **Interactive Slack/Discord Bot (Node.js)**: Nöbetçi mühendislerle iki yönlü sohbet eden operasyon asistanı.

### 2. Somut Teknoloji Yığını:
• **Core Operator**: Go 1.22 + Controller-Runtime
• **AI Diagnostics**: Python FastAPI + LangChain + Llama 3 Code
• **Veritabanı**: ClickHouse (Log Analytics) + Redis (Incident Locks)

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`managed_clusters\` (id, kube_version, namespace_whitelist, auto_heal_enabled)
• \`incidents\` (id, cluster_id FK, pod_name, error_type, root_cause_summary, status, resolved_at)
• \`remediation_history\` (id, incident_id FK, patch_applied_yaml, approved_by, execution_status)

### 4. API Kontratları:
• \`POST /api/v1/incidents/report\`: Küme içi ajandan olay bildirimi.
• \`POST /api/v1/actions/approve-remediation\`: SRE mühendisi onay endpoint'i.`,
            security: `Kümelerde otomatik müdahale yetkisi **Kritik Güvenlik Tedbirleri** gerektirir.

### 1. RBAC Kısıtlamaları:
• Operatör yalnızca izin verilen namespace'lerde çalışır; kube-system veya kritik veri katmanlarında otomatik işlem yapması engellenir.

### 2. Otomatik Rollback Sigortası:
• Uygulanan yama 2 dakika içinde pod'u sağlıklı duruma getiremezse sistem otomatik olarak önceki stabil sürüme döner.`
        }
    },

    // =========================================================================
    // 7. WEB & ÜRÜN TASARIMI (design)
    // =========================================================================
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
        id: "kamu-ui-a11y",
        title: "KamuUI A11y Engine",
        tagline: "Kamusal Web Siteleri ve Kurumsal Portaller İçin WCAG 2.2 ve Cumhurbaşkanlığı Standartlarına Uyumlu Erişilebilirlik ve Tasarım-Kod Motoru",
        category: "Web & Ürün Tasarımı",
        categoryKey: "design",
        scope: "national",
        meta: {
            difficulty: "Orta Düzey",
            mvpTime: "4 Hafta",
            monetization: "Kamu Kurumu ve Belediye Yıllık Yazılım Lisansı + SaaS Denetim",
            opportunityScore: "%94 Fırsat Skoru",
            scope: "national"
        },
        diagramNodes: [
            { id: 1, name: "Web Sitesi URL / Figma", type: "source", sub: "Kamu Portali Girişi" },
            { id: 2, name: "Headless Browser Scanner", type: "service", sub: "Playwright + Axe-Core Engine" },
            { id: 3, name: "Vision & Contrast AI", type: "ai", sub: "Görme Engelli & Renk Körü Simülasyonu" },
            { id: 4, name: "PostgreSQL & Report DB", type: "storage", sub: "Erişilebilirlik Skorları & Çözüm Kodu" },
            { id: 5, name: "Canlı Önizleme & Fixer", type: "client", sub: "Next.js + Web Component Enjeksiyonu" }
        ],
        step1: {
            marketGap: `Cumhurbaşkanlığı Dijital Dönüşüm Ofisi genelgeleri ve 5378 sayılı Engelliler Kanunu uyarınca, Türkiye'deki tüm kamu kurumları, belediyeler, üniversiteler ve bankalar web sitelerini **WCAG 2.2 Seviye AA** erişilebilirlik standartlarına uygun hale getirmek zorundadır. Ancak Türkiye'deki kamu ve belediye sitelerinin %88'i görme engelli ekran okuyucuları (NVDA, JAWS), renk körleri veya motor engelli kullanıcılar için erişilebilir değildir (Eksik ARIA etiketleri, yetersiz kontrast, klavye odağının kaybolması). Mevcut araçlar yalnızca statik hata listesi verir; hatanın nasıl düzeltileceğini gösteren temiz HTML/CSS kodunu üretmez. KamuUI A11y, siteleri otomatik tarar, engelli kullanıcı deneyimini simüle eder ve tek satır script ile eksik ARIA etiketlerini canlı düzelten erişilebilirlik katmanı sunar.`,
            description: `KamuUI A11y, web sitelerini uluslararası erişilebilirlik standartlarına kavuşturan ve kurumsal tasarım sistemlerine dönüştüren yapay zeka destekli bir tasarım-kod optimizasyon platformudur.

**Temel Yetenekler & Özellikler:**
• **WCAG 2.2 AA/AAA Otomatik Denetim**: Kontrast oranları, klavye navigasyonu, form etiketleri ve dokunmatik hedef boyutlarını saniyeler içinde denetler.
• **Ekran Okuyucu & Renk Körlüğü Simülasyonu**: Tasarımcıya ve kamu yetkilisine görme engelli bir vatandaşın siteyi nasıl deneyimlediğini sesli ve görsel olarak canlandırır.
• **Yapay Zeka ile Otomatik Alt-Metin (Alt-Text) Üretimi**: Sitede açıklaması olmayan fotoğrafları görsel tanıma modelleriyle analiz ederek Türkçe anlamlı alt etiketleri üretir.
• **Tek Satırlık Canlı Erişilebilirlik Widget'ı**: Kod değişikliğine bütçesi olmayan kamu sitelerine tek bir JS script ile klavye navigasyonu ve yazı büyütme desteği sağlar.`,
            tags: ["TypeScript", "Next.js", "Playwright", "Axe-Core", "WCAG 2.2", "Figma API", "Kamu Standartları"]
        },
        step2: {
            architecture: `KamuUI A11y, siteleri headless tarayıcılarla derinlemesine taramak için **Headless Browser Cluster & Micro-Frontend** mimarisini kullanır.

### 1. Sistem Katmanları:
• **Browser Automation Crawler (Node.js / Playwright)**: Hedef web sayfalarını headless Chromium ile açar, DOM ağacını ve Computed CSS stillerini ayıklar.
• **Accessibility Engine (Axe-Core + Custom Rules)**: WCAG 2.2 ve Cumhurbaşkanlığı Dijital Dönüşüm Ofisi kriterlerini test eden kural motoru.
• **Multimodal AI Alt-Text Engine (Python / Vision Transformers)**: Görselleri inceleyip Türkçe erişilebilirlik açıklamaları oluşturan vision ajanı.
• **Fixer Web Component**: İstemci tarafında sıfır gecikmeyle çalışan Vanilla JS erişilebilirlik katmanı.

### 2. Somut Teknoloji Yığını:
• **Crawler**: TypeScript + Playwright + axe-core
• **Backend & API**: Node.js Fastify + Redis Queue (BullMQ)
• **Frontend**: Next.js 14 + TailwindCSS + Radix UI Primitives

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`audited_domains\` (id, domain_url, institution_name, current_wcag_score, last_audit_date)
• \`accessibility_violations\` (id, domain_id FK, rule_id, selector, html_snippet, suggested_fix_code)
• \`generated_alt_texts\` (id, image_url, ai_description_tr, is_approved)

### 4. API Kontratları:
• \`POST /api/v1/audit/start\`: Canlı web sitesi erişilebilirlik taraması başlatma.
• \`GET /api/v1/widget/bundle.js\`: Sitelerin canlı entegre edeceği optimize edilmiş widget script'i.`,
            security: `Kamu sitelerinin güvenliği için **Zero-Trust Network Access** standartları uygulanır.

### 1. Güvenli Tarama (Sandboxed Scraping):
• Tarama işlemi izole container'larda çalışır, hedef sitenin oturum çerezleri veya hassas kullanıcı verileri asla kaydedilmez.

### 2. CSP & Script Güvenliği:
• Sitelere enjekte edilen widget script'i hiçbir harici bağımlılık içermez, Subresource Integrity (SRI) hash'i ile doğrulanır.`
        }
    },
    {
        id: "fluidmotion-gen",
        title: "FluidMotion AI",
        tagline: "Web ve Mobil İçin Fizik Tabanlı Mikro-Animasyon ve İnteraktif UI Geçiş Kodu Üretim Motoru",
        category: "Web & Ürün Tasarımı",
        categoryKey: "design",
        scope: "international",
        meta: {
            difficulty: "Orta Düzey",
            mvpTime: "4 Hafta",
            monetization: "Bireysel / Ajans Aboneliği ($19/ay) + Marketplace Animasyon Satışı",
            opportunityScore: "%94 Fırsat Skoru",
            scope: "international"
        },
        diagramNodes: [
            { id: 1, name: "UI Bileşen Seçimi / Çizim", type: "source", sub: "SVG / Canvas / HTML Girişi" },
            { id: 2, name: "Fizik Motoru Simülatörü", type: "service", sub: "Spring Physics + Euler Integrator" },
            { id: 3, name: "Mikro-Etkileşim AI", type: "ai", sub: "Doğal Hareket & Easing Eğrisi AI" },
            { id: 4, name: "PostgreSQL & CDN", type: "storage", sub: "Animasyon Kütüphanesi & Kod Deposu" },
            { id: 5, name: "Çoklu Kod Çıktısı (Export)", type: "client", sub: "Framer Motion, CSS, Rive, Lottie" }
        ],
        step1: {
            marketGap: `Modern web ve mobil uygulamalarda kullanıcı bağlılığını (Engagement) artıran en kritik unsur Apple ve Stripe kalitesindeki akıcı mikro-animasyonlardır (Buton tıklama efektleri, sayfa geçişleri, sürükle-bırak yay fizikleri). Ancak bu fizik tabanlı animasyonları (Spring Physics, Damping, Stiffness) kodlamak geliştiriciler için saatler süren matematiksel deneme-yanılma süreçleri gerektirir. Mevcut Lottie ve GIF araçları ise statiktir ve kullanıcı etkileşimine (Cursor hızı, dokunma ivmesi) gerçek zamanlı tepki veremez. FluidMotion AI, tasarımcının doğal dille tarif ettiği ('Stripe tarzı elastik kart açılışı') veya çizdiği hareketi anında Framer Motion, CSS Keyframes, Rive ve Swift/SwiftUI koduna dönüştürür.`,
            description: `FluidMotion AI, kullanıcı deneyimini üst seviyeye taşıyan fizik tabanlı mikro-animasyonlar üreten ve dışa aktaran yapay zeka tasarım motorudur.

**Temel Yetenekler & Özellikler:**
• **Fizik Tabanlı Yay Animasyonları (Spring Physics)**: Kütle (Mass), sertlik (Stiffness) ve sönümleme (Damping) parametrelerini gerçek zamanlı simüle eder.
• **Tek Tıkla Çoklu Framework Kod Çıktısı**: Hazırlanan animasyonu Framer Motion (React), Tailwind CSS Keyframes, GSAP, Flutter ve SwiftUI kodlarına anında dönüştürür.
• **İmleç İvmesine Duyarlı İnteraktif Efektler**: Fare hızına ve dokunma şiddetine göre esneyen sıvı cam (Glassmorphism) ve manyetik buton efektleri oluşturur.
• **Performans & GPU Optimizasyonu**: Animasyonların sadece GPU hızlandırmalı CSS özelliklerini (\`transform\`, \`opacity\`) kullanarak 60 FPS akıcı çalışmasını garanti eder.`,
            tags: ["Framer Motion", "React", "GSAP", "TailwindCSS", "SwiftUI", "Canvas", "WebGL"]
        },
        step2: {
            architecture: `FluidMotion AI, sıfır gecikmeyle 60 FPS canlı önizleme sunmak için **Browser-Side Physics Engine & WebGL Canvas** mimarisini kullanır.

### 1. Sistem Katmanları:
• **Physics Simulation Engine (TypeScript / WebAssembly)**: Yay ve parçacık fiziklerini 60 FPS'de hesaplayan istemci tarafı simülatör.
• **Animation Code Synthesizer (Python / Rust)**: Fizik eğrilerini CSS kübik bezier ve Framer Motion konfigürasyonuna çeviren derleyici.
• **Interactive Playground (React 18 + Canvas/WebGL)**: Kullanıcının animasyon parametrelerini anlık kaydırıcılarla (Sliders) değiştirdiği stüdyo.
• **Export Packaging Service (Node.js)**: NPM paketi veya Lottie/Rive JSON dosyası olarak derleyen dışa aktarma servisi.

### 2. Somut Teknoloji Yığını:
• **Physics Engine**: TypeScript + WebGL + Canvas API
• **Backend**: Python FastAPI + Node.js
• **Frontend**: React + Framer Motion + TailwindCSS + Lucide Icons

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`animation_presets\` (id, title, category, spring_config_json, framer_motion_code, preview_gif_url)
• \`user_saved_animations\` (id, user_id, preset_name, custom_params_json, created_at)

### 4. API Kontratları:
• \`POST /api/v1/motion/generate-code\`: Fizik parametrelerinden framework kod çıktısı alma.
• \`GET /api/v1/motion/community-library\`: Popüler mikro-etkileşim kütüphanesi listesi.`,
            security: `Kullanıcıların oluşturduğu animasyon tasarımları güvenli şekilde saklanır.

### 1. XSS ve CSS Injection Koruması:
• Üretilen tüm CSS ve JS kod parçaları sanitize edilir; tarayıcıda zararlı script çalıştırma riskleri engellenir.`
        }
    },

    // =========================================================================
    // 8. MOBİL UYGULAMA GELİŞTİRME (mobile)
    // =========================================================================
    {
        id: "esnaf-pos-ai",
        title: "EsnafPOS AI (GİB e-Arşiv & FAST Uyumlu)",
        tagline: "Yerli KOBİ ve Esnaf İçin Çevrimdışı Çalışan Mobil POS, GİB e-Arşiv Fatura ve İyzico/FAST Mikro-Kasa Ajanı",
        category: "Mobil Uygulama",
        categoryKey: "mobile",
        scope: "national",
        meta: {
            difficulty: "Orta Düzey",
            mvpTime: "5 Hafta",
            monetization: "İşlem Başı Mikro Komisyon + Aylık Premium Esnaf Aboneliği",
            opportunityScore: "%98 Fırsat Skoru",
            scope: "national"
        },
        diagramNodes: [
            { id: 1, name: "Esnaf Mobil Cihazı (NFC)", type: "source", sub: "SoftPOS & Kamera Barkod" },
            { id: 2, name: "Offline Sync Engine", type: "service", sub: "WatermelonDB + SQLite" },
            { id: 3, name: "GİB & Ödeme Entegratörü", type: "ai", sub: "e-Arşiv Fatura & İyzico/FAST" },
            { id: 4, name: "PostgreSQL & Redis", type: "storage", sub: "Kasa Defteri & Stok Deposu" },
            { id: 5, name: "Müşteri e-Fatura / Fiş", type: "client", sub: "WhatsApp / SMS / QR Fiş" }
        ],
        step1: {
            marketGap: `Türkiye'de 2.2 milyondan fazla küçük esnaf (bakkal, berber, tesisatçı, pazarcı vb.) yüksek banka POS cihazı komisyonları (aylık kira + %3.5 komisyon) ve Gelir İdaresi Başkanlığı'nın (GİB) 5.000 TL üzeri zorunlu e-Arşiv fatura kesme mevzuatı arasında sıkışmıştır. Geleneksel masaüstü muhasebe yazılımları esnaf için fazla karmaşık ve pahalıdır; internet kesildiğinde ise satış durmaktadır. EsnafPOS AI, esnafın kendi akıllı telefonunu NFC ile anında SoftPOS cihazına dönüştürür; internet olmasa dahi satış kaydeder, bağlantı geldiğinde tek tuşla GİB onaylı e-Arşiv fatura keser ve FAST/Karekod ile komisyonsuz tahsilat sağlar.`,
            description: `EsnafPOS AI, küçük işletmelerin telefonlarından satış, stok, fatura ve ödeme süreçlerini yöneten otonom bir mobil mikro-kasa uygulamasıdır.

**Temel Yetenekler & Özellikler:**
• **NFC ile Temassız Ödeme (SoftPOS)**: Müşterinin temassız kredi kartını veya Troy kartını telefonun arkasına dokundurarak ek donanımsız ödeme alır.
• **GİB e-Arşiv Fatura Otomasyonu**: Satış tamamlandığında müşterinin T.C./Vergi numarasını sesli söyletir ve tek tıkla resmi GİB onaylı e-Faturayı oluşturup WhatsApp'tan gönderir.
• **TR-Karekod ve FAST Entegrasyonu**: Banka kart komisyonundan kaçınmak isteyen müşteriler için TCMB FAST sistemiyle anında hesaba geçen dinamik TR-Karekod üretir.
• **Sesli Stok ve Borç Defteri Ajanı**: 'Ahmet amcaya 3 paket çay ve 2 ekmek yaz, 120 TL borcu kaldı' dendiğinde doğal dille dijital veresiye defterini günceller.`,
            tags: ["React Native", "Expo", "Go", "GİB e-Arşiv", "NFC SoftPOS", "İyzico / FAST", "KOSGEB Destekli"]
        },
        step2: {
            architecture: `EsnafPOS AI, pazar yerlerinde ve kırsal alanlarda internet kesintilerine dayanıklı olmak için **Offline-First & Local-First Database** mimarisini kullanır.

### 1. Sistem Katmanları:
• **Mobile Client (React Native / Expo)**: Cihazın yerel NFC çipini, kamerasını ve SQLite yerel veritabanını yöneten mobil katman.
• **Offline Synchronization Engine (WatermelonDB)**: İnternet kesintisinde işlemleri yerel SQLite'a yazar, internet geldiğinde sunucuyla çatışmasız (CRDT) senkronize eder.
• **Payment & Invoice Gateway (Go)**: İyzico/PayTR API'leri ve GİB e-Arşiv portalı ile güvenli iletişim kuran arka plan mikroservisi.
• **AI Voice Agent (Python / Whisper AI)**: Esnafın sesli komutlarını yapılandırılmış muhasebe işlemlerine dönüştüren NLP servisi.

### 2. Somut Teknoloji Yığını:
• **Mobil**: React Native + TypeScript + WatermelonDB + SQLite
• **Backend**: Go (Gin Framework) + Python FastAPI
• **Veritabanı**: PostgreSQL 16 + Redis (Idempotency Key Önbelleği)

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`merchants\` (id, tax_number, business_name, bank_iban, created_at)
• \`products\` (id, merchant_id FK, barcode, name, price, stock_quantity)
• \`transactions\` (id, merchant_id FK, amount, payment_method, gib_invoice_uuid, sync_status)
• \`debt_ledger\` (id, merchant_id FK, customer_name, customer_phone, balance, last_payment_date)

### 4. API Kontratları:
• \`POST /api/v1/pos/charge-nfc\`: Temassız SoftPOS tahsilat isteği.
• \`POST /api/v1/invoices/issue-gib\`: GİB e-Arşiv fatura oluşturma ve imzalatma.`,
            security: `Ödeme ve finansal kayıtlar **PCI-DSS Seviye 1** ve **KVKK** standartlarına göre güvenceye alınır.

### 1. NFC & Kart Güvenliği:
• Kart bilgileri (PAN ve CVV) asla telefonda veya sunucuda saklanmaz; EMVCo ve BKM standartlarına göre şifreli token'lar (Tokenization) kullanılır.

### 2. Yerel Veri Şifreleme:
• Telefondaki SQLite veritabanı SQLCipher ile donanımsal anahtar (Android KeyStore / iOS Secure Enclave) kullanılarak AES-256 ile şifrelenir.`
        }
    },
    {
        id: "offline-health-tracker",
        title: "EdgePulse Health",
        tagline: "İnternet ve Bulut Gerektirmeyen, Cihaz Üstü (On-Device) Yapay Zeka ile EKG ve Nabız Anomali Tespit Mobil Uygulaması",
        category: "Mobil Uygulama",
        categoryKey: "mobile",
        scope: "international",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "6 Hafta",
            monetization: "Freemium + Yıllık Sağlık Raporu Aboneliği ($39/yıl)",
            opportunityScore: "%95 Fırsat Skoru",
            scope: "international"
        },
        diagramNodes: [
            { id: 1, name: "Apple Watch / WearOS BLE", type: "source", sub: "Canlı EKG ve PPG Sensörleri" },
            { id: 2, name: "CoreBluetooth / Android BLE", type: "service", sub: "Milisaniyelik Sinyal İşleme" },
            { id: 3, name: "On-Device Neural Engine", type: "ai", sub: "Apple Neural Engine / NNAPI TFLite" },
            { id: 4, name: "Encrypted SQLite (SQLCipher)", type: "storage", sub: "Cihaz İçi Şifreli Sağlık Kasası" },
            { id: 5, name: "Kardiyolog PDF Raporu", type: "client", sub: "SwiftUI / Jetpack Compose Arayüz" }
        ],
        step1: {
            marketGap: `Giyilebilir sağlık cihazları (Apple Watch, Fitbit, Garmin) sürekli kalp ritmi ve EKG verisi toplamaktadır; ancak mevcut sağlık uygulamaları bu verileri analiz etmek için uzak bulut sunucularına göndermek zorundadır. Bu durum hem internet olmayan durumlarda (uçakta, doğada, spor yaparken) atriyal fibrilasyon ve kalp krizi erken uyarılarının çalışmamasına yol açar, hem de kullanıcıların en mahrem sağlık verilerini sigorta şirketlerinin sızdırmasına zemin hazırlar. EdgePulse Health, en son Apple Neural Engine ve Android NNAPI donanımlarını kullanarak 1D-CNN derin öğrenme modellerini tamamen telefonun işlemcisinde (On-Device) sıfır internet ve sıfır bulut bağımlılığıyla çalıştırır; gizliliği %100 koruyarak 3 saniyede ritim bozukluğunu tespit eder.`,
            description: `EdgePulse Health, akıllı saatlerden gelen EKG ve nabız sinyallerini telefonun kendi yapay zeka çipinde analiz eden gizlilik öncelikli bir kardiyoloji takip uygulamasıdır.

**Temel Yetenekler & Özellikler:**
• **%100 Çevrimdışı ve Bulutsuz Analiz**: Sağlık verileri asla telefondan dışarı çıkmaz; tüm yapay zeka çıkarımı cihazın donanımsal Neural Engine çipinde mikrosaniyede yapılır.
• **Atriyal Fibrilasyon & Aritmi Tespiti**: Gelen tek kanallı EKG sinyalini P, Q, R, S, T dalga anomalilerine göre sınıflandırarak ritim bozukluklarını %98 hassasiyetle yakalar.
• **Kardiyolog Onaylı Standart PDF Raporu**: Acil servise veya doktora gösterilmek üzere uluslararası kardiyoloji formatında grafikli EKG döküm raporu oluşturur.
• **Stres ve Vagal Tonus (HRV) Koçluğu**: Kalp Hızı Değişkenliği (HRV) verilerinden otonom nefes egzersizi ve stres düşürme tavsiyeleri üretir.`,
            tags: ["Swift", "Kotlin", "CoreML", "TensorFlow Lite", "Apple Watch", "WearOS", "HealthKit"]
        },
        step2: {
            architecture: `EdgePulse Health, sıfır batarya tüketimi ve maksimum gizlilik için **Local-First On-Device AI & Reactive BLE** mimarisini kullanır.

### 1. Sistem Katmanları:
• **Wearable Sensor Stream (Swift / CoreBluetooth)**: Akıllı saatten gelen 250 Hz PPG ve EKG telemetri paketlerini düşük enerjiyle karşılar.
• **Signal Preprocessing (C++ / Accelerate Framework)**: Bandpass filtreleme ve dalgacık dönüşümü (Wavelet Transform) ile kas gürültüsünü temizleyen sinyal işleme hattı.
• **On-Device Inference Engine (CoreML / TFLite)**: Kuantize edilmiş (INT8) 1D Evrişimli Sinir Ağı (1D-CNN) çıkarım modeli.
• **Local Secure Storage (SQLCipher)**: Sağlık verilerini donanımsal anahtarla şifreleyen yerel veritabanı.

### 2. Somut Teknoloji Yığını:
• **iOS**: Swift 5.10 + SwiftUI + CoreML + HealthKit
• **Android**: Kotlin + Jetpack Compose + NNAPI + Health Connect
• **Core Sinyal**: C++20 (vDSP / Accelerate)

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`ecg_recordings\` (id PK, recorded_at, sample_rate_hz, raw_signal_blob, classified_rhythm, confidence)
• \`hrv_daily_metrics\` (date PK, rmssd_ms, sdnn_ms, stress_index, recovery_score)
• \`doctor_exports\` (id, recording_id FK, pdf_local_path, shared_at)

### 4. API Kontratları:
• Sistem tamamen sunucusuzdur (Zero-Backend); cihazlar arası senkronizasyon yalnızca Apple iCloud Encrypted Keychain üzerinden gerçekleşir.`,
            security: `Sağlık verileri en üst düzeyde donanımsal şifrelemeyle korunur.

### 1. Donanımsal Anahtar İzolasyonu:
• Veritabanı şifreleme anahtarı Apple Secure Enclave / Android StrongBox donanım çiplerinde tutulur, biyometrik (FaceID / Parmak İzi) doğrulaması olmadan açılamaz.`
        }
    },
    {
        id: "ar-interior-designer",
        title: "SpatialRoom AR",
        tagline: "LiDAR Sensörlü Mekan Tarama, Otonom 3B Mobilya Yerleşimi ve İç Mekan Yenileme Mobil Uygulaması",
        category: "Mobil Uygulama",
        categoryKey: "mobile",
        scope: "international",
        meta: {
            difficulty: "İleri Düzey",
            mvpTime: "8 Hafta",
            monetization: "Mobilya Markası Komisyonu (%5-10) + Aylık Pro Mimar Aboneliği",
            opportunityScore: "%96 Fırsat Skoru",
            scope: "international"
        },
        diagramNodes: [
            { id: 1, name: "Telefon LiDAR / Kamera", type: "source", sub: "iPhone / iPad Pro ARKit Tarama" },
            { id: 2, name: "Spatial Mesh Reconstruction", type: "service", sub: "Apple RoomPlan API + Metal" },
            { id: 3, name: "3B Yerleşim & Aydınlatma AI", type: "ai", sub: "Generative Spatial Design LLM" },
            { id: 4, name: "Cloudflare R2 & USDZ Deposu", type: "storage", sub: "3D CAD & Mobilya Varlık Deposu" },
            { id: 5, name: "Fotogerçekçi AR Önizleme", type: "client", sub: "RealityKit + Unity AR Foundation" }
        ],
        step1: {
            marketGap: `Evini veya ofisini yeniden dekore etmek isteyen tüketicilerin %65'i satın aldıkları mobilyaların odaya sığmaması, renk uyumsuzluğu veya aydınlatma hataları yüzünden iade süreçleriyle uğraşmaktadır. Geleneksel e-ticaret siteleri (IKEA, Wayfair vb.) mobilyaları yalnızca tek tek 3B model olarak gösterir; odanın tüm duvarlarını, pencerelerini, kapılarını ve zeminini bir bütün olarak tarayıp odaya en uygun koltuk, masa ve aydınlatma kombinasyonunu otomatik yerleştiren 'Otonom İç Mimar' vizyonu sunamaz. SpatialRoom AR, LiDAR sensörüyle odayı 10 saniyede 3B dijital ikize dönüştürür; mevcut eski eşyaları yapay zeka ile görsel olarak odadan siler (In-painting) ve yerine milimetrik hassasiyette yeni dekorasyon stilleri yerleştirir.`,
            description: `SpatialRoom AR, iPhone ve Android telefonlardaki LiDAR ve kamera sensörlerini kullanarak fotogerçekçi iç mekan tasarımı ve mobilya yerleşimi yapan artırılmış gerçeklik (AR) uygulamasıdır.

**Temel Yetenekler & Özellikler:**
• **10 Saniyede 3B Oda Taraması (LiDAR RoomPlan)**: Odanın duvarlarını, kapılarını, pencerelerini ve ölçülerini milimetrik hassasiyetle CAD formatında çıkarır.
• **Eski Mobilyaları Canlı Silme (AR Object Removal)**: Odadaki mevcut eski mobilyaları kamera görüntüsünden anlık olarak silip boş odayı gösterir.
• **Yapay Zeka İç Mimar Stili Önerisi**: 'Bu odayı İskandinav minimalist tarzda ve 50.000 TL bütçeyle yeniden tasarla' komutuna uygun mobilya sepeti oluşturur.
• **Fotogerçekçi Işık ve Gölge Uyumu**: Odanın gerçek ışık kaynaklarını (Pencere, avize) analiz ederek 3B mobilyaların üzerine gerçekçi gölgeler düşürür (Ray-Tracing).`,
            tags: ["Swift", "ARKit", "RealityKit", "RoomPlan", "Unity", "Python", "USDZ"]
        },
        step2: {
            architecture: `SpatialRoom AR, yüksek 3B grafik performansı ve uzamsal hesaplama için **Native Spatial Computing & Hybrid Edge-Cloud** mimarisini kullanır.

### 1. Sistem Katmanları:
• **Spatial Capture Layer (Swift / RoomPlan + ARKit)**: LiDAR nokta bulutunu (Point Cloud) parametrik 3B oda yüzeylerine dönüştüren yerel iOS katmanı.
• **Spatial Interior AI (Python / PyTorch3D + CLIP)**: Odanın geometrisine ve ergonomik geçiş kurallarına uygun mobilya yerleşim matrisini hesaplayan motor.
• **Real-Time 3D Rendering (RealityKit / Metal)**: USDZ formatındaki yüksek poligonlu mobilya modellerini 60 FPS'de render eden uzamsal motor.
• **E-Commerce Catalog Sync (Node.js / GraphQL)**: Mobilya markalarının anlık stok ve fiyat verilerini eşitleyen arka plan servisi.

### 2. Somut Teknoloji Yığını:
• **iOS Spatial**: Swift + RoomPlan API + RealityKit + Metal Shaders
• **AI Engine**: Python FastAPI + PyTorch3D + Stable Diffusion In-Painting
• **Veritabanı & CDN**: PostgreSQL 16 + Cloudflare R2 (USDZ/glTF 3D Deposu)

### 3. Veritabanı Şeması & Varlık İlişkileri:
• \`scanned_rooms\` (id, user_id, usdz_mesh_url, floor_area_sqm, ceiling_height_m)
• \`furniture_catalog\` (id, brand_name, dimensions_xyz, usdz_model_url, price_try, buy_affiliate_url)
• \`room_designs\` (id, room_id FK, style_theme, total_cost_try, placed_items_json)

### 4. API Kontratları:
• \`POST /api/v1/spatial/generate-layout\`: Oda ölçülerine göre mobilya yerleşim önerisi alma.
• \`GET /api/v1/models/furniture/:id.usdz\`: Optimize edilmiş 3B model indirme.`,
            security: `Kullanıcıların ev ve özel yaşam alanlarının 3B taranması en yüksek mahremiyet standartlarını gerektirir.

### 1. Mekan Geometrisi Gizliliği:
• Taranan odadaki kişisel fotoğraflar, aile fertleri ve özel eşyalar taranırken kamerada otomatik bulanıklaştırılır (Face & PII Blur).

### 2. Şifreli 3D Depolama:
• Oda modelleri Cloudflare R2 üzerinde istemci tarafı şifrelemeyle (Client-Side Encryption) saklanır.`
        }
    },

    // --- Kapsam dengeleyici örnekler -------------------------------------------
    // Kapsam seçicisi eklendiğinde her kategoride yalnızca bir ulusal proje kalmıştı;
    // "Ulusal + DevOps" seçen kullanıcı aynı projeyi arka arkaya görüyordu. Aşağıdaki
    // projeler her kategori × kapsam kovasını en az ikiye çıkarır.

    {
        id: 'tapuchain-kadastro',
        title: 'TapuChain Kadastro',
        tagline: 'TKGM Tapu ve Kadastro Kayıtları İçin Değiştirilemez Blokzincir Denetim ve Şerh Doğrulama Katmanı',
        category: 'Web3, Blockchain & Güvenlik',
        categoryKey: 'web3',
        scope: 'national',
        meta: {
            difficulty: 'Uzman Düzey',
            mvpTime: '10 Hafta',
            monetization: 'Kamu Kurumsal Lisansı + Noter/Banka Başına API Ücretlendirmesi',
            opportunityScore: '%94 Fırsat Skoru',
            scope: 'national'
        },
        diagramNodes: [
            { id: 1, name: 'TAKBİS / TKGM Servisi', type: 'source', sub: 'Tapu Kayıt Akışı (SOAP/REST)' },
            { id: 2, name: 'Kayıt Normalizasyon Servisi', type: 'service', sub: 'Go + Ada/Parsel Şema Doğrulama' },
            { id: 3, name: 'Anomali & Şerh Analiz Ajanı', type: 'ai', sub: 'Graph Neural Network' },
            { id: 4, name: 'İzinli Blokzincir (Hyperledger)', type: 'storage', sub: 'Merkle Kanıt + PostgreSQL' },
            { id: 5, name: 'Noter & Banka Portalı', type: 'client', sub: 'React + e-İmza Doğrulama' }
        ],
        step1: {
            marketGap: 'Türkiye\'de gayrimenkul devirleri TAKBİS üzerinden yürür ve tapu kaydındaki bir şerhin, haczin veya ipoteğin ne zaman eklendiği/kaldırıldığı yalnızca merkezi veritabanı loglarında tutulur. Bu durum, tapu iptali ve tescil davalarında "kaydın o tarihte gerçekten ne olduğu" sorusunu bilirkişiye bırakır; dosyalar yıllarca sürer. Mevcut blokzincir tapu girişimleri ise kamu verisini herkese açık ağlara yazmayı önerdiği için KVKK ve veri egemenliği açısından uygulanamaz kalmıştır. TapuChain, tapu kaydının kendisini değil, kaydın kriptografik parmak izini izinli bir zincire yazarak mahkemede kanıt değeri taşıyan, geri dönüşü olmayan bir zaman damgası üretir.',
            description: 'TapuChain, TAKBİS ile kurumsal entegrasyon üzerinden çalışan bir doğrulama ve denetim katmanıdır.\n\n**Temel İşlevler & Özellikler:**\n• **Kriptografik Zaman Damgası**: Her tapu işleminin (satış, ipotek, haciz, şerh) kanonik gösterimi SHA-256 ile özetlenir ve izinli zincire yazılır; kişisel veri zincire hiç çıkmaz.\n• **Şerh Zinciri Görselleştirme**: Bir parselin üzerindeki tüm takyidatların zaman çizelgesi, hangi kurumun ne zaman eklediğiyle birlikte tek ekranda gösterilir.\n• **Anomali Tespiti**: Kısa aralıkla tekrarlanan devirler, dairesel satışlar ve değer manipülasyonu şüphesi taşıyan zincirler graf analiziyle işaretlenir.\n• **Noter & Banka Doğrulama API\'si**: Kredi tahsisi öncesinde bankanın gördüğü tapu kaydının o an geçerli olduğu, tek çağrıyla kanıtlanır.',
            tags: ['Go', 'Hyperledger Fabric', 'PostgreSQL', 'GNN', 'React', 'e-İmza']
        },
        step2: {
            architecture: 'TapuChain, kamu verisinin kurum dışına çıkmadığı **izinli (permissioned) blokzincir** modeline dayanır.\n\n### 1. Sistem Katmanları:\n• **Ingestion Service (Go)**: TAKBİS servislerinden gelen işlem olaylarını dinler, ada/parsel/malik şemasını doğrular ve kanonik JSON gösterimine çevirir.\n• **Hashing & Anchor Service (Rust)**: Kanonik gösterimin SHA-256 özetini alır, Merkle ağacına ekler ve kök özeti Hyperledger Fabric kanalına yazar.\n• **Analysis Service (Python / PyTorch Geometric)**: Malik-parsel-işlem grafiği üzerinde anomali skorlaması yapar.\n• **Portal (React + Vite)**: Noter, banka ve kurum kullanıcıları için sorgu ve kanıt indirme arayüzü.\n\n### 2. Veritabanı Mimarisi:\n• **PostgreSQL**: Parsel meta verisi, kullanıcı ve kurum yetkileri, sorgu geçmişi.\n• **Hyperledger Fabric**: Yalnızca Merkle kökleri ve blok zaman damgaları.\n• **Redis**: Sık sorgulanan parsel kanıtları için önbellek.',
            security: 'Tapu verisi hem kişisel veri hem de ekonomik değer taşıdığı için mimari **veri minimizasyonu** ilkesi üzerine kuruludur.\n\n### 1. Güvenlik Önlemleri & Standartlar:\n• **Zincire Kişisel Veri Yazılmaz**: T.C. Kimlik No, ad-soyad ve adres hiçbir koşulda zincire çıkmaz; zincirde yalnızca geri döndürülemez özetler bulunur. Bu, KVKK m.7 (silme/yok etme) yükümlülüğünün zincir değişmezliğiyle çakışmasını önler.\n• **Kurumsal Kimlik Doğrulama**: Noter ve banka erişimi e-İmza / mobil imza ve mTLS sertifikalarıyla yapılır; her sorgu kurum bazında imzalanır.\n• **Yetkilendirme (RBAC + ABAC)**: Bir kurumun yalnızca ilgili olduğu dosyaya erişmesi, öznitelik tabanlı politikalarla kısıtlanır.\n• **Denetim İzleri**: Kim, hangi parseli, ne zaman sorguladı bilgisi değiştirilemez append-only logda tutulur ve KVKK denetimlerinde ibraz edilir.'
        }
    },

    {
        id: 'edevlet-yuk-kalkani',
        title: 'e-Devlet Yük Kalkanı',
        tagline: 'Kamu Servislerinde YKS, Vergi ve Bayram Yoğunluğu Zirvelerini Öngören Otonom Ölçekleme ve Kuyruk Yönetim Katmanı',
        category: 'Altyapı, Cloud & Performans',
        categoryKey: 'infrastructure',
        scope: 'national',
        meta: {
            difficulty: 'İleri Düzey',
            mvpTime: '8 Hafta',
            monetization: 'Kamu Kurumsal Lisansı + KOSGEB Dijitalleşme Destekli Kurulum',
            opportunityScore: '%93 Fırsat Skoru',
            scope: 'national'
        },
        diagramNodes: [
            { id: 1, name: 'Kurum Trafik Toplayıcı', type: 'source', sub: 'Nginx / HAProxy Log Akışı' },
            { id: 2, name: 'Adaptif Kuyruk Kapısı', type: 'service', sub: 'Rust + Sanal Bekleme Odası' },
            { id: 3, name: 'Talep Tahmin Modeli', type: 'ai', sub: 'LSTM + Takvim Özellikleri' },
            { id: 4, name: 'VictoriaMetrics & Redis', type: 'storage', sub: 'Zaman Serisi & Kuyruk Durumu' },
            { id: 5, name: 'Kurum Operasyon Paneli', type: 'client', sub: 'Vue 3 + Canlı Kapasite Haritası' }
        ],
        step1: {
            marketGap: 'Türkiye\'de kamu dijital servisleri yılın büyük bölümünde düşük trafikle çalışır, ancak YKS/LGS sonuç açıklaması, vergi beyan son günü, e-Devlet üzerinden yapılan başvuru kampanyaları ve bayram tatili başvuruları gibi belirli anlarda trafik saatler içinde onlarca katına çıkar. Kurumlar bu zirveleri karşılamak için tüm yıl boyunca atıl donanım satın alır; buna rağmen zirve anlarında sistemler yanıt veremez ve vatandaş "sistem yoğun" ekranıyla karşılaşır. Mevcut otomatik ölçekleme çözümleri tepkiseldir: yükü gördükten sonra kapasite eklerler ve yeni sunucu ayağa kalkana kadar geçen sürede hizmet çoktan kesilmiştir. e-Devlet Yük Kalkanı, zirveyi takvimden ve erken sinyallerden önceden tahmin ederek kapasiteyi yük gelmeden hazırlar.',
            description: 'Yük Kalkanı, kurum servislerinin önüne şeffaf biçimde konumlanan bir tahmin ve kuyruk yönetim katmanıdır.\n\n**Temel İşlevler & Özellikler:**\n• **Takvim Farkındalıklı Tahmin**: Resmî tatiller, sınav sonuç tarihleri, beyan son günleri ve geçmiş yıl eğrileri modele özellik olarak verilir; kapasite zirveden önce artırılır.\n• **Adil Sanal Bekleme Odası**: Kapasite aşıldığında istekler reddedilmez; vatandaş sırasını ve tahmini bekleme süresini gören bir kuyruğa alınır.\n• **Öncelik Sınıfları**: Kritik işlemler (acil sağlık, afet başvurusu) ayrı kuyrukta önceliklendirilir.\n• **Atıl Kapasite Raporu**: Kurumun yıl boyunca ne kadar donanım fazlası taşıdığını ve tahmine dayalı ölçeklemeyle ne kadar tasarruf edeceğini raporlar.',
            tags: ['Rust', 'Go', 'LSTM', 'Kubernetes', 'VictoriaMetrics', 'Vue.js']
        },
        step2: {
            architecture: 'Sistem, istek yolunda mikrosaniye seviyesinde karar vermek zorunda olduğu için **veri düzlemi / kontrol düzlemi** ayrımıyla kurgulanmıştır.\n\n### 1. Sistem Katmanları:\n• **Data Plane (Rust + Tokio)**: Gelen HTTP isteklerini karşılar, kuyruk jetonunu doğrular ve arka uca geçirir. Durum Redis\'te tutulur, karar yerelde verilir.\n• **Control Plane (Go)**: Kubernetes HPA/KEDA ile konuşarak replika sayısını tahmine göre önceden ayarlar.\n• **Forecast Service (Python)**: LSTM ve Prophet modellerini takvim özellikleriyle eğitir, 15 dakikalık çözünürlükte talep eğrisi üretir.\n• **Operations Console (Vue 3)**: Kapasite, kuyruk uzunluğu ve tahmin sapmasının canlı izlendiği panel.\n\n### 2. Veritabanı Mimarisi:\n• **VictoriaMetrics**: Saniye bazlı istek, gecikme ve hata metrikleri.\n• **Redis Cluster**: Kuyruk jetonları, sıra numaraları ve oturum durumu.\n• **PostgreSQL**: Kurum yapılandırması, öncelik kuralları ve tasarruf raporları.',
            security: 'Kamu trafiğinin önünde duran bir bileşen, saldırı yüzeyinin de önünde durur. Mimari **Zero-Trust** ve **kötüye kullanım direnci** üzerine kuruludur.\n\n### 1. Güvenlik Önlemleri & Standartlar:\n• **Kuyruk Jetonu Sahteciliğine Karşı İmzalama**: Sıra jetonları HMAC-SHA256 ile imzalanır ve tek kullanımlıktır; sıra satın alma veya öne geçme girişimi kriptografik olarak engellenir.\n• **Bot ve Otomasyon Ayrımı**: Davranışsal sinyallerle (istek ritmi, TLS parmak izi) otomatik istemciler ayrı kuyruğa alınır; CAPTCHA yalnızca son çare olarak devreye girer.\n• **Veri Minimizasyonu**: Katman istek gövdesini hiç açmaz; yalnızca yönlendirme meta verisini görür, böylece vatandaş verisi bu bileşende hiç işlenmez.\n• **KVKK & Log Saklama**: IP adresleri loglarda tuzlanmış özet olarak tutulur ve saklama süresi sonunda otomatik olarak silinir.'
        }
    },

    {
        id: 'meb-atolye-asistani',
        title: 'MEB Atölye Asistanı',
        tagline: 'Meslek Liselerinde Atölye Uygulamalarını Adım Adım Denetleyen ve İş Güvenliğini Gözeten Yapay Zeka Öğretmen Yardımcısı',
        category: 'Eğitim Teknolojileri & Yapay Zeka',
        categoryKey: 'edtech',
        scope: 'national',
        meta: {
            difficulty: 'İleri Düzey',
            mvpTime: '7 Hafta',
            monetization: 'MEB Kurumsal Lisansı + TÜBİTAK 1512 BİGG Destekli Ar-Ge',
            opportunityScore: '%92 Fırsat Skoru',
            scope: 'national'
        },
        diagramNodes: [
            { id: 1, name: 'Atölye Kamerası / Tablet', type: 'source', sub: 'Yerel Görüntü Akışı' },
            { id: 2, name: 'Uç Cihaz Çıkarım Servisi', type: 'service', sub: 'NVIDIA Jetson + ONNX Runtime' },
            { id: 3, name: 'Adım & Güvenlik Analiz Modeli', type: 'ai', sub: 'YOLO + Poz Tahmini' },
            { id: 4, name: 'Yerel Okul Sunucusu', type: 'storage', sub: 'SQLite + Şifreli Yedek' },
            { id: 5, name: 'Öğretmen Paneli', type: 'client', sub: 'PWA + Çevrimdışı Çalışma' }
        ],
        step1: {
            marketGap: 'Türkiye\'de meslek liselerinde bir atölye öğretmeni aynı anda 20-30 öğrencinin torna, kaynak, elektrik panosu veya CNC uygulamasını izlemek zorundadır. Bu fiziksel olarak mümkün değildir: hem öğrenme geri bildirimi gecikir hem de iş güvenliği ihlalleri (gözlük takmama, yanlış tutuş, koruyucu kapak açıkken çalıştırma) ancak kaza olduktan sonra fark edilir. Mevcut eğitim yazılımları teorik içerik sunar; el becerisi gerektiren uygulamalı derslerde hiçbir karşılığı yoktur. Ayrıca okul internet altyapısı zayıf olduğu ve öğrenci görüntüleri KVKK kapsamında özel nitelikli veri sayıldığı için buluta görüntü gönderen bir çözüm baştan uygulanamazdır. MEB Atölye Asistanı, tüm görüntü işlemeyi atölyedeki uç cihazda yapar.',
            description: 'Asistan, atölyeye kurulan tek bir uç cihaz ve öğretmenin tabletinden oluşan kapalı bir sistemdir.\n\n**Temel İşlevler & Özellikler:**\n• **Adım Takibi**: Her uygulama için tanımlı iş adımları (ölçüm, sıkma, ayar, kontrol) görüntüden tanınır; atlanan adım öğretmene anında bildirilir.\n• **İş Güvenliği Uyarısı**: Koruyucu gözlük/eldiven eksikliği, tehlikeli bölgeye el yaklaşması ve açık kapakla çalıştırma gerçek zamanlı olarak sesli uyarı üretir.\n• **Bireysel İlerleme Karnesi**: Her öğrencinin hangi adımda zorlandığı biriktirilir; öğretmen dönem sonunda kanıta dayalı değerlendirme yapar.\n• **Tamamen Çevrimdışı**: Görüntü hiçbir zaman okul dışına çıkmaz; internet olmadan da tüm işlevler çalışır.',
            tags: ['Python', 'ONNX Runtime', 'YOLOv8', 'NVIDIA Jetson', 'SQLite', 'PWA']
        },
        step2: {
            architecture: 'Sistem, düşük bant genişliği ve veri gizliliği kısıtları nedeniyle **uçta (edge) öncelikli** tasarlanmıştır; bulut yalnızca model dağıtımı için kullanılır.\n\n### 1. Sistem Katmanları:\n• **Edge Inference Service (C++ / ONNX Runtime)**: Jetson üzerinde 30 FPS görüntüyü işler; nesne tespiti ve poz tahmini modellerini ardışık çalıştırır.\n• **Rule Engine (Rust)**: Model çıktısını iş adımı durum makinesine bağlar; "hangi adım tamamlandı, hangi kural ihlal edildi" kararını üretir.\n• **Sync Agent (Go)**: Okul internete çıktığında yalnızca sayısal ilerleme özetlerini merkezi panele gönderir; görüntü asla gönderilmez.\n• **Teacher PWA (React)**: Çevrimdışı çalışan, IndexedDB üzerinde kuyruklayan öğretmen arayüzü.\n\n### 2. Veritabanı Mimarisi:\n• **SQLite (WAL modu)**: Uç cihazda öğrenci ilerleme kayıtları ve olay geçmişi.\n• **PostgreSQL (İl/MEB düzeyi)**: Yalnızca anonim toplulaştırılmış başarı istatistikleri.',
            security: 'Öğrenci görüntüsü KVKK kapsamında **özel nitelikli kişisel veri** olduğundan mimarinin birinci kuralı görüntünün cihazdan çıkmamasıdır.\n\n### 1. Güvenlik Önlemleri & Standartlar:\n• **Görüntü Yerelde Kalır**: Kare hiçbir koşulda diske yazılmaz ve ağa gönderilmez; yalnızca bellekte işlenir ve anında düşürülür. Dışarı çıkan tek şey "3. adım tamamlandı" gibi sayısal olaylardır.\n• **Veli Rızası Yönetimi**: Her öğrenci için açık rıza kaydı tutulur; rızası olmayan öğrenci modelin çıktısında otomatik olarak maskelenir.\n• **Cihaz Güvenliği**: Uç cihaz tam disk şifrelemesi (LUKS) ile korunur, Secure Boot etkindir ve fiziksel müdahalede anahtar silinir.\n• **Erişim Kontrolü**: Öğretmen paneline erişim MEB kurumsal kimliğiyle ve iki faktörlü doğrulamayla yapılır; ders dışı saatlerde kayıtlara erişim kapatılır.'
        }
    },

    {
        id: 'sifir-atik-belediye',
        title: 'Sıfır Atık Belediye',
        tagline: 'Konteyner Doluluk Sensörleri ve Rota Optimizasyonuyla Belediye Atık Toplama Maliyetini ve Karbon Salımını Düşüren Platform',
        category: 'Sürdürülebilirlik & IoT & Blockchain',
        categoryKey: 'sustainability',
        scope: 'national',
        meta: {
            difficulty: 'İleri Düzey',
            mvpTime: '9 Hafta',
            monetization: 'Belediye SaaS Aboneliği + KOSGEB/Kalkınma Ajansı Hibe Destekli Kurulum',
            opportunityScore: '%91 Fırsat Skoru',
            scope: 'national'
        },
        diagramNodes: [
            { id: 1, name: 'Konteyner Ultrasonik Sensör', type: 'source', sub: 'LoRaWAN + Güneş Panelli' },
            { id: 2, name: 'LoRa Ağ Geçidi & Ingest', type: 'service', sub: 'ChirpStack + MQTT' },
            { id: 3, name: 'Rota Optimizasyon Motoru', type: 'ai', sub: 'VRP + Doluluk Tahmini' },
            { id: 4, name: 'TimescaleDB & PostGIS', type: 'storage', sub: 'Zaman Serisi + Coğrafi Veri' },
            { id: 5, name: 'Şoför Mobil & Belediye Paneli', type: 'client', sub: 'Flutter + Leaflet Harita' }
        ],
        step1: {
            marketGap: 'Türkiye\'de belediyeler atık toplama araçlarını sabit güzergâh ve sabit saatlerle çalıştırır. Sonuç, aynı gün içinde yarı boş konteynerlerin defalarca ziyaret edilmesi ve yoğun noktalardaki konteynerlerin taşmasıdır. Atık toplama, birçok belediyenin en büyük ikinci akaryakıt kalemidir ve boşuna yapılan her tur hem bütçeden hem de karbon bütçesinden düşer. 2019\'da yürürlüğe giren Sıfır Atık Yönetmeliği belediyelere ayrıştırma ve raporlama yükümlülüğü getirmiş, ancak sahadan veri toplayacak altyapıyı finanse etmemiştir; belediyeler beyanlarını hâlâ elle doldurulan formlarla üretmektedir. Sıfır Atık Belediye, doluluk verisini sahadan otomatik toplayarak hem rotayı hem de yasal raporlamayı aynı kaynaktan besler.',
            description: 'Platform, düşük maliyetli sensörler ve bir optimizasyon motorundan oluşan uçtan uca bir saha sistemidir.\n\n**Temel İşlevler & Özellikler:**\n• **Doluluk Ölçümü**: Konteyner kapağına monte ultrasonik sensör, güneş paneliyle beslenir ve LoRaWAN üzerinden günde birkaç kez doluluk yüzdesi gönderir; şebeke ve SIM kartı gerekmez.\n• **Dinamik Rota**: Ertesi günün rotası, tahmini doluluk ve araç kapasitesine göre kapasiteli araç rotalama (CVRP) çözülerek üretilir.\n• **Taşma Erken Uyarısı**: Doluluk eğrisi eşiği aşacaksa konteyner, tur planına acil olarak eklenir.\n• **Sıfır Atık Raporu**: Ayrıştırma oranları ve toplanan tonaj, yönetmeliğin istediği formatta otomatik üretilir.\n• **Tasarruf Panosu**: Kat edilen kilometre, yakıt ve CO₂ tasarrufu ay ay raporlanır.',
            tags: ['LoRaWAN', 'Go', 'OR-Tools', 'TimescaleDB', 'PostGIS', 'Flutter']
        },
        step2: {
            architecture: 'Sistem, binlerce düşük güçlü cihazdan seyrek veri alan ve gecelik ağır optimizasyon çalıştıran **olay güdümlü** bir mimariye dayanır.\n\n### 1. Sistem Katmanları:\n• **Ingestion (Go + MQTT)**: ChirpStack ağ sunucusundan gelen LoRa paketlerini çözer, sensör sağlığını değerlendirir ve zaman serisine yazar.\n• **Forecast Service (Python)**: Her konteyner için gradyan artırmalı model (LightGBM) ile 24 saatlik doluluk tahmini üretir.\n• **Route Optimizer (Python + Google OR-Tools)**: Kapasiteli araç rotalama problemini çözer; sokak yönü ve araç boyu kısıtlarını OSRM mesafe matrisiyle birleştirir.\n• **Driver App (Flutter)**: Çevrimdışı harita, sıradaki durak ve toplama onayı; kapsama dışında kuyruklar.\n\n### 2. Veritabanı Mimarisi:\n• **TimescaleDB**: Sensör doluluk ölçümleri ve pil seviyeleri (hypertable).\n• **PostGIS**: Konteyner konumları, mahalle sınırları ve rota geometrileri.\n• **Redis**: Aktif tur durumu ve şoför konum önbelleği.',
            security: 'Saha cihazları fiziksel erişime açıktır ve platform belediye operasyonunu yönlendirdiği için **cihaz kimliği ve veri bütünlüğü** önceliklidir.\n\n### 1. Güvenlik Önlemleri & Standartlar:\n• **LoRaWAN 1.1 Kimlik Doğrulama**: Her cihazın benzersiz AppKey\'i vardır; join prosedürü ve çerçeve sayaçları ile tekrar (replay) saldırıları engellenir.\n• **Sahte Veri Direnci**: Fiziksel olarak imkânsız doluluk sıçramaları ve pil profiliyle uyuşmayan paketler istatistiksel olarak işaretlenir ve rotaya dahil edilmez.\n• **Şoför Konumu ve KVKK**: Araç konumu yalnızca vardiya süresince işlenir, vardiya bitiminde ham iz silinir; personel takibi amacıyla kullanılamayacağı politika ve teknik kısıtla sabitlenir.\n• **Yetkilendirme**: Belediye kullanıcıları için rol tabanlı erişim (şoför, saha amiri, çevre müdürlüğü) ve tüm rapor indirmelerinin denetim kaydı tutulur.'
        }
    },

    {
        id: 'yerli-bulut-gocmeni',
        title: 'Yerli Bulut Göçmeni',
        tagline: 'Veri Yerleşimi Zorunluluğu Olan Yükleri Yurt İçi Bulut Sağlayıcılarına Taşıyan Otomatik Uyumluluk ve Göç Aracı',
        category: 'DevOps & Yazılım Geliştirme Araçları',
        categoryKey: 'devops',
        scope: 'national',
        meta: {
            difficulty: 'İleri Düzey',
            mvpTime: '8 Hafta',
            monetization: 'B2B SaaS Aboneliği + Göç Projesi Başına Kurumsal Danışmanlık Paketi',
            opportunityScore: '%90 Fırsat Skoru',
            scope: 'national'
        },
        diagramNodes: [
            { id: 1, name: 'Mevcut Bulut Envanteri', type: 'source', sub: 'AWS / Azure API Tarama' },
            { id: 2, name: 'Uyum Kuralı Değerlendirici', type: 'service', sub: 'Go + OPA Rego Politikaları' },
            { id: 3, name: 'Göç Planlayıcı Ajan', type: 'ai', sub: 'Bağımlılık Grafiği Analizi' },
            { id: 4, name: 'Terraform Durum Deposu', type: 'storage', sub: 'PostgreSQL + Şifreli State' },
            { id: 5, name: 'Göç Kontrol Paneli', type: 'client', sub: 'React + Adım Adım Runbook' }
        ],
        step1: {
            marketGap: 'BDDK, KVKK ve kamu alım şartnameleri belirli veri türlerinin yurt içinde barındırılmasını zorunlu kılar. Buna rağmen Türkiye\'deki pek çok kurum yükünü yurt dışı bulut bölgelerinde çalıştırır ve uyum denetimi geldiğinde hangi servisin hangi veriyi nerede tuttuğunu kimse tam olarak bilemez. Göç kararı verildiğinde ise iş, elle çıkarılan envanter listeleri ve aylarca süren manuel Terraform yeniden yazımına dönüşür; bağımlılıklar gözden kaçtığı için göç sırasında kesinti yaşanır. Piyasadaki göç araçları yalnızca büyük hiperölçekleyiciler arasında çalışır ve Türkiye\'deki yerli sağlayıcıların (ULAKBİM, Turkcell, Türk Telekom bulut) API\'lerini tanımaz. Yerli Bulut Göçmeni bu boşluğu doldurur.',
            description: 'Araç, önce mevcut durumu haritalar, sonra uyum riskini işaretler ve göçü adım adım yürütür.\n\n**Temel İşlevler & Özellikler:**\n• **Otomatik Envanter ve Veri Sınıflandırma**: Mevcut bulut hesaplarını tarar; hangi depolama biriminde kişisel veri, finansal veri veya sağlık verisi olduğunu örneklemeyle sınıflandırır.\n• **Politika Motoru**: "Sağlık verisi yurt dışında tutulamaz" gibi kuralları OPA Rego politikası olarak çalıştırır ve ihlalleri kanıtıyla listeler.\n• **Bağımlılık Farkındalıklı Göç Planı**: Servisler arası çağrı grafiğini çıkarır, hangi bileşenin hangi sırayla taşınacağını ve her adımın geri alma (rollback) yolunu üretir.\n• **Yerli Sağlayıcı Terraform Üretimi**: Hedef sağlayıcı için Terraform modüllerini otomatik yazar; kesintiyi ölçen kanarya testleriyle doğrular.',
            tags: ['Go', 'Terraform', 'Open Policy Agent', 'PostgreSQL', 'React', 'Kubernetes']
        },
        step2: {
            architecture: 'Araç, üretim ortamını değiştirdiği için **plan-onayla-uygula** döngüsü ve tam geri alınabilirlik üzerine kuruludur.\n\n### 1. Sistem Katmanları:\n• **Discovery Service (Go)**: Kaynak bulut sağlayıcı API\'lerini salt-okunur kimlikle tarar; kaynak, ağ ve IAM envanterini çıkarır.\n• **Policy Service (OPA / Rego)**: Uyum kurallarını veri olarak saklar; kural değişince tüm envanter yeniden değerlendirilir.\n• **Planner (Python + NetworkX)**: Servis bağımlılık grafiğinde topolojik sıralama yapar, döngüleri ve tek yönlü bağımlılıkları raporlar.\n• **Executor (Go + Terraform CDK)**: Onaylanan planı adım adım uygular; her adımdan önce durum anlık görüntüsü alır.\n• **Console (React)**: Plan farkı (diff), risk skoru ve canlı ilerleme.\n\n### 2. Veritabanı Mimarisi:\n• **PostgreSQL**: Envanter, politika değerlendirme sonuçları, göç planları ve onay geçmişi.\n• **Şifreli Nesne Depolama**: Terraform state dosyaları, müşteri başına ayrı anahtarla.',
            security: 'Araç, müşterinin tüm bulut altyapısını görebilen bir bileşendir; bu yüzden **en az yetki** ve **sır sızdırmama** tasarımın merkezindedir.\n\n### 1. Güvenlik Önlemleri & Standartlar:\n• **Salt-Okunur Keşif**: Envanter çıkarma aşaması yalnızca okuma yetkisi olan rollerle çalışır; yazma yetkisi ancak kullanıcı bir planı açıkça onayladığında ve süreli olarak devreye girer.\n• **Sır Yönetimi**: Bulut kimlik bilgileri HashiCorp Vault üzerinde tutulur, uygulama belleğine yalnızca kısa ömürlü STS jetonları olarak iner ve loglara asla yazılmaz.\n• **Terraform State Şifreleme**: State dosyaları müşteri başına ayrı KMS anahtarıyla AES-256 ile şifrelenir; state içindeki hassas alanlar ayrıca maskelenir.\n• **Değiştirilemez Denetim Kaydı**: Hangi kullanıcının hangi göç adımını ne zaman onayladığı append-only logda tutulur ve BDDK/KVKK denetimlerinde kanıt olarak sunulabilir.'
        }
    },

    {
        id: 'turkce-arayuz-denetcisi',
        title: 'Türkçe Arayüz Denetçisi',
        tagline: 'Türkçe Yerelleştirmede Bozulan Tipografi, Metin Taşması ve Kültürel Biçim Hatalarını Tasarım Aşamasında Yakalayan Denetim Aracı',
        category: 'Web & Ürün Tasarımı',
        categoryKey: 'design',
        scope: 'national',
        meta: {
            difficulty: 'Orta Düzey',
            mvpTime: '5 Hafta',
            monetization: 'Takım Başına SaaS Aboneliği + Figma Eklenti Pazaryeri Geliri',
            opportunityScore: '%89 Fırsat Skoru',
            scope: 'national'
        },
        diagramNodes: [
            { id: 1, name: 'Figma / Kod Deposu', type: 'source', sub: 'Plugin API + Git Entegrasyonu' },
            { id: 2, name: 'Metin Çıkarma Servisi', type: 'service', sub: 'Node.js + i18n Ayrıştırıcı' },
            { id: 3, name: 'Dil & Biçim Analiz Motoru', type: 'ai', sub: 'Türkçe Morfoloji + Kural Motoru' },
            { id: 4, name: 'Bulgu Veritabanı', type: 'storage', sub: 'PostgreSQL + Anlık Görüntü' },
            { id: 5, name: 'Tasarımcı Eklentisi', type: 'client', sub: 'Figma Plugin + Web Panel' }
        ],
        step1: {
            marketGap: 'Türkçe, arayüz tasarımını sessizce bozan bir dildir: İngilizce\'ye göre metinler ortalama %25-35 uzar, "Kaydet" ile "Değişiklikleri Kaydet" arasındaki fark bir butonu taşırır, noktalı/noktasız I çifti yanlış küçültmeyle bozulur, tarih ve ondalık ayırıcı biçimleri karışır. Bu hatalar tasarım dosyasında İngilizce metinle çalışıldığı için görünmez; ürün Türkçe\'ye çevrildikten sonra, çoğu zaman kullanıcı şikâyetiyle ortaya çıkar. Mevcut yerelleştirme araçları çeviri yönetimine odaklanır ve çevirinin arayüzde nasıl göründüğüyle ilgilenmez; erişilebilirlik denetçileri ise dil-özgü sorunları hiç bilmez. Türkçe Arayüz Denetçisi, bu kontrolü tasarım ve CI aşamasına çeker.',
            description: 'Araç, hem tasarım dosyasında hem de kod tabanında Türkçe arayüz sorunlarını otomatik arar.\n\n**Temel İşlevler & Özellikler:**\n• **Metin Taşma Simülasyonu**: Her metin kutusunu Türkçe karşılığının uzunluğuyla yeniden ölçer; taşacak bileşenleri tasarım aşamasında işaretler.\n• **Noktalı/Noktasız I Denetimi**: `toLowerCase`/`toUpperCase` kullanılan kod yollarını ve tasarımdaki büyük harfe çevrilmiş metinleri tarar; "IŞIK" → "ışık" hatalarını yakalar.\n• **Kültürel Biçim Kontrolü**: Tarih (GG.AA.YYYY), ondalık ayırıcı (virgül), para birimi konumu ve telefon maskesi kurallarına uymayan alanları listeler.\n• **Kesme İşareti ve Ek Kuralları**: Özel adlara gelen eklerin kesme işaretiyle yazımını denetler.\n• **CI Entegrasyonu**: Pull request üzerinde yorum olarak bulgu bırakır; eşiği aşan hata birleştirmeyi engeller.',
            tags: ['TypeScript', 'Node.js', 'Figma Plugin API', 'PostgreSQL', 'React', 'ICU MessageFormat']
        },
        step2: {
            architecture: 'Araç iki ayrı girdi yüzeyinden (tasarım dosyası ve kaynak kod) beslendiği için **ortak bulgu modeli** etrafında kurgulanmıştır.\n\n### 1. Sistem Katmanları:\n• **Extractors (TypeScript)**: Figma Plugin API üzerinden metin katmanlarını, Git deposundan ise i18n kaynak dosyalarını (JSON/ARB/PO) çıkarır ve ortak bir "metin düğümü" modeline çevirir.\n• **Analysis Engine (Node.js)**: Kural motoru; her kural bağımsız çalışır, konum bilgisiyle birlikte bulgu üretir. Türkçe morfoloji için Zemberek tabanlı bir çözümleyici kullanılır.\n• **Layout Simulator (Satori + Resvg)**: Metni gerçek fontla ölçerek taşma tahminini piksel düzeyinde yapar.\n• **Reporting API (Fastify)**: Bulguları depolar, PR yorumu ve panel için sunar.\n\n### 2. Veritabanı Mimarisi:\n• **PostgreSQL**: Proje, tarama anlık görüntüleri, bulgular ve "kabul edildi" işaretleri.\n• **Nesne Depolama**: Taşma simülasyonu görselleri (öncesi/sonrası).',
            security: 'Araç müşterinin tasarım dosyalarına ve kaynak koduna eriştiği için **veri asgariliği** ve **jeton güvenliği** öne çıkar.\n\n### 1. Güvenlik Önlemleri & Standartlar:\n• **Yalnızca Metin İşlenir**: Kaynak koddan sadece i18n dosyaları ve `toLowerCase`/`toUpperCase` çağrılarının bulunduğu satırlar okunur; iş mantığı içeren kod hiçbir zaman sunucuya gönderilmez.\n• **Kısa Ömürlü Jetonlar**: Figma ve GitHub erişimi OAuth ile alınır, jetonlar şifreli olarak saklanır ve yenileme akışıyla otomatik döndürülür.\n• **Tenant İzolasyonu**: Her müşterinin bulguları satır düzeyi güvenlik (RLS) ile ayrılır; çapraz erişim veritabanı seviyesinde imkânsızdır.\n• **KVKK Uyumu**: Tarama sonuçlarında yer alan örnek metinler kişisel veri içerebileceğinden, saklama süresi yapılandırılabilir ve süre sonunda otomatik silinir.'
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
    },

    {
        id: 'clintrial-match',
        title: 'ClinTrial Match',
        tagline: 'Hasta Kayıtlarını Klinik Araştırma Uygunluk Kriterleriyle Gizlilik Koruyarak Eşleştiren Global Hasta Alım Platformu',
        category: 'Sağlık Teknolojileri & Yapay Zeka',
        categoryKey: 'health-ai',
        scope: 'international',
        meta: {
            difficulty: 'Uzman Düzey',
            mvpTime: '12 Hafta',
            monetization: 'Sponsor Başına Araştırma Lisansı + Başarılı Alım Başına Ücret',
            opportunityScore: '%95 Fırsat Skoru',
            scope: 'international'
        },
        diagramNodes: [
            { id: 1, name: 'Hastane EHR (FHIR)', type: 'source', sub: 'HL7 FHIR R4 Kaynakları' },
            { id: 2, name: 'De-identification Gateway', type: 'service', sub: 'Rust + Safe Harbor Kuralları' },
            { id: 3, name: 'Uygunluk Eşleştirme Motoru', type: 'ai', sub: 'Klinik NLP + Kriter Ayrıştırma' },
            { id: 4, name: 'Şifreli Aday Havuzu', type: 'storage', sub: 'PostgreSQL + Alan Bazlı Şifreleme' },
            { id: 5, name: 'Araştırmacı Portalı', type: 'client', sub: 'Next.js + Denetim İzli Erişim' }
        ],
        step1: {
            marketGap: 'Klinik araştırmaların yaklaşık %80\'i hasta alım hedeflerini zamanında tutturamaz ve araştırmaların önemli bir kısmı yeterli katılımcı bulunamadığı için tamamen durdurulur. Sorunun kaynağı ilgisizlik değil görünürlüktür: uygun hasta çoğu zaman zaten bir hastanenin kayıtlarındadır, ancak uygunluk kriterleri (dahil etme/dışlama) serbest metin olarak yazılır ve hasta kaydıyla otomatik karşılaştırılamaz. Araştırma koordinatörleri bu eşleştirmeyi elle, dosya dosya yapar. Mevcut çözümler tek hastane içinde çalışır ve çok merkezli araştırmalarda veri paylaşımı GDPR/HIPAA engeline takılır. ClinTrial Match, hasta verisini hastane dışına çıkarmadan çok merkezli aday havuzu oluşturur.',
            description: 'Platform, hastane içinde çalışan bir eşleştirme ajanı ile sponsor tarafındaki araştırma portalından oluşur.\n\n**Temel İşlevler & Özellikler:**\n• **Kriter Ayrıştırma**: Protokoldeki serbest metin dahil/dışlama kriterlerini yapılandırılmış sorgulara çevirir (yaş, tanı kodu, laboratuvar aralığı, eşlik eden hastalık, ilaç geçmişi).\n• **Hastane İçinde Eşleştirme**: Sorgu hastaneye gider, hasta verisi hastanede kalır; dışarı yalnızca "kaç aday var" sayısı ve rıza sonrası iletişim izni çıkar.\n• **Uygunluk Gerekçesi**: Her aday için hangi kriterin sağlandığı/sağlanmadığı satır satır gösterilir; koordinatör kararı denetlenebilir olur.\n• **Alım Hunisi Analitiği**: Hangi kriterin aday havuzunu en çok daralttığını raporlar; sponsor protokolü gerçekçi biçimde revize edebilir.',
            tags: ['Rust', 'Python', 'HL7 FHIR', 'PostgreSQL', 'Next.js', 'Clinical NLP']
        },
        step2: {
            architecture: 'Mimari, verinin merkezde toplanmadığı **federated (dağıtık sorgu)** modelini uygular; sorgu veriye gider, veri sorguya gelmez.\n\n### 1. Sistem Katmanları:\n• **Site Agent (Rust)**: Hastane ağı içinde çalışır; FHIR sunucusuna bağlanır, gelen yapılandırılmış sorguyu yerelde koşturur ve yalnızca toplulaştırılmış sonucu döner.\n• **Criteria Service (Python)**: Protokol metnini klinik NLP ile ayrıştırır, ICD-10/SNOMED/LOINC kodlarına eşler ve sorgu planı üretir.\n• **Coordination API (Go)**: Sponsor ile siteler arasındaki sorgu dağıtımını, yetkilendirmeyi ve sonuç toplamayı yönetir.\n• **Researcher Portal (Next.js)**: Protokol yükleme, site bazlı aday sayıları ve alım hunisi görselleştirmesi.\n\n### 2. Veritabanı Mimarisi:\n• **PostgreSQL (site içi)**: Aday kimlikleri ve eşleşme gerekçeleri — hastane sınırları içinde kalır.\n• **PostgreSQL (merkez)**: Yalnızca protokoller, sorgu planları ve toplulaştırılmış sayılar.\n• **Redis**: Sorgu dağıtım durumu ve site sağlık kontrolleri.',
            security: 'Sağlık verisi HIPAA ve GDPR kapsamında en yüksek korumayı gerektirir; mimarinin temel taahhüdü **hasta düzeyinde verinin siteden çıkmamasıdır**.\n\n### 1. Güvenlik Önlemleri & Standartlar:\n• **Federated Sorgulama**: Merkez sunucu hiçbir zaman hasta düzeyinde kayıt görmez; yalnızca sayı ve toplulaştırılmış istatistik alır. Küçük hücre gizleme (small cell suppression) ile 5\'in altındaki sayılar bastırılır.\n• **De-identification**: Site içinde bile analiz katmanına giden veriden HIPAA Safe Harbor tanımlayıcıları çıkarılır; tarihler yıla yuvarlanır.\n• **Rıza Yönetimi (Consent)**: Bir adayla iletişime geçilmesi ancak hastanın araştırma iletişimine açık rızası varsa mümkündür; rıza durumu her sorguda yeniden doğrulanır.\n• **Şifreleme ve Denetim**: Alan bazlı şifreleme (AES-256-GCM), site-merkez arası mTLS ve her sorgunun kim tarafından, hangi protokol için çalıştırıldığını tutan değiştirilemez denetim kaydı.'
        }
    }
];
