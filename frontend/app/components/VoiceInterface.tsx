"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mic, MicOff, Send, Volume2 } from "lucide-react";
import ReactiveOrb from "./ReactiveOrb";
import Waveform from "./Waveform";

interface VoiceInterfaceProps {
  agent: "mika" | "bheema" | null;
  onClose: () => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const agentConfig = {
  mika: {
    name: "Mika",
    color: "#a78bfa",
    greeting:
      "Hey! I'm Mika, your nutrition assistant. Ask me anything about meals, macros, or diet plans.",
    mockResponses: [
      "Great question! For muscle building, aim for about 1.6-2.2g of protein per kg of bodyweight daily. Chicken, fish, eggs, and legumes are excellent sources.",
      "I'd suggest a balanced meal plan with 40% carbs, 30% protein, and 30% healthy fats. Want me to break that down further?",
      "Hydration is key! Aim for at least 3 liters of water daily, more if you're training intensely.",
    ],
  },
  bheema: {
    name: "Bheema",
    color: "#fb923c",
    greeting:
      "I'm Bheema, your personal trainer. Press the mic and tell me your fitness goals.",
    mockResponses: [
      "Based on your goals, I'd recommend a push-pull-legs split, training 4 days a week. Let me design the first week for you.",
      "Great form tip: when squatting, focus on pushing your knees out over your toes and keeping your chest up. This protects your lower back.",
      "For your recovery, I recommend 48 hours between training the same muscle group. Active recovery like walking or light yoga can help.",
    ],
  },
};

const overlayVariants = {
  hidden: { opacity: 0, y: "3%", scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0,
    y: "3%",
    scale: 0.98,
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] as const },
  },
};

