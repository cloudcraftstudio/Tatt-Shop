const fs = require('fs');
const file = 'src/firebase.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('setLogLevel')) {
  code = code.replace(
    /import \{ getFirestore \} from 'firebase\/firestore';/,
    `import { getFirestore, setLogLevel } from 'firebase/firestore';\nsetLogLevel('silent');`
  );
  fs.writeFileSync(file, code);
  console.log('Patched firebase.ts to silence internal quota errors');
}
