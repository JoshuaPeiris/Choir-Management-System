import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  MapPin, 
  Calendar,
  Edit, 
  Trash2, 
  Check, 
  X, 
  Download,
  Music,
  Headphones,
  Star,
  Sparkles,
  Volume2,
  Piano,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Cake,
  PartyPopper,
  MessageCircle,
  GraduationCap,
  Briefcase,
  Clock,
  Image as ImageIcon,
  ShieldCheck,
  Grid,
  List
} from 'lucide-react';
import { Chorister, ChoristerRole, CommitteeMember, CommitteeRole, PracticeSession } from '../types';
import { 
  isBirthdayToday, 
  calculateBirthdayAge, 
  calculateCurrentAge,
  getChoristerAge,
  getTodayBirthdayChoristers,
  formatBirthdayGreeting 
} from '../utils/birthdayUtils';
import { getDriveDirectImageUrl } from '../utils/driveImage';
import { calculateChoristerAttendance as calculateChoristerAttendanceCore } from '../utils/massAttendanceUtils';
import { DriveUrlInput } from './DriveUrlInput';

export const PARISH_SUNDAY_MASSES = [
  'Sunday - 8.00 am',
  'Saturday - 6.00 pm',
  'Sunday - 6.30 am',
  'Saturday - 6.00 pm, Sunday - 6.30 am',
  'Sunday - 6.30 am, Sunday - 8.00 am',
  'Saturday - 6.00 pm, Sunday - 8.00 am',
  'All Sunday Masses',
  'Any Sunday Mass',
];

interface ChoristersDatabaseProps {
  choristers: Chorister[];
  activeMember: CommitteeMember;
  currentDate?: Date;
  practices?: PracticeSession[];
  onAddChorister: (chorister: Partial<Chorister>) => Promise<void>;
  onUpdateChorister: (id: string, chorister: Partial<Chorister>) => Promise<void>;
  onDeleteChorister: (id: string) => Promise<void>;
  onGenerateFlyer?: (chorister: Chorister) => void;
}

export function calculateChoristerAttendance(choristerOrId: string | Chorister, practices: PracticeSession[], allChoristers?: Chorister[]) {
  let targetChorister: Chorister;
  if (typeof choristerOrId === 'object' && choristerOrId !== null) {
    targetChorister = choristerOrId;
  } else if (allChoristers) {
    targetChorister = allChoristers.find((c) => c.id === choristerOrId) || {
      id: String(choristerOrId),
      name: '',
      age: 0,
      birthdate: '',
      address: '',
      phoneNumber: '',
      role: 'Chorister',
    };
  } else {
    targetChorister = {
      id: String(choristerOrId),
      name: '',
      age: 0,
      birthdate: '',
      address: '',
      phoneNumber: '',
      role: 'Chorister',
    };
  }
  return calculateChoristerAttendanceCore(targetChorister, practices);
}

// Voice rating tier helper function
export function getVoiceRatingDetails(rating?: number) {
  if (!rating) {
    return {
      label: 'Unrated',
      desc: 'Not evaluated yet',
      badgeClass: 'bg-neutral-800/80 text-neutral-400 border-neutral-700 hover:border-neutral-500',
      tagClass: 'bg-neutral-800 text-neutral-400',
      accentColor: 'text-neutral-500',
    };
  }
  if (rating >= 10) {
    return {
      label: '10/10 Master Soloist',
      desc: 'Principal Soloist / Exceptional Master Cantor',
      badgeClass: 'bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/10',
      tagClass: 'bg-amber-500/20 text-amber-300',
      accentColor: 'text-amber-400',
    };
  }
  if (rating === 9) {
    return {
      label: '9/10 Exceptional Cantor',
      desc: 'Outstanding Vocal Quality & Projection',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      tagClass: 'bg-emerald-500/25 text-emerald-300',
      accentColor: 'text-emerald-400',
    };
  }
  if (rating >= 7) {
    return {
      label: `${rating}/10 Strong Choral Voice`,
      desc: 'Lead Section Singer / Reliable Cantor',
      badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      tagClass: 'bg-blue-500/25 text-blue-300',
      accentColor: 'text-blue-400',
    };
  }
  if (rating >= 5) {
    return {
      label: `${rating}/10 Good Choral Blend`,
      desc: 'Solid Choral Harmony Singer',
      badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      tagClass: 'bg-teal-500/25 text-teal-300',
      accentColor: 'text-teal-400',
    };
  }
  return {
    label: `${rating}/10 Developing Voice`,
    desc: 'Junior / Vocal Training in Progress',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    tagClass: 'bg-amber-500/20 text-amber-300',
    accentColor: 'text-amber-400',
  };
}

