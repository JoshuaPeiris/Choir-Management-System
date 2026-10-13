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
    id: 'feast' | 'carols' | 'easter' | 'christmas' | 'new-year';
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
      id: 'christmas',
      label: 'Christmas & Nativity',
      tabKey: 'christmas',
      date: calendarConfig?.christmasDate || calendarConfig?.christmasNewYearDate || '2026-12-25',
      backgroundUrl: calendarConfig?.christmasBackgroundUrl,
      themeGradient: 'from-rose-950/80 via-[#210810]/85 to-[#0F0F0F]',
      accentColor: 'border-rose-500/40 text-rose-300',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      icon: Star,
    },
    {
      id: 'new-year',
      label: 'New Year Thanksgiving Mass',
      tabKey: 'new-year',
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
            const isUnlocked = countdown.isUnlocked;

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
                className={`relative overflow-hidden rounded-2xl sm:rounded-3xl p-4 transition-all cursor-pointer flex flex-col justify-between group ${
                  isUnlocked
                    ? isSelected
                      ? 'bg-gradient-to-br from-[#4A300E] via-[#2A1B07] to-[#161005] border-2 border-amber-300 shadow-[0_0_55px_rgba(245,158,11,0.6)] ring-2 ring-amber-300/90 scale-[1.02]'
                      : 'bg-gradient-to-br from-[#3D260B] via-[#221606] to-[#120D04] border-2 border-amber-400/80 hover:border-amber-300 shadow-[0_0_40px_rgba(245,158,11,0.4)] ring-1 ring-amber-400/50 hover:scale-[1.01]'
                    : isSelected
                      ? 'bg-[#020202] border-2 border-[#1E1E1E] opacity-75 shadow-inner'
                      : 'bg-[#020202] border-2 border-[#101010] hover:border-[#1A1A1A] opacity-60 hover:opacity-75 shadow-[inset_0_4px_20px_rgba(0,0,0,0.95)]'
                }`}
              >
                {/* Luminous Radiant Glow for Active Window Events */}
                {isUnlocked && (
                  <>
                    <div className="absolute -top-10 -right-10 w-52 h-52 bg-amber-400/35 rounded-full blur-3xl pointer-events-none animate-pulse" />
                    <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-emerald-400/30 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/15 via-transparent to-amber-300/20 pointer-events-none" />
                  </>
                )}

                {/* Dark Lock Watermark for Locked In Vault Events */}
                {!isUnlocked && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black pointer-events-none" />
                    <Lock className="absolute -right-3 -bottom-3 w-36 h-36 text-white/[0.04] pointer-events-none stroke-[1.4]" />
                  </>
                )}

                {/* Background Picture with Visual State Filtering */}
                {bgImage ? (
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={bgImage}
                      alt={item.label}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-cover transition-all duration-700 ${
                        isUnlocked
                          ? 'opacity-95 brightness-125 contrast-110 saturate-125 group-hover:scale-105'
                          : 'opacity-75 grayscale-[20%] contrast-110 brightness-90 group-hover:scale-105'
                      }`}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('/api/image-proxy') && item.backgroundUrl) {
                          target.src = `/api/image-proxy?url=${encodeURIComponent(item.backgroundUrl)}`;
                        }
                      }}
                    />
                    <div 
                      className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" 
                    />
                  </div>
                ) : (
                  <div 
                    className={`absolute inset-0 ${
                      isUnlocked
                        ? `bg-gradient-to-b ${item.themeGradient}`
                        : 'bg-[#020202]'
                    }`} 
                  />
                )}

                {/* Relative Content */}
                <div className="relative z-10 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span 
                      className={`font-black text-xs sm:text-sm truncate ${
                        isUnlocked 
                          ? 'text-white drop-shadow-[0_2px_12px_rgba(251,191,36,0.9)]' 
                          : 'text-neutral-400'
                      }`}
                    >
                      {item.label}
                    </span>
                    
                    {/* Status Tag: Glowing Radiant Active Window vs Dark Vault Locked */}
                    {isUnlocked ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 text-neutral-950 whitespace-nowrap shadow-[0_0_20px_rgba(251,191,36,0.95)] border border-amber-100 ring-2 ring-amber-300/70 animate-pulse">
                        <Sparkles className="w-3 h-3 text-neutral-950" />
                        <Unlock className="w-2.5 h-2.5 text-neutral-950" />
                        <span>ACTIVE WINDOW</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#080808] text-neutral-400 border border-[#1C1C1C] whitespace-nowrap shadow-sm">
                        <Lock className="w-2.5 h-2.5 text-neutral-400" />
                        <span>LOCKED (&gt;100d)</span>
                      </span>
                    )}
                  </div>

                  {/* Days remaining count */}
                  <div className="flex items-baseline justify-between pt-0.5">
                    <div>
                      <span 
                        className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                          isUnlocked 
                            ? 'text-amber-100 drop-shadow-[0_0_25px_rgba(251,191,36,1)]' 
                            : 'text-neutral-400'
                        }`}
                      >
                        {countdown.days}
                      </span>
                      <span 
                        className={`text-[11px] ml-1.5 font-bold ${
                          isUnlocked 
                            ? 'text-amber-300 font-black drop-shadow-[0_0_10px_rgba(251,191,36,0.85)]' 
                            : 'text-neutral-400'
                        }`}
                      >
                        days left
                      </span>
                    </div>

                    <span 
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
                        isUnlocked
                          ? 'text-amber-200 bg-black/60 border-amber-400/70 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                          : 'text-neutral-400 bg-[#060606] border-[#161616]'
                      }`}
                    >
                      {formatDisplayDate(item.date)}
                    </span>
                  </div>

                  {/* Progress bar towards 100-day window / event */}
                  <div className="pt-1">
                    <div 
                      className={`w-full h-1.5 rounded-full overflow-hidden border ${
                        isUnlocked
                          ? 'bg-black/70 border-amber-400/50 shadow-inner'
                          : 'bg-[#080808] border border-[#141414]'
                      }`}
                    >
                      <div
                        className={`h-full transition-all duration-500 ${
                          isUnlocked 
                            ? 'bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-400 shadow-[0_0_20px_rgba(251,191,36,1)]' 
                            : 'bg-neutral-800'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(5, ((365 - countdown.days) / 365) * 100))}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] mt-1.5 font-medium">
                      <span className={isUnlocked ? 'text-emerald-300 font-black drop-shadow-[0_0_10px_rgba(52,211,153,0.9)]' : 'text-neutral-400'}>
                        {isUnlocked 
                          ? '✨ 100-day preparation active' 
                          : `🔒 Unlocks in ${countdown.daysUntilUnlock}d`}
                      </span>
                      <span className={`font-mono shrink-0 ml-1 ${isUnlocked ? 'text-amber-200 font-bold drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-neutral-400'}`}>
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
