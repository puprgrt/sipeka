import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Bell, MapPin, Sparkles, Loader2, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Assessment } from "../../types";
import { cn } from "../../lib/utils";

import ExecutiveSummaryWidget from "../../components/ExecutiveSummaryWidget";
import StatusUpdatesWidget from "../../components/StatusUpdatesWidget";
import StaffPerformancePanel from "../../components/StaffPerformancePanel";
import AdminKPICards from "../../components/dashboard/admin/AdminKPICards";
import AdminChartsRow from "../../components/dashboard/admin/AdminChartsRow";
import AdminMonthlyDamageChart from "../../components/dashboard/admin/AdminMonthlyDamageChart";
import AdminFinancialInsights from "../../components/dashboard/admin/AdminFinancialInsights";
import AdminCriticalBuildings from "../../components/dashboard/admin/AdminCriticalBuildings";
import RecentActivityWidget from "../../components/dashboard/admin/RecentActivityWidget";

interface AdminDashboardProps {
  assessments: Assessment[];
  auditTrails: any[];
  newReportsCount: number;
  seeding: boolean;
  handleSeedSample: () => Promise<void>;
  theme: "light" | "dark";
  setSelectedAssessment: React.Dispatch<React.SetStateAction<Assessment | null>>;
  loadingAudit: boolean;
}

