const fs = require('fs');
const file = 'src/services/storage.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/console\.error/g, 'console.warn');

fs.writeFileSync(file, code);
console.log('Patched storage.ts to warn instead of error');
