import React from 'react';
import { motion } from 'motion/react';
import { FileTextIcon, Loader2, CheckCircle, Printer, Send } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DocumentGenerationStepProps {
  isLetterGenerated: boolean;
  isGeneratingLetter: boolean;
  generatedDocLink: string | null;
  handleGenerateLetter: () => void;
  handleSubmit: () => void;
  submitting: boolean;
  setStep: (step: number) => void;
  hasCriticalDamage: boolean;
}

export default function DocumentGenerationStep({
  isLetterGenerated,
  isGeneratingLetter,
  generatedDocLink,
  handleGenerateLetter,
  handleSubmit,
  submitting,
  setStep,
  hasCriticalDamage
}: DocumentGenerationStepProps) {
  return (
<motion.div 
            key="step3-permohonan"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg flex flex-col overflow-hidden"
          >
            <div className="bg-white/40 backdrop-blur-sm px-6 py-4 border-b border-white/30">
              <h3 className="text-sm font-bold text-slate-800">TAHAP 3: GENERATE SURAT PERMOHONAN RESMI KEDINASAN</h3>
              <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sistem menyusun surat permohonan dinas secara otomatis sesuai standar</p>
            </div>
            
            <div className="p-6 space-y-6">
              {!isLetterGenerated ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white/40 rounded-xl border border-dashed border-slate-300">
                  <FileTextIcon className="w-16 h-16 text-slate-400 mb-4 stroke-[1.5]" />
                  <h4 className="text-base font-bold text-slate-800">Belum Ada Surat yang Digenerate</h4>
                  <p className="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
                    Sesuai aturan kedinasan, Anda wajib membuat surat permohonan resmi terlebih dahulu sebelum dapat melanjutkan ke tahap ringkasan dan pengiriman.
                  </p>
                  
                  <button
                    onClick={handleGenerateLetter}
                    disabled={isGeneratingLetter}
                    className="mt-6 inline-flex items-center px-6 py-3 text-sm font-bold rounded-xl shadow-md text-white bg-pu-blue hover:bg-blue-700 disabled:opacity-50 transition-all hover:scale-105"
                  >
                    {isGeneratingLetter ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Menggenerasi Surat Resmi...
                      </>
                    ) : (
                      "✨ Generate Surat Permohonan Otomatis"
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">Surat Permohonan Berhasil Digenerate!</p>
                      <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-relaxed">
                        Surat permohonan resmi kedinasan telah berhasil digenerate otomatis berdasarkan data isian Anda. Silakan buka editor dokumen di bawah ini (jika ada perubahan/tambahan) sebelum dikirim.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (generatedDocLink) window.open(generatedDocLink, "_blank");
                      }}
                      className="inline-flex items-center px-4 py-2.5 text-xs font-bold rounded-xl text-pu-blue bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-all shadow-sm"
                    >
                      <FileTextIcon className="w-4 h-4 mr-2" />
                      Buka Editor Surat (Google Docs)
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center p-6 border-t border-white/30 bg-white/20">
              <button onClick={() => setStep(hasCriticalDamage ? 2 : 3)} className="inline-flex items-center px-4 py-2.5 text-sm font-bold rounded-xl text-slate-600 bg-white/50 border border-white/50 hover:bg-white/80 transition-all">
                Kembali
              </button>
              
              <div className="flex gap-2">
                {isLetterGenerated && (
                  <button 
                    onClick={() => {
                      window.print();
                    }} 
                    className="inline-flex items-center px-4 py-2.5 text-sm font-bold rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    <Printer className="w-4 h-4 mr-2" />
                    Cetak Surat
                  </button>
                )}
                <button 
                  onClick={handleSubmit} 
                  disabled={!isLetterGenerated || submitting}
                  className={cn(
                    "inline-flex items-center px-6 py-2.5 text-sm font-bold rounded-xl shadow-md transition-all",
                    (!isLetterGenerated || submitting)
                      ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-300/30" 
                      : "text-white bg-garut-green hover:bg-green-600 hover:scale-105 active:scale-95 animate-pulse"
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Kirim Permohonan Resmi
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
  );
}
