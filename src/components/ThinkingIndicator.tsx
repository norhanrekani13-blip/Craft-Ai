import React from 'react';
import { Square, Sparkles } from 'lucide-react';
import { BrandLogo } from './BrandLogo.js';

interface ThinkingIndicatorProps {
  modelName?: string;
  onStop?: () => void;
}

export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({
  modelName = 'Craft Flash 3.8',
  onStop,
}) => {
  return (
    <div className="py-4 px-3 sm:px-6 bg-slate-900/40 border-y border-slate-800/40 backdrop-blur-sm animate-fadeIn select-none">
      <div className="max-w-4xl mx-auto flex items-start gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1 shadow-md shadow-indigo-950/40">
            <BrandLogo variant="icon" size={20} />
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-xs sm:text-sm text-slate-200 tracking-tight">
              Craft AI
            </span>
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-950/70 border border-indigo-500/40 text-indigo-300">
              {modelName}
            </span>
          </div>

          {/* Instant Active Stream Status */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/70 border border-slate-800/90 text-xs text-slate-300 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="font-medium text-slate-200">Connecting to stream</span>

            {/* Hardware-accelerated pulse wave */}
            <div className="flex items-center gap-1 ml-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse [animation-delay:300ms]" />
            </div>
          </div>

          {/* Stop Button */}
          {onStop && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={onStop}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all hover:scale-105 active:scale-95"
              >
                <Square className="w-3 h-3 text-rose-400" />
                <span>Stop Generating</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
