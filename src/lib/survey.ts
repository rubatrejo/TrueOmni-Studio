import type { SurveyConfig, SurveyQuestion } from './config';

/** Valor de una respuesta del survey, depende del `type` de la pregunta. */
export type SurveyAnswer =
  | number // nps (0-10) | rating (1-5)
  | string // single-choice | text
  | string[] // multi-choice
  | null; // sin responder

/** Resultado final serializable, listo para dispatch. */
export interface SurveyResult {
  /** ISO 8601 UTC timestamp. */
  timestamp: string;
  /** Slug del KIOSK_CLIENT activo. */
  client: string;
  /** Mapa de respuestas por questionId. */
  answers: Record<string, SurveyAnswer>;
  /** Datos opcionales de contacto (si contactCapture.enabled y usuario escribió). */
  contact?: { email?: string; phone?: string };
}

/** ¿La respuesta satisface la pregunta? Optional + vacío también pasa. */
export function isAnswered(question: SurveyQuestion, answer: SurveyAnswer): boolean {
  if (question.optional) return true;
  if (answer === null || answer === undefined) return false;
  switch (question.type) {
    case 'nps':
    case 'rating':
      return typeof answer === 'number';
    case 'single-choice':
    case 'text':
      return typeof answer === 'string' && answer.length > 0;
    case 'multi-choice':
      return Array.isArray(answer) && answer.length > 0;
  }
}

/** ¿Hay AL MENOS una respuesta con valor? Para el confirm-exit. */
export function hasAnyAnswer(answers: Record<string, SurveyAnswer>): boolean {
  return Object.values(answers).some((v) => {
    if (v === null || v === undefined) return false;
    if (typeof v === 'string') return v.length > 0;
    if (Array.isArray(v)) return v.length > 0;
    return true;
  });
}

/** Construye el resultado final. Elimina respuestas null para payload limpio. */
export function buildResult(
  client: string,
  answers: Record<string, SurveyAnswer>,
  contact?: { email?: string; phone?: string },
): SurveyResult {
  const cleanAnswers: Record<string, SurveyAnswer> = {};
  for (const [k, v] of Object.entries(answers)) {
    if (v !== null && v !== undefined) cleanAnswers[k] = v;
  }
  const cleanContact =
    contact && (contact.email || contact.phone)
      ? {
          ...(contact.email ? { email: contact.email } : {}),
          ...(contact.phone ? { phone: contact.phone } : {}),
        }
      : undefined;
  return {
    timestamp: new Date().toISOString(),
    client,
    answers: cleanAnswers,
    ...(cleanContact ? { contact: cleanContact } : {}),
  };
}

/** Dispatch v1: console + CustomEvent. Sin persistencia. */
export function dispatchResult(result: SurveyResult): void {
  // eslint-disable-next-line no-console
  console.log('[kiosk:survey]', result);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('kiosk:survey-submitted', { detail: result }));
  }
}

/** Total de pasos (N preguntas + 1 si contactCapture.enabled). */
export function totalSteps(config: SurveyConfig): number {
  const base = config.questions.length;
  const contactStep = config.contactCapture?.enabled ? 1 : 0;
  return base + contactStep;
}
