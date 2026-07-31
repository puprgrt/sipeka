import { getAccessToken, refreshAccessToken } from './firebaseAuth';

const APP_ROOT_FOLDER_NAME = 'SIPEKA_File_Manager';

async function ensureDriveToken(): Promise<string> {
  let token = await getAccessToken();
  if (!token) {
    token = await refreshAccessToken();
  }
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}

async function driveFetch(input: RequestInfo | URL, init: RequestInit = {}, retry = true): Promise<Response> {
  const token = await ensureDriveToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(input, { ...init, headers });
  if ((response.status === 401 || response.status === 403) && retry) {
    const refreshedToken = await refreshAccessToken();
    if (!refreshedToken) {
      return response;
    }
    headers.set('Authorization', `Bearer ${refreshedToken}`);
    return await fetch(input, { ...init, headers });
  }

  return response;
}

/**
 * Gets or creates the root folder for the SIPEKA application in Google Drive.
 */
export async function getOrCreateAppRootFolder(): Promise<string> {
  const q = `mimeType='application/vnd.google-apps.folder' and name='${APP_ROOT_FOLDER_NAME}' and trashed=false`;
  const searchRes = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`);
  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }
  
  // Create folder if it doesn't exist
  const folderRes = await driveFetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: APP_ROOT_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });
  const folderData = await folderRes.json();
  return folderData.id;
}

/**
 * Uploads a file (e.g. PDF or image) to Google Drive.
 * @param file The file object to upload
 * @param folderName (Optional) create/use a folder with this name to store the file
 * @returns The Drive URL of the uploaded file
 */
export async function uploadToDrive(file: File, folderName?: string): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const appRootId = await getOrCreateAppRootFolder();
  let folderId: string = appRootId;

  if (folderName) {
    // Check if folder exists inside the app root folder
    const q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${appRootId}' in parents and trashed=false`;
    const searchRes = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}`);
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      folderId = searchData.files[0].id;
    } else {
      // Create folder inside app root
      const folderRes = await driveFetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [appRootId]
        })
      });
      const folderData = await folderRes.json();
      folderId = folderData.id;
    }
  }

  // Upload file
  const metadata = {
    name: file.name,
    parents: [folderId]
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await driveFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
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
  if (!token) throw new Error('Not authenticated');

  const res = await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'reader',
      type: 'anyone'
    })
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('Drive permission update error', res.status, body);
    if (res.status === 401 || res.status === 403) {
      throw new Error('Drive auth failed');
    }
    throw new Error('Failed to update Google Drive permissions');
  }
}

/**
 * Lists files and folders from Google Drive for real-time file management.
 * @param folderId (Optional) ID of the folder to list files from. If null, lists root files.
 * @returns Array of Google Drive file objects
 */
export async function listDriveFiles(folderId?: string | null): Promise<any[]> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  // Base query: not trashed
  let q = "trashed=false";
  
  if (folderId) {
    q += ` and '${folderId}' in parents`;
  } else {
    // Fetch only from SIPEKA root folder
    const appRootId = await getOrCreateAppRootFolder();
    q += ` and '${appRootId}' in parents`;
  }

  const res = await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,size,modifiedTime,owners,webViewLink,webContentLink,hasThumbnail,thumbnailLink)&orderBy=folder,modifiedTime desc`);

  if (!res.ok) {
    console.error("Failed to list files from Drive", await res.text());
    throw new Error('Failed to list files from Google Drive');
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Uploads a file to Google Drive under a specific parent folder ID.
 * @param file The file to upload
 * @param parentFolderId Optional ID of the parent folder.
 * @returns The Drive File metadata object
 */
export async function uploadFileToDrive(file: File, parentFolderId?: string | null): Promise<any> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const appRootId = await getOrCreateAppRootFolder();
  const parentId = parentFolderId || appRootId;

  const metadata = {
    name: file.name,
    parents: [parentId]
  };

  // Step 1: Create file metadata
  const metaRes = await driveFetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  const uploadRes = await driveFetch(`https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&fields=id,name,mimeType,size,modifiedTime,owners,webViewLink,webContentLink`, {
    method: 'PATCH',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
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
}

/**
 * Creates a new folder in Google Drive.
 * @param folderName Name of the new folder
 * @param parentFolderId Optional ID of the parent folder. If not provided, created in the app root folder.
 * @returns The Drive File ID of the created folder
 */
export async function createDriveFolder(folderName: string, parentFolderId?: string | null): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");

  const appRootId = await getOrCreateAppRootFolder();
  const parentId = parentFolderId || appRootId;

  const folderRes = await driveFetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId]
    })
  });

  if (!folderRes.ok) {
    console.error("Failed to create folder in Drive", await folderRes.text());
    throw new Error('Failed to create folder');
  }

  const folderData = await folderRes.json();
  return folderData.id;
}


/**
 * Deletes a file or folder from Google Drive.
 * @param fileId ID of the file to delete
 */
export async function deleteFileFromDrive(fileId: string): Promise<void> {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated');

  const res = await driveFetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE'
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('Drive delete error', res.status, body);
    if (res.status === 401 || res.status === 403) {
      throw new Error('Drive auth failed');
    }
    if (res.status === 404) {
      throw new Error('Drive file not found');
    }
    throw new Error('Failed to delete file from Google Drive');
  }
}
