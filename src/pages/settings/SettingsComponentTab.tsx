import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Edit2, Trash2, Plus, Save, X, Info } from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { ComponentConfig } from "./settingsTypes";
import { SortableRow } from "./SortableRows";

interface SettingsComponentTabProps {
  onToast: (msg: string) => void;
}

export default function SettingsComponentTab({ onToast }: SettingsComponentTabProps) {
  const [components, setComponents] = useState<ComponentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<ComponentConfig>>({});
  const [isAdding, setIsAdding] = useState(false);
  const [infoEditingId, setInfoEditingId] = useState<number | null>(null);
  const [infoEditForm, setInfoEditForm] = useState<Partial<ComponentConfig>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => { fetchComponents(); }, []);

  const fetchComponents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/components");
      const data = await res.json();
      if (Array.isArray(data)) { setComponents(data); } else { setComponents([]); }
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const handleEdit = (comp: ComponentConfig) => { setEditingId(comp.idKomponen); setEditForm(comp); setIsAdding(false); };
  const handleInfoEdit = (comp: ComponentConfig) => { setInfoEditingId(comp.idKomponen); setInfoEditForm(comp); };

  const handleInfoSave = async () => {
    try {
      await fetch(`/api/components/${infoEditingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(infoEditForm) });
      setInfoEditingId(null);
      fetchComponents();
    } catch (error) { console.error(error); }
  };

  const handleSave = async () => {
    try {
      if (isAdding) {
        await fetch("/api/components", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
      } else {
        await fetch(`/api/components/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm) });
      }
      setEditingId(null); setIsAdding(false); fetchComponents();
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus komponen ini?")) return;
    try {
      const res = await fetch(`/api/components/${id}`, { method: "DELETE" });
      if (!res.ok) { const err = await res.json().catch(() => ({})); alert(err.error || "Gagal menghapus komponen."); return; }
      fetchComponents();
    } catch (error) { console.error(error); alert("Terjadi kesalahan."); }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex((item) => item.idKomponen === active.id);
        const newIndex = items.findIndex((item) => item.idKomponen === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        const updatedItems = newItems.map((item, index) => ({ ...item, urutan: index }));
        fetch("/api/components/reorder", {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ components: updatedItems.map(item => ({ idKomponen: item.idKomponen, urutan: item.urutan })) })
        }).catch(err => console.error("Failed to save reorder", err));
        return updatedItems;
      });
    }
  };

  return (
    <>
      <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg overflow-hidden flex flex-col">
        <div className="bg-white/40 backdrop-blur-sm px-6 py-4 border-b border-white/30 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Pengaturan Parameter Komponen</h2>
            <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kelola bobot dan daftar komponen penilaian</p>
          </div>
          <button 
            onClick={() => { setIsAdding(true); setEditingId(null); setEditForm({ kategoriKomponen: 'Struktur', satuan: '%', bobotFormA: '0.00', bobotFormB: '0.00', bobotFormC: '0.00' }); }}
            className="inline-flex items-center px-4 py-2 bg-pu-blue text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4 mr-2" /> Tambah
          </button>
        </div>

        <div className="overflow-x-auto">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className="w-full text-left">
              <thead className="text-[10px] text-pu-blue uppercase font-bold border-b border-white/30 bg-white/30 backdrop-blur-md">
                <tr>
                  <th className="px-2 py-4 w-8"></th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Nama Komponen</th>
                  <th className="px-6 py-4">Satuan</th>
                  <th className="px-6 py-4">Bobot Form A</th>
                  <th className="px-6 py-4">Bobot Form B</th>
                  <th className="px-6 py-4">Bobot Form C</th>
                  <th className="px-6 py-4 text-center">Panduan Volume</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/20 bg-transparent">
                {isAdding && (
                  <tr className="bg-blue-50/50 backdrop-blur-sm">
                    <td className="px-2 py-3"></td>
                    <td className="px-4 py-3">
                      <select value={editForm.kategoriKomponen || 'Struktur'} onChange={(e) => setEditForm({...editForm, kategoriKomponen: e.target.value})} className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70">
                        <option value="Struktur">Struktur</option>
                        <option value="Arsitektur">Arsitektur</option>
                        <option value="Utilitas">Utilitas</option>
                      </select>
                    </td>
                    <td className="px-4 py-3"><input type="text" value={editForm.namaKomponen || ''} onChange={(e) => setEditForm({...editForm, namaKomponen: e.target.value})} className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70 placeholder:text-slate-400" placeholder="Nama" /></td>
                    <td className="px-4 py-3"><input type="text" value={editForm.satuan || ''} onChange={(e) => setEditForm({...editForm, satuan: e.target.value})} className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70 w-16" /></td>
                    <td className="px-4 py-3"><input type="number" step="0.01" value={editForm.bobotFormA || ''} onChange={(e) => setEditForm({...editForm, bobotFormA: e.target.value})} className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70 w-20" /></td>
                    <td className="px-4 py-3"><input type="number" step="0.01" value={editForm.bobotFormB || ''} onChange={(e) => setEditForm({...editForm, bobotFormB: e.target.value})} className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70 w-20" /></td>
                    <td className="px-4 py-3"><input type="number" step="0.01" value={editForm.bobotFormC || ''} onChange={(e) => setEditForm({...editForm, bobotFormC: e.target.value})} className="w-full text-xs p-2 rounded border border-slate-200 bg-white/70 w-20" /></td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[10px] text-slate-400 italic">Simpan dulu</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={handleSave} className="text-green-600 hover:bg-green-100 p-1.5 rounded mr-1"><Save className="h-4 w-4" /></button>
                      <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:bg-slate-100 p-1.5 rounded"><X className="h-4 w-4" /></button>
                    </td>
                  </tr>
                )}
                <SortableContext items={components.map(c => c.idKomponen)} strategy={verticalListSortingStrategy}>
                  {components.map((comp) => (
                    <SortableRow 
                      key={comp.idKomponen} comp={comp} editingId={editingId} editForm={editForm} setEditForm={setEditForm}
                      handleSave={handleSave} setIsAdding={setIsAdding} setEditingId={setEditingId} handleInfoEdit={handleInfoEdit}
                      handleEdit={handleEdit} handleDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
                {components.length === 0 && !loading && !isAdding && (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-sm font-medium text-slate-500">Belum ada data komponen.</td></tr>
                )}
              </tbody>
            </table>
          </DndContext>
          {loading && (
            <div className="p-16 flex justify-center"><div className="w-8 h-8 border-4 border-pu-blue border-t-transparent rounded-full animate-spin"></div></div>
          )}
        </div>
      </div>

      {/* Info Edit Modal */}
      <AnimatePresence>
        {infoEditingId !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setInfoEditingId(null)}
          >
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Atur Panduan Cara Menghitung Volume</h3>
                <button onClick={() => setInfoEditingId(null)} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded p-1 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nama Komponen</label>
                  <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 font-medium border border-slate-100">{infoEditForm.namaKomponen}</div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Teks Panduan Cara Menghitung Volume</label>
                  <textarea value={infoEditForm.tooltipText || ''} onChange={e => setInfoEditForm({...infoEditForm, tooltipText: e.target.value})} rows={4} placeholder="Masukkan penjelasan singkat mengenai komponen ini untuk pengguna awam..." className="w-full rounded-xl border border-slate-200/50 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-sm p-3 text-slate-800 bg-white/50 backdrop-blur-sm transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">URL Gambar Panduan (Pisahkan dengan koma jika lebih dari satu)</label>
                  <input type="text" value={infoEditForm.tooltipImage || ''} onChange={e => setInfoEditForm({...infoEditForm, tooltipImage: e.target.value})} placeholder="https://url1.jpg, https://url2.jpg" className="w-full rounded-xl border border-slate-200/50 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-sm p-3 text-slate-800 bg-white/50 backdrop-blur-sm transition-colors" />
                  {infoEditForm.tooltipImage && infoEditForm.tooltipImage.trim() !== '' && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {infoEditForm.tooltipImage.split(',').map(u => u.trim()).filter(Boolean).map((url, i) => (
                        <div key={i} className="rounded-lg overflow-hidden border border-slate-200 h-32 bg-slate-50 flex items-center justify-center relative group">
                          <img src={url} alt={`Preview ${i+1}`} className="h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-[10px] text-slate-400">Gambar tidak valid</span>'; }} />
                          <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">Foto {i+1}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setInfoEditingId(null)} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors">Batal</button>
                <button onClick={handleInfoSave} className="px-6 py-2 bg-pu-blue text-white text-xs font-bold rounded-lg shadow hover:bg-blue-700 transition-colors">Simpan Panduan</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
