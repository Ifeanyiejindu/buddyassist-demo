/**
 * buddyClient — bridges the demo `BuddyChat` engine to the live
 * Buddy Assist backend. Each industry has its own Project ID +
 * API key in `.env.local`; pass the industry slug to
 * `createBuddyComplete` and use the returned function as the
 * `complete` hook on `new BuddyChat({ ... complete })`.
 */
import type { ChatMessage } from "./buddyChat";

const API_BASE =
  process.env.NEXT_PUBLIC_BUDDY_API_BASE || "http://localhost:7003/api/v1";

export type IndustrySlug =
  | "acme"
  | "northbrook"
  | "wayfare"
  | "pulse"
  | "helix"
  | "olivetta"
  | "keystone"
  | "northbank"
  | "lumen";

interface ProjectCreds {
  projectId: string;
  apiKey: string;
}

function resolveCreds(slug: IndustrySlug): ProjectCreds | null {
  const map: Record<IndustrySlug, ProjectCreds> = {
    acme: {
      projectId: process.env.NEXT_PUBLIC_ACME_PROJECT_ID || "",
      apiKey: process.env.NEXT_PUBLIC_ACME_API_KEY || "",
    },
    northbrook: {
      projectId: process.env.NEXT_PUBLIC_NORTHBROOK_PROJECT_ID || "",
      apiKey: process.env.NEXT_PUBLIC_NORTHBROOK_API_KEY || "",
    },
    wayfare: {
      projectId: process.env.NEXT_PUBLIC_WAYFARE_PROJECT_ID || "",
      apiKey: process.env.NEXT_PUBLIC_WAYFARE_API_KEY || "",
    },
    pulse: {
      projectId: process.env.NEXT_PUBLIC_PULSE_PROJECT_ID || "",
      apiKey: process.env.NEXT_PUBLIC_PULSE_API_KEY || "",
    },
    helix: {
      projectId: process.env.NEXT_PUBLIC_HELIX_PROJECT_ID || "",
      apiKey: process.env.NEXT_PUBLIC_HELIX_API_KEY || "",
    },
    olivetta: {
      projectId: process.env.NEXT_PUBLIC_OLIVETTA_PROJECT_ID || "",
      apiKey: process.env.NEXT_PUBLIC_OLIVETTA_API_KEY || "",
    },
    keystone: {
      projectId: process.env.NEXT_PUBLIC_KEYSTONE_PROJECT_ID || "",
      apiKey: process.env.NEXT_PUBLIC_KEYSTONE_API_KEY || "",
    },
    northbank: {
      projectId: process.env.NEXT_PUBLIC_NORTHBANK_PROJECT_ID || "",
      apiKey: process.env.NEXT_PUBLIC_NORTHBANK_API_KEY || "",
    },
    lumen: {
      projectId: process.env.NEXT_PUBLIC_LUMEN_PROJECT_ID || "",
      apiKey: process.env.NEXT_PUBLIC_LUMEN_API_KEY || "",
    },
  };
  const creds = map[slug];
  if (!creds || !creds.projectId || !creds.apiKey) return null;
  return creds;
}

interface SessionState {
  visitor_id: string;
  session_id: string;
  conversation_id?: string;
}

const sessions = new Map<IndustrySlug, SessionState>();

function ensureSession(slug: IndustrySlug): SessionState {
  let s = sessions.get(slug);
  if (s) return s;
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  s = { visitor_id: `demo-${slug}-${id}`, session_id: id };
  sessions.set(slug, s);
  return s;
}

/**
 * Returns a `complete` function compatible with `BuddyChat`. The function
 * forwards the latest user message to the backend's project chat endpoint
 * with the industry's API key and persists `conversation_id` between
 * turns so multi-turn context is preserved server-side.
 */
export function createBuddyComplete(
  slug: IndustrySlug,
): (messages: ChatMessage[]) => Promise<string> {
  const creds = resolveCreds(slug);

  return async (messages: ChatMessage[]): Promise<string> => {
    if (!creds) {
      return `[demo] ${slug} is not configured — set NEXT_PUBLIC_${slug.toUpperCase()}_API_KEY in .env.local.`;
    }

    const session = ensureSession(slug);
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const message = lastUser?.content || "";

    try {
      const res = await fetch(
        `${API_BASE}/chat/${creds.projectId}/message`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": creds.apiKey,
          },
          body: JSON.stringify({
            message,
            visitor_id: session.visitor_id,
            session_id: session.session_id,
            conversation_id: session.conversation_id,
          }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        return `Sorry — the assistant is unavailable (${res.status}). ${text.slice(0, 160)}`;
      }

      const json = await res.json();
      // Persist conversation_id for follow-ups.
      const convId =
        json?.data?.conversation?._id ||
        json?.data?.conversation_id ||
        json?.conversation?._id ||
        json?.conversation_id;
      if (convId) session.conversation_id = String(convId);

      const reply =
        json?.data?.message?.content ||
        json?.data?.reply ||
        json?.data?.response ||
        json?.message?.content ||
        json?.reply ||
        json?.response ||
        "";
      if (reply) return String(reply);

      return "I got an empty reply from the assistant — try rephrasing?";
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return `Network hiccup reaching the assistant: ${msg}`;
    }
  };
}
