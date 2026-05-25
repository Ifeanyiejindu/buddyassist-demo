"use client";

/**
 * VoiceChat — real voice calls to Buddy Assist for voice-enabled demos.
 *
 * Mints a LiveKit token from the Buddy Assist backend (`POST /voice/token`),
 * joins the room, streams the mic, and plays the AI agent's audio. The
 * deployed Python voice-agent answers and runs the project's playbooks.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track, type RemoteTrack } from "livekit-client";

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

  const roomRef = useRef<Room | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Call timer.
  useEffect(() => {
    if (state !== "live") return;
    const start = Date.now();
    const id = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 500);
    return () => clearInterval(id);
  }, [state]);

  const teardown = useCallback(() => {
    const room = roomRef.current;
    roomRef.current = null;
    if (room) {
      room.removeAllListeners();
      room.disconnect();
    }
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  const startCall = useCallback(async () => {
    const creds = CREDS[industrySlug];
    if (!creds?.apiKey || !creds?.projectId) {
      setError(`Voice isn't configured for ${industrySlug} — set NEXT_PUBLIC_${industrySlug.toUpperCase()}_API_KEY.`);
      setState("error");
      return;
    }
    setState("connecting");
    setError("");
    setSeconds(0);
    try {
      const res = await fetch(`${API_BASE}/voice/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: creds.apiKey, project_id: creds.projectId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || `Voice unavailable (${res.status}).`);
      const { url, token } = json.data || {};
      if (!url || !token) throw new Error("Voice token response was malformed.");

      const room = new Room({ adaptiveStream: true });
      roomRef.current = room;

      room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio && audioRef.current) {
          track.attach(audioRef.current);
        }
      });
      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        setAgentSpeaking(speakers.some((s) => s.identity !== room.localParticipant.identity));
      });
      room.on(RoomEvent.Disconnected, () => {
        setState((s) => (s === "error" ? s : "ended"));
      });

      await room.connect(url, token);
      await room.localParticipant.setMicrophoneEnabled(true);
      setState("live");
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
      {/* hidden audio sink for the agent's voice */}
      <audio ref={audioRef} autoPlay />

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
