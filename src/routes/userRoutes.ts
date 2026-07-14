import express from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, ne, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { initMasterData } from '../utils/masterData';
import { getDbConfig, setDbConfig } from '../utils/configHelper';

const router = express.Router();

router.post("/api/users/fcm-token", async (req, res) => {
  try {
    const { uid, token } = req.body;
    if (!uid || !token) {
      return res.status(400).json({ error: "UID and token are required." });
    }
    await db.update(schema.users).set({ fcmToken: token }).where(eq(schema.users.uid, uid));
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to update FCM token:", error);
    res.status(500).json({ error: "Failed to update FCM token" });
  }
});

router.get("/api/users", async (req, res) => {
  try {
    await initMasterData();
    const data = await db.select().from(schema.users).orderBy(schema.users.idUser);
    res.json(data);
  } catch (error) {
    console.error("GET users error", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.post("/api/users", async (req, res) => {
  try {
    const { namaLengkap, email, role, kontakWhatsapp } = req.body;
    const uid = "user_" + uuidv4();
    const [newUser] = await db.insert(schema.users).values({
      uid,
      namaLengkap,
      email,
      role: role || 'Pengelola_Bangunan',
      kontakWhatsapp,
    }).returning();
    res.status(201).json(newUser);
  } catch (error) {
    console.error("POST users error", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.put("/api/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { namaLengkap, email, role, kontakWhatsapp } = req.body;
    const [updatedUser] = await db.update(schema.users)
      .set({
        namaLengkap,
        email,
        role: role || 'Pengelola_Bangunan',
        kontakWhatsapp,
      })
      .where(eq(schema.users.idUser, id))
      .returning();
    res.json(updatedUser);
  } catch (error) {
    console.error("PUT users error", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/api/users/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "ID User tidak valid." });
    }

    // 1. Ambil user yang akan dihapus
    const [userToDelete] = await db.select().from(schema.users).where(eq(schema.users.idUser, id)).limit(1);
    if (!userToDelete) {
      return res.status(404).json({ error: "User tidak ditemukan." });
    }

    // 2. Jika user adalah Administrator, pastikan masih ada Administrator lain
    if (userToDelete.role === "Administrator") {
      const admins = await db.select().from(schema.users).where(eq(schema.users.role, "Administrator"));
      if (admins.length <= 1) {
        return res.status(400).json({ error: "Tidak dapat menghapus user Administrator terakhir di dalam sistem." });
      }
    }

    // 3. Cari user pengganti (fallback user/admin) untuk re-assignment data terkait
    let [fallbackUser] = await db.select().from(schema.users)
      .where(and(eq(schema.users.role, "Administrator"), ne(schema.users.idUser, id)))
      .limit(1);

    if (!fallbackUser) {
      [fallbackUser] = await db.select().from(schema.users)
        .where(ne(schema.users.idUser, id))
        .limit(1);
    }

    if (!fallbackUser) {
      return res.status(400).json({ error: "Tidak dapat menghapus user karena tidak ada user lain di dalam sistem sebagai penanggung jawab pengganti." });
    }

    // 4. Update/reassign data terkait yang merujuk pada user ini agar tidak melanggar foreign key constraint:
    
    // A. Pengaturan Dinas (idKadis dan idKabid) - set ke null jika ditugaskan ke user ini
    await db.update(schema.pengaturanDinas)
      .set({ idKadis: null })
      .where(eq(schema.pengaturanDinas.idKadis, id));
      
    await db.update(schema.pengaturanDinas)
      .set({ idKabid: null })
      .where(eq(schema.pengaturanDinas.idKabid, id));

    // B. Profil Bangunan (idUserPengelola) - Reassign pengelola ke fallbackUser
    await db.update(schema.profilBangunan)
      .set({ idUserPengelola: fallbackUser.idUser })
      .where(eq(schema.profilBangunan.idUserPengelola, id));

    // C. Log Disposisi (idUserPengirim dan idUserPenerima) - Reassign pengirim/penerima ke fallbackUser
    await db.update(schema.logDisposisi)
      .set({ idUserPengirim: fallbackUser.idUser })
      .where(eq(schema.logDisposisi.idUserPengirim, id));

    await db.update(schema.logDisposisi)
      .set({ idUserPenerima: fallbackUser.idUser })
      .where(eq(schema.logDisposisi.idUserPenerima, id));

    // 5. Setelah semua referensi aman, hapus user dari tabel users
    await db.delete(schema.users).where(eq(schema.users.idUser, id));

    res.json({ success: true });
  } catch (error) {
    console.error("DELETE users error", error);
    res.status(500).json({ error: `Gagal menghapus user: ${(error as Error).message || error}` });
  }
});

// Dynamic Building General Parameters CRUD

const paramsFilePath = path.join(process.cwd(), "building_parameters.json");

async function readParamsFile() { return await getDbConfig('building_parameters', [
        { id: "schoolName", label: "Nama Sekolah / Instansi", type: "text", placeholder: "Contoh: SDN 1 Tegal", required: true, enabled: true },
        { id: "buildingName", label: "Nama Massa Bangunan", type: "text", placeholder: "Contoh: Gedung Kelas 1-3", required: true, enabled: true },
        { id: "npsn", label: "NPSN / NUP", type: "text", placeholder: "Contoh: 20205123", required: true, enabled: true },
        { id: "buildingArea", label: "Luas Bangunan (m²)", type: "number", placeholder: "Contoh: 150", required: true, enabled: true },
        { id: "floorCount", label: "Jumlah Lantai", type: "number", placeholder: "Contoh: 1", required: true, enabled: true },
        { id: "address", label: "Alamat Lengkap", type: "textarea", placeholder: "Contoh: Jl. Pembangunan No. 12", required: true, enabled: true }
]); }

async function writeParamsFile(params: any) { await setDbConfig('building_parameters', params); }

router.get("/api/building-parameters", async (req, res) => {
  const params = await readParamsFile();
  res.json(params);
});


router.put("/api/building-parameters/reorder", async (req, res) => {
  try {
    const { parameters } = req.body;
    if (!parameters || !Array.isArray(parameters)) {
      return res.status(400).json({ error: "Invalid payload" });
    }
    
    // Instead of completely replacing, we map to preserve any fields not sent
    // Actually if the UI sends the full object, we can just save it.
    // Let's assume UI sends the full array of parameter objects.
    await writeParamsFile(parameters);
    res.json({ success: true });
  } catch (error) {
    console.error("PUT building-parameters/reorder error", error);
    res.status(500).json({ error: "Failed to reorder building parameters" });
  }
});

router.post("/api/building-parameters", async (req, res) => {
  try {
    const { label, type, placeholder, required, enabled, showInPermohonan, showInPenilaian } = req.body;
    const params = await readParamsFile();
    
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") + "-" + Math.floor(Math.random() * 1000);
    
    const newParam = {
      id,
      label,
      type: type || "text",
      placeholder: placeholder || "",
      required: required === true || required === "true",
      enabled: enabled !== false && enabled !== "false",
      showInPermohonan: showInPermohonan !== false && showInPermohonan !== "false", // defaults to true
      showInPenilaian: showInPenilaian !== false && showInPenilaian !== "false" // defaults to true
    };
    
    params.push(newParam);
    await writeParamsFile(params);
    res.status(201).json(newParam);
  } catch (error) {
    console.error("POST building parameters error", error);
    res.status(500).json({ error: "Failed to add building parameter" });
  }
});

router.put("/api/building-parameters/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { label, type, placeholder, required, enabled, showInPermohonan, showInPenilaian } = req.body;
    const params = await readParamsFile();
    
    const index = params.findIndex((p: any) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Parameter not found" });
    }
    
    params[index] = {
      ...params[index],
      label: label !== undefined ? label : params[index].label,
      type: type !== undefined ? type : params[index].type,
      placeholder: placeholder !== undefined ? placeholder : params[index].placeholder,
      required: required !== undefined ? (required === true || required === "true") : params[index].required,
      enabled: enabled !== undefined ? (enabled === true || enabled === "true") : params[index].enabled,
      showInPermohonan: showInPermohonan !== undefined ? (showInPermohonan === true || showInPermohonan === "true") : (params[index].showInPermohonan !== false),
      showInPenilaian: showInPenilaian !== undefined ? (showInPenilaian === true || showInPenilaian === "true") : (params[index].showInPenilaian !== false)
    };
    
    await writeParamsFile(params);
    res.json(params[index]);
  } catch (error) {
    console.error("PUT building parameters error", error);
    res.status(500).json({ error: "Failed to update building parameter" });
  }
});

router.delete("/api/building-parameters/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const params = await readParamsFile();
    
    const filtered = params.filter((p: any) => p.id !== id);
    if (filtered.length === params.length) {
      return res.status(404).json({ error: "Parameter not found" });
    }
    
    await writeParamsFile(filtered);
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE building parameters error", error);
    res.status(500).json({ error: "Failed to delete building parameter" });
  }
});

