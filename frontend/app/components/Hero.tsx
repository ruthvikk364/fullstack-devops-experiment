import { ArrowRight, Play } from "lucide-react";

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-[160px] pb-[120px]">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-[200px] left-1/2 -translate-x-1/2 h-[600px] w-[900px] rounded-full bg-emerald-500/[0.07] blur-[140px]" />

      <div className="section-container relative text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-5 py-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <span className="text-[13px] font-medium tracking-wide text-emerald-300">
            AI-Powered Personal Coaching
          </span>
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-[800px] text-[72px] font-bold leading-[1.05] tracking-tight">
          Your fitness.
          <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            Reimagined by AI.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-7 max-w-[560px] text-[18px] leading-[1.7] text-zinc-400">
          Personalized workouts, smart nutrition plans, and real-time coaching
          that adapts to your body, goals, and lifestyle.
        </p>

        {/* CTAs */}
        <div className="mt-12 flex items-center justify-center gap-5">
          <a
            href="#"
            className="group flex items-center gap-2.5 rounded-full bg-emerald-500 px-8 py-4 text-[15px] font-semibold text-white shadow-[0_0_32px_rgba(16,185,129,0.25)] transition-all hover:bg-emerald-400 hover:shadow-[0_0_48px_rgba(16,185,129,0.35)]"
          >
            Start Training Free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </a>
          <a
            href="#"
            className="flex items-center gap-2.5 rounded-full border border-white/[0.1] px-8 py-4 text-[15px] font-medium text-zinc-300 transition-all hover:border-white/[0.2] hover:text-white"
          >
            <Play className="h-4 w-4" />
            Watch Demo
          </a>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-[80px] flex max-w-[700px] items-center justify-between border-t border-white/[0.06] pt-[40px]">
          {[
            { val: "10K+", label: "Active Users" },
            { val: "500K+", label: "Workouts Done" },
            { val: "98%", label: "Satisfaction" },
            { val: "24/7", label: "AI Coaching" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-[32px] font-bold tracking-tight text-white">{s.val}</div>
              <div className="mt-1 text-[13px] text-zinc-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
