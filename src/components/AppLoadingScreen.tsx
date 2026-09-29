import React from 'react';
import { BrandLogo } from './BrandLogo.js';

export const AppLoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-slate-100 select-none animate-fadeIn">
      {/* Background radial gradients */}
      <div className="absolute top-1/3 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/3 w-80 h-80 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Center Logo with glowing squircle */}
      <div className="relative mb-6">
        <div className="absolute -inset-3 bg-gradient-to-r from-indigo-500/30 via-cyan-400/30 to-amber-400/30 rounded-3xl blur-xl opacity-80 animate-pulse" />
        <BrandLogo variant="app-icon" size={72} animated className="relative z-10" />
      </div>

      <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white mb-2">
        Craft AI
      </h1>
      <p className="text-xs sm:text-sm text-slate-400 font-medium mb-6">
        Initializing workspace & neural modules...
      </p>

      {/* Progress Shimmer Bar */}
      <div className="w-52 h-1.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-cyan-400 to-amber-400 w-1/2 rounded-full animate-[shimmer_1.4s_infinite]" />
      </div>
    </div>
  );
};
