import { Chorister } from '../types';

/**
 * Checks whether a given birthdate matches today's date (month and day).
 * Handles ISO formats ('YYYY-MM-DD'), slashed dates ('YYYY/MM/DD'), and fallback Date parsing.
 */
export function isBirthdayToday(birthdateStr?: string | null, referenceDate: Date = new Date()): boolean {
  if (!birthdateStr || typeof birthdateStr !== 'string') return false;
  const trimmed = birthdateStr.trim();
  if (!trimmed) return false;

  const currentMonth = referenceDate.getMonth() + 1; // 1 to 12
  const currentDay = referenceDate.getDate(); // 1 to 31

  // Handle standard YYYY-MM-DD or YYYY/MM/DD
  const parts = trimmed.split(/[-/.]/);
  if (parts.length === 3) {
    // ISO format: YYYY-MM-DD
    if (parts[0].length === 4) {
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      return m === currentMonth && d === currentDay;
    }
    // European / Sri Lankan format: DD-MM-YYYY
    if (parts[2].length === 4) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      return m === currentMonth && d === currentDay;
    }
  }

  // Fallback: Date constructor
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      const localMatch = (d.getMonth() + 1 === currentMonth) && (d.getDate() === currentDay);
      const utcMatch = (d.getUTCMonth() + 1 === currentMonth) && (d.getUTCDate() === currentDay);
      return localMatch || utcMatch;
    }
  } catch {
    // ignore
  }

  return false;
}

/**
 * Computes the chronological current age based on birthdate and reference date.
 * If reference date is on or after the person's birthday in that year, returns the newly turned age.
 */
export function calculateCurrentAge(birthdateStr?: string | null, referenceDate: Date = new Date()): number | null {
  if (!birthdateStr || typeof birthdateStr !== 'string') return null;
  const trimmed = birthdateStr.trim();
  if (!trimmed) return null;

  let birthYear: number | null = null;
  let birthMonth: number | null = null; // 1 to 12
  let birthDay: number | null = null; // 1 to 31

  const parts = trimmed.split(/[-/.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      // ISO: YYYY-MM-DD
      birthYear = parseInt(parts[0], 10);
      birthMonth = parseInt(parts[1], 10);
      birthDay = parseInt(parts[2], 10);
    } else if (parts[2].length === 4) {
      // European: DD-MM-YYYY
      birthDay = parseInt(parts[0], 10);
      birthMonth = parseInt(parts[1], 10);
      birthYear = parseInt(parts[2], 10);
    }
  }

  if (!birthYear || !birthMonth || !birthDay || isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      birthYear = d.getFullYear();
      birthMonth = d.getMonth() + 1;
      birthDay = d.getDate();
    }
  }

  if (birthYear && birthMonth && birthDay && birthYear > 1900 && birthYear <= referenceDate.getFullYear()) {
    const curYear = referenceDate.getFullYear();
    const curMonth = referenceDate.getMonth() + 1; // 1 to 12
    const curDay = referenceDate.getDate();

    let age = curYear - birthYear;
    if (curMonth < birthMonth || (curMonth === birthMonth && curDay < birthDay)) {
      age--;
    }
    return age >= 0 ? age : null;
  }

  return null;
}

/**
 * Returns the definitive, dynamic age for a chorister.
 * Evaluates their exact age from birthdate if available, otherwise falls back to chorister.age.
 */
export function getChoristerAge(chorister: Chorister, referenceDate: Date = new Date()): number {
  if (chorister.birthdate) {
    const computed = calculateCurrentAge(chorister.birthdate, referenceDate);
    if (computed !== null && computed >= 0) {
      return computed;
    }
  }
  return chorister.age || 0;
}

/**
 * Computes the age turning on today's birthday.
 */
export function calculateBirthdayAge(birthdateStr?: string | null, referenceDate: Date = new Date()): number | null {
  return calculateCurrentAge(birthdateStr, referenceDate);
}

/**
 * Filter an array of choristers down to those whose birthday is today.
 */
export function getTodayBirthdayChoristers(choristers: Chorister[], referenceDate: Date = new Date()): Chorister[] {
  if (!Array.isArray(choristers)) return [];
  return choristers.filter((c) => isBirthdayToday(c.birthdate, referenceDate));
}

/**
 * Formats the official Choir Fam birthday blessing message.
 * Today we joyfully celebrate the birthday of our dearest Chorister *NAME* ✨🎂🎶
 * Wishing you a joyful and Happy Birthday! [+94 77 703 8620] 🎉💖 May God bless you with good health, happiness, success, and peace, and may your life continue to be filled with beautiful music and joy. 😇🙏✨
 * With much love,
 * 🎼 Choir Fam ❤️
 */
export function formatBirthdayGreeting(chorister: Chorister, referenceDate: Date = new Date()): string {
  const rawName = (chorister.firstName || chorister.name || 'Chorister').trim();
  const upperName = rawName.toUpperCase();
  const phone = (chorister.phoneNumber || '').trim();
  const phoneSnippet = phone ? ` [${phone}]` : '';

  return `Today we joyfully celebrate the birthday of our dearest Chorister *${upperName}* ✨🎂🎶\n\nWishing you a joyful and Happy Birthday!${phoneSnippet} 🎉💖 May God bless you with good health, happiness, success, and peace, and may your life continue to be filled with beautiful music and joy. 😇🙏✨\nWith much love,\n\n🎼 Choir Fam ❤️`;
}
