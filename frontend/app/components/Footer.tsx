import { Dumbbell } from "lucide-react";

const cols = [
  { heading: "Product", links: ["Features", "Pricing", "Integrations", "Changelog"] },
  { heading: "Resources", links: ["Docs", "API Reference", "Blog", "Exercise Library"] },
  { heading: "Company", links: ["About", "Careers", "Press", "Contact"] },
  { heading: "Legal", links: ["Privacy", "Terms", "Cookies"] },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.05]">
      <div className="section-container">
        <div className="grid grid-cols-6 gap-12 py-[72px]">
          {/* Brand — spans 2 cols */}
          <div className="col-span-2">
            <a href="#" className="inline-flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500">
                <Dumbbell className="h-5 w-5 text-white" strokeWidth={2.5} />
              </span>
              <span className="text-[20px] font-bold tracking-tight">
                Train<span className="text-emerald-400">Free</span>
              </span>
            </a>
            <p className="mt-4 max-w-[260px] text-[14px] leading-[1.7] text-zinc-500">
              AI-powered fitness coaching that adapts to your body, goals, and
              lifestyle. Train smarter, not harder.
            </p>
          </div>

          {/* Link columns */}
          {cols.map((c) => (
            <div key={c.heading}>
              <h4 className="text-[12px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                {c.heading}
              </h4>
              <ul className="mt-5 space-y-3">
                {c.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-[14px] text-zinc-500 transition-colors hover:text-zinc-300">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex items-center justify-between border-t border-white/[0.05] py-8">
          <p className="text-[13px] text-zinc-600">
            &copy; {new Date().getFullYear()} TrainFree. All rights reserved.
          </p>
          <p className="text-[13px] text-zinc-600">
            Powered by AI. Built for athletes.
          </p>
        </div>
      </div>
    </footer>
  );
}
