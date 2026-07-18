import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  ClipboardCheck, Users, TrendingUp, Star, Award, Search, MessageSquare, 
  Building, Calendar, Download
} from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { cn } from "../lib/utils";
import { exportIkmReportToPdf } from "../lib/exportPdf";

// Removed hardcoded IKM_UNSUR_LABELS, will be fetched dynamically
interface IkmQuestion {
  id: number;
  key: string;
  label: string;
}

const CATEGORY_COLORS = {
  "Sangat Baik": "#10b981", // emerald-500
  "Baik": "#3b82f6", // blue-500
  "Kurang Baik": "#f59e0b", // amber-500
  "Tidak Baik": "#ef4444" // red-500
};

export default function IkmDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [questionsConfig, setQuestionsConfig] = useState<IkmQuestion[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/ikm/stats").then(res => res.json()),
      fetch("/api/ikm/responses").then(res => res.json()),
      fetch("/api/settings/ikm-questions").then(res => res.json()).catch(() => [])
    ])
    .then(([statsData, responsesData, questionsData]) => {
      setStats(statsData);
      setResponses(Array.isArray(responsesData) ? responsesData : []);
      setQuestionsConfig(Array.isArray(questionsData) ? questionsData : []);
    })
    .catch(err => console.error("Failed to load IKM data:", err))
    .finally(() => setLoading(false));
  }, []);

  const getLabel = (key: string) => {
    const q = questionsConfig.find(q => q.key === key);
    return q ? q.label : key;
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Memuat Data Analitik IKM...</p>
        </div>
      </div>
    );
  }

  // Format data for Radar Chart
  const radarData = stats?.averages ? Object.entries(stats.averages).map(([key, value]) => ({
    subject: getLabel(key).length > 15 ? getLabel(key).substring(0, 15) + "..." : getLabel(key),
    A: value,
    fullMark: 4
  })) : [];

  // Format data for Pie Chart
  const pieData = stats?.distribution ? Object.entries(stats.distribution)
    .filter(([_, value]) => (value as number) > 0)
    .map(([name, value]) => ({
      name,
      value
    })) : [];

  // Filter responses
  const filteredResponses = responses.filter(r => 
    r.testimoni?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.buildingName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.schoolName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50/50">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <span className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl shadow-sm">
                <ClipboardCheck className="w-6 h-6 sm:w-7 sm:h-7" />
              </span>
              Dashboard IKM
            </h1>
            <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
              Analitik Indeks Kepuasan Masyarakat (IKM) berdasarkan Permenpan No. 14/2017. 
              Data diperoleh dari hasil survei Pengelola Bangunan sebelum mengunduh Laporan Penilaian.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportIkmReportToPdf(stats, responses)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-2xl shadow-sm flex items-center gap-2 text-sm font-bold transition-colors"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">Download Laporan</span>
            </button>
            <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-200/60 flex items-center gap-4">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Responden</p>
                <p className="text-2xl font-black text-slate-800">{stats?.totalResponses || 0}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Nilai IKM */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-pu-blue to-indigo-800 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200/50 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-indigo-100 mb-2">
                <Star className="w-5 h-5 fill-indigo-100" />
                <span className="text-xs font-bold uppercase tracking-widest">Rata-rata Nilai IKM</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tighter">{stats?.averageIKM || 0}</span>
                <span className="text-indigo-200 font-medium">/ 100</span>
              </div>
              
              <div className="mt-6 flex items-center gap-3">
                <div className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-lg text-sm font-bold flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> Mutu Pelayanan
                </div>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Kategori Dominan */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-widest">Kategori Dominan</span>
              </div>
              
              {pieData.length > 0 ? (
                <div className="mt-2">
                  <span className="text-3xl font-black text-slate-800">{pieData.reduce((prev, current) => (prev.value > current.value) ? prev : current).name}</span>
                </div>
              ) : (
                <div className="mt-2 text-2xl font-bold text-slate-400">Belum Ada Data</div>
              )}
            </div>
            
            <div className="mt-4 flex gap-2">
              {pieData.map((entry, idx) => (
                <div key={idx} className="flex-1 bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                  <div className="text-lg font-black text-slate-700">{String(entry.value)}</div>
                  <div className="text-[9px] uppercase font-bold text-slate-400 truncate">{entry.name}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card 3: Unsur Tertinggi/Terendah */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex flex-col justify-center gap-4"
          >
            {stats && stats.averages && Object.keys(stats.averages).length > 0 ? (() => {
              const entries = Object.entries(stats.averages);
              const max = entries.reduce((prev, current) => (prev[1] > current[1]) ? prev : current);
              const min = entries.reduce((prev, current) => (prev[1] < current[1]) ? prev : current);
              
              return (
                <>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1">Skor Tertinggi</div>
                    <div className="flex justify-between items-end">
                      <div className="text-2xl font-black text-emerald-700">{Number(max[1]).toFixed(2)}</div>
                      <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{getLabel(max[0])}</div>
                    </div>
                  </div>
                  
                  <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4">
                    <div className="text-xs text-rose-600 font-semibold mb-1">Nilai Terendah</div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-2xl font-black text-rose-700">{Number(min[1]).toFixed(2)}</div>
                      <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">{getLabel(min[0])}</div>
                    </div>
                  </div>
                </>
              );
            })() : (
              <div className="text-center text-slate-400">Belum Ada Data</div>
            )}
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart: 9 Unsur */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6"
          >
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Target className="w-4 h-4" />
              </span>
              Pemetaan 9 Unsur Pelayanan (Skala 1-4)
            </h3>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 4]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar name="Rata-rata" dataKey="A" stroke="#4f46e5" fill="#6366f1" fillOpacity={0.4} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [value.toFixed(2), "Skor Rata-rata"]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Pie Chart: Distribusi Kategori */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6"
          >
            <h3 className="text-sm font-bold text-slate-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <PieChartIcon className="w-4 h-4" />
              </span>
              Distribusi Kategori IKM
            </h3>
            
            <div className="h-[350px] w-full flex flex-col">
              <ResponsiveContainer width="100%" height="80%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={110}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [value, "Responden"]}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="flex-1 flex flex-wrap justify-center items-center gap-4 mt-2">
                {pieData.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] }} />
                    <span className="text-xs font-semibold text-slate-600">{entry.name} ({String(entry.value)})</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Testimonials Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 flex flex-col"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </span>
              Testimoni & Masukan Responden
            </h3>
            
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari sekolah, bangunan, testimoni..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredResponses.length > 0 ? (
              filteredResponses.map((res, idx) => (
                <div key={idx} className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex flex-col h-full hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <span className="text-xs font-black">{res.nilaiIkm ? Number(res.nilaiIkm).toFixed(0) : 0}</span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{res.schoolName}</h4>
                        <p className="text-[10px] text-slate-500 line-clamp-1 flex items-center gap-1">
                          <Building className="w-3 h-3 inline" /> {res.buildingName}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 italic leading-relaxed">"{res.testimoni}"</p>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(res.date), "dd MMM yyyy", { locale: idLocale })}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center flex flex-col items-center justify-center text-slate-400">
                <MessageSquare className="w-12 h-12 mb-3 text-slate-200" />
                <p className="text-sm font-medium">Tidak ada testimoni yang sesuai</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}

// Additional icons
function Target(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  );
}

function PieChartIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
      <path d="M22 12A10 10 0 0 0 12 2v10z"/>
    </svg>
  );
}
