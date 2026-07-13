import os
import re

# Read AssessmentForm.tsx
with open('src/pages/AssessmentForm.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start of the main return statement
return_idx = content.find('  return (\n    <div className="max-w-4xl mx-auto space-y-8 pb-32">')
if return_idx == -1:
    return_idx = content.find('  return (\n    <div className=')
if return_idx == -1:
    return_idx = content.find('  return (')

if return_idx == -1:
    print("Could not find return statement")
    exit(1)

# Split into imports, logic, and UI
imports_end_idx = content.find('export default function AssessmentForm() {')

imports = content[:imports_end_idx]
logic = content[imports_end_idx + len('export default function AssessmentForm() {'):return_idx]
ui = content[return_idx:]

# --- Generate useAssessmentForm.ts ---
hook_imports = imports.replace('export default function AssessmentForm() {', '')

state_vars = re.findall(r'const \[([a-zA-Z0-9_]+), set[a-zA-Z0-9_]+\] = useState', logic)
setters = re.findall(r'const \[[a-zA-Z0-9_]+, (set[a-zA-Z0-9_]+)\] = useState', logic)
refs = re.findall(r'const ([a-zA-Z0-9_]+) = useRef', logic)
functions = re.findall(r'const (handle[a-zA-Z0-9_]+) =', logic)
other_funcs = re.findall(r'const (applyLoadedData|saveDraftToOffline|loadDraftFromOffline|uploadPhotosToDrive|generateDocFromTemplate|submitToSupabase|submitAssessment|handleResolveLocalConflict|getParamLabel) =', logic)

all_exports = list(set(state_vars + setters + refs + functions + other_funcs + ['navigate', 'searchParams', 'editId']))

# Remove some ui-specific imports from the hook if needed, but it's safe to keep them.
# The custom hook needs to be created in src/hooks, but that folder might not exist.
os.makedirs('src/hooks', exist_ok=True)

hook_content = hook_imports + '''

export function useAssessmentForm() {
''' + logic + '''
  return {
    ''' + ',\n    '.join(all_exports) + '''
  };
}
'''

with open('src/hooks/useAssessmentForm.ts', 'w', encoding='utf-8') as f:
    f.write(hook_content)

# --- Generate new AssessmentForm.tsx ---
new_component_imports = imports + '''
import { useAssessmentForm } from "../hooks/useAssessmentForm";
'''

destructuring = '  const {\n    ' + ',\n    '.join(all_exports) + '\n  } = useAssessmentForm();\n\n'

new_component_content = new_component_imports + '''
export default function AssessmentForm() {
''' + destructuring + ui

with open('src/pages/AssessmentForm.tsx', 'w', encoding='utf-8') as f:
    f.write(new_component_content)

print("Done Refactoring AssessmentForm")
