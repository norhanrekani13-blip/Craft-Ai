import React, { useState, useEffect } from 'react';
import { RefreshCw, MessageSquare, Clock, Cpu, Sparkles, X } from 'lucide-react';
import { BrandLogo } from './BrandLogo.js';
import { ErrorType } from '../types/index.js';
import { api } from '../services/api.js';

interface SystemLimitedModalProps {
  isOpen: boolean;
  errorType?: ErrorType;
  errorMessage?: string;
  reason?: string;
  retryAfterSeconds?: number;
  onRetry: () => void;
  onBackToChat: () => void;
  onSwitchModel?: (model: string) => void;
  onUpgrade?: () => void;
}

export const SystemLimitedModal: React.FC<SystemLimitedModalProps> = ({
  isOpen,
  errorType = 'PROVIDER_ERROR',
  errorMessage,
  reason,
  retryAfterSeconds,
  onRetry,
  onBackToChat,
  onSwitchModel,
  onUpgrade,
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

  // When the countdown reaches zero: automatically remove the limited state if the backend confirms availability
  useEffect(() => {
    if (countdown === 0) {
      api.checkHealth()
        .then((res) => {
          if (res.available) {
            onRetry();
          }
        })
        .catch(() => {
          // If health check fails, user can still manually click Try Again
        });
    }
  }, [countdown, onRetry]);

  if (!isOpen) return null;

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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="system-limited-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-xl animate-fadeIn"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Responsive Card */}
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900/95 border border-slate-700/80 shadow-2xl shadow-indigo-950/50 p-6 sm:p-8 text-center flex flex-col items-center animate-scaleIn backdrop-blur-2xl">
        {/* Dismiss / Back to chat corner button */}
        <button
          type="button"
          onClick={onBackToChat}
          aria-label="Back to chat"
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Selected Craft AI Logo - Prominently Displayed */}
        <div className="relative mb-5">
          <div className="absolute -inset-3 bg-gradient-to-r from-indigo-500/20 via-cyan-500/20 to-amber-500/20 rounded-3xl blur-xl opacity-80 animate-pulse" />
          <BrandLogo variant="app-icon" size={80} animated className="relative z-10 shadow-2xl" />
        </div>

        {/* Title & Badge */}
        <div className="inline-flex items-center gap-2 mb-2">
          <h2
            id="system-limited-title"
            className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            System Limited
          </h2>
        </div>

        {/* Primary Status Explanation */}
        <p className="text-sm sm:text-base font-medium text-slate-200 mb-2">
          Craft AI is temporarily unavailable.
        </p>

        <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed mb-6 font-normal">
          {reason || errorMessage || 'Craft AI is temporarily limited. Please try again later.'}
        </p>

        {/* Real-time Countdown or Static Advice */}
        <div className="w-full max-w-xs mb-6">
          {isCountingDown && formattedCountdown ? (
            <div className="px-4 py-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-amber-200 flex items-center justify-center gap-2.5 shadow-inner">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
              <span className="text-sm font-semibold tracking-wide">
                Try again in {formattedCountdown}
              </span>
            </div>
          ) : (
            <div className="px-4 py-2.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-slate-300 text-xs font-medium">
              Please try again later.
            </div>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          {/* Try Again Button */}
          <button
            type="button"
            onClick={onRetry}
            disabled={isCountingDown}
            className={`w-full sm:w-auto min-w-[140px] px-5 py-3 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isCountingDown
                ? 'bg-slate-800/60 border border-slate-700/60 text-slate-400 cursor-not-allowed opacity-60'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${!isCountingDown ? 'animate-none' : ''}`} />
            Try Again
          </button>

          {/* Back to Chat Button (Preserves complete conversation) */}
          <button
            type="button"
            onClick={onBackToChat}
            className="w-full sm:w-auto min-w-[140px] px-5 py-3 rounded-xl font-semibold text-xs sm:text-sm bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 hover:text-white inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            Back to Chat
          </button>
        </div>

        {/* Alternative Action (Switch to Free Model or Upgrade if applicable) */}
        {onSwitchModel && errorType === 'MODEL_UNAVAILABLE' && (
          <button
            type="button"
            onClick={() => onSwitchModel('gemini-3.8-flash')}
            className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 underline font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            Switch to Craft Flash 3.8 and continue
          </button>
        )}

        {onUpgrade && (errorType === 'FREE_LIMIT_REACHED' || errorType === 'PRO_REQUIRED') && (
          <button
            type="button"
            onClick={onUpgrade}
            className="mt-4 text-xs text-amber-400 hover:text-amber-300 font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Upgrade to Craft AI Pro for higher capacity
          </button>
        )}

        {/* Safety Note: Conversation is preserved */}
        <p className="text-[11px] text-slate-400 mt-5">
          Your conversation, messages, and settings are safely preserved.
        </p>
      </div>
    </div>
  );
};
