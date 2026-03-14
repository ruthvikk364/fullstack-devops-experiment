"use client";

import { m } from "framer-motion";
import { Mic, MessageCircle, Headphones } from "lucide-react";

const images = [
  {
    src: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&h=400&fit=crop&q=80",
    alt: "Person training solo with focus",
    caption: "Train on your terms",
  },
  {
    src: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop&q=80",
    alt: "Healthy meal prep and nutrition",
    caption: "Nutrition, simplified",
  },
  {
    src: "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&h=400&fit=crop&q=80",
    alt: "Woman working out with earbuds",
    caption: "AI coaching in your ear",
  },
];

export default function Showcase() {
  return (
    <section className="py-28 px-6 bg-[#0a0a0a] relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-500/[0.03] blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <m.span
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
            className="inline-block px-3 py-1 text-[10px] font-medium tracking-widest uppercase text-white/30 border border-white/10 rounded-full mb-4"
          >
            How It Works
          </m.span>
          <m.h2
            initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 0.6,
              delay: 0.1,
              ease: [0.16, 1, 0.3, 1] as const,
            }}
            className="text-4xl sm:text-5xl font-bold tracking-tight mb-4"
          >
            Your Gym. Your Voice. Your AI.
          </m.h2>
          <m.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{
              duration: 0.5,
              delay: 0.2,
              ease: [0.16, 1, 0.3, 1] as const,
            }}
            className="text-white/35 max-w-lg mx-auto leading-relaxed"
          >
            No personal trainer hovering. No generic plans. Just AI that listens,
            learns, and coaches in real time.
          </m.p>
        </div>

        {/* Image grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {images.map((img, idx) => (
            <m.div
              key={img.alt}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.6,
                delay: idx * 0.12,
                ease: [0.16, 1, 0.3, 1] as const,
              }}
              className="group relative rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors duration-300"
            >
              <div className="aspect-[3/2] overflow-hidden">
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-sm font-medium text-white/80">
                  {img.caption}
                </p>
              </div>
            </m.div>
          ))}
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              icon: Headphones,
              title: "Put in your earbuds",
              desc: "Open TrainFree and choose your agent — Mika for nutrition or Bheema for training.",
              accent: "text-violet-400",
            },
            {
              step: "02",
              icon: Mic,
              title: "Speak naturally",
              desc: "Tell Bheema your goals or ask Mika about your diet. No scripts, just conversation.",
              accent: "text-orange-400",
            },
            {
              step: "03",
              icon: MessageCircle,
              title: "Get instant guidance",
              desc: "Receive personalized workout plans, form tips, meal ideas, and real-time coaching.",
              accent: "text-violet-400",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <m.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.5,
                  delay: idx * 0.1,
                  ease: [0.16, 1, 0.3, 1] as const,
                }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/5 mb-5">
                  <Icon className={`w-6 h-6 ${item.accent}`} />
                </div>
                <p className="text-xs text-white/20 font-mono mb-2">
                  {item.step}
                </p>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-white/35 leading-relaxed max-w-xs mx-auto">
                  {item.desc}
                </p>
              </m.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
