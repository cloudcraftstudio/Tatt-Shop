const fs = require('fs');
const file = 'src/components/AdminDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /setIsUploadingMedia\(false\); \/\/ Make sure it's reset on error\s*\}\s*setNewAdditionalImages\(prev => \[\.\.\.prev, \.\.\.newBase64Images\]\);\s*setIsUploadingMedia\(false\);/,
  `setNewAdditionalImages(prev => [...prev, ...newBase64Images]);
    setIsUploadingMedia(false);`
);

code = code.replace(
  /const handleImageFileUpload = async \(e: React\.ChangeEvent<HTMLInputElement>, isBefore = false\) => \{\s*setIsUploadingMedia\(true\);\s*const file = e\.target\.files\?\.\[0\];\s*if \(!file\) return;\s*const base64 = await uploadLargeMedia\(file\);\s*if \(isBefore\) \{\s*setNewBeforeImageUrl\(base64\);\s*\} else \{\s*setNewImageUrl\(base64\);\s*\}\s*setIsUploadingMedia\(false\);\s*\};/,
  `const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isBefore = false) => {
    setIsUploadingMedia(true);
    const file = e.target.files?.[0];
    if (!file) {
      setIsUploadingMedia(false);
      return;
    }
    try {
      const base64 = await uploadLargeMedia(file);
      if (isBefore) {
        setNewBeforeImageUrl(base64);
      } else {
        setNewImageUrl(base64);
      }
    } catch (err) {
      console.error(err);
      alert((err as Error).message || 'Failed to process media file. Check size limits.');
    } finally {
      setIsUploadingMedia(false);
    }
  };`
);

fs.writeFileSync(file, code);
console.log('Patched AdminDashboard.tsx to fix syntax error');
