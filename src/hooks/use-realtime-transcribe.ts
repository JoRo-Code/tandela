"use client";

import { useState, useCallback, useRef } from "react";

interface UseRealtimeTranscribeOptions {
  onTranscript?: (text: string) => void;
}

interface UseRealtimeTranscribeReturn {
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
  lastTranscript: string | null;
  error: string | null;
}

export function useRealtimeTranscribe(
  options: UseRealtimeTranscribeOptions = {},
): UseRealtimeTranscribeReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onTranscriptRef = useRef(options.onTranscript);
  onTranscriptRef.current = options.onTranscript;

  const disconnect = useCallback(() => {
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    setLastTranscript(null);

    // 1. Get ephemeral token
    const tokenRes = await fetch("/api/perio/voice/openai-token", { method: "POST" });
    if (!tokenRes.ok) {
      const body = await tokenRes.json().catch(() => ({}));
      throw new Error(body.error || `Token error ${tokenRes.status}`);
    }
    const { token } = await tokenRes.json();

    // 2. Open WebSocket to OpenAI Realtime (transcription session — no model in URL)
    const ws = new WebSocket(
      "wss://api.openai.com/v1/realtime",
      ["realtime", `openai-insecure-api-key.${token}`, "openai-beta.realtime-v1"],
    );
    wsRef.current = ws;

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("WebSocket connection timeout"));
        ws.close();
      }, 10000);

      ws.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };
      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error("WebSocket connection failed"));
      };
    });

    // Session is already configured via the transcription_sessions endpoint,
    // no need to send transcription_session.update.

    // 3. Handle incoming messages
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);

        if (msg.type === "conversation.item.input_audio_transcription.completed") {
          const text = msg.transcript as string | undefined;
          if (text) {
            setLastTranscript(text);
            onTranscriptRef.current?.(text);
          }
        } else if (msg.type === "error") {
          console.error("[openai-realtime] error event:", msg.error);
          setError(msg.error?.message ?? "OpenAI Realtime error");
        }
      } catch {
        // Ignore parse errors
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = () => {
      setError("OpenAI WebSocket error");
      disconnect();
    };

    // 4. Set up AudioWorklet pipeline for PCM16 streaming
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    streamRef.current = stream;

    const audioContext = new AudioContext({ sampleRate: 48000 });
    audioContextRef.current = audioContext;

    await audioContext.audioWorklet.addModule("/pcm-processor.js");

    const source = audioContext.createMediaStreamSource(stream);
    const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");
    workletNodeRef.current = workletNode;

    workletNode.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return;

      // Convert PCM16 ArrayBuffer to base64
      const bytes = new Uint8Array(e.data);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);

      wsRef.current.send(
        JSON.stringify({
          type: "input_audio_buffer.append",
          audio: base64,
        }),
      );
    };

    source.connect(workletNode);
    workletNode.connect(audioContext.destination); // required for worklet to process
    setIsConnected(true);
  }, [disconnect]);

  return {
    connect,
    disconnect,
    isConnected,
    lastTranscript,
    error,
  };
}
