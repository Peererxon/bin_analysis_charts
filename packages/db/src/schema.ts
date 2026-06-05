import {
  pgTable,
  serial,
  integer,
  real,
  varchar,
  text,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ─── Banks ──────────────────────────────────────────────────────────
export const banks = pgTable('banks', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  binancePayType: varchar('binance_pay_type', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const banksRelations = relations(banks, ({ many }) => ({
  snapshots: many(snapshots),
}));

// ─── Snapshots ──────────────────────────────────────────────────────
export const snapshots = pgTable('snapshots', {
  id: serial('id').primaryKey(),
  bankId: integer('bank_id')
    .references(() => banks.id, { onDelete: 'cascade' })
    .notNull(),
  capturedAt: timestamp('captured_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const snapshotsRelations = relations(snapshots, ({ one, many }) => ({
  bank: one(banks, {
    fields: [snapshots.bankId],
    references: [banks.id],
  }),
  offers: many(offers),
}));

// ─── Offers (Top 5 per snapshot) ────────────────────────────────────
export const offers = pgTable('offers', {
  id: serial('id').primaryKey(),
  snapshotId: integer('snapshot_id')
    .references(() => snapshots.id, { onDelete: 'cascade' })
    .notNull(),
  rank: integer('rank').notNull(), // 1–5
  price: real('price').notNull(),
  merchantName: varchar('merchant_name', { length: 150 }),
  availableAmount: real('available_amount'),
  maxSingleTrans: real('max_single_trans'),
  minSingleTrans: real('min_single_trans'),
});

export const offersRelations = relations(offers, ({ one }) => ({
  snapshot: one(snapshots, {
    fields: [offers.snapshotId],
    references: [snapshots.id],
  }),
}));

// ─── App Configuration (Admin) ──────────────────────────────────────
export const appConfig = pgTable('app_config', {
  key: varchar('key', { length: 100 }).primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Alert Rules (Telegram) ─────────────────────────────────────────
export const alertRules = pgTable('alert_rules', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 10 }).notNull(), // 'up' | 'down'
  thresholdPct: real('threshold_pct').notNull(),
  telegramChatId: varchar('telegram_chat_id', { length: 50 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  notifyCronStatus: boolean('notify_cron_status').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Type Inference Helpers ─────────────────────────────────────────
export type Bank = typeof banks.$inferSelect;
export type NewBank = typeof banks.$inferInsert;

export type Snapshot = typeof snapshots.$inferSelect;
export type NewSnapshot = typeof snapshots.$inferInsert;

export type Offer = typeof offers.$inferSelect;
export type NewOffer = typeof offers.$inferInsert;

export type AppConfig = typeof appConfig.$inferSelect;
export type NewAppConfig = typeof appConfig.$inferInsert;

export type AlertRule = typeof alertRules.$inferSelect;
export type NewAlertRule = typeof alertRules.$inferInsert;
