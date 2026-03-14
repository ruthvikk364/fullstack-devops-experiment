"use client";

import { useState, useEffect, useRef } from "react";
import { m, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Dumbbell, LogOut, ChevronDown, Activity, User, BarChart3 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

interface StoredProfile {
  name?: string;
  email?: string;
  weight_kg?: number;
  height_cm?: number;
  target_weight_kg?: number;
  fitness_goal?: string;
  diet_preference?: string;
  bmi?: {
    bmi_value: number;
    category: string;
    daily_calories: number;
    daily_protein_g: number;
    daily_carbs_g: number;
    daily_fat_g: number;
    strategy: string;
  } | null;
}

const sections = [
  { id: "features", label: "Features" },
  { id: "agents", label: "Agents" },
];

export default function Navbar() {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 100], [0, 0.9]);
  const borderOpacity = useTransform(scrollY, [0, 100], [0, 0.06]);
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load profile from localStorage
  useEffect(() => {
    const loadProfile = () => {
      try {
        const stored = localStorage.getItem("trainfree_profile");
        if (stored) setProfile(JSON.parse(stored));
      } catch {}
    };
    loadProfile();
    window.addEventListener("trainfree_profile_updated", loadProfile);
    return () => window.removeEventListener("trainfree_profile_updated", loadProfile);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [dropdownOpen]);

  const displayName = profile?.name || user?.user_metadata?.full_name || "User";
  const goalLabel = profile?.fitness_goal?.replace("_", " ") || null;

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
          {user && profile && (
            <Link
              href="/dashboard"
              className="hover:text-white transition-colors duration-200 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1px] after:bg-orange-400/60 hover:after:w-full after:transition-all after:duration-300 flex items-center gap-1.5"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Dashboard
            </Link>
          )}
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
                <div className="relative" ref={dropdownRef}>
                  <m.button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 p-1 rounded-full border border-white/10 hover:border-white/20 transition-all"
                  >
                    <img
                      src={user.user_metadata?.avatar_url}
                      alt={displayName}
                      className="w-8 h-8 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                    <ChevronDown className={`w-3.5 h-3.5 text-white/40 mr-1 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                  </m.button>

                  {/* ── Profile Dropdown ── */}
                  <AnimatePresence>
                    {dropdownOpen && (
                      <m.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-[#141414] border border-white/8 shadow-2xl shadow-black/50 overflow-hidden"
                      >
                        {/* User info */}
                        <div className="px-4 pt-4 pb-3 border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <img
                              src={user.user_metadata?.avatar_url}
                              alt={displayName}
                              className="w-10 h-10 rounded-xl"
                              referrerPolicy="no-referrer"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-semibold text-sm truncate">{displayName}</p>
                              <p className="text-white/30 text-[11px] truncate">{user.email}</p>
                            </div>
                          </div>
                          {goalLabel && (
                            <div className="flex items-center gap-2 mt-2.5">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-medium uppercase tracking-wider">
                                {goalLabel}
                              </span>
                              {profile?.diet_preference && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/35 font-medium">
                                  {profile.diet_preference}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* BMI & Health Stats */}
                        {profile?.bmi && (
                          <div className="px-4 py-3 border-b border-white/5">
                            <div className="flex items-center gap-2 mb-2.5">
                              <Activity className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-[11px] text-white/50 font-medium">Health Overview</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-white/[0.03] rounded-lg px-3 py-2">
                                <p className="text-sm font-bold text-white">{profile.bmi.bmi_value?.toFixed(1)}</p>
                                <p className="text-[9px] text-white/25 mt-0.5">BMI — {profile.bmi.category}</p>
                              </div>
                              <div className="bg-white/[0.03] rounded-lg px-3 py-2">
                                <p className="text-sm font-bold text-orange-400">{profile.bmi.daily_calories}</p>
                                <p className="text-[9px] text-white/25 mt-0.5">Daily Calories</p>
                              </div>
                              <div className="bg-white/[0.03] rounded-lg px-3 py-2">
                                <p className="text-sm font-bold text-blue-400">{profile.bmi.daily_protein_g}g</p>
                                <p className="text-[9px] text-white/25 mt-0.5">Protein</p>
                              </div>
                              <div className="bg-white/[0.03] rounded-lg px-3 py-2">
                                <p className="text-sm font-bold text-emerald-400">{profile.weight_kg}kg</p>
                                <p className="text-[9px] text-white/25 mt-0.5">Current Weight</p>
                              </div>
                            </div>
                            <p className="text-[10px] text-white/20 mt-2 leading-relaxed">{profile.bmi.strategy}</p>
                          </div>
                        )}

                        {/* No profile yet */}
                        {!profile?.bmi && (
                          <div className="px-4 py-3 border-b border-white/5">
                            <div className="flex items-center gap-2.5 text-white/25">
                              <User className="w-4 h-4" />
                              <p className="text-[11px]">Talk to Mika to get your health profile</p>
                            </div>
                          </div>
                        )}

                        {/* Dashboard link */}
                        {profile && (
                          <Link
                            href="/dashboard"
                            onClick={() => setDropdownOpen(false)}
                            className="w-full px-4 py-3 flex items-center gap-2.5 text-white/40 hover:text-orange-400 hover:bg-white/[0.03] transition-all text-xs border-b border-white/5"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                            Dashboard
                          </Link>
                        )}

                        {/* Sign out */}
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            signOut();
                          }}
                          className="w-full px-4 py-3 flex items-center gap-2.5 text-white/40 hover:text-white/70 hover:bg-white/[0.03] transition-all text-xs"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign out
                        </button>
                      </m.div>
                    )}
                  </AnimatePresence>
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
