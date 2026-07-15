import { useState, useEffect } from "react";
import { Edit2 } from "lucide-react";
import type { DinasConfig, UserConfig } from "./settingsTypes";

interface SettingsDinasTabProps {
  onToast: (msg: string) => void;
}

export default function SettingsDinasTab({ onToast }: SettingsDinasTabProps) {
  const [dinasConfig, setDinasConfig] = useState<DinasConfig | null>(null);
  const [loadingDinas, setLoadingDinas] = useState(false);
  const [editingDinas, setEditingDinas] = useState(false);
  const [dinasForm, setDinasForm] = useState<Partial<DinasConfig>>({});
  const [usersList, setUsersList] = useState<UserConfig[]>([]);

  useEffect(() => {
    fetchDinas();
    fetchUsers();
  }, []);

  const fetchDinas = async () => {
    setLoadingDinas(true);
    try {
      const res = await fetch("/api/dinas");
      const data = await res.json();
      setDinasConfig(data);
      setDinasForm(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingDinas(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (Array.isArray(data)) setUsersList(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveDinas = async () => {
    if (!dinasForm.namaDinas || !dinasForm.alamat) {
      alert("Nama Dinas dan Alamat wajib diisi!");
      return;
    }
    try {
      const res = await fetch("/api/dinas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dinasForm),
      });
      const data = await res.json();
      setDinasConfig(data);
      setEditingDinas(false);
      onToast("Pengaturan profil dinas berhasil disimpan!");
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan profil dinas");
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg overflow-hidden flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Profil Dinas PUPR</h2>
          <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Informasi Institusi dan Pejabat Terkait</p>
        </div>
        {!editingDinas && (
          <button 
            onClick={() => setEditingDinas(true)}
            className="inline-flex items-center px-4 py-2 bg-pu-blue text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all hover:scale-105 active:scale-95"
          >
            <Edit2 className="h-4 w-4 mr-2" /> Edit Profil
          </button>
        )}
      </div>
      
      {loadingDinas ? (
         <div className="py-8 text-center text-slate-500 font-medium">Memuat profil dinas...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 border-b pb-2">Detail Institusi</h3>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Nama Dinas <span className="text-red-500">*</span></label>
              {editingDinas ? (
                <input type="text" value={dinasForm.namaDinas || ''} onChange={e => setDinasForm({...dinasForm, namaDinas: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm" />
              ) : (
                <div className="text-sm font-bold text-slate-900">{dinasConfig?.namaDinas || '-'}</div>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Alamat Lengkap <span className="text-red-500">*</span></label>
              {editingDinas ? (
                <textarea value={dinasForm.alamat || ''} onChange={e => setDinasForm({...dinasForm, alamat: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm" rows={3}></textarea>
              ) : (
                <div className="text-sm font-medium text-slate-900">{dinasConfig?.alamat || '-'}</div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Kontak Telepon</label>
                {editingDinas ? (
                  <input type="text" value={dinasForm.kontak || ''} onChange={e => setDinasForm({...dinasForm, kontak: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm" />
                ) : (
                  <div className="text-sm font-medium text-slate-900">{dinasConfig?.kontak || '-'}</div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
                {editingDinas ? (
                  <input type="email" value={dinasForm.email || ''} onChange={e => setDinasForm({...dinasForm, email: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm" />
                ) : (
                  <div className="text-sm font-medium text-slate-900">{dinasConfig?.email || '-'}</div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Website</label>
              {editingDinas ? (
                <input type="text" value={dinasForm.website || ''} onChange={e => setDinasForm({...dinasForm, website: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm" />
              ) : (
                <div className="text-sm font-medium text-slate-900">{dinasConfig?.website || '-'}</div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="font-bold text-slate-700 border-b pb-2">Pejabat & Penanggung Jawab</h3>
            
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Kepala Dinas</label>
              {editingDinas ? (
                <select 
                  value={dinasForm.idKadis || ""} 
                  onChange={e => setDinasForm({...dinasForm, idKadis: e.target.value ? Number(e.target.value) : null})} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm"
                >
                  <option value="">-- Pilih User (Kepala Dinas) --</option>
                  {usersList.map(u => (
                    <option key={u.idUser} value={u.idUser}>{u.namaLengkap} ({u.role})</option>
                  ))}
                </select>
              ) : (
                <div className="text-sm font-medium text-slate-900">
                  {dinasConfig?.idKadis ? usersList.find(u => u.idUser === dinasConfig.idKadis)?.namaLengkap : '-'}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Kepala Bidang (Kabid)</label>
              {editingDinas ? (
                <select 
                  value={dinasForm.idKabid || ""} 
                  onChange={e => setDinasForm({...dinasForm, idKabid: e.target.value ? Number(e.target.value) : null})} 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white/50 focus:bg-white text-sm"
                >
                  <option value="">-- Pilih User (Kepala Bidang) --</option>
                  {usersList.map(u => (
                    <option key={u.idUser} value={u.idUser}>{u.namaLengkap} ({u.role})</option>
                  ))}
                </select>
              ) : (
                <div className="text-sm font-medium text-slate-900">
                  {dinasConfig?.idKabid ? usersList.find(u => u.idUser === dinasConfig.idKabid)?.namaLengkap : '-'}
                </div>
              )}
            </div>

            {editingDinas && (
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
                <button 
                  onClick={() => { setEditingDinas(false); setDinasForm(dinasConfig || {}); }}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Batal
                </button>
                <button 
                  onClick={handleSaveDinas}
                  className="px-4 py-2 bg-pu-blue text-white font-bold text-xs rounded-xl hover:bg-blue-800 transition-colors shadow-sm"
                >
                  Simpan Perubahan
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
