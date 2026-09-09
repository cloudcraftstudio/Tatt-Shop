const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const regex = /      \{\/\* --- TAB: BOOKINGS MANAGEMENT --- \*\/\}/;
code = code.replace(regex, `
        </div>
      )}

      {/* --- TAB: BOOKINGS MANAGEMENT --- */}`);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
