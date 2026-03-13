import { ArrowRight } from "lucide-react";

export default function Cta() {
  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-3xl border border-emerald-500/10 bg-gradient-to-b from-emerald-500/[0.06] to-transparent px-8 py-20 text-center sm:px-16 sm:py-28">
          {/* glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 left-1/2 -z-10 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-emerald-500/[0.12] blur-[100px]"
          />

          <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Ready to transform your{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              fitness journey
            </span>
            ?
          </h2>

          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-zinc-400 sm:text-lg">
            Join thousands who&apos;ve ditched generic programs for AI coaching
            that actually works. Start free — no credit card required.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#"
              className="group inline-flex items-center gap-2 rounded-full bg-emerald-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/35"
            >
              Get Started — It&apos;s Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <span className="text-sm text-zinc-500">
              No credit card required
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
