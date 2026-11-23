Bertindaklah sebagai Principal Full-Stack Software Architect yang ahli dalam ekosistem TypeScript/JavaScript, MySQL, rekayasa data publik (Open Government Data), pemrosesan dokumen tidak terstruktur, analisis jaringan graf, ekonometrika terapan dasar, serta deployment aplikasi Node.js di server Ubuntu Linux yang dikelola menggunakan **aaPanel** (tanpa Docker).

Saya ingin membangun platform web pemantauan transparansi seluruh lembaga negara Indonesia (Eksekutif, Legislatif, Yudikatif, serta Lembaga Negara Independen & BUMN strategis) yang juga dilengkapi pusat intelijen ekonomi publik bernama **"PantauNegeri"** (atau nama placeholder yang modular).

### Tujuan Utama Sistem
1. **Agregasi Satu Pintu Lembaga Negara:** Menghimpun informasi publik (terstruktur maupun dokumen PDF) dari berbagai portal resmi lembaga negara sehingga masyarakat tidak perlu membuka situs lembaga satu per satu.
2. **Deteksi Dini Indikasi Anomali & Pemetaan Relasi:** Mengidentifikasi potensi anomali berbasis data kuantitatif serta memetakan keterkaitan antar-entitas (vendor, pejabat, tender, regulasi) lintas lembaga.
3. **Intelijen Ekonomi, Korelasi Geopolitik & Solusi Masyarakat (Tab Ekonomi):** Menyajikan data makroekonomi terpercaya, menghitung skor kesehatan/daya tahan ekonomi nasional, memetakan hubungan dampak geopolitik/berita/kebijakan negara terhadap ekonomi, serta memberikan panduan solusi praktis bagi masyarakat (misalnya saat Rupiah melemah atau daya beli menurun).
4. **Peringatan Proaktif (Watchlist):** Memungkinkan jurnalis, peneliti, dan masyarakat memantau entitas lembaga atau indikator ekonomi tertentu secara otomatis.
5. **Kepatuhan Hukum & Etika Data:** Sistem HANYA memproses informasi publik terbuka sesuai UU No. 14 Tahun 2008 (UU KIP), mematuhi UU No. 27 Tahun 2022 (UU PDP), dan menerapkan perlindungan ketat terhadap risiko pencemaran nama baik sesuai UU ITE.

### Batasan Teknis & Tech Stack (100% Open-Source & Ubuntu VPS + aaPanel)
Seluruh teknologi wajib menggunakan lisensi *open-source* murni (MIT, Apache 2.0, GPLv2, BSD) tanpa ketergantungan pada layanan SaaS berbayar, tanpa Docker, dan kompatibel penuh dengan lingkungan **aaPanel** di Ubuntu:
- **Bahasa:** TypeScript (Strict Mode) untuk seluruh lapisan Frontend, Backend, dan Worker.
- **Frontend:** Next.js (App Router, berjalan di port internal `3000`), Tailwind CSS, Shadcn/UI, Recharts, TanStack Table, serta **Cytoscape.js** untuk visualisasi jaringan relasi (*Network Graph*).
- **Backend:** Node.js LTS dengan Fastify (REST API terstruktur + dokumentasi OpenAPI/Swagger + RSS Feed endpoint, berjalan di port internal `4000`).
- **Database:** MySQL 8.0 (menggunakan service MySQL bawaan aaPanel) menggunakan Drizzle ORM.
- **Background Jobs & Cache:** BullMQ + Redis / Valkey (menggunakan service Redis bawaan aaPanel atau native Ubuntu).
- **Document Processing & Matching:** `pdf-parse` + `tesseract.js` (atau native `tesseract-ocr` CLI + `poppler-utils` di Ubuntu untuk performa OCR lebih ringan) dan `fastest-levenshtein` (untuk *fuzzy matching* entitas).
- **Notifikasi Email:** **Nodemailer** murni berbasis protokol SMTP standar (tanpa layanan email SaaS berbayar).
- **Web Server & Process Manager (aaPanel):**
  - **Nginx / OpenLiteSpeed bawaan aaPanel** sebagai *Reverse Proxy* (meneruskan `/` ke port `3000` dan `/api` ke port `4000`) serta pengelolaan SSL Let's Encrypt langsung dari dashboard aaPanel.
  - **PM2** (`ecosystem.config.js` dengan pengaturan `--max-memory-restart`) untuk menjalankan `frontend`, `api`, dan `worker` secara stabil di latar belakang.

