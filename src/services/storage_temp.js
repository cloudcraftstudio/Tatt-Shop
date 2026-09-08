const fs = require('fs');
let code = fs.readFileSync('./src/services/storage.ts', 'utf8');

// Insert imports
code = "import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';\nimport { db } from '../firebase';\n" + code;

// Quick helper to write to firestore
const firestoreHelper = `
const saveToFirestore = async (col, data) => {
  try {
    if (Array.isArray(data)) {
      // For arrays, just save as a single doc for simplicity in this specific migration to avoid massive refactoring
      await setDoc(doc(db, col, 'data'), { items: data });
    } else {
      await setDoc(doc(db, col, 'data'), data);
    }
  } catch (e) {
    console.error('Firestore save failed', e);
  }
};
`;

code = code.replace('export const storageService = {', firestoreHelper + '\nexport const storageService = {');

const replacements = [
  ['localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));', 'localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));\n      saveToFirestore("profile", profile);'],
  ['localStorage.setItem(KEYS.GALLERY, JSON.stringify(gallery));', 'localStorage.setItem(KEYS.GALLERY, JSON.stringify(gallery));\n      saveToFirestore("gallery", gallery);'],
  ['localStorage.setItem(KEYS.POSTS, JSON.stringify(posts));', 'localStorage.setItem(KEYS.POSTS, JSON.stringify(posts));\n      saveToFirestore("posts", posts);'],
  ['localStorage.setItem(KEYS.JOURNAL, JSON.stringify(posts));', 'localStorage.setItem(KEYS.JOURNAL, JSON.stringify(posts));\n      saveToFirestore("journal", posts);'],
  ['localStorage.setItem(KEYS.REELS, JSON.stringify(reels));', 'localStorage.setItem(KEYS.REELS, JSON.stringify(reels));\n      saveToFirestore("reels", reels);'],
  ['localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));', 'localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));\n      saveToFirestore("bookings", bookings);'],
  ['localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));', 'localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));\n      saveToFirestore("transactions", transactions);'],
  ['localStorage.setItem(KEYS.TESTIMONIALS, JSON.stringify(updated));', 'localStorage.setItem(KEYS.TESTIMONIALS, JSON.stringify(updated));\n      saveToFirestore("testimonials", updated);'],
  ['localStorage.setItem(KEYS.WAIVERS, JSON.stringify(updated));', 'localStorage.setItem(KEYS.WAIVERS, JSON.stringify(updated));\n      saveToFirestore("waivers", updated);'],
  ['localStorage.setItem(KEYS.SPLASH, JSON.stringify(settings));', 'localStorage.setItem(KEYS.SPLASH, JSON.stringify(settings));\n      saveToFirestore("splash", settings);']
];

replacements.forEach(([search, replace]) => {
  code = code.split(search).join(replace);
});

fs.writeFileSync('./src/services/storage.ts', code);