// Dynamic Profile Parameters CRUD
const profileParamsFilePath = path.join(process.cwd(), "profile_parameters.json");
const userProfilesFilePath = path.join(process.cwd(), "user_profiles.json");

async function readProfileParamsFile() { return await getDbConfig('profile_parameters', [
        { id: "namaLengkap", label: "Nama Lengkap", type: "text", placeholder: "Nama Sesuai KTP", required: true, enabled: true },
        { id: "email", label: "Email", type: "text", placeholder: "contoh@email.com", required: true, enabled: true },
        { id: "kontakWhatsapp", label: "Kontak WhatsApp", type: "text", placeholder: "08123456789", required: true, enabled: true },
        { id: "role", label: "Role / Peran", type: "text", placeholder: "Pilih Role", required: true, enabled: true }
]); }

async function writeProfileParamsFile(params: any) { await setDbConfig('profile_parameters', params); }

async function readUserProfilesFile() { return await getDbConfig('user_profiles', {}); }

async function writeUserProfilesFile(profiles: any) { await setDbConfig('user_profiles', profiles); }

router.get("/api/profile-parameters", async (req, res) => {
  const params = await readProfileParamsFile();
  res.json(params);
});


router.put("/api/profile-parameters/reorder", async (req, res) => {
  try {
    const { parameters } = req.body;
    if (!parameters || !Array.isArray(parameters)) {
      return res.status(400).json({ error: "Invalid payload" });
    }
    
    await writeProfileParamsFile(parameters);
    res.json({ success: true });
  } catch (error) {
    console.error("PUT profile-parameters/reorder error", error);
    res.status(500).json({ error: "Failed to reorder profile parameters" });
  }
});

