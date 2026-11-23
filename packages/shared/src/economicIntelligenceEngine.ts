export type EconomicStatus = 'STABIL' | 'WASPADA' | 'TEKANAN_TINGGI';
export type ScenarioCode = 'RUPIAH_WEAKENING' | 'PURCHASING_POWER_DROP' | 'HIGH_INTEREST_RATE' | 'FOOD_INFLATION';

export interface EconomicIndicatorSnapshot {
  indicatorCode: 'USD_IDR' | 'INFLATION_YOY' | 'BI_RATE' | 'GDP_GROWTH' | 'IKK_PURCHASING_POWER' | 'FOOD_INDEX';
  value: number;
  periodDate?: string;
}

export interface EconomicScoreComponent {
  indicatorCode: string;
  weight: number;
  subScore: number;
  actualValue: number;
  threshold: number;
}

export interface EconomicScoreResult {
  compositeScore: number;
  status: EconomicStatus;
  weightsAndFormula: {
    components: EconomicScoreComponent[];
    formula: string;
  };
  driversSummary: string;
  disclaimer: string;
}

export interface PlaybookRule {
  scenarioCode: ScenarioCode;
  indicatorCode: EconomicIndicatorSnapshot['indicatorCode'];
  operator: '>' | '<' | '>=' | '<=';
  threshold: number;
}

export interface MacroEventCorrelation {
  eventTitle: string;
  category: 'GEOPOLITIK' | 'BERITA_EKONOMI' | 'KEBIJAKAN_DOMESTIK';
  relatedIndicatorCodes: EconomicIndicatorSnapshot['indicatorCode'][];
  relatedRegulationId?: number;
  correlationNotes: string;
}

const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export function evaluatePlaybookRules(
  indicators: EconomicIndicatorSnapshot[],
  rules: PlaybookRule[]
): Array<{ scenarioCode: ScenarioCode; activated: boolean; actualValue: number; threshold: number }> {
  return rules.map((rule) => {
    const indicator = indicators.find((item) => item.indicatorCode === rule.indicatorCode);
    const actualValue = indicator?.value ?? Number.NaN;
    let activated = false;
    if (Number.isFinite(actualValue)) {
      if (rule.operator === '>') activated = actualValue > rule.threshold;
      if (rule.operator === '<') activated = actualValue < rule.threshold;
      if (rule.operator === '>=') activated = actualValue >= rule.threshold;
      if (rule.operator === '<=') activated = actualValue <= rule.threshold;
    }
    return { scenarioCode: rule.scenarioCode, activated, actualValue, threshold: rule.threshold };
  });
}

export function mapMacroEventToIndicators(
  event: Omit<MacroEventCorrelation, 'relatedIndicatorCodes' | 'correlationNotes'> & { text: string }
): MacroEventCorrelation {
  const text = `${event.eventTitle} ${event.text}`.toLowerCase();
  const codes: EconomicIndicatorSnapshot['indicatorCode'][] = [];
  if (/rupiah|kurs|dolar|usd|valas/.test(text)) codes.push('USD_IDR');
  if (/inflasi|harga pangan|bahan pokok/.test(text)) codes.push('INFLATION_YOY', 'FOOD_INDEX');
  if (/suku bunga|bank sentral|bi rate/.test(text)) codes.push('BI_RATE');
  if (/pdb|pertumbuhan ekonomi/.test(text)) codes.push('GDP_GROWTH');
  if (/daya beli|keyakinan konsumen|ikk/.test(text)) codes.push('IKK_PURCHASING_POWER');

  return {
    eventTitle: event.eventTitle,
    category: event.category,
    relatedIndicatorCodes: [...new Set(codes)],
    relatedRegulationId: event.relatedRegulationId,
    correlationNotes: codes.length
      ? `Korelasi indikatif berdasarkan kata kunci publik terhadap: ${[...new Set(codes)].join(', ')}.`
      : 'Belum ada korelasi indikator yang dapat ditetapkan secara otomatis.',
  };
}

export function calculateEconomicResilience(indicators: EconomicIndicatorSnapshot[], evaluationDate: string): EconomicScoreResult {
  const latest = new Map(indicators.map((item) => [item.indicatorCode, item.value]));

  const currency = latest.get('USD_IDR');
  const inflation = latest.get('INFLATION_YOY');
  const purchasing = latest.get('IKK_PURCHASING_POWER');
  const food = latest.get('FOOD_INDEX');
  const biRate = latest.get('BI_RATE');

  const components: EconomicScoreComponent[] = [];
  const push = (code: EconomicIndicatorSnapshot['indicatorCode'], weight: number, stress: number, threshold: number) => {
    components.push({ indicatorCode: code, weight, subScore: Math.round(clamp(1 - stress) * 10000) / 100, actualValue: latest.get(code) ?? 0, threshold });
  };

  push('USD_IDR', 0.35, currency === undefined ? 0.5 : clamp((currency - 16200) / 1800), 16200);
  push('INFLATION_YOY', 0.25, inflation === undefined ? 0.5 : clamp(Math.abs(inflation - 2.5) / 5), 2.5);
  push('IKK_PURCHASING_POWER', 0.25, purchasing === undefined ? 0.5 : clamp((115 - purchasing) / 35), 115);
  push('FOOD_INDEX', 0.15, food === undefined ? 0.5 : clamp((food - 120) / 30), 120);

  let totalStress = 0;
  for (const component of components) {
    totalStress += component.weight * (100 - component.subScore) / 100;
  }
  if (biRate !== undefined && biRate >= 6.25) {
    totalStress = clamp(totalStress + 0.05, 0, 1);
  }

  const compositeScore = Math.round(clamp(1 - totalStress) * 10000) / 100;
  const status: EconomicStatus = compositeScore >= 75 ? 'STABIL' : compositeScore >= 50 ? 'WASPADA' : 'TEKANAN_TINGGI';

  const drivers = components
    .filter((component) => component.subScore < 70)
    .map((component) => component.indicatorCode)
    .filter((code, index, all) => all.indexOf(code) === index);
  const driversSummary = drivers.length
    ? `Faktor utama: ${drivers.join(', ')} menunjukkan tekanan terhadap ketahanan ekonomi pada ${evaluationDate}.`
    : `Tidak ada tekanan indikator dominan pada ${evaluationDate}; ketahanan dinilai stabil menurut ambang batas bawaan.`;

  return {
    compositeScore,
    status,
    weightsAndFormula: {
      components,
      formula: 'Skor = 100 × (1 - [0.35×tekananKurs + 0.25×tekananInflasi + 0.25×tekananDayaBeli + 0.15×tekananPangan])',
    },
    driversSummary,
    disclaimer: 'Catatan: Skor ekonomi dan rekomendasi solusi merupakan informasi edukasi literasi keuangan publik berbasis data makro terbuka, bukan rekomendasi investasi atau nasihat keuangan berizin (OJK).',
  };
}
