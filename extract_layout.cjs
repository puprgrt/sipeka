const fs = require('fs');

const content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const startStr = '      {conflict && (';
const endStr = '    </div>\n  );\n}';

const startIndex = content.indexOf(startStr);
const endIndex = content.lastIndexOf(endStr);

if (startIndex === -1 || endIndex === -1) {
    console.error("Could not find boundaries in Layout.tsx.", {startIndex, endIndex});
    process.exit(1);
}

const modalContent = content.substring(startIndex, endIndex);

const props = [
  'conflict', 'resolveConflict', 'setConflict', 'resolveConflictPromiseRef'
];

let cleanContent = modalContent;
if (cleanContent.includes('{conflict && (')) {
  cleanContent = cleanContent.replace('{conflict && (', '');
  const lastBracket = cleanContent.lastIndexOf(')}');
  if (lastBracket !== -1) {
      cleanContent = cleanContent.substring(0, lastBracket) + cleanContent.substring(lastBracket + 2);
  }
}

const componentCode = `import React from "react";
import { Database, Smartphone, XCircle } from "lucide-react";

export default function ConflictResolutionModal({
${props.map(p => `  ${p},`).join('\n')}
}: any) {
  if (!conflict) return null;

  return (
    <>
${cleanContent.split('\n').map(l => '  ' + l).join('\n')}
    </>
  );
}
`;

fs.mkdirSync('src/components/layout', { recursive: true });
fs.writeFileSync('src/components/layout/ConflictResolutionModal.tsx', componentCode, 'utf8');

const importStr = 'import ConflictResolutionModal from "./layout/ConflictResolutionModal";\n';
let newContent = content.substring(0, startIndex) + `      <ConflictResolutionModal
${props.map(p => `        ${p}={${p}}`).join('\n')}
      />\n` + content.substring(endIndex);

newContent = newContent.replace('import { cn } from "../lib/utils";', importStr + 'import { cn } from "../lib/utils";');

fs.writeFileSync('src/components/Layout.tsx', newContent, 'utf8');
console.log("Successfully extracted ConflictResolutionModal");
