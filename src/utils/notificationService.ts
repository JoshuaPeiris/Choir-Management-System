// St. Cecilia's Choir Management Portal - Notification Service
export interface ChoirNotification {
  id: string;
  title: string;
  body: string;
  category: 'weekly-mass' | 'committee' | 'major-events' | 'general';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  sentBy?: string;
  targetMemberId?: string;
  targetMemberName?: string;
  targetMassKey?: string;
  emoji?: string;
}

export interface CommitteePledgedMember {
  memberId: string;
  memberName: string;
  role: string;
  phone?: string;
  photoUrl?: string;
  pledgedPreference?: string;
  confirmed?: boolean;
}

export interface MassAttendancePledge {
  massKey: string;
  massName: string;
  dayTime: string;
  color: string;
  committeeMembers: CommitteePledgedMember[];
}

export const CREATIVE_MASS_REMINDER_TEMPLATES = [
  {
    id: 'promise',
    label: '✨ "Try to Come for the mass that you told ur gonna come"',
    title: '⛪ {massName}',
    text: "Dear {name}, Try to Come for the mass that you told ur gonna come - {massName}!"
  },
  {
    id: 'weekly-mass',
    label: '⛪ "Try attend the mass"',
    title: '⛪ {massName}',
    text: "Dear {name}, Try attend the mass - {massName}! The choir loft is ready."
  },
  {
    id: 'loft-ready',
    label: '🔔 "Church bells are warming up"',
    title: '🔔 {massName}',
    text: "Dear {name}, Church bells are warming up! Try to Come for the mass that you told ur gonna come - {massName}!"
  },
  {
    id: 'committee-honour',
    label: '📋 Committee Attendance Reminder',
    title: '📋 {massName}',
    text: "Dear {name}, friendly reminder as a committee member: Try to Come for the mass that you told ur gonna come - {massName}!"
  }
];

export interface AutomatedMassConfig {
  massKey: string;
  massName: string;
  dayName: string;
  time: string;
  defaultTimeAdvance: string;
  targetScope: 'all-committee' | 'pledged-committee';
  enabled: boolean;
  templateText: string;
}

export const DEFAULT_AUTOMATED_MASS_CONFIGS: AutomatedMassConfig[] = [
  {
    massKey: 'tuesday',
    massName: 'Tuesday Holy Mass',
    dayName: 'Tuesday',
    time: '6.00 PM',
    defaultTimeAdvance: 'Tuesday afternoon ahead of Mass',
    targetScope: 'all-committee',
    enabled: true,
    templateText: "Dear {name}, Try to Come for the mass that you told ur gonna come - Tuesday Holy Mass!"
  },
  {
    massKey: 'thursday',
    massName: 'Thursday - Novena And Holy Mass',
    dayName: 'Thursday',
    time: '6.00 PM',
    defaultTimeAdvance: 'Thursday afternoon ahead of Mass',
    targetScope: 'all-committee',
    enabled: true,
    templateText: "Dear {name}, Try to Come for the mass that you told ur gonna come - Thursday - Novena And Holy Mass!"
  },
  {
    massKey: 'firstFriday',
    massName: 'First Friday Holy Mass',
    dayName: 'First Friday',
    time: '6.00 PM',
    defaultTimeAdvance: 'First Friday ahead of Mass',
    targetScope: 'all-committee',
    enabled: true,
    templateText: "Dear {name}, Try to Come for the mass that you told ur gonna come - First Friday Holy Mass!"
  },
  {
    massKey: 'saturdaySundayMass6',
    massName: 'Saturday Sunday Mass 6',
    dayName: 'Saturday',
    time: '6.00 PM',
    defaultTimeAdvance: 'Saturday afternoon ahead of Mass',
    targetScope: 'all-committee',
    enabled: true,
    templateText: "Dear {name}, Try to Come for the mass that you told ur gonna come - Saturday Sunday Mass 6!"
  },
  {
    massKey: 'sundayMorningMass630',
    massName: 'Sunday Morning Mass 6.30',
    dayName: 'Sunday',
    time: '6.30 AM',
    defaultTimeAdvance: 'Sunday morning ahead of Mass',
    targetScope: 'all-committee',
    enabled: true,
    templateText: "Dear {name}, Try to Come for the mass that you told ur gonna come - Sunday Morning Mass 6.30!"
  },
  {
    massKey: 'sundayMorningMass8',
    massName: 'Sunday Morning Mass 8',
    dayName: 'Sunday',
    time: '8.00 AM',
    defaultTimeAdvance: 'Sunday morning ahead of Mass',
    targetScope: 'all-committee',
    enabled: true,
    templateText: "Dear {name}, Try to Come for the mass that you told ur gonna come - Sunday Morning Mass 8!"
  }
];

