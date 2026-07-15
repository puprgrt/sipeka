const fs = require('fs');

// 1. PATCH SmartPreviewModal.tsx (Google Drive Integration in iframe)
let spmFile = 'src/components/file-manager/SmartPreviewModal.tsx';
let spmContent = fs.readFileSync(spmFile, 'utf8');

// Replace Download alert with actual open
spmContent = spmContent.replace(
  /alert\(\`Mengunduh berkas: \$\{selectedFile\.name\}\`\);/,
  `if (selectedFile.previewUrl) window.open(selectedFile.previewUrl, '_blank'); else alert('Link tidak tersedia');`
);

// Replace the Excel and Other previews, and add Word
const newPreviews = `
            {(selectedFile.type === 'word' || selectedFile.type === 'excel' || selectedFile.type === 'other') && selectedFile.previewUrl ? (
              <div className="w-full h-full p-1 bg-white rounded-xl border border-slate-200">
                <iframe 
                  src={selectedFile.previewUrl.replace(/\\/view.*$/, '/preview')}
                  className="w-full h-full rounded-lg"
                  title="Google Drive Preview"
                />
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
`;

// Replace the old Excel and Other preview blocks
const oldExcelOtherRegex = /\{selectedFile\.type === 'excel'[\s\S]*?Format Pratinjau Terbatas[\s\S]*?<\/div>\s*\)\}/;
spmContent = spmContent.replace(oldExcelOtherRegex, newPreviews.trim());
fs.writeFileSync(spmFile, spmContent);


// 2. PATCH FileManager.tsx (currentFolderName tracking)
let fmFile = 'src/pages/FileManager.tsx';
let fmContent = fs.readFileSync(fmFile, 'utf8');

if (!fmContent.includes('currentFolderName')) {
  // Add state
  fmContent = fmContent.replace(
    /const \[currentFolder, setCurrentFolder\] = useState<string \| null>\(null\);/,
    `const [currentFolder, setCurrentFolder] = useState<string | null>(null);\n  const [currentFolderName, setCurrentFolderName] = useState<string | null>(null);`
  );

  // Update FileManagerToolbar props
  fmContent = fmContent.replace(
    /folderPath=\{folderPath\}/,
    `folderName={currentFolderName}\n            setCurrentFolderName={setCurrentFolderName}`
  );

  // Update handleSelectFile (list/grid view click)
  fmContent = fmContent.replace(
    /onClick=\{\(\) => file\.type === 'folder' \? \(setCurrentFolder\(file\.id\), setSelectedFile\(null\)\) : handleSelectFile\(file\)\}/g,
    `onClick={() => file.type === 'folder' ? (setCurrentFolder(file.id), setCurrentFolderName(file.name), setSelectedFile(null)) : handleSelectFile(file)}`
  );
  
  fs.writeFileSync(fmFile, fmContent);
}


// 3. PATCH FileManagerToolbar.tsx
let tbFile = 'src/components/file-manager/FileManagerToolbar.tsx';
let tbContent = fs.readFileSync(tbFile, 'utf8');

tbContent = tbContent.replace(
  /folderPath\?: FileItem;/,
  `folderName?: string | null;\n  setCurrentFolderName?: (name: string | null) => void;`
);

tbContent = tbContent.replace(
  /folderPath,/g,
  `folderName,\n    setCurrentFolderName,`
);

tbContent = tbContent.replace(
  /\{currentFolder \? \(folderPath\?\.name \|\| "Folder Tersimpan"\) : "Root Directory"\}/,
  `{currentFolder ? (folderName || "Folder") : "Root Directory"}`
);

tbContent = tbContent.replace(
  /\{folderPath && \(/,
  `{folderName && (`
);

tbContent = tbContent.replace(
  /\{folderPath\.name\}/,
  `{folderName}`
);

tbContent = tbContent.replace(
  /setCurrentFolder\(null\);\s*setSelectedFile\(null\);/g,
  `setCurrentFolder(null);\n                setCurrentFolderName?.(null);\n                setSelectedFile(null);`
);

fs.writeFileSync(tbFile, tbContent);

console.log("Patched SmartPreviewModal and folder tracking!");
