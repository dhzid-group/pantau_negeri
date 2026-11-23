import {
  mysqlTable,
  bigint,
  varchar,
  json,
  decimal,
  timestamp,
  mysqlEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/mysql-core';

// 1. institutions
export const institutions = mysqlTable(
  'institutions',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
    code: varchar('code', { length: 50 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    shortName: varchar('short_name', { length: 50 }),
    category: mysqlEnum('category', [
      'EKSEKUTIF',
      'LEGISLATIF',
      'YUDIKATIF',
      'INDEPENDEN',
      'BUMN',
    ]).notNull(),
    officialWebsite: varchar('official_website', { length: 255 }).notNull(),
    openDataPortalUrl: varchar('open_data_portal_url', { length: 255 }),
    dataTransparencyScore: decimal('data_transparency_score', { precision: 5, scale: 2 }).default('0.00'),
    lastSyncStatus: mysqlEnum('last_sync_status', ['PENDING', 'SUCCESS', 'FAILED', 'PARTIAL']).default('PENDING'),
    lastSyncedAt: timestamp('last_synced_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    idxInstCategory: index('idx_inst_category').on(table.category),
    idxInstSyncStatus: index('idx_inst_sync_status').on(table.lastSyncStatus),
  })
);

// 2. canonical_entities
export const canonicalEntities = mysqlTable(
  'canonical_entities',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
    normalizedName: varchar('normalized_name', { length: 255 }).notNull(),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    type: mysqlEnum('type', ['PERSON', 'VENDOR', 'INSTITUTION']).notNull(),
    aliases: json('aliases').$type<string[]>().default([]),
    npwpMasked: varchar('npwp_masked', { length: 30 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    idxCanonNormType: uniqueIndex('idx_canon_norm_type').on(table.normalizedName, table.type),
    idxCanonType: index('idx_canon_type').on(table.type),
  })
);

// 3. public_officials
export const publicOfficials = mysqlTable(
  'public_officials',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
    canonicalEntityId: bigint('canonical_entity_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => canonicalEntities.id, { onDelete: 'cascade' }),
    institutionId: bigint('institution_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => institutions.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    position: varchar('position', { length: 255 }).notNull(),
    activePeriodStart: varchar('active_period_start', { length: 10 }),
    activePeriodEnd: varchar('active_period_end', { length: 10 }),
    lhkpnReports: json('lhkpn_reports').$type<
      Array<{ year: number; totalAssets: number; annualDiff: number; annualDiffPct: number; sourceUrl?: string }>
    >().default([]),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    idxPoCanonical: index('idx_po_canonical').on(table.canonicalEntityId),
    idxPoInstitution: index('idx_po_institution').on(table.institutionId),
  })
);

