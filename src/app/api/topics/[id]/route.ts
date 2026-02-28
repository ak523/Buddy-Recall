import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { topics, flashcards } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const topicId = parseInt(id);
    const [topic] = await db.select().from(topics).where(eq(topics.id, topicId));
    if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    return NextResponse.json(topic);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch topic';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const topicId = parseInt(id);
    const body = await request.json();
    const { name, color, parentId } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;
    if (parentId !== undefined) updateData.parentId = parentId;

    const [updated] = await db
      .update(topics)
      .set(updateData)
      .where(eq(topics.id, topicId))
      .returning();

    if (!updated) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update topic';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const topicId = parseInt(id);

    // Unassign cards from this topic and all descendant topics before deleting
    // Get all descendant topic IDs recursively
    const allTopicIds = [topicId];
    let queue = [topicId];
    while (queue.length > 0) {
      const parentIds = queue;
      queue = [];
      for (const pid of parentIds) {
        const children = await db.select({ id: topics.id }).from(topics).where(eq(topics.parentId, pid));
        for (const child of children) {
          allTopicIds.push(child.id);
          queue.push(child.id);
        }
      }
    }

    // Unassign all cards from these topics (set topicId to null)
    for (const tid of allTopicIds) {
      await db
        .update(flashcards)
        .set({ topicId: null })
        .where(eq(flashcards.topicId, tid));
    }

    // Delete the topic (cascade will delete sub-topics)
    await db.delete(topics).where(eq(topics.id, topicId));

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete topic';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
