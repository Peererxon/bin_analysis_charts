// ─── Schema exports (explicit, so no relative path is needed) ────────
export {
  banks,
  banksRelations,
  snapshots,
  snapshotsRelations,
  offers,
  offersRelations,
  appConfig,
  alertRules,
} from './schema.js';

export type {
  Bank,
  NewBank,
  Snapshot,
  NewSnapshot,
  Offer,
  NewOffer,
  AppConfig,
  NewAppConfig,
  AlertRule,
  NewAlertRule,
} from './schema.js';

// ─── Client exports ─────────────────────────────────────────────────
export { createDb, type Database } from './client.js';

// Re-export common drizzle-orm utilities so consumers resolve them from
// the same ESM entry point, avoiding dual-package type conflicts.
export { eq, and, or, gte, lte, gt, lt, desc, asc, sql, relations, inArray } from 'drizzle-orm';
