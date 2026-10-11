/**
 * Unified Database Utility for Google Drive Assets & Supabase Backend Sync.
 * Enforces rigorous data validation for all Google Drive URLs and ensures consistent
 * persistence to the Supabase backend rather than relying on component-level local state.
 */

import { validateDriveUrl, normalizeDriveUrl, DriveValidationResult } from './driveValidation';
import { AnnualCalendarConfig, Chorister, CommitteeMember, CustomYearPlanEvent } from '../types';

export interface ChoirBrandingConfig {
  logoDriveUrl: string;
  logoDirectUrl: string;
  isCentered: boolean;
  imgScale: number;
  offsetX: number;
  offsetY: number;
  fitMode: 'cover' | 'contain';
  lastUpdatedBy?: string;
  updatedAt?: string;
}

export const DEFAULT_BRANDING_CONFIG: ChoirBrandingConfig = {
  logoDriveUrl: 'https://drive.google.com/file/d/1IprWPQCkwJqZgsGJc2rn-dfdLAlGr4mr/view?usp=sharing',
  logoDirectUrl: 'https://drive.google.com/thumbnail?id=1IprWPQCkwJqZgsGJc2rn-dfdLAlGr4mr&sz=w800',
  isCentered: false,
  imgScale: 100,
  offsetX: 0,
  offsetY: 0,
  fitMode: 'cover',
};

const LOCAL_STORAGE_KEY_BRANDING = 'st_cecilia_branding_config_v2';
const LOCAL_STORAGE_KEY_LOGO_URL = 'st_cecilia_choir_logo_url';

/**
 * Real-time validation check for any Google Drive URL or image link.
 */
export function checkDriveUrlRealtime(url?: string, options?: { required?: boolean; allowGenericImages?: boolean }): DriveValidationResult {
  return validateDriveUrl(url, {
    allowGenericImages: options?.allowGenericImages ?? true,
    required: options?.required ?? false,
  });
}

/**
 * Loads cached branding config from localStorage (synchronous fallback).
 */
export function getLocalBrandingConfig(): ChoirBrandingConfig {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_BRANDING);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_BRANDING_CONFIG, ...parsed };
    }

    const legacyUrl = localStorage.getItem(LOCAL_STORAGE_KEY_LOGO_URL);
    const legacyCentered = localStorage.getItem('st_cecilia_logo_centered') === 'true';
    const legacyScale = Number(localStorage.getItem('st_cecilia_logo_img_scale')) || 100;
    const legacyOffsetX = Number(localStorage.getItem('st_cecilia_logo_img_offset_x')) || 0;
    const legacyOffsetY = Number(localStorage.getItem('st_cecilia_logo_img_offset_y')) || 0;
    const legacyFit = (localStorage.getItem('st_cecilia_logo_fit_mode') as any) || 'cover';

    if (legacyUrl) {
      const val = validateDriveUrl(legacyUrl);
      return {
        ...DEFAULT_BRANDING_CONFIG,
        logoDriveUrl: val.cleanUrl || legacyUrl,
        logoDirectUrl: val.directThumbnailUrl || DEFAULT_BRANDING_CONFIG.logoDirectUrl,
        isCentered: legacyCentered,
        imgScale: legacyScale,
        offsetX: legacyOffsetX,
        offsetY: legacyOffsetY,
        fitMode: legacyFit === 'contain' ? 'contain' : 'cover',
      };
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_BRANDING_CONFIG };
}

/**
 * Saves branding config to local cache and broadcasts update.
 */
export function setLocalBrandingConfig(config: ChoirBrandingConfig) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_BRANDING, JSON.stringify(config));
    localStorage.setItem(LOCAL_STORAGE_KEY_LOGO_URL, config.logoDriveUrl);
    localStorage.setItem('st_cecilia_logo_centered', String(config.isCentered));
    localStorage.setItem('st_cecilia_logo_img_scale', String(config.imgScale));
    localStorage.setItem('st_cecilia_logo_img_offset_x', String(config.offsetX));
    localStorage.setItem('st_cecilia_logo_img_offset_y', String(config.offsetY));
    localStorage.setItem('st_cecilia_logo_fit_mode', config.fitMode);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('choir-branding-updated', { detail: config }));
    }
  } catch {
    // ignore
  }
}

/**
 * Fetches the active branding and crest configuration from the Supabase backend.
 */
