const fs = require('fs');
const path = require('path');

function fixImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixImports(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes('import { apiFetch }')) {
        const lines = content.split('\n');
        // Remove ALL existing apiFetch imports
        const filteredLines = lines.filter(line => !line.includes('import { apiFetch } from'));
        
        // Add it to the very top
        const relativeDir = path.relative(path.join(process.cwd(), 'src'), path.dirname(fullPath));
        const depth = relativeDir === '' ? 0 : relativeDir.split(path.sep).length;
        const importPrefix = depth === 0 ? './lib/api' : '../'.repeat(depth) + 'lib/api';
        
        filteredLines.unshift(`import { apiFetch } from "${importPrefix}";`);
        
        const newContent = filteredLines.join('\n');
        if (newContent !== content) {
           fs.writeFileSync(fullPath, newContent);
           console.log('Fixed imports: ' + fullPath);
        }
      }
    }
  }
}

fixImports(path.join(process.cwd(), 'src'));
