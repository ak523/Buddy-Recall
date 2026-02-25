'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface StudyCard {
  id: number;
  deckId: number;
  front: string;
  back: string;
  cardType: string;
  difficulty: number;
  deckName: string;
}

function StudyContent() {
  const searchParams = useSearchParams();
  const deckId = searchParams.get('deck');

  const [cards, setCards] = useState<StudyCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [startTime, setStartTime] = useState(Date.now());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchDue() {
      const url = deckId ? `/api/study/due?deck_id=${deckId}` : '/api/study/due';
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) setCards(data);
      setLoading(false);
      setStartTime(Date.now());
    }
    fetchDue();
  }, [deckId]);

  const handleRating = useCallback(async (rating: number) => {
    if (submitting || !cards[currentIndex]) return;
    setSubmitting(true);
    const card = cards[currentIndex];
    const responseTime = Date.now() - startTime;

    await fetch('/api/study/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: card.id,
        deckId: card.deckId,
        rating,
        responseTimeMs: responseTime,
      }),
    });

    if (currentIndex + 1 >= cards.length) {
      setDone(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setFlipped(false);
      setStartTime(Date.now());
    }
    setSubmitting(false);
  }, [submitting, cards, currentIndex, startTime]);

  if (loading) return <div className="text-center py-12 font-black text-xl">Loading cards...</div>;

  if (cards.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="text-6xl">🎉</div>
        <h2 className="text-3xl font-black">ALL CAUGHT UP!</h2>
        <p className="font-bold text-gray-600">No cards due for review right now.</p>
        <a href="/decks" className="inline-block border-4 border-black bg-yellow-400 px-6 py-3 font-black shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all">
          GO TO DECKS
        </a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-16 space-y-6">
        <div className="text-6xl">🏆</div>
        <h2 className="text-3xl font-black">SESSION COMPLETE!</h2>
        <p className="font-bold text-gray-600">You reviewed {cards.length} cards. Great work!</p>
        <div className="flex gap-4 justify-center">
          <a href="/study" className="border-4 border-black bg-green-400 px-6 py-3 font-black shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all">
            STUDY MORE
          </a>
          <a href="/" className="border-4 border-black bg-blue-400 px-6 py-3 font-black shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all">
            DASHBOARD
          </a>
        </div>
      </div>
    );
  }

  const card = cards[currentIndex];
  const progress = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between font-bold text-sm">
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <span className="text-gray-500">{card.deckName}</span>
        </div>
        <div className="h-4 border-4 border-black bg-gray-200">
          <div
            className="h-full bg-yellow-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        className="border-4 border-black bg-white shadow-[8px_8px_0px_black] min-h-64 p-8 cursor-pointer hover:shadow-[10px_10px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all"
        onClick={() => !flipped && setFlipped(true)}
      >
        <div className="text-xs font-black text-gray-400 uppercase mb-4">
          {flipped ? '⬛ ANSWER' : '⬜ QUESTION'} · {card.cardType}
        </div>
        <div className="text-xl font-bold text-center">
          {flipped ? card.back : card.front}
        </div>
        {!flipped && (
          <div className="text-center mt-8 text-sm font-bold text-gray-400">
            Click to reveal answer
          </div>
        )}
      </div>

      {/* Rating Buttons */}
      {flipped ? (
        <div className="space-y-3">
          <p className="font-black text-center">HOW WELL DID YOU RECALL?</p>
          <div className="grid grid-cols-4 gap-3">
            {[
              { rating: 1, label: 'AGAIN', color: 'bg-red-400', desc: 'Forgot' },
              { rating: 2, label: 'HARD', color: 'bg-orange-400', desc: 'Difficult' },
              { rating: 3, label: 'GOOD', color: 'bg-blue-400', desc: 'Correct' },
              { rating: 4, label: 'EASY', color: 'bg-green-400', desc: 'Perfect' },
            ].map(({ rating, label, color, desc }) => (
              <button
                key={rating}
                onClick={() => handleRating(rating)}
                disabled={submitting}
                className={`${color} border-4 border-black py-3 font-black shadow-[3px_3px_0px_black] hover:shadow-[5px_5px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all disabled:opacity-50`}
              >
                <div>{label}</div>
                <div className="text-xs font-medium">{desc}</div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setFlipped(true)}
          className="w-full border-4 border-black bg-yellow-400 py-4 font-black text-xl shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all"
        >
          SHOW ANSWER
        </button>
      )}
    </div>
  );
}

export default function StudyPage() {
  return (
    <div className="space-y-6">
      <div className="border-4 border-black bg-yellow-400 p-6 shadow-[8px_8px_0px_black]">
        <h1 className="text-3xl font-black">🧠 STUDY SESSION</h1>
        <p className="font-bold mt-1">Review your due cards with spaced repetition</p>
      </div>
      <Suspense fallback={<div className="text-center py-12 font-black">Loading...</div>}>
        <StudyContent />
      </Suspense>
    </div>
  );
}
