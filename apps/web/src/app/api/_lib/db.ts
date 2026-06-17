import { createDb, formatCaracas } from '@bin-analysis/db';

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
 * Convert a date to America/Caracas timezone string.
 * Delegates to the shared `formatCaracas()` utility.
 */
export function toCaracasTime(date: Date): string {
  return formatCaracas(date, 'long');
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
