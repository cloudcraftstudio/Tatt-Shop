const fs = require('fs');
let code = fs.readFileSync('src/services/storage.ts', 'utf8');

// Replace saveToFirestore
const replacement = `const arrayCache = new Map<string, any[]>();
const saveToFirestore = async (col: string, data: any) => {
  try {
    if (Array.isArray(data)) {
      // Intentionally do nothing. Array writes are now handled per-document.
    } else {
      await setDoc(doc(db, col, 'data'), data);
    }
  } catch (e) {
    console.error('Firestore save failed', e);
  }
};
const deleteFromFirestore`;

code = code.replace(/const saveToFirestore = async \(col: string, data: any\) => \{[\s\S]*?const deleteFromFirestore/m, replacement);

// Remove batch array saves
code = code.replace(/saveToFirestore\("gallery", gallery\);/g, '');
code = code.replace(/saveToFirestore\("posts", posts\);/g, '');
code = code.replace(/saveToFirestore\("journal", posts\);/g, '');
code = code.replace(/saveToFirestore\("reels", reels\);/g, '');
code = code.replace(/saveToFirestore\("bookings", bookings\);/g, '');
code = code.replace(/saveToFirestore\("transactions", transactions\);/g, '');
code = code.replace(/saveToFirestore\("testimonials", testimonials\);/g, '');
code = code.replace(/saveToFirestore\("testimonials", updated\);/g, '');
code = code.replace(/saveToFirestore\("waivers", waivers\);/g, '');
code = code.replace(/saveToFirestore\("waivers", updated\);/g, '');

fs.writeFileSync('src/services/storage.ts', code);
