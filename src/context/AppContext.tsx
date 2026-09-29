import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  User,
  Subscription,
  UsageRecord,
  Conversation,
  Message,
  Attachment,
  AppSettings,
  ModelInfo,
  ErrorType,
  LanguageCode,
  ThemeMode,
  Announcement,
} from '../types/index.js';
import { api } from '../services/api.js';
import { translations, TranslationDictionary } from '../i18n/translations.js';
import { updateFavicon } from '../components/brand/logos.js';

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'gemini-3.8-flash',
    name: 'Craft Flash 3.8',
    description: 'High-speed, intelligent responses for everyday tasks and writing.',
    badge: 'Free',
    isProOnly: false,
    speed: 'Ultra Fast',
    contextWindow: '1M tokens',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Craft Pro 3.1 Reasoning',
    description: 'Flagship deep reasoning, STEM, multi-step problem solving & architecture.',
    badge: 'Pro',
    isProOnly: true,
    speed: 'Pro Precision',
    contextWindow: '2M tokens',
  },
];

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  accentColor: 'indigo',
  chatStyle: 'bubble',
  chatWidth: 'comfortable',
  language: 'en',
  selectedLogo: 'logo-1',
  background: {
    imageUrl: '',
    blur: 4,
    opacity: 0.15,
    overlayColor: '#090d16',
    position: 'cover',
  },
  voice: {
    enabled: true,
    speechToTextEnabled: true,
    textToSpeechEnabled: true,
    voiceName: 'Kore',
    speechSpeed: 1.0,
    volume: 1.0,
    autoPlayResponses: false,
  },
};

interface SystemLimitedState {
  active: boolean;
  errorType?: ErrorType;
  errorMessage?: string;
  reason?: string;
  retryAfterSeconds?: number;
}

interface AppContextType {
  user: User | null;
  subscription: Subscription | null;
  usage: UsageRecord | null;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isGenerating: boolean;
  streamingContent: string;
  selectedModel: string;
  settings: AppSettings;
  t: TranslationDictionary;
  systemLimited: SystemLimitedState | null;

  // Announcements
  announcements: Announcement[];
  unreadAnnouncementsCount: number;
  refreshAnnouncements: () => Promise<void>;
  markAnnouncementAsRead: (id: string) => Promise<void>;

  // Modals
  isSettingsOpen: boolean;
  settingsTab: string;
  isProModalOpen: boolean;
  isVoiceModalOpen: boolean;
  isMobileSidebarOpen: boolean;
  deleteConfirm: {
    isOpen: boolean;
    type: 'conversation' | 'message';
    id: string;
    title?: string;
  };

  // Actions
  setSelectedModel: (model: string) => void;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  setIsSettingsOpen: (open: boolean) => void;
  setSettingsTab: (tab: string) => void;
  setIsProModalOpen: (open: boolean) => void;
  setIsVoiceModalOpen: (open: boolean) => void;
  setIsMobileSidebarOpen: (open: boolean) => void;
  setDeleteConfirm: React.Dispatch<
    React.SetStateAction<{
      isOpen: boolean;
      type: 'conversation' | 'message';
      id: string;
      title?: string;
    }>
  >;
  setSystemLimited: (state: SystemLimitedState | null) => void;

  sendMessage: (content: string, attachments?: Attachment[]) => Promise<void>;
  editUserMessage: (messageId: string, newContent: string) => Promise<void>;
  regenerateResponse: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  stopGeneration: () => void;

  selectConversation: (id: string) => Promise<void>;
  startNewChat: (initialModel?: string) => Promise<Conversation>;
  updateConversationTitle: (id: string, title: string) => Promise<void>;
  togglePinConversation: (id: string) => Promise<void>;
  toggleArchiveConversation: (id: string) => Promise<void>;
  confirmDeleteConversation: (id: string) => Promise<void>;
  executeDeleteConfirm: () => Promise<void>;

