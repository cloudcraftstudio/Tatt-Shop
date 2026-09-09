const fs = require('fs');

function patchFile(path) {
  let code = fs.readFileSync(path, 'utf8');
  code = code.replace(
    /const base64 = await storageService\.fileToBase64\(file\);/g,
    `const base64 = await uploadLargeMedia(file);`
  );
  if (!code.includes('import { uploadLargeMedia }')) {
    code = `import { uploadLargeMedia } from "../services/mediaStore";\n` + code;
  }
  fs.writeFileSync(path, code);
}

patchFile('src/components/BookingSection.tsx');
patchFile('src/components/StudioPhotoModal.tsx');
patchFile('src/components/LiveSplashStudio.tsx');

