import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  Music, 
  DollarSign, 
  Church, 
  Sun, 
  Moon, 
  Sparkles, 
  Share2, 
  Send, 
  Copy, 
  Check, 
  Piano, 
  BookOpen, 
  CheckCircle2, 
  ExternalLink, 
  Heart, 
  Music2, 
  ClipboardCheck, 
  Plus, 
  Trash2, 
  UserCheck, 
  MapPin, 
  Cake, 
  X, 
  Search, 
  History, 
  MessageSquare, 
  ArrowRight, 
  ShieldCheck, 
  Edit3,
  Filter,
  Users,
  RotateCcw,
  Save,
  CheckSquare,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Star,
  Phone,
  Bell
} from 'lucide-react';
import { 
  Chorister, 
  CommitteeMember, 
  WeeklyMassService, 
  WorkAndBudget,
  PracticeSession,
  AttendanceStatus,
  PracticeAttendanceRecord,
  AttendanceChangeLogEntry,
  AttendanceChangeDetail
} from '../types';
import { isBirthdayToday } from '../utils/birthdayUtils';
import { getDriveDirectImageUrl } from '../utils/driveImage';
import { WorkSubTab } from './WorkSubTab';
import { BudgetSubTab } from './BudgetSubTab';
import { 
  TuesdayMassWhatsAppModal, 
  buildTuesdayWhatsAppText, 
  copyTextToClipboard 
} from './TuesdayMassWhatsAppModal';
import { 
  ThursdayNovenaWhatsAppModal, 
  buildThursdayWhatsAppText 
} from './ThursdayNovenaWhatsAppModal';
import { 
  FirstFridayWhatsAppModal, 
  buildFirstFridayWhatsAppText 
} from './FirstFridayWhatsAppModal';
import { 
  SundayMassesWhatsAppModal, 
  buildSundayWhatsAppText 
} from './SundayMassesWhatsAppModal';
import {
  SaturdayEnglishWhatsAppModal,
  buildSaturdayEnglishWhatsAppText,
} from './SaturdayEnglishWhatsAppModal';
import { INITIAL_WEEKLY_MASSES } from '../data/initialData';
import { copyAttendanceListToClipboard } from '../utils/massAttendanceUtils';

export type MassKey =
  | 'tuesday'
  | 'thursday'
  | 'firstFriday'
  | 'saturdayEnglish'
  | 'saturdayVigil'
  | 'sundayEarly'
  | 'sundayMain';

const ensureService = (
  srv?: any,
  fallback?: any
): WeeklyMassService => {
  const base = fallback || {
    id: 'mass-service',
    name: 'Mass Service',
    time: '',
    dayOfWeek: '',
    description: '',
    workAndBudget: {
      hymns: [],
      tasks: [],
      practices: [],
      budget: [],
      targetBudget: 0,
      workflowStatus: 'Draft' as const,
      organist: '',
      psalmPerson: '',
      acclamationPerson: '',
      sundayOrdinaryNumber: '',
      lastUpdatedBy: '',
      lastUpdatedAt: '',
    },
  };

  const srvWork = srv?.workAndBudget || {};
  const baseWork = base.workAndBudget || {};

  return {
    id: srv?.id || base.id || 'service',
    name: srv?.name || base.name || 'Service',
    time: srv?.time || base.time || '',
    dayOfWeek: srv?.dayOfWeek || base.dayOfWeek || '',
    description: srv?.description || base.description || '',
    workAndBudget: {
      ...baseWork,
      ...srvWork,
      hymns: srvWork.hymns || baseWork.hymns || [],
      tasks: srvWork.tasks || baseWork.tasks || [],
      practices: srvWork.practices || baseWork.practices || [],
      budget: srvWork.budget || baseWork.budget || [],
      targetBudget: srvWork.targetBudget ?? baseWork.targetBudget ?? 0,
      workflowStatus: srvWork.workflowStatus || baseWork.workflowStatus || ('Draft' as const),
      organist: srvWork.organist || baseWork.organist || '',
      psalmPerson: srvWork.psalmPerson || baseWork.psalmPerson || '',
      acclamationPerson: srvWork.acclamationPerson || baseWork.acclamationPerson || '',
      sundayOrdinaryNumber: srvWork.sundayOrdinaryNumber || baseWork.sundayOrdinaryNumber || '',
      lastUpdatedBy: srvWork.lastUpdatedBy || baseWork.lastUpdatedBy || '',
      lastUpdatedAt: srvWork.lastUpdatedAt || baseWork.lastUpdatedAt || '',
    },
  };
};

// Check if a chorister is specifically relevant to a given mass
export const isChoristerRelevantToMass = (c: Chorister, massKey: MassKey): boolean => {
  if (c.role === 'Instrument Player') return false;
  const wPref = (c.weeklyMassPreference || '').toLowerCase();
  const sPref = (c.sundayMassPreference || '').toLowerCase();

  switch (massKey) {
    case 'tuesday':
      return wPref.includes('tuesday') || wPref.includes('අඟහරුවාදා') || wPref.includes('tue');
    case 'thursday':
      return wPref.includes('thursday') || wPref.includes('බ්‍රහස්පතින්දා') || wPref.includes('thu');
    case 'firstFriday':
      return wPref.includes('first friday') || wPref.includes('friday') || wPref.includes('සිකුරාදා') || wPref.includes('fri');
    case 'saturdayEnglish':
      return wPref.includes('saturday english') || wPref.includes('7.00') || wPref.includes('7:00') || wPref.includes('english') || (sPref.includes('english') && wPref.includes('saturday'));
    case 'saturdayVigil':
      return sPref.includes('saturday') || sPref.includes('6.00 pm') || sPref.includes('6:00 pm') || sPref.includes('සෙනසුරාදා');
    case 'sundayEarly':
      return sPref.includes('6.30') || sPref.includes('6:30') || sPref.includes('early');
    case 'sundayMain':
      return sPref.includes('8.00') || sPref.includes('8:00') || sPref.includes('main');
    default:
      return false;
  }
};

interface WeeklyMassesTabProps {
  weeklyMasses?: {
    tuesday?: WeeklyMassService;
    thursday?: WeeklyMassService;
    firstFriday?: WeeklyMassService;
    saturdayEnglish?: WeeklyMassService;
    sundayMasses?: {
      id?: string;
      title?: string;
      services?: {
        saturdayVigil?: WeeklyMassService;
        sundayEarly?: WeeklyMassService;
        sundayMain?: WeeklyMassService;
      };
    };
  };
  choristers: Chorister[];
  activeMember: CommitteeMember;
  allPractices?: PracticeSession[];
  onSavePractices?: (updatedPractices: PracticeSession[], description?: string) => Promise<void>;
  onDeletePractice?: (practiceId: string) => Promise<void> | void;
  onUpdateWeeklyMass: (serviceKey: string, workAndBudget: WorkAndBudget, subKey?: string) => Promise<void>;
  onOpenNotificationModal?: () => void;
}

