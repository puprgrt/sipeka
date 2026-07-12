import re

with open('server.ts', 'r', encoding='utf-8') as f:
    content = f.read()

def extract_chunk(content, start_marker, end_marker, replacement=""):
    start_match = re.search(start_marker, content)
    end_match = re.search(end_marker, content, re.DOTALL)
    if not start_match or not end_match:
        return None, content
    
    start_pos = start_match.start()
    end_pos = end_match.end()
    
    chunk = content[start_pos:end_pos]
    
    # fix router
    chunk = chunk.replace('app.get(', 'router.get(')
    chunk = chunk.replace('app.post(', 'router.post(')
    chunk = chunk.replace('app.put(', 'router.put(')
    chunk = chunk.replace('app.delete(', 'router.delete(')
    
    new_content = content[:start_pos] + replacement + content[end_pos:]
    return chunk, new_content

# 1. Reference Routes (Components, Klasifikasi, Katalog, Dinas)
# Starts with: app.get("/api/components"
# Ends with: end of app.put("/api/dinas"
ref_start = r'app\.get\("/api/components", async \(req, res\) => \{'
ref_end = r'app\.put\("/api/dinas", async \(req, res\) => \{.*?\n\}\);\n'

ref_chunk, content = extract_chunk(content, ref_start, ref_end, "app.use(referenceRoutes);\n\n")

if ref_chunk:
    ref_file = """import express from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Dummy initMasterData for now to prevent errors
async function initMasterData() {}

""" + ref_chunk + "\nexport default router;\n"
    with open('src/routes/referenceRoutes.ts', 'w', encoding='utf-8') as f:
        f.write(ref_file)

# 2. User Routes (Users, Parameters, Profile)
# Starts with: app.post("/api/users/fcm-token"
# Ends with: end of app.put("/api/profile"
user_start = r'app\.post\("/api/users/fcm-token", async \(req, res\) => \{'
user_end = r'app\.put\("/api/profile", async \(req, res\) => \{.*?\n\}\);\n'

user_chunk, content = extract_chunk(content, user_start, user_end, "app.use(userRoutes);\n\n")

if user_chunk:
    user_file = """import express from 'express';
import { db } from '../db';
import * as schema from '../db/schema';
import { eq, ne } from 'drizzle-orm';

const router = express.Router();

""" + user_chunk + "\nexport default router;\n"
    with open('src/routes/userRoutes.ts', 'w', encoding='utf-8') as f:
        f.write(user_file)

# 3. Settings Routes (App Settings, Pengaturan Surat)
# Starts with: app.get("/api/app-settings"
# Ends with: end of app.put("/api/pengaturan-surat"
set_start = r'app\.get\("/api/app-settings", async \(req, res\) => \{'
set_end = r'app\.put\("/api/pengaturan-surat", async \(req, res\) => \{.*?\n\}\);\n'

set_chunk, content = extract_chunk(content, set_start, set_end, "app.use(settingsRoutes);\n\n")

if set_chunk:
    set_file = """import express from 'express';
import { db } from '../db';
import * as schema from '../db/schema';

const router = express.Router();

""" + set_chunk + "\nexport default router;\n"
    with open('src/routes/settingsRoutes.ts', 'w', encoding='utf-8') as f:
        f.write(set_file)

# Fix imports in server.ts
imports = """import referenceRoutes from "./src/routes/referenceRoutes";
import userRoutes from "./src/routes/userRoutes";
import settingsRoutes from "./src/routes/settingsRoutes";
"""
content = content.replace('import assessmentRoutes from "./src/routes/assessmentRoutes";', 'import assessmentRoutes from "./src/routes/assessmentRoutes";\n' + imports)

with open('server.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Extraction completed successfully")
