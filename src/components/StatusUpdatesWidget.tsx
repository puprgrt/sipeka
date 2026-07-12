import { useEffect, useState } from "react";
import { Activity, Bell, FileText, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id as localeID } from "date-fns/locale";

interface AuditTrail {
  idAudit: number;
  idPermohonan: number;
  userId: number;
  action: string;
  details: string;
  timestamp: string;
  userName: string;
  role: string;
  buildingName: string;
}

export default function StatusUpdatesWidget() {
  const [updates, setUpdates] = useState<AuditTrail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUpdates() {
      try {
        const res = await fetch("/api/audit-trails");
        if (res.ok) {
          const data = await res.json();
          // Filter only status changes or verification
          const filtered = data
            .filter((t: AuditTrail) => t.action === "Ubah Status" || t.action === "Verifikasi" || t.action === "Disposisi")
            .slice(0, 5); // Take top 5
          setUpdates(filtered);
        }
      } catch (err) {
        console.error("Failed to fetch updates", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUpdates();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col theme-transition mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-500" /> Update Status & Verifikasi Terbaru
        </h3>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        </div>
      ) : updates.length > 0 ? (
        <div className="space-y-4">
          {updates.map((update, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {update.buildingName || "Bangunan"}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  <span className="font-semibold text-slate-600 dark:text-slate-200">{update.userName}</span>: {update.details}
                </p>
                <div className="mt-1 text-[9px] font-medium text-slate-400">
                  {formatDistanceToNow(new Date(update.timestamp), { addSuffix: true, locale: localeID })}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-slate-500 text-xs">
          Belum ada aktivitas terbaru.
        </div>
      )}
    </div>
  );
}
