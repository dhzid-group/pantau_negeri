# Kepatuhan, Privasi, dan Keamanan

## Disclaimer Wajib

### Anomali

Setiap respons atau tampilan penandaan anomali harus memuat:

> Catatan: Penandaan ini dihasilkan secara otomatis oleh algoritma statistik berdasarkan perbandingan data publik resmi. Indikator ini bukan merupakan vonis hukum, tuduhan pidana, maupun bukti pelanggaran.

### Ekonomi

Setiap respons atau tampilan skor ekonomi dan playbook harus memuat:

> Catatan: Skor ekonomi dan rekomendasi solusi merupakan informasi edukasi literasi keuangan publik berbasis data makro terbuka, bukan rekomendasi investasi atau nasihat keuangan berizin (OJK).

## Bahasa Netral

Strict lexicon melarang output yang menggunakan kata tuduhan atau kriminalisasi seperti koruptor, korupsi, penipu, tersangka, pelaku, atau kejahatan. Pengecualian hanya kutipan langsung putusan pengadilan berkekuatan hukum tetap yang sesuai konteks.

Terminologi yang digunakan:

- Indikator Anomali Statistik;
- Deviasi Data;
- Ketidaksesuaian Administratif;
- Perlu Klarifikasi Publik.

## Pemrosesan Data Pribadi

Sistem melakukan masking terhadap:

- NIK;
- nomor telepon;
- email;
- alamat lengkap;
- data sensitif lain yang teridentifikasi.

Simpan hanya data pribadi yang benar-benar dibutuhkan untuk tujuan transparansi yang sah.

## Etika Pengambilan Data

- Gunakan sumber publik terbuka;
- cek dan patuhi robots.txt;
- maksimal 1 request per 3–5 detik per domain;
- gunakan User-Agent transparan;
- jangan melewati CAPTCHA, autentikasi, paywall, atau endpoint privat;
- simpan hash payload dan sumber untuk audit;
- jangan mengubah atau menyembunyikan jejak audit.

## Hak Jawab

Setiap klarifikasi resmi berisi:

- nama pengklarifikasi;
- jabatan/instansi;
- isi klarifikasi;
- tautan dokumen resmi;
- status verifikasi;
- tanggal publikasi.

Status awal adalah `PENDING`. Verifikasi manual diwajibkan sebelum menggunakan `VERIFIED` dan mengubah status anomali menjadi `CLARIFIED`.

## Keamanan API

Untuk produksi:

- tambahkan autentikasi pada endpoint admin dan mutasi;
- jangan membuka credential SMTP/database ke frontend;
- batasi CORS ke domain resmi;
- gunakan HTTPS;
- validasi seluruh body Fastify;
- gunakan secret kuat untuk JWT jika autentikasi ditambahkan;
- batasi rate API untuk watchlist dan klarifikasi;
- hindari SSRF pada webhook dengan membatasi DNS/host dan HTTP scheme.

## Secrets

- jangan commit `.env`;
- gunakan permission `600` pada `.env` server;
- rotasi password database dan SMTP secara berkala;
- gunakan akun database aplikasi non-root.

## Transparansi Scoring

Setiap skor anomali dan ekonomi wajib memuat:

- formula;
- bobot;
- actual value;
- threshold;
- status;
- ringkasan faktor pendorong;
- disclaimer.

Bagi korelasi berita/geopolitik, jelaskan bahwa kata kunci berkorelasi secara indikatif dan bukan bukti kausalitas.
