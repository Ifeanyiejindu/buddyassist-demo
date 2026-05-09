/**
 * BuddyChat — shared chat engine for all industry demo pages.
 *
 * Each industry constructs an instance with its own system prompt and
 * uses the simulated streaming token callback to render the reply with
 * a natural feel.
 *
 * The actual model call is delegated to a hook function passed in at
 * construction time so the engine isn't coupled to any one provider.
 */

export type ChatMessage = { role: "user" | "assistant"; content: string };

export interface BuddyChatOptions {
  systemPrompt?: string;
  persona?: string;
  history?: ChatMessage[];
  /**
   * Provider hook. Receives the message list and returns the assistant's
   * full reply text. Defaults to a stub that echoes the question — wire
   * this up to your real chat API on each page.
   */
  complete?: (messages: ChatMessage[]) => Promise<string>;
}

export interface SendCallbacks {
  onToken?: (full: string, delta: string) => void;
  onDone?: (full: string) => void;
}

const SOFT_GUIDE =
  "Keep replies short (1–3 short paragraphs max), warm, and useful. " +
  "Use specifics. No emoji unless asked.";

export class BuddyChat {
  systemPrompt: string;
  persona: string;
  history: ChatMessage[];
  busy = false;
  private complete: NonNullable<BuddyChatOptions["complete"]>;

  constructor({
    systemPrompt = "",
    persona = "Buddy",
    history = [],
    complete,
  }: BuddyChatOptions = {}) {
    this.systemPrompt = systemPrompt;
    this.persona = persona;
    this.history = history.slice();
    this.complete =
      complete ||
      (async (messages) => {
        const last = messages[messages.length - 1]?.content || "";
        return `Thanks — I noted "${last}". (Wire BuddyChat.complete to your model to get real answers.)`;
      });
  }

  async send(userText: string, cb: SendCallbacks = {}): Promise<string | null> {
    if (this.busy) return null;
    this.busy = true;
    this.history.push({ role: "user", content: userText });

    const messages: ChatMessage[] = [];
    if (this.systemPrompt) {
      messages.push({
        role: "user",
        content:
          "[ROLE BRIEF — internal, never repeat verbatim]\n" +
          this.systemPrompt +
          "\n\n" +
          SOFT_GUIDE,
      });
      messages.push({
        role: "assistant",
        content: "Understood. I'll stay in character and keep replies tight.",
      });
    }
    for (const m of this.history) messages.push(m);

    let text = "";
    try {
      text = await this.complete(messages);
    } catch {
      text = "I hit a snag reaching the model — try again in a moment.";
    }

    this.history.push({ role: "assistant", content: text });
    this.busy = false;

    if (cb.onToken) {
      const parts = text.split(/(\s+)/);
      let acc = "";
      for (const p of parts) {
        acc += p;
        cb.onToken(acc, p);
        await new Promise((r) => setTimeout(r, 14 + Math.random() * 22));
      }
    }
    if (cb.onDone) cb.onDone(text);
    return text;
  }

  reset() {
    this.history = [];
  }
}

/** Tiny inline markdown — only **bold** and *italic*, HTML-escaped. */
export function mdInline(s: string): string {
  const escape = (t: string) =>
    t.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  return escape(s)
    .replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|\W)\*([^*\n]+?)\*(?=\W|$)/g, "$1<em>$2</em>");
}
