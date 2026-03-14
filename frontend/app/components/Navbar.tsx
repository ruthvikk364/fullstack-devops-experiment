"use client";

import { useEffect, useState } from "react";
import { m, useScroll, useTransform } from "framer-motion";
import { Dumbbell, LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";

const sections = [
  { id: "features", label: "Features" },
  { id: "agents", label: "Agents" },
];

export default function Navbar() {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 100], [0, 0.9]);
  const borderOpacity = useTransform(scrollY, [0, 100], [0, 0.06]);
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  // Active section tracking
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { threshold: 0.3, rootMargin: "-80px 0px -40% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

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
          <Dumbbell className="w-5 h-5 text-orange-400 group-hover:rotate-[-12deg] transition-transform duration-300" />
          <span className="text-lg font-bold tracking-tight">TrainFree</span>
        </m.a>
        <div className="flex items-center gap-6 text-sm text-white/40">
          {sections.map(({ id, label }) => (
            <a
              key={id}
              href={`#${id}`}
              className={`relative hover:text-white transition-colors duration-200 ${
                activeSection === id ? "text-white" : ""
              }`}
            >
              {label}
              {/* Animated active indicator */}
              <m.div
                className="absolute -bottom-[4px] left-0 right-0 h-[1px] bg-orange-400"
                initial={false}
                animate={{
                  scaleX: activeSection === id ? 1 : 0,
                  opacity: activeSection === id ? 1 : 0,
                }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ originX: 0.5 }}
              />
            </a>
          ))}
          <m.a
            href="#agents"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="px-5 py-1.5 rounded-full bg-orange-500 text-white font-medium hover:bg-orange-400 transition-colors duration-200"
          >
            Try Demo
          </m.a>
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <img
                    src={user.user_metadata?.avatar_url}
                    alt={user.user_metadata?.full_name ?? "User"}
                    className="w-8 h-8 rounded-full border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    onClick={signOut}
                    className="text-white/40 hover:text-white transition-colors duration-200"
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <m.button
                  onClick={signInWithGoogle}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="px-4 py-1.5 rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-colors duration-200"
                >
                  Sign In
                </m.button>
              )}
            </>
          )}
        </div>
      </div>
    </m.nav>
  );
}
