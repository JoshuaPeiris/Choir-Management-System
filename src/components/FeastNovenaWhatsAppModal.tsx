import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  ExternalLink, 
  Music, 
  UserCheck, 
  Sparkles, 
  Calendar, 
  Save, 
  Edit3, 
  RefreshCw, 
  BookOpen, 
  Users, 
  Library, 
  Flag,
  Flame,
  Church,
  Clock
} from 'lucide-react';
import { FeastNovenaEntry, Chorister, HymnCategory } from '../types';
import { HymnAutocompleteInput } from './HymnAutocompleteInput';
import { HymnSelectorModal } from './HymnSelectorModal';

export interface FlagHoistingParams {
  date: string;
  time: string;
  organist: string;
  notes?: string;
}

export interface FeastNovenaWhatsAppParams {
  dayNumber: number;
  rosaryTime?: string;
  massTime?: string;
  organist: string;
  response: string;
  hallelujah: string;
  blessingHymn?: string;
  entranceHymn: string;
  offertoryHymn: string;
  communionHymn: string;
  finalHymn: string;
}

export interface VespersParams {
  tevadharaya: string;
}

export interface FeastMassesParams {
  mass5Psalm: string;
  mass5Alleluia: string;
  mass630Psalm: string;
  mass630Alleluia: string;
  mass6Psalm: string;
  mass6Alleluia: string;
}

export interface FeastHighMassParams {
  organist: string;
  psalm1: string;
  psalm2: string;
  alleluia: string;
  entranceHymn: string;
  offertoryHymn: string;
  communionHymn: string;
  finalHymn: string;
}

export const buildFlagHoistingWhatsAppText = (params: FlagHoistingParams): string => {
  const d = params.date?.trim() || '19.09.26';
  const t = params.time?.trim() || '@3.45PM';
  const org = params.organist?.trim() || 'CHAMATHKA';
  const notes = params.notes?.trim() || "⭕️ _Choristers who're available at that time , Please make sure to be in the church and be there at least 15 minutues before the litany begins._";

  return `*Hoisting The Fleet Of Flag Staff*❤️💛

Date - ${d}
Time - ${t}
Organist - _${org}_

${notes}


Thank You❤️
Have Blessed Season😇
May God Bless You..!`;
};

export const buildFeastNovenaWhatsAppText = (params: FeastNovenaWhatsAppParams): string => {
  const num = params.dayNumber;
  const rosary = params.rosaryTime?.trim() ? params.rosaryTime.trim() : '6.30ට';
  const mass = params.massTime?.trim() ? params.massTime.trim() : '7.00ට';

  const org = params.organist.trim() ? params.organist.trim() : '';
  const resp = params.response.trim() ? params.response.trim() : '';
  const hall = params.hallelujah.trim() ? params.hallelujah.trim() : '';

  const ble = params.blessingHymn?.trim() ? params.blessingHymn.trim() : '';
  const ent = params.entranceHymn.trim();
  const off = params.offertoryHymn.trim();
  const com = params.communionHymn.trim();
  const fin = params.finalHymn.trim();

  const blessingLine = ble ? `🔅B - ${ble}\n` : '';

  return `❤️💛*මංගල්‍යය සමයේ ${num} වන නුවානය*

• ජපමාලය සහ ප්‍රාර්ථනාව සවස ${rosary}

• නුවාන දිව්‍ය යාගය රාත්‍රී ${mass}

♦️Organist- ${org}

♦️පිළිතුරු ගීය-${resp}
♦️සුපුවත් ජයනද -${hall}

🔅
${blessingLine}🔅E - ${ent}
🔅O - ${off}
🔅C - ${com}
🔅F - ${fin}

*🛑සියලූ සාමාජික සාමාජිකාවන් සවස 6.30වන විට පැමිණ සිටින්න.*

ස්තූතියි.
ජේසූ පිහිටයි!`;
};

export const buildVespersWhatsAppText = (params: VespersParams): string => {
  const tev = params.tevadharaya.trim() ? params.tevadharaya.trim() : '';
  return `❤️💛*මංගල්‍යය - සවස දෙව් මෙහෙය (Vespers)*
📅 28 September, සවස 7.00ට

♦️තේවාධරයා - ${tev}

*🛑සියලූ සාමාජික සාමාජිකාවන් සවස 6.30වන විට පැමිණ සිටින්න.*

ස්තූතියි.
ජේසූ පිහිටයි!`;
};

