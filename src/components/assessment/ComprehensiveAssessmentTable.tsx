import React from 'react';
import { Assessment, COMPONENT_WEIGHTS_1_LANTAI, COMPONENT_WEIGHTS_2_LANTAI, COMPONENT_WEIGHTS_3_LANTAI, DAMAGE_MULTIPLIERS } from '../../types';

interface ComprehensiveAssessmentTableProps {
  assessment: Assessment;
}

export default function ComprehensiveAssessmentTable({ assessment }: ComprehensiveAssessmentTableProps) {
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
  let totalMassaBangunan = 0;

  const tableRows = componentsList.map((compName) => {
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

    return {
      sys,
      isNewSystem,
      sysId: isNewSystem ? (sys === "STRUKTUR" ? 1 : sys === "ARSITEKTUR" ? 2 : 3) : "",
      compName,
      satuan,
      volume,
      tdkRusak, sangatRingan, ringan, sedang, berat, sangatBerat, tdkSesuai,
      safetyImpact: compData?.safetyImpact ? "Ada Indikasi Bahaya" : "Tidak ada kerusakan",
      p000, p020, p035, p050, p070, p085, p100,
      totalPersen,
      weight: `${weight.toFixed(2)}%`,
      nilaiKerusakanThdMassa: `${nilaiKerusakanThdMassa.toFixed(2)}%`
    };
  });

  return (
    <div className="w-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col mt-4">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center">
          <div className="w-1.5 h-4 bg-pu-blue rounded-full mr-2"></div>
          Formulir Penilaian Kerusakan Bangunan (Detail 24 Kolom)
        </h4>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-[9px] min-w-[1200px]">
          <thead>
            <tr className="bg-[#4472c4] text-white">
              <th className="border border-white/20 p-2 text-center align-middle font-bold" rowSpan={4}>NO.</th>
              <th className="border border-white/20 p-2 text-center align-middle font-bold" colSpan={2} rowSpan={4}>SISTEM & KOMPONEN BANGUNAN</th>
              <th className="border border-white/20 p-2 text-center align-middle font-bold" rowSpan={4}>SATUAN</th>
              <th className="border border-white/20 p-2 text-center align-middle font-bold" rowSpan={4}>VOLUME<br/>SELURUH</th>
              <th className="border border-white/20 p-2 text-center align-middle font-bold" colSpan={8}>TAHAP 2</th>
              <th className="border border-white/20 p-2 text-center align-middle font-bold" rowSpan={4}>TAHAP 1<br/>Cek Kerusakan<br/>Komponen Lain</th>
              <th className="border border-white/20 p-2 text-center align-middle font-bold" colSpan={8}>PERHITUNGAN</th>
              <th className="border border-white/20 p-2 text-center align-middle font-bold" rowSpan={4}>BOBOT<br/>KOMPONEN<br/>THD MASSA<br/>BANGUNAN</th>
              <th className="border border-white/20 p-2 text-center align-middle font-bold" rowSpan={4}>NILAI<br/>KERUSAKAN<br/>KOMPONEN THD<br/>MASSA<br/>BANGUNAN</th>
            </tr>
            <tr className="bg-[#4472c4] text-white">
              <th className="border border-white/20 p-1 text-center font-semibold" colSpan={8}>PENILAIAN KOMPONEN BANGUNAN</th>
              <th className="border border-white/20 p-1 text-center font-semibold" colSpan={8}>PENILAIAN TINGKAT KERUSAKAN</th>
            </tr>
            <tr className="bg-[#4472c4] text-white">
              <th className="border border-white/20 p-1 text-center font-semibold" rowSpan={2}>Tdk<br/>Rusak</th>
              <th className="border border-white/20 p-1 text-center font-semibold" colSpan={5}>Rusak, dengan Tingkat Kerusakan:</th>
              <th className="border border-white/20 p-1 text-center font-semibold" rowSpan={2}>Komponen<br/>Tdk Sesuai /<br/>Tdk Ada</th>
              <th className="border border-white/20 p-1 text-center font-semibold" rowSpan={2}>Keterangan</th>
              <th className="border border-white/20 p-1 text-center font-semibold">1</th>
              <th className="border border-white/20 p-1 text-center font-semibold">2</th>
              <th className="border border-white/20 p-1 text-center font-semibold">3</th>
              <th className="border border-white/20 p-1 text-center font-semibold">4</th>
              <th className="border border-white/20 p-1 text-center font-semibold">5</th>
              <th className="border border-white/20 p-1 text-center font-semibold">6</th>
              <th className="border border-white/20 p-1 text-center font-semibold">7</th>
              <th className="border border-white/20 p-1 text-center font-semibold">TOTAL</th>
            </tr>
            <tr className="bg-[#4472c4] text-white">
              <th className="border border-white/20 p-1 text-center font-semibold">Sangat<br/>Ringan</th>
              <th className="border border-white/20 p-1 text-center font-semibold">Ringan</th>
              <th className="border border-white/20 p-1 text-center font-semibold">Sedang</th>
              <th className="border border-white/20 p-1 text-center font-semibold">Berat</th>
              <th className="border border-white/20 p-1 text-center font-semibold">Sangat<br/>Berat</th>
              <th className="border border-white/20 p-1 text-center font-semibold bg-[#2f5597]">0.00</th>
              <th className="border border-white/20 p-1 text-center font-semibold bg-[#2f5597]">0.20</th>
              <th className="border border-white/20 p-1 text-center font-semibold bg-[#2f5597]">0.35</th>
              <th className="border border-white/20 p-1 text-center font-semibold bg-[#2f5597]">0.50</th>
              <th className="border border-white/20 p-1 text-center font-semibold bg-[#2f5597]">0.70</th>
              <th className="border border-white/20 p-1 text-center font-semibold bg-[#2f5597]">0.85</th>
              <th className="border border-white/20 p-1 text-center font-semibold bg-[#2f5597]">1.00</th>
              <th className="border border-white/20 p-1 text-center font-semibold"></th>
            </tr>
            <tr className="bg-[#dae3f3] text-slate-700">
              {Array.from({length: 24}).map((_, i) => (
                <th key={i} className="border border-slate-300 p-0.5 text-center font-normal text-[8px]">({i + 1})</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="border border-slate-300 p-1 text-center font-semibold bg-slate-50">{row.sysId}</td>
                <td className="border border-slate-300 p-1 font-bold whitespace-nowrap bg-slate-50">{row.isNewSystem ? row.sys : ""}</td>
                <td className="border border-slate-300 p-1 whitespace-nowrap">{row.compName}</td>
                <td className="border border-slate-300 p-1 text-center bg-[#fff2cc]">{row.satuan}</td>
                <td className="border border-slate-300 p-1 text-center font-mono bg-[#fff2cc]">{row.volume}</td>
                
                <td className="border border-slate-300 p-1 text-center font-mono">{row.tdkRusak}</td>
                <td className="border border-slate-300 p-1 text-center font-mono">{row.sangatRingan}</td>
                <td className="border border-slate-300 p-1 text-center font-mono">{row.ringan}</td>
                <td className="border border-slate-300 p-1 text-center font-mono">{row.sedang}</td>
                <td className="border border-slate-300 p-1 text-center font-mono">{row.berat}</td>
                <td className="border border-slate-300 p-1 text-center font-mono">{row.sangatBerat}</td>
                <td className="border border-slate-300 p-1 text-center font-mono">{row.tdkSesuai}</td>
                <td className="border border-slate-300 p-1 text-center"></td>
                
                <td className="border border-slate-300 p-1 text-center text-[8px] bg-white max-w-[80px] break-words leading-tight">{row.safetyImpact}</td>
                
                <td className={`border border-slate-300 p-1 text-right font-mono ${row.p000 === '0.00' ? 'bg-[#eaeaea] text-slate-400' : 'bg-[#d9ead3] font-semibold text-emerald-800'}`}>{row.p000}</td>
                <td className={`border border-slate-300 p-1 text-right font-mono ${row.p020 === '0.00' ? 'bg-[#eaeaea] text-slate-400' : 'bg-[#d9ead3] font-semibold text-emerald-800'}`}>{row.p020}</td>
                <td className={`border border-slate-300 p-1 text-right font-mono ${row.p035 === '0.00' ? 'bg-[#eaeaea] text-slate-400' : 'bg-[#d9ead3] font-semibold text-emerald-800'}`}>{row.p035}</td>
                <td className={`border border-slate-300 p-1 text-right font-mono ${row.p050 === '0.00' ? 'bg-[#eaeaea] text-slate-400' : 'bg-[#d9ead3] font-semibold text-emerald-800'}`}>{row.p050}</td>
                <td className={`border border-slate-300 p-1 text-right font-mono ${row.p070 === '0.00' ? 'bg-[#eaeaea] text-slate-400' : 'bg-[#d9ead3] font-semibold text-emerald-800'}`}>{row.p070}</td>
                <td className={`border border-slate-300 p-1 text-right font-mono ${row.p085 === '0.00' ? 'bg-[#eaeaea] text-slate-400' : 'bg-[#d9ead3] font-semibold text-emerald-800'}`}>{row.p085}</td>
                <td className={`border border-slate-300 p-1 text-right font-mono ${row.p100 === '0.00' ? 'bg-[#eaeaea] text-slate-400' : 'bg-[#d9ead3] font-semibold text-emerald-800'}`}>{row.p100}</td>
                <td className="border border-slate-300 p-1 text-right font-mono bg-[#d9ead3] font-bold text-emerald-900">{row.totalPersen}</td>
                
                <td className="border border-slate-300 p-1 text-center font-mono">{row.weight}</td>
                <td className="border border-slate-300 p-1 text-right font-mono bg-[#d9ead3] font-bold text-emerald-900">{row.nilaiKerusakanThdMassa}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold">
              <td colSpan={13} className="border border-slate-300 p-2 text-center text-slate-800"></td>
              <td className="border border-slate-300 p-2 text-center text-[10px] text-slate-800">TOTAL NILAI KERUSAKAN MASSA BANGUNAN =</td>
              <td colSpan={7} className="border border-slate-300 bg-[#d9ead3]"></td>
              <td className="border border-slate-300 p-2 text-right font-mono bg-[#d9ead3]"></td>
              <td className="border border-slate-300 p-2 text-center"></td>
              <td className="border border-slate-300 p-2 text-right text-sm font-black text-emerald-700 bg-[#d9ead3] shadow-inner">{totalMassaBangunan.toFixed(2)}%</td>
            </tr>
            <tr className="bg-slate-200 font-black">
              <td colSpan={20} className="border border-slate-300 p-2 text-right text-slate-800 text-xs">KESIMPULAN TINGKAT KERUSAKAN MASSA BANGUNAN =</td>
              <td colSpan={3} className="border border-slate-300"></td>
              <td className="border border-slate-300 p-2 text-center text-sm font-black text-blue-900 bg-[#cfe2f3] shadow-inner uppercase tracking-wider">{assessment.finalResult?.category || "-"}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
