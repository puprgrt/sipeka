import { Router, Request, Response } from "express";
import multer from "multer";
import { db } from "../db/index";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";
import { uploadToSystemDrive } from "../lib/driveBackup";

const router = Router();

// Configure multer to store files in memory before uploading to Drive
const upload = multer({ storage: multer.memoryStorage() });

export const MOCK_FILES = [
  { id: "f1", name: "Laporan Kerusakan", type: "folder", updatedAt: "2026-07-10T10:00:00Z", author: "System", folderId: null, accessRole: ["Administrator", "Kadis", "Kabid", "Koordinator"] },
  { id: "f2", name: "Surat Disposisi", type: "folder", updatedAt: "2026-07-09T14:20:00Z", author: "System", folderId: null, accessRole: ["Administrator", "Kadis", "Kabid"] },
  { id: "f3", name: "Dokumen Sekolah", type: "folder", updatedAt: "2026-07-08T09:15:00Z", author: "System", folderId: null, accessRole: ["Administrator", "Pengelola_Bangunan", "Operator"] },
  { id: "f4", name: "Foto Lapangan", type: "folder", updatedAt: "2026-07-05T11:45:00Z", author: "System", folderId: null, accessRole: ["Administrator", "Tim_Teknis", "Koordinator"] }
];

router.get("/api/files", async (req: Request, res: Response) => {
  try {
    const role = (req.user?.role || req.query.role) as string;
    
    // Fetch real files from database
    const dbFiles = await db.select().from(schema.dokumenDigital);
    const users = await db.select().from(schema.users);
    
    // Map to FileItem format for frontend
    const mappedFiles = await Promise.all(dbFiles.map(async f => {
      const u = users.find(u => u.idUser === f.idUser);
      let type = "other";
      if (f.mimeType === "application/pdf") type = "pdf";
      else if (f.mimeType?.startsWith("image/")) type = "image";
      
      let previewUrl = f.urlGdriveSistem || f.urlGdriveUser;
      if (f.urlR2) {
        try {
          previewUrl = await getSignedUrlFromR2(f.urlR2);
        } catch (e) {
          console.error("Failed to generate signed url for", f.urlR2);
        }
      }

      const accessRole = ["Administrator", "Kadis", "Kabid", "Koordinator", "Tim_Teknis", "Operator", "Pengelola_Bangunan"];
      
      return {
        id: f.idDokumen,
        name: f.namaFile,
        type: type,
        size: f.sizeBytes,
        updatedAt: f.createdAt,
        author: u ? u.namaLengkap : "Unknown",
        folderId: null,
        accessRole,
        previewUrl: previewUrl,
        ownerId: f.idUser,
      };
    }));

    const visibleFiles = mappedFiles.filter(f => {
      if (role === "Administrator") return true;
      if (f.ownerId === req.user?.idUser) return true;
      return f.accessRole.includes(role);
    });
    
    const visibleFolders = MOCK_FILES.filter(f => !role || f.accessRole.includes(role));
    
    res.json([...visibleFolders, ...visibleFiles]);
  } catch (error) {
    console.error("GET /api/files error:", error);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

import { uploadToR2, getSignedUrlFromR2 } from "../lib/r2Service";
import { requireRole } from "../middleware/authMiddleware";
import { STAFF_ROLES } from "../middleware/rolePolicies";

// Endpoint to backup file to system drive and save metadata to DB
router.post("/api/drive/backup", requireRole(...STAFF_ROLES, 'Pengelola_Bangunan'), upload.single("file"), async (req: Request, res: Response): Promise<any> => {
  try {
    const file = (req as any).file;
    const { idUser, tipeDokumen, urlGdriveUser, namaFile } = req.body;

    const resolvedIdUser = idUser ? Number(idUser) : req.user?.idUser ?? null;
    const resolvedNamaFile = namaFile || file?.originalname || `backup-${Date.now()}`;

    if (!resolvedIdUser || !resolvedNamaFile) {
      return res.status(400).json({ error: "Missing required fields: idUser, namaFile" });
    }

    const isAdmin = req.user?.role === 'Administrator';
    if (!isAdmin && resolvedIdUser !== req.user?.idUser) {
      return res.status(403).json({ error: "Forbidden: Cannot upload files for another user" });
    }

    let urlGdriveSistem = null;
    let urlR2 = null;

    if (file) {
      // 1. Upload to system drive using service account
      try {
        urlGdriveSistem = await uploadToSystemDrive(file.buffer, file.originalname || namaFile, file.mimetype);
      } catch (err) {
        console.error("Gdrive backup failed, continuing with R2 if configured", err);
      }
      
      // 2. Upload to Cloudflare R2
      try {
        urlR2 = await uploadToR2(file.originalname || namaFile, file.buffer, file.mimetype);
      } catch (err) {
        console.error("R2 backup failed", err);
      }
    }

    // Insert to DB
    const newDoc = await db.insert(schema.dokumenDigital).values({
      idUser: resolvedIdUser,
      namaFile: resolvedNamaFile,
      urlGdriveUser: urlGdriveUser || null,
      urlGdriveSistem: urlGdriveSistem,
      urlR2: urlR2,
      tipeDokumen: tipeDokumen || "Unggahan_Bebas",
      mimeType: file?.mimetype || null,
      sizeBytes: file?.size || 0,
    }).returning();

    // Generate signed URL if we have R2 object key
    let publicUrl = urlGdriveSistem;
    if (urlR2) {
      publicUrl = await getSignedUrlFromR2(urlR2);
    }

    res.json({ success: true, document: { ...newDoc[0], previewUrl: publicUrl } });
  } catch (error: any) {
    console.error("POST /api/drive/backup error:", error);
    res.status(500).json({
      error: "Failed to backup file",
      details: error?.message || "Unknown error"
    });
  }
});

export default router;