export const buildFeastMassesWhatsAppText = (params: FeastMassesParams): string => {
  return `❤️💛*මංගල්‍ය දිව්‍ය යාගයන්*
📅 29 September (Feast Day)

✝️පෙ.ව. 5.00 දිව්‍ය පූජාව
♦️පිළිතුරු ගීය - ${params.mass5Psalm || ''}
♦️සුපුවත් ජයනද - ${params.mass5Alleluia || ''}

✝️පෙ.ව. 6.30 දිව්‍ය පූජාව
♦️පිළිතුරු ගීය - ${params.mass630Psalm || ''}
♦️සුපුවත් ජයනද - ${params.mass630Alleluia || ''}

✝️ප.ව. 6.00 දිව්‍ය පූජාව
♦️පිළිතුරු ගීය - ${params.mass6Psalm || ''}
♦️සුපුවත් ජයනද - ${params.mass6Alleluia || ''}

*🛑සියලූ සාමාජික සාමාජිකාවන් වේලාසනින් පැමිණ සිටින්න.*

ස්තූතියි.
ජේසූ පිහිටයි!`;
};

export const buildFeastHighMassWhatsAppText = (params: FeastHighMassParams): string => {
  return `❤️💛*මංගල්‍ය මහා දිව්‍ය යාගය (High Mass)*
📅 පෙ.ව. 8.00ට

♦️Organist - ${params.organist || ''}
♦️පිළිතුරු ගීය (යුගල - Duet) - ${params.psalm1 || ''} & ${params.psalm2 || ''}
♦️සුපුවත් ජයනද - ${params.alleluia || ''}

🔅
🔅E - ${params.entranceHymn || ''}
🔅O - ${params.offertoryHymn || ''}
🔅C - ${params.communionHymn || ''}
🔅F - ${params.finalHymn || ''}

*🛑සියලූ සාමාජික සාමාජිකාවන් පෙ.ව. 7.30 වන විට පැමිණ සිටින්න.*

ස්තූතියි.
ජේසූ පිහිටයි!`;
};

interface FeastNovenaWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDayNumber?: 'flag-hoisting' | number | 'vespers' | 'feast-masses' | 'high-mass';
  novenas: FeastNovenaEntry[];
  choristers: Chorister[];
  onSaveNovena?: (dayNumber: number, entry: Partial<FeastNovenaEntry>) => Promise<void>;
  onSyncAllNovenas?: (fixedData: {
    rosaryTime: string;
    massTime: string;
    blessingHymn?: string;
    entranceHymn: string;
    offertory1Hymn: string;
    communion1Hymn: string;
    finalHymn: string;
  }) => Promise<void>;
}

type HymnTargetSlot = 
  | 'blessing'
  | 'entrance' 
  | 'offertory' 
  | 'communion' 
  | 'final' 
  | 'high-entrance' 
  | 'high-offertory' 
  | 'high-communion' 
  | 'high-final';

