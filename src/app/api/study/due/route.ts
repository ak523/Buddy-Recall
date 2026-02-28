import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { flashcards, decks, topics } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get('deck_id');
    const topicId = searchParams.get('topic_id');

    let topicFilter: number[] | null = null;
    if (topicId) {
      // Resolve all descendant topic IDs recursively
      const rootId = parseInt(topicId);
      topicFilter = [rootId];
      let queue = [rootId];
      while (queue.length > 0) {
        const parentIds = queue;
        queue = [];
        for (const pid of parentIds) {
          const children = await db.select({ id: topics.id }).from(topics).where(eq(topics.parentId, pid));
          for (const child of children) {
            topicFilter.push(child.id);
            queue.push(child.id);
          }
        }
      }
    }

    let whereClause;
    if (deckId && topicFilter) {
      whereClause = sql`${flashcards.deckId} = ${parseInt(deckId)} AND ${flashcards.topicId} IN (${sql.join(topicFilter.map(id => sql`${id}`), sql`, `)}) AND ${flashcards.dueDate} <= strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`;
    } else if (deckId) {
      whereClause = sql`${flashcards.deckId} = ${parseInt(deckId)} AND ${flashcards.dueDate} <= strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`;
    } else if (topicFilter) {
      whereClause = sql`${flashcards.topicId} IN (${sql.join(topicFilter.map(id => sql`${id}`), sql`, `)}) AND ${flashcards.dueDate} <= strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`;
    } else {
      whereClause = sql`${flashcards.dueDate} <= strftime('%Y-%m-%dT%H:%M:%SZ', 'now')`;
    }

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
      .where(whereClause);

    return NextResponse.json(dueCards);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch due cards';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
