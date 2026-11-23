// packages/shared/src/anomalyDetector.ts
// Engine terstruktur untuk deteksi anomali
// Memisahkan analisis anomali dari logika bisnis inti

export interface ProcurementRecord {
  hps: number;
  contractValue: number;
  date?: Date;
}

export interface LHKPNRecord {
  year: number;
  assets: number;
  liabilities: number;
  annualDiff?: number;
}

export type AnomalyRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AnomalyResult {
  indicatorType: 'PROCUREMENT_DEVIATION' | 'LHKPN_ASSET_SPIKE';
  riskLevel: AnomalyRiskLevel;
  score: number;
  formulaExplanation: string;
  thresholdTriggered: string;
  disclaimer: string;
}

const STRICT_LEXICON = /\b(koruptor|korupsi|penipu|tersangka|pelaku|kejahatan)\b/gi;

export function isProhibitedAnomalyLanguage(text: string): boolean {
  return STRICT_LEXICON.test(text);
}

export function sanitizeAnomalyLanguage(text: string): string {
  return text.replace(STRICT_LEXICON, 'indikasi yang memerlukan klarifikasi');
}

export function detectProcurementAnomalies(
  records: ProcurementRecord[],
  threshold = 0.2
): ProcurementRecord[] {
  return records.filter((record) => {
    if (!Number.isFinite(record.hps) || record.hps <= 0) return false;
    const deviation = (record.contractValue - record.hps) / record.hps;
    return Number.isFinite(deviation) && deviation >= threshold;
  });
}

export function analyzeProcurementAnomalies(
  records: ProcurementRecord[],
  threshold = 0.2
): AnomalyResult[] {
  return records.flatMap((record) => {
    if (!Number.isFinite(record.hps) || record.hps <= 0) return [];
    const deviation = (record.contractValue - record.hps) / record.hps;
    if (!Number.isFinite(deviation) || deviation < threshold) return [];

    const score = Math.round(Math.min(100, deviation * 100) * 100) / 100;
    const riskLevel: AnomalyRiskLevel = deviation >= 0.5 ? 'HIGH' : deviation >= 0.35 ? 'MEDIUM' : 'LOW';
    return [{
      indicatorType: 'PROCUREMENT_DEVIATION' as const,
      riskLevel,
      score,
      formulaExplanation: 'Deviasi kontrak = (Nilai Kontrak - HPS) / HPS × 100%. Tidak membandingkan kualitas atau sebab administratif.',
      thresholdTriggered: `deviasi >= ${threshold * 100}%`,
      disclaimer: 'Catatan: Penandaan ini dihasilkan secara otomatis oleh algoritma statistik berdasarkan perbandingan data publik resmi. Indikator ini bukan merupakan vonis hukum, tuduhan pidana, maupun bukti pelanggaran.',
    }];
  });
}

export function detectLHKPNAnomalies(records: LHKPNRecord[]): LHKPNRecord[] {
  return records.filter((record) => record.assets < record.liabilities);
}

export function analyzeLHKPNAnomalies(records: LHKPNRecord[], jumpThresholdPct = 50): AnomalyResult[] {
  return records.flatMap((record) => {
    const pct = record.annualDiff !== undefined && record.assets > 0
      ? (record.annualDiff / record.assets) * 100
      : 0;
    if (pct < jumpThresholdPct) return [];
    const riskLevel: AnomalyRiskLevel = pct >= 100 ? 'HIGH' : pct >= 50 ? 'MEDIUM' : 'LOW';
    return [{
      indicatorType: 'LHKPN_ASSET_SPIKE' as const,
      riskLevel,
      score: Math.round(Math.min(100, pct) * 100) / 100,
      formulaExplanation: 'Lonjakan tahunan = (Selisih aset tahunan / aset tahun berjalan) × 100%. Hanya sinyal deviasi dan memerlukan sumber klarifikasi.',
      thresholdTriggered: `lonjakan aset tahunan >= ${jumpThresholdPct}%`,
      disclaimer: 'Catatan: Penandaan ini dihasilkan secara otomatis oleh algoritma statistik berdasarkan perbandingan data publik resmi. Indikator ini bukan merupakan vonis hukum, tuduhan pidana, maupun bukti pelanggaran.',
    }];
  });
}

export function detectAnomalies(params: {
  procurements?: ProcurementRecord[];
  lhkpns?: LHKPNRecord[];
}): Record<string, unknown[]> {
  return {
    procurement: params.procurements ? analyzeProcurementAnomalies(params.procurements) : [],
    lhkpn: params.lhkpns ? analyzeLHKPNAnomalies(params.lhkpns) : [],
  };
}