export const FeastNovenaWhatsAppModal: React.FC<FeastNovenaWhatsAppModalProps> = ({
  isOpen,
  onClose,
  initialDayNumber = 'flag-hoisting',
  novenas,
  choristers,
  onSaveNovena,
  onSyncAllNovenas,
}) => {
  const [activeTab, setActiveTab] = useState<'flag-hoisting' | number | 'vespers' | 'feast-masses' | 'high-mass'>(initialDayNumber);
  
  // Flag Hoisting fields
  const [flagDate, setFlagDate] = useState<string>('19.09.26');
  const [flagTime, setFlagTime] = useState<string>('@3.45PM');
  const [flagOrganist, setFlagOrganist] = useState<string>('CHAMATHKA');
  const [flagNotes, setFlagNotes] = useState<string>(
    "⭕️ _Choristers who're available at that time , Please make sure to be in the church and be there at least 15 minutues before the litany begins._"
  );

  // Novena form fields
  const [rosaryTime, setRosaryTime] = useState<string>('6.30ට');
  const [massTime, setMassTime] = useState<string>('7.00ට');
  const [organist, setOrganist] = useState<string>('');
  const [response, setResponse] = useState<string>('');
  const [hallelujah, setHallelujah] = useState<string>('');
  const [blessingHymn, setBlessingHymn] = useState<string>('');
  const [entranceHymn, setEntranceHymn] = useState<string>('');
  const [offertoryHymn, setOffertoryHymn] = useState<string>('');
  const [communionHymn, setCommunionHymn] = useState<string>('');
  const [finalHymn, setFinalHymn] = useState<string>('');

  // Vespers fields
  const [tevadharaya, setTevadharaya] = useState<string>('K. D. D. Peiris');

  // Feast Masses fields (5am, 6:30am, 6pm)
  const [mass5Psalm, setMass5Psalm] = useState<string>('SHAVEEN S');
  const [mass5Alleluia, setMass5Alleluia] = useState<string>('METHUSHI');
  const [mass630Psalm, setMass630Psalm] = useState<string>('MELANI');
  const [mass630Alleluia, setMass630Alleluia] = useState<string>('VINDYA');
  const [mass6Psalm, setMass6Psalm] = useState<string>('CRISHMAL');
  const [mass6Alleluia, setMass6Alleluia] = useState<string>('CHAMATHKA');

  // Feast High Mass fields (8am)
  const [highOrganist, setHighOrganist] = useState<string>('CHAMATHKA');
  const [highPsalm1, setHighPsalm1] = useState<string>('SHAVEEN S');
  const [highPsalm2, setHighPsalm2] = useState<string>('METHUSHI');
  const [highAlleluia, setHighAlleluia] = useState<string>('MELANI');
  const [highEntrance, setHighEntrance] = useState<string>('මංගල ගීතිකා 04');
  const [highOffertory, setHighOffertory] = useState<string>('පුදසුන වෙත එමු 120');
  const [highCommunion, setHighCommunion] = useState<string>('දෙව් සමිඳුන්ගේ 180');
  const [highFinal, setHighFinal] = useState<string>('මරිය මව්නි රැකවරණේ 258');

  // Hymn Selector Modal State
  const [hymnSelectorOpen, setHymnSelectorOpen] = useState(false);
  const [activeHymnTarget, setActiveHymnTarget] = useState<{
    slot: HymnTargetSlot;
    label: string;
    liturgicalPart: HymnCategory | string;
  } | null>(null);

  // UI States
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string>('');
  const [customMode, setCustomMode] = useState<boolean>(false);
  const [customText, setCustomText] = useState<string>('');

  // When activeTab changes or modal opens, load that day's novena data
  useEffect(() => {
    if (isOpen && typeof activeTab === 'number') {
      const nov = novenas.find((n) => n.dayNumber === activeTab);
      const nov1 = novenas.find((n) => n.dayNumber === 1) || novenas[0];
      
      if (nov) {
        setOrganist(nov.organist || '');
        setResponse(nov.responsorialPsalmPerson || '');
        setHallelujah(nov.alleluiaPerson || '');
        setRosaryTime(nov.rosaryTime || '6.30ට');
        setMassTime(nov.massTime || '7.00ට');
        // Load hymns for this day (or fallback to novena 1 if not customized)
        setBlessingHymn(nov.blessingHymn || nov1?.blessingHymn || '');
        setEntranceHymn(nov.entranceHymn || nov1?.entranceHymn || '');
        setOffertoryHymn(nov.offertory1Hymn || nov1?.offertory1Hymn || '');
        setCommunionHymn(nov.communion1Hymn || nov1?.communion1Hymn || '');
        setFinalHymn(nov.finalHymn || nov1?.finalHymn || '');
      }
      setIsCopied(false);
      setCustomMode(false);
    }
  }, [isOpen, activeTab, novenas]);

  useEffect(() => {
    if (initialDayNumber !== undefined) {
      setActiveTab(initialDayNumber);
    }
  }, [initialDayNumber]);

  if (!isOpen) return null;

  // Open hymn selector modal
  const openHymnSelector = (
    slot: HymnTargetSlot,
    label: string,
    liturgicalPart: HymnCategory | string
  ) => {
    setActiveHymnTarget({ slot, label, liturgicalPart });
    setHymnSelectorOpen(true);
  };

  // Handle hymn chosen from modal
  const handleHymnChosen = (formattedText: string) => {
    if (!activeHymnTarget) return;
    switch (activeHymnTarget.slot) {
      case 'blessing':
        setBlessingHymn(formattedText);
        break;
      case 'entrance':
        setEntranceHymn(formattedText);
        break;
      case 'offertory':
        setOffertoryHymn(formattedText);
        break;
      case 'communion':
        setCommunionHymn(formattedText);
        break;
      case 'final':
        setFinalHymn(formattedText);
        break;
      case 'high-entrance':
        setHighEntrance(formattedText);
        break;
      case 'high-offertory':
        setHighOffertory(formattedText);
        break;
      case 'high-communion':
        setHighCommunion(formattedText);
        break;
      case 'high-final':
        setHighFinal(formattedText);
        break;
    }
  };

  // Generate text based on activeTab
  let generatedText = '';
  if (activeTab === 'flag-hoisting') {
    generatedText = customMode
      ? customText
      : buildFlagHoistingWhatsAppText({
          date: flagDate,
          time: flagTime,
          organist: flagOrganist,
          notes: flagNotes,
        });
  } else if (typeof activeTab === 'number') {
    generatedText = customMode
      ? customText
      : buildFeastNovenaWhatsAppText({
          dayNumber: activeTab,
          rosaryTime,
          massTime,
          organist,
          response,
          hallelujah,
          blessingHymn,
          entranceHymn,
          offertoryHymn,
          communionHymn,
          finalHymn,
        });
  } else if (activeTab === 'vespers') {
    generatedText = customMode
      ? customText
      : buildVespersWhatsAppText({ tevadharaya });
  } else if (activeTab === 'feast-masses') {
    generatedText = customMode
      ? customText
      : buildFeastMassesWhatsAppText({
          mass5Psalm,
          mass5Alleluia,
          mass630Psalm,
          mass630Alleluia,
          mass6Psalm,
          mass6Alleluia,
        });
  } else if (activeTab === 'high-mass') {
    generatedText = customMode
      ? customText
      : buildFeastHighMassWhatsAppText({
          organist: highOrganist,
          psalm1: highPsalm1,
          psalm2: highPsalm2,
          alleluia: highAlleluia,
          entranceHymn: highEntrance,
          offertoryHymn: highOffertory,
          communionHymn: highCommunion,
          finalHymn: highFinal,
        });
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = generatedText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(generatedText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  const handleSaveToNovena = async () => {
    if (typeof activeTab !== 'number' || !onSaveNovena) return;
    setIsSaving(true);
    setSyncNotice('');
    try {
      await onSaveNovena(activeTab, {
        organist,
        responsorialPsalmPerson: response,
        alleluiaPerson: hallelujah,
        rosaryTime,
        massTime,
        blessingHymn,
        entranceHymn,
        offertory1Hymn: offertoryHymn,
        communion1Hymn: communionHymn,
        finalHymn,
      });
      setSyncNotice(`Day ${activeTab} hymns & assignments saved to database!`);
      setTimeout(() => setSyncNotice(''), 3500);
    } catch (e) {
      console.error(e);
      setSyncNotice('Failed to save to database.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncAllNovenasAction = async () => {
    if (!onSyncAllNovenas) return;
    setIsSaving(true);
    setSyncNotice('');
    try {
      await onSyncAllNovenas({
        rosaryTime,
        massTime,
        blessingHymn,
        entranceHymn,
        offertory1Hymn: offertoryHymn,
        communion1Hymn: communionHymn,
        finalHymn,
      });
      setSyncNotice('These Hymns & Times successfully synced to all 9 Novenas!');
      setTimeout(() => setSyncNotice(''), 3500);
    } catch (e) {
      console.error(e);
      setSyncNotice('Failed to sync to all novenas.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <div 
          id="feast-whatsapp-modal"
          className="relative w-full max-w-4xl bg-[#111111] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222222] bg-[#161616]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Feast Liturgical Broadcasts (WhatsApp)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {activeTab === 'flag-hoisting'
                      ? 'FLAG HOISTING'
                      : typeof activeTab === 'number'
                      ? `NOVENA ${activeTab}`
                      : activeTab.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-neutral-400">
                  Select hymns, assign choral roles, and preview official WhatsApp broadcast
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector Tabs Bar: Flag Hoisting + Days 1-9 + Vespers + Feast Masses + High Mass */}
          <div className="px-4 sm:px-5 py-2.5 bg-[#0F0F0F] border-b border-[#1E1E1E] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {/* 1. Fleet Flag Hoisting (First tab!) */}
            <button
              id="whatsapp-tab-flag-hoisting"
              onClick={() => setActiveTab('flag-hoisting')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'flag-hoisting'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-[#1A1A1A] text-amber-300 hover:text-white hover:bg-[#242424] border border-amber-500/30'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Flag Hoisting (19 Sep)</span>
            </button>

            <div className="w-px h-5 bg-neutral-800 mx-1 shrink-0" />

            <span className="text-[11px] font-semibold text-neutral-400 shrink-0 mr-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> Novenas:
            </span>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
              const isSelected = activeTab === d;
              return (
                <button
                  key={d}
                  id={`whatsapp-tab-day-${d}`}
                  onClick={() => setActiveTab(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                    isSelected
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'bg-[#1A1A1A] text-neutral-300 hover:text-white hover:bg-[#242424] border border-[#2E2E2E]'
                  }`}
                >
                  <span>Day {d}</span>
                </button>
              );
            })}

            <div className="w-px h-5 bg-neutral-800 mx-1 shrink-0" />

            <button
              id="whatsapp-tab-vespers"
              onClick={() => setActiveTab('vespers')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'vespers'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-[#1A1A1A] text-neutral-300 hover:text-white hover:bg-[#242424] border border-[#2E2E2E]'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-400" />
              <span>Vespers (28 Sep)</span>
            </button>

            <button
              id="whatsapp-tab-feast-masses"
              onClick={() => setActiveTab('feast-masses')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'feast-masses'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-[#1A1A1A] text-neutral-300 hover:text-white hover:bg-[#242424] border border-[#2E2E2E]'
              }`}
            >
              <Church className="w-3 h-3 text-blue-400" />
              <span>Feast Masses</span>
            </button>

            <button
              id="whatsapp-tab-high-mass"
              onClick={() => setActiveTab('high-mass')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === 'high-mass'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-[#1A1A1A] text-neutral-300 hover:text-white hover:bg-[#242424] border border-[#2E2E2E]'
              }`}
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>High Mass (8am)</span>
            </button>
          </div>

          {/* Sync / Save notification banner */}
          {syncNotice && (
            <div className="px-5 py-2 bg-emerald-950/70 border-b border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between animate-in fade-in">
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4 text-emerald-400" />
                {syncNotice}
              </span>
            </div>
          )}

          {/* Content Body: Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[#222222] overflow-y-auto flex-1">
            {/* Left Column: Form Controls with Hymn Selectors */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[62vh] lg:max-h-none">
              
              {/* 1. Fleet Flag Hoisting View */}
              {activeTab === 'flag-hoisting' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-[#161616] border border-[#262626] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Flag className="w-4 h-4 text-amber-400" />
                        Hoisting The Fleet Of Flag Staff (කොඩිගස එසවීම)
                      </span>
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Opening Ceremony
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                          Date
                        </label>
                        <input
                          type="text"
                          value={flagDate}
                          onChange={(e) => setFlagDate(e.target.value)}
                          placeholder="19.09.26"
                          className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                          Time
                        </label>
                        <input
                          type="text"
                          value={flagTime}
                          onChange={(e) => setFlagTime(e.target.value)}
                          placeholder="@3.45PM"
                          className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                        Organist
                      </label>
                      <input
                        type="text"
                        list="choristers-list"
                        value={flagOrganist}
                        onChange={(e) => setFlagOrganist(e.target.value)}
                        placeholder="Select or enter organist"
                        className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                        Choristers Note / Litany Reminder
                      </label>
                      <textarea
                        rows={3}
                        value={flagNotes}
                        onChange={(e) => setFlagNotes(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Novenas 1-9 View */}
              {typeof activeTab === 'number' && (
                <>
                  {/* Schedule & Times */}
                  <div className="p-3.5 rounded-xl bg-[#161616] border border-[#262626] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Novena Day {activeTab} Schedule
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        {novenas.find((n) => n.dayNumber === activeTab)?.date || ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                          Rosary Time (ජපමාලය)
                        </label>
                        <input
                          type="text"
                          value={rosaryTime}
                          onChange={(e) => setRosaryTime(e.target.value)}
                          placeholder="6.30ට"
                          className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                          Mass Time (දිව්‍ය යාගය)
                        </label>
                        <input
                          type="text"
                          value={massTime}
                          onChange={(e) => setMassTime(e.target.value)}
                          placeholder="7.00ට"
                          className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Choral Roles */}
                  <div className="p-3.5 rounded-xl bg-[#161616] border border-[#262626] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Choral Roles (From Database)
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                          Organist
                        </label>
                        <input
                          type="text"
                          list="choristers-list"
                          value={organist}
                          onChange={(e) => setOrganist(e.target.value)}
                          placeholder="Select or enter organist"
                          className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                          පිළිතුරු ගීය (Responsorial Psalm)
                        </label>
                        <input
                          type="text"
                          list="choristers-list"
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          placeholder="Select or enter psalm singer"
                          className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                          සුපුවත් ජයනද (Alleluia)
                        </label>
                        <input
                          type="text"
                          list="choristers-list"
                          value={hallelujah}
                          onChange={(e) => setHallelujah(e.target.value)}
                          placeholder="Select or enter Alleluia singer"
                          className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-purple-500 font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Liturgical Hymns Selection Section (B, E, O, C, F) */}
                  <div className="p-3.5 rounded-xl bg-[#161616] border border-[#262626] space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                      <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" /> Novena Hymns (ගීතිකා)
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Search by hymn # or title
                      </span>
                    </div>

                    <div className="space-y-3">
                      {/* Blessing (B) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                            <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px]">
                              B
                            </span>
                            <span>Blessing Hymn (ආශීර්වාදය - Before Entrance)</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => openHymnSelector('blessing', 'Blessing (B)', 'Benediction')}
                            className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-[#202020] hover:bg-[#282828] px-2 py-0.5 rounded border border-[#333]"
                          >
                            <Library className="w-3 h-3" /> Browse Library
                          </button>
                        </div>
                        <HymnAutocompleteInput
                          value={blessingHymn}
                          onChange={setBlessingHymn}
                          liturgicalPart="Benediction"
                          placeholder="Type blessing hymn number or title..."
                          theme="dark"
                        />
                      </div>

                      {/* Entrance (E) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                            <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px]">
                              E
                            </span>
                            <span>Entrance Hymn (ඇතුල්වීම)</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => openHymnSelector('entrance', 'Entrance (E)', 'Entrance')}
                            className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-[#202020] hover:bg-[#282828] px-2 py-0.5 rounded border border-[#333]"
                          >
                            <Library className="w-3 h-3" /> Browse Library
                          </button>
                        </div>
                        <HymnAutocompleteInput
                          value={entranceHymn}
                          onChange={setEntranceHymn}
                          liturgicalPart="Entrance"
                          placeholder="Type hymn number (e.g. 04) or title..."
                          theme="dark"
                        />
                      </div>

                      {/* Offertory (O) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                            <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px]">
                              O
                            </span>
                            <span>Offertory Hymn (පුදසුන)</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => openHymnSelector('offertory', 'Offertory (O)', 'Offertory')}
                            className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-[#202020] hover:bg-[#282828] px-2 py-0.5 rounded border border-[#333]"
                          >
                            <Library className="w-3 h-3" /> Browse Library
                          </button>
                        </div>
                        <HymnAutocompleteInput
                          value={offertoryHymn}
                          onChange={setOffertoryHymn}
                          liturgicalPart="Offertory"
                          placeholder="Type hymn number (e.g. 120) or title..."
                          theme="dark"
                        />
                      </div>

                      {/* Communion (C) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                            <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px]">
                              C
                            </span>
                            <span>Communion Hymn (දිව්‍ය භෝජන)</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => openHymnSelector('communion', 'Communion (C)', 'Communion')}
                            className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-[#202020] hover:bg-[#282828] px-2 py-0.5 rounded border border-[#333]"
                          >
                            <Library className="w-3 h-3" /> Browse Library
                          </button>
                        </div>
                        <HymnAutocompleteInput
                          value={communionHymn}
                          onChange={setCommunionHymn}
                          liturgicalPart="Communion"
                          placeholder="Type hymn number (e.g. 180) or title..."
                          theme="dark"
                        />
                      </div>

                      {/* Final (F) */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1">
                            <span className="w-4 h-4 rounded bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-[10px]">
                              F
                            </span>
                            <span>Final / Recessional Hymn (සමුගැනීම)</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => openHymnSelector('final', 'Final (F)', 'Recessional')}
                            className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-[#202020] hover:bg-[#282828] px-2 py-0.5 rounded border border-[#333]"
                          >
                            <Library className="w-3 h-3" /> Browse Library
                          </button>
                        </div>
                        <HymnAutocompleteInput
                          value={finalHymn}
                          onChange={setFinalHymn}
                          liturgicalPart="Recessional"
                          placeholder="Type hymn number (e.g. 255) or title..."
                          theme="dark"
                        />
                      </div>
                    </div>

                    {/* Multi-Novena Sync Helper */}
                    {onSyncAllNovenas && (
                      <div className="pt-2 border-t border-[#222222]">
                        <button
                          type="button"
                          onClick={handleSyncAllNovenasAction}
                          disabled={isSaving}
                          className="w-full py-1.5 px-2.5 rounded-lg text-[11px] font-semibold bg-[#1C1C1C] hover:bg-[#252525] text-amber-400 hover:text-amber-300 border border-amber-500/20 flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSaving ? 'animate-spin' : ''}`} />
                          <span>Apply These Hymns to All 9 Novenas</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* 3. Vespers View */}
              {activeTab === 'vespers' && (
                <div className="p-3.5 rounded-xl bg-[#161616] border border-[#262626] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      Vespers (28th Sep 7:00 PM) Assignments
                    </span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                      තේවාධරයා (Tevadharaya / Choir Leader / Cantor)
                    </label>
                    <input
                      type="text"
                      list="choristers-list"
                      value={tevadharaya}
                      onChange={(e) => setTevadharaya(e.target.value)}
                      placeholder="Select or enter person from database"
                      className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333333] rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* 4. Feast Masses View */}
              {activeTab === 'feast-masses' && (
                <div className="p-3.5 rounded-xl bg-[#161616] border border-[#262626] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Church className="w-3.5 h-3.5 text-blue-400" />
                      Feast Masses (5.00 am, 6.30 am, 6 pm) Assignments
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-3 bg-[#0D0D0D] rounded-lg border border-[#242424]">
                      <div className="text-xs font-bold text-amber-300 mb-2">පෙ.ව. 5.00 දිව්‍ය පූජාව</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-neutral-400 mb-1">පිළිතුරු ගීය (Psalm)</label>
                          <input
                            type="text"
                            list="choristers-list"
                            value={mass5Psalm}
                            onChange={(e) => setMass5Psalm(e.target.value)}
                            placeholder="Psalm person"
                            className="w-full px-2 py-1 bg-[#141414] border border-[#333] rounded text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-neutral-400 mb-1">සුපුවත් ජයනද (Alleluia)</label>
                          <input
                            type="text"
                            list="choristers-list"
                            value={mass5Alleluia}
                            onChange={(e) => setMass5Alleluia(e.target.value)}
                            placeholder="Alleluia person"
                            className="w-full px-2 py-1 bg-[#141414] border border-[#333] rounded text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-[#0D0D0D] rounded-lg border border-[#242424]">
                      <div className="text-xs font-bold text-amber-300 mb-2">පෙ.ව. 6.30 දිව්‍ය පූජාව</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-neutral-400 mb-1">පිළිතුරු ගීය (Psalm)</label>
                          <input
                            type="text"
                            list="choristers-list"
                            value={mass630Psalm}
                            onChange={(e) => setMass630Psalm(e.target.value)}
                            placeholder="Psalm person"
                            className="w-full px-2 py-1 bg-[#141414] border border-[#333] rounded text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-neutral-400 mb-1">සුපුවත් ජයනද (Alleluia)</label>
                          <input
                            type="text"
                            list="choristers-list"
                            value={mass630Alleluia}
                            onChange={(e) => setMass630Alleluia(e.target.value)}
                            placeholder="Alleluia person"
                            className="w-full px-2 py-1 bg-[#141414] border border-[#333] rounded text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-[#0D0D0D] rounded-lg border border-[#242424]">
                      <div className="text-xs font-bold text-amber-300 mb-2">ප.ව. 6.00 දිව්‍ය පූජාව</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-neutral-400 mb-1">පිළිතුරු ගීය (Psalm)</label>
                          <input
                            type="text"
                            list="choristers-list"
                            value={mass6Psalm}
                            onChange={(e) => setMass6Psalm(e.target.value)}
                            placeholder="Psalm person"
                            className="w-full px-2 py-1 bg-[#141414] border border-[#333] rounded text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-neutral-400 mb-1">සුපුවත් ජයනද (Alleluia)</label>
                          <input
                            type="text"
                            list="choristers-list"
                            value={mass6Alleluia}
                            onChange={(e) => setMass6Alleluia(e.target.value)}
                            placeholder="Alleluia person"
                            className="w-full px-2 py-1 bg-[#141414] border border-[#333] rounded text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Feast High Mass View */}
              {activeTab === 'high-mass' && (
                <div className="p-3.5 rounded-xl bg-[#161616] border border-[#262626] space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Feast High Mass (8.00 am) Assignments & Hymns
                    </span>
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Organist</label>
                      <input
                        type="text"
                        list="choristers-list"
                        value={highOrganist}
                        onChange={(e) => setHighOrganist(e.target.value)}
                        placeholder="Organist name"
                        className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333] rounded-lg text-xs text-white font-semibold"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Psalm Duet 1</label>
                        <input
                          type="text"
                          list="choristers-list"
                          value={highPsalm1}
                          onChange={(e) => setHighPsalm1(e.target.value)}
                          placeholder="First singer"
                          className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333] rounded-lg text-xs text-white font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Psalm Duet 2</label>
                        <input
                          type="text"
                          list="choristers-list"
                          value={highPsalm2}
                          onChange={(e) => setHighPsalm2(e.target.value)}
                          placeholder="Second singer"
                          className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333] rounded-lg text-xs text-white font-semibold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-300 mb-1">Alleluia Person</label>
                      <input
                        type="text"
                        list="choristers-list"
                        value={highAlleluia}
                        onChange={(e) => setHighAlleluia(e.target.value)}
                        placeholder="Alleluia singer"
                        className="w-full px-2.5 py-1.5 bg-[#0D0D0D] border border-[#333] rounded-lg text-xs text-white font-semibold"
                      />
                    </div>

                    <div className="pt-2 border-t border-[#222] space-y-2.5">
                      <div className="text-[11px] font-bold text-amber-400">High Mass Hymns:</div>
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[10px] text-neutral-400">Entrance (E)</label>
                          <button
                            type="button"
                            onClick={() => openHymnSelector('high-entrance', 'High Mass Entrance (E)', 'Entrance')}
                            className="text-[9px] text-amber-400 hover:text-amber-300"
                          >
                            Browse Library
                          </button>
                        </div>
                        <HymnAutocompleteInput
                          value={highEntrance}
                          onChange={setHighEntrance}
                          liturgicalPart="Entrance"
                          placeholder="Type hymn number or title..."
                          theme="dark"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[10px] text-neutral-400">Offertory (O)</label>
                          <button
                            type="button"
                            onClick={() => openHymnSelector('high-offertory', 'High Mass Offertory (O)', 'Offertory')}
                            className="text-[9px] text-amber-400 hover:text-amber-300"
                          >
                            Browse Library
                          </button>
                        </div>
                        <HymnAutocompleteInput
                          value={highOffertory}
                          onChange={setHighOffertory}
                          liturgicalPart="Offertory"
                          placeholder="Type hymn number or title..."
                          theme="dark"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[10px] text-neutral-400">Communion (C)</label>
                          <button
                            type="button"
                            onClick={() => openHymnSelector('high-communion', 'High Mass Communion (C)', 'Communion')}
                            className="text-[9px] text-amber-400 hover:text-amber-300"
                          >
                            Browse Library
                          </button>
                        </div>
                        <HymnAutocompleteInput
                          value={highCommunion}
                          onChange={setHighCommunion}
                          liturgicalPart="Communion"
                          placeholder="Type hymn number or title..."
                          theme="dark"
                        />
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[10px] text-neutral-400">Final (F)</label>
                          <button
                            type="button"
                            onClick={() => openHymnSelector('high-final', 'High Mass Final (F)', 'Recessional')}
                            className="text-[9px] text-amber-400 hover:text-amber-300"
                          >
                            Browse Library
                          </button>
                        </div>
                        <HymnAutocompleteInput
                          value={highFinal}
                          onChange={setHighFinal}
                          liturgicalPart="Recessional"
                          placeholder="Type hymn number or title..."
                          theme="dark"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <datalist id="choristers-list">
                {choristers.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>

            {/* Right Column: Live WhatsApp Broadcast Preview */}
            <div className="p-4 sm:p-5 flex flex-col justify-between bg-[#0A0A0A] overflow-y-auto">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#222222]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      WhatsApp Live Preview
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!customMode) setCustomText(generatedText);
                      setCustomMode(!customMode);
                    }}
                    className="text-[11px] font-medium text-neutral-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="w-3 h-3" />
                    {customMode ? 'Back to Form' : 'Direct Edit'}
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-[#14231E] border border-emerald-500/20 text-emerald-100 font-sans shadow-inner">
                  {customMode ? (
                    <textarea
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      rows={17}
                      className="w-full p-2.5 bg-[#0C1714] border border-emerald-500/30 rounded-lg text-xs text-white font-mono leading-relaxed focus:outline-none focus:border-emerald-400"
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed select-all text-neutral-200">
                      {generatedText}
                    </pre>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#222222] mt-4 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    onClick={handleCopy}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      isCopied
                        ? 'bg-emerald-500 text-neutral-950 font-black shadow-lg shadow-emerald-500/30'
                        : 'bg-[#222222] hover:bg-[#2c2c2c] text-white border border-[#333333]'
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
                        <span>Copy WhatsApp Message</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSendWhatsApp}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/25"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Send on WhatsApp</span>
                  </button>
                </div>

                {typeof activeTab === 'number' && onSaveNovena && (
                  <button
                    type="button"
                    onClick={handleSaveToNovena}
                    disabled={isSaving}
                    className="w-full py-2 px-3 rounded-lg text-xs font-semibold bg-[#1C1C1C] hover:bg-[#252525] text-amber-300 hover:text-amber-200 border border-amber-500/30 flex items-center justify-center gap-2 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : `Save Day ${activeTab} Hymns & Roster to Database`}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hymn Selector Modal */}
      {hymnSelectorOpen && activeHymnTarget && (
        <HymnSelectorModal
          isOpen={hymnSelectorOpen}
          onClose={() => setHymnSelectorOpen(false)}
          onSelect={handleHymnChosen}
          title={`Select Hymn for ${activeHymnTarget.label}`}
          targetSlotLabel={activeHymnTarget.label}
          defaultLiturgicalPart={activeHymnTarget.liturgicalPart}
        />
      )}
    </>
  );
};
