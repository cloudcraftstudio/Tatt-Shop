const fs = require('fs');
const file = 'server.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const \{ fileName, contentType \} = req\.body;\s*if \(!fileName \|\| !contentType\) \{\s*return res\.status\(400\)\.json\(\{ error: 'fileName and contentType are required\.' \}\);\s*\}/,
  `const { fileName, contentType } = req.body;
    if (!fileName) {
      return res.status(400).json({ error: 'fileName is required.' });
    }
    const finalContentType = contentType || 'application/octet-stream';`
);

code = code.replace(
  /ContentType: contentType,/,
  `ContentType: finalContentType,`
);

fs.writeFileSync(file, code);
console.log('Patched server.ts for empty contentType');
