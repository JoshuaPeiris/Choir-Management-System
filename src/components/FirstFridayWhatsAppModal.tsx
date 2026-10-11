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
  BookOpen,
  Calendar
} from 'lucide-react';
import { Chorister, Hymn, TaskAssignment, WorkAndBudget } from '../types';
import { copyTextToClipboard } from './TuesdayMassWhatsAppModal';
import { HymnAutocompleteInput } from './HymnAutocompleteInput';
import { INITIAL_WEEKLY_MASSES } from '../data/initialData';

export const SINHALA_MONTHS = [
  'ජනවාරි',
  'පෙබරවාරි',
  'මාර්තු',
  'අප්‍රේල්',
  'මැයි',
  'ජූනි',
  'ජූලි',
  'අගෝස්තු',
  'සැප්තැම්බර්',
  'ඔක්තෝබර්',
  'නොවැම්බර්',
  'දෙසැම්බර්',
];

interface FirstFridayWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  workAndBudget?: WorkAndBudget;
  choristers: Chorister[];
  onSaveWork?: (updatedWork: WorkAndBudget) => Promise<void>;
}

export const buildFirstFridayWhatsAppText = ({
  monthName,
  organist,
  entranceHymn,
  offertoryHymn,
  communionHymn,
  finalHymn,
}: {
  monthName?: string;
  organist?: string;
  entranceHymn?: string;
  offertoryHymn?: string;
  communionHymn?: string;
  finalHymn?: string;
}): string => {
  const currentMonth = monthName?.trim() || SINHALA_MONTHS[new Date().getMonth()];
  const orgDisplay = organist?.trim() ? organist.trim() : 'CHAMATHKA';
  const eDisplay = entranceHymn?.trim() || '';
  const oDisplay = offertoryHymn?.trim() || '';
  const cDisplay = communionHymn?.trim() || '';
  const fDisplay = finalHymn?.trim() || '';

  return `_*✝${currentMonth} මස පළමු සිකුරාදා*_
_*දිව්‍ය සත්ප්‍රසාද ආශිර්වාදය✝️*_

_*• අද සවස 5.45ට*_

_▫️Organist-_ \`\`\`${orgDisplay}\`\`\`

\`\`\`♦️දිව්‍ය ජේසූ 357
♦️ආ උතුම් මේ 355
♦️නිත්‍ය ස්තූතියට 353

▫️E-${eDisplay}
▫️O-${oDisplay}
▫️C-${cDisplay}
▫️F-${fDisplay}\`\`\`

*♦️ ඉරුදින පෙ.ව. 8.00 දහම් පාසල් දිව්‍ය යාගය සඳහා සහභාගි විය හැක්කේ, සතියේ දින පූජාවක් සහ ගීතිකා පුහුණුව සඳහා සහභාගී වූ දහම් පාසල් ළමුන් සදහා  පමණි.*

*♦️ගායනා කණ්ඩායමේ සෑම සාමාජිකයෙක් / සාමාජිකාවක්ම,*
*අවම වශයෙන් තවත් එක් දිව්‍ය පූජාවකට සහභාගි වීමට උනන්දු වන්න.*

_ස්තුතියි.🙏🏽_
_ජේසු පිහිටයි  !_`;
};

