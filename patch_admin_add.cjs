const fs = require('fs');
const file = 'src/components/AdminDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const handleAdditionalImagesUpload = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{/,
  `const handleAdditionalImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploadingMedia(true);`
);

code = code.replace(
  /setNewAdditionalImages\(prev => \[\.\.\.prev, \.\.\.newBase64Images\]\);/,
  `setNewAdditionalImages(prev => [...prev, ...newBase64Images]);
    setIsUploadingMedia(false);`
);

code = code.replace(
  /const handleImageFileUpload = async \(e: React\.ChangeEvent<HTMLInputElement>, isBefore = false\) => \{/,
  `const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isBefore = false) => {
    setIsUploadingMedia(true);`
);

code = code.replace(
  /\} else \{\s*setNewImageUrl\(base64\);\s*\}/,
  `} else {
          setNewImageUrl(base64);
        }
        setIsUploadingMedia(false);`
);

// We need to catch errors in handleImageFileUpload to reset state
code = code.replace(
  /setNewImageUrl\(base64\);\s*\}/,
  `setNewImageUrl(base64);
        }`
);

// find the button inside handleAddGalleryItem's form (the New Tattoo tab)
// It is around line 777
code = code.replace(
  /className="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500\/20"\s*>/,
  `disabled={isUploadingMedia}
                className="w-full py-3 mt-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >`
);

code = code.replace(
  /Add to Portfolio\s*<\/button>/,
  `{isUploadingMedia ? 'Uploading...' : 'Add to Portfolio'}
              </button>`
);

fs.writeFileSync(file, code);
console.log('Patched AdminDashboard.tsx for new items');
