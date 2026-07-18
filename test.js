import "dotenv/config";
import { db } from "./src/db/index.js";

async function main() {
  const result = await db.execute(`
    SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
  `);
  console.log(result.rows.map(r => r.table_name));
  process.exit(0);
}
main();
