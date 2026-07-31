import { replaceTemplatePlaceholders } from "./templateUtils";

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

  const templateToUse = context.customTemplate || `SURAT PERMOHONAN
PENILAIAN KERUSAKAN BANGUNAN GEDUNG

{{namaInstansiAtas}}
{{namaInstansiBawah}}

{{namaSekolah}}
{{alamatPemohon}}

------------------------------------------------------------

Garut, {{tanggal}}

Nomor      : {{nomorSurat}}
Sifat      : Biasa
Lampiran   : 1 (satu) berkas
Hal        : Permohonan Penilaian Kerusakan Bangunan Gedung
            {{namaSekolah}}

Yth.
Kepala Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut
Di Garut

Dengan hormat,

Dalam rangka menjamin keselamatan, keamanan, kenyamanan,
dan keberlanjutan fungsi bangunan gedung pada {{namaInstansiBawah}},
bersama ini kami mengajukan permohonan Analisis dan Perhitungan
Kerusakan Bangunan Gedung terhadap bangunan yang berada pada lokasi berikut:

1. Identitas Bangunan Gedung:
Nama Bangunan   : {{namaBangunan}}
NPSN            : {{npsn}}
Luas            : {{luasBangunan}} m²
Jumlah Lantai   : {{jumlahLantai}}
Alamat Bangunan : {{alamatBangunan}}
Desa/Kelurahan  :
Kecamatan       :
Kabupaten/Kota  : Garut
Koordinat       : {{koordinatGps}}

Sehubungan dengan data penilaian mandiri yang dilampirkan,
diperlukan guna mengetahui tingkat kerusakan bangunan secara
kuantitatif dan kualitatif sesuai ketentuan teknis yang berlaku.

Demikian permohonan ini kami sampaikan. Besar harapan kami agar
dapat dilakukan pemeriksaan lapangan, analisis teknis, dan
perhitungan tingkat kerusakan bangunan gedung dimaksud sebagai
dasar pengambilan kebijakan penanganan serta penyusunan kebutuhan
anggaran rehabilitasi bangunan.

Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.

Hormat kami,

{{jabatanPengirim}}
 
[QR CODE TTE: TTE-PERMOHONAN-{{nomorSurat}}]
 
{{namaPengirim}}
NIP. {{nipPengirim}}`;

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
