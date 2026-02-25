import { NextResponse } from 'next/server';
import db from '@/db';
import { flashcards, decks, reviewLogs } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const allDecks = await db.select().from(decks);
    
    const deckStats = await Promise.all(
      allDecks.map(async (deck) => {
        const cards = await db
          .select({
            avgSuccessRate: sql<number>`AVG(${flashcards.recallSuccessRate})`,
            totalCards: sql<number>`count(*)`,
            masteredCards: sql<number>`sum(case when ${flashcards.reviewCount} >= 3 and ${flashcards.recallSuccessRate} >= 70 then 1 else 0 end)`,
          })
          .from(flashcards)
          .where(eq(flashcards.deckId, deck.id));

        const recentReviews = await db
          .select({ count: sql<number>`count(*)` })
          .from(reviewLogs)
          .where(
            sql`${reviewLogs.deckId} = ${deck.id} AND ${reviewLogs.reviewedAt} >= date('now', '-7 days')`
          );

        return {
          deckId: deck.id,
          deckName: deck.name,
          avgSuccessRate: cards[0]?.avgSuccessRate || 0,
          totalCards: cards[0]?.totalCards || 0,
          masteredCards: cards[0]?.masteredCards || 0,
          recentReviews: recentReviews[0]?.count || 0,
        };
      })
    );

    return NextResponse.json(deckStats);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch retention data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
