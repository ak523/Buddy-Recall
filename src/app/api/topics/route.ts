import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { topics } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deckId, name, parentId, color } = body;

    if (!deckId || !name) {
      return NextResponse.json({ error: 'deckId and name are required' }, { status: 400 });
    }

    const [newTopic] = await db
      .insert(topics)
      .values({
        deckId,
        name,
        parentId: parentId || null,
        color: color || '#e2e8f0',
      })
      .returning();

    return NextResponse.json(newTopic, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create topic';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
