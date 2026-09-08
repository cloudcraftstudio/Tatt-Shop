import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ArtistProfile, Booking, GalleryItem, Post, JournalPost, Testimonial, TikTokReel, PaymentTransaction, SessionRecordingWaiver, SplashScreenSettings, AdminAuthSession } from '../types';
import { initialBookings, initialGallery, initialPosts, initialJournalPosts, initialProfile, initialTestimonials, initialTikTokReels, initialTransactions } from '../data/initialData';
import { defaultSplashSettings } from '../data/splashData';

const KEYS = {
  PROFILE: 'lot_profile_v1',
  GALLERY: 'lot_gallery_v1',
  POSTS: 'lot_posts_v1',
  JOURNAL: 'lot_journal_v1',
  BOOKINGS: 'lot_bookings_v1',
  TESTIMONIALS: 'lot_testimonials_v1',
  REELS: 'lot_reels_v1',
  TRANSACTIONS: 'lot_transactions_v1',
  WAIVERS: 'lot_tiktok_waivers_v1',
  PIN: 'lot_admin_pin_v1',
  SPLASH: 'lot_splash_settings_v1',
  ADMIN_AUTH: 'lot_admin_session_v1',
  SPLASH_SEEN: 'lot_splash_seen_v1'
};


export const setupFirestoreSync = (callback: (data: any) => void) => {
  const arrayCollections = ['gallery', 'posts', 'journal', 'reels', 'bookings', 'transactions', 'testimonials', 'waivers'];
  const objectCollections = ['profile', 'splash'];

  const setupArrayListener = (col: string) => {
    onSnapshot(
      collection(db, col),
      (snapshot) => {
        const items = snapshot.docs.map(doc => doc.data());
        // Always write to local storage so it syncs deletions/empty states too
        // Only ignore if the cloud is perfectly empty AND we already have initial data (prevent wiping defaults on first load ever)
        const existingData = localStorage.getItem('lot_' + col + '_v1');
        if (items.length === 0 && (!existingData || existingData.includes('initial'))) {
           // don't overwrite defaults with empty cloud if it's the first run
        } else {
           localStorage.setItem('lot_' + col + '_v1', JSON.stringify(items));
           callback(col);
        }
      },
      (error) => { console.error("Sync error:", error); }
    );
  };

  const setupObjectListener = (col: string) => {
    onSnapshot(
      doc(db, col, 'data'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          localStorage.setItem('lot_' + (col === 'splash' ? 'splash_settings' : col) + '_v1', JSON.stringify(data));
          callback(col);
        }
      },
      (error) => { console.error("Sync error:", error); }
    );
  };

  arrayCollections.forEach(setupArrayListener);
  objectCollections.forEach(setupObjectListener);
};






const saveToFirestore = async (col: string, data: any) => {
  try {
    if (Array.isArray(data)) {
      for (const item of data) {
        if (item && item.id) {
          await setDoc(doc(db, col, item.id), item);
        }
      }
    } else {
      await setDoc(doc(db, col, 'data'), data);
    }
  } catch (e) {
    console.error('Firestore save failed', e);
  }
};

const deleteFromFirestore = async (col: string, id: string) => {
  try {
    await deleteDoc(doc(db, col, id));
  } catch(e) {
    console.error('Firestore delete failed', e);
  }
};

