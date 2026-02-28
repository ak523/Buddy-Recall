'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core';

interface Topic {
  id: number;
  deckId: number;
  parentId: number | null;
  name: string;
  color: string;
}

interface Card {
  id: number;
  deckId: number;
  topicId: number | null;
  front: string;
  back: string;
  difficulty: number;
  reviewCount: number;
  recallSuccessRate: number;
}

interface Deck {
  id: number;
  name: string;
  description: string;
}

// --- Draggable Card Tile ---
function CardTile({ card, isDragging }: { card: Card; isDragging?: boolean }) {
  const strength = card.reviewCount > 0
    ? card.recallSuccessRate >= 0.7 ? 'bg-green-100 border-green-400' :
      card.recallSuccessRate >= 0.4 ? 'bg-yellow-100 border-yellow-400' :
      'bg-red-100 border-red-400'
    : 'bg-gray-100 border-gray-300';

  return (
    <div
      className={`border-2 ${strength} px-2 py-1 text-xs font-medium truncate max-w-[140px] rounded ${isDragging ? 'opacity-50' : ''}`}
      title={card.front}
    >
      {card.front.length > 30 ? card.front.slice(0, 30) + '…' : card.front}
    </div>
  );
}

function DraggableCard({ card }: { card: Card }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `card-${card.id}`,
    data: { card },
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
      <CardTile card={card} isDragging={isDragging} />
    </div>
  );
}

// --- Droppable Topic Region ---
function TopicRegion({
  topic,
  cards,
  allTopics,
  onAddSubTopic,
  onDeleteTopic,
  onRenameTopic,
}: {
  topic: Topic;
  cards: Card[];
  allTopics: Topic[];
  onAddSubTopic: (parentId: number) => void;
  onDeleteTopic: (topicId: number) => void;
  onRenameTopic: (topicId: number, name: string) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id: `topic-${topic.id}` });
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(topic.name);

  const subTopics = allTopics.filter((t) => t.parentId === topic.id);
  const topicCards = cards.filter((c) => c.topicId === topic.id);

  const handleRename = () => {
    if (editName.trim() && editName.trim() !== topic.name) {
      onRenameTopic(topic.id, editName.trim());
    }
    setEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      className={`border-2 rounded-lg p-3 min-w-[180px] transition-colors ${
        isOver ? 'ring-2 ring-blue-400 bg-blue-50' : ''
      }`}
      style={{ borderColor: topic.color, backgroundColor: topic.color + '20' }}
    >
      <div className="flex items-center justify-between mb-2 gap-1">
        {editing ? (
          <input
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            className="border-2 border-black px-1 text-sm font-bold flex-1 min-w-0"
          />
        ) : (
          <h3
            className="font-bold text-sm truncate cursor-pointer"
            onDoubleClick={() => { setEditName(topic.name); setEditing(true); }}
            title="Double-click to rename"
          >
            {topic.name}
          </h3>
        )}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onAddSubTopic(topic.id)}
            className="text-xs px-1 border border-gray-400 rounded hover:bg-gray-200"
            title="Add sub-topic"
          >
            +
          </button>
          <button
            onClick={() => onDeleteTopic(topic.id)}
            className="text-xs px-1 border border-red-400 rounded hover:bg-red-100 text-red-600"
            title="Delete topic"
          >
            ×
          </button>
        </div>
      </div>

      {/* Cards inside this topic */}
      {topicCards.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {topicCards.map((card) => (
            <DraggableCard key={card.id} card={card} />
          ))}
        </div>
      )}

      {/* Sub-topics */}
      {subTopics.length > 0 && (
        <div className="grid grid-cols-1 gap-2 mt-2">
          {subTopics.map((sub) => (
            <TopicRegion
              key={sub.id}
              topic={sub}
              cards={cards}
              allTopics={allTopics}
              onAddSubTopic={onAddSubTopic}
              onDeleteTopic={onDeleteTopic}
              onRenameTopic={onRenameTopic}
            />
          ))}
        </div>
      )}

      {topicCards.length === 0 && subTopics.length === 0 && (
        <p className="text-xs text-gray-400 italic">Drop cards here</p>
      )}
    </div>
  );
}

