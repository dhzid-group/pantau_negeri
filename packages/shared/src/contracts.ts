/** Kontrak data yang dipakai worker ingest dan tahap berikutnya. Selaras dengan enum Drizzle. */

export const ENTITY_TYPES = ['PERSON', 'VENDOR', 'INSTITUTION'] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export const INDICATOR_CODES = [
  'USD_IDR',
  'INFLATION_YOY',
  'BI_RATE',
  'GDP_GROWTH',
  'IKK_PURCHASING_POWER',
  'FOOD_INDEX',
] as const;
export type IndicatorCode = (typeof INDICATOR_CODES)[number];

export const INDICATOR_SOURCES = ['BPS', 'BI', 'KEMENKEU', 'PIHPS', 'WORLD_BANK', 'IMF'] as const;
export type IndicatorSource = (typeof INDICATOR_SOURCES)[number];

export const DOCUMENT_TYPES = [
  'REGULASI',
  'PUTUSAN',
  'LAPORAN_BPK',
  'LAKIP',
  'KEBIJAKAN_FISKAL',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const EXTRACTION_METHODS = ['NATIVE_PDF', 'OCR', 'HTML', 'API'] as const;
export type ExtractionMethod = (typeof EXTRACTION_METHODS)[number];

export const NEWS_CATEGORIES = ['GEOPOLITIK', 'BERITA_EKONOMI', 'KEBIJAKAN_DOMESTIK'] as const;
export type NewsCategory = (typeof NEWS_CATEGORIES)[number];

export const IMPACT_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type ImpactLevel = (typeof IMPACT_LEVELS)[number];

export const INGESTION_STATUSES = ['SUCCESS', 'FAILED', 'RATE_LIMITED'] as const;
export type IngestionStatus = (typeof INGESTION_STATUSES)[number];

export const INGESTION_JOBS = [
  'open-data',
  'procurement',
  'economy',
  'rss',
  'document',
] as const;
export type IngestionJobName = (typeof INGESTION_JOBS)[number];

/** Stempel audit yang wajib menyertai setiap rekaman hasil tarikan. */
export interface AuditStamp {
  sourceUrl: string;
  rawPayloadHash: string;
  fetchedAt: Date;
}

export interface IngestionJobResult {
  institutionCode?: string;
  sourceEndpoint: string;
  status: IngestionStatus;
  newRecordsCount: number;
  rawPayloadHash: string | null;
  errorMessage?: string;
}

export interface MappedProcurement {
  tenderCode: string | null;
  packageName: string;
  procurementMethod: string | null;
  hpsValue: string;
  contractValue: string;
  rawWinnerName: string | null;
  announcedDate: string | null;
  contractDate: string | null;
  fiscalYear: number;
  sourceUrl: string;
}

export interface MappedIndicator {
  indicatorCode: IndicatorCode;
  indicatorName: string;
  value: string;
  unit: string;
  periodDate: string;
  source: IndicatorSource;
  sourceUrl: string;
}

export interface MappedNewsItem {
  category: NewsCategory;
  title: string;
  objectiveSummary: string;
  impactLevel: ImpactLevel;
  relatedIndicatorCodes: string[];
  sourcePublisher: string;
  sourceUrl: string;
  publishedDate: string;
}
