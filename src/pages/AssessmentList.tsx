import { apiFetch } from "../lib/api";
import { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { Assessment, COMPONENT_WEIGHTS_1_LANTAI, COMPONENT_WEIGHTS_2_LANTAI, COMPONENT_WEIGHTS_3_LANTAI, DAMAGE_MULTIPLIERS } from "../types";
import EditAssessmentModal from "../components/assessment/EditAssessmentModal";
import AssessmentDetailModal from "../components/assessment/AssessmentDetailModal";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { getAuditHeaders, getDirectImageUrl, parsePhotos, cn } from "../lib/utils";
import { DataTable } from "../components/ui/DataTable";
import { ColumnDef } from "@tanstack/react-table";
import { createCalendarEvent } from "../lib/calendarService";
import { appendToSheet } from "../lib/sheetsService";
import { getAccessToken, googleSignIn } from "../lib/firebaseAuth";
import { motion, AnimatePresence } from "motion/react";
import SmartPhotoViewer from '../components/SmartPhotoViewer';
import DocumentPreviewModal from "../components/DocumentPreviewModal";
import { 
  Eye, Clock, Calendar, Building, MapPin, FileText, 
  CheckCircle2, User, Loader2, ArrowRight, ExternalLink, X, HelpCircle, Edit, Trash2, PlusCircle,
  Search, Filter, ArrowUpDown, SlidersHorizontal, RefreshCw
} from "lucide-react";
import { STATUS_TABS, STATUS_OPTIONS, getStatusBadgeClasses, formatStatusText } from "../lib/statusUtils";

export default function AssessmentList() {
  const location = useLocation();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Semua");
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null | undefined>(null);
  
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [editForm, setEditForm] = useState({
    schoolName: '',
    buildingName: '',
    buildingArea: 0,
    floorCount: 1
  });

  const [dispositionLogs, setDispositionLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Search & advanced filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("Semua");
  const [categoryFilter, setCategoryFilter] = useState("Semua");
  const [sortBy, setSortBy] = useState("terbaru");

  const activeRole = localStorage.getItem("activeRole") || "Administrator";

  // Bulk action states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("Menunggu_Validasi");
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false);
  const [smartPreviewPhoto, setSmartPreviewPhoto] = useState<string | null>(null);

  const isAuthorizedForBulk = activeRole === "Kadis" || activeRole === "Kabid" || activeRole === "Koordinator" || activeRole === "Tim_Teknis" || activeRole === "Administrator";

  const handleBulkStatusUpdate = async () => {
    if (selectedIds.length === 0) return;
    setIsUpdatingBulk(true);
    try {
      const res = await apiFetch("/api/assessments/bulk-status", {
        method: "PUT",
        headers: getAuditHeaders(),
        body: JSON.stringify({
          ids: selectedIds,
          status: bulkStatus
        })
      });

      if (res.ok) {
        setAssessments(prev => prev.map(a => 
          selectedIds.includes(a.id) ? { ...a, status: bulkStatus } : a
        ));
        setSelectedIds([]);
        alert(`Berhasil memperbarui status ${selectedIds.length} permohonan ke "${bulkStatus.replace('_', ' ')}"!`);
      } else {
        const errData = await res.json();
        alert(`Gagal memperbarui status secara masal: ${errData.error || "Kesalahan server"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Kesalahan jaringan saat melakukan pembaruan masal.");
    } finally {
      setIsUpdatingBulk(false);
    }
  };

  const tabs = STATUS_TABS;

  const activeUserId = localStorage.getItem("activeUserId");

  const handleStatusFilterChange = (status: string) => {
    setActiveTab(status);
  };

  const roleFilteredAssessments = (activeRole === "Pengelola_Bangunan" && activeUserId)
    ? assessments.filter(a => String(a.idUserPengelola) === activeUserId)
    : assessments;

  const filteredAssessments = roleFilteredAssessments.filter(a => {
    // 1. Status Filter (Sync with Tabs & Status Dropdown)
    const currentStatus = a.status || 'Menunggu_Validasi';
    if (activeTab !== 'Semua' && currentStatus !== activeTab) {
      return false;
    }

    // 2. Category Filter
    if (categoryFilter !== 'Semua' && a.finalResult?.category !== categoryFilter) {
      return false;
    }

    // 3. Date Filter
    if (dateFilter !== 'Semua' && a.date) {
      const itemDate = new Date(a.date);
      const now = new Date();
      if (dateFilter === 'Hari_Ini') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (itemDate < today) return false;
      } else if (dateFilter === '7_Hari') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        if (itemDate < sevenDaysAgo) return false;
      } else if (dateFilter === 'Bulan_Ini') {
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        if (itemDate < firstDayOfMonth) return false;
      }
    }

    // 4. Smart Search Query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const schoolMatch = a.schoolName?.toLowerCase().includes(q);
      const buildingMatch = a.buildingName?.toLowerCase().includes(q);
      const npsnMatch = a.npsn?.toLowerCase().includes(q);
      const addressMatch = a.address?.toLowerCase().includes(q);
      const categoryMatch = `rusak ${a.finalResult?.category?.toLowerCase()}`.includes(q) || a.finalResult?.category?.toLowerCase().includes(q);
      
      if (!schoolMatch && !buildingMatch && !npsnMatch && !addressMatch && !categoryMatch) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'terbaru') {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === 'terlama') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortBy === 'kerusakan_tinggi') {
      return (b.finalResult?.totalDamagePercentage || 0) - (a.finalResult?.totalDamagePercentage || 0);
    } else if (sortBy === 'kerusakan_rendah') {
      return (a.finalResult?.totalDamagePercentage || 0) - (b.finalResult?.totalDamagePercentage || 0);
    }
    return 0;
  });

  const loadAssessments = () => {
    setLoading(true);
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
  };

  useEffect(() => {
    loadAssessments();
    
    window.addEventListener("assessments-synced", loadAssessments);
    return () => {
      window.removeEventListener("assessments-synced", loadAssessments);
    };
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

  const handleGenerateAnalysisFormat = async (assessment: Assessment) => {
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
        const spreadsheetId = prompt("Masukkan Spreadsheet ID (kosongkan untuk membuat Spreadsheet baru):");
        let targetId = spreadsheetId;
        
        if (!targetId) {
            alert("Membuat format spreadsheet baru...");
            const { createSpreadsheet } = await import("../lib/sheetsService");
            targetId = await createSpreadsheet(`Format Analisis PUPR - ${assessment.schoolName}`);
        }

        const floorCount = assessment.floorCount || 1;
        let componentsConfig: any[] = [];
        try {
          const res = await apiFetch("/api/components");
          componentsConfig = await res.json();
        } catch (error) {
          console.error("Failed to fetch components config for spreadsheet", error);
        }

        let weights: Record<string, number> = {};
        let systemMap: Record<string, string> = {};
        let unitMap: Record<string, string> = {};

        if (Array.isArray(componentsConfig) && componentsConfig.length > 0) {
          componentsConfig.forEach((c: any) => {
            systemMap[c.namaKomponen] = (c.kategoriKomponen || "STRUKTUR").toUpperCase();
            unitMap[c.namaKomponen] = c.satuan || "%";
            let weightStr = floorCount === 1 ? c.bobotFormA : floorCount === 2 ? c.bobotFormB : c.bobotFormC;
            weights[c.namaKomponen] = parseFloat(weightStr || "0");
          });
        } else {
          weights = floorCount === 2 
            ? COMPONENT_WEIGHTS_2_LANTAI 
            : floorCount >= 3 
              ? COMPONENT_WEIGHTS_3_LANTAI 
              : COMPONENT_WEIGHTS_1_LANTAI;

          systemMap = {
            "Pondasi & Sloof": "STRUKTUR",
            "Kolom": "STRUKTUR",
            "Balok": "STRUKTUR",
            "Plat Lantai": "STRUKTUR",
            "Tangga": "STRUKTUR",
            "Atap": "STRUKTUR",
            "Dinding / Partisi": "ARSITEKTUR",
            "Plafond": "ARSITEKTUR",
            "Lantai": "ARSITEKTUR",
            "Kusen": "ARSITEKTUR",
            "Pintu": "ARSITEKTUR",
            "Jendela": "ARSITEKTUR",
            "Finishing Plafond": "ARSITEKTUR",
            "Finishing Dinding": "ARSITEKTUR",
            "Finishing Kusen & Pintu": "ARSITEKTUR",
            "Instalasi Listrik": "UTILITAS",
            "Instalasi Air Bersih": "UTILITAS",
            "Drainase Limbah": "UTILITAS"
          };

          unitMap = {
            "Pondasi & Sloof": "Estimasi",
            "Kolom": "unit",
            "Balok": "unit",
            "Plat Lantai": "unit",
            "Tangga": "unit",
            "Atap": "%",
            "Dinding / Partisi": "%",
            "Plafond": "%",
            "Lantai": "%",
            "Kusen": "unit",
            "Pintu": "unit",
            "Jendela": "unit",
            "Finishing Plafond": "%",
            "Finishing Dinding": "%",
            "Finishing Kusen & Pintu": "%",
            "Instalasi Listrik": "Estimasi",
            "Instalasi Air Bersih": "Estimasi",
            "Drainase Limbah": "m1"
          };
        }

        const headerRows = [
            ["FORMULIR PENILAIAN KERUSAKAN BANGUNAN (FORMAT ANALISIS PUPR)"],
            [""],
            ["Nama Sekolah/Instansi", ":", assessment.schoolName],
            ["NPSN", ":", assessment.npsn || "-"],
            ["Nama Bangunan", ":", assessment.buildingName],
            ["NUP (No Urut Perolehan)", ":", assessment.nup || "-"],
            ["Alamat", ":", assessment.address],
            ["Kabupaten/Kota", ":", assessment.city || "Garut", "", "Provinsi", ":", assessment.province || "Jawa Barat"],
            ["Luas Bangunan", ":", `${assessment.buildingArea} m²`],
            ["Jumlah Lantai", ":", `${floorCount} Lantai (Tipe ${floorCount === 1 ? 'A' : floorCount === 2 ? 'B' : 'C'})`],
            [""],
            ["NO", "SISTEM", "KOMPONEN", "SATUAN", "Tdk Rusak", "Sangat Ringan", "Ringan", "Sedang", "Berat", "Sangat Berat", "Tidak Sesuai", "TOTAL TINGKAT KERUSAKAN (%)", "BOBOT KOMPONEN (%)", "NILAI KERUSAKAN THD MASSA (%)"]
        ];

        let index = 1;
        const componentRows = Object.keys(weights).map(name => {
          const weight = weights[name];
          const compData = assessment.components?.find(c => c.name === name);
          
          const getDetailPct = (lvl: string) => {
            if (!compData) return 0;
            const detail = compData.damageDetails?.find(d => d.level === lvl);
            return detail ? (detail.percentage || 0) : 0;
          };

          const sangatRingan = getDetailPct("Rusak Sangat Ringan");
          const ringan = getDetailPct("Rusak Ringan");
          const sedang = getDetailPct("Rusak Sedang");
          const berat = getDetailPct("Rusak Berat");
          const sangatBerat = getDetailPct("Rusak Sangat Berat");
          const tdkSesuai = getDetailPct("Komponen Tidak Sesuai");

          const isMultipleChoice = compData?.unit === 'Estimasi';

          const formatVal = (val: number) => {
            if (isMultipleChoice) {
              return val > 0 ? "1" : "0,00";
            }
            return `${val.toFixed(2)}%`;
          };
          
          let componentDamageFraction = 0;
          compData?.damageDetails?.forEach(detail => {
            const multiplier = DAMAGE_MULTIPLIERS[detail.level] || 0;
            const volumeFraction = (detail.percentage || 0) / 100;
            componentDamageFraction += volumeFraction * multiplier;
          });
          componentDamageFraction = Math.min(componentDamageFraction, 1.0);
          const totalCompDamagePct = componentDamageFraction * 100;
          
          // For regular components, tdkRusak is remainder. For multiple choice, read it directly.
          const tdkRusak = isMultipleChoice ? getDetailPct("Tidak Rusak") : Math.max(0, 100 - totalCompDamagePct);
          const nilaiKerusakanThdMassa = componentDamageFraction * weight;

          return [
            index++,
            systemMap[name] || "STRUKTUR",
            name,
            compData?.unit || unitMap[name] || "%",
            formatVal(tdkRusak),
            formatVal(sangatRingan),
            formatVal(ringan),
            formatVal(sedang),
            formatVal(berat),
            formatVal(sangatBerat),
            formatVal(tdkSesuai),
            `${totalCompDamagePct.toFixed(2)}%`,
            `${weight.toFixed(2)}%`,
            `${nilaiKerusakanThdMassa.toFixed(2)}%`
          ];
        });

        const totalDamage = assessment.finalResult?.totalDamagePercentage || 0;
        const category = assessment.finalResult?.category || "Ringan";

        const footerRows = [
          [""],
          ["TOTAL NILAI KERUSAKAN MASSA BANGUNAN / RUANGAN =", "", "", "", "", "", "", "", "", "", "", "", "100.00%", `${totalDamage.toFixed(2)}%`],
          ["KESIMPULAN TINGKAT KERUSAKAN MASSA BANGUNAN / RUANGAN =", "", "", "", "", "", "", "", "", "", "", "", "", `Rusak ${category}`],
          [""],
          ["Kriteria Tingkat Kerusakan:"],
          ["- Ringan: <= 30.00%"],
          ["- Sedang: > 30.00% s.d 45.00%"],
          ["- Berat: > 45.00%"],
          [""],
          ["TIM SURVEI LAPANGAN :"],
          ["1. Enjang Wahyudin, ST", "NIP 199112182019031011", "", "", "Tanda Tangan: ......................................."],
          ["2. Haris Nugraha", "NIP 197703292025211012", "", "", "Tanda Tangan: ......................................."],
          ["3. Nendi Supriadi", "NIP 198302022025211069", "", "", "Tanda Tangan: ......................................."]
        ];

        const allValues = [
          ...headerRows,
          ...componentRows,
          ...footerRows
        ];
        
        await appendToSheet(targetId as string, "Sheet1!A1", allValues);
        alert(`Format Analisis (Tipe ${floorCount === 1 ? 'A' : floorCount === 2 ? 'B' : 'C'}) berhasil disiapkan di Spreadsheet.\nBuka di: https://docs.google.com/spreadsheets/d/${targetId}`);
    } catch (err) {
        console.error("Failed to generate format", err);
        alert("Gagal membuat format analisis.");
    }
  };

  const handleGenerateSuratJawaban = async (assessment: Assessment) => {
    alert(`Draft Surat Jawaban (Doc) untuk ${assessment.schoolName} berhasil dibuat!\nDokumen telah tersimpan di sistem arsip digital bidang bangunan.`);
  };

  const updateStatus = (assessment: Assessment, newStatus: string) => {
    setAssessments(assessments.map(a => a.id === assessment.id ? { ...a, status: newStatus } : a));
    if (selectedAssessment && selectedAssessment.id === assessment.id) {
      setSelectedAssessment(prev => prev ? { ...prev, status: newStatus } : null);
    }
    apiFetch(`/api/assessments/${assessment.id}/status`, {
      method: "PUT",
      headers: getAuditHeaders(),
      body: JSON.stringify({ status: newStatus })
    }).catch(err => {
      console.error(err);
      alert("Gagal memperbarui status");
    });
  };

  const handleDeleteAssessment = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus permohonan ini secara permanen?")) return;
    try {
      const res = await apiFetch(`/api/assessments/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAssessments(assessments.filter(a => a.id !== id));
        alert("Permohonan berhasil dihapus");
      } else {
        alert("Gagal menghapus permohonan");
      }
    } catch (error) {
      console.error(error);
      alert("Gagal menghapus permohonan");
    }
  };

  const handleEditSave = async () => {
    if (!editingAssessment) return;
    try {
      const res = await apiFetch(`/api/assessments/${editingAssessment.id}`, {
        method: "PUT",
        headers: getAuditHeaders(),
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setAssessments(assessments.map(a => 
          a.id === editingAssessment.id 
            ? { 
                ...a, 
                schoolName: editForm.schoolName, 
                buildingName: editForm.buildingName,
                buildingArea: editForm.buildingArea,
                floorCount: editForm.floorCount
              } 
            : a
        ));
        setEditingAssessment(null);
        alert("Permohonan berhasil diperbarui");
      } else {
        alert("Gagal memperbarui permohonan");
      }
    } catch (error) {
      console.error(error);
      alert("Gagal memperbarui permohonan");
    }
  };


  const columns: ColumnDef<Assessment>[] = [
    ...(isAuthorizedForBulk ? [{
      id: "select",
      header: ({ table }: any) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => {
            table.toggleAllPageRowsSelected(!!e.target.checked);
            const allIds = table.getRowModel().rows.map((row: any) => row.original.id);
            if (e.target.checked) {
              setSelectedIds(allIds);
            } else {
              setSelectedIds([]);
            }
          }}
          className="rounded border-slate-300 text-pu-blue focus:ring-pu-blue h-4 w-4 cursor-pointer"
        />
      ),
      cell: ({ row }: any) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.original.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds([...selectedIds, row.original.id]);
            } else {
              setSelectedIds(selectedIds.filter((id: string) => id !== row.original.id));
            }
          }}
          className="rounded border-slate-300 text-pu-blue focus:ring-pu-blue h-4 w-4 cursor-pointer"
        />
      ),
    }] : []),
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
        if (activeRole === "Pengelola_Bangunan") {
          return (
            <span className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
              getStatusBadgeClasses(assessment.status)
            )}>
              {formatStatusText(assessment.status)}
            </span>
          );
        }
        return (
          <select 
            value={assessment.status || 'Menunggu_Validasi'} 
            onChange={(e) => {
              const newStatus = e.target.value;
              setAssessments(assessments.map(a => a.id === assessment.id ? { ...a, status: newStatus } : a));
              if (selectedAssessment && selectedAssessment.id === assessment.id) {
                setSelectedAssessment(prev => prev ? { ...prev, status: newStatus } : null);
              }
              apiFetch(`/api/assessments/${assessment.id}/status`, {
                method: "PUT",
                headers: getAuditHeaders(),
                body: JSON.stringify({ status: newStatus })
              }).catch(err => {
                console.error(err);
                alert("Gagal memperbarui status");
              });
            }}
            className="text-xs border border-slate-200/50 rounded-md focus:ring-pu-blue focus:border-pu-blue shadow-sm bg-white/70 backdrop-blur-sm"
          >
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
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
              className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/60 px-2 py-1.5 rounded-lg transition-colors"
            >
              <Eye className="w-3 h-3 mr-1" />
              Detail
            </button>
            {activeRole === "Tim_Teknis" && assessment.status === "Survei_Lapangan" && (
              <Link 
                to={`/new?edit=${assessment.id}`}
                className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-orange-600 hover:text-white bg-orange-50 hover:bg-orange-500 border border-orange-200/60 px-2 py-1.5 rounded-lg transition-colors"
              >
                <Edit className="w-3 h-3 mr-1" />
                Isi Survei
              </Link>
            )}
            <button onClick={() => handleScheduleSurvei(assessment)} className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1.5 rounded transition-colors">Jadwal</button>
            <button onClick={() => handleArchiveToSheets(assessment)} className="text-[10px] font-bold uppercase tracking-widest text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1.5 rounded transition-colors">Arsip</button>
            {activeRole === "Administrator" && (
              <>
                <button 
                  onClick={() => {
                    setEditingAssessment(assessment);
                    setEditForm({
                      schoolName: assessment.schoolName,
                      buildingName: assessment.buildingName,
                      buildingArea: assessment.buildingArea,
                      floorCount: assessment.floorCount || 1
                    });
                  }} 
                  className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:text-amber-800 hover:bg-amber-50 border border-amber-200/60 px-2 py-1.5 rounded-lg transition-colors"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </button>
                <button 
                  onClick={() => handleDeleteAssessment(assessment.id)} 
                  className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200/60 px-2 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Hapus
                </button>
              </>
            )}
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
            <h2 className="text-lg font-bold text-slate-800">Daftar Penilaian</h2>
            <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rekapitulasi seluruh penilaian kerusakan bangunan</p>
          </div>
          {(activeRole === "Administrator" || activeRole === "Pengelola_Bangunan") && (
            <Link 
              to="/new" 
              className="inline-flex items-center gap-2 bg-pu-blue text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-blue-800 transition-colors shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Tambah Penilaian
            </Link>
          )}
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

        {/* Smart Search & Filter Dropdowns Section */}
        <div className="p-6 bg-white/10 backdrop-blur-sm border-b border-white/30 space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                id="assessment-search-bar"
                type="text"
                placeholder="Cari berdasarkan sekolah, bangunan, NPSN, atau tingkat kerusakan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-200 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-pu-blue focus:border-transparent transition-all shadow-sm placeholder:text-slate-400 text-slate-700 font-medium"
              />
              {searchQuery && (
                <button
                  id="clear-search-button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Reset Button if there are active filters */}
            {(searchQuery || dateFilter !== "Semua" || categoryFilter !== "Semua" || activeTab !== "Semua" || sortBy !== "terbaru") && (
              <motion.button
                id="reset-filters-button"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => {
                  setSearchQuery("");
                  setDateFilter("Semua");
                  setCategoryFilter("Semua");
                  setActiveTab("Semua");
                  setSortBy("terbaru");
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Atur Ulang Filter
              </motion.button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Filter by Status */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Status Disposisi</label>
              <div className="relative">
                <select
                  id="status-filter-dropdown"
                  value={activeTab}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="w-full py-2 pl-3 pr-8 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pu-blue shadow-sm appearance-none cursor-pointer"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Menunggu_Validasi">Menunggu Validasi</option>
                  <option value="Survei_Lapangan">Survei Lapangan</option>
                  <option value="Selesai_Dianalisis">Selesai Dianalisis</option>
                  <option value="Arsip_Digital">Arsip Digital</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                  <SlidersHorizontal className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Filter by Date */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Waktu Permohonan</label>
              <div className="relative">
                <select
                  id="date-filter-dropdown"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full py-2 pl-3 pr-8 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pu-blue shadow-sm appearance-none cursor-pointer"
                >
                  <option value="Semua">Semua Waktu</option>
                  <option value="Hari_Ini">Hari Ini</option>
                  <option value="7_Hari">7 Hari Terakhir</option>
                  <option value="Bulan_Ini">Bulan Ini</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                  <Calendar className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Filter by Category */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Kategori Kerusakan</label>
              <div className="relative">
                <select
                  id="category-filter-dropdown"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full py-2 pl-3 pr-8 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pu-blue shadow-sm appearance-none cursor-pointer"
                >
                  <option value="Semua">Semua Kategori</option>
                  <option value="Ringan">Rusak Ringan</option>
                  <option value="Sedang">Rusak Sedang</option>
                  <option value="Berat">Rusak Berat</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                  <Filter className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Sort by */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">Urutan Data</label>
              <div className="relative">
                <select
                  id="sort-by-dropdown"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full py-2 pl-3 pr-8 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-pu-blue shadow-sm appearance-none cursor-pointer"
                >
                  <option value="terbaru">Terbaru</option>
                  <option value="terlama">Terlama</option>
                  <option value="kerusakan_tinggi">Kerusakan Tertinggi</option>
                  <option value="kerusakan_rendah">Kerusakan Terendah</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-16 flex justify-center">
            <div className="w-8 h-8 border-4 border-pu-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Bulk Action Panel */}
            <AnimatePresence>
              {isAuthorizedForBulk && selectedIds.length > 0 && (
                <motion.div
                  id="bulk-actions-banner"
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="mb-4 bg-gradient-to-r from-pu-blue/10 to-indigo-50/50 border border-pu-blue/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 overflow-hidden shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pu-blue text-white rounded-xl shadow-md shadow-pu-blue/10 animate-pulse">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Tindakan Masal ({selectedIds.length} Terpilih)
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Perbarui status permohonan yang dipilih secara bersamaan.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mr-1 md:hidden">
                      Status Baru:
                    </label>
                    <select
                      id="bulk-status-select"
                      value={bulkStatus}
                      onChange={(e) => setBulkStatus(e.target.value)}
                      className="text-xs py-2 px-3 border border-slate-200 rounded-xl focus:ring-pu-blue focus:border-pu-blue bg-white font-semibold text-slate-700 shadow-xs cursor-pointer min-w-[180px]"
                    >
                      <option value="Menunggu_Validasi">Menunggu Validasi</option>
                      <option value="Survei_Lapangan">Survei Lapangan</option>
                      <option value="Selesai_Dianalisis">Selesai Dianalisis</option>
                      <option value="Arsip_Digital">Arsip Digital</option>
                    </select>

                    <button
                      id="apply-bulk-status-button"
                      onClick={handleBulkStatusUpdate}
                      disabled={isUpdatingBulk}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-pu-blue hover:bg-pu-blue/90 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-pu-blue/15 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUpdatingBulk ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Terapkan Status
                        </>
                      )}
                    </button>

                    <button
                      id="cancel-bulk-selection-button"
                      onClick={() => setSelectedIds([])}
                      disabled={isUpdatingBulk}
                      className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Batal
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <DocumentPreviewModal 
              isOpen={!!previewUrl}
              onClose={() => setPreviewUrl(null)}
              documentUrl={previewUrl || null}
            />

            <div className="bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm">
              <DataTable columns={columns} data={filteredAssessments} />
            </div>

          </>
        )}
      </div>

      {/* Side Sheet Detail & Real-Time Timeline */}
      <AssessmentDetailModal
        selectedAssessment={selectedAssessment}
        setSelectedAssessment={setSelectedAssessment}
        activeRole={activeRole}
        updateStatus={updateStatus}
        handleScheduleSurvei={handleScheduleSurvei}
        handleGenerateAnalysisFormat={handleGenerateAnalysisFormat}
        handleGenerateSuratJawaban={handleGenerateSuratJawaban}
        setPreviewUrl={setPreviewUrl}
        loadingLogs={loadingLogs}
        dispositionLogs={dispositionLogs}
        setSmartPreviewPhoto={setSmartPreviewPhoto}
      />

      <EditAssessmentModal
        editingAssessment={editingAssessment}
        setEditingAssessment={setEditingAssessment}
        editForm={editForm}
        setEditForm={setEditForm}
        handleEditSave={handleEditSave}
      />

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
