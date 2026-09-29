import React from 'react';

interface ProBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  showGlow?: boolean;
}

export const ProBadge: React.FC<ProBadgeProps> = ({
  size = 'sm',
  className = '',
  onClick,
  showGlow = true,
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-1.5 py-0.5 tracking-wider font-extrabold',
    md: 'text-xs px-2.5 py-1 tracking-wider font-extrabold',
    lg: 'text-sm px-3.5 py-1.5 tracking-wide font-black',
  };

  return (
    <span
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`inline-flex items-center gap-1 select-none uppercase rounded-full transition-all duration-200 border ${
        sizeStyles[size]
      } ${
        showGlow
          ? 'bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-indigo-500/15 border-amber-500/30 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:border-amber-400'
          : 'bg-amber-500/20 border-amber-500/30 text-amber-300'
      } ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''} ${className}`}
    >
      <span className="text-[10px] leading-none animate-pulse">✨</span>
      <span>PRO</span>
    </span>
  );
};
