'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DeckSummary {
  id: number;
  name: string;
  description: string;
  cardCount: number;
  dueCount: number;
}

export default function Dashboard() {
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [totalDue, setTotalDue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [decksRes, dueRes] = await Promise.all([
          fetch('/api/decks'),
          fetch('/api/study/due'),
        ]);
        const decksData = await decksRes.json();
        const dueData = await dueRes.json();
        if (Array.isArray(decksData)) setDecks(decksData);
        if (Array.isArray(dueData)) setTotalDue(dueData.length);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const totalCards = decks.reduce((sum, d) => sum + (d.cardCount || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-4 border-black bg-yellow-400 p-6 shadow-[8px_8px_0px_black]">
        <h1 className="text-4xl font-black">BUDDY RECALL 🧠</h1>
        <p className="text-lg font-bold mt-2">Your AI-powered study companion</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Decks', value: decks.length, color: 'bg-blue-400', icon: '📚' },
          { label: 'Total Cards', value: totalCards, color: 'bg-green-400', icon: '🃏' },
          { label: 'Due Today', value: totalDue, color: 'bg-red-400', icon: '⏰' },
          { label: 'Study Streak', value: '—', color: 'bg-purple-400', icon: '🔥' },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`${stat.color} border-4 border-black p-4 shadow-[4px_4px_0px_black]`}
          >
            <div className="text-3xl">{stat.icon}</div>
            <div className="text-3xl font-black mt-1">
              {loading ? '...' : stat.value}
            </div>
            <div className="font-bold text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-black mb-4 border-b-4 border-black pb-2">QUICK ACTIONS</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/upload"
            className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all text-center block"
          >
            <div className="text-4xl mb-2">📤</div>
            <div className="text-xl font-black">UPLOAD &amp; GENERATE</div>
            <div className="text-sm font-medium mt-1">Turn documents into flashcards</div>
          </Link>
          <Link
            href="/study"
            className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all text-center block"
          >
            <div className="text-4xl mb-2">🧠</div>
            <div className="text-xl font-black">STUDY NOW</div>
            <div className="text-sm font-medium mt-1">
              {totalDue > 0 ? `${totalDue} cards due` : 'No cards due'}
            </div>
          </Link>
          <Link
            href="/decks"
            className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all text-center block"
          >
            <div className="text-4xl mb-2">📚</div>
            <div className="text-xl font-black">MY DECKS</div>
            <div className="text-sm font-medium mt-1">Browse and manage decks</div>
          </Link>
        </div>
      </div>

      {/* Recent Decks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-black border-b-4 border-black pb-2">RECENT DECKS</h2>
          <Link href="/decks" className="font-bold underline hover:text-blue-600">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="text-center py-8 font-bold">Loading...</div>
        ) : decks.length === 0 ? (
          <div className="border-4 border-black border-dashed p-8 text-center">
            <p className="text-xl font-bold text-gray-500">No decks yet!</p>
            <p className="mt-2">
              <Link href="/upload" className="text-blue-600 font-bold underline">
                Upload your first document
              </Link>{' '}
              to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.slice(0, 6).map((deck) => (
              <Link
                key={deck.id}
                href={`/decks/${deck.id}`}
                className="border-4 border-black bg-white p-4 shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all block"
              >
                <h3 className="text-lg font-black truncate">{deck.name}</h3>
                {deck.description && (
                  <p className="text-sm text-gray-600 mt-1 truncate">{deck.description}</p>
                )}
                <div className="mt-3 flex gap-3">
                  <span className="bg-blue-100 border-2 border-blue-400 px-2 py-1 text-xs font-bold">
                    {deck.cardCount} cards
                  </span>
                  {(deck.dueCount || 0) > 0 && (
                    <span className="bg-red-100 border-2 border-red-400 px-2 py-1 text-xs font-bold">
                      {deck.dueCount} due
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
