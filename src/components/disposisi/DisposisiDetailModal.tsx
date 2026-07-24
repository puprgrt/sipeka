import { apiFetch } from "../../lib/api";
import React, { useState } from "react";
import IkmSurveyModal from "../assessment/IkmSurveyModal";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, MapPin, Calendar, CheckCircle2, Clock, 
  User, FileText, Loader2, Search, Download,
  Building, Table, RefreshCw, Lock, ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn, getAuditHeaders } from "../../lib/utils";
import * as XLSX from "xlsx";
import { getStatusBadgeClasses, formatStatusText, normalizeStatus } from "../../lib/statusUtils";
import { COMPONENT_WEIGHTS_1_LANTAI, COMPONENT_WEIGHTS_2_LANTAI, COMPONENT_WEIGHTS_3_LANTAI } from "../../types";

// Replace with a dummy function for replaceTemplatePlaceholders since it's probably defined in the file
function replaceTemplatePlaceholders(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\${key}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}

export default function DisposisiDetailModal({
  selectedAssessment,
  setSelectedAssessment,
  activeRole,
  handleScheduleSurvei,
  loadingLogs,
  dispositionLogs,
  setSmartPreviewPhoto,
  lembarDisposisiTemplate,
  dinasConfig,
  dispNoAgenda,
  dispCatatan,
  lembarDisposisiDriveLink,
  isEditingDisposisi,
  setIsEditingDisposisi,
  dispIndeks,
  setDispIndeks,
  dispKode,
  setDispKode,
  dispNomorSurat,
  setDispNomorSurat,
  setDispNoAgenda,
  dispDiteruskan,
  setDispDiteruskan,
  dispHarap,
  setDispHarap,
  setDispCatatan,
  dispNamaPimpinan,
  setDispNamaPimpinan,
  dispNipPimpinan,
  setDispNipPimpinan,
  letterConfig,
  handleSaveDisposisi,
  exportAssessmentToPdf,
  appConfig,
  suratHasilTemplate,
  suratHasilDriveLink,
  lampiranExcelDriveLink,
  showRecallForm,
  setShowRecallForm,
  recallNote,
  setRecallNote,
  recallTargetStatus,
  setRecallTargetStatus,
  recallsList,
  handleConfirmRecall,
  assessments,
  setAssessments,
  setDispStatus,
  timTeknisUsers,
  petugasSurveyUsers
}: any) {
  // IKM Survey state
  const [showIkmModal, setShowIkmModal] = useState(false);
  const [ikmChecked, setIkmChecked] = useState<Record<string, boolean>>({});

  const handleDownloadWithIkm = async (assessment: any) => {
    // Only gate for Pengelola_Bangunan
    if (activeRole !== "Pengelola_Bangunan") {
      exportAssessmentToPdf(assessment);
      return;
    }

    // Check if already filled (use cached result)
    if (ikmChecked[assessment.id]) {
      exportAssessmentToPdf(assessment);
      return;
    }

    try {
      const userId = localStorage.getItem("activeUserId");
      const res = await apiFetch(`/api/assessments/${assessment.id}/ikm?userId=${userId}`);
      const data = await res.json();

      if (data.filled) {
        setIkmChecked(prev => ({ ...prev, [assessment.id]: true }));
        exportAssessmentToPdf(assessment);
      } else {
        setShowIkmModal(true);
      }
    } catch (error) {
      console.error("Check IKM error", error);
      // Fallback: show modal
      setShowIkmModal(true);
    }
  };

  if (!selectedAssessment) return null;

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
      <>
        {/* Side Sheet Detail & Real-Time Timeline */}
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
  
              {/* Side Sheet Drawer */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 26, stiffness: 190 }}
                className="relative w-full max-w-2xl bg-slate-50 shadow-2xl h-full flex flex-col z-10 border-l border-slate-200 text-slate-700"
              >
                {/* Header */}
                <div className="bg-white border-b border-slate-200/80 px-6 py-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-pu-blue rounded-xl border border-blue-100 shadow-inner">
                      <Building className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                        Detail Permohonan & Disposisi
                      </h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                        ID: {selectedAssessment.id?.substring(0, 8)}... | {selectedAssessment.schoolName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAssessment(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
  
                {/* Content (Scrollable) */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar">
                  {/* 1. Kategori Status & Detail Ringkas */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Status Terkini PUPR
                      </span>
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border",
                        getStatusBadgeClasses(selectedAssessment.status)
                      )}>
                        {formatStatusText(selectedAssessment.status)}
                      </span>
                    </div>
  
                    {/* Revert / Update Status Permohonan (5 Tahap) */}
                    <div className="flex flex-col gap-2 pt-3 border-t border-slate-100">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Ubah / Revert Status Permohonan:
                      </label>
                      <select
                        value={normalizeStatus(selectedAssessment.status) || 'Menunggu_Validasi'}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          setAssessments(assessments.map(a => a.id === selectedAssessment.id ? { ...a, status: newStatus } : a));
                          setSelectedAssessment(prev => prev ? { ...prev, status: newStatus } : null);
                          setDispStatus(newStatus);
                          apiFetch(`/api/assessments/${selectedAssessment.id}/status`, {
                            method: "PUT",
                            headers: getAuditHeaders(),
                            body: JSON.stringify({ status: newStatus })
                          }).catch(err => {
                            console.error(err);
                            alert("Gagal memperbarui status");
                          });
                        }}
                        className="text-xs w-full p-2 border border-slate-200 rounded-lg focus:ring-pu-blue focus:border-pu-blue bg-white font-semibold text-slate-700 cursor-pointer"
                      >
                        <option value="Menunggu_Validasi">Menunggu Validasi</option>
                        <option value="Survei_Lapangan">Survei Lapangan</option>
                        <option value="Selesai_Dianalisis">Selesai Dianalisis</option>
                        <option value="Menunggu_Pengesahan">Menunggu Pengesahan</option>
                        <option value="Arsip_Digital">Arsip Digital</option>
                      </select>
                    </div>
  
                    {/* === PANEL PENGESAHAN BERURUTAN (TTE Sequential) === */}
                    {(() => {
                      const normalizedStatus = normalizeStatus(selectedAssessment.status);
                      const isPengesahan = normalizedStatus === 'Menunggu_Pengesahan';
                      const isArsip = normalizedStatus === 'Arsip_Digital';
                      const isSelesaiAnalisis = normalizedStatus === 'Selesai_Dianalisis';

                      // Parse existing TTE signatures
                      let tteData: any = {};
                      if (selectedAssessment.tteSignatures) {
                        try {
                          tteData = typeof selectedAssessment.tteSignatures === 'string'
                            ? JSON.parse(selectedAssessment.tteSignatures)
                            : selectedAssessment.tteSignatures;
                        } catch (e) {}
                      }

                      // TTE signing order: Petugas_Survey & Tim_Teknis (auto) → Koordinator → Kabid → Kadis
                      const tteSteps = [
                        { role: 'Petugas_Survey', label: 'Petugas Survey', auto: true, docType: 'Hasil Penilaian' },
                        { role: 'Tim_Teknis', label: 'Tim Teknis', auto: true, docType: 'Hasil Penilaian' },
                        { role: 'Koordinator', label: 'Koordinator', auto: false, docType: 'Hasil Penilaian' },
                        { role: 'Kabid', label: 'Kepala Bidang', auto: false, docType: 'Hasil Penilaian' },
                        { role: 'Kadis', label: 'Kepala Dinas', auto: false, docType: 'Surat Jawaban' },
                      ];

                      const signedCount = tteSteps.filter(s => tteData[s.role]).length;
                      const totalSteps = tteSteps.length;
                      const progressPct = totalSteps > 0 ? Math.round((signedCount / totalSteps) * 100) : 0;

                      // Determine which role can sign next (sequential order)
                      let nextSignerIdx = tteSteps.findIndex(s => !tteData[s.role]);

                      if (!isPengesahan && !isArsip && !isSelesaiAnalisis) return null;

                      return (
                        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2 mb-2">
                          <div className={cn(
                            "border rounded-xl p-4 space-y-4 mt-1",
                            isArsip ? "bg-blue-50 border-blue-200" : "bg-indigo-50 border-indigo-200"
                          )}>
                            {/* Header */}
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className={cn("w-4 h-4", isArsip ? "text-blue-800" : "text-indigo-800")} />
                              <h4 className={cn("text-[11px] font-bold uppercase tracking-widest", isArsip ? "text-blue-800" : "text-indigo-800")}>
                                {isArsip ? 'Dokumen Resmi (Telah Disahkan)' : 'Pengesahan Pejabat (TTE Berurutan)'}
                              </h4>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-slate-500">
                                <span>Progress TTE</span>
                                <span>{signedCount}/{totalSteps} tanda tangan ({progressPct}%)</span>
                              </div>
                              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={cn(
                                    "h-2 rounded-full transition-all duration-700",
                                    isArsip ? "bg-emerald-500" : "bg-indigo-500"
                                  )}
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>

                            {/* TTE Steps */}
                            <div className="space-y-2">
                              {tteSteps.map((step, idx) => {
                                const isSigned = !!tteData[step.role];
                                const isNext = idx === nextSignerIdx && !isArsip;
                                const canSign = isNext && activeRole === step.role && !step.auto;
                                const signatureData = tteData[step.role];

                                return (
                                  <div key={step.role} className={cn(
                                    "flex items-center gap-3 p-2.5 rounded-lg border transition-all",
                                    isSigned ? "bg-emerald-50/80 border-emerald-200" :
                                    isNext ? "bg-white border-indigo-300 ring-2 ring-indigo-200 shadow-sm" :
                                    "bg-white/50 border-slate-200 opacity-50"
                                  )}>
                                    {/* Step number & icon */}
                                    <div className={cn(
                                      "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border-2",
                                      isSigned ? "bg-emerald-500 text-white border-emerald-500" :
                                      isNext ? "bg-indigo-500 text-white border-indigo-500 animate-pulse" :
                                      "bg-slate-100 text-slate-400 border-slate-200"
                                    )}>
                                      {isSigned ? '✓' : (idx + 1)}
                                    </div>

                                    {/* Role info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className={cn(
                                          "text-[10px] font-bold uppercase tracking-wider",
                                          isSigned ? "text-emerald-800" : isNext ? "text-indigo-800" : "text-slate-500"
                                        )}>
                                          {step.label}
                                        </span>
                                        {step.auto && (
                                          <span className="text-[8px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                                            Auto
                                          </span>
                                        )}
                                        <span className="text-[8px] font-medium text-slate-400 uppercase">
                                          ({step.docType})
                                        </span>
                                      </div>
                                      {isSigned && signatureData && (
                                        <p className="text-[9px] text-emerald-600 font-medium mt-0.5 truncate">
                                          ✓ {signatureData.name || step.label} — {signatureData.timestamp ? format(new Date(signatureData.timestamp), 'dd MMM yyyy, HH:mm', { locale: id }) : ''}
                                        </p>
                                      )}
                                      {isNext && !isSigned && (
                                        <p className="text-[9px] text-indigo-600 font-medium mt-0.5">
                                          {step.auto ? 'Otomatis saat analisis selesai' : 'Menunggu tanda tangan...'}
                                        </p>
                                      )}
                                    </div>

                                    {/* Sign button */}
                                    {canSign && (
                                      <button
                                        onClick={() => {
                                          if (window.confirm(`Apakah Anda yakin ingin menandatangani sebagai ${step.label}?`)) {
                                            apiFetch(`/api/assessments/${selectedAssessment.id}/verification`, {
                                              method: "PUT",
                                              headers: {
                                                ...getAuditHeaders(),
                                                'x-user-role': step.role,
                                                'x-user-name': localStorage.getItem('activeUserName') || step.label,
                                              },
                                              body: JSON.stringify({ verification: {}, isTTE: true })
                                            }).then(res => res.json()).then(data => {
                                              if (data.success) {
                                                const newStatus = data.statusTerakhir || normalizeStatus(selectedAssessment.status);
                                                const newTte = typeof data.tteSignatures === 'string' ? data.tteSignatures : JSON.stringify(data.tteSignatures);
                                                setAssessments(assessments.map(a => a.id === selectedAssessment.id ? { ...a, status: newStatus, tteSignatures: newTte } : a));
                                                setSelectedAssessment(prev => prev ? { ...prev, status: newStatus, tteSignatures: newTte } : null);
                                                setDispStatus(newStatus);
                                                alert(`Tanda tangan ${step.label} berhasil diterapkan!`);
                                              }
                                            }).catch(err => {
                                              console.error(err);
                                              alert('Gagal menerapkan TTE.');
                                            });
                                          }
                                        }}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest shrink-0 transition-all hover:scale-105 active:scale-95 shadow-sm"
                                      >
                                        Tandatangani
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Action: Move to Pengesahan (from Selesai_Dianalisis) */}
                            {isSelesaiAnalisis && !isPengesahan && (
                              <button
                                onClick={() => {
                                  if (window.confirm('Analisis sudah selesai. Lanjutkan ke tahap Pengesahan Pejabat?')) {
                                    setAssessments(assessments.map(a => a.id === selectedAssessment.id ? { ...a, status: 'Menunggu_Pengesahan' } : a));
                                    setSelectedAssessment(prev => prev ? { ...prev, status: 'Menunggu_Pengesahan' } : null);
                                    setDispStatus('Menunggu_Pengesahan');
                                    apiFetch(`/api/assessments/${selectedAssessment.id}/status`, {
                                      method: 'PUT',
                                      headers: getAuditHeaders(),
                                      body: JSON.stringify({ status: 'Menunggu_Pengesahan' })
                                    }).then(() => alert('Status berubah ke Menunggu Pengesahan!')).catch(console.error);
                                  }
                                }}
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-sm"
                              >
                                <ArrowRight className="w-4 h-4" />
                                Lanjut ke Pengesahan Pejabat
                              </button>
                            )}

                            {/* Cetak Dokumen Resmi (only when Arsip_Digital) */}
                            {isArsip && (
                              <div className="space-y-2 pt-2 border-t border-blue-200">
                                <button
                                  onClick={() => {
                                    const printWindow = window.open('', '_blank');
                                    if (printWindow) {
                                      let htmlContent: string;
                                      if (suratHasilTemplate && suratHasilTemplate.includes('<')) {
                                        htmlContent = replaceTemplatePlaceholders(suratHasilTemplate, {
                                          namaInstansiAtas: 'PEMERINTAH KABUPATEN GARUT',
                                          namaDinas: dinasConfig?.namaDinas || 'Dinas Pekerjaan Umum dan Penataan Ruang',
                                          alamatDinas: dinasConfig?.alamat || 'Jl. Prof. KH. Cecep Syarifudin No. 117, Garut',
                                          nomorSurat: `${selectedAssessment.id.split('-')[0].toUpperCase()}/PUPR/${new Date().getFullYear()}`,
                                          tanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
                                          namaSekolah: selectedAssessment.schoolName,
                                          namaBangunan: selectedAssessment.buildingName,
                                          totalKerusakan: `${selectedAssessment.finalResult?.totalDamagePercentage?.toFixed(2) || '0.00'}%`,
                                          kategoriKerusakan: selectedAssessment.finalResult?.totalDamagePercentage > 45 ? 'Berat / Kritis' : selectedAssessment.finalResult?.totalDamagePercentage > 30 ? 'Sedang' : 'Ringan',
                                          namaKadis: dispNamaPimpinan || 'Ir. H. Kepala Dinas, M.T.',
                                          nipKadis: dispNipPimpinan || '19700101 199803 1 004',
                                        });
                                      } else {
                                        htmlContent = `<html><head><title>Surat Hasil Perhitungan</title><style>body{font-family:'Times New Roman',serif;padding:40px;text-align:center;line-height:1.6;}h1{font-size:20px;font-weight:bold;text-transform:uppercase;margin-bottom:20px;}.content{text-align:justify;margin:40px 0;font-size:14px;}.signature{text-align:right;margin-top:60px;font-size:14px;}</style></head><body><h1>Pemerintah Kabupaten Garut<br/>${dinasConfig?.namaDinas || 'Dinas Pekerjaan Umum dan Penataan Ruang'}</h1><hr style="border:2px solid black;margin-bottom:30px;"/><h2><u>SURAT HASIL PERHITUNGAN PENILAIAN KERUSAKAN BANGUNAN</u></h2><p>Nomor: ${selectedAssessment.id.split('-')[0].toUpperCase()}/PUPR/${new Date().getFullYear()}</p><div class="content"><p>Berdasarkan hasil survei teknis dan analisis kerusakan pada:</p><table style="width:100%;text-align:left;margin:20px 0;"><tr><td width="30%">Nama Instansi</td><td>: ${selectedAssessment.schoolName}</td></tr><tr><td>Nama Bangunan</td><td>: ${selectedAssessment.buildingName}</td></tr><tr><td>Total Kerusakan</td><td>: ${selectedAssessment.finalResult?.totalDamagePercentage?.toFixed(2) || '0.00'}%</td></tr><tr><td>Kategori</td><td>: ${selectedAssessment.finalResult?.totalDamagePercentage > 45 ? 'Berat / Kritis' : selectedAssessment.finalResult?.totalDamagePercentage > 30 ? 'Sedang' : 'Ringan'}</td></tr></table><p>Maka dengan ini ditetapkan tingkat kerusakan bangunan tersebut sah sesuai standar operasional yang berlaku.</p></div><div class="signature"><p>Ditetapkan di Tempat</p><p>Tanggal: ${new Date().toLocaleDateString('id-ID')}</p><br/><br/><br/><p><b><u>${dispNamaPimpinan || 'Ir. H. KEPALA DINAS, M.T.'}</u></b></p><p>NIP. ${dispNipPimpinan || '19700101 199803 1 004'}</p></div><script>window.print();</script></body></html>`;
                                      }
                                      printWindow.document.write(htmlContent);
                                      printWindow.document.close();
                                    }
                                  }}
                                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-sm"
                                >
                                  <FileText className="w-4 h-4" />
                                  Cetak Surat Hasil Perhitungan
                                </button>

                                {suratHasilDriveLink && (
                                  <a href={suratHasilDriveLink} target="_blank" rel="noreferrer"
                                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-sm">
                                    <FileText className="w-4 h-4" /> Unduh Template Asli (Word)
                                  </a>
                                )}

                                <button
                                  onClick={() => {
                                    if (!selectedAssessment) return;
                                    const wsData = [
                                      ["LAMPIRAN PERHITUNGAN VOLUME KERUSAKAN BANGUNAN"], [],
                                      ["Nama Sekolah/Instansi", selectedAssessment.schoolName],
                                      ["Nama Bangunan", selectedAssessment.buildingName],
                                      ["Tanggal Penilaian", new Date().toLocaleDateString('id-ID')], [],
                                      ["Total Kerusakan", `${selectedAssessment.finalResult?.totalDamagePercentage?.toFixed(2) || '0.00'}%`],
                                      ["Kategori", selectedAssessment.finalResult?.totalDamagePercentage > 45 ? 'Berat / Kritis' : selectedAssessment.finalResult?.totalDamagePercentage > 30 ? 'Sedang' : 'Ringan'], [],
                                      ["No", "Komponen", "Bobot (%)", "Klasifikasi Kerusakan", "Volume (%)", "Nilai Kerusakan"]
                                    ];
                                    const ws = XLSX.utils.aoa_to_sheet(wsData);
                                    ws['!cols'] = [{wch:5},{wch:35},{wch:12},{wch:25},{wch:12},{wch:15}];
                                    const wb = XLSX.utils.book_new();
                                    XLSX.utils.book_append_sheet(wb, ws, "Lampiran");
                                    XLSX.writeFile(wb, `Lampiran_Kerusakan_${selectedAssessment.schoolName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
                                  }}
                                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-sm"
                                >
                                  <Table className="w-4 h-4" />
                                  Cetak Lampiran Perhitungan Excel
                                </button>

                                {lampiranExcelDriveLink && (
                                  <a href={lampiranExcelDriveLink} target="_blank" rel="noreferrer"
                                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-sm">
                                    <Table className="w-4 h-4" /> Unduh Template Asli (Excel)
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
  
                    {/* Recall / Re-disposisi Section */}
                    <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          Recall / Re-disposisi (Pullback):
                        </span>
                        {activeRole === "Kadis" || activeRole === "Kabid" ? (
                          <button
                            onClick={() => {
                              setShowRecallForm(!showRecallForm);
                              setRecallNote("");
                            }}
                            className="text-[10px] font-bold uppercase tracking-widest text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-lg border border-rose-200/60 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className={cn("w-3 h-3", showRecallForm && "animate-spin")} />
                            {showRecallForm ? "Batal Recall" : "Recall / Re-disposisi"}
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg select-none">
                            <Lock className="w-3 h-3 text-slate-400" />
                            Dibatasi (Kadis / Kabid)
                          </div>
                        )}
                      </div>
  
                      {(activeRole === "Kadis" || activeRole === "Kabid") && showRecallForm && (
                        <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3.5 space-y-3.5 mt-1">
                          <p className="text-[11px] text-rose-700 font-medium">
                            Gunakan fitur ini untuk menarik kembali berkas ke tahap sebelumnya atau merevisi status disposisi secara resmi dengan mencatatkan alasan justifikasi.
                          </p>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                              Pilih Status Tujuan Recall:
                            </label>
                            <select
                              value={recallTargetStatus}
                              onChange={(e) => setRecallTargetStatus(e.target.value)}
                              className="text-xs w-full p-2 border border-slate-200 rounded-lg focus:ring-rose-500 focus:border-rose-500 bg-white font-semibold text-slate-700"
                            >
                              <option value="Menunggu_Validasi">Menunggu Validasi (Tahap Awal)</option>
                              <option value="Survei_Lapangan">Survei Lapangan</option>
                              <option value="Selesai_Dianalisis">Selesai Dianalisis</option>
                              <option value="Menunggu_Pengesahan">Menunggu Pengesahan</option>
                            </select>
                          </div>
  
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                              Catatan Justifikasi Recall (Wajib):
                            </label>
                            <textarea
                              value={recallNote}
                              onChange={(e) => setRecallNote(e.target.value)}
                              rows={3}
                              placeholder="Contoh: Dokumen kelengkapan administrasi perlu direvisi oleh pemohon / Perlu verifikasi ulang volume kerusakan..."
                              className="text-xs w-full p-2.5 border border-slate-200 rounded-lg focus:ring-rose-500 focus:border-rose-500 bg-white text-slate-800 placeholder-slate-400"
                            />
                          </div>
  
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => {
                                setShowRecallForm(false);
                                setRecallNote("");
                              }}
                              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700 cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              onClick={handleConfirmRecall}
                              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm border border-rose-600 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                            >
                              Konfirmasi Recall
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
  
                    <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
                      <div className="space-y-1">
                        <p className="text-slate-400 font-semibold text-[10px] uppercase">Nama Massa Bangunan</p>
                        <p className="font-bold text-slate-800">{selectedAssessment.buildingName}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 font-semibold text-[10px] uppercase">NPSN / NUP</p>
                        <p className="font-bold text-slate-800 font-mono">{selectedAssessment.npsn}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 font-semibold text-[10px] uppercase">Luas Bangunan</p>
                        <p className="font-bold text-slate-800">{selectedAssessment.buildingArea} m²</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-slate-400 font-semibold text-[10px] uppercase">Tingkat Kerusakan</p>
                        <p className="font-bold text-slate-800">
                          {selectedAssessment.finalResult.totalDamagePercentage > 0 
                            ? `${selectedAssessment.finalResult.totalDamagePercentage.toFixed(2)}% (Rusak ${selectedAssessment.finalResult.category})`
                            : "Belum Dinilai (Menunggu Survei Teknis)"}
                        </p>
                      </div>
                    </div>
  
                    {/* Denah Bangunan */}
                    {selectedAssessment.customFields?.floorPlanImage && (
                      <div className="pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">
                          Gambar Denah Bangunan
                        </p>
                        <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group cursor-pointer max-h-64 flex justify-center items-center">
                          <img 
                            src={selectedAssessment.customFields.floorPlanImage} 
                            alt="Denah Bangunan" 
                            className="max-h-64 object-contain"
                            onClick={() => {
                                // Assume preview photo component exists or just open in new tab
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

                    {/* Render Custom/Dynamic Parameters if any */}
                    {selectedAssessment.customFields && Object.keys(selectedAssessment.customFields).length > 0 && (
                      <div className="pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">
                          Parameter Tambahan Pemohon
                        </p>
                        <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/55">
                          {Object.entries(selectedAssessment.customFields)
                            .filter(([key, value]) => {
                              if (["id", "date", "schoolName", "buildingName", "npsn", "buildingArea", "floorCount", "address", "city", "province", "components", "photos", "finalResult", "status", "userId", "userName", "customFields", "verification", "safetyChecks", "documentLink", "idBangunan", "floorPlanImage"].includes(key) || key.toLowerCase().includes('foto')) return false;
                              if (typeof value === "object" && value !== null) return false;
                              return true;
                            })
                            .map(([key, value]) => {
                            // Make readable title from CamelCase
                            const readableKey = key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, str => str.toUpperCase());
                              
                            const strValue = value?.toString() || "-";
                            const isUrl = strValue.startsWith('http');
                            
                            return (
                              <div key={key} className="space-y-0.5">
                                <p className="text-slate-500 font-semibold text-[9px] uppercase">{readableKey}</p>
                                {isUrl ? (
                                  <a href={strValue} target="_blank" rel="noreferrer" className="font-bold text-pu-blue hover:underline break-all text-[10px]">
                                    Buka Tautan
                                  </a>
                                ) : (
                                  <p className="font-bold text-slate-700 break-words">{strValue}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
  
                    {/* Detail Hasil Penilaian Komponen */}
                    {selectedAssessment.components && selectedAssessment.components.length > 0 && (
                      <div className="pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">
                          Rincian Kerusakan per Komponen
                        </p>
                        <div className="space-y-3">
                          {selectedAssessment.components.filter(comp => {
                            const fCount = selectedAssessment.floorCount || 1;
                            const weights = fCount === 2 ? COMPONENT_WEIGHTS_2_LANTAI : fCount >= 3 ? COMPONENT_WEIGHTS_3_LANTAI : COMPONENT_WEIGHTS_1_LANTAI;
                            return (weights[comp.name] || 0) > 0;
                          }).map((comp, idx) => (
                            <div key={idx} className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-xs">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-slate-700">{comp.name}</span>
                                {comp.safetyImpact && (
                                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                    Berisiko Keselamatan
                                  </span>
                                )}
                              </div>
                              {comp.damageDetails && comp.damageDetails.length > 0 ? (
                                <ul className="space-y-1">
                                  {comp.damageDetails.map((detail, dIdx) => (
                                    <li key={dIdx} className="flex justify-between items-center text-slate-600">
                                      <span className="flex items-center gap-1.5">
                                        <div className={cn(
                                          "w-1.5 h-1.5 rounded-full",
                                          detail.level.includes('Sangat Berat') ? 'bg-red-600' :
                                          detail.level.includes('Berat') ? 'bg-orange-500' :
                                          detail.level.includes('Sedang') ? 'bg-yellow-500' :
                                          detail.level.includes('Ringan') ? 'bg-green-500' : 'bg-slate-300'
                                        )}></div>
                                        {detail.level}
                                      </span>
                                      <span className="font-mono font-medium">{comp.unit === 'Estimasi' ? '1' : `${detail.percentage.toFixed(1)}%`}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-slate-400 italic text-[10px]">Tidak ada kerusakan (0%)</p>
                              )}
                              {comp.photo && (
                                <div className="mt-2.5">
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
  
                  {/* 2.5 RIWAYAT RECALL / JUSTIFIKASI */}
                  {recallsList.length > 0 && (
                    <div className="bg-rose-50/20 border border-rose-100 rounded-2xl p-5 shadow-sm space-y-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Riwayat Penarikan / Recall Disposisi
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                          Daftar justifikasi resmi pemunduran / revisi status disposisi
                        </p>
                      </div>
  
                      <div className="space-y-3">
                        {recallsList.map((recall, index) => (
                          <div key={index} className="bg-white border border-rose-100/70 rounded-xl p-3.5 text-xs shadow-xs space-y-2">
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                              <span className="font-mono">{format(new Date(recall.date), "dd MMMM yyyy, HH:mm", { locale: id })}</span>
                              <span className="text-rose-600 font-bold uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                                RECALL
                              </span>
                            </div>
  
                            <div className="flex items-center gap-2 py-1 border-b border-dashed border-slate-100">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 uppercase">
                                {recall.fromStatus.replace("_", " ")}
                              </span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-700 uppercase">
                                {recall.toStatus.replace("_", " ")}
                              </span>
                            </div>
  
                            <p className="text-xs text-slate-700 leading-relaxed font-serif italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                              "{recall.note}"
                            </p>
  
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span>Oleh: {recall.user}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
  
                  {/* 3. KARTU / LEMBAR DISPOSISI STANDAR INSTANSI */}
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Lembar Disposisi Pimpinan
                        </h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                          Dokumen kendali internal Bidang Bangunan
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              let htmlContent = "";
                              if (lembarDisposisiTemplate && lembarDisposisiTemplate.includes('<')) {
                                htmlContent = replaceTemplatePlaceholders(lembarDisposisiTemplate, {
                                  namaInstansiAtas: 'PEMERINTAH KABUPATEN GARUT',
                                  namaDinas: dinasConfig?.namaDinas || 'Dinas Pekerjaan Umum dan Penataan Ruang',
                                  alamatDinas: dinasConfig?.alamat || 'Jl. Prof. KH. Cecep Syarifudin No. 117, Garut',
                                  nomorAgenda: dispNoAgenda,
                                  tanggalDisposisi: format(new Date(selectedAssessment.date), "dd MMMM yyyy", { locale: id }),
                                  asalSurat: selectedAssessment.schoolName,
                                  perihal: 'Permohonan Penilaian Kerusakan Bangunan',
                                  catatanPimpinan: dispCatatan
                                });
                                htmlContent = `<html><head><title>Lembar Disposisi</title><style>body{font-family:'Times New Roman',serif;padding:20px;} .disposisi-header{text-align:center;border-bottom:3px double black;padding-bottom:10px;margin-bottom:20px;} .disposisi-title{text-align:center;font-weight:bold;font-size:18px;text-decoration:underline;margin-bottom:20px;} .disposisi-meta{width:100%;margin-bottom:20px;border-collapse:collapse;} .disposisi-meta td{padding:5px;} .disposisi-meta td:first-child{width:20%;font-weight:bold;}</style></head><body>${htmlContent}<script>window.print();</script></body></html>`;
                              } else {
                                htmlContent = `<html><head><title>Lembar Disposisi</title><style>body{font-family:'Times New Roman',serif;padding:40px;}h2,h1,p{text-align:center;margin:0;}hr{border:2px solid black;margin:20px 0;}h3{text-align:center;text-decoration:underline;}table{width:100%;margin-top:20px;}td{padding:5px;vertical-align:top;}</style></head><body><h2>PEMERINTAH KABUPATEN GARUT</h2><h1>${dinasConfig?.namaDinas || 'DINAS PEKERJAAN UMUM DAN PENATAAN RUANG'}</h1><p>${dinasConfig?.alamat || 'Jl. Prof. KH. Cecep Syarifudin No. 117, Garut'}</p><hr/><h3>LEMBAR DISPOSISI</h3><table><tr><td width="20%">No. Agenda</td><td>: ${dispNoAgenda}</td></tr><tr><td>Tanggal</td><td>: ${format(new Date(selectedAssessment.date), "dd MMMM yyyy", { locale: id })}</td></tr><tr><td>Asal Surat</td><td>: ${selectedAssessment.schoolName}</td></tr><tr><td>Perihal</td><td>: Permohonan Penilaian Kerusakan Bangunan</td></tr><tr><td colspan="2"><br/><b>Catatan Pimpinan:</b><br/>${dispCatatan}</td></tr></table><script>window.print();</script></body></html>`;
                              }
                              printWindow.document.write(htmlContent);
                              printWindow.document.close();
                            }
                          }}
                          className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Cetak
                        </button>
                        {lembarDisposisiDriveLink && (
                          <a
                            href={lembarDisposisiDriveLink}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1.5 ml-2"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Unduh Asli
                          </a>
                        )}
                        {isEditingDisposisi ? (
                          <>
                            <button
                              onClick={() => {
                                // Reset states to original
                                let initialData: any = {};
                                if (selectedAssessment.disposisiData) {
                                  try {
                                    initialData = typeof selectedAssessment.disposisiData === "string"
                                      ? JSON.parse(selectedAssessment.disposisiData)
                                      : selectedAssessment.disposisiData;
                                  } catch (e) {}
                                }
                                setDispIndeks(initialData.indeks || "045.2 / Pmb-Gdg");
                                setDispKode(initialData.kode || "B.1");
                                setDispNomorSurat(initialData.nomorSurat || `PUPR/B-0${selectedAssessment.id.substring(0, 3)}/2026`);
                                setDispNoAgenda(initialData.noAgenda || `AGD-${selectedAssessment.id.substring(0, 5).toUpperCase()}`);
                                setDispDiteruskan(initialData.diteruskan || ["Kepala Bidang Bangunan"]);
                                setDispHarap(initialData.harap || ["Tanggapan dan Saran"]);
                                setDispCatatan(initialData.catatan || (
                                  selectedAssessment.status === "Menunggu_Validasi" 
                                    ? "Mohon segera diverifikasi kelengkapan administrasinya. Jika lengkap, jadwalkan peninjauan lapangan." 
                                    : selectedAssessment.status === "Survei_Lapangan"
                                    ? "Tim teknis harap meninjau ke lapangan dengan membawa form PUPR. Pastikan pengukuran volume kerusakan akurat."
                                    : selectedAssessment.status === "Selesai_Dianalisis"
                                    ? "Analisis selesai. Segera siapkan draft Rekomendasi Penanganan untuk ditandatangani."
                                    : "Tindak lanjut sesuai dengan prosedur dan kewenangan tugas."
                                ));
                                setDispNamaPimpinan(initialData.namaPimpinan || letterConfig?.sistem?.namaKepala || "Ir. H. Kepala Dinas, M.T.");
                                setDispNipPimpinan(initialData.nipPimpinan || letterConfig?.sistem?.nipKepala || "NIP. 19700101 199803 1 004");
                                setIsEditingDisposisi(false);
                              }}
                              className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-200"
                            >
                              Batal
                            </button>
                            <button
                              onClick={handleSaveDisposisi}
                              className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-white hover:bg-pu-blue/90 bg-pu-blue px-3 py-1.5 rounded-lg transition-colors border border-pu-blue shadow-sm"
                            >
                              Simpan
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setIsEditingDisposisi(true)}
                              className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-pu-blue hover:text-white bg-blue-50 hover:bg-pu-blue px-3 py-1.5 rounded-lg transition-all border border-blue-200/60 shadow-sm"
                            >
                              Buat / Edit Disposisi
                            </button>
                            <button 
                              onClick={() => handleDownloadWithIkm(selectedAssessment)}
                              className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition-all border border-emerald-200/60 shadow-sm mr-2"
                            >
                              <Download className="w-3.5 h-3.5 mr-1.5" />
                              Cetak Laporan PDF
                            </button>
                            <button 
                              onClick={() => window.print()}
                              className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-200/60"
                            >
                              <FileText className="w-3.5 h-3.5 mr-1.5" />
                              Cetak Lembar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
  
                    <div className="border-2 border-slate-900 p-6 relative font-serif text-slate-900 bg-[#fafafa]">
                      {/* Header Disposisi */}
                      <div className="flex items-center gap-4 border-b-2 border-slate-900 pb-4 mb-4">
                        <img 
                          src={appConfig?.logoKiri || "https://upload.wikimedia.org/wikipedia/commons/b/b3/Coat_of_arms_of_Garut_Regency.svg"} 
                          alt="Logo Instansi Kiri" 
                          className="w-12 h-12 object-contain shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-center flex-1 font-sans">
                          <h2 className="text-sm font-black uppercase tracking-widest text-slate-900 leading-tight">Pemerintah Kabupaten Garut</h2>
                          <h1 className="text-base font-black uppercase tracking-widest mt-1 text-slate-950 leading-tight">{dinasConfig?.namaDinas || 'Dinas Pekerjaan Umum dan Penataan Ruang'}</h1>
                          <p className="text-[9px] font-mono mt-1 text-slate-600 uppercase">{dinasConfig?.alamat || 'Jalan Raya Pembangunan No. 123, Tarogong Kidul, Garut'}</p>
                        </div>
                        <div className="w-12 h-12 shrink-0"></div>
                      </div>
  
                      <div className="text-center mb-6">
                        <h3 className="text-sm font-bold uppercase border border-slate-900 inline-block px-4 py-1 tracking-widest bg-slate-100">
                          Lembar Disposisi
                        </h3>
                      </div>
  
                      {/* Informasi Surat */}
                      <div className="grid grid-cols-2 gap-0 border-t border-l border-slate-900 text-[10px]">
                        <div className="border-r border-b border-slate-900 p-2 flex items-center">
                          <span className="w-24 font-bold shrink-0">Indeks Berkas</span>
                          <span className="mr-2">:</span>
                          {isEditingDisposisi ? (
                            <input
                              type="text"
                              value={dispIndeks}
                              onChange={(e) => setDispIndeks(e.target.value)}
                              className="flex-1 text-[10px] px-1 py-0.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-pu-blue bg-white"
                            />
                          ) : (
                            <span>{dispIndeks}</span>
                          )}
                        </div>
                        <div className="border-r border-b border-slate-900 p-2 flex items-center">
                          <span className="w-24 font-bold shrink-0">Kode</span>
                          <span className="mr-2">:</span>
                          {isEditingDisposisi ? (
                            <input
                              type="text"
                              value={dispKode}
                              onChange={(e) => setDispKode(e.target.value)}
                              className="flex-1 text-[10px] px-1 py-0.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-pu-blue bg-white"
                            />
                          ) : (
                            <span>{dispKode}</span>
                          )}
                        </div>
                        
                        <div className="col-span-2 border-r border-b border-slate-900 p-2 flex items-center">
                          <span className="w-24 font-bold shrink-0">Tanggal Surat</span>
                          <span className="mr-2">:</span>
                          <span>{format(new Date(selectedAssessment.date), "dd MMMM yyyy", { locale: id })}</span>
                        </div>
  
                        <div className="col-span-2 border-r border-b border-slate-900 p-2 flex items-center">
                          <span className="w-24 font-bold shrink-0">Nomor Surat</span>
                          <span className="mr-2">:</span>
                          {isEditingDisposisi ? (
                            <input
                              type="text"
                              value={dispNomorSurat}
                              onChange={(e) => setDispNomorSurat(e.target.value)}
                              className="flex-1 text-[10px] px-1 py-0.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-pu-blue bg-white font-mono"
                            />
                          ) : (
                            <span className="font-mono">{dispNomorSurat}</span>
                          )}
                        </div>
  
                        <div className="col-span-2 border-r border-b border-slate-900 p-2 flex items-center">
                          <span className="w-24 font-bold shrink-0">Asal Surat</span>
                          <span className="mr-2">:</span>
                          <span className="font-bold uppercase">{selectedAssessment.schoolName}</span>
                        </div>
  
                        <div className="col-span-2 border-r border-b border-slate-900 p-2 flex items-center">
                          <span className="w-24 font-bold shrink-0">Hal</span>
                          <span className="mr-2">:</span>
                          <span>Permohonan Penilaian Kerusakan Bangunan ({selectedAssessment.buildingName})</span>
                        </div>
  
                        <div className="border-r border-b border-slate-900 p-2 flex items-center">
                          <span className="w-24 font-bold shrink-0">Diterima Tgl</span>
                          <span className="mr-2">:</span>
                          <span>{format(new Date(selectedAssessment.date), "dd MMMM yyyy", { locale: id })}</span>
                        </div>
                        <div className="border-r border-b border-slate-900 p-2 flex items-center">
                          <span className="w-24 font-bold shrink-0">No. Agenda</span>
                          <span className="mr-2">:</span>
                          {isEditingDisposisi ? (
                            <input
                              type="text"
                              value={dispNoAgenda}
                              onChange={(e) => setDispNoAgenda(e.target.value)}
                              className="flex-1 text-[10px] px-1 py-0.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-pu-blue bg-white"
                            />
                          ) : (
                            <span>{dispNoAgenda}</span>
                          )}
                        </div>
                      </div>
  
                      {/* Instruksi Disposisi */}
                      <div className="grid grid-cols-2 gap-0 border-l border-b border-slate-900 mt-4 text-[10px] min-h-[160px]">
                        <div className="border-r border-slate-900 p-3 relative">
                          <p className="font-bold mb-3 uppercase tracking-wider border-b border-slate-300 pb-1 inline-block">Diteruskan Kepada Yth:</p>
                          {isEditingDisposisi ? (
                            <div className="space-y-2">
                              {[
                                "Kepala Bidang Bangunan",
                                "Koordinator",
                                ...timTeknisUsers.map(u => `Tim Teknis - ${u.namaLengkap}`),
                                ...(petugasSurveyUsers ? petugasSurveyUsers.map(u => `Petugas Survey - ${u.namaLengkap}`) : [])
                              ].map((roleOption) => {
                                const checked = dispDiteruskan.includes(roleOption);
                                return (
                                  <label key={roleOption} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        if (checked) {
                                          setDispDiteruskan(dispDiteruskan.filter(r => r !== roleOption));
                                        } else {
                                          setDispDiteruskan([...dispDiteruskan, roleOption]);
                                        }
                                      }}
                                      className="rounded border-slate-300 focus:ring-pu-blue text-pu-blue"
                                    />
                                    <span>{roleOption}</span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <ol className="list-decimal pl-4 space-y-2">
                              {[
                                "Kepala Bidang Bangunan",
                                "Koordinator",
                                ...timTeknisUsers.map(u => `Tim Teknis - ${u.namaLengkap}`),
                                ...(petugasSurveyUsers ? petugasSurveyUsers.map(u => `Petugas Survey - ${u.namaLengkap}`) : [])
                              ].map((roleOption) => {
                                const checked = dispDiteruskan.includes(roleOption);
                                return (
                                  <li key={roleOption} className={cn(checked ? "font-bold text-slate-800" : "text-slate-400")}>
                                    {roleOption}
                                    {checked && <span className="inline-block w-4 h-4 border border-slate-900 rounded-sm ml-2 align-middle bg-slate-900 text-white flex items-center justify-center font-bold">✓</span>}
                                  </li>
                                );
                              })}
                              
                              {/* Opsi kustom lainnya yang pernah tersimpan di disposisi lama tapi tidak ada di default list */}
                              {dispDiteruskan.filter(r => ![
                                "Kepala Bidang Bangunan",
                                "Kepala Bidang Bangunan Gedung",
                                "Kepala Bidang",
                                "Sekretaris Dinas",
                                "Kepala Seksi Perencanaan",
                                "Koordinator",
                                ...timTeknisUsers.map(u => `Tim Teknis - ${u.namaLengkap}`),
                                ...(petugasSurveyUsers ? petugasSurveyUsers.map(u => `Petugas Survey - ${u.namaLengkap}`) : []),
                                "Tim Teknis Penilai" // Support untuk data lama
                              ].includes(r)).map((r, rIdx) => (
                                <li key={`other-${rIdx}`} className="font-bold text-slate-800">
                                  {r}
                                  <span className="inline-block w-4 h-4 border border-slate-900 rounded-sm ml-2 align-middle bg-slate-900 text-white flex items-center justify-center font-bold">✓</span>
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>
                        <div className="border-r border-slate-900 p-3 relative">
                          <p className="font-bold mb-3 uppercase tracking-wider border-b border-slate-300 pb-1 inline-block">Dengan Hormat Harap:</p>
                          {isEditingDisposisi ? (
                            <div className="space-y-2">
                              {[
                                "Tanggapan dan Saran",
                                "Proses Lebih Lanjut",
                                "Koordinasi/Konfirmasi",
                                "Laporan / Hari ini"
                              ].map((harapOption) => {
                                const checked = dispHarap.includes(harapOption);
                                return (
                                  <label key={harapOption} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-1 rounded">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => {
                                        if (checked) {
                                          setDispHarap(dispHarap.filter(h => h !== harapOption));
                                        } else {
                                          setDispHarap([...dispHarap, harapOption]);
                                        }
                                      }}
                                      className="rounded border-slate-300 focus:ring-pu-blue text-pu-blue"
                                    />
                                    <span>{harapOption}</span>
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            <ul className="space-y-1.5">
                              <li>[ <span className={dispHarap.includes("Tanggapan dan Saran") ? "font-bold" : ""}>{dispHarap.includes("Tanggapan dan Saran") ? "✓" : "  "}</span> ] Tanggapan dan Saran</li>
                              <li>[ <span className={dispHarap.includes("Proses Lebih Lanjut") ? "font-bold" : ""}>{dispHarap.includes("Proses Lebih Lanjut") ? "✓" : "  "}</span> ] Proses Lebih Lanjut</li>
                              <li>[ <span className={dispHarap.includes("Koordinasi/Konfirmasi") ? "font-bold" : ""}>{dispHarap.includes("Koordinasi/Konfirmasi") ? "✓" : "  "}</span> ] Koordinasi/Konfirmasi</li>
                              <li>[ <span className={dispHarap.includes("Laporan / Hari ini") ? "font-bold" : ""}>{dispHarap.includes("Laporan / Hari ini") ? "✓" : "  "}</span> ] Laporan / Hari ini</li>
                            </ul>
                          )}
                        </div>
                      </div>
  
                      {/* Catatan Pimpinan */}
                      <div className="border border-slate-900 border-t-0 p-3 min-h-[100px] text-[10px]">
                        <p className="font-bold mb-1 uppercase tracking-wider">Catatan Pimpinan:</p>
                        {isEditingDisposisi ? (
                          <textarea
                            value={dispCatatan}
                            onChange={(e) => setDispCatatan(e.target.value)}
                            rows={4}
                            className="w-full text-[10px] p-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-pu-blue bg-white font-serif italic mt-2 leading-relaxed"
                            placeholder="Masukkan catatan / arahan pimpinan di sini..."
                          />
                        ) : (
                          <p className="italic text-slate-700 leading-relaxed pl-2 mt-2">
                            {dispCatatan}
                          </p>
                        )}
                        
                        {/* TTD Pimpinan Simulasi */}
                        {(isEditingDisposisi || selectedAssessment.status === "Survei_Lapangan" || selectedAssessment.status === "Selesai_Dianalisis" || selectedAssessment.status === "Arsip_Digital") && (
                           <div className="mt-4 flex justify-end">
                             <div className="text-center min-w-[160px]">
                               <div className="w-16 h-8 border-b-2 border-blue-900 border-dotted mx-auto mb-1 transform -rotate-6 opacity-60 flex items-center justify-center">
                                 <span className="text-[8px] text-blue-900 font-bold uppercase italic">Signed</span>
                               </div>
                               {isEditingDisposisi ? (
                                 <div className="space-y-1 mt-2">
                                   <input
                                     type="text"
                                     value={dispNamaPimpinan}
                                     onChange={(e) => setDispNamaPimpinan(e.target.value)}
                                     placeholder="Nama Pimpinan"
                                     className="w-full text-[9px] text-center px-1 py-0.5 border border-slate-300 rounded focus:outline-none font-bold"
                                   />
                                   <input
                                     type="text"
                                     value={dispNipPimpinan}
                                     onChange={(e) => setDispNipPimpinan(e.target.value)}
                                     placeholder="NIP Pimpinan"
                                     className="w-full text-[8px] text-center px-1 py-0.5 border border-slate-300 rounded focus:outline-none"
                                   />
                                 </div>
                               ) : (
                                 <>
                                   <p className="font-bold underline">{dispNamaPimpinan}</p>
                                   <p className="text-[8px]">{dispNipPimpinan}</p>
                                 </>
                               )}
                             </div>
                           </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
  
                {/* Footer */}
                <div className="bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center text-xs">
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

        {/* IKM Survey Modal */}
        <IkmSurveyModal
          isOpen={showIkmModal}
          onClose={() => setShowIkmModal(false)}
          assessmentId={selectedAssessment?.id || ""}
          assessmentName={`${selectedAssessment?.schoolName || ""} — ${selectedAssessment?.buildingName || ""}`}
          onSubmitSuccess={() => {
            setIkmChecked(prev => ({ ...prev, [selectedAssessment.id]: true }));
            exportAssessmentToPdf(selectedAssessment);
          }}
        />
      </>
  );
}
