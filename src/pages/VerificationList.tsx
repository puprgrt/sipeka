import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { Assessment, COMPONENT_WEIGHTS_1_LANTAI, COMPONENT_WEIGHTS_2_LANTAI, COMPONENT_WEIGHTS_3_LANTAI } from "../types";
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

  const tabs = [
    { id: 'Semua', label: 'Semua' },
    { id: 'Menunggu_Validasi', label: 'Menunggu Validasi' },
    { id: 'Survei_Lapangan', label: 'Survei Lapangan' },
    { id: 'Selesai_Dianalisis', label: 'Selesai Dianalisis' },
    { id: 'Arsip_Digital', label: 'Arsip Digital' },
  ];

  const filteredAssessments = activeTab === 'Semua' 
    ? assessments 
    : assessments.filter(a => (a.status || 'Menunggu_Validasi') === activeTab);

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
      const res = await fetch(`/api/assessments/${selectedAssessment.id}/verification`, {
        method: "PUT",
        headers: getAuditHeaders(),
        body: JSON.stringify({ verification: localVerification })
      });
      if (res.ok) {
        // Update both assessments list and the selected assessment state
        setAssessments(prev => prev.map(a => {
          if (a.id === selectedAssessment.id) {
            return { ...a, verification: localVerification };
          }
          return a;
        }));
        setSelectedAssessment(prev => prev ? { ...prev, verification: localVerification } : null);
        alert("Catatan verifikasi komponen berhasil disimpan!");
      } else {
        alert("Gagal menyimpan verifikasi.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem.");
    }
    setSavingVerification(false);
  };

  useEffect(() => {
    fetch("/api/building-parameters").then(res => res.json()).then(data => { if(Array.isArray(data)) setFormParams(data); });
    fetch("/api/assessments")
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
      
    fetch("/api/dinas")
      .then(res => res.json())
      .then(data => setDinasConfig(data));
      
    fetch("/api/app-settings")
      .then(res => res.json())
      .then(data => setAppConfig(data))
      .catch(err => console.error("Failed to fetch app-settings", err));
      
    fetch("/api/document-templates")
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
      fetch(`/api/assessments/${selectedAssessment.id}/logs`)
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
      
      const structuralDamage = selectedAssessment.components?.find(c => ["Pondasi & Sloof", "Kolom", "Balok"].includes(c.name) && c.damageDetails?.some((d: any) => d.percentage > 0.3));
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
      const res = await fetch(`/api/assessments/${selectedAssessment.id}/status`, {
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
      <AnimatePresence>
        {selectedAssessment && (
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/new?edit=${selectedAssessment.id}&returnTo=/verifikasi`)}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors border border-amber-200 flex items-center gap-1.5 shadow-sm"
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    Edit Data Penilaian
                  </button>
                  <button
                    onClick={() => setSelectedAssessment(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
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
                      selectedAssessment.status === "Menunggu_Validasi" || !selectedAssessment.status ? "bg-amber-50 text-amber-800 border-amber-200" :
                      selectedAssessment.status === "Survei_Lapangan" ? "bg-blue-50 text-blue-800 border-blue-200" :
                      selectedAssessment.status === "Selesai_Dianalisis" ? "bg-purple-50 text-purple-800 border-purple-200" :
                      "bg-emerald-50 text-emerald-800 border-emerald-200"
                    )}>
                      {(selectedAssessment.status || "Menunggu_Validasi").replace("_", " ")}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
                    <div className="space-y-1">
                      <p className="text-slate-400 font-semibold text-[10px] uppercase">{getParamLabel("buildingName", "Nama Massa Bangunan")}</p>
                      <p className="font-bold text-slate-800">{selectedAssessment.buildingName}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 font-semibold text-[10px] uppercase">NPSN / NUP</p>
                      <p className="font-bold text-slate-800 font-mono">{selectedAssessment.npsn}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-slate-400 font-semibold text-[10px] uppercase">{getParamLabel("buildingArea", "Luas Bangunan")}</p>
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

                  {/* Render Custom/Dynamic Parameters if any */}
                  {selectedAssessment.customFields && Object.keys(selectedAssessment.customFields).length > 0 && (
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">
                        Parameter Tambahan Pemohon
                      </p>
                      <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/55">
                        {Object.entries(selectedAssessment.customFields)
                          .filter(([key, value]) => {
                            if (["id", "date", "schoolName", "buildingName", "npsn", "buildingArea", "floorCount", "address", "city", "province", "components", "photos", "finalResult", "status", "userId", "userName", "customFields", "verification", "safetyChecks", "documentLink", "idBangunan"].includes(key) || key.toLowerCase().includes('foto')) return false;
                            if (typeof value === "object" && value !== null) return false;
                            return true;
                          })
                          .map(([key, value]) => {
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

                  {/* Foto Dokumentasi Bangunan */}
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">
                      Foto Dokumentasi Bangunan
                    </p>
                    {parsePhotos(selectedAssessment.photos).length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {parsePhotos(selectedAssessment.photos).map((photo, pIdx) => (
                          <div 
                            key={pIdx} 
                            onClick={() => setSmartPreviewPhoto({ url: photo, componentName: 'Umum' })}
                            className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200/80 cursor-pointer hover:shadow-md transition-all bg-slate-100 flex items-center justify-center"
                          >
                            <img 
                              src={photo} 
                              alt={`Dokumentasi ${pIdx + 1}`} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                            />
                            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Maximize2 className="w-4 h-4 text-white drop-shadow-sm" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400 space-y-1 bg-slate-50/50">
                        <Image className="w-5 h-5 mx-auto text-slate-300 animate-pulse" />
                        <p className="text-[10px] font-bold">Tidak Ada Foto Dokumentasi Umum</p>
                        <p className="text-[9px] text-slate-400">Silakan periksa foto pada tiap komponen di bawah.</p>
                      </div>
                    )}
                  </div>

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
                          <div key={idx} className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-xs space-y-3">
                            <div>
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
                                    onClick={() => setSmartPreviewPhoto({ url: comp.photo!, componentName: comp.name })}
                                    className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm cursor-pointer hover:shadow-md transition-all bg-slate-100 flex items-center justify-center"
                                  >
                                    <img 
                                      src={comp.photo} 
                                      alt={`Foto ${comp.name}`} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <Maximize2 className="w-4 h-4 text-white" />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Section Verifikasi Hasil Input */}
                            <div className="pt-2.5 border-t border-slate-200/60 bg-slate-100/40 p-2.5 rounded-lg space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                  Status Verifikasi Komponen
                                </span>
                                {localVerification[comp.name]?.status && (
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase",
                                    localVerification[comp.name].status === 'Sesuai' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                                  )}>
                                    {localVerification[comp.name].status === 'Sesuai' ? 'Sesuai' : 'Butuh Survey'}
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateVerification(comp.name, 'Sesuai', localVerification[comp.name]?.comment || '')}
                                  className={cn(
                                    "flex-1 py-1.5 px-3 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                                    localVerification[comp.name]?.status === 'Sesuai'
                                      ? "bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-200"
                                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                  )}
                                >
                                  Sesuai
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateVerification(comp.name, 'Butuh_Survey', localVerification[comp.name]?.comment || '')}
                                  className={cn(
                                    "flex-1 py-1.5 px-3 rounded-lg border text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                                    localVerification[comp.name]?.status === 'Butuh_Survey'
                                      ? "bg-amber-500 border-amber-500 text-white shadow-sm shadow-amber-200"
                                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                                  )}
                                >
                                  Butuh Survey
                                </button>
                              </div>

                              <input
                                type="text"
                                placeholder="Komentar verifikasi teknis..."
                                value={localVerification[comp.name]?.comment || ''}
                                onChange={(e) => handleUpdateVerification(comp.name, localVerification[comp.name]?.status || 'Sesuai', e.target.value)}
                                className="w-full px-2 py-1.5 rounded border border-slate-200 text-[10px] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                              />
                            </div>
                          </div>
                        ))}

                        {/* Button Simpan Verifikasi */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={handleSaveVerification}
                            disabled={savingVerification}
                            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                          >
                            {savingVerification ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                Menyimpan Verifikasi...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Simpan Catatan Verifikasi Komponen
                              </>
                            )}
                          </button>
                        </div>
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
                              nomorAgenda: `AGD-${selectedAssessment.id.substring(0, 5).toUpperCase()}`,
                              tanggalDisposisi: format(new Date(selectedAssessment.date), "dd MMMM yyyy", { locale: id }),
                              asalSurat: selectedAssessment.schoolName,
                              perihal: 'Permohonan Penilaian Kerusakan Bangunan',
                              catatanPimpinan: 'Mohon segera diverifikasi kelengkapan administrasinya. Jika lengkap, jadwalkan peninjauan lapangan.'
                            });
                            htmlContent = `<html><head><title>Lembar Disposisi</title><style>body{font-family:'Times New Roman',serif;padding:20px;} .disposisi-header{text-align:center;border-bottom:3px double black;padding-bottom:10px;margin-bottom:20px;} .disposisi-title{text-align:center;font-weight:bold;font-size:18px;text-decoration:underline;margin-bottom:20px;} .disposisi-meta{width:100%;margin-bottom:20px;border-collapse:collapse;} .disposisi-meta td{padding:5px;} .disposisi-meta td:first-child{width:20%;font-weight:bold;}</style></head><body>${htmlContent}<script>window.print();</script></body></html>`;
                          } else {
                            htmlContent = `<html><head><title>Lembar Disposisi</title><style>body{font-family:'Times New Roman',serif;padding:40px;}h2,h1,p{text-align:center;margin:0;}hr{border:2px solid black;margin:20px 0;}h3{text-align:center;text-decoration:underline;}table{width:100%;margin-top:20px;}td{padding:5px;vertical-align:top;}</style></head><body><h2>PEMERINTAH KABUPATEN GARUT</h2><h1>${dinasConfig?.namaDinas || 'DINAS PEKERJAAN UMUM DAN PENATAAN RUANG'}</h1><p>${dinasConfig?.alamat || 'Jl. Prof. KH. Cecep Syarifudin No. 117, Garut'}</p><hr/><h3>LEMBAR DISPOSISI</h3><table><tr><td width="20%">No. Agenda</td><td>: AGD-${selectedAssessment.id.substring(0, 5).toUpperCase()}</td></tr><tr><td>Tanggal</td><td>: ${format(new Date(selectedAssessment.date), "dd MMMM yyyy", { locale: id })}</td></tr><tr><td>Asal Surat</td><td>: ${selectedAssessment.schoolName}</td></tr><tr><td>Perihal</td><td>: Permohonan Penilaian Kerusakan Bangunan</td></tr></table><script>window.print();</script></body></html>`;
                          }
                          printWindow.document.write(htmlContent);
                          printWindow.document.close();
                        }
                      }}
                      className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors border border-slate-200/60"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1.5" />
                      Cetak Lembar
                    </button>
                    {lembarDisposisiDriveLink && (
                      <a
                        href={lembarDisposisiDriveLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200/60 ml-2"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1.5" />
                        Unduh Template Asli
                      </a>
                    )}
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
                      <div className="border-r border-b border-slate-900 p-2 flex">
                        <span className="w-24 font-bold">Indeks Berkas</span>
                        <span className="mr-2">:</span>
                        <span>045.2 / Pmb-Gdg</span>
                      </div>
                      <div className="border-r border-b border-slate-900 p-2 flex">
                        <span className="w-24 font-bold">Kode</span>
                        <span className="mr-2">:</span>
                        <span>B.1</span>
                      </div>
                      
                      <div className="col-span-2 border-r border-b border-slate-900 p-2 flex">
                        <span className="w-24 font-bold">Tanggal Surat</span>
                        <span className="mr-2">:</span>
                        <span>{format(new Date(selectedAssessment.date), "dd MMMM yyyy", { locale: id })}</span>
                      </div>

                      <div className="col-span-2 border-r border-b border-slate-900 p-2 flex">
                        <span className="w-24 font-bold">Nomor Surat</span>
                        <span className="mr-2">:</span>
                        <span className="font-mono">PUPR/B-0{selectedAssessment.id.substring(0, 3)}/2026</span>
                      </div>

                      <div className="col-span-2 border-r border-b border-slate-900 p-2 flex">
                        <span className="w-24 font-bold">Asal Surat</span>
                        <span className="mr-2">:</span>
                        <span className="font-bold uppercase">{selectedAssessment.schoolName}</span>
                      </div>

                      <div className="col-span-2 border-r border-b border-slate-900 p-2 flex">
                        <span className="w-24 font-bold">Hal</span>
                        <span className="mr-2">:</span>
                        <span>Permohonan Penilaian Kerusakan Bangunan ({selectedAssessment.buildingName})</span>
                      </div>

                      <div className="border-r border-b border-slate-900 p-2 flex">
                        <span className="w-24 font-bold">Diterima Tgl</span>
                        <span className="mr-2">:</span>
                        <span>{format(new Date(selectedAssessment.date), "dd MMMM yyyy", { locale: id })}</span>
                      </div>
                      <div className="border-r border-b border-slate-900 p-2 flex">
                        <span className="w-24 font-bold">No. Agenda</span>
                        <span className="mr-2">:</span>
                        <span>AGD-{selectedAssessment.id.substring(0, 5).toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Instruksi Disposisi */}
                    <div className="grid grid-cols-2 gap-0 border-l border-b border-slate-900 mt-4 text-[10px] min-h-[160px]">
                      <div className="border-r border-slate-900 p-3 relative">
                        <p className="font-bold mb-3 uppercase tracking-wider border-b border-slate-300 pb-1 inline-block">Diteruskan Kepada Yth:</p>
                        <ol className="list-decimal pl-4 space-y-2">
                          <li className="font-bold text-slate-800">Kepala Bidang Bangunan <span className="inline-block w-4 h-4 border border-slate-900 rounded-sm ml-2 align-middle bg-slate-900 text-white flex items-center justify-center font-bold">✓</span></li>
                          <li className="text-slate-600">Koordinator <span className="inline-block w-4 h-4 border border-slate-900 rounded-sm ml-2 align-middle" /></li>
                          <li className="text-slate-600">Tim Teknis <span className="inline-block w-4 h-4 border border-slate-900 rounded-sm ml-2 align-middle" /></li>
                        </ol>
                      </div>
                      <div className="border-r border-slate-900 p-3 relative">
                        <p className="font-bold mb-3 uppercase tracking-wider border-b border-slate-300 pb-1 inline-block">Dengan Hormat Harap:</p>
                        <ul className="space-y-1.5">
                          <li>[ <span className={selectedAssessment.status !== "Menunggu_Validasi" ? "font-bold" : ""}>{selectedAssessment.status !== "Menunggu_Validasi" ? "✓" : "  "}</span> ] Tanggapan dan Saran</li>
                          <li>[ <span className={selectedAssessment.status === "Survei_Lapangan" || selectedAssessment.status === "Selesai_Dianalisis" ? "font-bold" : ""}>{selectedAssessment.status === "Survei_Lapangan" || selectedAssessment.status === "Selesai_Dianalisis" ? "✓" : "  "}</span> ] Proses Lebih Lanjut</li>
                          <li>[ <span className={selectedAssessment.status === "Selesai_Dianalisis" ? "font-bold" : ""}>{selectedAssessment.status === "Selesai_Dianalisis" ? "✓" : "  "}</span> ] Koordinasi/Konfirmasi</li>
                          <li>[ &nbsp;&nbsp; ] Laporan / Hari ini</li>
                        </ul>
                      </div>
                    </div>

                    {/* Catatan Pimpinan */}
                    <div className="border border-slate-900 border-t-0 p-3 min-h-[100px] text-[10px]">
                      <p className="font-bold mb-1 uppercase tracking-wider">Catatan Pimpinan:</p>
                      <p className="italic text-slate-700 leading-relaxed pl-2 mt-2">
                        {selectedAssessment.status === "Menunggu_Validasi" 
                          ? "Mohon segera diverifikasi kelengkapan administrasinya. Jika lengkap, jadwalkan peninjauan lapangan." 
                          : selectedAssessment.status === "Survei_Lapangan"
                          ? "Tim teknis harap meninjau ke lapangan dengan membawa form PUPR. Pastikan pengukuran volume kerusakan akurat."
                          : selectedAssessment.status === "Selesai_Dianalisis"
                          ? "Analisis selesai. Segera siapkan draft Rekomendasi Penanganan untuk ditandatangani."
                          : "Tindak lanjut sesuai dengan prosedur dan kewenangan tugas."}
                      </p>
                      {/* TTD Pimpinan Simulasi */}
                      {(selectedAssessment.status === "Survei_Lapangan" || selectedAssessment.status === "Selesai_Dianalisis") && (
                         <div className="mt-4 flex justify-end">
                           <div className="text-center">
                             <div className="w-16 h-8 border-b-2 border-blue-900 border-dotted mx-auto mb-1 transform -rotate-6 opacity-60 flex items-center justify-center">
                               <span className="text-[8px] text-blue-900 font-bold uppercase italic">Signed</span>
                             </div>
                             <p className="font-bold underline">Ir. H. Kepala Dinas, M.T.</p>
                             <p className="text-[8px]">NIP. 19700101 199803 1 004</p>
                           </div>
                         </div>
                      )}
                    </div>
                  </div>
                  
                  {/* AI Analysis Result Panel */}
                  <AnimatePresence>
                    {aiAnalysisResult && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3"
                      >
                        <div className="flex items-center gap-2 text-indigo-800">
                          <Cpu className="w-4 h-4" />
                          <h4 className="text-xs font-black uppercase tracking-wider">Laporan Audit AI PUPR Cerdas</h4>
                        </div>
                        <div className="text-xs text-slate-700 space-y-1">
                          <p>Berdasarkan analisis silang antara persentase kerusakan, kategori komponen, dan bukti dokumentasi, sistem AI menyimpulkan:</p>
                          {aiAnalysisResult.issues.length > 0 ? (
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-amber-700 font-medium">
                              {aiAnalysisResult.issues.map((iss, i) => (
                                <li key={i}>{iss}</li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-emerald-600 font-bold mt-2 flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Tidak ditemukan anomali atau inkonsistensi yang mencolok.
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                </div>
              </div>

              {/* Footer */}
                            {/* Footer */}
              <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-xs gap-4 rounded-b-2xl">
                
                {/* AI Assistant Button */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {!aiAnalysisResult ? (
                    <button
                      onClick={handleAiFraudDetection}
                      disabled={isAiDetecting}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold flex items-center gap-2 transition-all"
                    >
                      {isAiDetecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cpu className="w-4 h-4" />}
                      Analisis Kesesuaian Laporan (AI)
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                      <ShieldCheck className={cn("w-5 h-5", aiAnalysisResult.score >= 80 ? "text-emerald-500" : "text-amber-500")} />
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Skor Integritas AI</p>
                        <p className={cn("text-sm font-black", aiAnalysisResult.score >= 80 ? "text-emerald-600" : "text-amber-600")}>
                          {aiAnalysisResult.score}% <span className="text-xs font-semibold text-slate-600 ml-1">{aiAnalysisResult.score >= 80 ? "Laporan Wajar" : "Perlu Verifikasi Fisik"}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Actions */}
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  {(selectedAssessment.status === "Selesai_Dianalisis") && (
                    <button
                      onClick={handleForwardToKadis}
                      disabled={isForwarding}
                      className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
                    >
                      {isForwarding ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />}
                      Teruskan BAP ke Kadis
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedAssessment(null)}
                    className="px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all shadow-sm"
                  >
                    Tutup Detail
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

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
