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
  { key: "npsn", label: "NPSN", contoh: "20211234" },
  { key: "namaBangunan", label: "Nama Bangunan", contoh: "Gedung Utama Lantai 1" },
  { key: "luasBangunan", label: "Luas Bangunan (m²)", contoh: "450" },
  { key: "jumlahLantai", label: "Jumlah Lantai", contoh: "1" },
  { key: "alamatBangunan", label: "Alamat Bangunan", contoh: "Jl. Raya Samarang No. 10, Garut" },
  { key: "tanggal", label: "Tanggal Penilaian", contoh: "14 Juli 2026" },
  { key: "totalKerusakan", label: "Total Kerusakan (%)", contoh: "35.50" },
  { key: "kategoriKerusakan", label: "Kategori Kerusakan", contoh: "Rusak Sedang" },
  { key: "namaTimSurvei1", label: "Tim Survei 1 (Nama)", contoh: "Enjang Wahyudin, ST" },
  { key: "nipTimSurvei1", label: "Tim Survei 1 (NIP)", contoh: "199112182019031011" },
  { key: "namaTimSurvei2", label: "Tim Survei 2 (Nama)", contoh: "Haris Nugraha" },
  { key: "nipTimSurvei2", label: "Tim Survei 2 (NIP)", contoh: "197703292025211012" },
  { key: "namaTimSurvei3", label: "Tim Survei 3 (Nama)", contoh: "Nendi Supriadi" },
  { key: "nipTimSurvei3", label: "Tim Survei 3 (NIP)", contoh: "198302022025211069" },
];

export const OFFICIAL_SPREADSHEET_TEMPLATES = {
  TIPE_A: "https://docs.google.com/spreadsheets/d/1pe2d-T7KzkGqIrXq6bUYoevYI3alXxosT5RBTljvIiE/edit?gid=756257354#gid=756257354",
  TIPE_B: "https://docs.google.com/spreadsheets/d/1sTjY-dIEJI7cDezMpVnb25mcbyHcNrRBe7AFZarz7IA/edit?gid=1536163214#gid=1536163214",
  TIPE_C: "https://docs.google.com/spreadsheets/d/1bza5jDXLNYtOTyjEsju8e4cv0rZTskBjxsqewIh4dhk/edit?gid=506421235#gid=506421235",
};

export function getOfficialSpreadsheetTemplateUrl(floorCount: number = 1): string {
  if (floorCount === 1) return OFFICIAL_SPREADSHEET_TEMPLATES.TIPE_A;
  if (floorCount === 2) return OFFICIAL_SPREADSHEET_TEMPLATES.TIPE_B;
  return OFFICIAL_SPREADSHEET_TEMPLATES.TIPE_C;
}



// ========================
// DEFAULT TEMPLATE HTML
// ========================

