import { apiFetch } from "../lib/api";
import { useEffect, useState, useRef } from "react";
import { Bell, Check, MailOpen, AlertCircle, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import { id as localeID } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Notification {
  idNotification: number;
  userId: number | null;
  targetRole: string | null;
  title: string;
  message: string;
  idPermohonan: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const activeRole = localStorage.getItem("activeRole") || "Administrator";
  const activeUserId = localStorage.getItem("activeUserId");

  const fetchNotifications = async () => {
    try {
      let url = `/api/notifications?role=${encodeURIComponent(activeRole)}`;
      if (activeUserId) {
        url += `&userId=${encodeURIComponent(activeUserId)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err: any) {
      // Ignore errors (e.g. network error during dev server restart) to prevent UI overlays
    }
  };

  // Setup SSE stream and fallback polling
  useEffect(() => {
    fetchNotifications();

    // 1. Live SSE push connection
    let url = `/api/notifications/stream?role=${encodeURIComponent(activeRole)}`;
    if (activeUserId) {
      url += `&userId=${encodeURIComponent(activeUserId)}`;
    }
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      if (event.data === "connected") return;
      try {
        const newNotif: Notification = JSON.parse(event.data);
        
        setNotifications(prev => {
          // Avoid duplicate entries
          if (prev.some(n => n.idNotification === newNotif.idNotification)) {
            return prev;
          }

          // Trigger audio chime alert if configured
          const audioAlertEnabled = localStorage.getItem("playNotificationSound") !== "false";
          if (audioAlertEnabled) {
            try {
              const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
              audio.volume = 0.5;
              audio.play();
            } catch (err) {
              console.warn("Could not play audio alert:", err);
            }
          }

          return [newNotif, ...prev];
        });
      } catch (err) {
        console.error("Error parsing SSE message:", err);
      }
    };

    // 2. Poll as fallback every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    const handleStorageChange = () => {
      fetchNotifications();
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      eventSource.close();
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [activeRole, activeUserId]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: number) => {
    try {
      const res = await apiFetch(`/api/notifications/${id}/read`, {
        method: "PUT",
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n.idNotification === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await apiFetch("/api/notifications/read-all", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: activeRole,
          userId: activeUserId ? Number(activeUserId) : null,
        }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleNotificationClick = async (n: Notification, e: React.MouseEvent) => {
    // If user clicked the read checkbox/button specifically, let that handler process it instead of routing
    const target = e.target as HTMLElement;
    if (target.closest("button")?.id?.startsWith("read-notification-button-")) {
      return;
    }

    if (!n.isRead) {
      await handleMarkAsRead(n.idNotification);
    }
    setIsOpen(false);

    if (n.idPermohonan) {
      const isDisposisi = n.title.toLowerCase().includes("disposisi") || 
                          ["Kadis", "Kabid", "Koordinator", "Tim_Teknis"].includes(activeRole);
      if (isDisposisi) {
        navigate("/disposisi", { state: { assessmentId: n.idPermohonan } });
      } else {
        navigate("/list", { state: { assessmentId: n.idPermohonan } });
      }
    }
  };

  return (
    <div className="relative z-50" ref={dropdownRef} id="notification-bell-container">
      {/* Bell Icon Trigger */}
      <button
        id="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-pu-blue hover:bg-slate-100/80 rounded-xl transition-all cursor-pointer active:scale-95"
        title="Notifikasi"
      >
        <Bell className="w-5 h-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              id="notification-badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-xs"
            >
              {unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="notification-dropdown"
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pu-blue/5 to-indigo-50/20 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Notifikasi</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-pu-blue/10 text-pu-blue text-[10px] font-bold rounded-full">
                    {unreadCount} Baru
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  id="mark-all-read-button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-pu-blue hover:text-pu-blue/80 uppercase tracking-wider cursor-pointer"
                >
                  <MailOpen className="w-3 h-3" />
                  Semua Dibaca
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
              {notifications.length > 0 ? (
                notifications.map(n => (
                  <div
                    key={n.idNotification}
                    id={`notification-item-${n.idNotification}`}
                    onClick={(e) => handleNotificationClick(n, e)}
                    className={`p-4 transition-colors flex items-start gap-3 hover:bg-slate-50/50 cursor-pointer ${
                      !n.isRead ? "bg-pu-blue/5" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div className="mt-0.5 shrink-0">
                      {n.title.toLowerCase().includes("disposisi") ? (
                        <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-blue-50 text-pu-blue rounded-lg">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-slate-700 leading-tight">
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 bg-pu-blue rounded-full shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between mt-2.5">
                        <span className="text-[10px] font-medium text-slate-400">
                          {formatDistanceToNow(new Date(n.createdAt), {
                            addSuffix: true,
                            locale: localeID,
                          })}
                        </span>
                        {!n.isRead && (
                          <button
                            id={`read-notification-button-${n.idNotification}`}
                            onClick={() => handleMarkAsRead(n.idNotification)}
                            className="text-[10px] font-semibold text-pu-blue hover:underline flex items-center gap-0.5 cursor-pointer z-10"
                          >
                            <Check className="w-3 h-3" />
                            Tandai dibaca
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center flex flex-col items-center justify-center text-slate-400">
                  <div className="p-3 bg-slate-50 rounded-full text-slate-300 mb-2">
                    <Bell className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold">Tidak ada notifikasi baru</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Kami akan memberi tahu Anda di sini jika ada pembaruan.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
