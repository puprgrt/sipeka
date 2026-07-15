import React from "react";
import { Link } from "react-router-dom";
import { Activity, FileText, ClipboardList, FileCheck, ArrowRight, Users, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Assessment } from "../../types";

interface OperatorDashboardProps {
  assessments: Assessment[];
}

export default function OperatorDashboard({ assessments }: OperatorDashboardProps) {
  const menungguValidasi = assessments.filter(a => (a.status || "Menunggu_Validasi") === "Menunggu_Validasi").length;
  const menungguDisposisi = assessments.filter(a => a.status === "Survei_Lapangan").length;
  const selesaiDianalisis = assessments.filter(a => a.status === "Selesai_Dianalisis").length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-2xl font-black tracking-tight uppercase flex items-center gap-3">
            <Activity className="w-7 h-7 text-emerald-400" />
            Dasbor Operator Dinas
          </h1>
          <p className="text-sm text-emerald-100/70 mt-1 font-mono">
            Portal Verifikasi Administrasi & Disposisi
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Menunggu Verifikasi Administrasi</p>
            <h3 className="text-2xl font-black text-amber-600">{menungguValidasi}</h3>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl"><FileText className="w-6 h-6 text-amber-500" /></div>
        </div>
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Siap Disposisi (Selesai Verifikasi)</p>
            <h3 className="text-2xl font-black text-blue-600">{menungguDisposisi}</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl"><ClipboardList className="w-6 h-6 text-blue-500" /></div>
        </div>
        <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Permohonan Diproses</p>
            <h3 className="text-2xl font-black text-slate-800">{assessments.length}</h3>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl"><Activity className="w-6 h-6 text-slate-500" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Jalan Pintas Operator</h3>
          <div className="space-y-3">
            <Link to="/admin-verifikasi" className="flex items-center justify-between p-3 rounded-xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 group-hover:bg-emerald-200 transition-colors"><FileCheck className="w-4 h-4" /></div>
                <span className="text-sm font-bold text-emerald-800">Verifikasi Berkas Administrasi Masuk</span>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/disposisi" className="flex items-center justify-between p-3 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-blue-200 transition-colors"><ClipboardList className="w-4 h-4" /></div>
                <span className="text-sm font-bold text-blue-800">Buat & Terbitkan Kartu Disposisi</span>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-500 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/settings" className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-200 rounded-lg text-slate-600 group-hover:bg-slate-300 transition-colors"><Users className="w-4 h-4" /></div>
                <span className="text-sm font-bold text-slate-700">Daftarkan Akun Pengelola Baru</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Permohonan Baru Masuk</h3>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
            {assessments.filter(a => (a.status || "Menunggu_Validasi") === "Menunggu_Validasi").slice(0, 5).map(a => (
              <div key={a.id} className="p-3 border border-slate-100 rounded-xl flex justify-between items-center bg-slate-50/50">
                <div>
                  <h4 className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{a.schoolName}</h4>
                  <p className="text-[10px] text-slate-500">{format(new Date(a.date), "dd MMM yyyy", { locale: id })}</p>
                </div>
                <Link to="/admin-verifikasi" className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded">Verifikasi</Link>
              </div>
            ))}
            {menungguValidasi === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-8">
                <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs font-medium">Semua permohonan telah diverifikasi</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
