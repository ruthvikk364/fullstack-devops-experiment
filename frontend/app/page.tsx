"use client";

import { useState } from "react";
import { m, useScroll, useSpring } from "framer-motion";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import Showcase from "./components/Showcase";
import AgentCards from "./components/AgentCards";
import VoiceInterface from "./components/VoiceInterface";
import Footer from "./components/Footer";

export default function Home() {
  const [activeAgent, setActiveAgent] = useState<"mika" | "bheema" | null>(
    null
  );

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="bg-[#0a0a0a] min-h-screen">
      {/* Scroll progress — thin, solid, no glow */}
      <m.div
        style={{ scaleX, transformOrigin: "left" }}
        className="fixed top-0 left-0 right-0 h-[2px] bg-orange-400 z-[60]"
      />
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <Features />
        <Showcase />
        <AgentCards onSelectAgent={setActiveAgent} />
      </main>
      <Footer />
      <VoiceInterface
        agent={activeAgent}
        onClose={() => setActiveAgent(null)}
      />
    </div>
  );
}
