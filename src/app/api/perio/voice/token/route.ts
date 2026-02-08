import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 500 });
  }

  const wsUrl = new URL("wss://api.elevenlabs.io/v1/speech-to-text/realtime");
  wsUrl.searchParams.set("model_id", "scribe_v2");
  wsUrl.searchParams.set("language_code", "sv");
  wsUrl.searchParams.set("commit_strategy", "vad");
  wsUrl.searchParams.set("vad_silence_threshold_secs", "1.5");
  wsUrl.searchParams.set("token", apiKey);

  return NextResponse.json({ wsUrl: wsUrl.toString() });
}
