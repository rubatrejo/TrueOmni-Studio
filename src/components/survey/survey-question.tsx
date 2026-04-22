'use client';

import type { SurveyQuestion } from '@/lib/config';
import type { SurveyAnswer } from '@/lib/survey';

import { QuestionMultiChoice } from './question-multi-choice';
import { QuestionNps } from './question-nps';
import { QuestionRating } from './question-rating';
import { QuestionSingleChoice } from './question-single-choice';
import { QuestionText } from './question-text';

interface Props {
  question: SurveyQuestion;
  value: SurveyAnswer;
  onChange: (value: SurveyAnswer) => void;
  counterTemplate: string;
}

/** Discrimina por `question.type` y delega a la variante. */
export function SurveyQuestionView({ question, value, onChange, counterTemplate }: Props) {
  switch (question.type) {
    case 'nps':
      return (
        <QuestionNps
          value={typeof value === 'number' ? value : null}
          onChange={(v) => onChange(v)}
          labels={question.labels}
        />
      );
    case 'rating':
      return (
        <QuestionRating
          value={typeof value === 'number' ? value : null}
          onChange={(v) => onChange(v)}
          max={question.max ?? 5}
        />
      );
    case 'single-choice':
      return (
        <QuestionSingleChoice
          value={typeof value === 'string' ? value : null}
          onChange={(v) => onChange(v)}
          options={question.options}
        />
      );
    case 'multi-choice':
      return (
        <QuestionMultiChoice
          value={Array.isArray(value) ? value : null}
          onChange={(v) => onChange(v)}
          options={question.options}
        />
      );
    case 'text':
      return (
        <QuestionText
          value={typeof value === 'string' ? value : null}
          maxLength={question.maxLength ?? 500}
          counterTemplate={counterTemplate}
        />
      );
  }
}
