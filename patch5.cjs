const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(
  `                    <span className="block text-[11px] text-gray-400 mb-1">Option A: Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageFileUpload(e, false)}`,
  `                    <span className="block text-[11px] text-gray-400 mb-1">Option A: Upload Image/Video File</span>
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm"
                      onChange={e => handleImageFileUpload(e, false)}`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
