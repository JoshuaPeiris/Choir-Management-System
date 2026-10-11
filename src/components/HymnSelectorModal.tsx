import React, { useState, useMemo } from 'react';
import { Search, X, Music, Book, Check, Sparkles, Filter } from 'lucide-react';
import { HymnalSong, HymnCategory } from '../types';
import { buildAllHymns } from '../data/hymnsDatabase';
import { HYMN_CATEGORIES } from '../data/hymnCategories';

interface HymnSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (hymnFormattedText: string, hymn: HymnalSong) => void;
  title?: string;
  targetSlotLabel?: string;
  defaultCategory?: string;
  defaultLiturgicalPart?: HymnCategory | string;
}

export const HymnSelectorModal: React.FC<HymnSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = 'Select Hymn from Hymnal Database',
  targetSlotLabel,
  defaultCategory,
  defaultLiturgicalPart,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    defaultCategory || defaultLiturgicalPart || 'all'
  );
  const [selectedBook, setSelectedBook] = useState<'all' | '1' | '2'>('all');
  const [previewLyricsHymn, setPreviewLyricsHymn] = useState<HymnalSong | null>(null);

  const allHymns = useMemo(() => buildAllHymns(), []);

  // Filtered hymns list
  const filteredHymns = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return allHymns.filter((hymn) => {
      // Book filter
      if (selectedBook === '1' && hymn.book !== 'කිතුනු ගීතිකා 1') return false;
      if (selectedBook === '2' && hymn.book !== 'කිතුනු ගීතිකා 2') return false;

      // Category / Liturgical part filter
      if (selectedCategory !== 'all') {
        const matchesCategory =
          hymn.category === selectedCategory ||
          hymn.liturgicalPart === selectedCategory;

        if (!matchesCategory) {
          // Check if category is part of sinahala name
          const catInfo = HYMN_CATEGORIES.find(
            (c) => c.id === selectedCategory || c.nameEn === selectedCategory || c.liturgicalPart === selectedCategory
          );
          if (catInfo) {
            if (hymn.liturgicalPart !== catInfo.liturgicalPart && hymn.category !== catInfo.nameSi) {
              return false;
            }
          } else {
            return false;
          }
        }
      }

      // Search Query
      if (!q) return true;

      const numStr = hymn.number.toString();
      const paddedNum = hymn.number < 10 ? `0${numStr}` : numStr;

      if (numStr === q || paddedNum === q || numStr.startsWith(q)) return true;
      if (hymn.title.toLowerCase().includes(q)) return true;
      if (hymn.chorus && hymn.chorus.toLowerCase().includes(q)) return true;
      if (hymn.verses && hymn.verses.some((v) => v.toLowerCase().includes(q))) return true;

      return false;
    });
  }, [allHymns, searchQuery, selectedCategory, selectedBook]);

  if (!isOpen) return null;

  const handleChooseHymn = (hymn: HymnalSong) => {
    const formatted = `${hymn.title} ${hymn.number < 10 ? '0' + hymn.number : hymn.number}`;
    onSelect(formatted, hymn);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div 
        id="hymn-selector-modal"
        className="bg-[#121212] border border-[#2A2A2A] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-[#181818] border-b border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Book className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{title}</h3>
                {targetSlotLabel && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-neutral-950">
                    Slot: {targetSlotLabel}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">
                Browse through official Sinhala Church Hymnals (කිතුනු ගීතිකා 1 & 2)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Filters */}
        <div className="p-4 bg-[#151515] border-b border-[#222222] space-y-3">
          {/* Search bar */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 pointer-events-none" />
            <input
              id="hymn-search-input"
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Sinhala Title or Hymn Number (e.g. 04, 120, සමිඳුනි)..."
              className="w-full pl-9 pr-8 py-2 bg-[#0D0D0D] border border-[#333333] rounded-xl text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-neutral-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Chips Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-neutral-950 shadow-xs'
                  : 'bg-[#1F1F1F] text-neutral-300 hover:bg-[#2A2A2A] hover:text-white border border-[#303030]'
              }`}
            >
              All Hymns ({allHymns.length})
            </button>
            <button
              onClick={() => setSelectedCategory('Entrance')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'Entrance'
                  ? 'bg-amber-500 text-neutral-950 shadow-xs'
                  : 'bg-[#1F1F1F] text-neutral-300 hover:bg-[#2A2A2A] hover:text-white border border-[#303030]'
              }`}
            >
              Entrance (ඇතුල්වීම)
            </button>
            <button
              onClick={() => setSelectedCategory('Offertory')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'Offertory'
                  ? 'bg-amber-500 text-neutral-950 shadow-xs'
                  : 'bg-[#1F1F1F] text-neutral-300 hover:bg-[#2A2A2A] hover:text-white border border-[#303030]'
              }`}
            >
              Offertory (පුදසුන)
            </button>
            <button
              onClick={() => setSelectedCategory('Communion')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'Communion'
                  ? 'bg-amber-500 text-neutral-950 shadow-xs'
                  : 'bg-[#1F1F1F] text-neutral-300 hover:bg-[#2A2A2A] hover:text-white border border-[#303030]'
              }`}
            >
              Communion (දිව්‍ය භෝජන)
            </button>
            <button
              onClick={() => setSelectedCategory('Recessional')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'Recessional'
                  ? 'bg-amber-500 text-neutral-950 shadow-xs'
                  : 'bg-[#1F1F1F] text-neutral-300 hover:bg-[#2A2A2A] hover:text-white border border-[#303030]'
              }`}
            >
              Recessional / Final (සමුගැනීම)
            </button>
            <button
              onClick={() => setSelectedCategory('මරිය තුමියට ගීතිකා')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'මරිය තුමියට ගීතිකා'
                  ? 'bg-amber-500 text-neutral-950 shadow-xs'
                  : 'bg-[#1F1F1F] text-neutral-300 hover:bg-[#2A2A2A] hover:text-white border border-[#303030]'
              }`}
            >
              Marian (මරිය තුමියට)
            </button>
            <button
              onClick={() => setSelectedCategory('සාන්තුවරුන්ට ගීතිකා')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'සාන්තුවරුන්ට ගීතිකා'
                  ? 'bg-amber-500 text-neutral-950 shadow-xs'
                  : 'bg-[#1F1F1F] text-neutral-300 hover:bg-[#2A2A2A] hover:text-white border border-[#303030]'
              }`}
            >
              Saints / St. Michael (සාන්තුවරුන්ට)
            </button>
            <button
              onClick={() => setSelectedCategory('Responsorial Psalm')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'Responsorial Psalm'
                  ? 'bg-amber-500 text-neutral-950 shadow-xs'
                  : 'bg-[#1F1F1F] text-neutral-300 hover:bg-[#2A2A2A] hover:text-white border border-[#303030]'
              }`}
            >
              Psalms (තෙහිලි ගී)
            </button>
          </div>

          {/* Book Filter Bar & Count */}
          <div className="flex items-center justify-between text-[11px] text-neutral-400">
            <div className="flex items-center gap-1.5">
              <span>Hymnal Book:</span>
              <button
                onClick={() => setSelectedBook('all')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  selectedBook === 'all'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-[#1E1E1E] text-neutral-400 hover:text-white'
                }`}
              >
                All Books
              </button>
              <button
                onClick={() => setSelectedBook('1')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  selectedBook === '1'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-[#1E1E1E] text-neutral-400 hover:text-white'
                }`}
              >
                Book 1 (1 - 500)
              </button>
              <button
                onClick={() => setSelectedBook('2')}
                className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  selectedBook === '2'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-[#1E1E1E] text-neutral-400 hover:text-white'
                }`}
              >
                Book 2 (501+)
              </button>
            </div>
            <span>
              Showing <strong className="text-white">{filteredHymns.length}</strong> hymns
            </span>
          </div>
        </div>

        {/* Hymns Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#1F1F1F] p-2 sm:p-3 space-y-1">
          {filteredHymns.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">
              <Music className="w-8 h-8 text-neutral-600 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-semibold">No hymns found matching "{searchQuery}"</p>
              <p className="text-[11px] text-neutral-500 mt-1">Try clearing filters or search by song number</p>
            </div>
          ) : (
            filteredHymns.map((hymn) => {
              const paddedNum = hymn.number < 10 ? `0${hymn.number}` : `${hymn.number}`;
              const isPreviewOpen = previewLyricsHymn?.number === hymn.number;

              return (
                <div
                  key={hymn.number}
                  className="p-2.5 rounded-xl bg-[#161616] hover:bg-[#1C1C1C] border border-transparent hover:border-[#2E2E2E] transition-all flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="w-11 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                        #{paddedNum}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs font-bold text-white truncate">
                            {hymn.title}
                          </h4>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-[#242424] text-neutral-300 border border-[#333]">
                            {hymn.category}
                          </span>
                        </div>
                        {hymn.chorus && (
                          <p className="text-[11px] text-neutral-400 italic truncate mt-0.5">
                            "{hymn.chorus.split('\n')[0]}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {hymn.chorus || (hymn.verses && hymn.verses.length > 0) ? (
                        <button
                          type="button"
                          onClick={() => setPreviewLyricsHymn(isPreviewOpen ? null : hymn)}
                          className="px-2 py-1 rounded-lg text-[10px] font-semibold text-neutral-400 hover:text-white bg-[#222222] hover:bg-[#2A2A2A] transition-colors"
                        >
                          {isPreviewOpen ? 'Hide Lyrics' : 'Preview'}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => handleChooseHymn(hymn)}
                        className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 transition-colors shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Select</span>
                      </button>
                    </div>
                  </div>

                  {/* Expandable lyrics preview */}
                  {isPreviewOpen && (
                    <div className="mt-1 p-3 rounded-lg bg-[#0E0E0E] border border-amber-500/20 text-neutral-300 text-xs font-serif leading-relaxed animate-in fade-in">
                      {hymn.chorus && (
                        <div className="mb-2">
                          <span className="text-[10px] font-bold uppercase text-amber-400 block font-sans">
                            Chorus (ප්‍රත්‍යාලිංගය):
                          </span>
                          <p className="whitespace-pre-line text-neutral-200">{hymn.chorus}</p>
                        </div>
                      )}
                      {hymn.verses && hymn.verses.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-neutral-400 block font-sans">
                            Verses (පද):
                          </span>
                          {hymn.verses.slice(0, 2).map((verse, idx) => (
                            <p key={idx} className="whitespace-pre-line text-neutral-300">
                              <span className="text-amber-500/80 mr-1.5 font-sans font-bold">{idx + 1}.</span>
                              {verse}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#181818] border-t border-[#262626] flex items-center justify-between text-xs text-neutral-400">
          <span>Click <strong>Select</strong> to instantly insert the hymn into the slot.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#242424] hover:bg-[#303030] text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
