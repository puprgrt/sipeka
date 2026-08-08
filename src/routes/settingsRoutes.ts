import express from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { readAppSettingsFile, writeAppSettingsFile, readLetterParamsFile, writeLetterParamsFile, readAiSettings, writeAiSettings, readDocumentTemplates, writeDocumentTemplates, readSsoSettings, writeSsoSettings } from '../utils/configHelper';


import { requireRole } from '../middleware/authMiddleware';
import { ADMIN_ROLES } from '../middleware/rolePolicies';

const router = express.Router();

router.get("/api/app-settings", async (req, res) => {
  const params = await readAppSettingsFile();
  res.json(params);
});

router.put("/api/app-settings", requireRole('Administrator'), async (req, res) => {
  try {
    const updated = req.body;
    await writeAppSettingsFile(updated);
    res.json(updated);
  } catch (error) {
    console.error("PUT app settings error", error);
    res.status(500).json({ error: "Failed to update app settings" });
  }
});

router.get("/api/pengaturan-surat", async (req, res) => {
  const params = await readLetterParamsFile();
  res.json(params);
});

router.put("/api/pengaturan-surat", requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { sistem, pengelola } = req.body;
    const current = await readLetterParamsFile();
    
    const updated = {
      sistem: sistem ? { ...current.sistem, ...sistem } : current.sistem,
      pengelola: pengelola ? { ...current.pengelola, ...pengelola } : current.pengelola
    };
    
    await writeLetterParamsFile(updated);
    res.json(updated);
  } catch (error) {
    console.error("PUT pengaturan surat error", error);
    res.status(500).json({ error: "Failed to update letter settings" });
  }
});

router.get("/api/ai-settings", async (req, res) => {
  const params = await readAiSettings();
  // Mask the API key for security before sending to frontend
  if (params.apiKey) {
    params.apiKey = "********";
  }
  res.json(params);
});

router.put("/api/ai-settings", requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const updated = req.body;
    
    // If the frontend sends back the mask, keep the existing key
    if (updated.apiKey === "********") {
      const current = await readAiSettings();
      updated.apiKey = current.apiKey;
    }
    
    await writeAiSettings(updated);
    res.json(updated);
  } catch (error) {
    console.error("PUT ai settings error", error);
    res.status(500).json({ error: "Failed to update AI settings" });
  }
});

// === DOCUMENT TEMPLATES ===

router.get("/api/document-templates", async (req, res) => {
  try {
    const templates = await readDocumentTemplates();
    res.json(templates);
  } catch (error) {
    console.error("GET document templates error", error);
    res.status(500).json({ error: "Failed to load templates" });
  }
});

router.put("/api/document-templates", requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const templates = req.body;
    await writeDocumentTemplates(templates);
    const updated = await readDocumentTemplates();
    res.json(updated);
  } catch (error) {
    console.error("PUT document templates error", error);
    res.status(500).json({ error: "Failed to update templates" });
  }
});

router.put("/api/document-templates/:id", requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    const { kontenHtml, driveLink } = req.body;
    const templates = await readDocumentTemplates();
    const updatedTemplates = templates.map((t: any) =>
      t.id === id ? { ...t, kontenHtml, driveLink: driveLink !== undefined ? driveLink : t.driveLink, updatedAt: new Date().toISOString() } : t
    );
    await writeDocumentTemplates(updatedTemplates);
    const result = await readDocumentTemplates();
    res.json(result.find((t: any) => t.id === id));
  } catch (error) {
    console.error("PUT document template error", error);
    res.status(500).json({ error: "Failed to update template" });
  }
});

router.post("/api/document-templates/:id/reset", requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { id } = req.params;
    const { getDefaultTemplates } = await import('../utils/templateUtils');
    const defaults = getDefaultTemplates();
    const defaultTpl = defaults.find(t => t.id === id);
    
    if (!defaultTpl) {
      return res.status(404).json({ error: "Template not found" });
    }
    
    const templates = await readDocumentTemplates();
    const updatedTemplates = templates.map((t: any) =>
      t.id === id ? { ...t, kontenHtml: defaultTpl.kontenHtml, updatedAt: new Date().toISOString() } : t
    );
    await writeDocumentTemplates(updatedTemplates);
    const result = await readDocumentTemplates();
    res.json(result.find((t: any) => t.id === id));
  } catch (error) {
    console.error("POST reset template error", error);
    res.status(500).json({ error: "Failed to reset template" });
  }
});

router.post("/api/document-templates/reset-all", requireRole(...ADMIN_ROLES), async (req, res) => {
  try {
    const { getDefaultTemplates } = await import('../utils/templateUtils');
    const defaults = getDefaultTemplates();
    await writeDocumentTemplates(defaults);
    res.json(defaults);
  } catch (error) {
    console.error("POST reset-all templates error", error);
    res.status(500).json({ error: "Failed to reset all templates" });
  }
});

// === SSO PUPR-ID SETTINGS ===

router.get("/api/sso-settings", async (req, res) => {
  try {
    const params = await readSsoSettings();
    // Mask clientSecret for security
    if (params.clientSecret) {
      params.clientSecret = "********";
    }
    res.json(params);
  } catch (error) {
    console.error("GET sso-settings error", error);
    res.status(500).json({ error: "Failed to load SSO settings" });
  }
});

