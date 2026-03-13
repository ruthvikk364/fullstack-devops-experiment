import {
  MessageSquare,
  Dumbbell,
  Apple,
  Watch,
  BarChart3,
  Brain,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  color: string;
  bg: string;
  title: string;
  desc: string;
}

const features: Feature[] = [
  {
    icon: MessageSquare,
    color: "#34d399",
    bg: "rgba(16,185,129,0.1)",
    title: "AI Personal Coach",
    desc: "Chat with your AI coach anytime. Get real-time guidance, form tips, and motivation — like having a personal trainer in your pocket.",
  },
  {
    icon: Dumbbell,
    color: "#60a5fa",
    bg: "rgba(59,130,246,0.1)",
    title: "Smart Workouts",
    desc: "Auto-generated workout plans tailored to your goals, equipment, schedule, and fitness level. Adapts as you progress.",
  },
  {
    icon: Apple,
    color: "#fb923c",
    bg: "rgba(249,115,22,0.1)",
    title: "Nutrition Tracking",
    desc: "AI-powered meal plans and food logging. Describe what you ate in plain English — our AI calculates macros instantly.",
  },
  {
    icon: Watch,
    color: "#a78bfa",
    bg: "rgba(139,92,246,0.1)",
    title: "Wearable Sync",
    desc: "Connect Google Fit, Fitbit, Garmin, or Whoop. Heart rate, sleep, and recovery data inform every recommendation.",
  },
  {
    icon: BarChart3,
    color: "#fb7185",
    bg: "rgba(244,63,94,0.1)",
    title: "Progress Analytics",
    desc: "Visualize your journey with detailed charts. Track strength gains, weight trends, body composition, and consistency.",
  },
  {
    icon: Brain,
    color: "#2dd4bf",
    bg: "rgba(45,212,191,0.1)",
    title: "Evidence-Based",
    desc: "Every recommendation is grounded in sports science and nutrition research via RAG. No bro-science — proven methods only.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-[120px]">
      <div className="section-container">
        {/* Header */}
        <div className="text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-emerald-400">
            Features
          </p>
          <h2 className="mt-4 text-[48px] font-bold leading-tight tracking-tight">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              train smarter
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-[520px] text-[17px] leading-relaxed text-zinc-400">
            Powered by advanced AI and backed by science. Coaching, planning,
            tracking, and analytics — all in one platform.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-[64px] grid grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-white/[0.05] bg-white/[0.02] p-9 transition-all duration-300 hover:border-emerald-500/20 hover:bg-white/[0.04]"
            >
              <div
                className="mb-5 flex h-[52px] w-[52px] items-center justify-center rounded-xl"
                style={{ background: f.bg }}
              >
                <f.icon className="h-6 w-6" style={{ color: f.color }} />
              </div>
              <h3 className="text-[18px] font-semibold text-white transition-colors group-hover:text-emerald-300">
                {f.title}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.7] text-zinc-500">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
