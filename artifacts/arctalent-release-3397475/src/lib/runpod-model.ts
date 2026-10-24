import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { getRunpodConfig } from './runpod-config';

export function createRunpodModel(
  config: NonNullable<ReturnType<typeof getRunpodConfig>>,
  fetch: typeof globalThis.fetch = globalThis.fetch,
) {
  return createOpenAICompatible({
    baseURL: config.baseURL,
    apiKey: config.apiKey,
    name: 'runpod',
    supportsStructuredOutputs: true,
    fetch,
  }).chatModel(config.model);
}
