import {
  mysqlTable,
  bigint,
  varchar,
  text,
  json,
  decimal,
  timestamp,
  mysqlEnum,
  index,
} from 'drizzle-orm/mysql-core';
import { regulationsAndDocuments } from './procurements.js';

// 9. economic_indicators
export const economicIndicators = mysqlTable(
  'economic_indicators',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
    indicatorCode: varchar('indicator_code', { length: 50 }).notNull(),
    indicatorName: varchar('indicator_name', { length: 150 }).notNull(),
    value: decimal('value', { precision: 14, scale: 4 }).notNull(),
    unit: varchar('unit', { length: 30 }).notNull(),
    periodDate: varchar('period_date', { length: 10 }).notNull(),
    source: mysqlEnum('source', ['BPS', 'BI', 'KEMENKEU', 'PIHPS', 'WORLD_BANK', 'IMF']).notNull(),
    sourceUrl: text('source_url').notNull(),
    rawPayloadHash: varchar('raw_payload_hash', { length: 64 }).notNull(),
    fetchedAt: timestamp('fetched_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    idxEcoCodeDate: index('idx_eco_code_date').on(table.indicatorCode, table.periodDate),
    idxEcoSource: index('idx_eco_source').on(table.source),
  })
);

// 10. economic_scores
export const economicScores = mysqlTable(
  'economic_scores',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
    evaluationDate: varchar('evaluation_date', { length: 10 }).notNull().unique(),
    compositeScore: decimal('composite_score', { precision: 5, scale: 2 }).notNull(),
    status: mysqlEnum('status', ['STABIL', 'WASPADA', 'TEKANAN_TINGGI']).notNull(),
    weightsAndFormula: json('weights_and_formula').$type<{
      components: Array<{
        indicatorCode: string;
        weight: number;
        subScore: number;
        actualValue: number;
        threshold: number;
      }>;
      formula: string;
    }>().notNull(),
    driversSummary: text('drivers_summary').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    idxEcoScoreDate: index('idx_eco_score_date').on(table.evaluationDate),
    idxEcoScoreStatus: index('idx_eco_score_status').on(table.status),
  })
);

// 11. macro_events_and_news
export const macroEventsAndNews = mysqlTable(
  'macro_events_and_news',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
    category: mysqlEnum('category', ['GEOPOLITIK', 'BERITA_EKONOMI', 'KEBIJAKAN_DOMESTIK']).notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    objectiveSummary: text('objective_summary').notNull(),
    impactLevel: mysqlEnum('impact_level', ['LOW', 'MEDIUM', 'HIGH']).notNull(),
    relatedIndicatorCodes: json('related_indicator_codes').$type<string[]>().default([]),
    relatedRegulationId: bigint('related_regulation_id', { mode: 'number', unsigned: true })
      .references(() => regulationsAndDocuments.id, { onDelete: 'set null' }),
    sourcePublisher: varchar('source_publisher', { length: 150 }).notNull(),
    sourceUrl: text('source_url').notNull(),
    publishedDate: varchar('published_date', { length: 10 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    idxMacroCatDate: index('idx_macro_cat_date').on(table.category, table.publishedDate),
    idxMacroImpact: index('idx_macro_impact').on(table.impactLevel),
  })
);

// 12. citizen_solution_playbooks
export const citizenSolutionPlaybooks = mysqlTable(
  'citizen_solution_playbooks',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
    scenarioCode: varchar('scenario_code', { length: 50 }).notNull().unique(),
    triggerCondition: json('trigger_condition').$type<{
      indicatorCode: string;
      operator: '>' | '<' | '>=' | '<=';
      threshold: number;
    }>().notNull(),
    solutionTitle: varchar('solution_title', { length: 255 }).notNull(),
    citizenImpactSummary: text('citizen_impact_summary').notNull(),
    actionStepsHousehold: json('action_steps_household').$type<
      Array<{ step: number; action: string; description: string }>
    >().notNull(),
    actionStepsMsme: json('action_steps_msme').$type<
      Array<{ step: number; action: string; description: string }>
    >().notNull(),
    publicSupportLinks: json('public_support_links').$type<
      Array<{ title: string; url: string; institutionName: string }>
    >().default([]),
    isActive: mysqlEnum('is_active', ['YES', 'NO']).default('NO').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    idxCspScenario: index('idx_csp_scenario').on(table.scenarioCode),
    idxCspIsActive: index('idx_csp_is_active').on(table.isActive),
  })
);
