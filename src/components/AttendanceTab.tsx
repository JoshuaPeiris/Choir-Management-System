import React, { useState, useMemo, useRef } from 'react';
import { 
  ClipboardCheck, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Search, 
  Filter, 
  Check, 
  Copy,
  X, 
  FileText,
  UserCheck,
  TrendingUp,
  Sparkles,
  Trash2,
  Cake,
  History,
  Edit3,
  ChevronRight,
  ChevronLeft,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  ChevronDown,
  Church,
  Music,
  CalendarDays,
  ExternalLink,
  Info
} from 'lucide-react';
import { isBirthdayToday } from '../utils/birthdayUtils';
import { 
  Chorister, 
  CommitteeMember, 
  PracticeSession, 
  PracticeAttendanceRecord, 
  AttendanceStatus,
  AttendanceChangeLogEntry,
  AttendanceChangeDetail,
  MajorEvent
} from '../types';
import { 
  MassKey, 
  MASS_CONFIGS, 
  getMassKeyFromSession, 
  isChoristerRelevantToMass, 
  calculateSessionAttendanceStats,
  getAttendanceNameList,
  copyAttendanceListToClipboard
} from '../utils/massAttendanceUtils';

interface AttendanceTabProps {
  choristers: Chorister[];
  activeMember: CommitteeMember;
  practices: PracticeSession[];
  onSavePractices: (updatedPractices: PracticeSession[], auditAction?: string) => Promise<void>;
  onDeletePractice?: (practiceId: string) => Promise<void> | void;
  majorEvents?: Record<string, MajorEvent>;
  onNavigateToWeeklyMass?: (massKey?: string) => void;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = ({
  choristers,
  activeMember,
  practices,
  onSavePractices,
  onDeletePractice,
  onNavigateToWeeklyMass,
}) => {
  // Session type view: 'all' | 'masses' | 'practices'
  const [sessionCategory, setSessionCategory] = useState<'all' | 'masses' | 'practices'>('all');
  
  // Specific Mass Filter (when looking at Masses)
  const [selectedMassFilter, setSelectedMassFilter] = useState<'all' | MassKey>('all');

  // Main view filter & search
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('all');
  const [timeScopeFilter, setTimeScopeFilter] = useState<'all' | 'past' | 'upcoming'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Active session being edited / viewed
  const [activeSessionForAttendance, setActiveSessionForAttendance] = useState<PracticeSession | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<PracticeAttendanceRecord[]>([]);
  const [initialAttendanceMap, setInitialAttendanceMap] = useState<Map<string, PracticeAttendanceRecord>>(new Map());
  
  // Modal internal tabs: 'roster' | 'history' | 'edit-details'
  const [modalTab, setModalTab] = useState<'roster' | 'history' | 'edit-details'>('roster');
  
  // Modal Search & Fast A-Z Navigation (Phone-optimized)
  const [rosterSearch, setRosterSearch] = useState<string>('');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [rosterRoleFilter, setRosterRoleFilter] = useState<'all' | 'Chorister' | 'Organist'>('all');
  const [rosterStatusFilter, setRosterStatusFilter] = useState<'all' | AttendanceStatus>('all');
  // Modal filter for committed vs all choir
  const [rosterTargetScope, setRosterTargetScope] = useState<'committed' | 'all'>('committed');
  const [expandedNotesChoristerId, setExpandedNotesChoristerId] = useState<string | null>(null);
  
  // Change caption / reason input for the current edit
  const [changeCaption, setChangeCaption] = useState<string>('');
  
  // Edit session metadata state
  const [editDate, setEditDate] = useState<string>('');
  const [editTime, setEditTime] = useState<string>('');
  const [editVenue, setEditVenue] = useState<string>('');
  const [editEventTitle, setEditEventTitle] = useState<string>('');
  const [editFocus, setEditFocus] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');

  // New Practice Form State
  const [newDate, setNewDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState<string>('5:00 PM - 7:00 PM');
  const [newVenue, setNewVenue] = useState<string>("St. Michael's Church Choir Loft");
  const [newEvent, setNewEvent] = useState<string>('Parish Feast & Nine Novenas');
  const [newSessionType, setNewSessionType] = useState<'practice' | 'mass'>('practice');
  const [newFocus, setNewFocus] = useState<string>('Hymn Repertoire & Vocal Parts');
  const [newNotes, setNewNotes] = useState<string>('');

  // Quick Copy Feedback State
  const [copiedSessionKey, setCopiedSessionKey] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);

  const handleCopyAttendance = async (session: PracticeSession, type: 'present' | 'absent') => {
    const key = `${session.id}-${type}`;
    const res = await copyAttendanceListToClipboard(session, choristers, type);
    if (res.success) {
      setCopiedSessionKey(key);
      const typeLabel = type === 'present' ? 'Present' : 'Absent';
      setCopyToast(`Copied ${res.count} ${typeLabel.toLowerCase()} members to clipboard`);
      setTimeout(() => setCopiedSessionKey(null), 2500);
      setTimeout(() => setCopyToast(null), 3500);
    }
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const rosterListRef = useRef<HTMLDivElement>(null);

  // Active singing choristers excluding instrument players
  const activeSingers = useMemo(
    () => choristers.filter((c) => c.role !== 'Instrument Player'),
    [choristers]
  );

  // Categorized counts
  const massSessionsCount = useMemo(() => {
    return practices.filter((p) => p.sessionType === 'mass' || Boolean(getMassKeyFromSession(p))).length;
  }, [practices]);

  const rehearsalSessionsCount = useMemo(() => {
    return practices.filter((p) => p.sessionType !== 'mass' && !getMassKeyFromSession(p)).length;
  }, [practices]);

  // Available starting letters from active choristers
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    activeSingers.forEach((c) => {
      const firstChar = c.name.trim().charAt(0).toUpperCase();
      if (firstChar && firstChar >= 'A' && firstChar <= 'Z') letters.add(firstChar);
    });
    return Array.from(letters).sort();
  }, [activeSingers]);

  // Open attendance modal for a specific session
  const handleOpenAttendance = (session: PracticeSession, initialTab: 'roster' | 'history' | 'edit-details' = 'roster') => {
    setActiveSessionForAttendance(session);
    setModalTab(initialTab);
    setRosterSearch('');
    setSelectedLetter('ALL');
    setRosterRoleFilter('all');
    setRosterStatusFilter('all');
    
    // If it's a Mass session, default scope to 'committed' so user easily marks people who said they'd come
    const massKey = getMassKeyFromSession(session);
    setRosterTargetScope(massKey ? 'committed' : 'all');
    
    setChangeCaption('');
    setExpandedNotesChoristerId(null);

    // Session metadata edit state
    setEditDate(session.date);
    setEditTime(session.startTime || '');
    setEditVenue(session.venue || "St. Michael's Church Choir Loft");
    setEditEventTitle(session.eventTitle || '');
    setEditFocus(session.focus || '');
    setEditNotes(session.notes || '');

    // Merge current session attendance with latest active choristers (excluding instrument players)
    const existingMap = new Map((session.attendance || []).map((a) => [a.choristerId, a]));
    const records: PracticeAttendanceRecord[] = activeSingers.map((c) => {
      const existing = existingMap.get(c.id);
      if (existing) {
        return {
          choristerId: c.id,
          choristerName: c.name,
          role: c.role,
          status: existing.status,
          notes: existing.notes || '',
        };
      }
      return {
        choristerId: c.id,
        choristerName: c.name,
        role: c.role,
        status: 'Absent' as AttendanceStatus,
        notes: '',
      };
    });

    // Save initial snapshot for accurate difference tracking
    const snapshotMap = new Map<string, PracticeAttendanceRecord>();
    records.forEach((r) => snapshotMap.set(r.choristerId, { ...r }));
    setInitialAttendanceMap(snapshotMap);
    setAttendanceRecords(records);
  };

  // Switch to another session within the modal without closing
  const handleSwitchSession = (sessionId: string) => {
    const nextSession = practices.find((p) => p.id === sessionId);
    if (nextSession) {
      handleOpenAttendance(nextSession, modalTab);
    }
  };

