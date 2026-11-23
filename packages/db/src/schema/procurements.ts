import {
  mysqlTable,
  bigint,
  varchar,
  text,
  longtext,
  decimal,
  int,
  timestamp,
  mysqlEnum,
  index,
} from 'drizzle-orm/mysql-core';
import { institutions, canonicalEntities } from './institutions.js';

// 4. procurements
export const procurements = mysqlTable(
  'procurements',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
    institutionId: bigint('institution_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => institutions.id, { onDelete: 'cascade' }),
    vendorEntityId: bigint('vendor_entity_id', { mode: 'number', unsigned: true })
      .references(() => canonicalEntities.id, { onDelete: 'set null' }),
    tenderCode: varchar('tender_code', { length: 100 }),
    packageName: varchar('package_name', { length: 500 }).notNull(),
    procurementMethod: varchar('procurement_method', { length: 100 }),
    hpsValue: decimal('hps_value', { precision: 18, scale: 2 }).notNull(),
    contractValue: decimal('contract_value', { precision: 18, scale: 2 }).notNull(),
    rawWinnerName: varchar('raw_winner_name', { length: 255 }),
    announcedDate: varchar('announced_date', { length: 10 }),
    contractDate: varchar('contract_date', { length: 10 }),
    fiscalYear: int('fiscal_year').notNull(),
    sourceUrl: text('source_url').notNull(),
    rawPayloadHash: varchar('raw_payload_hash', { length: 64 }).notNull(),
    fetchedAt: timestamp('fetched_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    idxProcInstYear: index('idx_proc_inst_year').on(table.institutionId, table.fiscalYear),
    idxProcVendor: index('idx_proc_vendor').on(table.vendorEntityId),
    idxProcHash: index('idx_proc_hash').on(table.rawPayloadHash),
  })
);

// 5. regulations_and_documents
export const regulationsAndDocuments = mysqlTable(
  'regulations_and_documents',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
    institutionId: bigint('institution_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => institutions.id, { onDelete: 'cascade' }),
    docType: mysqlEnum('doc_type', [
      'REGULASI',
      'PUTUSAN',
      'LAPORAN_BPK',
      'LAKIP',
      'KEBIJAKAN_FISKAL',
    ]).notNull(),
    docNumber: varchar('doc_number', { length: 100 }).notNull(),
    title: text('title').notNull(),
    publishedDate: varchar('published_date', { length: 10 }),
    extractedText: longtext('extracted_text'),
    extractionMethod: mysqlEnum('extraction_method', ['NATIVE_PDF', 'OCR', 'HTML', 'API']).notNull(),
    fileSizeKb: int('file_size_kb'),
    sourceUrl: text('source_url').notNull(),
    rawPayloadHash: varchar('raw_payload_hash', { length: 64 }).notNull(),
    fetchedAt: timestamp('fetched_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    idxRegInstDoctype: index('idx_reg_inst_doctype').on(table.institutionId, table.docType),
    idxRegHash: index('idx_reg_hash').on(table.rawPayloadHash),
  })
);
