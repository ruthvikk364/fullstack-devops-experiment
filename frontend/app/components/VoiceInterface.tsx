"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Mic, MicOff, Send, Volume2, Camera, CameraOff,
  MessageSquare, Download, User, Activity, Mail,
} from "lucide-react";
import ReactiveOrb from "./ReactiveOrb";
import Waveform from "./Waveform";

const API_BASE = process.env.NEXT_PUBLIC_FASTAPI_API || "http://localhost:8080/api";
const WS_BASE = API_BASE.replace(/^http/, "ws").replace(/\/api$/, "/api");

interface CardRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface VoiceInterfaceProps {
  agent: "mika" | "bheema" | null;
  onClose: () => void;
  cardRect?: CardRect;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

interface ProfileData {
  user_id: string;
  name: string;
  email: string;
  weight_kg: number;
  height_cm: number;
  target_weight_kg: number;
  fitness_goal: string;
  diet_preference: string;
  bmi: {
    bmi_value: number;
    category: string;
    daily_calories: number;
    daily_protein_g: number;
    daily_carbs_g: number;
    daily_fat_g: number;
    strategy: string;
  } | null;
  pdf_available: boolean;
}

// ─── Audio helpers ───────────────────────────────────────────────
function floatTo16BitPCM(float32: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(float32.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}

function base64EncodeAudio(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64DecodeAudio(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Int16Array(bytes.buffer);
}

// ─── Whisper hallucination filter ────────────────────────────────
const THINKING_SOUNDS = new Set([
  "hmm","hmmm","um","umm","ummm","uh","uhh","ah","ahh","oh","ohh",
  "huh","mhm","mhmm","mm","mmm","mmmm","er","err","erm",
]);
const NOISE_PHRASES = new Set([
  "bye","bye.","bye-bye","bye bye","the","a","i","you","hey","so","and",
  "thank you","thanks","ok","okay","thank you for watching","thanks for watching",
]);
const HALLUCINATION_PATTERNS = [
  /^(thank(s| you)( for (watching|listening))?)\.?$/i,
  /subscri(be|ption)/i, /see you (next|in the)/i,
];

function isNoiseTranscript(text: string, durationMs: number): boolean {
  if (!text || text.length < 2) return true;
  const nonLatin = (text.replace(/[\x00-\x7F]/g, "").length) / text.length;
  if (nonLatin > 0.3) return true;
  const lower = text.toLowerCase().replace(/[.,!?]+$/g, "");
  if (THINKING_SOUNDS.has(lower)) return true;
  if (durationMs < 800 && NOISE_PHRASES.has(lower)) return true;
  if (HALLUCINATION_PATTERNS.some((p) => p.test(text))) return true;
  return false;
}

// Header drops from top
const headerVariants = {
  hidden: { opacity: 0, y: -60, filter: "blur(6px)" },
  visible: {
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0, y: -40, filter: "blur(4px)",
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] as const },
  },
};

// Main body scales up from center
const bodyVariants = {
  hidden: { opacity: 0, scale: 0.85, filter: "blur(8px)" },
  visible: {
    opacity: 1, scale: 1, filter: "blur(0px)",
    transition: { duration: 0.7, delay: 0.45, ease: [0.16, 1, 0.3, 1] as const },
  },
  exit: {
    opacity: 0, scale: 0.9, filter: "blur(6px)",
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] as const },
  },
};