  // Change individual chorister status
  const handleSetStatus = (choristerId: string, status: AttendanceStatus) => {
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.choristerId === choristerId ? { ...r, status } : r))
    );
  };

  // 1-Tap cycle status shortcut for mobile thumb tapping
  const handleCycleStatus = (choristerId: string, currentStatus: AttendanceStatus) => {
    const cycle: AttendanceStatus[] = ['Present', 'Late', 'Excused', 'Absent'];
    const nextIdx = (cycle.indexOf(currentStatus) + 1) % cycle.length;
    handleSetStatus(choristerId, cycle[nextIdx]);
  };

  // Change individual chorister note
  const handleSetChoristerNote = (choristerId: string, notes: string) => {
    setAttendanceRecords((prev) =>
      prev.map((r) => (r.choristerId === choristerId ? { ...r, notes } : r))
    );
  };

  // Mark all visible/filtered choristers as Present / Absent / Excused / Late
  const handleMarkAll = (status: AttendanceStatus) => {
    const targetIds = new Set(filteredRoster.map((r) => r.choristerId));
    setAttendanceRecords((prev) =>
      prev.map((r) => (targetIds.has(r.choristerId) ? { ...r, status } : r))
    );
  };

  // Save attendance sheet and record audit history entry with caption
  const handleSaveAttendanceSheet = async () => {
    if (!activeSessionForAttendance) return;

    // Detect exact diffs between initial snapshot and current records
    const diffs: AttendanceChangeDetail[] = [];
    attendanceRecords.forEach((curr) => {
      const init = initialAttendanceMap.get(curr.choristerId);
      if (!init || init.status !== curr.status || (init.notes || '') !== (curr.notes || '')) {
        diffs.push({
          choristerId: curr.choristerId,
          choristerName: curr.choristerName,
          fromStatus: init ? init.status : 'Present',
          toStatus: curr.status,
          oldNotes: init?.notes,
          newNotes: curr.notes,
        });
      }
    });

    const isMetaChanged = 
      editDate !== activeSessionForAttendance.date ||
      editTime !== activeSessionForAttendance.startTime ||
      editVenue !== activeSessionForAttendance.venue ||
      editFocus !== activeSessionForAttendance.focus ||
      editEventTitle !== (activeSessionForAttendance.eventTitle || '') ||
      editNotes !== (activeSessionForAttendance.notes || '');

    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    let newChangeLog = [...(activeSessionForAttendance.changeLog || [])];

    if (diffs.length > 0 || isMetaChanged || changeCaption.trim()) {
      let actionSummary = '';
      if (diffs.length > 0 && isMetaChanged) {
        actionSummary = `Updated session details and changed ${diffs.length} member status${diffs.length === 1 ? '' : 'es'}`;
      } else if (diffs.length > 0) {
        const changeDescriptions = diffs.slice(0, 3).map((d) => `${d.choristerName} (${d.fromStatus} → ${d.toStatus})`);
        const moreSuffix = diffs.length > 3 ? ` and ${diffs.length - 3} more` : '';
        actionSummary = `Modified ${diffs.length} attendance record${diffs.length === 1 ? '' : 's'}: ${changeDescriptions.join(', ')}${moreSuffix}`;
      } else if (isMetaChanged) {
        actionSummary = 'Updated attendance schedule/details';
      } else {
        actionSummary = 'Verified & saved attendance sheet';
      }

      const logEntry: AttendanceChangeLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: now.toISOString(),
        formattedDate,
        editorName: activeMember.name,
        editorRole: activeMember.role,
        caption: changeCaption.trim() || undefined,
        actionType: diffs.length > 0 ? 'Status Changed' : 'Updated',
        summary: actionSummary,
        changesDetails: diffs.length > 0 ? diffs : undefined,
      };

      newChangeLog = [logEntry, ...newChangeLog];
    }

    const updatedSession: PracticeSession = {
      ...activeSessionForAttendance,
      date: editDate || activeSessionForAttendance.date,
      startTime: editTime || activeSessionForAttendance.startTime,
      venue: editVenue || activeSessionForAttendance.venue,
      focus: editFocus || activeSessionForAttendance.focus,
      eventTitle: editEventTitle || activeSessionForAttendance.eventTitle,
      notes: editNotes,
      attendance: attendanceRecords,
      changeLog: newChangeLog,
      lastModifiedBy: `${activeMember.name} (${activeMember.role})`,
      lastModifiedAt: formattedDate,
      lastChangeCaption: changeCaption.trim() || activeSessionForAttendance.lastChangeCaption,
    };

    const updatedPractices = practices.map((p) =>
      p.id === activeSessionForAttendance.id ? updatedSession : p
    );

    const stats = calculateSessionAttendanceStats(updatedSession, choristers);
    const auditDescription = changeCaption.trim() 
      ? `Attendance for ${updatedSession.eventTitle || updatedSession.focus} (${updatedSession.date}) updated: "${changeCaption.trim()}" (${stats.committedPresent}/${stats.committedTotal} Expected Present - ${stats.committedRate}%)`
      : `Recorded attendance for ${updatedSession.eventTitle || updatedSession.focus} on ${updatedSession.date} (${stats.committedPresent}/${stats.committedTotal} Expected Present - ${stats.committedRate}%)`;

    await onSavePractices(updatedPractices, auditDescription);
    setActiveSessionForAttendance(null);
  };

  // Schedule a new practice session (or log a past session)
  const handleCreatePractice = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const isPast = newDate < todayStr;
    const initialAttendance: PracticeAttendanceRecord[] = activeSingers.map((c) => ({
      choristerId: c.id,
      choristerName: c.name,
      role: c.role,
      status: 'Absent',
      notes: '',
    }));

    const initialLog: AttendanceChangeLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: now.toISOString(),
      formattedDate,
      editorName: activeMember.name,
      editorRole: activeMember.role,
      caption: isPast ? 'Past / Historical attendance sheet initialized' : 'Session scheduled',
      actionType: isPast ? 'Retroactive Edit' : 'Created',
      summary: `Created ${isPast ? 'historical' : 'new'} ${newSessionType === 'mass' ? 'mass' : 'practice'} session for ${newDate}`,
    };

    const newSession: PracticeSession = {
      id: `${newSessionType === 'mass' ? 'mass' : 'prac'}-${Date.now()}`,
      date: newDate,
      startTime: newTime,
      venue: newVenue,
      focus: newFocus,
      eventTitle: newEvent,
      sessionType: newSessionType,
      notes: newNotes,
      attendance: initialAttendance,
      changeLog: [initialLog],
      lastModifiedBy: `${activeMember.name} (${activeMember.role})`,
      lastModifiedAt: formattedDate,
      lastChangeCaption: isPast ? 'Retroactive attendance recorded' : undefined,
    };

    const updated = [newSession, ...practices];
    await onSavePractices(
      updated,
      `Scheduled ${newSessionType === 'mass' ? 'Mass' : 'practice'} on ${newDate} for ${newEvent}`
    );
    setIsScheduleModalOpen(false);
    setNewFocus('Hymn Repertoire & Vocal Parts');
    setNewNotes('');
  };

  // Delete practice/mass
  const handleDeletePractice = async (id: string) => {
    setDeleteConfirmId(null);
    const updated = practices.filter((p) => p.id !== id);
    if (onDeletePractice) {
      await onDeletePractice(id);
    } else {
      await onSavePractices(updated, 'Deleted attendance session');
    }
  };

  // Calculations across all sessions taking into account committed attendees
  const totalPractices = practices.length;
  let totalCommittedRateSum = 0;
  let sessionsWithStatsCount = 0;
  let pastPracticesCount = 0;
  let upcomingPracticesCount = 0;

  practices.forEach((p) => {
    if (p.date < todayStr) {
      pastPracticesCount++;
    } else {
      upcomingPracticesCount++;
    }
    const stats = calculateSessionAttendanceStats(p, choristers);
    if (stats.committedTotal > 0 && (p.attendance || []).length > 0) {
      totalCommittedRateSum += stats.committedRate;
      sessionsWithStatsCount++;
    }
  });

  const avgAttendancePercent = sessionsWithStatsCount > 0 
    ? Math.round(totalCommittedRateSum / sessionsWithStatsCount) 
    : 100;

  // Filtered Practices for main screen
  const filteredPractices = useMemo(() => {
    return practices
      .filter((p) => {
        const massKey = getMassKeyFromSession(p);
        const isMass = p.sessionType === 'mass' || Boolean(massKey);

        // Session Category Filter (All vs Masses vs Practices)
        if (sessionCategory === 'masses' && !isMass) return false;
        if (sessionCategory === 'practices' && isMass) return false;

        // Specific Mass Key Filter (when on masses tab)
        if (sessionCategory === 'masses' && selectedMassFilter !== 'all') {
          if (massKey !== selectedMassFilter) return false;
        }

        // Time scope filter (All, Past, Upcoming)
        if (timeScopeFilter === 'past' && p.date >= todayStr) return false;
        if (timeScopeFilter === 'upcoming' && p.date < todayStr) return false;

        // Program Filter
        if (selectedEventFilter !== 'all') {
          const matchFocus = (p.focus || '').toLowerCase().includes(selectedEventFilter.toLowerCase());
          const matchTitle = (p.eventTitle || '').toLowerCase().includes(selectedEventFilter.toLowerCase());
          if (!matchFocus && !matchTitle) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchBasic = 
            p.date.includes(q) ||
            (p.venue || '').toLowerCase().includes(q) ||
            (p.focus || '').toLowerCase().includes(q) ||
            (p.notes || '').toLowerCase().includes(q) ||
            (p.eventTitle || '').toLowerCase().includes(q) ||
            (p.lastModifiedBy || '').toLowerCase().includes(q) ||
            (p.lastChangeCaption || '').toLowerCase().includes(q);

          if (matchBasic) return true;

          // Search in chorister names
          const matchChorister = (p.attendance || []).some((a) =>
            a.choristerName.toLowerCase().includes(q)
          );
          if (matchChorister) return true;

          // Search in changeLog
          const matchLog = (p.changeLog || []).some(
            (l) =>
              l.editorName.toLowerCase().includes(q) ||
              (l.caption || '').toLowerCase().includes(q) ||
              l.summary.toLowerCase().includes(q)
          );
          return matchLog;
        }

        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date)); // Newest first
  }, [practices, sessionCategory, selectedMassFilter, timeScopeFilter, selectedEventFilter, searchQuery, todayStr]);

  // Active session stats (for the modal)
  const activeSessionStats = useMemo(() => {
    if (!activeSessionForAttendance) return null;
    return calculateSessionAttendanceStats(activeSessionForAttendance, choristers);
  }, [activeSessionForAttendance, choristers]);

  // Relevant committed choristers for active modal session
  const committedChoristerIds = useMemo(() => {
    if (!activeSessionStats) return new Set<string>();
    return new Set(activeSessionStats.committedChoristers.map((c) => c.id));
  }, [activeSessionStats]);

  // Filtered Roster inside the Attendance Sheet Modal
  const filteredRoster = useMemo(() => {
    return attendanceRecords.filter((rec) => {
      const isCommitted = committedChoristerIds.has(rec.choristerId);

      // Filter by Committed vs All scope (For Masses, this separates people who told they would come!)
      if (rosterTargetScope === 'committed' && !isCommitted) {
        return false;
      }

      // Letter filter (A-Z Fast Jump)
      if (selectedLetter !== 'ALL') {
        const firstChar = rec.choristerName.trim().charAt(0).toUpperCase();
        if (firstChar !== selectedLetter) return false;
      }

      // Role Filter
      if (rosterRoleFilter !== 'all' && rec.role !== rosterRoleFilter) {
        return false;
      }
      // Status Filter
      if (rosterStatusFilter !== 'all' && rec.status !== rosterStatusFilter) {
        return false;
      }
      // Search in name, phone, notes
      if (rosterSearch.trim()) {
        const q = rosterSearch.toLowerCase();
        const chorister = choristers.find((c) => c.id === rec.choristerId);
        const nameMatch = rec.choristerName.toLowerCase().includes(q);
        const phoneMatch = (chorister?.phoneNumber || '').toLowerCase().includes(q);
        const noteMatch = (rec.notes || '').toLowerCase().includes(q);
        const roleMatch = rec.role.toLowerCase().includes(q);
        const prefMatch = (chorister?.weeklyMassPreference || '').toLowerCase().includes(q) || 
                          (chorister?.sundayMassPreference || '').toLowerCase().includes(q);
        return nameMatch || phoneMatch || noteMatch || roleMatch || prefMatch;
      }
      return true;
    }).sort((a, b) => {
      // Sort committed choristers first
      const aCommitted = committedChoristerIds.has(a.choristerId) ? 0 : 1;
      const bCommitted = committedChoristerIds.has(b.choristerId) ? 0 : 1;
      if (aCommitted !== bCommitted) return aCommitted - bCommitted;
      return a.choristerName.localeCompare(b.choristerName);
    });
  }, [attendanceRecords, committedChoristerIds, rosterTargetScope, selectedLetter, rosterRoleFilter, rosterStatusFilter, rosterSearch, choristers]);

  // Current differences count in active modal
  const modifiedCount = useMemo(() => {
    let count = 0;
    attendanceRecords.forEach((curr) => {
      const init = initialAttendanceMap.get(curr.choristerId);
      if (init && (init.status !== curr.status || (init.notes || '') !== (curr.notes || ''))) {
        count++;
      }
    });
    return count;
  }, [attendanceRecords, initialAttendanceMap]);

  // Modal live counts
  const modalLiveStats = useMemo(() => {
    if (!activeSessionForAttendance) return { committedPresent: 0, committedTotal: 0, committedPct: 0, allPresent: 0, allTotal: 0 };
    
    let commPresent = 0;
    let allPres = 0;
    attendanceRecords.forEach((r) => {
      if (r.status === 'Present') {
        allPres++;
        if (committedChoristerIds.has(r.choristerId)) commPresent++;
      }
    });
    const commTotal = committedChoristerIds.size || activeSingers.length;
    const commPct = commTotal > 0 ? Math.round((commPresent / commTotal) * 100) : 0;
    return {
      committedPresent: commPresent,
      committedTotal: commTotal,
      committedPct: commPct,
      allPresent: allPres,
      allTotal: attendanceRecords.length,
    };
  }, [attendanceRecords, committedChoristerIds, activeSessionForAttendance, activeSingers.length]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner - Mobile Compact */}
      <div className="bg-gradient-to-r from-emerald-950 via-[#141414] to-[#0E0E0E] rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-emerald-500/30 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ClipboardCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-400">
                Choir Rehearsal &amp; Holy Mass Registry
              </span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              Attendance &amp; Practice Sessions
            </h2>
            <p className="text-[11px] sm:text-xs text-neutral-300 mt-1 max-w-2xl line-clamp-2 sm:line-clamp-none">
              Easily view Mass attendances &amp; rehearsals. Attendance percentages are calculated directly from members who committed &amp; confirmed they will attend.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto pt-1 sm:pt-0">
            <button
              id="schedule-practice-btn"
              onClick={() => {
                setNewDate(todayStr);
                setNewSessionType('practice');
                setIsScheduleModalOpen(true);
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Practice</span>
            </button>
            <button
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                setNewDate(yesterday.toISOString().split('T')[0]);
                setNewSessionType('practice');
                setIsScheduleModalOpen(true);
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 sm:py-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] text-neutral-300 hover:text-white border border-[#333333] font-semibold text-xs transition-all"
              title="Record attendance for a past date"
            >
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Log Past Date</span>
            </button>
          </div>
        </div>

        {/* Stats Row - Accurate Committed Percentage */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4 sm:mt-6 pt-3 sm:pt-5 border-t border-[#222222]">
          <div className="bg-[#111111]/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-[#222222]">
            <div className="text-[10px] sm:text-xs text-neutral-400 font-medium">Total Sessions</div>
            <div className="text-lg sm:text-2xl font-black text-white mt-0.5">{totalPractices}</div>
            <div className="text-[9px] sm:text-[10px] text-neutral-500">
              {massSessionsCount} Masses • {rehearsalSessionsCount} Practices
            </div>
          </div>
          <div className="bg-[#111111]/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-[#222222]">
            <div className="text-[10px] sm:text-xs text-neutral-400 font-medium">Active Choristers</div>
            <div className="text-lg sm:text-2xl font-black text-amber-400 mt-0.5">{activeSingers.length}</div>
            <div className="text-[9px] sm:text-[10px] text-neutral-500">{activeSingers.filter(c => c.role === 'Organist').length} Organists</div>
          </div>
          <div className="bg-[#111111]/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-[#222222]">
            <div className="text-[10px] sm:text-xs text-neutral-400 font-medium flex items-center justify-between">
              <span>Committed Rate</span>
              <span className="text-[9px] text-emerald-400 font-bold">Accurate</span>
            </div>
            <div className="text-lg sm:text-2xl font-black text-emerald-400 mt-0.5">{avgAttendancePercent}%</div>
            <div className="text-[9px] sm:text-[10px] text-neutral-500 truncate" title="Calculated from members who confirmed they will attend">
              Based on expected attendees
            </div>
          </div>
          <div className="bg-[#111111]/80 rounded-xl sm:rounded-2xl p-2.5 sm:p-3 border border-[#222222]">
            <div className="text-[10px] sm:text-xs text-neutral-400 font-medium">Audit Tracking</div>
            <div className="text-lg sm:text-2xl font-black text-purple-400 mt-0.5 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-purple-400 inline" />
              <span>Active</span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-neutral-500">Full revision change log</div>
          </div>
        </div>
      </div>

      {/* TOP LEVEL SESSION SWITCHER: ALL / MASS ATTENDANCES / REHEARSALS */}
      <div className="bg-[#111111] p-3 rounded-2xl border border-[#222222] space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Main Primary View Switcher */}
          <div className="flex items-center gap-1.5 bg-[#171717] p-1.5 rounded-2xl border border-[#2A2A2A] self-stretch sm:self-auto overflow-x-auto scrollbar-none">
            <button
              id="attendance-tab-all-sessions-btn"
              onClick={() => {
                setSessionCategory('all');
                setSelectedMassFilter('all');
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                sessionCategory === 'all'
                  ? 'bg-neutral-200 text-neutral-950 shadow-md scale-[1.02]'
                  : 'text-neutral-400 hover:text-white hover:bg-[#222222]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Sessions</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                sessionCategory === 'all' ? 'bg-neutral-900 text-white' : 'bg-[#252525] text-neutral-400'
              }`}>
                {practices.length}
              </span>
            </button>

            <button
              id="attendance-tab-masses-btn"
              onClick={() => {
                setSessionCategory('masses');
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                sessionCategory === 'masses'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-neutral-950 shadow-md scale-[1.02]'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20'
              }`}
            >
              <Church className="w-3.5 h-3.5" />
              <span>⛪ Mass Attendances</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                sessionCategory === 'masses' ? 'bg-neutral-950 text-amber-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {massSessionsCount}
              </span>
            </button>

            <button
              id="attendance-tab-practices-btn"
              onClick={() => {
                setSessionCategory('practices');
                setSelectedMassFilter('all');
              }}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                sessionCategory === 'practices'
                  ? 'bg-emerald-500 text-neutral-950 shadow-md scale-[1.02]'
                  : 'text-emerald-400/90 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>🎵 Practices &amp; Rehearsals</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                sessionCategory === 'practices' ? 'bg-neutral-950 text-emerald-300' : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {rehearsalSessionsCount}
              </span>
            </button>
          </div>

          {/* Time Scope Tabs (All, Past, Upcoming) */}
          <div className="flex items-center gap-1 bg-[#171717] p-1 rounded-xl border border-[#262626] self-start sm:self-auto overflow-x-auto">
            <button
              onClick={() => setTimeScopeFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                timeScopeFilter === 'all'
                  ? 'bg-neutral-300 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeScopeFilter('past')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                timeScopeFilter === 'past'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <History className="w-3 h-3" />
              <span>Past ({pastPracticesCount})</span>
            </button>
            <button
              onClick={() => setTimeScopeFilter('upcoming')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                timeScopeFilter === 'upcoming'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Upcoming ({upcomingPracticesCount})
            </button>
          </div>
        </div>

        {/* MASS ATTENDANCE DEDICATED QUICK ACCESS SELECTOR (Active when viewing Masses or All) */}
        {(sessionCategory === 'masses' || sessionCategory === 'all') && (
          <div className="pt-2 border-t border-[#1F1F1F] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                <Church className="w-3.5 h-3.5 text-amber-400" />
                <span>Filter by Holy Mass:</span>
              </span>
              {sessionCategory === 'all' && (
                <button
                  onClick={() => setSessionCategory('masses')}
                  className="text-[10px] text-amber-400 hover:underline font-semibold"
                >
                  View Only Saved Masses →
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedMassFilter('all')}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                  selectedMassFilter === 'all'
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'bg-[#181818] text-neutral-400 hover:text-white border border-[#2B2B2B]'
                }`}
              >
                <span>All Masses</span>
                <span className="text-[9px] opacity-80">({massSessionsCount})</span>
              </button>

              {(Object.keys(MASS_CONFIGS) as MassKey[]).map((mKey) => {
                const cfg = MASS_CONFIGS[mKey];
                const count = practices.filter((p) => getMassKeyFromSession(p) === mKey).length;
                const isSelected = selectedMassFilter === mKey;

                return (
                  <button
                    key={mKey}
                    onClick={() => {
                      setSessionCategory('masses');
                      setSelectedMassFilter(mKey);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 border ${
                      isSelected
                        ? `${cfg.badgeColor} ${cfg.textColor} ${cfg.borderColor} ring-1 ring-amber-400 shadow-sm font-black`
                        : 'bg-[#181818] text-neutral-400 hover:text-white border-[#2A2A2A]'
                    }`}
                  >
                    <span>{cfg.shortName}</span>
                    {count > 0 && (
                      <span className={`px-1 rounded-md text-[9px] font-mono ${
                        isSelected ? 'bg-amber-400 text-neutral-950 font-bold' : 'bg-[#252525] text-neutral-300'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search and Secondary Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#1C1C1C]">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search date, mass, venue, member, caption..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs bg-[#181818] border border-[#2A2A2A] rounded-xl text-white placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Program Categories */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
            <span className="text-[10px] font-semibold text-neutral-500 mr-0.5 shrink-0 flex items-center gap-0.5">
              <Filter className="w-2.5 h-2.5" />
            </span>
            {['all', 'Feast', 'Weekly', 'Sunday', 'Tuesday', 'Carols', 'Easter', 'Christmas'].map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setSelectedEventFilter(filterKey)}
                className={`px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-semibold whitespace-nowrap transition-all ${
                  selectedEventFilter === filterKey
                    ? 'bg-neutral-200 text-neutral-950 font-bold shadow-sm'
                    : 'bg-[#181818] text-neutral-400 hover:text-white hover:bg-[#222222] border border-[#2A2A2A]'
                }`}
              >
                {filterKey === 'all' ? 'All Tags' : filterKey}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions Grid / List */}
      {filteredPractices.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl sm:rounded-3xl bg-[#111111] border border-[#222222] space-y-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
            {sessionCategory === 'masses' ? <Church className="w-5 h-5 sm:w-6 sm:h-6" /> : <ClipboardCheck className="w-5 h-5 sm:w-6 sm:h-6" />}
          </div>
          <h3 className="font-bold text-white text-sm sm:text-base">
            {sessionCategory === 'masses' ? 'No Recorded Mass Attendance Sessions Found' : 'No Matching Sessions Found'}
          </h3>
          <p className="text-[11px] sm:text-xs text-neutral-400 max-w-md mx-auto">
            {sessionCategory === 'masses'
              ? 'When you record and save attendance in the Weekly Masses tab or click "Log Past Date", they will appear here with committed percentage.'
              : 'Try resetting filters or clicking "Schedule Practice" above.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            {(searchQuery || selectedEventFilter !== 'all' || timeScopeFilter !== 'all' || selectedMassFilter !== 'all' || sessionCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedEventFilter('all');
                  setTimeScopeFilter('all');
                  setSelectedMassFilter('all');
                  setSessionCategory('all');
                }}
                className="px-3 py-1.5 rounded-xl bg-[#202020] text-neutral-300 hover:text-white font-semibold text-xs border border-[#333333]"
              >
                Clear All Filters
              </button>
            )}
            <button
              onClick={() => {
                setNewDate(todayStr);
                setNewSessionType(sessionCategory === 'masses' ? 'mass' : 'practice');
                setIsScheduleModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Session</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredPractices.map((session) => {
            const stats = calculateSessionAttendanceStats(session, choristers);
            const isPast = session.date < todayStr;
            const historyCount = (session.changeLog || []).length;
            const massKey = stats.massKey;
            const massConfig = stats.massConfig;
            const presentNames = getAttendanceNameList(session, choristers, 'present');
            const absentNames = getAttendanceNameList(session, choristers, 'absent');

            return (
              <div
                key={session.id}
                id={`practice-card-${session.id}`}
                className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 flex flex-col justify-between ${
                  stats.isMass
                    ? 'bg-gradient-to-b from-[#161616] to-[#101010] border-amber-500/30 hover:border-amber-500/50 shadow-md'
                    : 'bg-[#131313] border-[#222222] hover:border-[#333333]'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Top Bar with Date, Mass Badge & Percentage */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-white font-mono flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                          {session.date}
                        </span>

                        {stats.isMass ? (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider flex items-center gap-1 border ${
                            massConfig ? `${massConfig.badgeColor} ${massConfig.textColor} ${massConfig.borderColor}` : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}>
                            <Church className="w-3 h-3" />
                            <span>{massConfig ? massConfig.shortName : 'Holy Mass'}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <Music className="w-3 h-3" />
                            <span>Rehearsal</span>
                          </span>
                        )}

                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                          isPast ? 'bg-neutral-800 text-neutral-300 border border-neutral-700' : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                        }`}>
                          {isPast ? 'Recorded' : 'Upcoming'}
                        </span>

                        {session.startTime && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#1F1F1F] text-neutral-300 font-medium border border-[#2B2B2B]">
                            {session.startTime}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-white mt-1.5 leading-snug truncate">
                        {session.eventTitle || session.focus}
                      </h4>
                      {session.eventTitle && session.focus && session.eventTitle !== session.focus && (
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {session.focus}
                        </p>
                      )}
                    </div>

                    {/* Accurate Percentage Badge - Calculated from committed/expected attendees */}
                    <div className="text-right shrink-0">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-black inline-flex items-center gap-1 border shadow-sm ${
                          stats.committedRate >= 80 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                            : stats.committedRate >= 50 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{stats.committedPresent}/{stats.committedTotal} ({stats.committedRate}%)</span>
                        </span>
                        <span className="text-[9px] text-neutral-400 font-medium" title="Calculated from choristers who committed/told they are coming">
                          {stats.isMass ? 'Committed Turnout' : 'Expected Turnout'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary counts of Expected & Full Choir */}
                  <div className="space-y-1 bg-[#171717] p-2.5 rounded-xl border border-[#222222]">
                    <div className="flex items-center justify-between text-[10px] sm:text-[11px]">
                      <span className="text-neutral-400 font-medium">Expected Members:</span>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-emerald-400">{stats.committedPresent} Present</span>
                        <span className="text-neutral-600">•</span>
                        <span className="text-amber-400">{stats.committedLate} Late</span>
                        <span className="text-neutral-600">•</span>
                        <span className="text-blue-400">{stats.committedExcused} Excused</span>
                        <span className="text-neutral-600">•</span>
                        <span className="text-rose-400">{stats.committedAbsent} Absent</span>
                      </div>
                    </div>

                    {stats.isMass && stats.committedTotal < stats.fullTotal && (
                      <div className="flex items-center justify-between text-[9px] text-neutral-500 pt-1 border-t border-[#222222]">
                        <span>Full Choir Turnout:</span>
                        <span>{stats.fullPresent}/{stats.fullTotal} Present ({stats.fullRate}%)</span>
                      </div>
                    )}
                  </div>

                  {/* Quick Copy Present & Absent Buttons (Using Display Short Names) */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      id={`copy-present-btn-${session.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyAttendance(session, 'present');
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-[11px] font-bold transition-all shadow-sm ${
                        copiedSessionKey === `${session.id}-present`
                          ? 'bg-emerald-500 text-neutral-950 border-emerald-400 font-black ring-2 ring-emerald-400/40'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                      title="Copy present list using their display short names"
                    >
                      {copiedSessionKey === `${session.id}-present` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-neutral-950 stroke-[3]" />
                          <span>Copied Present!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copy Present ({presentNames.length})</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      id={`copy-absent-btn-${session.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyAttendance(session, 'absent');
                      }}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl border text-[11px] font-bold transition-all shadow-sm ${
                        copiedSessionKey === `${session.id}-absent`
                          ? 'bg-rose-500 text-white border-rose-400 font-black ring-2 ring-rose-400/40'
                          : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                      title="Copy absent list using their display short names"
                    >
                      {copiedSessionKey === `${session.id}-absent` ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                          <span>Copied Absent!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-rose-400" />
                          <span>Copy Absent ({absentNames.length})</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 truncate">
                    <span className="flex items-center gap-1 shrink-0">
                      <MapPin className="w-3 h-3 text-neutral-500" />
                      {session.venue}
                    </span>
                    {session.notes && (
                      <span className="truncate text-neutral-500">
                        • {session.notes}
                      </span>
                    )}
                  </div>

                  {/* Audit Trail Badge & Caption Preview */}
                  {(session.lastModifiedBy || session.lastChangeCaption || historyCount > 0) && (
                    <div className="bg-[#181818] p-2 rounded-xl border border-[#2A2A2A] text-[11px] space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-neutral-400 flex items-center gap-1 truncate text-[10px]">
                          <Edit3 className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{session.lastModifiedBy || 'Editor'}</span>
                        </span>
                        {session.lastModifiedAt && (
                          <span className="text-neutral-500 font-mono text-[9px] shrink-0">{session.lastModifiedAt}</span>
                        )}
                      </div>
                      {session.lastChangeCaption && (
                        <div className="text-[10px] text-amber-300/90 italic truncate flex items-center gap-1">
                          <MessageSquare className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                          <span className="truncate">&quot;{session.lastChangeCaption}&quot;</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2.5 border-t border-[#1F1F1F] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenAttendance(session, 'roster')}
                    className={`flex-1 py-1.5 sm:py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      stats.isMass
                        ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35'
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5" />
                    <span>{stats.isMass ? 'Open Mass Attendance' : 'Mark Attendance Sheet'}</span>
                  </button>

                  {/* History View CTA */}
                  <button
                    onClick={() => handleOpenAttendance(session, 'history')}
                    className="py-1.5 sm:py-2 px-2.5 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] text-neutral-300 hover:text-white border border-[#2E2E2E] text-xs font-semibold transition-all flex items-center gap-1"
                    title="View Change History & Audit Logs"
                  >
                    <History className="w-3.5 h-3.5 text-purple-400" />
                    {historyCount > 0 && (
                      <span className="text-[9px] px-1 rounded bg-purple-500/20 text-purple-300 font-bold font-mono">
                        {historyCount}
                      </span>
                    )}
                  </button>

                  {/* Delete button */}
                  {deleteConfirmId === session.id ? (
                    <div className="flex items-center gap-1 bg-rose-950/80 px-1.5 py-1 rounded-xl border border-rose-500/40 animate-in fade-in duration-150">
                      <span className="text-[9px] text-rose-300 font-bold">Delete?</span>
                      <button
                        id={`confirm-delete-attendance-practice-${session.id}`}
                        onClick={() => handleDeletePractice(session.id)}
                        className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-sm"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-1 py-0.5 rounded text-[9px] text-neutral-400 hover:text-white"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      id={`delete-attendance-practice-${session.id}`}
                      onClick={() => setDeleteConfirmId(session.id)}
                      className="p-1.5 sm:p-2 rounded-xl text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                      title="Delete Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule / Past Practice Creation Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#141414] w-full max-w-lg rounded-t-3xl sm:rounded-3xl border-t sm:border border-[#2A2A2A] shadow-2xl p-5 sm:p-6 space-y-3.5 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">
                    {newDate < todayStr ? 'Log Past / Historical Attendance' : 'Schedule Attendance Session'}
                  </h3>
                  <p className="text-[10px] text-neutral-400">
                    Record rehearsal or Holy Mass attendance with automatic expected members calculation
                  </p>
                </div>
              </div>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-neutral-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePractice} className="space-y-3">
              {/* Type Switcher: Practice vs Mass */}
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">Session Category</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setNewSessionType('practice');
                      setNewEvent('Parish Feast & Nine Novenas');
                      setNewFocus('Hymn Repertoire & Vocal Parts');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      newSessionType === 'practice'
                        ? 'bg-emerald-500 text-neutral-950 border-emerald-400 font-black shadow-md'
                        : 'bg-[#1A1A1A] text-neutral-400 hover:text-white border-[#2E2E2E]'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>Choir Practice / Rehearsal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setNewSessionType('mass');
                      setNewEvent('Tuesday Holy Mass');
                      setNewFocus('Tuesday Holy Mass Attendance');
                      setNewTime('6:00 PM');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      newSessionType === 'mass'
                        ? 'bg-amber-500 text-neutral-950 border-amber-400 font-black shadow-md'
                        : 'bg-[#1A1A1A] text-neutral-400 hover:text-white border-[#2E2E2E]'
                    }`}
                  >
                    <Church className="w-3.5 h-3.5" />
                    <span>Holy Mass Attendance</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1 flex items-center justify-between">
                    <span>Date</span>
                    {newDate < todayStr && <span className="text-[9px] text-amber-400 font-normal">(Past Date)</span>}
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">Time</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 6:00 PM"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">Venue</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. St. Michael's Church Choir Loft"
                  value={newVenue}
                  onChange={(e) => setNewVenue(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">Associated Liturgical Service / Program</label>
                <select
                  value={newEvent}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewEvent(val);
                    const isMassChoice = val.includes('Mass') && !val.includes('Feast');
                    if (isMassChoice) {
                      setNewSessionType('mass');
                      setNewFocus(`${val} Attendance`);
                    } else {
                      setNewSessionType('practice');
                      setNewFocus('Hymn Repertoire & Vocal Parts');
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <optgroup label="Weekly & Sunday Holy Masses">
                    <option value="Tuesday Holy Mass">Tuesday Holy Mass (6:00 PM)</option>
                    <option value="Thursday - Novena And Holy Mass">Thursday - Novena And Holy Mass (6:00 PM)</option>
                    <option value="First Friday Holy Mass">First Friday Holy Mass (6:00 PM)</option>
                    <option value="Saturday Sunday Mass 6">Saturday Sunday Mass 6 (Sat 6pm)</option>
                    <option value="Sunday Morning Mass 6.30">Sunday Morning Mass 6.30 (6:30 AM Early)</option>
                    <option value="Sunday Morning Mass 8">Sunday Morning Mass 8 (8:00 AM Main)</option>
                    <option value="Saturday English Mass">Saturday English Mass (7:00 AM)</option>
                  </optgroup>
                  <optgroup label="Rehearsals & Major Events">
                    <option value="Parish Feast & Nine Novenas">Parish Feast &amp; Nine Novenas</option>
                    <option value="Festival of Nine Lessons and Carols">Festival of Nine Lessons and Carols</option>
                    <option value="Christmas & New Year">Christmas &amp; New Year</option>
                    <option value="Easter & Holy Week">Easter &amp; Holy Week</option>
                    <option value="General Choir Practice">General Choir Repertoire Practice</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">Focus / Hymns</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Responsorial Psalm tone, Marian Offertory, Latin Motets"
                  value={newFocus}
                  onChange={(e) => setNewFocus(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">Notes / Instructions</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Organist accompaniment by Shevon; Bring green hymnal folders"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2.5 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold shadow-md shadow-emerald-500/20"
                >
                  {newDate < todayStr ? 'Create Past Record' : 'Save Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Mobile-First Mark Attendance Modal with A-Z Index & Search */}
      {activeSessionForAttendance && activeSessionStats && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4">
          <div className="bg-[#141414] w-full max-w-3xl sm:rounded-3xl border-t sm:border border-[#2A2A2A] shadow-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95">
            
            {/* Modal Header - Accurate Committed Metrics */}
            <div className="px-4 py-3 sm:p-5 border-b border-[#222222] bg-[#0E0E0E] shrink-0 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`p-1.5 rounded-xl shrink-0 ${
                    activeSessionStats.isMass ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {activeSessionStats.isMass ? <Church className="w-4 h-4" /> : <ClipboardCheck className="w-4 h-4" />}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-white text-sm sm:text-base truncate flex items-center gap-1.5">
                      <span>{activeSessionForAttendance.eventTitle || activeSessionForAttendance.focus}</span>
                      <span className="font-mono text-emerald-400 text-xs">({activeSessionForAttendance.date})</span>
                    </h3>
                    <p className="text-[10px] sm:text-xs text-neutral-400 truncate">
                      {activeSessionForAttendance.venue} • {activeSessionForAttendance.startTime || 'Scheduled'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Session Switcher on desktop/tablet */}
                  <select
                    value={activeSessionForAttendance.id}
                    onChange={(e) => handleSwitchSession(e.target.value)}
                    className="hidden sm:block px-2 py-1 bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg text-white text-[11px] focus:outline-none focus:border-emerald-500 truncate max-w-[160px]"
                    title="Switch between practice sessions"
                  >
                    {practices.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.date} • {p.eventTitle || p.focus.substring(0, 15)}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setActiveSessionForAttendance(null)}
                    className="text-neutral-400 hover:text-white p-1 rounded-lg bg-[#1C1C1C] hover:bg-[#282828] transition-all"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Subtabs Bar & Accurate Percentage Display */}
              <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-[#1A1A1A]">
                <div className="flex items-center gap-1 bg-[#1A1A1A] p-0.5 rounded-xl border border-[#2A2A2A]">
                  <button
                    onClick={() => setModalTab('roster')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
                      modalTab === 'roster'
                        ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <UserCheck className="w-3 h-3" />
                    <span>Roster</span>
                    {modifiedCount > 0 && (
                      <span className="px-1 rounded-full text-[9px] bg-amber-400 text-neutral-950 font-black">
                        {modifiedCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setModalTab('history')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
                      modalTab === 'history'
                        ? 'bg-purple-500 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <History className="w-3 h-3" />
                    <span>History</span>
                    {activeSessionForAttendance.changeLog && activeSessionForAttendance.changeLog.length > 0 && (
                      <span className="px-1 rounded-full text-[9px] bg-white/20 text-white font-mono">
                        {activeSessionForAttendance.changeLog.length}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setModalTab('edit-details')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
                      modalTab === 'edit-details'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Details</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Live Count Pill - Committed Turnout */}
                  <div className="flex items-center gap-1.5 text-[10px] text-neutral-300 bg-[#161616] px-2.5 py-1 rounded-xl border border-[#262626]">
                    <span className="text-neutral-400">Committed:</span>
                    <strong className="text-emerald-400 font-black">
                      {modalLiveStats.committedPresent}/{modalLiveStats.committedTotal} ({modalLiveStats.committedPct}%)
                    </strong>
                  </div>

                  {/* Modal Quick Copy Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      id="modal-copy-present-btn"
                      onClick={() => {
                        const snap: PracticeSession = {
                          ...activeSessionForAttendance,
                          attendance: attendanceRecords,
                        };
                        handleCopyAttendance(snap, 'present');
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                        copiedSessionKey === `${activeSessionForAttendance.id}-present`
                          ? 'bg-emerald-500 text-neutral-950 border-emerald-400 font-black shadow-sm'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                      title="Copy present list using display short names"
                    >
                      {copiedSessionKey === `${activeSessionForAttendance.id}-present` ? (
                        <Check className="w-3 h-3 text-neutral-950 stroke-[3]" />
                      ) : (
                        <Copy className="w-3 h-3 text-emerald-400" />
                      )}
                      <span>Copy Present</span>
                    </button>

                    <button
                      type="button"
                      id="modal-copy-absent-btn"
                      onClick={() => {
                        const snap: PracticeSession = {
                          ...activeSessionForAttendance,
                          attendance: attendanceRecords,
                        };
                        handleCopyAttendance(snap, 'absent');
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-bold transition-all ${
                        copiedSessionKey === `${activeSessionForAttendance.id}-absent`
                          ? 'bg-rose-500 text-white border-rose-400 font-black shadow-sm'
                          : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                      title="Copy absent list using display short names"
                    >
                      {copiedSessionKey === `${activeSessionForAttendance.id}-absent` ? (
                        <Check className="w-3 h-3 text-white stroke-[3]" />
                      ) : (
                        <Copy className="w-3 h-3 text-rose-400" />
                      )}
                      <span>Copy Absent</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB 1: MARK ROSTER (Mobile-Optimized with A-Z Quick Jump & Committed Toggle) */}
            {modalTab === 'roster' && (
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Search Bar, Committed Scope Toggle & A-Z Strip */}
                <div className="p-2.5 sm:p-3 bg-[#171717] border-b border-[#222222] shrink-0 space-y-2">
                  
                  {/* Committed Scope Selector (People who said they're coming vs Full Choir) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 bg-[#121212] p-0.5 rounded-xl border border-[#282828] text-[10px]">
                      <button
                        type="button"
                        onClick={() => setRosterTargetScope('committed')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                          rosterTargetScope === 'committed'
                            ? 'bg-amber-400 text-neutral-950 shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Expected / Committed Only ({committedChoristerIds.size})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRosterTargetScope('all')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                          rosterTargetScope === 'all'
                            ? 'bg-neutral-200 text-neutral-950 shadow-sm'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <Users className="w-3 h-3" />
                        <span>All Choir ({attendanceRecords.length})</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleMarkAll('Present')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 shrink-0"
                      title="Mark visible members Present"
                    >
                      ✓ Mark Filtered Present
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search member by name, phone, voice preference..."
                      value={rosterSearch}
                      onChange={(e) => {
                        setRosterSearch(e.target.value);
                        if (e.target.value) setSelectedLetter('ALL');
                      }}
                      className="w-full pl-8 pr-8 py-1.5 bg-[#101010] border border-[#2E2E2E] focus:border-emerald-500 rounded-xl text-white text-xs placeholder:text-neutral-500 focus:outline-none"
                    />
                    {rosterSearch && (
                      <button
                        onClick={() => setRosterSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* A-Z Fast Letter Scroller Strip */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                    <button
                      onClick={() => setSelectedLetter('ALL')}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 transition-all ${
                        selectedLetter === 'ALL'
                          ? 'bg-emerald-500 text-neutral-950 shadow-sm'
                          : 'bg-[#202020] text-neutral-400 hover:text-white border border-[#2E2E2E]'
                      }`}
                    >
                      ALL ({filteredRoster.length})
                    </button>

                    {availableLetters.map((letter) => {
                      const isSelected = selectedLetter === letter;

                      return (
                        <button
                          key={letter}
                          onClick={() => {
                            setSelectedLetter(letter);
                            setRosterSearch('');
                          }}
                          className={`w-6 h-6 rounded-lg text-[10px] font-black shrink-0 transition-all flex items-center justify-center ${
                            isSelected
                              ? 'bg-amber-400 text-neutral-950 scale-110 shadow-sm'
                              : 'bg-[#222222] text-neutral-300 hover:text-white hover:bg-[#2A2A2A] border border-[#2E2E2E]'
                          }`}
                        >
                          {letter}
                        </button>
                      );
                    })}
                  </div>

                  {/* Role & Status Filter Chips */}
                  <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
                    <div className="flex items-center gap-1 shrink-0">
                      {(['all', 'Chorister', 'Organist'] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setRosterRoleFilter(r)}
                          className={`px-2 py-0.5 rounded-md font-semibold whitespace-nowrap transition-all ${
                            rosterRoleFilter === r
                              ? 'bg-neutral-200 text-neutral-950 font-bold'
                              : 'bg-[#202020] text-neutral-400 hover:text-white'
                          }`}
                        >
                          {r === 'all' ? 'All Roles' : r}
                        </button>
                      ))}

                      <span className="text-neutral-600">|</span>

                      {(['all', 'Present', 'Late', 'Excused', 'Absent'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setRosterStatusFilter(st)}
                          className={`px-1.5 py-0.5 rounded-md font-semibold whitespace-nowrap transition-all ${
                            rosterStatusFilter === st
                              ? st === 'Present'
                                ? 'bg-emerald-500 text-neutral-950 font-bold'
                                : st === 'Late'
                                ? 'bg-amber-500 text-neutral-950 font-bold'
                                : st === 'Excused'
                                ? 'bg-blue-500 text-white font-bold'
                                : st === 'Absent'
                                ? 'bg-rose-500 text-white font-bold'
                                : 'bg-neutral-200 text-neutral-950 font-bold'
                              : 'bg-[#202020] text-neutral-400 hover:text-white'
                          }`}
                        >
                          {st === 'all' ? 'All' : st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Choristers List */}
                <div 
                  ref={rosterListRef}
                  className="p-2 sm:p-3 overflow-y-auto space-y-1.5 flex-1 divide-y divide-[#1D1D1D]/50"
                >
                  {filteredRoster.length === 0 ? (
                    <div className="p-6 text-center bg-[#181818] rounded-2xl border border-[#262626] space-y-2">
                      <Search className="w-6 h-6 text-neutral-600 mx-auto" />
                      <div className="text-xs font-bold text-neutral-300">
                        No choristers match current filters
                      </div>
                      <button
                        onClick={() => {
                          setRosterSearch('');
                          setSelectedLetter('ALL');
                          setRosterRoleFilter('all');
                          setRosterStatusFilter('all');
                          setRosterTargetScope('all');
                        }}
                        className="text-xs text-emerald-400 hover:underline font-semibold"
                      >
                        Reset filters and show full choir
                      </button>
                    </div>
                  ) : (
                    filteredRoster.map((rec) => {
                      const chorister = choristers.find((c) => c.id === rec.choristerId);
                      const isOrganist = chorister?.role === 'Organist';
                      const isBirthday = chorister?.birthdate ? isBirthdayToday(chorister.birthdate) : false;
                      const isCommitted = committedChoristerIds.has(rec.choristerId);
                      const initRecord = initialAttendanceMap.get(rec.choristerId);
                      const isModified = initRecord && (initRecord.status !== rec.status || (initRecord.notes || '') !== (rec.notes || ''));
                      const isNoteExpanded = expandedNotesChoristerId === rec.choristerId || Boolean(rec.notes);

                      return (
                        <div
                          key={rec.choristerId}
                          className={`p-2 sm:p-2.5 rounded-xl border transition-all space-y-1.5 ${
                            isModified
                              ? 'bg-amber-950/20 border-amber-500/40'
                              : isBirthday
                              ? 'bg-amber-500/10 border-amber-500/35'
                              : isCommitted
                              ? 'bg-[#181818] border-[#292929]'
                              : 'bg-[#141414]/60 border-[#1F1F1F]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            {/* Member info & Quick 1-Tap Cycle */}
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {/* Avatar circle */}
                              <button
                                type="button"
                                onClick={() => handleCycleStatus(rec.choristerId, rec.status)}
                                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border transition-all ${
                                  rec.status === 'Present'
                                    ? 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-sm'
                                    : rec.status === 'Late'
                                    ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                                    : rec.status === 'Excused'
                                    ? 'bg-blue-500 text-white border-blue-400 shadow-sm'
                                    : 'bg-rose-600 text-white border-rose-500 shadow-sm'
                                }`}
                                title="Tap avatar to quick-cycle status (Present ➔ Late ➔ Excused ➔ Absent)"
                              >
                                {rec.choristerName.charAt(0)}
                              </button>

                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap leading-tight">
                                  <span className="truncate">{rec.choristerName}</span>
                                  {isCommitted && (
                                    <span className="px-1 py-0.2 rounded text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold shrink-0">
                                      Committed
                                    </span>
                                  )}
                                  {isBirthday && (
                                    <span 
                                      className="px-1 py-0.2 rounded-full text-[8px] bg-amber-400 text-neutral-950 font-black flex items-center gap-0.5 animate-pulse shrink-0"
                                      title="Birthday Today!"
                                    >
                                      <Cake className="w-2.5 h-2.5" />
                                      <span>B'day</span>
                                    </span>
                                  )}
                                  {isOrganist && (
                                    <span className="px-1 py-0.2 rounded text-[8px] bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                                      Organist
                                    </span>
                                  )}
                                  {isModified && (
                                    <span className="text-[8px] text-amber-400 font-bold shrink-0">
                                      ({initRecord?.status}→{rec.status})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-neutral-400 flex items-center gap-2 truncate">
                                  <span>{chorister?.phoneNumber || 'No phone'}</span>
                                  {chorister?.weeklyMassPreference && (
                                    <span className="text-neutral-500 truncate hidden sm:inline">• {chorister.weeklyMassPreference}</span>
                                  )}
                                  {rec.notes && <span className="text-amber-300/80 italic truncate">• &quot;{rec.notes}&quot;</span>}
                                </div>
                              </div>
                            </div>

                            {/* 4 Thumb-Friendly Segmented Status Buttons */}
                            <div className="flex items-center gap-1 shrink-0">
                              {(['Present', 'Late', 'Excused', 'Absent'] as AttendanceStatus[]).map((st) => {
                                const isSelected = rec.status === st;
                                const label = st === 'Present' ? 'P' : st === 'Late' ? 'L' : st === 'Excused' ? 'E' : 'A';
                                
                                let activeClass = 'bg-[#222222] text-neutral-400 hover:text-white';
                                if (isSelected) {
                                  if (st === 'Present') activeClass = 'bg-emerald-500 text-neutral-950 font-black shadow-sm';
                                  else if (st === 'Late') activeClass = 'bg-amber-500 text-neutral-950 font-black shadow-sm';
                                  else if (st === 'Excused') activeClass = 'bg-blue-500 text-white font-black shadow-sm';
                                  else if (st === 'Absent') activeClass = 'bg-rose-600 text-white font-black shadow-sm';
                                }

                                return (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => handleSetStatus(rec.choristerId, st)}
                                    className={`w-7 h-7 sm:w-auto sm:px-2.5 sm:py-1 rounded-lg text-[11px] font-bold flex items-center justify-center transition-all ${activeClass}`}
                                    title={`Mark ${st}`}
                                  >
                                    <span className="sm:hidden">{label}</span>
                                    <span className="hidden sm:inline">{st}</span>
                                  </button>
                                );
                              })}

                              {/* Toggle Remark input */}
                              <button
                                type="button"
                                onClick={() => setExpandedNotesChoristerId(isNoteExpanded ? null : rec.choristerId)}
                                className={`p-1 rounded-lg text-[10px] transition-all ${
                                  rec.notes 
                                    ? 'text-amber-400 bg-amber-500/15 border border-amber-500/30' 
                                    : 'text-neutral-500 hover:text-neutral-300 bg-[#202020]'
                                }`}
                                title="Add remark / note"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Expandable Note Input */}
                          {isNoteExpanded && (
                            <div className="pt-1 flex items-center gap-1.5 animate-in fade-in duration-100">
                              <input
                                type="text"
                                placeholder="Add note (e.g. excused - sick, transport delay)..."
                                value={rec.notes || ''}
                                onChange={(e) => handleSetChoristerNote(rec.choristerId, e.target.value)}
                                className="w-full px-2 py-1 bg-[#101010] border border-[#2E2E2E] rounded-lg text-white text-[11px] placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                                autoFocus={expandedNotesChoristerId === rec.choristerId && !rec.notes}
                              />
                              {rec.notes && (
                                <button
                                  onClick={() => handleSetChoristerNote(rec.choristerId, '')}
                                  className="text-neutral-500 hover:text-rose-400 p-1 text-[10px]"
                                  title="Clear note"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: AUDIT TRAIL & REVISION LOG */}
            {modalTab === 'history' && (
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#222222] pb-2.5">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Audit Trail &amp; Revision Log</span>
                    </h4>
                    <p className="text-[10px] sm:text-xs text-neutral-400 mt-0.5">
                      Tracks every modification, who changed what, timestamps, and editor captions.
                    </p>
                  </div>
                </div>

                {!activeSessionForAttendance.changeLog || activeSessionForAttendance.changeLog.length === 0 ? (
                  <div className="p-6 text-center bg-[#181818] rounded-2xl border border-[#242424] space-y-2">
                    <History className="w-6 h-6 text-neutral-600 mx-auto" />
                    <div className="text-xs font-bold text-neutral-300">No revisions logged yet for this session</div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeSessionForAttendance.changeLog.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-xl bg-[#181818] border border-[#2A2A2A] space-y-2 hover:border-[#383838] transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[11px]">
                              {log.editorName ? log.editorName.charAt(0) : 'U'}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-1">
                                <span>{log.editorName}</span>
                                <span className="px-1 py-0.2 rounded text-[8px] bg-neutral-800 text-neutral-300 border border-neutral-700">
                                  {log.editorRole}
                                </span>
                              </div>
                              <div className="text-[9px] text-neutral-400 font-mono">
                                {log.formattedDate || log.timestamp}
                              </div>
                            </div>
                          </div>

                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            {log.actionType || 'Updated'}
                          </span>
                        </div>

                        {/* Caption / Note */}
                        {log.caption && (
                          <div className="bg-[#101010] p-2 rounded-xl border border-amber-500/20 text-[11px] text-amber-300 flex items-start gap-1.5">
                            <MessageSquare className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-amber-400 text-[10px] block">Caption:</span>
                              <span className="italic">&quot;{log.caption}&quot;</span>
                            </div>
                          </div>
                        )}

                        {/* Summary description */}
                        <div className="text-[11px] text-neutral-300">
                          {log.summary}
                        </div>

                        {/* Specific Chorister Transition Details */}
                        {log.changesDetails && log.changesDetails.length > 0 && (
                          <div className="pt-1.5 border-t border-[#242424] space-y-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                              Status Modifications:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                              {log.changesDetails.map((detail, idx) => (
                                <div
                                  key={idx}
                                  className="text-[10px] p-1.5 rounded-lg bg-[#121212] border border-[#222222] flex items-center justify-between gap-1"
                                >
                                  <span className="font-semibold text-white truncate">{detail.choristerName}</span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <span className="px-1 py-0.2 rounded text-[9px] bg-neutral-800 text-neutral-400">
                                      {detail.fromStatus}
                                    </span>
                                    <ArrowRight className="w-2.5 h-2.5 text-neutral-500" />
                                    <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                                      detail.toStatus === 'Present'
                                        ? 'bg-emerald-500/20 text-emerald-300'
                                        : detail.toStatus === 'Late'
                                        ? 'bg-amber-500/20 text-amber-300'
                                        : detail.toStatus === 'Excused'
                                        ? 'bg-blue-500/20 text-blue-300'
                                        : 'bg-rose-500/20 text-rose-300'
                                    }`}>
                                      {detail.toStatus}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: EDIT SESSION DETAILS */}
            {modalTab === 'edit-details' && (
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3.5">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-blue-400" />
                    <span>Edit Session Schedule &amp; Details</span>
                  </h4>
                  <p className="text-[10px] sm:text-xs text-neutral-400 mt-0.5">
                    Modify the date, venue, rehearsal hymns, or liturgical event associated with this attendance sheet.
                  </p>
                </div>

                <div className="space-y-3 bg-[#181818] p-3.5 rounded-2xl border border-[#282828]">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-300 mb-1">Date</label>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#101010] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-300 mb-1">Time</label>
                      <input
                        type="text"
                        placeholder="e.g. 6:00 PM"
                        value={editTime}
                        onChange={(e) => setEditTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#101010] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">Venue</label>
                    <input
                      type="text"
                      placeholder="e.g. Church Choir Loft"
                      value={editVenue}
                      onChange={(e) => setEditVenue(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#101010] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">Liturgical Event / Program</label>
                    <input
                      type="text"
                      placeholder="e.g. Tuesday Holy Mass, Parish Feast & Nine Novenas"
                      value={editEventTitle}
                      onChange={(e) => setEditEventTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#101010] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">Rehearsal Focus / Hymns</label>
                    <input
                      type="text"
                      placeholder="e.g. Responsorial Psalm, Latin Mass Ordinary, Marian Antiphon"
                      value={editFocus}
                      onChange={(e) => setEditFocus(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#101010] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">Notes &amp; Directives</label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Organist: Shevon Fernando; Bring green folders"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-[#101010] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Modal Sticky Footer */}
            <div className="p-3 sm:p-4 border-t border-[#222222] bg-[#0E0E0E] shrink-0 space-y-2">
              {/* Caption Input for Audit Logging */}
              <div className="flex items-center gap-1.5 bg-[#161616] p-1.5 sm:p-2 rounded-xl border border-[#282828]">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
                <input
                  type="text"
                  placeholder="Optional caption: e.g., 'Recorded attendance for Mass - 10 confirmed members arrived'"
                  value={changeCaption}
                  onChange={(e) => setChangeCaption(e.target.value)}
                  className="w-full px-2 py-1 bg-transparent border-none text-white text-xs placeholder:text-neutral-600 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] text-neutral-400 truncate">
                  Logged by: <strong className="text-neutral-200">{activeMember.name}</strong>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSessionForAttendance(null)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveAttendanceSheet}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save &amp; Record Changes</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
