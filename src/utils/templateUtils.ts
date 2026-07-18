/**
 * Template Utilities untuk Pusat Template Dokumen SIPEKA
 * Mengelola placeholder replacement, default templates, dan preview
 */

// Tipe data template
export interface DocumentTemplate {
  id: string;
  nama: string;
  deskripsi: string;
  kategori: 'surat' | 'lampiran';
  kontenHtml: string;
  placeholders: PlaceholderInfo[];
  driveLink?: string;
  updatedAt?: string;
}

export interface PlaceholderInfo {
  key: string;
  label: string;
  contoh: string;
}

// ========================
// DAFTAR PLACEHOLDER PER TEMPLATE
// ========================

export const PLACEHOLDERS_SURAT_PERMOHONAN: PlaceholderInfo[] = [
  { key: "namaInstansiAtas", label: "Nama Instansi Atas (Pemda)", contoh: "PEMERINTAH KABUPATEN GARUT" },
  { key: "namaInstansiBawah", label: "Nama Lembaga/Sekolah", contoh: "SDN 1 TAROGONG KIDUL" },
  { key: "alamatPemohon", label: "Alamat Pemohon", contoh: "Jl. Raya Samarang No. 10, Garut" },
  { key: "nomorSurat", label: "Nomor Surat", contoh: "045/SDN-01/VII/2026" },
  { key: "tanggal", label: "Tanggal Surat", contoh: "14 Juli 2026" },
  { key: "namaSekolah", label: "Nama Sekolah/Instansi", contoh: "SDN 1 Tarogong Kidul" },
  { key: "namaBangunan", label: "Nama Bangunan", contoh: "Gedung Utama Lantai 1" },
  { key: "npsn", label: "NPSN/NUP", contoh: "20211234" },
  { key: "luasBangunan", label: "Luas Bangunan (m²)", contoh: "450" },
  { key: "jumlahLantai", label: "Jumlah Lantai", contoh: "2" },
  { key: "alamatBangunan", label: "Alamat Bangunan", contoh: "Jl. Raya Samarang No. 10, Garut" },
  { key: "koordinatGps", label: "Koordinat GPS", contoh: "-7.2115, 107.9015" },
  { key: "namaPengirim", label: "Nama Pengirim/Pemohon", contoh: "H. Ahmad Sudrajat, S.Pd." },
  { key: "nipPengirim", label: "NIP Pengirim/Pemohon", contoh: "19700101 199803 1 004" },
  { key: "jabatanPengirim", label: "Jabatan Pengirim", contoh: "Kepala Sekolah" },
];

export const PLACEHOLDERS_SURAT_HASIL: PlaceholderInfo[] = [
  { key: "namaInstansiAtas", label: "Nama Instansi Atas", contoh: "PEMERINTAH KABUPATEN GARUT" },
  { key: "namaDinas", label: "Nama Dinas", contoh: "DINAS PEKERJAAN UMUM DAN PENATAAN RUANG" },
  { key: "alamatDinas", label: "Alamat Dinas", contoh: "Jl. Prof. KH. Cecep Syarifudin No. 117, Garut" },
  { key: "nomorSurat", label: "Nomor Surat", contoh: "AB1C2D/PUPR/2026" },
  { key: "tanggal", label: "Tanggal", contoh: "14 Juli 2026" },
  { key: "namaSekolah", label: "Nama Instansi/Sekolah", contoh: "SDN 1 Tarogong Kidul" },
  { key: "namaBangunan", label: "Nama Bangunan", contoh: "Gedung Utama Lantai 1" },
  { key: "totalKerusakan", label: "Total Persentase Kerusakan", contoh: "35.50%" },
  { key: "kategoriKerusakan", label: "Kategori Kerusakan", contoh: "Rusak Sedang" },
  { key: "namaKadis", label: "Nama Kepala Dinas", contoh: "Ir. H. Kepala Dinas, M.T." },
  { key: "nipKadis", label: "NIP Kepala Dinas", contoh: "19700101 199803 1 004" },
];

export const PLACEHOLDERS_LEMBAR_DISPOSISI: PlaceholderInfo[] = [
  { key: "namaInstansiAtas", label: "Nama Instansi Atas", contoh: "PEMERINTAH KABUPATEN GARUT" },
  { key: "namaDinas", label: "Nama Dinas", contoh: "DINAS PEKERJAAN UMUM DAN PENATAAN RUANG" },
  { key: "alamatDinas", label: "Alamat Dinas", contoh: "Jl. Prof. KH. Cecep Syarifudin No. 117, Garut" },
  { key: "nomorAgenda", label: "Nomor Agenda", contoh: "AGD-AB1C2" },
  { key: "tanggalDisposisi", label: "Tanggal Disposisi", contoh: "14 Juli 2026" },
  { key: "asalSurat", label: "Asal Surat", contoh: "SDN 1 Tarogong Kidul" },
  { key: "perihal", label: "Perihal", contoh: "Permohonan Penilaian Kerusakan Bangunan" },
  { key: "catatanPimpinan", label: "Catatan Pimpinan", contoh: "Mohon segera diverifikasi kelengkapan administrasinya." },
];

