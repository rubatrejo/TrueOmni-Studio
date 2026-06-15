import { z } from 'zod';

/* ────────────────────────────────────────────────────────────────────────── */
/*  AI Avatar (Ask Anything)                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export const AiSuggestedQuestionSchema = z.object({
  id: z.string().min(1).max(64),
  text: z.string().min(1).max(160),
});

export const AiAvatarSchema = z.object({
  /** Path o data URL del PNG/JPG del avatar flotante. */
  avatar: z.string().optional(),
  /** Path o data URL del MP4/WebM del hero del modal (loop). */
  heroVideo: z.string().optional(),
  /** Texto de bienvenida del modal (sin typewriter). Soporta `{client_name}`. */
  greeting: z.string().min(1).max(280).default('Hi! How can I help you today?'),
  /** API key de Anthropic (server-side, opcional hasta Fase S6). */
  apiKey: z.string().optional(),
  /** Modelo Anthropic a usar. */
  model: z.string().default('claude-sonnet-4-6'),
  /** Preguntas sugeridas que aparecen como chips dentro del modal. */
  suggestedQuestions: z.array(AiSuggestedQuestionSchema).max(8).default([]),
});

export type AiAvatarConfig = z.infer<typeof AiAvatarSchema>;

export const DEFAULT_AI_AVATAR: AiAvatarConfig = {
  greeting: 'Hi! Ask me anything about {client_name}.',
  model: 'claude-sonnet-4-6',
  suggestedQuestions: [],
};
