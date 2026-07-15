import { useState, useEffect, useCallback } from 'react';
import { listDriveFiles, createDriveFolder, uploadFileToDrive, deleteFileFromDrive } from '../lib/driveService';
import { FileItem } from '../pages/FileManager';

export function useDriveFiles(currentFolder: string | null) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  const fetchFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      // Fetch files from Google Drive
      const driveFiles = await listDriveFiles(currentFolder);
      
      // Map Google Drive API response to local FileItem structure
      const mappedFiles: FileItem[] = driveFiles.map((df: any) => {
        let type: FileItem['type'] = 'other';
        if (df.mimeType === 'application/vnd.google-apps.folder') type = 'folder';
        else if (df.mimeType === 'application/pdf') type = 'pdf';
        else if (df.mimeType?.startsWith('image/')) type = 'image';
        else if (df.mimeType?.includes('word')) type = 'word';
        else if (df.mimeType?.includes('spreadsheet') || df.mimeType?.includes('excel')) type = 'excel';

        return {
          id: df.id,
          name: df.name,
          type,
          size: df.size ? parseInt(df.size) : undefined,
          updatedAt: df.modifiedTime,
          author: df.owners?.[0]?.displayName || "Google Drive User",
          folderId: currentFolder,
          accessRole: ["Administrator", "Pengelola_Bangunan", "Tim_Teknis"],
          previewUrl: df.webViewLink || df.webContentLink,
        };
      });
      
      setFiles(mappedFiles);
    } catch (error) {
      console.error("Failed to fetch files from Google Drive", error);
      setFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  }, [currentFolder]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const createFolder = async (folderName: string, activeUserName: string) => {
    try {
      const newFolderId = await createDriveFolder(folderName, currentFolder);
      
      const newFolder: FileItem = {
        id: newFolderId,
        name: folderName,
        type: 'folder',
        updatedAt: new Date().toISOString(),
        author: activeUserName,
        folderId: currentFolder,
        accessRole: ["Administrator", "Kadis", "Kabid", "Koordinator", "Tim_Teknis", "Operator", "Pengelola_Bangunan"],
        activities: [
          { action: "Folder baru diciptakan", time: new Date().toISOString(), user: activeUserName }
        ]
      };

      setFiles(prev => [...prev, newFolder]);
      return newFolder;
    } catch (error) {
      console.error("Failed to create folder in Drive", error);
      throw error;
    }
  };

  const uploadFile = async (file: File, activeUserName: string) => {
    try {
      const df = await uploadFileToDrive(file, currentFolder);
      
      let type: FileItem['type'] = 'other';
      if (df.mimeType === 'application/pdf') type = 'pdf';
      else if (df.mimeType?.startsWith('image/')) type = 'image';
      else if (df.mimeType?.includes('word')) type = 'word';
      else if (df.mimeType?.includes('spreadsheet') || df.mimeType?.includes('excel')) type = 'excel';

      const newFile: FileItem = {
        id: df.id,
        name: df.name,
        type,
        size: df.size ? parseInt(df.size) : file.size,
        updatedAt: df.modifiedTime || new Date().toISOString(),
        author: activeUserName,
        folderId: currentFolder,
        accessRole: ["Administrator", "Kadis", "Kabid", "Koordinator", "Tim_Teknis", "Operator", "Pengelola_Bangunan"],
        previewUrl: df.webViewLink || df.webContentLink,
        activities: [
          { action: "Berkas diunggah", time: new Date().toISOString(), user: activeUserName }
        ]
      };

      setFiles(prev => [newFile, ...prev]);
      return newFile;
    } catch (error) {
      console.error("Failed to upload file to Drive", error);
      throw error;
    }
  };

  
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
}
