import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Star, 
  KeyRound, 
  Lock, 
  X, 
  ArrowRight,
  Piano,
  Edit3,
  Save,
  Eye,
  EyeOff,
  BookOpen,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  Award,
  RotateCcw,
  Clock,
  Smartphone,
  Bell,
  Volume2,
  Zap,
  Download,
  Share
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { InstallAppModal } from './InstallAppModal';
import { CommitteeMember, Chorister } from '../types';
import { getVoiceRatingDetails, PARISH_SUNDAY_MASSES } from './ChoristersDatabase';
import { 
  getRoleResponsibility, 
  getRoleKeyPoints, 
  ALL_OFFICIAL_RESPONSIBILITIES 
} from '../utils/roleResponsibilities';
import { 
  getDriveDirectImageUrl, 
  setChoirLogoUrl, 
  setLogoCentered, 
  getLogoCentered,
  getLogoImageScale,
  setLogoImageScale,
  getLogoImageOffsetX,
  setLogoImageOffsetX,
  getLogoImageOffsetY,
  setLogoImageOffsetY,
  getLogoFitMode,
  setLogoFitMode,
  LogoFitMode,
  DEFAULT_CHOIR_LOGO_DRIVE 
} from '../utils/driveImage';
import { calculateCurrentAge } from '../utils/birthdayUtils';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: CommitteeMember;
  choristerProfile?: Chorister;
  onLockSession: () => void;
  onSwitchAccount: () => void;
  onSaveProfile?: (updatedMember: CommitteeMember, choristerData?: Partial<Chorister>) => Promise<void> | void;
}