export const PLACEHOLDERS_LAMPIRAN_XLSX: PlaceholderInfo[] = [
  { key: "namaSekolah", label: "Nama Sekolah/Instansi", contoh: "SDN 1 Tarogong Kidul" },
  { key: "namaBangunan", label: "Nama Bangunan", contoh: "Gedung Utama Lantai 1" },
  { key: "tanggal", label: "Tanggal Penilaian", contoh: "14 Juli 2026" },
  { key: "jumlahLantai", label: "Jumlah Lantai", contoh: "2" },
  { key: "totalKerusakan", label: "Total Kerusakan (%)", contoh: "35.50" },
  { key: "kategoriKerusakan", label: "Kategori Kerusakan", contoh: "Rusak Sedang" },
];


// ========================
// DEFAULT TEMPLATE HTML
// ========================

export const DEFAULT_TEMPLATE_SURAT_PERMOHONAN = `<html>
<head>
  <title>Surat Permohonan Penilaian Kerusakan</title>
  <style>
    body { font-family: 'Arial', sans-serif; padding: 40px; line-height: 1.5; font-size: 14px; }
    .kop { display: flex; align-items: center; border-bottom: 2px solid black; padding-bottom: 10px; margin-bottom: 20px; }
    .kop-logo { width: 80px; height: auto; margin-right: 20px; }
    .kop-text { flex: 1; text-align: center; }
    .kop-text h1 { font-size: 16px; margin: 0; font-weight: bold; }
    .kop-text h2 { font-size: 14px; margin: 0; font-weight: bold; }
    .kop-text p { font-size: 12px; margin: 0; }
    .date-right { text-align: right; margin-bottom: 20px; }
    .meta-table { width: 100%; margin-bottom: 20px; border: none; }
    .meta-table td { vertical-align: top; padding: 2px; }
    .meta-table td:nth-child(1) { width: 80px; }
    .meta-table td:nth-child(2) { width: 10px; }
    .content { text-align: justify; }
    .content-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .content-table td { border: 1px solid black; padding: 5px 8px; }
    .content-table td:nth-child(1) { width: 40%; }
    .content-table td:nth-child(2) { width: 5%; text-align: center; border-right: none; }
    .content-table td:nth-child(3) { border-left: none; }
    .signature { float: right; text-align: center; margin-top: 40px; width: 250px; }
    .signature p { margin: 2px 0; }
    .barcode { margin: 40px 0; color: #555; }
    .clear { clear: both; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="kop">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Lambang_Kabupaten_Garut.png/400px-Lambang_Kabupaten_Garut.png" alt="Logo" class="kop-logo" />
    <div class="kop-text">
      <h1>{{namaInstansiAtas}}</h1>
      <h1>{{namaInstansiBawah}}</h1>
      <h2>{{namaSekolah}}</h2>
      <p>{{alamatPemohon}}</p>
    </div>
  </div>

  <div class="date-right">
    Garut, {{tanggal}}
  </div>

  <table class="meta-table">
    <tr>
      <td>Nomor</td><td>:</td><td>{{nomorSurat}}</td>
    </tr>
    <tr>
      <td>Sifat</td><td>:</td><td>Biasa</td>
    </tr>
    <tr>
      <td>Lampiran</td><td>:</td><td>1 Berkas</td>
    </tr>
    <tr>
      <td>Hal</td><td>:</td>
      <td>
        Permohonan Penilaian<br/>
        Kerusakan Bangunan Gedung<br/>
        {{namaSekolah}}
      </td>
    </tr>
  </table>

  <div class="content">
    <p>
      Yth. Kepala Dinas Pekerjaan Umum dan<br/>
      Penataan Ruang Kabupaten Garut<br/>
      di<br/>
      &nbsp;&nbsp;&nbsp;&nbsp;Garut
    </p>

    <p style="text-indent: 40px;">
      Dalam rangka menjamin keselamatan, keamanan, kenyamanan, dan keberlanjutan fungsi bangunan gedung pada {{namaInstansiBawah}}, bersama ini kami mengajukan permohonan <b>Analisis dan Perhitungan Kerusakan Bangunan Gedung</b> terhadap bangunan yang berada pada lokasi berikut:
    </p>

    <p>1. Identitas Bangunan Gedung:</p>
    
    <table class="content-table">
      <tr>
        <td>Nama Bangunan</td><td style="border-right: none;">:</td><td style="border-left: none;">{{namaBangunan}}</td>
      </tr>
      <tr>
        <td>NPSN</td><td style="border-right: none;">:</td><td style="border-left: none;">{{npsn}}</td>
      </tr>
      <tr>
        <td>Luas</td><td style="border-right: none;">:</td><td style="border-left: none;">{{luasBangunan}} m&sup2;</td>
      </tr>
      <tr>
        <td>Jumlah Lantai</td><td style="border-right: none;">:</td><td style="border-left: none;">{{jumlahLantai}}</td>
      </tr>
      <tr>
        <td>Alamat Bangunan</td><td style="border-right: none;">:</td><td style="border-left: none;">{{alamatBangunan}}</td>
      </tr>
      <tr>
        <td>Desa/Kelurahan</td><td style="border-right: none;">:</td><td style="border-left: none;"></td>
      </tr>
      <tr>
        <td>Kecamatan</td><td style="border-right: none;">:</td><td style="border-left: none;"></td>
      </tr>
      <tr>
        <td>Kabupaten/Kota</td><td style="border-right: none;">:</td><td style="border-left: none;">Garut</td>
      </tr>
      <tr>
        <td>Koordinat</td><td style="border-right: none;">:</td><td style="border-left: none;">{{koordinatGps}}</td>
      </tr>
    </table>

    <p style="text-indent: 40px;">
      Sehubungan dengan data penilaian mandiri yang dilampirkan, diperlukan guna mengetahui tingkat kerusakan bangunan secara kuantitatif dan kualitatif sesuai ketentuan teknis yang berlaku.
    </p>
    <p style="text-indent: 40px;">
      Demikian permohonan ini kami sampaikan. Besar harapan kami agar dapat dilakukan pemeriksaan lapangan, analisis teknis, dan perhitungan tingkat kerusakan bangunan gedung dimaksud sebagai dasar pengambilan kebijakan penanganan serta penyusunan kebutuhan anggaran rehabilitasi bangunan.
    </p>
    <p style="text-indent: 40px;">
      Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.
    </p>
  </div>

  <div class="signature">
    <p>{{jabatanPengirim}},</p>
    <p class="barcode">BARCODE TTE</p>
    <p><u>{{namaPengirim}}</u></p>
    <p>NIP. {{nipPengirim}}</p>
  </div>
  <div class="clear"></div>
</body>
</html>`;

