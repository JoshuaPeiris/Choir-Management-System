import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles, Music } from 'lucide-react';
import { getChoirLogoUrl, getDriveDirectImageUrl } from '../utils/driveImage';

interface FullDisplayLogoIntroProps {
  isOpen: boolean;
  onClose: () => void;
  logoDriveUrl?: string;
  autoCloseSeconds?: number;
}

// Sacred harmonic notes
const MUSICAL_SYMBOLS = ['♩', '♪', '♫', '♬', '𝄞', '𝄢', '𝄡', '♭', '♮'];

export const FullDisplayLogoIntro: React.FC<FullDisplayLogoIntroProps> = ({
  isOpen,
  onClose,
  logoDriveUrl,
  autoCloseSeconds = 5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });
  const [progress, setProgress] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  // Audio Context Ref for soft opening chime
  const audioCtxRef = useRef<AudioContext | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Soft entrance sacred Gregorian chord
  const playSacredChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const frequencies = [261.63, 392.00, 523.25, 659.25];

      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        const baseVolume = 0.05 / (idx + 1);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(baseVolume, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.00001, now + 2.0 + idx * 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.3 + idx * 0.2);
      });
    } catch {
      // Audio policy safe
    }
  }, []);

  const playSacredChimeRef = useRef(playSacredChime);
  playSacredChimeRef.current = playSacredChime;

  // 5-Second Smooth Loading Progress Timer directly proceeding to the next step
  // Stable effect that NEVER resets on parent re-renders
  useEffect(() => {
    if (!isOpen) return;

    setProgress(0);
    setIsFadingOut(false);

    try {
      playSacredChimeRef.current();
    } catch {
      // Audio safe
    }

    const duration = 5000;
    const intervalMs = 40; // 25 updates per second for silky smooth progress
    const startTime = Date.now();

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentPct = Math.min(100, (elapsed / duration) * 100);
      setProgress(currentPct);

      // Trigger smooth fade-out 350ms before completion
      if (elapsed >= duration - 350) {
        setIsFadingOut(true);
      }

      if (elapsed >= duration) {
        clearInterval(intervalId);
        onCloseRef.current();
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [isOpen]);

  // Gentle Mouse/Touch Perspective Shift
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -12;
    const rotateY = ((x - centerX) / centerX) * 12;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ x: rotateX, y: rotateY, glareX, glareY });
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!containerRef.current || e.touches.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -14;
    const rotateY = ((x - centerX) / centerX) * 14;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ x: rotateX, y: rotateY, glareX, glareY });
  };

  const handleResetTilt = () => {
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
  };

  // Canvas Stardust & Floating Musical Notes
  useEffect(() => {
    if (!isOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      maxAlpha: number;
      symbol?: string;
      rotation: number;
      vRot: number;
      hue: number;
    }

    const particles: Particle[] = [];
    const count = Math.min(50, Math.floor((width * height) / 22000));

    for (let i = 0; i < count; i++) {
      const isSymbol = Math.random() < 0.3;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.35 - Math.random() * 0.65,
        size: isSymbol ? 13 + Math.random() * 11 : 1.5 + Math.random() * 2.5,
        alpha: Math.random() * 0.2,
        maxAlpha: isSymbol ? 0.35 + Math.random() * 0.3 : 0.6 + Math.random() * 0.3,
        symbol: isSymbol ? MUSICAL_SYMBOLS[Math.floor(Math.random() * MUSICAL_SYMBOLS.length)] : undefined,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.02,
        hue: 36 + Math.random() * 16,
      });
    }

    let lastTime = performance.now();
    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // Subtle celestial vignette
      const grad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        60,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.6
      );
      grad.addColorStop(0, 'rgba(245, 158, 11, 0.07)');
      grad.addColorStop(0.5, 'rgba(180, 83, 9, 0.02)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx * 60 * dt;
        p.y += p.vy * 60 * dt;
        p.rotation += p.vRot * 60 * dt;

        if (p.y < -30) {
          p.y = height + 20;
          p.x = Math.random() * width;
        }
        if (p.x < -30) p.x = width + 20;
        if (p.x > width + 30) p.x = -20;

        p.alpha = 0.15 + Math.sin(time * 0.002 + p.x) * 0.12 + p.maxAlpha * 0.5;

        ctx.save();
        if (p.symbol) {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.font = `bold ${p.size}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = `hsla(${p.hue}, 95%, 65%, ${p.alpha})`;
          ctx.shadowColor = 'rgba(245, 158, 11, 0.6)';
          ctx.shadowBlur = 6;
          ctx.fillText(p.symbol, 0, 0);
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 90%, 75%, ${p.alpha})`;
          ctx.shadowColor = 'rgba(251, 191, 36, 0.8)';
          ctx.shadowBlur = 8;
          ctx.fill();
        }
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const resolvedLogoUrl = getDriveDirectImageUrl(logoDriveUrl) || getChoirLogoUrl();

  // Loading Status Label based on 5-second progress
  const getLoadingStatusText = () => {
    if (progress < 30) return 'Harmonizing Choir Records & Sacred Liturgy...';
    if (progress < 70) return 'Connecting Real-Time Liturgical Workspace...';
    return "Entering St. Cecilia's Choir Portal...";
  };

  return (
    <div 
      className={`fixed inset-0 z-[100] bg-[#07080B] text-white flex flex-col justify-center items-center select-none overflow-hidden transition-all duration-350 ease-out ${
        isFadingOut ? 'opacity-0 scale-[1.02] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleResetTilt}
      onMouseLeave={handleResetTilt}
    >
      {/* Background Stardust & Musical Notes Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Radiant Golden Glow Behind Centerpiece */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[580px] h-[340px] sm:h-[580px] rounded-full bg-gradient-to-tr from-amber-600/15 via-amber-500/10 to-transparent blur-3xl pointer-events-none animate-pulse duration-1000" />

      {/* Main Centered Content */}
      <main 
        ref={containerRef}
        className="relative z-10 flex flex-col items-center justify-center p-4 max-w-lg w-full text-center"
      >
        {/* Animated Sacred Rings Surrounding Perfectly Centered Logo */}
        <div className="relative flex items-center justify-center">
          
          {/* Outer Rotating Celestial Halo Ring */}
          <div 
            className="absolute w-[280px] sm:w-[410px] md:w-[460px] h-[280px] sm:h-[410px] md:h-[460px] rounded-full border border-amber-500/25 border-dashed animate-[spin_40s_linear_infinite] pointer-events-none"
            style={{
              boxShadow: '0 0 40px rgba(245, 158, 11, 0.12), inset 0 0 25px rgba(245, 158, 11, 0.08)'
            }}
          />

          {/* Inner Golden Counter-Rotating Geometric Ring */}
          <div 
            className="absolute w-[250px] sm:w-[370px] md:w-[420px] h-[250px] sm:h-[370px] md:h-[420px] rounded-full border border-amber-400/20 animate-[spin_25s_linear_infinite_reverse] pointer-events-none"
          />

          {/* Golden Pulse Aura */}
          <div 
            className="absolute w-[220px] sm:w-[330px] md:w-[370px] h-[220px] sm:h-[330px] md:h-[370px] rounded-full bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-transparent blur-xl animate-pulse pointer-events-none"
          />

          {/* The Centered 3D Shield */}
          <div 
            className="relative w-[230px] h-[230px] sm:w-[330px] sm:h-[330px] md:w-[370px] md:h-[370px] rounded-full p-2 bg-gradient-to-br from-amber-500/40 via-[#1A1610] to-neutral-950 shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_50px_rgba(245,158,11,0.35)] transition-transform duration-100 ease-out will-change-transform flex items-center justify-center"
            style={{
              transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(1.04, 1.04, 1.04)`,
            }}
          >
            {/* Perfectly Centered & Fitted Logo Container (Clean Black Background) */}
            <div className="w-full h-full rounded-full overflow-hidden relative bg-black flex items-center justify-center ring-2 ring-amber-400/70 shadow-[inset_0_0_30px_rgba(0,0,0,0.95)]">
              <img
                src={resolvedLogoUrl}
                alt="St. Cecilia's Choir Crest"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/choir_logo.jpg';
                }}
                className="select-none pointer-events-none transition-all duration-300 drop-shadow-md"
                style={{
                  width: '90%',
                  height: '90%',
                  objectFit: 'contain',
                  filter: 'contrast(1.05) brightness(1.02)',
                }}
              />

              {/* Dynamic 3D Specular Sheen */}
              <div 
                className="absolute inset-0 pointer-events-none mix-blend-overlay transition-opacity duration-200"
                style={{
                  background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.45) 0%, rgba(245, 158, 11, 0.15) 35%, transparent 70%)`,
                }}
              />

              {/* Glass Rim Reflection */}
              <div className="absolute inset-0 rounded-full border border-white/25 pointer-events-none" />
            </div>

            {/* Glowing Golden Accents */}
            <div className="absolute -top-2.5 -left-2.5 sm:-top-3.5 sm:-left-3.5 p-2 sm:p-2.5 rounded-full bg-amber-500/20 border border-amber-400/40 backdrop-blur-md shadow-lg shadow-amber-500/30 text-amber-300 animate-bounce duration-1000">
              <Music className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
            </div>

            <div className="absolute -bottom-2 -right-2 sm:-bottom-2.5 sm:-right-2.5 p-2 sm:p-2.5 rounded-full bg-amber-500/20 border border-amber-400/40 backdrop-blur-md shadow-lg shadow-amber-500/30 text-amber-300">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300 animate-spin duration-3000" />
            </div>
          </div>
        </div>

        {/* Choral Title & Typography */}
        <div className="mt-6 sm:mt-7 text-center space-y-1.5 pointer-events-none">
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight uppercase bg-gradient-to-r from-amber-100 via-amber-300 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_4px_12px_rgba(245,158,11,0.3)]">
            St. Cecilia&apos;s Choir
          </h2>

          <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-neutral-300 tracking-wider">
            <span>St. Michael&apos;s Church</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Koralawella</span>
          </div>
        </div>

        {/* 5-Second Loading Animation (No buttons, smooth auto-proceed) */}
        <div className="mt-7 w-full max-w-sm px-4 space-y-2 pointer-events-none">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
            <span className="flex items-center gap-1.5 text-amber-300 truncate">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin duration-3000 shrink-0" />
              <span className="truncate">{getLoadingStatusText()}</span>
            </span>
            <span className="font-mono text-amber-400 font-bold shrink-0 pl-2">
              {Math.min(100, Math.floor(progress))}%
            </span>
          </div>

          {/* Smooth Golden Glowing Progress Track */}
          <div className="w-full h-2.5 sm:h-3 rounded-full bg-[#101014] border border-amber-500/40 p-0.5 overflow-hidden shadow-[inset_0_1px_4px_rgba(0,0,0,0.8),0_0_15px_rgba(245,158,11,0.2)] relative">
            <div 
              className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200 transition-all duration-75 ease-linear shadow-[0_0_14px_rgba(245,158,11,0.9)] relative overflow-hidden"
              style={{
                width: `${Math.max(2, Math.min(100, progress))}%`,
              }}
            >
              {/* Internal subtle glow sweep */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
