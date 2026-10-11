import React from 'react';
import { 
  Users, 
  X, 
  Smartphone, 
  Monitor, 
  Tablet, 
  ShieldCheck, 
  Sparkles, 
  Radio, 
  Send, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { OnlinePresenceUser } from '../utils/presenceService';
import { getDriveDirectImageUrl } from '../utils/driveImage';

interface OnlinePresenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onlineUsers: OnlinePresenceUser[];
  onOpenSendNotificationToUser?: (memberId: string, memberName: string) => void;
}

export const OnlinePresenceModal: React.FC<OnlinePresenceModalProps> = ({
  isOpen,
  onClose,
  onlineUsers,
  onOpenSendNotificationToUser
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#121212] border-2 border-emerald-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white animate-in zoom-in-95 duration-200 relative my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glows */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#222222] bg-[#161616] flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner relative">
              <Radio className="w-6 h-6 animate-pulse text-emerald-400" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Who is Online Right Now
                </h2>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-500 text-black shadow-sm">
                  Lead Joshua Monitor
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Live real-time active sessions connected across mobile phones &amp; computers
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#202020] hover:bg-[#2c2c2c] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 relative z-10">
          {/* Active Count Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-[#141A16] to-[#121212] border border-emerald-500/40 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-500/30" />
              <span className="text-sm font-extrabold text-white">
                {onlineUsers.length} Active {onlineUsers.length === 1 ? 'Officer' : 'Officers'} Connected
              </span>
            </div>
            <span className="text-xs text-emerald-300 font-mono font-semibold bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Live Real-Time
            </span>
          </div>

          {/* Roster of Online Users */}
          <div className="space-y-2.5">
            {onlineUsers.length === 0 ? (
              <div className="p-8 text-center bg-[#161616] rounded-2xl border border-[#242424] text-neutral-400 space-y-2">
                <Users className="w-8 h-8 mx-auto text-neutral-600" />
                <div className="text-sm font-bold text-neutral-300">No Other Active Sessions Detected</div>
                <div className="text-xs text-neutral-500">Other committee members will appear here immediately as soon as they open the app on their phones.</div>
              </div>
            ) : (
              onlineUsers.map((user) => {
                const isJoshua = user.memberName.toLowerCase().includes('joshua');
                return (
                  <div
                    key={user.sessionId || user.memberId}
                    className="p-3.5 rounded-2xl bg-[#171717] hover:bg-[#1C1C1C] border border-[#2A2A2A] hover:border-emerald-500/40 transition-all flex items-center justify-between gap-3 shadow-md"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        {user.photoUrl ? (
                          <img
                            src={getDriveDirectImageUrl(user.photoUrl)}
                            alt={user.memberName}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-xl object-cover ring-2 ring-emerald-500/50"
                          />
                        ) : (
                          <div className={`w-11 h-11 rounded-xl ${user.avatarColor || 'bg-amber-600'} text-white font-black text-sm flex items-center justify-center ring-2 ring-emerald-500/50`}>
                            {user.memberName.charAt(0)}
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-black" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm truncate">
                            {user.memberName}
                          </span>
                          {isJoshua && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Lead / You
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-amber-400/90 font-medium truncate flex items-center gap-1.5 mt-0.5">
                          <ShieldCheck className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{user.role}</span>
                        </div>
                        <div className="text-[11px] text-neutral-400 mt-1 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                            {user.deviceType === 'mobile' ? (
                              <Smartphone className="w-3 h-3" />
                            ) : user.deviceType === 'tablet' ? (
                              <Tablet className="w-3 h-3" />
                            ) : (
                              <Monitor className="w-3 h-3" />
                            )}
                            <span>{user.platform || (user.deviceType === 'mobile' ? 'Mobile Phone' : 'Desktop')}</span>
                          </span>
                          <span>•</span>
                          <span className="text-neutral-400">🟢 Active Now</span>
                        </div>
                      </div>
                    </div>

                    {onOpenSendNotificationToUser && !isJoshua && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenSendNotificationToUser(user.memberId, user.memberName);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-xs font-bold text-amber-300 hover:text-white flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                        title="Send custom notification to this online officer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Send Alert</span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#141414] border-t border-[#202020] flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Updated live every 10 seconds</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#202020] hover:bg-[#2a2a2a] text-neutral-200 hover:text-white font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
