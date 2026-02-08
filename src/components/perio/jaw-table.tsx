"use client";

import type { PerioExamination, PerioAction, ToothNumber, MeasurementSite, CheckboxField, NumericField } from "@/lib/perio/types";
import { UPPER_JAW_TEETH, LOWER_JAW_TEETH, UPPER_ROW_ORDER, LOWER_ROW_ORDER, ROW_LABELS, TOOTH_SITE_CONFIGS } from "@/lib/perio/constants";
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
          {teeth.map((t) => (
            <col key={t} style={{ width: 58 }} />
          ))}
        </colgroup>

        <thead>
          {/* Tooth numbers */}
          <tr>
            <th className="sticky left-0 z-10 bg-[var(--brand-card)] p-1" />
            {teeth.map((t, i) => {
              const isMissing = examination.teeth[t].missing;
              return (
                <th
                  key={t}
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
        </thead>

        <tbody>
          {rowOrder.map((rowKey) => {
            const isFurcation = rowKey === "furcation";

            return (
              <tr key={rowKey}>
                <td className="sticky left-0 z-10 bg-[var(--brand-cream)] px-2 py-1 text-[10px] font-semibold text-[var(--brand-olive)] whitespace-nowrap">
                  {ROW_LABELS[rowKey]}
                </td>

                {teeth.map((toothNum, toothIdx) => {
                  const tooth = examination.teeth[toothNum];
                  const isMissing = tooth.missing;
                  const isMidline = toothIdx === 8;
                  const config = TOOTH_SITE_CONFIGS[toothNum];
                  const sites = isFurcation ? config.furcation : config.general;

                  return (
                    <td
                      key={`${toothNum}-${rowKey}`}
                      className={`
                        p-0 align-middle
                        ${isMissing ? "opacity-20 pointer-events-none" : ""}
                        ${isMidline ? "border-l-2 border-[var(--brand-ink-20)]" : toothIdx > 0 ? "border-l border-[var(--brand-ink-10)]" : ""}
                      `}
                    >
                      {sites.length === 0 ? (
                        <div className="flex h-5 items-center justify-center">
                          <span className="text-[8px] text-[var(--brand-ink-10)]">–</span>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-px py-0.5">
                          {sites.map((site) => (
                            <div key={site} className="flex items-center justify-center">
                              {isCheckboxRow(rowKey) ? (
                                <CheckboxCell
                                  checked={tooth.sites[site]?.[rowKey] ?? false}
                                  onChange={(val) => handleCheckbox(toothNum, site, rowKey, val)}
                                  variant={rowKey}
                                  label={site}
                                  disabled={isMissing}
                                  ariaLabel={`${ROW_LABELS[rowKey]}, tand ${toothNum}, ${site}`}
                                />
                              ) : (
                                <NumericCell
                                  value={tooth.sites[site]?.[rowKey] ?? null}
                                  onChange={(val) => handleNumeric(toothNum, site, rowKey, val)}
                                  label={site}
                                  min={0}
                                  max={rowKey === "pocketDepth" ? 12 : 3}
                                  disabled={isMissing}
                                  alert={rowKey === "pocketDepth" && (tooth.sites[site]?.pocketDepth ?? 0) >= 4}
                                  ariaLabel={`${ROW_LABELS[rowKey]}, tand ${toothNum}, ${site}`}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
