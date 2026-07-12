import 'dotenv/config';
import pg from 'pg';

async function updateRole() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try { 
    const res = await pool.query('SELECT * FROM users WHERE email = $1', ['enjangwahyudin@gmail.com']); 
    if (res.rows.length > 0) {
      console.log('User exists, updating role...');
      await pool.query('UPDATE users SET role = $1 WHERE email = $2', ['Administrator', 'enjangwahyudin@gmail.com']);
      console.log('Role updated to Administrator.');
    } else {
      console.log('User does not exist in DB yet. Creating user...');
      await pool.query('INSERT INTO users (uid, nama_lengkap, email, role) VALUES ($1, $2, $3, $4)', 
        ['enjangwahyudin_google_uid', 'Enjang Wahyudin', 'enjangwahyudin@gmail.com', 'Administrator']);
      console.log('User created as Administrator.');
    }
  } catch (e) { 
    console.log('❌ ERROR:', e.message); 
  } finally {
    await pool.end();
  }
}

updateRole();
