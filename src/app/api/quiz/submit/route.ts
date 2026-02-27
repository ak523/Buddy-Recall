import { NextRequest, NextResponse } from 'next/server';
import db from '@/db';
import { quizAttempts, quizAnswers } from '@/db/schema';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { deckId, totalQuestions, correctAnswers, timeTakenMs, answers } = body;

    const scorePercent = Math.round((correctAnswers / totalQuestions) * 100);

    const [attempt] = await db
      .insert(quizAttempts)
      .values({ deckId, totalQuestions, correctAnswers, scorePercent, timeTakenMs })
      .returning();

    if (Array.isArray(answers) && answers.length > 0) {
      await db.insert(quizAnswers).values(
        answers.map((a: { cardId: number; userAnswer: string; correctAnswer: string; isCorrect: boolean }) => ({
          attemptId: attempt.id,
          cardId: a.cardId,
          userAnswer: a.userAnswer,
          correctAnswer: a.correctAnswer,
          isCorrect: a.isCorrect,
        }))
      );
    }

    return NextResponse.json({ attempt, scorePercent });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit quiz';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
