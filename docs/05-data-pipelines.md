# Alur Data dan Skoring

## Ethical Ingestion

Fetcher membatasi permintaan dan memeriksa robots.txt bila tersedia. User-Agent wajib transparan. Dilarang melewati autentikasi, CAPTCHA, atau paywall.

Setiap payload dihitung SHA-256 dan disimpan bersama:

- `sourceUrl`;
- `fetchedAt`;
- `rawPayloadHash`;
- log status dan durasi.

## Entity Resolution

Nama dinormalisasi dengan:

- lowercase dan trim;
- penghilangan gelar akademik;
- penghilangan prefiks/sufiks badan hukum;
- pencarian exact match;
- pencocokan Levenshtein dengan threshold 85%.

Alias disimpan pada entitas kanonik.

## Ekstraksi PDF dan OCR

Alur extraction:

1. coba ekstraksi native `pdftotext`;
2. jika teks kurang dari ambang 80 karakter, fallback OCR;
3. hasil disimpan beserta metode `NATIVE_PDF`, `OCR`, `HTML`, atau `API`;
4. teks dapat digunakan untuk pencarian dan audit dokumen.

## Anomali Pengadaan

```text
Deviasi = (Nilai Kontrak - HPS) / HPS × 100%
```

Flag hanya dibuat jika deviasi minimal 20%.

- LOW: 20%–<35%
- MEDIUM: 35%–<50%
- HIGH: >=50%

Semua hasil menggunakan terminologi statistik dan disclaimer hukum.

## Anomali LHKPN

```text
Lonjakan = Selisih Aset Tahunan / Aset Tahun Berjalan × 100%
```

Ambang bawaan:

- MEDIUM: >=50%
- HIGH: >=100%

Data merupakan sinyal deviasi, bukan bukti pelanggaran atau tuduhan.

## Economic Resilience Score

Bobot komponen:

- Kurs USD/IDR: 35%
- Inflasi: 25%
- IKK/daya beli: 25%
- Indeks pangan: 15%

Formula utama:

```text
Skor = 100 × (1 - [
  0.35 × tekananKurs +
  0.25 × tekananInflasi +
  0.25 × tekananDayaBeli +
  0.15 × tekananPangan
])
```

Tambahan tekanan 5% jika BI Rate >=6.25.

Status:

- STABIL: >=75
- WASPADA: >=50
- TEKANAN_TINGGI: <50

Jika indikator tidak tersedia, komponen memakai penalti ketidakpastian 50% agar keterbatasan data tampak dalam hasil.

## Citizen Solution Playbooks

- `RUPIAH_WEAKENING`: USD/IDR >16200
- `PURCHASING_POWER_DROP`: IKK <115
- `HIGH_INTEREST_RATE`: BI Rate >=6.25
- `FOOD_INFLATION`: Indeks pangan >120

Playbook aktual diproses di worker dan status `isActive` diperbarui di database.

## Korelasi Macro

RSS/berita dipetakan ke indikator melalui kata kunci kurs, inflasi, pangan, suku bunga, PDB, dan daya beli. Korelasi adalah indikatif dan tidak boleh ditafsirkan sebagai kausalitas statistik otomatis.
