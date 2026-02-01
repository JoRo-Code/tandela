// ============================================
// Email Processing Pipeline
// Orchestrates all steps
// ============================================

import { assessEmail } from "./step1-assess";
import { determineActions } from "./step2-actions";
import { checkCapability } from "./step3-capability";
import { proposeResponse } from "./step4-propose";
import { decideExecution } from "./step5-execute";
import {
  PipelineResult,
  PipelineConfig,
  EmailInput,
  BusinessContext,
} from "./types";
import { getProvider } from "../providers";

export * from "./types";

// Default configuration
const DEFAULT_CONFIG: Omit<PipelineConfig, "workspaceId"> = {
  mode: "draft",
  confidenceThresholds: {
    autoExecute: 0.95,
    queueDraft: 0.70,
  },
  allowedAutoActions: ["answer_inquiry", "request_info", "ignore"],
};

export async function processEmail(
  email: EmailInput,
  context: BusinessContext,
  config: Partial<PipelineConfig> = {}
): Promise<PipelineResult> {
  const startTime = Date.now();
  const fullConfig: PipelineConfig = {
    workspaceId: config.workspaceId || "default",
    ...DEFAULT_CONFIG,
    ...config,
    confidenceThresholds: {
      ...DEFAULT_CONFIG.confidenceThresholds,
      ...config.confidenceThresholds,
    },
  };

  // Get model info for logging
  const provider = await getProvider();
  const model = provider.getModel();

  console.log(`[Pipeline] Processing email ${email.id}`);
  console.log(`[Pipeline] Using model: ${model}`);

  // Step 1: Assessment
  console.log("[Pipeline] Step 1: Assessing email...");
  const assessment = await assessEmail(email, context);
  console.log(`[Pipeline] Assessment: ${assessment.intent} (${assessment.senderType})`);

  // Step 2: Determine Actions
  console.log("[Pipeline] Step 2: Determining actions...");
  const requiredActions = await determineActions(email, assessment, context);
  console.log(`[Pipeline] Actions: ${requiredActions.map(a => a.type).join(", ")}`);

  // Early exit for ignore
  if (requiredActions.length === 1 && requiredActions[0].type === "ignore") {
    return {
      emailId: email.id,
      assessment,
      requiredActions,
      capabilityCheck: { canProceed: true, missingInfo: [], blockedActions: [], confidence: 1 },
      proposedResponse: null,
      execution: { decision: "auto_execute", actionsExecuted: ["ignore"], actionsPending: [] },
      processingTimeMs: Date.now() - startTime,
      model,
    };
  }

  // Step 3: Capability Check
  console.log("[Pipeline] Step 3: Checking capability...");
  const capabilityCheck = await checkCapability(email, requiredActions, context);
  console.log(`[Pipeline] Can proceed: ${capabilityCheck.canProceed}`);

  // Step 4: Propose Response
  console.log("[Pipeline] Step 4: Generating response...");
  const proposedResponse = await proposeResponse(
    email,
    assessment,
    requiredActions,
    capabilityCheck,
    context
  );
  console.log(`[Pipeline] Response confidence: ${proposedResponse.confidence}`);

  // Step 5: Execution Decision
  console.log("[Pipeline] Step 5: Deciding execution...");
  const execution = decideExecution(
    requiredActions,
    capabilityCheck,
    proposedResponse,
    fullConfig
  );
  console.log(`[Pipeline] Decision: ${execution.decision}`);

  const result: PipelineResult = {
    emailId: email.id,
    assessment,
    requiredActions,
    capabilityCheck,
    proposedResponse,
    execution,
    processingTimeMs: Date.now() - startTime,
    model,
  };

  console.log(`[Pipeline] Complete in ${result.processingTimeMs}ms`);

  return result;
}

// Re-export step functions for advanced usage
export { assessEmail } from "./step1-assess";
export { determineActions } from "./step2-actions";
export { checkCapability } from "./step3-capability";
export { proposeResponse } from "./step4-propose";
export { decideExecution } from "./step5-execute";
