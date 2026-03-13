import { UserPlus, Sparkles, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Step {
  num: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}

const steps: Step[] = [
  {
    num: "01",
    icon: UserPlus,
    title: "Tell us about yourself",
    desc: "Quick chat with your AI coach — share your goals, fitness level, injuries, diet needs, and equipment. No boring forms.",
  },
  {
    num: "02",
    icon: Sparkles,
    title: "Get your personalized plan",
    desc: "AI instantly creates a custom workout program and nutrition plan calibrated to your body and goals.",
  },
  {
    num: "03",
    icon: TrendingUp,
    title: "Train, track & evolve",
    desc: "Log workouts, track meals, watch your progress. Your AI coach continuously adapts your plan as you improve.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-[120px]">
      <div className="section-container">
        {/* Header */}
        <div className="text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-emerald-400">
            How It Works
          </p>
          <h2 className="mt-4 text-[48px] font-bold leading-tight tracking-tight">
            Up and running in{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              minutes
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-[460px] text-[17px] leading-relaxed text-zinc-400">
            No complicated setup. Just a natural conversation that builds your
            perfect fitness plan.
          </p>
        </div>

        {/* 3-column steps */}
        <div className="relative mt-[64px] grid grid-cols-3 gap-10">
          {/* Connecting line behind cards */}
          <div className="pointer-events-none absolute top-[52px] left-[calc(16.666%+26px)] right-[calc(16.666%+26px)] h-px bg-gradient-to-r from-emerald-500/30 via-emerald-500/20 to-emerald-500/30" />

          {steps.map((step) => (
            <div key={step.num} className="relative text-center">
              {/* Icon */}
              <div className="relative z-10 mx-auto mb-7 flex h-[72px] w-[72px] items-center justify-center rounded-2xl border border-emerald-500/20 bg-[#0a0f0a] shadow-[0_0_24px_rgba(16,185,129,0.08)]">
                <step.icon className="h-7 w-7 text-emerald-400" />
                <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 font-mono text-[11px] font-bold text-emerald-400">
                  {step.num}
                </span>
              </div>

              <h3 className="text-[20px] font-semibold text-white">
                {step.title}
              </h3>
              <p className="mx-auto mt-3 max-w-[300px] text-[15px] leading-[1.7] text-zinc-500">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
