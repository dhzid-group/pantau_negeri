# Panduan Pengguna

## Membuka Dashboard

Buka `http://127.0.0.1:3000` saat lokal atau domain produksi. Header menyediakan tautan Direktori Lembaga, Anomali, Peta Relasi, dan Ekonomi.

## Dashboard Nasional

Dashboard menampilkan:

- jumlah lembaga terdaftar;
- skor ekonomi terbaru;
- jumlah anomali dalam tampilan ringkas;
- jumlah solusi ekonomi aktif.

## Mencari Lembaga dan Entitas

Gunakan API pencarian jika belum tersedia kolom pencarian UI khusus:

```text
/api/v1/institutions?q=kementerian
/api/v1/search?q=sumber makmur
```

Hasil pencarian memetakan lembaga, entitas kanonik, dan pengadaan.

## Membaca Umpan Anomali

Setiap card berisi:

- jenis indikator;
- level risiko;
- skor;
- formula;
- threshold;
- status;
- disclaimer hukum.

Contoh filter:

```text
/api/v1/anomalies?risk=HIGH
/api/v1/anomalies?status=CLARIFIED
```

Status `CLARIFIED` hanya boleh dipakai setelah klarifikasi diterima dan diverifikasi sesuai mekanisme humas.

## Mengajukan Klarifikasi Resmi

Kirim data melalui `POST /api/v1/anomalies/:id/clarifications` disertai nama, jabatan/instansi, isi klarifikasi, dan tautan dokumen resmi. Klarifikasi baru berstatus `PENDING` dan wajib ditinjau sebelum status anomali berubah menjadi `CLARIFIED`.

## Membaca Tab Ekonomi

Tab Ekonomi menampilkan:

- nilai skor 0–100;
- status stabilitas;
- grafik USD/IDR, inflasi, BI Rate, IKK, PDB, dan pangan bila data tersedia;
- faktor pendorong;
- formula dan bobot;
- timeline berita/geopolitik/kebijakan;
- playbook aktif;
- disclaimer OJK.

Skor bukan sinyal jual/beli atau nasihat keuangan berizin.

## Membaca Peta Relasi

Peta memuat nodes dan edges. Warna node menunjukkan entitas; panah menunjukkan arah relasi. Contoh relasi:

- vendor → lembaga: `memenangkan_tender_di`;
- pejabat → lembaga: `menjabat_di`;
- lembaga → regulasi: `menerbitkan_aturan`.

Gunakan entitas yang valid sebagai parameter:

```text
/api/v1/graph/1
```

## Membuat Watchlist

Kirim request POST dengan channel dan tujuan. Contoh untuk webhook:

```json
{
  "watchlistName": "Pengadaan Berisiko",
  "minRiskLevel": "MEDIUM",
  "notificationChannel": "WEBHOOK",
  "targetDestination": "https://example.com/pantaunegeri"
}
```

Channel yang tersedia:

- `EMAIL`: memerlukan SMTP;
- `WEBHOOK`: membutuhkan URL HTTPS yang dapat menerima POST;
- `RSS`: menyediakan feed per watchlist.

## Menguji Peringatan

```text
POST /api/v1/watchlists/:id/test-notify
```

Respons mencantumkan `SENT` atau `FAILED` beserta error bila gagal.
