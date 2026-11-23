# Struktur Database

Database menggunakan MySQL 8.0 dan Drizzle ORM. Skema berada di `packages/db/src/schema/` dan diekspor melalui `packages/db/src/schema.ts`.

## Daftar Tabel

| Kelompok    | Tabel                                      | Kegunaan                                                    |
| ----------- | ------------------------------------------ | ----------------------------------------------------------- |
| Institusi   | `institutions`                             | Lembaga, kategori, portal, status sinkronisasi              |
| Entitas     | `canonical_entities`, `public_officials`   | Vendor, pejabat, institusi, dan riwayat LHKPN               |
| Pengadaan   | `procurements`                             | HPS, nilai kontrak, vendor, tahun, bukti sumber             |
| Dokumen     | `regulations_and_documents`                | Regulasi, putusan, LAKIP, laporan BPK, teks hasil ekstraksi |
| Relasi      | `entity_relationships`                     | Edge graf antar-entitas                                     |
| Anomali     | `anomaly_flags`, `official_clarifications` | Penandaan statistik dan hak jawab resmi                     |
| Ekonomi     | `economic_indicators`, `economic_scores`   | Indikator makro dan hasil skor                              |
| Korelasi    | `macro_events_and_news`                    | Berita, geopolitik, dan kebijakan domestik                  |
| Solusi      | `citizen_solution_playbooks`               | Aturan skenario dan langkah mitigasi                        |
| Peringatan  | `user_watchlists`, `alert_notifications`   | Aturan pantauan dan log pengiriman                          |
| Operasional | `ingestion_logs`                           | Audit hasil ingestion                                       |

## Kolom Audit Wajib

Data yang berasal dari sumber eksternal harus mempertahankan:

- `source_url`;
- `fetched_at`;
- `raw_payload_hash` berupa SHA-256;
- sumber/jenis ekstraksi bila relevan;
- status dan pesan kesalahan pada ingestion logs.

## Enum Penting

- Kategori lembaga: `EKSEKUTIF`, `LEGISLATIF`, `YUDIKATIF`, `INDEPENDEN`, `BUMN`.
- Tipe entitas: `PERSON`, `VENDOR`, `INSTITUTION`.
- Risiko anomali: `LOW`, `MEDIUM`, `HIGH`.
- Status anomali: `OPEN`, `UNDER_REVIEW`, `CLARIFIED`, `RESOLVED`.
- Status ekonomi: `STABIL`, `WASPADA`, `TEKANAN_TINGGI`.
- Kategori macro: `GEOPOLITIK`, `BERITA_EKONOMI`, `KEBIJAKAN_DOMESTIK`.
- Channel: `EMAIL`, `WEBHOOK`, `RSS`.

## Migrasi dan Seed

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Script seed mengisi lembaga awal dan empat citizen solution playbooks untuk:

- `RUPIAH_WEAKENING`;
- `PURCHASING_POWER_DROP`;
- `HIGH_INTEREST_RATE`;
- `FOOD_INFLATION`.

## Indeks

Skema mencakup index kode/tanggal, lembaga/tahun, vendor, hash sumber, status risiko, jenis entitas, kode indikator, kategori macro, dan user/channel watchlist. Jika kebutuhan pencarian teks dokumen diperluas, tambahkan FULLTEXT pada `regulations_and_documents.extracted_text` melalui migrasi Drizzle/DDL terpisah.

## Backup

Di produksi, lakukan backup reguler MySQL menggunakan mysqldump dari tujuan aaPanel atau scheduler bawaan. Jangan mencadangkan `.env` sebagai bagian backup database.
