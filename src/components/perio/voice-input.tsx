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
  input: Record<string, unknown>;
}

interface ConversationTurn {
  transcript: string;
  toolCalls: ToolCall[];
  textResponse: string | null;
  timestamp: number;
}

interface TraceEntry {
  transcript: string;
  messagesSent: number;
  messages: MessageParam[];
  toolCalls: ToolCall[];
  actionsApplied: number;
  durationMs: number;
  timestamp: number;
}

type MessageParam = {
  role: "user" | "assistant";
  content: string;
};

function buildMessages(history: ConversationTurn[], newTranscript: string): MessageParam[] {
  if (history.length === 0) {
    return [{ role: "user", content: newTranscript }];
  }

  // Build a plain text session log so Claude sees the full history clearly
  const lines: string[] = ["--- Session history ---"];
  for (let i = 0; i < history.length; i++) {
    const turn = history[i];
    lines.push(`\n[Turn ${i + 1}]`);
    lines.push(`Clinician: ${turn.transcript}`);

    if (turn.toolCalls.length > 0) {
      const actions = turn.toolCalls
        .map((tc) => `${tc.name}(${JSON.stringify(tc.input)})`)
        .join(", ");
      lines.push(`Actions: ${actions}`);
    }
    if (turn.textResponse) {
      lines.push(`Assistant: ${turn.textResponse}`);
    }
    if (turn.toolCalls.length === 0 && !turn.textResponse) {
      lines.push("Actions: (none)");
    }
  }
  lines.push("\n--- New input ---");
  lines.push(newTranscript);

  return [{ role: "user", content: lines.join("\n") }];
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

async function transcribeWithWhisper(audioBlob: Blob, lang: string): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob, "audio.webm");
    formData.append("language", lang);

    const res = await fetch("/api/perio/voice/whisper", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) return null;
    const { transcript } = await res.json() as { transcript: string };
    return transcript;
  } catch {
    return null;
  }
}

interface LogEntry {
  id: number;
  transcript: string;
  whisperTranscript: string | null;
  actions: RecordAction[];
  appliedCount: number;
  clarifications: string[];
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
    (scribeTranscript: string, audioBlob: Blob | null) => {
      if (!scribeTranscript.trim()) return;
      pendingRef.current = pendingRef.current.then(async () => {
        const id = ++logId;
        const startTime = performance.now();
        setLog((prev) => [...prev, { id, transcript: scribeTranscript, whisperTranscript: null, actions: [], appliedCount: 0, clarifications: [], status: "pending" }]);

        try {
          // Get Whisper transcript (if audio available)
          const whisperText = audioBlob ? await transcribeWithWhisper(audioBlob, lang) : null;

          // Build the transcript to send — combine both when Whisper is available
          let activeTranscript: string;
          if (whisperText) {
            activeTranscript = `[Scribe]: ${scribeTranscript}\n[Whisper]: ${whisperText}`;
          } else {
            activeTranscript = scribeTranscript;
          }

          const messages = buildMessages(conversationHistoryRef.current, activeTranscript);

          const claudeRes = await fetch("/api/perio/voice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages }),
          });

          if (!claudeRes.ok) throw new Error("API error");

          const { actions, toolCalls, clarifications = [], textResponse = null } = await claudeRes.json() as {
            actions: RecordAction[];
            toolCalls: ToolCall[];
            clarifications: string[];
            textResponse: string | null;
          };

          let appliedCount = 0;
          for (const record of actions) {
            const perioActions = toActions(record);
            for (const action of perioActions) {
              dispatch(action);
              appliedCount++;
            }
          }

          // Append to conversation history (using the transcript that was actually sent)
          const turn: ConversationTurn = {
            transcript: activeTranscript,
            toolCalls: toolCalls ?? [],
            textResponse,
            timestamp: Date.now(),
          };
          setConversationHistory((prev) => [...prev, turn]);

          const durationMs = Math.round(performance.now() - startTime);
          const trace: TraceEntry = {
            transcript: activeTranscript,
            messagesSent: messages.length,
            messages,
            toolCalls: toolCalls ?? [],
            actionsApplied: appliedCount,
            durationMs,
            timestamp: Date.now(),
          };
          setTraces((prev) => [...prev, trace]);

          console.log("[perio-voice-trace]", { ...trace, scribeTranscript, whisperTranscript: whisperText });

          setLog((prev) =>
            prev.map((e) => (e.id === id ? { ...e, actions, appliedCount, clarifications, whisperTranscript: whisperText, status: "done" as const } : e)),
          );
        } catch {
          setLog((prev) =>
            prev.map((e) => (e.id === id ? { ...e, status: "error" as const } : e)),
          );
        }
      });
    },
    [dispatch, lang],
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
                    <span className="text-[var(--brand-ink-40)] font-medium">Scribe:</span> &ldquo;{entry.transcript}&rdquo;
                  </p>
                  {entry.whisperTranscript !== null && (
                    <p className="text-xs text-[var(--brand-ink)]">
                      <span className="text-[var(--brand-ink-40)] font-medium">Whisper:</span> &ldquo;{entry.whisperTranscript}&rdquo;
                    </p>
                  )}
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
                  {entry.status === "done" && entry.clarifications.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {entry.clarifications.map((msg, i) => (
                        <p key={i} className="text-[10px] text-blue-600">{msg}</p>
                      ))}
                    </div>
                  )}
                  {entry.status === "done" && entry.actions.length === 0 && entry.clarifications.length === 0 && (
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
