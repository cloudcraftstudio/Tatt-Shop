import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HighVoltageBackground } from './components/HighVoltageBackground';
import { Header } from './components/Header';
import { MobileDrawer } from './components/MobileDrawer';
import { BottomAppBar } from './components/BottomAppBar';
import { HeroSection } from './components/HeroSection';
import { GallerySection } from './components/GallerySection';
import { ServiceRadiusMap } from './components/ServiceRadiusMap';
import { PricingEstimator } from './components/PricingEstimator';
import { BookingSection } from './components/BookingSection';
import { TestimonialSlider } from './components/TestimonialSlider';
import { TikTokReelsSection } from './components/TikTokReelsSection';
import { JournalSection } from './components/JournalSection';
import { AdminDashboard } from './components/AdminDashboard';
import { AboutSection } from './components/AboutSection';
import { AndroidApkModal } from './components/AndroidApkModal';
import { StudioPhotoModal } from './components/StudioPhotoModal';
import { AdminPosTab } from './components/AdminPosTab';
import { ClientCashAppPayPortal } from './components/ClientCashAppPayPortal';
import { TikTokStudioRecorder } from './components/TikTokStudioRecorder';
import { BustedLightbulbIcon } from './components/BustedLightbulbIcon';
import { FAQSection } from './components/FAQSection';
import { MatrixSplashScreen } from './components/MatrixSplashScreen';
import { storageService, setupFirestoreSync } from './services/storage';
import {
  ArtistProfile,
  Booking,
  GalleryItem,
  JournalPost,
  Testimonial,
  TikTokReel,
  SplashScreenSettings
} from './types';
import { Phone, Mail, MapPin, Sparkles, Flame, ShieldCheck, Zap } from 'lucide-react';

