import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  Music, 
  Sparkles, 
  Church, 
  ShieldCheck, 
  Flame, 
  Clock, 
  Lock, 
  Unlock, 
  RefreshCw, 
  Bell, 
  CheckCircle2, 
  DollarSign, 
  ClipboardCheck, 
  Archive,
  History,
  Cake,
  BookOpen,
  MoreHorizontal,
  CalendarDays,
  X
} from 'lucide-react';
import { 
  AnnualCalendarConfig, 
  AuditLogEntry, 
  Chorister, 
  CommitteeMember, 
  FeastNovenaEntry, 
  MajorEvent, 
  WeeklyMassService, 
  WorkAndBudget,
  PracticeSession,
  ArchiveRecord
} from './types';
import { 
  INITIAL_CHORISTERS, 
  INITIAL_COMMITTEE_MEMBERS, 
  INITIAL_FEAST_NOVENAS, 
  INITIAL_WEEKLY_MASSES, 
  INITIAL_MAJOR_EVENTS, 
  INITIAL_CALENDAR_CONFIG,
  INITIAL_AUDIT_LOGS,
  INITIAL_ARCHIVES
} from './data/initialData';
import { Navbar } from './components/Navbar';
import { EventCountdownBanner } from './components/EventCountdownBanner';
import { ChoristersDatabase } from './components/ChoristersDatabase';
import { WeeklyMassesTab } from './components/WeeklyMassesTab';
import { FeastTab } from './components/FeastTab';
import { MajorEventTab } from './components/MajorEventTab';
import { AttendanceTab } from './components/AttendanceTab';
import { ArchivesTab } from './components/ArchivesTab';
import { HistoryTab } from './components/HistoryTab';
import { HymnsTab } from './components/HymnsTab';
import { CommitteeGateModal } from './components/CommitteeGateModal';
import { CalendarConfigModal } from './components/CalendarConfigModal';
import { YearPlanModal } from './components/YearPlanModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuditLogDrawer } from './components/AuditLogDrawer';
import { AppLoginGate } from './components/AppLoginGate';
import { UserProfileModal } from './components/UserProfileModal';
import { SupabaseSetupModal } from './components/SupabaseSetupModal';
import { BirthdayCelebrationBanner } from './components/BirthdayCelebrationBanner';
import { BirthdayFlyerModal } from './components/BirthdayFlyerModal';
import { NotificationModal } from './components/NotificationModal';
import { OnlinePresenceModal } from './components/OnlinePresenceModal';
import { FullDisplayLogoIntro } from './components/FullDisplayLogoIntro';
import { 
  getStoredNotifications, 
  getScheduleSettings, 
  playNotificationSound,
  handleIncomingRealtimeNotification,
  requestNotificationPermission 
} from './utils/notificationService';
import { 
  startPresenceHeartbeat, 
  stopPresenceHeartbeat, 
  fetchOnlineUsers, 
  OnlinePresenceUser 
} from './utils/presenceService';
import { getDaysRemaining } from './utils/dateUtils';
import { getTodayBirthdayChoristers } from './utils/birthdayUtils';

