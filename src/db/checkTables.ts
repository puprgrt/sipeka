import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

export async function checkTables(pool: Pool) {
  const schemaPath = path.resolve(__dirname, 'schema.ts');
  let content = '';
  try {
    content = fs.readFileSync(schemaPath, 'utf8');
  } catch (err) {
    console.warn('Unable to read schema.ts for table checks:', (err as any).message || err);
    return;
  }

  const tableNames = new Set<string>();
  const re = /pgTable\(['\"]([a-z0-9_]+)['\"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    tableNames.add(m[1]);
  }

  if (tableNames.size === 0) return;

  const missing: string[] = [];
  for (const t of Array.from(tableNames)) {
    try {
      const res = await pool.query(
        `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name = $1) as exists`,
        [t]
      );
      const exists = res.rows?.[0]?.exists;
      if (!exists) missing.push(t);
    } catch (err) {
      console.warn(`Error checking table ${t}:`, (err as any).message || err);
    }
  }

  if (missing.length > 0) {
    console.warn('Missing DB tables detected:', missing.join(', '));
    console.warn('Run migrations (e.g., `npx drizzle-kit push`) against the correct DATABASE_URL to create these tables.');
  } else {
    console.log('All expected tables present in DB (checked via schema.ts).');
  }
}
