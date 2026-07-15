import React from "react";
import { Sparkles, MessageSquare, Layers, RefreshCw, CheckCircle2, Shield, Calendar, Activity, Send } from "lucide-react";
import { cn } from "../../lib/utils";

interface AiVerificationPanelProps {
  selectedFile: any;
  setSelectedFile: React.Dispatch<React.SetStateAction<any>>;
  setFiles: React.Dispatch<React.SetStateAction<any[]>>;
  activeRole: string;
  modalActiveTab: 'ai' | 'discussions' | 'metadata';
  setModalActiveTab: (val: 'ai' | 'discussions' | 'metadata') => void;
  isAiAnalyzing: boolean;
  handleRunAiAnalysis: () => void;
  aiAnalysisResult: any;
  isDigitallySigned: boolean;
  setIsDigitallySigned: (val: boolean) => void;
  aiChatHistory: any[];
  aiChatQuery: string;
  setAiChatQuery: (val: string) => void;
  handleSendAiChatQuery: () => void;
  isAiTyping: boolean;
  commentText: string;
  setCommentText: (val: string) => void;
  handleAddComment: () => void;
  isEditingMetadata: boolean;
  editedDescription: string;
  setEditedDescription: (val: string) => void;
  formatSize: (bytes?: number) => string;
}

