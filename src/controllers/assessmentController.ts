import express from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, and, ne, inArray, like } from 'drizzle-orm';
import { logAuditTrail, sendDisposisiNotification } from '../utils/audit';
import { initMasterData } from '../utils/masterData';
import { broadcastNotification } from '../utils/sseManager';
import { sendPushNotification } from '../utils/firebaseAdmin';

import { Assessment } from '../types';


export const get_assessments = async (req: express.Request, res: express.Response) => {
  try {
    const permohonans = await db.select().from(schema.permohonanPenilaian);
    const profilBangunans = await db.select().from(schema.profilBangunan);
    
    // Fetch components
    const tahap1 = await db.select().from(schema.penilaianTahap1Keselamatan);
    const tahap2 = await db.select().from(schema.penilaianTahap2Volume);
    const mKomponen = await db.select().from(schema.masterKomponen);
    const mKlasifikasi = await db.select().from(schema.masterKlasifikasiKerusakan);
    
    // Map back to Assessment type
    const assessments = permohonans.map(p => {
      const b = profilBangunans.find(pb => pb.idBangunan === p.idBangunan);
      let coords = null;
      if (b && b.koordinatGps) {
        const [lat, lng] = b.koordinatGps.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) coords = { lat, lng };
      }

      let parsedCustomFields: any = {};
      try {
        if (b && b.customFields) {
          parsedCustomFields = JSON.parse(b.customFields);
        }
      } catch (e) {}
      
      const pTahap1 = tahap1.filter(t1 => t1.idPermohonan === p.idPermohonan);
      const pTahap2 = tahap2.filter(t2 => t2.idPermohonan === p.idPermohonan);
      
      // Merge components
      const componentsMap = new Map<number, any>();
      
      for (const t1 of pTahap1) {
        const komp = mKomponen.find(k => k.idKomponen === t1.idKomponen);
        if (!komp) continue;
        componentsMap.set(t1.idKomponen, {
          id: komp.idKomponen.toString(),
          name: komp.namaKomponen,
          category: komp.kategoriKomponen,
          weight: komp.bobotFormA ? Number(komp.bobotFormA) : 0,
          safetyImpact: t1.indikasiBahaya,
          damageDetails: [],
          photo: t1.urlFotoBukti || undefined,
        });
      }
      
      for (const t2 of pTahap2) {
         if (!componentsMap.has(t2.idKomponen)) {
             const komp = mKomponen.find(k => k.idKomponen === t2.idKomponen);
             if (komp) {
               componentsMap.set(t2.idKomponen, {
                 id: komp.idKomponen.toString(),
                 name: komp.namaKomponen,
                 category: komp.kategoriKomponen,
                 weight: komp.bobotFormA ? Number(komp.bobotFormA) : 0,
                 safetyImpact: false,
                 damageDetails: [],
                 photo: undefined,
               });
             }
         }
         
         const comp = componentsMap.get(t2.idKomponen);
         if (comp) {
             const klas = mKlasifikasi.find(k => k.idKlasifikasi === t2.idKlasifikasi);
             if (klas) {
                 comp.damageDetails.push({
                     level: klas.namaKlasifikasi,
                     volume: t2.volumeInput ? Number(t2.volumeInput) : 0,
                     percentage: t2.nilaiKerusakanKomponen ? Number(t2.nilaiKerusakanKomponen) : 0,
                     photos: t2.urlFotoBukti ? [t2.urlFotoBukti] : undefined,
                     volumeInputs: t2.volumeInputs ? JSON.parse(t2.volumeInputs) : undefined
                 });
             }
             if (!comp.photo && t2.urlFotoBukti) {
                 comp.photo = t2.urlFotoBukti;
             }
         }
      }

      return {
        id: p.idPermohonan,
        idBangunan: b?.idBangunan,
        idUserPengelola: b?.idUserPengelola,
        schoolName: b?.namaSekolahInstansi || "Unknown",
        buildingName: b?.namaMassaBangunan || "Unknown",
        npsn: b?.npsnNup || "Unknown",
        nup: b?.npsnNup || "Unknown",
        address: parsedCustomFields.address || "Jl. Raya Pembangunan No. 123",
        city: parsedCustomFields.city || "Unknown",
        province: parsedCustomFields.province || "Unknown",
        buildingArea: b ? Number(b.luasBangunanM2) : 0,
        floorCount: b ? b.jumlahLantai : 1,
        coordinates: coords,
        date: p.tanggalPengajuan.toISOString(),
        components: componentsMap.size > 0 ? Array.from(componentsMap.values()) : (parsedCustomFields.components || []),
        photos: parsedCustomFields.photos || (p.urlDokumenHasilPdf ? [p.urlDokumenHasilPdf] : []),
        finalResult: {
          totalDamagePercentage: p.totalPersentaseKerusakan ? Number(p.totalPersentaseKerusakan) : 0,
          category: (p.kesimpulanAkhir?.replace('Rusak ', '') as any) || "Ringan"
        },
        status: p.statusTerakhir,
        verification: parsedCustomFields.verification || {},
        disposisiData: p.disposisiData,
        documentLink: parsedCustomFields.documentLink || null,
        customFields: { ...parsedCustomFields, idBangunan: b?.idBangunan, floorPlanImage: b?.urlDenahBangunan || parsedCustomFields.floorPlanImage }
      };
    });
    res.json(assessments);
  } catch (error) {
    console.error("Error fetching assessments:", error);
    res.status(500).json({ error: "Failed to fetch assessments" });
  }
};

export const post_seed_sample_building = async (req: express.Request, res: express.Response) => {
  try {
    await initMasterData();

    // 1. Get or create default user
    let defaultUser = await db.select().from(schema.users).limit(1);
    if (!defaultUser.length) {
      const [newU] = await db.insert(schema.users).values({
        uid: 'system_default_uid',
        namaLengkap: 'Sistem Admin',
        role: 'Administrator',
        email: 'admin@sipeka.com',
      }).returning();
      defaultUser = [newU];
    }

    // 2. Insert Profil Bangunan
    const [profil] = await db.insert(schema.profilBangunan).values({
      idUserPengelola: defaultUser[0].idUser,
      namaSekolahInstansi: "SMAN 1 Garut",
      npsnNup: "20224132",
      namaMassaBangunan: "Gedung Belajar & Lab IPA (Blok B)",
      koordinatGps: "-7.221542,107.901245",
      luasBangunanM2: "380.00",
      jumlahLantai: 2,
      customFields: JSON.stringify({
        nama_kontak: "Drs. H. Dadang, M.Pd.",
        kontak_hp: "081224556677",
        tahun_pembangunan: "2015",
        konstruksi: "Beton Bertulang",
        fungsi_bangunan: "Ruang Kelas & Laboratorium"
      }),
    }).returning();

    // 3. Insert Permohonan Penilaian
    const [permohonan] = await db.insert(schema.permohonanPenilaian).values({
      idBangunan: profil.idBangunan,
      tanggalPengajuan: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      statusTerakhir: "Selesai_Dianalisis",
      totalPersentaseKerusakan: "28.35",
      kesimpulanAkhir: "Rusak Sedang",
      urlDokumenHasilPdf: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80"
    }).returning();

    // 4. Populate safety checks & volumes if they exist in DB
    const components = await db.select().from(schema.masterKomponen);
    if (components.length > 0) {
      const pondasi = components.find(c => c.namaKomponen.toLowerCase().includes('pondasi'));
      const kolom = components.find(c => c.namaKomponen.toLowerCase().includes('kolom'));
      
      if (pondasi) {
        await db.insert(schema.penilaianTahap1Keselamatan).values({
          idPermohonan: permohonan.idPermohonan,
          idKomponen: pondasi.idKomponen,
          indikasiBahaya: false,
          urlFotoBukti: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&q=80&w=600"
        });
      }
      if (kolom) {
        await db.insert(schema.penilaianTahap1Keselamatan).values({
          idPermohonan: permohonan.idPermohonan,
          idKomponen: kolom.idKomponen,
          indikasiBahaya: false,
          urlFotoBukti: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600"
        });
      }
    }

    res.status(201).json({
      success: true,
      message: "Sample bangunan lengkap berhasil dibuat!",
      data: {
        id: permohonan.idPermohonan,
        schoolName: "SMAN 1 Garut",
        buildingName: "Gedung Belajar & Lab IPA (Blok B)"
      }
    });
  } catch (error) {
    console.error("Seed sample building error", error);
    res.status(500).json({ error: "Failed to seed sample building" });
  }
};

