import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const decks = sqliteTable('decks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').default(''),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const flashcards = sqliteTable('flashcards', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deckId: integer('deck_id').notNull().references(() => decks.id, { onDelete: 'cascade' }),
  front: text('front').notNull(),
  back: text('back').notNull(),
  cardType: text('card_type').default('definition'),
  visualReference: text('visual_reference'),
  difficulty: integer('difficulty').default(3),
  dueDate: text('due_date').default(sql`CURRENT_TIMESTAMP`),
  interval: integer('interval').default(1),
  easeFactor: real('ease_factor').default(2.5),
  reviewCount: integer('review_count').default(0),
  recallSuccessRate: real('recall_success_rate').default(0),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

export const reviewLogs = sqliteTable('review_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cardId: integer('card_id').notNull().references(() => flashcards.id, { onDelete: 'cascade' }),
  deckId: integer('deck_id').notNull().references(() => decks.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1=again, 2=hard, 3=good, 4=easy
  responseTimeMs: integer('response_time_ms'),
  reviewedAt: text('reviewed_at').default(sql`CURRENT_TIMESTAMP`),
});

export const analyticsEvents = sqliteTable('analytics_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  eventType: text('event_type').notNull(),
  deckId: integer('deck_id'),
  cardId: integer('card_id'),
  metadata: text('metadata'), // JSON string
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const quizAttempts = sqliteTable('quiz_attempts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deckId: integer('deck_id').notNull().references(() => decks.id, { onDelete: 'cascade' }),
  totalQuestions: integer('total_questions').notNull(),
  correctAnswers: integer('correct_answers').notNull(),
  scorePercent: real('score_percent').notNull(),
  timeTakenMs: integer('time_taken_ms'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const quizAnswers = sqliteTable('quiz_answers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  attemptId: integer('attempt_id').notNull().references(() => quizAttempts.id, { onDelete: 'cascade' }),
  cardId: integer('card_id').notNull().references(() => flashcards.id, { onDelete: 'cascade' }),
  userAnswer: text('user_answer').notNull(),
  correctAnswer: text('correct_answer').notNull(),
  isCorrect: integer('is_correct', { mode: 'boolean' }).notNull(),
});
