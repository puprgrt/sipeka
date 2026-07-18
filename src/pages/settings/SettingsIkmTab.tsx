import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Save, X, Loader2 } from "lucide-react";

interface IkmQuestion {
  id: number;
  key: string;
  label: string;
  description: string;
  isActive: boolean;
  orderIndex: number;
}

interface SettingsIkmTabProps {
  onToast: (msg: string) => void;
}

export default function SettingsIkmTab({ onToast }: SettingsIkmTabProps) {
  const [questions, setQuestions] = useState<IkmQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<IkmQuestion | null>(null);
  
  const [formData, setFormData] = useState({
    key: "",
    label: "",
    description: "",
    isActive: true,
    orderIndex: 99
  });
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings/ikm-questions");
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (error) {
      console.error("Failed to fetch questions", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (q?: IkmQuestion) => {
    if (q) {
      setEditingQuestion(q);
      setFormData({
        key: q.key,
        label: q.label,
        description: q.description,
        isActive: q.isActive,
        orderIndex: q.orderIndex
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        key: `u${questions.length + 1}`,
        label: "",
        description: "",
        isActive: true,
        orderIndex: (questions.length > 0 ? questions[questions.length - 1].orderIndex : 0) + 1
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.key || !formData.label) return;
    
    setIsSaving(true);
    try {
      const url = editingQuestion 
        ? `/api/settings/ikm-questions/${editingQuestion.id}`
        : `/api/settings/ikm-questions`;
        
      const res = await fetch(url, {
        method: editingQuestion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        onToast(`Pertanyaan IKM berhasil di${editingQuestion ? 'perbarui' : 'tambahkan'}`);
        fetchQuestions();
        setIsModalOpen(false);
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan");
      }
    } catch (error) {
      alert("Gagal menyimpan pertanyaan. Periksa koneksi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Yakin ingin menghapus pertanyaan ini? Data survei yang menggunakan pertanyaan ini mungkin akan kehilangan labelnya.")) return;
    
    try {
      const res = await fetch(`/api/settings/ikm-questions/${id}`, { method: "DELETE" });
      if (res.ok) {
        onToast("Pertanyaan IKM dihapus");
        fetchQuestions();
      } else {
        alert("Gagal menghapus");
      }
    } catch (error) {
      alert("Gagal menghapus");
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/60">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Pertanyaan Survei IKM</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola daftar unsur pelayanan yang ditanyakan pada Indeks Kepuasan Masyarakat.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-pu-blue hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl shadow-sm text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Tambah Pertanyaan
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-pu-blue" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Urutan</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Kode</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unsur Pelayanan (Label)</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {questions.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-sm text-slate-600">{q.orderIndex}</td>
                  <td className="py-3 px-4 text-sm font-mono text-slate-500">{q.key}</td>
                  <td className="py-3 px-4">
                    <p className="text-sm font-bold text-slate-800">{q.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{q.description}</p>
                  </td>
                  <td className="py-3 px-4">
                    {q.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        <XCircle className="w-3.5 h-3.5" /> Nonaktif
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(q)}
                        className="p-1.5 text-slate-400 hover:text-pu-blue hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 text-sm">
                    Belum ada data pertanyaan IKM.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">
                  {editingQuestion ? "Edit Pertanyaan IKM" : "Tambah Pertanyaan IKM"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Kode Unsur</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. u10"
                      value={formData.key}
                      onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pu-blue/20 focus:border-pu-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Urutan (Index)</label>
                    <input
                      type="number"
                      required
                      value={formData.orderIndex}
                      onChange={(e) => setFormData({ ...formData, orderIndex: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pu-blue/20 focus:border-pu-blue"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Label (Nama Unsur)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kualitas Layanan Digital"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pu-blue/20 focus:border-pu-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Deskripsi Penjelasan</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Penjelasan singkat mengenai unsur pelayanan ini..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pu-blue/20 focus:border-pu-blue resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-pu-blue focus:ring-pu-blue/20"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-slate-700">
                    Aktif (Tampilkan di Survei IKM)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-pu-blue hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-sm text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
