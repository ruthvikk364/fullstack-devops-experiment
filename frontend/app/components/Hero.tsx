import { ArrowRight, Play } from "lucide-react";

const stats = [
  { value: "10K+", label: "Active Users" },
  { value: "500K+", label: "Workouts Done" },
  { value: "98%", label: "Satisfaction" },
  { value: "24/7", label: "AI Coaching" },
];

export default function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* ─── Background glow ─── */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-[120px]"
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl pt-36 pb-24 text-center sm:pt-44 sm:pb-32 lg:pt-52 lg:pb-40">
          {/* ─── Badge ─── */}
          <div className="animate-fade-up mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-medium tracking-wide text-emerald-300">
              AI-Powered Personal Coaching
            </span>
          </div>

          {/* ─── Heading ─── */}
          <h1 className="animate-fade-up delay-100 text-4xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            Your fitness.{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Reimagined&nbsp;by&nbsp;AI.
            </span>
          </h1>

          {/* ─── Subtitle ─── */}
          <p className="animate-fade-up delay-200 mx-auto mt-6 max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Personalized workouts, smart nutrition plans, and real-time coaching
            that adapts to your body, goals, and lifestyle.
          </p>

          {/* ─── CTAs ─── */}
          <div className="animate-fade-up delay-300 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#"
              className="group inline-flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/30"
            >
              Start Training Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-7 py-3.5 text-sm font-medium text-zinc-300 transition-all hover:border-white/20 hover:text-white"
            >
              <Play className="h-4 w-4" />
              Watch Demo
            </a>
          </div>
        </div>

        {/* ─── Stats ─── */}
        <div className="animate-fade-up delay-400 mx-auto max-w-2xl border-t border-white/[0.06] py-10">
          <dl className="grid grid-cols-2 gap-y-8 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <dd className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {s.value}
                </dd>
                <dt className="mt-1 text-xs font-medium text-zinc-500">
                  {s.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
