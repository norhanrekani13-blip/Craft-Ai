import React, { useState, useEffect } from 'react';
import { Clock, Sparkles, RefreshCw, Cpu, Maximize2 } from 'lucide-react';
import { ErrorType } from '../types/index.js';
import { BrandLogo } from './BrandLogo.js';

interface SystemLimitedBannerProps {
  errorType?: ErrorType;
  errorMessage?: string;
  reason?: string;
  retryAfterSeconds?: number;
  onRetry?: () => void;
  onUpgrade?: () => void;
  onNewChat?: () => void;
  onSwitchModel?: (model: string) => void;
  onOpenModal?: () => void;
  className?: string;
}

export const SystemLimitedBanner: React.FC<SystemLimitedBannerProps> = ({
  errorType = 'PROVIDER_ERROR',
  errorMessage,
  reason,
  retryAfterSeconds,
  onRetry,
  onUpgrade,
  onNewChat,
  onSwitchModel,
  onOpenModal,
  className = '',
}) => {
  const [countdown, setCountdown] = useState<number | null>(
    retryAfterSeconds && retryAfterSeconds > 0 ? retryAfterSeconds : null
  );

  useEffect(() => {
    if (retryAfterSeconds && retryAfterSeconds > 0) {
      setCountdown(retryAfterSeconds);
    } else {
      setCountdown(null);
    }
  }, [retryAfterSeconds]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  // Format real-time countdown as H:MM:SS or MM:SS
  const formatCountdown = (secs: number | null): string | null => {
    if (secs === null || secs <= 0) return null;
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const seconds = secs % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formattedCountdown = formatCountdown(countdown);
  const isCountingDown = countdown !== null && countdown > 0;

  // Determine badge and color theme based on errorType
  const getBannerDetails = () => {
    switch (errorType) {
      case 'FREE_LIMIT_REACHED':
        return {
          title: 'System Limited: Free Daily Allocation Reached',
          badge: 'Daily Limit',
          accentBg: 'bg-amber-950/40 border-amber-500/40 text-amber-200',
          desc:
            reason ||
            'Craft AI is temporarily limited. You have reached your daily allocation. Upgrade to Craft AI Pro for higher capacity.',
          showUpgrade: true,
          canRetry: false,
        };
      case 'PRO_LIMIT_REACHED':
        return {
          title: 'System Limited: Pro Daily Quota Reached',
          badge: 'Pro Limit',
          accentBg: 'bg-rose-950/40 border-rose-500/40 text-rose-200',
          desc:
            reason ||
            'Craft AI is temporarily limited. Your daily allocation will refresh at 00:00 UTC.',
          showUpgrade: false,
          canRetry: false,
        };
      case 'PRO_REQUIRED':
        return {
          title: 'System Limited: Model Access Limited',
          badge: 'Pro Required',
          accentBg: 'bg-indigo-950/40 border-indigo-500/40 text-indigo-200',
          desc:
            reason ||
            'The selected advanced reasoning model is limited. Switch to Craft Flash 3.8 or upgrade to Pro to proceed.',
          showUpgrade: true,
          canSwitchToFree: true,
        };
      case 'RATE_LIMIT_EXCEEDED':
        return {
          title: 'System Limited: High Traffic / Rate Limit',
          badge: 'System Limited',
          accentBg: 'bg-amber-950/40 border-amber-500/40 text-amber-200',
          desc:
            reason ||
            'Craft AI is temporarily limited. The AI processing cluster is experiencing high request volume. Your conversation is safely preserved.',
          canRetry: true,
          canSwitchToFree: true,
        };
      case 'MODEL_UNAVAILABLE':
        return {
          title: 'System Limited: Model Unavailable',
          badge: 'Model Limited',
          accentBg: 'bg-sky-950/40 border-sky-500/40 text-sky-200',
          desc:
            reason ||
            'Craft AI is temporarily limited. The requested AI model is currently at maximum capacity.',
          canRetry: true,
          canSwitchToFree: true,
        };
      case 'TIMEOUT':
        return {
          title: 'System Limited: Request Timed Out',
          badge: 'Timeout',
          accentBg: 'bg-orange-950/40 border-orange-500/40 text-orange-200',
          desc:
            reason ||
            'Craft AI is temporarily limited. Upstream generation timed out. Please try again.',
          canRetry: true,
        };
      case 'PROVIDER_ERROR':
      default:
        return {
          title: 'System Limited',
          badge: 'Limited',
          accentBg: 'bg-rose-950/40 border-rose-500/40 text-rose-200',
          desc:
            reason ||
            errorMessage ||
            'Craft AI is temporarily limited. Please try again later. Your messages and conversation are preserved.',
          canRetry: true,
        };
    }
  };

  const details = getBannerDetails();

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 backdrop-blur-xl shadow-xl transition-all duration-200 ${details.accentBg} ${className}`}
    >
      <div className="flex items-start gap-3.5">
        {/* Prominent Selected Craft AI Logo */}
        <div className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-800 shrink-0 shadow-md">
          <BrandLogo variant="app-icon" size={32} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm sm:text-base text-slate-100 tracking-tight">
                {details.title}
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-900/80 border border-slate-700/60 text-slate-300">
                {details.badge}
              </span>
            </div>

            {onOpenModal && (
              <button
                type="button"
                onClick={onOpenModal}
                className="text-xs text-slate-300 hover:text-white inline-flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity"
                title="View full System Limited screen"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open Details</span>
              </button>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
            {details.desc}
          </p>

          {/* Real-time Countdown or Static Advice */}
          <div className="mb-3">
            {isCountingDown && formattedCountdown ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/80 border border-amber-500/30 text-xs text-amber-300 font-semibold shadow-inner">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                <span>Try again in {formattedCountdown}</span>
              </div>
            ) : (
              <div className="text-xs text-slate-400 font-medium">
                Please try again later.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {details.showUpgrade && onUpgrade && (
              <button
                type="button"
                onClick={onUpgrade}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-900/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Upgrade to Craft AI Pro
              </button>
            )}

            {(details.canRetry || countdown === 0) && onRetry && (
              <button
                type="button"
                onClick={onRetry}
                disabled={isCountingDown}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold text-xs border transition-all cursor-pointer ${
                  isCountingDown
                    ? 'opacity-50 cursor-not-allowed bg-slate-900/50 border-slate-800 text-slate-400'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200 hover:text-white shadow-md'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try Again
              </button>
            )}

            {details.canSwitchToFree && onSwitchModel && (
              <button
                type="button"
                onClick={() => onSwitchModel('gemini-3.8-flash')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-medium text-xs bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-indigo-300 hover:text-indigo-200 transition-all cursor-pointer"
              >
                <Cpu className="w-3.5 h-3.5" />
                Continue with Flash 3.8
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
