// ============================================
// Pipeline Types - Email Processing Pipeline
// ============================================

// Step 1: Assessment
export type SenderType = "new_customer" | "existing_customer" | "vendor" | "spam" | "unknown";
export type Sentiment = "urgent" | "frustrated" | "neutral" | "positive";
export type Urgency = "high" | "medium" | "low";

export interface Assessment {
  senderType: SenderType;
  intent: string; // Free-form intent description
  urgency: Urgency;
  sentiment: Sentiment;
  threadContext: string | null; // Summary of thread if part of conversation
  confidence: number;
}

// Step 2: Required Actions
export type ActionType =
  | "create_booking"
  | "cancel_booking"
  | "reschedule_booking"
  | "answer_inquiry"
  | "request_info"
  | "escalate"
  | "ignore";

export interface RequiredAction {
  type: ActionType;
  priority: number; // 1 = highest
  parameters: Record<string, unknown>;
  reasoning: string;
}

// Step 3: Capability Check
export interface CapabilityCheck {
  canProceed: boolean;
  missingInfo: string[];
  blockedActions: string[];
  confidence: number;
}

// Step 4: Proposed Response
export interface ProposedAction {
  type: ActionType;
  description: string;
  willExecute: boolean; // Whether this will actually be performed
}

export interface ProposedResponse {
  emailSubject: string;
  emailBody: string;
  actions: ProposedAction[];
  confidence: number;
  reasoning: string;
}

// Step 5: Execution Decision
export type ExecutionDecision = "auto_execute" | "queue_draft" | "escalate";

export interface ExecutionResult {
  decision: ExecutionDecision;
  actionsExecuted: string[];
  actionsPending: string[];
  draftId?: string;
  escalationReason?: string;
}

// Full Pipeline Result
export interface PipelineResult {
  emailId: string;
  assessment: Assessment;
  requiredActions: RequiredAction[];
  capabilityCheck: CapabilityCheck;
  proposedResponse: ProposedResponse | null;
  execution: ExecutionResult;
  processingTimeMs: number;
  model: string;
}

// Pipeline Configuration
export interface PipelineConfig {
  workspaceId: string;
  mode: "draft" | "autonomous";
  confidenceThresholds: {
    autoExecute: number; // Default 0.95
    queueDraft: number; // Default 0.70
  };
  allowedAutoActions: ActionType[];
}

// Email input
export interface EmailInput {
  id: string;
  subject: string | null;
  body: string | null;
  from: string | null;
  to: string[];
  threadId: string | null;
  receivedAt: Date | null;
}

// Business context
export interface BusinessContext {
  name: string;
  type: string;
  description: string;
  services?: string[];
  hours?: string;
  tone?: "formal" | "friendly" | "casual";
  customInstructions?: string;
}
