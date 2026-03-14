"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { m, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Mic,
  MicOff,
  Send,
  Volume2,
  Camera,
  CameraOff,
  MessageSquare,
  Download,
  User,
  Activity,
  Mail,
} from "lucide-react";
import ReactiveOrb from "./ReactiveOrb";
import Waveform from "./Waveform";

const API_BASE =
  process.env.NEXT_PUBLIC_FASTAPI_API || "http://localhost:8080/api";
const WS_BASE = API_BASE.replace(/^http/, "ws").replace(/\/api$/, "/api");

interface VoiceInterfaceProps {
  agent: "mika" | "bheema" | null;
  onClose: () => void;
}

interface ChatMessage {
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
  onboarding_complete: boolean;
  bmi: {
    bmi_value: number;
    category: string;
    daily_calories: number;
    daily_protein_g: number;
    daily_carbs_g: number;
    daily_fat_g: number;
    strategy: string;
  } | null;
  pdf_filename: string | null;
  pdf_available: boolean;
}

// ─── Audio helpers ───────────────────────────────────────────────
function float32ToPcm16Base64(float32: Float32Array): string {
  const pcm16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(pcm16.buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++)
    binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function pcm16Base64ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const pcm16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(pcm16.length);
  for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 0x8000;
  return float32;
}

function resample(
  input: Float32Array,
  fromRate: number,
  toRate: number
): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const newLength = Math.round(input.length / ratio);
  const output = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    const idx = i * ratio;
    const low = Math.floor(idx);
    const high = Math.min(low + 1, input.length - 1);
    const frac = idx - low;
    output[i] = input[low] * (1 - frac) + input[high] * frac;
  }
  return output;
}

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

// ─── Profile Cards Component ─────────────────────────────────────
function ProfileCards({ profile }: { profile: ProfileData }) {
  const handleDownload = () => {
    if (profile.pdf_available && profile.user_id) {
      window.open(
        `${API_BASE}/onboarding/pdf/${profile.user_id}`,
        "_blank"
      );
    }
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      className="max-w-2xl mx-auto mt-6 space-y-4"
    >
      {/* User Info Card */}
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <User className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">
              {profile.name || "User"}
            </h3>
            <p className="text-violet-300/60 text-xs">{profile.fitness_goal?.replace("_", " ") || "General fitness"}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-violet-400/50" />
            <span className="text-white/60 truncate">{profile.email || "—"}</span>
          </div>
          <div className="text-white/60">
            Diet: <span className="text-white/80">{profile.diet_preference || "—"}</span>
          </div>
          <div className="text-white/60">
            Weight: <span className="text-white/80">{profile.weight_kg ? `${profile.weight_kg} kg` : "—"}</span>
          </div>
          <div className="text-white/60">
            Target: <span className="text-white/80">{profile.target_weight_kg ? `${profile.target_weight_kg} kg` : "—"}</span>
          </div>
        </div>
      </div>

      {/* BMI Card */}
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
              <p className="text-lg font-bold text-yellow-400">
                {profile.bmi.daily_carbs_g}g / {profile.bmi.daily_fat_g}g
              </p>
              <p className="text-[10px] text-white/40 mt-1">Carbs / Fat</p>
            </div>
          </div>
        </div>
      )}

      {/* PDF Download Card */}
      {profile.pdf_available && (
        <m.button
          onClick={handleDownload}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="w-full bg-gradient-to-r from-violet-600/20 to-emerald-600/20 border border-violet-500/20 rounded-2xl p-5 flex items-center gap-4 text-left hover:border-violet-400/40 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/30 transition-colors">
            <Download className="w-6 h-6 text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-semibold">Download Fitness Plan PDF</h3>
            <p className="text-white/40 text-xs mt-0.5">
              Your personalized workout & nutrition plan
            </p>
          </div>
          <span className="text-violet-400 text-sm font-medium">Download</span>
        </m.button>
      )}
    </m.div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════