export const DEFAULT_TEMPLATE_SURAT_HASIL = `<html>
<head>
  <title>Surat Hasil Perhitungan Penilaian Kerusakan</title>
  <style>
    body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; }
    h1 { font-size: 16px; font-weight: bold; text-transform: uppercase; text-align: center; margin-bottom: 5px; }
    h2 { font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 20px; text-decoration: underline; }
    .kop { text-align: center; border-bottom: 3px double black; padding-bottom: 10px; margin-bottom: 30px; }
    .kop h1 { margin: 0; }
    .kop p { font-size: 11px; margin: 2px 0; }
    .content { text-align: justify; font-size: 13px; }
    .content table { width: 100%; margin: 15px 0; border-collapse: collapse; }
    .content table td { padding: 4px 8px; font-size: 13px; }
    .content table td:first-child { width: 35%; }
    .signature { text-align: right; margin-top: 50px; font-size: 13px; }
    .signature p { margin: 2px 0; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="kop">
    <h1>{{namaInstansiAtas}}</h1>
    <h1>{{namaDinas}}</h1>
    <p>{{alamatDinas}}</p>
  </div>

  <h2>SURAT HASIL PERHITUNGAN PENILAIAN KERUSAKAN BANGUNAN</h2>
  <p style="text-align:center;">Nomor: {{nomorSurat}}</p>

  <div class="content">
    <p>Berdasarkan hasil survei teknis dan analisis perhitungan kerusakan yang telah dilaksanakan pada:</p>
    <table>
      <tr><td>Nama Instansi</td><td>: {{namaSekolah}}</td></tr>
      <tr><td>Nama Bangunan</td><td>: {{namaBangunan}}</td></tr>
      <tr><td>Total Kerusakan</td><td>: {{totalKerusakan}}</td></tr>
      <tr><td>Kategori</td><td>: {{kategoriKerusakan}}</td></tr>
    </table>
    <p>Maka dengan ini ditetapkan hasil perhitungan penilaian tingkat kerusakan bangunan tersebut di atas adalah sah sesuai standar operasional yang berlaku, untuk dapat dipergunakan sebagai dasar penyusunan Rencana Anggaran Biaya (RAB) rehabilitasi.</p>
  </div>

  <div class="signature">
    <p>Ditetapkan di Garut</p>
    <p>Tanggal: {{tanggal}}</p>
    <div style="margin: 10px 0;">
      <img src="{{qrKadis}}" alt="QR TTE" width="80" height="80" onerror="this.style.display='none'" />
    </div>
    <p><b><u>{{namaKadis}}</u></b></p>
    <p>NIP. {{nipKadis}}</p>
  </div>
  <script>window.print();</script>
</body>
</html>`;