export const DEFAULT_TEMPLATE_SURAT_PERMOHONAN = `<html>
<head>
  <title>Surat Permohonan Penilaian Kerusakan</title>
  <style>
    body { font-family: 'Arial', sans-serif; padding: 40px 50px; line-height: 1.5; font-size: 13px; color: #000; }
    .header-left { margin-bottom: 25px; line-height: 1.4; }
    .header-left div { font-weight: normal; }
    .date-right { text-align: right; margin-bottom: 25px; }
    .meta-table { width: 100%; margin-bottom: 25px; border-collapse: collapse; }
    .meta-table td { vertical-align: top; padding: 3px 0; font-size: 13px; }
    .meta-table td:nth-child(1) { width: 90px; }
    .meta-table td:nth-child(2) { width: 15px; }
    .recipient { margin-bottom: 25px; line-height: 1.4; }
    .content { text-align: justify; }
    .content p { margin: 12px 0; }
    .identity-table { width: 100%; border-collapse: collapse; margin: 10px 0 15px 20px; }
    .identity-table td { padding: 4px 0; vertical-align: top; font-size: 13px; }
    .identity-table td:nth-child(1) { width: 160px; }
    .identity-table td:nth-child(2) { width: 15px; }
    .signature { float: right; text-align: center; margin-top: 40px; width: 260px; }
    .signature p { margin: 3px 0; }
    .clear { clear: both; }
    @media print { body { padding: 25px; } }
  </style>
</head>
<body>
  <div class="header-left">
    <div>{{namaInstansiAtas}}</div>
    <div>{{namaInstansiBawah}}</div>
    <div>{{namaSekolah}}</div>
    <div>{{alamatPemohon}}</div>
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
        Permohonan Penilaian Kerusakan Bangunan Gedung {{namaSekolah}}
      </td>
    </tr>
  </table>

  <div class="recipient">
    <p style="margin:0;">Yth. Kepala Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut</p>
    <p style="margin:0;">di</p>
    <p style="margin:0;">&nbsp;&nbsp;&nbsp;&nbsp;Garut</p>
  </div>

  <div class="content">
    <p style="text-indent: 40px;">
      Dalam rangka menjamin keselamatan, keamanan, kenyamanan, dan keberlanjutan fungsi bangunan gedung pada {{namaInstansiBawah}}, bersama ini kami mengajukan permohonan <b>Analisis dan Perhitungan Kerusakan Bangunan Gedung</b> terhadap bangunan yang berada pada lokasi berikut:
    </p>

    <p style="margin-bottom: 5px;">1. Identitas Bangunan Gedung:</p>
    
    <table class="identity-table">
      <tr>
        <td>Nama Bangunan</td><td>:</td><td>{{namaBangunan}}</td>
      </tr>
      <tr>
        <td>NPSN</td><td>:</td><td>{{npsn}}</td>
      </tr>
      <tr>
        <td>Luas</td><td>:</td><td>{{luasBangunan}} m&sup2;</td>
      </tr>
      <tr>
        <td>Jumlah Lantai</td><td>:</td><td>{{jumlahLantai}}</td>
      </tr>
      <tr>
        <td>Alamat Bangunan</td><td>:</td><td>{{alamatBangunan}}</td>
      </tr>
      <tr>
        <td>Desa/Kelurahan</td><td>:</td><td>-</td>
      </tr>
      <tr>
        <td>Kecamatan</td><td>:</td><td>-</td>
      </tr>
      <tr>
        <td>Kabupaten/Kota</td><td>:</td><td>Garut</td>
      </tr>
      <tr>
        <td>Koordinat</td><td>:</td><td>{{koordinatGps}}</td>
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
    <div style="margin: 15px 0;">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=TTE-PERMOHONAN-{{nomorSurat}}" alt="QR TTE" width="90" height="90" />
    </div>
    <p><b><u>{{namaPengirim}}</u></b></p>
    <p>NIP. {{nipPengirim}}</p>
  </div>
  <div class="clear"></div>
</body>
</html>`;

