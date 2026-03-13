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
    desc: "Have a quick chat with your AI coach. Share your goals, fitness level, injuries, dietary needs, and available equipment — no long forms.",
  },
  {
    num: "02",
    icon: Sparkles,
    title: "Get your personalized plan",
    desc: "Your AI coach instantly creates a custom workout program and nutrition plan tailored specifically to your body and goals.",
  },
  {
    num: "03",
    icon: TrendingUp,
    title: "Train, track & evolve",
    desc: "Log workouts, track meals, and watch your progress. Your AI coach continuously adapts your plan based on performance and recovery.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* ─── Header ─── */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Up and running in{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              minutes
            </span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
            No complicated setup. Just a natural conversation that builds your
            perfect fitness plan.
          </p>
        </div>

        {/* ─── Steps ─── */}
        <div className="relative mx-auto mt-16 max-w-5xl sm:mt-20">
          {/* connector line */}
          <div
            aria-hidden
            className="absolute left-6 top-0 hidden h-full w-px bg-gradient-to-b from-emerald-500/30 via-emerald-500/10 to-transparent lg:left-1/2 lg:block"
          />

          <div className="grid gap-12 lg:gap-16">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`relative flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:gap-16 ${
                  i % 2 !== 0 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Text side */}
                <div className="flex-1 lg:text-left">
                  <span className="inline-block rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-1 font-mono text-xs font-semibold text-emerald-400">
                    Step {step.num}
                  </span>
                  <h3 className="mt-4 text-xl font-semibold text-white sm:text-2xl">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-zinc-400 sm:text-base">
                    {step.desc}
                  </p>
                </div>

                {/* Icon (center marker on desktop) */}
                <div className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-emerald-500/20 bg-[#0a0f0a] shadow-lg shadow-emerald-500/10 lg:order-none">
                  <step.icon className="h-6 w-6 text-emerald-400" />
                </div>

                {/* Empty side (for alternating layout) */}
                <div className="hidden flex-1 lg:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
