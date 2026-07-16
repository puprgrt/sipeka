import { useState, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Layers, Users, Shield, FileText, Printer, Settings as SettingsIcon, HelpCircle, Info, UserCog, Check } from "lucide-react";
import { cn } from "../lib/utils";

// Lazy loading all tab components for better performance
const SettingsAppTab = lazy(() => import("./settings/SettingsAppTab"));
const SettingsComponentTab = lazy(() => import("./settings/SettingsComponentTab"));
const SettingsKatalogTab = lazy(() => import("./settings/SettingsKatalogTab"));
const SettingsUsersTab = lazy(() => import("./settings/SettingsUsersTab"));
const SettingsFormTab = lazy(() => import("./settings/SettingsFormTab"));
const SettingsProfileParamTab = lazy(() => import("./settings/SettingsProfileParamTab"));
const SettingsDinasTab = lazy(() => import("./settings/SettingsDinasTab"));
const SettingsLetterTab = lazy(() => import("./settings/SettingsLetterTab"));
const SettingsTemplateTab = lazy(() => import("./settings/SettingsTemplateTab"));
const SettingsAiTab = lazy(() => import("./settings/SettingsAiTab"));

export default function Settings() {
  const [activeRole, setActiveRole] = useState<string>(() => {
    return localStorage.getItem("activeRole") || "Administrator";
  });

  const getAvailableTabsList = (role: string) => {
    switch (role) {
      case "Administrator":
        return ["aplikasi", "komponen", "katalog", "users", "formulir", "param_profil", "dinas", "surat", "template", "ai"];
      case "Kadis":
      case "Kabid":
        return ["aplikasi", "dinas", "surat", "users"];
      case "Koordinator":
      case "Tim_Teknis":
        return ["komponen", "katalog", "formulir"];
      case "Operator":
        return ["surat", "dinas", "param_profil"];
      case "Pengelola_Bangunan":
        return ["surat"];
      default:
        return ["surat", "dinas", "param_profil"];
    }
  };

  const availableTabs = getAvailableTabsList(activeRole);
  const [activeTab, setActiveTab] = useState<string>(availableTabs[0]);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  useEffect(() => {
    const handleStorageChange = () => {
      setActiveRole(localStorage.getItem("activeRole") || "Administrator");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    setActiveTab(getAvailableTabsList(activeRole)[0]);
  }, [activeRole]);

  const showToast = (message: string) => {
    setSaveToast(message);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const ALL_TABS = [
    { id: "aplikasi", label: "Logo Aplikasi", icon: SettingsIcon },
    { id: "komponen", label: "Parameter Komponen", icon: Layers },
    { id: "katalog", label: "Kamus Visual (PUPR)", icon: HelpCircle },
    { id: "users", label: "Pengaturan User", icon: Users },
    { id: "formulir", label: "Parameter Formulir", icon: Info },
    { id: "param_profil", label: "Parameter Profil", icon: UserCog },
    { id: "dinas", label: "Profil Dinas", icon: Shield },
    { id: "surat", label: "Kop Surat", icon: Printer },
    { id: "template", label: "Pusat Template", icon: FileText },
    { id: "ai", label: "Pengaturan AI", icon: Brain },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 max-w-6xl mx-auto pb-12"
    >
      {/* Tabs Selector */}
      <div className="flex overflow-x-auto custom-scrollbar bg-slate-200/50 backdrop-blur-sm p-1 rounded-2xl max-w-5xl border border-slate-200/50 shadow-inner gap-1">
        {ALL_TABS.filter(t => availableTabs.includes(t.id)).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-shrink-0 flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold rounded-xl transition-all duration-200 whitespace-nowrap",
              activeTab === tab.id
                ? "bg-white text-pu-blue shadow-md scale-[1.02]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/40"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lazy Loaded Tab Content */}
      <Suspense fallback={<div className="p-16 flex justify-center"><div className="w-8 h-8 border-4 border-pu-blue border-t-transparent rounded-full animate-spin"></div></div>}>
        {activeTab === "aplikasi" && <SettingsAppTab onToast={showToast} />}
        {activeTab === "komponen" && <SettingsComponentTab onToast={showToast} />}
        {activeTab === "katalog" && <SettingsKatalogTab onToast={showToast} />}
        {activeTab === "users" && <SettingsUsersTab onToast={showToast} />}
        {activeTab === "formulir" && <SettingsFormTab onToast={showToast} />}
        {activeTab === "param_profil" && <SettingsProfileParamTab onToast={showToast} />}
        {activeTab === "dinas" && <SettingsDinasTab onToast={showToast} />}
        {activeTab === "surat" && <SettingsLetterTab onToast={showToast} />}
        {activeTab === "template" && <SettingsTemplateTab onToast={showToast} />}
        {activeTab === "ai" && <SettingsAiTab onToast={showToast} />}
      </Suspense>

      {/* Global Save Toast Notification */}
      <AnimatePresence>
        {saveToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-50 border border-slate-700/50"
          >
            <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <Check className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Berhasil</h4>
              <p className="text-xs text-slate-300 mt-0.5">{saveToast}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
