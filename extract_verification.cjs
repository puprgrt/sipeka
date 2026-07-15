const fs = require('fs');

const content = fs.readFileSync('src/pages/VerificationList.tsx', 'utf8');

const startStr = '      {/* Side Sheet Detail & Real-Time Timeline */}';
const endStr = '      {/* Lightbox Modal */}';

const startIndex = content.indexOf(startStr);
let endIndex = content.indexOf(endStr);
// We want to remove the '        )}' right before Lightbox Modal
const beforeEnd = content.lastIndexOf('        )}', endIndex);
if (beforeEnd !== -1 && beforeEnd > startIndex) {
    endIndex = beforeEnd;
}

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find boundaries in VerificationList.tsx.", {startIndex, endIndex});
    process.exit(1);
}

let modalContent = content.substring(startIndex, endIndex);

const props = [
  'selectedAssessment', 'setSelectedAssessment', 'activeRole',
  'handleVerifyComponent', 'handleSubmitVerification',
  'setPreviewUrl', 'setSmartPreviewPhoto',
  'formatSize'
];

let cleanContent = modalContent;
if (cleanContent.includes('{selectedAssessment && (')) {
  cleanContent = cleanContent.replace('{selectedAssessment && (', '');
}

const componentCode = `import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, MapPin, Calendar, CheckCircle2, Clock, 
  User, FileText, Search, Download, AlertTriangle, ShieldCheck
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "../../lib/utils";

export default function VerificationDetailModal({
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
    <>
${cleanContent.split('\n').map(l => '      ' + l).join('\n')}
    </>
  );
}
`;

fs.mkdirSync('src/components/verification', { recursive: true });
fs.writeFileSync('src/components/verification/VerificationDetailModal.tsx', componentCode, 'utf8');

const importStr = 'import VerificationDetailModal from "../components/verification/VerificationDetailModal";\n';
let newContent = content.substring(0, startIndex) + `      {/* Side Sheet Detail & Real-Time Timeline */}
      <VerificationDetailModal
${props.map(p => `        ${p}={${p}}`).join('\n')}
      />\n\n` + content.substring(endIndex + '        )}\n'.length);

newContent = newContent.replace('import { format } from "date-fns";', importStr + 'import { format } from "date-fns";');

fs.writeFileSync('src/pages/VerificationList.tsx', newContent, 'utf8');
console.log("Successfully extracted VerificationDetailModal");