router.get("/api/sso-settings/public", async (req, res) => {
  try {
    const params = await readSsoSettings();
    // Only expose what the login page needs
    res.json({
      enabled: params.enabled,
      showLoginButton: params.showLoginButton,
      puprIdBaseUrl: params.puprIdBaseUrl,
      puprIdRealm: params.puprIdRealm,
    });
  } catch (error) {
    console.error("GET sso-settings/public error", error);
    res.status(500).json({ error: "Failed to load public SSO settings" });
  }
});

router.put("/api/sso-settings", requireRole('Administrator'), async (req, res) => {
  try {
    const updated = req.body;
    // If the frontend sends back the mask, keep the existing secret
    if (updated.clientSecret === "********") {
      const current = await readSsoSettings();
      updated.clientSecret = current.clientSecret;
    }
    await writeSsoSettings(updated);
    // Mask secret before sending response
    if (updated.clientSecret) {
      updated.clientSecret = "********";
    }
    res.json(updated);
  } catch (error) {
    console.error("PUT sso-settings error", error);
    res.status(500).json({ error: "Failed to update SSO settings" });
  }
});

router.post("/api/sso/test-connection", requireRole('Administrator'), async (req, res) => {
  const startTime = Date.now();
  try {
    const ssoConfig = await readSsoSettings();
    const baseUrl = (req.body.puprIdBaseUrl || ssoConfig.puprIdBaseUrl || "").replace(/\/$/, "");
    const apiGatewayUrl = (req.body.puprIdApiGatewayUrl || ssoConfig.puprIdApiGatewayUrl || "").replace(/\/$/, "");
    const realm = req.body.puprIdRealm || ssoConfig.puprIdRealm || "dpupr-garut";

    if (!baseUrl && !apiGatewayUrl) {
      return res.status(400).json({
        success: false,
        message: "URL puprID belum dikonfigurasi.",
        latencyMs: Date.now() - startTime,
      });
    }

    const results: any = { tests: [] };

    // Test 1: Ping puprID Frontend
    if (baseUrl) {
      try {
        const frontendRes = await fetch(baseUrl, { method: "HEAD", signal: AbortSignal.timeout(8000) });
        results.tests.push({
          name: "puprID Frontend",
          url: baseUrl,
          status: frontendRes.ok ? "OK" : `HTTP ${frontendRes.status}`,
          success: frontendRes.ok,
        });
      } catch (err: any) {
        results.tests.push({
          name: "puprID Frontend",
          url: baseUrl,
          status: err.message || "Connection failed",
          success: false,
        });
      }
    }

    // Test 2: Ping puprID API Gateway Health
    if (apiGatewayUrl) {
      try {
        const healthRes = await fetch(`${apiGatewayUrl}/health`, { signal: AbortSignal.timeout(8000) });
        const healthData = await healthRes.json().catch(() => null);
        results.tests.push({
          name: "API Gateway Health",
          url: `${apiGatewayUrl}/health`,
          status: healthRes.ok ? healthData?.status || "OK" : `HTTP ${healthRes.status}`,
          success: healthRes.ok,
        });
      } catch (err: any) {
        results.tests.push({
          name: "API Gateway Health",
          url: `${apiGatewayUrl}/health`,
          status: err.message || "Connection failed",
          success: false,
        });
      }

      // Test 3: OIDC Discovery
      try {
        const oidcRes = await fetch(`${apiGatewayUrl}/realms/${realm}/.well-known/openid-configuration`, { signal: AbortSignal.timeout(8000) });
        const oidcData = await oidcRes.json().catch(() => null);
        results.tests.push({
          name: "OIDC Discovery",
          url: `${apiGatewayUrl}/realms/${realm}/.well-known/openid-configuration`,
          status: oidcRes.ok && oidcData?.issuer ? "OK" : `HTTP ${oidcRes.status}`,
          success: oidcRes.ok && !!oidcData?.issuer,
          issuer: oidcData?.issuer || null,
        });
      } catch (err: any) {
        results.tests.push({
          name: "OIDC Discovery",
          url: `${apiGatewayUrl}/realms/${realm}/.well-known/openid-configuration`,
          status: err.message || "Connection failed",
          success: false,
        });
      }
    }

    const allPassed = results.tests.every((t: any) => t.success);
    const anyPassed = results.tests.some((t: any) => t.success);

    res.json({
      success: allPassed,
      partial: !allPassed && anyPassed,
      message: allPassed
        ? "Semua koneksi ke puprID berhasil!"
        : anyPassed
        ? "Sebagian koneksi berhasil, periksa detail di bawah."
        : "Gagal terhubung ke puprID. Periksa URL dan pastikan layanan berjalan.",
      latencyMs: Date.now() - startTime,
      ...results,
    });
  } catch (error: any) {
    console.error("SSO test-connection error", error);
    res.status(500).json({
      success: false,
      message: error.message || "Gagal menguji koneksi ke puprID.",
      latencyMs: Date.now() - startTime,
    });
  }
});

export default router;
