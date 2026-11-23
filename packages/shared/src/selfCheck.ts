import { normalizeEntityName, resolveCanonicalEntity } from './entityResolver.js';
import { computeSha256 } from './ethicalScraper.js';
import { maskNik, sanitizeSensitiveText } from './privacyMasker.js';
import { mapRssItems, parseRssItems } from './rss.js';
import { mapProcurementRecord, mapWorldBankSeries } from './recordMappers.js';

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(message);
}

const vendorA = normalizeEntityName('PT. Sumber Makmur', 'VENDOR');
const vendorB = normalizeEntityName('SUMBER MAKMUR, PT', 'VENDOR');
assert(vendorA === 'sumber makmur', `normalisasi vendor gagal: ${vendorA}`);
assert(vendorA === vendorB, 'variasi PT tidak menyatu');

const person = normalizeEntityName('Dr. Budi Santoso, S.H.', 'PERSON');
assert(person === 'budi santoso', `normalisasi gelar gagal: ${person}`);

const resolved = resolveCanonicalEntity('PT Sumber Makmur', 'VENDOR', [
  {
    id: 7,
    normalizedName: 'sumber makmur',
    displayName: 'PT Sumber Makmur',
    type: 'VENDOR',
    aliases: [],
  },
]);
assert(resolved.matched && resolved.canonicalId === 7, 'exact match canonical gagal');

const fuzzy = resolveCanonicalEntity('PT. Sumber Makmurr', 'VENDOR', [
  {
    id: 7,
    normalizedName: 'sumber makmur',
    displayName: 'PT Sumber Makmur',
    type: 'VENDOR',
    aliases: [],
  },
]);
assert(fuzzy.matched && fuzzy.confidenceScore >= 0.85, `fuzzy match gagal: ${fuzzy.confidenceScore}`);

assert(computeSha256('pantau') === computeSha256('pantau'), 'hash tidak stabil');
assert(computeSha256('pantau').length === 64, 'hash SHA-256 bukan 64 hex');
assert(maskNik('3201011234567812') === '320101********12', 'mask NIK gagal');
assert(!sanitizeSensitiveText('NIK 3201011234567812').includes('12345678'), 'sanitasi NIK gagal');

const rss = mapRssItems(
  parseRssItems(`
    <rss><channel>
      <item>
        <title>Rupiah melemah terhadap dolar</title>
        <link>https://www.antaranews.com/berita/1</link>
        <description>Kurs rupiah bergerak.</description>
        <pubDate>Mon, 24 Nov 2025 00:00:00 GMT</pubDate>
      </item>
    </channel></rss>
  `),
  'BERITA_EKONOMI',
  'ANTARA'
);
assert(rss.length === 1 && rss[0].relatedIndicatorCodes.includes('USD_IDR'), 'parser RSS gagal');

const procurement = mapProcurementRecord(
  { nama_paket: 'Pengadaan kertas', nilai_hps: '1000', nilai_kontrak: '900', nama_pemenang: 'PT. Sumber Makmur', tahun: 2024 },
  'https://example.go.id/tender'
);
assert(procurement?.packageName === 'Pengadaan kertas' && procurement.fiscalYear === 2024, 'mapper pengadaan gagal');

const series = mapWorldBankSeries(
  [{ page: 1 }, [{ value: 15800.5, date: '2024', indicator: { value: 'Official exchange rate' } }]],
  { indicatorCode: 'USD_IDR', indicatorName: 'Kurs', unit: 'IDR', sourceUrl: 'https://api.worldbank.org' }
);
assert(series.length === 1 && series[0].periodDate === '2024-01-01', 'mapper World Bank gagal');

console.log('pantau-shared self-check: OK');
