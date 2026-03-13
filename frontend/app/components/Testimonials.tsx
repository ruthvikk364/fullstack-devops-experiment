import { Star } from "lucide-react";

interface T {
  initials: string;
  name: string;
  role: string;
  text: string;
}

const data: T[] = [
  {
    initials: "AM",
    name: "Arjun Mehta",
    role: "Software Engineer",
    text: "I\u2019ve tried every fitness app out there. TrainFree is the first one that feels like a real personal trainer. It adjusted my plan when I tweaked my knee \u2014 no app has ever done that.",
  },
  {
    initials: "SC",
    name: "Sarah Chen",
    role: "Marketing Director",
    text: "The nutrition tracking is insane. I just say what I ate in plain English and it figures out the macros. Lost 12 lbs in 8 weeks without feeling like I\u2019m dieting.",
  },
  {
    initials: "MJ",
    name: "Marcus Johnson",
    role: "College Athlete",
    text: "The AI knows when to push and when to back off. It recommended a deload week right before I was about to burn out. It reads my body better than I can.",
  },
  {
    initials: "PS",
    name: "Priya Sharma",
    role: "Yoga Instructor",
    text: "Love how it integrates with my Garmin. It uses HRV and sleep data to adjust workout intensity. The science-backed approach gives me total confidence.",
  },
  {
    initials: "DK",
    name: "David Kim",
    role: "Startup Founder",
    text: "Zero time for planning. Having an AI that plans meals and workouts in a 2-minute chat is life-changing. Best shape of my life at 38.",
  },
  {
    initials: "ER",
    name: "Elena Rodriguez",
    role: "Physical Therapist",
    text: "Professionally impressed by the injury-awareness. It correctly avoids contraindicated exercises and suggests safe, effective alternatives. Really well built.",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-[120px]">
      <div className="section-container">
        {/* Header */}
        <div className="text-center">
          <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-emerald-400">
            Testimonials
          </p>
          <h2 className="mt-4 text-[48px] font-bold leading-tight tracking-tight">
            Loved by{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              thousands
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-[400px] text-[17px] leading-relaxed text-zinc-400">
            Real people, real transformations.
          </p>
        </div>

        {/* Grid */}
        <div className="mt-[64px] grid grid-cols-3 gap-6">
          {data.map((t) => (
            <div
              key={t.name}
              className="flex flex-col rounded-2xl border border-white/[0.05] bg-white/[0.02] p-8 transition-all duration-300 hover:border-emerald-500/15 hover:bg-white/[0.04]"
            >
              {/* Stars */}
              <div className="mb-5 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="flex-1 text-[15px] leading-[1.7] text-zinc-400">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="mt-7 flex items-center gap-3 border-t border-white/[0.05] pt-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[12px] font-bold text-white">
                  {t.initials}
                </div>
                <div>
                  <p className="text-[14px] font-medium text-white">{t.name}</p>
                  <p className="text-[12px] text-zinc-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