export default function AiVerificationPanel({
  selectedFile,
  setSelectedFile,
  setFiles,
  activeRole,
  modalActiveTab,
  setModalActiveTab,
  isAiAnalyzing,
  handleRunAiAnalysis,
  aiAnalysisResult,
  isDigitallySigned,
  setIsDigitallySigned,
  aiChatHistory,
  aiChatQuery,
  setAiChatQuery,
  handleSendAiChatQuery,
  isAiTyping,
  commentText,
  setCommentText,
  handleAddComment,
  isEditingMetadata,
  editedDescription,
  setEditedDescription,
  formatSize
}: AiVerificationPanelProps) {
  return (
    <div className="w-full lg:w-2/5 h-full overflow-y-auto flex flex-col gap-4 custom-scrollbar pr-1 select-none">
      
      {/* Tab Selectors for Modal Side Pane */}
      <div className="flex border-b border-slate-100 p-1 bg-slate-50 rounded-xl">
        <button 
          onClick={() => setModalActiveTab('ai')}
          className={cn(
            "flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
            modalActiveTab === 'ai' 
              ? "bg-white text-blue-600 shadow-xs border border-slate-200/40 font-bold" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
          )}
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          Analisis AI ({aiAnalysisResult ? "Selesai" : "Mulai"})
        </button>
        <button 
          onClick={() => setModalActiveTab('discussions')}
          className={cn(
            "flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
            modalActiveTab === 'discussions' 
              ? "bg-white text-blue-600 shadow-xs border border-slate-200/40 font-bold" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
          )}
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
          Diskusi ({selectedFile.comments?.length || 0})
        </button>
        <button 
          onClick={() => setModalActiveTab('metadata')}
          className={cn(
            "flex-1 py-1.5 px-2 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
            modalActiveTab === 'metadata' 
              ? "bg-white text-blue-600 shadow-xs border border-slate-200/40 font-bold" 
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
          )}
        >
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          Atribut & Log
        </button>
      </div>

      {/* TAB 1 CONTENT: AI AUDITOR */}
      {modalActiveTab === 'ai' && (
        <div className="flex-1 flex flex-col gap-3 min-h-0 select-text">
          {/* Status card */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">AI AUDIT STATUS</span>
              <span className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full text-[9px] font-mono">
                Gemini 1.5 Flash
              </span>
            </div>
            
            {!aiAnalysisResult && !isAiAnalyzing ? (
              <div className="text-center py-2">
                <p className="text-xs text-slate-300 font-semibold">Jalankan audit AI untuk menganalisis isi dokumen ini secara komprehensif.</p>
                <button 
                  onClick={handleRunAiAnalysis}
                  className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 mx-auto hover:scale-[1.02]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Mulai Audit AI Cerdas
                </button>
              </div>
            ) : isAiAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-2">
                <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                <p className="text-[11px] text-slate-300 font-medium animate-pulse">Memindai dokumen & merumuskan kepatuhan teknis...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs text-slate-400">Status Kelayakan:</span>
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-md",
                    aiAnalysisResult.complianceStatus.toLowerCase().includes("kritis") || aiAnalysisResult.complianceStatus.toLowerCase().includes("tidak")
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  )}>
                    {aiAnalysisResult.complianceStatus}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Skor Keandalan (AI):</span>
                  <span className="text-xs font-bold text-blue-300 font-mono">{aiAnalysisResult.confidenceScore}%</span>
                </div>
              </div>
            )}
          </div>

          {/* AI Chat History Container */}
          <div className="flex-1 bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col min-h-[220px] overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 custom-scrollbar text-xs">
              {aiChatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-4 py-8">
                  <Sparkles className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="font-bold text-slate-500">Asisten AI Auditor Cipta Karya</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Tanyakan detail teknis dokumen, validasi anggaran, atau kepatuhan regulasi di sini.</p>
                </div>
              ) : (
                aiChatHistory.map((chat, idx) => (
                  <div key={idx} className={cn("flex flex-col space-y-1.5", chat.sender === 'user' ? "items-end" : "items-start")}>
                    <span className="text-[9px] font-bold text-slate-400 select-none">
                      {chat.sender === 'user' ? 'Anda' : 'Auditor AI'}
                    </span>
                    <div className={cn(
                      "p-3 rounded-2xl max-w-[85%] leading-relaxed shadow-xs font-semibold",
                      chat.sender === 'user' 
                        ? "bg-blue-600 text-white rounded-tr-none" 
                        : "bg-white text-slate-800 border border-slate-200/60 rounded-tl-none whitespace-pre-wrap"
                    )}>
                      {chat.text}
                    </div>
                  </div>
                ))
              )}
              {isAiTyping && (
                <div className="flex flex-col items-start space-y-1.5">
                  <span className="text-[9px] font-bold text-slate-400 select-none">Auditor AI</span>
                  <div className="bg-white text-slate-500 p-3 rounded-2xl rounded-tl-none border border-slate-200/50 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
            </div>

            {/* Digital stamp & certify option */}
            {aiAnalysisResult && !isAiAnalyzing && (
              <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between select-none">
                <span className="text-[10px] text-slate-500 font-bold">Validasi Berkas Resmi:</span>
                <button 
                  onClick={() => {
                    setIsDigitallySigned(true);
                    const updatedActs = [
                      { action: "Tanda Tangan Digital Dibubuhkan", time: new Date().toISOString(), user: localStorage.getItem("activeUserName") || activeRole.replace("_", " ") },
                      ...(selectedFile.activities || [])
                    ];
                    setFiles(prev => prev.map(f => f.id === selectedFile.id ? { ...f, activities: updatedActs } : f));
                    setSelectedFile((prev: any) => prev ? { ...prev, activities: updatedActs } : null);
                  }}
                  disabled={isDigitallySigned}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-[10px] font-bold shadow-xs transition-all flex items-center gap-1 border",
                    isDigitallySigned 
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default" 
                      : "bg-emerald-600 hover:bg-emerald-700 text-white border-transparent hover:scale-[1.02]"
                  )}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isDigitallySigned ? "Telah Disertifikasi" : "Bubuhkan Digital Stamp"}
                </button>
              </div>
            )}
          </div>

          {/* Send message form */}
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder={aiAnalysisResult ? "Tanyakan hal teknis lain mengenai berkas..." : "Jalankan Audit AI terlebih dahulu..."}
              value={aiChatQuery}
              onChange={(e) => setAiChatQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' ? handleSendAiChatQuery() : null}
              disabled={!aiAnalysisResult || isAiTyping}
              className="flex-1 text-xs border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:opacity-50 font-bold shadow-inner"
            />
            <button 
              onClick={handleSendAiChatQuery}
              disabled={!aiAnalysisResult || isAiTyping || !aiChatQuery.trim()}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl shadow transition-all flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 2 CONTENT: DISCUSSIONS */}
      {modalActiveTab === 'discussions' && (
        <div className="flex-1 flex flex-col min-h-0 justify-between select-text">
          <div className="flex-1 flex flex-col min-h-0">
            {/* Comment Stream */}
            <div className="flex-1 overflow-y-auto space-y-3 pb-3 pr-1 custom-scrollbar text-xs">
              {(!selectedFile.comments || selectedFile.comments.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12 text-center">
                  <MessageSquare className="w-8 h-8 text-slate-300 mb-1" />
                  <p className="font-bold text-slate-500">Belum ada diskusi</p>
                  <p className="text-[10px] text-slate-400">Tulis catatan verifikasi atau koordinasi pertama Anda mengenai berkas ini.</p>
                </div>
              ) : (
                selectedFile.comments.map((c: any) => (
                  <div key={c.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col space-y-1 shadow-xs text-left">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 select-none pb-1 border-b border-slate-200/40">
                      <span className="font-bold text-slate-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                        {c.user} <span className="font-normal text-slate-400">({c.role})</span>
                      </span>
                      <span>{new Date(c.time).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-semibold pt-1">{c.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Comment Input */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              placeholder="Tulis saran, verifikasi, atau disposisi berkas..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' ? handleAddComment() : null}
              className="flex-1 text-xs border border-slate-200 rounded-xl px-4 py-2.5 bg-slate-50/50 focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none shadow-inner font-bold"
            />
            <button 
              onClick={handleAddComment}
              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* TAB 3 CONTENT: METADATA & ACTIONS LOG */}
      {modalActiveTab === 'metadata' && (
        <div className="space-y-4 text-left select-text text-xs">
          
          {/* Description field */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-xs space-y-1">
            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider select-none">
              Deskripsi Berkas / Rincian Penilai
            </h4>
            {isEditingMetadata ? (
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-xl p-2.5 focus:ring-1 focus:ring-blue-500 bg-white font-semibold"
                rows={3}
              />
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                {selectedFile.description || "Tidak ada rincian deskripsi tambahan untuk berkas ini."}
              </p>
            )}
          </div>

          {/* General Metadata Attributes Grid */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
            <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider border-b pb-1 select-none">
              Atribut Dokumen Resmi
            </h4>
            
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <span className="text-slate-400 font-bold text-[9px] block uppercase tracking-wider select-none">Uploader / Pemilik</span>
                <span className="font-bold text-slate-700 flex items-center gap-1.5 truncate">
                  <span className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-mono text-[9px] text-slate-600 font-bold shrink-0">
                    {selectedFile.author.substring(0, 1)}
                  </span>
                  {selectedFile.author}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold text-[9px] block uppercase tracking-wider select-none">Ukuran File</span>
                <span className="font-bold text-slate-700 font-mono">{formatSize(selectedFile.size)}</span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold text-[9px] block uppercase tracking-wider select-none">Modifikasi Terakhir</span>
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {new Date(selectedFile.updatedAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 font-bold text-[9px] block uppercase tracking-wider select-none">Hak Akses</span>
                <span className="font-bold text-slate-700 flex items-center gap-1.5 truncate" title={selectedFile.accessRole.join(", ")}>
                  <Shield className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  {selectedFile.accessRole.length} Role
                </span>
              </div>
            </div>
          </div>

          {/* Action Log History */}
          {selectedFile.activities && selectedFile.activities.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-2">
              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 border-b pb-1 select-none">
                <Activity className="w-3.5 h-3.5 text-slate-400" />
                Log Aktivitas Berkas
              </h4>
              <div className="space-y-2.5 pt-1 font-mono text-[9px] max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                {selectedFile.activities.map((act: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-slate-500">
                    <span className="text-blue-500 shrink-0 mt-0.5">•</span>
                    <div className="flex-1">
                      <p className="font-bold text-slate-700 leading-snug">{act.action}</p>
                      <p className="text-slate-400 mt-0.5">Oleh {act.user} — {new Date(act.time).toLocaleDateString('id-ID')} {new Date(act.time).toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'})}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>
      )}

    </div>
  );
}
