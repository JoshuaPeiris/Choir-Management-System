import { CommitteeRole } from '../types';

export interface RoleResponsibilityItem {
  role: string;
  title: string;
  badgeColor: string;
  borderClass: string;
  responsibility: string;
  keyPoints: string[];
}

export const OFFICIAL_ROLE_RESPONSIBILITIES: Record<string, string> = {
  'President': 'Is the head of the executive committee and bears responsibility for all activities taking place within the society. Conducts all meetings, executive, and general body sessions, and places signature where required. Decides on training days, directs members to locations/venues for training, and mobilizes members to achieve the objectives and goals of the society.',
  'Vice President': 'Fully assists the President, carries out the duties of the President in their absence, and bears responsibility for all activities taking place within the society.',
  'Secretary': 'Records proceedings of all meetings including general body meetings, presents reports and gets them approved, places signatures, informs members regarding training days, practices, and meetings, gets lists approved by the patron for required venues/locations, and maintains letter files. Bears responsibility for all activities taking place within the society.',
  'Assistant Secretary': 'Fully assists the Secretary, carries out the duties of the Secretary in their absence, and bears responsibility for all activities taking place within the society.',
  'Treasurer': 'manages all funds of the society in accordance with the constitution, presents relevant financial reports related to all financial matters of the society to the committee for approval, presents financial reports to the general body meeting for approval, places signatures for all financial transactions, and bears responsibility for all activities taking place within the society. Likewise, bears responsibility for financial matters under item No. 07.',
  'Assistant Treasurer': 'Fully assists the Treasurer, carries out the duties of the Treasurer in their absence, and bears responsibility for all activities taking place within the society.',
};

export const ALL_OFFICIAL_RESPONSIBILITIES: RoleResponsibilityItem[] = [
  {
    role: 'President',
    title: 'President',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    borderClass: 'border-amber-500/30',
    responsibility: OFFICIAL_ROLE_RESPONSIBILITIES['President'],
    keyPoints: [
      'Head of the Executive Committee',
      'Conducts executive and general body meetings',
      'Places official signatures where required',
      'Decides on training days and directs members to venues',
      'Mobilizes members to achieve society goals',
    ],
  },
  {
    role: 'Vice President',
    title: 'Vice President',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    borderClass: 'border-indigo-500/30',
    responsibility: OFFICIAL_ROLE_RESPONSIBILITIES['Vice President'],
    keyPoints: [
      'Fully assists the President',
      'Carries out presidential duties in the President\'s absence',
      'Bears responsibility for all society activities',
    ],
  },
  {
    role: 'Secretary',
    title: 'Secretary',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    borderClass: 'border-teal-500/30',
    responsibility: OFFICIAL_ROLE_RESPONSIBILITIES['Secretary'],
    keyPoints: [
      'Records proceedings of all general body & executive meetings',
      'Presents reports and secures official approval',
      'Places signatures on official records',
      'Informs members of training days, practices, and meetings',
      'Secures patron approval for venues and maintains letter files',
    ],
  },
  {
    role: 'Assistant Secretary',
    title: 'Assistant Secretary',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    borderClass: 'border-blue-500/30',
    responsibility: OFFICIAL_ROLE_RESPONSIBILITIES['Assistant Secretary'],
    keyPoints: [
      'Fully assists the Secretary',
      'Carries out secretarial duties in the Secretary\'s absence',
      'Bears responsibility for all society activities',
    ],
  },
  {
    role: 'Treasurer',
    title: 'Treasurer',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    borderClass: 'border-emerald-500/30',
    responsibility: OFFICIAL_ROLE_RESPONSIBILITIES['Treasurer'],
    keyPoints: [
      'Manages all funds of the society in accordance with constitution',
      'Presents financial reports to committee for approval',
      'Presents financial reports to general body meeting for approval',
      'Places signatures for all financial transactions',
      'Bears responsibility for financial matters under item No. 07',
    ],
  },
  {
    role: 'Assistant Treasurer',
    title: 'Assistant Treasurer',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    borderClass: 'border-rose-500/30',
    responsibility: OFFICIAL_ROLE_RESPONSIBILITIES['Assistant Treasurer'],
    keyPoints: [
      'Fully assists the Treasurer',
      'Carries out treasury duties in the Treasurer\'s absence',
      'Bears responsibility for all society activities',
    ],
  },
];

export function getRoleResponsibility(role: string): string {
  if (OFFICIAL_ROLE_RESPONSIBILITIES[role]) {
    return OFFICIAL_ROLE_RESPONSIBILITIES[role];
  }
  const normalized = role.toLowerCase().trim();
  if (normalized.includes('president') && !normalized.includes('vice')) {
    return OFFICIAL_ROLE_RESPONSIBILITIES['President'];
  }
  if (normalized.includes('vice') && normalized.includes('president')) {
    return OFFICIAL_ROLE_RESPONSIBILITIES['Vice President'];
  }
  if (normalized.includes('vice secretary') || normalized.includes('assistant secretary')) {
    return OFFICIAL_ROLE_RESPONSIBILITIES['Assistant Secretary'];
  }
  if (normalized.includes('secretary')) {
    return OFFICIAL_ROLE_RESPONSIBILITIES['Secretary'];
  }
  if (normalized.includes('vice treasurer') || normalized.includes('assistant treasurer')) {
    return OFFICIAL_ROLE_RESPONSIBILITIES['Assistant Treasurer'];
  }
  if (normalized.includes('treasurer')) {
    return OFFICIAL_ROLE_RESPONSIBILITIES['Treasurer'];
  }
  return 'Bears responsibility for assigned choral duties and activities taking place within the society in accordance with the constitution.';
}

export function getRoleKeyPoints(role: string): string[] {
  const item = ALL_OFFICIAL_RESPONSIBILITIES.find((r) => {
    if (r.role === role) return true;
    if ((r.role === 'Assistant Secretary' && (role === 'Vice Secretary' || role === 'Assistant Secretary'))) return true;
    if ((r.role === 'Assistant Treasurer' && (role === 'Vice Treasurer' || role === 'Assistant Treasurer'))) return true;
    return false;
  });
  return item ? item.keyPoints : ['Bears responsibility for activities taking place within the society.'];
}
