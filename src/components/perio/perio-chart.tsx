"use client";

import { useReducer, useMemo } from "react";
import type { PerioExamination, PerioAction, ToothNumber } from "@/lib/perio/types";
import { createEmptyExamination, createEmptySite } from "@/lib/perio/create-empty-examination";
import { calculateSummary } from "@/lib/perio/calculations";
import { JawTable } from "./jaw-table";
import { TongueDivider } from "./tongue-divider";
import { SummaryBar } from "./summary-bar";

function updateTooth(state: PerioExamination, tooth: ToothNumber, patch: Partial<PerioExamination["teeth"][ToothNumber]>): PerioExamination {
  return {
    ...state,
    teeth: {
      ...state.teeth,
      [tooth]: { ...state.teeth[tooth], ...patch },
    },
  };
}

function perioReducer(state: PerioExamination, action: PerioAction): PerioExamination {
  switch (action.type) {
    case "SET_CHECKBOX":
    case "SET_NUMERIC": {
      const tooth = state.teeth[action.tooth];
      return updateTooth(state, action.tooth, {
        sites: {
          ...tooth.sites,
          [action.site]: {
            ...tooth.sites[action.site],
            [action.field]: action.value,
          },
        },
      });
    }

    case "TOGGLE_MISSING": {
      const wasMissing = state.teeth[action.tooth].missing;
      return updateTooth(state, action.tooth, {
        missing: !wasMissing,
        // Reset site data when marking as missing
        ...(!wasMissing && {
          sites: { D: createEmptySite(), M: createEmptySite() },
          comment: "",
        }),
      });
    }

    case "SET_COMMENT":
      return updateTooth(state, action.tooth, { comment: action.comment });

    case "CLEAR_ALL":
      return createEmptyExamination();
  }
}

export function PerioChart() {
  const [examination, dispatch] = useReducer(perioReducer, null, createEmptyExamination);

  const summary = useMemo(() => calculateSummary(examination), [examination]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <SummaryBar summary={summary} />
        <button
          type="button"
          onClick={() => dispatch({ type: "CLEAR_ALL" })}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          Rensa parod
        </button>
      </div>

      <div className="rounded-2xl border border-[var(--brand-ink-10)] bg-[var(--brand-card)] p-3">
        <JawTable jaw="upper" examination={examination} dispatch={dispatch} />
        <TongueDivider />
        <JawTable jaw="lower" examination={examination} dispatch={dispatch} />
      </div>
    </div>
  );
}
