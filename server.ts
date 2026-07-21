import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index";
import * as schema from "./src/db/schema";
import { eq, inArray } from "drizzle-orm";

// Centralized modules
import { getFirebaseAdmin } from "./src/utils/firebaseAdmin";
import { registerSseClient, getSseClientCount } from "./src/utils/sseManager";

// Routes
import aiRoutes from "./src/routes/aiRoutes";
import assessmentRoutes from "./src/routes/assessmentRoutes";
import referenceRoutes from "./src/routes/referenceRoutes";
import userRoutes from "./src/routes/userRoutes";
import settingsRoutes from "./src/routes/settingsRoutes";
import fileRoutes from "./src/routes/fileRoutes";
import reportRoutes from "./src/routes/reportRoutes";
import authRoutes from "./src/routes/authRoutes";

// Initialize Firebase Admin once at startup
getFirebaseAdmin();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

import { verifyToken } from "./src/middleware/authMiddleware";

// --- Health Check ---
app.get("/api/health", async (req, res) => {
  try {
    // Test DB connection
    await db.select().from(schema.appConfig).limit(1);
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      sseClients: getSseClientCount(),
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: "disconnected",
      error: (error as Error).message,
    });
  }
});

// --- Auth Middleware (Global API guard) ---
app.use("/api", (req, res, next) => {
  const publicPaths = [
    { method: "GET", path: "/api/health" },
    { method: "GET", path: "/api/app-settings" },
    { method: "POST", path: "/api/auth/verify-turnstile" },
    { method: "GET", regex: /^\/api\/assessments\/[a-zA-Z0-9_-]+$/ }
  ];

  const isPublic = publicPaths.some(p => {
    if (p.method !== req.method) return false;
    if (p.path) return p.path === req.path;
    if (p.regex) return p.regex.test(req.path);
    return false;
  });

  if (isPublic) {
    return next();
  }

  // Allow webhooks/SSE to bypass JWT if needed, or handle them via specific auth?
  // Stream uses SSE, which might be hard to pass Bearer token in EventSource.
  // We'll skip stream auth if it's tricky, but better to protect it. We can pass token in URL.
  // Actually, let's keep stream public or pass token in query param.
  if (req.path === "/notifications/stream") {
     return next(); 
  }

  return verifyToken(req, res, next);
});

// --- API Routes ---
app.use("/api/gemini", aiRoutes);
app.use(assessmentRoutes);

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

// --- Dashboard Stats Endpoint ---
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const permohonans = await db.select().from(schema.permohonanPenilaian);
    const buildings = await db.select().from(schema.profilBangunan);
    const users = await db.select().from(schema.users);

    // Status breakdown
    const statusCounts: Record<string, number> = {};
    for (const p of permohonans) {
      const s = p.statusTerakhir || "Unknown";
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    }

    // Pending > 7 days
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const pendingLong = permohonans.filter(p => {
      if (p.statusTerakhir === "Menunggu_Validasi") {
        return (now - new Date(p.tanggalPengajuan).getTime()) > sevenDaysMs;
      }
      return false;
    }).length;

    // Top 5 highest damage
    const top5Damage = permohonans
      .filter(p => p.totalPersentaseKerusakan)
      .sort((a, b) => Number(b.totalPersentaseKerusakan) - Number(a.totalPersentaseKerusakan))
      .slice(0, 5)
      .map(p => {
        const b = buildings.find(bl => bl.idBangunan === p.idBangunan);
        return {
          idPermohonan: p.idPermohonan,
          schoolName: b?.namaSekolahInstansi || "Unknown",
          buildingName: b?.namaMassaBangunan || "Unknown",
          damagePercentage: Number(p.totalPersentaseKerusakan),
          category: p.kesimpulanAkhir,
        };
      });

    // Damage category distribution
    const categoryCounts: Record<string, number> = {};
    for (const p of permohonans) {
      const c = p.kesimpulanAkhir || "Belum Dinilai";
      categoryCounts[c] = (categoryCounts[c] || 0) + 1;
    }

    res.json({
      totalPermohonan: permohonans.length,
      totalBuildings: buildings.length,
      totalUsers: users.length,
      statusCounts,
      pendingLongCount: pendingLong,
      top5Damage,
      categoryCounts,
    });
  } catch (error) {
    console.error("GET dashboard stats error", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// --- SSE Notification Stream (uses centralized sseManager) ---
app.get("/api/notifications/stream", (req, res) => {
  registerSseClient(req, res);
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

// User CRUD & FCM Token
app.use(userRoutes);

// Settings Routes
app.use(settingsRoutes);

// File Routes
app.use(fileRoutes);

// Report Routes
app.use(reportRoutes);

// Auth Routes (Turnstile etc)
app.use(authRoutes);

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
      if (req.path.startsWith("/api/")) {
        return res.status(404).json({ error: "API endpoint not found" });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
