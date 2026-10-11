import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Sparkles, 
  Plus, 
  Trash2, 
  Edit3, 
  Image as ImageIcon, 
  ExternalLink, 
  Check, 
  X, 
  Lock, 
  Unlock, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  Flame, 
  Church, 
  Music, 
  Star, 
  Layers, 
  ArrowRight,
  Info,
  CalendarDays,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { AnnualCalendarConfig, CustomYearPlanEvent, CommitteeMember, MajorEvent } from '../types';
import { getDaysRemaining, formatDetailedCountdown, parseTargetDate } from '../utils/dateUtils';
import { getDriveDirectImageUrl } from '../utils/driveImage';
import { DriveUrlInput } from './DriveUrlInput';

interface YearPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate?: Date;
  calendarConfig?: AnnualCalendarConfig;
  majorEvents?: Record<'feast' | 'carols' | 'easter' | 'christmas-new-year', MajorEvent>;
  activeMember?: CommitteeMember;
  onSaveCalendar: (config: AnnualCalendarConfig) => Promise<void>;
  onNavigateToTab?: (tabKey: string) => void;
}

function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr) return 'Date TBA';
  try {
    const d = parseTargetDate(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export const YearPlanModal: React.FC<YearPlanModalProps> = ({
  isOpen,
  onClose,
  currentDate = new Date(),
  calendarConfig = {} as AnnualCalendarConfig,
  majorEvents,
  activeMember,
  onSaveCalendar,
  onNavigateToTab,
}) => {
  // Check if current user is Joshua Peiris (strictly authorized to edit core calendar dates, custom events, and pics)
  const isLeadJoshua = Boolean(
    activeMember?.name?.trim().toLowerCase().includes('joshua') ||
    activeMember?.id === 'choir-joshua-peiris' ||
    (activeMember as any)?.email === 'jshpeiris@gmail.com'
  );

  // Submodal & filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<'all' | 'unlocked' | 'core' | 'custom'>('all');
  const [isAddCustomEventOpen, setIsAddCustomEventOpen] = useState(false);
  const [editingCustomEventId, setEditingCustomEventId] = useState<string | null>(null);
  const [editingBackgroundEventId, setEditingBackgroundEventId] = useState<string | null>(null);
  const [backgroundInputUrl, setBackgroundInputUrl] = useState('');
  const [backgroundEventTitle, setBackgroundEventTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Core Never-Changing Events Date Editor (Lead Joshua Only)
  const [editingCoreDateEvent, setEditingCoreDateEvent] = useState<{ id: string; title: string; currentDate: string } | null>(null);
  const [coreDateInput, setCoreDateInput] = useState('');
  const [isMasterDatesModalOpen, setIsMasterDatesModalOpen] = useState(false);
  const [masterDatesForm, setMasterDatesForm] = useState({
    feastDate: calendarConfig?.feastDate || '2026-09-29',
    carolsDate: calendarConfig?.carolsDate || '2026-12-20',
    christmasNewYearDate: calendarConfig?.christmasNewYearDate || '2026-12-25',
    newYearDate: calendarConfig?.newYearDate || '2027-01-01',
    easterDate: calendarConfig?.easterDate || '2027-03-28',
  });

  // Custom Event Form State
  const [customTitle, setCustomTitle] = useState('');
  const [customSubtitle, setCustomSubtitle] = useState('');
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState('');
  const [customVenue, setCustomVenue] = useState("St. Michael's Church, Koralawella");
  const [customDescription, setCustomDescription] = useState('');
  const [customDriveUrl, setCustomDriveUrl] = useState('');
  const [customThemeColor, setCustomThemeColor] = useState<'amber' | 'emerald' | 'blue' | 'purple' | 'rose' | 'teal' | 'cyan'>('amber');

  // Combine core events and custom events safely sorted by date
  const allYearEvents = useMemo(() => {
    const config = calendarConfig || ({} as AnnualCalendarConfig);
    const feastDate = config.feastDate || '2026-09-29';
    const christmasDate = config.christmasNewYearDate || '2026-12-25';
    const newYearDate = config.newYearDate || '2027-01-01';
    const easterDate = config.easterDate || '2027-03-28';
    const carolsDate = config.carolsDate || '2026-12-20';

    const core = [
      {
        id: 'feast',
        title: 'Parish Feast & Nine Novenas',
        subtitle: 'Patronal Feast of St. Michael the Archangel & Holy Angels (Main Annual Feast)',
        tabKey: 'feast',
        date: feastDate,
        endDate: undefined as string | undefined,
        backgroundUrl: config.feastBackgroundUrl,
        themeGradient: 'from-amber-950/90 via-[#181206]/90 to-[#0F0F0F]',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/40',
        venue: "St. Michael's Church, Koralawella",
        icon: Flame,
        isPermanent: true,
        isCustom: false,
      },
      {
        id: 'carols',
        title: 'Festival of Nine Lessons & Carols',
        subtitle: 'Annual Advent Festival of Nine Lessons and Carols with Sacred Choral Anthems',
        tabKey: 'carols',
        date: carolsDate,
        endDate: undefined as string | undefined,
        backgroundUrl: config.carolsBackgroundUrl,
        themeGradient: 'from-blue-950/90 via-[#071324]/90 to-[#0F0F0F]',
        badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
        textColor: 'text-blue-400',
        borderColor: 'border-blue-500/40',
        venue: "Church Choir Loft & Sanctuary",
        icon: Music,
        isPermanent: true,
        isCustom: false,
      },
      {
        id: 'christmas-new-year',
        title: 'Christmas & Nativity Midnight Mass',
        subtitle: 'Solemn Nativity Celebration, Midnight High Mass & Christmas Liturgy',
        tabKey: 'christmas-new-year',
        date: christmasDate,
        endDate: undefined as string | undefined,
        backgroundUrl: config.christmasBackgroundUrl,
        themeGradient: 'from-rose-950/90 via-[#210810]/90 to-[#0F0F0F]',
        badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        textColor: 'text-rose-400',
        borderColor: 'border-rose-500/40',
        venue: "St. Michael's Church Sanctuary",
        icon: Star,
        isPermanent: true,
        isCustom: false,
      },
      {
        id: 'new-year',
        title: 'New Year Thanksgiving & Midnight Mass',
        subtitle: "Solemnity of Mary, Mother of God, New Year's Eve Midnight Mass & Thanksgiving Liturgy",
        tabKey: 'christmas-new-year',
        date: newYearDate,
        endDate: undefined as string | undefined,
        backgroundUrl: config.newYearBackgroundUrl,
        themeGradient: 'from-amber-950/90 via-[#261B06]/90 to-[#0F0F0F]',
        badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/40',
        venue: "St. Michael's Church Sanctuary & Altar",
        icon: Sparkles,
        isPermanent: true,
        isCustom: false,
      },
      {
        id: 'easter',
        title: 'Easter & Holy Week',
        subtitle: 'Paschal Triduum, Maundy Thursday, Good Friday, Holy Saturday & Easter Sunday',
        tabKey: 'easter',
        date: easterDate,
        endDate: undefined as string | undefined,
        backgroundUrl: config.easterBackgroundUrl,
        themeGradient: 'from-purple-950/90 via-[#180826]/90 to-[#0F0F0F]',
        badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
        textColor: 'text-purple-400',
        borderColor: 'border-purple-500/40',
        venue: "St. Michael's Church Altar & Sanctuary",
        icon: Church,
        isPermanent: true,
        isCustom: false,
      },
    ];

    const customList = (config.customEvents || []).map((cev) => ({
      id: cev.id || `custom-${Math.random()}`,
      title: cev.title || 'Parish Event',
      subtitle: cev.subtitle || 'Custom Liturgical Event',
      tabKey: '',
      date: cev.targetDate || new Date().toISOString().split('T')[0],
      endDate: cev.endDate,
      backgroundUrl: cev.backgroundDriveUrl,
      themeGradient: 'from-emerald-950/90 via-[#071F14]/90 to-[#0F0F0F]',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      textColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/40',
      venue: cev.venue || "St. Michael's Church, Koralawella",
      description: cev.description,
      isCustom: true,
      isPermanent: false,
      addedBy: cev.addedBy,
      icon: CalendarIcon,
    }));

    const combined = [...core, ...customList];
    return combined.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
  }, [calendarConfig]);

  // Filtered events based on category and search query
  const filteredEvents = useMemo(() => {
    return allYearEvents.filter((ev) => {
      const days = getDaysRemaining(ev.date, currentDate);
      if (filterCategory === 'unlocked' && days > 100) return false;
      if (filterCategory === 'core' && ('isCustom' in ev && ev.isCustom)) return false;
      if (filterCategory === 'custom' && !('isCustom' in ev && ev.isCustom)) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ev.title.toLowerCase().includes(q);
        const matchesSub = ev.subtitle?.toLowerCase().includes(q);
        const matchesVenue = ev.venue?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesSub && !matchesVenue) return false;
      }

      return true;
    });
  }, [allYearEvents, filterCategory, searchQuery, currentDate]);

  // Open edit modal for custom event
  const handleOpenEditCustomEvent = (event: CustomYearPlanEvent) => {
    setEditingCustomEventId(event.id);
    setCustomTitle(event.title);
    setCustomSubtitle(event.subtitle || '');
    setCustomDate(event.targetDate || new Date().toISOString().split('T')[0]);
    setCustomEndDate(event.endDate || '');
    setCustomVenue(event.venue || "St. Michael's Church, Koralawella");
    setCustomDescription(event.description || '');
    setCustomDriveUrl(event.backgroundDriveUrl || '');
    setCustomThemeColor(event.themeColor || 'amber');
    setIsAddCustomEventOpen(true);
  };

  // Reset custom event form for adding new event
  const handleOpenAddCustomEvent = () => {
    setEditingCustomEventId(null);
    setCustomTitle('');
    setCustomSubtitle('');
    setCustomDate(new Date().toISOString().split('T')[0]);
    setCustomEndDate('');
    setCustomVenue("St. Michael's Church, Koralawella");
    setCustomDescription('');
    setCustomDriveUrl('');
    setCustomThemeColor('amber');
    setIsAddCustomEventOpen(true);
  };

  // Save custom event (Lead Joshua only)
  const handleSaveCustomEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeadJoshua) return;
    setIsSaving(true);

    try {
      const existingCustom = calendarConfig?.customEvents || [];
      let updatedCustom: CustomYearPlanEvent[];

      if (editingCustomEventId) {
        updatedCustom = existingCustom.map((ev) =>
          ev.id === editingCustomEventId
            ? {
                ...ev,
                title: customTitle.trim(),
                subtitle: customSubtitle.trim() || undefined,
                targetDate: customDate,
                endDate: customEndDate || undefined,
                venue: customVenue.trim() || undefined,
                description: customDescription.trim() || undefined,
                backgroundDriveUrl: customDriveUrl.trim() || undefined,
                themeColor: customThemeColor,
              }
            : ev
        );
      } else {
        const newEvent: CustomYearPlanEvent = {
          id: `custom-event-${Date.now()}`,
          title: customTitle.trim(),
          subtitle: customSubtitle.trim() || 'Parish Liturgical Event',
          targetDate: customDate,
          endDate: customEndDate || undefined,
          venue: customVenue.trim() || "St. Michael's Church, Koralawella",
          description: customDescription.trim() || undefined,
          backgroundDriveUrl: customDriveUrl.trim() || undefined,
          themeColor: customThemeColor,
          isCustom: true,
          addedBy: activeMember?.name || 'Joshua Peiris',
          addedAt: new Date().toISOString(),
        };
        updatedCustom = [...existingCustom, newEvent];
      }

      const updatedConfig: AnnualCalendarConfig = {
        ...calendarConfig,
        feastDate: calendarConfig?.feastDate || '2026-09-29',
        carolsDate: calendarConfig?.carolsDate || '2026-12-20',
        easterDate: calendarConfig?.easterDate || '2027-03-28',
        christmasNewYearDate: calendarConfig?.christmasNewYearDate || '2026-12-25',
        newYearDate: calendarConfig?.newYearDate || '2027-01-01',
        customEvents: updatedCustom,
      };

      await onSaveCalendar(updatedConfig);
      setIsAddCustomEventOpen(false);
      setEditingCustomEventId(null);
      setFeedbackMessage('✅ Liturgical event saved to Year Plan!');
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      console.error('Failed to save custom year plan event:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Delete custom event (Lead Joshua only)
  const handleDeleteCustomEvent = async (eventId: string, title: string) => {
    if (!isLeadJoshua) return;
    if (!window.confirm(`Are you sure you want to remove "${title}" from the Year Plan?`)) return;
    setIsSaving(true);

    try {
      const updatedCustom = (calendarConfig?.customEvents || []).filter((e) => e.id !== eventId);
      const updatedConfig: AnnualCalendarConfig = {
        ...calendarConfig,
        feastDate: calendarConfig?.feastDate || '2026-09-29',
        carolsDate: calendarConfig?.carolsDate || '2026-12-20',
        easterDate: calendarConfig?.easterDate || '2027-03-28',
        christmasNewYearDate: calendarConfig?.christmasNewYearDate || '2026-12-25',
        newYearDate: calendarConfig?.newYearDate || '2027-01-01',
        customEvents: updatedCustom,
      };
      await onSaveCalendar(updatedConfig);
      setFeedbackMessage('🗑️ Event removed from Year Plan');
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Open background editor modal for any event (Core 5 or Custom)
  const handleOpenBackgroundEditor = (eventId: string, title: string, currentUrl?: string) => {
    setEditingBackgroundEventId(eventId);
    setBackgroundEventTitle(title);
    setBackgroundInputUrl(currentUrl || '');
  };

  // Save background picture drive link
  const handleSaveBackgroundUrl = async () => {
    if (!editingBackgroundEventId || !isLeadJoshua) return;
    setIsSaving(true);

    try {
      const trimmedUrl = backgroundInputUrl.trim();
      let updatedConfig: AnnualCalendarConfig = {
        ...calendarConfig,
        feastDate: calendarConfig?.feastDate || '2026-09-29',
        carolsDate: calendarConfig?.carolsDate || '2026-12-20',
        easterDate: calendarConfig?.easterDate || '2027-03-28',
        christmasNewYearDate: calendarConfig?.christmasNewYearDate || '2026-12-25',
        newYearDate: calendarConfig?.newYearDate || '2027-01-01',
      };

      if (editingBackgroundEventId === 'feast') {
        updatedConfig.feastBackgroundUrl = trimmedUrl || undefined;
      } else if (editingBackgroundEventId === 'christmas-new-year') {
        updatedConfig.christmasBackgroundUrl = trimmedUrl || undefined;
      } else if (editingBackgroundEventId === 'new-year') {
        updatedConfig.newYearBackgroundUrl = trimmedUrl || undefined;
      } else if (editingBackgroundEventId === 'easter') {
        updatedConfig.easterBackgroundUrl = trimmedUrl || undefined;
      } else if (editingBackgroundEventId === 'carols') {
        updatedConfig.carolsBackgroundUrl = trimmedUrl || undefined;
      } else {
        // Custom event background
        const updatedCustom = (calendarConfig?.customEvents || []).map((ev) =>
          ev.id === editingBackgroundEventId
            ? { ...ev, backgroundDriveUrl: trimmedUrl || undefined }
            : ev
        );
        updatedConfig.customEvents = updatedCustom;
      }

      await onSaveCalendar(updatedConfig);
      setEditingBackgroundEventId(null);
      setBackgroundInputUrl('');
      setFeedbackMessage('🖼️ Background picture updated successfully!');
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Open editor for a specific core never-changing event date (Lead Joshua Only)
  const handleOpenEditCoreDate = (ev: { id: string; title: string; date: string }) => {
    if (!isLeadJoshua) return;
    setEditingCoreDateEvent({ id: ev.id, title: ev.title, currentDate: ev.date });
    setCoreDateInput(ev.date || '');
  };

  // Save specific core event date
  const handleSaveCoreDate = async () => {
    if (!editingCoreDateEvent || !isLeadJoshua || !coreDateInput) return;
    setIsSaving(true);
    try {
      const updatedConfig: AnnualCalendarConfig = {
        ...calendarConfig,
        feastDate: calendarConfig?.feastDate || '2026-09-29',
        carolsDate: calendarConfig?.carolsDate || '2026-12-20',
        easterDate: calendarConfig?.easterDate || '2027-03-28',
        christmasNewYearDate: calendarConfig?.christmasNewYearDate || '2026-12-25',
        newYearDate: calendarConfig?.newYearDate || '2027-01-01',
      };

      if (editingCoreDateEvent.id === 'feast') updatedConfig.feastDate = coreDateInput;
      else if (editingCoreDateEvent.id === 'carols') updatedConfig.carolsDate = coreDateInput;
      else if (editingCoreDateEvent.id === 'christmas-new-year') updatedConfig.christmasNewYearDate = coreDateInput;
      else if (editingCoreDateEvent.id === 'new-year') updatedConfig.newYearDate = coreDateInput;
      else if (editingCoreDateEvent.id === 'easter') updatedConfig.easterDate = coreDateInput;

      await onSaveCalendar(updatedConfig);
      setEditingCoreDateEvent(null);
      setFeedbackMessage(`✅ Updated date for ${editingCoreDateEvent.title} to ${coreDateInput}`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      console.error('Failed to update core event date:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Save all core master dates
  const handleSaveMasterDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeadJoshua) return;
    setIsSaving(true);
    try {
      const updatedConfig: AnnualCalendarConfig = {
        ...calendarConfig,
        feastDate: masterDatesForm.feastDate,
        carolsDate: masterDatesForm.carolsDate,
        christmasNewYearDate: masterDatesForm.christmasNewYearDate,
        newYearDate: masterDatesForm.newYearDate,
        easterDate: masterDatesForm.easterDate,
      };
      await onSaveCalendar(updatedConfig);
      setIsMasterDatesModalOpen(false);
      setFeedbackMessage('✅ All core liturgical feast dates updated successfully!');
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err) {
      console.error('Failed to update master dates:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4">
      <div className="bg-[#121212] w-full max-w-5xl sm:rounded-3xl border-t sm:border border-[#262626] shadow-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95">
        
        {/* Modal Top Header */}
        <div className="px-4 py-3 sm:p-5 border-b border-[#222222] bg-[#0C0C0C] shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 text-amber-400 border border-amber-500/30 shrink-0">
              <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-white text-sm sm:text-lg tracking-tight truncate">
                  Annual Liturgical Year Plan &amp; 100-Day Prep Windows
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {allYearEvents.length} Events
                </span>
                {isLeadJoshua && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Lead Joshua Peiris Access</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                5 Core Unchanging Feasts (Feast, Carols, Christmas, New Year, Easter) + custom events &amp; Google Drive backgrounds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Edit Core Feasts Master Dates (Restricted exclusively to Lead Joshua) */}
            {isLeadJoshua && (
              <button
                type="button"
                id="edit-core-dates-btn"
                onClick={() => {
                  setMasterDatesForm({
                    feastDate: calendarConfig?.feastDate || '2026-09-29',
                    carolsDate: calendarConfig?.carolsDate || '2026-12-20',
                    christmasNewYearDate: calendarConfig?.christmasNewYearDate || '2026-12-25',
                    newYearDate: calendarConfig?.newYearDate || '2027-01-01',
                    easterDate: calendarConfig?.easterDate || '2027-03-28',
                  });
                  setIsMasterDatesModalOpen(true);
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs shadow-sm transition-all cursor-pointer"
                title="Edit calendar dates of the 5 never-changing core feasts (Lead Joshua Only)"
              >
                <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
                <span>Edit 5 Core Dates</span>
              </button>
            )}

            {/* Add Custom Event Button (Restricted exclusively to Lead Joshua) */}
            {isLeadJoshua && (
              <button
                type="button"
                id="add-year-plan-event-btn"
                onClick={handleOpenAddCustomEvent}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-neutral-950 font-black text-xs shadow-md shadow-amber-500/20 hover:scale-[1.02] transition-all cursor-pointer"
                title="Add a new custom liturgical event to the Year Plan"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Event</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-neutral-400 hover:text-white rounded-xl bg-[#1C1C1C] hover:bg-[#282828] transition-all cursor-pointer"
              title="Close Year Plan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert if present */}
        {feedbackMessage && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-2 text-xs text-emerald-300 font-bold flex items-center justify-between animate-in fade-in shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{feedbackMessage}</span>
            </div>
            <button onClick={() => setFeedbackMessage(null)} className="text-emerald-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Filter Strip & Search */}
        <div className="px-3 sm:px-4 py-2 bg-[#171717] border-b border-[#222222] shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterCategory === 'all'
                  ? 'bg-neutral-200 text-neutral-950 shadow-sm'
                  : 'text-neutral-400 hover:text-white bg-[#202020]'
              }`}
            >
              All Events ({allYearEvents.length})
            </button>
            <button
              onClick={() => setFilterCategory('unlocked')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                filterCategory === 'unlocked'
                  ? 'bg-emerald-500 text-neutral-950 shadow-sm font-black'
                  : 'text-emerald-400/90 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'
              }`}
            >
              <Unlock className="w-3 h-3" />
              <span>Active 100-Day Windows</span>
            </button>
            <button
              onClick={() => setFilterCategory('core')}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                filterCategory === 'core'
                  ? 'bg-amber-400 text-neutral-950 shadow-sm font-black'
                  : 'text-amber-400/90 hover:text-amber-300 bg-amber-500/10 border border-amber-500/20'
              }`}
            >
              <Star className="w-3 h-3" />
              <span>5 Core Feasts (Never Change)</span>
            </button>
            {calendarConfig?.customEvents && calendarConfig.customEvents.length > 0 && (
              <button
                onClick={() => setFilterCategory('custom')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filterCategory === 'custom'
                    ? 'bg-purple-400 text-neutral-950 shadow-sm font-black'
                    : 'text-purple-400/90 hover:text-purple-300 bg-purple-500/10 border border-purple-500/20'
                }`}
              >
                Custom Added ({calendarConfig.customEvents.length})
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search year plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 text-xs bg-[#101010] border border-[#2B2B2B] rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Events Grid / Timeline */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-3.5">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 px-4 border border-dashed border-[#282828] rounded-2xl">
              <CalendarIcon className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-neutral-300">No events matched the selected filter</p>
              <p className="text-xs text-neutral-500 mt-1">Try switching to &quot;All Events&quot; or clearing your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {filteredEvents.map((ev) => {
                const countdown = formatDetailedCountdown(ev.date, currentDate);
                const bgImage = getDriveDirectImageUrl(ev.backgroundUrl, 1000);
                const isCore = Boolean(ev.isPermanent);

                return (
                  <div
                    key={ev.id}
                    className="relative rounded-2xl sm:rounded-3xl border border-[#282828] overflow-hidden flex flex-col justify-between shadow-xl group hover:border-amber-500/50 transition-all min-h-[240px]"
                  >
                    {/* Background Picture with Dark Aesthetic Overlay (Google Drive direct stream) */}
                    {bgImage ? (
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style={{ backgroundImage: `url(${bgImage})` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/55" />
                      </div>
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${ev.themeGradient}`} />
                    )}

                    {/* Card Content (Relative Z-10) */}
                    <div className="relative z-10 p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                      {/* Top Badges Row */}
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border flex items-center gap-1 shadow-sm ${ev.badgeColor}`}>
                              {isCore ? <Flame className="w-2.5 h-2.5" /> : <CalendarIcon className="w-2.5 h-2.5" />}
                              <span>{isCore ? 'Core 4 Feast (Never Changes)' : 'Custom Event'}</span>
                            </span>

                            {countdown.isUnlocked ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 animate-pulse">
                                <Unlock className="w-2.5 h-2.5" />
                                <span>Active 100-Day Window</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#1A1A1A]/85 text-neutral-400 border border-[#333333] flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                <span>Scheduled (&gt;100d)</span>
                              </span>
                            )}
                          </div>

                          {/* Quick Admin Actions (Lead Joshua Only) */}
                          {isLeadJoshua && (
                            <div className="flex items-center gap-1 shrink-0 bg-black/70 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
                              {/* Edit date of never-changing core event (Lead Joshua Only) */}
                              {isCore && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditCoreDate(ev)}
                                  className="px-2 py-1 rounded-lg text-emerald-400 hover:text-emerald-200 hover:bg-emerald-500/25 transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                                  title="Edit date of this never-changing calendar event (Lead Joshua Only)"
                                >
                                  <CalendarDays className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Edit Date</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleOpenBackgroundEditor(ev.id, ev.title, ev.backgroundUrl)}
                                className="p-1.5 rounded-lg text-amber-300 hover:text-white hover:bg-amber-500/25 transition-all cursor-pointer"
                                title="Set or edit background Google Drive image link"
                              >
                                <ImageIcon className="w-3.5 h-3.5" />
                              </button>

                              {!isCore && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditCustomEvent(ev as any)}
                                    className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/20 transition-all cursor-pointer"
                                    title="Edit event details"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCustomEvent(ev.id, ev.title)}
                                    className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/25 transition-all cursor-pointer"
                                    title="Delete custom event"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {/* Non-Joshua lock badge on never-changing core events */}
                          {!isLeadJoshua && isCore && (
                            <div 
                              className="flex items-center gap-1 shrink-0 bg-black/60 px-2 py-1 rounded-xl border border-neutral-800 text-[10px] text-neutral-400 font-medium"
                              title="Only Lead Joshua Peiris is authorized to edit the dates of never-changing calendar events."
                            >
                              <Lock className="w-2.5 h-2.5 text-amber-400/80" />
                              <span className="hidden xs:inline">Date Locked (Joshua Only)</span>
                            </div>
                          )}
                        </div>

                        {/* Title & Subtitle */}
                        <h4 className="text-base sm:text-lg font-black text-white mt-2 leading-tight drop-shadow-md">
                          {ev.title}
                        </h4>
                        <p className="text-xs text-neutral-300 line-clamp-2 mt-0.5 drop-shadow-sm font-medium">
                          {ev.subtitle}
                        </p>
                      </div>

                      {/* Countdown & Metrics */}
                      <div className="bg-black/70 backdrop-blur-md p-3 rounded-2xl border border-white/10 space-y-2">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-black text-white font-mono tracking-tight">
                              {countdown.days}
                            </span>
                            <span className="text-xs text-neutral-400 font-semibold">days remaining</span>
                          </div>

                          <div className="text-right">
                            <div className="text-xs font-bold text-amber-300 font-mono">
                              {formatDisplayDate(ev.date)}
                            </div>
                            {ev.endDate && (
                              <div className="text-[10px] text-neutral-400 font-mono">
                                to {formatDisplayDate(ev.endDate)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 100-Day Unlock Progress Bar */}
                        <div>
                          <div className="w-full bg-neutral-800/80 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                countdown.isUnlocked ? 'bg-gradient-to-r from-amber-400 to-emerald-400' : 'bg-neutral-600'
                              }`}
                              style={{
                                width: `${Math.min(100, Math.max(5, ((365 - countdown.days) / 365) * 100))}%`,
                              }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-1">
                            <span>
                              {countdown.isUnlocked 
                                ? '✨ Active Preparation in progress (≤100d)' 
                                : `Preparation window unlocks in ${countdown.daysUntilUnlock} days`}
                            </span>
                            <span className="font-mono text-neutral-400">
                              {countdown.hours}h {countdown.minutes}m
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer: Venue & Action */}
                      <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 text-neutral-300 text-[11px] truncate">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{ev.venue}</span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {isLeadJoshua && (
                            <button
                              type="button"
                              onClick={() => handleOpenBackgroundEditor(ev.id, ev.title, ev.backgroundUrl)}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white/10 hover:bg-white/20 text-neutral-200 border border-white/10 flex items-center gap-1 transition-all cursor-pointer"
                              title="Set Google Drive background image"
                            >
                              <ImageIcon className="w-3 h-3 text-amber-400" />
                              <span className="hidden sm:inline">Drive Pic</span>
                            </button>
                          )}

                          {isCore && ev.tabKey && onNavigateToTab && (
                            <button
                              type="button"
                              onClick={() => {
                                onNavigateToTab(ev.tabKey);
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs flex items-center gap-1 transition-all shadow-md shrink-0 cursor-pointer"
                            >
                              <span>Open Workspace</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SUB-MODAL 1: ADD / EDIT CUSTOM EVENT (LEAD JOSHUA ONLY) */}
      {isAddCustomEventOpen && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161616] w-full max-w-lg rounded-3xl border border-[#2E2E2E] shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <CalendarIcon className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">
                    {editingCustomEventId ? 'Edit Custom Liturgical Event' : 'Add Custom Event to Year Plan'}
                  </h4>
                  <p className="text-[10px] text-neutral-400">
                    Lead Joshua Peiris • Add pilgrimages, choir feasts, anniversaries, retreats
                  </p>
                </div>
              </div>
              <button onClick={() => setIsAddCustomEventOpen(false)} className="text-neutral-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomEvent} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Feast of St. Cecilia - Choir Patronal Celebration"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#101010] border border-[#2C2C2C] rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">Subtitle / Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Choir Patronal Feast, Solemn Vespers & Fellowship"
                  value={customSubtitle}
                  onChange={(e) => setCustomSubtitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#101010] border border-[#2C2C2C] rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">Target Date *</label>
                  <input
                    type="date"
                    required
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#101010] border border-[#2C2C2C] rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1">End Date (Optional)</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#101010] border border-[#2C2C2C] rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">Venue / Location</label>
                <input
                  type="text"
                  placeholder="e.g. St. Michael's Church Sanctuary / Tewatta National Basilica"
                  value={customVenue}
                  onChange={(e) => setCustomVenue(e.target.value)}
                  className="w-full px-3 py-2 bg-[#101010] border border-[#2C2C2C] rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <DriveUrlInput
                  id="custom-event-bg-url"
                  label="Background Picture (Google Drive Link)"
                  value={customDriveUrl}
                  onChange={setCustomDriveUrl}
                  placeholder="Paste Google Drive image share link (https://drive.google.com/file/d/...)"
                  helperText="Google Drive background image link is validated in real-time."
                  showPreviewThumbnail={true}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-300 mb-1">Description &amp; Directives</label>
                <textarea
                  rows={3}
                  placeholder="Special liturgy details, rehearsals, dress code, transport arrangements..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#101010] border border-[#2C2C2C] rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setIsAddCustomEventOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : editingCustomEventId ? 'Update Event' : 'Add to Year Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL 2: EDIT BACKGROUND PICTURE GOOGLE DRIVE LINK */}
      {editingBackgroundEventId && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161616] w-full max-w-md rounded-3xl border border-[#2E2E2E] shadow-2xl p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <ImageIcon className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Set Background Picture
                  </h4>
                  <p className="text-[10px] text-neutral-400 truncate max-w-[240px]">
                    {backgroundEventTitle || 'Liturgical Event'}
                  </p>
                </div>
              </div>
              <button onClick={() => setEditingBackgroundEventId(null)} className="text-neutral-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <DriveUrlInput
                  id="background-event-drive-url"
                  label="Google Drive Share Link / Direct Image URL"
                  value={backgroundInputUrl}
                  onChange={setBackgroundInputUrl}
                  placeholder="https://drive.google.com/file/d/1ABC.../view?usp=sharing"
                  helperText="Paste any Google Drive link with 'Anyone with the link can view' permission."
                  showPreviewThumbnail={true}
                />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[#262626]">
                {backgroundInputUrl && (
                  <button
                    type="button"
                    onClick={() => setBackgroundInputUrl('')}
                    className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                  >
                    Remove Photo
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setEditingBackgroundEventId(null)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBackgroundUrl}
                    disabled={isSaving}
                    className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Background'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 3: EDIT SPECIFIC CORE EVENT DATE (LEAD JOSHUA ONLY) */}
      {editingCoreDateEvent && isLeadJoshua && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#161616] w-full max-w-md rounded-3xl border border-[#2E2E2E] shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <CalendarDays className="w-5 h-5" />
                </span>
                <div>
                  <h4 className="font-bold text-white text-base">
                    Edit Never-Changing Feast Date
                  </h4>
                  <p className="text-xs text-amber-300/90 font-medium truncate max-w-[240px]">
                    {editingCoreDateEvent.title}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setEditingCoreDateEvent(null)} 
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-200">
              <span className="font-bold">Lead Joshua Authorization:</span> You are changing the liturgical celebration target date for this permanent annual feast. 100-day prep countdown windows and event workspaces will automatically recalibrate.
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Liturgical Target Date (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  value={coreDateInput}
                  onChange={(e) => setCoreDateInput(e.target.value)}
                  className="w-full bg-[#202020] border border-[#333] rounded-xl px-3.5 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              {coreDateInput && (
                <div className="p-2.5 rounded-lg bg-[#202020] border border-[#2e2e2e] flex items-center justify-between text-xs">
                  <span className="text-neutral-400">Days to celebration:</span>
                  <span className="font-bold font-mono text-amber-400">
                    {getDaysRemaining(coreDateInput, currentDate)} days
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setEditingCoreDateEvent(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveCoreDate}
                  disabled={isSaving || !coreDateInput}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Update Feast Date'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-MODAL 4: MASTER 5 CORE FEAST DATES CONFIG (LEAD JOSHUA ONLY) */}
      {isMasterDatesModalOpen && isLeadJoshua && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141414] w-full max-w-xl rounded-3xl border border-[#2E2E2E] shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <CalendarDays className="w-6 h-6" />
                </span>
                <div>
                  <h4 className="font-bold text-white text-base">
                    Master Liturgical Calendar Dates
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Lead Joshua Peiris • 5 Never-Changing Core Events
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsMasterDatesModalOpen(false)} 
                className="text-neutral-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMasterDates} className="space-y-3.5">
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-[#1C1C1C] border border-[#2B2B2B]">
                  <label className="block text-xs font-bold text-amber-400 mb-1">
                    1. Parish Feast &amp; Nine Novenas
                  </label>
                  <input
                    type="date"
                    value={masterDatesForm.feastDate}
                    onChange={(e) => setMasterDatesForm({ ...masterDatesForm, feastDate: e.target.value })}
                    className="w-full bg-[#121212] border border-[#333] rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div className="p-3 rounded-2xl bg-[#1C1C1C] border border-[#2B2B2B]">
                  <label className="block text-xs font-bold text-blue-400 mb-1">
                    2. Festival of Nine Lessons &amp; Carols
                  </label>
                  <input
                    type="date"
                    value={masterDatesForm.carolsDate}
                    onChange={(e) => setMasterDatesForm({ ...masterDatesForm, carolsDate: e.target.value })}
                    className="w-full bg-[#121212] border border-[#333] rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-blue-400"
                    required
                  />
                </div>

                <div className="p-3 rounded-2xl bg-[#1C1C1C] border border-[#2B2B2B]">
                  <label className="block text-xs font-bold text-rose-400 mb-1">
                    3. Christmas &amp; Nativity Midnight Mass
                  </label>
                  <input
                    type="date"
                    value={masterDatesForm.christmasNewYearDate}
                    onChange={(e) => setMasterDatesForm({ ...masterDatesForm, christmasNewYearDate: e.target.value })}
                    className="w-full bg-[#121212] border border-[#333] rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-rose-400"
                    required
                  />
                </div>

                <div className="p-3 rounded-2xl bg-[#1C1C1C] border border-[#2B2B2B]">
                  <label className="block text-xs font-bold text-amber-300 mb-1">
                    4. New Year Thanksgiving &amp; Midnight Mass
                  </label>
                  <input
                    type="date"
                    value={masterDatesForm.newYearDate}
                    onChange={(e) => setMasterDatesForm({ ...masterDatesForm, newYearDate: e.target.value })}
                    className="w-full bg-[#121212] border border-[#333] rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-amber-300"
                    required
                  />
                </div>

                <div className="p-3 rounded-2xl bg-[#1C1C1C] border border-[#2B2B2B]">
                  <label className="block text-xs font-bold text-purple-400 mb-1">
                    5. Easter &amp; Holy Week
                  </label>
                  <input
                    type="date"
                    value={masterDatesForm.easterDate}
                    onChange={(e) => setMasterDatesForm({ ...masterDatesForm, easterDate: e.target.value })}
                    className="w-full bg-[#121212] border border-[#333] rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#262626]">
                <button
                  type="button"
                  onClick={() => setIsMasterDatesModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save All Core Dates'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
