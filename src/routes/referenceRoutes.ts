import express from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Dummy initMasterData for now to prevent errors
async function initMasterData() {}

router.get("/api/components", async (req, res) => {
  try {
    await initMasterData();
    const components = await db.select().from(schema.masterKomponen).orderBy(schema.masterKomponen.urutan, schema.masterKomponen.idKomponen);
    res.json(components);
  } catch (error) {
    console.error("GET components error", error);
    res.status(500).json({ error: "Failed to fetch components" });
  }
});


router.put("/api/components/reorder", async (req, res) => {
  try {
    const { components } = req.body;
    if (!components || !Array.isArray(components)) {
      return res.status(400).json({ error: "Invalid payload" });
    }
    for (let i = 0; i < components.length; i++) {
      await db.update(schema.masterKomponen)
        .set({ urutan: components[i].urutan })
        .where(eq(schema.masterKomponen.idKomponen, components[i].idKomponen));
    }
    res.json({ success: true });
  } catch (error) {
    console.error("PUT components/reorder error", error);
    res.status(500).json({ error: "Failed to reorder components" });
  }
});

router.post("/api/components", async (req, res) => {
  try {
    const { kategoriKomponen, namaKomponen, satuan, bobotFormA, bobotFormB, bobotFormC, tooltipText, tooltipImage } = req.body;
    const [newComp] = await db.insert(schema.masterKomponen).values({
      kategoriKomponen: kategoriKomponen || 'Struktur',
      namaKomponen,
      satuan: satuan || '%',
      bobotFormA: bobotFormA || '0.00',
      bobotFormB: bobotFormB || '0.00',
      bobotFormC: bobotFormC || '0.00',
      tooltipText,
      tooltipImage,
    }).returning();
    res.status(201).json(newComp);
  } catch (error) {
    console.error("POST components error", error);
    res.status(500).json({ error: "Failed to create component" });
  }
});

router.put("/api/components/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { kategoriKomponen, namaKomponen, satuan, bobotFormA, bobotFormB, bobotFormC, tooltipText, tooltipImage } = req.body;
    
    const [updatedComp] = await db.update(schema.masterKomponen)
      .set({
        kategoriKomponen,
        namaKomponen,
        satuan,
        bobotFormA: bobotFormA?.toString(),
        bobotFormB: bobotFormB?.toString(),
        bobotFormC: bobotFormC?.toString(),
        tooltipText,
        tooltipImage,
      })
      .where(eq(schema.masterKomponen.idKomponen, id))
      .returning();
      
    res.json(updatedComp);
  } catch (error) {
    console.error("PUT components error", error);
    res.status(500).json({ error: "Failed to update component" });
  }
});

router.delete("/api/components/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Cascading deletes to avoid foreign key violations
    await db.delete(schema.masterKatalogVisual).where(eq(schema.masterKatalogVisual.idKomponen, id));
    await db.delete(schema.penilaianTahap1Keselamatan).where(eq(schema.penilaianTahap1Keselamatan.idKomponen, id));
    await db.delete(schema.penilaianTahap2Volume).where(eq(schema.penilaianTahap2Volume.idKomponen, id));
    
    await db.delete(schema.masterKomponen)
      .where(eq(schema.masterKomponen.idKomponen, id));
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE components error", error);
    res.status(500).json({ error: "Failed to delete component" });
  }
});

// Master Klasifikasi Kerusakan
router.get("/api/klasifikasi", async (req, res) => {
  try {
    await initMasterData();
    const data = await db.select().from(schema.masterKlasifikasiKerusakan);
    res.json(data);
  } catch (error) {
    console.error("GET classifications error", error);
    res.status(500).json({ error: "Failed to fetch classifications" });
  }
});

// Master Katalog Visual CRUD
router.get("/api/katalog", async (req, res) => {
  try {
    await initMasterData();
    const result = await db.select({
      idKatalog: schema.masterKatalogVisual.idKatalog,
      idKomponen: schema.masterKatalogVisual.idKomponen,
      idKlasifikasi: schema.masterKatalogVisual.idKlasifikasi,
      deskripsiPupr: schema.masterKatalogVisual.deskripsiPupr,
      urlFotoContoh: schema.masterKatalogVisual.urlFotoContoh,
      namaKomponen: schema.masterKomponen.namaKomponen,
      namaKlasifikasi: schema.masterKlasifikasiKerusakan.namaKlasifikasi
    })
    .from(schema.masterKatalogVisual)
    .leftJoin(schema.masterKomponen, eq(schema.masterKatalogVisual.idKomponen, schema.masterKomponen.idKomponen))
    .leftJoin(schema.masterKlasifikasiKerusakan, eq(schema.masterKatalogVisual.idKlasifikasi, schema.masterKlasifikasiKerusakan.idKlasifikasi))
    .orderBy(schema.masterKatalogVisual.idKatalog);
    
    res.json(result);
  } catch (error) {
    console.error("GET katalog error", error);
    res.status(500).json({ error: "Failed to fetch katalog visual" });
  }
});

