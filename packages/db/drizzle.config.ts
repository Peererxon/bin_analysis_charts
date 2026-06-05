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
  // Fallback a ruta relativa si no se encuentra por recursión
  config({ path: resolve(process.cwd(), '../../.env') });
}
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
