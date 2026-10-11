export function parseTargetDate(dateStr?: string | null): Date {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date();
  }
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      // Feast and event liturgies target 08:00 AM local time
      return new Date(year, month, day, 8, 0, 0, 0);
    }
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export function formatDetailedCountdown(targetDateStr?: string | null, referenceDate: Date = new Date()): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
  isUnlocked: boolean;
  daysUntilUnlock: number;
} {
  if (!targetDateStr || typeof targetDateStr !== 'string') {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: false,
      isUnlocked: true,
      daysUntilUnlock: 0,
    };
  }

  const target = parseTargetDate(targetDateStr);
  const now = referenceDate || new Date();
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isPast: true,
      isUnlocked: true,
      daysUntilUnlock: 0,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const isUnlocked = days <= 100;
  const daysUntilUnlock = Math.max(0, days - 100);

  return {
    days,
    hours,
    minutes,
    seconds,
    isPast: false,
    isUnlocked,
    daysUntilUnlock,
  };
}

export function getDaysRemaining(targetDateStr?: string | null, referenceDate: Date = new Date()): number {
  return formatDetailedCountdown(targetDateStr, referenceDate).days;
}

export function isWithin100Days(targetDateStr?: string | null, referenceDate: Date = new Date()): boolean {
  const days = getDaysRemaining(targetDateStr, referenceDate);
  return days >= 0 && days <= 100;
}

export function formatLiveDateTime(date: Date): {
  dateString: string;
  timeString: string;
  weekday: string;
} {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dateString = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeString = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return {
    dateString,
    timeString,
    weekday,
  };
}
