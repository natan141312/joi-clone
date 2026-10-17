import { fillTemplate } from "./store";
import type { Character, Chat } from "./types";

export type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };
export type LlmMessage = { role: "system" | "user" | "assistant"; content: string | ContentPart[] };

// Rough budget so long chats don't overflow the model's context window.
const HISTORY_CHAR_BUDGET = Number(process.env.LLM_HISTORY_CHARS ?? 12000);

/** Builds the system prompt from the character card, like text-generation-webui's chat mode. */
export function buildSystemPrompt(c: Character, userName: string) {
  const f = (s: string) => fillTemplate(s, c.name, userName);
  const sections = [
    `You are ${c.name}, a fictional ${c.age}-year-old ${c.gender || "person"} chatting with ${userName}. Stay in character and reply as ${c.name} only, in first person. Keep replies conversational.`,
    c.appearance && `Appearance: ${f(c.appearance)}`,
    c.traits && `Personality: ${f(c.traits)}`,
    c.description && `About ${c.name}: ${f(c.description)}`,
    c.scenario && `Scenario: ${f(c.scenario)}`,
    c.exampleDialogue && `Example dialogue (style reference only):\n${f(c.exampleDialogue)}`,
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
      const note = m.image ? (m.role === "user" ? " [sent a picture]" : " [sent a picture]") : "";
      history.unshift({ role: m.role, content: `${m.content}${note}`.trim() });
    }
  }
  return [{ role: "system", content: buildSystemPrompt(c, chat.userName) }, ...history];
}
