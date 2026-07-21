import React from "react";
import { Link } from "react-router-dom";
import { 
  Activity, ClipboardList, FileText, Map as MapIcon, Brain, Building, 
  Clock, MapPin, CheckCircle2, ArrowRight, BarChart as BarChartIcon, 
  PieChart as PieChartIcon, SlidersHorizontal, DollarSign 
} from "lucide-react";
import { motion } from "motion/react";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Assessment } from "../../types";

interface KadisDashboardProps {
  assessments: Assessment[];
  setSelectedAssessment: React.Dispatch<React.SetStateAction<Assessment | null>>;
}

export default function KadisDashboard({
  assessments,
  setSelectedAssessment
}: KadisDashboardProps) {
  const menungguPengesahan = assessments.filter(a => a.status === "Selesai_Dianalisis").length;
  const sudahDisahkan = assessments.filter(a => a.status === "Arsip_Digital").length;
  const totalPenilaian = assessments.length;
  const disahkanData = assessments.filter(a => a.status === "Arsip_Digital");
  const totalRusakBerat = disahkanData.filter(a => (a.finalResult?.totalDamagePercentage || 0) > 45).length;
  const totalLuasPenanganan = disahkanData.reduce((sum, a) => sum + (a.buildingArea || 380), 0);
  const estAnggaran = disahkanData.reduce((sum, a) => sum + (((a.finalResult?.totalDamagePercentage || 0) / 100) * (a.buildingArea || 380) * 2500000), 0);
  const capaianKinerja = totalPenilaian > 0 ? Math.round((sudahDisahkan / totalPenilaian) * 100) : 0;

  // Data for charts
  const chartData = [
    { name: 'Triwulan I', selesai: Math.floor(sudahDisahkan * 0.2) },
    { name: 'Triwulan II', selesai: Math.floor(sudahDisahkan * 0.3) },
    { name: 'Triwulan III', selesai: Math.floor(sudahDisahkan * 0.4) },
    { name: 'Triwulan IV', selesai: Math.floor(sudahDisahkan * 0.1) },
  ];
  
  // Distribution for Pie Chart
  const berat = totalRusakBerat;
  const sedang = disahkanData.filter(a => (a.finalResult?.totalDamagePercentage || 0) > 30 && (a.finalResult?.totalDamagePercentage || 0) <= 45).length;
  const ringan = disahkanData.filter(a => (a.finalResult?.totalDamagePercentage || 0) <= 30).length;
  
  const pieData = [
    { name: 'Rusak Ringan', value: ringan, fill: '#34d399' },
    { name: 'Rusak Sedang', value: sedang, fill: '#fbbf24' },
    { name: 'Rusak Berat', value: berat, fill: '#f43f5e' }
  ];

  const formatRupiah = (val: number) => {
    if (val >= 1000000000) {
      return `Rp ${(val / 1000000000).toFixed(2)} M`;
    }
    return `Rp ${(val / 1000000).toFixed(1)} Jt`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <Activity className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="text-3xl font-black tracking-tight uppercase">
                Executive Dashboard
              </h1>
            </div>
            <p className="text-sm text-slate-300 font-medium max-w-xl leading-relaxed">
              Portal Indikator Kinerja Kunci (IKK) Kepala Dinas PUPR dalam Penyelenggaraan Pemantauan & Evaluasi Infrastruktur Bangunan Gedung (Permendagri No. 17/2007, PP 16/2021).
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shrink-0 text-center min-w-[160px]">
            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-1">Capaian Kinerja Layanan</p>
            <div className="flex items-end justify-center gap-1">
              <span className="text-4xl font-black text-white">{capaianKinerja}</span>
              <span className="text-lg font-bold text-blue-300 mb-1">%</span>
            </div>
            <div className="w-full bg-slate-700/50 h-1.5 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${capaianKinerja}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation / Pintasan Kadis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link to="/disposisi" className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-400/50 transition-all group flex flex-col items-center justify-center text-center gap-2 h-32">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full group-hover:scale-110 transition-transform">
            <ClipboardList className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Disposisi & Pengesahan</span>
        </Link>
        <Link to="/list" className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-400/50 transition-all group flex flex-col items-center justify-center text-center gap-2 h-32">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full group-hover:scale-110 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Arsip Laporan Kerusakan</span>
        </Link>
        <Link to="/map" className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-400/50 transition-all group flex flex-col items-center justify-center text-center gap-2 h-32">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full group-hover:scale-110 transition-transform">
            <MapIcon className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Peta Persebaran Aset</span>
        </Link>
        <Link to="/ai" className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-purple-400/50 transition-all group flex flex-col items-center justify-center text-center gap-2 h-32">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full group-hover:scale-110 transition-transform">
            <Brain className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest">Dashboard AI & Prediksi</span>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between theme-transition hover:border-blue-400/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
              <Building className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg">YTD</span>
          </div>
          <div>
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Total Aset Dievaluasi</h3>
            <p className="text-3xl font-black text-slate-800 dark:text-white">{totalPenilaian}</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <ArrowRight className="w-3 h-3 -rotate-45" /> +12% dari Triwulan lalu
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between theme-transition hover:border-amber-400/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            {menungguPengesahan > 0 ? (
              <span className="text-[10px] font-bold px-2 py-1 bg-rose-100 text-rose-600 rounded-lg animate-pulse">ACTION REQ</span>
            ) : (
              <span className="text-[10px] font-bold px-2 py-1 bg-emerald-100 text-emerald-600 rounded-lg">CLEARED</span>
            )}
          </div>
          <div>
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Menunggu Pengesahan</h3>
            <p className="text-3xl font-black text-amber-600 dark:text-amber-400">{menungguPengesahan}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Dokumen siap Ditetapkan</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between theme-transition hover:border-rose-400/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-900/30 rounded-xl text-rose-600 dark:text-rose-400">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Kondisi Rusak Berat</h3>
            <p className="text-3xl font-black text-rose-600 dark:text-rose-400">{totalRusakBerat}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Prioritas Penanganan APBD</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between theme-transition hover:border-emerald-400/50 transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">SK Diterbitkan (Resmi)</h3>
            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{sudahDisahkan}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Total {totalLuasPenanganan.toLocaleString('id-ID')} m² Bangunan</p>
          </div>
        </div>
      </div>

      {/* Action Banner */}
      {menungguPengesahan > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-700 rounded-full shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900">Terdapat {menungguPengesahan} Dokumen Membutuhkan Pengesahan Pimpinan</h3>
              <p className="text-xs text-amber-700 mt-1 font-medium">Laporan Teknis dari Bidang Bangunan telah terverifikasi dan siap untuk ditetapkan sebagai Surat Keputusan Tingkat Kerusakan.</p>
            </div>
          </div>
          <Link to="/disposisi" className="shrink-0 bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-amber-500/30 flex items-center gap-2">
            Buka Kotak Masuk <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}

      {/* Charts & Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 theme-transition">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Tren Penyelesaian Evaluasi</h3>
            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <BarChartIcon className="w-4 h-4 text-slate-500" />
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSelesai" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#334155', fontSize: '12px', fontWeight: 'bold' }}
                  labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="selesai" name="Berkas Disahkan" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSelesai)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 theme-transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Distribusi Tingkat Kerusakan Aset</h3>
              <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <PieChartIcon className="w-4 h-4 text-slate-500" />
              </div>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }}></div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="text-xs font-black" style={{ color: item.fill }}>{item.value} Unit ({totalPenilaian > 0 ? Math.round((item.value/disahkanData.length)*100) : 0}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm theme-transition">
          <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-slate-800 pb-3">Proyeksi Kebutuhan Anggaran Penanganan Fisik (APBD)</h3>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left flex-1">
              <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">Total Estimasi Anggaran Rehabilitasi</p>
              <h2 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white mb-4 bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
                {formatRupiah(estAnggaran)}
              </h2>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">Berdasarkan Harga Satuan Bangunan Gedung Negara (HSBGN) rata-rata Rp 2.500.000 / m²</p>
              </div>
            </div>
            <div className="shrink-0 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 w-full md:w-64 text-center">
              <DollarSign className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rata-rata Biaya Per Unit</p>
              <p className="text-xl font-black text-slate-800 dark:text-white mt-1">
                {disahkanData.length > 0 ? formatRupiah(estAnggaran / disahkanData.length) : "Rp 0"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm theme-transition mt-4">
          <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-500" /> Profil & Rekam Jejak Aset Daerah
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] text-slate-500 uppercase font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Nama Bangunan</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">BHI</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {assessments.slice(0, 5).map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-bold block text-slate-800 dark:text-slate-200">{a.buildingName}</span>
                      <span className="text-[9px] text-slate-400">{a.schoolName}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[10px] rounded font-bold uppercase">{a.status?.replace('_', ' ') || 'Menunggu Validasi'}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-bold">
                      {(100 - (a.finalResult?.totalDamagePercentage || 0)).toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => setSelectedAssessment(a)} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-[10px] font-bold rounded-lg transition-all">
                        Lihat Detail & Riwayat
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {assessments.length > 5 && (
            <div className="mt-4 text-center">
              <Link to="/list" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">Lihat Semua Aset →</Link>
            </div>
          )}
      </div>

    </motion.div>
  );
}
