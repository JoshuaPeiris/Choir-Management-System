/**
 * Unified Google Drive URL Validator and Normalization Engine.
 * Supports all official Google Drive, Docs, and Google User Content link formats.
 */

export interface DriveValidationResult {
  isValid: boolean;
  isDriveUrl: boolean;
  isFolder: boolean;
  isDirectImage: boolean;
  fileId: string | null;
  folderId: string | null;
  cleanUrl: string;
  directThumbnailUrl: string | null;
  highResThumbnailUrl: string | null;
  downloadUrl: string | null;
  viewUrl: string | null;
  error?: string;
  warning?: string;
  status: 'valid_drive_file' | 'valid_drive_folder' | 'valid_external_image' | 'invalid_format' | 'empty';
}

/**
 * Robust extraction of Google Drive File ID from any valid link or raw ID string.
 */
export function extractDriveFileId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. /file/d/FILE_ID, /file/u/0/d/FILE_ID, /d/FILE_ID
  const fileMatch = trimmed.match(/\/(?:file(?:\/u\/\d+)?\/d|d)\/([a-zA-Z0-9_-]{20,})/i);
  if (fileMatch && fileMatch[1]) {
    return fileMatch[1];
  }

  // 2. id=FILE_ID or &id=FILE_ID or ?id=FILE_ID
  const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{20,})/i);
  if (idMatch && idMatch[1]) {
    return idMatch[1];
  }

  // 3. googleusercontent.com/d/FILE_ID
  const lh3Match = trimmed.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]{20,})/i);
  if (lh3Match && lh3Match[1]) {
    return lh3Match[1];
  }

  // 4. docs.google.com/document/d/FILE_ID or spreadsheets/d/FILE_ID or presentation/d/FILE_ID
  const docsMatch = trimmed.match(/docs\.google\.com\/(?:document|spreadsheets|presentation)\/d\/([a-zA-Z0-9_-]{20,})/i);
  if (docsMatch && docsMatch[1]) {
    return docsMatch[1];
  }

  // 5. Raw file ID (20 to 65 alphanumeric characters with dashes and underscores)
  if (/^[a-zA-Z0-9_-]{20,65}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Extraction of Google Drive Folder ID from folder sharing links.
 */
export function extractDriveFolderId(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]{20,})/i);
  if (folderMatch && folderMatch[1]) {
    return folderMatch[1];
  }

  const folderParamMatch = trimmed.match(/[?&]folder(?:_id)?=([a-zA-Z0-9_-]{20,})/i);
  if (folderParamMatch && folderParamMatch[1]) {
    return folderParamMatch[1];
  }

  return null;
}

/**
 * Checks if a URL is a direct web image link (PNG, JPG, JPEG, WEBP, SVG, GIF, AVIF, or Data URI).
 */
export function isDirectImageUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith('data:image/')) return true;

  try {
    const parsed = new URL(trimmed);
    const pathname = parsed.pathname.toLowerCase();
    return (
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.webp') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.gif') ||
      pathname.endsWith('.avif') ||
      parsed.hostname.includes('images.unsplash.com') ||
      parsed.hostname.includes('cloudinary.com') ||
      parsed.hostname.includes('imgur.com')
    );
  } catch {
    return false;
  }
}

/**
 * Comprehensive real-time validation and metadata generation for Google Drive URLs and image assets.
 */
