import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Upload, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Share2, 
  Image as ImageIcon,
  User,
  Sliders,
  Lock,
  Unlock,
  Save,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Settings,
  ShieldCheck,
  Heart,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Chorister } from '../types';
import { getDriveDirectImageUrl, CHOIR_LOGO_URL } from '../utils/driveImage';
import { calculateBirthdayAge, formatBirthdayGreeting } from '../utils/birthdayUtils';

// Default calibrated values for the official St. Cecilia's Choir template PNG (1927x2048)
const FACTORY_FRAME_SETTINGS = {
  circleXRatio: 0.50,
  circleYRatio: 0.304,
  circleRadiusRatio: 0.168,
  showGoldRim: true,
};

interface BirthdayFlyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  celebrant: Chorister | null;
  allChoristers?: Chorister[];
  currentDate?: Date;
  onSelectAnotherChorister?: (chorister: Chorister) => void;
}

export const BirthdayFlyerModal: React.FC<BirthdayFlyerModalProps> = ({
  isOpen,
  onClose,
  celebrant,
  allChoristers = [],
  currentDate = new Date(),
  onSelectAnotherChorister,
}) => {
  // Selected chorister can be changed via quick picker inside modal
  const [activeChorister, setActiveChorister] = useState<Chorister | null>(() => {
    return celebrant || (allChoristers.length > 0 ? allChoristers[0] : null);
  });

  useEffect(() => {
    if (celebrant) {
      setActiveChorister(celebrant);
    } else if (!activeChorister && allChoristers.length > 0) {
      setActiveChorister(allChoristers[0]);
    }
  }, [celebrant, allChoristers]);

  // Template source: prioritize user-uploaded template PNG or local fallbacks
  const [templateUrl, setTemplateUrl] = useState<string>('/template.png');
  const [customTemplateLoaded, setCustomTemplateLoaded] = useState<boolean>(false);

  // User photo source (override or custom upload)
  const [customPhotoDataUrl, setCustomPhotoDataUrl] = useState<string | null>(null);

  // Transform & Alignment Controls for the person's photo (Up/Down, Left/Right, Zoom, Rotation)
  const [zoom, setZoom] = useState<number>(1.0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);

  // Circular Frame Calibration (Percentage of Template Dimensions)
  const [circleXRatio, setCircleXRatio] = useState<number>(FACTORY_FRAME_SETTINGS.circleXRatio);
  const [circleYRatio, setCircleYRatio] = useState<number>(FACTORY_FRAME_SETTINGS.circleYRatio);
  const [circleRadiusRatio, setCircleRadiusRatio] = useState<number>(FACTORY_FRAME_SETTINGS.circleRadiusRatio);
  const [showGoldRim, setShowGoldRim] = useState<boolean>(FACTORY_FRAME_SETTINGS.showGoldRim);
  const [showGuides, setShowGuides] = useState<boolean>(false);

  // Frame lock state: locked by default so users only adjust the photo; admin can unlock to set default frame
  const [isFrameLocked, setIsFrameLocked] = useState<boolean>(true);
  const [isSavingFrameDefaults, setIsSavingFrameDefaults] = useState<boolean>(false);
  const [frameSaveSuccess, setFrameSaveSuccess] = useState<boolean>(false);

  // Status flags
  const [isDetectingFace, setIsDetectingFace] = useState<boolean>(false);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [faceDetectionMsg, setFaceDetectionMsg] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isBlessingCopied, setIsBlessingCopied] = useState<boolean>(false);
  const [downloadAutoCopied, setDownloadAutoCopied] = useState<boolean>(false);
  const [exportResolution, setExportResolution] = useState<'standard' | 'hd'>('hd'); // standard: 1024, hd: 2048
  const [renderError, setRenderError] = useState<string | null>(null);

  // Canvas ref & interaction state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Loaded image elements
  const templateImgRef = useRef<HTMLImageElement | null>(null);
  const userImgRef = useRef<HTMLImageElement | null>(null);
  const isTemplateReadyRef = useRef<boolean>(false);
  const isUserImgReadyRef = useRef<boolean>(false);

  // Load saved default frame calibration from localStorage and server
  useEffect(() => {
    try {
      const saved = localStorage.getItem('st_cecilia_flyer_frame_calibration');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.circleXRatio === 'number') setCircleXRatio(parsed.circleXRatio);
        if (typeof parsed.circleYRatio === 'number') setCircleYRatio(parsed.circleYRatio);
        if (typeof parsed.circleRadiusRatio === 'number') setCircleRadiusRatio(parsed.circleRadiusRatio);
        if (typeof parsed.showGoldRim === 'boolean') setShowGoldRim(parsed.showGoldRim);
      }
    } catch {}

    fetch('/api/flyer-frame-settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.settings) {
          if (typeof data.settings.circleXRatio === 'number') setCircleXRatio(data.settings.circleXRatio);
          if (typeof data.settings.circleYRatio === 'number') setCircleYRatio(data.settings.circleYRatio);
          if (typeof data.settings.circleRadiusRatio === 'number') setCircleRadiusRatio(data.settings.circleRadiusRatio);
          if (typeof data.settings.showGoldRim === 'boolean') setShowGoldRim(data.settings.showGoldRim);
        }
      })
      .catch(() => {});
  }, []);

  // Save current golden frame settings as permanent default
  const handleSaveDefaultFramePosition = async () => {
    setIsSavingFrameDefaults(true);
    const payload = {
      circleXRatio,
      circleYRatio,
      circleRadiusRatio,
      showGoldRim,
    };
    try {
      localStorage.setItem('st_cecilia_flyer_frame_calibration', JSON.stringify(payload));
      await fetch('/api/flyer-frame-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setFrameSaveSuccess(true);
      setTimeout(() => setFrameSaveSuccess(false), 3500);
      setIsFrameLocked(true);
      setShowGuides(false);
    } catch (err) {
      console.error('Failed to save default frame position:', err);
    } finally {
      setIsSavingFrameDefaults(false);
    }
  };

  const handleResetToFactoryFrame = () => {
    setCircleXRatio(FACTORY_FRAME_SETTINGS.circleXRatio);
    setCircleYRatio(FACTORY_FRAME_SETTINGS.circleYRatio);
    setCircleRadiusRatio(FACTORY_FRAME_SETTINGS.circleRadiusRatio);
    setShowGoldRim(FACTORY_FRAME_SETTINGS.showGoldRim);
  };

  const nudgePhoto = (dx: number, dy: number) => {
    setPanX((prev) => prev + dx);
    setPanY((prev) => prev + dy);
  };

  // Get reliable photo URL safe for Canvas rendering (no CORS tainting)
  const getActivePhotoUrl = useCallback(() => {
    if (customPhotoDataUrl) return customPhotoDataUrl;
    const target = activeChorister || celebrant;
    if (target?.photoUrl) {
      const trimmed = target.photoUrl.trim();
      if (trimmed.startsWith('data:')) return trimmed;
      if (trimmed.startsWith('/')) return trimmed;
      const direct = getDriveDirectImageUrl(trimmed);
      return `/api/image-proxy?url=${encodeURIComponent(direct || trimmed)}`;
    }
    return '/choir_logo.jpg';
  }, [customPhotoDataUrl, activeChorister?.photoUrl, celebrant?.photoUrl]);

  // Detect face and auto-center
  const autoAlignFace = useCallback(async (imageSrc: string) => {
    setIsDetectingFace(true);
    setFaceDetectionMsg('Detecting face with AI...');
    try {
      const isDataUrl = imageSrc.startsWith('data:');
      const payload = isDataUrl 
        ? { imageBase64: imageSrc } 
        : { imageUrl: imageSrc };

      const res = await fetch('/api/detect-face', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data && data.success) {
        if (data.detected && data.faceCenter) {
          setFaceDetected(true);
          setFaceDetectionMsg('Face centered automatically ✨');

          if (templateImgRef.current && userImgRef.current) {
            const tW = templateImgRef.current.naturalWidth || 1024;
            const circleRadius = tW * circleRadiusRatio;

            // Target face size to occupy approx 52% of the circle diameter
            const targetFacePx = circleRadius * 2 * 0.52;
            const currentFaceHeightPx = (data.faceHeight || 0.35) * (userImgRef.current.naturalHeight || 800);
            const optimalZoom = Math.min(Math.max(targetFacePx / (currentFaceHeightPx || 1), 0.6), 2.5);

            setZoom(Number(optimalZoom.toFixed(2)));

            const uW = userImgRef.current.naturalWidth || 800;
            const uH = userImgRef.current.naturalHeight || 800;
            const facePixelX = (data.faceCenter.x - 0.5) * uW * optimalZoom;
            const facePixelY = (data.faceCenter.y - 0.5) * uH * optimalZoom;

            setPanX(Math.round(-facePixelX));
            setPanY(Math.round(-facePixelY));
          }
        } else {
          setFaceDetected(false);
          setFaceDetectionMsg('Portrait centered ✨');
          if (userImgRef.current) {
            const uH = userImgRef.current.naturalHeight || 800;
            setPanY(Math.round(uH * 0.05));
          }
        }
      }
    } catch (err) {
      console.warn('Face detection error:', err);
      setFaceDetectionMsg('Portrait centered (Default)');
    } finally {
      setIsDetectingFace(false);
    }
  }, [circleRadiusRatio]);

  // Main Canvas Rendering Routine
  const drawFlyer = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tImg = templateImgRef.current;
    const uImg = userImgRef.current;

    // Use natural width of template or standard 2048 high-res dimensions
    const tW = (tImg && tImg.complete && tImg.naturalWidth) ? tImg.naturalWidth : 2048;
    const tH = (tImg && tImg.complete && tImg.naturalHeight) ? tImg.naturalHeight : 2048;

    if (canvas.width !== tW || canvas.height !== tH) {
      canvas.width = tW;
      canvas.height = tH;
    }

    // 1. Draw Template Background
    ctx.clearRect(0, 0, tW, tH);

    if (tImg && tImg.complete && tImg.naturalWidth > 0) {
      ctx.drawImage(tImg, 0, 0, tW, tH);
    } else {
      // High-resolution Procedural Fallback Template Background (Rich St. Cecilia Dark Gold Theme)
      const bgGrad = ctx.createLinearGradient(0, 0, tW, tH);
      bgGrad.addColorStop(0, '#0F0B06');
      bgGrad.addColorStop(0.5, '#1A140B');
      bgGrad.addColorStop(1, '#080604');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, tW, tH);

      // Gold celebratory ambient glow
      const radial = ctx.createRadialGradient(tW / 2, tH * 0.32, 50, tW / 2, tH * 0.32, tW * 0.6);
      radial.addColorStop(0, 'rgba(212, 175, 55, 0.25)');
      radial.addColorStop(0.5, 'rgba(180, 130, 20, 0.08)');
      radial.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, tW, tH);

      // Top Header text
      ctx.textAlign = 'center';
      ctx.fillStyle = '#D4AF37';
      ctx.font = `bold ${Math.round(tW * 0.035)}px serif`;
      ctx.fillText("ST. CECILIA'S CHOIR", tW / 2, tH * 0.09);

      ctx.fillStyle = '#E5C158';
      ctx.font = `bold ${Math.round(tW * 0.052)}px sans-serif`;
      ctx.fillText('HAPPY BIRTHDAY', tW / 2, tH * 0.60);

      // Celebrant Name on template fallback
      const celebrantName = (activeChorister?.name || celebrant?.name || 'Choir Member').toUpperCase();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `900 ${Math.round(tW * 0.045)}px sans-serif`;
      ctx.fillText(celebrantName, tW / 2, tH * 0.68);

      const celebrantRole = activeChorister?.role || celebrant?.role || 'Chorister';
      ctx.fillStyle = '#D4AF37';
      ctx.font = `bold ${Math.round(tW * 0.026)}px sans-serif`;
      ctx.fillText(`• ${celebrantRole.toUpperCase()} •`, tW / 2, tH * 0.73);
    }

    // 2. Setup Circular Mask for Celebrant Photo
    const circleCenterX = tW * circleXRatio;
    const circleCenterY = tH * circleYRatio;
    const circleRadius = tW * circleRadiusRatio;

    ctx.save();
    ctx.beginPath();
    ctx.arc(circleCenterX, circleCenterY, circleRadius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();

    // Soft dark backdrop inside circle
    ctx.fillStyle = '#0E0C0A';
    ctx.fillRect(circleCenterX - circleRadius, circleCenterY - circleRadius, circleRadius * 2, circleRadius * 2);

    if (uImg && uImg.complete && uImg.naturalWidth > 0) {
      // Calculate base scale to fill the circular frame
      const baseScale = Math.max(
        (circleRadius * 2) / (uImg.naturalWidth || 1),
        (circleRadius * 2) / (uImg.naturalHeight || 1)
      );
      const effectiveScale = baseScale * zoom;

      // Pan & Zoom transform
      ctx.translate(circleCenterX + panX, circleCenterY + panY);
      if (rotation !== 0) {
        ctx.rotate((rotation * Math.PI) / 180);
      }
      ctx.scale(effectiveScale, effectiveScale);

      // Center photo
      ctx.drawImage(
        uImg,
        -uImg.naturalWidth / 2,
        -uImg.naturalHeight / 2,
        uImg.naturalWidth,
        uImg.naturalHeight
      );
    } else {
      // Fallback initial avatar inside circle if photo is loading or unavailable
      const currentName = activeChorister?.name || celebrant?.name || 'C';
      const initial = currentName.charAt(0).toUpperCase();

      const initialGrad = ctx.createLinearGradient(
        circleCenterX - circleRadius,
        circleCenterY - circleRadius,
        circleCenterX + circleRadius,
        circleCenterY + circleRadius
      );
      initialGrad.addColorStop(0, '#D4AF37');
      initialGrad.addColorStop(1, '#8C6D1F');
      ctx.fillStyle = initialGrad;
      ctx.fillRect(circleCenterX - circleRadius, circleCenterY - circleRadius, circleRadius * 2, circleRadius * 2);

      ctx.fillStyle = '#141108';
      ctx.font = `bold ${Math.round(circleRadius * 1.1)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initial, circleCenterX, circleCenterY);
    }
    ctx.restore();

    // 3. Gold Rim Accent around circular frame
    if (showGoldRim) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(circleCenterX, circleCenterY, circleRadius, 0, Math.PI * 2);

      const goldGrad = ctx.createLinearGradient(
        circleCenterX - circleRadius, 
        circleCenterY - circleRadius, 
        circleCenterX + circleRadius, 
        circleCenterY + circleRadius
      );
      goldGrad.addColorStop(0, 'rgba(255, 235, 160, 0.98)');
      goldGrad.addColorStop(0.3, 'rgba(212, 160, 23, 0.95)');
      goldGrad.addColorStop(0.7, 'rgba(255, 248, 220, 0.98)');
      goldGrad.addColorStop(1, 'rgba(184, 134, 11, 0.95)');

      ctx.lineWidth = Math.max(Math.round(tW * 0.006), 4);
      ctx.strokeStyle = goldGrad;
      ctx.stroke();

      // Inner highlight
      ctx.beginPath();
      ctx.arc(circleCenterX, circleCenterY, circleRadius - 2, 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.stroke();

      ctx.restore();
    }

    // 4. Alignment Guides (Crosshairs) if enabled
    if (showGuides) {
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);

      ctx.beginPath();
      ctx.arc(circleCenterX, circleCenterY, circleRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(circleCenterX - circleRadius - 10, circleCenterY);
      ctx.lineTo(circleCenterX + circleRadius + 10, circleCenterY);
      ctx.moveTo(circleCenterX, circleCenterY - circleRadius - 10);
      ctx.lineTo(circleCenterX, circleCenterY + circleRadius + 10);
      ctx.stroke();

      ctx.restore();
    }
  }, [
    activeChorister,
    celebrant,
    circleXRatio, 
    circleYRatio, 
    circleRadiusRatio, 
    zoom, 
    panX, 
    panY, 
    rotation, 
    showGoldRim, 
    showGuides
  ]);

  // Load images and trigger automatic re-draw
  useEffect(() => {
    let isCancelled = false;

    // Load Template Image (with automatic local fallbacks)
    const tImg = new Image();
    tImg.crossOrigin = 'anonymous';
    tImg.src = templateUrl;

    const handleTemplateSuccess = () => {
      if (isCancelled) return;
      templateImgRef.current = tImg;
      isTemplateReadyRef.current = true;
      drawFlyer();
    };

    tImg.onload = handleTemplateSuccess;
    tImg.onerror = () => {
      if (isCancelled) return;
      // Try fallback to /birthday_template.jpg or /birthday_template.png
      if (templateUrl === '/template.png') {
        tImg.src = '/birthday_template.jpg';
      } else if (templateUrl === '/birthday_template.jpg') {
        tImg.src = '/birthday_template.png';
      } else {
        // Use procedural rendering
        isTemplateReadyRef.current = true;
        drawFlyer();
      }
    };

    // Load User Photo (with proxy and local logo fallback)
    const uImg = new Image();
    uImg.crossOrigin = 'anonymous';
    const photoUrl = getActivePhotoUrl();
    uImg.src = photoUrl;

    uImg.onload = () => {
      if (isCancelled) return;
      userImgRef.current = uImg;
      isUserImgReadyRef.current = true;
      drawFlyer();
      // Auto align face on load
      autoAlignFace(uImg.src);
    };

    uImg.onerror = () => {
      if (isCancelled) return;
      // Fallback to local choir logo
      if (uImg.src !== '/choir_logo.jpg' && !uImg.src.endsWith('/choir_logo.jpg')) {
        uImg.src = '/choir_logo.jpg';
      } else {
        isUserImgReadyRef.current = true;
        drawFlyer();
      }
    };

    return () => {
      isCancelled = true;
    };
  }, [templateUrl, activeChorister?.id, celebrant?.id, customPhotoDataUrl, getActivePhotoUrl, drawFlyer, autoAlignFace]);

  useEffect(() => {
    drawFlyer();
  }, [drawFlyer]);

  // Mouse / Touch Dragging on Canvas
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { x: panX, y: panY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleFactor = canvas.width / rect.width;

    const deltaX = (e.clientX - dragStartRef.current.x) * scaleFactor;
    const deltaY = (e.clientY - dragStartRef.current.y) * scaleFactor;

    setPanX(Math.round(panStartRef.current.x + deltaX));
    setPanY(Math.round(panStartRef.current.y + deltaY));
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.05 : -0.05;
    setZoom((prev) => Number(Math.min(Math.max(prev + zoomDelta, 0.4), 3.0).toFixed(2)));
  };

  // Upload custom user photo
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomPhotoDataUrl(dataUrl);
        setPanX(0);
        setPanY(0);
        setZoom(1.0);
        setRotation(0);
      }
    };
    reader.readAsDataURL(file);
  };

  // Upload custom template file
  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setTemplateUrl(dataUrl);
        setCustomTemplateLoaded(true);

        try {
          await fetch('/api/upload-custom-template', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: dataUrl }),
          });
        } catch {}
      }
    };
    reader.readAsDataURL(file);
  };

  // Reset transforms
  const handleResetAlignment = () => {
    setZoom(1.0);
    setPanX(0);
    setPanY(0);
    setRotation(0);
  };

  // Download High Resolution Render with Automated Blessing Clipboard Copy
  const handleDownload = async (format: 'png' | 'jpeg') => {
    setIsDownloading(true);
    setRenderError(null);
    try {
      const current = activeChorister || celebrant || allChoristers[0];
      const sourceCanvas = canvasRef.current;
      if (!sourceCanvas) {
        throw new Error('Canvas not initialized');
      }

      let exportCanvas = sourceCanvas;

      // Offscreen HD Canvas (2048 x 2048) if requested and source is smaller
      if (exportResolution === 'hd' && sourceCanvas.width < 2048) {
        const hdCanvas = document.createElement('canvas');
        hdCanvas.width = 2048;
        hdCanvas.height = 2048;
        const hdCtx = hdCanvas.getContext('2d');
        if (hdCtx) {
          const tW = 2048;
          const tH = 2048;
          const scaleMultiplier = 2048 / sourceCanvas.width;

          // Draw template
          if (templateImgRef.current && templateImgRef.current.complete) {
            hdCtx.drawImage(templateImgRef.current, 0, 0, tW, tH);
          } else {
            // Procedural HD background
            const bgGrad = hdCtx.createLinearGradient(0, 0, tW, tH);
            bgGrad.addColorStop(0, '#0F0B06');
            bgGrad.addColorStop(0.5, '#1A140B');
            bgGrad.addColorStop(1, '#080604');
            hdCtx.fillStyle = bgGrad;
            hdCtx.fillRect(0, 0, tW, tH);
          }

          // Draw photo in circle
          const circleCenterX = tW * circleXRatio;
          const circleCenterY = tH * circleYRatio;
          const circleRadius = tW * circleRadiusRatio;

          hdCtx.save();
          hdCtx.beginPath();
          hdCtx.arc(circleCenterX, circleCenterY, circleRadius, 0, Math.PI * 2, true);
          hdCtx.closePath();
          hdCtx.clip();

          hdCtx.fillStyle = '#0E0C0A';
          hdCtx.fillRect(circleCenterX - circleRadius, circleCenterY - circleRadius, circleRadius * 2, circleRadius * 2);

          if (userImgRef.current && userImgRef.current.complete) {
            const baseScale = Math.max(
              (circleRadius * 2) / (userImgRef.current.naturalWidth || 1),
              (circleRadius * 2) / (userImgRef.current.naturalHeight || 1)
            );
            const effectiveScale = baseScale * zoom;

            hdCtx.translate(circleCenterX + panX * scaleMultiplier, circleCenterY + panY * scaleMultiplier);
            if (rotation !== 0) {
              hdCtx.rotate((rotation * Math.PI) / 180);
            }
            hdCtx.scale(effectiveScale, effectiveScale);

            hdCtx.drawImage(
              userImgRef.current,
              -userImgRef.current.naturalWidth / 2,
              -userImgRef.current.naturalHeight / 2,
              userImgRef.current.naturalWidth,
              userImgRef.current.naturalHeight
            );
          }
          hdCtx.restore();

          if (showGoldRim) {
            hdCtx.save();
            hdCtx.beginPath();
            hdCtx.arc(circleCenterX, circleCenterY, circleRadius, 0, Math.PI * 2);
            const goldGrad = hdCtx.createLinearGradient(
              circleCenterX - circleRadius, 
              circleCenterY - circleRadius, 
              circleCenterX + circleRadius, 
              circleCenterY + circleRadius
            );
            goldGrad.addColorStop(0, 'rgba(255, 235, 160, 0.98)');
            goldGrad.addColorStop(0.3, 'rgba(212, 160, 23, 0.95)');
            goldGrad.addColorStop(0.7, 'rgba(255, 248, 220, 0.98)');
            goldGrad.addColorStop(1, 'rgba(184, 134, 11, 0.95)');
            hdCtx.lineWidth = Math.max(Math.round(tW * 0.006), 6);
            hdCtx.strokeStyle = goldGrad;
            hdCtx.stroke();
            hdCtx.restore();
          }

          exportCanvas = hdCanvas;
        }
      }

      const mime = format === 'png' ? 'image/png' : 'image/jpeg';
      let dataUrl: string;
      try {
        dataUrl = exportCanvas.toDataURL(mime, 0.95);
      } catch (corsErr) {
        // Fallback using blob
        const blob = await new Promise<Blob | null>((resolve) => exportCanvas.toBlob(resolve, mime, 0.95));
        if (!blob) throw corsErr;
        dataUrl = URL.createObjectURL(blob);
      }

      const rawName = current?.name || 'Celebrant';
      const safeName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const year = currentDate.getFullYear();
      const fileName = `Birthday_Flyer_${safeName}_${year}.${format}`;

      const link = document.createElement('a');
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // AUTOMATICALLY copy the official Choir Fam birthday blessing to clipboard
      if (current) {
        const blessingText = formatBirthdayGreeting(current, currentDate);
        try {
          await navigator.clipboard.writeText(blessingText);
          setIsBlessingCopied(true);
          setDownloadAutoCopied(true);
          setTimeout(() => {
            setIsBlessingCopied(false);
            setDownloadAutoCopied(false);
          }, 5000);
        } catch (clipErr) {
          console.warn('Auto copy blessing failed:', clipErr);
        }
      }
    } catch (err: any) {
      console.error('Download error:', err);
      setRenderError(err?.message || 'Failed to export image. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  // Copy Blessing Message Text to Clipboard
  const handleCopyBlessingText = async () => {
    const current = activeChorister || celebrant || allChoristers[0];
    if (!current) return;
    try {
      const blessingText = formatBirthdayGreeting(current, currentDate);
      await navigator.clipboard.writeText(blessingText);
      setIsBlessingCopied(true);
      setTimeout(() => setIsBlessingCopied(false), 3000);
    } catch (err) {
      console.error('Copy blessing text failed:', err);
    }
  };

  // Copy Image to Clipboard
  const handleCopyToClipboard = async () => {
    const current = activeChorister || celebrant || allChoristers[0];
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2500);
        } catch (copyErr) {
          console.warn('Clipboard image write fallback:', copyErr);
          if (current) {
            const msg = formatBirthdayGreeting(current, currentDate);
            await navigator.clipboard.writeText(msg);
            setIsBlessingCopied(true);
            setTimeout(() => setIsBlessingCopied(false), 2500);
          }
        }
      }, 'image/png');
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    }
  };

  // Share via WhatsApp
  const handleWhatsAppShare = () => {
    const current = activeChorister || celebrant || allChoristers[0];
    if (!current) return;
    const greeting = formatBirthdayGreeting(current, currentDate);
    const cleanPhone = current.phoneNumber?.replace(/[^0-9]/g, '');
    const phoneParam = cleanPhone ? (cleanPhone.startsWith('0') ? '94' + cleanPhone.slice(1) : cleanPhone) : '';
    const shareUrl = `https://wa.me/${phoneParam}?text=${encodeURIComponent(greeting + '\n\n(Official Birthday Flyer generated and ready to attach!)')}`;
    window.open(shareUrl, '_blank');
  };

  if (!isOpen) return null;

  const currentChorister = activeChorister || celebrant || allChoristers[0];
  const age = currentChorister ? calculateBirthdayAge(currentChorister.birthdate, currentDate) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto">
      <div 
        id="birthday-flyer-modal"
        className="relative w-full max-w-6xl bg-[#141416] border border-[#2A2A2E] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#26262B] bg-[#1A1A1E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-neutral-950 font-black shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base sm:text-lg">
                  Birthday Flyer Generator
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  St. Cecilia&apos;s Choir
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Official composite portrait generator for {currentChorister?.name || 'Choir Celebrants'} {age ? `(Turning ${age})` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Switch Celebrant Dropdown */}
            {allChoristers.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 bg-[#222226] px-2.5 py-1.5 rounded-lg border border-[#333339]">
                <User className="w-3.5 h-3.5 text-neutral-400" />
                <select
                  aria-label="Select Chorister for Birthday Flyer"
                  value={currentChorister?.id || ''}
                  onChange={(e) => {
                    const found = allChoristers.find((c) => c.id === e.target.value);
                    if (found) {
                      setActiveChorister(found);
                      setCustomPhotoDataUrl(null);
                      setPanX(0);
                      setPanY(0);
                      setZoom(1.0);
                      onSelectAnotherChorister?.(found);
                    }
                  }}
                  className="bg-transparent text-xs text-neutral-200 focus:outline-none cursor-pointer max-w-[200px]"
                >
                  {allChoristers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-[#1A1A1E] text-white">
                      {c.name} ({c.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              id="close-flyer-modal"
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              title="Close Generator"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content: 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto flex-1">
          {/* Left Column: Interactive Canvas Stage (7 cols on lg) */}
          <div className="lg:col-span-7 bg-[#0A0A0C] p-4 sm:p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-[#26262B] relative">
            {/* Drag & Pan Guidance Banner */}
            <div className="w-full max-w-lg mb-2 flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1">
                <Move className="w-3 h-3 text-amber-400" />
                <span>Click &amp; drag on canvas to pan portrait</span>
              </span>
              <span className="text-neutral-500 font-mono">
                Zoom: {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Canvas Container */}
            <div className="relative w-full max-w-lg aspect-square rounded-xl shadow-2xl overflow-hidden border border-neutral-800 bg-[#0F0F12] flex items-center justify-center group select-none">
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
                title="Drag to reposition photo, mouse wheel to zoom"
              />

              {/* Status Badge Over Canvas */}
              {isDetectingFace && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-neutral-900/90 text-amber-300 text-xs font-semibold flex items-center gap-1.5 shadow-lg border border-amber-500/30 backdrop-blur-sm animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  <span>Centering Face...</span>
                </div>
              )}

              {faceDetectionMsg && !isDetectingFace && (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-neutral-900/80 text-emerald-300 text-[11px] font-medium flex items-center gap-1.5 shadow-lg border border-emerald-500/30 backdrop-blur-sm">
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>{faceDetectionMsg}</span>
                </div>
              )}

              {/* Quick Canvas Action Overlays */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-neutral-900/80 p-1 rounded-lg border border-neutral-700/60 backdrop-blur-sm opacity-90 hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setZoom((z) => Math.min(z + 0.1, 3.0))}
                  className="p-1.5 text-neutral-300 hover:text-white rounded hover:bg-neutral-800 cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoom((z) => Math.max(z - 0.1, 0.4))}
                  className="p-1.5 text-neutral-300 hover:text-white rounded hover:bg-neutral-800 cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetAlignment}
                  className="p-1.5 text-neutral-300 hover:text-amber-300 rounded hover:bg-neutral-800 cursor-pointer"
                  title="Reset Position"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setShowGuides(!showGuides)}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    showGuides ? 'text-sky-400 bg-sky-950/50' : 'text-neutral-400 hover:text-white'
                  }`}
                  title="Toggle Alignment Guides"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Error display if any */}
            {renderError && (
              <div className="w-full max-w-lg mt-2 p-2 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{renderError}</span>
              </div>
            )}

            {/* Quality Note */}
            <div className="w-full max-w-lg mt-3 flex items-center justify-between text-[11px] text-neutral-400">
              <span className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
                <Check className="w-3.5 h-3.5" />
                <span>St. Cecilia Official Canvas Compositor</span>
              </span>
              <span className="text-neutral-500">
                Resolution: {exportResolution === 'hd' ? '2048 × 2048 (Ultra-HD)' : '1024 × 1024'}
              </span>
            </div>
          </div>

          {/* Right Column: Controls, Customization & Actions (5 cols on lg) */}
          <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between bg-[#141417] space-y-5 overflow-y-auto">
            <div className="space-y-5">
              {/* 1. Celebrant Info Card */}
              <div className="p-3.5 rounded-xl bg-[#1C1C20] border border-[#2E2E34] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden border border-amber-400/40 bg-neutral-900 shrink-0">
                    <img
                      src={getActivePhotoUrl()}
                      alt={currentChorister?.name || 'Celebrant'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/choir_logo.jpg';
                      }}
                    />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">
                      {currentChorister?.name || 'Select a Member'}
                    </h4>
                    <div className="text-xs text-neutral-400 flex items-center gap-1.5">
                      <span className="text-amber-400 font-semibold">{currentChorister?.role || 'Chorister'}</span>
                      {(() => {
                        const calculatedAge = currentChorister ? (calculateBirthdayAge(currentChorister.birthdate, currentDate) ?? currentChorister.age) : null;
                        return calculatedAge && calculatedAge > 0 ? (
                          <span>• {calculatedAge} years</span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Upload Alternate Photo */}
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#28282E] hover:bg-[#34343D] text-xs text-neutral-200 hover:text-white cursor-pointer border border-[#3E3E48] transition-all font-medium">
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Change Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* 2. Golden Frame Lock / Calibration Mode Bar */}
              <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                isFrameLocked 
                  ? 'bg-[#18181C] border-[#2A2A30]' 
                  : 'bg-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-500/10'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isFrameLocked 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                      : 'bg-amber-400 text-neutral-950 font-bold shadow-md shadow-amber-500/30 animate-pulse'
                  }`}>
                    {isFrameLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{isFrameLocked ? 'Golden Frame: Locked to Template' : 'Calibrating Default Frame Position'}</span>
                      {isFrameLocked ? (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/30 font-medium">
                          Calibrated
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40 font-bold">
                          Admin Mode
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400">
                      {isFrameLocked 
                        ? 'Position the photo below: move up, down, left, right or zoom' 
                        : 'Adjust circle position to match template, then save as permanent default'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const nextState = !isFrameLocked;
                      setIsFrameLocked(nextState);
                      setShowGuides(nextState);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isFrameLocked
                        ? 'bg-[#26262E] hover:bg-[#32323C] text-neutral-200 hover:text-white border border-[#3E3E48]'
                        : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700'
                    }`}
                  >
                    {isFrameLocked ? (
                      <>
                        <Settings className="w-3.5 h-3.5 text-amber-400" />
                        <span>Set Default Frame</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Lock Frame</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Toast feedback when default frame is saved */}
              {frameSaveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-fade-in shadow-lg">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold">Permanent Default Frame Saved!</span>
                    <p className="text-[11px] text-emerald-300/80">
                      All new flyers will now use this exact golden frame position automatically.
                    </p>
                  </div>
                </div>
              )}

              {/* ADMIN MODE: Golden Frame Calibration Panel */}
              {!isFrameLocked && (
                <div className="p-4 rounded-xl bg-[#1C1812] border-2 border-amber-500/40 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-amber-400" />
                      <span>Calibrate Golden Frame Default</span>
                    </h5>
                    <span className="text-[11px] font-mono text-amber-400/90">
                      X: {(circleXRatio * 100).toFixed(1)}% | Y: {(circleYRatio * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between text-neutral-300 mb-1">
                        <span>Frame Horizontal Center (X)</span>
                        <span className="font-mono text-amber-300">{(circleXRatio * 100).toFixed(1)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.30"
                        max="0.70"
                        step="0.001"
                        value={circleXRatio}
                        onChange={(e) => setCircleXRatio(parseFloat(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer h-2 bg-neutral-800 rounded-lg"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-neutral-300 mb-1">
                        <span>Frame Vertical Center (Y)</span>
                        <span className="font-mono text-amber-300">{(circleYRatio * 100).toFixed(1)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.15"
                        max="0.50"
                        step="0.001"
                        value={circleYRatio}
                        onChange={(e) => setCircleYRatio(parseFloat(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer h-2 bg-neutral-800 rounded-lg"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-neutral-300 mb-1">
                        <span>Frame Radius (Size)</span>
                        <span className="font-mono text-amber-300">{(circleRadiusRatio * 100).toFixed(1)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.10"
                        max="0.30"
                        step="0.001"
                        value={circleRadiusRatio}
                        onChange={(e) => setCircleRadiusRatio(parseFloat(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer h-2 bg-neutral-800 rounded-lg"
                      />
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                      <button
                        onClick={handleSaveDefaultFramePosition}
                        disabled={isSavingFrameDefaults}
                        className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-neutral-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isSavingFrameDefaults ? 'Saving Default...' : 'Save Default Frame'}</span>
                      </button>

                      <button
                        onClick={handleResetToFactoryFrame}
                        className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold cursor-pointer"
                      >
                        Reset Defaults
                      </button>

                      <button
                        onClick={() => {
                          setIsFrameLocked(true);
                          setShowGuides(false);
                        }}
                        className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Photo Position & Alignment Controls */}
              <div className="p-4 rounded-xl bg-[#1A1A1E] border border-[#2A2A30] space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-amber-400" />
                    <span>Photo Position &amp; Alignment</span>
                  </h5>

                  <button
                    onClick={() => {
                      if (userImgRef.current) {
                        autoAlignFace(userImgRef.current.src);
                      }
                    }}
                    className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                    title="Auto-detect face and center inside the circular frame"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Center Face (AI)</span>
                  </button>
                </div>

                {/* Directional Nudge Pad */}
                <div className="p-3 rounded-xl bg-[#141418] border border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-neutral-300">
                    <span className="font-bold text-white block">Directional Controls</span>
                    <span className="text-[11px] text-neutral-400">Click to nudge photo or drag canvas</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => nudgePhoto(-15, 0)}
                      className="p-2 rounded-lg bg-[#24242A] hover:bg-amber-400 hover:text-neutral-950 text-neutral-200 transition-colors cursor-pointer active:scale-95"
                      title="Move Left (15px)"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => nudgePhoto(0, -15)}
                        className="p-2 rounded-lg bg-[#24242A] hover:bg-amber-400 hover:text-neutral-950 text-neutral-200 transition-colors cursor-pointer active:scale-95"
                        title="Move Up (15px)"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => nudgePhoto(0, 15)}
                        className="p-2 rounded-lg bg-[#24242A] hover:bg-amber-400 hover:text-neutral-950 text-neutral-200 transition-colors cursor-pointer active:scale-95"
                        title="Move Down (15px)"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => nudgePhoto(15, 0)}
                      className="p-2 rounded-lg bg-[#24242A] hover:bg-amber-400 hover:text-neutral-950 text-neutral-200 transition-colors cursor-pointer active:scale-95"
                      title="Move Right (15px)"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setPanX(0);
                        setPanY(0);
                      }}
                      className="ml-2 px-2.5 py-2 rounded-lg bg-[#24242A] hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold cursor-pointer"
                      title="Center Photo (0, 0)"
                    >
                      Center
                    </button>
                  </div>
                </div>

                {/* Photo Zoom Slider */}
                <div>
                  <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
                    <span>Photo Scale / Zoom</span>
                    <span className="font-mono text-neutral-200 font-bold">{Math.round(zoom * 100)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setZoom((z) => Math.max(z - 0.05, 0.4))}
                      className="px-2.5 py-1 bg-[#24242A] hover:bg-[#303038] rounded text-neutral-300 hover:text-white text-xs font-bold cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="0.4"
                      max="3.0"
                      step="0.02"
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="flex-1 accent-amber-400 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
                    />
                    <button
                      onClick={() => setZoom((z) => Math.min(z + 0.05, 3.0))}
                      className="px-2.5 py-1 bg-[#24242A] hover:bg-[#303038] rounded text-neutral-300 hover:text-white text-xs font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Rotation Slider */}
                <div>
                  <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
                    <span>Photo Tilt / Rotation</span>
                    <span className="font-mono text-neutral-200">{rotation}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="-30"
                      max="30"
                      step="1"
                      value={rotation}
                      onChange={(e) => setRotation(parseInt(e.target.value, 10))}
                      className="flex-1 accent-amber-400 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
                    />
                    {rotation !== 0 && (
                      <button
                        onClick={() => setRotation(0)}
                        className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                      >
                        Reset 0°
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-neutral-800 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-neutral-300 select-none">
                    <input
                      type="checkbox"
                      checked={showGoldRim}
                      onChange={(e) => setShowGoldRim(e.target.checked)}
                      className="rounded border-neutral-700 text-amber-500 focus:ring-amber-500/20"
                    />
                    <span>Gold Rim Border</span>
                  </label>

                  <button
                    onClick={handleResetAlignment}
                    className="text-neutral-400 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Photo Position</span>
                  </button>
                </div>
              </div>

              {/* Template Info Bar & Quality */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-[#18181C] border border-[#26262C] text-xs">
                <div className="flex items-center gap-1.5 text-neutral-400">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Template: <strong className="text-white">St. Cecilia Official Template</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-400">Quality:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExportResolution('standard')}
                      className={`px-2 py-0.5 rounded text-xs font-semibold cursor-pointer ${
                        exportResolution === 'standard' ? 'bg-neutral-700 text-white' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      1K
                    </button>
                    <button
                      onClick={() => setExportResolution('hd')}
                      className={`px-2 py-0.5 rounded text-xs font-bold cursor-pointer ${
                        exportResolution === 'hd' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      2K Ultra-HD ✨
                    </button>
                  </div>
                </div>
              </div>

              {/* Official Choir Fam Birthday Blessing Message Card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-b from-[#1E1B24] to-[#141218] border border-amber-500/35 space-y-2 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <h5 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                      Choir Fam Birthday Blessing <Heart className="w-3 h-3 text-rose-400 fill-rose-400 inline" />
                    </h5>
                  </div>
                  <button
                    id="btn-copy-blessing-box"
                    onClick={handleCopyBlessingText}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                      isBlessingCopied
                        ? 'bg-emerald-500 text-neutral-950 shadow-md'
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40'
                    }`}
                    title="Click to copy blessing message to clipboard"
                  >
                    {isBlessingCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-neutral-950" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-amber-300" />
                        <span>Copy Blessing</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 rounded-lg bg-[#0C0B0E] border border-neutral-800/80 text-xs text-neutral-200 font-sans whitespace-pre-wrap leading-relaxed select-all">
                  {currentChorister ? formatBirthdayGreeting(currentChorister, currentDate) : 'Please select a celebrant'}
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-0.5">
                  <span className="text-amber-300/80 flex items-center gap-1 font-medium">
                    ⚡ Automatically copies to clipboard on download!
                  </span>
                  {isBlessingCopied && (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Ready to paste into WhatsApp
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Auto-Copied Banner upon Download */}
            {downloadAutoCopied && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950 via-[#0B2E1E] to-emerald-950 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 shadow-xl shadow-emerald-950/50">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-neutral-950 flex items-center justify-center font-bold shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-white block text-xs">🎉 Flyer Downloaded &amp; Blessing Auto-Copied!</span>
                  <span className="text-[11px] text-emerald-300/90 leading-tight block">
                    The Choir Fam blessing is in your clipboard — ready to paste into WhatsApp.
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Action Buttons */}
            <div className="pt-3 border-t border-[#26262B] space-y-2.5">
              <button
                id="download-flyer-png"
                onClick={() => handleDownload('png')}
                disabled={isDownloading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:via-amber-400 hover:to-amber-500 text-neutral-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {isDownloading ? 'Rendering Flyer...' : 'Download Flyer & Auto-Copy Blessing (PNG)'}
                </span>
              </button>

              <div className="grid grid-cols-3 gap-2">
                <button
                  id="copy-blessing-text-btn"
                  onClick={handleCopyBlessingText}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isBlessingCopied
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-[#222228] hover:bg-[#2C2C34] text-amber-300 hover:text-amber-200 border-[#38332E]'
                  }`}
                  title="Copy Choir Fam blessing text message"
                >
                  {isBlessingCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-white" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Copy Blessing</span>
                    </>
                  )}
                </button>

                <button
                  id="share-flyer-whatsapp"
                  onClick={handleWhatsAppShare}
                  className="py-2 px-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-600/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Open WhatsApp with Birthday Greeting"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <button
                  id="copy-flyer-clipboard"
                  onClick={handleCopyToClipboard}
                  className="py-2 px-2 rounded-xl bg-[#222228] hover:bg-[#2C2C34] text-neutral-200 hover:text-white border border-[#33333C] text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Copy flyer image to clipboard"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Copy Image</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
