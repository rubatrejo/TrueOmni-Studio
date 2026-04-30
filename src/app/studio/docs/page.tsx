import type { Metadata } from 'next';
import Link from 'next/link';

import { StudioBrand } from '../_components/StudioBrand';
import { ThemeToggle } from '../_components/ThemeToggle';

export const metadata: Metadata = {
  title: 'Documentation · Kiosk Studio',
  description: 'How to use Kiosk Studio: create kiosks, edit branding, publish.',
};

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'quick-start', label: 'Quick start' },
  { id: 'editing', label: 'Editing a kiosk' },
  { id: 'preview', label: 'Live preview' },
  { id: 'publishing', label: 'Publishing & releases' },
  { id: 'versioning', label: 'Versioning & rollback' },
  { id: 'best-practices', label: 'Best practices' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
  { id: 'changelog', label: 'Changelog' },
];

export default function StudioDocsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1280px] flex-col px-8 pb-24 pt-12">
      <header className="mb-16 flex items-center justify-between">
        <StudioBrand />
        <div className="flex items-center gap-3">
          <Link
            href="/studio/docs"
            className="rounded-lg border border-sky-500 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 transition dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-300"
          >
            Documentation
          </Link>
          <ThemeToggle />
          <div className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 text-[11px] font-semibold text-zinc-900">
              R
            </div>
            <span className="text-xs text-zinc-600 dark:text-zinc-400">ruben@trueomni.com</span>
          </div>
        </div>
      </header>

      <section className="mb-12">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">
          Documentation
        </p>
        <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-zinc-900 dark:text-white">
          Everything you need<br />
          to ship a kiosk.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Kiosk Studio is the white-label control panel for the TrueOmni kiosk fleet. This guide
          walks you through creating a kiosk, customizing it, previewing it live, and releasing it
          to the screens in the field.
        </p>
      </section>

      <div className="grid grid-cols-12 gap-12">
        <aside className="col-span-12 lg:col-span-3">
          <nav className="sticky top-8 space-y-1 border-l border-zinc-200 pl-4 text-sm dark:border-zinc-800">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              On this page
            </p>
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block rounded px-2 py-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white"
              >
                {s.label}
              </a>
            ))}
          </nav>
        </aside>

        <article className="col-span-12 max-w-[720px] space-y-16 lg:col-span-9">
          <Section id="overview" title="Overview">
            <P>
              Kiosk Studio is the workspace where your team designs, configures, and ships kiosks
              — without touching code. Every kiosk in your account corresponds to a real device or
              fleet of devices in the field, and changes you make here flow to those screens
              through a controlled release pipeline.
            </P>
            <P>
              The Studio is organized around three ideas: a <Strong>kiosk</Strong> is a branded
              instance of the product; a <Strong>configuration</Strong> is the set of branding,
              modules, content, copy and integrations that defines how that kiosk looks and
              behaves; and a <Strong>release</Strong> is a published version of that
              configuration that the live kiosks pull on their next sync.
            </P>
            <Callout tone="info" title="Mental model">
              Studio = the editor. Configuration = your draft. Release = what the kiosks in the
              field actually run. You can edit forever; nothing reaches a screen until you
              publish.
            </Callout>
          </Section>

          <Section id="quick-start" title="Quick start">
            <Ol>
              <li>
                From the Studio home, click <Strong>New kiosk</Strong> in the top right of the
                kiosks grid.
              </li>
              <li>
                Pick a <Strong>slug</Strong> (lowercase identifier — e.g. <Code>tnt-resort</Code>)
                and a display <Strong>name</Strong> (e.g. <Code>TNT Resort &amp; Spa</Code>). The
                slug is permanent; the name can be changed later.
              </li>
              <li>
                Studio creates the kiosk pre-loaded with sensible defaults so you have something
                that already works. The editor opens with the live preview on the right.
              </li>
              <li>
                Edit any tab on the left. The preview updates in real time so you see your
                changes the moment you make them.
              </li>
              <li>
                When the configuration is ready, hit <Strong>Publish</Strong> in the save bar.
                The release goes through the approval pipeline and lands on the live kiosks
                shortly after.
              </li>
            </Ol>
          </Section>

          <Section id="editing" title="Editing a kiosk">
            <P>
              Open any kiosk card to enter the editor. Tabs are organized left-to-right by what
              changes most often, from foundational to fine-grained:
            </P>
            <Dl
              items={[
                {
                  term: 'Branding',
                  desc: 'Three brand colors (primary, secondary, tertiary), logos and a font family. Branding cascades to every component on the kiosk — change a token and the whole experience reflows in the preview.',
                },
                {
                  term: 'Modules',
                  desc: 'Toggle modules on or off, reorder them on the home grid, and rename their labels. Disabled modules are removed from the kiosk entirely; their content is preserved in case you bring them back.',
                },
                {
                  term: 'Content',
                  desc: 'Manage listings, events, passes, deals, trails, brochures, ads and social wall posts. Each module has a dedicated editor with image upload, rich text, and validation.',
                },
                {
                  term: 'i18n',
                  desc: 'Manage UI strings and content across 6 locales (en, es, fr, de, pt, ja). Optional AI translation accelerates first drafts; a human review pass is still recommended before publishing.',
                },
                {
                  term: 'Integrations',
                  desc: 'Wire weather, mapping, analytics and other external services into the kiosk. Integrations only appear in the kiosk UI when they are properly configured, so partial setups never reach the screen.',
                },
              ]}
            />
            <Callout tone="warn" title="Save vs Publish">
              <Strong>Save</Strong> persists your draft to your account so you can come back to it
              from any browser. <Strong>Publish</Strong> turns that draft into a release that goes
              live on the kiosks. Closing the tab without saving loses unsaved edits — the bar
              warns you when you have pending changes.
            </Callout>
          </Section>

          <Section id="preview" title="Live preview">
            <P>
              The right pane is a real instance of the kiosk rendering your draft configuration.
              It is the same code path that runs on the kiosks in the field, so what you see is
              exactly what your customers will see.
            </P>
            <Ul>
              <li>The preview always renders at 1080×1920 portrait, scaled to fit the pane.</li>
              <li>
                Click any module in the preview and the editor jumps to the corresponding tab when
                a deep-link target is registered — so reviewing a screen and editing it become the
                same gesture.
              </li>
              <li>
                Use <Strong>Open in new tab</Strong> to inspect the kiosk full-screen, share a
                preview link with a stakeholder, or test it on a real device pointed at the
                preview URL.
              </li>
            </Ul>
          </Section>

          <Section id="publishing" title="Publishing & releases">
            <P>
              Publishing turns your draft into a versioned release. Releases are immutable — once
              a version exists, it never changes — which means every kiosk in the field is always
              running a known, named state of your configuration.
            </P>
            <Ol>
              <li>
                Hit <Strong>Publish</Strong> in the save bar. Studio runs validation and shows a
                summary of what will change.
              </li>
              <li>
                The release enters the approval pipeline. Depending on your workspace settings,
                it can go live immediately or wait for a reviewer to sign off.
              </li>
              <li>
                Once approved, the release is distributed to every kiosk associated with that
                slug. Devices pick it up on their next sync — typically within seconds.
              </li>
              <li>
                The release is recorded in the kiosk&apos;s history so you can see who shipped
                what, when, and roll back if anything looks off.
              </li>
            </Ol>
            <Callout tone="info" title="Publishing only changes what you changed">
              Studio writes a surgical update — only the keys you touched are rewritten. Manual
              annotations, custom CSS, or fields the editor doesn&apos;t know about survive every
              publish untouched.
            </Callout>
          </Section>

          <Section id="versioning" title="Versioning & rollback">
            <P>
              Every published release is tagged with an incrementing version number visible on
              the kiosk card (e.g. <Code>v3</Code>) and in the editor header. The current version
              is what the live kiosks are running; previous versions are kept in history.
            </P>
            <Ul>
              <li>
                <Strong>History</Strong> — open the version history from the editor menu to see
                every release, the editor who shipped it, and a diff of what changed.
              </li>
              <li>
                <Strong>Rollback</Strong> — promote any past version back to current with one
                click. The kiosks in the field pick up the rollback on their next sync.
              </li>
              <li>
                <Strong>Pinning</Strong> — a kiosk can be pinned to a specific version for
                staging or QA, while the rest of the fleet keeps tracking current.
              </li>
            </Ul>
            <Callout tone="info" title="Rollbacks are releases too">
              Promoting an old version creates a new release with the old contents, so the
              history stays linear and auditable. You never lose track of what shipped when.
            </Callout>
          </Section>

          <Section id="best-practices" title="Best practices">
            <Dl
              items={[
                {
                  term: 'Draft, then ship',
                  desc: 'Use Save liberally while you experiment. Only Publish when the configuration is review-ready — every release shows up in history.',
                },
                {
                  term: 'One editor at a time',
                  desc: 'Coordinate with your team if multiple people work on the same kiosk. Studio keeps the most recent save, but parallel edits in two tabs can step on each other.',
                },
                {
                  term: 'Translate after structure',
                  desc: 'Lock down modules and content in your primary locale first, then run i18n. Translating a moving target wastes effort — and AI translations diverge fast from a half-finished kiosk.',
                },
                {
                  term: 'Test on a real screen',
                  desc: 'The preview is faithful, but pointing a real device at the preview URL is the only way to catch hardware-specific issues (color calibration, touch responsiveness, network).',
                },
                {
                  term: 'Name releases meaningfully',
                  desc: 'Use the optional release notes field to describe what changed. A line of context turns the history view from a wall of versions into a real audit trail.',
                },
              ]}
            />
          </Section>

          <Section id="troubleshooting" title="Troubleshooting">
            <Dl
              items={[
                {
                  term: 'The preview is blank',
                  desc: 'Reload the editor. If it stays blank, your draft may have an invalid value the kiosk can’t render — the save bar shows the offending field. Save bypasses validation; Publish does not.',
                },
                {
                  term: 'My changes are not on the kiosks',
                  desc: 'Saving keeps the draft in your account but does not push to the field. You need to Publish, and the release needs to be approved if your workspace requires review.',
                },
                {
                  term: 'A kiosk in the field is on an older version',
                  desc: 'Check whether it is pinned to a specific version under its device settings. Unpinned kiosks always track the latest published release.',
                },
                {
                  term: 'New kiosk fails to create',
                  desc: 'Check the slug is unique and lowercase. Studio refuses slugs that already exist in your workspace, and slugs cannot contain spaces or special characters.',
                },
                {
                  term: 'I lost my work',
                  desc: 'Drafts auto-save every few seconds. If you closed a tab with unsaved edits, open the kiosk again — the most recent save is restored automatically. If you published over your work, use Rollback in the version history.',
                },
              ]}
            />
          </Section>

          <Section id="changelog" title="Changelog">
            <P>
              What&apos;s shipped in Studio itself. The kiosk product has its own release stream;
              this section tracks updates to the editor and platform you&apos;re using right now.
            </P>
            <ChangelogEntry
              version="v0.1.0"
              date="April 29, 2026"
              tag="latest"
              items={[
                'Filesystem bootstrap — Studio now reflects the live state of every kiosk on load, instead of starting from the template.',
                'Surgical publish — only the keys you changed are rewritten, preserving manual annotations in the kiosk configuration.',
                'Validation guards on publish — invalid configurations are caught before they reach a kiosk.',
              ]}
            />
            <ChangelogEntry
              version="v0.0.9"
              date="April 28, 2026"
              items={[
                'i18n editor — manage 6 locales (en, es, fr, de, pt, ja) from a single tab.',
                'Optional AI translation for first-draft localization.',
                'iOS-style on-screen keyboard for kiosks deployed without hardware keyboards.',
              ]}
            />
            <ChangelogEntry
              version="v0.0.8"
              date="April 27, 2026"
              items={[
                'Itinerary Builder module — favorites rail, AI wizard, share via QR / email / phone.',
                'Photo Booth module — green-screen capture with stickers, drag-and-drop editor, share flow.',
              ]}
            />
            <ChangelogEntry
              version="v0.0.7"
              date="April 23, 2026"
              items={[
                'Ask AI floating avatar — typewriter responses, voice input, configurable per kiosk.',
                'Trails module with map tabs and considerations.',
                'Guestbook module with globe zoom and drag-and-drop comments.',
              ]}
            />
            <ChangelogEntry
              version="v0.0.6"
              date="April 22, 2026"
              items={[
                'Tickets, Passes and Deals modules.',
                'Survey overlay with 8 design variants.',
              ]}
            />
            <ChangelogEntry
              version="v0.0.1"
              date="April 19, 2026"
              items={[
                'Studio launches in private preview.',
                'Branding, Modules and Content tabs available; live preview wired end-to-end.',
              ]}
            />
          </Section>
        </article>
      </div>

      <footer className="mt-24 flex items-center justify-between border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-900 dark:text-zinc-600">
        <span>© 2026 TrueOmni · Kiosk Studio</span>
        <Link
          href="/studio"
          className="text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
        >
          ← Back to Studio
        </Link>
      </footer>
    </main>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Building blocks (local — keep this file self-contained)                    */
