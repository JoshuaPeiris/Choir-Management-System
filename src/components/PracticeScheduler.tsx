import React, { useState, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Target, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Users, 
  Printer, 
  Sparkles, 
  CheckCheck,
  Search,
  X,
  CalendarPlus,
  RefreshCw,
  FileText
} from 'lucide-react';
import { 
  Chorister, 
  CommitteeMember, 
  PracticeSession, 
  PracticeAttendanceRecord, 
  AttendanceStatus,
  AttendanceChangeLogEntry,
  AttendanceChangeDetail
} from '../types';
import { CHOIR_LOGO_URL } from '../utils/driveImage';

interface PracticeSchedulerProps {
  practices?: PracticeSession[];
  eventTitle: string;
  choristers: Chorister[];
  activeMember: CommitteeMember;
  onSavePractices: (updatedPractices: PracticeSession[]) => Promise<void>;
  onDeletePractice?: (practiceId: string) => Promise<void> | void;
}

export const PracticeScheduler: React.FC<PracticeSchedulerProps> = ({
  practices = [],
  eventTitle,
  choristers,
  activeMember,
  onSavePractices,
  onDeletePractice,
}) => {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingPracticeId, setEditingPracticeId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [practiceForm, setPracticeForm] = useState<{
    date: string;
    startTime: string;
    endTime: string;
    venue: string;
    focus: string;
    notes: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    startTime: '17:00',
    endTime: '19:00',
    venue: 'Church Choir Loft',
    focus: '',
    notes: '',
  });

  // Attendance Sheet Modal State
  const [attendanceModalSession, setAttendanceModalSession] = useState<PracticeSession | null>(null);
  const [initialAttendanceMap, setInitialAttendanceMap] = useState<Map<string, PracticeAttendanceRecord>>(new Map());
  const [activeAttendanceFilter, setActiveAttendanceFilter] = useState<'All' | 'Chorister' | 'Organist'>('All');
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('');
  const [attendanceSelectedLetter, setAttendanceSelectedLetter] = useState('ALL');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Active singers excluding instrument players (who are kept solely in the database)
  const activeSingers = useMemo(
    () => choristers.filter((c) => c.role !== 'Instrument Player'),
    [choristers]
  );

  // Helper to calculate attendance stats for any practice session
  const calculateAttendance = (session: PracticeSession) => {
    const records = session.attendance || [];
    const total = records.length;
    const present = records.filter((r) => r.status === 'Present').length;
    const late = records.filter((r) => r.status === 'Late').length;
    const excused = records.filter((r) => r.status === 'Excused').length;
    const absent = records.filter((r) => r.status === 'Absent').length;
    const attended = present + late;
    const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;

    return {
      total,
      present,
      late,
      excused,
      absent,
      attended,
      percentage,
    };
  };

  // Overall Statistics across all practices in this tab
  const totalPractices = practices.length;
  const overallStats = practices.reduce(
    (acc, p) => {
      const stats = calculateAttendance(p);
      acc.totalRoster += stats.total;
      acc.totalAttended += stats.attended;
      acc.totalPresent += stats.present;
      acc.totalLate += stats.late;
      acc.totalExcused += stats.excused;
      acc.totalAbsent += stats.absent;
      return acc;
    },
    { totalRoster: 0, totalAttended: 0, totalPresent: 0, totalLate: 0, totalExcused: 0, totalAbsent: 0 }
  );

  const averageAttendanceRate =
    overallStats.totalRoster > 0
      ? Math.round((overallStats.totalAttended / overallStats.totalRoster) * 100)
      : 0;

  // Open Schedule Modal (Create or Edit)
  const handleOpenScheduleModal = (practice?: PracticeSession) => {
    if (practice) {
      setEditingPracticeId(practice.id);
      setPracticeForm({
        date: practice.date || new Date().toISOString().split('T')[0],
        startTime: practice.startTime || '17:00',
        endTime: practice.endTime || '19:00',
        venue: practice.venue || 'Church Choir Loft',
        focus: practice.focus || '',
        notes: practice.notes || '',
      });
    } else {
      setEditingPracticeId(null);
      const last = practices.length > 0 ? practices[0] : null;
      setPracticeForm({
        date: new Date().toISOString().split('T')[0],
        startTime: last?.startTime || '17:00',
        endTime: last?.endTime || '19:00',
        venue: last?.venue || 'Church Choir Loft',
        focus: last?.focus || `Practice for ${eventTitle}`,
        notes: last?.notes || 'Bring choir hymnal sheets, score folders, and pencils.',
      });
    }
    setIsScheduleModalOpen(true);
  };

  // Save Scheduled Practice
  const handleSavePracticeForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!practiceForm.date || !practiceForm.startTime || !practiceForm.venue) {
      alert('Please fill in Date, Start Time, and Venue.');
      return;
    }

    let updatedPractices = [...practices];

    if (editingPracticeId) {
      updatedPractices = updatedPractices.map((p) => {
        if (p.id === editingPracticeId) {
          return {
            ...p,
            ...practiceForm,
            eventTitle: p.eventTitle || eventTitle,
          };
        }
        return p;
      });
    } else {
      // Build initial attendance roster from active choristers (excluding instrument players)
      const initialAttendance: PracticeAttendanceRecord[] = activeSingers.map((c) => ({
        choristerId: c.id,
        choristerName: c.name,
        role: c.role,
        status: 'Absent' as AttendanceStatus,
        notes: '',
      }));

      const newSession: PracticeSession = {
        id: `prac-${Date.now()}`,
        ...practiceForm,
        eventTitle: eventTitle,
        attendance: initialAttendance,
      };

      updatedPractices.unshift(newSession);
    }

    await onSavePractices(updatedPractices);
    setIsScheduleModalOpen(false);
    setEditingPracticeId(null);
  };

  // Delete Practice
  const handleDeletePractice = async (practiceId: string) => {
    setDeleteConfirmId(null);
    const updated = practices.filter((p) => p.id !== practiceId);
    if (onDeletePractice) {
      await onDeletePractice(practiceId);
    } else {
      await onSavePractices(updated);
    }
    if (attendanceModalSession?.id === practiceId) {
      setAttendanceModalSession(null);
    }
  };

  // Open Attendance Sheet Modal
  const handleOpenAttendanceModal = (session: PracticeSession) => {
    // Check if session attendance needs synchronization with current active choristers
    let currentAttendance = (session.attendance || []).filter((a) => a.role !== 'Instrument Player');
    const existingIds = new Set(currentAttendance.map((a) => a.choristerId));

    // Add any newly registered choristers (excluding instrument players)
    activeSingers.forEach((c) => {
      if (!existingIds.has(c.id)) {
        currentAttendance.push({
          choristerId: c.id,
          choristerName: c.name,
          role: c.role,
          status: 'Absent',
          notes: '',
        });
      }
    });

    const snapshotMap = new Map<string, PracticeAttendanceRecord>();
    currentAttendance.forEach((r) => snapshotMap.set(r.choristerId, { ...r }));
    setInitialAttendanceMap(snapshotMap);

    const updatedSession = { ...session, attendance: currentAttendance };
    setAttendanceModalSession(updatedSession);
    setAttendanceSearchQuery('');
    setActiveAttendanceFilter('All');
  };

  // Update Individual Chorister Attendance Status
  const handleUpdateChoristerStatus = (choristerId: string, status: AttendanceStatus) => {
    if (!attendanceModalSession) return;
    const updatedAttendance = attendanceModalSession.attendance.map((record) => {
      if (record.choristerId === choristerId) {
        return { ...record, status };
      }
      return record;
    });

    setAttendanceModalSession({
      ...attendanceModalSession,
      attendance: updatedAttendance,
    });
  };

  // Update Individual Chorister Note
  const handleUpdateChoristerNote = (choristerId: string, notes: string) => {
    if (!attendanceModalSession) return;
    const updatedAttendance = attendanceModalSession.attendance.map((record) => {
      if (record.choristerId === choristerId) {
        return { ...record, notes };
      }
      return record;
    });

    setAttendanceModalSession({
      ...attendanceModalSession,
      attendance: updatedAttendance,
    });
  };

  // Bulk Actions
  const handleBulkSetStatus = (status: AttendanceStatus) => {
    if (!attendanceModalSession) return;
    const updatedAttendance = attendanceModalSession.attendance.map((record) => {
      // If a role filter is active, only change matching ones
      if (activeAttendanceFilter !== 'All' && record.role !== activeAttendanceFilter) {
        return record;
      }
      return { ...record, status };
    });

    setAttendanceModalSession({
      ...attendanceModalSession,
      attendance: updatedAttendance,
    });
  };

  // Sync with parish registry
  const handleSyncWithRegistry = () => {
    if (!attendanceModalSession) return;
    const existingMap = new Map<string, PracticeAttendanceRecord>(
      attendanceModalSession.attendance.map((r) => [r.choristerId, r])
    );
    const syncedAttendance: PracticeAttendanceRecord[] = activeSingers.map((c) => {
      const existing = existingMap.get(c.id);
      if (existing) {
        return {
          choristerId: existing.choristerId,
          choristerName: c.name,
          role: c.role,
          status: existing.status,
          notes: existing.notes,
        };
      }
      return {
        choristerId: c.id,
        choristerName: c.name,
        role: c.role,
        status: 'Absent',
        notes: '',
      };
    });

    setAttendanceModalSession({
      ...attendanceModalSession,
      attendance: syncedAttendance,
    });
  };

  // Save Attendance Sheet
  const handleSaveAttendanceSheet = async () => {
    if (!attendanceModalSession) return;

    const diffs: AttendanceChangeDetail[] = [];
    attendanceModalSession.attendance.forEach((curr) => {
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

    const now = new Date();
    const formattedDate = now.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    let newChangeLog = [...(attendanceModalSession.changeLog || [])];
    if (diffs.length > 0) {
      const summary = `Modified ${diffs.length} attendance status${diffs.length === 1 ? '' : 'es'}: ${diffs.slice(0, 3).map((d) => `${d.choristerName} (${d.fromStatus} → ${d.toStatus})`).join(', ')}`;

      const logEntry: AttendanceChangeLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: now.toISOString(),
        formattedDate,
        editorName: activeMember.name,
        editorRole: activeMember.role,
        caption: `Updated ${eventTitle} practice attendance`,
        actionType: 'Status Changed',
        summary,
        changesDetails: diffs,
      };

      newChangeLog = [logEntry, ...newChangeLog];
    }

    const updatedSession: PracticeSession = {
      ...attendanceModalSession,
      changeLog: newChangeLog,
      lastModifiedBy: `${activeMember.name} (${activeMember.role})`,
      lastModifiedAt: formattedDate,
    };

    const updatedPractices = practices.map((p) =>
      p.id === attendanceModalSession.id ? updatedSession : p
    );
    await onSavePractices(updatedPractices);
    setAttendanceModalSession(null);
  };

  return (
    <div className="space-y-6">
      {/* Overview Analytics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#141414] border border-[#242424] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
              Total Practices
            </span>
            <div className="text-2xl font-black text-white mt-0.5">
              {totalPractices}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Scheduled for {eventTitle}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/20">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#141414] border border-[#242424] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
              Average Attendance
            </span>
            <div className={`text-2xl font-black mt-0.5 ${
              averageAttendanceRate >= 80 
                ? 'text-emerald-400' 
                : averageAttendanceRate >= 60 
                  ? 'text-amber-400' 
                  : 'text-neutral-300'
            }`}>
              {averageAttendanceRate}%
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Across all recorded sessions
            </div>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#141414] border border-[#242424] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
              Present / Attended
            </span>
            <div className="text-2xl font-black text-white mt-0.5">
              {overallStats.totalAttended} <span className="text-xs text-neutral-400 font-normal">/ {overallStats.totalRoster} logs</span>
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              {overallStats.totalLate} marked late
            </div>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#141414] border border-[#242424] p-4 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-semibold">
              Choristers on Roster
            </span>
            <div className="text-2xl font-black text-white mt-0.5">
              {choristers.length}
            </div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Active St. Cecilia choristers
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161616] p-4 rounded-2xl border border-[#282828]">
        <div>
          <h4 className="font-bold text-base text-white flex items-center gap-2">
            <CalendarPlus className="w-4 h-4 text-purple-400" />
            <span>Practice Schedule & Attendance Calculations</span>
          </h4>
          <p className="text-xs text-neutral-400 mt-0.5">
            Plan rehearsals, record chorister attendance, and automatically calculate choir attendance rates.
          </p>
        </div>

        <button
          id="schedule-new-practice-btn"
          onClick={() => handleOpenScheduleModal()}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Practice</span>
        </button>
      </div>

      {/* Practices List */}
      {practices.length === 0 ? (
        <div className="bg-[#121212] rounded-2xl border border-dashed border-[#2C2C2C] p-12 text-center text-neutral-400">
          <Calendar className="w-10 h-10 mx-auto mb-3 text-neutral-500" />
          <p className="font-bold text-base text-white">No practice sessions scheduled yet</p>
          <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
            Schedule choir rehearsals for {eventTitle} to organize date, time, venue, and automatically track and calculate member attendance.
          </p>
          <button
            onClick={() => handleOpenScheduleModal()}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule First Practice</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {practices.map((session) => {
            const stats = calculateAttendance(session);
            const isGoodAttendance = stats.percentage >= 80;
            const isMediumAttendance = stats.percentage >= 60 && stats.percentage < 80;

            return (
              <div
                key={session.id}
                id={`practice-card-${session.id}`}
                className="bg-[#141414] rounded-2xl p-5 border border-[#242424] hover:border-[#333333] transition-all shadow-lg flex flex-col justify-between group"
              >
                <div>
                  {/* Top Bar: Date & Status Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{session.date}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#1F1F1F] text-neutral-300 border border-[#2E2E2E] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-400" />
                          <span>{session.startTime} {session.endTime ? `– ${session.endTime}` : ''}</span>
                        </span>
                      </div>

                      <h5 className="font-extrabold text-base text-white tracking-tight mt-2 flex items-center gap-2">
                        <span>{session.focus || 'Choir Practice'}</span>
                      </h5>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenScheduleModal(session)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#222222] transition-colors"
                        title="Edit practice details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {deleteConfirmId === session.id ? (
                        <div className="flex items-center gap-1 bg-rose-950/80 px-2 py-0.5 rounded-lg border border-rose-500/40 animate-in fade-in duration-150">
                          <span className="text-[10px] text-rose-300 font-bold">Remove?</span>
                          <button
                            id={`confirm-delete-practice-${session.id}`}
                            onClick={() => handleDeletePractice(session.id)}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-sm"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="p-0.5 rounded text-neutral-400 hover:text-white"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          id={`delete-practice-btn-${session.id}`}
                          onClick={() => setDeleteConfirmId(session.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                          title="Delete practice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Venue & Notes */}
                  <div className="space-y-1.5 text-xs text-neutral-300 mb-4">
                    <div className="flex items-center gap-2 text-neutral-400">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{session.venue}</span>
                    </div>
                    {session.notes && (
                      <p className="text-[11px] text-neutral-400 pl-5 italic">
                        "{session.notes}"
                      </p>
                    )}
                  </div>

                  {/* ATTENDANCE CALCULATION WIDGET */}
                  <div className="bg-[#0F0F0F] rounded-xl p-3.5 border border-[#202020] space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Calculated Attendance</span>
                      </span>

                      {stats.total > 0 ? (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-tight border ${
                          isGoodAttendance
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : isMediumAttendance
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}>
                          {stats.percentage}% Attendance
                        </span>
                      ) : (
                        <span className="text-[10px] text-neutral-500">Not recorded</span>
                      )}
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full bg-[#202020] h-2 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-300" 
                        style={{ width: `${stats.total > 0 ? (stats.present / stats.total) * 100 : 0}%` }}
                        title={`Present: ${stats.present}`}
                      />
                      <div 
                        className="bg-amber-400 h-full transition-all duration-300" 
                        style={{ width: `${stats.total > 0 ? (stats.late / stats.total) * 100 : 0}%` }}
                        title={`Late: ${stats.late}`}
                      />
                      <div 
                        className="bg-blue-400 h-full transition-all duration-300" 
                        style={{ width: `${stats.total > 0 ? (stats.excused / stats.total) * 100 : 0}%` }}
                        title={`Excused: ${stats.excused}`}
                      />
                      <div 
                        className="bg-rose-500/60 h-full transition-all duration-300" 
                        style={{ width: `${stats.total > 0 ? (stats.absent / stats.total) * 100 : 0}%` }}
                        title={`Absent: ${stats.absent}`}
                      />
                    </div>

                    {/* Breakdown Numbers */}
                    <div className="grid grid-cols-4 gap-1 text-center pt-1">
                      <div className="bg-[#181818] p-1.5 rounded-lg border border-[#252525]">
                        <div className="text-[10px] text-neutral-400">Present</div>
                        <div className="font-extrabold text-xs text-emerald-400">{stats.present}</div>
                      </div>
                      <div className="bg-[#181818] p-1.5 rounded-lg border border-[#252525]">
                        <div className="text-[10px] text-neutral-400">Late</div>
                        <div className="font-extrabold text-xs text-amber-400">{stats.late}</div>
                      </div>
                      <div className="bg-[#181818] p-1.5 rounded-lg border border-[#252525]">
                        <div className="text-[10px] text-neutral-400">Excused</div>
                        <div className="font-extrabold text-xs text-blue-400">{stats.excused}</div>
                      </div>
                      <div className="bg-[#181818] p-1.5 rounded-lg border border-[#252525]">
                        <div className="text-[10px] text-neutral-400">Absent</div>
                        <div className="font-extrabold text-xs text-rose-400">{stats.absent}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Take / View Attendance CTA */}
                <div className="mt-4 pt-3 border-t border-[#202020] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-neutral-400">
                    {stats.total} choristers on roster
                  </span>

                  <button
                    id={`open-attendance-${session.id}`}
                    onClick={() => handleOpenAttendanceModal(session)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Calculate & Mark Attendance</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: SCHEDULE / EDIT PRACTICE */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#161616] border border-[#2C2C2C] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-[#242424]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  <CalendarPlus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-white">
                  {editingPracticeId ? 'Edit Practice Session' : 'Schedule New Practice'}
                </h3>
              </div>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#252525]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePracticeForm} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Practice Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={practiceForm.date}
                    onChange={(e) => setPracticeForm({ ...practiceForm, date: e.target.value })}
                    className="w-full bg-[#1F1F1F] border border-[#333333] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Venue / Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Church Choir Loft"
                    value={practiceForm.venue}
                    onChange={(e) => setPracticeForm({ ...practiceForm, venue: e.target.value })}
                    className="w-full bg-[#1F1F1F] border border-[#333333] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Quick venue presets */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="text-neutral-500">Presets:</span>
                {['Church Choir Loft', 'St. Michael Parish Hall', 'Church Sanctuary'].map((v) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setPracticeForm({ ...practiceForm, venue: v })}
                    className="px-2 py-0.5 rounded-md bg-[#222222] text-neutral-300 hover:bg-[#2C2C2C] hover:text-white text-[10px]"
                  >
                    {v}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={practiceForm.startTime}
                    onChange={(e) => setPracticeForm({ ...practiceForm, startTime: e.target.value })}
                    className="w-full bg-[#1F1F1F] border border-[#333333] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    End Time (Optional)
                  </label>
                  <input
                    type="time"
                    value={practiceForm.endTime}
                    onChange={(e) => setPracticeForm({ ...practiceForm, endTime: e.target.value })}
                    className="w-full bg-[#1F1F1F] border border-[#333333] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Practice Focus / Agenda *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mass Ordinary, Harmony Voicing & Entrance Hymn"
                  value={practiceForm.focus}
                  onChange={(e) => setPracticeForm({ ...practiceForm, focus: e.target.value })}
                  className="w-full bg-[#1F1F1F] border border-[#333333] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Instructions / Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please bring score sheets and pencils. Organist arrives 15 mins early."
                  value={practiceForm.notes}
                  onChange={(e) => setPracticeForm({ ...practiceForm, notes: e.target.value })}
                  className="w-full bg-[#1F1F1F] border border-[#333333] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {!editingPracticeId && (
                <div className="bg-[#121212] p-3 rounded-xl border border-[#242424] text-[11px] text-neutral-400 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>
                    Will initialize attendance ledger for all <strong>{choristers.length}</strong> active St. Cecilia choir members.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#242424]">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-[#222222]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-600/20"
                >
                  {editingPracticeId ? 'Update Practice' : 'Save Practice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ATTENDANCE LEDGER & CALCULATION SHEET */}
      {attendanceModalSession && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-[#141414] border-t sm:border border-[#2A2A2A] rounded-t-3xl sm:rounded-3xl w-full max-w-4xl h-[100dvh] sm:h-auto sm:max-h-[92vh] flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#222222] bg-[#181818] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-neutral-400 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    Attendance Ledger
                  </span>
                  <span>•</span>
                  <span className="text-white font-medium">{attendanceModalSession.date}</span>
                  <span>•</span>
                  <span>{attendanceModalSession.startTime} {attendanceModalSession.endTime ? `– ${attendanceModalSession.endTime}` : ''}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <span>{attendanceModalSession.focus || 'Choir Practice'}</span>
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{attendanceModalSession.venue}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="print-attendance-sheet-btn"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#222222] hover:bg-[#2A2A2A] text-neutral-200 border border-[#333333] transition-colors"
                  title="Print official attendance roster"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </button>
                <button
                  onClick={() => setAttendanceModalSession(null)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-[#222222]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* LIVE ATTENDANCE KPI SCOREBOARD */}
            {(() => {
              const liveStats = calculateAttendance(attendanceModalSession);
              return (
                <div className="p-4 bg-[#101010] border-b border-[#222222] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`px-4 py-2 rounded-2xl border text-center ${
                        liveStats.percentage >= 80
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : liveStats.percentage >= 60
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}>
                        <div className="text-2xl font-black">{liveStats.percentage}%</div>
                        <div className="text-[10px] font-bold uppercase tracking-wider">Attendance Rate</div>
                      </div>

                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-white">
                          {liveStats.attended} of {liveStats.total} Members Attended
                        </div>
                        <div className="text-neutral-400 text-[11px]">
                          {liveStats.present} Present • {liveStats.late} Late • {liveStats.excused} Excused • {liveStats.absent} Absent
                        </div>
                      </div>
                    </div>

                    {/* Quick Bulk Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleBulkSetStatus('Present')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-colors"
                      >
                        Mark All Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBulkSetStatus('Absent')}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-colors"
                      >
                        Mark All Absent
                      </button>
                      <button
                        type="button"
                        onClick={handleSyncWithRegistry}
                        className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-[#222222] border border-[#2C2C2C]"
                        title="Sync with latest parish choir registry"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Visual colored progress bar */}
                  <div className="w-full bg-[#202020] h-2.5 rounded-full overflow-hidden flex shadow-inner">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-200" 
                      style={{ width: `${liveStats.total > 0 ? (liveStats.present / liveStats.total) * 100 : 0}%` }}
                    />
                    <div 
                      className="bg-amber-400 h-full transition-all duration-200" 
                      style={{ width: `${liveStats.total > 0 ? (liveStats.late / liveStats.total) * 100 : 0}%` }}
                    />
                    <div 
                      className="bg-blue-400 h-full transition-all duration-200" 
                      style={{ width: `${liveStats.total > 0 ? (liveStats.excused / liveStats.total) * 100 : 0}%` }}
                    />
                    <div 
                      className="bg-rose-500/60 h-full transition-all duration-200" 
                      style={{ width: `${liveStats.total > 0 ? (liveStats.absent / liveStats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Filter and Search Bar */}
            <div className="p-2.5 sm:p-3 bg-[#161616] border-b border-[#222222] space-y-2">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-0.5 scrollbar-none">
                  {(['All', 'Chorister', 'Organist'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setActiveAttendanceFilter(filter)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                        activeAttendanceFilter === filter
                          ? 'bg-[#282828] text-white border border-[#3E3E3E]'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {filter === 'All' ? 'All Roles' : `${filter}s`}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search member by name..."
                    value={attendanceSearchQuery}
                    onChange={(e) => {
                      setAttendanceSearchQuery(e.target.value);
                      if (e.target.value) setAttendanceSelectedLetter('ALL');
                    }}
                    className="w-full bg-[#1F1F1F] border border-[#2E2E2E] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  {attendanceSearchQuery && (
                    <button
                      onClick={() => setAttendanceSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* A-Z Letter Jump Strip */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                <button
                  onClick={() => setAttendanceSelectedLetter('ALL')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 transition-all ${
                    attendanceSelectedLetter === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-[#202020] text-neutral-400 hover:text-white border border-[#2E2E2E]'
                  }`}
                >
                  ALL
                </button>

                {Array.from(new Set(choristers.map(c => c.name.trim().charAt(0).toUpperCase()))).sort().map((letter) => {
                  const isSelected = attendanceSelectedLetter === letter;
                  return (
                    <button
                      key={letter}
                      onClick={() => {
                        setAttendanceSelectedLetter(letter);
                        setAttendanceSearchQuery('');
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
            </div>

            {/* Chorister Attendance List (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 divide-y divide-[#1D1D1D]/60">
              {attendanceModalSession.attendance
                .filter((r) => {
                  if (activeAttendanceFilter !== 'All' && r.role !== activeAttendanceFilter) {
                    return false;
                  }
                  if (attendanceSelectedLetter !== 'ALL') {
                    if (r.choristerName.trim().charAt(0).toUpperCase() !== attendanceSelectedLetter) {
                      return false;
                    }
                  }
                  if (
                    attendanceSearchQuery &&
                    !r.choristerName.toLowerCase().includes(attendanceSearchQuery.toLowerCase())
                  ) {
                    return false;
                  }
                  return true;
                })
                .map((record) => (
                  <div
                    key={record.choristerId}
                    id={`attend-row-${record.choristerId}`}
                    className="pt-2.5 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#121212]/60 hover:bg-[#161616] p-2.5 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#202020] border border-[#303030] flex items-center justify-center font-bold text-xs text-neutral-200">
                        {record.choristerName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          <span>{record.choristerName}</span>
                          <span className={`px-2 py-0.2 rounded text-[10px] font-semibold border ${
                            record.role === 'Organist'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : record.role === 'Instrument Player'
                                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          }`}>
                            {record.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Attendance Status Selector (4 buttons) */}
                    <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                      {(
                        [
                          { key: 'Present', label: 'Present', color: 'emerald', icon: CheckCircle2 },
                          { key: 'Late', label: 'Late', color: 'amber', icon: Clock },
                          { key: 'Excused', label: 'Excused', color: 'blue', icon: AlertCircle },
                          { key: 'Absent', label: 'Absent', color: 'rose', icon: XCircle },
                        ] as const
                      ).map(({ key, label, color, icon: Icon }) => {
                        const isSelected = record.status === key;
                        return (
                          <button
                            type="button"
                            key={key}
                            onClick={() => handleUpdateChoristerStatus(record.choristerId, key)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isSelected
                                ? color === 'emerald'
                                  ? 'bg-emerald-500 text-neutral-950 font-black shadow-sm'
                                  : color === 'amber'
                                    ? 'bg-amber-400 text-neutral-950 font-black shadow-sm'
                                    : color === 'blue'
                                      ? 'bg-blue-500 text-white font-black shadow-sm'
                                      : 'bg-rose-600 text-white font-black shadow-sm'
                                : 'bg-[#1D1D1D] text-neutral-400 hover:text-white hover:bg-[#252525] border border-[#2E2E2E]'
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{label}</span>
                          </button>
                        );
                      })}

                      {/* Optional Note */}
                      <input
                        type="text"
                        placeholder="Remark..."
                        value={record.notes || ''}
                        onChange={(e) => handleUpdateChoristerNote(record.choristerId, e.target.value)}
                        className="bg-[#181818] border border-[#2A2A2A] rounded-lg px-2 py-1 text-[11px] text-neutral-300 placeholder:text-neutral-600 w-28 focus:outline-none focus:border-indigo-500"
                        title="Optional attendance note"
                      />
                    </div>
                  </div>
                ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#222222] bg-[#161616] flex items-center justify-between">
              <div className="text-xs text-neutral-400">
                Changes will be saved and synchronized across the choir portal.
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAttendanceModalSession(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAttendanceSheet}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20"
                >
                  Save & Update Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PRINTABLE ATTENDANCE ROSTER SHEET */}
      {isPrintModalOpen && attendanceModalSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-white text-black rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-300">
              <div className="flex items-center gap-3.5">
                <img 
                  src={CHOIR_LOGO_URL} 
                  alt="St. Cecilia's Choir" 
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full object-cover border-2 border-neutral-800 shadow-sm"
                />
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-neutral-900">
                    St. Cecilia's Choir • Practice Attendance Sheet
                  </h3>
                  <p className="text-xs text-neutral-600">
                    St. Michael's Church Koralawella — {eventTitle}
                  </p>
                  <div className="text-xs text-neutral-800 mt-1 font-semibold">
                    Date: {attendanceModalSession.date} | Time: {attendanceModalSession.startTime} | Venue: {attendanceModalSession.venue}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800"
                >
                  Print / PDF
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Attendance Calculation Summary Table */}
            {(() => {
              const printStats = calculateAttendance(attendanceModalSession);
              return (
                <div className="py-3 my-2 border-b border-neutral-200 flex items-center justify-between text-xs">
                  <div>
                    <strong>Total Registered:</strong> {printStats.total} members
                  </div>
                  <div>
                    <strong>Attended:</strong> {printStats.attended} ({printStats.present} Present, {printStats.late} Late)
                  </div>
                  <div>
                    <strong>Excused / Absent:</strong> {printStats.excused} Excused, {printStats.absent} Absent
                  </div>
                  <div className="font-black text-sm text-neutral-900">
                    Calculated Rate: {printStats.percentage}%
                  </div>
                </div>
              );
            })()}

            {/* Table of Choristers */}
            <div className="flex-1 overflow-y-auto mt-2">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-neutral-400 text-neutral-700">
                    <th className="py-2 px-1">#</th>
                    <th className="py-2 px-2">Member Name</th>
                    <th className="py-2 px-2">Role</th>
                    <th className="py-2 px-2">Status</th>
                    <th className="py-2 px-2">Remarks</th>
                    <th className="py-2 px-2">Signature</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {attendanceModalSession.attendance.map((r, i) => (
                    <tr key={r.choristerId}>
                      <td className="py-2 px-1 text-neutral-500">{i + 1}</td>
                      <td className="py-2 px-2 font-bold">{r.choristerName}</td>
                      <td className="py-2 px-2 text-neutral-600">{r.role}</td>
                      <td className="py-2 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'Present'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.status === 'Late'
                              ? 'bg-amber-100 text-amber-800'
                              : r.status === 'Excused'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-red-100 text-red-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-neutral-500 italic text-[11px]">{r.notes || '—'}</td>
                      <td className="py-2 px-2 text-neutral-300">____________</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pt-4 mt-2 border-t border-neutral-300 flex justify-between text-[11px] text-neutral-500">
              <span>Prepared by: {activeMember.name} ({activeMember.role})</span>
              <span>Authorized Signature: Joshua Peiris (President)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
