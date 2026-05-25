"use client";

/**
 * VoiceChat — real voice calls to Buddy Assist for voice-enabled demos.
 *
 * The customer-facing voice path runs over OUR socket only — no LiveKit
 * client, no OpenAI SDK in the browser. We send PCM16 24kHz mono
 * (captured via AudioWorklet) on the 'audio' channel, and play back
 * the bot's audio chunks the same way. Whatever speech engine Buddy
 * uses behind the gateway is its private implementation detail.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const API_BASE =
  process.env.NEXT_PUBLIC_BUDDY_API_BASE || "http://localhost:7003/api/v1";

// Next.js only inlines literal process.env.NEXT_PUBLIC_* references, so the
// per-industry creds are listed explicitly (same pattern as buddyClient.ts).
const CREDS: Record<string, { projectId?: string; apiKey?: string }> = {
  northbrook: {
    projectId: process.env.NEXT_PUBLIC_NORTHBROOK_PROJECT_ID,
    apiKey: process.env.NEXT_PUBLIC_NORTHBROOK_API_KEY,
  },
};

type CallState = "idle" | "connecting" | "live" | "ended" | "error";

// OpenAI Realtime delivers PCM16 24kHz mono and expects the same back.
// We resample on capture and decode without resampling on playback so
// latency stays tight (~< 200ms perceived).
const TARGET_SAMPLE_RATE = 24000;

function deriveSocketBase(apiBase: string): string {
  // apiBase is "https://docassist-tcylx.../api/v1" → strip /api/v1 for the WS host.
  return apiBase.replace(/\/api\/v\d+\/?$/, "");
}

function bufferToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function base64ToBuffer(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** Linear-resample Float32 mic samples and quantise to PCM16 little-endian. */
function floatToPCM16At(input: Float32Array, from: number, to: number): Uint8Array {
  if (input.length === 0) return new Uint8Array(0);
  const ratio = from / to;
  const outLen = Math.floor(input.length / ratio);
  const pcm = new Int16Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const idx = i * ratio;
    const i0 = Math.floor(idx);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const t = idx - i0;
    const sample = input[i0] * (1 - t) + input[i1] * t;
    pcm[i] = Math.max(-1, Math.min(1, sample)) * 0x7fff;
  }
  return new Uint8Array(pcm.buffer);
}

function pcm16ToAudioBuffer(
  ctx: AudioContext,
  bytes: Uint8Array,
  sampleRate: number,
): AudioBuffer {
  const pcm = new Int16Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 2);
  const buf = ctx.createBuffer(1, pcm.length, sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 0x7fff;
  return buf;
}

