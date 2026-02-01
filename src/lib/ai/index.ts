// AI Pipeline - modular email processing
export * from "./config";
export * from "./client";

// New pipeline (v2) - the primary export
export * from "./pipeline";

// Legacy exports (deprecated - will be removed)
// Re-export specific items to avoid conflicts with new pipeline
export type {
  EmailIntent,
  ClassificationResult,
  GeneratedResponse,
  ActivityLogEntry,
} from "./types";
export type {
  PipelineResult as LegacyPipelineResult,
  BusinessContext as LegacyBusinessContext,
} from "./types";
export * from "./classifier";
export * from "./responder";
export {
  processEmail as processEmailLegacy,
  processEmails as processEmailsLegacy,
} from "./pipeline-legacy";
