import React from 'react';

interface KuVoiceLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  glow?: boolean;
  theme?: 'dark' | 'light' | 'auto';
  subtitle?: string;
}

export const KuVoiceLogo: React.FC<KuVoiceLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
  glow = true,
  theme = 'dark',
  subtitle,
}) => {
  const sizeMap = {
    xs: { emblem: 'w-7 h-7', text: 'text-base', sub: 'text-[9px]' },
    sm: { emblem: 'w-9 h-9', text: 'text-lg', sub: 'text-[10px]' },
    md: { emblem: 'w-11 h-11', text: 'text-xl', sub: 'text-xs' },
    lg: { emblem: 'w-16 h-16', text: 'text-2xl', sub: 'text-sm' },
    xl: { emblem: 'w-24 h-24', text: 'text-4xl', sub: 'text-base' },
  };

  const { emblem, text, sub } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Official KV Interlocking Emblem with Acoustic Waves */}
      <div
        className={`relative ${emblem} flex-shrink-0 flex items-center justify-center ${
          glow ? 'drop-shadow-[0_0_12px_rgba(56,189,248,0.35)]' : ''
        }`}
      >
        <svg
          viewBox="0 0 500 320"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Left soundwave gradient (Deep Blue to Royal Indigo) */}
            <linearGradient id="swLeft" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="50%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#60a5fa" />
            </linearGradient>

            {/* Right soundwave gradient (Cyan to Bright Turquoise) */}
            <linearGradient id="swRight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>

            {/* Left ribbon gradient (Cyan wing blending to Blue and Purple/Violet curve) */}
            <linearGradient id="ribbonGradLeft" x1="0%" y1="0%" x2="70%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="25%" stopColor="#2563eb" />
              <stop offset="70%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>

            {/* Center vertical stem (Cyan to Royal Blue) */}
            <linearGradient id="ribbonGradStem" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="35%" stopColor="#38bdf8" />
              <stop offset="80%" stopColor="#2563eb" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>

            {/* Right wing ribbon (Blue to Cyan Turquoise) */}
            <linearGradient id="ribbonGradRight" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#2dd4bf" />
            </linearGradient>

            {/* Lower loop glow and depth */}
            <linearGradient id="ribbonGradLoop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9333ea" />
              <stop offset="50%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>

            {/* Soft drop shadow for 3D ribbon effect */}
            <filter id="ribbonShadowSmall" x="-15%" y="-15%" width="130%" height="130%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* SOUNDWAVES BACKGROUND */}
          {/* Left soundwave arcs */}
          <g fill="none" stroke="url(#swLeft)" strokeWidth="10" strokeLinecap="round">
            <path d="M 180 95 A 110 110 0 0 0 180 225" />
            <path d="M 160 108 A 95 95 0 0 0 160 212" strokeWidth="9" />
            <path d="M 140 122 A 80 80 0 0 0 140 198" strokeWidth="8" />
            <path d="M 120 136 A 65 65 0 0 0 120 184" strokeWidth="7" />
            <line x1="102" y1="150" x2="102" y2="170" strokeWidth="8" />
            <circle cx="85" cy="160" r="5" fill="#4f46e5" stroke="none" />
          </g>

          {/* Right soundwave arcs */}
          <g fill="none" stroke="url(#swRight)" strokeWidth="10" strokeLinecap="round">
            <path d="M 320 95 A 110 110 0 0 1 320 225" />
            <path d="M 340 108 A 95 95 0 0 1 340 212" strokeWidth="9" />
            <path d="M 360 122 A 80 80 0 0 1 360 198" strokeWidth="8" />
            <path d="M 380 136 A 65 65 0 0 1 380 184" strokeWidth="7" />
            <line x1="398" y1="150" x2="398" y2="170" strokeWidth="8" />
            <circle cx="415" cy="160" r="5" fill="#2dd4bf" stroke="none" />
          </g>

          {/* CENTRAL INTERLOCKING 'KV' 3D RIBBON MONOGRAM */}
          <g filter="url(#ribbonShadowSmall)">
            {/* Central vertical stem with top curved bevel */}
            <path
              d="M 235 68 C 235 68 250 68 258 75 C 263 80 263 90 263 105 L 263 190 C 263 205 255 218 245 224 L 235 228 L 235 68 Z"
              fill="url(#ribbonGradStem)"
            />

            {/* Left swooping wing and bottom curve (Letter V left stroke looping under) */}
            <path
              d="M 162 70 C 172 70 192 84 204 112 L 236 186 C 244 205 253 234 246 250 C 238 266 218 268 206 256 C 196 244 190 220 182 195 L 170 152 C 165 135 152 98 162 70 Z"
              fill="url(#ribbonGradLeft)"
              opacity="0.96"
            />

            {/* Smooth bottom loop connector (wrapping from V loop upwards into K wing) */}
            <path
              d="M 218 262 C 235 264 252 254 260 238 C 270 218 265 190 252 165 L 244 148 L 228 178 L 238 200 C 244 214 246 228 240 238 C 234 246 226 248 218 246 Z"
              fill="url(#ribbonGradLoop)"
            />

            {/* Right wing of K / V (upper right sweeping wing) */}
            <path
              d="M 268 70 C 260 70 270 95 284 122 L 312 178 C 324 200 338 226 345 240 C 347 244 336 245 328 238 L 285 180 L 264 150 L 278 120 C 290 98 296 78 288 72 C 282 68 274 69 268 70 Z"
              fill="url(#ribbonGradRight)"
            />

            {/* Right lower diagonal leg of K */}
            <path
              d="M 260 168 L 305 242 C 314 256 325 264 338 265 C 345 265 348 260 342 254 L 288 182 Z"
              fill="url(#ribbonGradRight)"
              opacity="0.9"
            />

            {/* Front sharp white/cyan highlight on left V crest */}
            <path
              d="M 166 72 C 172 78 188 105 196 128 L 240 222 C 244 230 242 240 234 245 C 228 248 222 245 218 238 L 180 156 C 172 138 162 102 166 72 Z"
              fill="#ffffff"
              opacity="0.25"
            />

            {/* Front sharp highlight on right wing crest */}
            <path
              d="M 272 74 C 275 80 286 102 296 124 L 332 205 C 336 215 334 220 328 212 L 288 145 C 280 130 274 100 272 74 Z"
              fill="#ffffff"
              opacity="0.28"
            />
          </g>
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-2">
            <span
              className={`font-black tracking-tight ${text} ${
                theme === 'light'
                  ? 'text-blue-950'
                  : 'bg-gradient-to-r from-sky-300 via-cyan-200 to-indigo-300 bg-clip-text text-transparent drop-shadow-sm'
              }`}
            >
              KD Voice
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
              Language Lab
            </span>
          </div>
          <span className={`font-medium ${sub} text-slate-400`}>
            {subtitle || 'AI Voice & Speaking Assessment Lab'}
          </span>
        </div>
      )}
    </div>
  );
};
