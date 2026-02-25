import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

function getApiKey(): string {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  try {
    const settingsPath = path.join(process.cwd(), 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      if (settings.geminiApiKey) return settings.geminiApiKey;
    }
  } catch {}
  return '';
}

export interface FlashcardData {
  concept: string;
  card_type: string;
  front: string;
  back: string;
  visual_reference: string | null;
  difficulty: number;
}

const PROMPT_MODES: Record<string, string> = {
  'exam': 'Generate flashcards optimized for exam preparation. Focus on key facts, definitions, and concepts that are likely to appear in exams.',
  'concept': 'Generate flashcards for deep concept mastery. Include explanations, examples, and relationships between concepts.',
  'speed': 'Generate concise flashcards for speed recall. Keep fronts and backs short and punchy.',
  'visual': 'Generate flashcards with visual memory cues. Include visual_reference search queries where helpful.',
  'language': 'Generate flashcards for language learning. Include pronunciation, usage examples, and context.',
  'custom': '',
};

export async function generateFlashcards(
  text: string,
  mode: string = 'concept',
  customPrompt?: string
): Promise<FlashcardData[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Gemini API key not configured. Please add it in Settings.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const modeInstruction = mode === 'custom' && customPrompt
    ? customPrompt
    : PROMPT_MODES[mode] || PROMPT_MODES['concept'];

  const prompt = `You are an expert flashcard creator. ${modeInstruction}

Analyze the following study material and generate a comprehensive set of flashcards.

Return ONLY a valid JSON array with no markdown formatting. Each flashcard object must have these exact fields:
- "concept": string (the main concept name)
- "card_type": string (one of: "definition", "process", "list", "comparison", "formula", "visual")
- "front": string (the question or prompt)
- "back": string (the answer)
- "visual_reference": string or null (a search query for a relevant diagram/image, or null)
- "difficulty": number (1-5, where 1=very easy, 5=very hard)

Study Material:
${text.substring(0, 15000)}

Return ONLY the JSON array, no other text.`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const responseText = response.text();

  // Clean up the response - remove markdown code blocks if present
  const cleaned = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    const cards = JSON.parse(cleaned);
    if (!Array.isArray(cards)) {
      throw new Error('Response is not an array');
    }
    return cards;
  } catch {
    // Try to extract JSON array from the response
    const match = cleaned.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Failed to parse flashcard response from AI');
  }
}

export async function testConnection(apiKey: string): Promise<boolean> {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    await model.generateContent('Say "ok" in one word.');
    return true;
  } catch {
    return false;
  }
}
