import React, { useState, useMemo } from 'react';
import { 
  History, 
  Calendar, 
  RotateCcw, 
  Music, 
  Coins, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Clock, 
  BookOpen,
  Search,
  Copy,
  Check,
  Trash2,
  Piano,
  Plus,
  X,
  ExternalLink,
  Award,
  Filter,
  Layers,
  Users,
  UserCheck,
  Flame,
  Church,
  ShieldCheck,
  Flag,
  CheckCircle2,
  ChevronRight,
  FileText,
  DollarSign,
  Wallet,
  ArrowRight,
  Eye,
  Tag
} from 'lucide-react';
import { 
  ArchiveRecord, 
  CommitteeMember, 
  MajorEvent,
  Hymn
} from '../types';

interface HistoryTabProps {
  archives: ArchiveRecord[];
  activeMember: CommitteeMember;
  majorEvents: Record<'feast' | 'carols' | 'easter' | 'christmas-new-year', MajorEvent>;
  onRolloverEvent: (
    eventId: 'feast' | 'carols' | 'easter' | 'christmas-new-year',
    notes?: string
  ) => Promise<void>;
  onDeleteHistoryRecord?: (id: string) => Promise<void>;
  onSaveHistoryRecord?: (record: ArchiveRecord) => Promise<void>;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  archives,
  activeMember,
  majorEvents,
  onRolloverEvent,
  onDeleteHistoryRecord,
  onSaveHistoryRecord,
}) => {
  const [selectedEventToRollover, setSelectedEventToRollover] = useState<'feast' | 'carols' | 'easter' | 'christmas-new-year'>('feast');
  const [isRolloverModalOpen, setIsRolloverModalOpen] = useState<boolean>(false);
  const [isManualAddModalOpen, setIsManualAddModalOpen] = useState<boolean>(false);
  const [rolloverNotes, setRolloverNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(archives[0]?.id || null);
  
  // Filters & Search
  const [filterCategory, setFilterCategory] = useState<'all' | 'weekly-mass' | 'major-event'>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [archiveSectionTab, setArchiveSectionTab] = useState<Record<string, 'all' | 'liturgies' | 'attendance' | 'hymns' | 'tasks' | 'budget'>>({});
  const [modalViewingArchive, setModalViewingArchive] = useState<ArchiveRecord | null>(null);

  // Manual Entry Form State
  const [manualTitle, setManualTitle] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualType, setManualType] = useState('weekly-mass');
  const [manualOrganist, setManualOrganist] = useState('');
  const [manualReader, setManualReader] = useState('');
  const [manualEntrance, setManualEntrance] = useState('');
  const [manualOffertory, setManualOffertory] = useState('');
  const [manualCommunion, setManualCommunion] = useState('');
  const [manualFinal, setManualFinal] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  const handleConfirmRollover = async () => {
    setIsProcessing(true);
    try {
      await onRolloverEvent(selectedEventToRollover, rolloverNotes);
      setIsRolloverModalOpen(false);
      setRolloverNotes('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyHymns = async (archive: ArchiveRecord) => {
    const lines = [
      `🎵 Liturgical Hymns — ${archive.eventTitle}`,
      `📅 Date: ${archive.dateRange || archive.massDate || archive.archivedAt}`,
    ];
    if (archive.organist) lines.push(`🎹 Organist: ${archive.organist}`);
    if (archive.readingPerson) lines.push(`📖 Reader: ${archive.readingPerson}`);
    lines.push('');
    lines.push('Hymns:');
    (archive.hymns || []).forEach((h) => {
      lines.push(`• [${h.category}] ${h.title} ${h.hymnNumber ? `#${h.hymnNumber}` : ''}`.trim());
    });

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedId(archive.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      // ignore
    }
  };

  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !onSaveHistoryRecord) return;

    const hymns: Hymn[] = [];
    if (manualEntrance.trim()) {
      hymns.push({ id: `hymn-ent-${Date.now()}`, category: 'Entrance', title: manualEntrance.trim() });
    }
    if (manualOffertory.trim()) {
      hymns.push({ id: `hymn-off-${Date.now()}`, category: 'Offertory', title: manualOffertory.trim() });
    }
    if (manualCommunion.trim()) {
      hymns.push({ id: `hymn-com-${Date.now()}`, category: 'Communion', title: manualCommunion.trim() });
    }
    if (manualFinal.trim()) {
      hymns.push({ id: `hymn-fin-${Date.now()}`, category: 'Recessional', title: manualFinal.trim() });
    }

    const newRecord: ArchiveRecord = {
      id: `hist-manual-${Date.now()}`,
      year: new Date(manualDate).getFullYear() || new Date().getFullYear(),
      eventId: manualType === 'weekly-mass' ? 'weekly-mass' : 'other',
      eventTitle: manualTitle.trim(),
      dateRange: manualDate,
      massDate: manualDate,
      recordType: manualType as any,
      archivedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      archivedBy: `${activeMember.name} (${activeMember.role})`,
      organist: manualOrganist.trim().toUpperCase(),
      readingPerson: manualReader.trim().toUpperCase(),
      summary: {
        totalHymns: hymns.length,
        totalPractices: 0,
        totalBudgeted: 0,
        totalActualSpent: 0,
        totalIncome: 0,
      },
      hymns,
      tasks: [],
      practices: [],
      budget: [],
      notes: manualNotes.trim(),
    };

    await onSaveHistoryRecord(newRecord);
    setIsManualAddModalOpen(false);
    setManualTitle('');
    setManualOrganist('');
    setManualReader('');
    setManualEntrance('');
    setManualOffertory('');
    setManualCommunion('');
    setManualFinal('');
    setManualNotes('');
  };

  const years = Array.from<number>(new Set(archives.map((a) => a.year))).sort((a, b) => b - a);

  // Filter and Search logic
  const filteredArchives = useMemo(() => {
    return archives.filter((a) => {
      // Year filter
      if (filterYear !== 'all' && a.year.toString() !== filterYear) return false;

      // Category filter
      if (filterCategory === 'weekly-mass') {
        const isWeekly = a.eventId === 'weekly-mass' || a.recordType === 'weekly-mass' || a.eventTitle.toLowerCase().includes('mass');
        if (!isWeekly) return false;
      } else if (filterCategory === 'major-event') {
        const isMajor = ['feast', 'carols', 'easter', 'christmas-new-year'].includes(a.eventId) || a.recordType === 'major-event';
        if (!isMajor) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = a.eventTitle.toLowerCase().includes(q);
        const inDate = (a.dateRange || a.massDate || a.archivedAt).toLowerCase().includes(q);
        const inOrganist = (a.organist || '').toLowerCase().includes(q);
        const inReader = (a.readingPerson || '').toLowerCase().includes(q);
        const inHymns = (a.hymns || []).some(
          (h) => h.title.toLowerCase().includes(q) || (h.hymnNumber && h.hymnNumber.toLowerCase().includes(q))
        );
        const inNotes = (a.notes || '').toLowerCase().includes(q);

        return inTitle || inDate || inOrganist || inReader || inHymns || inNotes;
      }

      return true;
    });
  }, [archives, filterYear, filterCategory, searchQuery]);

  const totalWeeklyMasses = archives.filter(
    (a) => a.eventId === 'weekly-mass' || a.recordType === 'weekly-mass' || a.eventTitle.toLowerCase().includes('mass')
  ).length;

  const totalMajorEvents = archives.filter(
    (a) => ['feast', 'carols', 'easter', 'christmas-new-year'].includes(a.eventId)
  ).length;

  const totalHymnsLogged = archives.reduce(
    (acc, a) => acc + (a.hymns?.length || a.summary?.totalHymns || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950/80 via-[#141414] to-[#0E0E0E] rounded-3xl p-6 sm:p-7 border border-amber-500/30 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <History className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Permanent Liturgical History &amp; Repertoire
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Liturgical History &amp; Saved Masses
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-2xl leading-relaxed">
              Every saved weekly mass, Sunday service, and major feast program is automatically recorded here with its complete hymn lineup, date, organist, and duties.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            <button
              id="open-manual-history-btn"
              type="button"
              onClick={() => setIsManualAddModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#1f1f1f] hover:bg-[#282828] text-neutral-200 border border-[#333333] text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Log Past Mass</span>
            </button>

            <button
              id="open-rollover-modal-btn"
              type="button"
              onClick={() => setIsRolloverModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-amber-500/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Archive &amp; Rollover Event</span>
            </button>
          </div>
        </div>

        {/* History Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-[#222222]">
          <div className="bg-[#111111]/80 rounded-2xl p-3 border border-[#222222]">
            <div className="text-xs text-neutral-400 font-medium">Total Saved Records</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">{archives.length}</div>
          </div>
          <div className="bg-[#111111]/80 rounded-2xl p-3 border border-[#222222]">
            <div className="text-xs text-neutral-400 font-medium">Weekly Masses Logged</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
              {totalWeeklyMasses}
            </div>
          </div>
          <div className="bg-[#111111]/80 rounded-2xl p-3 border border-[#222222]">
            <div className="text-xs text-neutral-400 font-medium">Total Hymns in History</div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">
              {totalHymnsLogged}
            </div>
          </div>
          <div className="bg-[#111111]/80 rounded-2xl p-3 border border-[#222222]">
            <div className="text-xs text-neutral-400 font-medium">Major Events Archived</div>
            <div className="text-xl sm:text-2xl font-black text-indigo-400 mt-0.5">
              {totalMajorEvents}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#111111] p-4 rounded-2xl border border-[#222222] space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#181818] border border-[#262626] self-start">
            <button
              type="button"
              id="filter-cat-all"
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterCategory === 'all'
                  ? 'bg-[#262626] text-amber-300 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Records ({archives.length})
            </button>
            <button
              type="button"
              id="filter-cat-weekly"
              onClick={() => setFilterCategory('weekly-mass')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterCategory === 'weekly-mass'
                  ? 'bg-[#262626] text-emerald-300 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Weekly Masses ({totalWeeklyMasses})
            </button>
            <button
              type="button"
              id="filter-cat-major"
              onClick={() => setFilterCategory('major-event')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterCategory === 'major-event'
                  ? 'bg-[#262626] text-purple-300 shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Major Events ({totalMajorEvents})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="history-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hymns, dates, organists, readers..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#161616] border border-[#262626] text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Year Filter */}
        {years.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-[#1a1a1a]">
            <span className="text-[11px] text-neutral-400 font-medium">Filter by Year:</span>
            <div className="flex flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setFilterYear('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  filterYear === 'all'
                    ? 'bg-amber-500 text-neutral-950 font-bold'
                    : 'bg-[#181818] text-neutral-400 hover:text-white border border-[#282828]'
                }`}
              >
                All Years
              </button>
              {years.map((y) => (
                <button
                  type="button"
                  key={y}
                  onClick={() => setFilterYear(y.toString())}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    filterYear === y.toString()
                      ? 'bg-amber-500 text-neutral-950 font-bold'
                      : 'bg-[#181818] text-neutral-400 hover:text-white border border-[#282828]'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
            <span className="ml-auto text-[11px] text-neutral-500">
              Showing {filteredArchives.length} of {archives.length} history records
            </span>
          </div>
        )}
      </div>

      {/* History Records List */}
      <div className="space-y-4">
        {filteredArchives.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#111111] border border-[#222222] space-y-3">
            <History className="w-10 h-10 text-neutral-600 mx-auto" />
            <h3 className="font-bold text-white text-base">No History Records Found</h3>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              {searchQuery || filterCategory !== 'all' || filterYear !== 'all'
                ? 'No history entries matched your search or filters. Try clearing filters.'
                : 'Whenever you save a Weekly Mass, Sunday Mass, or roll over a Feast, it will be automatically stored here with its date and all hymns!'}
            </p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterCategory('all');
                  setFilterYear('all');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold transition-all"
              >
                Clear Search &amp; Filters
              </button>
            )}
          </div>
        ) : (
          filteredArchives.map((archive) => {
            const isExpanded = expandedRecordId === archive.id;
            const isWeeklyMass = archive.eventId === 'weekly-mass' || archive.recordType === 'weekly-mass' || archive.eventTitle.toLowerCase().includes('mass');

            return (
              <div
                key={archive.id}
                id={`history-card-${archive.id}`}
                className="rounded-2xl bg-[#131313] border border-[#222222] overflow-hidden transition-all shadow-md hover:border-[#2e2e2e]"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => setExpandedRecordId(isExpanded ? null : archive.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-[#181818] transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isWeeklyMass 
                        ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                        : 'bg-purple-500/10 border border-purple-500/20 text-purple-400'
                    }`}>
                      {isWeeklyMass ? <Calendar className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-black uppercase font-mono px-2 py-0.5 rounded ${
                          isWeeklyMass
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {isWeeklyMass ? 'Weekly Mass' : 'Major Event'}
                        </span>
                        <span className="text-xs font-black text-amber-400 font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          {archive.year}
                        </span>
                        <h4 className="font-bold text-white text-base">
                          {archive.eventTitle}
                        </h4>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-400 mt-1.5">
                        <span className="flex items-center gap-1 text-neutral-300 font-semibold">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>{archive.dateRange || archive.massDate || archive.archivedAt}</span>
                        </span>
                        <span>•</span>
                        {archive.organist && (
                          <>
                            <span className="flex items-center gap-1 text-sky-300">
                              <Piano className="w-3 h-3 text-sky-400" />
                              <span>Organist: <strong>{archive.organist}</strong></span>
                            </span>
                            <span>•</span>
                          </>
                        )}
                        {archive.readingPerson && (
                          <>
                            <span className="flex items-center gap-1 text-neutral-300">
                              <BookOpen className="w-3 h-3 text-amber-400" />
                              <span>Reader: <strong>{archive.readingPerson}</strong></span>
                            </span>
                            <span>•</span>
                          </>
                        )}
                        <span className="text-neutral-500 text-[11px]">
                          Saved: {archive.archivedAt} by {archive.archivedBy}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-0 border-[#222222]">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-[#1D1D1D] text-amber-300 font-bold border border-[#2A2A2A] flex items-center gap-1">
                        <Music className="w-3 h-3 text-amber-400" />
                        <span>{archive.hymns?.length || archive.summary?.totalHymns || 0} Hymns</span>
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalViewingArchive(archive);
                        }}
                        className="p-1.5 rounded-lg text-xs font-semibold bg-[#1D1D1D] hover:bg-[#252525] text-amber-300 border border-[#2A2A2A] transition-all flex items-center gap-1 cursor-pointer"
                        title="Open complete archive viewer with all tabs"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span className="hidden md:inline">Full View</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyHymns(archive);
                        }}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                          copiedId === archive.id
                            ? 'bg-emerald-500 text-neutral-950 font-bold'
                            : 'bg-[#1D1D1D] hover:bg-[#252525] text-neutral-300 border border-[#2A2A2A]'
                        }`}
                        title="Copy hymn sheet to clipboard"
                      >
                        {copiedId === archive.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span className="hidden md:inline">{copiedId === archive.id ? 'Copied' : 'Copy Hymns'}</span>
                      </button>

                      {onDeleteHistoryRecord && (
                        deleteConfirmId === archive.id ? (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 bg-rose-950/90 px-2 py-1 rounded-lg border border-rose-500/40"
                          >
                            <span className="text-[10px] text-rose-200 font-bold">Remove?</span>
                            <button
                              type="button"
                              id={`confirm-delete-history-${archive.id}`}
                              onClick={async () => {
                                await onDeleteHistoryRecord(archive.id);
                                setDeleteConfirmId(null);
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-sm"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="p-0.5 rounded text-neutral-400 hover:text-white"
                              title="Cancel"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            id={`delete-history-btn-${archive.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(archive.id);
                            }}
                            className="p-1.5 rounded-lg bg-[#1D1D1D] hover:bg-rose-950/40 text-neutral-500 hover:text-rose-400 border border-[#2A2A2A] transition-colors"
                            title="Delete history record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )
                      )}
                    </div>

                    <div className="p-1.5 rounded-lg bg-[#1D1D1D] text-neutral-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details View */}
                {isExpanded && (
                  <div className="p-5 border-t border-[#1F1F1F] bg-[#0C0C0C] space-y-6 animate-in fade-in">
                    {/* Section Switcher Tabs */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1E1E1E]">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          { key: 'all', label: 'All Details', icon: Layers },
                          { key: 'liturgies', label: 'Liturgies & Novenas', icon: Church, count: (archive.novenaEntries?.length || 0) + (archive.flagHoisting ? 1 : 0) + (archive.vespers ? 1 : 0) + (archive.highMass ? 1 : 0) },
                          { key: 'attendance', label: 'Attendance & Practices', icon: Users, count: archive.practices?.length || 0 },
                          { key: 'hymns', label: 'Hymns Sheet', icon: Music, count: archive.hymns?.length || 0 },
                          { key: 'tasks', label: 'Duties & Tasks', icon: BookOpen, count: archive.tasks?.length || 0 },
                          { key: 'budget', label: 'Financial Budget', icon: Wallet, count: archive.budget?.length || 0 },
                        ].map((sec) => {
                          const active = (archiveSectionTab[archive.id] || 'all') === sec.key;
                          const IconComp = sec.icon;
                          return (
                            <button
                              key={sec.key}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setArchiveSectionTab({ ...archiveSectionTab, [archive.id]: sec.key as any });
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                                active
                                  ? 'bg-amber-500 text-neutral-950 shadow-md font-black'
                                  : 'bg-[#181818] hover:bg-[#222222] text-neutral-300 border border-[#262626]'
                              }`}
                            >
                              <IconComp className="w-3.5 h-3.5" />
                              <span>{sec.label}</span>
                              {sec.count !== undefined && sec.count > 0 && (
                                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                                  active ? 'bg-black/30 text-neutral-950 font-black' : 'bg-[#2A2A2A] text-amber-300'
                                }`}>
                                  {sec.count}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModalViewingArchive(archive);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1C1C1C] hover:bg-[#282828] text-amber-300 border border-amber-500/30 flex items-center gap-1.5 cursor-pointer"
                        title="Open complete immersive modal archive viewer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Immersive Full View</span>
                      </button>
                    </div>

                    {/* Summary KPI Overview Header */}
                    {(() => {
                      const practicesList = archive.practices || [];
                      let totalAttendancesCount = 0;
                      let presentAttendancesCount = 0;
                      practicesList.forEach((p) => {
                        if (Array.isArray(p.attendance)) {
                          p.attendance.forEach((att) => {
                            totalAttendancesCount++;
                            if (att.status === 'Present' || att.status === 'Late') {
                              presentAttendancesCount++;
                            }
                          });
                        }
                      });
                      const attendancePercent = totalAttendancesCount > 0
                        ? Math.round((presentAttendancesCount / totalAttendancesCount) * 100)
                        : (archive.summary?.attendanceAvgPercent || 96);

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 rounded-2xl bg-[#141414] border border-[#242424]">
                            <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                              <Music className="w-3 h-3 text-amber-400" />
                              <span>Total Hymns</span>
                            </div>
                            <div className="text-xl font-black text-white font-mono mt-1">
                              {archive.hymns?.length || archive.summary?.totalHymns || 0}
                            </div>
                            <div className="text-[10px] text-amber-400/80 mt-0.5 font-medium">Repertoire Backed Up</div>
                          </div>

                          <div className="p-3 rounded-2xl bg-[#141414] border border-[#242424]">
                            <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-emerald-400" />
                              <span>Choir Attendance</span>
                            </div>
                            <div className="text-xl font-black text-emerald-400 font-mono mt-1">
                              {attendancePercent}%
                            </div>
                            <div className="text-[10px] text-neutral-400 mt-0.5">
                              {presentAttendancesCount > 0 ? `${presentAttendancesCount}/${totalAttendancesCount} Present` : 'Full Choir Roster'}
                            </div>
                          </div>

                          <div className="p-3 rounded-2xl bg-[#141414] border border-[#242424]">
                            <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                              <Award className="w-3 h-3 text-sky-400" />
                              <span>Rehearsals Recorded</span>
                            </div>
                            <div className="text-xl font-black text-white font-mono mt-1">
                              {practicesList.length || archive.summary?.totalPractices || 0}
                            </div>
                            <div className="text-[10px] text-neutral-400 mt-0.5">Choir Loft &amp; Sanctuary</div>
                          </div>

                          <div className="p-3 rounded-2xl bg-[#141414] border border-[#242424]">
                            <div className="text-[10px] uppercase font-bold text-neutral-400 flex items-center gap-1">
                              <Wallet className="w-3 h-3 text-amber-400" />
                              <span>Budget Performance</span>
                            </div>
                            <div className="text-xl font-black text-amber-300 font-mono mt-1">
                              Rs. {(archive.summary?.totalActualSpent || 0).toLocaleString()}
                            </div>
                            <div className="text-[10px] text-neutral-400 mt-0.5 truncate">
                              Budgeted: Rs. {(archive.summary?.totalBudgeted || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Historical Notes & Particulars */}
                    {archive.notes && (
                      <div className="p-4 rounded-2xl bg-[#161616] border border-[#292929] text-xs text-neutral-300 leading-relaxed shadow-sm">
                        <div className="flex items-center gap-2 mb-1.5">
                          <FileText className="w-4 h-4 text-amber-400" />
                          <strong className="text-amber-300 uppercase tracking-wider text-[11px]">Historical Record Particulars</strong>
                        </div>
                        <p className="text-neutral-200">{archive.notes}</p>
                        <div className="mt-2 pt-2 border-t border-[#242424] flex items-center justify-between text-[11px] text-neutral-400">
                          <span>Archived by: <strong className="text-white">{archive.archivedBy}</strong></span>
                          <span>Timestamp: <strong className="text-neutral-300">{archive.archivedAt}</strong></span>
                        </div>
                      </div>
                    )}

                    {/* SECTION 1: FEAST LITURGIES, FLAG HOISTING & 9 NOVENAS */}
                    {((archiveSectionTab[archive.id] || 'all') === 'all' || (archiveSectionTab[archive.id] || 'all') === 'liturgies') && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                            <Church className="w-4 h-4 text-amber-400" />
                            <span>Solemn Feast Liturgies &amp; Nine Days Novenas</span>
                          </h5>
                          <span className="text-[11px] text-neutral-400">
                            Complete Schedule &amp; Liturgical Music
                          </span>
                        </div>

                        {/* Flag Hoisting Liturgy */}
                        {archive.flagHoisting && (
                          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 via-[#1C1608]/40 to-[#141414] border border-amber-500/30">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-2.5 mb-2.5">
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                                  <Flag className="w-4 h-4" />
                                </span>
                                <div>
                                  <h6 className="font-bold text-white text-sm">Flag Hoisting Liturgy &amp; Procession</h6>
                                  <span className="text-[11px] text-amber-300 font-mono">
                                    {archive.flagHoisting.date} • {archive.flagHoisting.time}
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs text-neutral-300">
                                Organist: <strong className="text-white">{archive.flagHoisting.organist || 'CHAMATHKA'}</strong>
                              </div>
                            </div>
                            {archive.flagHoisting.notes && (
                              <p className="text-xs text-neutral-300 italic">
                                {archive.flagHoisting.notes}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Complete Nine Days Novenas */}
                        {archive.novenaEntries && archive.novenaEntries.length > 0 && (
                          <div className="space-y-3">
                            <div className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                              <Award className="w-3.5 h-3.5 text-amber-400" />
                              <span>Nine Days of Novenas ({archive.novenaEntries.length} Days)</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {archive.novenaEntries.map((nov) => (
                                <div
                                  key={nov.dayNumber}
                                  className="p-4 rounded-2xl bg-[#141414] border border-[#242424] space-y-3 hover:border-amber-500/40 transition-all flex flex-col justify-between"
                                >
                                  <div>
                                    <div className="flex items-center justify-between gap-2 border-b border-[#202020] pb-2">
                                      <span className="font-black text-amber-300 text-xs uppercase font-mono">
                                        {nov.dayLabel}
                                      </span>
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        ✓ Celebrated
                                      </span>
                                    </div>

                                    <div className="mt-2">
                                      <div className="text-xs font-mono text-neutral-400">
                                        📅 {nov.date} • 📿 {nov.rosaryTime || '6.30ට'} • ✝️ {nov.massTime || '7.00ට'}
                                      </div>
                                      <h6 className="font-bold text-white text-sm mt-1 leading-snug">
                                        {nov.themeTitle}
                                      </h6>
                                      {nov.themeQuote && (
                                        <p className="text-[11px] text-neutral-300 italic mt-1 bg-[#191919] p-2 rounded-xl border border-[#222222]">
                                          "{nov.themeQuote}"
                                        </p>
                                      )}
                                    </div>

                                    {/* Liturgical Ministers */}
                                    <div className="mt-3 space-y-1 text-xs border-t border-[#1F1F1F] pt-2">
                                      <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                                        <span>Organist:</span>
                                        <strong className="text-neutral-200">{nov.organist || 'Unassigned'}</strong>
                                      </div>
                                      <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                                        <span>Responsorial Psalm:</span>
                                        <strong className="text-amber-300">{nov.responsorialPsalmPerson || 'Unassigned'}</strong>
                                      </div>
                                      <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                                        <span>Alleluia:</span>
                                        <strong className="text-neutral-200">{nov.alleluiaPerson || 'Unassigned'}</strong>
                                      </div>
                                      {nov.celebrant && (
                                        <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                                          <span>Celebrant:</span>
                                          <strong className="text-neutral-200">{nov.celebrant}</strong>
                                        </div>
                                      )}
                                    </div>

                                    {/* Novena Hymn Lineup */}
                                    <div className="mt-3 pt-2 border-t border-[#1F1F1F] space-y-1">
                                      <div className="text-[10px] uppercase font-bold text-neutral-400">Novena Hymns Sung:</div>
                                      <div className="flex flex-wrap gap-1 text-[10px]">
                                        {nov.blessingHymn && (
                                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                            Blessing: {nov.blessingHymn}
                                          </span>
                                        )}
                                        {nov.entranceHymn && (
                                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                            Entrance: {nov.entranceHymn}
                                          </span>
                                        )}
                                        {nov.offertory1Hymn && (
                                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                            Offertory: {nov.offertory1Hymn}
                                          </span>
                                        )}
                                        {nov.communion1Hymn && (
                                          <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                                            Communion: {nov.communion1Hymn}
                                          </span>
                                        )}
                                        {nov.finalHymn && (
                                          <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                            Recessional: {nov.finalHymn}
                                          </span>
                                        )}
                                        {nov.specialHymn && (
                                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-500/30 font-bold">
                                            Special: {nov.specialHymn}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Solemn Vespers Service */}
                        {archive.vespers && (
                          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/30 via-[#180E24]/40 to-[#141414] border border-purple-500/30">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/20 pb-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                                  <Church className="w-4 h-4" />
                                </span>
                                <div>
                                  <h6 className="font-bold text-white text-sm">Solemn Vespers Service (Feast Eve)</h6>
                                  <span className="text-[11px] text-purple-300 font-mono">
                                    {archive.vespers.date} • {archive.vespers.time}
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs text-neutral-300">
                                Tevadharaya: <strong className="text-white">{archive.vespers.tevadharaya || 'K. D. D. Peiris'}</strong>
                              </div>
                            </div>
                            {archive.vespers.notes && (
                              <p className="text-xs text-neutral-300 italic">
                                {archive.vespers.notes}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Feast Day Early Masses */}
                        {archive.feastMasses && (
                          <div className="p-4 rounded-2xl bg-[#141414] border border-[#242424] space-y-2.5">
                            <div className="flex items-center justify-between border-b border-[#202020] pb-2">
                              <h6 className="font-bold text-white text-sm flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-amber-400" />
                                <span>Feast Day Morning Holy Masses ({archive.feastMasses.date})</span>
                              </h6>
                              <span className="text-xs text-neutral-400">Sinhala &amp; English Services</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                              <div className="p-3 rounded-xl bg-[#181818] border border-[#222222]">
                                <div className="font-bold text-amber-400 text-xs">5:00 AM Mass</div>
                                <div className="text-neutral-400 text-[11px] mt-1">Psalm: <strong className="text-white">{archive.feastMasses.mass5Psalm || 'SHAVEEN S'}</strong></div>
                                <div className="text-neutral-400 text-[11px]">Alleluia: <strong className="text-white">{archive.feastMasses.mass5Alleluia || 'METHUSHI'}</strong></div>
                              </div>
                              <div className="p-3 rounded-xl bg-[#181818] border border-[#222222]">
                                <div className="font-bold text-amber-400 text-xs">6:00 AM Mass</div>
                                <div className="text-neutral-400 text-[11px] mt-1">Psalm: <strong className="text-white">{archive.feastMasses.mass6Psalm || 'CRISHMAL'}</strong></div>
                                <div className="text-neutral-400 text-[11px]">Alleluia: <strong className="text-white">{archive.feastMasses.mass6Alleluia || 'CHAMATHKA'}</strong></div>
                              </div>
                              <div className="p-3 rounded-xl bg-[#181818] border border-[#222222]">
                                <div className="font-bold text-amber-400 text-xs">6:30 AM Mass</div>
                                <div className="text-neutral-400 text-[11px] mt-1">Psalm: <strong className="text-white">{archive.feastMasses.mass630Psalm || 'MELANI'}</strong></div>
                                <div className="text-neutral-400 text-[11px]">Alleluia: <strong className="text-white">{archive.feastMasses.mass630Alleluia || 'VINDYA'}</strong></div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Solemn Festive High Mass */}
                        {archive.highMass && (
                          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-[#1C1306]/50 to-[#141414] border border-amber-500/40 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
                              <div className="flex items-center gap-2">
                                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                                  <Sparkles className="w-4 h-4" />
                                </span>
                                <div>
                                  <h6 className="font-bold text-white text-base">Solemn Festive High Mass of the Patronal Feast</h6>
                                  <span className="text-xs text-amber-300 font-mono">
                                    {archive.highMass.date} • {archive.highMass.time || '8.00 AM'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-xs text-neutral-300">
                                Organist: <strong className="text-white">{archive.highMass.organist || 'CHAMATHKA'}</strong>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                              <div className="p-2.5 rounded-xl bg-[#161616] border border-[#222222]">
                                <span className="text-neutral-400 text-[10px] uppercase font-bold">1st Psalm:</span>
                                <div className="font-bold text-white text-xs mt-0.5">{archive.highMass.psalm1 || 'SHAVEEN S'}</div>
                              </div>
                              <div className="p-2.5 rounded-xl bg-[#161616] border border-[#222222]">
                                <span className="text-neutral-400 text-[10px] uppercase font-bold">2nd Psalm:</span>
                                <div className="font-bold text-white text-xs mt-0.5">{archive.highMass.psalm2 || 'METHUSHI'}</div>
                              </div>
                              <div className="p-2.5 rounded-xl bg-[#161616] border border-[#222222]">
                                <span className="text-neutral-400 text-[10px] uppercase font-bold">Gospel Alleluia:</span>
                                <div className="font-bold text-white text-xs mt-0.5">{archive.highMass.alleluia || 'MELANI'}</div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                              {archive.highMass.entranceHymn && (
                                <div className="p-2 rounded-xl bg-[#161616] border border-[#222222]">
                                  <div className="text-[10px] uppercase font-bold text-amber-400">Entrance:</div>
                                  <div className="font-bold text-white truncate text-[11px] mt-0.5">{archive.highMass.entranceHymn}</div>
                                </div>
                              )}
                              {archive.highMass.offertoryHymn && (
                                <div className="p-2 rounded-xl bg-[#161616] border border-[#222222]">
                                  <div className="text-[10px] uppercase font-bold text-emerald-400">Offertory:</div>
                                  <div className="font-bold text-white truncate text-[11px] mt-0.5">{archive.highMass.offertoryHymn}</div>
                                </div>
                              )}
                              {archive.highMass.communionHymn && (
                                <div className="p-2 rounded-xl bg-[#161616] border border-[#222222]">
                                  <div className="text-[10px] uppercase font-bold text-rose-400">Communion:</div>
                                  <div className="font-bold text-white truncate text-[11px] mt-0.5">{archive.highMass.communionHymn}</div>
                                </div>
                              )}
                              {archive.highMass.finalHymn && (
                                <div className="p-2 rounded-xl bg-[#161616] border border-[#222222]">
                                  <div className="text-[10px] uppercase font-bold text-purple-400">Recessional:</div>
                                  <div className="font-bold text-white truncate text-[11px] mt-0.5">{archive.highMass.finalHymn}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SECTION 2: ATTENDANCE & REHEARSALS / PRACTICES ROSTER */}
                    {((archiveSectionTab[archive.id] || 'all') === 'all' || (archiveSectionTab[archive.id] || 'all') === 'attendance') && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-4 h-4 text-emerald-400" />
                            <span>Choir Rehearsals, Practices &amp; Full Attendance Roster ({archive.practices?.length || 0})</span>
                          </h5>
                          <span className="text-[11px] text-neutral-400">Every chorister status &amp; notes preserved</span>
                        </div>

                        {(!archive.practices || archive.practices.length === 0) ? (
                          <div className="p-4 rounded-2xl bg-[#141414] border border-[#222222] text-xs text-neutral-400 italic">
                            No rehearsal attendance records attached to this historical snapshot.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {archive.practices.map((practice, pIdx) => {
                              const attList = practice.attendance || [];
                              const presentCount = attList.filter((a) => a.status === 'Present' || a.status === 'Late').length;
                              const sessionPercent = attList.length > 0 ? Math.round((presentCount / attList.length) * 100) : 100;

                              return (
                                <div
                                  key={practice.id || pIdx}
                                  className="p-4 rounded-2xl bg-[#141414] border border-[#242424] space-y-3 hover:border-[#333] transition-all"
                                >
                                  {/* Session Header */}
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#202020] pb-2.5">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-white text-sm">
                                          Rehearsal #{pIdx + 1} • {practice.date}
                                        </span>
                                        {practice.startTime && (
                                          <span className="text-xs text-neutral-400 font-mono">
                                            {practice.startTime} - {practice.endTime || '20:00'}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-xs text-amber-300 font-medium mt-0.5">
                                        📍 {practice.venue || "St. Michael's Church Choir Loft"}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                        {presentCount}/{attList.length} Present ({sessionPercent}%)
                                      </span>
                                    </div>
                                  </div>

                                  {practice.focus && (
                                    <div className="text-xs text-neutral-300">
                                      <strong className="text-amber-400">Repertoire Focus: </strong>
                                      {practice.focus}
                                    </div>
                                  )}

                                  {practice.notes && (
                                    <div className="text-xs text-neutral-400 italic bg-[#171717] p-2 rounded-xl border border-[#222222]">
                                      {practice.notes}
                                    </div>
                                  )}

                                  {/* Chorister Attendance Table / Grid */}
                                  {attList.length > 0 && (
                                    <div className="mt-2 space-y-1.5">
                                      <div className="text-[10px] uppercase font-bold text-neutral-400">Chorister Attendance Roster:</div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                        {attList.map((att, attIdx) => {
                                          let statusStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                                          if (att.status === 'Late') statusStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                                          else if (att.status === 'Absent') statusStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                                          else if (att.status === 'Excused') statusStyle = 'bg-sky-500/20 text-sky-300 border-sky-500/30';

                                          return (
                                            <div
                                              key={att.choristerId || attIdx}
                                              className="p-2 rounded-xl bg-[#181818] border border-[#222222] text-xs flex items-center justify-between gap-1.5"
                                            >
                                              <div className="truncate min-w-0">
                                                <div className="font-bold text-white truncate text-xs">
                                                  {att.choristerName}
                                                </div>
                                                <div className="text-[10px] text-neutral-400 truncate">
                                                  {att.role || 'Chorister'} {att.notes ? `• ${att.notes}` : ''}
                                                </div>
                                              </div>
                                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 border ${statusStyle}`}>
                                                {att.status}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SECTION 3: HYMNS SUNG & LITURGICAL REPERTOIRE */}
                    {((archiveSectionTab[archive.id] || 'all') === 'all' || (archiveSectionTab[archive.id] || 'all') === 'hymns') && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Music className="w-3.5 h-3.5 text-amber-400" />
                            <span>Complete Hymns &amp; Liturgical Repertoire ({archive.hymns?.length || 0})</span>
                          </h5>
                          <button
                            type="button"
                            onClick={() => handleCopyHymns(archive)}
                            className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy Hymn Sheet</span>
                          </button>
                        </div>

                        {(!archive.hymns || archive.hymns.length === 0) ? (
                          <p className="text-xs text-neutral-500 italic p-3 rounded-xl bg-[#141414] border border-[#222222]">
                            No specific hymns recorded for this date.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                            {archive.hymns.map((h, idx) => {
                              const cat = (h.category || '').toLowerCase();
                              let catStyle = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
                              if (cat.includes('entrance')) catStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
                              else if (cat.includes('offertory')) catStyle = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                              else if (cat.includes('communion')) catStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
                              else if (cat.includes('recessional') || cat.includes('final')) catStyle = 'bg-sky-500/20 text-sky-300 border-sky-500/30';

                              return (
                                <div
                                  key={h.id || idx}
                                  className="p-3 rounded-xl bg-[#161616] border border-[#222222] text-xs flex flex-col justify-between gap-2 shadow-sm"
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${catStyle}`}>
                                      {h.category}
                                    </span>
                                    {h.hymnNumber && (
                                      <span className="px-2 py-0.5 rounded bg-[#222222] text-amber-300 text-[10px] font-mono font-bold">
                                        #{h.hymnNumber}
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-bold text-white text-sm mt-1">{h.title}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SECTION 4: ASSIGNED TASKS & DUTIES */}
                    {((archiveSectionTab[archive.id] || 'all') === 'all' || (archiveSectionTab[archive.id] || 'all') === 'tasks') && archive.tasks && archive.tasks.length > 0 && (
                      <div className="space-y-3">
                        <h5 className="text-xs font-black text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-sky-400" />
                          <span>Assigned Duties &amp; Roles ({archive.tasks.length})</span>
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                          {archive.tasks.map((t) => (
                            <div key={t.id} className="p-3 rounded-xl bg-[#161616] border border-[#222222] text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-amber-400 uppercase">{t.duty || t.title}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                                  ✓ Done
                                </span>
                              </div>
                              <div className="font-bold text-white text-sm">{t.assignedTo || 'Unassigned'}</div>
                              {t.deadline && (
                                <div className="text-[10px] text-neutral-400 font-mono">Deadline: {t.deadline}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SECTION 5: FINANCIAL BUDGET & ACCOUNTS */}
                    {((archiveSectionTab[archive.id] || 'all') === 'all' || (archiveSectionTab[archive.id] || 'all') === 'budget') && archive.budget && archive.budget.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-amber-400" />
                            <span>Financial Budget &amp; Account Breakdown ({archive.budget.length} Items)</span>
                          </h5>
                          <div className="text-xs font-mono font-bold text-emerald-400">
                            Net Balance: Rs. {((archive.summary?.totalIncome || 0) - (archive.summary?.totalActualSpent || 0)).toLocaleString()}
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-[#242424] bg-[#141414]">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-[#1A1A1A] text-neutral-400 text-[10px] uppercase border-b border-[#242424]">
                              <tr>
                                <th className="p-3">Description</th>
                                <th className="p-3">Category</th>
                                <th className="p-3">Type</th>
                                <th className="p-3 text-right">Budgeted</th>
                                <th className="p-3 text-right">Actual</th>
                                <th className="p-3 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1F1F1F]">
                              {archive.budget.map((b) => (
                                <tr key={b.id} className="hover:bg-[#181818] transition-colors">
                                  <td className="p-3 font-semibold text-white">{b.description}</td>
                                  <td className="p-3 text-neutral-400 text-[11px]">{b.category || 'General'}</td>
                                  <td className="p-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      b.type === 'income' 
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                    }`}>
                                      {b.type === 'income' ? 'Income' : 'Expense'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right font-mono text-neutral-300">
                                    Rs. {(((b as any).budgetedAmount ?? (b as any).amount) || 0).toLocaleString()}
                                  </td>
                                  <td className="p-3 text-right font-mono font-bold text-white">
                                    Rs. {(((b as any).actualAmount ?? (b as any).budgetedAmount ?? (b as any).amount) || 0).toLocaleString()}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#222222] text-neutral-300">
                                      {b.status || 'Settled'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Manual Entry Modal */}
      {isManualAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] w-full max-w-lg rounded-3xl border border-[#2A2A2A] shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Record Past Mass to History</h3>
                  <p className="text-xs text-neutral-400">Add past week mass hymns &amp; particulars</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManualAddModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Mass / Service Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Saturday English Mass (7:00 AM)"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Mass Date</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Organist Name</label>
                  <input
                    type="text"
                    placeholder="e.g. CHAMATHKA"
                    value={manualOrganist}
                    onChange={(e) => setManualOrganist(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl text-white text-xs uppercase focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1">Reader Name</label>
                  <input
                    type="text"
                    placeholder="e.g. JEREMY PEIRIS"
                    value={manualReader}
                    onChange={(e) => setManualReader(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl text-white text-xs uppercase focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Hymns */}
              <div className="space-y-2 pt-2 border-t border-[#222222]">
                <div className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <Music className="w-3.5 h-3.5 text-amber-400" />
                  <span>Hymns Sung</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-0.5">Entrance</label>
                    <input
                      type="text"
                      placeholder="Enter entrance hymn..."
                      value={manualEntrance}
                      onChange={(e) => setManualEntrance(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-0.5">Offertory</label>
                    <input
                      type="text"
                      placeholder="Enter offertory hymn..."
                      value={manualOffertory}
                      onChange={(e) => setManualOffertory(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-0.5">Communion</label>
                    <input
                      type="text"
                      placeholder="Enter communion hymn..."
                      value={manualCommunion}
                      onChange={(e) => setManualCommunion(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-0.5">Final / Recessional</label>
                    <input
                      type="text"
                      placeholder="Enter final hymn..."
                      value={manualFinal}
                      onChange={(e) => setManualFinal(e.target.value)}
                      className="w-full px-3 py-1.5 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Additional service comments..."
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => setIsManualAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20"
                >
                  Save to History
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rollover Modal */}
      {isRolloverModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] w-full max-w-lg rounded-3xl border border-[#2A2A2A] shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#222222] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Archive &amp; Rollover Program</h3>
                  <p className="text-xs text-neutral-400">Prepare for the next liturgical year</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRolloverModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 leading-relaxed flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>How Rollover Works:</strong>
                <p className="mt-1">
                  1. Creates a complete permanent backup of current hymns, duties, rehearsals, and financials in the <strong>History</strong> database.
                </p>
                <p className="mt-0.5">
                  2. Advances the target date to next year and clears active duties so the committee can begin fresh preparations.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Select Event to Archive &amp; Advance
                </label>
                <select
                  value={selectedEventToRollover}
                  onChange={(e) => setSelectedEventToRollover(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="feast">Parish Feast &amp; Nine Novenas (September 29)</option>
                  <option value="carols">Festival of Carols (December 20)</option>
                  <option value="christmas-new-year">Christmas &amp; New Year (December 25)</option>
                  <option value="easter">Easter &amp; Holy Week</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1">
                  Archival Notes &amp; Concluding Comments (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Concluded with grand procession, high congregation participation, and successful choir fellowship."
                  value={rolloverNotes}
                  onChange={(e) => setRolloverNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#2E2E2E] rounded-xl text-white text-xs focus:outline-none focus:border-amber-500 placeholder:text-neutral-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222222]">
              <button
                type="button"
                onClick={() => setIsRolloverModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmRollover}
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md shadow-amber-500/20 disabled:opacity-50"
              >
                {isProcessing ? 'Backing up...' : 'Confirm Backup & Start Next Year'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMMERSIVE FULL-SCREEN ARCHIVE VIEWER MODAL */}
      {modalViewingArchive && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div className="bg-[#121212] w-full max-w-5xl rounded-3xl border border-[#2A2A2A] shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#222222] bg-[#0A0A0A] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                  <Award className="w-6 h-6" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Liturgical Archive Record
                    </span>
                    <span className="text-xs font-black text-amber-400 font-mono px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      {modalViewingArchive.year}
                    </span>
                    <h3 className="font-bold text-white text-base sm:text-lg truncate">
                      {modalViewingArchive.eventTitle}
                    </h3>
                  </div>
                  <div className="text-xs text-neutral-400 mt-0.5 truncate">
                    📅 {modalViewingArchive.dateRange || modalViewingArchive.massDate} • Archived by {modalViewingArchive.archivedBy}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopyHymns(modalViewingArchive)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1C1C1C] hover:bg-[#282828] text-amber-300 border border-[#2E2E2E] flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Hymns</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalViewingArchive(null)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-white bg-[#1A1A1A] hover:bg-[#252525] transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-[#181818] border border-[#242424]">
                  <div className="text-[10px] uppercase font-bold text-neutral-400">Total Hymns</div>
                  <div className="text-xl font-black text-white font-mono mt-1">
                    {modalViewingArchive.hymns?.length || modalViewingArchive.summary?.totalHymns || 0}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-[#181818] border border-[#242424]">
                  <div className="text-[10px] uppercase font-bold text-neutral-400">Attendance Average</div>
                  <div className="text-xl font-black text-emerald-400 font-mono mt-1">
                    {modalViewingArchive.summary?.attendanceAvgPercent || 96}%
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-[#181818] border border-[#242424]">
                  <div className="text-[10px] uppercase font-bold text-neutral-400">Rehearsals</div>
                  <div className="text-xl font-black text-white font-mono mt-1">
                    {modalViewingArchive.practices?.length || modalViewingArchive.summary?.totalPractices || 0}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-[#181818] border border-[#242424]">
                  <div className="text-[10px] uppercase font-bold text-neutral-400">Net Surplus / Balance</div>
                  <div className="text-xl font-black text-amber-300 font-mono mt-1">
                    Rs. {((modalViewingArchive.summary?.totalIncome || 0) - (modalViewingArchive.summary?.totalActualSpent || 0)).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Novenas */}
              {modalViewingArchive.novenaEntries && modalViewingArchive.novenaEntries.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span>Nine Days Feast Novenas (Complete Spiritual &amp; Choral Lineup)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {modalViewingArchive.novenaEntries.map((n) => (
                      <div key={n.dayNumber} className="p-3.5 rounded-2xl bg-[#161616] border border-[#282828] space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-amber-400 border-b border-[#222] pb-1.5">
                          <span>{n.dayLabel} • {n.date}</span>
                          <span className="text-[10px] text-emerald-400">✓ Done</span>
                        </div>
                        <div className="font-bold text-white text-xs">{n.themeTitle}</div>
                        {n.themeQuote && <p className="text-[11px] text-neutral-400 italic">"{n.themeQuote}"</p>}
                        <div className="text-[11px] text-neutral-300 space-y-0.5 pt-1 border-t border-[#222]">
                          <div>Organist: <strong className="text-white">{n.organist || 'Unassigned'}</strong></div>
                          <div>Psalm: <strong className="text-amber-300">{n.responsorialPsalmPerson || 'Unassigned'}</strong></div>
                          <div>Alleluia: <strong className="text-white">{n.alleluiaPerson || 'Unassigned'}</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Practices with Attendance */}
              {modalViewingArchive.practices && modalViewingArchive.practices.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Practices &amp; Attendance Records</span>
                  </h4>
                  <div className="space-y-3">
                    {modalViewingArchive.practices.map((p, idx) => (
                      <div key={p.id || idx} className="p-4 rounded-2xl bg-[#161616] border border-[#282828] space-y-2.5">
                        <div className="flex items-center justify-between border-b border-[#222] pb-2">
                          <div>
                            <span className="font-bold text-white text-sm">Practice #{idx + 1} • {p.date}</span>
                            <span className="text-xs text-neutral-400 font-mono ml-2">{p.startTime} - {p.endTime || '20:00'}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-300">
                            {p.attendance?.filter(a => a.status === 'Present' || a.status === 'Late').length || 0} Present
                          </span>
                        </div>
                        {p.focus && <div className="text-xs text-neutral-300"><strong className="text-amber-400">Focus: </strong>{p.focus}</div>}
                        {p.attendance && p.attendance.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#222]">
                            {p.attendance.map((att, aIdx) => (
                              <div key={aIdx} className="p-2 rounded-xl bg-[#1A1A1A] text-xs flex items-center justify-between">
                                <span className="font-semibold text-white truncate">{att.choristerName}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  att.status === 'Present' ? 'text-emerald-400' : 'text-amber-400'
                                }`}>{att.status}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#222] bg-[#0A0A0A] flex items-center justify-between shrink-0">
              <span className="text-xs text-neutral-400">
                Verified: <strong className="text-white">St. Cecilia Choir Historical Archive</strong>
              </span>
              <button
                type="button"
                onClick={() => setModalViewingArchive(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
