import pg from 'pg';
const { Pool } = pg;

const testConn = async (name, connString, sni) => {
  console.log(`\nTesting ${name}...`);
  const pool = new Pool({
    connectionString: connString,
    ssl: { 
      rejectUnauthorized: false,
      servername: sni // Pass SNI here
    },
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
  const host = 'aws-0-ap-south-1.pooler.supabase.com';

  const combinations = [
    { name: 'SNI with pooler host', url: `postgresql://${user}:${pwd}@${host}:6543/${dbName}`, sni: host },
    { name: 'SNI with db host', url: `postgresql://${user}:${pwd}@${host}:6543/${dbName}`, sni: `db.${proj}.supabase.co` },
    { name: 'SNI with project ref', url: `postgresql://${user}:${pwd}@${host}:6543/${dbName}`, sni: proj }
  ];

  for (const combo of combinations) {
    await testConn(combo.name, combo.url, combo.sni);
  }
}

main();