export const post_assessments = async (req: express.Request, res: express.Response) => {
  try {
    const payload = req.body as Assessment;
    await initMasterData();

    // 1. Get default user
    let defaultUser = await db.select().from(schema.users).limit(1);
    if (!defaultUser.length) {
      throw new Error("No default user found");
    }

    const customFieldsObj = {
      ...((req.body as any).customFields || {}),
      address: payload.address || (req.body as any).address || "Jl. Raya Pembangunan No. 123",
      city: (req.body as any).city || payload.city || "Unknown",
      province: (req.body as any).province || payload.province || "Unknown",
      components: payload.components || [],
      verification: payload.verification || {},
      photos: payload.photos || [],
      safetyChecks: (req.body as any).safetyChecks || {}
    };

    let finalIdBangunan: number;
    let isExisting = false;

    // First check if idBangunan is explicitly provided in the payload or body
    const reqIdBangunan = (req.body as any).idBangunan || (payload.customFields && payload.customFields.idBangunan);

    if (reqIdBangunan) {
      const [existingB] = await db.select().from(schema.profilBangunan).where(eq(schema.profilBangunan.idBangunan, Number(reqIdBangunan))).limit(1);
      if (existingB) {
        finalIdBangunan = existingB.idBangunan;
        isExisting = true;
        // Update the building's custom fields with latest details
        await db.update(schema.profilBangunan).set({
          namaSekolahInstansi: payload.schoolName,
          npsnNup: payload.npsn,
          namaMassaBangunan: payload.buildingName,
          koordinatGps: payload.coordinates ? `${payload.coordinates.lat},${payload.coordinates.lng}` : existingB.koordinatGps,
          urlDenahBangunan: customFieldsObj.floorPlanImage || existingB.urlDenahBangunan,
          luasBangunanM2: payload.buildingArea.toString(),
          jumlahLantai: payload.floorCount || 1,
          customFields: JSON.stringify({
            ...(existingB.customFields ? JSON.parse(existingB.customFields) : {}),
            ...customFieldsObj
          })
        }).where(eq(schema.profilBangunan.idBangunan, finalIdBangunan));
      }
    }

    if (!isExisting) {
      // Try to search by NPSN & Building Name to avoid duplicate profiles
      const [matchedB] = await db.select().from(schema.profilBangunan).where(
        and(
          eq(schema.profilBangunan.npsnNup, payload.npsn),
          eq(schema.profilBangunan.namaMassaBangunan, payload.buildingName)
        )
      ).limit(1);

      if (matchedB) {
        finalIdBangunan = matchedB.idBangunan;
        isExisting = true;
        await db.update(schema.profilBangunan).set({
          namaSekolahInstansi: payload.schoolName,
          npsnNup: payload.npsn,
          namaMassaBangunan: payload.buildingName,
          koordinatGps: payload.coordinates ? `${payload.coordinates.lat},${payload.coordinates.lng}` : matchedB.koordinatGps,
          urlDenahBangunan: customFieldsObj.floorPlanImage || matchedB.urlDenahBangunan,
          luasBangunanM2: payload.buildingArea.toString(),
          jumlahLantai: payload.floorCount || 1,
          customFields: JSON.stringify({
            ...(matchedB.customFields ? JSON.parse(matchedB.customFields) : {}),
            ...customFieldsObj
          })
        }).where(eq(schema.profilBangunan.idBangunan, finalIdBangunan));
      } else {
        const reqIdUserPengelola = (req.body as any).idUserPengelola || payload.idUserPengelola || defaultUser[0].idUser;

        // Create a new profil_bangunan
        const [profil] = await db.insert(schema.profilBangunan).values({
          idUserPengelola: Number(reqIdUserPengelola),
          namaSekolahInstansi: payload.schoolName,
          npsnNup: payload.npsn,
          namaMassaBangunan: payload.buildingName,
          koordinatGps: payload.coordinates ? `${payload.coordinates.lat},${payload.coordinates.lng}` : null,
          urlDenahBangunan: customFieldsObj.floorPlanImage || null,
          luasBangunanM2: payload.buildingArea.toString(),
          jumlahLantai: payload.floorCount || 1,
          customFields: JSON.stringify(customFieldsObj),
        }).returning();
        finalIdBangunan = profil.idBangunan;
      }
    }

    // 3. Insert Permohonan Penilaian
    const categoryMap: Record<string, string> = {
      'Tidak Rusak': 'Tidak Rusak',
      'Ringan': 'Rusak Ringan',
      'Sedang': 'Rusak Sedang',
      'Berat': 'Rusak Berat'
    };
    const kesimpulan = categoryMap[payload.finalResult.category] || 'Rusak Ringan';
    
    const [permohonan] = await db.insert(schema.permohonanPenilaian).values({
      idBangunan: finalIdBangunan,
      totalPersentaseKerusakan: payload.finalResult.totalDamagePercentage.toString(),
      kesimpulanAkhir: kesimpulan as any,
      urlDokumenHasilPdf: payload.photos.length > 0 ? payload.photos[0] : null
    }).returning();

    // 4. Insert History Penilaian
    const tahunSekarang = new Date(permohonan.tanggalPengajuan).getFullYear();
    await db.insert(schema.historyPenilaian).values({
      idBangunan: finalIdBangunan,
      idPermohonan: permohonan.idPermohonan,
      tahunPenilaian: tahunSekarang,
      totalPersentaseKerusakan: payload.finalResult.totalDamagePercentage.toString(),
      kesimpulanAkhir: kesimpulan,
      operatorPenilai: payload.customFields?.operatorPenilai || 'Sistem Penilai',
      catatanKerusakan: payload.customFields?.catatanKerusakan || 'Penilaian Berkala / Tahunan'
    });

    // 5. Insert Components
    const mKlasifikasi = await db.select().from(schema.masterKlasifikasiKerusakan);
    const mKomponen = await db.select().from(schema.masterKomponen);
    if (payload.components && Array.isArray(payload.components)) {
      for (const comp of payload.components) {
        let idKomponen: number | undefined;
        if ((comp as any).id) {
          idKomponen = parseInt((comp as any).id);
        }
        if (!idKomponen || isNaN(idKomponen)) {
          const matchedKomp = mKomponen.find(k => k.namaKomponen === comp.name);
          if (matchedKomp) idKomponen = matchedKomp.idKomponen;
        }
        
        if (!idKomponen) continue;
        
        if (comp.safetyImpact) {
          await db.insert(schema.penilaianTahap1Keselamatan).values({
            idPermohonan: permohonan.idPermohonan,
            idKomponen,
            indikasiBahaya: true,
            urlFotoBukti: comp.photo
          });
        }
        
        if (comp.damageDetails && Array.isArray(comp.damageDetails)) {
          for (const detail of comp.damageDetails) {
            const klas = mKlasifikasi.find(k => k.namaKlasifikasi === detail.level);
            if (klas) {
              await db.insert(schema.penilaianTahap2Volume).values({
                idPermohonan: permohonan.idPermohonan,
                idKomponen,
                idKlasifikasi: klas.idKlasifikasi,
                volumeInput: detail.volume ? String(detail.volume) : "0",
                volumeInputs: detail.volumeInputs ? JSON.stringify(detail.volumeInputs) : null,
                urlFotoBukti: detail.photos && detail.photos.length > 0 ? detail.photos[0] : undefined,
                nilaiKerusakanKomponen: String(detail.percentage)
              });
            }
          }
        }
      }
    }

    // Return something that matches Assessment for the UI
    const responseAssessment: Assessment = {
      ...payload,
      id: permohonan.idPermohonan,
      date: permohonan.tanggalPengajuan.toISOString(),
      customFields: {
        ...customFieldsObj,
        idBangunan: finalIdBangunan
      }
    };

    // Log the creation of the assessment
    await logAuditTrail(
      permohonan.idPermohonan,
      req,
      "Buat Permohonan",
      `Membuat permohonan penilaian baru untuk "${payload.schoolName}" (Bangunan: "${payload.buildingName}") dengan tingkat kerusakan ${payload.finalResult.totalDamagePercentage}% (${kesimpulan}).`
    );

    res.status(201).json(responseAssessment);
  } catch (error) {
    console.error("POST assessments error", error);
    res.status(500).json({ error: "Failed to save assessment", details: (error as any).message });
  }
};

