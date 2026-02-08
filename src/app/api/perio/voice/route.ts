import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const TOOL_DEFINITION: Anthropic.Tool = {
  name: "record",
  description:
    "Record periodontal measurements for a tooth. Use this for every value the clinician dictates. " +
    "All measurement fields are optional — only set the ones mentioned. " +
    "Tooth numbers follow FDI notation (11-18, 21-28, 31-38, 41-48). " +
    "Site is D (distal) or M (mesial). " +
    "If the clinician says a tooth is missing (saknas), set missing=true and omit site/measurements.",
  input_schema: {
    type: "object" as const,
    properties: {
      tooth: {
        type: "number",
        description: "FDI tooth number (e.g. 16, 21, 44)",
      },
      site: {
        type: "string",
        enum: ["D", "B", "M", "P", "L"],
        description: "Measurement site: D=distal, B=buccal, M=mesial, P=palatinal (upper jaw), L=lingual (lower jaw). Omit for tooth-level operations like missing.",
      },
      pocketDepth: {
        type: "number",
        description: "Pocket depth in mm (0-12)",
      },
      gingivalMargin: {
        type: "number",
        description: "Gingival margin in mm (negative = recession)",
      },
      bleeding: {
        type: "boolean",
        description: "Bleeding on probing",
      },
      plaque: {
        type: "boolean",
        description: "Plaque present",
      },
      furcation: {
        type: "boolean",
        description: "Furcation involvement",
      },
      missing: {
        type: "boolean",
        description: "Tooth is missing",
      },
      comment: {
        type: "string",
        description: "Free-text comment about the tooth",
      },
    },
    required: ["tooth"],
  },
};

const CLARIFY_TOOL: Anthropic.Tool = {
  name: "clarify",
  description:
    "Ask the clinician for clarification when the dictation is unclear or ambiguous. " +
    "Use this instead of guessing when you can't confidently interpret what was said.",
  input_schema: {
    type: "object" as const,
    properties: {
      message: {
        type: "string",
        description: "A short clarification question in Swedish",
      },
    },
    required: ["message"],
  },
};

const SYSTEM_PROMPT = `You are an assistant helping a Swedish dental clinician record periodontal examination data.

The clinician dictates measurements in Swedish. Call the "record" tool for EVERY measurement — you MUST always include at least one measurement value (pocketDepth, bleeding, plaque, furcation, gingivalMargin, or missing).

TRANSCRIPTION:
You may receive two transcriptions of the same audio from different speech-to-text models, formatted as:
[Scribe]: ...
[Whisper]: ...
Cross-reference both to determine what the clinician actually said. One model may mishear dental terms that the other gets right. Use the most plausible dental interpretation from either or both. If only one transcription is provided, use it directly.

ONLY call "record" when the clinician is clearly dictating dental measurements — tooth numbers, sites, pocket depths, bleeding, plaque, etc. If BOTH transcriptions indicate conversational speech, comments to colleagues, filler sounds ("mhm", "eh", "okej"), or anything that is NOT a dental measurement instruction, do NOT call any tool. The clinician talks to other people during the exam — ignore everything that isn't a measurement dictation.

If the dictation seems like it could be a measurement but is unclear or ambiguous, use the "clarify" tool to ask a short question in Swedish. Do NOT guess — it is better to ask than to record wrong data.

MEASUREMENT SITES:
Each tooth has 4 measurement sites for pocket depth, gingival margin, bleeding, and plaque:
- Quadrant 1 (upper right, teeth 11-18): D (distal), B (buccal), P (palatinal), M (mesial)
- Quadrant 2 (upper left, teeth 21-28): B (buccal), D (distal), M (mesial), P (palatinal)
- Quadrant 3 (lower left, teeth 31-38): M (mesial), L (lingual), B (buccal), D (distal)
- Quadrant 4 (lower right, teeth 41-48): L (lingual), M (mesial), D (distal), B (buccal)

Upper jaw uses P (palatinal), lower jaw uses L (lingual) — never both on the same tooth.

Furcation sites (molars/premolars only):
- Q1 molars: D, B, M — Q1 premolars: D, M
- Q2 molars: M, B, D — Q2 premolars: M, D
- Q3/Q4 molars: B, L — no furcation on premolars/anteriors

Swedish site names: distal=D, mesial=M, buckalt/bukalt=B, palatinalt=P, lingualt=L.

CRITICAL RULES:
- When a clinician says a number after a tooth/site, it is ALWAYS pocketDepth unless they explicitly say "marginal gingiva" or "recession".
- When they just say a tooth number and site with no qualifier, they are about to give pocket depth — but if you only hear the tooth/site, still record pocketDepth=0 as a placeholder rather than calling with no values.
- A bare number like "5" or "4" after mentioning a tooth = pocketDepth.
- Make one tool call per site. If multiple sites are mentioned, make multiple calls.

Common Swedish dental speech patterns:
- "tand 16 distal 5" → record(tooth=16, site="D", pocketDepth=5)
- "mesial 4" → record(tooth=16, site="M", pocketDepth=4)  [same tooth as before]
- "buckalt 3" → record(tooth=16, site="B", pocketDepth=3)
- "palatinalt 2" → record(tooth=16, site="P", pocketDepth=2)
- "lingualt 3" → record(tooth=36, site="L", pocketDepth=3)  [lower jaw]
- "blödning" → bleeding=true on the current tooth/site
- "plack" → plaque=true
- "furkation" → furcation=true
- "saknas" or "17 saknas" → record(tooth=17, missing=true)
- "marg gingiva minus 2" or "recession 2" → gingivalMargin=-2
- "distal 5 mesial 3" → two calls: site="D" pocketDepth=5, site="M" pocketDepth=3

The transcriptions often contain speech-to-text errors — misspelled dental terms, split tooth numbers ("ett åtta" = 18, "1.7" = 17), garbled site names. Use your knowledge of dental terminology and the context to infer the intended meaning.

You have the full conversation history. When a site or number is mentioned without a tooth, use the most recently mentioned tooth.

NEVER call record() without at least one measurement field. Every call must change something.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Backward compat: accept { transcript } string or { messages } array
    let messages: Anthropic.MessageParam[];
    if (Array.isArray(body.messages) && body.messages.length > 0) {
      messages = body.messages;
    } else if (body.transcript && typeof body.transcript === "string") {
      messages = [{ role: "user", content: body.transcript }];
    } else {
      return NextResponse.json({ error: "Missing messages or transcript" }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [TOOL_DEFINITION, CLARIFY_TOOL],
      tool_choice: { type: "auto" },
      messages,
    });

    const allToolCalls = response.content
      .filter((block): block is Anthropic.ToolUseBlock => block.type === "tool_use")
      .map((block) => ({ id: block.id, name: block.name, input: block.input as Record<string, unknown> }));

    const toolCalls = allToolCalls.filter((tc) => tc.name === "record");
    const actions = toolCalls.map((tc) => tc.input);

    // Collect clarifications from both clarify tool calls and plain text responses
    const clarifications = [
      ...allToolCalls
        .filter((tc) => tc.name === "clarify")
        .map((tc) => (tc.input as { message: string }).message),
      ...response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .filter((text) => text.trim().length > 0),
    ];

    return NextResponse.json({ actions, toolCalls: allToolCalls, clarifications });
  } catch (error) {
    console.error("Perio voice error:", error);
    return NextResponse.json(
      { error: "Failed to interpret voice input" },
      { status: 500 },
    );
  }
}
