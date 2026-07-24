import React, { useState, useEffect, useRef } from "react";
import { apiFetch } from "../lib/api";
import { Send, LogOut, QrCode, MessageSquare, Phone, MoreVertical, Search, Check, CheckCheck, Clock, User as UserIcon, RefreshCw, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WAStatus {
  status: "connected" | "qr_ready" | "connecting" | "disconnected" | "error";
  qr?: string;
  user?: any;
}

interface Chat {
  id: string;
  name?: string;
  unreadCount?: number;
  conversationTimestamp?: number;
}

interface Message {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: { text: string };
    imageMessage?: any;
  };
  messageTimestamp?: number;
  status?: number;
}

export default function WhatsappCenter() {
  const [waStatus, setWaStatus] = useState<WAStatus>({ status: "disconnected" });
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingChats, setLoadingChats] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll status
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    const checkStatus = async () => {
      try {
        const res = await apiFetch("/api/wa/status");
        if (res.ok) {
          const data = await res.json();
          setWaStatus(data);
          
          if (data.status === "connected") {
            loadChats();
          }
        }
      } catch (err) {
        console.error("Failed to check WA status:", err);
      }
    };

    checkStatus();
    interval = setInterval(checkStatus, 5000); // Poll every 5s

    return () => clearInterval(interval);
  }, []);

  const loadChats = async () => {
    if (loadingChats) return;
    setLoadingChats(true);
    try {
      const res = await apiFetch("/api/wa/chats");
      if (res.ok) {
        const data = await res.json();
        // Sort chats by most recent
        const sortedChats = (data.chats || []).sort((a: Chat, b: Chat) => {
          return (b.conversationTimestamp || 0) - (a.conversationTimestamp || 0);
        });
        setChats(sortedChats);
      }
    } catch (err) {
      console.error("Failed to load chats:", err);
    } finally {
      setLoadingChats(false);
    }
  };

  const loadMessages = async (jid: string) => {
    try {
      const res = await apiFetch(`/api/wa/chats/${encodeURIComponent(jid)}/messages?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        scrollToBottom();
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat.id);
      
      // Auto refresh messages for active chat
      const interval = setInterval(() => {
        loadMessages(activeChat.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleStart = async () => {
    try {
      setWaStatus({ status: "connecting" });
      await apiFetch("/api/wa/start", { method: "POST" });
    } catch (err) {
      console.error("Failed to start WA:", err);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Yakin ingin memutuskan koneksi WhatsApp? Anda harus men-scan ulang QR Code nantinya.")) return;
    try {
      await apiFetch("/api/wa/logout", { method: "POST" });
      setWaStatus({ status: "disconnected" });
      setChats([]);
      setActiveChat(null);
      setMessages([]);
    } catch (err) {
      console.error("Failed to logout WA:", err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChat || !newMessage.trim() || sending) return;

    setSending(true);
    const textToSend = newMessage.trim();
    setNewMessage("");

    // Optimistic UI update
    const tempMsg: Message = {
      key: { remoteJid: activeChat.id, fromMe: true, id: Date.now().toString() },
      message: { conversation: textToSend },
      messageTimestamp: Math.floor(Date.now() / 1000),
    };
    setMessages((prev) => [...prev, tempMsg]);
    scrollToBottom();

    try {
      await apiFetch("/api/wa/send", {
        method: "POST",
        body: JSON.stringify({ jid: activeChat.id, text: textToSend }),
      });
      // reload messages after short delay to get actual status
      setTimeout(() => loadMessages(activeChat.id), 1000);
    } catch (err) {
      console.error("Failed to send message:", err);
      alert("Gagal mengirim pesan");
    } finally {
      setSending(false);
    }
  };

  const extractMessageText = (msg: Message) => {
    return msg.message?.conversation || msg.message?.extendedTextMessage?.text || "Pesan Media/Lainnya";
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "";
    const d = new Date(timestamp * 1000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatJid = (jid: string) => {
    return jid.split("@")[0];
  };

  const filteredChats = chats.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    formatJid(c.id).includes(searchQuery)
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900 overflow-hidden relative">
      
      {/* Background Decorative */}
      <div className="absolute inset-0 bg-[url('https://static.whatsapp.net/rsrc.php/v3/yO/r/fsxs-FSQszr.png')] opacity-5 dark:opacity-10 pointer-events-none mix-blend-multiply dark:mix-blend-screen bg-repeat"></div>

      {waStatus.status !== "connected" ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 dark:text-emerald-400">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">WhatsApp Center</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
              Hubungkan sistem SIPEKA dengan WhatsApp Anda untuk mengirimkan notifikasi dan membalas pesan pengelola sekolah secara langsung.
            </p>

            {waStatus.status === "qr_ready" && waStatus.qr ? (
              <div className="space-y-6">
                <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-700 inline-block">
                  <img src={waStatus.qr} alt="WhatsApp QR Code" className="w-48 h-48 mx-auto rounded-lg shadow-sm" />
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-300 bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800">
                  <ol className="text-left list-decimal list-inside space-y-2 font-medium">
                    <li>Buka WhatsApp di telepon Anda</li>
                    <li>Ketuk <strong>Menu</strong> atau <strong>Setelan</strong> dan pilih <strong>Perangkat Taut</strong></li>
                    <li>Ketuk <strong>Tautkan Perangkat</strong></li>
                    <li>Arahkan telepon Anda ke layar ini untuk memindai kode QR</li>
                  </ol>
                </div>
              </div>
            ) : waStatus.status === "connecting" ? (
              <div className="py-12 flex flex-col items-center">
                <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                <p className="text-emerald-600 font-medium">Menghubungkan ke WhatsApp...</p>
              </div>
            ) : (
              <button
                onClick={handleStart}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <QrCode className="w-5 h-5" />
                Mulai Tautkan Perangkat
              </button>
            )}
          </div>
        </div>
      ) : (
        /* WhatsApp UI Layout */
        <div className="flex-1 flex overflow-hidden z-10 m-2 sm:m-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
          
          {/* Left Sidebar - Chat List */}
          <div className="w-full md:w-1/3 lg:w-1/4 border-r border-slate-200 dark:border-slate-700 flex flex-col bg-white dark:bg-slate-800 shrink-0">
            {/* Sidebar Header */}
            <div className="h-16 bg-slate-100 dark:bg-slate-900/50 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-300 dark:bg-slate-700 rounded-full flex items-center justify-center overflow-hidden">
                  <UserIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white text-sm leading-tight">Admin SIPEKA</h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Terhubung</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button title="Muat ulang obrolan" onClick={loadChats} className="p-2 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <RefreshCw className={`w-5 h-5 ${loadingChats ? 'animate-spin' : ''}`} />
                </button>
                <button title="Keluar" onClick={handleLogout} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="p-2 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari obrolan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-lg py-2 pl-10 pr-4 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredChats.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">Belum ada obrolan.</p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => setActiveChat(chat)}
                    className={`flex items-center gap-3 p-3 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 transition-colors ${
                      activeChat?.id === chat.id ? "bg-emerald-50 dark:bg-emerald-900/20" : "hover:bg-slate-50 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden relative">
                      <UserIcon className="w-6 h-6 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-semibold text-slate-800 dark:text-white truncate text-sm">
                          {chat.name || formatJid(chat.id)}
                        </h4>
                        <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0 ml-2">
                          {formatTime(chat.conversationTimestamp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* If last message is from me, could show status icon. We don't have that info easily here without deeply parsing store */}
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate w-full">
                          {chat.id.includes("g.us") ? "Grup WhatsApp" : "Pesan Pribadi"}
                        </p>
                        {chat.unreadCount ? (
                          <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            {chat.unreadCount}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Area - Chat View */}
          <div className="hidden md:flex flex-1 flex-col bg-[#efeae2] dark:bg-[#0b141a] relative">
            
            {activeChat ? (
              <>
                {/* Chat Header */}
                <div className="h-16 bg-white dark:bg-slate-800 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700 shrink-0 z-10 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 dark:text-white">{activeChat.name || formatJid(activeChat.id)}</h3>
                      <p className="text-xs text-slate-500">{activeChat.id.includes("g.us") ? "Grup WhatsApp" : "Pribadi"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500">
                    <Search className="w-5 h-5 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" />
                    <MoreVertical className="w-5 h-5 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" />
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar z-10">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur px-4 py-2 rounded-lg text-sm text-slate-500 shadow-sm">
                        Belum ada pesan untuk ditampilkan. Kirim pesan pertama!
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, idx) => {
                      const isMe = msg.key.fromMe;
                      const text = extractMessageText(msg);
                      
                      // Skip rendering empty messages (like system events we can't parse easily)
                      if (!text && !msg.message?.imageMessage) return null;
                      
                      return (
                        <div key={msg.key.id || idx} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] lg:max-w-[60%] rounded-lg px-3 py-2 shadow-sm relative group ${
                              isMe 
                                ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-800 dark:text-white rounded-tr-none" 
                                : "bg-white dark:bg-[#202c33] text-slate-800 dark:text-white rounded-tl-none"
                            }`}
                          >
                            {msg.message?.imageMessage && (
                              <div className="mb-2 rounded flex items-center justify-center bg-black/5 dark:bg-black/20 overflow-hidden relative group/image">
                                <img 
                                  src={`/api/wa/media/${encodeURIComponent(msg.key.remoteJid)}/${msg.key.id}`}
                                  alt="Media"
                                  className="max-w-full max-h-64 object-cover rounded cursor-pointer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                                  }}
                                />
                              </div>
                            )}
                            {text && <div className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">{text}</div>}
                            <div className="flex items-center justify-end gap-1 mt-1 -mb-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <span>{formatTime(msg.messageTimestamp)}</span>
                              {isMe && (
                                <CheckCheck className={`w-3.5 h-3.5 ${msg.status === 3 || msg.status === 4 ? "text-blue-500" : ""}`} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-3 bg-slate-100 dark:bg-slate-800 flex items-end gap-2 shrink-0 z-10">
                  <div className="flex-1 bg-white dark:bg-slate-700 rounded-xl shadow-sm border border-slate-200 dark:border-slate-600 flex items-center">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                      placeholder="Ketik pesan..."
                      className="w-full bg-transparent border-none py-3 px-4 resize-none max-h-32 min-h-[44px] text-slate-800 dark:text-white focus:ring-0 focus:outline-none text-[15px]"
                      rows={1}
                      disabled={sending}
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center shrink-0"
                  >
                    <Send className={`w-5 h-5 ${sending ? "animate-pulse" : ""}`} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 z-10">
                <img src={waStatus.qr ? waStatus.qr : "https://static.whatsapp.net/rsrc.php/v3/yO/r/fsxs-FSQszr.png"} alt="WA" className="w-64 opacity-50 dark:opacity-20 mix-blend-multiply dark:mix-blend-screen mb-8" />
                <h3 className="text-3xl font-light text-slate-700 dark:text-slate-300 mb-4">SIPEKA WhatsApp Web</h3>
                <p className="text-sm">Kirim dan terima pesan dari aplikasi secara langsung.</p>
                <div className="mt-8 flex items-center gap-2 text-xs text-slate-400">
                  <Phone className="w-4 h-4" />
                  End-to-end encrypted integration
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
