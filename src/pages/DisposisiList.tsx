import { apiFetch } from "../lib/api";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Assessment, COMPONENT_WEIGHTS_1_LANTAI, COMPONENT_WEIGHTS_2_LANTAI, COMPONENT_WEIGHTS_3_LANTAI } from "../types";
import DisposisiDetailModal from "../components/disposisi/DisposisiDetailModal";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn, getAuditHeaders } from "../lib/utils";
import { replaceTemplatePlaceholders } from "../utils/templateUtils";
import { DataTable } from "../components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { createCalendarEvent, promptSurveyScheduleTimes } from "../lib/calendarService";
import { appendToSheet } from "../lib/sheetsService";
import { getAccessToken, googleSignIn } from "../lib/firebaseAuth";
import { motion, AnimatePresence } from "motion/react";
import SmartPhotoViewer from '../components/SmartPhotoViewer';
import ActionDialog from "../components/ui/ActionDialog";
import { exportAssessmentToPdf } from "../lib/exportPdf";
import { Download } from "lucide-react";
import { 
  Eye, Clock, Calendar, Building, MapPin, FileText, 
  CheckCircle2, User, Loader2, ArrowRight, ExternalLink, X, HelpCircle,
  RefreshCw, Lock, Table
} from "lucide-react";
import * as XLSX from "xlsx";
import { STATUS_TABS, STATUS_OPTIONS, getStatusBadgeClasses, formatStatusText } from "../lib/statusUtils";

