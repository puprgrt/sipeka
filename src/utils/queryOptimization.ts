import { db } from '../db';
import * as schema from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import { logger } from './logger';

/**
 * Utility functions untuk query optimization
 * Mengurangi N+1 queries dengan batch loading
 */

/**
 * Get all assessments dengan relations yang dioptimasi
 * Menggunakan batch loading untuk menghindari N+1 problem
 */
export const getAllAssessmentsOptimized = async (limit?: number, offset?: number) => {
  try {
    // 1. Fetch semua permohonan (dengan pagination optional)
    const permohonans = await db
      .select()
      .from(schema.permohonanPenilaian)
      .limit(limit || 1000)
      .offset(offset || 0);

    // Jika sudah kosong, return langsung
    if (permohonans.length === 0) {
      return {
        permohonans: [],
        buildingMap: new Map(),
        componentMap: new Map(),
        classificationMap: new Map(),
        tahap1Map: new Map(),
        tahap2Map: new Map(),
        componentDataMap: new Map(),
      };
    }

    // 2. Extract unique building IDs
    const buildingIds = [...new Set(permohonans.map(p => p.idBangunan))];

    // 3. Batch load buildings
    const buildings = buildingIds.length > 0
      ? await db.select().from(schema.profilBangunan)
          .where(inArray(schema.profilBangunan.idBangunan, buildingIds))
      : [];

    // 4. Batch load tahap1 data
    const permohonanIds = permohonans.map(p => p.idPermohonan);
    const tahap1Data = permohonanIds.length > 0
      ? await db.select().from(schema.penilaianTahap1Keselamatan)
          .where(inArray(schema.penilaianTahap1Keselamatan.idPermohonan, permohonanIds))
      : [];

    // 5. Batch load tahap2 data
    const tahap2Data = permohonanIds.length > 0
      ? await db.select().from(schema.penilaianTahap2Volume)
          .where(inArray(schema.penilaianTahap2Volume.idPermohonan, permohonanIds))
      : [];

    // 6. Batch load component data
    let componentData: any[] = [];
    try {
      componentData = permohonanIds.length > 0
        ? await db.select().from(schema.assessmentComponentsData)
            .where(inArray(schema.assessmentComponentsData.idPermohonan, permohonanIds))
        : [];
    } catch (err) {
      logger.warn('assessmentComponentsData table might not exist, continuing...');
    }

    // 7. Batch load components and classifications
    const componentIds = [
      ...new Set([
        ...tahap1Data.map(t => t.idKomponen),
        ...tahap2Data.map(t => t.idKomponen),
      ]),
    ];

    const components = componentIds.length > 0
      ? await db.select().from(schema.masterKomponen)
          .where(inArray(schema.masterKomponen.idKomponen, componentIds))
      : [];

    const classificationIds = [...new Set(tahap2Data.map(t => t.idKlasifikasi))];
    const classifications = classificationIds.length > 0
      ? await db.select().from(schema.masterKlasifikasiKerusakan)
          .where(inArray(schema.masterKlasifikasiKerusakan.idKlasifikasi, classificationIds))
      : [];

    // 8. Create lookup maps for O(1) access
    const buildingMap = new Map(buildings.map(b => [b.idBangunan, b]));
    const componentMap = new Map(components.map(c => [c.idKomponen, c]));
    const classificationMap = new Map(
      classifications.map(c => [c.idKlasifikasi, c])
    );
    const tahap1Map = new Map<string, any[]>();
    const tahap2Map = new Map<string, any[]>();
    const componentDataMap = new Map<string, any[]>();

    // Populate maps
    tahap1Data.forEach(t => {
      const key = t.idPermohonan;
      if (!tahap1Map.has(key)) tahap1Map.set(key, []);
      tahap1Map.get(key)!.push(t);
    });

    tahap2Data.forEach(t => {
      const key = t.idPermohonan;
      if (!tahap2Map.has(key)) tahap2Map.set(key, []);
      tahap2Map.get(key)!.push(t);
    });

    componentData.forEach(cd => {
      const key = cd.idPermohonan;
      if (!componentDataMap.has(key)) componentDataMap.set(key, []);
      componentDataMap.get(key)!.push(cd);
    });

    return {
      permohonans,
      buildingMap,
      componentMap,
      classificationMap,
      tahap1Map,
      tahap2Map,
      componentDataMap,
    };
  } catch (error) {
    logger.error({ err: error, context: 'getAllAssessmentsOptimized' }, 'Error in getAllAssessmentsOptimized');
    throw error;
  }
};

/**
 * Get single assessment dengan optimization
 */
export const getAssessmentOptimized = async (idPermohonan: string) => {
  const permohonan = await db
    .select()
    .from(schema.permohonanPenilaian)
    .where(eq(schema.permohonanPenilaian.idPermohonan, idPermohonan as any))
    .limit(1);

  if (permohonan.length === 0) return null;

  const p = permohonan[0];

  // Batch load related data menggunakan Promise.all untuk parallelism
  const [building, tahap1, tahap2, componentData, components, classifications] = await Promise.all([
    db
      .select()
      .from(schema.profilBangunan)
      .where(eq(schema.profilBangunan.idBangunan, p.idBangunan)),
    db
      .select()
      .from(schema.penilaianTahap1Keselamatan)
      .where(eq(schema.penilaianTahap1Keselamatan.idPermohonan, idPermohonan as any)),
    db
      .select()
      .from(schema.penilaianTahap2Volume)
      .where(eq(schema.penilaianTahap2Volume.idPermohonan, idPermohonan as any)),
    db
      .select()
      .from(schema.assessmentComponentsData)
      .where(eq(schema.assessmentComponentsData.idPermohonan, idPermohonan as any))
      .catch(() => []),
    db.select().from(schema.masterKomponen),
    db.select().from(schema.masterKlasifikasiKerusakan),
  ]);

  return {
    permohonan: p,
    building: building[0] || null,
    tahap1,
    tahap2,
    componentData,
    components,
    classifications,
  };
};

/**
 * Get disposisi logs dengan optimization
 */
export const getDisposisiLogsOptimized = async (idPermohonan: string) => {
  const logs = await db
    .select()
    .from(schema.logDisposisi)
    .where(eq(schema.logDisposisi.idPermohonan, idPermohonan as any));

  if (logs.length === 0) return [];

  const userIds = [...new Set(logs.flatMap(l => [l.idUserPengirim, l.idUserPenerima]))];

  const users = userIds.length > 0
    ? await db.select().from(schema.users)
        .where(inArray(schema.users.idUser, userIds))
    : [];

  const userMap = new Map(users.map(u => [u.idUser, u]));

  return logs.map(log => ({
    ...log,
    userPengirim: userMap.get(log.idUserPengirim),
    userPenerima: userMap.get(log.idUserPenerima),
  }));
};
