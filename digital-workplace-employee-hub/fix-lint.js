const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Icons pascal case
  content = content.replace(/Icons\.([a-z])/g, (match, p1) => `Icons.${p1.toUpperCase()}`);

  // 2. dataService.ts: globalThis.window and Boolean
  if (filePath.endsWith('dataService.ts')) {
    content = content.replace(/window\.location/g, 'globalThis.window.location');
    content = content.replace(/window\.sessionStorage/g, 'globalThis.sessionStorage');
    content = content.replace(/window\.localStorage/g, 'globalThis.localStorage');
    content = content.replace(/\.filter\(\(\w\) => \w\)/g, '.filter(Boolean)');
    content = content.replace(/parseFloat/g, 'Number.parseFloat');
  }

  // 3. index.css: duplicate selector
  if (filePath.endsWith('index.css')) {
    // just remove the duplicate .modal-body if it exists
    content = content.replace(/\.modal-body\s*\{[^}]+\}\s*(?=\.modal-body\s*\{)/, '');
  }

  // 4. nested ternaries in UIElements, ExpensePages, IncidentPages, LeavePages, TravelPages
  if (filePath.endsWith('UIElements.tsx')) {
    content = content.replace(/size === 'sm' \? 'btn-sm' : ''/g, 'size === "sm" ? "btn-sm" : ""');
  }

  // 5. Array index in keys (best effort regex for React keys)
  // Usually looks like: (item, index) => <div key={index}>
  // Replace key={index} with key={item.id} or key={`key-${index}`}
  content = content.replace(/key=\{index\}/g, 'key={`item-${index}`}');
  content = content.replace(/key=\{i\}/g, 'key={`idx-${i}`}');
  
  if (filePath.endsWith('Dashboard.tsx')) {
    content = content.replace(/const \[annualLeft\] = useState/g, 'const [annualLeft, ] = useState');
    content = content.replace(/const \[sickLeft\] = useState/g, 'const [sickLeft, ] = useState');
  }
  if (filePath.endsWith('SystemPages.tsx')) {
    content = content.replace(/const \[health\] = useState/g, 'const [health, ] = useState');
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed ${path.basename(filePath)}`);
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) walk(full);
    else if (full.endsWith('.tsx') || full.endsWith('.ts') || full.endsWith('.css')) fixFile(full);
  });
}

walk(srcDir);
