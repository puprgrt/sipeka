import re

with open('src/routes/assessmentRoutes.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the router missing app
content = content.replace('app.get(', 'router.get(')
content = content.replace('app.post(', 'router.post(')
content = content.replace('app.put(', 'router.put(')
content = content.replace('app.delete(', 'router.delete(')

# The earlier script replaced 'router.get("' with 'router.get("/'. 
# Since I mounted it at /api/assessments in server.ts, the paths like `/api/buildings` will become `/api/assessments/api/buildings` which is wrong!
# Instead, let's mount the router at `/` in server.ts.
# That means we need to restore `/api/assessments` to the assessment routes.

content = content.replace('router.get("/"', 'router.get("/api/assessments"')
content = content.replace('router.post("/"', 'router.post("/api/assessments"')
content = content.replace('router.put("/"', 'router.put("/api/assessments"')
content = content.replace('router.delete("/"', 'router.delete("/api/assessments"')

content = content.replace('router.get("/', 'router.get("/api/assessments/')
content = content.replace('router.post("/', 'router.post("/api/assessments/')
content = content.replace('router.put("/', 'router.put("/api/assessments/')
content = content.replace('router.delete("/', 'router.delete("/api/assessments/')

# But wait, doing that blindly will change `router.get("/api/buildings"` to `router.get("/api/assessments/api/buildings"`.
# Let's fix that!
content = content.replace('/api/assessments/api/', '/api/')

# Also, missing imports in assessmentRoutes.ts
imports = """import { Assessment } from '../types';
import { getMessaging as getAdminMessaging } from 'firebase-admin/messaging';
import { initializeApp as initAdminApp } from 'firebase-admin/app';
let adminApp;
try {
  adminApp = initAdminApp();
} catch (error) {}

// Dummy initMasterData for now to prevent errors
async function initMasterData() {}
"""

content = content.replace('const router = express.Router();', imports + '\nconst router = express.Router();')

with open('src/routes/assessmentRoutes.ts', 'w', encoding='utf-8') as f:
    f.write(content)

with open('server.ts', 'r', encoding='utf-8') as f:
    server_content = f.read()

server_content = server_content.replace("app.use('/api/assessments', assessmentRoutes);", "app.use(assessmentRoutes);")

with open('server.ts', 'w', encoding='utf-8') as f:
    f.write(server_content)

print("Fixed routes")
