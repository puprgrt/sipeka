import React from "react";
import { Database, Smartphone, XCircle } from "lucide-react";

export default function ConflictResolutionModal({
  conflict,
  resolveConflict,
  setConflict,
  resolveConflictPromiseRef,
}: any) {
  if (!conflict) return null;

  return (
    <>
        
          <div id="conflict-resolution-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
            <div id="conflict-modal-card" className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
              
              {/* Header */}
              <div id="conflict-modal-header" className="bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white flex items-center gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">Deteksi Konflik Versi Penilaian</h2>
                  <p className="text-xs text-amber-50 opacity-90">Ada perbedaan data antara draf di memori lokal dengan data terbaru di server.</p>
                </div>
              </div>
  
              {/* Content body */}
              <div id="conflict-modal-body" className="p-6 space-y-6">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Sistem mendeteksi bahwa penilaian untuk sekolah <strong className="text-slate-800 dark:text-slate-200">"{conflict.offlineItem.schoolName || conflict.offlineItem.payload?.schoolName || 'Sekolah'}"</strong> telah dimodifikasi secara terpisah. Harap pilih versi mana yang ingin Anda pertahankan di dalam sistem:
                </p>
  
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Local Version Card */}
                  <div id="local-version-card" className="border border-amber-300 dark:border-amber-950 bg-amber-500/5 dark:bg-amber-500/2 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Smartphone className="w-5 h-5 text-amber-500" />
                        <span className="font-extrabold text-sm text-amber-700 dark:text-amber-400 uppercase tracking-wider">Versi Perangkat (Lokal)</span>
                      </div>
                      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                        <div>
                          <span className="font-medium">Sekolah:</span> {conflict.offlineItem.schoolName || conflict.offlineItem.payload?.schoolName || "-"}
                        </div>
                        <div>
                          <span className="font-medium">Bangunan:</span> {conflict.offlineItem.payload?.buildingName || "-"}
                        </div>
                        <div>
                          <span className="font-medium">Tingkat Kerusakan:</span>{" "}
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {conflict.offlineItem.payload?.finalResult?.totalDamagePercentage?.toFixed(2)}% ({conflict.offlineItem.payload?.finalResult?.category})
                          </span>
                        </div>
                        <div>
                          <span className="font-medium font-mono text-[10px]">Terakhir Disimpan:</span>{" "}
                          {conflict.offlineItem.timestamp ? new Date(conflict.offlineItem.timestamp).toLocaleString("id-ID") : "-"}
                        </div>
                      </div>
                    </div>
                    <button
                      id="btn-keep-local"
                      onClick={() => resolveConflict(true)}
                      className="mt-6 w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      Gunakan Versi Lokal
                      <span className="text-[10px] font-normal opacity-85">(Timpa Server)</span>
                    </button>
                  </div>
  
                  {/* Server Version Card */}
                  <div id="server-version-card" className="border border-blue-300 dark:border-blue-950 bg-blue-500/5 dark:bg-blue-500/2 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Database className="w-5 h-5 text-blue-500" />
                        <span className="font-extrabold text-sm text-blue-700 dark:text-blue-400 uppercase tracking-wider">Versi Server (Database)</span>
                      </div>
                      <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                        <div>
                          <span className="font-medium">Sekolah:</span> {conflict.serverData.schoolName || "-"}
                        </div>
                        <div>
                          <span className="font-medium">Bangunan:</span> {conflict.serverData.buildingName || "-"}
                        </div>
                        <div>
                          <span className="font-medium">Tingkat Kerusakan:</span>{" "}
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {conflict.serverData.finalResult?.totalDamagePercentage?.toFixed(2)}% ({conflict.serverData.finalResult?.category})
                          </span>
                        </div>
                        <div>
                          <span className="font-medium font-mono text-[10px]">Terakhir Disimpan:</span>{" "}
                          {conflict.serverData.date ? new Date(conflict.serverData.date).toLocaleString("id-ID") : "-"}
                        </div>
                      </div>
                    </div>
                    <button
                      id="btn-keep-server"
                      onClick={() => resolveConflict(false)}
                      className="mt-6 w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs rounded-lg transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      Gunakan Versi Server
                      <span className="text-[10px] font-normal opacity-85">(Buang Lokal)</span>
                    </button>
                  </div>
  
                </div>
              </div>
  
              {/* Footer */}
              <div id="conflict-modal-footer" className="bg-slate-50 dark:bg-slate-950/40 px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
                <button
                  id="btn-cancel-conflict"
                  onClick={() => {
                    setConflict(null);
                    if (resolveConflictPromiseRef.current) {
                      resolveConflictPromiseRef.current(false);
                    }
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg transition-all cursor-pointer"
                >
                  Putuskan Nanti (Lewati)
                </button>
              </div>
  
            </div>
          </div>
        
  
    </>
  );
}
