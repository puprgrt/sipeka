import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { 
  RotateCw, Layers, Sparkles, Activity, Ruler, Grid, X, Check
} from 'lucide-react';

interface Finding {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  confidence: number;
  type: "Kritis" | "Sedang" | "Ringan";
  recommendation: string;
}

interface SmartPhotoViewerProps {
  photoUrl: string;
  fileName: string;
  onClose: () => void;
  findings?: Finding[]; // Optional: can be passed from parent
}

export default function SmartPhotoViewer({ photoUrl, fileName, onClose, findings = [] }: SmartPhotoViewerProps) {
  const [previewRotation, setPreviewRotation] = useState(0);
  const [imageFilter, setImageFilter] = useState<'normal' | 'grayscale' | 'contrast' | 'thermal' | 'edge' | 'lowlight'>('normal');
  const [showGrid, setShowGrid] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<{ x: number, y: number }[]>([]);
  const [pixelToMmScale, setPixelToMmScale] = useState(0.2); 
  const [hoveredFinding, setHoveredFinding] = useState<number | null>(null);
  const [showAiBoxes, setShowAiBoxes] = useState(true);

  const filterOptions = [
    { label: "Asli / Orisinal", value: "normal" },
    { label: "Contrast Crack Boost", value: "contrast" },
    { label: "Crushed shadow (Defect)", value: "grayscale" },
    { label: "Inframerah (Moisture Scan)", value: "thermal" },
    { label: "Edge Sketch CAD (Tepi)", value: "edge" },
    { label: "Low-Light Enhance", value: "lowlight" }
  ];

  const calculateDistance = () => {
    if (measurePoints.length < 2) return "0.0";
    const dx = measurePoints[1].x - measurePoints[0].x;
    const dy = measurePoints[1].y - measurePoints[0].y;
    const percentDistance = Math.sqrt(dx * dx + dy * dy);
    return (percentDistance * pixelToMmScale * 10).toFixed(1);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-slate-200 flex flex-col max-h-[95vh]">
        
        {/* Header Controls */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800/80 flex flex-wrap gap-2 items-center justify-between text-xs select-none">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-wide uppercase text-[9px] bg-emerald-600 px-2 py-0.5 rounded text-white shrink-0 font-sans">
              Smart Inspect AI
            </span>
            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]" title={fileName}>
              {fileName}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Workspace */}
        <div className="flex-1 p-4 bg-slate-950 flex flex-col items-center justify-center relative min-h-[320px] max-h-[500px] overflow-hidden">
          <div className="relative inline-block select-none max-h-[480px] max-w-full">
            <div 
              className="transition-transform duration-300 relative inline-block overflow-hidden rounded-lg shadow-2xl border border-slate-800"
              style={{ transform: `rotate(${previewRotation}deg)` }}
            >
              <img 
                src={photoUrl} 
                alt={fileName} 
                referrerPolicy="no-referrer"
                className={cn(
                  "max-h-[450px] w-auto max-w-full object-contain transition-all duration-200",
                  imageFilter === 'grayscale' && "grayscale contrast-[2.8] brightness-[1.05] saturate-[1.6]",
                  imageFilter === 'contrast' && "contrast-[3.2] brightness-[0.8] saturate-50",
                  imageFilter === 'thermal' && "hue-rotate-[145deg] saturate-[3] brightness-[1.1] contrast-[1.4]",
                  imageFilter === 'edge' && "invert contrast-[4.5] brightness-[1.15] saturate-0",
                  imageFilter === 'lowlight' && "brightness-[1.65] contrast-[1.2] saturate-[1.35]"
                )}
              />

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

                {showAiBoxes && findings.map((finding) => {
                  const isHovered = hoveredFinding === finding.id;
                  const color = finding.type === "Kritis" ? "#ef4444" : finding.type === "Sedang" ? "#f59e0b" : "#3b82f6";
                  return (
                    <g key={`ai-box-${finding.id}`}>
                      <rect 
                        x={`${finding.x}%`} y={`${finding.y}%`} width={`${finding.w}%`} height={`${finding.h}%`} 
                        fill={isHovered ? "rgba(255, 255, 255, 0.05)" : "none"} 
                        stroke={color} strokeWidth={isHovered ? "3" : "1.5"}
                        className="transition-all duration-150 cursor-pointer"
                        onMouseEnter={() => setHoveredFinding(finding.id)}
                        onMouseLeave={() => setHoveredFinding(null)}
                      />
                    </g>
                  );
                })}

                {measurePoints.map((pt, idx) => (
                  <circle key={`pt-${idx}`} cx={`${pt.x}%`} cy={`${pt.y}%`} r="6" fill="#ef4444" stroke="white" strokeWidth="2" />
                ))}
                
                {measurePoints.length === 2 && (
                  <line 
                    x1={`${measurePoints[0].x}%`} y1={`${measurePoints[0].y}%`} 
                    x2={`${measurePoints[1].x}%`} y2={`${measurePoints[1].y}%`} 
                    stroke="#ef4444" strokeWidth="2" strokeDasharray="4,4" 
                  />
                )}
              </svg>
            </div>
          </div>
        </div>

        {/* Technical Controls & Findings */}
        <div className="p-3.5 bg-slate-900 border-t border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-5 flex flex-col gap-2 border-r border-slate-800/80 pr-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alat Bantu</h4>
            <div className="flex gap-2">
                <button onClick={() => setPreviewRotation(r => (r + 90) % 360)} className="flex-1 flex items-center justify-center p-2 bg-slate-800 hover:bg-slate-700 rounded text-[10px]"><RotateCw className="w-3 h-3 mr-1"/> Putar</button>
                <button onClick={() => setIsMeasuring(!isMeasuring)} className={cn("flex-1 flex items-center justify-center p-2 rounded text-[10px]", isMeasuring ? "bg-red-600" : "bg-slate-800 hover:bg-slate-700")}><Ruler className="w-3 h-3 mr-1"/> Ukur</button>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setShowGrid(!showGrid)} className={cn("flex-1 flex items-center justify-center p-2 rounded text-[10px]", showGrid ? "bg-emerald-600" : "bg-slate-800 hover:bg-slate-700")}><Grid className="w-3 h-3 mr-1"/> Grid</button>
                <button onClick={() => setShowAiBoxes(!showAiBoxes)} className={cn("flex-1 flex items-center justify-center p-2 rounded text-[10px]", showAiBoxes ? "bg-blue-600" : "bg-slate-800 hover:bg-slate-700")}><Sparkles className="w-3 h-3 mr-1"/> AI Boxes</button>
            </div>
            <select value={imageFilter} onChange={(e) => setImageFilter(e.target.value as any)} className="w-full bg-slate-800 p-2 text-[10px] rounded border border-slate-700">
                {filterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          <div className="md:col-span-7 flex flex-col gap-1.5">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Temuan</h4>
            <div className="space-y-1.5 max-h-[110px] overflow-y-auto custom-scrollbar">
              {findings.map((finding) => (
                <div key={`finding-list-${finding.id}`} onMouseEnter={() => setHoveredFinding(finding.id)} className="p-2 rounded bg-slate-800/50 border border-slate-700 text-[10px]">
                    <span className="font-bold text-slate-200">{finding.label}</span>
                    <p className="text-slate-400">Rekomendasi: {finding.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
