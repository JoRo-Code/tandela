"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useScribe } from "@elevenlabs/react";
import { useOpenAITranscribe } from "@/hooks/use-openai-transcribe";

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
  onCommit: (scribeText: string, openaiText: string | null) => void,
  lang: VoiceLang = "sv",
): UseVoiceInputReturn {
  const [supported, setSupported] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  const openai = useOpenAITranscribe();

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    languageCode: lang,
    commitStrategy: "vad" as never,
    vadSilenceThresholdSecs: 1.5,
    onCommittedTranscript: (transcript) => {
      // Grab the latest OpenAI transcript synchronously via ref
      const openaiText = openai.lastTranscriptRef.current;
      onCommitRef.current(transcript.text, openaiText);
    },
  });

  const isListening = scribe.isConnected || scribe.status === "connecting";

  const liveTranscript = scribe.partialTranscript ?? "";

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
      // Patch send() to silently ignore when the WebSocket is already closed.
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
