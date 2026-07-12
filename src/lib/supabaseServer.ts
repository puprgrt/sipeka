import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Ensure env variables are loaded in Node environment
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "Supabase server-side environment variables (SUPABASE_URL, SUPABASE_SECRET_KEY) are not defined. Server-side Supabase queries might fail."
  );
}

export const supabaseServer = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Prevents session persistence issues in server environments
  },
});
