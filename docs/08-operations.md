# Operasi dan Troubleshooting

## Perintah Umum

```bash
pnpm build
pnpm dev:api
pnpm dev:frontend
pnpm dev:worker
pm2 status
pm2 restart ecosystem.config.js
pm2 logs
```

## Pemeriksaan Kesehatan

```bash
curl http://127.0.0.1:4000/api/v1/health
curl http://127.0.0.1:4000/api/v1/dashboard
curl http://127.0.0.1:4000/api/v1/economy/latest
```

## Database Tidak Terhubung

Gejala: API gagal koneksi, worker berhenti, atau `ECONNREFUSED`.

Cek:

1. MySQL berjalan;
2. `DATABASE_URL` benar;
3. user memiliki hak pada database;
4. firewall aaPanel membolehkan localhost;
5. paket `mysql2` dan skema Drizzle telah dibuild.

## Redis Tidak Terhubung

Gejala: BullMQ gagal antre atau worker tidak menerima job.

Cek:

1. Redis/Valkey berjalan;
2. `REDIS_URL` benar;
3. password Redis ditambahkan bila digunakan;
4. worker dapat mengakses 127.0.0.1 atau host Redis.

## API Berhasil Build tetapi Frontend Tidak Memuat Data

Cek:

1. API mendengarkan port 4000;
2. `NEXT_PUBLIC_API_BASE_URL` valid;
3. reverse proxy `/api` tidak salah arah;
4. CORS API aktif;
5. SSL valid pada domain produksi.

## OCR atau PDF Gagal

Cek binary:

```bash
tesseract --version
pdftotext -v
```

Pastikan bahasa Indonesia tersedia dan worker memiliki hak baca file sementara. Gunakan fallback native bila Tesseract JS tidak diperlukan.

## Notifikasi Email Gagal

Cek:

- `SMTP_HOST`;
- `SMTP_PORT`;
- `SMTP_SECURE`;
- `SMTP_USER`/`SMTP_PASS`;
- `SMTP_FROM`;
- log/port firewall keluar SMTP;
- status pada `alert_notifications`.

## Ingestion Lambat atau 429

Kebijakan etis membatasi 3–5 detik per domain. Tunggu interval, periksa log dan pastikan source URL tidak melanggar robots.txt. Kurangi concurrency atau interval jika VPS terlalu terbatas.

## Log PM2

```bash
pm2 logs pantau-api --lines 200
pm2 logs pantau-worker --lines 200
pm2 logs pantau-frontend --lines 200
```

## Backup

Cadangkan MySQL dan konfigurasi PM2 (`pm2 save`) secara terjadwal. Cadangkan `.env.example`, jangan cadangkan `.env` ke repositori Git.

## Verifikasi Rilis

```bash
pnpm --filter pantau-db build
pnpm --filter pantau-shared test
pnpm --filter pantau-shared build
pnpm --filter pantau-api build
pnpm --filter pantau-worker build
pnpm --filter frontend build
curl -fsS http://127.0.0.1:4000/api/v1/health
```
