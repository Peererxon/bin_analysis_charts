import { NextRequest } from 'next/server';
import { eq, desc, and, snapshots, offers, banks } from '@bin-analysis/db';
import { getDb, errorResponse } from '../../_lib/db';

/**
 * GET /api/snapshots/latest
 *
 * Latest snapshot across all banks or filtered by bankId.
 * Query params:
 *   - bankId: optional number
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const bankId = searchParams.get('bankId');

    const db = getDb();

    // Build conditions
    const conditions = [];
    if (bankId) {
      conditions.push(eq(snapshots.bankId, parseInt(bankId, 10)));
    }

    // Get the latest snapshot(s) — one per bank or filtered
    const latestSnapshots = await db
      .select({
        snapshotId: snapshots.id,
        bankId: snapshots.bankId,
        capturedAt: snapshots.capturedAt,
        bankName: banks.name,
      })
      .from(snapshots)
      .innerJoin(banks, eq(snapshots.bankId, banks.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(snapshots.capturedAt))
      .limit(bankId ? 1 : 20);

    if (latestSnapshots.length === 0) {
      return Response.json({ data: [] });
    }

    // Fetch offers for these snapshots
    const snapshotIds = latestSnapshots.map((s) => s.snapshotId);
    const allOffers = await db
      .select()
      .from(offers)
      .where(
        snapshotIds.length === 1
          ? eq(offers.snapshotId, snapshotIds[0]!)
          : undefined,
      );

    // If we have multiple snapshot IDs, filter in code
    const filteredOffers =
      snapshotIds.length === 1
        ? allOffers
        : allOffers.filter((o) => snapshotIds.includes(o.snapshotId));

    // Group offers by snapshot
    const offersBySnapshot = new Map<number, typeof allOffers>();
    for (const offer of filteredOffers) {
      if (!offersBySnapshot.has(offer.snapshotId)) {
        offersBySnapshot.set(offer.snapshotId, []);
      }
      offersBySnapshot.get(offer.snapshotId)!.push(offer);
    }

    // Deduplicate — keep only the latest per bank
    const seenBanks = new Set<number>();
    const results = [];

    for (const snap of latestSnapshots) {
      if (seenBanks.has(snap.bankId)) continue;
      seenBanks.add(snap.bankId);

      const snapOffers = (offersBySnapshot.get(snap.snapshotId) ?? []).sort(
        (a, b) => a.rank - b.rank,
      );

      results.push({
        snapshotId: snap.snapshotId,
        bankId: snap.bankId,
        bankName: snap.bankName,
        capturedAt: snap.capturedAt,
        offers: snapOffers.map((o) => ({
          rank: o.rank,
          price: o.price,
          merchantName: o.merchantName,
          availableAmount: o.availableAmount,
          maxSingleTrans: o.maxSingleTrans,
          minSingleTrans: o.minSingleTrans,
        })),
      });
    }

    return Response.json({ data: results });
  } catch (error) {
    console.error('GET /api/snapshots/latest error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
    );
  }
}
