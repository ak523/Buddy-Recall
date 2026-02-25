'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Deck {
  id: number;
  name: string;
  description: string;
  cardCount: number;
  dueCount: number;
  createdAt: string;
}

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchDecks();
  }, []);

  async function fetchDecks() {
    try {
      const res = await fetch('/api/decks');
      const data = await res.json();
      if (Array.isArray(data)) setDecks(data);
    } finally {
      setLoading(false);
    }
  }

  async function createDeck() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });
      const deck = await res.json();
      setDecks((prev) => [{ ...deck, cardCount: 0, dueCount: 0 }, ...prev]);
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
    } finally {
      setCreating(false);
    }
  }

  async function deleteDeck(id: number) {
    if (!confirm('Delete this deck and all its cards?')) return;
    await fetch(`/api/decks/${id}`, { method: 'DELETE' });
    setDecks((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="border-4 border-black bg-green-400 p-6 shadow-[8px_8px_0px_black] flex-1">
          <h1 className="text-3xl font-black">📚 MY DECKS</h1>
          <p className="font-bold mt-1">{decks.length} deck{decks.length !== 1 ? 's' : ''} total</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="ml-4 border-4 border-black bg-yellow-400 px-6 py-4 font-black text-lg shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all"
        >
          + NEW DECK
        </button>
      </div>

      {showCreate && (
        <div className="border-4 border-black bg-yellow-50 p-6 shadow-[4px_4px_0px_black]">
          <h2 className="font-black text-lg mb-4">CREATE NEW DECK</h2>
          <div className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Deck name (required)"
              className="w-full border-4 border-black p-3 font-bold focus:outline-none focus:bg-yellow-100"
              onKeyDown={(e) => e.key === 'Enter' && createDeck()}
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full border-4 border-black p-3 font-medium focus:outline-none focus:bg-yellow-100"
            />
            <div className="flex gap-3">
              <button
                onClick={createDeck}
                disabled={!newName.trim() || creating}
                className="border-4 border-black bg-black text-white px-6 py-2 font-black hover:bg-gray-800 disabled:opacity-50"
              >
                {creating ? 'Creating...' : 'CREATE'}
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="border-4 border-black bg-white px-6 py-2 font-black hover:bg-gray-100"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 font-black text-xl">Loading decks...</div>
      ) : decks.length === 0 ? (
        <div className="border-4 border-dashed border-black p-16 text-center">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-2xl font-black">NO DECKS YET</p>
          <p className="font-bold text-gray-600 mt-2">
            <Link href="/upload" className="text-blue-600 underline">
              Upload a document
            </Link>{' '}
            or create a deck above to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <div
              key={deck.id}
              className="border-4 border-black bg-white shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all"
            >
              <Link href={`/decks/${deck.id}`} className="block p-5">
                <h3 className="text-xl font-black">{deck.name}</h3>
                {deck.description && (
                  <p className="text-sm text-gray-600 mt-1">{deck.description}</p>
                )}
                <div className="mt-3 flex gap-2 flex-wrap">
                  <span className="bg-blue-100 border-2 border-blue-400 px-2 py-1 text-xs font-bold">
                    {deck.cardCount || 0} cards
                  </span>
                  {(deck.dueCount || 0) > 0 && (
                    <span className="bg-red-100 border-2 border-red-400 px-2 py-1 text-xs font-bold">
                      {deck.dueCount} due
                    </span>
                  )}
                </div>
              </Link>
              <div className="border-t-4 border-black flex">
                <Link
                  href={`/study?deck=${deck.id}`}
                  className="flex-1 border-r-2 border-black py-2 text-center text-sm font-black hover:bg-yellow-100 transition-colors"
                >
                  📖 STUDY
                </Link>
                <button
                  onClick={() => deleteDeck(deck.id)}
                  className="px-4 py-2 text-sm font-black hover:bg-red-100 transition-colors text-red-700"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
