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
import { HymnAutocompleteInput } from './HymnAutocompleteInput';
import { INITIAL_WEEKLY_MASSES } from '../data/initialData';
import { CHOIR_LOGO_URL } from '../utils/driveImage';

interface TuesdayMassWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  workAndBudget?: WorkAndBudget;
  choristers: Chorister[];
  onSaveWork?: (updatedWork: WorkAndBudget) => Promise<void>;
}

export const buildTuesdayWhatsAppText = ({
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
  const organistDisplay = organist.trim() ? organist.trim() : '(Organist)';
  const eDisplay = entranceHymn.trim() ? entranceHymn.trim() : '(Entrance Hymn)';
  const oDisplay = offertoryHymn.trim() ? offertoryHymn.trim() : '(Offerety Hymn)';
  const cDisplay = communionHymn.trim() ? communionHymn.trim() : '( Communion Hymn)';
  const fDisplay = finalHymn.trim() ? finalHymn.trim() : '(Final Hymn)';

  return `_*✝️අඟහරුවාදා සවස 6.00 දිව්‍ය පූජාව*_

_♦️Organist -_ \`\`\`${organistDisplay}\`\`\`

\`\`\`▪️E- ${eDisplay}
▪️O-${oDisplay}
▪️C-${cDisplay}
▪️F-${fDisplay} \`\`\`

*♦️ඉරුදින පෙ.ව. 8.00 දහම් පාසල් දිව්‍ය යාගය සඳහා සහභාගි විය හැක්කේ, සතියේ දින පූජාවක් සහ ගීතිකා පුහුණුව සඳහා සහභාගී වූ දහම් පාසල් ළමුන් සදහා  පමණි.*

*♦️ගායනා කණ්ඩායමේ සෑම සාමාජිකයෙක් / සාමාජිකාවක්ම,*
*අවම වශයෙන් තවත් එක් දිව්‍ය පූජාවකට සහභාගි වීමට උනන්දු වන්න.*

_ස්තුතියි.🙏🏽_
_ජේසු පිහිටයි  !_`;
};

export const copyTextToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (err) {
    console.warn('Clipboard API failed, falling back to execCommand', err);
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch {
    return false;
  }
};

export const TuesdayMassWhatsAppModal: React.FC<TuesdayMassWhatsAppModalProps> = ({
  isOpen,
  onClose,
  workAndBudget,
  choristers,
  onSaveWork,
}) => {
  const resolvedWork = workAndBudget || INITIAL_WEEKLY_MASSES.tuesday.workAndBudget;

  // Extract initial values from resolvedWork
  const existingOrganist = 
    resolvedWork.organist ||
    resolvedWork.tasks?.find((t) => t.duty === 'Organist')?.assignedTo ||
    '';

  const findHymn = (categories: string[]): string => {
    const hymn = resolvedWork.hymns?.find((h) => categories.includes(h.category));
    if (!hymn) return '';
    let text = hymn.title;
    if (hymn.hymnNumber) text += ` (No. ${hymn.hymnNumber})`;
    return text;
  };

  const initialEntrance = findHymn(['Entrance']);
  const initialOffertory = findHymn(['Offertory']);
  const initialCommunion = findHymn(['Communion']);
  const initialFinal = findHymn(['Recessional', 'Post-Communion']);

  const [organist, setOrganist] = useState<string>(existingOrganist);
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

  // Re-sync only when modal opens
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const current = workAndBudget || INITIAL_WEEKLY_MASSES.tuesday.workAndBudget;
      const org = 
        current.organist ||
        current.tasks?.find((t) => t.duty === 'Organist')?.assignedTo ||
        '';
      setOrganist(org);
      const findCurrentHymn = (categories: string[]): string => {
        const h = current.hymns?.find((item) => categories.includes(item.category));
        if (!h) return '';
        let text = h.title;
        if (h.hymnNumber) text += ` (No. ${h.hymnNumber})`;
        return text;
      };
      setEntranceHymn(findCurrentHymn(['Entrance']));
      setOffertoryHymn(findCurrentHymn(['Offertory']));
      setCommunionHymn(findCurrentHymn(['Communion']));
      setFinalHymn(findCurrentHymn(['Recessional', 'Post-Communion']));
      setSyncNotice('');
      setIsCopied(false);
      setCustomMode(false);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, workAndBudget]);

  if (!isOpen) return null;

  const generatedText = buildTuesdayWhatsAppText({
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

  // Sync entered hymns and organist back to Tuesday Mass Work and Budget
  const handleSyncToMassData = async () => {
    if (!onSaveWork) return;
    setIsSaving(true);
    try {
      const current = workAndBudget || INITIAL_WEEKLY_MASSES.tuesday.workAndBudget;
      // 1. Prepare updated hymns
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
            id: `hymn-${category.toLowerCase()}-${Date.now()}`,
            category: category,
            title: titleVal.trim(),
          });
        }
      };

      if (entranceHymn) upsertHymn('Entrance', entranceHymn);
      if (offertoryHymn) upsertHymn('Offertory', offertoryHymn);
      if (communionHymn) upsertHymn('Communion', communionHymn);
      if (finalHymn) upsertHymn('Recessional', finalHymn);

      // 2. Prepare updated tasks for Organist
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
            id: `task-organist-${Date.now()}`,
            title: 'Tuesday Mass Organist Accompaniment',
            duty: 'Organist',
            assignedTo: organist.trim(),
            deadline: 'Tuesday 6:00 PM',
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

      setSyncNotice('Roster and hymns synced successfully to Tuesday Mass!');
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
            <img 
              src={CHOIR_LOGO_URL} 
              alt="St. Cecilia's Choir Crest" 
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-500/50 shadow-md bg-black"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  WhatsApp Template
                </span>
                <span className="text-xs text-neutral-400">Liturgical Roster Broadcast</span>
              </div>
              <h3 className="font-black text-base sm:text-lg text-white">
                අඟහරුවාදා සවස 6.00 දිව්‍ය පූජාව
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-[#202020] transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Left Column: Form Fields (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-[#161616] p-4 rounded-2xl border border-[#262626] space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                <div className="flex items-center gap-2">
                  <Piano className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    1. Assign Organist
                  </span>
                </div>
                {organistsList.length > 0 && (
                  <span className="text-[11px] text-amber-400/90 font-medium">
                    {organistsList.length} registered
                  </span>
                )}
              </div>

              <div>
                <label className="block text-xs text-neutral-400 mb-1.5 font-medium">
                  Organist Name
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    list="organist-options"
                    value={organist}
                    onChange={(e) => setOrganist(e.target.value)}
                    placeholder="e.g. Dinoli Fernando / Shevon"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0D0D0D] border border-[#303030] text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <datalist id="organist-options">
                    {organistsList.map((o) => (
                      <option key={o.id} value={o.name} />
                    ))}
                    {choristers
                      .filter((c) => c.role !== 'Organist')
                      .map((c) => (
                        <option key={c.id} value={c.name} />
                      ))}
                  </datalist>

                  {/* Quick select pills */}
                  {organistsList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {organistsList.map((org) => (
                        <button
                          key={org.id}
                          type="button"
                          onClick={() => setOrganist(org.name)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                            organist === org.name
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-[#1F1F1F] text-neutral-400 border-[#2E2E2E] hover:text-white'
                          }`}
                        >
                          🎹 {org.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Hymn Selection Section */}
            <div className="bg-[#161616] p-4 rounded-2xl border border-[#262626] space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                <div className="flex items-center gap-2">
                  <Music2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    2. Liturgical Hymns
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400">
                  Entrance, Offertory, Communion, Final
                </span>
              </div>

              {/* Entrance Hymn */}
              <div>
                <label className="block text-xs text-neutral-400 mb-1 font-medium">
                  ▪️E - Entrance Hymn
                </label>
                <HymnAutocompleteInput
                  value={entranceHymn}
                  onChange={setEntranceHymn}
                  liturgicalPart="Entrance"
                  placeholder="Search or enter entrance hymn..."
                  className="bg-[#0D0D0D] border-[#303030] text-white focus:border-emerald-500"
                  theme="dark"
                />
              </div>

              {/* Offertory Hymn */}
              <div>
                <label className="block text-xs text-neutral-400 mb-1 font-medium">
                  ▪️O - Offertory Hymn (Offerety Hymn)
                </label>
                <HymnAutocompleteInput
                  value={offertoryHymn}
                  onChange={setOffertoryHymn}
                  liturgicalPart="Offertory"
                  placeholder="Search or enter offertory hymn..."
                  className="bg-[#0D0D0D] border-[#303030] text-white focus:border-emerald-500"
                  theme="dark"
                />
              </div>

              {/* Communion Hymn */}
              <div>
                <label className="block text-xs text-neutral-400 mb-1 font-medium">
                  ▪️C - Communion Hymn
                </label>
                <HymnAutocompleteInput
                  value={communionHymn}
                  onChange={setCommunionHymn}
                  liturgicalPart="Communion"
                  placeholder="Search or enter communion hymn..."
                  className="bg-[#0D0D0D] border-[#303030] text-white focus:border-emerald-500"
                  theme="dark"
                />
              </div>

              {/* Final Hymn */}
              <div>
                <label className="block text-xs text-neutral-400 mb-1 font-medium">
                  ▪️F - Final Hymn
                </label>
                <HymnAutocompleteInput
                  value={finalHymn}
                  onChange={setFinalHymn}
                  liturgicalPart="Recessional"
                  placeholder="Search or enter final hymn..."
                  className="bg-[#0D0D0D] border-[#303030] text-white focus:border-emerald-500"
                  theme="dark"
                />
              </div>

              {onSaveWork && (
                <button
                  type="button"
                  onClick={handleSyncToMassData}
                  disabled={isSaving}
                  className="w-full mt-2 py-2 px-3 rounded-xl bg-[#222222] hover:bg-[#2A2A2A] text-xs font-semibold text-neutral-300 border border-[#333333] transition-colors flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isSaving ? 'Saving to Roster...' : 'Save & Sync to Tuesday Mass Hymn List'}</span>
                </button>
              )}

              {syncNotice && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{syncNotice}</span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: WhatsApp Live Message Preview (6 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Live WhatsApp Preview
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!customMode) setCustomText(generatedText);
                    setCustomMode(!customMode);
                  }}
                  className="text-[11px] text-neutral-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{customMode ? 'Use Auto Template' : 'Edit Text Freely'}</span>
                </button>
              </div>

              {/* Chat Bubble Container */}
              <div className="bg-[#0b141a] rounded-2xl border border-[#21352e] p-4 shadow-inner relative">
                <div className="text-[11px] font-bold text-[#8696a0] mb-2 flex items-center justify-between border-b border-[#21352e] pb-1.5">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    St. Cecilia's WhatsApp Broadcast
                  </span>
                  <span>Direct WhatsApp Format</span>
                </div>

                {customMode ? (
                  <textarea
                    rows={12}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    className="w-full bg-[#111b21] p-3 rounded-xl border border-[#2a3942] text-xs text-neutral-200 font-mono leading-relaxed focus:outline-none focus:border-emerald-500"
                  />
                ) : (
                  <pre className="bg-[#111b21] p-3.5 rounded-xl border border-[#2a3942] text-xs text-[#e9edef] font-mono whitespace-pre-wrap leading-relaxed select-all overflow-x-auto max-h-[380px]">
                    {generatedText}
                  </pre>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-2 border-t border-[#222222]">
              <div className="grid grid-cols-2 gap-3">
                {/* 1. Copy to Clipboard Button */}
                <button
                  type="button"
                  id="copy-whatsapp-template-btn"
                  onClick={handleCopy}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs transition-all shadow-md ${
                    isCopied
                      ? 'bg-emerald-500 text-neutral-950 font-black scale-102 shadow-emerald-500/30'
                      : 'bg-[#222222] hover:bg-[#2C2C2C] text-white border border-[#383838]'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-emerald-400" />
                      <span>Copy Template</span>
                    </>
                  )}
                </button>

                {/* 2. Open WhatsApp Button */}
                <button
                  type="button"
                  id="send-whatsapp-template-btn"
                  onClick={handleOpenWhatsApp}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-600/25 active:scale-98"
                >
                  <Send className="w-4 h-4" />
                  <span>Send to WhatsApp</span>
                </button>
              </div>

              <p className="text-center text-[11px] text-neutral-500">
                Clicking Copy places the ready-to-paste message on your clipboard with bold, italics, and monospace notation.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
