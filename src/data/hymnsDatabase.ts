import { HymnalSong, HymnCategory } from '../types';
import { HYMNS_CATALOG } from './hymnsCatalog';
import { HYMNS_VOLUME_1 } from './hymnsVolume1';

const CUSTOM_LYRICS_KEY = 'koralawella_custom_hymn_lyrics';

// Get custom user-added or imported lyrics from localStorage
function getCustomLyricsMap(): Map<number, { chorus?: string; verses?: string[] }> {
  const map = new Map<number, { chorus?: string; verses?: string[] }>();
  if (typeof window === 'undefined') return map;
  try {
    const raw = localStorage.getItem(CUSTOM_LYRICS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((item: any) => {
          if (item && typeof item.number === 'number') {
            map.set(item.number, { chorus: item.chorus, verses: item.verses });
          }
        });
      }
    }
  } catch (e) {
    console.error('Error loading custom lyrics from localStorage', e);
  }
  return map;
}

// Built-in verified lyrics from Hymns Volume 1
const verifiedMap = new Map<number, HymnalSong>();
for (const h of HYMNS_VOLUME_1) {
  verifiedMap.set(h.number, h);
}

export function saveCustomHymnLyrics(number: number, chorus?: string, verses?: string[]) {
  if (typeof window === 'undefined') return;
  try {
    const map = getCustomLyricsMap();
    map.set(number, { chorus, verses });
    const array = Array.from(map.entries()).map(([num, data]) => ({
      number: num,
      chorus: data.chorus,
      verses: data.verses,
    }));
    localStorage.setItem(CUSTOM_LYRICS_KEY, JSON.stringify(array));
    // Trigger storage event or notify components
    window.dispatchEvent(new Event('hymn_lyrics_updated'));
  } catch (e) {
    console.error('Failed to save custom lyrics', e);
  }
}

export function importBulkHymnLyrics(items: { number: number; chorus?: string; verses?: string[] }[]) {
  if (typeof window === 'undefined') return;
  try {
    const map = getCustomLyricsMap();
    items.forEach((item) => {
      map.set(item.number, { chorus: item.chorus, verses: item.verses });
    });
    const array = Array.from(map.entries()).map(([num, data]) => ({
      number: num,
      chorus: data.chorus,
      verses: data.verses,
    }));
    localStorage.setItem(CUSTOM_LYRICS_KEY, JSON.stringify(array));
    window.dispatchEvent(new Event('hymn_lyrics_updated'));
  } catch (e) {
    console.error('Failed to import bulk lyrics', e);
  }
}

// Builds the merged list: Catalog + Verified Hymns + Custom/Uploaded Hymns
export function buildAllHymns(): HymnalSong[] {
  const customMap = getCustomLyricsMap();
  return HYMNS_CATALOG.map((item) => {
    // 1. Check user custom / uploaded lyrics first
    const custom = customMap.get(item.number);
    if (custom && ((custom.verses && custom.verses.length > 0) || custom.chorus)) {
      return {
        ...item,
        chorus: custom.chorus,
        verses: custom.verses,
      };
    }

    // 2. Check verified volume 1 hymns
    const verified = verifiedMap.get(item.number);
    if (verified) {
      return {
        ...item,
        chorus: verified.chorus,
        verses: verified.verses,
        subTitle: verified.subTitle,
      };
    }

    // 3. Keep without lyrics if not yet provided (do NOT show fake lyrics)
    return item;
  });
}

export const ALL_HYMNS: HymnalSong[] = buildAllHymns();

export function getHymnByNumber(num: number | string): HymnalSong | undefined {
  const n = typeof num === 'string' ? parseInt(num.trim(), 10) : num;
  if (isNaN(n)) return undefined;
  const currentList = buildAllHymns();
  return currentList.find((h) => h.number === n);
}

export function searchHymns(
  query: string,
  options?: {
    category?: string;
    liturgicalPart?: HymnCategory;
    limit?: number;
  }
): HymnalSong[] {
  const q = query.trim().toLowerCase();
  const limit = options?.limit || 50;
  const currentList = buildAllHymns();

  return currentList.filter((hymn) => {
    // Category filter
    if (options?.category && options.category !== 'all') {
      if (hymn.category !== options.category) return false;
    }

    // Liturgical part filter
    if (options?.liturgicalPart) {
      if (hymn.liturgicalPart !== options.liturgicalPart) return false;
    }

    if (!q) return true;

    // Search by number (exact match or startsWith)
    const numStr = hymn.number.toString();
    const paddedNum = hymn.number < 10 ? `0${numStr}` : numStr;
    if (numStr === q || paddedNum === q || numStr.startsWith(q)) return true;

    // Search by title (Sinhala substring)
    if (hymn.title.toLowerCase().includes(q)) return true;

    // Search in lyrics (if present)
    if (hymn.chorus && hymn.chorus.toLowerCase().includes(q)) return true;
    if (hymn.verses && hymn.verses.some((v) => v.toLowerCase().includes(q))) return true;

    return false;
  }).slice(0, limit);
}

export function formatHymnLabel(hymn: HymnalSong): string {
  const padded = hymn.number < 10 ? `0${hymn.number}` : `${hymn.number}`;
  return `${padded} - ${hymn.title}`;
}
