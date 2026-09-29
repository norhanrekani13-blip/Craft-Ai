import React, { useId } from 'react';
import { CraftLogoId } from '../types/index.js';
import { useApp } from '../context/AppContext.js';
import { renderLogoContent } from './brand/logos.js';

export type BrandLogoVariant =
  | 'full'
  | 'icon'
  | 'small'
  | 'monochrome'
  | 'light'
  | 'dark'
  | 'app-icon'
  | 'favicon';

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  size?: number | string;
  animated?: boolean;
  logoId?: CraftLogoId; // If omitted, automatically uses the selected logo from settings/context!
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'full',
  className = '',
  size,
  animated = false,
  logoId,
}) => {
  const reactId = useId().replace(/:/g, '_');
  
  // Safely attempt to read selected logo from AppContext
  let activeLogoId: CraftLogoId = logoId || 'logo-1';
  try {
    const app = useApp();
    if (!logoId && app?.settings?.selectedLogo) {
      activeLogoId = app.settings.selectedLogo;
    }
  } catch (e) {
    // If rendered outside AppProvider (e.g., top-level boundary), fall back to localStorage
    if (!logoId && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('craft_ai_logo') as CraftLogoId;
        if (saved) activeLogoId = saved;
      } catch (err) {
        // ignore
      }
    }
  }

  // Dimension calculations
  const getIconSize = () => {
    if (size) return typeof size === 'number' ? `${size}px` : size;
    switch (variant) {
      case 'small':
        return '24px';
      case 'icon':
        return '32px';
      case 'app-icon':
        return '48px';
      case 'favicon':
        return '20px';
      case 'full':
      default:
        return '32px';
    }
  };

  const iconDim = getIconSize();
  const isMonochrome = variant === 'monochrome';
  const isDarkTone = variant === 'dark';

  const markSvg = (
    <div
      style={{ width: iconDim, height: iconDim }}
      className={`relative shrink-0 flex items-center justify-center select-none aspect-square ${
        variant === 'app-icon'
          ? 'rounded-2xl shadow-xl shadow-indigo-950/40 p-1.5 bg-slate-900 border border-slate-800'
          : ''
      } ${animated ? 'animate-pulse' : ''}`}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain"
        preserveAspectRatio="xMidYMid meet"
      >
        {renderLogoContent({
          logoId: activeLogoId,
          isMonochrome,
          isDarkTone,
          idSuffix: `${variant}_${reactId}`,
          variant,
        })}
      </svg>
    </div>
  );

  if (
    variant === 'icon' ||
    variant === 'small' ||
    variant === 'app-icon' ||
    variant === 'favicon'
  ) {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {markSvg}
      </div>
    );
  }

  // Full variant: Mark + Typography
  return (
    <div className={`inline-flex items-center gap-2.5 font-bold tracking-tight select-none ${className}`}>
      {markSvg}
      <div className="flex items-baseline gap-1.5">
        <span
          className={`font-extrabold text-lg sm:text-xl tracking-tight ${
            isDarkTone ? 'text-slate-900' : 'text-white'
          }`}
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          Craft
        </span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-amber-300 font-black text-sm tracking-wider uppercase px-1 py-0.5 rounded bg-indigo-950/40 border border-indigo-500/20">
          AI
        </span>
      </div>
    </div>
  );
};
