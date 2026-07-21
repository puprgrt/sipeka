import { apiFetch } from "../../lib/api";
import { useState, useEffect } from "react";
import { Edit2, UploadCloud } from "lucide-react";
import type { LetterConfig } from "./settingsTypes";

interface SettingsLetterTabProps {
  onToast: (msg: string) => void;
}

export default function SettingsLetterTab({ onToast }: SettingsLetterTabProps) {
  const [letterConfig, setLetterConfig] = useState<LetterConfig | null>(null);
  const [loadingLetter, setLoadingLetter] = useState(false);
  const [editingLetter, setEditingLetter] = useState(false);
  const [letterForm, setLetterForm] = useState<LetterConfig | null>(null);

  const activeRole = localStorage.getItem("activeRole") || "Administrator";
  const isPengelola = activeRole === "Pengelola_Bangunan";

  useEffect(() => { fetchLetterConfig(); }, []);

  const fetchLetterConfig = async () => {
    setLoadingLetter(true);
    try {
      const res = await apiFetch("/api/pengaturan-surat");
      const data = await res.json();
      setLetterConfig(data);
      setLetterForm(data);
    } catch (error) { console.error("Gagal mengambil pengaturan surat", error); }
    finally { setLoadingLetter(false); }
  };

  const handleSaveLetter = async () => {
    if (!letterForm) return;
    try {
      const res = await apiFetch("/api/pengaturan-surat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(letterForm),
      });
      const data = await res.json();
      setLetterConfig(data);
      setEditingLetter(false);
      onToast("Pengaturan kop surat dinas & pengelola berhasil disimpan!");
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan pengaturan surat");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'sistem.logoKiri' | 'sistem.logoKanan' | 'pengelola.logoKiri' | 'pengelola.logoKanan') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { alert("Ukuran file maksimal 2MB"); return; }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const parts = field.split('.');
        const type = parts[0] as 'sistem' | 'pengelola';
        const key = parts[1] as 'logoKiri' | 'logoKanan';
        
        setLetterForm(prev => {
          if (!prev) return prev;
          return { ...prev, [type]: { ...prev[type], [key]: base64String } };
        });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loadingLetter || !letterForm) {
    return <div className="py-8 text-center text-slate-500 font-medium animate-pulse">Memuat pengaturan surat...</div>;
  }

  const renderConfigSection = (title: string, type: 'sistem' | 'pengelola') => (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-700 border-b pb-2">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Logo Kiri</label>
          <div className="flex gap-2">
            <input type="text" disabled={!editingLetter} value={letterForm[type].logoKiri} onChange={e => setLetterForm({...letterForm, [type]: {...letterForm[type], logoKiri: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-xs disabled:opacity-60" />
            <label className="flex items-center justify-center bg-white border border-slate-300 text-slate-600 rounded-lg px-3 hover:bg-slate-50 cursor-pointer disabled:opacity-60 transition-colors">
              <UploadCloud className="w-4 h-4" />
              <input type="file" accept="image/*" disabled={!editingLetter} className="hidden" onChange={e => handleFileUpload(e, `${type}.logoKiri`)} />
            </label>
          </div>
          {letterForm[type].logoKiri && <div className="mt-2 h-16"><img src={letterForm[type].logoKiri} className="h-full object-contain" alt="Logo Kiri" /></div>}
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Logo Kanan</label>
          <div className="flex gap-2">
            <input type="text" disabled={!editingLetter} value={letterForm[type].logoKanan} onChange={e => setLetterForm({...letterForm, [type]: {...letterForm[type], logoKanan: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-xs disabled:opacity-60" />
            <label className="flex items-center justify-center bg-white border border-slate-300 text-slate-600 rounded-lg px-3 hover:bg-slate-50 cursor-pointer disabled:opacity-60 transition-colors">
              <UploadCloud className="w-4 h-4" />
              <input type="file" accept="image/*" disabled={!editingLetter} className="hidden" onChange={e => handleFileUpload(e, `${type}.logoKanan`)} />
            </label>
          </div>
          {letterForm[type].logoKanan && <div className="mt-2 h-16"><img src={letterForm[type].logoKanan} className="h-full object-contain" alt="Logo Kanan" /></div>}
        </div>
      </div>
      <div><label className="block text-xs font-bold text-slate-600 mb-1">Nama Instansi Atas</label><input type="text" disabled={!editingLetter} value={letterForm[type].namaInstansiAtas} onChange={e => setLetterForm({...letterForm, [type]: {...letterForm[type], namaInstansiAtas: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm disabled:opacity-60" /></div>
      <div><label className="block text-xs font-bold text-slate-600 mb-1">Nama Instansi Bawah</label><input type="text" disabled={!editingLetter} value={letterForm[type].namaInstansiBawah} onChange={e => setLetterForm({...letterForm, [type]: {...letterForm[type], namaInstansiBawah: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm disabled:opacity-60 font-bold" /></div>
      <div><label className="block text-xs font-bold text-slate-600 mb-1">Alamat</label><input type="text" disabled={!editingLetter} value={letterForm[type].alamat} onChange={e => setLetterForm({...letterForm, [type]: {...letterForm[type], alamat: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm disabled:opacity-60" /></div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className="block text-xs font-bold text-slate-600 mb-1">Nomor Telepon</label><input type="text" disabled={!editingLetter} value={letterForm[type].nomorTelepon} onChange={e => setLetterForm({...letterForm, [type]: {...letterForm[type], nomorTelepon: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm disabled:opacity-60" /></div>
        <div><label className="block text-xs font-bold text-slate-600 mb-1">Email</label><input type="email" disabled={!editingLetter} value={letterForm[type].email} onChange={e => setLetterForm({...letterForm, [type]: {...letterForm[type], email: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm disabled:opacity-60" /></div>
        <div><label className="block text-xs font-bold text-slate-600 mb-1">Website</label><input type="text" disabled={!editingLetter} value={letterForm[type].website} onChange={e => setLetterForm({...letterForm, [type]: {...letterForm[type], website: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm disabled:opacity-60" /></div>
      </div>
      {type === 'sistem' && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <h4 className="text-xs font-bold text-slate-700 mb-3">Tanda Tangan Pengesahan</h4>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nama Kepala Dinas</label><input type="text" disabled={!editingLetter} value={letterForm.sistem.namaKepala} onChange={e => setLetterForm({...letterForm, sistem: {...letterForm.sistem, namaKepala: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm disabled:opacity-60 font-bold" /></div>
            <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">NIP</label><input type="text" disabled={!editingLetter} value={letterForm.sistem.nipKepala} onChange={e => setLetterForm({...letterForm, sistem: {...letterForm.sistem, nipKepala: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm disabled:opacity-60" /></div>
          </div>
          <div className="mt-2"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Jabatan</label><input type="text" disabled={!editingLetter} value={letterForm.sistem.jabatan} onChange={e => setLetterForm({...letterForm, sistem: {...letterForm.sistem, jabatan: e.target.value}})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm disabled:opacity-60" /></div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg overflow-hidden flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Pengaturan Kop Surat & Dokumen</h2>
          <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Konfigurasi header dokumen untuk surat pengantar pengelola dan surat pengesahan dinas</p>
        </div>
        {!editingLetter ? (
          <button onClick={() => setEditingLetter(true)} className="inline-flex items-center px-4 py-2 bg-pu-blue text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all hover:scale-105 active:scale-95">
            <Edit2 className="h-4 w-4 mr-2" /> Edit Kop Surat
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => { setEditingLetter(false); setLetterForm(letterConfig); }} className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Batal</button>
            <button onClick={handleSaveLetter} className="px-4 py-2 bg-pu-blue text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition-colors shadow-sm">Simpan Perubahan</button>
          </div>
        )}
      </div>
      <div className={`grid grid-cols-1 ${!isPengelola ? 'md:grid-cols-2 gap-8 divide-x divide-slate-100' : ''}`}>
        {!isPengelola && (
          <div className="pr-4">{renderConfigSection("Kop Surat Dinas (Hasil Pengesahan)", "sistem")}</div>
        )}
        <div className={!isPengelola ? "pl-4" : ""}>{renderConfigSection("Kop Surat Pengelola (Permohonan)", "pengelola")}</div>
      </div>
    </div>
  );
}
