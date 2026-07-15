import { relations } from 'drizzle-orm';
import { 
  integer, 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  decimal, 
  boolean,
  pgEnum,
  uuid
} from 'drizzle-orm/pg-core';

export const kategoriKomponenEnum = pgEnum('kategori_komponen', ['Struktur', 'Arsitektur', 'Utilitas']);
export const roleEnum = pgEnum('role', ['Administrator', 'Pengelola_Bangunan', 'Operator', 'Tim_Teknis', 'Koordinator', 'Kabid', 'Kadis']);
export const statusPermohonanEnum = pgEnum('status_permohonan', ['Menunggu_Validasi', 'Menunggu_TTE_Koordinator', 'Menunggu_TTE_Kabid', 'Menunggu_Validasi_Kadis', 'Survei_Lapangan', 'Selesai_Dianalisis', 'Arsip_Digital']);
export const kesimpulanAkhirEnum = pgEnum('kesimpulan_akhir', ['Tidak Rusak', 'Rusak Ringan', 'Rusak Sedang', 'Rusak Berat']);
export const statusTindakanEnum = pgEnum('status_tindakan', ['Disposisi', 'Setuju_Tanpa_Survei', 'Jadwalkan_Survei', 'Terbitkan_Hasil']);

// 1. KELOMPOK DATA MASTER

export const masterKlasifikasiKerusakan = pgTable('master_klasifikasi_kerusakan', {
  idKlasifikasi: serial('id_klasifikasi').primaryKey(),
  namaKlasifikasi: text('nama_klasifikasi').notNull(),
  nilaiFaktor: decimal('nilai_faktor', { precision: 3, scale: 2 }).notNull(),
});

export const masterKomponen = pgTable('master_komponen', {
  idKomponen: serial('id_komponen').primaryKey(),
  kategoriKomponen: kategoriKomponenEnum('kategori_komponen').notNull(),
  namaKomponen: text('nama_komponen').notNull(),
  satuan: text('satuan').notNull(),
  bobotFormA: decimal('bobot_form_a', { precision: 5, scale: 2 }).notNull(),
  bobotFormB: decimal('bobot_form_b', { precision: 5, scale: 2 }).notNull(),
  bobotFormC: decimal('bobot_form_c', { precision: 5, scale: 2 }).notNull(),
  tooltipText: text('tooltip_text'),
  tooltipImage: text('tooltip_image'),
  urutan: integer('urutan').default(0),
});

export const masterKatalogVisual = pgTable('master_katalog_visual', {
  idKatalog: serial('id_katalog').primaryKey(),
  idKomponen: integer('id_komponen').references(() => masterKomponen.idKomponen).notNull(),
  idKlasifikasi: integer('id_klasifikasi').references(() => masterKlasifikasiKerusakan.idKlasifikasi).notNull(),
  deskripsiPupr: text('deskripsi_pupr').notNull(),
  urlFotoContoh: text('url_foto_contoh'),
});

// 2. KELOMPOK DATA TRANSAKSIONAL

