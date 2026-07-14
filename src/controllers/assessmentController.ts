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
        address: parsedCustomFields.address || (b && b.customFields && JSON.parse(b.customFields).address) || "Jl. Raya Pembangunan No. 123",
        city: parsedCustomFields.city || (b && b.customFields && JSON.parse(b.customFields).city) || "Unknown",
        province: parsedCustomFields.province || (b && b.customFields && JSON.parse(b.customFields).province) || "Unknown",
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
        customFields: { ...parsedCustomFields, idBangunan: b?.idBangunan }
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
          luasBangunanM2: payload.buildingArea.toString(),
          jumlahLantai: payload.floorCount || 1,
          customFields: JSON.stringify(customFieldsObj),
        }).returning();
        finalIdBangunan = profil.idBangunan;
      }
    }

    // 3. Insert Permohonan Penilaian
    const kesimpulan = payload.finalResult.category === 'Ringan' ? 'Rusak Ringan' : 
                       payload.finalResult.category === 'Sedang' ? 'Rusak Sedang' : 'Rusak Berat';
    
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
    res.status(500).json({ error: "Failed to save assessment" });
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
      address: parsedCustomFields.address || (b && b.customFields && JSON.parse(b.customFields).address) || "Jl. Raya Pembangunan No. 123",
      city: parsedCustomFields.city || (b && b.customFields && JSON.parse(b.customFields).city) || "Unknown",
      province: parsedCustomFields.province || (b && b.customFields && JSON.parse(b.customFields).province) || "Unknown",
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
      customFields: { ...parsedCustomFields, idBangunan: b?.idBangunan }
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

