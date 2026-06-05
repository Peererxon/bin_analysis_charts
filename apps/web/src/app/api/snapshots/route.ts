import { NextRequest } from 'next/server';
import { sql, eq, and, gte, lte, desc, snapshots, offers, banks } from '@bin-analysis/db';
import { getDb, parseDate, errorResponse } from '../_lib/db';

/**
 * GET /api/snapshots
 *
 * Time series data with interval aggregation.
 * Query params:
 *   - interval: '10m' | '30m' | '1h' | '4h' (default: '1h')
 *   - bankId: optional number
 *   - from: ISO date string (required)
 *   - to: ISO date string (required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const interval = searchParams.get('interval') ?? '1h';
    const bankId = searchParams.get('bankId');
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');

    if (!fromStr || !toStr) {
      return errorResponse('from and to query params are required');
    }

    const from = parseDate(fromStr);
    const to = parseDate(toStr);

    // Map interval to PostgreSQL interval string
    const intervalMap: Record<string, string> = {
      '10m': '10 minutes',
      '30m': '30 minutes',
      '1h': '1 hour',
      '4h': '4 hours',
    };

    const pgInterval = intervalMap[interval];
    if (!pgInterval) {
      return errorResponse('Invalid interval. Use: 10m, 30m, 1h, 4h');
    }

    const db = getDb();

    // Build conditions
    const conditions = [
      gte(snapshots.capturedAt, from),
      lte(snapshots.capturedAt, to),
    ];
    if (bankId) {
      conditions.push(eq(snapshots.bankId, parseInt(bankId, 10)));
    }

    // Query snapshots with offers joined, then aggregate in application code
    const rows = await db
      .select({
        snapshotId: snapshots.id,
        bankId: snapshots.bankId,
        capturedAt: snapshots.capturedAt,
        bankName: banks.name,
        offerRank: offers.rank,
        offerPrice: offers.price,
        merchantName: offers.merchantName,
      })
      .from(snapshots)
      .innerJoin(banks, eq(snapshots.bankId, banks.id))
      .innerJoin(offers, eq(snapshots.id, offers.snapshotId))
      .where(and(...conditions))
      .orderBy(snapshots.capturedAt);

    // Group by snapshot
    const snapshotMap = new Map<
      number,
      {
        snapshotId: number;
        bankId: number;
        capturedAt: Date;
        bankName: string;
        offers: { rank: number; price: number; merchantName: string | null }[];
      }
    >();

    for (const row of rows) {
      if (!snapshotMap.has(row.snapshotId)) {
        snapshotMap.set(row.snapshotId, {
          snapshotId: row.snapshotId,
          bankId: row.bankId,
          capturedAt: row.capturedAt,
          bankName: row.bankName,
          offers: [],
        });
      }
      snapshotMap.get(row.snapshotId)!.offers.push({
        rank: row.offerRank,
        price: row.offerPrice,
        merchantName: row.merchantName,
      });
    }

    // Aggregate by time bucket
    const bucketMs = parseBucketMs(interval);
    const bucketMap = new Map<
      string,
      {
        timestamp: string;
        prices: number[];
        merchantName: string | null;
        bankName: string;
        topFivePrices: number[];
      }
    >();

    for (const snap of snapshotMap.values()) {
      const bucketKey = getBucketKey(snap.capturedAt, bucketMs, snap.bankId);
      if (!bucketMap.has(bucketKey)) {
        const bucketTime = new Date(
          Math.floor(snap.capturedAt.getTime() / bucketMs) * bucketMs,
        );
        bucketMap.set(bucketKey, {
          timestamp: bucketTime.toISOString(),
          prices: [],
          merchantName: snap.offers[0]?.merchantName ?? null,
          bankName: snap.bankName,
          topFivePrices: [],
        });
      }

      const bucket = bucketMap.get(bucketKey)!;
      const sortedOfferPrices = snap.offers
        .sort((a, b) => b.price - a.price)
        .map((o) => o.price);
      bucket.prices.push(...sortedOfferPrices);
      if (bucket.topFivePrices.length === 0) {
        bucket.topFivePrices = sortedOfferPrices.slice(0, 5);
      }
    }

    // Format results
    const results = Array.from(bucketMap.values()).map((bucket) => {
      const avgPrice =
        bucket.prices.length > 0
          ? bucket.prices.reduce((s, p) => s + p, 0) / bucket.prices.length
          : 0;
      const stdDeviation = calculateStdDev(bucket.prices);

      return {
        timestamp: bucket.timestamp,
        price: Number(avgPrice.toFixed(2)),
        merchantName: bucket.merchantName,
        bankName: bucket.bankName,
        stdDeviation: Number(stdDeviation.toFixed(4)),
        topFivePrices: bucket.topFivePrices,
      };
    });

    return Response.json({ data: results });
  } catch (error) {
    console.error('GET /api/snapshots error:', error);
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

function getBucketKey(date: Date, bucketMs: number, bankId: number): string {
  const bucket = Math.floor(date.getTime() / bucketMs) * bucketMs;
  return `${bucket}-${bankId}`;
}

function calculateStdDev(prices: number[]): number {
  if (prices.length < 2) return 0;
  const mean = prices.reduce((s, p) => s + p, 0) / prices.length;
  const squaredDiffs = prices.map((p) => Math.pow(p - mean, 2));
  const variance = squaredDiffs.reduce((s, d) => s + d, 0) / prices.length;
  return Math.sqrt(variance);
}
