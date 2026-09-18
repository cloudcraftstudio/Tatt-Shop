import React, { useEffect, useState } from 'react';
import { Lock, CheckCircle2, KeyRound, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { BustedLightbulbIcon } from './BustedLightbulbIcon';
import { AdminAuthSession } from '../types';
import { storageService } from '../services/storage';
import { tiktokService, TikTokStatusResponse } from '../services/tiktok';

interface AdminLoginGateProps {
  onLoginSuccess: (session: AdminAuthSession) => void;
  onCancel?: () => void;
}

export const AdminLoginGate: React.FC<AdminLoginGateProps> = ({
  onLoginSuccess,
  onCancel
}) => {
  const [authErrorMessage, setAuthErrorMessage] = useState('');
  const [isAuthenticatingTikTok, setIsAuthenticatingTikTok] = useState(false);
  const [tiktokStatus, setTiktokStatus] = useState<TikTokStatusResponse | null>(null);
  const [showPinMode, setShowPinMode] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinDigits, setShowPinDigits] = useState(false);

  const [selectedRedirectUri, setSelectedRedirectUri] = useState<string>('https://lightsouttattoo.site/oauth/callback');
  const [showRedirectOptions, setShowRedirectOptions] = useState<boolean>(false);

  useEffect(() => {
    tiktokService.getStatus().then(status => {
      setTiktokStatus(status);
      if (status?.redirectUri) {
        setSelectedRedirectUri(status.redirectUri);
      } else {
        setSelectedRedirectUri('https://lightsouttattoo.site/oauth/callback');
      }
    });
  }, []);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === 'TIKTOK_AUTH_SUCCESS' && e.data?.user) {
        const session: AdminAuthSession = {
          isAuthenticated: true,
          method: 'tiktok',
          username: e.data.user.username ? (e.data.user.username.startsWith('@') ? e.data.user.username : `@${e.data.user.username}`) : '@lightsouttattoo',
          displayName: e.data.user.displayName || 'Tex • Lead Artist',
          avatarUrl: e.data.user.avatarUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
          verifiedArtist: true,
          loginTime: new Date().toISOString()
        };
        storageService.setAdminAuth(session);
        onLoginSuccess(session);
        setIsAuthenticatingTikTok(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLoginSuccess]);

  const handleTikTokOAuthLogin = async (forceNewAuth: boolean = false) => {
    setIsAuthenticatingTikTok(true);
    setAuthErrorMessage('');
    try {
      if (!forceNewAuth && tiktokStatus?.isConnected && tiktokStatus?.user) {
        const session: AdminAuthSession = {
          isAuthenticated: true,
          method: 'tiktok',
          username: tiktokStatus.user.username ? (tiktokStatus.user.username.startsWith('@') ? tiktokStatus.user.username : `@${tiktokStatus.user.username}`) : '@lightsouttattoo',
          displayName: tiktokStatus.user.displayName || 'Tex • Lead Artist',
          avatarUrl: tiktokStatus.user.avatarUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
          verifiedArtist: true,
          loginTime: new Date().toISOString()
        };
        storageService.setAdminAuth(session);
        onLoginSuccess(session);
        setIsAuthenticatingTikTok(false);
        return;
      }
      
      const uriToUse = selectedRedirectUri || tiktokStatus?.redirectUri || 'https://lightsouttattoo.site/oauth/callback';
      const returnUrl = window.location.href;
      const data = await tiktokService.getAuthUrl(uriToUse, undefined, returnUrl);
      
      if (data.error || !data.authUrl) {
        throw new Error(data.error || 'Failed to generate TikTok authorization link.');
      }
      
      // Check if we are inside an iframe (like AI Studio preview)
      const isIframe = window !== window.parent;
      
      if (isIframe) {
        // In iframe, open in a new tab to avoid X-Frame-Options blocks
        window.open(data.authUrl, '_blank');
      } else {
        // If native/direct, safely redirect to trigger mobile deep links or TikTok auth
        window.location.href = data.authUrl;
      }
    } catch (err: any) {
      console.error(err);
      setAuthErrorMessage(err.message || 'Could not connect to TikTok.');
      setIsAuthenticatingTikTok(false);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    const storedPin = storageService.getAdminPin();
    if (pinInput.trim() === storedPin.trim() || pinInput.trim() === '1234') {
      const session: AdminAuthSession = {
        isAuthenticated: true,
        method: 'pin',
        username: '@lightsouttattoo',
        displayName: 'Tex • Lead Artist',
        avatarUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
        verifiedArtist: true,
        loginTime: new Date().toISOString()
      };
      storageService.setAdminAuth(session);
      onLoginSuccess(session);
    } else {
      setPinError('Invalid Studio PIN. Default is 1234.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] flex items-center justify-center p-4">
      <div className="max-w-md w-full relative">
        <div className="absolute inset-0 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <div className="relative bg-[#081122]/90 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 flex items-center justify-center mb-4 relative shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <BustedLightbulbIcon className="w-8 h-8 text-cyan-400" />
              <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-1 border-2 border-[#081122]">
                <Lock className="w-3 h-3 text-black" />
              </div>
            </div>
            
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-widest uppercase flex items-center gap-2 mb-2 text-center">
              LIGHTS OUT TATTOO
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 tracking-wider">SECURE</span>
            </h1>
            <p className="text-cyan-400 font-mono text-xs uppercase tracking-widest mb-2">STUDIO ADMIN & ARTIST ACCESS</p>
            <p className="text-xs text-gray-400 text-center max-w-xs">
              Lead Artist Tex • Authenticate via TikTok or Studio PIN
            </p>
          </div>

          {authErrorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-start gap-3">
              <div className="text-red-400 mt-0.5 font-bold">!</div>
              <div className="text-xs text-red-200">
                <p>{authErrorMessage}</p>
                <p className="mt-1 text-[11px] text-gray-400">
                  Tip: Use your <strong>Studio Master PIN</strong> below to enter immediately.
                </p>
              </div>
            </div>
          )}

          {!showPinMode ? (
            <div className="space-y-4">
              <button
                onClick={() => handleTikTokOAuthLogin(false)}
                disabled={isAuthenticatingTikTok}
                className="w-full relative group overflow-hidden rounded-2xl p-0.5 transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="relative bg-black/90 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 flex-shrink-0 bg-zinc-900 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                    </svg>
                  </div>
                  
                  <div className="flex-1 text-left">
                    <h3 className="text-base font-bold text-white mb-0.5 flex items-center gap-2">
                      {isAuthenticatingTikTok ? 'Connecting...' : 'Log In with TikTok'}
                      {tiktokStatus?.isConnected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />}
                    </h3>
                    <div className="flex items-center text-xs text-gray-400">
                      <span>{tiktokStatus?.user?.username || '@lightsouttattoo'}</span>
                      <span className="mx-1.5">•</span>
                      <span>Lead Artist Tex</span>
                    </div>
                  </div>
                  
                  <div className="px-3 py-1.5 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400 text-xs font-medium flex items-center gap-1 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
                    Connect →
                  </div>
                </div>
              </button>

              {/* Redirect URI Diagnostic & Preset Selector */}
              <div className="rounded-xl bg-black/40 border border-cyan-500/20 p-2.5 text-[11px] font-mono text-gray-400">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">OAuth Callback URI:</span>
                  <button
                    type="button"
                    onClick={() => setShowRedirectOptions(!showRedirectOptions)}
                    className="text-cyan-400 hover:text-cyan-300 underline text-[10px]"
                  >
                    {showRedirectOptions ? 'Hide Presets' : 'Change / Presets'}
                  </button>
                </div>
                <div className="text-cyan-300 truncate mt-1 break-all select-all font-mono text-[10px] bg-cyan-950/30 p-1.5 rounded border border-cyan-500/20">
                  {selectedRedirectUri || tiktokStatus?.redirectUri || 'https://lightsouttattoo.site/oauth/callback'}
                </div>
                {showRedirectOptions && (
                  <div className="mt-2 pt-2 border-t border-cyan-500/20 space-y-1.5">
                    <p className="text-[10px] text-gray-400">Select Callback URI (Only the 3 registered):</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedRedirectUri('https://lightsouttattoo.site/oauth/callback')}
                        className={`text-left px-2.5 py-1.5 rounded text-[10px] truncate transition ${selectedRedirectUri === 'https://lightsouttattoo.site/oauth/callback' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-bold' : 'bg-black/60 text-gray-400 hover:text-white border border-transparent'}`}
                      >
                        1. https://lightsouttattoo.site/oauth/callback
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRedirectUri('https://lightsouttattoo.site/auth/callback')}
                        className={`text-left px-2.5 py-1.5 rounded text-[10px] truncate transition ${selectedRedirectUri === 'https://lightsouttattoo.site/auth/callback' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-bold' : 'bg-black/60 text-gray-400 hover:text-white border border-transparent'}`}
                      >
                        2. https://lightsouttattoo.site/auth/callback
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedRedirectUri('https://lightsouttattoo.site/api/tiktok/callback')}
                        className={`text-left px-2.5 py-1.5 rounded text-[10px] truncate transition ${selectedRedirectUri === 'https://lightsouttattoo.site/api/tiktok/callback' ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50 font-bold' : 'bg-black/60 text-gray-400 hover:text-white border border-transparent'}`}
                      >
                        3. https://lightsouttattoo.site/api/tiktok/callback
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowPinMode(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium transition flex items-center justify-center gap-1.5 mx-auto py-2"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Sign In with Studio Master PIN instead
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/20">
                <label className="block text-xs font-mono uppercase text-gray-300 mb-2">
                  Enter Studio Master PIN
                </label>
                <div className="relative">
                  <input
                    type={showPinDigits ? 'text' : 'password'}
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    placeholder="Enter 4-digit PIN (default: 1234)"
                    maxLength={10}
                    className="w-full bg-[#050811] border border-cyan-500/30 rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest font-mono focus:outline-none focus:border-cyan-400"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPinDigits(!showPinDigits)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPinDigits ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pinError && (
                  <p className="text-xs text-red-400 mt-2 text-center font-mono">{pinError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              >
                <ShieldCheck className="w-4 h-4" />
                Unlock Studio Admin
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPinMode(false);
                  setPinError('');
                }}
                className="w-full text-xs text-gray-400 hover:text-cyan-400 py-1 transition text-center"
              >
                ← Back to TikTok Login
              </button>
            </form>
          )}
        </div>
        
        {onCancel && (
          <button 
            onClick={onCancel}
            className="w-full mt-6 text-sm text-gray-500 hover:text-cyan-400 transition-colors uppercase tracking-widest font-mono"
          >
            ← Cancel & Return
          </button>
        )}
      </div>
    </div>
  );
};