### Aturan Kepatuhan Pengambilan Data (Ethical Ingestion)
1. **Sumber Data Lembaga & Ekonomi Terbuka:**
   - Lembaga: Satu Data Indonesia (`data.go.id`), JDIH Nasional/Lembaga, LPSE/INAPROC, e-LHKPN, Open Data DPR, Direktori Putusan MA.
   - Ekonomi & Berita Terpercaya: Web API BPS (`webapi.bps.go.id`), kurs referensi JISDOR & suku bunga acuan Bank Indonesia (BI), data APBN Kemenkeu, PIHPS (harga pangan pokok), Open Data World Bank/IMF (untuk pembanding global), serta RSS Feed resmi dari kantor berita kredibel (seperti ANTARA dan media terverifikasi Dewan Pers) untuk konteks geopolitik.
2. **Etika Scraping:**
   - Wajib memeriksa dan mematuhi `robots.txt` domain target.
   - Terapkan *rate-limiting* (maksimal 1 request per 3–5 detik per domain) dengan header `User-Agent` yang jelas dan transparan.
   - Dilarang keras melewati autentikasi, CAPTCHA, *paywall*, atau mengakses endpoint non-publik.
   - Lakukan *masking/redaksi* otomatis terhadap data pribadi sensitif (NIK, alamat rumah lengkap, nomor telepon pribadi) sebelum disimpan ke MySQL.
   - Simpan selalu `source_url` asli, `fetched_at` timestamp, dan `raw_payload_hash` (SHA-256) sebagai bukti audit integritas data.

### Perlindungan Hukum & Mitigasi Risiko UU ITE & Regulasi Keuangan
Sistem harus menerapkan prinsip *presumption of innocence* (praduga tak bersalah) dan edukasi netral:
1. **Strict Lexicon / Linter Bahasa Sistem:** Dilarang keras menghasilkan atau menampilkan kata tuduhan hukum di UI, notifikasi, maupun metadata API seperti *"koruptor"*, *"korupsi"*, *"kejahatan"*, *"penipu"*, *"pelaku"*, atau *"tersangka"* (kecuali mengutip langsung amar putusan pengadilan berkekuatan hukum tetap dari Direktori Putusan MA). Gunakan hanya terminologi statistik netral: **"Indikator Anomali Statistik"**, **"Deviasi Data"**, **"Ketidaksesuaian Administratif"**, atau **"Perlu Klarifikasi Publik"**.
2. **Disclaimer Hukum Wajib (Anomali & Ekonomi):**
   - Pada *anomaly flag*: *"Catatan: Penandaan ini dihasilkan secara otomatis oleh algoritma statistik berdasarkan perbandingan data publik resmi. Indikator ini bukan merupakan vonis hukum, tuduhan pidana, maupun bukti pelanggaran."*
   - Pada *Tab Ekonomi & Solusi Masyarakat*: *"Catatan: Skor ekonomi dan rekomendasi solusi merupakan informasi edukasi literasi keuangan publik berbasis data makro terbuka, bukan rekomendasi investasi atau nasihat keuangan berizin (OJK)."*
3. **Fitur Hak Jawab & Klarifikasi Resmi (Right of Reply):** Sediakan mekanisme dan tabel database khusus bagi humas lembaga, pejabat, atau vendor untuk menautkan dokumen klarifikasi resmi. Jika terverifikasi, status *flag* berubah menjadi `CLARIFIED` dan tampil berdampingan (*side-by-side*) dengan indikator anomali.
4. **Transparansi Rumus (Explainable Scoring):** Setiap skor anomali maupun skor kesehatan ekonomi wajib menampilkan rumus matematis, bobot variabel, dan ambang batas (*threshold*) pemicunya.

### Lima Kapabilitas Inti Lanjutan (Wajib Diimplementasikan)
1. **Entity Resolution (Pemadanan & Normalisasi Entitas):**
   - Pipeline normalisasi untuk menyatukan variasi penulisan nama badan usaha atau pejabat (misalnya `"PT. Sumber Makmur"`, `"PT Sumber Makmur"`, `"SUMBER MAKMUR, PT"` dipetakan ke satu `canonical_entity_id`).
   - Kombinasi pembersihan prefiks/sufiks hukum (`PT`, `CV`, `Tbk`, gelar akademik) dan *fuzzy matching* (`fastest-levenshtein`) dengan ambang batas kemiripan terukur.