const AUTOMATED_MASS_STORAGE_KEY = 'st_cecilia_automated_mass_configs_v3';

export function getAutomatedMassConfigs(): AutomatedMassConfig[] {
  try {
    const raw = localStorage.getItem(AUTOMATED_MASS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_AUTOMATED_MASS_CONFIGS;
}

export function saveAutomatedMassConfigs(configs: AutomatedMassConfig[]) {
  try {
    localStorage.setItem(AUTOMATED_MASS_STORAGE_KEY, JSON.stringify(configs));
  } catch {
    // ignore
  }
}

export function getCommitteeMassPledges(
  committeeMembers: Array<{ id: string; name: string; role: string; phone?: string; photoUrl?: string; choristerId?: string }>,
  choristers: Array<{ id: string; name: string; phoneNumber?: string; photoUrl?: string; weeklyMassPreference?: string; sundayMassPreference?: string; committeeRole?: string }>
): MassAttendancePledge[] {
  const masses: Array<{ key: string; name: string; dayTime: string; color: string; matchTerms: string[] }> = [
    {
      key: 'tuesday',
      name: 'Tuesday Holy Mass',
      dayTime: 'Tuesday • 6.00 PM',
      color: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10',
      matchTerms: ['tuesday', 'anthony']
    },
    {
      key: 'thursday',
      name: 'Thursday - Novena And Holy Mass',
      dayTime: 'Thursday • 6.00 PM',
      color: 'border-indigo-500/40 text-indigo-300 bg-indigo-500/10',
      matchTerms: ['thursday', 'novena']
    },
    {
      key: 'firstFriday',
      name: 'First Friday Holy Mass',
      dayTime: 'First Friday • 6.00 PM',
      color: 'border-rose-500/40 text-rose-300 bg-rose-500/10',
      matchTerms: ['first friday', 'friday']
    },
    {
      key: 'saturdaySundayMass6',
      name: 'Saturday Sunday Mass 6',
      dayTime: 'Saturday • 6.00 PM',
      color: 'border-amber-500/40 text-amber-300 bg-amber-500/10',
      matchTerms: ['saturday - 6', 'saturday - 5', 'saturday vigil', 'saturday - 6.00', 'saturday']
    },
    {
      key: 'sundayMorningMass630',
      name: 'Sunday Morning Mass 6.30',
      dayTime: 'Sunday • 6.30 AM',
      color: 'border-blue-500/40 text-blue-300 bg-blue-500/10',
      matchTerms: ['6.30', '6:30', 'sunday - 6']
    },
    {
      key: 'sundayMorningMass8',
      name: 'Sunday Morning Mass 8',
      dayTime: 'Sunday • 8.00 AM',
      color: 'border-purple-500/40 text-purple-300 bg-purple-500/10',
      matchTerms: ['8.00', '8:00', 'sunday - 8']
    },
  ];

  return masses.map((m) => {
    const pledged: CommitteePledgedMember[] = [];

    committeeMembers.forEach((comm) => {
      // Find matching chorister
      const ch = choristers.find(
        (c) =>
          c.id === comm.id ||
          c.id === comm.choristerId ||
          c.name.toLowerCase().trim() === comm.name.toLowerCase().trim()
      );

      const weeklyPref = (ch?.weeklyMassPreference || '').toLowerCase();
      const sundayPref = (ch?.sundayMassPreference || '').toLowerCase();
      const combined = `${weeklyPref} ${sundayPref}`;

      const isMatch = m.matchTerms.some((term) => combined.includes(term));

      if (isMatch) {
        pledged.push({
          memberId: comm.id,
          memberName: comm.name,
          role: comm.role,
          phone: comm.phone || ch?.phoneNumber,
          photoUrl: comm.photoUrl || ch?.photoUrl,
          pledgedPreference: weeklyPref && m.matchTerms.some(t => weeklyPref.includes(t)) ? ch?.weeklyMassPreference : ch?.sundayMassPreference,
          confirmed: true,
        });
      }
    });

    // Also check any chorister with a committeeRole who might not be in committeeMembers yet
    choristers.forEach((ch) => {
      if (ch.committeeRole && !pledged.some((p) => p.memberName.toLowerCase().trim() === ch.name.toLowerCase().trim())) {
        const weeklyPref = (ch.weeklyMassPreference || '').toLowerCase();
        const sundayPref = (ch.sundayMassPreference || '').toLowerCase();
        const combined = `${weeklyPref} ${sundayPref}`;
        const isMatch = m.matchTerms.some((term) => combined.includes(term));
        if (isMatch) {
          pledged.push({
            memberId: ch.id,
            memberName: ch.name,
            role: ch.committeeRole,
            phone: ch.phoneNumber,
            photoUrl: ch.photoUrl,
            pledgedPreference: weeklyPref && m.matchTerms.some(t => weeklyPref.includes(t)) ? ch.weeklyMassPreference : ch.sundayMassPreference,
            confirmed: true,
          });
        }
      }
    });

    return {
      massKey: m.key,
      massName: m.name,
      dayTime: m.dayTime,
      color: m.color,
      committeeMembers: pledged,
    };
  });
}

export const NOTIFICATION_PRESETS = [
  {
    id: 'preset-weekly-mass',
    category: 'weekly-mass' as const,
    title: '⛪ Weekly Mass: Try Attend the Mass',
    body: 'Every Weekly Mass: Please try to attend the holy mass and support our choir ministry! Let us worship and praise God together with joyful hearts.',
    shortLabel: 'Weekly Mass Attendance',
    badge: 'Weekly Mass',
    color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
  },
  {
    id: 'preset-committee',
    category: 'committee' as const,
    title: '📋 Choir Committee Member Check-in',
    body: 'Do your part to the choir as a committee member! What should we do next as a Choir ? 🤔 Take a moment to reflect and share your thoughts with the executive team.',
    shortLabel: 'Committee Reflection',
    badge: 'Committee Role',
    color: 'border-amber-500/40 bg-amber-500/10 text-amber-300'
  },
  {
    id: 'preset-major-events',
    category: 'major-events' as const,
    title: '🌟 Upcoming Major Celebrations',
    body: 'Main Events Like Feast, Carols, and Easter Are Coming Along! Keep up your practice, check the 100-day countdowns, and review your hymn schedules.',
    shortLabel: 'Major Events Preparation',
    badge: 'Major Events',
    color: 'border-rose-500/40 bg-rose-500/10 text-rose-300'
  }
];

const LOCAL_STORAGE_KEY = 'st_cecilia_notifications_v1';
const AUTO_SCHEDULE_KEY = 'st_cecilia_notification_schedule_v1';

export interface ScheduleSettings {
  massRemindersEnabled: boolean;
  committeePromptsEnabled: boolean;
  eventCountdownsEnabled: boolean;
  soundEnabled: boolean;
  lastCommitteePromptDate?: string;
}

export function getScheduleSettings(): ScheduleSettings {
  try {
    const raw = localStorage.getItem(AUTO_SCHEDULE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    massRemindersEnabled: true,
    committeePromptsEnabled: true,
    eventCountdownsEnabled: true,
    soundEnabled: true
  };
}

export function saveScheduleSettings(settings: ScheduleSettings) {
  try {
    localStorage.setItem(AUTO_SCHEDULE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

// Gentle musical chime using Web Audio API (offline & 100% reliable)
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play a gentle two-tone liturgical bell chime (E5 -> G#5)
    const now = ctx.currentTime;
    
    // Tone 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    // Tone 2 (Harmonic chime)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(830.61, now + 0.15); // G#5
    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.85);
  } catch {
    // Audio might be blocked if user hasn't interacted yet
  }
}

// Check notification permission status
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

// Request permission safely
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    if (Notification.permission === 'granted') {
      return 'granted';
    }
    const promise = Notification.requestPermission();
    if (promise && typeof promise.then === 'function') {
      const res = await Promise.race([
        promise,
        new Promise<NotificationPermission>((r) => setTimeout(() => r(Notification.permission || 'default'), 2500))
      ]);
      return res;
    } else {
      return new Promise((resolve) => {
        try {
          Notification.requestPermission((res) => {
            resolve(res);
          });
        } catch {
          resolve(Notification.permission || 'default');
        }
      });
    }
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return Notification.permission;
  }
}

// Retrieve stored notifications
export function getStoredNotifications(): ChoirNotification[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

// Store notifications
export function saveStoredNotifications(notifications: ChoirNotification[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(notifications.slice(0, 60)));
  } catch {
    // ignore
  }
}

// Dispatch in-app notification update event
function dispatchNotificationUpdate() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('choir-notifications-updated'));
  }
}

