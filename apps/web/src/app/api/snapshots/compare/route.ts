import { NextRequest } from 'next/server';
import { eq, and, gte, lte, desc, snapshots, offers, banks } from '@bin-analysis/db';
import { getDb, parseDate, errorResponse } from '../../_lib/db';

/**
 * GET /api/snapshots/compare
 *
 * Compare two date ranges side by side.
 * Query params:
 *   - range1Start: ISO date (required)
 *   - range1End: ISO date (required)
 *   - range2Start: ISO date (required)
 *   - range2End: ISO date (required)
 *   - bankId: optional number
 *   - interval: '10m' | '30m' | '1h' | '4h' (default: '1h')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const range1Start = searchParams.get('range1Start');
    const range1End = searchParams.get('range1End');
    const range2Start = searchParams.get('range2Start');
    const range2End = searchParams.get('range2End');
    const bankId = searchParams.get('bankId');
    const interval = searchParams.get('interval') ?? '1h';

    if (!range1Start || !range1End || !range2Start || !range2End) {
      return errorResponse(
        'range1Start, range1End, range2Start, range2End are required',
      );
    }

    const db = getDb();

    const fetchRange = async (fromStr: string, toStr: string) => {
      const from = parseDate(fromStr);
      const to = parseDate(toStr);

      const conditions = [
        gte(snapshots.capturedAt, from),
        lte(snapshots.capturedAt, to),
      ];
      if (bankId) {
        conditions.push(eq(snapshots.bankId, parseInt(bankId, 10)));
      }

      const rows = await db
        .select({
          snapshotId: snapshots.id,
          bankId: snapshots.bankId,
          capturedAt: snapshots.capturedAt,
          bankName: banks.name,
          offerPrice: offers.price,
          merchantName: offers.merchantName,
          offerRank: offers.rank,
        })
        .from(snapshots)
        .innerJoin(banks, eq(snapshots.bankId, banks.id))
        .innerJoin(offers, eq(snapshots.id, offers.snapshotId))
        .where(and(...conditions))
        .orderBy(snapshots.capturedAt);

      // Group by snapshot and aggregate
      const snapshotMap = new Map<
        number,
        {
          capturedAt: Date;
          bankName: string;
          prices: number[];
          merchantName: string | null;
        }
      >();

      for (const row of rows) {
        if (!snapshotMap.has(row.snapshotId)) {
          snapshotMap.set(row.snapshotId, {
            capturedAt: row.capturedAt,
            bankName: row.bankName,
            prices: [],
            merchantName: row.merchantName,
          });
        }
        snapshotMap.get(row.snapshotId)!.prices.push(row.offerPrice);
      }

      // Aggregate by interval buckets
      const bucketMs = parseBucketMs(interval);
      const bucketMap = new Map<string, { prices: number[]; timestamp: string; bankName: string }>();

      for (const snap of snapshotMap.values()) {
        const bucketTime = new Date(
          Math.floor(snap.capturedAt.getTime() / bucketMs) * bucketMs,
        );
        const key = `${bucketTime.getTime()}-${snap.bankName}`;

        if (!bucketMap.has(key)) {
          bucketMap.set(key, {
            timestamp: bucketTime.toISOString(),
            bankName: snap.bankName,
            prices: [],
          });
        }
        bucketMap.get(key)!.prices.push(...snap.prices);
      }

      return Array.from(bucketMap.values()).map((bucket) => {
        const avgPrice =
          bucket.prices.length > 0
            ? bucket.prices.reduce((s, p) => s + p, 0) / bucket.prices.length
            : 0;
        const stdDeviation = calculateStdDev(bucket.prices);

        return {
          timestamp: bucket.timestamp,
          price: Number(avgPrice.toFixed(2)),
          bankName: bucket.bankName,
          stdDeviation: Number(stdDeviation.toFixed(4)),
          topFivePrices: bucket.prices
            .sort((a, b) => b - a)
            .slice(0, 5),
        };
      });
    };

    const [range1, range2] = await Promise.all([
      fetchRange(range1Start, range1End),
      fetchRange(range2Start, range2End),
    ]);

    return Response.json({ data: { range1, range2 } });
  } catch (error) {
    console.error('GET /api/snapshots/compare error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
    );
  }
}

function parseBucketMs(interval: string): number {
  const map: Record<string, number> = {
    '10m': 10 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
  };
  return map[interval] ?? 60 * 60 * 1000;
}

function calculateStdDev(prices: number[]): number {
  if (prices.length < 2) return 0;
  const mean = prices.reduce((s, p) => s + p, 0) / prices.length;
  const squaredDiffs = prices.map((p) => Math.pow(p - mean, 2));
  const variance = squaredDiffs.reduce((s, d) => s + d, 0) / prices.length;
  return Math.sqrt(variance);
}
