import React from 'react';
import { motion } from 'motion/react';
import { Printer, Save } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FinalReviewStepProps {
  calculateFinalResult: () => { category: string; totalDamagePercentage: number; [key: string]: any };
  schoolName: string;
  buildingName: string;
  getParamLabel: (id: string, defaultLabel: string) => string;
  npsn: string;
  floorCount: number;
  buildingArea: string | number;
  hasCriticalDamage: boolean;
  setStep: (step: number) => void;
  handleSubmit: () => void;
  submitting: boolean;
}

export default function FinalReviewStep({
  calculateFinalResult,
  schoolName,
  buildingName,
  getParamLabel,
  npsn,
  floorCount,
  buildingArea,
  hasCriticalDamage,
  setStep,
  handleSubmit,
  submitting
}: FinalReviewStepProps) {
  const result = calculateFinalResult();
  
  return (
<motion.div 
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg flex flex-col overflow-hidden"
          >
             <div className="bg-white/40 backdrop-blur-sm px-6 py-4 border-b border-white/30">
              <h3 className="text-sm font-bold text-slate-800">RINGKASAN PENILAIAN</h3>
            </div>
            
            <div className="p-12 flex flex-col items-center relative">
              
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">{schoolName}</h2>
                <p className="text-slate-600 font-medium text-lg">{buildingName}</p>
                
                <div className="mt-4 inline-flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span className="bg-slate-100 px-3 py-1 rounded-full">{getParamLabel("npsn", "NPSN")}: {npsn || '-'}</span>
                  <span className="bg-slate-100 px-3 py-1 rounded-full">Lantai: {floorCount}</span>
                  <span className="bg-slate-100 px-3 py-1 rounded-full">Luas: {buildingArea} m²</span>
                </div>
              </div>

              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className={cn(
                  "w-56 h-56 rounded-full flex flex-col items-center justify-center border-[16px] mb-8 shadow-inner backdrop-blur-md",
                  result.category === 'Ringan' ? 'border-green-400/30 bg-green-50/50 text-garut-green' :
                  result.category === 'Sedang' ? 'border-yellow-400/30 bg-yellow-50/50 text-yellow-700' :
                  'border-orange-400/30 bg-orange-50/50 text-garut-orange'
                )}>
                  <span className="text-6xl font-extrabold font-mono tracking-tighter drop-shadow-sm">{result.totalDamagePercentage.toFixed(1)}<span className="text-3xl">%</span></span>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className={cn(
                    "px-8 py-3 rounded-full uppercase text-sm font-bold tracking-widest shadow-md",
                    result.category === 'Ringan' ? 'bg-garut-green text-white' :
                    result.category === 'Sedang' ? 'bg-pu-yellow text-pu-blue' :
                    'bg-garut-orange text-white'
                  )}>
                  Rusak {result.category}
                </motion.div>
              </div>

              <div className="flex justify-between items-center p-6 border-t border-white/30 bg-white/20 backdrop-blur-sm print:hidden">
                <button onClick={() => setStep(hasCriticalDamage ? 2 : 3)} className="inline-flex items-center px-4 py-2.5 text-sm font-bold rounded-xl text-slate-600 bg-white/50 backdrop-blur-sm border border-white/50 shadow-sm hover:bg-white/80 transition-all hover:scale-105 active:scale-95">
                  Ubah Penilaian
                </button>
                <div className="flex gap-3">
                  <button onClick={() => window.print()} className="inline-flex items-center px-4 py-3 text-sm font-bold rounded-xl shadow-md text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95">
                    <Printer className="mr-2 h-5 w-5" />
                    Cetak PDF
                  </button>
                  <button onClick={handleSubmit} disabled={submitting} className="inline-flex items-center px-8 py-3 text-sm font-bold rounded-xl shadow-md text-white bg-garut-green hover:bg-green-600 disabled:opacity-50 transition-all hover:scale-105 active:scale-95">
                    <Save className="mr-2 h-5 w-5" />
                    {submitting ? "Menyimpan..." : "Simpan Laporan"}
                  </button>
                </div>
              </div>
            </motion.div>
  );
}
