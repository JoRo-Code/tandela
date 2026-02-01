"use client";

import { useState } from "react";

interface ReviewItemProps {
  draft: {
    id: string;
    intent: string;
    intentConfidence: number;
    responseSubject: string | null;
    responseBody: string | null;
    responseConfidence: number | null;
    createdAt: Date;
    email: {
      id: string;
      subject: string | null;
      fromAddress: string | null;
      bodyText: string | null;
      receivedAt: Date | null;
    };
  };
  onSend: (draftId: string) => Promise<void>;
  onReject: (draftId: string) => Promise<void>;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
  if (hours >= 1) {
    return `${hours}h ago`;
  }
  if (minutes >= 1) {
    return `${minutes}m ago`;
  }
  return "just now";
}

function extractSenderName(fromAddress: string | null): string {
  if (!fromAddress) return "Unknown";
  const match = fromAddress.match(/^([^<]+)/);
  if (match) {
    return match[1].trim().replace(/"/g, "");
  }
  return fromAddress.split("@")[0];
}

export function ReviewItem({ draft, onSend, onReject }: ReviewItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const confidence = Math.round((draft.responseConfidence || draft.intentConfidence) * 100);
  const isLowConfidence = confidence < 80;

  const handleSend = async () => {
    setIsLoading(true);
    try {
      await onSend(draft.id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    setIsLoading(true);
    try {
      await onReject(draft.id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-zinc-400">{isExpanded ? "▼" : "▶"}</span>
          {isLowConfidence && <span className="text-amber-500">⚠</span>}
          <div className="text-left">
            <div className="font-medium text-zinc-900 dark:text-zinc-50">
              {draft.intent.replace(/_/g, " ")} - {extractSenderName(draft.email.fromAddress)}
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              {draft.email.subject || "(no subject)"}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className={`font-medium ${isLowConfidence ? "text-amber-600" : "text-green-600"}`}>
            {confidence}%
          </span>
          <span className="text-zinc-400">
            {formatTimeAgo(draft.email.receivedAt || draft.createdAt)}
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-zinc-100 dark:border-zinc-800">
          {/* Original email */}
          <div className="mt-4">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
              FROM: {draft.email.fromAddress}
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
              <div className="font-medium text-zinc-900 dark:text-zinc-50 mb-2">
                {draft.email.subject || "(no subject)"}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {draft.email.bodyText?.slice(0, 500) || "(no body)"}
                {(draft.email.bodyText?.length || 0) > 500 && "..."}
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center my-3">
            <span className="text-zinc-400">↓ AI Draft</span>
          </div>

          {/* Draft response */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <div className="font-medium text-zinc-900 dark:text-zinc-50 mb-2">
              {draft.responseSubject || `Re: ${draft.email.subject}`}
            </div>
            <div className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {draft.responseBody || "(no response generated)"}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={handleReject}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 disabled:opacity-50"
            >
              Reject
            </button>
            <button
              onClick={() => {/* TODO: implement edit */}}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 rounded-lg hover:bg-zinc-200 dark:text-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-50"
            >
              Edit
            </button>
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? "Sending..." : "Send"}
              {!isLoading && <span>➔</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
