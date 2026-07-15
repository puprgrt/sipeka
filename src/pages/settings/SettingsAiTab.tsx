import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Brain, Loader2, Edit2, Save, Settings as SettingsIcon } from "lucide-react";
import type { AiConfig } from "./settingsTypes";

interface SettingsAiTabProps {
  onToast: (msg: string) => void;
}

export default function SettingsAiTab({ onToast }: SettingsAiTabProps) {
  const [aiConfig, setAiConfig] = useState<AiConfig>({
    apiKey: "",
    model: "gemini-3.5-flash",
    autoAnalyze: true,
    confidenceThreshold: 85,
    visionPrompt: "",
    documentPrompt: ""
  });
  const [isSavingAi, setIsSavingAi] = useState(false);

  useEffect(() => {
    fetchAiConfig();
  }, []);

  const fetchAiConfig = async () => {
    try {
      const res = await fetch('/api/ai-settings');
      const data = await res.json();
      if (data && Object.keys(data).length > 0) {
        setAiConfig(data);
      }
    } catch (err) {
      console.error("Failed to fetch ai settings:", err);
    }
  };

  const handleSaveAiConfig = async () => {
    setIsSavingAi(true);
    try {
      const res = await fetch('/api/ai-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiConfig)
      });
      if (res.ok) {
        onToast('Pengaturan AI berhasil disimpan');
      } else {
        alert('Gagal menyimpan pengaturan AI');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan pengaturan AI');
    }
    setIsSavingAi(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-600" />
            Pengaturan Kecerdasan Buatan (AI)
          </h2>
          <p className="text-sm text-slate-500 mt-1">Konfigurasi parameter model, tingkat deteksi, dan instruksi mesin (Prompt Engineering).</p>
        </div>
        <button 
          onClick={handleSaveAiConfig}
          disabled={isSavingAi}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
        >
          {isSavingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Konfigurasi
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 space-y-5">
          <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-slate-400" /> Konfigurasi Utama
          </h3>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">API Key Gemini</label>
            <input 
              type="password" 
              value={aiConfig.apiKey}
              onChange={(e) => setAiConfig({...aiConfig, apiKey: e.target.value})}
              placeholder="Biarkan kosong untuk menggunakan .env (Server)"
              className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
            />
            <p className="text-[10px] text-slate-500 mt-1">Kredensial dari Google AI Studio. Sangat rahasia.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Model Visual Default</label>
            <select 
              value={aiConfig.model}
              onChange={(e) => setAiConfig({...aiConfig, model: e.target.value})}
              className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
            >
              <option value="gemini-3.5-flash">Gemini 3.5 Flash (Sangat Cepat)</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Akurat &amp; Detail)</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Analisis Otomatis</h4>
              <p className="text-[10px] text-slate-500">Memicu deteksi visual langsung saat foto diunggah.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={aiConfig.autoAnalyze} onChange={(e) => setAiConfig({...aiConfig, autoAnalyze: e.target.checked})} />
              <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Tingkat Keyakinan Minimum (Threshold)</label>
              <span className="text-xs font-mono font-bold text-indigo-600">{aiConfig.confidenceThreshold}%</span>
            </div>
            <input 
              type="range" 
              min="50" max="99" 
              value={aiConfig.confidenceThreshold}
              onChange={(e) => setAiConfig({...aiConfig, confidenceThreshold: parseInt(e.target.value)})}
              className="w-full accent-indigo-600"
            />
            <p className="text-[10px] text-slate-500 mt-1">Sistem hanya akan menyetujui temuan AI dengan keyakinan di atas persentase ini.</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 space-y-5">
          <h3 className="text-sm font-bold text-slate-800 border-b pb-2 mb-4 flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-slate-400" /> Prompt Engineering
          </h3>
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Instruksi AI (Vision Damage Detection)</label>
            <textarea 
              rows={5}
              value={aiConfig.visionPrompt}
              onChange={(e) => setAiConfig({...aiConfig, visionPrompt: e.target.value})}
              className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none leading-relaxed"
            />
            <p className="text-[10px] text-slate-500 mt-1">Prompt utama yang digunakan untuk mendeteksi retak dan kerusakan struktur dari gambar.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Instruksi AI (Document Review)</label>
            <textarea 
              rows={5}
              value={aiConfig.documentPrompt}
              onChange={(e) => setAiConfig({...aiConfig, documentPrompt: e.target.value})}
              className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none leading-relaxed"
            />
            <p className="text-[10px] text-slate-500 mt-1">Prompt khusus untuk mendeteksi masalah administratif/kelaikan pada PDF dan dokumen.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