// Send local system notification directly to current device
export async function triggerDeviceNotification(
  title: string,
  body: string,
  category: ChoirNotification['category'] = 'general',
  sentBy: string = 'Choir Admin',
  emoji: string = '🔔'
): Promise<{ success: boolean; message: string }> {
  // 1. Play cathedral chime audio unconditionally on alert
  playNotificationSound();

  // 2. Physical Vibration
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }
  } catch {}

  // 3. Record in app inbox
  recordNotificationToInbox(title, body, category, sentBy, emoji);

  // 4. If Web Notifications are supported and permitted, trigger OS system banner
  if (typeof window !== 'undefined' && 'Notification' in window) {
    let permission = Notification.permission;
    if (permission === 'default') {
      try {
        permission = await requestNotificationPermission() as NotificationPermission;
      } catch {}
    }

    if (permission === 'granted') {
      // Try Service Worker (essential for Android PWA / Background apps)
      let shownViaSW = false;
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          if (registration && registration.showNotification) {
            await registration.showNotification(title, {
              body,
              icon: '/choir_logo.jpg',
              badge: '/favicon.ico',
              vibrate: [200, 100, 200],
              tag: `choir-alert-${Date.now()}`,
              data: { url: '/' }
            } as NotificationOptions);
            shownViaSW = true;
          }
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'SHOW_NOTIFICATION',
              title,
              body,
              icon: '/choir_logo.jpg'
            });
          }
        } catch (e) {
          console.warn('SW notification delivery:', e);
        }
      }

      // Fallback to Window Notification
      if (!shownViaSW) {
        try {
          new Notification(title, {
            body,
            icon: '/choir_logo.jpg',
            badge: '/favicon.ico',
          });
        } catch (err) {
          console.warn('Window Notification error:', err);
        }
      }

      return {
        success: true,
        message: 'Notification delivered to your device!'
      };
    }
  }

  return { 
    success: true, 
    message: 'Notification recorded in your in-app inbox and sound played.' 
  };
}

