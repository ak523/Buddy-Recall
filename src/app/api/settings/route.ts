import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const settingsPath = path.join(process.cwd(), 'settings.json');

function readSettings() {
  try {
    if (fs.existsSync(settingsPath)) {
      return JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
    }
  } catch {}
  return {};
}

export async function GET() {
  const settings = readSettings();
  // Don't expose the full API key
  const hasApiKey = !!(settings.geminiApiKey || process.env.GEMINI_API_KEY);
  return NextResponse.json({
    hasApiKey,
    apiKeyPreview: settings.geminiApiKey
      ? `${settings.geminiApiKey.substring(0, 8)}...`
      : process.env.GEMINI_API_KEY
      ? 'Set via environment variable'
      : null,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { geminiApiKey } = body;

    const settings = readSettings();
    if (geminiApiKey) settings.geminiApiKey = geminiApiKey;

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save settings';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
