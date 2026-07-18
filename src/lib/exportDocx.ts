import { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
  WidthType, HeadingLevel, ImageRun, AlignmentType,
  PageBreak
} from "docx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// Convert base64 data URI to ArrayBuffer for docx ImageRun
function base64DataUriToArrayBuffer(dataURI: string): ArrayBuffer {
  const base64 = dataURI.split(',')[1];
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export const exportIkmReportToDocx = async (
  stats: any, 
  responses: any[], 
  aiNarrative: string = "", 
  radarImg: string = "", 
  pieImg: string = ""
) => {
  let questionsConfig: any[] = [];
  try {
    const res = await fetch("/api/settings/ikm-questions");
    questionsConfig = await res.json();
  } catch (error) {
    console.error("Failed to fetch IKM questions config for DOCX export", error);
  }

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

  // 1. Ringkasan Eksekutif Table
  const summaryTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total Responden", bold: true })] })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
          new TableCell({ children: [new Paragraph(`${stats?.totalResponses || 0} Pengelola Bangunan`)], margins: { top: 100, bottom: 100, left: 100, right: 100 } })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Nilai IKM Rata-Rata", bold: true })] })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
          new TableCell({ children: [new Paragraph(`${stats?.averageIKM || 0} / 100`)], margins: { top: 100, bottom: 100, left: 100, right: 100 } })
        ]
      }),
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Mutu Pelayanan", bold: true })] })], margins: { top: 100, bottom: 100, left: 100, right: 100 } }),
          new TableCell({ children: [new Paragraph(mutuPelayanan)], margins: { top: 100, bottom: 100, left: 100, right: 100 } })
        ]
      })
    ]
  });

  // 2. Images (Visualisasi)
  const visualizationParagraphs: Paragraph[] = [];
  if (radarImg || pieImg) {
    visualizationParagraphs.push(
      new Paragraph({ text: "2. Visualisasi Statistik", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } })
    );

    const imageRuns: ImageRun[] = [];
    if (radarImg) {
      imageRuns.push(new ImageRun({
        data: base64DataUriToArrayBuffer(radarImg),
        transformation: { width: 300, height: 250 }
      }));
    }
    
    // Add some spacing between images
    if (radarImg && pieImg) {
      imageRuns.push(new ImageRun({
        data: base64DataUriToArrayBuffer("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="), // 1px transparent png
        transformation: { width: 20, height: 1 }
      }));
    }

    if (pieImg) {
      imageRuns.push(new ImageRun({
        data: base64DataUriToArrayBuffer(pieImg),
        transformation: { width: 300, height: 250 }
      }));
    }

    visualizationParagraphs.push(new Paragraph({ children: imageRuns, alignment: AlignmentType.CENTER }));
  }

  // 3. AI Narrative
  const aiParagraphs: Paragraph[] = [];
  if (aiNarrative) {
    aiParagraphs.push(
      new Paragraph({ text: "3. Analisis dan Kesimpulan Komprehensif (AI-Generated)", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } })
    );
    
    // Split by double newline to form distinct paragraphs
    const textBlocks = aiNarrative.split('\n');
    textBlocks.forEach(block => {
      if (block.trim()) {
        aiParagraphs.push(new Paragraph({
          children: [new TextRun(block)],
          spacing: { after: 120 }
        }));
      }
    });
  }

  // 4. Nilai per Unsur Table
  const unsurData = stats?.averages ? Object.entries(stats.averages).map(([key, val]) => [
    key.toUpperCase(), IKM_UNSUR_LABELS[key] || key, String(val)
  ]) : [];

  const unsurTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ shading: { fill: "4F46E5" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Kode", color: "FFFFFF", bold: true })] })] }),
          new TableCell({ shading: { fill: "4F46E5" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Unsur Pelayanan", color: "FFFFFF", bold: true })] })] }),
          new TableCell({ shading: { fill: "4F46E5" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Skor (Skala 1-4)", color: "FFFFFF", bold: true })] })] }),
        ]
      }),
      ...unsurData.map((row, idx) => {
        const bg = idx % 2 === 0 ? "FFFFFF" : "F8FAFC";
        return new TableRow({
          children: [
            new TableCell({ shading: { fill: bg }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph(row[0])] }),
            new TableCell({ shading: { fill: bg }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph(row[1])] }),
            new TableCell({ shading: { fill: bg }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph(row[2])] }),
          ]
        });
      })
    ]
  });

  // 5. Testimoni Table
  const testimoniData = responses.slice(0, 50).map((r, i) => [
    String(i + 1),
    `${r.buildingName}\n(${r.schoolName})`,
    format(new Date(r.date), "dd MMM yyyy", { locale: idLocale }),
    String(r.nilaiIkm),
    r.testimoni || "-"
  ]);

  const testimoniTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          new TableCell({ shading: { fill: "4F46E5" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "No", color: "FFFFFF", bold: true })] })] }),
          new TableCell({ shading: { fill: "4F46E5" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Lokasi/Bangunan", color: "FFFFFF", bold: true })] })] }),
          new TableCell({ shading: { fill: "4F46E5" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Tanggal", color: "FFFFFF", bold: true })] })] }),
          new TableCell({ shading: { fill: "4F46E5" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "IKM", color: "FFFFFF", bold: true })] })] }),
          new TableCell({ shading: { fill: "4F46E5" }, margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph({ children: [new TextRun({ text: "Testimoni", color: "FFFFFF", bold: true })] })] }),
        ]
      }),
      ...testimoniData.map(row => {
        return new TableRow({
          children: [
            new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph(row[0])] }),
            new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: row[1].split('\n').map(line => new Paragraph(line)) }),
            new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph(row[2])] }),
            new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph(row[3])] }),
            new TableCell({ margins: { top: 100, bottom: 100, left: 100, right: 100 }, children: [new Paragraph(row[4])] }),
          ]
        });
      })
    ]
  });

  // Assemble document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: "Laporan Komprehensif Indeks Kepuasan Masyarakat (IKM)",
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            text: "Dinas Pekerjaan Umum dan Penataan Ruang",
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          
          new Paragraph({ text: "1. Ringkasan Eksekutif", heading: HeadingLevel.HEADING_2, spacing: { after: 200 } }),
          summaryTable,
          
          ...visualizationParagraphs,
          
          ...aiParagraphs,
          
          new Paragraph({ children: [new PageBreak()] }), // Force new page for Unsur
          new Paragraph({ text: "4. Nilai Rata-Rata per Unsur Pelayanan", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
          unsurTable,

          new Paragraph({ text: "5. Testimoni dan Masukan Responden", heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 200 } }),
          testimoniTable,

          new Paragraph({
            spacing: { before: 800 },
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: `Dicetak pada: ${format(new Date(), "dd MMMM yyyy", { locale: idLocale })}` })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: "Mengetahui," })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 600 },
            children: [
              new TextRun({ text: "Administrator SIPEKA" })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: "_______________________" })
            ]
          }),
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, "Laporan_Komprehensif_IKM.docx");
};
