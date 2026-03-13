import { Bot, User, Wrench, ChevronRight } from "lucide-react";

interface Msg {
  role: "user" | "ai";
  text: string;
  tool?: { name: string; detail: string };
}

const msgs: Msg[] = [
  {
    role: "user",
    text: "I want to build muscle but I have a shoulder injury. Can you make me a plan?",
  },
  {
    role: "ai",
    text: "Absolutely! I\u2019ll build a program that works around your shoulder while maximising muscle growth.",
    tool: { name: "generate_workout_plan", detail: "muscle_gain \u00b7 shoulder_injury \u00b7 4d/wk" },
  },
  {
    role: "ai",
    text: "Here\u2019s your 4-day upper/lower split. I\u2019ve replaced overhead presses with landmine presses and swapped barbell bench for floor press to protect shoulder ROM. ~55 min/session.",
  },
  {
    role: "user",
    text: "What should I eat today to hit my protein target?",
  },
  {
    role: "ai",
    text: "You\u2019re at 94g protein so far today. To hit your 180g target with 2 meals left, here\u2019s what I\u2019d suggest:",
    tool: { name: "generate_meal_plan", detail: "2650 kcal \u00b7 180g protein \u00b7 2 meals" },
  },
];

const bullets = [
  "Understands injuries & physical limitations",
  "Calls specialized tools for precise plan generation",
  "Adapts in real-time to your feedback",
  "Grounded in sports science via RAG knowledge base",
];

export default function AiDemo() {
  return (
    <section className="relative py-[120px]">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[700px] rounded-full bg-emerald-500/[0.04] blur-[150px]" />

      <div className="section-container relative">
        <div className="grid grid-cols-2 items-center gap-[80px]">
          {/* Left copy */}
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-emerald-400">
              AI Coach in Action
            </p>
            <h2 className="mt-4 text-[48px] font-bold leading-[1.1] tracking-tight">
              A coach that{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                truly understands
              </span>{" "}
              you
            </h2>
            <p className="mt-5 max-w-[440px] text-[17px] leading-[1.7] text-zinc-400">
              TrainFree doesn&apos;t give generic advice. It uses intelligent
              tool calling to generate real plans, calculate nutrition, and
              adapt — all through natural conversation.
            </p>
            <ul className="mt-8 space-y-4">
              {bullets.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <ChevronRight className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="text-[15px] text-zinc-300">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right chat window */}
          <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0a]">
            {/* Title bar */}
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-6 py-4">
              <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
              <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
              <span className="h-3 w-3 rounded-full bg-[#28c840]" />
              <span className="ml-auto text-[12px] font-medium text-zinc-500">
                TrainFree AI Coach
              </span>
            </div>

            {/* Messages */}
            <div className="space-y-5 p-6">
              {msgs.map((m, i) => (
                <div key={i} className="space-y-2">
                  <div className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                    {/* Avatar */}
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        m.role === "ai" ? "bg-emerald-500/10" : "bg-zinc-800"
                      }`}
                    >
                      {m.role === "ai" ? (
                        <Bot className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <User className="h-4 w-4 text-zinc-400" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-3 ${
                        m.role === "user"
                          ? "border border-emerald-500/15 bg-emerald-500/[0.06]"
                          : "border border-white/[0.06] bg-white/[0.03]"
                      }`}
                    >
                      <p className="text-[13px] leading-[1.6] text-zinc-300">{m.text}</p>
                    </div>
                  </div>

                  {m.tool && (
                    <div className={`${m.role === "user" ? "text-right mr-11" : "ml-11"}`}>
                      <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/10 bg-emerald-500/[0.04] px-3 py-1.5">
                        <Wrench className="h-3 w-3 text-emerald-400" />
                        <code className="font-mono text-[11px] text-emerald-300">{m.tool.name}</code>
                        <span className="text-[11px] text-zinc-600">{m.tool.detail}</span>
                      </span>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing */}
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Bot className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="flex gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-600 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-600 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-600 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
