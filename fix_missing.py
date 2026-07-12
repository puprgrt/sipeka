import os

# Create configHelper.ts
config_helper_content = """import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';

export async function getDbConfig(key: string, defaultVal: any) {
  try {
    const result = await db.select().from(schema.appSettings).where(eq(schema.appSettings.settingKey, key)).limit(1);
    if (result.length > 0) {
      if (result[0].settingValue) {
        return JSON.parse(result[0].settingValue);
      }
    }
  } catch (e) {
    console.error("getDbConfig error", e);
  }
  return defaultVal;
}

export async function setDbConfig(key: string, value: any) {
  try {
    const existing = await db.select().from(schema.appSettings).where(eq(schema.appSettings.settingKey, key)).limit(1);
    if (existing.length > 0) {
      await db.update(schema.appSettings).set({ settingValue: JSON.stringify(value) }).where(eq(schema.appSettings.settingKey, key));
    } else {
      await db.insert(schema.appSettings).values({ settingKey: key, settingValue: JSON.stringify(value) });
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
      nomorTelepon: ""
    },
    pengelola: {
      logoKiri: "",
      logoKanan: "",
      namaInstansiAtas: "PEMERINTAH KABUPATEN GARUT",
      namaInstansiBawah: "NAMA LEMBAGA / SEKOLAH",
      alamat: "Alamat Lembaga",
      email: "",
      website: "",
      nomorTelepon: ""
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
"""
with open('src/utils/configHelper.ts', 'w', encoding='utf-8') as f:
    f.write(config_helper_content)

# Move initMasterData out of server.ts
with open('server.ts', 'r', encoding='utf-8') as f:
    server_content = f.read()

import re
init_start = re.search(r'let masterDataInitPromise: Promise<void> \| null = null;\nasync function initMasterData\(\) \{', server_content)
init_end = re.search(r'return masterDataInitPromise;\n\}\n', server_content)

master_data_content = ""
if init_start and init_end:
    master_data_content = server_content[init_start.start():init_end.end()]
    server_content = server_content[:init_start.start()] + server_content[init_end.end():]

master_data_file = """import { db } from '../db';
import * as schema from '../db/schema';

""" + master_data_content.replace('async function initMasterData', 'export async function initMasterData')

with open('src/utils/masterData.ts', 'w', encoding='utf-8') as f:
    f.write(master_data_file)

# Fix readLetterParamsFile, etc. in server.ts
# It seems they were duplicated in server.ts or I should just remove them from server.ts and import them.
# Let's remove them from server.ts
rlp_start = re.search(r'const letterParamsFilePath = path\.join\(process\.cwd\(\), "pengaturan_surat\.json"\);\n\nasync function readLetterParamsFile\(\) \{', server_content)
rlp_end = re.search(r'async function writeAppSettingsFile\(data: any\) \{\n  await setDbConfig\(\'app_settings\', data\);\n  return true;\n\}\n', server_content)
if rlp_start and rlp_end:
    server_content = server_content[:rlp_start.start()] + server_content[rlp_end.end():]

server_imports = """import { getDbConfig, setDbConfig, readLetterParamsFile, writeLetterParamsFile, readAppSettingsFile, writeAppSettingsFile } from './src/utils/configHelper';
import { initMasterData } from './src/utils/masterData';
"""
server_content = server_content.replace('import settingsRoutes from "./src/routes/settingsRoutes";', 'import settingsRoutes from "./src/routes/settingsRoutes";\n' + server_imports)
with open('server.ts', 'w', encoding='utf-8') as f:
    f.write(server_content)

# Fix settingsRoutes.ts imports
with open('src/routes/settingsRoutes.ts', 'r', encoding='utf-8') as f:
    settings_content = f.read()

settings_imports = """import express from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { readAppSettingsFile, writeAppSettingsFile, readLetterParamsFile, writeLetterParamsFile } from '../utils/configHelper';
"""
settings_content = settings_content.replace("import express from 'express';\nimport { db } from '../db';\nimport * as schema from '../db/schema';", settings_imports)
with open('src/routes/settingsRoutes.ts', 'w', encoding='utf-8') as f:
    f.write(settings_content)

# Fix userRoutes.ts imports
with open('src/routes/userRoutes.ts', 'r', encoding='utf-8') as f:
    user_content = f.read()

user_imports = """import express from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, ne, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { initMasterData } from '../utils/masterData';
"""
user_content = user_content.replace("import express from 'express';\nimport { db } from '../db';\nimport * as schema from '../db/schema';\nimport { eq, ne } from 'drizzle-orm';", user_imports)
with open('src/routes/userRoutes.ts', 'w', encoding='utf-8') as f:
    f.write(user_content)

print("Fixes applied.")
