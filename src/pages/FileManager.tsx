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

const MOCK_FILES: FileItem[] = [
  { id: "f1", name: "Laporan Kerusakan", type: "folder", updatedAt: "2026-07-10T10:00:00Z", author: "System", folderId: null, accessRole: ["Administrator", "Kadis", "Kabid", "Koordinator"] },
  { id: "f2", name: "Surat Disposisi", type: "folder", updatedAt: "2026-07-09T14:20:00Z", author: "System", folderId: null, accessRole: ["Administrator", "Kadis", "Kabid"] },
  { id: "f3", name: "Dokumen Sekolah", type: "folder", updatedAt: "2026-07-08T09:15:00Z", author: "System", folderId: null, accessRole: ["Administrator", "Pengelola_Bangunan", "Operator"] },
  { id: "f4", name: "Foto Lapangan", type: "folder", updatedAt: "2026-07-05T11:45:00Z", author: "System", folderId: null, accessRole: ["Administrator", "Tim_Teknis", "Koordinator"] },
  { 
    id: "file1", 
    name: "Disposisi_SDN_1_Garut.pdf", 
    type: "pdf", 
    size: 1024 * 1500, 
    updatedAt: "2026-07-09T15:30:00Z", 
    author: "Kabid Cipta Karya", 
    folderId: "f2", 
    accessRole: ["Administrator", "Kadis", "Kabid"],
    description: "Surat disposisi resmi Kepala Dinas PUPR Kabupaten Garut mengenai instruksi survei kelayakan fisik SDN 1 Garut.",
    comments: [
      { id: "c1", user: "Dr. H. Ahmad, M.T.", role: "Kepala Dinas", text: "Tolong segera dijadwalkan survei lapangan untuk SDN 1 Garut, utamakan keselamatan siswa.", time: "2026-07-09T15:45:00Z" },
      { id: "c2", user: "Kabid Cipta Karya", role: "Kabid", text: "Siap pak, disposisi telah diteruskan ke Koordinator Tim Teknis.", time: "2026-07-09T16:00:00Z" }
    ],
    activities: [
      { action: "Surat disposisi dibuat", time: "2026-07-09T15:30:00Z", user: "Kadis" },
      { action: "Sifat surat diatur: SEGERA", time: "2026-07-09T15:32:00Z", user: "Operator" },
      { action: "Menerima disposisi", time: "2026-07-09T15:45:00Z", user: "Kabid Cipta Karya" }
    ]
  },
  { 
    id: "file2", 
    name: "Laporan_SDN_1_Garut.pdf", 
    type: "pdf", 
    size: 1024 * 3500, 
    updatedAt: "2026-07-10T11:00:00Z", 
    author: "Tim Teknis", 
    folderId: "f1", 
    accessRole: ["Administrator", "Kadis", "Kabid", "Koordinator"],
    description: "Laporan komprehensif hasil penilaian kondisi fisik bangunan gedung SDN 1 Garut oleh Tim Teknis Dinas PUPR.",
    comments: [
      { id: "c3", user: "Ir. Budiman", role: "Tim Teknis", text: "Laporan struktur menunjukkan retak lentur pada balok kelas B perlu diwaspadai.", time: "2026-07-10T11:15:00Z" }
    ],
    activities: [
      { action: "Draf laporan diunggah", time: "2026-07-10T11:00:00Z", user: "Tim Teknis" },
      { action: "Analisis AI dijalankan", time: "2026-07-10T11:02:00Z", user: "Sistem AI" }
    ]
  },
  { 
    id: "file3", 
    name: "Foto_Kerusakan_Atap.jpg", 
    type: "image", 
    size: 1024 * 800, 
    updatedAt: "2026-07-05T12:00:00Z", 
    author: "Tim Teknis", 
    folderId: "f4", 
    accessRole: ["Administrator", "Tim_Teknis", "Koordinator"],
    previewUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1200",
    description: "Bukti visual kerusakan pada komponen atap dan plafon ruang kelas IV yang lapuk akibat rembesan air hujan jangka panjang.",
    comments: [],
    activities: [
      { action: "Foto diunggah dari kamera lapangan", time: "2026-07-05T12:00:00Z", user: "Tim Teknis" }
    ]
  },
  { 
    id: "file4", 
    name: "Profil_SDN_1.pdf", 
    type: "pdf", 
    size: 1024 * 200, 
    updatedAt: "2026-07-08T09:30:00Z", 
    author: "Pengelola Sekolah", 
    folderId: "f3", 
    accessRole: ["Administrator", "Pengelola_Bangunan", "Operator"],
    description: "Dokumen profil sekolah SDN 1 Garut yang berisi data statistik, jumlah murid, luas tanah, serta nomor izin operasional bangunan.",
    comments: [],
    activities: [
      { action: "Dokumen profil diunggah pemohon", time: "2026-07-08T09:30:00Z", user: "Pengelola Sekolah" }
    ]
  },
  {
    id: "file5",
    name: "Template_Surat_Jawaban.docx",
    type: "word",
    size: 1024 * 45,
    updatedAt: "2026-07-11T13:40:00Z",
    author: "Operator Dinas",
    folderId: null,
    accessRole: ["Administrator", "Operator", "Kabid"],
    description: "Draf surat jawaban resmi penolakan atau persetujuan kelaikan fungsi bangunan gedung sekolah.",
    content: "PEMERINTAH KABUPATEN GARUT\nDINAS PEKERJAAN UMUM DAN PENATAAN RUANG\nJl. Pahlawan No. 45, Garut\n\nNomor : 600/342/CiptaKarya/2026\nLampiran : 1 (satu) Berkas\nSifat : Segera\nPerihal : Surat Rekomendasi Teknis Kelaikan Gedung Sekolah\n\nKepada Yth,\nKepala Sekolah SDN 1 Garut\ndi Tempat\n\nMenindaklanjuti surat permohonan Penilaian Kelaikan Fungsi Bangunan Gedung SDN 1 Garut, Tim Teknis Dinas PUPR telah melaksanakan survei lapangan pada tanggal 10 Juli 2026.\n\nBerdasarkan hasil analisis visual dan instrumen ukur, bangunan tersebut berada pada klasifikasi TINGKAT KERUSAKAN RINGAN dengan skor keandalan bangunan 82.50%. Dengan ini direkomendasikan bahwa Gedung SDN 1 Garut dinyatakan LAIK FUNGSI dengan syarat dilakukan pemeliharaan berkala pada struktur rangka atap.\n\nDemikian surat rekomendasi teknis ini dibuat untuk dipergunakan sebagaimana mestinya.\n\nKepala Dinas Pekerjaan Umum,\n\nDr. H. Ahmad, M.T.\nNIP. 19750812 200112 1 002",
    comments: [],
    activities: [
      { action: "Draf template surat dibuat", time: "2026-07-11T13:40:00Z", user: "Operator Dinas" }
    ]
  },
  {
    id: "file6",
    name: "Estimasi_Anggaran_Rehab.xlsx",
    type: "excel",
    size: 1024 * 72,
    updatedAt: "2026-07-11T15:10:00Z",
    author: "Tim Teknis",
    folderId: null,
    accessRole: ["Administrator", "Tim_Teknis", "Koordinator", "Kabid"],
    description: "Lembar perhitungan Rencana Anggaran Biaya (RAB) estimasi perbaikan darurat komponen atap dan penanganan retak dinding.",
    excelData: {
      sheets: [
        {
          name: "RAB Struktur",
          rows: [
            ["No", "Nama Pekerjaan", "Volume", "Satuan", "Harga Satuan (Rp)", "Total Harga (Rp)"],
            ["1", "Perbaikan Pondasi Ambles", "15", "m3", "1450000", "21750000"],
            ["2", "Suntik Epoksi Retak Kolom", "40", "titik", "250000", "10000000"],
            ["3", "Plester Patching Beton", "85", "m2", "180000", "15300000"],
            ["4", "Struktur Gording Kayu Atap", "24", "batang", "480000", "11520000"],
            ["5", "Ganti Genteng Bocor", "250", "buah", "15000", "3750000"],
            ["", "Total Anggaran Struktur", "", "", "", "62320000"]
          ]
        },
        {
          name: "RAB Non-Struktur",
          rows: [
            ["No", "Nama Pekerjaan", "Volume", "Satuan", "Harga Satuan (Rp)", "Total Harga (Rp)"],
            ["1", "Pasang Plafon Gypsum 9mm", "120", "m2", "135000", "16200000"],
            ["2", "Pengecatan Tembok Dalam", "450", "m2", "40000", "18000000"],
            ["3", "Instalasi Kabel Listrik Baru", "8", "titik", "250000", "2000000"],
            ["4", "Kusen Pintu Kayu Kamper", "4", "unit", "1200000", "4800000"],
            ["", "Total Anggaran Non-Struktur", "", "", "", "41000000"]
          ]
        }
      ]
    },
    comments: [
      { id: "c4", user: "Kabid Cipta Karya", role: "Kabid", text: "Rincian harga satuan sudah sesuai standar harga daerah Garut 2026. Setuju.", time: "2026-07-11T16:00:00Z" }
    ],
    activities: [
      { action: "Estimasi anggaran diinput", time: "2026-07-11T15:10:00Z", user: "Tim Teknis" },
      { action: "Harga disesuaikan standar daerah", time: "2026-07-11T15:25:00Z", user: "Operator" }
    ]
  }
];

