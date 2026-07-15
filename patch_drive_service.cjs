const fs = require('fs');

const file = 'src/lib/driveService.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace uploadFileToDrive with robust 2-step approach
const robustUpload = `export async function uploadFileToDrive(file: File, parentFolderId?: string | null): Promise<any> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const appRootId = await getOrCreateAppRootFolder(token);
  const parentId = parentFolderId || appRootId;

  const metadata = {
    name: file.name,
    parents: [parentId]
  };

  // Step 1: Create file metadata
  const metaRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(metadata)
  });

  if (!metaRes.ok) {
    const text = await metaRes.text();
    console.error("Drive metadata upload error", text);
    throw new Error('Failed to create file metadata in Google Drive');
  }

  const metaData = await metaRes.json();
  const fileId = metaData.id;

  // Step 2: Upload file content
  const uploadRes = await fetch(\`https://www.googleapis.com/upload/drive/v3/files/\${fileId}?uploadType=media&fields=id,name,mimeType,size,modifiedTime,owners,webViewLink,webContentLink\`, {
    method: 'PATCH',
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': file.type || 'application/octet-stream'
    },
    body: file
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    console.error("Drive content upload error", text);
    throw new Error('Failed to upload file content to Google Drive');
  }

  const data = await uploadRes.json();
  
  // Make the uploaded file publicly viewable
  await makeFilePublic(data.id).catch(console.error);
  
  return data;
}`;

content = content.replace(/export async function uploadFileToDrive[\s\S]*?return data;\n\}/, robustUpload);

// Add deleteFileFromDrive
if (!content.includes('deleteFileFromDrive')) {
  content += `\n\n/**
 * Deletes a file or folder from Google Drive.
 * @param fileId ID of the file to delete
 */
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(\`https://www.googleapis.com/drive/v3/files/\${fileId}\`, {
    method: 'DELETE',
    headers: {
      'Authorization': \`Bearer \${token}\`
    }
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Drive delete error", text);
    throw new Error('Failed to delete file from Google Drive');
  }
}
`;
}

fs.writeFileSync(file, content);
console.log("Updated driveService.ts");
