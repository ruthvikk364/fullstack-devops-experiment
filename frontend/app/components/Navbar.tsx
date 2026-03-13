"use client";

import { useState, useEffect } from "react";
import { Menu, X, Dumbbell } from "lucide-react";

const links = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-[#050505]/80 backdrop-blur-xl border-b border-white/[0.04]" : ""
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:h-[72px] lg:px-8">
        {/* ─── Logo ─── */}
        <a href="#" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500">
            <Dumbbell className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Train<span className="text-emerald-400">Free</span>
          </span>
        </a>

        {/* ─── Desktop links ─── */}
        <ul className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-[13px] font-medium text-zinc-400 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        {/* ─── Desktop CTAs ─── */}
        <div className="hidden items-center gap-3 md:flex">
          <a
            href="#"
            className="text-[13px] font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Sign in
          </a>
          <a
            href="#"
            className="rounded-full bg-emerald-500 px-5 py-2 text-[13px] font-semibold text-white transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25"
          >
            Get Started
          </a>
        </div>

        {/* ─── Mobile toggle ─── */}
        <button
          onClick={() => setOpen(!open)}
          className="grid h-9 w-9 place-items-center rounded-lg text-zinc-400 transition-colors hover:text-white md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* ─── Mobile menu ─── */}
      {open && (
        <div className="border-t border-white/[0.04] bg-[#050505]/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-6 py-4">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-4 border-t border-white/[0.04] pt-4">
              <a
                href="#"
                className="block rounded-full bg-emerald-500 py-2.5 text-center text-sm font-semibold text-white"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
