import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readBoundedText } from '../src/lib/request-body';

test('bounded text preserves UTF-8 characters split between streamed chunks', async () => {
  const bytes = new TextEncoder().encode('学习PDF');
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(bytes.subarray(0, 1));
      controller.enqueue(bytes.subarray(1));
      controller.close();
    },
  });
  const request = new Request('https://example.test', {
    method: 'POST',
    body,
    duplex: 'half',
  } as RequestInit);
  assert.equal(await readBoundedText(request, 5, 20), '学习PDF');
});
test('oversized chunked bodies are cancelled before the rest is consumed', async () => {
  let cancelled = false,
    pulls = 0;
  const body = new ReadableStream({
    pull(controller) {
      pulls++;
      controller.enqueue(new Uint8Array(20));
    },
    cancel() {
      cancelled = true;
    },
  });
  const request = new Request('https://example.test', {
    method: 'POST',
    body,
    duplex: 'half',
  } as RequestInit);
  assert.equal(await readBoundedText(request, 100, 25), null);
  assert.equal(cancelled, true);
  assert.ok(pulls <= 3);
  assert.equal(
    await readBoundedText(
      new Request('https://example.test', {
        method: 'POST',
        body: 'x'.repeat(12),
      }),
      10,
      20,
    ),
    null,
  );
});
