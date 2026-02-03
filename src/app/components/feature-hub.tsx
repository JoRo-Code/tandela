"use client";

import { useEffect, useState } from "react";

const features = [
  {
    id: "calls",
    label: "Phone Calls",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
      </svg>
    ),
    angle: -60,
    product: "Receptionist",
  },
  {
    id: "email",
    label: "Email",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
      </svg>
    ),
    angle: 0,
    product: "Receptionist",
  },
  {
    id: "calendar",
    label: "Appointments",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
      </svg>
    ),
    angle: 60,
    product: "Receptionist",
  },
  {
    id: "voice",
    label: "Voice Notes",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z" />
      </svg>
    ),
    angle: 120,
    product: "Secretary",
  },
  {
    id: "records",
    label: "Clinical Records",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
      </svg>
    ),
    angle: 180,
    product: "Secretary",
  },
  {
    id: "history",
    label: "Patient History",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    angle: -120,
    product: "Both",
  },
];

export function FeatureHub() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const radius = 130;
  const centerX = 180;
  const centerY = 160;

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
      <div className="relative h-[340px] w-full">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 360 320">
          {/* Connection lines */}
          {features.map((feature, index) => {
            const angleRad = (feature.angle * Math.PI) / 180;
            const x = centerX + radius * Math.cos(angleRad);
            const y = centerY + radius * Math.sin(angleRad);
            const isActive = index === activeIndex;

            return (
              <g key={feature.id}>
                {/* Curved connection line */}
                <path
                  d={`M ${centerX} ${centerY} Q ${(centerX + x) / 2 + 20} ${(centerY + y) / 2 - 20} ${x} ${y}`}
                  fill="none"
                  stroke={isActive ? "var(--brand-ember)" : "var(--brand-ink)"}
                  strokeWidth={isActive ? 2 : 1}
                  strokeOpacity={isActive ? 0.6 : 0.15}
                  strokeDasharray={isActive ? "none" : "4 4"}
                  className="transition-all duration-500"
                />
                {/* Animated dot on active line */}
                {isActive && (
                  <circle r="4" fill="var(--brand-ember)">
                    <animateMotion
                      dur="1.5s"
                      repeatCount="indefinite"
                      path={`M ${centerX} ${centerY} Q ${(centerX + x) / 2 + 20} ${(centerY + y) / 2 - 20} ${x} ${y}`}
                    />
                  </circle>
                )}
              </g>
            );
          })}
        </svg>

        {/* Center hub */}
        <div
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ${isVisible ? "scale-100 opacity-100" : "scale-50 opacity-0"}`}
          style={{ marginTop: "-20px" }}
        >
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-[var(--brand-ember-20)] blur-xl animate-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-[var(--brand-ink-20)] bg-[var(--brand-card)] shadow-lg">
              <span className="text-3xl font-bold text-[var(--brand-ink)]">T</span>
            </div>
          </div>
        </div>

        {/* Feature nodes */}
        {features.map((feature, index) => {
          const angleRad = (feature.angle * Math.PI) / 180;
          const x = centerX + radius * Math.cos(angleRad);
          const y = centerY + radius * Math.sin(angleRad);
          const isActive = index === activeIndex;

          return (
            <div
              key={feature.id}
              className={`absolute transition-all duration-500 ${isVisible ? "scale-100 opacity-100" : "scale-0 opacity-0"}`}
              style={{
                left: x,
                top: y,
                transform: "translate(-50%, -50%)",
                transitionDelay: `${index * 100}ms`,
              }}
            >
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                    isActive
                      ? "border-[var(--brand-ember)] bg-[var(--brand-card)] shadow-lg scale-110"
                      : "border-[var(--brand-ink-20)] bg-[var(--brand-card-70)]"
                  }`}
                >
                  <span className={`transition-colors duration-300 ${isActive ? "text-[var(--brand-ember)]" : "text-[var(--brand-olive)]"}`}>
                    {feature.icon}
                  </span>
                </div>
                <span
                  className={`text-xs font-medium transition-colors duration-300 whitespace-nowrap ${
                    isActive ? "text-[var(--brand-ink)]" : "text-[var(--brand-olive)]"
                  }`}
                >
                  {feature.label}
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider transition-all duration-300 ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                  style={{ color: feature.product === "Receptionist" ? "var(--brand-ember)" : feature.product === "Secretary" ? "var(--brand-olive)" : "var(--brand-ink)" }}
                >
                  {feature.product}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active feature description */}
      <div className="border-t border-[var(--brand-ink-10)] bg-[var(--brand-cream)] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-olive)]">
              Active Feature
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--brand-ink)]">
              {features[activeIndex].label}
            </p>
          </div>
          <div className="rounded-full bg-[var(--brand-ember-20)] px-3 py-1 text-xs font-semibold text-[var(--brand-ink)]">
            {features[activeIndex].product}
          </div>
        </div>
      </div>
    </div>
  );
}
