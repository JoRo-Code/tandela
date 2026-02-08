"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseVoiceInputReturn {
  isListening: boolean;
  liveTranscript: string;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  supported: boolean;
}

export function useVoiceInput(onCommit: (transcript: string) => void): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [supported, setSupported] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const committedTextRef = useRef("");

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia);
  }, []);

  const stop = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;
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

    try {
      // Get WebSocket URL with token from our backend
      const tokenRes = await fetch("/api/perio/voice/token");
      if (!tokenRes.ok) throw new Error("Failed to get token");
      const { wsUrl } = await tokenRes.json();

      // Connect to ElevenLabs realtime STT
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      committedTextRef.current = "";
      setLiveTranscript("");

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
        stop();
      };

      ws.onclose = () => {
        setIsListening(false);
      };

      // Wait for WebSocket to open before streaming audio
      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => resolve();
        ws.onerror = () => reject(new Error("WebSocket connection failed"));
      });

      // Capture mic audio and stream PCM chunks to WebSocket
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 16000 });
      contextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      // ScriptProcessorNode with 4096 buffer size, mono
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (ws.readyState !== WebSocket.OPEN) return;

        const float32 = e.inputBuffer.getChannelData(0);
        // Convert Float32 to Int16 PCM
        const int16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          const s = Math.max(-1, Math.min(1, float32[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Send as base64
        const bytes = new Uint8Array(int16.buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        ws.send(JSON.stringify({
          message_type: "input_audio_chunk",
          audio_base_64: base64,
        }));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsListening(true);
    } catch (err) {
      console.error("Voice input error:", err);
      stop();
    }
  }, [supported, onCommit, stop]);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  return { isListening, liveTranscript, start, stop, toggle, supported };
}
