const fs = require('fs');
let fmFile = 'src/pages/FileManager.tsx';
let fmContent = fs.readFileSync(fmFile, 'utf8');

fmContent = fmContent.replace(
  /const \{ files, setFiles, loadingFiles, fetchFiles, createFolder \} = useDriveFiles\(currentFolder\);/g,
  `const { files, setFiles, loadingFiles, fetchFiles, createFolder, uploadFile, deleteFile } = useDriveFiles(currentFolder);`
);

fs.writeFileSync(fmFile, fmContent);
console.log("Fixed FileManager.tsx hook extraction");
