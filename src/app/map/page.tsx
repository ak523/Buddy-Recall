'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Deck {
  id: number;
  name: string;
  description: string;
  cardCount: number;
}

export default function MapIndexPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/decks')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDecks(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 font-black text-xl">Loading decks...</div>;

  return (
    <div className="space-y-6">
      <div className="border-4 border-black bg-teal-400 p-6 shadow-[8px_8px_0px_black]">
        <h1 className="text-3xl font-black">🗺️ KNOWLEDGE MAP</h1>
        <p className="font-bold mt-1">Select a deck to view its topic map</p>
      </div>

      {decks.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <div className="text-6xl">📚</div>
          <h2 className="text-2xl font-black">NO DECKS YET</h2>
          <p className="font-bold text-gray-600">Create a deck first to view its knowledge map.</p>
          <Link
            href="/decks"
            className="inline-block border-4 border-black bg-yellow-400 px-6 py-3 font-black shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all"
          >
            GO TO DECKS
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <Link
              key={deck.id}
              href={`/map/${deck.id}`}
              className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all"
            >
              <h2 className="text-xl font-black">{deck.name}</h2>
              {deck.description && (
                <p className="text-sm text-gray-600 font-medium mt-1">{deck.description}</p>
              )}
              <div className="mt-3 text-sm font-bold text-gray-500">
                {deck.cardCount} card{deck.cardCount !== 1 ? 's' : ''}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
