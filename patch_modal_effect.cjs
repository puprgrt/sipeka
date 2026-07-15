const fs = require('fs');

let modalFile = 'src/components/file-manager/SmartPreviewModal.tsx';
let modalContent = fs.readFileSync(modalFile, 'utf8');

const targetStr = '} = props;';

if (modalContent.includes(targetStr)) {
  const insertIndex = modalContent.indexOf(targetStr) + targetStr.length;
  const injection = `

  React.useEffect(() => {
    // Ensure the file is public so iframe preview doesn't show "You need access"
    if (selectedFile && selectedFile.type !== 'folder' && selectedFile.id) {
      import('../../lib/driveService').then(({ makeFilePublic }) => {
        makeFilePublic(selectedFile.id).catch((err) => {
          console.error("Auto makeFilePublic failed:", err);
        });
      });
    }
  }, [selectedFile]);
`;
  modalContent = modalContent.substring(0, insertIndex) + injection + modalContent.substring(insertIndex);
  fs.writeFileSync(modalFile, modalContent);
  console.log("Patched SmartPreviewModal with useEffect");
} else {
  console.log("Could not find insertion point");
}
