"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceInput, type VoiceLang } from "@/hooks/use-voice-input";
import type { PerioAction, ToothNumber, MeasurementSite, CheckboxField, NumericField } from "@/lib/perio/types";
import { ALL_TEETH } from "@/lib/perio/constants";

const VALID_TEETH = new Set<number>(ALL_TEETH);

interface VoiceInputProps {
  dispatch: React.Dispatch<PerioAction>;
}

interface RecordAction {
  tooth: number;
  site?: string;
  pocketDepth?: number;
  gingivalMargin?: number;
  bleeding?: boolean;
  plaque?: boolean;
  furcation?: boolean;
  missing?: boolean;
  comment?: string;
}

interface ToolCall {
  id: string;
  name: string;
  input: RecordAction;
}

interface ConversationTurn {
  transcript: string;
  toolCalls: ToolCall[];
  timestamp: number;
}

interface TraceEntry {
  transcript: string;
  messagesSent: number;
  toolCalls: ToolCall[];
  actionsApplied: number;
  durationMs: number;
  timestamp: number;
}

type MessageParam = {
  role: "user" | "assistant";
  content: string | ContentBlock[];
};

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string };

function buildMessages(history: ConversationTurn[], newTranscript: string): MessageParam[] {
  const messages: MessageParam[] = [];

  for (let i = 0; i < history.length; i++) {
    const turn = history[i];

    // User message with transcript (first turn or merged with previous tool_result)
    if (i === 0) {
      messages.push({ role: "user", content: turn.transcript });
    }
    // else: transcript was already merged into the previous user message

    // Assistant message with tool_use blocks
    if (turn.toolCalls.length > 0) {
      messages.push({
        role: "assistant",
        content: turn.toolCalls.map((tc) => ({
          type: "tool_use" as const,
          id: tc.id,
          name: tc.name,
          input: tc.input as unknown as Record<string, unknown>,
        })),
      });

      // User message: tool_results + next transcript merged together
      const toolResults: ContentBlock[] = turn.toolCalls.map((tc) => ({
        type: "tool_result" as const,
        tool_use_id: tc.id,
        content: "OK",
      }));

      const nextTranscript = i < history.length - 1 ? history[i + 1].transcript : newTranscript;
      messages.push({
        role: "user",
        content: [...toolResults, { type: "text" as const, text: nextTranscript }],
      });
    }
  }

  // If no history at all, just send the new transcript
  if (history.length === 0) {
    messages.push({ role: "user", content: newTranscript });
  }

  return messages;
}

function toActions(record: RecordAction): PerioAction[] {
  if (!VALID_TEETH.has(record.tooth)) return [];
  const tooth = record.tooth as ToothNumber;
  const actions: PerioAction[] = [];

  if (record.missing === true) {
    actions.push({ type: "TOGGLE_MISSING", tooth });
    return actions;
  }

  if (record.comment !== undefined) {
    actions.push({ type: "SET_COMMENT", tooth, comment: record.comment });
  }

  const site = (record.site as MeasurementSite) ?? "D";

  const checkboxFields: [CheckboxField, boolean | undefined][] = [
    ["bleeding", record.bleeding],
    ["plaque", record.plaque],
    ["furcation", record.furcation],
  ];

  for (const [field, value] of checkboxFields) {
    if (value !== undefined) {
      actions.push({ type: "SET_CHECKBOX", tooth, site, field, value });
    }
  }

  const numericFields: [NumericField, number | undefined][] = [
    ["pocketDepth", record.pocketDepth],
    ["gingivalMargin", record.gingivalMargin],
  ];

  for (const [field, value] of numericFields) {
    if (value !== undefined) {
      actions.push({ type: "SET_NUMERIC", tooth, site, field, value });
    }
  }

  return actions;
}

interface LogEntry {
  id: number;
  transcript: string;
  actions: RecordAction[];
  appliedCount: number;
  status: "pending" | "done" | "error";
}

let logId = 0;

