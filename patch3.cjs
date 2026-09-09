const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(
  /const base64 = await storageService\.fileToBase64\(files\[i\]\);/g,
  `const base64 = await uploadLargeMedia(files[i]);`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
