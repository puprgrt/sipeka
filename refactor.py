import re

with open('server.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Define the boundaries of the assessment routes
# Route starts with app.get("/api/assessments" and ends at the end of app.delete("/api/assessments/:id"
start_match = re.search(r'app\.get\("/api/assessments", async \(req, res\) => \{', content)
end_match = re.search(r'app\.delete\("/api/assessments/:id", async \(req, res\) => \{.*?\n\}\);\n', content, re.DOTALL)

if not start_match or not end_match:
    print("Could not find start or end bounds for assessments.")
    exit(1)

start_pos = start_match.start()
end_pos = end_match.end()

assessment_chunk = content[start_pos:end_pos]

# We need to remove notifications from the chunk
# Notifications are between app.get("/api/notifications/stream" and the end of read-all
notif_start = re.search(r'app\.get\("/api/notifications/stream"', assessment_chunk)
notif_end = re.search(r'app\.put\("/api/notifications/read-all", async \(req, res\) => \{.*?\n\}\);\n', assessment_chunk, re.DOTALL)

if notif_start and notif_end:
    assessment_chunk = assessment_chunk[:notif_start.start()] + assessment_chunk[notif_end.end():]

# Now let's transform the chunk to use `router` instead of `app`
assessment_chunk = assessment_chunk.replace('app.get("/api/assessments', 'router.get("')
assessment_chunk = assessment_chunk.replace('app.post("/api/assessments', 'router.post("')
assessment_chunk = assessment_chunk.replace('app.put("/api/assessments', 'router.put("')
assessment_chunk = assessment_chunk.replace('app.delete("/api/assessments', 'router.delete("')

# And remove `/api/assessments` from the paths
assessment_chunk = assessment_chunk.replace('router.get("', 'router.get("/')
assessment_chunk = assessment_chunk.replace('router.post("', 'router.post("/')
assessment_chunk = assessment_chunk.replace('router.put("', 'router.put("/')
assessment_chunk = assessment_chunk.replace('router.delete("', 'router.delete("/')
assessment_chunk = assessment_chunk.replace('router.get("//', 'router.get("/')
assessment_chunk = assessment_chunk.replace('router.post("//', 'router.post("/')
assessment_chunk = assessment_chunk.replace('router.put("//', 'router.put("/')
assessment_chunk = assessment_chunk.replace('router.delete("//', 'router.delete("/')

# Create the new routes file
routes_content = f"""import express from 'express';
import {{ db }} from '../db';
import * as schema from '../db/schema';
import {{ eq, and, ne, inArray, like }} from 'drizzle-orm';
import {{ logAuditTrail, sendDisposisiNotification }} from '../utils/audit';

const router = express.Router();

{assessment_chunk}

export default router;
"""

with open('src/routes/assessmentRoutes.ts', 'w', encoding='utf-8') as f:
    f.write(routes_content)

print("Created src/routes/assessmentRoutes.ts")

# Now we need to modify server.ts
new_content = content[:start_pos] + "app.use('/api/assessments', assessmentRoutes);\n\n"
if notif_start and notif_end:
    # put the notifications back in server.ts
    notif_chunk = content[start_pos + notif_start.start():start_pos + notif_end.end()]
    new_content += notif_chunk + "\n"
    
new_content += content[end_pos:]

# Add imports
new_content = new_content.replace('import aiRoutes from "./src/routes/aiRoutes";', 'import aiRoutes from "./src/routes/aiRoutes";\nimport assessmentRoutes from "./src/routes/assessmentRoutes";\nimport { logAuditTrail, sendDisposisiNotification } from "./src/utils/audit";')

# Remove logAuditTrail and sendDisposisiNotification definitions from server.ts
log_func_start = re.search(r'async function logAuditTrail\(', new_content)
if log_func_start:
    log_func_end = re.search(r'\}\n\napp\.get\("/api/audit-trails"', new_content)
    if log_func_end:
        log_chunk = new_content[log_func_start.start():log_func_end.start() + 1]
        new_content = new_content[:log_func_start.start()] + new_content[log_func_end.start() + 1:]
        
        # Save to utils/audit.ts
        audit_content = f"""import express from 'express';
import {{ db }} from '../db';
import * as schema from '../db/schema';
import {{ getMessaging }} from 'firebase-admin/messaging';

{log_chunk}

export async function sendDisposisiNotification(
  userId: number,
  role: string,
  title: string,
  body: string,
  idPermohonan: string
) {{
  try {{
    await db.insert(schema.notifications).values({{
      userId,
      targetRole: role,
      title,
      body,
      idPermohonan,
      isRead: false
    }});

    const [user] = await db.select().from(schema.users).where(eq(schema.users.idUser, userId));
    if (user && user.fcmToken) {{
      try {{
        await getMessaging().send({{
          token: user.fcmToken,
          notification: {{ title, body }},
          data: {{ idPermohonan, type: 'DISPOSISI' }}
        }});
      }} catch(err) {{
        console.error("FCM Send Error:", err);
      }}
    }}
  }} catch (err) {{
    console.error("Failed to create disposisi notifications", err);
  }}
}}
"""
        with open('src/utils/audit.ts', 'w', encoding='utf-8') as f:
            f.write(audit_content)
            
# Remove sendDisposisiNotification from server.ts
send_notif_start = re.search(r'async function sendDisposisiNotification\(', new_content)
if send_notif_start:
    send_notif_end = re.search(r'\}\n\napp\.get\("/api/notifications/stream"', new_content)
    if send_notif_end:
        new_content = new_content[:send_notif_start.start()] + new_content[send_notif_end.start() + 1:]

with open('server.ts', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Updated server.ts and created utils")