export default function FileManager() {
  const [activeRole, setActiveRole] = useState(() => localStorage.getItem("activeRole") || "Administrator");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<FileItem[]>(() => {
    const saved = localStorage.getItem("smart_files_db");
    return saved ? JSON.parse(saved) : MOCK_FILES;
  });

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
      // 1. Check folder
      if (f.folderId !== currentFolder && !searchQuery) return false;
      // 2. Check role access
      if (!f.accessRole.includes(activeRole) && activeRole !== "Administrator") return false;
      // 3. Search query
      if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    let type: FileItem['type'] = 'other';
    if (file.type.includes('pdf')) type = 'pdf';
    else if (file.type.includes('image')) type = 'image';
    else if (file.name.endsWith('.doc') || file.name.endsWith('.docx') || file.name.endsWith('.txt')) type = 'word';
    else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) type = 'excel';

    const objectUrl = URL.createObjectURL(file);

    if (type === 'word' || type === 'excel') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = (event.target?.result as string) || "";
        
        let wordContent = "";
        let excelData = undefined;

        if (type === 'word') {
          wordContent = textContent || `DOKUMEN HASIL UNGGAHAN\nNama File: ${file.name}\n\nTidak ada teks yang dapat dibaca secara langsung.`;
        } else if (type === 'excel') {
          // Attempt parsing CSV or tab-separated lines
          const rows: string[][] = [];
          const lines = textContent.split(/\r?\n/);
          const lineLimit = Math.min(lines.length, 15);
          
          for (let i = 0; i < lineLimit; i++) {
            if (!lines[i].trim()) continue;
            const cols = lines[i].split(/,|\t|;/).map(c => c.replace(/^["']|["']$/g, '').trim());
            rows.push(cols);
          }

          if (rows.length > 1) {
            excelData = {
              sheets: [
                {
                  name: "Hasil Impor Real-time",
                  rows: rows
                }
              ]
            };
          } else {
            excelData = {
              sheets: [
                {
                  name: "Lembar 1",
                  rows: [
                    ["No", "Deskripsi Pekerjaan", "Volume", "Satuan", "Harga Satuan (Rp)", "Total (Rp)"],
                    ["1", "Rehabilitasi Elemen Utama", "1", "paket", "15000000", "15000000"],
                    ["2", "Pekerjaan Finishing Dinding", "50", "m2", "75000", "3750000"],
                    ["", "Total Biaya", "", "", "", "18750000"]
                  ]
                }
              ]
            };
          }
        }

        const newFile: FileItem = {
          id: "file-" + Date.now(),
          name: file.name,
          type: type,
          size: file.size,
          updatedAt: new Date().toISOString(),
          author: localStorage.getItem("activeUserName") || activeRole.replace("_", " "),
          folderId: currentFolder,
          accessRole: ["Administrator", "Kadis", "Kabid", "Koordinator", "Tim_Teknis", "Operator", "Pengelola_Bangunan"],
          previewUrl: objectUrl,
          description: `Berkas real yang diunggah langsung oleh pengguna pada ${new Date().toLocaleDateString('id-ID')}.`,
          comments: [],
          activities: [
            { action: "Berkas asli diunggah ke sistem", time: new Date().toISOString(), user: localStorage.getItem("activeUserName") || activeRole.replace("_", " ") }
          ],
          content: wordContent,
          excelData: excelData
        };

        setFiles(prev => [newFile, ...prev]);
        handleSelectFile(newFile);
      };

      reader.readAsText(file);
    } else {
      const newFile: FileItem = {
        id: "file-" + Date.now(),
        name: file.name,
        type: type,
        size: file.size,
        updatedAt: new Date().toISOString(),
        author: localStorage.getItem("activeUserName") || activeRole.replace("_", " "),
        folderId: currentFolder,
        accessRole: ["Administrator", "Kadis", "Kabid", "Koordinator", "Tim_Teknis", "Operator", "Pengelola_Bangunan"],
        previewUrl: objectUrl,
        description: `Berkas real yang diunggah langsung oleh pengguna pada ${new Date().toLocaleDateString('id-ID')}.`,
        comments: [],
        activities: [
          { action: "Berkas berhasil diunggah ke sistem", time: new Date().toISOString(), user: localStorage.getItem("activeUserName") || activeRole.replace("_", " ") }
        ]
      };

      setFiles(prev => [newFile, ...prev]);
      handleSelectFile(newFile);
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;

    const newFolder: FileItem = {
      id: "folder-" + Date.now(),
      name: newFolderName,
      type: 'folder',
      updatedAt: new Date().toISOString(),
      author: localStorage.getItem("activeUserName") || activeRole.replace("_", " "),
      folderId: currentFolder,
      accessRole: ["Administrator", "Kadis", "Kabid", "Koordinator", "Tim_Teknis", "Operator", "Pengelola_Bangunan"],
      activities: [
        { action: "Folder baru diciptakan", time: new Date().toISOString(), user: localStorage.getItem("activeUserName") || activeRole.replace("_", " ") }
      ]
    };

    setFiles(prev => [...prev, newFolder]);
    setNewFolderName("");
    setShowCreateFolderModal(false);
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
    <div className="h-[calc(100vh-80px)] flex flex-col gap-5 overflow-hidden relative">
      
      {/* LEFT CONTAINER: File Directory list */}
      <div className="flex flex-col space-y-4 h-full transition-all duration-300 w-full shrink-0">
        
        {/* Header Dashboard Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 backdrop-blur-lg p-5 rounded-2xl border border-white/50 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-pu-blue" />
              Smart Manajemen File
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 flex items-center gap-1.5">
              Role Akses: <span className="bg-blue-50 text-pu-blue border border-blue-100 px-2 py-0.5 rounded-md font-mono text-[9px]">{activeRole.replace("_", " ")}</span>
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari berkas atau dokumen..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white/50 border border-slate-200 rounded-xl text-xs focus:ring-pu-blue focus:border-pu-blue w-full sm:w-56"
              />
            </div>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload}
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 bg-pu-blue hover:bg-blue-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:scale-[1.02]"
            >
              <UploadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Unggah Berkas</span>
            </button>

            <button 
              onClick={() => setShowCreateFolderModal(true)}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200/60"
            >
              <Plus className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">Folder Baru</span>
            </button>
          </div>
        </div>

        {/* Toolbar & Breadcrumbs */}
        <div className="flex items-center justify-between bg-white/40 backdrop-blur-sm p-3 rounded-xl border border-white/30">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <button 
              onClick={() => {
                setCurrentFolder(null);
                setSelectedFile(null);
              }}
              className="hover:text-pu-blue transition-colors flex items-center gap-1 bg-white/60 px-2.5 py-1 rounded-lg border border-slate-200/40 shadow-xs"
            >
              <HardDrive className="w-3.5 h-3.5 text-slate-400" /> Root Directory
            </button>
            {folderPath && (
              <>
                <span className="text-slate-400 font-normal">/</span>
                <span className="text-pu-blue bg-blue-50/50 px-2.5 py-1 rounded-lg border border-blue-100/50 flex items-center gap-1">
                  <Folder className="w-3 h-3 text-amber-400 fill-amber-400/20" />
                  {folderPath.name}
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 bg-white/50 p-1 rounded-lg border border-slate-200/50">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-white shadow-xs text-pu-blue font-bold" : "text-slate-400 hover:text-slate-600")}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white shadow-xs text-pu-blue font-bold" : "text-slate-400 hover:text-slate-600")}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* File Grid/List Area */}
        <div className="flex-1 bg-white/50 backdrop-blur-md rounded-2xl border border-white/60 overflow-y-auto p-5 custom-scrollbar">
          {currentFiles.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
              <div className="p-4 bg-slate-100 rounded-full mb-3 shadow-inner">
                <Folder className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-xs font-semibold text-slate-500">Folder ini kosong atau Anda tidak memiliki akses.</p>
              <p className="text-[10px] text-slate-400 mt-1">Gunakan tombol Unggah atau Buat Folder Baru untuk mengisi konten.</p>
            </div>
          ) : (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                  {currentFiles.map(file => {
                    const isSelected = selectedFile?.id === file.id;
                    return (
                      <motion.div
                        key={file.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={() => file.type === 'folder' ? (setCurrentFolder(file.id), setSelectedFile(null)) : handleSelectFile(file)}
                        className={cn(
                          "group relative flex flex-col items-center justify-center p-4 rounded-2xl cursor-pointer transition-all duration-200 border text-center select-none",
                          isSelected 
                            ? "bg-blue-50/70 border-blue-200 shadow-md translate-y-[-2px]" 
                            : "bg-white/70 hover:bg-white border-slate-200/50 hover:shadow-md hover:translate-y-[-2px]"
                        )}
                      >
                        <div className="mb-3.5 relative">
                          {getFileIcon(file.type, "w-11 h-11")}
                          {file.type !== 'folder' && (
                            <span className="absolute bottom-[-2px] right-[-2px] bg-white border border-slate-200 rounded-md p-0.5 shadow-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-2.5 h-2.5 text-slate-400" />
                            </span>
                          )}
                        </div>
                        <h3 className="text-xs font-bold text-slate-700 line-clamp-2 w-full break-all px-1">
                          {file.name}
                        </h3>
                        <p className="text-[9px] text-slate-400 mt-1 font-mono">
                          {file.type === 'folder' ? 'Folder' : formatSize(file.size)}
                        </p>

                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 select-none">
                          {file.type !== 'folder' && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFile(file);
                                setShowSmartModal(true);
                                setAiAnalysisResult(null);
                                setAiChatHistory([]);
                                setIsDigitallySigned(false);
                              }}
                              className="p-1 bg-white hover:bg-blue-50 text-blue-600 rounded-md shadow-xs border border-slate-200/40"
                              title="Smart Preview (Modal Besar)"
                            >
                              <Sparkles className="w-3 h-3" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(file.id);
                            }}
                            className="p-1 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-md shadow-xs border border-slate-200/40"
                            title="Hapus berkas"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      <th className="pb-3 px-4 font-bold">Nama Berkas</th>
                      <th className="pb-3 px-4 font-bold">Ukuran</th>
                      <th className="pb-3 px-4 font-bold">Modifikasi</th>
                      <th className="pb-3 px-4 font-bold">Pemilik</th>
                      <th className="pb-3 px-4 font-bold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {currentFiles.map(file => {
                        const isSelected = selectedFile?.id === file.id;
                        return (
                          <motion.tr
                            key={file.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => file.type === 'folder' ? (setCurrentFolder(file.id), setSelectedFile(null)) : handleSelectFile(file)}
                            className={cn(
                              "border-b border-slate-100 hover:bg-white/80 transition-colors cursor-pointer group",
                              isSelected ? "bg-blue-50/50" : ""
                            )}
                          >
                            <td className="py-3 px-4 flex items-center gap-3">
                              {getFileIcon(file.type, "w-4.5 h-4.5")}
                              <span className="text-xs font-bold text-slate-700">{file.name}</span>
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-500 font-mono">
                              {file.type === 'folder' ? '--' : formatSize(file.size)}
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-500">
                              {new Date(file.updatedAt).toLocaleDateString('id-ID')}
                            </td>
                            <td className="py-3 px-4 text-[11px] text-slate-500 font-medium">
                              {file.author}
                            </td>
                            <td className="py-3 px-4 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center justify-end gap-1 select-none">
                                {file.type !== 'folder' && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedFile(file);
                                      setShowSmartModal(true);
                                      setAiAnalysisResult(null);
                                      setAiChatHistory([]);
                                      setIsDigitallySigned(false);
                                    }}
                                    className="p-1.5 text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-50"
                                    title="Smart Preview (Modal Besar)"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFile(file.id);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-100"
                                  title="Hapus berkas"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
            )
          )}
        </div>
      </div>

      {/* RIGHT CONTAINER: Smart Full-Screen Interactive Document Hub Modal */}
      {selectedFile && (
        <div 
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6"
          onClick={() => setSelectedFile(null)}
        />
      )}

      <AnimatePresence>
        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="fixed inset-0 m-auto z-50 w-full max-w-7xl h-[88vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header toolbar */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5 overflow-hidden">
                {getFileIcon(selectedFile.type, "w-5 h-5 shrink-0")}
                {isEditingMetadata ? (
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="text" 
                      value={editedFileName} 
                      onChange={(e) => setEditedFileName(e.target.value)}
                      className="border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-800 bg-white"
                      autoFocus
                    />
                    <button onClick={handleSaveMetadata} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Simpan">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setIsEditingMetadata(false)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Batal">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-xs font-bold text-slate-800 truncate" title={selectedFile.name}>
                      {selectedFile.name}
                    </span>
                    <button 
                      onClick={() => {
                        setIsEditingMetadata(true);
                        setEditedFileName(selectedFile.name);
                        setEditedDescription(selectedFile.description || "");
                      }} 
                      className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 shrink-0"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 select-none">
                <button 
                  onClick={() => {
                    setShowSmartModal(true);
                    setAiAnalysisResult(null);
                    setAiChatHistory([]);
                    setIsDigitallySigned(false);
                  }}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs hover:scale-[1.02] mr-1 animate-pulse"
                  title="Buka Smart Preview (Modal Besar)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-100" />
                  <span>Smart Preview</span>
                </button>
                <button 
                  onClick={handleShareClick}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Bagikan berkas"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    // Simulate Download
                    alert(`Mengunduh berkas: ${selectedFile.name}`);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Unduh berkas"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Tutup pratinjau"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Interactive Preview Section */}
            <div className="flex-1 overflow-hidden bg-slate-900/5 flex flex-col lg:flex-row p-5 gap-5 min-h-0">
              
              {/* Document Display Canvas (LEFT CONTAINER inside Modal) */}
              <div className="w-full lg:w-3/5 h-full overflow-y-auto bg-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[420px] border border-slate-200/50 custom-scrollbar relative">
                
                {selectedFile.type === 'pdf' && (
                  <div className="w-full h-full flex flex-col bg-slate-800/90 border border-slate-700/55 rounded-2xl overflow-hidden shadow-md">
                    {/* PDF Reader Header controls */}
                    <div className="px-4 py-2 bg-slate-800 border-b border-slate-700/80 flex items-center justify-between text-white text-xs select-none">
                      <div className="flex items-center gap-2">
                        <span className="font-bold tracking-wide uppercase text-[9px] bg-red-600 px-1.5 py-0.5 rounded text-white font-sans shrink-0">
                          PDF Reader
                        </span>
                        <span className="text-[10px] text-slate-400 hidden sm:inline truncate max-w-[150px]">
                          {selectedFile.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 border-r border-slate-700 pr-2.5">
                          <button 
                            disabled={previewScale <= 0.6}
                            onClick={() => setPreviewScale(p => Math.max(0.6, p - 0.2))}
                            className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
                          >
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-mono w-10 text-center text-slate-300">
                            {Math.round(previewScale * 100)}%
                          </span>
                          <button 
                            disabled={previewScale >= 1.6}
                            onClick={() => setPreviewScale(p => Math.min(1.6, p + 0.2))}
                            className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button 
                            disabled={previewPage <= 1}
                            onClick={() => setPreviewPage(p => p - 1)}
                            className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[10px] font-medium text-slate-300">
                            {previewPage} / 2
                          </span>
                          <button 
                            disabled={previewPage >= 2}
                            onClick={() => setPreviewPage(p => p + 1)}
                            className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* PDF body page simulation */}
                    <div className="flex-1 p-4 overflow-auto flex justify-center bg-slate-700 custom-scrollbar relative">
                      {selectedFile.previewUrl && !selectedFile.id.startsWith("file") ? (
                        <iframe 
                          src={selectedFile.previewUrl} 
                          className="w-full h-full border-0 rounded"
                          style={{ transform: `scale(${previewScale})`, transformOrigin: "top center" }}
                        />
                      ) : (
                        <div 
                          className="bg-white shadow-xl p-8 text-slate-800 transition-all text-left relative overflow-hidden select-text"
                          style={{ 
                            width: "210mm", 
                            minHeight: "297mm", 
                            transform: `scale(${previewScale * 0.7})`, 
                            transformOrigin: "top center",
                            fontSize: "12px",
                            lineHeight: "1.5"
                          }}
                        >
                          {previewPage === 1 ? (
                            <>
                              {/* Page 1: Kop Surat & Letter Body */}
                              <div className="text-center border-b-[3px] border-slate-900 pb-3 mb-5 select-none">
                                <h1 className="font-bold text-lg leading-tight uppercase font-serif tracking-wide text-slate-900">
                                  PEMERINTAH KABUPATEN GARUT
                                </h1>
                                <h2 className="font-bold text-base leading-tight uppercase text-slate-900">
                                  DINAS PEKERJAAN UMUM DAN PENATAAN RUANG
                                </h2>
                                <p className="text-[9px] text-slate-500 italic mt-1 font-sans">
                                  Jl. Pahlawan No. 45, Garut, Jawa Barat. Telp: (0262) 123456 | Email: pupr@garutkab.go.id
                                </p>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-[11px] mb-6 select-none font-medium">
                                <div>
                                  <p>Nomor : 600/142/PUPR/CiptaKarya/2026</p>
                                  <p>Sifat : Segera (Penting)</p>
                                  <p>Lampiran : 1 (satu) Berkas Lengkap</p>
                                </div>
                                <div className="text-right">
                                  <p>Garut, {new Date(selectedFile.updatedAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                                  <p>Perihal : Rekomendasi Teknis Penilaian</p>
                                </div>
                              </div>

                              <div className="mb-6 font-medium text-[11px]">
                                <p>Kepada Yth,</p>
                                <p className="font-bold">Bupati Garut / Kepala Dinas Pendidikan</p>
                                <p>di Tempat</p>
                              </div>

                              <div className="space-y-3.5 text-justify text-[11.5px] leading-relaxed">
                                <p>
                                  Dengan hormat, menindaklanjuti permohonan penilaian kelaikan fungsi bangunan gedung pendidikan dari <strong className="font-bold">{selectedFile.name.includes("SDN_1") ? "SDN 1 Garut" : "Lembaga Pemohon"}</strong>, Tim Teknis Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut telah melaksanakan peninjauan dan investigasi kelaikan fisik langsung ke lokasi bangunan.
                                </p>
                                <p>
                                  Metode pemeriksaan meliputi analisis kekuatan visual (visual inspection method), pengukuran keretakan beton, identifikasi korosi tulangan baja, serta pelapukan elemen pendukung sekunder (plafon/kuda-kuda kayu). Berdasarkan hasil kompilasi data dan analisis parameter terstandar:
                                </p>
                                <ul className="list-disc pl-5 space-y-1.5 font-medium">
                                  <li>Klasifikasi Kerusakan : <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">KERUSAKAN RINGAN (SKOR: 82.50%)</span></li>
                                  <li>Rekomendasi Utama : <strong className="font-bold text-green-700">Laik Fungsi dengan Catatan Pemeliharaan</strong></li>
                                  <li>Tindakan Segera : Rehabilitasi elemen rangka atap/genteng bocor dan penambalan retak rambut kolom.</li>
                                </ul>
                                <p>
                                  Laporan teknis lengkap dan lampiran estimasi kebutuhan anggaran rehabilitasi bangunan terlampir pada halaman selanjutnya. Demikian rekomendasi teknis ini disampaikan untuk menjadi acuan penanganan lebih lanjut.
                                </p>
                              </div>

                              {/* Stamp & Signature block */}
                              <div className="mt-14 float-right text-center mr-10 relative select-none w-56">
                                <p className="text-[11px]">Kepala Dinas PUPR,</p>
                                <div className="h-16 relative flex items-center justify-center my-1.5">
                                  {/* Stamp circular decoration */}
                                  <div className="absolute w-14 h-14 border-[2px] border-blue-500/30 rounded-full flex items-center justify-center -rotate-12 select-none">
                                    <span className="text-[7px] text-blue-500/60 font-bold uppercase text-center leading-tight">
                                      PUPR GARUT<br/>STAMP
                                    </span>
                                  </div>
                                  {/* Signature stroke */}
                                  <svg className="w-20 h-10 text-blue-600/80 -rotate-6" viewBox="0 0 100 50">
                                    <path d="M10,25 Q30,10 50,25 T90,25" fill="none" stroke="currentColor" strokeWidth="2" />
                                    <path d="M20,35 Q40,45 60,30 T80,35" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                  </svg>
                                </div>
                                <p className="font-bold text-[11px] underline">Dr. H. Ahmad, M.T.</p>
                                <p className="text-[9px] text-slate-500">NIP. 19750812 200112 1 002</p>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Page 2: Checklist Kerusakan detail */}
                              <div className="border-b-[2px] border-slate-300 pb-2 mb-4 select-none">
                                <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wider">
                                  LAMPIRAN: DETAIL CHECKLIST PENILAIAN TEKNIS LAPANGAN
                                </h3>
                                <p className="text-[9px] text-slate-400 font-mono mt-0.5">ID Dokumen: {selectedFile.id}</p>
                              </div>

                              <table className="w-full text-left text-[10.5px] border-collapse mb-6 select-text">
                                <thead>
                                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                                    <th className="p-2 border border-slate-300">Komponen Bangunan</th>
                                    <th className="p-2 border border-slate-300 text-center">Kerusakan (%)</th>
                                    <th className="p-2 border border-slate-300">Temuan Lapangan / Defek Teknis</th>
                                    <th className="p-2 border border-slate-300 text-center">Saran Penanganan</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="border-b border-slate-200">
                                    <td className="p-2 border border-slate-300 font-semibold">1. Pondasi & Sloof</td>
                                    <td className="p-2 border border-slate-300 text-center font-mono">1.50%</td>
                                    <td className="p-2 border border-slate-300 text-slate-600">Pondasi stabil, penurunan tanah di bawah batas toleransi normal.</td>
                                    <td className="p-2 border border-slate-300 text-center text-slate-500">Pemantauan berkala</td>
                                  </tr>
                                  <tr className="border-b border-slate-200">
                                    <td className="p-2 border border-slate-300 font-semibold">2. Kolom & Balok</td>
                                    <td className="p-2 border border-slate-300 text-center font-mono">4.20%</td>
                                    <td className="p-2 border border-slate-300 text-slate-600">Retak rambut mikro pada pertemuan balok kelas B, penutup retak mengelupas.</td>
                                    <td className="p-2 border border-slate-300 text-center text-slate-500">Injeksi Epoksi Retak</td>
                                  </tr>
                                  <tr className="border-b border-slate-200">
                                    <td className="p-2 border border-slate-300 font-semibold">3. Rangka Atap (Kayu)</td>
                                    <td className="p-2 border border-slate-300 text-center font-mono">15.30%</td>
                                    <td className="p-2 border border-slate-300 text-slate-600">Pelapukan kayu gording dan reng sekunder karena kebocoran genteng.</td>
                                    <td className="p-2 border border-slate-300 text-center text-amber-700 font-bold">Ganti Reng & Gording</td>
                                  </tr>
                                  <tr className="border-b border-slate-200">
                                    <td className="p-2 border border-slate-300 font-semibold">4. Plafon & Langit-langit</td>
                                    <td className="p-2 border border-slate-300 text-center font-mono">18.00%</td>
                                    <td className="p-2 border border-slate-300 text-slate-600">Kerusakan plafon gypsum meluas akibat rembesan air, noda kecokelatan basah.</td>
                                    <td className="p-2 border border-slate-300 text-center text-amber-700 font-bold">Penggantian Plafon</td>
                                  </tr>
                                  <tr className="border-b border-slate-200">
                                    <td className="p-2 border border-slate-300 font-semibold">5. Utilitas & Sanitasi</td>
                                    <td className="p-2 border border-slate-300 text-center font-mono">2.10%</td>
                                    <td className="p-2 border border-slate-300 text-slate-600">Saluran air bersih normal, keran wastafel butuh penggantian karet penyekat.</td>
                                    <td className="p-2 border border-slate-300 text-center text-slate-500">Perbaikan ringan</td>
                                  </tr>
                                </tbody>
                              </table>

                              <div className="p-3 rounded bg-blue-50 border border-blue-200 text-blue-950 leading-relaxed text-[11px] mb-5 select-text font-medium">
                                💡 <strong>Catatan Peninjau Teknis Dinas PUPR:</strong> Hasil perhitungan tingkat kerusakan menunjukkan angka kerusakan gabungan bangunan sebesar <strong>8.15% (Kerusakan Ringan)</strong>. Gedung layak beroperasi untuk kegiatan belajar mengajar secara aman selama dilakukan rehabilitasi terjadwal pada komponen non-struktural di atas.
                              </div>

                              <div className="flex justify-between items-center text-[10px] text-slate-400 border-t pt-2.5 select-none font-mono">
                                <span>PUPR Kab. Garut | Bidang Bangunan Gedung</span>
                                <span>Halaman 2 / 2</span>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedFile.type === 'image' && (
                  <div className="w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-slate-200">
                    {/* Header Controls */}
                    <div className="px-4 py-3 bg-slate-950 border-b border-slate-800/80 flex flex-wrap gap-2 items-center justify-between text-xs select-none">
                      <div className="flex items-center gap-2">
                        <span className="font-bold tracking-wide uppercase text-[9px] bg-emerald-600 px-2 py-0.5 rounded text-white shrink-0 font-sans">
                          Smart Inspect AI
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]" title={selectedFile.name}>
                          {selectedFile.name}
                        </span>
                      </div>
                      <div className="flex items-center flex-wrap gap-2">
                        {/* Scale Calibration Factor */}
                        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                          <span className="text-[9px] text-slate-400">Kalibrasi:</span>
                          <select
                            value={pixelToMmScale}
                            onChange={(e) => {
                              setPixelToMmScale(parseFloat(e.target.value));
                              setMeasurePoints([]);
                            }}
                            className="bg-transparent text-[10px] text-emerald-400 border-0 p-0 focus:ring-0 cursor-pointer font-mono outline-none"
                          >
                            <option value="0.1" className="bg-slate-900 text-slate-200">1% = 1.0 mm (Mikro)</option>
                            <option value="0.2" className="bg-slate-900 text-slate-200">1% = 2.0 mm (Semen Dedikasi)</option>
                            <option value="0.5" className="bg-slate-900 text-slate-200">1% = 5.0 mm (Balok Kolom)</option>
                            <option value="1.0" className="bg-slate-900 text-slate-200">1% = 10.0 mm (Dinding Luar)</option>
                          </select>
                        </div>

                        {/* Rotation Button */}
                        <button 
                          onClick={() => setPreviewRotation(r => (r + 90) % 360)}
                          className="flex items-center justify-center p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded transition-colors"
                          title="Putar foto 90°"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Filter Select Dropdown */}
                        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
                          <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <select 
                            value={imageFilter}
                            onChange={(e) => setImageFilter(e.target.value as any)}
                            className="text-[10px] bg-transparent border-0 p-0 text-slate-200 font-sans focus:outline-none focus:ring-0 cursor-pointer outline-none"
                          >
                            <option value="normal" className="bg-slate-900 text-slate-200">Asli / Orisinal</option>
                            <option value="grayscale" className="bg-slate-900 text-slate-200">Contrast Crack Boost</option>
                            <option value="contrast" className="bg-slate-900 text-slate-200">Crushed shadow (Defect)</option>
                            <option value="thermal" className="bg-slate-900 text-slate-200">Inframerah (Moisture Scan)</option>
                            <option value="edge" className="bg-slate-900 text-slate-200">Edge Sketch CAD (Tepi)</option>
                            <option value="lowlight" className="bg-slate-900 text-slate-200">Low-Light Enhance</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Image Workspace */}
                    <div className="flex-1 p-4 bg-slate-950 flex flex-col items-center justify-center relative min-h-[320px] max-h-[380px] overflow-hidden">
                      <div className="relative inline-block select-none max-h-[340px] max-w-full">
                        {/* Wrapper of the rotate function */}
                        <div 
                          className="transition-transform duration-300 relative inline-block overflow-hidden rounded-lg shadow-2xl border border-slate-800"
                          style={{ transform: `rotate(${previewRotation}deg)` }}
                        >
                          <img 
                            src={selectedFile.previewUrl || "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800"} 
                            alt={selectedFile.name} 
                            referrerPolicy="no-referrer"
                            className={cn(
                              "max-h-[300px] w-auto max-w-full object-contain transition-all duration-200",
                              imageFilter === 'grayscale' && "grayscale contrast-[2.8] brightness-[1.05] saturate-[1.6]",
                              imageFilter === 'contrast' && "contrast-[3.2] brightness-[0.8] saturate-50",
                              imageFilter === 'thermal' && "hue-rotate-[145deg] saturate-[3] brightness-[1.1] contrast-[1.4]",
                              imageFilter === 'edge' && "invert contrast-[4.5] brightness-[1.15] saturate-0",
                              imageFilter === 'lowlight' && "brightness-[1.65] contrast-[1.2] saturate-[1.35]"
                            )}
                          />

                          {/* Interactive Overlay Layer inside the rotated div so bounding boxes and measuring line rotate with the image! */}
                          <svg 
                            className={cn(
                              "absolute inset-0 w-full h-full select-none z-10",
                              isMeasuring ? "cursor-crosshair pointer-events-auto" : "cursor-default pointer-events-auto"
                            )}
                            onClick={(e) => {
                              if (!isMeasuring) return;
                              const rect = e.currentTarget.getBoundingClientRect();
                              const x = ((e.clientX - rect.left) / rect.width) * 100;
                              const y = ((e.clientY - rect.top) / rect.height) * 100;
                              
                              if (measurePoints.length >= 2) {
                                setMeasurePoints([{ x, y }]);
                              } else {
                                setMeasurePoints(prev => [...prev, { x, y }]);
                              }
                            }}
                          >
                            {/* Grid Layout Overlay */}
                            {showGrid && (
                              <>
                                {Array.from({ length: 9 }).map((_, i) => (
                                  <line key={`v-${i}`} x1={`${(i + 1) * 10}%`} y1="0" x2={`${(i + 1) * 10}%`} y2="100%" stroke="rgba(16, 185, 129, 0.25)" strokeWidth="1" strokeDasharray="3,3" />
                                ))}
                                {Array.from({ length: 9 }).map((_, i) => (
                                  <line key={`h-${i}`} x1="0" y1={`${(i + 1) * 10}%`} x2="100%" y2={`${(i + 1) * 10}%`} stroke="rgba(16, 185, 129, 0.25)" strokeWidth="1" strokeDasharray="3,3" />
                                ))}
                              </>
                            )}

                            {/* Bounding Boxes / Findings Overlay */}
                            {showAiBoxes && (selectedFile.name === "Foto_Kerusakan_Atap.jpg" ? [
                              { id: 0, x: 25, y: 35, w: 22, h: 28, label: "Plafon Lapuk / Rembesan Air", confidence: 94.5, type: "Kritis" },
                              { id: 1, x: 60, y: 20, w: 25, h: 18, label: "Retakan Struktur Rangka", confidence: 88.2, type: "Sedang" },
                              { id: 2, x: 45, y: 65, w: 18, h: 22, label: "Korosi Penyangga Logam", confidence: 72.1, type: "Ringan" }
                            ] : [
                              { id: 0, x: 35, y: 25, w: 32, h: 48, label: "Retakan Struktur / Defek Visual", confidence: 91.0, type: "Kritis" }
                            ]).map((finding) => {
                              const isHovered = hoveredFinding === finding.id;
                              const isCritical = finding.type === "Kritis";
                              const isMedium = finding.type === "Sedang";
                              const color = isCritical ? "#ef4444" : isMedium ? "#f59e0b" : "#3b82f6";
                              return (
                                <g key={finding.id}>
                                  {/* Dynamic animated rectangle box */}
                                  <rect 
                                    x={`${finding.x}%`} 
                                    y={`${finding.y}%`} 
                                    width={`${finding.w}%`} 
                                    height={`${finding.h}%`} 
                                    fill={isHovered ? "rgba(255, 255, 255, 0.05)" : "none"} 
                                    stroke={color} 
                                    strokeWidth={isHovered ? "3" : "1.5"}
                                    strokeDasharray={isHovered ? "none" : "3,3"}
                                    className="transition-all duration-150 cursor-pointer"
                                    onMouseEnter={() => setHoveredFinding(finding.id)}
                                    onMouseLeave={() => setHoveredFinding(null)}
                                  />
                                  {/* Label Tag on Box */}
                                  <foreignObject
                                    x={`${finding.x}%`}
                                    y={`${Math.max(0, finding.y - 7.5)}%`}
                                    width="160"
                                    height="28"
                                    className="overflow-visible"
                                  >
                                    <div 
                                      className={cn(
                                        "text-[8px] font-bold px-1.5 py-0.5 rounded text-white shadow-md inline-flex items-center gap-1 transition-all pointer-events-none select-none whitespace-nowrap",
                                        isCritical ? "bg-red-600" : isMedium ? "bg-amber-500" : "bg-blue-600"
                                      )}
                                      style={{ transform: isHovered ? "scale(1.1)" : "scale(1)" }}
                                    >
                                      <span>{finding.label}</span>
                                      <span className="opacity-80">({finding.confidence}%)</span>
                                    </div>
                                  </foreignObject>
                                </g>
                              );
                            })}

                            {/* Measurement points & drawing lines */}
                            {measurePoints.map((pt, idx) => (
                              <g key={`pt-${idx}`}>
                                <circle cx={`${pt.x}%`} cy={`${pt.y}%`} r="6" fill="#ef4444" stroke="white" strokeWidth="2" className="animate-ping" />
                                <circle cx={`${pt.x}%`} cy={`${pt.y}%`} r="4.5" fill="#ef4444" stroke="white" strokeWidth="1.5" />
                                <text x={`${pt.x + 2}%`} y={`${pt.y - 2}%`} fill="#ef4444" className="text-[9px] font-bold font-mono stroke-white stroke-[0.3px]">{idx === 0 ? "A" : "B"}</text>
                              </g>
                            ))}
                            
                            {measurePoints.length === 2 && (
                              <g>
                                <line 
                                  x1={`${measurePoints[0].x}%`} 
                                  y1={`${measurePoints[0].y}%`} 
                                  x2={`${measurePoints[1].x}%`} 
                                  y2={`${measurePoints[1].y}%`} 
                                  stroke="#ef4444" 
                                  strokeWidth="2" 
                                  strokeDasharray="4,4" 
                                />
                                <foreignObject
                                  x={`${(measurePoints[0].x + measurePoints[1].x) / 2}%`}
                                  y={`${(measurePoints[0].y + measurePoints[1].y) / 2}%`}
                                  width="120"
                                  height="24"
                                  className="overflow-visible"
                                >
                                  <div className="bg-red-600 text-white font-mono text-[8.5px] px-2 py-0.5 rounded font-bold shadow-xl transform -translate-x-1/2 -translate-y-full inline-block whitespace-nowrap">
                                    📐 Celah: {calculateDistance()} mm
                                  </div>
                                </foreignObject>
                              </g>
                            )}
                          </svg>
                        </div>
                      </div>

                      {/* Filter/Status indicator */}
                      <div className="absolute bottom-3 left-3 bg-slate-950/85 border border-slate-800/80 px-2 py-1 rounded text-[9.5px] text-slate-400 font-mono flex items-center gap-1.5 shadow select-none">
                        <Activity className="w-3 h-3 text-emerald-500 animate-pulse" /> 
                        <span className="uppercase text-slate-300">
                          {imageFilter === 'normal' && "Original Filter"}
                          {imageFilter === 'grayscale' && "Crack Details Enhancer Active"}
                          {imageFilter === 'contrast' && "Shadow & Cavity Contrast Engaged"}
                          {imageFilter === 'thermal' && "Simulated Thermal Heat Mapping"}
                          {imageFilter === 'edge' && "Sobel Line Sketch CAD Draft"}
                          {imageFilter === 'lowlight' && "Low-light Brightness Booster"}
                        </span>
                      </div>
                    </div>

                    {/* Technical Verification Workspace Controls & Findings */}
                    <div className="p-3.5 bg-slate-900 border-t border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3">
                      {/* Left: Assistant Controls (5 cols) */}
                      <div className="md:col-span-5 flex flex-col gap-2 border-r border-slate-800/80 pr-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Alat Bantu Verifikasi
                        </h4>

                        {/* Measuring Toggle */}
                        <div className="flex flex-col gap-1.5">
                          <button
                            onClick={() => {
                              setIsMeasuring(!isMeasuring);
                              setMeasurePoints([]);
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border",
                              isMeasuring 
                                ? "bg-red-500/25 border-red-500/40 text-red-300 shadow" 
                                : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                            )}
                          >
                            <span className="flex items-center gap-1.5">
                              <Ruler className="w-3.5 h-3.5" />
                              Mode Ukur Celah (Ruler)
                            </span>
                            <span className={cn(
                              "px-1.5 py-0.5 text-[8px] rounded uppercase font-bold",
                              isMeasuring ? "bg-red-500 text-white" : "bg-slate-700 text-slate-400"
                            )}>
                              {isMeasuring ? "Aktif" : "Non-Aktif"}
                            </span>
                          </button>
                          
                          {isMeasuring && (
                            <p className="text-[9px] text-red-400 leading-normal animate-pulse select-none px-1">
                              💡 Klik 2 titik pada foto di atas untuk membuat visual garis ukur dan menghitung lebar keretakan (mm).
                            </p>
                          )}
                        </div>

                        {/* Grid Toggle */}
                        <button
                          onClick={() => setShowGrid(!showGrid)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border",
                            showGrid 
                              ? "bg-emerald-500/20 border-emerald-500/35 text-emerald-300 shadow" 
                              : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            <Grid className="w-3.5 h-3.5" />
                            Grid Kelurusan Struktur
                          </span>
                          <span className={cn(
                            "px-1.5 py-0.5 text-[8px] rounded uppercase font-bold",
                            showGrid ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-400"
                          )}>
                            {showGrid ? "ON" : "OFF"}
                          </span>
                        </button>

                        {/* AI Detection Toggle */}
                        <button
                          onClick={() => setShowAiBoxes(!showAiBoxes)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border",
                            showAiBoxes 
                              ? "bg-blue-500/20 border-blue-500/35 text-blue-300 shadow" 
                              : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"
                          )}
                        >
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Highlight Deteksi AI
                          </span>
                          <span className={cn(
                            "px-1.5 py-0.5 text-[8px] rounded uppercase font-bold",
                            showAiBoxes ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400"
                          )}>
                            {showAiBoxes ? "ON" : "OFF"}
                          </span>
                        </button>
                        
                        {measurePoints.length > 0 && (
                          <button
                            onClick={() => setMeasurePoints([])}
                            className="text-right text-[10px] text-slate-500 hover:text-red-400 underline font-mono select-none"
                          >
                            Hapus Hasil Ukuran ({measurePoints.length} titik)
                          </button>
                        )}
                      </div>

                      {/* Right: Detected Findings List (7 cols) */}
                      <div className="md:col-span-7 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center select-none">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Temuan Anomali & Rekomendasi Teknis
                          </h4>
                          <span className="text-[9px] font-mono text-slate-500">
                            Arahkan kursor untuk posisi
                          </span>
                        </div>

                        <div className="space-y-1.5 max-h-[110px] overflow-y-auto custom-scrollbar pr-1">
                          {(selectedFile.name === "Foto_Kerusakan_Atap.jpg" ? [
                            { id: 0, label: "Plafon Lapuk / Rembesan Air", confidence: 94.5, type: "Kritis", recommendation: "Segera bongkar plafon gypsum basah & ganti gording kayu lapuk." },
                            { id: 1, label: "Retakan Struktur Rangka", confidence: 88.2, type: "Sedang", recommendation: "Lakukan injeksi epoksi resin berkekuatan tinggi." },
                            { id: 2, label: "Korosi Penyangga Logam", confidence: 72.1, type: "Ringan", recommendation: "Kikis karat lama & lapisi cat zink-chromate anti-karat." }
                          ] : [
                            { id: 0, label: "Retakan Struktur / Defek Visual", confidence: 91.0, type: "Kritis", recommendation: "Grouting dengan mortar berkekuatan tinggi dan lapisi serat karbon (FRP)." }
                          ]).map((finding) => (
                            <div 
                              key={finding.id}
                              onMouseEnter={() => setHoveredFinding(finding.id)}
                              onMouseLeave={() => setHoveredFinding(null)}
                              className={cn(
                                "p-2 rounded-lg border text-left transition-all duration-150 select-text",
                                hoveredFinding === finding.id 
                                  ? "bg-slate-800 border-slate-700/80 shadow-md translate-x-1" 
                                  : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-850"
                              )}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={cn(
                                    "w-1.5 h-1.5 rounded-full",
                                    finding.type === "Kritis" ? "bg-red-500" : finding.type === "Sedang" ? "bg-amber-500" : "bg-blue-500"
                                  )} />
                                  <span className="font-semibold text-[10.5px] text-slate-100">{finding.label}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[8.5px] font-bold font-mono text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded">
                                    AI {finding.confidence}%
                                  </span>
                                  <span className={cn(
                                    "text-[8px] font-extrabold px-1 py-0.2 rounded uppercase tracking-wider",
                                    finding.type === "Kritis" ? "bg-red-500/20 text-red-400" : finding.type === "Sedang" ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
                                  )}>
                                    {finding.type}
                                  </span>
                                </div>
                              </div>
                              <p className="text-[9.5px] text-slate-400 leading-normal">
                                <strong className="text-slate-300">Rekomendasi:</strong> {finding.recommendation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedFile.type === 'word' && (
                  <div className="w-full h-full flex flex-col bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-md">
                    {/* Ribbon */}
                    <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between text-blue-900 text-xs select-none font-bold">
                      <div className="flex items-center gap-1.5">
                        <File className="w-4 h-4 text-sky-600 fill-sky-600/10 shrink-0" />
                        <span>Word Live Editor</span>
                      </div>
                      <div className="text-[10px] text-blue-700 bg-blue-100/50 px-2.5 py-0.5 rounded-full font-sans">
                        Format Laporan Resmi (.docx)
                      </div>
                    </div>

                    {/* Word Editor Canvas Page */}
                    <div className="flex-1 p-5 bg-slate-100 overflow-y-auto custom-scrollbar flex justify-center min-h-[320px]">
                      <div className="w-full max-w-[500px] bg-white border border-slate-200 shadow-sm p-6 rounded-lg text-slate-800 text-xs min-h-[380px] flex flex-col text-left">
                        <textarea
                          value={selectedFile.content || ""}
                          onChange={(e) => handleWordContentChange(e.target.value)}
                          placeholder="Ketik isi laporan surat rekomendasi resmi di sini..."
                          className="flex-1 w-full bg-transparent border-0 resize-none focus:outline-none focus:ring-0 text-slate-700 leading-relaxed font-sans text-xs"
                          style={{ minHeight: "350px" }}
                        />
                        <div className="mt-4 border-t pt-2 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                          <span>Total Karakter: {(selectedFile.content || "").length}</span>
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5"><CheckCircle2 className="w-3 h-3" /> Auto-Save</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {selectedFile.type === 'excel' && (
                  <div className="w-full h-full flex flex-col bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-md">
                    {/* Excel Sheet Controls */}
                    <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-emerald-900 text-xs select-none font-bold">
                      <div className="flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Spreadsheet Evaluasi Biaya</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {selectedFile.excelData?.sheets.map((sheet, idx) => (
                          <button
                            key={sheet.name}
                            onClick={() => setSelectedSheet(idx)}
                            className={cn(
                              "px-2.5 py-1 text-[10px] rounded-md transition-all",
                              selectedSheet === idx 
                                ? "bg-emerald-600 text-white shadow-xs" 
                                : "text-emerald-800 hover:bg-emerald-100/60"
                            )}
                          >
                            {sheet.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sheet Grid rendering */}
                    <div className="flex-1 p-3 bg-slate-50 overflow-auto custom-scrollbar min-h-[300px]">
                      {selectedFile.excelData && (
                        <div className="inline-block min-w-full align-middle border border-slate-200 rounded-lg overflow-hidden bg-white">
                          <table className="min-w-full border-collapse text-left text-xs text-slate-700">
                            <thead>
                              <tr className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200">
                                <th className="p-1.5 border-r border-slate-200 text-center w-8 bg-slate-200/60"></th>
                                {["A", "B", "C", "D", "E", "F"].map((col) => (
                                  <th key={col} className="p-1.5 border-r border-slate-200 text-center font-mono text-[10px]">{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {selectedFile.excelData.sheets[selectedSheet].rows.map((row, rIdx) => {
                                const isHeader = rIdx === 0;
                                const isTotalRow = rIdx === selectedFile.excelData!.sheets[selectedSheet].rows.length - 1;
                                return (
                                  <tr 
                                    key={rIdx} 
                                    className={cn(
                                      "border-b border-slate-100 hover:bg-slate-50/50",
                                      isHeader ? "bg-slate-50/70 font-semibold" : "",
                                      isTotalRow ? "bg-amber-50/40 font-bold border-t-2 border-slate-300" : ""
                                    )}
                                  >
                                    <td className="p-1.5 border-r border-slate-200 text-center bg-slate-100/50 text-[10px] font-mono text-slate-400 select-none">
                                      {rIdx + 1}
                                    </td>
                                    {row.map((cell, cIdx) => {
                                      const isEditable = !isHeader && cIdx > 0 && !isTotalRow;
                                      return (
                                        <td 
                                          key={cIdx} 
                                          className={cn(
                                            "p-1.5 border-r border-slate-200 max-w-[150px] truncate",
                                            cIdx === 4 || cIdx === 5 ? "text-right font-mono text-[11px]" : "",
                                            isTotalRow && cIdx === 5 ? "text-emerald-700 font-bold" : ""
                                          )}
                                        >
                                          {isEditable ? (
                                            <input 
                                              type="text" 
                                              value={cell} 
                                              onChange={(e) => handleExcelCellChange(selectedSheet, rIdx, cIdx, e.target.value)}
                                              className="w-full bg-transparent border-0 focus:bg-amber-50/60 focus:ring-1 focus:ring-emerald-500 p-0 text-slate-800 text-xs focus:outline-none"
                                            />
                                          ) : (
                                            cIdx === 4 || cIdx === 5 ? (
                                              cell ? "Rp " + parseFloat(cell).toLocaleString('id-ID') : "--"
                                            ) : cell
                                          )}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedFile.type === 'other' && (
                  <div className="p-10 text-center text-slate-500 space-y-3 bg-white/70 border border-slate-200 rounded-2xl max-w-sm">
                    <File className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-xs font-bold text-slate-700">Format Pratinjau Terbatas</p>
                    <p className="text-[10px] text-slate-400">
                      Berkas "{selectedFile.name}" terdaftar dalam format eksternal. Anda tetap dapat mengunduh berkas secara penuh untuk dibuka di perangkat Anda.
                    </p>
                  </div>
                )}
                
              </div>

              {/* RIGHT CONTAINER: Interactive Side Pane inside Modal (Tabs: AI Audit, Discussions, Metadata) */}
              <div className="w-full lg:w-2/5 h-full overflow-y-auto flex flex-col gap-4 custom-scrollbar pr-1 select-none">
                
                {/* Tab Selectors for Modal Side Pane */}
                <div className="flex border-b border-slate-100 p-1 bg-slate-50 rounded-xl">
                  <button 
                    onClick={() => setModalActiveTab('ai')}
                    className={cn(
                      "flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                      modalActiveTab === 'ai' 
                        ? "bg-white text-blue-600 shadow-xs border border-slate-200/40 font-bold" 
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                    )}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    Analisis AI ({aiAnalysisResult ? "Selesai" : "Mulai"})
                  </button>
                  <button 
                    onClick={() => setModalActiveTab('discussions')}
                    className={cn(
                      "flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                      modalActiveTab === 'discussions' 
                        ? "bg-white text-blue-600 shadow-xs border border-slate-200/40 font-bold" 
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                    )}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                    Diskusi ({selectedFile.comments?.length || 0})
                  </button>
                  <button 
                    onClick={() => setModalActiveTab('metadata')}
                    className={cn(
                      "flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                      modalActiveTab === 'metadata' 
                        ? "bg-white text-blue-600 shadow-xs border border-slate-200/40 font-bold" 
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                    )}
                  >
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    Atribut & Log
                  </button>
                </div>

                {/* TAB 1 CONTENT: AI AUDITOR */}
                {modalActiveTab === 'ai' && (
                  <div className="flex-1 flex flex-col gap-3 min-h-0 select-text">
                    {/* Status card */}
                    <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">AI AUDIT STATUS</span>
                        <span className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-[9px] font-mono">
                          Gemini 1.5 Flash
                        </span>
                      </div>
                      
                      {!aiAnalysisResult && !isAiAnalyzing ? (
                        <div className="text-center py-2">
                          <p className="text-xs text-slate-300 font-semibold">Jalankan audit AI untuk menganalisis isi dokumen ini secara komprehensif.</p>
                          <button 
                            onClick={handleRunAiAnalysis}
                            className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 mx-auto hover:scale-[1.02]"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            Mulai Audit AI Cerdas
                          </button>
                        </div>
                      ) : isAiAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-4 space-y-2">
                          <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                          <p className="text-[11px] text-slate-300 font-medium animate-pulse">Memindai dokumen & merumuskan kepatuhan teknis...</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-xs text-slate-400">Status Kelayakan:</span>
                            <span className={cn(
                              "text-xs font-bold px-2 py-0.5 rounded-md",
                              aiAnalysisResult.complianceStatus.toLowerCase().includes("kritis") || aiAnalysisResult.complianceStatus.toLowerCase().includes("tidak")
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            )}>
                              {aiAnalysisResult.complianceStatus}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Skor Keandalan (AI):</span>
                            <span className="text-xs font-bold text-blue-300 font-mono">{aiAnalysisResult.confidenceScore}%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Chat History Container */}
                    <div className="flex-1 bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col min-h-[220px] overflow-hidden">
                      <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 custom-scrollbar text-xs">
                        {aiChatHistory.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-4 py-8">
                            <Sparkles className="w-8 h-8 text-slate-300 mb-2" />
                            <p className="font-bold text-slate-500">Asisten AI Auditor Cipta Karya</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Tanyakan detail teknis dokumen, validasi anggaran, atau kepatuhan regulasi di sini.</p>
                          </div>
                        ) : (
                          aiChatHistory.map((chat, idx) => (
                            <div key={idx} className={cn("flex flex-col space-y-1.5", chat.sender === 'user' ? "items-end" : "items-start")}>
                              <span className="text-[9px] font-bold text-slate-400 select-none">
                                {chat.sender === 'user' ? 'Anda' : 'Auditor AI'}
                              </span>
                              <div className={cn(
                                "p-3 rounded-2xl max-w-[85%] leading-relaxed shadow-xs font-semibold",
                                chat.sender === 'user' 
                                  ? "bg-blue-600 text-white rounded-tr-none" 
                                  : "bg-white text-slate-800 border border-slate-200/60 rounded-tl-none whitespace-pre-wrap"
                              )}>
                                {chat.text}
                              </div>
                            </div>
                          ))
                        )}
                        {isAiTyping && (
                          <div className="flex flex-col items-start space-y-1.5">
                            <span className="text-[9px] font-bold text-slate-400 select-none">Auditor AI</span>
                            <div className="bg-white text-slate-500 p-3 rounded-2xl rounded-tl-none border border-slate-200/50 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Digital stamp & certify option */}
                      {aiAnalysisResult && !isAiAnalyzing && (
                        <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between select-none">
                          <span className="text-[10px] text-slate-500 font-bold">Validasi Berkas Resmi:</span>
                          <button 
                            onClick={() => {
                              setIsDigitallySigned(true);
                              const updatedActs = [
                                { action: "Tanda Tangan Digital Dibubuhkan", time: new Date().toISOString(), user: localStorage.getItem("activeUserName") || activeRole.replace("_", " ") },
                                ...(selectedFile.activities || [])
                              ];
                              setFiles(prev => prev.map(f => f.id === selectedFile.id ? { ...f, activities: updatedActs } : f));
                              setSelectedFile(prev => prev ? { ...prev, activities: updatedActs } : null);
                            }}
                            disabled={isDigitallySigned}
                            className={cn(
                              "px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-xs transition-all flex items-center gap-1 border",
                              isDigitallySigned 
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default" 
                                : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent hover:scale-[1.02]"
                            )}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isDigitallySigned ? "Telah Disertifikasi" : "Bubuhkan Digital Stamp"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Send message form */}
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder={aiAnalysisResult ? "Tanyakan hal teknis lain mengenai berkas..." : "Jalankan Audit AI terlebih dahulu..."}
                        value={aiChatQuery}
                        onChange={(e) => setAiChatQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' ? handleSendAiChatQuery() : null}
                        disabled={!aiAnalysisResult || isAiTyping}
                        className="flex-1 text-xs border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50 font-bold shadow-inner"
                      />
                      <button 
                        onClick={handleSendAiChatQuery}
                        disabled={!aiAnalysisResult || isAiTyping || !aiChatQuery.trim()}
                        className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl shadow transition-all flex items-center justify-center"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 2 CONTENT: DISCUSSIONS */}
                {modalActiveTab === 'discussions' && (
                  <div className="flex-1 flex flex-col min-h-0 justify-between select-text">
                    <div className="flex-1 flex flex-col min-h-0">
                      {/* Comment Stream */}
                      <div className="flex-1 overflow-y-auto space-y-3 pb-3 pr-1 custom-scrollbar text-xs">
                        {(!selectedFile.comments || selectedFile.comments.length === 0) ? (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 text-center">
                            <MessageSquare className="w-8 h-8 text-slate-300 mb-1" />
                            <p className="font-bold text-slate-500">Belum ada diskusi</p>
                            <p className="text-[10px] text-slate-400">Tulis catatan verifikasi atau koordinasi pertama Anda mengenai berkas ini.</p>
                          </div>
                        ) : (
                          selectedFile.comments.map((c) => (
                            <div key={c.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col space-y-1 shadow-xs text-left">
                              <div className="flex items-center justify-between text-[10px] text-slate-400 select-none pb-1 border-b border-slate-200/40">
                                <span className="font-bold text-slate-700 flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                                  {c.user} <span className="font-normal text-slate-400">({c.role})</span>
                                </span>
                                <span>{new Date(c.time).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</span>
                              </div>
                              <p className="text-slate-700 leading-relaxed font-semibold pt-1">{c.text}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Add Comment Input */}
                    <div className="flex gap-2 pt-2 border-t border-slate-100">
                      <input
                        type="text"
                        placeholder="Tulis saran, verifikasi, atau disposisi berkas..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' ? handleAddComment() : null}
                        className="flex-1 text-xs border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none shadow-inner font-bold"
                      />
                      <button 
                        onClick={handleAddComment}
                        className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3 CONTENT: METADATA & ACTIONS LOG */}
                {modalActiveTab === 'metadata' && (
                  <div className="space-y-4 text-left select-text text-xs">
                    
                    {/* Description field */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-xs space-y-1">
                      <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider select-none">
                        Deskripsi Berkas / Rincian Penilai
                      </h4>
                      {isEditingMetadata ? (
                        <textarea
                          value={editedDescription}
                          onChange={(e) => setEditedDescription(e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:ring-1 focus:ring-blue-500 bg-white font-semibold"
                          rows={3}
                        />
                      ) : (
                        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                          {selectedFile.description || "Tidak ada rincian deskripsi tambahan untuk berkas ini."}
                        </p>
                      )}
                    </div>

                    {/* General Metadata Attributes Grid */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
                      <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b pb-1 select-none">
                        Atribut Dokumen Resmi
                      </h4>
                      
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <span className="text-slate-400 font-bold text-[9px] block uppercase tracking-wider select-none">Uploader / Pemilik</span>
                          <span className="font-bold text-slate-700 flex items-center gap-1.5 truncate">
                            <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-mono text-[9px] text-slate-600 font-bold shrink-0">
                              {selectedFile.author.substring(0, 1)}
                            </span>
                            {selectedFile.author}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-400 font-bold text-[9px] block uppercase tracking-wider select-none">Ukuran File</span>
                          <span className="font-bold text-slate-700 font-mono">{formatSize(selectedFile.size)}</span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-400 font-bold text-[9px] block uppercase tracking-wider select-none">Modifikasi Terakhir</span>
                          <span className="font-bold text-slate-700 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {new Date(selectedFile.updatedAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <span className="text-slate-400 font-bold text-[9px] block uppercase tracking-wider select-none">Hak Akses</span>
                          <span className="font-bold text-slate-700 flex items-center gap-1.5 truncate" title={selectedFile.accessRole.join(", ")}>
                            <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            {selectedFile.accessRole.length} Role
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Log History */}
                    {selectedFile.activities && selectedFile.activities.length > 0 && (
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2">
                        <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b pb-1 select-none">
                          <Activity className="w-3.5 h-3.5 text-slate-400" />
                          Log Aktivitas Berkas
                        </h4>
                        <div className="space-y-2.5 pt-1 font-mono text-[9px] max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                          {selectedFile.activities.map((act, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-slate-500">
                              <span className="text-blue-500 shrink-0 mt-0.5">•</span>
                              <div className="flex-1">
                                <p className="font-bold text-slate-700 leading-snug">{act.action}</p>
                                <p className="text-slate-400 mt-0.5">Oleh {act.user} — {new Date(act.time).toLocaleDateString('id-ID')} {new Date(act.time).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                  </div>
                )}

              </div>

            </div>
          </motion.div>
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
