import type { DocumentType, IndicatorCode, IndicatorSource, NewsCategory } from 'pantau-shared';

export interface OpenDataSource {
  institutionCode: string;
  endpoint: string;
}

export interface EconomySource {
  indicatorCode: IndicatorCode;
  indicatorName: string;
  unit: string;
  source: IndicatorSource;
  endpoint: string;
  kind: 'world-bank' | 'simple-json' | 'bps';
}

export interface RssSource {
  feedUrl: string;
  category: NewsCategory;
  publisher: string;
}

export interface ProcurementSource {
  institutionCode: string;
  endpoint: string;
}

export interface DocumentSource {
  institutionCode: string;
  sourceUrl: string;
  docType: DocumentType;
  docNumber: string;
  title: string;
  publishedDate?: string;
}

const WORLD_BANK = 'https://api.worldbank.org/v2/country/IDN/indicator';

export const OPEN_DATA_SOURCES: OpenDataSource[] = [
  {
    institutionCode: 'KEMENKEU',
    endpoint: 'https://data.go.id/api/3/action/package_search?q=kementerian+keuangan&rows=5',
  },
  {
    institutionCode: 'DPR',
    endpoint: 'https://data.go.id/api/3/action/package_search?q=dpr&rows=5',
  },
];

export const ECONOMY_SOURCES: EconomySource[] = [
  {
    indicatorCode: 'USD_IDR',
    indicatorName: 'Kurs referensi USD terhadap IDR',
    unit: 'IDR',
    source: 'WORLD_BANK',
    kind: 'world-bank',
    endpoint: `${WORLD_BANK}/PA.NUS.FCRF?format=json&mrnev=1&per_page=5`,
  },
  {
    indicatorCode: 'INFLATION_YOY',
    indicatorName: 'Inflasi harga konsumen tahunan',
    unit: 'PCT',
    source: 'WORLD_BANK',
    kind: 'world-bank',
    endpoint: `${WORLD_BANK}/FP.CPI.TOTL.ZG?format=json&mrnev=1&per_page=5`,
  },
  {
    indicatorCode: 'GDP_GROWTH',
    indicatorName: 'Pertumbuhan PDB riil',
    unit: 'PCT',
    source: 'WORLD_BANK',
    kind: 'world-bank',
    endpoint: `${WORLD_BANK}/NY.GDP.MKTP.KD.ZG?format=json&mrnev=1&per_page=5`,
  },
];

export const RSS_SOURCES: RssSource[] = [
  {
    feedUrl: 'https://www.antaranews.com/rss/ekonomi.xml',
    category: 'BERITA_EKONOMI',
    publisher: 'ANTARA',
  },
  {
    feedUrl: 'https://www.antaranews.com/rss/internasional.xml',
    category: 'GEOPOLITIK',
    publisher: 'ANTARA',
  },
];

function optionalJsonSource(
  indicatorCode: IndicatorCode,
  indicatorName: string,
  unit: string,
  source: IndicatorSource,
  envName: string
): EconomySource | null {
  const endpoint = process.env[envName]?.trim();
  if (!endpoint) return null;
  return { indicatorCode, indicatorName, unit, source, endpoint, kind: 'simple-json' };
}

export function configuredEconomySources(): EconomySource[] {
  const extra = [
    optionalJsonSource('BI_RATE', 'Suku bunga acuan Bank Indonesia', 'PCT', 'BI', 'BI_RATE_JSON_URL'),
    optionalJsonSource('IKK_PURCHASING_POWER', 'Indeks Keyakinan Konsumen', 'INDEX', 'BPS', 'IKK_JSON_URL'),
    optionalJsonSource('FOOD_INDEX', 'Indeks harga pangan pokok', 'INDEX', 'PIHPS', 'FOOD_INDEX_JSON_URL'),
  ].filter((item): item is EconomySource => item !== null);

  const bpsPath = process.env.BPS_INFLATION_PATH?.trim();
  const bpsKey = process.env.BPS_API_KEY?.trim();
  const bpsBase = process.env.BPS_API_BASE?.trim() || 'https://webapi.bps.go.id/v1';
  if (bpsPath && bpsKey && bpsKey !== 'CHANGE_ME') {
    const joiner = bpsPath.includes('?') ? '&' : '?';
    extra.push({
      indicatorCode: 'INFLATION_YOY',
      indicatorName: 'Inflasi menurut Web API BPS',
      unit: 'PCT',
      source: 'BPS',
      kind: 'bps',
      endpoint: `${bpsBase}${bpsPath}${joiner}key=${encodeURIComponent(bpsKey)}`,
    });
  }

  return [...ECONOMY_SOURCES, ...extra];
}

export function configuredProcurementSources(): ProcurementSource[] {
  const raw = process.env.INGEST_PROCUREMENT_ENDPOINTS?.trim();
  if (!raw) return [];
  return raw.split(',').flatMap((pair) => {
    const [institutionCode, endpoint] = pair.split('|').map((part) => part.trim());
    if (!institutionCode || !endpoint) return [];
    return [{ institutionCode, endpoint }];
  });
}

export function configuredDocumentSources(): DocumentSource[] {
  return [];
}