export const get_assessments_by_id = async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const [p] = await db.select().from(schema.permohonanPenilaian).where(eq(schema.permohonanPenilaian.idPermohonan, id)).limit(1);
    if (!p) return res.status(404).json({ error: "Permohonan tidak ditemukan" });

    const [b] = await db.select().from(schema.profilBangunan).where(eq(schema.profilBangunan.idBangunan, p.idBangunan)).limit(1);
    
    let coords = null;
    if (b && b.koordinatGps) {
      const [lat, lng] = b.koordinatGps.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) coords = { lat, lng };
    }

    let parsedCustomFields: any = {};
    try {
      if (b && b.customFields) {
        parsedCustomFields = JSON.parse(b.customFields);
      }
    } catch (e) {}

    const t1Data = await db.select().from(schema.penilaianTahap1Keselamatan).where(eq(schema.penilaianTahap1Keselamatan.idPermohonan, id));
    const t2Data = await db.select().from(schema.penilaianTahap2Volume).where(eq(schema.penilaianTahap2Volume.idPermohonan, id));
    const mKomponen = await db.select().from(schema.masterKomponen);
    const mKlasifikasi = await db.select().from(schema.masterKlasifikasiKerusakan);

    const componentsMap = new Map<number, any>();
    
    for (const t1 of t1Data) {
        const komp = mKomponen.find(k => k.idKomponen === t1.idKomponen);
        if (!komp) continue;
        componentsMap.set(t1.idKomponen, {
            id: komp.idKomponen.toString(),
            name: komp.namaKomponen,
            category: komp.kategoriKomponen,
            weight: komp.bobotFormA ? Number(komp.bobotFormA) : 0,
            safetyImpact: t1.indikasiBahaya,
            damageDetails: [],
            photo: t1.urlFotoBukti || undefined,
        });
    }

    for (const t2 of t2Data) {
        if (!componentsMap.has(t2.idKomponen)) {
            const komp = mKomponen.find(k => k.idKomponen === t2.idKomponen);
            if (komp) {
                componentsMap.set(t2.idKomponen, {
                    id: komp.idKomponen.toString(),
                    name: komp.namaKomponen,
                    category: komp.kategoriKomponen,
                    weight: komp.bobotFormA ? Number(komp.bobotFormA) : 0,
                    safetyImpact: false,
                    damageDetails: [],
                    photo: undefined,
                });
            }
        }
        
        const comp = componentsMap.get(t2.idKomponen);
        if (comp) {
            const klas = mKlasifikasi.find(k => k.idKlasifikasi === t2.idKlasifikasi);
            if (klas) {
                comp.damageDetails.push({
                    level: klas.namaKlasifikasi,
                    volume: t2.volumeInput ? Number(t2.volumeInput) : 0,
                    percentage: t2.nilaiKerusakanKomponen ? Number(t2.nilaiKerusakanKomponen) : 0,
                    photos: t2.urlFotoBukti ? [t2.urlFotoBukti] : undefined,
                    volumeInputs: t2.volumeInputs ? JSON.parse(t2.volumeInputs) : undefined
                });
            }
            if (!comp.photo && t2.urlFotoBukti) {
                comp.photo = t2.urlFotoBukti;
            }
        }
    }

    res.json({
      id: p.idPermohonan,
      schoolName: b?.namaSekolahInstansi || "Unknown",
      buildingName: b?.namaMassaBangunan || "Unknown",
      npsn: b?.npsnNup || "Unknown",
      nup: b?.npsnNup || "Unknown",
      address: parsedCustomFields.address || "Jl. Raya Pembangunan No. 123",
      city: parsedCustomFields.city || "Unknown",
      province: parsedCustomFields.province || "Unknown",
      buildingArea: b ? Number(b.luasBangunanM2) : 0,
      floorCount: b ? b.jumlahLantai : 1,
      coordinates: coords,
      date: p.tanggalPengajuan.toISOString(),
      components: componentsMap.size > 0 ? Array.from(componentsMap.values()) : (parsedCustomFields.components || []),
      photos: parsedCustomFields.photos || (p.urlDokumenHasilPdf ? [p.urlDokumenHasilPdf] : []),
      finalResult: {
        totalDamagePercentage: p.totalPersentaseKerusakan ? Number(p.totalPersentaseKerusakan) : 0,
        category: (p.kesimpulanAkhir?.replace('Rusak ', '') as any) || "Ringan"
      },
      status: p.statusTerakhir,
      verification: parsedCustomFields.verification || {},
      disposisiData: p.disposisiData,
      documentLink: parsedCustomFields.documentLink || null,
      tteSignatures: p.tteSignatures,
      customFields: { ...parsedCustomFields, idBangunan: b?.idBangunan, floorPlanImage: b?.urlDenahBangunan || parsedCustomFields.floorPlanImage }
    });
  } catch (error) {
    console.error("GET assessment detail error", error);
    res.status(500).json({ error: "Failed to fetch assessment" });
  }
};

