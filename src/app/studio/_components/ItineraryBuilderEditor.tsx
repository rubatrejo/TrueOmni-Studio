'use client';

import { Reorder, useDragControls } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Lock,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';

import type {
  EventsModule,
  ItineraryAiOption,
  ItineraryAiQuestion,
  ItineraryBuilderConfig,
  ListingsModule,
  TrailsModule,
} from '@/lib/studio/schema';

import { ImageField } from './ImageField';

let questionIdCounter = 0;
const newQuestionId = (key = 'new') => `q-${key}-${Date.now()}-${++questionIdCounter}`;
const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64) || `q_${Date.now()}`;

interface CategoryOption {
  key: string;
  label: string;
  subcategories: string[];
}

/**
 * Keys de las preguntas canónicas del template default. Estas NO se pueden
 * borrar desde el editor — son las que el runtime espera para mapear a
 * loops del AI generator (`duration` → days, `travel_type` → vibe, etc.).
 * Las preguntas custom añadidas por el operador sí se pueden borrar.
 */
const LOCKED_QUESTION_KEYS = new Set(['duration', 'travel_type', 'activities', 'dining']);

/**
 * Construye la lista de categorías disponibles para asociar a una option
 * del wizard. Se compone de cada catalog del módulo Listings + Trails +
 * Events. Si una categoría no tiene subcategorías, el dropdown subcategory
 * queda deshabilitado.
 */
function buildCategoryOptions(
  listings: ListingsModule | undefined,
  trails: TrailsModule | undefined,
  events: EventsModule | undefined,
): CategoryOption[] {
  const out: CategoryOption[] = [];
  if (listings) {
    for (const entry of listings) {
      out.push({
        key: entry.key,
        label: entry.label,
        subcategories: entry.catalog.subcategories ?? [],
      });
    }
  }
  if (trails) {
    out.push({
      key: 'trails',
      label: trails.label || 'Trails',
      subcategories: trails.subcategories ?? [],
    });
  }
  if (events) {
    out.push({
      key: 'events',
      label: events.label || 'Events',
      subcategories: events.categories ?? [],
    });
  }
  return out;
}

