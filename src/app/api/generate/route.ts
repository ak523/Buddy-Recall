import { NextRequest, NextResponse } from 'next/server';
import { generateFlashcards } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, mode, customPrompt } = body;

    if (!text) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    const cards = await generateFlashcards(text, mode || 'concept', customPrompt);
    return NextResponse.json({ cards });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate flashcards';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
