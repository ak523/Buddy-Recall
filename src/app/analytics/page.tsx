'use client';

import { useEffect, useState } from 'react';

interface HeatmapDay {
  date: string;
  count: number;
}

interface DeckStat {
  deckId: number;
  deckName: string;
  avgSuccessRate: number;
  totalCards: number;
  masteredCards: number;
  recentReviews: number;
}

function generateLast52Weeks() {
  const weeks: string[][] = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 363);

  // Align to Sunday
  while (startDate.getDay() !== 0) {
    startDate.setDate(startDate.getDate() - 1);
  }

  const current = new Date(startDate);
  while (current <= today) {
    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export default function AnalyticsPage() {
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([]);
  const [retentionData, setRetentionData] = useState<DeckStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [heatRes, retRes] = await Promise.all([
        fetch('/api/analytics/heatmap'),
        fetch('/api/analytics/retention'),
      ]);
      const heat = await heatRes.json();
      const ret = await retRes.json();
      if (Array.isArray(heat)) setHeatmapData(heat);
      if (Array.isArray(ret)) setRetentionData(ret);
      setLoading(false);
    }
    fetchData();
  }, []);

  const heatmapMap = new Map(heatmapData.map((d) => [d.date, d.count]));
  const weeks = generateLast52Weeks();
  const totalReviews = heatmapData.reduce((sum, d) => sum + d.count, 0);
  const totalMastered = retentionData.reduce((sum, d) => sum + d.masteredCards, 0);
  const avgRetention =
    retentionData.length > 0
      ? retentionData.reduce((sum, d) => sum + d.avgSuccessRate, 0) / retentionData.length
      : 0;

  const getColor = (count: number) => {
    if (count === 0) return 'bg-gray-100 border-gray-200';
    if (count < 5) return 'bg-green-200 border-green-300';
    if (count < 15) return 'bg-green-400 border-green-500';
    if (count < 30) return 'bg-green-600 border-green-700';
    return 'bg-green-800 border-green-900';
  };

  return (
    <div className="space-y-8">
      <div className="border-4 border-black bg-purple-400 p-6 shadow-[8px_8px_0px_black]">
        <h1 className="text-3xl font-black">📊 ANALYTICS</h1>
        <p className="font-bold mt-1">Track your study progress</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Reviews', value: totalReviews, icon: '📝', color: 'bg-blue-400' },
          { label: 'Cards Mastered', value: totalMastered, icon: '🏆', color: 'bg-yellow-400' },
          { label: 'Avg Retention', value: `${Math.round(avgRetention)}%`, icon: '🧠', color: 'bg-green-400' },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} border-4 border-black p-4 shadow-[4px_4px_0px_black]`}>
            <div className="text-3xl">{stat.icon}</div>
            <div className="text-3xl font-black mt-1">
              {loading ? '...' : stat.value}
            </div>
            <div className="font-bold text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_black]">
        <h2 className="text-xl font-black mb-4 border-b-4 border-black pb-2">
          📅 STUDY ACTIVITY (LAST 52 WEEKS)
        </h2>
        <div className="overflow-x-auto">
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((date) => {
                  const count = heatmapMap.get(date) || 0;
                  return (
                    <div
                      key={date}
                      title={`${date}: ${count} reviews`}
                      className={`w-3 h-3 border ${getColor(count)} cursor-pointer`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs font-bold">
            <span>Less</span>
            {['bg-gray-100', 'bg-green-200', 'bg-green-400', 'bg-green-600', 'bg-green-800'].map((c) => (
              <div key={c} className={`w-3 h-3 ${c} border border-gray-300`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Deck Stats */}
      <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_black]">
        <h2 className="text-xl font-black mb-4 border-b-4 border-black pb-2">
          📚 DECK PERFORMANCE
        </h2>
        {loading ? (
          <div className="text-center py-8 font-bold">Loading...</div>
        ) : retentionData.length === 0 ? (
          <div className="text-center py-8 font-bold text-gray-500">
            No data yet. Start studying to see stats!
          </div>
        ) : (
          <div className="space-y-4">
            {retentionData.map((deck) => (
              <div key={deck.deckId} className="border-4 border-black p-4 shadow-[2px_2px_0px_black]">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-black text-lg">{deck.deckName}</h3>
                    <div className="flex gap-3 mt-2 text-sm flex-wrap">
                      <span className="bg-blue-100 border-2 border-blue-400 px-2 py-1 font-bold">
                        {deck.totalCards} cards
                      </span>
                      <span className="bg-yellow-100 border-2 border-yellow-400 px-2 py-1 font-bold">
                        {deck.masteredCards} mastered
                      </span>
                      <span className="bg-green-100 border-2 border-green-400 px-2 py-1 font-bold">
                        {deck.recentReviews} reviews (7d)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black">{Math.round(deck.avgSuccessRate)}%</div>
                    <div className="text-xs font-bold text-gray-500">retention</div>
                  </div>
                </div>
                <div className="mt-3 h-2 border-2 border-black bg-gray-200">
                  <div
                    className="h-full bg-green-400 transition-all"
                    style={{ width: `${Math.min(100, deck.avgSuccessRate)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
