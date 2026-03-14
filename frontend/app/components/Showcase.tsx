"use client";

import { m } from "framer-motion";
import { Mic, Camera, FileText, MessageCircle } from "lucide-react";

const capabilities = [
  {
    icon: MessageCircle,
    label: "Mika",
    title: "Onboarding & Nutrition",
    description:
      "Collects fitness profiles through natural conversation, generates personalized meal plans with macro targets, and emails PDF workout guides — all hands-free.",
    accent: "text-violet-400",
    borderHover: "group-hover:border-violet-400/30",
    iconBg: "bg-violet-400/10 group-hover:bg-violet-400/15",
  },
  {
    icon: Mic,
    label: "Bheema",
    title: "Real-Time Voice Coaching",
    description:
      "Delivers live workout instructions, counts reps by voice, adapts intensity on the fly, and motivates members through every set — like a trainer in their ear.",
    accent: "text-orange-400",
    borderHover: "group-hover:border-orange-400/30",
    iconBg: "bg-orange-400/10 group-hover:bg-orange-400/15",
  },
  {
    icon: Camera,
    label: "Bheema",
    title: "Camera-Based Form Tracking",
    description:
      "Tracks body position in real time using the device camera, counts reps automatically, and provides instant form corrections — no wearable needed.",
    accent: "text-orange-400",
    borderHover: "group-hover:border-orange-400/30",
    iconBg: "bg-orange-400/10 group-hover:bg-orange-400/15",
  },
  {
    icon: FileText,
    label: "Mika",
    title: "Personalized Plan Generation",
    description:
      "After onboarding, auto-generates a custom PDF with workout schedules, diet plans, BMI analysis, and calorie targets — sent directly to the member's email.",
    accent: "text-violet-400",
    borderHover: "group-hover:border-violet-400/30",
    iconBg: "bg-violet-400/10 group-hover:bg-violet-400/15",
  },
];

export default function Showcase() {
  return (
    <section className="py-28 px-6 bg-[#0a0a0a] relative overflow-hidden">
      {/* Subtle aurora wash behind section */}
      <div className="absolute inset-0 aurora-bg opacity-50 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <m.h2
            initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] as const }}
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
          >
            What the Agents Do
          </m.h2>
          <m.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
            className="text-white/50 max-w-lg mx-auto leading-relaxed"
          >
            Each agent handles a distinct part of the fitness journey —
            from first conversation to mid-workout form corrections.
          </m.p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <m.div
                key={cap.title}
                initial={{ opacity: 0, y: 40, filter: "blur(6px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-60px" }}
                whileHover={{ y: -5, transition: { duration: 0.3, ease: [0.25, 1, 0.5, 1] } }}
                transition={{
                  duration: 0.6,
                  delay: idx * 0.1,
                  ease: [0.16, 1, 0.3, 1] as const,
                }}
                className={`group rounded-2xl border border-white/[0.06] ${cap.borderHover} glass-card shimmer-hover p-6 transition-all duration-300 cursor-default`}
              >
                <div className="flex items-start gap-4">
                  <div className={`shrink-0 w-10 h-10 rounded-xl ${cap.iconBg} flex items-center justify-center group-hover:scale-110 group-hover:rotate-[-6deg] transition-all duration-300`}>
                    <Icon className={`w-5 h-5 ${cap.accent}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-base font-semibold group-hover:text-white transition-colors duration-300">{cap.title}</h3>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cap.iconBg} ${cap.accent} group-hover:scale-105 transition-transform duration-200`}>
                        {cap.label}
                      </span>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed group-hover:text-white/55 transition-colors duration-300">
                      {cap.description}
                    </p>
                  </div>
                </div>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
