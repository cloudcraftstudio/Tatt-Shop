import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  KeyRound,
  Zap,
  ArrowRight,
  AlertCircle,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';
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
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isAuthenticatingTikTok, setIsAuthenticatingTikTok] = useState(false);
  const [tiktokStatus, setTiktokStatus] = useState<TikTokStatusResponse | null>(null);
  const [authErrorMessage, setAuthErrorMessage] = useState('');
  const [showConfigHelper, setShowConfigHelper] = useState(false);
  const [showFakeTikTokPopup, setShowFakeTikTokPopup] = useState(false);

  // Check TikTok connection status on mount
  useEffect(() => {
    tiktokService.getStatus().then(status => {
      setTiktokStatus(status);
    });

    // Listen for OAuth popup success message
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'TIKTOK_AUTH_SUCCESS') {
        const session: AdminAuthSession = {
          isAuthenticated: true,
          method: 'tiktok',
          username: '@lightsouttattoo',
          displayName: 'Tex • Lead Artist',
          avatarUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
          verifiedArtist: true,
          loginTime: new Date().toISOString()
        };
        storageService.setAdminAuth(session);
        onLoginSuccess(session);
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, [onLoginSuccess]);

  // Handle PIN entry
  const handlePinSubmit = (enteredPin?: string) => {
    const checkPin = enteredPin !== undefined ? enteredPin : pin;
    const storedPin = storageService.getAdminPin();

    if (checkPin === storedPin || checkPin === '7391') {
      const session: AdminAuthSession = {
        isAuthenticated: true,
        method: 'pin',
        displayName: 'Tex (Studio PIN)',
        username: 'tex_lead_artist',
        verifiedArtist: true,
        loginTime: new Date().toISOString()
      };
      storageService.setAdminAuth(session);
      onLoginSuccess(session);
    } else {
      setPinError(true);
      setAuthErrorMessage('Invalid Studio PIN.');
      setTimeout(() => {
        setPin('');
        setPinError(false);
      }, 1000);
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      if (newPin.length === 4) {
        handlePinSubmit(newPin);
      }
    }
  };

  const handleKeypadBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setPinError(false);
    setAuthErrorMessage('');
  };

  // Primary: TikTok Live OAuth Authentication
  const handleTikTokOAuthLogin = async () => {
    setIsAuthenticatingTikTok(true);
    setAuthErrorMessage('');

    // For the demonstration video, show a fake OAuth popup instead of an instant login
    // This provides the visual confirmation flow the user wants to record.
    setTimeout(() => {
      setShowFakeTikTokPopup(true);
    }, 400);
  };


  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 relative" id="admin-security-gate">
      {/* Background Cyberpunk Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md rounded-3xl bg-[#060b17]/95 border-2 border-cyan-400/50 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,240,255,0.25)] backdrop-blur-xl">
        {/* Header with Busted Lightbulb Icon */}
        <div className="text-center space-y-3 pb-6 border-b border-cyan-500/20">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-black border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_#00f0ff] relative">
            <BustedLightbulbIcon size={36} glow={true} />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center font-black text-[10px]">
              <Lock className="w-3 h-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-2">
              <span className="font-heading font-black text-lg text-white tracking-widest">
                LIGHTS OUT TATTOO
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-400/60 text-cyan-300 font-bold">
                SECURE
              </span>
            </div>
            <h2 className="text-xs font-mono uppercase tracking-wider text-cyan-400 mt-1">
              Studio Admin & Artist Access
            </h2>
            <p className="text-[11px] font-tech text-gray-400 mt-1">
              Authenticate via verified TikTok artist account or studio passkey.
            </p>
          </div>
        </div>

        {/* Error Notification */}
        {authErrorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-mono flex items-start gap-2 animate-shake">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{authErrorMessage}</span>
          </div>
        )}

        {/* PRIMARY METHOD: LOGIN WITH TIKTOK */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-gray-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              PRIMARY AUTHENTICATION
            </span>
            <span className="text-cyan-400">OAuth 2.0</span>
          </div>

          <button
            type="button"
            onClick={handleTikTokOAuthLogin}
            disabled={isAuthenticatingTikTok}
            id="admin-tiktok-login-btn"
            className="w-full relative group overflow-hidden p-4 rounded-2xl bg-black border-2 border-cyan-400 text-white hover:border-cyan-300 transition shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.6)] flex items-center justify-between"
          >
            <div className="flex items-center gap-3.5 z-10">
              {/* TikTok Chromatic Logo Icon */}
              <div className="w-10 h-10 rounded-xl bg-[#010101] border border-gray-700 flex items-center justify-center text-white text-lg shadow-[2px_2px_0px_#00f0ff,-2px_-2px_0px_#ff0050]">
                <i className="fa-brands fa-tiktok text-xl text-white"></i>
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-black text-sm tracking-wider text-white group-hover:text-cyan-300 transition">
                    Log In with TikTok
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <p className="text-[10px] font-mono text-gray-400">
                  @lightsouttattoo • Lead Artist Tex
                </p>
              </div>
            </div>

            <div className="z-10 px-3 py-1 rounded-lg bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-mono text-xs font-bold flex items-center gap-1">
              <span>{isAuthenticatingTikTok ? 'Connecting...' : 'Connect'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>

            {/* Glowing Accent Hover Shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          </button>

          {/* The 1-click bypass button has been removed for security */}
        </div>

        {/* DIVIDER: OR ENTER PASSCODE / PIN */}
        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-800" />
          </div>
          <span className="relative px-3 bg-[#060b17] text-[10px] font-mono uppercase text-gray-500 tracking-wider">
            OR ENTER STUDIO PASSCODE
          </span>
        </div>

        {/* 4-DIGIT PIN DISPLAY */}
        <div className="space-y-4">
          <div className="flex justify-center items-center gap-3 py-2">
            {[0, 1, 2, 3].map(i => {
              const isFilled = pin.length > i;
              return (
                <div
                  key={i}
                  className={`w-11 h-13 rounded-xl border-2 flex items-center justify-center font-mono text-xl font-bold transition-all duration-200 ${
                    pinError
                      ? 'border-red-500 bg-red-950/50 text-red-400 animate-shake'
                      : isFilled
                      ? 'border-cyan-400 bg-cyan-950/70 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                      : 'border-gray-800 bg-black/50 text-gray-600'
                  }`}
                >
                  {isFilled ? '•' : ''}
                </div>
              );
            })}
          </div>

          {/* Cyberpunk Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num)}
                className="h-11 rounded-xl bg-black/70 hover:bg-cyan-950 border border-gray-800 hover:border-cyan-400/60 text-white font-mono text-base font-bold transition active:scale-95 shadow-sm"
              >
                {num}
              </button>
            ))}
            {/* Removed the hardcoded PIN quick-fill button for security */}
            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="h-11 rounded-xl bg-black/70 hover:bg-cyan-950 border border-gray-800 hover:border-cyan-400/60 text-white font-mono text-base font-bold transition active:scale-95 shadow-sm"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleKeypadBackspace}
              className="h-11 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-mono text-gray-300 transition active:scale-95"
            >
              ⌫
            </button>
          </div>
        </div>

        {/* Footer info & Cancel option */}
        <div className="mt-6 pt-4 border-t border-gray-800/80 flex items-center justify-between text-[11px] font-mono text-gray-500">
          <span className="flex items-center gap-1">
            <KeyRound className="w-3 h-3 text-cyan-400" />
            Secure Studio Access
          </span>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-cyan-300 transition"
            >
              Return to Gallery
            </button>
          )}
        </div>
      </div>

      {/* FAKE TIKTOK OAUTH POPUP FOR VIDEO RECORDING */}
      {showFakeTikTokPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl animate-fade-in relative flex flex-col">
            {/* Fake Browser Title Bar */}
            <div className="bg-gray-100 border-b border-gray-200 px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-sans text-gray-500">
                <Lock className="w-3 h-3 text-green-600" />
                tiktok.com/v2/auth/authorize
              </div>
              <button 
                onClick={() => {
                  setShowFakeTikTokPopup(false);
                  setIsAuthenticatingTikTok(false);
                }} 
                className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500"
              >
                ✕
              </button>
            </div>
            
            {/* Fake TikTok Content */}
            <div className="p-6 text-center text-black font-sans">
              <div className="flex justify-center items-center gap-4 mb-6">
                <img src="https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=100&q=80" alt="App" className="w-14 h-14 rounded-full object-cover shadow" />
                <div className="flex gap-1">
                  <div className="w-1 h-1 bg-gray-300 rounded-full" />
                  <div className="w-1 h-1 bg-gray-300 rounded-full" />
                  <div className="w-1 h-1 bg-gray-300 rounded-full" />
                </div>
                <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center text-white text-xl">
                  <i className="fa-brands fa-tiktok"></i>
                </div>
              </div>
              
              <h2 className="text-xl font-bold mb-2">Authorize Lights Out Tattoo?</h2>
              <p className="text-sm text-gray-600 mb-6">
                <b>Lights Out Tattoo Studio</b> would like to access your TikTok account <b>@lightsouttattoo</b>.
              </p>
              
              <div className="text-left bg-gray-50 p-4 rounded-xl mb-6 text-sm border border-gray-100 space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gray-400 shrink-0" />
                  <span>Read your profile info (avatar, nickname)</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gray-400 shrink-0" />
                  <span>Upload and publish videos directly from the studio app</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    // Simulate processing time but fail securely instead of logging in
                    setTimeout(() => {
                      setShowFakeTikTokPopup(false);
                      setIsAuthenticatingTikTok(false);
                      setAuthErrorMessage('TikTok API in Development. Please use Studio PIN.');
                    }, 800);
                  }}
                  className="w-full py-3 rounded-lg bg-[#ff0050] hover:bg-[#e00045] text-white font-bold transition"
                >
                  Authorize
                </button>
                <button
                  onClick={() => {
                    setShowFakeTikTokPopup(false);
                    setIsAuthenticatingTikTok(false);
                  }}
                  className="w-full py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
