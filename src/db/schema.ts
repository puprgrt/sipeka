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
  uuid,
  jsonb
} from 'drizzle-orm/pg-core';

export const kategoriKomponenEnum = pgEnum('kategori_komponen', ['Struktur', 'Arsitektur', 'Utilitas']);
export const roleEnum = pgEnum('role', ['Administrator', 'Pengelola_Bangunan', 'Operator', 'Tim_Teknis', 'Petugas_Survey', 'Koordinator', 'Kabid', 'Kadis']);
export const statusPermohonanEnum = pgEnum('status_permohonan', ['Menunggu_Validasi', 'Menunggu_TTE_Koordinator', 'Menunggu_TTE_Kabid', 'Menunggu_Validasi_Kadis', 'Survei_Lapangan', 'Selesai_Dianalisis', 'Menunggu_Pengesahan', 'Arsip_Digital']);
export const kesimpulanAkhirEnum = pgEnum('kesimpulan_akhir', ['Tidak Rusak', 'Rusak Ringan', 'Rusak Sedang', 'Rusak Berat']);
export const statusTindakanEnum = pgEnum('status_tindakan', ['Disposisi', 'Setuju_Tanpa_Survei', 'Jadwalkan_Survei', 'Terbitkan_Hasil']);
export const tipeDokumenEnum = pgEnum('tipe_dokumen', ['Laporan_Penilaian', 'Surat_Permohonan', 'Unggahan_Bebas', 'Lainnya']);

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

// 5. INDEKS KEPUASAN MASYARAKAT (IKM) & TESTIMONI
export const ikmQuestions = pgTable('ikm_questions', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(), // e.g. "u1", "u2", "u10"
  label: text('label').notNull(),
  description: text('description').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
export const ikmResponses = pgTable('ikm_responses', {
  idIkm: serial('id_ikm').primaryKey(),
  idPermohonan: uuid('id_permohonan').references(() => permohonanPenilaian.idPermohonan).notNull(),
  idUser: integer('id_user').references(() => users.idUser).notNull(),
  u1: integer('u1').default(0).notNull(), // Persyaratan Pelayanan (1-4)
  u2: integer('u2').default(0).notNull(), // Sistem, Mekanisme, dan Prosedur (1-4)
  u3: integer('u3').default(0).notNull(), // Waktu Penyelesaian (1-4)
  u4: integer('u4').default(0).notNull(), // Biaya/Tarif (1-4)
  u5: integer('u5').default(0).notNull(), // Produk Spesifikasi Jenis Pelayanan (1-4)
  u6: integer('u6').default(0).notNull(), // Kompetensi Pelaksana (1-4)
  u7: integer('u7').default(0).notNull(), // Perilaku Pelaksana (1-4)
  u8: integer('u8').default(0).notNull(), // Penanganan Pengaduan, Saran dan Masukan (1-4)
  u9: integer('u9').default(0).notNull(), // Sarana dan Prasarana (1-4)
  answers: jsonb('answers'), // Dynamic answers mapping { "u1": 4, "u10": 3 }
  nilaiIkm: decimal('nilai_ikm', { precision: 5, scale: 2 }),
  testimoni: text('testimoni').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const ikmResponsesRelations = relations(ikmResponses, ({ one }) => ({
  permohonan: one(permohonanPenilaian, { fields: [ikmResponses.idPermohonan], references: [permohonanPenilaian.idPermohonan] }),
  user: one(users, { fields: [ikmResponses.idUser], references: [users.idUser] }),
}));

// 6. DOKUMEN DIGITAL & FILE MANAGER
export const dokumenDigital = pgTable('dokumen_digital', {
  idDokumen: uuid('id_dokumen').defaultRandom().primaryKey(),
  idUser: integer('id_user').references(() => users.idUser).notNull(),
  namaFile: text('nama_file').notNull(),
  urlGdriveUser: text('url_gdrive_user'), // link drive pribadi user
  urlGdriveSistem: text('url_gdrive_sistem'), // link backup drive sistem
  urlR2: text('url_r2'), // link R2 Cloudflare Object Storage
  tipeDokumen: tipeDokumenEnum('tipe_dokumen').default('Unggahan_Bebas').notNull(),
  mimeType: text('mime_type'),
  sizeBytes: integer('size_bytes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const dokumenDigitalRelations = relations(dokumenDigital, ({ one }) => ({
  user: one(users, { fields: [dokumenDigital.idUser], references: [users.idUser] }),
}));

