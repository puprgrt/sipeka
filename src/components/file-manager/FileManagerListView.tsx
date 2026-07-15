import React from 'react';
import { Sparkles, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { FileItem } from '../../pages/FileManager';

interface FileManagerListViewProps {
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

export default function FileManagerListView({
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
}: FileManagerListViewProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200/50 bg-white/50 backdrop-blur-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200/60 bg-slate-50/50 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
            <th className="py-3.5 px-5 font-bold">Nama Berkas</th>
            <th className="py-3.5 px-5 font-bold">Ukuran</th>
            <th className="py-3.5 px-5 font-bold">Modifikasi</th>
            <th className="py-3.5 px-5 font-bold">Pemilik</th>
            <th className="py-3.5 px-5 font-bold text-right">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {currentFiles.map(file => {
              const isSelected = selectedFile?.id === file.id;
              return (
                <motion.tr
                  key={file.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => file.type === 'folder' ? (setCurrentFolder(file.id), setSelectedFile(null)) : handleSelectFile(file)}
                  className={cn(
                    "border-b border-slate-100/60 transition-all cursor-pointer group hover:bg-white",
                    isSelected ? "bg-pu-blue/5 shadow-inner" : ""
                  )}
                >
                  <td className="py-3 px-5 flex items-center gap-3">
                    {getFileIcon(file.type, "w-5 h-5 drop-shadow-sm")}
                    <span className={cn("text-xs font-bold transition-colors", isSelected ? "text-pu-blue" : "text-slate-700 group-hover:text-pu-blue")}>{file.name}</span>
                  </td>
                  <td className="py-3 px-5 text-[11px] text-slate-500 font-mono">
                    {file.type === 'folder' ? '--' : formatSize(file.size)}
                  </td>
                  <td className="py-3 px-5 text-[11px] text-slate-500">
                    {new Date(file.updatedAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="py-3 px-5 text-[11px] text-slate-500 font-medium">
                    {file.author}
                  </td>
                  <td className="py-3 px-5 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-end gap-1.5 select-none">
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
                          className="p-1.5 bg-white text-blue-600 hover:text-blue-800 rounded-md hover:bg-blue-50 border border-slate-200/50 shadow-sm transition-all hover:scale-110"
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
                        className="p-1.5 bg-white text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 border border-slate-200/50 shadow-sm transition-all hover:scale-110"
                        title="Hapus berkas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  );
}
