'use client';

import type { SignageClientResolved } from '@/lib/signage/schema';

/**
 * Tab `Branding` — read-only en DSS1.
 *
 * Muestra `client.branding`:
 *  - Logos (default + dark si existe).
 *  - Fonts (default + display).
 *  - Tokens overrides (record key→HSL).
 *
 * En DSS5+ esta tab se reemplaza por el editor visual (color picker, font
 * selector, file upload) usando primitivas Field/TextInput del Studio.
 */
export interface BrandingTabProps {
  client: SignageClientResolved;
  tokensCss: string;
}

export function BrandingTab({ client, tokensCss }: BrandingTabProps) {
  const logos = client.branding.logos;
  const fonts = client.branding.fonts;
  const tokens = client.branding.tokens ?? {};
  const tokenEntries = Object.entries(tokens);

  return (
    <div className="flex flex-col gap-8">
      <Section title="Logos" subtitle="Asset paths relative to the theme folder">
        <DataRow label="Default" value={<code className="font-mono text-[12px]">{logos.default}</code>} />
        {logos.dark ? (
          <DataRow label="Dark" value={<code className="font-mono text-[12px]">{logos.dark}</code>} />
        ) : (
          <DataRow label="Dark" value={<EmptyHint>not configured</EmptyHint>} />
        )}
      </Section>

      <Section title="Fonts">
        <DataRow label="Default" value={<code className="font-mono text-[12px]">{fonts.default}</code>} />
        {fonts.display ? (
          <DataRow label="Display" value={<code className="font-mono text-[12px]">{fonts.display}</code>} />
        ) : (
          <DataRow label="Display" value={<EmptyHint>not configured</EmptyHint>} />
        )}
      </Section>

      <Section
        title="Token overrides"
        subtitle={`${tokenEntries.length} override${tokenEntries.length === 1 ? '' : 's'} on top of base tokens`}
      >
        {tokenEntries.length === 0 ? (
          <EmptyHint>No overrides — using base tokens.css</EmptyHint>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="text-left text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="pb-2 pr-4">Token</th>
                <th className="pb-2">Value (HSL)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {tokenEntries.map(([key, value]) => (
                <tr key={key}>
                  <td className="py-2 pr-4 font-mono text-[12px] text-zinc-700 dark:text-zinc-300">
                    --signage-{key}
                  </td>
                  <td className="py-2 font-mono text-[12px] text-zinc-700 dark:text-zinc-300">
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      <Section
        title="Base tokens.css"
        subtitle={`Resolved from clients-signage/${client.slug}/tokens.css`}
      >
        {tokensCss ? (
          <pre className="max-h-64 overflow-auto rounded-md bg-zinc-50 p-3 font-mono text-[11.5px] leading-relaxed text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {tokensCss}
          </pre>
        ) : (
          <EmptyHint>tokens.css not found for this theme</EmptyHint>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <header>
        <h3 className="font-display text-[15px] font-semibold text-zinc-900 dark:text-white">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-0.5 text-[12px] text-zinc-500">{subtitle}</p>
        ) : null}
      </header>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function DataRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-2 text-[13px] last:border-0 last:pb-0 dark:border-zinc-900">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right text-zinc-800 dark:text-zinc-200">{value}</span>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <span className="text-[12px] italic text-zinc-400">{children}</span>;
}
