import React from "react";
import { Activity } from "lucide-react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";
import { cn } from "../../../lib/utils";

interface AdminMonthlyDamageChartProps {
  theme: "light" | "dark";
  timeRange: "6" | "12";
  setTimeRange: React.Dispatch<React.SetStateAction<"6" | "12">>;
  monthlyDamageData: any[];
}

export default function AdminMonthlyDamageChart({
  theme,
  timeRange,
  setTimeRange,
  monthlyDamageData
}: AdminMonthlyDamageChartProps) {
  return (
    <div className="col-span-12 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col theme-transition">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600 animate-pulse" />
            Distribusi Bulanan Tingkat Kerusakan Bangunan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visualisasi kumulatif sebaran tingkat kerusakan fisik (Sangat Ringan hingga Sangat Berat) per bulan.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0 theme-transition">
          <button
            type="button"
            onClick={() => setTimeRange("6")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              timeRange === "6" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            6 Bulan Terakhir
          </button>
          <button
            type="button"
            onClick={() => setTimeRange("12")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
              timeRange === "12" ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm" : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            12 Bulan Terakhir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Recharts Stacked Bar Chart */}
        <div className="lg:col-span-8 h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyDamageData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === "dark" ? "#334155" : "#f1f5f9"} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: theme === "dark" ? "#94a3b8" : '#64748b', fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis 
                tick={{ fontSize: 11, fill: theme === "dark" ? "#94a3b8" : '#64748b', fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: theme === "dark" ? "#1e293b" : '#f8fafc' }}
                contentStyle={{ 
                  backgroundColor: theme === "dark" ? "#1e293b" : '#ffffff', 
                  borderRadius: '12px', 
                  border: theme === "dark" ? '1px solid #334155' : '1px solid #e2e8f0', 
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                  fontSize: '12px',
                  padding: '12px',
                  color: theme === "dark" ? "#f8fafc" : "#0f172a"
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: theme === "dark" ? "#cbd5e1" : '#475569' }} 
              />
              <Bar dataKey="Sangat Ringan" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Ringan" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Sedang" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Berat" stackId="a" fill="#F97316" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Sangat Berat" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Insights Summary Panel */}
        <div className="lg:col-span-4 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 p-5 rounded-2xl space-y-4 theme-transition">
          <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest pb-2 border-b border-slate-200 dark:border-slate-800">
            Ikhtisar Distribusi
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span> Sangat Ringan
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {monthlyDamageData.reduce((sum, item) => sum + item["Sangat Ringan"], 0)} Unit
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]"></span> Ringan
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {monthlyDamageData.reduce((sum, item) => sum + item["Ringan"], 0)} Unit
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span> Sedang
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {monthlyDamageData.reduce((sum, item) => sum + item["Sedang"], 0)} Unit
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F97316]"></span> Berat
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {monthlyDamageData.reduce((sum, item) => sum + item["Berat"], 0)} Unit
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span> Sangat Berat
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {monthlyDamageData.reduce((sum, item) => sum + item["Sangat Berat"], 0)} Unit
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            <span className="font-bold text-indigo-600 dark:text-indigo-400">Catatan Analitis:</span> Tren sebaran bulanan ini dirancang untuk mendeteksi lonjakan laporan kerusakan secara musiman dan mengestimasi ketersediaan alokasi anggaran PUPR secara proaktif.
          </div>
        </div>
      </div>
    </div>
  );
}
