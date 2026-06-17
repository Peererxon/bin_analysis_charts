import { NextRequest } from 'next/server';
import { eq, and, gte, lte, desc, snapshots, offers, banks, getCaracasHour, getCaracasDateString } from '@bin-analysis/db';
import { getDb, parseDate, errorResponse } from '../../_lib/db';

/**
 * GET /api/stats/top-by-day-hour
 *
 * Top 5 prices by day and hour range.
 * Query params:
 *   - from: ISO date (required)
 *   - to: ISO date (required)
 *   - hourStart: 0-23 (optional, filters by Caracas-time hour)
 *   - hourEnd: 0-23 (optional)
 *   - interval: '10m' | '30m' | '1h' | '4h' (default: '1h')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');
    const hourStart = searchParams.get('hourStart');
    const hourEnd = searchParams.get('hourEnd');
    const interval = searchParams.get('interval') ?? '1h';

    if (!fromStr || !toStr) {
      return errorResponse('from and to query params are required');
    }

    const from = parseDate(fromStr);
    const to = parseDate(toStr);

    const db = getDb();

    // Fetch all offers with snapshot data within range
    const rows = await db
      .select({
        snapshotId: snapshots.id,
        bankId: snapshots.bankId,
        bankName: banks.name,
        capturedAt: snapshots.capturedAt,
        price: offers.price,
        merchantName: offers.merchantName,
        rank: offers.rank,
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

    // Filter by hour range in Caracas timezone if specified
    let filteredRows = rows;
    if (hourStart !== null || hourEnd !== null) {
      const hStart = hourStart !== null ? parseInt(hourStart, 10) : 0;
      const hEnd = hourEnd !== null ? parseInt(hourEnd, 10) : 23;

      filteredRows = rows.filter((row) => {
        const hour = getCaracasHour(row.capturedAt);
        return hStart <= hEnd
          ? hour >= hStart && hour <= hEnd
          : hour >= hStart || hour <= hEnd; // handles overnight ranges
      });
    }

    // Sort by price desc and take top N (default 5)
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 5;
    const topOffers = filteredRows.sort((a, b) => b.price - a.price).slice(0, limit);

    const results = topOffers.map((row) => ({
      bankName: row.bankName,
      bankId: row.bankId,
      price: row.price,
      merchantName: row.merchantName,
      date: getCaracasDateString(row.capturedAt),
      hour: getCaracasHour(row.capturedAt),
    }));

    return Response.json({ data: results });
  } catch (error) {
    console.error('GET /api/stats/top-by-day-hour error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
    );
  }
}
