const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await pool.query("ALTER TYPE status_permohonan ADD VALUE IF NOT EXISTS 'Menunggu_TTE_Koordinator'");
    await pool.query("ALTER TYPE status_permohonan ADD VALUE IF NOT EXISTS 'Menunggu_TTE_Kabid'");
    await pool.query("ALTER TYPE status_permohonan ADD VALUE IF NOT EXISTS 'Menunggu_Validasi_Kadis'");
    await pool.query("ALTER TABLE permohonan_penilaian ADD COLUMN IF NOT EXISTS tte_signatures text");
    await pool.query("ALTER TABLE profil_bangunan ADD COLUMN IF NOT EXISTS url_denah_bangunan text");
    console.log("Schema updated successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

main();
