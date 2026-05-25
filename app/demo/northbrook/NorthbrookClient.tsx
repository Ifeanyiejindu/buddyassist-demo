"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { IndustrySwitcher } from "@/components/IndustrySwitcher";
import { BuddyChat } from "@/lib/buddyChat";
import { createBuddyComplete } from "@/lib/buddyClient";
import type { NbkProvider, NbkAppointment } from "@/lib/demoApi";

// ── Voice transport (Buddy /voice gateway, LiveKit hidden server-side) ──
//
// Browser captures mic → AudioWorklet batches into ~100ms blocks →
// downsample to PCM16 24kHz mono → base64 → socket.emit('audio'). Bot
// audio arrives the same way and is scheduled gap-free on a continuous
// playhead so it plays without clicks.

const VOICE_API_BASE =
  process.env.NEXT_PUBLIC_BUDDY_API_BASE || "http://localhost:7003/api/v1";
const VOICE_SOCKET_BASE = VOICE_API_BASE.replace(/\/api\/v\d+\/?$/, "");
const VOICE_TARGET_SAMPLE_RATE = 24000;

const NORTHBROOK_PROJECT_ID = process.env.NEXT_PUBLIC_NORTHBROOK_PROJECT_ID;
const NORTHBROOK_API_KEY = process.env.NEXT_PUBLIC_NORTHBROOK_API_KEY;

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

interface NorthbrookClientProps {
  /** Live providers from the Northbrook API. */
  providers: NbkProvider[];
  /** Featured patient's name (drives the chat persona). */
  featuredPatientName: string;
  /** Featured patient's upcoming appointments. */
  upcomingAppointments: NbkAppointment[];
}

// Icon glyph per specialty so the live provider cards visually match the
// old SERVICES layout. Falls back to a generic glyph for new specialties.
function specialtyIcon(s: string): string {
  const k = s.toLowerCase();
  if (k.includes("pedia")) return "♡";
  if (k.includes("derma")) return "∿";
  if (k.includes("cardio")) return "⌗";
  if (k.includes("urgent")) return "▣";
  if (k.includes("family") || k.includes("primary")) return "＋";
  return "⚕";
}

const NAV_LINKS = ["Services", "Doctors", "Locations", "Patient portal", "Insurance"];

