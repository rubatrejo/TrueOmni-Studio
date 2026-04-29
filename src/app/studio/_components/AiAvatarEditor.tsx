'use client';

import { Plus, Trash2 } from 'lucide-react';

import type { AiAvatarConfig } from '@/lib/studio/schema';

import { ImageField } from './ImageField';

const ANTHROPIC_MODELS = [
  { id: 'claude-opus-4-7', label: 'Claude Opus 4.7' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
];

let chipIdCounter = 0;
const newQuestionId = () => `q-${Date.now()}-${++chipIdCounter}`;

export function AiAvatarEditor({
  aiAvatar,
  onChange,
}: {
  aiAvatar: AiAvatarConfig;
  onChange: (next: AiAvatarConfig) => void;
}) {
  const set = <K extends keyof AiAvatarConfig>(key: K, value: AiAvatarConfig[K]) =>
    onChange({ ...aiAvatar, [key]: value });

  const addQuestion = () =>
    onChange({
      ...aiAvatar,
      suggestedQuestions: [
        ...aiAvatar.suggestedQuestions,
        { id: newQuestionId(), text: '' },
      ],
    });

  const updateQuestion = (id: string, text: string) =>
    onChange({
      ...aiAvatar,
      suggestedQuestions: aiAvatar.suggestedQuestions.map((q) =>
        q.id === id ? { ...q, text } : q,
      ),
    });

  const removeQuestion = (id: string) =>
    onChange({
      ...aiAvatar,
      suggestedQuestions: aiAvatar.suggestedQuestions.filter((q) => q.id !== id),
    });

  return (
    <div className="space-y-7">
      {/* Avatar + hero */}
      <Group title="Visuals" hint="The image users see floating, plus the modal hero loop.">
        <div className="grid grid-cols-2 gap-2">
          <ImageField
            label="Avatar"
            hint="PNG / JPG · 256+"
            value={aiAvatar.avatar}
            onChange={(v) => set('avatar', v)}
          />
          <ImageField
            label="Hero video"
            hint="MP4 / WebM · loops"
            value={aiAvatar.heroVideo}
            onChange={(v) => set('heroVideo', v)}
            accept="video/mp4,video/webm"
            maxBytes={2 * 1024 * 1024}
          />
        </div>
      </Group>

      {/* Greeting */}
      <Group
        title="Greeting"
        hint="Shown when the modal opens. Use {client_name} to interpolate."
      >
        <textarea
          value={aiAvatar.greeting}
          onChange={(e) => set('greeting', e.target.value)}
          rows={3}
          className="w-full resize-none rounded-lg border border-zinc-200 bg-white px-3 py-2 font-display text-[13px] leading-relaxed text-zinc-800 outline-none transition focus:border-sky-500/40 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          placeholder="Hi! Ask me anything about {client_name}."
          maxLength={280}
        />
        <div className="mt-1 flex justify-end font-mono text-[10.5px] text-zinc-400">
          {aiAvatar.greeting.length}/280
        </div>
      </Group>

      {/* Suggested questions */}
      <Group
        title="Suggested questions"
        hint="Up to 8 chips appear below the greeting. Tap a chip prefills the input."
      >
        <div className="space-y-1.5">
          {aiAvatar.suggestedQuestions.map((q, i) => (
            <div
              key={q.id}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-1.5 transition hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-sky-500/10 font-mono text-[10.5px] font-semibold text-sky-700 dark:text-sky-300">
                {i + 1}
              </span>
              <input
                value={q.text}
                onChange={(e) => updateQuestion(q.id, e.target.value)}
                placeholder="Where can I eat?"
                maxLength={160}
                className="h-7 flex-1 bg-transparent px-2 text-[12.5px] text-zinc-800 outline-none placeholder:text-zinc-400 dark:text-zinc-200"
              />
              <button
                type="button"
                onClick={() => removeQuestion(q.id)}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500"
                aria-label="Remove question"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {aiAvatar.suggestedQuestions.length < 8 && (
            <button
              type="button"
              onClick={addQuestion}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-white px-3 py-2 text-[12px] text-zinc-500 transition hover:border-sky-500/50 hover:bg-sky-500/5 hover:text-sky-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-500 dark:hover:bg-sky-500/5 dark:hover:text-sky-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Add suggested question
            </button>
          )}
        </div>
      </Group>

      {/* API */}
      <Group
        title="Anthropic API"
        hint="Stored encrypted server-side. Used for live answers (Phase S6)."
      >
        <div className="space-y-2">
          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
              Model
            </span>
            <select
              value={aiAvatar.model}
              onChange={(e) => set('model', e.target.value)}
              className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[12.5px] text-zinc-800 outline-none transition focus:border-sky-500/40 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            >
              {ANTHROPIC_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
              API key
            </span>
            <input
              type="password"
              value={aiAvatar.apiKey ?? ''}
              onChange={(e) => set('apiKey', e.target.value || undefined)}
              placeholder="sk-ant-…"
              className="block w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-[12px] text-zinc-800 outline-none transition focus:border-sky-500/40 focus:ring-2 focus:ring-sky-500/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              autoComplete="off"
              spellCheck={false}
            />
            <p className="mt-1 text-[10.5px] text-zinc-400 dark:text-zinc-600">
              Leave empty to use the global TrueOmni key (recommended for trials).
            </p>
          </label>
        </div>
      </Group>
    </div>
  );
}

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
      {children}
    </section>
  );
}
