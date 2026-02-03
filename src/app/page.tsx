import Link from "next/link";
import { FeatureHub } from "./components/feature-hub";

const workflowSteps = [
  {
    title: "Connect your clinic",
    description:
      "Link your phone line and calendar. Set your booking rules and clinic policies.",
  },
  {
    title: "Calls and emails handled automatically",
    description:
      "Tandela answers patient inquiries, books appointments, and sends confirmations.",
  },
  {
    title: "Capture notes hands-free",
    description:
      "Dictate during or after appointments. Tandela structures and saves your records.",
  },
];

const featureHighlights = [
  {
    title: "Patient-aware responses",
    description:
      "Pulls appointment history and preferences into every interaction.",
  },
  {
    title: "Human handoff when needed",
    description:
      "Complex cases get routed to your team with full context.",
  },
  {
    title: "Structured clinical notes",
    description:
      "Voice becomes organized records, ready for your system.",
  },
];

const planCards = [
  {
    title: "Receptionist",
    description: "Automate your front desk calls and patient emails.",
    details: ["24/7 call answering", "Appointment booking", "Patient inquiries"],
  },
  {
    title: "Secretary",
    description: "Hands-free clinical notes and visit documentation.",
    details: ["Voice-to-notes", "During-procedure capture", "Structured records"],
  },
  {
    title: "Complete",
    description: "Full coverage from first call to final chart.",
    details: ["Receptionist + Secretary", "Multi-location support", "Priority onboarding"],
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen bg-[var(--brand-sand)] text-[var(--brand-ink)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_top,_var(--brand-ember-20)_0,_transparent_70%)] blur-3xl" />
        <div className="absolute right-[-120px] top-32 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_center,_var(--brand-mist)_0,_transparent_70%)] blur-2xl motion-reduce:animate-none animate-[float_18s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-160px] left-[-60px] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle_at_center,_var(--brand-fog)_0,_transparent_70%)] blur-3xl motion-reduce:animate-none animate-[float_22s_ease-in-out_infinite]" />
        <div className="absolute inset-0 opacity-[0.15] texture-grid motion-reduce:animate-none animate-[shimmer_18s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-20 border-b border-[var(--brand-ink-10)] bg-[var(--brand-card-60)] backdrop-blur-xl shadow-[0_12px_30px_rgba(26,33,27,0.08)]">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--brand-ink)] text-sm font-semibold text-[var(--brand-sand)]">
              T
            </div>
            <span className="text-lg font-semibold tracking-tight">Tandela</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[var(--brand-olive)] lg:flex">
            <a className="transition hover:text-[var(--brand-ink)]" href="#product">
              Product
            </a>
            <a className="transition hover:text-[var(--brand-ink)]" href="#workflow">
              How it works
            </a>
            <a className="transition hover:text-[var(--brand-ink)]" href="#pricing">
              Products
            </a>
            <a className="transition hover:text-[var(--brand-ink)]" href="#security">
              Security
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-[var(--brand-olive)] transition hover:text-[var(--brand-ink)] sm:inline"
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-[var(--brand-ink)] px-4 py-2 text-sm font-semibold text-[var(--brand-sand)] shadow-sm transition hover:translate-y-[-1px] hover:shadow-md"
            >
              Get started
            </Link>
          </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-6 pb-24">
          <section className="grid items-center gap-12 pb-20 pt-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6 motion-reduce:animate-none animate-[rise_0.8s_ease-out_both]">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-ink-20)] bg-[var(--brand-cream)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-olive)]">
                AI for dental clinics
              </div>
              <h1 className="text-balance font-display text-4xl leading-[1.05] text-[var(--brand-ink)] sm:text-5xl lg:text-6xl">
                Your front desk and chairside assistant, always on.
              </h1>
              <p className="text-lg text-[var(--brand-olive)] sm:text-xl">
                Tandela handles patient calls, books appointments, and captures clinical notes — so your team can focus on care, not admin.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="rounded-full bg-[var(--brand-ink)] px-6 py-3 text-center text-sm font-semibold text-[var(--brand-sand)] shadow-lg shadow-[var(--brand-ink-20)] transition hover:translate-y-[-1px]"
                >
                  Book a demo
                </Link>
                <a
                  href="#workflow"
                  className="rounded-full border border-[var(--brand-ink-20)] px-6 py-3 text-center text-sm font-semibold text-[var(--brand-ink)] transition hover:bg-[var(--brand-cream)]"
                >
                  See how it works
                </a>
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-[var(--brand-olive)]">
                <span>24/7 call handling</span>
                <span>Hands-free charting</span>
                <span>HIPAA-ready</span>
              </div>
            </div>

            <div className="relative motion-reduce:animate-none animate-[rise_1s_ease-out_both]">
              <div className="absolute -inset-6 rounded-[32px] bg-[radial-gradient(circle_at_top,_var(--brand-ember-20)_0,_transparent_70%)] opacity-80 blur-2xl" />
              <FeatureHub />
            </div>
          </section>

          <section className="grid gap-8 pb-20 lg:grid-cols-3">
            {[
              {
                title: "Solo practices",
                copy: "Handle every call and keep perfect records, even with a small team.",
              },
              {
                title: "Multi-location clinics",
                copy: "Consistent patient experience across all your locations.",
              },
              {
                title: "Busy front desks",
                copy: "Let your staff focus on patients in the chair, not the phone.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-[var(--brand-ink-10)] bg-[var(--brand-card-70)] p-6 shadow-sm"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--brand-olive)]">
                  {item.title}
                </p>
                <p className="mt-4 text-lg text-[var(--brand-ink)]">{item.copy}</p>
              </div>
            ))}
          </section>

          <section id="workflow" className="section-anchor pb-20">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-olive)]">
                  How it works
                </p>
                <h2 className="mt-4 font-display text-3xl text-[var(--brand-ink)] sm:text-4xl">
                  From first call to finished chart, handled.
                </h2>
              </div>
              <p className="max-w-xl text-base text-[var(--brand-olive)]">
                Tandela automates the admin so your team can stay focused on what matters — patient care.
              </p>
            </div>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {workflowSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-3xl border border-[var(--brand-ink-10)] bg-[var(--brand-card)] p-6 shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--brand-ink-20)] bg-[var(--brand-cream)] font-display text-xl text-[var(--brand-ink)]">
                    {index + 1}
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-[var(--brand-ink)]">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm text-[var(--brand-olive)]">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section id="product" className="section-anchor pb-20">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-olive)]">
                  Product
                </p>
                <h2 className="mt-4 font-display text-3xl text-[var(--brand-ink)] sm:text-4xl">
                  Purpose-built for dental clinics, not generic AI.
                </h2>
              </div>
              <p className="max-w-xl text-base text-[var(--brand-olive)]">
                Built to understand dental workflows, Tandela handles patient communication and clinical documentation with precision.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl border border-[var(--brand-ink-10)] bg-[var(--brand-card)] p-6 shadow-sm lg:col-span-2">
                <h3 className="text-xl font-semibold text-[var(--brand-ink)]">
                  Two products, one seamless experience.
                </h3>
                <p className="mt-3 text-sm text-[var(--brand-olive)]">
                  Receptionist handles calls and emails. Secretary captures clinical notes. Together, they cover your entire admin workflow.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {featureHighlights.slice(0, 3).map((feature) => (
                    <div
                      key={feature.title}
                      className="rounded-2xl border border-[var(--brand-ink-10)] bg-[var(--brand-cream)] p-4"
                    >
                      <p className="text-sm font-semibold text-[var(--brand-ink)]">
                        {feature.title}
                      </p>
                      <p className="mt-2 text-xs text-[var(--brand-olive)]">
                        {feature.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--brand-ink-10)] bg-[var(--brand-cream)] p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[var(--brand-ink)]">
                  Clinic rules built-in.
                </h3>
                <p className="mt-3 text-sm text-[var(--brand-olive)]">
                  Define your booking policies, hours, and escalation rules once.
                </p>
                <div className="mt-6 space-y-3 text-sm text-[var(--brand-ink)]">
                  <div className="flex items-center justify-between rounded-xl border border-[var(--brand-ink-10)] bg-[var(--brand-card-70)] px-4 py-3">
                    <span>Emergency escalation</span>
                    <span className="text-xs font-semibold text-[var(--brand-olive)]">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[var(--brand-ink-10)] bg-[var(--brand-card-70)] px-4 py-3">
                    <span>Booking buffer rules</span>
                    <span className="text-xs font-semibold text-[var(--brand-olive)]">
                      Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-[var(--brand-ink-10)] bg-[var(--brand-card-70)] px-4 py-3">
                    <span>Insurance verification</span>
                    <span className="text-xs font-semibold text-[var(--brand-olive)]">
                      Optional
                    </span>
                  </div>
                </div>
              </div>

              <div
                id="security"
                className="section-anchor rounded-3xl border border-[var(--brand-ink-10)] bg-[var(--brand-ink)] p-6 text-[var(--brand-sand)] shadow-sm lg:col-span-2"
              >
                <h3 className="text-xl font-semibold">HIPAA-ready from day one.</h3>
                <p className="mt-3 text-sm text-[var(--brand-sand)]/80">
                  Patient data stays protected with encryption, access controls, and audit trails.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {["Data encryption", "Access controls", "Audit trails"].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-[var(--brand-ink-10)] bg-[var(--brand-cream)] p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-[var(--brand-ink)]">
                  Know how your clinic is doing.
                </h3>
                <p className="mt-3 text-sm text-[var(--brand-olive)]">
                  Track call volume, booking rates, and documentation coverage.
                </p>
                <div className="mt-6 space-y-3">
                  {[
                    "Calls answered today",
                    "Appointments booked",
                    "Notes captured",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-[var(--brand-ink-10)] bg-[var(--brand-card-70)] px-4 py-3 text-sm text-[var(--brand-ink)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section id="pricing" className="section-anchor pb-20">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-olive)]">
                  Products
                </p>
                <h2 className="mt-4 font-display text-3xl text-[var(--brand-ink)] sm:text-4xl">
                  Choose what fits your clinic.
                </h2>
              </div>
              <p className="max-w-xl text-base text-[var(--brand-olive)]">
                Start with one product or get both for complete coverage from first call to finished chart.
              </p>
            </div>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {planCards.map((plan) => (
                <div
                  key={plan.title}
                  className="flex flex-col rounded-3xl border border-[var(--brand-ink-10)] bg-[var(--brand-card-70)] p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-[var(--brand-ink)]">
                    {plan.title}
                  </h3>
                  <p className="mt-3 text-sm text-[var(--brand-olive)]">
                    {plan.description}
                  </p>
                  <div className="mt-6 space-y-2 text-sm text-[var(--brand-ink)]">
                    {plan.details.map((detail) => (
                      <div key={detail} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-ember)]" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                  <Link
                    href="/login"
                    className="mt-6 rounded-full border border-[var(--brand-ink-20)] px-4 py-2 text-center text-sm font-semibold text-[var(--brand-ink)] transition hover:bg-[var(--brand-cream)]"
                  >
                    Get started
                  </Link>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-[var(--brand-ink-10)] bg-[var(--brand-ink)] px-6 py-16 text-center text-[var(--brand-sand)] shadow-sm">
            <div className="mx-auto max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-sand)]/70">
                Ready to focus on patient care?
              </p>
              <h2 className="mt-4 font-display text-3xl sm:text-4xl">
                Get Tandela running in your clinic this week.
              </h2>
              <p className="mt-4 text-base text-[var(--brand-sand)]/80">
                Connect your phone line, set your booking rules, and let Tandela handle the admin so you can focus on your patients.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/login"
                  className="rounded-full bg-[var(--brand-sand)] px-6 py-3 text-sm font-semibold text-[var(--brand-ink)]"
                >
                  Book a demo
                </Link>
                <a
                  href="#product"
                  className="rounded-full border border-white/20 px-6 py-3 text-sm font-semibold text-[var(--brand-sand)]"
                >
                  Explore products
                </a>
              </div>
            </div>
          </section>
        </main>

        <footer className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 pb-10 text-sm text-[var(--brand-olive)] sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--brand-ink)] text-xs font-semibold text-[var(--brand-sand)]">
              T
            </div>
            <span>Tandela</span>
          </div>
          <div className="flex flex-wrap gap-4">
            <a href="#product" className="transition hover:text-[var(--brand-ink)]">
              Product
            </a>
            <a href="#workflow" className="transition hover:text-[var(--brand-ink)]">
              How it works
            </a>
            <a href="#pricing" className="transition hover:text-[var(--brand-ink)]">
              Products
            </a>
            <Link href="/login" className="transition hover:text-[var(--brand-ink)]">
              Sign in
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