// Process Real-time notification received from SSE stream or Polling
export function handleIncomingRealtimeNotification(
  notif: any,
  currentActiveMemberId?: string
): boolean {
  if (!notif) return false;

  // Check if this notification is targeted to this member or all members
  const isTargetedToMe = 
    !notif.targetMemberId || 
    notif.targetMemberId === 'all' || 
    notif.targetMemberId === currentActiveMemberId;

  if (!isTargetedToMe) {
    return false;
  }

  // Play audio chime
  playNotificationSound();

  // Vibrate
  try {
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
  } catch {}

  // Save to stored notifications if not already present
  const existing = getStoredNotifications();
  if (!existing.some(n => n.id === notif.id)) {
    const item: ChoirNotification = {
      id: notif.id || `notif-${Date.now()}`,
      title: notif.title || 'Choir Notification',
      body: notif.body || '',
      category: notif.category || 'general',
      timestamp: notif.timestamp || new Date().toISOString(),
      read: false,
      sentBy: notif.sentBy,
      targetMemberId: notif.targetMemberId,
      targetMemberName: notif.targetMemberName,
      targetMassKey: notif.targetMassKey,
      emoji: notif.emoji || '🔔',
    };
    saveStoredNotifications([item, ...existing]);
    dispatchNotificationUpdate();
  }

  // Trigger system notification if permitted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.showNotification(notif.title || 'Choir Notification', {
          body: notif.body || '',
          icon: '/choir_logo.jpg',
          badge: '/favicon.ico',
          vibrate: [200, 100, 200],
          tag: notif.id || `choir-${Date.now()}`,
          data: { url: '/' }
        } as NotificationOptions).catch(() => {});
      }).catch(() => {});
    } else {
      try {
        new Notification(notif.title || 'Choir Notification', {
          body: notif.body || '',
          icon: '/choir_logo.jpg',
          badge: '/favicon.ico',
        });
      } catch {}
    }
  }

  return true;
}

