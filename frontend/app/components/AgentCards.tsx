"use client";

import { m, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { MessageCircle, Mic, ArrowRight } from "lucide-react";
import ReactiveOrb from "./ReactiveOrb";
import SpotlightCard from "./SpotlightCard";

interface AgentCardsProps {
  onSelectAgent: (agent: "mika" | "bheema") => void;
}

const agents = [
  {
    id: "mika" as const,
    name: "Mika",
    role: "Nutrition Agent",
    description:
      "Handles member onboarding, collects fitness profiles, generates personalized meal plans, and delivers PDF guides — all through voice or chat.",
    icon: MessageCircle,
    accentClass: "text-violet-400",
    buttonClass: "bg-violet-500 hover:bg-violet-400 text-white",
    orbColor: "#a78bfa",
    tagBg: "bg-violet-400/10 text-violet-400",
    borderColor: "border-violet-500/15 hover:border-violet-400/30",
    spotlightColor: "rgba(167, 139, 250, 0.12)",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=300&fit=crop&q=80",
    imageAlt: "Colorful healthy meal bowl with fresh vegetables",
  },
  {
    id: "bheema" as const,
    name: "Bheema",
    role: "Training Agent",
    description:
      "Delivers real-time voice coaching, counts reps via camera, corrects form on the fly, and adapts workout intensity to the member's performance.",
    icon: Mic,
    accentClass: "text-orange-400",
    buttonClass: "bg-orange-500 hover:bg-orange-400 text-white",
    orbColor: "#fb923c",
    tagBg: "bg-orange-400/10 text-orange-400",
    borderColor: "border-orange-500/15 hover:border-orange-400/30",
    spotlightColor: "rgba(251, 146, 60, 0.12)",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&h=300&fit=crop&q=80",
    imageAlt: "Person lifting weights in focused training session",
  },
];

export default function AgentCards({ onSelectAgent }: AgentCardsProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "start 0.4"],
  });
  const lineScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="agents" ref={sectionRef} className="pt-20 pb-32 px-6 bg-[#0a0a0a] relative scroll-mt-16">
      <div className="absolute top-0 left-0 right-0 flex justify-center">
        <m.div
          style={{ scaleX: lineScaleX }}
          className="h-[1px] w-full max-w-md bg-gradient-to-r from-transparent via-white/10 to-transparent origin-center"
        />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <m.span
            initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
            className="inline-block px-3 py-1 text-[10px] font-medium tracking-widest uppercase text-white/30 border border-white/10 rounded-full mb-4"
          >
            Try It Live
          </m.span>
          <m.h2
            initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const }}
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
          >
            Meet the Agents
          </m.h2>
          <m.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            className="text-white/50 max-w-md mx-auto leading-relaxed"
          >
            Two specialized voice agents your members interact with directly.
            Click to try a live demo.
          </m.p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {agents.map((agent, idx) => {
            const Icon = agent.icon;
            const fromLeft = idx === 0;
            return (
              <m.div
                key={agent.id}
                initial={{
                  opacity: 0,
                  x: fromLeft ? -80 : 80,
                  filter: "blur(10px)",
                  scale: 0.92,
                }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                  filter: "blur(0px)",
                  scale: 1,
                }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.8,
                  delay: idx * 0.15,
                  ease: [0.16, 1, 0.3, 1] as const,
                }}
              >
                <SpotlightCard
                  className={`rounded-2xl border ${agent.borderColor} glass-card cursor-pointer group transition-all duration-300`}
                  spotlightColor={agent.spotlightColor}
                  onClick={() => onSelectAgent(agent.id)}
                >
                  {/* Card image + orb overlay */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={agent.image}
                      alt={agent.imageAlt}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-55 group-hover:scale-105 transition-all duration-700 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-transparent to-[#0a0a0a]" style={{ zIndex: 1 }} />
                    <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
                      <div className="group-hover:scale-115 transition-transform duration-700 ease-out">
                        <ReactiveOrb
                          color={agent.orbColor}
                          isActive={false}
                          size={160}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-8 pt-2 relative z-20">
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 ${agent.accentClass} group-hover:bg-white/[0.08] group-hover:scale-110 transition-all duration-300`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{agent.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${agent.tagBg}`}>
                          {agent.role}
                        </span>
                      </div>
                    </div>

                    <p className="text-white/35 text-sm leading-relaxed mb-6 group-hover:text-white/50 transition-colors duration-300">
                      {agent.description}
                    </p>

                    <m.button
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      className={`w-full px-5 py-3 rounded-xl text-sm font-semibold ${agent.buttonClass} transition-all duration-200 flex items-center justify-center gap-2 shimmer-hover`}
                    >
                      Talk to {agent.name}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
                    </m.button>
                  </div>
                </SpotlightCard>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
