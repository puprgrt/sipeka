import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Building, Plus, Activity, Bell, Layers, Calculator, FileText, ArrowRight, BookOpen
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip, Legend 
} from "recharts";
import { Assessment } from "../../types";
import { cn } from "../../lib/utils";

interface PengelolaDashboardProps {
  assessments: Assessment[];
  setSelectedAssessment: React.Dispatch<React.SetStateAction<Assessment | null>>;
  newReportsCount: number;
  theme: "light" | "dark";
}

export default function PengelolaDashboard({
  assessments,
  setSelectedAssessment,
  newReportsCount,
  theme
}: PengelolaDashboardProps) {
  const [simulatedRepairs, setSimulatedRepairs] = useState<Record<string, boolean>>({});

  // 1. Filter assessments by logged in user's ID
  const activeUserId = localStorage.getItem("activeUserId");
  const myAssessments = activeUserId 
    ? assessments.filter(a => String(a.idUserPengelola) === activeUserId)
    : [];
  const finalAssessments = myAssessments;
  
  // 2. Calculations
  const myTotalBuildings = finalAssessments.length;
  const myTotalDamage = finalAssessments.reduce((sum, a) => sum + (a.finalResult?.totalDamagePercentage || 0), 0);
  const myAverageDamage = myTotalBuildings > 0 ? (myTotalDamage / myTotalBuildings) : 0;
  
  // Base BHI
  const myBHI = 100 - myAverageDamage;
  
  // Cost estimation (luasBangunan * 2.500.000 * damageFraction)
  const myTotalCost = finalAssessments.reduce((sum, a) => {
    const damageFraction = (a.finalResult?.totalDamagePercentage || 0) / 100;
    const area = a.buildingArea || 380;
    return sum + (damageFraction * area * 2500000);
  }, 0);
  
  // Status counts
  const myWaitingCount = finalAssessments.filter(a => a.status === 'Menunggu_Validasi' || a.status === 'Survei_Lapangan').length;
  const myResolvedCount = finalAssessments.filter(a => a.status === 'Selesai_Dianalisis' || a.status === 'Arsip_Digital').length;

  // Dynamically calculate component damages from finalAssessments
  const componentStats: Record<string, { name: string, weight: number, sumDamage: number, count: number }> = {};
  
  finalAssessments.forEach(a => {
    a.components?.forEach((c: any) => {
      if (!componentStats[c.id]) {
        componentStats[c.id] = { name: c.name, weight: c.weight, sumDamage: 0, count: 0 };
      }
      
      let cDamage = 0;
      c.damageDetails?.forEach((d: any) => {
         cDamage += d.percentage;
      });
      
      componentStats[c.id].sumDamage += cDamage;
      componentStats[c.id].count += 1;
    });
  });

  const colors = ["#10B981", "#3B82F6", "#EAB308", "#F97316", "#EC4899", "#8B5CF6", "#14B8A6"];
  const componentsList = Object.keys(componentStats).map((id, idx) => {
    const st = componentStats[id];
    return {
      id,
      name: st.name,
      weight: st.weight,
      avgDamage: st.count > 0 ? (st.sumDamage / st.count) : 0,
      color: colors[idx % colors.length]
    };
  });

  const totalStructureWeight = componentsList.reduce((sum, c) => sum + c.weight, 0) || 100;

  // Simulated BHI based on simulatedRepairs toggles
  let simulatedAverageDamage = 0;
  
  componentsList.forEach(c => {
    const isRepaired = simulatedRepairs[c.id];
    const damage = isRepaired ? 0 : c.avgDamage;
    simulatedAverageDamage += (damage * (c.weight / totalStructureWeight));
  });
  
  const mySimulatedDamage = myAverageDamage - componentsList.reduce((sum, c) => {
    if (simulatedRepairs[c.id]) {
      return sum + (c.avgDamage * (c.weight / totalStructureWeight)); // contribution to average
    }
    return sum;
  }, 0);
  
  const mySimulatedBHI = Math.min(100, 100 - Math.max(0, mySimulatedDamage));
  const bhiDifference = mySimulatedBHI - myBHI;

  // Estimated saved cost if simulated repairs are done
  const estimatedSavedCost = componentsList.reduce((sum, c) => {
    if (simulatedRepairs[c.id]) {
      // save proportion
      return sum + (c.avgDamage / 100 * 380 * 2500000 * (c.weight / 58.5));
    }
    return 0;
  }, 0);

  const getMyBhiStatus = (val: number) => {
    if (val >= 85) return { label: "Sangat Baik (Aman)", color: "text-emerald-500", bg: "bg-emerald-500", lightBg: "bg-emerald-50", border: "border-emerald-200" };
    if (val >= 70) return { label: "Baik (Wajar)", color: "text-blue-500", bg: "bg-blue-500", lightBg: "bg-blue-50", border: "border-blue-200" };
    if (val >= 55) return { label: "Cukup (Butuh Atensi)", color: "text-yellow-500", bg: "bg-yellow-500", lightBg: "bg-yellow-50", border: "border-yellow-200" };
    if (val >= 40) return { label: "Buruk (Bahaya)", color: "text-orange-500", bg: "bg-orange-500", lightBg: "bg-orange-50", border: "border-orange-200" };
    return { label: "Kritis (Sangat Bahaya)", color: "text-red-500", bg: "bg-red-500", lightBg: "bg-red-50", border: "border-red-200" };
  };

  const currentStatusInfo = getMyBhiStatus(myBHI);
  const simulatedStatusInfo = getMyBhiStatus(mySimulatedBHI);

  const radarData = componentsList.map(c => ({
    subject: c.name,
    'Kerusakan (%)': c.avgDamage,
    'Simulasi (%)': simulatedRepairs[c.id] ? 0 : c.avgDamage,
    fullMark: 100,
  }));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-5"
    >
      <AnimatePresence>
        {newReportsCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 p-4 rounded-2xl flex items-start gap-4 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl shrink-0">
              <Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 relative z-10 pt-0.5">
              <h3 className="text-sm font-bold text-rose-800">Peringatan Laporan Kerusakan Baru</h3>
              <p className="text-xs text-rose-600 mt-0.5 font-medium">Terdapat <strong>{newReportsCount} laporan kerusakan</strong> yang perlu segera ditindaklanjuti atau diverifikasi.</p>
            </div>
            <Link to="/list" className="relative z-10 shrink-0 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all">
              Lihat Laporan
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Pengelola */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-indigo-500/20 w-fit mb-2 uppercase tracking-wider">
            <Building className="w-3.5 h-3.5" /> Dasbor Pengelola Bangunan
          </div>
          <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-2.5">
            Dinas PUPR Kabupaten Garut
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-mono flex items-center gap-2">
            <span>Pengguna: <strong>{localStorage.getItem("activeUserName") || "Pengelola Bangunan"}</strong></span>
            <span>•</span>
            <span>Penilaian Mandiri Fisik</span>
            <span>•</span>
            <span>Standar PUPR Cerdas</span>
          </p>
        </div>
        <Link
          to="/new"
          className="relative z-10 bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95 text-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Usulan Baru</span>
        </Link>
      </div>

      {/* KPIs Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    
        {/* Card 1: Total Massa Bangunan */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-blue-500" /> Massa Bangunan Terdaftar
            </span>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-800">{myTotalBuildings}</span>
              <span className="text-xs font-semibold text-slate-400">Unit</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex justify-between items-center text-[11px] text-slate-500">
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> Selesai: <strong>{myResolvedCount}</strong></span>
            <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div> Proses: <strong>{myWaitingCount}</strong></span>
          </div>
        </div>

        {/* Card 2: BHI (Building Health Index) */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-500" /> B.H.I Fasilitas (Kesehatan)
            </span>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-black text-slate-800">{myBHI.toFixed(1)}</span>
              <span className="text-sm font-bold text-slate-400">/100</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${currentStatusInfo.bg}`}></div>
            <span className={`text-[11px] font-bold ${currentStatusInfo.color}`}>{currentStatusInfo.label}</span>
          </div>
        </div>

        {/* Card 3: Estimasi Kebutuhan Dana Rehabilitasi */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-3.5 h-3.5 text-rose-500 font-bold font-serif">$</span> Estimasi Kebutuhan Anggaran
            </span>
            <div className="mt-3">
              <span className="text-2xl font-black text-rose-600">
                Rp {myTotalCost > 0 ? (myTotalCost / 1000000).toFixed(0) : "0"} Jt
              </span>
              <p className="text-[9px] text-slate-400 mt-0.5">Dihitung dari bobot kerusakan fisik bangunan</p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-50 text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
            <span>Sifatnya estimasi mandiri awal</span>
          </div>
        </div>

        {/* Card 4: Status Usulan */}
        <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Status Pengajuan Terakhir
            </span>
            <div className="mt-3">
              <span className="text-sm font-black text-emerald-400 block tracking-tight uppercase">
                {myWaitingCount > 0 ? "SURVEI LAPANGAN" : "ANALISIS SELESAI"}
              </span>
              <p className="text-[9px] text-slate-400 mt-1">
                {myWaitingCount > 0 
                  ? "Tim teknis dinas sedang menjadwalkan kunjungan verifikasi lapangan." 
                  : "Semua laporan kerusakan telah diverifikasi & dianalisis oleh dinas PUPR."}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-2 border-t border-white/10 text-[10px] font-bold text-slate-300 flex justify-between items-center relative z-10">
            <span>PROGRES USULAN</span>
            <span className="text-emerald-400">{myWaitingCount > 0 ? "60%" : "100%"}</span>
          </div>
        </div>

      </div>

      {/* Main Grid: Left & Right Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Left Column (lg:col-span-7): Alur Progres & Analisis Kerusakan */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Visual Workflow Tracker for Each Building */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" /> Alur Progres & Verifikasi Berkas
            </h3>
            <div className="space-y-6">
              {finalAssessments.map((a) => {
                // Get active step index based on status
                let activeStep = 1; // Diajukan
                if (a.status === 'Menunggu_Validasi') activeStep = 2; // Berkas Diverifikasi
                else if (a.status === 'Survei_Lapangan') activeStep = 3; // Survei Lapangan
                else if (a.status === 'Selesai_Dianalisis') activeStep = 4; // Analisis Teknis
                else if (a.status === 'Arsip_Digital') activeStep = 5; // Hasil Terbit

                const steps = [
                  { label: "Usulan Diajukan", desc: "Formulir mandiri dikirim" },
                  { label: "Validasi Berkas", desc: "Review awal administrasi" },
                  { label: "Survei Lapangan", desc: "Kunjungan Tim Teknis" },
                  { label: "Analisis Teknis", desc: "Perhitungan nilai kerusakan" },
                  { label: "Hasil Terbit", desc: "Dokumen rekomendasi keluar" },
                ];

                return (
                  <div key={a.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/40 space-y-3.5">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{a.buildingName}</h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Tanggal Usulan: {new Date(a.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold",
                        activeStep >= 4 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {a.status?.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Timeline Nodes */}
                    <div className="relative pt-2 pb-6">
                      {/* Connecting Line */}
                      <div className="absolute top-5 left-3 right-3 h-0.5 bg-slate-200 -z-0">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500" 
                          style={{ width: `${((activeStep - 1) / 4) * 100}%` }}
                        />
                      </div>

                      {/* Nodes */}
                      <div className="relative z-10 flex justify-between">
                        {steps.map((step, sIdx) => {
                          const isCompleted = sIdx + 1 < activeStep;
                          const isActive = sIdx + 1 === activeStep;
                          
                          return (
                            <div key={sIdx} className="flex flex-col items-center text-center max-w-[80px]">
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all duration-300",
                                isCompleted ? "bg-emerald-500 border-emerald-500 text-white" :
                                isActive ? "bg-white border-emerald-500 text-emerald-600 shadow-md ring-4 ring-emerald-50" :
                                "bg-slate-100 border-slate-200 text-slate-400"
                              )}>
                                {isCompleted ? "✓" : sIdx + 1}
                              </div>
                              <span className={cn(
                                "text-[9px] font-bold mt-2 truncate w-full block",
                                isActive ? "text-emerald-600" : isCompleted ? "text-slate-700" : "text-slate-400"
                              )}>
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Component Repair Simulator */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-emerald-500" /> Simulasi Pemeliharaan & Dampak BHI
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Lakukan simulasi perbaikan komponen untuk melihat kenaikan skor kesehatan bangunan Anda.</p>
              </div>
              <span className="text-[9px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md font-bold">SIMULATOR</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-4 pt-2">
              {/* Simulator Checklist Controls (col-span-7) */}
              <div className="md:col-span-7 space-y-2">
                {componentsList.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => setSimulatedRepairs(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                    className={cn(
                      "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between",
                      simulatedRepairs[c.id] 
                        ? "bg-emerald-50/45 border-emerald-200/80 shadow-sm" 
                        : "bg-white border-slate-100 hover:border-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={!!simulatedRepairs[c.id]} 
                        onChange={() => {}} 
                        className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer pointer-events-none"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-800">{c.name}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Bobot: <strong>{c.weight}%</strong> • Rata-rata Kerusakan: <strong className="text-slate-600">{c.avgDamage}%</strong></p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      simulatedRepairs[c.id]
                        ? "bg-emerald-100/80 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    )}>
                      {simulatedRepairs[c.id] ? "Disimulasikan Diperbaiki (0% Rusak)" : `Sesuai Keadaan (${c.avgDamage}%)`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Simulator Results Output (col-span-5) */}
              <div className="md:col-span-5 bg-slate-50/50 rounded-2xl border border-slate-100 p-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Output Hasil Simulasi</p>
                  
                  {/* BHI Comparison circle */}
                  <div className="flex justify-center items-center gap-3 py-1">
                    <div className="text-center">
                      <span className="text-xs text-slate-400 block font-bold">Asli</span>
                      <span className="text-lg font-black text-slate-600">{myBHI.toFixed(1)}</span>
                    </div>
                    <div className="w-0.5 h-8 bg-slate-200"></div>
                    <div className="text-center bg-emerald-50 border border-emerald-100 px-3.5 py-2.5 rounded-2xl">
                      <span className="text-xs text-emerald-700 block font-bold">Simulasi</span>
                      <span className="text-2xl font-black text-emerald-600">{mySimulatedBHI.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-3">
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                      <span>Peningkatan BHI:</span>
                      <span className={cn("font-bold", bhiDifference > 0 ? "text-emerald-600" : "text-slate-500")}>
                        {bhiDifference > 0 ? `+${bhiDifference.toFixed(1)}%` : "0.0%"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                      <span>Predikat Baru:</span>
                      <span className={cn("font-bold", simulatedStatusInfo.color)}>
                        {simulatedStatusInfo.label.split(' ')[0]}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600">
                      <span>Terselamatkan:</span>
                      <span className="font-bold text-rose-600 font-mono">
                        {estimatedSavedCost > 0 ? `Rp ${(estimatedSavedCost / 1000000).toFixed(1)} Jt` : "Rp 0"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (lg:col-span-5): Component Chart & Buildings Cards & Guide */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Component Damage Radar Chart */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 theme-transition">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Profil Kerusakan per Komponen
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke={theme === "dark" ? "#334155" : "#e2e8f0"} />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: theme === "dark" ? "#94a3b8" : '#64748b' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 20]} tick={{ fontSize: 8, fill: theme === "dark" ? "#64748b" : '#94a3b8' }} />
                  <Radar name="Asli" dataKey="Kerusakan (%)" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.25} />
                  <Radar name="Simulasi" dataKey="Simulasi (%)" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px', backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff", borderColor: theme === "dark" ? "#334155" : "#e2e8f0", color: theme === "dark" ? "#f8fafc" : "#0f172a" }} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* List of Managed Buildings */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-500" /> Massa Bangunan Saya
            </h3>
            <div className="space-y-3">
              {finalAssessments.map(a => {
                const bhiVal = 100 - (a.finalResult?.totalDamagePercentage || 0);
                return (
                  <div 
                    key={a.id} 
                    onClick={() => setSelectedAssessment(a)}
                    className="p-3.5 rounded-xl border border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all duration-300 flex justify-between items-center bg-slate-50/20 cursor-pointer hover:-translate-y-0.5 active:scale-[0.99] group/item"
                  >
                    <div>
                      <h4 className="text-xs font-black text-slate-800 group-hover/item:text-emerald-600 transition-colors flex items-center gap-1">
                        <span>{a.buildingName}</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
                        <span>{a.buildingArea} m²</span>
                        <span>•</span>
                        <span>{a.floorCount} Lantai</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold block w-fit ml-auto mb-1",
                        a.finalResult?.category === "Berat" ? "bg-rose-100 text-rose-700" :
                        a.finalResult?.category === "Sedang" ? "bg-amber-100 text-amber-700" :
                        "bg-emerald-100 text-emerald-700"
                      )}>
                        {a.finalResult?.totalDamagePercentage || 0}%
                      </span>
                      <span className="text-[9px] text-slate-400 block">BHI: <strong>{bhiVal.toFixed(1)}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guide & blank templates center */}
          <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl"></div>
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-3.5 flex items-center gap-2 relative z-10">
              <BookOpen className="w-4 h-4" /> Pusat Panduan & Regulasi PUPR
            </h3>
            <p className="text-[11px] text-slate-300 relative z-10 leading-relaxed mb-4">
              Unduh formulir kosong resmi dari PUPR serta pelajari tata cara penilaian mandiri kerusakan bangunan gedung negara.
            </p>
            <div className="space-y-2 relative z-10">
              <a 
                href="#"
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold transition-all"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Blanko Form PUPR (PDF)</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
              <a 
                href="#"
                className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold transition-all"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>Kriteria Kerusakan & Bobot</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
