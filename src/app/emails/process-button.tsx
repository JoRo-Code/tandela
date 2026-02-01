"use client";

import { useState } from "react";

interface ProcessResult {
  result: {
    emailId: string;
    classification: {
      intent: string;
      confidence: number;
      reasoning: string;
      extractedInfo?: Record<string, string>;
    };
    response?: {
      subject: string;
      body: string;
      confidence: number;
      reasoning: string;
    };
    action: "draft" | "escalate" | "ignore";
    processingTimeMs: number;
  };
  draft: {
    id: string;
  };
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
        <div className="mt-3 space-y-3 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-700 dark:bg-zinc-800">
          {/* Classification */}
          <div>
            <div className="font-medium text-zinc-900 dark:text-zinc-100">
              Classification
            </div>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {result.result.classification.intent}
              </span>
              <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200">
                {Math.round(result.result.classification.confidence * 100)}% confident
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  result.result.action === "draft"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : result.result.action === "escalate"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                    : "bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200"
                }`}
              >
                → {result.result.action}
              </span>
            </div>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">
              {result.result.classification.reasoning}
            </p>
          </div>

          {/* Extracted Info */}
          {result.result.classification.extractedInfo &&
            Object.keys(result.result.classification.extractedInfo).length > 0 && (
              <div>
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  Extracted Info
                </div>
                <div className="mt-1 text-zinc-600 dark:text-zinc-400">
                  {Object.entries(result.result.classification.extractedInfo).map(
                    ([key, value]) =>
                      value && (
                        <div key={key}>
                          <span className="font-medium">{key}:</span> {value}
                        </div>
                      )
                  )}
                </div>
              </div>
            )}

          {/* Generated Response */}
          {result.result.response && (
            <div>
              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                Draft Response
                <span className="ml-2 text-xs font-normal text-zinc-500">
                  ({Math.round(result.result.response.confidence * 100)}% confident)
                </span>
              </div>
              <div className="mt-2 rounded border border-zinc-200 bg-white p-3 dark:border-zinc-600 dark:bg-zinc-900">
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  {result.result.response.subject}
                </div>
                <div className="mt-2 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                  {result.result.response.body}
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-zinc-500">
            Processed in {result.result.processingTimeMs}ms
          </div>
        </div>
      )}
    </div>
  );
}
