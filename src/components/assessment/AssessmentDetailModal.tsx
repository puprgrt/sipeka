import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, MapPin, Calendar, CheckCircle2, Clock, 
  User, FileText, Loader2, Search
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "../../lib/utils";
import { getStatusBadgeClasses, formatStatusText } from "../../lib/statusUtils";

interface AssessmentDetailModalProps {
  selectedAssessment: any;
  setSelectedAssessment: (val: any) => void;
  activeRole: string;
  updateStatus: (assessment: any, newStatus: string) => void;
  handleScheduleSurvei: (assessment: any) => void;
  handleGenerateAnalysisFormat: (assessment: any) => void;
  handleGenerateSuratJawaban: (assessment: any) => void;
  setPreviewUrl: (val: string) => void;
  loadingLogs: boolean;
  dispositionLogs: any[];
  setSmartPreviewPhoto: (val: string) => void;
}

export default function AssessmentDetailModal({
  selectedAssessment,
  setSelectedAssessment,
  activeRole,
  updateStatus,
  handleScheduleSurvei,
  handleGenerateAnalysisFormat,
  handleGenerateSuratJawaban,
  setPreviewUrl,
  loadingLogs,
  dispositionLogs,
  setSmartPreviewPhoto
}: AssessmentDetailModalProps) {
  if (!selectedAssessment) return null;

  // Helper function ported over
  const parsePhotos = (photoStr: string | string[]) => {
    if (!photoStr) return [];
    if (Array.isArray(photoStr)) return photoStr;
    try {
      return JSON.parse(photoStr);
    } catch {
      return [photoStr];
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSelectedAssessment(null)}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Sliding Panel */}
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-2xl bg-slate-50 h-full shadow-2xl border-l border-slate-200 flex flex-col"
        >
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-6 py-5 flex justify-between items-start shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn(
                  "px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest border",
                  getStatusBadgeClasses(selectedAssessment.status)
                )}>
                  {formatStatusText(selectedAssessment.status)}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">ID: {selectedAssessment.id}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-800 leading-tight">
                {selectedAssessment.schoolName}
              </h2>
              <p className="text-sm font-semibold text-slate-500 mt-1">{selectedAssessment.buildingName}</p>
            </div>
            <button
              onClick={() => setSelectedAssessment(null)}
              className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-left">
            
            {/* 1. INFORMASI UMUM & KERUSAKAN */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-5">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                Identifikasi Teknis & Kerusakan
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Tingkat Kerusakan</span>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-black text-slate-700">
                      {selectedAssessment.finalResult?.totalDamagePercentage?.toFixed(2) || 
                       selectedAssessment.estimatedDamage?.toFixed(2) || 
                       "0.00"}%
                    </span>
                    <span className={cn(
                      "mb-1 px-1.5 py-0.5 rounded text-[10px] font-bold",
                      selectedAssessment.damageCategory === 'Berat' ? 'bg-red-100 text-red-700' :
                      selectedAssessment.damageCategory === 'Sedang' ? 'bg-amber-100 text-amber-700' :
                      'bg-emerald-100 text-emerald-700'
                    )}>
                      {selectedAssessment.damageCategory || "Ringan"}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Spesifikasi</span>
                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Luas:</span>
                      <span className="font-bold text-slate-700">{selectedAssessment.buildingArea} m²</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Lantai:</span>
                      <span className="font-bold text-slate-700">{selectedAssessment.floorCount} Tingkat</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Denah Bangunan */}
              {selectedAssessment.customFields?.floorPlanImage && (
                <div className="pt-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-wider">Gambar Denah Bangunan</span>
                  <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group cursor-pointer max-h-64 flex justify-center items-center">
                    <img 
                      src={selectedAssessment.customFields.floorPlanImage} 
                      alt="Denah Bangunan" 
                      className="max-h-64 object-contain"
                      onClick={() => {
                          const w = window.open();
                          if (w) {
                            w.document.write(`<img src="${selectedAssessment.customFields.floorPlanImage}" style="max-width: 100%; height: auto;" />`);
                          }
                      }}
                    />
                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-center">
                      <span className="bg-slate-900/60 text-white text-xs px-3 py-1.5 rounded-lg font-medium backdrop-blur-sm">Klik untuk memperbesar</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedAssessment.components && selectedAssessment.components.length > 0 && (
                <div className="pt-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase mb-3 tracking-wider">Rincian Komponen Teridentifikasi</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedAssessment.components.map((comp: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-xs">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-slate-700">
                            {comp.name}
                            {comp.totalVolume !== undefined ? <span className="text-slate-400 font-normal font-mono text-[9px] ml-2 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Tot Vol: {comp.totalVolume} {comp.unit || 'm2'}</span> : null}
                          </span>
                          {comp.safetyImpact && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                              Berisiko Keselamatan
                            </span>
                          )}
                        </div>
                        {comp.damageDetails && comp.damageDetails.length > 0 ? (
                          <ul className="space-y-2">
                            {comp.damageDetails.map((detail: any, dIdx: number) => (
                              <li key={dIdx} className="flex flex-col text-slate-600">
                                <div className="flex justify-between items-center">
                                  <span className="flex items-center gap-1.5 text-[11px] font-bold">
                                    <div className={cn(
                                      "w-1.5 h-1.5 rounded-full",
                                      detail.level.includes('Sangat Berat') ? 'bg-red-600' :
                                      detail.level.includes('Berat') ? 'bg-orange-500' :
                                      detail.level.includes('Sedang') ? 'bg-yellow-500' :
                                      detail.level.includes('Ringan') ? 'bg-green-500' : 'bg-slate-300'
                                    )}></div>
                                    {detail.level}
                                  </span>
                                  <span className="font-mono font-medium flex items-center gap-3 text-[10px]">
                                    {detail.volume !== undefined ? <span className="text-blue-600 bg-blue-50 px-1 rounded">Vol: {detail.volume} {comp.unit || 'm2'}</span> : null}
                                    <span className="text-slate-800 bg-slate-200 px-1.5 rounded">{comp.unit === 'Estimasi' ? '1' : `${detail.percentage.toFixed(1)}%`}</span>
                                  </span>
                                </div>
                                {parsePhotos(detail.photos).length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {parsePhotos(detail.photos).map((p: string, i: number) => (
                                      <div 
                                        key={i}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSmartPreviewPhoto(p);
                                        }}
                                        className="relative group w-12 h-12 rounded-lg overflow-hidden border border-slate-200 cursor-pointer"
                                      >
                                        <img src={p} alt={`Detail ${i+1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <Search className="w-3 h-3 text-white" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-slate-400 italic text-[10px]">Tidak ada kerusakan (0%)</p>
                        )}
                        {comp.photo && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200/50">
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Foto Keseluruhan Komponen</p>
                            <div 
                              onClick={() => setSmartPreviewPhoto(comp.photo!)}
                              className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-all bg-slate-100 flex items-center justify-center"
                            >
                              <img 
                                src={comp.photo} 
                                alt={`Foto ${comp.name}`} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                              />
                            </div>
                          </div>
                        )}
                        {/* Tampilan Verifikasi Tim Teknis jika ada */}
                        {selectedAssessment.verification && selectedAssessment.verification[comp.name] && (
                          <div className="mt-2.5 pt-2.5 border-t border-slate-200/40 bg-slate-100/60 p-2.5 rounded-lg text-[10px]">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-slate-500 uppercase tracking-wider text-[8px]">Verifikasi Teknis</span>
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border",
                                selectedAssessment.verification[comp.name].status === 'Sesuai' 
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              )}>
                                {selectedAssessment.verification[comp.name].status === 'Sesuai' ? 'Sesuai' : 'Butuh Survey'}
                              </span>
                            </div>
                            {selectedAssessment.verification[comp.name].comment && (
                              <p className="text-slate-600 font-medium italic mt-1 bg-white/70 p-1.5 rounded border border-slate-100">
                                "{selectedAssessment.verification[comp.name].comment}"
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coordinates & Location mapping */}
              <div className="pt-3 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  {selectedAssessment.coordinates 
                    ? `${selectedAssessment.coordinates.lat.toFixed(6)}, ${selectedAssessment.coordinates.lng.toFixed(6)}`
                    : "Koordinat tidak tersemat"}
                </span>
                <span className="flex items-center gap-1 font-mono text-[10px]">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {format(new Date(selectedAssessment.date), "dd MMMM yyyy", { locale: id })}
                </span>
              </div>
            </div>

            {/* 2. REAL-TIME DISPOSITION TIMELINE LOG */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Lini Masa Riwayat Disposisi Bidang Bangunan
                </h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  Pelacakan status verifikasi permohonan secara real-time
                </p>
              </div>

              {loadingLogs ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-pu-blue animate-spin mb-2" />
                  <p className="text-xs text-slate-500 font-medium animate-pulse">Mengambil data log disposisi terkini...</p>
                </div>
              ) : (
                <div className="relative pl-6 border-l border-dashed border-slate-200 space-y-6 pt-2 pb-2">
                  {dispositionLogs.map((log, index) => {
                    const isCompleted = log.status === "SELESAI";
                    const isProcessing = log.status === "PROSES";

                    return (
                      <div key={index} className="relative">
                        {/* Bullet indicator with glow on active/completed */}
                        <div className={cn(
                          "absolute -left-[33px] top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center shadow-md transition-all",
                          isCompleted ? "border-emerald-500 bg-emerald-50 text-emerald-500 ring-4 ring-emerald-100" :
                          isProcessing ? "border-blue-500 bg-blue-50 text-blue-500 ring-4 ring-blue-100 animate-pulse" :
                          "border-slate-300 bg-slate-50 text-slate-400"
                        )}>
                          {isCompleted ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          ) : isProcessing ? (
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                          ) : (
                            <Clock className="w-2.5 h-2.5" />
                          )}
                        </div>

                        {/* Node content box */}
                        <div className={cn(
                          "border rounded-xl p-4 transition-all shadow-sm",
                          isCompleted ? "bg-emerald-50/10 border-emerald-100" :
                          isProcessing ? "bg-blue-50/10 border-blue-100" :
                          "bg-slate-50/40 border-slate-100 opacity-60"
                        )}>
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider",
                              isCompleted ? "bg-emerald-100 text-emerald-800" :
                              isProcessing ? "bg-blue-100 text-blue-800" :
                              "bg-slate-200 text-slate-600"
                            )}>
                              {log.tahap}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {log.waktu !== "-" ? format(new Date(log.waktu), "dd MMM, HH:mm", { locale: id }) : "-"}
                            </span>
                          </div>

                          <h5 className="text-xs font-bold text-slate-800">
                            {log.judul}
                          </h5>
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                            {log.deskripsi}
                          </p>

                          <div className="mt-2.5 pt-2 border-t border-slate-100/50 flex items-center justify-between text-[9px] text-slate-400 font-semibold font-mono">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              Petugas: {log.petugas}
                            </span>
                            <span>
                              Status: {log.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. TINDAK LANJUT & DOKUMEN */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Dokumen & Lampiran Resmi
                </h4>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                  Akses file permohonan dan surat keputusan dinas
                </p>
              </div>
              
              {selectedAssessment.documentLink ? (
                <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
                  <div className="flex items-start gap-2.5">
                    <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs text-blue-900">Dokumen Surat Permohonan Resmi (PDF)</p>
                      <p className="text-[10px] text-blue-700/80 mt-0.5">Disimpan aman dalam format PDF untuk arsip kedinasan.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPreviewUrl(selectedAssessment.documentLink)}
                    className="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow transition-all hover:scale-105"
                  >
                    Buka Preview Dokumen
                  </button>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-center text-[11px] text-slate-500 italic">
                  Tidak ada dokumen surat permohonan yang dilampirkan.
                </div>
              )}

              {activeRole !== "Pengelola_Bangunan" ? (
                <div className="space-y-3">
                  <div className="h-px bg-slate-100 my-2" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Aksi Administratif & Teknis Dinas</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => updateStatus(selectedAssessment, "Survei_Lapangan")}
                      disabled={selectedAssessment.status !== "Menunggu_Validasi" && selectedAssessment.status !== undefined}
                      className="flex flex-col items-start p-3 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <span className="text-blue-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Verifikasi Permohonan
                      </span>
                      <span className="text-blue-600/80 text-[9px] mt-1 text-left leading-relaxed">
                        Terima berkas dan validasi untuk tahap selanjutnya.
                      </span>
                    </button>

                    <button
                      onClick={() => handleScheduleSurvei(selectedAssessment)}
                      className="flex flex-col items-start p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <span className="text-slate-700 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        Jadwal Survei Lapangan
                      </span>
                      <span className="text-slate-500 text-[9px] mt-1 text-left leading-relaxed">
                        Buat jadwal tinjauan ke lokasi via Google Calendar.
                      </span>
                    </button>

                    <button
                      onClick={() => handleGenerateAnalysisFormat(selectedAssessment)}
                      className="flex flex-col items-start p-3 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                    >
                      <span className="text-emerald-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        Format Analisis PUPR
                      </span>
                      <span className="text-emerald-600/80 text-[9px] mt-1 text-left leading-relaxed">
                        Generate format resmi penilaian (Spreadsheet & PDF).
                      </span>
                    </button>

                    <button
                      onClick={() => handleGenerateSuratJawaban(selectedAssessment)}
                      className="flex flex-col items-start p-3 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors"
                    >
                      <span className="text-purple-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-4 h-4" />
                        Buat Surat Jawaban
                      </span>
                      <span className="text-purple-600/80 text-[9px] mt-1 text-left leading-relaxed">
                        Generate draft surat jawaban rekomendasi (.doc).
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-xl border border-amber-200/60 bg-amber-50/40 text-[11px] text-amber-800 leading-relaxed font-medium">
                  ⚠️ <strong>Aksi Terbatas:</strong> Akun Anda berstatus sebagai <strong>Pengelola Bangunan</strong>. Tim teknis Dinas PUPR akan memverifikasi berkas dan menjadwalkan survei lapangan secara resmi.
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center text-xs shrink-0">
            <span className="text-slate-500 font-mono">Kembali ke daftar permohonan.</span>
            <button
              onClick={() => setSelectedAssessment(null)}
              className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl text-slate-700 bg-slate-100 border border-slate-200 hover:bg-slate-200 hover:scale-105 active:scale-95 transition-all"
            >
              Tutup Detail
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
