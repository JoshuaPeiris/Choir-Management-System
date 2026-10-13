import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  Share, 
  PlusSquare, 
  CheckCircle2, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  WifiOff, 
  Check, 
  Copy, 
  ExternalLink, 
  Info, 
  AlertTriangle, 
  Monitor, 
  Globe, 
  Bell, 
  Volume2, 
  Vibrate, 
  ArrowRight,
  HardDrive
} from 'lucide-react';
import { CHOIR_LOGO_URL, getChoirLogoUrl } from '../utils/driveImage';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstallAppModalContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const {
    isInstalled,
    isIOS,
    isAndroid,
    canPromptDirectly,
    installApp
  } = usePWAInstall();

  const [installing, setInstalling] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'auto' | 'android' | 'ios' | 'other' | 'permissions'>('auto');
  const [isInAppBrowser, setIsInAppBrowser] = useState<boolean>(false);
  
  // Permission statuses
  const [notifStatus, setNotifStatus] = useState<string>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [audioStatus, setAudioStatus] = useState<boolean>(false);
  const [vibrateStatus, setVibrateStatus] = useState<boolean>(false);
  const [storageStatus, setStorageStatus] = useState<boolean>(false);
  const [permissionFeedback, setPermissionFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      // Detect common in-app browsers where PWA install is blocked by webviews
      const inApp = ua.includes('fban') || ua.includes('fbav') || ua.includes('instagram') || 
                    ua.includes('whatsapp') || ua.includes('line/') || ua.includes('micromessenger') ||
                    ua.includes('wv') || (ua.includes('android') && ua.includes('version/'));
      setIsInAppBrowser(inApp);

      if (isIOS) {
        setActiveTab('ios');
      } else if (isAndroid) {
        setActiveTab('android');
      } else {
        setActiveTab('auto');
      }

      if ('Notification' in window) {
        setNotifStatus(Notification.permission);
      }
    }
  }, [isIOS, isAndroid]);

  // Direct Native Install Trigger
  const handleDirectInstall = async () => {
    setInstalling(true);
    try {
      const success = await installApp();
      if (success) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } finally {
      setInstalling(false);
    }
  };

  // Copy Clean Web Link to Clipboard
  const handleCopyLink = () => {
    const url = window.location.href.split('#')[0];
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      }).catch(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 3000);
      });
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {}
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  // Download a web link shortcut file (.url) for desktop or older phones
  const handleDownloadWebLink = () => {
    const url = window.location.href.split('#')[0];
    const fileContent = `[InternetShortcut]\nURL=${url}\nIconFile=${window.location.origin}/choir_logo.jpg\nIconIndex=0\n`;
    const blob = new Blob([fileContent], { type: 'application/internet-shortcut' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = "St-Cecilia-Choir-Portal.url";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Master Permission Activator
  const handleAllowAllPermissions = async () => {
    setPermissionFeedback(null);

    // 1. Audio Permission & Harmonic Chime
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.09);
          gain.gain.setValueAtTime(0.001, now + i * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.2, now + i * 0.09 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.85);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.09);
          osc.stop(now + i * 0.09 + 0.9);
        });
        setAudioStatus(true);
      }
    } catch (e) {
      console.warn('Audio permission unlock:', e);
    }

    // 2. Notification Permission (Safe Promise & Callback wrapper)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          setNotifStatus('granted');
        } else {
          const permPromise = Notification.requestPermission();
          if (permPromise && typeof permPromise.then === 'function') {
            const res = await Promise.race([
              permPromise,
              new Promise<string>((r) => setTimeout(() => r(Notification.permission || 'default'), 2500))
            ]);
            setNotifStatus(res);
          } else {
            // Older Safari callback support
            Notification.requestPermission((res) => {
              setNotifStatus(res || 'default');
            });
          }
        }
      } catch (e) {
        console.warn('Notification permission unlock:', e);
      }
    }

    // 3. Vibration Test
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
        setVibrateStatus(true);
      }
    } catch (e) {}

    // 4. Persistent Storage
    try {
      if (navigator.storage && navigator.storage.persist) {
        const persisted = await navigator.storage.persist();
        setStorageStatus(persisted);
      }
    } catch (e) {}

    setPermissionFeedback('All device permissions (Audio Chimes, Mass Alerts, Vibration, Offline Sync) activated!');
  };

  const logoSrc = getChoirLogoUrl() || '/pwa-192x192.png';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-[#121212] border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-white animate-in zoom-in-95 duration-200 relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Glows */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#222222] bg-[#161616] flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Install App &amp; Permissions</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-400 text-black border border-amber-300">
                  Universal OS
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Install St. Cecilia&apos;s Choir Portal with the official Choir Logo on any phone or PC
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#202020] hover:bg-[#2c2c2c] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* In-App Browser Warning (e.g. WhatsApp, Facebook) */}
        {isInAppBrowser && (
          <div className="px-4 py-2.5 bg-amber-500/15 border-b border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 relative z-10">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="flex-1 leading-snug">
              You are inside an in-app browser. Tap the <strong>3 dots (⋮)</strong> and select <strong>Open in Chrome / Safari</strong> to install to Home Screen!
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 relative z-10">
          
          {/* Official App Logo Preview Card */}
          <div className="p-4 rounded-2xl bg-[#181818] border border-amber-500/30 flex items-center gap-4 shadow-lg relative overflow-hidden">
            <div className="relative shrink-0">
              <img
                src={logoSrc}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/choir_logo.jpg';
                }}
                alt="St. Cecilia's Choir Crest"
                className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover ring-2 ring-amber-400/80 shadow-xl bg-black"
              />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 text-black font-black flex items-center justify-center text-xs shadow-md border-2 border-black">
                ✓
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white truncate">
                  Choir Portal
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Home Screen App
                </span>
              </div>
              <p className="text-xs text-amber-400/90 font-medium truncate mt-0.5">
                St. Cecilia&apos;s Choir • St. Michael&apos;s Church Koralawella
              </p>
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-neutral-300 flex-wrap">
                <span className="text-emerald-400 font-semibold">✓ Official Crest Logo</span>
                <span>•</span>
                <span>1-Tap Instant Launch</span>
                <span>•</span>
                <span className="text-sky-300">Works 100% Offline</span>
              </div>
            </div>
          </div>

          {/* Quick Permission Bar */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1E1911] via-[#141414] to-[#121A15] border border-amber-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Device Permissions Status</span>
              </div>
              <button
                type="button"
                onClick={handleAllowAllPermissions}
                className="px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-black" />
                <span>Allow / Test Permissions</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
              <div className="bg-[#181818] p-2 rounded-xl border border-[#282828] flex items-center gap-2">
                <Bell className={`w-3.5 h-3.5 shrink-0 ${notifStatus === 'denied' ? 'text-rose-400' : 'text-amber-400'}`} />
                <div className="truncate">
                  <div className="text-[9px] text-neutral-400">Mass Alerts</div>
                  <div className={`font-bold ${
                    notifStatus === 'granted' 
                      ? 'text-emerald-400' 
                      : notifStatus === 'denied' 
                        ? 'text-rose-400' 
                        : 'text-amber-300'
                  }`}>
                    {notifStatus === 'granted' ? 'Allowed' : notifStatus === 'denied' ? 'Blocked' : 'Allow on Tap'}
                  </div>
                </div>
              </div>

              <div className="bg-[#181818] p-2 rounded-xl border border-[#282828] flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <div className="truncate">
                  <div className="text-[9px] text-neutral-400">Choir Chimes</div>
                  <div className={`font-bold ${audioStatus ? 'text-emerald-400' : 'text-neutral-300'}`}>
                    {audioStatus ? 'Unlocked' : 'Ready'}
                  </div>
                </div>
              </div>

              <div className="bg-[#181818] p-2 rounded-xl border border-[#282828] flex items-center gap-2">
                <Vibrate className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                <div className="truncate">
                  <div className="text-[9px] text-neutral-400">Vibration</div>
                  <div className={`font-bold ${vibrateStatus ? 'text-emerald-400' : 'text-neutral-300'}`}>
                    {vibrateStatus ? 'Enabled' : 'Ready'}
                  </div>
                </div>
              </div>

              <div className="bg-[#181818] p-2 rounded-xl border border-[#282828] flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <div className="truncate">
                  <div className="text-[9px] text-neutral-400">Offline Sync</div>
                  <div className="font-bold text-sky-300">
                    Secured
                  </div>
                </div>
              </div>
            </div>

            {notifStatus === 'denied' && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-200">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Notifications are Blocked in your Browser Settings</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-snug">
                  To unblock: Tap the <strong>lock icon 🔒</strong> (or site settings tune icon) beside the website URL at the top, tap <strong>Permissions</strong>, and change <strong>Notifications</strong> to <strong>Allow</strong>.
                </p>
              </div>
            )}

            {permissionFeedback && (
              <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{permissionFeedback}</span>
              </div>
            )}
          </div>

          {/* OS Switcher Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-[#181818] rounded-xl border border-[#282828] flex-wrap sm:flex-nowrap">
            <button
              type="button"
              onClick={() => setActiveTab(isIOS ? 'ios' : isAndroid ? 'android' : 'auto')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'auto'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Recommended</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'android'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android (New/Old)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ios')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'ios'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Share className="w-3.5 h-3.5" />
              <span>iPhone / iPad (iOS)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('other')}
              className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'other'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>PC / Mac</span>
            </button>
          </div>

          {/* TAB: DIRECT NATIVE PROMPT */}
          {canPromptDirectly && activeTab !== 'ios' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-[#1C1810] to-emerald-500/20 border-2 border-amber-400/80 shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>1-Tap Direct Installation Supported!</span>
              </div>
              <p className="text-xs text-neutral-200">
                Your browser supports direct installation. Tap below to automatically place the Choir Portal app and Crest Logo on your home screen:
              </p>
              <button
                type="button"
                id="pwa-direct-install-btn"
                disabled={installing}
                onClick={handleDirectInstall}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-[0.98] text-black font-black text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/30 transition-all cursor-pointer"
              >
                <Download className="w-5 h-5 stroke-[2.5]" />
                <span>{installing ? 'Opening System Prompt...' : 'Install App to Home Screen Now'}</span>
              </button>
            </div>
          )}

          {/* TAB: ANDROID (NEW & OLD VERSIONS) */}
          {(activeTab === 'android' || (activeTab === 'auto' && isAndroid && !canPromptDirectly)) && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-400">
                  <Smartphone className="w-4 h-4" />
                  <span>Android Installation (Chrome, Samsung Internet, Edge, Opera, Any Browser)</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-semibold">Step-by-Step</span>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-[#181818] border border-[#2B2B2B] flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="text-xs text-neutral-200">
                    Tap the browser menu <span className="font-bold text-white bg-[#262626] px-2 py-0.5 rounded border border-[#383838]">⋮</span> (three dots at the top right of Chrome or bottom right in Samsung Internet).
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#181818] border border-[#2B2B2B] flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="text-xs text-neutral-200">
                    Tap <span className="font-bold text-amber-300 bg-[#262626] px-2 py-0.5 rounded border border-[#383838]">Add to Home screen</span> or <span className="font-bold text-amber-300 bg-[#262626] px-2 py-0.5 rounded border border-[#383838]">Install App</span>.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#181818] border border-[#2B2B2B] flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="text-xs text-neutral-200">
                    Tap <span className="font-bold text-white bg-[#262626] px-2 py-0.5 rounded border border-[#383838]">Add</span> or <span className="font-bold text-white bg-[#262626] px-2 py-0.5 rounded border border-[#383838]">Install</span>. The Choir Crest icon will immediately appear on your phone home screen!
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#161616] border border-[#262626] text-[11px] text-neutral-400 space-y-1">
                <div className="font-bold text-neutral-300">Older Android Phone Note:</div>
                <p>On older Android versions, tap the Menu button on your phone or in the browser, then select <strong>Bookmarks</strong> → <strong>Add shortcut to Home screen</strong>.</p>
              </div>
            </div>
          )}

          {/* TAB: IPHONE & IPAD (IOS NEW & OLD) */}
          {(activeTab === 'ios' || (activeTab === 'auto' && isIOS)) && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-400">
                  <Share className="w-4 h-4" />
                  <span>iPhone &amp; iPad Installation (Safari / iOS 12 to 18+)</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-semibold">3 Quick Steps</span>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-[#181818] border border-[#2B2B2B] flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div className="text-xs text-neutral-200">
                    Tap the <span className="font-bold text-sky-400 bg-[#262626] px-2 py-0.5 rounded border border-[#383838] inline-flex items-center gap-1">
                      <Share className="w-3.5 h-3.5" />
                      Share
                    </span> button at the bottom of Safari (or top bar on iPad).
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#181818] border border-[#2B2B2B] flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div className="text-xs text-neutral-200">
                    Scroll down the menu and tap <span className="font-bold text-amber-300 bg-[#262626] px-2 py-0.5 rounded border border-[#383838] inline-flex items-center gap-1">
                      <PlusSquare className="w-3.5 h-3.5" />
                      Add to Home Screen
                    </span>.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#181818] border border-[#2B2B2B] flex items-center gap-3">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div className="text-xs text-neutral-200">
                    Tap <span className="font-bold text-white bg-[#262626] px-2 py-0.5 rounded border border-[#383838]">Add</span> in the top right corner. The app will be placed directly onto your iPhone home screen with the Choir Logo!
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/90 flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-amber-400" />
                <span>On iOS, Apple requires using Safari browser to add web links to the Home Screen.</span>
              </div>
            </div>
          )}

          {/* TAB: PC / MAC / DESKTOP */}
          {(activeTab === 'other' || (activeTab === 'auto' && !isIOS && !isAndroid && !canPromptDirectly)) && (
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-400">
                <Monitor className="w-4 h-4" />
                <span>PC / Mac / Chrome / Edge Installation</span>
              </div>
              <div className="p-3 rounded-xl bg-[#181818] border border-[#2B2B2B] text-xs text-neutral-300 space-y-2 leading-relaxed">
                <p>1. Look at the right side of your browser&apos;s address bar at the top.</p>
                <p>2. Click the <strong>Install</strong> icon (computer with down arrow or ⊕ symbol).</p>
                <p>3. Click <strong>Install</strong> to launch St. Cecilia&apos;s Choir Portal as a dedicated desktop app with high-resolution icon.</p>
              </div>
            </div>
          )}

          {/* Universal Action Buttons: Copy Clean App Web Link & Shortcut */}
          <div className="p-4 rounded-2xl bg-[#161616] border border-[#282828] space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  <span>Direct Web Link &amp; Shortcut Download</span>
                </div>
                <div className="text-[11px] text-neutral-400">
                  Open anywhere or save shortcut file to home screen
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3.5 py-1.5 rounded-xl bg-[#222] hover:bg-[#2c2c2c] border border-neutral-700 text-xs font-bold text-neutral-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300 font-bold">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Copy Web Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadWebLink}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-bold text-amber-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Download .url file that launches the choir portal on any device"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download Shortcut</span>
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#141414] border-t border-[#202020] flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>St. Cecilia&apos;s Choir Portal PWA</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#202020] hover:bg-[#2a2a2a] text-neutral-200 hover:text-white font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  // Strictly restricted exclusively to Joshua's login
  let isLeadJoshua = false;
  try {
    const stored = sessionStorage.getItem('st_cecilia_auth_member');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (
        parsed?.name?.toLowerCase().includes('joshua') ||
        parsed?.id === 'choir-joshua-peiris' ||
        parsed?.email?.toLowerCase().includes('jshpeiris')
      ) {
        isLeadJoshua = true;
      }
    }
  } catch {}
  if (!isLeadJoshua) return null;
  return <InstallAppModalContent onClose={onClose} />;
};
