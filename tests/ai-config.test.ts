import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getAiConfig, getOpenAICompatibleConfig } from '../src/lib/ai-config';

const runpod = {
  RUNPOD_ENDPOINT_ID: 'demo-endpoint',
  RUNPOD_MODEL: 'Qwen/demo',
  RUNPOD_API_KEY: 'test-runpod-key',
};
const gateway = {
  AI_BASE_URL: 'https://litellm.example.test/v1/',
  AI_MODEL: 'gpt-5.4-mini',
  AI_API_KEY: 'test-gateway-key',
};

test('an OpenAI-compatible gateway is accepted and named by its model by default', () => {
  assert.deepEqual(getOpenAICompatibleConfig(gateway), {
    provider: 'gpt-5.4-mini',
    baseURL: 'https://litellm.example.test/v1',
    model: 'gpt-5.4-mini',
    apiKey: 'test-gateway-key',
  });
  assert.equal(
    getOpenAICompatibleConfig({ ...gateway, AI_PROVIDER_NAME: 'XMUM LiteLLM' })
      ?.provider,
    'XMUM LiteLLM',
  );
  // A name that could carry markup falls back to the model.
  assert.equal(
    getOpenAICompatibleConfig({ ...gateway, AI_PROVIDER_NAME: '<b>x</b>' })
      ?.provider,
    'gpt-5.4-mini',
  );
});

test('the gateway rejects plain HTTP, URL credentials, queries and incomplete settings', () => {
  for (const AI_BASE_URL of [
    'http://litellm.example.test/v1',
    'https://user:pass@litellm.example.test/v1',
    'https://litellm.example.test/v1?key=x',
    'https://litellm.example.test/v1#x',
    'not a url',
  ])
    assert.equal(getOpenAICompatibleConfig({ ...gateway, AI_BASE_URL }), null);
  assert.equal(
    getOpenAICompatibleConfig({ ...gateway, AI_API_KEY: ' ' }),
    null,
  );
  assert.equal(getOpenAICompatibleConfig({}), null);
});

test('complete AI_* settings win over RunPod; RunPod remains the fallback', () => {
  assert.equal(getAiConfig({ ...runpod, ...gateway })?.model, 'gpt-5.4-mini');
  assert.deepEqual(getAiConfig(runpod), {
    provider: 'RunPod',
    baseURL: 'https://api.runpod.ai/v2/demo-endpoint/openai/v1',
    model: 'Qwen/demo',
    apiKey: 'test-runpod-key',
  });
  assert.equal(
    getAiConfig({ ...runpod, AI_BASE_URL: gateway.AI_BASE_URL })?.provider,
    'RunPod',
  );
  assert.equal(getAiConfig({}), null);
});
