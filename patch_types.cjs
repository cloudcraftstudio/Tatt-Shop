const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace(
  /status: 'pending' \| 'confirmed' \| 'completed' \| 'cancelled' \| 'in_chair';/g,
  "status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'in_chair';\n  depositStatus?: 'unpaid' | 'paid' | 'forfeited';"
);

fs.writeFileSync('src/types.ts', code);