export const DEFAULT_TEMPLATE_SURAT_HASIL = `<html>
<head>
  <title>Surat Hasil Perhitungan Penilaian Kerusakan</title>
  <style>
    body { font-family: 'Times New Roman', serif; padding: 40px 50px; line-height: 1.5; font-size: 13px; color: #000; }
    .kop { display: flex; align-items: center; border-bottom: 3px double black; padding-bottom: 12px; margin-bottom: 25px; }
    .kop-logo { width: 85px; height: auto; margin-right: 20px; }
    .kop-text { flex: 1; text-align: center; }
    .kop-text h1 { font-size: 16px; margin: 0; font-weight: bold; text-transform: uppercase; }
    .kop-text h2 { font-size: 15px; margin: 0; font-weight: bold; text-transform: uppercase; }
    .kop-text p { font-size: 11px; margin: 3px 0 0 0; }
    .title-block { text-align: center; margin-bottom: 25px; }
    .title-block h3 { font-size: 14px; font-weight: bold; text-decoration: underline; margin: 0 0 5px 0; text-transform: uppercase; }
    .title-block p { font-size: 13px; margin: 0; }
    .content { text-align: justify; line-height: 1.6; }
    .content p { margin: 12px 0; }
    .identity-table { width: 100%; border-collapse: collapse; margin: 15px 0 15px 20px; }
    .identity-table td { padding: 4px 0; vertical-align: top; font-size: 13px; }
    .identity-table td:nth-child(1) { width: 200px; }
    .identity-table td:nth-child(2) { width: 15px; }
    .signature { float: right; text-align: center; margin-top: 40px; width: 280px; }
    .signature p { margin: 3px 0; }
    .clear { clear: both; }
    @media print { body { padding: 25px; } }
  </style>
</head>
<body>
  <div class="kop">
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Lambang_Kabupaten_Garut.png/400px-Lambang_Kabupaten_Garut.png" alt="Logo" class="kop-logo" />
    <div class="kop-text">
      <h1>{{namaInstansiAtas}}</h1>
      <h2>{{namaDinas}}</h2>
      <p>{{alamatDinas}}</p>
    </div>
  </div>

  <div class="title-block">
    <h3>SURAT HASIL PERHITUNGAN PENILAIAN KERUSAKAN BANGUNAN GEDUNG</h3>
    <p>Nomor: {{nomorSurat}}</p>
  </div>

  <div class="content">
    <p style="text-indent: 40px;">
      Berdasarkan hasil survei teknis lapangan dan analisis perhitungan tingkat kerusakan fisik bangunan gedung yang telah dilaksanakan oleh Tim Teknis Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut terhadap:
    </p>

    <table class="identity-table">
      <tr>
        <td>Nama Instansi / Sekolah</td><td>:</td><td><b>{{namaSekolah}}</b></td>
      </tr>
      <tr>
        <td>Nama Bangunan</td><td>:</td><td><b>{{namaBangunan}}</b></td>
      </tr>
      <tr>
        <td>Total Persentase Kerusakan</td><td>:</td><td><b>{{totalKerusakan}}</b></td>
      </tr>
      <tr>
        <td>Kategori Tingkat Kerusakan</td><td>:</td><td><b>{{kategoriKerusakan}}</b></td>
      </tr>
    </table>

    <p style="text-indent: 40px;">
      Maka dengan ini ditetapkan bahwa hasil perhitungan penilaian tingkat kerusakan bangunan gedung tersebut di atas adalah sah dan mengacu pada standar teknis dan regulasi Kementerian Pekerjaan Umum dan Perumahan Rakyat (PUPR), untuk dapat dipergunakan sebagai dasar rekomendasi teknis serta penyusunan Rencana Anggaran Biaya (RAB) rehabilitasi bangunan.
    </p>

    <p style="text-indent: 40px;">
      Demikian surat hasil perhitungan penilaian kerusakan ini diterbitkan untuk dipergunakan sebagaimana mestinya.
    </p>
  </div>

  <div class="signature">
    <p>Ditetapkan di Garut<br/>Tanggal: {{tanggal}}</p>
    <p style="margin-top: 10px;">Kepala Dinas Pekerjaan Umum dan Penataan Ruang<br/>Kabupaten Garut,</p>
    <div style="margin: 15px 0;">
      <img src="{{qrKadis}}" alt="QR TTE" width="90" height="90" onerror="this.src='https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=TTE-HASIL-{{nomorSurat}}'" />
    </div>
    <p><b><u>{{namaKadis}}</u></b></p>
    <p>NIP. {{nipKadis}}</p>
  </div>
  <div class="clear"></div>
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

export const DEFAULT_TEMPLATE_LAMPIRAN_TIPE_A = `<html>
<head>
  <title>Lampiran Hasil Penilaian Kerusakan Bangunan - 1 Lantai (Tipe A)</title>
  <style>
    body { font-family: 'Arial', sans-serif; padding: 30px; font-size: 11px; color: #000; }
    h2 { text-align: center; font-size: 14px; margin-bottom: 5px; text-transform: uppercase; }
    h3 { text-align: center; font-size: 12px; margin-top: 0; margin-bottom: 20px; text-transform: uppercase; }
    .meta-table { width: 100%; margin-bottom: 15px; border-collapse: collapse; }
    .meta-table td { padding: 3px 5px; vertical-align: top; }
    .meta-table td:nth-child(1) { width: 180px; font-weight: bold; }
    .meta-table td:nth-child(2) { width: 15px; }
    .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .data-table th, .data-table td { border: 1px solid #333; padding: 6px 4px; text-align: center; }
    .data-table th { background-color: #1e3a8a; color: white; font-weight: bold; font-size: 10px; }
    .data-table td.left { text-align: left; }
    .data-table tr.group-header { background-color: #e2e8f0; font-weight: bold; text-align: left; }
    .summary-box { border: 2px solid #1e3a8a; padding: 12px; margin-bottom: 25px; background-color: #f8fafc; }
    .summary-title { font-size: 12px; font-weight: bold; color: #1e3a8a; margin-bottom: 5px; }
    .signature-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center; margin-top: 30px; }
    .sig-box p { margin: 3px 0; }
    .sig-space { height: 60px; }
  </style>
</head>
<body>
  <h2>FORMULIR PENILAIAN KERUSAKAN BANGUNAN (FORMAT ANALISIS PUPR)</h2>
  <h3>BANGUNAN 1 LANTAI (TIPE A)</h3>

  <table class="meta-table">
    <tr><td>Nama Sekolah/Instansi</td><td>:</td><td>{{namaSekolah}}</td><td>NPSN</td><td>:</td><td>{{npsn}}</td></tr>
    <tr><td>Nama Bangunan</td><td>:</td><td>{{namaBangunan}}</td><td>Luas Bangunan</td><td>:</td><td>{{luasBangunan}} m²</td></tr>
    <tr><td>Alamat Bangunan</td><td>:</td><td>{{alamatBangunan}}</td><td>Jumlah Lantai</td><td>:</td><td>1 Lantai (Tipe A)</td></tr>
    <tr><td>Tanggal Penilaian</td><td>:</td><td>{{tanggal}}</td><td></td><td></td><td></td></tr>
  </table>

  <table class="data-table">
    <thead>
      <tr>
        <th rowspan="2">NO</th>
        <th rowspan="2">SISTEM</th>
        <th rowspan="2">KOMPONEN</th>
        <th rowspan="2">SATUAN</th>
        <th colspan="7">KLASIFIKASI TINGKAT KERUSAKAN</th>
        <th rowspan="2">TOTAL KERUSAKAN (%)</th>
        <th rowspan="2">BOBOT FORM A (%)</th>
        <th rowspan="2">NILAI KERUSAKAN THD MASSA (%)</th>
      </tr>
      <tr>
        <th>Tdk Rusak</th><th>Sangat Ringan</th><th>Ringan</th><th>Sedang</th><th>Berat</th><th>Sangat Berat</th><th>Tdk Sesuai</th>
      </tr>
    </thead>
    <tbody>
      <tr class="group-header"><td colspan="14">A. STRUKTUR</td></tr>
      <tr><td>1</td><td>Struktur</td><td class="left">Pondasi & Sloof</td><td>%</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>0.00</td><td>12.00</td><td>0.00</td></tr>
      <tr><td>2</td><td>Struktur</td><td class="left">Kolom</td><td>%</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>0.00</td><td>10.00</td><td>0.00</td></tr>
      <tr><td>3</td><td>Struktur</td><td class="left">Balok</td><td>%</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>0.00</td><td>8.00</td><td>0.00</td></tr>
      <tr><td>4</td><td>Struktur</td><td class="left">Atap</td><td>%</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>0.00</td><td>7.00</td><td>0.00</td></tr>
      <tr class="group-header"><td colspan="14">B. ARSITEKTUR</td></tr>
      <tr><td>5</td><td>Arsitektur</td><td class="left">Dinding / Partisi</td><td>%</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>0.00</td><td>21.50</td><td>0.00</td></tr>
      <tr><td>6</td><td>Arsitektur</td><td class="left">Plafond</td><td>%</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>0.00</td><td>10.00</td><td>0.00</td></tr>
      <tr><td>7</td><td>Arsitektur</td><td class="left">Lantai</td><td>%</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>0.00</td><td>14.50</td><td>0.00</td></tr>
      <tr><td>8</td><td>Arsitektur</td><td class="left">Kusen</td><td>%</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>0.00</td><td>1.00</td><td>0.00</td></tr>
      <tr><td>9</td><td>Arsitektur</td><td class="left">Pintu</td><td>%</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>0.00</td><td>1.50</td><td>0.00</td></tr>
      <tr><td>10</td><td>Arsitektur</td><td class="left">Jendela</td><td>%</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>0.00</td><td>2.00</td><td>0.00</td></tr>
      <tr><td>11</td><td>Arsitektur</td><td class="left">Finishing Plafond</td><td>%</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>0.00</td><td>3.00</td><td>0.00</td></tr>
      <tr><td>12</td><td>Arsitektur</td><td class="left">Finishing Dinding</td><td>%</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>0.00</td><td>4.00</td><td>0.00</td></tr>
      <tr><td>13</td><td>Arsitektur</td><td class="left">Finishing Kusen & Pintu</td><td>%</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>0.00</td><td>2.00</td><td>0.00</td></tr>
      <tr class="group-header"><td colspan="14">C. UTILITAS</td></tr>
      <tr><td>14</td><td>Utilitas</td><td class="left">Instalasi Listrik</td><td>%</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>0.00</td><td>1.00</td><td>0.00</td></tr>
      <tr><td>15</td><td>Utilitas</td><td class="left">Instalasi Air Bersih</td><td>%</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>0.00</td><td>1.00</td><td>0.00</td></tr>
      <tr><td>16</td><td>Utilitas</td><td class="left">Drainase Limbah</td><td>%</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>-</td><td>0.00</td><td>1.50</td><td>0.00</td></tr>
      <tr style="font-weight: bold; background-color: #f1f5f9;">
        <td colspan="12" style="text-align: right;">TOTAL BOBOT / NILAI KERUSAKAN THD MASSA BANGUNAN</td>
        <td>100.00%</td>
        <td>{{totalKerusakan}}%</td>
      </tr>
    </tbody>
  </table>

  <div class="summary-box">
    <div class="summary-title">KESIMPULAN HASIL PENILAIAN KERUSAKAN BANGUNAN</div>
    <p style="margin: 4px 0; font-size: 13px;">Total Tingkat Kerusakan Bangunan: <b>{{totalKerusakan}}%</b></p>
    <p style="margin: 4px 0; font-size: 13px;">Klasifikasi Kerusakan: <b>{{kategoriKerusakan}}</b></p>
  </div>

  <div style="text-align: center; font-weight: bold; margin-bottom: 15px;">TIM SURVEI LAPANGAN / VERIFIKATOR TEKNIS</div>
  <div class="signature-grid">
    <div class="sig-box">
      <p>Petugas Survei 1</p>
      <div class="sig-space"></div>
      <p><b><u>{{namaTimSurvei1}}</u></b></p>
      <p>NIP. {{nipTimSurvei1}}</p>
    </div>
    <div class="sig-box">
      <p>Petugas Survei 2</p>
      <div class="sig-space"></div>
      <p><b><u>{{namaTimSurvei2}}</u></b></p>
      <p>NIP. {{nipTimSurvei2}}</p>
    </div>
    <div class="sig-box">
      <p>Petugas Survei 3</p>
      <div class="sig-space"></div>
      <p><b><u>{{namaTimSurvei3}}</u></b></p>
      <p>NIP. {{nipTimSurvei3}}</p>
    </div>
  </div>
</body>
</html>`;

export const DEFAULT_TEMPLATE_LAMPIRAN_TIPE_B = DEFAULT_TEMPLATE_LAMPIRAN_TIPE_A.replace("BANGUNAN 1 LANTAI (TIPE A)", "BANGUNAN 2 LANTAI (TIPE B)").replace("1 Lantai (Tipe A)", "2 Lantai (Tipe B)").replace("BOBOT FORM A (%)", "BOBOT FORM B (%)");

export const DEFAULT_TEMPLATE_LAMPIRAN_TIPE_C = DEFAULT_TEMPLATE_LAMPIRAN_TIPE_A.replace("BANGUNAN 1 LANTAI (TIPE A)", "BANGUNAN 3 LANTAI ATAU LEBIH (TIPE C)").replace("1 Lantai (Tipe A)", "3 Lantai (Tipe C)").replace("BOBOT FORM A (%)", "BOBOT FORM C (%)");

export const DEFAULT_TEMPLATE_LAMPIRAN_XLSX = DEFAULT_TEMPLATE_LAMPIRAN_TIPE_A;


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
      id: "lampiran_tipe_a",
      nama: "Lampiran Hasil Penilaian (Tipe A - 1 Lantai)",
      deskripsi: "Template resmi lampiran perhitungan kerusakan bangunan 1 Lantai (Tipe A) sesuai standar PUPR",
      kategori: "lampiran",
      kontenHtml: DEFAULT_TEMPLATE_LAMPIRAN_TIPE_A,
      placeholders: PLACEHOLDERS_LAMPIRAN_XLSX,
      driveLink: OFFICIAL_SPREADSHEET_TEMPLATES.TIPE_A,
    },
    {
      id: "lampiran_tipe_b",
      nama: "Lampiran Hasil Penilaian (Tipe B - 2 Lantai)",
      deskripsi: "Template resmi lampiran perhitungan kerusakan bangunan 2 Lantai (Tipe B) sesuai standar PUPR",
      kategori: "lampiran",
      kontenHtml: DEFAULT_TEMPLATE_LAMPIRAN_TIPE_B,
      placeholders: PLACEHOLDERS_LAMPIRAN_XLSX,
      driveLink: OFFICIAL_SPREADSHEET_TEMPLATES.TIPE_B,
    },
    {
      id: "lampiran_tipe_c",
      nama: "Lampiran Hasil Penilaian (Tipe C - 3 Lantai)",
      deskripsi: "Template resmi lampiran perhitungan kerusakan bangunan 3 Lantai atau lebih (Tipe C) sesuai standar PUPR",
      kategori: "lampiran",
      kontenHtml: DEFAULT_TEMPLATE_LAMPIRAN_TIPE_C,
      placeholders: PLACEHOLDERS_LAMPIRAN_XLSX,
      driveLink: OFFICIAL_SPREADSHEET_TEMPLATES.TIPE_C,
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