export default function App() {
  // Live real-time system clock updating every second
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Main App State
  const [choristers, setChoristers] = useState<Chorister[]>(() => {
    try {
      const cached = localStorage.getItem('st_cecilia_choristers_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_CHORISTERS;
  });
  const [committeeMembers, setCommitteeMembers] = useState<CommitteeMember[]>(() => {
    try {
      const cached = localStorage.getItem('st_cecilia_committee_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_COMMITTEE_MEMBERS;
  });
  const [activeMember, setActiveMember] = useState<CommitteeMember>(() => {
    const saved = sessionStorage.getItem('st_cecilia_auth_member');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_COMMITTEE_MEMBERS[0];
  });
  const [feastNovenas, setFeastNovenas] = useState<FeastNovenaEntry[]>(INITIAL_FEAST_NOVENAS);
  const [weeklyMasses, setWeeklyMasses] = useState(INITIAL_WEEKLY_MASSES);
  const [majorEvents, setMajorEvents] = useState(INITIAL_MAJOR_EVENTS);
  const [calendarConfig, setCalendarConfig] = useState<AnnualCalendarConfig>(() => {
    try {
      const cached = localStorage.getItem('st_cecilia_calendar_config_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') return { ...INITIAL_CALENDAR_CONFIG, ...parsed };
      }
    } catch {}
    return INITIAL_CALENDAR_CONFIG;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [practices, setPractices] = useState<PracticeSession[]>([]);
  const [archives, setArchives] = useState<ArchiveRecord[]>(INITIAL_ARCHIVES);

  // Active Tab
  // Options: 'choristers' | 'weekly-masses' | 'feast' | 'carols' | 'easter' | 'christmas-new-year'
  const [activeTab, setActiveTab] = useState<string>('choristers');

  // UI & Authentication state (Prompt: "and the start of the app they need to be able login with their pin and showing their profile")
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!sessionStorage.getItem('st_cecilia_auth_member');
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isMobilePreview, setIsMobilePreview] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState<boolean>(false);
  const [isYearPlanModalOpen, setIsYearPlanModalOpen] = useState<boolean>(false);
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [isFlyerModalOpen, setIsFlyerModalOpen] = useState<boolean>(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState<boolean>(false);
  const [isOnlinePresenceModalOpen, setIsOnlinePresenceModalOpen] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlinePresenceUser[]>([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState<number>(() => {
    return getStoredNotifications().filter(n => !n.read).length;
  });
  const [flyerCelebrant, setFlyerCelebrant] = useState<Chorister | null>(null);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState<boolean>(false);
  // Superb smooth Full Display Interactive Animation to Choir Crest Logo from the start of the system
  const [isLogoIntroOpen, setIsLogoIntroOpen] = useState<boolean>(true);
  const handleCloseLogoIntro = useCallback(() => {
    setIsLogoIntroOpen(false);
  }, []);

  // Real-time presence heartbeat tracking
  useEffect(() => {
    if (isAuthenticated && activeMember) {
      startPresenceHeartbeat(activeMember, (users) => {
        setOnlineUsers(users);
      });
      fetchOnlineUsers().then((users) => {
        setOnlineUsers(users);
      });
    } else {
      stopPresenceHeartbeat();
    }
    return () => {
      stopPresenceHeartbeat();
    };
  }, [isAuthenticated, activeMember]);

  // Request device notification permission on user entry if needed
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        // Safe request on first user engagement
        requestNotificationPermission().catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    const handleNotifUpdate = () => {
      setUnreadNotifCount(getStoredNotifications().filter(n => !n.read).length);
    };
    window.addEventListener('choir-notifications-updated', handleNotifUpdate);
    return () => window.removeEventListener('choir-notifications-updated', handleNotifUpdate);
  }, []);

  const handleOpenFlyerModal = (celebrant?: Chorister) => {
    const target = celebrant || (birthdayChoristers.length > 0 ? birthdayChoristers[0] : (choristers.length > 0 ? choristers[0] : null));
    setFlyerCelebrant(target);
    setIsFlyerModalOpen(true);
  };

  const showSyncNotification = (msg: string) => {
    setSyncToast(msg);
    setTimeout(() => setSyncToast(null), 3500);
  };

  const handleLoginSuccess = (member: CommitteeMember, chorister?: Chorister) => {
    setActiveMember(member);
    setIsAuthenticated(true);
    sessionStorage.setItem('st_cecilia_auth_member', JSON.stringify(member));
    // Immediately show their authenticated profile upon login!
    setIsProfileModalOpen(true);
    showSyncNotification(`Authenticated as ${member.name} (${member.role})`);
  };

  const handleLockSession = () => {
    setIsAuthenticated(false);
    setIsProfileModalOpen(false);
    sessionStorage.removeItem('st_cecilia_auth_member');
    showSyncNotification('Portal locked. Please enter PIN to log in.');
  };

  // Fetch full state from backend
  const fetchState = useCallback(async () => {
    try {
      const [stateRes, practicesRes, archivesRes] = await Promise.all([
        fetch('/api/state'),
        fetch('/api/practices'),
        fetch('/api/archives'),
      ]);

      if (stateRes.ok) {
        const data = await stateRes.json();
        if (data.choristers) setChoristers(data.choristers);
        if (data.committeeMembers) setCommitteeMembers(data.committeeMembers);
        if (data.feastNovenas) setFeastNovenas(data.feastNovenas);
        if (data.weeklyMasses) setWeeklyMasses(data.weeklyMasses);
        if (data.majorEvents) setMajorEvents(data.majorEvents);
        if (data.calendarConfig) {
          const raw = data.calendarConfig;
          const resolvedConfig: AnnualCalendarConfig = {
            feastDate: raw.feastDate || raw.feastTargetDate || '2026-09-29',
            carolsDate: raw.carolsDate || raw.carolsTargetDate || '2026-12-20',
            christmasNewYearDate: raw.christmasNewYearDate || raw.christmasTargetDate || '2026-12-25',
            newYearDate: raw.newYearDate || '2027-01-01',
            easterDate: raw.easterDate || raw.easterTargetDate || '2027-03-28',
            feastBackgroundUrl: raw.feastBackgroundUrl,
            carolsBackgroundUrl: raw.carolsBackgroundUrl,
            christmasBackgroundUrl: raw.christmasBackgroundUrl,
            newYearBackgroundUrl: raw.newYearBackgroundUrl,
            easterBackgroundUrl: raw.easterBackgroundUrl,
            customEvents: raw.customEvents || [],
          };
          setCalendarConfig(resolvedConfig);
          try {
            localStorage.setItem('st_cecilia_calendar_config_cache', JSON.stringify(resolvedConfig));
          } catch {}
        }
        if (data.choristers) {
          try {
            localStorage.setItem('st_cecilia_choristers_cache', JSON.stringify(data.choristers));
          } catch {}
        }
        if (data.committeeMembers) {
          try {
            localStorage.setItem('st_cecilia_committee_cache', JSON.stringify(data.committeeMembers));
          } catch {}
        }
        if (data.auditLogs) setAuditLogs(data.auditLogs);
      }
      if (practicesRes.ok) {
        const pr = await practicesRes.json();
        if (Array.isArray(pr)) setPractices(pr);
      }
      if (archivesRes.ok) {
        const ar = await archivesRes.json();
        if (Array.isArray(ar) && ar.length > 0) {
          setArchives(ar);
        } else {
          setArchives(INITIAL_ARCHIVES);
        }
      }
    } catch {
      // Fallback to local state
    }
  }, []);

  // Connect SSE for Real-time Web & Mobile Sync
  useEffect(() => {
    fetchState();

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/stream');
      
      eventSource.onopen = () => {
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'CHORISTERS_UPDATED') {
            setChoristers(payload.payload);
            showSyncNotification('Chorister records synchronized in real-time');
          } else if (payload.type === 'NOVENAS_UPDATED') {
            setFeastNovenas(payload.payload);
            setMajorEvents((prev) => ({
              ...prev,
              feast: {
                ...prev.feast,
                novenaEntries: payload.payload,
              },
            }));
            showSyncNotification('Feast Novena assignments synchronized');
          } else if (payload.type === 'WEEKLY_MASSES_UPDATED') {
            setWeeklyMasses(payload.payload);
            showSyncNotification('Weekly Mass liturgy schedule updated');
          } else if (payload.type === 'EVENT_UPDATED') {
            if (payload.payload.eventId === 'all' && payload.payload.majorEvents) {
              setMajorEvents(payload.payload.majorEvents);
            } else if (payload.payload.eventId && payload.payload.event) {
              setMajorEvents((prev) => ({
                ...prev,
                [payload.payload.eventId]: payload.payload.event,
              }));
            }
            showSyncNotification('Event work & budget synchronized');
          } else if (payload.type === 'CALENDAR_UPDATED') {
            setCalendarConfig(payload.payload.calendarConfig);
            setMajorEvents(payload.payload.majorEvents);
            showSyncNotification('Annual liturgical calendar synchronized');
          } else if (payload.type === 'AUDIT_LOG_ADDED') {
            setAuditLogs((prev) => [payload.payload, ...prev]);
          } else if (payload.type === 'PRACTICES_UPDATED') {
            setPractices(payload.payload);
            showSyncNotification('Practices & attendance synchronized');
          } else if (payload.type === 'ARCHIVES_UPDATED') {
            setArchives(payload.payload);
            showSyncNotification('Archives updated');
          } else if (payload.type === 'EVENT_ROLLED_OVER') {
            setArchives(payload.payload.archives);
            setMajorEvents(payload.payload.majorEvents);
            setCalendarConfig(payload.payload.calendarConfig);
            if (payload.payload.feastNovenas) setFeastNovenas(payload.payload.feastNovenas);
            showSyncNotification('Program archived and rolled over to next year!');
          } else if (payload.type === 'COMMITTEE_UPDATED') {
            setCommitteeMembers(payload.payload);
            setActiveMember((currentActive) => {
              const matched = payload.payload.find((m: CommitteeMember) => m.id === currentActive.id);
              if (matched) {
                sessionStorage.setItem('st_cecilia_auth_member', JSON.stringify(matched));
                return matched;
              }
              return currentActive;
            });
            showSyncNotification('Committee profile records updated in real-time');
          } else if (payload.type === 'NOTIFICATION_SENT') {
            const notif = payload.payload;
            handleIncomingRealtimeNotification(notif, activeMember?.id);
            showSyncNotification(`🔔 ${notif.title}`);
            setUnreadNotifCount(getStoredNotifications().filter(n => !n.read).length);
          } else if (payload.type === 'PRESENCE_UPDATED') {
            if (Array.isArray(payload.payload)) {
              setOnlineUsers(payload.payload);
            }
          } else if (payload.type === 'STATE_RESET') {
            fetchState();
            showSyncNotification('Application state reset to default');
          }
        } catch {
          // parse error ignored
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [fetchState]);

  // Handler: Add Chorister
  const handleAddChorister = async (newChorister: Partial<Chorister>) => {
    try {
      const res = await fetch('/api/choristers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chorister: newChorister, actor: activeMember }),
      });
      if (res.ok) {
        const added = await res.json();
        setChoristers((prev) => [added, ...prev]);
        showSyncNotification(`Added ${added.name} to chorister roster`);
      }
    } catch {
      // Optimistic fallback
      const mock: Chorister = {
        id: `choir-${Date.now()}`,
        name: newChorister.name || 'Unknown',
        age: newChorister.age || 20,
        birthdate: newChorister.birthdate || '',
        address: newChorister.address || '',
        phoneNumber: newChorister.phoneNumber || '',
        role: newChorister.role || 'Chorister',
      };
      setChoristers((prev) => [mock, ...prev]);
    }
  };

  // Handler: Update Chorister
  const handleUpdateChorister = async (id: string, updated: Partial<Chorister>) => {
    try {
      const res = await fetch(`/api/choristers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chorister: updated, actor: activeMember }),
      });
      if (res.ok) {
        const saved = await res.json();
        setChoristers((prev) => prev.map((c) => (c.id === id ? saved : c)));
        showSyncNotification(`Updated details for ${saved.name}`);
      }
    } catch {
      setChoristers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    }
  };

  // Handler: Delete Chorister
  const handleDeleteChorister = async (id: string) => {
    try {
      const res = await fetch(`/api/choristers/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: activeMember }),
      });
      if (res.ok) {
        setChoristers((prev) => prev.filter((c) => c.id !== id));
        showSyncNotification('Removed chorister from registry');
      }
    } catch {
      setChoristers((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Handler: Update Feast Novena
  const handleUpdateNovena = async (dayNumber: number, entry: Partial<FeastNovenaEntry>) => {
    try {
      const res = await fetch(`/api/novenas/${dayNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry, actor: activeMember }),
      });
      if (res.ok) {
        const saved = await res.json();
        setFeastNovenas((prev) => prev.map((n) => (n.dayNumber === dayNumber ? saved : n)));
        setMajorEvents((prev) => ({
          ...prev,
          feast: {
            ...prev.feast,
            novenaEntries: prev.feast.novenaEntries?.map((n) =>
              n.dayNumber === dayNumber ? saved : n
            ),
          },
        }));
        showSyncNotification(`Novena Day ${dayNumber} assignments updated`);
      }
    } catch {
      setFeastNovenas((prev) =>
        prev.map((n) => (n.dayNumber === dayNumber ? { ...n, ...entry } : n))
      );
    }
  };

  const handleSyncAllFixedNovenas = async (fixedData: {
    rosaryTime: string;
    massTime: string;
    entranceHymn: string;
    offertory1Hymn: string;
    communion1Hymn: string;
    finalHymn: string;
  }) => {
    try {
      const res = await fetch('/api/novenas-sync-fixed', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fixedData, actor: activeMember }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.feastNovenas) {
          setFeastNovenas(data.feastNovenas);
          setMajorEvents((prev) => ({
            ...prev,
            feast: {
              ...prev.feast,
              novenaEntries: data.feastNovenas,
            },
          }));
        }
        showSyncNotification('Fixed times & hymns successfully synced to all 9 Novenas!');
      }
    } catch {
      setFeastNovenas((prev) =>
        prev.map((n) => ({
          ...n,
          ...fixedData,
        }))
      );
      setMajorEvents((prev) => ({
        ...prev,
        feast: {
          ...prev.feast,
          novenaEntries: prev.feast.novenaEntries?.map((n) => ({
            ...n,
            ...fixedData,
          })),
        },
      }));
      showSyncNotification('Fixed times & hymns synced locally.');
    }
  };

  // Handler: Update Major Event Work & Budget
  const handleSaveMajorEventWork = async (eventId: string, updatedWork: WorkAndBudget) => {
    try {
      const res = await fetch(`/api/events/${eventId}/work-budget`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workAndBudget: updatedWork, actor: activeMember }),
      });
      if (res.ok) {
        const saved = await res.json();
        setMajorEvents((prev) => ({
          ...prev,
          [eventId]: saved,
        }));
        showSyncNotification(`Saved work & budget for ${saved.title}`);
      }
    } catch {
      setMajorEvents((prev) => ({
        ...prev,
        [eventId]: {
          ...(prev as any)[eventId],
          workAndBudget: updatedWork,
        },
      }));
    }
  };

  // Handler: Update Weekly Mass Service Work & Budget (Auto-saved to History with date & hymns)
  const handleUpdateWeeklyMass = async (
    serviceKey: string,
    updatedWork: WorkAndBudget,
    subKey?: string
  ) => {
    // Generate optimistic history record
    const serviceNameMap: Record<string, string> = {
      'saturday-english': 'Saturday English Mass',
      'tuesday-novena': 'Tuesday St. Anthony Novena & Mass',
      'thursday-healing': 'Thursday Divine Mercy Healing Service',
      'first-friday': 'First Friday Sacred Heart Devotion',
      'sunday-vigil': 'Saturday Sunday Mass (Sat 6pm)',
      'sunday-7am': 'Sunday Morning Mass (7:00 AM)',
      'sunday-830am': 'Sunday Main High Mass (8:30 AM)',
    };
    const resolvedName = serviceNameMap[serviceKey] || serviceKey;
    const todayDate = new Date().toISOString().split('T')[0];

    const localHistoryRecord: ArchiveRecord = {
      id: `hist-mass-${serviceKey}-${Date.now()}`,
      year: new Date().getFullYear(),
      eventId: 'weekly-mass',
      eventTitle: resolvedName,
      massType: resolvedName,
      massDate: todayDate,
      recordType: 'weekly-mass',
      dateRange: todayDate,
      archivedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      archivedBy: activeMember ? `${activeMember.name} (${activeMember.role})` : 'Joshua Peiris (President)',
      organist: updatedWork.organist,
      readingPerson: updatedWork.readingPerson,
      summary: {
        totalHymns: updatedWork.hymns?.length || 0,
        totalPractices: updatedWork.practices?.length || 0,
        totalBudgeted: updatedWork.targetBudget || 0,
        totalActualSpent: 0,
        totalIncome: 0,
      },
      hymns: [...(updatedWork.hymns || [])],
      tasks: [...(updatedWork.tasks || [])],
      practices: [...(updatedWork.practices || [])],
      budget: [...(updatedWork.budget || [])],
      notes: `Weekly mass saved for ${resolvedName} on ${todayDate}. Organist: ${updatedWork.organist || 'N/A'}, Reader: ${updatedWork.readingPerson || 'N/A'}.`,
    };

    // Optimistically prepend to history archives
    setArchives((prev) => [localHistoryRecord, ...prev]);

    try {
      const res = await fetch(`/api/weekly-masses/${serviceKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workAndBudget: updatedWork, actor: activeMember, subKey }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.weeklyMasses) {
          setWeeklyMasses(data.weeklyMasses);
        } else {
          setWeeklyMasses(data);
        }
        if (data.archives) {
          setArchives(data.archives);
        }
        showSyncNotification('Saved mass & recorded to History with hymns & date');
      }
    } catch {
      // optimistic fallback
      fetchState();
    }
  };

  // Handler: Delete History Record
  const handleDeleteHistoryRecord = async (id: string) => {
    setArchives((prev) => prev.filter((a) => a.id !== id));
    try {
      const res = await fetch(`/api/archives/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: activeMember }),
      });
      if (res.ok) {
        showSyncNotification('History record removed');
      }
    } catch {
      // ignore
    }
  };

  // Handler: Save Practices & Attendance
  const handleSavePractices = async (updatedPractices: PracticeSession[], description?: string) => {
    setPractices(updatedPractices);
    try {
      await fetch('/api/practices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          practices: updatedPractices,
          actor: activeMember,
          actionDescription: description,
        }),
      });
      showSyncNotification('Practice schedule saved');
    } catch {
      // ignore
    }
  };

  // Handler: Delete Practice Session
  const handleDeletePractice = async (practiceId: string) => {
    // 1. Optimistic local removal across central practices
    setPractices((prev) => prev.filter((p) => p.id !== practiceId));

    // 2. Optimistic removal across major events
    setMajorEvents((prev) => {
      const updated = { ...prev };
      const eventKeys = ['feast', 'carols', 'easter', 'christmas-new-year'] as const;
      for (const k of eventKeys) {
        if (updated[k]?.workAndBudget?.practices) {
          updated[k] = {
            ...updated[k],
            workAndBudget: {
              ...updated[k].workAndBudget,
              practices: updated[k].workAndBudget.practices.filter((p) => p.id !== practiceId),
            },
          };
        }
      }
      return updated;
    });

    // 3. Optimistic removal across weekly masses
    setWeeklyMasses((prev) => {
      const copy = JSON.parse(JSON.stringify(prev));
      ['tuesday', 'thursday', 'firstFriday'].forEach((k) => {
        if (copy[k]?.workAndBudget?.practices) {
          copy[k].workAndBudget.practices = copy[k].workAndBudget.practices.filter((p: any) => p.id !== practiceId);
        }
      });
      if (copy.sundayMasses?.services) {
        Object.values(copy.sundayMasses.services).forEach((s: any) => {
          if (s?.workAndBudget?.practices) {
            s.workAndBudget.practices = s.workAndBudget.practices.filter((p: any) => p.id !== practiceId);
          }
        });
      }
      return copy;
    });

    // 4. Server call with write-through deletion
    try {
      const res = await fetch(`/api/practices/${practiceId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actor: activeMember }),
      });
      if (res.ok) {
        showSyncNotification('Practice session removed successfully');
      }
    } catch (err) {
      console.error('Failed to delete practice session:', err);
    }
  };

  // Handler: Save Archive Snapshot
  const handleSaveArchive = async (record: ArchiveRecord) => {
    setArchives((prev) => [record, ...prev]);
    try {
      await fetch('/api/archives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          archiveRecord: record,
          actor: activeMember,
        }),
      });
      showSyncNotification('Archive record saved to database');
    } catch {
      // ignore
    }
  };

  // Handler: Event Rollover (Backup to database & prepare next year)
  const handleRolloverEvent = async (eventId: string, notes?: string) => {
    try {
      const res = await fetch('/api/events/rollover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          notes,
          actor: activeMember,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setArchives(data.archives);
        setMajorEvents(data.majorEvents);
        setCalendarConfig(data.calendarConfig);
        showSyncNotification('Program successfully archived to database! Prepared for next year.');
      }
    } catch {
      // ignore
    }
  };

  // Handler: Update Annual Calendar (driving 100-day countdowns)
  const handleSaveCalendar = async (config: AnnualCalendarConfig) => {
    try {
      const res = await fetch('/api/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarConfig: config, actor: activeMember }),
      });
      if (res.ok) {
        const data = await res.json();
        setCalendarConfig(data.calendarConfig);
        setMajorEvents(data.majorEvents);
        showSyncNotification('Calendar & 100-day preparation windows updated');
      }
    } catch {
      setCalendarConfig(config);
    }
  };

  // Handler: Update Officer / Chorister Personal Profile Details
  const handleSaveProfile = async (
    updatedMember: CommitteeMember,
    choristerData?: Partial<Chorister>
  ) => {
    try {
      const res = await fetch(`/api/profile/${updatedMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileData: {
            ...updatedMember,
            ...choristerData,
          },
          actor: {
            name: activeMember.name,
            role: activeMember.role,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const freshMember: CommitteeMember = data.member || updatedMember;
        setActiveMember(freshMember);
        sessionStorage.setItem('st_cecilia_auth_member', JSON.stringify(freshMember));

        setCommitteeMembers((prev) => {
          const updatedList = prev.map((m) => (m.id === freshMember.id ? freshMember : m));
          try { localStorage.setItem('st_cecilia_committee_cache', JSON.stringify(updatedList)); } catch {}
          return updatedList;
        });

        if (data.chorister) {
          setChoristers((prev) => {
            const updatedList = prev.map((c) => (c.id === data.chorister.id ? data.chorister : c));
            try { localStorage.setItem('st_cecilia_choristers_cache', JSON.stringify(updatedList)); } catch {}
            return updatedList;
          });
        } else if (choristerData || freshMember.photoUrl) {
          setChoristers((prev) => {
            const updatedList = prev.map((c) =>
              c.name.toLowerCase() === freshMember.name.toLowerCase() || c.id === freshMember.id
                ? { 
                    ...c, 
                    ...choristerData, 
                    name: freshMember.name, 
                    phoneNumber: freshMember.phone,
                    photoUrl: freshMember.photoUrl || c.photoUrl
                  }
                : c
            );
            try { localStorage.setItem('st_cecilia_choristers_cache', JSON.stringify(updatedList)); } catch {}
            return updatedList;
          });
        }

        showSyncNotification('Personal profile details & photo updated successfully');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  // Handler: Reset Demo Data
  const handleResetDemo = async () => {
    try {
      await fetch('/api/reset-demo', { method: 'POST' });
      await fetchState();
      setIsAuditDrawerOpen(false);
      showSyncNotification('App reset to clean initial demo state');
    } catch {
      // ignore
    }
  };

  // Compute countdown & locked status for the 4 major tabs
  const feastDays = getDaysRemaining(calendarConfig?.feastDate || '2026-09-29', currentDate);
  const carolsDays = getDaysRemaining(calendarConfig?.carolsDate || '2026-12-20', currentDate);
  const christmasDays = getDaysRemaining(calendarConfig?.christmasNewYearDate || '2026-12-25', currentDate);
  const easterDays = getDaysRemaining(calendarConfig?.easterDate || '2027-03-28', currentDate);

  // Today's birthday celebrants among choristers
  const birthdayChoristers = useMemo(
    () => getTodayBirthdayChoristers(choristers, currentDate),
    [choristers, currentDate]
  );

  // START OF APP PIN LOGIN GATE (Prompt: "and the start of the app they need to be able login with their pin and showing their profile")
  if (!isAuthenticated) {
    return (
      <AppLoginGate
        committeeMembers={committeeMembers}
        choristers={choristers}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const isDeveloper = activeMember?.name?.trim().toLowerCase() === 'joshua peiris';
  const isLeadJoshua = isDeveloper || activeMember?.id === 'choir-joshua-peiris';

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] flex flex-col antialiased selection:bg-amber-500/30 selection:text-amber-200">
      {/* Real-time sync floating notification toast */}
      {syncToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#161616] text-[#E0E0E0] text-xs px-4 py-3 rounded-2xl shadow-2xl border border-neutral-700 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Top Navigation Bar with Live Date & Clock, Committee Role, Sync Status */}
      <Navbar
        currentDate={currentDate}
        activeMember={activeMember}
        isConnected={isConnected}
        isMobilePreview={isMobilePreview}
        birthdayChoristers={birthdayChoristers}
        unreadNotificationsCount={unreadNotifCount}
        onSelectChoristerTab={() => setActiveTab('choristers')}
        onToggleMobilePreview={() => setIsMobilePreview(!isMobilePreview)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onLockSession={handleLockSession}
        onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
        onOpenYearPlanModal={() => setIsYearPlanModalOpen(true)}
        onOpenAuditDrawer={() => setIsAuditDrawerOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenNotificationModal={isLeadJoshua ? () => setIsNotificationModalOpen(true) : undefined}
        onlineUsers={onlineUsers}
        onOpenOnlinePresenceModal={isLeadJoshua ? () => setIsOnlinePresenceModalOpen(true) : undefined}
        onOpenFullDisplayLogo={() => setIsLogoIntroOpen(true)}
        onOpenFlyerModal={() => handleOpenFlyerModal()}
      />

      {/* Main Container / Mobile Viewport Frame Toggle */}
      <div className={`flex-1 w-full transition-all ${
        isMobilePreview 
          ? 'max-w-md mx-auto my-6 px-3 pb-24 shadow-2xl rounded-3xl border-8 border-neutral-800 bg-[#121212] overflow-hidden' 
          : 'max-w-7xl mx-auto px-3 sm:px-6 pt-3 pb-24 md:pb-6'
      }`}>
        {/* Mobile Device Header Bar if in preview mode */}
        {isMobilePreview && (
          <div className="bg-[#080808] text-white text-[11px] py-1.5 px-4 flex items-center justify-between border-b border-[#222222] -mx-4 -mt-0 mb-4">
            <span className="font-semibold text-amber-400">Choir Mobile App</span>
            <span className="text-neutral-500 font-mono">390 × 844</span>
          </div>
        )}

        {/* Birthday Celebration Banner for today's celebrants */}
        <BirthdayCelebrationBanner
          birthdayChoristers={birthdayChoristers}
          currentDate={currentDate}
          onSelectChoristerTab={() => setActiveTab('choristers')}
          onGenerateFlyer={handleOpenFlyerModal}
        />

        {/* 100-Day Countdown Summary Banner */}
        <EventCountdownBanner
          currentDate={currentDate}
          calendarConfig={calendarConfig}
          majorEvents={majorEvents}
          activeTab={activeTab}
          activeMember={activeMember}
          onSelectTab={(tabId) => setActiveTab(tabId)}
          onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
          onOpenYearPlanModal={() => setIsYearPlanModalOpen(true)}
        />

        {/* Automated Mass Notifications Center Prompt Banner */}
        {isLeadJoshua && (
          <div className="mt-4 bg-[#141414] border border-amber-500/30 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/40 shrink-0">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-bold text-white">
                    Automated Mass Notification Center
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    All Committee Members
                  </span>
                  {unreadNotifCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-black">
                      {unreadNotifCount} unread
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 truncate">
                  Automated attendance notifications for each Mass to all committee members
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsNotificationModalOpen(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Church className="w-3.5 h-3.5 fill-black" />
                <span>Send Mass Pledges &amp; Alerts</span>
              </button>
            </div>
          </div>
        )}

        {/* Five Main Event Tabs + Christmas & New Year Tab Bar */}
        {/* Exact Prompt: "Create five main event tabs: Manage Choristers, Weekly Masses, Easter, Carols, and Feast, along with a Christmas and New Year tab." */}
        <nav 
          id="main-event-tabs" 
          aria-label="Event Categories" 
          className="mt-5 border-b border-[#222222] overflow-x-auto scrollbar-none"
        >
          <div className="flex items-center gap-1.5 min-w-max pb-1">
            {/* 1. Manage Choristers */}
            <button
              id="tab-btn-choristers"
              onClick={() => setActiveTab('choristers')}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-xs font-bold border-b-2 transition-all ${
                activeTab === 'choristers'
                  ? 'border-amber-500 text-amber-300 bg-[#171717] shadow-sm'
                  : 'border-transparent text-neutral-400 hover:text-[#E0E0E0] hover:bg-[#171717]/60'
              }`}
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Manage Choristers</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#222222] text-neutral-300 font-semibold border border-[#333333]">
                {choristers.length}
              </span>
              {birthdayChoristers.length > 0 && (
                <span 
                  className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-neutral-950 font-black flex items-center gap-0.5 animate-pulse shadow-sm"
                  title={`${birthdayChoristers.length} Birthday celebrants today!`}
                >
                  <Cake className="w-2.5 h-2.5" />
                  <span>{birthdayChoristers.length}</span>
                </span>
              )}
            </button>

            {/* 2. Main Attendance Tab in Home Area */}
            <button
              id="tab-btn-attendance"
              onClick={() => setActiveTab('attendance')}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-xs font-bold border-b-2 transition-all ${
                activeTab === 'attendance'
                  ? 'border-amber-500 text-amber-300 bg-[#171717] shadow-sm'
                  : 'border-transparent text-neutral-400 hover:text-[#E0E0E0] hover:bg-[#171717]/60'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-emerald-400" />
              <span>Attendance & Practices</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                {practices.length}
              </span>
            </button>

            {/* 3. Weekly Masses */}
            <button
              id="tab-btn-weekly-masses"
              onClick={() => setActiveTab('weekly-masses')}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-xs font-bold border-b-2 transition-all ${
                activeTab === 'weekly-masses'
                  ? 'border-amber-500 text-amber-300 bg-[#171717] shadow-sm'
                  : 'border-transparent text-neutral-400 hover:text-[#E0E0E0] hover:bg-[#171717]/60'
              }`}
            >
              <Church className="w-4 h-4 text-indigo-400" />
              <span>Weekly Masses</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950/80 text-indigo-300 font-semibold border border-indigo-800/60">
                7 Masses
              </span>
            </button>

            {/* Hymns Directory & Hymnal Library Tab */}
            <button
              id="tab-btn-hymns"
              onClick={() => setActiveTab('hymns')}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-xs font-bold border-b-2 transition-all ${
                activeTab === 'hymns'
                  ? 'border-rose-500 text-rose-300 bg-[#171717] shadow-sm'
                  : 'border-transparent text-neutral-400 hover:text-[#E0E0E0] hover:bg-[#171717]/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-rose-400" />
              <span>Hymns (ගීතිකා)</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30">
                755
              </span>
            </button>

            {/* 3. Feast */}
            <button
              id="tab-btn-feast"
              onClick={() => setActiveTab('feast')}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-xs font-bold border-b-2 transition-all ${
                activeTab === 'feast'
                  ? 'border-amber-500 text-amber-300 bg-[#171717] shadow-sm'
                  : 'border-transparent text-neutral-400 hover:text-[#E0E0E0] hover:bg-[#171717]/60'
              }`}
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Parish Feast & Nine Novenas</span>
              {/* Dynamic 100-day badge */}
              {feastDays <= 100 ? (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1 border border-emerald-500/30">
                  <Unlock className="w-2.5 h-2.5" />
                  {feastDays}d (Active)
                </span>
              ) : (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#222222] text-neutral-400 font-bold flex items-center gap-1 border border-neutral-700">
                  <Lock className="w-2.5 h-2.5" />
                  {feastDays}d
                </span>
              )}
            </button>

            {/* 4. Carols */}
            <button
              id="tab-btn-carols"
              onClick={() => setActiveTab('carols')}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-xs font-bold border-b-2 transition-all ${
                activeTab === 'carols'
                  ? 'border-amber-500 text-amber-300 bg-[#171717] shadow-sm'
                  : 'border-transparent text-neutral-400 hover:text-[#E0E0E0] hover:bg-[#171717]/60'
              }`}
            >
              <Music className="w-4 h-4 text-blue-400" />
              <span>Carols</span>
              {/* Dynamic 100-day badge */}
              {carolsDays <= 100 ? (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1 border border-emerald-500/30">
                  <Unlock className="w-2.5 h-2.5" />
                  {carolsDays}d
                </span>
              ) : (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#222222] text-neutral-400 font-bold flex items-center gap-1 border border-neutral-700">
                  <Lock className="w-2.5 h-2.5" />
                  {carolsDays}d
                </span>
              )}
            </button>

            {/* 5. Christmas and New Year */}
            <button
              id="tab-btn-christmas-new-year"
              onClick={() => setActiveTab('christmas-new-year')}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-xs font-bold border-b-2 transition-all ${
                activeTab === 'christmas-new-year'
                  ? 'border-amber-500 text-amber-300 bg-[#171717] shadow-sm'
                  : 'border-transparent text-neutral-400 hover:text-[#E0E0E0] hover:bg-[#171717]/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-rose-400" />
              <span>Christmas & New Year</span>
              {/* Dynamic 100-day badge */}
              {christmasDays <= 100 ? (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1 border border-emerald-500/30">
                  <Unlock className="w-2.5 h-2.5" />
                  {christmasDays}d
                </span>
              ) : (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#222222] text-neutral-400 font-bold flex items-center gap-1 border border-neutral-700">
                  <Lock className="w-2.5 h-2.5" />
                  {christmasDays}d
                </span>
              )}
            </button>

            {/* 6. Easter */}
            <button
              id="tab-btn-easter"
              onClick={() => setActiveTab('easter')}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-xs font-bold border-b-2 transition-all ${
                activeTab === 'easter'
                  ? 'border-amber-500 text-amber-300 bg-[#171717] shadow-sm'
                  : 'border-transparent text-neutral-400 hover:text-[#E0E0E0] hover:bg-[#171717]/60'
              }`}
            >
              <Flame className="w-4 h-4 text-purple-400" />
              <span>Easter & Holy Week</span>
              {/* Dynamic 100-day badge */}
              {easterDays <= 100 ? (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-bold flex items-center gap-1 border border-emerald-500/30">
                  <Unlock className="w-2.5 h-2.5" />
                  {easterDays}d
                </span>
              ) : (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#222222] text-neutral-400 font-bold flex items-center gap-1 border border-neutral-700">
                  <Lock className="w-2.5 h-2.5" />
                  {easterDays}d
                </span>
              )}
            </button>

            {/* 7. History Tab (Every saved weekly mass, hymns with date, & annual rollovers) */}
            <button
              id="tab-btn-history"
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-xl text-xs font-bold border-b-2 transition-all ${
                activeTab === 'history' || activeTab === 'archives'
                  ? 'border-amber-500 text-amber-300 bg-[#171717] shadow-sm'
                  : 'border-transparent text-neutral-400 hover:text-[#E0E0E0] hover:bg-[#171717]/60'
              }`}
            >
              <History className="w-4 h-4 text-amber-400" />
              <span>History</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                {archives.length}
              </span>
            </button>

            {/* 8. Year Plan & 100-Day Prep Windows */}
            <button
              id="tab-btn-year-plan"
              onClick={() => setIsYearPlanModalOpen(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-t-xl text-xs font-bold border-b-2 border-transparent text-amber-300/90 hover:text-amber-300 hover:bg-[#171717]/80 transition-all cursor-pointer bg-amber-500/10"
              title="View Annual Liturgical Year Plan, 100-Day Windows & Backgrounds"
            >
              <CalendarDays className="w-4 h-4 text-amber-400" />
              <span>Year Plan (100-Day Prep)</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                {4 + (calendarConfig.customEvents?.length || 0)}
              </span>
            </button>
          </div>
        </nav>

        {/* Tab Content Display */}
        <main className="mt-6">
          {/* TAB 1: MANAGE CHORISTERS */}
          {activeTab === 'choristers' && (
            <ChoristersDatabase
              choristers={choristers}
              currentDate={currentDate}
              activeMember={activeMember}
              practices={practices}
              onAddChorister={handleAddChorister}
              onUpdateChorister={handleUpdateChorister}
              onDeleteChorister={handleDeleteChorister}
              onGenerateFlyer={handleOpenFlyerModal}
            />
          )}

          {/* MAIN ATTENDANCE TAB (HOME AREA) */}
          {activeTab === 'attendance' && (
            <AttendanceTab
              choristers={choristers}
              activeMember={activeMember}
              practices={practices}
              onSavePractices={handleSavePractices}
              onDeletePractice={handleDeletePractice}
              onNavigateToWeeklyMass={() => setActiveTab('weekly-masses')}
            />
          )}

          {/* TAB 2: WEEKLY MASSES */}
          {activeTab === 'weekly-masses' && (
            <WeeklyMassesTab
              weeklyMasses={weeklyMasses}
              choristers={choristers}
              activeMember={activeMember}
              allPractices={practices}
              onSavePractices={handleSavePractices}
              onDeletePractice={handleDeletePractice}
              onUpdateWeeklyMass={handleUpdateWeeklyMass}
              onOpenNotificationModal={isLeadJoshua ? () => setIsNotificationModalOpen(true) : undefined}
            />
          )}

          {/* TAB: HYMNS DIRECTORY (755 SINHALA CATHOLIC HYMNS) */}
          {activeTab === 'hymns' && (
            <HymnsTab />
          )}

          {/* TAB 3: FEAST & NOVENAS */}
          {activeTab === 'feast' && (
            <FeastTab
              event={{
                ...majorEvents.feast,
                novenaEntries: feastNovenas,
              }}
              currentDate={currentDate}
              choristers={choristers}
              activeMember={activeMember}
              allPractices={practices}
              onSavePractices={handleSavePractices}
              onDeletePractice={handleDeletePractice}
              onUpdateNovena={handleUpdateNovena}
              onSyncAllNovenas={handleSyncAllFixedNovenas}
              onSaveWorkAndBudget={(updatedWork) => handleSaveMajorEventWork('feast', updatedWork)}
            />
          )}

          {/* TAB 4: CAROLS */}
          {activeTab === 'carols' && (
            <MajorEventTab
              event={majorEvents.carols}
              currentDate={currentDate}
              choristers={choristers}
              activeMember={activeMember}
              allPractices={practices}
              onSavePractices={handleSavePractices}
              onDeletePractice={handleDeletePractice}
              onSaveWorkAndBudget={(updatedWork) => handleSaveMajorEventWork('carols', updatedWork)}
              onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
            />
          )}

          {/* TAB 5: CHRISTMAS AND NEW YEAR */}
          {activeTab === 'christmas-new-year' && (
            <MajorEventTab
              event={majorEvents['christmas-new-year']}
              currentDate={currentDate}
              choristers={choristers}
              activeMember={activeMember}
              allPractices={practices}
              onSavePractices={handleSavePractices}
              onDeletePractice={handleDeletePractice}
              onSaveWorkAndBudget={(updatedWork) => handleSaveMajorEventWork('christmas-new-year', updatedWork)}
              onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
            />
          )}

          {/* TAB 6: EASTER */}
          {activeTab === 'easter' && (
            <MajorEventTab
              event={majorEvents.easter}
              currentDate={currentDate}
              choristers={choristers}
              activeMember={activeMember}
              allPractices={practices}
              onSavePractices={handleSavePractices}
              onDeletePractice={handleDeletePractice}
              onSaveWorkAndBudget={(updatedWork) => handleSaveMajorEventWork('easter', updatedWork)}
              onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
            />
          )}

          {/* TAB 7: HISTORY (ALL SAVED MASSES, HYMNS WITH DATES & ROLLOVER) */}
          {(activeTab === 'history' || activeTab === 'archives') && (
            <HistoryTab
              archives={archives}
              activeMember={activeMember}
              majorEvents={majorEvents}
              onRolloverEvent={handleRolloverEvent}
              onDeleteHistoryRecord={handleDeleteHistoryRecord}
              onSaveHistoryRecord={handleSaveArchive}
            />
          )}
        </main>
      </div>

      {/* Authenticated User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        member={activeMember}
        choristerProfile={choristers.find(
          (c) => c.name.toLowerCase() === activeMember.name.toLowerCase()
        )}
        onLockSession={handleLockSession}
        onSwitchAccount={() => {
          setIsProfileModalOpen(false);
          setIsAuthModalOpen(true);
        }}
        onSaveProfile={handleSaveProfile}
      />

      {/* Committee Authentication & Role Gate Modal */}
      <CommitteeGateModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        committeeMembers={committeeMembers}
        activeMember={activeMember}
        onSelectMember={(member) => {
          setActiveMember(member);
          sessionStorage.setItem('st_cecilia_auth_member', JSON.stringify(member));
          setIsProfileModalOpen(true);
        }}
      />

      {/* Annual Calendar Modal */}
      <CalendarConfigModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        currentDate={currentDate}
        calendarConfig={calendarConfig}
        activeMember={activeMember}
        onSaveCalendar={handleSaveCalendar}
      />

      {/* Liturgical Year Plan & 100-Day Prep Windows Modal */}
      <ErrorBoundary fallbackTitle="Liturgical Year Plan Modal">
        <YearPlanModal
          isOpen={isYearPlanModalOpen}
          onClose={() => setIsYearPlanModalOpen(false)}
          currentDate={currentDate}
          calendarConfig={calendarConfig}
          majorEvents={majorEvents}
          activeMember={activeMember}
          onSaveCalendar={handleSaveCalendar}
          onNavigateToTab={(tabKey) => setActiveTab(tabKey)}
        />
      </ErrorBoundary>

      {/* Activity & Workflow Audit Log Drawer */}
      <AuditLogDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        logs={auditLogs}
        onResetDemo={handleResetDemo}
      />

      {/* Supabase Live Cloud Database Setup Guide & Status Modal */}
      <SupabaseSetupModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onRefreshAppState={fetchState}
      />

      {/* Birthday Celebration Flyer Generator & Compositing Modal */}
      <BirthdayFlyerModal
        isOpen={isFlyerModalOpen}
        onClose={() => setIsFlyerModalOpen(false)}
        celebrant={flyerCelebrant}
        allChoristers={choristers}
        currentDate={currentDate}
        onSelectAnotherChorister={(newCelebrant) => setFlyerCelebrant(newCelebrant)}
      />

      {/* Automated Mass Notifications & Broadcast Center Modal (Lead Joshua Peiris Only) */}
      {isLeadJoshua && (
        <NotificationModal
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
          activeMember={activeMember}
          committeeMembers={committeeMembers}
          choristers={choristers}
          onNotifySent={(msg) => showSyncNotification(msg)}
          onlineUsers={onlineUsers}
        />
      )}

      {/* Real-time Who is Online Right Now Modal (Lead Joshua Peiris Only) */}
      {isLeadJoshua && (
        <OnlinePresenceModal
          isOpen={isOnlinePresenceModalOpen}
          onClose={() => setIsOnlinePresenceModalOpen(false)}
          onlineUsers={onlineUsers}
          onOpenSendNotificationToUser={() => {
            setIsNotificationModalOpen(true);
          }}
        />
      )}

      {/* Superb Smooth Full Display Interactive Animation to Choir Crest Logo (From the start of system) */}
      <FullDisplayLogoIntro
        isOpen={isLogoIntroOpen}
        onClose={handleCloseLogoIntro}
        autoCloseSeconds={5}
      />

      {/* MOBILE MORE MENU BOTTOM SHEET */}
      {isMobileMoreOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMoreOpen(false)}
        >
          <div 
            className="bg-[#141414] border-t border-[#2A2A2A] rounded-t-3xl p-5 shadow-2xl max-h-[80vh] overflow-y-auto space-y-4 animate-in slide-in-from-bottom-5 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#222222]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">More Events & Portals</h3>
              </div>
              <button 
                onClick={() => setIsMobileMoreOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Major Events Grid */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                Parish Liturgies & Feasts
              </span>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setActiveTab('feast');
                    setIsMobileMoreOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeTab === 'feast'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-[#1C1C1C] border-[#2A2A2A] text-neutral-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-[10px] font-bold text-emerald-400">{feastDays}d</span>
                  </div>
                  <div className="font-bold text-xs text-white">Parish Feast & Nine Novenas</div>
                  <div className="text-[10px] text-neutral-400">9 Novena Masses</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('carols');
                    setIsMobileMoreOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeTab === 'carols'
                      ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                      : 'bg-[#1C1C1C] border-[#2A2A2A] text-neutral-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Music className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] font-bold text-neutral-400">{carolsDays}d</span>
                  </div>
                  <div className="font-bold text-xs text-white">Carols Service</div>
                  <div className="text-[10px] text-neutral-400">Christmas Festival</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('easter');
                    setIsMobileMoreOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeTab === 'easter'
                      ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                      : 'bg-[#1C1C1C] border-[#2A2A2A] text-neutral-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Church className="w-4 h-4 text-purple-400" />
                    <span className="text-[10px] font-bold text-neutral-400">{easterDays}d</span>
                  </div>
                  <div className="font-bold text-xs text-white">Easter & Holy Week</div>
                  <div className="text-[10px] text-neutral-400">Solemn Paschal Liturgy</div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('christmas-new-year');
                    setIsMobileMoreOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeTab === 'christmas-new-year'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-[#1C1C1C] border-[#2A2A2A] text-neutral-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-bold text-neutral-400">{christmasDays}d</span>
                  </div>
                  <div className="font-bold text-xs text-white">Christmas & New Year</div>
                  <div className="text-[10px] text-neutral-400">Midnight & Day Masses</div>
                </button>
              </div>
            </div>

            {/* Quick Tools & History */}
            <div className="space-y-1.5 pt-1 border-t border-[#222222]">
              <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                System & Records
              </span>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => {
                    setIsMobileMoreOpen(false);
                    handleOpenFlyerModal();
                  }}
                  className="p-2.5 rounded-xl border bg-amber-500/15 border-amber-500/40 hover:bg-amber-500/25 text-neutral-200 hover:text-white flex items-center gap-2.5 transition-all text-left"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-amber-300">Flyer Generator</div>
                    <div className="text-[10px] text-neutral-400">Birthday Compositor</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('history');
                    setIsMobileMoreOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${
                    activeTab === 'history'
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-[#1C1C1C] border-[#2A2A2A] text-neutral-300 hover:text-white'
                  }`}
                >
                  <History className="w-4 h-4 text-amber-400 shrink-0" />
                  <div className="text-left">
                    <div className="text-xs font-bold text-white">History & Archive</div>
                    <div className="text-[10px] text-neutral-400">Saved Masses ({archives.length})</div>
                  </div>
                </button>

                {isLeadJoshua && (
                  <button
                    onClick={() => {
                      setIsMobileMoreOpen(false);
                      setIsNotificationModalOpen(true);
                    }}
                    className="p-2.5 rounded-xl border bg-[#1C1C1C] border-amber-500/30 hover:border-amber-500/50 text-neutral-300 hover:text-white flex items-center gap-2.5 transition-all text-left"
                  >
                    <div className="relative">
                      <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                      {unreadNotifCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Mass Notifications</span>
                        {unreadNotifCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black text-[9px] font-black">
                            {unreadNotifCount}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400">Mass &amp; Role Alerts</div>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsMobileMoreOpen(false);
                    setIsCalendarModalOpen(true);
                  }}
                  className="p-2.5 rounded-xl border bg-[#1C1C1C] border-[#2A2A2A] text-neutral-300 hover:text-white flex items-center gap-2.5 transition-all text-left"
                >
                  <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">Calendar Settings</div>
                    <div className="text-[10px] text-neutral-400">100-Day Prep Windows</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsMobileMoreOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="p-2.5 rounded-xl border bg-[#1C1C1C] border-[#2A2A2A] text-neutral-300 hover:text-white flex items-center gap-2.5 transition-all text-left"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-white">My Profile</div>
                    <div className="text-[10px] text-neutral-400">{activeMember.role}</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsMobileMoreOpen(false);
                    handleLockSession();
                  }}
                  className="p-2.5 rounded-xl border bg-[#1C1C1C] hover:bg-rose-950/30 border-[#2A2A2A] hover:border-rose-500/30 text-rose-300 flex items-center gap-2.5 transition-all text-left"
                >
                  <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-rose-300">Lock Session</div>
                    <div className="text-[10px] text-neutral-400">Re-enter PIN</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION DOCK (Native mobile phone navigation) */}
      <nav 
        id="mobile-bottom-dock"
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-t border-[#262626] px-1 py-1.5 shadow-2xl flex items-center justify-around pb-[max(0.375rem,env(safe-area-inset-bottom))]"
      >
        {/* 1. Choristers */}
        <button
          onClick={() => {
            setActiveTab('choristers');
            setIsMobileMoreOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
            activeTab === 'choristers'
              ? 'text-amber-400 font-bold'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <div className="relative">
            <Users className="w-5 h-5" />
            {birthdayChoristers.length > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Members</span>
        </button>

        {/* 2. Attendance */}
        <button
          onClick={() => {
            setActiveTab('attendance');
            setIsMobileMoreOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
            activeTab === 'attendance'
              ? 'text-emerald-400 font-bold'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <ClipboardCheck className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Attendance</span>
        </button>

        {/* 3. Weekly Masses */}
        <button
          onClick={() => {
            setActiveTab('weekly-masses');
            setIsMobileMoreOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
            activeTab === 'weekly-masses'
              ? 'text-indigo-400 font-bold'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Church className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Masses</span>
        </button>

        {/* 4. Hymns */}
        <button
          onClick={() => {
            setActiveTab('hymns');
            setIsMobileMoreOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
            activeTab === 'hymns'
              ? 'text-rose-400 font-bold'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Hymns</span>
        </button>

        {/* 5. More / Events */}
        <button
          onClick={() => setIsMobileMoreOpen(!isMobileMoreOpen)}
          className={`flex-1 py-1 px-1 rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all ${
            isMobileMoreOpen || ['feast', 'carols', 'christmas-new-year', 'easter', 'history'].includes(activeTab)
              ? 'text-amber-400 font-bold'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">
            {['feast', 'carols', 'christmas-new-year', 'easter'].includes(activeTab) 
              ? 'Events' 
              : activeTab === 'history' 
                ? 'History' 
                : 'More'}
          </span>
        </button>
      </nav>

      {/* Subtle Footer */}
      <footer className="mt-auto bg-[#0A0A0A] border-t border-[#1F1F1F] text-neutral-400 text-xs py-4 px-4 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Choir Management System • St. Michael&apos;s Church Koralawella
          </span>
          <span className="text-neutral-500">
            Real-Time Sync Active (Web & Mobile) • Port 3000
          </span>
        </div>
      </footer>
    </div>
  );
}

// Icon helper
function Award(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}
