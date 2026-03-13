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
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    title: "AI Personal Coach",
    desc: "Chat with your AI coach anytime. Get real-time guidance, form tips, and motivation — like having a personal trainer in your pocket.",
  },
  {
    icon: Dumbbell,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    title: "Smart Workouts",
    desc: "Auto-generated workout plans tailored to your goals, equipment, schedule, and fitness level. Adapts as you progress.",
  },
  {
    icon: Apple,
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    title: "Nutrition Tracking",
    desc: "AI-powered meal plans and food logging. Just describe what you ate — our AI calculates macros and adjusts your plan.",
  },
  {
    icon: Watch,
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    title: "Wearable Sync",
    desc: "Connect Google Fit, Fitbit, Garmin, or Whoop. Your heart rate, sleep, and recovery data inform every recommendation.",
  },
  {
    icon: BarChart3,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    title: "Progress Analytics",
    desc: "Visualize your journey with detailed charts. Track strength, weight, body composition, and consistency over time.",
  },
  {
    icon: Brain,
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    title: "Evidence-Based",
    desc: "Every recommendation is grounded in sports science and nutrition research. No bro-science — just proven methods.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* ─── Header ─── */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Everything you need to{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              train smarter
            </span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
            Powered by advanced AI and backed by science. TrainFree brings
            together coaching, planning, tracking, and analytics in one platform.
          </p>
        </div>

        {/* ─── Grid ─── */}
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-5 sm:mt-20 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-2xl border border-white/[0.04] bg-white/[0.02] p-7 transition-all duration-300 hover:border-emerald-500/20 hover:bg-white/[0.04]"
            >
              <div className={`mb-4 grid h-11 w-11 place-items-center rounded-xl ${f.bg}`}>
                <f.icon className={`h-5 w-5 ${f.color}`} />
              </div>
              <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors">
                {f.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
