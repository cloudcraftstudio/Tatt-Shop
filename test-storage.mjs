import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadString } from 'firebase/storage';

const firebaseConfig = {
  projectId: "gen-lang-client-0448860491",
  appId: "1:961047932943:web:37f75ef7e233af793cb37a",
  apiKey: "AIzaSyATomHQp7H5ZNcTHM60_-lKLp2sf6GD8oY",
  authDomain: "gen-lang-client-0448860491.firebaseapp.com",
  storageBucket: "gen-lang-client-0448860491.firebasestorage.app",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const testRef = ref(storage, 'test.txt');
uploadString(testRef, 'hello world').then(() => {
  console.log('Upload successful');
  process.exit(0);
}).catch(e => {
  console.error('Upload failed', e);
  process.exit(1);
});
