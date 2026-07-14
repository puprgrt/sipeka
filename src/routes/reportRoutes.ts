import express from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, inArray } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const router = express.Router();

router.get("/api/reports/batch-export", async (req, res) => {
  try {
    const format = req.query.format as string || 'excel';
    
    // Fetch data
    const assessments = await db.select().from(schema.permohonanPenilaian);
    const buildings = await db.select().from(schema.profilBangunan);
    const users = await db.select().from(schema.users);

    const mergedData = assessments.map(a => {
      const b = buildings.find(b => b.idBangunan === a.idBangunan);
      const u = users.find(u => u.idUser === b?.idUserPengelola);
      return {
        idPermohonan: a.idPermohonan,
        sekolah: b?.namaSekolahInstansi || '-',
        bangunan: b?.namaMassaBangunan || '-',
        pengelola: u?.nama || '-',
        status: a.statusTerakhir || '-',
        kesimpulan: a.kesimpulanAkhir || '-',
        kerusakan: a.totalPersentaseKerusakan ? `${a.totalPersentaseKerusakan}%` : '-',
        tanggal: a.tanggalPengajuan.toISOString().split('T')[0]
      };
    });

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Rekapitulasi Penilaian');
      
      worksheet.columns = [
        { header: 'ID Permohonan', key: 'idPermohonan', width: 36 },
        { header: 'Sekolah/Instansi', key: 'sekolah', width: 30 },
        { header: 'Nama Bangunan', key: 'bangunan', width: 30 },
        { header: 'Pengelola', key: 'pengelola', width: 25 },
        { header: 'Tanggal', key: 'tanggal', width: 15 },
        { header: 'Status', key: 'status', width: 20 },
        { header: 'Tingkat Kerusakan', key: 'kerusakan', width: 15 },
        { header: 'Kesimpulan', key: 'kesimpulan', width: 20 }
      ];

      worksheet.addRows(mergedData);

      // Styling header
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=' + 'rekapitulasi_sipeka.xlsx');

      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=' + 'rekapitulasi_sipeka.pdf');
      
      doc.pipe(res);
      
      doc.fontSize(16).text('Laporan Rekapitulasi Penilaian SIPEKA', { align: 'center' });
      doc.moveDown();
      
      const tableTop = 100;
      let y = tableTop;
      
      // Header
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('ID Permohonan', 50, y);
      doc.text('Instansi', 200, y);
      doc.text('Tanggal', 350, y);
      doc.text('Status', 450, y);
      doc.text('Kerusakan', 550, y);
      doc.text('Kesimpulan', 650, y);
      
      doc.moveTo(50, y + 15).lineTo(750, y + 15).stroke();
      y += 25;
      
      // Rows
      doc.font('Helvetica');
      for (const row of mergedData) {
        if (y > 500) {
          doc.addPage();
          y = 50;
        }
        
        doc.text(row.idPermohonan.substring(0, 15) + '...', 50, y);
        doc.text(row.sekolah.substring(0, 20), 200, y);
        doc.text(row.tanggal, 350, y);
        doc.text(row.status.replace(/_/g, ' '), 450, y);
        doc.text(row.kerusakan, 550, y);
        doc.text(row.kesimpulan, 650, y);
        
        y += 20;
      }
      
      doc.end();
    } else {
      res.status(400).json({ error: "Unsupported format" });
    }
  } catch (error) {
    console.error("Export error", error);
    res.status(500).json({ error: "Failed to export data" });
  }
});

export default router;
