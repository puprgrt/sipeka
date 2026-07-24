import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  Browsers
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";

// Initialize a simple memory store to keep chats and messages
const store = {
  chats: {} as Record<string, any>,
  messages: {} as Record<string, any[]>,
  contacts: {} as Record<string, any>,
};

// Create auth directory if it doesn't exist
const AUTH_DIR = path.resolve(process.cwd(), "wa_auth");
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

let sock: ReturnType<typeof makeWASocket> | null = null;
let currentQR: string | null = null;
let isConnected = false;
let isConnecting = false;

// Setup store persistence (save to file periodically)
const STORE_PATH = path.join(AUTH_DIR, "simple_store.json");
const loadStore = () => {
  if (fs.existsSync(STORE_PATH)) {
    try {
      const data = fs.readFileSync(STORE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      store.chats = parsed.chats || {};
      store.messages = parsed.messages || {};
      store.contacts = parsed.contacts || {};
    } catch (e) {
      console.error("Failed to load store", e);
    }
  }
};
const saveStore = () => {
  try {
    fs.writeFileSync(STORE_PATH, JSON.stringify(store));
  } catch (e) {
    console.error("Failed to save store", e);
  }
};

loadStore();
setInterval(saveStore, 10000);

export const startWhatsApp = async () => {
  if (isConnecting || isConnected) return;
  isConnecting = true;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    
    // Configure pino logger to be less verbose
    const logger = pino({ level: "silent" });

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger,
      browser: Browsers.macOS("Desktop"),
      syncFullHistory: false // Don't download all history to save memory/speed
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        // Generate QR code as Base64 data URL
        try {
          currentQR = await QRCode.toDataURL(qr);
        } catch (err) {
          console.error("Failed to generate QR data URL", err);
        }
      }

      if (connection === "close") {
        isConnected = false;
        isConnecting = false;
        currentQR = null;
        
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut;
        
        console.log(
          "WhatsApp connection closed due to ",
          lastDisconnect?.error,
          ", reconnecting:",
          shouldReconnect
        );
        
        // Reconnect if not logged out
        if (shouldReconnect) {
          setTimeout(startWhatsApp, 3000);
        } else {
          // If logged out, we should clear the auth directory so user can scan a new QR
          try {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
            fs.mkdirSync(AUTH_DIR, { recursive: true });
          } catch (e) {
            console.error("Failed to clear auth dir", e);
          }
        }
      } else if (connection === "open") {
        console.log("WhatsApp connected successfully!");
        isConnected = true;
        isConnecting = false;
        currentQR = null;
      }
    });

    // Populate our simple store
    sock.ev.on("messaging-history.set", ({ chats, contacts, messages }) => {
      for (const chat of chats) store.chats[chat.id] = chat;
      for (const contact of contacts) store.contacts[contact.id] = contact;
      for (const msg of messages) {
        const jid = msg.key.remoteJid;
        if (jid) {
          if (!store.messages[jid]) store.messages[jid] = [];
          store.messages[jid].push(msg);
        }
      }
    });
    
    sock.ev.on("chats.upsert", (chats) => {
      for (const chat of chats) store.chats[chat.id] = chat;
    });

    sock.ev.on("chats.update", (updates) => {
      for (const update of updates) {
        if (store.chats[update.id!]) {
          Object.assign(store.chats[update.id!], update);
        } else {
          store.chats[update.id!] = update;
        }
      }
    });

    sock.ev.on("contacts.upsert", (contacts) => {
      for (const contact of contacts) store.contacts[contact.id] = contact;
    });

    sock.ev.on("messages.upsert", ({ messages }) => {
      for (const msg of messages) {
        const jid = msg.key.remoteJid;
        if (jid) {
          if (!store.messages[jid]) store.messages[jid] = [];
          store.messages[jid].push(msg);
          
          // Update chat timestamp
          if (store.chats[jid]) {
            store.chats[jid].conversationTimestamp = msg.messageTimestamp;
          } else {
            store.chats[jid] = {
              id: jid,
              conversationTimestamp: msg.messageTimestamp
            };
          }
        }
      }
    });

  } catch (error) {
    console.error("Failed to start WhatsApp:", error);
    isConnecting = false;
  }
};

export const getWhatsAppStatus = () => {
  if (isConnected && sock?.user) {
    return {
      status: "connected",
      user: sock.user
    };
  }
  if (currentQR) {
    return {
      status: "qr_ready",
      qr: currentQR
    };
  }
  return {
    status: isConnecting ? "connecting" : "disconnected"
  };
};

export const logoutWhatsApp = async () => {
  if (sock) {
    await sock.logout();
    isConnected = false;
    currentQR = null;
    sock = null;
  }
};

export const getChats = async () => {
  return Object.values(store.chats);
};

export const getMessages = async (jid: string, limit = 50) => {
  const msgs = store.messages[jid] || [];
  return msgs.slice(-limit);
};

export const getContacts = async () => {
  return store.contacts;
};

export const sendMessage = async (jid: string, text: string) => {
  if (!isConnected || !sock) {
    throw new Error("WhatsApp is not connected");
  }
  
  // Format jid correctly if it's just a number
  if (!jid.includes("@")) {
    jid = `${jid}@s.whatsapp.net`;
  }

  return await sock.sendMessage(jid, { text });
};
