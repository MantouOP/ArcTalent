type RunpodEnv = Record<string, string | undefined>;

/** Server-side only. Accept the documented Pod or Serverless OpenAI endpoints. */
export function getRunpodConfig(env: RunpodEnv = process.env) {
  const endpoint = env.RUNPOD_ENDPOINT_ID?.trim();
  const baseURL =
    env.RUNPOD_BASE_URL?.trim() ||
    (endpoint && /^[a-zA-Z0-9_-]{6,100}$/.test(endpoint)
      ? `https://api.runpod.ai/v2/${endpoint}/openai/v1`
      : '');
  const model = (env.RUNPOD_MODEL || env.RUNPOD_MODEL_NAME)?.trim();
  const apiKey = env.RUNPOD_API_KEY?.trim();
  if (!baseURL || !model || !apiKey) return null;
  try {
    const url = new URL(baseURL);
    const pod =
      url.hostname.endsWith('.proxy.runpod.net') &&
      /^\/v1\/?$/.test(url.pathname);
    const serverless =
      url.hostname === 'api.runpod.ai' &&
      /^\/v2\/[a-zA-Z0-9_-]+\/openai\/v1\/?$/.test(url.pathname);
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.port ||
      !(pod || serverless)
    )
      return null;
    return { baseURL: baseURL.replace(/\/$/, ''), model, apiKey };
  } catch {
    return null;
  }
}
