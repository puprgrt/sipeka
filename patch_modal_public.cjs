const fs = require('fs');

let modalFile = 'src/components/file-manager/SmartPreviewModal.tsx';
let modalContent = fs.readFileSync(modalFile, 'utf8');

// Replace React import
modalContent = modalContent.replace(
  /import React from "react";/,
  `import React, { useEffect } from "react";\nimport { makeFilePublic } from "../../lib/driveService";`
);

// Find the start of the component
// export default function SmartPreviewModal({
const componentStartRegex = /export default function SmartPreviewModal\(\{[\s\S]*?\}\s*:\s*SmartPreviewModalProps\)\s*\{/;
const componentStartMatch = modalContent.match(componentStartRegex);

if (componentStartMatch) {
  const insertionPoint = componentStartMatch.index + componentStartMatch[0].length;
  const newCode = `
  
  useEffect(() => {
    // Ensure the file is public so iframe preview doesn't show "You need access"
    if (selectedFile && selectedFile.type !== 'folder' && selectedFile.id) {
      makeFilePublic(selectedFile.id).catch((err) => {
        console.error("Auto makeFilePublic failed:", err);
      });
    }
  }, [selectedFile]);

`;
  modalContent = modalContent.substring(0, insertionPoint) + newCode + modalContent.substring(insertionPoint);
  fs.writeFileSync(modalFile, modalContent);
  console.log("Patched SmartPreviewModal with auto makeFilePublic");
} else {
  console.error("Could not find component start");
}
