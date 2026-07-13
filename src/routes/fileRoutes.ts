import { Router, Request, Response } from "express";

const router = Router();

export const MOCK_FILES = [
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
    description: "Laporan komprehensif hasil penilaian kondisi fisik bangunan gedung SDN 1 Garut.",
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
    previewUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop"
  }
];

router.get("/", (req: Request, res: Response) => {
  res.json(MOCK_FILES);
});

export default router;
