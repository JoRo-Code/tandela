import { NextResponse } from "next/server";

export async function POST() {
  try {
    const res = await fetch("https://api.openai.com/v1/realtime/transcription_sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input_audio_format: "pcm16",
        input_audio_transcription: {
          model: "gpt-4o-transcribe",
          language: "sv",
          prompt: "tand, mesialt, distalt, buckalt, lingualt, palatinalt, fickdjup, blödning, plack, furkation, gingival, gingivalrand, recession, mobilitet, implant, bro, krona, saknas",
        },
        turn_detection: {
          type: "server_vad",
          silence_duration_ms: 1500,
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[openai-token] session creation failed:", res.status, body);
      return NextResponse.json(
        { error: `OpenAI error ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    return NextResponse.json({ token: data.client_secret.value });
  } catch (error) {
    console.error("[openai-token] error:", error);
    return NextResponse.json(
      { error: "Failed to create OpenAI session" },
      { status: 500 },
    );
  }
}
