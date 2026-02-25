'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Card {
  id: number;
  front: string;
  back: string;
  cardType: string;
  difficulty: number;
  reviewCount: number;
  recallSuccessRate: number;
  dueDate: string;
}

interface Deck {
  id: number;
  name: string;
  description: string;
  cardCount: number;
}

export default function DeckDetailPage() {
  const params = useParams();
  const router = useRouter();
  const deckId = params.id as string;

  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<number | null>(null);
  const [editFront, setEditFront] = useState('');
  const [editBack, setEditBack] = useState('');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const [deckRes, cardsRes] = await Promise.all([
        fetch(`/api/decks/${deckId}`),
        fetch(`/api/decks/${deckId}/cards`),
      ]);
      const deckData = await deckRes.json();
      const cardsData = await cardsRes.json();
      setDeck(deckData);
      if (Array.isArray(cardsData)) setCards(cardsData);
      setLoading(false);
    }
    load();
  }, [deckId]);

  async function deleteCard(id: number) {
    if (!confirm('Delete this card?')) return;
    await fetch(`/api/cards/${id}`, { method: 'DELETE' });
    setCards((prev) => prev.filter((c) => c.id !== id));
  }

  async function saveCardEdit(id: number) {
    const res = await fetch(`/api/cards/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ front: editFront, back: editBack }),
    });
    const updated = await res.json();
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    setEditingCard(null);
  }

  if (loading) return <div className="text-center py-12 font-black text-xl">Loading...</div>;
  if (!deck) return <div className="text-center py-12 font-black text-xl">Deck not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="border-4 border-black bg-purple-400 p-6 shadow-[8px_8px_0px_black] flex-1">
          <h1 className="text-3xl font-black">{deck.name}</h1>
          {deck.description && <p className="font-bold mt-1">{deck.description}</p>}
          <p className="text-sm font-bold mt-2">{cards.length} cards</p>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href={`/study?deck=${deckId}`}
            className="border-4 border-black bg-yellow-400 px-4 py-2 font-black text-sm shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all text-center"
          >
            📖 STUDY
          </Link>
          <Link
            href="/upload"
            className="border-4 border-black bg-blue-400 px-4 py-2 font-black text-sm shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all text-center"
          >
            + ADD CARDS
          </Link>
          <button
            onClick={() => {
              if (confirm('Delete this deck and all its cards?')) {
                fetch(`/api/decks/${deckId}`, { method: 'DELETE' }).then(() =>
                  router.push('/decks')
                );
              }
            }}
            className="border-4 border-black bg-red-400 px-4 py-2 font-black text-sm shadow-[4px_4px_0px_black] hover:bg-red-500 transition-all text-center"
          >
            🗑️ DELETE
          </button>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="border-4 border-dashed border-black p-12 text-center">
          <p className="text-xl font-black">NO CARDS YET</p>
          <Link href="/upload" className="text-blue-600 font-bold underline">
            Add cards via Upload
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-xl font-black border-b-4 border-black pb-2">CARDS</h2>
          {cards.map((card, i) => (
            <div key={card.id} className="border-4 border-black bg-white shadow-[3px_3px_0px_black]">
              {editingCard === card.id ? (
                <div className="p-4 space-y-3">
                  <label className="block font-black text-sm">FRONT</label>
                  <textarea
                    value={editFront}
                    onChange={(e) => setEditFront(e.target.value)}
                    className="w-full border-2 border-black p-2 font-medium resize-none focus:outline-none"
                    rows={2}
                  />
                  <label className="block font-black text-sm">BACK</label>
                  <textarea
                    value={editBack}
                    onChange={(e) => setEditBack(e.target.value)}
                    className="w-full border-2 border-black p-2 font-medium resize-none focus:outline-none"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveCardEdit(card.id)}
                      className="border-2 border-black bg-green-400 px-4 py-2 font-black text-sm hover:bg-green-300"
                    >
                      SAVE
                    </button>
                    <button
                      onClick={() => setEditingCard(null)}
                      className="border-2 border-black bg-white px-4 py-2 font-black text-sm hover:bg-gray-100"
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-xs font-bold text-gray-500 mb-1">
                          #{i + 1} · {card.cardType} · ⭐{card.difficulty}/5 ·{' '}
                          {card.reviewCount > 0 ? ` ${Math.round(card.recallSuccessRate)}% success` : ' Not reviewed'}
                        </div>
                        <div className="font-bold">{card.front}</div>
                        {expandedCard === card.id && (
                          <div className="mt-2 pt-2 border-t-2 border-dashed border-gray-300 text-sm text-gray-700">
                            {card.back}
                          </div>
                        )}
                      </div>
                      <span className="text-gray-400 ml-2 text-sm">{expandedCard === card.id ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  <div className="border-t-2 border-black flex">
                    <button
                      onClick={() => {
                        setEditingCard(card.id);
                        setEditFront(card.front);
                        setEditBack(card.back);
                      }}
                      className="border-r-2 border-black px-4 py-2 text-xs font-black hover:bg-yellow-100"
                    >
                      ✏️ EDIT
                    </button>
                    <button
                      onClick={() => deleteCard(card.id)}
                      className="px-4 py-2 text-xs font-black hover:bg-red-100 text-red-700"
                    >
                      🗑️ DELETE
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
