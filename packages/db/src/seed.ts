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
import { banks, appConfig } from './schema.js';

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

  console.log('✅ Seed complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
