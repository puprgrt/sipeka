import { Router } from "express";
import { analyzeDamage, analyzeDocument } from "../controllers/aiController";

const router = Router();

router.post("/analyze-damage", analyzeDamage);
router.post("/analyze-document", analyzeDocument);

export default router;