export const ChoristersDatabase: React.FC<ChoristersDatabaseProps> = ({
  choristers,
  activeMember,
  currentDate,
  practices = [],
  onAddChorister,
  onUpdateChorister,
  onDeleteChorister,
  onGenerateFlyer,
}) => {
  const refDate = currentDate || new Date();
  const todayCelebrants = getTodayBirthdayChoristers(choristers, refDate);
  const [filterBirthdayOnly, setFilterBirthdayOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [ratingFilter, setRatingFilter] = useState<string>('All');
  const [massFilter, setMassFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'age'>('name');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [mobileViewMode, setMobileViewMode] = useState<'compact' | 'detailed'>('compact');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingChorister, setEditingChorister] = useState<Chorister | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isLeadJoshua = Boolean(
    activeMember?.name?.trim().toLowerCase() === 'joshua peiris' ||
    activeMember?.name?.trim().toLowerCase() === 'joshua' ||
    activeMember?.id === 'choir-joshua-peiris' ||
    (activeMember as any)?.email === 'jshpeiris@gmail.com'
  );

  // Available starting letters from active choristers
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    choristers.forEach((c) => {
      const firstChar = c.name.trim().charAt(0).toUpperCase();
      if (firstChar && firstChar >= 'A' && firstChar <= 'Z') letters.add(firstChar);
    });
    return Array.from(letters).sort();
  }, [choristers]);

  // Quick Voice Rating Popover for "when I see them"
  const [quickRatingChoristerId, setQuickRatingChoristerId] = useState<string | null>(null);
  const [quickNotesText, setQuickNotesText] = useState('');
  const [quickSuccessMsg, setQuickSuccessMsg] = useState('');

  // Form state: Name, Age, Birthdate, Address, Phone Number, Role, Committee Role, Voice Rating (1-10), Voice Notes, Preferences
  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    firstName: '',
    lastName: '',
    age: 0,
    birthdate: '',
    address: '',
    phoneNumber: '',
    parentPhone: '',
    role: 'Chorister' as ChoristerRole,
    committeeRole: undefined as CommitteeRole | undefined,
    voiceRating: undefined as number | undefined,
    voiceNotes: '',
    photoUrl: '',
    dateJoined: '',
    isSchoolStudent: false,
    weeklyMassPreference: '',
    sundayMassPreference: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      fullName: '',
      firstName: '',
      lastName: '',
      age: 0,
      birthdate: '',
      address: '',
      phoneNumber: '',
      parentPhone: '',
      role: 'Chorister',
      committeeRole: undefined,
      voiceRating: undefined,
      voiceNotes: '',
      photoUrl: '',
      dateJoined: '',
      isSchoolStudent: false,
      weeklyMassPreference: '',
      sundayMassPreference: '',
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (chorister: Chorister) => {
    setEditingChorister(chorister);
    setFormData({
      name: chorister.name,
      fullName: chorister.fullName || chorister.name,
      firstName: chorister.firstName || '',
      lastName: chorister.lastName || '',
      age: getChoristerAge(chorister, refDate),
      birthdate: chorister.birthdate || '',
      address: chorister.address || '',
      phoneNumber: chorister.phoneNumber || '',
      parentPhone: chorister.parentPhone || '',
      role: chorister.role || 'Chorister',
      committeeRole: chorister.committeeRole || undefined,
      voiceRating: chorister.voiceRating,
      voiceNotes: chorister.voiceNotes || '',
      photoUrl: chorister.photoUrl || '',
      dateJoined: chorister.dateJoined || '',
      isSchoolStudent: chorister.isSchoolStudent || false,
      weeklyMassPreference: chorister.weeklyMassPreference || '',
      sundayMassPreference: chorister.sundayMassPreference || '',
    });
  };

  // Auto-calculate exact age if birthdate is picked
  const handleBirthdateChange = (dateVal: string) => {
    const computedAge = calculateCurrentAge(dateVal, refDate);
    setFormData((prev) => ({
      ...prev,
      birthdate: dateVal,
      age: computedAge !== null ? computedAge : prev.age,
    }));
  };

  const handleSaveChorister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingChorister) {
      await onUpdateChorister(editingChorister.id, formData);
      setEditingChorister(null);
    } else {
      await onAddChorister(formData);
      setIsAddModalOpen(false);
    }
    resetForm();
  };

  const confirmDelete = async (id: string) => {
    await onDeleteChorister(id);
    setDeletingId(null);
  };

  // Instant on-the-spot voice rating handler ("when I see them")
  const handleRateVoiceInstant = async (chorister: Chorister, rating: number | undefined) => {
    await onUpdateChorister(chorister.id, {
      voiceRating: rating,
      voiceNotes: quickNotesText !== '' ? quickNotesText : chorister.voiceNotes,
    });
    setQuickSuccessMsg(`Rated ${rating ? `${rating}/10` : 'Cleared'} for ${chorister.name}!`);
    setTimeout(() => {
      setQuickSuccessMsg('');
      setQuickRatingChoristerId(null);
    }, 900);
  };

  // Filtered & Sorted list
  const filteredChoristers = choristers
    .filter((c) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = !query ||
        c.name.toLowerCase().includes(query) ||
        (c.fullName && c.fullName.toLowerCase().includes(query)) ||
        (c.firstName && c.firstName.toLowerCase().includes(query)) ||
        (c.lastName && c.lastName.toLowerCase().includes(query)) ||
        (c.committeeRole && c.committeeRole.toLowerCase().includes(query)) ||
        (query.includes('comm') && Boolean(c.committeeRole)) ||
        (c.address && c.address.toLowerCase().includes(query)) ||
        (c.phoneNumber && c.phoneNumber.toLowerCase().includes(query)) ||
        (c.parentPhone && c.parentPhone.toLowerCase().includes(query)) ||
        (c.birthdate && c.birthdate.toLowerCase().includes(query)) ||
        (c.weeklyMassPreference && c.weeklyMassPreference.toLowerCase().includes(query)) ||
        (c.sundayMassPreference && c.sundayMassPreference.toLowerCase().includes(query)) ||
        (c.voiceNotes && c.voiceNotes.toLowerCase().includes(query)) ||
        c.role.toLowerCase().includes(query);

      const matchesRole = 
        selectedRole === 'All' || 
        (selectedRole === 'Committee' ? Boolean(c.committeeRole) : c.role === selectedRole);

      let matchesRating = true;
      if (ratingFilter === 'Rated') matchesRating = (c.voiceRating || 0) > 0;
      else if (ratingFilter === 'Top') matchesRating = (c.voiceRating || 0) >= 9;
      else if (ratingFilter === 'Strong') matchesRating = (c.voiceRating || 0) >= 7 && (c.voiceRating || 0) <= 8;
      else if (ratingFilter === 'Blend') matchesRating = (c.voiceRating || 0) >= 5 && (c.voiceRating || 0) <= 6;
      else if (ratingFilter === 'Developing') matchesRating = (c.voiceRating || 0) > 0 && (c.voiceRating || 0) <= 4;
      else if (ratingFilter === 'Unrated') matchesRating = !c.voiceRating;

      let matchesBirthday = true;
      if (filterBirthdayOnly) {
        matchesBirthday = isBirthdayToday(c.birthdate, refDate);
      }

      let matchesMass = true;
      if (massFilter !== 'All') {
        if (massFilter === 'Other') {
          matchesMass = !c.sundayMassPreference || c.sundayMassPreference.includes(',');
        } else {
          matchesMass = Boolean(c.sundayMassPreference && c.sundayMassPreference.includes(massFilter));
        }
      }

      const matchesLetter = 
        selectedLetter === 'ALL' || 
        c.name.trim().toUpperCase().startsWith(selectedLetter);

      return matchesLetter && matchesSearch && matchesRole && matchesRating && matchesBirthday && matchesMass;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.voiceRating || 0) - (a.voiceRating || 0);
      }
      if (sortBy === 'age') {
        return getChoristerAge(a, refDate) - getChoristerAge(b, refDate);
      }
      return a.name.localeCompare(b.name);
    });

  const roleCounts = {
    All: choristers.length,
    Committee: choristers.filter((c) => Boolean(c.committeeRole)).length,
    Chorister: choristers.filter((c) => c.role === 'Chorister').length,
    Organist: choristers.filter((c) => c.role === 'Organist').length,
    'Instrument Player': choristers.filter((c) => c.role === 'Instrument Player').length,
  };

  const exportCSV = () => {
    const headers = [
      'Name', 
      'Full Name', 
      'Role', 
      'Committee Role',
      'Phone Number', 
      'Parent Phone', 
      'Sunday Mass Duty', 
      'Weekly Mass Duty', 
      'Status', 
      'Date Joined', 
      'Address', 
      'Age', 
      'Birthdate', 
      'Voice Rating (1-10)', 
      'Voice Notes'
    ];
    const rows = choristers.map((c) => [
      `"${c.name}"`,
      `"${c.fullName || c.name}"`,
      `"${c.role}"`,
      `"${c.committeeRole || 'Member'}"`,
      `"${c.phoneNumber || ''}"`,
      `"${c.parentPhone || ''}"`,
      `"${c.sundayMassPreference || ''}"`,
      `"${c.weeklyMassPreference || ''}"`,
      `"${c.isSchoolStudent ? 'School Student' : 'Working / Adult'}"`,
      `"${c.dateJoined || ''}"`,
      `"${c.address || ''}"`,
      getChoristerAge(c, refDate) || '',
      `"${c.birthdate || ''}"`,
      c.voiceRating || '',
      `"${c.voiceNotes || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `st_cecilia_choir_members_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top action row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121212] p-5 rounded-2xl border border-[#222222] shadow-xl">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Manage Choristers & Organists
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {choristers.length} Appointed Members
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>Voice Rating Active (1–10)</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            St. Cecilia's Choir registry with voice evaluation (1–10), role duties, and parish contact records.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {onGenerateFlyer && choristers.length > 0 && (
            <button
              id="header-generate-flyer-btn"
              onClick={() => onGenerateFlyer(todayCelebrants[0] || choristers[0])}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 transition-all shadow-sm cursor-pointer active:scale-95"
              title="Open St. Cecilia Birthday Flyer Generator"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Flyer Generator</span>
            </button>
          )}

          {choristers.length > 0 && (
            <button
              id="export-choristers-csv-btn"
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-300 bg-[#1A1A1A] hover:bg-[#242424] transition-colors border border-[#333333]"
              title="Download CSV roster"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}

          {isLeadJoshua && (
            <button
              id="add-chorister-btn"
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 shadow-md transition-all shadow-amber-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Register Member</span>
            </button>
          )}
        </div>
      </div>

      {/* Today's Birthday Celebrants Highlight Banner */}
      {todayCelebrants.length > 0 && (
        <div 
          id="today-birthday-celebrants-alert"
          className="p-4 rounded-2xl bg-gradient-to-r from-[#1F180B] via-[#1B140E] to-[#1F180B] border-2 border-amber-500/40 flex flex-wrap items-center justify-between gap-4 shadow-xl shadow-amber-500/5 animate-in fade-in duration-300"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-neutral-950 flex items-center justify-center font-black shadow-md shrink-0 animate-bounce">
              <Cake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1.5">
                  <PartyPopper className="w-4 h-4 text-amber-400" />
                  Birthday Celebration Today!
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {todayCelebrants.length === 1 ? '1 Celebrant' : `${todayCelebrants.length} Celebrants`}
                </span>
              </div>
              <div className="text-xs text-neutral-200 mt-0.5 flex items-center gap-2 flex-wrap">
                {todayCelebrants.map((c, idx) => {
                  const age = calculateBirthdayAge(c.birthdate, refDate);
                  return (
                    <span key={c.id} className="font-semibold text-white">
                      🎂 {c.name} {age ? `(Turning ${age} yrs)` : ''} • <span className="text-amber-300 font-bold">{c.role}</span>
                      {idx < todayCelebrants.length - 1 ? ',' : ''}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onGenerateFlyer && todayCelebrants.length > 0 && (
              <button
                id="btn-generate-today-flyer"
                onClick={() => onGenerateFlyer(todayCelebrants[0])}
                className="px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
                title="Generate and download official birthday flyer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Flyer</span>
              </button>
            )}

            <button
              id="filter-birthday-celebrants-toggle"
              onClick={() => setFilterBirthdayOnly(!filterBirthdayOnly)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                filterBirthdayOnly
                  ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md'
                  : 'bg-[#221B0F] hover:bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}
            >
              <Cake className="w-4 h-4" />
              <span>{filterBirthdayOnly ? 'Show All Members' : 'Filter Birthday Celebrants'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Role filter tabs & search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Role pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#141414] rounded-xl border border-[#262626]">
          {(['All', 'Committee', 'Chorister', 'Organist', 'Instrument Player'] as const).map((role) => (
            <button
              key={role}
              id={`filter-role-${role.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => setSelectedRole(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedRole === role
                  ? 'bg-[#222222] text-white shadow-sm border border-[#3A3A3A]'
                  : 'text-neutral-400 hover:text-[#E0E0E0]'
              }`}
            >
              {role === 'Committee' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              ) : role === 'Organist' ? (
                <Piano className="w-3.5 h-3.5 text-amber-400" />
              ) : role === 'Instrument Player' ? (
                <Music className="w-3.5 h-3.5 text-purple-400" />
              ) : role === 'Chorister' ? (
                <Headphones className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <Users className="w-3.5 h-3.5 text-neutral-400" />
              )}
              <span>{role === 'Committee' ? 'Committee' : role === 'Organist' ? 'Organists' : role === 'Instrument Player' ? 'Instrument Players' : role === 'Chorister' ? 'Choristers' : 'All Members'}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedRole === role ? 'bg-amber-500/20 text-amber-300 font-bold' : 'bg-[#1C1C1C] text-neutral-400'
              }`}>
                {(roleCounts as any)[role] || 0}
              </span>
            </button>
          ))}

          {/* Birthday Today Filter Pill */}
          {todayCelebrants.length > 0 && (
            <button
              id="filter-birthday-today-pill"
              onClick={() => setFilterBirthdayOnly(!filterBirthdayOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                filterBirthdayOnly
                  ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-sm'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
              }`}
              title="Filter to today's birthday celebrants"
            >
              <Cake className="w-3.5 h-3.5 text-amber-400" />
              <span>Birthday Today</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-neutral-950 font-black">
                {todayCelebrants.length}
              </span>
            </button>
          )}
        </div>

        {/* Filters & Search Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Voice Rating Filter dropdown */}
          <div className="flex items-center gap-1.5 bg-[#141414] border border-[#2A2A2A] rounded-xl px-2.5 py-1 text-xs">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/50" />
            <span className="text-neutral-400 text-[11px] font-semibold">Voice:</span>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-[#1A1A1A] text-white">All Ratings</option>
              <option value="Top" className="bg-[#1A1A1A] text-emerald-400">Soloists (9–10)</option>
              <option value="Strong" className="bg-[#1A1A1A] text-blue-400">Strong Voices (7–8)</option>
              <option value="Blend" className="bg-[#1A1A1A] text-teal-400">Choral Blend (5–6)</option>
              <option value="Developing" className="bg-[#1A1A1A] text-amber-400">Developing (1–4)</option>
              <option value="Unrated" className="bg-[#1A1A1A] text-neutral-400">Unrated</option>
            </select>
          </div>

          {/* Sunday Mass Filter dropdown */}
          <div className="flex items-center gap-1.5 bg-[#141414] border border-[#2A2A2A] rounded-xl px-2.5 py-1 text-xs">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-neutral-400 text-[11px] font-semibold">Mass:</span>
            <select
              value={massFilter}
              onChange={(e) => setMassFilter(e.target.value)}
              className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-[#1A1A1A] text-white">All Masses</option>
              <option value="Sunday - 8.00 am" className="bg-[#1A1A1A] text-emerald-400">Sunday 8:00 AM</option>
              <option value="Saturday - 6.00 pm" className="bg-[#1A1A1A] text-amber-400">Saturday 6:00 PM</option>
              <option value="Sunday - 6.30 am" className="bg-[#1A1A1A] text-blue-400">Sunday 6:30 AM</option>
              <option value="Other" className="bg-[#1A1A1A] text-purple-400">Multi / Other Masses</option>
            </select>
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5 bg-[#141414] border border-[#2A2A2A] rounded-xl px-2.5 py-1 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-400 text-[11px] font-semibold">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-white text-xs font-medium focus:outline-none cursor-pointer"
            >
              <option value="name" className="bg-[#1A1A1A] text-white">Name (A-Z)</option>
              <option value="rating" className="bg-[#1A1A1A] text-amber-400">Voice Rating (High–Low)</option>
              <option value="age" className="bg-[#1A1A1A] text-white">Age</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="chorister-search-input"
              type="text"
              placeholder="Search by name, role, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-[#141414] border border-[#2A2A2A] rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500/40 focus:border-amber-500 text-white placeholder:text-neutral-500 shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Phone-Optimized A-Z Fast Scroller & Mobile View Mode Switcher */}
      <div className="space-y-2">
        <div className="bg-[#141414] p-2 sm:p-2.5 rounded-xl border border-[#242424] shadow-sm flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] uppercase font-bold text-amber-400 shrink-0 px-1">
              A-Z Jump:
            </span>
            <button
              id="az-filter-all"
              onClick={() => setSelectedLetter('ALL')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                selectedLetter === 'ALL'
                  ? 'bg-amber-500 text-neutral-950 shadow-sm'
                  : 'bg-[#1C1C1C] text-neutral-300 hover:text-white border border-[#2B2B2B]'
              }`}
            >
              ALL ({choristers.length})
            </button>
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((char) => {
              const hasMembers = availableLetters.includes(char);
              const count = choristers.filter((c) => c.name.trim().toUpperCase().startsWith(char)).length;
              if (!hasMembers) return null;
              return (
                <button
                  key={char}
                  id={`az-filter-${char}`}
                  onClick={() => setSelectedLetter(char)}
                  className={`min-w-[28px] h-7 px-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-0.5 ${
                    selectedLetter === char
                      ? 'bg-amber-500 text-neutral-950 shadow-sm ring-1 ring-amber-400 font-extrabold'
                      : 'bg-[#1C1C1C] text-neutral-300 hover:text-amber-300 border border-[#2B2B2B]'
                  }`}
                  title={`Filter members starting with ${char} (${count})`}
                >
                  <span>{char}</span>
                  <span className="text-[9px] opacity-70">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Mobile View Mode Switch (Compact vs Detailed) */}
          <div className="flex md:hidden items-center gap-1 bg-[#1A1A1A] p-0.5 rounded-lg border border-[#2E2E2E] shrink-0">
            <button
              onClick={() => setMobileViewMode('compact')}
              className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                mobileViewMode === 'compact'
                  ? 'bg-amber-500 text-neutral-950 shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Compact high-density view"
            >
              <List className="w-3 h-3" />
              <span>Compact</span>
            </button>
            <button
              onClick={() => setMobileViewMode('detailed')}
              className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all ${
                mobileViewMode === 'detailed'
                  ? 'bg-amber-500 text-neutral-950 shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Detailed full cards view"
            >
              <Grid className="w-3 h-3" />
              <span>Detailed</span>
            </button>
          </div>
        </div>

        {/* Selected letter indicator & result counter */}
        <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
          <span>
            Showing <strong className="text-white">{filteredChoristers.length}</strong> of {choristers.length} choir members
            {selectedLetter !== 'ALL' && (
              <span className="ml-1 text-amber-400">
                (Letter &quot;{selectedLetter}&quot;)
              </span>
            )}
          </span>
          {selectedLetter !== 'ALL' && (
            <button
              onClick={() => setSelectedLetter('ALL')}
              className="text-amber-400 hover:text-amber-300 text-[11px] font-semibold underline"
            >
              Clear Letter Filter
            </button>
          )}
        </div>
      </div>

      {/* MOBILE LIST VIEW (Shown on screens < 768px for optimal phone ergonomics) */}
      <div className="md:hidden space-y-2.5">
        {filteredChoristers.length === 0 ? (
          <div className="py-12 text-center bg-[#121212] rounded-2xl border border-[#222222] p-6">
            <Users className="w-10 h-10 mx-auto mb-2 text-neutral-600" />
            <p className="font-semibold text-sm text-neutral-300">No matching choir members found</p>
            <p className="text-xs text-neutral-500 mt-1">Try clearing your search query or letter filter.</p>
            {(searchQuery || selectedLetter !== 'ALL' || selectedRole !== 'All' || ratingFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedLetter('ALL');
                  setSelectedRole('All');
                  setRatingFilter('All');
                  setMassFilter('All');
                }}
                className="mt-3 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-neutral-950"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          filteredChoristers.map((chorister) => {
            const ratingInfo = getVoiceRatingDetails(chorister.voiceRating);
            const isQuickRatingOpen = quickRatingChoristerId === chorister.id;
            const isBirthday = isBirthdayToday(chorister.birthdate, refDate);
            const celebrantAge = calculateBirthdayAge(chorister.birthdate, refDate);
            const directPhoto = getDriveDirectImageUrl(chorister.photoUrl);
            const cleanPhoneForWa = chorister.phoneNumber ? chorister.phoneNumber.replace(/[^0-9]/g, '') : '';
            const waUrl = cleanPhoneForWa 
              ? `https://wa.me/${cleanPhoneForWa.startsWith('0') ? '94' + cleanPhoneForWa.slice(1) : cleanPhoneForWa}${isBirthday ? `?text=${encodeURIComponent(formatBirthdayGreeting(chorister, refDate))}` : ''}`
              : '';
            const att = calculateChoristerAttendance(chorister, practices || []);
            const displayAge = getChoristerAge(chorister, refDate);

            return (
              <div
                key={`mob-${chorister.id}`}
                className={`bg-[#141414] rounded-xl border transition-all ${
                  isBirthday 
                    ? 'border-amber-500/50 bg-gradient-to-br from-[#1C160B] to-[#141414] shadow-md shadow-amber-500/5' 
                    : 'border-[#242424] hover:border-[#383838]'
                } p-3`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    {/* Avatar */}
                    {directPhoto ? (
                      <img
                        src={directPhoto}
                        alt={chorister.name}
                        referrerPolicy="no-referrer"
                        className={`w-11 h-11 rounded-full object-cover shrink-0 border ${
                          isBirthday
                            ? 'border-amber-400 ring-2 ring-amber-400/50'
                            : chorister.role === 'Organist'
                              ? 'border-amber-500/50'
                              : 'border-[#333333]'
                        }`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('/api/image-proxy') && chorister.photoUrl) {
                            target.src = `/api/image-proxy?url=${encodeURIComponent(chorister.photoUrl)}`;
                          } else {
                            target.style.display = 'none';
                          }
                        }}
                      />
                    ) : (
                      <div className={`w-11 h-11 rounded-full shrink-0 ${
                        isBirthday
                          ? 'bg-gradient-to-tr from-amber-500 to-amber-300 text-neutral-950 font-black ring-2 ring-amber-400/50'
                          : chorister.role === 'Organist'
                            ? 'bg-amber-600/30 text-amber-300 border-amber-500/50 font-bold'
                            : 'bg-[#1C1C1C] text-neutral-300 border-[#2E2E2E] font-bold'
                      } flex items-center justify-center text-sm border`}>
                        {chorister.name.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-sm truncate">
                          {chorister.name}
                        </span>
                        {isBirthday && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-neutral-950 flex items-center gap-0.5 animate-pulse shrink-0">
                            <Cake className="w-2.5 h-2.5" /> Birthday Today!
                          </span>
                        )}
                        {chorister.voiceRating && chorister.voiceRating >= 9 && (
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                        )}
                      </div>

                      {chorister.fullName && chorister.fullName !== chorister.name && (
                        <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                          {chorister.fullName}
                        </p>
                      )}

                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        {chorister.committeeRole && (
                          <span className="px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                            <ShieldCheck className="w-2.5 h-2.5 text-amber-400" />
                            <span>{chorister.committeeRole}</span>
                          </span>
                        )}
                        <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold border ${
                          chorister.role === 'Organist'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : chorister.role === 'Instrument Player'
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                              : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                        }`}>
                          {chorister.role}
                        </span>
                        {displayAge && displayAge > 0 && (
                          <span className="text-[10px] text-neutral-400">
                            {displayAge} yrs
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Voice Rating Pill Trigger (Only for Choristers & Organists, not Instrument Players) */}
                  {chorister.role !== 'Instrument Player' ? (
                    <button
                      onClick={() => {
                        if (quickRatingChoristerId === chorister.id) {
                          setQuickRatingChoristerId(null);
                        } else {
                          setQuickRatingChoristerId(chorister.id);
                          setQuickNotesText(chorister.voiceNotes || '');
                        }
                      }}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold border shrink-0 flex items-center gap-1 transition-all ${
                        chorister.voiceRating
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-[#1C1C1C] text-neutral-400 border-[#2A2A2A]'
                      }`}
                      title="Tap to evaluate voice rating"
                    >
                      <Star className={`w-3 h-3 ${chorister.voiceRating ? 'text-amber-400 fill-amber-400' : 'text-neutral-500'}`} />
                      <span>{chorister.voiceRating ? `${chorister.voiceRating}/10` : 'Rate'}</span>
                    </button>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30 shrink-0">
                      Instrumentalist
                    </span>
                  )}
                </div>

                {/* Inline Quick Voice Rating Grid if open on mobile (Only for Choristers & Organists) */}
                {isQuickRatingOpen && chorister.role !== 'Instrument Player' && (
                  <div className="mt-2.5 p-2.5 bg-[#181818] border border-[#2F2F2F] rounded-xl animate-in fade-in duration-100">
                    <p className="text-[10px] uppercase font-bold text-amber-400 mb-1.5">
                      Set Voice Rating (1–10)
                    </p>
                    <div className="grid grid-cols-5 gap-1.5 mb-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                        <button
                          key={score}
                          onClick={() => handleRateVoiceInstant(chorister, score)}
                          className={`py-1 rounded text-xs font-bold border ${
                            chorister.voiceRating === score
                              ? 'bg-amber-500 text-neutral-950 border-amber-400'
                              : 'bg-[#222222] text-neutral-300 border-[#333333]'
                          }`}
                        >
                          {score}
                        </button>
                      ))}
                    </div>
                    {quickSuccessMsg && (
                      <p className="text-[10px] text-emerald-400 text-center font-bold">{quickSuccessMsg}</p>
                    )}
                  </div>
                )}

                {/* Detailed Information (Shown in Detailed mode or if notes exist) */}
                {mobileViewMode === 'detailed' && (
                  <div className="mt-2 pt-2 border-t border-[#1F1F1F] space-y-1.5 text-xs text-neutral-300">
                    {chorister.address && (
                      <div className="flex items-start gap-1.5 text-[11px] text-neutral-400">
                        <MapPin className="w-3 h-3 text-neutral-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{chorister.address}</span>
                      </div>
                    )}
                    {chorister.birthdate && (
                      <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                        <Calendar className="w-3 h-3 text-neutral-500 shrink-0" />
                        <span>Birthdate: {chorister.birthdate}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 pt-0.5 text-[10px]">
                      <span className="text-neutral-400">Practices: <strong className="text-emerald-300">{att.practicePercent !== null ? `${att.practicePercent}%` : 'N/A'}</strong></span>
                      <span className="text-neutral-400">Masses: <strong className="text-blue-300">{att.massPercent !== null ? `${att.massPercent}%` : 'N/A'}</strong></span>
                      {chorister.dateJoined && (
                        <span className="text-neutral-500">Joined: {chorister.dateJoined}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Compact tags: Mass Preference & Status */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2 pt-2 border-t border-[#1C1C1C]">
                  {chorister.sundayMassPreference && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{chorister.sundayMassPreference}</span>
                    </span>
                  )}
                  {chorister.weeklyMassPreference && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {chorister.weeklyMassPreference}
                    </span>
                  )}
                </div>

                {/* Touch-Friendly Action Buttons Row */}
                <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-[#1E1E1E]">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {chorister.phoneNumber ? (
                      <>
                        <a
                          href={`tel:${chorister.phoneNumber}`}
                          className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors min-h-[36px]"
                          title="Call phone"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[11px] font-mono">{chorister.phoneNumber}</span>
                        </a>

                        {waUrl && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs flex items-center justify-center min-h-[36px] min-w-[36px]"
                            title="Chat on WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                          </a>
                        )}
                      </>
                    ) : (
                      <span className="text-[11px] text-neutral-500 italic">No phone number</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {onGenerateFlyer && (
                      <button
                        onClick={() => onGenerateFlyer(chorister)}
                        className={`p-2 rounded-lg border min-h-[36px] min-w-[36px] flex items-center justify-center transition-all ${
                          isBirthday 
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm' 
                            : 'bg-[#1C1C1C] hover:bg-[#282828] text-neutral-300 hover:text-amber-400 border-[#2E2E2E]'
                        }`}
                        title={`Generate Birthday Flyer for ${chorister.name}`}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    )}

                    {isLeadJoshua && (
                      <button
                        onClick={() => handleOpenEdit(chorister)}
                        className="p-2 rounded-lg bg-[#1C1C1C] hover:bg-[#282828] text-neutral-300 hover:text-white border border-[#2E2E2E] min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Edit Member"
                      >
                        <Edit className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    )}

                    {isLeadJoshua && (deletingId === chorister.id ? (
                      <div className="flex items-center gap-1 bg-rose-950/60 p-1 rounded-lg border border-rose-500/40">
                        <button
                          onClick={() => confirmDelete(chorister.id)}
                          className="px-2 py-1 bg-rose-600 text-white rounded text-[10px] font-bold"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="p-1 text-neutral-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(chorister.id)}
                        className="p-2 rounded-lg bg-[#1C1C1C] hover:bg-rose-500/15 text-neutral-400 hover:text-rose-400 border border-[#2E2E2E] min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Delete Member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP DATABASE TABLE (Hidden on mobile phones, shown on md and larger) */}
      <div className="hidden md:block bg-[#121212] rounded-2xl border border-[#222222] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-[#171717] border-b border-[#262626] text-neutral-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Member Profile</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Voice Rating (1–10)</th>
                <th className="py-3.5 px-4">Age</th>
                <th className="py-3.5 px-4">Birthdate</th>
                <th className="py-3.5 px-4">Contact & WhatsApp</th>
                <th className="py-3.5 px-4">Address</th>
                <th className="py-3.5 px-4">Attendance Rates</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F1F]">
              {filteredChoristers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-neutral-500">
                    <Users className="w-10 h-10 mx-auto mb-3 text-neutral-600" />
                    <p className="font-semibold text-base text-neutral-300">
                      {choristers.length === 0 ? 'No Choir Members Registered Yet' : 'No matching members found'}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                      {choristers.length === 0
                        ? 'Click "Register Member" above to add choristers, organists, or instrument players.'
                        : 'Try adjusting your search query, voice rating filter, or role filter.'}
                    </p>
                    {choristers.length === 0 && (
                      <button
                        onClick={handleOpenAdd}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 shadow-md transition-all"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Register First Member</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredChoristers.map((chorister) => {
                  const ratingInfo = getVoiceRatingDetails(chorister.voiceRating);
                  const isQuickRatingOpen = quickRatingChoristerId === chorister.id;
                  const isBirthday = isBirthdayToday(chorister.birthdate, refDate);
                  const celebrantAge = calculateBirthdayAge(chorister.birthdate, refDate);
                  const directPhoto = getDriveDirectImageUrl(chorister.photoUrl);
                  const cleanPhoneForWa = chorister.phoneNumber ? chorister.phoneNumber.replace(/[^0-9]/g, '') : '';
                  const waUrl = cleanPhoneForWa 
                    ? `https://wa.me/${cleanPhoneForWa.startsWith('0') ? '94' + cleanPhoneForWa.slice(1) : cleanPhoneForWa}${isBirthday ? `?text=${encodeURIComponent(formatBirthdayGreeting(chorister, refDate))}` : ''}`
                    : '';

                  return (
                    <tr 
                      key={chorister.id}
                      id={`chorister-row-${chorister.id}`}
                      className={`transition-colors group ${
                        isBirthday 
                          ? 'bg-amber-500/10 hover:bg-amber-500/15 border-l-4 border-l-amber-400' 
                          : 'hover:bg-[#181818]'
                      }`}
                    >
                      {/* Member Profile */}
                      <td className="py-3.5 px-4 min-w-[240px]">
                        <div className="flex items-start gap-3">
                          {directPhoto ? (
                            <img
                              src={directPhoto}
                              alt={chorister.name}
                              referrerPolicy="no-referrer"
                              className={`w-10 h-10 rounded-full object-cover shrink-0 border ${
                                isBirthday
                                  ? 'border-amber-400 ring-2 ring-amber-400/50'
                                  : chorister.role === 'Organist'
                                    ? 'border-amber-500/50'
                                    : 'border-[#333333]'
                              }`}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (!target.src.includes('/api/image-proxy') && chorister.photoUrl) {
                                  target.src = `/api/image-proxy?url=${encodeURIComponent(chorister.photoUrl)}`;
                                } else {
                                  target.style.display = 'none';
                                }
                              }}
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-full shrink-0 ${
                              isBirthday
                                ? 'bg-gradient-to-tr from-amber-500 to-amber-300 text-neutral-950 border-amber-400 font-black ring-2 ring-amber-400/50'
                                : chorister.role === 'Organist'
                                  ? 'bg-amber-600/30 text-amber-300 border-amber-500/50 font-bold'
                                  : 'bg-[#1C1C1C] text-neutral-300 border-[#2E2E2E] font-bold'
                            } flex items-center justify-center text-xs border`}>
                              {chorister.name.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="space-y-1">
                            <div className="font-bold text-white text-sm flex items-center gap-1.5 flex-wrap">
                              <span>{chorister.name}</span>
                              {isBirthday && (
                                <span 
                                  className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-neutral-950 flex items-center gap-1 shadow-sm shrink-0 animate-pulse"
                                  title={`Happy Birthday ${chorister.name}! Turning ${celebrantAge || ''}`}
                                >
                                  <Cake className="w-3 h-3" /> Birthday Today!
                                </span>
                              )}
                              {chorister.voiceRating && chorister.voiceRating >= 9 && (
                                <span title="Top Soloist"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /></span>
                              )}
                              {chorister.committeeRole && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shrink-0">
                                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                                  <span>{chorister.committeeRole}</span>
                                </span>
                              )}
                            </div>

                            {chorister.fullName && chorister.fullName !== chorister.name && (
                              <div className="text-[11px] text-neutral-400 line-clamp-1">
                                {chorister.fullName}
                              </div>
                            )}

                            {/* Badges for status, Sunday mass, weekly mass */}
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              {chorister.isSchoolStudent !== undefined && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                                  chorister.isSchoolStudent
                                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                                    : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                                }`}>
                                  {chorister.isSchoolStudent ? (
                                    <>
                                      <GraduationCap className="w-3 h-3 text-blue-400" />
                                      <span>School Student</span>
                                    </>
                                  ) : (
                                    <>
                                      <Briefcase className="w-3 h-3 text-neutral-400" />
                                      <span>Working / Adult</span>
                                    </>
                                  )}
                                </span>
                              )}

                              {chorister.sundayMassPreference && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                  <Clock className="w-2.5 h-2.5 text-emerald-400" />
                                  <span>{chorister.sundayMassPreference}</span>
                                </span>
                              )}

                              {chorister.weeklyMassPreference && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                                  <span>{chorister.weeklyMassPreference}</span>
                                </span>
                              )}

                              {chorister.dateJoined && (
                                <span className="text-[10px] text-neutral-500">
                                  Joined {chorister.dateJoined}
                                </span>
                              )}
                            </div>

                            {chorister.voiceNotes && (
                              <div className="text-[11px] text-neutral-400 line-clamp-1 italic mt-0.5">
                                "{chorister.voiceNotes}"
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role: Organist, Chorister, or Instrument player */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          chorister.role === 'Organist'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 font-extrabold'
                            : chorister.role === 'Instrument Player'
                              ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                              : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                        }`}>
                          {chorister.role === 'Organist' ? (
                            <Piano className="w-3 h-3 text-amber-400" />
                          ) : chorister.role === 'Instrument Player' ? (
                            <Music className="w-3 h-3 text-purple-400" />
                          ) : (
                            <Headphones className="w-3 h-3 text-indigo-400" />
                          )}
                          <span>{chorister.role}</span>
                        </span>
                      </td>

                      {/* Voice Rating (1-10) with On-The-Spot Interactive Rating */}
                      <td className="py-3.5 px-4 relative">
                        {chorister.role !== 'Instrument Player' ? (
                          <>
                          <div className="flex items-center gap-2">
                          <button
                            id={`rate-voice-btn-${chorister.id}`}
                            onClick={() => {
                              if (isQuickRatingOpen) {
                                setQuickRatingChoristerId(null);
                              } else {
                                setQuickRatingChoristerId(chorister.id);
                                setQuickNotesText(chorister.voiceNotes || '');
                              }
                            }}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${ratingInfo.badgeClass}`}
                            title="Click to rate voice from 1 to 10 when you see them"
                          >
                            <Star className={`w-3.5 h-3.5 ${chorister.voiceRating ? 'fill-current' : 'text-neutral-500'}`} />
                            <span>{chorister.voiceRating ? `${chorister.voiceRating} / 10` : '+ Rate Voice'}</span>
                            <ChevronDown className="w-3 h-3 opacity-60" />
                          </button>

                          {chorister.voiceRating && (
                            <span className="text-[10px] text-neutral-400 hidden xl:inline">
                              {ratingInfo.desc}
                            </span>
                          )}
                        </div>

                        {/* Quick 1-10 Rating Floating Popover */}
                        {isQuickRatingOpen && (
                          <div className="absolute z-30 top-full left-4 mt-2 w-80 bg-[#161616] border border-[#333333] rounded-2xl shadow-2xl p-4 animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between pb-2 border-b border-[#282828] mb-3">
                              <div className="flex items-center gap-2">
                                <Volume2 className="w-4 h-4 text-amber-400" />
                                <span className="font-bold text-xs text-white">
                                  Rate Voice for {chorister.name}
                                </span>
                              </div>
                              <button
                                onClick={() => setQuickRatingChoristerId(null)}
                                className="text-neutral-400 hover:text-white p-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <p className="text-[11px] text-neutral-400 mb-2.5">
                              Select voice rating score from 1 (developing) to 10 (master soloist):
                            </p>

                            {/* 1-10 Numbers Grid */}
                            <div className="grid grid-cols-5 gap-1.5 mb-3">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                                const isCurrent = chorister.voiceRating === score;
                                return (
                                  <button
                                    key={score}
                                    id={`rate-${chorister.id}-${score}`}
                                    onClick={() => handleRateVoiceInstant(chorister, score)}
                                    className={`py-1.5 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center border ${
                                      isCurrent
                                        ? 'bg-amber-500 text-neutral-950 border-amber-400 shadow-md ring-2 ring-amber-500/40'
                                        : score >= 9
                                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
                                          : score >= 7
                                            ? 'bg-blue-950/40 text-blue-300 border-blue-500/30 hover:bg-blue-500/20'
                                            : score >= 5
                                              ? 'bg-teal-950/40 text-teal-300 border-teal-500/30 hover:bg-teal-500/20'
                                              : 'bg-[#222222] text-neutral-300 border-[#333333] hover:bg-[#2C2C2C]'
                                    }`}
                                  >
                                    <span className="text-sm font-black">{score}</span>
                                    <span className="text-[9px] opacity-80">
                                      {score === 10 ? 'Soloist' : score === 9 ? 'Cantor' : score >= 7 ? 'Strong' : score >= 5 ? 'Blend' : 'Dev'}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Optional Vocal Notes */}
                            <div className="space-y-1 mb-3">
                              <label className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">
                                Vocal Notes / Register (Optional)
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. Soprano 1, high range pitch perfect"
                                value={quickNotesText}
                                onChange={(e) => setQuickNotesText(e.target.value)}
                                className="w-full px-2.5 py-1.5 text-xs bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                              />
                            </div>

                            {quickSuccessMsg && (
                              <div className="p-1.5 mb-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold text-center rounded-lg animate-pulse">
                                {quickSuccessMsg}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-[#282828] text-xs">
                              {chorister.voiceRating ? (
                                <button
                                  type="button"
                                  onClick={() => handleRateVoiceInstant(chorister, undefined)}
                                  className="text-rose-400 hover:text-rose-300 text-[11px] font-semibold"
                                >
                                  Clear Rating
                                </button>
                              ) : (
                                <span className="text-neutral-500 text-[11px]">Click a number to set</span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleRateVoiceInstant(chorister, chorister.voiceRating || 8)}
                                className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs"
                              >
                                Save Notes
                              </button>
                            </div>
                          </div>
                        )}
                        </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-neutral-500 text-xs">
                            <Headphones className="w-3.5 h-3.5 text-purple-400" />
                            <span className="text-[11px] font-medium text-neutral-400">Instrumentalist (No Voice Rating)</span>
                          </div>
                        )}
                      </td>

                      {/* Age */}
                      <td className="py-3.5 px-4 font-semibold text-neutral-300 whitespace-nowrap">
                        {(() => {
                          const displayAge = getChoristerAge(chorister, refDate);
                          return displayAge && displayAge > 0 ? (
                            <span className={`px-2 py-0.5 rounded border ${
                              isBirthday 
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold' 
                                : 'bg-[#1A1A1A] border-[#2E2E2E]'
                            }`}>
                              {displayAge} yrs {isBirthday ? '🎉' : ''}
                            </span>
                          ) : (
                            <span className="text-neutral-500">—</span>
                          );
                        })()}
                      </td>

                      {/* Birthdate */}
                      <td className="py-3.5 px-4 text-neutral-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isBirthday ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold animate-pulse">
                              <Cake className="w-3.5 h-3.5 text-amber-400" />
                              <span>{chorister.birthdate} (Today!)</span>
                            </span>
                          ) : chorister.birthdate ? (
                            <>
                              <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                              <span>{chorister.birthdate}</span>
                            </>
                          ) : (
                            <span className="text-neutral-500 text-[11px] italic">
                              Birthdate pending
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Contact & WhatsApp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {chorister.phoneNumber ? (
                            <div className="flex items-center gap-2">
                              <a 
                                href={`tel:${chorister.phoneNumber}`} 
                                className="flex items-center gap-1.5 hover:text-amber-400 transition-colors font-medium text-neutral-200"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{chorister.phoneNumber}</span>
                              </a>

                              {waUrl && (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded-md bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30 transition-colors"
                                  title={`WhatsApp ${chorister.name}`}
                                >
                                  <MessageCircle className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          ) : (
                            <span className="text-neutral-500">—</span>
                          )}

                          {chorister.parentPhone && (
                            <div className="text-[10px] text-neutral-400 flex items-center gap-1">
                              <span className="text-neutral-500">Parent:</span>
                              <a href={`tel:${chorister.parentPhone}`} className="hover:text-amber-300">
                                {chorister.parentPhone}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Address */}
                      <td className="py-3.5 px-4 max-w-xs text-neutral-300">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-neutral-500 mt-0.5 shrink-0" />
                          <span className="line-clamp-2 leading-relaxed">
                            {chorister.address || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Attendance Rates */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {(() => {
                          const att = calculateChoristerAttendance(chorister, practices || []);
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-neutral-400 text-[10px] font-semibold w-16">Practices:</span>
                                <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                                  att.practicePercent === null 
                                    ? 'bg-neutral-800 text-neutral-500'
                                    : att.practicePercent >= 80 
                                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                      : att.practicePercent >= 50
                                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
                                }`}>
                                  {att.practicePercent !== null ? `${att.practicePercent}%` : 'No data'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-neutral-400 text-[10px] font-semibold w-16">Masses:</span>
                                <span className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                                  att.massPercent === null 
                                    ? 'bg-neutral-800 text-neutral-500'
                                    : att.massPercent >= 80 
                                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                      : att.massPercent >= 50
                                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
                                }`}>
                                  {att.massPercent !== null ? `${att.massPercent}%` : 'No data'}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {onGenerateFlyer && (
                            <button
                              id={`flyer-chorister-${chorister.id}`}
                              onClick={() => onGenerateFlyer(chorister)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isBirthday 
                                  ? 'text-amber-400 hover:text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40' 
                                  : 'text-neutral-400 hover:text-amber-400 hover:bg-[#202020]'
                              }`}
                              title={`Generate Birthday Flyer for ${chorister.name}`}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isLeadJoshua && (
                            <button
                              id={`edit-chorister-${chorister.id}`}
                              onClick={() => handleOpenEdit(chorister)}
                              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#202020] transition-colors"
                              title="Edit Member Details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          
                          {isLeadJoshua && (deletingId === chorister.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => confirmDelete(chorister.id)}
                                className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold hover:bg-rose-700"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setDeletingId(null)}
                                className="p-1 text-neutral-400 hover:text-white"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`delete-chorister-${chorister.id}`}
                              onClick={() => setDeletingId(chorister.id)}
                              className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                              title="Delete Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Chorister Modal */}
      {(isAddModalOpen || editingChorister) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141414] w-full max-w-xl rounded-2xl border border-[#2A2A2A] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0D0D0D] text-white px-6 py-4 flex items-center justify-between border-b border-[#222222]">
              <div>
                <h3 className="font-bold text-base">
                  {editingChorister ? 'Edit Member Details' : 'Register Choir Member'}
                </h3>
                <p className="text-xs text-neutral-400">
                  St. Cecilia's Choir of St. Michael's Church Koralawella
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingChorister(null);
                }}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChorister} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              {/* Member Preferred Name & Full Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Preferred / Display Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dinoli Fernando"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-white placeholder:text-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kankanamalage Dinoli Fernando"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-white placeholder:text-neutral-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Role Selection: Chorister, Organist, or Instrument Player */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Member Role *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'Chorister' })}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                      formData.role === 'Chorister'
                        ? 'bg-indigo-600/25 border-indigo-500 text-white shadow-sm'
                        : 'bg-[#181818] border-[#2E2E2E] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Headphones className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Chorister</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'Organist' })}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                      formData.role === 'Organist'
                        ? 'bg-amber-600/25 border-amber-500 text-white shadow-sm'
                        : 'bg-[#181818] border-[#2E2E2E] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Piano className="w-3.5 h-3.5 text-amber-400" />
                    <span>Organist</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'Instrument Player' })}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                      formData.role === 'Instrument Player'
                        ? 'bg-purple-600/25 border-purple-500 text-white shadow-sm'
                        : 'bg-[#181818] border-[#2E2E2E] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5 text-purple-400" />
                    <span>Instrument Player</span>
                  </button>
                </div>
              </div>

              {/* Committee Executive Role (Synced with Committee Board) */}
              <div className="bg-[#181818] p-3 rounded-xl border border-[#282828] space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Committee Executive Role (Optional)</span>
                  </label>
                  {formData.committeeRole && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, committeeRole: undefined })}
                      className="text-[11px] text-neutral-400 hover:text-rose-400"
                    >
                      Clear Role
                    </button>
                  )}
                </div>
                <select
                  value={formData.committeeRole || ''}
                  onChange={(e) => setFormData({ ...formData, committeeRole: (e.target.value as CommitteeRole) || undefined })}
                  className="w-full px-3 py-2 text-xs bg-[#202020] border border-[#333333] rounded-lg text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">None (General Choir Member)</option>
                  <option value="President">President</option>
                  <option value="Secretary">Secretary</option>
                  <option value="Assistant Secretary">Assistant Secretary</option>
                  <option value="Treasurer">Treasurer</option>
                  <option value="Assistant Treasurer">Assistant Treasurer</option>
                  <option value="Committee Member">Committee Member</option>
                </select>
                <p className="text-[11px] text-neutral-400">
                  Assigning a committee role synchronizes this member with the Committee Executive Board.
                </p>
              </div>

              {/* Status & Service Preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Student / Working
                  </label>
                  <select
                    value={formData.isSchoolStudent ? 'student' : 'working'}
                    onChange={(e) => setFormData({ ...formData, isSchoolStudent: e.target.value === 'student' })}
                    className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="working">Working / Adult</option>
                    <option value="student">School Student</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Sunday Mass</span>
                    <span className="text-[10px] text-amber-400 font-semibold lowercase">parish schedule</span>
                  </label>
                  <select
                    value={formData.sundayMassPreference}
                    onChange={(e) => setFormData({ ...formData, sundayMassPreference: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl text-white font-medium focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- Select Sunday Mass --</option>
                    {PARISH_SUNDAY_MASSES.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    {formData.sundayMassPreference &&
                      !PARISH_SUNDAY_MASSES.includes(formData.sundayMassPreference) && (
                        <option value={formData.sundayMassPreference}>
                          {formData.sundayMassPreference}
                        </option>
                      )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Weekly Mass (Optional)
                  </label>
                  <input
                    type="text"
                    list="weekly-mass-options"
                    placeholder="e.g. Thursday Novena & Mass - 6.00 pm"
                    value={formData.weeklyMassPreference}
                    onChange={(e) => setFormData({ ...formData, weeklyMassPreference: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#2E2E2E] rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-500"
                  />
                  <datalist id="weekly-mass-options">
                    <option value="Thursday Novena & Mass - 6.00 pm" />
                    <option value="Tuesday Mass - 6.00 pm" />
                    <option value="First Friday Adoration & Mass - 6.00 pm" />
                    <option value="Saturday - 7.00 am (English)" />
                  </datalist>
                </div>
              </div>

              {/* Voice Rating (1-10) Evaluation Section (Only for Choristers & Organists, not Instrument Players) */}
              {formData.role !== 'Instrument Player' && (
                <div className="bg-[#181818] p-3.5 rounded-xl border border-[#282828] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span>Voice Rating (1 to 10)</span>
                    </label>
                    {formData.voiceRating && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, voiceRating: undefined })}
                        className="text-[11px] text-neutral-400 hover:text-rose-400"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-10 gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                      const isSelected = formData.voiceRating === score;
                      return (
                        <button
                          type="button"
                          key={score}
                          onClick={() => setFormData({ ...formData, voiceRating: score })}
                          className={`py-1.5 rounded-lg text-xs font-black transition-all border ${
                            isSelected
                              ? 'bg-amber-500 text-neutral-950 border-amber-400 ring-2 ring-amber-500/40 shadow'
                              : 'bg-[#202020] text-neutral-300 border-[#303030] hover:bg-[#2A2A2A]'
                          }`}
                        >
                          {score}
                        </button>
                      );
                    })}
                  </div>

                  {formData.voiceRating ? (
                    <div className="text-[11px] text-amber-300/90 font-medium">
                      {getVoiceRatingDetails(formData.voiceRating).label} • {getVoiceRatingDetails(formData.voiceRating).desc}
                    </div>
                  ) : (
                    <div className="text-[11px] text-neutral-500">
                      Optional: Rate voice quality from 1 to 10 anytime when observing rehearsals or auditions.
                    </div>
                  )}

                  {/* Voice Notes */}
                  <div>
                    <input
                      type="text"
                      placeholder="Vocal range / notes (e.g. Mezzo-Soprano, Clear Cantor, Tenor soloist)"
                      value={formData.voiceNotes}
                      onChange={(e) => setFormData({ ...formData, voiceNotes: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-[#121212] border border-[#2E2E2E] rounded-lg text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              {/* Age and Birthdate Grid (Birthdays will be added later) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Birthdate (Optional / Later)
                  </label>
                  <input
                    type="date"
                    value={formData.birthdate}
                    onChange={(e) => handleBirthdateChange(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-white focus:outline-none"
                  />
                  {formData.birthdate && isBirthdayToday(formData.birthdate, refDate) && (
                    <div className="mt-1.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold animate-pulse">
                      <Cake className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>🎉 That's today! Birthday will be celebrated in the UI.</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.age || ''}
                    placeholder="Calculated or manual"
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 text-sm bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-white placeholder:text-neutral-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Contact Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 077 123 4567"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-white placeholder:text-neutral-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Parent Phone (If student)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. 071 987 6543"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-white placeholder:text-neutral-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12/3 Station Road, Koralawella"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-white placeholder:text-neutral-500 focus:outline-none"
                />
              </div>

              {/* Photo & Date Joined Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <DriveUrlInput
                    id="chorister-photo-url-input"
                    label="Member Photo Link (Google Drive / URL)"
                    value={formData.photoUrl}
                    onChange={(val) => setFormData({ ...formData, photoUrl: val })}
                    placeholder="Paste Google Drive sharing link or image URL"
                    helperText="Google Drive photo link is validated in real-time and previewed live."
                    required={false}
                    showPreviewThumbnail={true}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                    Year / Date Joined
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2019-06-18 or 2019"
                    value={formData.dateJoined}
                    onChange={(e) => setFormData({ ...formData, dateJoined: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-white placeholder:text-neutral-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingChorister(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-[#202020] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 transition-colors shadow-md shadow-amber-500/20"
                >
                  {editingChorister ? 'Save Changes' : 'Save Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
