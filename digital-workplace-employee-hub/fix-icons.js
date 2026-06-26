const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Icons.tsx');
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/([a-z]+): \(\) =>/g, (match, p1) => {
  return p1.charAt(0).toUpperCase() + p1.slice(1) + ': () =>';
});
fs.writeFileSync(file, content);
