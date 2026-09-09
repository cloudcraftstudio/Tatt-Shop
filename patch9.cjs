const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(
  /<img[\s\S]*?src=\{b\.coverUpPhotoUrl\}[\s\S]*?\/>/,
  `<MediaRenderer src={b.coverUpPhotoUrl} alt="Cover up uploaded" className="w-12 h-12 rounded object-cover border border-red-400" autoPlay={false} />`
);

code = code.replace(
  /<img[\s\S]*?src=\{b\.referencePhotoUrl\}[\s\S]*?\/>/,
  `<MediaRenderer src={b.referencePhotoUrl} alt="Reference uploaded" className="w-12 h-12 rounded object-cover border border-cyan-400" autoPlay={false} />`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
