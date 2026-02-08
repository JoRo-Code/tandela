import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const language = (formData.get("language") as string) || "sv";

    if (!audioFile) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language,
    });

    return NextResponse.json({ transcript: transcription.text });
  } catch (error) {
    console.error("Whisper transcription error:", error);
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 },
    );
  }
}
