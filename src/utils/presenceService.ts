import { CommitteeMember } from '../types';

export interface OnlinePresenceUser {
  sessionId: string;
  memberId: string;
  memberName: string;
  role: string;
  avatarColor: string;
  photoUrl?: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  platform?: string;
  lastSeen: number;
}

let heartbeatTimer: any = null;
let currentSessionId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

function detectDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'mobile';
  const ua = navigator.userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

function detectPlatform(): string {
  if (typeof window === 'undefined') return 'Web';
  const isStand = 
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) {
    return isStand ? 'iOS Installed App' : 'iOS Safari';
  }
  if (/Android/.test(ua)) {
    return isStand ? 'Android Installed App' : 'Android Chrome';
  }
  return isStand ? 'Desktop App' : 'Desktop Browser';
}

export async function sendPresenceHeartbeat(member: CommitteeMember): Promise<OnlinePresenceUser[]> {
  if (!member || !member.id) return [];
  try {
    const payload = {
      sessionId: currentSessionId,
      memberId: member.id,
      memberName: member.name,
      role: member.role,
      avatarColor: member.avatarColor || 'bg-amber-600',
      photoUrl: member.photoUrl,
      deviceType: detectDeviceType(),
      platform: detectPlatform(),
    };

    const res = await fetch('/api/presence/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      return data.onlineUsers || [];
    }
  } catch (err) {
    // network retry
  }
  return [];
}

export function startPresenceHeartbeat(
  member: CommitteeMember, 
  onOnlineUpdate?: (users: OnlinePresenceUser[]) => void
) {
  stopPresenceHeartbeat();
  if (!member || !member.id) return;

  // Immediate first heartbeat
  sendPresenceHeartbeat(member).then((users) => {
    if (onOnlineUpdate && users.length > 0) {
      onOnlineUpdate(users);
    }
  });

  // Heartbeat every 10 seconds
  heartbeatTimer = setInterval(() => {
    sendPresenceHeartbeat(member).then((users) => {
      if (onOnlineUpdate && users.length > 0) {
        onOnlineUpdate(users);
      }
    });
  }, 10000);

  // Setup leave handler on unload
  if (typeof window !== 'undefined') {
    const handleLeave = () => {
      const payload = JSON.stringify({ memberId: member.id, sessionId: currentSessionId });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/presence/leave', payload);
      } else {
        fetch('/api/presence/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleLeave);
    window.addEventListener('pagehide', handleLeave);
  }
}

export function stopPresenceHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

export async function fetchOnlineUsers(): Promise<OnlinePresenceUser[]> {
  try {
    const res = await fetch('/api/presence/online');
    if (res.ok) {
      const data = await res.json();
      return data.onlineUsers || [];
    }
  } catch {}
  return [];
}
