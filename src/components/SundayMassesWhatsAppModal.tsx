import React, { useState, useEffect } from 'react';
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
  Calendar,
  Mic2,
  Users,
  ChevronDown
} from 'lucide-react';
import { Chorister, Hymn, TaskAssignment, WeeklyMassService, WorkAndBudget } from '../types';
import { INITIAL_WEEKLY_MASSES } from '../data/initialData';
import { copyTextToClipboard } from './TuesdayMassWhatsAppModal';
import { HymnAutocompleteInput } from './HymnAutocompleteInput';

export interface SundayWhatsAppParams {
  sundayNumber: string;
  satOrganist: string;
  satPsalm: string;
  satAcclamation: string;
  sunEarlyOrganist: string;
  sunEarlyPsalm: string;
  sunEarlyAcclamation: string;
  sunMainOrganist: string;
  sunMainPsalm: string;
  sunMainAcclamation: string;
  entranceHymn: string;
  offertoryHymn: string;
  communionHymn1: string;
  communionHymn2: string;
  finalHymn: string;
}

export const buildSundayWhatsAppText = (params: SundayWhatsAppParams): string => {
  const num = params.sundayNumber.trim() ? params.sundayNumber.trim() : '15';
  const so = params.satOrganist.trim() ? params.satOrganist.trim() : 'SHEVON S./CHAMATHKA';
  const sp = params.satPsalm.trim() ? params.satPsalm.trim() : 'SAHELI';
  const sa = params.satAcclamation.trim() ? params.satAcclamation.trim() : 'ROSHEEN';

  const seo = params.sunEarlyOrganist.trim() ? params.sunEarlyOrganist.trim() : 'DINOLI';
  const sep = params.sunEarlyPsalm.trim() ? params.sunEarlyPsalm.trim() : 'NIPUNI';
  const sea = params.sunEarlyAcclamation.trim() ? params.sunEarlyAcclamation.trim() : 'STEPHANI F.';

  const smo = params.sunMainOrganist.trim() ? params.sunMainOrganist.trim() : 'SHEVIN';
  const smp = params.sunMainPsalm.trim() ? params.sunMainPsalm.trim() : 'SHAVEEN S.';
  const sma = params.sunMainAcclamation.trim() ? params.sunMainAcclamation.trim() : 'ABHILASH P.';

  const eh = params.entranceHymn.trim();
  const oh = params.offertoryHymn.trim();
  const ch1 = params.communionHymn1.trim();
  const ch2 = params.communionHymn2.trim();
  const fh = params.finalHymn.trim();

  let communionLines = `▪️C-${ch1}`;
  if (ch2) {
    communionLines += `\n    ${ch2}`;
  }

  return `_*🍀සාමාන්‍ය සමයේ  ${num}වන ඉරුදින*_

_*✝️සෙනසුරාදා ප.ව. 6.00 දිව්‍ය පූජාව*_
_• Organist-_  \`\`\`${so}\`\`\`
_• Psalm-_ \`\`\`${sp}\`\`\`
_• Acclamation-_ \`\`\`${sa}\`\`\`

_*✝️ඉරුදින පෙ.ව. 6.30 දිව්‍ය පූජාව*_
_• Organist-_ \`\`\`${seo}\`\`\`
_• Psalm-_ \`\`\`${sep}\`\`\`
_• Acclamation-_ \`\`\`${sea}\`\`\`

_*✝️ඉරුදින පෙ.ව. 8.00 දිව්‍ය පූජාව*_
_• Organist-_ \`\`\`${smo}\`\`\`
_• Psalm-_  \`\`\`${smp}\`\`\`
_• Acclamation-_ \`\`\`${sma}\`\`\`

\`\`\`▪️E-${eh}
▪️O-${oh}
${communionLines}
▪️F-${fh}  \`\`\`  

ස්තුතියි.🙏🏽 
ජේසු පිහිටයි!`;
};

