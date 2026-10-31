import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { AiConfig } from './ai-config';

export function createRunpodModel(
  config: Pick<AiConfig, 'baseURL' | 'apiKey' | 'model'>,
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
