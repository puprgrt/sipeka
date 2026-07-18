import { Request, Response } from "express";
import { analyzeDamageLogic, analyzeDocumentLogic, analyzeIkmLogic } from "../services/aiService";

export async function analyzeDamage(req: Request, res: Response): Promise<void> {
  try {
    const { imageBase64, componentName } = req.body;
    if (!imageBase64 || !componentName) {
      res.status(400).json({ error: "Missing imageBase64 or componentName" });
      return;
    }
    
    const result = await analyzeDamageLogic(imageBase64, componentName);
    res.json(result);
  } catch (error: any) {
    console.error("Gemini AI error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze image" });
  }
}

export async function analyzeDocument(req: Request, res: Response): Promise<void> {
  try {
    const { fileName, fileType, fileContent, imageBase64 } = req.body;
    if (!fileName || !fileType) {
      res.status(400).json({ error: "Missing fileName or fileType" });
      return;
    }

    const result = await analyzeDocumentLogic(fileName, fileType, fileContent, imageBase64);
    res.json(result);
  } catch (error: any) {
    console.error("Gemini document analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze document" });
  }
}

export async function analyzeIkm(req: Request, res: Response): Promise<void> {
  try {
    const { stats, responses, questionsConfig } = req.body;
    if (!stats || !responses) {
      res.status(400).json({ error: "Missing stats or responses" });
      return;
    }

    const narrative = await analyzeIkmLogic(stats, responses, questionsConfig || []);
    res.json({ narrative });
  } catch (error: any) {
    console.error("Gemini IKM analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze IKM data" });
  }
}