export const FirstFridayWhatsAppModal: React.FC<FirstFridayWhatsAppModalProps> = ({
  isOpen,
  onClose,
  workAndBudget,
  choristers,
  onSaveWork,
}) => {
  const resolvedWork = workAndBudget || INITIAL_WEEKLY_MASSES.firstFriday.workAndBudget;
  const currentMonthDefault = SINHALA_MONTHS[new Date().getMonth()];
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

  const [monthName, setMonthName] = useState<string>(currentMonthDefault);
  const [organist, setOrganist] = useState<string>(existingOrganist || 'CHAMATHKA');
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
      const current = workAndBudget || INITIAL_WEEKLY_MASSES.firstFriday.workAndBudget;
      const org = 
        current.organist ||
        current.tasks?.find((t) => t.duty === 'Organist')?.assignedTo ||
        '';
      setMonthName(SINHALA_MONTHS[new Date().getMonth()]);
      setOrganist(org || 'CHAMATHKA');
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

  const generatedText = buildFirstFridayWhatsAppText({
    monthName,
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
      const current = workAndBudget || INITIAL_WEEKLY_MASSES.firstFriday.workAndBudget;
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
            id: `hymn-first-friday-${category.toLowerCase()}-${Date.now()}`,
            category: category,
            title: titleVal.trim(),
          });
        }
      };

      // Also ensure the 3 permanent Benediction hymns exist in workAndBudget if not already there
      const benedictionHymns = [
        { title: 'දිව්‍ය ජේසූ', hymnNumber: '357', category: 'Benediction' as const },
        { title: 'ආ උතුම් මේ', hymnNumber: '355', category: 'Benediction' as const },
        { title: 'නිත්‍ය ස්තූතියට', hymnNumber: '353', category: 'Benediction' as const },
      ];

      benedictionHymns.forEach(bh => {
        if (!updatedHymns.some(h => h.title.includes(bh.title))) {
          updatedHymns.push({
            id: `hymn-benediction-${Date.now()}-${Math.random()}`,
            category: 'Benediction',
            title: bh.title,
            hymnNumber: bh.hymnNumber,
          });
        }
      });

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
            id: `task-organist-firstfriday-${Date.now()}`,
            title: 'First Friday Benediction & Mass Accompaniment',
            duty: 'Organist' as const,
            assignedTo: organist.trim(),
            deadline: 'First Friday 5:45 PM',
            priority: 'High' as const,
            status: 'In Progress' as const,
          });
        }
      }

      await onSaveWork({
        ...current,
        organist: organist.trim() || undefined,
        hymns: updatedHymns,
        tasks: updatedTasks,
      });

      setSyncNotice('Roster and hymns synced successfully to First Friday service!');
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
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-inner">
              <Share2 className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  First Friday WhatsApp Roster
                </span>
                <span className="text-xs text-neutral-400">අද සවස 5.45ට</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white mt-0.5">
                {monthName} මස පළමු සිකුරාදා දිව්‍ය සත්ප්‍රසාද ආශිර්වාදය
              </h3>
            </div>
          </div>
          
          <button
            type="button"
            id="close-firstfriday-whatsapp-modal-btn"
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
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{syncNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Form Inputs */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <Music2 className="w-4 h-4 text-rose-400" />
                  <span>Liturgy Setup</span>
                </h4>
                <span className="text-[11px] text-neutral-500">First Friday Devotion & Mass</span>
              </div>

              {/* Month Selector */}
              <div className="bg-[#171717] p-4 rounded-2xl border border-[#262626] space-y-2.5">
                <label className="block text-xs font-bold text-neutral-200 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  <span>Month (මාසය)</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {SINHALA_MONTHS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMonthName(m)}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all text-center ${
                        monthName === m
                          ? 'bg-rose-500 text-white font-bold border-rose-400 shadow-sm'
                          : 'bg-[#0D0D0D] hover:bg-[#222222] text-neutral-300 border-[#2b2b2b]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Organist Input */}
              <div className="bg-[#171717] p-4 rounded-2xl border border-[#262626] space-y-2.5">
                <label className="block text-xs font-bold text-neutral-200 flex items-center gap-2">
                  <Piano className="w-3.5 h-3.5 text-rose-400" />
                  <span>Organist</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="firstfriday-organist-input"
                    value={organist}
                    onChange={(e) => setOrganist(e.target.value)}
                    placeholder="e.g. CHAMATHKA"
                    className="w-full bg-[#0D0D0D] border border-[#333333] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
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
                            ? 'bg-rose-500 text-white font-bold border-rose-400'
                            : 'bg-[#222222] hover:bg-[#2c2c2c] text-neutral-300 border-[#333333]'
                        }`}
                      >
                        {org.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Fixed Benediction Hymns Display */}
              <div className="bg-[#171717] p-4 rounded-2xl border border-[#262626] space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-[#262626]">
                  <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>දිව්‍ය සත්ප්‍රසාද ආශිර්වාද ගීතිකා (Fixed)</span>
                  </span>
                  <span className="text-[10px] text-amber-400/90 font-medium">Always Constant</span>
                </div>

                <div className="space-y-1.5 pt-1 text-xs">
                  <div className="p-2 rounded-lg bg-[#0D0D0D] border border-[#262626] flex items-center justify-between">
                    <span className="text-neutral-300">♦️ දිව්‍ය ජේසූ</span>
                    <span className="font-mono text-amber-400 font-bold">357</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0D0D0D] border border-[#262626] flex items-center justify-between">
                    <span className="text-neutral-300">♦️ ආ උතුම් මේ</span>
                    <span className="font-mono text-amber-400 font-bold">355</span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0D0D0D] border border-[#262626] flex items-center justify-between">
                    <span className="text-neutral-300">♦️ නිත්‍ය ස්තූතියට</span>
                    <span className="font-mono text-amber-400 font-bold">353</span>
                  </div>
                </div>
              </div>

              {/* Mass Hymns (E, O, C, F) */}
              <div className="bg-[#171717] p-4 rounded-2xl border border-[#262626] space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-[#262626]">
                  <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                    <span>Mass Hymns (E, O, C, F)</span>
                  </span>
                  <span className="text-[10px] text-neutral-400">Title & Hymn Number</span>
                </div>

                {/* Entrance */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300 flex items-center justify-between">
                    <span>▫️ E - Entrance Hymn (ආරම්භක)</span>
                  </label>
                  <HymnAutocompleteInput
                    id="firstfriday-hymn-entrance-input"
                    value={entranceHymn}
                    onChange={setEntranceHymn}
                    liturgicalPart="Entrance"
                    placeholder="Search or enter entrance hymn..."
                    className="bg-[#0D0D0D] border-[#333333] text-white focus:border-rose-500"
                    theme="dark"
                  />
                </div>

                {/* Offertory */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300 flex items-center justify-between">
                    <span>▫️ O - Offertory Hymn (කාණිකා)</span>
                  </label>
                  <HymnAutocompleteInput
                    id="firstfriday-hymn-offertory-input"
                    value={offertoryHymn}
                    onChange={setOffertoryHymn}
                    liturgicalPart="Offertory"
                    placeholder="Search or enter offertory hymn..."
                    className="bg-[#0D0D0D] border-[#333333] text-white focus:border-rose-500"
                    theme="dark"
                  />
                </div>

                {/* Communion */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300 flex items-center justify-between">
                    <span>▫️ C - Communion Hymn (ප්‍රසාදස්නාන)</span>
                  </label>
                  <HymnAutocompleteInput
                    id="firstfriday-hymn-communion-input"
                    value={communionHymn}
                    onChange={setCommunionHymn}
                    liturgicalPart="Communion"
                    placeholder="Search or enter communion hymn..."
                    className="bg-[#0D0D0D] border-[#333333] text-white focus:border-rose-500"
                    theme="dark"
                  />
                </div>

                {/* Final */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-300 flex items-center justify-between">
                    <span>▫️ F - Final Hymn (අවසාන)</span>
                  </label>
                  <HymnAutocompleteInput
                    id="firstfriday-hymn-final-input"
                    value={finalHymn}
                    onChange={setFinalHymn}
                    liturgicalPart="Recessional"
                    placeholder="Search or enter final hymn..."
                    className="bg-[#0D0D0D] border-[#333333] text-white focus:border-rose-500"
                    theme="dark"
                  />
                </div>
              </div>

              {/* Sync Button */}
              {onSaveWork && (
                <button
                  type="button"
                  id="firstfriday-sync-work-btn"
                  onClick={handleSyncToMassData}
                  disabled={isSaving}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#222222] hover:bg-[#2c2c2c] text-neutral-200 border border-[#383838] text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  <span>{isSaving ? 'Syncing...' : 'Save & Sync to First Friday Mass Hymns'}</span>
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
                    className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1"
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
                <div className="bg-[#0b141a] rounded-2xl border border-[#21352e] p-4 flex flex-col justify-between min-h-[380px] shadow-inner relative">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-repeat bg-[radial-gradient(#25d366_1px,transparent_1px)] [background-size:16px_16px]" />

                  {customMode ? (
                    <textarea
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      rows={16}
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
                    <span>First Friday Adoration & Mass</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  id="firstfriday-copy-whatsapp-btn"
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
                  id="firstfriday-send-whatsapp-btn"
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
          <span>First Friday of the Month • දිව්‍ය සත්ප්‍රසාද ආශිර්වාදය හා දිව්‍ය පූජාව</span>
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
