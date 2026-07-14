import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Assessment, 
  COMPONENT_WEIGHTS_1_LANTAI, 
  COMPONENT_WEIGHTS_2_LANTAI, 
  COMPONENT_WEIGHTS_3_LANTAI, 
  DAMAGE_MULTIPLIERS 
} from "../types";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

export const exportAssessmentToPdf = (assessment: Assessment, history: any[] = []) => {
  const doc = new jsPDF("landscape");
  
  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Laporan Penilaian Kerusakan Bangunan", 148.5, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Dinas Pekerjaan Umum dan Penataan Ruang", 148.5, 26, { align: "center" });
  doc.text("Bidang Bangunan", 148.5, 31, { align: "center" });
  
  doc.setLineWidth(0.5);
  doc.line(14, 35, 283, 35);
  
  // Info Bangunan
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("FORMULIR PENILAIAN KERUSAKAN BANGUNAN", 14, 42);

  const coordParts = assessment.coordinates?.split(',') || ["-", "-"];
  
  const infoData = [
    ["Nama Sekolah", ":", assessment.schoolName, "", "", ""],
    ["NPSN", ":", assessment.npsn || "-", "", "", ""],
    ["Nama Bangunan", ":", assessment.buildingName, "", "", ""],
    ["NUP (No Urut Perolehan)", ":", assessment.nup || "-", "", "", ""],
    ["Alamat", ":", assessment.address, "", "", ""],
    ["Kabupaten/Kota", ":", assessment.city, "Provinsi", ":", assessment.province],
    ["Koordinat", ":", `Lat: ${coordParts[0]}  Long: ${coordParts[1] || ""}`, "", "", ""],
    ["Luas Bangunan", ":", `${assessment.buildingArea} m2`, "Jumlah Lantai", ":", `${assessment.floorCount}`]
  ];

  autoTable(doc, {
    startY: 45,
    body: infoData,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 1, minCellHeight: 6, valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 5 },
      2: { cellWidth: 80, fillColor: [255, 242, 204] },
      3: { cellWidth: 25 },
      4: { cellWidth: 5 },
      5: { cellWidth: 80, fillColor: [255, 242, 204] }
    },
    didParseCell: function (data) {
      // For rows 0 to 4 and 6, merge columns 2 to 5 so the yellow background spans across.
      if ([0, 1, 2, 3, 4, 6].includes(data.row.index) && data.column.index === 2) {
        data.cell.colSpan = 4;
      }
    }
  });

  const currentY2 = (doc as any).lastAutoTable.finalY + 5;

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

  let currentSystem = "";
  let totalMassaBangunan = 0;

  const componentRows: any[] = [];

  Object.keys(weights).filter(name => weights[name] > 0).forEach((name, idx) => {
    const sys = systemMap[name] || "STRUKTUR";
    const isNewSystem = sys !== currentSystem;
    if (isNewSystem) currentSystem = sys;

    const weight = weights[name];
    const compData = assessment.components?.find(c => c.name === name);
    
    let satuan = "unit";
    if (name.includes("Instalasi")) satuan = "Estimasi";
    else if (name.includes("Atap") || name.includes("Dinding") || name.includes("Finishing") || name.includes("Plafond") || name.includes("Lantai")) satuan = "%";
    
    const volume = satuan === "%" ? "100%" : (compData?.totalVolume || "-");

    let tdkRusak = "-", sangatRingan = "-", ringan = "-", sedang = "-", berat = "-", sangatBerat = "-", tdkSesuai = "-";
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

    componentRows.push([
      isNewSystem ? (sys === "STRUKTUR" ? "1" : sys === "ARSITEKTUR" ? "2" : "3") : "",
      isNewSystem ? sys : "",
      name,
      satuan,
      volume,
      tdkRusak, sangatRingan, ringan, sedang, berat, sangatBerat, tdkSesuai, "", // TAHAP 2
      compData?.safetyImpact ? "Ada Indikasi Bahaya" : "Tdk ada kerusakan", // TAHAP 1
      p000, p020, p035, p050, p070, p085, p100, // PERHITUNGAN
      totalPersen, // TOTAL
      `${weight.toFixed(2)}%`, // BOBOT
      `${nilaiKerusakanThdMassa.toFixed(2)}%` // TINGKAT
    ]);
  });

  componentRows.push([
    { content: 'TOTAL NILAI KERUSAKAN MASSA BANGUNAN / RUANGAN =', colSpan: 22, styles: { halign: 'right', fontStyle: 'bold' } },
    '',
    { content: `${totalMassaBangunan.toFixed(2)}%`, styles: { fontStyle: 'bold', fillColor: [217, 234, 211] } }
  ]);

  const categoryLabel = assessment.finalResult?.category || "-";
  componentRows.push([
    { content: 'KESIMPULAN TINGKAT KERUSAKAN MASSA BANGUNAN / RUANGAN =', colSpan: 22, styles: { halign: 'right', fontStyle: 'bold' } },
    '',
    { content: categoryLabel, styles: { fontStyle: 'bold', fillColor: [207, 226, 243] } }
  ]);

  autoTable(doc, {
    startY: currentY2 + 5,
    head: [
      [
        { content: 'NO', rowSpan: 3 },
        { content: 'SISTEM', rowSpan: 3 },
        { content: 'KOMPONEN', rowSpan: 3 },
        { content: 'SAT', rowSpan: 3 },
        { content: 'VOL', rowSpan: 3 },
        { content: 'TAHAP 2 - HITUNG VOLUME KERUSAKAN KOMPONEN', colSpan: 8 },
        { content: 'TAHAP 1 - PENGAMATAN', rowSpan: 3 },
        { content: 'PERHITUNGAN TINGKAT KERUSAKAN', colSpan: 8 },
        { content: 'BOBOT', rowSpan: 3 },
        { content: 'NILAI', rowSpan: 3 }
      ],
      [
        { content: 'Tdk Rusak', rowSpan: 2 },
        { content: 'Rusak, dgn Tingkat:', colSpan: 5 },
        { content: 'Tdk Sesuai', rowSpan: 2 },
        { content: 'Ket', rowSpan: 2 },
        '1', '2', '3', '4', '5', '6', '7', 'TOTAL'
      ],
      [
        'Sngt Ringan', 'Ringan', 'Sedang', 'Berat', 'Sngt Berat',
        '0.00', '0.20', '0.35', '0.50', '0.70', '0.85', '1.00'
      ]
    ],
    body: componentRows,
    theme: 'grid',
    headStyles: { fillColor: [68, 114, 196], fontSize: 5, halign: 'center', valign: 'middle', cellPadding: 0.5 },
    styles: { fontSize: 5, cellPadding: 1, halign: 'center', valign: 'middle' },
    columnStyles: {
      1: { halign: 'left' },
      2: { halign: 'left' },
      13: { halign: 'left' } // TAHAP 1
    }
  });

  // Disposisi Data (if any)
  if (assessment.disposisiData) {
    let dispData: any = {};
    try {
      dispData = typeof assessment.disposisiData === "string" ? JSON.parse(assessment.disposisiData) : assessment.disposisiData;
    } catch (e) {}

    const currentY3 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Informasi Disposisi", 14, currentY3);

    const dispRows = [
      ["No. Agenda", dispData.noAgenda || "-", "Nomor Surat", dispData.nomorSurat || "-"],
      ["Indeks", dispData.indeks || "-", "Kode", dispData.kode || "-"],
      ["Diteruskan Kepada", dispData.diteruskan?.join(", ") || "-", "Harap", dispData.harap?.join(", ") || "-"],
      ["Catatan Pimpinan", { content: dispData.catatan || "-", colSpan: 3 }],
      ["Nama Pimpinan", dispData.namaPimpinan || "-", "NIP", dispData.nipPimpinan || "-"]
    ];

    autoTable(doc, {
      startY: currentY3 + 5,
      body: dispRows,
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { cellWidth: 60 },
        2: { fontStyle: 'bold', cellWidth: 30 },
        3: { cellWidth: 60 }
      }
    });
  }

  // Footer & Signature
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  if (finalY > 120) { // Since the footer is large (~130px height), add page if not enough space
    doc.addPage();
    finalY = 20;
  }
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  
  // Left Box: Sketsa
  doc.rect(14, finalY, 170, 130);
  doc.text("SKETSA DENAH BANGUNAN", 14 + 170/2, finalY + 5, { align: "center" });
  // Underline SKETSA DENAH BANGUNAN
  doc.setLineWidth(0.2);
  doc.line(14 + 170/2 - 25, finalY + 6, 14 + 170/2 + 25, finalY + 6);

  // Right Side (Starting at X = 190)
  const rightX = 190;
  let currY = finalY;

  // Tingkat Kerusakan Table
  doc.rect(rightX, currY, 93, 20); // main box
  doc.line(rightX + 30, currY, rightX + 30, currY + 20); // separator
  doc.line(rightX, currY + 5, rightX + 93, currY + 5); // header separator
  
  doc.text("Tingkat Kerusakan", rightX + 93/2, currY + 4, { align: "center" });
  doc.setFont("helvetica", "normal");
  
  doc.text("Ringan", rightX + 2, currY + 9);
  doc.text(": \u2264 30%", rightX + 32, currY + 9);
  
  doc.text("Sedang", rightX + 2, currY + 14);
  doc.text(": > 30% - 45%", rightX + 32, currY + 14);
  
  doc.text("Berat", rightX + 2, currY + 19);
  doc.text(": > 45%", rightX + 32, currY + 19);

  currY += 28;
  
  // TIM SURVEI
  doc.setFont("helvetica", "bold");
  doc.text("TIM SURVEI :", rightX + 93/2, currY, { align: "center" });
  currY += 5;
  
  doc.setFont("helvetica", "normal");
  doc.text("1. Enjang Wahyudin, ST", rightX, currY);
  doc.text("....................................", rightX + 60, currY);
  currY += 4;
  doc.text("NIP 199112182019031011", rightX + 4, currY);
  currY += 6;
  
  doc.text("2. Haris Nugraha", rightX, currY);
  doc.text("....................................", rightX + 60, currY);
  currY += 4;
  doc.text("NIP 197703292025211012", rightX + 4, currY);
  currY += 6;
  
  doc.text("3. Nendi Supriadi", rightX, currY);
  doc.text("....................................", rightX + 60, currY);
  currY += 4;
  doc.text("NIP 198302022025211069", rightX + 4, currY);
  currY += 10;

  // DIPERIKSA
  doc.setFont("helvetica", "bold");
  doc.text("DIPERIKSA", rightX + 93/2, currY, { align: "center" });
  currY += 4;
  doc.setFont("helvetica", "normal");
  doc.text("Sub Koordinator Penataan Bangunan dan", rightX + 93/2, currY, { align: "center" });
  currY += 15;
  doc.setFont("helvetica", "bold");
  doc.text("Asep Tedi Sugianto, ST., M.Si.", rightX + 93/2, currY, { align: "center" });
  doc.line(rightX + 93/2 - 25, currY + 1, rightX + 93/2 + 25, currY + 1);
  currY += 4;
  doc.setFont("helvetica", "normal");
  doc.text("NIP. 19770525 201410 1 002", rightX + 93/2, currY, { align: "center" });
  currY += 10;

  // MENYETUJUI
  doc.setFont("helvetica", "bold");
  doc.text("MENYETUJUI", rightX + 93/2, currY, { align: "center" });
  currY += 4;
  doc.setFont("helvetica", "normal");
  doc.text("Kepala Bidang Bangunan", rightX + 93/2, currY, { align: "center" });
  currY += 4;
  doc.text("Dinas PUPR Kab Garut", rightX + 93/2, currY, { align: "center" });
  currY += 15;
  doc.setFont("helvetica", "bold");
  doc.text("Dedi Komara, ST., M.Si.", rightX + 93/2, currY, { align: "center" });
  doc.line(rightX + 93/2 - 20, currY + 1, rightX + 93/2 + 20, currY + 1);
  currY += 4;
  doc.setFont("helvetica", "normal");
  doc.text("NIP. 19760527 201001 1 002", rightX + 93/2, currY, { align: "center" });
  currY += 10;

  // MENGETAHUI
  doc.setFont("helvetica", "bold");
  doc.text("MENGETAHUI", rightX + 93/2, currY, { align: "center" });

  // Note
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Note :", 14, finalY + 130 + 5);
  doc.text("*    : Dinas PU/Dinas yang menangani Bangunan Gedung", 14, finalY + 130 + 9);
  doc.rect(14, finalY + 130 + 1, 100, 10);

  doc.save(`Laporan_Penilaian_${assessment.id.substring(0, 8)}.pdf`);
};