export default function DisposisiList() {
  const location = useLocation();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dinasConfig, setDinasConfig] = useState<any>(null);
  const [letterConfig, setLetterConfig] = useState<any>(null);
  const [appConfig, setAppConfig] = useState<any>(null);
  const [suratHasilTemplate, setSuratHasilTemplate] = useState<string>("");
  const [lembarDisposisiTemplate, setLembarDisposisiTemplate] = useState<string>("");
  
  const [suratHasilDriveLink, setSuratHasilDriveLink] = useState<string>("");
  const [lembarDisposisiDriveLink, setLembarDisposisiDriveLink] = useState<string>("");
  const [lampiranExcelDriveLink, setLampiranExcelDriveLink] = useState<string>("");

  const [activeTab, setActiveTab] = useState("Semua");
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [dispositionLogs, setDispositionLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [smartPreviewPhoto, setSmartPreviewPhoto] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<{
    type: "confirm" | "prompt" | "info";
    title: string;
    description: string;
    inputLabel?: string;
    inputValue?: string;
    onConfirm?: (value?: string) => void | Promise<void>;
  } | null>(null);
  const [dialogInputValue, setDialogInputValue] = useState("");

  // Editable disposisi states
  const [isEditingDisposisi, setIsEditingDisposisi] = useState(false);
  const [dispIndeks, setDispIndeks] = useState("");
  const [dispKode, setDispKode] = useState("");
  const [dispNomorSurat, setDispNomorSurat] = useState("");
  const [dispNoAgenda, setDispNoAgenda] = useState("");
  const [dispDiteruskan, setDispDiteruskan] = useState<string[]>([]);
  const [dispHarap, setDispHarap] = useState<string[]>([]);
  const [dispCatatan, setDispCatatan] = useState("");
  const [dispNamaPimpinan, setDispNamaPimpinan] = useState("");
  const [dispNipPimpinan, setDispNipPimpinan] = useState("");
  const [dispStatus, setDispStatus] = useState("");

  // Recall / Re-disposisi states
  const [showRecallForm, setShowRecallForm] = useState(false);
  const [recallNote, setRecallNote] = useState("");
  const [recallTargetStatus, setRecallTargetStatus] = useState("Menunggu_Validasi");
  const [recallsList, setRecallsList] = useState<any[]>([]);

  const [activeRole, setActiveRole] = useState(() => localStorage.getItem("activeRole") || "Administrator");
  const [timTeknisUsers, setTimTeknisUsers] = useState<any[]>([]);
  const [petugasSurveyUsers, setPetugasSurveyUsers] = useState<any[]>([]);

  useEffect(() => {
    apiFetch("/api/users")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTimTeknisUsers(data.filter(u => u.role === "Tim_Teknis"));
          setPetugasSurveyUsers(data.filter(u => u.role === "Petugas_Survey"));
        }
      }).catch(err => console.error("Failed to fetch users", err));
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      setActiveRole(localStorage.getItem("activeRole") || "Administrator");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const tabs = STATUS_TABS;

  const filteredAssessments = activeTab === 'Semua' 
    ? assessments 
    : assessments.filter(a => (a.status || 'Menunggu_Validasi') === activeTab);

  useEffect(() => {
    apiFetch("/api/assessments")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAssessments(data);
          const autoSelectId = (location.state as any)?.assessmentId;
          if (autoSelectId) {
            const found = data.find(a => a.id === autoSelectId);
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
      
    apiFetch("/api/pengaturan-surat")
      .then(res => res.json())
      .then(data => setLetterConfig(data))
      .catch(err => console.error("Failed to fetch pengaturan-surat", err));
      
    apiFetch("/api/document-templates")
      .then(res => res.json())
      .then((templates: any[]) => {
        const surat = templates.find((t: any) => t.id === 'surat_hasil_perhitungan');
        if (surat) {
          setSuratHasilTemplate(surat.kontenHtml);
          setSuratHasilDriveLink(surat.driveLink || "");
        }
        const disposisi = templates.find((t: any) => t.id === 'lembar_disposisi');
        if (disposisi) {
          setLembarDisposisiTemplate(disposisi.kontenHtml);
          setLembarDisposisiDriveLink(disposisi.driveLink || "");
        }
        const lampiran = templates.find((t: any) => t.id === 'lampiran_perhitungan');
        if (lampiran) {
          setLampiranExcelDriveLink(lampiran.driveLink || "");
        }
      })
      .catch(err => console.error("Failed to fetch templates", err));
  }, [location.state]);

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

      // Parse and load disposisiData
      let initialData: any = {};
      if (selectedAssessment.disposisiData) {
        try {
          initialData = typeof selectedAssessment.disposisiData === "string" 
            ? JSON.parse(selectedAssessment.disposisiData) 
            : selectedAssessment.disposisiData;
        } catch (e) {
          console.error("Failed to parse disposisiData", e);
        }
      }
      setDispIndeks(initialData.indeks || "045.2 / Pmb-Gdg");
      setDispKode(initialData.kode || "B.1");
      setDispNomorSurat(initialData.nomorSurat || `PUPR/B-0${selectedAssessment.id.substring(0, 3)}/2026`);
      setDispNoAgenda(initialData.noAgenda || `AGD-${selectedAssessment.id.substring(0, 5).toUpperCase()}`);
      setDispDiteruskan(initialData.diteruskan || (activeRole === "Koordinator" ? ["Tim Teknis Penilai"] : ["Kepala Bidang Bangunan"]));
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
      setDispStatus(selectedAssessment.status || "Menunggu_Validasi");
      setRecallsList(initialData.recalls || []);
      setRecallTargetStatus(selectedAssessment.status || "Menunggu_Validasi");
    } else {
      setDispositionLogs([]);
    }
  }, [selectedAssessment, selectedAssessment?.status, letterConfig]);

  const openDialog = (state: NonNullable<typeof dialogState>) => {
    setDialogInputValue(state.inputValue ?? "");
    setDialogState(state);
  };

  const closeDialog = () => {
    setDialogState(null);
    setDialogInputValue("");
  };

  const handleSaveDisposisi = async () => {
    if (!selectedAssessment) return;
    
    const payload = {
      indeks: dispIndeks,
      kode: dispKode,
      nomorSurat: dispNomorSurat,
      noAgenda: dispNoAgenda,
      diteruskan: dispDiteruskan,
      harap: dispHarap,
      catatan: dispCatatan,
      namaPimpinan: dispNamaPimpinan,
      nipPimpinan: dispNipPimpinan
    };

    try {
      const res = await apiFetch(`/api/assessments/${selectedAssessment.id}/disposisi`, {
        method: "PUT",
        headers: getAuditHeaders(),
        body: JSON.stringify({
          disposisiData: payload,
          status: dispStatus
        })
      });

      if (res.ok) {
        // Update local assessments state
        setAssessments(prev => prev.map(a => {
          if (a.id === selectedAssessment.id) {
            return {
              ...a,
              status: dispStatus,
              disposisiData: JSON.stringify(payload)
            };
          }
          return a;
        }));

        // Update selected assessment state
        setSelectedAssessment(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: dispStatus,
            disposisiData: JSON.stringify(payload)
          };
        });

        setIsEditingDisposisi(false);
        openDialog({
          type: "info",
          title: "Disposisi berhasil disimpan",
          description: "Data disposisi berhasil disimpan dan status telah diperbarui."
        });
      } else {
        openDialog({
          type: "info",
          title: "Gagal menyimpan disposisi",
          description: "Tidak dapat menyimpan disposisi saat ini."
        });
      }
    } catch (err) {
      console.error(err);
      openDialog({
        type: "info",
        title: "Kesalahan jaringan",
        description: "Terjadi kesalahan jaringan saat menyimpan disposisi."
      });
    }
  };

  const handleConfirmRecall = async () => {
    if (!selectedAssessment) return;
    
    const isAuthorized = activeRole === "Kadis" || activeRole === "Kabid";
    if (!isAuthorized) {
      openDialog({
        type: "info",
        title: "Akses ditolak",
        description: "Hanya Kepala Dinas (Kadis) atau Kepala Bidang (Kabid) yang berwenang melakukan Recall / Re-disposisi."
      });
      return;
    }

    if (!recallNote.trim()) {
      openDialog({
        type: "info",
        title: "Catatan belum lengkap",
        description: "Harap masukkan catatan justifikasi recall / re-disposisi."
      });
      return;
    }

    let parsedPayload: any = {};
    if (selectedAssessment.disposisiData) {
      try {
        parsedPayload = typeof selectedAssessment.disposisiData === "string"
          ? JSON.parse(selectedAssessment.disposisiData)
          : selectedAssessment.disposisiData;
      } catch (e) {
        console.error("Failed to parse existing disposisiData", e);
      }
    }

    const roleNameFormatted = activeRole === "Kadis" 
      ? "Kepala Dinas (Kadis)" 
      : "Kepala Bidang (Kabid)";

    const newRecallEntry = {
      date: new Date().toISOString(),
      fromStatus: selectedAssessment.status || "Menunggu_Validasi",
      toStatus: recallTargetStatus,
      note: recallNote.trim(),
      user: `${roleNameFormatted} Bidang Bangunan`
    };

    const updatedRecalls = [...(parsedPayload.recalls || []), newRecallEntry];
    
    // Merge new recall logs into disposisiData
    const payload = {
      ...parsedPayload,
      recalls: updatedRecalls
    };

    try {
      const res = await apiFetch(`/api/assessments/${selectedAssessment.id}/disposisi`, {
        method: "PUT",
        headers: getAuditHeaders(),
        body: JSON.stringify({
          disposisiData: payload,
          status: recallTargetStatus
        })
      });

      if (res.ok) {
        // Update local assessments state
        setAssessments(prev => prev.map(a => {
          if (a.id === selectedAssessment.id) {
            return {
              ...a,
              status: recallTargetStatus,
              disposisiData: JSON.stringify(payload)
            };
          }
          return a;
        }));

        // Update selected assessment state
        setSelectedAssessment(prev => {
          if (!prev) return null;
          return {
            ...prev,
            status: recallTargetStatus,
            disposisiData: JSON.stringify(payload)
          };
        });

        setRecallsList(updatedRecalls);
        setShowRecallForm(false);
        setRecallNote("");
        openDialog({
          type: "info",
          title: "Recall berhasil",
          description: "Recall / Re-disposisi berhasil dijalankan. Status ditarik kembali dan tercatat di riwayat."
        });
      } else {
        openDialog({
          type: "info",
          title: "Gagal memproses",
          description: "Gagal memproses recall / re-disposisi."
        });
      }
    } catch (err) {
      console.error(err);
      openDialog({
        type: "info",
        title: "Kesalahan jaringan",
        description: "Terjadi kesalahan jaringan saat memproses recall."
      });
    }
  };

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
        const schedule = promptSurveyScheduleTimes();
        if (!schedule) return;
        
        const summary = `Survei Lapangan: ${assessment.schoolName} - ${assessment.buildingName}`;
        const description = `Alamat: ${assessment.address}\n\nMohon lakukan pengecekan lapangan untuk memverifikasi laporan kerusakan.`;
        
        const link = await createCalendarEvent(summary, description, schedule.startTime, schedule.endTime);
        openDialog({
          type: "info",
          title: "Jadwal survei dibuat",
          description: `Jadwal survei lapangan berhasil dibuat. Lihat di Google Calendar: ${link}`
        });
    } catch (err) {
        console.error("Failed to schedule", err);
        openDialog({
          type: "info",
          title: "Gagal membuat jadwal",
          description: "Gagal membuat jadwal survei lapangan."
        });
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
    
    openDialog({
      type: "prompt",
      title: "Arsip ke Spreadsheet",
      description: "Masukkan Spreadsheet ID untuk menyimpan arsip. Biarkan kosong untuk membuat Spreadsheet baru.",
      inputLabel: "Spreadsheet ID",
      inputValue: "",
      onConfirm: async (value) => {
        try {
          let targetId = (value || "").trim();
          if (!targetId) {
            const { createSpreadsheet } = await import("../lib/sheetsService");
            targetId = await createSpreadsheet("Arsip Penilaian SI-PEKA");
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
          openDialog({
            type: "info",
            title: "Arsip berhasil dibuat",
            description: `Data berhasil diarsipkan ke Spreadsheet (ID: ${targetId}).`
          });
        } catch (err) {
          console.error("Failed to archive", err);
          openDialog({
            type: "info",
            title: "Gagal mengarsipkan",
            description: "Tidak dapat mengarsipkan data ke Spreadsheet."
          });
        }
      }
    });
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const assessment = row.original;
        return (
          <span className={cn(
            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
            getStatusBadgeClasses(assessment.status)
          )}>
            {formatStatusText(assessment.status)}
          </span>
        );
      }
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedAssessment(row.original)}
          className="text-xs bg-pu-blue hover:bg-pu-dark text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Eye className="w-3.5 h-3.5" />
          Lihat
        </button>
      ),
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
            <h2 className="text-lg font-bold text-slate-800">Manajemen Disposisi</h2>
            <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pantau dan kelola surat disposisi pimpinan</p>
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
      <DisposisiDetailModal
        selectedAssessment={selectedAssessment}
        setSelectedAssessment={setSelectedAssessment}
        activeRole={activeRole}
        handleScheduleSurvei={handleScheduleSurvei}
        loadingLogs={loadingLogs}
        dispositionLogs={dispositionLogs}
        setSmartPreviewPhoto={setSmartPreviewPhoto}
        lembarDisposisiTemplate={lembarDisposisiTemplate}
        dinasConfig={dinasConfig}
        dispNoAgenda={dispNoAgenda}
        dispCatatan={dispCatatan}
        lembarDisposisiDriveLink={lembarDisposisiDriveLink}
        isEditingDisposisi={isEditingDisposisi}
        setIsEditingDisposisi={setIsEditingDisposisi}
        dispIndeks={dispIndeks}
        setDispIndeks={setDispIndeks}
        dispKode={dispKode}
        setDispKode={setDispKode}
        dispNomorSurat={dispNomorSurat}
        setDispNomorSurat={setDispNomorSurat}
        setDispNoAgenda={setDispNoAgenda}
        dispDiteruskan={dispDiteruskan}
        setDispDiteruskan={setDispDiteruskan}
        dispHarap={dispHarap}
        setDispHarap={setDispHarap}
        setDispCatatan={setDispCatatan}
        dispNamaPimpinan={dispNamaPimpinan}
        setDispNamaPimpinan={setDispNamaPimpinan}
        dispNipPimpinan={dispNipPimpinan}
        setDispNipPimpinan={setDispNipPimpinan}
        letterConfig={letterConfig}
        handleSaveDisposisi={handleSaveDisposisi}
        exportAssessmentToPdf={exportAssessmentToPdf}
        appConfig={appConfig}
        suratHasilTemplate={suratHasilTemplate}
        suratHasilDriveLink={suratHasilDriveLink}
        lampiranExcelDriveLink={lampiranExcelDriveLink}
        showRecallForm={showRecallForm}
        setShowRecallForm={setShowRecallForm}
        recallNote={recallNote}
        setRecallNote={setRecallNote}
        recallTargetStatus={recallTargetStatus}
        setRecallTargetStatus={setRecallTargetStatus}
        recallsList={recallsList}
        handleConfirmRecall={handleConfirmRecall}
        assessments={assessments}
        setAssessments={setAssessments}
        setDispStatus={setDispStatus}
        timTeknisUsers={timTeknisUsers}
        petugasSurveyUsers={petugasSurveyUsers}
      />

      {dialogState && (
        <ActionDialog
          isOpen={true}
          onClose={closeDialog}
          title={dialogState.title}
          description={dialogState.description}
          variant={dialogState.type === "info" ? "info" : dialogState.type === "prompt" ? "prompt" : "confirm"}
          inputLabel={dialogState.inputLabel}
          inputValue={dialogInputValue}
          onInputChange={(value) => setDialogInputValue(value)}
          onConfirm={() => {
            if (dialogState.onConfirm) {
              void dialogState.onConfirm(dialogInputValue);
            }
            if (dialogState.type !== "prompt") {
              closeDialog();
            }
          }}
          confirmLabel={dialogState.type === "prompt" ? "Simpan" : dialogState.type === "confirm" ? "Lanjutkan" : "Tutup"}
          cancelLabel={dialogState.type === "info" ? "Tutup" : "Batal"}
        />
      )}

      {/* Lightbox Modal */}
      {smartPreviewPhoto && (
        <SmartPhotoViewer 
          photoUrl={smartPreviewPhoto} 
          fileName={smartPreviewPhoto.split('/').pop() || "Dokumentasi Bangunan"}
          onClose={() => setSmartPreviewPhoto(null)}
        />
      )}
    </motion.div>
  );
}
