const teethUpper = [
  "18",
  "17",
  "16",
  "15",
  "14",
  "13",
  "12",
  "11",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
];

const teethLower = [
  "48",
  "47",
  "46",
  "45",
  "44",
  "43",
  "42",
  "41",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
];

const rowConfigs = [
  { id: "furk", label: "Furk. inv.", type: "dm", hint: "D/M" },
  { id: "blod", label: "Blodning", type: "dm", hint: "D/M" },
  { id: "plack", label: "Plack", type: "dm", hint: "D/M" },
  { id: "marg", label: "Marg. gingiva", type: "scale", hint: "0-3" },
  { id: "comment", label: "Kommentar", type: "note", hint: "Fri text" },
];

type Marks = Record<string, Record<number, string[] | number | boolean>>;

const upperMarks: Marks = {
  furk: {
    2: ["D"],
    4: ["M"],
    9: ["D", "M"],
  },
  blod: {
    1: ["D"],
    2: ["M"],
    5: ["D", "M"],
    8: ["D"],
    9: ["M"],
    12: ["D"],
  },
  plack: {
    0: ["D"],
    1: ["D", "M"],
    6: ["M"],
    10: ["D"],
  },
  marg: {
    3: 2,
    7: 3,
    12: 1,
  },
  comment: {
    5: true,
    11: true,
  },
};

const lowerMarks: Marks = {
  furk: {
    1: ["D"],
    6: ["M"],
    13: ["D"],
  },
  blod: {
    0: ["M"],
    4: ["D"],
    5: ["D", "M"],
    10: ["M"],
    14: ["D"],
  },
  plack: {
    2: ["D"],
    3: ["M"],
    8: ["D", "M"],
    11: ["M"],
  },
  marg: {
    6: 1,
    9: 2,
    15: 3,
  },
  comment: {
    4: true,
    12: true,
  },
};

function getDmMarks(marks: Marks, rowId: string, index: number) {
  const entry = marks[rowId]?.[index];
  return Array.isArray(entry) ? entry : [];
}

