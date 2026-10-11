import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Send, 
  Music2, 
  Piano, 
  BookOpen,
  Edit3, 
  RotateCcw, 
  CheckCircle2, 
  Share2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Chorister, Hymn, TaskAssignment, WorkAndBudget } from '../types';
import { copyTextToClipboard } from './TuesdayMassWhatsAppModal';
import { HymnAutocompleteInput } from './HymnAutocompleteInput';
import { INITIAL_WEEKLY_MASSES } from '../data/initialData';

interface SaturdayEnglishWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  workAndBudget?: WorkAndBudget;
  choristers: Chorister[];
  onSaveWork?: (updatedWork: WorkAndBudget) => Promise<void>;
}

export const buildSaturdayEnglishWhatsAppText = ({
  timingHeader = 'Tomorrow @ 7.00 a.m.',
  organist = 'CHAMATHKA',
  reading = '',
  entranceHymn = '',
  offertoryHymn = '',
  communionHymn = '',
  finalHymn = '',
  mandatoryNote1 = 'Participation is mandatory for choristers who have given their names to the Saturday English Mass.',
  mandatoryNote2 = 'Each member of the choir must commit to attending at least one other Weekday Mass .',
}: {
  timingHeader?: string;
  organist?: string;
  reading?: string;
  entranceHymn?: string;
  offertoryHymn?: string;
  communionHymn?: string;
  finalHymn?: string;
  mandatoryNote1?: string;
  mandatoryNote2?: string;
}): string => {
  const timing = 'Tomorrow @ 7.00 a.m.';
  const org = organist?.trim() || 'CHAMATHKA';
  const r = reading?.trim() || '(To be assigned)';
  const e = entranceHymn?.trim() || '';
  const o = offertoryHymn?.trim() || '';
  const c = communionHymn?.trim() || '';
  const f = finalHymn?.trim() || '';
  const note1 = mandatoryNote1?.trim() || 'Participation is mandatory for choristers who have given their names to the Saturday English Mass.';
  const note2 = mandatoryNote2?.trim() || 'Each member of the choir must commit to attending at least one other Weekday Mass .';

  return `\`\`\`✝️SATURDAY ENGLISH MASS\`\`\` 
_*💢${timing}*_

_🔹Organist  -_ \`\`\`${org}\`\`\`
_🔹Reading  -_ \`\`\`${r}\`\`\`

\`\`\`▪️E-${e}
▪️O-${o}
▪️C-${c}
▪️F-${f}\`\`\`

_*🔹${note1}*_

_*🔹${note2}*_

\`\`\`Thank you.🙏🏽
May God bless you all!\`\`\``;
};

