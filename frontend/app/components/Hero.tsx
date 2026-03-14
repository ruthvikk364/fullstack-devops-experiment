"use client";

import { useRef } from "react";
import { m, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { ChevronDown, Dumbbell, Apple, Flame, Activity } from "lucide-react";
import ReactiveOrb from "./ReactiveOrb";
import MagneticButton from "./MagneticButton";
import ScrollHighlight from "./ScrollHighlight";

/* ── Letter-by-letter stagger for heading ── */
function AnimatedLetters({
  text,
  className,
  delay = 0,
  gradient,
  ready = true,
}: {
  text: string;
  className?: string;
  delay?: number;
  gradient: string;
  ready?: boolean;
}) {
  return (
    <m.span
      initial="hidden"
      animate={ready ? "visible" : "hidden"}
      className={`gradient-text-animate ${className ?? ""}`}
      style={{ backgroundImage: gradient }}
    >
      {text.split("").map((char, i) => (
        <m.span
          key={i}
          variants={{
            hidden: { opacity: 0, y: 40 },
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.5,
                delay: delay + i * 0.03,
                ease: [0.16, 1, 0.3, 1],
              },
            },
          }}
          className="inline-block"
          style={char === " " ? { width: "0.3em" } : undefined}
        >
          {char === " " ? "\u00A0" : char}
        </m.span>
      ))}
    </m.span>
  );
}

export default function Hero({ ready = false }: { ready?: boolean }) {
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
      <m.div style={{ y: orbY, willChange: "transform" }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-[600px] h-[600px] rounded-full bg-orange-500/[0.05] blur-[80px]" />
        <div className="absolute bottom-[20%] right-[15%] w-[500px] h-[500px] rounded-full bg-violet-500/[0.04] blur-[80px]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-white/[0.02] blur-[60px]" />
      </m.div>

      {/* Hero orb — mouse-reactive */}
      <m.div
        style={{ x: springX, y: springY, scale: heroScale }}
        className="absolute pointer-events-none opacity-50"
      >
        <m.div
          initial={{ opacity: 0, scale: 0.3 }}
          animate={ready ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.3 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <ReactiveOrb color="#a78bfa" isActive={false} size={360} />
        </m.div>
      </m.div>

      {/* ── Floating fitness photos — glassy, floating ── */}
      {ready && <m.div
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
      </m.div>}

      {/* Content */}
      <m.div style={{ y: textY, scale: heroScale, opacity: heroOpacity, willChange: "transform, opacity" }} className="relative z-10 text-center max-w-3xl mx-auto px-6 pt-16">
        {/* Heading — letter-by-letter cinematic entrance */}
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
          <AnimatedLetters
            text="Voice AI Agents"
            delay={0.2}
            gradient="linear-gradient(90deg, #fff, #c4b5fd, #fff, #c4b5fd, #fff)"
            ready={ready}
          />
          <br />
          <AnimatedLetters
            text="for Fitness Brands"
            delay={0.65}
            gradient="linear-gradient(90deg, #fb923c, #fbbf24, #fb923c, #fbbf24, #fb923c)"
            ready={ready}
          />
        </h1>

        {/* Subtitle — word-by-word scroll highlight */}
        <m.div
          initial={{ opacity: 0, y: 30 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7, delay: 1.2, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <ScrollHighlight
            text="Your AI nutrition coach and personal trainer, ready to talk."
            className="text-lg text-white max-w-xl mx-auto mb-12 leading-relaxed"
          />
        </m.div>

        {/* CTAs — magnetic buttons */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="flex items-center justify-center gap-4 mb-8"
        >
          <MagneticButton
            href="#agents"
            strength={0.3}
            className="px-8 py-3 rounded-full bg-orange-500 text-white text-sm font-semibold hover:bg-orange-400 transition-colors duration-200 shimmer-hover inline-block"
          >
            Try the Agents
          </MagneticButton>
          <MagneticButton
            href="#features"
            strength={0.3}
            className="px-8 py-3 rounded-full border border-white/15 text-sm text-white/60 hover:text-white backdrop-blur-sm transition-all duration-200 inline-block"
          >
            See How It Works
          </MagneticButton>
        </m.div>

        {/* Scroll indicator */}
        <m.a
          href="#features"
          initial={{ opacity: 0 }}
          animate={ready ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 1.8 }}
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