export function validateDriveUrl(
  input?: string,
  options?: {
    allowGenericImages?: boolean;
    required?: boolean;
    requireImageFile?: boolean;
  }
): DriveValidationResult {
  const allowGenericImages = options?.allowGenericImages ?? true;
  const required = options?.required ?? false;

  if (!input || !input.trim()) {
    return {
      isValid: !required,
      isDriveUrl: false,
      isFolder: false,
      isDirectImage: false,
      fileId: null,
      folderId: null,
      cleanUrl: '',
      directThumbnailUrl: null,
      highResThumbnailUrl: null,
      downloadUrl: null,
      viewUrl: null,
      error: required ? 'A Google Drive link or image URL is required.' : undefined,
      status: 'empty',
    };
  }

  const trimmed = input.trim();
  const fileId = extractDriveFileId(trimmed);
  const folderId = extractDriveFolderId(trimmed);

  // 1. Google Drive File Match
  if (fileId) {
    const cleanUrl = `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
    const directThumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
    const highResThumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;

    return {
      isValid: true,
      isDriveUrl: true,
      isFolder: false,
      isDirectImage: true,
      fileId,
      folderId: null,
      cleanUrl,
      directThumbnailUrl,
      highResThumbnailUrl,
      downloadUrl,
      viewUrl,
      status: 'valid_drive_file',
      warning: trimmed.includes('/folders/')
        ? 'This appears to contain folder paths but a file ID was extracted.'
        : undefined,
    };
  }

  // 2. Google Drive Folder Match
  if (folderId) {
    const cleanUrl = `https://drive.google.com/drive/folders/${folderId}?usp=sharing`;
    return {
      isValid: true,
      isDriveUrl: true,
      isFolder: true,
      isDirectImage: false,
      fileId: null,
      folderId,
      cleanUrl,
      directThumbnailUrl: null,
      highResThumbnailUrl: null,
      downloadUrl: null,
      viewUrl: cleanUrl,
      status: 'valid_drive_folder',
      warning: options?.requireImageFile ? 'This is a Google Drive folder link, not a single image file.' : undefined,
    };
  }

  // 3. Generic Direct Image URL Match
  if (allowGenericImages && isDirectImageUrl(trimmed)) {
    return {
      isValid: true,
      isDriveUrl: false,
      isFolder: false,
      isDirectImage: true,
      fileId: null,
      folderId: null,
      cleanUrl: trimmed,
      directThumbnailUrl: trimmed,
      highResThumbnailUrl: trimmed,
      downloadUrl: trimmed,
      viewUrl: trimmed,
      status: 'valid_external_image',
      warning: 'Web image URL detected (non-Google Drive).',
    };
  }

  // 4. Invalid Link Diagnostics
  let errorMsg = 'Invalid Google Drive link or file ID.';
  if (trimmed.includes('drive.google.com') || trimmed.includes('google.com')) {
    if (trimmed.length < 25) {
      errorMsg = 'Google Drive link is incomplete or missing the File ID.';
    } else {
      errorMsg = 'Could not extract a valid Google Drive File ID. Please ensure the link is copied from "Share > Copy link".';
    }
  } else if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    errorMsg = 'Not a valid Google Drive sharing link or supported image URL.';
  } else {
    errorMsg = 'Please paste a full Google Drive share link (e.g. https://drive.google.com/file/d/.../view).';
  }

  return {
    isValid: false,
    isDriveUrl: false,
    isFolder: false,
    isDirectImage: false,
    fileId: null,
    folderId: null,
    cleanUrl: trimmed,
    directThumbnailUrl: null,
    highResThumbnailUrl: null,
    downloadUrl: null,
    viewUrl: null,
    error: errorMsg,
    status: 'invalid_format',
  };
}

/**
 * Normalizes any input Google Drive URL into canonical share format.
 */
export function normalizeDriveUrl(url?: string): string {
  if (!url) return '';
  const validation = validateDriveUrl(url);
  if (validation.isValid && validation.cleanUrl) {
    return validation.cleanUrl;
  }
  return url.trim();
}

/**
 * Formats a Google Drive or image URL into high-resolution embeddable thumbnail.
 */
export function getDriveDirectImageUrl(driveUrl?: string, size: number = 800): string | undefined {
  if (!driveUrl) return undefined;
  const trimmed = driveUrl.trim();
  if (!trimmed) return undefined;

  const fileId = extractDriveFileId(trimmed);
  if (fileId) {
    return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
  }

  return trimmed;
}

export function getDriveDirectImageFallbackUrl(driveUrl?: string): string | undefined {
  if (!driveUrl) return undefined;
  const fileId = extractDriveFileId(driveUrl);
  if (fileId) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  return driveUrl;
}

/**
 * Returns a direct download URL for Google Drive files.
 */
export function getDriveDownloadUrl(driveUrl?: string): string | undefined {
  if (!driveUrl) return undefined;
  const fileId = extractDriveFileId(driveUrl);
  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }
  return driveUrl;
}
