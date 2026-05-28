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

/** Tiny inline markdown — bold, italic, and bare URLs. Image tags are stripped
 *  (they're rendered as product cards instead). */
export function mdInline(s: string): string {
  // Strip markdown images BEFORE escaping so URLs with & don't break the regex
  const noImages = s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")   // ![alt](url)
    .replace(/\n[ \t]*\n[ \t]*\n/g, "\n\n") // collapse triple+ blank lines
    .trim();

  const escape = (t: string) =>
    t.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));

  return escape(noImages)
    .replace(/\*\*([^*\n]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|\W)\*([^*\n]+?)\*(?=\W|$)/g, "$1<em>$2</em>");
}

/**
 * When a bot reply contains a numbered product list, split the text into:
 * - intro: the sentence(s) before the "1. Product…" block
 * - trailing: any text after the last product/image line (e.g. "Let me know…")
 *
 * If no numbered list is found, returns { intro: raw, trailing: "" } so the
 * full text is shown as normal.
 */
export function splitForCards(raw: string): { intro: string; trailing: string } {
  const lines = raw.split("\n");
  let firstProdLine = -1;
  let lastProdLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (/^\d+\.\s/.test(l) || /^!\[/.test(l) || /^\s*-\s+\*\*/.test(l)) {
      if (firstProdLine === -1) firstProdLine = i;
      lastProdLine = i;
    }
  }

  if (firstProdLine === -1) return { intro: raw.trim(), trailing: "" };

  const intro = lines.slice(0, firstProdLine).join("\n").trim();
  const trailing = lines
    .slice(lastProdLine + 1)
    .join("\n")
    .replace(/^\s*\n+/, "")
    .trim();

  return { intro, trailing };
}
