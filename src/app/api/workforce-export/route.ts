import { NextResponse } from 'next/server';
import { renderWorkforcePdf, workforceExportSchema } from '@/lib/workforce-pdf';
import { readBoundedText } from '@/lib/request-body';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  let input;
  try {
    const raw = await readBoundedText(request, 64000, 256000);
    if (raw === null)
      return NextResponse.json(
        { error: 'Export request is too large.' },
        { status: 413 },
      );
    const parsed = workforceExportSchema.safeParse(JSON.parse(raw));
    if (!parsed.success)
      return NextResponse.json(
        { error: 'Invalid workforce plan.' },
        { status: 400 },
      );
    input = parsed.data;
  } catch {
    return NextResponse.json(
      { error: 'Invalid workforce plan.' },
      { status: 400 },
    );
  }
  try {
    const pdf = await renderWorkforcePdf(input);
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          'attachment; filename="ArcTalent-workforce-plan.pdf"',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Could not create the PDF. Please try again.' },
      { status: 500 },
    );
  }
}
