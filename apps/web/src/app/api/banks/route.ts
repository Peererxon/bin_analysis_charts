import { NextRequest } from 'next/server';
import { banks } from '@bin-analysis/db';
import { getDb, errorResponse } from '../_lib/db';

/**
 * GET /api/banks
 *
 * List all banks with active status.
 */
export async function GET(_request: NextRequest) {
  try {
    const db = getDb();

    const result = await db
      .select({
        id: banks.id,
        name: banks.name,
        binancePayType: banks.binancePayType,
        isActive: banks.isActive,
        createdAt: banks.createdAt,
      })
      .from(banks);

    return Response.json({ data: result });
  } catch (error) {
    console.error('GET /api/banks error:', error);
    return errorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      500,
    );
  }
}
