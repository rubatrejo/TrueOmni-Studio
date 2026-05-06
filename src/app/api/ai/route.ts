import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';

/**
 * `POST /api/ai` — endpoint del módulo Ask AI del kiosk runtime.
 *
 * Sustituye al lookup canned de `useAiStore.askQuestion()`. Si la pregunta
 * matchea un suggested question (canned response), el cliente la usa
 * primero (instantáneo). Si no, llama aquí.
 *
 * Body: `{ question, slug, clientName, locale?, kioskContext? }`.
 *  - `kioskContext` = string corto con info del kiosk (location, modules
 *    activos, hora local). Lo construye el cliente desde el config visible.
 *
 * Response: `{ response: string, tokensUsed?: number }`.
 *
 * Si `ANTHROPIC_API_KEY` no está set → 503 con mensaje claro. El cliente
 * debe caer al fallback response del config en ese caso.
 *
 * Provider: Anthropic Claude Haiku 4.5 (rápido + barato; las respuestas son
 * conversacionales, no análisis profundo).
 */

const ANTHROPIC_MODEL = 'claude-haiku-4-5';
const MAX_INPUT_LENGTH = 500; // chars en la question + context
const MAX_TOKENS = 400; // ~300 palabras de respuesta — más que suficiente para conversational

interface RequestBody {
  question?: string;
  slug?: string;
  clientName?: string;
  locale?: string;
  kioskContext?: string;
}

function buildSystemPrompt(input: {
  clientName: string;
  locale: string;
  kioskContext: string;
}): string {
  return `You are a helpful tourism kiosk assistant for ${input.clientName}. The user is standing at a public kiosk and asks a question by tapping a suggested chip or speaking.

Context about this kiosk:
${input.kioskContext || '(no extra context provided)'}

Rules:
- Reply in ${localeLabel(input.locale)} (the user's preferred language).
- Keep replies under 70 words. Direct, friendly, no preamble. No "Of course!", no "I'd be happy to".
- If the question is about places/activities/events, recommend 1-3 specific suggestions visible in this kiosk's modules. Mention the module name when useful (e.g. "Check the Things to Do tab for...").
- If the kiosk doesn't have data to answer, say so honestly and suggest where the user can find out (front desk, official website, etc.).
- Never invent real-time data: weather, exact opening hours right now, current event prices. The kiosk has separate widgets for those.
- Tourist-friendly tone: assume the visitor is unfamiliar with the area.
- No markdown. Plain text only — output goes through a typewriter render.
- Do not start your reply with the user's question repeated back.`;
}

function localeLabel(locale: string): string {
  const m: Record<string, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    pt: 'Portuguese',
    ja: 'Japanese',
  };
  const code = (locale || 'en').slice(0, 2).toLowerCase();
  return m[code] ?? 'English';
}

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          'Ask AI requires ANTHROPIC_API_KEY. Set it in env and redeploy. The kiosk should fall back to its canned response.',
      },
      { status: 503 },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const question = (body.question ?? '').trim();
  const clientName = (body.clientName ?? '').trim() || 'this destination';
  const locale = (body.locale ?? 'en').trim();
  const kioskContext = (body.kioskContext ?? '').trim().slice(0, MAX_INPUT_LENGTH);

  if (!question) {
    return NextResponse.json({ error: 'Missing "question" in body.' }, { status: 400 });
  }
  if (question.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { error: `"question" too long (max ${MAX_INPUT_LENGTH} chars).` },
      { status: 400 },
    );
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const completion = await client.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: MAX_TOKENS,
      system: buildSystemPrompt({ clientName, locale, kioskContext }),
      messages: [{ role: 'user', content: question }],
    });

    // Extraer texto del primer content block.
    const block = completion.content[0];
    const responseText =
      block && block.type === 'text' ? block.text.trim() : '';

    if (!responseText) {
      return NextResponse.json(
        { error: 'Empty response from AI provider.' },
        { status: 502 },
      );
    }

    return NextResponse.json({
      response: responseText,
      tokensUsed: completion.usage.input_tokens + completion.usage.output_tokens,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown AI error';
    return NextResponse.json({ error: `AI provider failed: ${message}` }, { status: 502 });
  }
}
