import express from "express";
import { 
  getWhatsAppStatus, 
  startWhatsApp, 
  logoutWhatsApp, 
  getChats, 
  getMessages, 
  sendMessage, 
  getContacts,
  getMediaMessage
} from "../services/waService";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

// All WA endpoints should be protected
router.use(verifyToken);

// Middleware to restrict to Administrator only
const restrictToAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userRole = (req as any).user?.role || req.headers["x-user-role"];
  if (userRole !== "Administrator") {
    return res.status(403).json({ error: "Access denied. Administrator only." });
  }
  next();
};

router.use(restrictToAdmin);

router.get("/status", (req, res) => {
  const status = getWhatsAppStatus();
  res.json(status);
});

router.post("/start", async (req, res) => {
  await startWhatsApp();
  res.json({ message: "WhatsApp initialization triggered" });
});

router.post("/logout", async (req, res) => {
  await logoutWhatsApp();
  res.json({ message: "Logged out from WhatsApp" });
});

router.get("/chats", async (req, res) => {
  try {
    const chats = await getChats();
    res.json({ chats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/contacts", async (req, res) => {
  try {
    const contacts = await getContacts();
    // Return only values
    const contactsArray = Object.values(contacts);
    res.json({ contacts: contactsArray });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/chats/:jid/messages", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const messages = await getMessages(req.params.jid, limit);
    res.json({ messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/media/:jid/:id", async (req, res) => {
  try {
    const { jid, id } = req.params;
    const { buffer, mimetype } = await getMediaMessage(jid, id);
    res.set("Content-Type", mimetype);
    res.send(buffer);
  } catch (error: any) {
    console.error("Failed to fetch media:", error);
    res.status(404).json({ error: "Media not found or failed to download" });
  }
});

router.post("/send", async (req, res) => {
  try {
    const { jid, text } = req.body;
    if (!jid || !text) {
      return res.status(400).json({ error: "jid and text are required" });
    }
    const result = await sendMessage(jid, text);
    res.json({ success: true, result });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
