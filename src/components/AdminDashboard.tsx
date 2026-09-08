import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  PlusCircle,
  Trash2,
  Edit3,
  Image,
  CalendarCheck,
  BookOpen,
  Settings,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  Layers,
  Save,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Flame,
  Camera,
  Calendar as CalendarIcon,
  Zap,
  Smartphone,
  DollarSign,
  Video,
  Eye,
  X
} from 'lucide-react';
import {
  ArtistProfile,
  Booking,
  GalleryItem,
  JournalPost,
  ArtCategoryKey,
  AdminAuthSession,
  SplashScreenSettings
} from '../types';
import { storageService } from '../services/storage';
import { BulkGalleryUploadModal } from './BulkGalleryUploadModal';
import { AdminCalendarSync } from './AdminCalendarSync';
import { AdminPosTab } from './AdminPosTab';
import { AdminTikTokTab } from './AdminTikTokTab';
import { TikTokStudioRecorder } from './TikTokStudioRecorder';
import { LightsOutPayPortal } from './LightsOutPayPortal';
import { ShareJournalToTikTokModal } from './ShareJournalToTikTokModal';
import { AdminLoginGate } from './AdminLoginGate';
import { LiveSplashStudio } from './LiveSplashStudio';

interface AdminDashboardProps {
  profile: ArtistProfile;
  galleryItems: GalleryItem[];
  bookings: Booking[];
  posts: JournalPost[];
  onUpdateProfile: (profile: ArtistProfile) => void;
  onRefreshData: () => void;
  onSplashSettingsUpdated?: (settings: SplashScreenSettings) => void;
  onOpenApkModal?: () => void;
  onTriggerSplash?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  profile,
  galleryItems,
  bookings,
  posts,
  onUpdateProfile,
  onRefreshData,
  onSplashSettingsUpdated,
  onOpenApkModal,
  onTriggerSplash
}) => {
  const [authSession, setAuthSession] = useState<AdminAuthSession>(() => storageService.getAdminAuth());
  const [activeTab, setActiveTab] = useState<'gallery' | 'bookings' | 'calendar' | 'pos' | 'tiktok' | 'livestudio' | 'splash' | 'profile' | 'journal' | 'backup'>('gallery');
  const [notification, setNotification] = useState<string | null>(null);
  const [posBooking, setPosBooking] = useState<Booking | null>(null);
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);

  // Check URL query parameters on mount to deep-link directly to subtabs like tiktok
  React.useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const subtab = params.get('subtab');
      if (subtab && ['gallery', 'bookings', 'calendar', 'pos', 'tiktok', 'livestudio', 'splash', 'profile', 'journal', 'backup'].includes(subtab)) {
        setActiveTab(subtab as any);
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // --- GALLERY FORM STATE ---
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ArtCategoryKey>('realism');
  const [newDesc, setNewDesc] = useState('');
  const [newPlacement, setNewPlacement] = useState('Forearm');
  const [newSessionHours, setNewSessionHours] = useState(4);
  const [newTags, setNewTags] = useState('realism, blackandgrey');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newIsCoverUp, setNewIsCoverUp] = useState(false);
  const [newBeforeImageUrl, setNewBeforeImageUrl] = useState('');

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isBefore = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await storageService.fileToBase64(file);
    if (isBefore) {
      setNewBeforeImageUrl(base64);
    } else {
      setNewImageUrl(base64);
    }
  };

  const handleAddGalleryItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newImageUrl.trim()) {
      showNotification('Title and an image (URL or uploaded file) are required.');
      return;
    }

    const categoryLabels: Record<ArtCategoryKey, string> = {
      all: 'All Masterpieces',
      realism: 'Black & Grey Realism',
      coverups: 'Cover-Up Transformation',
      portraits: 'Portraits & Figures',
      dark_neo: 'Dark Neo & Skulls',
      machines: 'Old Skool & Machines',
      biomech: 'Biomechanical & Voltage'
    };

    storageService.createGalleryItem({
      title: newTitle.trim(),
      category: newCategory,
      categoryLabel: categoryLabels[newCategory] || 'Custom Tattoo',
      imageUrl: newImageUrl,
      description: newDesc.trim() || 'Custom piece crafted by Tex at Lights Out Tattoo.',
      sessionHours: Number(newSessionHours),
      placement: newPlacement,
      isCoverUp: newIsCoverUp,
      beforeImageUrl: newIsCoverUp ? newBeforeImageUrl : undefined,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean)
    });

    showNotification('New tattoo piece added to portfolio gallery!');
    // Reset
    setNewTitle('');
    setNewDesc('');
    setNewImageUrl('');
    setNewBeforeImageUrl('');
    setNewIsCoverUp(false);
    onRefreshData();
  };

  const handleDeleteGalleryItem = (id: string) => {
    // Note: window.confirm is blocked in some iframe environments, bypassing for now
    storageService.deleteGalleryItem(id);
    showNotification('Piece deleted.');
    onRefreshData();
  };

  // --- BOOKING STATUS UPDATES ---
  const handleUpdateBookingStatus = (id: string, status: Booking['status']) => {
    storageService.updateBookingStatus(id, status);
    showNotification(`Booking status set to ${status}`);
    onRefreshData();
  };

  const handleUpdateBookingDeposit = (id: string, depositStatus: 'unpaid' | 'paid' | 'forfeited') => {
    storageService.updateBookingDeposit(id, depositStatus);
    showNotification(`Deposit marked as ${depositStatus.toUpperCase()}`);
    onRefreshData();
  };

  // --- JOURNAL MANAGEMENT STATE & HANDLERS ---
  const [journalTitle, setJournalTitle] = useState('');
  const [journalExcerpt, setJournalExcerpt] = useState('');
  const [journalContent, setJournalContent] = useState('');
  const [journalCategory, setJournalCategory] = useState('Technique');
  const [journalReadTime, setJournalReadTime] = useState('4 min read');
  const [journalImageUrl, setJournalImageUrl] = useState('');
  const [journalTags, setJournalTags] = useState('tattoo, winchesterva, realism');
  const [shareToTikTokPost, setShareToTikTokPost] = useState<JournalPost | null>(null);
  const [viewingJournalPost, setViewingJournalPost] = useState<JournalPost | null>(null);

  // Keyboard shortcut: Escape key closes article reader in admin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && viewingJournalPost) {
        setViewingJournalPost(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingJournalPost]);

  const handleCreateJournalPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!journalTitle.trim() || !journalContent.trim()) {
      showNotification('Title and content are required.');
      return;
    }

    const currentPosts = storageService.getJournalPosts();
    const newPost: JournalPost = {
      id: `journal-${Date.now()}`,
      title: journalTitle.trim(),
      excerpt: journalExcerpt.trim() || journalContent.trim().substring(0, 150) + '...',
      content: journalContent.trim(),
      category: journalCategory.trim() || 'Insight',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      readTime: journalReadTime.trim() || '4 min read',
      author: 'Tex',
      imageUrl: journalImageUrl.trim() || undefined,
      tags: journalTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    };

    storageService.saveJournalPosts([newPost, ...currentPosts]);
    showNotification('New journal article published to studio blog!');
    setJournalTitle('');
    setJournalExcerpt('');
    setJournalContent('');
    setJournalImageUrl('');
    onRefreshData();
  };

  const handleDeleteJournalPost = (id: string) => {
    // Note: window.confirm is blocked in some iframe environments, bypassing for now
    const currentPosts = storageService.getJournalPosts();
    storageService.saveJournalPosts(currentPosts.filter(p => p.id !== id));
    showNotification('Journal post removed.');
    onRefreshData();
  };

  // --- BULK GALLERY MODAL ---
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  // --- PROFILE SETTINGS ---
  const [editHourlyRate, setEditHourlyRate] = useState(profile.hourlyRate);
  const [editDiscount, setEditDiscount] = useState(profile.onlineDiscountPercent);
  const [editPhone, setEditPhone] = useState(profile.phone);
  const [editStatusMessage, setEditStatusMessage] = useState(profile.statusMessage);
  const [editLiveStatus, setEditLiveStatus] = useState(profile.liveStatus);
  const [editAvatarUrl, setEditAvatarUrl] = useState(profile.avatarUrl);
  const [editBannerUrl, setEditBannerUrl] = useState(profile.bannerUrl);
  const [editSecurityDeposit, setEditSecurityDeposit] = useState(profile.securityDepositAmount ?? 200);
  const [editCashAppHandle, setEditCashAppHandle] = useState(profile.cashAppHandle ?? '$LightsOutTattooTex');
  const [editDepositPolicyText, setEditDepositPolicyText] = useState(
    profile.depositPolicyText ??
    '$200 nonrefundable security deposit required to secure any appointment. If you miss your appointment without prior notification, you lose your spot and your deposit is forfeited. Reschedules are accepted with proper notification and schedule change.'
  );

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await storageService.fileToBase64(file);
      setEditAvatarUrl(base64);
      showNotification('Artist portrait updated! Click Save Profile to apply.');
    } catch (err) {
      console.error(err);
      showNotification('Failed to process image file.');
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const base64 = await storageService.fileToBase64(file);
      setEditBannerUrl(base64);
      showNotification('Studio banner updated! Click Save Profile to apply.');
    } catch (err) {
      console.error(err);
      showNotification('Failed to process image file.');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: ArtistProfile = {
      ...profile,
      hourlyRate: Number(editHourlyRate),
      onlineDiscountPercent: Number(editDiscount),
      securityDepositAmount: Number(editSecurityDeposit),
      depositPolicyText: editDepositPolicyText.trim(),
      cashAppHandle: editCashAppHandle.trim().startsWith('$') ? editCashAppHandle.trim() : `$${editCashAppHandle.trim()}`,
      phone: editPhone.trim(),
      statusMessage: editStatusMessage.trim(),
      liveStatus: editLiveStatus,
      avatarUrl: editAvatarUrl,
      bannerUrl: editBannerUrl
    };
    storageService.saveProfile(updated);
    onUpdateProfile(updated);
    showNotification('Studio profile, rates, and deposit policy settings saved!');
  };

  // --- BACKUP & RESTORE (Prevent Chromebook Data Loss) ---
  const handleExportBackup = () => {
    const jsonStr = storageService.exportFullDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lights-out-tattoo-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Database backup JSON exported safely!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      const success = storageService.importFullDataJson(content);
      if (success) {
        showNotification('Database restored successfully from backup!');
        onRefreshData();
      } else {
        alert('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // If not logged in as Admin, gate with TikTok Login & PIN Screen
  // Hooks have now all executed in identical order, completely preventing React hook order crashes
  if (!authSession.isAuthenticated) {
    return (
      <div className="py-6 px-3 sm:px-6 max-w-6xl mx-auto">
        <AdminLoginGate
          onLoginSuccess={session => {
            setAuthSession(session);
            showNotification(
              session.method === 'tiktok'
                ? `Logged in as ${session.username || '@lightsouttattoo'} via TikTok!`
                : 'Studio unlocked via Master PIN!'
            );
          }}
        />
      </div>
    );
  }

  return (
    <div className="py-6 px-3 sm:px-6 max-w-6xl mx-auto" id="admin-dashboard">
      {/* Admin Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#080e1c] border-2 border-cyan-400/50 shadow-[0_0_25px_rgba(0,240,255,0.2)] mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-400 text-cyan-300 shadow-[0_0_12px_#00f0ff]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-black text-xl text-white">
                ADMIN STUDIO DASHBOARD
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                TEX MODE
              </span>
            </div>
            <p className="text-xs text-gray-400 font-tech mt-0.5">
              Self-contained database engine. Add gallery photos, manage client appointments, and update live rates.
            </p>
          </div>
        </div>

        {/* Auth Status & Lock Button */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {authSession.method === 'tiktok' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black border border-cyan-400 text-cyan-300 font-mono text-xs shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <i className="fa-brands fa-tiktok text-white"></i>
              <span className="font-bold">{authSession.username || '@lightsouttattoo'}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[10px] text-gray-400 hidden sm:inline">Verified Artist</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>PIN Mode (Tex)</span>
            </div>
          )}

          {/* Matrix Splash & Android APK Quick Tools (Tex Only) */}
          {onTriggerSplash && (
            <button
              type="button"
              onClick={onTriggerSplash}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-mono text-xs transition flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
              title="Test Matrix Live Splash Screen"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Matrix Splash</span>
            </button>
          )}

          {onOpenApkModal && (
            <button
              type="button"
              onClick={onOpenApkModal}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-950/70 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 font-mono text-xs transition flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
              title="Android APK & Gradle Setup Guide"
            >
              <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Android Gradle</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              storageService.clearAdminAuth();
              setAuthSession({ isAuthenticated: false, method: 'pin', loginTime: '' });
              showNotification('Studio locked. Signed out of Admin.');
            }}
            className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-red-950/80 border border-gray-700 hover:border-red-500 text-gray-300 hover:text-red-300 font-mono text-xs transition flex items-center gap-1.5"
            title="Lock Studio & Return to Security Gate"
          >
            <span>Lock Studio</span>
          </button>

          {/* Quick Ticker Notification */}
          {notification && (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950 border border-emerald-400 text-emerald-300 text-xs font-mono font-bold animate-fade-in flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{notification}</span>
            </div>
          )}
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin">
        {[
          { id: 'gallery', label: `Portfolio Gallery (${galleryItems.length})`, icon: Image },
          { id: 'splash', label: 'Live Splash Screen Studio', icon: Zap, badge: 'CYBERPUNK' },
          { id: 'bookings', label: `Client Bookings (${bookings.length})`, icon: CalendarCheck, badge: bookings.filter(b => b.status === 'pending').length },
          { id: 'journal', label: `Journal Posts (${posts.length})`, icon: BookOpen },
          { id: 'pos', label: 'Cash App POS & Register ($)', icon: DollarSign, badge: 'Terminal' },
          { id: 'calendar', label: 'Google Calendar & Routine', icon: CalendarIcon, badge: bookings.filter(b => !b.googleCalendarEventId).length ? `${bookings.filter(b => !b.googleCalendarEventId).length} Unsynced` : undefined },
          { id: 'tiktok', label: 'TikTok API & Sync', icon: Video, badge: 'API' },
          { id: 'livestudio', label: 'TikTok Live Studio & Waivers', icon: Camera, badge: 'REC' },
          { id: 'profile', label: 'Studio Policy & Rates ($100/hr)', icon: Settings },
          { id: 'backup', label: 'Chromebook Safe Backup', icon: Download }
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition whitespace-nowrap border ${
                isSelected
                  ? 'bg-cyan-500 text-black border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                  : 'bg-[#080d1a] text-gray-300 border-cyan-500/20 hover:border-cyan-400/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {Boolean(tab.badge) && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* --- TAB 1: GALLERY MANAGER --- */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          {/* Quick Bulk Import Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-[#08152e] to-blue-950/80 border-2 border-cyan-400/60 shadow-[0_0_25px_rgba(0,240,255,0.2)] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300 shrink-0 shadow-[0_0_15px_#00f0ff]">
                <Layers className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="text-left">
                <h4 className="font-heading font-black text-base sm:text-lg text-white">
                  HAVE SEVERAL TATTOO IMAGES TO UPLOAD?
                </h4>
                <p className="text-xs text-cyan-300 font-mono">
                  Batch upload all your pictures directly from your Chromebook or phone in 1 click
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_15px_rgba(0,240,255,0.4)] shrink-0 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Bulk Import Images</span>
            </button>
          </div>

          {/* Add New Gallery Item Card */}
          <div className="p-4 sm:p-6 rounded-2xl bg-[#080d1a] border-2 border-cyan-500/30">
            <h3 className="font-heading font-black text-lg text-white mb-1 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-cyan-400" />
              <span>Add New Work to Real-Time Portfolio</span>
            </h3>
            <p className="text-xs text-gray-400 mb-4 font-mono">
              Upload from your device or paste an image URL. It immediately renders across the app gallery and lightbox.
            </p>

            <form onSubmit={handleAddGalleryItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Tattoo Piece Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Nordic Valkyrie Realism Sleeve"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Art Category *
                  </label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  >
                    <option value="realism">Black & Grey Realism</option>
                    <option value="coverups">Cover-Up Transformations</option>
                    <option value="portraits">Portraits & Figures</option>
                    <option value="dark_neo">Dark Neo & Skulls</option>
                    <option value="machines">Old Skool & Machines</option>
                    <option value="biomech">Biomechanical & Voltage</option>
                  </select>
                </div>
              </div>

              {/* Image Input: File or URL */}
              <div className="p-3.5 rounded-xl bg-[#091122] border border-cyan-500/30 space-y-3">
                <label className="block text-xs font-mono text-cyan-300 font-bold">
                  Image Source (Choose file OR paste web URL):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[11px] text-gray-400 mb-1">Option A: Upload Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageFileUpload(e, false)}
                      className="text-xs text-gray-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900"
                    />
                  </div>
                  <div>
                    <span className="block text-[11px] text-gray-400 mb-1">Option B: Image Web URL</span>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={newImageUrl}
                      onChange={e => setNewImageUrl(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {newImageUrl && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={newImageUrl}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-lg border border-cyan-400"
                    />
                    <span className="text-xs text-emerald-400 font-mono">Image loaded ready!</span>
                  </div>
                )}
              </div>

              {/* Cover-up Before/After Upload */}
              <div className="p-3 rounded-xl bg-black/40 border border-cyan-500/20">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={newIsCoverUp}
                    onChange={e => setNewIsCoverUp(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-500 accent-cyan-500"
                  />
                  <span className="text-xs font-mono text-white font-bold">
                    Mark as Cover-Up Transformation (Enables Before/After Lightbox Slider)
                  </span>
                </label>

                {newIsCoverUp && (
                  <div className="mt-2 pt-2 border-t border-gray-800">
                    <span className="block text-[11px] text-cyan-400 mb-1 font-mono">
                      Upload photo of OLD tattoo before cover-up:
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageFileUpload(e, true)}
                      className="text-xs text-gray-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-cyan-950 file:text-cyan-300"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Placement
                  </label>
                  <input
                    type="text"
                    placeholder="Outer Forearm"
                    value={newPlacement}
                    onChange={e => setNewPlacement(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Hours in Chair
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={newSessionHours}
                    onChange={e => setNewSessionHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="skull, wolf, coverup"
                    value={newTags}
                    onChange={e => setNewTags(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">
                  Description / Art Story
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes on needle grouping, greywash tones, or client concept..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_15px_rgba(0,240,255,0.4)]"
              >
                Publish Image to Portfolio Gallery
              </button>
            </form>
          </div>

          {/* Current Gallery List / Deletion manager */}
          <div className="p-4 sm:p-6 rounded-2xl bg-[#080d1a] border border-cyan-500/30">
            <h3 className="font-heading font-black text-base text-white mb-3 flex items-center justify-between">
              <span>Current Portfolio Works ({galleryItems.length})</span>
              <span className="text-xs font-mono text-cyan-400">Manage or remove</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {galleryItems.map(item => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-black/50 border border-cyan-500/20 flex items-center gap-3"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-14 h-14 object-cover rounded-lg shrink-0 border border-cyan-500/30"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading font-bold text-xs text-white truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] font-mono text-cyan-400 block truncate">
                      {item.categoryLabel}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      ~{item.sessionHours} hrs • {item.placement}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteGalleryItem(item.id)}
                    className="p-1.5 rounded-lg bg-red-950/60 text-red-400 hover:bg-red-900 border border-red-500/30 transition"
                    title="Delete piece"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: CLIENT BOOKINGS --- */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-heading font-black text-lg text-white">
                Client Consultation Inquiries & Appointments ({bookings.length})
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                Track appointments, verify $200 security deposits, and sync confirmed dates to Google Calendar
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono text-xs font-bold hover:bg-cyan-900 transition flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,240,255,0.3)]"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Open Google Calendar Sync</span>
              </button>
            </div>
          </div>

          {/* Quick Policy Notice Banner */}
          <div className="p-3.5 rounded-xl bg-[#09152b] border border-cyan-500/30 flex items-start gap-3 text-xs font-mono text-gray-300">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-cyan-300">Studio Deposit & Reschedule Policy:</strong>
              <p className="text-gray-400 text-[11px] leading-relaxed">
                $200 nonrefundable security deposit locks the chair. If a client misses an appointment without advance notification, their spot and deposit are forfeited. Reschedules are accepted with proper advance notice.
              </p>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#080d1a] border border-cyan-500/20 text-gray-400 text-xs font-mono">
              No booking requests logged yet. New submissions will appear here in real time.
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map(b => {
                const depositStatus = b.securityDepositStatus || 'unpaid';
                return (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-[#080d1a] border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-heading font-bold text-base text-white">
                          {b.clientName}
                        </h4>
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                            b.status === 'pending'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/50'
                              : b.status === 'confirmed'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/50'
                              : 'bg-cyan-950 text-cyan-300 border border-cyan-500/50'
                          }`}
                        >
                          {b.status}
                        </span>
                        {b.isCoverUp && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-500/40">
                            Cover-Up
                          </span>
                        )}

                        {/* Deposit Status Badge */}
                        <span
                          className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                            depositStatus === 'paid'
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-400/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                              : depositStatus === 'forfeited'
                              ? 'bg-rose-950/80 text-rose-300 border-rose-400/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                              : 'bg-amber-950/80 text-amber-300 border-amber-400/50'
                          }`}
                        >
                          {depositStatus === 'paid'
                            ? 'Deposit: $200 Paid ✓'
                            : depositStatus === 'forfeited'
                            ? 'Deposit: Forfeited (No-Show) ✕'
                            : 'Deposit: $200 Unpaid ⏳'}
                        </span>

                        {/* Calendar Sync Status */}
                        {b.googleCalendarEventId ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-400/50 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                            <span>G-Cal Synced</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActiveTab('calendar')}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-black text-gray-400 border border-gray-700 hover:border-cyan-400 hover:text-cyan-300 transition flex items-center gap-1"
                          >
                            <CalendarIcon className="w-3 h-3" />
                            <span>Sync to G-Cal</span>
                          </button>
                        )}
                      </div>

                      <p className="text-xs text-gray-300">
                        <strong>Concept:</strong> {b.tattooIdea}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-gray-400">
                        <a
                          href={`tel:${b.phone.replace(/[^0-9]/g, '')}`}
                          className="flex items-center gap-1 text-cyan-400 hover:underline"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{b.phone}</span>
                        </a>
                        {b.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{b.email}</span>
                          </span>
                        )}
                        <span>Placement: {b.placement}</span>
                        <span>Date: {b.preferredDate || 'Flexible'} ({b.preferredTimeSlot})</span>
                        <span className="text-emerald-400 font-bold">
                          Quote: ~${b.finalEstimatedPrice} (-15%)
                        </span>
                      </div>

                      {/* Photos if uploaded */}
                      {(b.coverUpPhotoUrl || b.referencePhotoUrl) && (
                        <div className="flex items-center gap-3 pt-1">
                          {b.coverUpPhotoUrl && (
                            <a href={b.coverUpPhotoUrl} target="_blank" rel="noreferrer">
                              <img
                                src={b.coverUpPhotoUrl}
                                alt="Tattoo to cover"
                                className="w-12 h-12 rounded object-cover border border-red-400"
                                title="Tattoo to cover"
                              />
                            </a>
                          )}
                          {b.referencePhotoUrl && (
                            <a href={b.referencePhotoUrl} target="_blank" rel="noreferrer">
                              <img
                                src={b.referencePhotoUrl}
                                alt="Reference uploaded"
                                className="w-12 h-12 rounded object-cover border border-cyan-400"
                                title="Reference Photo"
                              />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Controls & Deposit Actions */}
                    <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start md:items-end lg:items-center gap-2 shrink-0">
                      {/* Deposit Management Dropdown */}
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-mono text-gray-400">Deposit:</span>
                        <select
                          value={depositStatus}
                          onChange={e =>
                            handleUpdateBookingDeposit(b.id, e.target.value as any)
                          }
                          className="px-2 py-1.5 rounded-lg bg-black border border-cyan-500/40 text-xs font-mono text-white"
                        >
                          <option value="unpaid">Unpaid ($200 Pending)</option>
                          <option value="paid">Paid ($200 Secured)</option>
                          <option value="forfeited">Forfeited (No-Show)</option>
                        </select>
                      </div>

                      {/* Status Dropdown */}
                      <select
                        value={b.status}
                        onChange={e =>
                          handleUpdateBookingStatus(b.id, e.target.value as any)
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-black border border-cyan-500/40 text-xs font-mono text-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="in_chair">In Chair</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          setPosBooking(b);
                          setIsPosModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#00D632] hover:bg-emerald-400 text-black font-mono text-xs font-black transition flex items-center gap-1 shadow-[0_0_10px_rgba(0,214,50,0.4)]"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Ring in POS</span>
                      </button>

                      <a
                        href={`tel:${b.phone.replace(/[^0-9]/g, '')}`}
                        className="px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-400/50 text-cyan-300 font-mono text-xs font-bold hover:bg-cyan-900"
                      >
                        Call
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- TAB: JOURNAL & BLOG POSTS MANAGER --- */}
      {activeTab === 'journal' && (
        <div className="space-y-6 text-left">
          {/* Write New Post Form */}
          <div className="p-4 sm:p-6 rounded-2xl bg-[#080d1a] border-2 border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h3 className="font-heading font-black text-lg text-white">
                  WRITE NEW JOURNAL ARTICLE / POST
                </h3>
              </div>
              <span className="text-xs font-mono text-cyan-300">
                Auto-syncs with Studio Blog & TikTok Share
              </span>
            </div>

            <form onSubmit={handleCreateJournalPost} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={journalTitle}
                    onChange={e => setJournalTitle(e.target.value)}
                    placeholder="e.g. Needle Depth & Skin Stretch: The Anatomy of Grey Wash"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={journalCategory}
                    onChange={e => setJournalCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono outline-none focus:border-cyan-400"
                  >
                    <option value="Technique">Technique & Science</option>
                    <option value="Cover-Up">Cover-Up Mastery</option>
                    <option value="Aftercare">Healing & Aftercare</option>
                    <option value="Culture">Winchester Tattoo Culture</option>
                    <option value="Shop News">Lights Out Studio News</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">
                  Article Excerpt / Short Summary (Preview in Feed & TikTok Share)
                </label>
                <input
                  type="text"
                  value={journalExcerpt}
                  onChange={e => setJournalExcerpt(e.target.value)}
                  placeholder="Quick 1-2 sentence hook describing the key insights..."
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">
                  Full Article Body *
                </label>
                <textarea
                  rows={5}
                  required
                  value={journalContent}
                  onChange={e => setJournalContent(e.target.value)}
                  placeholder="Share Tex's 20+ years of tattooing experience, technical methods, machine setups, or advice for clients..."
                  className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Featured Header Image URL
                  </label>
                  <input
                    type="url"
                    value={journalImageUrl}
                    onChange={e => setJournalImageUrl(e.target.value)}
                    placeholder="https://... cover photo link"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={journalTags}
                    onChange={e => setJournalTags(e.target.value)}
                    placeholder="tattoo, realism, winchesterva"
                    className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-heading font-black text-xs uppercase tracking-wider hover:brightness-110 transition shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Publish Article to Journal</span>
              </button>
            </form>
          </div>

          {/* Current Journal Posts List */}
          <div className="p-4 sm:p-6 rounded-2xl bg-[#080d1a] border-2 border-cyan-500/30 space-y-4">
            <h3 className="font-heading font-black text-base sm:text-lg text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>CURRENT STUDIO JOURNAL ARTICLES ({posts.length})</span>
            </h3>

            <div className="space-y-3">
              {posts.map(post => (
                <div
                  key={post.id}
                  className="p-4 rounded-xl bg-black/60 border border-cyan-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {post.imageUrl && (
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-14 h-14 rounded-lg object-cover border border-cyan-500/30 shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400">
                        <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40">
                          {post.category}
                        </span>
                        <span>{post.date}</span>
                        <span>•</span>
                        <span>{post.readTime}</span>
                      </div>
                      <h4 className="font-heading font-bold text-sm text-white truncate mt-1">
                        {post.title}
                      </h4>
                      <p className="text-xs text-gray-400 line-clamp-1 font-mono mt-0.5">
                        {post.excerpt}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                    {/* Read / Preview button */}
                    <button
                      type="button"
                      onClick={() => setViewingJournalPost(post)}
                      className="px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs hover:bg-cyan-900 transition flex items-center gap-1.5"
                      title="Read full article"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Read</span>
                    </button>

                    {/* Share to TikTok button */}
                    <button
                      type="button"
                      onClick={() => setShareToTikTokPost(post)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-heading font-black text-xs hover:brightness-110 transition shadow-[0_0_10px_rgba(0,240,255,0.3)] flex items-center gap-1.5"
                    >
                      <i className="fa-brands fa-tiktok text-xs"></i>
                      <span>Share to TikTok</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteJournalPost(post.id)}
                      className="p-1.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900 transition"
                      title="Delete article"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB: CASH APP POS & REGISTER --- */}
      {activeTab === 'pos' && (
        <AdminPosTab
          profile={profile}
          bookings={bookings}
          onUpdateProfile={onUpdateProfile}
          onRefreshData={onRefreshData}
          onShowNotification={showNotification}
        />
      )}

      {/* --- TAB 3: GOOGLE CALENDAR & ROUTINE SYNC --- */}
      {activeTab === 'calendar' && (
        <AdminCalendarSync
          bookings={bookings}
          profile={profile}
          onRefreshBookings={onRefreshData}
          onShowNotification={showNotification}
        />
      )}

      {/* --- TAB: TIKTOK API & REELS SYNC --- */}
      {activeTab === 'tiktok' && (
        <AdminTikTokTab
          onShowNotification={showNotification}
          onRefreshData={onRefreshData}
          onOpenLiveStudio={() => setActiveTab('livestudio')}
        />
      )}

      {/* --- TAB: TIKTOK LIVE STUDIO & RECORDER --- */}
      {activeTab === 'livestudio' && (
        <div className="space-y-4">
          <TikTokStudioRecorder
            onVideoPublished={() => {
              showNotification('Session video published to TikTok / Studio Reels!');
              onRefreshData();
            }}
          />
        </div>
      )}

      {/* --- TAB 3: STUDIO RATES & PROFILE --- */}
      {activeTab === 'profile' && (
        <form
          onSubmit={handleSaveProfile}
          className="p-4 sm:p-6 rounded-2xl bg-[#080d1a] border-2 border-cyan-500/30 space-y-5 text-left"
        >
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <div>
              <h3 className="font-heading font-black text-lg text-white">
                Studio Rates, Tex's Photo & Profile Settings
              </h3>
              <p className="text-xs text-cyan-300 font-mono">
                Manage your public artist portrait, hourly rate, and live status
              </p>
            </div>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_15px_rgba(0,240,255,0.4)]"
            >
              Save Changes
            </button>
          </div>

          {/* Tex's Studio Artist Photo & Banner Section */}
          <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/40 space-y-4">
            <h4 className="font-heading font-bold text-sm text-cyan-300 flex items-center gap-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>TEX'S STUDIO ARTIST PORTRAIT & BANNER</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              {/* Avatar Preview */}
              <div className="md:col-span-4 flex flex-col items-center">
                <div className="relative w-32 h-40 rounded-xl overflow-hidden border-2 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.3)] bg-gray-950">
                  <img
                    src={editAvatarUrl}
                    alt="Tex Portrait Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[9px] text-cyan-300">
                    LIVE PORTRAIT
                  </div>
                </div>
                <label className="mt-2.5 px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-400/50 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-900 cursor-pointer flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Choose Photo File</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* URL or Direct text input */}
              <div className="md:col-span-8 space-y-3 text-left">
                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Or Paste Artist Image Web URL:
                  </label>
                  <input
                    type="url"
                    value={editAvatarUrl}
                    onChange={e => setEditAvatarUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/70 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400"
                    placeholder="https://... image link"
                  />
                  <span className="text-[10px] text-gray-400 font-mono mt-1 block">
                    Upload an image file from your Chromebook or paste an image URL to replace the studio portrait.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">
                    Studio Header Banner Image URL:
                  </label>
                  <input
                    type="url"
                    value={editBannerUrl}
                    onChange={e => setEditBannerUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/70 border border-cyan-500/30 text-white text-xs font-mono outline-none focus:border-cyan-400"
                    placeholder="https://... studio banner link"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                Hourly Rate ($) *
              </label>
              <input
                type="number"
                required
                value={editHourlyRate}
                onChange={e => setEditHourlyRate(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono"
              />
              <span className="text-[10px] text-gray-400 font-mono">
                Currently $100/hr flat rate in Winchester, VA
              </span>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                Online Booking Automatic Discount (%) *
              </label>
              <input
                type="number"
                required
                value={editDiscount}
                onChange={e => setEditDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono"
              />
              <span className="text-[10px] text-gray-400 font-mono">
                Currently 15% automatic discount for app bookings
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                Live Status
              </label>
              <select
                value={editLiveStatus}
                onChange={e => setEditLiveStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono"
              >
                <option value="available">Available / Booking Consultations</option>
                <option value="in_chair">In Chair (Tattooing Live)</option>
                <option value="booked">Fully Booked for the Week</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-gray-300 mb-1">
              Live Status Ticker Message
            </label>
            <input
              type="text"
              value={editStatusMessage}
              onChange={e => setEditStatusMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/60 border border-cyan-500/30 text-white text-xs font-mono"
            />
          </div>

          {/* Security Deposit & Reschedule Policy Configuration */}
          <div className="p-4 rounded-xl bg-black/60 border border-cyan-500/40 space-y-4">
            <div className="flex items-center gap-2 text-cyan-300 font-heading font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>SECURITY DEPOSIT & CASH APP GATEWAY CONFIGURATION</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">
                  Required Security Deposit ($) *
                </label>
                <input
                  type="number"
                  required
                  value={editSecurityDeposit}
                  onChange={e => setEditSecurityDeposit(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-black/70 border border-cyan-500/30 text-white text-xs font-mono"
                />
                <span className="text-[10px] text-gray-400 font-mono mt-1 block">
                  Standard nonrefundable deposit required to lock client appointment slot ($200.00).
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">
                  Studio Cash App $Cashtag *
                </label>
                <input
                  type="text"
                  required
                  value={editCashAppHandle}
                  onChange={e => setEditCashAppHandle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-black/70 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold"
                  placeholder="$LightsOutTattooTex"
                />
                <span className="text-[10px] text-gray-400 font-mono mt-1 block">
                  Used in all automated Cash App deep links, QR codes, and digital receipt headers.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-gray-300 mb-1">
                Studio Deposit & Reschedule Policy Text (Public Client Contract):
              </label>
              <textarea
                rows={3}
                value={editDepositPolicyText}
                onChange={e => setEditDepositPolicyText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/70 border border-cyan-500/30 text-white text-xs font-mono leading-relaxed"
                placeholder="200 dollar nonrefundable security deposit, you miss appointment without notification, you lose your spot and deposit. Reschedules are accepted with proper notifications and schedule change."
              />
              <span className="text-[10px] text-gray-400 font-mono mt-1 block">
                This exact policy is displayed to clients on the booking form and required as an agreed contract before consultation requests are submitted.
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_15px_rgba(0,240,255,0.4)]"
          >
            Save Studio Rates, Deposit Policy & Profile
          </button>
        </form>
      )}

      
          
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


      {/* --- TAB 4: CHROMEBOOK SAFE BACKUP & RESET --- */}
      {activeTab === 'backup' && (
        <div className="p-4 sm:p-6 rounded-2xl bg-[#080d1a] border-2 border-cyan-500/30 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-400 text-emerald-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-black text-lg text-white">
                Powerhouse Self-Contained Storage & Chromebook Backup
              </h3>
              <p className="text-xs text-gray-300 font-mono">
                "Recently I deleted my project folder cleaning up my Chromebook." - Tex
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed">
            All your portfolio images, client bookings, and profile settings are persisted in your local powerhouse database. To guarantee you never lose work again, download a 1-click JSON backup to your Google Drive or external drive anytime!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              onClick={handleExportBackup}
              className="p-4 rounded-xl bg-cyan-950/70 border border-cyan-400/50 hover:bg-cyan-900 text-cyan-300 font-mono text-xs font-bold flex flex-col items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            >
              <Download className="w-6 h-6 text-cyan-400" />
              <span>Export Full Database Backup (.JSON)</span>
            </button>

            <label className="p-4 rounded-xl bg-blue-950/70 border border-blue-400/50 hover:bg-blue-900 text-blue-300 font-mono text-xs font-bold flex flex-col items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-6 h-6 text-blue-400" />
              <span>Restore from Backup (.JSON)</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>

          <div className="pt-4 border-t border-gray-800 flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400">
              Need fresh default showcase?
            </span>
            <button
              onClick={() => {
                // Note: window.confirm is blocked in some iframe environments, bypassing for now
                storageService.resetToDefaults();
                showNotification('Reset to defaults.');
                onRefreshData();
              }}
              className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-400 hover:text-white text-xs font-mono"
            >
              Reset to Master Showcase
            </button>
          </div>
        </div>
      )}

      {/* --- TAB: LIVE SPLASH SCREEN STUDIO --- */}
      {activeTab === 'splash' && (
        <LiveSplashStudio
          galleryItems={galleryItems}
          onShowNotification={showNotification}
          onSettingsUpdated={onSplashSettingsUpdated}
        />
      )}

      {/* Bulk Gallery Upload Modal */}
      <BulkGalleryUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onGalleryUpdated={() => {
          onRefreshData();
          showNotification('Portfolio gallery updated with bulk images!');
        }}
      />

      {/* POS Payment Gateway Modal (Invoked from Booking list) */}
      <LightsOutPayPortal
        isOpen={isPosModalOpen}
        onClose={() => {
          setIsPosModalOpen(false);
          setPosBooking(null);
        }}
        profile={profile}
        initialBooking={posBooking}
        initialAmount={
          posBooking
            ? posBooking.securityDepositStatus !== 'paid'
              ? 200
              : posBooking.finalEstimatedPrice
            : 200
        }
        paymentType={posBooking?.securityDepositStatus !== 'paid' ? 'deposit' : 'session_balance'}
        onPaymentCompleted={tx => {
          onRefreshData();
          showNotification(`Payment of $${tx.totalPaid} recorded successfully!`);
        }}
      />

      {/* Share Journal Post to TikTok Modal */}
      {shareToTikTokPost && (
        <ShareJournalToTikTokModal
          isOpen={Boolean(shareToTikTokPost)}
          onClose={() => setShareToTikTokPost(null)}
          post={shareToTikTokPost}
          onShowNotification={showNotification}
        />
      )}

      {/* Full Article Reader Modal for Admin Preview */}
      {viewingJournalPost && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 backdrop-blur-md px-3.5 py-6 sm:px-6 sm:py-10 md:py-12 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewingJournalPost(null);
          }}
        >
          <div
            className="relative w-full max-w-3xl max-h-[calc(100dvh-3.5rem)] sm:max-h-[calc(100dvh-5rem)] flex flex-col rounded-2xl bg-[#080d1a] border-2 border-cyan-400/60 shadow-[0_0_50px_rgba(0,240,255,0.25)] my-auto text-left overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Header with Title and Fixed Close Button */}
            <div className="sticky top-0 z-20 flex items-center justify-between p-3.5 sm:p-5 bg-[#080d1a]/95 backdrop-blur-md border-b border-cyan-500/30 shrink-0">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-[10px] font-mono text-cyan-400 uppercase font-bold shrink-0">
                  {viewingJournalPost.category}
                </span>
                <span className="text-xs text-gray-500 font-mono hidden sm:inline">•</span>
                <span className="text-xs text-gray-400 font-mono hidden sm:inline">{viewingJournalPost.readTime}</span>
                <span className="text-xs text-gray-500 font-mono hidden sm:inline">•</span>
                <span className="text-xs font-mono text-cyan-300 font-bold truncate">
                  {viewingJournalPost.title}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setViewingJournalPost(null)}
                className="p-2 sm:p-2.5 rounded-xl bg-gray-900 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-400 hover:bg-cyan-950/80 transition shrink-0 ml-2 shadow-[0_0_10px_rgba(0,240,255,0.2)] flex items-center gap-1"
                title="Close article (Esc)"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
                <span className="text-[10px] font-mono text-gray-400 hidden sm:inline">ESC</span>
              </button>
            </div>

            {/* Scrollable Article Body */}
            <div className="p-4 sm:p-7 overflow-y-auto space-y-5 flex-1 overscroll-contain">
              {/* Post Meta */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono text-cyan-400">
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 font-bold">
                  {viewingJournalPost.category}
                </span>
                <span>{viewingJournalPost.date}</span>
                <span>•</span>
                <span>{viewingJournalPost.readTime}</span>
                <span>•</span>
                <span className="text-gray-400">By {viewingJournalPost.author}</span>
              </div>

              <h2 className="font-heading font-black text-xl sm:text-3xl text-white leading-tight">
                {viewingJournalPost.title}
              </h2>

              {viewingJournalPost.imageUrl && (
                <div className="w-full max-h-[360px] rounded-xl overflow-hidden border border-cyan-500/30 bg-black">
                  <img
                    src={viewingJournalPost.imageUrl}
                    alt={viewingJournalPost.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Article Content Render */}
              <div className="text-sm sm:text-base text-gray-200 leading-relaxed space-y-4 font-sans whitespace-pre-line">
                {viewingJournalPost.content}
              </div>

              {/* Tags Strip */}
              {viewingJournalPost.tags && viewingJournalPost.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-cyan-500/20">
                  {viewingJournalPost.tags.map(t => (
                    <span
                      key={t}
                      className="text-xs font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2.5 py-1 rounded-lg"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sticky Bottom Actions & Close Button */}
            <div className="sticky bottom-0 z-20 p-3 sm:p-4 bg-[#080d1a]/95 backdrop-blur-md border-t border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setViewingJournalPost(null)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-900 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 font-mono text-xs font-bold transition order-2 sm:order-1"
              >
                ← Back / Close Article
              </button>

              <button
                type="button"
                onClick={() => {
                  const p = viewingJournalPost;
                  setViewingJournalPost(null);
                  setShareToTikTokPost(p);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-heading font-black text-xs hover:brightness-110 transition shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2 order-1 sm:order-2 shrink-0"
              >
                <i className="fa-brands fa-tiktok text-sm"></i>
                <span>SHARE TO TIKTOK PROFILE</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
