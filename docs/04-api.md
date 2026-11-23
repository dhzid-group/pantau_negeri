# Referensi API

Server Fastify berjalan pada port 4000 secara default. Semua route dimulai dengan `/api/v1`.

## Health

### `GET /api/v1/health`

Mengembalikan status API.

```json
{ "status": "ok", "stage": 4 }
```

## Dashboard

### `GET /api/v1/dashboard`

Mengembalikan ringkasan lembaga, skor ekonomi terbaru, anomali, pengadaan, playbook aktif, dan disclaimer.

## Direktori dan Pencarian

### `GET /api/v1/institutions?q=nama`

Parameter opsional:

- `q`: pencarian nama atau kode lembaga.

### `GET /api/v1/search?q=kata`

Mengembalikan pencarian lintas:

- lembaga;
- entitas kanonik;
- paket pengadaan.

## Anomali dan Klarifikasi

### `GET /api/v1/anomalies`

Parameter:

- `risk`: `LOW`, `MEDIUM`, atau `HIGH`;
- `status`: `OPEN`, `UNDER_REVIEW`, `CLARIFIED`, atau `RESOLVED`.

Respons berisi disclaimer dan daftar flag.

### `POST /api/v1/anomalies/:id/clarifications`

Body JSON:

```json
{
  "clarifierName": "Nama Pengklarifikasi",
  "clarifierRole": "Jabatan / Instansi",
  "clarificationText": "Isi klarifikasi resmi",
  "officialDocumentUrl": "https://domain.go.id/dokumen.pdf"
}
```

Klarifikasi awal berstatus `PENDING`.

## Ekonomi

### `GET /api/v1/economy/latest`

Mengembalikan:

- 12 skor evaluasi terbaru;
- maksimal 300 indikator;
- playbook aktif;
- 50 timeline macro terbaru;
- disclaimer ekonomi.

### `GET /api/v1/economy/playbooks`

Mengembalikan seluruh skenario dan daftar aksi rumah tangga/UMKM.

## Graf Relasi

### `GET /api/v1/graph/:entityId`

Respons:

```json
{
  "center": { "id": 1, "displayName": "...", "type": "INSTITUTION" },
  "nodes": [{ "id": "1", "label": "Nama", "type": "INSTITUTION" }],
  "edges": [{ "id": "10", "source": "2", "target": "1", "relationType": "memenangkan_tender_di", "weight": "100000" }]
}
```

Maksimal 100 relasi langsung dikembalikan pada implementasi saat ini.

## Watchlist

### `GET /api/v1/watchlists?userId=public`

### `POST /api/v1/watchlists`

```json
{
  "userId": "public",
  "watchlistName": "Pantauan Rupiah",
  "institutionId": null,
  "keyword": "pengadaan",
  "minProcurementValue": 1000000000,
  "minRiskLevel": "MEDIUM",
  "economicScenarioCode": "RUPIAH_WEAKENING",
  "notificationChannel": "WEBHOOK",
  "targetDestination": "https://example.go.id/webhook"
}
```

Channel valid: `EMAIL`, `WEBHOOK`, `RSS`.

### `GET /api/v1/watchlists/:id/rss`

Menghasilkan RSS XML beserta disclaimer.

### `POST /api/v1/watchlists/:id/test-notify`

Mengirim email SMTP jika dikonfigurasi, POST JSON ke webhook, atau mencatat status untuk RSS.

## Status HTTP

- `200`: berhasil.
- `201`: sumber/watchlist/klarifikasi dibuat.
- `400`: parameter atau body tidak valid.
- `404`: entitas/watchlist tidak ditemukan.

## Swagger

Plugin Swagger terdaftar pada API. Konfigurasi OpenAPI dapat diperluas melalui plugin Fastify saat menambah schema route.
