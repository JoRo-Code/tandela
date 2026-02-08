"use client";

import { useCallback, useState } from "react";
import { useVoiceInput } from "@/hooks/use-voice-input";
import type { PerioAction, ToothNumber, MeasurementSite, CheckboxField, NumericField } from "@/lib/perio/types";

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

function toActions(record: RecordAction): PerioAction[] {
  const tooth = record.tooth as ToothNumber;
  const actions: PerioAction[] = [];

  if (record.missing !== undefined) {
    // Only toggle if setting to missing (we don't handle un-missing via voice for now)
    if (record.missing) {
      actions.push({ type: "TOGGLE_MISSING", tooth });
    }
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
  status: "pending" | "done" | "error";
}

let logId = 0;

export function VoiceInput({ dispatch }: VoiceInputProps) {
  const [log, setLog] = useState<LogEntry[]>([]);

  const handleTranscript = useCallback(
    async (transcript: string) => {
      const id = ++logId;
      setLog((prev) => [...prev, { id, transcript, actions: [], status: "pending" }]);

      try {
        const res = await fetch("/api/perio/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript }),
        });

        if (!res.ok) throw new Error("API error");

        const { actions } = await res.json() as { actions: RecordAction[] };

        for (const record of actions) {
          for (const action of toActions(record)) {
            dispatch(action);
          }
        }

        setLog((prev) =>
          prev.map((e) => (e.id === id ? { ...e, actions, status: "done" as const } : e)),
        );
      } catch {
        setLog((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: "error" as const } : e)),
        );
      }
    },
    [dispatch],
  );

  const { isListening, transcript, toggle, supported } = useVoiceInput(handleTranscript);

  if (!supported) return null;

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center gap-3">
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

        {/* Live interim transcript */}
        {isListening && (
          <div className="min-w-0 flex-1 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-xs font-medium text-red-600">Lyssnar...</p>
            {transcript && (
              <p className="mt-0.5 text-sm text-[var(--brand-ink)]">{transcript}</p>
            )}
          </div>
        )}

        {!isListening && log.length === 0 && (
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
                  <p className="text-xs text-[var(--brand-ink)]">{entry.transcript}</p>
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
                    </div>
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
