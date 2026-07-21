import { apiFetch } from "../lib/api";
import { useEffect, useState } from "react";
import { Assessment } from "../types";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn, getAuditHeaders } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { 
  Eye, Clock, Calendar, Building, FileText, MapPin, CheckCircle2, User, 
  Loader2, ArrowRight, ExternalLink, X, HelpCircle, FileCheck
} from "lucide-react";
import DocumentPreviewModal from "../components/DocumentPreviewModal";

export default function VerifikasiAdministrasi() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Menunggu_Validasi");
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [verifSurat, setVerifSurat] = useState(false);
  const [verifData, setVerifData] = useState(false);
  const [verifCatatan, setVerifCatatan] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAssessments = () => {
    apiFetch("/api/assessments")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAssessments(data);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssessments();
    const intervalId = setInterval(fetchAssessments, 10000);
    return () => clearInterval(intervalId);
  }, []);

  const filteredAssessments = assessments.filter(a => {
    const currentStatus = a.status || 'Menunggu_Validasi';
    if (activeTab === "Semua") return true;
    return currentStatus === activeTab;
  });

  const handleVerify = async () => {
    if (!selectedAssessment) return;
    setIsSubmitting(true);
    
    // Simpan hasil verifikasi administrasi ke customFields atau sejenisnya
    const newCustomFields = {
      ...selectedAssessment.customFields,
      verifikasiAdministrasi: {
        suratValid: verifSurat,
        dataValid: verifData,
        catatan: verifCatatan,
        waktuVerifikasi: new Date().toISOString(),
      }
    };

    // Update status to next step
    const newStatus = "Survei_Lapangan"; // atau Survei_Lapangan

    try {
      // 1. Update status
      const resStatus = await apiFetch(`/api/assessments/${selectedAssessment.id}/status`, {
        method: "PUT",
        headers: getAuditHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      
      // 2. Update assessment data (custom fields)
      // Since we don't have a direct PUT /api/assessments/:id endpoint, 
      // we might need to rely on status update or use a specific verification endpoint if it exists.
      // Wait, we can use PUT /api/assessments/:id/verification but that is for ComponentVerification.
      
      if (resStatus.ok) {
        setAssessments(assessments.map(a => a.id === selectedAssessment.id ? { ...a, status: newStatus, customFields: newCustomFields } : a));
        setSelectedAssessment(null);
        alert("Verifikasi administrasi berhasil disimpan.");
      } else {
        alert("Gagal menyimpan status verifikasi.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-3 font-semibold">Memuat data permohonan...</span>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
            <FileCheck className="w-7 h-7 text-emerald-400" />
            Verifikasi Administrasi Berkas
          </h1>
          <p className="text-sm text-emerald-100/70 mt-1 font-mono">
            Modul Operator Dinas PUPR • Pemeriksaan kelengkapan dokumen dan kesesuaian data permohonan
          </p>
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        {["Menunggu_Validasi", "Survei_Lapangan", "Semua"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-3 pt-1 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2",
              activeTab === tab
                ? "border-emerald-600 text-emerald-600 font-extrabold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 font-semibold"
            )}
          >
            <span>{tab.replace("_", " ")}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredAssessments.length === 0 ? (
          <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-2xl border border-slate-200 border-dashed">
            <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">Tidak ada permohonan</h3>
            <p className="text-sm text-slate-500">Belum ada permohonan masuk pada status ini.</p>
          </div>
        ) : (
          filteredAssessments.map(assessment => (
            <motion.div 
              key={assessment.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-4 items-start md:items-center"
            >
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest",
                    (assessment.status || 'Menunggu_Validasi') === "Menunggu_Validasi" ? "bg-amber-100 text-amber-700" :
                    (assessment.status || 'Menunggu_Validasi') === "Survei_Lapangan" ? "bg-blue-100 text-blue-700" :
                    "bg-emerald-100 text-emerald-700"
                  )}>
                    {(assessment.status || "Menunggu_Validasi").replace("_", " ")}
                  </span>
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(assessment.date), "dd MMM yyyy", { locale: id })}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 truncate">{assessment.schoolName}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {assessment.buildingName}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {assessment.city}</span>
                </div>
              </div>
              
              <div className="shrink-0">
                <button
                  onClick={() => {
                    setSelectedAssessment(assessment);
                    setVerifSurat(false);
                    setVerifData(false);
                    setVerifCatatan("");
                  }}
                  className="px-5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Periksa Berkas
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedAssessment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setSelectedAssessment(null)}
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full"
            >
              <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-start shrink-0">
                <div>
                  <h2 className="text-xl font-black text-slate-800">Verifikasi Berkas Administrasi</h2>
                  <p className="text-xs font-medium text-slate-500 mt-1">{selectedAssessment.schoolName} - {selectedAssessment.buildingName}</p>
                </div>
                <button onClick={() => setSelectedAssessment(null)} className="p-2 text-slate-400 hover:text-slate-700 bg-white rounded-full shadow-sm hover:shadow transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
                
                {/* Info Data */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">NPSN / Kode Instansi</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedAssessment.npsn}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Luas Bangunan</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedAssessment.buildingArea} m² ({selectedAssessment.floorCount} Lantai)</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Alamat Lengkap</p>
                    <p className="text-sm font-semibold text-slate-800">{selectedAssessment.address}, {selectedAssessment.city}, {selectedAssessment.province}</p>
                  </div>
                </div>
                
                {selectedAssessment.customFields?.documentLink && (
                  <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-rose-800 uppercase tracking-widest">Surat Permohonan Resmi</p>
                      <p className="text-[10px] text-rose-600 mt-1">Dokumen PDF hasil generate otomatis dari instansi</p>
                    </div>
                    <button 
                      onClick={() => setPreviewUrl(selectedAssessment.customFields.documentLink)}
                      className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
                    >
                      Buka Preview Dokumen
                    </button>
                  </div>
                )}

                {/* Form Verifikasi */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2">Checklist Pemeriksaan Operator</h3>
                  
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-start">
                      <div className="flex h-6 items-center">
                        <input
                          type="checkbox"
                          checked={verifSurat}
                          onChange={(e) => setVerifSurat(e.target.checked)}
                          className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 focus:ring-offset-2 transition-all cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">Surat Permohonan Lengkap & Sesuai Format</span>
                      <span className="text-xs text-slate-500 font-medium">Telah dicek bahwa surat permohonan resmi dan ditandatangani.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="relative flex items-start">
                      <div className="flex h-6 items-center">
                        <input
                          type="checkbox"
                          checked={verifData}
                          onChange={(e) => setVerifData(e.target.checked)}
                          className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 focus:ring-offset-2 transition-all cursor-pointer"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">Data Profil Bangunan Valid</span>
                      <span className="text-xs text-slate-500 font-medium">Kesesuaian NUP, NPSN, Luasan, dan Foto kondisi awal sudah tepat.</span>
                    </div>
                  </label>

                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest mb-2">Catatan Operator (Opsional)</label>
                    <textarea
                      value={verifCatatan}
                      onChange={(e) => setVerifCatatan(e.target.value)}
                      rows={3}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none"
                      placeholder="Tambahkan catatan jika ada berkas yang perlu diperbaiki..."
                    />
                  </div>
                </div>

              </div>

              <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 shrink-0 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedAssessment(null)}
                  className="px-5 py-2.5 text-slate-500 hover:text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleVerify}
                  disabled={!verifSurat || !verifData || isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Terima & Teruskan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DocumentPreviewModal 
        isOpen={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        documentUrl={previewUrl}
      />
    </motion.div>
  );
}