export const get_buildings = async (req: express.Request, res: express.Response) => {
  try {
    const buildings = await db.select().from(schema.profilBangunan);
    const results = buildings.map(b => {
      let parsedCustomFields = {};
      try {
        if (b.customFields) parsedCustomFields = JSON.parse(b.customFields);
      } catch (e) {}
      return {
        idBangunan: b.idBangunan,
        idUserPengelola: b.idUserPengelola,
        schoolName: b.namaSekolahInstansi,
        buildingName: b.namaMassaBangunan,
        npsn: b.npsnNup,
        nup: b.npsnNup,
        coordinates: b.koordinatGps ? {
          lat: Number(b.koordinatGps.split(',')[0]),
          lng: Number(b.koordinatGps.split(',')[1])
        } : null,
        buildingArea: b.luasBangunanM2 ? Number(b.luasBangunanM2) : 0,
        floorCount: b.jumlahLantai || 1,
        customFields: parsedCustomFields
      };
    });
    res.json(results);
  } catch (error) {
    console.error("GET buildings error", error);
    res.status(500).json({ error: "Failed to fetch buildings list" });
  }
};

export const get_buildings_by_id_history = async (req: express.Request, res: express.Response) => {
  try {
    const idBangunan = parseInt(req.params.id);
    if (isNaN(idBangunan)) {
      return res.status(400).json({ error: "ID Bangunan tidak valid" });
    }
    const history = await db.select().from(schema.historyPenilaian).where(eq(schema.historyPenilaian.idBangunan, idBangunan));
    history.sort((a, b) => b.tahunPenilaian - a.tahunPenilaian);
    res.json(history);
  } catch (error) {
    console.error("GET building history error", error);
    res.status(500).json({ error: "Failed to fetch building history" });
  }
};

// Helper: normalize legacy status to simplified 5-stage flow
function normalizeStatusServer(status: string): string {
  switch (status) {
    case 'Verifikasi_Berkas': return 'Menunggu_Validasi';
    case 'Menunggu_TTE_Koordinator':
    case 'Menunggu_TTE_Kabid':
    case 'Menunggu_Validasi_Kadis':
      return 'Menunggu_Pengesahan';
    default: return status;
  }
}

// TTE signing order for Hasil Penilaian: Tim_Teknis (auto) → Koordinator → Kabid
// TTE signing order for Surat Jawaban: Kabid → Kadis
const TTE_ORDER_PENILAIAN = ['Petugas_Survey', 'Tim_Teknis', 'Koordinator', 'Kabid'];
const TTE_ORDER_SURAT = ['Kabid', 'Kadis'];

export const put_assessments_by_id_verification = async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const { verification, isTTE } = req.body;
    
    const role = (req.headers['x-user-role'] as string) || '';
    const name = (req.headers['x-user-name'] as string) || '';

    const [p] = await db.select().from(schema.permohonanPenilaian).where(eq(schema.permohonanPenilaian.idPermohonan, id)).limit(1);
    if (!p) return res.status(404).json({ error: "Permohonan tidak ditemukan" });

    const [b] = await db.select().from(schema.profilBangunan).where(eq(schema.profilBangunan.idBangunan, p.idBangunan)).limit(1);
    if (!b) return res.status(404).json({ error: "Profil bangunan tidak ditemukan" });

    let parsedCustomFields: any = {};
    try {
      if (b.customFields) {
        parsedCustomFields = JSON.parse(b.customFields);
      }
    } catch (e) {}

    parsedCustomFields.verification = verification;

    await db.update(schema.profilBangunan)
      .set({ customFields: JSON.stringify(parsedCustomFields) })
      .where(eq(schema.profilBangunan.idBangunan, b.idBangunan));

    let tteSignatures: any = {};
    if (p.tteSignatures) {
      try { tteSignatures = JSON.parse(p.tteSignatures); } catch (e) {}
    }

    const currentStatus = normalizeStatusServer(p.statusTerakhir);
    let nextStatus = currentStatus;
    let tteApplied = false;

    if (isTTE && role) {
      const appDomain = req.headers.host ? `http://${req.headers.host}` : 'http://localhost:5173';
      const validationUrl = `${appDomain}/validasi/${id}`;
      const qrData = encodeURIComponent(validationUrl);
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;
      
      tteSignatures[role] = {
        name,
        role,
        timestamp: new Date().toISOString(),
        qrCodeUrl,
        validationUrl
      };
      
      tteApplied = true;

      // Simplified sequential TTE flow:
      // When analysis is done (Selesai_Dianalisis), Tim_Teknis & Petugas_Survey auto-TTE
      // → move to Menunggu_Pengesahan for Koordinator → Kabid sequential signing
      // After Kabid signs for Hasil Penilaian → Kadis signs Surat Jawaban → Arsip_Digital
      if ((role === 'Tim_Teknis' || role === 'Petugas_Survey') && 
          (currentStatus === 'Menunggu_Validasi' || currentStatus === 'Survei_Lapangan' || currentStatus === 'Selesai_Dianalisis')) {
        nextStatus = 'Menunggu_Pengesahan';
      } else if (role === 'Koordinator' && currentStatus === 'Menunggu_Pengesahan') {
        // Koordinator signs, still waiting for Kabid
        nextStatus = 'Menunggu_Pengesahan';
      } else if (role === 'Kabid' && currentStatus === 'Menunggu_Pengesahan') {
        // Kabid signs for Hasil Penilaian — check if Kadis still needs to sign Surat Jawaban
        if (tteSignatures['Kadis']) {
          nextStatus = 'Arsip_Digital';
        } else {
          nextStatus = 'Menunggu_Pengesahan'; // Still waiting for Kadis
        }
      } else if (role === 'Kadis' && currentStatus === 'Menunggu_Pengesahan') {
        // Kadis signs Surat Jawaban — all done
        nextStatus = 'Arsip_Digital';
      }

      await db.update(schema.permohonanPenilaian)
        .set({ 
          statusTerakhir: nextStatus as any,
          tteSignatures: JSON.stringify(tteSignatures) 
        })
        .where(eq(schema.permohonanPenilaian.idPermohonan, id));
    }

    const isApproved = verification?.status === "Disetujui" || verification?.verified;
    const statusText = isApproved ? "Disetujui" : "Ditolak / Perlu Perbaikan";
    const logAction = tteApplied ? "Verifikasi & TTE" : "Verifikasi";
    
    await logAuditTrail(
      id,
      req,
      logAction,
      `Melakukan verifikasi berkas permohonan untuk "${b.namaSekolahInstansi}" (Bangunan: "${b.namaMassaBangunan}") dengan status: "${statusText}". Catatan verifikasi: "${verification?.notes || '-'}".`
    );

    res.json({ success: true, verification, tteSignatures, statusTerakhir: nextStatus });
  } catch (error) {
    console.error("PUT assessment verification error", error);
    res.status(500).json({ error: "Failed to update verification" });
  }
};

