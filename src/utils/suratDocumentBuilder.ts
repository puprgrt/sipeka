import { replaceTemplatePlaceholders, DEFAULT_TEMPLATE_SURAT_PERMOHONAN } from "./templateUtils";

export interface SuratPermohonanContentContext {
  schoolName?: string;
  buildingName?: string;
  npsn?: string;
  address?: string;
  buildingArea?: number | string;
  floorCount?: number | string;
  coordinates?: { lat: number; lng: number } | null;
  letterReferenceNo?: string;
  tanggal?: string;
  letterConfig?: any;
  namaInstansiAtas?: string;
  namaInstansiBawah?: string;
  alamatPemohon?: string;
  namaPengirim?: string;
  jabatanPengirim?: string;
  nipPengirim?: string;
  customTemplate?: string;
}

export function buildSuratPermohonanContent(context: SuratPermohonanContentContext): string {
  const pengelolaKop = context.letterConfig?.pengelola || {};
  const tanggal = context.tanggal || new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const templateToUse = context.customTemplate || DEFAULT_TEMPLATE_SURAT_PERMOHONAN;

  return replaceTemplatePlaceholders(templateToUse, {
    namaInstansiAtas: context.namaInstansiAtas || pengelolaKop?.namaInstansiAtas || "PEMERINTAH KABUPATEN GARUT",
    namaInstansiBawah: context.namaInstansiBawah || pengelolaKop?.namaInstansiBawah || context.schoolName || "UPTD SATUAN PENDIDIKAN",
    alamatPemohon: context.alamatPemohon || pengelolaKop?.alamat || context.address || "Jl. Raya Pembangunan No. 123",
    nomorSurat: context.letterReferenceNo || "-",
    tanggal,
    namaSekolah: context.schoolName || "-",
    namaBangunan: context.buildingName || "-",
    npsn: context.npsn || "-",
    luasBangunan: String(context.buildingArea || 0),
    jumlahLantai: String(context.floorCount || 0),
    alamatBangunan: context.address || "-",
    koordinatGps: context.coordinates ? `${context.coordinates.lat}, ${context.coordinates.lng}` : "-",
    namaPengirim: context.namaPengirim || pengelolaKop?.namaKepala || "Nama Pengirim",
    jabatanPengirim: context.jabatanPengirim || pengelolaKop?.jabatan || "Jabatan",
    nipPengirim: context.nipPengirim || pengelolaKop?.nipKepala || "-"
  });
}
