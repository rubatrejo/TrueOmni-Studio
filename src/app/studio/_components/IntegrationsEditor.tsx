'use client';

import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  CloudSun,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Map,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  WEATHER_PROVIDERS,
  WEATHER_UNITS,
  type IntegrationsConfig,
  type WeatherProvider,
  type WeatherUnits,
} from '@/lib/studio/schema';

import { checkIntegration } from '../_lib/api-client';

interface IntegrationsEditorProps {
  value: IntegrationsConfig;
  onChange: (next: IntegrationsConfig) => void;
}

export function IntegrationsEditor({ value, onChange }: IntegrationsEditorProps) {
  const update = (patch: Partial<IntegrationsConfig>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3">
      <WeatherCard
        config={value.weather}
        onChange={(next) => update({ weather: next })}
      />
      <ApiCard
        baseUrl={value.api.baseUrl}
        onChange={(next) => update({ api: { baseUrl: next } })}
      />
      <MapboxCard
        token={value.mapbox.token}
        onChange={(next) => update({ mapbox: { token: next } })}
      />
      <AnalyticsCard
        gaId={value.analytics.gaId}
        onChange={(next) => update({ analytics: { gaId: next } })}
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Cards                                                                   */
/* ──────────────────────────────────────────────────────────────────────── */

function WeatherCard({
  config,
  onChange,
}: {
  config: IntegrationsConfig['weather'];
  onChange: (next: IntegrationsConfig['weather']) => void;
}) {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [testing, setTesting] = useState(false);

  const update = (patch: Partial<IntegrationsConfig['weather']>) =>
    onChange({ ...config, ...patch });

  const canTest =
    config.provider === 'openweather' && !!config.apiKey && !!config.city;

  const handleTest = async () => {
    setTesting(true);
    try {
      const r = await checkIntegration({
        kind: 'openweather',
        apiKey: config.apiKey,
        city: config.city,
        units: config.units,
      });
      setResult(r);
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card icon={<CloudSun className="h-4 w-4" />} title="Weather" subtitle="Powers the weather widget on idle/billboard.">
      <Field label="Provider">
        <div className="flex gap-2">
          {WEATHER_PROVIDERS.map((p) => (
            <ProviderRadio
              key={p}
              checked={config.provider === p}
              label={p === 'open-meteo' ? 'Open-Meteo (no key)' : 'OpenWeather (API key)'}
              onChange={() => update({ provider: p as WeatherProvider })}
            />
          ))}
        </div>
      </Field>

      {config.provider === 'openweather' ? (
        <>
          <Field label="API key" hint="Get one at openweathermap.org/api.">
            <SecretInput
              value={config.apiKey}
              onChange={(v) => update({ apiKey: v })}
              placeholder="abc123…"
            />
          </Field>
          <Field label="City" hint="City name + optional country code, e.g. 'Phoenix, US'.">
            <input
              type="text"
              value={config.city}
              onChange={(e) => update({ city: e.target.value })}
              placeholder="e.g. Phoenix, US"
              className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-[12px] text-zinc-900 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
          </Field>
          <Field label="Units">
            <div className="flex gap-2">
              {WEATHER_UNITS.map((u) => (
                <ProviderRadio
                  key={u}
                  checked={config.units === u}
                  label={u === 'metric' ? 'Metric (°C, m/s)' : 'Imperial (°F, mph)'}
                  onChange={() => update({ units: u as WeatherUnits })}
                />
              ))}
            </div>
          </Field>
          <TestRow
            disabled={!canTest}
            testing={testing}
            result={result}
            onTest={handleTest}
            onDismiss={() => setResult(null)}
          />
        </>
      ) : (
        <p className="text-[11.5px] text-zinc-500 dark:text-zinc-500">
          Open-Meteo doesn&apos;t need an API key — coords come from{' '}
          <span className="font-mono text-[11px]">cliente.coords</span> and the widget works
          out of the box.
        </p>
      )}
    </Card>
  );
}

function ApiCard({
  baseUrl,
  onChange,
}: {
  baseUrl: string;
  onChange: (next: string) => void;
}) {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      const r = await checkIntegration({ kind: 'api', baseUrl });
      setResult(r);
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card
      icon={<Globe className="h-4 w-4" />}
      title="External API"
      subtitle="Base URL for client-side fetches (events, weather proxy, etc)."
    >
      <Field label="Base URL">
        <input
          type="url"
          value={baseUrl}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://api.example.com"
          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[12px] text-zinc-900 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </Field>
      <TestRow
        disabled={!baseUrl.trim()}
        testing={testing}
        result={result}
        onTest={handleTest}
        onDismiss={() => setResult(null)}
      />
    </Card>
  );
}

function MapboxCard({
  token,
  onChange,
}: {
  token: string;
  onChange: (next: string) => void;
}) {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      const r = await checkIntegration({ kind: 'mapbox', token });
      setResult(r);
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card
      icon={<Map className="h-4 w-4" />}
      title="Mapbox"
      subtitle="Public token for the maps in listings, trails and itinerary."
    >
      <Field label="Public token" hint="Starts with pk.eyJ… — never paste a secret token here.">
        <SecretInput value={token} onChange={onChange} placeholder="pk.eyJ…" />
      </Field>
      <TestRow
        disabled={!token.trim()}
        testing={testing}
        result={result}
        onTest={handleTest}
        onDismiss={() => setResult(null)}
      />
    </Card>
  );
}

function AnalyticsCard({
  gaId,
  onChange,
}: {
  gaId: string;
  onChange: (next: string) => void;
}) {
  const [result, setResult] = useState<CheckResult | null>(null);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      const r = await checkIntegration({ kind: 'analytics', gaId });
      setResult(r);
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Failed' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card
      icon={<BarChart3 className="h-4 w-4" />}
      title="Google Analytics"
      subtitle="Tracking ID for kiosk telemetry."
    >
      <Field label="Tracking ID" hint="GA4 (G-XXXXXXX) or Universal Analytics (UA-XXXXX-X).">
        <input
          type="text"
          value={gaId}
          onChange={(e) => onChange(e.target.value)}
          placeholder="G-XXXXXXX"
          className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-[12px] text-zinc-900 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
        />
      </Field>
      <TestRow
        disabled={!gaId.trim()}
        testing={testing}
        result={result}
        onTest={handleTest}
        onDismiss={() => setResult(null)}
      />
    </Card>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Primitives                                                              */
/* ──────────────────────────────────────────────────────────────────────── */

interface CheckResult {
  ok: boolean;
  message: string;
}

function Card({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/30">
      <header className="flex items-start gap-2.5">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[13px] font-semibold text-zinc-900 dark:text-white">
            {title}
          </h3>
          <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-500">
            {subtitle}
          </p>
        </div>
      </header>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[11.5px] font-semibold text-zinc-700 dark:text-zinc-300">
        {label}
      </label>
      {children}
      {hint ? (
        <p className="text-[10.5px] leading-snug text-zinc-500 dark:text-zinc-500">{hint}</p>
      ) : null}
    </div>
  );
}

function ProviderRadio({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label
      className={`flex flex-1 cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11.5px] transition ${
        checked
          ? 'border-sky-400 bg-sky-50 text-sky-800 dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-200'
          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300 dark:hover:border-zinc-700'
      }`}
    >
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        className="h-3 w-3 accent-sky-600"
      />
      <span>{label}</span>
    </label>
  );
}

function SecretInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
}) {
  const [reveal, setReveal] = useState(false);
  return (
    <div className="relative">
      <input
        type={reveal ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 pr-9 font-mono text-[12px] text-zinc-900 focus:border-sky-500/60 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
      />
      <button
        type="button"
        onClick={() => setReveal((v) => !v)}
        aria-label={reveal ? 'Hide token' : 'Show token'}
        className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
      >
        {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

function TestRow({
  disabled,
  testing,
  result,
  onTest,
  onDismiss,
}: {
  disabled: boolean;
  testing: boolean;
  result: CheckResult | null;
  onTest: () => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(onDismiss, 8000);
    return () => clearTimeout(t);
  }, [result, onDismiss]);

  return (
    <div className="flex items-start gap-2">
      <button
        type="button"
        disabled={disabled || testing}
        onClick={onTest}
        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
      >
        {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
        {testing ? 'Testing…' : 'Test'}
      </button>
      {result ? (
        <div
          role="status"
          className={`flex flex-1 items-start gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] ${
            result.ok
              ? 'border-emerald-200 bg-emerald-50/70 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-200'
              : 'border-red-200 bg-red-50/70 text-red-800 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-200'
          }`}
        >
          {result.ok ? (
            <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          )}
          <span className="flex-1">{result.message}</span>
        </div>
      ) : null}
    </div>
  );
}
