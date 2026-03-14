"use client";

import { m, useScroll, useTransform } from "framer-motion";
import { Dumbbell, LogOut } from "lucide-react";
import { useAuth } from "./AuthProvider";

export default function Navbar() {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 100], [0, 0.9]);
  const borderOpacity = useTransform(scrollY, [0, 100], [0, 0.06]);
  const { user, loading, signInWithGoogle, signOut } = useAuth();

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
          <a
            href="#features"
            className="hover:text-white transition-colors duration-200 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1px] after:bg-white/40 hover:after:w-full after:transition-all after:duration-300"
          >
            Features
          </a>
          <a
            href="#agents"
            className="hover:text-white transition-colors duration-200 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[1px] after:bg-white/40 hover:after:w-full after:transition-all after:duration-300"
          >
            Agents
          </a>
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
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 text-white/70 hover:text-white hover:border-white/20 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
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
