import { z } from 'zod';

/* ────────────────────────────────────────────────────────────────────────── */
/*  Survey                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

const SurveyQuestionBase = {
  id: z.string().min(1).max(64),
  prompt: z.string().min(1).max(280),
  subtitle: z.string().max(280).optional(),
  optional: z.boolean().optional(),
};

export const SurveyQuestionSchema = z.discriminatedUnion('type', [
  z.object({
    ...SurveyQuestionBase,
    type: z.literal('nps'),
    labels: z.object({ low: z.string().max(64), high: z.string().max(64) }).optional(),
  }),
  z.object({
    ...SurveyQuestionBase,
    type: z.literal('rating'),
    max: z.literal(5).optional(),
  }),
  z.object({
    ...SurveyQuestionBase,
    type: z.literal('single-choice'),
    options: z.array(z.string().min(1).max(120)).min(1).max(20),
  }),
  z.object({
    ...SurveyQuestionBase,
    type: z.literal('multi-choice'),
    options: z.array(z.string().min(1).max(120)).min(1).max(20),
  }),
  z.object({
    ...SurveyQuestionBase,
    type: z.literal('text'),
    maxLength: z.number().int().min(1).max(2000).optional(),
  }),
]);

export type SurveyQuestion = z.infer<typeof SurveyQuestionSchema>;
export type SurveyQuestionType = SurveyQuestion['type'];

export const SurveyContactCaptureSchema = z.object({
  enabled: z.boolean(),
  email: z.boolean().optional(),
  phone: z.boolean().optional(),
  disclaimer: z.string().max(320),
});

export const SurveyIntroSchema = z.object({
  title: z.string().min(1).max(160),
  subtitle: z.string().max(280).optional(),
});

export const SurveyThankYouSchema = z.object({
  title: z.string().min(1).max(160),
  message: z.string().min(1).max(320),
  autoCloseMs: z.number().int().min(1000).max(30000).optional(),
});

export const SurveySchema = z.object({
  enabled: z.boolean(),
  /** Path o data URL del logo opcional del survey. */
  logo: z.string().optional(),
  intro: SurveyIntroSchema,
  questions: z.array(SurveyQuestionSchema).min(1).max(20),
  contactCapture: SurveyContactCaptureSchema.optional(),
  thankYou: SurveyThankYouSchema,
});

export type SurveyConfig = z.infer<typeof SurveySchema>;

export const DEFAULT_SURVEY: SurveyConfig = {
  enabled: true,
  intro: {
    title: 'We value your feedback',
    subtitle: 'Your answers help us improve this kiosk.',
  },
  questions: [
    {
      id: 'nps',
      type: 'nps',
      prompt: 'How likely are you to recommend this kiosk?',
      subtitle: 'Your honest rating helps us improve the experience for every visitor.',
      labels: { low: 'Not at all likely', high: 'Extremely likely' },
    },
    {
      id: 'overall',
      type: 'rating',
      prompt: 'Overall, how would you rate your experience?',
      subtitle: 'One tap is all it takes — from poor to excellent.',
    },
    {
      id: 'comment',
      type: 'text',
      prompt: 'Any other feedback?',
      subtitle: 'Share anything else on your mind — ideas, suggestions or praise.',
      optional: true,
      maxLength: 500,
    },
  ],
  contactCapture: {
    enabled: false,
    email: true,
    phone: false,
    disclaimer: 'We only use this to follow up if you asked for it.',
  },
  thankYou: {
    title: 'Thanks for your feedback',
    message: 'We read every response. Enjoy your visit!',
    autoCloseMs: 5000,
  },
};

let _surveyIdSeq = 0;
export function newSurveyQuestionId(): string {
  return `q-${Date.now().toString(36)}-${++_surveyIdSeq}`;
}
