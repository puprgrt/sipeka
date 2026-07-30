import pg from 'pg';
const { Pool } = pg;

async function run() {
  const conn = process.env.DATABASE_URL || 'postgresql://user:password@host:port/postgres';
  const pool = new Pool({ connectionString: conn, ssl: { rejectUnauthorized: false } });

  const statements = [
    // Common foreign key columns used in joins/filters
    `CREATE INDEX IF NOT EXISTS idx_profil_bangunan_id_user_pengelola ON profil_bangunan (id_user_pengelola);`,
    `CREATE INDEX IF NOT EXISTS idx_permohonan_penilaian_id_bangunan ON permohonan_penilaian (id_bangunan);`,
    `CREATE INDEX IF NOT EXISTS idx_penilaian_tahap1_id_permohonan ON penilaian_tahap1_keselamatan (id_permohonan);`,
    `CREATE INDEX IF NOT EXISTS idx_penilaian_tahap2_id_permohonan ON penilaian_tahap2_volume (id_permohonan);`,
    `CREATE INDEX IF NOT EXISTS idx_penilaian_tahap2_id_komponen ON penilaian_tahap2_volume (id_komponen);`,
    `CREATE INDEX IF NOT EXISTS idx_assessment_components_id_permohonan ON assessment_components_data (id_permohonan);`,
    `CREATE INDEX IF NOT EXISTS idx_log_disposisi_id_permohonan ON log_disposisi (id_permohonan);`,
    `CREATE INDEX IF NOT EXISTS idx_master_katalog_visual_id_komponen ON master_katalog_visual (id_komponen);`
  ];

  try {
    for (const s of statements) {
      console.log('Executing:', s.replace(/\s+/g, ' ').trim().slice(0, 120));
      await pool.query(s);
    }
    console.log('Index creation completed.');
  } catch (err) {
    console.error('Error creating indexes:', err.message || err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

if (require.main === module) run();
