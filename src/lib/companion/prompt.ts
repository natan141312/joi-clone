import { fillTemplate } from "./store";
import type { Character, Chat } from "./types";

export type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export type LlmMessage = { role: "system" | "user" | "assistant"; content: string | ContentPart[] };

// Rough budget so long chats don't overflow the model's context window.
const HISTORY_CHAR_BUDGET = Number(process.env.LLM_HISTORY_CHARS ?? 12000);

/** System prompt: the character is a domain expert who stays in persona. */
export function buildSystemPrompt(c: Character, userName: string) {
  const f = (s: string) => fillTemplate(s, c.name, userName);
  const sections = [
    `You are ${c.name}, ${c.tagline ? `${c.tagline}, ` : ""}an expert in ${c.expertise || "your field"}. You are chatting with ${userName}.`,
    [
      "How to answer:",
      "- Give accurate, specific, expert-level answers with concrete steps, numbers and examples where useful.",
      "- Ask one short clarifying question when the request is ambiguous; otherwise answer directly.",
      "- Use short paragraphs or bullet lists; use code blocks for code.",
      "- If something is outside your field, say so briefly and give the best general pointer.",
      "- For medical, legal, financial or safety-critical topics, add a one-line note to confirm with a qualified professional for their specific situation.",
      "- Always reply in the same language the user writes in.",
      `- Stay in character as ${c.name} and speak in first person.`,
    ].join("\n"),
    c.profileMd && `Your expert profile and knowledge base (follow it closely):\n${f(c.profileMd)}`,
    c.traits && `Personality: ${f(c.traits)}`,
    c.description && `Background: ${f(c.description)}`,
    c.scenario && `Context: ${f(c.scenario)}`,
    c.exampleDialogue && `Example of your style (reference only):\n${f(c.exampleDialogue)}`,
  ];
  return sections.filter(Boolean).join("\n\n");
}

export function buildMessages(c: Character, chat: Chat, { vision }: { vision: boolean }): LlmMessage[] {
  const history: LlmMessage[] = [];
  let used = 0;
  // Walk backwards so the newest messages are always kept.
  for (let i = chat.messages.length - 1; i >= 0; i--) {
    const m = chat.messages[i];
    used += m.content.length;
    if (used > HISTORY_CHAR_BUDGET && history.length > 0) break;
    const isLast = i === chat.messages.length - 1;
    // Only the newest user image is sent; older images are summarized as text to save tokens.
    if (m.image && m.role === "user" && vision && isLast) {
      history.unshift({
        role: "user",
        content: [
          { type: "text", text: m.content || "(sent a picture)" },
          { type: "image_url", image_url: { url: m.image } },
        ],
      });
    } else {
      const note = m.image ? " [sent a picture]" : "";
      history.unshift({ role: m.role, content: `${m.content}${note}`.trim() });
    }
  }
  return [{ role: "system", content: buildSystemPrompt(c, chat.userName) }, ...history];
}