export const SaturdayEnglishWhatsAppModal: React.FC<SaturdayEnglishWhatsAppModalProps> = ({
  isOpen,
  onClose,
  workAndBudget,
  choristers,
  onSaveWork,
}) => {
  const resolvedWork = workAndBudget || INITIAL_WEEKLY_MASSES.saturdayEnglish.workAndBudget;

  const existingOrganist = 
    resolvedWork.organist ||
    resolvedWork.tasks?.find((t) => t.duty === 'Organist' || t.title?.toLowerCase().includes('organist'))?.assignedTo ||
    'CHAMATHKA';

  const existingReading = 
    resolvedWork.readingPerson ||
    resolvedWork.tasks?.find((t) => t.duty === 'Reading' || t.title?.toLowerCase().includes('reading'))?.assignedTo ||
    '';

  const findHymn = (category: string, defaultVal: string): string => {
    const found = resolvedWork.hymns?.find((h) => h.category === category);
    if (!found) return defaultVal;
    if (found.hymnNumber) {
      return `${found.title} ${found.hymnNumber}`.trim();
    }
    return found.title;
  };

  const [organist, setOrganist] = useState<string>(existingOrganist);
  const [reading, setReading] = useState<string>(existingReading);
  const [entranceHymn, setEntranceHymn] = useState<string>(findHymn('Entrance', ''));
  const [offertoryHymn, setOffertoryHymn] = useState<string>(findHymn('Offertory', ''));
  const [communionHymn, setCommunionHymn] = useState<string>(findHymn('Communion', ''));
  const [finalHymn, setFinalHymn] = useState<string>(findHymn('Recessional', ''));
  const [mandatoryNote1, setMandatoryNote1] = useState<string>(
    'Participation is mandatory for choristers who have given their names to the Saturday English Mass.'
  );
  const [mandatoryNote2, setMandatoryNote2] = useState<string>(
    'Each member of the choir must commit to attending at least one other Weekday Mass .'
  );

  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Sync with incoming workAndBudget changes ONLY when modal opens
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const current = workAndBudget || INITIAL_WEEKLY_MASSES.saturdayEnglish.workAndBudget;
      const org = 
        current.organist ||
        current.tasks?.find((t) => t.duty === 'Organist' || t.title?.toLowerCase().includes('organist'))?.assignedTo ||
        'CHAMATHKA';
      const read = 
        current.readingPerson ||
        current.tasks?.find((t) => t.duty === 'Reading' || t.title?.toLowerCase().includes('reading'))?.assignedTo ||
        '';
      setOrganist(org);
      setReading(read);
      const findCurrentHymn = (category: string, defaultVal: string): string => {
        const found = current.hymns?.find((h) => h.category === category);
        if (!found) return defaultVal;
        if (found.hymnNumber) {
          return `${found.title} ${found.hymnNumber}`.trim();
        }
        return found.title;
      };
      setEntranceHymn(findCurrentHymn('Entrance', ''));
      setOffertoryHymn(findCurrentHymn('Offertory', ''));
      setCommunionHymn(findCurrentHymn('Communion', ''));
      setFinalHymn(findCurrentHymn('Recessional', ''));
      setCopied(false);
      setSaveSuccess(false);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, workAndBudget]);

  if (!isOpen) return null;

  const generatedText = buildSaturdayEnglishWhatsAppText({
    timingHeader: 'Tomorrow @ 7.00 a.m.',
    organist,
    reading,
    entranceHymn,
    offertoryHymn,
    communionHymn,
    finalHymn,
    mandatoryNote1,
    mandatoryNote2,
  });

  const handleCopy = async () => {
    const success = await copyTextToClipboard(generatedText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleSendToWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(generatedText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleResetToDefault = () => {
    setOrganist('CHAMATHKA');
    setReading('');
    setEntranceHymn('');
    setOffertoryHymn('');
    setCommunionHymn('');
    setFinalHymn('');
    setMandatoryNote1('Participation is mandatory for choristers who have given their names to the Saturday English Mass.');
    setMandatoryNote2('Each member of the choir must commit to attending at least one other Weekday Mass .');
  };

  const parseHymnField = (text: string, category: Hymn['category'], idSuffix: string): Hymn => {
    const trimmed = text.trim();
    const match = trimmed.match(/^(.*?)\s*(\d+[A-Za-z]?)$/);
    if (match) {
      return {
        id: `sat-eng-hymn-${idSuffix}`,
        category,
        title: match[1].trim(),
        hymnNumber: match[2].trim(),
      };
    }
    return {
      id: `sat-eng-hymn-${idSuffix}`,
      category,
      title: trimmed,
      hymnNumber: '',
    };
  };

  const handleSaveToMass = async () => {
    if (!onSaveWork) return;
    setIsSaving(true);
    try {
      const current = workAndBudget || INITIAL_WEEKLY_MASSES.saturdayEnglish.workAndBudget;
      const updatedHymns: Hymn[] = [
        parseHymnField(entranceHymn, 'Entrance', 'entrance'),
        parseHymnField(offertoryHymn, 'Offertory', 'offertory'),
        parseHymnField(communionHymn, 'Communion', 'communion'),
        parseHymnField(finalHymn, 'Recessional', 'recessional'),
      ];

      const existingTasks = current.tasks || [];
      const updatedTasks: TaskAssignment[] = [
        ...existingTasks.filter((t) => t.duty !== 'Organist' && t.duty !== 'Reading' && !t.title?.toLowerCase().includes('reading')),
        {
          id: `task-sat-eng-organist-${Date.now()}`,
          title: 'Saturday English Mass Organist',
          duty: 'Organist' as const,
          assignedTo: organist.trim(),
          deadline: 'Saturday 7:00 AM',
          priority: 'High' as const,
          status: 'In Progress' as const,
        },
        {
          id: `task-sat-eng-reading-${Date.now() + 1}`,
          title: 'Saturday English Mass Reading',
          duty: 'Reading' as const,
          assignedTo: reading.trim(),
          deadline: 'Saturday 7:00 AM',
          priority: 'Medium' as const,
          status: 'In Progress' as const,
        },
      ];

      const updatedWork: WorkAndBudget = {
        ...current,
        organist: organist.trim(),
        readingPerson: reading.trim(),
        hymns: updatedHymns,
        tasks: updatedTasks,
        lastUpdatedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      };

      await onSaveWork(updatedWork);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save Saturday English Mass particulars:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-[#121212] border border-[#2a2a2a] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sat-english-whatsapp-title"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#181818] via-[#1f1a2e] to-[#181818] border-b border-[#262626] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Saturday 7:00 AM
                </span>
                <span className="text-xs text-neutral-400">English Liturgy Rota</span>
              </div>
              <h3 id="sat-english-whatsapp-title" className="text-xl font-bold text-white tracking-tight mt-0.5">
                Saturday English Mass WhatsApp Broadcast
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-neutral-200">
          {/* Quick Copy Notification Banner */}
          <div className="p-4 rounded-2xl bg-[#141b29] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  {copied ? 'WhatsApp broadcast copied to clipboard!' : 'Ready to Send to St. Cecilia WhatsApp Group'}
                </div>
                <div className="text-[11px] text-neutral-400">
                  {copied 
                    ? 'Paste directly into your WhatsApp group (Ctrl+V / Cmd+V).'
                    : 'Instant 1-click copy formatted with bold, italics, and code tags.'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                id="sat-eng-modal-copy-btn"
                onClick={handleCopy}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                  copied
                    ? 'bg-amber-500 text-neutral-950 font-black scale-105'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied Message!' : 'Copy WhatsApp Text'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendToWhatsApp}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30"
              >
                <Send className="w-4 h-4" />
                <span>Open in WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Two-column layout: Left = Form controls, Right = Live WhatsApp message preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Editable Parameters */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  Broadcast Particulars
                </span>
                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="text-[11px] text-neutral-400 hover:text-amber-400 transition-colors flex items-center gap-1"
                  title="Reset to template defaults"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              </div>

              {/* Timing Header - Fixed */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span>Schedule & Timing</span>
                  <span className="text-[10px] text-amber-400 font-medium">Fixed Schedule</span>
                </label>
                <div className="p-3 rounded-xl bg-[#181818] border border-[#2a2a2a] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white font-mono">
                      Tomorrow @ 7.00 a.m.
                    </span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Fixed
                  </span>
                </div>
              </div>

              {/* Organist Assignment */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Piano className="w-3.5 h-3.5 text-amber-400" />
                    Organist
                  </span>
                  <span className="text-[10px] text-neutral-500">Chorister in charge of Organ</span>
                </label>
                <input
                  type="text"
                  value={organist}
                  onChange={(e) => setOrganist(e.target.value.toUpperCase())}
                  placeholder="CHAMATHKA"
                  className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3.5 py-2 text-xs text-white uppercase focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* Reading Assignment */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    Reading
                  </span>
                  <span className="text-[10px] text-neutral-500">Chorister in charge of Reading</span>
                </label>
                <input
                  type="text"
                  value={reading}
                  onChange={(e) => setReading(e.target.value.toUpperCase())}
                  placeholder="Enter reader name"
                  className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl px-3.5 py-2 text-xs text-white uppercase focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* English Hymns Breakdown */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <Music2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>English Hymns (Entrance, Offertory, Communion, Final)</span>
                </div>

                {/* Entrance Hymn */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-400">
                    ▪️E - Entrance Hymn
                  </label>
                  <HymnAutocompleteInput
                    value={entranceHymn}
                    onChange={(val) => setEntranceHymn(val)}
                    placeholder="Search or enter entrance hymn..."
                    liturgicalPart="Entrance"
                    id="sat-eng-hymn-entrance"
                    theme="dark"
                    className="bg-[#181818] border-[#2a2a2a] text-white focus:border-amber-500"
                  />
                </div>

                {/* Offertory Hymn */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-400">
                    ▪️O - Offertory Hymn
                  </label>
                  <HymnAutocompleteInput
                    value={offertoryHymn}
                    onChange={(val) => setOffertoryHymn(val)}
                    placeholder="Search or enter offertory hymn..."
                    liturgicalPart="Offertory"
                    id="sat-eng-hymn-offertory"
                    theme="dark"
                    className="bg-[#181818] border-[#2a2a2a] text-white focus:border-amber-500"
                  />
                </div>

                {/* Communion Hymn */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-400">
                    ▪️C - Communion Hymn
                  </label>
                  <HymnAutocompleteInput
                    value={communionHymn}
                    onChange={(val) => setCommunionHymn(val)}
                    placeholder="Search or enter communion hymn..."
                    liturgicalPart="Communion"
                    id="sat-eng-hymn-communion"
                    theme="dark"
                    className="bg-[#181818] border-[#2a2a2a] text-white focus:border-amber-500"
                  />
                </div>

                {/* Final / Recessional Hymn */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-neutral-400">
                    ▪️F - Final / Recessional Hymn
                  </label>
                  <HymnAutocompleteInput
                    value={finalHymn}
                    onChange={(val) => setFinalHymn(val)}
                    placeholder="Search or enter final hymn..."
                    liturgicalPart="Recessional"
                    id="sat-eng-hymn-final"
                    theme="dark"
                    className="bg-[#181818] border-[#2a2a2a] text-white focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Mandatory Directives */}
              <div className="space-y-2 pt-2 border-t border-[#222222]">
                <div className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mandatory Attendance Directives</span>
                </div>
                <div className="space-y-1.5">
                  <textarea
                    rows={2}
                    value={mandatoryNote1}
                    onChange={(e) => setMandatoryNote1(e.target.value)}
                    className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 leading-relaxed resize-none"
                  />
                  <textarea
                    rows={2}
                    value={mandatoryNote2}
                    onChange={(e) => setMandatoryNote2(e.target.value)}
                    className="w-full bg-[#181818] border border-[#2a2a2a] rounded-xl p-2.5 text-xs text-neutral-200 focus:outline-none focus:border-amber-500 leading-relaxed resize-none"
                  />
                </div>
              </div>

              {/* Save Button to persist into Saturday English Mass */}
              {onSaveWork && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSaveToMass}
                    disabled={isSaving}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#202020] hover:bg-[#282828] text-white border border-[#333333] text-xs font-bold transition-all"
                  >
                    {saveSuccess ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Updated Saturday English Mass!</span>
                      </>
                    ) : isSaving ? (
                      <span>Saving Particulars...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4 text-amber-400" />
                        <span>Save to Saturday English Mass Service</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Right Column: Live WhatsApp Message Preview */}
            <div className="lg:col-span-6 flex flex-col">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 pb-2 border-b border-[#222222] mb-3 flex items-center justify-between">
                <span>WhatsApp Live Preview</span>
                <span className="text-[10px] text-emerald-400 font-normal">Formatted for WhatsApp</span>
              </div>

              {/* WhatsApp Chat Bubble Mockup */}
              <div className="bg-[#0b141a] rounded-2xl border border-[#21352e] p-4 sm:p-5 flex-1 flex flex-col justify-between shadow-inner">
                <div>
                  <div className="text-[11px] font-bold text-[#8696a0] mb-2 flex items-center justify-between">
                    <span>St. Cecilia WhatsApp Group</span>
                    <span>Saturday 7.00 AM</span>
                  </div>

                  <pre 
                    onClick={handleCopy}
                    title="Click anywhere to copy"
                    className="cursor-pointer bg-[#111b21] hover:bg-[#13222a] p-4 rounded-xl border border-[#2a3942] text-xs text-[#e9edef] font-mono whitespace-pre-wrap leading-relaxed select-all overflow-x-auto transition-colors"
                  >
                    {generatedText}
                  </pre>
                </div>

                <div className="mt-4 pt-3 border-t border-[#21352e] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-[11px] text-[#8696a0]">
                    💡 Click on the text box to copy instantly
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 text-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Click to Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-[#161616] border-t border-[#262626] flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                copied
                  ? 'bg-amber-500 text-neutral-950 font-black'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
              }`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy WhatsApp Message'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendToWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30"
            >
              <Send className="w-4 h-4" />
              <span>Send Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
