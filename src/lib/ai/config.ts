// ============================================
// AI Configuration - Single source of truth
// ============================================

export const ANTHROPIC = {
  OPUS_4: "claude-opus-4-20250514",
  SONNET_4: "claude-sonnet-4-20250514",
  HAIKU_3_5: "claude-haiku-3-5-20241022",
} as const;

export const OPENAI = {
  GPT_4O: "gpt-4o",
  GPT_4O_MINI: "gpt-4o-mini",
  GPT_4_TURBO: "gpt-4-turbo",
} as const;

export type AnthropicModel = (typeof ANTHROPIC)[keyof typeof ANTHROPIC];
export type OpenAIModel = (typeof OPENAI)[keyof typeof OPENAI];
export type AIModel = AnthropicModel | OpenAIModel;

export type ProviderName = "anthropic" | "openai";

// ============================================
// Active Configuration
// ============================================

export const AI_CONFIG = {
  provider: "anthropic" as ProviderName,
  model: ANTHROPIC.SONNET_4,

  defaults: {
    maxTokens: 1024,
    temperature: 0.3,
  },
} as const;

// ============================================
// Helpers
// ============================================

export function getModelInfo(): { provider: ProviderName; model: string } {
  return {
    provider: AI_CONFIG.provider,
    model: AI_CONFIG.model,
  };
}

export function validateConfig(): void {
  const { provider, model } = AI_CONFIG;

  const anthropicModels = Object.values(ANTHROPIC) as string[];
  const openaiModels = Object.values(OPENAI) as string[];

  if (provider === "anthropic" && !anthropicModels.includes(model)) {
    throw new Error(`Invalid Anthropic model: ${model}. Valid: ${anthropicModels.join(", ")}`);
  }

  if (provider === "openai" && !openaiModels.includes(model)) {
    throw new Error(`Invalid OpenAI model: ${model}. Valid: ${openaiModels.join(", ")}`);
  }
}
