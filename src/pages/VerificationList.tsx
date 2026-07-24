import { apiFetch } from "../lib/api";
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Assessment, COMPONENT_WEIGHTS_1_LANTAI, COMPONENT_WEIGHTS_2_LANTAI, COMPONENT_WEIGHTS_3_LANTAI } from "../types";
import VerificationDetailModal from "../components/verification/VerificationDetailModal";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn, getAuditHeaders, parsePhotos } from "../lib/utils";
import { replaceTemplatePlaceholders } from "../utils/templateUtils";
import { DataTable } from "../components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { createCalendarEvent } from "../lib/calendarService";
import SmartPhotoViewer from '../components/SmartPhotoViewer';
import { appendToSheet } from "../lib/sheetsService";
import { getAccessToken, googleSignIn } from "../lib/firebaseAuth";
import { motion, AnimatePresence } from "motion/react";
import { 
  Eye, Clock, Calendar, ClipboardList, Building, MapPin, FileText, 
  CheckCircle2, User, Loader2, ArrowRight, ExternalLink, X, HelpCircle,
  Image, Maximize2, ShieldCheck, FileSignature, AlertTriangle, Cpu
} from "lucide-react";

export default function VerificationList() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const targetId = searchParams.get('id') || (location.state as any)?.assessmentId;

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeRole, setActiveRole] = useState(() => localStorage.getItem("activeRole") || "Administrator");
  const [formParams, setFormParams] = useState<any[]>([]);
  const getParamLabel = (id: string, def: string) => {
    const p = formParams.find((x: any) => x.id === id);
    return p ? p.label : def;
  };
  const [loading, setLoading] = useState(true);
  const [dinasConfig, setDinasConfig] = useState<any>(null);
  const [appConfig, setAppConfig] = useState<any>(null);
  const [lembarDisposisiTemplate, setLembarDisposisiTemplate] = useState<string>("");
  const [lembarDisposisiDriveLink, setLembarDisposisiDriveLink] = useState<string>("");
  
  const [activeTab, setActiveTab] = useState("Semua");
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [dispositionLogs, setDispositionLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [localVerification, setLocalVerification] = useState<Record<string, { status: 'Sesuai' | 'Butuh_Survey', comment: string }>>({});
  const [savingVerification, setSavingVerification] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [smartPreviewPhoto, setSmartPreviewPhoto] = useState<{ url: string, componentName: string } | null>(null);
  const [isAiDetecting, setIsAiDetecting] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{ score: number, issues: string[] } | null>(null);
  const [isForwarding, setIsForwarding] = useState(false);
  const [componentsConfig, setComponentsConfig] = useState<any[]>([]);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    apiFetch("/api/components")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setComponentsConfig(data);
      })
      .catch(err => console.error("Failed to load components for verification list", err));
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setActiveRole(localStorage.getItem("activeRole") || "Administrator");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const baseTabs = [
    { id: 'Semua', label: 'Semua' },
    { id: 'Menunggu_Validasi', label: 'Menunggu Validasi' },
    { id: 'Survei_Lapangan', label: 'Survei Lapangan' },
    { id: 'Selesai_Dianalisis', label: 'Selesai Dianalisis' },
    { id: 'Menunggu_Pengesahan', label: 'Menunggu Pengesahan' },
    { id: 'Arsip_Digital', label: 'Arsip Digital' },
  ];
  
  // Filter tabs based on role for better UX
  const tabs = baseTabs.filter(t => {
    if (t.id === 'Semua') return true;
    if (activeRole === 'Tim_Teknis' || activeRole === 'Petugas_Survey') return ['Menunggu_Validasi', 'Survei_Lapangan', 'Selesai_Dianalisis'].includes(t.id);
    if (activeRole === 'Koordinator') return ['Menunggu_Pengesahan', 'Selesai_Dianalisis'].includes(t.id);
    if (activeRole === 'Kabid') return ['Menunggu_Pengesahan', 'Selesai_Dianalisis'].includes(t.id);
    if (activeRole === 'Kadis') return ['Menunggu_Pengesahan', 'Arsip_Digital'].includes(t.id);
    return true; // Administrator sees all
  });

  // Normalize statuses for filtering (backward compat with old data)
  const normalizeStatusLocal = (s: string) => {
    if (s === 'Verifikasi_Berkas') return 'Menunggu_Validasi';
    if (s === 'Menunggu_TTE_Koordinator' || s === 'Menunggu_TTE_Kabid' || s === 'Menunggu_Validasi_Kadis') return 'Menunggu_Pengesahan';
    return s;
  };

  const filteredAssessments = activeTab === 'Semua' 
    ? assessments 
    : assessments.filter(a => normalizeStatusLocal(a.status || 'Menunggu_Validasi') === activeTab);

  useEffect(() => {
    if (selectedAssessment) {
      setLocalVerification(selectedAssessment.verification || {});
      setAiAnalysisResult(null);
    } else {
      setLocalVerification({});
    }
  }, [selectedAssessment]);

  const handleUpdateVerification = (compName: string, status: 'Sesuai' | 'Butuh_Survey' | undefined, comment: string) => {
    setLocalVerification(prev => ({
      ...prev,
      [compName]: {
        status: status || 'Sesuai',
        comment: comment
      }
    }));
  };

  const handleSaveVerification = async () => {
    if (!selectedAssessment) return;
    setSavingVerification(true);
    try {
      const res = await apiFetch(`/api/assessments/${selectedAssessment.id}/verification`, {
        method: "PUT",
        headers: getAuditHeaders(),
        body: JSON.stringify({ verification: localVerification, isTTE: true })
      });
      if (res.ok) {
        const data = await res.json();
        // Update both assessments list and the selected assessment state
        setAssessments(prev => prev.map(a => {
          if (a.id === selectedAssessment.id) {
            return { 
              ...a, 
              verification: localVerification,
              status: data.statusTerakhir || a.status,
              tteSignatures: data.tteSignatures || a.tteSignatures 
            };
          }
          return a;
        }));
        setSelectedAssessment(prev => prev ? { 
          ...prev, 
          verification: localVerification,
          status: data.statusTerakhir || prev.status,
          tteSignatures: data.tteSignatures || prev.tteSignatures
        } : null);
        alert("Catatan verifikasi komponen dan TTE Otomatis berhasil disimpan!");
        setSelectedAssessment(null);
      } else {
        alert("Gagal menyimpan catatan verifikasi.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan.");
    } finally {
      setSavingVerification(false);
    }
  };

  useEffect(() => {
    apiFetch("/api/building-parameters").then(res => res.json()).then(data => { if(Array.isArray(data)) setFormParams(data); });
    apiFetch("/api/assessments")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAssessments(data);
          if (targetId) {
             const found = data.find(a => a.id === targetId);
             if (found) {
                setSelectedAssessment(found);
             }
          }
        } else {
          setAssessments([]);
          console.error("Invalid assessments data:", data);
        }
        setLoading(false);
      }).catch(err => {
        console.error("Failed to fetch assessments", err);
        setAssessments([]);
        setLoading(false);
      });
      
    apiFetch("/api/dinas")
      .then(res => res.json())
      .then(data => setDinasConfig(data));
      
    apiFetch("/api/app-settings")
      .then(res => res.json())
      .then(data => setAppConfig(data))
      .catch(err => console.error("Failed to fetch app-settings", err));
      
    apiFetch("/api/document-templates")
      .then(res => res.json())
      .then((templates: any[]) => {
        const disposisi = templates.find((t: any) => t.id === 'lembar_disposisi');
        if (disposisi) {
          setLembarDisposisiTemplate(disposisi.kontenHtml);
          setLembarDisposisiDriveLink(disposisi.driveLink || "");
        }
      })
      .catch(err => console.error("Failed to fetch templates", err));
  }, []);

  useEffect(() => {
    if (selectedAssessment) {
      setLoadingLogs(true);
      apiFetch(`/api/assessments/${selectedAssessment.id}/logs`)
        .then(res => res.json())
        .then(data => {
          setDispositionLogs(data);
          setLoadingLogs(false);
        })
        .catch(err => {
          console.error("Failed to fetch logs", err);
          setLoadingLogs(false);
        });
    } else {
      setDispositionLogs([]);
    }
  }, [selectedAssessment, selectedAssessment?.status]);

  const handleScheduleSurvei = async (assessment: Assessment) => {
    const token = await getAccessToken();
    if (!token) {
        try {
            await googleSignIn();
        } catch (error) {
            console.warn("Google Sign-In failed or was cancelled:", error);
            return;
        }
    }
    
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0); // 9:00 AM tomorrow
        
        const nextHour = new Date(tomorrow);
        nextHour.setHours(10, 0, 0, 0);
        
        const summary = `Survei Lapangan: ${assessment.schoolName} - ${assessment.buildingName}`;
        const description = `Alamat: ${assessment.address}\n\nMohon lakukan pengecekan lapangan untuk memverifikasi laporan kerusakan.`;
        
        const link = await createCalendarEvent(summary, description, tomorrow, nextHour);
        alert(`Jadwal survei berhasil dibuat!\nLihat di Calendar: ${link}`);
    } catch (err) {
        console.error("Failed to schedule", err);
        alert("Gagal membuat jadwal survei.");
    }
  };

  const handleAiFraudDetection = () => {
    setIsAiDetecting(true);
    setTimeout(() => {
      const issues = [];
      let score = 95; // base score 95% kesesuaian
      
      if (!selectedAssessment) return;
      
      const category = selectedAssessment.finalResult?.category;
      if (category === "Berat" && selectedAssessment.photos?.length === 0) {
        score -= 40;
        issues.push("Klaim Rusak Berat tanpa bukti foto dokumentasi umum.");
      }
      if (selectedAssessment.components?.length === 0) {
        score -= 20;
        issues.push("Tidak ada rincian komponen yang dinilai.");
      }
      
      const strukturNames = componentsConfig
        .filter(c => (c.kategoriKomponen || "").toUpperCase() === "STRUKTUR")
        .map(c => c.namaKomponen);
        
      // Fallback if settings are empty
      const targetComponents = strukturNames.length > 0 
        ? strukturNames 
        : ["Pondasi & Sloof", "Kolom", "Balok"];

      const structuralDamage = selectedAssessment.components?.find(c => targetComponents.includes(c.name) && c.damageDetails?.some((d: any) => d.percentage > 0.3));
      if (structuralDamage && category === "Ringan") {
        score -= 25;
        issues.push("Terdapat kerusakan struktural mayor namun diklaim sebagai Rusak Ringan.");
      }
      
      setAiAnalysisResult({ score, issues });
      setIsAiDetecting(false);
    }, 2500);
  };
  
  const handleForwardToKadis = async () => {
    if (!selectedAssessment) return;
    if (!confirm("Teruskan Berita Acara Pemeriksaan (BAP) ini kepada Kepala Dinas?")) return;
    setIsForwarding(true);
    try {
      const res = await apiFetch(`/api/assessments/${selectedAssessment.id}/status`, {
        method: "PUT",
        headers: getAuditHeaders(),
        body: JSON.stringify({ status: 'Menunggu_Pengesahan' })
      });
      if (res.ok) {
        setAssessments(prev => prev.map(a => a.id === selectedAssessment.id ? { ...a, status: 'Menunggu_Pengesahan' } : a));
        setSelectedAssessment(prev => prev ? { ...prev, status: 'Menunggu_Pengesahan' } : null);
        alert("BAP berhasil diteruskan ke Kadis!");
      }
    } catch (e) {
      alert("Gagal meneruskan BAP");
    } finally {
      setIsForwarding(false);
    }
  };
  
  const handleArchiveToSheets = async (assessment: Assessment) => {
    const token = await getAccessToken();
    if (!token) {
        try {
            await googleSignIn();
        } catch (error) {
            console.warn("Google Sign-In failed or was cancelled:", error);
            return;
        }
    }
    
    try {
        // Just use a fixed spreadsheet ID if we had one, but we don't, so let's prompt or error.
        // For demonstration, we could let the user supply the ID, or we just alert them that they need to create one.
        const spreadsheetId = prompt("Masukkan Spreadsheet ID untuk menyimpan arsip (kosongkan untuk membuat Spreadsheet baru):");
        let targetId = spreadsheetId;
        
        if (!targetId) {
            alert("Membuat spreadsheet baru...");
            const { createSpreadsheet } = await import("../lib/sheetsService");
            targetId = await createSpreadsheet("Arsip Penilaian SI-PEKA");
            alert(`Spreadsheet baru berhasil dibuat dengan ID: ${targetId}`);
        }
        
        const values = [
            [
                format(new Date(assessment.date), "dd MMM yyyy", { locale: id }),
                assessment.schoolName,
                assessment.buildingName,
                assessment.npsn,
                assessment.buildingArea.toString(),
                assessment.finalResult.totalDamagePercentage.toFixed(2) + "%",
                "Rusak " + assessment.finalResult.category
            ]
        ];
        
        await appendToSheet(targetId as string, "Sheet1!A:G", values);
        alert(`Data berhasil diarsipkan ke Spreadsheet (ID: ${targetId}).\nBuka di: https://docs.google.com/spreadsheets/d/${targetId}`);
    } catch (err) {
        console.error("Failed to archive", err);
        alert("Gagal mengarsipkan ke Spreadsheet.");
    }
  };


  const columns: ColumnDef<Assessment>[] = [
    {
      accessorKey: "date",
      header: "Tanggal",
      cell: ({ row }) => (
        <span className="whitespace-nowrap text-xs text-slate-500">
          {format(new Date(row.original.date), "dd MMM yyyy", { locale: id })}
        </span>
      ),
    },
    {
      accessorKey: "schoolName",
      header: "Sekolah",
      cell: ({ row }) => <span className="font-semibold text-slate-700">{row.original.schoolName}</span>,
    },
    {
      accessorKey: "buildingName",
      header: "Bangunan",
      cell: ({ row }) => <span className="text-slate-600">{row.original.buildingName}</span>,
    },
    {
      accessorKey: "buildingArea",
      header: "Luas (m²)",
      cell: ({ row }) => <span className="font-mono text-xs text-slate-500">{row.original.buildingArea}</span>,
    },
    {
      id: "kerusakan",
      header: "Nilai Kerusakan",
      accessorFn: (row) => row.finalResult?.totalDamagePercentage,
      cell: ({ row }) => <span className="font-semibold text-slate-800">{(row.original.finalResult?.totalDamagePercentage || 0).toFixed(2)}%</span>,
    },
    {
      id: "kategori",
      header: "Kategori",
      accessorFn: (row) => row.finalResult?.category,
      cell: ({ row }) => {
        const cat = row.original.finalResult?.category || "Ringan";
        return (
          <span className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
            cat === 'Ringan' ? 'bg-[#2E7D32]/10 text-[#2E7D32]' : 
            cat === 'Sedang' ? 'bg-[#FFB300]/20 text-[#B78100]' : 
            'bg-[#E65100]/10 text-[#E65100]'
          )}>
            Rusak {cat}
          </span>
        );
      }
    },
    {
      accessorKey: "status",
      header: "Status Disposisi",
      cell: ({ row }) => {
        const assessment = row.original;
        return (
          <span className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            (assessment.status || "Menunggu_Validasi") === "Menunggu_Validasi" ? "bg-amber-50 text-amber-800 border-amber-200" :
            assessment.status === "Survei_Lapangan" ? "bg-blue-50 text-blue-800 border-blue-200" :
            assessment.status === "Selesai_Dianalisis" ? "bg-purple-50 text-purple-800 border-purple-200" :
            "bg-emerald-50 text-emerald-800 border-emerald-200"
          )}>
            {(assessment.status || "Menunggu_Validasi").replace("_", " ")}
          </span>
        );
      }
    },
    {
      id: "aksi",
      header: "Aksi",
      cell: ({ row }) => {
        const assessment = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <button 
              onClick={() => setSelectedAssessment(assessment)} 
              className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60 px-3 py-2 rounded-lg transition-colors shadow-sm"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
              Verifikasi
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg overflow-hidden flex flex-col">
        <div className="bg-white/40 backdrop-blur-sm px-6 py-4 border-b border-white/30 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Verifikasi Permohonan (Tugas Saya)</h2>
            <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pantau dan kelola tugas verifikasi lapangan</p>
          </div>
        </div>

        
        {/* KPI Tugas Saya */}
        <div className="px-6 py-6 border-b border-white/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/60 backdrop-blur-sm border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Tugas</h3>
                <p className="text-2xl font-black text-slate-800">{assessments.length}</p>
              </div>
              <div className="p-3 bg-blue-50 text-pu-blue rounded-lg">
                <ClipboardList className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm border border-yellow-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest mb-1">Menunggu Survei</h3>
                <p className="text-2xl font-black text-yellow-700">{assessments.filter(a => a.status === 'Survei_Lapangan' || a.status === 'Menunggu_Validasi').length}</p>
              </div>
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm border border-green-200 p-4 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-1">Selesai Survei</h3>
                <p className="text-2xl font-black text-green-700">{assessments.filter(a => a.status === 'Selesai_Dianalisis' || a.status === 'Arsip_Digital').length}</p>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Disposition Tabs */}
        <div className="px-6 pt-4 bg-white/30 backdrop-blur-sm border-b border-white/30 flex space-x-6 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "pb-3 text-xs font-bold uppercase tracking-widest relative whitespace-nowrap transition-colors",
                activeTab === tab.id ? "text-pu-blue" : "text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-pu-blue"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <div className="w-8 h-8 border-4 border-pu-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm">
              <DataTable columns={columns} data={filteredAssessments} />
            </div>

        )}
      </div>

      {/* Side Sheet Detail & Real-Time Timeline */}
        <VerificationDetailModal
          selectedAssessment={selectedAssessment}
          setSelectedAssessment={setSelectedAssessment}
          activeRole={activeRole}
          handleUpdateVerification={handleUpdateVerification}
          handleSaveVerification={handleSaveVerification}
          setPreviewUrl={setLightboxPhoto}
          setSmartPreviewPhoto={setSmartPreviewPhoto}
          formatSize={formatSize}
          getParamLabel={getParamLabel}
          localVerification={localVerification}
          savingVerification={savingVerification}
          loadingLogs={loadingLogs}
          dispositionLogs={dispositionLogs}
          lembarDisposisiTemplate={lembarDisposisiTemplate}
          dinasConfig={dinasConfig}
          lembarDisposisiDriveLink={lembarDisposisiDriveLink}
          appConfig={appConfig}
          aiAnalysisResult={aiAnalysisResult}
          handleAiFraudDetection={handleAiFraudDetection}
          isAiDetecting={isAiDetecting}
          handleForwardToKadis={handleForwardToKadis}
          isForwarding={isForwarding}
        />


        {/* Lightbox Modal */}
        {smartPreviewPhoto && (
          <SmartPhotoViewer 
            photoUrl={smartPreviewPhoto.url} 
            fileName={smartPreviewPhoto.url.split('/').pop() || "Dokumentasi Bangunan"}
            onApplyAiRecommendation={smartPreviewPhoto.componentName !== "Umum" ? (text) => {
              const currentComment = localVerification[smartPreviewPhoto.componentName]?.comment || '';
              handleUpdateVerification(
                smartPreviewPhoto.componentName, 
                'Butuh_Survey', 
                currentComment ? `${currentComment}\n\n${text}` : text
              );
            } : undefined}
            onClose={() => setSmartPreviewPhoto(null)}
          />
        )}
        <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4 backdrop-blur-md cursor-pointer"
            onClick={() => setLightboxPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full flex flex-col items-center"
            >
              <button
                onClick={() => setLightboxPhoto(null)}
                className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={lightboxPhoto}
                alt="Foto Dokumentasi Lengkap"
                className="max-h-[80vh] w-auto max-w-full rounded-2xl shadow-2xl border border-white/10 object-contain bg-slate-900"
              />
              <div className="mt-4 text-center">
                <p className="text-white font-bold text-sm tracking-wide">FOTO DOKUMENTASI VERIFIKASI LAPANGAN</p>
                <p className="text-slate-400 text-xs mt-0.5">Klik di luar foto untuk menutup</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
