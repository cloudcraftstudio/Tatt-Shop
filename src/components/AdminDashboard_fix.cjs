const fs = require('fs');
let code = fs.readFileSync('./src/components/AdminDashboard.tsx', 'utf8');

const backupButtonHtml = `
          {/* Cloud Sync Tool */}
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              Force Push Local Data to Firebase Cloud
            </h4>
            <p className="text-xs text-gray-400 font-mono mb-2">
              Run this once to push all your existing local data up into the newly connected Firebase Cloud Database.
            </p>
            <button
              onClick={async () => {
                 storageService.saveProfile(storageService.getProfile());
                 storageService.saveGallery(storageService.getGalleryItems());
                 storageService.saveJournalPosts(storageService.getJournalPosts());
                 storageService.saveTikTokReels(storageService.getTikTokReels());
                 storageService.saveBookings(storageService.getBookings());
                 storageService.saveTransactions(storageService.getTransactions());
                 
                 // Manually hit firestore for testimonials and waivers since we don't have bulk save functions for those
                 const { doc, setDoc } = await import('firebase/firestore');
                 const { db } = await import('../firebase');
                 await setDoc(doc(db, 'testimonials', 'data'), { items: storageService.getTestimonials() }).catch(e => console.error(e));
                 await setDoc(doc(db, 'waivers', 'data'), { items: storageService.getWaivers() }).catch(e => console.error(e));
                 
                 storageService.saveSplashScreenSettings(storageService.getSplashScreenSettings());
                 showNotification('All local data successfully pushed to Firebase Cloud!');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition"
            >
              Push to Cloud Database
            </button>
          </div>
`;

// we need to replace the old button
const regex = /\{\/\* Cloud Sync Tool \*\/\}[\s\S]*?Push to Cloud Database\n            <\/button>\n          <\/div>/;

code = code.replace(regex, backupButtonHtml);

fs.writeFileSync('./src/components/AdminDashboard.tsx', code);
