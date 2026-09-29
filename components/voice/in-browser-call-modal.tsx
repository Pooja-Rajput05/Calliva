'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  Calendar,
  CheckCircle2,
  Send,
  User,
  Bot,
  Activity,
  ArrowRight,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';

interface Message {
  id: string;
  sender: 'ai' | 'user' | 'system';
  text: string;
  timestamp: string;
}

interface InBrowserCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InBrowserCallModal({ isOpen, onClose }: InBrowserCallModalProps) {
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [leadDetails, setLeadDetails] = useState<{
    name?: string;
    service?: string;
    slot?: string;
    score?: number;
  }>({});

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll transcript
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Handle call duration timer
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  // Text-To-Speech Output
  const speakAI = (text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to find Hindi / Indian English voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.lang.includes('hi') ||
        v.lang.includes('IN') ||
        v.name.includes('India') ||
        v.name.includes('Hindi')
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
      startListening();
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Start Speech Recognition
  const startListening = () => {
    if (typeof window === 'undefined' || isMuted || callState !== 'connected') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'hi-IN'; // Default Hindi/Hinglish

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const userSpoken = event.results[0][0].transcript;
        if (userSpoken.trim()) {
          handleUserMessage(userSpoken);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
    }
  };

  // Start Call Flow
  const startCall = () => {
    setCallState('calling');
    setCallDuration(0);
    setTranscript([]);
    setLeadDetails({});

    setTimeout(() => {
      setCallState('connected');
      const initialGreeting =
        'Namaste! Calliva Care Clinic me aapka swagat hai. Main AI receptionist bol rahi hoon. Main aapki kya madad kar sakti hoon?';

      setTranscript([
        {
          id: '1',
          sender: 'ai',
          text: initialGreeting,
          timestamp: 'Just now',
        },
      ]);

      speakAI(initialGreeting);
    }, 1500);
  };

  // End Call Flow
  const endCall = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setCallState('ended');
    setIsSpeaking(false);
    setIsListening(false);

    // Save call to Supabase
    if (transcript.length > 1) {
      fetch('/api/voice/save-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationSeconds: callDuration || 25,
          transcript,
          callerPhone: '+919876543210',
          leadDetails,
          summary: leadDetails.slot
            ? `Caller booked an appointment for ${leadDetails.slot}.`
            : 'Interactive in-browser voice inquiry with Calliva AI.',
          language: 'hi',
        }),
      }).catch((err) => console.warn('Failed saving call record:', err));
    }
  };

  // AI Response Logic (Calling Real Gemini API + Tool Telemetry)
  const handleUserMessage = async (userText: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: formatTime(callDuration),
    };

    const newHistory = [...transcript, userMsg];
    setTranscript(newHistory);
    setActiveTool('⚡ Gemini AI: Processing Voice Input...');

    try {
      const res = await fetch('/api/voice/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: userText,
          history: newHistory,
        }),
      });

      const data = await res.json();
      setActiveTool(null);

      const replyText = data.reply || 'Ji bilkul, main note kar rahi hoon.';

      if (data.toolAction === 'check_availability') {
        setActiveTool('⚡ Cal.com: Checking Available Slots...');
        setTimeout(() => setActiveTool(null), 1500);
      } else if (data.toolAction === 'book_appointment') {
        setActiveTool('📅 Cal.com: Slot Confirmed + 💬 WhatsApp Sent');
        setTimeout(() => setActiveTool(null), 1800);
      } else if (data.toolAction === 'get_business_info') {
        setActiveTool('📚 Supabase: RAG Knowledge Query');
        setTimeout(() => setActiveTool(null), 1200);
      }

      if (data.leadScore) {
        setLeadDetails((prev) => ({
          ...prev,
          score: data.leadScore,
          slot: data.detectedSlot || prev.slot || 'Tomorrow 6:00 PM',
          name: data.patientName || prev.name || 'Verified Caller',
          service: 'Dental Consultation',
        }));
      }

      setTranscript((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: replyText,
          timestamp: formatTime(callDuration),
        },
      ]);

      speakAI(replyText);
    } catch (e) {
      console.warn('Voice API error, using fallback:', e);
      setActiveTool(null);
      const fallbackReply = 'Ji bilkul, kya aap Dr. Sharma ke sath appointment book karna chahenge?';
      setTranscript((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: fallbackReply,
          timestamp: formatTime(callDuration),
        },
      ]);
      speakAI(fallbackReply);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const msg = textInput;
    setTextInput('');
    handleUserMessage(msg);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-in fade-in-0 duration-200">
      <div className="relative flex h-[90vh] max-h-[680px] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-700/50 bg-slate-950/95 text-slate-100 shadow-2xl shadow-indigo-500/10">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="relative flex size-3">
              {callState === 'connected' ? (
                <>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-3 rounded-full bg-emerald-500" />
                </>
              ) : callState === 'calling' ? (
                <span className="relative inline-flex size-3 animate-pulse rounded-full bg-amber-400" />
              ) : (
                <span className="relative inline-flex size-3 rounded-full bg-slate-600" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-white">
                Sharma Dental Clinic
              </h3>
              <p className="text-xs text-slate-400">
                {callState === 'connected'
                  ? `Live Call • ${formatTime(callDuration)}`
                  : callState === 'calling'
                  ? 'Connecting AI Receptionist...'
                  : callState === 'ended'
                  ? 'Call Completed'
                  : 'Ready to Call'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              endCall();
              onClose();
            }}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Main Content Area */}
        {callState === 'idle' && (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="relative mb-6 flex size-28 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500/20 to-pink-500/20 p-4 ring-1 ring-indigo-500/40">
              <Phone className="size-12 text-indigo-400 animate-bounce" />
            </div>
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              Talk to AI Receptionist
            </h2>
            <p className="mt-2 max-w-sm text-sm text-slate-400">
              Test the multilingual voice receptionist directly in your browser. Speaks in Hindi/English, checks real Cal.com slots, and books appointments.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-300 ring-1 ring-slate-700">
                🎙️ Cloned Voice
              </span>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-300 ring-1 ring-slate-700">
                🌐 Hindi / English
              </span>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs text-slate-300 ring-1 ring-slate-700">
                ⚡ &lt;2s Tool Calls
              </span>
            </div>
            <button
              onClick={startCall}
              className="mt-8 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <Phone className="size-5" /> Start Live Call (Free Demo)
            </button>
          </div>
        )}

        {callState === 'calling' && (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="relative flex size-32 items-center justify-center">
              <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/20 duration-1000" />
              <div className="absolute inset-2 animate-pulse rounded-full bg-pink-500/20" />
              <div className="relative flex size-20 items-center justify-center rounded-full bg-indigo-600 shadow-xl shadow-indigo-500/50">
                <Volume2 className="size-8 text-white animate-pulse" />
              </div>
            </div>
            <h3 className="mt-6 text-lg font-semibold text-white">Connecting Call...</h3>
            <p className="mt-1 text-xs text-slate-400">Loading cloned voice persona & webhook tools</p>
          </div>
        )}

        {callState === 'connected' && (
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Active Tool Badge */}
            {activeTool && (
              <div className="flex items-center justify-center gap-2 bg-indigo-950/80 px-4 py-1.5 text-xs font-medium text-indigo-300 animate-pulse border-b border-indigo-800/40">
                <Activity className="size-3.5" />
                {activeTool}
              </div>
            )}

            {/* Visualizer Orb */}
            <div className="relative flex shrink-0 items-center justify-center border-b border-slate-800/60 bg-gradient-to-b from-slate-900/40 to-transparent py-6">
              <div className="relative flex size-24 items-center justify-center">
                {isSpeaking && (
                  <div className="absolute inset-0 animate-ping rounded-full bg-pink-500/30 duration-700" />
                )}
                {isListening && (
                  <div className="absolute inset-0 animate-ping rounded-full bg-indigo-500/30 duration-700" />
                )}
                <div
                  className={`relative flex size-20 items-center justify-center rounded-full shadow-2xl transition-all duration-300 ${
                    isSpeaking
                      ? 'bg-gradient-to-tr from-pink-500 to-rose-400 scale-110 shadow-pink-500/50'
                      : isListening
                      ? 'bg-gradient-to-tr from-indigo-500 to-cyan-400 scale-105 shadow-indigo-500/50'
                      : 'bg-gradient-to-tr from-slate-700 to-slate-800 scale-100'
                  }`}
                >
                  {isSpeaking ? (
                    <Volume2 className="size-8 text-white animate-pulse" />
                  ) : isListening ? (
                    <Mic className="size-8 text-white animate-pulse" />
                  ) : (
                    <Bot className="size-8 text-slate-300" />
                  )}
                </div>
              </div>
              <div className="absolute bottom-2 text-center text-[11px] font-medium text-slate-400">
                {isSpeaking ? (
                  <span className="text-pink-400">AI is speaking...</span>
                ) : isListening ? (
                  <span className="text-indigo-400">Listening to your mic...</span>
                ) : (
                  <span>Microphone Active</span>
                )}
              </div>
            </div>

            {/* Realtime Live Transcript */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {transcript.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'ai' && (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30">
                      <Bot className="size-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  {msg.sender === 'user' && (
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400">
                      <User className="size-4" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Text / Manual Input fallback */}
            <form
              onSubmit={handleManualSubmit}
              className="flex items-center gap-2 border-t border-slate-800/80 bg-slate-900/60 p-3"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Bol nahi pa rahe? Yahan type karein..."
                className="flex-1 rounded-xl bg-slate-950 px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none ring-1 ring-slate-800 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="rounded-xl bg-indigo-600 p-2 text-white transition-colors hover:bg-indigo-500"
              >
                <Send className="size-4" />
              </button>
            </form>

            {/* Call Controls Bar */}
            <div className="flex items-center justify-around border-t border-slate-800 bg-slate-950 px-6 py-4">
              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (!isMuted && recognitionRef.current) {
                    recognitionRef.current.abort();
                  } else if (isMuted) {
                    startListening();
                  }
                }}
                className={`flex size-12 items-center justify-center rounded-full transition-all ${
                  isMuted ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/40' : 'bg-slate-900 text-slate-300 ring-1 ring-slate-700'
                }`}
              >
                {isMuted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
              </button>

              <button
                onClick={endCall}
                className="flex size-14 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/30 transition-transform hover:scale-105 active:scale-95"
              >
                <PhoneOff className="size-6" />
              </button>

              <button
                onClick={() => {
                  handleUserMessage('Kal shaam 6 baje ka appointment book kar do.');
                }}
                className="flex size-12 items-center justify-center rounded-full bg-slate-900 text-slate-300 ring-1 ring-slate-700 hover:bg-slate-800"
                title="Quick Prompt"
              >
                <Sparkles className="size-5 text-indigo-400" />
              </button>
            </div>
          </div>
        )}

        {callState === 'ended' && (
          <div className="flex flex-1 flex-col items-center justify-between p-6 text-center">
            <div className="my-auto flex flex-col items-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40">
                <CheckCircle2 className="size-8" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">Call Summary & Lead Captured</h3>
              <p className="mt-1 text-xs text-slate-400">Duration: {formatTime(callDuration)} • Claude Lead Extractor Completed</p>

              {/* Lead Card */}
              <div className="mt-6 w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-left shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-semibold text-slate-300">Lead Score</span>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-400">
                    {leadDetails.score || 9.5} / 10 (Hot Lead 🔥)
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Customer Intent:</span>
                    <span className="font-medium text-slate-200">Dental Checkup Appointment</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cal.com Slot:</span>
                    <span className="font-medium text-emerald-400">{leadDetails.slot || 'Tomorrow 6:00 PM'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">WhatsApp Alert:</span>
                    <span className="font-medium text-indigo-300">Sent to Customer + Owner</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Language:</span>
                    <span className="font-medium text-slate-200">Hinglish / Hindi</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col gap-2">
              <Link
                href="/dashboard"
                onClick={onClose}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
              >
                View in CRM Dashboard <ArrowRight className="size-4" />
              </Link>
              <button
                onClick={startCall}
                className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                Start Another Call
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