function ToothGrid({
  title,
  teeth,
  marks,
  tone,
}: {
  title: string;
  teeth: string[];
  marks: Marks;
  tone: "mint" | "sand";
}) {
  const gridTemplateColumns = `minmax(160px, 200px) repeat(${teeth.length}, minmax(56px, 1fr))`;
  const toneClasses =
    tone === "mint"
      ? "bg-[linear-gradient(120deg,_rgba(207,230,222,0.5),_rgba(255,255,255,0.9))]"
      : "bg-[linear-gradient(120deg,_rgba(238,231,215,0.6),_rgba(255,255,255,0.95))]";

  return (
    <div className="rounded-3xl border border-[var(--brand-ink-10)] bg-[var(--brand-card-70)] shadow-[0_18px_40px_rgba(26,33,27,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--brand-olive)]">
            {title}
          </span>
          <span className="rounded-full border border-[var(--brand-ink-10)] bg-[var(--brand-cream)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-ink)]">
            {teeth.length} tander
          </span>
        </div>
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--brand-olive)]">
          Ytor: M D B L/P
        </div>
      </div>
      <div className="border-t border-[var(--brand-ink-10)]">
        <div className="overflow-x-auto">
          <div className="min-w-[980px]" style={{ display: "grid", gridTemplateColumns }}>
            <div className="flex items-center justify-between gap-2 border-b border-[var(--brand-ink-10)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--brand-olive)]">
              Tand
              <span className="text-[10px] font-medium tracking-[0.15em] text-[var(--brand-ink-40)]">
                Status
              </span>
            </div>
            {teeth.map((tooth) => (
              <div
                key={`head-${title}-${tooth}`}
                className="flex items-center justify-center border-b border-l border-[var(--brand-ink-10)] px-2 py-3"
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-sm font-semibold text-[var(--brand-ink)]">
                    {tooth}
                  </span>
                  <span className="h-1.5 w-8 rounded-full bg-[var(--brand-ink-10)]" />
                </div>
              </div>
            ))}
            {rowConfigs.flatMap((row) => {
              const rowLabel = (
                <div
                  key={`${title}-${row.id}-label`}
                  className={`border-b border-[var(--brand-ink-10)] px-4 py-4 ${toneClasses}`}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-[var(--brand-ink)]">
                      {row.label}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.22em] text-[var(--brand-ink-40)]">
                      {row.hint}
                    </span>
                  </div>
                </div>
              );

              const rowCells = teeth.map((tooth, index) => {
                const cellKey = `${title}-${row.id}-${tooth}`;
                const dmMarks = getDmMarks(marks, row.id, index);
                const scaleValue =
                  row.id === "marg" && typeof marks.marg?.[index] === "number"
                    ? (marks.marg?.[index] as number)
                    : null;
                const hasNote = row.id === "comment" && Boolean(marks.comment?.[index]);

                return (
                  <div
                    key={cellKey}
                    className="flex items-center justify-center border-b border-l border-[var(--brand-ink-10)] px-2 py-3"
                  >
                    {row.type === "dm" && (
                      <div className="flex flex-col items-center gap-1">
                        {(["D", "M"] as const).map((side) => {
                          const active = dmMarks.includes(side);
                          return (
                            <span
                              key={`${cellKey}-${side}`}
                              className={`grid h-5 w-5 place-items-center rounded-full border text-[10px] font-semibold transition ${
                                active
                                  ? "border-[var(--brand-ink)] bg-[var(--brand-ink)] text-[var(--brand-sand)]"
                                  : "border-[var(--brand-ink-20)] text-[var(--brand-ink-40)]"
                              }`}
                            >
                              {side}
                            </span>
                          );
                        })}
                      </div>
                    )}
                    {row.type === "scale" && (
                      <div
                        className={`flex h-8 w-12 items-center justify-center rounded-full border text-xs font-semibold ${
                          typeof scaleValue === "number"
                            ? "border-[var(--brand-ink)] bg-[var(--brand-ink)] text-[var(--brand-sand)]"
                            : "border-[var(--brand-ink-20)] text-[var(--brand-ink-40)]"
                        }`}
                      >
                        {typeof scaleValue === "number" ? scaleValue : "0-3"}
                      </div>
                    )}
                    {row.type === "note" && (
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-2xl border ${
                          hasNote
                            ? "border-[var(--brand-ink)] bg-[var(--brand-cream)]"
                            : "border-[var(--brand-ink-20)]"
                        }`}
                      >
                        <span
                          className={`text-lg ${
                            hasNote ? "text-[var(--brand-ink)]" : "text-[var(--brand-ink-40)]"
                          }`}
                        >
                          {hasNote ? "\u2022\u2022" : "\u2022"}
                        </span>
                      </div>
                    )}
                  </div>
                );
              });

              return [rowLabel, ...rowCells];
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PerToothCard() {
  const toggles = [
    { label: "Furk. inv.", d: true, m: false },
    { label: "Blodning", d: true, m: true },
    { label: "Plack", d: false, m: true },
  ];

  return (
    <div className="rounded-3xl border border-[var(--brand-ink-10)] bg-[var(--brand-card-70)] p-6 shadow-[0_18px_40px_rgba(26,33,27,0.08)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand-olive)]">
            Aktiv tand
          </p>
          <h3 className="mt-2 font-display text-3xl text-[var(--brand-ink)]">24</h3>
        </div>
        <span className="rounded-full border border-[var(--brand-ink-20)] bg-[var(--brand-cream)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-ink)]">
          Parod protokoll
        </span>
      </div>
      <div className="mt-5 space-y-4">
        {toggles.map((item) => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-sm font-semibold text-[var(--brand-ink)]">
              {item.label}
            </span>
            <div className="flex items-center gap-2">
              {([
                { key: "D", active: item.d },
                { key: "M", active: item.m },
              ] as const).map((side) => (
                <span
                  key={`${item.label}-${side.key}`}
                  className={`grid h-7 w-7 place-items-center rounded-full border text-xs font-semibold ${
                    side.active
                      ? "border-[var(--brand-ink)] bg-[var(--brand-ink)] text-[var(--brand-sand)]"
                      : "border-[var(--brand-ink-20)] text-[var(--brand-ink-40)]"
                  }`}
                >
                  {side.key}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--brand-ink)]">
            Marg. gingiva
          </span>
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((value) => (
              <span
                key={`mg-${value}`}
                className={`grid h-7 w-7 place-items-center rounded-full border text-xs font-semibold ${
                  value === 2
                    ? "border-[var(--brand-ink)] bg-[var(--brand-ink)] text-[var(--brand-sand)]"
                    : "border-[var(--brand-ink-20)] text-[var(--brand-ink-40)]"
                }`}
              >
                {value}
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="text-sm font-semibold text-[var(--brand-ink)]">Kommentar</span>
          <div className="mt-2 rounded-2xl border border-[var(--brand-ink-10)] bg-[var(--brand-cream)] px-4 py-3 text-sm text-[var(--brand-olive)]">
            "Furdjupning 4mm distalt, notera B-ytan."
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveDictationCard() {
  const lines = [
    {
      label: "Senaste diktering",
      text: "Tand tva fyra, blodning distalt och mesialt. Marginal gingiva tva.",
    },
    {
      label: "Tolkat",
      text: "T24: Blodning D/M, Marg. gingiva 2, kommentar tillagd.",
    },
  ];

  return (
    <div className="rounded-3xl border border-[var(--brand-ink-10)] bg-[var(--brand-card-70)] p-6 shadow-[0_18px_40px_rgba(26,33,27,0.08)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand-olive)]">
            Live diktering
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[var(--brand-ink)]">
            Lyssnar och fyller i
          </h3>
        </div>
        <span className="flex items-center gap-2 rounded-full border border-[var(--brand-ink-20)] bg-[var(--brand-cream)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-ink)]">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Live
        </span>
      </div>
      <div className="mt-5 space-y-4">
        {lines.map((line) => (
          <div
            key={line.label}
            className="rounded-2xl border border-[var(--brand-ink-10)] bg-[var(--brand-cream)] px-4 py-3"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--brand-olive)]">
              {line.label}
            </p>
            <p className="mt-2 text-sm text-[var(--brand-ink)]">{line.text}</p>
          </div>
        ))}
        <div className="rounded-2xl border border-dashed border-[var(--brand-ink-20)] px-4 py-3 text-xs text-[var(--brand-ink-40)]">
          Tips: Skriv "tand tre tre plack distalt" for snabb registrering.
        </div>
      </div>
    </div>
  );
}

export default function ParodPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--brand-sand)] text-[var(--brand-ink)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-[-180px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(179,216,198,0.45)_0,_transparent_65%)] blur-3xl" />
        <div className="absolute bottom-[-200px] left-[-80px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(230,212,177,0.55)_0,_transparent_70%)] blur-3xl" />
        <div className="absolute inset-0 opacity-[0.12] texture-grid" />
      </div>

      <div className="relative z-10">
        <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-ink)] text-sm font-semibold text-[var(--brand-sand)]">
              T
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand-olive)]">
                Parod-undersokning
              </p>
              <h1 className="mt-1 font-display text-2xl text-[var(--brand-ink)]">
                Lukas E. | Klinisk oversikt
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[var(--brand-ink-20)] bg-[var(--brand-cream)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-olive)]">
              Undersokningstyp: 2-punkt
            </span>
            <button className="rounded-full border border-[var(--brand-ink-20)] bg-[var(--brand-cream)] px-4 py-2 text-xs font-semibold text-[var(--brand-ink)]">
              Starta live
            </button>
            <button className="rounded-full bg-[var(--brand-ink)] px-4 py-2 text-xs font-semibold text-[var(--brand-sand)] shadow-sm">
              Spara parod
            </button>
          </div>
        </header>

        <main className="mx-auto grid w-full max-w-6xl gap-8 px-6 pb-16 lg:grid-cols-[1.55fr_0.85fr]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-[var(--brand-ink-10)] bg-[var(--brand-card-80)] p-6 shadow-[0_30px_60px_rgba(26,33,27,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand-olive)]">
                    Parod-status
                  </p>
                  <h2 className="mt-2 font-display text-3xl text-[var(--brand-ink)]">
                    Roststyrd protokoll for snabb registrering
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { label: "BVS", value: "42.2%" },
                    { label: "PLI", value: "18.4%" },
                    { label: "Senast", value: "Idag 09:41" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-[var(--brand-ink-10)] bg-[var(--brand-cream)] px-4 py-3"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--brand-olive)]">
                        {stat.label}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-[var(--brand-ink)]">
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-[var(--brand-olive)]">
                <span className="rounded-full border border-[var(--brand-ink-10)] bg-[var(--brand-cream)] px-4 py-2">
                  Ytor: M (mesial), D (distal), B (buckal), L/P (lingual/palatinal)
                </span>
                <span className="rounded-full border border-[var(--brand-ink-10)] bg-[var(--brand-cream)] px-4 py-2">
                  D/M toggles per tand, marginal gingiva 0-3, kommentar
                </span>
              </div>
            </div>

            <ToothGrid title="Overkake" teeth={teethUpper} marks={upperMarks} tone="mint" />
            <ToothGrid title="Underkake" teeth={teethLower} marks={lowerMarks} tone="sand" />
          </section>

          <aside className="space-y-6">
            <LiveDictationCard />
            <PerToothCard />
            <div className="rounded-3xl border border-[var(--brand-ink-10)] bg-[var(--brand-card-70)] p-6 shadow-[0_18px_40px_rgba(26,33,27,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--brand-olive)]">
                Snabbnotering
              </p>
              <div className="mt-3 rounded-2xl border border-[var(--brand-ink-10)] bg-[var(--brand-cream)] p-4 text-sm text-[var(--brand-ink)]">
                "Furk inv. mesial, blodning distal pa tand 14."
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--brand-ink-40)]">
                <span className="rounded-full border border-[var(--brand-ink-10)] px-3 py-1">
                  Forslag: Tand 14
                </span>
                <span className="rounded-full border border-[var(--brand-ink-10)] px-3 py-1">
                  Furk D
                </span>
                <span className="rounded-full border border-[var(--brand-ink-10)] px-3 py-1">
                  Blodning M
                </span>
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
