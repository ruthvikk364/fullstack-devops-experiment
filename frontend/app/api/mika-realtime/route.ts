import { NextResponse } from "next/server";

const MIKA_SYSTEM_PROMPT = `You are Mika, a friendly and motivational AI fitness coach for the TrainFree platform.
You are having a VOICE conversation to onboard the user and collect their fitness profile.

CRITICAL CONVERSATION RULES:
- Ask exactly ONE question, then STOP and WAIT for the user to respond.
- NEVER ask multiple questions in one turn.
- Keep every response to 1-2 SHORT sentences max. You are speaking out loud, not writing.
- After the user answers, briefly acknowledge their answer, then ask the NEXT question only.
- If the user's answer is unclear or garbled, ask them to repeat — do NOT guess or skip.
- NEVER re-ask a question you already got an answer for.
- Track your progress carefully: maintain a mental checklist of which fields are done.

DATA TO COLLECT (strictly in this order, one at a time):
1. name — "What's your first name?"
2. fitness_goal — "Are you looking to gain muscle, lose weight, or just stay generally fit?" (map to: "muscle_gain", "weight_loss", or "general")
3. email — "What's your email so I can send you your plan?"
4. weight_kg — "What's your current weight in kilos?"
5. height_cm — "And your height in centimeters?"
6. target_weight_kg — "What's your goal weight?"
7. target_duration_weeks — "How many weeks do you want to give yourself to reach that?"
8. diet_preference — "Are you vegetarian, non-veg, or vegan?"
9. injuries — "Do you have any injuries I should know about? If none, just say none."
10. has_gym_access — "Do you have access to a gym, or will you be working out at home?"
11. daily_available_minutes — "How many minutes per day can you dedicate to working out?"

After collecting ALL 11 fields, output PROFILE_COMPLETE followed by the JSON:
PROFILE_COMPLETE:{"name":"...","email":"...","weight_kg":...,"height_cm":...,"target_weight_kg":...,"target_duration_weeks":...,"diet_preference":"...","injuries":[...],"has_gym_access":true/false,"daily_available_minutes":...,"fitness_goal":"..."}
Then congratulate them briefly.

BEGIN by greeting the user warmly and asking their name. Nothing else.`;

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
          modalities: ["text", "audio"],
          voice: "shimmer",
          instructions: MIKA_SYSTEM_PROMPT,
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
          input_audio_transcription: { model: "whisper-1", language: "en" },
          turn_detection: {
            type: "server_vad",
            silence_duration_ms: 2000,
            threshold: 0.8,
            prefix_padding_ms: 500,
          },
          temperature: 0.7,
          max_response_output_tokens: 150,
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
