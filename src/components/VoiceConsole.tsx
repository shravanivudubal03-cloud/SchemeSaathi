import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Cpu,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Check,
  Loader2,
  Upload,
} from 'lucide-react';
import { SAMPLE_STORIES, UI_COPY } from '../i18n/translations.ts';
import { OllamaConnectionMode, OllamaEnginePolicy, UILanguage } from '../types/scheme.ts';

interface VoiceConsoleProps {
  uiLanguage: UILanguage;
  text: string;
  onTextChange: (val: string) => void;
  onAnalyze: (overrideText?: string) => void;
  isAnalyzing: boolean;
  onReset: () => void;
  ollamaUrl: string;
  ollamaModel: string;
  ollamaConnectionMode: OllamaConnectionMode;
  ollamaEnginePolicy: OllamaEnginePolicy;
  ollamaOnline: boolean;
  ollamaVersion: string | null;
  availableOllamaModels: string[];
  isProbingOllama: boolean;
  onOllamaUrlChange: (url: string) => void;
  onOllamaModelChange: (model: string) => void;
  onOllamaConnectionModeChange: (mode: OllamaConnectionMode) => void;
  onOllamaEnginePolicyChange: (policy: OllamaEnginePolicy) => void;
  onProbeOllama: () => void;
}

type SpeechRecognitionLang = 'mr-IN' | 'hi-IN' | 'en-IN';
type VoiceMode = 'idle' | 'speech-api' | 'media-recorder';

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read audio stream.'));
    reader.readAsDataURL(blob);
  });
}

