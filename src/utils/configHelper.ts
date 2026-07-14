import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export async function getDbConfig(key: string, defaultVal: any) {
  try {
    const result = await db.select().from(schema.appConfig).where(eq(schema.appConfig.id, key)).limit(1);
    if (result.length > 0) {
      if (result[0].value) {
        return JSON.parse(result[0].value);
      }
    }
  } catch (e) {
    console.error("getDbConfig error", e);
  }
  return defaultVal;
}

export async function setDbConfig(key: string, value: any) {
  try {
    const existing = await db.select().from(schema.appConfig).where(eq(schema.appConfig.id, key)).limit(1);
    if (existing.length > 0) {
      await db.update(schema.appConfig).set({ value: JSON.stringify(value) }).where(eq(schema.appConfig.id, key));
    } else {
      await db.insert(schema.appConfig).values({ id: key, value: JSON.stringify(value) });
    }
  } catch (e) {
    console.error("setDbConfig error", e);
  }
}

export async function readLetterParamsFile() {
  let defaultVal: any = {
    sistem: {
      logoKiri: "",
      logoKanan: "",
      namaInstansiAtas: "PEMERINTAH KABUPATEN GARUT",
      namaInstansiBawah: "DINAS PEKERJAAN UMUM DAN PENATAAN RUANG",
      alamat: "Jalan Raya Pembangunan No. 123, Sukagalih, Kec. Tarogong Kidul, Kabupaten Garut, Jawa Barat 44151",
      email: "",
      website: "",
      nomorTelepon: "",
      namaKepala: "Ir. H. Kepala Dinas, M.T.",
      nipKepala: "19700101 199803 1 004",
      jabatan: "Kepala Dinas Pekerjaan Umum dan Penataan Ruang"
    },
    pengelola: {
      logoKiri: "",
      logoKanan: "",
      namaInstansiAtas: "PEMERINTAH KABUPATEN GARUT",
      namaInstansiBawah: "NAMA LEMBAGA / SEKOLAH",
      alamat: "Alamat Lembaga",
      email: "",
      website: "",
      nomorTelepon: "",
      namaKepala: "Nama Kepala Lembaga",
      nipKepala: "19800101 200501 1 001",
      jabatan: "Kepala Sekolah"
    }
  };

  const dbVal = await getDbConfig('pengaturan_surat', defaultVal);
  return {
    sistem: { ...defaultVal.sistem, ...(dbVal?.sistem || {}) },
    pengelola: { ...defaultVal.pengelola, ...(dbVal?.pengelola || {}) }
  };
}

export async function writeLetterParamsFile(data: any) {
  await setDbConfig('pengaturan_surat', data);
  return true;
}

export async function readAppSettingsFile() {
  let defaultVal: any = {
    logoKiri: "https://upload.wikimedia.org/wikipedia/commons/b/b3/Coat_of_arms_of_Garut_Regency.svg",
    logoKanan: "https://upload.wikimedia.org/wikipedia/commons/0/06/Logo_PUPR.png"
  };
  const dbVal = await getDbConfig('app_settings', defaultVal);
  return { ...defaultVal, ...(dbVal || {}) };
}

export async function writeAppSettingsFile(data: any) {
  await setDbConfig('app_settings', data);
  return true;
}

export async function readAiSettings() {
  let defaultVal: any = {
    apiKey: "",
    model: "gemini-3.5-flash",
    autoAnalyze: true,
    confidenceThreshold: 85,
    visionPrompt: "You are a civil engineering expert analyzing a building component for damage.\n\nPlease analyze the provided image of the component.\nDetermine the damage level classification based on these categories:\n- \"Rusak Sangat Ringan\"\n- \"Rusak Ringan\"\n- \"Rusak Sedang\"\n- \"Rusak Berat\"\n- \"Rusak Sangat Berat\"\n- \"Tidak Rusak\"\n\nAlso estimate the percentage of the volume/area of the component that is damaged (0 to 100).\nFinally, provide a brief reasoning for your assessment.",
    documentPrompt: "You are an expert AI assistant that analyzes building inspection photos.\nPlease extract findings and bounding boxes. Respond ONLY with valid JSON.\nFormat: [{ \"label\": \"damage_type\", \"box\": [ymin, xmin, ymax, xmax] }]"
  };
  const dbVal = await getDbConfig('ai_settings', defaultVal);
  return { ...defaultVal, ...(dbVal || {}) };
}

export async function writeAiSettings(data: any) {
  await setDbConfig('ai_settings', data);
  return true;
}

export async function readDocumentTemplates() {
  const { getDefaultTemplates } = await import('./templateUtils');
  const defaults = getDefaultTemplates();
  const dbVal = await getDbConfig('document_templates', null);
  
  if (!dbVal) return defaults;
  
  // Merge: pastikan semua template default ada, tapi gunakan konten dari DB jika sudah diedit
  return defaults.map(defaultTpl => {
    const saved = (dbVal as any[]).find((t: any) => t.id === defaultTpl.id);
    if (saved) {
      return {
        ...defaultTpl,
        kontenHtml: saved.kontenHtml || defaultTpl.kontenHtml,
        driveLink: saved.driveLink !== undefined ? saved.driveLink : defaultTpl.driveLink,
        updatedAt: saved.updatedAt,
      };
    }
    return defaultTpl;
  });
}

export async function writeDocumentTemplates(templates: any[]) {
  // Simpan hanya id, kontenHtml, dan updatedAt (metadata lain ada di default)
  const toSave = templates.map((t: any) => ({
    id: t.id,
    kontenHtml: t.kontenHtml,
    driveLink: t.driveLink,
    updatedAt: t.updatedAt || new Date().toISOString(),
  }));
  await setDbConfig('document_templates', toSave);
  return true;
}
