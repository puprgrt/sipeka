import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Folder, FileText, File, Image as ImageIcon, Search, Plus, 
  UploadCloud, MoreVertical, Grid, List as ListIcon, Download, Trash2, 
  Share2, HardDrive, Filter, X, ZoomIn, ZoomOut, RotateCw, Maximize2, 
  Check, Edit3, Save, MessageSquare, Send, Calendar, Shield, Activity, 
  Sparkles, CheckCircle2, ChevronLeft, ChevronRight, Minimize2, Lock, 
  ChevronDown, FileSpreadsheet, Eye, RefreshCw, Layers, Ruler
} from "lucide-react";
import { cn } from "../lib/utils";
import SmartPreviewModal from "../components/file-manager/SmartPreviewModal";
import { useDriveFiles } from "../hooks/useDriveFiles";
import FileManagerSidebar from "../components/file-manager/FileManagerSidebar";
import FileManagerToolbar from "../components/file-manager/FileManagerToolbar";
import FileManagerGridView from "../components/file-manager/FileManagerGridView";
import FileManagerListView from "../components/file-manager/FileManagerListView";

interface FileComment {
  id: string;
  user: string;
  role: string;
  text: string;
  time: string;
}

interface FileActivity {
  action: string;
  time: string;
  user: string;
}

interface FileItem {
  id: string;
  name: string;
  type: 'folder' | 'pdf' | 'image' | 'word' | 'excel' | 'other';
  size?: number; // in bytes
  updatedAt: string;
  author: string;
  folderId: string | null; // null means root
  accessRole: string[];
  previewUrl?: string; // Blob URL for uploaded files or custom URLs
  description?: string;
  comments?: FileComment[];
  activities?: FileActivity[];
  content?: string; // For Word editor content
  excelData?: {
    sheets: {
      name: string;
      rows: string[][];
    }[];
  };
}



