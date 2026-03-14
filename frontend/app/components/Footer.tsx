"use client";

import { m } from "framer-motion";
import { Dumbbell } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-12 px-6 bg-[#0a0a0a] relative overflow-hidden">
      {/* Subtle gradient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-violet-500/[0.03] blur-[100px] pointer-events-none" />

      <m.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/25 relative z-10"
      >
        <m.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.03 }}
        >
          <Dumbbell className="w-4 h-4 text-violet-400" />
          <span className="font-medium text-white/40">TrainFree</span>
        </m.div>
        <p>&copy; {new Date().getFullYear()} TrainFree. AI-powered fitness, no trainer required.</p>
      </m.div>
    </footer>
  );
}
