-- Migration: Create ikm_responses table for Indeks Kepuasan Masyarakat (IKM) & Testimoni
-- Run this SQL on your Supabase/PostgreSQL database

CREATE TABLE IF NOT EXISTS "ikm_responses" (
  "id_ikm" serial PRIMARY KEY NOT NULL,
  "id_permohonan" uuid NOT NULL,
  "id_user" integer NOT NULL,
  "u1" integer NOT NULL,
  "u2" integer NOT NULL,
  "u3" integer NOT NULL,
  "u4" integer NOT NULL,
  "u5" integer NOT NULL,
  "u6" integer NOT NULL,
  "u7" integer NOT NULL,
  "u8" integer NOT NULL,
  "u9" integer NOT NULL,
  "nilai_ikm" numeric(5, 2),
  "testimoni" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "ikm_responses_id_permohonan_permohonan_penilaian_id_permohonan_fk" FOREIGN KEY ("id_permohonan") REFERENCES "public"."permohonan_penilaian"("id_permohonan") ON DELETE no action ON UPDATE no action,
  CONSTRAINT "ikm_responses_id_user_users_id_user_fk" FOREIGN KEY ("id_user") REFERENCES "public"."users"("id_user") ON DELETE no action ON UPDATE no action
);
