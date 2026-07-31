import { apiFetch } from "../lib/api";
import { useEffect, useState } from "react";
import { Assessment } from "../types";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn, getValidationUrl } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Inbox, Send, Eye, FileCheck, FileDown, Search, X, Calendar, Building, MapPin, Layers, ExternalLink, Printer, CheckCircle, RefreshCw, Loader2
} from "lucide-react";
import DocumentPreviewModal from "../components/DocumentPreviewModal";
import { createDocument } from "../lib/docsService";
import { getAccessToken } from "../lib/firebaseAuth";
import { generateDocumentFromTemplateEngine, DocumentTemplateData } from "../lib/documentTemplateEngine";
import { DEFAULT_TEMPLATE_SURAT_PERMOHONAN, DEFAULT_TEMPLATE_SURAT_HASIL } from "../utils/templateUtils";

export default function SuratReports() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"masuk" | "keluar">("masuk");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [letterConfig, setLetterConfig] = useState<any>(null);
  const [updatingDocumentId, setUpdatingDocumentId] = useState<string | null>(null);

  const fetchAssessments = () => {
    apiFetch("/api/assessments")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAssessments(data);
        }
      })
      .catch(err => console.error("Failed to load assessments", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssessments();
    apiFetch("/api/pengaturan-surat")
      .then(res => res.json())
      .then(data => setLetterConfig(data))
      .catch(err => console.error("Failed to load letter config", err));

    const intervalId = setInterval(fetchAssessments, 10000); // Polling every 10s for realtime updates
    return () => clearInterval(intervalId);
  }, []);

  const handleUpdateDocument = async (assessment: Assessment) => {
    try {
      setUpdatingDocumentId(assessment.id);
      const token = await getAccessToken();
      if (!token) {
        alert("Silakan login ulang dengan Google untuk memperbarui dokumen surat.");
        return;
      }

      const isKeluar = assessment.status !== 'Menunggu_Validasi';
      const templateToUse = isKeluar ? DEFAULT_TEMPLATE_SURAT_HASIL : DEFAULT_TEMPLATE_SURAT_PERMOHONAN;
      const docTitle = `${isKeluar ? 'Surat Hasil' : 'Surat Permohonan'} Penilaian Kerusakan - ${assessment.schoolName || "Instansi"}`;
      const letterReferenceNo = assessment.customFields?.nomorSurat || assessment.customFields?.letterReferenceNo || assessment.id.substring(0, 8).toUpperCase();
      
      const templateData: DocumentTemplateData = {
        id: assessment.id,
        nama_sekolah: assessment.schoolName,
        npsn: assessment.npsn || "-",
        nama_bangunan: assessment.buildingName,
        nup: assessment.nup || "-",
        alamat: assessment.address,
        nomor_surat: letterReferenceNo,
        tanggal: format(new Date(), "dd MMMM yyyy", { locale: id }),
        kerusakan: assessment.finalResult?.totalDamagePercentage || 0,
        kategori: assessment.finalResult?.category || "Ringan",
        luas_bangunan: assessment.buildingArea || 0,
        jumlah_lantai: assessment.floorCount || 1,
        koordinat_gps: assessment.coordinates ? `${assessment.coordinates.lat}, ${assessment.coordinates.lng}` : "-",
        nama_pengirim: letterConfig?.pengelola?.namaKepala || "Nama Pengirim",
        jabatan_pengirim: letterConfig?.pengelola?.jabatan || "Jabatan",
        nip_pengirim: letterConfig?.pengelola?.nipKepala || "-",
        nama_instansi_atas: letterConfig?.pengelola?.namaInstansiAtas || "PEMERINTAH KABUPATEN GARUT",
        nama_instansi_bawah: letterConfig?.pengelola?.namaInstansiBawah || assessment.schoolName || "UPTD SATUAN PENDIDIKAN",
        alamat_pemohon: letterConfig?.pengelola?.alamat || assessment.address || "Jl. Raya Pembangunan No. 123",
        qr_data: getValidationUrl(assessment.id)
      };

      const res = await generateDocumentFromTemplateEngine(
        docTitle,
        templateToUse,
        templateData,
        undefined,
        token
      );

      const newDocLink = res.url;
      const exportedLink = newDocLink.replace(/\/edit$/, "/export?format=pdf");

      const payload = {
        schoolName: assessment.schoolName,
        buildingName: assessment.buildingName,
        npsn: assessment.npsn,
        address: assessment.address,
        buildingArea: assessment.buildingArea,
        floorCount: assessment.floorCount,
        coordinates: assessment.coordinates,
        components: assessment.components || [],
        photos: assessment.photos || [],
        finalResult: assessment.finalResult || { totalDamagePercentage: 0, category: "Ringan" },
        documentLink: exportedLink,
        customFields: {
          ...(assessment.customFields || {}),
          documentLink: newDocLink,
          letterReferenceNo,
          updatedAt: new Date().toISOString()
        }
      };

      await apiFetch(`/api/assessments/${assessment.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      setAssessments(prev => prev.map(item =>
        item.id === assessment.id
          ? { ...item, documentLink: exportedLink, customFields: { ...(item.customFields || {}), documentLink: newDocLink, letterReferenceNo, updatedAt: new Date().toISOString() } }
          : item
      ));

      if (selectedAssessment?.id === assessment.id) {
        setSelectedAssessment(prev => prev ? {...prev, documentLink: exportedLink, customFields: { ...(prev.customFields || {}), documentLink: newDocLink, letterReferenceNo, updatedAt: new Date().toISOString() }} : prev);
      }

      alert("✅ Dokumen surat berhasil diperbarui dengan Template Engine v2.0 (termasuk Barcode QR TTE & 100% Mengacu Pengaturan Template)!");
    } catch (error) {
      console.error("Failed to update surat document", error);
      alert("Gagal memperbarui dokumen surat. Silakan coba lagi.");
    } finally {
      setUpdatingDocumentId(null);
    }
  };

  const filteredData = assessments.filter(a => {
    const isMasuk = a.status === 'Menunggu_Validasi';
    const isKeluar = a.status !== 'Menunggu_Validasi';

    if (activeTab === "masuk" && !isMasuk) return false;
    if (activeTab === "keluar" && !isKeluar) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!a.schoolName?.toLowerCase().includes(q) &&
          !a.buildingName?.toLowerCase().includes(q) &&
          !a.id.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Laporan Surat Masuk & Keluar
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Pantau permohonan yang masuk dan jawaban hasil penilaian yang keluar.
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-5 shadow-lg border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-2xl shrink-0 mt-0.5">
            <FileCheck className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Mesin Template Surat v2.0 (Ready Production)</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500 text-white uppercase tracking-wider">
                100% Pengaturan Surat
              </span>
            </div>
            <p className="text-xs text-blue-200/90 mt-1 max-w-2xl leading-relaxed">
              Seluruh surat permohonan dan surat hasil sekarang otomatis mengacu pada template & pengaturan resmi, menggunakan konversi Native Doc dan dilengkapi barcode Tanda Tangan Elektronik (TTE) + Kode QR Verifikasi. Klik tombol perbarui pada tiap baris untuk mengaktifkan format terbaru.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 p-2 gap-2">
          <button
            onClick={() => setActiveTab("masuk")}
            className={cn(
              "flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl transition-all",
              activeTab === "masuk" 
                ? "bg-white text-blue-600 shadow-sm border border-slate-200" 
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            )}
          >
            <Inbox className="w-4 h-4" />
            Surat Masuk 
            <span className="ml-2 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
              {assessments.filter(a => a.status === 'Menunggu_Validasi').length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("keluar")}
            className={cn(
              "flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-xl transition-all",
              activeTab === "keluar" 
                ? "bg-white text-emerald-600 shadow-sm border border-slate-200" 
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            )}
          >
            <Send className="w-4 h-4" />
            Surat Keluar
            <span className="ml-2 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
              {assessments.filter(a => a.status !== 'Menunggu_Validasi').length}
            </span>
          </button>
          <div className="ml-auto relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari Instansi / ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p>Memuat data surat...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center p-12">
              <FileCheck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">Tidak ada {activeTab === "masuk" ? "surat masuk" : "surat keluar"} saat ini.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-4 w-12 text-center">No</th>
                    <th className="p-4">ID / Tanggal</th>
                    <th className="p-4">Instansi & Bangunan</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Aksi / Dokumen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <AnimatePresence>
                    {filteredData.map((assessment, idx) => {
                      // fallback for missing customFields
                      const cFields = assessment.customFields || {};
                      
                      return (
                        <motion.tr 
                          key={assessment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="p-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="p-4">
                            <div className="font-mono text-xs text-blue-600 font-bold mb-1">
                              {assessment.id.substring(0, 8).toUpperCase()}
                            </div>
                            <div className="text-slate-500 text-xs">
                              {format(new Date(assessment.date), "dd MMM yyyy, HH:mm", { locale: id })}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-800">{assessment.schoolName}</div>
                            <div className="text-slate-500 text-xs mt-0.5">{assessment.buildingName}</div>
                          </td>
                          <td className="p-4">
                            {activeTab === "masuk" ? (
                              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                                Menunggu Validasi
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                                {assessment.status.replace(/_/g, " ")}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {cFields.documentLink && (
                                <a 
                                  href={cFields.documentLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors flex items-center justify-center"
                                  title="Lihat Dokumen PDF"
                                >
                                  <FileDown className="w-4 h-4" />
                                </a>
                              )}
                              <button
                                onClick={() => handleUpdateDocument(assessment)}
                                disabled={updatingDocumentId === assessment.id}
                                className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-60"
                                title="Perbarui Dokumen dengan Format Terbaru"
                              >
                                {updatingDocumentId === assessment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                              </button>
                              <button 
                                onClick={() => setSelectedAssessment(assessment)}
                                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Lihat Detail"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Detail */}
      <AnimatePresence>
        {selectedAssessment && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAssessment(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg h-full bg-white shadow-2xl flex flex-col z-10"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 backdrop-blur-md">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Detail Surat</h3>
                  <p className="text-xs text-slate-500 font-mono mt-1">ID: {selectedAssessment.id.toUpperCase()}</p>
                </div>
                <button 
                  onClick={() => setSelectedAssessment(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 flex-1 overflow-y-auto space-y-6 bg-slate-50/30">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 border-b border-slate-100 pb-4">
                    <div className="text-xs text-slate-500 font-semibold uppercase">Instansi</div>
                    <div className="col-span-2 text-sm font-bold text-slate-800">{selectedAssessment.schoolName}</div>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-100 pb-4">
                    <div className="text-xs text-slate-500 font-semibold uppercase">Massa Bangunan</div>
                    <div className="col-span-2 text-sm text-slate-800">{selectedAssessment.buildingName}</div>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-100 pb-4">
                    <div className="text-xs text-slate-500 font-semibold uppercase">Alamat</div>
                    <div className="col-span-2 text-sm text-slate-800">{selectedAssessment.address}</div>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-100 pb-4">
                    <div className="text-xs text-slate-500 font-semibold uppercase">Status</div>
                    <div className="col-span-2 text-sm font-bold text-blue-600">
                      {selectedAssessment.status.replace(/_/g, " ")}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 border-b border-slate-100 pb-4">
                    <div className="text-xs text-slate-500 font-semibold uppercase">Dokumen Surat</div>
                    <div className="col-span-2">
                      {selectedAssessment.customFields?.documentLink ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <button 
                            onClick={() => setPreviewUrl(selectedAssessment.customFields.documentLink)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors"
                          >
                            <FileText className="w-4 h-4" /> Buka Preview Surat
                          </button>
                          <button
                            onClick={() => handleUpdateDocument(selectedAssessment)}
                            disabled={updatingDocumentId === selectedAssessment.id}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors disabled:opacity-60"
                          >
                            {updatingDocumentId === selectedAssessment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Perbarui Dokumen
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs italic text-slate-400">Tidak ada dokumen PDF terlampir.</span>
                      )}
                    </div>
                  </div>
                </div>
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
    </div>
  );
}
