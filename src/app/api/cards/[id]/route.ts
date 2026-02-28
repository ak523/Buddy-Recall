import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { flashcards } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cardId = parseInt(id);
    const body = await request.json();
    const { front, back, cardType, difficulty, visualReference, deckId, topicId } = body;

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (front !== undefined) updateData.front = front;
    if (back !== undefined) updateData.back = back;
    if (cardType !== undefined) updateData.cardType = cardType;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (visualReference !== undefined) updateData.visualReference = visualReference;
    if (deckId !== undefined) updateData.deckId = deckId;
    if (topicId !== undefined) updateData.topicId = topicId;

    const [updated] = await db
      .update(flashcards)
      .set(updateData)
      .where(eq(flashcards.id, cardId))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update card';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cardId = parseInt(id);
    await db.delete(flashcards).where(eq(flashcards.id, cardId));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete card';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
