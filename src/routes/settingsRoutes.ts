import express from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { readAppSettingsFile, writeAppSettingsFile, readLetterParamsFile, writeLetterParamsFile } from '../utils/configHelper';


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

export default router;
