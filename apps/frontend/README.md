# PantauNegeri Frontend

Antarmuka Next.js App Router untuk dashboard nasional, direktori lembaga, anomali, peta relasi, dan intelijen ekonomi.

## Menjalankan Lokal

```bash
cd ../..
pnpm install
pnpm dev:api
pnpm dev:frontend
```

Frontend default: `http://127.0.0.1:3000`.
API default: `http://127.0.0.1:4000`.

## Modul Halaman

- `/`: Dashboard Nasional
- `/institutions`: Direktori Lembaga
- `/anomalies`: Umpan Anomali
- `/graph`: Peta Cytoscape
- `/economy`: Skor ekonomi, grafik, timeline, dan playbook

## Build

```bash
pnpm --filter frontend build
```

Dokumentasi lengkap tersedia di `../../README.md` dan folder `../../docs/`.
