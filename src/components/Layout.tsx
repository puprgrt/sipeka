import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileCheck, FileText, PlusCircle, Map as MapIcon, LogOut, Menu, X, Settings as SettingsIcon, ClipboardList, UserCog, Brain, ChevronLeft, ChevronRight, RefreshCw, WifiOff, AlertTriangle, Database, Smartphone, FolderOpen } from "lucide-react";
import { cn } from "../lib/utils";
import { useEffect, useState, useRef } from "react";
import { initAuth, googleSignIn, logout } from "../lib/firebaseAuth";
import { User } from "firebase/auth";
import { motion } from "motion/react";
import NotificationBell from "./NotificationBell";
import LoadingSplash from "./LoadingSplash";
import { getOfflineAssessments, deleteOfflineAssessment, getOfflineCount } from "../lib/indexedDbQueue";

import { requestFcmToken } from "../lib/fcm";
import { getRolePermissions } from "../lib/permissions";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [minLoadingDone, setMinLoadingDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingDone(true);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebarCollapsed") === "true";
  });

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [conflict, setConflict] = useState<{ offlineItem: any; serverData: any } | null>(null);
  const resolveConflictPromiseRef = useRef<((keepLocal: boolean) => void) | null>(null);

  const resolveConflict = (keepLocal: boolean) => {
    if (resolveConflictPromiseRef.current) {
      resolveConflictPromiseRef.current(keepLocal);
      resolveConflictPromiseRef.current = null;
    }
    setConflict(null);
  };

  const updateOfflineCount = async () => {
    try {
      const count = await getOfflineCount();
      let oldOfflineLength = 0;
      try {
        const oldOffline = JSON.parse(localStorage.getItem("offline_assessments") || "[]");
        oldOfflineLength = oldOffline.length;
      } catch (e) {}
      setOfflineCount(count + oldOfflineLength);
    } catch (e) {
      setOfflineCount(0);
    }
  };

  const syncOfflineAssessments = async () => {
    if (isSyncing || !navigator.onLine) return;
    
    try {
      setIsSyncing(true);
      
      const indexedDbItems = await getOfflineAssessments();
      let localStorageItems: any[] = [];
      try {
        localStorageItems = JSON.parse(localStorage.getItem("offline_assessments") || "[]");
      } catch (e) {}

      const allOfflineItems = [
        ...indexedDbItems.map(item => ({ ...item, source: "indexeddb" as const })),
        ...localStorageItems.map(item => ({ ...item, source: "localstorage" as const }))
      ];
      
      if (allOfflineItems.length === 0) {
        setIsSyncing(false);
        return;
      }

      let successCount = 0;
      const failedIndexedDb: any[] = [];
      const failedLocalStorage: any[] = [];

      for (const item of allOfflineItems) {
        try {
          const { editId, payload } = item;

          // Conflict detection for edited assessments
          if (editId) {
            try {
              const checkRes = await fetch(`/api/assessments/${editId}`);
              if (checkRes.ok) {
                const serverData = await checkRes.json();
                
                const localDamage = payload.finalResult?.totalDamagePercentage || 0;
                const serverDamage = serverData.finalResult?.totalDamagePercentage || 0;
                const localSchool = payload.schoolName || "";
                const serverSchool = serverData.schoolName || "";
                const localArea = Number(payload.buildingArea) || 0;
                const serverArea = Number(serverData.buildingArea) || 0;

                const hasDiff = 
                  Math.abs(localDamage - serverDamage) > 0.01 || 
                  localSchool !== serverSchool || 
                  localArea !== serverArea;

                if (hasDiff) {
                  // Wait for user choice (keepLocal or not)
                  const keepLocal = await new Promise<boolean>((resolve) => {
                    setConflict({ offlineItem: item, serverData });
                    resolveConflictPromiseRef.current = resolve;
                  });

                  if (!keepLocal) {
                    // Discard local changes - delete offline item and skip uploading
                    if (item.source === "indexeddb") {
                      await deleteOfflineAssessment(item.id);
                    } else {
                      const oldOffline = JSON.parse(localStorage.getItem("offline_assessments") || "[]");
                      const filtered = oldOffline.filter((x: any) => x.id !== item.id);
                      localStorage.setItem("offline_assessments", JSON.stringify(filtered));
                    }
                    continue; // Skip upload, move to next item
                  }
                }
              }
            } catch (err) {
              console.warn("Failed conflict check for item", editId, err);
            }
          }

          const headers = {
            "Content-Type": "application/json",
            "x-user-email": localStorage.getItem("userEmail") || "admin@sipeka.com",
            "x-user-name": localStorage.getItem("userName") || "Sistem Admin",
            "x-user-role": localStorage.getItem("activeRole") || "Administrator",
          };

          const response = await fetch(editId ? `/api/assessments/${editId}` : "/api/assessments", {
            method: editId ? "PUT" : "POST",
            headers,
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            successCount++;
            if (item.source === "indexeddb") {
              await deleteOfflineAssessment(item.id);
            }
          } else {
            if (item.source === "indexeddb") {
              failedIndexedDb.push({ id: item.id, payload: item.payload, editId: item.editId, timestamp: item.timestamp, schoolName: item.schoolName });
            } else {
              failedLocalStorage.push(item);
            }
          }
        } catch (err) {
          console.warn("Failed to sync offline item", item.id, err);
          if (item.source === "indexeddb") {
            failedIndexedDb.push({ id: item.id, payload: item.payload, editId: item.editId, timestamp: item.timestamp, schoolName: item.schoolName });
          } else {
            failedLocalStorage.push(item);
          }
        }
      }

      localStorage.setItem("offline_assessments", JSON.stringify(failedLocalStorage));
      setOfflineCount(failedIndexedDb.length + failedLocalStorage.length);

      if (successCount > 0) {
        window.dispatchEvent(new Event("assessments-synced"));
        alert(`🎉 Sinkronisasi Berhasil!\n\nBerhasil mengunggah ${successCount} data penilaian yang tertunda ke server.`);
      }

      if (failedIndexedDb.length > 0 || failedLocalStorage.length > 0) {
        alert(`⚠️ Sinkronisasi Selesai Sebagian.\n\nGagal mengunggah ${failedIndexedDb.length + failedLocalStorage.length} data penilaian. Sistem akan mencoba kembali nanti.`);
      }
    } catch (e) {
      console.error("Error during offline sync", e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    updateOfflineCount();

    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("storage", updateOfflineCount);
    window.addEventListener("offline-assessments-updated", updateOfflineCount);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("storage", updateOfflineCount);
      window.removeEventListener("offline-assessments-updated", updateOfflineCount);
    };
  }, []);

  // Auto-sync when coming online
  useEffect(() => {
    if (isOnline && offlineCount > 0) {
      syncOfflineAssessments();
    }
  }, [isOnline, offlineCount]);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const nextVal = !prev;
      localStorage.setItem("sidebarCollapsed", String(nextVal));
      return nextVal;
    });
  };

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    const applyTheme = () => {
      const currentTheme = localStorage.getItem("theme") || "light";
      if (currentTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    applyTheme();

    const handleStorageChange = () => {
      applyTheme();
      setTheme((localStorage.getItem("theme") as "light" | "dark") || "light");
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = initAuth(
      (fbUser, token) => {
        setUser(fbUser);
        setAuthLoaded(true);
      },
      () => {
        const isLocalLoggedIn = localStorage.getItem("isLoggedIn") === "true";
        if (isLocalLoggedIn) {
          const email = localStorage.getItem("userEmail") || "admin@sipeka.com";
          const name = localStorage.getItem("userName") || "Sistem Admin";
          setUser({
            email,
            displayName: name,
            photoURL: localStorage.getItem("userPhoto") || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
            uid: localStorage.getItem("activeUserId") || "demo_user",
          } as any);
        } else {
          setUser(null);
        }
        setAuthLoaded(true);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authLoaded && !user) {
      navigate("/login", { replace: true });
    }
  }, [authLoaded, user, navigate]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const [actualRole, setActualRole] = useState<string>(() => {
    return localStorage.getItem("actualRole") || localStorage.getItem("activeRole") || "Pengelola_Bangunan";
  });

  const [activeRole, setActiveRole] = useState<string>(() => {
    const savedActual = localStorage.getItem("actualRole");
    const savedActive = localStorage.getItem("activeRole");
    if (savedActual && savedActual !== "Administrator") {
      return savedActual;
    }
    return savedActive || savedActual || "Pengelola_Bangunan";
  });
  
  const [appSettings, setAppSettings] = useState<{logoKiri: string, logoKanan: string}>({
    logoKiri: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Coat_of_arms_of_Garut_Regency.svg",
    logoKanan: "https://upload.wikimedia.org/wikipedia/commons/0/06/Logo_PUPR.png"
  });

  const handleRoleChange = (role: string) => {
    setActiveRole(role);
    localStorage.setItem("activeRole", role);
    window.dispatchEvent(new Event("storage"));
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.warn("Logout failed or skipped", e);
    }
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userPhoto");
    localStorage.removeItem("activeRole");
    localStorage.removeItem("actualRole");
    localStorage.removeItem("activeUserId");
    setUser(null);
    const baseUrl = import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, "") : "";
    window.location.href = `${baseUrl}/login`;
  };

  useEffect(() => {
    if (user) {
      if (user.email) localStorage.setItem("userEmail", user.email);
      if (user.displayName) localStorage.setItem("userName", user.displayName || user.email.split("@")[0]);
      if (user.email) {
        fetch("/api/users")
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
              const dbUser = data.find(u => u.email === user.email);
              if (dbUser && dbUser.role) {
                localStorage.setItem("actualRole", dbUser.role);
                setActualRole(dbUser.role);
                localStorage.setItem("activeUserId", String(dbUser.idUser));
                
                if (dbUser.role === "Administrator") {
                  const currentActive = localStorage.getItem("activeRole") || dbUser.role;
                  handleRoleChange(currentActive);
                } else {
                  handleRoleChange(dbUser.role);
                }
                window.dispatchEvent(new Event("storage"));
              } else {
                // Default fallback for user with no mapped role
                const defaultRole = "Pengelola_Bangunan";
                localStorage.setItem("actualRole", defaultRole);
                localStorage.setItem("activeRole", defaultRole);
                setActualRole(defaultRole);
                setActiveRole(defaultRole);
                window.dispatchEvent(new Event("storage"));
              }
            }
          })
          .catch(err => console.error("Error fetching user role:", err));
      }
    } else {
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
    }
  }, [user]);

  useEffect(() => {
    fetch("/api/app-settings")
      .then(res => res.json())
      .then(data => {
        if (data && data.logoKiri && data.logoKanan) {
          setAppSettings(data);
        }
      })
      .catch(err => console.error("Error fetching app settings:", err));
  }, []);

  const getNavItems = () => {
    const items = [];
    
    // Get permissions from localStorage or defaults
    const rolePermissions = getRolePermissions();
    // Default to a fallback if the activeRole is somehow missing, though it shouldn't be
    const currentRolePerms = rolePermissions[activeRole]?.permissions || {};

    // Dashboard
    if (currentRolePerms.dashboard !== false || activeRole === "Administrator") {
      items.push({ name: "Dasbor Analitik", href: "/", icon: LayoutDashboard });
      if (activeRole !== "Operator") {
        items.push({ name: "Dashboard AI", href: "/ai", icon: Brain });
      }
    }
    
    // Laporan Kerusakan
    if (activeRole !== "Operator") {
      items.push({ name: "Laporan Kerusakan", href: "/list", icon: FileText });
    }

    // Laporan Surat Masuk & Keluar (Khusus Operator)
    if (activeRole === "Operator" || activeRole === "Administrator") {
      items.push({ name: "Laporan Surat", href: "/surat-reports", icon: FileText });
    }

    // Buat Permohonan / Penilaian Baru
    if (activeRole === "Administrator" || activeRole === "Pengelola_Bangunan") {
      items.push({ name: "Buat Permohonan", href: "/new", icon: PlusCircle });
    } else if (activeRole === "Tim_Teknis" || activeRole === "Koordinator") {
      items.push({ name: "Penilaian Baru", href: "/new", icon: PlusCircle });
    }

    if (activeRole === "Tim_Teknis" || activeRole === "Administrator") {
      items.push({ name: "Verifikasi Teknis", href: "/verifikasi", icon: ClipboardList });
    }
    
    // Verifikasi Administrasi (Operator Dinas)
    if (activeRole === "Operator" || activeRole === "Administrator") {
      items.push({ name: "Verifikasi Administrasi", href: "/admin-verifikasi", icon: FileCheck });
    }

    // Kartu Disposisi
    if (activeRole === "Administrator" || currentRolePerms.disposition) {
      items.push({ name: "Kartu Disposisi", href: "/disposisi", icon: ClipboardList });
    }

    // Smart File Manager (Baru)
    items.push({ name: "Manajemen File", href: "/file-manager", icon: FolderOpen });

    // Peta Lokasi Bangunan
    if (currentRolePerms.showMap !== false || activeRole === "Administrator") {
      items.push({ name: "Peta Lokasi Bangunan", href: "/map", icon: MapIcon });
    }

    // Detail Profil Saya
    items.push({ name: "Detail Profil Saya", href: "/profile", icon: UserCog });

    // Pengaturan
    if (currentRolePerms.showSettings !== false || activeRole === "Administrator") {
      items.push({ name: "Pengaturan", href: "/settings", icon: SettingsIcon });
    }

    return items;
  };

  const navItems = getNavItems();

  if (!authLoaded || !minLoadingDone || !user) {
    return <LoadingSplash />;
  }

  return (
    <div className="w-full h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col font-sans overflow-hidden theme-transition">
      {/* Header Navigation */}
      <header className="h-16 bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border-b border-white/50 dark:border-slate-800/50 flex items-center justify-between px-4 sm:px-8 shrink-0 z-20 shadow-sm theme-transition">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 md:hidden theme-transition"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          {/* Toggle Sidebar Collapse for Desktop */}
          <button 
            onClick={toggleSidebarCollapse}
            className="hidden md:flex p-2 -ml-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 theme-transition cursor-pointer"
            title={isSidebarCollapsed ? "Buka Sidebar" : "Ciutkan Sidebar"}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 hidden sm:flex">
            <img 
              src={appSettings.logoKiri} 
              alt="Logo Kiri" 
              className="w-8 h-8 object-contain"
              referrerPolicy="no-referrer"
            />
            <img 
              src={appSettings.logoKanan} 
              alt="Logo Kanan" 
              className="w-8 h-8 object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <h1 className="text-xl font-extrabold text-pu-blue dark:text-white tracking-tight uppercase theme-transition">SI-PEKA <span className="font-medium text-pu-yellow font-mono text-sm tracking-normal">v1.0</span></h1>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Online/Offline Floating Status Indicator */}
          <div 
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm backdrop-blur-md border transition-all duration-300",
              !isOnline 
                ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 animate-pulse" 
                : offlineCount > 0 
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30" 
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            )}
            title={
              !isOnline 
                ? "Koneksi terputus. Mode Offline aktif. Anda masih dapat mengisi form." 
                : offlineCount > 0 
                  ? `${offlineCount} data penilaian tersimpan lokal & siap disinkronisasikan.` 
                  : "Sistem terhubung sepenuhnya dengan server (Online)."
            }
          >
            {!isOnline ? (
              <>
                <WifiOff className="w-3.5 h-3.5 animate-bounce" />
                <span className="hidden xs:inline">Offline</span>
              </>
            ) : isSyncing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span className="hidden xs:inline">Menyinkronkan...</span>
              </>
            ) : offlineCount > 0 ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                <span className="hidden xs:inline">Pending ({offlineCount})</span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="hidden xs:inline">Online</span>
              </>
            )}
          </div>

          {/* Role Simulator Selector */}
          {actualRole === "Administrator" && (
            <div className="flex items-center gap-2 bg-slate-100/95 dark:bg-slate-800/95 hover:bg-slate-200/90 dark:hover:bg-slate-700/90 border border-slate-300/50 dark:border-slate-700/50 px-3 py-1.5 rounded-xl shadow-sm transition-all theme-transition">
              <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:inline theme-transition">Simulasi Role:</span>
              <select
                value={activeRole}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-0 focus:outline-none cursor-pointer p-0 pr-6 theme-transition"
              >
                <option value="Administrator" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">👑 Admin</option>
                <option value="Pengelola_Bangunan" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">🏢 Pengelola Bangunan</option>
                <option value="Operator" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">💻 Operator PUPR</option>
                <option value="Tim_Teknis" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">🔧 Tim Teknis Lapangan</option>
                <option value="Koordinator" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">📋 Koordinator</option>
                <option value="Kabid" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">📐 Kepala Bidang</option>
                <option value="Kadis" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">🏛️ Kepala Dinas</option>
              </select>
            </div>
          )}

          <NotificationBell />

          {user ? (
            <div className="flex items-center gap-4">
              <Link to="/profile" className="flex items-center gap-3 hover:opacity-85 transition-opacity group" title="Klik untuk ubah detail profil">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest leading-none theme-transition">{user.email}</p>
                  <p className="text-sm text-slate-800 dark:text-slate-200 font-medium group-hover:text-pu-blue dark:group-hover:text-blue-400 transition-colors theme-transition">{user.displayName || 'Tim Teknis'}</p>
                </div>
                <img src={user.photoURL || ''} alt="Profile" className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-200 dark:bg-slate-800 rounded-full border-2 border-white dark:border-slate-800 shadow-sm object-cover group-hover:ring-2 group-hover:ring-pu-blue dark:group-hover:ring-blue-400 transition-all theme-transition" />
              </Link>
              <button onClick={handleLogout} className="text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors" title="Keluar">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin} 
              disabled={isLoggingIn}
              className="gsi-material-button bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs sm:text-sm py-1.5 sm:py-2 px-3 sm:px-4 rounded-md shadow-sm transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed theme-transition"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 sm:w-5 sm:h-5" style={{display: 'block'}}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              {isLoggingIn ? 'Sedang Masuk...' : <span className="hidden sm:inline">Masuk dengan Google</span>}
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Overlay (Mobile) */}
        {isSidebarOpen && (
          <div 
            className="absolute inset-0 bg-slate-900/50 dark:bg-black/60 z-20 md:hidden backdrop-blur-sm theme-transition"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={cn(
          "bg-pu-blue/90 dark:bg-slate-950/95 backdrop-blur-xl border-r border-white/10 dark:border-slate-800/80 flex flex-col gap-2 shrink-0 shadow-2xl z-30 transition-all duration-300 ease-in-out absolute md:relative h-full print:hidden theme-transition",
          isSidebarCollapsed ? "md:w-20 md:p-3 w-64 p-6" : "w-64 p-6",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}>
          {/* Collapse/Expand Floating Button (Desktop only, absolutely positioned on the right edge) */}
          <button
            type="button"
            onClick={toggleSidebarCollapse}
            className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white shadow-md z-40 hover:scale-110 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-pu-blue"
            title={isSidebarCollapsed ? "Buka Sidebar" : "Ciutkan Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          {/* Brand/Logo Info inside Sidebar */}
          <div className={cn(
            "flex flex-col items-center gap-2 bg-white/10 dark:bg-white/5 rounded-xl text-center shrink-0 border border-white/10 dark:border-white/5 theme-transition transition-all duration-300",
            isSidebarCollapsed ? "md:p-1.5 md:mb-2 p-3 mb-3" : "p-3 mb-3"
          )}>
            <div className={cn("flex items-center transition-all duration-300", isSidebarCollapsed ? "md:flex-col md:gap-1.5 gap-3" : "gap-3")}>
              <img 
                src={appSettings.logoKiri} 
                alt="Logo Kiri" 
                className={cn("object-contain drop-shadow-md transition-all duration-300", isSidebarCollapsed ? "md:w-7 md:h-7 w-9 h-9" : "w-9 h-9")}
                referrerPolicy="no-referrer"
              />
              <img 
                src={appSettings.logoKanan} 
                alt="Logo Kanan" 
                className={cn("object-contain drop-shadow-md transition-all duration-300", isSidebarCollapsed ? "md:hidden block w-9 h-9" : "w-9 h-9")}
                referrerPolicy="no-referrer"
              />
            </div>
            <div className={cn("mt-1 transition-all duration-300", isSidebarCollapsed ? "md:hidden" : "")}>
              <p className="text-[10px] font-black text-white dark:text-slate-100 uppercase tracking-wider leading-tight theme-transition">PEMKAB GARUT</p>
              <p className="text-[9px] font-medium text-blue-200 dark:text-slate-400 leading-tight theme-transition">Dinas Pekerjaan Umum & Penataan Ruang</p>
            </div>
          </div>

          <div className={cn("flex items-center mb-2 shrink-0 transition-all duration-300", isSidebarCollapsed ? "md:justify-center justify-between" : "justify-between")}>
            <div className={cn("text-[10px] font-bold text-blue-300 dark:text-slate-500 uppercase tracking-widest theme-transition transition-all duration-300", isSidebarCollapsed ? "md:hidden" : "")}>
              Menu Utama
            </div>
            <button className="md:hidden text-blue-300 dark:text-slate-400 hover:text-white dark:hover:text-slate-200 transition-colors" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0 pr-1 -mr-1 custom-scrollbar shrink">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  title={isSidebarCollapsed ? item.name : undefined}
                  className={cn(
                    "flex items-center rounded-lg font-medium text-sm transition-all duration-200 shrink-0",
                    isSidebarCollapsed ? "md:justify-center md:px-2 md:py-3 px-4 py-3" : "gap-3 px-4 py-3",
                    isActive
                      ? "bg-pu-yellow text-pu-blue dark:bg-pu-yellow dark:text-pu-blue font-bold shadow-md transform scale-[1.02]"
                      : "text-blue-100 dark:text-slate-300 hover:bg-white/10 dark:hover:bg-white/5 hover:text-white dark:hover:text-white"
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span className={cn("truncate transition-all duration-300", isSidebarCollapsed ? "md:hidden" : "")}>
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto shrink-0 pt-4">
            <div className={cn(
              "rounded-xl text-white dark:text-slate-300 backdrop-blur-sm border transition-all duration-300",
              !isOnline 
                ? "bg-red-500/10 border-red-500/20" 
                : offlineCount > 0 
                  ? "bg-amber-500/10 border-amber-500/20" 
                  : "bg-white/10 dark:bg-white/5 border-white/10 dark:border-white/5",
              isSidebarCollapsed ? "md:p-2 md:flex md:flex-col md:items-center md:justify-center" : "p-4"
            )}>
              <div className={cn("transition-all duration-300", isSidebarCollapsed ? "md:hidden" : "")}>
                <p className="text-xs text-blue-200 dark:text-slate-400 mb-1 font-medium theme-transition">Status Sistem</p>
              </div>
              
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center gap-2">
                  <div 
                    className={cn(
                      "w-2 h-2 rounded-full",
                      !isOnline 
                        ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" 
                        : offlineCount > 0 
                          ? "bg-amber-400 animate-ping shadow-[0_0_8px_rgba(251,191,36,0.8)]" 
                          : "bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]"
                    )} 
                    title={!isOnline ? "Offline" : offlineCount > 0 ? "Menunggu Sinkronisasi" : "Online & Tersinkron"}
                  ></div>
                  
                  <span className={cn("text-sm font-semibold tracking-wide text-white dark:text-slate-200 theme-transition truncate transition-all duration-300", isSidebarCollapsed ? "md:hidden" : "")}>
                    {!isOnline 
                      ? "Mode Offline" 
                      : offlineCount > 0 
                        ? "Ada Data Pending" 
                        : "Online & Tersinkron"
                    }
                  </span>
                </div>

                {!isSidebarCollapsed && offlineCount > 0 && (
                  <div className="text-xs text-slate-300 dark:text-slate-400 bg-black/20 rounded-lg p-2 flex flex-col gap-1.5 mt-1">
                    <div className="flex justify-between items-center">
                      <span>Draf Pending:</span>
                      <span className="font-bold text-amber-400">{offlineCount} item</span>
                    </div>
                    {isOnline && (
                      <button
                        onClick={syncOfflineAssessments}
                        disabled={isSyncing}
                        className="w-full flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold py-1 px-2 rounded text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
                        {isSyncing ? "Menyinkronkan..." : "Sinkronkan Sekarang"}
                      </button>
                    )}
                  </div>
                )}
                
                {isSidebarCollapsed && offlineCount > 0 && (
                  <div 
                    className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black cursor-pointer md:mt-1" 
                    title={`${offlineCount} item menunggu sinkronisasi`}
                    onClick={isOnline ? syncOfflineAssessments : undefined}
                  >
                    {isSyncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : offlineCount}
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>

      {/* Version Conflict Resolution Overlay */}
      {conflict && (
        <div id="conflict-resolution-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div id="conflict-modal-card" className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            
            {/* Header */}
            <div id="conflict-modal-header" className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">Deteksi Konflik Versi Penilaian</h2>
                <p className="text-xs text-amber-50 opacity-90">Ada perbedaan data antara draf di memori lokal dengan data terbaru di server.</p>
              </div>
            </div>

            {/* Content body */}
            <div id="conflict-modal-body" className="p-6 space-y-6">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Sistem mendeteksi bahwa penilaian untuk sekolah <strong className="text-slate-800 dark:text-slate-200">"{conflict.offlineItem.schoolName || conflict.offlineItem.payload?.schoolName || 'Sekolah'}"</strong> telah dimodifikasi secara terpisah. Harap pilih versi mana yang ingin Anda pertahankan di dalam sistem:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Local Version Card */}
                <div id="local-version-card" className="border border-amber-300 dark:border-amber-950 bg-amber-500/5 dark:bg-amber-500/2 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Smartphone className="w-5 h-5 text-amber-500" />
                      <span className="font-extrabold text-sm text-amber-700 dark:text-amber-400 uppercase tracking-wider">Versi Perangkat (Lokal)</span>
                    </div>
                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="font-medium">Sekolah:</span> {conflict.offlineItem.schoolName || conflict.offlineItem.payload?.schoolName || "-"}
                      </div>
                      <div>
                        <span className="font-medium">Bangunan:</span> {conflict.offlineItem.payload?.buildingName || "-"}
                      </div>
                      <div>
                        <span className="font-medium">Tingkat Kerusakan:</span>{" "}
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {conflict.offlineItem.payload?.finalResult?.totalDamagePercentage?.toFixed(2)}% ({conflict.offlineItem.payload?.finalResult?.category})
                        </span>
                      </div>
                      <div>
                        <span className="font-medium font-mono text-[10px]">Terakhir Disimpan:</span>{" "}
                        {conflict.offlineItem.timestamp ? new Date(conflict.offlineItem.timestamp).toLocaleString("id-ID") : "-"}
                      </div>
                    </div>
                  </div>
                  <button
                    id="btn-keep-local"
                    onClick={() => resolveConflict(true)}
                    className="mt-6 w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Gunakan Versi Lokal
                    <span className="text-[10px] font-normal opacity-85">(Timpa Server)</span>
                  </button>
                </div>

                {/* Server Version Card */}
                <div id="server-version-card" className="border border-blue-300 dark:border-blue-950 bg-blue-500/5 dark:bg-blue-500/2 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Database className="w-5 h-5 text-blue-500" />
                      <span className="font-extrabold text-sm text-blue-700 dark:text-blue-400 uppercase tracking-wider">Versi Server (Database)</span>
                    </div>
                    <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="font-medium">Sekolah:</span> {conflict.serverData.schoolName || "-"}
                      </div>
                      <div>
                        <span className="font-medium">Bangunan:</span> {conflict.serverData.buildingName || "-"}
                      </div>
                      <div>
                        <span className="font-medium">Tingkat Kerusakan:</span>{" "}
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {conflict.serverData.finalResult?.totalDamagePercentage?.toFixed(2)}% ({conflict.serverData.finalResult?.category})
                        </span>
                      </div>
                      <div>
                        <span className="font-medium font-mono text-[10px]">Terakhir Disimpan:</span>{" "}
                        {conflict.serverData.date ? new Date(conflict.serverData.date).toLocaleString("id-ID") : "-"}
                      </div>
                    </div>
                  </div>
                  <button
                    id="btn-keep-server"
                    onClick={() => resolveConflict(false)}
                    className="mt-6 w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    Gunakan Versi Server
                    <span className="text-[10px] font-normal opacity-85">(Buang Lokal)</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div id="conflict-modal-footer" className="bg-slate-50 dark:bg-slate-950/40 px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
              <button
                id="btn-cancel-conflict"
                onClick={() => {
                  setConflict(null);
                  if (resolveConflictPromiseRef.current) {
                    resolveConflictPromiseRef.current(false);
                  }
                }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg transition-all cursor-pointer"
              >
                Putuskan Nanti (Lewati)
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
