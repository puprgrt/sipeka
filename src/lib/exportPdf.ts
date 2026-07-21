import { apiFetch } from "../lib/api";
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

export const exportAssessmentToPdf = async (assessment: Assessment, history: any[] = []) => {
  const getBase64Image = async (url: string) => {
    try {
      if (url.startsWith('data:image')) return url;
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("Gagal memuat image", e);
      return null;
    }
  };

  let componentsConfig: any[] = [];
  try {
    const res = await apiFetch("/api/components");
    componentsConfig = await res.json();
  } catch (error) {
    console.error("Failed to fetch components config for PDF export", error);
  }
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

  // Gambar Denah Bangunan
  let currentY = (doc as any).lastAutoTable.finalY + 10;
  
  if (assessment.customFields?.floorPlanImage) {
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Gambar Denah Bangunan", 14, currentY);
    
    try {
      const floorPlanB64 = await getBase64Image(assessment.customFields.floorPlanImage);
      if (floorPlanB64) {
        // Asumsi format PNG/JPEG, jspdf bisa auto-detect dari base64 data uri
        doc.addImage(floorPlanB64, 14, currentY + 5, 180, 100);
        currentY += 115;
      }
    } catch(e) {
      console.error("Gagal menambahkan denah bangunan ke PDF", e);
    }
  }

  // Hasil Analisis
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
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
  let weights: Record<string, number> = {};
  let systemMap: Record<string, string> = {};

  if (Array.isArray(componentsConfig) && componentsConfig.length > 0) {
    componentsConfig.forEach((c: any) => {
      systemMap[c.namaKomponen] = (c.kategoriKomponen || "STRUKTUR").toUpperCase();
      let weightStr = floorCount === 1 ? c.bobotFormA : floorCount === 2 ? c.bobotFormB : c.bobotFormC;
      weights[c.namaKomponen] = parseFloat(weightStr || "0");
    });
  } else {
    weights = floorCount === 2 
      ? COMPONENT_WEIGHTS_2_LANTAI 
      : floorCount >= 3 
        ? COMPONENT_WEIGHTS_3_LANTAI 
        : COMPONENT_WEIGHTS_1_LANTAI;

    systemMap = {
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
  }

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

  const tteStr = (assessment as any).tteSignatures;
  const tte = tteStr ? (typeof tteStr === 'string' ? JSON.parse(tteStr) : tteStr) : {};
  const timTeknisTte = tte['Tim_Teknis'];
  const koordinatorTte = tte['Koordinator'];

  doc.text("Disusun Oleh,", 20, finalY);
  doc.text("Tim Teknis Lapangan", 20, finalY + 5);
  if (timTeknisTte && timTeknisTte.qrCodeUrl) {
    const b64 = await getBase64Image(timTeknisTte.qrCodeUrl);
    if (b64) doc.addImage(b64, 'PNG', 30, finalY + 8, 18, 18);
  }
  doc.line(20, finalY + 28, 70, finalY + 28);
  doc.text(timTeknisTte ? timTeknisTte.name : "NIP. / Tanda Tangan", 20, finalY + 33);

  doc.text("Disetujui Oleh,", 140, finalY);
  doc.text("Koordinator / Pejabat Berwenang", 140, finalY + 5);
  if (koordinatorTte && koordinatorTte.qrCodeUrl) {
    const b64 = await getBase64Image(koordinatorTte.qrCodeUrl);
    if (b64) doc.addImage(b64, 'PNG', 150, finalY + 8, 18, 18);
  }
  doc.line(140, finalY + 28, 190, finalY + 28);
  doc.text(koordinatorTte ? koordinatorTte.name : "NIP.", 140, finalY + 33);

  const fileName = `Laporan_Penilaian_${assessment.id.substring(0, 8)}.pdf`;
  
  // Background backup to System Drive
  try {
    const pdfBlob = doc.output('blob');
    const formData = new FormData();
    formData.append("file", pdfBlob, fileName);
    formData.append("idUser", localStorage.getItem("activeUserId") || "1");
    formData.append("namaFile", fileName);
    formData.append("tipeDokumen", "Laporan_Penilaian");
    
    apiFetch("/api/drive/backup", { method: "POST", body: formData })
      .catch(e => console.warn("System backup failed", e));
  } catch (e) {
    console.warn("Failed to prepare backup", e);
  }

  doc.save(fileName);
};

export const exportIkmReportToPdf = async (stats: any, responses: any[], aiNarrative: string = "", radarImg: string = "", pieImg: string = "") => {
  let questionsConfig: any[] = [];
  try {
    const res = await apiFetch("/api/settings/ikm-questions");
    questionsConfig = await res.json();
  } catch (error) {
    console.error("Failed to fetch IKM questions config for PDF export", error);
  }

  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Laporan Komprehensif Indeks Kepuasan Masyarakat (IKM)", 105, 20, { align: "center" });
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Dinas Pekerjaan Umum dan Penataan Ruang", 105, 26, { align: "center" });
  
  doc.setLineWidth(0.5);
  doc.line(14, 32, 196, 32);
  
  // Ringkasan
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("1. Ringkasan Eksekutif", 14, 42);
  
  const IKM_UNSUR_LABELS: Record<string, string> = {};
  if (questionsConfig.length > 0) {
    questionsConfig.forEach(q => {
      IKM_UNSUR_LABELS[q.key] = q.label;
    });
  } else {
    // Fallback
    Object.assign(IKM_UNSUR_LABELS, {
      u1: "Persyaratan", u2: "Prosedur", u3: "Waktu", u4: "Biaya/Tarif",
      u5: "Spesifikasi Produk", u6: "Kompetensi", u7: "Perilaku", u8: "Pengaduan", u9: "Sarana/Prasarana"
    });
  }

  let mutuPelayanan = "Tidak Baik";
  if (stats?.averageIKM >= 88.31) mutuPelayanan = "Sangat Baik (A)";
  else if (stats?.averageIKM >= 76.61) mutuPelayanan = "Baik (B)";
  else if (stats?.averageIKM >= 65.00) mutuPelayanan = "Kurang Baik (C)";
  else mutuPelayanan = "Tidak Baik (D)";

  const summaryData = [
    ["Total Responden", `${stats?.totalResponses || 0} Pengelola Bangunan`],
    ["Nilai IKM Rata-Rata", `${stats?.averageIKM || 0} / 100`],
    ["Mutu Pelayanan", mutuPelayanan]
  ];

  autoTable(doc, {
    startY: 46,
    body: summaryData,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 10;

  // Visualisasi Statistik
  if (radarImg || pieImg) {
    if (currentY > 200) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("2. Visualisasi Statistik", 14, currentY);
    
    const imgWidth = 85;
    const imgHeight = 70;
    let currentX = 14;
    
    if (radarImg) {
      doc.addImage(radarImg, 'PNG', currentX, currentY + 5, imgWidth, imgHeight);
      currentX += imgWidth + 5;
    }
    if (pieImg) {
      doc.addImage(pieImg, 'PNG', currentX, currentY + 5, imgWidth, imgHeight);
    }
    
    currentY += imgHeight + 15;
  }

  // Analisis Komprehensif (AI Narrative)
  if (aiNarrative) {
    if (currentY > 220) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("3. Analisis dan Kesimpulan Komprehensif (AI-Generated)", 14, currentY);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const splitText = doc.splitTextToSize(aiNarrative, 180);
    currentY += 8;
    
    for (let i = 0; i < splitText.length; i++) {
      if (currentY > 280) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(splitText[i], 14, currentY);
      currentY += 5;
    }
    
    currentY += 5;
  }

  // Nilai Per Unsur
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }
  doc.setFont("helvetica", "bold");
  doc.text("4. Nilai Rata-Rata per Unsur Pelayanan", 14, currentY);
  
  const unsurData = stats?.averages ? Object.entries(stats.averages).map(([key, val]) => [
    key.toUpperCase(), IKM_UNSUR_LABELS[key] || key, val
  ]) : [];

  autoTable(doc, {
    startY: currentY + 4,
    head: [["Kode", "Unsur Pelayanan", "Skor (Skala 1-4)"]],
    body: unsurData,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229] }
  });

  // Testimoni
  currentY = (doc as any).lastAutoTable.finalY + 10;
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.setFont("helvetica", "bold");
  doc.text("5. Testimoni dan Masukan Responden", 14, currentY);

  const testimoniData = responses.slice(0, 50).map((r, i) => [
    i + 1,
    `${r.buildingName}\n(${r.schoolName})`,
    format(new Date(r.date), "dd MMM yyyy", { locale: idLocale }),
    r.nilaiIkm,
    r.testimoni || "-"
  ]);

  autoTable(doc, {
    startY: currentY + 4,
    head: [["No", "Lokasi/Bangunan", "Tanggal", "IKM", "Testimoni"]],
    body: testimoniData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 45 },
      2: { cellWidth: 25 },
      3: { cellWidth: 15 },
      4: { cellWidth: 'auto' }
    },
    headStyles: { fillColor: [79, 70, 229] }
  });

  // Footer & Signature
  currentY = (doc as any).lastAutoTable.finalY + 20;
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  const dateStr = format(new Date(), "dd MMMM yyyy", { locale: idLocale });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Dicetak pada: ${dateStr}`, 14, currentY);

  doc.text("Mengetahui,", 140, currentY);
  doc.text("Administrator SIPEKA", 140, currentY + 5);
  doc.line(140, currentY + 28, 190, currentY + 28);

  const fileName = `Laporan_Komprehensif_IKM.pdf`;
  
  // Background backup to System Drive
  try {
    const pdfBlob = doc.output('blob');
    const formData = new FormData();
    formData.append("file", pdfBlob, fileName);
    formData.append("idUser", localStorage.getItem("activeUserId") || "1");
    formData.append("namaFile", fileName);
    formData.append("tipeDokumen", "Lainnya");
    
    apiFetch("/api/drive/backup", { method: "POST", body: formData })
      .catch(e => console.warn("System backup failed", e));
  } catch (e) {
    console.warn("Failed to prepare backup", e);
  }

  doc.save(fileName);
};
