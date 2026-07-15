import React from "react";
import { ListOrdered } from "lucide-react";
import { Assessment } from "../../../types";
import { cn } from "../../../lib/utils";

interface AdminCriticalBuildingsProps {
  assessments: Assessment[];
  criticalBuildings: Assessment[];
  setSelectedAssessment: React.Dispatch<React.SetStateAction<Assessment | null>>;
  formatRupiah: (val: number) => string;
}

export default function AdminCriticalBuildings({
  assessments,
  criticalBuildings,
  setSelectedAssessment,
  formatRupiah
}: AdminCriticalBuildingsProps) {
  return (
    <div className="col-span-12 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-blue-600" /> Pendukung Keputusan: Peringkat Prioritas
          </h3>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">Metode: AHP / Fuzzy AHP / TOPSIS / Kekritisan Aset</p>
        </div>
        {assessments.length > 0 && (
          <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-lg">Data Asli Aktif</span>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="text-[10px] text-slate-500 uppercase font-bold border-b border-slate-100 bg-white">
            <tr>
              <th className="px-6 py-3 text-center">Peringkat</th>
              <th className="px-6 py-3">Nama Aset / Bangunan</th>
              <th className="px-6 py-3">Kategori Kritis</th>
              <th className="px-6 py-3 text-center">Skor BHI</th>
              <th className="px-6 py-3 text-center">Tingkat Risiko</th>
              <th className="px-6 py-3 text-right">Estimasi Biaya</th>
              <th className="px-6 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-xs font-medium text-slate-700">
            {criticalBuildings.length > 0 ? (
              criticalBuildings.map((a, idx) => {
                const bhiVal = 100 - (a.finalResult?.totalDamagePercentage || 0);
                const getPriorityLabels = (val: number) => {
                  if (val < 50) {
                    return {
                      cat: "Sangat Kritis",
                      catClass: "bg-rose-100 text-rose-700",
                      risk: "Ekstrem",
                      riskClass: "border-rose-200 text-rose-600"
                    };
                  } else if (val < 70) {
                    return {
                      cat: "Kritis",
                      catClass: "bg-amber-100 text-amber-700",
                      risk: "Tinggi",
                      riskClass: "border-amber-200 text-amber-600"
                    };
                  } else if (val < 85) {
                    return {
                      cat: "Sedang",
                      catClass: "bg-blue-100 text-blue-700",
                      risk: "Sedang",
                      riskClass: "border-blue-200 text-blue-600"
                    };
                  } else {
                    return {
                      cat: "Rendah",
                      catClass: "bg-emerald-100 text-emerald-700",
                      risk: "Rendah",
                      riskClass: "border-emerald-200 text-emerald-600"
                    };
                  }
                };
                const labels = getPriorityLabels(bhiVal);
                const costEst = ((a.finalResult?.totalDamagePercentage || 0) / 100) * (a.buildingArea || 380) * 2500000;

                return (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3 text-center"><span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600 mx-auto">{idx + 1}</span></td>
                    <td className="px-6 py-3">
                      <span className="font-bold text-slate-800">{a.schoolName}</span>
                      <br/><span className="text-[10px] text-slate-500 font-normal">{a.buildingName}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", labels.catClass)}>{labels.cat}</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className="font-mono text-rose-600 font-bold">{bhiVal.toFixed(1)}</span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold border", labels.riskClass)}>{labels.risk}</span>
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-slate-700">{formatRupiah(costEst)}</td>
                    <td className="px-6 py-3 text-center">
                      <button onClick={() => setSelectedAssessment(a)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded-lg transition-all border border-slate-200">
                        Lihat Detail & Riwayat
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                  Belum ada data prioritas. Silakan lakukan asesmen terlebih dahulu.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
