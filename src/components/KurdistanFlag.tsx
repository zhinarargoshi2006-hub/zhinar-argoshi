import React from 'react';

interface KurdistanFlagProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  glow?: boolean;
  rounded?: boolean;
  bordered?: boolean;
}

export const KurdistanFlag: React.FC<KurdistanFlagProps> = ({
  size = 'md',
  className = '',
  glow = true,
  rounded = true,
  bordered = true,
}) => {
  const sizeMap = {
    xs: 'w-6 h-4',
    sm: 'w-8 h-5.5',
    md: 'w-12 h-8',
    lg: 'w-16 h-11',
    xl: 'w-24 h-16',
    hero: 'w-36 h-24 sm:w-48 sm:h-32',
  };

  // Generate 21 equidistant rays for the golden sun of Kurdistan
  const rays = Array.from({ length: 21 }).map((_, i) => {
    const angleDeg = (i * 360) / 21;
    return (
      <polygon
        key={i}
        points="150,100 145,55 155,55"
        fill="#FFD100"
        transform={`rotate(${angleDeg} 150 100)`}
      />
    );
  });

  return (
    <div
      className={`relative inline-block overflow-hidden select-none flex-shrink-0 ${sizeMap[size]} ${
        rounded ? 'rounded-lg' : ''
      } ${
        bordered ? 'ring-1 ring-white/20 shadow-lg shadow-black/40' : ''
      } ${glow ? 'drop-shadow-[0_0_14px_rgba(255,209,0,0.35)]' : ''} ${className}`}
      title="ئاڵای پیرۆزی کوردستان - Kurdistan Flag"
      role="img"
      aria-label="Flag of Kurdistan with 21-ray golden sun"
    >
      <svg
        viewBox="0 0 300 200"
        className="w-full h-full object-cover"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="sunGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Top Stripe: Red */}
        <rect x="0" y="0" width="300" height="66.67" fill="#ED2024" />

        {/* Middle Stripe: White */}
        <rect x="0" y="66.67" width="300" height="66.67" fill="#FFFFFF" />

        {/* Bottom Stripe: Green */}
        <rect x="0" y="133.34" width="300" height="66.67" fill="#009739" />

        {/* 21-Ray Golden Sun of Kurdistan in the Center */}
        <g id="kurdistan-sun" filter="url(#sunGlow)">
          {/* 21 Golden Sun Rays */}
          {rays}

          {/* Golden Sun Central Disc */}
          <circle cx="150" cy="100" r="28" fill="#FFD100" />
          <circle cx="150" cy="100" r="24" fill="#FFDE00" opacity="0.9" />
        </g>
      </svg>
    </div>
  );
};
