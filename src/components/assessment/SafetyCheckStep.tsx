import { motion } from "motion/react";
import { cn } from "../../lib/utils";
import { AlertCircle } from "lucide-react";

interface SafetyQuestion {
  id: string;
  label: string;
  question: string;
}

interface SafetyCheckStepProps {
  SAFETY_QUESTIONS: SafetyQuestion[];
  safetyChecks: Record<string, boolean>;
  setSafetyChecks: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  setIsDirty: (dirty: boolean) => void;
  setStep: (step: number) => void;
  hasCriticalDamage: boolean;
}

export default function SafetyCheckStep({
  SAFETY_QUESTIONS,
  safetyChecks,
  setSafetyChecks,
  setIsDirty,
  setStep,
  hasCriticalDamage
}: SafetyCheckStepProps) {
  const isTahap1Complete = SAFETY_QUESTIONS.every(q => safetyChecks[q.id] !== undefined);

  return (
    <motion.div 
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white/60 backdrop-blur-lg rounded-2xl border border-white/50 shadow-lg flex flex-col overflow-hidden"
    >
      <div className="bg-white/40 backdrop-blur-sm px-6 py-4 border-b border-white/30">
        <h3 className="text-sm font-bold text-slate-800">TAHAP 1: CEK KESELAMATAN VISUAL</h3>
        <p className="mt-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pertanyaan fundamental terkait keselamatan struktur</p>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="bg-red-50/70 backdrop-blur-sm p-4 rounded-xl border border-red-200/50 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-red-800 uppercase tracking-widest">Penting</h4>
              <p className="text-xs text-red-700/80 mt-1 font-medium">Jika Anda menjawab "Ya" pada salah satu indikasi bahaya di bawah ini, proses akan langsung disimpulkan sebagai "Rusak Berat" karena bangunan membahayakan keselamatan.</p>
            </div>
          </div>
        </div>

        {SAFETY_QUESTIONS.map((q) => (
          <div key={q.id} className="bg-white/40 p-4 rounded-xl border border-white/50 shadow-sm flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-800">{q.label}</h4>
              <p className="text-xs text-slate-600 mt-1">{q.question}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setIsDirty(true);
                  setSafetyChecks(prev => ({...prev, [q.id]: true}));
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all border",
                  safetyChecks[q.id] === true 
                    ? "bg-red-500 text-white border-red-600 shadow-md" 
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                Ya
              </button>
              <button 
                onClick={() => {
                  setIsDirty(true);
                  setSafetyChecks(prev => ({...prev, [q.id]: false}));
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold transition-all border",
                  safetyChecks[q.id] === false 
                    ? "bg-green-500 text-white border-green-600 shadow-md" 
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                Tidak
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between items-center p-6 border-t border-white/30 bg-white/20 backdrop-blur-sm">
        <button onClick={() => setStep(1)} className="inline-flex items-center px-4 py-2.5 text-sm font-bold rounded-xl text-slate-600 bg-white/50 backdrop-blur-sm border border-white/50 shadow-sm hover:bg-white/80 transition-all hover:scale-105 active:scale-95">
          Kembali
        </button>
        <button 
          onClick={() => setStep(hasCriticalDamage ? 4 : 3)} 
          disabled={!isTahap1Complete}
          className={cn(
            "inline-flex items-center px-6 py-2.5 text-sm font-bold rounded-xl shadow-md transition-all",
            isTahap1Complete 
              ? "text-pu-blue bg-pu-yellow hover:bg-yellow-400 hover:scale-105 active:scale-95" 
              : "text-slate-400 bg-slate-200 cursor-not-allowed"
          )}
        >
          {hasCriticalDamage ? "Lihat Kesimpulan" : "Lanjut ke Penilaian Detail"}
        </button>
      </div>
    </motion.div>
  );
}
