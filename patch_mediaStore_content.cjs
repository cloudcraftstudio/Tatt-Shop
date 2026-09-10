const fs = require('fs');
const file = 'src/services/mediaStore.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /body: JSON\.stringify\(\{ fileName: file\.name, contentType: file\.type \}\)/,
  `body: JSON.stringify({ fileName: file.name, contentType: file.type || 'video/mp4' })`
);

code = code.replace(
  /'Content-Type': file\.type/,
  `'Content-Type': file.type || 'video/mp4'`
);

// Fix the catch block for `if (!response.ok)`
code = code.replace(
  /if \(response\.ok\) \{/,
  `if (!response.ok) {
      const errText = await response.text();
      throw new Error('Backend presigned URL generation failed: ' + errText);
    }
    if (response.ok) {`
);

fs.writeFileSync(file, code);
console.log('Patched mediaStore.ts for empty file.type');
