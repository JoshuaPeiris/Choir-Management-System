import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  AlignCenter, 
  AlignLeft, 
  ZoomIn, 
  ZoomOut, 
  Link2, 
  RotateCcw, 
  Check, 
  Image as ImageIcon, 
  CheckCircle2, 
  Move, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Crop,
  Database,
  AlertCircle
} from 'lucide-react';
import { 
  getDriveDirectImageUrl, 
  extractDriveFileId, 
  DEFAULT_CHOIR_LOGO_DRIVE, 
  DEFAULT_CHOIR_LOGO_DIRECT,
  setChoirLogoUrl,
  setLogoCentered,
  getLogoImageScale,
  setLogoImageScale,
  getLogoImageOffsetX,
  setLogoImageOffsetX,
  getLogoImageOffsetY,
  setLogoImageOffsetY,
  getLogoFitMode,
  setLogoFitMode,
  LogoFitMode,
  saveBrandingToSupabase
} from '../utils/driveImage';
import { DriveUrlInput } from './DriveUrlInput';

interface LogoCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDriveUrl: string;
  isCentered: boolean;
  onApply: (driveUrl: string, isCentered: boolean, scale: number, offsetX: number, offsetY: number, fitMode: LogoFitMode) => void;
  onOpenFullDisplayLogo?: () => void;
}

const ZOOM_PRESETS = [
  { label: '50% (Zoom Out)', value: 50 },
  { label: '75%', value: 75 },
  { label: '100% (Original)', value: 100 },
  { label: '125% (Zoom In)', value: 125 },
  { label: '150% (Crop In)', value: 150 },
  { label: '200% (Tight Crop)', value: 200 }
];

