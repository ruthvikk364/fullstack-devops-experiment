"use client";

import { useRef } from "react";
import { m, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { ChevronDown, Dumbbell, Apple, Flame, Activity } from "lucide-react";
import ReactiveOrb from "./ReactiveOrb";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const orbY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.95]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });

  const handleMouse = (e: React.MouseEvent) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    mouseX.set((e.clientX - rect.left - cx) * 0.03);
    mouseY.set((e.clientY - rect.top - cy) * 0.03);
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouse}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]"
    >
      {/* Aurora background — slow-moving color wash */}
      <div className="absolute inset-0 aurora-bg pointer-events-none" />

      {/* Layered depth gradients */}
      <m.div style={{ y: orbY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-[600px] h-[600px] rounded-full bg-orange-500/[0.05] blur-[180px]" />
        <div className="absolute bottom-[20%] right-[15%] w-[500px] h-[500px] rounded-full bg-violet-500/[0.04] blur-[180px]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-white/[0.02] blur-[100px]" />
      </m.div>

      {/* Hero orb — mouse-reactive */}
      <m.div
        style={{ x: springX, y: springY, scale: heroScale }}
        className="absolute pointer-events-none opacity-50"
      >
        <m.div
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <ReactiveOrb color="#a78bfa" isActive={false} size={360} />
        </m.div>
      </m.div>

      {/* ── Floating fitness photos — glassy, floating ── */}
      <m.div
        style={{ y: orbY, opacity: heroOpacity }}
        className="absolute inset-0 hidden lg:block"
      >
        {/* Top-left */}
        <m.div
          initial={{ opacity: 0, x: -60, rotate: -4, scale: 0.8 }}
          animate={{
            opacity: 1, x: 0, rotate: -4, scale: 1,
            y: [0, -8, 0],
          }}
          transition={{
            duration: 1.2, delay: 1.2, ease: [0.16, 1, 0.3, 1] as const,
            y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 },
          }}
          whileHover={{ scale: 1.08, rotate: 0, y: -12, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
          whileTap={{ scale: 0.95 }}
          className="absolute left-[4%] top-[18%] w-52 h-64 rounded-2xl overflow-hidden glass-card shadow-2xl shadow-black/60 cursor-pointer group/card"
        >
          <img
            src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=400&h=500&fit=crop&q=80"
            alt="Solo training"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-110"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/20 to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-2 backdrop-blur-sm bg-black/30 rounded-full px-2.5 py-1">
            <Dumbbell className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[11px] text-white/80 font-medium">Personal training</span>
          </div>
        </m.div>

        {/* Top-right */}
        <m.div
          initial={{ opacity: 0, x: 60, rotate: 3, scale: 0.8 }}
          animate={{
            opacity: 1, x: 0, rotate: 3, scale: 1,
            y: [0, -10, 0],
          }}
          transition={{
            duration: 1.2, delay: 1.4, ease: [0.16, 1, 0.3, 1] as const,
            y: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2.5 },
          }}
          whileHover={{ scale: 1.08, rotate: 0, y: -12, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
          whileTap={{ scale: 0.95 }}
          className="absolute right-[4%] top-[22%] w-48 h-60 rounded-2xl overflow-hidden glass-card shadow-2xl shadow-black/60 cursor-pointer group/card"
        >
          <img
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=500&fit=crop&q=80"
            alt="Healthy nutrition"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-110"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/20 to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-2 backdrop-blur-sm bg-black/30 rounded-full px-2.5 py-1">
            <Apple className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[11px] text-white/80 font-medium">Nutrition plans</span>
          </div>
        </m.div>

        {/* Bottom-left */}
        <m.div
          initial={{ opacity: 0, y: 50, rotate: 2, scale: 0.8 }}
          animate={{
            opacity: 1, y: [0, -6, 0], rotate: 2, scale: 1,
          }}
          transition={{
            duration: 1.2, delay: 1.6, ease: [0.16, 1, 0.3, 1] as const,
            y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 3 },
          }}
          whileHover={{ scale: 1.08, rotate: 0, y: -12, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
          whileTap={{ scale: 0.95 }}
          className="absolute left-[10%] bottom-[12%] w-44 h-56 rounded-2xl overflow-hidden glass-card shadow-2xl shadow-black/60 cursor-pointer group/card"
        >
          <img
            src="https://images.unsplash.com/photo-1576678927484-cc907957088c?w=400&h=500&fit=crop&q=80"
            alt="Voice-guided workout"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-110"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/20 to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-2 backdrop-blur-sm bg-black/30 rounded-full px-2.5 py-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[11px] text-white/80 font-medium">Voice coaching</span>
          </div>
        </m.div>

        {/* Bottom-right */}
        <m.div
          initial={{ opacity: 0, y: 50, rotate: -3, scale: 0.8 }}
          animate={{
            opacity: 1, y: [0, -9, 0], rotate: -3, scale: 1,
          }}
          transition={{
            duration: 1.2, delay: 1.8, ease: [0.16, 1, 0.3, 1] as const,
            y: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 3.5 },
          }}
          whileHover={{ scale: 1.08, rotate: 0, y: -12, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
          whileTap={{ scale: 0.95 }}
          className="absolute right-[8%] bottom-[15%] w-44 h-56 rounded-2xl overflow-hidden glass-card shadow-2xl shadow-black/60 cursor-pointer group/card"
        >
          <img
            src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=500&fit=crop&q=80"
            alt="Real-time form tracking"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-110"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/90 via-[#0a0a0a]/20 to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-2 backdrop-blur-sm bg-black/30 rounded-full px-2.5 py-1">
            <Activity className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[11px] text-white/80 font-medium">Form tracking</span>
          </div>
        </m.div>
      </m.div>

      {/* Content */}
      <m.div style={{ y: textY, scale: heroScale, opacity: heroOpacity }} className="relative z-10 text-center max-w-3xl mx-auto px-6 pt-16">
        {/* Heading — cinematic entrance */}
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
          <m.span
            initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
            className="inline-block"
          >
            Voice AI Agents
          </m.span>
          <br />
          <m.span
            initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] as const }}
            className="inline-block text-orange-400"
          >
            for Fitness Brands
          </m.span>
        </h1>

        {/* Subtitle */}
        <m.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.85, ease: [0.16, 1, 0.3, 1] as const }}
          className="text-lg text-white/60 max-w-xl mx-auto mb-12 leading-relaxed"
        >
          Deploy Mika for nutrition coaching and Bheema for real-time
          personal training — white-label voice AI that keeps your members engaged.
        </m.p>

        {/* CTAs */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          <m.a
            href="#agents"
            whileHover={{ scale: 1.04, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-3 rounded-full bg-orange-500 text-white text-sm font-semibold hover:bg-orange-400 transition-colors duration-200 shimmer-hover"
          >
            Try the Agents
          </m.a>
          <m.a
            href="#features"
            whileHover={{ scale: 1.04, y: -2, borderColor: "rgba(255,255,255,0.25)" }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-3 rounded-full border border-white/15 text-sm text-white/60 hover:text-white backdrop-blur-sm transition-all duration-200"
          >
            See How It Works
          </m.a>
        </m.div>

        {/* Scroll indicator */}
        <m.a
          href="#features"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="inline-flex flex-col items-center gap-1 text-xs text-white/20 hover:text-white/40 transition-colors cursor-pointer"
        >
          <m.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-4 h-4" />
          </m.div>
        </m.a>
      </m.div>
    </section>
  );
}
