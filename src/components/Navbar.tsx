import React, { useState } from 'react';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Wifi, 
  ShieldCheck, 
  Smartphone, 
  Monitor, 
  History, 
  SlidersHorizontal,
  Music2,
  ChevronDown,
  User,
  Lock,
  Database,
  Cake,
  Bell,
  Sparkles
} from 'lucide-react';
import { CommitteeMember, Chorister } from '../types';
import { OnlinePresenceUser } from '../utils/presenceService';
import { formatLiveDateTime } from '../utils/dateUtils';
import { 
  getDriveDirectImageUrl, 
  getChoirLogoUrl, 
  getLogoCentered, 
  getChoirLogoDriveInput,
  getLogoImageScale,
  getLogoImageOffsetX,
  getLogoImageOffsetY,
  getLogoFitMode,
  LogoFitMode,
  getLogoImageStyle
} from '../utils/driveImage';
import { LogoCustomizerModal } from './LogoCustomizerModal';

interface NavbarProps {
  currentDate: Date;
  activeMember: CommitteeMember;
  isConnected: boolean;
  isMobilePreview: boolean;
  birthdayChoristers?: Chorister[];
  unreadNotificationsCount?: number;
  onSelectChoristerTab?: () => void;
  onToggleMobilePreview: () => void;
  onOpenAuthModal: () => void;
  onOpenProfileModal: () => void;
  onLockSession: () => void;
  onOpenCalendarModal: () => void;
  onOpenYearPlanModal?: () => void;
  onOpenAuditDrawer: () => void;
  onOpenSupabaseModal: () => void;
  onOpenNotificationModal?: () => void;
  onlineUsers?: OnlinePresenceUser[];
  onOpenOnlinePresenceModal?: () => void;
  onOpenFullDisplayLogo?: () => void;
  onOpenFlyerModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentDate,
  activeMember,
  isConnected,
  isMobilePreview,
  birthdayChoristers = [],
  unreadNotificationsCount = 0,
  onSelectChoristerTab,
  onToggleMobilePreview,
  onOpenAuthModal,
  onOpenProfileModal,
  onLockSession,
  onOpenCalendarModal,
  onOpenYearPlanModal,
  onOpenAuditDrawer,
  onOpenSupabaseModal,
  onOpenNotificationModal,
  onlineUsers = [],
  onOpenOnlinePresenceModal,
  onOpenFullDisplayLogo,
  onOpenFlyerModal,
}) => {
  const { dateString, timeString, weekday } = formatLiveDateTime(currentDate);
  const isDeveloper = activeMember?.name === 'Joshua Peiris';
  const isLeadJoshua = activeMember?.name?.trim().toLowerCase() === 'joshua peiris' || activeMember?.id === 'choir-joshua-peiris';

  // Logo Customizer State (Direct click on logo)
  const [isLogoModalOpen, setIsLogoModalOpen] = useState<boolean>(false);
  const [logoDriveUrl, setLogoDriveUrl] = useState<string>(() => getChoirLogoDriveInput());
  const [isCentered, setIsCenteredState] = useState<boolean>(() => getLogoCentered());
  const [imgScale, setImgScale] = useState<number>(() => getLogoImageScale());
  const [offsetX, setOffsetX] = useState<number>(() => getLogoImageOffsetX());
  const [offsetY, setOffsetY] = useState<number>(() => getLogoImageOffsetY());
  const [fitMode, setFitMode] = useState<LogoFitMode>(() => getLogoFitMode());

  return (
    <header id="main-header" className="bg-[#0D0D0D] border-b border-[#222222] text-[#E0E0E0] sticky top-0 z-40 shadow-xl shadow-black/40">
      {/* Top Banner: Real-time sync & Mobile clock */}
      <div className="bg-[#080808] px-3 sm:px-4 py-1.5 border-b border-[#1A1A1A] text-xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px] sm:text-xs shrink-0">
            <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="hidden xs:inline">{isConnected ? 'Real-Time Sync' : 'Connecting...'}</span>
          </span>

          {/* Compact Mobile Clock */}
          <span className="sm:hidden text-[11px] font-mono font-bold text-amber-300/90 truncate">
            {timeString} · {weekday.slice(0, 3)}
          </span>

          {birthdayChoristers.length > 0 && (
            <button
              id="topbar-birthday-pill-btn"
              onClick={onSelectChoristerTab}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 hover:text-white hover:bg-amber-500/30 border border-amber-500/40 text-[10px] sm:text-[11px] font-bold transition-all animate-pulse truncate"
              title="Click to view today's birthday celebrants"
            >
              <Cake className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="truncate">
                {birthdayChoristers.length === 1 
                  ? `🎂 ${birthdayChoristers[0].name.split(' ')[0]}` 
                  : `🎂 ${birthdayChoristers.length} Birthdays`}
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Web / Mobile simulator (Restricted to Developer: Joshua Peiris only) */}
          {isDeveloper && (
            <button
              id="toggle-mobile-preview-btn"
              onClick={onToggleMobilePreview}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] sm:text-xs transition-colors ${
                isMobilePreview 
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                  : 'text-neutral-400 hover:text-white hover:bg-[#1A1A1A] border border-transparent'
              }`}
              title="Toggle between Desktop/Web view and Mobile viewport simulation (Developer Only)"
            >
              {isMobilePreview ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
              <span className="hidden sm:inline">{isMobilePreview ? 'Mobile Frame' : 'Web View'}</span>
            </button>
          )}

          {/* Supabase Cloud Database Setup (Restricted to Developer: Joshua Peiris only) */}
          {isDeveloper && (
            <button
              id="open-supabase-modal-btn"
              onClick={onOpenSupabaseModal}
              className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors font-semibold"
              title="Configure Supabase Live PostgreSQL Database (Joshua Peiris Only)"
            >
              <Database className="w-3 h-3 text-emerald-400" />
              <span>DB</span>
            </button>
          )}

          {/* Real-Time Online Presence Tracker (Lead Joshua Peiris Only) */}
          {isLeadJoshua && onOpenOnlinePresenceModal && (
            <button
              id="open-online-presence-navbar-btn"
              onClick={onOpenOnlinePresenceModal}
              className="flex items-center gap-1.5 text-emerald-300 hover:text-white bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Who is Online Right Now (Lead Joshua Only)"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ring-2 ring-emerald-500/40" />
              <span>{onlineUsers.length} Online</span>
            </button>
          )}

          {/* Notifications Center Button (Restricted to Lead Joshua Only) */}
          {isLeadJoshua && (
            <button
              id="open-notifications-navbar-btn"
              onClick={onOpenNotificationModal}
              className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors p-1 text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-lg border border-amber-500/30 relative"
              title="Notification System (Lead Joshua Only)"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="px-1.5 py-0.1 text-[9px] rounded-full bg-amber-400 text-black font-black animate-pulse">
                  {unreadNotificationsCount}
                </span>
              )}
            </button>
          )}

          <button
            id="open-audit-log-btn"
            onClick={onOpenAuditDrawer}
            className="flex items-center gap-1 text-neutral-400 hover:text-[#E0E0E0] transition-colors p-1"
            title="View choir activity audit log"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-xs">Activity Log</span>
          </button>
        </div>
      </div>

      {/* Main Bar */}
      <div className={`max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex items-center ${isCentered ? 'justify-center' : 'justify-between'} gap-2 sm:gap-4`}>
        {/* Brand & Crest (Exact Logo) - Directly Clickable to Edit Drive Link, Size & Centering */}
        <div className={`flex items-center gap-2.5 sm:gap-3.5 ${isCentered ? 'justify-center text-center flex-col sm:flex-row' : ''} min-w-0`}>
          <div className="relative group shrink-0">
            <button
              type="button"
              id="header-choir-logo-btn"
              onClick={() => {
                if (onOpenFullDisplayLogo) {
                  onOpenFullDisplayLogo();
                } else {
                  setIsLogoModalOpen(true);
                }
              }}
              className="relative cursor-pointer focus:outline-none rounded-full block group/btn"
              title="Experience Superb Full Display Interactive Logo Animation (or click slider to customize)"
            >
              <div 
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full ring-2 ring-amber-500/70 shadow-lg shadow-amber-500/20 group-hover/btn:ring-amber-300 group-hover/btn:scale-105 transition-all bg-black overflow-hidden relative flex items-center justify-center"
              >
                <img 
                  src={getDriveDirectImageUrl(logoDriveUrl) || getChoirLogoUrl()} 
                  alt="St. Cecilia's Choir Crest" 
                  referrerPolicy="no-referrer"
                  style={{
                    transform: `translate(${offsetX}%, ${offsetY}%) scale(${imgScale / 100})`,
                    transformOrigin: 'center center',
                    width: '100%',
                    height: '100%',
                    objectFit: fitMode,
                    filter: 'none',
                    mixBlendMode: 'normal',
                    isolation: 'isolate'
                  }}
                  className="un-themeable transition-transform duration-75"
                />
                {/* Customizer Quick Slider */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLogoModalOpen(true);
                  }}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover/btn:opacity-100 flex items-center justify-center transition-opacity text-amber-300 rounded-full"
                  title="Tune & crop logo"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 drop-shadow" />
                </div>
              </div>
            </button>
          </div>
          <div className="min-w-0">
            <div className={`flex items-center gap-1.5 sm:gap-2 ${isCentered ? 'justify-center' : ''}`}>
              <h1 className="font-bold text-sm sm:text-lg tracking-tight text-white leading-tight truncate">
                Choir Management
              </h1>
              <span className="hidden lg:inline-block px-2 py-0.5 text-[10px] font-semibold bg-amber-500/15 text-amber-300 rounded-full border border-amber-500/30">
                Committee Portal
              </span>
              {onOpenFullDisplayLogo && (
                <button
                  type="button"
                  id="navbar-interactive-logo-btn"
                  onClick={onOpenFullDisplayLogo}
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/35 transition-all cursor-pointer"
                  title="Experience Full Display Interactive Logo Animation"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Emblem Experience</span>
                </button>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-amber-400/90 font-medium truncate">
              St. Cecilia&apos;s Choir • St. Michael&apos;s Church
            </p>
          </div>
        </div>

        {/* Dashboard Current Date and Time Widget (Desktop/Tablet) */}
        <div 
          id="dashboard-live-clock" 
          className="hidden sm:flex bg-[#141414] border border-[#262626] rounded-xl px-3.5 py-1.5 items-center gap-2.5 shadow-inner"
        >
          <div className="p-1.5 rounded-lg bg-[#1C1C1C] text-amber-400 border border-[#2E2E2E]">
            <Clock className="w-4 h-4 animate-[spin_60s_linear_infinite]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                {weekday}
              </span>
              <span className="text-[9px] px-1 py-0.1 rounded bg-[#242424] text-neutral-300 border border-[#333333]">
                Live
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-bold text-white tracking-tight">
                {timeString}
              </span>
              <span className="text-[11px] text-neutral-400 font-medium">
                • {dateString}
              </span>
            </div>
          </div>
        </div>

        {/* Committee Member Authenticated Profile & Calendar Settings */}
        <div className="flex items-center gap-2.5">
          {birthdayChoristers.length > 0 && (
            <button
              id="navbar-birthday-action-btn"
              onClick={onSelectChoristerTab}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-sm group animate-pulse"
              title={`Today's Birthday: ${birthdayChoristers.map(c => c.name).join(', ')}. Click to view!`}
            >
              <Cake className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">
                {birthdayChoristers.length === 1 
                  ? `${birthdayChoristers[0].name.split(' ')[0]}'s Birthday!` 
                  : `${birthdayChoristers.length} Birthdays Today!`}
              </span>
              <span className="sm:hidden">🎂</span>
            </button>
          )}

          {onOpenFlyerModal && (
            <button
              id="navbar-open-flyer-btn"
              onClick={onOpenFlyerModal}
              className="p-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 hover:text-amber-200 transition-colors border border-amber-500/35 cursor-pointer"
              title="Open St. Cecilia Birthday Flyer Generator"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
            </button>
          )}

          <button
            id="annual-calendar-btn"
            onClick={() => {
              if (onOpenYearPlanModal) onOpenYearPlanModal();
              else onOpenCalendarModal();
            }}
            className="p-2 rounded-lg bg-[#161616] hover:bg-[#202020] text-neutral-300 hover:text-amber-400 transition-colors border border-[#2A2A2A]"
            title="View Full Year Plan & 100-Day Countdown Preparation Windows"
          >
            <CalendarIcon className="w-4 h-4 text-amber-400" />
          </button>

          {/* Committee Member Authenticated Profile Button */}
          <button
            id="my-profile-btn"
            onClick={onOpenProfileModal}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-[#161616] hover:bg-[#202020] border border-[#2A2A2A] hover:border-amber-500/50 transition-all text-left group"
            title="View Authenticated Profile & Permissions"
          >
            {activeMember.photoUrl ? (
              <img
                src={getDriveDirectImageUrl(activeMember.photoUrl)}
                alt={activeMember.name}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-[#2E2E2E] group-hover:ring-amber-500 shadow-sm"
              />
            ) : (
              <div className={`w-8 h-8 rounded-full ${activeMember.avatarColor} flex items-center justify-center font-bold text-xs text-white shadow-sm ring-2 ring-[#2E2E2E] group-hover:ring-amber-500`}>
                {activeMember.name.charAt(0)}
              </div>
            )}
            <div className="hidden sm:block leading-tight">
              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span>{activeMember.name}</span>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1">
                <span>{activeMember.role}</span>
                <span className="text-[10px] text-neutral-400 underline decoration-dotted">Profile</span>
              </div>
            </div>
          </button>

          {/* Quick Switch / Gate modal */}
          <button
            id="committee-member-selector-btn"
            onClick={onOpenAuthModal}
            className="p-2 rounded-lg bg-[#161616] hover:bg-[#202020] text-neutral-400 hover:text-amber-400 border border-[#2A2A2A] transition-colors"
            title="Switch Committee Officer Account"
          >
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Lock / Logout session button */}
          <button
            id="lock-session-btn"
            onClick={onLockSession}
            className="p-2 rounded-lg bg-[#161616] hover:bg-rose-500/15 text-neutral-400 hover:text-rose-400 border border-[#2A2A2A] hover:border-rose-500/30 transition-colors"
            title="Lock Portal / Re-enter PIN"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Choir Logo Customizer Modal (Direct click on logo) */}
      <LogoCustomizerModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        currentDriveUrl={logoDriveUrl}
        isCentered={isCentered}
        onOpenFullDisplayLogo={onOpenFullDisplayLogo}
        onApply={(newUrl, newCentered, newScale, newX, newY, newFit) => {
          setLogoDriveUrl(newUrl);
          setIsCenteredState(newCentered);
          setImgScale(newScale);
          setOffsetX(newX);
          setOffsetY(newY);
          setFitMode(newFit);
        }}
      />
    </header>
  );
};