export default function VoiceInterface({
  agent,
  onClose,
}: VoiceInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const responseIndex = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const config = agent ? agentConfig[agent] : null;
  const isMika = agent === "mika";

  // Stop Lenis when overlay is open so inner scroll works
  useEffect(() => {
    if (!agent) return;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [agent]);

  useEffect(() => {
    if (agent && config) {
      setMessages([{ role: "assistant", content: config.greeting }]);
      responseIndex.current = 0;
      setTranscript("");
      setIsListening(false);
      setIsProcessing(false);
      setInput("");
    }
  }, [agent, config]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const getMockResponse = useCallback(() => {
    if (!config) return "";
    const resp =
      config.mockResponses[responseIndex.current % config.mockResponses.length];
    responseIndex.current++;
    return resp;
  }, [config]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setInput("");
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: getMockResponse() },
        ]);
      }, 1200);
    },
    [getMockResponse]
  );

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (transcript) {
        sendMessage(transcript);
        setTranscript("");
      }
    } else {
      setIsListening(true);
      setTranscript("");
      const mockPhrases = [
        "What workout should I do today",
        "How many sets for hypertrophy",
        "Design me a full body routine",
      ];
      const phrase =
        mockPhrases[responseIndex.current % mockPhrases.length];
      let i = 0;
      intervalRef.current = setInterval(() => {
        if (i < phrase.length) {
          setTranscript(phrase.slice(0, i + 1));
          i++;
        } else {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, 50);
    }
  };

  return (
    <AnimatePresence>
      {agent && (
        <m.div
          key="voice-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col"
          // Stop wheel events from reaching Lenis
          onWheel={(e) => e.stopPropagation()}
        >
          {/* ── Header ── */}
          <m.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0"
          >
            <div className="flex items-center gap-4">
              <m.button
                whileHover={{ scale: 1.1, x: -2 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-white/50 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </m.button>
              <div className="flex items-center gap-3">
                <m.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`w-2.5 h-2.5 rounded-full ${isMika ? "bg-violet-400" : "bg-orange-400"}`}
                />
                <span className="font-semibold">{config?.name}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${isMika ? "bg-violet-400/10 text-violet-400" : "bg-orange-400/10 text-orange-400"}`}
                >
                  {isMika ? "Chat" : "Voice"} Mode
                </span>
              </div>
            </div>
            <m.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="px-4 py-1.5 rounded-full text-xs border border-white/10 hover:border-white/20 text-white/40 hover:text-white transition-all"
            >
              Back to Home
            </m.button>
          </m.div>

          {isMika ? (
            /* ══════════ MIKA: Chat ══════════ */
            <>
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-6 py-6"
                style={{ overscrollBehavior: "contain" }}
              >
                <div className="max-w-2xl mx-auto space-y-4">
                  {messages.map((msg, i) => (
                    <m.div
                      key={i}
                      initial={{ opacity: 0, y: 14, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        duration: 0.35,
                        ease: [0.16, 1, 0.3, 1] as const,
                      }}
                      className={`flex ${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-white/10 text-white rounded-br-md"
                            : "bg-violet-400/10 text-violet-50 border border-violet-400/10 rounded-bl-md"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </m.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="px-6 py-5 border-t border-white/5 bg-[#0a0a0a] shrink-0"
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage(input);
                  }}
                  className="flex items-center gap-3 max-w-2xl mx-auto"
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask Mika about nutrition..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-400/40 focus:bg-white/[0.07] transition-all"
                    autoFocus
                  />
                  <m.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                    className="p-3.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white transition-all shadow-[0_0_20px_rgba(167,139,250,0.25)]"
                  >
                    <Send className="w-4 h-4" />
                  </m.button>
                </form>
              </m.div>
            </>
          ) : (
            /* ══════════ BHEEMA: Voice ══════════ */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Center: orb + waveform + controls */}
              <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
                {/* Radial background glow */}
                <m.div
                  className="absolute inset-0 pointer-events-none"
                  animate={{
                    opacity: isListening ? 1 : 0.4,
                  }}
                  transition={{ duration: 0.8 }}
                  style={{
                    background:
                      "radial-gradient(ellipse 60% 50% at center, rgba(251,146,60,0.06) 0%, transparent 70%)",
                  }}
                />

                {/* Orb with scale animation on state change */}
                <m.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{
                    opacity: 1,
                    scale: isListening ? 1.08 : 1,
                  }}
                  transition={{
                    opacity: { delay: 0.2, duration: 0.6 },
                    scale: {
                      type: "spring",
                      stiffness: 120,
                      damping: 15,
                    },
                  }}
                >
                  <ReactiveOrb
                    color="#fb923c"
                    isActive={isListening}
                    size={300}
                  />
                </m.div>

                {/* Waveform — wider and taller */}
                <m.div
                  initial={{ opacity: 0, scaleX: 0.6 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="-mt-2"
                >
                  <Waveform
                    isActive={isListening}
                    color="#fb923c"
                    width={360}
                    height={80}
                  />
                </m.div>

                {/* Status + transcript */}
                <div className="h-14 flex flex-col items-center justify-center mt-1">
                  <AnimatePresence mode="wait">
                    {transcript ? (
                      <m.p
                        key="transcript"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="text-sm text-white/50 text-center max-w-md"
                      >
                        &ldquo;{transcript}
                        <m.span
                          animate={{ opacity: [1, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className="inline-block w-0.5 h-4 bg-orange-400 ml-0.5 align-middle"
                        />
                        &rdquo;
                      </m.p>
                    ) : isProcessing ? (
                      <m.div
                        key="processing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2 text-xs text-orange-400/60"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Bheema is thinking...</span>
                        <m.span
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          ...
                        </m.span>
                      </m.div>
                    ) : isListening ? (
                      <m.p
                        key="listening"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-orange-400/50"
                      >
                        Listening...
                      </m.p>
                    ) : (
                      <m.p
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-xs text-white/20"
                      >
                        Ready
                      </m.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mic button */}
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="flex flex-col items-center gap-3 mt-2"
                >
                  <m.button
                    onClick={toggleListening}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.88 }}
                    animate={{
                      scale: isListening ? [1, 1.04, 1] : 1,
                    }}
                    transition={
                      isListening
                        ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                        : {}
                    }
                    className={`relative rounded-full flex items-center justify-center transition-all duration-300 ${
                      isListening
                        ? "bg-orange-500 mic-pulse shadow-[0_0_50px_rgba(251,146,60,0.4)]"
                        : "bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 hover:border-orange-400/30"
                    }`}
                    style={{ width: 68, height: 68 }}
                  >
                    <AnimatePresence mode="wait">
                      {isListening ? (
                        <m.div
                          key="off"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <MicOff className="w-6 h-6 text-white" />
                        </m.div>
                      ) : (
                        <m.div
                          key="on"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.5, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Mic className="w-6 h-6 text-orange-400" />
                        </m.div>
                      )}
                    </AnimatePresence>
                  </m.button>
                  <p className="text-[11px] text-white/20">
                    {isListening ? "Tap to stop" : "Tap to speak"}
                  </p>
                </m.div>
              </div>

              {/* Messages at bottom */}
              {messages.length > 1 && (
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="shrink-0 px-6 py-4 border-t border-white/5 max-h-56 overflow-y-auto"
                  style={{ overscrollBehavior: "contain" }}
                >
                  <div className="max-w-2xl mx-auto space-y-3">
                    {messages.slice(1).map((msg, i) => (
                      <m.div
                        key={i}
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          duration: 0.3,
                          ease: [0.16, 1, 0.3, 1] as const,
                        }}
                        className={`flex ${
                          msg.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-white/10 text-white rounded-br-md"
                              : "bg-orange-400/10 text-orange-50 border border-orange-400/10 rounded-bl-md"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </m.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </m.div>
              )}
            </div>
          )}
        </m.div>
      )}
    </AnimatePresence>
  );
}
