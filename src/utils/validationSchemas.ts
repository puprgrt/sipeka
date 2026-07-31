import { z } from 'zod';

/**
 * Request body validation schemas
 * Gunakan ini untuk standardisasi input validation
 */

// ===== ASSESSMENT SCHEMAS =====

export const createAssessmentSchema = z.object({
  idBangunan: z.number().positive('Invalid building ID'),
  totalPersentaseKerusakan: z.number().min(0).max(100).optional(),
  kesimpulanAkhir: z.enum(['Tidak Rusak', 'Rusak Ringan', 'Rusak Sedang', 'Rusak Berat']).optional(),
});

export const updateAssessmentSchema = z.object({
  totalPersentaseKerusakan: z.number().min(0).max(100).optional(),
  kesimpulanAkhir: z.enum(['Tidak Rusak', 'Rusak Ringan', 'Rusak Sedang', 'Rusak Berat']).optional(),
  statusTerakhir: z.enum([
    'Menunggu_Validasi',
    'Menunggu_TTE_Koordinator',
    'Menunggu_TTE_Kabid',
    'Menunggu_Validasi_Kadis',
    'Survei_Lapangan',
    'Selesai_Dianalisis',
    'Menunggu_Pengesahan',
    'Arsip_Digital',
  ]).optional(),
});

export const updateAssessmentStatusSchema = z.object({
  statusTerakhir: z.enum([
    'Menunggu_Validasi',
    'Menunggu_TTE_Koordinator',
    'Menunggu_TTE_Kabid',
    'Menunggu_Validasi_Kadis',
    'Survei_Lapangan',
    'Selesai_Dianalisis',
    'Menunggu_Pengesahan',
    'Arsip_Digital',
  ]),
});

export const disposisiSchema = z.object({
  idUserPenerima: z.number().positive('Invalid recipient user ID'),
  statusTindakan: z.enum(['Disposisi', 'Setuju_Tanpa_Survei', 'Jadwalkan_Survei', 'Terbitkan_Hasil']),
  catatanRekomendasiAi: z.string().max(1000).optional(),
});

export const updateNotificationSchema = z.object({
  userId: z.number().positive().optional(),
  role: z.string().min(1).optional(),
});

// ===== BUILDING SCHEMAS =====

export const createBuildingSchema = z.object({
  namaSekolahInstansi: z.string().min(1, 'School name is required'),
  npsnNup: z.string().min(1, 'NPSN/NUP is required'),
  namaMassaBangunan: z.string().min(1, 'Building name is required'),
  koordinatGps: z.string().regex(/^-?\d+\.\d+,-?\d+\.\d+$/, 'Invalid GPS coordinates format (lat,lng)').optional(),
  luasBangunanM2: z.number().positive('Building area must be positive'),
  jumlahLantai: z.number().int().positive('Number of floors must be positive'),
  customFields: z.string().optional(),
});

export const updateBuildingSchema = createBuildingSchema.partial();

// ===== USER SCHEMAS =====

export const updateUserSchema = z.object({
  namaLengkap: z.string().min(1).max(255).optional(),
  kontakWhatsapp: z.string().regex(/^\d{10,15}$/, 'Invalid WhatsApp number').optional(),
  role: z.enum(['Administrator', 'Pengelola_Bangunan', 'Operator', 'Tim_Teknis', 'Petugas_Survey', 'Koordinator', 'Kabid', 'Kadis']).optional(),
});

export const updateFcmTokenSchema = z.object({
  fcmToken: z.string().min(1, 'FCM token is required'),
});

// ===== QUERY PARAMETER SCHEMAS =====

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const filterAssessmentSchema = z.object({
  status: z.string().optional(),
  buildingId: z.coerce.number().optional(),
  userId: z.coerce.number().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// ===== IKM SCHEMAS =====

export const createIkmResponseSchema = z.object({
  u1: z.number().min(1).max(4),
  u2: z.number().min(1).max(4),
  u3: z.number().min(1).max(4),
  u4: z.number().min(1).max(4),
  u5: z.number().min(1).max(4),
  u6: z.number().min(1).max(4),
  u7: z.number().min(1).max(4),
  u8: z.number().min(1).max(4),
  u9: z.number().min(1).max(4),
  answers: z.record(z.string(), z.number()).optional(),
  testimoni: z.string().min(1, 'Testimonial is required').max(2000),
});

export const updateIkmQuestionSchema = z.object({
  label: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
  orderIndex: z.number().int().optional(),
});

// Type exports untuk digunakan di controllers
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>;
export type CreateBuildingInput = z.infer<typeof createBuildingSchema>;
export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type DisposisiInput = z.infer<typeof disposisiSchema>;
export type CreateIkmResponseInput = z.infer<typeof createIkmResponseSchema>;
