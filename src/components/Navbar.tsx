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
  Sparkles,
  Menu,
  X
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
  const [isToolbarOpen, setIsToolbarOpen] = useState<boolean>(false);
  const [logoDriveUrl, setLogoDriveUrl] = useState<string>(() => getChoirLogoDriveInput());
  const [isCentered, setIsCenteredState] = useState<boolean>(() => getLogoCentered());
  const [imgScale, setImgScale] = useState<number>(() => getLogoImageScale());
  const [offsetX, setOffsetX] = useState<number>(() => getLogoImageOffsetX());
  const [offsetY, setOffsetY] = useState<number>(() => getLogoImageOffsetY());
  const [fitMode, setFitMode] = useState<LogoFitMode>(() => getLogoFitMode());

  return (
    <header id="main-header" className="bg-[#0D0D0D] border-b border-[#222222] text-[#E0E0E0] sticky top-0 z-40 shadow-xl shadow-black/40">
      {/* Permanently Visible Compact Top Bar with Hamburger Menu Button */}
      <div className="bg-[#080808] px-3 sm:px-4 py-2 border-b border-[#1A1A1A] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            id="hamburger-toolbar-toggle-btn"
            onClick={() => setIsToolbarOpen(!isToolbarOpen)}
            className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-2 transition-all cursor-pointer shadow-md"
            title={isToolbarOpen ? "Close Menu" : "Open Navigation & Status Menu"}
          >
            {isToolbarOpen ? <X className="w-4 h-4 text-amber-400" /> : <Menu className="w-4 h-4 text-amber-400" />}
            <span className="text-xs font-bold uppercase tracking-wider hidden xs:inline">
              Menu
            </span>
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-full bg-black ring-1 ring-amber-500/50 overflow-hidden flex items-center justify-center shrink-0">
              <img 
                src={getDriveDirectImageUrl(logoDriveUrl) || getChoirLogoUrl()} 
                alt="Crest" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </span>
            <span className="text-xs sm:text-sm font-bold text-white truncate">
              St. Cecilia&apos;s Choir Portal
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-[11px] sm:text-xs">
            <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="hidden sm:inline">{isConnected ? 'Synced' : 'Connecting...'}</span>
          </span>

          <button
            type="button"
            onClick={onOpenProfileModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#161616] border border-[#262626] text-xs font-bold text-white hover:border-amber-500/50 transition-colors cursor-pointer"
          >
            <div className={`w-5 h-5 rounded-full ${activeMember.avatarColor} flex items-center justify-center text-[10px] text-white font-bold`}>
              {activeMember.name.charAt(0)}
            </div>
            <span className="hidden sm:inline truncate max-w-[90px]">{activeMember.name}</span>
          </button>
        </div>
      </div>

      {/* Backdrop Overlay when Side Drawer is Open */}
      {isToolbarOpen && (
        <div 
          onClick={() => setIsToolbarOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 transition-opacity animate-in fade-in"
        />
      )}

      {/* Off-Canvas Left-to-Right Side Drawer (Covers 2/3 of the display: w-2/3) */}
      <div 
        className={`fixed top-0 left-0 bottom-0 z-50 w-2/3 min-w-[300px] max-w-xl bg-[#0D0D0D] border-r border-[#262626] text-[#E0E0E0] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isToolbarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="bg-[#080808] px-4 py-3.5 border-b border-[#1A1A1A] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-full bg-black ring-1 ring-amber-500/50 overflow-hidden flex items-center justify-center shrink-0">
              <img 
                src={getDriveDirectImageUrl(logoDriveUrl) || getChoirLogoUrl()} 
                alt="Crest" 
                className="w-full h-full object-cover" 
                referrerPolicy="no-referrer"
              />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white truncate">St. Cecilia&apos;s Choir</h2>
              <p className="text-[10px] text-amber-400 font-medium">Navigation &amp; Status Toolbar Drawer</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsToolbarOpen(false)}
            className="p-2 rounded-xl bg-[#161616] hover:bg-[#222222] text-neutral-400 hover:text-white border border-[#2A2A2A] transition-colors cursor-pointer"
            title="Close Menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Top Banner: Real-time sync & Mobile clock */}
          <div className="bg-[#080808] px-3 sm:px-4 py-2 rounded-xl border border-[#1A1A1A] text-xs flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium text-xs">
                <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span>{isConnected ? 'Real-Time Sync Active' : 'Connecting...'}</span>
              </span>

              {birthdayChoristers.length > 0 && (
                <button
                  id="topbar-birthday-pill-btn"
                  onClick={() => {
                    setIsToolbarOpen(false);
                    if (onSelectChoristerTab) onSelectChoristerTab();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 hover:text-white hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-bold transition-all animate-pulse"
                >
                  <Cake className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    {birthdayChoristers.length === 1 
                      ? `🎂 ${birthdayChoristers[0].name.split(' ')[0]}` 
                      : `🎂 ${birthdayChoristers.length} Birthdays`}
                  </span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1C1C1C]">
              {/* Web / Mobile simulator (Restricted to Developer: Joshua Peiris only) */}
              {isDeveloper && (
                <button
                  id="toggle-mobile-preview-btn"
                  onClick={onToggleMobilePreview}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    isMobilePreview 
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                      : 'text-neutral-400 hover:text-white hover:bg-[#1A1A1A] border border-transparent'
                  }`}
                >
                  {isMobilePreview ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
                  <span>{isMobilePreview ? 'Mobile Frame' : 'Web View'}</span>
                </button>
              )}

              {/* Supabase Cloud Database Setup (Restricted to Developer: Joshua Peiris only) */}
              {isDeveloper && (
                <button
                  id="open-supabase-modal-btn"
                  onClick={onOpenSupabaseModal}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors font-semibold"
                >
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Supabase DB</span>
                </button>
              )}

              {/* Real-Time Online Presence Tracker (Lead Joshua Peiris Only) */}
              {isLeadJoshua && onOpenOnlinePresenceModal && (
                <button
                  id="open-online-presence-navbar-btn"
                  onClick={onOpenOnlinePresenceModal}
                  className="flex items-center gap-1.5 text-emerald-300 hover:text-white bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
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
                  className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors px-2.5 py-1 text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 rounded-lg border border-amber-500/30 relative"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Notifications</span>
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
                className="flex items-center gap-1 text-neutral-400 hover:text-[#E0E0E0] transition-colors px-2 py-1 bg-[#141414] rounded-lg border border-[#222222] text-xs"
              >
                <History className="w-3.5 h-3.5" />
                <span>Activity Log</span>
              </button>
            </div>
          </div>

          {/* Main Bar Navigation & Controls */}
          <div className="space-y-4 pt-2">
            {/* Live Clock Widget */}
            <div className="bg-[#141414] border border-[#262626] rounded-xl p-3 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#1C1C1C] text-amber-400 border border-[#2E2E2E]">
                <Clock className="w-5 h-5 animate-[spin_60s_linear_infinite]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    {weekday} • Live
                  </span>
                </div>
                <div className="text-sm font-bold text-white tracking-tight">
                  {timeString} • {dateString}
                </div>
              </div>
            </div>

            {/* Quick Actions List */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                Portal Actions &amp; Tools
              </div>

              {birthdayChoristers.length > 0 && (
                <button
                  id="navbar-birthday-action-btn"
                  onClick={() => {
                    setIsToolbarOpen(false);
                    if (onSelectChoristerTab) onSelectChoristerTab();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <Cake className="w-4 h-4 text-amber-400" />
                    <span>{birthdayChoristers.length === 1 ? `${birthdayChoristers[0].name}'s Birthday!` : `${birthdayChoristers.length} Birthdays Today!`}</span>
                  </span>
                  <span>View &rarr;</span>
                </button>
              )}

              {onOpenFlyerModal && (
                <button
                  id="navbar-open-flyer-btn"
                  onClick={() => {
                    setIsToolbarOpen(false);
                    onOpenFlyerModal();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-[#161616] hover:bg-[#202020] text-amber-300 border border-[#2A2A2A] text-xs font-bold transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Birthday Flyer Generator</span>
                  </span>
                  <span>Open &rarr;</span>
                </button>
              )}

              <button
                id="annual-calendar-btn"
                onClick={() => {
                  setIsToolbarOpen(false);
                  if (onOpenYearPlanModal) onOpenYearPlanModal();
                  else onOpenCalendarModal();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#161616] hover:bg-[#202020] text-neutral-200 border border-[#2A2A2A] text-xs font-bold transition-all"
              >
                <span className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-amber-400" />
                  <span>Annual Year Plan &amp; Countdown</span>
                </span>
                <span>Open &rarr;</span>
              </button>

              <button
                id="my-profile-btn"
                onClick={() => {
                  setIsToolbarOpen(false);
                  onOpenProfileModal();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#161616] hover:bg-[#202020] text-white border border-[#2A2A2A] text-xs font-bold transition-all"
              >
                <span className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full ${activeMember.avatarColor} flex items-center justify-center text-xs text-white font-bold`}>
                    {activeMember.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div>{activeMember.name}</div>
                    <div className="text-[10px] text-amber-400">{activeMember.role}</div>
                  </div>
                </span>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </button>

              <button
                id="committee-member-selector-btn"
                onClick={() => {
                  setIsToolbarOpen(false);
                  onOpenAuthModal();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-[#161616] hover:bg-[#202020] text-neutral-300 border border-[#2A2A2A] text-xs font-semibold transition-all"
              >
                <span className="flex items-center gap-2">
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                  <span>Switch Committee Officer Account</span>
                </span>
                <span>Switch &rarr;</span>
              </button>

              <button
                id="lock-session-btn"
                onClick={() => {
                  setIsToolbarOpen(false);
                  onLockSession();
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all"
              >
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-rose-400" />
                  <span>Lock Portal / Re-enter PIN</span>
                </span>
                <span>Lock &rarr;</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Choir Logo Customizer Modal */}
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