// ─── Profile Cards ───────────────────────────────────────────────
function ProfileCards({ profile }: { profile: ProfileData }) {
  return (
    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      className="max-w-2xl mx-auto mt-6 space-y-4"
    >
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <User className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">{profile.name || "User"}</h3>
            <p className="text-violet-300/60 text-xs">{profile.fitness_goal?.replace("_", " ") || "General fitness"}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-violet-400/50" />
            <span className="text-white/60 truncate">{profile.email || "—"}</span>
          </div>
          <div className="text-white/60">Diet: <span className="text-white/80">{profile.diet_preference || "—"}</span></div>
          <div className="text-white/60">Weight: <span className="text-white/80">{profile.weight_kg ? `${profile.weight_kg} kg` : "—"}</span></div>
          <div className="text-white/60">Target: <span className="text-white/80">{profile.target_weight_kg ? `${profile.target_weight_kg} kg` : "—"}</span></div>
        </div>
      </div>
      {profile.bmi && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Health Analysis</h3>
              <p className="text-emerald-300/60 text-xs">{profile.bmi.strategy}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-black/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">{profile.bmi.bmi_value.toFixed(1)}</p>
              <p className="text-[10px] text-white/40 mt-1">BMI — {profile.bmi.category}</p>
            </div>
            <div className="bg-black/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-orange-400">{profile.bmi.daily_calories}</p>
              <p className="text-[10px] text-white/40 mt-1">Daily Calories</p>
            </div>
            <div className="bg-black/20 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{profile.bmi.daily_protein_g}g</p>
              <p className="text-[10px] text-white/40 mt-1">Protein</p>
            </div>
            <div className="bg-black/20 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-yellow-400">{profile.bmi.daily_carbs_g}g / {profile.bmi.daily_fat_g}g</p>
              <p className="text-[10px] text-white/40 mt-1">Carbs / Fat</p>
            </div>
          </div>
        </div>
      )}
      {profile.pdf_available && (
        <m.button
          onClick={() => window.open(`${API_BASE}/onboarding/pdf/${profile.user_id}`, "_blank")}
          whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-violet-600/20 to-emerald-600/20 border border-violet-500/20 rounded-2xl p-5 flex items-center gap-4 text-left hover:border-violet-400/40 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/30 transition-colors">
            <Download className="w-6 h-6 text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">Download Fitness Plan PDF</h3>
            <p className="text-white/40 text-xs mt-0.5">Your personalized workout & nutrition plan</p>
          </div>
          <span className="text-violet-400 text-sm font-medium">Download</span>
        </m.button>
      )}
    </m.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
const TRANSITION_TYPES = ["morph", "tunnel", "shatter", "liquid", "flip", "blinds", "gravity"] as const;
type TransitionType = typeof TRANSITION_TYPES[number];

let transitionIndex = 0;
function getNextTransition(): TransitionType {
  const t = TRANSITION_TYPES[transitionIndex % TRANSITION_TYPES.length];
  transitionIndex++;
  return t;
}

export default function VoiceInterface({ agent, onClose, cardRect }: VoiceInterfaceProps) {
  const rect = cardRect ?? { x: typeof window !== "undefined" ? window.innerWidth / 2 - 150 : 350, y: typeof window !== "undefined" ? window.innerHeight / 2 - 200 : 200, width: 300, height: 400 };
  const origin = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  const [transitionType, setTransitionType] = useState<TransitionType>("morph");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [mikaMode, setMikaMode] = useState<"chat" | "voice">("chat");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [agentTranscript, setAgentTranscript] = useState("");
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [voiceConnected, setVoiceConnected] = useState(false);

  // Bheema state
  const [cameraActive, setCameraActive] = useState(false);
  const [repInfo, setRepInfo] = useState<{ reps: number; target: number; sets: number; targetSets: number } | null>(null);

  // Refs
  const sessionIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micSinkRef = useRef<GainNode | null>(null);
  const nextPlayTimeRef = useRef(0);
  const speechStartRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Bheema refs
  const visionWsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const visionIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const isMika = agent === "mika";

  useEffect(() => {
    if (!agent) return;
    setTransitionType(getNextTransition());
    document.documentElement.style.overflow = "hidden";
    return () => { document.documentElement.style.overflow = ""; };
  }, [agent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, agentTranscript]);

  // ─── Gapless audio playback ────────────────────────────────────
  const playAudioChunk = useCallback((pcm16: Int16Array) => {
    const ctx = audioContextRef.current;
    const gainNode = gainNodeRef.current;
    if (!ctx || !gainNode) return;
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 32768;
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.copyToChannel(float32, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(gainNode);
    const now = ctx.currentTime;
    if (nextPlayTimeRef.current < now - 0.1) nextPlayTimeRef.current = now + 0.05;
    const startTime = Math.max(now, nextPlayTimeRef.current);
    source.start(startTime);
    nextPlayTimeRef.current = startTime + buffer.duration;
  }, []);

  // ─── Voice cleanup ─────────────────────────────────────────────
  const disconnectVoice = useCallback(() => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (micSinkRef.current) { micSinkRef.current.disconnect(); micSinkRef.current = null; }
    if (sourceRef.current) { sourceRef.current.disconnect(); sourceRef.current = null; }
    if (mediaStreamRef.current) { mediaStreamRef.current.getTracks().forEach(t => t.stop()); mediaStreamRef.current = null; }
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    gainNodeRef.current = null;
    nextPlayTimeRef.current = 0;
    setVoiceConnected(false);
    setIsAgentSpeaking(false);
    setIsUserSpeaking(false);
    setAgentTranscript("");
  }, []);

  const cleanup = useCallback(() => {
    disconnectVoice();
    if (visionWsRef.current) { try { visionWsRef.current.send(JSON.stringify({ type: "stop" })); } catch {} visionWsRef.current.close(); visionWsRef.current = null; }
    if (visionIntervalRef.current) { clearInterval(visionIntervalRef.current); visionIntervalRef.current = undefined; }
    if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach(t => t.stop()); cameraStreamRef.current = null; }
    setCameraActive(false);
    setRepInfo(null);
  }, [disconnectVoice]);

  // ─── Fetch profile ─────────────────────────────────────────────
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const resp = await fetch(`${API_BASE}/onboarding/profile/${userId}`);
      if (resp.ok) setProfileData(await resp.json());
    } catch {}
  }, []);

  // ─── Save voice transcript to backend ──────────────────────────
  const saveVoiceTranscript = useCallback(async (userText: string, assistantText: string) => {
    if (!sessionIdRef.current || !userIdRef.current) return;
    try {
      const resp = await fetch(`${API_BASE}/onboarding/voice-transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          user_id: userIdRef.current,
          user_text: userText,
          assistant_text: assistantText,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.onboarding_complete) {
          setOnboardingComplete(true);
          setMessages(prev => [...prev, {
            id: `sys-${Date.now()}`, role: "system",
            content: data.plan_generated
              ? "Your fitness plan has been generated and emailed!"
              : "Onboarding complete! Plan is being processed...",
          }]);
          if (userIdRef.current) fetchProfile(userIdRef.current);
        }
      }
    } catch {}
  }, [fetchProfile]);

  // ─── Init on agent change ─────────────────────────────────────
  useEffect(() => {
    if (!agent) { cleanup(); return; }
    setMessages([]);
    setInput("");
    setIsProcessing(false);
    setOnboardingComplete(false);
    setStatusText("");
    setProfileData(null);
    setMikaMode("chat");
    setAgentTranscript("");
    setVoiceConnected(false);
    sessionIdRef.current = null;
    userIdRef.current = null;

    if (agent === "mika") initMika();
    else if (agent === "bheema") {
      setMessages([{ id: "greeting", role: "assistant", content: "I'm Bheema, your personal trainer. Press the mic button to start talking with me." }]);
    }
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent]);

  // ─── MIKA: Init session ────────────────────────────────────────
  async function initMika() {
    setIsProcessing(true);
    setStatusText("Connecting to Mika...");
    try {
      const resp = await fetch(`${API_BASE}/onboarding/start`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      sessionIdRef.current = data.session_id;
      userIdRef.current = data.user_id;
      setMessages([{ id: "greeting", role: "assistant", content: data.message }]);
      setStatusText("Online");
    } catch (e: any) {
      setMessages([{ id: "err", role: "system", content: `Could not connect. Make sure backend is running. (${e.message})` }]);
      setStatusText("Connection failed");
    } finally {
      setIsProcessing(false);
    }
  }

  // ─── MIKA: Send chat message ───────────────────────────────────
  const sendMikaMessage = useCallback(async (text: string) => {
    if (!text.trim() || !sessionIdRef.current || onboardingComplete) return;

    // If voice is connected, send as text through the WS
    if (voiceConnected && wsRef.current?.readyState === WebSocket.OPEN) {
      setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: "user", content: text }]);
      setInput("");
      wsRef.current.send(JSON.stringify({
        type: "conversation.item.create",
        item: { type: "message", role: "user", content: [{ type: "input_text", text }] },
      }));
      wsRef.current.send(JSON.stringify({ type: "response.create" }));
      return;
    }

    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: "user", content: text }]);
    setInput("");
    setIsProcessing(true);
    try {
      const resp = await fetch(`${API_BASE}/onboarding/answer`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionIdRef.current, message: text }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: data.message }]);
      if (data.onboarding_complete) {
        setOnboardingComplete(true);
        setMessages(prev => [...prev, { id: `sys-${Date.now()}`, role: "system",
          content: data.plan_generated ? "Your fitness plan has been generated and emailed!" : "Onboarding complete! Plan is being processed..." }]);
        if (userIdRef.current) fetchProfile(userIdRef.current);
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "system", content: `Network error: ${e.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  }, [onboardingComplete, voiceConnected, fetchProfile]);

  // ─── MIKA: Connect voice (direct to OpenAI, iSureTech pattern) ─
  const connectMikaVoice = useCallback(async () => {
    setStatusText("Connecting voice...");
    try {
      // 1. Get ephemeral key
      const tokenRes = await fetch("/api/mika-realtime", { method: "POST" });
      if (!tokenRes.ok) throw new Error(`Token fetch failed: ${tokenRes.status}`);
      const tokenData = await tokenRes.json();
      const ephemeralKey = tokenData.client_secret?.value;
      if (!ephemeralKey) throw new Error("No ephemeral key");

      // 2. Create AudioContext + gapless playback chain
      const ctx = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = ctx;
      const gainNode = ctx.createGain();
      gainNode.gain.value = 1.0;
      gainNodeRef.current = gainNode;
      gainNode.connect(ctx.destination);
      nextPlayTimeRef.current = 0;

      // 3. Open direct WS to OpenAI
      const ws = new WebSocket(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17",
        ["realtime", `openai-insecure-api-key.${ephemeralKey}`, "openai-beta.realtime-v1"]
      );
      wsRef.current = ws;

      // Accumulate assistant transcript per response
      let currentAssistantText = "";
      let lastUserText = "";

      ws.onopen = async () => {
        setVoiceConnected(true);
        setStatusText("Connected! Mika is listening.");

        // Replay existing messages for context
        const currentMessages = messages.filter(m => m.role === "user" || m.role === "assistant");
        if (currentMessages.length > 0) {
          for (const msg of currentMessages) {
            ws.send(JSON.stringify({
              type: "conversation.item.create",
              item: {
                type: "message", role: msg.role === "user" ? "user" : "assistant",
                content: [{ type: msg.role === "user" ? "input_text" : "text", text: msg.content }],
              },
            }));
          }
          ws.send(JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "message", role: "user",
              content: [{ type: "input_text", text: "[Voice mode activated. Continue the conversation where you left off. Do NOT re-greet or re-ask questions already answered. Keep responses short.]" }],
            },
          }));
          ws.send(JSON.stringify({ type: "response.create" }));
        } else {
          ws.send(JSON.stringify({ type: "response.create" }));
        }

        // 4. Start mic capture with SILENT SINK (no echo!)
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { sampleRate: 24000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
          });
          mediaStreamRef.current = stream;
          const source = ctx.createMediaStreamSource(stream);
          sourceRef.current = source;
          const processor = ctx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const ratio = ctx.sampleRate / 24000;
            const outputLength = Math.floor(inputData.length / ratio);
            const output = new Float32Array(outputLength);
            for (let i = 0; i < outputLength; i++) output[i] = inputData[Math.floor(i * ratio)];
            const pcm16 = floatTo16BitPCM(output);
            wsRef.current.send(JSON.stringify({ type: "input_audio_buffer.append", audio: base64EncodeAudio(pcm16) }));
          };

          source.connect(processor);
          // SILENT SINK — prevents mic audio from playing through speakers (echo)
          const micSink = ctx.createGain();
          micSink.gain.value = 0;
          micSink.connect(ctx.destination);
          micSinkRef.current = micSink;
          processor.connect(micSink);
        } catch (e: any) {
          setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "system", content: `Mic access denied: ${e.message}` }]);
        }
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "input_audio_buffer.speech_started":
            setIsUserSpeaking(true);
            speechStartRef.current = Date.now();
            break;

          case "input_audio_buffer.speech_stopped":
            setIsUserSpeaking(false);
            break;

          case "conversation.item.input_audio_transcription.completed": {
            const transcript = (data.transcript || "").trim();
            const duration = Date.now() - speechStartRef.current;
            if (isNoiseTranscript(transcript, duration)) break;
            setIsUserSpeaking(false);
            lastUserText = transcript;
            setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: "user", content: transcript }]);
            break;
          }

          case "response.audio_transcript.delta":
            if (data.delta) {
              currentAssistantText += data.delta;
              setAgentTranscript(currentAssistantText);
            }
            break;

          case "response.audio_transcript.done":
            if (data.transcript) {
              const finalText = data.transcript.trim();
              setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: "assistant", content: finalText }]);
              setAgentTranscript("");
              // Save to backend DB + check profile completion
              saveVoiceTranscript(lastUserText, finalText);
              currentAssistantText = "";
              lastUserText = "";
            }
            break;

          case "response.audio.delta":
            if (data.delta) {
              setIsAgentSpeaking(true);
              playAudioChunk(base64DecodeAudio(data.delta));
            }
            break;

          case "response.audio.done":
            setIsAgentSpeaking(false);
            break;

          case "error":
            console.error("OpenAI Realtime error:", data.error);
            setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "system", content: `Voice error: ${data.error?.message || "Unknown"}` }]);
            break;
        }
      };

      ws.onerror = () => {
        setStatusText("Connection error");
        setVoiceConnected(false);
      };

      ws.onclose = () => {
        setStatusText(mikaMode === "voice" ? "Disconnected" : "Chat mode");
        setVoiceConnected(false);
        setIsAgentSpeaking(false);
      };
    } catch (e: any) {
      setStatusText("Connection failed");
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "system", content: `Voice connection failed: ${e.message}` }]);
    }
  }, [messages, mikaMode, playAudioChunk, saveVoiceTranscript]);

  // ─── MIKA: Toggle mode ─────────────────────────────────────────
  const toggleMikaMode = useCallback(() => {
    if (onboardingComplete) return;
    if (mikaMode === "chat") {
      setMikaMode("voice");
      connectMikaVoice();
    } else {
      disconnectVoice();
      setMikaMode("chat");
      setStatusText("Chat mode");
    }
  }, [mikaMode, onboardingComplete, connectMikaVoice, disconnectVoice]);

  // ─── BHEEMA: Connect voice (backend relay) ─────────────────────
  const connectBheemaVoice = useCallback(async () => {
    const sid = "bheema-" + Date.now();
    setStatusText("Connecting to Coach Bheema...");
    const ws = new WebSocket(`${WS_BASE}/realtime/ws/${sid}`);
    wsRef.current = ws;

    const ctx = new AudioContext({ sampleRate: 24000 });
    audioContextRef.current = ctx;
    const gainNode = ctx.createGain();
    gainNode.gain.value = 1.0;
    gainNodeRef.current = gainNode;
    gainNode.connect(ctx.destination);
    nextPlayTimeRef.current = 0;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "config", user_id: userIdRef.current || "", vision_session_id: sid }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case "audio":
            playAudioChunk(base64DecodeAudio(msg.data));
            break;
          case "transcript":
            if (msg.role === "assistant" && msg.text) {
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && !last.content.startsWith("I'm Bheema"))
                  return [...prev.slice(0, -1), { ...last, content: last.content + msg.text }];
                return [...prev, { id: `a-${Date.now()}`, role: "assistant", content: msg.text }];
              });
            }
            break;
          case "user_transcript":
            if (msg.text) setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: "user", content: msg.text }]);
            break;
          case "status":
            setStatusText(msg.message || "");
            break;
          case "rep_sync":
            setRepInfo({ reps: msg.reps || 0, target: msg.target_reps || 0, sets: msg.sets_completed || 0, targetSets: msg.target_sets || 0 });
            break;
          case "error":
            setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "system", content: `Error: ${msg.message}` }]);
            break;
        }
      } catch {}
    };

    ws.onerror = () => { setStatusText("Connection error"); };
    ws.onclose = () => { setStatusText("Disconnected"); setVoiceConnected(false); };

    // Mic with silent sink
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      mediaStreamRef.current = stream;
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const ratio = ctx.sampleRate / 24000;
        const len = Math.floor(inputData.length / ratio);
        const out = new Float32Array(len);
        for (let i = 0; i < len; i++) out[i] = inputData[Math.floor(i * ratio)];
        wsRef.current.send(JSON.stringify({ type: "audio", data: base64EncodeAudio(floatTo16BitPCM(out)) }));
      };
      source.connect(processor);
      const micSink = ctx.createGain();
      micSink.gain.value = 0;
      micSink.connect(ctx.destination);
      micSinkRef.current = micSink;
      processor.connect(micSink);
      setVoiceConnected(true);
      setStatusText("Connected! Coach Bheema is ready.");
    } catch (e: any) {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "system", content: `Mic denied: ${e.message}` }]);
    }
  }, [playAudioChunk]);

  const toggleBheemaVoice = useCallback(() => {
    if (voiceConnected) { disconnectVoice(); setStatusText("Disconnected"); }
    else connectBheemaVoice();
  }, [voiceConnected, disconnectVoice, connectBheemaVoice]);

  // ─── BHEEMA: Camera ────────────────────────────────────────────
  const toggleCamera = useCallback(async () => {
    if (cameraActive) {
      if (visionIntervalRef.current) { clearInterval(visionIntervalRef.current); visionIntervalRef.current = undefined; }
      if (visionWsRef.current) { try { visionWsRef.current.send(JSON.stringify({ type: "stop" })); } catch {} visionWsRef.current.close(); visionWsRef.current = null; }
      if (cameraStreamRef.current) { cameraStreamRef.current.getTracks().forEach(t => t.stop()); cameraStreamRef.current = null; }
      setCameraActive(false); setRepInfo(null); return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } });
      cameraStreamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      const vsid = "vision-" + Date.now();
      const vws = new WebSocket(`${WS_BASE}/vision/ws/${vsid}`);
      visionWsRef.current = vws;
      vws.onopen = () => {
        vws.send(JSON.stringify({ type: "start", exercise: "squat", target_reps: 10, target_sets: 3 }));
        visionIntervalRef.current = setInterval(() => {
          if (!canvasRef.current || !videoRef.current || !visionWsRef.current || visionWsRef.current.readyState !== WebSocket.OPEN) return;
          const c = canvasRef.current; c.width = 640; c.height = 480;
          const cx = c.getContext("2d"); if (!cx) return;
          cx.drawImage(videoRef.current, 0, 0, 640, 480);
          visionWsRef.current!.send(JSON.stringify({ type: "frame", data: c.toDataURL("image/jpeg", 0.7).split(",")[1] }));
        }, 100);
      };
      vws.onmessage = (ev) => { try { const m = JSON.parse(ev.data); if (m.type === "rep_update") setRepInfo({ reps: m.reps||0, target: m.target_reps||0, sets: m.sets_completed||0, targetSets: m.target_sets||0 }); } catch {} };
      setCameraActive(true);
    } catch (e: any) {
      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: "system", content: `Camera denied: ${e.message}` }]);
    }
  }, [cameraActive]);

  const handleClose = useCallback(() => { cleanup(); onClose(); }, [cleanup, onClose]);

  // ─── Orb state ─────────────────────────────────────────────────
  const orbActive = isAgentSpeaking || isUserSpeaking || voiceConnected;

  // ═══════════════════════════════════════════════════════════════
  return (
    <AnimatePresence>
      {agent && (
        <>
        {/* ── Transition Layer: Background reveal ── */}
        {transitionType === "morph" && (
          /* Card Morph: starts at card position, morphs to full screen */
          <m.div
            key="morph-bg"
            initial={{
              position: "fixed",
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              borderRadius: 16,
            }}
            animate={{
              left: 0,
              top: 0,
              width: typeof window !== "undefined" ? window.innerWidth : 1920,
              height: typeof window !== "undefined" ? window.innerHeight : 1080,
              borderRadius: 0,
            }}
            exit={{
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              borderRadius: 16,
              opacity: 0,
            }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="z-[100] bg-[#0a0a0a]"
            style={{ position: "fixed" }}
            onWheel={e => e.stopPropagation()}
          />
        )}

        {transitionType === "tunnel" && (
          /* Depth Tunnel: zoom through with perspective */
          <m.div
            key="tunnel-bg"
            initial={{ opacity: 0, scale: 0.1, filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 3, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] bg-[#0a0a0a]"
            style={{ transformOrigin: `${origin.x}px ${origin.y}px`, perspective: 800 }}
            onWheel={e => e.stopPropagation()}
          />
        )}

        {transitionType === "shatter" && (
          /* Shatter: grid of tiles that scatter then reassemble */
          <>
            <m.div
              key="shatter-bg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[99] bg-[#0a0a0a]"
              onWheel={e => e.stopPropagation()}
            />
            {Array.from({ length: 16 }).map((_, i) => {
              const col = i % 4;
              const row = Math.floor(i / 4);
              const vw = typeof window !== "undefined" ? window.innerWidth : 1920;
              const vh = typeof window !== "undefined" ? window.innerHeight : 1080;
              const tileW = vw / 4;
              const tileH = vh / 4;
              // Deterministic pseudo-random based on tile index
              const seed = Math.sin(i * 127.1 + 311.7) * 43758.5453;
              const r1 = seed - Math.floor(seed);
              const seed2 = Math.sin(i * 269.5 + 183.3) * 43758.5453;
              const r2 = seed2 - Math.floor(seed2);
              const dx = (col - 1.5) * 200 + (r1 - 0.5) * 100;
              const dy = (row - 1.5) * 200 + (r2 - 0.5) * 100;
              const rot = (r1 - 0.5) * 60;
              return (
                <m.div
                  key={`shatter-${i}`}
                  initial={{ x: dx, y: dy, rotate: rot, opacity: 0, scale: 0.5 }}
                  animate={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ x: dx * 0.5, y: dy * 0.5, rotate: rot * 0.5, opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.7, delay: i * 0.02, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed z-[100] bg-[#0a0a0a]"
                  style={{
                    left: col * tileW,
                    top: row * tileH,
                    width: tileW + 1,
                    height: tileH + 1,
                  }}
                />
              );
            })}
          </>
        )}

        {transitionType === "liquid" && (
          /* Liquid Morph: organic blob shape expands */
          <m.div
            key="liquid-bg"
            initial={{
              clipPath: `ellipse(5% 8% at ${origin.x}px ${origin.y}px)`,
              opacity: 0.8,
            }}
            animate={{
              clipPath: `ellipse(150% 150% at ${origin.x}px ${origin.y}px)`,
              opacity: 1,
            }}
            exit={{
              clipPath: `ellipse(5% 8% at ${origin.x}px ${origin.y}px)`,
              opacity: 0,
            }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[100] bg-[#0a0a0a]"
            onWheel={e => e.stopPropagation()}
          />
        )}

        {transitionType === "flip" && (
          /* Flip Reveal: 3D flip from card to full screen */
          <m.div
            key="flip-bg"
            initial={{ rotateY: -90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: 90, opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] bg-[#0a0a0a]"
            style={{ transformOrigin: `${origin.x}px ${origin.y}px`, perspective: 1200, transformStyle: "preserve-3d" }}
            onWheel={e => e.stopPropagation()}
          />
        )}

        {transitionType === "blinds" && (
          /* Radial Blinds: strips sweep in from center */
          <>
            {Array.from({ length: 8 }).map((_, i) => {
              const vh = typeof window !== "undefined" ? window.innerHeight : 1080;
              const stripH = vh / 8;
              const fromCenter = Math.abs(i - 3.5);
              return (
                <m.div
                  key={`blind-${i}`}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  exit={{ scaleX: 0 }}
                  transition={{ duration: 0.5, delay: fromCenter * 0.04, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed left-0 right-0 z-[100] bg-[#0a0a0a]"
                  style={{
                    top: i * stripH,
                    height: stripH + 1,
                    transformOrigin: origin.x < (typeof window !== "undefined" ? window.innerWidth / 2 : 960) ? "left" : "right",
                  }}
                />
              );
            })}
          </>
        )}

        {transitionType === "gravity" && (
          /* Gravity Drop: panel drops from top with bounce */
          <m.div
            key="gravity-bg"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[100] bg-[#0a0a0a]"
            onWheel={e => e.stopPropagation()}
          />
        )}

        {/* ── Accent energy layer ── */}
        {[0, 1, 2].map((i) => (
          <m.div
            key={`energy-${i}`}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 3 + i, opacity: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 1, delay: 0.1 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="fixed z-[101] pointer-events-none rounded-full"
            style={{
              left: origin.x - 40,
              top: origin.y - 40,
              width: 80,
              height: 80,
              border: `1.5px solid ${isMika ? "rgba(167,139,250,0.25)" : "rgba(251,146,60,0.25)"}`,
            }}
          />
        ))}

        {/* ── Main content overlay ── */}
        <m.div
          key="voice-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, delay: transitionType === "shatter" ? 0.3 : 0.2 }}
          className="fixed inset-0 z-[102] flex flex-col"
          onWheel={e => e.stopPropagation()}
        >
          {/* Accent glow */}
          <m.div
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 0.15, scale: 2.5 }}
            exit={{ opacity: 0, scale: 0.3 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute pointer-events-none rounded-full"
            style={{
              left: origin.x - 300,
              top: origin.y - 300,
              width: 600,
              height: 600,
              background: `radial-gradient(circle, ${isMika ? "rgba(167,139,250,0.35)" : "rgba(251,146,60,0.35)"}, transparent 70%)`,
            }}
          />

          {/* Header — drops from top */}
          <m.div
            variants={headerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex items-center justify-between px-6 py-4 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-4">
              <m.button whileHover={{ scale: 1.1, x: -2 }} whileTap={{ scale: 0.9 }} onClick={handleClose}
                className="p-2 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-white/50 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </m.button>
              <div className="flex items-center gap-3">
                <m.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity }}
                  className={`w-2.5 h-2.5 rounded-full ${isMika ? "bg-violet-400" : "bg-orange-400"}`} />
                <span className="font-semibold">{isMika ? "Mika" : "Bheema"}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${isMika ? "bg-violet-400/10 text-violet-400" : "bg-orange-400/10 text-orange-400"}`}>
                  {isMika ? (mikaMode === "voice" ? "Voice" : "Chat") : "Voice"} Mode
                </span>
                {statusText && <span className="text-[10px] text-white/30 ml-2">{statusText}</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isMika && !onboardingComplete && (
                <m.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleMikaMode}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition-all ${
                    mikaMode === "voice" ? "border-violet-400/30 bg-violet-400/10 text-violet-400" : "border-white/10 text-white/40 hover:border-violet-400/30 hover:text-violet-400"}`}>
                  {mikaMode === "chat" ? <><Mic className="w-3 h-3" />Voice</> : <><MessageSquare className="w-3 h-3" />Chat</>}
                </m.button>
              )}
              <m.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleClose}
                className="px-4 py-1.5 rounded-full text-xs border border-white/10 hover:border-white/20 text-white/40 hover:text-white transition-all">
                Back to Home
              </m.button>
            </div>
          </m.div>

          {isMika ? (
            mikaMode === "voice" ? (
              /* ── MIKA VOICE ── */
              <m.div variants={bodyVariants} initial="hidden" animate="visible" exit="exit" className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 flex flex-col items-center justify-center relative">
                  <m.div className="absolute inset-0 pointer-events-none" animate={{ opacity: orbActive ? 1 : 0.4 }}
                    style={{ background: "radial-gradient(ellipse 60% 50% at center, rgba(167,139,250,0.06) 0%, transparent 70%)" }} />
                  <m.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: isAgentSpeaking ? 1.12 : isUserSpeaking ? 1.06 : 1 }}
                    transition={{ scale: { type: "spring", stiffness: 120, damping: 15 } }}
                    className="cursor-pointer" onClick={toggleMikaMode} title="Click to switch to chat">
                    <ReactiveOrb color="#a78bfa" isActive={orbActive} size={300} />
                  </m.div>
                  <m.div initial={{ opacity: 0, scaleX: 0.6 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 0.4, duration: 0.5 }} className="-mt-2">
                    <Waveform isActive={orbActive} color="#a78bfa" width={360} height={80} />
                  </m.div>
                  <div className="h-14 flex flex-col items-center justify-center mt-1">
                    <AnimatePresence mode="wait">
                      {isAgentSpeaking && agentTranscript ? (
                        <m.p key="speaking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-sm text-white/60 text-center max-w-md line-clamp-2">
                          {agentTranscript.slice(-120)}
                        </m.p>
                      ) : isUserSpeaking ? (
                        <m.p key="listening" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-xs text-violet-400/50">Listening...</m.p>
                      ) : voiceConnected ? (
                        <m.p key="ready" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-xs text-white/20">Tap orb to switch to chat</m.p>
                      ) : (
                        <m.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-xs text-white/20">Connecting...</m.p>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                {messages.length > 0 && (
                  <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="shrink-0 px-6 py-4 border-t border-white/5 max-h-56 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
                    <div className="max-w-2xl mx-auto space-y-3">
                      {messages.slice(-8).map(msg => (
                        <m.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.role === "user" ? "justify-end" : msg.role === "system" ? "justify-center" : "justify-start"}`}>
                          <div className={`max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            msg.role === "user" ? "bg-white/10 text-white rounded-br-md"
                            : msg.role === "system" ? "bg-emerald-500/10 text-emerald-300/60 text-xs"
                            : "bg-violet-400/10 text-violet-50 border border-violet-400/10 rounded-bl-md"}`}>
                            {msg.content}
                          </div>
                        </m.div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </m.div>
                )}
              </m.div>
            ) : (
              /* ── MIKA CHAT ── */
              <m.div variants={bodyVariants} initial="hidden" animate="visible" exit="exit" className="flex-1 flex flex-col min-h-0">
                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-6" style={{ overscrollBehavior: "contain" }}>
                  <div className="max-w-2xl mx-auto space-y-4">
                    {messages.map(msg => (
                      <m.div key={msg.id} initial={{ opacity: 0, y: 14, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
                        className={`flex ${msg.role === "user" ? "justify-end" : msg.role === "system" ? "justify-center" : "justify-start"}`}>
                        <div className={`max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user" ? "bg-white/10 text-white rounded-br-md"
                          : msg.role === "system" ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-center"
                          : "bg-violet-400/10 text-violet-50 border border-violet-400/10 rounded-bl-md"}`}>
                          {msg.content}
                        </div>
                      </m.div>
                    ))}
                    {isProcessing && (
                      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="bg-violet-400/10 border border-violet-400/10 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-violet-300">
                          <m.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}>Mika is typing...</m.span>
                        </div>
                      </m.div>
                    )}
                    {onboardingComplete && profileData && <ProfileCards profile={profileData} />}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
                <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
                  className="px-6 py-5 border-t border-white/5 bg-[#0a0a0a] shrink-0">
                  <form onSubmit={e => { e.preventDefault(); sendMikaMessage(input); }}
                    className="flex items-center gap-3 max-w-2xl mx-auto">
                    <input type="text" value={input} onChange={e => setInput(e.target.value)}
                      placeholder={onboardingComplete ? "Onboarding complete! Download your plan above." : "Type your message to Mika..."}
                      disabled={isProcessing || onboardingComplete}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-400/40 focus:bg-white/[0.07] transition-all disabled:opacity-40"
                      autoFocus />
                    <m.button type="submit" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.92 }}
                      disabled={isProcessing || onboardingComplete || !input.trim()}
                      className="p-3.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white transition-all shadow-[0_0_20px_rgba(167,139,250,0.25)] disabled:opacity-40 disabled:cursor-not-allowed">
                      <Send className="w-4 h-4" />
                    </m.button>
                  </form>
                </m.div>
              </m.div>
            )
          ) : (
            /* ══════════ BHEEMA ══════════ */
            <m.div variants={bodyVariants} initial="hidden" animate="visible" exit="exit" className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 flex flex-col items-center justify-center relative">
                <m.div className="absolute inset-0 pointer-events-none" animate={{ opacity: voiceConnected ? 1 : 0.4 }}
                  style={{ background: "radial-gradient(ellipse 60% 50% at center, rgba(251,146,60,0.06) 0%, transparent 70%)" }} />
                {cameraActive && (
                  <div className="absolute top-4 right-4 w-48 h-36 rounded-xl overflow-hidden border border-orange-400/30 shadow-lg z-10">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" style={{ transform: "scaleX(-1)" }} />
                    {repInfo && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-3 py-1.5 text-xs">
                        <span className="text-orange-400 font-bold">{repInfo.reps}/{repInfo.target}</span>
                        <span className="text-white/50 ml-2">Set {repInfo.sets + 1}/{repInfo.targetSets}</span>
                      </div>
                    )}
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
                <m.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: voiceConnected ? 1.08 : 1 }}
                  transition={{ opacity: { delay: 0.2, duration: 0.6 }, scale: { type: "spring", stiffness: 120, damping: 15 } }}>
                  <ReactiveOrb color="#fb923c" isActive={voiceConnected} size={300} />
                </m.div>
                <m.div initial={{ opacity: 0, scaleX: 0.6 }} animate={{ opacity: 1, scaleX: 1 }} transition={{ delay: 0.4, duration: 0.5 }} className="-mt-2">
                  <Waveform isActive={voiceConnected} color="#fb923c" width={360} height={80} />
                </m.div>
                <div className="h-14 flex flex-col items-center justify-center mt-1">
                  <AnimatePresence mode="wait">
                    {voiceConnected ? (
                      <m.p key="listening" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-orange-400/50">Listening...</m.p>
                    ) : (
                      <m.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-white/20">Ready</m.p>
                    )}
                  </AnimatePresence>
                </div>
                <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.5 }}
                  className="flex items-center gap-6 mt-2">
                  <div className="flex flex-col items-center gap-2">
                    <m.button onClick={toggleCamera} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.88 }}
                      className={`rounded-full flex items-center justify-center transition-all duration-300 ${
                        cameraActive ? "bg-orange-500/80 shadow-[0_0_30px_rgba(251,146,60,0.3)]"
                        : "bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 hover:border-orange-400/30"}`}
                      style={{ width: 52, height: 52 }}>
                      {cameraActive ? <CameraOff className="w-5 h-5 text-white" /> : <Camera className="w-5 h-5 text-orange-400" />}
                    </m.button>
                    <p className="text-[10px] text-white/20">{cameraActive ? "Stop camera" : "Start camera"}</p>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <m.button onClick={toggleBheemaVoice} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.88 }}
                      animate={{ scale: voiceConnected ? [1, 1.04, 1] : 1 }}
                      transition={voiceConnected ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : {}}
                      className={`relative rounded-full flex items-center justify-center transition-all duration-300 ${
                        voiceConnected ? "bg-orange-500 mic-pulse shadow-[0_0_50px_rgba(251,146,60,0.4)]"
                        : "bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 hover:border-orange-400/30"}`}
                      style={{ width: 68, height: 68 }}>
                      <AnimatePresence mode="wait">
                        {voiceConnected ? (
                          <m.div key="off" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <MicOff className="w-6 h-6 text-white" />
                          </m.div>
                        ) : (
                          <m.div key="on" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <Mic className="w-6 h-6 text-orange-400" />
                          </m.div>
                        )}
                      </AnimatePresence>
                    </m.button>
                    <p className="text-[11px] text-white/20">{voiceConnected ? "Tap to stop" : "Tap to speak"}</p>
                  </div>
                </m.div>
              </div>
              {messages.length > 1 && (
                <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="shrink-0 px-6 py-4 border-t border-white/5 max-h-56 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
                  <div className="max-w-2xl mx-auto space-y-3">
                    {messages.slice(1).map(msg => (
                      <m.div key={msg.id} initial={{ opacity: 0, y: 10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        className={`flex ${msg.role === "user" ? "justify-end" : msg.role === "system" ? "justify-center" : "justify-start"}`}>
                        <div className={`max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user" ? "bg-white/10 text-white rounded-br-md"
                          : msg.role === "system" ? "bg-orange-400/5 text-orange-300/60 text-xs"
                          : "bg-orange-400/10 text-orange-50 border border-orange-400/10 rounded-bl-md"}`}>
                          {msg.content}
                        </div>
                      </m.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </m.div>
              )}
            </m.div>
          )}
        </m.div>
        </>
      )}
    </AnimatePresence>
  );
}
