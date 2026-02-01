// ============================================
// Step 5: Execution Decision
// Decide: auto-execute, queue draft, or escalate
// ============================================

import {
  RequiredAction,
  ProposedResponse,
  CapabilityCheck,
  ExecutionResult,
  ExecutionDecision,
  PipelineConfig,
  ActionType,
} from "./types";

// Actions that ALWAYS require human approval
const ALWAYS_APPROVE: ActionType[] = ["cancel_booking", "reschedule_booking", "escalate"];

// Actions that can potentially auto-execute
const CAN_AUTO: ActionType[] = ["answer_inquiry", "request_info", "create_booking", "ignore"];

export function decideExecution(
  actions: RequiredAction[],
  capability: CapabilityCheck,
  proposed: ProposedResponse | null,
  config: PipelineConfig
): ExecutionResult {
  // No response = nothing to execute
  if (!proposed) {
    return {
      decision: "escalate",
      actionsExecuted: [],
      actionsPending: actions.map(a => a.type),
      escalationReason: "No response could be generated",
    };
  }

  // Check if any action requires mandatory approval
  const requiresApproval = actions.some(a => ALWAYS_APPROVE.includes(a.type));
  if (requiresApproval) {
    return {
      decision: "queue_draft",
      actionsExecuted: [],
      actionsPending: actions.map(a => a.type),
    };
  }

  // Check capability
  if (!capability.canProceed) {
    // If missing info, we can still send a clarification request
    if (capability.missingInfo.length > 0) {
      const clarificationConfidence = proposed.confidence;

      if (clarificationConfidence >= config.confidenceThresholds.autoExecute) {
        return {
          decision: config.mode === "autonomous" ? "auto_execute" : "queue_draft",
          actionsExecuted: config.mode === "autonomous" ? ["request_info"] : [],
          actionsPending: config.mode === "autonomous" ? [] : ["request_info"],
        };
      }
    }

    return {
      decision: "escalate",
      actionsExecuted: [],
      actionsPending: actions.map(a => a.type),
      escalationReason: capability.blockedActions.join(", ") || "Cannot proceed",
    };
  }

  // Check confidence thresholds
  const confidence = Math.min(capability.confidence, proposed.confidence);

  // Below minimum threshold = escalate
  if (confidence < config.confidenceThresholds.queueDraft) {
    return {
      decision: "escalate",
      actionsExecuted: [],
      actionsPending: actions.map(a => a.type),
      escalationReason: `Low confidence: ${Math.round(confidence * 100)}%`,
    };
  }

  // Check if actions are allowed for auto-execution
  const allActionsAllowed = actions.every(
    a => config.allowedAutoActions.includes(a.type) || a.type === "ignore"
  );

  // High confidence + allowed actions + autonomous mode = auto-execute
  if (
    confidence >= config.confidenceThresholds.autoExecute &&
    allActionsAllowed &&
    config.mode === "autonomous"
  ) {
    return {
      decision: "auto_execute",
      actionsExecuted: actions.map(a => a.type),
      actionsPending: [],
    };
  }

  // Default: queue as draft
  return {
    decision: "queue_draft",
    actionsExecuted: [],
    actionsPending: actions.map(a => a.type),
  };
}
