import pg from "pg";
const { Client } = pg;
const client = new Client({
  connectionString: "postgresql://postgres:postgres@localhost:5432/sipeka" // Fallback, we will use the one in .env if available
});
import * as dotenv from "dotenv";
dotenv.config();

const realClient = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  await realClient.connect();
  try {
    await realClient.query(`ALTER TABLE "penilaian_tahap2_volume" ADD COLUMN IF NOT EXISTS "volume_inputs" text;`);
    console.log("Column added successfully.");
  } catch (err) {
    console.error(err);
  } finally {
    await realClient.end();
  }
}
run();

