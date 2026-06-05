import { NextRequest } from 'next/server';
import { eq, and, gte, lte, desc, sql, snapshots, offers, banks } from '@bin-analysis/db';
import { getDb, parseDate, errorResponse } from '../../_lib/db';

/**
 * GET /api/stats/top-by-bank
 *
 * Highest price per bank per day.
 * Query params:
 *   - from: ISO date (required)
 *   - to: ISO date (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');

    if (!fromStr || !toStr) {
      return errorResponse('from and to query params are required');
    }

    const from = parseDate(fromStr);
    const to = parseDate(toStr);

    const db = getDb();

    // Fetch all offers with snapshot/bank data within range
    const rows = await db
      .select({
        bankId: snapshots.bankId,
        bankName: banks.name,
        capturedAt: snapshots.capturedAt,
        price: offers.price,
        merchantName: offers.merchantName,
      })
      .from(offers)
      .innerJoin(snapshots, eq(offers.snapshotId, snapshots.id))
      .innerJoin(banks, eq(snapshots.bankId, banks.id))
      .where(
        and(
          gte(snapshots.capturedAt, from),
          lte(snapshots.capturedAt, to),
        ),
      )
      .orderBy(desc(offers.price));

    // Group by bank + day (in Caracas timezone)
    const dayBankMap = new Map<
      string,
      {
        bankId: number;
        bankName: string;
        date: string;
        topPrice: number;
        merchantName: string | null;
      }
    >();

    for (const row of rows) {
      // Convert to Caracas timezone for day grouping
      const caracasDate = new Date(
        row.capturedAt.getTime() - 4 * 60 * 60 * 1000,
      );
      const dayStr = caracasDate.toISOString().split('T')[0]!;
      const key = `${row.bankId}-${dayStr}`;

      if (!dayBankMap.has(key)) {
        dayBankMap.set(key, {
          bankId: row.bankId,
          bankName: row.bankName,
          date: dayStr,
          topPrice: row.price,
          merchantName: row.merchantName,
        });
      }
      // Since rows are ordered by price desc, first entry is top price
    }

    const results = Array.from(dayBankMap.values()).sort(
      (a, b) => a.date.localeCompare(b.date) || a.bankName.localeCompare(b.bankName),
    );

    return Response.json({ data: results });
  } catch (error) {
    console.error('GET /api/stats/top-by-bank error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
    );
  }
}
