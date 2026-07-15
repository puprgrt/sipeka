import React from 'react';
import { HardDrive, Layers, Folder, FileText, FileSpreadsheet, Image as ImageIcon, UploadCloud } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FileManagerSidebarProps {
  activeRole: string;
  activeFilter: 'all' | 'images' | 'documents' | 'spreadsheets' | 'folders';
  setActiveFilter: (filter: 'all' | 'images' | 'documents' | 'spreadsheets' | 'folders') => void;
  onUploadClick: () => void;
}

export default function FileManagerSidebar({
  activeRole,
  activeFilter,
  setActiveFilter,
  onUploadClick
}: FileManagerSidebarProps) {
  return (
    <div className="w-64 bg-slate-900 text-slate-300 rounded-2xl flex flex-col shadow-2xl relative overflow-hidden shrink-0 border border-slate-800">
      <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-pu-blue/30 to-transparent pointer-events-none"></div>
      <div className="p-5 z-10">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-pu-blue drop-shadow-md" />
          PUPR Workspace
        </h2>
        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-mono">
          {activeRole.replace("_", " ")}
        </p>
      </div>

      <div className="px-3 flex-1 flex flex-col gap-1 z-10 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 mt-2">Filter Tampilan</p>
        <button 
          onClick={() => setActiveFilter('all')}
          className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all", activeFilter === 'all' ? "bg-pu-blue/20 text-blue-400" : "hover:bg-white/5 hover:text-slate-200")}
        >
          <Layers className="w-4 h-4" /> Semua Berkas
        </button>
        <button 
          onClick={() => setActiveFilter('folders')}
          className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all", activeFilter === 'folders' ? "bg-pu-blue/20 text-blue-400" : "hover:bg-white/5 hover:text-slate-200")}
        >
          <Folder className="w-4 h-4" /> Folder Proyek
        </button>
        <button 
          onClick={() => setActiveFilter('documents')}
          className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all", activeFilter === 'documents' ? "bg-pu-blue/20 text-blue-400" : "hover:bg-white/5 hover:text-slate-200")}
        >
          <FileText className="w-4 h-4" /> Dokumen & Laporan
        </button>
        <button 
          onClick={() => setActiveFilter('spreadsheets')}
          className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all", activeFilter === 'spreadsheets' ? "bg-pu-blue/20 text-blue-400" : "hover:bg-white/5 hover:text-slate-200")}
        >
          <FileSpreadsheet className="w-4 h-4" /> Tabel & RAB
        </button>
        <button 
          onClick={() => setActiveFilter('images')}
          className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all", activeFilter === 'images' ? "bg-pu-blue/20 text-blue-400" : "hover:bg-white/5 hover:text-slate-200")}
        >
          <ImageIcon className="w-4 h-4" /> Foto Dokumentasi
        </button>
      </div>

      <div className="p-4 z-10 mt-auto">
        <button 
          onClick={onUploadClick}
          className="w-full flex items-center justify-center gap-2 bg-pu-blue hover:bg-blue-600 text-white px-4 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-pu-blue/20 hover:scale-[1.02]"
        >
          <UploadCloud className="w-5 h-5" />
          Unggah Berkas Baru
        </button>
      </div>
    </div>
  );
}
