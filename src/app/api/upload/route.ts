import { NextRequest, NextResponse } from 'next/server';
import { parseDocument } from '@/lib/document-parser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const text = await parseDocument(buffer, file.type, file.name);

    return NextResponse.json({ text, filename: file.name, size: file.size });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to parse document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
