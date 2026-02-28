import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { topics } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deckId = parseInt(id);
    const deckTopics = await db
      .select()
      .from(topics)
      .where(eq(topics.deckId, deckId));
    return NextResponse.json(deckTopics);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch topics';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
