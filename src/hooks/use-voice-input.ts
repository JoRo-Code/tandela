"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useScribe } from "@elevenlabs/react";

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
  onCommit: (transcript: string, audioBlob: Blob | null) => void,
  lang: VoiceLang = "sv",
): UseVoiceInputReturn {
  const [supported, setSupported] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  // MediaRecorder state for capturing audio chunks
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  /** Stop current recorder segment, return the audio blob, and start a new segment */
  const flushRecorder = useCallback((): Promise<Blob | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state !== "recording") {
      return Promise.resolve(null);
    }

    return new Promise<Blob | null>((resolve) => {
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        audioChunksRef.current = [];
        resolve(blob);
      };
      recorder.onstop = () => {
        // Start a new recorder for the next segment
        if (mediaStreamRef.current && mediaStreamRef.current.active) {
          startNewRecorder(mediaStreamRef.current);
        }
      };
      recorder.stop();
    });
  }, []);

  const startNewRecorder = (stream: MediaStream) => {
    const recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        audioChunksRef.current.push(e.data);
      }
    };
    recorder.start();
    recorderRef.current = recorder;
  };

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    languageCode: lang,
    commitStrategy: "vad" as never,
    vadSilenceThresholdSecs: 1.5,
    onCommittedTranscript: (transcript) => {
      flushRecorder().then((blob) => {
        onCommitRef.current(transcript.text, blob);
      });
    },
  });

  const isListening = scribe.isConnected || scribe.status === "connecting";

  const committedText = scribe.committedTranscripts.map((t) => t.text).join(" ");
  const liveTranscript = [committedText, scribe.partialTranscript].filter(Boolean).join(" ");

  const error = tokenError ?? scribe.error ?? null;

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

      // Start parallel audio recording for Whisper comparison
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        mediaStreamRef.current = stream;
        audioChunksRef.current = [];
        startNewRecorder(stream);
      } catch {
        // Non-fatal: Whisper comparison just won't work
        console.warn("[perio-voice] Could not start MediaRecorder for Whisper comparison");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Okänt fel";
      setTokenError(msg);
      setTimeout(() => setTokenError(null), 3000);
    }
  }, [supported, scribe]);

  const stop = useCallback(() => {
    scribe.disconnect();
    setTokenError(null);

    // Stop MediaRecorder and release stream
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
    audioChunksRef.current = [];
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
  }, [scribe]);

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
