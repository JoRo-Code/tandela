import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ELEVENLABS_API_KEY not configured" }, { status: 500 });
  }

  const tokenRes = await fetch(
    "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe",
    {
      method: "POST",
      headers: { "xi-api-key": apiKey },
    },
  );

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    console.error("ElevenLabs token error:", tokenRes.status, body);
    return NextResponse.json({ error: "Failed to get ElevenLabs token" }, { status: 502 });
  }

  const { token } = await tokenRes.json();
  return NextResponse.json({ token });
}
