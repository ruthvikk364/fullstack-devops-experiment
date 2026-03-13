import { ArrowRight } from "lucide-react";

export default function Cta() {
  return (
    <section className="py-[120px]">
      <div className="section-container">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-500/10 bg-gradient-to-b from-emerald-500/[0.06] to-transparent px-16 py-[80px] text-center">
          {/* Glow */}
          <div className="pointer-events-none absolute -top-[100px] left-1/2 -translate-x-1/2 h-[300px] w-[500px] rounded-full bg-emerald-500/[0.1] blur-[100px]" />

          <div className="relative">
            <h2 className="mx-auto max-w-[640px] text-[48px] font-bold leading-[1.1] tracking-tight">
              Ready to transform your{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                fitness journey
              </span>
              ?
            </h2>

            <p className="mx-auto mt-6 max-w-[460px] text-[17px] leading-relaxed text-zinc-400">
              Join thousands who&apos;ve ditched generic programs for AI coaching
              that actually works. Start free — no credit card required.
            </p>

            <div className="mt-10 flex items-center justify-center gap-5">
              <a
                href="#"
                className="group inline-flex items-center gap-2.5 rounded-full bg-emerald-500 px-8 py-4 text-[15px] font-semibold text-white shadow-[0_0_32px_rgba(16,185,129,0.25)] transition-all hover:bg-emerald-400 hover:shadow-[0_0_48px_rgba(16,185,129,0.35)]"
              >
                Get Started — It&apos;s Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <span className="text-[14px] text-zinc-500">
                No credit card required
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
