import { PracticeSession } from '../types';
import { getMassKeyFromSession, MassKey } from './massAttendanceUtils';

function getTargetMassKey(target: string): MassKey | null {
  const t = target.toLowerCase();
  if (t.includes('tuesday') || t.includes('අඟහරුවාදා')) return 'tuesday';
  if (t.includes('thursday') || t.includes('නුවානය') || t.includes('novena and holy mass') || t.includes('perpetual')) return 'thursday';
  if (t.includes('first friday') || t.includes('පළමු සිකුරාදා')) return 'firstFriday';
  if (t.includes('saturday english') || (t.includes('saturday') && (t.includes('7.00') || t.includes('7:00') || t.includes('english')))) return 'saturdayEnglish';
  if (t.includes('saturday sunday mass 6') || t.includes('saturday 6') || t.includes('vigil') || t.includes('සෙනසුරාදා')) return 'saturdayVigil';
  if (t.includes('sunday morning mass 6.30') || (t.includes('sunday') && (t.includes('6.30') || t.includes('6:30')))) return 'sundayEarly';
  if (t.includes('sunday morning mass 8') || (t.includes('sunday') && (t.includes('8') || t.includes('main')))) return 'sundayMain';
  return null;
}

function matchSpecificMassKeyword(pEvent: string, key: MassKey): boolean {
  switch (key) {
    case 'tuesday':
      return pEvent.includes('tuesday') || pEvent.includes('අඟහරුවාදා');
    case 'thursday':
      return pEvent.includes('thursday') || pEvent.includes('නුවානය') || (pEvent.includes('novena') && !pEvent.includes('feast'));
    case 'firstFriday':
      return pEvent.includes('first friday') || pEvent.includes('පළමු සිකුරාදා') || (pEvent.includes('friday') && !pEvent.includes('good friday'));
    case 'saturdayEnglish':
      return pEvent.includes('english') || (pEvent.includes('saturday') && pEvent.includes('7'));
    case 'saturdayVigil':
      return pEvent.includes('vigil') || (pEvent.includes('saturday') && (pEvent.includes('6') || pEvent.includes('mass 6')));
    case 'sundayEarly':
      return pEvent.includes('sunday') && (pEvent.includes('6.30') || pEvent.includes('6:30') || pEvent.includes('early'));
    case 'sundayMain':
      return pEvent.includes('sunday') && (pEvent.includes('8') || pEvent.includes('main'));
    default:
      return false;
  }
}

/**
 * Checks whether a practice session or mass attendance belongs strictly to a specific
 * event or liturgical service tab.
 * 
 * Rules:
 * 1. Weekly Mass attendance sessions (Tuesday, Thursday, First Friday, Saturday English,
 *    Sunday Vigil, Sunday 6:30 AM, Sunday 8:00 AM) NEVER appear in Feast Tab, Carols Tab,
 *    Christmas Tab, or Easter Tab.
 * 2. Feast Tab strictly only receives Feast rehearsals & practices (or explicit feast liturgies).
 * 3. Each Weekly Mass tab only receives sessions that belong to that specific Mass.
 * 4. Each Major Event tab (Carols, Christmas-New Year, Easter) only receives its own practices.
 */
export function isPracticeForEvent(practice: PracticeSession, eventTitle: string): boolean {
  if (!practice || !eventTitle) return false;
  const pEvent = (practice.eventTitle || '').toLowerCase().trim();
  const target = eventTitle.toLowerCase().trim();

  // Determine if the practice is a Weekly Mass attendance session
  const massKey = getMassKeyFromSession(practice);
  const isWeeklyMassSession = Boolean(massKey) || (
    practice.sessionType === 'mass' && !pEvent.includes('feast') && !pEvent.includes('michael')
  );

  // Determine target liturgical category
  const isTargetFeast = target.includes('feast') || target.includes('michael') || target.includes('patronal');
  const isTargetCarols = target.includes('carol') || target.includes('nine lessons');
  const isTargetChristmas = target.includes('christmas') || target.includes('nativity') || target.includes('new year');
  const isTargetEaster = target.includes('easter') || target.includes('holy week') || target.includes('paschal') || target.includes('triduum');
  const isTargetMajorEvent = isTargetFeast || isTargetCarols || isTargetChristmas || isTargetEaster;

  // RULE 1: Weekly Mass attendance sessions MUST NEVER leak into Feast or any Major Event tab
  if (isWeeklyMassSession && isTargetMajorEvent) {
    return false;
  }

  // RULE 2: If the target is Parish Feast & Nine Novenas
  if (isTargetFeast) {
    // If session explicitly belongs to a weekly mass day (Thursday Novena, Tuesday, First Friday, Sunday, Saturday), reject
    if (
      pEvent.includes('thursday') ||
      pEvent.includes('tuesday') ||
      pEvent.includes('first friday') ||
      pEvent.includes('sunday morning') ||
      pEvent.includes('saturday english') ||
      pEvent.includes('saturday sunday mass')
    ) {
      return false;
    }
    // Direct match
    if (pEvent === target) return true;
    if (pEvent.includes('feast') || pEvent.includes('michael') || pEvent.includes('patronal')) return true;
    if (pEvent.includes('novena') && !pEvent.includes('thursday') && !pEvent.includes('perpetual')) return true;
    
    // Inspect fallback notes/focus only if not a weekly mass
    if (!pEvent) {
      const focus = (practice.focus || '').toLowerCase();
      const notes = (practice.notes || '').toLowerCase();
      const combined = `${focus} ${notes}`;
      if (combined.includes('thursday') || combined.includes('tuesday') || combined.includes('sunday')) return false;
      if (combined.includes('feast') || combined.includes('michael')) return true;
    }
    return false;
  }

  // RULE 3: Other Major Events
  if (isTargetCarols) {
    if (isWeeklyMassSession) return false;
    if (pEvent === target) return true;
    return pEvent.includes('carol') || pEvent.includes('nine lessons');
  }

  if (isTargetChristmas) {
    if (isWeeklyMassSession) return false;
    if (pEvent === target) return true;
    return pEvent.includes('christmas') || pEvent.includes('nativity') || pEvent.includes('new year');
  }

  if (isTargetEaster) {
    if (isWeeklyMassSession) return false;
    if (pEvent === target) return true;
    return pEvent.includes('easter') || pEvent.includes('holy week') || pEvent.includes('paschal') || pEvent.includes('triduum');
  }

  // RULE 4: Weekly Mass target
  const targetMassKey = getTargetMassKey(target);
  if (targetMassKey) {
    if (massKey) {
      return massKey === targetMassKey;
    }
    if (pEvent === target) return true;
    return matchSpecificMassKeyword(pEvent, targetMassKey);
  }

  // Exact match for custom year plan events
  if (pEvent === target) return true;

  return false;
}

