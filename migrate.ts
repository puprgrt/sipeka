import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

// Coba muat .env.local atau .env
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else {
  dotenv.config();
}

async function run() {
  const poolConfig: any = {
    ssl: { rejectUnauthorized: false }
  };
  
  if (process.env.DATABASE_URL) {
    poolConfig.connectionString = process.env.DATABASE_URL;
  } else {
    poolConfig.host = process.env.SQL_HOST;
    poolConfig.user = process.env.SQL_USER;
    poolConfig.password = process.env.SQL_PASSWORD;
    poolConfig.database = process.env.SQL_DB_NAME;
  }
  
  const pool = new Pool(poolConfig);
  try {
    console.log("Menambahkan kolom url_r2 ke tabel dokumen_digital...");
    await pool.query('ALTER TABLE dokumen_digital ADD COLUMN url_r2 text;');
    console.log("Migrasi berhasil!");
  } catch (err: any) {
    if (err.message.includes('already exists')) {
      console.log("Kolom url_r2 sudah ada.");
    } else {
      console.error("Migrasi gagal:", err);
    }
  } finally {
    await pool.end();
  }
}

run();
