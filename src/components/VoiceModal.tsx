import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Play,
  Pause,
  Square,
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { BrandLogo } from './BrandLogo.js';
import { api } from '../services/api.js';

export const VoiceModal: React.FC = () => {
  const { isVoiceModalOpen, setIsVoiceModalOpen, sendMessage, settings, t } = useApp();

  const [voiceState, setVoiceState] = useState<
    'ready' | 'listening' | 'processing' | 'speaking' | 'stopped' | 'error'
  >('ready');
  const [transcript, setTranscript] = useState('');
  const [lastAiResponse, setLastAiResponse] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isVoiceModalOpen) {
      cleanup();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceState('error');
      setErrorMessage('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setVoiceState('listening');
      setTranscript('');
      setErrorMessage(null);
    };

    recognition.onresult = (event: any) => {
      let current = '';
      for (let i = 0; i < event.results.length; i++) {
        current += event.results[i][0].transcript;
      }
      setTranscript(current);
    };

    recognition.onerror = (e: any) => {
      console.error('Voice modal mic error:', e);
      setVoiceState('error');
      if (e.error === 'not-allowed') {
        setErrorMessage('Microphone access was denied. Please check device permissions.');
      } else {
        setErrorMessage('Voice recognition encountered an error.');
      }
    };

    recognition.onend = async () => {
      if (transcript.trim()) {
        handleProcessVoice(transcript.trim());
      } else {
        setVoiceState('ready');
      }
    };

    recognitionRef.current = recognition;

    // Auto-start listening on open
    try {
      recognition.start();
    } catch (e) {
      // ignore
    }

    return () => {
      cleanup();
    };
  }, [isVoiceModalOpen]);

  const cleanup = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setVoiceState('ready');
    setTranscript('');
  };

  const handleStartListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        // ignore
      }
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setVoiceState('ready');
  };

  const handleProcessVoice = async (query: string) => {
    setVoiceState('processing');

    try {
      // Send chat message to active conversation
      await sendMessage(query);

      // Synthesize spoken answer
      setVoiceState('speaking');
      const voice = settings.voice.voiceName || 'Kore';
      const promptSnippet = `I heard: "${query}". Responding directly now.`;
      setLastAiResponse(promptSnippet);

      const data = await api.getSpeechAudio(query, voice);
      if (data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        audio.playbackRate = settings.voice.speechSpeed || 1.0;
        audio.volume = settings.voice.volume || 1.0;
        audio.onended = () => setVoiceState('ready');
        audio.onerror = () => setVoiceState('ready');
        audioRef.current = audio;
        await audio.play();
      } else {
        setVoiceState('ready');
      }
    } catch (e) {
      console.warn('Voice processing error:', e);
      setVoiceState('ready');
    }
  };

  if (!isVoiceModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl animate-fadeIn"
        onClick={() => setIsVoiceModalOpen(false)}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center z-10 animate-scaleIn">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsVoiceModalOpen(false)}
          className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Mark */}
        <div className="flex items-center gap-2 mb-6">
          <BrandLogo variant="icon" size={28} />
          <span className="font-bold text-sm text-slate-200 tracking-tight">Craft AI Voice</span>
        </div>

        {/* Fluid Animated Neural Voice Orb */}
        <div className="relative my-6 flex items-center justify-center">
          {/* Animated Glow Rings */}
          <div
            className={`absolute -inset-8 rounded-full blur-2xl transition-all duration-500 ${
              voiceState === 'listening'
                ? 'bg-rose-500/30 scale-125 animate-ping'
                : voiceState === 'speaking'
                ? 'bg-indigo-500/40 scale-110 animate-pulse'
                : voiceState === 'processing'
                ? 'bg-amber-500/30 animate-spin'
                : 'bg-indigo-500/10 scale-95'
            }`}
          />

          {/* Central Orb Button */}
          <button
            type="button"
            onClick={voiceState === 'listening' ? handleStopListening : handleStartListening}
            className={`relative w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              voiceState === 'listening'
                ? 'bg-gradient-to-tr from-rose-600 to-rose-500 border-4 border-rose-400/40 text-white shadow-rose-900/50'
                : voiceState === 'speaking'
                ? 'bg-gradient-to-tr from-indigo-600 to-cyan-500 border-4 border-indigo-400/40 text-white shadow-indigo-900/50'
                : 'bg-slate-800 border-2 border-slate-700 text-slate-200 hover:border-indigo-500'
            }`}
          >
            {voiceState === 'listening' ? (
              <Mic className="w-10 h-10 animate-pulse" />
            ) : voiceState === 'speaking' ? (
              <Volume2 className="w-10 h-10 animate-bounce" />
            ) : (
              <Mic className="w-10 h-10 text-slate-300" />
            )}
          </button>
        </div>

        {/* State Label */}
        <div className="mb-4">
          <span className="inline-block text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-indigo-300">
            {voiceState === 'listening'
              ? 'Listening...'
              : voiceState === 'processing'
              ? 'Processing speech...'
              : voiceState === 'speaking'
              ? 'Speaking response...'
              : voiceState === 'error'
              ? 'Voice Error'
              : 'Tap microphone to speak'}
          </span>
        </div>

        {/* Real-time Transcription or Error */}
        <div className="w-full min-h-[60px] p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-sm text-slate-200 mb-6">
          {errorMessage ? (
            <p className="text-rose-400 text-xs">{errorMessage}</p>
          ) : transcript ? (
            <p className="italic text-slate-100 font-medium">"{transcript}"</p>
          ) : (
            <p className="text-slate-500 text-xs">
              Say anything naturally. Craft AI will listen, synthesize the answer, and reply aloud.
            </p>
          )}
        </div>

        {/* Voice Setting Footer */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>Voice: <strong className="text-slate-200">{settings.voice.voiceName || 'Kore'}</strong></span>
          <span>•</span>
          <span>Speed: <strong className="text-slate-200">{settings.voice.speechSpeed}x</strong></span>
        </div>
      </div>
    </div>
  );
};
