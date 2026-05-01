'use client';

import { Reorder, useDragControls } from 'framer-motion';
import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  GripVertical,
  ListChecks,
  ListPlus,
  Mail,
  Phone,
  Plus,
  Star,
  TextCursorInput,
  ThumbsUp,
  Trash2,
  Type,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

import {
  newSurveyQuestionId,
  type SurveyConfig,
  type SurveyQuestion,
  type SurveyQuestionType,
} from '@/lib/studio/schema';

const QUESTION_TYPE_INFO: Record<
  SurveyQuestionType,
  { label: string; subtitle: string; icon: LucideIcon }
> = {
  nps: {
    label: 'NPS',
    subtitle: 'Net Promoter Score 0–10',
    icon: ThumbsUp,
  },
  rating: {
    label: 'Rating',
    subtitle: '1–5 stars',
    icon: Star,
  },
  'single-choice': {
    label: 'Single choice',
    subtitle: 'Pick one option',
    icon: ListChecks,
  },
  'multi-choice': {
    label: 'Multi choice',
    subtitle: 'Pick several',
    icon: CheckSquare,
  },
  text: {
    label: 'Free text',
    subtitle: 'Open answer',
    icon: TextCursorInput,
  },
};

const QUESTION_TYPES: SurveyQuestionType[] = [
  'nps',
  'rating',
  'single-choice',
  'multi-choice',
  'text',
];

