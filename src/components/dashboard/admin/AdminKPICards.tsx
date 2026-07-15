import React from "react";
import { Building, Activity, Layers, ShieldCheck } from "lucide-react";

interface AdminKPICardsProps {
  targetTotal: number;
  targetAssessed: number;
  targetPercent: string | number;
  currentBHI: number;
  bhiStatus: { bg: string; color: string; label: string };
  fciValue: number;
  fciStatus: { color: string; label: string; border: string };
  currentSBDS: number;
  sbdsStatus: string;
}

export default function AdminKPICards({
  targetTotal,
  targetAssessed,
  targetPercent,
  currentBHI,
  bhiStatus,
  fciValue,
  fciStatus,
  currentSBDS,
  sbdsStatus,
}: AdminKPICardsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Building className="w-3.5 h-3.5 text-blue-500" /> Total Bangunan
        </span>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-800">{targetTotal.toLocaleString('id-ID')}</span>
        </div>
        <div className="mt-2 text-xs font-medium text-slate-500 flex justify-between items-center bg-slate-50 p-2 rounded-lg">
          <span>Telah Dinilai: <strong className="text-emerald-600">{targetAssessed.toLocaleString('id-ID')}</strong></span>
          <span>({targetPercent}%)</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-500" /> B.H.I (ISO 55000)
        </span>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-800">{currentBHI.toFixed(1)}</span>
          <span className="text-sm font-bold text-slate-400">/ 100</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${bhiStatus.bg}`}></div>
          <span className={`text-xs font-bold ${bhiStatus.color}`}>{bhiStatus.label}</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-purple-500" /> Indeks Kondisi Fasilitas
        </span>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-black text-slate-800 font-mono">{fciValue.toFixed(1)}%</span>
        </div>
        <div className="mt-2 text-xs font-medium text-slate-500 flex justify-between items-center bg-slate-50 p-2 rounded-lg">
          <span>Status: <strong className={fciStatus.color}>{fciStatus.label}</strong></span>
        </div>
      </div>

      <div className="bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl"></div>
        <span className="text-[10px] font-bold text-blue-300 uppercase tracking-widest flex items-center gap-2 relative z-10">
          <ShieldCheck className="w-3.5 h-3.5" /> Skor Kerusakan Cerdas
        </span>
        <div className="mt-3 flex items-baseline gap-2 relative z-10">
          <span className="text-3xl font-black text-white">{currentSBDS.toFixed(1)}</span>
        </div>
        <div className="mt-2 text-xs font-bold text-white flex justify-between items-center bg-white/10 p-2 rounded-lg relative z-10 backdrop-blur-sm border border-white/10">
          <span>Kategori: {sbdsStatus}</span>
        </div>
      </div>
    </div>
  );
}
