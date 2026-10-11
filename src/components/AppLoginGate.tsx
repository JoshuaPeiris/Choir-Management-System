import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Music2, 
  Check, 
  CheckCircle2,
  AlertCircle, 
  ArrowRight,
  Piano,
  Eye,
  EyeOff,
  Smartphone,
  Download,
  Sparkles,
  Users
} from 'lucide-react';
import { CommitteeMember, Chorister } from '../types';
import { getDriveDirectImageUrl, CHOIR_LOGO_URL } from '../utils/driveImage';
import { InstallAppModal } from './InstallAppModal';

interface AppLoginGateProps {
  committeeMembers: CommitteeMember[];
  choristers: Chorister[];
  onLoginSuccess: (member: CommitteeMember, chorister?: Chorister) => void;
}

export const AppLoginGate: React.FC<AppLoginGateProps> = ({
  committeeMembers,
  choristers,
  onLoginSuccess,
}) => {
  const coreCommittee = committeeMembers.filter((m) => m.role !== 'Advisor');
  const advisors = committeeMembers.filter((m) => m.role === 'Advisor');

  const [activeCategory, setActiveCategory] = useState<'committee' | 'advisors'>('committee');

  // Currently selected account to authenticate - None selected by default
  const [selectedId, setSelectedId] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<{
    member: CommitteeMember;
    chorister?: Chorister;
  } | null>(null);

  // Find currently selected member (null if none selected yet)
  const selectedMember = selectedId ? committeeMembers.find((m) => m.id === selectedId) || null : null;

  const selectedName = selectedMember ? selectedMember.name : '';
  const selectedRole = selectedMember ? selectedMember.role : '';
  const expectedPin = selectedMember?.pin || '2026';
  const avatarColor = selectedMember?.avatarColor || 'bg-amber-600';

  const handleSelectMember = (id: string) => {
    setSelectedId(id);
    setPinInput('');
    setErrorMessage('');
  };

  const handleKeypadPress = (digit: string) => {
    if (!selectedMember) {
      setErrorMessage('Please select your account first');
      return;
    }
    if (pinInput.length < 6) {
      const nextPin = pinInput + digit;
      setPinInput(nextPin);
      setErrorMessage('');
      if (nextPin.length === expectedPin.length) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMessage('');
  };

  const handleClear = () => {
    setPinInput('');
    setErrorMessage('');
  };

  const verifyPin = async (pinToTest: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: selectedId, pin: pinToTest }),
      });

      if (res.ok) {
        const data = await res.json();
        const authedMember: CommitteeMember = data.member || selectedMember;
        const authedChorister = data.chorister || choristers.find((c) => c.id === authedMember.choristerId || c.name === authedMember.name);
        setErrorMessage('');
        setAuthenticatedUser({ member: authedMember, chorister: authedChorister });
        setIsLoading(false);
      } else {
        // Fallback local check
        if (pinToTest === expectedPin) {
          setErrorMessage('');
          const authedChorister = choristers.find((c) => c.id === selectedMember.choristerId || c.name === selectedMember.name);
          setAuthenticatedUser({ member: selectedMember, chorister: authedChorister });
          setIsLoading(false);
        } else {
          setErrorMessage('Incorrect PIN. Please try again.');
          setIsLoading(false);
        }
      }
    } catch {
      // Local fallback
      if (pinToTest === expectedPin) {
        setErrorMessage('');
        const authedChorister = choristers.find((c) => c.id === selectedMember.choristerId || c.name === selectedMember.name);
        setAuthenticatedUser({ member: selectedMember, chorister: authedChorister });
        setIsLoading(false);
      } else {
        setErrorMessage('Incorrect PIN. Please try again.');
        setIsLoading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim()) {
      setErrorMessage('Please enter your 4-digit PIN');
      return;
    }
    verifyPin(pinInput);
  };

  // Profile picture view after successful PIN login before entering choir portal
  if (authenticatedUser) {
    const member = authenticatedUser.member;
    const photo = member.photoUrl ? getDriveDirectImageUrl(member.photoUrl) : null;
    const isAdvisor = member.role === 'Advisor';
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
        {/* Sacred background ambient glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md relative z-10 flex flex-col items-center">
          {/* Church Crest & Header */}
          <div className="text-center mb-6 space-y-1">
            <div className="inline-flex items-center justify-center relative mb-2">
              <img 
                src={CHOIR_LOGO_URL} 
                alt="St. Cecilia's Choir Crest" 
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-full object-cover ring-2 ring-amber-500/70 shadow-xl shadow-amber-500/20 bg-black"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              St. Cecilia&apos;s Choir Portal
            </h1>
            <p className="text-xs text-amber-400 font-medium">
              St. Michael&apos;s Church Koralawella
            </p>
          </div>

          {/* Profile Card before enter choir portal */}
          <div className="w-full bg-[#121212] border border-[#262626] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Verified Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 mb-6">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Identity Verified • Session Authorized</span>
            </div>

            {/* Profile Picture */}
            <div className="relative mb-5 group">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-tr from-amber-500 to-emerald-500 opacity-50 blur-md group-hover:opacity-75 transition duration-300" />
              {photo ? (
                <img
                  src={photo}
                  alt={member.name}
                  referrerPolicy="no-referrer"
                  className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl object-cover relative z-10 border-2 border-white/20 shadow-2xl bg-black"
                />
              ) : (
                <div className={`w-32 h-32 sm:w-36 sm:h-36 rounded-2xl ${member.avatarColor || 'bg-amber-600'} text-white font-black text-4xl flex items-center justify-center relative z-10 border-2 border-white/20 shadow-2xl`}>
                  {member.name.charAt(0)}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 z-20 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-[#121212] shadow-lg">
                <Check className="w-5 h-5 stroke-[3]" />
              </div>
            </div>

            {/* Member Details */}
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-1">
              {member.name}
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-6">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAdvisor ? 'Choir Advisor' : member.role}</span>
            </div>

            {/* Enter Choir Portal Action */}
            <button
              type="button"
              id="enter-choir-portal-btn"
              onClick={() => onLoginSuccess(authenticatedUser.member, authenticatedUser.chorister)}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-black font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Enter Choir Portal</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Switch Account Option */}
            <button
              type="button"
              id="switch-account-login-btn"
              onClick={() => {
                setAuthenticatedUser(null);
                setSelectedId('');
                setPinInput('');
                setErrorMessage('');
              }}
              className="mt-4 text-xs text-neutral-400 hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              Switch to another account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Sacred background ambient glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl relative z-10 flex flex-col items-center">
        {/* Church Crest & Header */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center justify-center relative mb-2 group">
            <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl group-hover:bg-amber-500/30 transition-all" />
            <img 
              src={CHOIR_LOGO_URL} 
              alt="St. Cecilia's Choir Crest" 
              referrerPolicy="no-referrer"
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-amber-500/70 shadow-2xl shadow-amber-500/30 relative z-10 bg-black"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Choir Management System
          </h1>
          <p className="text-xs sm:text-sm text-amber-400/90 font-medium">
            St. Cecilia&apos;s Choir • St. Michael&apos;s Church Koralawella
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-[#161616] text-neutral-400 border border-[#262626]">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Choir Committee Authentication</span>
            </div>
          </div>
        </div>

        {/* Main Authentication Grid */}
        <div className="w-full bg-[#121212] border border-[#242424] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Account Selection (6 cols) */}
          <div className="lg:col-span-6 p-6 border-b lg:border-b-0 lg:border-r border-[#222222] bg-[#0E0E0E] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                1. Select Account
              </h2>
              {/* Category tabs */}
              <div className="flex items-center gap-1 bg-[#161616] p-0.5 rounded-lg border border-[#262626]">
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('committee');
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                    activeCategory === 'committee'
                      ? 'bg-[#262626] text-amber-300'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Committee ({coreCommittee.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCategory('advisors');
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all flex items-center gap-1 ${
                    activeCategory === 'advisors'
                      ? 'bg-[#262626] text-emerald-300'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Advisors ({advisors.length})</span>
                </button>
              </div>
            </div>

            {/* List of accounts */}
            <div className="space-y-2 overflow-y-auto max-h-80 pr-1 flex-1">
              {activeCategory === 'committee' ? (
                coreCommittee.map((member) => {
                  const isSelected = selectedId === member.id;
                  const isPresident = member.role === 'President';
                  return (
                    <div
                      key={member.id}
                      id={`login-select-${member.id}`}
                      onClick={() => handleSelectMember(member.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                          : 'border-[#202020] bg-[#141414] hover:border-[#333333] hover:bg-[#181818]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {member.photoUrl ? (
                          <img
                            src={getDriveDirectImageUrl(member.photoUrl)}
                            alt={member.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-xl object-cover shadow-md"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-xl ${member.avatarColor} text-white font-bold text-sm flex items-center justify-center shadow-md`}>
                            {member.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-1.5">
                            <span>{member.name}</span>
                            {isPresident && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Lead
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                            <ShieldCheck className="w-3 h-3 text-amber-400" />
                            <span>{member.role}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-neutral-500 font-medium">
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                advisors.map((advisor) => {
                  const isSelected = selectedId === advisor.id;
                  return (
                    <div
                      key={advisor.id}
                      id={`login-select-${advisor.id}`}
                      onClick={() => handleSelectMember(advisor.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                          : 'border-[#202020] bg-[#141414] hover:border-[#333333] hover:bg-[#181818]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {advisor.photoUrl ? (
                          <img
                            src={getDriveDirectImageUrl(advisor.photoUrl)}
                            alt={advisor.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-xl object-cover shadow-md"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-xl ${advisor.avatarColor} text-white font-bold text-sm flex items-center justify-center shadow-md`}>
                            {advisor.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-sm text-white">
                            {advisor.name}
                          </div>
                          <div className="text-xs text-emerald-300/80 flex items-center gap-1.5">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            <span>Choir Advisor</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-neutral-500 font-medium">
                          {isSelected ? 'Selected' : 'Select'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#222222] text-[11px] text-neutral-400 flex items-center justify-between">
              <span>Security PIN required</span>
              <span className="text-amber-400 font-medium">St. Cecilia&apos;s Choir</span>
            </div>
          </div>

          {/* Right Column: PIN Input & Keypad (6 cols) */}
          <div className="lg:col-span-6 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  2. Enter Security PIN
                </h2>
              </div>

              {/* Selected Officer Preview Banner */}
              {selectedMember ? (
                <div className="p-3.5 rounded-2xl bg-[#171717] border border-[#2A2A2A] flex items-center gap-3.5 mb-5 animate-in fade-in duration-200">
                  {selectedMember.photoUrl ? (
                    <img
                      src={getDriveDirectImageUrl(selectedMember.photoUrl)}
                      alt={selectedName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-xl object-cover shadow-md ring-2 ring-amber-500/50"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-xl ${avatarColor} text-white font-black text-base flex items-center justify-center shadow-md`}>
                      {selectedName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm sm:text-base truncate">
                      {selectedName}
                    </div>
                    <div className="text-xs text-amber-400/90 font-medium mt-0.5 truncate">
                      {selectedRole}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Ready
                  </span>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#141414] border border-dashed border-[#333333] flex items-center gap-3.5 mb-5 text-neutral-400">
                  <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-neutral-500">
                    <Users className="w-6 h-6 text-amber-400/70" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">
                      Select Your Account
                    </div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      Tap your name from the list on the left to enter PIN
                    </div>
                  </div>
                </div>
              )}

              {/* PIN Display & Masked Dots */}
              <div className="space-y-3">
                <form onSubmit={handleSubmit}>
                  <div className="relative">
                    <input
                      id="pin-login-input"
                      type={showPin ? 'text' : 'password'}
                      maxLength={6}
                      disabled={!selectedMember}
                      value={pinInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPinInput(val);
                        setErrorMessage('');
                        if (val.length === expectedPin.length) {
                          verifyPin(val);
                        }
                      }}
                      placeholder={selectedMember ? '••••' : 'Select Account'}
                      className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 px-4 bg-[#181818] border-2 border-[#333333] focus:border-amber-500 rounded-2xl text-white placeholder:text-neutral-600 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      autoFocus={!!selectedMember}
                    />
                    <button
                      type="button"
                      disabled={!selectedMember}
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </form>

                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              {/* Virtual On-Screen Keypad */}
              <div className="mt-4 grid grid-cols-3 gap-2 max-w-xs mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    id={`keypad-${k}`}
                    disabled={!selectedMember}
                    onClick={() => {
                      if (k === 'C') handleClear();
                      else if (k === '⌫') handleBackspace();
                      else handleKeypadPress(k);
                    }}
                    className={`py-3 rounded-xl text-base font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                      k === 'C'
                        ? 'bg-neutral-800/60 text-neutral-400 hover:bg-neutral-700 hover:text-white border border-neutral-700'
                        : k === '⌫'
                          ? 'bg-neutral-800/60 text-neutral-400 hover:bg-neutral-700 hover:text-white border border-neutral-700'
                          : 'bg-[#1C1C1C] text-white hover:bg-[#282828] border border-[#2E2E2E]'
                    }`}
                  >
                    {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="mt-6">
              <button
                type="button"
                id="login-submit-btn"
                disabled={isLoading || !selectedMember || pinInput.length === 0}
                onClick={() => verifyPin(pinInput)}
                className="w-full py-3.5 px-6 rounded-2xl text-sm font-bold bg-amber-500 hover:bg-amber-400 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span>Verifying PIN...</span>
                ) : !selectedMember ? (
                  <span>Select An Account First</span>
                ) : (
                  <>
                    <span>Unlock Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Universal Home Screen Installation Modal */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};
