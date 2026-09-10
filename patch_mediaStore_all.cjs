const fs = require('fs');
const file = 'src/services/mediaStore.ts';
let code = fs.readFileSync(file, 'utf8');

// Remove the early return for small files so EVERYTHING uses Cloudflare
code = code.replace(
  /\/\/ If it's very small, just read the whole thing at once\s*if \(file\.size < CHUNK_SIZE\) \{\s*return new Promise\(\(resolve, reject\) => \{\s*const reader = new FileReader\(\);\s*reader\.onload = \(\) => resolve\(reader\.result as string\);\s*reader\.onerror = \(\) => reject\(new Error\('Failed to read file'\)\);\s*reader\.readAsDataURL\(file\);\s*\}\);\s*\}/,
  `// (Removed small file base64 conversion - ALL files will now route to Cloudflare)`
);

// We need to gracefully handle Firestore quota errors during metadata saves as well
// Just in case it was the metadata save failing.
fs.writeFileSync(file, code);
console.log('Patched mediaStore.ts to send ALL files to Cloudflare');
