const fs = require('fs');
const file = 'src/services/storage.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /saveGallery\(gallery: GalleryItem\[\]\): void \{\s*memoryGalleryCache = gallery;\s*try \{\s*localStorage\.setItem\(KEYS\.GALLERY, JSON\.stringify\(gallery\)\);\s*\} catch \(e\) \{\s*console\.warn\('Storage quota warning on gallery save to localStorage', e\);\s*\}\s*\}/,
  `saveGallery(gallery: GalleryItem[]): void {
    memoryGalleryCache = gallery;
    try {
      const strippedGallery = gallery.map(item => {
        const stripBase64 = (str?: string) => (str && str.startsWith('data:') && str.length > 250000) ? 'media://stripped_for_local_storage' : str;
        return {
          ...item,
          imageUrl: stripBase64(item.imageUrl) || item.imageUrl,
          additionalImages: item.additionalImages?.map(img => stripBase64(img) || img) || []
        };
      });
      localStorage.setItem(KEYS.GALLERY, JSON.stringify(strippedGallery));
    } catch (e) {
      console.warn('Storage quota warning on gallery save to localStorage', e);
    }
  }`
);

code = code.replace(
  /memoryGalleryCache = updated;\s*try \{\s*localStorage\.setItem\(KEYS\.GALLERY, JSON\.stringify\(updated\)\);\s*\} catch \(e\) \{\s*console\.warn\('LocalStorage quota reached during bulk gallery save', e\);\s*\}/,
  `this.saveGallery(updated);`
);

code = code.replace(
  /gallery\[index\] = updatedItem;\s*memoryGalleryCache = gallery;\s*try \{\s*localStorage\.setItem\(KEYS\.GALLERY, JSON\.stringify\(gallery\)\);\s*\} catch \(e\) \{\s*console\.warn\('Storage quota warning on gallery update', e\);\s*\}/,
  `gallery[index] = updatedItem;
      this.saveGallery(gallery);`
);

code = code.replace(
  /memoryGalleryCache = gallery;\s*try \{\s*localStorage\.setItem\(KEYS\.GALLERY, JSON\.stringify\(gallery\)\);\s*\} catch \(e\) \{\s*console\.warn\('LocalStorage error on delete', e\);\s*\}/,
  `this.saveGallery(gallery);`
);

fs.writeFileSync(file, code);
console.log('Patched storage.ts');
