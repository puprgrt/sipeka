import ExcelJS from 'exceljs';
import { 
  Assessment, 
  COMPONENT_WEIGHTS_1_LANTAI, 
  COMPONENT_WEIGHTS_2_LANTAI, 
  COMPONENT_WEIGHTS_3_LANTAI, 
  DAMAGE_MULTIPLIERS 
} from "../types";

export const exportAssessmentToExcel = async (assessment: Assessment) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Form Penilaian Kerusakan');

  // Define columns width
  sheet.columns = [
    { width: 5 },  // 1 NO
    { width: 15 }, // 2 SISTEM
    { width: 25 }, // 3 KOMPONEN
    { width: 8 },  // 4 SATUAN
    { width: 10 }, // 5 VOLUME SELURUH
    { width: 8 },  // 6 Tdk Rusak
    { width: 8 },  // 7 Sangat Ringan
    { width: 8 },  // 8 Ringan
    { width: 8 },  // 9 Sedang
    { width: 8 },  // 10 Berat
    { width: 8 },  // 11 Sangat Berat
    { width: 10 }, // 12 Tdk Sesuai
    { width: 15 }, // 13 Keterangan
    { width: 20 }, // 14 TAHAP 1
    { width: 6 },  // 15 (0.00)
    { width: 6 },  // 16 (0.20)
    { width: 6 },  // 17 (0.35)
    { width: 6 },  // 18 (0.50)
    { width: 6 },  // 19 (0.70)
    { width: 6 },  // 20 (0.85)
    { width: 6 },  // 21 (1.00)
    { width: 8 },  // 22 TOTAL
    { width: 10 }, // 23 BOBOT
    { width: 10 }, // 24 TINGKAT KERUSAKAN MASSA
  ];

  // Helper for center alignment and borders
  const applyHeaderStyle = (cell: ExcelJS.Cell) => {
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.font = { bold: true, size: 9, name: 'Arial' };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  };

  const applySubheaderStyle = (cell: ExcelJS.Cell) => {
    applyHeaderStyle(cell);
    cell.font = { bold: false, size: 8, name: 'Arial', italic: true };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
  };

  // ROW 1: Title
  sheet.addRow(['FORMULIR PENILAIAN KERUSAKAN BANGUNAN']).font = { bold: true, size: 12, name: 'Arial' };
  sheet.addRow([]);

  // Info Block (Rows 3-10)
  const addInfoRow = (label1: string, val1: any, label2?: string, val2?: any, suffix1?: string) => {
    const row = sheet.addRow([]);
    row.getCell(1).value = label1;
    row.getCell(3).value = ':';
    row.getCell(4).value = val1;
    row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }; // Light yellow
    
    if (suffix1) {
      row.getCell(5).value = suffix1;
    }

    if (label2) {
      row.getCell(10).value = label2;
      row.getCell(13).value = ':';
      row.getCell(14).value = val2;
      row.getCell(14).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
    }
    
    // Style alignments
    row.getCell(1).font = { size: 9, name: 'Arial' };
    row.getCell(4).font = { size: 9, name: 'Arial' };
    row.getCell(4).alignment = { vertical: 'middle', horizontal: 'left' };
    if (label2) {
      row.getCell(10).font = { size: 9, name: 'Arial' };
      row.getCell(14).font = { size: 9, name: 'Arial' };
      row.getCell(14).alignment = { vertical: 'middle', horizontal: 'center' };
    }
    return row;
  };

  addInfoRow('Nama Sekolah', assessment.schoolName);
  sheet.mergeCells(`D3:X3`);
  
  addInfoRow('NPSN', assessment.npsn || "-");
  sheet.mergeCells(`D4:X4`);
  
  addInfoRow('Nama Bangunan', assessment.buildingName);
  sheet.mergeCells(`D5:X5`);
  
  addInfoRow('NUP (No Urut Perolehan)', assessment.nup || "-");
  sheet.mergeCells(`D6:X6`);
  
  addInfoRow('Alamat', assessment.address);
  sheet.mergeCells(`D7:X7`);
  
  const r8 = addInfoRow('Kabupaten/Kota', assessment.city, 'Provinsi', assessment.province);
  sheet.mergeCells(`D8:I8`);
  sheet.mergeCells(`N8:X8`);
  
  const coordParts = assessment.coordinates?.split(',') || ["-", "-"];
  addInfoRow('Koordinat', `Lat: ${coordParts[0]}  Long: ${coordParts[1] || ""}`);
  sheet.mergeCells(`D9:X9`);
  
  const r10 = addInfoRow('Luas Bangunan', assessment.buildingArea, 'Jumlah Lantai', assessment.floorCount, 'm2');
  r10.getCell(14).alignment = { vertical: 'middle', horizontal: 'center' };
  sheet.mergeCells(`D10:H10`);
  sheet.mergeCells(`N10:O10`);

  sheet.addRow([]); // Row 11 empty space

  // ROW 12: Main Headers
  const row1 = sheet.addRow([
    'NO', 'SISTEM', 'KOMPONEN', 'SATUAN', 'VOLUME SELURUH KOMPONEN',
    'TAHAP 2 - HITUNG VOLUME KERUSAKAN KOMPONEN BERDASARKAN KLASIFIKASI KERUSAKAN',
    '', '', '', '', '', '', '',
    'TAHAP 1 - PENGAMATAN VISUAL ADA / TDKNYA KERUSAKAN DAN INDIKASI DAMPAK KERUSAKAN TERHADAP KESELAMATAN PEMANFAATAN RUANGAN / BANGUNAN',
    'PERHITUNGAN TINGKAT KERUSAKAN KOMPONEN',
    '', '', '', '', '', '', '',
    'BOBOT KOMPONEN',
    'TINGKAT KERUSAKAN KOMPONEN THD MASSA BANGUNAN / RUANGAN'
  ]);
  
  // Merge Headers
  sheet.mergeCells('A12:A14');
  sheet.mergeCells('B12:B14');
  sheet.mergeCells('C12:C14');
  sheet.mergeCells('D12:D14');
  sheet.mergeCells('E12:E14');
  
  sheet.mergeCells('F12:M12'); // TAHAP 2
  sheet.mergeCells('N12:N14'); // TAHAP 1
  sheet.mergeCells('O12:V12'); // PERHITUNGAN
  
  sheet.mergeCells('W12:W14'); // BOBOT
  sheet.mergeCells('X12:X14'); // TINGKAT

  // ROW 2
  const row2 = sheet.addRow([
    '', '', '', '', '',
    'Tdk Rusak', 'Rusak, dengan Tingkat Kerusakan:', '', '', '', '', 'Komponen Tdk Sesuai / Tdk Ada', 'Keterangan',
    '',
    '1', '2', '3', '4', '5', '6', '7', 'TOTAL',
    '', ''
  ]);
  sheet.mergeCells('F13:F14'); // Tdk Rusak
  sheet.mergeCells('G13:K13'); // Rusak, dengan Tingkat Kerusakan:
  sheet.mergeCells('L13:L14'); // Tdk Sesuai
  sheet.mergeCells('M13:M14'); // Keterangan

  // ROW 3
  const row3 = sheet.addRow([
    '', '', '', '', '',
    '', 
    'Sangat Ringan', 'Ringan', 'Sedang', 'Berat', 'Sangat Berat',
    '', '', '',
    '0.00', '0.20', '0.35', '0.50', '0.70', '0.85', '1.00',
    '', '', ''
  ]);
  
  // ROW 4 (Indices)
  const row4 = sheet.addRow([
    '(1)', '(2)', '(3)', '(4)', '(5)', 
    '(6)', '(7)', '(8)', '(9)', '(10)', '(11)', '(12)', '(13)', 
    '(14)', '(15)', '(16)', '(17)', '(18)', '(19)', '(20)', '(21)', '(22)', '(23)', '(24)'
  ]);

  // Apply Styles to headers
  [12, 13, 14, 15].forEach(r => {
    const row = sheet.getRow(r);
    row.eachCell({ includeEmpty: true }, (cell) => {
      if (r === 15) {
        applySubheaderStyle(cell);
      } else {
        applyHeaderStyle(cell);
      }
    });
  });

  // Setup Weights
  const floorCount = assessment.floorCount || 1;
  const weights = floorCount === 2 
    ? COMPONENT_WEIGHTS_2_LANTAI 
    : floorCount >= 3 
      ? COMPONENT_WEIGHTS_3_LANTAI 
      : COMPONENT_WEIGHTS_1_LANTAI;

  const systemMap: Record<string, string> = {
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

  const componentsList = Object.keys(weights).filter(name => weights[name] > 0);
  
  let currentSystem = "";
  let systemStartIndex = 16;

  let totalMassaBangunan = 0;

  componentsList.forEach((compName, index) => {
    const sys = systemMap[compName] || "STRUKTUR";
    const isNewSystem = sys !== currentSystem;
    if (isNewSystem) {
      currentSystem = sys;
    }

    const weight = weights[compName];
    const compData = assessment.components?.find(c => c.name === compName);
    
    // Satuan
    let satuan = "unit";
    if (compName.includes("Instalasi")) satuan = "Estimasi";
    else if (compName.includes("Atap") || compName.includes("Dinding") || compName.includes("Finishing") || compName.includes("Plafond") || compName.includes("Lantai")) satuan = "%";
    
    // Volume
    const volume = satuan === "%" ? "100%" : (compData?.totalVolume || "-");

    // TAHAP 2
    let tdkRusak = "-", sangatRingan = "-", ringan = "-", sedang = "-", berat = "-", sangatBerat = "-", tdkSesuai = "-";
    
    // PERHITUNGAN
    let p000 = "0.00", p020 = "0.00", p035 = "0.00", p050 = "0.00", p070 = "0.00", p085 = "0.00", p100 = "0.00";

    let componentDamageFraction = 0;
    
    if (compData && compData.damageDetails && compData.damageDetails.length > 0) {
      compData.damageDetails.forEach(detail => {
        const val = detail.percentage ? detail.percentage : detail.volume;
        const valStr = detail.percentage ? `${val}%` : `${val}`;
        const fraction = detail.percentage ? (detail.percentage / 100) : (compData.totalVolume ? (detail.volume! / compData.totalVolume) : 0);
        
        const mul = DAMAGE_MULTIPLIERS[detail.level] || 0;
        componentDamageFraction += fraction * mul;

        if (detail.level === "Tidak Rusak") { tdkRusak = valStr; p000 = (fraction * 0).toFixed(2); }
        if (detail.level === "Rusak Sangat Ringan") { sangatRingan = valStr; p020 = (fraction * 0.20).toFixed(2); }
        if (detail.level === "Rusak Ringan") { ringan = valStr; p035 = (fraction * 0.35).toFixed(2); }
        if (detail.level === "Rusak Sedang") { sedang = valStr; p050 = (fraction * 0.50).toFixed(2); }
        if (detail.level === "Rusak Berat") { berat = valStr; p070 = (fraction * 0.70).toFixed(2); }
        if (detail.level === "Rusak Sangat Berat") { sangatBerat = valStr; p085 = (fraction * 0.85).toFixed(2); }
        if (detail.level === "Komponen Tidak Sesuai") { tdkSesuai = valStr; p100 = (fraction * 1.00).toFixed(2); }
      });
    }

    componentDamageFraction = Math.min(componentDamageFraction, 1.0);
    const totalPersen = (componentDamageFraction * 100).toFixed(2) + "%";
    const nilaiKerusakanThdMassa = componentDamageFraction * weight;
    totalMassaBangunan += nilaiKerusakanThdMassa;

    const row = sheet.addRow([
      isNewSystem ? (sys === "STRUKTUR" ? 1 : sys === "ARSITEKTUR" ? 2 : 3) : "",
      isNewSystem ? sys : "",
      compName,
      satuan,
      volume,
      tdkRusak, sangatRingan, ringan, sedang, berat, sangatBerat, tdkSesuai, "", // TAHAP 2
      compData?.safetyImpact ? "Ada Indikasi Bahaya" : "Tidak ada kerusakan / dampak", // TAHAP 1
      p000, p020, p035, p050, p070, p085, p100, // PERHITUNGAN
      totalPersen, // TOTAL
      `${weight.toFixed(2)}%`, // BOBOT
      `${nilaiKerusakanThdMassa.toFixed(2)}%` // TINGKAT KERUSAKAN THD MASSA
    ]);

    // Apply basic style to data row
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { size: 9, name: 'Arial' };
      cell.alignment = { vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
      // Center align for numbers and percentages
      if (colNumber === 1 || colNumber >= 4) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
      
      // Color coding based on image (e.g. yellow background for empty volume cells in TAHAP 2)
      if (colNumber >= 6 && colNumber <= 12 && cell.value === "-") {
         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } };
      }
      if (colNumber >= 15 && colNumber <= 21 && cell.value === "0.00") {
         cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAEAEA' } };
      }
    });
  });

  // TOTAL ROW
  const lastRow = sheet.addRow([
    '', '', '', '', '', '', '', '', '', '', '', '', '',
    'Cek Kerusakan Komponen Lain', // N
    '', '', '', '', '', '', '', // O-U
    'TOTAL NILAI KERUSAKAN MASSA BANGUNAN / RUANGAN =', // V
    '', // W
    `${totalMassaBangunan.toFixed(2)}%` // X
  ]);
  
  sheet.mergeCells(`O${lastRow.number}:V${lastRow.number}`);
  
  lastRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    cell.font = { bold: true, size: 9, name: 'Arial' };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    
    if (colNumber >= 15 && colNumber <= 22) {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
    } else if (colNumber === 24) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9EAD3' } };
    }
  });

  // KESIMPULAN ROW
  const category = assessment.finalResult?.category || "-";
  const kesimpulanRow = sheet.addRow([
    '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '',
    'KESIMPULAN TINGKAT KERUSAKAN MASSA BANGUNAN / RUANGAN =', '', '',
    category
  ]);
  sheet.mergeCells(`U${kesimpulanRow.number}:W${kesimpulanRow.number}`);
  
  kesimpulanRow.getCell('U').alignment = { horizontal: 'right', vertical: 'middle' };
  kesimpulanRow.getCell('U').font = { bold: true, size: 10, name: 'Arial' };
  kesimpulanRow.getCell('U').border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  kesimpulanRow.getCell('U').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCCCCC' } };

  kesimpulanRow.getCell('X').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  kesimpulanRow.getCell('X').font = { bold: true, size: 10, name: 'Arial' };
  kesimpulanRow.getCell('X').border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  kesimpulanRow.getCell('X').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCFE2F3' } };

  // Footer Section
  sheet.addRow([]); // Empty row
  
  const currentFooterRow = sheet.rowCount + 1;
  
  // Create SKETSA box on the left (A to O)
  // Create Signature block on the right (P to X)
  
  // Tingkat Kerusakan Table
  sheet.getCell(`Q${currentFooterRow}`).value = 'Tingkat Kerusakan';
  sheet.getCell(`Q${currentFooterRow}`).font = { bold: true, underline: true, size: 8 };
  sheet.getCell(`Q${currentFooterRow}`).alignment = { horizontal: 'center' };
  sheet.mergeCells(`Q${currentFooterRow}:W${currentFooterRow}`);
  
  sheet.getCell(`P${currentFooterRow+1}`).value = 'Ringan';
  sheet.getCell(`T${currentFooterRow+1}`).value = ': \u2264 30%'; // <=
  sheet.getCell(`P${currentFooterRow+2}`).value = 'Sedang';
  sheet.getCell(`T${currentFooterRow+2}`).value = ': > 30% - 45%';
  sheet.getCell(`P${currentFooterRow+3}`).value = 'Berat';
  sheet.getCell(`T${currentFooterRow+3}`).value = ': > 45%';

  // Borders for Tingkat Kerusakan
  for (let r = currentFooterRow; r <= currentFooterRow + 3; r++) {
    sheet.getCell(`P${r}`).border = { left: { style: 'thin' } };
    sheet.getCell(`W${r}`).border = { right: { style: 'thin' } };
    if (r === currentFooterRow) sheet.getCell(`P${r}`).border = { left: { style: 'thin' }, top: { style: 'thin' } };
    if (r === currentFooterRow) sheet.getCell(`W${r}`).border = { right: { style: 'thin' }, top: { style: 'thin' } };
    if (r === currentFooterRow+3) {
      sheet.getCell(`P${r}`).border = { left: { style: 'thin' }, bottom: { style: 'thin' } };
      sheet.getCell(`W${r}`).border = { right: { style: 'thin' }, bottom: { style: 'thin' } };
    }
  }

  // TIM SURVEI
  sheet.getCell(`Q${currentFooterRow+5}`).value = 'TIM SURVEI :';
  sheet.getCell(`Q${currentFooterRow+5}`).font = { bold: true, size: 8 };
  sheet.getCell(`Q${currentFooterRow+5}`).alignment = { horizontal: 'center' };
  sheet.mergeCells(`Q${currentFooterRow+5}:W${currentFooterRow+5}`);

  sheet.getCell(`P${currentFooterRow+6}`).value = '1. Enjang Wahyudin, ST';
  sheet.getCell(`U${currentFooterRow+6}`).value = '....................................';
  sheet.getCell(`P${currentFooterRow+7}`).value = '    NIP 199112182019031011';
  
  sheet.getCell(`P${currentFooterRow+8}`).value = '2. Haris Nugraha';
  sheet.getCell(`U${currentFooterRow+8}`).value = '....................................';
  sheet.getCell(`P${currentFooterRow+9}`).value = '    NIP 197703292025211012';

  sheet.getCell(`P${currentFooterRow+10}`).value = '3. Nendi Supriadi';
  sheet.getCell(`U${currentFooterRow+10}`).value = '....................................';
  sheet.getCell(`P${currentFooterRow+11}`).value = '    NIP 198302022025211069';

  // DIPERIKSA
  sheet.getCell(`Q${currentFooterRow+12}`).value = 'DIPERIKSA';
  sheet.getCell(`Q${currentFooterRow+12}`).font = { bold: true, size: 8 };
  sheet.getCell(`Q${currentFooterRow+12}`).alignment = { horizontal: 'center' };
  sheet.mergeCells(`Q${currentFooterRow+12}:W${currentFooterRow+12}`);

  sheet.getCell(`P${currentFooterRow+13}`).value = 'Sub Koordinator Penataan Bangunan dan';
  sheet.getCell(`P${currentFooterRow+13}`).alignment = { horizontal: 'center' };
  sheet.mergeCells(`P${currentFooterRow+13}:X${currentFooterRow+13}`);
  
  sheet.getCell(`P${currentFooterRow+16}`).value = 'Asep Tedi Sugianto, ST., M.Si.';
  sheet.getCell(`P${currentFooterRow+16}`).font = { bold: true, underline: true, size: 8 };
  sheet.getCell(`P${currentFooterRow+16}`).alignment = { horizontal: 'center' };
  sheet.mergeCells(`P${currentFooterRow+16}:X${currentFooterRow+16}`);

  sheet.getCell(`P${currentFooterRow+17}`).value = 'NIP. 19770525 201410 1 002';
  sheet.getCell(`P${currentFooterRow+17}`).alignment = { horizontal: 'center' };
  sheet.mergeCells(`P${currentFooterRow+17}:X${currentFooterRow+17}`);

  // MENYETUJUI
  sheet.getCell(`Q${currentFooterRow+19}`).value = 'MENYETUJUI';
  sheet.getCell(`Q${currentFooterRow+19}`).font = { bold: true, size: 8 };
  sheet.getCell(`Q${currentFooterRow+19}`).alignment = { horizontal: 'center' };
  sheet.mergeCells(`Q${currentFooterRow+19}:W${currentFooterRow+19}`);

  sheet.getCell(`P${currentFooterRow+20}`).value = 'Kepala Bidang Bangunan';
  sheet.getCell(`P${currentFooterRow+20}`).alignment = { horizontal: 'center' };
  sheet.mergeCells(`P${currentFooterRow+20}:X${currentFooterRow+20}`);

  sheet.getCell(`P${currentFooterRow+21}`).value = 'Dinas PUPR Kab Garut';
  sheet.getCell(`P${currentFooterRow+21}`).alignment = { horizontal: 'center' };
  sheet.mergeCells(`P${currentFooterRow+21}:X${currentFooterRow+21}`);

  sheet.getCell(`P${currentFooterRow+24}`).value = 'Dedi Komara, ST., M.Si.';
  sheet.getCell(`P${currentFooterRow+24}`).font = { bold: true, underline: true, size: 8 };
  sheet.getCell(`P${currentFooterRow+24}`).alignment = { horizontal: 'center' };
  sheet.mergeCells(`P${currentFooterRow+24}:X${currentFooterRow+24}`);

  sheet.getCell(`P${currentFooterRow+25}`).value = 'NIP. 19760527 201001 1 002';
  sheet.getCell(`P${currentFooterRow+25}`).alignment = { horizontal: 'center' };
  sheet.mergeCells(`P${currentFooterRow+25}:X${currentFooterRow+25}`);

  // MENGETAHUI
  sheet.getCell(`Q${currentFooterRow+27}`).value = 'MENGETAHUI';
  sheet.getCell(`Q${currentFooterRow+27}`).font = { bold: true, size: 8 };
  sheet.getCell(`Q${currentFooterRow+27}`).alignment = { horizontal: 'center' };
  sheet.mergeCells(`Q${currentFooterRow+27}:W${currentFooterRow+27}`);

  // Sketsa Box (Left side)
  sheet.getCell(`A${currentFooterRow}`).value = 'SKETSA DENAH BANGUNAN';
  sheet.getCell(`A${currentFooterRow}`).font = { bold: true, underline: true, size: 9 };
  sheet.getCell(`A${currentFooterRow}`).alignment = { horizontal: 'center', vertical: 'top' };
  sheet.mergeCells(`A${currentFooterRow}:O${currentFooterRow+28}`);
  
  sheet.getCell(`A${currentFooterRow}`).border = {
    top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
  };

  // Add all missing rows up to max required row
  while(sheet.rowCount < currentFooterRow + 29) {
    sheet.addRow([]);
  }

  // Footer Note
  sheet.getCell(`A${currentFooterRow+29}`).value = 'Note :';
  sheet.getCell(`A${currentFooterRow+30}`).value = '*';
  sheet.getCell(`A${currentFooterRow+30}`).alignment = { horizontal: 'center' };
  sheet.getCell(`B${currentFooterRow+30}`).value = ': Dinas PU/Dinas yang menangani Bangunan Gedung';
  
  sheet.getCell(`A${currentFooterRow+29}`).border = { top: { style: 'thin' }, left: { style: 'thin' } };
  sheet.getCell(`A${currentFooterRow+30}`).border = { bottom: { style: 'thin' }, left: { style: 'thin' } };
  sheet.getCell(`B${currentFooterRow+30}`).border = { bottom: { style: 'thin' } };
  sheet.mergeCells(`B${currentFooterRow+30}:D${currentFooterRow+30}`);

  // Convert to Blob and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Penilaian_Kerusakan_${assessment.buildingName}_${new Date().getTime()}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
};
