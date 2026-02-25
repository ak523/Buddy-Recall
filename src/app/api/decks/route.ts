import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { decks, flashcards } from '@/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const allDecks = await db.select().from(decks).orderBy(desc(decks.createdAt));
    
    const decksWithCount = await Promise.all(
      allDecks.map(async (deck) => {
        const cards = await db
          .select({ count: sql<number>`count(*)` })
          .from(flashcards)
          .where(eq(flashcards.deckId, deck.id));
        const dueCards = await db
          .select({ count: sql<number>`count(*)` })
          .from(flashcards)
          .where(
            sql`${flashcards.deckId} = ${deck.id} AND ${flashcards.dueDate} <= strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`
          );
        return {
          ...deck,
          cardCount: cards[0]?.count || 0,
          dueCount: dueCards[0]?.count || 0,
        };
      })
    );

    return NextResponse.json(decksWithCount);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch decks';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Deck name is required' }, { status: 400 });
    }

    const [newDeck] = await db
      .insert(decks)
      .values({ name, description: description || '' })
      .returning();

    return NextResponse.json(newDeck, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create deck';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
