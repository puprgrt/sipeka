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
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Laporan Penilaian Kerusakan Bangunan", 105, 20, { align: "center" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Dinas Pekerjaan Umum dan Penataan Ruang", 105, 26, { align: "center" });
  doc.text("Bidang Bangunan", 105, 31, { align: "center" });
  
  doc.setLineWidth(0.5);
  doc.line(14, 35, 196, 35);
  
  // Info Bangunan
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Informasi Bangunan", 14, 45);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  const infoData = [
    ["ID Penilaian", assessment.id, "Tanggal", format(new Date(assessment.date), "dd MMMM yyyy", { locale: idLocale })],
    ["Nama Sekolah/Instansi", assessment.schoolName, "NPSN", assessment.npsn || "-"],
    ["Nama Bangunan", assessment.buildingName, "NUP", assessment.nup || "-"],
    ["Alamat", assessment.address, "Kota/Provinsi", `${assessment.city}, ${assessment.province}`],
    ["Luas Bangunan", `${assessment.buildingArea} m²`, "Jml Lantai", `${assessment.floorCount}`],
  ];

  autoTable(doc, {
    startY: 50,
    body: infoData,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 60 },
      2: { fontStyle: 'bold', cellWidth: 30 },
      3: { cellWidth: 60 }
    }
  });

  // Hasil Analisis
  const currentY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Hasil Analisis Kerusakan", 14, currentY);

  const totalDamage = assessment.finalResult?.totalDamagePercentage || 0;
  const category = assessment.finalResult?.category || "-";
  const bhi = (100 - totalDamage).toFixed(1);

  const resultData = [
    ["Tingkat Kerusakan Total", `${totalDamage.toFixed(2)}%`, "Kategori", category],
    ["Skor BHI (Kesehatan Bangunan)", bhi, "Status", assessment.status?.replace(/_/g, " ") || "-"],
  ];

  autoTable(doc, {
    startY: currentY + 5,
    body: resultData,
    theme: 'grid',
    headStyles: { fillColor: [63, 81, 181] },
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 40 },
      2: { fontStyle: 'bold', cellWidth: 40 },
      3: { cellWidth: 50 }
    }
  });

  // Rincian Komponen
  const currentY2 = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Rincian Kerusakan per Komponen", 14, currentY2);

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

  const componentRows = Object.keys(weights).filter(name => weights[name] > 0).map(name => {
    const weight = weights[name];
    const compData = assessment.components?.find(c => c.name === name);
    const isSafetyRisk = compData?.safetyImpact ? "Ya" : "Tidak";

    let componentDamageFraction = 0;
    compData?.damageDetails?.forEach(detail => {
      const multiplier = DAMAGE_MULTIPLIERS[detail.level] || 0;
      const volumeFraction = (detail.percentage || 0) / 100;
      componentDamageFraction += volumeFraction * multiplier;
    });
    componentDamageFraction = Math.min(componentDamageFraction, 1.0);
    const totalCompDamagePct = componentDamageFraction * 100;
    const nilaiKerusakanThdMassa = componentDamageFraction * weight;

    return [
      name,
      systemMap[name] || "STRUKTUR",
      `${weight.toFixed(2)}%`,
      `${totalCompDamagePct.toFixed(2)}%`,
      `${nilaiKerusakanThdMassa.toFixed(2)}%`,
      isSafetyRisk
    ];
  });

  autoTable(doc, {
    startY: currentY2 + 5,
    head: [["Nama Komponen", "Sistem", "Bobot Komponen", "Tkt Kerusakan", "Kontribusi Thd Massa", "Risiko Keselamatan"]],
    body: componentRows,
    theme: 'striped',
    headStyles: { fillColor: [44, 62, 80] },
    styles: { fontSize: 8.5 }
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
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  if (finalY > 250) {
    doc.addPage();
  }
  const dateStr = format(new Date(), "dd MMMM yyyy", { locale: idLocale });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Dicetak pada: ${dateStr}`, 14, finalY);
  
  doc.text("Disusun Oleh,", 20, finalY);
  doc.text("Tim Teknis Lapangan", 20, finalY + 5);
  doc.line(20, finalY + 25, 70, finalY + 25);
  doc.text("NIP. / Tanda Tangan", 20, finalY + 30);

  doc.text("Disetujui Oleh,", 140, finalY);
  doc.text("Koordinator / Pejabat Berwenang", 140, finalY + 5);
  doc.line(140, finalY + 25, 190, finalY + 25);
  doc.text("NIP.", 140, finalY + 30);

  doc.save(`Laporan_Penilaian_${assessment.id.substring(0, 8)}.pdf`);
};
