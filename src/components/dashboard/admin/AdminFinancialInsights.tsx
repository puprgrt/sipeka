import React from "react";
import { Map as MapIcon, Wrench, DollarSign, Brain, Sparkles, Activity, AlertTriangle, Layers } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";
import { motion } from "motion/react";
import { Assessment } from "../../../types";

interface AdminFinancialInsightsProps {
  assessments: Assessment[];
  highRiskCount: number;
  extremeRiskCount: number;
  resolvedCount: number;
  maintData: any[];
  totalEstimatedBudget: number;
  formatRupiah: (val: number) => string;
  dynamicROI: number;
  aiMetrics: { cracks: number; corrosion: number; weathering: number };
}

export default function AdminFinancialInsights({
  assessments,
  highRiskCount,
  extremeRiskCount,
  resolvedCount,
  maintData,
  totalEstimatedBudget,
  formatRupiah,
  dynamicROI,
  aiMetrics
}: AdminFinancialInsightsProps) {
  const getAiSeverityLabel = (score: number) => {
    if (score > 80) return <span className="text-rose-600">Kritis</span>;
    if (score > 50) return <span className="text-amber-600">Signifikan</span>;
    return <span className="text-emerald-600">Minor</span>;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
      {/* GIS Monitoring Dashboard */}
      <div className="col-span-12 md:col-span-7 bg-white p-0 rounded-2xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden min-h-[250px]">
        <div className="absolute inset-0 bg-slate-100 opacity-50 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="absolute top-0 left-0 right-0 p-4 z-10 bg-gradient-to-b from-white/90 to-transparent">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <MapIcon className="w-4 h-4 text-blue-500" /> Pemantauan GIS
          </h3>
          <p className="text-[9px] text-slate-500 font-mono mt-1">Overlay: Risiko Gempa, Banjir, Longsor</p>
        </div>
        
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-500/10 rounded-full blur-xl border border-red-500/20"></div>
          <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-xl border border-blue-500/20"></div>
          
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }} className="w-3 h-3 bg-red-500 rounded-full absolute top-1/3 left-1/3 border-2 border-white shadow-lg cursor-pointer"></motion.div>
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} className="w-2.5 h-2.5 bg-orange-500 rounded-full absolute top-[30%] left-[40%] border border-white shadow-lg cursor-pointer"></motion.div>
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }} className="w-3 h-3 bg-emerald-500 rounded-full absolute bottom-1/3 right-1/4 border-2 border-white shadow-lg cursor-pointer"></motion.div>
          <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 1.5 }} className="w-2 h-2 bg-yellow-500 rounded-full absolute bottom-[40%] right-[30%] border border-white shadow-lg cursor-pointer"></motion.div>
        </div>

        <div className="absolute bottom-4 left-4 right-4 z-10 flex gap-2">
          <div className="bg-white/90 backdrop-blur text-[9px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex-1 text-center">
            <span className="text-red-600 block text-lg font-black">{highRiskCount}</span> Risiko Tinggi
          </div>
          <div className="bg-white/90 backdrop-blur text-[9px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm flex-1 text-center">
            <span className="text-orange-600 block text-lg font-black">{extremeRiskCount}</span> Perlu Evakuasi
          </div>
        </div>
      </div>

      {/* Cost & Maintenance Combined */}
      <div className="col-span-12 md:col-span-5 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-1 flex items-center justify-between">
          <div>
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <Wrench className="w-3 h-3 text-slate-400" /> SLA Pemeliharaan
            </h3>
            <p className="text-2xl font-black text-slate-800 font-mono">
              {assessments.length > 0 ? Math.round((resolvedCount / assessments.length) * 100) : 100}%
            </p>
            <p className="text-[9px] font-medium text-emerald-600 bg-emerald-50 inline-block px-1.5 py-0.5 rounded mt-1">
              Prev: {assessments.length > 0 ? Math.max(45, Math.round((resolvedCount / assessments.length) * 85)) : 80}% | Corr: {assessments.length > 0 ? Math.max(15, Math.round((resolvedCount / assessments.length) * 15)) : 20}%
            </p>
          </div>
          <div className="w-24 h-16">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={maintData}>
                <Area type="monotone" dataKey="value" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col justify-center">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
            <DollarSign className="w-3 h-3 text-slate-400" /> Dampak Biaya & Anggaran
          </h3>
          <div className="flex justify-between items-end border-b border-slate-100 pb-2 mb-2">
            <span className="text-[10px] font-medium text-slate-600">Estimasi Perbaikan</span>
            <span className="text-sm font-black text-rose-600 font-mono">
              {formatRupiah(totalEstimatedBudget)}
            </span>
          </div>
          <div className="flex justify-between items-end pb-1">
            <span className="text-[10px] font-medium text-slate-600">ROI Retrofit</span>
            <span className="text-sm font-black text-emerald-600 font-mono">
              {dynamicROI}%
            </span>
          </div>
        </div>
      </div>

      {/* AI Engine Damage Assessment Visualization */}
      <div className="col-span-12 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-600" /> Metrik AI Damage Assessment
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Status deteksi kerusakan visual (Keretakan, Korosi, Pelapukan) berbasis AI Engine</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
              <Sparkles className="w-3 h-3" /> AI Engine Aktif
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* AI Status Cards */}
          <div className="space-y-4">
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Keretakan (Cracks)</p>
                <p className="text-lg font-black text-slate-800">
                  {getAiSeverityLabel(aiMetrics.cracks)}{" "}
                  <span className="text-xs font-bold text-rose-600 ml-1">{aiMetrics.cracks}% Terdeteksi</span>
                </p>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Korosi (Corrosion)</p>
                <p className="text-lg font-black text-slate-800">
                  {getAiSeverityLabel(aiMetrics.corrosion)}{" "}
                  <span className="text-xs font-bold text-amber-600 ml-1">{aiMetrics.corrosion}% Terdeteksi</span>
                </p>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pelapukan (Weathering)</p>
                <p className="text-lg font-black text-slate-800">
                  {getAiSeverityLabel(aiMetrics.weathering)}{" "}
                  <span className="text-xs font-bold text-blue-600 ml-1">{aiMetrics.weathering}% Terdeteksi</span>
                </p>
              </div>
            </div>
          </div>

          {/* Radar Chart for AI Metrics */}
          <div className="md:col-span-2 bg-slate-900 rounded-xl p-4 flex flex-col justify-center items-center relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl"></div>
            <div className="absolute -left-10 -top-10 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl"></div>
            
            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-4 z-10">Pola Kerusakan AI (Confidence Score)</h4>
            <div className="w-full h-48 z-10">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                  { subject: 'Keretakan Struktur', A: aiMetrics.cracks, fullMark: 100 },
                  { subject: 'Korosi Tulangan', A: aiMetrics.corrosion, fullMark: 100 },
                  { subject: 'Pelapukan Kayu', A: aiMetrics.weathering, fullMark: 100 },
                  { subject: 'Spalling Beton', A: Math.round(aiMetrics.cracks * 0.85), fullMark: 100 },
                  { subject: 'Penurunan Tanah', A: Math.round(aiMetrics.cracks * 0.60), fullMark: 100 },
                ]}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 8 }} axisLine={false} />
                  <Radar name="AI Confidence" dataKey="A" stroke="#818cf8" fill="#818cf8" fillOpacity={0.5} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
