# Gambaran Sistem

## Ringkasan

PantauNegeri adalah portal agregasi transparansi lembaga negara dan intelijen ekonomi publik Indonesia. Platform mengonsumsi API/open data, RSS, dan dokumen publik untuk menghasilkan:

1. direktori lembaga negara;
2. pencarian entitas dan paket pengadaan;
3. indikator deviasi statistik/netral;
4. peta relasi antar-entitas;
5. skor ketahanan ekonomi;
6. korelasi berita dan kebijakan;
7. playbook solusi bagi rumah tangga dan UMKM;
8. watchlist dan peringatan melalui Email, Webhook, atau RSS.

## Pengguna

- masyarakat yang membutuhkan ringkasan publik;
- jurnalis dan peneliti;
- humas lembaga yang mengajukan klarifikasi;
- pengelola platform/administrator;
- UMKM dan pekerja digital yang memerlukan panduan mitigasi ekonomi.

## Modul Pengguna

### Dashboard Nasional

Menampilkan jumlah lembaga, skor ekonomi terbaru, anomali terbaru, dan playbook aktif.

### Direktori Lembaga

Menampilkan lembaga berdasarkan kategori eksekutif, legislatif, yudikatif, independen, atau BUMN, beserta portal resmi dan status sinkronisasi.

### Umpan Anomali

Menampilkan indikator statistik beserta jenis indikator, level risiko, skor, formula, threshold, status, dan disclaimer. Entitas tidak diberi label hukum pidana.

### Peta Relasi

Memvisualisasikan entitas dengan Cytoscape.js berdasarkan relasi vendor–lembaga, pejabat–lembaga, tender, regulasi, dan relasi ekonomi terkait.

### Tab Ekonomi

Menampilkan skor ketahanan, grafik indikator, faktor pendorong, timeline berita/geopolitik/kebijakan, serta aksi praktis aktif.

### Watchlist

Mengizinkan pemantauan berdasarkan lembaga, kata kunci, nilai pengadaan minimum, risiko minimum, skenario ekonomi, dan channel notifikasi.

## Prinsip Produk

- **Data terbuka dan terverifikasi:** sumber resmi dicatat beserta URL dan hash integritas.
- **Explainable:** formula, bobot, threshold, dan status harus tampil.
- **Praduga tak bersalah:** tidak boleh ada kesimpulan hukum pada output statistik.
- **Hak jawab:** klarifikasi resmi dapat melekat pada flag anomali.
- **Minimalisasi data:** NIK, telepon, email, alamat, dan identitas sensitif lain wajib dimask/redact.
- **Edukasi, bukan nasihat berizin:** skor dan solusi ekonomi bukan rekomendasi investasi atau jasa keuangan.
