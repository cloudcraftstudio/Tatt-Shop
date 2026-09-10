const fs = require('fs');
const file = 'src/services/mediaStore.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /console\.warn\('Cloudflare R2 not configured or upload failed\. Falling back to Firestore chunking\.', err\);\s*\}/,
  `console.warn('Cloudflare R2 not configured or upload failed. Falling back to Firestore chunking.', err);
  }
  
  // COMPLETELY BLOCK FIRESTORE CHUNKING TO PREVENT QUOTA EXHAUSTION
  // Since we know they hit the 20k write limit, do not attempt to write 70 chunks.
  if (file.size > CHUNK_SIZE) {
    throw new Error('Cloudflare upload failed, and this file is too large to safely store in the database without hitting quota limits. Please ensure Cloudflare R2 is configured correctly.');
  }`
);

fs.writeFileSync(file, code);
console.log('Patched mediaStore.ts');
