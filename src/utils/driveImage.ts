import type { CSSProperties } from 'react';
import { 
  extractDriveFileId, 
  extractDriveFolderId, 
  validateDriveUrl, 
  normalizeDriveUrl, 
  getDriveDirectImageUrl, 
  getDriveDownloadUrl,
  DriveValidationResult 
} from './driveValidation';
import { 
  getLocalBrandingConfig, 
  setLocalBrandingConfig, 
  fetchBrandingFromBackend, 
  saveBrandingToSupabase,
  ChoirBrandingConfig,
  DEFAULT_BRANDING_CONFIG
} from './driveDatabaseService';

// Re-export validation primitives
export { 
  extractDriveFileId, 
  extractDriveFolderId, 
  validateDriveUrl, 
  normalizeDriveUrl, 
  getDriveDirectImageUrl, 
  getDriveDownloadUrl 
};
export type { DriveValidationResult, ChoirBrandingConfig };

export const DEFAULT_CHOIR_LOGO_DRIVE = DEFAULT_BRANDING_CONFIG.logoDriveUrl;
export const DEFAULT_CHOIR_LOGO_DIRECT = DEFAULT_BRANDING_CONFIG.logoDirectUrl;

export function getChoirLogoUrl(): string {
  const config = getLocalBrandingConfig();
  if (config.logoDirectUrl) return config.logoDirectUrl;
  const direct = getDriveDirectImageUrl(config.logoDriveUrl);
  if (direct) return direct;
  return DEFAULT_CHOIR_LOGO_DIRECT;
}

export function getChoirLogoDriveInput(): string {
  const config = getLocalBrandingConfig();
  return config.logoDriveUrl || DEFAULT_CHOIR_LOGO_DRIVE;
}

export function setChoirLogoUrl(url: string) {
  const current = getLocalBrandingConfig();
  const normalized = normalizeDriveUrl(url) || url.trim();
  const direct = getDriveDirectImageUrl(normalized) || DEFAULT_CHOIR_LOGO_DIRECT;
  setLocalBrandingConfig({
    ...current,
    logoDriveUrl: normalized,
    logoDirectUrl: direct,
  });
}

export function getLogoCentered(): boolean {
  return getLocalBrandingConfig().isCentered;
}

export function setLogoCentered(centered: boolean) {
  const current = getLocalBrandingConfig();
  setLocalBrandingConfig({
    ...current,
    isCentered: centered,
  });
}

export function getLogoSize(): number {
  return 44; // default 44px
}

export function setLogoSize(_size: number) {
  // supported for compatibility
}

export function getLogoImageScale(): number {
  return getLocalBrandingConfig().imgScale;
}

export function setLogoImageScale(scale: number) {
  const current = getLocalBrandingConfig();
  setLocalBrandingConfig({
    ...current,
    imgScale: Math.min(300, Math.max(30, scale)),
  });
}

export function getLogoImageOffsetX(): number {
  return getLocalBrandingConfig().offsetX;
}

export function setLogoImageOffsetX(x: number) {
  const current = getLocalBrandingConfig();
  setLocalBrandingConfig({
    ...current,
    offsetX: Math.min(100, Math.max(-100, x)),
  });
}

export function getLogoImageOffsetY(): number {
  return getLocalBrandingConfig().offsetY;
}

export function setLogoImageOffsetY(y: number) {
  const current = getLocalBrandingConfig();
  setLocalBrandingConfig({
    ...current,
    offsetY: Math.min(100, Math.max(-100, y)),
  });
}

export type LogoFitMode = 'contain' | 'cover';

export function getLogoFitMode(): LogoFitMode {
  return getLocalBrandingConfig().fitMode;
}

export function setLogoFitMode(mode: LogoFitMode) {
  const current = getLocalBrandingConfig();
  setLocalBrandingConfig({
    ...current,
    fitMode: mode,
  });
}

export function getLogoImageStyle(scale?: number, x?: number, y?: number, fit?: LogoFitMode): CSSProperties {
  const s = (scale !== undefined ? scale : getLogoImageScale()) / 100;
  const posX = x !== undefined ? x : getLogoImageOffsetX();
  const posY = y !== undefined ? y : getLogoImageOffsetY();
  const objectFit = fit !== undefined ? fit : getLogoFitMode();
  return {
    transform: `translate(${posX}%, ${posY}%) scale(${s})`,
    transformOrigin: 'center center',
    objectFit,
    filter: 'none',
    mixBlendMode: 'normal',
    isolation: 'isolate',
  };
}

export const CHOIR_LOGO_URL = getChoirLogoUrl();

// Supabase sync helpers
export { fetchBrandingFromBackend, saveBrandingToSupabase };
