import React from 'react';
import { 
  Sparkles, 
  Lock, 
  Unlock, 
  Calendar as CalendarIcon, 
  Music, 
  Flame,
  CheckCircle2,
  ChevronRight,
  Plus,
  ImageIcon,
  CalendarDays,
  Star,
  Church
} from 'lucide-react';
import { AnnualCalendarConfig, MajorEvent, CommitteeMember } from '../types';
import { formatDetailedCountdown, parseTargetDate } from '../utils/dateUtils';
import { getDriveDirectImageUrl } from '../utils/driveImage';

interface EventCountdownBannerProps {
  currentDate?: Date;
  calendarConfig?: AnnualCalendarConfig;
  majorEvents?: Record<'feast' | 'carols' | 'easter' | 'christmas-new-year', MajorEvent>;
  activeTab?: string;
  activeMember?: CommitteeMember;
  onSelectTab: (tabId: string) => void;
  onOpenCalendarModal: () => void;
  onOpenYearPlanModal?: () => void;
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

export const EventCountdownBanner: React.FC<EventCountdownBannerProps> = ({
  currentDate = new Date(),
  calendarConfig = {} as AnnualCalendarConfig,
  majorEvents,
  activeTab,
  activeMember,
  onSelectTab,
  onOpenCalendarModal,
  onOpenYearPlanModal,
}) => {
  const isLeadJoshua = Boolean(
    activeMember?.name?.trim().toLowerCase() === 'joshua peiris' ||
    activeMember?.name?.trim().toLowerCase() === 'joshua' ||
    activeMember?.id === 'choir-joshua-peiris' ||
    (activeMember as any)?.email === 'jshpeiris@gmail.com'
  );

  const coreEvents: Array<{
    id: 'feast' | 'carols' | 'easter' | 'christmas-new-year' | 'new-year';
    label: string;
    tabKey: string;
    date: string;
    backgroundUrl?: string;
    themeGradient: string;
    accentColor: string;
    badgeColor: string;
    icon: any;
  }> = [
    {
      id: 'feast',
      label: 'Parish Feast & Nine Novenas',
      tabKey: 'feast',
      date: calendarConfig?.feastDate || '2026-09-29',
      backgroundUrl: calendarConfig?.feastBackgroundUrl,
      themeGradient: 'from-amber-950/80 via-[#181206]/85 to-[#0F0F0F]',
      accentColor: 'border-amber-500/40 text-amber-300',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: Flame,
    },
    {
      id: 'carols',
      label: 'Festival of Carols',
      tabKey: 'carols',
      date: calendarConfig?.carolsDate || '2026-12-20',
      backgroundUrl: calendarConfig?.carolsBackgroundUrl,
      themeGradient: 'from-blue-950/80 via-[#071324]/85 to-[#0F0F0F]',
      accentColor: 'border-blue-500/40 text-blue-300',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      icon: Music,
    },
    {
      id: 'christmas-new-year',
      label: 'Christmas & Nativity',
      tabKey: 'christmas-new-year',
      date: calendarConfig?.christmasNewYearDate || '2026-12-25',
      backgroundUrl: calendarConfig?.christmasBackgroundUrl,
      themeGradient: 'from-rose-950/80 via-[#210810]/85 to-[#0F0F0F]',
      accentColor: 'border-rose-500/40 text-rose-300',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: Star,
    },
    {
      id: 'new-year',
      label: 'New Year Thanksgiving Mass',
      tabKey: 'christmas-new-year',
      date: calendarConfig?.newYearDate || '2027-01-01',
      backgroundUrl: calendarConfig?.newYearBackgroundUrl,
      themeGradient: 'from-amber-950/80 via-[#261B06]/85 to-[#0F0F0F]',
      accentColor: 'border-amber-500/40 text-amber-300',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon: Sparkles,
    },
    {
      id: 'easter',
      label: 'Easter & Holy Week',
      tabKey: 'easter',
      date: calendarConfig?.easterDate || '2027-03-28',
      backgroundUrl: calendarConfig?.easterBackgroundUrl,
      themeGradient: 'from-purple-950/80 via-[#180826]/85 to-[#0F0F0F]',
      accentColor: 'border-purple-500/40 text-purple-300',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      icon: Church,
    },
  ];

  // Include custom events added by Joshua
  const customEventsList = (calendarConfig?.customEvents || []).map((cev) => ({
    id: cev.id,
    label: cev.title,
    tabKey: '',
    date: cev.targetDate,
    backgroundUrl: cev.backgroundDriveUrl,
    themeGradient: 'from-emerald-950/80 via-[#071F14]/85 to-[#0F0F0F]',
    accentColor: 'border-emerald-500/40 text-emerald-300',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    isCustom: true,
    icon: CalendarDays,
  }));

  const combinedList = [...coreEvents, ...customEventsList].sort((a, b) =>
    String(a.date || '').localeCompare(String(b.date || ''))
  );

  return (
    <div className="bg-[#0D0D0D] border-b border-[#222222] px-3 sm:px-4 py-3 sm:py-3.5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-neutral-200">
                Annual Liturgical Year Plan &amp; 100-Day Prep Windows
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {onOpenYearPlanModal && (
              <button
                type="button"
                id="open-year-plan-banner-btn"
                onClick={onOpenYearPlanModal}
                className="text-xs font-black px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-400/10 hover:from-amber-500/30 hover:to-amber-400/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
                <span>{isLeadJoshua ? '📅 Manage Year Plan & Backgrounds' : '📅 Full Liturgical Year Plan'}</span>
                <ChevronRight className="w-3 h-3 text-amber-400" />
              </button>
            )}

            {isLeadJoshua && (
              <button
                onClick={onOpenCalendarModal}
                className="text-[11px] text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg bg-[#161616] border border-[#262626] cursor-pointer"
                title="Configure 100-day target dates (Lead Joshua Peiris Only)"
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Dates</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Cards Grid with Google Drive Hero Backgrounds */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {combinedList.map((item) => {
            const countdown = formatDetailedCountdown(item.date, currentDate);
            const isSelected = activeTab === item.tabKey;
            const bgImage = getDriveDirectImageUrl(item.backgroundUrl, 800);
            const isCore = !('isCustom' in item && item.isCustom);

            return (
              <div
                key={item.id}
                id={`countdown-card-${item.id}`}
                onClick={() => {
                  if (item.tabKey) {
                    onSelectTab(item.tabKey);
                  } else if (onOpenYearPlanModal) {
                    onOpenYearPlanModal();
                  }
                }}
                className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 border transition-all cursor-pointer flex flex-col justify-between shadow-lg group ${
                  isSelected
                    ? 'ring-2 ring-amber-500/80 border-amber-500/60 shadow-amber-500/15 scale-[1.01]'
                    : 'border-[#262626] hover:border-amber-500/50 hover:bg-[#161616]'
                }`}
              >
                {/* Background Picture with Dark Aesthetic Overlay */}
                {bgImage ? (
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={bgImage}
                      alt={item.label}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('/api/image-proxy') && item.backgroundUrl) {
                          target.src = `/api/image-proxy?url=${encodeURIComponent(item.backgroundUrl)}`;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 to-black/60" />
                  </div>
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-b ${item.themeGradient}`} />
                )}

                {/* Relative Content */}
                <div className="relative z-10 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-xs sm:text-sm text-white truncate drop-shadow-md">
                      {item.label}
                    </span>
                    
                    {/* Status Tag: Within 100-day window or locked */}
                    {countdown.isUnlocked ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 whitespace-nowrap shadow-sm animate-pulse">
                        <Unlock className="w-2.5 h-2.5" />
                        Active Window
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-neutral-400 border border-white/10 whitespace-nowrap backdrop-blur-sm">
                        <Lock className="w-2.5 h-2.5" />
                        Locked (&gt;100d)
                      </span>
                    )}
                  </div>

                  {/* Days remaining count */}
                  <div className="flex items-baseline justify-between pt-0.5">
                    <div>
                      <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono drop-shadow">
                        {countdown.days}
                      </span>
                      <span className="text-[11px] text-neutral-300 ml-1.5 font-semibold">
                        days left
                      </span>
                    </div>

                    <span className="text-[10px] text-amber-300 font-mono font-bold px-2 py-0.5 rounded-lg bg-black/50 border border-white/10">
                      {formatDisplayDate(item.date)}
                    </span>
                  </div>

                  {/* Progress bar towards 100-day window / event */}
                  <div className="pt-1.5">
                    <div className="w-full bg-black/60 h-1.5 rounded-full overflow-hidden border border-white/10">
                      <div
                        className={`h-full transition-all duration-500 ${
                          countdown.isUnlocked ? 'bg-gradient-to-r from-amber-400 to-emerald-400' : 'bg-neutral-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(5, ((365 - countdown.days) / 365) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-neutral-300 mt-1">
                      <span className="truncate">
                        {countdown.isUnlocked 
                          ? '100-day preparation active' 
                          : `Unlocks in ${countdown.daysUntilUnlock}d`}
                      </span>
                      <span className="font-mono text-neutral-400 shrink-0 ml-1">
                        {countdown.hours}h {countdown.minutes}m
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
