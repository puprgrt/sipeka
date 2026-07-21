import { apiFetch } from "../lib/api";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Activity, Cpu, Map, CheckCircle2, HardDrive } from "lucide-react";

interface StatusStep {
  message: string;
  icon: any;
  progressRange: [number, number];
}

const STATUS_STEPS: StatusStep[] = [
  { message: "Menginisialisasi modul keamanan enkripsi...", icon: Shield, progressRange: [0, 20] },
  { message: "Menghubungkan ke secure gate server...", icon: Cpu, progressRange: [21, 45] },
  { message: "Sinkronisasi basis data luring (IndexedDB)...", icon: HardDrive, progressRange: [46, 70] },
  { message: "Memuat parameter survei visual & katalog...", icon: Map, progressRange: [71, 90] },
  { message: "Sesi terverifikasi! Membuka dasbor...", icon: CheckCircle2, progressRange: [91, 100] }
];

export default function LoadingSplash() {
  const [progress, setProgress] = useState(0);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [appSettings, setAppSettings] = useState<{logoKiri: string, logoKanan: string}>({
    logoKiri: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Coat_of_arms_of_Garut_Regency.svg",
    logoKanan: "https://upload.wikimedia.org/wikipedia/commons/0/06/Logo_PUPR.png"
  });

  useEffect(() => {
    apiFetch("/api/app-settings")
      .then(res => res.json())
      .then(data => {
        if (data && data.logoKiri && data.logoKanan) {
          setAppSettings(data);
        }
      })
      .catch(err => console.error("Error fetching app settings in splash:", err));
  }, []);

  // Smooth progress increment
  useEffect(() => {
    const totalDuration = 2200; // 2.2 seconds total animation
    const intervalTime = 40;
    const steps = totalDuration / intervalTime;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // Update status step based on current progress
  useEffect(() => {
    const matchedIdx = STATUS_STEPS.findIndex(
      (step) => progress >= step.progressRange[0] && progress <= step.progressRange[1]
    );
    if (matchedIdx !== -1) {
      setCurrentStepIdx(matchedIdx);
    }
  }, [progress]);

  const currentStep = STATUS_STEPS[currentStepIdx] || STATUS_STEPS[STATUS_STEPS.length - 1];
  const CurrentIcon = currentStep.icon;

  return (
    <div className="fixed inset-0 w-full h-full bg-slate-950 flex flex-col items-center justify-center font-sans z-[9999] overflow-hidden select-none">
      
      {/* Background Cinematic Atmosphere */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Animated Radial Ambient Glows */}
        <motion.div 
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-blue-500/15 blur-[120px]"
        />
        <motion.div 
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -bottom-1/4 right-1/4 w-[700px] h-[700px] rounded-full bg-amber-500/10 blur-[130px]"
        />
        
        {/* Cyber Grid Overlay */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]"
          style={{ maskImage: "radial-gradient(circle, black 40%, transparent 80%)", WebkitMaskImage: "radial-gradient(circle, black 40%, transparent 80%)" }}
        />
      </div>

      {/* Main Content Card Container */}
      <div className="flex flex-col items-center max-w-lg px-6 text-center z-10 relative">
        
        {/* Double Logo Branding Area */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative flex items-center justify-center gap-6 mb-8"
        >
          {/* Animated Orbiting Ring behind Logos */}
          <div className="absolute w-32 h-32 rounded-full border border-dashed border-white/10 animate-[spin_40s_linear_infinite]" />
          <div className="absolute w-36 h-36 rounded-full border border-blue-500/5 animate-[spin_20s_linear_infinite_reverse]" />

          {/* Garut Regency Emblem */}
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 bg-slate-900/60 p-4 rounded-2xl border border-white/5 shadow-xl backdrop-blur-md"
          >
            <img 
              src={appSettings.logoKiri} 
              alt="Logo Kiri" 
              className="w-14 h-14 object-contain filter drop-shadow-[0_4px_12px_rgba(30,58,138,0.3)]"
            />
          </motion.div>

          {/* Connecting Pulse Line */}
          <div className="w-4 h-[1px] bg-gradient-to-r from-blue-500/30 to-amber-500/30" />

          {/* PUPR Ministry Emblem */}
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="relative z-10 bg-slate-900/60 p-4 rounded-2xl border border-white/5 shadow-xl backdrop-blur-md"
          >
            <img 
              src={appSettings.logoKanan} 
              alt="Logo Kanan" 
              className="w-14 h-14 object-contain filter drop-shadow-[0_4px_12px_rgba(180,83,9,0.3)]"
            />
          </motion.div>
        </motion.div>

        {/* Text Titles */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-1.5 mb-10"
        >
          <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">
            SI-PEKA
          </h1>
          <p className="text-xs font-extrabold tracking-[0.2em] text-amber-400 uppercase font-mono">
            Sistem Penilaian Kerusakan Bangunan
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Kabupaten Garut • Dinas PUPR</p>
          </div>
        </motion.div>

        {/* Modern Interactive Progress Bar */}
        <div className="w-72 bg-slate-900/80 border border-white/5 rounded-full h-2 p-0.5 overflow-hidden mb-6 relative">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-amber-500 rounded-full relative"
            style={{ width: `${progress}%` }}
            transition={{ ease: "easeOut" }}
          >
            {/* Soft end tip highlight */}
            <div className="absolute right-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_8px_#fff]" />
          </motion.div>
        </div>

        {/* Dynamic Status Log Transition */}
        <div className="h-12 flex flex-col items-center justify-center mb-8 w-80">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIdx}
              initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, filter: "blur(2px)" }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-2.5 bg-white/5 px-4 py-2 rounded-full border border-white/5 backdrop-blur-sm"
            >
              {CurrentIcon && <CurrentIcon className="w-4 h-4 text-amber-400 shrink-0" />}
              <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">{currentStep.message}</span>
              <span className="text-[10px] font-mono text-slate-500 font-bold ml-1">{Math.round(progress)}%</span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Tech Monospace Footer/Telemetry */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="flex items-center justify-center gap-4 text-[9px] font-mono text-slate-400 border-t border-white/5 pt-4 w-72"
        >
          <span>SYS_V1.0</span>
          <span>•</span>
          <span>HTTPS_SSL</span>
          <span>•</span>
          <span>GARUT_NODE_OK</span>
        </motion.div>

      </div>
    </div>
  );
}
