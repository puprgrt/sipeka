import { useState, useEffect, useCallback } from 'react';
import { listDriveFiles, createDriveFolder, uploadFileToDrive, deleteFileFromDrive } from '../lib/driveService';
import { FileItem } from '../pages/FileManager';

export function useDriveFiles(currentFolder: string | null) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);

  const fetchFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const response = await fetch(`/api/files`);
      if (!response.ok) throw new Error("Failed to fetch files from database");
      const data = await response.json();
      setFiles(data);
    } catch (error: any) {
      console.error("Failed to fetch files from API", error);
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
    } catch (error: any) {
      console.error("Failed to create folder in Drive", error);
      if (error?.message === "Not authenticated" || error?.message?.includes("authenticated")) {
        console.warn("Using mock data due to unauthenticated state");
        const newFolder: FileItem = {
          id: "mock-folder-" + Date.now(),
          name: folderName,
          type: 'folder',
          updatedAt: new Date().toISOString(),
          author: activeUserName,
          folderId: currentFolder,
          accessRole: ["Administrator", "Kadis", "Kabid", "Koordinator", "Tim_Teknis", "Operator", "Pengelola_Bangunan"],
          activities: [
            { action: "Folder baru diciptakan (Mock)", time: new Date().toISOString(), user: activeUserName }
          ]
        };
        setFiles(prev => [...prev, newFolder]);
        return newFolder;
      }
      throw error;
    }
  };

  const uploadFile = async (file: File, activeUserName: string) => {
    try {
      // 1. (Opsional) Tetap upload ke Google Drive pribadi User (jika terkoneksi/diinginkan)
      let urlGdriveUser = "";
      let driveFileId = "file-" + Date.now();
      try {
        const df = await uploadFileToDrive(file, currentFolder);
        urlGdriveUser = df.webViewLink || df.webContentLink;
        driveFileId = df.id;
      } catch (err: any) {
        console.warn("Skipping personal GDrive upload due to auth error", err);
      }
      
      // 2. Upload ke sistem backup (akan masuk ke DB & Drive Admin)
      const formData = new FormData();
      formData.append("file", file);
      // Hardcode idUser = 1 untuk sementara, karena kita belum menyimpan idUser di localStorage
      formData.append("idUser", "1"); 
      formData.append("namaFile", file.name);
      if (urlGdriveUser) {
        formData.append("urlGdriveUser", urlGdriveUser);
      }
      formData.append("tipeDokumen", "Unggahan_Bebas");

      const response = await fetch("/api/drive/backup", {
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error("Gagal mengunggah ke backup server");
      const data = await response.json();
      
      let type: FileItem['type'] = 'other';
      if (file.type === 'application/pdf') type = 'pdf';
      else if (file.type?.startsWith('image/')) type = 'image';
      else if (file.type?.includes('word')) type = 'word';
      else if (file.type?.includes('spreadsheet') || file.type?.includes('excel')) type = 'excel';

      const newFile: FileItem = {
        id: data.document?.idDokumen || driveFileId,
        name: file.name,
        type,
        size: file.size,
        updatedAt: new Date().toISOString(),
        author: activeUserName,
        folderId: currentFolder,
        accessRole: ["Administrator", "Kadis", "Kabid", "Koordinator", "Tim_Teknis", "Operator", "Pengelola_Bangunan"],
        previewUrl: data.document?.urlGdriveSistem || urlGdriveUser || URL.createObjectURL(file),
        activities: [
          { action: "Berkas diunggah & dicadangkan", time: new Date().toISOString(), user: activeUserName }
        ]
      };

      setFiles(prev => [newFile, ...prev]);
      return newFile;
    } catch (error: any) {
      console.error("Failed to upload file to Drive", error);
      if (error?.message === "Not authenticated" || error?.message?.includes("authenticated")) {
        console.warn("Using mock data due to unauthenticated state");
        let type: FileItem['type'] = 'other';
        if (file.type === 'application/pdf') type = 'pdf';
        else if (file.type?.startsWith('image/')) type = 'image';
        else if (file.type?.includes('word')) type = 'word';
        else if (file.type?.includes('spreadsheet') || file.type?.includes('excel')) type = 'excel';
        
        const newFile: FileItem = {
          id: "mock-file-" + Date.now(),
          name: file.name,
          type,
          size: file.size,
          updatedAt: new Date().toISOString(),
          author: activeUserName,
          folderId: currentFolder,
          accessRole: ["Administrator", "Kadis", "Kabid", "Koordinator", "Tim_Teknis", "Operator", "Pengelola_Bangunan"],
          previewUrl: URL.createObjectURL(file),
          activities: [
            { action: "Berkas diunggah (Mock)", time: new Date().toISOString(), user: activeUserName }
          ]
        };
        setFiles(prev => [newFile, ...prev]);
        return newFile;
      }
      throw error;
    }
  };

  
  const deleteFile = async (fileId: string) => {
    try {
      await deleteFileFromDrive(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
    } catch (error: any) {
      console.error("Failed to delete file from Drive", error);
      if (error?.message === "Not authenticated" || error?.message?.includes("authenticated") || fileId.startsWith("mock-")) {
        setFiles(prev => prev.filter(f => f.id !== fileId));
        return;
      }
      throw error;
    }
  };

  return { files, setFiles, loadingFiles, fetchFiles, createFolder, uploadFile, deleteFile };
}
