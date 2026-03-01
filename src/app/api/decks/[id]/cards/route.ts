import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { flashcards } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deckId = parseInt(id);
    const cards = await db
      .select()
      .from(flashcards)
      .where(eq(flashcards.deckId, deckId));
    return NextResponse.json(cards);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch cards';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deckId = parseInt(id);
    const body = await request.json();
    const { cards } = body;

    if (!Array.isArray(cards) || cards.length === 0) {
      return NextResponse.json({ error: 'Cards array is required' }, { status: 400 });
    }

    const inserted = await db
      .insert(flashcards)
      .values(
        cards.map((card: {
          front: string;
          back: string;
          card_type?: string;
          visual_reference?: string | null;
          difficulty?: number;
          topic_id?: number | null;
          analogy?: string | null;
        }) => ({
          deckId,
          front: card.front,
          back: card.back,
          analogy: card.analogy || null,
          cardType: card.card_type || 'definition',
          visualReference: card.visual_reference || null,
          difficulty: card.difficulty || 3,
          topicId: card.topic_id ?? null,
          dueDate: new Date().toISOString(),
        }))
      )
      .returning();

    return NextResponse.json(inserted, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add cards';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
