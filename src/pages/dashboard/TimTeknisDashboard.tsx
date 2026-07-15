import React from "react";
import { Link } from "react-router-dom";
import { MapPin, CheckCircle2, FileText, MapIcon, PlusCircle } from "lucide-react";
import { motion } from "motion/react";
import { Assessment } from "../../types";
import DashboardMap from "../../components/dashboard/DashboardMap";

interface TimTeknisDashboardProps {
  assessments: Assessment[];
  setSelectedAssessment: React.Dispatch<React.SetStateAction<Assessment | null>>;
}

export default function TimTeknisDashboard({
  assessments,
  setSelectedAssessment
}: TimTeknisDashboardProps) {
  const tugasSurvei = assessments.filter((a) => a.status === "Survei_Lapangan").length;
  const tugasSelesai = assessments.filter((a) => a.status === "Selesai_Dianalisis").length;

  const filteredAssessments = assessments; // Can be filtered if needed

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="bg-gradient-to-r from-orange-900 to-amber-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
            <MapPin className="w-7 h-7 text-orange-400" />
            Dasbor Tim Teknis Lapangan
          </h1>
          <p className="text-sm text-orange-100/70 mt-1 font-mono">
            Manajemen Tugas Survei & Penilaian Kerusakan Bangunan
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tugas Survei Aktif</p>
            <h3 className="text-2xl font-black text-rose-600">{tugasSurvei}</h3>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl"><MapPin className="w-6 h-6 text-rose-500" /></div>
        </div>
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Survei Selesai (Bulan Ini)</p>
            <h3 className="text-2xl font-black text-emerald-600">{tugasSelesai}</h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl"><CheckCircle2 className="w-6 h-6 text-emerald-500" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Jalan Pintas Operasional</h3>
          <div className="space-y-3">
            <Link to="/list" className="flex items-center justify-between p-3 rounded-xl border border-orange-100 bg-orange-50 hover:bg-orange-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600 group-hover:bg-orange-200 transition-colors"><FileText className="w-4 h-4" /></div>
                <span className="text-sm font-bold text-orange-800">Lihat Daftar Tugas Penilaian & Survei</span>
              </div>
            </Link>
            <Link to="/map" className="flex items-center justify-between p-3 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-200 transition-colors"><MapIcon className="w-4 h-4" /></div>
                <span className="text-sm font-bold text-blue-800">Peta Lokasi Survei Bangunan</span>
              </div>
            </Link>
            <Link to="/new" className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-200 rounded-lg text-slate-600 group-hover:bg-slate-300 transition-colors"><PlusCircle className="w-4 h-4" /></div>
                <span className="text-sm font-bold text-slate-700">Input Data Form Lapangan Manual</span>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Tugas Prioritas Hari Ini</h3>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {assessments.filter((a) => a.status === "Survei_Lapangan").slice(0, 5).map((a) => (
              <div key={a.id} className="p-3 border border-rose-100 rounded-xl flex flex-col gap-2 bg-rose-50/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{a.schoolName}</h4>
                    <p className="text-[10px] text-slate-500">{a.address}</p>
                  </div>
                  <Link to={`/verifikasi?id=${a.id}`} className="text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-2 py-1 rounded shadow-sm">Lihat Detail</Link>
                </div>
              </div>
            ))}
            {tugasSurvei === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs font-medium">Tidak ada tugas survei baru.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 mb-6">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-6 shadow-sm col-span-1 md:col-span-2">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-indigo-600" /> Peta Interaktif Sebaran Tugas (Real-time)
            </h3>
            <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">Live</span>
          </div>
          <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner z-0">
            <DashboardMap filteredAssessments={filteredAssessments} setSelectedAssessment={setSelectedAssessment} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Jarak Tempuh Est.</p>
              <p className="text-lg font-black text-slate-700">{Math.round(tugasSurvei * 4.5)} <span className="text-xs font-normal">km</span></p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Waktu Est. Inspeksi</p>
              <p className="text-lg font-black text-slate-700">{tugasSurvei * 2.5} <span className="text-xs font-normal">Jam</span></p>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase">SLA Pencapaian</p>
              <p className="text-lg font-black text-emerald-600">92%</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
