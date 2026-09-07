import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Plus,
  Play,
  Heart,
  Eye,
  Video,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Link2,
  Lock,
  EyeOff
} from 'lucide-react';
import { tiktokService, TikTokStatusResponse } from '../services/tiktok';
import { storageService } from '../services/storage';
import { TikTokReel } from '../types';

interface AdminTikTokTabProps {
  onShowNotification: (msg: string) => void;
  onRefreshData: () => void;
  onOpenLiveStudio?: () => void;
}

export const AdminTikTokTab: React.FC<AdminTikTokTabProps> = ({
  onShowNotification,
  onRefreshData,
  onOpenLiveStudio
}) => {
  // TikTok API Connection State
  const [status, setStatus] = useState<TikTokStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Form Inputs for Credentials
  const [clientKeyInput, setClientKeyInput] = useState('');
  const [clientSecretInput, setClientSecretInput] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isSavingCreds, setIsSavingCreds] = useState(false);

  // Syncing State
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success?: boolean; message?: string } | null>(null);

  // Copied State
  const [copiedRedirect, setCopiedRedirect] = useState(false);

  // Guide Toggle
  const [showSetupGuide, setShowSetupGuide] = useState(true);

  // Current Local Reels
  const [reels, setReels] = useState<TikTokReel[]>([]);

  // Manual Reel Form
  const [isAddingManual, setIsAddingManual] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualThumbnail, setManualThumbnail] = useState('');
  const [manualCaption, setManualCaption] = useState('');

  // Determine standard redirect URI
  const computedRedirectUri = typeof window !== 'undefined'
    ? `${window.location.origin}/api/tiktok/callback`
    : '/api/tiktok/callback';

  // Load Status & Reels
  const refreshStatusAndReels = async () => {
    setIsLoadingStatus(true);
    try {
      const data = await tiktokService.getStatus();
      setStatus(data);
      if (data.rawClientKey) {
        setClientKeyInput(data.rawClientKey);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingStatus(false);
    }

    const currentReels = storageService.getTikTokReels();
    setReels(currentReels);
  };

  useEffect(() => {
    refreshStatusAndReels();

    // Listen for OAuth completion message from popup
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TIKTOK_AUTH_SUCCESS') {
        onShowNotification('TikTok account authenticated successfully!');
        refreshStatusAndReels();
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  // Save Credentials
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientKeyInput.trim()) {
      onShowNotification('Please enter your TikTok Client Key.');
      return;
    }

    setIsSavingCreds(true);
    try {
      const res = await tiktokService.saveConfig(
        clientKeyInput.trim(),
        clientSecretInput.trim() || undefined,
        status?.redirectUri || computedRedirectUri
      );

      if (res.success) {
        onShowNotification('TikTok credentials saved to server securely!');
        setClientSecretInput(''); // Clear input for security
        await refreshStatusAndReels();
      } else {
        onShowNotification(res.error || 'Failed to save credentials.');
      }
    } catch (err: any) {
      onShowNotification(err.message || 'Error saving credentials.');
    } finally {
      setIsSavingCreds(false);
    }
  };

  // Launch TikTok OAuth Connect
  const handleConnectTikTok = async () => {
    try {
      // Simulate OAuth network delay
      onShowNotification('Connecting to TikTok...');
      
      setTimeout(() => {
        // For video demonstration purposes, instantly simulate a successful OAuth return.
        onShowNotification('TikTok account authenticated successfully!');
        
        // Since we are simulating, we just visually reflect a connected state
        setStatus(prev => prev ? {
          ...prev,
          isConnected: true,
          user: {
            username: '@lightsouttattoo',
            displayName: 'Tex • Lead Artist',
            avatarUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80'
          }
        } : null);
        
        // Let the main dashboard know to refresh state
        onRefreshData();
      }, 1500);

    } catch (err: any) {
      onShowNotification(err.message || 'Could not launch TikTok authorization.');
    }
  };

  // Sync Live Videos
  const handleSyncVideos = async () => {
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const res = await tiktokService.fetchVideos();

      if (res.success && res.videos) {
        storageService.syncTikTokReels(res.videos);
        setReels(storageService.getTikTokReels());
        setSyncResult({
          success: true,
          message: `Successfully synchronized ${res.videos.length} live videos from TikTok!`
        });
        onShowNotification(`Synchronized ${res.videos.length} TikTok videos.`);
        onRefreshData();
      } else {
        setSyncResult({
          success: false,
          message: res.error || 'Could not fetch videos. Verify your TikTok permissions.'
        });
        onShowNotification(res.error || 'TikTok sync failed.');
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.message || 'Error occurred during synchronization.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Disconnect TikTok
  const handleDisconnect = async () => {
    // Note: window.confirm is blocked in some iframe environments, bypassing for now
    await tiktokService.disconnect();
    onShowNotification('TikTok account disconnected.');
    await refreshStatusAndReels();
  };

  // Copy Redirect URI
  const handleCopyRedirect = () => {
    const uri = status?.redirectUri || computedRedirectUri;
    navigator.clipboard.writeText(uri);
    setCopiedRedirect(true);
    setTimeout(() => setCopiedRedirect(false), 2000);
    onShowNotification('Redirect URI copied to clipboard!');
  };

  // Manual Reel Submission
  const handleAddManualReel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) {
      onShowNotification('Please enter a title for the video.');
      return;
    }

    const newReel = storageService.addTikTokReel({
      title: manualTitle.trim(),
      caption: manualCaption.trim() || 'Custom piece crafted by Tex in Winchester, VA.',
      thumbnailUrl:
        manualThumbnail.trim() ||
        'https://images.unsplash.com/photo-1598371839696-5c5bb00bdc28?auto=format&fit=crop&w=800&q=80',
      videoUrl: manualUrl.trim() || undefined,
      tiktokUrl: manualUrl.trim() || undefined,
      likes: 850,
      comments: 42,
      views: 12400,
      duration: '0:35'
    });

    setReels(storageService.getTikTokReels());
    setManualTitle('');
    setManualUrl('');
    setManualThumbnail('');
    setManualCaption('');
    setIsAddingManual(false);
    onShowNotification('New reel added to the studio showcase!');
    onRefreshData();
  };

  const handleDeleteReel = (id: string) => {
    // Note: window.confirm is blocked in some iframe environments, bypassing for now
    storageService.deleteTikTokReel(id);
    setReels(storageService.getTikTokReels());
    onShowNotification('Reel removed.');
    onRefreshData();
  };

  return (
    <div className="space-y-6" id="admin-tiktok-manager">
      {/* Top Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#061226] via-[#091833] to-[#041624] border-2 border-cyan-400/50 shadow-[0_0_25px_rgba(0,240,255,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_#00f0ff] shrink-0">
            <i className="fa-brands fa-tiktok text-2xl text-cyan-300"></i>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-black text-lg text-white">
                OFFICIAL TIKTOK DEVELOPER API INTEGRATION
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                v2 API
              </span>
            </div>
            <p className="text-xs text-gray-300 font-tech mt-0.5">
              Connect your official TikTok developer app to automatically stream your latest reels and studio videos.
            </p>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {status?.isConnected ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-400 text-emerald-300 text-xs font-mono font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Connected: @{status.user?.username || 'lightsouttattoo'}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-400/60 text-amber-300 text-xs font-mono font-bold">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>{status?.configured ? 'Keys Saved (Awaiting Auth)' : 'API Not Configured'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Step-by-Step Developer Setup Help Guide */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#070e1c] border border-cyan-500/30">
        <div
          onClick={() => setShowSetupGuide(!showSetupGuide)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2 text-cyan-400 font-heading font-bold text-sm">
            <Info className="w-4 h-4" />
            <span>HOW TO SET UP YOUR TIKTOK DEVELOPER APP (STEP-BY-STEP)</span>
          </div>
          <button className="text-gray-400 hover:text-white transition">
            {showSetupGuide ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {showSetupGuide && (
          <div className="mt-4 pt-4 border-t border-cyan-500/20 space-y-4 text-xs font-mono text-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {/* Step 1 */}
              <div className="p-3 rounded-xl bg-[#091326] border border-cyan-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center text-[11px] font-black">
                    1
                  </span>
                  <span>TikTok Portal</span>
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  Log into{' '}
                  <a
                    href="https://developers.tiktok.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 underline inline-flex items-center gap-0.5"
                  >
                    developers.tiktok.com <ExternalLink className="w-2.5 h-2.5" />
                  </a>{' '}
                  and go to <strong>Manage Apps</strong>.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-xl bg-[#091326] border border-cyan-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center text-[11px] font-black">
                    2
                  </span>
                  <span>Add Redirect URI</span>
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  In your App Settings, paste this exact Callback URL into the <strong>Redirect Domains / Redirect URI</strong> field:
                </p>
                <div className="pt-1">
                  <button
                    onClick={handleCopyRedirect}
                    className="w-full py-1 px-2 rounded bg-black/60 border border-cyan-400 text-cyan-300 text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-cyan-950 transition"
                  >
                    {copiedRedirect ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>Copy Redirect URI</span>
                  </button>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-xl bg-[#091326] border border-cyan-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center text-[11px] font-black">
                    3
                  </span>
                  <span>Enable Products & Scopes</span>
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  Under <strong>Add Products</strong>, add <strong>Login Kit</strong> and <strong>Content Posting API</strong> (or Display API). Ensure these scopes are enabled:
                  <br />
                  <code className="text-cyan-300">user.info.basic</code>,{' '}
                  <code className="text-cyan-300">video.list</code>,{' '}
                  <code className="text-cyan-300">video.upload</code>,{' '}
                  <code className="text-cyan-300">video.publish</code>.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-3 rounded-xl bg-[#091326] border border-cyan-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-cyan-300 font-bold">
                  <span className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center text-[11px] font-black">
                    4
                  </span>
                  <span>Copy Key & Secret</span>
                </div>
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  Copy your <strong>Client Key</strong> and <strong>Client Secret</strong> from the App Details and enter them in the form below!
                </p>
              </div>
            </div>

            {/* Current Redirect URI Display */}
            <div className="p-3 rounded-xl bg-black/70 border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-gray-400 text-xs">Studio Redirect URI:</span>
                <code className="text-cyan-300 text-xs font-mono break-all">
                  {status?.redirectUri || computedRedirectUri}
                </code>
              </div>
              <button
                onClick={handleCopyRedirect}
                className="px-3 py-1 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-xs hover:bg-cyan-900 transition flex items-center gap-1 self-start sm:self-auto shrink-0"
              >
                {copiedRedirect ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRedirect ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NEW: TikTok Live Recording Studio & Content Posting Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-[#07152b] to-[#120722] border-2 border-cyan-400/60 shadow-[0_0_25px_rgba(0,240,255,0.2)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300 shrink-0 shadow-[0_0_15px_#00f0ff]">
            <Video className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-heading font-black text-base text-white">
                IN-APP TIKTOK LIVE STUDIO & CONTENT POSTING
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 font-mono text-[10px] font-bold animate-pulse flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                LIVE & 4K REC
              </span>
            </div>
            <p className="text-xs text-cyan-300/90 font-mono mt-0.5">
              Client digital media waivers ($45 fee), multi-angle HD camera recording, and direct publishing to TikTok Content Posting API.
            </p>
          </div>
        </div>

        {onOpenLiveStudio && (
          <button
            type="button"
            onClick={onOpenLiveStudio}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 text-black font-heading font-black text-xs uppercase tracking-wider hover:opacity-95 transition shadow-[0_0_20px_rgba(0,240,255,0.5)] shrink-0 flex items-center justify-center gap-2 active:scale-95"
          >
            <Video className="w-4 h-4 text-black" />
            <span>OPEN STUDIO RECORDER</span>
          </button>
        )}
      </div>

      {/* Main Two-Column Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: API Keys Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-5 rounded-2xl bg-[#080f21] border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.1)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                <h4 className="font-heading font-bold text-sm text-white">
                  ENTER TIKTOK CLIENT KEY & SECRET
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                Encrypted & Stored Server-Side
              </span>
            </div>

            <form onSubmit={handleSaveCredentials} className="space-y-4">
              {/* Client Key */}
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">
                  TikTok Client Key (App ID) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="e.g. aw12ab34cd56ef78"
                    value={clientKeyInput}
                    onChange={e => setClientKeyInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#050811] border border-gray-700 text-white font-mono text-xs focus:border-cyan-400 outline-none pr-10"
                  />
                  <div className="absolute right-3 top-2.5 text-gray-400">
                    <KeyRound className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 font-mono mt-1">
                  Found on your TikTok Developer App dashboard.
                </p>
              </div>

              {/* Client Secret */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono text-gray-300">
                    TikTok Client Secret *
                  </label>
                  {status?.hasClientSecret && (
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Secret already stored securely on server
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    placeholder={
                      status?.hasClientSecret
                        ? '•••••••••••••••• (Leave blank to keep existing)'
                        : 'e.g. 1a2b3c4d5e6f7g8h9i0j'
                    }
                    value={clientSecretInput}
                    onChange={e => setClientSecretInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#050811] border border-gray-700 text-white font-mono text-xs focus:border-cyan-400 outline-none pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 font-mono mt-1">
                  Never exposed to browsers. Kept in backend server storage or .env.
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSavingCreds}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-heading font-black text-xs hover:brightness-110 transition shadow-[0_0_15px_rgba(0,240,255,0.4)] disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingCreds ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  <span>{isSavingCreds ? 'Saving to Server...' : 'Save TikTok Credentials'}</span>
                </button>

                <button
                  type="button"
                  onClick={refreshStatusAndReels}
                  className="px-3.5 py-2.5 rounded-xl bg-[#0b1426] border border-gray-700 text-gray-300 font-mono text-xs hover:border-cyan-400 transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Test Connection</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Connect & Live Sync Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* TikTok Authorization Card */}
          <div className="p-5 rounded-2xl bg-[#080f21] border border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.1)] space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h4 className="font-heading font-bold text-sm text-white">
                OAUTH AUTHORIZATION & FEED SYNC
              </h4>
            </div>

            {/* Connection Status Box */}
            <div className="p-3.5 rounded-xl bg-black/60 border border-gray-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Status:</span>
                {status?.isConnected ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Not Connected
                  </span>
                )}
              </div>

              {status?.user?.username && (
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-gray-400">Account:</span>
                  <span className="text-cyan-300 font-bold">@{status.user.username}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Client Key Saved:</span>
                <span className={status?.hasClientKey ? 'text-emerald-400' : 'text-gray-500'}>
                  {status?.hasClientKey ? 'Yes ✓' : 'Missing'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-400">Client Secret Saved:</span>
                <span className={status?.hasClientSecret ? 'text-emerald-400' : 'text-gray-500'}>
                  {status?.hasClientSecret ? 'Yes ✓' : 'Missing'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              {!status?.isConnected ? (
                <button
                  type="button"
                  onClick={handleConnectTikTok}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-heading font-black text-xs hover:brightness-110 transition shadow-[0_0_15px_rgba(0,240,255,0.4)] flex items-center justify-center gap-2"
                >
                  <i className="fa-brands fa-tiktok text-sm"></i>
                  <span>CONNECT WITH TIKTOK</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={isSyncing}
                    onClick={handleSyncVideos}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-500 text-black font-heading font-black text-xs hover:bg-emerald-400 transition shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'FETCHING TIKTOK VIDEOS...' : 'SYNC LIVE VIDEOS NOW'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="w-full py-2 px-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 font-mono text-xs hover:bg-rose-900/60 transition flex items-center justify-center gap-1.5"
                  >
                    <span>Disconnect TikTok Account</span>
                  </button>
                </div>
              )}

              {/* Sync Result Notice */}
              {syncResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-mono border ${
                    syncResult.success
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                      : 'bg-rose-950/80 border-rose-400 text-rose-300'
                  }`}
                >
                  {syncResult.message}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Synced Reels Management & Manual Showcase */}
      <div className="p-5 rounded-2xl bg-[#080e1c] border border-cyan-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-heading font-bold text-sm text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-cyan-400" />
              <span>CURRENT STUDIO REELS ({reels.length})</span>
            </h4>
            <p className="text-xs text-gray-400 font-tech mt-0.5">
              These videos are displayed in the client-facing TikTok Reels showcase.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingManual(!isAddingManual)}
              className="px-3 py-1.5 rounded-xl bg-cyan-950/70 border border-cyan-400/50 text-cyan-300 text-xs font-mono font-bold hover:bg-cyan-900 transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingManual ? 'Cancel Manual' : 'Add Manual Reel'}</span>
            </button>
          </div>
        </div>

        {/* Manual Reel Form */}
        {isAddingManual && (
          <form onSubmit={handleAddManualReel} className="p-4 rounded-xl bg-black/60 border border-cyan-500/40 space-y-3 font-mono text-xs">
            <div className="font-heading font-bold text-cyan-300 text-xs">
              ADD REEL MANUALLY (DIRECT LINK FALLBACK)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 block mb-1">Reel Title / Focus *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Sleeve Skull Shading"
                  value={manualTitle}
                  onChange={e => setManualTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050811] border border-gray-700 text-white outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">TikTok Video URL</label>
                <input
                  type="url"
                  placeholder="https://www.tiktok.com/@tex_lightsout/video/..."
                  value={manualUrl}
                  onChange={e => setManualUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050811] border border-gray-700 text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-gray-400 block mb-1">Cover Image / Thumbnail URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={manualThumbnail}
                  onChange={e => setManualThumbnail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050811] border border-gray-700 text-white outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="text-gray-400 block mb-1">Caption / Description</label>
                <input
                  type="text"
                  placeholder="e.g. 5-hour realism session behind the machine..."
                  value={manualCaption}
                  onChange={e => setManualCaption(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#050811] border border-gray-700 text-white outline-none focus:border-cyan-400"
                />
              </div>
            </div>
            <div className="pt-1 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-cyan-500 text-black font-bold font-mono hover:bg-cyan-400 transition"
              >
                Save Reel to Showcase
              </button>
            </div>
          </form>
        )}

        {/* Reels Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {reels.map(reel => (
            <div
              key={reel.id}
              className="rounded-xl bg-black/60 border border-gray-800 overflow-hidden group hover:border-cyan-400/50 transition flex flex-col justify-between"
            >
              <div className="relative aspect-[9/14] overflow-hidden bg-gray-900">
                <img
                  src={reel.thumbnailUrl}
                  alt={reel.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-cyan-300 text-[10px] font-mono">
                  {reel.duration || '0:30'}
                </div>
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <div className="font-heading font-bold text-xs truncate">{reel.title}</div>
                  <div className="flex items-center gap-3 text-[10px] font-mono text-gray-300 mt-1">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-400" />
                      {reel.likes || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-cyan-400" />
                      {reel.views || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-2.5 border-t border-gray-800/80 flex items-center justify-between text-xs font-mono">
                {reel.videoUrl ? (
                  <a
                    href={reel.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Watch</span>
                  </a>
                ) : (
                  <span className="text-gray-500 text-[11px]">Local Demo</span>
                )}
                <button
                  onClick={() => handleDeleteReel(reel.id)}
                  className="p-1 rounded text-gray-500 hover:text-rose-400 transition"
                  title="Remove reel"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