router.post("/api/profile-parameters", async (req, res) => {
  try {
    const { label, type, placeholder, required, enabled } = req.body;
    const params = await readProfileParamsFile();
    
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") + "-" + Math.floor(Math.random() * 1000);
    
    const newParam = {
      id,
      label,
      type: type || "text",
      placeholder: placeholder || "",
      required: required === true || required === "true",
      enabled: enabled !== false && enabled !== "false"
    };
    
    params.push(newParam);
    await writeProfileParamsFile(params);
    res.json(newParam);
  } catch (error) {
    console.error("POST profile parameters error", error);
    res.status(500).json({ error: "Failed to add profile parameter" });
  }
});

router.put("/api/profile-parameters/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { label, type, placeholder, required, enabled } = req.body;
    const params = await readProfileParamsFile();
    
    const index = params.findIndex((p: any) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Parameter not found" });
    }
    
    params[index] = {
      ...params[index],
      label: label !== undefined ? label : params[index].label,
      type: type !== undefined ? type : params[index].type,
      placeholder: placeholder !== undefined ? placeholder : params[index].placeholder,
      required: required !== undefined ? (required === true || required === "true") : params[index].required,
      enabled: enabled !== undefined ? (enabled === true || enabled === "true") : params[index].enabled
    };
    
    await writeProfileParamsFile(params);
    res.json(params[index]);
  } catch (error) {
    console.error("PUT profile parameters error", error);
    res.status(500).json({ error: "Failed to update profile parameter" });
  }
});

router.delete("/api/profile-parameters/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const params = await readProfileParamsFile();
    
    const filtered = params.filter((p: any) => p.id !== id);
    if (filtered.length === params.length) {
      return res.status(404).json({ error: "Parameter not found" });
    }
    
    await writeProfileParamsFile(filtered);
    res.json({ success: true });
  } catch (error) {
    console.error("DELETE profile parameters error", error);
    res.status(500).json({ error: "Failed to delete profile parameter" });
  }
});

// GET profile merged with database user record
router.get("/api/profile", async (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ error: "Email query param is required" });
    }

    // Find user in pg DB
    let dbUser = (await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1))[0];
    
    // If user does not exist in pg DB, let's auto-create them so they are a valid user
    if (!dbUser) {
      const uid = "user_" + uuidv4();
      const [newUser] = await db.insert(schema.users).values({
        uid,
        namaLengkap: email.split("@")[0],
        email: email,
        role: "Pengelola_Bangunan",
        kontakWhatsapp: ""
      }).returning();
      dbUser = newUser;
    }

    // Read custom fields from profiles JSON
    const profiles = await readUserProfilesFile() as any;
    const userProfile = profiles[email] || {};

    // Merge standard DB fields with custom JSON fields
    res.json({
      idUser: dbUser.idUser,
      uid: dbUser.uid,
      namaLengkap: dbUser.namaLengkap,
      email: dbUser.email,
      role: dbUser.role,
      kontakWhatsapp: dbUser.kontakWhatsapp,
      bio: userProfile.bio || "",
      photoURL: userProfile.photoURL || "",
      customFields: userProfile.customFields || {}
    });
  } catch (error) {
    console.error("GET profile error", error);
    res.status(500).json({ error: "Failed to fetch profile details" });
  }
});

// PUT profile
router.put("/api/profile", async (req, res) => {
  try {
    const { email, namaLengkap, kontakWhatsapp, role, bio, photoURL, customFields } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Update main fields in PG DB
    let dbUser = (await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1))[0];
    if (dbUser) {
      await db.update(schema.users)
        .set({
          namaLengkap: namaLengkap || dbUser.namaLengkap,
          kontakWhatsapp: kontakWhatsapp !== undefined ? kontakWhatsapp : dbUser.kontakWhatsapp,
          role: role || dbUser.role
        })
        .where(eq(schema.users.email, email));
    } else {
      // Auto create if missing
      const uid = "user_" + uuidv4();
      const [newUser] = await db.insert(schema.users).values({
        uid,
        namaLengkap: namaLengkap || email.split("@")[0],
        email: email,
        role: role || "Pengelola_Bangunan",
        kontakWhatsapp: kontakWhatsapp || ""
      }).returning();
      dbUser = newUser;
    }

    // Update profiles file for additional/custom fields
    const profiles = await readUserProfilesFile() as any;
    profiles[email] = {
      bio: bio || "",
      photoURL: photoURL || "",
      customFields: customFields || {}
    };
    await writeUserProfilesFile(profiles);

    res.json({ success: true });
  } catch (error) {
    console.error("PUT profile error", error);
    res.status(500).json({ error: "Failed to update profile details" });
  }
});

export default router;
