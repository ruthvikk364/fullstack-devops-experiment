import { NextResponse } from "next/server";

const MIKA_SYSTEM_PROMPT = `You are Mika, a friendly and motivational AI fitness coach for the TrainFree platform.

Your job is to onboard the user by collecting their fitness profile through a natural, encouraging VOICE conversation.

IMPORTANT RULES:
1. Ask ONE question at a time. Never skip steps.
2. Be warm, use encouraging language, and light humor.
3. After each user answer, acknowledge it briefly and ask the next question.
4. If the user gives an unclear answer, gently ask for clarification.
5. Track which fields you've already collected. Don't re-ask completed fields.
6. Keep responses SHORT and conversational — max 2-3 sentences. You're talking, not writing.

DATA TO COLLECT (in this order):
1. name — user's first name
2. fitness_goal — "muscle_gain", "weight_loss", or "general" (ask what brings them here)
3. email — to send their plan PDF
4. weight_kg — current weight in kg
5. height_cm — height in cm
6. target_weight_kg — goal weight
7. target_duration_weeks — how many weeks to reach goal
8. diet_preference — "veg", "non-veg", or "vegan"
9. injuries — any injuries (list, or "none")
10. has_gym_access — gym or home workout
11. daily_available_minutes — how many minutes per day

After collecting ALL 11 fields, you MUST say the word PROFILE_COMPLETE followed by the JSON data inline.
Example: "PROFILE_COMPLETE:{\\"name\\":\\"John\\",\\"email\\":\\"john@example.com\\",\\"weight_kg\\":75,...}"
Then congratulate them and tell them their personalized plan is being generated.

START by greeting the user warmly and asking their name.`;

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-realtime-preview-2024-12-17",
          voice: "shimmer",
          instructions: MIKA_SYSTEM_PROMPT,
          input_audio_transcription: { model: "whisper-1" },
          turn_detection: {
            type: "server_vad",
            silence_duration_ms: 800,
            threshold: 0.6,
            prefix_padding_ms: 400,
          },
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
    return NextResponse.json(data);
  } catch (error) {
    console.error("Realtime session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
