const fs = require('fs');

let fmFile = 'src/pages/FileManager.tsx';
let fmContent = fs.readFileSync(fmFile, 'utf8');

if (!fmContent.includes('setShowSmartModal(true)')) {
    // Wait, setShowSmartModal(true) is already passed as prop, so it exists in the file.
    // Let's replace handleSelectFile to include it.
}

fmContent = fmContent.replace(
  /const handleSelectFile = \(file: FileItem\) => \{[\s\S]*?setSelectedSheet\(0\);\s*\};/,
  `const handleSelectFile = (file: FileItem) => {
    setSelectedFile(file);
    setShowSmartModal(true);
    setPreviewScale(1);
    setPreviewPage(1);
    setPreviewRotation(0);
    setImageFilter('normal');
    setShowGrid(false);
    setIsMeasuring(false);
    setMeasurePoints([]);
    setHoveredFinding(null);
    setIsEditingMetadata(false);
    setEditedFileName(file.name);
    setEditedDescription(file.description || "");
    setSelectedSheet(0);
  };`
);

fs.writeFileSync(fmFile, fmContent);
console.log("Fixed handleSelectFile to open modal");