2. **Unstructured PDF & OCR Ingestion Pipeline:**
   - Worker khusus untuk mengunduh dan mengekstrak teks dari dokumen laporan publik (Ikhtisar Hasil Pemeriksaan BPK, laporan LAKIP, ringkasan LHKPN PDF, Nota Keuangan APBN, salinan peraturan).
   - Ekstraksi teks native (`pdf-parse`) dengan *fallback* otomatis ke OCR (`tesseract.js` / native `tesseract-ocr`) jika dokumen terdeteksi sebagai hasil *scan* gambar, lalu simpan ke kolom terindeks `FULLTEXT` MySQL.
3. **Network Graph Intelligence (Peta Relasi Entitas & Dampak Kebijakan):**
   - Endpoint API graf (`/api/v1/graph/:entityId`) yang mengembalikan *nodes* (Lembaga, Pejabat, Vendor, Paket Tender, Regulasi, Peristiwa Geopolitik) dan *edges* (hubungan: *memenangkan_tender_di*, *menjabat_di*, *menerbitkan_aturan*, *berdampak_pada*) hingga kedalaman 2–3 tingkat (*hops*).
   - Visualisasi graf interaktif menggunakan **Cytoscape.js**.
4. **Economic Intelligence, Scoring & Geopolitical Correlation Engine (Tab Ekonomi):**
   - **Agregasi Indikator Makro:** Mengumpulkan dan menampilkan grafik tren historis Kurs Rupiah (USD/IDR), Inflasi (IHK), Suku Bunga Acuan (BI Rate), Pertumbuhan PDB, Indeks Keyakinan Konsumen (IKK/daya beli), serta rata-rata harga pangan pokok nasional.
   - **Economic Resilience Score (0–100):** Algoritma pembobotan transparan yang menghitung indeks ketahanan ekonomi aktual berdasarkan deviasi kurs, laju inflasi terhadap target BI, dan tren daya beli masyarakat (dengan status kategori: `STABIL`, `WASPADA`, `TEKANAN_TINGGI`).
   - **Korelasi Geopolitik, Berita & Kebijakan Negara:** Menghubungkan lonjakan/penurunan indikator ekonomi dengan *timeline* peristiwa geopolitik global (misal: konflik rantai pasok, perubahan suku bunga bank sentral global, harga energi dunia), rangkuman berita ekonomi terpercaya, serta regulasi/kebijakan fiskal yang baru diterbitkan lembaga negara di database.
   - **Actionable Citizen Solutions (Mesin Solusi Masyarakat):** Modul berbasis aturan (*rule-based playbook*) yang otomatis aktif saat indikator melewati ambang batas tertentu, menampilkan langkah mitigasi praktis bagi rumah tangga dan UMKM:
     - *Skenario Rupiah Melemah (Depresiasi > threshold):* Panduan proteksi arus kas pribadi, substitusi konsumsi/bahan baku impor ke produk lokal, kewaspadaan utang/cicilan berbasis valas, dan peluang ekspor/jasa berbasis dolar bagi pekerja digital/UMKM.
     - *Skenario Daya Beli Turun / Inflasi Pangan Naik:* Panduan efisiensi anggaran rumah tangga (aturan alokasi kebutuhan pokok), pemanfaatan operasi pasar/subsidi resmi pemerintah yang terdata di sistem, penguatan dana darurat likuid, dan strategi diversifikasi pendapatan.
     - *Skenario Suku Bunga Tinggi:* Simulasi dampak terhadap cicilan bunga mengambang (*floating rate*) dan tips restrukturisasi atau pelunasan utang konsumtif berbunga tinggi.
5. **Watchlist & Sistem Peringatan Dini (Alerting):**
   - Pengguna dapat membuat aturan pantauan (*watchlist*) berdasarkan lembaga tertentu, kata kunci, nilai minimal pengadaan, tingkat risiko anomali (`MEDIUM`/`HIGH`), maupun pemicu skenario ekonomi (misal: *"Kirim peringatan jika kurs Rupiah melewati ambang batas waspada"*).
   - Kirimkan notifikasi via Email (**Nodemailer** SMTP), Webhook, atau RSS Feed khusus pengguna (wajib menyertakan disclaimer hukum di setiap pesan).

