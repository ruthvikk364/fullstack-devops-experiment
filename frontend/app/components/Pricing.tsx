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
    desc: "Full coaching experience for serious athletes.",
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
    desc: "For athletes who want every competitive edge.",
    features: [
      "Everything in Pro",
      "Custom knowledge base (RAG)",
      "Supplement recommendations",
      "Body composition tracking",
      "API access",
      "Calendar sync",
      "Multi-goal programs",
      "Dedicated support channel",
    ],
    cta: "Go Elite",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* ─── Header ─── */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Invest in{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              your best self
            </span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
            Start free and upgrade when you&apos;re ready. No contracts — cancel
            anytime.
          </p>
        </div>

        {/* ─── Cards ─── */}
        <div className="mx-auto mt-16 grid max-w-sm grid-cols-1 gap-6 sm:mt-20 sm:max-w-none sm:grid-cols-3 lg:gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl p-8 ${
                plan.popular
                  ? "border border-emerald-500/20 bg-emerald-500/[0.04] ring-1 ring-emerald-500/10"
                  : "border border-white/[0.04] bg-white/[0.02]"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-0.5 text-[11px] font-bold text-white shadow-lg shadow-emerald-500/30">
                  <Zap className="h-3 w-3" /> MOST POPULAR
                </span>
              )}

              <h3 className="text-sm font-semibold text-zinc-400">
                {plan.name}
              </h3>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">
                  ${plan.price}
                </span>
                <span className="text-sm text-zinc-500">{plan.period}</span>
              </div>

              <p className="mt-2 text-sm text-zinc-500">{plan.desc}</p>

              <a
                href="#"
                className={`mt-8 block rounded-full py-2.5 text-center text-sm font-semibold transition-all ${
                  plan.popular
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
                    : "border border-white/10 text-zinc-300 hover:border-white/20 hover:text-white"
                }`}
              >
                {plan.cta}
              </a>

              <ul className="mt-8 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <span className="text-sm text-zinc-400">{f}</span>
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