// --- Unassigned Region ---
function UnassignedRegion({ cards }: { cards: Card[] }) {
  const { isOver, setNodeRef } = useDroppable({ id: 'unassigned' });

  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed border-gray-400 rounded-lg p-3 min-w-[180px] transition-colors ${
        isOver ? 'ring-2 ring-blue-400 bg-blue-50' : 'bg-gray-50'
      }`}
    >
      <h3 className="font-bold text-sm text-gray-500 mb-2">📥 Unassigned</h3>
      {cards.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {cards.map((card) => (
            <DraggableCard key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">No unassigned cards</p>
      )}
    </div>
  );
}

// --- Main Map View ---
export default function DeckMapPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const router = useRouter();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchData = useCallback(async () => {
    try {
      const [deckRes, topicsRes, cardsRes] = await Promise.all([
        fetch(`/api/decks/${deckId}`),
        fetch(`/api/decks/${deckId}/topics`),
        fetch(`/api/decks/${deckId}/cards`),
      ]);
      const deckData = await deckRes.json();
      const topicsData = await topicsRes.json();
      const cardsData = await cardsRes.json();

      if (deckData.error) {
        router.push('/map');
        return;
      }
      setDeck(deckData);
      setTopics(Array.isArray(topicsData) ? topicsData : []);
      setCards(Array.isArray(cardsData) ? cardsData : []);
    } catch {
      router.push('/map');
    } finally {
      setLoading(false);
    }
  }, [deckId, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDragStart = (event: DragStartEvent) => {
    const card = event.active.data.current?.card as Card;
    if (card) setActiveCard(card);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    const { active, over } = event;
    if (!over) return;

    const cardData = active.data.current?.card as Card;
    if (!cardData) return;

    const overId = String(over.id);
    let newTopicId: number | null = null;

    if (overId === 'unassigned') {
      newTopicId = null;
    } else if (overId.startsWith('topic-')) {
      newTopicId = parseInt(overId.replace('topic-', ''));
    } else {
      return;
    }

    if (cardData.topicId === newTopicId) return;

    // Optimistic update
    setCards((prev) =>
      prev.map((c) => (c.id === cardData.id ? { ...c, topicId: newTopicId } : c))
    );

    await fetch(`/api/cards/${cardData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topicId: newTopicId }),
    });
  };

  const handleAddTopic = async (parentId: number | null = null) => {
    const name = parentId ? 'New Sub-topic' : newTopicName.trim();
    if (!name) return;

    const res = await fetch('/api/topics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deckId: parseInt(deckId), name, parentId }),
    });
    if (res.ok) {
      const topic = await res.json();
      setTopics((prev) => [...prev, topic]);
      if (!parentId) setNewTopicName('');
    }
  };

  const handleDeleteTopic = async (topicId: number) => {
    // Unassign cards locally
    const descendantIds = getDescendantIds(topicId, topics);
    const allIds = [topicId, ...descendantIds];

    setCards((prev) =>
      prev.map((c) => (allIds.includes(c.topicId ?? -1) ? { ...c, topicId: null } : c))
    );
    setTopics((prev) => prev.filter((t) => !allIds.includes(t.id)));

    await fetch(`/api/topics/${topicId}`, { method: 'DELETE' });
  };

  const handleRenameTopic = async (topicId: number, name: string) => {
    setTopics((prev) =>
      prev.map((t) => (t.id === topicId ? { ...t, name } : t))
    );
    await fetch(`/api/topics/${topicId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
  };

  if (loading) return <div className="text-center py-12 font-black text-xl">Loading map...</div>;
  if (!deck) return null;

  const rootTopics = topics.filter((t) => !t.parentId);
  const unassignedCards = cards.filter((c) => !c.topicId);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="border-4 border-black bg-teal-400 p-6 shadow-[8px_8px_0px_black]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black">🗺️ {deck.name}</h1>
            <p className="font-bold mt-1">Knowledge Map — drag cards into topic regions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/decks/${deckId}`)}
              className="border-4 border-black bg-white px-4 py-2 font-bold shadow-[3px_3px_0px_black] hover:shadow-[4px_4px_0px_black] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all text-sm"
            >
              📚 Cards
            </button>
            <button
              onClick={() => router.push(`/study?deck=${deckId}`)}
              className="border-4 border-black bg-yellow-400 px-4 py-2 font-bold shadow-[3px_3px_0px_black] hover:shadow-[4px_4px_0px_black] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all text-sm"
            >
              🧠 Study
            </button>
          </div>
        </div>
      </div>

      {/* Add Topic + Zoom Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2 flex-1 min-w-[200px]">
          <input
            type="text"
            value={newTopicName}
            onChange={(e) => setNewTopicName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
            placeholder="New topic name..."
            className="border-4 border-black p-2 font-bold flex-1 focus:outline-none focus:bg-yellow-50"
          />
          <button
            onClick={() => handleAddTopic()}
            disabled={!newTopicName.trim()}
            className="border-4 border-black bg-green-400 px-4 py-2 font-bold shadow-[3px_3px_0px_black] hover:shadow-[4px_4px_0px_black] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add Topic
          </button>
        </div>
        <div className="flex items-center gap-2 border-4 border-black bg-white px-3 py-1">
          <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} className="font-black text-lg px-1">−</button>
          <span className="font-bold text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(2, z + 0.1))} className="font-black text-lg px-1">+</button>
          <button onClick={() => setZoom(1)} className="text-xs font-bold border-l-2 border-black pl-2 ml-1">Reset</button>
        </div>
      </div>

      {/* Canvas */}
      <div className="border-4 border-black bg-white overflow-auto" style={{ maxHeight: '70vh' }}>
        <div
          ref={canvasRef}
          className="p-6 min-w-[600px]"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        >
          <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            {/* Topic grid */}
            {rootTopics.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {rootTopics.map((topic) => (
                  <TopicRegion
                    key={topic.id}
                    topic={topic}
                    cards={cards}
                    allTopics={topics}
                    onAddSubTopic={handleAddTopic}
                    onDeleteTopic={handleDeleteTopic}
                    onRenameTopic={handleRenameTopic}
                  />
                ))}
              </div>
            )}

            {/* Unassigned area */}
            <UnassignedRegion cards={unassignedCards} />

            {/* Drag overlay */}
            <DragOverlay>
              {activeCard ? <CardTile card={activeCard} /> : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs font-bold text-gray-500 px-2">
        <span>Card colors:</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-100 border border-green-400 rounded" /> Strong (≥70%)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-100 border border-yellow-400 rounded" /> Medium (40-70%)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-100 border border-red-400 rounded" /> Weak (&lt;40%)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-100 border border-gray-300 rounded" /> Unreviewed</span>
      </div>
    </div>
  );
}

function getDescendantIds(topicId: number, allTopics: Topic[]): number[] {
  const children = allTopics.filter((t) => t.parentId === topicId);
  let ids: number[] = [];
  for (const child of children) {
    ids.push(child.id);
    ids = ids.concat(getDescendantIds(child.id, allTopics));
  }
  return ids;
}