export function SurveyEditor({
  survey,
  onChange,
}: {
  survey: SurveyConfig;
  onChange: (next: SurveyConfig) => void;
}) {
  const setQuestions = (questions: SurveyQuestion[]) => onChange({ ...survey, questions });

  const updateQuestion = (id: string, patch: Partial<SurveyQuestion>) =>
    setQuestions(
      survey.questions.map((q) =>
        q.id === id ? ({ ...q, ...patch } as SurveyQuestion) : q,
      ),
    );

  const removeQuestion = (id: string) =>
    setQuestions(survey.questions.filter((q) => q.id !== id));

  const addQuestion = (type: SurveyQuestionType) => {
    const base = {
      id: newSurveyQuestionId(),
      prompt: 'New question',
    };
    let next: SurveyQuestion;
    switch (type) {
      case 'nps':
        next = { ...base, type, labels: { low: 'Not at all likely', high: 'Extremely likely' } };
        break;
      case 'rating':
        next = { ...base, type };
        break;
      case 'single-choice':
        next = { ...base, type, options: ['Option 1', 'Option 2'] };
        break;
      case 'multi-choice':
        next = { ...base, type, options: ['Option 1', 'Option 2'] };
        break;
      case 'text':
        next = { ...base, type, maxLength: 500 };
        break;
    }
    setQuestions([...survey.questions, next]);
  };

  const changeType = (id: string, type: SurveyQuestionType) => {
    const old = survey.questions.find((q) => q.id === id);
    if (!old) return;
    const carry = { id: old.id, prompt: old.prompt, subtitle: old.subtitle, optional: old.optional };
    let next: SurveyQuestion;
    switch (type) {
      case 'nps':
        next = { ...carry, type, labels: { low: 'Not at all likely', high: 'Extremely likely' } };
        break;
      case 'rating':
        next = { ...carry, type };
        break;
      case 'single-choice':
        next = { ...carry, type, options: ['Option 1', 'Option 2'] };
        break;
      case 'multi-choice':
        next = { ...carry, type, options: ['Option 1', 'Option 2'] };
        break;
      case 'text':
        next = { ...carry, type, maxLength: 500 };
        break;
    }
    setQuestions(survey.questions.map((q) => (q.id === id ? next : q)));
  };

  return (
    <div className="space-y-7">
      {/* Toggle hint */}
      <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-900 dark:bg-zinc-900/40">
        <div className="font-display text-[12.5px] font-semibold text-zinc-800 dark:text-zinc-200">
          Survey overlay
        </div>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-zinc-500 dark:text-zinc-500">
          Triggered when a visitor taps the Survey tile. Disable globally in the Modules tab.
        </p>
      </section>

      {/* Intro */}
      <Group title="Intro" hint="The very first screen the visitor sees.">
        <Field label="Title">
          <input
            value={survey.intro.title}
            onChange={(e) => onChange({ ...survey, intro: { ...survey.intro, title: e.target.value } })}
            className={inputCls}
            maxLength={160}
          />
        </Field>
        <Field label="Subtitle (optional)">
          <textarea
            value={survey.intro.subtitle ?? ''}
            onChange={(e) =>
              onChange({
                ...survey,
                intro: { ...survey.intro, subtitle: e.target.value || undefined },
              })
            }
            rows={2}
            className={`${inputCls} resize-none`}
            maxLength={280}
          />
        </Field>
      </Group>

      {/* Questions */}
      <section>
        <header className="mb-3 flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
              Questions
            </h3>
            <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
              Drag to reorder · click to expand · {survey.questions.length}/20 questions.
            </p>
            {/* Progress bar (audit F-34): visual del % usado del límite. */}
            <div
              className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900"
              role="progressbar"
              aria-valuenow={survey.questions.length}
              aria-valuemin={0}
              aria-valuemax={20}
              aria-label="Survey questions used"
            >
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  survey.questions.length >= 18
                    ? 'bg-amber-500'
                    : survey.questions.length >= 20
                      ? 'bg-red-500'
                      : 'bg-sky-500'
                }`}
                style={{ width: `${Math.min(100, (survey.questions.length / 20) * 100)}%` }}
              />
            </div>
          </div>
        </header>

        <Reorder.Group
          axis="y"
          values={survey.questions}
          onReorder={setQuestions}
          className="flex flex-col gap-2"
        >
          {survey.questions.map((q, idx) => (
            <QuestionRow
              key={q.id}
              question={q}
              index={idx}
              onChangeType={(t) => changeType(q.id, t)}
              onUpdate={(patch) => updateQuestion(q.id, patch)}
              onRemove={() => removeQuestion(q.id)}
              canRemove={survey.questions.length > 1}
            />
          ))}
        </Reorder.Group>

        {survey.questions.length < 20 && (
          <AddQuestionMenu onAdd={addQuestion} />
        )}
      </section>

      {/* Contact capture */}
      <Group
        title="Contact capture"
        hint="Optional extra step asking for email and/or phone."
      >
        <ToggleRow
          label="Ask for contact info"
          enabled={survey.contactCapture?.enabled ?? false}
          onToggle={() =>
            onChange({
              ...survey,
              contactCapture: {
                enabled: !(survey.contactCapture?.enabled ?? false),
                email: survey.contactCapture?.email ?? true,
                phone: survey.contactCapture?.phone ?? false,
                disclaimer:
                  survey.contactCapture?.disclaimer ??
                  'We only use this to follow up if you asked for it.',
              },
            })
          }
        />
        {survey.contactCapture?.enabled && (
          <div className="mt-2 space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/50 p-2.5 dark:border-zinc-900 dark:bg-zinc-900/40">
            <div className="grid grid-cols-2 gap-2">
              <ContactCheck
                icon={<Mail className="h-3.5 w-3.5" />}
                label="Email"
                checked={survey.contactCapture.email ?? false}
                onChange={(v) =>
                  onChange({
                    ...survey,
                    contactCapture: { ...survey.contactCapture!, email: v },
                  })
                }
              />
              <ContactCheck
                icon={<Phone className="h-3.5 w-3.5" />}
                label="Phone"
                checked={survey.contactCapture.phone ?? false}
                onChange={(v) =>
                  onChange({
                    ...survey,
                    contactCapture: { ...survey.contactCapture!, phone: v },
                  })
                }
              />
            </div>
            <Field label="Disclaimer">
              <textarea
                value={survey.contactCapture.disclaimer}
                onChange={(e) =>
                  onChange({
                    ...survey,
                    contactCapture: {
                      ...survey.contactCapture!,
                      disclaimer: e.target.value,
                    },
                  })
                }
                rows={2}
                className={`${inputCls} resize-none`}
                maxLength={320}
              />
            </Field>
          </div>
        )}
      </Group>

      {/* Thank you */}
      <Group title="Thank you" hint="Final screen after the visitor submits.">
        <Field label="Title">
          <input
            value={survey.thankYou.title}
            onChange={(e) =>
              onChange({ ...survey, thankYou: { ...survey.thankYou, title: e.target.value } })
            }
            className={inputCls}
            maxLength={160}
          />
        </Field>
        <Field label="Message">
          <textarea
            value={survey.thankYou.message}
            onChange={(e) =>
              onChange({ ...survey, thankYou: { ...survey.thankYou, message: e.target.value } })
            }
            rows={2}
            className={`${inputCls} resize-none`}
            maxLength={320}
          />
        </Field>
        <Field label="Auto-close after (seconds)">
          <input
            type="number"
            min={1}
            max={30}
            value={Math.round((survey.thankYou.autoCloseMs ?? 5000) / 1000)}
            onChange={(e) =>
              onChange({
                ...survey,
                thankYou: {
                  ...survey.thankYou,
                  autoCloseMs: Math.max(1000, Math.min(30000, Number(e.target.value) * 1000)),
                },
              })
            }
            className={inputCls}
          />
        </Field>
      </Group>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Question row                                                               */
/* ────────────────────────────────────────────────────────────────────────── */

function QuestionRow({
  question,
  index,
  onChangeType,
  onUpdate,
  onRemove,
  canRemove,
}: {
  question: SurveyQuestion;
  index: number;
  onChangeType: (t: SurveyQuestionType) => void;
  onUpdate: (patch: Partial<SurveyQuestion>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const dragControls = useDragControls();
  const [expanded, setExpanded] = useState(false);
  const info = QUESTION_TYPE_INFO[question.type];
  const Icon = info.icon;

  return (
    <Reorder.Item
      value={question}
      dragListener={false}
      dragControls={dragControls}
      className="overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:border-zinc-300 dark:border-zinc-900 dark:bg-zinc-900/40"
    >
      {/* Header (always visible) */}
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          className="grid h-7 w-5 shrink-0 cursor-grab place-items-center text-zinc-400 transition hover:text-zinc-600 active:cursor-grabbing dark:text-zinc-600 dark:hover:text-zinc-300"
          aria-label={`Drag question ${index + 1}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-sky-500/10 font-mono text-[10.5px] font-semibold text-sky-700 dark:text-sky-300">
          {index + 1}
        </span>
        <span
          className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800"
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[12.5px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
            {question.prompt || <em className="text-zinc-400">No prompt</em>}
          </div>
          <div className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-600">
            {info.label}
            {question.optional ? ' · optional' : ''}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500"
            aria-label="Remove question"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Body */}
      {expanded && (
        <div className="space-y-3 border-t border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-900 dark:bg-zinc-900/30">
          {/* Type pills */}
          <Field label="Type">
            <div className="grid grid-cols-5 gap-1">
              {QUESTION_TYPES.map((t) => {
                const TIcon = QUESTION_TYPE_INFO[t].icon;
                const active = question.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onChangeType(t)}
                    className={
                      'flex flex-col items-center gap-1 rounded-md border px-1.5 py-2 text-[10px] transition ' +
                      (active
                        ? 'border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400')
                    }
                  >
                    <TIcon className="h-3.5 w-3.5" />
                    <span className="leading-none">{QUESTION_TYPE_INFO[t].label}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Prompt">
            <input
              value={question.prompt}
              onChange={(e) => onUpdate({ prompt: e.target.value })}
              className={inputCls}
              maxLength={280}
            />
          </Field>

          <Field label="Subtitle (optional)">
            <textarea
              value={question.subtitle ?? ''}
              onChange={(e) => onUpdate({ subtitle: e.target.value || undefined })}
              rows={2}
              className={`${inputCls} resize-none`}
              maxLength={280}
            />
          </Field>

          <ToggleRow
            label="Optional answer"
            enabled={!!question.optional}
            onToggle={() => onUpdate({ optional: !question.optional })}
          />

          {/* Type-specific fields */}
          {question.type === 'nps' && (
            <div className="grid grid-cols-2 gap-2">
              <Field label="Low label">
                <input
                  value={question.labels?.low ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      labels: {
                        low: e.target.value,
                        high: question.labels?.high ?? 'Extremely likely',
                      },
                    } as Partial<SurveyQuestion>)
                  }
                  className={inputCls}
                  maxLength={64}
                />
              </Field>
              <Field label="High label">
                <input
                  value={question.labels?.high ?? ''}
                  onChange={(e) =>
                    onUpdate({
                      labels: {
                        low: question.labels?.low ?? 'Not at all likely',
                        high: e.target.value,
                      },
                    } as Partial<SurveyQuestion>)
                  }
                  className={inputCls}
                  maxLength={64}
                />
              </Field>
            </div>
          )}

          {(question.type === 'single-choice' || question.type === 'multi-choice') && (
            <Field label="Options">
              <OptionsList
                options={question.options}
                onChange={(opts) =>
                  onUpdate({ options: opts } as Partial<SurveyQuestion>)
                }
              />
            </Field>
          )}

          {question.type === 'text' && (
            <Field label="Max characters">
              <input
                type="number"
                min={10}
                max={2000}
                value={question.maxLength ?? 500}
                onChange={(e) =>
                  onUpdate({
                    maxLength: Math.max(10, Math.min(2000, Number(e.target.value) || 500)),
                  } as Partial<SurveyQuestion>)
                }
                className={inputCls}
              />
            </Field>
          )}
        </div>
      )}
    </Reorder.Item>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Options list (single / multi choice)                                       */
/* ────────────────────────────────────────────────────────────────────────── */

function OptionsList({
  options,
  onChange,
}: {
  options: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      {options.map((opt, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-zinc-100 font-mono text-[10.5px] text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
            {i + 1}
          </span>
          <input
            value={opt}
            onChange={(e) => onChange(options.map((o, j) => (j === i ? e.target.value : o)))}
            className={inputCls}
            maxLength={120}
          />
          <button
            type="button"
            onClick={() => onChange(options.filter((_, j) => j !== i))}
            disabled={options.length <= 1}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
            aria-label="Remove option"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      {options.length < 20 && (
        <button
          type="button"
          onClick={() => onChange([...options, `Option ${options.length + 1}`])}
          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-zinc-300 bg-white px-3 py-1.5 text-[11.5px] text-zinc-500 transition hover:border-sky-500/40 hover:bg-sky-500/5 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:bg-sky-500/5 dark:hover:text-sky-300"
        >
          <Plus className="h-3 w-3" />
          Add option
        </button>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Add question menu                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

function AddQuestionMenu({ onAdd }: { onAdd: (t: SurveyQuestionType) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2.5 text-[12px] font-medium text-zinc-600 transition hover:border-sky-500/40 hover:bg-sky-500/5 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400 dark:hover:bg-sky-500/5 dark:hover:text-sky-300"
      >
        <ListPlus className="h-3.5 w-3.5" />
        Add question
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          {QUESTION_TYPES.map((t) => {
            const info = QUESTION_TYPE_INFO[t];
            const Icon = info.icon;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  onAdd(t);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
                    {info.label}
                  </div>
                  <div className="mt-0.5 text-[10.5px] text-zinc-500">{info.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

const inputCls =
  'w-full rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[12.5px] text-zinc-800 outline-none transition focus:border-sky-500/40 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100';

function Group({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <header className="mb-3">
        <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
          {title}
        </h3>
        {hint && <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">{hint}</p>}
      </header>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10.5px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  );
}

function ToggleRow({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-left transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <span className="text-[12px] text-zinc-700 dark:text-zinc-300">{label}</span>
      <span
        className={
          'relative flex h-5 w-9 shrink-0 items-center rounded-full transition ' +
          (enabled
            ? 'bg-sky-500/90'
            : 'bg-zinc-200 dark:bg-zinc-800')
        }
      >
        <span
          className={
            'h-4 w-4 transform rounded-full bg-white shadow-sm transition ' +
            (enabled ? 'translate-x-[18px]' : 'translate-x-0.5')
          }
        />
      </span>
    </button>
  );
}

function ContactCheck({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={
        'flex items-center gap-2 rounded-md border bg-white px-2 py-1.5 transition dark:bg-zinc-900/40 ' +
        (checked
          ? 'border-sky-500/40 bg-sky-500/5'
          : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-800')
      }
    >
      <span
        className={
          'grid h-6 w-6 shrink-0 place-items-center rounded-md ring-1 ' +
          (checked
            ? 'bg-sky-500/15 text-sky-700 ring-sky-500/30 dark:text-sky-300'
            : 'bg-zinc-100 text-zinc-500 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800')
        }
      >
        {icon}
      </span>
      <span className="text-[12px] font-medium text-zinc-800 dark:text-zinc-200">{label}</span>
      <Type className="ml-auto h-3 w-3 opacity-0" aria-hidden />
    </button>
  );
}