export default function App() {
  // App navigation state
  const [activeTab, setActiveTab] = useState<string>('home');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => storageService.getAdminAuth().isAuthenticated);

  // Splash Screen State
  const [splashSettings, setSplashSettings] = useState<SplashScreenSettings>(() => storageService.getSplashScreenSettings());
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    const settings = storageService.getSplashScreenSettings();
    if (!settings.enabled) return false;
    if (settings.showMode === 'first_time_only') {
      return !storageService.hasSeenSplash();
    }
    return true;
  });

  // Storage & Persistent Data State
  const [profile, setProfile] = useState<ArtistProfile>(storageService.getProfile());
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(storageService.getGalleryItems());
  const [bookings, setBookings] = useState<Booking[]>(storageService.getBookings());
  const [testimonials, setTestimonials] = useState<Testimonial[]>(storageService.getTestimonials());
  const [reels, setReels] = useState<TikTokReel[]>(storageService.getTikTokReels());
  const [posts, setPosts] = useState<JournalPost[]>(storageService.getJournalPosts());

  // Prefilled details for booking when forwarded from Pricing Estimator or Gallery piece
  const [prefillBooking, setPrefillBooking] = useState<{
    approximateSize?: string;
    placement?: string;
    isCoverUp?: boolean;
    estimatedHours?: number;
    estimatedPrice?: number;
    finalPrice?: number;
  } | null>(null);

  // Synchronize state from storage
  
  useEffect(() => {
    setupFirestoreSync((col) => {
      // Trigger a state update whenever Firestore pushes new data
      refreshAllData();
    });
  }, []);

  const refreshAllData = () => {
    setIsAdmin(storageService.getAdminAuth().isAuthenticated);
    setProfile(storageService.getProfile());
    setGalleryItems(storageService.getGalleryItems());
    setBookings(storageService.getBookings());
    setTestimonials(storageService.getTestimonials());
    setReels(storageService.getTikTokReels());
    setPosts(storageService.getJournalPosts());
  };

  // Scroll to top on tab switch
  const handleNavigate = (tab: string) => {
    setIsAdmin(storageService.getAdminAuth().isAuthenticated);
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler when client clicks "Lock In Estimate & Proceed to Booking"
  const handleProceedFromEstimator = (details: {
    approximateSize: string;
    placement: string;
    isCoverUp: boolean;
    estimatedHours: number;
    estimatedPrice: number;
    finalPrice: number;
  }) => {
    setPrefillBooking(details);
    setActiveTab('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler when client inquires about a specific gallery piece
  const handleBookSimilarFromGallery = (item: GalleryItem) => {
    setPrefillBooking({
      approximateSize: item.isCoverUp ? 'Cover-Up Transformation' : 'Medium / Palm Size',
      placement: item.placement || 'Forearm',
      isCoverUp: item.isCoverUp,
      estimatedHours: item.sessionHours || 4,
      estimatedPrice: (item.sessionHours || 4) * profile.hourlyRate,
      finalPrice: Math.round(((item.sessionHours || 4) * profile.hourlyRate) * 0.85)
    });
    setActiveTab('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Exit from Matrix live splash screen with smooth transition
  const handleEnterFromSplash = (destinationTab: string = 'home') => {
    storageService.setSeenSplash();
    setShowSplash(false);
    if (destinationTab && destinationTab !== 'home') {
      handleNavigate(destinationTab);
    }
  };

  return (
    <div className="min-h-screen bg-[#04060c] text-gray-100 font-sans relative overflow-x-clip selection:bg-cyan-500 selection:text-black">
      {/* Animated Matrix Cyberpunk Live Splash Screen */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="matrix-splash-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.45, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100]"
          >
            <MatrixSplashScreen
              settings={splashSettings}
              onEnter={handleEnterFromSplash}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* High-Voltage Live Background Canvas & Double Neon Strobe Edges */}
      <HighVoltageBackground showStrobeBorders={true} />

      {/* Sticky Studio Header with Phone & Busted Lightbulb Mobile Menu Icon */}
      <Header
        profile={profile}
        onOpenMenu={() => {
          setIsAdmin(storageService.getAdminAuth().isAuthenticated);
          setIsMenuOpen(true);
        }}
        onNavigate={handleNavigate}
        activeTab={activeTab}
      />

      {/* Main App Content Viewport with bottom appbar padding */}
      <main className="relative z-10 pb-24">
        {activeTab === 'home' && (
          <>
            {/* Badass Hero Section with Tex's Portrait & Bold Bio */}
            <HeroSection
              profile={profile}
              onNavigate={handleNavigate}
            />

            {/* Quick Pricing Estimator Teaser */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 my-4">
              <PricingEstimator
                profile={profile}
                onProceedToBook={handleProceedFromEstimator}
              />
            </div>

            {/* Badass 100-Mile Winchester VA Service Map */}
            <ServiceRadiusMap
              phone={profile.phone}
              onBookAppointment={() => handleNavigate('booking')}
            />

            {/* Featured Portfolio Highlights */}
            <GallerySection
              items={galleryItems.slice(0, 8)}
              onOpenAdminUpload={() => handleNavigate('admin')}
              onBookSimilar={handleBookSimilarFromGallery}
            />

            {/* Customer Testimonial Slider */}
            <TestimonialSlider
              testimonials={testimonials}
              onReviewAdded={newReview => {
                setTestimonials(prev => [newReview, ...prev]);
              }}
            />

            {/* Frequently Asked Questions */}
            <FAQSection />

            {/* Studio Info & Direct Contact Strip */}
            <section className="py-8 px-4 sm:px-6 max-w-5xl mx-auto">
              <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-400/40 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-black/60 border border-cyan-400 text-cyan-300">
                    <BustedLightbulbIcon size={32} glow={true} />
                  </div>
                  <div>
                    <h3 className="font-heading font-black text-lg text-white">
                      LIGHTS OUT TATTOO STUDIO
                    </h3>
                    <p className="text-xs text-gray-300 font-tech">
                      Winchester, Virginia • Direct Line: {profile.phone}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`tel:${profile.phone.replace(/[^0-9]/g, '')}`}
                    className="px-4 py-2.5 rounded-xl bg-cyan-950 border border-cyan-400/50 hover:bg-cyan-900 text-cyan-300 text-xs font-mono font-bold flex items-center gap-2"
                  >
                    <Phone className="w-4 h-4 text-cyan-400" />
                    <span>Call Tex</span>
                  </a>
                  <button
                    onClick={() => handleNavigate('booking')}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-bold text-xs uppercase tracking-wider hover:opacity-90 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                  >
                    Claim -15% & Book
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Gallery Screen */}
        {activeTab === 'gallery' && (
          <GallerySection
            items={galleryItems}
            onOpenAdminUpload={() => handleNavigate('admin')}
            onBookSimilar={handleBookSimilarFromGallery}
          />
        )}

        {/* Booking Screen & Pricing Estimator */}
        {activeTab === 'booking' && (
          <div className="space-y-6">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-4">
              <PricingEstimator
                profile={profile}
                onProceedToBook={handleProceedFromEstimator}
              />
            </div>
            <BookingSection
              profile={profile}
              prefillDetails={prefillBooking}
              onBookingSubmitted={() => {
                refreshAllData();
              }}
            />
            <div className="pb-8">
              <FAQSection />
            </div>
          </div>
        )}

        {/* 100-Mile Winchester VA Service Map Screen */}
        {activeTab === 'map' && (
          <div className="space-y-6 pb-8">
            <ServiceRadiusMap
              phone={profile.phone}
              onBookAppointment={() => handleNavigate('booking')}
            />
            <FAQSection />
          </div>
        )}

        {/* TikTok Reels Screen */}
        {activeTab === 'reels' && (
          <TikTokReelsSection
            reels={reels}
            onAddReelPrompt={() => handleNavigate('admin')}
            onOpenStudioRecorder={() => handleNavigate('tiktok-studio')}
          />
        )}

        {/* In-App TikTok Live Studio & Session Recorder Screen */}
        {activeTab === 'tiktok-studio' && (
          <div className="py-6 px-3 sm:px-6 max-w-5xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => handleNavigate('home')}
                className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
              >
                ← Back to Studio Overview
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavigate('reels')}
                  className="text-xs font-mono text-gray-400 hover:text-cyan-300"
                >
                  View Reels Showcase
                </button>
                <span className="text-gray-600">•</span>
                <button
                  onClick={() => handleNavigate('admin')}
                  className="text-xs font-mono text-gray-400 hover:text-white"
                >
                  Admin Portal
                </button>
              </div>
            </div>
            <TikTokStudioRecorder
              onVideoPublished={() => {
                refreshAllData();
              }}
            />
          </div>
        )}

        {/* Journal Screen */}
        {activeTab === 'journal' && (
          <JournalSection
            posts={posts}
            profile={profile}
            isAdmin={storageService.getAdminAuth().isAuthenticated}
            onNavigate={handleNavigate}
            onOpenAdminNewPost={() => handleNavigate('admin')}
            onShowNotification={msg => {
              console.log(msg);
            }}
          />
        )}

        {/* Client Testimonials Screen */}
        {activeTab === 'testimonials' && (
          <TestimonialSlider
            testimonials={testimonials}
            onReviewAdded={newReview => {
              setTestimonials(prev => [newReview, ...prev]);
            }}
          />
        )}

        {/* About Screen */}
        {activeTab === 'about' && (
          <AboutSection
            profile={profile}
            onBookNow={() => handleNavigate('booking')}
          />
        )}

        {/* Admin Studio Dashboard */}
        {activeTab === 'admin' && (
          <AdminDashboard
            profile={profile}
            galleryItems={galleryItems}
            bookings={bookings}
            posts={posts}
            onUpdateProfile={newProf => setProfile(newProf)}
            onRefreshData={refreshAllData}
            onSplashSettingsUpdated={newSettings => setSplashSettings(newSettings)}
            onOpenApkModal={() => setIsApkModalOpen(true)}
            onTriggerSplash={() => setShowSplash(true)}
          />
        )}

        {/* Dedicated Cash App POS / Client Pay Portal Screen */}
        {activeTab === 'pos' && (
          <div className="py-6 px-3 sm:px-6 max-w-6xl mx-auto space-y-4">
            {/* If user is verified admin, allow toggling between studio register and client pay view */}
            {storageService.getAdminAuth().isAuthenticated ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleNavigate('home')}
                      className="text-xs font-mono text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      ← Back to Studio
                    </button>
                    <span className="text-gray-600">•</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">
                      Tex Admin Verified
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleNavigate('admin')}
                      className="text-xs font-mono text-gray-300 hover:text-white px-2 py-1"
                    >
                      Admin Dashboard
                    </button>
                  </div>
                </div>

                <AdminPosTab
                  profile={profile}
                  bookings={bookings}
                  onUpdateProfile={newProf => setProfile(newProf)}
                  onRefreshData={refreshAllData}
                  onShowNotification={msg => console.log(msg)}
                />
              </div>
            ) : (
              /* Public / Client Facing View: Pure Client Pay Portal - ZERO financial totals, ZERO POS registers */
              <ClientCashAppPayPortal
                profile={profile}
                onAdminUnlock={() => handleNavigate('admin')}
                onNavigate={handleNavigate}
              />
            )}
          </div>
        )}

        {/* Global Footer with Compliance Links */}
        <footer className="mt-16 pb-16 pt-8 border-t border-cyan-950/40 text-center text-xs text-gray-500 max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span>© {new Date().getFullYear()} Lights Out Tattoo (Tex) • Winchester, VA</span>
            <span className="text-gray-700 hidden sm:inline">•</span>
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 underline transition">
              Terms of Service
            </a>
            <span className="text-gray-700">•</span>
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400 underline transition">
              Privacy Policy
            </a>
          </div>
        </footer>
      </main>

      {/* Bottom Locked Appbar for Mobile Precision */}
      <BottomAppBar activeTab={activeTab} isAdmin={isAdmin} onNavigate={handleNavigate} />

      {/* Mobile Drawer (Triggered by Top Right Busted Lightbulb) */}
      <MobileDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        profile={profile}
        isAdmin={isAdmin}
        onNavigate={handleNavigate}
        onOpenApkModal={() => setIsApkModalOpen(true)}
        onTriggerSplash={() => setShowSplash(true)}
      />

      {/* Android APK & PWA Setup Modal */}
      <AndroidApkModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />

      {/* Put My Image in Studio Modal */}
      <StudioPhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        profile={profile}
        onPhotoUpdated={newProf => setProfile(newProf)}
      />
    </div>
  );
}
