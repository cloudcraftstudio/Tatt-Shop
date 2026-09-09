const fs = require('fs');
let code = fs.readFileSync('src/components/AdminDashboard.tsx', 'utf8');

const regex = /          \)\}\n        <\/div>\n      \)\}\n      \{\/\* --- TAB: JOURNAL & BLOG POSTS MANAGER --- \*\/\}/;
code = code.replace(regex, `          )}
        </div>
        </div>
      )}
      {/* --- TAB: JOURNAL & BLOG POSTS MANAGER --- */}`);

fs.writeFileSync('src/components/AdminDashboard.tsx', code);
