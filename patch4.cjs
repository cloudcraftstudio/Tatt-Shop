const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(
  /const base64 = await storageService\.fileToBase64\(file\);/g,
  `const base64 = await uploadLargeMedia(file);`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
