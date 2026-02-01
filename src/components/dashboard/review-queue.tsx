"use client";

import { useRouter } from "next/navigation";
import { ReviewItem } from "./review-item";

interface Draft {
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
}

interface ReviewQueueProps {
  drafts: Draft[];
}

export function ReviewQueue({ drafts }: ReviewQueueProps) {
  const router = useRouter();

  const handleSend = async (draftId: string) => {
    const response = await fetch(`/api/drafts/${draftId}/send`, {
      method: "POST",
    });

    if (response.ok) {
      router.refresh();
    } else {
      const error = await response.json();
      alert(`Failed to send: ${error.error || "Unknown error"}`);
    }
  };

  const handleReject = async (draftId: string) => {
    const response = await fetch(`/api/drafts/${draftId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" }),
    });

    if (response.ok) {
      router.refresh();
    } else {
      const error = await response.json();
      alert(`Failed to reject: ${error.error || "Unknown error"}`);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
        📋 Needs Review ({drafts.length})
      </h2>

      {drafts.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-zinc-500 dark:text-zinc-400">
            No drafts waiting for review
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <ReviewItem
              key={draft.id}
              draft={draft}
              onSend={handleSend}
              onReject={handleReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
