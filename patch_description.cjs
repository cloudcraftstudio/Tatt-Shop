const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(
  /const updated = \{\n\s*\.\.\.editingGalleryItem,\n\s*categoryLabel: CATEGORY_LABELS\[editingGalleryItem.category\] \|\| 'Custom Tattoo'\n\s*\};/g,
  `const updated = {
      ...editingGalleryItem,
      description: editingGalleryItem.description || '',
      categoryLabel: CATEGORY_LABELS[editingGalleryItem.category] || 'Custom Tattoo'
    };`
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
