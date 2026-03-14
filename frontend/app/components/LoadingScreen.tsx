"use client";

import { useState, useEffect } from "react";
import { m, AnimatePresence } from "framer-motion";
import { Dumbbell } from "lucide-react";

export default function LoadingScreen({ onComplete }: { onComplete?: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      // Call onComplete after the exit animation finishes (600ms)
      setTimeout(() => onComplete?.(), 600);
    }, 1400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[200] bg-[#0a0a0a] flex items-center justify-center"
        >
          <m.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-4"
          >
            {/* Orb glow behind logo */}
            <m.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-40 h-40 rounded-full bg-orange-500/20 blur-[60px]"
            />
            <m.div
              animate={{ rotate: [0, -15, 15, 0] }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="relative"
            >
              <Dumbbell className="w-10 h-10 text-orange-400" />
            </m.div>
            <m.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-lg font-bold tracking-tight text-white/80"
            >
              TrainFree
            </m.span>
            {/* Loading bar */}
            <div className="w-32 h-[2px] bg-white/5 rounded-full overflow-hidden mt-2">
              <m.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="h-full w-full bg-gradient-to-r from-transparent via-orange-400 to-transparent"
              />
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