// Helper: Record in local and server storage
export function recordNotificationToInbox(
  title: string,
  body: string,
  category: ChoirNotification['category'],
  sentBy: string,
  emoji?: string,
  targetMemberId?: string,
  targetMemberName?: string,
  targetMassKey?: string
): ChoirNotification {
  const newNotif: ChoirNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title,
    body,
    category,
    emoji: emoji || '🔔',
    timestamp: new Date().toISOString(),
    read: false,
    sentBy,
    targetMemberId,
    targetMemberName,
    targetMassKey
  };

  const current = getStoredNotifications();
  const updated = [newNotif, ...current.filter(n => n.id !== newNotif.id)].slice(0, 50);
  saveStoredNotifications(updated);
  dispatchNotificationUpdate();

  // Also post to backend so other connected devices can receive it
  fetch('/api/notifications', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notification: newNotif })
  }).catch(() => {
    // ignore offline
  });

  return newNotif;
}

// Send custom notification with custom emoji logo, text, and chosen recipients
export async function sendCustomNotification(params: {
  title: string;
  body: string;
  emoji: string;
  recipients: Array<{ id: string; name: string }> | 'all';
  sentBy: string;
}): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const res = await fetch('/api/notifications/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to send notification');
    const data = await res.json();
    dispatchNotificationUpdate();
    return { success: true, count: data.count || 1, message: 'Custom notification sent successfully!' };
  } catch (err) {
    // Local fallback
    const emoji = params.emoji || '🔔';
    const title = params.title ? `${emoji} ${params.title}` : `${emoji} Choir Notification`;
    recordNotificationToInbox(title, params.body, 'committee', params.sentBy, emoji);
    return { success: true, count: 1, message: 'Notification recorded locally.' };
  }
}

// Dispatches mass reminders to every committee member for the mass they told they would come
export async function sendPledgedMassReminders(
  pledges: Array<{ massKey: string; massName: string; memberId: string; memberName: string; phone?: string }>,
  sentBy: string = 'Lead Joshua Peiris'
): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const res = await fetch('/api/notifications/dispatch-pledged-masses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pledges, sentBy })
    });
    if (!res.ok) throw new Error('Failed to dispatch mass reminders');
    const data = await res.json();
    dispatchNotificationUpdate();
    return { success: true, count: data.count || pledges.length, message: `Sent ${data.count} mass attendance reminders!` };
  } catch (err) {
    // Local fallback
    pledges.forEach(p => {
      const firstName = p.memberName.split(' ')[0] || p.memberName;
      recordNotificationToInbox(
        `⛪ Mass Reminder: ${p.massName}`,
        `Dear ${firstName}, Try to Come for the mass that you told ur gonna come - ${p.massName}!`,
        'weekly-mass',
        sentBy,
        '⛪',
        p.memberId,
        p.memberName,
        p.massKey
      );
    });
    return { success: true, count: pledges.length, message: `Recorded ${pledges.length} mass reminders locally.` };
  }
}

// Mark single notification as read
export function markNotificationAsRead(id: string) {
  const current = getStoredNotifications();
  const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
  saveStoredNotifications(updated);
  dispatchNotificationUpdate();
}

// Mark all as read
export function markAllNotificationsAsRead() {
  const current = getStoredNotifications();
  const updated = current.map(n => ({ ...n, read: true }));
  saveStoredNotifications(updated);
  dispatchNotificationUpdate();
}

// Clear all notifications
export function clearAllNotifications() {
  saveStoredNotifications([]);
  dispatchNotificationUpdate();
}
