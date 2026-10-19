import React from 'react';
import { KurdistanFlag } from './KurdistanFlag';

interface KurdishSoundwaveFlagProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isAnimated?: boolean;
}

export const KurdishSoundwaveFlag: React.FC<KurdishSoundwaveFlagProps> = ({
  size = 'md',
  className = '',
  isAnimated = true,
}) => {
  // Height and scale configurations
  const heightMap = {
    sm: { flag: 'sm' as const, barsH: 'h-10', barW: 'w-1' },
    md: { flag: 'md' as const, barsH: 'h-14', barW: 'w-1.5' },
    lg: { flag: 'lg' as const, barsH: 'h-20', barW: 'w-2' },
  };

  const current = heightMap[size];

  // Soundwave heights matching the screenshot pattern (peaks and valleys)
  const waveHeights = [25, 45, 75, 95, 60, 85, 100, 70, 50, 80, 40, 20];

  return (
    <div className={`relative inline-flex items-center gap-2 select-none dir-ltr ${className}`}>
      {/* Expanding Multi-Color Soundwave Bars */}
      <div className={`flex items-center gap-1 ${current.barsH}`}>
        {waveHeights.map((h, i) => {
          // Color progression: Indigo -> Sky -> Cyan -> Teal -> Emerald
          const colors = [
            'bg-indigo-400',
            'bg-blue-400',
            'bg-sky-400',
            'bg-cyan-400',
            'bg-teal-300',
            'bg-emerald-400',
            'bg-cyan-300',
            'bg-sky-400',
            'bg-blue-400',
            'bg-indigo-400',
            'bg-violet-400',
            'bg-purple-400',
          ];
          const color = colors[i % colors.length];
          const animationDelay = `${(i * 0.12).toFixed(2)}s`;

          return (
            <div
              key={i}
              className={`${current.barW} rounded-full ${color} shadow-[0_0_8px_currentColor] transition-all duration-300 ${
                isAnimated ? 'animate-pulse' : ''
              }`}
              style={{
                height: `${h}%`,
                animationDelay,
                animationDuration: '1.4s',
              }}
            />
          );
        })}
      </div>

      {/* 3D Glowing Kurdistan Flag Badge */}
      <div className="relative shrink-0 flex items-center justify-center filter drop-shadow-[0_0_18px_rgba(239,68,68,0.35)]">
        <KurdistanFlag size={current.flag} glow={true} rounded={true} bordered={true} />
        {/* Subtle circular pulse ring around the flag */}
        <div className="absolute inset-0 rounded-full border-2 border-amber-400/30 animate-ping pointer-events-none opacity-20" />
      </div>
    </div>
  );
};
