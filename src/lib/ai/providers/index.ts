import { AIProvider } from "./types";
import { AI_CONFIG, validateConfig, ProviderName } from "../config";

export * from "./types";

// Lazy singleton
let _provider: AIProvider | null = null;

export async function getProvider(): Promise<AIProvider> {
  if (_provider) return _provider;

  // Validate config before creating provider
  validateConfig();

  const providerName: ProviderName = AI_CONFIG.provider;

  switch (providerName) {
    case "anthropic": {
      const { AnthropicProvider } = await import("./anthropic");
      _provider = new AnthropicProvider();
      break;
    }
    case "openai": {
      // OpenAI provider not yet installed
      // To enable: npm install openai, then create providers/openai.ts
      throw new Error(
        "OpenAI provider not installed. Use 'anthropic' or implement OpenAI provider."
      );
    }
    default:
      throw new Error(`Unknown AI provider: ${providerName}`);
  }

  console.log(`[AI] Using ${_provider.name} with model: ${_provider.getModel()}`);

  return _provider;
}

// For testing or manual provider injection
export function setProvider(provider: AIProvider): void {
  _provider = provider;
}

export function resetProvider(): void {
  _provider = null;
}
