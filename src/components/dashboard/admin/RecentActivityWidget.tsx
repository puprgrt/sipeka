import React, { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface RecentActivityWidgetProps {
  auditTrails: any[];
  loadingAudit: boolean;
}

export default function RecentActivityWidget({ auditTrails, loadingAudit }: RecentActivityWidgetProps) {
  const [searchInput, setSearchInput] = useState("");
  const [selectedActionFilter, setSelectedActionFilter] = useState("Semua");

  const filteredTrails = auditTrails.filter(t => {
    const searchMatch = !searchInput || 
      t.userName?.toLowerCase().includes(searchInput.toLowerCase()) ||
      t.userEmail?.toLowerCase().includes(searchInput.toLowerCase()) ||
      t.details?.toLowerCase().includes(searchInput.toLowerCase());
    
    const actionMatch = selectedActionFilter === "Semua" || t.action === selectedActionFilter;
    
    return searchMatch && actionMatch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between shadow-sm">
        <div className="flex-1 relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari aktivitas berdasarkan nama, email, atau detail..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/80 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <label htmlFor="action-filter" className="text-xs font-bold text-slate-500 shrink-0">Jenis Aksi:</label>
          <select
            id="action-filter"
            value={selectedActionFilter}
            onChange={(e) => setSelectedActionFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/80 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="Semua">Semua Aksi</option>
            <option value="Buat Permohonan">Buat Permohonan</option>
            <option value="Ubah Status">Ubah Status</option>
            <option value="Verifikasi">Verifikasi</option>
            <option value="Disposisi">Disposisi</option>
            <option value="Edit Penilaian">Edit Penilaian</option>
          </select>
        </div>
      </div>

      {loadingAudit ? (
        <div className="flex justify-center py-12 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredTrails.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Tidak ada aktivitas yang ditemukan.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <ul className="divide-y divide-slate-100">
            {filteredTrails.map((trail, index) => (
              <li key={trail.id || index} className="p-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">{trail.action}</p>
                    <p className="text-xs text-slate-600">{trail.details}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        Oleh: {trail.userName || trail.userEmail}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-slate-400 shrink-0">
                    {formatDistanceToNow(new Date(trail.createdAt), { addSuffix: true, locale: id })}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