export const get_assessments_by_id_logs = async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const [p] = await db.select().from(schema.permohonanPenilaian).where(eq(schema.permohonanPenilaian.idPermohonan, id)).limit(1);
    if (!p) return res.status(404).json({ error: "Permohonan tidak ditemukan" });

    const date = p.tanggalPengajuan;
    const rawStatus = p.statusTerakhir;
    const status = normalizeStatusServer(rawStatus);

    // Parse TTE signatures to show real signing progress
    let tteSignatures: any = {};
    if (p.tteSignatures) {
      try { tteSignatures = JSON.parse(p.tteSignatures); } catch (e) {}
    }

    const logs = [];

    // === TAHAP 1: Pengajuan & Validasi ===
    const isValidasiSelesai = ['Survei_Lapangan', 'Selesai_Dianalisis', 'Menunggu_Pengesahan', 'Arsip_Digital'].includes(status);
    logs.push({
      waktu: date.toISOString(),
      tahap: "Validasi",
      judul: "Pengajuan & Validasi Administrasi",
      deskripsi: isValidasiSelesai
        ? "Permohonan telah dikirim dan berkas administrasi diverifikasi lengkap oleh Operator Bidang Bangunan."
        : "Berkas permohonan sedang dalam antrean validasi dan verifikasi kelengkapan administrasi.",
      status: isValidasiSelesai ? "SELESAI" : (status === 'Menunggu_Validasi' ? "PROSES" : "PENDING"),
      petugas: "Operator Bidang Bangunan",
    });

    // === TAHAP 2: Survei Lapangan ===
    const isSurveiSelesai = ['Selesai_Dianalisis', 'Menunggu_Pengesahan', 'Arsip_Digital'].includes(status);
    const isSurveiActive = status === 'Survei_Lapangan';
    const surveiDate = new Date(date.getTime() + 1000 * 60 * 60 * 2);
    logs.push({
      waktu: (isSurveiActive || isSurveiSelesai) ? surveiDate.toISOString() : "-",
      tahap: "Survei",
      judul: isSurveiSelesai ? "Survei Lapangan Selesai" : isSurveiActive ? "Survei Lapangan Berlangsung" : "Survei Lapangan",
      deskripsi: isSurveiSelesai
        ? "Tim Teknis dan Petugas Survey telah merampungkan peninjauan fisik bangunan di lokasi."
        : isSurveiActive
        ? "Tim sedang melakukan inspeksi fisik dan dokumentasi kerusakan bangunan di lapangan."
        : "Menunggu validasi administrasi selesai untuk penjadwalan survei lapangan.",
      status: isSurveiSelesai ? "SELESAI" : isSurveiActive ? "PROSES" : "PENDING",
      petugas: "Tim Teknis & Petugas Survey",
    });

    // === TAHAP 3: Analisis Kerusakan ===
    const isAnalisisSelesai = ['Selesai_Dianalisis', 'Menunggu_Pengesahan', 'Arsip_Digital'].includes(status);
    const analisisDate = new Date(date.getTime() + 1000 * 60 * 60 * 24);
    logs.push({
      waktu: isAnalisisSelesai ? analisisDate.toISOString() : "-",
      tahap: "Analisis",
      judul: isAnalisisSelesai ? "Analisis Kerusakan Selesai" : isSurveiActive ? "Analisis Sedang Berjalan" : "Analisis Kerusakan",
      deskripsi: isAnalisisSelesai
        ? "Penginputan detail kerusakan komponen dan perhitungan persentase kerusakan akhir telah selesai."
        : isSurveiActive
        ? "Tim Teknis sedang menginput dan menganalisis data kerusakan komponen bangunan."
        : "Menunggu pelaksanaan survei lapangan.",
      status: isAnalisisSelesai ? "SELESAI" : (isSurveiActive ? "PROSES" : "PENDING"),
      petugas: "Tim Teknis Lapangan",
    });

    // === TAHAP 4: Pengesahan (TTE Berurutan) ===
    const isPengesahanSelesai = status === 'Arsip_Digital';
    const isPengesahanActive = status === 'Menunggu_Pengesahan';
    const pengesahanDate = new Date(date.getTime() + 1000 * 60 * 60 * 25);

    // Build TTE progress description
    const tteRoles = ['Petugas_Survey', 'Tim_Teknis', 'Koordinator', 'Kabid', 'Kadis'];
    const tteRoleLabels: Record<string, string> = {
      'Petugas_Survey': 'Petugas Survey',
      'Tim_Teknis': 'Tim Teknis',
      'Koordinator': 'Koordinator',
      'Kabid': 'Kabid',
      'Kadis': 'Kadis'
    };
    const signedRoles = tteRoles.filter(r => tteSignatures[r]);
    const tteProgress = signedRoles.length > 0
      ? `TTE terkumpul: ${signedRoles.map(r => tteRoleLabels[r] || r).join(', ')} (${signedRoles.length}/${tteRoles.length}).`
      : '';

    logs.push({
      waktu: isPengesahanSelesai ? pengesahanDate.toISOString() : (isPengesahanActive ? new Date().toISOString() : "-"),
      tahap: "Pengesahan",
      judul: isPengesahanSelesai ? "Pengesahan Lengkap" : isPengesahanActive ? "Menunggu Tanda Tangan Pejabat" : "Pengesahan Pejabat",
      deskripsi: isPengesahanSelesai
        ? `Seluruh pejabat telah menandatangani. ${tteProgress}`
        : isPengesahanActive
        ? `Menunggu tanda tangan berurutan: Petugas Survey → Tim Teknis → Koordinator → Kabid → Kadis. ${tteProgress}`
        : "Menunggu analisis kerusakan selesai.",
      status: isPengesahanSelesai ? "SELESAI" : isPengesahanActive ? "PROSES" : "PENDING",
      petugas: isPengesahanActive && signedRoles.length > 0
        ? `Menunggu: ${tteRoles.filter(r => !tteSignatures[r]).map(r => tteRoleLabels[r] || r).join(', ')}`
        : "Koordinator → Kabid → Kadis",
      tteSignatures: isPengesahanActive || isPengesahanSelesai ? tteSignatures : undefined,
    });

    // === TAHAP 5: Arsip Digital ===
    const isArsipSelesai = status === 'Arsip_Digital';
    const arsipDate = new Date(date.getTime() + 1000 * 60 * 60 * 26);
    logs.push({
      waktu: isArsipSelesai ? arsipDate.toISOString() : "-",
      tahap: "Arsip",
      judul: isArsipSelesai ? "Tersimpan di Arsip Digital" : "Arsip Digital",
      deskripsi: isArsipSelesai
        ? "Dokumen rekomendasi penanganan telah diterbitkan resmi dan disimpan di Arsip Digital Negara."
        : "Menunggu seluruh pengesahan pejabat selesai.",
      status: isArsipSelesai ? "SELESAI" : (isPengesahanActive || isPengesahanSelesai ? "PROSES" : "PENDING"),
      petugas: "Sistem Arsip Digital",
    });

    res.json(logs);
  } catch (error) {
    console.error("GET assessment logs error", error);
    res.status(500).json({ error: "Failed to fetch disposition logs" });
  }
};

// --- NOTIFICATION HELPERS ---

