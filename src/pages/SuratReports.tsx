import { useEffect, useState } from "react";
import { Assessment } from "../types";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Inbox, Send, Eye, FileCheck, FileDown, Search, X } from "lucide-react";

export default function SuratReports() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"masuk" | "keluar">("masuk");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  const fetchAssessments = () => {
    fetch("/api/assessments")
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
    const intervalId = setInterval(fetchAssessments, 10000); // Polling every 10s for realtime updates
    return () => clearInterval(intervalId);
  }, []);

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
                        <a 
                          href={selectedAssessment.customFields.documentLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-bold hover:bg-rose-100 transition-colors"
                        >
                          <FileDown className="w-4 h-4" /> Buka PDF Surat
                        </a>
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
    </div>
  );
}
