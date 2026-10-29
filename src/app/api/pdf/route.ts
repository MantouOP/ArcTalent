import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') ?? 0) > 5_500_000)
    return NextResponse.json(
      { error: 'Use a PDF smaller than 5 MB' },
      { status: 413 },
    );
  let parser: PDFParse | undefined;
  try {
    const data = await request.formData(),
      file = data.get('file');
    if (
      (data.get('processingConsent') !== 'true' &&
        data.get('synthetic') !== 'true') ||
      !(file instanceof File)
    )
      return NextResponse.json(
        { error: 'Agree to CV processing and choose a PDF.' },
        { status: 400 },
      );
    if (file.size > 5 * 1024 * 1024)
      return NextResponse.json(
        { error: 'Use a PDF smaller than 5 MB' },
        { status: 413 },
      );
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-')
      return NextResponse.json(
        { error: 'This file is not a PDF. Use a text PDF or paste the text.' },
        { status: 400 },
      );
    parser = new PDFParse({ data: bytes });
    const info = await parser.getInfo();
    if (info.total > 10)
      return NextResponse.json(
        { error: 'Use a CV of 10 pages or fewer.' },
        { status: 400 },
      );
    const result = await parser.getText();
    const text = result.text.trim().slice(0, 12000);
    if (text.replace(/--\s*\d+\s*of\s*\d+\s*--/g, '').trim().length < 10)
      return NextResponse.json(
        {
          error:
            'No readable text found. Scanned PDFs need OCR; paste text or use the profile form.',
        },
        { status: 422 },
      );
    return NextResponse.json({ text, pages: info.total });
  } catch {
    return NextResponse.json(
      {
        error: 'This PDF could not be read. Try a text PDF or paste the text.',
      },
      { status: 422 },
    );
  } finally {
    await parser?.destroy();
  }
}