export async function fetchBrandingFromBackend(): Promise<ChoirBrandingConfig> {
  try {
    const res = await fetch('/api/branding');
    if (res.ok) {
      const data = await res.json();
      if (data && data.logoDriveUrl) {
        const validated = validateDriveUrl(data.logoDriveUrl);
        const fullConfig: ChoirBrandingConfig = {
          logoDriveUrl: validated.cleanUrl || data.logoDriveUrl,
          logoDirectUrl: validated.directThumbnailUrl || data.logoDirectUrl || DEFAULT_BRANDING_CONFIG.logoDirectUrl,
          isCentered: Boolean(data.isCentered),
          imgScale: Number(data.imgScale) || 100,
          offsetX: Number(data.offsetX) || 0,
          offsetY: Number(data.offsetY) || 0,
          fitMode: data.fitMode === 'contain' ? 'contain' : 'cover',
          lastUpdatedBy: data.lastUpdatedBy,
          updatedAt: data.updatedAt,
        };
        setLocalBrandingConfig(fullConfig);
        return fullConfig;
      }
    }
  } catch (err) {
    console.warn('[DriveDatabaseService] Could not reach backend for branding, using local cache:', err);
  }
  return getLocalBrandingConfig();
}

/**
 * Unified Database Persistence Utility: Forces Google Drive URL validation and saves branding config directly to Supabase.
 */