export const put_assessments_by_id_verification = async (req: express.Request, res: express.Response) => {
  try {
    const id = req.params.id;
    const { verification } = req.body;

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

    const isApproved = verification?.status === "Disetujui" || verification?.verified;
    const statusText = isApproved ? "Disetujui" : "Ditolak / Perlu Perbaikan";
    await logAuditTrail(
      id,
      req,
      "Verifikasi",
      `Melakukan verifikasi berkas permohonan untuk "${b.namaSekolahInstansi}" (Bangunan: "${b.namaMassaBangunan}") dengan status: "${statusText}". Catatan verifikasi: "${verification?.notes || '-'}".`
    );

    res.json({ success: true, verification });
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
    const status = p.statusTerakhir;

    const logs = [];

    // Log 1: Pengajuan
    logs.push({
      waktu: date.toISOString(),
      tahap: "Pengajuan",
      judul: "Permohonan Dikirim",
      deskripsi: "Berkas permohonan penilaian kerusakan telah diajukan secara online oleh Pemohon.",
      status: "SELESAI",
      petugas: "Pemohon (Sistem)",
    });

    // Log 2: Verifikasi
    const isVerifikasiSelesai = ["Survei_Lapangan", "Selesai_Dianalisis", "Arsip_Digital"].includes(status);
    const verifDate = new Date(date.getTime() + 1000 * 60 * 30); // 30 mins later
    logs.push({
      waktu: isVerifikasiSelesai ? verifDate.toISOString() : new Date().toISOString(),
      tahap: "Verifikasi",
      judul: "Verifikasi Kelengkapan Administrasi",
      deskripsi: isVerifikasiSelesai 
        ? "Dokumen surat permohonan resmi kedinasan dan parameter kelayakan bangunan telah diverifikasi lengkap oleh Bidang Bangunan."
        : "Berkas sedang dalam antrean verifikasi oleh petugas Bidang Bangunan.",
      status: isVerifikasiSelesai ? "SELESAI" : "PROSES",
      petugas: "Petugas Verifikator Bidang Bangunan",
    });

    // Log 3: Penjadwalan Survei
    const isSurveiSelesai = ["Selesai_Dianalisis", "Arsip_Digital"].includes(status);
    const isSurveiActive = status === "Survei_Lapangan";
    const surveiDate = new Date(date.getTime() + 1000 * 60 * 60 * 2); // 2 hours later
    if (isSurveiActive || isSurveiSelesai) {
      logs.push({
        waktu: surveiDate.toISOString(),
        tahap: "Disposisi",
        judul: "Disposisi Jadwal Survei Lapangan",
        deskripsi: isSurveiSelesai
          ? "Jadwal survei lapangan telah disetujui dan tim survei telah merampungkan pengecekan lapangan."
          : "Kepala Bidang Bangunan menyetujui disposisi. Jadwal peninjauan lapangan dikoordinasikan dengan Tim Teknis.",
        status: isSurveiSelesai ? "SELESAI" : "PROSES",
        petugas: "Kepala Bidang Bangunan Wilayah",
      });
    } else {
      logs.push({
        waktu: "-",
        tahap: "Disposisi",
        judul: "Penyusunan Disposisi Survei",
        deskripsi: "Menunggu penyelesaian verifikasi administrasi untuk penerbitan surat tugas survei lapangan.",
        status: "PENDING",
        petugas: "Koordinator Tim Teknis",
      });
    }

    // Log 4: Pelaksanaan Analisis
    const isAnalisisSelesai = ["Selesai_Dianalisis", "Arsip_Digital"].includes(status);
    const analisisDate = new Date(date.getTime() + 1000 * 60 * 60 * 24); // 1 day later
    if (isAnalisisSelesai) {
      logs.push({
        waktu: analisisDate.toISOString(),
        tahap: "Analisis",
        judul: "Penginputan & Analisis Kerusakan",
        deskripsi: "Tim Teknis telah menginput detail kerusakan komponen (Pondasi, Kolom, Balok, Atap) dan menghitung nilai persentase kerusakan akhir.",
        status: "SELESAI",
        petugas: "Tim Teknis Lapangan",
      });
    } else if (isSurveiActive) {
      logs.push({
        waktu: "-",
        tahap: "Analisis",
        judul: "Peninjauan Fisik Lapangan",
        deskripsi: "Tim Teknis sedang melakukan inspeksi fisik bangunan langsung di lokasi.",
        status: "PROSES",
        petugas: "Tim Teknis Lapangan",
      });
    } else {
      logs.push({
        waktu: "-",
        tahap: "Analisis",
        judul: "Pemeriksaan Visual",
        deskripsi: "Belum dijadwalkan.",
        status: "PENDING",
        petugas: "Tim Teknis",
      });
    }

    // Log 5: Pengarsipan Digital
    const isArsipSelesai = status === "Arsip_Digital";
    const arsipDate = new Date(date.getTime() + 1000 * 60 * 60 * 25); // 25 hours later
    if (isArsipSelesai) {
      logs.push({
        waktu: arsipDate.toISOString(),
        tahap: "Arsip",
        judul: "Penerbitan Rekomendasi & Pengarsipan",
        deskripsi: "Dokumen rekomendasi penanganan PUPR telah diterbitkan secara resmi dan disimpan ke dalam Arsip Digital Negara.",
        status: "SELESAI",
        petugas: "Kepala Dinas PUPR / Koordinator",
      });
    } else if (isAnalisisSelesai) {
      logs.push({
        waktu: "-",
        tahap: "Arsip",
        judul: "Finalisasi Laporan Rekomendasi",
        deskripsi: "Menunggu approval Kepala Dinas untuk penerbitan surat rekomendasi resmi rehabilitasi.",
        status: "PROSES",
        petugas: "Kepala Dinas PUPR",
      });
    } else {
      logs.push({
        waktu: "-",
        tahap: "Arsip",
        judul: "Arsip Digital",
        deskripsi: "Menunggu seluruh tahap analisis teknis lapangan selesai.",
        status: "PENDING",
        petugas: "Koordinator",
      });
    }

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
    
    // Delete permohonan
    await db.delete(schema.permohonanPenilaian).where(eq(schema.permohonanPenilaian.idPermohonan, id));
    
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE assessment error", error);
    res.status(500).json({ error: "Failed to delete assessment" });
  }
};


