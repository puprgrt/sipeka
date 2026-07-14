import { useEffect, useState } from "react";
import { Users, CheckCircle2, FileText, Loader2, Award, Briefcase, Activity } from "lucide-react";

interface AuditTrail {
  userId: number;
  userName: string;
  role: string;
  action: string;
}

interface StaffPerformance {
  userId: number;
  userName: string;
  role: string;
  verifikasiCount: number;
  disposisiCount: number;
  totalAction: number;
}

export default function StaffPerformancePanel() {
  const [staffData, setStaffData] = useState<StaffPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/audit-trails");
        if (res.ok) {
          const data: AuditTrail[] = await res.json();
          
          const performanceMap = new Map<number, StaffPerformance>();
          
          data.forEach(t => {
            if (!t.userId || !t.userName) return; 
            // Skip Pengelola Bangunan from staff report, typically staff are internal users
            if (t.role === "Pengelola_Bangunan") return;

            if (!performanceMap.has(t.userId)) {
              performanceMap.set(t.userId, {
                userId: t.userId,
                userName: t.userName,
                role: t.role || "Staf",
                verifikasiCount: 0,
                disposisiCount: 0,
                totalAction: 0,
              });
            }
            
            const staff = performanceMap.get(t.userId)!;
            staff.totalAction++;
            
            if (t.action === "Verifikasi") {
              staff.verifikasiCount++;
            } else if (t.action === "Disposisi") {
              staff.disposisiCount++;
            }
          });
          
          // Sort by totalAction descending
          const sorted = Array.from(performanceMap.values()).sort((a, b) => b.totalAction - a.totalAction);
          setStaffData(sorted.slice(0, 5)); // Top 5
        }
      } catch (err) {
        console.error("Failed to fetch staff performance", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col theme-transition mt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-500" /> Kinerja & Aktivitas Staf
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">Berdasarkan log aktivitas verifikasi & disposisi</p>
        </div>
        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
          <Award className="w-4 h-4" />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
        </div>
      ) : staffData.length > 0 ? (
        <div className="space-y-4">
          {staffData.map((staff, idx) => (
            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                  {staff.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">{staff.userName}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded uppercase tracking-wider">
                      {staff.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 text-xs">
                <div className="flex flex-col items-center">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Verifikasi</span>
                  <span className="font-black text-emerald-600 text-sm flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {staff.verifikasiCount}
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex flex-col items-center">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Disposisi</span>
                  <span className="font-black text-blue-600 text-sm flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" /> {staff.disposisiCount}
                  </span>
                </div>
                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex flex-col items-center">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total</span>
                  <span className="font-black text-slate-700 dark:text-slate-300 text-sm">
                    {staff.totalAction}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-500 text-xs">
          Belum ada data kinerja staf.
        </div>
      )}
    </div>
  );
}
