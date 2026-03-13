import { Check, Zap } from "lucide-react";

interface Plan {
  name: string;
  price: string;
  period: string;
  desc: string;
  features: string[];
  cta: string;
  popular: boolean;
}

const plans: Plan[] = [
  {
    name: "Starter",
    price: "0",
    period: "Free forever",
    desc: "Get started with AI-powered fitness basics.",
    features: [
      "AI coach — 20 messages / day",
      "Basic workout generation",
      "Manual food logging",
      "Progress dashboard",
      "Community access",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "19",
    period: "per month",
    desc: "Full coaching for serious athletes.",
    features: [
      "Unlimited AI coaching",
      "Advanced periodization",
      "Smart nutrition plans & macros",
      "Wearable sync (Fitbit, Garmin)",
      "Progress analytics & predictions",
      "Exercise video demos",
      "Weekly AI check-ins",
      "Priority support",
    ],
    cta: "Start 14-Day Trial",
    popular: true,
  },
  {
    name: "Elite",
    price: "39",
    period: "per month",
    desc: "For athletes who want every edge.",
    features: [
      "Everything in Pro",
      "Custom knowledge base (RAG)",
      "Supplement recommendations",
      "Body composition tracking",
      "API access",
      "Calendar sync",
      "Multi-goal programs",
      "Dedicated support",
    ],
    cta: "Go Elite",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-[120px]">
      <div className="section-container">
        {/* Header */}
        <div className="text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-emerald-400">
            Pricing
          </p>
          <h2 className="mt-4 text-[48px] font-bold leading-tight tracking-tight">
            Invest in{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              your best self
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-[440px] text-[17px] leading-relaxed text-zinc-400">
            Start free and upgrade when you&apos;re ready. No contracts — cancel
            anytime.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-[64px] grid grid-cols-3 items-start gap-8">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl p-9 ${
                p.popular
                  ? "border-2 border-emerald-500/25 bg-emerald-500/[0.04] shadow-[0_0_40px_rgba(16,185,129,0.06)]"
                  : "border border-white/[0.05] bg-white/[0.02]"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-1 text-[12px] font-bold text-white shadow-[0_4px_16px_rgba(16,185,129,0.3)]">
                  <Zap className="h-3 w-3" /> MOST POPULAR
                </span>
              )}

              <p className="text-[14px] font-semibold text-zinc-400">{p.name}</p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-[48px] font-bold leading-none text-white">${p.price}</span>
                <span className="text-[14px] text-zinc-500">{p.period}</span>
              </div>

              <p className="mt-3 text-[14px] text-zinc-500">{p.desc}</p>

              <a
                href="#"
                className={`mt-8 block rounded-full py-3 text-center text-[14px] font-semibold transition-all ${
                  p.popular
                    ? "bg-emerald-500 text-white shadow-[0_0_24px_rgba(16,185,129,0.2)] hover:bg-emerald-400"
                    : "border border-white/[0.1] text-zinc-300 hover:border-white/[0.2] hover:text-white"
                }`}
              >
                {p.cta}
              </a>

              <ul className="mt-9 flex-1 space-y-4">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-[18px] w-[18px] shrink-0 text-emerald-400" />
                    <span className="text-[14px] text-zinc-400">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
