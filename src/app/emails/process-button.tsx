"use client";

import { useState } from "react";

interface ProcessResult {
  result: {
    emailId: string;
    assessment: {
      senderType: string;
      intent: string;
      urgency: string;
      sentiment: string;
      threadContext: string | null;
      confidence: number;
    };
    requiredActions: Array<{
      type: string;
      priority: number;
      parameters: Record<string, unknown>;
      reasoning: string;
    }>;
    capabilityCheck: {
      canProceed: boolean;
      missingInfo: string[];
      blockedActions: string[];
      confidence: number;
    };
    proposedResponse: {
      emailSubject: string;
      emailBody: string;
      actions: Array<{
        type: string;
        description: string;
        willExecute: boolean;
      }>;
      confidence: number;
      reasoning: string;
    } | null;
    execution: {
      decision: "auto_execute" | "queue_draft" | "escalate";
      actionsExecuted: string[];
      actionsPending: string[];
      escalationReason?: string;
    };
    processingTimeMs: number;
    model: string;
  };
  draft: {
    id: string;
  } | null;
}

export function ProcessButton({ emailId }: { emailId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleProcess() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to process");
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const decisionColors = {
    auto_execute: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    queue_draft: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    escalate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  };

  const sentimentColors = {
    urgent: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    frustrated: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    neutral: "bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200",
    positive: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  };

  return (
    <div className="mt-3">
      <button
        onClick={handleProcess}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Processing...
          </>
        ) : (
          <>
            <span>🤖</span>
            Process with AI
          </>
        )}
      </button>

      {error && (
        <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-3 space-y-4 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-800">
          {/* Assessment */}
          <div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              Step 1: Assessment
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {result.result.assessment.intent}
              </span>
              <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                {result.result.assessment.senderType}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sentimentColors[result.result.assessment.sentiment as keyof typeof sentimentColors] || sentimentColors.neutral}`}>
                {result.result.assessment.sentiment}
              </span>
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200">
                {Math.round(result.result.assessment.confidence * 100)}% confident
              </span>
            </div>
          </div>

          {/* Required Actions */}
          <div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              Step 2: Required Actions
            </div>
            <div className="mt-1 space-y-1">
              {result.result.requiredActions.map((action, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                    {action.type}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400 text-xs">
                    {action.reasoning}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Capability Check */}
          <div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              Step 3: Capability Check
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${result.result.capabilityCheck.canProceed ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"}`}>
                {result.result.capabilityCheck.canProceed ? "Can proceed" : "Cannot proceed"}
              </span>
              {result.result.capabilityCheck.missingInfo.length > 0 && (
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  Missing: {result.result.capabilityCheck.missingInfo.join(", ")}
                </span>
              )}
            </div>
          </div>

          {/* Proposed Response */}
          {result.result.proposedResponse && (
            <div>
              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                Step 4: Draft Response
                <span className="ml-2 text-xs font-normal text-zinc-500">
                  ({Math.round(result.result.proposedResponse.confidence * 100)}% confident)
                </span>
              </div>
              <div className="mt-2 rounded border border-zinc-200 bg-white p-3 dark:border-zinc-600 dark:bg-zinc-900">
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  {result.result.proposedResponse.emailSubject}
                </div>
                <div className="mt-2 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                  {result.result.proposedResponse.emailBody}
                </div>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                {result.result.proposedResponse.reasoning}
              </p>
            </div>
          )}

          {/* Execution Decision */}
          <div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              Step 5: Decision
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${decisionColors[result.result.execution.decision]}`}>
                {result.result.execution.decision.replace("_", " ")}
              </span>
              {result.result.execution.escalationReason && (
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  Reason: {result.result.execution.escalationReason}
                </span>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-3 text-xs text-zinc-500 border-t border-zinc-200 dark:border-zinc-700 pt-3">
            <span>Processed in {result.result.processingTimeMs}ms</span>
            <span>Model: {result.result.model}</span>
          </div>
        </div>
      )}
    </div>
  );
}