export const WeeklyMassesTab: React.FC<WeeklyMassesTabProps> = ({
  weeklyMasses,
  choristers,
  activeMember,
  allPractices = [],
  onSavePractices,
  onDeletePractice,
  onUpdateWeeklyMass,
  onOpenNotificationModal,
}) => {
  // Check current day of week: 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDate = new Date();
  const todayDayIndex = todayDate.getDay();
  const todayDateOfMonth = todayDate.getDate();
  const isLeadJoshua = activeMember?.name?.trim().toLowerCase() === 'joshua peiris' || activeMember?.id === 'choir-joshua-peiris';
  const isTodayTuesday = todayDayIndex === 2;
  const isTodayThursday = todayDayIndex === 4;
  const isTodayFriday = todayDayIndex === 5;
  const isTodayFirstFriday = isTodayFriday && todayDateOfMonth <= 7;
  const isTodaySaturday = todayDayIndex === 6;
  const isTodaySunday = todayDayIndex === 0;
  const isTodaySundayMassDay = isTodaySaturday || isTodaySunday;
  const currentHour = todayDate.getHours();

  // Mass options matching liturgical roster
  const [selectedMassKey, setSelectedMassKey] = useState<MassKey>(
    isTodayTuesday 
      ? 'tuesday' 
      : isTodayThursday 
        ? 'thursday' 
        : isTodayFirstFriday 
          ? 'firstFriday' 
          : isTodaySaturday
            ? 'saturdayVigil'
            : 'sundayMain'
  );

  // Safely resolved weekly mass services with robust fallbacks
  const tuesdayService = useMemo(() => ensureService(weeklyMasses?.tuesday, INITIAL_WEEKLY_MASSES.tuesday), [weeklyMasses?.tuesday]);
  const thursdayService = useMemo(() => ensureService(weeklyMasses?.thursday, INITIAL_WEEKLY_MASSES.thursday), [weeklyMasses?.thursday]);
  const firstFridayService = useMemo(() => ensureService(weeklyMasses?.firstFriday, INITIAL_WEEKLY_MASSES.firstFriday), [weeklyMasses?.firstFriday]);
  const saturdayEnglishService = useMemo(() => ensureService(weeklyMasses?.saturdayEnglish, INITIAL_WEEKLY_MASSES.saturdayEnglish), [weeklyMasses?.saturdayEnglish]);
  const satService = useMemo(() => ensureService(
    weeklyMasses?.sundayMasses?.services?.saturdayVigil,
    INITIAL_WEEKLY_MASSES.sundayMasses.services.saturdayVigil
  ), [weeklyMasses?.sundayMasses?.services?.saturdayVigil]);
  const sunEarlyService = useMemo(() => ensureService(
    weeklyMasses?.sundayMasses?.services?.sundayEarly,
    INITIAL_WEEKLY_MASSES.sundayMasses.services.sundayEarly
  ), [weeklyMasses?.sundayMasses?.services?.sundayEarly]);
  const sunMainService = useMemo(() => ensureService(
    weeklyMasses?.sundayMasses?.services?.sundayMain,
    INITIAL_WEEKLY_MASSES.sundayMasses.services.sundayMain
  ), [weeklyMasses?.sundayMasses?.services?.sundayMain]);

  // All 6 masses called by exact names specified
  const massOptions = [
    {
      key: 'tuesday' as MassKey,
      day: 'Tuesday',
      time: '6:00 PM',
      name: 'Tuesday Holy Mass',
      sinhalaName: 'අඟහරුවාදා සවස 6.00 දිව්‍ය පූජාව',
      serviceKey: 'tuesday',
      subKey: undefined,
      icon: Clock,
      service: tuesdayService,
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
    {
      key: 'thursday' as MassKey,
      day: 'Thursday',
      time: '6:00 PM',
      name: 'Thursday - Novena And Holy Mass',
      sinhalaName: 'ශුද්ධවූ මිඛායෙල් අග්‍රදූතතුමන්ගේ නුවානය හා දිව්‍ය පූජාව',
      serviceKey: 'thursday',
      subKey: undefined,
      icon: Sparkles,
      service: thursdayService,
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    },
    {
      key: 'firstFriday' as MassKey,
      day: 'First Friday',
      time: '6:00 PM',
      name: 'First Friday Holy Mass',
      sinhalaName: 'පළමු සිකුරාදා ආශිර්වාදය හා දිව්‍ය පූජාව',
      serviceKey: 'firstFriday',
      subKey: undefined,
      icon: Heart,
      service: firstFridayService,
      badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    },
    {
      key: 'saturdayEnglish' as MassKey,
      day: 'Saturday',
      time: '7:00 AM',
      name: 'Saturday English Mass',
      sinhalaName: 'සෙනසුරාදා පෙ.ව. 7.00 ඉංග්‍රීසි දිව්‍ය පූජාව',
      serviceKey: 'saturdayEnglish',
      subKey: undefined,
      icon: Clock,
      service: saturdayEnglishService,
      badgeColor: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    },
    {
      key: 'saturdayVigil' as MassKey,
      day: 'Saturday',
      time: '6:00 PM',
      name: 'Saturday Sunday Mass 6',
      sinhalaName: 'සෙනසුරාදා ප.ව. 6.00 දිව්‍ය පූජාව',
      serviceKey: 'sundayMasses',
      subKey: 'saturdayVigil',
      icon: Moon,
      service: satService,
      badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    },
    {
      key: 'sundayEarly' as MassKey,
      day: 'Sunday',
      time: '6:30 AM',
      name: 'Sunday Morning Mass 6.30',
      sinhalaName: 'ඉරුදින පෙ.ව. 6.30 උදෑසන දිව්‍ය පූජාව',
      serviceKey: 'sundayMasses',
      subKey: 'sundayEarly',
      icon: Sun,
      service: sunEarlyService,
      badgeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    },
    {
      key: 'sundayMain' as MassKey,
      day: 'Sunday',
      time: '8:00 AM',
      name: 'Sunday Morning Mass 8',
      sinhalaName: 'ඉරුදින පෙ.ව. 8.00 ප්‍රධාන උදෑසන දිව්‍ය පූජාව',
      serviceKey: 'sundayMasses',
      subKey: 'sundayMain',
      icon: Church,
      service: sunMainService,
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    },
  ];

  const currentConfig = massOptions.find((m) => m.key === selectedMassKey) || massOptions[0];
  const currentService: WeeklyMassService = currentConfig.service;

  // Sub-view: Mass Attendance Workspace is the primary default workplace!
  const [activeSubView, setActiveSubView] = useState<'attendance' | 'work' | 'budget'>('attendance');

  // --- Mass Attendance Workplace State ---
  const [selectedMassDate, setSelectedMassDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [activeRosterFilter, setActiveRosterFilter] = useState<'relevant' | 'all' | 'Present' | 'Absent' | 'Late' | 'Excused'>('relevant');
  const [rosterSearch, setRosterSearch] = useState('');
  const [selectedLetter, setSelectedLetter] = useState('ALL');
  const [expandedNotesChoristerId, setExpandedNotesChoristerId] = useState<string | null>(null);
  const [massAttendanceCaption, setMassAttendanceCaption] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false);

  // Active singing choristers excluding instrument players (kept solely in database)
  const activeSingers = useMemo(
    () => choristers.filter((c) => c.role !== 'Instrument Player'),
    [choristers]
  );

  // Identify choristers who are specifically relevant to current mass
  const relevantChoristers = useMemo(() => {
    return activeSingers.filter((c) => isChoristerRelevantToMass(c, selectedMassKey));
  }, [activeSingers, selectedMassKey]);

  // Find existing session for current mass & selected date (or create an in-memory active working record)
  const existingSessionForDate = useMemo(() => {
    return (allPractices || []).find((p) => {
      const matchDate = p.date === selectedMassDate;
      const matchTitle = p.eventTitle === currentConfig.name || 
        p.eventTitle === currentConfig.name.replace(' (English)', '').replace(' (Vigil)', '').replace(' (Main)', '') ||
        (p.sessionType === 'mass' && p.eventTitle?.toLowerCase().includes(currentConfig.day.toLowerCase()) && p.startTime?.toLowerCase().includes(currentConfig.time.toLowerCase().split(' ')[0]));
      return matchDate && matchTitle;
    });
  }, [allPractices, selectedMassDate, currentConfig]);

  // All recorded sessions for this specific Mass
  const massRecordedSessions = useMemo(() => {
    return (allPractices || []).filter((p) => {
      return p.eventTitle === currentConfig.name || 
        (p.sessionType === 'mass' && p.eventTitle?.toLowerCase().includes(currentConfig.day.toLowerCase()));
    }).sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [allPractices, currentConfig]);

  // In-memory attendance records for the selected date
  const [massAttendanceRecords, setMassAttendanceRecords] = useState<PracticeAttendanceRecord[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Quick Copy Feedback State
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  const handleCopyMassAttendance = async (sessionToCopy: PracticeSession, type: 'present' | 'absent') => {
    const key = `${sessionToCopy.id}-${type}`;
    const res = await copyAttendanceListToClipboard(sessionToCopy, choristers, type);
    if (res.success) {
      setCopiedKey(key);
      const typeLabel = type === 'present' ? 'Present' : 'Absent';
      setCopyToast(`Copied ${res.count} ${typeLabel.toLowerCase()} members to clipboard`);
      setTimeout(() => setCopiedKey(null), 2500);
      setTimeout(() => setCopyToast(null), 3500);
    }
  };

  // Sync attendance records when selected date, session, or mass changes
  useEffect(() => {
    if (existingSessionForDate && existingSessionForDate.attendance && existingSessionForDate.attendance.length > 0) {
      const existingMap = new Map(existingSessionForDate.attendance.map((a) => [a.choristerId, a]));
      const merged: PracticeAttendanceRecord[] = activeSingers.map((c) => {
        const found = existingMap.get(c.id);
        if (found) return found;
        return {
          choristerId: c.id,
          choristerName: c.name,
          role: c.role,
          status: 'Absent' as AttendanceStatus,
          notes: '',
        };
      });
      setMassAttendanceRecords(merged);
      setIsDirty(false);
    } else {
      // New / Unrecorded date: initialize records.
      // User request: When starting collecting attendance, start everyone as Absent
      const initial: PracticeAttendanceRecord[] = activeSingers.map((c) => {
        return {
          choristerId: c.id,
          choristerName: c.name,
          role: c.role,
          status: 'Absent' as AttendanceStatus,
          notes: '',
        };
      });
      setMassAttendanceRecords(initial);
      setIsDirty(false);
    }
  }, [selectedMassDate, selectedMassKey, existingSessionForDate, activeSingers]);

  // Handle setting status for a single chorister
  const handleSetChoristerStatus = (choristerId: string, status: AttendanceStatus) => {
    setMassAttendanceRecords((prev) =>
      prev.map((r) => (r.choristerId === choristerId ? { ...r, status } : r))
    );
    setIsDirty(true);
  };

  // Handle setting note for a single chorister
  const handleSetChoristerNote = (choristerId: string, notes: string) => {
    setMassAttendanceRecords((prev) =>
      prev.map((r) => (r.choristerId === choristerId ? { ...r, notes } : r))
    );
    setIsDirty(true);
  };

  // Batch actions
  const handleMarkAllRelevant = (status: AttendanceStatus) => {
    const relevantIds = new Set(relevantChoristers.map((c) => c.id));
    setMassAttendanceRecords((prev) =>
      prev.map((r) => (relevantIds.has(r.choristerId) ? { ...r, status } : r))
    );
    setIsDirty(true);
    setSaveToast(`Marked all ${relevantChoristers.length} relevant choristers as ${status}`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setMassAttendanceRecords((prev) => prev.map((r) => ({ ...r, status })));
    setIsDirty(true);
    setSaveToast(`Marked all ${activeSingers.length} choristers as ${status}`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Save current attendance sheet
  const handleSaveMassAttendance = async () => {
    if (!onSavePractices) return;
    setIsSaving(true);

    try {
      const now = new Date();
      const formattedDate = now.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const presentCount = massAttendanceRecords.filter((r) => r.status === 'Present').length;
      const totalCount = massAttendanceRecords.length;

      const logEntry: AttendanceChangeLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: now.toISOString(),
        formattedDate,
        editorName: activeMember.name,
        editorRole: activeMember.role,
        caption: massAttendanceCaption.trim() || `Mass attendance on ${selectedMassDate}`,
        actionType: existingSessionForDate ? 'Updated' : 'Created',
        summary: `Saved attendance for ${currentConfig.name} on ${selectedMassDate} (${presentCount}/${totalCount} Present)`,
      };

      let updatedPractices: PracticeSession[];

      if (existingSessionForDate) {
        const updatedSession: PracticeSession = {
          ...existingSessionForDate,
          attendance: massAttendanceRecords,
          sessionType: 'mass',
          changeLog: [logEntry, ...(existingSessionForDate.changeLog || [])],
          lastModifiedBy: `${activeMember.name} (${activeMember.role})`,
          lastModifiedAt: formattedDate,
          lastChangeCaption: massAttendanceCaption.trim() || existingSessionForDate.lastChangeCaption,
        };
        updatedPractices = (allPractices || []).map((p) =>
          p.id === existingSessionForDate.id ? updatedSession : p
        );
      } else {
        const newSession: PracticeSession = {
          id: `mass-att-${Date.now()}`,
          date: selectedMassDate,
          startTime: currentConfig.time,
          venue: "St. Michael's Church Choir Loft",
          focus: `${currentConfig.name} Attendance`,
          eventTitle: currentConfig.name,
          sessionType: 'mass',
          notes: massAttendanceCaption.trim() || `Mass Attendance Session for ${currentConfig.name}`,
          changeLog: [logEntry],
          lastModifiedBy: `${activeMember.name} (${activeMember.role})`,
          lastModifiedAt: formattedDate,
          attendance: massAttendanceRecords,
        };
        updatedPractices = [newSession, ...(allPractices || [])];
      }

      await onSavePractices(
        updatedPractices,
        `Recorded ${currentConfig.name} mass attendance on ${selectedMassDate} (${presentCount}/${totalCount} Present)`
      );

      setIsDirty(false);
      setMassAttendanceCaption('');
      setSaveToast(`Attendance for ${currentConfig.name} on ${selectedMassDate} saved successfully!`);
      setTimeout(() => setSaveToast(null), 4000);
    } catch (err) {
      console.error('Failed to save mass attendance:', err);
      setSaveToast('Failed to save attendance. Please try again.');
      setTimeout(() => setSaveToast(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete a mass attendance session
  const handleDeleteSession = async (sessionId: string) => {
    if (!onSavePractices) return;
    if (window.confirm('Are you sure you want to delete this recorded attendance session?')) {
      const updated = (allPractices || []).filter((p) => p.id !== sessionId);
      if (onDeletePractice) {
        await onDeletePractice(sessionId);
      } else {
        await onSavePractices(updated, 'Deleted mass attendance session');
      }
      setSaveToast('Attendance session deleted');
      setTimeout(() => setSaveToast(null), 3000);
    }
  };

  // Compute live statistics for current working records
  const stats = useMemo(() => {
    const present = massAttendanceRecords.filter((r) => r.status === 'Present').length;
    const absent = massAttendanceRecords.filter((r) => r.status === 'Absent').length;
    const late = massAttendanceRecords.filter((r) => r.status === 'Late').length;
    const excused = massAttendanceRecords.filter((r) => r.status === 'Excused').length;
    const total = massAttendanceRecords.length || activeSingers.length;

    const relevantIds = new Set(relevantChoristers.map((c) => c.id));
    const relevantPresent = massAttendanceRecords.filter(
      (r) => relevantIds.has(r.choristerId) && r.status === 'Present'
    ).length;
    const relevantTotal = relevantChoristers.length;
    const relevantRate = relevantTotal > 0 ? Math.round((relevantPresent / relevantTotal) * 100) : 0;
    const overallRate = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      present,
      absent,
      late,
      excused,
      total,
      relevantPresent,
      relevantTotal,
      relevantRate,
      overallRate,
    };
  }, [massAttendanceRecords, relevantChoristers, activeSingers]);

  // Filter choristers for the easy workplace view
  const availableLetters = useMemo(() => {
    const set = new Set<string>();
    activeSingers.forEach((c) => {
      const char = (c.name || '').trim().charAt(0).toUpperCase();
      if (char >= 'A' && char <= 'Z') set.add(char);
    });
    return set;
  }, [activeSingers]);

  const filteredChoristerRows = useMemo(() => {
    const recordMap = new Map<string, PracticeAttendanceRecord>(
      massAttendanceRecords.map((r) => [r.choristerId, r])
    );
    const relevantSet = new Set(relevantChoristers.map((c) => c.id));

    return activeSingers.filter((c) => {
      const record = recordMap.get(c.id);
      const status = record?.status || 'Absent';
      const isRel = relevantSet.has(c.id);

      // Filter by Tab (Relevant vs All vs Status)
      if (activeRosterFilter === 'relevant' && !isRel) return false;
      if (activeRosterFilter === 'Present' && status !== 'Present') return false;
      if (activeRosterFilter === 'Absent' && status !== 'Absent') return false;
      if (activeRosterFilter === 'Late' && status !== 'Late') return false;
      if (activeRosterFilter === 'Excused' && status !== 'Excused') return false;

      // Filter by Letter
      if (selectedLetter !== 'ALL') {
        const firstLetter = (c.name || '').trim().charAt(0).toUpperCase();
        if (firstLetter !== selectedLetter) return false;
      }

      // Filter by Search
      if (rosterSearch.trim()) {
        const q = rosterSearch.toLowerCase();
        const matchName = (c.name || '').toLowerCase().includes(q);
        const matchFullName = (c.fullName || '').toLowerCase().includes(q);
        const matchPhone = (c.phoneNumber || '').toLowerCase().includes(q);
        const matchNote = (record?.notes || '').toLowerCase().includes(q);
        const matchRole = (c.role || '').toLowerCase().includes(q);
        const matchPref = (c.weeklyMassPreference || '').toLowerCase().includes(q) || (c.sundayMassPreference || '').toLowerCase().includes(q);
        if (!matchName && !matchFullName && !matchPhone && !matchNote && !matchRole && !matchPref) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      // Sort relevant choristers first when viewing all
      const aRel = relevantSet.has(a.id) ? 0 : 1;
      const bRel = relevantSet.has(b.id) ? 0 : 1;
      if (aRel !== bRel) return aRel - bRel;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [activeSingers, massAttendanceRecords, relevantChoristers, activeRosterFilter, selectedLetter, rosterSearch]);

  const handleSaveWork = async (updatedWork: WorkAndBudget) => {
    await onUpdateWeeklyMass(currentConfig.serviceKey, updatedWork, currentConfig.subKey);
  };

  // WhatsApp Broadcast Modals state
  const [isTuesdayWhatsAppModalOpen, setIsTuesdayWhatsAppModalOpen] = useState(false);
  const [isThursdayWhatsAppModalOpen, setIsThursdayWhatsAppModalOpen] = useState(false);
  const [isFirstFridayWhatsAppModalOpen, setIsFirstFridayWhatsAppModalOpen] = useState(false);
  const [isSaturdayEnglishWhatsAppModalOpen, setIsSaturdayEnglishWhatsAppModalOpen] = useState(false);
  const [isSundayWhatsAppModalOpen, setIsSundayWhatsAppModalOpen] = useState(false);
  const [quickCopied, setQuickCopied] = useState(false);

  // Auto-popup trigger according to day
  const hasAutoPoppedRef = useRef(false);
  useEffect(() => {
    if (hasAutoPoppedRef.current) return;
    if (isTodayTuesday) {
      hasAutoPoppedRef.current = true;
      setSelectedMassKey('tuesday');
    } else if (isTodayThursday) {
      hasAutoPoppedRef.current = true;
      setSelectedMassKey('thursday');
    } else if (isTodayFirstFriday) {
      hasAutoPoppedRef.current = true;
      setSelectedMassKey('firstFriday');
    } else if (isTodaySaturday && currentHour < 12) {
      hasAutoPoppedRef.current = true;
      setSelectedMassKey('saturdayEnglish');
    } else if (isTodaySundayMassDay) {
      hasAutoPoppedRef.current = true;
      setSelectedMassKey(isTodaySaturday ? 'saturdayVigil' : 'sundayMain');
    }
  }, [isTodayTuesday, isTodayThursday, isTodayFirstFriday, isTodaySundayMassDay, isTodaySaturday, currentHour]);

  // Tuesday Mass particulars
  const tuesdayOrganist = 
    tuesdayService.workAndBudget.organist ||
    tuesdayService.workAndBudget.tasks.find((t) => t.duty === 'Organist')?.assignedTo ||
    '';

  const findTuesdayHymn = (categories: string[]): string => {
    const hymn = tuesdayService.workAndBudget.hymns.find((h) => categories.includes(h.category));
    if (!hymn) return '';
    return hymn.hymnNumber ? `${hymn.title} (No. ${hymn.hymnNumber})` : hymn.title;
  };

  const tuesdayEntrance = findTuesdayHymn(['Entrance']);
  const tuesdayOffertory = findTuesdayHymn(['Offertory']);
  const tuesdayCommunion = findTuesdayHymn(['Communion']);
  const tuesdayFinal = findTuesdayHymn(['Recessional', 'Post-Communion']);

  const getTuesdayText = () => {
    return buildTuesdayWhatsAppText({
      organist: tuesdayOrganist,
      entranceHymn: tuesdayEntrance,
      offertoryHymn: tuesdayOffertory,
      communionHymn: tuesdayCommunion,
      finalHymn: tuesdayFinal,
    });
  };

  const handleQuickCopyTuesday = async () => {
    const text = getTuesdayText();
    const success = await copyTextToClipboard(text);
    if (success) {
      setQuickCopied(true);
      setTimeout(() => setQuickCopied(false), 3000);
    }
  };

  const handleQuickSendTuesday = () => {
    const text = getTuesdayText();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // Thursday Novena particulars
  const thursdayOrganist = 
    thursdayService.workAndBudget.organist ||
    thursdayService.workAndBudget.tasks.find((t) => t.duty === 'Organist')?.assignedTo ||
    'SHEVIN';

  const findThursdayHymn = (categories: string[]): string => {
    const hymn = thursdayService.workAndBudget.hymns.find((h) => categories.includes(h.category));
    if (!hymn) return '';
    return hymn.hymnNumber ? `${hymn.title} ${hymn.hymnNumber}` : hymn.title;
  };

  const thursdayEntrance = findThursdayHymn(['Entrance']) || 'දුතාග්‍රයාණෙනි  02';
  const thursdayOffertory = findThursdayHymn(['Offertory']) || 'ලබා ඔබේ ඇරයුම් 132';
  const thursdayCommunion = findThursdayHymn(['Communion']) || 'සමගි දහම 197';
  const thursdayFinal = findThursdayHymn(['Recessional', 'Post-Communion']) || 'දෙව් දූතයන්ගෙ සැමා 07';

  const getThursdayText = () => {
    return buildThursdayWhatsAppText({
      organist: thursdayOrganist,
      entranceHymn: thursdayEntrance,
      offertoryHymn: thursdayOffertory,
      communionHymn: thursdayCommunion,
      finalHymn: thursdayFinal,
    });
  };

  const handleQuickCopyThursday = async () => {
    const text = getThursdayText();
    const success = await copyTextToClipboard(text);
    if (success) {
      setQuickCopied(true);
      setTimeout(() => setQuickCopied(false), 3000);
    }
  };

  const handleQuickSendThursday = () => {
    const text = getThursdayText();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // First Friday particulars
  const firstFridayOrganist = 
    firstFridayService.workAndBudget.organist ||
    firstFridayService.workAndBudget.tasks.find((t) => t.duty === 'Organist')?.assignedTo ||
    'CHAMATHKA';

  const findFirstFridayHymn = (categories: string[]): string => {
    const hymn = firstFridayService.workAndBudget.hymns.find((h) => categories.includes(h.category));
    if (!hymn) return '';
    return hymn.hymnNumber ? `${hymn.title} ${hymn.hymnNumber}` : hymn.title;
  };

  const firstFridayEntrance = findFirstFridayHymn(['Entrance']) || 'මගේ ජීවිතේ 110';
  const firstFridayOffertory = findFirstFridayHymn(['Offertory']) || 'පුදමි මගේ 163';
  const firstFridayCommunion = findFirstFridayHymn(['Communion']) || 'මා ආදර සමිඳුනි 267';
  const firstFridayFinal = findFirstFridayHymn(['Recessional', 'Post-Communion']) || 'දෙව් මව්නි ප්‍රේම 81';

  const getFirstFridayText = () => {
    return buildFirstFridayWhatsAppText({
      organist: firstFridayOrganist,
      entranceHymn: firstFridayEntrance,
      offertoryHymn: firstFridayOffertory,
      communionHymn: firstFridayCommunion,
      finalHymn: firstFridayFinal,
    });
  };

  const handleQuickCopyFirstFriday = async () => {
    const text = getFirstFridayText();
    const success = await copyTextToClipboard(text);
    if (success) {
      setQuickCopied(true);
      setTimeout(() => setQuickCopied(false), 3000);
    }
  };

  const handleQuickSendFirstFriday = () => {
    const text = getFirstFridayText();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // Saturday English particulars
  const satEnglishOrganist =
    saturdayEnglishService.workAndBudget.organist ||
    saturdayEnglishService.workAndBudget.tasks.find((t) => t.duty === 'Organist')?.assignedTo ||
    'SHAVEEN / SHEVON';

  const satEnglishReading =
    saturdayEnglishService.workAndBudget.tasks.find((t) => t.duty === 'Reading')?.assignedTo ||
    '';

  const findSatEnglishHymn = (categories: string[]): string => {
    const hymn = saturdayEnglishService.workAndBudget.hymns.find((h) => categories.includes(h.category));
    if (!hymn) return '';
    return hymn.hymnNumber ? `${hymn.title} (No. ${hymn.hymnNumber})` : hymn.title;
  };

  const satEnglishEntrance = findSatEnglishHymn(['Entrance']) || 'Praise to the Lord the Almighty';
  const satEnglishOffertory = findSatEnglishHymn(['Offertory']) || 'Take and Sanctify';
  const satEnglishCommunion = findSatEnglishHymn(['Communion']) || 'I Am the Bread of Life';
  const satEnglishFinal = findSatEnglishHymn(['Recessional', 'Post-Communion']) || 'Sing to the Mountains';

  const getSaturdayEnglishText = () => {
    return buildSaturdayEnglishWhatsAppText({
      organist: satEnglishOrganist,
      reading: satEnglishReading,
      entranceHymn: satEnglishEntrance,
      offertoryHymn: satEnglishOffertory,
      communionHymn: satEnglishCommunion,
      finalHymn: satEnglishFinal,
    });
  };

  const handleQuickCopySaturdayEnglish = async () => {
    const text = getSaturdayEnglishText();
    const success = await copyTextToClipboard(text);
    if (success) {
      setQuickCopied(true);
      setTimeout(() => setQuickCopied(false), 3000);
    }
  };

  const handleQuickSendSaturdayEnglish = () => {
    const text = getSaturdayEnglishText();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  // Sunday Masses particulars
  const sundayOrdinaryNumber =
    satService.workAndBudget.sundayOrdinaryNumber ||
    sunEarlyService.workAndBudget.sundayOrdinaryNumber ||
    sunMainService.workAndBudget.sundayOrdinaryNumber ||
    '15';

  const satOrganist =
    satService.workAndBudget.organist ||
    satService.workAndBudget.tasks.find((t) => t.duty === 'Organist')?.assignedTo ||
    'SHEVON S./CHAMATHKA';
  const satPsalm =
    satService.workAndBudget.psalmPerson ||
    satService.workAndBudget.tasks.find((t) => t.duty === 'Soloist' || t.duty === 'Cantor')?.assignedTo ||
    'SAHELI';
  const satAcclamation =
    satService.workAndBudget.acclamationPerson ||
    satService.workAndBudget.tasks.find((t) => t.duty === 'Cantor')?.assignedTo ||
    'ROSHEEN';

  const sunEarlyOrganist =
    sunEarlyService.workAndBudget.organist ||
    sunEarlyService.workAndBudget.tasks.find((t) => t.duty === 'Organist')?.assignedTo ||
    'DINOLI';
  const sunEarlyPsalm =
    sunEarlyService.workAndBudget.psalmPerson ||
    sunEarlyService.workAndBudget.tasks.find((t) => t.duty === 'Soloist' || t.duty === 'Cantor')?.assignedTo ||
    'NIPUNI';
  const sunEarlyAcclamation =
    sunEarlyService.workAndBudget.acclamationPerson ||
    sunEarlyService.workAndBudget.tasks.find((t) => t.duty === 'Cantor')?.assignedTo ||
    'STEPHANI F.';

  const sunMainOrganist =
    sunMainService.workAndBudget.organist ||
    sunMainService.workAndBudget.tasks.find((t) => t.duty === 'Organist')?.assignedTo ||
    'SHEVIN';
  const sunMainPsalm =
    sunMainService.workAndBudget.psalmPerson ||
    sunMainService.workAndBudget.tasks.find((t) => t.duty === 'Soloist' || t.duty === 'Cantor')?.assignedTo ||
    'SHAVEEN S.';
  const sunMainAcclamation =
    sunMainService.workAndBudget.acclamationPerson ||
    sunMainService.workAndBudget.tasks.find((t) => t.duty === 'Cantor')?.assignedTo ||
    'ABHILASH P.';

  const findSundayHymn = (categories: string[]): string => {
    const list = [
      ...satService.workAndBudget.hymns,
      ...sunEarlyService.workAndBudget.hymns,
      ...sunMainService.workAndBudget.hymns,
    ];
    const hymn = list.find((h) => categories.includes(h.category));
    if (!hymn) return '';
    return hymn.hymnNumber ? `${hymn.title} ${hymn.hymnNumber}` : hymn.title;
  };

  const sundayEntrance = findSundayHymn(['Entrance']) || '';
  const sundayOffertory = findSundayHymn(['Offertory']) || '';
  const allCommunionHymns = [
    ...satService.workAndBudget.hymns,
    ...sunEarlyService.workAndBudget.hymns,
    ...sunMainService.workAndBudget.hymns,
  ].filter((h) => h.category === 'Communion');
  const sundayCommunion1 = allCommunionHymns[0]
    ? `${allCommunionHymns[0].title} ${allCommunionHymns[0].hymnNumber || ''}`.trim()
    : '';
  const secondCommunionHymn = allCommunionHymns[1]
    ? `${allCommunionHymns[1].title} ${allCommunionHymns[1].hymnNumber || ''}`.trim()
    : '';
  const sundayFinal = findSundayHymn(['Recessional', 'Post-Communion']) || '';

  const getSundayText = () => {
    return buildSundayWhatsAppText({
      sundayNumber: sundayOrdinaryNumber,
      satOrganist,
      satPsalm,
      satAcclamation,
      sunEarlyOrganist,
      sunEarlyPsalm,
      sunEarlyAcclamation,
      sunMainOrganist,
      sunMainPsalm,
      sunMainAcclamation,
      entranceHymn: sundayEntrance,
      offertoryHymn: sundayOffertory,
      communionHymn1: sundayCommunion1,
      communionHymn2: secondCommunionHymn,
      finalHymn: sundayFinal,
    });
  };

  const handleQuickCopySunday = async () => {
    const text = getSundayText();
    const success = await copyTextToClipboard(text);
    if (success) {
      setQuickCopied(true);
      setTimeout(() => setQuickCopied(false), 3000);
    }
  };

  const handleQuickSendSunday = () => {
    const text = getSundayText();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  const isSundayMassSelected = 
    selectedMassKey === 'saturdayVigil' || 
    selectedMassKey === 'sundayEarly' || 
    selectedMassKey === 'sundayMain';

  const handleSaveSundayMasses = async (updates: {
    sundayOrdinaryNumber: string;
    saturdayVigil: {
      organist: string;
      psalmPerson: string;
      acclamationPerson: string;
      hymns: any[];
    };
    sundayEarly: {
      organist: string;
      psalmPerson: string;
      acclamationPerson: string;
      hymns: any[];
    };
    sundayMain: {
      organist: string;
      psalmPerson: string;
      acclamationPerson: string;
      hymns: any[];
    };
  }) => {
    await onUpdateWeeklyMass('sundayMasses', {
      ...satService.workAndBudget,
      sundayOrdinaryNumber: updates.sundayOrdinaryNumber,
      organist: updates.saturdayVigil.organist,
      psalmPerson: updates.saturdayVigil.psalmPerson,
      acclamationPerson: updates.saturdayVigil.acclamationPerson,
      hymns: updates.saturdayVigil.hymns,
    }, 'saturdayVigil');

    await onUpdateWeeklyMass('sundayMasses', {
      ...sunEarlyService.workAndBudget,
      sundayOrdinaryNumber: updates.sundayOrdinaryNumber,
      organist: updates.sundayEarly.organist,
      psalmPerson: updates.sundayEarly.psalmPerson,
      acclamationPerson: updates.sundayEarly.acclamationPerson,
      hymns: updates.sundayEarly.hymns,
    }, 'sundayEarly');

    await onUpdateWeeklyMass('sundayMasses', {
      ...sunMainService.workAndBudget,
      sundayOrdinaryNumber: updates.sundayOrdinaryNumber,
      organist: updates.sundayMain.organist,
      psalmPerson: updates.sundayMain.psalmPerson,
      acclamationPerson: updates.sundayMain.acclamationPerson,
      hymns: updates.sundayMain.hymns,
    }, 'sundayMain');
  };

  const handleSaveTuesdayWork = async (updatedWork: WorkAndBudget) => {
    await onUpdateWeeklyMass('tuesday', updatedWork);
  };

  const handleSaveThursdayWork = async (updatedWork: WorkAndBudget) => {
    await onUpdateWeeklyMass('thursday', updatedWork);
  };

  const handleSaveFirstFridayWork = async (updatedWork: WorkAndBudget) => {
    await onUpdateWeeklyMass('firstFriday', updatedWork);
  };

  const handleSaveSaturdayEnglishWork = async (updatedWork: WorkAndBudget) => {
    await onUpdateWeeklyMass('saturdayEnglish', updatedWork);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-500 text-neutral-950 font-bold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs animate-in slide-in-from-top-2 border border-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#141414] via-[#1B1925] to-[#141414] text-white rounded-3xl p-5 sm:p-6 border border-[#262626] shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Liturgical Rota
              </span>
              <span className="text-xs text-neutral-400">Parish Schedule</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Weekly Masses
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl">
              Easy attendance workspace, relevant persons rosters, and WhatsApp broadcast templates for all 7 Parish Masses.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {isTodayTuesday ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Today: Tuesday Holy Mass</span>
              </div>
            ) : isTodayThursday ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Today: Thursday - Novena And Holy Mass</span>
              </div>
            ) : isTodayFirstFriday ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                <span>Today: First Friday Holy Mass</span>
              </div>
            ) : isTodaySaturday ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                <span>Today: Saturday Sunday Mass 6</span>
              </div>
            ) : isTodaySunday ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Today: Sunday Morning Mass 6.30 & 8</span>
              </div>
            ) : (
              <div className="text-xs text-neutral-400">
                Current Date: <strong className="text-neutral-200">{todayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</strong>
              </div>
            )}

            {/* Automated Mass Attendance Notifications for Committee Members (Restricted to Lead Joshua Only) */}
            {isLeadJoshua && onOpenNotificationModal && (
              <button
                type="button"
                onClick={onOpenNotificationModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-sm"
                title="Mass Attendance Reminders (Lead Joshua Only)"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Mass Attendance Reminders</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 7 Parish Mass Selectors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {massOptions.map((opt) => {
          const isSelected = selectedMassKey === opt.key;
          const Icon = opt.icon;
          const relCount = choristers.filter((c) => isChoristerRelevantToMass(c, opt.key)).length;

          return (
            <button
              key={opt.key}
              type="button"
              id={`mass-btn-${opt.key}`}
              onClick={() => setSelectedMassKey(opt.key)}
              className={`p-3 rounded-2xl text-left border transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#1C1A27] border-amber-400/80 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                  : 'bg-[#141414] hover:bg-[#181818] border-[#262626] text-neutral-400'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`p-1.5 rounded-xl ${isSelected ? 'bg-amber-400/20 text-amber-300' : 'bg-[#202020] text-neutral-400'}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#1F1F1F] text-neutral-300 border border-[#2B2B2B]">
                    {opt.time}
                  </span>
                </div>
                <div className={`text-xs font-bold truncate ${isSelected ? 'text-white font-black' : 'text-neutral-300'}`}>
                  {opt.name}
                </div>
              </div>

              <div className="text-[10px] text-neutral-400 mt-2 pt-1.5 border-t border-[#222222] flex items-center justify-between">
                <span className="text-amber-300/80 font-semibold">{relCount} Relevant</span>
                {isSelected && <span className="text-emerald-400 font-bold">Active</span>}
              </div>
            </button>
          );
        })}
      </div>

      {/* WhatsApp Broadcast Template Banners */}
      {selectedMassKey === 'tuesday' && (
        <div className="bg-gradient-to-r from-[#0C1A14] via-[#10241C] to-[#0C1A14] rounded-2xl p-4 sm:p-5 border border-emerald-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Share2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/25 text-emerald-300 border border-emerald-500/40">
                  WhatsApp Liturgy Roster
                </span>
                <span className="text-xs text-neutral-400">{currentConfig.sinhalaName}</span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-white mt-0.5">
                Tuesday Mass WhatsApp Broadcast Template
              </h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-300 mt-1">
                <span className="flex items-center gap-1.5">
                  <Piano className="w-3 h-3 text-amber-400" />
                  Organist: <strong className="text-amber-400">{tuesdayOrganist || '(Unassigned)'}</strong>
                </span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-400">
                  Hymns: 
                  <span className={tuesdayEntrance ? 'text-emerald-300 ml-1 font-semibold' : 'text-neutral-500 ml-1'}>E {tuesdayEntrance ? '✓' : '—'}</span>, 
                  <span className={tuesdayOffertory ? 'text-emerald-300 ml-1 font-semibold' : 'text-neutral-500 ml-1'}>O {tuesdayOffertory ? '✓' : '—'}</span>, 
                  <span className={tuesdayCommunion ? 'text-emerald-300 ml-1 font-semibold' : 'text-neutral-500 ml-1'}>C {tuesdayCommunion ? '✓' : '—'}</span>, 
                  <span className={tuesdayFinal ? 'text-emerald-300 ml-1 font-semibold' : 'text-neutral-500 ml-1'}>F {tuesdayFinal ? '✓' : '—'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              id="quick-copy-tuesday-whatsapp-btn"
              onClick={handleQuickCopyTuesday}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                quickCopied
                  ? 'bg-emerald-500 text-neutral-950 font-black'
                  : 'bg-[#182C22] hover:bg-[#1E372B] text-emerald-300 border border-emerald-500/40'
              }`}
              title="Copy WhatsApp Message to Clipboard"
            >
              {quickCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{quickCopied ? 'Copied Message!' : 'Copy Template'}</span>
            </button>

            <button
              type="button"
              id="quick-send-tuesday-whatsapp-btn"
              onClick={handleQuickSendTuesday}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30"
              title="Open directly in WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to WhatsApp</span>
            </button>

            <button
              type="button"
              id="open-tuesday-whatsapp-modal-btn"
              onClick={() => setIsTuesdayWhatsAppModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#161616] hover:bg-[#222222] text-neutral-200 border border-[#303030] transition-colors"
            >
              <span>Customise & Enter Hymns</span>
            </button>
          </div>
        </div>
      )}

      {selectedMassKey === 'thursday' && (
        <div className="bg-gradient-to-r from-[#1A1408] via-[#241A0B] to-[#1A1408] rounded-2xl p-4 sm:p-5 border border-amber-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Share2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/25 text-amber-300 border border-amber-500/40">
                  WhatsApp Liturgy Roster
                </span>
                <span className="text-xs text-neutral-400">{currentConfig.sinhalaName}</span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-white mt-0.5">
                St. Michael Novena WhatsApp Broadcast Template
              </h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-300 mt-1">
                <span className="flex items-center gap-1.5">
                  <Piano className="w-3 h-3 text-amber-400" />
                  Organist: <strong className="text-amber-400">{thursdayOrganist || 'SHEVIN'}</strong>
                </span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-400">
                  Hymns: 
                  <span className="text-amber-300 ml-1 font-semibold">E: {thursdayEntrance}</span>, 
                  <span className="text-amber-300 ml-1 font-semibold">O: {thursdayOffertory}</span>, 
                  <span className="text-amber-300 ml-1 font-semibold">C: {thursdayCommunion}</span>, 
                  <span className="text-amber-300 ml-1 font-semibold">F: {thursdayFinal}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              id="quick-copy-thursday-whatsapp-btn"
              onClick={handleQuickCopyThursday}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                quickCopied
                  ? 'bg-amber-500 text-neutral-950 font-black'
                  : 'bg-[#2E2010] hover:bg-[#3B2915] text-amber-300 border border-amber-500/40'
              }`}
              title="Copy WhatsApp Message to Clipboard"
            >
              {quickCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-amber-400" />}
              <span>{quickCopied ? 'Copied Message!' : 'Copy Template'}</span>
            </button>

            <button
              type="button"
              id="quick-send-thursday-whatsapp-btn"
              onClick={handleQuickSendThursday}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30"
              title="Open directly in WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to WhatsApp</span>
            </button>

            <button
              type="button"
              id="open-thursday-whatsapp-modal-btn"
              onClick={() => setIsThursdayWhatsAppModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#161616] hover:bg-[#222222] text-neutral-200 border border-[#303030] transition-colors"
            >
              <span>Customise & Enter Hymns</span>
            </button>
          </div>
        </div>
      )}

      {selectedMassKey === 'firstFriday' && (
        <div className="bg-gradient-to-r from-[#1A0A10] via-[#240D18] to-[#1A0A10] rounded-2xl p-4 sm:p-5 border border-rose-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Share2 className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/25 text-rose-300 border border-rose-500/40">
                  First Friday WhatsApp Roster
                </span>
                <span className="text-xs text-neutral-400">{currentConfig.sinhalaName} • අද සවස 5.45ට</span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-white mt-0.5">
                First Friday Adoration & Mass Broadcast Template
              </h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-300 mt-1">
                <span className="flex items-center gap-1.5">
                  <Piano className="w-3 h-3 text-rose-400" />
                  Organist: <strong className="text-rose-400">{firstFridayOrganist || 'CHAMATHKA'}</strong>
                </span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-400">
                  Benediction: <span className="text-amber-300 font-semibold">357, 355, 353</span>
                </span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-400">
                  Mass: 
                  <span className="text-rose-300 ml-1 font-semibold">E: {firstFridayEntrance}</span>, 
                  <span className="text-rose-300 ml-1 font-semibold">O: {firstFridayOffertory}</span>, 
                  <span className="text-rose-300 ml-1 font-semibold">C: {firstFridayCommunion}</span>, 
                  <span className="text-rose-300 ml-1 font-semibold">F: {firstFridayFinal}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              id="quick-copy-firstfriday-whatsapp-btn"
              onClick={handleQuickCopyFirstFriday}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                quickCopied
                  ? 'bg-rose-500 text-neutral-950 font-black'
                  : 'bg-[#2E121F] hover:bg-[#3D1829] text-rose-300 border border-rose-500/40'
              }`}
              title="Copy WhatsApp Message to Clipboard"
            >
              {quickCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-rose-400" />}
              <span>{quickCopied ? 'Copied Message!' : 'Copy Template'}</span>
            </button>

            <button
              type="button"
              id="quick-send-firstfriday-whatsapp-btn"
              onClick={handleQuickSendFirstFriday}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30"
              title="Open directly in WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to WhatsApp</span>
            </button>

            <button
              type="button"
              id="open-firstfriday-whatsapp-modal-btn"
              onClick={() => setIsFirstFridayWhatsAppModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#161616] hover:bg-[#222222] text-neutral-200 border border-[#303030] transition-colors"
            >
              <span>Customise & Enter Hymns</span>
            </button>
          </div>
        </div>
      )}

      {selectedMassKey === 'saturdayEnglish' && (
        <div className="bg-gradient-to-r from-[#0B1528] via-[#101E38] to-[#0B1528] rounded-2xl p-4 sm:p-5 border border-sky-500/30 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/40 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Share2 className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/25 text-sky-300 border border-sky-500/40">
                  WhatsApp English Liturgy Roster
                </span>
                <span className="text-xs text-neutral-400">✝️ SATURDAY ENGLISH MASS • 7.00 a.m.</span>
              </div>
              <h4 className="text-sm sm:text-base font-black text-white mt-0.5">
                Saturday English Mass WhatsApp Broadcast Template
              </h4>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-300 mt-1">
                <span className="flex items-center gap-1.5">
                  <Piano className="w-3 h-3 text-sky-400" />
                  Organist: <strong className="text-sky-300">{satEnglishOrganist}</strong>
                </span>
                <span className="text-neutral-500">•</span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-sky-400" />
                  Reading: <strong className="text-sky-300">{satEnglishReading || '(Unassigned)'}</strong>
                </span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-400">
                  Hymns: 
                  <span className="text-sky-300 ml-1 font-semibold">E: {satEnglishEntrance}</span>, 
                  <span className="text-sky-300 ml-1 font-semibold">O: {satEnglishOffertory}</span>, 
                  <span className="text-sky-300 ml-1 font-semibold">C: {satEnglishCommunion}</span>, 
                  <span className="text-sky-300 ml-1 font-semibold">F: {satEnglishFinal}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
            <button
              type="button"
              id="quick-copy-saturday-english-whatsapp-btn"
              onClick={handleQuickCopySaturdayEnglish}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                quickCopied
                  ? 'bg-sky-400 text-neutral-950 font-black'
                  : 'bg-[#122842] hover:bg-[#183457] text-sky-300 border border-sky-500/40'
              }`}
              title="Copy WhatsApp Message to Clipboard"
            >
              {quickCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
              <span>{quickCopied ? 'Copied Message!' : 'Copy Template'}</span>
            </button>

            <button
              type="button"
              id="quick-send-saturday-english-whatsapp-btn"
              onClick={handleQuickSendSaturdayEnglish}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30"
              title="Open directly in WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to WhatsApp</span>
            </button>

            <button
              type="button"
              id="open-saturday-english-whatsapp-modal-btn"
              onClick={() => setIsSaturdayEnglishWhatsAppModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#161616] hover:bg-[#222222] text-neutral-200 border border-[#303030] transition-colors"
            >
              <span>Customise & Enter Hymns</span>
            </button>
          </div>
        </div>
      )}

      {isSundayMassSelected && (
        <div className="bg-gradient-to-r from-[#121826] via-[#161f30] to-[#121826] rounded-2xl p-4 sm:p-5 border border-indigo-500/40 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Weekend Liturgy Roster
                </span>
                <span className="text-xs text-neutral-400">
                  🍀 සාමාන්‍ය සමයේ {sundayOrdinaryNumber}වන ඉරුදින
                </span>
              </div>
              <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                Sunday Masses WhatsApp Broadcast
              </h4>
              <p className="text-xs text-neutral-300 mt-1 max-w-2xl leading-relaxed">
                Saturday Sunday Mass 6 ({satOrganist}), Sunday Morning Mass 6.30 ({sunEarlyOrganist}), and Sunday Morning Mass 8 ({sunMainOrganist}).
                <span className="text-indigo-300 ml-1.5 font-medium">Hymns: E: {sundayEntrance} • O: {sundayOffertory} • C: {sundayCommunion1} • F: {sundayFinal}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto flex-shrink-0">
            <button
              type="button"
              id="quick-copy-sunday-whatsapp-btn"
              onClick={handleQuickCopySunday}
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                quickCopied
                  ? 'bg-indigo-500 text-white font-black'
                  : 'bg-[#1a2238] hover:bg-[#232f4d] text-indigo-200 border border-indigo-500/40'
              }`}
              title="Copy WhatsApp text"
            >
              {quickCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{quickCopied ? 'Copied Message!' : 'Copy Template'}</span>
            </button>

            <button
              type="button"
              id="quick-send-sunday-whatsapp-btn"
              onClick={handleQuickSendSunday}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30"
              title="Open directly in WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send to WhatsApp</span>
            </button>

            <button
              type="button"
              id="open-sunday-whatsapp-modal-btn"
              onClick={() => setIsSundayWhatsAppModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-[#161616] hover:bg-[#222222] text-neutral-200 border border-[#303030] transition-colors"
            >
              <span>Customise & Enter Hymns</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RELEVANT PERSONS MASS ATTENDANCE EASY WORKPLACE (REPLACES CLUTTERED TABLE) */}
      {/* ========================================================================= */}
      <div className="bg-[#121212] rounded-3xl p-4 sm:p-6 border border-[#222222] shadow-2xl space-y-5">
        {/* Workplace Header & Navigation Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#222222]">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ClipboardCheck className="w-5 h-5" />
              </span>
              <h3 className="font-black text-lg sm:text-xl text-white">
                {currentConfig.name} Attendance Workplace
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#1C1C1C] text-emerald-400 border border-emerald-500/30">
                {currentConfig.day} • {currentConfig.time}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Mark attendance specifically for choristers allocated to this mass. One-tap present/absent toggling and instant auto-save.
            </p>
          </div>

          {/* Sub-view Switcher: Mass Attendance Workplace (Default) vs Liturgical Hymns vs Budget */}
          <div className="flex items-center gap-1 bg-[#161616] p-1 rounded-2xl border border-[#262626] self-start lg:self-auto shrink-0">
            <button
              type="button"
              id="tab-mass-attendance"
              onClick={() => setActiveSubView('attendance')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubView === 'attendance'
                  ? 'bg-emerald-500 text-neutral-950 shadow-md font-black'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Mass Attendance</span>
              {stats.relevantTotal > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeSubView === 'attendance' ? 'bg-neutral-950/30 text-neutral-950 font-black' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {stats.relevantPresent}/{stats.relevantTotal}
                </span>
              )}
            </button>

            <button
              type="button"
              id="tab-mass-work"
              onClick={() => setActiveSubView('work')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubView === 'work'
                  ? 'bg-[#2A2A2A] text-white shadow-sm border border-[#3A3A3A]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5 text-amber-400" />
              <span>Hymns &amp; Duties</span>
            </button>

            <button
              type="button"
              id="tab-mass-budget"
              onClick={() => setActiveSubView('budget')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSubView === 'budget'
                  ? 'bg-[#2A2A2A] text-white shadow-sm border border-[#3A3A3A]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Budget (LKR)</span>
            </button>
          </div>
        </div>

        {activeSubView === 'attendance' ? (
          <div className="space-y-4">
            {/* Control Bar: Date Selector, Quick Actions, and Live Stats */}
            <div className="bg-[#171717] rounded-2xl p-4 border border-[#262626] space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Date Picker & Quick Date Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-[#101010] px-3 py-1.5 rounded-xl border border-[#2E2E2E]">
                    <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                    <label className="text-[11px] font-bold text-neutral-400">Date:</label>
                    <input
                      type="date"
                      value={selectedMassDate}
                      onChange={(e) => setSelectedMassDate(e.target.value)}
                      className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedMassDate(new Date().toISOString().split('T')[0])}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-[#202020] hover:bg-[#282828] text-neutral-300 border border-[#2E2E2E] transition-colors"
                  >
                    Today
                  </button>

                  {existingSessionForDate ? (
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>Existing Session Recorded</span>
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      <span>New Attendance Entry</span>
                    </span>
                  )}
                </div>

                {/* Batch Action Buttons & Save */}
                <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
                  <button
                    type="button"
                    id="mark-all-relevant-present-btn"
                    onClick={() => handleMarkAllRelevant('Present')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all shadow-sm"
                    title="Quickly mark all choristers allocated to this mass as Present"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Mark Relevant Present</span>
                  </button>

                  <button
                    type="button"
                    id="mark-all-present-btn"
                    onClick={() => handleMarkAll('Present')}
                    className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold bg-[#222222] hover:bg-[#2A2A2A] text-neutral-300 border border-[#333333] transition-colors"
                    title="Mark all 50+ choristers as Present"
                  >
                    <span>All Present</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMarkAll('Absent')}
                    className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold bg-[#222222] hover:bg-[#2A2A2A] text-neutral-400 hover:text-white border border-[#333333] transition-colors"
                    title="Reset all to Absent"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>

                  <button
                    type="button"
                    id="save-mass-attendance-btn"
                    onClick={handleSaveMassAttendance}
                    disabled={isSaving}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-lg transition-all ${
                      isDirty
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 ring-2 ring-emerald-400 animate-pulse'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : isDirty ? 'Save Changes' : 'Save Attendance'}</span>
                  </button>
                </div>
              </div>

              {/* Live Statistics Strip - Percentage based on people who committed to come */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 pt-2 border-t border-[#222222]">
                <div className="bg-[#121212] p-2.5 rounded-xl border border-amber-500/40 shadow-sm col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-amber-400 font-black uppercase tracking-wider flex items-center justify-between">
                    <span>Committed Rate</span>
                    <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300">Expected</span>
                  </div>
                  <div className="text-sm sm:text-base font-black text-amber-300 mt-0.5 flex items-center justify-between">
                    <span>{stats.relevantPresent}/{stats.relevantTotal}</span>
                    <span className="text-xs font-mono font-black px-1.5 py-0.5 rounded-lg bg-amber-500 text-neutral-950">
                      {stats.relevantRate}%
                    </span>
                  </div>
                </div>

                <div className="bg-[#121212] p-2.5 rounded-xl border border-emerald-500/30">
                  <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Present</div>
                  <div className="text-sm font-black text-emerald-300 mt-0.5 flex items-center justify-between">
                    <span>{stats.present} Members</span>
                    <span className="text-[10px] text-neutral-400 font-mono">({stats.present}/{stats.total})</span>
                  </div>
                </div>

                <div className="bg-[#121212] p-2.5 rounded-xl border border-[#222222]">
                  <div className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Absent</div>
                  <div className="text-sm font-black text-rose-300 mt-0.5">{stats.absent}</div>
                </div>

                <div className="bg-[#121212] p-2.5 rounded-xl border border-[#222222]">
                  <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Late</div>
                  <div className="text-sm font-black text-amber-300 mt-0.5">{stats.late}</div>
                </div>

                <div className="bg-[#121212] p-2.5 rounded-xl border border-[#222222]">
                  <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Excused</div>
                  <div className="text-sm font-black text-blue-300 mt-0.5">{stats.excused}</div>
                </div>

                <div className="bg-[#121212] p-2.5 rounded-xl border border-[#222222] flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Past Dates</div>
                    <div className="text-xs font-bold text-neutral-200 mt-0.5">{massRecordedSessions.length} recorded</div>
                  </div>
                  {massRecordedSessions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowHistoryDrawer(!showHistoryDrawer)}
                      className="p-1.5 rounded-lg bg-[#202020] hover:bg-[#282828] text-neutral-300 transition-colors"
                      title="View past attendance records"
                    >
                      <History className="w-4 h-4 text-purple-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Copy Present / Absent Buttons for Current Mass Date */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#222222] flex-wrap">
                <span className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <ClipboardCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Copy Attendance Lists:</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const tempSession: PracticeSession = {
                        id: existingSessionForDate?.id || `temp-${selectedMassKey}-${selectedMassDate}`,
                        date: selectedMassDate,
                        startTime: currentConfig.time,
                        venue: "St. Michael's Church",
                        sessionType: 'mass',
                        eventTitle: `${currentConfig.name} (${currentConfig.day})`,
                        focus: `${currentConfig.name} Holy Mass`,
                        notes: '',
                        attendance: massAttendanceRecords,
                      };
                      handleCopyMassAttendance(tempSession, 'present');
                    }}
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                      copiedKey?.endsWith('-present')
                        ? 'bg-emerald-500 text-neutral-950 border-emerald-400 font-black ring-2 ring-emerald-400/40'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                    title="Copy present list using their display short names"
                  >
                    {copiedKey?.endsWith('-present') ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-neutral-950 stroke-[3]" />
                        <span>Copied Present!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copy Present ({stats.present})</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const tempSession: PracticeSession = {
                        id: existingSessionForDate?.id || `temp-${selectedMassKey}-${selectedMassDate}`,
                        date: selectedMassDate,
                        startTime: currentConfig.time,
                        venue: "St. Michael's Church",
                        sessionType: 'mass',
                        eventTitle: `${currentConfig.name} (${currentConfig.day})`,
                        focus: `${currentConfig.name} Holy Mass`,
                        notes: '',
                        attendance: massAttendanceRecords,
                      };
                      handleCopyMassAttendance(tempSession, 'absent');
                    }}
                    className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl border text-xs font-bold transition-all shadow-sm ${
                      copiedKey?.endsWith('-absent')
                        ? 'bg-rose-500 text-white border-rose-400 font-black ring-2 ring-rose-400/40'
                        : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}
                    title="Copy absent list using their display short names"
                  >
                    {copiedKey?.endsWith('-absent') ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        <span>Copied Absent!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-rose-400" />
                        <span>Copy Absent ({stats.absent})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Past Recorded Dates Accordion / Quick Switcher */}
              {showHistoryDrawer && massRecordedSessions.length > 0 && (
                <div className="p-3 rounded-xl bg-[#121212] border border-purple-500/30 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5" />
                      <span>Past Recorded Attendance Dates for {currentConfig.name}</span>
                    </span>
                    <button onClick={() => setShowHistoryDrawer(false)} className="text-neutral-500 hover:text-white p-0.5">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {massRecordedSessions.map((session) => {
                      const isCurrent = session.date === selectedMassDate;
                      const pCount = (session.attendance || []).filter((a) => a.status === 'Present').length;
                      const aCount = (session.attendance || []).filter((a) => a.status === 'Absent').length;
                      const tCount = (session.attendance || []).length;
                      return (
                        <div
                          key={session.id}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                            isCurrent
                              ? 'bg-purple-500/20 border-purple-500 text-white font-bold'
                              : 'bg-[#181818] border-[#2A2A2A] text-neutral-300 hover:border-purple-500/40'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedMassDate(session.date);
                              setShowHistoryDrawer(false);
                            }}
                            className="flex items-center gap-1.5 font-mono"
                          >
                            <Calendar className="w-3.5 h-3.5 text-purple-400" />
                            <span>{session.date}</span>
                            <span className="text-[10px] px-1 rounded bg-black/40 text-neutral-400">
                              {pCount}/{tCount}P
                            </span>
                          </button>

                          {/* Quick copy past session present & absent */}
                          <div className="flex items-center gap-1 border-l border-white/10 pl-1.5">
                            <button
                              type="button"
                              onClick={() => handleCopyMassAttendance(session, 'present')}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300"
                              title="Copy Present list for this past date"
                            >
                              Copy P
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyMassAttendance(session, 'absent')}
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300"
                              title="Copy Absent list for this past date"
                            >
                              Copy A
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteSession(session.id)}
                            className="text-neutral-500 hover:text-rose-400 p-0.5"
                            title="Delete past session"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Filter Pills, Instant Search & A-Z Alphabet Jump */}
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                {/* Mode Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setActiveRosterFilter('relevant')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      activeRosterFilter === 'relevant'
                        ? 'bg-amber-400 text-neutral-950 font-black shadow-md'
                        : 'bg-[#181818] hover:bg-[#222222] text-neutral-300 border border-[#282828]'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>Relevant to this Mass ({relevantChoristers.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRosterFilter('all')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      activeRosterFilter === 'all'
                        ? 'bg-white text-neutral-950 font-black shadow-md'
                        : 'bg-[#181818] hover:bg-[#222222] text-neutral-300 border border-[#282828]'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>All Choristers ({activeSingers.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRosterFilter('Present')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      activeRosterFilter === 'Present'
                        ? 'bg-emerald-500 text-neutral-950 font-black'
                        : 'bg-[#181818] hover:bg-[#222222] text-emerald-400 border border-[#282828]'
                    }`}
                  >
                    <span>Present ({stats.present})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRosterFilter('Absent')}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      activeRosterFilter === 'Absent'
                        ? 'bg-rose-600 text-white font-black'
                        : 'bg-[#181818] hover:bg-[#222222] text-rose-400 border border-[#282828]'
                    }`}
                  >
                    <span>Absent ({stats.absent})</span>
                  </button>
                </div>

                {/* Instant Search Input */}
                <div className="relative w-full sm:w-64 shrink-0">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search chorister name, phone, notes..."
                    value={rosterSearch}
                    onChange={(e) => {
                      setRosterSearch(e.target.value);
                      if (e.target.value) setSelectedLetter('ALL');
                    }}
                    className="w-full pl-8 pr-8 py-1.5 bg-[#161616] border border-[#2A2A2A] focus:border-emerald-500 rounded-xl text-white text-xs placeholder:text-neutral-500 focus:outline-none transition-colors"
                  />
                  {rosterSearch && (
                    <button
                      onClick={() => setRosterSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* A-Z Alphabet Strip */}
              <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedLetter('ALL')}
                  className={`px-2 py-0.5 rounded-lg font-bold transition-all ${
                    selectedLetter === 'ALL'
                      ? 'bg-amber-400 text-neutral-950 font-black'
                      : 'bg-[#181818] text-neutral-400 hover:text-white'
                  }`}
                >
                  ALL
                </button>
                {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => {
                  const hasMembers = availableLetters.has(letter);
                  const isSel = selectedLetter === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      disabled={!hasMembers}
                      onClick={() => setSelectedLetter(letter)}
                      className={`w-6 h-6 rounded-lg font-bold flex items-center justify-center transition-all ${
                        isSel
                          ? 'bg-amber-400 text-neutral-950 font-black shadow-sm'
                          : hasMembers
                          ? 'bg-[#1A1A1A] text-neutral-300 hover:bg-[#282828] hover:text-white'
                          : 'text-neutral-700 cursor-not-allowed'
                      }`}
                    >
                      {letter}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chorister Cards Grid / List */}
            {filteredChoristerRows.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-[#161616] border border-[#262626] space-y-3">
                <Users className="w-8 h-8 mx-auto text-neutral-500" />
                <h5 className="font-bold text-white text-sm">No Choristers Found Matching Criteria</h5>
                <p className="text-xs text-neutral-400 max-w-md mx-auto">
                  {activeRosterFilter === 'relevant'
                    ? `No choristers are specifically tagged for ${currentConfig.name}. Switch to "All Choristers" to mark anyone who attended!`
                    : 'Try clearing your search query or selecting "ALL" letters.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setActiveRosterFilter('all');
                    setRosterSearch('');
                    setSelectedLetter('ALL');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-neutral-950 font-bold text-xs"
                >
                  Show All Choristers
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {filteredChoristerRows.map((chorister) => {
                  const record = massAttendanceRecords.find((r) => r.choristerId === chorister.id);
                  const currentStatus = record?.status || 'Absent';
                  const isRelevant = isChoristerRelevantToMass(chorister, selectedMassKey);
                  const isBirthday = chorister.birthdate ? isBirthdayToday(chorister.birthdate) : false;
                  const isNotesOpen = expandedNotesChoristerId === chorister.id;
                  const avatarUrl = getDriveDirectImageUrl(chorister.photoUrl, 200);

                  return (
                    <div
                      key={chorister.id}
                      className={`p-3 rounded-2xl border transition-all space-y-2.5 ${
                        currentStatus === 'Present'
                          ? 'bg-gradient-to-br from-[#11241C] to-[#141A16] border-emerald-500/40 shadow-sm'
                          : currentStatus === 'Late'
                          ? 'bg-gradient-to-br from-[#241E11] to-[#1A1814] border-amber-500/40 shadow-sm'
                          : currentStatus === 'Excused'
                          ? 'bg-gradient-to-br from-[#111A24] to-[#14181A] border-blue-500/40 shadow-sm'
                          : 'bg-[#151515] border-[#242424] hover:border-[#333333]'
                      }`}
                    >
                      {/* Top Row: Avatar, Name, Role, and Mass Preference */}
                      <div className="flex items-start gap-2.5">
                        <div className="relative shrink-0">
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={chorister.name}
                              className="w-10 h-10 rounded-xl object-cover border border-[#333333]"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-white font-black text-sm flex items-center justify-center border border-amber-500/40">
                              {(chorister.name || 'C').charAt(0)}
                            </div>
                          )}
                          {isBirthday && (
                            <span className="absolute -bottom-1 -right-1 p-0.5 bg-amber-400 text-neutral-950 rounded-full" title="Birthday Today!">
                              <Cake className="w-3 h-3" />
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="font-bold text-white text-xs sm:text-sm truncate">
                              {chorister.name}
                            </h4>
                            {isRelevant ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 shrink-0">
                                ⭐ Relevant
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-[#222222] text-neutral-400 shrink-0">
                                Substitute
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-neutral-400 mt-0.5">
                            <span className="text-neutral-300 font-medium">{chorister.role}</span>
                            {chorister.isSchoolStudent && (
                              <span className="px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                Student
                              </span>
                            )}
                            {chorister.voiceRating && (
                              <span className="text-amber-400 font-bold">
                                ★ {chorister.voiceRating}/10
                              </span>
                            )}
                          </div>

                          {/* Allocation badge */}
                          <div className="text-[10px] text-neutral-400 mt-1 truncate">
                            {chorister.weeklyMassPreference && (
                              <span className="text-neutral-400 mr-1.5">
                                Weekly: <strong className="text-neutral-300">{chorister.weeklyMassPreference}</strong>
                              </span>
                            )}
                            {chorister.sundayMassPreference && (
                              <span className="text-neutral-400">
                                Sunday: <strong className="text-neutral-300">{chorister.sundayMassPreference}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 4 Large, Touch-Friendly Status Buttons */}
                      <div className="grid grid-cols-4 gap-1 pt-1">
                        {(['Present', 'Absent', 'Late', 'Excused'] as AttendanceStatus[]).map((st) => {
                          const isSelected = currentStatus === st;
                          let btnClass = 'bg-[#1C1C1C] hover:bg-[#252525] text-neutral-400 border border-[#2B2B2B]';

                          if (isSelected) {
                            if (st === 'Present') btnClass = 'bg-emerald-500 text-neutral-950 font-black shadow-md border-emerald-400';
                            else if (st === 'Absent') btnClass = 'bg-rose-600 text-white font-black shadow-md border-rose-500';
                            else if (st === 'Late') btnClass = 'bg-amber-500 text-neutral-950 font-black shadow-md border-amber-400';
                            else if (st === 'Excused') btnClass = 'bg-blue-500 text-white font-black shadow-md border-blue-400';
                          }

                          return (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleSetChoristerStatus(chorister.id, st)}
                              className={`py-1.5 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 ${btnClass}`}
                            >
                              <span className="text-[11px] font-black">{st}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Notes & Remarks Toggle */}
                      <div className="pt-1">
                        {isNotesOpen ? (
                          <div className="space-y-1 bg-[#101010] p-2 rounded-xl border border-[#262626]">
                            <div className="flex items-center justify-between text-[10px] text-neutral-400 font-bold">
                              <span>Attendance Remark / Role Notes:</span>
                              <button
                                onClick={() => setExpandedNotesChoristerId(null)}
                                className="text-neutral-500 hover:text-white"
                              >
                                Close
                              </button>
                            </div>
                            <input
                              type="text"
                              placeholder="e.g. Sung 1st reading psalm, arrived for sermon..."
                              value={record?.notes || ''}
                              onChange={(e) => handleSetChoristerNote(chorister.id, e.target.value)}
                              className="w-full px-2.5 py-1 bg-[#181818] border border-[#303030] rounded-lg text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[10px] text-neutral-400">
                            {record?.notes ? (
                              <button
                                onClick={() => setExpandedNotesChoristerId(chorister.id)}
                                className="text-amber-300 truncate max-w-[200px] text-left hover:underline"
                              >
                                💬 &quot;{record.notes}&quot;
                              </button>
                            ) : (
                              <button
                                onClick={() => setExpandedNotesChoristerId(chorister.id)}
                                className="text-neutral-500 hover:text-neutral-300 flex items-center gap-1"
                              >
                                <Edit3 className="w-2.5 h-2.5" />
                                <span>Add remarks / notes</span>
                              </button>
                            )}

                            {chorister.phoneNumber && (
                              <a
                                href={`tel:${chorister.phoneNumber}`}
                                className="text-neutral-500 hover:text-emerald-400 flex items-center gap-1"
                                title="Call Chorister"
                              >
                                <Phone className="w-2.5 h-2.5" />
                                <span>{chorister.phoneNumber}</span>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Floating Save Action Bar */}
            <div className="bg-[#171717] rounded-2xl p-4 border border-[#282828] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Optional log caption (e.g. 'Updated late arrivals after offertory hymn')"
                  value={massAttendanceCaption}
                  onChange={(e) => setMassAttendanceCaption(e.target.value)}
                  className="w-full sm:w-96 px-3 py-1.5 bg-[#101010] border border-[#2E2E2E] rounded-xl text-white text-xs placeholder:text-neutral-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-[11px] text-neutral-400">
                  {stats.present}/{stats.total} Present ({stats.overallRate}%)
                </span>
                <button
                  type="button"
                  id="bottom-save-mass-attendance-btn"
                  onClick={handleSaveMassAttendance}
                  disabled={isSaving}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-all ${
                    isDirty
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-neutral-950 ring-2 ring-emerald-400'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Mass Attendance'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : activeSubView === 'work' ? (
          <WorkSubTab
            workAndBudget={currentService.workAndBudget}
            eventTitle={currentConfig.name}
            choristers={choristers}
            activeMember={activeMember}
            showHymnSheet={false}
            hideApproval={true}
            allPractices={allPractices}
            onSavePractices={onSavePractices}
            onDeletePractice={onDeletePractice}
            onSaveWork={handleSaveWork}
          />
        ) : (
          <BudgetSubTab
            workAndBudget={currentService.workAndBudget}
            eventTitle={currentConfig.name}
            activeMember={activeMember}
            onSaveBudget={handleSaveWork}
          />
        )}
      </div>

      {/* WhatsApp Modals */}
      <TuesdayMassWhatsAppModal
        isOpen={isTuesdayWhatsAppModalOpen}
        onClose={() => setIsTuesdayWhatsAppModalOpen(false)}
        workAndBudget={tuesdayService.workAndBudget}
        choristers={choristers}
        onSaveWork={handleSaveTuesdayWork}
      />

      <ThursdayNovenaWhatsAppModal
        isOpen={isThursdayWhatsAppModalOpen}
        onClose={() => setIsThursdayWhatsAppModalOpen(false)}
        workAndBudget={thursdayService.workAndBudget}
        choristers={choristers}
        onSaveWork={handleSaveThursdayWork}
      />

      <FirstFridayWhatsAppModal
        isOpen={isFirstFridayWhatsAppModalOpen}
        onClose={() => setIsFirstFridayWhatsAppModalOpen(false)}
        workAndBudget={firstFridayService.workAndBudget}
        choristers={choristers}
        onSaveWork={handleSaveFirstFridayWork}
      />

      <SaturdayEnglishWhatsAppModal
        isOpen={isSaturdayEnglishWhatsAppModalOpen}
        onClose={() => setIsSaturdayEnglishWhatsAppModalOpen(false)}
        workAndBudget={saturdayEnglishService.workAndBudget}
        choristers={choristers}
        onSaveWork={handleSaveSaturdayEnglishWork}
      />

      <SundayMassesWhatsAppModal
        isOpen={isSundayWhatsAppModalOpen}
        onClose={() => setIsSundayWhatsAppModalOpen(false)}
        saturdayVigilService={satService}
        sundayEarlyService={sunEarlyService}
        sundayMainService={sunMainService}
        saturdayVigilWork={satService.workAndBudget}
        sundayEarlyWork={sunEarlyService.workAndBudget}
        sundayMainWork={sunMainService.workAndBudget}
        choristers={choristers}
        onSaveSundayMasses={handleSaveSundayMasses}
        onSaveAll={handleSaveSundayMasses}
      />

      {/* Quick Clipboard Copy Toast Notification */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161616] text-white px-4 py-2.5 rounded-2xl border border-emerald-500/50 shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <span>{copyToast}</span>
        </div>
      )}
    </div>
  );
};
