import React, { useState } from 'react';
import { 
  Cake, 
  PartyPopper, 
  Sparkles, 
  Phone, 
  MessageCircle, 
  Copy, 
  Check, 
  Users, 
  X,
  HeartHandshake
} from 'lucide-react';
import { Chorister } from '../types';
import { calculateBirthdayAge, formatBirthdayGreeting } from '../utils/birthdayUtils';
import { getDriveDirectImageUrl } from '../utils/driveImage';

interface BirthdayCelebrationBannerProps {
  birthdayChoristers: Chorister[];
  currentDate: Date;
  onSelectChoristerTab?: () => void;
  onGenerateFlyer?: (chorister: Chorister) => void;
}

export const BirthdayCelebrationBanner: React.FC<BirthdayCelebrationBannerProps> = ({
  birthdayChoristers,
  currentDate,
  onSelectChoristerTab,
  onGenerateFlyer,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!birthdayChoristers || birthdayChoristers.length === 0 || isDismissed) {
    return null;
  }

  const handleCopyGreeting = (chorister: Chorister) => {
    const greeting = formatBirthdayGreeting(chorister, currentDate);
    navigator.clipboard.writeText(greeting);
    setCopiedId(chorister.id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  return (
    <div 
      id="birthday-celebration-banner"
      className="mb-5 relative overflow-hidden rounded-2xl border-2 border-amber-500/50 bg-gradient-to-r from-[#1E1708] via-[#1A1412] to-[#1E1708] p-4 sm:p-5 shadow-2xl shadow-amber-500/10 animate-in fade-in slide-in-from-top-3 duration-300"
    >
      {/* Subtle celebratory ambient glow */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-rose-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Dismiss Button */}
      <button
        id="dismiss-birthday-banner-btn"
        onClick={() => setIsDismissed(true)}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
        title="Dismiss celebration banner for this session"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header Row */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center text-neutral-950 shadow-lg shadow-amber-500/30 animate-bounce">
          <Cake className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-amber-300 tracking-tight flex items-center gap-1.5">
              <span>Today's Chorister Birthday Celebration!</span>
              <PartyPopper className="w-5 h-5 text-amber-400 inline" />
            </h3>
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Sparkles className="w-2.5 h-2.5" />
              {birthdayChoristers.length === 1 ? '1 Celebrant Today' : `${birthdayChoristers.length} Celebrants Today`}
            </span>
          </div>
          <p className="text-xs text-neutral-300">
            Let us pray for, celebrate, and send choir blessings to our members celebrating their special day today!
          </p>
        </div>
      </div>

      {/* Celebrant Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {birthdayChoristers.map((chorister) => {
          const age = calculateBirthdayAge(chorister.birthdate, currentDate);
          const cleanPhone = (chorister.phoneNumber || '').replace(/[^0-9+]/g, '');
          const isCopied = copiedId === chorister.id;
          const greetingText = formatBirthdayGreeting(chorister, currentDate);
          const directPhoto = chorister.photoUrl ? getDriveDirectImageUrl(chorister.photoUrl) : '';

          return (
            <div 
              key={chorister.id}
              id={`birthday-card-${chorister.id}`}
              className="bg-[#12100C]/80 border border-amber-500/30 rounded-xl p-3.5 flex flex-col justify-between hover:border-amber-400/60 transition-all backdrop-blur-sm"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {/* Celebrant Profile Picture with celebration ring */}
                  <div className="relative shrink-0">
                    {directPhoto ? (
                      <img
                        src={directPhoto}
                        alt={chorister.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover shadow-lg border-2 border-amber-400 ring-2 ring-amber-500/50"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                          const fallback = document.getElementById(`banner-avatar-fallback-${chorister.id}`);
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}

                    {/* Fallback initial avatar if no photo or photo fails */}
                    <div 
                      id={`banner-avatar-fallback-${chorister.id}`}
                      style={{ display: directPhoto ? 'none' : 'flex' }}
                      className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 text-neutral-950 font-black text-base items-center justify-center shadow-md ring-2 ring-amber-400/60"
                    >
                      {chorister.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="absolute -bottom-1 -right-1 bg-amber-400 text-neutral-950 p-1 rounded-full shadow-md">
                      <Cake className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm sm:text-base">
                        {chorister.name}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-neutral-950 shadow-sm flex items-center gap-1">
                        <Cake className="w-3 h-3" /> Birthday Today!
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-neutral-300 mt-0.5">
                      <span className="text-amber-300 font-semibold">{chorister.role}</span>
                      {age !== null && (
                        <span>• Turning <strong className="text-white font-bold">{age}</strong> years</span>
                      )}
                      {chorister.voiceNotes && (
                        <span className="text-neutral-400 hidden sm:inline">• {chorister.voiceNotes}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-500/20">
                {/* Generate Birthday Flyer Button */}
                {onGenerateFlyer && (
                  <button
                    id={`generate-flyer-${chorister.id}`}
                    onClick={() => onGenerateFlyer(chorister)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 text-xs font-black transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
                    title="Generate and download official face-aligned birthday flyer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Flyer</span>
                  </button>
                )}

                {/* WhatsApp Greeting Button */}
                {cleanPhone ? (
                  <a
                    id={`whatsapp-greeting-${chorister.id}`}
                    href={`https://wa.me/${cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(greetingText)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
                    title="Send pre-filled birthday greeting on WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Wish on WhatsApp</span>
                  </a>
                ) : null}

                {/* Call Button */}
                {chorister.phoneNumber ? (
                  <a
                    id={`call-celebrant-${chorister.id}`}
                    href={`tel:${chorister.phoneNumber}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#221C14] hover:bg-amber-500/20 text-neutral-200 hover:text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all"
                    title={`Call ${chorister.name}`}
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Call ({chorister.phoneNumber})</span>
                  </a>
                ) : null}

                {/* Copy Blessing Button */}
                <button
                  id={`copy-greeting-${chorister.id}`}
                  onClick={() => handleCopyGreeting(chorister)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#221C14] hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-semibold transition-all"
                  title="Copy Choir Birthday Greeting text to clipboard"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300 font-bold">Copied Blessing!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Copy Blessing</span>
                    </>
                  )}
                </button>

                {/* View in directory button */}
                {onSelectChoristerTab && (
                  <button
                    id={`view-in-dir-${chorister.id}`}
                    onClick={onSelectChoristerTab}
                    className="ml-auto text-xs text-neutral-400 hover:text-amber-300 flex items-center gap-1 py-1"
                    title="View full record in Manage Choristers directory"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">View Profile</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
