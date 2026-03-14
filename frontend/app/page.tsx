"use client";

import { useState, useEffect, useRef } from "react";
import { m, useScroll, useSpring, AnimatePresence } from "framer-motion";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Showcase from "./components/Showcase";
import AgentCards, { type CardRect } from "./components/AgentCards";
import VoiceInterface from "./components/VoiceInterface";
import Footer from "./components/Footer";
import Particles from "./components/Particles";
import CursorTrail from "./components/CursorTrail";
import LoadingScreen from "./components/LoadingScreen";

export default function Home() {
  const [activeAgent, setActiveAgent] = useState<"mika" | "bheema" | null>(null);
  const [cardRect, setCardRect] = useState<CardRect>({ x: 0, y: 0, width: 300, height: 400 });
  const [heroReady, setHeroReady] = useState(false);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const handleSelectAgent = (agent: "mika" | "bheema", rect: CardRect) => {
    setCardRect(rect);
    setActiveAgent(agent);
  };

  // ── Exit-intent: pulse CTA when cursor leaves toward top ──
  const [showExitPulse, setShowExitPulse] = useState(false);
  const [exitDismissed, setExitDismissed] = useState(false);

  useEffect(() => {
    if (exitDismissed) return;
    const handleLeave = (e: MouseEvent) => {
      if (e.clientY <= 5 && !exitDismissed) {
        setShowExitPulse(true);
        setTimeout(() => setShowExitPulse(false), 3000);
        setExitDismissed(true);
      }
    };
    document.addEventListener("mouseleave", handleLeave);
    return () => document.removeEventListener("mouseleave", handleLeave);
  }, [exitDismissed]);

  return (
    <div className="bg-[#0a0a0a] min-h-screen">
      {/* Loading screen */}
      <LoadingScreen onComplete={() => setHeroReady(true)} />

      {/* Particles background */}
      <Particles />

      {/* Cursor trail */}
      <CursorTrail />

      {/* Scroll progress — thin, solid, no glow */}
      <m.div
        style={{ scaleX, transformOrigin: "left" }}
        className="fixed top-0 left-0 right-0 h-[2px] bg-orange-400 z-[60]"
      />
      <Navbar />
      <m.div
        animate={{
          scale: activeAgent ? 0.92 : 1,
          opacity: activeAgent ? 0.3 : 1,
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 origin-center"
        style={activeAgent ? { filter: "blur(10px)" } : undefined}
      >
        <main>
          <Hero ready={heroReady} />
          <Features />
          <Showcase />
          <AgentCards onSelectAgent={handleSelectAgent} />
        </main>
        <Footer />
      </m.div>
      <VoiceInterface
        agent={activeAgent}
        onClose={() => setActiveAgent(null)}
      />

      {/* Exit-intent CTA toast */}
      <AnimatePresence>
        {showExitPulse && (
          <m.div
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-2xl glass-card border border-orange-500/20 shadow-2xl shadow-orange-500/10"
          >
            <m.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-2 h-2 rounded-full bg-orange-400"
            />
            <span className="text-sm text-white/70">
              Ready to try the AI agents?
            </span>
            <a
              href="#agents"
              onClick={() => setShowExitPulse(false)}
              className="text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
            >
              Try Now
            </a>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
