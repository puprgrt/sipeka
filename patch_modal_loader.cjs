const fs = require('fs');

let modalFile = 'src/components/file-manager/SmartPreviewModal.tsx';
let modalContent = fs.readFileSync(modalFile, 'utf8');

// 1. Add state
modalContent = modalContent.replace(
  /export default function SmartPreviewModal\(props: SmartPreviewModalProps\) \{/,
  `export default function SmartPreviewModal(props: SmartPreviewModalProps) {\n  const [isMakingPublic, setIsMakingPublic] = React.useState(true);`
);

// 2. Update useEffect
const oldEffectRegex = /React\.useEffect\(\(\) => \{\s*\/\/ Ensure the file is public so iframe preview doesn't show "You need access"[\s\S]*?\}, \[selectedFile\]\);/;
const newEffect = `React.useEffect(() => {
    // Ensure the file is public so iframe preview doesn't show "You need access"
    if (selectedFile && selectedFile.type !== 'folder' && selectedFile.id) {
      setIsMakingPublic(true);
      import('../../lib/driveService').then(({ makeFilePublic }) => {
        makeFilePublic(selectedFile.id).then(() => {
          setIsMakingPublic(false);
        }).catch((err) => {
          console.error("Auto makeFilePublic failed:", err);
          setIsMakingPublic(false); // Still show it and let user request access
        });
      });
    } else {
      setIsMakingPublic(false);
    }
  }, [selectedFile]);`;

if (oldEffectRegex.test(modalContent)) {
  modalContent = modalContent.replace(oldEffectRegex, newEffect);
} else {
  console.log("Could not find the old useEffect to replace. It might not be there.");
}

// 3. Update iframe
const iframeRegex = /<iframe[\s\S]*?title="Google Drive Preview"[\s\S]*?\/>/;
const iframeMatch = modalContent.match(iframeRegex);

if (iframeMatch) {
  const newIframeBlock = `{isMakingPublic ? (
                  <div className="w-full h-full rounded-lg bg-slate-100 flex flex-col items-center justify-center">
                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="mt-4 text-slate-500 font-medium text-sm">Menyiapkan pratinjau publik...</p>
                  </div>
                ) : (
                  ${iframeMatch[0]}
                )}`;
  modalContent = modalContent.replace(iframeRegex, newIframeBlock);
} else {
  console.log("Could not find iframe");
}

fs.writeFileSync(modalFile, modalContent);
console.log("Patched SmartPreviewModal with loading state");
