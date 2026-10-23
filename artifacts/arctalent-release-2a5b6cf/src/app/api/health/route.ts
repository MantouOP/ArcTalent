import { NextResponse } from 'next/server';
import { MODEL_VERSION } from '@/lib/engine';
export function GET() {
  return NextResponse.json({
    ok: true,
    engine: MODEL_VERSION,
    extraction:
      process.env.RUNPOD_BASE_URL &&
      process.env.RUNPOD_API_KEY &&
      process.env.RUNPOD_MODEL
        ? 'runpod-configured'
        : 'local-alias-matching',
  });
}
