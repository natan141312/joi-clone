import "server-only";
import type { LlmMessage } from "./prompt";
import type { GenerationParams } from "./types";

// Any OpenAI-compatible server works: text-generation-webui (--api), Ollama, LM Studio, vLLM, OpenRouter.
// Without LLM_BASE_URL the free, keyless Pollinations endpoint is used so chat works out of the box.
// LLM_BASE_URL=mock streams canned replies (useful for tests).
const FREE_LLM_URL = "https://text.pollinations.ai/openai";

export const llmConfig = {
  baseUrl: (process.env.LLM_BASE_URL || FREE_LLM_URL).replace(/\/$/, ""),
  apiKey: process.env.LLM_API_KEY ?? "",
  model: process.env.LLM_MODEL || (process.env.LLM_BASE_URL ? "local-model" : "openai"),
  vision: process.env.LLM_VISION === "true",
};

export function isMockLlm() {
  return llmConfig.baseUrl === "mock";
}

/** Streams the assistant reply as plain text chunks. */
export async function streamChat(messages: LlmMessage[], params: GenerationParams, signal?: AbortSignal): Promise<AsyncIterable<string>> {
  if (isMockLlm()) return mockStream(messages);

  const res = await fetch(`${llmConfig.baseUrl}/chat/completions`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(llmConfig.apiKey ? { Authorization: `Bearer ${llmConfig.apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: llmConfig.model,
      messages,
      stream: true,
      temperature: params.temperature,
      top_p: params.topP,
      max_tokens: params.maxTokens,
    }),
  });
  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`LLM request failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  return parseSse(res.body);
}

async function* parseSse(body: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const data = line.replace(/^data:\s*/, "").trim();
      if (!line.startsWith("data:") || !data || data === "[DONE]") continue;
      try {
        const delta = JSON.parse(data).choices?.[0]?.delta?.content;
        if (typeof delta === "string" && delta) yield delta;
      } catch {
        // Ignore keep-alive or partial lines.
      }
    }
  }
}

async function* mockStream(messages: LlmMessage[]): AsyncIterable<string> {
  const last = messages[messages.length - 1];
  const text = typeof last?.content === "string" ? last.content : last?.content.find((p) => p.type === "text")?.text ?? "";
  const reply = `(mock reply, set LLM_BASE_URL to use a real model) You said: "${text.slice(0, 120)}". Tell me more!`;
  for (const word of reply.split(/(?<= )/)) {
    await new Promise((r) => setTimeout(r, 25));
    yield word;
  }
}
