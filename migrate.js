import "dotenv/config";
import { db } from "./src/db/index.js";

async function main() {
  try {
    console.log("Running migration for ikm_questions...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ikm_questions (
        id serial PRIMARY KEY,
        key text NOT NULL UNIQUE,
        label text NOT NULL,
        description text NOT NULL,
        is_active boolean NOT NULL DEFAULT true,
        order_index integer NOT NULL,
        created_at timestamp NOT NULL DEFAULT now()
      );
    `);
    
    console.log("Running migration for ikm_responses...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ikm_responses (
        id_ikm serial PRIMARY KEY,
        id_permohonan uuid NOT NULL REFERENCES permohonan_penilaian(id_permohonan),
        id_user integer NOT NULL REFERENCES users(id_user),
        u1 integer NOT NULL DEFAULT 0,
        u2 integer NOT NULL DEFAULT 0,
        u3 integer NOT NULL DEFAULT 0,
        u4 integer NOT NULL DEFAULT 0,
        u5 integer NOT NULL DEFAULT 0,
        u6 integer NOT NULL DEFAULT 0,
        u7 integer NOT NULL DEFAULT 0,
        u8 integer NOT NULL DEFAULT 0,
        u9 integer NOT NULL DEFAULT 0,
        answers jsonb,
        nilai_ikm numeric(5,2),
        testimoni text NOT NULL,
        created_at timestamp NOT NULL DEFAULT now()
      );
    `);
    
    console.log("Migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();
