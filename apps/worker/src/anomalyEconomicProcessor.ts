import { db, economicIndicators, economicScores, procurements, publicOfficials, anomalyFlags, citizenSolutionPlaybooks } from 'pantau-db';
import { and, desc, eq } from 'drizzle-orm';
import {
  analyzeLHKPNAnomalies,
  analyzeProcurementAnomalies,
  calculateEconomicResilience,
  evaluatePlaybookRules,
  type EconomicIndicatorSnapshot,
  type PlaybookRule,
} from 'pantau-shared';

async function anomalyAlreadyOpen(entityType: string, entityId: number, indicatorType: string): Promise<boolean> {
  const existing = await db.select({ id: anomalyFlags.id }).from(anomalyFlags).where(and(
    eq(anomalyFlags.entityType, entityType),
    eq(anomalyFlags.entityId, entityId),
    eq(anomalyFlags.indicatorType, indicatorType),
    eq(anomalyFlags.status, 'OPEN')
  )).limit(1);
  return existing.length > 0;
}

export async function processEconomicAnalysis(): Promise<{ score: number; status: string; activePlaybooks: string[] }> {
  const rows = await db
    .select({ indicatorCode: economicIndicators.indicatorCode, value: economicIndicators.value, periodDate: economicIndicators.periodDate })
    .from(economicIndicators)
    .orderBy(desc(economicIndicators.periodDate));

  const latest = new Map<string, EconomicIndicatorSnapshot>();
  for (const row of rows) {
    if (!latest.has(row.indicatorCode)) {
      latest.set(row.indicatorCode, { indicatorCode: row.indicatorCode as EconomicIndicatorSnapshot['indicatorCode'], value: Number(row.value), periodDate: row.periodDate });
    }
  }

  const evaluationDate = new Date().toISOString().slice(0, 10);
  const result = calculateEconomicResilience([...latest.values()], evaluationDate);

  await db.insert(economicScores).values({
    evaluationDate,
    compositeScore: result.compositeScore.toFixed(2),
    status: result.status,
    weightsAndFormula: result.weightsAndFormula,
    driversSummary: result.driversSummary,
  }).onDuplicateKeyUpdate({
    set: { compositeScore: result.compositeScore.toFixed(2), status: result.status, weightsAndFormula: result.weightsAndFormula, driversSummary: result.driversSummary },
  });

  const rules: PlaybookRule[] = [
    { scenarioCode: 'RUPIAH_WEAKENING', indicatorCode: 'USD_IDR', operator: '>', threshold: 16200 },
    { scenarioCode: 'PURCHASING_POWER_DROP', indicatorCode: 'IKK_PURCHASING_POWER', operator: '<', threshold: 115 },
    { scenarioCode: 'HIGH_INTEREST_RATE', indicatorCode: 'BI_RATE', operator: '>=', threshold: 6.25 },
    { scenarioCode: 'FOOD_INFLATION', indicatorCode: 'FOOD_INDEX', operator: '>', threshold: 120 },
  ];
  const evaluations = evaluatePlaybookRules([...latest.values()], rules);
  const activePlaybooks = evaluations.filter((item) => item.activated).map((item) => item.scenarioCode);

  for (const evaluation of evaluations) {
    await db.update(citizenSolutionPlaybooks)
      .set({ isActive: evaluation.activated ? 'YES' : 'NO' })
      .where(eq(citizenSolutionPlaybooks.scenarioCode, evaluation.scenarioCode));
  }

  return { score: result.compositeScore, status: result.status, activePlaybooks };
}

export async function processAnomalyAnalysis(): Promise<number> {
  const procurementRows = await db
    .select({ id: procurements.id, institutionId: procurements.institutionId, hpsValue: procurements.hpsValue, contractValue: procurements.contractValue })
    .from(procurements);

  let inserted = 0;
  for (const row of procurementRows) {
    const results = analyzeProcurementAnomalies([{ hps: Number(row.hpsValue), contractValue: Number(row.contractValue) }], 0.2);
    for (const result of results) {
      if (await anomalyAlreadyOpen('PROCUREMENT', row.id, result.indicatorType)) continue;
      await db.insert(anomalyFlags).values({
        institutionId: row.institutionId,
        entityType: 'PROCUREMENT',
        entityId: row.id,
        indicatorType: result.indicatorType,
        riskLevel: result.riskLevel,
        score: result.score.toFixed(2),
        formulaExplanation: result.formulaExplanation,
        thresholdTriggered: result.thresholdTriggered,
        status: 'OPEN',
      });
      inserted += 1;
    }
  }

  const officials = await db.select({ id: publicOfficials.id, institutionId: publicOfficials.institutionId, lhkpnReports: publicOfficials.lhkpnReports }).from(publicOfficials);
  for (const official of officials) {
    for (const report of official.lhkpnReports ?? []) {
      const results = analyzeLHKPNAnomalies([{
        year: report.year,
        assets: report.totalAssets,
        liabilities: 0,
        annualDiff: report.annualDiff,
      }], 50);
      for (const result of results) {
        if (await anomalyAlreadyOpen('PUBLIC_OFFICIAL', official.id, result.indicatorType)) continue;
        await db.insert(anomalyFlags).values({
          institutionId: official.institutionId,
          entityType: 'PUBLIC_OFFICIAL',
          entityId: official.id,
          indicatorType: result.indicatorType,
          riskLevel: result.riskLevel,
          score: result.score.toFixed(2),
          formulaExplanation: result.formulaExplanation,
          thresholdTriggered: result.thresholdTriggered,
          status: 'OPEN',
        });
        inserted += 1;
      }
    }
  }

  return inserted;
}
