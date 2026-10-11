import React, { useState, useEffect, useMemo } from 'react';
import { 
  Link2, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles, 
  ExternalLink, 
  Copy, 
  Check, 
  Folder, 
  Image as ImageIcon, 
  HelpCircle,
  RefreshCw,
  Eye,
  ShieldCheck
} from 'lucide-react';
import { validateDriveUrl, normalizeDriveUrl, DriveValidationResult, getDriveDirectImageFallbackUrl } from '../utils/driveValidation';

interface DriveUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  required?: boolean;
  allowGenericImages?: boolean;
  requireImageFile?: boolean;
  showPreviewThumbnail?: boolean;
  autoNormalizeOnBlur?: boolean;
  className?: string;
  id?: string;
}

export const DriveUrlInput: React.FC<DriveUrlInputProps> = ({
  value,
  onChange,
  placeholder = 'Paste Google Drive sharing link (e.g. https://drive.google.com/file/d/.../view?usp=sharing)',
  label,
  helperText,
  required = false,
  allowGenericImages = true,
  requireImageFile = false,
  showPreviewThumbnail = true,
  autoNormalizeOnBlur = true,
  className = '',
  id,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [imgLoadError, setImgLoadError] = useState(false);
  const [imgTryFallback, setImgTryFallback] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Validate the URL in real-time
  const validation: DriveValidationResult = useMemo(() => {
    return validateDriveUrl(value, {
      allowGenericImages,
      required,
      requireImageFile,
    });
  }, [value, allowGenericImages, required, requireImageFile]);

  // Reset image error when value changes
  useEffect(() => {
    setImgLoadError(false);
    setImgTryFallback(false);
  }, [value]);

  const handleCopyFileId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!validation.fileId) return;
    navigator.clipboard.writeText(validation.fileId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleAutoClean = () => {
    if (validation.cleanUrl && validation.cleanUrl !== value) {
      onChange(validation.cleanUrl);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (autoNormalizeOnBlur && validation.isValid && validation.cleanUrl && validation.isDriveUrl) {
      if (value.trim() !== validation.cleanUrl) {
        onChange(validation.cleanUrl);
      }
    }
  };

  // Border & Glow styling based on real-time validation status
  const getValidationBorderStyles = () => {
    if (!value || !value.trim()) {
      return required
        ? 'border-neutral-700 focus-within:border-amber-500'
        : 'border-[#2D2D2D] focus-within:border-amber-500/70';
    }

    if (validation.isValid) {
      if (validation.isDriveUrl) {
        return validation.isFolder 
          ? 'border-blue-500/80 ring-1 ring-blue-500/30'
          : 'border-emerald-500/80 ring-1 ring-emerald-500/30';
      }
      return 'border-amber-500/80 ring-1 ring-amber-500/30';
    }

    return 'border-rose-500 ring-2 ring-rose-500/20';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label and Quick Action Bar */}
      <div className="flex items-center justify-between flex-wrap gap-1">
        {label && (
          <label 
            htmlFor={id} 
            className="block text-xs font-bold text-neutral-300 uppercase tracking-wide flex items-center gap-1.5"
          >
            <Link2 className="w-3.5 h-3.5 text-amber-400" />
            <span>{label}</span>
            {required && <span className="text-amber-400">*</span>}
          </label>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {validation.isValid && validation.isDriveUrl && validation.cleanUrl !== value && (
            <button
              type="button"
              onClick={handleAutoClean}
              className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 transition-colors"
              title="Clean URL and remove tracking parameters"
            >
              <Sparkles className="w-3 h-3" />
              <span>Sanitize Link</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="text-[10px] text-neutral-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            title="Google Drive link formatting tips"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Link Guide</span>
          </button>
        </div>
      </div>

      {/* Main Input Box with Real-time Feedback Status */}
      <div className={`relative flex items-center rounded-xl bg-[#141414] transition-all duration-200 ${getValidationBorderStyles()}`}>
        {/* Leading Status Icon */}
        <div className="pl-3 pr-2 flex items-center justify-center shrink-0">
          {!value || !value.trim() ? (
            <Link2 className="w-4 h-4 text-neutral-500" />
          ) : validation.isValid ? (
            validation.isDriveUrl ? (
              validation.isFolder ? (
                <Folder className="w-4 h-4 text-blue-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 animate-in zoom-in-50 duration-200" />
              )
            ) : (
              <ImageIcon className="w-4 h-4 text-amber-400" />
            )
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 animate-pulse" />
          )}
        </div>

        {/* Text Input */}
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          className="w-full py-2.5 pr-20 bg-transparent text-xs text-white placeholder-neutral-500 font-mono focus:outline-none selection:bg-amber-500 selection:text-black"
        />

        {/* Trailing Controls (Clear & Open external) */}
        <div className="absolute right-2 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1 rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Clear input"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {validation.isValid && validation.cleanUrl && (
            <a
              href={validation.cleanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded-md text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
              title="Test & Open in Google Drive"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Real-time Status Indicators & Metadata Badge */}
      {value && value.trim() && (
        <div className="space-y-2 animate-in fade-in duration-200">
          {/* Status Chip Row */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-[11px]">
            {validation.isValid ? (
              <div className="flex items-center gap-2 flex-wrap">
                {validation.isDriveUrl ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Google Drive Verified</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                    <ImageIcon className="w-3 h-3 text-amber-400" />
                    <span>Direct Web Image</span>
                  </span>
                )}

                {/* File ID Display Chip */}
                {validation.fileId && (
                  <button
                    type="button"
                    onClick={handleCopyFileId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1C1C1C] hover:bg-[#252525] text-neutral-300 hover:text-white border border-[#303030] font-mono text-[10px] transition-colors"
                    title="Click to copy Google Drive File ID"
                  >
                    <span>ID: {validation.fileId.slice(0, 8)}...{validation.fileId.slice(-6)}</span>
                    {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-400" />}
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-rose-400 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{validation.error}</span>
              </div>
            )}
          </div>

          {/* Live Thumbnail Preview & Accessibility Card */}
          {showPreviewThumbnail && validation.isValid && validation.directThumbnailUrl && (
            <div className="p-2.5 rounded-xl bg-[#0F0F0F] border border-[#242424] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-amber-500/40 bg-black shrink-0 relative flex items-center justify-center">
                  {!imgLoadError ? (
                    <img
                      src={
                        imgTryFallback
                          ? `/api/image-proxy?url=${encodeURIComponent(value)}`
                          : (validation.directThumbnailUrl || '')
                      }
                      alt="Drive Preview"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={() => {
                        if (!imgTryFallback) {
                          setImgTryFallback(true);
                        } else {
                          setImgLoadError(true);
                        }
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-neutral-500" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Direct High-Res Thumbnail</span>
                    {!imgLoadError && (
                      <span className="text-[10px] text-emerald-400 font-semibold px-1.5 py-0.2 rounded bg-emerald-500/20">
                        Live Ready
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-neutral-400 truncate">
                    {imgLoadError ? (
                      <span className="text-amber-400">
                        ⚠️ If preview is blank, check Drive permission is &quot;Anyone with link&quot;
                      </span>
                    ) : (
                      'Directly rendered from Google Drive high-speed CDN'
                    )}
                  </p>
                </div>
              </div>

              <a
                href={validation.cleanUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg bg-[#1A1A1A] hover:bg-[#252525] border border-[#333333] text-[11px] font-bold text-amber-300 hover:text-amber-200 transition-colors whitespace-nowrap flex items-center gap-1 shrink-0"
              >
                <Eye className="w-3 h-3" />
                <span>Open File</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Helper text or description */}
      {helperText && (
        <p className="text-[11px] text-neutral-400 leading-normal">
          {helperText}
        </p>
      )}

      {/* Expandable Google Drive Sharing Help Guide */}
      {showGuide && (
        <div className="p-3.5 rounded-xl bg-[#121212] border border-amber-500/30 text-xs text-neutral-300 space-y-2 animate-in fade-in duration-200">
          <div className="font-bold text-amber-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>How to share Google Drive files for choir members:</span>
          </div>
          <ol className="list-decimal list-inside space-y-1 text-[11px] text-neutral-400 leading-relaxed">
            <li>Open Google Drive and right-click on the image/file.</li>
            <li>Click <strong className="text-white">Share &gt; Share</strong>.</li>
            <li>Under <strong className="text-white">General access</strong>, change from <em>Restricted</em> to <strong className="text-emerald-400">Anyone with the link</strong>.</li>
            <li>Click <strong className="text-amber-300">Copy link</strong> and paste it into this box.</li>
          </ol>
        </div>
      )}
    </div>
  );
};