export default function VoiceInterface({
  agent,
  onClose,
}: VoiceInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [agentTranscript, setAgentTranscript] = useState("");
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [repInfo, setRepInfo] = useState<{
    reps: number;
    target: number;
    sets: number;
    targetSets: number;
  } | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  // Refs
  const sessionIdRef = useRef<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const realtimeWsRef = useRef<WebSocket | null>(null);
  const visionWsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const micSinkNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const playbackCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const nextPlayTimeRef = useRef(0);
  const speechStartRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const visionIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);

  const isMika = agent === "mika";

  // Keep messagesRef in sync
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // ─── Lenis scroll lock ─────────────────────────────────────────
  useEffect(() => {
    if (!agent) return;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [agent]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ─── Voice cleanup (shared) ────────────────────────────────────
  const cleanupVoice = useCallback(() => {
    if (realtimeWsRef.current) {
      try {
        realtimeWsRef.current.send(JSON.stringify({ type: "stop" }));
      } catch {}
      realtimeWsRef.current.close();
      realtimeWsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (micSinkNodeRef.current) {
      micSinkNodeRef.current.disconnect();
      micSinkNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    gainNodeRef.current = null;
    nextPlayTimeRef.current = 0;
    setIsListening(false);
    setAgentTranscript("");
  }, []);

  // ─── Full cleanup ─────────────────────────────────────────────
  const cleanup = useCallback(() => {
    cleanupVoice();
    if (visionWsRef.current) {
      try {
        visionWsRef.current.send(JSON.stringify({ type: "stop" }));
      } catch {}
      visionWsRef.current.close();
      visionWsRef.current = null;
    }
    if (visionIntervalRef.current) {
      clearInterval(visionIntervalRef.current);
      visionIntervalRef.current = undefined;
    }
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
    setCameraActive(false);
    setRepInfo(null);
  }, [cleanupVoice]);

  // ─── Fetch profile after onboarding ────────────────────────────
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const resp = await fetch(`${API_BASE}/onboarding/profile/${userId}`);
      if (resp.ok) {
        const data = await resp.json();
        setProfileData(data);
      }
    } catch {}
  }, []);

  // ─── Init on agent change ─────────────────────────────────────
  useEffect(() => {
    if (!agent) {
      cleanup();
      return;
    }

    setMessages([]);
    setInput("");
    setTranscript("");
    setAgentTranscript("");
    setIsListening(false);
    setIsProcessing(false);
    setOnboardingComplete(false);
    setStatusText("");
    setRepInfo(null);
    setProfileData(null);
    sessionIdRef.current = null;
    userIdRef.current = null;

    if (agent === "mika") {
      initMikaAndVoice();
    } else if (agent === "bheema") {
      setMessages([
        {
          role: "assistant",
          content:
            "I'm Bheema, your personal trainer. Press the mic button to start talking with me. I can see you exercise via your camera too!",
        },
      ]);
    }

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent]);

  // ─── MIKA: Init session + auto-connect voice ──────────────────
  async function initMikaAndVoice() {
    setStatusText("Connecting to Mika...");
    try {
      // First get a backend session for chat fallback
      const resp = await fetch(`${API_BASE}/onboarding/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      sessionIdRef.current = data.session_id;
      userIdRef.current = data.user_id;
      // Now auto-connect voice (will greet via voice)
      connectMikaVoice();
    } catch (e: any) {
      setMessages([
        {
          role: "system",
          content: `Could not connect to server. (${e.message})`,
        },
      ]);
      setStatusText("Connection failed");
    }
  }

  // ─── MIKA: Send chat message (text input) ─────────────────────
  const sendMikaMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || onboardingComplete) return;
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setInput("");

      // If voice WS is open, send text through it
      if (realtimeWsRef.current?.readyState === WebSocket.OPEN && isListening) {
        realtimeWsRef.current.send(JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "message", role: "user",
            content: [{ type: "input_text", text }],
          },
        }));
        realtimeWsRef.current.send(JSON.stringify({ type: "response.create" }));
        return;
      }

      // Otherwise use chat API with conversation context
      if (!sessionIdRef.current) return;
      setIsProcessing(true);
      try {
        // Build context from voice transcript so backend knows what was discussed
        const voiceContext = messagesRef.current
          .filter(m => m.role === "user" || m.role === "assistant")
          .map(m => `${m.role}: ${m.content}`)
          .join("\n");
        const resp = await fetch(`${API_BASE}/onboarding/answer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionIdRef.current,
            message: text,
            voice_context: voiceContext || undefined,
          }),
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);

        if (data.onboarding_complete) {
          setOnboardingComplete(true);
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              content: data.plan_generated
                ? "Your fitness plan has been generated and emailed!"
                : "Onboarding complete! Your plan is being processed...",
            },
          ]);
          if (userIdRef.current) fetchProfile(userIdRef.current);
        }
      } catch (e: any) {
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: `Network error: ${e.message}. Please try again.`,
          },
        ]);
      } finally {
        setIsProcessing(false);
      }
    },
    [onboardingComplete, fetchProfile, isListening]
  );

  // ─── Audio playback (gapless scheduled) ────────────────────────
  const playAudioChunk = useCallback((base64Pcm16: string) => {
    try {
      if (
        !playbackCtxRef.current ||
        playbackCtxRef.current.state === "closed"
      ) {
        playbackCtxRef.current = new AudioContext({ sampleRate: 24000 });
      }
      const ctx = playbackCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const float32 = pcm16Base64ToFloat32(base64Pcm16);
      const buffer = ctx.createBuffer(1, float32.length, 24000);
      buffer.getChannelData(0).set(float32);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      const now = ctx.currentTime;
      if (nextPlayTimeRef.current < now - 0.1) nextPlayTimeRef.current = now + 0.05;
      const startTime = Math.max(now, nextPlayTimeRef.current);
      source.start(startTime);
      nextPlayTimeRef.current = startTime + buffer.duration;
    } catch {}
  }, []);

  // ─── MIKA: Save voice transcript to backend ───────────────────
  const saveVoiceTranscript = useCallback(async (userText: string, assistantText: string) => {
    if (!sessionIdRef.current || !userIdRef.current) return;
    try {
      const res = await fetch(`${API_BASE}/onboarding/voice-transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
          user_id: userIdRef.current,
          user_text: userText,
          assistant_text: assistantText,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.onboarding_complete) {
          setOnboardingComplete(true);
          if (userIdRef.current) fetchProfile(userIdRef.current);
        }
      }
    } catch {}
  }, [fetchProfile]);

  // ─── MIKA: Connect voice (direct OpenAI WS with ephemeral key) ─
  const connectMikaVoice = useCallback(async () => {
    setStatusText("Connecting voice...");
    try {
      // 1. Get ephemeral key
      const tokenRes = await fetch("/api/mika-realtime", { method: "POST" });
      if (!tokenRes.ok) throw new Error(`Token fetch failed: ${tokenRes.status}`);
      const tokenData = await tokenRes.json();
      const ephemeralKey = tokenData.client_secret?.value;
      if (!ephemeralKey) throw new Error("No ephemeral key");

      // 2. AudioContext
      const audioCtx = new AudioContext({ sampleRate: 24000 });
      await audioCtx.resume();
      audioContextRef.current = audioCtx;

      // 3. Open direct WS to OpenAI
      const ws = new WebSocket(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-mini-realtime-preview-2024-12-17",
        ["realtime", `openai-insecure-api-key.${ephemeralKey}`, "openai-beta.realtime-v1"]
      );
      realtimeWsRef.current = ws;

      let currentAssistantText = "";
      let lastUserText = "";
      let sessionConfigured = false;
      let micStarted = false;

      const startMic = async () => {
        if (micStarted) return;
        micStarted = true;
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: { sampleRate: 24000, channelCount: 1, echoCancellation: true, noiseSuppression: true },
          });
          mediaStreamRef.current = stream;
          const source = audioCtx.createMediaStreamSource(stream);
          sourceNodeRef.current = source;
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            if (!realtimeWsRef.current || realtimeWsRef.current.readyState !== WebSocket.OPEN) return;
            const inputData = e.inputBuffer.getChannelData(0);
            const ratio = audioCtx.sampleRate / 24000;
            const outputLength = Math.floor(inputData.length / ratio);
            const output = new Float32Array(outputLength);
            for (let i = 0; i < outputLength; i++) output[i] = inputData[Math.floor(i * ratio)];
            const base64 = float32ToPcm16Base64(output);
            realtimeWsRef.current.send(JSON.stringify({ type: "input_audio_buffer.append", audio: base64 }));
          };

          source.connect(processor);
          const micSink = audioCtx.createGain();
          micSink.gain.value = 0;
          micSink.connect(audioCtx.destination);
          micSinkNodeRef.current = micSink;
          processor.connect(micSink);
        } catch (e: any) {
          setMessages((prev) => [...prev, { role: "system", content: `Mic access denied: ${e.message}` }]);
        }
      };

      const replayContextAndStart = () => {
        const currentMessages = messagesRef.current.filter(m => m.role === "user" || m.role === "assistant");
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
          // First time — let Mika greet
          ws.send(JSON.stringify({ type: "response.create" }));
        }
      };

      ws.onopen = () => {
        setStatusText("Waiting for session...");
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case "session.created":
            // Send session.update to ensure full config is applied
            ws.send(JSON.stringify({
              type: "session.update",
              session: {
                modalities: ["text", "audio"],
                voice: "shimmer",
                input_audio_format: "pcm16",
                output_audio_format: "pcm16",
                input_audio_transcription: { model: "whisper-1", language: "en" },
                turn_detection: {
                  type: "server_vad",
                  silence_duration_ms: 2000,
                  threshold: 0.8,
                  prefix_padding_ms: 500,
                },
                temperature: 0.7,
                max_response_output_tokens: 150,
              },
            }));
            break;

          case "session.updated":
            if (!sessionConfigured) {
              sessionConfigured = true;
              setIsListening(true);
              setStatusText("Mika is listening");
              replayContextAndStart();
              startMic();
            }
            break;

          case "input_audio_buffer.speech_started":
            speechStartRef.current = Date.now();
            setTranscript("Listening...");
            break;

          case "input_audio_buffer.speech_stopped":
            setTranscript("");
            break;

          case "conversation.item.input_audio_transcription.completed": {
            const t = (data.transcript || "").trim();
            if (!t || t.length < 2) break;
            lastUserText = t;
            setTranscript("");
            setMessages((prev) => [...prev, { role: "user", content: t }]);
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
              setMessages((prev) => [...prev, { role: "assistant", content: finalText }]);
              setAgentTranscript("");
              saveVoiceTranscript(lastUserText, finalText);
              currentAssistantText = "";
              lastUserText = "";
            }
            break;

          case "response.audio.delta":
            if (data.delta) playAudioChunk(data.delta);
            break;

          case "response.audio.done":
          case "response.done":
            break;

          case "error":
            console.error("OpenAI Realtime error:", data.error);
            setMessages((prev) => [...prev, { role: "system", content: `Voice error: ${data.error?.message || "Unknown"}` }]);
            break;
        }
      };

      ws.onerror = () => {
        setStatusText("Voice connection error");
        setIsListening(false);
      };

      ws.onclose = () => {
        setStatusText("Voice paused — type below");
        setIsListening(false);
      };

    } catch (e: any) {
      setStatusText("Voice failed — use chat");
      setMessages((prev) => [...prev, { role: "system", content: `Voice connection failed: ${e.message}` }]);
    }
  }, [playAudioChunk, saveVoiceTranscript]);

  // ─── MIKA: Toggle voice (orb click) ───────────────────────────
  const toggleMikaVoice = useCallback(() => {
    if (onboardingComplete) return;
    if (isListening) {
      cleanupVoice();
      setStatusText("Voice paused — type below");
    } else {
      connectMikaVoice();
    }
  }, [isListening, onboardingComplete, cleanupVoice, connectMikaVoice]);

  // ─── BHEEMA: Connect realtime voice WS ─────────────────────────
  const connectBheemaVoice = useCallback(async () => {
    const sessionId = "bheema-" + Date.now();
    setStatusText("Connecting to Coach Bheema...");

    const wsUrl = `${WS_BASE}/realtime/ws/${sessionId}`;
    const ws = new WebSocket(wsUrl);
    realtimeWsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "config",
          user_id: userIdRef.current || "",
          vision_session_id: sessionId,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case "audio":
            playAudioChunk(msg.data);
            break;
          case "transcript":
            if (msg.role === "assistant" && msg.text) {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (
                  last &&
                  last.role === "assistant" &&
                  !last.content.startsWith("I'm Bheema")
                ) {
                  return [
                    ...prev.slice(0, -1),
                    { ...last, content: last.content + msg.text },
                  ];
                }
                return [...prev, { role: "assistant", content: msg.text }];
              });
            }
            break;
          case "user_transcript":
            if (msg.text) {
              setMessages((prev) => [
                ...prev,
                { role: "user", content: msg.text },
              ]);
              setTranscript("");
            }
            break;
          case "status":
            setStatusText(msg.message || "");
            if (msg.message === "listening") setTranscript("Listening...");
            break;
          case "play_music":
            setMessages((prev) => [
              ...prev,
              { role: "system", content: "Music playing..." },
            ]);
            break;
          case "stop_music":
            setMessages((prev) => [
              ...prev,
              { role: "system", content: "Music stopped." },
            ]);
            break;
          case "rest_timer":
            setMessages((prev) => [
              ...prev,
              {
                role: "system",
                content: `Rest timer: ${msg.seconds}s — ${msg.message || "Take a break!"}`,
              },
            ]);
            break;
          case "rep_sync":
            setRepInfo({
              reps: msg.reps || 0,
              target: msg.target_reps || 0,
              sets: msg.sets_completed || 0,
              targetSets: msg.target_sets || 0,
            });
            break;
          case "error":
            setMessages((prev) => [
              ...prev,
              { role: "system", content: `Error: ${msg.message}` },
            ]);
            break;
        }
      } catch {}
    };

    ws.onerror = () => {
      setStatusText("Connection error");
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content:
            "WebSocket connection error. Is the backend running on port 8080?",
        },
      ]);
    };

    ws.onclose = () => {
      setStatusText("Disconnected");
      setIsListening(false);
    };

    // Start mic
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const audioCtx = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioCtx;
      const actualRate = audioCtx.sampleRate;
      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (
          !realtimeWsRef.current ||
          realtimeWsRef.current.readyState !== WebSocket.OPEN
        )
          return;
        const inputData = e.inputBuffer.getChannelData(0);
        const resampled =
          actualRate !== 24000
            ? resample(inputData, actualRate, 24000)
            : inputData;
        const base64 = float32ToPcm16Base64(resampled);
        realtimeWsRef.current.send(
          JSON.stringify({ type: "audio", data: base64 })
        );
      };

      source.connect(processor);
      // Silent sink — prevents mic audio from playing through speakers (echo)
      const micSink = audioCtx.createGain();
      micSink.gain.value = 0;
      micSink.connect(audioCtx.destination);
      processor.connect(micSink);
      setIsListening(true);
      setStatusText("Connected! Coach Bheema is ready.");
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Microphone access denied: ${e.message}`,
        },
      ]);
      setStatusText("Mic access denied");
    }
  }, [playAudioChunk]);

  // ─── BHEEMA: Toggle mic ────────────────────────────────────────
  const toggleBheemaListening = useCallback(() => {
    if (isListening) {
      cleanupVoice();
      setStatusText("Disconnected");
    } else {
      connectBheemaVoice();
    }
  }, [isListening, cleanupVoice, connectBheemaVoice]);

  // ─── BHEEMA: Toggle camera ─────────────────────────────────────
  const toggleCamera = useCallback(async () => {
    if (cameraActive) {
      if (visionIntervalRef.current) {
        clearInterval(visionIntervalRef.current);
        visionIntervalRef.current = undefined;
      }
      if (visionWsRef.current) {
        try {
          visionWsRef.current.send(JSON.stringify({ type: "stop" }));
        } catch {}
        visionWsRef.current.close();
        visionWsRef.current = null;
      }
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
        cameraStreamRef.current = null;
      }
      setCameraActive(false);
      setRepInfo(null);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const visionSessionId = "vision-" + Date.now();
      const visionWsUrl = `${WS_BASE}/vision/ws/${visionSessionId}`;
      const visionWs = new WebSocket(visionWsUrl);
      visionWsRef.current = visionWs;

      visionWs.onopen = () => {
        visionWs.send(
          JSON.stringify({
            type: "start",
            exercise: "squat",
            target_reps: 10,
            target_sets: 3,
          })
        );
        visionIntervalRef.current = setInterval(() => {
          if (
            !canvasRef.current ||
            !videoRef.current ||
            !visionWsRef.current ||
            visionWsRef.current.readyState !== WebSocket.OPEN
          )
            return;
          const canvas = canvasRef.current;
          const video = videoRef.current;
          canvas.width = 640;
          canvas.height = 480;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, 640, 480);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
          const base64 = dataUrl.split(",")[1];
          visionWsRef.current!.send(
            JSON.stringify({ type: "frame", data: base64 })
          );
        }, 100);
      };

      visionWs.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "rep_update") {
            setRepInfo({
              reps: msg.reps || 0,
              target: msg.target_reps || 0,
              sets: msg.sets_completed || 0,
              targetSets: msg.target_sets || 0,
            });
          }
        } catch {}
      };

      setCameraActive(true);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        { role: "system", content: `Camera access denied: ${e.message}` },
      ]);
    }
  }, [cameraActive]);

  // ─── Handle close ──────────────────────────────────────────────
  const handleClose = useCallback(() => {
    cleanup();
    onClose();
  }, [cleanup, onClose]);

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <>
    <AnimatePresence>
      {agent && (
        <m.div
          key="voice-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col"
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
                onClick={handleClose}
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
                <span className="font-semibold">
                  {isMika ? "Mika" : "Bheema"}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isMika
                      ? "bg-violet-400/10 text-violet-400"
                      : "bg-orange-400/10 text-orange-400"
                  }`}
                >
                  {isMika
                    ? isListening
                      ? "Voice Active"
                      : "Chat Mode"
                    : "Voice Mode"}
                </span>
                {statusText && (
                  <span className="text-[10px] text-white/30 ml-2">
                    {statusText}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <m.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="px-4 py-1.5 rounded-full text-xs border border-white/10 hover:border-white/20 text-white/40 hover:text-white transition-all"
              >
                Back to Home
              </m.button>
            </div>
          </m.div>

          {isMika ? (
            /* ══════════ MIKA — UNIFIED: orb + transcript + chat ══════════ */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Paragraph transcript area */}
              <div
                ref={scrollContainerRef}
                className="shrink-0 px-6 py-4 max-h-48 overflow-y-auto"
                style={{ overscrollBehavior: "contain", scrollbarWidth: "none" }}
              >
                <div className="max-w-2xl mx-auto">
                  {(messages.length > 0 || agentTranscript) ? (
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, wordBreak: "break-word" }}>
                      {messages.map((msg, i) => (
                        <span key={i}>
                          {i > 0 && <span className="text-white/20" style={{ margin: "0 2px" }}>{" \u00b7 "}</span>}
                          {msg.role === "user" ? (
                            <span className="text-violet-300" style={{ fontWeight: 600, fontStyle: "italic" }}>{msg.content}</span>
                          ) : msg.role === "system" ? (
                            <span className="text-emerald-300/60" style={{ fontSize: 12 }}>{msg.content}</span>
                          ) : (
                            <span className="text-violet-50">{msg.content}</span>
                          )}
                        </span>
                      ))}
                      {/* Interim agent transcript (streaming) */}
                      {agentTranscript && (
                        <>
                          {messages.length > 0 && <span className="text-white/20" style={{ margin: "0 2px" }}>{" \u00b7 "}</span>}
                          <span className="text-violet-50" style={{ opacity: 0.6 }}>{agentTranscript}</span>
                        </>
                      )}
                      {/* Typing dots for chat API */}
                      {isProcessing && (
                        <>
                          <span className="text-white/20" style={{ margin: "0 2px" }}>{" \u00b7 "}</span>
                          <span className="inline-flex items-center" style={{ gap: 3, verticalAlign: "middle" }}>
                            <span className="inline-block rounded-full bg-violet-400/50" style={{ width: 5, height: 5, animation: "dot-bounce 1.4s infinite 0s" }} />
                            <span className="inline-block rounded-full bg-violet-400/50" style={{ width: 5, height: 5, animation: "dot-bounce 1.4s infinite 0.2s" }} />
                            <span className="inline-block rounded-full bg-violet-400/50" style={{ width: 5, height: 5, animation: "dot-bounce 1.4s infinite 0.4s" }} />
                          </span>
                        </>
                      )}
                    </p>
                  ) : (
                    <p className="text-center text-white/20 text-sm mt-4">
                      Connecting to Mika...
                    </p>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Center: Orb + Waveform + Status */}
              <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
                <m.div
                  className="absolute inset-0 pointer-events-none"
                  animate={{ opacity: isListening ? 1 : 0.4 }}
                  transition={{ duration: 0.8 }}
                  style={{
                    background:
                      "radial-gradient(ellipse 60% 50% at center, rgba(167,139,250,0.06) 0%, transparent 70%)",
                  }}
                />

                {/* Orb — click to toggle voice */}
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
                  className="cursor-pointer"
                  onClick={toggleMikaVoice}
                  title={isListening ? "Click to pause voice" : "Click for voice mode"}
                >
                  <ReactiveOrb
                    color="#a78bfa"
                    isActive={isListening}
                    size={300}
                  />
                </m.div>

                <m.div
                  initial={{ opacity: 0, scaleX: 0.6 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="-mt-2"
                >
                  <Waveform
                    isActive={isListening}
                    color="#a78bfa"
                    width={360}
                    height={80}
                  />
                </m.div>

                {/* Status */}
                <div className="h-10 flex flex-col items-center justify-center mt-1">
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
                          className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 align-middle"
                        />
                        &rdquo;
                      </m.p>
                    ) : isListening ? (
                      <m.p key="listening" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-violet-400/50">
                        Listening... tap orb to switch to chat
                      </m.p>
                    ) : (
                      <m.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-white/20">
                        {statusText || "Tap orb for voice mode"}
                      </m.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Profile cards after onboarding */}
              {onboardingComplete && profileData && (
                <div className="px-6 pb-4">
                  <ProfileCards profile={profileData} />
                </div>
              )}

              {/* Chat input — always visible */}
              {!onboardingComplete && (
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="px-6 py-4 border-t border-white/5 bg-[#0a0a0a] shrink-0"
                >
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMikaMessage(input);
                    }}
                    className="flex items-center gap-3 max-w-2xl mx-auto"
                  >
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={isListening ? "Type while voice is active..." : "Type your message to Mika..."}
                      disabled={isProcessing}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-violet-400/40 focus:bg-white/[0.07] transition-all disabled:opacity-40"
                    />
                    <m.button
                      type="submit"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.92 }}
                      disabled={isProcessing || !input.trim()}
                      className="p-3.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white transition-all shadow-[0_0_20px_rgba(167,139,250,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </m.button>
                  </form>
                </m.div>
              )}
            </div>
          ) : (
            /* ══════════ BHEEMA: Voice ══════════ */
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 flex flex-col items-center justify-center relative min-h-0">
                <m.div
                  className="absolute inset-0 pointer-events-none"
                  animate={{ opacity: isListening ? 1 : 0.4 }}
                  transition={{ duration: 0.8 }}
                  style={{
                    background:
                      "radial-gradient(ellipse 60% 50% at center, rgba(251,146,60,0.06) 0%, transparent 70%)",
                  }}
                />

                {/* Camera preview */}
                {cameraActive && (
                  <div className="absolute top-4 right-4 w-48 h-36 rounded-xl overflow-hidden border border-orange-400/30 shadow-lg z-10">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ transform: "scaleX(-1)" }}
                    />
                    {repInfo && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-3 py-1.5 text-xs">
                        <span className="text-orange-400 font-bold">
                          {repInfo.reps}/{repInfo.target}
                        </span>
                        <span className="text-white/50 ml-2">
                          Set {repInfo.sets + 1}/{repInfo.targetSets}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />

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

                {/* Status */}
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

                {/* Mic + Camera buttons */}
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="flex items-center gap-6 mt-2"
                >
                  <div className="flex flex-col items-center gap-2">
                    <m.button
                      onClick={toggleCamera}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.88 }}
                      className={`rounded-full flex items-center justify-center transition-all duration-300 ${
                        cameraActive
                          ? "bg-orange-500/80 shadow-[0_0_30px_rgba(251,146,60,0.3)]"
                          : "bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 hover:border-orange-400/30"
                      }`}
                      style={{ width: 52, height: 52 }}
                    >
                      {cameraActive ? (
                        <CameraOff className="w-5 h-5 text-white" />
                      ) : (
                        <Camera className="w-5 h-5 text-orange-400" />
                      )}
                    </m.button>
                    <p className="text-[10px] text-white/20">
                      {cameraActive ? "Stop camera" : "Start camera"}
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-3">
                    <m.button
                      onClick={toggleBheemaListening}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.88 }}
                      animate={{
                        scale: isListening ? [1, 1.04, 1] : 1,
                      }}
                      transition={
                        isListening
                          ? {
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }
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
                  </div>
                </m.div>
              </div>

              {/* Bheema messages — paragraph format */}
              {messages.length > 1 && (
                <m.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="shrink-0 px-6 py-4 border-t border-white/5 max-h-56 overflow-y-auto"
                  style={{ overscrollBehavior: "contain", scrollbarWidth: "none" }}
                >
                  <div className="max-w-2xl mx-auto">
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, wordBreak: "break-word" }}>
                      {messages.slice(1).map((msg, i) => (
                        <span key={i}>
                          {i > 0 && <span className="text-white/20" style={{ margin: "0 2px" }}>{" \u00b7 "}</span>}
                          {msg.role === "user" ? (
                            <span className="text-orange-300" style={{ fontWeight: 600, fontStyle: "italic" }}>{msg.content}</span>
                          ) : msg.role === "system" ? (
                            <span className="text-orange-300/60" style={{ fontSize: 12 }}>{msg.content}</span>
                          ) : (
                            <span className="text-orange-50">{msg.content}</span>
                          )}
                        </span>
                      ))}
                    </p>
                    <div ref={messagesEndRef} />
                  </div>
                </m.div>
              )}
            </div>
          )}
        </m.div>
      )}
    </AnimatePresence>
    <style>{`
      @keyframes dot-bounce {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-3px); }
      }
    `}</style>
    </>
  );
}
