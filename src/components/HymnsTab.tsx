import React, { useState, useMemo, useEffect } from 'react';
import { HymnalSong } from '../types';
import { ALL_HYMNS, buildAllHymns, saveCustomHymnLyrics, searchHymns } from '../data/hymnsDatabase';
import { HYMN_CATEGORIES } from '../data/hymnCategories';
import {
  Search,
  BookOpen,
  Music,
  Copy,
  Check,
  X,
  Volume2,
  ZoomIn,
  ZoomOut,
  Layers,
  Sparkles,
  BookMarked,
  Filter,
  Edit3,
  Save,
  Plus
} from 'lucide-react';

export const HymnsTab: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBook, setSelectedBook] = useState<'all' | '1' | '2'>('all');
  const [activeHymnForModal, setActiveHymnForModal] = useState<HymnalSong | null>(null);
  const [copiedHymnNum, setCopiedHymnNum] = useState<number | null>(null);
  const [fontSizeOffset, setFontSizeOffset] = useState<number>(0);
  const [lyricsVersion, setLyricsVersion] = useState(0);

  // Edit Lyrics in modal state
  const [isEditing, setIsEditing] = useState(false);
  const [editChorus, setEditChorus] = useState('');
  const [editVersesText, setEditVersesText] = useState('');

  useEffect(() => {
    const handleUpdate = () => {
      setLyricsVersion((v) => v + 1);
    };
    window.addEventListener('hymn_lyrics_updated', handleUpdate);
    return () => window.removeEventListener('hymn_lyrics_updated', handleUpdate);
  }, []);

  const openModal = (hymn: HymnalSong) => {
    setActiveHymnForModal(hymn);
    setIsEditing(false);
    setEditChorus(hymn.chorus || '');
    setEditVersesText((hymn.verses || []).join('\n\n'));
  };

  const handleSaveLyrics = () => {
    if (!activeHymnForModal) return;
    const cleanChorus = editChorus.trim() || undefined;
    const cleanVerses = editVersesText
      .split('\n\n')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    saveCustomHymnLyrics(activeHymnForModal.number, cleanChorus, cleanVerses.length > 0 ? cleanVerses : undefined);
    
    // Update local state
    const updated = {
      ...activeHymnForModal,
      chorus: cleanChorus,
      verses: cleanVerses,
    };
    setActiveHymnForModal(updated);
    setIsEditing(false);
    setLyricsVersion((v) => v + 1);
  };

  // Filtered Hymns
  const filteredHymns = useMemo(() => {
    let list = buildAllHymns();

    // Filter by book
    if (selectedBook === '1') {
      list = list.filter((h) => h.book === 'කිතුනු ගීතිකා 1');
    } else if (selectedBook === '2') {
      list = list.filter((h) => h.book === 'කිතුනු ගීතිකා 2');
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      list = list.filter((h) => h.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((h) => {
        const numStr = h.number.toString();
        const padded = h.number < 10 ? `0${h.number}` : numStr;
        if (numStr === q || padded === q || numStr.startsWith(q)) return true;
        if (h.title.toLowerCase().includes(q)) return true;
        if (h.chorus && h.chorus.toLowerCase().includes(q)) return true;
        if (h.verses && h.verses.some((v) => v.toLowerCase().includes(q))) return true;
        return false;
      });
    }

    return list;
  }, [searchQuery, selectedCategory, selectedBook]);

  const handleCopyText = (text: string, hymnNum: number) => {
    navigator.clipboard.writeText(text);
    setCopiedHymnNum(hymnNum);
    setTimeout(() => setCopiedHymnNum(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 text-white rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-700/60 border border-amber-600/60 rounded-full text-xs font-medium text-amber-200 mb-3">
            <BookMarked className="w-3.5 h-3.5" />
            <span>කිතුනු ගීතිකා සංග්‍රහය (Catholic Hymnal)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            ගීතිකා සංචිතය හා පදමාලා
          </h1>
          <p className="text-amber-100/90 text-sm sm:text-base leading-relaxed mb-6">
            1 සිට 755 දක්වා වූ සියලුම කිතුනු ගීතිකා අංකය හෝ නම මගින් සොයා ගන්න. ඕනෑම පූජාවක හෝ වැඩසටහනක ගීතිකා ඇතුළත් කිරීමේදී ස්වයංක්‍රීයව යෝජනා (Autocomplete Prompts) ලෙස ක්‍රියාත්මක වේ.
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span className="block text-xs text-amber-200">සමස්ත ගීතිකා</span>
              <span className="text-xl sm:text-2xl font-bold">755</span>
            </div>
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span className="block text-xs text-amber-200">කිතුනු ගීතිකා 1</span>
              <span className="text-xl sm:text-2xl font-bold">1 - 500</span>
            </div>
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span className="block text-xs text-amber-200">කිතුනු ගීතිකා 2</span>
              <span className="text-xl sm:text-2xl font-bold">501 - 755</span>
            </div>
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <span className="block text-xs text-amber-200">ප්‍රවර්ග ගණන</span>
              <span className="text-xl sm:text-2xl font-bold">17+</span>
            </div>
          </div>
        </div>

        {/* Decorative background art */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-8 translate-y-8">
          <BookOpen className="w-80 h-80" />
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-[#141414] rounded-xl shadow-md border border-[#242424] p-4 sm:p-5 space-y-4 text-[#E0E0E0]">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ගීතිකා අංකය හෝ නම ටයිප් කරන්න..."
            className="w-full pl-11 pr-10 py-3 text-sm sm:text-base bg-[#181818] border border-[#2E2E2E] text-white rounded-xl focus:ring-1 focus:ring-amber-500 focus:border-amber-500 focus:outline-none transition-all placeholder:text-neutral-500 shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Book Selector tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#222222]">
          <div className="flex items-center gap-1.5 p-1 bg-[#1A1A1A] rounded-lg text-xs font-medium border border-[#2A2A2A]">
            <button
              onClick={() => setSelectedBook('all')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedBook === 'all'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              සියලු පොත් (1 & 2)
            </button>
            <button
              onClick={() => setSelectedBook('1')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedBook === '1'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              කිතුනු ගීතිකා 1 (1 - 500)
            </button>
            <button
              onClick={() => setSelectedBook('2')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                selectedBook === '2'
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              කිතුනු ගීතිකා 2 (501 - 755)
            </button>
          </div>

          <div className="text-xs text-neutral-400 font-medium">
            ප්‍රතිඵල: <span className="font-bold text-amber-400">{filteredHymns.length}</span> / 755
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                : 'bg-[#1C1C1C] text-neutral-300 hover:bg-[#252525] border border-[#2B2B2B]'
            }`}
          >
            සියලු ප්‍රවර්ග (All)
          </button>
          {HYMN_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.nameSi)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat.nameSi
                  ? 'bg-amber-500 text-neutral-950 font-bold shadow-xs'
                  : 'bg-[#1C1C1C] text-neutral-300 hover:bg-[#252525] border border-[#2B2B2B]'
              }`}
            >
              {cat.nameSi}
            </button>
          ))}
        </div>
      </div>

      {/* Hymns List / Grid */}
      {filteredHymns.length === 0 ? (
        <div className="text-center py-16 bg-[#121212] rounded-2xl border border-dashed border-[#2A2A2A] p-8">
          <BookOpen className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-neutral-300">සොයන ගීතිකාව හමු නොවීය</h3>
          <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
            කරුණාකර ගීතිකා අංකය හෝ නම නිවැරදි දැයි පරීක්ෂා කර නැවත උත්සාහ කරන්න.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedBook('all');
            }}
            className="mt-4 px-4 py-2 bg-amber-500 text-neutral-950 text-xs font-bold rounded-lg hover:bg-amber-400 transition-colors"
          >
            සියල්ල පෙන්වන්න
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredHymns.map((hymn) => {
            const paddedNum = hymn.number < 10 ? `0${hymn.number}` : `${hymn.number}`;
            const isCopied = copiedHymnNum === hymn.number;

            return (
              <div
                key={hymn.number}
                className="bg-[#141414] rounded-xl border border-[#242424] hover:border-amber-500/50 p-4 shadow-sm transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-1 text-xs font-mono font-bold bg-amber-500/20 text-amber-300 rounded-lg group-hover:bg-amber-500/30 transition-colors border border-amber-500/30">
                      #{paddedNum}
                    </span>
                    <span className="text-[11px] text-neutral-400 bg-[#1C1C1C] border border-[#2A2A2A] px-2 py-0.5 rounded font-medium">
                      {hymn.book === 'කිතුනු ගීතිකා 1' ? 'පොත 1' : 'පොත 2'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                    {hymn.title}
                  </h3>

                  <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span>{hymn.category}</span>
                  </div>

                  {hymn.chorus && (
                    <div className="mt-2.5 p-2 bg-[#1A1A1A] rounded-lg border border-[#282828] text-xs text-neutral-300 italic line-clamp-2">
                      &quot;{hymn.chorus.split('\n')[0]}&quot;
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#222222] flex items-center justify-between gap-2">
                  <button
                    onClick={() => openModal(hymn)}
                    className="flex-1 py-2 px-2.5 text-xs font-bold bg-[#1C1C1C] hover:bg-amber-500/20 text-amber-300 border border-[#2B2B2B] hover:border-amber-500/40 rounded-lg transition-colors text-center flex items-center justify-center gap-1.5"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>{hymn.verses?.length || hymn.chorus ? 'පද පේළි බලන්න' : 'විස්තර / අංකය'}</span>
                  </button>

                  <button
                    onClick={() => {
                      const textToCopy = `${hymn.title} ${paddedNum}`;
                      handleCopyText(textToCopy, hymn.number);
                    }}
                    className={`p-2 rounded-lg border text-xs transition-colors flex items-center justify-center ${
                      isCopied
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'border-[#2B2B2B] text-neutral-400 hover:text-white hover:bg-[#1C1C1C]'
                    }`}
                    title="නම හා අංකය පිටපත් කරන්න"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Reader for Hymn Lyrics */}
      {activeHymnForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#141414] rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#2A2A2A] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-800 to-amber-900 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-amber-700 text-amber-100 rounded-md font-mono text-xs font-bold">
                    #{activeHymnForModal.number < 10 ? `0${activeHymnForModal.number}` : activeHymnForModal.number}
                  </span>
                  <span className="text-xs text-amber-200 font-medium">
                    {activeHymnForModal.category}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold">{activeHymnForModal.title}</h2>
              </div>

              <div className="flex items-center gap-2">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1.5 hover:bg-white/10 rounded-lg text-amber-200 hover:text-white transition-colors flex items-center gap-1 text-xs font-medium"
                    title="පද මාලාව සංස්කරණය කරන්න"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="hidden sm:inline">සංස්කරණය</span>
                  </button>
                )}

                {/* Font Size controls */}
                <div className="flex items-center bg-amber-950/40 rounded-lg p-0.5 border border-white/10">
                  <button
                    onClick={() => setFontSizeOffset((prev) => Math.max(prev - 2, -4))}
                    className="p-1 hover:bg-white/10 rounded text-white"
                    title="අකුරු ප්‍රමාණය කුඩා කරන්න"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setFontSizeOffset((prev) => Math.min(prev + 2, 8))}
                    className="p-1 hover:bg-white/10 rounded text-white"
                    title="අකුරු ප්‍රමාණය විශාල කරන්න"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => {
                    setActiveHymnForModal(null);
                    setIsEditing(false);
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-full text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content / Lyrics */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 bg-[#121212]">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-500/15 rounded-xl border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                    💡 <strong>නියම පද මාලාව ඇතුළත් කරන්න:</strong> ඔබ සතු ගීතිකා පොතෙන් හෝ PDF එකෙන් අත්වැල (Chorus) සහ පද්‍ය පේළි (Verses) මෙහි පිටපත් කර සුරකින්න.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                      අත්වැල / Chorus (විකල්ප)
                    </label>
                    <textarea
                      value={editChorus}
                      onChange={(e) => setEditChorus(e.target.value)}
                      rows={3}
                      placeholder="අත්වැලේ පද පේළි මෙහි ලියන්න හෝ paste කරන්න..."
                      className="w-full p-3 text-sm bg-[#181818] border border-[#2E2E2E] text-white rounded-xl focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1">
                      පද්‍ය පේළි / Verses (එක් එක් පදය හිස් පේළියකින් වෙන් කරන්න)
                    </label>
                    <textarea
                      value={editVersesText}
                      onChange={(e) => setEditVersesText(e.target.value)}
                      rows={8}
                      placeholder="1 වන පදය&#10;&#10;2 වන පදය&#10;&#10;3 වන පදය..."
                      className="w-full p-3 text-sm bg-[#181818] border border-[#2E2E2E] text-white rounded-xl focus:ring-1 focus:ring-amber-500 focus:outline-none font-sans"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-3.5 py-2 text-xs font-medium text-neutral-400 hover:text-white hover:bg-[#1E1E1E] rounded-xl"
                    >
                      අවලංගු කරන්න
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveLyrics}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>පදමාලාව සුරකින්න</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {activeHymnForModal.chorus && (
                    <div className="bg-[#1A1A1A] border-l-4 border-amber-500 rounded-r-xl p-4 shadow-sm border border-[#262626]">
                      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Music className="w-3.5 h-3.5 text-amber-400" />
                        <span>අත්වැල / ගායනා ඛණ්ඩය (Chorus)</span>
                      </div>
                      <p
                        className="font-medium text-neutral-100 whitespace-pre-line leading-relaxed"
                        style={{ fontSize: `${16 + fontSizeOffset}px` }}
                      >
                        {activeHymnForModal.chorus}
                      </p>
                    </div>
                  )}

                  {activeHymnForModal.verses && activeHymnForModal.verses.length > 0 ? (
                    <div className="space-y-3.5">
                      {activeHymnForModal.verses.map((verse, vIdx) => (
                        <div key={vIdx} className="bg-[#181818] p-4 rounded-xl border border-[#262626] shadow-xs">
                          <span className="inline-block px-2.5 py-0.5 bg-[#222222] border border-[#2F2F2F] text-amber-300 rounded text-[11px] font-bold mb-2">
                            පදය {vIdx + 1}
                          </span>
                          <p
                            className="text-neutral-200 whitespace-pre-line leading-relaxed"
                            style={{ fontSize: `${15 + fontSizeOffset}px` }}
                          >
                            {verse}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : !activeHymnForModal.chorus ? (
                    <div className="text-center py-8 text-neutral-500 space-y-3">
                      <BookOpen className="w-10 h-10 text-amber-500/40 mx-auto" />
                      <div>
                        <p className="font-semibold text-neutral-200">
                          {activeHymnForModal.title} (ගීතිකා #{activeHymnForModal.number})
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {activeHymnForModal.book} ({activeHymnForModal.category})
                        </p>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          මෙම ගීතිකාවේ නිල පද මාලාව තවමත් පද්ධතියට ඇතුළත් කර නොමැත.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-bold shadow-sm transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>නියම පද මාලාව ඇතුළත් කරන්න</span>
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 sm:p-4 bg-[#0D0D0D] border-t border-[#222222] flex items-center justify-between gap-3">
              <span className="text-xs text-neutral-400 font-medium">
                {activeHymnForModal.book}
              </span>

              <div className="flex items-center gap-2">
                {(activeHymnForModal.chorus || (activeHymnForModal.verses && activeHymnForModal.verses.length > 0)) && (
                  <button
                    onClick={() => {
                      const padded = activeHymnForModal.number < 10 ? `0${activeHymnForModal.number}` : `${activeHymnForModal.number}`;
                      let text = `✝️ ${activeHymnForModal.title} (${padded})\n\n`;
                      if (activeHymnForModal.chorus) {
                        text += `[අත්වැල]\n${activeHymnForModal.chorus}\n\n`;
                      }
                      if (activeHymnForModal.verses) {
                        activeHymnForModal.verses.forEach((v, i) => {
                          text += `[පදය ${i + 1}]\n${v}\n\n`;
                        });
                      }
                      handleCopyText(text, activeHymnForModal.number);
                    }}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    {copiedHymnNum === activeHymnForModal.number ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-950" />
                        <span>පිටපත් විය!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>සම්පූර්ණ පදමාලාව පිටපත් කරන්න</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
