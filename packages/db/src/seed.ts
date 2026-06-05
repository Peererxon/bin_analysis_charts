import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { existsSync } from 'fs';

// Buscar .env hacia arriba desde process.cwd()
let currentDir = process.cwd();
let envPath = resolve(currentDir, '.env');
while (!existsSync(envPath) && currentDir !== dirname(currentDir)) {
  currentDir = dirname(currentDir);
  envPath = resolve(currentDir, '.env');
}

if (existsSync(envPath)) {
  config({ path: envPath });
} else {
  config({ path: resolve(process.cwd(), '../../../.env') });
}

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { banks, appConfig, snapshots, offers } from './schema.js';

async function seed() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is required');
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql);

  console.log('🌱 Seeding banks...');

  const defaultBanks = [
    { name: 'BDV', binancePayType: 'BDVenezuela' },
    { name: 'Transferencia Bancaria', binancePayType: 'BANK' },
    { name: 'Provincial', binancePayType: 'Provincial' },
    { name: 'Mercantil', binancePayType: 'Mercantil' },
    { name: 'Banesco', binancePayType: 'Banesco' },
    { name: 'BNC', binancePayType: 'BNC' },
    { name: 'Bancamiga', binancePayType: 'Bancamiga' },
  ];

  for (const bank of defaultBanks) {
    await db
      .insert(banks)
      .values({
        name: bank.name,
        binancePayType: bank.binancePayType,
        isActive: true,
      })
      .onConflictDoNothing({ target: banks.name });
  }

  console.log('⚙️  Seeding default config...');

  const defaultConfig = [
    { key: 'min_capital_usd', value: '1000' },
    { key: 'min_max_offer_pct', value: '10' },
    { key: 'telegram_bot_token', value: '' },
  ];

  for (const config of defaultConfig) {
    await db
      .insert(appConfig)
      .values(config)
      .onConflictDoNothing({ target: appConfig.key });
  }

  console.log('✅ Default config complete!');

  console.log('📈 Seeding 30 days of mock market data (every 10 mins)...');
  const activeBanks = await db.select().from(banks);
  const now = new Date();
  // We use 30 days
  const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let currentIter = startDate;
  const basePrice = 39.50;
  let totalSnaps = 0;

  // We will batch insert day by day to reduce network calls
  while (currentIter < now) {
    // Generate 1 day of data in memory
    const dayEnd = new Date(currentIter.getTime() + 24 * 60 * 60 * 1000);
    const endBound = dayEnd > now ? now : dayEnd;

    const daySnapsToInsert = [];

    for (let d = currentIter; d < endBound; d = new Date(d.getTime() + 10 * 60 * 1000)) {
      for (const b of activeBanks) {
        const variation = 1 + (Math.random() * 0.02 - 0.01);
        daySnapsToInsert.push({
          bankId: b.id,
          capturedAt: d,
          _tempPrice: basePrice * variation
        });
      }
    }

    if (daySnapsToInsert.length > 0) {
      // 1 network call for all snapshots in a day
      const insertedSnaps = await db.insert(snapshots).values(
        daySnapsToInsert.map(s => ({ bankId: s.bankId, capturedAt: s.capturedAt }))
      ).returning({ id: snapshots.id });

      const dayOffersToInsert = [];
      for (let i = 0; i < insertedSnaps.length; i++) {
        const snapId = insertedSnaps[i].id;
        const baseP = daySnapsToInsert[i]._tempPrice;
        for (let rank = 1; rank <= 5; rank++) {
          dayOffersToInsert.push({
            snapshotId: snapId,
            rank,
            price: Number((baseP + (rank - 1) * 0.05).toFixed(2)),
            merchantName: `MockMerchant_${rank}`,
            availableAmount: Math.floor(Math.random() * 1000),
            minSingleTrans: 10,
            maxSingleTrans: 1000
          });
        }
      }

      // Chunk offers to avoid payload too large (Neon HTTP limit is few MB/parameters)
      const chunkSize = 500;
      for (let i = 0; i < dayOffersToInsert.length; i += chunkSize) {
        await db.insert(offers).values(dayOffersToInsert.slice(i, i + chunkSize));
      }

      totalSnaps += daySnapsToInsert.length;
    }

    console.log(`Inserted up to ${endBound.toISOString()} (Total: ${totalSnaps} snapshots)`);
    currentIter = dayEnd;
  }

  console.log('✅ Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
