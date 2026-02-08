"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseVoiceInputReturn {
  isListening: boolean;
  liveTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  supported: boolean;
}

export function useVoiceInput(onCommit: (transcript: string) => void): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const committedTextRef = useRef("");

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  const cleanup = useCallback(() => {
    workletRef.current?.disconnect();
    workletRef.current = null;
    contextRef.current?.close();
    contextRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    committedTextRef.current = "";
    setIsListening(false);
  }, []);

  const start = useCallback(async () => {
    if (!supported) return;
    setError(null);

    try {
      // 1. Get mic access first (so the user sees the permission prompt immediately)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsListening(true);

      // 2. Get WebSocket URL with token from our backend
      const tokenRes = await fetch("/api/perio/voice/token");
      if (!tokenRes.ok) {
        const body = await tokenRes.json().catch(() => ({}));
        throw new Error(body.error || `Token error ${tokenRes.status}`);
      }
      const { wsUrl } = await tokenRes.json();

      // 3. Connect to ElevenLabs realtime STT
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      committedTextRef.current = "";
      setLiveTranscript("");

      // Wait for open
      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = () => reject(new Error("WebSocket-anslutning misslyckades"));
        // Timeout after 5s
        setTimeout(() => reject(new Error("WebSocket timeout")), 5000);
      });

      // Set up message handler
      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);

        if (msg.message_type === "partial_transcript" && msg.text) {
          setLiveTranscript(committedTextRef.current + (committedTextRef.current ? " " : "") + msg.text);
        }

        if (msg.message_type === "committed_transcript" && msg.text) {
          committedTextRef.current += (committedTextRef.current ? " " : "") + msg.text;
          setLiveTranscript(committedTextRef.current);
          onCommit(msg.text);
        }
      };

      ws.onerror = () => {
        setError("WebSocket-fel");
        cleanup();
      };

      ws.onclose = () => {
        setIsListening(false);
      };

      // 4. Stream mic audio as PCM to WebSocket via AudioWorklet
      const audioContext = new AudioContext({ sampleRate: 16000 });
      contextRef.current = audioContext;

      await audioContext.audioWorklet.addModule("/pcm-processor.js");

      const source = audioContext.createMediaStreamSource(stream);
      const worklet = new AudioWorkletNode(audioContext, "pcm-processor");
      workletRef.current = worklet;

      worklet.port.onmessage = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;

        const bytes = new Uint8Array(e.data as ArrayBuffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }

        ws.send(JSON.stringify({
          message_type: "input_audio_chunk",
          audio_base_64: btoa(binary),
        }));
      };

      source.connect(worklet);
      worklet.connect(audioContext.destination);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Okänt fel";
      console.error("Voice input error:", msg);
      setError(msg);
      cleanup();
    }
  }, [supported, onCommit, cleanup]);

  const stop = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  return { isListening, liveTranscript, error, start, stop, toggle, supported };
}
