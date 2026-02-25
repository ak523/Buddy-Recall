'use client';

import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [currentKeyPreview, setCurrentKeyPreview] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setHasApiKey(data.hasApiKey);
        setCurrentKeyPreview(data.apiKeyPreview);
      });
  }, []);

  const saveSettings = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: apiKey }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ API key saved successfully!');
        setHasApiKey(true);
        setCurrentKeyPreview(`${apiKey.substring(0, 8)}...`);
        setApiKey('');
      }
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Test connection', mode: 'speed' }),
      });
      const data = await res.json();
      if (data.error && data.error.includes('API key')) {
        setTestResult('error');
      } else {
        setTestResult('success');
      }
    } catch {
      setTestResult('error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="border-4 border-black bg-gray-800 text-white p-6 shadow-[8px_8px_0px_black]">
        <h1 className="text-3xl font-black">⚙️ SETTINGS</h1>
        <p className="font-bold mt-1">Configure your Buddy Recall app</p>
      </div>

      {/* API Key */}
      <div className="border-4 border-black bg-white p-6 shadow-[4px_4px_0px_black] space-y-4">
        <h2 className="text-xl font-black border-b-4 border-black pb-2">🔑 GEMINI API KEY</h2>

        {hasApiKey && (
          <div className="border-4 border-green-500 bg-green-50 p-3 font-bold text-green-800">
            ✅ API key configured: {currentKeyPreview}
          </div>
        )}

        {message && (
          <div className="border-4 border-green-500 bg-green-50 p-3 font-bold text-green-800">
            {message}
          </div>
        )}

        <div>
          <label className="block font-black mb-2">Enter new API key:</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIza..."
            className="w-full border-4 border-black p-3 font-mono focus:outline-none focus:bg-yellow-50"
          />
          <p className="text-xs font-bold text-gray-500 mt-1">
            Get your API key from{' '}
            <a
              href="https://aistudio.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Google AI Studio
            </a>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={saveSettings}
            disabled={!apiKey.trim() || saving}
            className="border-4 border-black bg-black text-white px-6 py-3 font-black shadow-[4px_4px_0px_#666] hover:shadow-[6px_6px_0px_#666] hover:-translate-x-1 hover:-translate-y-1 transition-all disabled:opacity-50"
          >
            {saving ? 'SAVING...' : 'SAVE KEY'}
          </button>
          <button
            onClick={testConnection}
            disabled={testing}
            className="border-4 border-black bg-blue-400 px-6 py-3 font-black shadow-[4px_4px_0px_black] hover:shadow-[6px_6px_0px_black] hover:-translate-x-1 hover:-translate-y-1 transition-all disabled:opacity-50"
          >
            {testing ? 'TESTING...' : '🔌 TEST CONNECTION'}
          </button>
        </div>

        {testResult === 'success' && (
          <div className="border-4 border-green-500 bg-green-100 p-3 font-bold text-green-800">
            ✅ Connection successful! API key is working.
          </div>
        )}
        {testResult === 'error' && (
          <div className="border-4 border-red-500 bg-red-100 p-3 font-bold text-red-800">
            ❌ Connection failed. Please check your API key.
          </div>
        )}
      </div>

      {/* About */}
      <div className="border-4 border-black bg-yellow-50 p-6 shadow-[4px_4px_0px_black]">
        <h2 className="text-xl font-black border-b-4 border-black pb-2 mb-4">ℹ️ ABOUT</h2>
        <div className="space-y-2 font-bold">
          <p>🧠 <strong>Buddy Recall</strong> — AI-powered flashcard study app</p>
          <p>📚 Uses the SM-2 spaced repetition algorithm for optimal memory retention</p>
          <p>🤖 Powered by Google Gemini AI for intelligent flashcard generation</p>
          <p>💾 Stores data locally in SQLite — your data stays on your device</p>
          <p>🔒 100% offline-first — only the AI generation requires internet</p>
        </div>
      </div>
    </div>
  );
}