async function createStatusUpdateNotification(idPermohonan: string, newStatus: string) {
  try {
    const [p] = await db.select().from(schema.permohonanPenilaian).where(eq(schema.permohonanPenilaian.idPermohonan, idPermohonan)).limit(1);
    if (!p) return;

    const [b] = await db.select().from(schema.profilBangunan).where(eq(schema.profilBangunan.idBangunan, p.idBangunan)).limit(1);
    if (!b) return;

    const creatorId = b.idUserPengelola;
    const statusText = newStatus.replace(/_/g, " ");

    const [inserted] = await db.insert(schema.notifications).values({
      userId: creatorId,
      title: "Pembaruan Status Permohonan",
      message: `Status permohonan untuk "${b.namaSekolahInstansi}" - "${b.namaMassaBangunan}" telah diperbarui menjadi "${statusText}".`,
      idPermohonan: idPermohonan,
    }).returning();

    if (inserted) {
      broadcastNotification(inserted);
      
      // Send Firebase Push Notification via centralized module
      const [user] = await db.select().from(schema.users).where(eq(schema.users.idUser, creatorId)).limit(1);
      if (user && user.fcmToken) {
        await sendPushNotification(user.fcmToken, inserted.title, inserted.message);
      }
    }
  } catch (err) {
    console.error("Failed to create status update notification", err);
  }
}

async function createDisposisiNotifications(idPermohonan: string, diteruskan: string[], notes: string) {
  try {
    const [p] = await db.select().from(schema.permohonanPenilaian).where(eq(schema.permohonanPenilaian.idPermohonan, idPermohonan)).limit(1);
    if (!p) return;

    const [b] = await db.select().from(schema.profilBangunan).where(eq(schema.profilBangunan.idBangunan, p.idBangunan)).limit(1);
    if (!b) return;

    const roleMapping: Record<string, string> = {
      "Kepala Bidang Bangunan Gedung": "Kabid",
      "Tim Teknis Penilai": "Tim_Teknis",
      "Sekretaris Dinas": "Koordinator",
      "Kepala Seksi Perencanaan": "Operator"
    };

    for (const item of diteruskan) {
      let targetRole: string | undefined = roleMapping[item];
      let targetUserId: number | null = null;
      let finalTargetRole: string | null = targetRole || null;

      if (item.startsWith("Tim Teknis - ")) {
        const userName = item.substring("Tim Teknis - ".length);
        const [u] = await db.select().from(schema.users).where(and(eq(schema.users.role, "Tim_Teknis"), eq(schema.users.namaLengkap, userName))).limit(1);
        if (u) {
          targetUserId = u.idUser;
          finalTargetRole = null; // Kirim spesifik ke user ini
        } else {
          finalTargetRole = "Tim_Teknis"; // Fallback ke semua Tim Teknis
        }
      }

      if (finalTargetRole || targetUserId) {
        const [inserted] = await db.insert(schema.notifications).values({
          targetRole: finalTargetRole,
          userId: targetUserId,
          title: "Disposisi Baru Ditugaskan",
          message: `Anda mendapat tugas disposisi baru untuk "${b.namaSekolahInstansi}" (${b.namaMassaBangunan}). Catatan: ${notes || "Harap ditindaklanjuti."}`,
          idPermohonan: idPermohonan,
        }).returning();

        if (inserted) {
          broadcastNotification(inserted);
        }
      }
    }
  } catch (err) {
    console.error("Failed to create disposisi notifications", err);
  }
}


export const put_assessments_bulk_status = async (req: express.Request, res: express.Response) => {
  try {
    const { ids, status } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: "ids array is required" });
    }
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    await db.update(schema.permohonanPenilaian)
      .set({ statusTerakhir: status })
      .where(inArray(schema.permohonanPenilaian.idPermohonan, ids));

    for (const id of ids) {
      createStatusUpdateNotification(id, status).catch(err => console.error("Notification trigger error:", err));
      
      const [p] = await db.select().from(schema.permohonanPenilaian).where(eq(schema.permohonanPenilaian.idPermohonan, id)).limit(1);
      const [b] = p ? await db.select().from(schema.profilBangunan).where(eq(schema.profilBangunan.idBangunan, p.idBangunan)).limit(1) : [null];
      
      await logAuditTrail(
        id,
        req,
        "Ubah Status",
        `Mengubah status permohonan untuk "${b ? b.namaSekolahInstansi : 'Sekolah'}" menjadi "${status.replace(/_/g, ' ')}" (secara massal).`
      );
    }

    res.json({ success: true, count: ids.length, status });
  } catch (error) {
    console.error("PUT bulk assessment status error", error);
    res.status(500).json({ error: "Failed to update bulk status" });
  }
};

export const put_assessments_by_id_status = async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required" });

    const [p] = await db.select().from(schema.permohonanPenilaian).where(eq(schema.permohonanPenilaian.idPermohonan, id)).limit(1);
    const [b] = p ? await db.select().from(schema.profilBangunan).where(eq(schema.profilBangunan.idBangunan, p.idBangunan)).limit(1) : [null];
    const oldStatus = p ? p.statusTerakhir : "Unknown";

    await db.update(schema.permohonanPenilaian)
      .set({ statusTerakhir: status })
      .where(eq(schema.permohonanPenilaian.idPermohonan, id));

    createStatusUpdateNotification(id, status).catch(err => console.error("Notification trigger error:", err));
    
    await logAuditTrail(
      id,
      req,
      "Ubah Status",
      `Mengubah status permohonan "${b ? b.namaSekolahInstansi : 'Sekolah'}" dari "${oldStatus.replace(/_/g, ' ')}" menjadi "${status.replace(/_/g, ' ')}".`
    );
    
    res.json({ success: true, status });
  } catch (error) {
    console.error("PUT assessment status error", error);
    res.status(500).json({ error: "Failed to update status" });
  }
};

export const put_assessments_by_id_disposisi = async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const { disposisiData, status } = req.body;

    const [p] = await db.select().from(schema.permohonanPenilaian).where(eq(schema.permohonanPenilaian.idPermohonan, id)).limit(1);
    const [b] = p ? await db.select().from(schema.profilBangunan).where(eq(schema.profilBangunan.idBangunan, p.idBangunan)).limit(1) : [null];

    const updateFields: any = {};
    if (disposisiData !== undefined) {
      updateFields.disposisiData = typeof disposisiData === "object" ? JSON.stringify(disposisiData) : disposisiData;
    }
    if (status !== undefined) {
      updateFields.statusTerakhir = status;
    }

    await db.update(schema.permohonanPenilaian)
      .set(updateFields)
      .where(eq(schema.permohonanPenilaian.idPermohonan, id));

    let details = `Melakukan disposisi untuk permohonan "${b ? b.namaSekolahInstansi : 'Sekolah'}".`;
    if (disposisiData !== undefined) {
      try {
        const dataObj = typeof disposisiData === "object" ? disposisiData : JSON.parse(disposisiData || "{}");
        if (Array.isArray(dataObj.diteruskan) && dataObj.diteruskan.length > 0) {
          createDisposisiNotifications(id, dataObj.diteruskan, dataObj.catatan).catch(err => console.error("Notification trigger error:", err));
        }
        details = `Mengisi Kartu Disposisi untuk "${b ? b.namaSekolahInstansi : 'Sekolah'}" (Bangunan: "${b ? b.namaMassaBangunan : 'Bangunan'}"): diteruskan ke ${Array.isArray(dataObj.diteruskan) ? dataObj.diteruskan.join(", ") : "Petugas"} dengan catatan: "${dataObj.catatan || '-'}".`;
      } catch (e) {
        console.error("Failed to parse disposisiData for notification", e);
      }
    }
    if (status !== undefined) {
      createStatusUpdateNotification(id, status).catch(err => console.error("Notification trigger error:", err));
      const oldStatus = p ? p.statusTerakhir : "Unknown";
      details += ` Status diperbarui dari "${oldStatus.replace(/_/g, ' ')}" menjadi "${status.replace(/_/g, ' ')}".`;
    }

    await logAuditTrail(
      id,
      req,
      "Disposisi",
      details
    );
    
    res.json({ success: true, disposisiData, status });
  } catch (error) {
    console.error("PUT assessment disposisi error", error);
    res.status(500).json({ error: "Failed to update disposisi" });
  }
};

