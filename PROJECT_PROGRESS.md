# PROJECT_PROGRESS.md — Tahap 4: API, Watchlist & Frontend PantauNegeri

## Status Keseluruhan Tahapan

- [x] Tahap 1: Selesai (Arsitektur monorepo, setup server & skema DB)
- [x] Tahap 2: Selesai (Ingestion lembaga, data ekonomi, PDF/OCR & Entity Resolution)
- [x] Tahap 3: Selesai (Anomaly Engine, Economic Scoring & Solution Rules Engine)
- [x] Tahap 4: Selesai (API Graf, Watchlist & Frontend Next.js)

## Log Detail Tahap 4 (Baru Selesai)

### API Fastify

| File / Endpoint                             | Fungsi                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------- |
| `apps/api/src/index.ts`                     | Entry point Fastify, CORS, OpenAPI Swagger, dan seluruh endpoint Tahap 4.  |
| `GET /api/v1/health`                        | Health-check API.                                                          |
| `GET /api/v1/dashboard`                     | Ringkasan lembaga, skor ekonomi, anomali, pengadaan, dan playbook aktif.   |
| `GET /api/v1/institutions`                  | Direktori lembaga dengan pencarian opsional `?q=`.                         |
| `GET /api/v1/search`                        | Pencarian lintas lembaga, canonical entity, dan paket pengadaan.           |
| `GET /api/v1/anomalies`                     | Umpan anomali dengan filter risiko/status dan disclaimer wajib.            |
| `POST /api/v1/anomalies/:id/clarifications` | Penerimaan hak jawab resmi dengan status verifikasi awal `PENDING`.        |
| `GET /api/v1/economy/latest`                | Skor, tren indikator, playbook aktif, dan timeline.                        |
| `GET /api/v1/economy/playbooks`             | Seluruh citizen solution playbooks beserta disclaimer ekonomi.             |
| `GET /api/v1/graph/:entityId`               | Nodes dan edges relasi dua arah melalui `entity_relationships`.            |
| `GET /api/v1/watchlists`                    | Daftar watchlist per `userId`.                                             |
| `POST /api/v1/watchlists`                   | Membuat aturan pantauan lembaga, kata kunci, risiko, ekonomi, dan channel. |
| `GET /api/v1/watchlists/:id/rss`            | RSS khusus watchlist dengan disclaimer anomali.                            |
| `POST /api/v1/watchlists/:id/test-notify`   | Uji Email SMTP, Webhook, atau pencatatan channel RSS.                      |

### Frontend Next.js

| Modul / File                                       | Deskripsi                                        |
| -------------------------------------------------- | ------------------------------------------------ |
| `apps/frontend/src/app/page.tsx`                   | Dashboard nasional.                              |
| `apps/frontend/src/app/institutions/page.tsx`      | Direktori lembaga.                               |
| `apps/frontend/src/app/anomalies/page.tsx`         | Umpan anomali statistik dan disclaimer.          |
| `apps/frontend/src/app/graph/page.tsx`             | Halaman peta relasi entitas.                     |
| `apps/frontend/src/app/graph/GraphView.tsx`        | Visualisasi Cytoscape.js untuk nodes dan edges.  |
| `apps/frontend/src/app/economy/page.tsx`           | Skor ketahanan, formula, playbook, dan timeline. |
| `apps/frontend/src/app/economy/EconomicCharts.tsx` | Grafik tren indikator memakai Recharts.          |
| `apps/frontend/src/app/layout.tsx`                 | Navigasi global PantauNegeri.                    |

### Watchlist & Notifikasi

- Channel `EMAIL`, `WEBHOOK`, dan `RSS` tersedia pada skema dan API.
- Email menggunakan SMTP Nodemailer standar tanpa SaaS berbayar.
- Webhook mengirim payload JSON dengan legal disclaimer.
- Pengiriman dicatat pada `alertNotifications` beserta status dan error.
- RSS menyertakan disclaimer pada deskripsi feed.

### Environment Variable Tahap 4

Tambahan/penting untuk menjalankan API:

```env
API_PORT=4000
API_HOST=0.0.0.0
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4000/api
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=PantauNegeri <noreply@pantaunegeri.id>
```

## Cara Verifikasi / Uji Coba

```bash
# Build API Fastify
pnpm --filter pantau-api build

# Jalankan unit test engine
pnpm --filter pantau-shared test

# Build frontend Next.js produksi
pnpm --filter frontend build

# Jalankan API
pnpm --filter pantau-api dev

# Jalankan frontend
pnpm --filter frontend dev
```

Endpoint uji cepat:

```text
http://127.0.0.1:4000/api/v1/health
http://127.0.0.1:4000/api/v1/dashboard
http://127.0.0.1:4000/api/v1/economy/latest
http://127.0.0.1:3000
```

## Status Akhir

Seluruh tahap 1–4 telah diimplementasikan pada workspace. Validasi terakhir yang berhasil:

- API Fastify TypeScript build berhasil.
- 6 unit test shared engine berhasil.
- Build produksi Next.js berhasil dengan route dinamis dashboard, lembaga, anomali, graf, dan ekonomi.

## Dokumentasi Lengkap Website

Dokumentasi proyek tersedia pada:

- `README.md`: ringkasan, setup awal, perintah build, dan struktur monorepo.
- `docs/01-overview.md`: gambaran produk dan pengguna.
- `docs/02-architecture.md`: komponen, monorepo, alur ingest, dan deployment internal.
- `docs/03-database.md`: tabel, enum, indeks, migrasi, seed, dan audit.
- `docs/04-api.md`: referensi endpoint dan contoh payload.
- `docs/05-data-pipelines.md`: entity resolution, OCR, anomali, ekonomi, dan playbook.
- `docs/06-user-guide.md`: panduan penggunaan fitur website.
- `docs/07-deployment-aapanel.md`: setup Ubuntu, PM2, reverse proxy, SSL, MySQL, dan Redis.
- `docs/08-operations.md`: monitoring, troubleshooting, backup, dan verifikasi rilis.
- `docs/09-compliance-security.md`: disclaimer, UU ITE/PDP, masking, hak jawab, dan keamanan API.
- `apps/frontend/README.md`: panduan khusus frontend Next.js.
