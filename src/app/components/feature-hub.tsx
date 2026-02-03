"use client";

import { useEffect, useState } from "react";

// Icons
const PhoneIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
  </svg>
);

const EmailIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
);

const MicIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
  </svg>
);

const RecordsIcon = () => (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

// Flow sequences to animate
const flows = [
  {
    id: "secretary",
    label: "Secretary Flow",
    description: "Voice dictation becomes structured clinical records",
    product: "Secretary",
    steps: ["voice", "center", "records"],
  },
  {
    id: "calls",
    label: "Phone Handling",
    description: "Answer calls, book appointments automatically",
    product: "Receptionist",
    steps: ["phone", "center", "calendar"],
  },
  {
    id: "email",
    label: "Email Management",
    description: "Read and respond to patient emails",
    product: "Receptionist",
    steps: ["email", "center", "email"],
  },
];

// Node positions
const nodes = {
  voice: { x: 60, y: 100, icon: <MicIcon />, label: "Voice" },
  phone: { x: 60, y: 180, icon: <PhoneIcon />, label: "Calls" },
  email: { x: 60, y: 260, icon: <EmailIcon />, label: "Email" },
  center: { x: 180, y: 180, icon: null, label: "Tandela" },
  records: { x: 300, y: 100, icon: <RecordsIcon />, label: "Records" },
  calendar: { x: 300, y: 260, icon: <CalendarIcon />, label: "Calendar" },
};

export function FeatureHub() {
  const [activeFlow, setActiveFlow] = useState(0);
  const [animationStep, setAnimationStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  useEffect(() => {
    // Animate through steps of current flow
    const stepInterval = setInterval(() => {
      setAnimationStep((prev) => {
        if (prev >= 2) {
          // Move to next flow after completing current
          setTimeout(() => {
            setActiveFlow((f) => (f + 1) % flows.length);
            setAnimationStep(0);
          }, 500);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);

    return () => clearInterval(stepInterval);
  }, [activeFlow]);

  const currentFlow = flows[activeFlow];

  const getNodeState = (nodeId: string) => {
    const stepIndex = currentFlow.steps.indexOf(nodeId);
    if (stepIndex === -1) return "inactive";
    if (stepIndex < animationStep) return "completed";
    if (stepIndex === animationStep) return "active";
    return "pending";
  };

  const getLineState = (from: string, to: string) => {
    const fromIndex = currentFlow.steps.indexOf(from);
    const toIndex = currentFlow.steps.indexOf(to);
    if (fromIndex === -1 || toIndex === -1) return "inactive";
    if (Math.abs(fromIndex - toIndex) === 1 && animationStep >= Math.max(fromIndex, toIndex)) {
      return "active";
    }
    return "inactive";
  };

  return (
    <div className="relative rounded-[32px] border border-[var(--brand-ink-10)] bg-[var(--brand-card-80)] shadow-[0_24px_70px_rgba(26,33,27,0.18)] backdrop-blur overflow-hidden">
      {/* Window header */}
      <div className="flex items-center gap-2 border-b border-[var(--brand-ink-10)] bg-[var(--brand-cream)] px-4 py-3">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <div className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <div className="h-3 w-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="ml-2 text-sm font-medium text-[var(--brand-ink)]">
          Tandela Clinic Assistant
        </span>
      </div>

      {/* Grid background */}
      <div className="absolute inset-0 top-10 opacity-[0.4]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--brand-ink)" strokeWidth="0.5" opacity="0.15" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Hub visualization */}
      <div className="relative h-[320px] w-full">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 320">
          {/* Connection lines */}
          {/* Voice to Center */}
          <path
            d={`M ${nodes.voice.x + 25} ${nodes.voice.y} Q 120 140 ${nodes.center.x - 30} ${nodes.center.y - 20}`}
            fill="none"
            stroke={getLineState("voice", "center") === "active" ? "var(--brand-ember)" : "var(--brand-ink)"}
            strokeWidth={getLineState("voice", "center") === "active" ? 2 : 1}
            strokeOpacity={getLineState("voice", "center") === "active" ? 0.8 : 0.15}
            className="transition-all duration-500"
          />
          {/* Center to Records */}
          <path
            d={`M ${nodes.center.x + 30} ${nodes.center.y - 20} Q 240 140 ${nodes.records.x - 25} ${nodes.records.y}`}
            fill="none"
            stroke={getLineState("center", "records") === "active" ? "var(--brand-ember)" : "var(--brand-ink)"}
            strokeWidth={getLineState("center", "records") === "active" ? 2 : 1}
            strokeOpacity={getLineState("center", "records") === "active" ? 0.8 : 0.15}
            className="transition-all duration-500"
          />
          {/* Phone to Center (bidirectional) */}
          <path
            d={`M ${nodes.phone.x + 25} ${nodes.phone.y} L ${nodes.center.x - 35} ${nodes.center.y}`}
            fill="none"
            stroke={getLineState("phone", "center") === "active" ? "var(--brand-ember)" : "var(--brand-ink)"}
            strokeWidth={getLineState("phone", "center") === "active" ? 2 : 1}
            strokeOpacity={getLineState("phone", "center") === "active" ? 0.8 : 0.15}
            className="transition-all duration-500"
          />
          {/* Center to Calendar */}
          <path
            d={`M ${nodes.center.x + 35} ${nodes.center.y} Q 240 220 ${nodes.calendar.x - 25} ${nodes.calendar.y}`}
            fill="none"
            stroke={getLineState("center", "calendar") === "active" ? "var(--brand-ember)" : "var(--brand-ink)"}
            strokeWidth={getLineState("center", "calendar") === "active" ? 2 : 1}
            strokeOpacity={getLineState("center", "calendar") === "active" ? 0.8 : 0.15}
            className="transition-all duration-500"
          />
          {/* Email to Center (bidirectional) */}
          <path
            d={`M ${nodes.email.x + 25} ${nodes.email.y} Q 120 220 ${nodes.center.x - 30} ${nodes.center.y + 20}`}
            fill="none"
            stroke={getLineState("email", "center") === "active" ? "var(--brand-ember)" : "var(--brand-ink)"}
            strokeWidth={getLineState("email", "center") === "active" ? 2 : 1}
            strokeOpacity={getLineState("email", "center") === "active" ? 0.8 : 0.15}
            className="transition-all duration-500"
          />

          {/* Animated dots for active connections */}
          {currentFlow.steps.map((step, idx) => {
            if (idx === 0 || animationStep < idx) return null;
            const from = currentFlow.steps[idx - 1];
            const to = step;

            let pathD = "";
            if (from === "voice" && to === "center") {
              pathD = `M ${nodes.voice.x + 25} ${nodes.voice.y} Q 120 140 ${nodes.center.x - 30} ${nodes.center.y - 20}`;
            } else if (from === "center" && to === "records") {
              pathD = `M ${nodes.center.x + 30} ${nodes.center.y - 20} Q 240 140 ${nodes.records.x - 25} ${nodes.records.y}`;
            } else if (from === "phone" && to === "center") {
              pathD = `M ${nodes.phone.x + 25} ${nodes.phone.y} L ${nodes.center.x - 35} ${nodes.center.y}`;
            } else if (from === "center" && to === "calendar") {
              pathD = `M ${nodes.center.x + 35} ${nodes.center.y} Q 240 220 ${nodes.calendar.x - 25} ${nodes.calendar.y}`;
            } else if (from === "email" && to === "center") {
              pathD = `M ${nodes.email.x + 25} ${nodes.email.y} Q 120 220 ${nodes.center.x - 30} ${nodes.center.y + 20}`;
            } else if (from === "center" && to === "email") {
              pathD = `M ${nodes.center.x - 30} ${nodes.center.y + 20} Q 120 220 ${nodes.email.x + 25} ${nodes.email.y}`;
            }

            if (!pathD) return null;

            return (
              <circle key={`dot-${idx}`} r="5" fill="var(--brand-ember)">
                <animateMotion dur="0.8s" repeatCount="indefinite" path={pathD} />
              </circle>
            );
          })}
        </svg>

        {/* Input nodes (left side) */}
        {(["voice", "phone", "email"] as const).map((nodeId) => {
          const node = nodes[nodeId];
          const state = getNodeState(nodeId);
          return (
            <div
              key={nodeId}
              className={`absolute transition-all duration-500 ${isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
              style={{ left: node.x, top: node.y, transform: "translate(-50%, -50%)" }}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    state === "active"
                      ? "border-[var(--brand-ember)] bg-[var(--brand-card)] shadow-lg scale-110"
                      : state === "completed"
                      ? "border-[var(--brand-ember)] bg-[var(--brand-ember-20)]"
                      : "border-[var(--brand-ink-20)] bg-[var(--brand-card-70)]"
                  }`}
                >
                  <span className={`transition-colors duration-300 ${state === "active" || state === "completed" ? "text-[var(--brand-ember)]" : "text-[var(--brand-olive)]"}`}>
                    {node.icon}
                  </span>
                </div>
                <span className={`text-xs font-medium ${state === "active" ? "text-[var(--brand-ink)]" : "text-[var(--brand-olive)]"}`}>
                  {node.label}
                </span>
              </div>
            </div>
          );
        })}

        {/* Center hub (Tandela) */}
        <div
          className={`absolute transition-all duration-700 ${isVisible ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
          style={{ left: nodes.center.x, top: nodes.center.y, transform: "translate(-50%, -50%)" }}
        >
          <div className="relative">
            <div className={`absolute -inset-4 rounded-full blur-xl transition-all duration-500 ${getNodeState("center") === "active" ? "bg-[var(--brand-ember-20)] animate-pulse" : "bg-[var(--brand-ink-10)]"}`} />
            <div className={`relative flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all duration-300 ${
              getNodeState("center") === "active"
                ? "border-[var(--brand-ember)] bg-[var(--brand-card)] shadow-xl scale-110"
                : "border-[var(--brand-ink-20)] bg-[var(--brand-card)] shadow-lg"
            }`}>
              <span className="text-2xl font-bold text-[var(--brand-ink)]">T</span>
            </div>
          </div>
        </div>

        {/* Output nodes (right side) */}
        {(["records", "calendar"] as const).map((nodeId) => {
          const node = nodes[nodeId];
          const state = getNodeState(nodeId);
          return (
            <div
              key={nodeId}
              className={`absolute transition-all duration-500 ${isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
              style={{ left: node.x, top: node.y, transform: "translate(-50%, -50%)" }}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    state === "active"
                      ? "border-[var(--brand-ember)] bg-[var(--brand-card)] shadow-lg scale-110"
                      : state === "completed"
                      ? "border-[var(--brand-ember)] bg-[var(--brand-ember-20)]"
                      : "border-[var(--brand-ink-20)] bg-[var(--brand-card-70)]"
                  }`}
                >
                  <span className={`transition-colors duration-300 ${state === "active" || state === "completed" ? "text-[var(--brand-ember)]" : "text-[var(--brand-olive)]"}`}>
                    {node.icon}
                  </span>
                </div>
                <span className={`text-xs font-medium ${state === "active" ? "text-[var(--brand-ink)]" : "text-[var(--brand-olive)]"}`}>
                  {node.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active flow description */}
      <div className="border-t border-[var(--brand-ink-10)] bg-[var(--brand-cream)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-olive)]">
              {currentFlow.label}
            </p>
            <p className="mt-1 text-sm text-[var(--brand-ink)]">
              {currentFlow.description}
            </p>
          </div>
          <div className="rounded-full bg-[var(--brand-ember-20)] px-3 py-1 text-xs font-semibold text-[var(--brand-ink)]">
            {currentFlow.product}
          </div>
        </div>
      </div>
    </div>
  );
}
