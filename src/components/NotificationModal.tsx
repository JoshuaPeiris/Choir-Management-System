import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bell, 
  X, 
  Send, 
  Sparkles, 
  Church, 
  ShieldCheck, 
  CheckCircle2, 
  Users, 
  UserCheck, 
  Plus, 
  RefreshCw, 
  Zap, 
  Check, 
  Lock, 
  MessageCircle, 
  Trash2, 
  Search, 
  Smartphone, 
  Volume2
} from 'lucide-react';
import { 
  ChoirNotification, 
  getCommitteeMassPledges, 
  MassAttendancePledge, 
  CommitteePledgedMember, 
  getStoredNotifications, 
  triggerDeviceNotification, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  clearAllNotifications, 
  playNotificationSound,
  sendCustomNotification,
  sendPledgedMassReminders
} from '../utils/notificationService';
import { CommitteeMember, Chorister } from '../types';
import { OnlinePresenceUser } from '../utils/presenceService';
import { getDriveDirectImageUrl } from '../utils/driveImage';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeMember: CommitteeMember;
  committeeMembers: CommitteeMember[];
  choristers: Chorister[];
  onNotifySent?: (msg: string) => void;
  onlineUsers?: OnlinePresenceUser[];
}

const QUICK_EMOJIS = ['⛪', '🔔', '🎵', '🌟', '📢', '⚠️', '🙏', '🎼', '🕊️', '👑', '🔥', '🎉'];

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  activeMember,
  committeeMembers = [],
  choristers = [],
  onNotifySent,
  onlineUsers = []
}) => {
  // Access Control: ONLY Lead Joshua Peiris can access the Notification System
  const isLeadJoshua = activeMember?.name?.trim().toLowerCase() === 'joshua peiris' || activeMember?.id === 'choir-joshua-peiris';

  const [activeTab, setActiveTab] = useState<'mass-pledges' | 'custom-send' | 'inbox'>('mass-pledges');
  const [notifications, setNotifications] = useState<ChoirNotification[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Mass Pledges State
  const [selectedMassKey, setSelectedMassKey] = useState<string>('thursday');
  const [isDispatchingAllPledges, setIsDispatchingAllPledges] = useState<boolean>(false);
  const [isDispatchingMassKey, setIsDispatchingMassKey] = useState<string | null>(null);
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});
  const [manuallyAddedMembers, setManuallyAddedMembers] = useState<Record<string, CommitteePledgedMember[]>>({});
  const [showAddMemberDropdown, setShowAddMemberDropdown] = useState<boolean>(false);

  // Custom Notification Composer State
  const [recipientMode, setRecipientMode] = useState<'all' | 'specific'>('all');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [recipientSearchQuery, setRecipientSearchQuery] = useState<string>('');
  const [customEmoji, setCustomEmoji] = useState<string>('🔔');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customBody, setCustomBody] = useState<string>('');
  const [isSendingCustom, setIsSendingCustom] = useState<boolean>(false);

  // Sync notifications on mount / open
  useEffect(() => {
    if (isOpen) {
      setNotifications(getStoredNotifications());
    }
  }, [isOpen]);

  // Real-time listener for notification updates
  useEffect(() => {
    const handleUpdate = () => {
      setNotifications(getStoredNotifications());
    };
    window.addEventListener('choir-notifications-updated', handleUpdate);
    return () => window.removeEventListener('choir-notifications-updated', handleUpdate);
  }, []);

  // Compute mass attendance pledges from database (weekly & sunday preferences)
  const massPledges: MassAttendancePledge[] = useMemo(() => {
    const base = getCommitteeMassPledges(committeeMembers, choristers);
    return base.map(m => {
      const manual = manuallyAddedMembers[m.massKey] || [];
      const combinedMembers = [...m.committeeMembers];
      manual.forEach(man => {
        if (!combinedMembers.some(c => c.memberId === man.memberId || c.memberName.toLowerCase() === man.memberName.toLowerCase())) {
          combinedMembers.push(man);
        }
      });
      return {
        ...m,
        committeeMembers: combinedMembers
      };
    });
  }, [committeeMembers, choristers, manuallyAddedMembers]);

  const activeMassPledge = useMemo(() => {
    return massPledges.find(m => m.massKey === selectedMassKey) || massPledges[0];
  }, [massPledges, selectedMassKey]);

  // Total unique pledges count across all masses
  const totalPledgedRemindersCount = useMemo(() => {
    let count = 0;
    massPledges.forEach(m => {
      count += m.committeeMembers.length;
    });
    return count;
  }, [massPledges]);

  // Filtered committee members for specific recipient selection
  const filteredCommitteeList = useMemo(() => {
    const q = recipientSearchQuery.toLowerCase().trim();
    if (!q) return committeeMembers;
    return committeeMembers.filter(m => 
      m.name.toLowerCase().includes(q) || 
      m.role.toLowerCase().includes(q)
    );
  }, [committeeMembers, recipientSearchQuery]);

  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setFeedbackMsg({ text, type });
    if (onNotifySent) onNotifySent(text);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4500);
  };

  // 1-Click Master Dispatch: Every Committee Member receives the message for each mass they told that they would come
  const handleDispatchAllPledgedMembers = async () => {
    const allPledgesList: Array<{
      massKey: string;
      massName: string;
      memberId: string;
      memberName: string;
      phone?: string;
    }> = [];

    massPledges.forEach(mass => {
      mass.committeeMembers.forEach(mem => {
        allPledgesList.push({
          massKey: mass.massKey,
          massName: mass.massName,
          memberId: mem.memberId,
          memberName: mem.memberName,
          phone: mem.phone
        });
      });
    });

    if (allPledgesList.length === 0) {
      showFeedback('No committee members currently pledged for any mass.', 'info');
      return;
    }

    setIsDispatchingAllPledges(true);
    playNotificationSound();

    try {
      const res = await sendPledgedMassReminders(allPledgesList, 'Lead Joshua Peiris');
      
      // Also trigger a local confirmation alert
      await triggerDeviceNotification(
        '⛪ Mass Attendance Reminders Dispatched',
        `Dispatched ${allPledgesList.length} reminders to committee members for each mass they promised to attend: "Try to Come for the mass that you told ur gonna come!"`,
        'weekly-mass',
        'Lead Joshua Peiris'
      );

      // Mark all as sent in local state
      const newSentMap: Record<string, boolean> = {};
      allPledgesList.forEach(p => {
        newSentMap[`${p.massKey}-${p.memberId}`] = true;
      });
      setSentMap(prev => ({ ...prev, ...newSentMap }));

      showFeedback(`✅ Dispatched personalized mass reminders to ${allPledgesList.length} committee members across all masses!`);
    } catch {
      showFeedback('Error dispatching mass reminders. Please retry.', 'error');
    } finally {
      setIsDispatchingAllPledges(false);
    }
  };

  // Dispatch reminders for a single mass to its pledged members
  const handleDispatchSingleMass = async (mass: MassAttendancePledge) => {
    if (mass.committeeMembers.length === 0) {
      showFeedback(`No committee members currently pledged for ${mass.massName}.`, 'info');
      return;
    }

    setIsDispatchingMassKey(mass.massKey);
    playNotificationSound();

    try {
      const pledgesList = mass.committeeMembers.map(mem => ({
        massKey: mass.massKey,
        massName: mass.massName,
        memberId: mem.memberId,
        memberName: mem.memberName,
        phone: mem.phone
      }));

      await sendPledgedMassReminders(pledgesList, 'Lead Joshua Peiris');

      const newSentMap: Record<string, boolean> = {};
      mass.committeeMembers.forEach(mem => {
        newSentMap[`${mass.massKey}-${mem.memberId}`] = true;
      });
      setSentMap(prev => ({ ...prev, ...newSentMap }));

      showFeedback(`✅ Sent reminders to ${mass.committeeMembers.length} members for ${mass.massName}!`);
    } catch {
      showFeedback(`Error dispatching reminders for ${mass.massName}.`, 'error');
    } finally {
      setIsDispatchingMassKey(null);
    }
  };

  // Send single member reminder for a specific mass
  const handleSendSingleMemberReminder = async (mass: MassAttendancePledge, member: CommitteePledgedMember) => {
    playNotificationSound();
    const firstName = member.memberName.split(' ')[0] || member.memberName;
    const bodyText = `Dear ${firstName}, Try to Come for the mass that you told ur gonna come - ${mass.massName}!`;

    try {
      await sendPledgedMassReminders([{
        massKey: mass.massKey,
        massName: mass.massName,
        memberId: member.memberId,
        memberName: member.memberName,
        phone: member.phone
      }], 'Lead Joshua Peiris');

      setSentMap(prev => ({ ...prev, [`${mass.massKey}-${member.memberId}`]: true }));
      showFeedback(`✅ Sent reminder to ${member.memberName} for ${mass.massName}!`);
    } catch {
      showFeedback(`Failed to send reminder to ${member.memberName}.`, 'error');
    }
  };

  // Generate WhatsApp link for a pledged member
  const getMemberWhatsAppUrl = (massName: string, member: CommitteePledgedMember) => {
    const firstName = member.memberName.split(' ')[0] || member.memberName;
    const cleanPhone = (member.phone || '').replace(/[^0-9]/g, '');
    const message = `⛪ *St. Cecilia's Choir - Mass Attendance Reminder*\n\nDear ${firstName},\n\nTry to Come for the mass that you told ur gonna come - *${massName}*!\n\nYour presence and voice in the choir loft are very valuable to our parish ministry.\n\n— *Lead Joshua Peiris*\nPresident, St. Cecilia's Choir`;
    
    if (cleanPhone) {
      return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    }
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  };

  // Add member manually to a mass pledge list
  const handleAddMemberToMass = (massKey: string, member: CommitteeMember) => {
    const existing = manuallyAddedMembers[massKey] || [];
    if (existing.some(m => m.memberId === member.id)) return;

    const newPledge: CommitteePledgedMember = {
      memberId: member.id,
      memberName: member.name,
      role: member.role,
      phone: member.phone,
      photoUrl: member.photoUrl,
      pledgedPreference: 'Manually added by Lead Joshua',
      confirmed: true
    };

    setManuallyAddedMembers(prev => ({
      ...prev,
      [massKey]: [...existing, newPledge]
    }));
    setShowAddMemberDropdown(false);
    showFeedback(`Added ${member.name} to ${activeMassPledge?.massName || 'mass'}`);
  };

  // Toggle selection for specific recipient in Custom composer
  const handleToggleRecipient = (id: string) => {
    setSelectedRecipientIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAllRecipients = () => {
    setSelectedRecipientIds(committeeMembers.map(m => m.id));
  };

  const handleClearRecipients = () => {
    setSelectedRecipientIds([]);
  };

  // Dispatch Custom Notification
  const handleSendCustomNotification = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!customBody.trim()) {
      showFeedback('Please enter the notification message text.', 'error');
      return;
    }

    if (recipientMode === 'specific' && selectedRecipientIds.length === 0) {
      showFeedback('Please select at least one committee member recipient.', 'error');
      return;
    }

    setIsSendingCustom(true);
    playNotificationSound();

    const selectedEmoji = customEmoji.trim() || '🔔';
    const resolvedTitle = customTitle.trim() || 'Choir Announcement';

    const chosenRecipients: Array<{ id: string; name: string }> | 'all' = recipientMode === 'all'
      ? 'all'
      : committeeMembers
          .filter(m => selectedRecipientIds.includes(m.id))
          .map(m => ({ id: m.id, name: m.name }));

    try {
      const res = await sendCustomNotification({
        title: resolvedTitle,
        body: customBody.trim(),
        emoji: selectedEmoji,
        recipients: chosenRecipients,
        sentBy: 'Lead Joshua Peiris'
      });

      // Trigger local device notification as preview
      await triggerDeviceNotification(
        `${selectedEmoji} ${resolvedTitle}`,
        customBody.trim(),
        'committee',
        'Lead Joshua Peiris'
      );

      showFeedback(`✅ Custom notification dispatched to ${res.count} recipient(s)!`);
      setCustomTitle('');
      setCustomBody('');
    } catch {
      showFeedback('Failed to send custom notification. Please try again.', 'error');
    } finally {
      setIsSendingCustom(false);
    }
  };

  if (!isOpen) return null;

  // STRICT ACCESS RESTRICTION: Only Lead Joshua Can Access
  if (!isLeadJoshua) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-[#121212] border border-rose-500/40 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Access Restricted</h3>
            <p className="text-xs text-rose-300 font-semibold mt-1">Lead Joshua Authorization Only</p>
          </div>
          <p className="text-xs text-neutral-300 leading-relaxed">
            Only <strong>Lead Joshua Peiris (Choir President)</strong> is authorized to access the Choir Notification System. Other members cannot view or broadcast notifications.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#222] hover:bg-[#2c2c2c] text-neutral-200 font-semibold text-xs border border-[#333] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#111111] border border-[#262626] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#202020] bg-[#141414] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-white truncate">
                  Lead Joshua's Notification System
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-black border border-amber-300 shadow-sm flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Lead Joshua Only
                </span>
              </div>
              <p className="text-xs text-neutral-400 truncate">
                Dispatches to committee members for their pledged masses &amp; custom alerts with custom emoji logo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-[#202020] transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedbackMsg && (
          <div className={`px-4 py-2.5 text-xs font-semibold flex items-center gap-2 border-b animate-in fade-in duration-150 ${
            feedbackMsg.type === 'success' 
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : feedbackMsg.type === 'error'
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
          }`}>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="flex-1">{feedbackMsg.text}</span>
          </div>
        )}

        {/* 3 Dedicated Navigation Tabs: NO TESTING TAB */}
        <div className="px-4 sm:px-6 pt-3 border-b border-[#202020] flex items-center gap-2 bg-[#0E0E0E] overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('mass-pledges')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'mass-pledges'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10 rounded-t-xl'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Church className="w-4 h-4 text-amber-400" />
            <span>Mass Attendance Messages</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
              {totalPledgedRemindersCount} Pledges
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('custom-send')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'custom-send'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10 rounded-t-xl'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Custom Notification</span>
            <span className="text-xs">{customEmoji}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'inbox'
                ? 'border-amber-400 text-amber-300 bg-amber-500/10 rounded-t-xl'
                : 'border-transparent text-neutral-400 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4 text-neutral-400" />
            <span>Sent Log ({notifications.length})</span>
          </button>
        </div>

        {/* Modal Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-[#0B0B0B]">
          
          {/* ============================================================== */}
          {/* TAB 1: MASS ATTENDANCE REMINDERS (PLEDGED MASSES TO EACH MEMBER) */}
          {/* ============================================================== */}
          {activeTab === 'mass-pledges' && (
            <div className="space-y-5">
              
              {/* Master 1-Click Dispatch Banner */}
              <div className="bg-gradient-to-r from-amber-500/15 via-[#161616] to-amber-600/15 border border-amber-500/40 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-black uppercase">
                      Exact Pledges Delivery
                    </span>
                    <span className="text-xs text-neutral-400">• All 6 Masses Covered</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Send Mass Message to Every Committee Member for Their Pledged Mass
                  </h3>
                  <p className="text-xs text-neutral-300 max-w-xl leading-relaxed">
                    Every committee member who agreed to come for a weekly mass receives: <strong className="text-amber-300">"Dear [Name], Try to Come for the mass that you told ur gonna come - [Mass Name]!"</strong>
                  </p>
                </div>

                <button
                  type="button"
                  id="dispatch-all-masses-master-btn"
                  onClick={handleDispatchAllPledgedMembers}
                  disabled={isDispatchingAllPledges}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                >
                  {isDispatchingAllPledges ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      <span>Sending Messages...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-black" />
                      <span>Send to All Pledged Members ({totalPledgedRemindersCount})</span>
                    </>
                  )}
                </button>
              </div>

              {/* 6 Weekly Masses Grid Selector */}
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                  Select Mass to View Committee Members Who Promised to Come:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {massPledges.map((m) => {
                    const isSelected = selectedMassKey === m.massKey;
                    return (
                      <button
                        key={m.massKey}
                        type="button"
                        onClick={() => setSelectedMassKey(m.massKey)}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-amber-400 bg-amber-500/15 ring-1 ring-amber-400 shadow-md'
                            : 'border-[#222] bg-[#141414] hover:border-[#333] hover:bg-[#181818]'
                        }`}
                      >
                        <div>
                          <div className="text-[11px] font-bold text-white line-clamp-1">
                            {m.massName}
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            {m.dayTime}
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                            m.committeeMembers.length > 0 
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                              : 'bg-neutral-800 text-neutral-400'
                          }`}>
                            {m.committeeMembers.length} {m.committeeMembers.length === 1 ? 'member' : 'members'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Selected Mass Detail Card */}
              {activeMassPledge && (
                <div className="bg-[#141414] border border-[#242424] rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#222] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">
                          {activeMassPledge.massName}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {activeMassPledge.dayTime}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {activeMassPledge.committeeMembers.length} committee member(s) confirmed they will attend this mass.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Add member manually dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowAddMemberDropdown(!showAddMemberDropdown)}
                          className="px-3 py-1.5 rounded-xl bg-[#202020] hover:bg-[#282828] text-neutral-200 border border-[#333] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Member</span>
                        </button>

                        {showAddMemberDropdown && (
                          <div className="absolute right-0 mt-2 w-64 bg-[#1C1C1C] border border-[#333] rounded-2xl shadow-2xl p-2 z-30 space-y-1 max-h-60 overflow-y-auto">
                            <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase">
                              Add Committee Member to this Mass
                            </div>
                            {committeeMembers
                              .filter(cm => !activeMassPledge.committeeMembers.some(p => p.memberId === cm.id))
                              .map(cm => (
                                <button
                                  key={cm.id}
                                  type="button"
                                  onClick={() => handleAddMemberToMass(activeMassPledge.massKey, cm)}
                                  className="w-full text-left p-2 rounded-xl hover:bg-[#282828] flex items-center gap-2 text-xs text-white transition-colors"
                                >
                                  <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[10px]">
                                    {cm.name.charAt(0)}
                                  </div>
                                  <div className="truncate">
                                    <div className="font-semibold">{cm.name}</div>
                                    <div className="text-[10px] text-neutral-400">{cm.role}</div>
                                  </div>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>

                      {/* Dispatch button for this mass */}
                      <button
                        type="button"
                        onClick={() => handleDispatchSingleMass(activeMassPledge)}
                        disabled={isDispatchingMassKey === activeMassPledge.massKey || activeMassPledge.committeeMembers.length === 0}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {isDispatchingMassKey === activeMassPledge.massKey ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5 fill-black" />
                        )}
                        <span>Send to {activeMassPledge.committeeMembers.length} Members</span>
                      </button>
                    </div>
                  </div>

                  {/* List of Committee Members pledged for this mass */}
                  {activeMassPledge.committeeMembers.length === 0 ? (
                    <div className="p-8 text-center bg-[#101010] rounded-2xl border border-dashed border-[#242424] space-y-2">
                      <Church className="w-8 h-8 text-neutral-600 mx-auto" />
                      <div className="text-sm font-bold text-neutral-400">
                        No Committee Members currently listed for {activeMassPledge.massName}
                      </div>
                      <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                        Use the "Add Member" button above if a committee member told you they would attend this service.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeMassPledge.committeeMembers.map((member) => {
                        const isSent = sentMap[`${activeMassPledge.massKey}-${member.memberId}`];
                        const waUrl = getMemberWhatsAppUrl(activeMassPledge.massName, member);

                        return (
                          <div
                            key={member.memberId}
                            className="p-3 rounded-xl bg-[#181818] border border-[#252525] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#333] transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {member.photoUrl ? (
                                <img
                                  src={getDriveDirectImageUrl(member.photoUrl)}
                                  alt={member.memberName}
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 rounded-xl object-cover shrink-0 border border-neutral-700"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center shrink-0 border border-amber-500/30">
                                  {member.memberName.charAt(0)}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-bold text-sm text-white flex items-center gap-2">
                                  <span className="truncate">{member.memberName}</span>
                                  <span className="px-1.5 py-0.2 rounded-md text-[10px] font-semibold bg-[#262626] text-neutral-300">
                                    {member.role}
                                  </span>
                                </div>
                                <div className="text-[11px] text-amber-400 font-medium truncate mt-0.5">
                                  Pledge: "Try to Come for the mass that you told ur gonna come"
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {isSent && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                  <Check className="w-3 h-3" />
                                  Sent
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => handleSendSingleMemberReminder(activeMassPledge, member)}
                                className="px-3 py-1.5 rounded-xl bg-[#252525] hover:bg-[#303030] text-neutral-200 border border-[#383838] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                title="Send in-app notification reminder to this member"
                              >
                                <Send className="w-3.5 h-3.5 text-amber-400" />
                                <span>Send Reminder</span>
                              </button>

                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                title="Open WhatsApp message pre-filled with the exact mass reminder"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                                <span>WhatsApp</span>
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: CUSTOM NOTIFICATION (CHOOSE RECIPIENTS, CUSTOM EMOJI & TEXT) */}
          {/* ============================================================== */}
          {activeTab === 'custom-send' && (
            <div className="space-y-5">
              
              <div className="bg-[#141414] border border-[#242424] rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="border-b border-[#222] pb-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Create Custom Notification</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Send to each committee member or all together. Set your custom emoji logo and message text.
                  </p>
                </div>

                <form onSubmit={handleSendCustomNotification} className="space-y-4">
                  
                  {/* Step 1: Recipient Selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center justify-between">
                      <span>1. Choose Who Gets the Notification:</span>
                      <span className="text-[11px] font-normal text-amber-400 lowercase">
                        {recipientMode === 'all' 
                          ? `All ${committeeMembers.length} committee members together` 
                          : `${selectedRecipientIds.length} member(s) selected`}
                      </span>
                    </label>

                    {/* Mode selector */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRecipientMode('all')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          recipientMode === 'all'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400'
                            : 'bg-[#181818] border-[#262626] text-neutral-400 hover:text-white hover:bg-[#202020]'
                        }`}
                      >
                        <Users className="w-4 h-4" />
                        <span>All Committee Members (Together)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRecipientMode('specific')}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          recipientMode === 'specific'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400'
                            : 'bg-[#181818] border-[#262626] text-neutral-400 hover:text-white hover:bg-[#202020]'
                        }`}
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>Choose Specific Member(s) / Each One</span>
                      </button>
                    </div>

                    {/* Specific Member Picker */}
                    {recipientMode === 'specific' && (
                      <div className="p-3 rounded-2xl bg-[#0E0E0E] border border-[#222] space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={recipientSearchQuery}
                              onChange={(e) => setRecipientSearchQuery(e.target.value)}
                              placeholder="Search member by name or role..."
                              className="w-full bg-[#161616] border border-[#282828] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={handleSelectAllRecipients}
                              className="px-2.5 py-1 text-[11px] rounded-lg bg-[#202020] text-neutral-300 hover:text-white hover:bg-[#282828] font-semibold"
                            >
                              Select All
                            </button>
                            <button
                              type="button"
                              onClick={handleClearRecipients}
                              className="px-2.5 py-1 text-[11px] rounded-lg bg-[#202020] text-neutral-400 hover:text-white hover:bg-[#282828] font-semibold"
                            >
                              Clear
                            </button>
                          </div>
                        </div>

                        {/* Committee Members Grid with Checkboxes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                          {filteredCommitteeList.map((m) => {
                            const isChecked = selectedRecipientIds.includes(m.id);
                            const isOnline = onlineUsers.some(u => u.memberId === m.id || u.memberName.toLowerCase() === m.name.toLowerCase());
                            return (
                              <div
                                key={m.id}
                                onClick={() => handleToggleRecipient(m.id)}
                                className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 select-none ${
                                  isChecked
                                    ? 'bg-amber-500/15 border-amber-400/60 text-white'
                                    : 'bg-[#141414] border-[#222] text-neutral-300 hover:bg-[#1A1A1A]'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="relative shrink-0">
                                    {m.photoUrl ? (
                                      <img
                                        src={getDriveDirectImageUrl(m.photoUrl)}
                                        alt={m.name}
                                        referrerPolicy="no-referrer"
                                        className="w-7 h-7 rounded-lg object-cover"
                                      />
                                    ) : (
                                      <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center">
                                        {m.name.charAt(0)}
                                      </div>
                                    )}
                                    {isOnline && (
                                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-xs font-bold truncate flex items-center gap-1.5">
                                      <span>{m.name}</span>
                                      {isOnline && (
                                        <span className="text-[9px] text-emerald-400 font-semibold px-1 py-0.1 bg-emerald-500/20 rounded">
                                          Online
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-neutral-400 truncate">{m.role}</div>
                                  </div>
                                </div>

                                <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                                  isChecked ? 'bg-amber-400 border-amber-400 text-black' : 'border-neutral-600 bg-transparent'
                                }`}>
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Custom Emoji Notification Logo */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                      2. Enter Custom Emoji as Notification Logo:
                    </label>

                    <div className="flex items-center gap-3">
                      {/* Live Emoji Icon Display */}
                      <div className="w-14 h-14 rounded-2xl bg-[#1C1C1C] border border-amber-500/50 flex items-center justify-center text-3xl shadow-inner shrink-0">
                        {customEmoji || '🔔'}
                      </div>

                      {/* Custom Emoji Input Field */}
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          value={customEmoji}
                          onChange={(e) => setCustomEmoji(e.target.value)}
                          placeholder="Type or paste any emoji (e.g. ⛪, 🔔, 🎵, 🌟, 📢, ⚠️, 🙏)..."
                          className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3.5 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 font-medium"
                          maxLength={6}
                        />
                        {/* Quick pick emoji row */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-neutral-500 font-semibold mr-1">Quick pick:</span>
                          {QUICK_EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setCustomEmoji(emoji)}
                              className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all ${
                                customEmoji === emoji
                                  ? 'bg-amber-400/30 border border-amber-400 scale-110 shadow-sm'
                                  : 'bg-[#1C1C1C] hover:bg-[#282828] border border-[#2E2E2E]'
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Notification Text (Title & Body) */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider block">
                      3. Enter Notification Text:
                    </label>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Notification Title / Subject (e.g. Urgent Practice, Feast Announcement)..."
                        className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                      />

                      <textarea
                        value={customBody}
                        onChange={(e) => setCustomBody(e.target.value)}
                        placeholder="Type the notification text that committee members will receive..."
                        rows={3}
                        className="w-full bg-[#181818] border border-[#2E2E2E] rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 resize-none"
                      />
                    </div>
                  </div>

                  {/* Live Notification Preview Card */}
                  <div className="p-3.5 rounded-2xl bg-[#0C0C0C] border border-[#222] space-y-2">
                    <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Live Notification Preview:</span>
                      <span className="text-amber-400">
                        {recipientMode === 'all' ? 'All Committee Members' : `${selectedRecipientIds.length} Recipient(s)`}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#161616] border border-amber-500/30 flex items-start gap-3 shadow-md">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-2xl flex items-center justify-center shrink-0 border border-amber-500/40">
                        {customEmoji || '🔔'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-bold text-xs text-white truncate">
                            {customEmoji} {customTitle.trim() || 'Choir Notification'}
                          </h5>
                          <span className="text-[10px] text-neutral-400">Just now</span>
                        </div>
                        <p className="text-xs text-neutral-300 mt-1 leading-relaxed whitespace-pre-wrap">
                          {customBody.trim() || 'Your notification message text will appear here...'}
                        </p>
                        <div className="mt-2 text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                          <span>From: Lead Joshua Peiris</span>
                          <span>•</span>
                          <span>St. Cecilia's Choir</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Send Action Button */}
                  <button
                    type="submit"
                    id="send-custom-notification-btn"
                    disabled={isSendingCustom || !customBody.trim() || (recipientMode === 'specific' && selectedRecipientIds.length === 0)}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingCustom ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-black" />
                        <span>Sending Custom Notification...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 fill-black" />
                        <span>
                          Send Custom Notification ({recipientMode === 'all' ? 'All Committee' : `${selectedRecipientIds.length} Members`})
                        </span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 3: SENT NOTIFICATIONS LOG */}
          {/* ============================================================== */}
          {activeTab === 'inbox' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-[#202020] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Sent Notifications History</h3>
                  <p className="text-xs text-neutral-400">Log of all mass attendance messages and custom announcements</p>
                </div>
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      clearAllNotifications();
                      setNotifications([]);
                      showFeedback('Notification history cleared');
                    }}
                    className="px-2.5 py-1 text-xs rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Log</span>
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="p-12 text-center bg-[#141414] rounded-2xl border border-dashed border-[#242424] space-y-2">
                  <Bell className="w-8 h-8 text-neutral-600 mx-auto" />
                  <div className="text-sm font-bold text-neutral-300">No sent notifications yet</div>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    Notifications sent via Mass Attendance Messages or Custom Notification will be recorded here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3.5 rounded-2xl bg-[#141414] border border-[#222] hover:border-[#303030] transition-all flex items-start gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-2xl flex items-center justify-center shrink-0 border border-amber-500/30">
                        {notif.emoji || (notif.title.includes('⛪') ? '⛪' : '🔔')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="font-bold text-xs text-white truncate">
                            {notif.title}
                          </h5>
                          <span className="text-[10px] text-neutral-500 shrink-0">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 mt-1 leading-relaxed whitespace-pre-wrap">
                          {notif.body}
                        </p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap text-[10px] text-neutral-400">
                          <span>Sent by: <strong className="text-neutral-200">{notif.sentBy || 'Lead Joshua Peiris'}</strong></span>
                          {notif.targetMemberName && (
                            <>
                              <span>•</span>
                              <span>To: <strong className="text-amber-400">{notif.targetMemberName}</strong></span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Bottom Footer */}
        <div className="p-3 sm:p-4 border-t border-[#202020] bg-[#121212] flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Authorized: <strong>Joshua Peiris (Lead President)</strong></span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#222] hover:bg-[#2c2c2c] text-neutral-200 font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
