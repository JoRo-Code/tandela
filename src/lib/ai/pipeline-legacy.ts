import { classifyEmail } from "./classifier";
import { generateResponse } from "./responder";
import {
  PipelineResult,
  BusinessContext,
  ClassificationResult,
} from "./types";

export interface PipelineConfig {
  context: BusinessContext;
  confidenceThreshold?: number; // Default 0.7
  autoIgnoreSpam?: boolean; // Default true
}

const DEFAULT_CONFIG: Partial<PipelineConfig> = {
  confidenceThreshold: 0.7,
  autoIgnoreSpam: true,
};

function shouldGenerateResponse(classification: ClassificationResult): boolean {
  // Don't respond to spam or unknown
  if (classification.intent === "spam" || classification.intent === "unknown") {
    return false;
  }
  // Don't auto-respond to complaints - always escalate
  if (classification.intent === "complaint") {
    return false;
  }
  return true;
}

function determineAction(
  classification: ClassificationResult,
  responseConfidence: number | null,
  threshold: number
): "draft" | "escalate" | "ignore" {
  // Spam gets ignored
  if (classification.intent === "spam") {
    return "ignore";
  }

  // Complaints always escalate
  if (classification.intent === "complaint") {
    return "escalate";
  }

  // Unknown intent escalates
  if (classification.intent === "unknown") {
    return "escalate";
  }

  // Low classification confidence escalates
  if (classification.confidence < threshold) {
    return "escalate";
  }

  // If we have a response, check its confidence
  if (responseConfidence !== null && responseConfidence >= threshold) {
    return "draft";
  }

  return "escalate";
}

export async function processEmail(
  email: {
    id: string;
    subject: string | null;
    body: string | null;
    from: string | null
  },
  config: PipelineConfig
): Promise<PipelineResult> {
  const startTime = Date.now();
  const { confidenceThreshold, autoIgnoreSpam } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Step 1: Classify the email
  const classification = await classifyEmail(email, config.context);

  // Early exit for spam if configured
  if (autoIgnoreSpam && classification.intent === "spam") {
    return {
      emailId: email.id,
      classification,
      action: "ignore",
      processingTimeMs: Date.now() - startTime,
    };
  }

  // Step 2: Generate response if appropriate
  let response = undefined;
  if (shouldGenerateResponse(classification)) {
    response = await generateResponse(email, classification, config.context);
  }

  // Step 3: Determine action
  const action = determineAction(
    classification,
    response?.confidence ?? null,
    confidenceThreshold!
  );

  return {
    emailId: email.id,
    classification,
    response,
    action,
    processingTimeMs: Date.now() - startTime,
  };
}

// Batch process multiple emails
export async function processEmails(
  emails: Array<{
    id: string;
    subject: string | null;
    body: string | null;
    from: string | null;
  }>,
  config: PipelineConfig
): Promise<PipelineResult[]> {
  // Process in parallel with concurrency limit
  const CONCURRENCY = 3;
  const results: PipelineResult[] = [];

  for (let i = 0; i < emails.length; i += CONCURRENCY) {
    const batch = emails.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map((email) => processEmail(email, config))
    );
    results.push(...batchResults);
  }

  return results;
}
