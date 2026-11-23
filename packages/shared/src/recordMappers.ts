import { computeSha256 } from './ethicalScraper.js';
import type { IndicatorCode, IndicatorSource, MappedIndicator, MappedProcurement } from './contracts.js';

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/[^\d.-]/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function decimalString(value: number): string {
  return value.toFixed(2);
}

export function mapProcurementRecord(
  raw: Record<string, unknown>,
  fallbackSourceUrl: string
): MappedProcurement | null {
  const packageName = asText(raw.package_name) || asText(raw.nama_paket) || asText(raw.namaPaket);
  const hps = asNumber(raw.hps_value ?? raw.hps ?? raw.nilai_hps ?? raw.nilaiHps);
  const contract = asNumber(raw.contract_value ?? raw.nilai_kontrak ?? raw.nilaiKontrak ?? hps);
  const year = asNumber(raw.fiscal_year ?? raw.tahun ?? raw.fiscalYear) ?? new Date().getFullYear();

  if (!packageName || hps === null || contract === null) return null;

  return {
    tenderCode: asText(raw.tender_code) || asText(raw.kode) || asText(raw.kode_tender),
    packageName: packageName.slice(0, 500),
    procurementMethod: asText(raw.procurement_method) || asText(raw.metode),
    hpsValue: decimalString(hps),
    contractValue: decimalString(contract),
    rawWinnerName: asText(raw.winner_name) || asText(raw.nama_pemenang) || asText(raw.pemenang),
    announcedDate: asText(raw.announced_date) || asText(raw.tanggal_umum),
    contractDate: asText(raw.contract_date) || asText(raw.tanggal_kontrak),
    fiscalYear: Math.trunc(year),
    sourceUrl: asText(raw.source_url) || fallbackSourceUrl,
  };
}

export function hashMappedRecord(record: unknown): string {
  return computeSha256(JSON.stringify(record));
}

interface WorldBankRow {
  value: number | null;
  date?: string;
  indicator?: { value?: string };
}

export function mapWorldBankSeries(
  payload: unknown,
  meta: { indicatorCode: IndicatorCode; indicatorName: string; unit: string; sourceUrl: string }
): MappedIndicator[] {
  if (!Array.isArray(payload) || !Array.isArray(payload[1])) return [];
  const rows = payload[1] as WorldBankRow[];

  return rows
    .filter((row) => row && typeof row.value === 'number')
    .map((row) => ({
      indicatorCode: meta.indicatorCode,
      indicatorName: row.indicator?.value || meta.indicatorName,
      value: Number(row.value).toFixed(4),
      unit: meta.unit,
      periodDate: `${row.date ?? '1970'}-01-01`.slice(0, 10),
      source: 'WORLD_BANK' as IndicatorSource,
      sourceUrl: meta.sourceUrl,
    }));
}

export function mapSimpleIndicator(
  payload: unknown,
  meta: {
    indicatorCode: IndicatorCode;
    indicatorName: string;
    unit: string;
    source: IndicatorSource;
    sourceUrl: string;
  }
): MappedIndicator[] {
  const rows = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown[] }).data)
      ? (payload as { data: unknown[] }).data
      : payload && typeof payload === 'object'
        ? [payload]
        : [];

  const mapped: MappedIndicator[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const record = row as Record<string, unknown>;
    const value = asNumber(record.value ?? record.nilai ?? record.nilai_indikator);
    const period = asText(record.period_date) || asText(record.tanggal) || asText(record.date);
    if (value === null || !period) continue;
    mapped.push({
      indicatorCode: meta.indicatorCode,
      indicatorName: meta.indicatorName,
      value: value.toFixed(4),
      unit: meta.unit,
      periodDate: period.slice(0, 10),
      source: meta.source,
      sourceUrl: meta.sourceUrl,
    });
  }
  return mapped;
}
