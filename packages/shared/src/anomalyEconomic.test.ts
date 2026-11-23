import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeProcurementAnomalies,
  analyzeLHKPNAnomalies,
  isProhibitedAnomalyLanguage,
  sanitizeAnomalyLanguage,
} from './anomalyDetector.js';
import {
  calculateEconomicResilience,
  evaluatePlaybookRules,
  mapMacroEventToIndicators,
} from './economicIntelligenceEngine.js';

test('procurement deviation uses neutral risk scoring', () => {
  const result = analyzeProcurementAnomalies([{ hps: 100, contractValue: 160 }], 0.2);
  assert.equal(result.length, 1);
  assert.equal(result[0].riskLevel, 'HIGH');
  assert.equal(result[0].score, 60);
  assert.match(result[0].disclaimer, /bukan merupakan vonis hukum/i);
});

test('strict lexicon blocks accusation language', () => {
  assert.equal(isProhibitedAnomalyLanguage('Indikasi korupsi pada data'), true);
  assert.doesNotMatch(sanitizeAnomalyLanguage('Indikasi korupsi'), /korupsi/i);
});

test('lhkpn jump threshold produces explainable result', () => {
  const result = analyzeLHKPNAnomalies([{ year: 2024, assets: 100, liabilities: 20, annualDiff: 60 }], 50);
  assert.equal(result.length, 1);
  assert.equal(result[0].riskLevel, 'MEDIUM');
});

test('economic resilience produces 0-100 score and status', () => {
  const result = calculateEconomicResilience([
    { indicatorCode: 'USD_IDR', value: 15800 },
    { indicatorCode: 'INFLATION_YOY', value: 2.5 },
    { indicatorCode: 'IKK_PURCHASING_POWER', value: 120 },
    { indicatorCode: 'FOOD_INDEX', value: 115 },
  ], '2026-11-24');
  assert.ok(result.compositeScore >= 0 && result.compositeScore <= 100);
  assert.equal(result.status, 'STABIL');
  assert.match(result.weightsAndFormula.formula, /Skor/i);
});

test('economic playbook activates at configured threshold', () => {
  const result = evaluatePlaybookRules(
    [{ indicatorCode: 'USD_IDR', value: 16300 }],
    [{ scenarioCode: 'RUPIAH_WEAKENING', indicatorCode: 'USD_IDR', operator: '>', threshold: 16200 }]
  );
  assert.equal(result[0].activated, true);
});

test('macro event maps to economic indicators', () => {
  const result = mapMacroEventToIndicators({
    eventTitle: 'Ketegangan rantai pasok energi',
    category: 'GEOPOLITIK',
    text: 'Suku bunga bank sentral naik dan kurs rupiah melemah',
  });
  assert.deepEqual(result.relatedIndicatorCodes.sort(), ['BI_RATE', 'USD_IDR'].sort());
});
