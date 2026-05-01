import { initDbSchema } from '../src/lib/db';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  console.log('Connecting to Turso...');
  console.log('URL:', process.env.TURSO_DATABASE_URL);
  
  if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
    console.error('Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in .env.local');
    process.exit(1);
  }

  try {
    console.log('Initializing database schema on Turso...');
    await initDbSchema();
    console.log('Successfully initialized schema on Turso!');
  } catch (err) {
    console.error('Failed to initialize schema:', err);
    process.exit(1);
  }
}

main();
