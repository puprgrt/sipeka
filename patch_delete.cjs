const fs = require('fs');

// PATCH useDriveFiles.ts
let hookFile = 'src/hooks/useDriveFiles.ts';
let hookContent = fs.readFileSync(hookFile, 'utf8');

if (!hookContent.includes('deleteFileFromDrive')) {
  hookContent = hookContent.replace(
    /import \{ listDriveFiles, createDriveFolder, uploadFileToDrive \} from '\.\.\/lib\/driveService';/,
    `import { listDriveFiles, createDriveFolder, uploadFileToDrive, deleteFileFromDrive } from '../lib/driveService';`
  );
  
  const deleteFunc = `
  const deleteFile = async (fileId: string) => {
    try {
      await deleteFileFromDrive(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error) {
      console.error("Failed to delete file from Drive", error);
      throw error;
    }
  };

  return { files, setFiles, loadingFiles, fetchFiles, createFolder, uploadFile, deleteFile };
`;

  hookContent = hookContent.replace(/return \{ files, setFiles, loadingFiles, fetchFiles, createFolder, uploadFile \};\n\}/, deleteFunc + '}');
  fs.writeFileSync(hookFile, hookContent);
  console.log("Updated useDriveFiles.ts");
}

// PATCH FileManager.tsx
let fmFile = 'src/pages/FileManager.tsx';
let fmContent = fs.readFileSync(fmFile, 'utf8');

fmContent = fmContent.replace(
  /const \{ files, setFiles, loadingFiles, fetchFiles, createFolder, uploadFile \} = useDriveFiles\(currentFolder\);/,
  `const { files, setFiles, loadingFiles, fetchFiles, createFolder, uploadFile, deleteFile } = useDriveFiles(currentFolder);`
);

const oldDelete = /const handleDeleteFile = \(id: string\) => \{\n\s*if \(confirm\("Apakah Anda yakin ingin menghapus berkas ini\? Tindakan ini tidak dapat dibatalkan\."\)\) \{\n\s*setFiles\(prev => prev\.filter\(f => f\.id !== id\)\);\n\s*if \(selectedFile\?\.id === id\) \{\n\s*setSelectedFile\(null\);\n\s*\}\n\s*\}\n\s*\};/;

const newDelete = `const handleDeleteFile = async (id: string) => {
    if (activeRole !== "Administrator") {
      alert("Akses ditolak: Hanya Administrator yang dapat menghapus file atau folder.");
      return;
    }

    if (confirm("Apakah Anda yakin ingin menghapus berkas ini? Tindakan ini tidak dapat dibatalkan.")) {
      try {
        await deleteFile(id);
        if (selectedFile?.id === id) {
          setSelectedFile(null);
        }
      } catch (err) {
        alert("Gagal menghapus berkas dari Google Drive.");
      }
    }
  };`;

fmContent = fmContent.replace(oldDelete, newDelete);
fs.writeFileSync(fmFile, fmContent);
console.log("Updated FileManager.tsx");
