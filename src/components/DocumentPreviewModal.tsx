import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string | null;
  title?: string;
}

export default function DocumentPreviewModal({ isOpen, onClose, documentUrl, title = "Preview Dokumen" }: Props) {
  if (!documentUrl) return null;

  // Convert Google Docs link to preview link for embedding
  let previewUrl = documentUrl;
  if (documentUrl.includes('/edit')) {
    previewUrl = documentUrl.replace(/\/edit.*$/, '/preview');
  } else if (documentUrl.includes('/export')) {
    previewUrl = documentUrl.replace(/\/export.*$/, '/preview');
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-5xl h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">{title}</h3>
              <div className="flex items-center gap-3">
                <a 
                  href={documentUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs font-bold text-pu-blue hover:text-blue-800 px-3 py-1.5 bg-blue-50 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka di Tab Baru / Unduh
                </a>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2 sm:p-4">
              <iframe 
                src={previewUrl}
                className="w-full h-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white"
                title="Preview Surat"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
