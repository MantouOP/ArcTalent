import { getRunpodConfig } from './runpod-config';

type AiEnv = Record<string, string | undefined>;

export type AiConfig = {
  /** Shown to people before they send data, so it names the real recipient. */
  provider: string;
  baseURL: string;
  model: string;
  apiKey: string;
};

/** Server-side only. Any HTTPS OpenAI-compatible gateway, such as LiteLLM. */
export function getOpenAICompatibleConfig(env: AiEnv = process.env) {
  const baseURL = env.AI_BASE_URL?.trim();
  const model = env.AI_MODEL?.trim();
  const apiKey = env.AI_API_KEY?.trim();
  if (!baseURL || !model || !apiKey) return null;
  try {
    const url = new URL(baseURL);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return null;
    const name = env.AI_PROVIDER_NAME?.trim() ?? '';
    const provider = /^[\p{L}\p{N} ._-]{1,40}$/u.test(name)
      ? name
      : model.slice(0, 60);
    return { provider, baseURL: baseURL.replace(/\/$/, ''), model, apiKey };
  } catch {
    return null;
  }
}

/** The general AI_* settings win when complete; otherwise RunPod, otherwise none. */
export function getAiConfig(env: AiEnv = process.env): AiConfig | null {
  const general = getOpenAICompatibleConfig(env);
  if (general) return general;
  const runpod = getRunpodConfig(env);
  return runpod ? { provider: 'RunPod', ...runpod } : null;
}
