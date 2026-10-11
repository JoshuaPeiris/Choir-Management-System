import React, { useState } from 'react';
import { 
  Sparkles, 
  Quote, 
  Music, 
  Calendar, 
  UserCheck, 
  Edit2, 
  ShieldCheck, 
  CheckCircle2, 
  BookOpen, 
  Award,
  Layers,
  FileCheck,
  Check,
  X,
  Share2,
  Library,
  Clock,
  Flag,
  Flame,
  Church,
  Users,
  ChevronRight,
  Info
} from 'lucide-react';
import { 
  Chorister, 
  CommitteeMember, 
  FeastNovenaEntry, 
  MajorEvent, 
  WorkAndBudget,
  PracticeSession,
  HymnCategory 
} from '../types';
import { WorkSubTab } from './WorkSubTab';
import { BudgetSubTab } from './BudgetSubTab';
import { FeastNovenaWhatsAppModal } from './FeastNovenaWhatsAppModal';
import { HymnAutocompleteInput } from './HymnAutocompleteInput';
import { HymnSelectorModal } from './HymnSelectorModal';
import { formatDetailedCountdown } from '../utils/dateUtils';

interface FeastTabProps {
  event: MajorEvent;
  currentDate: Date;
  choristers: Chorister[];
  activeMember: CommitteeMember;
  allPractices?: PracticeSession[];
  onSavePractices?: (updatedPractices: PracticeSession[], description?: string) => Promise<void>;
  onDeletePractice?: (practiceId: string) => Promise<void> | void;
  onUpdateNovena: (dayNumber: number, entry: Partial<FeastNovenaEntry>) => Promise<void>;
  onSyncAllNovenas?: (fixedData: {
    rosaryTime: string;
    massTime: string;
    blessingHymn?: string;
    entranceHymn: string;
    offertory1Hymn: string;
    communion1Hymn: string;
    finalHymn: string;
  }) => Promise<void>;
  onSaveWorkAndBudget: (updatedWork: WorkAndBudget) => Promise<void>;
}

