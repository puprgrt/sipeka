import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Type, Paintbrush, RotateCcw, Check, Sparkles, AlertCircle, Circle, Trash2 } from "lucide-react";
import { cn } from "../lib/utils";

interface PhotoAnnotatorProps {
  isOpen: boolean;
  photoUrl: string;
  onSave: (annotatedPhotoUrl: string) => void;
  onClose: () => void;
}

const BRUSH_COLORS = [
  { name: "Merah", value: "#EF4444" },
  { name: "Kuning", value: "#F59E0B" },
  { name: "Hijau", value: "#10B981" },
  { name: "Biru", value: "#3B82F6" },
  { name: "Hitam", value: "#1E293B" },
];

const BRUSH_SIZES = [
  { name: "Tipis", value: 3 },
  { name: "Sedang", value: 6 },
  { name: "Tebal", value: 12 },
];

export default function PhotoAnnotator({ isOpen, photoUrl, onSave, onClose }: PhotoAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [activeTool, setActiveTool] = useState<"draw" | "text">("draw");
  const [brushColor, setBrushColor] = useState("#EF4444"); // Red as default for highlighting damage
  const [brushSize, setBrushSize] = useState(6);
  const [textInput, setTextInput] = useState("");
  const [textStyle, setTextStyle] = useState<"badge" | "plain">("badge");
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  // Initialize and load image onto canvas
  useEffect(() => {
    if (!isOpen || !photoUrl) return;

    setImageLoaded(false);
    setHistory([]);
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      originalImageRef.current = img;
      initCanvas(img);
      setImageLoaded(true);
    };
    img.src = photoUrl;
  }, [isOpen, photoUrl]);

  const initCanvas = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas resolution to match the natural image dimension (to preserve quality)
    // Capped at a reasonable max size (e.g. 1600px width/height) to avoid performance lag
    const maxDimension = 1600;
    let width = img.naturalWidth || img.width;
    let height = img.naturalHeight || img.height;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    canvas.width = width;
    canvas.height = height;

    // Draw original image as background
    ctx.drawImage(img, 0, 0, width, height);

    // Save initial state to history
    setHistory([canvas.toDataURL("image/jpeg", 0.95)]);
  };

  const saveHistoryState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const currentState = canvas.toDataURL("image/jpeg", 0.95);
    setHistory(prev => [...prev, currentState]);
  };

  const undo = () => {
    if (history.length <= 1) return; // Cannot undo past initial state

    const newHistory = [...history];
    newHistory.pop(); // Remove current state
    const prevState = newHistory[newHistory.length - 1];

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      setHistory(newHistory);
    };
    img.src = prevState;
  };

  const reset = () => {
    if (!originalImageRef.current) return;
    initCanvas(originalImageRef.current);
  };

  // Coordinates mapping from screen CSS pixels to natural canvas pixels
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    
    let clientX = 0;
    let clientY = 0;

    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Freehand Drawing Event Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (activeTool !== "draw") return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = brushSize;

    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || activeTool !== "draw") return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveHistoryState();
    }
  };

  // Click on canvas for text or other tools
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== "text") return;
    if (!textInput.trim()) {
      alert("Ketik teks anotasi terlebih dahulu di panel samping!");
      return;
    }

    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const text = textInput.trim();
    
    // Calculate font size proportional to canvas width/height
    const fontSize = Math.max(16, Math.round(canvas.width * 0.035));
    ctx.font = `bold ${fontSize}px "Inter", system-ui, sans-serif`;
    
    const textWidth = ctx.measureText(text).width;
    const textHeight = fontSize;
    const padding = fontSize * 0.4;

    ctx.save();

    if (textStyle === "badge") {
      // Draw rounded background rectangle
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)"; // Slate-900 transparent
      const rx = coords.x - textWidth / 2 - padding;
      const ry = coords.y - textHeight / 2 - padding;
      const rw = textWidth + padding * 2;
      const rh = textHeight + padding * 2;
      const radius = padding * 0.8;

      ctx.beginPath();
      ctx.moveTo(rx + radius, ry);
      ctx.lineTo(rx + rw - radius, ry);
      ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
      ctx.lineTo(rx + rw, ry + rh - radius);
      ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
      ctx.lineTo(rx + radius, ry + rh);
      ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
      ctx.lineTo(rx, ry + radius);
      ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
      ctx.closePath();
      ctx.fill();

      // Write text centered
      ctx.fillStyle = brushColor === "#1E293B" ? "#FFFFFF" : brushColor; // Don't use dark grey text on dark gray bg
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, coords.x, coords.y + 1); // 1px offset tweak
    } else {
      // Plain text with contrast shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = brushColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, coords.x, coords.y);
    }

    ctx.restore();
    
    // Clear text input to prevent accidental multiple prints with same text
    setTextInput("");
    saveHistoryState();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/jpeg", 0.9));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 sm:p-4 bg-slate-900/80 backdrop-blur-md overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900 w-full h-full sm:h-auto sm:max-w-5xl sm:rounded-3xl border border-slate-800 shadow-2xl flex flex-col md:flex-row overflow-hidden relative"
          >
            {/* Header for Mobile */}
            <div className="md:hidden flex justify-between items-center px-4 py-3 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-pu-yellow animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-100">Anotasi Foto</span>
              </div>
              <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Canvas Main Workspace */}
            <div className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-4 relative min-h-0">
              {!imageLoaded ? (
                <div className="flex flex-col items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest py-10">
                  <span className="animate-spin text-pu-blue text-xl">⏳</span>
                  Memuat Gambar...
                </div>
              ) : (
                <div 
                  ref={containerRef}
                  className="relative w-full h-full flex items-center justify-center overflow-hidden max-h-[50vh] sm:max-h-[60vh] md:max-h-[70vh]"
                >
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    onClick={handleCanvasClick}
                    className={cn(
                      "max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-slate-800 bg-slate-900 touch-none",
                      activeTool === "draw" ? "cursor-crosshair" : "cursor-text"
                    )}
                  />
                  {activeTool === "text" && textInput.trim() && (
                    <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-700/50 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-300 flex items-center gap-1.5 pointer-events-none">
                      <AlertCircle className="w-3.5 h-3.5 text-pu-yellow animate-bounce" />
                      Klik pada foto untuk meletakkan teks "{textInput.trim()}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar Controls */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/90 p-5 flex flex-col justify-between shrink-0">
              <div className="space-y-5">
                {/* Desktop Header */}
                <div className="hidden md:flex justify-between items-center pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-pu-yellow text-slate-900 rounded-lg">
                      <Paintbrush className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">Anotasi Foto</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Dinas PUPR Kabupaten</p>
                    </div>
                  </div>
                  <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800/50 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Choose Mode */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Alat Anotasi</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTool("draw")}
                      className={cn(
                        "flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                        activeTool === "draw"
                          ? "bg-pu-yellow text-slate-950 border-pu-yellow shadow"
                          : "bg-slate-800/40 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-slate-100"
                      )}
                    >
                      <Paintbrush className="w-4 h-4" /> Corat-Coret
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTool("text")}
                      className={cn(
                        "flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                        activeTool === "text"
                          ? "bg-pu-yellow text-slate-950 border-pu-yellow shadow"
                          : "bg-slate-800/40 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-slate-100"
                      )}
                    >
                      <Type className="w-4 h-4" /> Teks
                    </button>
                  </div>
                </div>

                {/* Color Palette */}
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pilih Warna</label>
                  <div className="flex items-center gap-2">
                    {BRUSH_COLORS.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setBrushColor(color.value)}
                        className={cn(
                          "w-7 h-7 rounded-full border-2 transition-transform cursor-pointer relative flex items-center justify-center hover:scale-110",
                          brushColor === color.value ? "border-white scale-105" : "border-transparent"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      >
                        {brushColor === color.value && (
                          <div className={cn("w-2 h-2 rounded-full", color.value === "#1E293B" ? "bg-white" : "bg-slate-900")} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contextual Options depending on Active Tool */}
                {activeTool === "draw" ? (
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ukuran Kuas</label>
                    <div className="flex gap-2">
                      {BRUSH_SIZES.map(size => (
                        <button
                          key={size.value}
                          type="button"
                          onClick={() => setBrushSize(size.value)}
                          className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold border cursor-pointer transition-colors flex items-center justify-center gap-1.5",
                            brushSize === size.value
                              ? "bg-white text-slate-900 border-white font-black"
                              : "bg-slate-800/40 text-slate-400 border-slate-800 hover:bg-slate-800/50 hover:text-slate-200"
                          )}
                        >
                          <Circle className="fill-current" style={{ width: size.value + 2, height: size.value + 2 }} />
                          {size.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3.5 bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Input Teks Anotasi</label>
                      <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        placeholder="Contoh: Retak Struktur"
                        className="w-full bg-slate-900 text-slate-100 border border-slate-700/60 rounded-lg text-xs p-2.5 font-bold focus:border-pu-yellow focus:ring-1 focus:ring-pu-yellow"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Model Teks</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setTextStyle("badge")}
                          className={cn(
                            "py-1 px-2 rounded text-[9px] font-bold border transition-colors cursor-pointer",
                            textStyle === "badge"
                              ? "bg-slate-100 text-slate-900 border-white"
                              : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                          )}
                        >
                          Kotak Solid
                        </button>
                        <button
                          type="button"
                          onClick={() => setTextStyle("plain")}
                          className={cn(
                            "py-1 px-2 rounded text-[9px] font-bold border transition-colors cursor-pointer",
                            textStyle === "plain"
                              ? "bg-slate-100 text-slate-900 border-white"
                              : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
                          )}
                        >
                          Tanpa Background
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* History Actions */}
                <div className="flex gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={undo}
                    disabled={history.length <= 1}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold border cursor-pointer transition-all",
                      history.length <= 1
                        ? "opacity-40 cursor-not-allowed border-slate-800 text-slate-500"
                        : "bg-slate-800/40 text-slate-300 border-slate-800 hover:bg-slate-800/80 hover:text-white"
                    )}
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Undo
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold bg-rose-950/20 text-rose-400 border border-rose-900/30 hover:bg-rose-950/40 hover:text-rose-300 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 mt-5 md:mt-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="flex-1 py-2.5 bg-pu-yellow hover:bg-yellow-400 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3px]" /> Simpan
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