export function VoiceChat({
  industrySlug,
  brand = "Voice Assistant",
  accent = "#2F6D8C",
  greeting = "Tap to start a voice call.",
}: {
  industrySlug: string;
  brand?: string;
  accent?: string;
  greeting?: string;
}) {
  const [openPanel, setOpenPanel] = useState(false);
  const [state, setState] = useState<CallState>("idle");
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [agentSpeaking, setAgentSpeaking] = useState(false);

  // Buddy-only voice transport: Socket.IO to the /voice gateway, plus
  // a single AudioContext that handles both mic capture and playback.
  const socketRef = useRef<Socket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const captureRateRef = useRef<number>(48000);
  // Continuous playhead so chunks chain gap-free.
  const playheadRef = useRef<number>(0);
  // When playhead is in the future, the bot is currently producing audio.
  const speakingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Call timer.
  useEffect(() => {
    if (state !== "live") return;
    const start = Date.now();
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 500);
    return () => clearInterval(id);
  }, [state]);

  const teardown = useCallback(() => {
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    sourceNodeRef.current?.disconnect();
    sourceNodeRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    socketRef.current?.disconnect();
    socketRef.current = null;
    if (speakingTimerRef.current) {
      clearInterval(speakingTimerRef.current);
      speakingTimerRef.current = null;
    }
    playheadRef.current = 0;
    setAgentSpeaking(false);
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  const startCall = useCallback(async () => {
    const creds = CREDS[industrySlug];
    if (!creds?.apiKey || !creds?.projectId) {
      setError(
        `Voice isn't configured for ${industrySlug} — set NEXT_PUBLIC_${industrySlug.toUpperCase()}_API_KEY.`,
      );
      setState("error");
      return;
    }
    setState("connecting");
    setError("");
    setSeconds(0);

    try {
      // 1. Mic.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });
      streamRef.current = stream;

      // 2. AudioContext + AudioWorklet that batches Float32 frames into
      //    ~100ms blocks and posts them to the main thread.
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      captureRateRef.current = ctx.sampleRate;

      const workletCode = `
        class BuddyMic extends AudioWorkletProcessor {
          constructor() {
            super();
            this.buf = [];
            this.bufLen = 0;
            this.targetSamples = Math.floor(sampleRate * 0.1);
          }
          process(inputs) {
            const input = inputs[0];
            if (!input || !input[0]) return true;
            const ch = input[0];
            this.buf.push(new Float32Array(ch));
            this.bufLen += ch.length;
            while (this.bufLen >= this.targetSamples) {
              const out = new Float32Array(this.targetSamples);
              let off = 0;
              while (off < this.targetSamples && this.buf.length) {
                const head = this.buf[0];
                const take = Math.min(head.length, this.targetSamples - off);
                out.set(head.subarray(0, take), off);
                if (take === head.length) this.buf.shift();
                else this.buf[0] = head.subarray(take);
                off += take;
              }
              this.bufLen -= this.targetSamples;
              this.port.postMessage(out, [out.buffer]);
            }
            return true;
          }
        }
        registerProcessor('buddy-mic', BuddyMic);
      `;
      const blobUrl = URL.createObjectURL(
        new Blob([workletCode], { type: "application/javascript" }),
      );
      await ctx.audioWorklet.addModule(blobUrl);
      URL.revokeObjectURL(blobUrl);

      const source = ctx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(ctx, "buddy-mic");
      sourceNodeRef.current = source;
      workletNodeRef.current = workletNode;
      source.connect(workletNode);
      // Worklet must be in the audio graph to run; route through a
      // muted gain so we don't hear ourselves.
      const sink = ctx.createGain();
      sink.gain.value = 0;
      workletNode.connect(sink).connect(ctx.destination);

      // 3. Open the Buddy voice socket.
      const socket = io(`${deriveSocketBase(API_BASE)}/voice`, {
        transports: ["websocket"],
        auth: {
          projectId: creds.projectId,
          apiKey: creds.apiKey,
        },
        reconnection: false,
      });
      socketRef.current = socket;

      socket.on("connect_error", (err) => {
        setError(err?.message || "Connection error");
        setState("error");
        teardown();
      });

      socket.on("voice_error", (e: { message: string }) => {
        setError(e?.message || "Voice error");
        setState("error");
      });

      socket.on("voice_ready", () => setState("live"));

      socket.on("audio", (b64: string) => {
        if (!audioCtxRef.current) return;
        try {
          const bytes = base64ToBuffer(b64);
          const buf = pcm16ToAudioBuffer(audioCtxRef.current, bytes, TARGET_SAMPLE_RATE);
          const src = audioCtxRef.current.createBufferSource();
          src.buffer = buf;
          src.connect(audioCtxRef.current.destination);
          const now = audioCtxRef.current.currentTime;
          const startAt = Math.max(now, playheadRef.current);
          src.start(startAt);
          playheadRef.current = startAt + buf.duration;
          // Flip the "agent speaking" indicator while audio is queued ahead.
          setAgentSpeaking(true);
          if (speakingTimerRef.current) clearInterval(speakingTimerRef.current);
          speakingTimerRef.current = setInterval(() => {
            const ctxNow = audioCtxRef.current?.currentTime ?? 0;
            if (ctxNow >= playheadRef.current - 0.05) {
              setAgentSpeaking(false);
              if (speakingTimerRef.current) {
                clearInterval(speakingTimerRef.current);
                speakingTimerRef.current = null;
              }
            }
          }, 100);
        } catch (e) {
          console.warn("[voice] audio decode failed", e);
        }
      });

      socket.on("voice_closed", () => {
        setState("ended");
        teardown();
      });

      // 4. Pipe worklet output → socket.
      workletNode.port.onmessage = (e: MessageEvent<Float32Array>) => {
        if (!socket.connected) return;
        const pcm = floatToPCM16At(
          e.data,
          captureRateRef.current,
          TARGET_SAMPLE_RATE,
        );
        socket.emit("audio", bufferToBase64(pcm));
      };
    } catch (e) {
      teardown();
      setError(e instanceof Error ? e.message : String(e));
      setState("error");
    }
  }, [industrySlug, teardown]);

  const endCall = useCallback(() => {
    teardown();
    setState("ended");
  }, [teardown]);

  const reset = () => {
    setState("idle");
    setError("");
    setSeconds(0);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const statusLine =
    state === "connecting"
      ? "Connecting…"
      : state === "live"
        ? `${agentSpeaking ? "Assistant speaking" : "Listening"} · ${mm}:${ss}`
        : state === "ended"
          ? "Call ended"
          : state === "error"
            ? "Couldn't connect"
            : greeting;

  return (
    <>
      {/* floating call button */}
      <button
        type="button"
        onClick={() => setOpenPanel((o) => !o)}
        aria-label="Voice assistant"
        style={{ background: accent }}
        className="fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full grid place-items-center text-white text-xl shadow-lg hover:-translate-y-0.5 transition-transform cursor-pointer"
      >
        {openPanel ? "✕" : "☎"}
      </button>

      {openPanel && (
        <div className="fixed bottom-24 right-6 z-[60] w-[320px] rounded-2xl overflow-hidden bg-white shadow-2xl border border-black/10">
          <div className="px-5 py-4 text-white" style={{ background: accent }}>
            <div className="text-[15px] font-semibold">{brand}</div>
            <div className="text-[12px] opacity-85">{statusLine}</div>
          </div>

          <div className="px-5 py-7 flex flex-col items-center gap-5">
            {/* pulsing call orb */}
            <div
              className="w-20 h-20 rounded-full grid place-items-center text-3xl text-white transition-all"
              style={{
                background: accent,
                boxShadow:
                  state === "live" && agentSpeaking
                    ? `0 0 0 12px ${accent}22`
                    : state === "live"
                      ? `0 0 0 6px ${accent}18`
                      : "none",
              }}
            >
              {state === "connecting" ? "…" : state === "live" ? "🎙" : state === "error" ? "!" : "☎"}
            </div>

            {state === "error" && (
              <p className="text-[12px] text-[#B53737] text-center leading-snug">{error}</p>
            )}

            {(state === "idle" || state === "ended" || state === "error") && (
              <button
                type="button"
                onClick={state === "idle" ? startCall : () => { reset(); startCall(); }}
                style={{ background: accent }}
                className="w-full py-3 rounded-xl text-white font-medium text-sm cursor-pointer hover:opacity-90"
              >
                {state === "idle" ? "Start voice call" : "Call again"}
              </button>
            )}

            {(state === "connecting" || state === "live") && (
              <button
                type="button"
                onClick={endCall}
                className="w-full py-3 rounded-xl text-white font-medium text-sm cursor-pointer hover:opacity-90"
                style={{ background: "#D14545" }}
              >
                End call
              </button>
            )}
          </div>

          <div className="text-center py-2 text-[11px] text-[#5F7282] bg-[#EAF2F6]">
            <b style={{ color: "#1E9E4B" }}>Powered by Buddy Assist</b>
          </div>
        </div>
      )}
    </>
  );
}
