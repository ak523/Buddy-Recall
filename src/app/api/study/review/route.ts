import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { flashcards, reviewLogs } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { applySM2 } from '@/lib/sm2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cardId, deckId, rating, responseTimeMs } = body;

    if (!cardId || !deckId || !rating) {
      return NextResponse.json({ error: 'cardId, deckId, and rating are required' }, { status: 400 });
    }

    const [card] = await db.select().from(flashcards).where(eq(flashcards.id, cardId));
    if (!card) return NextResponse.json({ error: 'Card not found' }, { status: 404 });

    const scheduling = applySM2(
      rating,
      card.interval || 1,
      card.easeFactor || 2.5,
      card.reviewCount || 0
    );

    const totalReviews = (card.reviewCount || 0) + 1;
    const currentSuccessCount = Math.round(((card.recallSuccessRate || 0) * (card.reviewCount || 0)) / 100);
    const successCount = rating >= 3 ? currentSuccessCount + 1 : currentSuccessCount;
    const newSuccessRate = (successCount / totalReviews) * 100;

    await db
      .update(flashcards)
      .set({
        interval: scheduling.interval,
        easeFactor: scheduling.easeFactor,
        reviewCount: scheduling.reviewCount,
        dueDate: scheduling.dueDate,
        recallSuccessRate: newSuccessRate,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(flashcards.id, cardId));

    await db.insert(reviewLogs).values({
      cardId,
      deckId,
      rating,
      responseTimeMs: responseTimeMs || null,
      reviewedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, scheduling });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit review';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
