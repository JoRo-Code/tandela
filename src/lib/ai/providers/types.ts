// Provider-agnostic interface for AI completions

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface CompletionOptions {
  system?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CompletionResult {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

// Every AI provider must implement this interface
export interface AIProvider {
  name: string;
  getModel(): string;
  complete(prompt: string, options?: CompletionOptions): Promise<CompletionResult>;
}
