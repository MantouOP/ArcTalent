/** Bound both decoded text and incoming bytes, including chunked request bodies. */
export async function readBoundedText(
  request: Request,
  maxChars: number,
  maxBytes: number,
): Promise<string | null> {
  if (Number(request.headers.get('content-length')) > maxBytes) return null;
  if (!request.body) return '';
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let text = '',
    bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        return null;
      }
      text += decoder.decode(value, { stream: true });
      if (text.length > maxChars) {
        await reader.cancel();
        return null;
      }
    }
    text += decoder.decode();
    return text.length > maxChars ? null : text;
  } finally {
    reader.releaseLock();
  }
}
