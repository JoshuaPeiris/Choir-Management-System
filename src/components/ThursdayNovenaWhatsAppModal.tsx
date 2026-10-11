import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Send, 
  Music2, 
  Piano, 
  Sparkles, 
  Edit3, 
  RotateCcw, 
  CheckCircle2, 
  Share2,
  BookOpen
} from 'lucide-react';
import { Chorister, Hymn, TaskAssignment, WorkAndBudget } from '../types';
import { copyTextToClipboard } from './TuesdayMassWhatsAppModal';
import { HymnAutocompleteInput } from './HymnAutocompleteInput';
import { INITIAL_WEEKLY_MASSES } from '../data/initialData';

interface ThursdayNovenaWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  workAndBudget?: WorkAndBudget;
  choristers: Chorister[];
  onSaveWork?: (updatedWork: WorkAndBudget) => Promise<void>;
}

export const buildThursdayWhatsAppText = ({
  organist,
  entranceHymn,
  offertoryHymn,
  communionHymn,
  finalHymn,
}: {
  organist: string;
  entranceHymn: string;
  offertoryHymn: string;
  communionHymn: string;
  finalHymn: string;
}): string => {
  const organistDisplay = organist.trim() ? organist.trim() : 'SHEVIN';
  const eDisplay = entranceHymn.trim();
  const oDisplay = offertoryHymn.trim();
  const cDisplay = communionHymn.trim();
  const fDisplay = finalHymn.trim();

  return `_*✝️ශුද්ධවූ මිඛායෙල් අග්‍රදූතතුමන්ගේ නුවානය*_

_*• අද සවස 6.00ට*_

_♦️Organists -_ \`\`\`${organistDisplay}\`\`\`

\`\`\`▪️E-${eDisplay}
▪️O-${oDisplay}
▪️C-${cDisplay}
▪️F-${fDisplay}    \`\`\`

*♦️ගායනා කණ්ඩායමේ සෑම සාමාජිකයෙක් / සාමාජිකාවක්ම අවම වශයෙන් තවත් එක් දිව්‍ය පූජාවකට සහභාගි වීමට උනන්දු වන්න.*

_ස්තුතියි.🙏🏽_
_ජේසු පිහිටයි  !_`;
};

