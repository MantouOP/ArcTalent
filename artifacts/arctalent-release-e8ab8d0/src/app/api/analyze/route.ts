import { NextResponse } from 'next/server';
import { analysisSchema } from '@/lib/validation';
import {
  buildPlan,
  MODEL_VERSION,
  rankRoles,
  sharedFoundation,
} from '@/lib/engine';
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 100000)
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    const parsed = analysisSchema.safeParse(JSON.parse(raw));
    if (!parsed.success)
      return NextResponse.json(
        { error: 'Invalid profile, scenario or snapshot' },
        { status: 400 },
      );
    const { profile, scenario, snapshot } = parsed.data,
      shared = sharedFoundation(profile, snapshot),
      matches = rankRoles(profile, scenario, snapshot);
    return NextResponse.json({
      modelVersion: MODEL_VERSION,
      snapshotId: snapshot.id,
      matches,
      shared,
      plans: matches.map((m) => ({
        roleId: m.role.id,
        ...buildPlan(profile, m.role, shared),
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
