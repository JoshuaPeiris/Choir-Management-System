import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  X, 
  Lock, 
  Unlock, 
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';
import { AnnualCalendarConfig, CommitteeMember } from '../types';
import { getDaysRemaining } from '../utils/dateUtils';
import { getDriveDirectImageUrl } from '../utils/driveImage';

interface CalendarConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  calendarConfig: AnnualCalendarConfig;
  activeMember: CommitteeMember;
  onSaveCalendar: (config: AnnualCalendarConfig) => Promise<void>;
}

export const CalendarConfigModal: React.FC<CalendarConfigModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  calendarConfig,
  activeMember,
  onSaveCalendar,
}) => {
  const isLeadJoshua = Boolean(
    activeMember?.name?.trim().toLowerCase().includes('joshua') ||
    activeMember?.id === 'choir-joshua-peiris' ||
    (activeMember as any)?.email === 'jshpeiris@gmail.com'
  );

  const [formData, setFormData] = useState<AnnualCalendarConfig>(() => ({
    feastDate: calendarConfig?.feastDate || '2026-09-29',
    carolsDate: calendarConfig?.carolsDate || '2026-12-20',
    christmasNewYearDate: calendarConfig?.christmasNewYearDate || '2026-12-25',
    newYearDate: calendarConfig?.newYearDate || '2027-01-01',
    easterDate: calendarConfig?.easterDate || '2027-03-28',
    feastBackgroundUrl: calendarConfig?.feastBackgroundUrl || '',
    carolsBackgroundUrl: calendarConfig?.carolsBackgroundUrl || '',
    christmasBackgroundUrl: calendarConfig?.christmasBackgroundUrl || '',
    newYearBackgroundUrl: calendarConfig?.newYearBackgroundUrl || '',
    easterBackgroundUrl: calendarConfig?.easterBackgroundUrl || '',
    customEvents: calendarConfig?.customEvents || [],
  }));
  const [isSaving, setIsSaving] = useState(false);
  const [showBackgroundFields, setShowBackgroundFields] = useState(false);

  useEffect(() => {
    if (calendarConfig) {
      setFormData({
        feastDate: calendarConfig.feastDate || '2026-09-29',
        carolsDate: calendarConfig.carolsDate || '2026-12-20',
        christmasNewYearDate: calendarConfig.christmasNewYearDate || '2026-12-25',
        newYearDate: calendarConfig.newYearDate || '2027-01-01',
        easterDate: calendarConfig.easterDate || '2027-03-28',
        feastBackgroundUrl: calendarConfig.feastBackgroundUrl || '',
        carolsBackgroundUrl: calendarConfig.carolsBackgroundUrl || '',
        christmasBackgroundUrl: calendarConfig.christmasBackgroundUrl || '',
        newYearBackgroundUrl: calendarConfig.newYearBackgroundUrl || '',
        easterBackgroundUrl: calendarConfig.easterBackgroundUrl || '',
        customEvents: calendarConfig.customEvents || [],
      });
    }
  }, [calendarConfig, isOpen]);

  if (!isOpen || !isLeadJoshua) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLeadJoshua) return;
    setIsSaving(true);
    await onSaveCalendar(formData);
    setIsSaving(false);
    onClose();
  };

  // Helper to set quick simulation date
  const setSimulatedDays = (key: keyof AnnualCalendarConfig, daysFromNow: number) => {
    const target = new Date(currentDate);
    target.setDate(target.getDate() + daysFromNow);
    const dateStr = target.toISOString().split('T')[0];
    setFormData({ ...formData, [key]: dateStr });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#141414] w-full max-w-2xl rounded-3xl border border-[#2A2A2A] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#0D0D0D] text-white p-5 sm:p-6 border-b border-[#222222] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Main Annual Liturgical Calendar &amp; 100-Day Windows
              </h3>
              <p className="text-xs text-neutral-400">
                Configure target dates &amp; background picture drive links for the 4 core annual events
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div className="bg-[#181818] border border-amber-500/30 rounded-2xl p-3.5 text-xs text-neutral-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Dynamic 100-Day Window Rule
            </div>
            <p className="leading-relaxed text-neutral-400 text-[11px]">
              When an event target date is <strong className="text-white">&gt; 100 days</strong> away, tab interaction is disabled to focus committee work. When within <strong className="text-white">≤ 100 days</strong>, full hymn selection and budgeting unlock automatically.
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs font-bold text-neutral-300">5 Core Liturgical Event Dates:</span>
            <button
              type="button"
              onClick={() => setShowBackgroundFields(!showBackgroundFields)}
              className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>{showBackgroundFields ? 'Hide Background Picture Links' : 'Edit Background Picture Links'}</span>
            </button>
          </div>

          <div className="space-y-3.5">
            {/* 1. Feast Date */}
            <div className="bg-[#181818] p-3.5 rounded-2xl border border-[#262626] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">
                  1. Parish Feast Date (St. Michael&apos;s Feast)
                </label>
                {getDaysRemaining(formData.feastDate, currentDate) <= 100 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <Unlock className="w-2.5 h-2.5" />
                    {getDaysRemaining(formData.feastDate, currentDate)} Days (Unlocked)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-400 bg-[#222222] border border-[#333333] px-2 py-0.5 rounded-full">
                    <Lock className="w-2.5 h-2.5" />
                    {getDaysRemaining(formData.feastDate, currentDate)} Days (Locked)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  required
                  value={formData.feastDate}
                  onChange={(e) => setFormData({ ...formData, feastDate: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs border border-[#2E2E2E] rounded-xl bg-[#121212] text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setSimulatedDays('feastDate', 25)}
                  className="px-2.5 py-2 text-[10px] font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 rounded-xl whitespace-nowrap transition-colors"
                  title="Set to 25 days away (Active window)"
                >
                  Set 25d (Active)
                </button>
              </div>

              {showBackgroundFields && (
                <div className="pt-1.5 border-t border-[#222222]">
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                    Feast Background Drive Link (Hero Photo)
                  </label>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                    value={formData.feastBackgroundUrl || ''}
                    onChange={(e) => setFormData({ ...formData, feastBackgroundUrl: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-[#2C2C2C] rounded-lg bg-[#101010] text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            {/* 2. Carols Date */}
            <div className="bg-[#181818] p-3.5 rounded-2xl border border-[#262626] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">
                  2. Festival of Carols Date
                </label>
                {getDaysRemaining(formData.carolsDate, currentDate) <= 100 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <Unlock className="w-2.5 h-2.5" />
                    {getDaysRemaining(formData.carolsDate, currentDate)} Days (Unlocked)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-400 bg-[#222222] border border-[#333333] px-2 py-0.5 rounded-full">
                    <Lock className="w-2.5 h-2.5" />
                    {getDaysRemaining(formData.carolsDate, currentDate)} Days (Locked)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  required
                  value={formData.carolsDate}
                  onChange={(e) => setFormData({ ...formData, carolsDate: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs border border-[#2E2E2E] rounded-xl bg-[#121212] text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setSimulatedDays('carolsDate', 85)}
                  className="px-2.5 py-2 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-xl whitespace-nowrap transition-colors"
                  title="Set to 85 days away (Within 100 days)"
                >
                  Unlock (85d)
                </button>
              </div>

              {showBackgroundFields && (
                <div className="pt-1.5 border-t border-[#222222]">
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                    Carols Background Drive Link (Hero Photo)
                  </label>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                    value={formData.carolsBackgroundUrl || ''}
                    onChange={(e) => setFormData({ ...formData, carolsBackgroundUrl: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-[#2C2C2C] rounded-lg bg-[#101010] text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            {/* 3. Christmas Date */}
            <div className="bg-[#181818] p-3.5 rounded-2xl border border-[#262626] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">
                  3. Christmas &amp; Nativity Midnight Mass Date
                </label>
                {getDaysRemaining(formData.christmasNewYearDate, currentDate) <= 100 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <Unlock className="w-2.5 h-2.5" />
                    {getDaysRemaining(formData.christmasNewYearDate, currentDate)} Days (Unlocked)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-400 bg-[#222222] border border-[#333333] px-2 py-0.5 rounded-full">
                    <Lock className="w-2.5 h-2.5" />
                    {getDaysRemaining(formData.christmasNewYearDate, currentDate)} Days (Locked)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  required
                  value={formData.christmasNewYearDate}
                  onChange={(e) => setFormData({ ...formData, christmasNewYearDate: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs border border-[#2E2E2E] rounded-xl bg-[#121212] text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setSimulatedDays('christmasNewYearDate', 90)}
                  className="px-2.5 py-2 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-xl whitespace-nowrap transition-colors"
                  title="Set within 100-day window"
                >
                  Unlock (90d)
                </button>
              </div>

              {showBackgroundFields && (
                <div className="pt-1.5 border-t border-[#222222]">
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                    Christmas Background Drive Link (Hero Photo)
                  </label>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                    value={formData.christmasBackgroundUrl || ''}
                    onChange={(e) => setFormData({ ...formData, christmasBackgroundUrl: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-[#2C2C2C] rounded-lg bg-[#101010] text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            {/* 4. New Year Date */}
            <div className="bg-[#181818] p-3.5 rounded-2xl border border-[#262626] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">
                  4. New Year Thanksgiving &amp; Midnight Mass Date
                </label>
                {getDaysRemaining(formData.newYearDate || '2027-01-01', currentDate) <= 100 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <Unlock className="w-2.5 h-2.5" />
                    {getDaysRemaining(formData.newYearDate || '2027-01-01', currentDate)} Days (Unlocked)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-400 bg-[#222222] border border-[#333333] px-2 py-0.5 rounded-full">
                    <Lock className="w-2.5 h-2.5" />
                    {getDaysRemaining(formData.newYearDate || '2027-01-01', currentDate)} Days (Locked)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  required
                  value={formData.newYearDate || '2027-01-01'}
                  onChange={(e) => setFormData({ ...formData, newYearDate: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs border border-[#2E2E2E] rounded-xl bg-[#121212] text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setSimulatedDays('newYearDate', 95)}
                  className="px-2.5 py-2 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-xl whitespace-nowrap transition-colors"
                  title="Set within 100-day window"
                >
                  Unlock (95d)
                </button>
              </div>

              {showBackgroundFields && (
                <div className="pt-1.5 border-t border-[#222222]">
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                    New Year Background Drive Link (Hero Photo)
                  </label>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                    value={formData.newYearBackgroundUrl || ''}
                    onChange={(e) => setFormData({ ...formData, newYearBackgroundUrl: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-[#2C2C2C] rounded-lg bg-[#101010] text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>

            {/* 5. Easter Date */}
            <div className="bg-[#181818] p-3.5 rounded-2xl border border-[#262626] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white">
                  5. Easter Triduum &amp; Solemnity Date
                </label>
                {getDaysRemaining(formData.easterDate, currentDate) <= 100 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <Unlock className="w-2.5 h-2.5" />
                    {getDaysRemaining(formData.easterDate, currentDate)} Days (Unlocked)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-neutral-400 bg-[#222222] border border-[#333333] px-2 py-0.5 rounded-full">
                    <Lock className="w-2.5 h-2.5" />
                    {getDaysRemaining(formData.easterDate, currentDate)} Days (Locked)
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  required
                  value={formData.easterDate}
                  onChange={(e) => setFormData({ ...formData, easterDate: e.target.value })}
                  className="flex-1 px-3 py-2 text-xs border border-[#2E2E2E] rounded-xl bg-[#121212] text-white font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setSimulatedDays('easterDate', 60)}
                  className="px-2.5 py-2 text-[10px] font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 rounded-xl whitespace-nowrap transition-colors"
                  title="Unlock Easter tab by setting within 100 days"
                >
                  Unlock (60d)
                </button>
              </div>

              {showBackgroundFields && (
                <div className="pt-1.5 border-t border-[#222222]">
                  <label className="block text-[10px] font-bold text-neutral-400 mb-1">
                    Easter Background Drive Link (Hero Photo)
                  </label>
                  <input
                    type="text"
                    placeholder="https://drive.google.com/file/d/.../view?usp=sharing"
                    value={formData.easterBackgroundUrl || ''}
                    onChange={(e) => setFormData({ ...formData, easterBackgroundUrl: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-[#2C2C2C] rounded-lg bg-[#101010] text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222222]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-[#202020] rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20 transition-colors cursor-pointer"
            >
              {isSaving ? 'Updating Calendar...' : 'Save & Sync Calendar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
