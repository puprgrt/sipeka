/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {} as Record<string, string | undefined>;
const supabaseUrl = viteEnv['VITE_SUPABASE_URL'] || process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = viteEnv['VITE_SUPABASE_PUBLISHABLE_KEY'] || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY) are not defined. Client-side Supabase queries might fail."
  );
}

const createSupabaseStub = () => ({
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => undefined } } }),
    signInWithOAuth: async () => ({ error: null }),
    signOut: async () => ({ error: null }),
    updateUser: async () => ({ error: null }),
    resetPasswordForEmail: async () => ({ error: null })
  }
});

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createSupabaseStub() as unknown as ReturnType<typeof createClient>;
