"use client";

import { useState, useMemo } from "react";

interface ActivityLog {
  id: string;
  type: string;
  data: Record<string, unknown> | null;
  createdAt: Date;
  email?: {
    subject: string | null;
    fromAddress: string | null;
  } | null;
  draft?: {
    responseSubject: string | null;
  } | null;
}

interface ActivityFeedProps {
  activities: ActivityLog[];
}

type FilterType = "all" | "sent" | "booked" | "drafts" | "escalated";

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: "all", label: "All" },
  { key: "sent", label: "Sent" },
  { key: "booked", label: "Booked" },
  { key: "drafts", label: "Drafts" },
  { key: "escalated", label: "⚠" },
];

function getActivityIcon(type: string): string {
  switch (type) {
    case "email_sent":
    case "draft_sent":
      return "📧";
    case "booking_created":
      return "📅";
    case "draft_created":
    case "pipeline_complete":
      return "📝";
    case "escalated":
      return "🚨";
    default:
      return "🤖";
  }
}

function getActivityTitle(type: string): string {
  switch (type) {
    case "email_sent":
    case "draft_sent":
      return "Sent reply";
    case "booking_created":
      return "Booked appointment";
    case "draft_created":
    case "pipeline_complete":
      return "Drafted reply";
    case "escalated":
      return "Escalated";
    case "draft_rejected":
      return "Draft rejected";
    case "draft_approved":
      return "Draft approved";
    default:
      return type.replace(/_/g, " ");
  }
}

function formatDate(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (activityDate.getTime() === today.getTime()) {
    return "Today";
  }
  if (activityDate.getTime() === yesterday.getTime()) {
    return "Yesterday";
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (hours >= 24) {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  if (hours >= 1) {
    return `${hours}h ago`;
  }
  if (minutes >= 1) {
    return `${minutes}m ago`;
  }
  return "just now";
}

function matchesFilter(activity: ActivityLog, filter: FilterType): boolean {
  if (filter === "all") return true;

  switch (filter) {
    case "sent":
      return activity.type === "email_sent" || activity.type === "draft_sent";
    case "booked":
      return activity.type === "booking_created";
    case "drafts":
      return activity.type === "draft_created" || activity.type === "pipeline_complete";
    case "escalated":
      return activity.type === "escalated";
    default:
      return true;
  }
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      // Apply type filter
      if (!matchesFilter(activity, filter)) return false;

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const subject = activity.email?.subject || activity.draft?.responseSubject || "";
        const from = activity.email?.fromAddress || "";
        return (
          subject.toLowerCase().includes(searchLower) ||
          from.toLowerCase().includes(searchLower) ||
          activity.type.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [activities, filter, search]);

  // Group activities by date
  const groupedActivities = useMemo(() => {
    const groups: { date: string; activities: ActivityLog[] }[] = [];
    let currentDate = "";

    for (const activity of filteredActivities) {
      const date = formatDate(activity.createdAt);
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date, activities: [] });
      }
      groups[groups.length - 1].activities.push(activity);
    }

    return groups;
  }, [filteredActivities]);

  return (
    <div>
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
        🤖 AI Activity
      </h2>

      {/* Search */}
      <div className="mb-3">
        <input
          type="text"
          placeholder="🔍 Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-1 mb-4 flex-wrap">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.key}
            onClick={() => setFilter(option.key)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors ${
              filter === option.key
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Activity list */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto">
        {groupedActivities.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
            No activity found
          </div>
        ) : (
          groupedActivities.map((group) => (
            <div key={group.date}>
              <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                {group.date}
              </div>
              <div className="space-y-2">
                {group.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{getActivityIcon(activity.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-zinc-900 dark:text-zinc-50">
                          {getActivityTitle(activity.type)}
                        </div>
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
                          {activity.email?.subject ||
                            activity.draft?.responseSubject ||
                            (activity.data as { subject?: string })?.subject ||
                            ""}
                        </div>
                        {activity.email?.fromAddress && (
                          <div className="text-xs text-zinc-400 dark:text-zinc-500 truncate">
                            {activity.email.fromAddress}
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                        {formatTime(activity.createdAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
