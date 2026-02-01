"use client";

import { useState } from "react";
import { ProcessButton } from "./process-button";

interface Email {
  id: string;
  subject: string | null;
  fromAddress: string | null;
  bodyText: string | null;
  isRead: boolean;
  receivedAt: Date | null;
}

function formatDate(date: Date | null) {
  if (!date) return "";
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return new Date(date).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } else if (days === 1) {
    return "Yesterday";
  } else if (days < 7) {
    return new Date(date).toLocaleDateString("en-US", { weekday: "short" });
  } else {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

function extractName(fromAddress: string | null): string {
  if (!fromAddress) return "Unknown";
  const match = fromAddress.match(/^([^<]+)/);
  if (match) {
    return match[1].trim().replace(/"/g, "");
  }
  return fromAddress;
}

function truncate(text: string | null, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function EmailItem({ email }: { email: Email }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border-b border-zinc-100 dark:border-zinc-800 ${
        !email.isRead ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
      }`}
    >
      {/* Email header row - clickable */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex cursor-pointer items-start gap-4 px-6 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
      >
        {/* Unread indicator */}
        <div className="mt-2 flex-shrink-0 w-2">
          {!email.isRead && (
            <div className="h-2 w-2 rounded-full bg-blue-500" />
          )}
        </div>

        {/* Email content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-4">
            <span
              className={`truncate ${
                !email.isRead
                  ? "font-semibold text-zinc-900 dark:text-zinc-50"
                  : "text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {extractName(email.fromAddress)}
            </span>
            <span className="flex-shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
              {formatDate(email.receivedAt)}
            </span>
          </div>
          <div
            className={`mt-1 truncate ${
              !email.isRead
                ? "font-medium text-zinc-900 dark:text-zinc-50"
                : "text-zinc-700 dark:text-zinc-300"
            }`}
          >
            {email.subject || "(no subject)"}
          </div>
          <div className="mt-1 truncate text-sm text-zinc-500 dark:text-zinc-400">
            {truncate(email.bodyText, 100)}
          </div>
        </div>

        {/* Expand indicator */}
        <div className="mt-2 text-zinc-400">
          <svg
            className={`h-5 w-5 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-zinc-100 bg-zinc-50/50 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          {/* Full email body */}
          <div className="mb-4">
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Full Message
            </div>
            <div className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md border border-zinc-200 bg-white p-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              {email.bodyText || "(empty)"}
            </div>
          </div>

          {/* Process button */}
          <ProcessButton emailId={email.id} />
        </div>
      )}
    </div>
  );
}
