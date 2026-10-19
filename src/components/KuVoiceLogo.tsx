import React from 'react';
import { KurdistanFlag } from './KurdistanFlag';
import { KdVoiceOfficialLogo } from './KdVoiceOfficialLogo';

export interface KuVoiceLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showText?: boolean;
  className?: string;
  glow?: boolean;
  showFlag?: boolean;
}

export const KuVoiceLogo: React.FC<KuVoiceLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
  glow = true,
  showFlag = true,
}) => {
  const flagSizeMap = {
    xs: 'xs' as const,
    sm: 'xs' as const,
    md: 'sm' as const,
    lg: 'md' as const,
    xl: 'lg' as const,
    hero: 'hero' as const,
  };

  return (
    <div className={`inline-flex items-center gap-1.5 sm:gap-2 select-none shrink-0 ${className}`} style={{ direction: 'ltr' }}>
      {showFlag && (
        <KurdistanFlag size={flagSizeMap[size] || 'sm'} glow={glow} rounded={true} />
      )}
      <KdVoiceOfficialLogo
        size={size}
        showText={showText}
        glow={glow}
        theme="dark"
      />
    </div>
  );
};

