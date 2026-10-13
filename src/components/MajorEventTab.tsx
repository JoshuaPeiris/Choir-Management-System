import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  Calendar, 
  Clock, 
  Music, 
  DollarSign, 
  ShieldCheck, 
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Sliders,
  User
} from 'lucide-react';
import { 
  Chorister, 
  CommitteeMember, 
  MajorEvent, 
  WorkAndBudget,
  PracticeSession 
} from '../types';
import { WorkSubTab } from './WorkSubTab';
import { BudgetSubTab } from './BudgetSubTab';
import { formatDetailedCountdown } from '../utils/dateUtils';

interface MajorEventTabProps {
  event: MajorEvent;
  currentDate: Date;
  choristers: Chorister[];
  activeMember: CommitteeMember;
  allPractices?: PracticeSession[];
  onSavePractices?: (updatedPractices: PracticeSession[], description?: string) => Promise<void>;
  onDeletePractice?: (practiceId: string) => Promise<void> | void;
  onSaveWorkAndBudget: (updatedWork: WorkAndBudget) => Promise<void>;
  onSaveMajorEvent?: (updatedEvent: MajorEvent) => Promise<void> | void;
  onOpenCalendarModal: () => void;
}

export const MajorEventTab: React.FC<MajorEventTabProps> = ({
  event,
  currentDate,
  choristers,
  activeMember,
  allPractices = [],
  onSavePractices,
  onDeletePractice,
  onSaveWorkAndBudget,
  onSaveMajorEvent,
  onOpenCalendarModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'work' | 'budget'>('work');
  const [adminBypassPreview, setAdminBypassPreview] = useState(false);

  // Local state for Alleluia & Response persons in Christmas and New Year
  const [midnightAlleluia, setMidnightAlleluia] = useState(event.midnightAlleluia || '');
  const [midnightResponse, setMidnightResponse] = useState(event.midnightResponse || '');
  const [morningAlleluia, setMorningAlleluia] = useState(event.morningAlleluia || '');
  const [morningResponse, setMorningResponse] = useState(event.morningResponse || '');

  React.useEffect(() => {
    setMidnightAlleluia(event.midnightAlleluia || '');
    setMidnightResponse(event.midnightResponse || '');
    setMorningAlleluia(event.morningAlleluia || '');
    setMorningResponse(event.morningResponse || '');
  }, [event.id, event.midnightAlleluia, event.midnightResponse, event.morningAlleluia, event.morningResponse]);

  // Carols Session 1 (9 hymns for Nine Lessons) and Session 2 (Songs / Carols)
  const [session1Hymns, setSession1Hymns] = useState<Array<{ lessonNumber: number; title: string; lyrics: string }>>(() => {
    if (event.carolsSession1 && event.carolsSession1.length > 0) return event.carolsSession1;
    return Array.from({ length: 9 }, (_, i) => ({
      lessonNumber: i + 1,
      title: `Lesson ${i + 1} Carols Hymn`,
      lyrics: '',
    }));
  });

  const [session2Songs, setSession2Songs] = useState<Array<{ id: string; title: string; lyrics: string }>>(() => {
    if (event.carolsSession2 && event.carolsSession2.length > 0) return event.carolsSession2;
    return [
      { id: 's2-1', title: 'Joy to the World', lyrics: 'Joy to the world! the Lord is come...' },
      { id: 's2-2', title: 'O Come, All Ye Faithful', lyrics: 'O come, all ye faithful, joyful and triumphant...' }
    ];
  });

  const countdown = formatDetailedCountdown(event.targetDate, currentDate);
  const isInteractionDisabled = !countdown.isUnlocked && !adminBypassPreview;

  const isCarols = event.id === 'carols';
  const isChristmasOrNewYear = event.id === 'christmas' || event.id === 'new-year';

  const handleSaveMassDetails = async () => {
    if (onSaveMajorEvent) {
      await onSaveMajorEvent({
        ...event,
        midnightAlleluia,
        midnightResponse,
        morningAlleluia,
        morningResponse,
      });
    }
  };

  const handleSaveCarols = async () => {
    if (onSaveMajorEvent) {
      await onSaveMajorEvent({
        ...event,
        carolsSession1: session1Hymns,
        carolsSession2: session2Songs,
      });
    }
  };


// Chorister Autocomplete helper component
const ChoristerAutocomplete: React.FC<{
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  choristers: Chorister[];
}> = ({ value, onChange, placeholder, choristers }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return choristers.slice(0, 8);
    return choristers.filter(c => c.name.toLowerCase().includes(q) || (c.role && c.role.toLowerCase().includes(q))).slice(0, 10);
  }, [value, choristers]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full px-2.5 py-1.5 bg-[#181818] border border-rose-500/30 rounded-lg text-white focus:outline-none focus:border-rose-400 text-xs"
      />
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-[#161616] border border-rose-500/40 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
          <div className="p-1.5 text-[10px] font-bold text-neutral-400 border-b border-[#262626]">
            Select from Choristers Database:
          </div>
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onChange(c.name);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-xs hover:bg-rose-500/20 text-white flex items-center justify-between transition-colors rounded-lg cursor-pointer"
            >
              <span className="font-bold">{c.name}</span>
              {c.role && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-black/60 text-rose-300 border border-rose-500/30">
                  {c.role}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

  return (
    <div className="space-y-6">
      {/* Header Banner - Radiant when Active, Vault Dark when Locked */}
      <div 
        className={`rounded-3xl p-6 sm:p-7 border transition-all ${
          countdown.isUnlocked
            ? 'bg-gradient-to-r from-amber-950/60 via-[#1C1608]/90 to-[#121212] border-2 border-amber-500/60 shadow-2xl shadow-amber-500/20 text-white'
            : 'bg-[#080808] border border-[#1C1C1C] text-neutral-400 shadow-inner'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span 
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  countdown.isUnlocked
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                    : 'bg-[#121212] text-neutral-400 border-[#242424]'
                }`}
              >
                Major Liturgical Event
              </span>

              {countdown.isUnlocked ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-200 bg-gradient-to-r from-emerald-500/30 to-amber-500/25 px-3 py-1 rounded-full border border-emerald-400/70 shadow-lg shadow-emerald-500/25 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <Unlock className="w-3.5 h-3.5 text-emerald-300" />
                  <span>ACTIVE 100-DAY WINDOW</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-400 bg-[#101010] px-3 py-1 rounded-full border border-[#222222]">
                  <Lock className="w-3.5 h-3.5 text-neutral-500" />
                  <span>INTERACTION LOCKED (&gt;100 DAYS)</span>
                </span>
              )}
            </div>

            <h2 className={`text-2xl sm:text-3xl font-black tracking-tight ${countdown.isUnlocked ? 'text-white drop-shadow' : 'text-neutral-300'}`}>
              {event.title}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl">
              {event.subtitle}
            </p>
          </div>

          {/* Countdown Clock Display */}
          <div 
            className={`rounded-2xl p-4 border flex items-center gap-4 self-start md:self-auto shadow-inner ${
              countdown.isUnlocked 
                ? 'bg-black/70 border-amber-500/40 shadow-amber-500/10' 
                : 'bg-[#050505] border-[#181818]'
            }`}
          >
            <div className="text-center">
              <div 
                className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                  countdown.isUnlocked 
                    ? 'text-white drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]' 
                    : 'text-neutral-400'
                }`}
              >
                {countdown.days}
              </div>
              <div className={`text-[10px] uppercase font-bold tracking-wider ${countdown.isUnlocked ? 'text-amber-300' : 'text-neutral-400'}`}>
                Days Remaining
              </div>
            </div>
            <div className={`w-px h-10 ${countdown.isUnlocked ? 'bg-amber-500/30' : 'bg-[#1C1C1C]'}`} />
            <div className="text-xs text-neutral-300 space-y-0.5">
              <div>
                <strong className={countdown.isUnlocked ? 'text-amber-200' : 'text-neutral-400'}>Event Date:</strong>{' '}
                <span className="text-white">
                  {new Date(event.targetDate + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div className={`text-[11px] font-mono ${countdown.isUnlocked ? 'text-emerald-300 font-bold' : 'text-neutral-400'}`}>
                {countdown.hours}h : {countdown.minutes}m : {countdown.seconds}s
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 100-DAY LOCKED SHIELD VIEW (When > 100 days away - Deep Obsidian Vault Style) */}
      {isInteractionDisabled ? (
        <div className="bg-[#020202] rounded-3xl border-2 border-[#121212] p-8 sm:p-12 text-center shadow-[inset_0_4px_30px_rgba(0,0,0,0.98)] max-w-3xl mx-auto space-y-6 relative overflow-hidden">
          <Lock className="absolute -right-8 -bottom-8 w-72 h-72 text-white/[0.03] pointer-events-none stroke-[1.4]" />

          <div className="w-20 h-20 rounded-3xl bg-[#060606] text-neutral-400 border border-[#161616] flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-2 relative z-10">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-[#080808] text-neutral-400 border border-[#1A1A1A] mb-1">
              🔒 100-Day Annual Preparation Vault Enforced
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-neutral-300 tracking-tight">
              Tab Interaction Locked Until 100-Day Window
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">
              In accordance with committee liturgical governance, interactive hymn selection, task assignment, and budget allocation for <strong className="text-neutral-300">{event.title}</strong> are disabled until within 100 days of the solemnity.
            </p>
          </div>

          <div className="bg-[#050505] border border-[#141414] rounded-2xl p-6 max-w-md mx-auto relative z-10 shadow-inner">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Preparation Window Unlocks In
            </div>
            <div className="text-4xl font-black text-neutral-400 tracking-tight font-mono">
              {countdown.daysUntilUnlock} <span className="text-lg font-semibold text-neutral-400">Days</span>
            </div>
            <div className="text-xs text-neutral-400 mt-2">
              (Current distance: {countdown.days} days • Window opens at 100 days)
            </div>

            <div className="w-full bg-[#080808] h-2 rounded-full mt-4 overflow-hidden border border-[#141414]">
              <div 
                className="bg-neutral-800 h-full rounded-full transition-all"
                style={{ width: `${Math.max(5, Math.min(100, ((365 - countdown.days) / (365 - 100)) * 100))}%` }}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-[#1C1C1C] flex flex-wrap items-center justify-center gap-3 text-xs relative z-10">
            <button
              onClick={onOpenCalendarModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-neutral-400 bg-[#121212] hover:bg-[#1C1C1C] hover:text-white transition-colors border border-[#262626]"
            >
              <Calendar className="w-4 h-4 text-neutral-500" />
              <span>Adjust Annual Calendar Date</span>
            </button>

            <button
              onClick={() => setAdminBypassPreview(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-amber-400/90 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-300 transition-colors border border-amber-500/25"
              title="President & Committee Preview Mode"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Preview Work & Budget (Committee Override)</span>
            </button>
          </div>
        </div>
      ) : (
        /* UNLOCKED VIEW: WORK & BUDGET SUB-TABS */
        <div className="space-y-6">
          {adminBypassPreview && !countdown.isUnlocked && (
            <div className="bg-[#181818] border border-amber-500/30 text-amber-300 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                Administrative Preview Active: Displaying Work & Budget ahead of the 100-day window.
              </span>
              <button
                onClick={() => setAdminBypassPreview(false)}
                className="font-bold underline hover:text-amber-200"
              >
                Re-enable Lock
              </button>
            </div>
          )}

          {/* Carols Two Sessions Management: Session 1 (9 Hymns for 9 Lessons) & Session 2 (Songs / Carols with Add button & Lyrics) */}
          {isCarols && (
            <div className="bg-gradient-to-r from-blue-950/70 via-[#101C30]/80 to-[#121212] border border-blue-500/40 rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-500/20 pb-4">
                <div>
                  <div className="flex items-center gap-2 text-blue-300 font-bold text-base">
                    <Music className="w-5 h-5 text-blue-400" />
                    <span>Festival of Carols • Two Sessions Liturgical Workflow</span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-1">
                    Manage Session 1 (9 Lessons &amp; 9 Carols Hymns) and Session 2 (Additional Carols &amp; Songs with Lyrics).
                  </p>
                </div>
                <button
                  onClick={handleSaveCarols}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition-all self-start sm:self-auto cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Carols Sessions</span>
                </button>
              </div>

              {/* Session 1: Nine Lessons as Nine Hymns */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-300">
                    🎄 Session 1: Nine Lessons &amp; Nine Hymns (9 Hymns Required)
                  </h4>
                  <span className="text-[11px] font-bold text-neutral-400 bg-black/40 px-2.5 py-1 rounded-lg border border-blue-500/20">
                    {session1Hymns.length} / 9 Hymns Configured
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {session1Hymns.map((h, idx) => (
                    <div key={idx} className="bg-black/60 p-3 rounded-xl border border-blue-500/20 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-blue-200">
                        <span>Lesson {h.lessonNumber} Hymn</span>
                        <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded text-blue-300">Slot #{idx + 1}</span>
                      </div>
                      <input
                        type="text"
                        placeholder={`Hymn Name / Title for Lesson ${h.lessonNumber}`}
                        value={h.title}
                        onChange={(e) => {
                          const updated = [...session1Hymns];
                          updated[idx].title = e.target.value;
                          setSession1Hymns(updated);
                        }}
                        className="w-full px-2.5 py-1.5 bg-[#181818] border border-blue-500/30 rounded-lg text-white text-xs focus:outline-none focus:border-blue-400"
                      />
                      <textarea
                        rows={2}
                        placeholder="Enter hymn lyrics..."
                        value={h.lyrics}
                        onChange={(e) => {
                          const updated = [...session1Hymns];
                          updated[idx].lyrics = e.target.value;
                          setSession1Hymns(updated);
                        }}
                        className="w-full px-2.5 py-1.5 bg-[#181818] border border-blue-500/30 rounded-lg text-white text-xs focus:outline-none focus:border-blue-400 resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Session 2: Additional Songs / Carols */}
              <div className="space-y-3 pt-4 border-t border-blue-500/20">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-300">
                    🎶 Session 2: Additional Songs &amp; Carols
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setSession2Songs([
                        ...session2Songs,
                        { id: `s2-${Date.now()}`, title: 'New Carol / Song', lyrics: '' }
                      ]);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 text-xs font-bold border border-blue-500/40 flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <span>+ Add Hymn or Song</span>
                  </button>
                </div>
                <div className="space-y-3">
                  {session2Songs.map((song, sIdx) => (
                    <div key={song.id} className="bg-black/60 p-3.5 rounded-xl border border-blue-500/20 space-y-2 relative">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-300">Song #{sIdx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSession2Songs(session2Songs.filter((_, i) => i !== sIdx));
                          }}
                          className="text-[11px] text-rose-400 hover:text-rose-300 font-bold"
                        >
                          Remove
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Song or Carol Title"
                        value={song.title}
                        onChange={(e) => {
                          const updated = [...session2Songs];
                          updated[sIdx].title = e.target.value;
                          setSession2Songs(updated);
                        }}
                        className="w-full px-2.5 py-1.5 bg-[#181818] border border-blue-500/30 rounded-lg text-white text-xs focus:outline-none focus:border-blue-400 font-bold"
                      />
                      <textarea
                        rows={3}
                        placeholder="Enter song lyrics here..."
                        value={song.lyrics}
                        onChange={(e) => {
                          const updated = [...session2Songs];
                          updated[sIdx].lyrics = e.target.value;
                          setSession2Songs(updated);
                        }}
                        className="w-full px-2.5 py-2 bg-[#181818] border border-blue-500/30 rounded-lg text-white text-xs focus:outline-none focus:border-blue-400 leading-relaxed"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Christmas & New Year Mass Times & Alleluia/Response Card */}
          {isChristmasOrNewYear && (
            <div className="bg-gradient-to-r from-rose-950/60 via-[#210B14]/80 to-[#121212] border border-rose-500/40 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-500/20 pb-3">
                <div>
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                    <Clock className="w-4 h-4 text-rose-400" />
                    <span>Mass Times &amp; Liturgical Duties ({event.title})</span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    {event.id === 'christmas' ? (
                      <>
                        📅 <strong>24th Midnight Mass</strong> at <strong>11.45 PM</strong> &amp; 📅 <strong>25th Morning Mass</strong> at <strong>7:00 AM</strong>
                      </>
                    ) : (
                      <>
                        📅 <strong>31st Midnight Mass</strong> at <strong>11.45 PM</strong> &amp; 📅 <strong>Jan 1st Morning Mass</strong> at <strong>7:00 AM</strong>
                      </>
                    )}
                  </p>
                </div>

                <button
                  onClick={handleSaveMassDetails}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow transition-all self-start sm:self-auto cursor-pointer"
                >
                  Save Duties
                </button>
              </div>

              {/* Separate sections for Midnight and Morning Mass */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Midnight Mass Section */}
                <div className="bg-black/40 p-3 rounded-xl border border-rose-500/20 space-y-2">
                  <h4 className="font-bold text-rose-300">Midnight Mass Duties</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <label className="block text-xs font-bold text-rose-300">Alleluia</label>
                    <ChoristerAutocomplete value={midnightAlleluia} onChange={setMidnightAlleluia} placeholder="Alleluia..." choristers={choristers} />
                    <label className="block text-xs font-bold text-rose-300">Response</label>
                    <ChoristerAutocomplete value={midnightResponse} onChange={setMidnightResponse} placeholder="Response..." choristers={choristers} />
                  </div>
                </div>

                {/* Morning Mass Section */}
                <div className="bg-black/40 p-3 rounded-xl border border-rose-500/20 space-y-2">
                  <h4 className="font-bold text-rose-300">Morning Mass Duties</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <label className="block text-xs font-bold text-rose-300">Alleluia</label>
                    <ChoristerAutocomplete value={morningAlleluia} onChange={setMorningAlleluia} placeholder="Alleluia..." choristers={choristers} />
                    <label className="block text-xs font-bold text-rose-300">Response</label>
                    <ChoristerAutocomplete value={morningResponse} onChange={setMorningResponse} placeholder="Response..." choristers={choristers} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab navigation */}
          <div className="flex items-center gap-2 border-b border-[#222222] pb-3">
            <button
              id={`tab-${event.id}-work`}
              onClick={() => setActiveSubTab('work')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'work'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm shadow-amber-500/20'
                  : 'bg-[#141414] text-neutral-300 hover:bg-[#1C1C1C] hover:text-white border border-[#262626]'
              }`}
            >
              <Music className="w-4 h-4" />
              <span>Work Sub-Tab (Hymns, Tasks & Practices)</span>
            </button>

            <button
              id={`tab-${event.id}-budget`}
              onClick={() => setActiveSubTab('budget')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeSubTab === 'budget'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm shadow-amber-500/20'
                  : 'bg-[#141414] text-neutral-300 hover:bg-[#1C1C1C] hover:text-white border border-[#262626]'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Budget Sub-Tab (Event Financing)</span>
            </button>
          </div>

          {activeSubTab === 'work' ? (
            <WorkSubTab
              workAndBudget={event.workAndBudget}
              eventTitle={event.title}
              choristers={choristers}
              activeMember={activeMember}
              showHymnSheet={true}
              hideApproval={isCarols} // Hide President-Led Liturgical Workflow small table for Carols as requested
              allPractices={allPractices}
              onSavePractices={onSavePractices}
              onDeletePractice={onDeletePractice}
              onSaveWork={onSaveWorkAndBudget}
            />
          ) : (
            <BudgetSubTab
              workAndBudget={event.workAndBudget}
              eventTitle={event.title}
              activeMember={activeMember}
              onSaveBudget={onSaveWorkAndBudget}
            />
          )}
        </div>
      )}
    </div>
  );
};
