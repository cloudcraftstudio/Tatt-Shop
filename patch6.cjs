const fs = require('fs');
let code = fs.readFileSync('src/components/BulkGalleryUploadModal.tsx', 'utf8');

code = code.replace(
  /const base64 = await storageService\.fileToBase64\(file\);/g,
  `const base64 = await uploadLargeMedia(file);`
);

code = `import { uploadLargeMedia } from "../services/mediaStore";\n` + code;

fs.writeFileSync('src/components/BulkGalleryUploadModal.tsx', code);
