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
    } catch (e) {
      console.warn('Failed to save waiver', e);
    }
  },

  deleteWaiver(id: string): void {
    try {
      const current = this.getWaivers();
      const updated = current.filter(w => w.id !== id);
      localStorage.setItem(KEYS.WAIVERS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to delete waiver', e);
    }
  },

  // Utility to read local file to base64
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
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


