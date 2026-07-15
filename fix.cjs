const fs = require('fs');
let content = fs.readFileSync('src/pages/FileManager.tsx', 'utf8');

// Insert import at the top
if (!content.includes('SmartPreviewModal')) {
    const importStr = 'import SmartPreviewModal from "../components/file-manager/SmartPreviewModal";\n';
    content = content.replace('import { cn } from "../lib/utils";', 'import { cn } from "../lib/utils";\n' + importStr);
}

// Find the block between '      {/* RIGHT CONTAINER: Smart Full-Screen Interactive Document Hub Modal */}'
// and '      {/* MODAL: SHARE OVERLAY */}'
const startMarker = '      {/* RIGHT CONTAINER: Smart Full-Screen Interactive Document Hub Modal */}';
const endMarker = '      {/* MODAL: SHARE OVERLAY */}';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
    const replacement = `      {/* RIGHT CONTAINER: Smart Full-Screen Interactive Document Hub Modal */}
      <AnimatePresence>
        {selectedFile && showSmartModal && (
          <SmartPreviewModal
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            setFiles={setFiles}
            activeRole={activeRole}
            isEditingMetadata={isEditingMetadata}
            setIsEditingMetadata={setIsEditingMetadata}
            editedFileName={editedFileName}
            setEditedFileName={setEditedFileName}
            editedDescription={editedDescription}
            setEditedDescription={setEditedDescription}
            handleSaveMetadata={handleSaveMetadata}
            setShowSmartModal={setShowSmartModal}
            setAiAnalysisResult={setAiAnalysisResult}
            setAiChatHistory={setAiChatHistory}
            setIsDigitallySigned={setIsDigitallySigned}
            handleShareClick={handleShareClick}
            getFileIcon={getFileIcon}
            previewScale={previewScale}
            setPreviewScale={setPreviewScale}
            previewPage={previewPage}
            setPreviewPage={setPreviewPage}
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
            selectedSheet={selectedSheet}
            setSelectedSheet={setSelectedSheet}
            handleExcelCellChange={handleExcelCellChange}
            handleWordContentChange={handleWordContentChange}
            formatSize={formatSize}
            modalActiveTab={modalActiveTab}
            setModalActiveTab={setModalActiveTab}
            isAiAnalyzing={isAiAnalyzing}
            handleRunAiAnalysis={handleRunAiAnalysis}
            aiAnalysisResult={aiAnalysisResult}
            isDigitallySigned={isDigitallySigned}
            aiChatHistory={aiChatHistory}
            aiChatQuery={aiChatQuery}
            setAiChatQuery={setAiChatQuery}
            handleSendAiChatQuery={handleSendAiChatQuery}
            isAiTyping={isAiTyping}
            commentText={commentText}
            setCommentText={setCommentText}
            handleAddComment={handleAddComment}
          />
        )}
      </AnimatePresence>\n\n`;
    content = content.substring(0, startIndex) + replacement + content.substring(endIndex);
    fs.writeFileSync('src/pages/FileManager.tsx', content, 'utf8');
    console.log('Successfully replaced SmartPreviewModal block in FileManager.tsx');
} else {
    console.log('Markers not found.');
}
