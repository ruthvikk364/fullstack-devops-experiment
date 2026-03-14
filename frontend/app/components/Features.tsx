"use client";

import { m, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  Mic,
  Shield,
  Zap,
  Users,
  BarChart3,
  Puzzle,
} from "lucide-react";
import SpotlightCard from "./SpotlightCard";

const features = [
  {
    icon: Mic,
    title: "Voice-First Experience",
    description:
      "Members talk naturally — no typing, no UI friction. Coaching happens through conversation.",
    accent: "text-orange-400",
    accentBorder: "group-hover:border-orange-400/30",
    iconBg: "bg-orange-400/10 group-hover:bg-orange-400/15",
    spotlightColor: "rgba(251, 146, 60, 0.08)",
  },
  {
    icon: Users,
    title: "Two Specialized Agents",
    description:
      "Mika handles nutrition and onboarding. Bheema coaches workouts with real-time form tracking.",
    accent: "text-violet-400",
    accentBorder: "group-hover:border-violet-400/30",
    iconBg: "bg-violet-400/10 group-hover:bg-violet-400/15",
    spotlightColor: "rgba(167, 139, 250, 0.08)",
  },
  {
    icon: Zap,
    title: "Real-Time Coaching",
    description:
      "Live voice responses, rep counting via camera, and instant form corrections during workouts.",
    accent: "text-orange-400",
    accentBorder: "group-hover:border-orange-400/30",
    iconBg: "bg-orange-400/10 group-hover:bg-orange-400/15",
    spotlightColor: "rgba(251, 146, 60, 0.08)",
  },
  {
    icon: Puzzle,
    title: "White-Label Ready",
    description:
      "Embed into your existing app or deploy standalone. Your brand, our AI infrastructure.",
    accent: "text-violet-400",
    accentBorder: "group-hover:border-violet-400/30",
    iconBg: "bg-violet-400/10 group-hover:bg-violet-400/15",
    spotlightColor: "rgba(167, 139, 250, 0.08)",
  },
  {
    icon: BarChart3,
    title: "Member Insights",
    description:
      "Track onboarding completion, workout engagement, and nutrition plan adoption across your user base.",
    accent: "text-orange-400",
    accentBorder: "group-hover:border-orange-400/30",
    iconBg: "bg-orange-400/10 group-hover:bg-orange-400/15",
    spotlightColor: "rgba(251, 146, 60, 0.08)",
  },
  {
    icon: Shield,
    title: "Always Available",
    description:
      "24/7 coaching at a fraction of the cost of human trainers. Scale without scaling headcount.",
    accent: "text-violet-400",
    accentBorder: "group-hover:border-violet-400/30",
    iconBg: "bg-violet-400/10 group-hover:bg-violet-400/15",
    spotlightColor: "rgba(167, 139, 250, 0.08)",
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start 0.3"],
  });
  const lineScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  // Parallax: cards at different rows move at slightly different speeds
  const { scrollYProgress: parallaxProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const row1Y = useTransform(parallaxProgress, [0, 1], [30, -15]);
  const row2Y = useTransform(parallaxProgress, [0, 1], [50, -25]);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="pt-20 pb-32 px-6 bg-[#0a0a0a] relative scroll-mt-16"
    >
      <div className="absolute top-0 left-0 right-0 flex justify-center">
        <m.div
          style={{ scaleX: lineScaleX }}
          className="h-[1px] w-full max-w-md bg-gradient-to-r from-transparent via-white/10 to-transparent origin-center"
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <m.h2
            initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
          >
            Built for Fitness Businesses
          </m.h2>
          <m.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
            className="text-white/50 max-w-lg mx-auto leading-relaxed"
          >
            Give your members AI coaching that actually listens — voice agents
            purpose-built for training and nutrition.
          </m.p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            const row = Math.floor(idx / 3);
            const yOffset = row === 0 ? row1Y : row2Y;

            return (
              <m.div
                key={feature.title}
                initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.6,
                  delay: idx * 0.1,
                  ease: [0.16, 1, 0.3, 1] as const,
                }}
                style={{ y: yOffset }}
              >
                <SpotlightCard
                  className={`group rounded-2xl border border-white/[0.06] ${feature.accentBorder} glass-card shimmer-hover p-6 transition-all duration-300 cursor-default h-full`}
                  spotlightColor={feature.spotlightColor}
                >
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${feature.iconBg} ${feature.accent} mb-4 group-hover:scale-110 group-hover:rotate-[-6deg] transition-all duration-300`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold mb-2 group-hover:text-white transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-white/40 leading-relaxed group-hover:text-white/55 transition-colors duration-300">
                    {feature.description}
                  </p>
                </SpotlightCard>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
