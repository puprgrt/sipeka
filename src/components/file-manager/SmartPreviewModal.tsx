import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Share2, Download, Edit3, Check, File } from "lucide-react";

import PdfPreview from "./PdfPreview";
import ImagePreview from "./ImagePreview";
import ExcelPreview from "./ExcelPreview";
import AiVerificationPanel from "./AiVerificationPanel";

interface SmartPreviewModalProps {
  selectedFile: any;
  setSelectedFile: React.Dispatch<React.SetStateAction<any>>;
  setFiles: React.Dispatch<React.SetStateAction<any[]>>;
  activeRole: string;
  isEditingMetadata: boolean;
  setIsEditingMetadata: (val: boolean) => void;
  editedFileName: string;
  setEditedFileName: (val: string) => void;
  editedDescription: string;
  setEditedDescription: (val: string) => void;
  handleSaveMetadata: () => void;
  setShowSmartModal: (val: boolean) => void;
  setAiAnalysisResult: (val: any) => void;
  setAiChatHistory: (val: any) => void;
  setIsDigitallySigned: (val: boolean) => void;
  handleShareClick: () => void;
  getFileIcon: (type: string, className?: string) => React.ReactNode;
  
  // PDF state
  previewScale: number;
  setPreviewScale: React.Dispatch<React.SetStateAction<number>>;
  previewPage: number;
  setPreviewPage: React.Dispatch<React.SetStateAction<number>>;
  
  // Image state
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
  
  // Excel / Word / General
  selectedSheet: number;
  setSelectedSheet: (val: number) => void;
  handleExcelCellChange: (sheetIdx: number, rowIdx: number, colIdx: number, val: string) => void;
  handleWordContentChange: (newText: string) => void;
  formatSize: (bytes?: number) => string;

  // AI Modal specific
  modalActiveTab: 'ai' | 'discussions' | 'metadata';
  setModalActiveTab: (val: 'ai' | 'discussions' | 'metadata') => void;
  isAiAnalyzing: boolean;
  handleRunAiAnalysis: () => void;
  aiAnalysisResult: any;
  isDigitallySigned: boolean;
  aiChatHistory: any[];
  aiChatQuery: string;
  setAiChatQuery: (val: string) => void;
  handleSendAiChatQuery: () => void;
  isAiTyping: boolean;

  // Discussions
  commentText: string;
  setCommentText: (val: string) => void;
  handleAddComment: () => void;
}