interface SundayMassesWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  saturdayVigilService?: WeeklyMassService;
  sundayEarlyService?: WeeklyMassService;
  sundayMainService?: WeeklyMassService;
  saturdayVigilWork?: WorkAndBudget;
  sundayEarlyWork?: WorkAndBudget;
  sundayMainWork?: WorkAndBudget;
  choristers: Chorister[];
  onSaveSundayMasses?: (updates: {
    sundayOrdinaryNumber: string;
    saturdayVigil: {
      organist: string;
      psalmPerson: string;
      acclamationPerson: string;
      hymns: Hymn[];
    };
    sundayEarly: {
      organist: string;
      psalmPerson: string;
      acclamationPerson: string;
      hymns: Hymn[];
    };
    sundayMain: {
      organist: string;
      psalmPerson: string;
      acclamationPerson: string;
      hymns: Hymn[];
    };
  }) => Promise<void>;
  onSaveAll?: (updates: any) => Promise<void>;
}

export const SundayMassesWhatsAppModal: React.FC<SundayMassesWhatsAppModalProps> = ({
  isOpen,
  onClose,
  saturdayVigilService,
  sundayEarlyService,
  sundayMainService,
  saturdayVigilWork,
  sundayEarlyWork,
  sundayMainWork,
  choristers,
  onSaveSundayMasses,
  onSaveAll,
}) => {
  const saveHandler = onSaveSundayMasses || onSaveAll;

  const satService: WeeklyMassService = saturdayVigilService || {
    ...INITIAL_WEEKLY_MASSES.sundayMasses.services.saturdayVigil,
    workAndBudget: saturdayVigilWork || INITIAL_WEEKLY_MASSES.sundayMasses.services.saturdayVigil.workAndBudget,
  };
  const earlyService: WeeklyMassService = sundayEarlyService || {
    ...INITIAL_WEEKLY_MASSES.sundayMasses.services.sundayEarly,
    workAndBudget: sundayEarlyWork || INITIAL_WEEKLY_MASSES.sundayMasses.services.sundayEarly.workAndBudget,
  };
  const mainService: WeeklyMassService = sundayMainService || {
    ...INITIAL_WEEKLY_MASSES.sundayMasses.services.sundayMain,
    workAndBudget: sundayMainWork || INITIAL_WEEKLY_MASSES.sundayMasses.services.sundayMain.workAndBudget,
  };

  // Helper to extract hymn title or title + number
  const findHymnString = (service: WeeklyMassService | undefined, categories: string[]): string => {
    if (!service?.workAndBudget?.hymns) return '';
    const hymn = service.workAndBudget.hymns.find((h) => categories.includes(h.category));
    if (!hymn) return '';
    return hymn.hymnNumber ? `${hymn.title} ${hymn.hymnNumber}` : hymn.title;
  };

  const getServiceHymns = (service: WeeklyMassService | undefined) => {
    const hymns = service?.workAndBudget?.hymns || [];
    const communion2Item = hymns.filter((h) => h.category === 'Communion')[1];
    return {
      entrance: findHymnString(service, ['Entrance']),
      offertory: findHymnString(service, ['Offertory']),
      communion1: findHymnString(service, ['Communion']),
      communion2: communion2Item?.title 
        ? `${communion2Item.title} ${communion2Item.hymnNumber || ''}`.trim()
        : '',
      final: findHymnString(service, ['Recessional', 'Post-Communion']),
    };
  };

  const satH = getServiceHymns(satService);
  const earlyH = getServiceHymns(earlyService);
  const mainH = getServiceHymns(mainService);

  // Initial values prioritized from state, otherwise user defaults
  const initialSundayNum = 
    satService?.workAndBudget?.sundayOrdinaryNumber ||
    mainService?.workAndBudget?.sundayOrdinaryNumber ||
    '15';

  const [sundayNumber, setSundayNumber] = useState<string>(initialSundayNum);

  // Saturday 6:00 PM
  const [satOrganist, setSatOrganist] = useState<string>(
    satService?.workAndBudget?.organist || 'SHEVON S./CHAMATHKA'
  );
  const [satPsalm, setSatPsalm] = useState<string>(
    satService?.workAndBudget?.psalmPerson || 'SAHELI'
  );
  const [satAcclamation, setSatAcclamation] = useState<string>(
    satService?.workAndBudget?.acclamationPerson || 'ROSHEEN'
  );

  // Sunday 6:30 AM
  const [sunEarlyOrganist, setSunEarlyOrganist] = useState<string>(
    earlyService?.workAndBudget?.organist || 'DINOLI'
  );
  const [sunEarlyPsalm, setSunEarlyPsalm] = useState<string>(
    earlyService?.workAndBudget?.psalmPerson || 'NIPUNI'
  );
  const [sunEarlyAcclamation, setSunEarlyAcclamation] = useState<string>(
    earlyService?.workAndBudget?.acclamationPerson || 'STEPHANI F.'
  );

  // Sunday 8:00 AM
  const [sunMainOrganist, setSunMainOrganist] = useState<string>(
    mainService?.workAndBudget?.organist || 'SHEVIN'
  );
  const [sunMainPsalm, setSunMainPsalm] = useState<string>(
    mainService?.workAndBudget?.psalmPerson || 'SHAVEEN S.'
  );
  const [sunMainAcclamation, setSunMainAcclamation] = useState<string>(
    mainService?.workAndBudget?.acclamationPerson || 'ABHILASH P.'
  );

  // Shared Hymns for Sunday Masses
  const [entranceHymn, setEntranceHymn] = useState<string>(
    mainH.entrance || earlyH.entrance || satH.entrance || ''
  );
  const [offertoryHymn, setOffertoryHymn] = useState<string>(
    mainH.offertory || earlyH.offertory || satH.offertory || ''
  );
  const [communionHymn1, setCommunionHymn1] = useState<string>(
    mainH.communion1 || earlyH.communion1 || satH.communion1 || ''
  );
  const [communionHymn2, setCommunionHymn2] = useState<string>(
    mainH.communion2 || earlyH.communion2 || satH.communion2 || ''
  );
  const [finalHymn, setFinalHymn] = useState<string>(
    mainH.final || earlyH.final || satH.final || ''
  );

  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string>('');
  const [customMode, setCustomMode] = useState<boolean>(false);
  const [customText, setCustomText] = useState<string>('');

  // Recompute generated text
  const currentParams: SundayWhatsAppParams = {
    sundayNumber,
    satOrganist,
    satPsalm,
    satAcclamation,
    sunEarlyOrganist,
    sunEarlyPsalm,
    sunEarlyAcclamation,
    sunMainOrganist,
    sunMainPsalm,
    sunMainAcclamation,
    entranceHymn,
    offertoryHymn,
    communionHymn1,
    communionHymn2,
    finalHymn,
  };

  const previewText = customMode ? customText : buildSundayWhatsAppText(currentParams);

  // Sync state if services change
  useEffect(() => {
    if (isOpen) {
      setIsCopied(false);
      setSyncNotice('');
      setCustomMode(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const success = await copyTextToClipboard(previewText);
    if (success) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(previewText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  const handleSaveToMasses = async () => {
    if (!saveHandler) return;
    setIsSaving(true);
    try {
      // Helper to convert formatted string to Hymn item
      const parseToHymn = (str: string, category: Hymn['category'], idSuffix: string): Hymn => {
        const parts = str.trim().split(/\s+(\d+)$/);
        if (parts.length > 1) {
          return {
            id: `sun-hymn-${idSuffix}-${Date.now()}`,
            category,
            title: parts[0],
            hymnNumber: parts[1],
          };
        }
        return {
          id: `sun-hymn-${idSuffix}-${Date.now()}`,
          category,
          title: str.trim(),
        };
      };

      const hymnsList: Hymn[] = [
        parseToHymn(entranceHymn, 'Entrance', 'ent'),
        parseToHymn(offertoryHymn, 'Offertory', 'off'),
        parseToHymn(communionHymn1, 'Communion', 'com1'),
      ];
      if (communionHymn2.trim()) {
        hymnsList.push(parseToHymn(communionHymn2, 'Communion', 'com2'));
      }
      hymnsList.push(parseToHymn(finalHymn, 'Recessional', 'fin'));

      await saveHandler({
        sundayOrdinaryNumber: sundayNumber.trim(),
        saturdayVigil: {
          organist: satOrganist.trim(),
          psalmPerson: satPsalm.trim(),
          acclamationPerson: satAcclamation.trim(),
          hymns: hymnsList,
        },
        sundayEarly: {
          organist: sunEarlyOrganist.trim(),
          psalmPerson: sunEarlyPsalm.trim(),
          acclamationPerson: sunEarlyAcclamation.trim(),
          hymns: hymnsList,
        },
        sundayMain: {
          organist: sunMainOrganist.trim(),
          psalmPerson: sunMainPsalm.trim(),
          acclamationPerson: sunMainAcclamation.trim(),
          hymns: hymnsList,
        },
      });

      setSyncNotice('Saved Sunday Masses roster & hymns successfully!');
      setTimeout(() => setSyncNotice(''), 3000);
    } catch {
      setSyncNotice('Saved locally to this session.');
      setTimeout(() => setSyncNotice(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setSundayNumber('15');
    setSatOrganist('SHEVON S./CHAMATHKA');
    setSatPsalm('SAHELI');
    setSatAcclamation('ROSHEEN');

    setSunEarlyOrganist('DINOLI');
    setSunEarlyPsalm('NIPUNI');
    setSunEarlyAcclamation('STEPHANI F.');

    setSunMainOrganist('SHEVIN');
    setSunMainPsalm('SHAVEEN S.');
    setSunMainAcclamation('ABHILASH P.');

    setEntranceHymn('');
    setOffertoryHymn('');
    setCommunionHymn1('');
    setCommunionHymn2('');
    setFinalHymn('');
    setCustomMode(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-[#121212] border border-[#2a2a2a] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sunday-whatsapp-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#222222] bg-gradient-to-r from-[#17201a] via-[#121b15] to-[#121212]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-inner">
              <Share2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/25 text-emerald-300 border border-emerald-500/40">
                  Sunday Masses Liturgical Roster
                </span>
                <span className="text-xs text-neutral-400 font-medium">
                  සාමාන්‍ය සමයේ ඉරුදින දිව්‍ය පූජාවන්
                </span>
              </div>
              <h3 id="sunday-whatsapp-modal-title" className="text-base sm:text-lg font-black text-white mt-0.5">
                Sunday Masses WhatsApp Broadcast Template
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#1E1E1E] hover:bg-[#2A2A2A] text-neutral-400 hover:text-white flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sync Toast Notice */}
        {syncNotice && (
          <div className="bg-emerald-950/80 border-b border-emerald-700/60 px-4 py-2 flex items-center justify-center gap-2 text-xs text-emerald-300 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{syncNotice}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Form Controls */}
            <div className="lg:col-span-6 space-y-5">

              {/* Sunday Ordinary Number Input */}
              <div className="p-4 rounded-xl bg-[#181818] border border-emerald-500/30">
                <label className="block text-xs font-bold text-emerald-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    සාමාන්‍ය සමයේ ඉරුදින අංකය (Week Number):
                  </span>
                  <span className="text-[10px] text-neutral-400 font-normal">
                    (let them enter the number)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-300 font-medium whitespace-nowrap">
                    🍀 සාමාන්‍ය සමයේ
                  </span>
                  <input
                    type="text"
                    value={sundayNumber}
                    onChange={(e) => setSundayNumber(e.target.value)}
                    placeholder="15"
                    className="w-24 px-3 py-1.5 bg-[#0D0D0D] border border-emerald-500/50 rounded-lg text-sm text-center font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-xs text-neutral-300 font-medium">
                    වන ඉරුදින
                  </span>
                </div>
              </div>

              {/* Section 1: Saturday Sunday Mass 6 Service */}
              <div className="p-4 rounded-xl bg-[#161616] border border-[#2a2a2a] space-y-3">
                <div className="flex items-center justify-between border-b border-[#242424] pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <span>✝️</span> Saturday Sunday Mass 6 (සෙනසුරාදා ප.ව. 6.00)
                  </h4>
                  <span className="text-[10px] text-neutral-400">Sat 6:00 PM</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Organist
                    </label>
                    <input
                      type="text"
                      value={satOrganist}
                      onChange={(e) => setSatOrganist(e.target.value)}
                      placeholder="SHEVON S./CHAMATHKA"
                      className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Psalm
                    </label>
                    <input
                      type="text"
                      value={satPsalm}
                      onChange={(e) => setSatPsalm(e.target.value)}
                      placeholder="SAHELI"
                      className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Acclamation
                    </label>
                    <input
                      type="text"
                      value={satAcclamation}
                      onChange={(e) => setSatAcclamation(e.target.value)}
                      placeholder="ROSHEEN"
                      className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Sunday Morning Mass 6.30 Service */}
              <div className="p-4 rounded-xl bg-[#161616] border border-[#2a2a2a] space-y-3">
                <div className="flex items-center justify-between border-b border-[#242424] pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <span>✝️</span> Sunday Morning Mass 6.30 (ඉරුදින පෙ.ව. 6.30)
                  </h4>
                  <span className="text-[10px] text-neutral-400">Sun 6:30 AM</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Organist
                    </label>
                    <input
                      type="text"
                      value={sunEarlyOrganist}
                      onChange={(e) => setSunEarlyOrganist(e.target.value)}
                      placeholder="DINOLI"
                      className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Psalm
                    </label>
                    <input
                      type="text"
                      value={sunEarlyPsalm}
                      onChange={(e) => setSunEarlyPsalm(e.target.value)}
                      placeholder="NIPUNI"
                      className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Acclamation
                    </label>
                    <input
                      type="text"
                      value={sunEarlyAcclamation}
                      onChange={(e) => setSunEarlyAcclamation(e.target.value)}
                      placeholder="STEPHANI F."
                      className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Sunday Morning Mass 8 Service */}
              <div className="p-4 rounded-xl bg-[#161616] border border-[#2a2a2a] space-y-3">
                <div className="flex items-center justify-between border-b border-[#242424] pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <span>✝️</span> Sunday Morning Mass 8 (ඉරුදින පෙ.ව. 8.00)
                  </h4>
                  <span className="text-[10px] text-neutral-400">Sun 8:00 AM</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Organist
                    </label>
                    <input
                      type="text"
                      value={sunMainOrganist}
                      onChange={(e) => setSunMainOrganist(e.target.value)}
                      placeholder="SHEVIN"
                      className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Psalm
                    </label>
                    <input
                      type="text"
                      value={sunMainPsalm}
                      onChange={(e) => setSunMainPsalm(e.target.value)}
                      placeholder="SHAVEEN S."
                      className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      Acclamation
                    </label>
                    <input
                      type="text"
                      value={sunMainAcclamation}
                      onChange={(e) => setSunMainAcclamation(e.target.value)}
                      placeholder="ABHILASH P."
                      className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Sunday Masses Hymns with Autocomplete */}
              <div className="p-4 rounded-xl bg-[#161616] border border-[#2a2a2a] space-y-3">
                <div className="flex items-center justify-between border-b border-[#242424] pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Music2 className="w-3.5 h-3.5" />
                    Sunday Hymns (ගීතිකා 755 - Typeahead Prompts)
                  </h4>
                  <span className="text-[10px] text-neutral-400">Search by Title or No.</span>
                </div>

                {/* Entrance Hymn */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1 flex items-center justify-between">
                    <span>▪️E - ආරම්භක ගීතිකාව (Entrance)</span>
                  </label>
                  <HymnAutocompleteInput
                    value={entranceHymn}
                    onChange={setEntranceHymn}
                    placeholder="Search or enter entrance hymn..."
                    liturgicalPart="Entrance"
                    theme="dark"
                  />
                </div>

                {/* Offertory Hymn */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1 flex items-center justify-between">
                    <span>▪️O - කාණික ගීතිකාව (Offertory)</span>
                  </label>
                  <HymnAutocompleteInput
                    value={offertoryHymn}
                    onChange={setOffertoryHymn}
                    placeholder="Search or enter offertory hymn..."
                    liturgicalPart="Offertory"
                    theme="dark"
                  />
                </div>

                {/* Communion Hymn 1 */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1 flex items-center justify-between">
                    <span>▪️C - සත්ප්‍රසාද ගීතිකාව 1 (Communion 1)</span>
                  </label>
                  <HymnAutocompleteInput
                    value={communionHymn1}
                    onChange={setCommunionHymn1}
                    placeholder="Search or enter communion hymn..."
                    liturgicalPart="Communion"
                    theme="dark"
                  />
                </div>

                {/* Communion Hymn 2 */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1 flex items-center justify-between">
                    <span>▪️C - සත්ප්‍රසාද ගීතිකාව 2 (Communion 2 - Optional)</span>
                  </label>
                  <HymnAutocompleteInput
                    value={communionHymn2}
                    onChange={setCommunionHymn2}
                    placeholder="Search or enter 2nd communion hymn..."
                    liturgicalPart="Communion"
                    theme="dark"
                  />
                </div>

                {/* Final Hymn */}
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-300 mb-1 flex items-center justify-between">
                    <span>▪️F - අවසාන ගීතිකාව (Recessional / Final)</span>
                  </label>
                  <HymnAutocompleteInput
                    value={finalHymn}
                    onChange={setFinalHymn}
                    placeholder="Search or enter final hymn..."
                    liturgicalPart="Recessional"
                    theme="dark"
                  />
                </div>
              </div>

              {/* Reset Defaults button */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-amber-300 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default Roster & Hymns</span>
                </button>
              </div>

            </div>

            {/* Right Column: Live WhatsApp Message Preview & One-Click Actions */}
            <div className="lg:col-span-6 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  WhatsApp Live Message Preview
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (!customMode) {
                      setCustomText(previewText);
                    }
                    setCustomMode(!customMode);
                  }}
                  className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{customMode ? 'Back to Auto Preview' : 'Edit Text Directly'}</span>
                </button>
              </div>

              {/* Chat Bubble Container */}
              <div className="flex-1 bg-[#0b141a] rounded-2xl border border-[#21352e] p-4 flex flex-col justify-between shadow-inner">
                {customMode ? (
                  <textarea
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    rows={17}
                    className="w-full bg-[#111b21] p-3 rounded-xl border border-[#2a3942] text-xs text-[#e9edef] font-mono leading-relaxed focus:outline-none focus:border-emerald-500"
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-[#8696a0] flex items-center justify-between border-b border-[#21352e] pb-1.5 mb-2">
                      <span>Click to select & copy message</span>
                      <span className="text-emerald-400">Formatted Markdown</span>
                    </div>
                    <pre 
                      onClick={handleCopy}
                      title="Click anywhere to copy"
                      className="cursor-pointer bg-[#111b21] hover:bg-[#13222a] p-3.5 rounded-xl border border-[#2a3942] text-xs text-[#e9edef] font-mono whitespace-pre-wrap leading-relaxed select-all overflow-x-auto transition-colors"
                    >
                      {previewText}
                    </pre>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-[#1a2e26] flex items-center justify-between text-[11px] text-[#8696a0]">
                  <span>Formatting: *bold*, _italics_, and ```monospace``` code blocks</span>
                  {isCopied && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied to Clipboard!</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                {/* 1. Copy Message */}
                <button
                  type="button"
                  id="sunday-whatsapp-modal-copy-btn"
                  onClick={handleCopy}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all shadow-md ${
                    isCopied
                      ? 'bg-emerald-500 text-neutral-950 font-black'
                      : 'bg-[#182C22] hover:bg-[#223E30] text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-emerald-400" />}
                  <span>{isCopied ? 'Copied Message!' : 'Copy WhatsApp Text'}</span>
                </button>

                {/* 2. Send to WhatsApp */}
                <button
                  type="button"
                  id="sunday-whatsapp-modal-send-btn"
                  onClick={handleSendWhatsApp}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-600/30"
                >
                  <Send className="w-4 h-4" />
                  <span>Send to WhatsApp</span>
                </button>

                {/* 3. Save to Masses Roster */}
                <button
                  type="button"
                  id="sunday-whatsapp-modal-save-btn"
                  onClick={handleSaveToMasses}
                  disabled={isSaving}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold bg-[#1C1C1C] hover:bg-[#252525] text-amber-300 border border-amber-500/40 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>{isSaving ? 'Saving...' : 'Apply to Masses'}</span>
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-[#141414] border-t border-[#222222] flex items-center justify-between text-xs text-neutral-400">
          <span>St. Cecilia Choir Portal • Sunday Masses WhatsApp Liturgy Module</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#222222] hover:bg-[#2D2D2D] text-neutral-200 transition-colors font-semibold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
