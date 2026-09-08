const fs = require('fs');

let code = fs.readFileSync('./src/index.css', 'utf8');
console.log(code.includes('z-index'));
