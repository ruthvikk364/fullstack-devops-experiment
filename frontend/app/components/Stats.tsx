"use client";

import { useEffect, useRef, useState } from "react";
import { m, useInView } from "framer-motion";

const stats = [
  { value: 10000, suffix: "+", label: "Active Members", prefix: "" },
  { value: 2, suffix: "", label: "AI Agents", prefix: "" },
  { value: 24, suffix: "/7", label: "Availability", prefix: "" },
  { value: 98, suffix: "%", label: "Satisfaction Rate", prefix: "" },
];

function Counter({ value, suffix, prefix }: { value: number; suffix: string; prefix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);

  const display = value >= 10000 ? `${prefix}${(count / 1000).toFixed(count >= value ? 0 : 1)}K${suffix}` : `${prefix}${count}${suffix}`;

  return <span ref={ref}>{display}</span>;
}

export default function Stats() {
  return (
    <section className="py-20 px-6 bg-[#0a0a0a] relative">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <m.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.6,
                delay: idx * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="text-center"
            >
              <div className="text-3xl sm:text-4xl font-bold tracking-tight mb-1">
                <span className="gradient-text-animate" style={{
                  backgroundImage: idx % 2 === 0
                    ? "linear-gradient(90deg, #fb923c, #fbbf24, #fb923c)"
                    : "linear-gradient(90deg, #a78bfa, #c4b5fd, #a78bfa)",
                }}>
                  <Counter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/40 tracking-wide">{stat.label}</p>
            </m.div>
          ))}
        </div>
      </div>
    </section>
  );
}
