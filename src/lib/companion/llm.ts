import "server-only";
import { DEFAULT_MODEL, FREE_MODEL_LABEL, modelInfo } from "./models";
import type { LlmMessage } from "./prompt";
import type { GenerationParams } from "./types";

// Provider order:
// 1. OPENROUTER_API_KEY set -> each expert runs on its own model (GPT, Claude, Gemini, Llama, ...).
// 2. LLM_BASE_URL set       -> any OpenAI-compatible server (text-generation-webui, Ollama, LM Studio, vLLM).
//    LLM_BASE_URL=mock streams canned replies (useful for tests).
// 3. Otherwise              -> the free, keyless Pollinations endpoint.
// If the chosen model fails, the reply falls back to the free model so chat keeps working.
const FREE_LLM_URL = "https://text.pollinations.ai/openai";
const OPENROUTER_URL = (process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1").replace(/\/$/, "");

export const llmConfig = {
  openRouterKey: process.env.OPENROUTER_API_KEY ?? "",
  baseUrl: (process.env.LLM_BASE_URL || FREE_LLM_URL).replace(/\/$/, ""),
  apiKey: process.env.LLM_API_KEY ?? "",
  model: process.env.LLM_MODEL || (process.env.LLM_BASE_URL ? "local-model" : "openai"),
  vision: process.env.LLM_VISION === "true",
};

export type Provider = "openrouter" | "custom" | "free" | "mock";

export function activeProvider(): Provider {
  if (llmConfig.baseUrl === "mock") return "mock";
  if (llmConfig.openRouterKey) return "openrouter";
  if (process.env.LLM_BASE_URL) return "custom";
  return "free";
}

export function isMockLlm() {
  return activeProvider() === "mock";
}

/** Human label for the model an expert actually runs on right now. */
export function runningModelLabel(model?: string) {
  const p = activeProvider();
  if (p === "openrouter") return modelInfo(model).label;
  if (p === "custom") return llmConfig.model;
  if (p === "mock") return "mock";
  return FREE_MODEL_LABEL;
}

type Target = { url: string; key: string; model: string; extraHeaders?: Record<string, string> };

function targetFor(model?: string): Target {
  const p = activeProvider();
  if (p === "openrouter") {
    return {
      url: OPENROUTER_URL,
      key: llmConfig.openRouterKey,
      model: model || process.env.OPENROUTER_DEFAULT_MODEL || DEFAULT_MODEL,
      extraHeaders: { "X-Title": "PRO AI Experts", ...(process.env.SITE_URL ? { "HTTP-Referer": process.env.SITE_URL } : {}) },
    };
  }
  return { url: llmConfig.baseUrl, key: llmConfig.apiKey, model: llmConfig.model };
}

async function request(t: Target, messages: LlmMessage[], params: GenerationParams, signal?: AbortSignal) {
  return fetch(`${t.url}/chat/completions`, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      ...(t.key ? { Authorization: `Bearer ${t.key}` } : {}),
      ...t.extraHeaders,
    },
    body: JSON.stringify({
      model: t.model,
      messages,
      stream: true,
      temperature: params.temperature,
      top_p: params.topP,
      max_tokens: params.maxTokens,
    }),
  });
}

/** Streams the assistant reply as plain text chunks, on the expert's model when one is configured. */
export async function streamChat(
  messages: LlmMessage[],
  params: GenerationParams,
  signal?: AbortSignal,
  model?: string,
): Promise<AsyncIterable<string>> {
  if (isMockLlm()) return mockStream(messages);

  let res = await request(targetFor(model), messages, params, signal).catch(() => null);
  if ((!res?.ok || !res.body) && activeProvider() === "openrouter") {
    // Model unavailable, out of credits, rate-limited...: answer with the free model instead.
    res = await request({ url: FREE_LLM_URL, key: "", model: "openai" }, messages, params, signal).catch(() => null);
  }
  if (!res?.ok || !res.body) {
    const detail = res ? await res.text().catch(() => "") : "network error";
    throw new Error(`LLM request failed (${res?.status ?? "network"}): ${detail.slice(0, 300)}`);
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

/** Full (non-streamed) completion, built on streamChat so every provider works the same way. */
export async function completeText(messages: LlmMessage[], params: GenerationParams, signal?: AbortSignal, model?: string): Promise<string> {
  let out = "";
  for await (const chunk of await streamChat(messages, params, signal, model)) out += chunk;
  return out.trim();
}
