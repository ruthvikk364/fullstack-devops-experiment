"use client";

import { useRef } from "react";
import { m, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { ChevronDown, Dumbbell, Apple, Flame } from "lucide-react";
import ReactiveOrb from "./ReactiveOrb";

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Parallax: orbs and grid move at different speeds
  const orbY = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const gridOpacity = useTransform(scrollYProgress, [0, 0.5], [0.025, 0]);

  // Mouse tracking for hero orb
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

  // Word-by-word stagger for heading
  const headingWords = ["Meet", "Your", "AI"];

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouse}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0a]"
    >
      {/* Background gradient orbs with parallax */}
      <m.div style={{ y: orbY }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-violet-500/[0.07] blur-[150px] orb-float" />
        <div
          className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] rounded-full bg-orange-400/[0.06] blur-[150px] orb-float"
          style={{ animationDelay: "-3s" }}
        />
      </m.div>

      {/* Grid with scroll-driven opacity */}
      <m.div
        style={{ opacity: gridOpacity }}
        className="absolute inset-0 pointer-events-none"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </m.div>

      {/* ── Hero orb centerpiece — mouse-reactive ── */}
      <m.div
        style={{ x: springX, y: springY }}
        className="absolute pointer-events-none"
      >
        <m.div
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <ReactiveOrb color="#a78bfa" isActive={false} size={480} />
        </m.div>
      </m.div>

      {/* ── Floating fitness photos ── */}
      <m.div
        style={{ y: orbY }}
        className="absolute inset-0 pointer-events-none hidden lg:block"
      >
        {/* Left photo — person training solo */}
        <m.div
          initial={{ opacity: 0, x: -40, rotate: -6 }}
          animate={{ opacity: 1, x: 0, rotate: -6 }}
          transition={{ duration: 1, delay: 1.4, ease: [0.16, 1, 0.3, 1] as const }}
          className="absolute left-[5%] top-[20%] w-44 h-56 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50"
        >
          <img
            src="https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=300&h=400&fit=crop&q=80"
            alt="Solo training"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] text-white/60 font-medium">No trainer needed</span>
          </div>
        </m.div>

        {/* Right photo — nutrition / healthy food */}
        <m.div
          initial={{ opacity: 0, x: 40, rotate: 4 }}
          animate={{ opacity: 1, x: 0, rotate: 4 }}
          transition={{ duration: 1, delay: 1.6, ease: [0.16, 1, 0.3, 1] as const }}
          className="absolute right-[5%] top-[25%] w-40 h-52 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50"
        >
          <img
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=300&h=400&fit=crop&q=80"
            alt="Healthy nutrition"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
            <Apple className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-[10px] text-white/60 font-medium">AI nutrition plans</span>
          </div>
        </m.div>

        {/* Bottom-left — person with earbuds working out */}
        <m.div
          initial={{ opacity: 0, y: 30, rotate: 3 }}
          animate={{ opacity: 1, y: 0, rotate: 3 }}
          transition={{ duration: 1, delay: 1.8, ease: [0.16, 1, 0.3, 1] as const }}
          className="absolute left-[12%] bottom-[15%] w-36 h-48 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50"
        >
          <img
            src="https://images.unsplash.com/photo-1576678927484-cc907957088c?w=300&h=400&fit=crop&q=80"
            alt="Working out with earbuds"
            className="w-full h-full object-cover"
            loading="eager"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/80 to-transparent" />
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] text-white/60 font-medium">Voice-guided</span>
          </div>
        </m.div>
      </m.div>

      {/* Content with parallax */}
      <m.div style={{ y: textY }} className="relative z-10 text-center max-w-3xl mx-auto px-6">
        {/* Badge */}
        <m.div
          initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
          className="mb-6"
        >
          <span className="inline-block px-4 py-1.5 text-xs font-medium tracking-widest uppercase text-violet-300 border border-violet-400/20 rounded-full bg-violet-400/5 shimmer">
            Voice-Powered AI
          </span>
        </m.div>

        {/* Heading — staggered word reveal */}
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
          {headingWords.map((word, i) => (
            <m.span
              key={word}
              initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                duration: 0.6,
                delay: 0.5 + i * 0.12,
                ease: [0.16, 1, 0.3, 1] as const,
              }}
              className="inline-block mr-[0.3em]"
            >
              {word}
            </m.span>
          ))}
          <br />
          <m.span
            initial={{ opacity: 0, y: 40, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.7,
              delay: 0.9,
              ease: [0.16, 1, 0.3, 1] as const,
            }}
            className="inline-block"
          >
            <m.span
              className="bg-gradient-to-r from-violet-400 via-fuchsia-300 to-orange-300 bg-clip-text text-transparent bg-[length:200%_auto]"
              animate={{ backgroundPosition: ["0% center", "200% center"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            >
              Training Partners
            </m.span>
          </m.span>
        </h1>

        {/* Subtitle */}
        <m.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.1, ease: [0.16, 1, 0.3, 1] as const }}
          className="text-lg text-white/45 max-w-xl mx-auto mb-12 leading-relaxed"
        >
          Talk to Mika for nutrition guidance or Bheema for personalized
          training — powered by real-time voice AI.
        </m.p>

        {/* CTAs */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.6 }}
          className="flex items-center justify-center gap-4 mb-16"
        >
          <m.a
            href="#agents"
            whileHover={{ scale: 1.05, boxShadow: "0 0 50px rgba(167,139,250,0.5)" }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-3 rounded-full bg-violet-500 text-white text-sm font-semibold shadow-[0_0_30px_rgba(167,139,250,0.3)] hover:bg-violet-400 transition-colors duration-200"
          >
            Explore Agents
          </m.a>
          <m.a
            href="#agents"
            whileHover={{ scale: 1.05, borderColor: "rgba(255,255,255,0.25)" }}
            whileTap={{ scale: 0.97 }}
            className="px-8 py-3 rounded-full border border-white/10 text-sm text-white/50 hover:text-white transition-all duration-200"
          >
            Learn More
          </m.a>
        </m.div>

        {/* Scroll indicator */}
        <m.a
          href="#agents"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="inline-flex flex-col items-center gap-1 text-xs text-white/20 hover:text-white/40 transition-colors cursor-pointer"
        >
          <span>Scroll</span>
          <m.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="w-4 h-4" />
          </m.div>
        </m.a>
      </m.div>
    </section>
  );
}