export function VoiceInput({ dispatch }: VoiceInputProps) {
  const [lang, setLang] = useState<VoiceLang>("sv");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const conversationHistoryRef = useRef<ConversationTurn[]>([]);
  const [traces, setTraces] = useState<TraceEntry[]>([]);
  const pendingRef = useRef<Promise<void>>(Promise.resolve());
  const prevListeningRef = useRef(false);

  const [showDebug, setShowDebug] = useState(false);
  useEffect(() => {
    setShowDebug(process.env.NODE_ENV === "development" || new URLSearchParams(window.location.search).has("debug"));
  }, []);

  // Keep ref in sync
  useEffect(() => {
    conversationHistoryRef.current = conversationHistory;
  }, [conversationHistory]);

  const handleCommit = useCallback(
    (transcript: string) => {
      if (!transcript.trim()) return;
      pendingRef.current = pendingRef.current.then(async () => {
        const id = ++logId;
        const startTime = performance.now();
        setLog((prev) => [...prev, { id, transcript, actions: [], appliedCount: 0, status: "pending" }]);

        try {
          const messages = buildMessages(conversationHistoryRef.current, transcript);

          const res = await fetch("/api/perio/voice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages }),
          });

          if (!res.ok) throw new Error("API error");

          const { actions, toolCalls } = await res.json() as {
            actions: RecordAction[];
            toolCalls: ToolCall[];
          };

          let appliedCount = 0;
          for (const record of actions) {
            const perioActions = toActions(record);
            for (const action of perioActions) {
              dispatch(action);
              appliedCount++;
            }
          }

          // Append to conversation history
          const turn: ConversationTurn = {
            transcript,
            toolCalls: toolCalls ?? [],
            timestamp: Date.now(),
          };
          setConversationHistory((prev) => [...prev, turn]);

          const durationMs = Math.round(performance.now() - startTime);
          const trace: TraceEntry = {
            transcript,
            messagesSent: messages.length,
            toolCalls: toolCalls ?? [],
            actionsApplied: appliedCount,
            durationMs,
            timestamp: Date.now(),
          };
          setTraces((prev) => [...prev, trace]);

          console.log("[perio-voice-trace]", trace);

          setLog((prev) =>
            prev.map((e) => (e.id === id ? { ...e, actions, appliedCount, status: "done" as const } : e)),
          );
        } catch {
          setLog((prev) =>
            prev.map((e) => (e.id === id ? { ...e, status: "error" as const } : e)),
          );
        }
      });
    },
    [dispatch],
  );

  const { isListening, liveTranscript, error, toggle, supported } = useVoiceInput(handleCommit, lang);

  // Reset conversation history when starting a new session
  useEffect(() => {
    if (isListening && !prevListeningRef.current) {
      // false→true transition: new session
      setConversationHistory([]);
      conversationHistoryRef.current = [];
      setLog([]);
      if (traces.length > 0) {
        console.log("[perio-voice-trace] session ended", { turns: traces.length, traces });
      }
      setTraces([]);
      pendingRef.current = Promise.resolve();
    }
    prevListeningRef.current = isListening;
  }, [isListening, traces]);

  if (!supported) return null;

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setLang(lang === "sv" ? "en" : "sv")}
          disabled={isListening}
          className="flex h-10 shrink-0 items-center justify-center rounded-full px-2.5 text-xs font-medium transition-all bg-[var(--brand-cream)] text-[var(--brand-ink)] border border-[var(--brand-ink-10)] hover:bg-[var(--brand-ink-5)] disabled:opacity-40"
          aria-label="Byt språk"
        >
          {lang === "sv" ? "SV" : "EN"}
        </button>
        <button
          type="button"
          onClick={toggle}
          className={`
            flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all
            ${isListening
              ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse"
              : "bg-[var(--brand-cream)] text-[var(--brand-ink)] border border-[var(--brand-ink-10)] hover:bg-[var(--brand-ink-5)]"
            }
          `}
          aria-label={isListening ? "Stoppa inspelning" : "Starta röstinmatning"}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            {isListening ? (
              <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
            ) : (
              <>
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </>
            )}
          </svg>
        </button>

        {isListening && !error && (
          <div className="min-w-0 flex-1 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs font-medium text-red-600">Lyssnar...</p>
            {liveTranscript && (
              <p className="mt-0.5 text-sm text-[var(--brand-ink)]">{liveTranscript}</p>
            )}
          </div>
        )}

        {error && (
          <div className="min-w-0 flex-1 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs font-medium text-red-600">{error}</p>
          </div>
        )}

        {!isListening && !error && log.length === 0 && (
          <p className="text-xs text-[var(--brand-ink-40)]">Tryck för att börja diktera</p>
        )}
      </div>

      {/* Transcript log */}
      {log.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-[var(--brand-ink-10)] bg-[var(--brand-card)] divide-y divide-[var(--brand-ink-5)]">
          {log.slice().reverse().map((entry) => (
            <div key={entry.id} className="px-3 py-2">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0">
                  {entry.status === "pending" ? (
                    <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                  ) : entry.status === "error" ? (
                    <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
                  ) : (
                    <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-[var(--brand-ink)]">
                    &ldquo;{entry.transcript}&rdquo;
                  </p>
                  {entry.status === "done" && entry.actions.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {entry.actions.map((a, i) => (
                        <span
                          key={i}
                          className="inline-flex rounded bg-[var(--brand-cream)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--brand-olive)]"
                        >
                          {formatAction(a)}
                        </span>
                      ))}
                      <span className="inline-flex rounded px-1.5 py-0.5 text-[10px] text-[var(--brand-ink-40)]">
                        {entry.appliedCount} uppdaterade
                      </span>
                    </div>
                  )}
                  {entry.status === "done" && entry.actions.length === 0 && (
                    <p className="mt-0.5 text-[10px] text-amber-600">Inga värden tolkade</p>
                  )}
                  {entry.status === "error" && (
                    <p className="mt-0.5 text-[10px] text-red-500">Kunde inte tolka</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Debug panel */}
      {showDebug && traces.length > 0 && (
        <div className="space-y-1">
          {traces.map((trace, i) => (
            <details key={trace.timestamp} className="rounded-lg border border-[var(--brand-ink-10)] bg-[var(--brand-card)]">
              <summary className="cursor-pointer px-3 py-2 text-[10px] font-medium text-[var(--brand-ink-40)]">
                #{i + 1} &ldquo;{trace.transcript.slice(0, 40)}{trace.transcript.length > 40 ? "..." : ""}&rdquo;
                <span className="ml-2 text-[var(--brand-ink-20)]">
                  {trace.toolCalls.length} calls &middot; {trace.durationMs}ms &middot; {trace.messagesSent} msgs
                </span>
              </summary>
              <pre className="max-h-48 overflow-auto px-3 py-2 text-[10px] leading-relaxed text-[var(--brand-ink-60)]">
                {JSON.stringify(trace, null, 2)}
              </pre>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

function formatAction(a: RecordAction): string {
  const parts = [`T${a.tooth}`];
  if (a.site) parts.push(a.site);
  if (a.missing) return `T${a.tooth} saknas`;
  if (a.pocketDepth !== undefined) parts.push(`PD:${a.pocketDepth}`);
  if (a.gingivalMargin !== undefined) parts.push(`GM:${a.gingivalMargin}`);
  if (a.bleeding) parts.push("BL");
  if (a.plaque) parts.push("PL");
  if (a.furcation) parts.push("FU");
  if (a.comment) parts.push(`"${a.comment}"`);
  return parts.join(" ");
}
