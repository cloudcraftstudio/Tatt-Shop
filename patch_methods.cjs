const fs = require('fs');
let code = fs.readFileSync('src/services/storage.ts', 'utf8');

code = code.replace(
  /this\.saveGallery\(updated\);\s*return newItem;/g,
  "this.saveGallery(updated);\n    setDoc(doc(db, \"gallery\", newItem.id), newItem).catch(e => console.error(e));\n    return newItem;"
);

code = code.replace(
  /this\.savePosts\(updated\);\s*return newPost;/g,
  "this.savePosts(updated);\n    setDoc(doc(db, \"posts\", newPost.id), newPost).catch(e => console.error(e));\n    return newPost;"
);

code = code.replace(
  /this\.savePosts\(posts\);\s*return true;\s*\}/g,
  "this.savePosts(posts);\n      setDoc(doc(db, \"posts\", posts[idx].id), posts[idx]).catch(e => console.error(e));\n      return true;\n    }"
);

code = code.replace(
  /this\.saveJournalPosts\(updated\);\s*return newPost;/g,
  "this.saveJournalPosts(updated);\n    setDoc(doc(db, \"journal\", newPost.id), newPost).catch(e => console.error(e));\n    return newPost;"
);

code = code.replace(
  /this\.saveTikTokReels\(updated\);\s*return newReel;/g,
  "this.saveTikTokReels(updated);\n    setDoc(doc(db, \"reels\", newReel.id), newReel).catch(e => console.error(e));\n    return newReel;"
);

code = code.replace(
  /this\.saveBookings\(updated\);\s*return newBooking;/g,
  "this.saveBookings(updated);\n    setDoc(doc(db, \"bookings\", newBooking.id), newBooking).catch(e => console.error(e));\n    return newBooking;"
);

code = code.replace(
  /this\.saveBookings\(bookings\);\s*return updated;/g,
  "this.saveBookings(bookings);\n    setDoc(doc(db, \"bookings\", updated.id), updated).catch(e => console.error(e));\n    return updated;"
);

code = code.replace(
  /this\.saveTransactions\(updated\);\s*return newTx;/g,
  "this.saveTransactions(updated);\n    setDoc(doc(db, \"transactions\", newTx.id), newTx).catch(e => console.error(e));\n    return newTx;"
);

code = code.replace(
  /this\.saveTransactions\(transactions\);\s*return updated;/g,
  "this.saveTransactions(transactions);\n    setDoc(doc(db, \"transactions\", updated.id), updated).catch(e => console.error(e));\n    return updated;"
);

code = code.replace(
  /localStorage\.setItem\(KEYS\.TESTIMONIALS, JSON\.stringify\(updated\)\);\s*\} catch \(e\)/g,
  "localStorage.setItem(KEYS.TESTIMONIALS, JSON.stringify(updated));\n      setDoc(doc(db, \"testimonials\", newTest.id), newTest).catch(err => console.error(err));\n    } catch (e)"
);

code = code.replace(
  /localStorage\.setItem\(KEYS\.WAIVERS, JSON\.stringify\(updated\)\);\s*\} catch \(e\)/g,
  "localStorage.setItem(KEYS.WAIVERS, JSON.stringify(updated));\n      if (waiver) setDoc(doc(db, \"waivers\", waiver.id), waiver).catch(err => console.error(err));\n    } catch (e)"
);

code = code.replace(
  /return true;\s*\} catch \(err\)/g,
  `// Sync imported arrays directly to Firestore since we removed batch saving
      const syncArray = async (col, arr) => {
        if (!Array.isArray(arr)) return;
        for (const item of arr) {
          if (item && item.id) await setDoc(doc(db, col, item.id), item).catch(e => console.error(e));
        }
      };
      
      Promise.all([
        syncArray("gallery", data.gallery),
        syncArray("bookings", data.bookings),
        syncArray("transactions", data.transactions),
        syncArray("testimonials", data.testimonials),
        syncArray("posts", data.posts),
        syncArray("journal", data.journal),
        syncArray("reels", data.reels)
      ]).catch(e => console.error('Background sync failed', e));

      return true;
    } catch (err)`
);

fs.writeFileSync('src/services/storage.ts', code);
