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
      "Your AI nutrition companion. Ask about meal plans, macros, supplements, and dietary advice through a simple chat interface.",
    icon: MessageCircle,
    accentClass: "text-violet-400",
    glowClass: "card-glow-mika",
    buttonClass:
      "bg-violet-500 hover:bg-violet-400 text-white shadow-[0_0_20px_rgba(167,139,250,0.25)] hover:shadow-[0_0_35px_rgba(167,139,250,0.4)]",
    orbColor: "#a78bfa",
    tagBg: "bg-violet-400/10 text-violet-400",
    borderColor: "border-violet-500/15 hover:border-violet-400/40",
    spotlightColor: "rgba(167, 139, 250, 0.1)",
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=300&fit=crop&q=80",
    imageAlt: "Healthy meal prep and nutrition planning",
  },
  {
    id: "bheema" as const,
    name: "Bheema",
    role: "Training Agent",
    description:
      "Your AI personal trainer. Speak naturally to get workout plans, form corrections, and real-time coaching powered by voice AI.",
    icon: Mic,
    accentClass: "text-orange-400",
    glowClass: "card-glow-bheema",
    buttonClass:
      "bg-orange-500 hover:bg-orange-400 text-white shadow-[0_0_20px_rgba(251,146,60,0.25)] hover:shadow-[0_0_35px_rgba(251,146,60,0.4)]",
    orbColor: "#fb923c",
    tagBg: "bg-orange-400/10 text-orange-400",
    borderColor: "border-orange-500/15 hover:border-orange-400/40",
    spotlightColor: "rgba(251, 146, 60, 0.1)",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=300&fit=crop&q=80",
    imageAlt: "Person training in a modern gym",
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
    <section id="agents" ref={sectionRef} className="py-32 px-6 bg-[#0a0a0a] relative">
      {/* Animated section divider */}
      <div className="absolute top-0 left-0 right-0 flex justify-center">
        <m.div
          style={{ scaleX: lineScaleX }}
          className="h-[1px] w-full max-w-md gradient-line origin-center"
        />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Section header — staggered */}
        <div className="text-center mb-20">
          <m.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
            className="inline-block px-3 py-1 text-[10px] font-medium tracking-widest uppercase text-white/30 border border-white/10 rounded-full mb-4"
          >
            AI Agents
          </m.span>
          <m.h2
            initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] as const }}
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
          >
            Choose Your Agent
          </m.h2>
          <m.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            className="text-white/35 max-w-md mx-auto leading-relaxed"
          >
            Two specialized AI agents, each designed for a different part of
            your fitness journey.
          </m.p>
        </div>

        {/* Cards — enter from left/right */}
        <div className="grid md:grid-cols-2 gap-8">
          {agents.map((agent, idx) => {
            const Icon = agent.icon;
            const fromLeft = idx === 0;
            return (
              <m.div
                key={agent.id}
                initial={{
                  opacity: 0,
                  x: fromLeft ? -60 : 60,
                  filter: "blur(8px)",
                }}
                whileInView={{
                  opacity: 1,
                  x: 0,
                  filter: "blur(0px)",
                }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.7,
                  delay: idx * 0.15,
                  ease: [0.16, 1, 0.3, 1] as const,
                }}
              >
                <SpotlightCard
                  className={`rounded-2xl border ${agent.borderColor} ${agent.glowClass} bg-white/[0.02] cursor-pointer group transition-colors duration-300`}
                  spotlightColor={agent.spotlightColor}
                  onClick={() => onSelectAgent(agent.id)}
                >
                  {/* Card image + orb overlay */}
                  <div className="relative h-48 overflow-hidden">
                    {/* Fitness image */}
                    <img
                      src={agent.image}
                      alt={agent.imageAlt}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-700 ease-out"
                    />
                    {/* Gradient overlays */}
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/60 via-transparent to-[#0a0a0a]" style={{ zIndex: 1 }} />
                    {/* Orb centered over image */}
                    <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 2 }}>
                      <div className="group-hover:scale-110 transition-transform duration-700 ease-out">
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
                        className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 ${agent.accentClass} group-hover:bg-white/[0.08] transition-colors duration-200`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{agent.name}</h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${agent.tagBg}`}
                        >
                          {agent.role}
                        </span>
                      </div>
                    </div>

                    <p className="text-white/35 text-sm leading-relaxed mb-6 group-hover:text-white/45 transition-colors duration-300">
                      {agent.description}
                    </p>

                    <m.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className={`w-full px-5 py-3 rounded-xl text-sm font-semibold ${agent.buttonClass} transition-all duration-200 flex items-center justify-center gap-2`}
                    >
                      Talk to {agent.name}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
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
