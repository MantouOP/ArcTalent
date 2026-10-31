import { generateText, Output } from 'ai';
import { NextResponse } from 'next/server';
import { getAiConfig } from '@/lib/ai-config';
import { readBoundedText } from '@/lib/request-body';
import { createRunpodModel } from '@/lib/runpod-model';
import {
  badgeReviewModelOutputSchemaForCourse,
  runStudyProgressAi,
  studyCoachModelOutputSchemaForPlan,
  studyProgressInstructions,
  studyProgressRequestSchema,
} from '@/lib/study-progress-ai';

export const runtime = 'nodejs';
let recentCalls: number[] = [];
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const source = new URL(origin);
      if (
        !['http:', 'https:'].includes(source.protocol) ||
        source.host !==
          (request.headers.get('host') ?? new URL(request.url).host)
      )
        return json({ error: 'Invalid study progress request origin.' }, 403);
    } catch {
      return json({ error: 'Invalid study progress request origin.' }, 403);
    }
  }

  let input;
  try {
    const text = await readBoundedText(request, 24000, 72000);
    if (text === null)
      return json({ error: 'Study progress request is too large.' }, 413);
    const parsed = studyProgressRequestSchema.safeParse(JSON.parse(text));
    if (!parsed.success)
      return json(
        {
          error:
            'Invalid study progress request. AI consent and valid pathway state are required.',
        },
        400,
      );
    input = parsed.data;
  } catch {
    return json({ error: 'Invalid study progress request.' }, 400);
  }

  const config = getAiConfig();
  recentCalls = recentCalls.filter((time) => Date.now() - time < 60000);
  const busy = recentCalls.length >= 8;
  if (config && !busy) recentCalls.push(Date.now());

  const result = await runStudyProgressAi(
    input,
    config && !busy
      ? async (facts) => {
          const system =
            studyProgressInstructions +
            '\nResponse language: ' +
            {
              en: 'English',
              ms: 'Bahasa Melayu (Malay)',
              'zh-CN': '简体中文 (Simplified Chinese)',
            }[facts.locale] +
            '. Write summary, microTask, badgeTitle, feedback and nextStep in this language. Keep official course titles in their original source language, and keep every quote as an exact verbatim substring of learnerReflectionUntrustedText.';
          const abortSignal = AbortSignal.any([
            request.signal,
            AbortSignal.timeout(45000),
          ]);
          const prompt = JSON.stringify(facts);
          if (facts.action === 'coach') {
            const generated = await generateText({
              model: createRunpodModel(config),
              output: Output.object({
                schema: studyCoachModelOutputSchemaForPlan(
                  facts.progress.scheduledCourses.map((c) => c.id),
                  facts.progress.badges
                    .filter((b) => !b.earned)
                    .map((b) => b.id),
                ),
              }),
              maxOutputTokens: 800,
              maxRetries: 0,
              abortSignal,
              system,
              prompt,
            });
            return generated.output;
          }
          const generated = await generateText({
            model: createRunpodModel(config),
            output: Output.object({
              schema: badgeReviewModelOutputSchemaForCourse(
                facts.targetCourse!.allowedSkills.map((s) => s.id),
              ),
            }),
            maxOutputTokens: 800,
            maxRetries: 0,
            abortSignal,
            system,
            prompt,
          });
          return generated.output;
        }
      : undefined,
  );

  if (busy && config)
    result.notice = 'AI is busy. Using the local study coach.';
  if (result.mode === 'ai' && config) result.model = config.model;
  return json(result);
}
