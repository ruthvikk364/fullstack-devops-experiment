import { Star } from "lucide-react";

interface Testimonial {
  initials: string;
  name: string;
  role: string;
  text: string;
}

const testimonials: Testimonial[] = [
  {
    initials: "AM",
    name: "Arjun Mehta",
    role: "Software Engineer",
    text: "I\u2019ve tried every fitness app out there. TrainFree is the first one that actually feels like a real personal trainer. It adjusted my plan when I tweaked my knee \u2014 no app has ever done that.",
  },
  {
    initials: "SC",
    name: "Sarah Chen",
    role: "Marketing Director",
    text: "The nutrition tracking is insane. I just tell it what I ate in plain English and it figures out the macros. I\u2019ve lost 12 pounds in 8 weeks without feeling like I\u2019m dieting.",
  },
  {
    initials: "MJ",
    name: "Marcus Johnson",
    role: "College Athlete",
    text: "The AI knows when to push me and when to back off. It recommended a deload week right before I was about to burn out. It\u2019s like it reads my body better than I can.",
  },
  {
    initials: "PS",
    name: "Priya Sharma",
    role: "Yoga Instructor",
    text: "I love how it integrates with my Garmin. It uses my HRV and sleep data to adjust workout intensity. The science-backed approach gives me confidence in every recommendation.",
  },
  {
    initials: "DK",
    name: "David Kim",
    role: "Startup Founder",
    text: "As someone with zero time, having an AI that plans my meals and workouts in a 2-minute chat is life-changing. I\u2019m in the best shape of my life at 38.",
  },
  {
    initials: "ER",
    name: "Elena Rodriguez",
    role: "Physical Therapist",
    text: "From a professional standpoint, I\u2019m impressed by the injury-awareness. It correctly avoids contraindicated exercises and suggests safe, effective alternatives.",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* ─── Header ─── */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Testimonials
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Loved by{" "}
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              thousands
            </span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
            Real people, real transformations. Here&apos;s what our community
            says.
          </p>
        </div>

        {/* ─── Grid ─── */}
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-5 sm:mt-20 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="flex flex-col rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6 transition-all duration-300 hover:border-emerald-500/15 hover:bg-white/[0.04]"
            >
              {/* stars */}
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>

              {/* quote */}
              <p className="flex-1 text-sm leading-relaxed text-zinc-400">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* author */}
              <div className="mt-6 flex items-center gap-3 border-t border-white/[0.04] pt-5">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
