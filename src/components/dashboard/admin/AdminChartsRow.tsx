import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts";

interface AdminChartsRowProps {
  theme: "light" | "dark";
  dsiData: { name: string; value: number; color: string }[];
  bhiData: { name: string; value: number; color: string }[];
  riskCounts: {
    low: number;
    med: number;
    high: number;
    extreme: number;
  };
}

export default function AdminChartsRow({
  theme,
  dsiData,
  bhiData,
  riskCounts
}: AdminChartsRowProps) {
  const { low: lowRiskCount, med: medRiskCount, high: highRiskCount, extreme: extremeRiskCount } = riskCounts;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* Damage Severity Index */}
      <div className="col-span-12 md:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col theme-transition">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Indeks Keparahan Kerusakan</h3>
          <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded">FEMA P-58</span>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={dsiData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {dsiData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px', backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff", borderColor: theme === "dark" ? "#334155" : "#e2e8f0", color: theme === "dark" ? "#f8fafc" : "#0f172a" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {dsiData.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[9px] font-medium text-slate-600 dark:text-slate-400">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
              <span className="truncate">{d.name}: <strong className="text-slate-800 dark:text-slate-200">{d.value}</strong></span>
            </div>
          ))}
        </div>
      </div>

      {/* Building Health Index Distribution */}
      <div className="col-span-12 md:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col theme-transition">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Distribusi Building Health Index</h3>
          <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded">ISO 55000</span>
        </div>
        <div className="h-56 -ml-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bhiData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#334155" : "#e2e8f0"} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: theme === "dark" ? "#94a3b8" : '#64748b' }} axisLine={false} tickLine={false} interval={0} />
              <YAxis tick={{ fontSize: 10, fill: theme === "dark" ? "#94a3b8" : '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip 
                cursor={{ fill: theme === "dark" ? "#334155" : '#f1f5f9' }}
                contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff", color: theme === "dark" ? "#f8fafc" : "#0f172a", boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {bhiData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Matrix */}
      <div className="col-span-12 md:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col theme-transition">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">Matriks Penilaian Risiko</h3>
          <span className="text-[9px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded">ISO 31000</span>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex-1 grid grid-cols-5 grid-rows-5 gap-1 p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 relative">
            {/* Y Axis Label */}
            <div className="absolute -left-4 top-1/2 -translate-y-1/2 -rotate-90 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Kemungkinan</div>
            {/* X Axis Label */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-bold text-slate-400 uppercase tracking-widest">Dampak</div>
            
            {/* Generate 5x5 grid cells */}
            {Array.from({ length: 25 }).map((_, i) => {
              const row = Math.floor(i / 5);
              const col = i % 5;
              const riskLevel = row + (4 - col); 
              
              let bgColor = "bg-emerald-100";
              if (riskLevel > 4) bgColor = "bg-red-500";
              else if (riskLevel > 3) bgColor = "bg-orange-400";
              else if (riskLevel > 2) bgColor = "bg-yellow-300";
              else if (riskLevel > 1) bgColor = "bg-emerald-300";

              return (
                <div key={i} className={`rounded-sm ${bgColor} border border-black/5 flex items-center justify-center transition-all hover:scale-110 hover:shadow-md cursor-pointer z-10`}>
                  {riskLevel > 4 && col === 4 && row === 0 && extremeRiskCount > 0 && <span className="text-[8px] font-black text-white">{extremeRiskCount}</span>}
                  {riskLevel === 4 && col === 3 && row === 1 && highRiskCount > 0 && <span className="text-[8px] font-black text-white">{highRiskCount}</span>}
                  {riskLevel === 3 && col === 2 && row === 2 && medRiskCount > 0 && <span className="text-[8px] font-black text-white">{medRiskCount}</span>}
                  {riskLevel === 2 && col === 1 && row === 3 && lowRiskCount > 0 && <span className="text-[8px] font-black text-white">{lowRiskCount}</span>}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-6 text-[9px] font-bold text-slate-500 uppercase">
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-300 rounded-full"></div>Rendah ({lowRiskCount})</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-300 rounded-full"></div>Sedang ({medRiskCount})</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-orange-400 rounded-full"></div>Tinggi ({highRiskCount})</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div>Ekstrem ({extremeRiskCount})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
