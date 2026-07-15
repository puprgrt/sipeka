const fs = require('fs');

const content = fs.readFileSync('src/pages/DisposisiList.tsx', 'utf8');

const startStr = '      {/* Side Sheet Detail & Real-Time Timeline */}';
const endStr = '      {/* Lightbox Modal */}';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find boundaries.");
    process.exit(1);
}

const modalContent = content.substring(startIndex, endIndex);

// Determine props needed by matching against state variables and functions in DisposisiList.tsx
// From reading the code, we know the main ones.
const props = [
  'selectedAssessment', 'setSelectedAssessment', 'activeRole',
  'updateStatus', 'handleScheduleSurvei', 'handleGenerateAnalysisFormat',
  'handleGenerateSuratJawaban', 'setPreviewUrl', 'loadingLogs', 'dispositionLogs',
  'setSmartPreviewPhoto', 'lembarDisposisiTemplate', 'dinasConfig',
  'dispNoAgenda', 'dispCatatan', 'lembarDisposisiDriveLink',
  'isEditingDisposisi', 'setIsEditingDisposisi', 'dispIndeks', 'setDispIndeks',
  'dispKode', 'setDispKode', 'dispNomorSurat', 'setDispNomorSurat',
  'setDispNoAgenda', 'dispDiteruskan', 'setDispDiteruskan', 'dispHarap', 'setDispHarap',
  'setDispCatatan', 'dispNamaPimpinan', 'setDispNamaPimpinan', 'dispNipPimpinan', 'setDispNipPimpinan',
  'letterConfig', 'handleSaveDisposisi', 'exportAssessmentToPdf', 'appConfig'
];

let componentCode = `import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, MapPin, Calendar, CheckCircle2, Clock, 
  User, FileText, Loader2, Search, Download
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "../../lib/utils";

// Replace with a dummy function for replaceTemplatePlaceholders since it's probably defined in the file
function replaceTemplatePlaceholders(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(\`\\\${key}\`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}

export default function DisposisiDetailModal({
${props.map(p => `  ${p},`).join('\n')}
}: any) {
  if (!selectedAssessment) return null;

  const parsePhotos = (photoStr: string | string[]) => {
    if (!photoStr) return [];
    if (Array.isArray(photoStr)) return photoStr;
    try {
      return JSON.parse(photoStr);
    } catch {
      return [photoStr];
    }
  };

  return (
${modalContent.split('\n').map(l => '  ' + l).join('\n')}
  );
}
`;

fs.mkdirSync('src/components/disposisi', { recursive: true });
fs.writeFileSync('src/components/disposisi/DisposisiDetailModal.tsx', componentCode, 'utf8');

const importStr = 'import DisposisiDetailModal from "../components/disposisi/DisposisiDetailModal";\n';
let newContent = content.substring(0, startIndex) + `      {/* Side Sheet Detail & Real-Time Timeline */}
      <DisposisiDetailModal
${props.map(p => `        ${p}={${p}}`).join('\n')}
      />\n\n` + content.substring(endIndex);

newContent = newContent.replace('import { format } from "date-fns";', importStr + 'import { format } from "date-fns";');

fs.writeFileSync('src/pages/DisposisiList.tsx', newContent, 'utf8');
console.log("Successfully extracted DisposisiDetailModal");
