import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { flashcards, decks } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get('deck_id');

    const dueCards = await db
      .select({
        id: flashcards.id,
        deckId: flashcards.deckId,
        front: flashcards.front,
        back: flashcards.back,
        cardType: flashcards.cardType,
        difficulty: flashcards.difficulty,
        interval: flashcards.interval,
        easeFactor: flashcards.easeFactor,
        reviewCount: flashcards.reviewCount,
        dueDate: flashcards.dueDate,
        deckName: decks.name,
      })
      .from(flashcards)
      .innerJoin(decks, eq(flashcards.deckId, decks.id))
      .where(
        deckId
          ? sql`${flashcards.deckId} = ${parseInt(deckId)} AND ${flashcards.dueDate} <= strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`
          : sql`${flashcards.dueDate} <= strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`
      );

    return NextResponse.json(dueCards);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch due cards';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
