import { google } from "googleapis";
import fs from "fs";
import path from "path";
import stream from "stream";

// Path to the service account key (User needs to provide this)
const KEY_PATH = path.join(process.cwd(), "service-account.json");
const SYSTEM_FOLDER_ID = process.env.SYSTEM_DRIVE_FOLDER_ID || ""; // Set this in .env

/**
 * Initializes the Google Drive API client using a Service Account.
 */
function getDriveService() {
  if (!fs.existsSync(KEY_PATH)) {
    console.warn(`[WARNING] service-account.json tidak ditemukan di ${KEY_PATH}. Pencadangan ke Drive Sistem akan dilewati.`);
    return null;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEY_PATH,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });
    return google.drive({ version: "v3", auth });
  } catch (error) {
    console.error("Gagal menginisialisasi Google Drive API:", error);
    return null;
  }
}

/**
 * Uploads a file buffer to the System Google Drive.
 * @param fileBuffer The file content as a Buffer
 * @param fileName The name of the file to save as
 * @param mimeType The mime type of the file
 * @returns The webViewLink of the uploaded file, or null if failed/skipped
 */
export async function uploadToSystemDrive(
  fileBuffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<string | null> {
  const drive = getDriveService();
  if (!drive) return null;

  try {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);

    const fileMetadata: any = {
      name: fileName,
    };
    
    if (SYSTEM_FOLDER_ID) {
      fileMetadata.parents = [SYSTEM_FOLDER_ID];
    }

    const media = {
      mimeType,
      body: bufferStream,
    };

    const res = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink",
    });

    const fileId = res.data.id;
    if (fileId) {
      // Make it public so admin frontend can view it
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });
    }

    return res.data.webViewLink || null;
  } catch (error: any) {
    console.error("Gagal mengunggah ke Drive Sistem:", error.message);
    return null;
  }
}