export const FeastTab: React.FC<FeastTabProps> = ({
  event,
  currentDate,
  choristers,
  activeMember,
  allPractices = [],
  onSavePractices,
  onDeletePractice,
  onUpdateNovena,
  onSyncAllNovenas,
  onSaveWorkAndBudget,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'novenas' | 'work' | 'budget'>('novenas');
  const [editingNovena, setEditingNovena] = useState<FeastNovenaEntry | null>(null);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState<boolean>(false);
  const [selectedNovenaDay, setSelectedNovenaDay] = useState<'flag-hoisting' | number | 'vespers' | 'feast-masses' | 'high-mass'>('flag-hoisting');

  // Hymn selector modal state inside edit modal
  const [hymnSelectorOpen, setHymnSelectorOpen] = useState(false);
  const [hymnSelectorTarget, setHymnSelectorTarget] = useState<{
    field: 'blessingHymn' | 'entranceHymn' | 'offertory1Hymn' | 'communion1Hymn' | 'finalHymn' | 'specialHymn';
    label: string;
    liturgicalPart: HymnCategory | string;
  } | null>(null);

  const handleOpenWhatsApp = (dayNumber: 'flag-hoisting' | number | 'vespers' | 'feast-masses' | 'high-mass') => {
    setSelectedNovenaDay(dayNumber);
    setWhatsAppModalOpen(true);
  };

  const countdown = formatDetailedCountdown(event.targetDate, currentDate);

  // Modal edit state
  const [editForm, setEditForm] = useState({
    themeTitle: '',
    themeQuote: '',
    organist: '',
    responsorialPsalmPerson: '',
    alleluiaPerson: '',
    cantor: '',
    celebrant: '',
    specialHymn: '',
    rosaryTime: '6.30ට',
    massTime: '7.00ට',
    blessingHymn: '',
    entranceHymn: '',
    offertory1Hymn: '',
    communion1Hymn: '',
    finalHymn: '',
  });

  const handleOpenNovenaEdit = (novena: FeastNovenaEntry) => {
    setEditingNovena(novena);
    setEditForm({
      themeTitle: novena.themeTitle || '',
      themeQuote: novena.themeQuote || '',
      organist: novena.organist || '',
      responsorialPsalmPerson: novena.responsorialPsalmPerson || '',
      alleluiaPerson: novena.alleluiaPerson || '',
      cantor: novena.cantor || '',
      celebrant: novena.celebrant || '',
      specialHymn: novena.specialHymn || '',
      rosaryTime: novena.rosaryTime || '6.30ට',
      massTime: novena.massTime || '7.00ට',
      blessingHymn: novena.blessingHymn || '',
      entranceHymn: novena.entranceHymn || '',
      offertory1Hymn: novena.offertory1Hymn || '',
      communion1Hymn: novena.communion1Hymn || '',
      finalHymn: novena.finalHymn || '',
    });
  };

  const handleOpenHymnPickerForField = (
    field: 'blessingHymn' | 'entranceHymn' | 'offertory1Hymn' | 'communion1Hymn' | 'finalHymn' | 'specialHymn',
    label: string,
    liturgicalPart: HymnCategory | string
  ) => {
    setHymnSelectorTarget({ field, label, liturgicalPart });
    setHymnSelectorOpen(true);
  };

  const handleHymnSelectedForEditForm = (formattedHymnText: string) => {
    if (!hymnSelectorTarget) return;
    setEditForm((prev) => ({
      ...prev,
      [hymnSelectorTarget.field]: formattedHymnText,
    }));
  };

  const handleSaveNovena = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNovena) return;

    await onUpdateNovena(editingNovena.dayNumber, editForm);
    setEditingNovena(null);
  };

  const novenas = event.novenaEntries || [];

  return (
    <div className="space-y-6">
      {/* Event Header Banner */}
      <div className="bg-gradient-to-r from-amber-900/90 via-amber-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-amber-500/30 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Solemn Annual Feast
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Flag Hoisting, 9 Novenas & Solemn Feast
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>{event.title}</span>
            </h1>
            <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-2xl leading-relaxed">
              {event.description || "St. Cecilia's Choir of St. Michael's Church Koralawella - Full Feast Season Schedule & WhatsApp Broadcasts"}
            </p>
          </div>

          {/* Action Button & Countdown */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
            <button
              id="feast-whatsapp-broadcast-btn"
              onClick={() => handleOpenWhatsApp('flag-hoisting')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp Broadcasts</span>
            </button>

            <div className="bg-black/40 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-amber-500/20 text-right">
              <div className="text-[10px] uppercase tracking-wider text-amber-400 font-bold">
                Countdown to Feast
              </div>
              <div className="text-sm font-black font-mono text-white mt-0.5">
                {countdown.isPast ? (
                  <span className="text-emerald-400">Feast Celebrated</span>
                ) : (
                  <span>{countdown.days}d {countdown.hours}h {countdown.minutes}m</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation (Novenas & Feast Schedule, Work, Budget) */}
      <div className="flex items-center justify-between border-b border-[#242424] pb-3 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2">
          <button
            id="subtab-novenas-btn"
            onClick={() => setActiveSubTab('novenas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'novenas'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-[#181818] text-neutral-400 hover:text-white hover:bg-[#222222] border border-[#2A2A2A]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Feast Schedule, 9 Novenas & Masses</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
              9+
            </span>
          </button>

          <button
            id="subtab-work-btn"
            onClick={() => setActiveSubTab('work')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'work'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-[#181818] text-neutral-400 hover:text-white hover:bg-[#222222] border border-[#2A2A2A]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Hymn Sheet, Tasks & Practices</span>
          </button>

          <button
            id="subtab-budget-btn"
            onClick={() => setActiveSubTab('budget')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'budget'
                ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20'
                : 'bg-[#181818] text-neutral-400 hover:text-white hover:bg-[#222222] border border-[#2A2A2A]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Feast Budget & Expenses</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: FEAST SCHEDULE, FLAG HOISTING, 9 NOVENAS & FEAST MASSES */}
      {activeSubTab === 'novenas' && (
        <div className="space-y-6">
          
          {/* 1. FLEET FLAG HOISTING (OPENING EVENT BEFORE 1ST NOVENA) */}
          <div 
            id="flag-hoisting-banner-card"
            className="bg-gradient-to-r from-amber-950/80 via-[#1C170E] to-[#141414] border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                    <Flag className="w-3 h-3 text-amber-400" />
                    FEAST OPENING
                  </span>
                  <span className="text-xs font-bold text-neutral-300">
                    Saturday, September 19, 2026 (19.09.26)
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-amber-300 flex items-center gap-2">
                    <span>*Hoisting The Fleet Of Flag Staff*</span>
                    <span className="text-sm">❤️💛</span>
                  </h3>
                  <p className="text-xs text-neutral-300 mt-1 font-medium leading-relaxed max-w-2xl">
                    ⭕️ <em>Choristers who're available at that time, Please make sure to be in the church and be there at least 15 minutes before the litany begins.</em>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <div className="flex items-center gap-1.5 bg-[#121212] px-3 py-1 rounded-lg border border-[#2E2E2E]">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-neutral-400">Time:</span>
                    <span className="text-white font-bold font-mono">@3.45 PM</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#121212] px-3 py-1 rounded-lg border border-[#2E2E2E]">
                    <Music className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-neutral-400">Organist:</span>
                    <span className="text-white font-bold font-mono">CHAMATHKA</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="flag-hoisting-whatsapp-btn"
                  onClick={() => handleOpenWhatsApp('flag-hoisting')}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-emerald-600/20"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Flag Hoisting WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. NINE DAYS NOVENAS SECTION */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Nine Days Novena Schedule & Liturgical Hymns
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  September 19 to September 27 • Assigned choristers and selected Mass hymns (E, O, C, F)
                </p>
              </div>
              <button
                onClick={() => handleOpenWhatsApp(1)}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Novena WhatsApp Broadcasts</span>
              </button>
            </div>

            {/* 9 Novenas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {novenas.map((novena) => {
                const hasHymns = Boolean(
                  novena.blessingHymn ||
                  novena.entranceHymn ||
                  novena.offertory1Hymn ||
                  novena.communion1Hymn ||
                  novena.finalHymn
                );

                return (
                  <div
                    key={novena.dayNumber}
                    id={`novena-card-day-${novena.dayNumber}`}
                    className="bg-[#141414] border border-[#262626] hover:border-[#383838] rounded-2xl p-4 flex flex-col justify-between transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black text-xs flex items-center justify-center font-mono">
                            {novena.dayNumber}
                          </span>
                          <div>
                            <h3 className="font-bold text-xs text-white">
                              Day {novena.dayNumber} Novena
                            </h3>
                            <p className="text-[10px] text-neutral-400">
                              {novena.date}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {novena.status}
                        </span>
                      </div>

                      {/* Theme & Quote */}
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-amber-300 line-clamp-1">
                          {novena.themeTitle}
                        </div>
                        {novena.themeQuote && (
                          <div className="text-[11px] text-neutral-400 italic line-clamp-2 font-serif bg-[#181818] p-2 rounded-lg border border-[#242424]">
                            "{novena.themeQuote}"
                          </div>
                        )}
                      </div>

                      {/* Times */}
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-[#101010] p-2 rounded-xl border border-[#202020]">
                        <div>
                          <span className="text-neutral-400">ජපමාලය: </span>
                          <span className="text-white font-semibold">{novena.rosaryTime || '6.30ට'}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400">දිව්‍ය යාගය: </span>
                          <span className="text-white font-semibold">{novena.massTime || '7.00ට'}</span>
                        </div>
                      </div>

                      {/* Choral Roles */}
                      <div className="space-y-1.5 text-xs bg-[#101010] p-2.5 rounded-xl border border-[#202020]">
                        {/* Organist */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-neutral-400 font-medium flex items-center gap-1.5">
                            <Music className="w-3 h-3 text-amber-400" />
                            Organist:
                          </span>
                          <span className="font-bold text-white truncate text-[11px]">
                            {novena.organist || '—'}
                          </span>
                        </div>

                        {/* Responsorial Psalm Person */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-neutral-400 font-medium flex items-center gap-1.5">
                            <UserCheck className="w-3 h-3 text-blue-400" />
                            Psalm Person:
                          </span>
                          <span className="font-bold text-white truncate text-[11px]">
                            {novena.responsorialPsalmPerson || '—'}
                          </span>
                        </div>

                        {/* Alleluia Person */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-neutral-400 font-medium flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            Alleluia Person:
                          </span>
                          <span className="font-bold text-white truncate text-[11px]">
                            {novena.alleluiaPerson || '—'}
                          </span>
                        </div>

                        {/* Special Hymn if any */}
                        {novena.specialHymn && (
                          <div className="pt-1 border-t border-[#222222] flex items-center justify-between gap-2 text-[10px]">
                            <span className="text-neutral-500">Marian Motet:</span>
                            <span className="font-medium text-amber-400 truncate">
                              {novena.specialHymn}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Assigned Hymns (B, E, O, C, F) */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-neutral-400 flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-amber-400" />
                            <span>Hymns (ගීතිකා):</span>
                          </span>
                          {!hasHymns && (
                            <span className="text-[10px] text-neutral-500 italic">Not assigned</span>
                          )}
                        </div>

                        {hasHymns ? (
                          <div className="space-y-1 text-[10px]">
                            {novena.blessingHymn && (
                              <div className="bg-[#181818] px-2 py-1 rounded-lg border border-amber-500/30 truncate flex items-center gap-1">
                                <span className="text-amber-400 font-bold">B:</span>
                                <span className="text-amber-200 truncate">{novena.blessingHymn}</span>
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-1.5">
                              <div className="bg-[#181818] px-2 py-1 rounded-lg border border-[#282828] truncate">
                                <span className="text-amber-400 font-bold mr-1">E:</span>
                                <span className="text-neutral-200">{novena.entranceHymn || '—'}</span>
                              </div>
                              <div className="bg-[#181818] px-2 py-1 rounded-lg border border-[#282828] truncate">
                                <span className="text-amber-400 font-bold mr-1">O:</span>
                                <span className="text-neutral-200">{novena.offertory1Hymn || '—'}</span>
                              </div>
                              <div className="bg-[#181818] px-2 py-1 rounded-lg border border-[#282828] truncate">
                                <span className="text-amber-400 font-bold mr-1">C:</span>
                                <span className="text-neutral-200">{novena.communion1Hymn || '—'}</span>
                              </div>
                              <div className="bg-[#181818] px-2 py-1 rounded-lg border border-[#282828] truncate">
                                <span className="text-amber-400 font-bold mr-1">F:</span>
                                <span className="text-neutral-200">{novena.finalHymn || '—'}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenNovenaEdit(novena)}
                            className="w-full py-1.5 px-2 text-[10px] text-neutral-400 hover:text-amber-300 bg-[#181818] hover:bg-[#202020] border border-dashed border-[#333] rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <BookOpen className="w-3 h-3 text-amber-400" />
                            <span>+ Add Hymns to Day {novena.dayNumber}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card footer: WhatsApp Broadcast & Edit buttons */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#1F1F1F] gap-2">
                      <button
                        id={`novena-whatsapp-btn-${novena.dayNumber}`}
                        type="button"
                        onClick={() => handleOpenWhatsApp(novena.dayNumber)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition-colors"
                        title={`Generate WhatsApp message model for Day ${novena.dayNumber}`}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        id={`novena-edit-btn-${novena.dayNumber}`}
                        type="button"
                        onClick={() => handleOpenNovenaEdit(novena)}
                        className="flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-amber-400 p-1 rounded transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Day {novena.dayNumber}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. SOLEMN FEAST LITURGIES: VESPERS, FEAST MASSES & HIGH MASS (BELOW NOVENAS) */}
          <div className="space-y-4 pt-4 border-t border-[#222222]">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Church className="w-4 h-4 text-amber-400" />
                  Feast Days, Vespers & Solemn High Mass
                </h2>
                <p className="text-xs text-neutral-400 mt-0.5">
                  September 28 (Vespers) & September 29 (Feast Day Masses & High Mass)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: Vespers (සවස දෙව් මෙහෙය) */}
              <div 
                id="vespers-feast-card"
                className="bg-[#141414] border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-white">Vespers (සවස දෙව් මෙහෙය)</h3>
                        <p className="text-[10px] text-neutral-400">Monday, 28 September 2026</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      7.00 PM
                    </span>
                  </div>

                  <div className="space-y-2 text-xs bg-[#101010] p-2.5 rounded-xl border border-[#202020]">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">තේවාධරයා (Tevadharaya):</span>
                      <span className="font-bold text-white">K. D. D. Peiris</span>
                    </div>
                    <div className="text-[11px] text-neutral-400 pt-1 border-t border-[#222]">
                      🛑 සියලූ සාමාජික සාමාජිකාවන් සවස 6.30වන විට පැමිණ සිටින්න.
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[#1F1F1F]">
                  <button
                    onClick={() => handleOpenWhatsApp('vespers')}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 py-2 rounded-xl transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Vespers WhatsApp Broadcast</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Feast Day Masses (මංගල්‍ය දිව්‍ය යාගයන්) */}
              <div 
                id="feast-masses-card"
                className="bg-[#141414] border border-blue-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <Church className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-white">Feast Masses (මංගල්‍ය යාගයන්)</h3>
                        <p className="text-[10px] text-neutral-400">Tuesday, 29 September 2026</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      3 Masses
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="bg-[#101010] p-2 rounded-xl border border-[#202020]">
                      <div className="text-[11px] font-bold text-blue-300 mb-0.5">✝️ පෙ.ව. 5.00 දිව්‍ය පූජාව</div>
                      <div className="text-[10px] text-neutral-300">Psalm: <strong className="text-white">SHAVEEN S</strong> • Alleluia: <strong className="text-white">METHUSHI</strong></div>
                    </div>
                    <div className="bg-[#101010] p-2 rounded-xl border border-[#202020]">
                      <div className="text-[11px] font-bold text-blue-300 mb-0.5">✝️ පෙ.ව. 6.30 දිව්‍ය පූජාව</div>
                      <div className="text-[10px] text-neutral-300">Psalm: <strong className="text-white">MELANI</strong> • Alleluia: <strong className="text-white">VINDYA</strong></div>
                    </div>
                    <div className="bg-[#101010] p-2 rounded-xl border border-[#202020]">
                      <div className="text-[11px] font-bold text-blue-300 mb-0.5">✝️ ප.ව. 6.00 දිව්‍ය පූජාව</div>
                      <div className="text-[10px] text-neutral-300">Psalm: <strong className="text-white">CRISHMAL</strong> • Alleluia: <strong className="text-white">CHAMATHKA</strong></div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[#1F1F1F]">
                  <button
                    onClick={() => handleOpenWhatsApp('feast-masses')}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 py-2 rounded-xl transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Feast Masses WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Card 3: Feast Solemn High Mass (මංගල්‍ය මහා දිව්‍ය යාගය) */}
              <div 
                id="high-mass-card"
                className="bg-[#141414] border border-amber-500/50 rounded-2xl p-4 flex flex-col justify-between shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xs text-amber-300">Solemn High Mass (මහා යාගය)</h3>
                        <p className="text-[10px] text-neutral-400">Tuesday, 29 September 2026</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      8.00 AM
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs bg-[#101010] p-2.5 rounded-xl border border-[#202020]">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Organist:</span>
                      <span className="font-bold text-white">CHAMATHKA</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Psalm Duet:</span>
                      <span className="font-bold text-white">SHAVEEN S & METHUSHI</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-400">Alleluia:</span>
                      <span className="font-bold text-white">MELANI</span>
                    </div>
                  </div>

                  {/* High Mass Hymns */}
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="bg-[#181818] px-2 py-1 rounded-lg border border-[#282828] truncate">
                      <span className="text-amber-400 font-bold mr-1">E:</span>
                      <span className="text-neutral-200">මංගල ගීතිකා 04</span>
                    </div>
                    <div className="bg-[#181818] px-2 py-1 rounded-lg border border-[#282828] truncate">
                      <span className="text-amber-400 font-bold mr-1">O:</span>
                      <span className="text-neutral-200">පුදසුන වෙත එමු 120</span>
                    </div>
                    <div className="bg-[#181818] px-2 py-1 rounded-lg border border-[#282828] truncate">
                      <span className="text-amber-400 font-bold mr-1">C:</span>
                      <span className="text-neutral-200">දෙව් සමිඳුන්ගේ 180</span>
                    </div>
                    <div className="bg-[#181818] px-2 py-1 rounded-lg border border-[#282828] truncate">
                      <span className="text-amber-400 font-bold mr-1">F:</span>
                      <span className="text-neutral-200">මරිය මව්නි 258</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[#1F1F1F]">
                  <button
                    onClick={() => handleOpenWhatsApp('high-mass')}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 py-2 rounded-xl transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>High Mass WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* SUB-TAB 2: WORK (HYMNS, TASKS & PRACTICES) */}
      {activeSubTab === 'work' && (
        <WorkSubTab
          workAndBudget={event.workAndBudget}
          eventTitle={event.title}
          choristers={choristers}
          activeMember={activeMember}
          showHymnSheet={true}
          allPractices={allPractices}
          onSavePractices={onSavePractices}
          onDeletePractice={onDeletePractice}
          onSaveWork={onSaveWorkAndBudget}
        />
      )}

      {/* SUB-TAB 3: BUDGET (FINANCING) */}
      {activeSubTab === 'budget' && (
        <BudgetSubTab
          workAndBudget={event.workAndBudget}
          eventTitle={event.title}
          activeMember={activeMember}
          onSaveBudget={onSaveWorkAndBudget}
        />
      )}

      {/* Edit Novena Entry Modal */}
      {editingNovena && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141414] w-full max-w-xl rounded-2xl border border-[#2A2A2A] shadow-2xl overflow-hidden animate-in fade-in my-auto max-h-[92vh] flex flex-col">
            <div className="bg-[#0D0D0D] text-white px-6 py-4 flex items-center justify-between border-b border-[#222222]">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Edit Feast Novena: Day {editingNovena.dayNumber}
                </h3>
                <p className="text-xs text-neutral-400">
                  {editingNovena.date} • Update liturgical theme, choral roster, and hymns
                </p>
              </div>
              <button onClick={() => setEditingNovena(null)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNovena} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {/* Theme Title */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                  Novena Theme Title *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.themeTitle}
                  onChange={(e) => setEditForm({ ...editForm, themeTitle: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 text-white placeholder:text-neutral-500 focus:outline-none"
                />
              </div>

              {/* Specific Theme Quote */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                  Specific Theme Quote (Scripture or Saint) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={editForm.themeQuote}
                  onChange={(e) => setEditForm({ ...editForm, themeQuote: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 text-white placeholder:text-neutral-500 focus:outline-none font-serif"
                />
              </div>

              {/* Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Rosary Time (ජපමාලය)
                  </label>
                  <input
                    type="text"
                    value={editForm.rosaryTime}
                    onChange={(e) => setEditForm({ ...editForm, rosaryTime: e.target.value })}
                    placeholder="6.30ට"
                    className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 text-white placeholder:text-neutral-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Mass Time (දිව්‍ය යාගය)
                  </label>
                  <input
                    type="text"
                    value={editForm.massTime}
                    onChange={(e) => setEditForm({ ...editForm, massTime: e.target.value })}
                    placeholder="7.00ට"
                    className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 text-white placeholder:text-neutral-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Organist */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                  Assigned Organist *
                </label>
                <input
                  type="text"
                  required
                  list="organist-suggestions"
                  placeholder="Select or enter organist name"
                  value={editForm.organist}
                  onChange={(e) => setEditForm({ ...editForm, organist: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 text-white placeholder:text-neutral-500 focus:outline-none font-semibold"
                />
                <datalist id="organist-suggestions">
                  {choristers.map((c) => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>

              {/* Responsorial Psalm Person and Alleluia Person */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Responsorial Psalm Person *
                  </label>
                  <input
                    type="text"
                    required
                    list="psalmist-suggestions"
                    placeholder="Enter psalm cantor"
                    value={editForm.responsorialPsalmPerson}
                    onChange={(e) => setEditForm({ ...editForm, responsorialPsalmPerson: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 text-white placeholder:text-neutral-500 focus:outline-none"
                  />
                  <datalist id="psalmist-suggestions">
                    {choristers.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Alleluia Person *
                  </label>
                  <input
                    type="text"
                    required
                    list="alleluia-suggestions"
                    placeholder="Enter Alleluia singer"
                    value={editForm.alleluiaPerson}
                    onChange={(e) => setEditForm({ ...editForm, alleluiaPerson: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 text-white placeholder:text-neutral-500 focus:outline-none"
                  />
                  <datalist id="alleluia-suggestions">
                    {choristers.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Liturgical Hymns Selection (B, E, O, C, F) */}
              <div className="p-3.5 rounded-xl bg-[#111111] border border-[#2A2A2A] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Hymns for Day {editingNovena.dayNumber}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    From System Hymnal Database
                  </span>
                </div>

                {/* Blessing Hymn Before Entrance (B) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                      <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px]">
                        B
                      </span>
                      <span>Blessing Hymn Before Entrance (ආශීර්වාද ගීතිකාව)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenHymnPickerForField('blessingHymn', 'Blessing Hymn (B)', 'Benediction')}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-[#1C1C1C] hover:bg-[#252525] px-2 py-0.5 rounded border border-[#333]"
                    >
                      <Library className="w-3 h-3" /> Browse Library
                    </button>
                  </div>
                  <HymnAutocompleteInput
                    value={editForm.blessingHymn}
                    onChange={(val) => setEditForm((prev) => ({ ...prev, blessingHymn: val }))}
                    liturgicalPart="Benediction"
                    placeholder="Search blessing hymn or type number/title..."
                    theme="dark"
                  />
                </div>

                {/* Entrance Hymn (E) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                      <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px]">
                        E
                      </span>
                      <span>Entrance Hymn (ඇතුල්වීම)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenHymnPickerForField('entranceHymn', 'Entrance (E)', 'Entrance')}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-[#1C1C1C] hover:bg-[#252525] px-2 py-0.5 rounded border border-[#333]"
                    >
                      <Library className="w-3 h-3" /> Browse Library
                    </button>
                  </div>
                  <HymnAutocompleteInput
                    value={editForm.entranceHymn}
                    onChange={(val) => setEditForm((prev) => ({ ...prev, entranceHymn: val }))}
                    liturgicalPart="Entrance"
                    placeholder="Search by number or title..."
                    theme="dark"
                  />
                </div>

                {/* Offertory Hymn (O) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                      <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px]">
                        O
                      </span>
                      <span>Offertory Hymn (පුදසුන)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenHymnPickerForField('offertory1Hymn', 'Offertory (O)', 'Offertory')}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-[#1C1C1C] hover:bg-[#252525] px-2 py-0.5 rounded border border-[#333]"
                    >
                      <Library className="w-3 h-3" /> Browse Library
                    </button>
                  </div>
                  <HymnAutocompleteInput
                    value={editForm.offertory1Hymn}
                    onChange={(val) => setEditForm((prev) => ({ ...prev, offertory1Hymn: val }))}
                    liturgicalPart="Offertory"
                    placeholder="Search by number or title..."
                    theme="dark"
                  />
                </div>

                {/* Communion Hymn (C) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                      <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px]">
                        C
                      </span>
                      <span>Communion Hymn (දිව්‍ය භෝජන)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenHymnPickerForField('communion1Hymn', 'Communion (C)', 'Communion')}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-[#1C1C1C] hover:bg-[#252525] px-2 py-0.5 rounded border border-[#333]"
                    >
                      <Library className="w-3 h-3" /> Browse Library
                    </button>
                  </div>
                  <HymnAutocompleteInput
                    value={editForm.communion1Hymn}
                    onChange={(val) => setEditForm((prev) => ({ ...prev, communion1Hymn: val }))}
                    liturgicalPart="Communion"
                    placeholder="Search by number or title..."
                    theme="dark"
                  />
                </div>

                {/* Final Hymn (F) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                      <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px]">
                        F
                      </span>
                      <span>Final Hymn (සමුගැනීම)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleOpenHymnPickerForField('finalHymn', 'Final (F)', 'Recessional')}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-[#1C1C1C] hover:bg-[#252525] px-2 py-0.5 rounded border border-[#333]"
                    >
                      <Library className="w-3 h-3" /> Browse Library
                    </button>
                  </div>
                  <HymnAutocompleteInput
                    value={editForm.finalHymn}
                    onChange={(val) => setEditForm((prev) => ({ ...prev, finalHymn: val }))}
                    liturgicalPart="Recessional"
                    placeholder="Search by number or title..."
                    theme="dark"
                  />
                </div>
              </div>

              {/* Special Marian Motet */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                  Featured Marian Motet / Special Hymn
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Salve Regina (Solemn Tone) or මරිය මව්නි 258"
                    value={editForm.specialHymn}
                    onChange={(e) => setEditForm({ ...editForm, specialHymn: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 text-white placeholder:text-neutral-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleOpenHymnPickerForField('specialHymn', 'Marian Motet', 'Marian')}
                    className="shrink-0 text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-[#1C1C1C] hover:bg-[#252525] px-3 py-1.5 rounded-xl border border-[#333]"
                  >
                    <Library className="w-3.5 h-3.5" /> Library
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => {
                    const day = editingNovena.dayNumber;
                    setEditingNovena(null);
                    handleOpenWhatsApp(day);
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp Broadcast Modal</span>
                </button>
                <div className="w-full sm:w-auto flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditingNovena(null)}
                    className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-[#202020] rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl shadow-md shadow-amber-500/20"
                  >
                    Save Novena & Hymns
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hymn Selector Modal inside Edit Novena modal */}
      {hymnSelectorOpen && hymnSelectorTarget && (
        <HymnSelectorModal
          isOpen={hymnSelectorOpen}
          onClose={() => setHymnSelectorOpen(false)}
          onSelect={handleHymnSelectedForEditForm}
          title={`Select Hymn for ${hymnSelectorTarget.label}`}
          targetSlotLabel={hymnSelectorTarget.label}
          defaultLiturgicalPart={hymnSelectorTarget.liturgicalPart}
        />
      )}

      {/* Feast Novena WhatsApp Broadcast Modal */}
      <FeastNovenaWhatsAppModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        initialDayNumber={selectedNovenaDay}
        novenas={novenas}
        choristers={choristers}
        onSaveNovena={onUpdateNovena}
        onSyncAllNovenas={onSyncAllNovenas}
      />
    </div>
  );
};