const AVATAR_COLORS = [
  { label: 'Amber Gold', value: 'bg-amber-600', ring: 'ring-amber-500' },
  { label: 'Royal Indigo', value: 'bg-indigo-600', ring: 'ring-indigo-500' },
  { label: 'Deep Teal', value: 'bg-teal-600', ring: 'ring-teal-500' },
  { label: 'Classic Blue', value: 'bg-blue-600', ring: 'ring-blue-500' },
  { label: 'Noble Purple', value: 'bg-purple-600', ring: 'ring-purple-500' },
  { label: 'Emerald Green', value: 'bg-emerald-600', ring: 'ring-emerald-500' },
  { label: 'Rose Wine', value: 'bg-rose-600', ring: 'ring-rose-500' },
  { label: 'Charcoal Slate', value: 'bg-slate-700', ring: 'ring-slate-400' },
];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  member,
  choristerProfile,
  onLockSession,
  onSwitchAccount,
  onSaveProfile,
}) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showCharterDrawer, setShowCharterDrawer] = useState<boolean>(false);
  const [showPinInView, setShowPinInView] = useState<boolean>(false);
  const [showPinInEdit, setShowPinInEdit] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Editable Form State
  const [name, setName] = useState<string>(member.name);
  const [phone, setPhone] = useState<string>(member.phone || '');
  const [email, setEmail] = useState<string>(member.email || '');
  const [pin, setPin] = useState<string>(member.pin || '');
  const [confirmPin, setConfirmPin] = useState<string>(member.pin || '');
  const [avatarColor, setAvatarColor] = useState<string>(member.avatarColor || 'bg-amber-600');
  
  // Optional chorister fields
  const [photoUrl, setPhotoUrl] = useState<string>(member.photoUrl || choristerProfile?.photoUrl || '');
  const [address, setAddress] = useState<string>(choristerProfile?.address || '');
  const [birthdate, setBirthdate] = useState<string>(choristerProfile?.birthdate || '');
  const [age, setAge] = useState<string>(choristerProfile?.age ? String(choristerProfile.age) : '');
  const [sundayMassPreference, setSundayMassPreference] = useState<string>(choristerProfile?.sundayMassPreference || '');
  const [weeklyMassPreference, setWeeklyMassPreference] = useState<string>(choristerProfile?.weeklyMassPreference || '');

  // Logo Customizer State
  const [logoDriveLink, setLogoDriveLink] = useState<string>(() => localStorage.getItem('st_cecilia_choir_logo_url') || DEFAULT_CHOIR_LOGO_DRIVE);
  const [isLogoCenteredState, setIsLogoCenteredState] = useState<boolean>(() => getLogoCentered());
  const [logoImageScaleState, setLogoImageScaleState] = useState<number>(() => getLogoImageScale());
  const [logoOffsetXState, setLogoOffsetXState] = useState<number>(() => getLogoImageOffsetX());
  const [logoOffsetYState, setLogoOffsetYState] = useState<number>(() => getLogoImageOffsetY());
  const [logoFitModeState, setLogoFitModeState] = useState<LogoFitMode>(() => getLogoFitMode());
  const [logoSaveSuccess, setLogoSaveSuccess] = useState<boolean>(false);

  // 1-Tap Phone Install & Master Permissions State
  const {
    isInstalled,
    isIOS,
    isStandalone,
    canPromptDirectly,
    installApp
  } = usePWAInstall();

  const [notifPermission, setNotifPermission] = useState<string>(() => {
    return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
  });
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
  const [isPowerProcessing, setIsPowerProcessing] = useState<boolean>(false);
  const [powerFeedback, setPowerFeedback] = useState<string | null>(null);
  const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  const handleMasterInstallAndAllPermissions = async () => {
    setIsPowerProcessing(true);
    setPowerFeedback(null);

    // 1. Audio Permission & Harmonic Cathedral Chime (immediately satisfies browser user-gesture policy)
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        const now = ctx.currentTime;
        [523.25, 659.25, 783.99].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + i * 0.09);
          gain.gain.setValueAtTime(0.001, now + i * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.2, now + i * 0.09 + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.85);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.09);
          osc.stop(now + i * 0.09 + 0.9);
        });
        setAudioUnlocked(true);
      }
    } catch (e) {
      console.warn('Audio permission unlock issue:', e);
    }

    // 2. Safe Notification Permissions (Handles Promise, Callback, and unsupported environments)
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          setNotifPermission('granted');
        } else {
          const permPromise = Notification.requestPermission();
          if (permPromise && typeof permPromise.then === 'function') {
            const res = await Promise.race([
              permPromise,
              new Promise<string>((r) => setTimeout(() => r(Notification.permission || 'default'), 2000))
            ]);
            setNotifPermission(res);
          } else {
            Notification.requestPermission((res) => {
              setNotifPermission(res || 'default');
            });
          }
        }
      } catch (e) {
        console.warn('Notification permission issue:', e);
      }
    }

    // 3. Physical Vibration Feedback
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch {}

    // 4. Offline Persistence Permission
    try {
      if (navigator.storage && navigator.storage.persist) {
        await navigator.storage.persist();
      }
    } catch {}

    // 5. Try native PWA install prompt first
    let directPromptTriggered = false;
    if (canPromptDirectly) {
      try {
        const outcome = await installApp();
        if (outcome) {
          directPromptTriggered = true;
        }
      } catch (e) {
        console.warn('Direct install prompt issue:', e);
      }
    }

    setIsPowerProcessing(false);

    // Open the InstallAppModal to provide the universal visual guide and direct web link with the Logo!
    setIsInstallModalOpen(true);
    if (directPromptTriggered || isInstalled || isStandalone) {
      setPowerFeedback('✅ App installed to home screen and all system permissions (Notifications, Audio Chimes, Offline Sync) granted!');
    } else {
      setPowerFeedback('⚡ All permissions allowed! The Home Screen install guide is open with the official Choir Logo.');
    }
  };

  // Reset form when member changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setName(member.name);
      setPhone(member.phone || '');
      setEmail(member.email || '');
      setPin(member.pin || '');
      setConfirmPin(member.pin || '');
      setAvatarColor(member.avatarColor || 'bg-amber-600');
      setPhotoUrl(member.photoUrl || choristerProfile?.photoUrl || '');
      setAddress(choristerProfile?.address || '');
      setBirthdate(choristerProfile?.birthdate || '');
      setAge(choristerProfile?.age ? String(choristerProfile.age) : '');
      setSundayMassPreference(choristerProfile?.sundayMassPreference || '');
      setWeeklyMassPreference(choristerProfile?.weeklyMassPreference || '');
      setIsEditing(false);
      setErrorMessage('');
      setSaveSuccess(false);
    }
  }, [isOpen, member, choristerProfile]);

  if (!isOpen) return null;

  const isOrganist = member.role === ('Organist' as any) || choristerProfile?.role === 'Organist' || member.name.toLowerCase().includes('dinoli');
  const isPresident = member.role === 'President' || member.name === 'Joshua Peiris';
  const voiceRating = choristerProfile?.voiceRating || (isOrganist && member.name.toLowerCase().includes('dinoli') ? 9 : undefined);
  const voiceNotes = choristerProfile?.voiceNotes || (isOrganist ? 'Parish Organist & Vocal Accompanist' : undefined);
  const ratingDetails = getVoiceRatingDetails(voiceRating);

  // Official Constitutional Responsibilities (verbatim)
  const roleResponsibilityText = getRoleResponsibility(member.role);
  const roleKeyPoints = getRoleKeyPoints(member.role);

  const handleStartEditing = () => {
    setName(member.name);
    setPhone(member.phone || '');
    setEmail(member.email || '');
    setPin(member.pin || '');
    setConfirmPin(member.pin || '');
    setAvatarColor(member.avatarColor || 'bg-amber-600');
    setPhotoUrl(member.photoUrl || choristerProfile?.photoUrl || '');
    setAddress(choristerProfile?.address || '');
    setBirthdate(choristerProfile?.birthdate || '');
    setAge(choristerProfile?.age ? String(choristerProfile.age) : '');
    setSundayMassPreference(choristerProfile?.sundayMassPreference || '');
    setWeeklyMassPreference(choristerProfile?.weeklyMassPreference || '');
    setErrorMessage('');
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setName(member.name);
    setPhone(member.phone || '');
    setEmail(member.email || '');
    setPin(member.pin || '');
    setConfirmPin(member.pin || '');
    setAvatarColor(member.avatarColor || 'bg-amber-600');
    setPhotoUrl(member.photoUrl || choristerProfile?.photoUrl || '');
    setAddress(choristerProfile?.address || '');
    setBirthdate(choristerProfile?.birthdate || '');
    setAge(choristerProfile?.age ? String(choristerProfile.age) : '');
    setSundayMassPreference(choristerProfile?.sundayMassPreference || '');
    setWeeklyMassPreference(choristerProfile?.weeklyMassPreference || '');
    setErrorMessage('');
    setIsEditing(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!name.trim()) {
      setErrorMessage('Full name cannot be empty.');
      return;
    }
    if (!pin.trim() || pin.length < 4) {
      setErrorMessage('Security PIN must be at least 4 digits.');
      return;
    }
    if (pin !== confirmPin) {
      setErrorMessage('Security PIN and Confirm PIN do not match.');
      return;
    }

    setIsSaving(true);
    try {
      const updatedMember: CommitteeMember = {
        ...member,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        pin: pin.trim(),
        avatarColor,
        photoUrl: photoUrl.trim(),
      };

      const choristerUpdates: Partial<Chorister> = {
        name: name.trim(),
        phoneNumber: phone.trim(),
        pin: pin.trim(),
        photoUrl: photoUrl.trim(),
        address: address.trim(),
        birthdate,
        age: age ? parseInt(age, 10) : undefined,
        sundayMassPreference: sundayMassPreference.trim(),
        weeklyMassPreference: weeklyMassPreference.trim(),
      };

      if (onSaveProfile) {
        await onSaveProfile(updatedMember, choristerUpdates);
      } else {
        // Fallback direct API call
        await fetch(`/api/profile/${member.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profileData: {
              ...updatedMember,
              ...choristerUpdates,
            },
            actor: {
              name: member.name,
              role: member.role,
            },
          }),
        });
      }

      setIsSaving(false);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setIsSaving(false);
      setErrorMessage(err?.message || 'Failed to save profile changes. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#131313] w-full max-w-2xl rounded-3xl border border-[#2B2B2B] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#171717] via-[#1A1A1A] to-[#141414] p-6 border-b border-[#242424] relative">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {(isEditing ? photoUrl : (member.photoUrl || choristerProfile?.photoUrl)) ? (
                <img
                  src={getDriveDirectImageUrl(isEditing ? photoUrl : (member.photoUrl || choristerProfile?.photoUrl))}
                  alt={isEditing ? name : member.name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-2xl object-cover shadow-xl shadow-black/50 border border-white/20 ring-2 ring-amber-500/40"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    const raw = isEditing ? photoUrl : (member.photoUrl || choristerProfile?.photoUrl);
                    if (!target.src.includes('/api/image-proxy') && raw) {
                      target.src = `/api/image-proxy?url=${encodeURIComponent(raw)}`;
                    } else {
                      target.style.display = 'none';
                    }
                  }}
                />
              ) : (
                <div className={`w-16 h-16 rounded-2xl ${isEditing ? avatarColor : member.avatarColor} text-white font-black text-2xl flex items-center justify-center shadow-xl shadow-black/50 border border-white/20 transition-all duration-300`}>
                  {(isEditing ? name : member.name).charAt(0) || 'M'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-xl text-white tracking-tight">
                    {isEditing ? (name || 'Officer Profile') : member.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified PIN Session
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>{member.role}</span>
                  </span>
                  {isOrganist && (
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                      <Piano className="w-3.5 h-3.5 text-purple-400" />
                      <span>Appointed Parish Organist</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  id="edit-profile-btn"
                  onClick={handleStartEditing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors shadow-sm"
                  title="Edit personal profile details"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
              )}
              <button
                id="close-profile-modal-btn"
                onClick={onClose}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-[#222222] transition-colors"
                title="Close Profile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Success Banner */}
        {saveSuccess && (
          <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-emerald-300 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Profile details updated and synchronized with church database successfully.</span>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-rose-500/15 border-b border-rose-500/30 px-6 py-2.5 flex items-center gap-2 text-xs font-semibold text-rose-300 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">

          {/* ======================= EDIT MODE FORM ======================= */}
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="bg-[#181818] p-5 rounded-2xl border border-[#2B2B2B] space-y-4">
                <div className="flex items-center justify-between border-b border-[#282828] pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile Credentials</span>
                  </span>
                  <span className="text-[11px] text-neutral-400">Official Society Registry</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                      Full Name <span className="text-amber-400">*</span>
                    </label>
                    <input
                      id="profile-edit-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="e.g. Joshua Peiris"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#101010] border border-[#333333] text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                      Phone Number <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        id="profile-edit-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+94 77 123 4567"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#101010] border border-[#333333] text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Official Email */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                      Official Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        id="profile-edit-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="officer@stmichaels.org"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#101010] border border-[#333333] text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Security PIN */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1 flex items-center justify-between">
                      <span>4-Digit Security PIN <span className="text-amber-400">*</span></span>
                      <button
                        type="button"
                        onClick={() => setShowPinInEdit(!showPinInEdit)}
                        className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
                      >
                        {showPinInEdit ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showPinInEdit ? 'Hide' : 'Reveal'}</span>
                      </button>
                    </label>
                    <div className="relative">
                      <KeyRound className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        id="profile-edit-pin"
                        type={showPinInEdit ? 'text' : 'password'}
                        maxLength={6}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        required
                        placeholder="••••"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#101010] border border-[#333333] text-white font-mono tracking-widest text-xs focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Confirm PIN */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                      Confirm Security PIN <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        id="profile-edit-confirm-pin"
                        type={showPinInEdit ? 'text' : 'password'}
                        maxLength={6}
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                        required
                        placeholder="••••"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#101010] border border-[#333333] text-white font-mono tracking-widest text-xs focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Avatar Theme Color */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-neutral-300 mb-2">
                      Official Avatar Color Theme
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {AVATAR_COLORS.map((col) => (
                        <button
                          key={col.value}
                          type="button"
                          onClick={() => setAvatarColor(col.value)}
                          className={`w-8 h-8 rounded-xl ${col.value} flex items-center justify-center transition-all ${
                            avatarColor === col.value 
                              ? 'ring-2 ring-white scale-110 shadow-lg' 
                              : 'opacity-70 hover:opacity-100'
                          }`}
                          title={col.label}
                        >
                          {avatarColor === col.value && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Address & Residence (if applicable) */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                      Home Address / Parish Ward (Optional)
                    </label>
                    <div className="relative">
                      <MapPin className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        id="profile-edit-address"
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="e.g. 45/2 Koralawella, Moratuwa"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#101010] border border-[#333333] text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Birthdate & Age */}
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                      Date of Birth (Optional)
                    </label>
                    <div className="relative">
                      <Calendar className="w-3.5 h-3.5 text-neutral-400 absolute left-3.5 top-3" />
                      <input
                        id="profile-edit-birthdate"
                        type="date"
                        value={birthdate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBirthdate(val);
                          const calc = calculateCurrentAge(val);
                          if (calc !== null) {
                            setAge(String(calc));
                          }
                        }}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#101010] border border-[#333333] text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                      Age (Optional)
                    </label>
                    <input
                      id="profile-edit-age"
                      type="number"
                      min={8}
                      max={95}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 24"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#101010] border border-[#333333] text-white text-xs focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Sunday Mass & Weekly Mass Preference Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Sunday Mass Preference</span>
                      </span>
                    </label>
                    <select
                      id="profile-edit-sunday-mass"
                      value={sundayMassPreference}
                      onChange={(e) => setSundayMassPreference(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#101010] border border-[#333333] text-white text-xs font-medium focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="">-- Select Sunday Mass --</option>
                      {PARISH_SUNDAY_MASSES.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                      {sundayMassPreference &&
                        !PARISH_SUNDAY_MASSES.includes(sundayMassPreference) && (
                          <option value={sundayMassPreference}>
                            {sundayMassPreference}
                          </option>
                        )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-neutral-300 mb-1 flex items-center gap-1.5 text-purple-400">
                      <span>Weekly Mass (Optional)</span>
                    </label>
                    <input
                      id="profile-edit-weekly-mass"
                      type="text"
                      list="profile-weekly-mass-options"
                      placeholder="e.g. Thursday Novena & Mass - 6.00 pm"
                      value={weeklyMassPreference}
                      onChange={(e) => setWeeklyMassPreference(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#101010] border border-[#333333] text-white text-xs focus:outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-600"
                    />
                    <datalist id="profile-weekly-mass-options">
                      <option value="Thursday Novena & Mass - 6.00 pm" />
                      <option value="Tuesday Mass - 6.00 pm" />
                      <option value="First Friday Adoration & Mass - 6.00 pm" />
                      <option value="Saturday - 7.00 am (English)" />
                    </datalist>
                  </div>
                </div>

                {/* Photo Link Field with Live Google Drive Preview */}
                <div className="pt-1">
                  <label className="block text-[11px] font-bold text-neutral-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Profile Photo Link (Google Drive / Web URL)</span>
                    </span>
                    {photoUrl && (
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        {photoUrl.includes('drive.google.com') || photoUrl.includes('googleusercontent.com')
                          ? 'Google Drive'
                          : 'Web Image'}
                      </span>
                    )}
                  </label>
                  <input
                    id="profile-edit-photo-url"
                    type="text"
                    placeholder="Paste Google Drive sharing link or image URL"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#101010] border border-[#333333] text-white text-xs focus:outline-none focus:border-amber-500 transition-colors placeholder:text-neutral-600"
                  />
                  {photoUrl && (
                    <div className="mt-2 flex items-center gap-3 p-2.5 rounded-xl bg-[#101010] border border-[#2B2B2B]">
                      <img
                        src={getDriveDirectImageUrl(photoUrl)}
                        alt="Photo preview"
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-lg object-cover border border-amber-500/50 shrink-0 bg-neutral-900"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (!target.src.includes('/api/image-proxy') && photoUrl) {
                            target.src = `/api/image-proxy?url=${encodeURIComponent(photoUrl)}`;
                          } else {
                            target.style.display = 'none';
                          }
                        }}
                      />
                      <div className="text-[11px] text-neutral-300 truncate">
                        <span className="text-emerald-400 font-bold block text-xs">Drive Link Ready</span>
                        <span className="text-neutral-400 text-[10px] truncate block">{photoUrl}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleCancelEditing}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#222222] hover:bg-[#2A2A2A] text-neutral-300 border border-[#333333] transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="profile-save-submit-btn"
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Profile Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* ======================= VIEW MODE ======================= */
            <>
              {/* ONE POWERFUL BUTTON: INSTALL TO PHONE & ALLOW ALL PERMISSIONS AT ONCE */}
              <div className="bg-gradient-to-br from-[#1C1810] via-[#141414] to-[#101713] p-5 rounded-2xl border-2 border-amber-500/50 shadow-xl shadow-amber-500/10 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                      <Zap className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-white tracking-tight flex items-center gap-2">
                        <span>Install on Phone &amp; Allow All Permissions</span>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-black shadow-sm">
                          1-Tap Master
                        </span>
                      </h4>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Installs the choir portal onto your mobile home screen and enables mass alerts, choir chimes &amp; offline access simultaneously.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Permissions & Live Status Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 relative z-10">
                  <div className="bg-[#0D0D0D] p-2.5 rounded-xl border border-[#242424] flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] text-neutral-400 block font-semibold uppercase">Mobile App</span>
                      <span className={`text-[11px] font-bold truncate block ${isInstalled || isStandalone ? 'text-emerald-400' : 'text-neutral-300'}`}>
                        {isInstalled || isStandalone ? 'Installed' : canPromptDirectly ? 'Ready to Install' : isIOS ? 'iOS Ready' : 'Install Ready'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#0D0D0D] p-2.5 rounded-xl border border-[#242424] flex items-center gap-2">
                    <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] text-neutral-400 block font-semibold uppercase">Mass Alerts</span>
                      <span className={`text-[11px] font-bold truncate block ${notifPermission === 'granted' ? 'text-emerald-400' : 'text-amber-300'}`}>
                        {notifPermission === 'granted' ? 'Active' : 'Allow on Tap'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#0D0D0D] p-2.5 rounded-xl border border-[#242424] flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-purple-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] text-neutral-400 block font-semibold uppercase">Choir Chimes</span>
                      <span className={`text-[11px] font-bold truncate block ${audioUnlocked ? 'text-emerald-400' : 'text-neutral-300'}`}>
                        {audioUnlocked ? 'Activated' : 'Auto-Unlock'}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#0D0D0D] p-2.5 rounded-xl border border-[#242424] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-[9px] text-neutral-400 block font-semibold uppercase">Offline Storage</span>
                      <span className="text-[11px] font-bold text-sky-300 truncate block">
                        Secured
                      </span>
                    </div>
                  </div>
                </div>

                {/* THE ONE POWERFUL BUTTON */}
                <div className="relative z-10 pt-1">
                  <button
                    type="button"
                    id="one-powerful-install-permissions-btn"
                    disabled={isPowerProcessing}
                    onClick={handleMasterInstallAndAllPermissions}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 active:scale-[0.99] text-black font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-xl shadow-amber-500/25 transition-all cursor-pointer border border-amber-300/40 group"
                  >
                    {isPowerProcessing ? (
                      <>
                        <RotateCcw className="w-5 h-5 animate-spin" />
                        <span>Activating Permissions &amp; Launching Installer...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 text-black group-hover:scale-125 transition-transform" />
                        <span>Install App &amp; Allow All Permissions at Once</span>
                        <ArrowRight className="w-5 h-5 text-black group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>

                  {/* Direct Home Screen Installation Guide & Logo Button */}
                  <button
                    type="button"
                    onClick={() => setIsInstallModalOpen(true)}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-[#181818] hover:bg-[#222222] text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    <span>View Step-by-Step Home Screen Guide &amp; App Logo (Any Phone)</span>
                  </button>
                </div>

                {/* Feedback Message */}
                {powerFeedback && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-300 animate-in fade-in duration-200 relative z-10">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{powerFeedback}</span>
                  </div>
                )}

                {/* iOS 2-step instruction helper if opened on iPhone/iPad */}
                {showIOSGuide && (
                  <div className="p-3.5 rounded-xl bg-[#111111] border border-amber-500/30 space-y-2 text-xs text-neutral-300 animate-in fade-in duration-200 relative z-10">
                    <div className="font-bold text-amber-400 flex items-center gap-1.5">
                      <Share className="w-4 h-4" />
                      <span>2 Quick Steps to Finish on iPhone / Safari:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-[#181818] p-2 rounded-lg border border-[#2B2B2B] flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-black text-[10px] flex items-center justify-center shrink-0">1</span>
                        <span>Tap Safari bottom <strong>Share</strong> icon (⎋)</span>
                      </div>
                      <div className="bg-[#181818] p-2 rounded-lg border border-[#2B2B2B] flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-black font-black text-[10px] flex items-center justify-center shrink-0">2</span>
                        <span>Choose <strong>Add to Home Screen</strong> (+)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Official Contact Details Card */}
              <div className="bg-[#181818] p-4.5 rounded-2xl border border-[#262626] space-y-3">
                <div className="flex items-center justify-between border-b border-[#242424] pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Official Church Contact & Security Credentials</span>
                  </span>
                  <button
                    onClick={() => setShowPinInView(!showPinInView)}
                    className="text-[10px] text-neutral-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                    title="Toggle PIN preview"
                  >
                    {showPinInView ? <EyeOff className="w-3 h-3 text-amber-400" /> : <Eye className="w-3 h-3 text-amber-400" />}
                    <span>{showPinInView ? 'Hide PIN' : 'Reveal PIN'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-2.5 text-neutral-300 bg-[#121212] p-2.5 rounded-xl border border-[#222222]">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-neutral-400 block font-medium">Contact Phone</span>
                      <span className="font-semibold text-white">{member.phone || '+94 77 123 4567'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-neutral-300 bg-[#121212] p-2.5 rounded-xl border border-[#222222]">
                    <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                    <div className="truncate">
                      <span className="text-[10px] text-neutral-400 block font-medium">Email Address</span>
                      <span className="font-semibold text-white truncate block">{member.email || '—'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-neutral-300 bg-[#121212] p-2.5 rounded-xl border border-[#222222]">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-neutral-400 block font-medium">Parish Residence</span>
                      <span className="font-semibold text-white">
                        {choristerProfile?.address || "St. Michael's Church, Koralawella"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-neutral-300 bg-[#121212] p-2.5 rounded-xl border border-[#222222]">
                    <KeyRound className="w-4 h-4 text-purple-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-neutral-400 block font-medium">Security PIN</span>
                      <span className="font-mono text-xs font-bold text-amber-300">
                        {showPinInView ? member.pin : '•••• (Secured)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-neutral-300 bg-[#121212] p-2.5 rounded-xl border border-[#222222]">
                    <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-neutral-400 block font-medium">Sunday Mass Preference</span>
                      <span className="font-semibold text-emerald-300">
                        {choristerProfile?.sundayMassPreference || 'Sunday - 8.00 am'}
                      </span>
                    </div>
                  </div>

                  {choristerProfile?.weeklyMassPreference && (
                    <div className="flex items-center gap-2.5 text-neutral-300 bg-[#121212] p-2.5 rounded-xl border border-[#222222]">
                      <Calendar className="w-4 h-4 text-purple-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-neutral-400 block font-medium">Weekly Mass Duty</span>
                        <span className="font-semibold text-purple-300">
                          {choristerProfile.weeklyMassPreference}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Voice Rating & Vocal Profile (If evaluated or Organist) */}
              {(voiceRating !== undefined || voiceNotes) && (
                <div className="bg-[#181818] p-4 rounded-2xl border border-[#262626] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>Voice Evaluation Score (1–10)</span>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border ${ratingDetails.badgeClass}`}>
                      {voiceRating ? `${voiceRating} / 10` : 'Not Evaluated'}
                    </span>
                  </div>

                  <div className="text-xs text-neutral-300">
                    <span className="font-bold text-white">{ratingDetails.label}: </span>
                    <span className="text-neutral-400">{ratingDetails.desc}</span>
                  </div>

                  {voiceNotes && (
                    <div className="p-2.5 rounded-xl bg-[#121212] border border-[#222222] text-xs text-neutral-300 italic">
                      &quot;{voiceNotes}&quot;
                    </div>
                  )}
                </div>
              )}

              {/* PRESIDENT LOGO & ALIGNMENT CONFIGURATION CARD */}
              {(isPresident || member.name === 'Joshua Peiris') && (
                <div className="bg-gradient-to-br from-amber-950/40 via-[#181818] to-[#141414] p-5 rounded-2xl border border-amber-500/40 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                        Presidential Logo & Alignment Controls
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Presidential Privilege
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300">
                    Update the choir logo using any Google Drive sharing link and choose whether to center the header crest & title.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-amber-300 mb-1">
                        Google Drive Link for Logo
                      </label>
                      <input
                        type="text"
                        value={logoDriveLink}
                        onChange={(e) => setLogoDriveLink(e.target.value)}
                        placeholder="https://drive.google.com/file/d/1IprWPQCkwJqZgsGJc2rn-dfdLAlGr4mr/view?usp=sharing"
                        className="w-full bg-[#121212] border border-amber-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-[#121212] p-3 rounded-xl border border-amber-500/20">
                      <div>
                        <span className="text-xs font-bold text-white block">Center Logo & Header Crest</span>
                        <span className="text-[10px] text-neutral-400">Align the choir crest and title to the center of the navigation bar</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={isLogoCenteredState}
                        onChange={(e) => setIsLogoCenteredState(e.target.checked)}
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      />
                    </div>

                    {/* Display Fit Mode (Fill vs Show All Contain) */}
                    <div className="flex items-center justify-between bg-[#121212] p-3 rounded-xl border border-amber-500/20">
                      <div>
                        <span className="text-xs font-bold text-white block">Image Display Mode</span>
                        <span className="text-[10px] text-neutral-400">Choose between filling circular frame or showing whole image</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setLogoFitModeState('cover')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                            logoFitModeState === 'cover'
                              ? 'bg-amber-500 text-black font-bold'
                              : 'bg-[#1C1C1C] text-neutral-300 border border-[#2E2E2E]'
                          }`}
                        >
                          Cover
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoFitModeState('contain')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                            logoFitModeState === 'contain'
                              ? 'bg-amber-500 text-black font-bold'
                              : 'bg-[#1C1C1C] text-neutral-300 border border-[#2E2E2E]'
                          }`}
                        >
                          Show All (Contain)
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#121212] p-3.5 rounded-xl border border-amber-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-white block">Image Zoom / Scale Inside Frame</span>
                          <span className="text-[10px] text-neutral-400">Make the image smaller or bigger inside the circle</span>
                        </div>
                        <span className="text-xs font-bold font-mono text-amber-300 px-2 py-0.5 rounded bg-amber-500/20">
                          {logoImageScaleState}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={40}
                          max={250}
                          step={2}
                          value={logoImageScaleState}
                          onChange={(e) => setLogoImageScaleState(Number(e.target.value))}
                          className="w-full h-2 bg-[#222222] rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>
                      <div className="flex items-center justify-between gap-1.5 pt-1">
                        {[50, 75, 100, 125, 150, 200].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setLogoImageScaleState(val)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                              Math.abs(logoImageScaleState - val) <= 4 
                                ? 'bg-amber-500 text-black font-bold' 
                                : 'bg-[#1C1C1C] hover:bg-[#252525] text-neutral-300 border border-[#2E2E2E]'
                            }`}
                          >
                            {val}%
                          </button>
                        ))}
                      </div>

                      {/* Nudge / Crop Position Controls */}
                      <div className="pt-2 border-t border-[#222222] flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-neutral-300">Pan / Crop Position:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setLogoOffsetXState(prev => prev - 5)}
                            className="px-2 py-1 rounded bg-[#202020] hover:bg-amber-500 hover:text-black text-xs text-neutral-300"
                            title="Nudge Left"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            onClick={() => setLogoOffsetXState(prev => prev + 5)}
                            className="px-2 py-1 rounded bg-[#202020] hover:bg-amber-500 hover:text-black text-xs text-neutral-300"
                            title="Nudge Right"
                          >
                            →
                          </button>
                          <button
                            type="button"
                            onClick={() => setLogoOffsetYState(prev => prev - 5)}
                            className="px-2 py-1 rounded bg-[#202020] hover:bg-amber-500 hover:text-black text-xs text-neutral-300"
                            title="Nudge Up"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            onClick={() => setLogoOffsetYState(prev => prev + 5)}
                            className="px-2 py-1 rounded bg-[#202020] hover:bg-amber-500 hover:text-black text-xs text-neutral-300"
                            title="Nudge Down"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => { setLogoOffsetXState(0); setLogoOffsetYState(0); }}
                            className="px-2 py-1 rounded bg-[#222222] hover:bg-[#2A2A2A] text-[10px] text-amber-300"
                            title="Reset position to center"
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {logoSaveSuccess && (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Image scale & crop updated!
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setChoirLogoUrl(logoDriveLink);
                          setLogoCentered(isLogoCenteredState);
                          setLogoImageScale(logoImageScaleState);
                          setLogoImageOffsetX(logoOffsetXState);
                          setLogoImageOffsetY(logoOffsetYState);
                          setLogoFitMode(logoFitModeState);
                          setLogoSaveSuccess(true);
                          setTimeout(() => {
                            window.location.reload();
                          }, 1000);
                        }}
                        className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-all shadow-md"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save & Apply Image Crop</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* HARDCODED OFFICIAL ROLE RESPONSIBILITIES CARD */}
              <div className="bg-[#181818] p-5 rounded-2xl border border-[#2B2B2B] space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#242424] pb-2.5">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                      Official Role Responsibilities
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {member.role}
                  </span>
                </div>

                {/* Exact Constitutional Responsibility Charter Text */}
                <div className="p-4 rounded-xl bg-[#121212] border border-amber-500/30 shadow-inner space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wide">
                      {member.role} Charter
                    </span>
                    <span className="text-[10px] font-semibold text-neutral-400">
                      (St. Cecilia&apos;s Choir Constitution)
                    </span>
                  </div>
                  <p className="text-xs text-neutral-200 leading-relaxed font-serif italic selection:bg-amber-500 selection:text-black">
                    &quot;{roleResponsibilityText}&quot;
                  </p>
                </div>

                {/* Key Points Checklist */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                    Core Mandated Duties:
                  </span>
                  <ul className="space-y-1.5 text-xs text-neutral-300">
                    {roleKeyPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Expandable All 6 Roles Charter */}
                <div className="pt-2 border-t border-[#242424]">
                  <button
                    onClick={() => setShowCharterDrawer(!showCharterDrawer)}
                    className="w-full flex items-center justify-between text-xs text-neutral-400 hover:text-white py-1 transition-colors"
                  >
                    <span className="flex items-center gap-1.5 font-semibold text-[11px] text-amber-400">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{showCharterDrawer ? 'Hide Full Executive Charter' : 'View Full Executive Charter (All 6 Roles)'}</span>
                    </span>
                    {showCharterDrawer ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {showCharterDrawer && (
                    <div className="mt-3 space-y-3 pt-3 border-t border-[#222222] animate-in fade-in duration-200">
                      {ALL_OFFICIAL_RESPONSIBILITIES.map((item) => (
                        <div 
                          key={item.role}
                          className={`p-3 rounded-xl bg-[#101010] border ${item.borderClass} space-y-1.5`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-white">{item.title}</span>
                          </div>
                          <p className="text-[11px] text-neutral-300 leading-relaxed font-serif italic">
                            &quot;{item.responsibility}&quot;
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Quick Actions Footer */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#242424]">
            <button
              id="switch-account-modal-btn"
              onClick={onSwitchAccount}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#222222] hover:bg-[#2C2C2C] text-neutral-300 border border-[#333333] transition-colors"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Switch Profile / Re-Enter PIN</span>
            </button>

            <button
              id="enter-portal-modal-btn"
              onClick={onClose}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md shadow-amber-500/20 transition-all"
            >
              <span>Close / Enter Choir Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Universal Home Screen Installation Modal for any OS */}
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  );
};
