const fs = require('fs');

let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(/overflow-x-clip/g, 'overflow-x-hidden w-full');
fs.writeFileSync('index.html', indexHtml);

let appTsx = fs.readFileSync('src/App.tsx', 'utf8');
appTsx = appTsx.replace(/overflow-x-clip/g, 'overflow-x-hidden w-full max-w-[100vw]');
fs.writeFileSync('src/App.tsx', appTsx);

console.log('Patched layout boundaries');