export const put_assessments_by_id = async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const { schoolName, buildingName, buildingArea, floorCount, address, city, province, coordinates, components, photos, finalResult, documentLink, verification } = req.body;
    
    const [p] = await db.select().from(schema.permohonanPenilaian).where(eq(schema.permohonanPenilaian.idPermohonan, id)).limit(1);
    if (!p) return res.status(404).json({ error: "Permohonan tidak ditemukan" });

    const [b] = await db.select().from(schema.profilBangunan).where(eq(schema.profilBangunan.idBangunan, p.idBangunan)).limit(1);
    let parsedCustomFields = {};
    try {
      if (b && b.customFields) parsedCustomFields = JSON.parse(b.customFields);
    } catch(e) {}

    const newCustomFields = {
      ...parsedCustomFields,
      ...((req.body as any).customFields || {}),
      address: address || (parsedCustomFields as any).address,
      city: city || (parsedCustomFields as any).city,
      province: province || (parsedCustomFields as any).province,
      components: components || (parsedCustomFields as any).components,
      photos: photos || (parsedCustomFields as any).photos,
      documentLink: documentLink || (parsedCustomFields as any).documentLink,
      verification: verification || (parsedCustomFields as any).verification,
      safetyChecks: (req.body as any).safetyChecks || (parsedCustomFields as any).safetyChecks
    };

    let koordinatStr = b?.koordinatGps;
    if (coordinates && typeof coordinates.lat === 'number' && typeof coordinates.lng === 'number') {
      koordinatStr = `${coordinates.lat},${coordinates.lng}`;
    }

    await db.update(schema.profilBangunan)
      .set({ 
        namaSekolahInstansi: schoolName,
        namaMassaBangunan: buildingName,
        luasBangunanM2: String(buildingArea),
        jumlahLantai: Number(floorCount),
        koordinatGps: koordinatStr,
        customFields: JSON.stringify(newCustomFields)
      })
      .where(eq(schema.profilBangunan.idBangunan, p.idBangunan));
      
    if (finalResult) {
      await db.update(schema.permohonanPenilaian)
        .set({
          totalPersentaseKerusakan: String(finalResult.totalDamagePercentage),
          kesimpulanAkhir: `Rusak ${finalResult.category}` as any,
          urlDokumenHasilPdf: documentLink || p.urlDokumenHasilPdf
        })
        .where(eq(schema.permohonanPenilaian.idPermohonan, id));
    }
    
    await logAuditTrail(
      id,
      req,
      "Edit Penilaian",
      `Mengubah rincian penilaian/profil untuk "${schoolName}" (Bangunan: "${buildingName}"): Luas menjadi ${buildingArea} m², Lantai menjadi ${floorCount}.`
    );

    res.json({ success: true });
  } catch (error) {
    console.error("PUT assessment error", error);
    res.status(500).json({ error: "Failed to update assessment" });
  }
};

export const delete_assessments_by_id = async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    
    // Delete child records first (including notifications)
    await db.delete(schema.penilaianTahap1Keselamatan).where(eq(schema.penilaianTahap1Keselamatan.idPermohonan, id));
    await db.delete(schema.penilaianTahap2Volume).where(eq(schema.penilaianTahap2Volume.idPermohonan, id));
    await db.delete(schema.logDisposisi).where(eq(schema.logDisposisi.idPermohonan, id));
    await db.delete(schema.historyPenilaian).where(eq(schema.historyPenilaian.idPermohonan, id));
    await db.delete(schema.notifications).where(eq(schema.notifications.idPermohonan, id));
    await db.delete(schema.auditTrails).where(eq(schema.auditTrails.idPermohonan, id));
    await db.delete(schema.ikmResponses).where(eq(schema.ikmResponses.idPermohonan, id));
    
    // Delete permohonan
    await db.delete(schema.permohonanPenilaian).where(eq(schema.permohonanPenilaian.idPermohonan, id));
    
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE assessment error", error);
    res.status(500).json({ error: "Failed to delete assessment" });
  }
};

// ===== IKM (Indeks Kepuasan Masyarakat) & Testimoni =====

export const get_assessment_ikm = async (req: express.Request, res: express.Response) => {
  try {
    const idPermohonan = req.params.id;
    const userId = req.query.userId ? Number(req.query.userId) : null;

    if (!userId) {
      return res.status(400).json({ error: "userId query parameter is required" });
    }

    const existing = await db.select().from(schema.ikmResponses)
      .where(and(
        eq(schema.ikmResponses.idPermohonan, idPermohonan),
        eq(schema.ikmResponses.idUser, userId)
      ));

    if (existing.length > 0) {
      return res.json({ filled: true, data: existing[0] });
    }

    return res.json({ filled: false });
  } catch (error) {
    console.error("GET IKM response error", error);
    res.status(500).json({ error: "Failed to fetch IKM response" });
  }
};

export const post_assessment_ikm = async (req: express.Request, res: express.Response) => {
  try {
    const idPermohonan = req.params.id;
    const { userId, testimoni, answers, u1, u2, u3, u4, u5, u6, u7, u8, u9 } = req.body;

    if (!userId || !testimoni) {
      return res.status(400).json({ error: "userId and testimoni are required" });
    }

    // Support both legacy (u1-u9) and dynamic (answers object)
    const finalAnswers = answers || {
      u1, u2, u3, u4, u5, u6, u7, u8, u9
    };

    // Validate all scores are between 1-4
    const scores = Object.values(finalAnswers).map(Number);
    for (const score of scores) {
      if (!score || score < 1 || score > 4) {
        return res.status(400).json({ error: "Semua unsur harus diisi dengan nilai 1-4" });
      }
    }

    // Check if already submitted
    const existing = await db.select().from(schema.ikmResponses)
      .where(and(
        eq(schema.ikmResponses.idPermohonan, idPermohonan),
        eq(schema.ikmResponses.idUser, Number(userId))
      ));

    if (existing.length > 0) {
      return res.status(409).json({ error: "IKM sudah diisi untuk penilaian ini", data: existing[0] });
    }

    // Calculate IKM value (average of all unsur, converted to 0-100 scale)
    const totalScore = scores.reduce((sum: number, s: number) => sum + s, 0);
    const questionCount = scores.length || 9;
    const nilaiIkm = ((totalScore / (questionCount * 4)) * 100).toFixed(2);

    const [inserted] = await db.insert(schema.ikmResponses).values({
      idPermohonan,
      idUser: Number(userId),
      u1: finalAnswers.u1 || 0,
      u2: finalAnswers.u2 || 0,
      u3: finalAnswers.u3 || 0,
      u4: finalAnswers.u4 || 0,
      u5: finalAnswers.u5 || 0,
      u6: finalAnswers.u6 || 0,
      u7: finalAnswers.u7 || 0,
      u8: finalAnswers.u8 || 0,
      u9: finalAnswers.u9 || 0,
      answers: finalAnswers,
      nilaiIkm,
      testimoni,
    }).returning();

    res.json({ success: true, data: inserted });
  } catch (error) {
    console.error("POST IKM response error", error);
    res.status(500).json({ error: "Failed to save IKM response" });
  }
};

