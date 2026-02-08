"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useScribe } from "@elevenlabs/react";
import { useRealtimeTranscribe } from "@/hooks/use-realtime-transcribe";

export type VoiceLang = "sv" | "en";

interface UseVoiceInputReturn {
  isListening: boolean;
  liveTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  supported: boolean;
}

export function useVoiceInput(
  onCommit: (transcript: string, secondaryTranscript: string | null) => void,
  lang: VoiceLang = "sv",
): UseVoiceInputReturn {
  const [supported, setSupported] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  // Buffer of Scribe commits since the last primary commit — flushed when OpenAI fires
  const scribeBufferRef = useRef<string[]>([]);

  // Primary transcription — OpenAI Realtime drives commits
  const openai = useRealtimeTranscribe({
    onTranscript: (text) => {
      const secondary = scribeBufferRef.current.length > 0
        ? scribeBufferRef.current.join(" ")
        : null;
      scribeBufferRef.current = [];
      onCommitRef.current(text, secondary);
    },
  });

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  // Scribe provides live partial preview + secondary transcript for Claude
  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    languageCode: lang,
    commitStrategy: "vad" as never,
    vadSilenceThresholdSecs: 1.5,
    onCommittedTranscript: (transcript) => {
      scribeBufferRef.current.push(transcript.text);
    },
  });

  const isListening = scribe.isConnected || scribe.status === "connecting";

  // Bubble: show OpenAI transcript when available, Scribe partial while speaking
  const liveTranscript = openai.lastTranscript || scribe.partialTranscript || "";

  const error = tokenError ?? scribe.error ?? openai.error ?? null;

  const start = useCallback(async () => {
    if (!supported) return;
    setTokenError(null);

    try {
      const tokenRes = await fetch("/api/perio/voice/token");
      if (!tokenRes.ok) {
        const body = await tokenRes.json().catch(() => ({}));
        throw new Error(body.error || `Token error ${tokenRes.status}`);
      }
      const { token } = await tokenRes.json();

      await scribe.connect({
        token,
        microphone: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Workaround: SDK bug where AudioWorklet fires port.onmessage after
      // disconnect, calling connection.send() which throws synchronously.
      const conn = scribe.getConnection();
      if (conn) {
        const originalSend = conn.send.bind(conn);
        conn.send = (...args: Parameters<typeof conn.send>) => {
          try {
            return originalSend(...args);
          } catch {
            // WebSocket already closed — ignore stale audio chunk
          }
        };
      }

      // Start OpenAI Realtime transcription in parallel
      try {
        await openai.connect();
      } catch {
        console.warn("[perio-voice] Could not start OpenAI Realtime transcription");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Okänt fel";
      setTokenError(msg);
      setTimeout(() => setTokenError(null), 3000);
    }
  }, [supported, scribe, openai]);

  const stop = useCallback(() => {
    scribe.disconnect();
    openai.disconnect();
    setTokenError(null);
  }, [scribe, openai]);

  const isListeningRef = useRef(false);
  isListeningRef.current = isListening;

  const startingRef = useRef(false);

  const toggle = useCallback(() => {
    if (isListeningRef.current || startingRef.current) {
      startingRef.current = false;
      stop();
    } else {
      startingRef.current = true;
      start().finally(() => {
        startingRef.current = false;
      });
    }
  }, [start, stop]);

  return { isListening, liveTranscript, error, start, stop, toggle, supported };
}
