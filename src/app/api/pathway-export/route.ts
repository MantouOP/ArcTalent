import { NextResponse } from 'next/server';
import { pathwayExportSchema, renderPathwayPdf } from '@/lib/pathway-pdf';
import { readBoundedText } from '@/lib/request-body';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  let input;
  try {
    const raw = await readBoundedText(request, 128000, 512000);
    if (raw === null)
      return NextResponse.json(
        { error: 'Export request is too large.' },
        { status: 413 },
      );
    const parsed = pathwayExportSchema.safeParse(JSON.parse(raw));
    if (!parsed.success)
      return NextResponse.json(
        { error: 'Invalid learning plan.' },
        { status: 400 },
      );
    input = parsed.data;
  } catch {
    return NextResponse.json(
      { error: 'Invalid learning plan.' },
      { status: 400 },
    );
  }
  try {
    return new Response(new Uint8Array(await renderPathwayPdf(input)), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition':
          'attachment; filename="ArcTalent-learning-plan.pdf"',
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