/* ────────────────────────────────────────────────────────────────────────── */

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="font-display text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
        {title}
      </h2>
      <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
        {children}
      </div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

function Strong({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-zinc-900 dark:text-white">{children}</strong>;
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-[13px] text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
      {children}
    </code>
  );
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-2 pl-5 marker:text-zinc-400">{children}</ul>;
}

function Ol({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal space-y-2 pl-5 marker:text-zinc-400">{children}</ol>;
}

function Dl({ items }: { items: Array<{ term: string; desc: string }> }) {
  return (
    <dl className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {items.map((it) => (
        <div
          key={it.term}
          className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[160px_1fr] sm:gap-4"
        >
          <dt className="font-medium text-zinc-900 dark:text-white">{it.term}</dt>
          <dd className="text-zinc-600 dark:text-zinc-400">{it.desc}</dd>
        </div>
      ))}
    </dl>
  );
}

function Callout({
  tone,
  title,
  children,
}: {
  tone: 'info' | 'warn';
  title: string;
  children: React.ReactNode;
}) {
  const styles =
    tone === 'info'
      ? 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/5 dark:text-sky-100'
      : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/5 dark:text-amber-100';
  return (
    <div className={`rounded-xl border p-4 text-[14px] leading-relaxed ${styles}`}>
      <p className="mb-1 font-semibold">{title}</p>
      <div className="opacity-90">{children}</div>
    </div>
  );
}

function ChangelogEntry({
  version,
  date,
  items,
  tag,
}: {
  version: string;
  date: string;
  items: string[];
  tag?: 'latest';
}) {
  return (
    <div className="relative border-l-2 border-zinc-200 pl-6 dark:border-zinc-800">
      <div className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-zinc-300 dark:border-zinc-950 dark:bg-zinc-600" />
      <div className="mb-2 flex flex-wrap items-baseline gap-3">
        <h3 className="font-mono text-[15px] font-semibold text-zinc-900 dark:text-white">
          {version}
        </h3>
        {tag === 'latest' && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
            Latest
          </span>
        )}
        <span className="text-[12.5px] text-zinc-500">{date}</span>
      </div>
      <ul className="list-disc space-y-1.5 pl-5 text-[14.5px] marker:text-zinc-400">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
