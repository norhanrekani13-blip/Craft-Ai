import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { Attachment } from './db.js';

let aiInstance: GoogleGenAI | null = null;

// Pre-warm client instance on server start
export function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Warm up immediately upon module import
try {
  getGeminiClient();
} catch (e) {
  // ignore
}

export interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: Attachment[];
}

/**
 * Compact context optimization:
 * Limits conversation history to the most relevant recent turns (default: 12)
 * to minimize prompt processing latency, token consumption, and Time To First Token (TTFT).
 */
export function buildGeminiContents(history: ChatHistoryItem[], maxTurns: number = 12) {
  const filtered = history.filter((h) => (h.role === 'user' || h.role === 'assistant') && h.content?.trim());

  // Compact history to most recent turns (ensuring we don't blow up context size)
  const sliced = filtered.length > maxTurns ? filtered.slice(filtered.length - maxTurns) : filtered;

  // Drop leading assistant turns so first turn is always user
  const firstUserIdx = sliced.findIndex((m) => m.role === 'user');
  const validHistory = firstUserIdx !== -1 ? sliced.slice(firstUserIdx) : sliced;

  const turns: Array<{ role: 'user' | 'model'; parts: any[] }> = [];

  for (const item of validHistory) {
    const role: 'user' | 'model' = item.role === 'assistant' ? 'model' : 'user';
    const parts: any[] = [];

    // Add attachments if any
    if (item.attachments && item.attachments.length > 0) {
      for (const att of item.attachments) {
        if (att.dataBase64) {
          const cleanBase64 = att.dataBase64.replace(/^data:[^;]+;base64,/, '');
          parts.push({
            inlineData: {
              mimeType: att.type || 'image/png',
              data: cleanBase64,
            },
          });
        }
      }
    }

    if (item.content && item.content.trim()) {
      parts.push({ text: item.content });
    }

    if (parts.length === 0) continue;

    const lastTurn = turns[turns.length - 1];
    // If consecutive turns have the same role, merge parts to satisfy Gemini API constraints
    if (lastTurn && lastTurn.role === role) {
      lastTurn.parts.push(...parts);
    } else {
      turns.push({ role, parts });
    }
  }

  // Ensure conversation ends with a user turn if generating for a user request
  if (turns.length === 0) {
    return [{ role: 'user', parts: [{ text: 'Hello' }] }];
  }

  return turns;
}

export const CRAFT_SYSTEM_INSTRUCTION = `You are Craft AI, an artisan AI assistant built for speed, precision, and craftsmanship.
Your goals:
- Answer directly, accurately, and without unnecessary preamble.
- Use clean Markdown with code blocks, tables, lists, and bold headers.
- When generating code, write production-ready, clean, idiomatic code with concise explanation.
- You are fluent across multiple languages including English, Kurdish (both Badini and Sorani dialects), Arabic, Turkish, and Persian. When addressed in Kurdish, Arabic, Turkish, or Persian, respond naturally in that language with correct grammar.
- Be proactive, intelligent, and helpful. Always identify yourself as Craft AI.`;

/**
 * Fast streaming request to Gemini with optimized thinking level
 */
export async function streamGeminiChat(params: {
  model: string;
  contents: any[];
  onChunk: (chunk: string) => void;
  signal?: AbortSignal;
}) {
  const { model, contents, onChunk } = params;
  const ai = getGeminiClient();

  // For flash model, use ThinkingLevel.LOW to avoid generating hundreds of hidden thinking tokens
  // This drastically cuts Time To First Token (TTFT)
  const config: any = {
    systemInstruction: CRAFT_SYSTEM_INSTRUCTION,
  };

  if (model.includes('flash')) {
    config.thinkingConfig = {
      thinkingLevel: ThinkingLevel.LOW,
    };
  }

  const stream = await ai.models.generateContentStream({
    model,
    contents,
    config,
  });

  let fullText = '';
  for await (const chunk of stream) {
    const text = chunk.text || '';
    if (text) {
      fullText += text;
      onChunk(text);
    }
  }

  return fullText;
}

export async function generateSpeechAudio(text: string, voiceName: string = 'Kore'): Promise<string | null> {
  try {
    const ai = getGeminiClient();
    const cleanText = text.slice(0, 1000);
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: 'Clear, engaging artisan assistant',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName || 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error('Error generating speech with Gemini TTS:', error);
    return null;
  }
}