export default function AdminDashboard({
  assessments,
  auditTrails,
  newReportsCount,
  seeding,
  handleSeedSample,
  theme,
  setSelectedAssessment,
  loadingAudit
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "recent" | "consultation">("overview");
  const [selectedCity, setSelectedCity] = useState<string>("Semua");
  const [timeRange, setTimeRange] = useState<"6" | "12">("6");

  const filteredAssessments = React.useMemo(() => {
    return selectedCity === "Semua" 
      ? assessments 
      : assessments.filter(a => a.city === selectedCity);
  }, [assessments, selectedCity]);

  const cities = ["Semua", ...Array.from(new Set(assessments.map(a => a.city).filter(Boolean)))];

  const targetTotal = filteredAssessments.length;
  const targetAssessed = filteredAssessments.length;
  const targetPercent = targetTotal > 0 ? ((targetAssessed / targetTotal) * 100).toFixed(1) : "0.0";

  const totalDamage = filteredAssessments.reduce((sum, a) => sum + (a.finalResult?.totalDamagePercentage || 0), 0);
  const averageDamage = filteredAssessments.length > 0 ? (totalDamage / filteredAssessments.length) : 0;
  
  const currentBHI = 100 - (averageDamage || 8); 
  const getBHICategory = (val: number) => {
    if (val >= 85) return { label: "Sangat Baik", color: "text-emerald-500", bg: "bg-emerald-500" };
    if (val >= 70) return { label: "Baik", color: "text-blue-500", bg: "bg-blue-500" };
    if (val >= 55) return { label: "Cukup", color: "text-yellow-500", bg: "bg-yellow-500" };
    if (val >= 40) return { label: "Buruk", color: "text-orange-500", bg: "bg-orange-500" };
    return { label: "Kritis", color: "text-red-500", bg: "bg-red-500" };
  };
  const bhiStatus = getBHICategory(currentBHI);

  const currentSBDS = currentBHI > 0 ? currentBHI * 0.95 : 87.5;
  const sbdsStatus = currentSBDS >= 90 ? "SANGAT BAIK" : currentSBDS >= 75 ? "BAIK" : currentSBDS >= 60 ? "SEDANG" : currentSBDS >= 40 ? "RUSAK" : "KRITIS";

  const fciValue = averageDamage;
  const getFCIStatus = (val: number) => {
    if (val <= 5) return { label: "Sangat Baik (<5%)", color: "text-emerald-600", border: "text-emerald-600" };
    if (val <= 10) return { label: "Baik (5-10%)", color: "text-blue-600", border: "text-blue-600" };
    if (val <= 30) return { label: "Wajar (10-30%)", color: "text-yellow-600", border: "text-yellow-600" };
    return { label: "Kritis (>30%)", color: "text-red-600", border: "text-red-600" };
  };
  const fciStatus = getFCIStatus(fciValue);

  const minorCount = filteredAssessments.filter(a => (a.finalResult?.totalDamagePercentage || 0) <= 20).length;
  const moderateCount = filteredAssessments.filter(a => (a.finalResult?.totalDamagePercentage || 0) > 20 && (a.finalResult?.totalDamagePercentage || 0) <= 40).length;
  const majorCount = filteredAssessments.filter(a => (a.finalResult?.totalDamagePercentage || 0) > 40 && (a.finalResult?.totalDamagePercentage || 0) <= 60).length;
  const severeCount = filteredAssessments.filter(a => (a.finalResult?.totalDamagePercentage || 0) > 60 && (a.finalResult?.totalDamagePercentage || 0) <= 80).length;
  const criticalCount = filteredAssessments.filter(a => (a.finalResult?.totalDamagePercentage || 0) > 80).length;

  const lowRiskCount = minorCount;
  const medRiskCount = moderateCount;
  const highRiskCount = majorCount + severeCount;
  const extremeRiskCount = criticalCount;

  const dsiData = [
    { name: 'Ringan (0-20)', value: minorCount, color: '#10B981' },
    { name: 'Sedang (21-40)', value: moderateCount, color: '#3B82F6' },
    { name: 'Berat (41-60)', value: majorCount, color: '#F59E0B' },
    { name: 'Sangat Berat (61-80)', value: severeCount, color: '#F97316' },
    { name: 'Kritis (>80)', value: criticalCount, color: '#EF4444' },
  ];

  const sangatBaikCount = filteredAssessments.filter(a => (100 - (a.finalResult?.totalDamagePercentage || 0)) >= 85).length;
  const baikCount = filteredAssessments.filter(a => {
    const bhi = 100 - (a.finalResult?.totalDamagePercentage || 0);
    return bhi >= 70 && bhi < 85;
  }).length;
  const cukupCount = filteredAssessments.filter(a => {
    const bhi = 100 - (a.finalResult?.totalDamagePercentage || 0);
    return bhi >= 55 && bhi < 70;
  }).length;
  const burukCount = filteredAssessments.filter(a => {
    const bhi = 100 - (a.finalResult?.totalDamagePercentage || 0);
    return bhi >= 40 && bhi < 55;
  }).length;
  const kritisBhiCount = filteredAssessments.filter(a => (100 - (a.finalResult?.totalDamagePercentage || 0)) < 40).length;

  const bhiData = [
    { name: 'Sangat Baik', value: sangatBaikCount, color: '#10B981' },
    { name: 'Baik', value: baikCount, color: '#3B82F6' },
    { name: 'Cukup', value: cukupCount, color: '#EAB308' },
    { name: 'Buruk', value: burukCount, color: '#F97316' },
    { name: 'Kritis', value: kritisBhiCount, color: '#EF4444' },
  ];

  const monthlyDamageData = React.useMemo(() => {
    const list = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const now = new Date();
    const count = timeRange === "6" ? 6 : 12;
    
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      list.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        name: `${monthNames[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`,
        "Sangat Ringan": 0,
        "Ringan": 0,
        "Sedang": 0,
        "Berat": 0,
        "Sangat Berat": 0,
      });
    }

    filteredAssessments.forEach(a => {
      if (!a.date) return;
      const d = new Date(a.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthObj = list.find(m => m.key === key);
      
      const dmg = a.finalResult?.totalDamagePercentage || 0;
      let category = "Sangat Ringan";
      if (dmg > 0 && dmg <= 15) category = "Sangat Ringan";
      else if (dmg > 15 && dmg <= 30) category = "Ringan";
      else if (dmg > 30 && dmg <= 50) category = "Sedang";
      else if (dmg > 50 && dmg <= 75) category = "Berat";
      else if (dmg > 75) category = "Sangat Berat";

      if (monthObj) {
        monthObj[category as "Sangat Ringan" | "Ringan" | "Sedang" | "Berat" | "Sangat Berat"] += 1;
      }
    });

    return list;
  }, [filteredAssessments, timeRange]);

  const resolvedCount = filteredAssessments.filter(a => a.status === 'Selesai_Dianalisis' || a.status === 'Arsip_Digital').length;

  const getSlaTrendData = () => {
    const list = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthlyAssessments = filteredAssessments.filter(a => {
        if (!a.date) return false;
        const ad = new Date(a.date);
        return ad.getFullYear() === d.getFullYear() && ad.getMonth() === d.getMonth();
      });
      const resolvedInMonth = monthlyAssessments.filter(a => a.status === 'Selesai_Dianalisis' || a.status === 'Arsip_Digital').length;
      const rate = monthlyAssessments.length > 0 
        ? Math.round((resolvedInMonth / monthlyAssessments.length) * 100)
        : 90;
      list.push({ name: monthNames[d.getMonth()], value: rate });
    }
    return list;
  };
  const maintData = getSlaTrendData();

  const totalEstimatedBudget = filteredAssessments.reduce((sum, a) => {
    const damageFraction = (a.finalResult?.totalDamagePercentage || 0) / 100;
    const area = a.buildingArea || 380;
    return sum + (damageFraction * area * 2500000);
  }, 0);

  const formatRupiah = (val: number) => {
    if (val >= 1000000000) {
      return `Rp ${(val / 1000000000).toFixed(2)} M`;
    }
    return `Rp ${(val / 1000000).toFixed(1)} Jt`;
  };

  const dynamicROI = filteredAssessments.length > 0 ? Math.min(65, Math.round(averageDamage * 0.8 + 5)) : 0;

  const getAiMetrics = () => {
    let structuralDamageSum = 0;
    let structuralCount = 0;
    let finishingDamageSum = 0;
    let finishingCount = 0;
    let utilityDamageSum = 0;
    let utilityCount = 0;

    filteredAssessments.forEach(a => {
      a.components?.forEach((c: any) => {
        const cDamage = c.damageDetails?.reduce((sum: number, det: any) => sum + det.percentage, 0) || 0;
        const nameLower = c.name?.toLowerCase() || "";
        
        if (nameLower.includes("struktur") || nameLower.includes("pondasi") || nameLower.includes("kolom") || nameLower.includes("balok")) {
          structuralDamageSum += cDamage;
          structuralCount++;
        } else if (nameLower.includes("arsitektur") || nameLower.includes("dinding") || nameLower.includes("atap") || nameLower.includes("finishing")) {
          finishingDamageSum += cDamage;
          finishingCount++;
        } else if (nameLower.includes("utilitas") || nameLower.includes("listrik") || nameLower.includes("air")) {
          utilityDamageSum += cDamage;
          utilityCount++;
        }
      });
    });

    const crackScore = structuralCount > 0 ? Math.round((structuralDamageSum / structuralCount) * 1.5 + 10) : 45;
    const corrosionScore = utilityCount > 0 ? Math.round((utilityDamageSum / utilityCount) * 1.2 + 5) : 30;
    const weatheringScore = finishingCount > 0 ? Math.round((finishingDamageSum / finishingCount) * 1.4 + 8) : 25;

    return {
      cracks: Math.min(98, Math.max(5, crackScore)),
      corrosion: Math.min(95, Math.max(5, corrosionScore)),
      weathering: Math.min(97, Math.max(5, weatheringScore))
    };
  };
  const aiMetrics = getAiMetrics();
  
  const criticalBuildings = [...filteredAssessments].sort((a, b) => (b.finalResult?.totalDamagePercentage || 0) - (a.finalResult?.totalDamagePercentage || 0)).slice(0, 4);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
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
              <p className="text-xs text-rose-600 mt-0.5 font-medium">Terdapat <strong>{newReportsCount} laporan kerusakan</strong> yang perlu segera ditindaklanjuti atau diverifikasi oleh tim penilai.</p>
            </div>
            <Link to="/list" className="relative z-10 shrink-0 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all">
              Lihat Laporan
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Executive Summary Header */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
            <Activity className="w-7 h-7 text-blue-400" />
            Dasbor Eksekutif SPKBG
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-mono">
            Sistem Penilaian Kerusakan Bangunan Gedung • Nasional & Internasional Standard (ISO 55000, FEMA, ASCE 41-23)
          </p>
        </div>
        <button
          onClick={handleSeedSample}
          disabled={seeding}
          className="relative z-10 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95"
        >
          {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-yellow-400" />}
          <span className="text-xs">Sinkronisasi Data Nasional</span>
        </button>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={cn(
            "pb-3 pt-1 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2",
            activeTab === "overview"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 font-semibold"
          )}
        >
          <Activity className="w-4 h-4" />
          <span>Ikhtisar Analisis</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("recent")}
          className={cn(
            "pb-3 pt-1 px-6 font-bold text-sm border-b-2 transition-all flex items-center gap-2",
            activeTab === "recent"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 font-semibold"
          )}
        >
          <Clock className="w-4 h-4" />
          <span>Aktivitas Terbaru</span>
          {auditTrails.length > 0 && (
            <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
              {auditTrails.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "recent" ? (
        <RecentActivityWidget auditTrails={auditTrails} loadingAudit={loadingAudit} />
      ) : (
        <>
          <ExecutiveSummaryWidget />
          
          {/* Filter Wilayah Terintegrasi */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <MapPin className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Filter Wilayah Terintegrasi</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Saring seluruh grafik bulanan, peta GIS, dan matriks risiko secara otomatis</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label htmlFor="region-filter" className="text-xs font-bold text-slate-500 shrink-0">Wilayah / Kota:</label>
              <select
                id="region-filter"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full sm:w-56 px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/80 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {selectedCity !== "Semua" && (
                <button
                  onClick={() => setSelectedCity("Semua")}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 text-xs font-bold rounded-xl transition-all whitespace-nowrap"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StatusUpdatesWidget />
            <StaffPerformancePanel />
          </div>

          <AdminKPICards 
            targetTotal={targetTotal}
            targetAssessed={targetAssessed}
            targetPercent={targetPercent}
            currentBHI={currentBHI}
            bhiStatus={bhiStatus}
            fciValue={fciValue}
            fciStatus={fciStatus}
            currentSBDS={currentSBDS}
            sbdsStatus={sbdsStatus}
          />

          <AdminChartsRow 
            theme={theme}
            dsiData={dsiData}
            bhiData={bhiData}
            riskCounts={{
              low: lowRiskCount,
              med: medRiskCount,
              high: highRiskCount,
              extreme: extremeRiskCount
            }}
          />

          <AdminMonthlyDamageChart 
            theme={theme}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            monthlyDamageData={monthlyDamageData}
          />

          <AdminFinancialInsights 
            assessments={filteredAssessments}
            highRiskCount={highRiskCount}
            extremeRiskCount={extremeRiskCount}
            resolvedCount={resolvedCount}
            maintData={maintData}
            totalEstimatedBudget={totalEstimatedBudget}
            formatRupiah={formatRupiah}
            dynamicROI={dynamicROI}
            aiMetrics={aiMetrics}
          />

          <AdminCriticalBuildings 
            assessments={filteredAssessments}
            criticalBuildings={criticalBuildings}
            setSelectedAssessment={setSelectedAssessment}
            formatRupiah={formatRupiah}
          />
        </>
      )}
    </motion.div>
  );
}