export const users = pgTable('users', {
  idUser: serial('id_user').primaryKey(),
  uid: text('uid').unique().notNull(), // Firebase Auth UID
  namaLengkap: text('nama_lengkap').notNull(),
  email: text('email'),
  role: roleEnum('role').default('Pengelola_Bangunan').notNull(),
  kontakWhatsapp: text('kontak_whatsapp'),
  fcmToken: text('fcm_token'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const profilBangunan = pgTable('profil_bangunan', {
  idBangunan: serial('id_bangunan').primaryKey(),
  idUserPengelola: integer('id_user_pengelola').references(() => users.idUser).notNull(),
  namaSekolahInstansi: text('nama_sekolah_instansi').notNull(),
  npsnNup: text('npsn_nup').notNull(),
  namaMassaBangunan: text('nama_massa_bangunan').notNull(),
  koordinatGps: text('koordinat_gps'),
  urlDenahBangunan: text('url_denah_bangunan'),
  luasBangunanM2: decimal('luas_bangunan_m2', { precision: 10, scale: 2 }).notNull(),
  jumlahLantai: integer('jumlah_lantai').notNull(),
  customFields: text('custom_fields'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const permohonanPenilaian = pgTable('permohonan_penilaian', {
  idPermohonan: uuid('id_permohonan').defaultRandom().primaryKey(),
  idBangunan: integer('id_bangunan').references(() => profilBangunan.idBangunan).notNull(),
  tanggalPengajuan: timestamp('tanggal_pengajuan').defaultNow().notNull(),
  statusTerakhir: statusPermohonanEnum('status_terakhir').default('Menunggu_Validasi').notNull(),
  totalPersentaseKerusakan: decimal('total_persentase_kerusakan', { precision: 5, scale: 2 }),
  kesimpulanAkhir: kesimpulanAkhirEnum('kesimpulan_akhir'),
  urlDokumenHasilPdf: text('url_dokumen_hasil_pdf'),
  disposisiData: text('disposisi_data'),
  tteSignatures: text('tte_signatures'),
});

export const penilaianTahap1Keselamatan = pgTable('penilaian_tahap1_keselamatan', {
  idTahap1: serial('id_tahap1').primaryKey(),
  idPermohonan: uuid('id_permohonan').references(() => permohonanPenilaian.idPermohonan).notNull(),
  idKomponen: integer('id_komponen').references(() => masterKomponen.idKomponen).notNull(),
  indikasiBahaya: boolean('indikasi_bahaya').notNull().default(false),
  urlFotoBukti: text('url_foto_bukti'),
});

export const penilaianTahap2Volume = pgTable('penilaian_tahap2_volume', {
  idTahap2: serial('id_tahap2').primaryKey(),
  idPermohonan: uuid('id_permohonan').references(() => permohonanPenilaian.idPermohonan).notNull(),
  idKomponen: integer('id_komponen').references(() => masterKomponen.idKomponen).notNull(),
  idKlasifikasi: integer('id_klasifikasi').references(() => masterKlasifikasiKerusakan.idKlasifikasi).notNull(),
  volumeInput: decimal('volume_input', { precision: 10, scale: 2 }).notNull(),
  volumeInputs: text('volume_inputs'), // JSON array of volume inputs for multi-input feature
  urlFotoBukti: text('url_foto_bukti'),
  nilaiKerusakanKomponen: decimal('nilai_kerusakan_komponen', { precision: 8, scale: 4 }),
});

// 3. KELOMPOK DATA ALUR KERJA

export const logDisposisi = pgTable('log_disposisi', {
  idDisposisi: serial('id_disposisi').primaryKey(),
  idPermohonan: uuid('id_permohonan').references(() => permohonanPenilaian.idPermohonan).notNull(),
  idUserPengirim: integer('id_user_pengirim').references(() => users.idUser).notNull(),
  idUserPenerima: integer('id_user_penerima').references(() => users.idUser).notNull(),
  waktuDisposisi: timestamp('waktu_disposisi').defaultNow().notNull(),
  statusTindakan: statusTindakanEnum('status_tindakan').notNull(),
  catatanRekomendasiAi: text('catatan_rekomendasi_ai'),
});

// 4. KELOMPOK PENGATURAN
export const pengaturanDinas = pgTable('pengaturan_dinas', {
  id: serial('id').primaryKey(),
  namaDinas: text('nama_dinas').notNull().default('Dinas Pekerjaan Umum dan Penataan Ruang'),
  alamat: text('alamat').notNull().default('Jalan Raya Pembangunan No. 123, Garut'),
  kontak: text('kontak'),
  email: text('email'),
  website: text('website'),
  idKadis: integer('id_kadis').references(() => users.idUser),
  idKabid: integer('id_kabid').references(() => users.idUser),
});

// Relasi (Optional for Drizzle query builder)
export const masterKatalogVisualRelations = relations(masterKatalogVisual, ({ one }) => ({
  komponen: one(masterKomponen, { fields: [masterKatalogVisual.idKomponen], references: [masterKomponen.idKomponen] }),
  klasifikasi: one(masterKlasifikasiKerusakan, { fields: [masterKatalogVisual.idKlasifikasi], references: [masterKlasifikasiKerusakan.idKlasifikasi] }),
}));

export const profilBangunanRelations = relations(profilBangunan, ({ one, many }) => ({
  pengelola: one(users, { fields: [profilBangunan.idUserPengelola], references: [users.idUser] }),
  permohonan: many(permohonanPenilaian),
  history: many(historyPenilaian),
}));

export const permohonanPenilaianRelations = relations(permohonanPenilaian, ({ one, many }) => ({
  bangunan: one(profilBangunan, { fields: [permohonanPenilaian.idBangunan], references: [profilBangunan.idBangunan] }),
  tahap1: many(penilaianTahap1Keselamatan),
  tahap2: many(penilaianTahap2Volume),
  logDisposisi: many(logDisposisi),
  history: many(historyPenilaian),
}));

export const historyPenilaian = pgTable('history_penilaian', {
  idHistory: serial('id_history').primaryKey(),
  idBangunan: integer('id_bangunan').references(() => profilBangunan.idBangunan).notNull(),
  idPermohonan: uuid('id_permohonan').references(() => permohonanPenilaian.idPermohonan).notNull(),
  tahunPenilaian: integer('tahun_penilaian').notNull(),
  tanggalPenilaian: timestamp('tanggal_penilaian').defaultNow().notNull(),
  totalPersentaseKerusakan: decimal('total_persentase_kerusakan', { precision: 5, scale: 2 }).notNull(),
  kesimpulanAkhir: text('kesimpulan_akhir').notNull(),
  operatorPenilai: text('operator_penilai').notNull().default('Sistem Penilai'),
  catatanKerusakan: text('catatan_kerusakan'),
});

export const historyPenilaianRelations = relations(historyPenilaian, ({ one }) => ({
  bangunan: one(profilBangunan, { fields: [historyPenilaian.idBangunan], references: [profilBangunan.idBangunan] }),
  permohonan: one(permohonanPenilaian, { fields: [historyPenilaian.idPermohonan], references: [permohonanPenilaian.idPermohonan] }),
}));

export const appConfig = pgTable('app_config', {
  id: text('id').primaryKey(),
  value: text('value').notNull(),
});

export const notifications = pgTable('notifications', {
  idNotification: serial('id_notification').primaryKey(),
  userId: integer('id_user').references(() => users.idUser),
  targetRole: text('target_role'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  idPermohonan: uuid('id_permohonan').references(() => permohonanPenilaian.idPermohonan),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.idUser] }),
  permohonan: one(permohonanPenilaian, { fields: [notifications.idPermohonan], references: [permohonanPenilaian.idPermohonan] }),
}));

export const auditTrails = pgTable('audit_trails', {
  idAudit: serial('id_audit').primaryKey(),
  idPermohonan: uuid('id_permohonan').references(() => permohonanPenilaian.idPermohonan),
  userEmail: text('user_email').notNull(),
  userName: text('user_name').notNull(),
  role: text('role').notNull(),
  action: text('action').notNull(), // "Ubah Status", "Edit Penilaian", "Disposisi", "Buat Permohonan", "Verifikasi"
  details: text('details').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

export const auditTrailsRelations = relations(auditTrails, ({ one }) => ({
  permohonan: one(permohonanPenilaian, { fields: [auditTrails.idPermohonan], references: [permohonanPenilaian.idPermohonan] }),
}));


