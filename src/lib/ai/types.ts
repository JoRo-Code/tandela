// Email intents the AI can classify
export type EmailIntent =
  | "booking_request"
  | "general_inquiry"
  | "complaint"
  | "follow_up"
  | "spam"
  | "unknown";

export interface ClassificationResult {
  intent: EmailIntent;
  confidence: number; // 0-1
  reasoning: string;
  extractedInfo?: {
    requestedDate?: string;
    requestedTime?: string;
    serviceType?: string;
    customerName?: string;
    phoneNumber?: string;
  };
}

export interface GeneratedResponse {
  subject: string;
  body: string;
  confidence: number;
  reasoning: string;
}

export interface PipelineResult {
  emailId: string;
  classification: ClassificationResult;
  response?: GeneratedResponse;
  action: "draft" | "escalate" | "ignore";
  processingTimeMs: number;
}

// Business context for AI
export interface BusinessContext {
  name: string;
  type: string; // e.g., "dental clinic", "hair salon"
  description: string;
  services?: string[];
  hours?: string;
  tone?: "formal" | "friendly" | "casual";
  customInstructions?: string;
}

// For activity logging
export interface ActivityLogEntry {
  type: "classified" | "response_generated" | "sent" | "escalated";
  data: Record<string, unknown>;
  timestamp: Date;
}
