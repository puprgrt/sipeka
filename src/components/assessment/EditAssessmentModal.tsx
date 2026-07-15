import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Edit } from "lucide-react";

interface EditAssessmentModalProps {
  editingAssessment: any;
  setEditingAssessment: (val: any) => void;
  editForm: any;
  setEditForm: (val: any) => void;
  handleEditSave: () => void;
}

export default function EditAssessmentModal({
  editingAssessment,
  setEditingAssessment,
  editForm,
  setEditForm,
  handleEditSave
}: EditAssessmentModalProps) {
  if (!editingAssessment) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setEditingAssessment(null)}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3 text-amber-700">
              <div className="p-2 bg-amber-100/50 rounded-xl">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">Edit Permohonan</h3>
                <p className="text-[10px] uppercase font-bold tracking-widest opacity-70">Ubah data dasar permohonan</p>
              </div>
            </div>
            <button
              onClick={() => setEditingAssessment(null)}
              className="p-2 text-amber-600/50 hover:text-amber-600 hover:bg-amber-100/50 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Sekolah / Instansi</label>
              <input
                type="text"
                value={editForm.schoolName}
                onChange={(e) => setEditForm({ ...editForm, schoolName: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Bangunan</label>
              <input
                type="text"
                value={editForm.buildingName}
                onChange={(e) => setEditForm({ ...editForm, buildingName: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Luas Bangunan (m²)</label>
              <input
                type="number"
                value={editForm.buildingArea}
                onChange={(e) => setEditForm({ ...editForm, buildingArea: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Jumlah Lantai</label>
              <input
                type="number"
                value={editForm.floorCount}
                onChange={(e) => setEditForm({ ...editForm, floorCount: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-slate-300 rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white text-slate-800"
              />
            </div>
          </div>

          <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-end gap-3">
            <button
              onClick={() => setEditingAssessment(null)}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleEditSave}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 hover:shadow-lg hover:shadow-amber-600/30 rounded-xl transition-all"
            >
              Simpan Perubahan
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
