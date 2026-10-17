// Per-expert AI models, served through OpenRouter (one key, many providers).
// Without OPENROUTER_API_KEY every expert falls back to the free keyless model.

export type ModelOption = { id: string; label: string; family: string };

export const MODEL_OPTIONS: ModelOption[] = [
  { id: "openai/gpt-5-mini", label: "GPT-5 mini", family: "GPT" },
  { id: "openai/gpt-4.1-mini", label: "GPT-4.1 mini", family: "GPT" },
  { id: "anthropic/claude-sonnet-5.5", label: "Claude Sonnet 5.5", family: "Claude" },
  { id: "anthropic/claude-haiku-5.5", label: "Claude Haiku 5.5", family: "Claude" },
  { id: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash", family: "Gemini" },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B", family: "Llama" },
  { id: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick", family: "Llama" },
  { id: "mistralai/mistral-medium-3.1", label: "Mistral Medium 3.1", family: "Mistral" },
  { id: "mistralai/mistral-small-3.2-24b-instruct", label: "Mistral Small 3.2", family: "Mistral" },
  { id: "deepseek/deepseek-chat-v3.1", label: "DeepSeek V3.1", family: "DeepSeek" },
  { id: "x-ai/grok-4.3", label: "Grok 4.3", family: "Grok" },
  { id: "qwen/qwen3.7-flash", label: "Qwen 3.7 Flash", family: "Qwen" },
  { id: "moonshotai/kimi-k2.5", label: "Kimi K2.5", family: "Kimi" },
];

export const DEFAULT_MODEL = "openai/gpt-4.1-mini";
export const FREE_MODEL_LABEL = "GPT-OSS 20B (free)";

export function modelInfo(id: string | undefined): ModelOption {
  return MODEL_OPTIONS.find((m) => m.id === id) ?? MODEL_OPTIONS.find((m) => m.id === DEFAULT_MODEL)!;
}
