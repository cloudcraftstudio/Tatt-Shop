const fs = require('fs');
const file = 'src/components/AdminDashboard.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const \[editingGalleryItem, setEditingGalleryItem\] = useState<GalleryItem \| null>\(null\);/,
  `const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryItem | null>(null);\n  const [isUploadingMedia, setIsUploadingMedia] = useState(false);`
);

code = code.replace(
  /const handleEditAdditionalImagesUpload = async \(e: React\.ChangeEvent<HTMLInputElement>\) => \{/,
  `const handleEditAdditionalImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsUploadingMedia(true);`
);

code = code.replace(
  /setEditingGalleryItem\(prev => \{\s*if \(!prev\) return prev;\s*return \{\s*\.\.\.prev,\s*additionalImages: \[\.\.\.\(prev\.additionalImages \|\| \[\]\), \.\.\.newBase64Images\]\s*\};\s*\}\);/,
  `setEditingGalleryItem(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        additionalImages: [...(prev.additionalImages || []), ...newBase64Images]
      };
    });
    setIsUploadingMedia(false);`
);

code = code.replace(
  /alert\(\(err as Error\)\.message \|\| 'Failed to process media file\. Check size limits\.'\);\s*\}/,
  `alert((err as Error).message || 'Failed to process media file. Check size limits.');
      }
    }
    setIsUploadingMedia(false); // Make sure it's reset on error`
);

// We need to disable the Save button.
code = code.replace(
  /<button\s*type="submit"\s*className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500\/20"\s*>/,
  `<button
                  type="submit"
                  disabled={isUploadingMedia}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >`
);

// Add a tiny loading indicator next to the Save button if it's uploading
code = code.replace(
  /Save Changes\s*<\/button>/,
  `{isUploadingMedia ? 'Uploading...' : 'Save Changes'}
                </button>`
);

fs.writeFileSync(file, code);
console.log('Patched AdminDashboard.tsx');
