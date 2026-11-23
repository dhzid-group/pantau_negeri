import {
  mysqlTable,
  bigint,
  varchar,
  text,
  json,
  decimal,
  int,
  timestamp,
  mysqlEnum,
  index,
} from 'drizzle-orm/mysql-core';
import { institutions, canonicalEntities } from './institutions.js';

// 6. entity_relationships
export const entityRelationships = mysqlTable(
  'entity_relationships',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
    sourceEntityId: bigint('source_entity_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => canonicalEntities.id, { onDelete: 'cascade' }),
    targetEntityId: bigint('target_entity_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => canonicalEntities.id, { onDelete: 'cascade' }),
    relationType: varchar('relation_type', { length: 50 }).notNull(),
    weight: decimal('weight', { precision: 18, scale: 2 }).default('1.00').notNull(),
    referenceTable: varchar('reference_table', { length: 50 }),
    referenceId: bigint('reference_id', { mode: 'number', unsigned: true }),
    year: int('year'),
    metadata: json('metadata').$type<Record<string, unknown>>().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    idxRelSrcRel: index('idx_rel_src_rel').on(table.sourceEntityId, table.relationType),
    idxRelTgtRel: index('idx_rel_tgt_rel').on(table.targetEntityId, table.relationType),
    idxRelSrcTgt: index('idx_rel_src_tgt').on(table.sourceEntityId, table.targetEntityId),
  })
);

// 7. anomaly_flags
export const anomalyFlags = mysqlTable(
  'anomaly_flags',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
    institutionId: bigint('institution_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => institutions.id, { onDelete: 'cascade' }),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: bigint('entity_id', { mode: 'number', unsigned: true }).notNull(),
    indicatorType: varchar('indicator_type', { length: 100 }).notNull(),
    riskLevel: mysqlEnum('risk_level', ['LOW', 'MEDIUM', 'HIGH']).notNull(),
    score: decimal('score', { precision: 5, scale: 2 }).notNull(),
    formulaExplanation: text('formula_explanation').notNull(),
    thresholdTriggered: varchar('threshold_triggered', { length: 255 }).notNull(),
    status: mysqlEnum('status', ['OPEN', 'UNDER_REVIEW', 'CLARIFIED', 'RESOLVED']).default('OPEN').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    idxFlagInstStatus: index('idx_flag_inst_status').on(table.institutionId, table.status),
    idxFlagRiskStatus: index('idx_flag_risk_status').on(table.riskLevel, table.status),
    idxFlagTarget: index('idx_flag_target').on(table.entityType, table.entityId),
  })
);

// 8. official_clarifications
export const officialClarifications = mysqlTable(
  'official_clarifications',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
    anomalyFlagId: bigint('anomaly_flag_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => anomalyFlags.id, { onDelete: 'cascade' }),
    clarifierName: varchar('clarifier_name', { length: 255 }).notNull(),
    clarifierRole: varchar('clarifier_role', { length: 255 }).notNull(),
    clarificationText: text('clarification_text').notNull(),
    officialDocumentUrl: text('official_document_url'),
    isVerified: mysqlEnum('is_verified', ['PENDING', 'VERIFIED', 'REJECTED']).default('PENDING').notNull(),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    idxClarFlag: index('idx_clar_flag').on(table.anomalyFlagId),
    idxClarVerified: index('idx_clar_verified').on(table.isVerified),
  })
);
