const fs = require('fs');
let content = fs.readFileSync('src/pages/AssessmentList.tsx', 'utf8');

if (!content.includes('EditAssessmentModal')) {
    const importStr = 'import EditAssessmentModal from "../components/assessment/EditAssessmentModal";\nimport AssessmentDetailModal from "../components/assessment/AssessmentDetailModal";\n';
    content = content.replace('import { format } from "date-fns";', importStr + 'import { format } from "date-fns";');
}

// Replace AssessmentDetailModal block
const detailStartMarker = '      {/* Side Sheet Detail & Real-Time Timeline */}';
const detailEndMarker = '      {/* Lightbox Modal */}';

const detailStartIndex = content.indexOf(detailStartMarker);
const detailEndIndex = content.lastIndexOf('      <AnimatePresence>', content.indexOf(detailEndMarker)) || content.indexOf('      <AnimatePresence>\n        {editingAssessment'); // Try to find the exact boundary

// Let's just use exact string replacement for the big block using regex or indexes
const editStartMarker = '      <AnimatePresence>\n        {editingAssessment && (';
const editStartIndex = content.indexOf(editStartMarker);

if (detailStartIndex !== -1 && editStartIndex !== -1) {
    const detailReplacement = `      {/* Side Sheet Detail & Real-Time Timeline */}
      <AssessmentDetailModal
        selectedAssessment={selectedAssessment}
        setSelectedAssessment={setSelectedAssessment}
        activeRole={activeRole}
        updateStatus={updateStatus}
        handleScheduleSurvei={handleScheduleSurvei}
        handleGenerateAnalysisFormat={handleGenerateAnalysisFormat}
        handleGenerateSuratJawaban={handleGenerateSuratJawaban}
        setPreviewUrl={setPreviewUrl}
        loadingLogs={loadingLogs}
        dispositionLogs={dispositionLogs}
        setSmartPreviewPhoto={setSmartPreviewPhoto}
      />

`;
    // The edit modal block is right after detail modal.
    const lightboxMarker = '      {/* Lightbox Modal */}';
    const lightboxIndex = content.indexOf(lightboxMarker);

    const editReplacement = `      <EditAssessmentModal
        editingAssessment={editingAssessment}
        setEditingAssessment={setEditingAssessment}
        editForm={editForm}
        setEditForm={setEditForm}
        handleEditSave={handleEditSave}
      />

`;
    
    // We will slice the content
    const part1 = content.substring(0, detailStartIndex);
    const part3 = content.substring(lightboxIndex);
    
    content = part1 + detailReplacement + editReplacement + part3;
    
    fs.writeFileSync('src/pages/AssessmentList.tsx', content, 'utf8');
    console.log('Successfully replaced Modals in AssessmentList.tsx');
} else {
    console.log('Markers not found. detailStartIndex:', detailStartIndex, 'editStartIndex:', editStartIndex);
}
