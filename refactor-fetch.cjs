const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Basic check
      if (content.includes('fetch(') && (content.includes('"/api/') || content.includes('`/api/'))) {
        
        // Use a simpler string replacement in a loop to avoid complex regex issues
        let newContent = content;
        newContent = newContent.split('await fetch("/api/').join('await apiFetch("/api/');
        newContent = newContent.split('await fetch(`/api/').join('await apiFetch(`/api/');
        newContent = newContent.split('fetch("/api/').join('apiFetch("/api/');
        newContent = newContent.split('fetch(`/api/').join('apiFetch(`/api/');
        
        if (newContent !== content) {
          const relativeDir = path.relative(path.join(process.cwd(), 'src'), path.dirname(fullPath));
          const depth = relativeDir === '' ? 0 : relativeDir.split(path.sep).length;
          const importPrefix = depth === 0 ? './lib/api' : '../'.repeat(depth) + 'lib/api';
          
          if (!newContent.includes('import { apiFetch }')) {
             const lines = newContent.split('\n');
             let lastImportIndex = -1;
             for (let i = 0; i < lines.length; i++) {
               if (lines[i].trim().startsWith('import ')) lastImportIndex = i;
             }
             if (lastImportIndex >= 0) {
               lines.splice(lastImportIndex + 1, 0, `import { apiFetch } from "${importPrefix}";`);
             } else {
               lines.unshift(`import { apiFetch } from "${importPrefix}";`);
             }
             fs.writeFileSync(fullPath, lines.join('\n'));
          } else {
             fs.writeFileSync(fullPath, newContent);
          }
          console.log('Updated: ' + fullPath);
        }
      }
    }
  }
}

processDirectory(path.join(process.cwd(), 'src'));
