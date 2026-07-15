import { useState, useEffect } from "react";
import { Edit2, UploadCloud, Sun, Moon } from "lucide-react";
import { cn } from "../../lib/utils";
import type { AppConfig } from "./settingsTypes";

interface SettingsAppTabProps {
  onToast: (msg: string) => void;
}

export default function SettingsAppTab({ onToast }: SettingsAppTabProps) {
  const [appConfig, setAppConfig] = useState<AppConfig>({ logoKiri: "", logoKanan: "", templateDriveLink: "" });
  const [loadingAppConfig, setLoadingAppConfig] = useState(false);
  const [editingAppConfig, setEditingAppConfig] = useState(false);
  const [appConfigForm, setAppConfigForm] = useState<AppConfig>({ logoKiri: "", logoKanan: "", templateDriveLink: "" });

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    fetchAppConfig();
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
    window.dispatchEvent(new Event("storage"));
  }, [theme]);

  const fetchAppConfig = async () => {
    setLoadingAppConfig(true);
    try {
      const res = await fetch("/api/app-settings");
      const data = await res.json();
      setAppConfig(data);
      setAppConfigForm(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingAppConfig(false);
    }
  };

  const handleSaveAppConfig = async () => {
    try {
      const res = await fetch("/api/app-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appConfigForm)
      });
      if (res.ok) {
        setAppConfig(appConfigForm);
        setEditingAppConfig(false);
        onToast("Pengaturan logo aplikasi berhasil disimpan!");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleAppLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoKiri' | 'logoKanan') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAppConfigForm(prev => ({
          ...prev,
          [field]: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg overflow-hidden flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Pengaturan Logo Aplikasi</h2>
          <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
            Atur logo utama yang tampil di seluruh sistem
          </p>
        </div>
        {!editingAppConfig ? (
          <button 
            onClick={() => {
              setEditingAppConfig(true);
              setAppConfigForm(appConfig);
            }}
            className="inline-flex items-center px-4 py-2 bg-pu-blue text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all hover:scale-105 active:scale-95"
          >
            <Edit2 className="h-4 w-4 mr-2" /> Edit Logo
          </button>
        ) : (
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setEditingAppConfig(false);
                setAppConfigForm(appConfig);
              }}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              Batal
            </button>
            <button 
              onClick={handleSaveAppConfig}
              className="px-4 py-2 bg-pu-blue text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition-colors shadow-sm"
            >
              Simpan Logo
            </button>
          </div>
        )}
      </div>

      {loadingAppConfig ? (
        <div className="py-8 text-center text-slate-500 font-medium animate-pulse">Memuat pengaturan aplikasi...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-[11px] font-bold text-slate-600">Logo Aplikasi (Kiri)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                disabled={!editingAppConfig}
                value={appConfigForm.logoKiri} 
                onChange={e => setAppConfigForm({ ...appConfigForm, logoKiri: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
              />
              <label className="flex items-center justify-center bg-white border border-slate-300 text-slate-600 rounded-lg px-3 hover:bg-slate-50 cursor-pointer disabled:opacity-60 transition-colors">
                <UploadCloud className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  disabled={!editingAppConfig}
                  className="hidden"
                  onChange={e => handleAppLogoUpload(e, 'logoKiri')}
                />
              </label>
            </div>
            {appConfigForm.logoKiri && (
              <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-slate-50 flex justify-center">
                <img src={appConfigForm.logoKiri} alt="Preview Logo Kiri" className="h-16 object-contain" />
              </div>
            )}
          </div>
          <div className="space-y-4">
            <label className="block text-[11px] font-bold text-slate-600">Logo Aplikasi (Kanan)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                disabled={!editingAppConfig}
                value={appConfigForm.logoKanan} 
                onChange={e => setAppConfigForm({ ...appConfigForm, logoKanan: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60" 
              />
              <label className="flex items-center justify-center bg-white border border-slate-300 text-slate-600 rounded-lg px-3 hover:bg-slate-50 cursor-pointer disabled:opacity-60 transition-colors">
                <UploadCloud className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  disabled={!editingAppConfig}
                  className="hidden"
                  onChange={e => handleAppLogoUpload(e, 'logoKanan')}
                />
              </label>
            </div>
            {appConfigForm.logoKanan && (
              <div className="mt-4 p-4 border border-slate-200 rounded-xl bg-slate-50 flex justify-center">
                <img src={appConfigForm.logoKanan} alt="Preview Logo Kanan" className="h-16 object-contain" />
              </div>
            )}
          </div>
          
          {/* Template Drive Link */}
          <div className="space-y-4 md:col-span-2 border-t border-slate-200 pt-6 mt-2">
            <label className="block text-[11px] font-bold text-slate-600">Link Folder Google Drive (Template Dokumen)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                disabled={!editingAppConfig}
                value={appConfigForm.templateDriveLink || ""} 
                onChange={e => setAppConfigForm({ ...appConfigForm, templateDriveLink: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:bg-white text-xs disabled:opacity-60"
                placeholder="https://drive.google.com/drive/folders/..." 
              />
            </div>
            <p className="text-[10px] text-slate-500 font-mono">Tautan ke folder Google Drive yang berisi format asli (Word/Excel) dari template dokumen aplikasi.</p>
          </div>
        </div>
      )}

      {/* Pengaturan Tema & Tampilan */}
      <div className="mt-8 pt-8 border-t border-slate-200/50 dark:border-slate-700/50">
        <div className="mb-6">
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Pengaturan Tema & Tampilan</h3>
          <p className="mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest font-mono">
            Pilih tema tampilan sistem yang paling nyaman untuk Anda
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={cn(
              "flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer",
              theme === "light"
                ? "bg-white border-pu-blue shadow-md scale-[1.01] dark:bg-slate-800 dark:border-pu-blue"
                : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 dark:bg-slate-800/20 dark:border-slate-700 dark:hover:bg-slate-800/40"
            )}
          >
            <div className={cn(
              "p-3 rounded-xl border transition-all duration-300",
              theme === "light"
                ? "bg-amber-50 text-amber-500 border-amber-100 dark:bg-amber-950/35 dark:border-amber-900/50"
                : "bg-white text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500"
            )}>
              <Sun className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                Mode Terang
                {theme === "light" && (
                  <span className="bg-pu-blue text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Aktif</span>
                )}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                Tampilan klasik bernuansa terang dengan kontras tajam, ideal untuk penggunaan di siang hari atau ruangan terang benderang.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={cn(
              "flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer",
              theme === "dark"
                ? "bg-white border-pu-blue shadow-md scale-[1.01] dark:bg-slate-800 dark:border-pu-blue"
                : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 dark:bg-slate-800/20 dark:border-slate-700 dark:hover:bg-slate-800/40"
            )}
          >
            <div className={cn(
              "p-3 rounded-xl border transition-all duration-300",
              theme === "dark"
                ? "bg-indigo-50 text-indigo-500 border-indigo-100 dark:bg-indigo-950/35 dark:border-indigo-900/50 dark:text-indigo-400"
                : "bg-white text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500"
            )}>
              <Moon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                Mode Gelap
                {theme === "dark" && (
                  <span className="bg-pu-blue text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">Aktif</span>
                )}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                Tampilan bernuansa gelap yang modern, dirancang khusus untuk kenyamanan mata di malam hari atau lingkungan redup.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
