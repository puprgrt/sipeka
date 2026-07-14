import express from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { readAppSettingsFile, writeAppSettingsFile, readLetterParamsFile, writeLetterParamsFile, readAiSettings, writeAiSettings, readDocumentTemplates, writeDocumentTemplates } from '../utils/configHelper';


const router = express.Router();

router.get("/api/app-settings", async (req, res) => {
  const params = await readAppSettingsFile();
  res.json(params);
});

router.put("/api/app-settings", async (req, res) => {
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

router.put("/api/pengaturan-surat", async (req, res) => {
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

router.put("/api/ai-settings", async (req, res) => {
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

router.put("/api/document-templates", async (req, res) => {
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

router.put("/api/document-templates/:id", async (req, res) => {
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

router.post("/api/document-templates/:id/reset", async (req, res) => {
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

export default router;
