import React, { useState } from 'react';
import {
  Megaphone,
  Bell,
  Info,
  Sparkles,
  AlertTriangle,
  Wrench,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { Announcement, AnnouncementType } from '../types/index.js';

export const ChatAnnouncements: React.FC = () => {
  const { announcements, markAnnouncementAsRead } = useApp();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  // Filter out locally dismissed announcements for the current chat session
  const visibleAnnouncements = announcements.filter((a) => !dismissedIds.includes(a.id));

  if (visibleAnnouncements.length === 0) return null;

  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedIds((prev) => [...prev, id]);
  };

  const handleToggleExpand = (id: string, isRead?: boolean) => {
    if (!isRead) {
      markAnnouncementAsRead(id);
    }
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const getTypeStyle = (type: AnnouncementType) => {
    switch (type) {
      case 'important':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />,
          badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          border: 'border-rose-500/30',
          accent: 'from-rose-500/10 via-rose-500/5 to-transparent',
          label: 'Important',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          border: 'border-amber-500/30',
          accent: 'from-amber-500/10 via-amber-500/5 to-transparent',
          label: 'Notice',
        };
      case 'maintenance':
        return {
          icon: <Wrench className="w-4 h-4 text-purple-400 shrink-0" />,
          badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          border: 'border-purple-500/30',
          accent: 'from-purple-500/10 via-purple-500/5 to-transparent',
          label: 'Maintenance',
        };
      case 'update':
        return {
          icon: <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />,
          badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
          border: 'border-cyan-500/30',
          accent: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
          label: 'Update',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-4 h-4 text-indigo-400 shrink-0" />,
          badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          border: 'border-indigo-500/30',
          accent: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
          label: 'Information',
        };
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pt-2 pb-1 space-y-2.5 z-20">
      {visibleAnnouncements.map((ann) => {
        const style = getTypeStyle(ann.type);
        const isExpanded = expandedIds.includes(ann.id);
        const formattedDate = new Date(ann.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return (
          <div
            key={ann.id}
            className={`group rounded-2xl bg-gradient-to-r ${style.accent} bg-slate-900/90 border ${style.border} p-3.5 sm:p-4 backdrop-blur-xl shadow-lg transition-all duration-200 hover:border-slate-600/80`}
          >
            {/* Header row */}
            <div
              className="flex items-start justify-between gap-3 cursor-pointer select-none"
              onClick={() => handleToggleExpand(ann.id, ann.isRead)}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 shrink-0 shadow-sm mt-0.5">
                  <Megaphone className="w-4 h-4 text-indigo-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      📢 Craft AI Announcement
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${style.badgeBg}`}
                    >
                      {style.label}
                    </span>

                    {!ann.isRead && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-indigo-500 text-white shadow-sm animate-pulse">
                        NEW
                      </span>
                    )}

                    {ann.target === 'user' && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        Direct to You
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-white tracking-tight leading-snug">
                    {ann.title}
                  </h4>
                </div>
              </div>

              {/* Actions right */}
              <div className="flex items-center gap-1 shrink-0 text-slate-400">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleExpand(ann.id, ann.isRead);
                  }}
                  className="p-1 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
                  title={isExpanded ? 'Collapse' : 'Expand'}
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDismiss(ann.id, e)}
                  className="p-1 rounded-lg hover:text-rose-400 hover:bg-slate-800/60 transition-colors"
                  title="Dismiss from chat view"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message Body (Always visible or expandable preview) */}
            <div className={`mt-2.5 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal ${!isExpanded ? 'line-clamp-2' : ''}`}>
              <p className="whitespace-pre-wrap">{ann.message}</p>
            </div>

            {/* Footer Metadata & Read button */}
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span>From Craft AI Admin</span>
                <span>•</span>
                <span>{formattedDate}</span>
              </div>

              <div className="flex items-center gap-2">
                {!ann.isRead ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      markAnnouncementAsRead(ann.id);
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    <span>Mark as Read</span>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Read</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
