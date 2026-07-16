import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Edit2, Trash2, Plus, X, Camera, HelpCircle, UploadCloud } from "lucide-react";
import { cn } from "../../lib/utils";
import type { ComponentConfig, KatalogConfig, ClassificationConfig } from "./settingsTypes";

interface SettingsKatalogTabProps {
  onToast: (msg: string) => void;
}

export default function SettingsKatalogTab({ onToast }: SettingsKatalogTabProps) {
  const [katalogList, setKatalogList] = useState<KatalogConfig[]>([]);
  const [components, setComponents] = useState<ComponentConfig[]>([]);
  const [classifications, setClassifications] = useState<ClassificationConfig[]>([]);
  const [loadingKatalog, setLoadingKatalog] = useState(false);
  const [editingKatalogId, setEditingKatalogId] = useState<number | null>(null);
  const [isAddingKatalog, setIsAddingKatalog] = useState(false);
  const [katalogForm, setKatalogForm] = useState<Partial<KatalogConfig>>({ idKomponen: undefined, idKlasifikasi: undefined, deskripsiPupr: "", urlFotoContoh: "" });
  const [filterComponent, setFilterComponent] = useState<string>("");

  useEffect(() => { fetchKatalog(); fetchComponents(); fetchClassifications(); }, []);

  const fetchKatalog = async () => {
    setLoadingKatalog(true);
    try { const res = await fetch("/api/katalog"); const data = await res.json(); if (Array.isArray(data)) setKatalogList(data); else setKatalogList([]); }
    catch (error) { console.error(error); } finally { setLoadingKatalog(false); }
  };

  const fetchComponents = async () => {
    try { const res = await fetch("/api/components"); const data = await res.json(); if (Array.isArray(data)) setComponents(data); }
    catch (error) { console.error(error); }
  };

  const fetchClassifications = async () => {
    try { const res = await fetch("/api/klasifikasi"); const data = await res.json(); if (Array.isArray(data)) setClassifications(data); }
    catch (error) { console.error(error); }
  };

  const handleEditKatalog = (kat: KatalogConfig) => { setEditingKatalogId(kat.idKatalog); setKatalogForm(kat); setIsAddingKatalog(false); };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    let currentImages = katalogForm.urlFotoContoh ? katalogForm.urlFotoContoh.split(',').map(s => s.trim()).filter(Boolean) : [];
    let validFiles = Array.from(files).filter(f => f.size <= 2 * 1024 * 1024);
    
    if (validFiles.length < files.length) {
       alert("Beberapa file diabaikan karena ukurannya melebihi 2MB.");
    }
    
    if (validFiles.length === 0) return;
    
    Promise.all(validFiles.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    })).then(base64Strings => {
      setKatalogForm(prev => ({
        ...prev,
        urlFotoContoh: [...currentImages, ...base64Strings].join(', ')
      }));
    });
    
    e.target.value = '';
  };

  const handleSaveKatalog = async () => {
    if (!katalogForm.idKomponen || !katalogForm.idKlasifikasi || !katalogForm.deskripsiPupr) { alert("Komponen, Tingkat Kerusakan, dan Deskripsi wajib diisi!"); return; }
    try {
      if (isAddingKatalog) { await fetch("/api/katalog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(katalogForm) }); }
      else { await fetch(`/api/katalog/${editingKatalogId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(katalogForm) }); }
      setEditingKatalogId(null); setIsAddingKatalog(false); fetchKatalog();
    } catch (error) { console.error(error); }
  };

  const handleDeleteKatalog = async (id: number) => {
    if (!confirm("Hapus panduan visual ini?")) return;
    try { const res = await fetch(`/api/katalog/${id}`, { method: "DELETE" }); if (!res.ok) { const err = await res.json().catch(() => ({})); alert(err.error || "Gagal menghapus panduan visual."); return; } fetchKatalog(); }
    catch (error) { console.error(error); alert("Terjadi kesalahan."); }
  };

  const openAdd = () => {
    setIsAddingKatalog(true); setEditingKatalogId(null);
    setKatalogForm({
      idKomponen: components.find(c => !filterComponent || c.namaKomponen === filterComponent)?.idKomponen || components[0]?.idKomponen || undefined,
      idKlasifikasi: classifications.find(cl => cl.namaKlasifikasi === "Rusak Ringan")?.idKlasifikasi || undefined,
      deskripsiPupr: "", urlFotoContoh: ""
    });
  };

  const filteredKatalog = katalogList.filter(k => !filterComponent || k.namaKomponen === filterComponent);

  return (
    <div className="space-y-6">
      <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Kamus Visual Kerusakan (Panduan Lapangan)</h2>
          <p className="mt-1 text-xs text-slate-500 font-medium">Kelola foto referensi dan penjelasan teknis berdasarkan tingkat kerusakan untuk membantu pengurus awam.</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center px-4 py-2.5 bg-pu-blue text-white text-xs font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all hover:scale-105 active:scale-95 flex-shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Tambah Panduan Visual
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Filter Komponen:</span>
          <select value={filterComponent} onChange={e => setFilterComponent(e.target.value)} className="text-xs p-2.5 rounded-xl border border-slate-200/60 bg-white/80 focus:ring-pu-blue focus:border-pu-blue">
            <option value="">-- Semua Komponen --</option>
            {components.map(c => (<option key={c.idKomponen} value={c.namaKomponen}>{c.namaKomponen}</option>))}
          </select>
        </div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menampilkan {filteredKatalog.length} Panduan</div>
      </div>

      {/* Grid View */}
      {loadingKatalog ? (
        <div className="p-16 flex justify-center"><div className="w-8 h-8 border-4 border-pu-blue border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKatalog.map((kat) => {
            const isTidakRusak = kat.namaKlasifikasi === "Tidak Rusak";
            const isSangatRingan = kat.namaKlasifikasi === "Rusak Sangat Ringan";
            const isRingan = kat.namaKlasifikasi === "Rusak Ringan";
            const isSedang = kat.namaKlasifikasi === "Rusak Sedang";
            const isBerat = kat.namaKlasifikasi === "Rusak Berat";
            const isSangatBerat = kat.namaKlasifikasi === "Rusak Sangat Berat";
            
            const cardClass = isSangatRingan ? "bg-teal-50/20 border-teal-200/80" 
                            : isRingan ? "bg-green-50/20 border-green-200/80" 
                            : isSedang ? "bg-yellow-50/20 border-yellow-200/80" 
                            : isBerat ? "bg-orange-50/20 border-orange-200/80" 
                            : isSangatBerat ? "bg-red-50/20 border-red-200/80" 
                            : "bg-slate-50/20 border-slate-200";
                            
            const badgeClass = isSangatRingan ? "bg-teal-600/90" 
                             : isRingan ? "bg-green-600/90" 
                             : isSedang ? "bg-yellow-600/90" 
                             : isBerat ? "bg-orange-600/90" 
                             : isSangatBerat ? "bg-red-600/90" 
                             : "bg-slate-600/90";

            return (
              <motion.div layout key={kat.idKatalog} className={cn(
                "rounded-2xl border overflow-hidden flex flex-col shadow-sm transition-all hover:shadow-md hover:scale-[1.01]",
                cardClass
              )}>
                <div className="relative aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
                  {kat.urlFotoContoh ? (
                    <>
                      <img src={kat.urlFotoContoh.split(',')[0].trim()} alt={kat.namaKomponen} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      {kat.urlFotoContoh.split(',').filter(Boolean).length > 1 && (
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] font-bold text-white shadow-sm">
                          +{kat.urlFotoContoh.split(',').filter(Boolean).length - 1} Foto
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-slate-400 flex flex-col items-center justify-center p-4"><Camera className="w-8 h-8 mb-2 opacity-50" /><span className="text-xs">Belum ada gambar contoh</span></div>
                  )}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white bg-pu-blue/90 uppercase tracking-wider backdrop-blur-sm shadow-sm">{kat.namaKomponen}</span>
                    <span className={cn("px-2.5 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider backdrop-blur-sm shadow-sm", badgeClass)}>{kat.namaKlasifikasi}</span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Deskripsi Panduan Teknis</span>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{kat.deskripsiPupr}</p>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100/50">
                    <button onClick={() => handleEditKatalog(kat)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-pu-blue hover:border-pu-blue text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"><Edit2 className="w-3.5 h-3.5" />Edit</button>
                    <button onClick={() => handleDeleteKatalog(kat.idKatalog)} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-red-500 hover:border-red-200 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" />Hapus</button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filteredKatalog.length === 0 && (
            <div className="col-span-full bg-white/40 border border-slate-200/50 rounded-2xl p-12 text-center text-sm font-medium text-slate-500 flex flex-col items-center justify-center">
              <HelpCircle className="w-12 h-12 text-slate-300 mb-2" />
              Belum ada panduan visual untuk komponen yang dipilih.
              <button onClick={openAdd} className="mt-4 inline-flex items-center px-4 py-2 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition-all"><Plus className="w-4 h-4 mr-1.5" /> Tambah Panduan Pertama</button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Katalog Modal */}
      <AnimatePresence>
        {(isAddingKatalog || editingKatalogId !== null) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => { setIsAddingKatalog(false); setEditingKatalogId(null); }}
          >
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">{isAddingKatalog ? "Tambah Panduan Visual Baru" : "Edit Panduan Visual"}</h3>
                <button onClick={() => { setIsAddingKatalog(false); setEditingKatalogId(null); }} className="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 rounded p-1 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Komponen Bangunan (Otomatis dari Master)</label>
                  <select value={katalogForm.idKomponen || ""} onChange={e => setKatalogForm({...katalogForm, idKomponen: parseInt(e.target.value)})} className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:border-pu-blue focus:ring-pu-blue font-medium">
                    <option value="">-- Pilih Komponen --</option>
                    {components.map(c => (<option key={c.idKomponen} value={c.idKomponen}>{c.namaKomponen} ({c.kategoriKomponen})</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tingkat Kerusakan</label>
                  <select value={katalogForm.idKlasifikasi || ""} onChange={e => setKatalogForm({...katalogForm, idKlasifikasi: parseInt(e.target.value)})} className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:border-pu-blue focus:ring-pu-blue font-medium">
                    <option value="">-- Pilih Tingkat Kerusakan --</option>
                    {classifications.map(cl => (<option key={cl.idKlasifikasi} value={cl.idKlasifikasi}>{cl.namaKlasifikasi}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Deskripsi Standar PUPR (Penjelasan Teknis)</label>
                  <textarea value={katalogForm.deskripsiPupr || ""} onChange={e => setKatalogForm({...katalogForm, deskripsiPupr: e.target.value})} rows={4} placeholder="Contoh: Retak rambut lebar < 1mm pada permukaan beton..." className="w-full rounded-xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3 text-slate-800 bg-white font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">URL Gambar Contoh Lapangan (Pisahkan dengan koma jika lebih dari satu)</label>
                  <div className="flex gap-2">
                    <input type="text" value={katalogForm.urlFotoContoh || ""} onChange={e => setKatalogForm({...katalogForm, urlFotoContoh: e.target.value})} placeholder="https://images.unsplash.com/photo-..." className="flex-1 rounded-xl border border-slate-200 shadow-inner focus:border-pu-blue focus:ring-pu-blue text-xs p-3 text-slate-800 bg-white font-medium" />
                    <label className="flex items-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer transition-colors border border-slate-200 shadow-sm whitespace-nowrap">
                      <UploadCloud className="w-4 h-4" />
                      <span className="text-xs font-bold">Unggah</span>
                      <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                  {katalogForm.urlFotoContoh && katalogForm.urlFotoContoh.trim() !== '' && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {katalogForm.urlFotoContoh.split(',').map(u => u.trim()).filter(Boolean).map((url, i) => (
                        <div key={i} className="rounded-xl overflow-hidden border border-slate-200 h-32 bg-slate-50 flex items-center justify-center relative group">
                          <img src={url} alt={`Preview ${i+1}`} referrerPolicy="no-referrer" className="h-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="text-[10px] text-slate-400">Gambar tidak valid</span>'; }} />
                          <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">Foto {i+1}</div>
                          <button onClick={() => {
                            const newUrls = katalogForm.urlFotoContoh!.split(',').map(u => u.trim()).filter(Boolean);
                            newUrls.splice(i, 1);
                            setKatalogForm({...katalogForm, urlFotoContoh: newUrls.join(', ')});
                          }} className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => { setIsAddingKatalog(false); setEditingKatalogId(null); }} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg shadow-sm hover:bg-slate-50">Batal</button>
                <button onClick={handleSaveKatalog} className="px-6 py-2 bg-pu-blue text-white text-xs font-bold rounded-lg shadow hover:bg-blue-700">Simpan Panduan</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
