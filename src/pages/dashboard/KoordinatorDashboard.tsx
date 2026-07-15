import React from "react";
import { Link } from "react-router-dom";
import { Calendar, ClipboardList, Activity, ArrowRight, Clock } from "lucide-react";
import { motion } from "motion/react";
import { Assessment } from "../../types";

interface KoordinatorDashboardProps {
  assessments: Assessment[];
  setSelectedAssessment: React.Dispatch<React.SetStateAction<Assessment | null>>;
}

export default function KoordinatorDashboard({
  assessments,
  setSelectedAssessment
}: KoordinatorDashboardProps) {
  const menungguDisposisi = assessments.filter(a => a.status === "Survei_Lapangan").length;
  const dalamProses = assessments.filter(a => a.status === "Selesai_Dianalisis").length;

  // Simple calendar logic
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const days = Array.from({length: daysInMonth}, (_, i) => i + 1);
  
  // Create dummy schedules for visual
  const schedules = assessments.map(a => {
    const d = new Date(a.date);
    // arbitrarily add 3 days for deadline
    return { id: a.id, day: (d.getDate() + 3) % daysInMonth + 1, type: 'deadline', schoolName: a.schoolName };
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="bg-gradient-to-r from-sky-900 to-blue-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
            <Calendar className="w-7 h-7 text-sky-400" />
            Dasbor Koordinator Survei
          </h1>
          <p className="text-sm text-sky-100/70 mt-1 font-mono">
            Manajemen Jadwal Inspeksi & Disposisi Tim Teknis
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Siap Disposisi Ke Tim Teknis</p>
            <h3 className="text-2xl font-black text-blue-600">{menungguDisposisi}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl"><ClipboardList className="w-6 h-6 text-blue-500" /></div>
        </div>
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Jadwal Inspeksi</p>
            <h3 className="text-2xl font-black text-emerald-600">{assessments.length}</h3>
          </div>
          <div className="p-3 bg-emerald-50 rounded-xl"><Calendar className="w-6 h-6 text-emerald-500" /></div>
        </div>
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Analisis Dalam Proses</p>
            <h3 className="text-2xl font-black text-amber-600">{dalamProses}</h3>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl"><Activity className="w-6 h-6 text-amber-500" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Kalender Jadwal Inspeksi & Tenggat Waktu
            </h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Deadline Verifikasi</span>
              <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Jadwal Inspeksi</span>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
              <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase">{d}</div>
            ))}
            {Array.from({length: firstDay}).map((_, i) => (
              <div key={'empty-'+i} className="h-16 rounded-xl bg-slate-50/50 border border-slate-100/50"></div>
            ))}
            {days.map(d => {
              const daySchedules = schedules.filter(s => s.day === d);
              const isToday = d === today.getDate();
              return (
                <div key={d} className={"h-16 rounded-xl border p-1 flex flex-col " + (isToday ? "border-blue-300 bg-blue-50" : "border-slate-100 bg-white")}>
                  <span className={"text-xs font-bold " + (isToday ? "text-blue-700" : "text-slate-600")}>{d}</span>
                  <div className="flex-1 flex flex-col gap-0.5 mt-1 overflow-hidden">
                    {daySchedules.map((s, idx) => (
                      <div key={idx} className="w-full text-[8px] bg-rose-100 text-rose-700 px-1 py-0.5 rounded truncate font-medium">
                        {s.schoolName}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Jalan Pintas Koordinator</h3>
          <div className="space-y-3">
            <Link to="/disposisi" className="flex items-center justify-between p-3 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-200 transition-colors"><ClipboardList className="w-4 h-4" /></div>
                <span className="text-sm font-bold text-blue-800">Tambahkan Tugas Disposisi ke Tim Teknis</span>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/list" className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 group-hover:bg-emerald-200 transition-colors"><Activity className="w-4 h-4" /></div>
                <span className="text-sm font-bold text-emerald-800">Pantau Progres Penilaian</span>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mt-6 mb-4 border-b border-slate-100 pb-2">Notifikasi Tenggat Waktu</h3>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {assessments.slice(0, 3).map(a => (
              <div key={a.id} className="p-3 border border-rose-100 rounded-xl flex justify-between items-center bg-rose-50/50">
                <div>
                  <h4 className="text-xs font-bold text-rose-800 truncate max-w-[150px]">{a.schoolName}</h4>
                  <p className="text-[10px] text-rose-600 font-medium">Batas Waktu: Besok</p>
                </div>
                <Clock className="w-4 h-4 text-rose-500" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
