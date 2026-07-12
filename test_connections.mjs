import pg from 'pg';
const { Pool } = pg;

const testConn = async (name, connString) => {
  console.log(`\nTesting ${name}...`);
  const pool = new Pool({
    connectionString: connString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });
  
  try {
    const res = await pool.query('SELECT 1 as x');
    console.log(`✅ SUCCESS: ${name}`);
  } catch (err) {
    console.log(`❌ ERROR ${name}: ${err.message}`);
  } finally {
    await pool.end();
  }
};

async function main() {
  const pwd = encodeURIComponent('Bangunan@pupr117');
  const proj = 'aojkrxuzjlzudkfojlxi';
  const dbName = 'postgres';
  const user = 'postgres';
  
  const combinations = [
    { name: 'Pooler 6543 (user.project)', url: `postgresql://${user}.${proj}:${pwd}@aws-0-ap-south-1.pooler.supabase.com:6543/${dbName}` },
    { name: 'Pooler 5432 (user.project)', url: `postgresql://${user}.${proj}:${pwd}@aws-0-ap-south-1.pooler.supabase.com:5432/${dbName}` },
    { name: 'Pooler 6543 (pgbouncer=true)', url: `postgresql://${user}.${proj}:${pwd}@aws-0-ap-south-1.pooler.supabase.com:6543/${dbName}?pgbouncer=true` },
    { name: 'Pooler 6543 (user only)', url: `postgresql://${user}:${pwd}@aws-0-ap-south-1.pooler.supabase.com:6543/${dbName}` },
    { name: 'Pooler 5432 (user only)', url: `postgresql://${user}:${pwd}@aws-0-ap-south-1.pooler.supabase.com:5432/${dbName}` },
    { name: 'Direct 5432', url: `postgresql://${user}:${pwd}@db.${proj}.supabase.co:5432/${dbName}` }
  ];

  for (const combo of combinations) {
    await testConn(combo.name, combo.url);
  }
}

main();
