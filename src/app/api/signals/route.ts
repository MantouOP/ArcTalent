import { NextResponse } from 'next/server';
import {
  fetchJobSignals,
  fetchResearchSignals,
  liveSnapshot,
} from '@/lib/signals';
let cached: { at: number; data: unknown } | null = null;
let pending: Promise<unknown> | null = null;
export async function GET() {
  if (cached && Date.now() - cached.at < 300000)
    return NextResponse.json(cached.data);
  try {
    pending ??= (async () => {
      const [jobs, research] = await Promise.allSettled([
        fetchJobSignals(),
        fetchResearchSignals(),
      ]);
      if (jobs.status === 'rejected') throw new Error('Job source unavailable');
      const result = {
        snapshot: liveSnapshot(
          jobs.value.signals,
          research.status === 'fulfilled' ? research.value : [],
        ),
        warnings:
          research.status === 'rejected'
            ? ['Research feed unavailable; the job snapshot is usable.']
            : [],
      };
      cached = { at: Date.now(), data: result };
      return result;
    })().finally(() => {
      pending = null;
    });
    return NextResponse.json(await pending);
  } catch {
    return NextResponse.json(
      {
        error:
          'The public job source is unavailable. Your active snapshot has been kept. Try again later or use the labelled demo replay.',
      },
      { status: 502 },
    );
  }
}
