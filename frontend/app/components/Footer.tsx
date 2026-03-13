import { Dumbbell } from "lucide-react";

const columns: { heading: string; links: string[] }[] = [
  {
    heading: "Product",
    links: ["Features", "Pricing", "Integrations", "Changelog"],
  },
  {
    heading: "Resources",
    links: ["Documentation", "API Reference", "Blog", "Exercise Library"],
  },
  {
    heading: "Company",
    links: ["About", "Careers", "Press", "Contact"],
  },
  {
    heading: "Legal",
    links: ["Privacy", "Terms", "Cookies"],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* ─── Top ─── */}
        <div className="grid grid-cols-2 gap-8 py-16 sm:grid-cols-3 lg:grid-cols-6 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <a href="#" className="inline-flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500">
                <Dumbbell className="h-[18px] w-[18px] text-white" strokeWidth={2.5} />
              </span>
              <span className="text-lg font-bold tracking-tight">
                Train<span className="text-emerald-400">Free</span>
              </span>
            </a>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-zinc-500">
              AI-powered fitness coaching that adapts to your body, goals, and
              lifestyle. Train smarter, not harder.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {col.heading}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ─── Bottom ─── */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.04] py-8 sm:flex-row">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} TrainFree. All rights reserved.
          </p>
          <p className="text-xs text-zinc-600">
            Powered by AI. Built for athletes.
          </p>
        </div>
      </div>
    </footer>
  );
}
