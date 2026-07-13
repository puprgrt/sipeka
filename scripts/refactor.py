import re

with open('src/pages/Dashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add import
content = content.replace(
    'import StaffPerformancePanel from "../components/StaffPerformancePanel";',
    'import StaffPerformancePanel from "../components/StaffPerformancePanel";\nimport SupportTicketPanel from "../components/dashboard/SupportTicketPanel";'
)

# 2. Remove states (lines 61-66ish)
state_regex = re.compile(r'  const \[selectedTicket, setSelectedTicket\].*?const \[currentChatReplyText, setCurrentChatReplyText\] = useState\(\"\"\);\n', re.DOTALL)
content = state_regex.sub('', content)

# 3. Remove handlers
handler_regex = re.compile(r'    // Handler to submit a new message in chat.*?setIsCreatingTicket\(false\);\n    };\n', re.DOTALL)
content = handler_regex.sub('', content)

# 4. Remove UI and insert <SupportTicketPanel ... />
ui_regex = re.compile(r'          /\* Sub-tab: Tickets list and chat \*/\n          <div className=\"grid grid-cols-1 lg:grid-cols-12 gap-6\">.*?</AnimatePresence>', re.DOTALL)
content = ui_regex.sub('          {/* Sub-tab: Tickets list and chat */}\n          <SupportTicketPanel tickets={tickets} setTickets={setTickets} />', content)

with open('src/pages/Dashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
