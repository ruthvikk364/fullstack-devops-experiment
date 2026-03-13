"use client";

import { useState, useEffect } from "react";
import { Dumbbell } from "lucide-react";

const links = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.06]"
          : ""
      }`}
    >
      <div className="section-container flex h-[72px] items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
            <Dumbbell className="h-5 w-5 text-white" strokeWidth={2.5} />
          </span>
          <span className="text-[20px] font-bold tracking-tight">
            Train<span className="text-emerald-400">Free</span>
          </span>
        </a>

        {/* Center nav */}
        <nav className="flex items-center gap-10">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[14px] text-zinc-400 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Right CTAs */}
        <div className="flex items-center gap-5">
          <a href="#" className="text-[14px] text-zinc-400 transition-colors hover:text-white">
            Sign in
          </a>
          <a
            href="#"
            className="rounded-full bg-emerald-500 px-6 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-emerald-400 hover:shadow-[0_0_24px_rgba(16,185,129,0.3)]"
          >
            Get Started
          </a>
        </div>
      </div>
    </header>
  );
}
