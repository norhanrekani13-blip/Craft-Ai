import React from 'react';
import { BrandLogo } from './BrandLogo.js';

export const ChatLoadingSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-6 space-y-6 animate-fadeIn select-none">
      {/* Turn 1: Assistant Greeting Skeleton */}
      <div className="flex items-start gap-3 sm:gap-4 p-4 rounded-2xl bg-slate-900/30 border border-slate-800/40 backdrop-blur-sm">
        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/60 p-1 flex items-center justify-center shrink-0">
          <BrandLogo variant="icon" size={18} animated />
        </div>
        <div className="flex-1 space-y-2.5 pt-1">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-20 bg-slate-800 rounded-md animate-pulse" />
            <div className="h-3 w-12 bg-slate-850 rounded-md animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-11/12 bg-slate-800/70 rounded-md animate-pulse" />
            <div className="h-3.5 w-4/5 bg-slate-800/70 rounded-md animate-pulse" />
            <div className="h-3.5 w-2/3 bg-slate-800/70 rounded-md animate-pulse" />
          </div>
        </div>
      </div>

      {/* Turn 2: User Prompt Skeleton */}
      <div className="flex items-start gap-3 sm:gap-4 p-4 rounded-2xl">
        <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 shrink-0 animate-pulse" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-16 bg-slate-800 rounded-md animate-pulse" />
            <div className="h-3 w-10 bg-slate-850 rounded-md animate-pulse" />
          </div>
          <div className="h-3.5 w-3/4 bg-slate-800/80 rounded-md animate-pulse" />
        </div>
      </div>

      {/* Turn 3: Assistant Complex Response Skeleton with Code Block */}
      <div className="flex items-start gap-3 sm:gap-4 p-4 rounded-2xl bg-slate-900/30 border border-slate-800/40 backdrop-blur-sm">
        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700/60 p-1 flex items-center justify-center shrink-0">
          <BrandLogo variant="icon" size={18} animated />
        </div>
        <div className="flex-1 space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-20 bg-slate-800 rounded-md animate-pulse" />
            <div className="h-3 w-14 bg-slate-850 rounded-md animate-pulse" />
          </div>
          <div className="space-y-2">
            <div className="h-3.5 w-full bg-slate-800/70 rounded-md animate-pulse" />
            <div className="h-3.5 w-5/6 bg-slate-800/70 rounded-md animate-pulse" />
          </div>
          {/* Mock Code Block Skeleton */}
          <div className="h-28 w-full rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 space-y-2 animate-pulse">
            <div className="h-3 w-28 bg-slate-800 rounded" />
            <div className="h-3 w-3/4 bg-slate-850 rounded" />
            <div className="h-3 w-1/2 bg-slate-850 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};
