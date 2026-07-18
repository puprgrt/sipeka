const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await pool.query("DO $$ BEGIN CREATE TYPE tipe_dokumen AS ENUM ('Laporan_Penilaian', 'Surat_Permohonan', 'Unggahan_Bebas', 'Lainnya'); EXCEPTION WHEN duplicate_object THEN null; END $$;");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS dokumen_digital (
        id_dokumen UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        id_user INTEGER NOT NULL REFERENCES users(id_user),
        nama_file TEXT NOT NULL,
        url_gdrive_user TEXT,
        url_gdrive_sistem TEXT,
        tipe_dokumen tipe_dokumen NOT NULL DEFAULT 'Unggahan_Bebas',
        mime_type TEXT,
        size_bytes INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Table dokumen_digital created successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

main();
