import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  UserCheck, 
  Check, 
  X, 
  AlertCircle,
  Crown
} from 'lucide-react';
import { CommitteeMember } from '../types';
import { getDriveDirectImageUrl } from '../utils/driveImage';

interface CommitteeGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  committeeMembers: CommitteeMember[];
  activeMember: CommitteeMember;
  onSelectMember: (member: CommitteeMember) => void;
}

export const CommitteeGateModal: React.FC<CommitteeGateModalProps> = ({
  isOpen,
  onClose,
  committeeMembers,
  activeMember,
  onSelectMember,
}) => {
  const [selectedId, setSelectedId] = useState<string>(activeMember.id);
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMember = committeeMembers.find((m) => m.id === selectedId);
    if (!targetMember) return;

    if (pinInput.trim() !== targetMember.pin) {
      setErrorMsg('Incorrect PIN. Please try again.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg(`Authenticated as ${targetMember.name} (${targetMember.role})`);
    setTimeout(() => {
      onSelectMember(targetMember);
      setSuccessMsg('');
      setPinInput('');
      onClose();
    }, 400);
  };

  const handleSelect = (member: CommitteeMember) => {
    setSelectedId(member.id);
    setPinInput('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141414] w-full max-w-md rounded-3xl border border-[#2A2A2A] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-[#0D0D0D] text-white p-6 border-b border-[#222222]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">
                  Choir Committee Authentication
                </h3>
                <p className="text-xs text-neutral-400">
                  Choir Management System
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-neutral-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-neutral-400 leading-relaxed">
            Select your profile and enter your private security PIN to authenticate your committee session.
          </p>

          {/* Member Selection List */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Select Committee Member
            </label>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {committeeMembers.map((member) => {
                const isSelected = selectedId === member.id;
                const isPresident = member.role === 'President';

                return (
                  <div
                    key={member.id}
                    id={`committee-auth-${member.id}`}
                    onClick={() => handleSelect(member)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500'
                        : 'border-[#242424] hover:border-[#333333] hover:bg-[#1A1A1A]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {member.photoUrl ? (
                        <img
                          src={getDriveDirectImageUrl(member.photoUrl)}
                          alt={member.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-amber-500/40 shadow-sm"
                        />
                      ) : (
                        <div className={`w-8 h-8 rounded-full ${member.avatarColor} text-white font-bold text-xs flex items-center justify-center`}>
                          {member.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          {member.name}
                          {isPresident && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {member.role}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-neutral-500">
                        {isSelected ? 'Selected' : 'Select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSwitch} className="space-y-4 pt-2 border-t border-[#222222]">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Private Security PIN
                </label>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="Enter 4-digit PIN"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-[#181818] border border-[#2E2E2E] rounded-xl focus:ring-1 focus:ring-amber-500 text-white placeholder:text-neutral-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-neutral-400 hover:text-white hover:bg-[#202020] rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20"
              >
                Authenticate &amp; Enter
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