// SERVICES + TODAYS_CALLS replaced with live providers + upcoming
// appointments via props (see NorthbrookClientProps).

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function NorthbrookClient({
  providers,
  featuredPatientName,
  upcomingAppointments,
}: NorthbrookClientProps) {
  // Resolve provider names for the upcoming appointments list.
  const providerById = new Map(providers.map((p) => [p.providerId, p]));

  // Up to 6 services — the visual grid is 3x2, real providers fit cleanly.
  const services = providers.slice(0, 6).map((p) => ({
    ic: specialtyIcon(p.specialty),
    h: p.specialty,
    p: p.bio || `${p.name} — ${p.specialty}.`,
    a: p.acceptingNewPatients ? "Accepting new patients" : "Established patients only",
  }));

  // Today/soon calls — surface the featured patient's real upcoming
  // appointments. Falls back to a hint if there are none.
  const upcomingCalls = upcomingAppointments
    .filter((a) => a.status === "scheduled")
    .slice(0, 4)
    .map((a) => {
      const provider = providerById.get(a.providerId);
      const when = new Date(a.startsAt).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
      return {
        t: `${a.reason} — ${provider?.name || "Provider"}`,
        at: when,
      };
    });

  // Build the system prompt from real provider list so the bot
  // recommends real Northbrook doctors by name, not fictional ones.
  const providerList = providers
    .filter((p) => p.acceptingNewPatients)
    .slice(0, 4)
    .map((p) => `${p.name} (${p.specialty})`)
    .join(", ");
  const SYSTEM_PROMPT = `You are Buddy, the voice care assistant for Northbrook Family Clinic. You answer like a warm, calm phone agent.
Open hours: 7am–8pm Mon–Sat, 9am–4pm Sun. Available providers: ${providerList}.
${featuredPatientName ? `You're speaking with ${featuredPatientName} (an established patient).` : ""}
Common patient asks: book/reschedule, prescription refills, symptom triage, lab results, billing, virtual vs in-person.
Triage rules: chest pain, difficulty breathing, stroke signs, severe bleeding → tell them to hang up and call 911 immediately. Anything urgent but non-emergent → offer same-day slot.
You CAN: hold a slot, send a refill request to the on-call provider, share clinic policies, give general non-diagnostic guidance.
You CANNOT: diagnose, prescribe, access another patient's chart, or quote insurance copays exactly. When in doubt say "I'll have a nurse follow up within 30 minutes."
Speak in short, spoken-style sentences (1–3 short paragraphs). Repeat back details to confirm. No emoji.`;

  const [open, setOpen] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [transcript, setTranscript] = useState<{ who: "buddy" | "you"; text: string; partial?: boolean }[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const chat = useRef(new BuddyChat({ systemPrompt: SYSTEM_PROMPT, complete: createBuddyComplete("northbrook") }));

  // ── Voice transport refs ────────────────────────────────────────────────
  // One AudioContext owns both mic capture (via AudioWorklet) and bot
  // playback. Socket lives until endCall(). The playhead lets us schedule
  // incoming audio chunks back-to-back for gap-free speech.
  const socketRef = useRef<Socket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const captureRateRef = useRef<number>(48000);
  const playheadRef = useRef<number>(0);
  const mutedRef = useRef(false);

  // Timer
  useEffect(() => {
    if (!open) return;
    const start = Date.now();
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 500);
    return () => clearInterval(id);
  }, [open]);

  // Auto-scroll transcript
  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [transcript, thinking]);

  // ── Real voice teardown — always callable, never throws ──────────────
  const teardownVoice = useCallback(() => {
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    socketRef.current?.disconnect();
    socketRef.current = null;
    playheadRef.current = 0;
    setThinking(false);
  }, []);

  // Always release the mic + socket when the panel unmounts.
  useEffect(() => () => teardownVoice(), [teardownVoice]);

  // ── Append a "buddy" transcript line, merging streaming partials ─────
  const pushBuddyText = useCallback(
    (text: string, final: boolean) => {
      setTranscript((prev) => {
        const tail = prev[prev.length - 1];
        if (tail && tail.who === "buddy" && tail.partial && !final) {
          const next = prev.slice();
          next[next.length - 1] = { ...tail, text: tail.text + text };
          return next;
        }
        if (tail && tail.who === "buddy" && tail.partial && final) {
          const next = prev.slice();
          next[next.length - 1] = { ...tail, text, partial: false };
          return next;
        }
        return [...prev, { who: "buddy", text, partial: !final }];
      });
    },
    [],
  );

  // ── Real openCall: request mic, open socket, wait for greeting ───────
  const openCall = useCallback(async () => {
    if (open) return;
    chat.current.reset();
    setTranscript([]);
    setSeconds(0);
    setInput("");
    setCallError(null);
    setMuted(false);
    mutedRef.current = false;
    setThinking(true); // shows the typing-dots until the bot's first audio
    setOpen(true);

    if (!NORTHBROOK_PROJECT_ID || !NORTHBROOK_API_KEY) {
      setCallError("Voice isn't configured for this demo.");
      setThinking(false);
      return;
    }

    try {
      // 1. Mic — browser will prompt if permission hasn't been granted.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      streamRef.current = stream;

      // 2. AudioContext + inline AudioWorklet that batches Float32 frames
      //    into ~100ms blocks. The worklet code lives in a Blob URL so
      //    we don't need a separate file.
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      captureRateRef.current = ctx.sampleRate;

      const workletCode = `
        class NbkMic extends AudioWorkletProcessor {
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
        registerProcessor('nbk-mic', NbkMic);
      `;
      const blobUrl = URL.createObjectURL(
        new Blob([workletCode], { type: "application/javascript" }),
      );
      await ctx.audioWorklet.addModule(blobUrl);
      URL.revokeObjectURL(blobUrl);

      const source = ctx.createMediaStreamSource(stream);
      const workletNode = new AudioWorkletNode(ctx, "nbk-mic");
      workletNodeRef.current = workletNode;
      source.connect(workletNode);
      // Worklet must be in the audio graph to actually run, but route
      // through a muted gain so the user doesn't hear themselves.
      const sink = ctx.createGain();
      sink.gain.value = 0;
      workletNode.connect(sink).connect(ctx.destination);

      // 3. Buddy voice socket.
      const socket = io(`${VOICE_SOCKET_BASE}/voice`, {
        transports: ["websocket"],
        auth: {
          projectId: NORTHBROOK_PROJECT_ID,
          apiKey: NORTHBROOK_API_KEY,
        },
        reconnection: false,
      });
      socketRef.current = socket;

      socket.on("connect_error", (err) => {
        setCallError(err?.message || "Connection error");
        setThinking(false);
        teardownVoice();
      });
      socket.on("voice_error", (e: { message: string }) => {
        setCallError(e?.message || "Voice error");
        setThinking(false);
      });
      socket.on("voice_ready", () => {
        // Greeting will arrive as the first 'audio' + 'transcript' events.
        setThinking(false);
      });
      // Upstream gone — keep the panel open and surface why so the visitor
      // (and we, debugging) can see the close reason instead of a silent
      // auto-close that looks like a successful hang-up.
      socket.on(
        "voice_closed",
        (info: { code?: number; reason?: string } = {}) => {
          setThinking(false);
          setCallError((prev) =>
            prev || info.reason || `Call ended unexpectedly (code ${info.code ?? "?"}).`,
          );
        },
      );
      socket.on("disconnect", (reason: string) => {
        setThinking(false);
        setCallError((prev) => prev || `Disconnected: ${reason}`);
      });

      socket.on(
        "transcript",
        (t: { text: string; role: "user" | "assistant"; final: boolean }) => {
          if (t.role === "assistant") {
            pushBuddyText(t.text, t.final);
          } else if (t.role === "user" && t.final && t.text) {
            setTranscript((prev) => [...prev, { who: "you", text: t.text }]);
          }
        },
      );

      socket.on("audio", (b64: string) => {
        if (!audioCtxRef.current) return;
        try {
          const bytes = base64ToBuffer(b64);
          const buf = pcm16ToAudioBuffer(
            audioCtxRef.current,
            bytes,
            VOICE_TARGET_SAMPLE_RATE,
          );
          const src = audioCtxRef.current.createBufferSource();
          src.buffer = buf;
          src.connect(audioCtxRef.current.destination);
          const now = audioCtxRef.current.currentTime;
          const startAt = Math.max(now, playheadRef.current);
          src.start(startAt);
          playheadRef.current = startAt + buf.duration;
        } catch {
          /* decode failure on one chunk — ignore, others will keep coming */
        }
      });

      // 4. Pipe mic chunks → socket.
      workletNode.port.onmessage = (e: MessageEvent<Float32Array>) => {
        if (mutedRef.current) return;
        if (!socket.connected) return;
        const pcm = floatToPCM16At(
          e.data,
          captureRateRef.current,
          VOICE_TARGET_SAMPLE_RATE,
        );
        socket.emit("audio", bufferToBase64(pcm));
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Couldn't start voice";
      setCallError(msg);
      setThinking(false);
      teardownVoice();
    }
  }, [open, pushBuddyText, teardownVoice]);

  // ── End-call: tear down everything, close the panel ──────────────────
  function closeCall() {
    teardownVoice();
    setOpen(false);
  }

  // ── Toggle mute (mic stops sending; bot audio still plays) ───────────
  const toggleMute = useCallback(() => {
    setMuted((m) => {
      mutedRef.current = !m;
      return !m;
    });
  }, []);

  // ── Text input fallback — inject as a user message via the socket ────
  // OpenAI Realtime accepts conversation.item.create over the same wire,
  // but the simplest server-side path is to mirror what user audio does:
  // commit a typed line as if it were a finished turn.
  async function send(text: string) {
    const v = text.trim();
    if (!v) return;
    setInput("");
    setTranscript((prev) => [...prev, { who: "you", text: v }]);
    const socket = socketRef.current;
    if (socket && socket.connected) {
      // Tell the gateway to insert this as the user's turn + ask for a reply.
      // The /voice gateway extension for 'text' is wired in the backend bridge.
      socket.emit("text", v);
    } else {
      // Voice isn't up — fall back to the text-only BuddyChat path so the
      // panel still works even before the socket is ready.
      if (chat.current.busy) return;
      setThinking(true);
      const reply = await chat.current.send(v);
      setThinking(false);
      if (reply) pushBuddyText(reply, true);
    }
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        ["--ink" as string]: "#0E2A3F",
        ["--paper" as string]: "#FCFCFA",
        ["--line" as string]: "#E3E7EA",
        ["--mute" as string]: "#5F7282",
        ["--accent" as string]: "#2F6D8C",
        ["--accent-deep" as string]: "#1F4E68",
        ["--soft" as string]: "#EAF2F6",
        ["--warm" as string]: "#F4D9B8",
        ["--buddy" as string]: "#2FC463",
        ["--buddy-deep" as string]: "#1E9E4B",
        background: "#FCFCFA",
        color: "#0E2A3F",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}
    >
      <header className="border-b border-[#E3E7EA] bg-white sticky top-0 z-50">
        <div className="max-w-[1240px] mx-auto px-7 py-4.5 flex items-center gap-8">
          <div className="flex items-center gap-2.5" style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 22, fontWeight: 500 }}>
            <div className="w-[30px] h-[30px] rounded-full grid place-items-center text-white text-sm font-semibold" style={{ background: "#2F6D8C" }}>+</div>
            <span>Northbrook</span>
          </div>
          <div className="hidden md:flex gap-6 text-sm ml-6">
            {NAV_LINKS.map((l) => (
              <a key={l} className="cursor-pointer hover:text-[#2F6D8C]">{l}</a>
            ))}
          </div>
          <div className="ml-auto flex gap-2.5 items-center">
            <a className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-lg bg-transparent text-[#0E2A3F] border border-[#E3E7EA] font-medium text-[13.5px] hover:-translate-y-px transition-transform">
              Sign in
            </a>
            <a className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-lg text-white font-medium text-[13.5px] hover:-translate-y-px transition-transform" style={{ background: "#2F6D8C" }}>
              <span className="w-3.5 h-3.5 rounded-full bg-white text-[#2F6D8C] grid place-items-center text-[9px]">☎</span>
              Book a visit
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-[1240px] mx-auto px-7 pt-15 pb-10 grid md:grid-cols-2 gap-16 items-center w-full">
        <div>
          <div className="text-xs tracking-[0.18em] uppercase text-[#1F4E68] font-medium">
            Family medicine · Since 1998
          </div>
          <h1
            className="font-medium leading-none -tracking-[0.02em] my-5"
            style={{ fontFamily: "var(--font-fraunces), serif", fontSize: "clamp(48px, 6.4vw, 82px)" }}
          >
            Trusted care,<br />
            <em className="italic" style={{ color: "#2F6D8C" }}>on your schedule.</em>
          </h1>
          <p className="text-[#5F7282] text-[17px] max-w-[48ch] mb-7 m-0">
            Same-day appointments, virtual visits, and a 24/7 care assistant that books, triages, and answers questions in plain English. Your whole family, one clinic.
          </p>
          <div className="flex gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={openCall}
              className="inline-flex items-center gap-2 px-4.5 py-3 rounded-lg text-white font-medium text-[13.5px] cursor-pointer hover:-translate-y-px transition-transform"
              style={{ background: "#2F6D8C" }}
            >
              <span className="w-3.5 h-3.5 rounded-full bg-white grid place-items-center text-[9px]" style={{ color: "#2F6D8C" }}>☎</span>
              Call our desk
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4.5 py-3 rounded-lg bg-transparent text-[#0E2A3F] border border-[#E3E7EA] font-medium text-[13.5px] cursor-pointer"
            >
              Book online
            </button>
          </div>
        </div>

        {/* Hero card */}
        <div
          className="rounded-3xl p-7 border border-[#E3E7EA]"
          style={{
            background: "linear-gradient(160deg, #EAF2F6, #fff)",
            boxShadow: "0 30px 60px rgba(14,42,63,0.08)",
          }}
        >
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full mb-3.5"
            style={{ color: "#1E9E4B", background: "#E8F9EF" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#2FC463]" />
            3 same-day slots open today
          </span>
          <div className="flex gap-3 items-center pb-3.5 border-b border-[#E3E7EA] mb-2">
            <div
              className="w-12 h-12 rounded-full"
              style={{ background: "linear-gradient(135deg, #F4D9B8, #C8A77B)" }}
            />
            <div>
              <div className="font-medium text-[18px]" style={{ fontFamily: "var(--font-fraunces), serif" }}>
                Dr. Mira Patel, MD
              </div>
              <div className="text-xs text-[#5F7282]">Family medicine · 12 yrs</div>
            </div>
          </div>
          {[
            { l: "Next available", v: "Today, 2:40 PM" },
            { l: "Visit type", v: "In-person or video" },
            { l: "Average wait", v: "8 minutes" },
            { l: "Insurance", v: "In-network ✓" },
          ].map((row) => (
            <div key={row.l} className="flex justify-between items-baseline border-b border-[#E3E7EA] py-3 last:border-b-0">
              <span className="text-xs text-[#5F7282] tracking-[0.06em] uppercase">{row.l}</span>
              <span className="font-medium" style={{ fontFamily: "var(--font-fraunces), serif" }}>
                {row.v}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Trust band */}
      <div className="border-t border-b border-[#E3E7EA] py-4.5 px-7 text-xs text-[#5F7282]" style={{ background: "#EAF2F6" }}>
        <div className="max-w-[1240px] mx-auto flex justify-between gap-6 flex-wrap">
          <span>
            <b className="text-[#0E2A3F] font-semibold">4.9 ★</b> 2,300+ reviews
          </span>
          <span>
            <b className="text-[#0E2A3F] font-semibold">HIPAA</b> compliant patient portal
          </span>
          <span>
            <b className="text-[#0E2A3F] font-semibold">Same-day</b> appointments, 7 days/week
          </span>
          <span>
            <b className="text-[#0E2A3F] font-semibold">40+</b> insurance plans accepted
          </span>
        </div>
      </div>

      {/* Services */}
      <section className="max-w-[1240px] mx-auto px-7 py-15 w-full">
        <h2 className="font-medium m-0 mb-2 -tracking-[0.02em]" style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 42, fontWeight: 500 }}>
          How we care for you.
        </h2>
        <p className="text-[#5F7282] text-[17px] max-w-[54ch] m-0 mb-8">
          From a sniffle to a chronic concern, we keep things simple. Book in seconds, talk to a real human within minutes.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {services.length === 0 && (
            <div className="col-span-3 py-8 text-center text-[#5F7282] text-sm">
              Loading care team…
            </div>
          )}
          {services.map((s, i) => (
            <div
              key={`${s.h}-${i}`}
              className="border border-[#E3E7EA] rounded-2xl p-6 bg-white transition-all hover:-translate-y-[3px] hover:shadow-[0_14px_30px_rgba(14,42,63,0.08)]"
            >
              <div
                className="w-9 h-9 rounded-[10px] grid place-items-center text-base mb-3.5"
                style={{ background: "#EAF2F6", color: "#2F6D8C" }}
              >
                {s.ic}
              </div>
              <h3 className="m-0 mb-1.5 font-medium text-[20px]" style={{ fontFamily: "var(--font-fraunces), serif" }}>
                {providers[i]?.name || s.h}
              </h3>
              <div className="text-[11px] uppercase tracking-[0.1em] text-[#2F6D8C] mb-2">
                {s.h}
              </div>
              <p className="text-[#5F7282] text-[13.5px] m-0 mb-3">{s.p}</p>
              <div className="flex justify-between text-xs font-medium border-t border-[#E3E7EA] pt-2.5" style={{ color: "#2F6D8C" }}>
                <span>{s.a}</span>
                <Link
                  href={`/demo/northbrook/provider/${providers[i]?.providerId}`}
                  className="no-underline text-inherit hover:underline"
                >
                  View profile →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Care band */}
      <section className="px-7 py-20 mt-10" style={{ background: "#0E2A3F", color: "#fff" }}>
        <div className="max-w-[1240px] mx-auto grid md:grid-cols-[1.2fr_1fr] gap-15 items-center">
          <div>
            <div className="text-xs tracking-[0.16em] uppercase mb-3.5" style={{ color: "#2FC463" }}>
              A new front door
            </div>
            <h2 className="m-0 mb-4.5 font-medium" style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 48, lineHeight: 1.05 }}>
              Call our desk<br />before you call us.
            </h2>
            <p className="text-white/70 max-w-[48ch] m-0 mb-5 text-base">
              Our desk is a 24/7 assistant. It books appointments, triages symptoms against your chart, refills prescriptions, and tells you when something needs a doctor right now. Powered by Buddy Assist — no menus, no holds, just a conversation.
            </p>
            <div className="grid grid-cols-2 gap-6 mt-6">
              <div className="border-l border-white/[0.18] pl-4">
                <div className="font-medium leading-none -tracking-[0.02em]" style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 48 }}>
                  94%
                </div>
                <div className="text-[11px] text-white/55 tracking-[0.1em] uppercase mt-1.5">First-call resolution</div>
              </div>
              <div className="border-l border-white/[0.18] pl-4">
                <div className="font-medium leading-none -tracking-[0.02em]" style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 48 }}>
                  22s
                </div>
                <div className="text-[11px] text-white/55 tracking-[0.1em] uppercase mt-1.5">Average wait</div>
              </div>
            </div>
          </div>

          <div className="bg-white text-[#0E2A3F] rounded-3xl p-6 flex flex-col gap-3.5" style={{ aspectRatio: "0.7" }}>
            <div className="font-medium text-[22px]" style={{ fontFamily: "var(--font-fraunces), serif" }}>
              {upcomingCalls.length > 0 ? "Upcoming visits" : "Today's calls"}
            </div>
            {upcomingCalls.length === 0 && (
              <div className="px-3 py-4 text-[12.5px] text-[#5F7282] text-center">
                No appointments scheduled — ask Buddy to book one.
              </div>
            )}
            {upcomingCalls.map((c, i) => (
              <div
                key={i}
                className="px-3 py-2.5 border border-[#E3E7EA] rounded-[10px] flex justify-between text-[13px]"
              >
                <span>{c.t}</span>
                <b className="font-medium">{c.at}</b>
              </div>
            ))}
            <button
              type="button"
              onClick={openCall}
              className="mt-auto rounded-[10px] py-3 text-white font-medium text-sm cursor-pointer text-center"
              style={{ background: "#2F6D8C" }}
            >
              📞 Tap to call our desk
            </button>
          </div>
        </div>
      </section>

      <footer className="px-7 py-10 border-t border-[#E3E7EA] text-xs text-[#5F7282]">
        <div className="max-w-[1240px] mx-auto flex justify-between flex-wrap gap-3.5">
          <span>© 2026 Northbrook Family Clinic — A demo for Buddy Assist.</span>
          <span>Privacy · HIPAA · Accessibility · Patient rights</span>
        </div>
      </footer>

      {/* Call FAB (pill) — Northbrook "+" mark */}
      <button
        type="button"
        onClick={openCall}
        className="fixed right-6 bottom-6 z-[9000] flex items-center gap-3 pl-2 pr-4.5 py-2 bg-white border border-[#E3E7EA] rounded-full cursor-pointer transition-transform hover:-translate-y-0.5"
        style={{ boxShadow: "0 14px 30px rgba(14,42,63,0.14)" }}
        aria-label="Call our desk"
      >
        <span
          className="w-11 h-11 rounded-full grid place-items-center text-white"
          style={{ background: "#2F6D8C", boxShadow: "0 0 0 4px rgba(31,77,77,0.18)" }}
        >
          <span style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 24, fontWeight: 500, lineHeight: 1 }}>+</span>
        </span>
        <span className="flex flex-col leading-[1.15] text-left">
          <b className="text-[13.5px] font-semibold -tracking-[0.005em]">Call our desk</b>
          <small className="text-[11px] text-[#5F7282] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2FC463]" />
            24/7 · 22s avg wait
          </small>
        </span>
      </button>

      {/* Call overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{
            background: "rgba(14,42,63,0.42)",
            backdropFilter: "blur(8px)",
            animation: "ba-open 0.3s ease",
          }}
        >
          <div
            className="bg-white rounded-[28px] overflow-hidden flex flex-col"
            style={{
              width: "min(520px, calc(100vw - 32px))",
              boxShadow: "0 30px 80px rgba(0,0,0,0.30)",
            }}
          >
            {/* Head */}
            <div
              className="px-8 pt-8 pb-6 text-center border-b border-[#E3E7EA]"
              style={{ background: "linear-gradient(180deg, #EAF2F6, #fff)" }}
            >
              <div
                className="w-[104px] h-[104px] rounded-full grid place-items-center mx-auto mb-4 text-white"
                style={{
                  background: "#2F6D8C",
                  animation: "nb-ring-pulse 1.8s ease-out infinite",
                }}
              >
                <span style={{ fontFamily: "var(--font-fraunces), serif", fontSize: 56, fontWeight: 500, lineHeight: 1 }}>+</span>
              </div>
              <h3
                className="font-medium m-0 mb-1 text-[26px] -tracking-[0.01em]"
                style={{ fontFamily: "var(--font-fraunces), serif" }}
              >
                Northbrook · Desk
              </h3>
              <div className="text-[13px] text-[#5F7282] inline-flex items-center gap-1.5">
                <span
                  className="w-[7px] h-[7px] rounded-full"
                  style={{
                    background: callError
                      ? "#D14545"
                      : socketRef.current?.connected
                        ? "#2FC463"
                        : "#F2A93B",
                  }}
                />
                {callError
                  ? "Call error"
                  : socketRef.current?.connected
                    ? muted
                      ? "Connected · muted"
                      : "Connected · listening"
                    : "Connecting…"}
              </div>
              {callError && (
                <div className="text-[12px] text-[#B53737] mt-1.5 max-w-[280px] mx-auto leading-snug">
                  {callError}
                </div>
              )}
              <div className="text-sm text-[#5F7282] mt-2" style={{ fontFamily: "var(--font-fraunces), serif" }}>
                {pad(mins)}:{pad(secs)}
              </div>
            </div>

            {/* Wave */}
            <div className="h-12 flex items-center justify-center gap-[3px] px-7">
              {Array.from({ length: 12 }, (_, i) => {
                const delay = [0, 0.08, 0.16, 0.24, 0.32, 0.4, 0.48, 0.4, 0.32, 0.24, 0.16, 0.08][i];
                return (
                  <span
                    key={i}
                    className="rounded-sm"
                    style={{
                      width: 3,
                      background: "#2FC463",
                      animation: thinking || transcript.length > 0
                        ? `nb-wave 1.1s ease-in-out infinite ${delay}s`
                        : "none",
                      height: thinking || transcript.length > 0 ? undefined : 6,
                      opacity: thinking || transcript.length > 0 ? undefined : 0.35,
                    }}
                  />
                );
              })}
            </div>

            {/* Body */}
            <div ref={bodyRef} className="px-7 py-6 max-h-[42vh] overflow-y-auto flex flex-col gap-3.5">
              {transcript.map((t, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div
                    className="text-[11px] tracking-[0.08em] uppercase font-medium flex-shrink-0 pt-1 w-[54px]"
                    style={{ color: t.who === "buddy" ? "#1E9E4B" : "#5F7282" }}
                  >
                    {t.who === "buddy" ? "Buddy" : "You"}
                  </div>
                  <div
                    className="text-[14.5px] leading-[1.55] flex-1 whitespace-pre-wrap"
                    style={{
                      color: t.who === "buddy" ? "#0E2A3F" : "#5F7282",
                      fontStyle: t.who === "you" ? "italic" : "normal",
                    }}
                  >
                    {t.text}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex gap-3 items-start">
                  <div className="text-[11px] tracking-[0.08em] uppercase font-medium flex-shrink-0 pt-1 w-[54px]" style={{ color: "#1E9E4B" }}>
                    Buddy
                  </div>
                  <div className="flex gap-1 pt-2">
                    <span className="typing-dot" style={{ background: "#2FC463" }} />
                    <span className="typing-dot" style={{ background: "#2FC463", animationDelay: ".15s" }} />
                    <span className="typing-dot" style={{ background: "#2FC463", animationDelay: ".3s" }} />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="px-7 pb-2 flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type instead of speaking..."
                autoComplete="off"
                className="flex-1 border border-[#E3E7EA] rounded-full px-4.5 py-3 text-sm outline-none focus:border-[#2F6D8C]"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="border-0 text-white rounded-full px-5.5 font-medium text-[13px] cursor-pointer disabled:opacity-40"
                style={{ background: "#2F6D8C" }}
              >
                Send
              </button>
            </form>

            {/* Controls */}
            <div className="px-6 py-4.5 flex justify-center gap-3 border-t border-[#E3E7EA]">
              <button
                type="button"
                onClick={toggleMute}
                title={muted ? "Unmute mic" : "Mute mic"}
                aria-label={muted ? "Unmute" : "Mute"}
                className="w-[54px] h-[54px] rounded-full border-0 cursor-pointer grid place-items-center text-lg transition-colors"
                style={{
                  background: muted ? "#FDE2E2" : "#EAF2F6",
                  color: muted ? "#B53737" : "#1F4E68",
                }}
              >
                {muted ? "🔇" : "⏸"}
              </button>
              <button
                type="button"
                onClick={closeCall}
                title="End call"
                className="w-[62px] h-[62px] rounded-full border-0 cursor-pointer grid place-items-center text-2xl text-white hover:bg-[#B53737]"
                style={{ background: "#D14545" }}
              >
                ✕
              </button>
              <button
                type="button"
                title="Keypad"
                className="w-[54px] h-[54px] rounded-full border-0 cursor-pointer grid place-items-center text-lg"
                style={{ background: "#EAF2F6", color: "#1F4E68" }}
              >
                ⌗
              </button>
            </div>

            <div className="text-center px-2.5 py-2.5 text-[11px] text-[#5F7282]" style={{ background: "#EAF2F6" }}>
              <b style={{ color: "#1E9E4B" }}>Powered by Buddy Assist</b>
            </div>
          </div>
        </div>
      )}

      <IndustrySwitcher currentSlug="northbrook" />

      <style jsx>{`
        @keyframes nb-ring-pulse {
          0% { box-shadow: 0 0 0 0 rgba(47,196,99,0.45); }
          70% { box-shadow: 0 0 0 28px rgba(47,196,99,0); }
          100% { box-shadow: 0 0 0 0 rgba(47,196,99,0); }
        }
        @keyframes nb-wave {
          0%, 100% { height: 8px; opacity: 0.4; }
          50% { height: 36px; opacity: 1; }
        }
      `}</style>
    </div>
  );
}
