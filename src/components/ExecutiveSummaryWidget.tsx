import React, { useEffect, useState } from "react";
import { Activity, Clock, AlertTriangle, FileText } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function ExecutiveSummaryWidget() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch dashboard stats", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-pulse h-64 flex items-center justify-center">
        <Activity className="w-8 h-8 text-slate-300 animate-bounce" />
      </div>
    );
  }

  if (!stats) return null;

  const statusColors: Record<string, string> = {
    "Menunggu_Validasi": "#F59E0B", // amber-500
    "Survei_Lapangan": "#3B82F6", // blue-500
    "Selesai_Dianalisis": "#10B981", // emerald-500
    "Arsip_Digital": "#64748B", // slate-500
  };

  const statusData = Object.keys(stats.statusCounts || {}).map(key => ({
    name: key.replace(/_/g, " "),
    value: stats.statusCounts[key],
    color: statusColors[key] || "#8B5CF6",
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      {/* Overview Card */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 col-span-1 lg:col-span-2 flex flex-col justify-between relative overflow-hidden">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
            <FileText className="w-4 h-4 text-indigo-600" /> Ringkasan Permohonan
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Permohonan</p>
              <h4 className="text-3xl font-black text-slate-800">{stats.totalPermohonan}</h4>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Bangunan</p>
              <h4 className="text-3xl font-black text-slate-800">{stats.totalBuildings}</h4>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Pengguna</p>
              <h4 className="text-3xl font-black text-slate-800">{stats.totalUsers}</h4>
            </div>
          </div>
        </div>

        {stats.pendingLongCount > 0 && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-800">Perhatian Eksekutif</h4>
              <p className="text-[10px] text-rose-600 font-medium">
                Terdapat <strong>{stats.pendingLongCount} permohonan</strong> yang tertunda &gt; 7 hari.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Chart Card */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-indigo-600" /> Status Permohonan
        </h3>
        <div className="flex-1 h-48 w-full">
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`${value} Permohonan`, "Jumlah"]}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{ fontSize: "10px", fontWeight: "600" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-full flex items-center justify-center">
               <p className="text-xs text-slate-400 font-medium">Belum ada data status permohonan</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
