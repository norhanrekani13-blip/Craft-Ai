import React, { useRef, useEffect, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext.js';
import { Sidebar } from './components/Sidebar.js';
import { ChatHeader } from './components/ChatHeader.js';
import { ChatMessage } from './components/ChatMessage.js';
import { ChatInput } from './components/ChatInput.js';
import { EmptyChatWelcome } from './components/EmptyChatWelcome.js';
import { SettingsModal } from './components/SettingsModal.js';
import { ProUpgradeModal } from './components/ProUpgradeModal.js';
import { VoiceModal } from './components/VoiceModal.js';
import { DeleteConfirmModal } from './components/DeleteConfirmModal.js';
import { SystemLimitedBanner } from './components/SystemLimitedBanner.js';
import { SystemLimitedModal } from './components/SystemLimitedModal.js';
import { ChatAnnouncements } from './components/ChatAnnouncements.js';
import { ChatLoadingSkeleton } from './components/ChatLoadingSkeleton.js';
import { ThinkingIndicator } from './components/ThinkingIndicator.js';
import { AppLoadingScreen } from './components/AppLoadingScreen.js';

const MainLayout: React.FC = () => {
  const {
    user,
    messages,
    isGenerating,
    streamingContent,
    selectedModel,
    activeConversation,
    isLoading,
    settings,
    systemLimited,
    setSystemLimited,
    startNewChat,
    setIsProModalOpen,
    setSelectedModel,
    sendMessage,
    stopGeneration,
  } = useApp();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isSystemLimitedModalOpen, setIsSystemLimitedModalOpen] = useState(false);
  const isAutoScrollEnabled = useRef(true);

  // When system limited state activates, automatically open the modal
  useEffect(() => {
    if (systemLimited?.active) {
      setIsSystemLimitedModalOpen(true);
    }
  }, [systemLimited?.active]);

  // Auto-scroll when new messages arrive or while streaming (instant during stream to prevent animation lag)
  useEffect(() => {
    if (isAutoScrollEnabled.current && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: isGenerating ? 'auto' : 'smooth',
      });
    }
  }, [messages, streamingContent, isGenerating]);

  // Handle user manual scroll
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 80;

    isAutoScrollEnabled.current = isAtBottom;
    setShowScrollBottom(!isAtBottom);
  };

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
      isAutoScrollEnabled.current = true;
      setShowScrollBottom(false);
    }
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + O = New Chat
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        startNewChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startNewChat]);

  // If initial application load hasn't completed
  if (isLoading && !user) {
    return <AppLoadingScreen />;
  }

  const hasMessages = messages.length > 0 || isGenerating;

  return (
    <div className="relative h-screen w-screen overflow-hidden flex bg-slate-950 text-slate-100 font-sans">
      {/* Optional Custom Background Layer */}
      {settings.background.imageUrl && (
        <div
          className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-500"
          style={{
            backgroundImage: `url(${settings.background.imageUrl})`,
            backgroundSize: settings.background.position,
            backgroundPosition: 'center',
            filter: `blur(${settings.background.blur}px)`,
            opacity: settings.background.opacity,
          }}
        />
      )}

      {/* Ambient gradient aura */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Chat Workspace */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative z-10">
        <ChatHeader />

        {/* Scrollable Chat Area */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col"
        >
          {/* In-Chat Announcement Banner */}
          <ChatAnnouncements />

          {isLoading ? (
            <ChatLoadingSkeleton />
          ) : !hasMessages ? (
            <EmptyChatWelcome />
          ) : (
            <div className="flex-1 flex flex-col py-4">
              {/* Message List */}
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}

              {/* AI Thinking Phase Indicator (Before streaming chunks start) */}
              {isGenerating && !streamingContent && (
                <ThinkingIndicator
                  modelName={
                    selectedModel === 'gemini-3.1-pro-preview'
                      ? 'Craft Pro 3.1 Reasoning'
                      : 'Craft Flash 3.8'
                  }
                  onStop={stopGeneration}
                />
              )}

              {/* Real-time Streaming Response Turn once tokens arrive */}
              {isGenerating && streamingContent && (
                <ChatMessage
                  message={{
                    id: 'streaming-turn',
                    conversationId: activeConversation?.id || '',
                    role: 'assistant',
                    content: streamingContent,
                    model: selectedModel,
                    status: 'streaming',
                    createdAt: new Date().toISOString(),
                  }}
                  isStreaming={true}
                />
              )}

              {/* System Limited Banner if active & not tied to an existing message */}
              {systemLimited && systemLimited.active && (
                <div className="max-w-4xl mx-auto w-full px-3 sm:px-6 py-4">
                  <SystemLimitedBanner
                    errorType={systemLimited.errorType}
                    errorMessage={systemLimited.errorMessage}
                    reason={systemLimited.reason}
                    retryAfterSeconds={systemLimited.retryAfterSeconds}
                    onRetry={() => {
                      setIsSystemLimitedModalOpen(false);
                      setSystemLimited(null);
                      const lastUser = [...messages].reverse().find((m) => m.role === 'user');
                      if (lastUser) sendMessage(lastUser.content);
                    }}
                    onUpgrade={() => {
                      setIsSystemLimitedModalOpen(false);
                      setIsProModalOpen(true);
                    }}
                    onNewChat={() => startNewChat()}
                    onSwitchModel={(m) => setSelectedModel(m)}
                    onOpenModal={() => setIsSystemLimitedModalOpen(true)}
                  />
                </div>
              )}
            </div>
          )}

          {/* Floating Scroll to Bottom Button */}
          {showScrollBottom && (
            <button
              type="button"
              onClick={scrollToBottom}
              className="fixed bottom-24 right-6 p-2.5 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 shadow-xl backdrop-blur-md transition-all hover:scale-110 z-30 animate-scaleIn"
              title="Scroll to bottom"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Bottom Composer */}
        <ChatInput />
      </main>

      {/* Global Modals */}
      <SettingsModal />
      <ProUpgradeModal />
      <VoiceModal />
      <DeleteConfirmModal />
      <SystemLimitedModal
        isOpen={Boolean(systemLimited?.active && isSystemLimitedModalOpen)}
        errorType={systemLimited?.errorType}
        errorMessage={systemLimited?.errorMessage}
        reason={systemLimited?.reason}
        retryAfterSeconds={systemLimited?.retryAfterSeconds}
        onRetry={() => {
          setIsSystemLimitedModalOpen(false);
          setSystemLimited(null);
          const lastUser = [...messages].reverse().find((m) => m.role === 'user');
          if (lastUser) sendMessage(lastUser.content);
        }}
        onBackToChat={() => setIsSystemLimitedModalOpen(false)}
        onSwitchModel={(m) => {
          setSelectedModel(m);
          setIsSystemLimitedModalOpen(false);
        }}
        onUpgrade={() => {
          setIsSystemLimitedModalOpen(false);
          setIsProModalOpen(true);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
