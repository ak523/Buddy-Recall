import { NextResponse } from 'next/server';
import db from '@/db';
import { reviewLogs } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    const data = await db
      .select({
        date: sql<string>`date(${reviewLogs.reviewedAt})`,
        count: sql<number>`count(*)`,
      })
      .from(reviewLogs)
      .where(sql`${reviewLogs.reviewedAt} >= date('now', '-364 days')`)
      .groupBy(sql`date(${reviewLogs.reviewedAt})`);

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch heatmap data';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