  switchAccount: (userId: string) => Promise<void>;
  upgradeToPro: (billingCycle?: 'monthly' | 'yearly') => Promise<void>;
  cancelSubscription: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<UsageRecord | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [systemLimited, setSystemLimited] = useState<SystemLimitedState | null>(null);

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const refreshAnnouncements = useCallback(async () => {
    try {
      const res = await api.getAnnouncements();
      setAnnouncements(res.announcements || []);
    } catch (e) {
      console.error('Failed to fetch announcements:', e);
    }
  }, []);

  const markAnnouncementAsRead = async (id: string) => {
    try {
      await api.markAnnouncementRead(id);
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
      );
    } catch (e) {
      console.error('Failed to mark announcement as read:', e);
    }
  };

  const unreadAnnouncementsCount = announcements.filter((a) => !a.isRead).length;

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('account');
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'conversation' | 'message';
    id: string;
    title?: string;
  }>({
    isOpen: false,
    type: 'conversation',
    id: '',
    title: '',
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Settings with LocalStorage persistence
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('craft_ai_settings');
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('craft_ai_settings', JSON.stringify(settings));
      localStorage.setItem('craft_ai_logo', settings.selectedLogo || 'logo-1');
    } catch (e) {
      // ignore
    }

    // Persist settings to backend user record
    api.saveSettings(settings);

    // Update dynamic browser tab favicon
    updateFavicon(settings.selectedLogo || 'logo-1');

    // Apply document styling, accent color & theme class
    const root = document.documentElement;
    root.setAttribute('data-accent', settings.accentColor || 'indigo');

    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (settings.theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }

    // Language Direction (RTL / LTR)
    const currentDict = translations[settings.language] || translations.en;
    root.setAttribute('dir', currentDict.direction);
    root.setAttribute('lang', settings.language);
  }, [settings]);

  const t = translations[settings.language] || translations.en;

  // Initial Load: User, Usage, and Conversations
  const refreshSession = useCallback(async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setSubscription(data.subscription);
      setUsage(data.usage);

      // Restore account-level persistent settings if saved on backend
      if (data.user.settings) {
        setSettings((prev) => ({ ...prev, ...data.user.settings }));
      }

      const convs = await api.getConversations();
      setConversations(convs);

      // Fetch active announcements
      await refreshAnnouncements();

      // Auto-select latest or create if empty
      if (convs.length > 0 && !activeConversation) {
        const latest = convs[0];
        setActiveConversation(latest);
        const fullConv = await api.getConversation(latest.id);
        setMessages(fullConv.messages);
        setSelectedModel(latest.model || 'gemini-3.8-flash');
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeConversation]);

  useEffect(() => {
    refreshSession();
  }, []);

  // Conversation Select
  const selectConversation = async (id: string) => {
    try {
      setIsLoading(true);
      setSystemLimited(null);
      const data = await api.getConversation(id);
      setActiveConversation(data.conversation);
      setMessages(data.messages);
      setSelectedModel(data.conversation.model || 'gemini-3.8-flash');
      setIsMobileSidebarOpen(false);
    } catch (error) {
      console.error('Failed to select conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start New Chat
  const startNewChat = async (initialModel?: string): Promise<Conversation> => {
    try {
      const modelToUse = initialModel || selectedModel || 'gemini-3.8-flash';
      const conv = await api.createConversation('New Conversation', modelToUse);
      setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
      setActiveConversation(conv);
      setMessages([]);
      setSelectedModel(modelToUse);
      setSystemLimited(null);
      setIsMobileSidebarOpen(false);
      return conv;
    } catch (error) {
      console.error('Failed to create new conversation:', error);
      throw error;
    }
  };

  // Update Title
  const updateConversationTitle = async (id: string, title: string) => {
    try {
      const updated = await api.updateConversation(id, { title });
      setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
      if (activeConversation?.id === id) {
        setActiveConversation(updated);
      }
    } catch (error) {
      console.error('Failed to update title:', error);
    }
  };

  // Toggle Pin
  const togglePinConversation = async (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    try {
      const updated = await api.updateConversation(id, { isPinned: !conv.isPinned });
      setConversations((prev) =>
        prev
          .map((c) => (c.id === id ? updated : c))
          .sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          })
      );
      if (activeConversation?.id === id) {
        setActiveConversation(updated);
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  // Toggle Archive
  const toggleArchiveConversation = async (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (!conv) return;
    try {
      const updated = await api.updateConversation(id, { isArchived: !conv.isArchived });
      setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)));
      if (activeConversation?.id === id) {
        setActiveConversation(updated);
      }
    } catch (error) {
      console.error('Failed to toggle archive:', error);
    }
  };

  // Delete Conversation
  const confirmDeleteConversation = async (id: string) => {
    const conv = conversations.find((c) => c.id === id);
    setDeleteConfirm({
      isOpen: true,
      type: 'conversation',
      id,
      title: conv?.title || 'this conversation',
    });
  };

  const executeDeleteConfirm = async () => {
    if (!deleteConfirm.isOpen || !deleteConfirm.id) return;
    try {
      if (deleteConfirm.type === 'conversation') {
        await api.deleteConversation(deleteConfirm.id);
        const remaining = conversations.filter((c) => c.id !== deleteConfirm.id);
        setConversations(remaining);
        if (activeConversation?.id === deleteConfirm.id) {
          if (remaining.length > 0) {
            await selectConversation(remaining[0].id);
          } else {
            await startNewChat();
          }
        }
      } else if (deleteConfirm.type === 'message') {
        await api.deleteMessage(deleteConfirm.id);
        setMessages((prev) => prev.filter((m) => m.id !== deleteConfirm.id));
      }
    } catch (error) {
      console.error('Delete execution error:', error);
    } finally {
      setDeleteConfirm({ isOpen: false, type: 'conversation', id: '', title: '' });
    }
  };

  // Stop Generation
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    if (streamingContent) {
      const tempId = `msg_stopped_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: tempId,
          conversationId: activeConversation?.id || '',
          role: 'assistant',
          content: streamingContent,
          model: selectedModel,
          status: 'complete',
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    setStreamingContent('');
  };

  // Send Message with SSE streaming
  const sendMessage = async (content: string, attachments: Attachment[] = []) => {
    if (isGenerating) return;
    if (!content.trim() && attachments.length === 0) return;

    let conv = activeConversation;
    if (!conv) {
      conv = await startNewChat();
    }

    // Clear previous system limited notice
    setSystemLimited(null);

    // Optimistically add user message to list
    const tempUserMsgId = `temp_u_${Date.now()}`;
    const userMsg: Message = {
      id: tempUserMsgId,
      conversationId: conv.id,
      role: 'user',
      content,
      attachments,
      status: 'complete',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);
    setStreamingContent('');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    api.streamChat({
      conversationId: conv.id,
      content,
      attachments,
      model: selectedModel,
      signal: controller.signal,
      onStart: (serverUserMsg) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempUserMsgId ? serverUserMsg : m))
        );
      },
      onChunk: (text) => {
        setStreamingContent((prev) => prev + text);
      },
      onDone: ({ message, usage: updatedUsage }) => {
        setIsGenerating(false);
        setStreamingContent('');
        abortControllerRef.current = null;
        setMessages((prev) => [...prev, message]);
        setUsage(updatedUsage);

        // Update conversation updated_at in list
        setConversations((prev) =>
          prev
            .map((c) =>
              c.id === conv!.id
                ? {
                    ...c,
                    updatedAt: new Date().toISOString(),
                    title: c.title === 'New Conversation' ? content.slice(0, 36) : c.title,
                  }
                : c
            )
            .sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            })
        );
      },
      onError: (err) => {
        setIsGenerating(false);
        setStreamingContent('');
        abortControllerRef.current = null;

        // Set System Limited state with complete context
        setSystemLimited({
          active: true,
          errorType: err.errorType || 'PROVIDER_ERROR',
          errorMessage: err.error,
          reason: err.reason,
          retryAfterSeconds: err.retryAfterSeconds,
        });

        if (err.failedMessage) {
          setMessages((prev) => [...prev, err.failedMessage!]);
        }
      },
    });
  };

  // Edit Message
  const editUserMessage = async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return;
    try {
      await api.editMessage(messageId, newContent);
      // Refresh conversation messages
      if (activeConversation) {
        const full = await api.getConversation(activeConversation.id);
        setMessages(full.messages);
        // Automatically trigger regeneration for the edited prompt
        await sendMessage(newContent);
      }
    } catch (e) {
      console.error('Failed to edit message:', e);
    }
  };

  // Regenerate Response
  const regenerateResponse = async (messageId: string) => {
    try {
      await api.regenerate(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      // Find the preceding user message to resend
      const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
      if (lastUserMsg && activeConversation) {
        const controller = new AbortController();
        abortControllerRef.current = controller;
        setIsGenerating(true);
        setStreamingContent('');

        api.streamChat({
          conversationId: activeConversation.id,
          content: lastUserMsg.content,
          attachments: lastUserMsg.attachments,
          model: selectedModel,
          regenerate: true,
          signal: controller.signal,
          onChunk: (text) => setStreamingContent((prev) => prev + text),
          onDone: ({ message, usage: updatedUsage }) => {
            setIsGenerating(false);
            setStreamingContent('');
            setMessages((prev) => [...prev, message]);
            setUsage(updatedUsage);
          },
          onError: (err) => {
            setIsGenerating(false);
            setStreamingContent('');
            setSystemLimited({
              active: true,
              errorType: err.errorType,
              errorMessage: err.error,
              reason: err.reason,
            });
          },
        });
      }
    } catch (e) {
      console.error('Failed to regenerate response:', e);
    }
  };

  // Delete Single Message
  const deleteMessage = async (messageId: string) => {
    setDeleteConfirm({
      isOpen: true,
      type: 'message',
      id: messageId,
      title: 'this message',
    });
  };

  // Switch Account
  const switchAccount = async (userId: string) => {
    try {
      setIsLoading(true);
      const data = await api.switchAccount(userId);
      setUser(data.user);
      setSubscription(data.subscription);
      setUsage(data.usage);
      const convs = await api.getConversations();
      setConversations(convs);
      if (convs.length > 0) {
        await selectConversation(convs[0].id);
      } else {
        await startNewChat();
      }
    } catch (e) {
      console.error('Failed to switch user:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Upgrade Plan
  const upgradeToPro = async (billingCycle: 'monthly' | 'yearly' = 'monthly') => {
    try {
      const data = await api.upgradeToPro(billingCycle);
      setUser(data.user);
      setSubscription(data.subscription);
      setSystemLimited(null);
      setIsProModalOpen(false);
      // Trigger confetti celebration
      try {
        const confettiModule = await import('canvas-confetti');
        const confetti = confettiModule.default || confettiModule;
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#06b6d4', '#f59e0b', '#ec4899'],
        });
      } catch (e) {
        // ignore
      }
    } catch (e) {
      console.error('Failed to upgrade to Pro:', e);
    }
  };

  // Cancel Subscription
  const cancelSubscription = async () => {
    try {
      const data = await api.cancelSubscription();
      setUser(data.user);
      setSubscription(data.subscription);
    } catch (e) {
      console.error('Failed to cancel subscription:', e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        subscription,
        usage,
        conversations,
        activeConversation,
        messages,
        isLoading,
        isGenerating,
        streamingContent,
        selectedModel,
        settings,
        t,
        systemLimited,

        isSettingsOpen,
        settingsTab,
        isProModalOpen,
        isVoiceModalOpen,
        isMobileSidebarOpen,
        deleteConfirm,

        setSelectedModel,
        setSettings,
        setIsSettingsOpen,
        setSettingsTab,
        setIsProModalOpen,
        setIsVoiceModalOpen,
        setIsMobileSidebarOpen,
        setDeleteConfirm,
        setSystemLimited,

        // Announcements
        announcements,
        unreadAnnouncementsCount,
        refreshAnnouncements,
        markAnnouncementAsRead,

        sendMessage,
        editUserMessage,
        regenerateResponse,
        deleteMessage,
        stopGeneration,

        selectConversation,
        startNewChat,
        updateConversationTitle,
        togglePinConversation,
        toggleArchiveConversation,
        confirmDeleteConversation,
        executeDeleteConfirm,

        switchAccount,
        upgradeToPro,
        cancelSubscription,
        refreshSession,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