### Rancangan Skema Database MySQL (Buatkan DDL / Drizzle Schema)
Buat tabel relasional lengkap dengan indeks (`FULLTEXT`, *composite index*, dan *foreign keys*):
1. `institutions`: ID, nama lembaga, kategori (`EKSEKUTIF` | `LEGISLATIF` | `YUDIKATIF` | `INDEPENDEN` | `BUMN`), situs resmi, skor keterbukaan data, status sinkronisasi terakhir.
2. `canonical_entities`: ID, `normalized_name`, `display_name`, tipe (`PERSON` | `VENDOR` | `INSTITUTION`), `aliases` (JSON array variasi nama yang ditemukan).
3. `public_officials`: ID, `canonical_entity_id`, nama, jabatan, `institution_id`, riwayat laporan LHKPN (tahun, total harta, selisih tahunan).
4. `procurements`: ID, `institution_id`, `vendor_entity_id`, nama paket, nilai HPS, nilai kontrak, nama pemenang mentah, tanggal, `source_url`, `raw_payload_hash`.
5. `regulations_and_documents`: ID, `institution_id`, tipe dokumen (`REGULASI` | `PUTUSAN` | `LAPORAN_BPK` | `LAKIP` | `KEBIJAKAN_FISKAL`), nomor dokumen, judul, tanggal terbit, `extracted_text` (FULLTEXT), `extraction_method` (`NATIVE_PDF` | `OCR` | `HTML`), `source_url`, `raw_payload_hash`.
6. `entity_relationships`: ID, `source_entity_id`, `target_entity_id`, `relation_type`, `weight` (jumlah/nilai interaksi), `reference_id`, `year`.
7. `anomaly_flags`: ID, `institution_id`, tipe entitas, `entity_id`, jenis indikator anomali, tingkat risiko (`LOW` | `MEDIUM` | `HIGH`), skor statistik, penjelasan rumus objektif, status (`OPEN` | `UNDER_REVIEW` | `CLARIFIED` | `RESOLVED`).
8. `official_clarifications`: ID, `anomaly_flag_id`, nama pengklarifikasi, jabatan/instansi, isi klarifikasi, `official_document_url`, status verifikasi, `published_at`.
9. `economic_indicators`: ID, kode indikator (`USD_IDR`, `INFLATION_YOY`, `BI_RATE`, `GDP_GROWTH`, `IKK_PURCHASING_POWER`, `FOOD_INDEX`), nama indikator, nilai, satuan, periode tanggal, sumber resmi (`BPS` | `BI` | `KEMENKEU` | `PIHPS`), `source_url`, `raw_payload_hash`.
10. `economic_scores`: ID, tanggal evaluasi, skor komposit (`0-100`), status (`STABIL` | `WASPADA` | `TEKANAN_TINGGI`), rincian bobot & rumus kalkulasi (JSON), ringkasan faktor pendorong utama.
11. `macro_events_and_news`: ID, kategori (`GEOPOLITIK` | `BERITA_EKONOMI` | `KEBIJAKAN_DOMESTIK`), judul, ringkasan objektif, tingkat dampak (`LOW` | `MEDIUM` | `HIGH`), indikator ekonomi terkait (JSON array), `related_regulation_id` (nullable FK ke `regulations_and_documents`), sumber berita/lembaga, `source_url`, tanggal terbit.
12. `citizen_solution_playbooks`: ID, kode skenario (`RUPIAH_WEAKENING` | `PURCHASING_POWER_DROP` | `HIGH_INTEREST_RATE` | `FOOD_INFLATION`), kondisi pemicu (JSON rule, misal: `USD_IDR > 16200`), judul solusi, ringkasan dampak ke warga, daftar langkah aksi praktis untuk rumah tangga & UMKM (JSON), tautan program bantuan/layanan publik terkait.
13. `user_watchlists` & `alert_notifications`: tabel untuk menyimpan aturan pantauan pengguna (lembaga & ekonomi), saluran notifikasi (`EMAIL` | `WEBHOOK` | `RSS`), dan log pengiriman peringatan.
14. `ingestion_logs`: ID, `institution_id` (nullable untuk sumber ekonomi), sumber endpoint, status (`SUCCESS` | `FAILED` | `RATE_LIMITED`), jumlah data baru, pesan error.

