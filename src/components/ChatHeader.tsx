import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Plus,
  Mic,
  Settings,
  Sparkles,
  Share2,
  Trash2,
  Pencil,
  Check,
  X,
  Cpu,
  Download,
  FileText,
  FileCode,
  Bell,
  Megaphone,
} from 'lucide-react';
import { useApp, AVAILABLE_MODELS } from '../context/AppContext.js';
import { BrandLogo } from './BrandLogo.js';
import { ProBadge } from './ProBadge.js';
import {
  exportConversationToMarkdown,
  exportConversationToJson,
} from '../utils/exportConversation.js';

export const ChatHeader: React.FC = () => {
  const {
    t,
    activeConversation,
    messages,
    user,
    selectedModel,
    setSelectedModel,
    startNewChat,
    setIsSettingsOpen,
    setIsProModalOpen,
    setIsVoiceModalOpen,
    setIsMobileSidebarOpen,
    updateConversationTitle,
    confirmDeleteConversation,
    announcements,
    unreadAnnouncementsCount,
    markAnnouncementAsRead,
  } = useApp();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [copiedShare, setCopiedShare] = useState(false);

  // Announcements menu state
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
  const announcementsMenuRef = useRef<HTMLDivElement>(null);

  // Export menu state
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
      if (announcementsMenuRef.current && !announcementsMenuRef.current.contains(event.target as Node)) {
        setIsAnnouncementsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExportMenuOpen(false);
        setIsAnnouncementsOpen(false);
      }
    };
    if (isExportMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isExportMenuOpen]);

  const handleExportMarkdown = () => {
    setIsExportMenuOpen(false);
    const result = exportConversationToMarkdown(activeConversation, messages);
    setExportFeedback(`Exported as Markdown (${result.filename})`);
    setTimeout(() => setExportFeedback(null), 3000);
  };

  const handleExportJson = () => {
    setIsExportMenuOpen(false);
    const result = exportConversationToJson(activeConversation, messages);
    setExportFeedback(`Exported as JSON (${result.filename})`);
    setTimeout(() => setExportFeedback(null), 3000);
  };

  const startRename = () => {
    setTitleInput(activeConversation?.title || '');
    setIsEditingTitle(true);
  };

  const saveRename = () => {
    if (activeConversation && titleInput.trim()) {
      updateConversationTitle(activeConversation.id, titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const currentModel = AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  return (
    <header className="h-14 sm:h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl px-3 sm:px-6 flex items-center justify-between z-20 shrink-0 select-none relative">
      {/* Left: Mobile Drawer Trigger + Conversation Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Small Logo on mobile */}
        <div className="lg:hidden flex items-center">
          <BrandLogo variant="small" />
        </div>

        {/* Conversation Title & Rename */}
        {isEditingTitle ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveRename()}
              className="px-2.5 py-1 text-xs sm:text-sm rounded-lg bg-slate-900 border border-indigo-500 text-white focus:outline-none w-44 sm:w-64"
              autoFocus
            />
            <button
              type="button"
              onClick={saveRename}
              className="p-1 rounded text-emerald-400 hover:bg-slate-800"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsEditingTitle(false)}
              className="p-1 rounded text-slate-400 hover:bg-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 group min-w-0">
            <h2
              onClick={startRename}
              className="font-semibold text-xs sm:text-sm text-slate-200 hover:text-white truncate max-w-[130px] sm:max-w-[260px] md:max-w-md cursor-pointer tracking-tight"
              title="Click to rename"
            >
              {activeConversation?.title || t.newChat}
            </h2>
            <button
              type="button"
              onClick={startRename}
              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-200 transition-opacity"
              title="Rename conversation"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Model Indicator & Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-slate-200">{currentModel.name}</span>
          {user?.plan === 'pro' ? (
            <ProBadge size="sm" />
          ) : (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
              FREE
            </span>
          )}
        </div>

        {/* Upgrade button for Free users */}
        {user?.plan === 'free' && (
          <button
            type="button"
            onClick={() => setIsProModalOpen(true)}
            className="hidden md:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500/20 to-indigo-500/20 hover:from-amber-500/30 hover:to-indigo-500/30 border border-amber-500/40 text-amber-300 transition-all hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Upgrade</span>
          </button>
        )}

        {/* Interactive Voice Mode Trigger */}
        <button
          type="button"
          onClick={() => setIsVoiceModalOpen(true)}
          title={t.voiceChat}
          className="p-2 rounded-xl text-slate-300 hover:text-indigo-300 hover:bg-slate-800/80 transition-all border border-transparent hover:border-slate-700"
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Share Link */}
        <button
          type="button"
          onClick={handleShare}
          title="Share link"
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all"
        >
          {copiedShare ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <Share2 className="w-4 h-4" />
          )}
        </button>

        {/* Export Conversation Dropdown */}
        <div className="relative" ref={exportMenuRef}>
          <button
            type="button"
            onClick={() => setIsExportMenuOpen((prev) => !prev)}
            title="Export conversation to Markdown or JSON"
            aria-label="Export conversation"
            aria-expanded={isExportMenuOpen}
            className={`p-2 rounded-xl transition-all border ${
              isExportMenuOpen
                ? 'bg-slate-800 text-white border-slate-700 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border-transparent'
            }`}
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Export Dropdown Menu */}
          {isExportMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2 z-50 animate-scaleIn backdrop-blur-xl">
              <div className="px-3 py-2 border-b border-slate-800/80 mb-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Export Conversation
                </p>
                <p className="text-xs text-slate-200 font-medium truncate mt-0.5">
                  {activeConversation?.title || 'Current Chat'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {messages.length} {messages.length === 1 ? 'message' : 'messages'}
                </p>
              </div>

              <div className="space-y-1">
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-800/90 text-left transition-colors group cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors shrink-0 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                        Markdown (.md)
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-indigo-300 font-mono">
                        .md
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      Formatted document with code blocks & headers
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleExportJson}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-slate-800/90 text-left transition-colors group cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors shrink-0 mt-0.5">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-white">
                        JSON (.json)
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-mono">
                        .json
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                      Structured data with timestamps & metadata
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Announcements Notification Bell */}
        <div className="relative" ref={announcementsMenuRef}>
          <button
            type="button"
            onClick={() => setIsAnnouncementsOpen((prev) => !prev)}
            title="Craft AI Announcements"
            aria-label="Announcements"
            aria-expanded={isAnnouncementsOpen}
            className={`relative p-2 rounded-xl transition-all border ${
              isAnnouncementsOpen
                ? 'bg-slate-800 text-white border-slate-700 shadow-inner'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border-transparent'
            }`}
          >
            <Bell className="w-4 h-4" />
            {unreadAnnouncementsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500" />
              </span>
            )}
          </button>

          {/* Announcements Popover Menu */}
          {isAnnouncementsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-3 z-50 animate-scaleIn backdrop-blur-xl max-h-[460px] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Announcements
                  </span>
                </div>
                {unreadAnnouncementsCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {unreadAnnouncementsCount} unread
                  </span>
                )}
              </div>

              {announcements.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  No announcements at this time.
                </div>
              ) : (
                <div className="space-y-2">
                  {announcements.map((ann) => {
                    const formattedDate = new Date(ann.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                    return (
                      <div
                        key={ann.id}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          !ann.isRead
                            ? 'bg-indigo-950/30 border-indigo-500/40 text-slate-100'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs font-bold text-white line-clamp-1">
                            {ann.title}
                          </span>
                          {!ann.isRead && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500 text-white shrink-0">
                              NEW
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-300 leading-relaxed mb-2 whitespace-pre-wrap">
                          {ann.message}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-800/80">
                          <span>{formattedDate}</span>
                          {!ann.isRead ? (
                            <button
                              type="button"
                              onClick={() => markAnnouncementAsRead(ann.id)}
                              className="text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Mark read</span>
                            </button>
                          ) : (
                            <span className="text-emerald-400 inline-flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              <span>Read</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* New Chat Button */}
        <button
          type="button"
          onClick={() => startNewChat()}
          title={t.newChat}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/40 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.newChat}</span>
        </button>

        {/* Settings Button */}
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          title={t.settings}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition-all"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Export Confirmation Toast */}
      {exportFeedback && (
        <div className="absolute top-full mt-2 right-4 sm:right-6 px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs shadow-xl backdrop-blur-md flex items-center gap-2 animate-fadeIn z-50 pointer-events-none">
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="font-medium truncate max-w-xs">{exportFeedback}</span>
        </div>
      )}
    </header>
  );
};
