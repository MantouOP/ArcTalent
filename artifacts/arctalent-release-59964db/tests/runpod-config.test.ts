import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRunpodConfig } from '../src/lib/runpod-config';

test('RunPod supports explicit serverless URLs and endpoint/model aliases', () => {
  const env = {
    RUNPOD_ENDPOINT_ID: 'demo-endpoint',
    RUNPOD_MODEL_NAME: 'Qwen/demo',
    RUNPOD_API_KEY: 'test-server-key',
  };
  assert.deepEqual(getRunpodConfig(env), {
    baseURL: 'https://api.runpod.ai/v2/demo-endpoint/openai/v1',
    model: 'Qwen/demo',
    apiKey: 'test-server-key',
  });
  assert.equal(
    getRunpodConfig({
      ...env,
      RUNPOD_BASE_URL: 'https://api.runpod.ai/v2/another-endpoint/openai/v1/',
      RUNPOD_MODEL: 'exact/model',
    })?.model,
    'exact/model',
  );
  assert.ok(
    getRunpodConfig({
      ...env,
      RUNPOD_BASE_URL: 'https://example-8000.proxy.runpod.net/v1',
    }),
  );
});

test('RunPod rejects unsafe hosts, paths, URL credentials and incomplete configuration', () => {
  const env = { RUNPOD_MODEL: 'demo', RUNPOD_API_KEY: 'test-server-key' };
  for (const baseURL of [
    'http://api.runpod.ai/v2/demo/openai/v1',
    'https://api.runpod.ai.evil.test/v2/demo/openai/v1',
    'https://api.runpod.ai/v2/demo/runsync',
    'https://user:pass@x.proxy.runpod.net/v1',
    'https://api.runpod.ai/v2/demo/openai/v1?token=x',
    'https://localhost/v1',
    'https://api.runpod.ai:8443/v2/demo/openai/v1',
  ]) {
    assert.equal(getRunpodConfig({ ...env, RUNPOD_BASE_URL: baseURL }), null);
  }
  assert.equal(getRunpodConfig({}), null);
  assert.equal(getRunpodConfig({ ...env, RUNPOD_ENDPOINT_ID: '../bad' }), null);
});
