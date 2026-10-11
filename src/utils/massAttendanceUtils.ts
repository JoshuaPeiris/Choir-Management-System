import { Chorister, PracticeSession, AttendanceStatus, PracticeAttendanceRecord } from '../types';

export type MassKey = 
  | 'tuesday' 
  | 'thursday' 
  | 'firstFriday' 
  | 'saturdayEnglish' 
  | 'saturdayVigil' 
  | 'sundayEarly' 
  | 'sundayMain';

export interface MassMetadata {
  key: MassKey;
  day: string;
  time: string;
  name: string;
  shortName: string;
  sinhalaName: string;
  badgeColor: string;
  textColor: string;
  borderColor: string;
}

export const MASS_CONFIGS: Record<MassKey, MassMetadata> = {
  tuesday: {
    key: 'tuesday',
    day: 'Tuesday',
    time: '6:00 PM',
    name: 'Tuesday Holy Mass',
    shortName: 'Tuesday 6 PM',
    sinhalaName: 'අඟහරුවාදා සවස 6.00 දිව්‍ය පූජාව',
    badgeColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  thursday: {
    key: 'thursday',
    day: 'Thursday',
    time: '6:00 PM',
    name: 'Thursday - Novena And Holy Mass',
    shortName: 'Thursday 6 PM',
    sinhalaName: 'ශුද්ධවූ මිඛායෙල් අග්‍රදූතතුමන්ගේ නුවානය හා දිව්‍ය පූජාව',
    badgeColor: 'bg-amber-500/15',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
  },
  firstFriday: {
    key: 'firstFriday',
    day: 'First Friday',
    time: '6:00 PM',
    name: 'First Friday Holy Mass',
    shortName: 'First Friday 6 PM',
    sinhalaName: 'පළමු සිකුරාදා ආශිර්වාදය හා දිව්‍ය පූජාව',
    badgeColor: 'bg-rose-500/15',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-500/30',
  },
  saturdayVigil: {
    key: 'saturdayVigil',
    day: 'Saturday',
    time: '6:00 PM',
    name: 'Saturday Sunday Mass 6',
    shortName: 'Sat 6pm',
    sinhalaName: 'සෙනසුරාදා ප.ව. 6.00 දිව්‍ය පූජාව',
    badgeColor: 'bg-indigo-500/15',
    textColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/30',
  },
  sundayEarly: {
    key: 'sundayEarly',
    day: 'Sunday',
    time: '6:30 AM',
    name: 'Sunday Morning Mass 6.30',
    shortName: 'Sun Early 6:30 AM',
    sinhalaName: 'ඉරුදින පෙ.ව. 6.30 උදෑසන දිව්‍ය පූජාව',
    badgeColor: 'bg-cyan-500/15',
    textColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/30',
  },
  sundayMain: {
    key: 'sundayMain',
    day: 'Sunday',
    time: '8:00 AM',
    name: 'Sunday Morning Mass 8',
    shortName: 'Sun Main 8:00 AM',
    sinhalaName: 'ඉරුදින පෙ.ව. 8.00 ප්‍රධාන උදෑසන දිව්‍ය පූජාව',
    badgeColor: 'bg-emerald-500/15',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  saturdayEnglish: {
    key: 'saturdayEnglish',
    day: 'Saturday',
    time: '7:00 AM',
    name: 'Saturday English Mass',
    shortName: 'Sat English 7 AM',
    sinhalaName: 'සෙනසුරාදා පෙ.ව. 7.00 ඉංග්‍රීසි දිව්‍ය පූජාව',
    badgeColor: 'bg-teal-500/15',
    textColor: 'text-teal-400',
    borderColor: 'border-teal-500/30',
  },
};

/**
 * Identify if a practice session corresponds to a weekly or Sunday Mass
 */
export function getMassKeyFromSession(session: PracticeSession): MassKey | null {
  const title = (session.eventTitle || '').toLowerCase().trim();
  const focus = (session.focus || '').toLowerCase().trim();
  const notes = (session.notes || '').toLowerCase().trim();
  const combined = `${title} ${focus} ${notes}`;

  // Direct matches
  if (combined.includes('tuesday') || combined.includes('අඟහරුවාදා')) return 'tuesday';
  if (combined.includes('thursday') || combined.includes('නුවානය') || combined.includes('novena and holy mass')) return 'thursday';
  if (combined.includes('first friday') || combined.includes('පළමු සිකුරාදා')) return 'firstFriday';
  if (combined.includes('saturday english') || combined.includes('7.00') || combined.includes('7:00 am')) return 'saturdayEnglish';
  if (combined.includes('saturday sunday mass 6') || combined.includes('saturday 6') || combined.includes('vigil') || combined.includes('සෙනසුරාදා')) return 'saturdayVigil';
  if (combined.includes('sunday morning mass 6.30') || combined.includes('6.30') || combined.includes('6:30')) return 'sundayEarly';
  if (combined.includes('sunday morning mass 8') || combined.includes('sunday morning mass') || combined.includes('sunday 8') || combined.includes('8.00') || combined.includes('8:00')) return 'sundayMain';

  if (session.sessionType === 'mass') {
    if (combined.includes('saturday')) return 'saturdayVigil';
    if (combined.includes('sunday')) return 'sundayMain';
    if (combined.includes('friday')) return 'firstFriday';
  }

  return null;
}

/**
 * Check if a chorister stated they will come / committed to a specific Mass
 */
export function isChoristerRelevantToMass(c: Chorister, massKey: MassKey): boolean {
  if (c.role === 'Instrument Player') return false;
  const wPref = (c.weeklyMassPreference || '').toLowerCase();
  const sPref = (c.sundayMassPreference || '').toLowerCase();

  switch (massKey) {
    case 'tuesday':
      return wPref.includes('tuesday') || wPref.includes('අඟහරුවාදා') || wPref.includes('tue');
    case 'thursday':
      return wPref.includes('thursday') || wPref.includes('බ්‍රහස්පතින්දා') || wPref.includes('thu');
    case 'firstFriday':
      return wPref.includes('first friday') || wPref.includes('friday') || wPref.includes('සිකුරාදා') || wPref.includes('fri');
    case 'saturdayEnglish':
      return wPref.includes('saturday english') || wPref.includes('7.00') || wPref.includes('7:00') || wPref.includes('english') || (sPref.includes('english') && wPref.includes('saturday'));
    case 'saturdayVigil':
      return sPref.includes('saturday') || sPref.includes('6.00 pm') || sPref.includes('6:00 pm') || sPref.includes('සෙනසුරාදා') || sPref.includes('vigil');
    case 'sundayEarly':
      return sPref.includes('6.30') || sPref.includes('6:30') || sPref.includes('early') || sPref.includes('උදෑසන');
    case 'sundayMain':
      return sPref.includes('8.00') || sPref.includes('8:00') || sPref.includes('main') || sPref.includes('ප්‍රධාන');
    default:
      return false;
  }
}

/**
 * Get choristers who committed / told they will come for a specific session
 */
export function getExpectedChoristersForSession(session: PracticeSession, choristers: Chorister[]): Chorister[] {
  const activeSingers = choristers.filter((c) => c.role !== 'Instrument Player');
  const massKey = getMassKeyFromSession(session);

  if (massKey) {
    const relevant = activeSingers.filter((c) => isChoristerRelevantToMass(c, massKey));
    if (relevant.length > 0) return relevant;
  }

  // If not a specific mass or no preferences matched, check if attendance has explicit confirmed members
  return activeSingers;
}

export interface SessionAttendanceStats {
  isMass: boolean;
  massKey: MassKey | null;
  massConfig: MassMetadata | null;
  committedChoristers: Chorister[];
  committedTotal: number;
  committedPresent: number;
  committedLate: number;
  committedExcused: number;
  committedAbsent: number;
  // Primary percentage requested by user: Percentage from the people who told they were going to come
  committedRate: number;
  // Full choir stats
  fullTotal: number;
  fullPresent: number;
  fullLate: number;
  fullExcused: number;
  fullAbsent: number;
  fullRate: number;
}

/**
 * Calculate accurate attendance statistics for any session:
 * Takes attendance percentage from the people who told they are coming (committed/relevant members)
 * as the primary metric, with full choir attendance available as secondary breakdown.
 */
export function calculateSessionAttendanceStats(
  session: PracticeSession,
  choristers: Chorister[]
): SessionAttendanceStats {
  const activeSingers = choristers.filter((c) => c.role !== 'Instrument Player');
  const massKey = getMassKeyFromSession(session);
  const isMass = session.sessionType === 'mass' || Boolean(massKey);
  const massConfig = massKey ? MASS_CONFIGS[massKey] : null;

  const attendanceList = session.attendance || [];
  const recordMap = new Map<string, PracticeAttendanceRecord>(
    attendanceList.map((a) => [a.choristerId, a])
  );

  // Full choir counts
  let fullPresent = 0;
  let fullLate = 0;
  let fullExcused = 0;
  let fullAbsent = 0;

  activeSingers.forEach((c) => {
    const rec = recordMap.get(c.id);
    const st = rec ? rec.status : 'Absent';
    if (st === 'Present') fullPresent++;
    else if (st === 'Late') fullLate++;
    else if (st === 'Excused') fullExcused++;
    else fullAbsent++;
  });

  const fullTotal = activeSingers.length || 1;
  const fullRate = Math.round((fullPresent / fullTotal) * 100);

  // Committed / Expected counts (people who told they will come)
  let committedChoristers: Chorister[] = [];

  if (massKey) {
    committedChoristers = activeSingers.filter((c) => isChoristerRelevantToMass(c, massKey));
  }

  // If no mass key or 0 matched, fall back to active singers
  if (committedChoristers.length === 0) {
    committedChoristers = activeSingers;
  }

  let committedPresent = 0;
  let committedLate = 0;
  let committedExcused = 0;
  let committedAbsent = 0;

  committedChoristers.forEach((c) => {
    const rec = recordMap.get(c.id);
    const st = rec ? rec.status : 'Absent';
    if (st === 'Present') committedPresent++;
    else if (st === 'Late') committedLate++;
    else if (st === 'Excused') committedExcused++;
    else committedAbsent++;
  });

  const committedTotal = committedChoristers.length || 1;
  const committedRate = Math.round((committedPresent / committedTotal) * 100);

  return {
    isMass,
    massKey,
    massConfig,
    committedChoristers,
    committedTotal: committedChoristers.length,
    committedPresent,
    committedLate,
    committedExcused,
    committedAbsent,
    committedRate,
    fullTotal: activeSingers.length,
    fullPresent,
    fullLate,
    fullExcused,
    fullAbsent,
    fullRate,
  };
}

/**
 * Calculate accurate attendance statistics for a specific chorister across practices and masses.
 * Rule: 
 * - Masses: Chorister is only evaluated for Masses they actually belong to (based on weeklyMassPreference / sundayMassPreference), OR where they were marked Present/Late/Excused. They are NOT penalized for masses of other days/times!
 * - Rehearsals & Main Events: Evaluated across all practices (Feast, Carols, Christmas, Easter, General Practices).
 */
export function calculateChoristerAttendance(chorister: Chorister, practices: PracticeSession[]) {
  if (chorister.role === 'Instrument Player') {
    return {
      practicePercent: null,
      practiceTotal: 0,
      practicePresent: 0,
      massPercent: null,
      massTotal: 0,
      massPresent: 0,
      overallPercent: null,
      overallTotal: 0,
      overallPresent: 0,
    };
  }

  let practiceTotal = 0;
  let practicePresent = 0;
  let massTotal = 0;
  let massPresent = 0;

  (practices || []).forEach((p) => {
    const record = (p.attendance || []).find((a) => a.choristerId === chorister.id);
    const massKey = getMassKeyFromSession(p);
    const isMass = p.sessionType === 'mass' || Boolean(massKey);

    if (isMass) {
      // Check if this chorister belongs to this specific Mass
      const belongsToThisMass = massKey ? isChoristerRelevantToMass(chorister, massKey) : false;
      const attended = record ? (record.status === 'Present' || record.status === 'Late') : false;
      const excused = record ? record.status === 'Excused' : false;

      // Only evaluate this mass if the chorister belongs to this mass OR attended it
      if (belongsToThisMass || attended || excused) {
        massTotal++;
        if (attended) {
          massPresent++;
        }
      }
    } else {
      // General choir rehearsals and main events (Feast, Carols, Christmas, Easter) apply to all choristers
      practiceTotal++;
      if (record && (record.status === 'Present' || record.status === 'Late')) {
        practicePresent++;
      }
    }
  });

  const practicePercent = practiceTotal > 0 ? Math.round((practicePresent / practiceTotal) * 100) : null;
  const massPercent = massTotal > 0 ? Math.round((massPresent / massTotal) * 100) : null;
  const overallTotal = practiceTotal + massTotal;
  const overallPresent = practicePresent + massPresent;
  const overallPercent = overallTotal > 0 ? Math.round((overallPresent / overallTotal) * 100) : null;

  return {
    practicePercent,
    practiceTotal,
    practicePresent,
    massPercent,
    massTotal,
    massPresent,
    overallPercent,
    overallTotal,
    overallPresent,
  };
}

/**
 * Extracts the display short names of either Present or Absent members for an attendance session.
 */
export function getAttendanceNameList(
  session: PracticeSession,
  choristers: Chorister[],
  type: 'present' | 'absent'
): string[] {
  const activeSingers = choristers.filter((c) => c.role !== 'Instrument Player');
  const recordMap = new Map<string, PracticeAttendanceRecord>(
    (session.attendance || []).map((a) => [a.choristerId, a])
  );
  const massKey = getMassKeyFromSession(session);

  if (type === 'present') {
    const presentNames: string[] = [];
    activeSingers.forEach((c) => {
      const rec = recordMap.get(c.id);
      if (rec && (rec.status === 'Present' || rec.status === 'Late')) {
        presentNames.push(c.name);
      }
    });
    // Check if any attendee in records is not in activeSingers list
    (session.attendance || []).forEach((a) => {
      if (a.status === 'Present' || a.status === 'Late') {
        const found = activeSingers.find((c) => c.id === a.choristerId);
        if (!found && a.choristerName && !presentNames.includes(a.choristerName)) {
          presentNames.push(a.choristerName);
        }
      }
    });
    return presentNames;
  } else {
    // Absent list
    let targetChoristers = activeSingers;
    if (massKey) {
      const committed = activeSingers.filter((c) => isChoristerRelevantToMass(c, massKey));
      if (committed.length > 0) {
        targetChoristers = committed;
      }
    }

    const absentNames: string[] = [];
    targetChoristers.forEach((c) => {
      const rec = recordMap.get(c.id);
      const st = rec ? rec.status : 'Absent';
      if (st === 'Absent') {
        absentNames.push(c.name);
      }
    });
    return absentNames;
  }
}

/**
 * Copies the Present or Absent list to clipboard using short display names.
 */
export async function copyAttendanceListToClipboard(
  session: PracticeSession,
  choristers: Chorister[],
  type: 'present' | 'absent'
): Promise<{ success: boolean; count: number; text: string }> {
  const names = getAttendanceNameList(session, choristers, type);
  const title = session.eventTitle || session.focus || 'Choir Attendance';
  const typeLabel = type === 'present' ? 'Present' : 'Absent';

  let clipboardText = '';
  if (names.length === 0) {
    clipboardText = `*${typeLabel} (0) - ${title} (${session.date})*\n(No ${type} members recorded)`;
  } else {
    const items = names.map((name, idx) => `${idx + 1}. ${name}`).join('\n');
    clipboardText = `*${typeLabel} (${names.length}) - ${title} (${session.date})*\n${items}`;
  }

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(clipboardText);
      return { success: true, count: names.length, text: clipboardText };
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = clipboardText;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return { success: successful, count: names.length, text: clipboardText };
    }
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return { success: false, count: names.length, text: clipboardText };
  }
}


