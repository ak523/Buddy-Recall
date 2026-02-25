'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

const PROMPT_MODES = [
  { id: 'exam', label: 'Exam Mode', icon: '📝', desc: 'Key facts for exams' },
  { id: 'concept', label: 'Concept Mastery', icon: '💡', desc: 'Deep understanding' },
  { id: 'speed', label: 'Speed Recall', icon: '⚡', desc: 'Quick-fire cards' },
  { id: 'visual', label: 'Visual Memory', icon: '🎨', desc: 'Visual cues' },
  { id: 'language', label: 'Language Learning', icon: '🌍', desc: 'Language focus' },
  { id: 'custom', label: 'Custom', icon: '✏️', desc: 'Your own prompt' },
];

interface GeneratedCard {
  concept: string;
  card_type: string;
  front: string;
  back: string;
  visual_reference: string | null;
  difficulty: number;
}

interface Deck {
  id: number;
  name: string;
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [mode, setMode] = useState('concept');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [editingCard, setEditingCard] = useState<number | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>('new');
  const [newDeckName, setNewDeckName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setError('');
    setUploading(true);
    try {
      if (selectedFile.name.endsWith('.txt')) {
        const text = await selectedFile.text();
        setExtractedText(text);
      } else {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setExtractedText(data.text);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse file');
    } finally {
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }, [handleFile]);

  const handleGenerate = async () => {
    if (!extractedText) return;
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractedText, mode, customPrompt }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGeneratedCards(data.cards);

      // Fetch decks for saving
      const decksRes = await fetch('/api/decks');
      const decksData = await decksRes.json();
      if (Array.isArray(decksData)) setDecks(decksData);
      if (decksData.length > 0) setSelectedDeckId(String(decksData[0].id));
      if (file) setNewDeckName(file.name.replace(/\.[^/.]+$/, ''));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate cards');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (generatedCards.length === 0) return;
    setSaving(true);
    setError('');
    try {
      let deckId: number;
      if (selectedDeckId === 'new') {
        const name = newDeckName.trim() || 'New Deck';
        const res = await fetch('/api/decks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
        const deck = await res.json();
        deckId = deck.id;
      } else {
        deckId = parseInt(selectedDeckId);
      }

      await fetch(`/api/decks/${deckId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: generatedCards }),
      });

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

  return (
    <div className="space-y-6">
      <div className="border-4 border-black bg-blue-400 p-6 shadow-[8px_8px_0px_black]">
        <h1 className="text-3xl font-black">📤 UPLOAD & GENERATE</h1>
        <p className="font-bold mt-1">Transform your documents into smart flashcards</p>
      </div>

      {error && (
        <div className="border-4 border-red-600 bg-red-100 p-4 font-bold text-red-800">
          ❌ {error}
        </div>
      )}

      {/* File Upload */}
      <div className="space-y-4">
        <h2 className="text-xl font-black border-b-4 border-black pb-2">1. UPLOAD DOCUMENT</h2>
        <div
          className={`border-4 border-dashed border-black p-12 text-center cursor-pointer transition-all ${
            dragOver ? 'bg-yellow-100 scale-105' : 'bg-white hover:bg-gray-50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {uploading ? (
            <div className="font-black text-xl">⏳ Parsing document...</div>
          ) : file ? (
            <div>
              <div className="text-4xl mb-2">✅</div>
              <div className="font-black text-lg">{file.name}</div>
              <div className="text-sm font-medium text-gray-600 mt-1">
                {extractedText.length.toLocaleString()} characters extracted
              </div>
              <div className="text-sm text-blue-600 font-bold mt-2">Click to change file</div>
            </div>
          ) : (
            <div>
              <div className="text-5xl mb-3">📄</div>
              <div className="font-black text-xl">DROP FILE HERE</div>
              <div className="font-bold text-gray-600 mt-2">PDF, DOCX, TXT supported</div>
            </div>
          )}
        </div>
      </div>

      {/* Prompt Mode */}
      <div className="space-y-4">
        <h2 className="text-xl font-black border-b-4 border-black pb-2">2. SELECT MODE</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {PROMPT_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`border-4 border-black p-4 text-left transition-all ${
                mode === m.id
                  ? 'bg-yellow-400 shadow-[4px_4px_0px_black]'
                  : 'bg-white hover:bg-gray-50 hover:shadow-[2px_2px_0px_black]'
              }`}
            >
              <div className="text-2xl">{m.icon}</div>
              <div className="font-black mt-1">{m.label}</div>
              <div className="text-xs font-medium text-gray-600">{m.desc}</div>
            </button>
          ))}
        </div>
        {mode === 'custom' && (
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Enter your custom instructions for the AI..."
            className="w-full border-4 border-black p-3 font-medium h-24 resize-none focus:outline-none focus:bg-yellow-50"
          />
        )}
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={!extractedText || generating}
        className="w-full border-4 border-black bg-green-400 py-4 font-black text-xl shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {generating ? '⏳ GENERATING FLASHCARDS...' : '✨ GENERATE FLASHCARDS'}
      </button>

      {/* Generated Cards Preview */}
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
                          {card.card_type} · Difficulty {card.difficulty}/5
                        </div>
                        <div className="font-bold">{card.front}</div>
                        <div className="text-sm text-gray-700 mt-1 border-t-2 border-dashed border-gray-300 pt-1">
                          {card.back}
                        </div>
                      </div>
                      <button
                        onClick={() => setEditingCard(i)}
                        className="border-2 border-black bg-white px-2 py-1 text-xs font-bold hover:bg-gray-100 flex-shrink-0"
                      >
                        ✏️ Edit
                      </button>
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