export const LogoCustomizerModal: React.FC<LogoCustomizerModalProps> = ({
  isOpen,
  onClose,
  currentDriveUrl,
  isCentered,
  onApply,
  onOpenFullDisplayLogo,
}) => {
  const [driveInput, setDriveInput] = useState<string>(currentDriveUrl || DEFAULT_CHOIR_LOGO_DRIVE);
  const [centered, setCentered] = useState<boolean>(isCentered);
  const [imageScale, setImageScale] = useState<number>(() => getLogoImageScale());
  const [offsetX, setOffsetX] = useState<number>(() => getLogoImageOffsetX());
  const [offsetY, setOffsetY] = useState<number>(() => getLogoImageOffsetY());
  const [fitMode, setFitMode] = useState<LogoFitMode>(() => getLogoFitMode());
  const [saveToast, setSaveToast] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDriveInput(currentDriveUrl || DEFAULT_CHOIR_LOGO_DRIVE);
      setCentered(isCentered);
      setImageScale(getLogoImageScale());
      setOffsetX(getLogoImageOffsetX());
      setOffsetY(getLogoImageOffsetY());
      setFitMode(getLogoFitMode());
      setSaveToast(false);
      setIsSaving(false);
      setErrorMessage(null);
    }
  }, [isOpen, currentDriveUrl, isCentered]);

  if (!isOpen) return null;

  // Live direct preview image URL
  const previewDirectUrl = getDriveDirectImageUrl(driveInput.trim()) || DEFAULT_CHOIR_LOGO_DIRECT;

  const handleApply = async () => {
    setErrorMessage(null);
    setIsSaving(true);
    const finalUrl = driveInput.trim() || DEFAULT_CHOIR_LOGO_DRIVE;

    try {
      // 1. Write through to Supabase backend & update unified state
      await saveBrandingToSupabase({
        logoDriveUrl: finalUrl,
        isCentered: centered,
        imgScale: imageScale,
        offsetX,
        offsetY,
        fitMode,
      });

      // 2. Notify parent component
      onApply(finalUrl, centered, imageScale, offsetX, offsetY, fitMode);
      setSaveToast(true);
      setTimeout(() => {
        setSaveToast(false);
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Failed to save branding to Supabase backend:', err);
      setErrorMessage(err?.message || 'Failed to save to Supabase backend');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetCropAndZoom = () => {
    setImageScale(100);
    setOffsetX(0);
    setOffsetY(0);
    setFitMode('cover');
  };

  const handleResetAll = async () => {
    setDriveInput(DEFAULT_CHOIR_LOGO_DRIVE);
    setCentered(false);
    setImageScale(100);
    setOffsetX(0);
    setOffsetY(0);
    setFitMode('cover');
    setIsSaving(true);
    setErrorMessage(null);

    try {
      await saveBrandingToSupabase({
        logoDriveUrl: DEFAULT_CHOIR_LOGO_DRIVE,
        isCentered: false,
        imgScale: 100,
        offsetX: 0,
        offsetY: 0,
        fitMode: 'cover',
      });
      onApply(DEFAULT_CHOIR_LOGO_DRIVE, false, 100, 0, 0, 'cover');
      setSaveToast(true);
      setTimeout(() => {
        setSaveToast(false);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to reset branding on Supabase');
    } finally {
      setIsSaving(false);
    }
  };

  const nudge = (dx: number, dy: number) => {
    setOffsetX(prev => Math.min(100, Math.max(-100, prev + dx)));
    setOffsetY(prev => Math.min(100, Math.max(-100, prev + dy)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-[#111111] border border-amber-500/40 rounded-3xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222222] bg-gradient-to-r from-amber-950/40 via-[#161616] to-[#121212] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Crop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Crest Image Editor &amp; Cropper</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  <span>Supabase Synced</span>
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Scale, reposition, validate Drive link &amp; sync consistently to database
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-[#1C1C1C] hover:bg-[#282828] text-neutral-400 hover:text-white transition-colors border border-[#2E2E2E]"
            title="Close Customizer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error message if any */}
        {errorMessage && (
          <div className="px-5 py-2.5 bg-rose-500/15 border-b border-rose-500/30 flex items-center gap-2 text-xs font-semibold text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Circular Frame Live Preview */}
          <div className="bg-[#0A0A0A] p-5 rounded-2xl border border-[#262626] flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Live Frame Preview (Circular Crest Viewport)</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full">
              {/* Circular Crest Frame (100px) */}
              <div className="relative group">
                <div 
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-amber-500 shadow-2xl shadow-amber-500/30 overflow-hidden bg-black flex items-center justify-center relative select-none"
                  style={{ isolation: 'isolate' }}
                >
                  <img 
                    src={previewDirectUrl} 
                    alt="Choir Crest Inside Frame" 
                    referrerPolicy="no-referrer"
                    style={{
                      transform: `translate(${offsetX}%, ${offsetY}%) scale(${imageScale / 100})`,
                      transformOrigin: 'center center',
                      objectFit: fitMode,
                      width: '100%',
                      height: '100%',
                      filter: 'none',
                      mixBlendMode: 'normal'
                    }}
                    className="pointer-events-none transition-transform duration-75"
                  />
                  {/* Circular target guides */}
                  <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
                </div>
                <span className="text-[10px] text-neutral-400 font-mono block mt-1.5">
                  Zoom: {imageScale}% • X:{offsetX}% Y:{offsetY}%
                </span>
              </div>

              {/* Nudge & Pan Controls */}
              <div className="bg-[#141414] p-3 rounded-2xl border border-[#242424] flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1 flex items-center gap-1">
                  <Move className="w-3 h-3 text-amber-400" />
                  <span>Pan / Crop Image</span>
                </span>
                
                {/* D-Pad Buttons */}
                <button
                  type="button"
                  onClick={() => nudge(0, -4)}
                  className="p-1.5 rounded-lg bg-[#202020] hover:bg-amber-500 hover:text-black text-neutral-200 transition-colors border border-[#333333]"
                  title="Move Image Up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => nudge(-4, 0)}
                    className="p-1.5 rounded-lg bg-[#202020] hover:bg-amber-500 hover:text-black text-neutral-200 transition-colors border border-[#333333]"
                    title="Move Image Left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setOffsetX(0); setOffsetY(0); }}
                    className="px-2 py-1 rounded-lg bg-[#1C1C1C] hover:bg-[#282828] text-[10px] font-bold text-amber-300 border border-[#333333]"
                    title="Center Image"
                  >
                    Center
                  </button>
                  <button
                    type="button"
                    onClick={() => nudge(4, 0)}
                    className="p-1.5 rounded-lg bg-[#202020] hover:bg-amber-500 hover:text-black text-neutral-200 transition-colors border border-[#333333]"
                    title="Move Image Right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => nudge(0, 4)}
                  className="p-1.5 rounded-lg bg-[#202020] hover:bg-amber-500 hover:text-black text-neutral-200 transition-colors border border-[#333333]"
                  title="Move Image Down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Fit mode selector */}
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="text-[11px] text-neutral-400">Display:</span>
              <button
                type="button"
                onClick={() => setFitMode('cover')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  fitMode === 'cover' 
                    ? 'bg-amber-500 text-black font-bold' 
                    : 'bg-[#1C1C1C] text-neutral-300 border border-[#2E2E2E]'
                }`}
              >
                Fill Circle (Cover)
              </button>
              <button
                type="button"
                onClick={() => setFitMode('contain')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  fitMode === 'contain' 
                    ? 'bg-amber-500 text-black font-bold' 
                    : 'bg-[#1C1C1C] text-neutral-300 border border-[#2E2E2E]'
                }`}
              >
                Show All (Contain)
              </button>
            </div>

            {onOpenFullDisplayLogo && (
              <div className="pt-3 border-t border-[#1C1C1C] w-full flex justify-center">
                <button
                  type="button"
                  id="modal-launch-interactive-logo-btn"
                  onClick={() => {
                    onClose();
                    onOpenFullDisplayLogo();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/15 hover:from-amber-500/30 hover:to-amber-600/25 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-[1.02]"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin duration-3000" />
                  <span>🌟 Full Display Interactive Animation Experience</span>
                </button>
              </div>
            )}
          </div>

          {/* 1. Zoom / Scale Image Inside Frame */}
          <div className="space-y-2.5 bg-[#141414] p-4 rounded-2xl border border-[#242424]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                <ZoomIn className="w-3.5 h-3.5 text-amber-400" />
                <span>1. Image Size Inside Frame (Zoom / Scale)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetCropAndZoom}
                  className="text-[11px] text-neutral-400 hover:text-amber-300 underline"
                >
                  Reset Zoom
                </button>
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold font-mono">
                  {imageScale}%
                </span>
              </div>
            </div>

            {/* Slider with step buttons */}
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setImageScale(prev => Math.max(35, prev - 5))}
                className="p-2 rounded-xl bg-[#1F1F1F] hover:bg-[#2A2A2A] text-neutral-300 hover:text-white border border-[#333333] transition-colors shrink-0"
                title="Zoom Out (-5%)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              
              <input 
                type="range" 
                min={40} 
                max={250} 
                step={2}
                value={imageScale}
                onChange={(e) => setImageScale(Number(e.target.value))}
                className="w-full h-2 bg-[#222222] rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              <button
                type="button"
                onClick={() => setImageScale(prev => Math.min(250, prev + 5))}
                className="p-2 rounded-xl bg-[#1F1F1F] hover:bg-[#2A2A2A] text-neutral-300 hover:text-white border border-[#333333] transition-colors shrink-0"
                title="Zoom In (+5%)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Zoom Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
              {ZOOM_PRESETS.map((preset) => {
                const isActive = Math.abs(imageScale - preset.value) <= 4;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setImageScale(preset.value)}
                    className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold flex items-center justify-center transition-all ${
                      isActive 
                        ? 'bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/30 font-bold' 
                        : 'bg-[#1C1C1C] hover:bg-[#252525] text-neutral-300 border border-[#2E2E2E]'
                    }`}
                  >
                    <span>{preset.value}%</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Header Centering */}
          <div className="space-y-2 bg-[#141414] p-4 rounded-2xl border border-[#242424]">
            <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
              <AlignCenter className="w-3.5 h-3.5 text-amber-400" />
              <span>2. Navigation Header Alignment</span>
            </label>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setCentered(false)}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  !centered 
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10' 
                    : 'bg-[#1A1A1A] border-[#2E2E2E] text-neutral-400 hover:text-white hover:bg-[#222222]'
                }`}
              >
                <div className={`p-2 rounded-xl ${!centered ? 'bg-amber-500 text-black' : 'bg-[#262626] text-neutral-400'}`}>
                  <AlignLeft className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Left Aligned</div>
                  <div className="text-[10px] text-neutral-400">Crest on left, clock &amp; profile on right</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCentered(true)}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  centered 
                    ? 'bg-amber-500/20 border-amber-500 text-white shadow-lg shadow-amber-500/10' 
                    : 'bg-[#1A1A1A] border-[#2E2E2E] text-neutral-400 hover:text-white hover:bg-[#222222]'
                }`}
              >
                <div className={`p-2 rounded-xl ${centered ? 'bg-amber-500 text-black' : 'bg-[#262626] text-neutral-400'}`}>
                  <AlignCenter className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Center Aligned</div>
                  <div className="text-[10px] text-neutral-400">Prominently centered crest &amp; choir title</div>
                </div>
              </button>
            </div>
          </div>

          {/* 3. Google Drive Link Input with Unified Real-Time Validation */}
          <div className="space-y-2 bg-[#141414] p-4 rounded-2xl border border-[#242424]">
            <DriveUrlInput
              id="logo-drive-url-input"
              label="3. Logo Google Drive Link (Supabase Backend Persisted)"
              value={driveInput}
              onChange={setDriveInput}
              placeholder="https://drive.google.com/file/d/1IprWPQCkwJqZgsGJc2rn-dfdLAlGr4mr/view?usp=sharing"
              helperText="Changes are verified in real-time and consistently written through to the Supabase database."
              showPreviewThumbnail={false}
              required
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-4 border-t border-[#222222] bg-[#0E0E0E] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetAll}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-amber-300 hover:bg-[#1A1A1A] border border-[#2A2A2A] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Defaults</span>
          </button>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white bg-[#1C1C1C] hover:bg-[#262626] border border-[#303030] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-lg shadow-amber-500/30 transition-all font-sans cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving to Database...' : saveToast ? 'Saved & Applied!' : 'Save & Sync to Supabase'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
