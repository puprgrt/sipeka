import { cn } from "./utils";

export const STATUS_OPTIONS = [
  { value: "Menunggu_Validasi", label: "Menunggu Validasi" },
  { value: "Verifikasi_Berkas", label: "Verifikasi Berkas" },
  { value: "Survei_Lapangan", label: "Survei Lapangan" },
  { value: "Selesai_Dianalisis", label: "Selesai Dianalisis" },
  { value: "Menunggu_TTE_Koordinator", label: "TTE Koordinator" },
  { value: "Menunggu_TTE_Kabid", label: "TTE Kabid" },
  { value: "Menunggu_Validasi_Kadis", label: "Validasi Kadis" },
  { value: "Arsip_Digital", label: "Arsip Digital" }
];

export const STATUS_TABS = [
  { id: 'Semua', label: 'Semua' },
  ...STATUS_OPTIONS.map(opt => ({ id: opt.value, label: opt.label }))
];

export function getStatusBadgeClasses(status?: string | null) {
  const currentStatus = status || "Menunggu_Validasi";
  
  switch(currentStatus) {
    case "Menunggu_Validasi":
    case "Verifikasi_Berkas":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "Survei_Lapangan":
      return "bg-blue-50 text-blue-800 border-blue-200";
    case "Selesai_Dianalisis":
      return "bg-purple-50 text-purple-800 border-purple-200";
    case "Menunggu_TTE_Koordinator":
    case "Menunggu_TTE_Kabid":
    case "Menunggu_Validasi_Kadis":
      return "bg-indigo-50 text-indigo-800 border-indigo-200";
    case "Arsip_Digital":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    default:
      return "bg-slate-50 text-slate-800 border-slate-200";
  }
}

export function formatStatusText(status?: string | null) {
  const currentStatus = status || "Menunggu_Validasi";
  const found = STATUS_OPTIONS.find(o => o.value === currentStatus);
  return found ? found.label : currentStatus.replace(/_/g, " ");
}