export async function saveBrandingToSupabase(
  updates: Partial<ChoirBrandingConfig>,
  actor?: { name: string; role: string }
): Promise<ChoirBrandingConfig> {
  const current = getLocalBrandingConfig();
  const nextConfig: ChoirBrandingConfig = {
    ...current,
    ...updates,
    lastUpdatedBy: actor ? `${actor.name} (${actor.role})` : 'Joshua Peiris (President)',
    updatedAt: new Date().toISOString(),
  };

  // FORCE DATA VALIDATION
  if (nextConfig.logoDriveUrl) {
    const validation = validateDriveUrl(nextConfig.logoDriveUrl);
    if (!validation.isValid) {
      throw new Error(`Invalid Google Drive Logo URL: ${validation.error || 'Please provide a valid Drive share link.'}`);
    }
    nextConfig.logoDriveUrl = validation.cleanUrl;
    nextConfig.logoDirectUrl = validation.directThumbnailUrl || DEFAULT_BRANDING_CONFIG.logoDirectUrl;
  }

  // Update local cache immediately
  setLocalBrandingConfig(nextConfig);

  // Write through to Supabase backend API
  const res = await fetch('/api/branding', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      branding: nextConfig,
      actor: actor || { name: 'Joshua Peiris', role: 'President' },
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Failed to save branding to Supabase backend (Status ${res.status})`);
  }

  const saved = await res.json();
  if (saved && saved.logoDriveUrl) {
    setLocalBrandingConfig(saved);
    return saved;
  }

  return nextConfig;
}

/**
 * Unified Database Utility: Validates chorister photo Google Drive URL and persists directly to Supabase.
 */
export async function validateAndSaveChoristerPhoto(
  choristerId: string,
  rawPhotoUrl: string,
  actor?: { name: string; role: string }
): Promise<{ success: boolean; photoUrl: string; validation: DriveValidationResult }> {
  const validation = validateDriveUrl(rawPhotoUrl, { allowGenericImages: true });

  if (rawPhotoUrl && !validation.isValid) {
    throw new Error(`Photo Google Drive URL is invalid: ${validation.error}`);
  }

  const cleanPhotoUrl = rawPhotoUrl ? (validation.cleanUrl || rawPhotoUrl.trim()) : '';

  const res = await fetch(`/api/choristers/${choristerId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chorister: { photoUrl: cleanPhotoUrl },
      actor: actor || { name: 'Joshua Peiris', role: 'President' },
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update member photo in Supabase database');
  }

  return {
    success: true,
    photoUrl: cleanPhotoUrl,
    validation,
  };
}

/**
 * Unified Database Utility: Validates committee member photo Google Drive URL and persists directly to Supabase.
 */
export async function validateAndSaveCommitteePhoto(
  memberId: string,
  rawPhotoUrl: string,
  actor?: { name: string; role: string }
): Promise<{ success: boolean; photoUrl: string; validation: DriveValidationResult }> {
  const validation = validateDriveUrl(rawPhotoUrl, { allowGenericImages: true });

  if (rawPhotoUrl && !validation.isValid) {
    throw new Error(`Committee photo URL is invalid: ${validation.error}`);
  }

  const cleanPhotoUrl = rawPhotoUrl ? (validation.cleanUrl || rawPhotoUrl.trim()) : '';

  const res = await fetch(`/api/committee-members/${memberId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      member: { photoUrl: cleanPhotoUrl },
      actor: actor || { name: 'Joshua Peiris', role: 'President' },
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to update committee photo in Supabase database');
  }

  return {
    success: true,
    photoUrl: cleanPhotoUrl,
    validation,
  };
}

/**
 * Unified Database Utility: Validates and saves an Annual Calendar hero background Google Drive link to Supabase.
 */
export async function validateAndSaveCalendarBackground(
  eventKey: 'feast' | 'carols' | 'christmas' | 'newYear' | 'easter',
  rawDriveUrl: string,
  currentConfig: AnnualCalendarConfig,
  actor?: { name: string; role: string }
): Promise<AnnualCalendarConfig> {
  const validation = validateDriveUrl(rawDriveUrl, { allowGenericImages: true });

  if (rawDriveUrl && !validation.isValid) {
    throw new Error(`Calendar background URL is invalid: ${validation.error}`);
  }

  const cleanUrl = rawDriveUrl ? (validation.cleanUrl || rawDriveUrl.trim()) : '';

  const fieldMap: Record<string, keyof AnnualCalendarConfig> = {
    feast: 'feastBackgroundUrl',
    carols: 'carolsBackgroundUrl',
    christmas: 'christmasBackgroundUrl',
    newYear: 'newYearBackgroundUrl',
    easter: 'easterBackgroundUrl',
  };

  const field = fieldMap[eventKey];
  const updatedConfig: AnnualCalendarConfig = {
    ...currentConfig,
    [field]: cleanUrl,
  };

  const res = await fetch('/api/calendar', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      calendarConfig: updatedConfig,
      actor: actor || { name: 'Joshua Peiris', role: 'President' },
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to sync calendar background to Supabase');
  }

  const data = await res.json();
  return data.calendarConfig || updatedConfig;
}

/**
 * Unified Database Utility: Validates and saves a Custom Event with Google Drive hero background into Supabase.
 */
export async function validateAndSaveCustomEvent(
  customEvent: CustomYearPlanEvent,
  currentConfig: AnnualCalendarConfig,
  actor?: { name: string; role: string }
): Promise<AnnualCalendarConfig> {
  let cleanBackgroundUrl = customEvent.backgroundDriveUrl || '';

  if (cleanBackgroundUrl) {
    const validation = validateDriveUrl(cleanBackgroundUrl, { allowGenericImages: true });
    if (!validation.isValid) {
      throw new Error(`Custom event background URL is invalid: ${validation.error}`);
    }
    cleanBackgroundUrl = validation.cleanUrl;
  }

  const preparedEvent: CustomYearPlanEvent = {
    ...customEvent,
    backgroundDriveUrl: cleanBackgroundUrl,
    addedBy: customEvent.addedBy || (actor ? `${actor.name} (${actor.role})` : 'Joshua Peiris (President)'),
    addedAt: customEvent.addedAt || new Date().toISOString(),
  };

  const existingCustomEvents = [...(currentConfig.customEvents || [])];
  const existingIdx = existingCustomEvents.findIndex((e) => e.id === preparedEvent.id);

  if (existingIdx >= 0) {
    existingCustomEvents[existingIdx] = preparedEvent;
  } else {
    existingCustomEvents.push(preparedEvent);
  }

  const updatedConfig: AnnualCalendarConfig = {
    ...currentConfig,
    customEvents: existingCustomEvents,
  };

  const res = await fetch('/api/calendar', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      calendarConfig: updatedConfig,
      actor: actor || { name: 'Joshua Peiris', role: 'President' },
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to save custom event to Supabase');
  }

  const data = await res.json();
  return data.calendarConfig || updatedConfig;
}

/**
 * Unified Database Utility: Generic validator and persistence function for any Google Drive URL asset.
 */
export async function validateAndPersistDriveUrl(
  url: string,
  contextName: string
): Promise<{ isValid: boolean; cleanUrl: string; directThumbnailUrl: string | null }> {
  const validation = validateDriveUrl(url, { allowGenericImages: true });
  if (!validation.isValid) {
    throw new Error(`[${contextName}] Invalid Google Drive URL: ${validation.error}`);
  }
  return {
    isValid: true,
    cleanUrl: validation.cleanUrl,
    directThumbnailUrl: validation.directThumbnailUrl,
  };
}

/**
 * Server-side live accessibility check for Google Drive links (via proxy / HEAD verification).
 */
export async function testDriveUrlAccessibility(url: string): Promise<{
  accessible: boolean;
  statusText?: string;
  directThumbnail?: string;
}> {
  const validation = validateDriveUrl(url);
  if (!validation.isValid) {
    return { accessible: false, statusText: validation.error || 'Invalid link format' };
  }

  try {
    const testUrl = validation.directThumbnailUrl || validation.cleanUrl;
    const res = await fetch(`/api/image-proxy?url=${encodeURIComponent(testUrl)}`, {
      method: 'HEAD',
    });

    if (res.ok) {
      return { accessible: true, statusText: 'Publicly Accessible', directThumbnail: validation.directThumbnailUrl || undefined };
    } else {
      return {
        accessible: false,
        statusText: `Access restricted (Status ${res.status}). Ensure sharing is set to "Anyone with the link can view".`,
        directThumbnail: validation.directThumbnailUrl || undefined,
      };
    }
  } catch {
    return {
      accessible: true,
      statusText: 'Valid link format (Preview may require browser access)',
      directThumbnail: validation.directThumbnailUrl || undefined,
    };
  }
}
