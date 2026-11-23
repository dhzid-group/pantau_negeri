# PantauNegeri

PantauNegeri adalah platform transparansi lembaga negara dan intelijen ekonomi publik berbasis TypeScript. Sistem menggabungkan agregasi data terbuka, pemadanan entitas, deteksi deviasi statistik, peta relasi, watchlist, serta tab ekonomi dalam satu aplikasi monorepo.

> Seluruh fitur anomali dan ekonomi bersifat informatif/statistik. Sistem tidak menghasilkan vonis hukum, tuduhan pidana, atau rekomendasi investasi berizin.

## Dokumentasi

- [Gambaran Sistem](docs/01-overview.md)
- [Arsitektur](docs/02-architecture.md)
- [Struktur Database](docs/03-database.md)
- [Referensi API](docs/04-api.md)
- [Alur Data dan Skoring](docs/05-data-pipelines.md)
- [Panduan Pengguna](docs/06-user-guide.md)
- [Deployment aaPanel](docs/07-deployment-aapanel.md)
- [Operasi dan Troubleshooting](docs/08-operations.md)
- [Kepatuhan dan Keamanan](docs/09-compliance-security.md)

## Modul Utama

- **Frontend:** Dashboard nasional, direktori lembaga, umpan anomali, peta Cytoscape, pencarian, dan tab ekonomi Recharts.
- **API:** Fastify REST API dengan CORS dan dokumentasi OpenAPI/Swagger.
- **Worker:** BullMQ/Redis untuk ingestion lembaga, ekonomi, RSS, PDF/OCR, entity resolution, anomali, dan skor ekonomi.
- **Database:** MySQL 8.0 dengan Drizzle ORM.
- **Notifikasi:** Nodemailer SMTP, webhook, dan RSS.

## Persyaratan

- Node.js 20 atau lebih baru
- pnpm 9 atau lebih baru
- MySQL 8.0
- Redis atau Valkey
- PM2 untuk produksi
- `tesseract-ocr`, `tesseract-ocr-ind`, dan `poppler-utils` untuk OCR/PDF

## Konfigurasi Awal

```bash
cp .env.example .env
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm build
```

Setidaknya konfigurasi `DATABASE_URL` dan `REDIS_URL` harus valid sebelum menjalankan API atau worker.

## Menjalankan Lokal

```bash
pnpm dev:api
pnpm dev:frontend
pnpm dev:worker
```

URL lokal default:

- Frontend: `http://127.0.0.1:3000`
- API: `http://127.0.0.1:4000`
- Health check: `http://127.0.0.1:4000/api/v1/health`

## Verifikasi

```bash
pnpm --filter pantau-shared test
pnpm --filter pantau-api build
pnpm --filter pantau-worker build
pnpm --filter frontend build
```

## Struktur Monorepo

```text
apps/
  api/       REST API Fastify
  frontend/  Next.js App Router
  worker/    BullMQ ingestion dan scoring
packages/
  db/        Skema dan koneksi Drizzle MySQL
  shared/    Engine, mapper, scraper, resolver, dan utilitas
scripts/     Setup OS untuk server aaPanel
docs/        Dokumentasi teknis dan operasional
```

## Lisensi dan Penggunaan

Gunakan hanya sumber publik yang diizinkan, patuhi `robots.txt`, lakukan rate limiting, jangan mengakses CAPTCHA/paywall/autentikasi privat, dan pertahankan jejak audit `source_url`, `fetched_at`, serta `raw_payload_hash`.
