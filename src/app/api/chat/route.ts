import { generateText, Output } from 'ai';
import { NextResponse } from 'next/server';
import {
  answerWithCareerModel,
  careerChatInstructions,
  chatModelOutputSchemaForPlan,
} from '@/lib/career-chat-ai';
import { chatRequestSchema } from '@/lib/career-chat-request';
import { getAiConfig } from '@/lib/ai-config';
import { createRunpodModel } from '@/lib/runpod-model';
import { readBoundedText } from '@/lib/request-body';

export const runtime = 'nodejs';
let recentCalls: number[] = [];
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const source = new URL(origin);
      // Next's internal URL can use 0.0.0.0 or HTTP behind the hosting proxy.
      // The browser's Host remains authoritative for the requested public site.
      if (
        !['http:', 'https:'].includes(source.protocol) ||
        source.host !==
          (request.headers.get('host') ?? new URL(request.url).host)
      )
        return json({ error: 'Invalid chat request origin.' }, 403);
    } catch {
      return json({ error: 'Invalid chat request origin.' }, 403);
    }
  }
  let input;
  try {
    const text = await readBoundedText(request, 32000, 96000);
    if (text === null)
      return json({ error: 'Chat request is too large.' }, 413);
    const parsed = chatRequestSchema.safeParse(JSON.parse(text));
    if (!parsed.success)
      return json(
        {
          error:
            'Invalid chat request. AI consent and a current plan are required.',
        },
        400,
      );
    input = parsed.data;
  } catch {
    return json({ error: 'Invalid chat request.' }, 400);
  }
  const config = getAiConfig();
  recentCalls = recentCalls.filter((time) => Date.now() - time < 60000);
  const busy = recentCalls.length >= 8;
  if (config && !busy) recentCalls.push(Date.now());
  const result = await answerWithCareerModel(
    input,
    config && !busy
      ? async (data) => {
          const generated = await generateText({
            model: createRunpodModel(config),
            output: Output.object({
              schema: chatModelOutputSchemaForPlan(
                data.facts.plan.courses.map((course) => course.id),
              ),
            }),
            maxOutputTokens: 900,
            maxRetries: 0,
            abortSignal: AbortSignal.any([
              request.signal,
              AbortSignal.timeout(45000),
            ]),
            system:
              careerChatInstructions +
              '\nResponse language: ' +
              {
                en: 'English',
                ms: 'Bahasa Melayu (Malay)',
                'zh-CN': '简体中文 (Simplified Chinese)',
              }[data.locale] +
              '. Write every paragraph in this language, even if the conversation history uses another language. Keep official course titles in their original source language.',
            prompt: JSON.stringify(data),
          });
          return generated.output;
        }
      : undefined,
  );
  if (busy && config)
    result.notice = 'AI is busy. This reply uses the local planning guide.';
  if (result.mode === 'ai' && config) result.model = config.model;
  return json(result);
}
