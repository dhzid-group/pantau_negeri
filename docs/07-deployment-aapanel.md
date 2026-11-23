# Deployment Ubuntu + aaPanel

## Lokasi Direkomendasikan

Letakkan aplikasi di `/www/wwwroot/pantaunegeri`.

## Persiapan Sistem

Jalankan sebagai root:

```bash
cd /www/wwwroot/pantaunegeri
bash scripts/setup-deps.sh
```

Script hanya memasang tool dokumen, Node.js bila perlu, PM2, dan pnpm. Script tidak mengganti MySQL atau Nginx/OpenLiteSpeed aaPanel.

## Konfigurasi Lingkungan

```bash
cp .env.example .env
chmod 600 .env
```

Isi paling tidak:

- `DATABASE_URL`;
- `REDIS_URL`;
- variabel SMTP bila memakai Email;
- endpoint JSON procurement/economic source yang tersedia;
- API/Frontend port.

## Build

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm build
```

## PM2

Konfigurasi tersedia pada `ecosystem.config.js`:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
pm2 status
```

PM2 membatasi memori frontend 400 MB, API 300 MB, dan worker 500 MB.

## Reverse Proxy aaPanel

Buat website/domain pada aaPanel, aktifkan SSL Let's Encrypt, lalu tambahkan proxy:

- `/` → `http://127.0.0.1:3000`
- `/api` → `http://127.0.0.1:4000`

Pastikan routing API tidak dipotong atau dialihkan secara tidak tepat. Frontend dapat membaca API lokal atau domain publik sesuai `NEXT_PUBLIC_API_BASE_URL`.

## Nginx/Antar Request

Disarankan:

- batasi ukuran upload bila endpoint dokumen ditambahkan;
- aktifkan SSL;
- set timeout cukup panjang untuk endpoint dokumentasi/ingestion;
- ratifikasi reverse proxy `/api` sebelum static `/`;
- aktifkan log access/error.

## Redis/Valkey

Gunakan Redis bawaan aaPanel atau instal valkey/redis secara terpisah. Pastikan worker dan queue memakai `REDIS_URL` yang sama.

## MySQL

Buat database dan user khusus, lalu batasi akses ke `127.0.0.1`. Jangan gunakan akun root pada aplikasi.

Contoh format:

```text
mysql://pantau_user:password@127.0.0.1:3306/pantaunegeri
```

## Pemeriksaan Pasca Deploy

```bash
curl -fsS http://127.0.0.1:4000/api/v1/health
curl -fsS http://127.0.0.1:4000/api/v1/dashboard
curl -I http://127.0.0.1:3000
pm2 logs pantau-api --lines 100
pm2 logs pantau-worker --lines 100
```
