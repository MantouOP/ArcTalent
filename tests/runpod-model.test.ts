import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateText, Output } from 'ai';
import { createRunpodModel } from '../src/lib/runpod-model';
import { goalAnalysisSchema } from '../src/lib/career-goals';

test('RunPod transmits the actual target JSON schema and validates the completion', async () => {
  let requestBody: Record<string, any> = {};
  const output = {
    summary: 'Draft targets.',
    family: 'data',
    targets: [{ id: 'htmlcss', level: 2 }],
    otherSkills: ['Accessibility testing'],
  };
  const model = createRunpodModel(
    {
      baseURL: 'https://api.runpod.ai/v2/demo/openai/v1',
      apiKey: 'test-server-key',
      model: 'demo',
    },
    async (_url, init) => {
      requestBody = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          id: 'test',
          object: 'chat.completion',
          created: 1,
          model: 'demo',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: JSON.stringify(output) },
              finish_reason: 'stop',
            },
          ],
          usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        }),
        { headers: { 'Content-Type': 'application/json' } },
      );
    },
  );
  const result = await generateText({
    model,
    prompt: 'A synthetic goal',
    output: Output.object({ schema: goalAnalysisSchema }),
  });
  assert.equal(requestBody.response_format.type, 'json_schema');
  assert.ok(requestBody.response_format.json_schema.schema.properties.targets);
  assert.deepEqual(result.output, output);
});
