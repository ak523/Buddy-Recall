import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { flashcards, decks } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ deckId: string }> }
) {
  try {
    const { deckId } = await params;
    const id = parseInt(deckId);

    const [deck] = await db.select().from(decks).where(eq(decks.id, id));
    if (!deck) return NextResponse.json({ error: 'Deck not found' }, { status: 404 });

    const cards = await db
      .select({ id: flashcards.id, front: flashcards.front, back: flashcards.back })
      .from(flashcards)
      .where(eq(flashcards.deckId, id));

    return NextResponse.json({ deck, cards });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch quiz data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
