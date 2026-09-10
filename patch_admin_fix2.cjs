const fs = require('fs');
const file = 'src/components/AdminDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const handleEditAdditionalImagesUpload = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{\s*setIsUploadingMedia\(true\);\s*if \(!editingGalleryItem\) return;\s*const files = e\.target\.files;\s*if \(!files \|\| files\.length === 0\) return;/,
  `const handleEditAdditionalImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingGalleryItem) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingMedia(true);`
);

code = code.replace(
  /const handleAdditionalImagesUpload = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{\s*setIsUploadingMedia\(true\);\s*const files = e\.target\.files;\s*if \(!files \|\| files\.length === 0\) return;/,
  `const handleAdditionalImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingMedia(true);`
);

fs.writeFileSync(file, code);
console.log('Patched AdminDashboard.tsx early returns');
