const fs = require('fs');
let code = fs.readFileSync('./src/components/AdminLoginGate.tsx', 'utf8');

code = code.replace("import { Lock, ShieldCheck, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';", "import { Lock, ShieldCheck, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';\nimport { authenticateAdminSilently } from '../firebase';");

const successLogic = `
      // Successfully authenticated
      await authenticateAdminSilently();
      onLoginSuccess({
`;

code = code.replace("      // Successfully authenticated\n      onLoginSuccess({", successLogic);

fs.writeFileSync('./src/components/AdminLoginGate.tsx', code);