export const storageService = {
  // Profile
  getProfile(): ArtistProfile {
    try {
      const data = localStorage.getItem(KEYS.PROFILE);
      return data ? JSON.parse(data) : initialProfile;
    } catch {
      return initialProfile;
    }
  },

  saveProfile(profile: ArtistProfile): void {
    try {
      localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
      saveToFirestore("profile", profile);
    } catch (e) {
      console.warn('Local storage write failed', e);
    }
  },

  // Gallery
  getGallery(): GalleryItem[] {
    try {
      const data = localStorage.getItem(KEYS.GALLERY);
      if (!data) {
        localStorage.setItem(KEYS.GALLERY, JSON.stringify(initialGallery));
        return initialGallery;
      }
      return JSON.parse(data);
    } catch {
      return initialGallery;
    }
  },

  getGalleryItems(): GalleryItem[] {
    return this.getGallery();
  },

  saveGallery(gallery: GalleryItem[]): void {
    try {
      localStorage.setItem(KEYS.GALLERY, JSON.stringify(gallery));
      saveToFirestore("gallery", gallery);
    } catch (e) {
      console.warn('Storage error on gallery save', e);
    }
  },

  addGalleryItem(item: Omit<GalleryItem, 'id' | 'createdAt'>): GalleryItem {
    const gallery = this.getGallery();
    const newItem: GalleryItem = {
      ...item,
      id: `gal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = [newItem, ...gallery];
    this.saveGallery(updated);
    return newItem;
  },

  createGalleryItem(item: Omit<GalleryItem, 'id' | 'createdAt'>): GalleryItem {
    return this.addGalleryItem(item);
  },

  updateGalleryItem(updatedItem: GalleryItem): void {
    const gallery = this.getGallery();
    const index = gallery.findIndex(g => g.id === updatedItem.id);
    if (index !== -1) {
      gallery[index] = updatedItem;
      this.saveGallery(gallery);
    }
  },

  deleteGalleryItem(id: string): void {
    const gallery = this.getGallery().filter(g => g.id !== id);
    this.saveGallery(gallery);
    deleteFromFirestore("gallery", id);
  },

  // Posts / Wall
  getPosts(): Post[] {
    try {
      const data = localStorage.getItem(KEYS.POSTS);
      if (!data) {
        localStorage.setItem(KEYS.POSTS, JSON.stringify(initialPosts));
        return initialPosts;
      }
      return JSON.parse(data);
    } catch {
      return initialPosts;
    }
  },

  savePosts(posts: Post[]): void {
    try {
      localStorage.setItem(KEYS.POSTS, JSON.stringify(posts));
      saveToFirestore("posts", posts);
    } catch (e) {
      console.warn('Storage error on posts save', e);
    }
  },

  addPost(postData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'commentsCount'>): Post {
    const posts = this.getPosts();
    const newPost: Post = {
      ...postData,
      id: `post-${Date.now()}`,
      likes: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString()
    };
    const updated = [newPost, ...posts];
    this.savePosts(updated);
    return newPost;
  },

  updatePost(updatedPost: Post): void {
    const posts = this.getPosts();
    const index = posts.findIndex(p => p.id === updatedPost.id);
    if (index !== -1) {
      posts[index] = updatedPost;
      this.savePosts(posts);
    }
  },

  deletePost(id: string): void {
    const posts = this.getPosts().filter(p => p.id !== id);
    this.savePosts(posts);
    deleteFromFirestore("posts", id);
  },

  toggleLikePost(id: string): Post[] {
    const posts = this.getPosts();
    const post = posts.find(p => p.id === id);
    if (post) {
      if (post.userLiked) {
        post.likes = Math.max(0, post.likes - 1);
        post.userLiked = false;
      } else {
        post.likes += 1;
        post.userLiked = true;
      }
      this.savePosts(posts);
    }
    return posts;
  },

  // Journal Posts
  getJournalPosts(): JournalPost[] {
    try {
      const data = localStorage.getItem(KEYS.JOURNAL);
      if (!data) {
        localStorage.setItem(KEYS.JOURNAL, JSON.stringify(initialJournalPosts));
        return initialJournalPosts;
      }
      return JSON.parse(data);
    } catch {
      return initialJournalPosts;
    }
  },

  saveJournalPosts(posts: JournalPost[]): void {
    try {
      localStorage.setItem(KEYS.JOURNAL, JSON.stringify(posts));
      saveToFirestore("journal", posts);
    } catch (e) {
      console.warn('Storage error on journal save', e);
    }
  },

  // TikTok Reels
  getTikTokReels(): TikTokReel[] {
    try {
      const data = localStorage.getItem(KEYS.REELS);
      if (!data) {
        localStorage.setItem(KEYS.REELS, JSON.stringify(initialTikTokReels));
        return initialTikTokReels;
      }
      return JSON.parse(data);
    } catch {
      return initialTikTokReels;
    }
  },

  saveTikTokReels(reels: TikTokReel[]): void {
    try {
      localStorage.setItem(KEYS.REELS, JSON.stringify(reels));
      saveToFirestore("reels", reels);
    } catch (e) {
      console.warn('Storage error on reels save', e);
    }
  },

  addTikTokReel(reel: Omit<TikTokReel, 'id'>): TikTokReel {
    const reels = this.getTikTokReels();
    const newReel: TikTokReel = {
      ...reel,
      id: `tt-${Date.now()}`
    };
    const updated = [newReel, ...reels];
    this.saveTikTokReels(updated);
    return newReel;
  },

  deleteTikTokReel(id: string): void {
    const reels = this.getTikTokReels().filter(r => r.id !== id);
    this.saveTikTokReels(reels);
  },

  syncTikTokReels(newReels: TikTokReel[]): void {
    const existing = this.getTikTokReels();
    // Merge new reels avoiding duplicates by ID or videoUrl
    const existingUrls = new Set(existing.map(r => r.videoUrl || r.id));
    const toAdd = newReels.filter(r => !existingUrls.has(r.videoUrl || r.id));
    const merged = [...toAdd, ...existing];
    this.saveTikTokReels(merged);
  },

  // Bookings
  getBookings(): Booking[] {
    try {
      const data = localStorage.getItem(KEYS.BOOKINGS);
      if (!data) {
        localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(initialBookings));
        return initialBookings;
      }
      return JSON.parse(data);
    } catch {
      return initialBookings;
    }
  },

  saveBookings(bookings: Booking[]): void {
    try {
      localStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
      saveToFirestore("bookings", bookings);
    } catch (e) {
      console.warn('Storage error on bookings save', e);
    }
  },

  createBooking(bookingData: Omit<Booking, 'id' | 'createdAt' | 'status'>): Booking {
    const bookings = this.getBookings();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const newBooking: Booking = {
      ...bookingData,
      id: `LOT-${randomNum}`,
      status: 'pending',
      securityDepositAmount: bookingData.securityDepositAmount ?? 200,
      securityDepositStatus: bookingData.securityDepositStatus ?? 'unpaid',
      depositPolicyAccepted: bookingData.depositPolicyAccepted ?? true,
      createdAt: new Date().toISOString()
    };
    const updated = [newBooking, ...bookings];
    this.saveBookings(updated);
    return newBooking;
  },

  updateBookingStatus(id: string, status: Booking['status']): void {
    const bookings = this.getBookings();
    const target = bookings.find(b => b.id === id);
    if (target) {
      target.status = status;
      this.saveBookings(bookings);
    }
  },

  updateBookingDeposit(id: string, depositStatus: Booking['securityDepositStatus']): void {
    const bookings = this.getBookings();
    const target = bookings.find(b => b.id === id);
    if (target) {
      target.securityDepositStatus = depositStatus;
      this.saveBookings(bookings);
    }
  },

  updateBookingCalendarSync(id: string, eventId: string, htmlLink?: string): void {
    const bookings = this.getBookings();
    const target = bookings.find(b => b.id === id);
    if (target) {
      target.googleCalendarEventId = eventId;
      target.googleCalendarHtmlLink = htmlLink;
      target.googleCalendarSyncedAt = new Date().toISOString();
      target.status = 'confirmed';
      this.saveBookings(bookings);
    }
  },

  deleteBooking(id: string): void {
    const bookings = this.getBookings().filter(b => b.id !== id);
    this.saveBookings(bookings);
    deleteFromFirestore("bookings", id);
  },

  // --- Payment Transactions & Cash App POS Gateway ---
  getTransactions(): PaymentTransaction[] {
    try {
      const data = localStorage.getItem(KEYS.TRANSACTIONS);
      if (!data) {
        localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(initialTransactions));
        return initialTransactions;
      }
      return JSON.parse(data);
    } catch {
      return initialTransactions;
    }
  },

  saveTransactions(transactions: PaymentTransaction[]): void {
    try {
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(transactions));
      saveToFirestore("transactions", transactions);
    } catch (e) {
      console.warn('Storage error on transactions save', e);
    }
  },

  recordTransaction(txData: Omit<PaymentTransaction, 'id' | 'createdAt' | 'status'>): PaymentTransaction {
    const transactions = this.getTransactions();
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const newTx: PaymentTransaction = {
      ...txData,
      id: `LOT-PAY-${randomCode}`,
      status: 'completed',
      createdAt: new Date().toISOString()
    };

    const updated = [newTx, ...transactions];
    this.saveTransactions(updated);

    // If linked to a booking and this is a security deposit, automatically mark booking deposit as paid!
    if (txData.bookingId && txData.paymentType === 'deposit') {
      this.updateBookingDeposit(txData.bookingId, 'paid');
    }

    return newTx;
  },

  // Testimonials
  getTestimonials(): Testimonial[] {
    try {
      const data = localStorage.getItem(KEYS.TESTIMONIALS);
      if (!data) {
        localStorage.setItem(KEYS.TESTIMONIALS, JSON.stringify(initialTestimonials));
        return initialTestimonials;
      }
      return JSON.parse(data);
    } catch {
      return initialTestimonials;
    }
  },

  addTestimonial(test: Partial<Testimonial> & { clientName: string; rating: number }): Testimonial {
    const tests = this.getTestimonials();
    const newTest: Testimonial = {
      id: `tst-${Date.now()}`,
      clientName: test.clientName,
      rating: test.rating,
      verified: test.verified ?? true,
      date: test.date || 'Recent Client',
      location: test.location || test.city || 'Winchester, VA',
      city: test.city || test.location || 'Winchester, VA',
      comment: test.comment || test.content || '',
      content: test.content || test.comment || '',
      tattooCategory: test.tattooCategory || test.tattooType || 'Custom Realism',
      tattooType: test.tattooType || test.tattooCategory || 'Custom Realism',
      avatarUrl: test.avatarUrl
    };
    const updated = [newTest, ...tests];
    try {
      localStorage.setItem(KEYS.TESTIMONIALS, JSON.stringify(updated));
      saveToFirestore("testimonials", updated);
    } catch (e) {
      console.warn(e);
    }
    return newTest;
  },

  createTestimonial(test: Partial<Testimonial> & { clientName: string; rating: number }): Testimonial {
    return this.addTestimonial(test);
  },

  // Admin PIN (Defaults to 1234 or Tex)
  getAdminPin(): string {
    return localStorage.getItem(KEYS.PIN) || '1234';
  },

  setAdminPin(pin: string): void {
    localStorage.setItem(KEYS.PIN, pin);
  },

  // Chromebook Backup & Restore (JSON export / import)
  exportFullDataJson(): string {
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      profile: this.getProfile(),
      gallery: this.getGallery(),
      bookings: this.getBookings(),
      transactions: this.getTransactions(),
      testimonials: this.getTestimonials(),
      posts: this.getPosts(),
      journal: this.getJournalPosts(),
      reels: this.getTikTokReels()
    };
    return JSON.stringify(backup, null, 2);
  },

  importFullDataJson(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (data.profile) this.saveProfile(data.profile);
      if (Array.isArray(data.gallery)) this.saveGallery(data.gallery);
      if (Array.isArray(data.bookings)) this.saveBookings(data.bookings);
      if (Array.isArray(data.transactions)) this.saveTransactions(data.transactions);
      if (Array.isArray(data.testimonials)) {
        localStorage.setItem(KEYS.TESTIMONIALS, JSON.stringify(data.testimonials));
      }
      if (Array.isArray(data.posts)) this.savePosts(data.posts);
      if (Array.isArray(data.journal)) this.saveJournalPosts(data.journal);
      if (Array.isArray(data.reels)) this.saveTikTokReels(data.reels);
      return true;
    } catch (err) {
      console.error('Import failed', err);
      return false;
    }
  },

  resetToDefaults(): void {
    localStorage.removeItem(KEYS.PROFILE);
    localStorage.removeItem(KEYS.GALLERY);
    localStorage.removeItem(KEYS.POSTS);
    localStorage.removeItem(KEYS.JOURNAL);
    localStorage.removeItem(KEYS.BOOKINGS);
    localStorage.removeItem(KEYS.TRANSACTIONS);
    localStorage.removeItem(KEYS.TESTIMONIALS);
    localStorage.removeItem(KEYS.REELS);
    localStorage.removeItem(KEYS.WAIVERS);
  },

  // Session Recording & TikTok Waivers
  getWaivers(): SessionRecordingWaiver[] {
    try {
      const data = localStorage.getItem(KEYS.WAIVERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveWaiver(waiver: SessionRecordingWaiver): void {
    try {
      const current = this.getWaivers();
      const idx = current.findIndex(w => w.id === waiver.id);
      let updated: SessionRecordingWaiver[];
      if (idx >= 0) {
        updated = [...current];
        updated[idx] = waiver;
      } else {
        updated = [waiver, ...current];
      }
      localStorage.setItem(KEYS.WAIVERS, JSON.stringify(updated));
      saveToFirestore("waivers", updated);
      deleteFromFirestore("waivers", id);
    } catch (e) {
      console.warn('Failed to save waiver', e);
    }
  },

  deleteWaiver(id: string): void {
    try {
      const current = this.getWaivers();
      const updated = current.filter(w => w.id !== id);
      localStorage.setItem(KEYS.WAIVERS, JSON.stringify(updated));
      saveToFirestore("waivers", updated);
      deleteFromFirestore("waivers", id);
    } catch (e) {
      console.warn('Failed to delete waiver', e);
    }
  },

  // Utility to read local file to base64
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Compress heavily for Firestore (WebP 0.6 quality)
          const compressedBase64 = canvas.toDataURL('image/webp', 0.6);
          resolve(compressedBase64);
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = error => reject(error);
    });
  },

  // Splash Screen Settings
  getSplashScreenSettings(): SplashScreenSettings {
    try {
      const data = localStorage.getItem(KEYS.SPLASH);
      if (!data) {
        localStorage.setItem(KEYS.SPLASH, JSON.stringify(defaultSplashSettings));
        return defaultSplashSettings;
      }
      return {
        ...defaultSplashSettings,
        ...JSON.parse(data)
      };
    } catch {
      return defaultSplashSettings;
    }
  },

  saveSplashScreenSettings(settings: SplashScreenSettings): void {
    try {
      localStorage.setItem(KEYS.SPLASH, JSON.stringify(settings));
      saveToFirestore("splash", settings);
    } catch (e) {
      console.warn('Failed to save splash screen settings', e);
    }
  },

  resetSplashScreenSettings(): SplashScreenSettings {
    try {
      localStorage.setItem(KEYS.SPLASH, JSON.stringify(defaultSplashSettings));
    } catch (e) {
      console.warn('Reset failed', e);
    }
    return defaultSplashSettings;
  },

  hasSeenSplash(): boolean {
    return localStorage.getItem(KEYS.SPLASH_SEEN) === 'true';
  },

  setSeenSplash(): void {
    localStorage.setItem(KEYS.SPLASH_SEEN, 'true');
  },

  // Admin Studio Authentication Session
  getAdminAuth(): AdminAuthSession {
    try {
      const data = localStorage.getItem(KEYS.ADMIN_AUTH);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    return {
      isAuthenticated: false,
      method: 'pin',
      loginTime: ''
    };
  },

  setAdminAuth(session: AdminAuthSession): void {
    try {
      localStorage.setItem(KEYS.ADMIN_AUTH, JSON.stringify(session));
    } catch (e) {
      console.warn('Failed to store admin session', e);
    }
  },

  clearAdminAuth(): void {
    try {
      localStorage.removeItem(KEYS.ADMIN_AUTH);
    } catch (e) {
      console.warn('Failed to clear admin session', e);
    }
  }
};


