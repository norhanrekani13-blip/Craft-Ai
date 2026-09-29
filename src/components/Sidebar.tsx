import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Pin,
  Archive,
  Trash2,
  Settings,
  Sparkles,
  MessageSquare,
  X,
  ChevronDown,
  RotateCcw,
  Pencil,
  MoreVertical,
  Check,
  Loader2,
  SlidersHorizontal,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { BrandLogo } from './BrandLogo.js';
import { ProBadge } from './ProBadge.js';
import { Conversation } from '../types/index.js';
import { api } from '../services/api.js';

export const Sidebar: React.FC = () => {
  const {
    t,
    conversations,
    activeConversation,
    user,
    selectConversation,
    startNewChat,
    togglePinConversation,
    toggleArchiveConversation,
    confirmDeleteConversation,
    updateConversationTitle,
    switchAccount,
    setIsSettingsOpen,
    setSettingsTab,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Conversation[] | null>(null);
  const [searchFilter, setSearchFilter] = useState<'all' | 'title' | 'content'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd/Ctrl + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsMobileSidebarOpen(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsMobileSidebarOpen]);

  // Debounced search query to backend for full title & message content search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await api.getConversations(searchQuery.trim(), showArchived);
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [searchQuery, showArchived]);

  // Apply search filter (all, title, content)
  const displayConversations = useMemo(() => {
    const baseList = searchResults !== null ? searchResults : conversations;

    return baseList.filter((c) => {
      if (searchResults === null) {
        if (showArchived) {
          if (!c.isArchived) return false;
        } else {
          if (c.isArchived) return false;
        }
      }

      if (searchQuery.trim() && searchFilter !== 'all') {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesContent = Boolean(c.matchSnippet);

        if (searchFilter === 'title') return matchesTitle;
        if (searchFilter === 'content') return matchesContent;
      }

      return true;
    });
  }, [conversations, searchResults, searchQuery, searchFilter, showArchived]);

  // Separate pinned vs recent
  const pinnedList = useMemo(
    () => displayConversations.filter((c) => c.isPinned),
    [displayConversations]
  );
  const unpinnedList = useMemo(
    () => displayConversations.filter((c) => !c.isPinned),
    [displayConversations]
  );

  const startRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditTitle(conv.title);
    setActiveMenuId(null);
  };

  const saveRename = (convId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitle.trim()) {
      updateConversationTitle(convId, editTitle.trim());
    }
    setEditingConvId(null);
  };

  // Helper to highlight matching text in title & snippets
  const highlightMatch = (text: string, query: string) => {
    if (!query || !query.trim()) return text;
    try {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      const parts = text.split(regex);
      return (
        <>
          {parts.map((part, i) =>
            regex.test(part) ? (
              <mark
                key={i}
                className="bg-amber-400/30 text-amber-200 px-0.5 rounded font-semibold"
              >
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </>
      );
    } catch {
      return text;
    }
  };

  const renderConversationItem = (conv: Conversation) => {
    const isActive = activeConversation?.id === conv.id;
    const isEditing = editingConvId === conv.id;
    const isMatchInContent = Boolean(conv.matchSnippet && searchQuery.trim());

    return (
      <div
        key={conv.id}
        onClick={() => {
          if (!isEditing) selectConversation(conv.id);
        }}
        className={`group relative flex flex-col p-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
          isActive
            ? 'bg-slate-800/90 text-white font-medium shadow-sm border border-slate-700/60'
            : 'text-slate-300 hover:text-white hover:bg-slate-850/60 border border-transparent'
        }`}
      >
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <MessageSquare
              className={`w-4 h-4 shrink-0 ${
                isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-400'
              }`}
            />

            {isEditing ? (
              <form onSubmit={(e) => saveRename(conv.id, e)} className="flex items-center gap-1 flex-1">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-2 py-0.5 text-xs bg-slate-900 border border-indigo-500 rounded text-white focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  onClick={(e) => {
                    e.stopPropagation();
                    saveRename(conv.id);
                  }}
                  className="p-1 text-emerald-400 hover:bg-slate-800 rounded"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </form>
            ) : (
              <span className="truncate text-xs sm:text-sm font-medium">
                {searchQuery.trim() ? highlightMatch(conv.title, searchQuery) : conv.title}
              </span>
            )}
          </div>

          {/* Action icons on hover */}
          {!isEditing && (
            <div
              className={`flex items-center gap-1 shrink-0 ${
                isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              } transition-opacity`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Pin Toggle */}
              <button
                type="button"
                onClick={() => togglePinConversation(conv.id)}
                title={conv.isPinned ? t.unpin : t.pin}
                className={`p-1 rounded hover:bg-slate-700/80 ${
                  conv.isPinned ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>

              {/* Quick Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setActiveMenuId((prev) => (prev === conv.id ? null : conv.id))
                  }
                  className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700/80"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>

                {activeMenuId === conv.id && (
                  <div
                    className="absolute right-0 top-full mt-1 w-36 rounded-xl bg-slate-900 border border-slate-700 shadow-xl py-1 z-30 animate-scaleIn backdrop-blur-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => startRename(conv, e)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>{t.rename}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        toggleArchiveConversation(conv.id);
                        setActiveMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>{conv.isArchived ? t.restore : t.archive}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        confirmDeleteConversation(conv.id);
                        setActiveMenuId(null);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t.delete}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Content Match Snippet (shows when search matched inside a message) */}
        {isMatchInContent && conv.matchSnippet && (
          <div className="mt-1.5 flex items-start gap-1.5 text-[11px] text-slate-400 bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80">
            <FileText className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-relaxed italic text-slate-300">
              {highlightMatch(conv.matchSnippet, searchQuery)}
            </span>
          </div>
        )}
      </div>
    );
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-slate-925 select-none">
      {/* Top Header & Brand */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <BrandLogo variant="full" />
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          type="button"
          onClick={() => {
            setSearchQuery('');
            startNewChat();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white shadow-lg shadow-indigo-950/40 border border-indigo-400/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newChat}</span>
        </button>
      </div>

      {/* Search Input Box */}
      <div className="px-3 pb-2">
        <div className="relative">
          {isSearching ? (
            <Loader2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          )}

          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setSearchQuery('');
                searchInputRef.current?.blur();
              }
            }}
            placeholder={`${t.searchChats} (⌘K)`}
            className="w-full pl-9 pr-14 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 rounded text-slate-500 hover:text-slate-300"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <span className="hidden sm:inline-block text-[10px] font-semibold px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                ⌘K
              </span>
            )}
          </div>
        </div>

        {/* Search Scope Filters when query is active */}
        {searchQuery.trim() && (
          <div className="flex items-center gap-1 mt-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'title', label: 'Titles' },
              { id: 'content', label: 'Messages' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSearchFilter(f.id as any)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                  searchFilter === f.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="ml-auto text-[10px] text-slate-400 font-medium">
              {displayConversations.length} found
            </span>
          </div>
        )}
      </div>

      {/* Conversations Scroll Area */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 custom-scrollbar">
        {/* Pinned Section */}
        {pinnedList.length > 0 && !searchQuery.trim() && (
          <div>
            <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold text-amber-400/80 uppercase tracking-wider">
              <Pin className="w-3 h-3" />
              <span>{t.pinned}</span>
            </div>
            <div className="space-y-1">
              {pinnedList.map(renderConversationItem)}
            </div>
          </div>
        )}

        {/* Recent Conversations / Search Results */}
        <div>
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span>
              {searchQuery.trim()
                ? `Matches (${displayConversations.length})`
                : showArchived
                ? t.archived
                : t.recent}
            </span>
            {!searchQuery.trim() && (
              <button
                type="button"
                onClick={() => setShowArchived((prev) => !prev)}
                className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1"
              >
                <Archive className="w-3 h-3" />
                <span>{showArchived ? 'View Active' : 'View Archived'}</span>
              </button>
            )}
          </div>

          <div className="space-y-1">
            {displayConversations.length > 0 ? (
              displayConversations.map(renderConversationItem)
            ) : (
              <div className="px-3 py-8 text-center text-xs text-slate-500">
                {searchQuery.trim() ? (
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-400">No results found</p>
                    <p className="text-[11px] text-slate-500">
                      No conversations found matching "{searchQuery}"
                    </p>
                  </div>
                ) : (
                  'No conversations yet'
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User & Settings Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 relative">
        {/* Account Switcher Dropdown */}
        {showAccountDropdown && (
          <div className="absolute bottom-full left-3 right-3 mb-2 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-30 animate-scaleIn backdrop-blur-xl">
            <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Switch Test Account
            </div>
            <div className="space-y-1">
              {[
                {
                  id: 'user_norhan',
                  name: 'Norhan Rekani',
                  plan: 'pro',
                  desc: 'Root Admin Role • Pro Plan',
                },
                {
                  id: 'user_operator',
                  name: 'Ops Coordinator',
                  plan: 'pro',
                  desc: 'Operator Role • Pro Plan',
                },
                {
                  id: 'user_alex',
                  name: 'Alex Rivera',
                  plan: 'free',
                  desc: 'User Role • Free Plan',
                },
              ].map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    switchAccount(acc.id);
                    setShowAccountDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                    user?.id === acc.id
                      ? 'bg-indigo-600/20 text-white'
                      : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs text-white">{acc.name}</div>
                    <div className="text-[10px] text-slate-400">{acc.desc}</div>
                  </div>
                  {acc.plan === 'pro' && <ProBadge size="sm" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* User Card */}
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div
            onClick={() => setShowAccountDropdown((prev) => !prev)}
            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer hover:opacity-90"
            title="Click to switch account"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center text-xs font-bold text-slate-200">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name?.[0] || 'U'}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-xs text-slate-200 truncate">
                  {user?.name || 'Guest'}
                </span>
                {user?.plan === 'pro' && <ProBadge size="sm" />}
              </div>
              <span className="text-[10px] text-slate-400 block truncate">
                {user?.email || 'user@craft.ai'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>

          <button
            type="button"
            onClick={() => {
              setSettingsTab('account');
              setIsSettingsOpen(true);
            }}
            title={t.settings}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 h-full border-r border-slate-800/80 shrink-0 z-10">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-80 max-w-[85%] h-full bg-slate-950 shadow-2xl z-10 animate-slideRight">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
