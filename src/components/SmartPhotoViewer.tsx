import { apiFetch } from "../lib/api";
import React, { useState } from 'react';
import { cn } from '../lib/utils';
import { 
  RotateCw, Layers, Sparkles, Activity, Ruler, Grid, X, Check, Loader2, Info, CheckCircle, AlertTriangle
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
  findings?: Finding[];
  aiSummary?: string;
  aiRecommendations?: string[];
  aiComplianceStatus?: string;
  aiConfidenceScore?: number;
  onApplyAiRecommendation?: (resultText: string) => void;
}

export default function SmartPhotoViewer({ 
  photoUrl, fileName, onClose, 
  findings = [], aiSummary = "", aiRecommendations = [], aiComplianceStatus = "", aiConfidenceScore = 0,
  onApplyAiRecommendation
}: SmartPhotoViewerProps) {
  const [previewRotation, setPreviewRotation] = useState(0);
  const [imageFilter, setImageFilter] = useState<'normal' | 'grayscale' | 'contrast' | 'thermal' | 'edge' | 'lowlight'>('normal');
  const [showGrid, setShowGrid] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<{ x: number, y: number }[]>([]);
  const [pixelToMmScale, setPixelToMmScale] = useState(0.2); 
  const [hoveredFinding, setHoveredFinding] = useState<number | null>(null);
  const [showAiBoxes, setShowAiBoxes] = useState(true);

  const [internalFindings, setInternalFindings] = useState<Finding[]>(findings);
  const [internalSummary, setInternalSummary] = useState(aiSummary);
  const [internalRecs, setInternalRecs] = useState<string[]>(aiRecommendations);
  const [internalCompliance, setInternalCompliance] = useState(aiComplianceStatus);
  const [internalConfidence, setInternalConfidence] = useState(aiConfidenceScore);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(findings.length > 0 || aiSummary !== "");

  const analyzePhoto = async () => {
    setIsAnalyzing(true);
    try {
      let base64 = photoUrl;
      if (!photoUrl.startsWith('data:')) {
        const response = await fetch(photoUrl);
        const blob = await response.blob();
        base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const res = await apiFetch("/api/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: fileName,
          fileType: "image",
          imageBase64: base64
        })
      });
      const data = await res.json();
      
      if (data.findings) {
        const mappedFindings = data.findings.map((f: any, idx: number) => ({
          id: idx,
          label: `${f.element} - ${f.defect}`,
          type: f.severity === "Tinggi" ? "Kritis" : f.severity === "Sedang" ? "Sedang" : "Ringan",
          recommendation: f.remediation,
          x: f.box?.x || 10,
          y: f.box?.y || 10,
          w: f.box?.w || 30,
          h: f.box?.h || 30,
          confidence: data.confidenceScore || 85
        }));
        setInternalFindings(mappedFindings);
      }
      if (data.summary) setInternalSummary(data.summary);
      if (data.recommendations) setInternalRecs(data.recommendations);
      if (data.complianceStatus) setInternalCompliance(data.complianceStatus);
      if (data.confidenceScore) setInternalConfidence(data.confidenceScore);
      
      setShowAiBoxes(true);
      setShowAiPanel(true);
    } catch (error) {
      console.error("Failed to analyze photo", error);
      alert("Gagal melakukan analisis AI. Pastikan gambar dapat diakses.");
    } finally {
      setIsAnalyzing(false);
    }
  };

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
      <div className="w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-slate-200 flex flex-col h-[90vh] md:h-[85vh]">
        
        {/* Header Controls */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800/80 flex flex-wrap gap-2 items-center justify-between text-xs select-none shrink-0">
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

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Image Workspace */}
          <div className="flex-1 p-4 bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="relative inline-block select-none max-h-full max-w-full">
              <div 
                className="transition-transform duration-300 relative inline-block overflow-hidden rounded-lg shadow-2xl border border-slate-800"
                style={{ transform: `rotate(${previewRotation}deg)` }}
              >
                <img 
                  src={photoUrl} 
                  alt={fileName} 
                  referrerPolicy="no-referrer"
                  className={cn(
                    "max-h-[70vh] w-auto max-w-full object-contain transition-all duration-200",
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

                {showAiBoxes && internalFindings.map((finding) => {
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

          {/* Technical Controls & Findings Sidebar */}
          <div className="w-full md:w-80 lg:w-[380px] bg-slate-900 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col overflow-y-auto custom-scrollbar shrink-0">
            <div className="p-4 flex flex-col gap-5">
              
              <div className="flex flex-col gap-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alat Bantu Observasi</h4>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setPreviewRotation(r => (r + 90) % 360)} className="flex items-center justify-center p-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] font-medium transition-colors"><RotateCw className="w-3.5 h-3.5 mr-1.5"/> Putar</button>
                    <button onClick={() => setIsMeasuring(!isMeasuring)} className={cn("flex items-center justify-center p-2.5 rounded-lg text-[10px] font-medium transition-colors", isMeasuring ? "bg-red-600 hover:bg-red-500" : "bg-slate-800 hover:bg-slate-700")}><Ruler className="w-3.5 h-3.5 mr-1.5"/> Ukur Jarak</button>
                    <button onClick={() => setShowGrid(!showGrid)} className={cn("flex items-center justify-center p-2.5 rounded-lg text-[10px] font-medium transition-colors", showGrid ? "bg-emerald-600 hover:bg-emerald-500" : "bg-slate-800 hover:bg-slate-700")}><Grid className="w-3.5 h-3.5 mr-1.5"/> Grid Overlay</button>
                    <button onClick={() => setShowAiBoxes(!showAiBoxes)} className={cn("flex items-center justify-center p-2.5 rounded-lg text-[10px] font-medium transition-colors", showAiBoxes ? "bg-blue-600 hover:bg-blue-500" : "bg-slate-800 hover:bg-slate-700")}><Sparkles className="w-3.5 h-3.5 mr-1.5"/> AI Boxes</button>
                </div>
                <select value={imageFilter} onChange={(e) => setImageFilter(e.target.value as any)} className="w-full bg-slate-800 p-2.5 mt-1 text-[11px] font-medium rounded-lg border border-slate-700 outline-none focus:border-indigo-500 transition-colors cursor-pointer">
                    {filterOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-2 flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI Analysis & Temuan</h4>
                  {(!internalSummary && internalFindings.length === 0) && (
                    <button 
                      onClick={analyzePhoto} 
                      disabled={isAnalyzing}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-2.5 py-1.5 rounded-md text-[10px] flex items-center gap-1.5 font-bold transition-colors disabled:opacity-50"
                    >
                      {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {isAnalyzing ? "Menganalisis..." : "Analisis dengan AI"}
                    </button>
                  )}
                </div>
                
                <div className="flex flex-col gap-3">
              {internalSummary && (
                <div className="p-2 rounded bg-indigo-900/30 border border-indigo-800 text-[10px] mb-2 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-indigo-300">Ringkasan AI</span>
                    <span className="bg-indigo-800 text-indigo-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                      Keyakinan: {internalConfidence}%
                    </span>
                  </div>
                  <p className="text-indigo-200 leading-relaxed">{internalSummary}</p>
                  
                  {internalCompliance && (
                    <div className="flex items-center gap-1.5 mt-2 text-indigo-300 font-bold">
                      <Activity className="w-3.5 h-3.5" /> 
                      Status: {internalCompliance}
                    </div>
                  )}

                  {internalRecs.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-indigo-800/50">
                      <span className="font-bold text-indigo-300 mb-1 block">Rekomendasi Utama:</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-indigo-200">
                        {internalRecs.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {internalFindings.length > 0 && (
                <div className="space-y-1.5">
                  {internalFindings.map((finding) => (
                    <div key={`finding-list-${finding.id}`} onMouseEnter={() => setHoveredFinding(finding.id)} onMouseLeave={() => setHoveredFinding(null)} className={cn("p-2 rounded bg-slate-800/50 border border-slate-700 text-[10px] transition-colors cursor-pointer", hoveredFinding === finding.id && "bg-slate-700/80 border-slate-500")}>
                        <div className="flex justify-between">
                          <span className={cn("font-bold", finding.type === 'Kritis' ? 'text-red-400' : finding.type === 'Sedang' ? 'text-amber-400' : 'text-blue-400')}>{finding.label}</span>
                          <span className="bg-slate-900 px-1 rounded">{finding.type}</span>
                        </div>
                        <p className="text-slate-400 mt-1">Saran: {finding.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}
              {(!internalSummary && internalFindings.length === 0 && !isAnalyzing) && (
                <div className="text-[11px] text-slate-500 italic p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 text-center mt-2">
                  Belum ada data analisis AI. Klik "Analisis dengan AI" untuk memulai pemindaian elemen bangunan.
                </div>
              )}

              {onApplyAiRecommendation && internalSummary && (
                <button 
                  onClick={() => {
                    const compiledText = `[AI Analysis] Skor Keyakinan: ${internalConfidence}%\nStatus: ${internalCompliance}\nRingkasan: ${internalSummary}\n\nRekomendasi:\n${internalRecs.map(r => "- " + r).join("\n")}`;
                    onApplyAiRecommendation(compiledText);
                    onClose();
                  }}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white p-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20 active:scale-95 cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  Terapkan Hasil ke Verifikasi
                </button>
              )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
