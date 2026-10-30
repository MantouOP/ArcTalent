import { NextResponse } from 'next/server';
import { MODEL_VERSION } from '@/lib/engine';
import { getRunpodConfig } from '@/lib/runpod-config';
export function GET() {
  const configured = Boolean(getRunpodConfig());
  return NextResponse.json({
    ok: true,
    engine: MODEL_VERSION,
    careerAnalysis: configured ? 'runpod-configured' : 'local-goal-matching',
    extraction: configured ? 'runpod-configured' : 'local-alias-matching',
    careerChat: configured ? 'runpod-configured' : 'local-planning-guide',
  });
}
