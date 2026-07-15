import React from 'react';
import { Eye, Sparkles, Trash2, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { FileItem } from '../../pages/FileManager';

interface FileManagerGridViewProps {
  currentFiles: FileItem[];
  selectedFile: FileItem | null;
  setCurrentFolder: (folder: string | null) => void;
  setSelectedFile: (file: FileItem | null) => void;
  handleSelectFile: (file: FileItem) => void;
  handleDeleteFile: (fileId: string) => void;
  setShowSmartModal: (show: boolean) => void;
  setAiAnalysisResult: (result: string | null) => void;
  setAiChatHistory: (history: any[]) => void;
  setIsDigitallySigned: (signed: boolean) => void;
  getFileIcon: (type: string, className?: string) => React.ReactNode;
  formatSize: (bytes?: number) => string;
}

export default function FileManagerGridView({
  currentFiles,
  selectedFile,
  setCurrentFolder,
  setSelectedFile,
  handleSelectFile,
  handleDeleteFile,
  setShowSmartModal,
  setAiAnalysisResult,
  setAiChatHistory,
  setIsDigitallySigned,
  getFileIcon,
  formatSize
}: FileManagerGridViewProps) {
  if (currentFiles.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
        <div className="p-4 bg-slate-100 rounded-full mb-3 shadow-inner">
          <Folder className="w-10 h-10 text-slate-300" />
        </div>
        <p className="text-xs font-semibold text-slate-500">Folder ini kosong atau Anda tidak memiliki akses.</p>
        <p className="text-[10px] text-slate-400 mt-1">Gunakan tombol Unggah atau Buat Folder Baru untuk mengisi konten.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <AnimatePresence>
        {currentFiles.map(file => {
          const isSelected = selectedFile?.id === file.id;
          return (
            <motion.div
              key={file.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => file.type === 'folder' ? (setCurrentFolder(file.id), setSelectedFile(null)) : handleSelectFile(file)}
              className={cn(
                "group relative flex flex-col items-center justify-center p-5 rounded-2xl cursor-pointer transition-all duration-300 border text-center select-none overflow-hidden",
                isSelected 
                  ? "bg-pu-blue/5 border-pu-blue/30 shadow-lg shadow-pu-blue/10 translate-y-[-4px] ring-1 ring-pu-blue/20" 
                  : "bg-white/70 hover:bg-white border-slate-200/60 hover:shadow-xl hover:shadow-pu-blue/5 hover:border-pu-blue/20 hover:translate-y-[-4px]"
              )}
            >
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-pu-blue/0 via-pu-blue/0 to-pu-blue/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              
              <div className="mb-4 relative z-10 transition-transform duration-300 group-hover:scale-110">
                {getFileIcon(file.type, "w-12 h-12 drop-shadow-sm")}
                {file.type !== 'folder' && (
                  <span className="absolute bottom-[-4px] right-[-4px] bg-white border border-slate-200 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
                    <Eye className="w-3 h-3 text-slate-400" />
                  </span>
                )}
              </div>
              <h3 className="text-xs font-bold text-slate-700 line-clamp-2 w-full break-all px-2 z-10 group-hover:text-pu-blue transition-colors">
                {file.name}
              </h3>
              <p className="text-[10px] text-slate-400 mt-1.5 font-mono z-10">
                {file.type === 'folder' ? 'Folder' : formatSize(file.size)}
              </p>

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 select-none z-20">
                {file.type !== 'folder' && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(file);
                      setShowSmartModal(true);
                      setAiAnalysisResult(null);
                      setAiChatHistory([]);
                      setIsDigitallySigned(false);
                    }}
                    className="p-1.5 bg-white hover:bg-blue-50 text-pu-blue rounded-lg shadow-sm border border-slate-200/50 hover:border-pu-blue/30 transition-all hover:scale-110"
                    title="Smart Preview (Modal Besar)"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                )}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(file.id);
                  }}
                  className="p-1.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg shadow-sm border border-slate-200/50 hover:border-red-200 transition-all hover:scale-110"
                  title="Hapus berkas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
