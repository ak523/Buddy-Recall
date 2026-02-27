import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { quizAttempts } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get('deck_id');
    if (!deckId) return NextResponse.json({ error: 'deck_id required' }, { status: 400 });

    const history = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.deckId, parseInt(deckId)))
      .orderBy(desc(quizAttempts.createdAt))
      .limit(10);

    return NextResponse.json(history);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch history';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
