import { Bot, User, Wrench, ChevronRight } from "lucide-react";

interface Message {
  role: "user" | "ai";
  text: string;
  tool?: { name: string; detail: string };
}

const messages: Message[] = [
  {
    role: "user",
    text: "I want to build muscle but I have a shoulder injury. Can you make me a plan?",
  },
  {
    role: "ai",
    text: "Of course! I\u2019ll design a program that works around your shoulder while maximising muscle growth.",
    tool: {
      name: "generate_workout_plan",
      detail: "muscle_gain \u00b7 shoulder_injury \u00b7 4 days",
    },
  },
  {
    role: "ai",
    text: "Done! Here\u2019s your 4-day upper/lower split. I\u2019ve swapped overhead presses for landmine presses and replaced barbell bench with floor press to protect your shoulder ROM.",
  },
  {
    role: "user",
    text: "What should I eat today to hit my protein target?",
  },
  {
    role: "ai",
    text: "Based on your 2,650 cal target and 180 g protein goal, here\u2019s what I\u2019d suggest for the rest of today:",
    tool: {
      name: "generate_meal_plan",
      detail: "2650 kcal \u00b7 180 g protein \u00b7 2 meals left",
    },
  },
];

export default function AiDemo() {
  return (
    <section className="relative isolate py-24 sm:py-32">
      {/* glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.05] blur-[140px]"
      />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          {/* ─── Copy ─── */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              AI Coach in Action
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              A coach that{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                truly understands
              </span>{" "}
              you
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
              TrainFree doesn&apos;t give generic advice. It uses intelligent
              tool calling to generate real workout plans, calculate nutrition,
              and adapt — all through natural conversation.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "Understands injuries & limitations",
                "Calls specialized tools for precise plans",
                "Adapts in real-time to your feedback",
                "Grounded in sports science via RAG",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <ChevronRight className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="text-sm text-zinc-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── Chat window ─── */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            {/* title bar */}
            <div className="flex items-center gap-2 border-b border-white/[0.04] px-5 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-auto text-[11px] font-medium text-zinc-600">
                TrainFree AI Coach
              </span>
            </div>

            {/* messages */}
            <div className="space-y-4 p-5">
              {messages.map((m, i) => (
                <div key={i} className="space-y-2">
                  <div
                    className={`flex items-start gap-3 ${
                      m.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    {/* avatar */}
                    <div
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${
                        m.role === "ai"
                          ? "bg-emerald-500/10"
                          : "bg-zinc-800"
                      }`}
                    >
                      {m.role === "ai" ? (
                        <Bot className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <User className="h-3.5 w-3.5 text-zinc-400" />
                      )}
                    </div>

                    {/* bubble */}
                    <div
                      className={`max-w-[78%] rounded-xl px-3.5 py-2.5 ${
                        m.role === "user"
                          ? "border border-emerald-500/15 bg-emerald-500/[0.08]"
                          : "border border-white/[0.06] bg-white/[0.03]"
                      }`}
                    >
                      <p className="text-[13px] leading-relaxed text-zinc-300">
                        {m.text}
                      </p>
                    </div>
                  </div>

                  {/* tool badge */}
                  {m.tool && (
                    <div className="ml-10 inline-flex items-center gap-1.5 rounded-md border border-emerald-500/10 bg-emerald-500/[0.04] px-2.5 py-1">
                      <Wrench className="h-3 w-3 text-emerald-400" />
                      <code className="font-mono text-[11px] text-emerald-300">
                        {m.tool.name}
                      </code>
                      <span className="text-[11px] text-zinc-600">
                        {m.tool.detail}
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* typing indicator */}
              <div className="flex items-start gap-3">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-emerald-500/10">
                  <Bot className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div className="flex gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
