import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  Zap,
  Cpu,
  UploadCloud,
  Volume2,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { BrandLogo } from './BrandLogo.js';
import { ProBadge } from './ProBadge.js';

export const ProUpgradeModal: React.FC = () => {
  const { isProModalOpen, setIsProModalOpen, upgradeToPro, user } = useApp();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);

  if (!isProModalOpen) return null;

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      await upgradeToPro(billingCycle);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpgrading(false);
    }
  };

  const features = [
    {
      icon: <Cpu className="w-4 h-4 text-indigo-400" />,
      title: 'Advanced Reasoning Models',
      desc: 'Exclusive access to gemini-3.1-pro-preview for deep architectural code and complex STEM reasoning.',
    },
    {
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      title: '500 Messages Per Day',
      desc: '20x quota increase over Free (up from 25 messages/day) with priority queue processing.',
    },
    {
      icon: <UploadCloud className="w-4 h-4 text-cyan-400" />,
      title: '25MB High-Capacity Uploads',
      desc: 'Attach full PDFs, large datasets, high-res diagrams, and source repos.',
    },
    {
      icon: <Volume2 className="w-4 h-4 text-purple-400" />,
      title: 'Neural Speech Synthesis',
      desc: 'Studio-grade natural voices powered by Gemini TTS with pitch and speed control.',
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      title: 'Extended Context & History',
      desc: 'Preserve long conversation histories with zero memory degradation.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl animate-fadeIn"
        onClick={() => setIsProModalOpen(false)}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-5 sm:p-8 flex flex-col z-10 animate-scaleIn max-h-[92vh] overflow-y-auto custom-scrollbar">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsProModalOpen(false)}
          className="absolute right-4 top-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <BrandLogo variant="small" />
            <ProBadge size="md" />
          </div>
          <h2
            className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
          >
            Upgrade to Craft AI Pro
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Supercharge your workflow with flagship reasoning, expanded quotas, and neural speech.
          </p>
        </div>

        {/* Billing Cycle Selector */}
        <div className="flex items-center justify-center p-1 rounded-2xl bg-slate-950 border border-slate-800 w-fit mx-auto mb-6">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              billingCycle === 'monthly'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Monthly ($19/mo)
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              billingCycle === 'yearly'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Yearly ($190/yr)</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-amber-400 text-slate-950 rounded-full font-extrabold">
              Save 16%
            </span>
          </button>
        </div>

        {/* Feature List */}
        <div className="space-y-3 mb-6">
          {features.map((feat, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80"
            >
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                {feat.icon}
              </div>
              <div>
                <h4 className="font-semibold text-xs sm:text-sm text-slate-100">{feat.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Upgrade Action Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-sm font-semibold text-white">
              {billingCycle === 'yearly' ? '$190 billed annually' : '$19 billed monthly'}
            </div>
            <div className="text-[11px] text-slate-400">
              Immediate access • Cancel or modify anytime
            </div>
          </div>

          <button
            type="button"
            onClick={handleUpgrade}
            disabled={isUpgrading || user?.plan === 'pro'}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-xl shadow-indigo-950/50 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isUpgrading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : user?.plan === 'pro' ? (
              <span>Already Pro</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Confirm & Upgrade Now</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
