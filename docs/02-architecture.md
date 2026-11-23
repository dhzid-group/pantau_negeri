# Arsitektur Sistem

## Komponen

```mermaid
flowchart LR
  Sources[Sumber Publik\ndata.go.id | BPS | BI | RSS | PDF] --> Worker
  Worker[BullMQ Worker] --> DB[(MySQL 8.0)]
  Redis[(Redis/Valkey)] <--> Worker
  DB --> API[Fastify REST API]
  API --> Frontend[Next.js App Router]
  API --> Notify[SMTP | Webhook | RSS]
```

## Struktur Monorepo

- `apps/frontend`: Next.js 16, Tailwind, Recharts, dan Cytoscape.
- `apps/api`: Fastify, CORS, Swagger/OpenAPI, Drizzle, dan Nodemailer.
- `apps/worker`: BullMQ, ingestion, extraction, entity resolution, scoring, dan pemrosesan relasi.
- `packages/db`: tabel Drizzle, koneksi MySQL, seed, generate/migrate.
- `packages/shared`: engine anomali, engine ekonomi, privacy masking, scraper etis, PDF extractor, resolver, RSS, dan mapper.

## Komunikasi

Frontend menjalankan request ke API internal melalui `NEXT_PUBLIC_API_BASE_URL` atau endpoint server-side lokal. API membaca dan menulis melalui Drizzle. Worker berjalan independen dan memperbarui tabel basis data berdasarkan jadwal Redis/BullMQ.

## Deployment Internal

- Frontend: port `3000`.
- API: port `4000`.
- Worker: daemon tanpa port publik.
- Reverse proxy Nginx/OpenLiteSpeed: `/` ke port 3000, `/api` ke port 4000.

## Proses Ingestion

1. Worker menerima job `open-data`, `procurement`, `economy`, `rss`, atau `document`.
2. Fetcher etis memeriksa robots/rate limit dan menghasilkan SHA-256.
3. Payload dipetakan ke skema Drizzle.
4. Data duplikat dicegah melalui source URL/hash.
5. Anomali dan economic score dihitung ulang ketika pengadaan/ekonomi baru tersimpan.
6. `ingestion_logs` mencatat status, jumlah rekaman baru, hash, dan durasi.

## Keandalan

- Concurrency ingestion di worker dibatasi menjadi 1 untuk mengurangi beban.
- Retry khusus untuk 429 dan kegagalan jaringan/HTTP 5xx.
- PM2 membatasi restart dan memori melalui `ecosystem.config.js`.
- Koneksi MySQL dan Redis harus dimonitor karena API/worker bergantung pada keduanya.
