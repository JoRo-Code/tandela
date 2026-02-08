"use client";

import { useReducer, useMemo } from "react";
import type { PerioExamination, PerioAction } from "@/lib/perio/types";
import { createEmptyExamination } from "@/lib/perio/create-empty-examination";
import { calculateSummary } from "@/lib/perio/calculations";
import { JawTable } from "./jaw-table";
import { TongueDivider } from "./tongue-divider";
import { SummaryBar } from "./summary-bar";

function perioReducer(state: PerioExamination, action: PerioAction): PerioExamination {
  switch (action.type) {
    case "SET_CHECKBOX":
      return {
        ...state,
        teeth: {
          ...state.teeth,
          [action.tooth]: {
            ...state.teeth[action.tooth],
            sites: {
              ...state.teeth[action.tooth].sites,
              [action.site]: {
                ...state.teeth[action.tooth].sites[action.site],
                [action.field]: action.value,
              },
            },
          },
        },
      };

    case "SET_NUMERIC":
      return {
        ...state,
        teeth: {
          ...state.teeth,
          [action.tooth]: {
            ...state.teeth[action.tooth],
            sites: {
              ...state.teeth[action.tooth].sites,
              [action.site]: {
                ...state.teeth[action.tooth].sites[action.site],
                [action.field]: action.value,
              },
            },
          },
        },
      };

    case "TOGGLE_MISSING":
      return {
        ...state,
        teeth: {
          ...state.teeth,
          [action.tooth]: {
            ...state.teeth[action.tooth],
            missing: !state.teeth[action.tooth].missing,
          },
        },
      };

    case "SET_COMMENT":
      return {
        ...state,
        teeth: {
          ...state.teeth,
          [action.tooth]: {
            ...state.teeth[action.tooth],
            comment: action.comment,
          },
        },
      };

    case "CLEAR_ALL":
      return createEmptyExamination();
  }
}

export function PerioChart() {
  const [examination, dispatch] = useReducer(perioReducer, null, createEmptyExamination);

  const summary = useMemo(() => calculateSummary(examination), [examination]);

  return (
    <div className="space-y-2">
      <SummaryBar summary={summary} />

      <div className="rounded-2xl border border-[var(--brand-ink-10)] bg-[var(--brand-card)] p-3">
        <JawTable jaw="upper" examination={examination} dispatch={dispatch} />
        <TongueDivider />
        <JawTable jaw="lower" examination={examination} dispatch={dispatch} />
      </div>
    </div>
  );
}