export const DEFAULT_TEMPLATE_LEMBAR_DISPOSISI = `<div class="disposisi-header">
  <h2>{{namaInstansiAtas}}</h2>
  <h1>{{namaDinas}}</h1>
  <p class="alamat">{{alamatDinas}}</p>
</div>
<div class="disposisi-title">LEMBAR DISPOSISI</div>
<table class="disposisi-meta">
  <tr><td>No. Agenda</td><td>: {{nomorAgenda}}</td></tr>
  <tr><td>Tanggal</td><td>: {{tanggalDisposisi}}</td></tr>
  <tr><td>Asal Surat</td><td>: {{asalSurat}}</td></tr>
  <tr><td>Perihal</td><td>: {{perihal}}</td></tr>
</table>`;

export const DEFAULT_TEMPLATE_LAMPIRAN_XLSX = `LAMPIRAN PERHITUNGAN VOLUME KERUSAKAN BANGUNAN
Nama Sekolah/Instansi: {{namaSekolah}}
Nama Bangunan: {{namaBangunan}}
Tanggal Penilaian: {{tanggal}}
Jumlah Lantai: {{jumlahLantai}}

Kolom Tabel:
No | Komponen | Bobot (%) | Klasifikasi Kerusakan | Volume (%) | Nilai Kerusakan | Foto

Total Kerusakan: {{totalKerusakan}}%
Kategori: {{kategoriKerusakan}}`;


// ========================
// DEFAULT TEMPLATES COLLECTION
// ========================

export function getDefaultTemplates(): DocumentTemplate[] {
  return [
    {
      id: "surat_permohonan",
      nama: "Surat Permohonan",
      deskripsi: "Template surat permohonan penilaian kerusakan bangunan yang dikirim pemohon ke Dinas PUPR",
      kategori: "surat",
      kontenHtml: DEFAULT_TEMPLATE_SURAT_PERMOHONAN,
      placeholders: PLACEHOLDERS_SURAT_PERMOHONAN,
      driveLink: "https://docs.google.com/document/d/1J62N0OlTw8Dhm8uflyujMX1uSgesVow3/edit",
    },
    {
      id: "surat_hasil_perhitungan",
      nama: "Surat Hasil Perhitungan",
      deskripsi: "Surat hasil perhitungan penilaian kerusakan bangunan yang diterbitkan oleh Kepala Dinas",
      kategori: "surat",
      kontenHtml: DEFAULT_TEMPLATE_SURAT_HASIL,
      placeholders: PLACEHOLDERS_SURAT_HASIL,
      driveLink: "https://docs.google.com/document/d/contoh_link_surat_hasil/edit",
    },
    {
      id: "lembar_disposisi",
      nama: "Lembar Disposisi",
      deskripsi: "Template lembar disposisi internal untuk distribusi surat masuk",
      kategori: "surat",
      kontenHtml: DEFAULT_TEMPLATE_LEMBAR_DISPOSISI,
      placeholders: PLACEHOLDERS_LEMBAR_DISPOSISI,
      driveLink: "https://docs.google.com/document/d/contoh_link_lembar_disposisi/edit",
    },
    {
      id: "lampiran_perhitungan",
      nama: "Lampiran Perhitungan (XLSX)",
      deskripsi: "Template lampiran tabel rincian perhitungan volume kerusakan per komponen (export Excel)",
      kategori: "lampiran",
      kontenHtml: DEFAULT_TEMPLATE_LAMPIRAN_XLSX,
      placeholders: PLACEHOLDERS_LAMPIRAN_XLSX,
      driveLink: "https://docs.google.com/spreadsheets/d/contoh_link_lampiran_excel/edit",
    },
  ];
}


// ========================
// FUNGSI UTILITAS
// ========================

/**
 * Replace semua placeholder {{key}} dalam template dengan nilai dari dataMap
 */
export function replaceTemplatePlaceholders(template: string, dataMap: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(dataMap)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, value || '');
  }
  // Bersihkan placeholder yang tidak ada di dataMap
  result = result.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, '-');
  return result;
}

/**
 * Generate preview dengan data contoh (dummy)
 */
export function generatePreview(template: string, placeholders: PlaceholderInfo[]): string {
  const dummyData: Record<string, string> = {};
  for (const p of placeholders) {
    dummyData[p.key] = p.contoh;
  }
  return replaceTemplatePlaceholders(template, dummyData);
}
