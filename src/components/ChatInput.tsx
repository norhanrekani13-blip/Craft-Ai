import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Square,
  Mic,
  MicOff,
  Paperclip,
  X,
  FileText,
  Sparkles,
  ChevronDown,
  Cpu,
} from 'lucide-react';
import { Attachment } from '../types/index.js';
import { useApp, AVAILABLE_MODELS } from '../context/AppContext.js';
import { ProBadge } from './ProBadge.js';

export const ChatInput: React.FC = () => {
  const {
    t,
    sendMessage,
    stopGeneration,
    isGenerating,
    user,
    selectedModel,
    setSelectedModel,
    setIsProModalOpen,
  } = useApp();

  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [showModelPicker, setShowModelPicker] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 180)}px`;
    }
  }, [text]);

  // Speech Recognition Setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setText((prev) => (prev ? `${prev} ${transcript.trim()}` : transcript.trim()));
        }
      };

      recognition.onerror = (e: any) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
        if (e.error === 'not-allowed') {
          setMicError('Microphone access was denied. Please check your browser permissions.');
        } else {
          setMicError('Speech recognition unavailable on this device.');
        }
        setTimeout(() => setMicError(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setMicError('Speech recognition is not supported in this browser.');
      setTimeout(() => setMicError(null), 4000);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setMicError(null);
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  // Handle File Uploads
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxMB = user?.plan === 'pro' ? 25 : 5;

    Array.from(files).forEach((file) => {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxMB) {
        setMicError(`File "${file.name}" (${sizeMB.toFixed(1)}MB) exceeds your plan limit of ${maxMB}MB.`);
        setTimeout(() => setMicError(null), 5000);
        return;
      }

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const base64 = loadEvent.target?.result as string;
        const newAtt: Attachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataBase64: base64,
        };
        setAttachments((prev) => [...prev, newAtt]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Submit
  const handleSend = () => {
    if (isGenerating) {
      stopGeneration();
      return;
    }

    if (!text.trim() && attachments.length === 0) return;

    sendMessage(text, attachments);
    setText('');
    setAttachments([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectModel = (modelId: string) => {
    const model = AVAILABLE_MODELS.find((m) => m.id === modelId);
    if (model?.isProOnly && user?.plan !== 'pro') {
      setShowModelPicker(false);
      setIsProModalOpen(true);
      return;
    }
    setSelectedModel(modelId);
    setShowModelPicker(false);
  };

  const currentModelInfo =
    AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pb-3 sm:pb-6 relative">
      {/* Mic Error Toast */}
      {micError && (
        <div className="absolute -top-10 left-6 right-6 p-2 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs text-center backdrop-blur-md shadow-lg animate-fadeIn z-20">
          {micError}
        </div>
      )}

      {/* Model Picker Floating Dropdown */}
      {showModelPicker && (
        <div className="absolute bottom-full mb-2 left-6 sm:left-10 w-72 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2 z-30 animate-scaleIn backdrop-blur-xl">
          <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Select Intelligence Model
          </div>
          <div className="space-y-1">
            {AVAILABLE_MODELS.map((m) => {
              const isSelected = selectedModel === m.id;
              const isLocked = m.isProOnly && user?.plan !== 'pro';

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectModel(m.id)}
                  className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border border-indigo-500/40 text-white'
                      : 'hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-indigo-400 mt-0.5">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-xs text-slate-100">{m.name}</span>
                      {m.isProOnly && <ProBadge size="sm" />}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{m.description}</p>
                    {isLocked && (
                      <span className="text-[10px] text-amber-400 font-semibold block mt-0.5">
                        Requires Craft AI Pro
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Composer Container */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-slate-700/80 bg-slate-900/90 shadow-2xl shadow-indigo-950/20 backdrop-blur-xl transition-all focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20">
        {/* Attachment Preview Chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-1 border-b border-slate-800">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 p-1.5 pr-2 rounded-xl bg-slate-800/90 border border-slate-700 text-xs text-slate-200"
              >
                {att.type.startsWith('image/') && att.dataBase64 ? (
                  <img
                    src={att.dataBase64}
                    alt={att.name}
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                )}
                <span className="font-medium text-xs truncate max-w-[120px]">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-1 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.inputPlaceholder}
          rows={1}
          className="w-full px-4 pt-3.5 pb-2.5 bg-transparent text-slate-100 placeholder:text-slate-400 text-sm sm:text-base focus:outline-none resize-none max-h-44 leading-relaxed font-normal"
        />

        {/* Toolbar Footer */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1">
          {/* Left: Attachment + Model Pill */}
          <div className="flex items-center gap-1.5">
            {/* File Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.md,.json,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image or file"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Model Selector Pill */}
            <button
              type="button"
              onClick={() => setShowModelPicker((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-all"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentModelInfo.name.split(' ')[1] || 'Flash'}</span>
              {currentModelInfo.isProOnly && <ProBadge size="sm" />}
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          {/* Right: Microphone + Send / Stop button */}
          <div className="flex items-center gap-1.5">
            {/* Speech to text Mic button */}
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? 'Stop listening' : t.tapToSpeak}
              className={`p-2 rounded-xl transition-all ${
                isListening
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send or Stop Generation */}
            {isGenerating ? (
              <button
                type="button"
                onClick={stopGeneration}
                title={t.stop}
                className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 transition-all hover:scale-105 active:scale-95"
              >
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSend}
                disabled={!text.trim() && attachments.length === 0}
                title={t.send}
                className={`p-2 rounded-xl transition-all ${
                  text.trim() || attachments.length > 0
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/40 hover:scale-105 active:scale-95'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
