import React from "react";
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";

interface PdfPreviewProps {
  selectedFile: any;
  previewScale: number;
  setPreviewScale: React.Dispatch<React.SetStateAction<number>>;
  previewPage: number;
  setPreviewPage: React.Dispatch<React.SetStateAction<number>>;
}

export default function PdfPreview({
  selectedFile,
  previewScale,
  setPreviewScale,
  previewPage,
  setPreviewPage
}: PdfPreviewProps) {
  return (
    <div className="w-full h-full flex flex-col bg-slate-800/90 border border-slate-700/55 rounded-2xl overflow-hidden shadow-md">
      {/* PDF Reader Header controls */}
      <div className="px-4 py-2 bg-slate-800 border-b border-slate-700/80 flex items-center justify-between text-white text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wide uppercase text-[9px] bg-red-600 px-1.5 py-0.5 rounded text-white font-sans shrink-0">
            PDF Reader
          </span>
          <span className="text-[10px] text-slate-400 hidden sm:inline truncate max-w-[150px]">
            {selectedFile.name}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border-r border-slate-700 pr-2.5">
            <button 
              disabled={previewScale <= 0.6}
              onClick={() => setPreviewScale(p => Math.max(0.6, p - 0.2))}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono w-10 text-center text-slate-300">
              {Math.round(previewScale * 100)}%
            </span>
            <button 
              disabled={previewScale >= 1.6}
              onClick={() => setPreviewScale(p => Math.min(1.6, p + 0.2))}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              disabled={previewPage <= 1}
              onClick={() => setPreviewPage(p => p - 1)}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-medium text-slate-300">
              {previewPage} / 2
            </span>
            <button 
              disabled={previewPage >= 2}
              onClick={() => setPreviewPage(p => p + 1)}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* PDF body page simulation */}
      <div className="flex-1 p-4 overflow-auto flex justify-center bg-slate-700 custom-scrollbar relative">
        {selectedFile.previewUrl && !selectedFile.id.startsWith("file") && !selectedFile.id.startsWith("mock") ? (
          <iframe 
            src={selectedFile.previewUrl.replace(/\/view.*$/, "/preview")} 
            className="w-full h-full border-0 rounded"
            style={{ transform: `scale(${previewScale})`, transformOrigin: "top center" }}
            title={selectedFile.name}
          />
        ) : (
          <div 
            className="bg-white shadow-xl p-8 text-slate-800 transition-all text-left relative overflow-hidden select-text"
            style={{ 
              width: "210mm", 
              minHeight: "297mm", 
              transform: `scale(${previewScale * 0.7})`, 
              transformOrigin: "top center",
              fontSize: "12px",
              lineHeight: "1.5"
            }}
          >
            {previewPage === 1 ? (
              <>
                {/* Page 1: Kop Surat & Letter Body */}
                <div className="text-center border-b-[3px] border-slate-900 pb-3 mb-5 select-none">
                  <h1 className="font-bold text-lg leading-tight uppercase font-serif tracking-wide text-slate-900">
                    PEMERINTAH KABUPATEN GARUT
                  </h1>
                  <h2 className="font-bold text-base leading-tight uppercase text-slate-900">
                    DINAS PEKERJAAN UMUM DAN PENATAAN RUANG
                  </h2>
                  <p className="text-[9px] text-slate-500 italic mt-1 font-sans">
                    Jl. Pahlawan No. 45, Garut, Jawa Barat. Telp: (0262) 123456 | Email: pupr@garutkab.go.id
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[11px] mb-6 select-none font-medium">
                  <div>
                    <p>Nomor : 600/142/PUPR/CiptaKarya/2026</p>
                    <p>Sifat : Segera (Penting)</p>
                    <p>Lampiran : 1 (satu) Berkas Lengkap</p>
                  </div>
                  <div className="text-right">
                    <p>Garut, {new Date(selectedFile.updatedAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
                    <p>Perihal : Rekomendasi Teknis Penilaian</p>
                  </div>
                </div>

                <div className="mb-6 font-medium text-[11px]">
                  <p>Kepada Yth,</p>
                  <p className="font-bold">Bupati Garut / Kepala Dinas Pendidikan</p>
                  <p>di Tempat</p>
                </div>

                <div className="space-y-3.5 text-justify text-[11.5px] leading-relaxed">
                  <p>
                    Dengan hormat, menindaklanjuti permohonan penilaian kelaikan fungsi bangunan gedung pendidikan dari <strong className="font-bold">{selectedFile.name.includes("SDN_1") ? "SDN 1 Garut" : "Lembaga Pemohon"}</strong>, Tim Teknis Dinas Pekerjaan Umum dan Penataan Ruang Kabupaten Garut telah melaksanakan peninjauan dan investigasi kelaikan fisik langsung ke lokasi bangunan.
                  </p>
                  <p>
                    Metode pemeriksaan meliputi analisis kekuatan visual (visual inspection method), pengukuran keretakan beton, identifikasi korosi tulangan baja, serta pelapukan elemen pendukung sekunder (plafon/kuda-kuda kayu). Berdasarkan hasil kompilasi data dan analisis parameter terstandar:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 font-medium">
                    <li>Klasifikasi Kerusakan : <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">KERUSAKAN RINGAN (SKOR: 82.50%)</span></li>
                    <li>Rekomendasi Utama : <strong className="font-bold text-green-700">Laik Fungsi dengan Catatan Pemeliharaan</strong></li>
                    <li>Tindakan Segera : Rehabilitasi elemen rangka atap/genteng bocor dan penambalan retak rambut kolom.</li>
                  </ul>
                  <p>
                    Laporan teknis lengkap dan lampiran estimasi kebutuhan anggaran rehabilitasi bangunan terlampir pada halaman selanjutnya. Demikian rekomendasi teknis ini disampaikan untuk menjadi acuan penanganan lebih lanjut.
                  </p>
                </div>

                {/* Stamp & Signature block */}
                <div className="mt-14 float-right text-center mr-10 relative select-none w-56">
                  <p className="text-[11px]">Kepala Dinas PUPR,</p>
                  <div className="h-16 relative flex items-center justify-center my-1.5">
                    <div className="absolute w-14 h-14 border-[2px] border-blue-500/30 rounded-full flex items-center justify-center -rotate-12 select-none">
                      <span className="text-[7px] text-blue-500/60 font-bold uppercase text-center leading-tight">
                        PUPR GARUT<br/>STAMP
                      </span>
                    </div>
                    <svg className="w-20 h-10 text-blue-600/80 -rotate-6" viewBox="0 0 100 50">
                      <path d="M10,25 Q30,10 50,25 T90,25" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M20,35 Q40,45 60,30 T80,35" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </div>
                  <p className="font-bold text-[11px] underline">Dr. H. Ahmad, M.T.</p>
                  <p className="text-[9px] text-slate-500">NIP. 19750812 200112 1 002</p>
                </div>
              </>
            ) : (
              <>
                {/* Page 2: Checklist Kerusakan detail */}
                <div className="border-b-[2px] border-slate-300 pb-2 mb-4 select-none">
                  <h3 className="font-bold text-xs uppercase text-slate-800 tracking-wider">
                    LAMPIRAN: DETAIL CHECKLIST PENILAIAN TEKNIS LAPANGAN
                  </h3>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">ID Dokumen: {selectedFile.id}</p>
                </div>

                <table className="w-full text-left text-[10.5px] border-collapse mb-6 select-text">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                      <th className="p-2 border border-slate-300">Komponen Bangunan</th>
                      <th className="p-2 border border-slate-300 text-center">Kerusakan (%)</th>
                      <th className="p-2 border border-slate-300">Temuan Lapangan / Defek Teknis</th>
                      <th className="p-2 border border-slate-300 text-center">Saran Penanganan</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 border border-slate-300 font-semibold">1. Pondasi & Sloof</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">1.50%</td>
                      <td className="p-2 border border-slate-300 text-slate-600">Pondasi stabil, penurunan tanah di bawah batas toleransi normal.</td>
                      <td className="p-2 border border-slate-300 text-center text-slate-500">Pemantauan berkala</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 border border-slate-300 font-semibold">2. Kolom & Balok</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">4.20%</td>
                      <td className="p-2 border border-slate-300 text-slate-600">Retak rambut mikro pada pertemuan balok kelas B, penutup retak mengelupas.</td>
                      <td className="p-2 border border-slate-300 text-center text-slate-500">Injeksi Epoksi Retak</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 border border-slate-300 font-semibold">3. Rangka Atap (Kayu)</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">15.30%</td>
                      <td className="p-2 border border-slate-300 text-slate-600">Pelapukan kayu gording dan reng sekunder karena kebocoran genteng.</td>
                      <td className="p-2 border border-slate-300 text-center text-amber-700 font-bold">Ganti Reng & Gording</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 border border-slate-300 font-semibold">4. Plafon & Langit-langit</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">18.00%</td>
                      <td className="p-2 border border-slate-300 text-slate-600">Kerusakan plafon gypsum meluas akibat rembesan air, noda kecokelatan basah.</td>
                      <td className="p-2 border border-slate-300 text-center text-amber-700 font-bold">Penggantian Plafon</td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="p-2 border border-slate-300 font-semibold">5. Utilitas & Sanitasi</td>
                      <td className="p-2 border border-slate-300 text-center font-mono">2.10%</td>
                      <td className="p-2 border border-slate-300 text-slate-600">Saluran air bersih normal, keran wastafel butuh penggantian karet penyekat.</td>
                      <td className="p-2 border border-slate-300 text-center text-slate-500">Perbaikan ringan</td>
                    </tr>
                  </tbody>
                </table>

                <div className="p-3 rounded bg-blue-50 border border-blue-200 text-blue-950 leading-relaxed text-[11px] mb-5 select-text font-medium">
                  💡 <strong>Catatan Peninjau Teknis Dinas PUPR:</strong> Hasil perhitungan tingkat kerusakan menunjukkan angka kerusakan gabungan bangunan sebesar <strong>8.15% (Kerusakan Ringan)</strong>. Gedung layak beroperasi untuk kegiatan belajar mengajar secara aman selama dilakukan rehabilitasi terjadwal pada komponen non-struktural di atas.
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 border-t pt-2.5 select-none font-mono">
                  <span>PUPR Kab. Garut | Bidang Bangunan Gedung</span>
                  <span>Halaman 2 / 2</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
