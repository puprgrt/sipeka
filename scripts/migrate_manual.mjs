import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function runMigration() {
  console.log('Reading migration file...');
  const sql = fs.readFileSync('drizzle/0000_slim_wolfpack.sql', 'utf8');

  console.log('Connecting to database...');
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Executing migration...');
    await pool.query(sql);
    console.log('✅ Migration executed successfully!');
    
    // Also seed the app_config since the server queried it and it might be empty
    await pool.query(`INSERT INTO "app_config" ("id", "value") VALUES ('app_settings', '{}') ON CONFLICT DO NOTHING`);
    console.log('✅ Default app_config seeded!');
  } catch (e) {
    console.error('❌ Migration failed:', e);
  } finally {
    await pool.end();
  }
}

runMigration();