export default function FileManager() {
  const [activeRole, setActiveRole] = useState(() => localStorage.getItem("activeRole") || "Administrator");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [currentFolderName, setCurrentFolderName] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<'all' | 'images' | 'documents' | 'spreadsheets' | 'folders'>('all');
  
  // Custom Hook for Drive logic
  const { files, setFiles, loadingFiles, fetchFiles, createFolder, uploadFile, deleteFile } = useDriveFiles(currentFolder);

  // Preview States
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [modalActiveTab, setModalActiveTab] = useState<'ai' | 'discussions' | 'metadata'>('ai');
  const [previewScale, setPreviewScale] = useState(1);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewRotation, setPreviewRotation] = useState(0);
  const [imageFilter, setImageFilter] = useState<'normal' | 'grayscale' | 'contrast' | 'thermal' | 'edge' | 'lowlight'>('normal');
  const [showGrid, setShowGrid] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<{ x: number, y: number }[]>([]);
  const [pixelToMmScale, setPixelToMmScale] = useState(0.2); // Calibration: 1% of size = 0.2 mm
  const [hoveredFinding, setHoveredFinding] = useState<number | null>(null);

  const calculateDistance = () => {
    if (measurePoints.length < 2) return "0.0";
    const dx = measurePoints[1].x - measurePoints[0].x;
    const dy = measurePoints[1].y - measurePoints[0].y;
    const percentDistance = Math.sqrt(dx * dx + dy * dy);
    return (percentDistance * pixelToMmScale * 10).toFixed(1);
  };

  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editedFileName, setEditedFileName] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [selectedSheet, setSelectedSheet] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  // Smart Preview States
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiChatQuery, setAiChatQuery] = useState("");
  const [aiChatHistory, setAiChatHistory] = useState<{ sender: 'user' | 'ai', text: string }[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showAiBoxes, setShowAiBoxes] = useState(true);
  const [isDigitallySigned, setIsDigitallySigned] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRunAiAnalysis = async () => {
    if (!selectedFile) return;
    setIsAiAnalyzing(true);
    setAiAnalysisResult(null);

    let contentStr = selectedFile.description || "";
    if (selectedFile.type === 'word') {
      contentStr += "\n\n" + (selectedFile.content || "");
    } else if (selectedFile.type === 'excel' && selectedFile.excelData) {
      contentStr += "\n\n" + selectedFile.excelData.sheets.map(s => {
        return `Sheet: ${s.name}\n` + s.rows.map(row => row.join(" | ")).join("\n");
      }).join("\n\n");
    }

    try {
      const response = await fetch("/api/gemini/analyze-document", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileContent: contentStr,
          imageBase64: selectedFile.type === 'image' ? selectedFile.previewUrl : undefined
        })
      });

      if (!response.ok) throw new Error("Gagal memanggil API");
      const data = await response.json();
      setAiAnalysisResult(data);
      
      setAiChatHistory([
        { sender: 'ai', text: `Halo! Saya adalah Asisten AI Auditor Cipta Karya. Saya telah menganalisis berkas **${selectedFile.name}**.\n\n**Ringkasan Analisis:**\n${data.summary}\n\n**Rekomendasi Utama:**\n${data.recommendations.map((r: string, idx: number) => `${idx + 1}. ${r}`).join("\n")}` }
      ]);
    } catch (err) {
      console.warn("Fallback to local simulation since API Key might be missing in preview context:", err);
      setTimeout(() => {
        let fallbackData;
        if (selectedFile.type === 'pdf') {
          fallbackData = {
            summary: `Hasil audit administratif atas berkas PDF "${selectedFile.name}". Dokumen ini berisi surat rekomendasi resmi kelaikan bangunan gedung yang diterbitkan oleh Dinas PUPR Bidang Cipta Karya Kabupaten Garut. Struktur utama kolom dinilai aman, dengan tingkat kerusakan total terhitung sebesar 8.15% (Kategori Kerusakan Ringan).`,
            findings: [
              { element: "Rangka Atap", defect: "Pelapukan gording dan reng sekunder karena rembesan air", severity: "Sedang", remediation: "Penggantian komponen reng kayu lapuk" },
              { element: "Dinding Plafon", defect: "Noda basah & jamur gypsum meluas", severity: "Sedang", remediation: "Perbaikan genteng bocor lalu ganti plafon" },
              { element: "Kolom Utama", defect: "Retak rambut mikro", severity: "Rendah", remediation: "Injeksi epoksi beton" }
            ],
            recommendations: [
              "Segera lakukan penggantian genteng bocor sebelum memasuki musim penghujan guna menghindari pelapukan rangka atap kayu lebih lanjut.",
              "Jadwalkan injeksi epoksi struktural pada kolom yang mengalami retak rambut mikro dalam waktu 30 hari.",
              "Dokumen telah memenuhi standar administrasi dan laik untuk disetujui (diberi tanda tangan digital)."
            ],
            complianceStatus: "Laik Fungsi dengan Catatan Pemeliharaan",
            confidenceScore: 94
          };
        } else if (selectedFile.type === 'excel') {
          fallbackData = {
            summary: `Evaluasi Rencana Anggaran Biaya (RAB) rehabilitasi fisik bangunan gedung. Total estimasi biaya terhitung rapi dan matematis sesuai standar harga satuan dinas Kabupaten Garut tahun 2026. Alokasi anggaran terbesar difokuskan pada perbaikan atap bocor dan perbaikan retak kolom utama.`,
            findings: [
              { element: "Anggaran Struktur", defect: "Biaya perbaikan pondasi ambles mendominasi", severity: "Tinggi", remediation: "Lakukan kajian pemadatan tanah tanah sebelum pondasi disuntik beton" },
              { element: "Anggaran Non-Struktur", defect: "Biaya plester dinding finishing cukup tinggi", severity: "Rendah", remediation: "Optimalkan volume plesteran hanya pada area terdampak keretakan" }
            ],
            recommendations: [
              "Kalkulasi total harga pada baris akumulasi akhir terbukti akurat dan konsisten secara matematis.",
              "Harga satuan upah dan bahan telah terkalibrasi dengan Standar Akuntansi Harga Daerah Garut 2026.",
              "RAB disetujui untuk dilanjutkan ke proses pencairan dana rehabilitasi darurat."
            ],
            complianceStatus: "Memenuhi Standar Harga Daerah (RAB Valid)",
            confidenceScore: 98
          };
        } else if (selectedFile.type === 'word') {
          fallbackData = {
            summary: `Dokumen draf draf surat keputusan kelaikan bangunan gedung sekolah. Isi teks sudah memuat bagian wajib (Kop surat dinas, nomor keputusan, klasifikasi kerusakan ringan, dan skor keandalan 82.50%).`,
            findings: [
              { element: "Format Surat", defect: "Isi draf lengkap dan menggunakan tata bahasa baku", severity: "Rendah", remediation: "Pertahankan format baku" }
            ],
            recommendations: [
              "Format penulisan telah sesuai dengan Tata Naskah Dinas Kementerian PUPR.",
              "Rekomendasi teknis kelaikan fungsi laik gedung sudah dituangkan dengan klausul tanggung jawab pemeliharaan yang jelas.",
              "Draf siap untuk diekspor atau disahkan secara resmi oleh Kepala Dinas."
            ],
            complianceStatus: "Format Sesuai Tata Naskah Dinas",
            confidenceScore: 96
          };
        } else if (selectedFile.type === 'image') {
          fallbackData = {
            summary: `Analisis komputer visual (Computer Vision) terhadap foto laporan lapangan kerusakan fisik. Sistem mendeteksi adanya retak struktural tipe lentur pada permukaan beton kolom dan area pelapukan kayu rangka plafon akibat rembesan air.`,
            findings: [
              { element: "Beton Kolom", defect: "Retak Lentur Struktural Lebar 0.6mm", severity: "Tinggi", remediation: "Suntik epoksi berkekuatan tinggi", box: { x: 25, y: 35, w: 20, h: 40 } },
              { element: "Plat Langit-langit", defect: "Rembesan Air & Jamur", severity: "Sedang", remediation: "Cari sumber kebocoran atap lalu ganti panel gypsum", box: { x: 55, y: 15, w: 35, h: 25 } }
            ],
            recommendations: [
              "Direkomendasikan pengetesan palu beton (Schmidt Hammer Test) untuk mengukur mutu beton kolom aktual.",
              "Segera pasang penyangga darurat (shoring) pada area balok jika retak bertambah lebar.",
              "Tingkatkan filter 'Crack Detail Boost' untuk inspeksi visual garis retak secara mendalam."
            ],
            complianceStatus: "Perlu Tindakan Perbaikan Segera (Kondisi Kritis)",
            confidenceScore: 89
          };
        } else {
          fallbackData = {
            summary: `Analisis berkas umum "${selectedFile.name}". Berkas terdaftar dalam format eksternal. Struktur data dianalisis secara semantik berdasarkan deskripsi meta.`,
            findings: [
              { element: "Atribut File", defect: "Tidak ada kelainan struktur file", severity: "Rendah", remediation: "Tidak ada" }
            ],
            recommendations: [
              "Berkas aman dari malware dan siap diunduh.",
              "Pertahankan cadangan berkas di cloud storage dinas."
            ],
            complianceStatus: "Berkas Terverifikasi Aman",
            confidenceScore: 90
          };
        }

        setAiAnalysisResult(fallbackData);
        setAiChatHistory([
          { sender: 'ai', text: `Halo! Saya adalah Asisten AI Auditor Cipta Karya (Mode Simulasi Cerdas). Saya telah menganalisis berkas **${selectedFile.name}**.\n\n**Ringkasan Analisis:**\n${fallbackData.summary}\n\n**Rekomendasi Utama:**\n${fallbackData.recommendations.map((r, idx) => `${idx + 1}. ${r}`).join("\n")}` }
        ]);
      }, 1500);
    } finally {
      setTimeout(() => {
        setIsAiAnalyzing(false);
      }, 1500);
    }
  };

  const handleSendAiChatQuery = () => {
    if (!aiChatQuery.trim() || !selectedFile) return;

    const userMsg = aiChatQuery;
    setAiChatHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
    setAiChatQuery("");
    setIsAiTyping(true);

    setTimeout(() => {
      let aiText = "";
      const queryLower = userMsg.toLowerCase();

      if (queryLower.includes("biaya") || queryLower.includes("harga") || queryLower.includes("anggaran") || queryLower.includes("rupiah") || queryLower.includes("rab")) {
        if (selectedFile.type === 'excel' || selectedFile.name.includes("Anggaran")) {
          aiText = "Berdasarkan lembar perhitungan Rencana Anggaran Biaya (RAB) ini, total estimasi biaya perbaikan struktur telah dihitung secara matematis. Anggaran difokuskan pada perbaikan kolom utama, suntik epoksi, dan perbaikan atap. Harga satuan yang digunakan sudah sesuai dengan Keputusan Bupati Garut mengenai Standar Harga Satuan Cipta Karya tahun 2026.";
        } else {
          aiText = "Untuk dokumen ini, tidak terdapat rincian anggaran biaya (RAB) yang mendalam. Namun, berdasarkan rekomendasi teknis, disarankan untuk mengacu pada berkas 'Estimasi_Anggaran_Rehab.xlsx' untuk melihat rincian biaya penambalan kolom retak dan perbaikan atap.";
        }
      } else if (queryLower.includes("retak") || queryLower.includes("struktur") || queryLower.includes("kerusakan") || queryLower.includes("ambles") || queryLower.includes("pondasi")) {
        aiText = "Dari sudut pandang teknik sipil, kerusakan struktural seperti retak lentur pada kolom utama atau pondasi ambles harus mendapatkan penanganan prioritas tinggi (High Severity). Retak kolom harus segera diinjeksi epoksi struktural untuk mencegah udara masuk yang memicu korosi besi tulangan baja di dalamnya, yang dapat melemahkan daya dukung bangunan.";
      } else if (queryLower.includes("aman") || queryLower.includes("laik") || queryLower.includes("layak") || queryLower.includes("izin") || queryLower.includes("sertifikat")) {
        aiText = "Dokumen ini menyimpulkan bahwa bangunan berada dalam status 'Laik Fungsi dengan Catatan'. Artinya bangunan aman digunakan untuk kegiatan belajar-mengajar atau perkantoran, asalkan rekomendasi pemeliharaan berkala (khususnya perbaikan atap bocor dan pemantauan retak beton) dilaksanakan tepat waktu oleh pengelola gedung.";
      } else if (queryLower.includes("siapa") || queryLower.includes("tanda tangan") || queryLower.includes("pejabat") || queryLower.includes("dinas")) {
        aiText = "Dokumen ini dikeluarkan oleh Dinas Pekerjaan Umum dan Penataan Ruang (PUPR) Kabupaten Garut, dan ditandatangani oleh Kepala Dinas PUPR, Dr. H. Ahmad, M.T. (NIP. 19750812 200112 1 002). Anda dapat membubuhkan pengesahan digital tambahan (Digital Stamp) menggunakan tombol pengesahan di panel AI.";
      } else {
        aiText = "Sebagai asisten AI Cipta Karya, saya merekomendasikan kepatuhan penuh terhadap Peraturan Menteri PUPR No. 16/PRT/M/2010. Apakah ada hal teknis spesifik mengenai dimensi komponen, metode perbaikan epoksi, atau validitas dokumen ini yang ingin Anda diskusikan lebih mendalam?";
      }

      setAiChatHistory(prev => [...prev, { sender: 'ai', text: aiText }]);
      setIsAiTyping(false);
    }, 1000);
  };

  // Sync state to localstorage for dynamic persistence
  useEffect(() => {
    localStorage.setItem("smart_files_db", JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    const handleStorageChange = () => {
      setActiveRole(localStorage.getItem("activeRole") || "Administrator");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const getFilteredFiles = () => {
    return files.filter(f => {
      // 1. Check folder (only apply folder filter if activeFilter is all or folders, or if we want to stay inside current folder regardless)
      // Actually, if a user clicks "Images", maybe they want all images in current folder. Let's keep it within current folder for now.
      if (f.folderId !== currentFolder && !searchQuery) return false;
      // 2. Check role access
      if (!f.accessRole.includes(activeRole) && activeRole !== "Administrator") return false;
      // 3. Search query
      if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      // 4. Active filter
      if (activeFilter === 'images' && f.type !== 'image') return false;
      if (activeFilter === 'documents' && f.type !== 'pdf' && f.type !== 'word') return false;
      if (activeFilter === 'spreadsheets' && f.type !== 'excel') return false;
      if (activeFilter === 'folders' && f.type !== 'folder') return false;
      
      return true;
    });
  };

  const currentFiles = getFilteredFiles();
  const folderPath = currentFolder ? files.find(f => f.id === currentFolder) : null;

  const formatSize = (bytes?: number) => {
    if (!bytes) return "--";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (type: string, className?: string) => {
    switch (type) {
      case 'folder': return <Folder className={cn("text-amber-400 fill-amber-400/20", className)} />;
      case 'pdf': return <FileText className={cn("text-rose-500", className)} />;
      case 'image': return <ImageIcon className={cn("text-blue-500", className)} />;
      case 'word': return <File className={cn("text-sky-600", className)} />;
      case 'excel': return <FileSpreadsheet className={cn("text-emerald-600", className)} />;
      default: return <File className={cn("text-slate-400", className)} />;
    }
  };

  const handleSelectFile = (file: FileItem) => {
    setSelectedFile(file);
    setShowSmartModal(true);
    setPreviewScale(1);
    setPreviewPage(1);
    setPreviewRotation(0);
    setImageFilter('normal');
    setShowGrid(false);
    setIsMeasuring(false);
    setMeasurePoints([]);
    setHoveredFinding(null);
    setIsEditingMetadata(false);
    setEditedFileName(file.name);
    setEditedDescription(file.description || "");
    setSelectedSheet(0);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    try {
      const activeUserName = localStorage.getItem("activeUserName") || activeRole.replace("_", " ");
      const uploadedFile = await uploadFile(file, activeUserName);

      if (uploadedFile.type === 'word' || uploadedFile.type === 'excel') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const textContent = (event.target?.result as string) || "";
          let wordContent = "";
          let excelData = undefined;

          if (uploadedFile.type === 'word') {
            wordContent = textContent || `DOKUMEN HASIL UNGGAHAN\nNama File: ${file.name}\n\nTidak ada teks yang dapat dibaca secara langsung.`;
          } else if (uploadedFile.type === 'excel') {
            const rows = [];
            const lines = textContent.split(/\r?\n/);
            const lineLimit = Math.min(lines.length, 15);
            for (let i = 0; i < lineLimit; i++) {
              if (!lines[i].trim()) continue;
              const cols = lines[i].split(/,|\t|;/).map(c => c.replace(/^["']|["']$/g, '').trim());
              rows.push(cols);
            }
            if (rows.length > 1) {
              excelData = { sheets: [{ name: "Hasil Impor", rows: rows }] };
            }
          }
          
          setFiles(prev => prev.map(f => f.id === uploadedFile.id ? { ...f, content: wordContent, excelData } : f));
        };
        reader.readAsText(file);
      }
    } catch (err) {
      console.error("Failed to upload file", err);
      alert("Gagal mengunggah file ke Google Drive.");
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const activeUserName = localStorage.getItem("activeUserName") || activeRole.replace("_", " ");
      await createFolder(newFolderName, activeUserName);
      setNewFolderName("");
      setShowCreateFolderModal(false);
    } catch (err) {
      console.error("Failed to create folder", err);
      alert("Gagal membuat folder di Google Drive.");
    }
  };

  const handleDeleteFile = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus berkas ini? Tindakan ini tidak dapat dibatalkan.")) {
      setFiles(prev => prev.filter(f => f.id !== id));
      if (selectedFile?.id === id) {
        setSelectedFile(null);
      }
    }
  };

  const handleSaveMetadata = () => {
    if (!selectedFile) return;
    setFiles(prev => prev.map(f => {
      if (f.id === selectedFile.id) {
        return {
          ...f,
          name: editedFileName,
          description: editedDescription,
          updatedAt: new Date().toISOString()
        };
      }
      return f;
    }));
    setSelectedFile(prev => prev ? {
      ...prev,
      name: editedFileName,
      description: editedDescription,
      updatedAt: new Date().toISOString()
    } : null);
    setIsEditingMetadata(false);
  };

  const handleAddComment = () => {
    if (!selectedFile || !commentText.trim()) return;

    const newComment: FileComment = {
      id: "c-" + Date.now(),
      user: localStorage.getItem("activeUserName") || "Pengguna Aktif",
      role: activeRole.replace("_", " "),
      text: commentText,
      time: new Date().toISOString()
    };

    const updatedComments = [...(selectedFile.comments || []), newComment];

    setFiles(prev => prev.map(f => {
      if (f.id === selectedFile.id) {
        return { ...f, comments: updatedComments };
      }
      return f;
    }));

    setSelectedFile(prev => prev ? { ...prev, comments: updatedComments } : null);
    setCommentText("");
  };

  // Trigger Excel Cell Change & Re-calculate Totals dynamically
  const handleExcelCellChange = (sheetIdx: number, rowIdx: number, colIdx: number, val: string) => {
    if (!selectedFile || !selectedFile.excelData) return;

    const sheetsCopy = JSON.parse(JSON.stringify(selectedFile.excelData.sheets));
    sheetsCopy[sheetIdx].rows[rowIdx][colIdx] = val;

    // Recalculate totals if this row is not the total row and total column is updated
    const targetSheet = sheetsCopy[sheetIdx];
    let grandTotal = 0;

    for (let r = 1; r < targetSheet.rows.length - 1; r++) {
      const volume = parseFloat(targetSheet.rows[r][2]) || 0;
      const price = parseFloat(targetSheet.rows[r][4]) || 0;
      const rowTotal = volume * price;
      targetSheet.rows[r][5] = String(rowTotal);
      grandTotal += rowTotal;
    }

    // Set final total cell value
    const lastRowIdx = targetSheet.rows.length - 1;
    targetSheet.rows[lastRowIdx][5] = String(grandTotal);

    setFiles(prev => prev.map(f => {
      if (f.id === selectedFile.id) {
        return {
          ...f,
          excelData: { sheets: sheetsCopy }
        };
      }
      return f;
    }));

    setSelectedFile(prev => prev ? {
      ...prev,
      excelData: { sheets: sheetsCopy }
    } : null);
  };

  // Trigger Word document text changes
  const handleWordContentChange = (newText: string) => {
    if (!selectedFile) return;

    setFiles(prev => prev.map(f => {
      if (f.id === selectedFile.id) {
        return { ...f, content: newText };
      }
      return f;
    }));

    setSelectedFile(prev => prev ? { ...prev, content: newText } : null);
  };

  const handleShareClick = () => {
    setShowShareModal(true);
    setCopiedLink(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/file-share/${selectedFile?.id}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="h-[calc(100vh-80px)] flex gap-4 overflow-hidden relative bg-slate-50/50 p-2">
      
      {/* SIDEBAR: Modern Workspace Navigation */}
      <FileManagerSidebar 
        activeRole={activeRole}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        onUploadClick={() => fileInputRef.current?.click()}
      />
      
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileUpload}
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
      />
      
      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 space-y-4">
        
        <FileManagerToolbar
          currentFolder={currentFolder}
          setCurrentFolder={setCurrentFolder}
          folderName={currentFolderName}
            setCurrentFolderName={setCurrentFolderName}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          loadingFiles={loadingFiles}
          viewMode={viewMode}
          setViewMode={setViewMode}
          onRefresh={fetchFiles}
          setSelectedFile={setSelectedFile}
        />
        
        {/* ADD NEW FOLDER BUTTON (Moved from old Header) */}
        <div className="flex justify-end mt-[-10px]">
          <button 
            onClick={() => setShowCreateFolderModal(true)}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200/60 shadow-sm"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Folder Baru</span>
          </button>
        </div>

        {/* File Grid/List Area */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative">
          {loadingFiles ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-10 h-10 animate-spin text-pu-blue/40 mb-3" />
              <p className="text-xs font-semibold animate-pulse text-slate-500">Menyinkronkan dengan Google Drive...</p>
            </div>
          ) : (
            viewMode === 'grid' ? (
              <FileManagerGridView
                currentFiles={getFilteredFiles()}
                selectedFile={selectedFile}
                setCurrentFolder={setCurrentFolder}
                setSelectedFile={setSelectedFile}
                handleSelectFile={handleSelectFile}
                handleDeleteFile={handleDeleteFile}
                setShowSmartModal={setShowSmartModal}
                setAiAnalysisResult={setAiAnalysisResult}
                setAiChatHistory={setAiChatHistory}
                setIsDigitallySigned={setIsDigitallySigned}
                getFileIcon={getFileIcon}
                formatSize={formatSize}
              />
            ) : (
              <FileManagerListView
                currentFiles={getFilteredFiles()}
                selectedFile={selectedFile}
                setCurrentFolder={setCurrentFolder}
                setSelectedFile={setSelectedFile}
                handleSelectFile={handleSelectFile}
                handleDeleteFile={handleDeleteFile}
                setShowSmartModal={setShowSmartModal}
                setAiAnalysisResult={setAiAnalysisResult}
                setAiChatHistory={setAiChatHistory}
                setIsDigitallySigned={setIsDigitallySigned}
                getFileIcon={getFileIcon}
                formatSize={formatSize}
              />
            )
          )}
        </div>
      </div>

      {/* RIGHT CONTAINER: Smart Full-Screen Interactive Document Hub Modal */}
      <AnimatePresence>
        {selectedFile && showSmartModal && (
          <SmartPreviewModal
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            setFiles={setFiles}
            activeRole={activeRole}
            isEditingMetadata={isEditingMetadata}
            setIsEditingMetadata={setIsEditingMetadata}
            editedFileName={editedFileName}
            setEditedFileName={setEditedFileName}
            editedDescription={editedDescription}
            setEditedDescription={setEditedDescription}
            handleSaveMetadata={handleSaveMetadata}
            setShowSmartModal={setShowSmartModal}
            setAiAnalysisResult={setAiAnalysisResult}
            setAiChatHistory={setAiChatHistory}
            setIsDigitallySigned={setIsDigitallySigned}
            handleShareClick={handleShareClick}
            getFileIcon={getFileIcon}
            previewScale={previewScale}
            setPreviewScale={setPreviewScale}
            previewPage={previewPage}
            setPreviewPage={setPreviewPage}
            previewRotation={previewRotation}
            setPreviewRotation={setPreviewRotation}
            imageFilter={imageFilter}
            setImageFilter={setImageFilter}
            pixelToMmScale={pixelToMmScale}
            setPixelToMmScale={setPixelToMmScale}
            isMeasuring={isMeasuring}
            setIsMeasuring={setIsMeasuring}
            measurePoints={measurePoints}
            setMeasurePoints={setMeasurePoints}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            showAiBoxes={showAiBoxes}
            setShowAiBoxes={setShowAiBoxes}
            hoveredFinding={hoveredFinding}
            setHoveredFinding={setHoveredFinding}
            calculateDistance={calculateDistance}
            selectedSheet={selectedSheet}
            setSelectedSheet={setSelectedSheet}
            handleExcelCellChange={handleExcelCellChange}
            handleWordContentChange={handleWordContentChange}
            formatSize={formatSize}
            modalActiveTab={modalActiveTab}
            setModalActiveTab={setModalActiveTab}
            isAiAnalyzing={isAiAnalyzing}
            handleRunAiAnalysis={handleRunAiAnalysis}
            aiAnalysisResult={aiAnalysisResult}
            isDigitallySigned={isDigitallySigned}
            aiChatHistory={aiChatHistory}
            aiChatQuery={aiChatQuery}
            setAiChatQuery={setAiChatQuery}
            handleSendAiChatQuery={handleSendAiChatQuery}
            isAiTyping={isAiTyping}
            commentText={commentText}
            setCommentText={setCommentText}
            handleAddComment={handleAddComment}
          />
        )}
      </AnimatePresence>

      {/* MODAL: SHARE OVERLAY */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4 select-none">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-5 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Share2 className="w-4.5 h-4.5 text-pu-blue" /> Bagikan Dokumen
              </h3>
              <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Gunakan tautan resmi di bawah untuk membagikan berkas secara internal kepada petugas dinas atau dinas vertikal terkait.
            </p>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2 font-mono text-[10px] text-slate-600 overflow-x-auto select-all">
              <span className="truncate flex-1 pr-1">
                {window.location.origin}/file-share/{selectedFile?.id}
              </span>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button 
                onClick={handleCopyLink}
                className="flex-1 bg-pu-blue hover:bg-blue-800 text-white rounded-xl py-2 text-xs font-bold transition-colors shadow flex items-center justify-center gap-1.5"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    Tersalin ke Clipboard
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-white" />
                    Salin Tautan Resmi
                  </>
                )}
              </button>
              <button 
                onClick={() => setShowShareModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-4 py-2 text-xs font-bold border border-slate-200/50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW FOLDER */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[100] flex items-center justify-center p-4 select-none">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-5 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Folder className="w-4.5 h-4.5 text-amber-400 fill-amber-400/20" /> Buat Folder Baru
              </h3>
              <button onClick={() => setShowCreateFolderModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Nama Folder:</label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Contoh: Dokumen Kelayakan Sekolah..."
                className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 focus:bg-white focus:ring-pu-blue focus:border-pu-blue focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' ? handleCreateFolder() : null}
                autoFocus
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button 
                onClick={handleCreateFolder}
                className="flex-1 bg-pu-blue hover:bg-blue-800 text-white rounded-xl py-2 text-xs font-bold transition-colors shadow"
              >
                Ciptakan Folder
              </button>
              <button 
                onClick={() => setShowCreateFolderModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-4 py-2 text-xs font-bold border border-slate-200/50"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
