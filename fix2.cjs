const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const regex = /\n\s*\{\/\* ======================= \*\/\}\n\s*\{\/\*   BOOKINGS MANAGEMENT   \*\/\}\n\s*\{\/\* ======================= \*\/\}\n/;
code = code.replace(regex, `

      {/* --- TAB: BOOKINGS MANAGEMENT --- */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {/* ======================= */}
          {/*   BOOKINGS MANAGEMENT   */}
          {/* ======================= */}
`);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
