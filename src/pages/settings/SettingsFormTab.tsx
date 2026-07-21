import { apiFetch } from "../../lib/api";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, X } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { BuildingParamConfig } from "./settingsTypes";
import { SortableBuildingParamRow } from "./SortableRows";

interface SettingsFormTabProps {
  onToast: (msg: string) => void;
}

export default function SettingsFormTab({ onToast }: SettingsFormTabProps) {
  const [buildingParams, setBuildingParams] = useState<BuildingParamConfig[]>([]);
  const [loadingParams, setLoadingParams] = useState(false);
  const [editingParamId, setEditingParamId] = useState<string | null>(null);
  const [isAddingParam, setIsAddingParam] = useState(false);
  const [paramForm, setParamForm] = useState<Partial<BuildingParamConfig>>({ label: "", type: "text", placeholder: "", required: true, enabled: true });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { fetchBuildingParams(); }, []);

  const fetchBuildingParams = async () => {
    setLoadingParams(true);
    try { const res = await apiFetch("/api/building-parameters"); const data = await res.json(); if (Array.isArray(data)) setBuildingParams(data); else setBuildingParams([]); }
    catch (error) { console.error(error); } finally { setLoadingParams(false); }
  };

  const handleEditParam = (param: BuildingParamConfig) => { setEditingParamId(param.id); setParamForm(param); setIsAddingParam(false); };

  const handleSaveParam = async () => {
    if (!paramForm.label) { alert("Label parameter wajib diisi!"); return; }
    try {
      if (isAddingParam) { await apiFetch("/api/building-parameters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(paramForm) }); }
      else { await apiFetch(`/api/building-parameters/${editingParamId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(paramForm) }); }
      setEditingParamId(null); setIsAddingParam(false); fetchBuildingParams();
      onToast("Parameter formulir berhasil disimpan!");
    } catch (error) { console.error(error); }
  };

  const handleDeleteParam = async (id: string) => {
    if (!confirm("Hapus parameter formulir ini?")) return;
    try { const res = await apiFetch(`/api/building-parameters/${id}`, { method: "DELETE" }); if (!res.ok) { alert("Gagal menghapus parameter formulir."); return; } fetchBuildingParams(); onToast("Parameter formulir berhasil dihapus!"); }
    catch (error) { console.error(error); alert("Terjadi kesalahan."); }
  };

  const handleDragEndBuildingParams = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setBuildingParams((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        apiFetch("/api/building-parameters/reorder", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ parameters: newItems }) }).catch(err => console.error("Failed to save building parameters reorder", err));
        return newItems;
      });
    }
  };

  return (
    <>
      <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg overflow-hidden flex flex-col">
        <div className="bg-white/40 backdrop-blur-sm px-6 py-4 border-b border-white/30 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Pengaturan Parameter Formulir Informasi Bangunan</h2>
            <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kelola label, tipe input, placeholder, dan validasi isian umum secara dinamis</p>
          </div>
          <button onClick={() => { setIsAddingParam(true); setEditingParamId(null); setParamForm({ label: "", type: "text", placeholder: "", required: true, enabled: true }); }}
            className="inline-flex items-center px-4 py-2 bg-pu-blue text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all hover:scale-105 active:scale-95">
            <Plus className="h-4 w-4 mr-2" /> Tambah Parameter
          </button>
        </div>
        <div className="overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndBuildingParams}>
            <table className="w-full text-left">
              <thead className="text-[10px] text-pu-blue uppercase font-bold border-b border-white/30 bg-white/30 backdrop-blur-md">
                <tr>
                  <th className="px-2 py-4 w-8"></th><th className="px-2 py-4 w-8"></th>
                  <th className="px-6 py-4">ID Parameter</th><th className="px-6 py-4">Label Field</th>
                  <th className="px-6 py-4">Tipe Input</th><th className="px-6 py-4">Placeholder</th>
                  <th className="px-6 py-4 text-center">Wajib Diisi</th><th className="px-6 py-4 text-center">Status Aktif</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/20 bg-transparent">
                {loadingParams ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-500 font-medium">Memuat parameter formulir...</td></tr>
                ) : buildingParams.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-500 font-medium">Belum ada parameter formulir yang dikonfigurasi.</td></tr>
                ) : (
                  <SortableContext items={buildingParams.map(p => p.id)} strategy={verticalListSortingStrategy}>
                    {buildingParams.map((p) => (<SortableBuildingParamRow key={p.id} p={p} handleEditParam={handleEditParam} handleDeleteParam={handleDeleteParam} />))}
                  </SortableContext>
                )}
              </tbody>
            </table>
          </DndContext>
        </div>
      </div>

      {/* Add/Edit Param Modal */}
      <AnimatePresence>
        {(isAddingParam || editingParamId !== null) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => { setIsAddingParam(false); setEditingParamId(null); }}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">{isAddingParam ? "Tambah Parameter Baru" : "Edit Parameter"}</h3>
                <button onClick={() => { setIsAddingParam(false); setEditingParamId(null); }} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded p-1 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Label Field / Nama Parameter <span className="text-red-500">*</span></label><input type="text" value={paramForm.label || ""} onChange={e => setParamForm({...paramForm, label: e.target.value})} placeholder="Contoh: Tahun Pembangunan, Luas Bangunan" className="w-full rounded-xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3 text-slate-800 bg-white font-medium" required /></div>
                <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tipe Input</label>
                  <select value={paramForm.type || "text"} onChange={e => setParamForm({...paramForm, type: e.target.value as any})} className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:border-pu-blue focus:ring-pu-blue font-semibold text-slate-700"><option value="text">Text / String</option><option value="number">Number / Angka</option><option value="textarea">Textarea / Deskripsi Panjang</option></select>
                </div>
                <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Placeholder (Petunjuk Pengisian)</label><input type="text" value={paramForm.placeholder || ""} onChange={e => setParamForm({...paramForm, placeholder: e.target.value})} placeholder="Contoh: Masukkan tahun..." className="w-full rounded-xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3 text-slate-800 bg-white font-medium" /></div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors"><input type="checkbox" checked={paramForm.required === true} onChange={e => setParamForm({...paramForm, required: e.target.checked})} className="rounded border-slate-300 text-pu-blue focus:ring-pu-blue w-4 h-4" /><div className="text-[10px] font-bold text-slate-600 uppercase">Wajib Diisi</div></label>
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50/50 p-3 rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors"><input type="checkbox" checked={paramForm.enabled !== false} onChange={e => setParamForm({...paramForm, enabled: e.target.checked})} className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4" /><div className="text-[10px] font-bold text-slate-600 uppercase">Status Aktif</div></label>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => { setIsAddingParam(false); setEditingParamId(null); }} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors">Batal</button>
                <button onClick={handleSaveParam} className="px-6 py-2 bg-pu-blue text-white text-xs font-bold rounded-lg shadow hover:bg-blue-700 transition-colors">Simpan Parameter</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