router.post("/api/katalog", async (req, res) => {
  try {
    const { idKomponen, idKlasifikasi, deskripsiPupr, urlFotoContoh } = req.body;
    const [newKatalog] = await db.insert(schema.masterKatalogVisual).values({
      idKomponen: parseInt(idKomponen),
      idKlasifikasi: parseInt(idKlasifikasi),
      deskripsiPupr,
      urlFotoContoh
    }).returning();
    res.status(201).json(newKatalog);
  } catch (error) {
    console.error("POST katalog error", error);
    res.status(500).json({ error: "Failed to create katalog visual" });
  }
});

router.put("/api/katalog/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { idKomponen, idKlasifikasi, deskripsiPupr, urlFotoContoh } = req.body;
    const [updatedKatalog] = await db.update(schema.masterKatalogVisual)
      .set({
        idKomponen: parseInt(idKomponen),
        idKlasifikasi: parseInt(idKlasifikasi),
        deskripsiPupr,
        urlFotoContoh
      })
      .where(eq(schema.masterKatalogVisual.idKatalog, id))
      .returning();
    res.json(updatedKatalog);
  } catch (error) {
    console.error("PUT katalog error", error);
    res.status(500).json({ error: "Failed to update katalog visual" });
  }
});

router.delete("/api/katalog/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(schema.masterKatalogVisual)
      .where(eq(schema.masterKatalogVisual.idKatalog, id));
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE katalog error", error);
    res.status(500).json({ error: "Failed to delete katalog visual" });
  }
});

// Pengaturan Dinas CRUD
router.get("/api/dinas", async (req, res) => {
  try {
    let data = await db.select().from(schema.pengaturanDinas).limit(1);
    if (data.length === 0) {
      const [newDinas] = await db.insert(schema.pengaturanDinas).values({
        namaDinas: 'Dinas Pekerjaan Umum dan Penataan Ruang',
        alamat: 'Jalan Raya Pembangunan No. 123, Garut'
      }).returning();
      data = [newDinas];
    }
    
    // Attach user names if available
    const dinas = data[0];
    let namaKadis = null;
    let namaKabid = null;
    
    if (dinas.idKadis) {
      const [kadis] = await db.select().from(schema.users).where(eq(schema.users.idUser, dinas.idKadis)).limit(1);
      if (kadis) namaKadis = kadis.namaLengkap;
    }
    if (dinas.idKabid) {
      const [kabid] = await db.select().from(schema.users).where(eq(schema.users.idUser, dinas.idKabid)).limit(1);
      if (kabid) namaKabid = kabid.namaLengkap;
    }

    res.json({
      ...dinas,
      namaKadis,
      namaKabid
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch dinas settings" });
  }
});

router.put("/api/dinas", async (req, res) => {
  try {
    const payload = req.body;
    let data = await db.select().from(schema.pengaturanDinas).limit(1);
    if (data.length === 0) {
      const [newDinas] = await db.insert(schema.pengaturanDinas).values({
        namaDinas: payload.namaDinas || 'Dinas Pekerjaan Umum dan Penataan Ruang',
        alamat: payload.alamat || 'Jalan Raya Pembangunan No. 123, Garut',
        kontak: payload.kontak,
        email: payload.email,
        website: payload.website,
        idKadis: payload.idKadis,
        idKabid: payload.idKabid
      }).returning();
      res.json(newDinas);
    } else {
      const [updated] = await db.update(schema.pengaturanDinas).set({
        namaDinas: payload.namaDinas,
        alamat: payload.alamat,
        kontak: payload.kontak,
        email: payload.email,
        website: payload.website,
        idKadis: payload.idKadis,
        idKabid: payload.idKabid
      }).where(eq(schema.pengaturanDinas.id, data[0].id)).returning();
      res.json(updated);
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update dinas settings" });
  }
});

export default router;