export default function SmartPreviewModal(props: SmartPreviewModalProps) {
  const [isMakingPublic, setIsMakingPublic] = React.useState(true);
  const {
    selectedFile, setSelectedFile, setFiles, activeRole,
    isEditingMetadata, setIsEditingMetadata,
    editedFileName, setEditedFileName,
    editedDescription, setEditedDescription,
    handleSaveMetadata, setShowSmartModal,
    setAiAnalysisResult, setAiChatHistory,
    setIsDigitallySigned, handleShareClick, getFileIcon,
    
    previewScale, setPreviewScale,
    previewPage, setPreviewPage,
    
    previewRotation, setPreviewRotation,
    imageFilter, setImageFilter,
    pixelToMmScale, setPixelToMmScale,
    isMeasuring, setIsMeasuring,
    measurePoints, setMeasurePoints,
    showGrid, setShowGrid,
    showAiBoxes, setShowAiBoxes,
    hoveredFinding, setHoveredFinding,
    calculateDistance,
    
    selectedSheet, setSelectedSheet,
    handleExcelCellChange, handleWordContentChange,
    formatSize,
    
    modalActiveTab, setModalActiveTab,
    isAiAnalyzing, handleRunAiAnalysis, aiAnalysisResult,
    isDigitallySigned, aiChatHistory, aiChatQuery, setAiChatQuery, handleSendAiChatQuery, isAiTyping,
    
    commentText, setCommentText, handleAddComment
  } = props;

  React.useEffect(() => {
    // Ensure the file is public so iframe preview doesn't show "You need access"
    if (selectedFile && selectedFile.type !== 'folder' && selectedFile.id) {
      setIsMakingPublic(true);
      import('../../lib/driveService').then(({ makeFilePublic }) => {
        makeFilePublic(selectedFile.id).then(() => {
          setIsMakingPublic(false);
        }).catch((err) => {
          console.error("Auto makeFilePublic failed:", err);
          setIsMakingPublic(false); // Still show it and let user request access
        });
      });
    } else {
      setIsMakingPublic(false);
    }
  }, [selectedFile]);


  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6"
        onClick={() => setSelectedFile(null)}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 180 }}
        className="fixed inset-0 m-auto z-50 w-full max-w-7xl h-[88vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header toolbar */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {getFileIcon(selectedFile.type, "w-5 h-5 shrink-0")}
            {isEditingMetadata ? (
              <div className="flex items-center gap-1.5">
                <input 
                  type="text" 
                  value={editedFileName} 
                  onChange={(e) => setEditedFileName(e.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-800 bg-white"
                  autoFocus
                />
                <button onClick={handleSaveMetadata} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Simpan">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setIsEditingMetadata(false)} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Batal">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 overflow-hidden">
                <span className="text-xs font-bold text-slate-800 truncate" title={selectedFile.name}>
                  {selectedFile.name}
                </span>
                <button 
                  onClick={() => {
                    setIsEditingMetadata(true);
                    setEditedFileName(selectedFile.name);
                    setEditedDescription(selectedFile.description || "");
                  }} 
                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 shrink-0"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 select-none">
            <button 
              onClick={() => {
                setShowSmartModal(true);
                setAiAnalysisResult(null);
                setAiChatHistory([]);
                setIsDigitallySigned(false);
              }}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs hover:scale-[1.02] mr-1 animate-pulse"
              title="Buka Smart Preview (Modal Besar)"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-100" />
              <span>Smart Preview</span>
            </button>
            <button 
              onClick={handleShareClick}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Bagikan berkas"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                if (selectedFile.previewUrl) window.open(selectedFile.previewUrl, '_blank'); else alert('Link tidak tersedia');
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Unduh berkas"
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setSelectedFile(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Tutup pratinjau"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden bg-slate-900/5 flex flex-col lg:flex-row p-5 gap-5 min-h-0">
          
          {/* LEFT CONTAINER: File Preview */}
          <div className="w-full lg:w-3/5 h-full overflow-y-auto bg-slate-100 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[420px] border border-slate-200/50 custom-scrollbar relative">
            {selectedFile.type === 'pdf' && (
              <PdfPreview
                selectedFile={selectedFile}
                previewScale={previewScale}
                setPreviewScale={setPreviewScale}
                previewPage={previewPage}
                setPreviewPage={setPreviewPage}
              />
            )}
            
            {selectedFile.type === 'image' && (
              <ImagePreview
                selectedFile={selectedFile}
                previewRotation={previewRotation}
                setPreviewRotation={setPreviewRotation}
                imageFilter={imageFilter}
                setImageFilter={setImageFilter}
                pixelToMmScale={pixelToMmScale}
                setPixelToMmScale={setPixelToMmScale}
                isMeasuring={isMeasuring}
                setIsMeasuring={setIsMeasuring}
                measurePoints={measurePoints}
                setMeasurePoints={setMeasurePoints}
                showGrid={showGrid}
                setShowGrid={setShowGrid}
                showAiBoxes={showAiBoxes}
                setShowAiBoxes={setShowAiBoxes}
                hoveredFinding={hoveredFinding}
                setHoveredFinding={setHoveredFinding}
                calculateDistance={calculateDistance}
              />
            )}

            {(selectedFile.type === 'word' || selectedFile.type === 'excel' || selectedFile.type === 'other') && selectedFile.previewUrl ? (
              <div className="w-full h-full p-1 bg-white rounded-xl border border-slate-200">
                {isMakingPublic ? (
                  <div className="w-full h-full rounded-lg bg-slate-100 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-500 font-medium text-sm">Menyiapkan pratinjau publik...</p>
                  </div>
                ) : (
                  <iframe 
                  src={selectedFile.previewUrl.replace(/\/view.*$/, '/preview')}
                  className="w-full h-full rounded-lg"
                  title="Google Drive Preview"
                />
                )}
              </div>
            ) : selectedFile.type === 'excel' && selectedFile.excelData ? (
              <ExcelPreview
                selectedFile={selectedFile}
                selectedSheet={selectedSheet}
                setSelectedSheet={setSelectedSheet}
                handleExcelCellChange={handleExcelCellChange}
              />
            ) : selectedFile.type === 'other' || selectedFile.type === 'word' || selectedFile.type === 'excel' ? (
              <div className="p-10 text-center text-slate-500 space-y-3 bg-white/70 border border-slate-200 rounded-2xl max-w-sm">
                <File className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Pratinjau Tidak Tersedia</p>
                <p className="text-[10px] text-slate-400">
                  Berkas "{selectedFile.name}" tidak memiliki link pratinjau yang valid.
                </p>
              </div>
            ) : null}
          </div>

          {/* RIGHT CONTAINER: Verification Panel */}
          <AiVerificationPanel
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            setFiles={setFiles}
            activeRole={activeRole}
            modalActiveTab={modalActiveTab}
            setModalActiveTab={setModalActiveTab}
            isAiAnalyzing={isAiAnalyzing}
            handleRunAiAnalysis={handleRunAiAnalysis}
            aiAnalysisResult={aiAnalysisResult}
            isDigitallySigned={isDigitallySigned}
            setIsDigitallySigned={setIsDigitallySigned}
            aiChatHistory={aiChatHistory}
            aiChatQuery={aiChatQuery}
            setAiChatQuery={setAiChatQuery}
            handleSendAiChatQuery={handleSendAiChatQuery}
            isAiTyping={isAiTyping}
            commentText={commentText}
            setCommentText={setCommentText}
            handleAddComment={handleAddComment}
            isEditingMetadata={isEditingMetadata}
            editedDescription={editedDescription}
            setEditedDescription={setEditedDescription}
            formatSize={formatSize}
          />
        </div>
      </motion.div>
    </>
  );
}
