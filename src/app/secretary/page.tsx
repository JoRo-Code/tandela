"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const LANGUAGE = "sv-SE";
const CONFIDENCE_THRESHOLD = 0.78;
const CLARIFICATION_COOLDOWN_MS = 12000;

interface Segment {
  id: string;
  text: string;
  confidence: number;
  timestamp: string;
  flags: string[];
  codes: string[];
}

interface ClarificationItem {
  id: string;
  segmentId: string;
  prompt: string;
  reason: string;
  resolved: boolean;
}

const codePatterns: RegExp[] = [
  /\b([1-4][1-8])\b/g,
  /\b([A-Z]\d)\b/g,
  /\b(MOD|DO|MO|OD|OM|M|O|D|B|L)\b/gi,
];

const vowelRegex = /[aeiouy]/i;

function extractCodes(text: string) {
  const codes = new Set<string>();
  codePatterns.forEach((pattern) => {
    const matches = text.match(pattern);
    matches?.forEach((match) => codes.add(match.toUpperCase()));
  });
  return Array.from(codes);
}

function looksGarbled(text: string) {
  const trimmed = text.trim();
  if (trimmed.length < 2) return true;
  if (!vowelRegex.test(trimmed) && trimmed.length < 6) return true;
  return false;
}

function formatTime() {
  return new Date().toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `seg_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

export default function SecretaryTranscriptionPage() {
  const [supported, setSupported] = useState(true);
  const [status, setStatus] = useState("Idle");
  const [isRecording, setIsRecording] = useState(false);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [interimText, setInterimText] = useState("");
  const [clarifications, setClarifications] = useState<ClarificationItem[]>([]);
  const [autoClarify, setAutoClarify] = useState(false);
  const [developerMode, setDeveloperMode] = useState(true);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const isPromptingRef = useRef(false);
  const lastClarifyAtRef = useRef(0);
  const autoClarifyRef = useRef(autoClarify);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioStreamRef = useRef<MediaStream | null>(null);

  const finalTranscript = useMemo(
    () => segments.map((segment) => segment.text.trim()).join(" ").trim(),
    [segments]
  );

  const resolvedClarifications = useMemo(
    () => clarifications.filter((item) => !item.resolved),
    [clarifications]
  );

  const speakPrompt = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    isPromptingRef.current = true;
    recognitionRef.current?.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.onend = () => {
      isPromptingRef.current = false;
      if (isRecordingRef.current) {
        recognitionRef.current?.start();
      }
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  useEffect(() => {
    const SpeechRecognitionImpl =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = LANGUAGE;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) {
          const text = transcript.trim();
          if (text.length === 0) continue;

          const confidence = result[0]?.confidence ?? 0.5;
          const codes = extractCodes(text);
          const flags: string[] = [];

          if (confidence < CONFIDENCE_THRESHOLD) {
            flags.push("Low confidence");
          }
          if (codes.length > 0) {
            flags.push("Short codes detected");
          }
          if (looksGarbled(text)) {
            flags.push("Needs review");
          }

          const segment: Segment = {
            id: createId(),
            text,
            confidence,
            timestamp: formatTime(),
            flags,
            codes,
          };

          setSegments((prev) => [...prev, segment]);
          setInterimText("");

          if (flags.length > 0) {
            const prompt = codes.length
              ? `I heard: ${codes.join(", ")}. Is that correct?`
              : `I heard: ${text}. Is that correct?`;

            const clarification: ClarificationItem = {
              id: createId(),
              segmentId: segment.id,
              prompt,
              reason: flags.join(" - "),
              resolved: false,
            };

            setClarifications((prev) => [...prev, clarification]);

            const now = Date.now();
            if (
              autoClarifyRef.current &&
              now - lastClarifyAtRef.current > CLARIFICATION_COOLDOWN_MS
            ) {
              lastClarifyAtRef.current = now;
              speakPrompt(prompt);
            }
          }
        } else {
          interim += transcript;
        }
      }

      setInterimText(interim.trim());
    };

    recognition.onerror = (event: any) => {
      setStatus(`Error: ${event?.error ?? "Unknown"}`);
    };

    recognition.onend = () => {
      if (isRecordingRef.current && !isPromptingRef.current) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [speakPrompt]);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    autoClarifyRef.current = autoClarify;
  }, [autoClarify]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = useCallback(async () => {
    if (!supported || isRecordingRef.current) return;
    setStatus("Listening...");
    setAudioUrl(null);
    setSegments([]);
    setClarifications([]);
    setInterimText("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;

      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        audioChunksRef.current = [];
      };
      recorder.start();
      mediaRecorderRef.current = recorder;

      recognitionRef.current?.start();
      setIsRecording(true);
      isRecordingRef.current = true;
    } catch (error) {
      setStatus("Microphone permission denied");
    }
  }, [supported]);

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return;

    setStatus("Stopped");
    setIsRecording(false);
    isRecordingRef.current = false;

    recognitionRef.current?.stop();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }
  }, []);

  const clearSession = useCallback(() => {
    setSegments([]);
    setClarifications([]);
    setInterimText("");
    setAudioUrl(null);
    setStatus("Idle");
  }, []);

  const resolveClarification = useCallback((id: string) => {
    setClarifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, resolved: true } : item))
    );
  }, []);

  const playAudioPrompt = useCallback(
    (prompt: string) => {
      speakPrompt(prompt);
    },
    [speakPrompt]
  );

  return (
    <div className="min-h-screen bg-[var(--brand-sand)] text-[var(--brand-ink)]">
      <header className="border-b border-[var(--brand-ink-10)] bg-[var(--brand-card-60)]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--brand-ink)] text-sm font-semibold text-[var(--brand-sand)]">
              T
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-[var(--brand-olive)]">
                Secretary mode
              </p>
              <h1 className="text-lg font-semibold">Swedish transcription</h1>
            </div>
          </div>
          <Link
            href="/"
            className="text-sm font-semibold text-[var(--brand-olive)] hover:text-[var(--brand-ink)]"
          >
            &lt;- Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-[var(--brand-ink-10)] bg-[var(--brand-card)] p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Session controls</h2>
            <p className="mt-2 text-sm text-[var(--brand-olive)]">
              Language: <span className="font-semibold text-[var(--brand-ink)]">sv-SE</span>
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={startRecording}
                disabled={!supported || isRecording}
                className="rounded-full bg-[var(--brand-ink)] px-5 py-2 text-sm font-semibold text-[var(--brand-sand)] shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                Start listening
              </button>
              <button
                type="button"
                onClick={stopRecording}
                disabled={!isRecording}
                className="rounded-full border border-[var(--brand-ink-20)] px-5 py-2 text-sm font-semibold text-[var(--brand-ink)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Stop
              </button>
              <button
                type="button"
                onClick={clearSession}
                className="rounded-full border border-[var(--brand-ink-10)] px-5 py-2 text-sm font-semibold text-[var(--brand-olive)]"
              >
                Clear
              </button>
            </div>
            <div className="mt-4 text-sm text-[var(--brand-olive)]">
              Status: <span className="font-semibold text-[var(--brand-ink)]">{status}</span>
            </div>

            {!supported && (
              <div className="mt-4 rounded-2xl border border-[var(--brand-ember-20)] bg-[var(--brand-cream)] p-4 text-sm text-[var(--brand-olive)]">
                SpeechRecognition is not supported in this browser. Use Chrome for a quick test.
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-[var(--brand-ink-10)] bg-[var(--brand-card)] p-6 shadow-sm">
            <h3 className="text-base font-semibold">Clarification policy</h3>
            <p className="mt-2 text-sm text-[var(--brand-olive)]">
              Light, pause-only clarification prompts. Toggle to silence prompts.
            </p>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--brand-ink-10)] bg-[var(--brand-cream)] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--brand-ink)]">
                  Auto ask for confirmation
                </p>
                <p className="text-xs text-[var(--brand-olive)]">
                  Uses English prompts for low confidence or short codes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAutoClarify((prev) => !prev)}
                className={`relative h-7 w-12 rounded-full transition ${
                  autoClarify
                    ? "bg-[var(--brand-ink)]"
                    : "bg-[var(--brand-ink-20)]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-[var(--brand-sand)] shadow-sm transition ${
                    autoClarify ? "left-6" : "left-0.5"
                  }`}
                />
              </button>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-[var(--brand-ink-10)] bg-[var(--brand-cream)] px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-[var(--brand-ink)]">Developer mode</p>
                <p className="text-xs text-[var(--brand-olive)]">
                  Show live segments, confidence, and diffs.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeveloperMode((prev) => !prev)}
                className={`relative h-7 w-12 rounded-full transition ${
                  developerMode
                    ? "bg-[var(--brand-ink)]"
                    : "bg-[var(--brand-ink-20)]"
                }`}
              >
                <span
                  className={`absolute top-0.5 h-6 w-6 rounded-full bg-[var(--brand-sand)] shadow-sm transition ${
                    developerMode ? "left-6" : "left-0.5"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--brand-ink-10)] bg-[var(--brand-card)] p-6 shadow-sm">
            <h3 className="text-base font-semibold">Recording</h3>
            <p className="mt-2 text-sm text-[var(--brand-olive)]">
              Audio is captured locally. Download the latest recording to verify accuracy.
            </p>
            {audioUrl ? (
              <div className="mt-4 space-y-3">
                <audio controls className="w-full">
                  <source src={audioUrl} type="audio/webm" />
                </audio>
                <a
                  href={audioUrl}
                  download={`tandela-session-${new Date().toISOString()}.webm`}
                  className="inline-flex items-center rounded-full border border-[var(--brand-ink-20)] px-4 py-2 text-sm font-semibold text-[var(--brand-ink)]"
                >
                  Download recording
                </a>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--brand-olive)]">
                No recording yet.
              </p>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-[var(--brand-ink-10)] bg-[var(--brand-card)] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Transcript</h2>
              <span className="rounded-full border border-[var(--brand-ink-10)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-olive)]">
                Dentist view
              </span>
            </div>
            {developerMode ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-olive)]">
                    Live preview
                  </p>
                  <div className="mt-2 min-h-[72px] rounded-2xl border border-[var(--brand-ink-10)] bg-[var(--brand-cream)] p-4 text-sm text-[var(--brand-ink)]">
                    {interimText || (isRecording ? "Listening..." : "No live audio.")}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-olive)]">
                    Confirmed transcript
                  </p>
                  <div className="mt-2 min-h-[120px] rounded-2xl border border-[var(--brand-ink-10)] bg-[var(--brand-cream)] p-4 text-sm text-[var(--brand-ink)]">
                    {finalTranscript || "No confirmed transcript yet."}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 min-h-[200px] rounded-2xl border border-[var(--brand-ink-10)] bg-[var(--brand-cream)] p-4 text-sm text-[var(--brand-ink)]">
                {isRecording
                  ? "Recording in progress. Transcript will appear when the session ends."
                  : finalTranscript || "No transcript yet."}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-[var(--brand-ink-10)] bg-[var(--brand-card)] p-6 shadow-sm">
            <h3 className="text-base font-semibold">Needs confirmation</h3>
            <p className="mt-2 text-sm text-[var(--brand-olive)]">
              Flagged segments that need validation (low confidence, short codes, or unclear text).
            </p>
            {resolvedClarifications.length === 0 ? (
              <p className="mt-4 text-sm text-[var(--brand-olive)]">Nothing flagged yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {resolvedClarifications.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[var(--brand-ink-10)] bg-[var(--brand-cream)] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[var(--brand-ink)]">{item.prompt}</p>
                        <p className="mt-1 text-xs text-[var(--brand-olive)]">{item.reason}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => playAudioPrompt(item.prompt)}
                          className="rounded-full border border-[var(--brand-ink-20)] px-3 py-1 text-xs font-semibold text-[var(--brand-ink)]"
                        >
                          Play
                        </button>
                        <button
                          type="button"
                          onClick={() => resolveClarification(item.id)}
                          className="rounded-full bg-[var(--brand-ink)] px-3 py-1 text-xs font-semibold text-[var(--brand-sand)]"
                        >
                          Confirmed
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {developerMode && (
            <div className="rounded-3xl border border-[var(--brand-ink-10)] bg-[var(--brand-card)] p-6 shadow-sm">
              <h3 className="text-base font-semibold">Segment log</h3>
              <div className="mt-4 space-y-3">
                {segments.length === 0 ? (
                  <p className="text-sm text-[var(--brand-olive)]">No segments yet.</p>
                ) : (
                  segments.map((segment) => (
                    <div
                      key={segment.id}
                      className="rounded-2xl border border-[var(--brand-ink-10)] bg-[var(--brand-cream)] p-4"
                    >
                      <div className="flex items-center justify-between text-xs text-[var(--brand-olive)]">
                        <span>{segment.timestamp}</span>
                        <span>{Math.round(segment.confidence * 100)}% confidence</span>
                      </div>
                      <p className="mt-2 text-sm text-[var(--brand-ink)]">{segment.text}</p>
                      {segment.flags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {segment.flags.map((flag) => (
                            <span
                              key={flag}
                              className="rounded-full border border-[var(--brand-ink-10)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-olive)]"
                            >
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