### Aturan Dokumentasi & Pelacakan Progres (State Management File)
Agar pengerjaan tetap terstruktur, tidak membingungkan, dan menjaga konsistensi antar-tahap:
1. Buat file **`PROJECT_PROGRESS.md`** di *root* direktori proyek sejak Tahap 1.
2. Setiap kali selesai mengerjakan satu tahap, Anda **WAJIB** membuat atau memperbarui file `PROJECT_PROGRESS.md` sebelum meminta konfirmasi lanjut.
3. File `PROJECT_PROGRESS.md` harus selalu memuat:
   - **Status Keseluruhan Tahapan:** Checklist (`[x]` Selesai, `[~]` Sedang Dikerjakan, `[ ]` Belum Dikerjakan) untuk Tahap 1 hingga Tahap 4.
   - **Log Detail Tahap yang Baru Selesai:** Daftar lengkap file yang dibuat/diubah, nama tabel/fungsi/endpoint utama yang diekspor, serta konfigurasi environment variable (`.env.example`) yang dibutuhkan.
   - **Cara Verifikasi / Uji Coba:** Perintah terminal singkat untuk memastikan kode pada tahap tersebut berjalan tanpa error sebelum pindah tahap.
   - **Konteks untuk Tahap Berikutnya:** Catatan teknis singkat mengenai kontrak data/interface yang harus dipakai oleh tahap selanjutnya.
4. Sebelum memulai tahap berikutnya (Tahap 2, 3, atau 4), baca kembali isi `PROJECT_PROGRESS.md` sebagai acuan tunggal (*single source of truth*) agar penamaan variabel, skema database, dan tipe data TypeScript tetap sinkron.

### Instruksi Pengerjaan Bertahap
Kerjakan secara berurutan (satu tahap per respons) dan berhenti setelah memperbarui `PROJECT_PROGRESS.md`:
1. **Tahap 1 (Arsitektur Monorepo, Setup Ubuntu + aaPanel & Skema DB):** Rancang struktur folder monorepo (disarankan ditempatkan di `/www/wwwroot/pantaunegeri`), buatkan skrip `scripts/setup-deps.sh` yang aman untuk server aaPanel (hanya menginstal library OS seperti `tesseract-ocr`, `tesseract-ocr-ind`, `poppler-utils`, dependensi Playwright, dan PM2 tanpa menimpa MySQL/Nginx bawaan aaPanel), konfigurasi `ecosystem.config.js` (PM2 dengan batasan RAM agar VPS tidak OOM), panduan singkat konfigurasi **Reverse Proxy aaPanel** (routing `/` ke port `3000` dan `/api` ke port `4000`) + `.env.example`, tuliskan skema lengkap Drizzle ORM untuk ke-14 tabel MySQL beserta indeksnya (termasuk data *seed* awal untuk `citizen_solution_playbooks`), lalu buat `PROJECT_PROGRESS.md`.
2. **Tahap 2 (Ingestion Lembaga, Ekonomi, PDF/OCR & Entity Resolution):** Baca `PROJECT_PROGRESS.md`, lalu buat modul `EntityResolver` dan worker BullMQ/Redis pengambilan data publik lembaga negara, indikator ekonomi terbuka (BPS/kurs referensi/RSS berita ekonomi & geopolitik), yang patuh `robots.txt`, menghasilkan `raw_payload_hash`, serta mendukung ekstraksi PDF/OCR. Perbarui `PROJECT_PROGRESS.md`.
3. **Tahap 3 (Anomaly Engine, Economic Scoring & Solution Rules Engine):** Baca `PROJECT_PROGRESS.md`, lalu buat modul `AnomalyDetector` (dengan filter bahasa anti-pencemaran nama baik UU ITE) serta modul `EconomicIntelligenceEngine` (perhitungan skor ekonomi 0–100, pemetaan korelasi geopolitik/kebijakan, dan aktivasi otomatis `citizen_solution_playbooks`) beserta unit test-nya. Perbarui `PROJECT_PROGRESS.md`.
4. **Tahap 4 (API Graf, Watchlist & Frontend Next.js Termasuk Tab Ekonomi):** Baca `PROJECT_PROGRESS.md`, lalu buat API relasi graf, sistem notifikasi *watchlist* (Nodemailer/Webhook/RSS), dan antarmuka Next.js lengkap: Dashboard Nasional, Direktori Lembaga, Peta Relasi Interaktif Cytoscape.js, Umpan Anomali + Hak Jawab, Pencarian Global, serta **Tab Ekonomi** (Skor Ekonomi, Grafik Makro, Timeline Geopolitik-Berita-Kebijakan, dan Panel Solusi Praktis untuk Masyarakat). Perbarui `PROJECT_PROGRESS.md` ke status 100% selesai.

Mulai dengan **Tahap 1** sekarang dan tanyakan konfirmasi saya setelah membuat/memperbarui `PROJECT_PROGRESS.md` sebelum melangkah ke Tahap 2 begitu pula selanjutnya.