export const ThursdayNovenaWhatsAppModal: React.FC<ThursdayNovenaWhatsAppModalProps> = ({
  isOpen,
  onClose,
  workAndBudget,
  choristers,
  onSaveWork,
}) => {
  const resolvedWork = workAndBudget || INITIAL_WEEKLY_MASSES.thursday.workAndBudget;

  const existingOrganist = 
    resolvedWork.organist ||
    resolvedWork.tasks?.find((t) => t.duty === 'Organist')?.assignedTo ||
    '';

  const findHymn = (categories: string[]): string => {
    const hymn = resolvedWork.hymns?.find((h) => categories.includes(h.category));
    if (!hymn) return '';
    let text = hymn.title;
    if (hymn.hymnNumber) text += ` ${hymn.hymnNumber}`;
    return text;
  };

  const initialEntrance = findHymn(['Entrance']) || '';
  const initialOffertory = findHymn(['Offertory']) || '';
  const initialCommunion = findHymn(['Communion']) || '';
  const initialFinal = findHymn(['Recessional', 'Post-Communion']) || '';

  const [organist, setOrganist] = useState<string>(existingOrganist || 'SHEVIN');
  const [entranceHymn, setEntranceHymn] = useState<string>(initialEntrance);
  const [offertoryHymn, setOffertoryHymn] = useState<string>(initialOffertory);
  const [communionHymn, setCommunionHymn] = useState<string>(initialCommunion);
  const [finalHymn, setFinalHymn] = useState<string>(initialFinal);

  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string>('');
  const [customMode, setCustomMode] = useState<boolean>(false);
  const [customText, setCustomText] = useState<string>('');

  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const current = workAndBudget || INITIAL_WEEKLY_MASSES.thursday.workAndBudget;
      const org = 
        current.organist ||
        current.tasks?.find((t) => t.duty === 'Organist')?.assignedTo ||
        '';
      setOrganist(org || 'SHEVIN');
      const findCurrentHymn = (categories: string[]): string => {
        const hymn = current.hymns?.find((h) => categories.includes(h.category));
        if (!hymn) return '';
        let text = hymn.title;
        if (hymn.hymnNumber) text += ` ${hymn.hymnNumber}`;
        return text;
      };
      setEntranceHymn(findCurrentHymn(['Entrance']) || '');
      setOffertoryHymn(findCurrentHymn(['Offertory']) || '');
      setCommunionHymn(findCurrentHymn(['Communion']) || '');
      setFinalHymn(findCurrentHymn(['Recessional', 'Post-Communion']) || '');
      setSyncNotice('');
      setIsCopied(false);
      setCustomMode(false);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, workAndBudget]);

  if (!isOpen) return null;

  const generatedText = buildThursdayWhatsAppText({
    organist,
    entranceHymn,
    offertoryHymn,
    communionHymn,
    finalHymn,
  });

  const activeText = customMode ? customText : generatedText;

  const handleCopy = async () => {
    const success = await copyTextToClipboard(activeText);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleOpenWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(activeText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSyncToMassData = async () => {
    if (!onSaveWork) return;
    setIsSaving(true);
    try {
      const current = workAndBudget || INITIAL_WEEKLY_MASSES.thursday.workAndBudget;
      const updatedHymns: Hymn[] = [...(current.hymns || [])];

      const upsertHymn = (category: 'Entrance' | 'Offertory' | 'Communion' | 'Recessional', titleVal: string) => {
        if (!titleVal.trim()) return;
        const index = updatedHymns.findIndex((h) => 
          category === 'Recessional' ? (h.category === 'Recessional' || h.category === 'Post-Communion') : h.category === category
        );
        if (index >= 0) {
          updatedHymns[index] = {
            ...updatedHymns[index],
            title: titleVal.trim(),
          };
        } else {
          updatedHymns.push({
            id: `hymn-thursday-${category.toLowerCase()}-${Date.now()}`,
            category: category,
            title: titleVal.trim(),
          });
        }
      };

      if (entranceHymn) upsertHymn('Entrance', entranceHymn);
      if (offertoryHymn) upsertHymn('Offertory', offertoryHymn);
      if (communionHymn) upsertHymn('Communion', communionHymn);
      if (finalHymn) upsertHymn('Recessional', finalHymn);

      const updatedTasks: TaskAssignment[] = [...(current.tasks || [])];
      if (organist.trim()) {
        const orgIndex = updatedTasks.findIndex((t) => t.duty === 'Organist');
        if (orgIndex >= 0) {
          updatedTasks[orgIndex] = {
            ...updatedTasks[orgIndex],
            assignedTo: organist.trim(),
            status: 'In Progress',
          };
        } else {
          updatedTasks.push({
            id: `task-organist-thursday-${Date.now()}`,
            title: 'Thursday Novena Organist Accompaniment',
            duty: 'Organist',
            assignedTo: organist.trim(),
            deadline: 'Thursday 6:00 PM',
            priority: 'High',
            status: 'In Progress',
          });
        }
      }

      await onSaveWork({
        ...current,
        organist: organist.trim() || undefined,
        hymns: updatedHymns,
        tasks: updatedTasks,
      });

      setSyncNotice('Roster and hymns synced successfully to Thursday Novena!');
      setTimeout(() => setSyncNotice(''), 4000);
    } catch (err) {
      console.error('Failed to sync to mass data', err);
    } finally {
      setIsSaving(false);
    }
  };

  const organistsList = choristers.filter((c) => c.role === 'Organist');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#121212] w-full max-w-4xl rounded-3xl border border-[#262626] shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0F0F0F] via-[#161616] to-[#0F0F0F] px-5 py-4 border-b border-[#222222] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <Share2 className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  WhatsApp Liturgy Roster
                </span>
                <span className="text-xs text-neutral-400">බ්‍රහස්පතින්දා සවස 6.00</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                St. Michael Novena WhatsApp Broadcast
              </h3>
            </div>
          </div>
          
          <button
            type="button"
            id="close-thursday-whatsapp-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#1c1c1c] hover:bg-[#282828] text-neutral-400 hover:text-white transition-colors border border-[#303030]"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {syncNotice && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{syncNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Form Inputs */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <Music2 className="w-4 h-4 text-amber-400" />
                  <span>Liturgical Setup</span>
                </h4>
                <span className="text-[11px] text-neutral-500">Auto-formats to Sinhala Template</span>
              </div>

              {/* Organist Input */}
              <div className="bg-[#171717] p-4 rounded-2xl border border-[#262626] space-y-2.5">
                <label className="block text-xs font-bold text-neutral-200 flex items-center gap-2">
                  <Piano className="w-3.5 h-3.5 text-amber-400" />
                  <span>Organist / Accompanying Musician</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="thursday-organist-input"
                    value={organist}
                    onChange={(e) => setOrganist(e.target.value)}
                    placeholder="e.g. SHEVIN"
                    className="w-full bg-[#0D0D0D] border border-[#333333] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {organistsList.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] uppercase font-bold text-neutral-400">Quick Pick:</span>
                    {organistsList.map((org) => (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => setOrganist(org.name)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                          organist === org.name
                            ? 'bg-amber-500 text-neutral-950 font-bold border-amber-400'
                            : 'bg-[#222222] hover:bg-[#2c2c2c] text-neutral-300 border-[#333333]'
                        }`}
                      >
                        {org.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 4 Liturgical Hymns */}
              <div className="bg-[#171717] p-4 rounded-2xl border border-[#262626] space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-[#262626]">
                  <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>Selected Hymns (E, O, C, F)</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">Title and/or Hymn Number</span>
                </div>

                {/* Entrance */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300 flex items-center justify-between">
                    <span>▪️ E - Entrance Hymn (ආරම්භක ගීතිකාව)</span>
                  </label>
                  <HymnAutocompleteInput
                    id="thursday-hymn-entrance-input"
                    value={entranceHymn}
                    onChange={setEntranceHymn}
                    liturgicalPart="Entrance"
                    placeholder="e.g. දුතාග්‍රයාණෙනි 02"
                    className="bg-[#0D0D0D] border-[#333333] text-white focus:border-amber-500"
                    theme="dark"
                  />
                </div>

                {/* Offertory */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300 flex items-center justify-between">
                    <span>▪️ O - Offertory Hymn (කාණිකා ගීතිකාව)</span>
                  </label>
                  <HymnAutocompleteInput
                    id="thursday-hymn-offertory-input"
                    value={offertoryHymn}
                    onChange={setOffertoryHymn}
                    liturgicalPart="Offertory"
                    placeholder="e.g. ලබා ඔබේ ඇරයුම් 132"
                    className="bg-[#0D0D0D] border-[#333333] text-white focus:border-amber-500"
                    theme="dark"
                  />
                </div>

                {/* Communion */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300 flex items-center justify-between">
                    <span>▪️ C - Communion Hymn (ප්‍රසාදස්නාන / සංසර්ග ගීතිකාව)</span>
                  </label>
                  <HymnAutocompleteInput
                    id="thursday-hymn-communion-input"
                    value={communionHymn}
                    onChange={setCommunionHymn}
                    liturgicalPart="Communion"
                    placeholder="e.g. සමගි දහම 197"
                    className="bg-[#0D0D0D] border-[#333333] text-white focus:border-amber-500"
                    theme="dark"
                  />
                </div>

                {/* Final */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300 flex items-center justify-between">
                    <span>▪️ F - Final Hymn (අවසාන ගීතිකාව)</span>
                  </label>
                  <HymnAutocompleteInput
                    id="thursday-hymn-final-input"
                    value={finalHymn}
                    onChange={setFinalHymn}
                    liturgicalPart="Recessional"
                    placeholder="e.g. දෙව් දූතයන්ගෙ සැමා 07"
                    className="bg-[#0D0D0D] border-[#333333] text-white focus:border-amber-500"
                    theme="dark"
                  />
                </div>
              </div>

              {/* Sync Button */}
              {onSaveWork && (
                <button
                  type="button"
                  id="thursday-sync-work-btn"
                  onClick={handleSyncToMassData}
                  disabled={isSaving}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#222222] hover:bg-[#2c2c2c] text-neutral-200 border border-[#383838] text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isSaving ? 'Syncing...' : 'Save & Sync to Thursday Mass Hymn List'}</span>
                </button>
              )}
            </div>

            {/* Right Column: WhatsApp Preview & Actions */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp Message Preview</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (!customMode) {
                        setCustomText(generatedText);
                      }
                      setCustomMode(!customMode);
                    }}
                    className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                  >
                    {customMode ? (
                      <>
                        <RotateCcw className="w-3 h-3" />
                        <span>Use Auto Template</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-3 h-3" />
                        <span>Manual Freeform Edit</span>
                      </>
                    )}
                  </button>
                </div>

                {/* WhatsApp Chat Styled Card */}
                <div className="bg-[#0b141a] rounded-2xl border border-[#21352e] p-4 flex flex-col justify-between min-h-[360px] shadow-inner relative">
                  {/* WhatsApp background pattern imitation */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-repeat bg-[radial-gradient(#25d366_1px,transparent_1px)] [background-size:16px_16px]" />

                  {customMode ? (
                    <textarea
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      rows={14}
                      className="w-full bg-[#111b21] border border-[#2a3942] rounded-xl p-3 text-xs text-[#e9edef] font-mono focus:outline-none focus:border-emerald-500 resize-none leading-relaxed z-10"
                    />
                  ) : (
                    <div 
                      onClick={handleCopy}
                      title="Click anywhere to copy message"
                      className="cursor-pointer bg-[#111b21] hover:bg-[#13222a] rounded-xl border border-[#2a3942] p-4 text-xs text-[#e9edef] font-mono whitespace-pre-wrap leading-relaxed select-all overflow-x-auto transition-colors z-10"
                    >
                      {generatedText}
                    </div>
                  )}

                  <div className="pt-3 flex items-center justify-between text-[11px] text-[#8696a0] border-t border-[#1f2c34] mt-3 z-10">
                    <span>Markdown symbols (*bold*, _italic_, ```monospace```) included</span>
                    <span>Format: St. Michael Novena</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  id="thursday-copy-whatsapp-btn"
                  onClick={handleCopy}
                  className={`py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg ${
                    isCopied
                      ? 'bg-emerald-500 text-neutral-950 scale-[1.02]'
                      : 'bg-[#1e2c24] hover:bg-[#273d31] text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy WhatsApp Text</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="thursday-send-whatsapp-btn"
                  onClick={handleOpenWhatsApp}
                  className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                >
                  <Send className="w-4 h-4" />
                  <span>Send to WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#101010] px-5 py-3 border-t border-[#222222] flex items-center justify-between text-xs text-neutral-400">
          <span>St. Michael the Archangel Novena • ශුද්ධවූ මිඛායෙල් අග්‍රදූතතුමන්ගේ නුවානය</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] text-neutral-300 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
