"use client";

import { useState, useEffect, useCallback } from "react";
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
    icon: Zap,
    color: "from-blue-500 to-cyan-400",
    border: "border-blue-500/20",
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    reward: null,
  },
  {
    days: 14,
    title: "Fortnight Fighter",
    icon: Star,
    color: "from-violet-500 to-purple-400",
    border: "border-violet-500/20",
    bg: "bg-violet-500/10",
    text: "text-violet-400",
    reward: null,
  },
  {
    days: 30,
    title: "Monthly Champion",
    icon: Trophy,
    color: "from-orange-500 to-amber-400",
    border: "border-orange-500/20",
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    reward: "TRAIN10",
  },
  {
    days: 60,
    title: "Two Month Titan",
    icon: Crown,
    color: "from-emerald-500 to-green-400",
    border: "border-emerald-500/20",
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
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
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
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

  // Tracked days from localStorage (supplement server data)
  const [trackedDays, setTrackedDays] = useState<
    Record<string, { workout?: boolean; weight?: number }>
  >({});

  // Load profile + progress
  const loadData = useCallback(async () => {
    try {
      const stored = localStorage.getItem("trainfree_profile");
      if (!stored) {
        setLoading(false);
        return;
      }
      const profileData: ProfileData = JSON.parse(stored);
      setProfile(profileData);

      // Load local tracked days
      try {
        const local = localStorage.getItem("trainfree_tracked_days");
        if (local) setTrackedDays(JSON.parse(local));
      } catch {}

      // Fetch progress from backend
      const resp = await fetch(
        `${API_BASE}/workout/progress/${profileData.user_id}`
      );
      if (resp.ok) {
        const data = await resp.json();
        setProgress(data);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Save tracked days to localStorage
  useEffect(() => {
    if (Object.keys(trackedDays).length > 0) {
      localStorage.setItem(
        "trainfree_tracked_days",
        JSON.stringify(trackedDays)
      );
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
        body: JSON.stringify({
          user_id: profile.user_id,
          weight_kg: weight,
        }),
      });
      if (resp.ok) {
        const todayStr = formatDate(new Date());
        setTrackedDays((prev) => ({
          ...prev,
          [todayStr]: { ...prev[todayStr], weight },
        }));
        setWeightInput("");
        setShowWeightModal(false);
        // Refresh data
        await loadData();
        // Update localStorage profile with new weight
        const updatedProfile = { ...profile, weight_kg: weight };
        setProfile(updatedProfile);
        localStorage.setItem(
          "trainfree_profile",
          JSON.stringify(updatedProfile)
        );
        window.dispatchEvent(new Event("trainfree_profile_updated"));
      }
    } catch {}
    setLogWeightLoading(false);
  };

  // ─── Log workout (mark today as done) ─────────────────────────
  const handleLogWorkout = async (dateStr?: string) => {
    if (!profile) return;
    const targetDate = dateStr || formatDate(new Date());
    const dayOfWeek = new Date(targetDate).toLocaleDateString("en-US", {
      weekday: "long",
    });

    setLogWorkoutLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/workout/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: profile.user_id,
          day_of_week: dayOfWeek,
          focus: "General",
          duration_minutes: 45,
        }),
      });
      if (resp.ok) {
        setTrackedDays((prev) => ({
          ...prev,
          [targetDate]: { ...prev[targetDate], workout: true },
        }));
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

    // Weight history dates
    const weightDates: Record<string, number> = {};
    progress?.weight_history.forEach((w) => {
      if (w.recorded_at) {
        const d = w.recorded_at.split("T")[0];
        weightDates[d] = w.weight_kg;
      }
    });

    const days: DayData[] = [];

    // Padding days from previous month
    for (let i = 0; i < firstDayOfWeek; i++) {
      const d = new Date(calYear, calMonth, -(firstDayOfWeek - 1 - i));
      const ds = formatDate(d);
      days.push({
        date: d,
        dateStr: ds,
        isToday: false,
        isPast: d < today && !isSameDay(d, today),
        isFuture: false,
        hasWorkout: trackedDays[ds]?.workout || false,
        hasWeight: !!weightDates[ds] || !!trackedDays[ds]?.weight,
        weight: trackedDays[ds]?.weight || weightDates[ds],
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(calYear, calMonth, day);
      const ds = formatDate(d);
      days.push({
        date: d,
        dateStr: ds,
        isToday: ds === todayStr,
        isPast: d < today && ds !== todayStr,
        isFuture: d > today,
        hasWorkout: trackedDays[ds]?.workout || false,
        hasWeight: !!weightDates[ds] || !!trackedDays[ds]?.weight,
        weight: trackedDays[ds]?.weight || weightDates[ds],
        isCurrentMonth: true,
      });
    }

    // Padding days for next month
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(calYear, calMonth + 1, i);
      const ds = formatDate(d);
      days.push({
        date: d,
        dateStr: ds,
        isToday: false,
        isPast: false,
        isFuture: true,
        hasWorkout: false,
        hasWeight: false,
        isCurrentMonth: false,
      });
    }

    return days;
  };

  // ─── Weight chart SVG ─────────────────────────────────────────
  const renderWeightChart = () => {
    const history = progress?.weight_history || [];
    if (history.length < 2) return null;

    const weights = history.map((h) => h.weight_kg);
    const minW = Math.min(...weights) - 2;
    const maxW = Math.max(...weights) + 2;
    const range = maxW - minW || 1;
    const w = 600;
    const h = 160;
    const padX = 40;
    const padY = 20;
    const chartW = w - padX * 2;
    const chartH = h - padY * 2;

    const points = weights.map((wt, i) => {
      const x = padX + (i / (weights.length - 1)) * chartW;
      const y = padY + chartH - ((wt - minW) / range) * chartH;
      return { x, y, weight: wt };
    });

    const pathD = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    // Area fill
    const areaD = `${pathD} L ${points[points.length - 1].x} ${padY + chartH} L ${points[0].x} ${padY + chartH} Z`;

    // Target weight line
    const targetY =
      profile?.target_weight_kg
        ? padY +
          chartH -
          ((profile.target_weight_kg - minW) / range) * chartH
        : null;

    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto">
        <defs>
          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => {
          const y = padY + chartH * (1 - frac);
          const val = (minW + range * frac).toFixed(0);
          return (
            <g key={i}>
              <line
                x1={padX}
                y1={y}
                x2={w - padX}
                y2={y}
                stroke="rgba(255,255,255,0.04)"
                strokeDasharray="4 4"
              />
              <text
                x={padX - 6}
                y={y + 4}
                fill="rgba(255,255,255,0.2)"
                fontSize="10"
                textAnchor="end"
              >
                {val}
              </text>
            </g>
          );
        })}
        {/* Target line */}
        {targetY !== null && targetY >= padY && targetY <= padY + chartH && (
          <>
            <line
              x1={padX}
              y1={targetY}
              x2={w - padX}
              y2={targetY}
              stroke="#fb923c"
              strokeDasharray="6 4"
              strokeOpacity="0.5"
            />
            <text
              x={w - padX + 4}
              y={targetY + 3}
              fill="#fb923c"
              fontSize="9"
              opacity="0.7"
            >
              Goal
            </text>
          </>
        )}
        {/* Area */}
        <path d={areaD} fill="url(#wg)" />
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#a78bfa"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#a78bfa" />
            <circle cx={p.x} cy={p.y} r="2" fill="#0a0a0a" />
          </g>
        ))}
        {/* First/last labels */}
        <text
          x={points[0].x}
          y={points[0].y - 10}
          fill="#a78bfa"
          fontSize="10"
          textAnchor="middle"
          fontWeight="600"
        >
          {points[0].weight}kg
        </text>
        <text
          x={points[points.length - 1].x}
          y={points[points.length - 1].y - 10}
          fill="#a78bfa"
          fontSize="10"
          textAnchor="middle"
          fontWeight="600"
        >
          {points[points.length - 1].weight}kg
        </text>
      </svg>
    );
  };

  // ─── Loading / no profile states ──────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <m.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-violet-400/30 border-t-violet-400 rounded-full"
        />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-6 px-6">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Calendar className="w-7 h-7 text-violet-400" />
        </div>
        <div className="text-center">
          <h2 className="text-white text-xl font-bold mb-2">
            No Profile Yet
          </h2>
          <p className="text-white/40 text-sm max-w-sm">
            Talk to Mika first to complete your fitness profile. Then come back
            here to track your journey.
          </p>
        </div>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-full bg-violet-500 text-white text-sm font-medium hover:bg-violet-400 transition-colors"
        >
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

  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-[#0a0a0a] text-white">
        {/* ── Top nav ── */}
        <div className="sticky top-0 z-40 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/5">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Home</span>
            </Link>
            <div className="flex items-center gap-3">
              <Dumbbell className="w-4 h-4 text-orange-400" />
              <span className="font-semibold text-sm">Dashboard</span>
            </div>
            <div className="w-16" />
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
          {/* ── Welcome + Streak hero ── */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Welcome back,{" "}
                  <span className="bg-gradient-to-r from-violet-400 to-orange-400 bg-clip-text text-transparent">
                    {profile.name}
                  </span>
                </h1>
                <p className="text-white/30 text-sm mt-1">
                  {profile.fitness_goal?.replace("_", " ") || "General fitness"}{" "}
                  plan &middot; {profile.diet_preference || "—"}
                </p>
              </div>
              {streak > 0 && (
                <m.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-500/15 to-orange-600/5 border border-orange-500/20"
                >
                  <Flame className="w-5 h-5 text-orange-400" />
                  <span className="text-orange-300 font-bold text-lg">
                    {streak}
                  </span>
                  <span className="text-orange-300/60 text-xs">day streak</span>
                </m.div>
              )}
            </div>
          </m.div>

          {/* ── Stats grid ── */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">
                  Streak
                </span>
              </div>
              <p className="text-2xl font-bold">{streak}</p>
              <p className="text-[10px] text-white/20 mt-0.5">days</p>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Dumbbell className="w-4 h-4 text-violet-400" />
                <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">
                  Workouts
                </span>
              </div>
              <p className="text-2xl font-bold">{totalWorkouts}</p>
              <p className="text-[10px] text-white/20 mt-0.5">completed</p>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">
                  Weight
                </span>
              </div>
              <p className="text-2xl font-bold">
                {weightChange > 0 ? "+" : ""}
                {weightChange.toFixed(1)}
              </p>
              <p className="text-[10px] text-white/20 mt-0.5">kg change</p>
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">
                  BMI
                </span>
              </div>
              <p className="text-2xl font-bold">
                {profile.bmi?.bmi_value?.toFixed(1) || "—"}
              </p>
              <p className="text-[10px] text-white/20 mt-0.5">
                {profile.bmi?.category || "—"}
              </p>
            </div>
          </m.div>

          {/* ── Calendar ── */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-white/[0.02] border border-white/5 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-violet-400" />
                Your Journey
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (calMonth === 0) {
                      setCalMonth(11);
                      setCalYear(calYear - 1);
                    } else {
                      setCalMonth(calMonth - 1);
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium min-w-[140px] text-center">
                  {MONTH_NAMES[calMonth]} {calYear}
                </span>
                <button
                  onClick={() => {
                    if (calMonth === 11) {
                      setCalMonth(0);
                      setCalYear(calYear + 1);
                    } else {
                      setCalMonth(calMonth + 1);
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAY_LABELS.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] text-white/20 font-medium py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calDays.map((day, i) => {
                const isSelected =
                  selectedDay?.dateStr === day.dateStr;
                return (
                  <m.button
                    key={i}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() =>
                      setSelectedDay(
                        isSelected ? null : day
                      )
                    }
                    className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs transition-all ${
                      !day.isCurrentMonth
                        ? "opacity-20"
                        : day.isToday
                        ? "bg-violet-500/20 border border-violet-500/30 text-violet-300 font-bold"
                        : day.hasWorkout
                        ? "bg-emerald-500/15 border border-emerald-500/20 text-emerald-300"
                        : day.isPast && !day.hasWorkout
                        ? "bg-white/[0.02] text-white/30"
                        : day.isFuture
                        ? "bg-white/[0.01] text-white/15"
                        : "bg-white/[0.03] text-white/50"
                    } ${
                      isSelected
                        ? "ring-2 ring-violet-400/50 ring-offset-1 ring-offset-[#0a0a0a]"
                        : ""
                    }`}
                  >
                    <span>{day.date.getDate()}</span>
                    {day.hasWorkout && (
                      <Check className="w-2.5 h-2.5 text-emerald-400 absolute bottom-1" />
                    )}
                    {day.hasWeight && !day.hasWorkout && (
                      <Scale className="w-2.5 h-2.5 text-blue-400 absolute bottom-1" />
                    )}
                  </m.button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 mt-4 text-[10px] text-white/25">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500/30" />
                Workout done
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-violet-500/30 border border-violet-500/30" />
                Today
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-blue-500/30 border border-blue-500/20" />
                Weight logged
              </div>
            </div>

            {/* Selected day panel */}
            <AnimatePresence>
              {selectedDay && selectedDay.isCurrentMonth && (
                <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium">
                        {selectedDay.date.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <div className="flex items-center gap-2">
                        {selectedDay.hasWorkout && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                            Workout done
                          </span>
                        )}
                        {selectedDay.hasWeight && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400">
                            {selectedDay.weight?.toFixed(1)} kg
                          </span>
                        )}
                      </div>
                    </div>
                    {(selectedDay.isToday || selectedDay.isPast) &&
                      !selectedDay.hasWorkout && (
                        <button
                          onClick={() =>
                            handleLogWorkout(selectedDay.dateStr)
                          }
                          disabled={logWorkoutLoading}
                          className="w-full py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-all disabled:opacity-40"
                        >
                          {logWorkoutLoading
                            ? "Logging..."
                            : "Mark Workout Complete"}
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
              className="bg-white/[0.02] border border-white/5 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold flex items-center gap-2">
                  <Scale className="w-4 h-4 text-violet-400" />
                  Weight Progress
                </h2>
                <div className="flex items-center gap-3 text-xs text-white/30">
                  <span>
                    Start: <strong className="text-white/60">{startWeight}kg</strong>
                  </span>
                  <span>&rarr;</span>
                  <span>
                    Now: <strong className="text-violet-400">{currentWeight}kg</strong>
                  </span>
                  {profile.target_weight_kg && (
                    <>
                      <span>&rarr;</span>
                      <span>
                        Goal:{" "}
                        <strong className="text-orange-400">
                          {profile.target_weight_kg}kg
                        </strong>
                      </span>
                    </>
                  )}
                </div>
              </div>
              {renderWeightChart()}
            </m.div>
          )}

          {/* ── Quick Actions ── */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <button
              onClick={() => setShowWeightModal(true)}
              className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex items-center gap-4 text-left hover:bg-white/[0.05] hover:border-violet-500/20 transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors">
                <Scale className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Log Weight</p>
                <p className="text-[11px] text-white/25 mt-0.5">
                  Track your daily weight
                </p>
              </div>
            </button>
            <button
              onClick={() => handleLogWorkout()}
              disabled={logWorkoutLoading || trackedDays[formatDate(new Date())]?.workout}
              className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 flex items-center gap-4 text-left hover:bg-white/[0.05] hover:border-emerald-500/20 transition-all group disabled:opacity-40"
            >
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                {trackedDays[formatDate(new Date())]?.workout ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Dumbbell className="w-5 h-5 text-emerald-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {trackedDays[formatDate(new Date())]?.workout
                    ? "Workout Logged Today"
                    : "Log Today's Workout"}
                </p>
                <p className="text-[11px] text-white/25 mt-0.5">
                  {trackedDays[formatDate(new Date())]?.workout
                    ? "Great job! Keep it up"
                    : "Mark today as done"}
                </p>
              </div>
            </button>
          </m.div>

          {/* ── Rewards & Milestones ── */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white/[0.02] border border-white/5 rounded-2xl p-6"
          >
            <h2 className="font-semibold flex items-center gap-2 mb-5">
              <Trophy className="w-4 h-4 text-orange-400" />
              Rewards & Milestones
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {MILESTONES.map((m) => {
                const unlocked = streak >= m.days;
                const Icon = m.icon;
                return (
                  <div
                    key={m.days}
                    className={`relative rounded-2xl p-4 text-center transition-all ${
                      unlocked
                        ? `${m.bg} border ${m.border}`
                        : "bg-white/[0.02] border border-white/5 opacity-50"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 ${
                        unlocked
                          ? `bg-gradient-to-br ${m.color} shadow-lg`
                          : "bg-white/5"
                      }`}
                    >
                      {unlocked ? (
                        <Icon className="w-5 h-5 text-white" />
                      ) : (
                        <Lock className="w-4 h-4 text-white/20" />
                      )}
                    </div>
                    <p
                      className={`text-xs font-semibold ${
                        unlocked ? m.text : "text-white/30"
                      }`}
                    >
                      {m.title}
                    </p>
                    <p className="text-[10px] text-white/20 mt-0.5">
                      {m.days} day streak
                    </p>
                    {unlocked && m.reward && (
                      <div className="mt-2 px-2 py-1 rounded-lg bg-black/30 border border-white/5">
                        <div className="flex items-center justify-center gap-1">
                          <Gift className="w-3 h-3 text-orange-400" />
                          <span className="text-[10px] font-mono font-bold text-orange-300">
                            {m.reward}
                          </span>
                        </div>
                        <p className="text-[8px] text-white/20 mt-0.5">
                          Coupon code
                        </p>
                      </div>
                    )}
                    {!unlocked && (
                      <div className="mt-2">
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${m.color}`}
                            style={{
                              width: `${Math.min(
                                100,
                                (streak / m.days) * 100
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="text-[9px] text-white/15 mt-1">
                          {m.days - streak} days to go
                        </p>
                      </div>
                    )}
                  </div>
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
              className="bg-gradient-to-br from-violet-500/5 to-orange-500/5 border border-white/5 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-orange-400" />
                <h2 className="font-semibold">Goal Progress</h2>
              </div>
              {(() => {
                const totalToLose = Math.abs(
                  startWeight - profile.target_weight_kg
                );
                const lost = Math.abs(startWeight - currentWeight);
                const pct =
                  totalToLose > 0
                    ? Math.min(100, (lost / totalToLose) * 100)
                    : 0;
                return (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-white/40">
                        {startWeight}kg
                      </span>
                      <span className="text-violet-400 font-bold">
                        {currentWeight}kg
                      </span>
                      <span className="text-orange-400 font-medium">
                        {profile.target_weight_kg}kg
                      </span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                      <m.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-orange-500"
                      />
                    </div>
                    <p className="text-xs text-white/20 mt-2 text-center">
                      {pct.toFixed(0)}% of the way there!{" "}
                      {Math.abs(
                        currentWeight - profile.target_weight_kg
                      ).toFixed(1)}
                      kg to go
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
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              onClick={() => setShowWeightModal(false)}
            >
              <m.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#141414] border border-white/8 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Scale className="w-4 h-4 text-violet-400" />
                    Log Weight
                  </h3>
                  <button
                    onClick={() => setShowWeightModal(false)}
                    className="p-1 rounded-lg hover:bg-white/5 text-white/30"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/30 block mb-1.5">
                      Current weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={weightInput}
                      onChange={(e) => setWeightInput(e.target.value)}
                      placeholder={`${currentWeight}`}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-violet-500/40 transition-colors"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleLogWeight}
                    disabled={logWeightLoading || !weightInput}
                    className="w-full py-3 rounded-xl bg-violet-500 text-white text-sm font-medium hover:bg-violet-400 transition-colors disabled:opacity-40"
                  >
                    {logWeightLoading ? "Saving..." : "Save Weight"}
                  </button>
                </div>
              </m.div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}
