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
import { institutions } from './institutions.js';

// 13a. user_watchlists
export const userWatchlists = mysqlTable(
  'user_watchlists',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
    userId: varchar('user_id', { length: 100 }).notNull(),
    watchlistName: varchar('watchlist_name', { length: 150 }).notNull(),
    institutionId: bigint('institution_id', { mode: 'number', unsigned: true })
      .references(() => institutions.id, { onDelete: 'cascade' }),
    keyword: varchar('keyword', { length: 100 }),
    minProcurementValue: decimal('min_procurement_value', { precision: 18, scale: 2 }),
    minRiskLevel: mysqlEnum('min_risk_level', ['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM').notNull(),
    economicScenarioCode: varchar('economic_scenario_code', { length: 50 }),
    notificationChannel: mysqlEnum('notification_channel', ['EMAIL', 'WEBHOOK', 'RSS']).notNull(),
    targetDestination: varchar('target_destination', { length: 255 }).notNull(),
    isActive: mysqlEnum('is_active', ['YES', 'NO']).default('YES').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    idxWatchUser: index('idx_watch_user').on(table.userId),
    idxWatchActiveChan: index('idx_watch_active_chan').on(table.isActive, table.notificationChannel),
  })
);

// 13b. alert_notifications
export const alertNotifications = mysqlTable(
  'alert_notifications',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
    watchlistId: bigint('watchlist_id', { mode: 'number', unsigned: true })
      .notNull()
      .references(() => userWatchlists.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 255 }).notNull(),
    messageBody: text('message_body').notNull(),
    legalDisclaimer: text('legal_disclaimer').notNull(),
    channelUsed: mysqlEnum('channel_used', ['EMAIL', 'WEBHOOK', 'RSS']).notNull(),
    deliveryStatus: mysqlEnum('delivery_status', ['PENDING', 'SENT', 'FAILED']).default('PENDING').notNull(),
    errorMessage: text('error_message'),
    sentAt: timestamp('sent_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    idxAlertWatchlist: index('idx_alert_watchlist').on(table.watchlistId),
    idxAlertDelivery: index('idx_alert_delivery').on(table.deliveryStatus),
  })
);

// 14. ingestion_logs
export const ingestionLogs = mysqlTable(
  'ingestion_logs',
  {
    id: bigint('id', { mode: 'number', unsigned: true }).primaryKey().autoincrement(),
    institutionId: bigint('institution_id', { mode: 'number', unsigned: true })
      .references(() => institutions.id, { onDelete: 'set null' }),
    sourceEndpoint: varchar('source_endpoint', { length: 255 }).notNull(),
    status: mysqlEnum('status', ['SUCCESS', 'FAILED', 'RATE_LIMITED']).notNull(),
    newRecordsCount: int('new_records_count').default(0).notNull(),
    rawPayloadHash: varchar('raw_payload_hash', { length: 64 }),
    errorMessage: text('error_message'),
    durationMs: int('duration_ms'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    idxIngestInstDate: index('idx_ingest_inst_date').on(table.institutionId, table.createdAt),
    idxIngestStatus: index('idx_ingest_status').on(table.status),
  })
);