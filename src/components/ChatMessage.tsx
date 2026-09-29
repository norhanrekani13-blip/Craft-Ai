import React, { useState, useRef } from 'react';
import {
  Copy,
  Check,
  Volume2,
  VolumeX,
  RotateCcw,
  Pencil,
  Trash2,
  FileText,
  Pause,
  Play,
  Square,
  AlertCircle,
} from 'lucide-react';
import { marked } from 'marked';
import { Message, Attachment } from '../types/index.js';
import { useApp } from '../context/AppContext.js';
import { BrandLogo } from './BrandLogo.js';
import { SystemLimitedBanner } from './SystemLimitedBanner.js';
import { api } from '../services/api.js';

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

// Memoized ChatMessage for maximum rendering performance
export const ChatMessage: React.FC<ChatMessageProps> = React.memo(({ message, isStreaming = false }) => {
  const {
    t,
    user,
    settings,
    editUserMessage,
    regenerateResponse,
    deleteMessage,
    startNewChat,
    setIsProModalOpen,
    setSelectedModel,
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  // Audio / TTS state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isUser = message.role === 'user';
  const isError = message.status === 'error';

  // Copy message text
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save edited user message
  const handleSaveEdit = () => {
    if (!editContent.trim()) return;
    setIsEditing(false);
    editUserMessage(message.id, editContent);
  };

  // Play Speech / TTS
  const handleToggleSpeech = async () => {
    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    if (audioRef.current && audioRef.current.src) {
      audioRef.current.play();
      setIsPlayingAudio(true);
      return;
    }

    try {
      setIsAudioLoading(true);
      const voice = settings.voice.voiceName || 'Kore';
      const data = await api.getSpeechAudio(message.content, voice);
      if (data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        audio.playbackRate = settings.voice.speechSpeed || 1.0;
        audio.volume = settings.voice.volume || 1.0;
        audio.onended = () => setIsPlayingAudio(false);
        audio.onerror = () => setIsPlayingAudio(false);
        audioRef.current = audio;
        await audio.play();
        setIsPlayingAudio(true);
      }
    } catch (e) {
      console.warn('Backend TTS failed, falling back to Web Speech API:', e);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.rate = settings.voice.speechSpeed || 1.0;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    } finally {
      setIsAudioLoading(false);
    }
  };

  const handleStopSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  // Format HTML with marked safely (memoized to prevent expensive re-parsing on unrelated re-renders)
  const parsedMarkdown = React.useMemo(() => {
    try {
      const rawHtml = marked.parse(message.content, { breaks: true, gfm: true }) as string;
      return { __html: rawHtml };
    } catch (e) {
      return { __html: message.content };
    }
  }, [message.content]);

  // Format Timestamp
  const formattedTime = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`group relative py-4 sm:py-5 px-3 sm:px-6 transition-colors duration-200 ${
        isUser
          ? 'bg-transparent'
          : 'bg-slate-900/40 border-y border-slate-800/40 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-start gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-700 bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-200">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.name?.[0]?.toUpperCase() || 'U'}</span>
              )}
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1 shadow-md shadow-indigo-950/30">
              <BrandLogo variant="icon" size={20} />
            </div>
          )}
        </div>

        {/* Message Content Container */}
        <div className="flex-1 min-w-0">
          {/* Header Name & Timestamp & Real Metrics */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-bold text-xs sm:text-sm text-slate-200 tracking-tight">
              {isUser ? user?.name || 'You' : 'Craft AI'}
            </span>
            {!isUser && message.model && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 text-indigo-300">
                {message.model === 'gemini-3.1-pro-preview' ? 'Pro 3.1' : 'Flash 3.8'}
              </span>
            )}
            {!isUser && message.metrics?.ttftMs && (
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/30 text-emerald-300" title={`First token in ${message.metrics.ttftMs}ms, total ${message.metrics.totalDurationMs}ms`}>
                ⚡ {message.metrics.ttftMs}ms
              </span>
            )}
            <span className="text-[11px] text-slate-400 font-medium">
              {formattedTime}
            </span>
          </div>

          {/* Attachments preview (if any) */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs text-slate-200"
                >
                  {att.type.startsWith('image/') && att.dataBase64 ? (
                    <img
                      src={att.dataBase64}
                      alt={att.name}
                      className="w-10 h-10 object-cover rounded-lg border border-slate-700"
                    />
                  ) : (
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300">
                      <FileText className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate max-w-[140px]">{att.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {(att.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Message Body */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-indigo-500/50 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-[90px]"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all"
                >
                  Save & Regenerate
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
                >
                  {t.cancel}
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Formatted Markdown Content */}
              <div
                className="markdown-content text-sm sm:text-base text-slate-100 leading-relaxed break-words font-normal"
                dangerouslySetInnerHTML={parsedMarkdown}
              />

              {/* Streaming Cursor Animation */}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 align-middle bg-indigo-400 animate-pulse rounded-sm" />
              )}
            </div>
          )}

          {/* System Limited Card if message errored */}
          {isError && (
            <div className="mt-3">
              <SystemLimitedBanner
                errorType={message.errorType}
                errorMessage={message.errorMessage}
                onRetry={() => regenerateResponse(message.id)}
                onUpgrade={() => setIsProModalOpen(true)}
                onNewChat={() => startNewChat()}
                onSwitchModel={(model) => setSelectedModel(model)}
              />
            </div>
          )}

          {/* Actions Toolbar */}
          {!isEditing && (
            <div className="flex items-center gap-1 mt-3 opacity-90 group-hover:opacity-100 transition-opacity">
              {/* Copy Message */}
              <button
                type="button"
                onClick={handleCopy}
                title={t.copy}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Read Aloud / TTS (Assistant messages only) */}
              {!isUser && !isError && message.content && (
                <>
                  <button
                    type="button"
                    onClick={handleToggleSpeech}
                    disabled={isAudioLoading}
                    title={isPlayingAudio ? t.pause : t.readAloud}
                    className={`p-1.5 rounded-lg transition-all ${
                      isPlayingAudio
                        ? 'text-indigo-400 bg-indigo-950/60 border border-indigo-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {isAudioLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    ) : isPlayingAudio ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {isPlayingAudio && (
                    <button
                      type="button"
                      onClick={handleStopSpeech}
                      title="Stop audio"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}

              {/* Edit User Message */}
              {isUser && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  title={t.edit}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Regenerate Assistant Response */}
              {!isUser && !isStreaming && (
                <button
                  type="button"
                  onClick={() => regenerateResponse(message.id)}
                  title={t.regenerate}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Delete message */}
              <button
                type="button"
                onClick={() => deleteMessage(message.id)}
                title={t.delete}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
