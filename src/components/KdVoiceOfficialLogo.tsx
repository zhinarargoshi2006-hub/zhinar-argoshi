import React from 'react';

interface KdVoiceOfficialLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showText?: boolean;
  layout?: 'vertical' | 'horizontal';
  className?: string;
  glow?: boolean;
  theme?: 'dark' | 'light' | 'auto';
  subtitle?: string;
}

export const KdVoiceOfficialLogo: React.FC<KdVoiceOfficialLogoProps> = ({
  size = 'md',
  showText = true,
  layout = 'horizontal',
  className = '',
  glow = true,
  theme = 'dark',
  subtitle,
}) => {
  const sizeMap = {
    xs: { emblemW: 'w-7 h-7', text: 'text-xs', sub: 'text-[9px]' },
    sm: { emblemW: 'w-8 h-8 sm:w-9 sm:h-9', text: 'text-sm', sub: 'text-[10px]' },
    md: { emblemW: 'w-10 h-10 sm:w-11 sm:h-11', text: 'text-base sm:text-lg', sub: 'text-xs' },
    lg: { emblemW: 'w-16 h-16', text: 'text-xl sm:text-2xl', sub: 'text-sm' },
    xl: { emblemW: 'w-24 h-24', text: 'text-2xl sm:text-3xl', sub: 'text-base' },
    hero: { emblemW: 'w-32 h-32 sm:w-40 sm:h-40', text: 'text-3xl sm:text-4xl', sub: 'text-sm sm:text-base' },
  };

  const { emblemW, text, sub } = sizeMap[size];

  // Soundwave bars flanking left and right
  const leftBars = [
    { x: 55, y: 155, h: 40, w: 6 },
    { x: 67, y: 140, h: 70, w: 6 },
    { x: 79, y: 125, h: 100, w: 6 },
    { x: 91, y: 105, h: 140, w: 6 },
    { x: 103, y: 88, h: 175, w: 6.5 },
    { x: 115, y: 120, h: 110, w: 6.5 },
    { x: 127, y: 140, h: 70, w: 6 },
  ];

  const rightBars = [
    { x: 367, y: 140, h: 70, w: 6 },
    { x: 379, y: 120, h: 110, w: 6.5 },
    { x: 391, y: 88, h: 175, w: 6.5 },
    { x: 403, y: 105, h: 140, w: 6 },
    { x: 415, y: 125, h: 100, w: 6 },
    { x: 427, y: 140, h: 70, w: 6 },
    { x: 439, y: 155, h: 40, w: 6 },
  ];

  const emblemSvg = (
    <div
      className={`relative ${emblemW} flex-shrink-0 flex items-center justify-center ${
        glow ? 'drop-shadow-[0_0_18px_rgba(56,189,248,0.4)]' : ''
      }`}
    >
      <svg
        viewBox="0 0 500 400"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Vertical Soundwave gradient (Purple bottom to Cyan top) */}
          <linearGradient id="kdWaveGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#9333ea" />
            <stop offset="45%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>

          {/* Letter K Left Stem (Navy to Royal Blue to Cyan highlight) */}
          <linearGradient id="kStemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="40%" stopColor="#2563eb" />
            <stop offset="85%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          {/* Letter K Top Angle (Deep Azure to Bright Sky) */}
          <linearGradient id="kTopGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="50%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>

          {/* Letter K Bottom Branch (Deep Royal Blue) */}
          <linearGradient id="kBottomGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e40af" />
            <stop offset="70%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>

          {/* Center Swooping Ribbon V (Cyan to Electric Indigo to Violet) */}
          <linearGradient id="vRibbonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="30%" stopColor="#06b6d4" />
            <stop offset="65%" stopColor="#3b82f6" />
            <stop offset="85%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>

          {/* Letter D 3D Outer Arc (Deep Purple/Magenta to Royal Violet) */}
          <linearGradient id="dArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="35%" stopColor="#7c3aed" />
            <stop offset="70%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#c026d3" />
          </linearGradient>

          {/* Inner D shadow bevel */}
          <linearGradient id="dInnerGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#581c87" />
            <stop offset="60%" stopColor="#7e22ce" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>

          {/* Soft drop shadow for 3D depth */}
          <filter id="kd3DShadow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#020617" floodOpacity="0.45" />
          </filter>
        </defs>

        {/* 1. LEFT EQUALIZER SOUNDWAVES */}
        <g id="left-soundwaves">
          {leftBars.map((b, i) => (
            <rect
              key={`l-${i}`}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx={b.w / 2}
              fill="url(#kdWaveGrad)"
              opacity={0.88 + i * 0.02}
            />
          ))}
        </g>

        {/* 2. RIGHT EQUALIZER SOUNDWAVES */}
        <g id="right-soundwaves">
          {rightBars.map((b, i) => (
            <rect
              key={`r-${i}`}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx={b.w / 2}
              fill="url(#kdWaveGrad)"
              opacity={0.88 + (6 - i) * 0.02}
            />
          ))}
        </g>

        {/* 3. 3D EMBLEM 'KD' WITH CENTRAL 'V' SWOOP */}
        <g filter="url(#kd3DShadow)">
          {/* ====== 3D LETTER D (Right Loop) ====== */}
          {/* Main D Outer Loop */}
          <path
            d="M 270 90 L 315 90 C 375 90 405 130 405 185 C 405 240 375 280 315 280 L 270 280 Z"
            fill="url(#dArcGrad)"
          />
          {/* D Inner Cutout Hole */}
          <path
            d="M 298 122 L 315 122 C 350 122 368 145 368 185 C 368 225 350 248 315 248 L 298 248 Z"
            fill="#090d16"
          />
          {/* D Inner Bevel Arc */}
          <path
            d="M 298 122 L 315 122 C 342 122 360 142 360 185 C 360 215 348 238 322 245 C 352 240 368 220 368 185 C 368 145 350 122 315 122 Z"
            fill="url(#dInnerGrad)"
            opacity="0.75"
          />

          {/* ====== 3D LETTER K (Left Stem & Branches) ====== */}
          {/* K Vertical Main Stem */}
          <path
            d="M 148 90 L 195 90 L 195 280 L 148 280 Z"
            fill="url(#kStemGrad)"
          />
          {/* K Left Stem 3D Bevel Highlight */}
          <path
            d="M 148 90 L 160 90 L 160 280 L 148 280 Z"
            fill="#38bdf8"
            opacity="0.35"
          />

          {/* K Top Angled Arm */}
          <path
            d="M 188 175 L 268 90 L 315 90 L 225 185 Z"
            fill="url(#kTopGrad)"
          />
          {/* K Top Arm Bevel Edge */}
          <path
            d="M 268 90 L 315 90 L 305 102 L 260 102 Z"
            fill="#ffffff"
            opacity="0.45"
          />

          {/* K Lower Branch */}
          <path
            d="M 215 178 L 295 280 L 248 280 L 180 195 Z"
            fill="url(#kBottomGrad)"
          />

          {/* ====== CENTRAL 'V' SWOOPING RIBBON (Overlay loop) ====== */}
          {/* The swooping V wraps from the base of K, curls smoothly, and loops into the center */}
          <path
            d="M 175 125 C 190 150 220 220 236 265 C 248 298 280 300 295 272 C 315 235 348 165 372 135 C 378 128 368 120 355 130 C 330 160 295 235 282 258 C 275 270 260 270 252 250 C 238 215 210 155 198 120 C 192 108 178 112 175 125 Z"
            fill="url(#vRibbonGrad)"
          />
          {/* V Ribbon Front White/Cyan Crest Highlight */}
          <path
            d="M 178 128 C 190 152 218 218 235 262 C 242 278 252 284 262 275 C 255 265 245 245 238 228 C 225 195 200 145 192 122 C 188 114 180 118 178 128 Z"
            fill="#ffffff"
            opacity="0.4"
          />

          {/* Right Upper Crest Highlight of the V swoop */}
          <path
            d="M 370 138 C 348 165 318 225 305 250 C 314 235 340 180 360 150 C 368 138 375 130 370 138 Z"
            fill="#ffffff"
            opacity="0.5"
          />
        </g>
      </svg>
    </div>
  );

  return (
    <div
      className={`inline-flex items-center select-none ${
        layout === 'vertical' ? 'flex-col text-center gap-2' : 'gap-3'
      } ${className}`}
    >
      {emblemSvg}

      {showText && (
        <div className={`flex flex-col leading-tight ${layout === 'vertical' ? 'items-center' : ''}`}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span
              className={`font-black tracking-tight ${text} ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}
            >
              KD
            </span>
            <span
              className={`font-black tracking-tight ${text} bg-gradient-to-r from-cyan-400 via-sky-300 to-fuchsia-400 bg-clip-text text-transparent`}
            >
              Voice
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider hidden sm:inline-block">
              1,000 قۆناغ
            </span>
          </div>
          <span className={`font-medium ${sub} text-slate-400`}>
            {subtitle || 'ئەکادیمیای دەنگ و فێربوونی قسەکردن'}
          </span>
        </div>
      )}
    </div>
  );
};
