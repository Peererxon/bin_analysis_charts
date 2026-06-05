import { createDb } from '@bin-analysis/db';

let _db: ReturnType<typeof createDb> | null = null;

/**
 * Singleton DB instance for Next.js API routes.
 * Reuses the connection across requests in the same process.
 */
export function getDb() {
  if (!_db) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    _db = createDb(databaseUrl);
  }
  return _db;
}

/**
 * UTC-4 offset in milliseconds (America/Caracas).
 */
export const CARACAS_OFFSET_MS = -4 * 60 * 60 * 1000;

/**
 * Convert a date to America/Caracas timezone string.
 */
export function toCaracasTime(date: Date): string {
  return date.toLocaleString('es-VE', { timeZone: 'America/Caracas' });
}

/**
 * Parse a date string and return a Date object.
 * Expects ISO 8601 or yyyy-MM-dd HH:mm format.
 */
export function parseDate(dateStr: string): Date {
  const parsed = new Date(dateStr);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${dateStr}`);
  }
  return parsed;
}

/**
 * Create a JSON error response.
 */
export function errorResponse(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}
