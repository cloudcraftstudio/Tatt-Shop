const fs = require('fs');
const file = 'src/components/AdminDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/console\.error/g, 'console.warn');

fs.writeFileSync(file, code);
console.log('Patched AdminDashboard.tsx to warn instead of error');
