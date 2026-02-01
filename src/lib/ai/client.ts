import { getProvider, CompletionOptions } from "./providers";

export type { CompletionOptions } from "./providers";

export async function complete(
  prompt: string,
  options: CompletionOptions = {}
): Promise<string> {
  const provider = await getProvider();
  const result = await provider.complete(prompt, options);
  return result.content;
}

export async function completeJSON<T>(
  prompt: string,
  options: CompletionOptions = {}
): Promise<T> {
  const response = await complete(prompt, {
    ...options,
    system: (options.system || "") + "\n\nRespond with valid JSON only, no markdown or explanation.",
  });

  // Extract JSON from response (in case model adds extra text)
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON found in response");
  }

  return JSON.parse(jsonMatch[0]) as T;
}

// Re-export provider utilities for advanced usage
export { getProvider, setProvider, resetProvider } from "./providers";
