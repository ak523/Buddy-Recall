'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import MathText from '@/components/MathText';

interface QuizCard {
  id: number;
  front: string;
  back: string;
  analogy: string | null;
}

interface QuizQuestion {
  card: QuizCard;
  options: string[];
  correctAnswer: string;
}

interface AnswerRecord {
  cardId: number;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  options: string[];
  analogy: string | null;
}

interface QuizAttempt {
  id: number;
  totalQuestions: number;
  correctAnswers: number;
  scorePercent: number;
  createdAt: string;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ANSWER_FEEDBACK_DELAY_MS = 900;
const QUIZ_QUESTION_RATIO = 0.3;

function buildQuestions(cards: QuizCard[]): QuizQuestion[] {
  const shuffled = shuffle(cards);
  const count = Math.max(4, Math.round(shuffled.length * QUIZ_QUESTION_RATIO));
  const selected = shuffled.slice(0, count);

  return selected.map((card) => {
    const distractors = shuffle(cards.filter((c) => c.id !== card.id))
      .slice(0, 3)
      .map((c) => c.back);
    const options = shuffle([card.back, ...distractors]);
    return { card, options, correctAnswer: card.back };
  });
}

function QuizContent() {
  const searchParams = useSearchParams();
  const deckId = searchParams.get('deck');

  const [deckName, setDeckName] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [scorePercent, setScorePercent] = useState(0);
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [startTime, setStartTime] = useState(Date.now());

  const loadQuiz = useCallback(async () => {
    if (!deckId) return;
    setLoading(true);
    setDone(false);
    setAnswers([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setError('');
    const res = await fetch(`/api/quiz/${deckId}`);
    const data = await res.json();
    if (data.error) { setError(data.error); setLoading(false); return; }
    if (data.cards.length < 4) {
      setError(`This deck only has ${data.cards.length} card(s). You need at least 4 cards to take a quiz.`);
      setLoading(false);
      return;
    }
    setDeckName(data.deck.name);
    setQuestions(buildQuestions(data.cards));
    setStartTime(Date.now());
    setLoading(false);
  }, [deckId]);

  useEffect(() => { loadQuiz(); }, [loadQuiz]);

  async function handleAnswer(option: string) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(option);
    const q = questions[currentIndex];
    const isCorrect = option === q.correctAnswer;
    const record: AnswerRecord = {
      cardId: q.card.id,
      question: q.card.front,
      userAnswer: option,
      correctAnswer: q.correctAnswer,
      isCorrect,
      options: q.options,
      analogy: q.card.analogy,
    };
    const newAnswers = [...answers, record];

    setTimeout(async () => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1);
        setSelectedAnswer(null);
      } else {
        // Done
        const correct = newAnswers.filter((a) => a.isCorrect).length;
        const timeTakenMs = Date.now() - startTime;
        setAnswers(newAnswers);
        setDone(true);
        try {
          const res = await fetch('/api/quiz/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              deckId: parseInt(deckId!),
              totalQuestions: questions.length,
              correctAnswers: correct,
              timeTakenMs,
              answers: newAnswers.map((a) => ({
                cardId: a.cardId,
                userAnswer: a.userAnswer,
                correctAnswer: a.correctAnswer,
                isCorrect: a.isCorrect,
              })),
            }),
          });
          const result = await res.json();
          setScorePercent(result.scorePercent ?? Math.round((correct / questions.length) * 100));
          // Fetch history
          const histRes = await fetch(`/api/quiz/history?deck_id=${deckId}`);
          const histData = await histRes.json();
          if (Array.isArray(histData)) setHistory(histData);
        } catch {
          setScorePercent(Math.round((correct / questions.length) * 100));
        }
      }
    }, ANSWER_FEEDBACK_DELAY_MS);
  }

  if (loading) return <div className="text-center py-12 font-black text-xl">Loading quiz...</div>;
  if (error) return (
    <div className="border-4 border-black bg-red-100 p-8 text-center space-y-4">  
      <p className="text-xl font-black">⚠️ {error}</p>
      <Link href="/decks" className="border-4 border-black bg-white px-6 py-2 font-black inline-block hover:bg-gray-100">← BACK TO DECKS</Link>
    </div>
  );

  const correctCount = answers.filter((a) => a.isCorrect).length;

  if (done) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">   
        {/* Score banner */}  
        <div className={`border-4 border-black p-8 shadow-[8px_8px_0px_black] text-center ${scorePercent >= 70 ? 'bg-green-400' : scorePercent >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}>  
          <div className="text-5xl font-black">{scorePercent}%</div>  
          <div className="text-xl font-black mt-2">{correctCount} / {questions.length} CORRECT</div>  
          <div className="font-bold mt-1 text-sm">  
            {scorePercent >= 80 ? '🎉 Excellent work!' : scorePercent >= 60 ? '👍 Good effort!' : '📚 Keep studying!'}  
          </div>  
        </div>  

        {/* Actions */}  
        <div className="flex gap-3 flex-wrap">  
          <button  
            onClick={loadQuiz}  
            className="border-4 border-black bg-yellow-400 px-6 py-3 font-black shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all"  
          >  
            🔄 RETAKE QUIZ  
          </button>  
          <Link  
            href={`/study?deck=${deckId}`}  
            className="border-4 border-black bg-blue-400 px-6 py-3 font-black shadow-[4px_4px_0px_black] hover:shadow-[4px_4px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all"  
          >  
            📖 STUDY DECK  
          </Link>  
          <Link  
            href="/decks"  
            className="border-4 border-black bg-white px-6 py-3 font-black shadow-[4px_4px_0px_black] hover:bg-gray-100 transition-all"  
          >  
            ← BACK TO DECKS  
          </Link>  
        </div>  

        {/* Per-question review */}  
        <div>  
          <h2 className="text-xl font-black border-b-4 border-black pb-2 mb-3">QUESTION REVIEW</h2>  
          <div className="space-y-3">  
            {answers.map((a, i) => (  
              <div key={i} className={`border-4 border-black p-4 shadow-[3px_3px_0px_black] ${a.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>  
                <div className="flex items-start gap-2">  
                  <span className="text-lg">{a.isCorrect ? '✅' : '❌'}</span>  
                  <div className="flex-1">  
                    <div className="font-black text-sm mb-2">Q{i + 1}: <MathText text={a.question} /></div>  
                    <div className="space-y-1 text-sm">  
                      {a.options.map((opt) => {  
                        const isCorrectOpt = opt === a.correctAnswer;  
                        const isSelected = opt === a.userAnswer;  
                        return (  
                          <div  
                            key={opt}  
                            className={`px-3 py-1 border-2 font-bold ${  
                              isCorrectOpt  
                                ? 'border-green-600 bg-green-200 text-green-900'  
                                : isSelected && !isCorrectOpt  
                                ? 'border-red-600 bg-red-200 text-red-900'  
                                : 'border-gray-300 bg-white text-gray-600'  
                            }`}  
                          >  
                            {isSelected && !isCorrectOpt ? '✗ ' : isCorrectOpt ? '✓ ' : '  '}  
                            <MathText text={opt} />  
                          </div>  
                        );  
                      })}  
                    </div>
                    {a.analogy && (
                      <div className="mt-2 bg-amber-50 border-2 border-amber-300 rounded px-3 py-2 text-sm text-amber-900">
                        💡 <strong>Analogy:</strong> <MathText text={a.analogy} />
                      </div>
                    )}
                  </div>  
                </div>  
              </div>  
            ))}  
          </div>  
        </div>  

        {/* History */}  
        {history.length > 0 && (  
          <div>  
            <h2 className="text-xl font-black border-b-4 border-black pb-2 mb-3">PAST ATTEMPTS</h2>  
            <div className="space-y-2">  
              {history.map((h) => (  
                <div key={h.id} className="border-2 border-black p-3 flex justify-between items-center bg-white">  
                  <span className="font-bold text-sm">{new Date(h.createdAt).toLocaleDateString()}</span>  
                  <span className="font-black">{h.scorePercent}% ({h.correctAnswers}/{h.totalQuestions})</span>  
                </div>  
              ))}  
            </div>  
          </div>  
        )}  
      </div>  
    );  
  }

  const q = questions[currentIndex];  
  const progress = ((currentIndex) / questions.length) * 100;

  return (  
    <div className="space-y-6 max-w-2xl mx-auto">  
      {/* Header */}  
      <div className="border-4 border-black bg-green-400 p-4 shadow-[6px_6px_0px_black]">  
        <h1 className="text-2xl font-black">🧪 QUIZ — {deckName}</h1>  
        <p className="font-bold text-sm mt-1">Question {currentIndex + 1} of {questions.length}</p>  
      </div>  

      {/* Progress bar */}  
      <div className="h-4 border-4 border-black bg-gray-200">  
        <div className="h-full bg-green-400 transition-all" style={{ width: `${progress}%` }} />  
      </div>  

      {/* Question */}  
      <div className="border-4 border-black bg-white shadow-[6px_6px_0px_black] p-6">  
        <div className="text-xs font-black text-gray-400 uppercase mb-3">QUESTION</div>  
        <div className="text-xl font-black">  
          <MathText text={q.card.front} />  
        </div>  
      </div>  

      {/* Options */}  
      <div className="space-y-3">  
        {q.options.map((option, i) => {  
          const isSelected = selectedAnswer === option;  
          const isCorrect = option === q.correctAnswer;  
          const showResult = selectedAnswer !== null;  
          let bg = 'bg-white hover:bg-yellow-50';  
          if (showResult && isCorrect) bg = 'bg-green-400';  
          else if (showResult && isSelected && !isCorrect) bg = 'bg-red-400';  
          return (  
            <button  
              key={i}  
              onClick={() => handleAnswer(option)}  
              disabled={selectedAnswer !== null}  
              className={`w-full text-left border-4 border-black px-5 py-4 font-bold shadow-[3px_3px_0px_black] transition-all ${bg} disabled:cursor-default`}>  
              <span className="font-black mr-3">{String.fromCharCode(65 + i)}.</span>  
              <MathText text={option} />  
            </button>  
          );  
        })}  
      </div>  
    </div>  
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 font-black text-xl">Loading quiz...</div>}>  
      <QuizContent />  
    </Suspense>
  );
}