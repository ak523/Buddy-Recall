'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MathText from '@/components/MathText';

interface GeneratedCard {
  concept: string;
  card_type: string;
  front: string;
  back: string;
  visual_reference: string | null;
  difficulty: number;
  topic?: string;
}

interface Deck {
  id: number;
  name: string;
}

const DELIMITERS = [
  { id: 'tab', label: 'Tab', char: '\t' },
  { id: 'comma', label: 'Comma (,)', char: ',' },
  { id: 'semicolon', label: 'Semicolon (;)', char: ';' },
  { id: 'custom', label: 'Custom', char: '' },
];

const PLACEHOLDER_TEXT = `What is photosynthesis?\tThe process by which plants convert sunlight into energy\tBiology
What is mitosis?\tA type of cell division resulting in two identical daughter cells\tBiology
What is the speed of light?\t299,792,458 meters per second\tPhysics`;

export default function ImportPage() {
  const router = useRouter();
  const [rawText, setRawText] = useState('');
  const [delimiterType, setDelimiterType] = useState('tab');
  const [customDelimiter, setCustomDelimiter] = useState('');
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [editingCard, setEditingCard] = useState<number | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('new');
  const [newDeckName, setNewDeckName] = useState('Imported Deck');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [parseSuccess, setParseSuccess] = useState(false);

  const getDelimiter = (): string => {
    const found = DELIMITERS.find((d) => d.id === delimiterType);
    if (delimiterType === 'custom') return customDelimiter;
    return found?.char || '\t';
  };

  const handleParse = async () => {
    setError('');
    setParseSuccess(false);
    const delimiter = getDelimiter();

    if (!delimiter) {
      setError('Please specify a custom delimiter');
      return;
    }

    if (!rawText.trim()) {
      setError('Please paste some text to import');
      return;
    }

    const lines = rawText.split('\n').filter((line) => line.trim() !== '');
    const cards: GeneratedCard[] = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      const parts = line.split(delimiter);
      if (parts.length < 2) {
        errors.push(`Line ${index + 1}: Missing delimiter — skipped`);
        return;
      }
      const front = parts[0].trim();
      const back = parts[1].trim();
      const topic = parts.length >= 3 ? parts[2].trim() : undefined;
      if (!front || !back) {
        errors.push(`Line ${index + 1}: Empty front or back — skipped`);
        return;
      }
      cards.push({
        concept: front,
        card_type: 'definition',
        front,
        back,
        visual_reference: null,
        difficulty: 3,
        topic: topic || undefined,
      });
    });

    if (cards.length === 0) {
      setError(
        'No valid cards found. Make sure each line has a front and back separated by the selected delimiter.' +
          (errors.length > 0 ? '\n' + errors.join('\n') : '')
      );
      return;
    }

    setGeneratedCards(cards);
    setParseSuccess(true);

    if (errors.length > 0) {
      setError(`Parsed ${cards.length} cards. ${errors.length} line(s) skipped:\n${errors.join('\n')}`);
    }

    // Fetch decks for saving
    try {
      const decksRes = await fetch('/api/decks');
      const decksData = await decksRes.json();
      if (Array.isArray(decksData)) {
        setDecks(decksData);
        if (decksData.length > 0) setSelectedDeckId(String(decksData[0].id));
      }
    } catch {
      // Non-critical — user can still create a new deck
    }
  };

  const handleSave = async () => {
    if (generatedCards.length === 0) return;
    setSaving(true);
    setError('');
    try {
      let deckId: number;
      if (selectedDeckId === 'new') {
        const name = newDeckName.trim() || 'Imported Deck';
        const res = await fetch('/api/decks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        if (!res.ok) throw new Error('Failed to create deck');
        const deck = await res.json();
        deckId = deck.id;
      } else {
        deckId = parseInt(selectedDeckId);
      }

      // Auto-create topics from card topic names
      const topicNames = [...new Set(generatedCards.map((c) => c.topic).filter(Boolean))] as string[];
      const topicMap: Record<string, number> = {};
      for (const name of topicNames) {
        const res = await fetch('/api/topics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deckId, name }),
        });
        if (res.ok) {
          const topic = await res.json();
          topicMap[name] = topic.id;
        }
      }

      const cardsWithTopics = generatedCards.map((card) => ({
        ...card,
        topic_id: card.topic ? topicMap[card.topic] || null : null,
      }));

      const saveRes = await fetch(`/api/decks/${deckId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: cardsWithTopics }),
      });
      if (!saveRes.ok) throw new Error('Failed to save cards');

      router.push(`/decks/${deckId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save cards');
    } finally {
      setSaving(false);
    }
  };

  const updateCard = (index: number, field: keyof GeneratedCard, value: string | number | null) => {
    setGeneratedCards((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeCard = (index: number) => {
    setGeneratedCards((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div className="border-4 border-black bg-purple-400 p-6 shadow-[8px_8px_0px_black]">
        <h1 className="text-3xl font-black">📋 MANUAL BULK IMPORT</h1>
        <p className="font-bold mt-1">Paste delimited text to create flashcards instantly</p>
      </div>

      {error && (
        <div className={`border-4 p-4 font-bold whitespace-pre-line ${parseSuccess ? 'border-yellow-600 bg-yellow-100 text-yellow-800' : 'border-red-600 bg-red-100 text-red-800'}`}>
          {parseSuccess ? '⚠️' : '❌'} {error}
        </div>
      )}

      {/* Input Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-black border-b-4 border-black pb-2">1. PASTE YOUR TEXT</h2>
        <p className="font-medium text-gray-700 text-sm">
          Each line should contain a <strong>front</strong> (question) and <strong>back</strong> (answer) separated by a delimiter. An optional third column assigns a <strong>topic</strong>.
        </p>
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={PLACEHOLDER_TEXT}
          className="w-full border-4 border-black p-4 font-medium h-48 resize-y focus:outline-none focus:bg-yellow-50 font-mono text-sm"
          spellCheck={false}
        />
      </div>

      {/* Delimiter Selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-black border-b-4 border-black pb-2">2. SELECT DELIMITER</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DELIMITERS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDelimiterType(d.id)}
              className={`border-4 border-black p-3 text-center font-bold transition-all ${
                delimiterType === d.id
                  ? 'bg-yellow-400 shadow-[4px_4px_0px_black]'
                  : 'bg-white hover:bg-gray-50 hover:shadow-[2px_2px_0px_black]'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
        {delimiterType === 'custom' && (
          <input
            type="text"
            value={customDelimiter}
            onChange={(e) => setCustomDelimiter(e.target.value)}
            placeholder="Enter custom delimiter (e.g. | or ::)"
            className="border-4 border-black p-2 font-bold w-full focus:outline-none focus:bg-yellow-50"
          />
        )}
      </div>

      {/* Parse Button */}
      <button
        onClick={handleParse}
        disabled={!rawText.trim()}
        className="w-full border-4 border-black bg-green-400 py-4 font-black text-xl shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        📋 PARSE FLASHCARDS
      </button>

      {/* Preview & Edit */}
      {generatedCards.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black border-b-4 border-black pb-2">
              3. PREVIEW & EDIT ({generatedCards.length} cards)
            </h2>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {generatedCards.map((card, i) => (
              <div key={i} className="border-4 border-black bg-white p-4 shadow-[3px_3px_0px_black]">
                {editingCard === i ? (
                  <div className="space-y-2">
                    <textarea
                      value={card.front}
                      onChange={(e) => updateCard(i, 'front', e.target.value)}
                      className="w-full border-2 border-black p-2 font-medium text-sm resize-none focus:outline-none"
                      rows={2}
                      placeholder="Front"
                    />
                    <textarea
                      value={card.back}
                      onChange={(e) => updateCard(i, 'back', e.target.value)}
                      className="w-full border-2 border-black p-2 font-medium text-sm resize-none focus:outline-none"
                      rows={3}
                      placeholder="Back"
                    />
                    <button
                      onClick={() => setEditingCard(null)}
                      className="border-2 border-black bg-yellow-400 px-3 py-1 text-sm font-bold hover:bg-yellow-300"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="text-xs font-bold text-gray-500 uppercase mb-1">
                          {card.card_type} · Difficulty {card.difficulty}/5{card.topic ? ` · 📁 ${card.topic}` : ''}
                        </div>
                        <div className="font-bold"><MathText text={card.front} /></div>
                        <div className="text-sm text-gray-700 mt-1 border-t-2 border-dashed border-gray-300 pt-1">
                          <MathText text={card.back} />
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => setEditingCard(i)}
                          className="border-2 border-black bg-white px-2 py-1 text-xs font-bold hover:bg-gray-100"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => removeCard(i)}
                          className="border-2 border-red-600 bg-white px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Save Options */}
          <div className="border-4 border-black bg-gray-50 p-6 space-y-4">
            <h3 className="font-black text-lg">4. SAVE TO DECK</h3>
            <div>
              <label className="block font-bold mb-2">Select deck:</label>
              <select
                value={selectedDeckId}
                onChange={(e) => setSelectedDeckId(e.target.value)}
                className="border-4 border-black p-2 font-bold bg-white w-full focus:outline-none"
              >
                <option value="new">+ Create new deck</option>
                {decks.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            {selectedDeckId === 'new' && (
              <div>
                <label className="block font-bold mb-2">New deck name:</label>
                <input
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  className="border-4 border-black p-2 font-bold w-full focus:outline-none focus:bg-yellow-50"
                  placeholder="Enter deck name..."
                />
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full border-4 border-black bg-black text-white py-3 font-black text-lg shadow-[4px_4px_0px_#666] hover:shadow-[6px_6px_0px_#666] hover:-translate-x-1 hover:-translate-y-1 transition-all disabled:opacity-50"
            >
              {saving ? '💾 SAVING...' : `💾 SAVE ${generatedCards.length} CARDS`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
