import React from 'react';
import {
  HelpCircle,
  PenTool,
  BookOpen,
  Code,
  Languages,
  Lightbulb,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { BrandLogo } from './BrandLogo.js';
import { ProBadge } from './ProBadge.js';

export const EmptyChatWelcome: React.FC = () => {
  const { t, sendMessage, user, setIsProModalOpen } = useApp();

  const promptCards = [
    {
      key: 'askAnything',
      icon: <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0" />,
      title: t.prompts.askAnything.title,
      desc: t.prompts.askAnything.desc,
      prompt: t.prompts.askAnything.prompt,
      gradient: 'from-indigo-500/10 hover:from-indigo-500/20 to-transparent',
      borderColor: 'border-indigo-500/20 hover:border-indigo-500/40',
    },
    {
      key: 'helpWrite',
      icon: <PenTool className="w-5 h-5 text-cyan-400 shrink-0" />,
      title: t.prompts.helpWrite.title,
      desc: t.prompts.helpWrite.desc,
      prompt: t.prompts.helpWrite.prompt,
      gradient: 'from-cyan-500/10 hover:from-cyan-500/20 to-transparent',
      borderColor: 'border-cyan-500/20 hover:border-cyan-500/40',
    },
    {
      key: 'explainSomething',
      icon: <BookOpen className="w-5 h-5 text-amber-400 shrink-0" />,
      title: t.prompts.explainSomething.title,
      desc: t.prompts.explainSomething.desc,
      prompt: t.prompts.explainSomething.prompt,
      gradient: 'from-amber-500/10 hover:from-amber-500/20 to-transparent',
      borderColor: 'border-amber-500/20 hover:border-amber-500/40',
    },
    {
      key: 'helpCode',
      icon: <Code className="w-5 h-5 text-emerald-400 shrink-0" />,
      title: t.prompts.helpCode.title,
      desc: t.prompts.helpCode.desc,
      prompt: t.prompts.helpCode.prompt,
      gradient: 'from-emerald-500/10 hover:from-emerald-500/20 to-transparent',
      borderColor: 'border-emerald-500/20 hover:border-emerald-500/40',
    },
    {
      key: 'translate',
      icon: <Languages className="w-5 h-5 text-purple-400 shrink-0" />,
      title: t.prompts.translate.title,
      desc: t.prompts.translate.desc,
      prompt: t.prompts.translate.prompt,
      gradient: 'from-purple-500/10 hover:from-purple-500/20 to-transparent',
      borderColor: 'border-purple-500/20 hover:border-purple-500/40',
    },
    {
      key: 'brainstorm',
      icon: <Lightbulb className="w-5 h-5 text-rose-400 shrink-0" />,
      title: t.prompts.brainstorm.title,
      desc: t.prompts.brainstorm.desc,
      prompt: t.prompts.brainstorm.prompt,
      gradient: 'from-rose-500/10 hover:from-rose-500/20 to-transparent',
      borderColor: 'border-rose-500/20 hover:border-rose-500/40',
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-14 flex flex-col items-center justify-center text-center animate-fadeIn">
      {/* Central Artisan Logo with ambient aura */}
      <div className="relative mb-6">
        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-cyan-500/20 to-amber-500/20 rounded-full blur-2xl opacity-75 animate-pulse" />
        <BrandLogo variant="app-icon" size={68} className="relative z-10" />
      </div>

      {/* Main Welcome Heading */}
      <div className="inline-flex items-center gap-2 mb-3">
        <h1
          className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white"
          style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          {t.welcomeTitle}
        </h1>
        {user?.plan === 'pro' && <ProBadge size="md" />}
      </div>

      {/* Subtitle */}
      <p className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed mb-8 sm:mb-10 font-normal">
        {t.welcomeSubtitle}
      </p>

      {/* Plan banner if Free */}
      {user?.plan === 'free' && (
        <div
          onClick={() => setIsProModalOpen(true)}
          className="cursor-pointer mb-8 inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 text-indigo-300 hover:border-indigo-400 transition-all hover:scale-[1.02]"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>You are on Craft AI Free (25 messages/day).</span>
          <span className="text-amber-400 font-bold underline flex items-center gap-0.5">
            Upgrade to Pro <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      )}

      {/* Grid of Interactive Prompt Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 w-full text-left">
        {promptCards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => sendMessage(card.prompt)}
            className={`group relative p-4 rounded-2xl border bg-slate-900/60 backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-950/20 active:translate-y-0 ${card.borderColor} ${card.gradient}`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <div className="p-2 rounded-xl bg-slate-850 border border-slate-800 group-hover:scale-105 transition-transform">
                {card.icon}
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-slate-200 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="font-semibold text-sm text-slate-100 group-hover:text-white mb-1 tracking-tight">
              {card.title}
            </h3>
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {card.desc}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
