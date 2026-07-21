import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "dummy-account-id";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "dummy-access-key";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "dummy-secret-key";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "sipeka-files";

export const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadToR2(fileName: string, fileBuffer: Buffer, mimeType: string): Promise<string> {
  try {
    const key = `uploads/${Date.now()}_${fileName}`;
    
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    });
    
    await s3Client.send(command);
    
    // Return key so we can generate signed URL later, or public URL if bucket is public
    return key;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw new Error("Gagal mengunggah file ke Cloudflare R2");
  }
}

export async function getSignedUrlFromR2(key: string, expiresIn = 3600): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    console.error("Error generating signed URL from R2:", error);
    throw new Error("Gagal membuat URL akses file");
  }
}

export async function deleteFromR2(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting from R2:", error);
    throw new Error("Gagal menghapus file dari Cloudflare R2");
  }
}
