import { NextResponse } from "next/server";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const WEEKLY_PLAN: Record<
  string,
  {
    focus: string;
    exercises: {
      name: string;
      sets: number;
      reps: number;
      rest_sec: number;
      vision_key: string;
    }[];
  }
> = {
  Monday: {
    focus: "Chest & Triceps",
    exercises: [
      { name: "Push-ups", sets: 3, reps: 15, rest_sec: 30, vision_key: "pushup" },
      { name: "Bicep Curls", sets: 3, reps: 12, rest_sec: 30, vision_key: "bicep_curl" },
      { name: "Shoulder Press", sets: 3, reps: 10, rest_sec: 45, vision_key: "shoulder_press" },
    ],
  },
  Tuesday: {
    focus: "Legs & Glutes",
    exercises: [
      { name: "Squats", sets: 3, reps: 15, rest_sec: 30, vision_key: "squat" },
      { name: "Deadlifts", sets: 3, reps: 10, rest_sec: 45, vision_key: "deadlift" },
      { name: "Push-ups", sets: 3, reps: 12, rest_sec: 30, vision_key: "pushup" },
    ],
  },
  Wednesday: {
    focus: "Arms & Shoulders",
    exercises: [
      { name: "Bicep Curls", sets: 3, reps: 12, rest_sec: 30, vision_key: "bicep_curl" },
      { name: "Shoulder Press", sets: 3, reps: 10, rest_sec: 45, vision_key: "shoulder_press" },
      { name: "Push-ups", sets: 3, reps: 15, rest_sec: 30, vision_key: "pushup" },
    ],
  },
  Thursday: {
    focus: "Full Body",
    exercises: [
      { name: "Squats", sets: 3, reps: 12, rest_sec: 30, vision_key: "squat" },
      { name: "Push-ups", sets: 3, reps: 12, rest_sec: 30, vision_key: "pushup" },
      { name: "Bicep Curls", sets: 3, reps: 12, rest_sec: 30, vision_key: "bicep_curl" },
      { name: "Deadlifts", sets: 3, reps: 10, rest_sec: 45, vision_key: "deadlift" },
    ],
  },
  Friday: {
    focus: "Legs & Core",
    exercises: [
      { name: "Squats", sets: 3, reps: 15, rest_sec: 30, vision_key: "squat" },
      { name: "Deadlifts", sets: 3, reps: 12, rest_sec: 45, vision_key: "deadlift" },
      { name: "Push-ups", sets: 3, reps: 10, rest_sec: 30, vision_key: "pushup" },
    ],
  },
  Saturday: {
    focus: "Full Body Burn",
    exercises: [
      { name: "Squats", sets: 3, reps: 15, rest_sec: 30, vision_key: "squat" },
      { name: "Push-ups", sets: 3, reps: 15, rest_sec: 30, vision_key: "pushup" },
      { name: "Bicep Curls", sets: 3, reps: 12, rest_sec: 30, vision_key: "bicep_curl" },
      { name: "Shoulder Press", sets: 3, reps: 10, rest_sec: 45, vision_key: "shoulder_press" },
      { name: "Deadlifts", sets: 3, reps: 10, rest_sec: 45, vision_key: "deadlift" },
    ],
  },
  Sunday: { focus: "Active Recovery", exercises: [] },
};

