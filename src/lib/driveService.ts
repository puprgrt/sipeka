import { getAccessToken } from './firebaseAuth';

/**
 * Uploads a file (e.g. PDF or image) to Google Drive.
 * @param file The file object to upload
 * @param folderName (Optional) create/use a folder with this name to store the file
 * @returns The Drive URL of the uploaded file
 */
export async function uploadToDrive(file: File, folderName?: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  let folderId: string | undefined;

  if (folderName) {
    // Check if folder exists
    const q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      folderId = searchData.files[0].id;
    } else {
      // Create folder
      const folderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder'
        })
      });
      const folderData = await folderRes.json();
      folderId = folderData.id;
    }
  }

  // Upload file
  const metadata = {
    name: file.name,
    parents: folderId ? [folderId] : []
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: form
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Drive upload error", text);
    throw new Error('Failed to upload file to Google Drive');
  }

  const data = await res.json();
  const fileId = data.id;
  
  // Make the uploaded file publicly viewable
  await makeFilePublic(fileId).catch(console.error);
  
  // Return a direct view link that can be used in an <img> src
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

/**
 * Updates the permissions of a Google Drive file to make it publicly viewable by anyone with the link.
 * @param fileId The ID of the Google Drive file
 */
export async function makeFilePublic(fileId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone'
    })
  });

  if (!res.ok) {
    console.error("Failed to make file public", await res.text());
  }
}
