"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { m, AnimatePresence, LazyMotion, domAnimation } from "framer-motion";
import {
  ArrowLeft,
  Flame,
  Dumbbell,
  TrendingDown,
  Activity,
  ChevronLeft,
  ChevronRight,
  Check,
  Scale,
  Trophy,
  Gift,
  Lock,
  Star,
  Zap,
  Crown,
  Target,
  Calendar,
  X,
  Sparkles,
  Medal,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";

const API_BASE =
  process.env.NEXT_PUBLIC_FASTAPI_API || "http://localhost:8080/api";

// ─── Types ───────────────────────────────────────────────────────
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

interface ProgressData {
  user_id: string;
  streak_days: number;
  total_workouts: number;
  weight_history: { weight_kg: number; recorded_at: string }[];
  bmi_history: {
    bmi_value: number;
    category: string;
    daily_calories: number;
    recorded_at: string;
  }[];
}

interface DayData {
  date: Date;
  dateStr: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  hasWorkout: boolean;
  hasWeight: boolean;
  weight?: number;
  isCurrentMonth: boolean;
}

// ─── Reward milestones ──────────────────────────────────────────
const MILESTONES = [
  {
    days: 7,
    title: "Week Warrior",
    subtitle: "7 days of dedication",
    icon: Zap,
    gradient: "from-blue-500 to-cyan-400",
    glow: "shadow-blue-500/30",
    border: "border-blue-400/30",
    bg: "bg-blue-500/15",
    iconBg: "bg-blue-500/20",
    text: "text-blue-300",
    progressBg: "from-blue-500 to-cyan-400",
    reward: null,
  },
  {
    days: 14,
    title: "Fortnight Fighter",
    subtitle: "14 days strong",
    icon: Star,
    gradient: "from-violet-500 to-purple-400",
    glow: "shadow-violet-500/30",
    border: "border-violet-400/30",
    bg: "bg-violet-500/15",
    iconBg: "bg-violet-500/20",
    text: "text-violet-300",
    progressBg: "from-violet-500 to-purple-400",
    reward: null,
  },
  {
    days: 30,
    title: "Monthly Champion",
    subtitle: "30 days of glory",
    icon: Trophy,
    gradient: "from-orange-500 to-amber-400",
    glow: "shadow-orange-500/30",
    border: "border-orange-400/30",
    bg: "bg-orange-500/15",
    iconBg: "bg-orange-500/20",
    text: "text-orange-300",
    progressBg: "from-orange-500 to-amber-400",
    reward: "TRAIN10",
  },
  {
    days: 60,
    title: "Two Month Titan",
    subtitle: "60 days unstoppable",
    icon: Crown,
    gradient: "from-emerald-500 to-green-400",
    glow: "shadow-emerald-500/30",
    border: "border-emerald-400/30",
    bg: "bg-emerald-500/15",
    iconBg: "bg-emerald-500/20",
    text: "text-emerald-300",
    progressBg: "from-emerald-500 to-green-400",
    reward: "TRAIN25",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────
function formatDate(d: Date) {
  return d.toISOString().split("T")[0];
}

function isSameDay(a: Date, b: Date) {
  return formatDate(a) === formatDate(b);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// ═════════════════════════════════════════════════════════════════
// Dashboard Page
// ═════════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [weightInput, setWeightInput] = useState("");
  const [logWeightLoading, setLogWeightLoading] = useState(false);
  const [logWorkoutLoading, setLogWorkoutLoading] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showFullCalendar, setShowFullCalendar] = useState(false);

  const [trackedDays, setTrackedDays] = useState<
    Record<string, { workout?: boolean; weight?: number }>
  >({});

  const loadData = useCallback(async () => {
    try {
      const stored = localStorage.getItem("trainfree_profile");
      if (!stored) { setLoading(false); return; }
      const profileData: ProfileData = JSON.parse(stored);
      setProfile(profileData);

      try {
        const local = localStorage.getItem("trainfree_tracked_days");
        if (local) setTrackedDays(JSON.parse(local));
      } catch {}

      const resp = await fetch(`${API_BASE}/workout/progress/${profileData.user_id}`);
      if (resp.ok) setProgress(await resp.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (Object.keys(trackedDays).length > 0) {
      localStorage.setItem("trainfree_tracked_days", JSON.stringify(trackedDays));
    }
  }, [trackedDays]);

  // ─── Log weight ───────────────────────────────────────────────
  const handleLogWeight = async () => {
    if (!profile || !weightInput) return;
    const weight = parseFloat(weightInput);
    if (isNaN(weight) || weight <= 0 || weight > 500) return;

    setLogWeightLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/workout/weight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: profile.user_id, weight_kg: weight }),
      });
      if (resp.ok) {
        const todayStr = formatDate(new Date());
        setTrackedDays((prev) => ({ ...prev, [todayStr]: { ...prev[todayStr], weight } }));
        setWeightInput("");
        setShowWeightModal(false);
        await loadData();
        const updatedProfile = { ...profile, weight_kg: weight };
        setProfile(updatedProfile);
        localStorage.setItem("trainfree_profile", JSON.stringify(updatedProfile));
        window.dispatchEvent(new Event("trainfree_profile_updated"));
      }
    } catch {}
    setLogWeightLoading(false);
  };

  // ─── Log workout ──────────────────────────────────────────────
  const handleLogWorkout = async (dateStr?: string) => {
    if (!profile) return;
    const targetDate = dateStr || formatDate(new Date());
    const dayOfWeek = new Date(targetDate).toLocaleDateString("en-US", { weekday: "long" });

    setLogWorkoutLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/workout/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: profile.user_id, day_of_week: dayOfWeek, focus: "General", duration_minutes: 45 }),
      });
      if (resp.ok) {
        setTrackedDays((prev) => ({ ...prev, [targetDate]: { ...prev[targetDate], workout: true } }));
        await loadData();
      }
    } catch {}
    setLogWorkoutLoading(false);
  };

  // ─── Build calendar days ──────────────────────────────────────
  const buildCalendarDays = (): DayData[] => {
    const today = new Date();
    const todayStr = formatDate(today);
    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();

    const weightDates: Record<string, number> = {};
    progress?.weight_history.forEach((w) => {
      if (w.recorded_at) { const d = w.recorded_at.split("T")[0]; weightDates[d] = w.weight_kg; }
    });

    const days: DayData[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      const d = new Date(calYear, calMonth, -(firstDayOfWeek - 1 - i));
      const ds = formatDate(d);
      days.push({ date: d, dateStr: ds, isToday: false, isPast: d < today && !isSameDay(d, today), isFuture: false, hasWorkout: trackedDays[ds]?.workout || false, hasWeight: !!weightDates[ds] || !!trackedDays[ds]?.weight, weight: trackedDays[ds]?.weight || weightDates[ds], isCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(calYear, calMonth, day);
      const ds = formatDate(d);
      days.push({ date: d, dateStr: ds, isToday: ds === todayStr, isPast: d < today && ds !== todayStr, isFuture: d > today, hasWorkout: trackedDays[ds]?.workout || false, hasWeight: !!weightDates[ds] || !!trackedDays[ds]?.weight, weight: trackedDays[ds]?.weight || weightDates[ds], isCurrentMonth: true });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(calYear, calMonth + 1, i);
      const ds = formatDate(d);
      days.push({ date: d, dateStr: ds, isToday: false, isPast: false, isFuture: true, hasWorkout: false, hasWeight: false, isCurrentMonth: false });
    }

    return days;
  };

  // ─── Get current week days from calendar ──────────────────────
  const getCurrentWeekDays = (calDays: DayData[]): DayData[] => {
    const todayIndex = calDays.findIndex((d) => d.isToday);
    if (todayIndex === -1) {
      // If today isn't in this month view, show the first week
      return calDays.slice(0, 7);
    }
    // Find the row (week) that contains today
    const rowStart = Math.floor(todayIndex / 7) * 7;
    return calDays.slice(rowStart, rowStart + 7);
  };

  // ─── Weight chart SVG ─────────────────────────────────────────
  const renderWeightChart = () => {
    const history = progress?.weight_history || [];
    if (history.length < 2) return null;

    const weights = history.map((h) => h.weight_kg);
    const minW = Math.min(...weights) - 2;
    const maxW = Math.max(...weights) + 2;
    const range = maxW - minW || 1;
    const w = 600, h = 180, padX = 44, padY = 24;
    const chartW = w - padX * 2, chartH = h - padY * 2;

    const points = weights.map((wt, i) => ({
      x: padX + (i / (weights.length - 1)) * chartW,
      y: padY + chartH - ((wt - minW) / range) * chartH,
      weight: wt,
    }));

    const pathD = points.length <= 2
      ? points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
      : points.map((p, i) => {
          if (i === 0) return `M ${p.x} ${p.y}`;
          const prev = points[i - 1];
          const cpx = (prev.x + p.x) / 2;
          return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`;
        }).join(" ");

    const areaD = `${pathD} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

    const targetY = profile?.target_weight_kg
      ? padY + chartH - ((profile.target_weight_kg - minW) / range) * chartH
      : null;

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <defs>
          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#ea580c" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#c2410c" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const y = padY + chartH * (1 - frac);
          const val = (minW + range * frac).toFixed(0);
          return (
            <g key={i}>
              <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <text x={padX - 8} y={y + 4} fill="rgba(255,255,255,0.3)" fontSize="10" textAnchor="end" fontFamily="system-ui">{val}</text>
            </g>
          );
        })}
        {targetY !== null && targetY >= padY && targetY <= padY + chartH && (
          <>
            <line x1={padX} y1={targetY} x2={w - padX} y2={targetY} stroke="#fb923c" strokeDasharray="6 4" strokeOpacity="0.6" strokeWidth="1.5" />
            <rect x={w - padX + 4} y={targetY - 8} width="32" height="16" rx="4" fill="rgba(251,146,60,0.15)" />
            <text x={w - padX + 20} y={targetY + 4} fill="#fb923c" fontSize="9" textAnchor="middle" fontWeight="600">Goal</text>
          </>
        )}
        <path d={areaD} fill="url(#wg)" />
        <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)" />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="6" fill="rgba(249,115,22,0.3)" />
            <circle cx={p.x} cy={p.y} r="4" fill="#f97316" />
            <circle cx={p.x} cy={p.y} r="2" fill="white" />
          </g>
        ))}
        <rect x={points[0].x - 18} y={points[0].y - 22} width="36" height="16" rx="4" fill="rgba(249,115,22,0.2)" />
        <text x={points[0].x} y={points[0].y - 11} fill="#fdba74" fontSize="10" textAnchor="middle" fontWeight="700">{points[0].weight}kg</text>
        <rect x={points[points.length - 1].x - 18} y={points[points.length - 1].y - 22} width="36" height="16" rx="4" fill="rgba(249,115,22,0.2)" />
        <text x={points[points.length - 1].x} y={points[points.length - 1].y - 11} fill="#fdba74" fontSize="10" textAnchor="middle" fontWeight="700">{points[points.length - 1].weight}kg</text>
      </svg>
    );
  };

  // ─── Loading / no profile states ──────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <m.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="w-10 h-10 border-2 border-orange-400/40 border-t-orange-400 rounded-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-20 h-20 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
          <Calendar className="w-9 h-9 text-orange-400" />
        </div>
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold mb-2">No Profile Yet</h2>
          <p className="text-white/50 text-sm max-w-sm">Talk to Bheema first to complete your fitness profile. Then come back here to track your journey.</p>
        </div>
        <Link href="/" className="px-8 py-3 rounded-full bg-orange-500 text-white text-sm font-semibold hover:bg-orange-400 transition-all">
          Go to Home
        </Link>
      </div>
    );
  }

  const streak = progress?.streak_days || 0;
  const totalWorkouts = progress?.total_workouts || 0;
  const weightHistory = progress?.weight_history || [];
  const startWeight = weightHistory.length > 0 ? weightHistory[0].weight_kg : profile.weight_kg;
  const currentWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight_kg : profile.weight_kg;
  const weightChange = currentWeight - startWeight;
  const calDays = buildCalendarDays();
  const weekDays = getCurrentWeekDays(calDays);

  const isNewUser = streak === 0 && totalWorkouts === 0;
  const todayStr = formatDate(new Date());
  const todayWorkoutDone = trackedDays[todayStr]?.workout || false;

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* ── Top nav ── */}
        <div className="sticky top-0 z-40 backdrop-blur-2xl bg-[#0a0a0a]/80 border-b border-white/[0.06]">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 text-white/60 hover:text-white transition-colors text-sm group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Home</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <Dumbbell className="w-4 h-4 text-orange-400" />
              <span className="font-bold text-sm text-white">Dashboard</span>
            </div>
            <div className="w-16" />
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-6 relative">
          {/* ── Welcome header ── */}
          <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">
                  Welcome back, {profile.name}
                </h1>
                <p className="text-white/40 text-sm mt-1.5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-300 text-[11px] font-medium">
                    {profile.fitness_goal?.replace("_", " ") || "General fitness"}
                  </span>
                  <span className="text-white/20">&middot;</span>
                  <span className="text-white/40">{profile.diet_preference || "—"}</span>
                </p>
              </div>
            </div>
          </m.div>

          {/* ── Streak + action buttons row ── */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.5 }}
            className="flex items-center justify-between flex-wrap gap-4"
          >
            {!isNewUser && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white leading-none">{streak}</p>
                  <p className="text-white/40 text-xs">day streak</p>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-3 ml-auto">
              <Link
                href="/?agent=bheema"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-400 transition-colors"
              >
                <Dumbbell className="w-4 h-4" />
                Train with Bheema
              </Link>
              <button
                onClick={() => setShowWeightModal(true)}
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl border border-white/[0.12] text-white/70 text-sm font-medium hover:bg-white/[0.04] hover:text-white transition-all"
              >
                <Scale className="w-4 h-4" />
                Log Weight
              </button>
            </div>
          </m.div>

          {/* ── Zero-state OR stats ── */}
          {isNewUser ? (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8"
            >
              <div className="max-w-md">
                <h2 className="text-2xl font-bold text-white mb-2">Ready for Day 1?</h2>
                <p className="text-white/40 text-sm mb-6">
                  Start your first workout to begin tracking streaks, weight, and progress. Your journey starts with a single step.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/?agent=bheema"
                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-400 transition-colors"
                  >
                    <Dumbbell className="w-4 h-4" />
                    Start Workout with Bheema
                  </Link>
                  <button
                    onClick={() => setShowWeightModal(true)}
                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl border border-white/[0.12] text-white/70 text-sm font-medium hover:bg-white/[0.04] hover:text-white transition-all"
                  >
                    <Scale className="w-4 h-4" />
                    Log Weight
                  </button>
                </div>
              </div>
            </m.div>
          ) : (
            <>
              {/* ── Compact stats row ── */}
              <m.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.5 }}
                className="grid grid-cols-3 gap-3"
              >
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Dumbbell className="w-3.5 h-3.5 text-white/50" />
                    <span className="text-[11px] text-white/40 uppercase tracking-wider font-medium">Workouts</span>
                  </div>
                  <p className="text-xl font-bold text-white">{totalWorkouts}</p>
                </div>
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    {weightChange <= 0 ? <TrendingDown className="w-3.5 h-3.5 text-white/50" /> : <TrendingUp className="w-3.5 h-3.5 text-white/50" />}
                    <span className="text-[11px] text-white/40 uppercase tracking-wider font-medium">Weight</span>
                  </div>
                  <p className="text-xl font-bold text-white">{weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)}<span className="text-sm text-white/40 font-normal ml-0.5">kg</span></p>
                </div>
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-3.5 h-3.5 text-white/50" />
                    <span className="text-[11px] text-white/40 uppercase tracking-wider font-medium">BMI</span>
                  </div>
                  <p className="text-xl font-bold text-white">{profile.bmi?.bmi_value?.toFixed(1) || "—"}</p>
                </div>
              </m.div>
            </>
          )}

          {/* ── Calendar ── */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6"
          >
            {/* Calendar header with actions */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold flex items-center gap-2.5 text-base">
                <Calendar className="w-4 h-4 text-white/50" />
                Your Journey
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else { setCalMonth(calMonth - 1); } }}
                  className="p-2 rounded-lg hover:bg-white/[0.06] text-white/50 hover:text-white transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium min-w-[130px] text-center text-white/70">{MONTH_NAMES[calMonth]} {calYear}</span>
                <button
                  onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else { setCalMonth(calMonth + 1); } }}
                  className="p-2 rounded-lg hover:bg-white/[0.06] text-white/50 hover:text-white transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Inline action buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleLogWorkout()}
                disabled={logWorkoutLoading || todayWorkoutDone}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-medium hover:bg-orange-500/15 transition-all disabled:opacity-40"
              >
                {todayWorkoutDone ? <Check className="w-3.5 h-3.5" /> : <Dumbbell className="w-3.5 h-3.5" />}
                {todayWorkoutDone ? "Workout Logged" : "Log Workout"}
              </button>
              <button
                onClick={() => setShowWeightModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/60 text-xs font-medium hover:bg-white/[0.06] transition-all"
              >
                <Scale className="w-3.5 h-3.5" />
                Log Weight
              </button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {DAY_LABELS.map((d) => (
                <div key={d} className="text-center text-[11px] text-white/30 font-medium py-1">{d}</div>
              ))}
            </div>

            {/* Week strip (default) or full calendar */}
            <div className="grid grid-cols-7 gap-1.5">
              {(showFullCalendar ? calDays : weekDays).map((day, i) => {
                const isSelected = selectedDay?.dateStr === day.dateStr;
                return (
                  <m.button
                    key={`${day.dateStr}-${i}`}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`relative rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all ${
                      showFullCalendar ? "aspect-square" : "py-3"
                    } ${
                      !day.isCurrentMonth
                        ? "opacity-15 text-white/30"
                        : day.isToday
                          ? "bg-orange-500/15 border border-orange-400/30 text-orange-200 font-bold"
                          : day.hasWorkout
                            ? "bg-white/[0.06] border border-orange-400/20 text-white/80"
                            : day.hasWeight
                              ? "bg-white/[0.04] border border-white/[0.08] text-white/60"
                              : day.isPast
                                ? "bg-white/[0.02] text-white/40 hover:bg-white/[0.04]"
                                : day.isFuture
                                  ? "bg-white/[0.01] text-white/20"
                                  : "bg-white/[0.03] text-white/60 hover:bg-white/[0.05]"
                    } ${isSelected ? "ring-2 ring-orange-400/50 ring-offset-1 ring-offset-[#0a0a0a]" : ""}`}
                  >
                    <span>{day.date.getDate()}</span>
                    {day.hasWorkout && (
                      <div className="absolute bottom-0.5">
                        <Check className="w-2.5 h-2.5 text-orange-400" />
                      </div>
                    )}
                    {day.hasWeight && !day.hasWorkout && (
                      <div className="absolute bottom-0.5">
                        <Scale className="w-2.5 h-2.5 text-white/40" />
                      </div>
                    )}
                  </m.button>
                );
              })}
            </div>

            {/* Show full month toggle */}
            <button
              onClick={() => setShowFullCalendar(!showFullCalendar)}
              className="flex items-center gap-1.5 mx-auto mt-3 text-[11px] text-white/35 hover:text-white/50 transition-colors"
            >
              {showFullCalendar ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Show week only
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Show full month
                </>
              )}
            </button>

            {/* Legend */}
            <div className="flex items-center gap-5 mt-3 text-[11px] text-white/30">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-orange-500/30 border border-orange-400/30" />
                Today
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-2.5 h-2.5 text-orange-400" />
                Workout
              </div>
              <div className="flex items-center gap-1.5">
                <Scale className="w-2.5 h-2.5 text-white/40" />
                Weight
              </div>
            </div>

            {/* Selected day panel */}
            <AnimatePresence>
              {selectedDay && selectedDay.isCurrentMonth && (
                <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <div className="mt-4 pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-white/70">
                        {selectedDay.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                      </p>
                      <div className="flex items-center gap-2">
                        {selectedDay.hasWorkout && (
                          <span className="text-[11px] px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-300 border border-orange-400/15 font-medium">Workout done</span>
                        )}
                        {selectedDay.hasWeight && (
                          <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.06] text-white/50 border border-white/[0.08] font-medium">{selectedDay.weight?.toFixed(1)} kg</span>
                        )}
                      </div>
                    </div>
                    {(selectedDay.isToday || selectedDay.isPast) && !selectedDay.hasWorkout && (
                      <button
                        onClick={() => handleLogWorkout(selectedDay.dateStr)}
                        disabled={logWorkoutLoading}
                        className="w-full py-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-medium hover:bg-orange-500/15 transition-all disabled:opacity-40"
                      >
                        {logWorkoutLoading ? "Logging..." : "Mark Workout Complete"}
                      </button>
                    )}
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </m.div>

          {/* ── Weight Progress Chart ── */}
          {weightHistory.length >= 2 && (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold flex items-center gap-2.5 text-base">
                  <Scale className="w-4 h-4 text-white/50" />
                  Weight Progress
                </h2>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-white/40">Start: <strong className="text-white/70">{startWeight}kg</strong></span>
                  <span className="text-white/15">&rarr;</span>
                  <span className="flex items-center gap-1.5 text-white/40">Now: <strong className="text-orange-400">{currentWeight}kg</strong></span>
                  {profile.target_weight_kg && (
                    <>
                      <span className="text-white/15">&rarr;</span>
                      <span className="flex items-center gap-1.5 text-white/40">Goal: <strong className="text-orange-400">{profile.target_weight_kg}kg</strong></span>
                    </>
                  )}
                </div>
              </div>
              {renderWeightChart()}
            </m.div>
          )}

          {/* ── Rewards & Milestones ── */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6"
          >
            <h2 className="font-bold flex items-center gap-2.5 text-base mb-6">
              <Trophy className="w-4 h-4 text-white/50" />
              Rewards & Milestones
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {MILESTONES.map((ms) => {
                const unlocked = streak >= ms.days;
                const Icon = ms.icon;
                const pct = Math.min(100, (streak / ms.days) * 100);
                return (
                  <m.div
                    key={ms.days}
                    whileHover={{ scale: 1.03, y: -3 }}
                    className={`relative rounded-2xl p-5 text-center transition-all overflow-hidden ${
                      unlocked
                        ? `${ms.bg} border ${ms.border} shadow-lg ${ms.glow}`
                        : `bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1]`
                    }`}
                  >
                    {unlocked && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${ms.gradient} opacity-[0.06] pointer-events-none`} />
                    )}

                    <div className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3 relative ${
                      unlocked
                        ? `bg-gradient-to-br ${ms.gradient} shadow-xl ${ms.glow}`
                        : ms.iconBg
                    }`}>
                      <Icon className={`w-6 h-6 ${unlocked ? "text-white" : ms.text} ${!unlocked ? "opacity-60" : ""}`} />
                      {!unlocked && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0a0a0a] border border-white/10 flex items-center justify-center">
                          <Lock className="w-2.5 h-2.5 text-white/40" />
                        </div>
                      )}
                    </div>

                    <p className={`text-xs font-bold ${unlocked ? ms.text : "text-white/60"}`}>
                      {ms.title}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${unlocked ? "text-white/30" : "text-white/25"}`}>
                      {ms.subtitle}
                    </p>

                    {unlocked && ms.reward && (
                      <m.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 px-3 py-2 rounded-xl bg-black/40 border border-white/[0.06]"
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <Gift className="w-3.5 h-3.5 text-orange-400" />
                          <span className="text-[11px] font-mono font-bold text-orange-300 tracking-wider">{ms.reward}</span>
                        </div>
                        <p className="text-[9px] text-white/25 mt-1">Coupon code</p>
                      </m.div>
                    )}

                    {!unlocked && (
                      <div className="mt-3">
                        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <m.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-full rounded-full bg-gradient-to-r ${ms.progressBg}`}
                          />
                        </div>
                        <p className={`text-[10px] mt-1.5 font-medium ${ms.text} opacity-60`}>
                          {ms.days - streak} days to go
                        </p>
                      </div>
                    )}

                    {unlocked && (
                      <div className="absolute top-2 right-2">
                        <Sparkles className={`w-4 h-4 ${ms.text} opacity-50`} />
                      </div>
                    )}
                  </m.div>
                );
              })}
            </div>
          </m.div>

          {/* ── Target progress ── */}
          {profile.target_weight_kg && (
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6"
            >
              <div className="flex items-center gap-2.5 mb-5">
                <Target className="w-4 h-4 text-white/50" />
                <h2 className="font-bold text-base">Goal Progress</h2>
              </div>
              {(() => {
                const totalToLose = Math.abs(startWeight - profile.target_weight_kg);
                const lost = Math.abs(startWeight - currentWeight);
                const pct = totalToLose > 0 ? Math.min(100, (lost / totalToLose) * 100) : 0;
                return (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-3">
                      <span className="text-white/50 font-medium">{startWeight}kg</span>
                      <span className="text-white font-bold text-lg">{currentWeight}kg</span>
                      <span className="text-orange-400 font-semibold">{profile.target_weight_kg}kg</span>
                    </div>
                    <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden relative">
                      <m.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-orange-500 relative"
                      />
                    </div>
                    <p className="text-xs text-white/35 mt-3 text-center font-medium">
                      <span className="text-orange-400">{pct.toFixed(0)}%</span> of the way there &middot; {Math.abs(currentWeight - profile.target_weight_kg).toFixed(1)}kg to go
                    </p>
                  </div>
                );
              })()}
            </m.div>
          )}

          <div className="h-8" />
        </div>

        {/* ── Weight Log Modal ── */}
        <AnimatePresence>
          {showWeightModal && (
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
              onClick={() => setShowWeightModal(false)}
            >
              <m.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#141414] border border-white/[0.1] rounded-2xl p-7 w-full max-w-sm mx-4 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold flex items-center gap-2.5 text-lg">
                    <Scale className="w-4 h-4 text-white/50" />
                    Log Weight
                  </h3>
                  <button onClick={() => setShowWeightModal(false)} className="p-2 rounded-lg hover:bg-white/[0.06] text-white/40 hover:text-white transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-5">
                  <div>
                    <label className="text-xs text-white/40 block mb-2 font-medium">Current weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      placeholder={`${currentWeight}`}
                      className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl px-5 py-3.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-orange-400/50 focus:bg-white/[0.08] transition-all"
                      autoFocus
                    />
                  </div>
                  <m.button
                    onClick={handleLogWeight}
                    disabled={logWeightLoading || !weightInput}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-400 transition-all disabled:opacity-40"
                  >
                    {logWeightLoading ? "Saving..." : "Save Weight"}
                  </m.button>
                </div>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}
