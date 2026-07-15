import { useState, useEffect, useCallback } from 'react';
import { listDriveFiles } from '../lib/driveService';
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

  return { files, setFiles, loadingFiles, fetchFiles };
}
