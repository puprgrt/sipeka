import express from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { readAppSettingsFile, writeAppSettingsFile, readLetterParamsFile, writeLetterParamsFile, readAiSettings, writeAiSettings } from '../utils/configHelper';


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

export default router;
