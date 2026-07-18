import { Router } from "express";
import { analyzeDamage, analyzeDocument, analyzeIkm } from "../controllers/aiController";

const router = Router();

router.post("/analyze-damage", analyzeDamage);
router.post("/analyze-document", analyzeDocument);
router.post("/analyze-ikm", analyzeIkm);

export default router;
