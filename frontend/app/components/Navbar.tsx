"use client";

import { m, useScroll, useTransform } from "framer-motion";
import { Zap, Dumbbell } from "lucide-react";

export default function Navbar() {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 100], [0, 0.85]);
  const borderOpacity = useTransform(scrollY, [0, 100], [0, 0.05]);

  return (
    <m.nav
      style={{
        backgroundColor: `rgba(10, 10, 10, ${bgOpacity})`,
        borderBottomColor: `rgba(255, 255, 255, ${borderOpacity})`,
      }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b"
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <m.a
          href="#"
          className="flex items-center gap-2 group"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Dumbbell className="w-5 h-5 text-violet-400 group-hover:text-orange-400 transition-colors duration-300" />
          <span className="text-lg font-bold tracking-tight">TrainFree</span>
        </m.a>
        <div className="flex items-center gap-6 text-sm text-white/40">
          <a
            href="#agents"
            className="hover:text-white transition-colors duration-300"
          >
            Agents
          </a>
          <m.a
            href="#agents"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-1.5 rounded-full border border-white/10 hover:border-violet-400/30 hover:text-white hover:bg-white/5 transition-all duration-300"
          >
            Get Started
          </m.a>
        </div>
      </div>
    </m.nav>
  );
}