export const VoiceConsole: React.FC<VoiceConsoleProps> = ({
  uiLanguage,
  text,
  onTextChange,
  onAnalyze,
  isAnalyzing,
  onReset,
  ollamaUrl,
  ollamaModel,
  ollamaConnectionMode,
  ollamaEnginePolicy,
  ollamaOnline,
  ollamaVersion,
  availableOllamaModels,
  isProbingOllama,
  onOllamaUrlChange,
  onOllamaModelChange,
  onOllamaConnectionModeChange,
  onOllamaEnginePolicyChange,
  onProbeOllama,
}) => {
  const copy = UI_COPY[uiLanguage];
  const [speechLang, setSpeechLang] = useState<SpeechRecognitionLang>('mr-IN');
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showOllamaPanel, setShowOllamaPanel] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const baseTextRef = useRef<string>('');

  const isListening = voiceMode !== 'idle';

  const stopMediaResources = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      stopMediaResources();
    };
  }, []);

  const transcribeBlob = async (blob: Blob) => {
    setIsTranscribing(true);
    setVoiceError(null);
    try {
      const audioBase64 = await blobToBase64(blob);
      const res = await fetch('/api/transcribe-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64,
          mimeType: blob.type || 'audio/webm',
          speechLang,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { transcript?: string; error?: string };
      if (!res.ok || !data.transcript) {
        throw new Error(data.error || 'Could not transcribe voice recording.');
      }
      const base = baseTextRef.current;
      onTextChange(base ? `${base} ${data.transcript}` : data.transcript);
    } catch (err) {
      setVoiceError(
        err instanceof Error
          ? err.message
          : uiLanguage === 'mr'
            ? 'आवाज मजकुरात बदलण्यात अडचण आली. कृपया पुन्हा प्रयत्न करा.'
            : 'Audio transcription failed. Please try speaking again or type below.',
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  const startMediaRecorderFallback = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setVoiceError(copy.voiceUnsupported);
      setVoiceMode('idle');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const chosenType = preferredTypes.find((t) => MediaRecorder.isTypeSupported?.(t));
      const recorder = chosenType ? new MediaRecorder(stream, { mimeType: chosenType }) : new MediaRecorder(stream);

      audioChunksRef.current = [];
      baseTextRef.current = text.trim();

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          audioChunksRef.current.push(ev.data);
        }
      };

      recorder.onstop = () => {
        stopMediaResources();
        setVoiceMode('idle');
        setRecordingSeconds(0);
        const chunks = audioChunksRef.current;
        audioChunksRef.current = [];
        if (chunks.length > 0) {
          const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
          if (audioBlob.size > 200) {
            void transcribeBlob(audioBlob);
          }
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setRecordingSeconds(0);
      setVoiceMode('media-recorder');
      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      stopMediaResources();
      setVoiceMode('idle');
      const errName = err instanceof Error ? err.name : '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        setVoiceError(
          uiLanguage === 'mr'
            ? 'मायक्रोफोनची परवानगी नाकारली आहे. ब्राउझरमध्ये माइक सुरू करा, ऑडिओ क्लिप अपलोड करा किंवा खाली टाइप करा.'
            : 'Microphone permission was blocked. Allow mic access in browser settings, upload an audio clip, or type below.',
        );
      } else {
        setVoiceError(
          uiLanguage === 'mr'
            ? 'या उपकरणावर मायक्रोफोन उपलब्ध नाही. तुम्ही ऑडिओ क्लिप अपलोड करू शकता किंवा खाली टाइप करू शकता.'
            : 'No active microphone detected here. You can upload a short voice clip or type your situation below.',
        );
      }
    }
  };

  const stopVoiceCapture = () => {
    if (voiceMode === 'speech-api' && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      setVoiceMode('idle');
      return;
    }
    if (voiceMode === 'media-recorder' && mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      } else {
        stopMediaResources();
        setVoiceMode('idle');
      }
    }
  };

  const toggleVoice = async () => {
    setVoiceError(null);
    if (isListening) {
      stopVoiceCapture();
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      await startMediaRecorderFallback();
      return;
    }

    // Request mic permission cleanly first so SpeechRecognition never silently fails in embedded frames
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const permStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        permStream.getTracks().forEach((t) => t.stop());
      } catch (err) {
        const errName = err instanceof Error ? err.name : '';
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          setVoiceError(
            uiLanguage === 'mr'
              ? 'मायक्रोफोनची परवानगी नाकारली आहे. ब्राउझरमध्ये माइक सुरू करा, ऑडिओ क्लिप अपलोड करा किंवा खाली टाइप करा.'
              : 'Microphone permission was blocked. Allow mic access in browser settings, upload an audio clip, or type below.',
          );
          return;
        }
        // If getUserMedia threw NotFound/etc., try SpeechRec anyway or fallback
      }
    }

    const rec = new SpeechRec();
    rec.lang = speechLang;
    rec.continuous = true;
    rec.interimResults = true;
    baseTextRef.current = text.trim();

    let fellBack = false;
    rec.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + ' ';
      }
      const combined = baseTextRef.current ? `${baseTextRef.current} ${transcript.trim()}` : transcript.trim();
      onTextChange(combined);
    };

    rec.onerror = (event) => {
      if (fellBack) return;
      if (
        event.error === 'network' ||
        event.error === 'service-not-allowed' ||
        event.error === 'language-not-supported'
      ) {
        fellBack = true;
        try {
          rec.stop();
        } catch {
          // ignore
        }
        void startMediaRecorderFallback();
        return;
      }

      setVoiceMode('idle');
      if (event.error === 'not-allowed') {
        setVoiceError(
          uiLanguage === 'mr'
            ? 'मायक्रोफोनची परवानगी नाकारली आहे. कृपया ब्राउझरमध्ये माइक सुरू करा किंवा ऑडिओ अपलोड करा.'
            : 'Microphone permission denied. Allow mic access, upload an audio clip, or type below.',
        );
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setVoiceError(
          uiLanguage === 'mr'
            ? 'आवाज ऐकण्यात अडचण आली. कृपया पुन्हा प्रयत्न करा.'
            : `Voice recognition paused (${event.error}). Try speaking again or upload an audio clip.`,
        );
      }
    };

    rec.onend = () => {
      if (!fellBack) {
        setVoiceMode('idle');
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
      setVoiceMode('speech-api');
    } catch {
      await startMediaRecorderFallback();
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    baseTextRef.current = text.trim();
    void transcribeBlob(file);
  };

  const handleCopyCommand = () => {
    navigator.clipboard?.writeText('OLLAMA_ORIGINS="*" ollama serve').catch(() => {});
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 1800);
  };

  const activeModelDisplay =
    availableOllamaModels.length > 0 && !availableOllamaModels.includes(ollamaModel)
      ? availableOllamaModels[0]
      : ollamaModel;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 whitespace-nowrap">{copy.voiceLangLabel}:</span>
          <div className="flex items-center gap-1 p-1 bg-slate-50 border border-slate-200 rounded-lg">
            {(
              [
                { code: 'mr-IN', label: 'मराठी' },
                { code: 'hi-IN', label: 'हिंदी' },
                { code: 'en-IN', label: 'English' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.code}
                type="button"
                onClick={() => setSpeechLang(opt.code)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  speechLang === opt.code
                    ? 'bg-[#16A34A] text-white'
                    : 'text-slate-600 hover:text-[#050D16]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleAudioUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => void toggleVoice()}
            disabled={isTranscribing}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              isListening
                ? 'bg-[#047857] text-white ring-4 ring-[#16A34A]/25'
                : 'bg-[#F0FDF4] text-[#047857] border border-[#16A34A]/40 hover:bg-[#DCFCE7]'
            } disabled:opacity-60`}
          >
            {isTranscribing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
            <span>
              {isTranscribing
                ? copy.transcribingBtn
                : voiceMode === 'media-recorder'
                  ? `${copy.recordingBtn} (${formatTimer(recordingSeconds)})`
                  : isListening
                    ? copy.listeningBtn
                    : copy.speakBtn}
            </span>
          </button>
        </div>
      </div>

      {voiceError && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
          <span>{voiceError}</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isTranscribing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-[#047857] bg-white border border-[#16A34A]/40 rounded-md hover:bg-[#F0FDF4] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-3 h-3" />
            <span>{copy.uploadAudioBtn}</span>
          </button>
        </div>
      )}

      <div className="mt-4">
        <label htmlFor="citizen-situation-input" className="sr-only">
          {copy.inputPlaceholder}
        </label>
        <textarea
          id="citizen-situation-input"
          rows={3}
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={copy.inputPlaceholder}
          className="w-full rounded-lg border border-slate-200 bg-slate-50/70 p-4 text-sm sm:text-base leading-relaxed text-[#050D16] placeholder:text-slate-400 focus:outline-none focus:border-[#16A34A] focus:bg-white transition-colors"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {text.trim().length > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-[#050D16] rounded-lg border border-slate-200 bg-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{uiLanguage === 'mr' ? 'नवीन शोध' : 'Clear'}</span>
            </button>
          )}
        </div>

        <button
          type="button"
          disabled={isAnalyzing || text.trim().length < 3}
          onClick={() => onAnalyze()}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#047857] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          <span>{isAnalyzing ? copy.analyzingBtn : copy.analyzeBtn}</span>
          {!isAnalyzing && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>

      {isAnalyzing && (
        <p className="mt-3 text-xs text-[#047857] bg-[#F0FDF4] border border-[#16A34A]/25 rounded-lg px-3 py-2 flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span>
            {ollamaEnginePolicy === 'gemini' ? copy.analyzingGeminiNotice : copy.analyzingOllamaNotice}
          </span>
        </p>
      )}

      <div className="mt-5 pt-4 border-t border-slate-100">
        <p className="text-xs font-medium text-slate-600 mb-2.5">{copy.sampleLabel}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SAMPLE_STORIES.map((story) => (
            <button
              key={story.id}
              type="button"
              onClick={() => {
                setSpeechLang(story.speechLang);
                onTextChange(story.text);
                onAnalyze(story.text);
              }}
              className="text-left px-3 py-2 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-[#F0FDF4] hover:border-[#16A34A]/50 transition-colors cursor-pointer"
            >
              <span className="block text-xs font-semibold text-[#047857] truncate">
                {story.label[uiLanguage]}
              </span>
              <span className="block text-[11px] text-slate-600 truncate mt-0.5">
                {story.text}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Collapsible Ollama Runtime Bar */}
      <div className="mt-4 pt-3.5 border-t border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2 text-slate-700">
            <Cpu className={`w-4 h-4 shrink-0 ${ollamaOnline ? 'text-[#047857]' : 'text-slate-500'}`} />
            <span className="font-semibold text-[#050D16] whitespace-nowrap">{copy.ollamaBarTitle}:</span>
            <span
              className={`font-mono-tabular whitespace-nowrap ${
                ollamaOnline ? 'text-[#047857] font-semibold' : 'text-slate-600'
              }`}
            >
              {ollamaOnline
                ? `${copy.ollamaOnlineLabel} (${activeModelDisplay}${ollamaVersion ? ` · v${ollamaVersion}` : ''})`
                : ollamaEnginePolicy === 'ollama'
                  ? uiLanguage === 'mr'
                    ? 'ऑफलाइन · फक्त Ollama निवडले आहे'
                    : 'Offline · Strict Ollama Only'
                  : copy.ollamaOfflineLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onProbeOllama}
              disabled={isProbingOllama}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#047857] bg-[#F0FDF4] hover:bg-[#DCFCE7] border border-[#16A34A]/30 rounded-md whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3 h-3 ${isProbingOllama ? 'animate-spin' : ''}`} />
              <span>{copy.ollamaProbeBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowOllamaPanel((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{uiLanguage === 'mr' ? 'सेटिंग्ज' : 'Configure'}</span>
              {showOllamaPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {showOllamaPanel && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="block text-[11px] font-medium text-slate-600 mb-1">{copy.ollamaModeLabel}</span>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-50 border border-slate-200 rounded-lg">
                  <button
                    type="button"
                    onClick={() => onOllamaConnectionModeChange('browser-direct')}
                    className={`px-2 py-1.5 text-[11px] font-medium rounded-md truncate cursor-pointer ${
                      ollamaConnectionMode === 'browser-direct'
                        ? 'bg-[#16A34A] text-white'
                        : 'text-slate-600 hover:text-[#050D16]'
                    }`}
                  >
                    {copy.ollamaModeBrowser}
                  </button>
                  <button
                    type="button"
                    onClick={() => onOllamaConnectionModeChange('server')}
                    className={`px-2 py-1.5 text-[11px] font-medium rounded-md truncate cursor-pointer ${
                      ollamaConnectionMode === 'server'
                        ? 'bg-[#16A34A] text-white'
                        : 'text-slate-600 hover:text-[#050D16]'
                    }`}
                  >
                    {copy.ollamaModeServer}
                  </button>
                </div>
              </div>

              <div>
                <span className="block text-[11px] font-medium text-slate-600 mb-1">{copy.ollamaPolicyLabel}</span>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-50 border border-slate-200 rounded-lg">
                  <button
                    type="button"
                    onClick={() => onOllamaEnginePolicyChange('auto')}
                    className={`px-2 py-1.5 text-[11px] font-medium rounded-md truncate cursor-pointer ${
                      ollamaEnginePolicy === 'auto'
                        ? 'bg-[#16A34A] text-white'
                        : 'text-slate-600 hover:text-[#050D16]'
                    }`}
                  >
                    {copy.ollamaPolicyAuto}
                  </button>
                  <button
                    type="button"
                    onClick={() => onOllamaEnginePolicyChange('ollama')}
                    className={`px-2 py-1.5 text-[11px] font-medium rounded-md truncate cursor-pointer ${
                      ollamaEnginePolicy === 'ollama'
                        ? 'bg-[#16A34A] text-white'
                        : 'text-slate-600 hover:text-[#050D16]'
                    }`}
                  >
                    {copy.ollamaPolicyStrict}
                  </button>
                  <button
                    type="button"
                    onClick={() => onOllamaEnginePolicyChange('gemini')}
                    className={`px-2 py-1.5 text-[11px] font-medium rounded-md truncate cursor-pointer ${
                      ollamaEnginePolicy === 'gemini'
                        ? 'bg-[#16A34A] text-white'
                        : 'text-slate-600 hover:text-[#050D16]'
                    }`}
                  >
                    {copy.ollamaPolicyGemini}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">OLLAMA_BASE_URL</label>
                <input
                  type="text"
                  value={ollamaUrl}
                  onChange={(e) => onOllamaUrlChange(e.target.value)}
                  placeholder="http://127.0.0.1:11434"
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono-tabular bg-slate-50 focus:bg-white focus:border-[#16A34A] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">OLLAMA_MODEL</label>
                {availableOllamaModels.length > 0 ? (
                  <select
                    value={activeModelDisplay}
                    onChange={(e) => onOllamaModelChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono-tabular bg-slate-50 focus:bg-white focus:border-[#16A34A] focus:outline-none"
                  >
                    {availableOllamaModels.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={ollamaModel}
                    onChange={(e) => onOllamaModelChange(e.target.value)}
                    placeholder="qwen2.5:3b"
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-mono-tabular bg-slate-50 focus:bg-white focus:border-[#16A34A] focus:outline-none"
                  />
                )}
              </div>
            </div>

            {!ollamaOnline && ollamaEnginePolicy !== 'gemini' && (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <span className="text-[11px] text-slate-600">
                  {uiLanguage === 'mr'
                    ? 'तुमच्या संगणकावर Ollama सुरू करण्यासाठी:'
                    : 'Run locally with qwen2.5:3b:'}{' '}
                  <code className="font-mono-tabular font-semibold text-[#050D16]">
                    {ollamaConnectionMode === 'browser-direct'
                      ? 'OLLAMA_ORIGINS="*" ollama serve'
                      : 'ollama run qwen2.5:3b'}
                  </code>
                </span>
                <button
                  type="button"
                  onClick={handleCopyCommand}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded hover:border-[#16A34A] cursor-pointer"
                >
                  {copiedCmd ? <Check className="w-3 h-3 text-[#047857]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCmd ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

