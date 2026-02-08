import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

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

const SYSTEM_PROMPT = `You are an assistant helping a Swedish dental clinician record periodontal examination data.

The clinician will dictate measurements in Swedish. Your job is to interpret what they say and call the "record" tool for each measurement.

Common patterns:
- "tand 16 distal fickdjup 5" → record(tooth=16, site=D, pocketDepth=5)
- "blödning" (after a tooth/site) → record(tooth=..., site=..., bleeding=true)
- "mesial 4" → record(tooth=..., site=M, pocketDepth=4)
- "saknas" → record(tooth=..., missing=true)
- "plack" → plaque=true
- "furkation" → furcation=true
- "marg gingiva minus 2" or "recession 2" → gingivalMargin=-2

When the clinician lists multiple values for the same tooth, call the tool once per site with all values for that site combined.

If the clinician says values for both sites of the same tooth (e.g. "distal 5 mesial 4"), make two separate tool calls.

Always call the tool. Never respond with text unless you genuinely cannot interpret what was said.`;

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "Missing transcript" }, { status: 400 });
    }

    const response = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: [TOOL_DEFINITION],
      messages: [{ role: "user", content: transcript }],
    });

    // Extract tool calls
    const toolCalls = response.content
      .filter((block): block is Anthropic.ToolUseBlock => block.type === "tool_use")
      .map((block) => block.input as Record<string, unknown>);

    return NextResponse.json({ actions: toolCalls });
  } catch (error) {
    console.error("Perio voice error:", error);
    return NextResponse.json(
      { error: "Failed to interpret voice input" },
      { status: 500 },
    );
  }
}
