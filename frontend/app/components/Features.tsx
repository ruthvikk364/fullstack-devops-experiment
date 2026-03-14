"use client";

import { m, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  Dumbbell,
  Apple,
  Mic,
  Brain,
  Clock,
  TrendingUp,
} from "lucide-react";

const features = [
  {
    icon: Mic,
    title: "Voice-First Coaching",
    description:
      "Just speak naturally. No typing, no scrolling through apps mid-workout.",
    accent: "text-violet-400",
    bg: "bg-violet-400/5 border-violet-400/10",
  },
  {
    icon: Brain,
    title: "AI That Adapts to You",
    description:
      "Your agents learn your preferences, goals, and progress over time.",
    accent: "text-orange-400",
    bg: "bg-orange-400/5 border-orange-400/10",
  },
  {
    icon: Dumbbell,
    title: "No Trainer Needed",
    description:
      "Get expert-level workout programming without the gym-floor price tag.",
    accent: "text-violet-400",
    bg: "bg-violet-400/5 border-violet-400/10",
  },
  {
    icon: Apple,
    title: "Nutrition on Demand",
    description:
      "Meal plans, macro tracking, and dietary advice — all through a quick chat.",
    accent: "text-orange-400",
    bg: "bg-orange-400/5 border-orange-400/10",
  },
  {
    icon: Clock,
    title: "Available 24/7",
    description:
      "Early morning or late night session — your AI partners never clock out.",
    accent: "text-violet-400",
    bg: "bg-violet-400/5 border-violet-400/10",
  },
  {
    icon: TrendingUp,
    title: "Track Your Progress",
    description:
      "Built-in tracking helps you see results and stay on course with your goals.",
    accent: "text-orange-400",
    bg: "bg-orange-400/5 border-orange-400/10",
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start 0.3"],
  });
  const lineScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      ref={sectionRef}
      className="py-32 px-6 bg-[#0a0a0a] relative"
    >
      {/* Divider */}
      <div className="absolute top-0 left-0 right-0 flex justify-center">
        <m.div
          style={{ scaleX: lineScaleX }}
          className="h-[1px] w-full max-w-md gradient-line origin-center"
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <m.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
            className="inline-block px-3 py-1 text-[10px] font-medium tracking-widest uppercase text-white/30 border border-white/10 rounded-full mb-4"
          >
            Why TrainFree
          </m.span>
          <m.h2
            initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 0.6,
              delay: 0.1,
              ease: [0.16, 1, 0.3, 1] as const,
            }}
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
          >
            Train Smarter, Not Harder
          </m.h2>
          <m.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 0.5,
              delay: 0.2,
              ease: [0.16, 1, 0.3, 1] as const,
            }}
            className="text-white/35 max-w-lg mx-auto leading-relaxed"
          >
            Your AI fitness partners bring the expertise of a personal trainer
            and nutritionist — right to your voice.
          </m.p>
        </div>

        {/* Feature grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <m.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.08,
                  ease: [0.16, 1, 0.3, 1] as const,
                }}
                className={`group rounded-2xl border ${feature.bg} p-6 hover:bg-white/[0.03] transition-all duration-300`}
              >
                <div
                  className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 ${feature.accent} mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-white/35 leading-relaxed">
                  {feature.description}
                </p>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