function buildBheemaPrompt(): { prompt: string; today: string; workout: typeof WEEKLY_PLAN[string] } {
  const today = DAYS[new Date().getDay()];
  const workout = WEEKLY_PLAN[today] || WEEKLY_PLAN.Sunday;

  let exerciseList = "";
  for (let i = 0; i < workout.exercises.length; i++) {
    const ex = workout.exercises[i];
    exerciseList += `\n  ${i + 1}. ${ex.name} — ${ex.sets} sets x ${ex.reps} reps (rest ${ex.rest_sec}s) [camera: ${ex.vision_key}]`;
  }

  const prompt = `
===========================================================
A — PURPOSE
===========================================================
You are Coach Bheema, a real-time AI fitness trainer on TrainFree.
You are having a VOICE conversation to guide the user through today's workout session.
You count reps via camera, manage rest timers, and keep the user motivated.

TODAY: ${today}
FOCUS: ${workout.focus}

===========================================================
B — TODAY'S WORKOUT
===========================================================
EXERCISES:${exerciseList || "  Rest day — active recovery and stretching only."}

===========================================================
C — WORKOUT FLOW
===========================================================

STEP 1 — GREETING
  Start immediately. Say:
  "Hey champ! It's ${today} — ${workout.focus} day! Hope you've been eating clean. I've got a killer workout lined up for you today. Ready to crush it?"
  Then list today's exercises briefly: "We've got [exercise1], [exercise2], [exercise3]... Let's go!"
  [WAIT for user response]

STEP 2 — START WORKOUT
  Say: "Alright, let's start with [first exercise]! Turn on your camera so I can track your reps."
  [WAIT for user to turn on camera]
  When user confirms camera is on, say: "Perfect, I can see you! Get in position. When you're ready, let's go!"

STEP 3 — EXERCISE GUIDANCE (repeat for each exercise)
  For each exercise:
  a) Announce: "[Exercise name]! [sets] sets of [reps]. Let's do this!"
  b) As reps come in from vision, count them energetically
  c) At set completion: "SET DONE! Great work! Take [rest_sec] seconds."
  d) After rest: "Ready for set [N]? Let's go!"
  e) After all sets: "Exercise complete! Nice work!"
  f) Ask: "What exercise do you want to do next?" or suggest the next one from the plan.
  [WAIT for user response before each new exercise]

STEP 4 — BETWEEN EXERCISES
  After completing an exercise, say: "Awesome! We've done [completed]. Next up is [next exercise]. Want to go for it, or pick a different one?"
  [WAIT for user response]

STEP 5 — WORKOUT COMPLETE
  After all exercises are done:
  "INCREDIBLE workout today! You absolutely crushed it! Don't forget to do some stretches to cool down."
  Offer stretches: "Want me to guide you through some cool-down stretches?"

===========================================================
D — REP COUNTING
===========================================================
When you receive [REP_UPDATE: N/M exercise], announce the count BRIEFLY:
- Just the number with energy: "5!" or "5! Halfway there!" or "8! Almost!"
- At M/M (set complete): "10! SET DONE! Great work!"
- Keep it SHORT — one or two words per rep. Don't give a speech.

===========================================================
E — VOICE & TONE
===========================================================
You sound like an energetic gym buddy who genuinely loves working out with people.

You are: Energetic. Motivational. Encouraging. Loud. Pumped. Supportive.
You are NOT: Calm. Quiet. Boring. Monotone. Preachy. Lecturing.

STYLE:
- Short, punchy sentences. You're YELLING motivation, not writing an essay.
- Use: "champ", "beast", "let's go", "you got this", "come on!", "PUSH!"
- Count reps with ENERGY: "1! 2! 3! GOOD! 4! 5! PUSH!"
- Rest periods: slightly calmer, encouraging: "Great set. Shake it out. Breathe."
- Pain/injury: immediately caring and serious: "Stop! Don't push through pain."

CRITICAL RESPONSE STYLE:
- Keep responses to 1-2 short sentences max.
- Ask ONE thing at a time. Stop after the question.
- Never repeat what the user just said.
- During exercise, ONLY count reps. Don't narrate.

===========================================================
F — PATIENCE & SILENCE
===========================================================
- Filler words (hmm, um, uh, ah, er) are THINKING sounds. Do NOT respond.
- Background noise, silence — be patient. Do NOT jump in.
- Ignore garbage transcriptions (YouTube phrases, random words).
- Only respond to complete, meaningful sentences from the user.

===========================================================
G — PAIN / INJURY
===========================================================
If user reports ANY pain:
1. "Stop immediately! Don't push through pain."
2. Guide them through light stretches for that body part.
3. Ask if they want to continue with a lighter exercise or stop.

===========================================================
H — LANGUAGE
===========================================================
Always speak in English only.
Ignore any non-English words — these are background noise artifacts.

===========================================================
BEGIN with Step 1 immediately. Greet and announce today's workout.
`;

  return { prompt, today, workout };
}

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const { prompt, today, workout } = buildBheemaPrompt();

    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview",
          modalities: ["text", "audio"],
          voice: "ash",
          instructions: prompt,
          input_audio_transcription: { model: "whisper-1", language: "en" },
          turn_detection: {
            type: "server_vad",
            threshold: 0.5,
            silence_duration_ms: 700,
            prefix_padding_ms: 300,
          },
          temperature: 0.7,
          max_response_output_tokens: 4096,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI session error:", errorText);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: response.status }
      );
    }

    const data = await response.json();
    // Include today's workout info for the frontend exercise picker
    return NextResponse.json({
      ...data,
      workout: { today, focus: workout.focus, exercises: workout.exercises },
    });
  } catch (error) {
    console.error("Bheema realtime session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
