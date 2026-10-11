import React, { useState, useRef, useEffect } from 'react';
import { HymnalSong, HymnCategory } from '../types';
import { searchHymns } from '../data/hymnsDatabase';
import { Search, Book, Music, X, ChevronDown } from 'lucide-react';

interface HymnAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectHymn?: (hymn: HymnalSong) => void;
  placeholder?: string;
  liturgicalPart?: HymnCategory;
  category?: string;
  className?: string;
  id?: string;
  showCategoryBadge?: boolean;
  theme?: 'light' | 'dark';
}

export const HymnAutocompleteInput: React.FC<HymnAutocompleteInputProps> = ({
  value,
  onChange,
  onSelectHymn,
  placeholder = 'ගීතිකාවේ නම හෝ අංකය ටයිප් කරන්න...',
  liturgicalPart,
  category,
  className = '',
  id,
  showCategoryBadge = true,
  theme = 'dark',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  // Suggestions search
  const suggestions = React.useMemo(() => {
    if (!isOpen) return [];
    const trimmed = value.trim();
    if (!trimmed) {
      // Return top 8 hymns matching liturgical part or category
      return searchHymns('', {
        liturgicalPart,
        category,
        limit: 10,
      });
    }
    // Search with priority
    const results = searchHymns(trimmed, {
      liturgicalPart,
      category,
      limit: 15,
    });

    // If few or no results found within the category, search across all hymns
    if (results.length < 5 && (liturgicalPart || category)) {
      const allResults = searchHymns(trimmed, { limit: 15 });
      const existingIds = new Set(results.map((r) => r.number));
      for (const item of allResults) {
        if (!existingIds.has(item.number)) {
          results.push(item);
        }
      }
    }
    return results;
  }, [value, isOpen, liturgicalPart, category]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (hymn: HymnalSong) => {
    const formatted = `${hymn.title} ${hymn.number < 10 ? '0' + hymn.number : hymn.number}`;
    onChange(formatted);
    if (onSelectHymn) {
      onSelectHymn(hymn);
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions[highlightedIndex]) {
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          value={value ?? ''}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full pr-16 pl-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none transition-shadow ${
            isDark
              ? 'bg-[#181818] border-[#333333] text-white placeholder:text-neutral-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-400'
          } ${className}`}
        />
        <div className="absolute right-2 flex items-center gap-1">
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(true);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-gray-400 hover:text-amber-600 rounded transition-colors"
            title="Browse suggestions"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          className={`absolute z-50 left-0 right-0 mt-1 max-h-72 overflow-y-auto rounded-xl shadow-2xl border divide-y animate-in fade-in slide-in-from-top-1 duration-150 ${
            isDark
              ? 'bg-[#181818] border-[#333333] divide-[#262626] text-white'
              : 'bg-white border-amber-200 divide-gray-100 text-gray-800'
          }`}
        >
          <div
            className={`px-3 py-1.5 text-[11px] font-medium flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm ${
              isDark ? 'bg-[#121212]/95 text-amber-300 border-b border-[#262626]' : 'bg-amber-50/90 text-amber-800'
            }`}
          >
            <span className="flex items-center gap-1">
              <Book className="w-3 h-3 text-amber-500" />
              යෝජිත ගීතිකා (Hymn Prompts)
            </span>
            <span className={isDark ? 'text-neutral-400' : 'text-gray-500'}>
              ගීතිකා {suggestions.length} ක්
            </span>
          </div>

          {suggestions.map((hymn, idx) => {
            const isSelected = idx === highlightedIndex;
            const paddedNum = hymn.number < 10 ? `0${hymn.number}` : `${hymn.number}`;

            return (
              <button
                key={hymn.number}
                type="button"
                onClick={() => handleSelect(hymn)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition-colors ${
                  isSelected
                    ? isDark
                      ? 'bg-amber-950/60 text-amber-100'
                      : 'bg-amber-100/70 text-amber-950'
                    : isDark
                    ? 'hover:bg-[#222222] text-neutral-200'
                    : 'hover:bg-amber-50 text-gray-800'
                }`}
              >
                <span
                  className={`shrink-0 px-2 py-0.5 mt-0.5 text-xs font-mono font-bold rounded-md shadow-xs ${
                    isDark
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  #{paddedNum}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`font-semibold text-sm truncate ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {hymn.title}
                    </span>
                    {showCategoryBadge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium truncate ${
                          isDark
                            ? 'bg-[#262626] text-neutral-300'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {hymn.category}
                      </span>
                    )}
                  </div>

                  {hymn.chorus && (
                    <p
                      className={`text-xs truncate mt-0.5 italic ${
                        isDark ? 'text-neutral-400' : 'text-gray-500'
                      }`}
                    >
                      "{hymn.chorus.split('\n')[0]}"
                    </p>
                  )}
                </div>

                <span
                  className={`text-[10px] shrink-0 self-center ${
                    isDark ? 'text-neutral-500' : 'text-gray-400'
                  }`}
                >
                  {hymn.book === 'කිතුනු ගීතිකා 1' ? 'පොත 1' : 'පොත 2'}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {isOpen && suggestions.length === 0 && value.trim() && (
        <div
          className={`absolute z-50 left-0 right-0 mt-1 p-3 rounded-lg shadow-xl border text-center text-xs ${
            isDark
              ? 'bg-[#181818] border-[#333333] text-neutral-400'
              : 'bg-white border-gray-200 text-gray-500'
          }`}
        >
          ගීතිකා හමු නොවීය. ("{value}")
        </div>
      )}
    </div>
  );
};
