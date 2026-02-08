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
        enum: ["D", "M"],
        description: "Measurement site: D=distal, M=mesial. Omit for tooth-level operations like missing.",
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

If the dictation is unclear, garbled, or you cannot confidently determine what was said, use the "clarify" tool to ask a short question in Swedish. Do NOT guess — it is better to ask than to record wrong data. If the transcript is just filler sounds (e.g. "mhm", "eh", "okej") with no dental data, do not call any tool.

CRITICAL RULES:
- When a clinician says a number after a tooth/site, it is ALWAYS pocketDepth unless they explicitly say "marginal gingiva" or "recession".
- When they just say a tooth number and site with no qualifier, they are about to give pocket depth — but if you only hear the tooth/site, still record pocketDepth=0 as a placeholder rather than calling with no values.
- A bare number like "5" or "4" after mentioning a tooth = pocketDepth.

Common Swedish dental speech patterns:
- "tand 16 distal 5" → record(tooth=16, site="D", pocketDepth=5)
- "mesial 4" → record(tooth=16, site="M", pocketDepth=4)  [same tooth as before]
- "blödning" → bleeding=true on the current tooth/site
- "plack" → plaque=true
- "furkation" → furcation=true
- "saknas" or "17 saknas" → record(tooth=17, missing=true)
- "marg gingiva minus 2" or "recession 2" → gingivalMargin=-2
- "distal 5 3" means distal pocketDepth=5, mesial pocketDepth=3
- "5 4" for a tooth means distal=5, mesial=4 (two calls)

Common transcription errors to watch for:
- "dukalt" or "dukat" = bukalt (buccal)
- "ett åtta" = 18 (tooth number)

When the clinician gives two numbers for a tooth (e.g. "16 5 4" or "16 distal 5 mesial 4"), make TWO tool calls — one per site.

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
      model: "claude-sonnet-4-5-20250929",
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

    const clarifications = allToolCalls
      .filter((tc) => tc.name === "clarify")
      .map((tc) => (tc.input as { message: string }).message);

    return NextResponse.json({ actions, toolCalls: allToolCalls, clarifications });
  } catch (error) {
    console.error("Perio voice error:", error);
    return NextResponse.json(
      { error: "Failed to interpret voice input" },
      { status: 500 },
    );
  }
}
