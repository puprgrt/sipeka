const fs = require('fs');
const file = 'src/pages/FileManager.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /const { files, setFiles, loadingFiles, fetchFiles } = useDriveFiles\(currentFolder\);/,
  `const { files, setFiles, loadingFiles, fetchFiles, createFolder, uploadFile } = useDriveFiles(currentFolder);`
);

const regex = /const handleFileUpload = \(e: React\.ChangeEvent<HTMLInputElement>\) => \{[\s\S]*?\n  \};/;
const replacement = `const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    try {
      const activeUserName = localStorage.getItem("activeUserName") || activeRole.replace("_", " ");
      const uploadedFile = await uploadFile(file, activeUserName);

      if (uploadedFile.type === 'word' || uploadedFile.type === 'excel') {
        const reader = new FileReader();
        reader.onload = (event) => {
          const textContent = (event.target?.result as string) || "";
          let wordContent = "";
          let excelData = undefined;

          if (uploadedFile.type === 'word') {
            wordContent = textContent || \`DOKUMEN HASIL UNGGAHAN\\nNama File: \${file.name}\\n\\nTidak ada teks yang dapat dibaca secara langsung.\`;
          } else if (uploadedFile.type === 'excel') {
            const rows = [];
            const lines = textContent.split(/\\r?\\n/);
            const lineLimit = Math.min(lines.length, 15);
            for (let i = 0; i < lineLimit; i++) {
              if (!lines[i].trim()) continue;
              const cols = lines[i].split(/,|\\t|;/).map(c => c.replace(/^["']|["']$/g, '').trim());
              rows.push(cols);
            }
            if (rows.length > 1) {
              excelData = { sheets: [{ name: "Hasil Impor", rows: rows }] };
            }
          }
          
          setFiles(prev => prev.map(f => f.id === uploadedFile.id ? { ...f, content: wordContent, excelData } : f));
        };
        reader.readAsText(file);
      }
    } catch (err) {
      console.error("Failed to upload file", err);
      alert("Gagal mengunggah file ke Google Drive.");
    }
  };`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log("File updated!");
