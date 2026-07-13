import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { Assessment } from "./src/types";
import { db } from "./src/db/index";
import * as schema from "./src/db/schema";
import { initializeApp as initAdminApp, getApps, getApp } from "firebase-admin/app";
import { getMessaging as getAdminMessaging } from "firebase-admin/messaging";

// Initialize Firebase Admin
let adminApp;
try {
  if (getApps().length === 0) {
    adminApp = initAdminApp();
    console.log("Firebase Admin initialized successfully.");
  } else {
    adminApp = getApp();
    console.log("Firebase Admin already initialized.");
  }
} catch (error) {
  console.error("Failed to initialize Firebase Admin:", error);
}

import { eq, and, ne, inArray } from "drizzle-orm";
import aiRoutes from "./src/routes/aiRoutes";
import assessmentRoutes from "./src/routes/assessmentRoutes";
import referenceRoutes from "./src/routes/referenceRoutes";
import userRoutes from "./src/routes/userRoutes";
import settingsRoutes from "./src/routes/settingsRoutes";
import fileRoutes from "./src/routes/fileRoutes";
import { getDbConfig, setDbConfig, readLetterParamsFile, writeLetterParamsFile, readAppSettingsFile, writeAppSettingsFile } from './src/utils/configHelper';
import { initMasterData } from './src/utils/masterData';


import { logAuditTrail, sendDisposisiNotification } from "./src/utils/audit";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/api/gemini", aiRoutes);



app.get("/api/audit-trails", async (req, res) => {
  try {
    const trails = await db.select().from(schema.auditTrails);
    const permohonans = await db.select().from(schema.permohonanPenilaian);
    const profilBangunans = await db.select().from(schema.profilBangunan);

    const mappedTrails = trails.map(t => {
      const p = permohonans.find(perm => perm.idPermohonan === t.idPermohonan);
      const b = p ? profilBangunans.find(pb => pb.idBangunan === p.idBangunan) : null;
      return {
        idAudit: t.idAudit,
        idPermohonan: t.idPermohonan,
        userEmail: t.userEmail,
        userName: t.userName,
        role: t.role,
        action: t.action,
        details: t.details,
        timestamp: t.timestamp.toISOString(),
        schoolName: b ? b.namaSekolahInstansi : null,
        buildingName: b ? b.namaMassaBangunan : null,
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(mappedTrails);
  } catch (error) {
    console.error("GET audit trails error", error);
    res.status(500).json({ error: "Failed to fetch audit trails" });
  }
});

// Simple in-memory store for assessments
const dbPath = path.join(process.cwd(), "assessments.json");

// Initialize Master Data

app.use(assessmentRoutes);

interface SseClient {
  res: express.Response;
  userId: number | null;
  role: string | null;
}
const sseClients: SseClient[] = [];

app.get("/api/notifications/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive",
  });

  const userId = req.query.userId ? Number(req.query.userId) : null;
  const role = req.query.role ? String(req.query.role) : null;

  const client: SseClient = { res, userId, role };
  sseClients.push(client);

  res.write("data: connected\n\n");

  const heartbeat = setInterval(() => {
    res.write(":\n\n");
  }, 30000);

  req.on("close", () => {
    clearInterval(heartbeat);
    const idx = sseClients.indexOf(client);
    if (idx !== -1) {
      sseClients.splice(idx, 1);
    }
  });
});

app.get("/api/notifications", async (req, res) => {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : null;
    const role = req.query.role ? String(req.query.role) : null;

    const allNotifications = await db.select().from(schema.notifications);

    const filtered = allNotifications.filter(n => {
      if (n.userId && userId && n.userId === userId) {
        return true;
      }
      if (n.targetRole && role && n.targetRole === role) {
        return true;
      }
      return false;
    });

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json(filtered);
  } catch (error) {
    console.error("GET notifications error", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

app.put("/api/notifications/:id/read", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.idNotification, id));
    res.json({ success: true });
  } catch (error) {
    console.error("PUT read notification error", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
});

app.put("/api/notifications/read-all", async (req, res) => {
  try {
    const userId = req.body.userId ? Number(req.body.userId) : null;
    const role = req.body.role ? String(req.body.role) : null;

    const allNotifications = await db.select().from(schema.notifications).where(eq(schema.notifications.isRead, false));
    
    const idsToUpdate = allNotifications
      .filter(n => {
        if (n.userId && userId && n.userId === userId) return true;
        if (n.targetRole && role && n.targetRole === role) return true;
        return false;
      })
      .map(n => n.idNotification);

    if (idsToUpdate.length > 0) {
      await db.update(schema.notifications)
        .set({ isRead: true })
        .where(inArray(schema.notifications.idNotification, idsToUpdate));
    }

    res.json({ success: true, updatedCount: idsToUpdate.length });
  } catch (error) {
    console.error("PUT read all notifications error", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
});


// Master Komponen CRUD
app.use(referenceRoutes);


// User CRUD
// Endpoint to save FCM token
app.use(userRoutes);


// GET & PUT Letter Configuration

app.use(settingsRoutes);


async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
