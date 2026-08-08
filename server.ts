import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index";
import * as schema from "./src/db/schema";
import { eq, inArray, or, and, desc } from "drizzle-orm";

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
import waRoutes from "./src/routes/waRoutes";

// Initialize Firebase Admin once at startup
getFirebaseAdmin();

const app = express();
const PORT = 3000;

import { verifyToken, requireRole } from "./src/middleware/authMiddleware";
import { STAFF_ROLES, REPORT_ROLES, ADMIN_ROLES } from "./src/middleware/rolePolicies";

// New middleware imports
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";
import { createHttpLogger, auditLogger } from "./src/middleware/loggerMiddleware";
import { errorHandler, asyncHandler } from "./src/middleware/errorHandler";
import { logger } from "./src/utils/logger";

// --- Security & Middleware Setup ---
// Enable CORS
app.use(cors({
  origin: process.env.APP_URL || "http://localhost:5173",
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Security headers — CSP disabled in dev because Vite HMR needs inline scripts + WebSocket
const isDev = process.env.NODE_ENV !== "production";
app.use(helmet({
  contentSecurityPolicy: isDev ? false : {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", process.env.SUPABASE_URL || ""].filter(Boolean),
    },
  },
  crossOriginEmbedderPolicy: isDev ? false : undefined,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Body parsing dengan custom limit
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// HTTP Request Logging
app.use(createHttpLogger());

// Audit Logger (attach user info to request)
app.use(auditLogger);

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
  // EventSource cannot send Authorization headers — accept token via query string
  if (req.path === "/notifications/stream" && req.query.token && !req.headers.authorization) {
    req.headers.authorization = `Bearer ${String(req.query.token)}`;
  }

  const publicPaths = [
    { method: "GET", path: "/health" },
    { method: "GET", path: "/app-settings" },
    { method: "POST", path: "/auth/verify-turnstile" },
    { method: "GET", path: "/sso-settings/public" },
    { method: "POST", path: "/auth/sso/pupr-id" },
    { method: "GET", regex: /^\/assessments\/[a-zA-Z0-9_-]+\/validate-public$/ },
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

  return verifyToken(req, res, next);
});

// --- API Routes ---
app.use("/api/gemini", aiRoutes);
app.use("/api/wa", waRoutes);
app.use(assessmentRoutes);

app.get("/api/audit-trails", requireRole(...STAFF_ROLES), asyncHandler(async (req, res) => {
    // Optimized: SQL JOIN instead of 3 separate queries + in-memory join
    const rows = await db
      .select({
        idAudit: schema.auditTrails.idAudit,
        idPermohonan: schema.auditTrails.idPermohonan,
        userEmail: schema.auditTrails.userEmail,
        userName: schema.auditTrails.userName,
        role: schema.auditTrails.role,
        action: schema.auditTrails.action,
        details: schema.auditTrails.details,
        timestamp: schema.auditTrails.timestamp,
        schoolName: schema.profilBangunan.namaSekolahInstansi,
        buildingName: schema.profilBangunan.namaMassaBangunan,
      })
      .from(schema.auditTrails)
      .leftJoin(
        schema.permohonanPenilaian,
        eq(schema.auditTrails.idPermohonan, schema.permohonanPenilaian.idPermohonan)
      )
      .leftJoin(
        schema.profilBangunan,
        eq(schema.permohonanPenilaian.idBangunan, schema.profilBangunan.idBangunan)
      )
      .orderBy(desc(schema.auditTrails.timestamp));

    const mappedTrails = rows.map(t => ({
      ...t,
      timestamp: t.timestamp.toISOString(),
      schoolName: t.schoolName ?? null,
      buildingName: t.buildingName ?? null,
    }));

    res.json(mappedTrails);
}));

// --- Dashboard Stats Endpoint ---
app.get("/api/dashboard/stats", requireRole(...STAFF_ROLES), asyncHandler(async (req, res) => {
    const permohonans = await db.select().from(schema.permohonanPenilaian);
    const buildings = await db.select().from(schema.profilBangunan);
    const usersResult = await db.select().from(schema.users);

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

    // Top 5 highest damage — use SQL JOIN for building names
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
      totalUsers: usersResult.length,
      statusCounts,
      pendingLongCount: pendingLong,
      top5Damage,
      categoryCounts,
    });
}));

// --- SSE Notification Stream (uses centralized sseManager) ---
app.get("/api/notifications/stream", (req, res) => {
  registerSseClient(req, res);
});

app.get("/api/notifications", asyncHandler(async (req, res) => {
    const userId = req.query.userId ? Number(req.query.userId) : null;
    const role = req.query.role ? String(req.query.role) : null;

    // Optimized: filter at DB level instead of fetching all notifications
    const conditions = [];
    if (userId) conditions.push(eq(schema.notifications.userId, userId));
    if (role) conditions.push(eq(schema.notifications.targetRole, role));

    const filtered = conditions.length > 0
      ? await db.select().from(schema.notifications)
          .where(or(...conditions))
          .orderBy(desc(schema.notifications.createdAt))
      : [];

    res.json(filtered);
}));

app.put("/api/notifications/:id/read", asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    await db.update(schema.notifications)
      .set({ isRead: true })
      .where(eq(schema.notifications.idNotification, id));
    res.json({ success: true });
}));

app.put("/api/notifications/read-all", asyncHandler(async (req, res) => {
    const userId = req.body.userId ? Number(req.body.userId) : null;
    const role = req.body.role ? String(req.body.role) : null;

    // Optimized: build WHERE clause to filter at DB level
    const conditions = [eq(schema.notifications.isRead, false)];
    const userConditions = [];
    if (userId) userConditions.push(eq(schema.notifications.userId, userId));
    if (role) userConditions.push(eq(schema.notifications.targetRole, role));

    if (userConditions.length > 0) {
      conditions.push(or(...userConditions)!);
    }

    const unreadNotifications = await db.select({ id: schema.notifications.idNotification })
      .from(schema.notifications)
      .where(and(...conditions));

    const idsToUpdate = unreadNotifications.map(n => n.id);

    if (idsToUpdate.length > 0) {
      await db.update(schema.notifications)
        .set({ isRead: true })
        .where(inArray(schema.notifications.idNotification, idsToUpdate));
    }

    res.json({ success: true, updatedCount: idsToUpdate.length });
}));

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

// 404 handler
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({ error: "API endpoint not found" });
  } else {
    next();
  }
});

// Error Handler (HARUS di akhir setelah semua routes)
app.use(errorHandler);

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
    logger.info({
      event: "server_started",
      port: PORT,
      environment: process.env.NODE_ENV,
      message: `Server running on http://0.0.0.0:${PORT}`,
    });
    console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
