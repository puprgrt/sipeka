CREATE TYPE "public"."kategori_komponen" AS ENUM('Struktur', 'Arsitektur', 'Utilitas');--> statement-breakpoint
CREATE TYPE "public"."kesimpulan_akhir" AS ENUM('Tidak Rusak', 'Rusak Ringan', 'Rusak Sedang', 'Rusak Berat');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('Administrator', 'Pengelola_Bangunan', 'Operator', 'Tim_Teknis', 'Koordinator', 'Kabid', 'Kadis');--> statement-breakpoint
CREATE TYPE "public"."status_permohonan" AS ENUM('Menunggu_Validasi', 'Survei_Lapangan', 'Selesai_Dianalisis', 'Arsip_Digital');--> statement-breakpoint
CREATE TYPE "public"."status_tindakan" AS ENUM('Disposisi', 'Setuju_Tanpa_Survei', 'Jadwalkan_Survei', 'Terbitkan_Hasil');--> statement-breakpoint
CREATE TABLE "app_config" (
	"id" text PRIMARY KEY NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_trails" (
	"id_audit" serial PRIMARY KEY NOT NULL,
	"id_permohonan" uuid,
	"user_email" text NOT NULL,
	"user_name" text NOT NULL,
	"role" text NOT NULL,
	"action" text NOT NULL,
	"details" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "history_penilaian" (
	"id_history" serial PRIMARY KEY NOT NULL,
	"id_bangunan" integer NOT NULL,
	"id_permohonan" uuid NOT NULL,
	"tahun_penilaian" integer NOT NULL,
	"tanggal_penilaian" timestamp DEFAULT now() NOT NULL,
	"total_persentase_kerusakan" numeric(5, 2) NOT NULL,
	"kesimpulan_akhir" text NOT NULL,
	"operator_penilai" text DEFAULT 'Sistem Penilai' NOT NULL,
	"catatan_kerusakan" text
);
--> statement-breakpoint
CREATE TABLE "log_disposisi" (
	"id_disposisi" serial PRIMARY KEY NOT NULL,
	"id_permohonan" uuid NOT NULL,
	"id_user_pengirim" integer NOT NULL,
	"id_user_penerima" integer NOT NULL,
	"waktu_disposisi" timestamp DEFAULT now() NOT NULL,
	"status_tindakan" "status_tindakan" NOT NULL,
	"catatan_rekomendasi_ai" text
);
--> statement-breakpoint
CREATE TABLE "master_katalog_visual" (
	"id_katalog" serial PRIMARY KEY NOT NULL,
	"id_komponen" integer NOT NULL,
	"id_klasifikasi" integer NOT NULL,
	"deskripsi_pupr" text NOT NULL,
	"url_foto_contoh" text
);
--> statement-breakpoint
CREATE TABLE "master_klasifikasi_kerusakan" (
	"id_klasifikasi" serial PRIMARY KEY NOT NULL,
	"nama_klasifikasi" text NOT NULL,
	"nilai_faktor" numeric(3, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "master_komponen" (
	"id_komponen" serial PRIMARY KEY NOT NULL,
	"kategori_komponen" "kategori_komponen" NOT NULL,
	"nama_komponen" text NOT NULL,
	"satuan" text NOT NULL,
	"bobot_form_a" numeric(5, 2) NOT NULL,
	"bobot_form_b" numeric(5, 2) NOT NULL,
	"bobot_form_c" numeric(5, 2) NOT NULL,
	"tooltip_text" text,
	"tooltip_image" text,
	"urutan" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id_notification" serial PRIMARY KEY NOT NULL,
	"id_user" integer,
	"target_role" text,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"id_permohonan" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pengaturan_dinas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nama_dinas" text DEFAULT 'Dinas Pekerjaan Umum dan Penataan Ruang' NOT NULL,
	"alamat" text DEFAULT 'Jalan Raya Pembangunan No. 123, Garut' NOT NULL,
	"kontak" text,
	"email" text,
	"website" text,
	"id_kadis" integer,
	"id_kabid" integer
);
--> statement-breakpoint
CREATE TABLE "penilaian_tahap1_keselamatan" (
	"id_tahap1" serial PRIMARY KEY NOT NULL,
	"id_permohonan" uuid NOT NULL,
	"id_komponen" integer NOT NULL,
	"indikasi_bahaya" boolean DEFAULT false NOT NULL,
	"url_foto_bukti" text
);
--> statement-breakpoint
CREATE TABLE "penilaian_tahap2_volume" (
	"id_tahap2" serial PRIMARY KEY NOT NULL,
	"id_permohonan" uuid NOT NULL,
	"id_komponen" integer NOT NULL,
	"id_klasifikasi" integer NOT NULL,
	"volume_input" numeric(10, 2) NOT NULL,
	"url_foto_bukti" text,
	"nilai_kerusakan_komponen" numeric(8, 4)
);
--> statement-breakpoint
CREATE TABLE "permohonan_penilaian" (
	"id_permohonan" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_bangunan" integer NOT NULL,
	"tanggal_pengajuan" timestamp DEFAULT now() NOT NULL,
	"status_terakhir" "status_permohonan" DEFAULT 'Menunggu_Validasi' NOT NULL,
	"total_persentase_kerusakan" numeric(5, 2),
	"kesimpulan_akhir" "kesimpulan_akhir",
	"url_dokumen_hasil_pdf" text,
	"disposisi_data" text
);
--> statement-breakpoint
CREATE TABLE "profil_bangunan" (
	"id_bangunan" serial PRIMARY KEY NOT NULL,
	"id_user_pengelola" integer NOT NULL,
	"nama_sekolah_instansi" text NOT NULL,
	"npsn_nup" text NOT NULL,
	"nama_massa_bangunan" text NOT NULL,
	"koordinat_gps" text,
	"luas_bangunan_m2" numeric(10, 2) NOT NULL,
	"jumlah_lantai" integer NOT NULL,
	"custom_fields" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id_user" serial PRIMARY KEY NOT NULL,
	"uid" text NOT NULL,
	"nama_lengkap" text NOT NULL,
	"email" text,
	"role" "role" DEFAULT 'Pengelola_Bangunan' NOT NULL,
	"kontak_whatsapp" text,
	"fcm_token" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_uid_unique" UNIQUE("uid")
);
--> statement-breakpoint
ALTER TABLE "audit_trails" ADD CONSTRAINT "audit_trails_id_permohonan_permohonan_penilaian_id_permohonan_fk" FOREIGN KEY ("id_permohonan") REFERENCES "public"."permohonan_penilaian"("id_permohonan") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history_penilaian" ADD CONSTRAINT "history_penilaian_id_bangunan_profil_bangunan_id_bangunan_fk" FOREIGN KEY ("id_bangunan") REFERENCES "public"."profil_bangunan"("id_bangunan") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "history_penilaian" ADD CONSTRAINT "history_penilaian_id_permohonan_permohonan_penilaian_id_permohonan_fk" FOREIGN KEY ("id_permohonan") REFERENCES "public"."permohonan_penilaian"("id_permohonan") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_disposisi" ADD CONSTRAINT "log_disposisi_id_permohonan_permohonan_penilaian_id_permohonan_fk" FOREIGN KEY ("id_permohonan") REFERENCES "public"."permohonan_penilaian"("id_permohonan") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_disposisi" ADD CONSTRAINT "log_disposisi_id_user_pengirim_users_id_user_fk" FOREIGN KEY ("id_user_pengirim") REFERENCES "public"."users"("id_user") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "log_disposisi" ADD CONSTRAINT "log_disposisi_id_user_penerima_users_id_user_fk" FOREIGN KEY ("id_user_penerima") REFERENCES "public"."users"("id_user") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_katalog_visual" ADD CONSTRAINT "master_katalog_visual_id_komponen_master_komponen_id_komponen_fk" FOREIGN KEY ("id_komponen") REFERENCES "public"."master_komponen"("id_komponen") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "master_katalog_visual" ADD CONSTRAINT "master_katalog_visual_id_klasifikasi_master_klasifikasi_kerusakan_id_klasifikasi_fk" FOREIGN KEY ("id_klasifikasi") REFERENCES "public"."master_klasifikasi_kerusakan"("id_klasifikasi") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_id_user_users_id_user_fk" FOREIGN KEY ("id_user") REFERENCES "public"."users"("id_user") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_id_permohonan_permohonan_penilaian_id_permohonan_fk" FOREIGN KEY ("id_permohonan") REFERENCES "public"."permohonan_penilaian"("id_permohonan") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengaturan_dinas" ADD CONSTRAINT "pengaturan_dinas_id_kadis_users_id_user_fk" FOREIGN KEY ("id_kadis") REFERENCES "public"."users"("id_user") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pengaturan_dinas" ADD CONSTRAINT "pengaturan_dinas_id_kabid_users_id_user_fk" FOREIGN KEY ("id_kabid") REFERENCES "public"."users"("id_user") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penilaian_tahap1_keselamatan" ADD CONSTRAINT "penilaian_tahap1_keselamatan_id_permohonan_permohonan_penilaian_id_permohonan_fk" FOREIGN KEY ("id_permohonan") REFERENCES "public"."permohonan_penilaian"("id_permohonan") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penilaian_tahap1_keselamatan" ADD CONSTRAINT "penilaian_tahap1_keselamatan_id_komponen_master_komponen_id_komponen_fk" FOREIGN KEY ("id_komponen") REFERENCES "public"."master_komponen"("id_komponen") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penilaian_tahap2_volume" ADD CONSTRAINT "penilaian_tahap2_volume_id_permohonan_permohonan_penilaian_id_permohonan_fk" FOREIGN KEY ("id_permohonan") REFERENCES "public"."permohonan_penilaian"("id_permohonan") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penilaian_tahap2_volume" ADD CONSTRAINT "penilaian_tahap2_volume_id_komponen_master_komponen_id_komponen_fk" FOREIGN KEY ("id_komponen") REFERENCES "public"."master_komponen"("id_komponen") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "penilaian_tahap2_volume" ADD CONSTRAINT "penilaian_tahap2_volume_id_klasifikasi_master_klasifikasi_kerusakan_id_klasifikasi_fk" FOREIGN KEY ("id_klasifikasi") REFERENCES "public"."master_klasifikasi_kerusakan"("id_klasifikasi") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "permohonan_penilaian" ADD CONSTRAINT "permohonan_penilaian_id_bangunan_profil_bangunan_id_bangunan_fk" FOREIGN KEY ("id_bangunan") REFERENCES "public"."profil_bangunan"("id_bangunan") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profil_bangunan" ADD CONSTRAINT "profil_bangunan_id_user_pengelola_users_id_user_fk" FOREIGN KEY ("id_user_pengelola") REFERENCES "public"."users"("id_user") ON DELETE no action ON UPDATE no action;