export function ItineraryBuilderEditor({
  itinerary,
  onChange,
  listings,
  trails,
  events,
}: {
  itinerary: ItineraryBuilderConfig;
  onChange: (next: ItineraryBuilderConfig) => void;
  listings?: ListingsModule;
  trails?: TrailsModule;
  events?: EventsModule;
}) {
  const categoryOptions = buildCategoryOptions(listings, trails, events);
  const aiEnabled = itinerary.aiEnabled;

  const setQuestions = (questions: ItineraryAiQuestion[]) => onChange({ ...itinerary, questions });

  const updateQuestion = (id: string, patch: Partial<ItineraryAiQuestion>) =>
    setQuestions(itinerary.questions.map((q) => (q.id === id ? { ...q, ...patch } : q)));

  const removeQuestion = (id: string) =>
    setQuestions(itinerary.questions.filter((q) => q.id !== id));

  const addQuestion = () => {
    const idx = itinerary.questions.length + 1;
    const key = `question_${idx}`;
    setQuestions([
      ...itinerary.questions,
      {
        id: newQuestionId(key),
        key,
        kicker: '',
        title: 'New question',
        type: 'single',
        options: [{ value: 'option_1', label: 'Option 1' }],
      },
    ]);
  };

  return (
    <div className="space-y-7">
      {/* Toggle hint */}
      <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-900 dark:bg-zinc-900/40">
        <div className="font-display text-[12.5px] font-semibold text-zinc-800 dark:text-zinc-200">
          Trip Planner
        </div>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-zinc-500 dark:text-zinc-500">
          Visitors plan a day with stops on a map. The AI wizard collects answers and proposes a
          route. Disable globally in the Modules tab.
        </p>
      </section>

      {/* AI flow toggle */}
      <Group
        title="AI flow"
        hint="When off, the “AI Itinerary Builder” CTA hides on the welcome popup; visitors can still build manually."
      >
        <ToggleRow
          label="Enable AI Itinerary wizard"
          icon={<Sparkles className="h-3.5 w-3.5" />}
          enabled={aiEnabled}
          onToggle={() => onChange({ ...itinerary, aiEnabled: !aiEnabled })}
        />
      </Group>

      {/* Wizard hero — shared image for ALL question screens */}
      <Group
        title="AI Wizard Hero"
        hint="Background image displayed on every AI question screen. Same image across all questions."
      >
        <Field label="Hero image · 1080 × 760 · landscape">
          <ImageField
            label="Upload hero image"
            hint="JPG / PNG · 1080 × 760 · top section of each AI question screen"
            value={itinerary.wizardHeroImage}
            onChange={(v) => onChange({ ...itinerary, wizardHeroImage: v ?? '' })}
            layout="cover"
            aspect="1080/760"
          />
        </Field>
      </Group>

      {/* AI Loading Screen */}
      <Group
        title="AI Loading Screen"
        hint="Background + title shown while the AI generates the itinerary."
      >
        <Field label="Background image · 1080 × 1920 · portrait">
          <ImageField
            label="Upload background"
            hint="JPG / PNG · 1080 × 1920 · fills the kiosk canvas"
            value={itinerary.loadingImage}
            onChange={(v) => onChange({ ...itinerary, loadingImage: v ?? '' })}
            layout="cover"
            aspect="1080/1920"
          />
        </Field>
        <Field label="Title template">
          <textarea
            value={itinerary.defaultTitleTemplate}
            onChange={(e) => onChange({ ...itinerary, defaultTitleTemplate: e.target.value })}
            rows={2}
            maxLength={200}
            className={`${inputCls} resize-none`}
            placeholder="Your perfect {duration_label} in {client_name}"
          />
          <p className="mt-1 text-[10.5px] text-zinc-400 dark:text-zinc-600">
            Supports {'{client_name}'} and {'{duration_label}'} placeholders.
          </p>
        </Field>
      </Group>

      {/* Questions */}
      <section className={aiEnabled ? '' : 'pointer-events-none opacity-50'}>
        <header className="mb-3">
          <h3 className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">
            Questions
          </h3>
          <p className="mt-0.5 text-[11.5px] text-zinc-400 dark:text-zinc-600">
            Drag to reorder · click to expand · {itinerary.questions.length}/8 questions.
          </p>
          <div
            className="mt-2 h-1 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-900"
            role="progressbar"
            aria-valuenow={itinerary.questions.length}
            aria-valuemin={0}
            aria-valuemax={8}
            aria-label="Itinerary questions used"
          >
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                itinerary.questions.length >= 8
                  ? 'bg-red-500'
                  : itinerary.questions.length >= 7
                    ? 'bg-amber-500'
                    : 'bg-sky-500'
              }`}
              style={{ width: `${Math.min(100, (itinerary.questions.length / 8) * 100)}%` }}
            />
          </div>
        </header>

        <Reorder.Group
          axis="y"
          values={itinerary.questions}
          onReorder={setQuestions}
          className="flex flex-col gap-2"
        >
          {itinerary.questions.map((q, idx) => (
            <QuestionRow
              key={q.id}
              question={q}
              index={idx}
              categoryOptions={categoryOptions}
              onUpdate={(patch) => updateQuestion(q.id, patch)}
              onRemove={() => removeQuestion(q.id)}
            />
          ))}
        </Reorder.Group>

        {itinerary.questions.length < 8 && (
          <button
            type="button"
            onClick={addQuestion}
            className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2 text-[12px] text-zinc-500 transition hover:border-sky-500/50 hover:bg-sky-500/5 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-500 dark:hover:bg-sky-500/5 dark:hover:text-sky-300"
          >
            <Plus className="h-3.5 w-3.5" />
            Add question
          </button>
        )}
      </section>
    </div>
  );
}

function QuestionRow({
  question,
  index,
  categoryOptions,
  onUpdate,
  onRemove,
}: {
  question: ItineraryAiQuestion;
  index: number;
  categoryOptions: CategoryOption[];
  onUpdate: (patch: Partial<ItineraryAiQuestion>) => void;
  onRemove: () => void;
}) {
  const dragControls = useDragControls();
  const [expanded, setExpanded] = useState(index === 0);

  const setOptions = (options: ItineraryAiOption[]) => onUpdate({ options });

  const updateOption = (i: number, patch: Partial<ItineraryAiOption>) =>
    setOptions(question.options.map((o, j) => (i === j ? { ...o, ...patch } : o)));

  const addOption = () => {
    const idx = question.options.length + 1;
    setOptions([...question.options, { value: `option_${idx}`, label: `Option ${idx}` }]);
  };

  const removeOption = (i: number) => {
    if (question.options.length <= 1) return;
    setOptions(question.options.filter((_, j) => j !== i));
  };

  const isDuration = question.key === 'duration';

  return (
    <Reorder.Item
      value={question}
      dragListener={false}
      dragControls={dragControls}
      className="overflow-hidden rounded-lg border border-zinc-200 bg-white transition hover:border-zinc-300 dark:border-zinc-900 dark:bg-zinc-900/40"
    >
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
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[12.5px] font-medium leading-tight text-zinc-800 dark:text-zinc-200">
            {question.title || <em className="text-zinc-400">No title</em>}
          </div>
          <div className="mt-0.5 truncate font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-600">
            {question.type} · {question.options.length} options · key: {question.key}
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
        {LOCKED_QUESTION_KEYS.has(question.key) ? (
          <span
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-300 dark:text-zinc-700"
            title="Default question — can't be removed"
            aria-label="Default question — locked"
          >
            <Lock className="h-3 w-3" />
          </span>
        ) : (
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

      {expanded && (
        <div className="space-y-3 border-t border-zinc-200 bg-zinc-50/50 p-3 dark:border-zinc-900 dark:bg-zinc-900/30">
          <Field label="Type">
            <div className="grid grid-cols-2 gap-1">
              {(['single', 'multi'] as const).map((t) => {
                const active = question.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onUpdate({ type: t })}
                    className={
                      'flex flex-col items-center gap-0.5 rounded-md border px-1.5 py-2 text-[11px] transition ' +
                      (active
                        ? 'border-sky-500/50 bg-sky-500/10 text-sky-700 dark:text-sky-300'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400')
                    }
                  >
                    <span className="leading-none">
                      {t === 'single' ? 'Single choice' : 'Multi choice'}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Kicker (small label above title)">
            <input
              value={question.kicker}
              onChange={(e) => onUpdate({ kicker: e.target.value })}
              maxLength={80}
              className={inputCls}
              placeholder="DURATION"
            />
          </Field>

          <Field label="Title">
            <textarea
              value={question.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              rows={2}
              maxLength={200}
              className={`${inputCls} resize-none`}
              placeholder="How long will you be exploring {client_name}?"
            />
          </Field>

          <Field label="Subtitle (optional)">
            <input
              value={question.subtitle ?? ''}
              onChange={(e) => onUpdate({ subtitle: e.target.value || undefined })}
              maxLength={200}
              className={inputCls}
              placeholder="*Select all that apply"
            />
          </Field>

          <Field label={`Options (${question.options.length})`}>
            <div className="space-y-1.5">
              {question.options.map((opt, i) => {
                const matchedCat = categoryOptions.find((c) => c.key === opt.categoryKey);
                const subOptions = matchedCat?.subcategories ?? [];
                return (
                  <div
                    key={`${question.id}-opt-${i}`}
                    className="space-y-1 rounded-md border border-zinc-200 bg-white p-1.5 dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <div className="grid grid-cols-[1fr_1fr_72px_28px] items-center gap-1.5">
                      <input
                        value={opt.label}
                        onChange={(e) => updateOption(i, { label: e.target.value })}
                        placeholder="Label"
                        maxLength={120}
                        className="h-7 bg-transparent px-1.5 text-[12px] text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-200"
                      />
                      <input
                        value={opt.value}
                        onChange={(e) => updateOption(i, { value: slugify(e.target.value) })}
                        placeholder="value"
                        maxLength={64}
                        className="h-7 bg-transparent px-1.5 font-mono text-[11px] text-zinc-700 outline-none placeholder:text-zinc-400 dark:text-zinc-300"
                      />
                      {isDuration ? (
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={opt.days ?? ''}
                          onChange={(e) =>
                            updateOption(i, {
                              days: e.target.value === '' ? undefined : Number(e.target.value),
                            })
                          }
                          placeholder="days"
                          className="h-7 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 text-center text-[11px] text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                          title="Days assigned for this duration option"
                        />
                      ) : (
                        <span className="grid h-7 place-items-center font-mono text-[10px] text-zinc-300 dark:text-zinc-700">
                          —
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeOption(i)}
                        disabled={question.options.length <= 1}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-zinc-400"
                        aria-label="Remove option"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    {/* AI filter — apply category + subcategory to filter the AI result. */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <select
                        value={opt.categoryKey ?? ''}
                        onChange={(e) =>
                          updateOption(i, {
                            categoryKey: e.target.value || undefined,
                            subcategoryKey: undefined,
                          })
                        }
                        className="h-7 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 text-[11px] text-zinc-700 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                        title="AI filter category"
                      >
                        <option value="">— Filter category —</option>
                        {categoryOptions.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <select
                        value={opt.subcategoryKey ?? ''}
                        onChange={(e) =>
                          updateOption(i, { subcategoryKey: e.target.value || undefined })
                        }
                        disabled={!matchedCat || subOptions.length === 0}
                        className="h-7 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 text-[11px] text-zinc-700 outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
                        title="AI filter subcategory"
                      >
                        <option value="">
                          {matchedCat
                            ? subOptions.length === 0
                              ? '— No subcategories —'
                              : '— All subcategories —'
                            : '— Pick category first —'}
                        </option>
                        {subOptions.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}

              {question.options.length < 20 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-zinc-300 bg-white px-2 py-1.5 text-[11.5px] text-zinc-500 transition hover:border-sky-500/50 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:hover:text-sky-300"
                >
                  <Plus className="h-3 w-3" />
                  Add option
                </button>
              )}
            </div>
          </Field>
        </div>
      )}
    </Reorder.Item>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Helpers                                                                   */
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
      {label && (
        <span className="mb-1 block text-[10.5px] font-medium uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-500">
          {label}
        </span>
      )}
      {children}
    </label>
  );
}

function ToggleRow({
  label,
  icon,
  enabled,
  onToggle,
}: {
  label: string;
  icon?: React.ReactNode;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-md border border-zinc-200 bg-white px-2.5 py-2 text-left transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40"
    >
      <span className="flex items-center gap-2 text-[12px] text-zinc-700 dark:text-zinc-300">
        {icon && (
          <span className="grid h-6 w-6 place-items-center rounded-md bg-sky-500/10 text-sky-700 dark:text-sky-300">
            {icon}
          </span>
        )}
        {label}
      </span>
      <span
        className={
          'relative flex h-5 w-9 shrink-0 items-center rounded-full transition ' +
          (enabled ? 'bg-sky-500/90' : 'bg-zinc-200 dark:bg-zinc-800')
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
