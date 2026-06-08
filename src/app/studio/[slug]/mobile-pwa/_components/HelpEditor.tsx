'use client';

import type { PwaHelpArticle, PwaHelpConfig } from '@/lib/config';

import { move, PwaField, PwaGroup, PwaPanelHeader, ReorderButtons } from './pwa-ui';

/**
 * Editor del centro de ayuda de la PWA: landing (`HelpScreen`), detalle de artículo
 * (`HelpArticleScreen`) y contacto (`HelpContactScreen`). Edita los textos de UI y
 * la lista de artículos FAQ (`articles[]`). Las respuestas admiten `{client_name}`
 * (interpolado en runtime). Nota: editar artículos se refleja en el preview al
 * recargar/publicar (la interpolación de `{client_name}` se hace en el server).
 */

/** Slug estable a partir de la pregunta (kebab + sufijo para evitar colisiones). */
function newHelpArticleSlug(question: string): string {
  const base = question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${base || 'article'}-${Date.now().toString(36)}`;
}

const EMPTY: PwaHelpConfig = {
  title: '',
  searchPlaceholder: '',
  noResults: '',
  helpfulPrompt: '',
  helpfulYes: '',
  helpfulNo: '',
  thanks: '',
  needMoreTitle: '',
  needMoreBody: '',
  contactCta: '',
  contact: {
    title: '',
    fromLabel: '',
    fromDefault: '',
    messagePlaceholder: '',
    send: '',
    callCta: '',
    successTitle: '',
    successBody: '',
  },
  articles: [],
};

export function HelpEditor({
  value,
  onChange,
}: {
  value: PwaHelpConfig | undefined;
  onChange: (next: PwaHelpConfig) => void;
}) {
  const v: PwaHelpConfig = {
    ...EMPTY,
    ...value,
    contact: { ...EMPTY.contact, ...value?.contact },
    articles: value?.articles ?? [],
  };
  const c = v.contact;
  const setContact = (patch: Partial<PwaHelpConfig['contact']>) =>
    onChange({ ...v, contact: { ...c, ...patch } });

  const updateArticle = (i: number, patch: Partial<PwaHelpArticle>) =>
    onChange({ ...v, articles: v.articles.map((a, idx) => (idx === i ? { ...a, ...patch } : a)) });
  const removeArticle = (i: number) =>
    onChange({ ...v, articles: v.articles.filter((_, idx) => idx !== i) });
  const addArticle = () =>
    onChange({
      ...v,
      articles: [
        ...v.articles,
        {
          slug: newHelpArticleSlug('new question'),
          category: 'General',
          question: 'New question',
          answer: '',
        },
      ],
    });

  return (
    <div className="flex h-full flex-col">
      <PwaPanelHeader
        title="Help"
        description="White-label texts of the help center (landing, article and contact). FAQ articles come from the setup."
      />
      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
        <PwaGroup title="General">
          <PwaField label="Title" value={v.title} onChange={(title) => onChange({ ...v, title })} />
          <PwaField
            label="Search placeholder"
            value={v.searchPlaceholder}
            onChange={(searchPlaceholder) => onChange({ ...v, searchPlaceholder })}
          />
          <PwaField
            label="No results (supports {query})"
            value={v.noResults}
            onChange={(noResults) => onChange({ ...v, noResults })}
          />
        </PwaGroup>

        <PwaGroup title="Article feedback">
          <PwaField
            label="Helpful prompt"
            value={v.helpfulPrompt}
            onChange={(helpfulPrompt) => onChange({ ...v, helpfulPrompt })}
          />
          <PwaField
            label="Helpful · Yes"
            value={v.helpfulYes}
            onChange={(helpfulYes) => onChange({ ...v, helpfulYes })}
          />
          <PwaField
            label="Helpful · No"
            value={v.helpfulNo}
            onChange={(helpfulNo) => onChange({ ...v, helpfulNo })}
          />
          <PwaField
            label="Thanks message"
            value={v.thanks}
            onChange={(thanks) => onChange({ ...v, thanks })}
          />
        </PwaGroup>

        <PwaGroup title="Need more help card">
          <PwaField
            label="Title"
            value={v.needMoreTitle}
            onChange={(needMoreTitle) => onChange({ ...v, needMoreTitle })}
          />
          <PwaField
            label="Body"
            value={v.needMoreBody}
            onChange={(needMoreBody) => onChange({ ...v, needMoreBody })}
            multiline
          />
          <PwaField
            label="Contact button"
            value={v.contactCta}
            onChange={(contactCta) => onChange({ ...v, contactCta })}
          />
        </PwaGroup>

        <PwaGroup title="Contact screen">
          <PwaField label="Title" value={c.title} onChange={(title) => setContact({ title })} />
          <PwaField
            label="From label"
            value={c.fromLabel}
            onChange={(fromLabel) => setContact({ fromLabel })}
          />
          <PwaField
            label="From default"
            value={c.fromDefault}
            onChange={(fromDefault) => setContact({ fromDefault })}
          />
          <PwaField
            label="Message placeholder"
            value={c.messagePlaceholder}
            onChange={(messagePlaceholder) => setContact({ messagePlaceholder })}
          />
          <PwaField label="Send button" value={c.send} onChange={(send) => setContact({ send })} />
          <PwaField
            label="Call button"
            value={c.callCta}
            onChange={(callCta) => setContact({ callCta })}
          />
          <PwaField
            label="Success title"
            value={c.successTitle}
            onChange={(successTitle) => setContact({ successTitle })}
          />
          <PwaField
            label="Success body"
            value={c.successBody}
            onChange={(successBody) => setContact({ successBody })}
            multiline
          />
        </PwaGroup>

        <PwaGroup title="FAQ articles">
          {v.articles.length === 0 ? (
            <p className="text-[12px] text-zinc-400 dark:text-zinc-500">No articles yet.</p>
          ) : (
            v.articles.map((a, i) => (
              <div
                key={a.slug}
                className="flex items-start gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <ReorderButtons
                  index={i}
                  count={v.articles.length}
                  onMove={(to) => onChange({ ...v, articles: move(v.articles, i, to) })}
                />
                <div className="flex-1 space-y-2">
                  <PwaField
                    label="Question"
                    value={a.question}
                    onChange={(question) => updateArticle(i, { question })}
                  />
                  <PwaField
                    label="Category"
                    value={a.category}
                    onChange={(category) => updateArticle(i, { category })}
                  />
                  <PwaField
                    label="Answer (supports {client_name})"
                    value={a.answer}
                    onChange={(answer) => updateArticle(i, { answer })}
                    multiline
                  />
                </div>
                <button
                  type="button"
                  aria-label="Remove article"
                  onClick={() => removeArticle(i)}
                  className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800"
                >
                  Remove
                </button>
              </div>
            ))
          )}
          <button
            type="button"
            onClick={addArticle}
            className="w-full rounded-lg border border-dashed border-zinc-300 px-3 py-2 text-[12px] font-medium text-zinc-500 transition hover:border-sky-500/60 hover:text-sky-600 dark:border-zinc-700 dark:text-zinc-400"
          >
            + Add article
          </button>
        </PwaGroup>
      </div>
    </div>
  );
}
