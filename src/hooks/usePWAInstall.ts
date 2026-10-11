import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isStandalone: boolean;
  canPromptDirectly: boolean;
  installApp: () => Promise<boolean>;
}

// Global deferred prompt holder so event isn't missed even if hook mounts later
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((l) => l());
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    listeners.forEach((l) => l());
  });

  // Register service worker unconditionally for PWA installability & offline caching
  if ('serviceWorker' in navigator) {
    const register = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .then((reg) => {
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        })
        .catch((err) => {
          console.warn('Service worker registration:', err);
        });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register);
    }
  }
}

export function usePWAInstall(): PWAInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(globalDeferredPrompt);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkState = () => {
      setDeferredPrompt(globalDeferredPrompt);

      const isStand = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');

      setIsStandalone(isStand);
      setIsInstalled(isStand);

      const ua = window.navigator.userAgent.toLowerCase();
      const ios = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const android = /android/.test(ua);
      const mobile = ios || android || /mobile|tablet/.test(ua);

      setIsIOS(ios);
      setIsAndroid(android);
      setIsMobile(mobile);
    };

    checkState();

    const handleChange = () => {
      checkState();
    };

    listeners.add(handleChange);

    const mql = window.matchMedia('(display-mode: standalone)');
    const mqlListener = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
      setIsInstalled(e.matches);
    };
    mql.addEventListener('change', mqlListener);

    return () => {
      listeners.delete(handleChange);
      mql.removeEventListener('change', mqlListener);
    };
  }, []);

  const installApp = useCallback(async (): Promise<boolean> => {
    if (globalDeferredPrompt) {
      try {
        await globalDeferredPrompt.prompt();
        const choice = await globalDeferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          globalDeferredPrompt = null;
          setDeferredPrompt(null);
          setIsInstalled(true);
          return true;
        }
        return false;
      } catch (err) {
        console.warn('Install prompt error:', err);
        return false;
      }
    }
    return false;
  }, []);

  return {
    isInstallable: !isInstalled,
    isInstalled,
    isIOS,
    isAndroid,
    isMobile,
    isStandalone,
    canPromptDirectly: !!deferredPrompt,
    installApp,
  };
}
