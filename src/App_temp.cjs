const fs = require('fs');
let code = fs.readFileSync('./src/App.tsx', 'utf8');

code = code.replace("import { storageService, setupFirestoreSync } from './services/storage';", "import { storageService, setupFirestoreSync } from './services/storage';\nimport { authenticateAdminSilently } from './firebase';");

const useEffectBlock = `
  useEffect(() => {
    // If they refresh the page and are already considered admin locally, we need to make sure Firebase is also authenticated
    if (storageService.getAdminAuth().isAuthenticated) {
      authenticateAdminSilently();
    }
    
    setupFirestoreSync((col) => {
`;

code = code.replace("  useEffect(() => {\n    setupFirestoreSync((col) => {", useEffectBlock);

fs.writeFileSync('./src/App.tsx', code);
