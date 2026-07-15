import React from "react";
import { RotateCw, Layers, Activity, Ruler, Grid, Sparkles } from "lucide-react";
import { cn } from "../../lib/utils";

interface ImagePreviewProps {
  selectedFile: any;
  previewRotation: number;
  setPreviewRotation: React.Dispatch<React.SetStateAction<number>>;
  imageFilter: string;
  setImageFilter: (val: string) => void;
  pixelToMmScale: number;
  setPixelToMmScale: (val: number) => void;
  isMeasuring: boolean;
  setIsMeasuring: (val: boolean) => void;
  measurePoints: any[];
  setMeasurePoints: React.Dispatch<React.SetStateAction<any[]>>;
  showGrid: boolean;
  setShowGrid: (val: boolean) => void;
  showAiBoxes: boolean;
  setShowAiBoxes: (val: boolean) => void;
  hoveredFinding: number | null;
  setHoveredFinding: (val: number | null) => void;
  calculateDistance: () => string;
}

export default function ImagePreview({
  selectedFile,
  previewRotation,
  setPreviewRotation,
  imageFilter,
  setImageFilter,
  pixelToMmScale,
  setPixelToMmScale,
  isMeasuring,
  setIsMeasuring,
  measurePoints,
  setMeasurePoints,
  showGrid,
  setShowGrid,
  showAiBoxes,
  setShowAiBoxes,
  hoveredFinding,
  setHoveredFinding,
  calculateDistance
}: ImagePreviewProps) {
  return (
    <div className="w-full h-full flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl text-slate-200">
      {/* Header Controls */}
      <div className="px-4 py-3 bg-slate-950 border-b border-slate-800/80 flex flex-wrap gap-2 items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-wide uppercase text-[9px] bg-emerald-600 px-2 py-0.5 rounded text-white shrink-0 font-sans">
            Smart Inspect AI
          </span>
          <span className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]" title={selectedFile.name}>
            {selectedFile.name}
          </span>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          {/* Scale Calibration Factor */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
            <span className="text-[9px] text-slate-400">Kalibrasi:</span>
            <select
              value={pixelToMmScale}
              onChange={(e) => {
                setPixelToMmScale(parseFloat(e.target.value));
                setMeasurePoints([]);
              }}
              className="bg-transparent text-[10px] text-emerald-400 border-0 p-0 focus:ring-0 cursor-pointer font-mono outline-none"
            >
              <option value="0.1" className="bg-slate-900 text-slate-200">1% = 1.0 mm (Mikro)</option>
              <option value="0.2" className="bg-slate-900 text-slate-200">1% = 2.0 mm (Semen Dedikasi)</option>
              <option value="0.5" className="bg-slate-900 text-slate-200">1% = 5.0 mm (Balok Kolom)</option>
              <option value="1.0" className="bg-slate-900 text-slate-200">1% = 10.0 mm (Dinding Luar)</option>
            </select>
          </div>

          {/* Rotation Button */}
          <button 
            onClick={() => setPreviewRotation(r => (r + 90) % 360)}
            className="flex items-center justify-center p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded transition-colors"
            title="Putar foto 90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {/* Filter Select Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select 
              value={imageFilter}
              onChange={(e) => setImageFilter(e.target.value)}
              className="text-[10px] bg-transparent border-0 p-0 text-slate-200 font-sans focus:outline-none focus:ring-0 cursor-pointer outline-none"
            >
              <option value="normal" className="bg-slate-900 text-slate-200">Asli / Orisinal</option>
              <option value="grayscale" className="bg-slate-900 text-slate-200">Contrast Crack Boost</option>
              <option value="contrast" className="bg-slate-900 text-slate-200">Crushed shadow (Defect)</option>
              <option value="thermal" className="bg-slate-900 text-slate-200">Inframerah (Moisture Scan)</option>
              <option value="edge" className="bg-slate-900 text-slate-200">Edge Sketch CAD (Tepi)</option>
              <option value="lowlight" className="bg-slate-900 text-slate-200">Low-Light Enhance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Image Workspace */}
      <div className="flex-1 p-4 bg-slate-950 flex flex-col items-center justify-center relative min-h-[320px] max-h-[380px] overflow-hidden">
        <div className="relative inline-block select-none max-h-[340px] max-w-full">
          {/* Wrapper of the rotate function */}
          <div 
            className="transition-transform duration-300 relative inline-block overflow-hidden rounded-lg shadow-2xl border border-slate-800"
            style={{ transform: `rotate(${previewRotation}deg)` }}
          >
            <img 
              src={selectedFile.previewUrl || "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800"} 
              alt={selectedFile.name} 
              referrerPolicy="no-referrer"
              className={cn(
                "max-h-[300px] w-auto max-w-full object-contain transition-all duration-200",
                imageFilter === 'grayscale' && "grayscale contrast-[2.8] brightness-[1.05] saturate-[1.6]",
                imageFilter === 'contrast' && "contrast-[3.2] brightness-[0.8] saturate-50",
                imageFilter === 'thermal' && "hue-rotate-[145deg] saturate-[3] brightness-[1.1] contrast-[1.4]",
                imageFilter === 'edge' && "invert contrast-[4.5] brightness-[1.15] saturate-0",
                imageFilter === 'lowlight' && "brightness-[1.65] contrast-[1.2] saturate-[1.35]"
              )}
            />

            {/* Interactive Overlay Layer inside the rotated div so bounding boxes and measuring line rotate with the image! */}
            <svg 
              className={cn(
                "absolute inset-0 w-full h-full select-none z-10",
                isMeasuring ? "cursor-crosshair pointer-events-auto" : "cursor-default pointer-events-auto"
              )}
              onClick={(e) => {
                if (!isMeasuring) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                
                if (measurePoints.length >= 2) {
                  setMeasurePoints([{ x, y }]);
                } else {
                  setMeasurePoints(prev => [...prev, { x, y }]);
                }
              }}
            >
              {/* Grid Layout Overlay */}
              {showGrid && (
                <>
                  {Array.from({ length: 9 }).map((_, i) => (
                    <line key={`v-${i}`} x1={`${(i + 1) * 10}%`} y1="0" x2={`${(i + 1) * 10}%`} y2="100%" stroke="rgba(16, 185, 129, 0.25)" strokeWidth="1" strokeDasharray="3,3" />
                  ))}
                  {Array.from({ length: 9 }).map((_, i) => (
                    <line key={`h-${i}`} x1="0" y1={`${(i + 1) * 10}%`} x2="100%" y2={`${(i + 1) * 10}%`} stroke="rgba(16, 185, 129, 0.25)" strokeWidth="1" strokeDasharray="3,3" />
                  ))}
                </>
              )}

              {/* Bounding Boxes / Findings Overlay */}
              {showAiBoxes && (selectedFile.name === "Foto_Kerusakan_Atap.jpg" ? [
                { id: 0, x: 25, y: 35, w: 22, h: 28, label: "Plafon Lapuk / Rembesan Air", confidence: 94.5, type: "Kritis" },
                { id: 1, x: 60, y: 20, w: 25, h: 18, label: "Retakan Struktur Rangka", confidence: 88.2, type: "Sedang" },
                { id: 2, x: 45, y: 65, w: 18, h: 22, label: "Korosi Penyangga Logam", confidence: 72.1, type: "Ringan" }
              ] : [
                { id: 0, x: 35, y: 25, w: 32, h: 48, label: "Retakan Struktur / Defek Visual", confidence: 91.0, type: "Kritis" }
              ]).map((finding) => {
                const isHovered = hoveredFinding === finding.id;
                const isCritical = finding.type === "Kritis";
                const isMedium = finding.type === "Sedang";
                const color = isCritical ? "#ef4444" : isMedium ? "#f59e0b" : "#3b82f6";
                return (
                  <g key={finding.id}>
                    {/* Dynamic animated rectangle box */}
                    <rect 
                      x={`${finding.x}%`} 
                      y={`${finding.y}%`} 
                      width={`${finding.w}%`} 
                      height={`${finding.h}%`} 
                      fill={isHovered ? "rgba(255, 255, 255, 0.05)" : "none"} 
                      stroke={color} 
                      strokeWidth={isHovered ? "3" : "1.5"}
                      strokeDasharray={isHovered ? "none" : "3,3"}
                      className="transition-all duration-150 cursor-pointer"
                      onMouseEnter={() => setHoveredFinding(finding.id)}
                      onMouseLeave={() => setHoveredFinding(null)}
                    />
                    {/* Label Tag on Box */}
                    <foreignObject
                      x={`${finding.x}%`}
                      y={`${Math.max(0, finding.y - 7.5)}%`}
                      width="160"
                      height="28"
                      className="overflow-visible"
                    >
                      <div 
                        className={cn(
                          "text-[8px] font-bold px-1.5 py-0.5 rounded text-white shadow-md inline-flex items-center gap-1 transition-all pointer-events-none select-none whitespace-nowrap",
                          isCritical ? "bg-red-600" : isMedium ? "bg-amber-500" : "bg-blue-600"
                        )}
                        style={{ transform: isHovered ? "scale(1.1)" : "scale(1)" }}
                      >
                        <span>{finding.label}</span>
                        <span className="opacity-80">({finding.confidence}%)</span>
                      </div>
                    </foreignObject>
                  </g>
                );
              })}

              {/* Measurement points & drawing lines */}
              {measurePoints.map((pt, idx) => (
                <g key={`pt-${idx}`}>
                  <circle cx={`${pt.x}%`} cy={`${pt.y}%`} r="6" fill="#ef4444" stroke="white" strokeWidth="2" className="animate-ping" />
                  <circle cx={`${pt.x}%`} cy={`${pt.y}%`} r="4.5" fill="#ef4444" stroke="white" strokeWidth="1.5" />
                  <text x={`${pt.x + 2}%`} y={`${pt.y - 2}%`} fill="#ef4444" className="text-[9px] font-bold font-mono stroke-white stroke-[0.3px]">{idx === 0 ? "A" : "B"}</text>
                </g>
              ))}
              
              {measurePoints.length === 2 && (
                <g>
                  <line 
                    x1={`${measurePoints[0].x}%`} 
                    y1={`${measurePoints[0].y}%`} 
                    x2={`${measurePoints[1].x}%`} 
                    y2={`${measurePoints[1].y}%`} 
                    stroke="#ef4444" 
                    strokeWidth="2" 
                    strokeDasharray="4,4" 
                  />
                  <foreignObject
                    x={`${(measurePoints[0].x + measurePoints[1].x) / 2}%`}
                    y={`${(measurePoints[0].y + measurePoints[1].y) / 2}%`}
                    width="120"
                    height="24"
                    className="overflow-visible"
                  >
                    <div className="bg-red-600 text-white font-mono text-[8.5px] px-2 py-0.5 rounded font-bold shadow-xl transform -translate-x-1/2 -translate-y-full inline-block whitespace-nowrap">
                      📐 Celah: {calculateDistance()} mm
                    </div>
                  </foreignObject>
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* Filter/Status indicator */}
        <div className="absolute bottom-3 left-3 bg-slate-950/85 border border-slate-800/80 px-2 py-1 rounded text-[9.5px] text-slate-400 font-mono flex items-center gap-1.5 shadow select-none">
          <Activity className="w-3 h-3 text-emerald-500 animate-pulse" /> 
          <span className="uppercase text-slate-300">
            {imageFilter === 'normal' && "Original Filter"}
            {imageFilter === 'grayscale' && "Crack Details Enhancer Active"}
            {imageFilter === 'contrast' && "Shadow & Cavity Contrast Engaged"}
            {imageFilter === 'thermal' && "Simulated Thermal Heat Mapping"}
            {imageFilter === 'edge' && "Sobel Line Sketch CAD Draft"}
            {imageFilter === 'lowlight' && "Low-light Brightness Booster"}
          </span>
        </div>
      </div>

      {/* Technical Verification Workspace Controls & Findings */}
      <div className="p-3.5 bg-slate-900 border-t border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Left: Assistant Controls (5 cols) */}
        <div className="md:col-span-5 flex flex-col gap-2 border-r border-slate-800/80 pr-3">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Alat Bantu Verifikasi
          </h4>

          {/* Measuring Toggle */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => {
                setIsMeasuring(!isMeasuring);
                setMeasurePoints([]);
              }}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border",
                isMeasuring 
                  ? "bg-red-500/25 border-red-500/40 text-red-300 shadow" 
                  : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"
              )}
            >
              <span className="flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5" />
                Mode Ukur Celah (Ruler)
              </span>
              <span className={cn(
                "px-1.5 py-0.5 text-[8px] rounded uppercase font-bold",
                isMeasuring ? "bg-red-500 text-white" : "bg-slate-700 text-slate-400"
              )}>
                {isMeasuring ? "Aktif" : "Non-Aktif"}
              </span>
            </button>
            
            {isMeasuring && (
              <p className="text-[9px] text-red-400 leading-normal animate-pulse select-none px-1">
                💡 Klik 2 titik pada foto di atas untuk membuat visual garis ukur dan menghitung lebar keretakan (mm).
              </p>
            )}
          </div>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border",
              showGrid 
                ? "bg-emerald-500/20 border-emerald-500/35 text-emerald-300 shadow" 
                : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Grid className="w-3.5 h-3.5" />
              Grid Kelurusan Struktur
            </span>
            <span className={cn(
              "px-1.5 py-0.5 text-[8px] rounded uppercase font-bold",
              showGrid ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-400"
            )}>
              {showGrid ? "ON" : "OFF"}
            </span>
          </button>

          {/* AI Detection Toggle */}
          <button
            onClick={() => setShowAiBoxes(!showAiBoxes)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 border",
              showAiBoxes 
                ? "bg-blue-500/20 border-blue-500/35 text-blue-300 shadow" 
                : "bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800"
            )}
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Highlight Deteksi AI
            </span>
            <span className={cn(
              "px-1.5 py-0.5 text-[8px] rounded uppercase font-bold",
              showAiBoxes ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400"
            )}>
              {showAiBoxes ? "ON" : "OFF"}
            </span>
          </button>
          
          {measurePoints.length > 0 && (
            <button
              onClick={() => setMeasurePoints([])}
              className="text-right text-[10px] text-slate-500 hover:text-red-400 underline font-mono select-none"
            >
              Hapus Hasil Ukuran ({measurePoints.length} titik)
            </button>
          )}
        </div>

        {/* Right: Detected Findings List (7 cols) */}
        <div className="md:col-span-7 flex flex-col gap-2">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center">
            <span>Daftar Defek Terdeteksi</span>
            <span className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[8px]">
              {(selectedFile.name === "Foto_Kerusakan_Atap.jpg" ? 3 : 1)} Temuan
            </span>
          </h4>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar max-h-[140px]">
            {(selectedFile.name === "Foto_Kerusakan_Atap.jpg" ? [
              { id: 0, label: "Plafon Lapuk / Rembesan Air", confidence: 94.5, type: "Kritis", details: "Gypsum menghitam akibat infiltrasi air hujan berkelanjutan." },
              { id: 1, label: "Retakan Struktur Rangka", confidence: 88.2, type: "Sedang", details: "Retak rambut sepanjang sambungan balok sekunder." },
              { id: 2, label: "Korosi Penyangga Logam", confidence: 72.1, type: "Ringan", details: "Oksidasi ringan pada plat baja penyambung." }
            ] : [
              { id: 0, label: "Retakan Struktur / Defek Visual", confidence: 91.0, type: "Kritis", details: "Deteksi retak lentur pada penampang kolom utama (beton)." }
            ]).map(finding => {
              const isHovered = hoveredFinding === finding.id;
              const isCritical = finding.type === "Kritis";
              const isMedium = finding.type === "Sedang";
              return (
                <div 
                  key={finding.id}
                  onMouseEnter={() => setHoveredFinding(finding.id)}
                  onMouseLeave={() => setHoveredFinding(null)}
                  className={cn(
                    "p-2.5 rounded-lg border flex gap-3 transition-colors cursor-pointer",
                    isHovered ? "bg-slate-800 border-slate-600 shadow-md" : "bg-slate-900/50 border-slate-800/80"
                  )}
                >
                  <div className={cn(
                    "w-1 shrink-0 rounded-full",
                    isCritical ? "bg-red-500" : isMedium ? "bg-amber-500" : "bg-blue-500"
                  )}></div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h5 className="text-xs font-bold text-slate-200">{finding.label}</h5>
                      <span className={cn(
                        "text-[8px] px-1.5 py-0.5 rounded font-bold font-mono",
                        isCritical ? "bg-red-500/20 text-red-400" : isMedium ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"
                      )}>
                        {finding.confidence}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{finding.details}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
