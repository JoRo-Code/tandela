import Anthropic from "@anthropic-ai/sdk";
import { AIProvider, CompletionOptions, CompletionResult } from "./types";
import { AI_CONFIG, type AnthropicModel } from "../config";

export class AnthropicProvider implements AIProvider {
  name = "anthropic" as const;
  private client: Anthropic;
  private model: AnthropicModel;

  constructor(model?: AnthropicModel) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is required");
    }
    this.client = new Anthropic({ apiKey });
    this.model = model || (AI_CONFIG.model as AnthropicModel);
  }

  getModel(): string {
    return this.model;
  }

  async complete(prompt: string, options: CompletionOptions = {}): Promise<CompletionResult> {
    const {
      system,
      maxTokens = AI_CONFIG.defaults.maxTokens,
      temperature = AI_CONFIG.defaults.temperature,
    } = options;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      temperature,
      system: system || "You are a helpful assistant.",
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Anthropic");
    }

    return {
      content: content.text,
      model: this.model,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}
