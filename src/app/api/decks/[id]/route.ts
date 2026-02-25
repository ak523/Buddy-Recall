import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { decks, flashcards } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deckId = parseInt(id);
    const [deck] = await db.select().from(decks).where(eq(decks.id, deckId));
    if (!deck) return NextResponse.json({ error: 'Deck not found' }, { status: 404 });

    const cards = await db
      .select({ count: sql<number>`count(*)` })
      .from(flashcards)
      .where(eq(flashcards.deckId, deckId));

    return NextResponse.json({ ...deck, cardCount: cards[0]?.count || 0 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch deck';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deckId = parseInt(id);
    const body = await request.json();
    const { name, description } = body;

    const [updated] = await db
      .update(decks)
      .set({ name, description, updatedAt: new Date().toISOString() })
      .where(eq(decks.id, deckId))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update deck';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deckId = parseInt(id);
    await db.delete(decks).where(eq(decks.id, deckId));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete deck';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
