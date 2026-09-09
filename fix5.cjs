const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

code = code.replace(
  "          )}\n        </div>\n      )}\n      {/* --- TAB: JOURNAL & BLOG POSTS MANAGER --- */}",
  "          )}\n        </div>\n        </div>\n      )}\n      {/* --- TAB: JOURNAL & BLOG POSTS MANAGER --- */}"
);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
