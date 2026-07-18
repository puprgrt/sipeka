import React, { useEffect, useState } from "react";
import { Assessment } from "../types";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { exportAssessmentToPdf } from "../lib/exportPdf";
import { Download } from "lucide-react";
import { X, Building, CheckCircle2, AlertTriangle, FileText, Layers, Calendar, Loader2, Map as MapIcon, PlusCircle } from "lucide-react";
import IkmSurveyModal from "./assessment/IkmSurveyModal";

interface BuildingHistoryModalProps {
  selectedAssessment: Assessment | null;
  setSelectedAssessment: (assessment: Assessment | null) => void;
}

export default function BuildingHistoryModal({ selectedAssessment, setSelectedAssessment }: BuildingHistoryModalProps) {
  const [buildingHistory, setBuildingHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showIkmModal, setShowIkmModal] = useState(false);
  const [ikmChecked, setIkmChecked] = useState<Record<string, boolean>>({});

  const activeRole = localStorage.getItem("activeRole") || "Administrator";

  const handleDownloadWithIkm = async () => {
    if (!selectedAssessment) return;

    // Only gate for Pengelola_Bangunan
    if (activeRole !== "Pengelola_Bangunan") {
      exportAssessmentToPdf(selectedAssessment, buildingHistory);
      return;
    }

    // Check if already filled (use cached result)
    if (ikmChecked[selectedAssessment.id]) {
      exportAssessmentToPdf(selectedAssessment, buildingHistory);
      return;
    }

    try {
      const userId = localStorage.getItem("activeUserId");
      const res = await fetch(`/api/assessments/${selectedAssessment.id}/ikm?userId=${userId}`);
      const data = await res.json();

      if (data.filled) {
        setIkmChecked(prev => ({ ...prev, [selectedAssessment.id]: true }));
        exportAssessmentToPdf(selectedAssessment, buildingHistory);
      } else {
        setShowIkmModal(true);
      }
    } catch (error) {
      console.error("Check IKM error", error);
      setShowIkmModal(true);
    }
  };

  useEffect(() => {
    if (selectedAssessment) {
      // 1. Fetch building history
      const idBangunan = selectedAssessment.customFields?.idBangunan;
      if (idBangunan) {
        setLoadingHistory(true);
        fetch(`/api/buildings/${idBangunan}/history`)
          .then(res => res.json())
          .then(data => {
            if (Array.isArray(data)) {
               setBuildingHistory(data);
            } else {
              setBuildingHistory([]);
            }
          })
          .catch(err => {
            console.error("Failed to fetch building history", err);
            setBuildingHistory([]);
          })
          .finally(() => setLoadingHistory(false));
      } else {
        setBuildingHistory([]);
      }
    } else {
      setBuildingHistory([]);
    }
  }, [selectedAssessment]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (<>
    <AnimatePresence>
      {selectedAssessment && (
        <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedAssessment(null)}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          {/* Side Sheet Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 190 }}
            className="relative w-full max-w-2xl bg-slate-50 shadow-2xl h-full flex flex-col z-[101] border-l border-slate-200 text-slate-700"
          >
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-white shadow-sm shrink-0">
              <div>
                <h3 className="font-black text-slate-800 flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-600" /> Profil & Rekam Jejak Bangunan
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedAssessment.id} • {selectedAssessment.date ? format(new Date(selectedAssessment.date), "dd MMM yyyy", { locale: idLocale }) : ""}</p>
              </div>
              <div className="flex items-center gap-2">
    <button
      onClick={handleDownloadWithIkm}
      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1.5 transition-colors border border-indigo-200"
    >
      <Download className="w-3.5 h-3.5" /> Cetak PDF
    </button>
    <button
      onClick={() => setSelectedAssessment(null)}
      className="p-2 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-all cursor-pointer"
    >
      <X className="w-5 h-5" />
    </button>
  </div>
</div>
            
            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* 1. Header Informasi Bangunan */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full blur-xl opacity-60"></div>
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-indigo-100 rounded-2xl border border-indigo-200 flex items-center justify-center shrink-0 shadow-sm text-indigo-600">
                    <Building className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight line-clamp-1">{selectedAssessment.schoolName}</h2>
                    <h3 className="text-sm font-semibold text-slate-500 truncate">{selectedAssessment.buildingName}</h3>
                    <div className="mt-2 text-xs font-mono text-slate-500 flex flex-wrap gap-2">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Luas: {selectedAssessment.buildingArea} m²</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">Koor: {selectedAssessment.coordinates ? `${selectedAssessment.coordinates.lat}, ${selectedAssessment.coordinates.lng}` : ""}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 2. Ringkasan Kondisi Terakhir (BHI) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-center items-center text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Skor BHI (ISO 55000)</p>
                  <p className="text-4xl font-black text-slate-800">{(100 - (selectedAssessment.finalResult?.totalDamagePercentage || 0)).toFixed(1)}</p>
                  <div className="mt-2 text-xs font-bold text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                    Target Minimum: 60.0
                  </div>
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Status Audit Terakhir</p>
                  {selectedAssessment.status === 'Arsip_Digital' ? (
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-emerald-700">Terverifikasi & Disahkan</p>
                        <p className="text-[10px] text-emerald-600 font-medium">Data dapat dipertanggungjawabkan.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-amber-700">Proses Validasi / Survei</p>
                        <p className="text-[10px] text-amber-600 font-medium">BHI bersifat prediktif.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Estimasi Kebutuhan Biaya */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-5 shadow-sm">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-800 mb-3">Estimasi Biaya Rehabilitasi (Sesuai Kerusakan)</h4>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-black text-emerald-700">
                      {formatRupiah(((selectedAssessment.finalResult?.totalDamagePercentage || 0) / 100) * (selectedAssessment.buildingArea || 380) * 2500000)}
                    </p>
                    <p className="text-[10px] text-emerald-600 mt-1 font-medium">Berdasarkan HSBGN rata-rata Rp 2.5jt / m²</p>
                  </div>
                </div>
              </div>

              {/* 4. Parameter Tambahan (Custom Fields) */}
              {selectedAssessment.customFields && Object.keys(selectedAssessment.customFields).length > 0 && (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-500" /> Atribut & Kredensial Pengusul
                  </h4>
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
                    {Object.entries(selectedAssessment.customFields).map(([key, val]: [string, any], idx) => {
                      if (key === 'verification') return null; // Hide verification object
                      return (
                      <div key={idx} className="space-y-1 bg-slate-50/50 border border-slate-100 p-2.5 rounded-xl">
                        <p className="text-slate-400 font-semibold text-[10px] uppercase tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                        <p className="font-bold text-slate-800">{val || "-"}</p>
                      </div>
                    )})}
                  </div>
                </div>
              )}

              {/* 5. Dokumentasi Foto */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-500" /> Dokumentasi Foto Bangunan
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                  {selectedAssessment.photos && selectedAssessment.photos.length > 0 ? (
                    selectedAssessment.photos.map((url, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-100 shadow-sm">
                        <img 
                          src={url} 
                          alt={`Dokumentasi ${idx + 1}`} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=350&q=80";
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[10px] text-white font-black uppercase tracking-widest">Foto {idx + 1}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 sm:col-span-3 py-6 text-center text-xs text-slate-400 italic">
                      Belum ada foto dokumentasi terunggah.
                    </div>
                  )}
                </div>
              </div>

              {/* 6. Riwayat Penilaian Kerusakan (Tahunan) */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-500" /> Riwayat Penilaian Kerusakan Bangunan (Tahunan)
                  </span>
                  <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">
                    {buildingHistory.length} Sesi
                  </span>
                </h4>
                
                <div className="pt-2 border-t border-slate-100">
                  {loadingHistory ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                    </div>
                  ) : buildingHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                            <th className="pb-2 font-semibold">Tahun</th>
                            <th className="pb-2 font-semibold">Tingkat Kerusakan</th>
                            <th className="pb-2 font-semibold">Status / Kesimpulan</th>
                            <th className="pb-2 font-semibold">Penilai</th>
                          </tr>
                        </thead>
                        <tbody>
                          {buildingHistory.map((hist, index) => (
                            <tr key={hist.idHistory || index} className="border-b border-slate-150/40 hover:bg-slate-50/50 last:border-0">
                              <td className="py-2.5 font-bold text-slate-800 font-mono">
                                {hist.tahunPenilaian}
                              </td>
                              <td className="py-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-700">{Number(hist.totalPersentaseKerusakan).toFixed(1)}%</span>
                                  <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden shrink-0">
                                    <div 
                                      className={cn(
                                        "h-full",
                                        parseFloat(hist.totalPersentaseKerusakan) > 60 ? "bg-rose-500" :
                                        parseFloat(hist.totalPersentaseKerusakan) > 30 ? "bg-amber-500" :
                                        "bg-emerald-500"
                                      )}
                                      style={{ width: `${Math.min(100, parseFloat(hist.totalPersentaseKerusakan))}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-2.5">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border",
                                  hist.kesimpulanAkhir === "Rusak Berat" ? "bg-rose-50 text-rose-700 border-rose-100" :
                                  hist.kesimpulanAkhir === "Rusak Sedang" ? "bg-amber-50 text-amber-700 border-amber-100" :
                                  hist.kesimpulanAkhir === "Rusak Ringan" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                  "bg-slate-50 text-slate-700 border-slate-200"
                                )}>
                                  {hist.kesimpulanAkhir}
                                </span>
                              </td>
                              <td className="py-2.5 font-semibold text-slate-600 truncate max-w-[120px]" title={hist.namaPenilai}>
                                {hist.namaPenilai || "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                      <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-slate-500">Belum Ada Rekam Jejak</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-xs">Data histori penilaian gedung ini dari tahun-tahun sebelumnya belum tersedia di database SPKBG nasional.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer Action Bar */}
            <div className="p-5 border-t border-slate-200 bg-white shrink-0 flex justify-between items-center z-20">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Aksi Lanjutan:</span>
              <div className="flex gap-2">
                <Link
                  to="/map"
                  className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Lihat di Peta</span>
                </Link>
                <Link
                  to={`/new?reassessBuildingId=${selectedAssessment.customFields?.idBangunan || ''}`}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Ajukan Permohonan Baru</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* IKM Survey Modal */}
    {selectedAssessment && (
      <IkmSurveyModal
        isOpen={showIkmModal}
        onClose={() => setShowIkmModal(false)}
        assessmentId={selectedAssessment.id}
        assessmentName={`${selectedAssessment.schoolName} — ${selectedAssessment.buildingName}`}
        onSubmitSuccess={() => {
          setIkmChecked(prev => ({ ...prev, [selectedAssessment.id]: true }));
          exportAssessmentToPdf(selectedAssessment, buildingHistory);
        }}
      />
    )}
  </>);
}
