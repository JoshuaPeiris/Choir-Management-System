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
  Sliders
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
  onOpenCalendarModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'work' | 'budget'>('work');
  const [adminBypassPreview, setAdminBypassPreview] = useState(false);

  const countdown = formatDetailedCountdown(event.targetDate, currentDate);
  const isInteractionDisabled = !countdown.isUnlocked && !adminBypassPreview;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#121212] text-white rounded-3xl p-6 sm:p-7 border border-[#222222] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Major Liturgical Event
              </span>

              {countdown.isUnlocked ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  <Unlock className="w-3.5 h-3.5" />
                  Active 100-Day Window
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  <Lock className="w-3.5 h-3.5" />
                  Interaction Locked (&gt;100 Days)
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {event.title}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl">
              {event.subtitle}
            </p>
          </div>

          {/* Countdown Clock Display */}
          <div className="bg-[#0A0A0A] rounded-2xl p-4 border border-[#242424] flex items-center gap-4 self-start md:self-auto shadow-inner">
            <div className="text-center">
              <div className="text-3xl font-black text-white font-mono tracking-tight">
                {countdown.days}
              </div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                Days Remaining
              </div>
            </div>
            <div className="w-px h-10 bg-[#222222]" />
            <div className="text-xs text-neutral-300 space-y-0.5">
              <div>
                <strong className="text-white">Event Date:</strong>{' '}
                {new Date(event.targetDate + 'T00:00:00').toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              <div className="text-amber-400 text-[11px] font-mono">
                {countdown.hours}h : {countdown.minutes}m : {countdown.seconds}s
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 100-DAY LOCKED SHIELD VIEW (When > 100 days away) */}
      {isInteractionDisabled ? (
        <div className="bg-[#121212] rounded-3xl border border-[#222222] p-8 sm:p-12 text-center shadow-xl max-w-3xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 mb-1">
              100-Day Annual Window Enforced
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Tab Interaction Disabled Until 100-Day Window
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">
              In accordance with committee liturgical governance, interactive hymn selection, task assignment, and budget allocation for <strong className="text-white">{event.title}</strong> are disabled until within 100 days of the solemnity.
            </p>
          </div>

          {/* Days until unlock countdown */}
          <div className="bg-[#161616] border border-[#262626] rounded-2xl p-6 max-w-md mx-auto">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
              Preparation Window Unlocks In
            </div>
            <div className="text-4xl font-black text-white tracking-tight font-mono">
              {countdown.daysUntilUnlock} <span className="text-lg font-semibold text-neutral-500">Days</span>
            </div>
            <div className="text-xs text-neutral-500 mt-2">
              (Current distance: {countdown.days} days • Window opens at 100 days)
            </div>

            {/* Progress bar towards 100-day window */}
            <div className="w-full bg-[#222222] h-2 rounded-full mt-4 overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all"
                style={{ width: `${Math.max(5, Math.min(100, ((365 - countdown.days) / (365 - 100)) * 100))}%` }}
              />
            </div>
          </div>

          {/* Committee override & calendar options */}
          <div className="pt-4 border-t border-[#202020] flex flex-wrap items-center justify-center gap-3 text-xs">
            <button
              onClick={onOpenCalendarModal}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-neutral-300 bg-[#1C1C1C] hover:bg-[#252525] hover:text-white transition-colors border border-[#2E2E2E]"
            >
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span>Adjust Annual Calendar Date</span>
            </button>

            {/* Committee Preview Mode Toggle for administrative readiness */}
            <button
              onClick={() => setAdminBypassPreview(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-amber-400 bg-amber-500/15 hover:bg-amber-500/25 transition-colors border border-amber-500/30"
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
