import React from 'react';
import { HardDrive, Folder, ChevronLeft, Search, RefreshCw, Grid, List as ListIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { FileItem } from '../../pages/FileManager';

interface FileManagerToolbarProps {
  currentFolder: string | null;
  setCurrentFolder: React.Dispatch<React.SetStateAction<string | null>>;
  folderPath?: FileItem;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loadingFiles: boolean;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  onRefresh: () => void;
  setSelectedFile: (file: FileItem | null) => void;
}

export default function FileManagerToolbar({
  currentFolder,
  setCurrentFolder,
  folderPath,
  searchQuery,
  setSearchQuery,
  loadingFiles,
  viewMode,
  setViewMode,
  onRefresh,
  setSelectedFile
}: FileManagerToolbarProps) {
  return (
    <>
      {/* Header Dashboard Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/70 backdrop-blur-xl p-4 rounded-2xl border border-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pu-blue/10 rounded-lg text-pu-blue">
            <Folder className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              {currentFolder ? (folderPath?.name || "Folder Tersimpan") : "Root Directory"}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">Sistem Informasi SIPEKA</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-pu-blue transition-colors" />
            <input 
              type="text" 
              placeholder="Cari berkas..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-pu-blue focus:border-pu-blue w-full sm:w-64 shadow-sm transition-all focus:shadow-md"
            />
          </div>
        </div>
      </div>

      {/* Toolbar & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-white/40 backdrop-blur-md p-3 rounded-xl border border-white/50 shadow-sm gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600 w-full sm:w-auto">
          <button 
            onClick={() => {
              setCurrentFolder(null);
              setSelectedFile(null);
            }}
            className="hover:text-pu-blue transition-colors flex items-center gap-1.5 bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200/50 shadow-xs hover:shadow-sm"
          >
            <HardDrive className="w-3.5 h-3.5 text-slate-400" /> Root Directory
          </button>
          {folderPath && (
            <>
              <span className="text-slate-300 font-normal">/</span>
              <span className="text-pu-blue bg-pu-blue/10 px-3 py-1.5 rounded-lg border border-pu-blue/20 flex items-center gap-1.5 shadow-inner">
                <Folder className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                {folderPath.name}
              </span>
            </>
          )}
          {/* Folder Navigation */}
          {currentFolder && (
            <button 
              onClick={() => setCurrentFolder(null)}
              className="flex items-center text-xs font-bold text-pu-blue hover:text-blue-800 transition-colors bg-white/80 px-3 py-1.5 rounded-lg border border-blue-100 hover:shadow-sm"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Kembali
            </button>
          )}
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button 
            onClick={onRefresh} 
            className="flex items-center text-slate-500 hover:text-pu-blue bg-white/80 px-3 py-2 border border-slate-200/60 rounded-lg shadow-sm transition-all hover:shadow-md" title="Muat Ulang Tersinkronisasi Google Drive"
          >
            <RefreshCw className={cn("w-4 h-4", loadingFiles && "animate-spin text-pu-blue")} />
          </button>
          <div className="w-px h-6 bg-slate-200/60"></div>
          <div className="flex items-center gap-1 bg-white/60 p-1 rounded-lg border border-slate-200/50 shadow-inner">
            <button 
              onClick={() => setViewMode('grid')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-white shadow-sm text-pu-blue font-bold ring-1 ring-black/5" : "text-slate-400 hover:text-slate-600 hover:bg-white/50")}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white shadow-sm text-pu-blue font-bold ring-1 ring-black/5" : "text-slate-400 hover:text-slate-600 hover:bg-white/50")}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