export const get_ikm_stats = async (req: express.Request, res: express.Response) => {
  try {
    const responses = await db.select().from(schema.ikmResponses);
    
    const totalResponses = responses.length;
    if (totalResponses === 0) {
      return res.json({
        totalResponses: 0,
        averageIKM: 0,
        averages: { u1: 0, u2: 0, u3: 0, u4: 0, u5: 0, u6: 0, u7: 0, u8: 0, u9: 0 },
        distribution: { "Sangat Baik": 0, "Baik": 0, "Kurang Baik": 0, "Tidak Baik": 0 }
      });
    }

    let totalIKM = 0;
    const sums: Record<string, number> = {};
    const distribution = { "Sangat Baik": 0, "Baik": 0, "Kurang Baik": 0, "Tidak Baik": 0 };

    responses.forEach(r => {
      const nilai = Number(r.nilaiIkm) || 0;
      totalIKM += nilai;
      
      const answers = typeof r.answers === 'string' ? JSON.parse(r.answers) : (r.answers || {
        u1: r.u1, u2: r.u2, u3: r.u3, u4: r.u4, u5: r.u5, u6: r.u6, u7: r.u7, u8: r.u8, u9: r.u9
      });

      Object.entries(answers).forEach(([key, val]) => {
        if (!sums[key]) sums[key] = 0;
        sums[key] += Number(val);
      });

      if (nilai >= 88.31) distribution["Sangat Baik"]++;
      else if (nilai >= 76.61) distribution["Baik"]++;
      else if (nilai >= 65.00) distribution["Kurang Baik"]++;
      else distribution["Tidak Baik"]++;
    });

    const averages: Record<string, number> = {};
    Object.entries(sums).forEach(([key, val]) => {
      averages[key] = Number((val / totalResponses).toFixed(2));
    });

    res.json({
      totalResponses,
      averageIKM: Number((totalIKM / totalResponses).toFixed(2)),
      averages,
      distribution
    });
  } catch (error) {
    console.error("GET IKM stats error", error);
    res.status(500).json({ error: "Failed to fetch IKM stats" });
  }
};

export const get_ikm_responses = async (req: express.Request, res: express.Response) => {
  try {
    const responses = await db.select().from(schema.ikmResponses);
    const permohonans = await db.select().from(schema.permohonanPenilaian);
    const buildings = await db.select().from(schema.profilBangunan);
    
    // Join logic mapping in memory
    const enriched = responses.map(r => {
      const p = permohonans.find(p => p.idPermohonan === r.idPermohonan);
      const b = p ? buildings.find(b => b.idBangunan === p.idBangunan) : null;
      
      return {
        ...r,
        buildingName: b ? b.namaMassaBangunan : "Unknown Building",
        schoolName: b ? b.namaSekolahInstansi : "Unknown School",
        date: p ? p.tanggalPengajuan : r.createdAt,
      };
    });
    
    // Sort by latest
    enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(enriched);
  } catch (error) {
    console.error("GET IKM responses error", error);
    res.status(500).json({ error: "Failed to fetch IKM responses" });
  }
};

export const get_ikm_questions = async (req: express.Request, res: express.Response) => {
  try {
    const questions = await db.select().from(schema.ikmQuestions).orderBy(schema.ikmQuestions.orderIndex);
    
    // Seed default if empty
    if (questions.length === 0) {
      const defaultQuestions = [
        { key: "u1", label: "Persyaratan Pelayanan", description: "Kemudahan memenuhi persyaratan teknis dan administratif", orderIndex: 1 },
        { key: "u2", label: "Sistem, Mekanisme, dan Prosedur", description: "Kemudahan tahapan pelayanan yang diberikan", orderIndex: 2 },
        { key: "u3", label: "Waktu Penyelesaian", description: "Jangka waktu yang diperlukan untuk menyelesaikan seluruh proses", orderIndex: 3 },
        { key: "u4", label: "Biaya/Tarif", description: "Ongkos yang dikenakan kepada penerima layanan", orderIndex: 4 },
        { key: "u5", label: "Produk Spesifikasi Jenis Pelayanan", description: "Hasil pelayanan yang diberikan dan diterima sesuai ketentuan", orderIndex: 5 },
        { key: "u6", label: "Kompetensi Pelaksana", description: "Kemampuan yang harus dimiliki oleh pelaksana", orderIndex: 6 },
        { key: "u7", label: "Perilaku Pelaksana", description: "Sikap petugas dalam memberikan pelayanan", orderIndex: 7 },
        { key: "u8", label: "Penanganan Pengaduan, Saran dan Masukan", description: "Tata cara pelaksanaan penanganan pengaduan", orderIndex: 8 },
        { key: "u9", label: "Sarana dan Prasarana", description: "Ketersediaan dan kualitas sarana infrastruktur pelayanan", orderIndex: 9 },
      ];
      await db.insert(schema.ikmQuestions).values(defaultQuestions);
      const newQuestions = await db.select().from(schema.ikmQuestions).orderBy(schema.ikmQuestions.orderIndex);
      return res.json(newQuestions);
    }
    
    res.json(questions);
  } catch (error) {
    console.error("GET ikm questions error", error);
    res.status(500).json({ error: "Failed to fetch IKM questions" });
  }
};

export const create_ikm_question = async (req: express.Request, res: express.Response) => {
  try {
    const { key, label, description, isActive, orderIndex } = req.body;
    const [inserted] = await db.insert(schema.ikmQuestions).values({
      key, label, description, isActive: isActive ?? true, orderIndex: orderIndex || 99
    }).returning();
    res.json(inserted);
  } catch (error) {
    console.error("Create ikm question error", error);
    res.status(500).json({ error: "Failed to create IKM question" });
  }
};

export const update_ikm_question = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { key, label, description, isActive, orderIndex } = req.body;
    const [updated] = await db.update(schema.ikmQuestions)
      .set({ key, label, description, isActive, orderIndex })
      .where(eq(schema.ikmQuestions.id, Number(id)))
      .returning();
    res.json(updated);
  } catch (error) {
    console.error("Update ikm question error", error);
    res.status(500).json({ error: "Failed to update IKM question" });
  }
};

export const delete_ikm_question = async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    await db.delete(schema.ikmQuestions).where(eq(schema.ikmQuestions.id, Number(id)));
    res.json({ success: true });
  } catch (error) {
    console.error("Delete ikm question error", error);
    res.status(500).json({ error: "Failed to delete IKM question" });
  }
};
