import { NextResponse } from 'next/server';
import { getAiConfig } from '@/lib/ai-config';
import { readBoundedText } from '@/lib/request-body';
import { createRunpodModel } from '@/lib/runpod-model';
import {
  maxWorkforceReportLength,
  planWorkforceFromReport,
  workforceAiRequestSchema,
} from '@/lib/workforce-ai';

export const runtime = 'nodejs';
let recentCalls: number[] = [];
const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin) {
    try {
      const source = new URL(origin);
      // The browser's Host remains authoritative behind the hosting proxy.
      if (
        !['http:', 'https:'].includes(source.protocol) ||
        source.host !==
          (request.headers.get('host') ?? new URL(request.url).host)
      )
        return json({ error: 'Invalid workforce planner origin.' }, 403);
    } catch {
      return json({ error: 'Invalid workforce planner origin.' }, 403);
    }
  }
  let input;
  try {
    const text = await readBoundedText(
      request,
      maxWorkforceReportLength + 2000,
      (maxWorkforceReportLength + 2000) * 4,
    );
    if (text === null)
      return json({ error: 'The workforce report is too long.' }, 413);
    const parsed = workforceAiRequestSchema.safeParse(JSON.parse(text));
    if (!parsed.success)
      return json(
        {
          error:
            'Paste a report of 40–12,000 characters and agree to processing.',
        },
        400,
      );
    input = parsed.data;
  } catch {
    return json({ error: 'Invalid workforce planner request.' }, 400);
  }

  const config = input.useAi ? getAiConfig() : null;
  recentCalls = recentCalls.filter((time) => Date.now() - time < 60000);
  const busy = recentCalls.length >= 8;
  if (config && !busy) recentCalls.push(Date.now());

  const result = await planWorkforceFromReport(
    input,
    config && !busy ? createRunpodModel(config) : undefined,
    request.signal,
  );
  if (!result)
    return json(
      {
        error:
          'No team members were found. Use one line per person or role, such as “Nadia - Admin assistant: Excel, scheduling”, or a CSV with role and skills columns.',
      },
      422,
    );
  if (busy && config)
    result.notice = 'AI is busy. A local parser read the report.';
  if (result.mode === 'ai' && config) result.model = config.model;
  return json(result);
}
