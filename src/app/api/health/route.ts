import { NextResponse } from 'next/server';
import { MODEL_VERSION } from '@/lib/engine';
import { getAiConfig } from '@/lib/ai-config';
export function GET() {
  const config = getAiConfig();
  const configured = Boolean(config);
  return NextResponse.json({
    ok: true,
    engine: MODEL_VERSION,
    aiProvider: config?.provider ?? null,
    careerAnalysis: configured ? 'ai-configured' : 'local-goal-matching',
    extraction: configured ? 'ai-configured' : 'local-alias-matching',
    careerChat: configured ? 'ai-configured' : 'local-planning-guide',
    studyProgress: configured ? 'ai-configured' : 'local-study-coach',
  });
}
