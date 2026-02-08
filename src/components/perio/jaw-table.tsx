"use client";

import type { PerioExamination, PerioAction, ToothNumber, MeasurementSite, CheckboxField, NumericField } from "@/lib/perio/types";
import { UPPER_JAW_TEETH, LOWER_JAW_TEETH, UPPER_ROW_ORDER, LOWER_ROW_ORDER, ROW_LABELS, MULTI_ROOTED_TEETH } from "@/lib/perio/constants";
import { CheckboxCell } from "./checkbox-cell";
import { NumericCell } from "./numeric-cell";
import { useCallback } from "react";

type Jaw = "upper" | "lower";

interface JawTableProps {
  jaw: Jaw;
  examination: PerioExamination;
  dispatch: React.Dispatch<PerioAction>;
}

const CHECKBOX_ROWS: CheckboxField[] = ["furcation", "bleeding", "plaque"];
type RowKey = CheckboxField | NumericField;

function isCheckboxRow(key: RowKey): key is CheckboxField {
  return (CHECKBOX_ROWS as string[]).includes(key);
}

export function JawTable({ jaw, examination, dispatch }: JawTableProps) {
  const teeth = jaw === "upper" ? UPPER_JAW_TEETH : LOWER_JAW_TEETH;
  const rowOrder = jaw === "upper" ? UPPER_ROW_ORDER : LOWER_ROW_ORDER;

  const handleCheckbox = useCallback(
    (tooth: ToothNumber, site: MeasurementSite, field: CheckboxField, value: boolean) => {
      dispatch({ type: "SET_CHECKBOX", tooth, site, field, value });
    },
    [dispatch],
  );

  const handleNumeric = useCallback(
    (tooth: ToothNumber, site: MeasurementSite, field: NumericField, value: number | null) => {
      dispatch({ type: "SET_NUMERIC", tooth, site, field, value });
    },
    [dispatch],
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse" style={{ tableLayout: "fixed", minWidth: 900 }}>
        <colgroup>
          <col style={{ width: 90 }} />
          {teeth.flatMap((t) => [
            <col key={`${t}-d`} style={{ width: 28 }} />,
            <col key={`${t}-m`} style={{ width: 28 }} />,
          ])}
        </colgroup>

        <thead>
          {/* Tooth numbers row */}
          <tr>
            <th className="sticky left-0 z-10 bg-[var(--brand-card)] p-1" />
            {teeth.map((t, i) => {
              const isMissing = examination.teeth[t].missing;
              return (
                <th
                  key={t}
                  colSpan={2}
                  className={`
                    p-1 text-center font-mono text-xs font-semibold
                    ${i === 8 ? "border-l-2 border-[var(--brand-ink-20)]" : i > 0 ? "border-l border-[var(--brand-ink-10)]" : ""}
                  `}
                >
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "TOGGLE_MISSING", tooth: t })}
                    className={`
                      rounded px-1 py-0.5 transition-colors
                      ${isMissing
                        ? "bg-[var(--brand-ink-10)] text-[var(--brand-ink-40)] line-through"
                        : "text-[var(--brand-ink)] hover:bg-[var(--brand-ink-10)]"}
                    `}
                    title={isMissing ? `Tand ${t}: markerad som saknad` : `Klicka för att markera tand ${t} som saknad`}
                  >
                    {t}
                  </button>
                </th>
              );
            })}
          </tr>
          {/* D | M sub-headers */}
          <tr>
            <th className="sticky left-0 z-10 bg-[var(--brand-card)] p-0" />
            {teeth.map((t, i) => (
              <th
                key={`${t}-sub`}
                colSpan={2}
                className={`
                  p-0 ${i === 8 ? "border-l-2 border-[var(--brand-ink-20)]" : i > 0 ? "border-l border-[var(--brand-ink-10)]" : ""}
                `}
              >
                <div className="flex justify-around text-[9px] text-[var(--brand-ink-40)]">
                  <span>D</span>
                  <span>M</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rowOrder.map((rowKey) => (
            <tr key={rowKey} className="group">
              {/* Row label */}
              <td className="sticky left-0 z-10 bg-[var(--brand-cream)] px-2 py-1.5 text-[10px] font-semibold text-[var(--brand-olive)] whitespace-nowrap">
                {ROW_LABELS[rowKey]}
              </td>

              {/* Cells for each tooth */}
              {teeth.map((toothNum, toothIdx) => {
                const tooth = examination.teeth[toothNum];
                const isMissing = tooth.missing;
                const isMidline = toothIdx === 8;

                return (["D", "M"] as MeasurementSite[]).map((site, siteIdx) => (
                  <td
                    key={`${toothNum}-${site}-${rowKey}`}
                    className={`
                      p-0.5 text-center
                      ${isMissing ? "opacity-20 pointer-events-none" : ""}
                      ${isMidline && siteIdx === 0 ? "border-l-2 border-[var(--brand-ink-20)]" : !isMidline && siteIdx === 0 && toothIdx > 0 ? "border-l border-[var(--brand-ink-10)]" : ""}
                    `}
                  >
                    <div className="flex items-center justify-center">
                      {isCheckboxRow(rowKey) ? (
                        rowKey === "furcation" && !MULTI_ROOTED_TEETH.has(toothNum) ? (
                          <span className="flex h-5 w-5 items-center justify-center text-[9px] text-[var(--brand-ink-10)]">–</span>
                        ) : (
                        <CheckboxCell
                          checked={tooth.sites[site][rowKey]}
                          onChange={(val) => handleCheckbox(toothNum, site, rowKey, val)}
                          variant={rowKey}
                          disabled={isMissing}
                          ariaLabel={`${ROW_LABELS[rowKey]}, tand ${toothNum}, ${site === "D" ? "distal" : "mesial"}`}
                        />)
                      ) : (
                        <NumericCell
                          value={tooth.sites[site][rowKey]}
                          onChange={(val) => handleNumeric(toothNum, site, rowKey, val)}
                          min={0}
                          max={rowKey === "pocketDepth" ? 12 : 3}
                          disabled={isMissing}
                          alert={rowKey === "pocketDepth" && (tooth.sites[site].pocketDepth ?? 0) >= 4}
                          ariaLabel={`${ROW_LABELS[rowKey]}, tand ${toothNum}, ${site === "D" ? "distal" : "mesial"}`}
                        />
                      )}
                    </div>
                  </td>
                ));
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
