/**
 * Import helpers — parseo CSV/JSON + coerción a schemas zod de los 4 catálogos
 * que soportan bulk import (Listings / Events / Passes / Trails).
 *
 * Puro. Sin React. Sin imports de cliente. Lo consumen el ImportModal y los
 * editores.
 */

import {
  EventItemSchema,
  ListingItemSchema,
  PassItemSchema,
  TrailItemSchema,
  type EventItem,
  type ListingItem,
  type PassItem,
  type TrailItem,
} from '@/lib/studio/schema';

export type ImportKind = 'listings' | 'events' | 'passes' | 'trails';
export type ImportMode = 'merge' | 'replace';

export interface ImportRowError {
  /** 1-based; 0 = error global. */
  row: number;
  message: string;
}

export type ImportItem<K extends ImportKind> = K extends 'listings'
  ? ListingItem
  : K extends 'events'
    ? EventItem
    : K extends 'passes'
      ? PassItem
      : K extends 'trails'
        ? TrailItem
        : never;

export interface ImportStats {
  added: number;
  updated: number;
  skipped: number;
  errors: number;
  total: number;
}

export interface ImportResult<K extends ImportKind> {
  /** Items zod-válidos listos para mergear/replazar. */
  items: ImportItem<K>[];
  /** Errores por fila (1-based). */
  errors: ImportRowError[];
  /** Resumen para el modal y toast. */
  stats: ImportStats;
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  CSV parser — RFC 4180 mínimo                                            */
/* ──────────────────────────────────────────────────────────────────────── */

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

export function parseCsv(text: string): ParsedCsv {
  const normalized = text.replace(/^﻿/, '');
  const records: string[][] = [];
  let current: string[] = [];
  let cell = '';
  let i = 0;
  let inQuotes = false;

  while (i < normalized.length) {
    const ch = normalized[i];

    if (inQuotes) {
      if (ch === '"') {
        if (normalized[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cell += ch;
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === ',') {
      current.push(cell);
      cell = '';
      i++;
      continue;
    }
    if (ch === '\r') {
      // swallow — \r\n se trata como \n
      i++;
      continue;
    }
    if (ch === '\n') {
      current.push(cell);
      records.push(current);
      current = [];
      cell = '';
      i++;
      continue;
    }
    cell += ch;
    i++;
  }

  // último cell/row sin newline final
  if (cell.length > 0 || current.length > 0) {
    current.push(cell);
    records.push(current);
  }

  // descartar filas completamente vacías
  const filtered = records.filter((r) => r.some((c) => c.trim().length > 0));
  if (filtered.length === 0) return { headers: [], rows: [] };

  const headers = filtered[0].map((h) => h.trim());
  const rows: Record<string, string>[] = [];
  for (let r = 1; r < filtered.length; r++) {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (filtered[r][idx] ?? '').trim();
    });
    rows.push(obj);
  }
  return { headers, rows };
}

export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Invalid JSON: ${msg}`);
  }
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Coercers                                                                */
/* ──────────────────────────────────────────────────────────────────────── */

const TRUE_TOKENS = new Set(['true', '1', 'yes', 'y', 'on']);
const FALSE_TOKENS = new Set(['false', '0', 'no', 'n', 'off']);

function coerceString(raw: string): string {
  return raw;
}

function coerceNumber(raw: string): number | undefined {
  const trimmed = raw.trim();
  if (trimmed === '') return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : undefined;
}

function coerceBool(raw: string): boolean | undefined {
  const v = raw.trim().toLowerCase();
  if (v === '') return undefined;
  if (TRUE_TOKENS.has(v)) return true;
  if (FALSE_TOKENS.has(v)) return false;
  return undefined;
}

function coerceArray(raw: string): string[] {
  if (!raw.trim()) return [];
  return raw
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function coerceCoords(raw: string): { lat: number; lng: number } | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const parts = trimmed.split(',').map((s) => s.trim());
  if (parts.length !== 2) return undefined;
  const lat = Number(parts[0]);
  const lng = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return undefined;
  return { lat, lng };
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Per-kind specs                                                          */
/* ──────────────────────────────────────────────────────────────────────── */

interface FieldSpec {
  /** Path con notación a.b para nested. */
  path: string;
  coerce: 'string' | 'number' | 'bool' | 'array' | 'coords';
}

type CsvSpec = Record<string, FieldSpec>;

const LISTINGS_SPEC: CsvSpec = {
  slug: { path: 'slug', coerce: 'string' },
  title: { path: 'title', coerce: 'string' },
  subcategory: { path: 'subcategory', coerce: 'string' },
  image: { path: 'image', coerce: 'string' },
  hours: { path: 'hours', coerce: 'string' },
  priceRange: { path: 'priceRange', coerce: 'number' },
  features: { path: 'features', coerce: 'array' },
  popularity: { path: 'popularity', coerce: 'number' },
  address: { path: 'address', coerce: 'string' },
  phone: { path: 'phone', coerce: 'string' },
  coords: { path: 'coords', coerce: 'coords' },
  website: { path: 'website', coerce: 'string' },
  reserveUrl: { path: 'reserveUrl', coerce: 'string' },
  description: { path: 'description', coerce: 'string' },
};

const EVENTS_SPEC: CsvSpec = {
  slug: { path: 'slug', coerce: 'string' },
  title: { path: 'title', coerce: 'string' },
  category: { path: 'category', coerce: 'string' },
  image: { path: 'image', coerce: 'string' },
  date: { path: 'date', coerce: 'string' },
  startTime: { path: 'startTime', coerce: 'string' },
  endTime: { path: 'endTime', coerce: 'string' },
  venue: { path: 'venue', coerce: 'string' },
  priceMode: { path: 'priceMode', coerce: 'string' },
  priceBand: { path: 'priceBand', coerce: 'number' },
  features: { path: 'features', coerce: 'array' },
  popularity: { path: 'popularity', coerce: 'number' },
  address: { path: 'address', coerce: 'string' },
  phone: { path: 'phone', coerce: 'string' },
  coords: { path: 'coords', coerce: 'coords' },
  website: { path: 'website', coerce: 'string' },
  ticketsUrl: { path: 'ticketsUrl', coerce: 'string' },
  description: { path: 'description', coerce: 'string' },
};

const PASSES_SPEC: CsvSpec = {
  slug: { path: 'slug', coerce: 'string' },
  title: { path: 'title', coerce: 'string' },
  cover: { path: 'cover', coerce: 'string' },
  bandwangoUrl: { path: 'bandwangoUrl', coerce: 'string' },
  tagline: { path: 'tagline', coerce: 'string' },
};

const TRAILS_SPEC: CsvSpec = {
  slug: { path: 'slug', coerce: 'string' },
  title: { path: 'title', coerce: 'string' },
  subcategory: { path: 'subcategory', coerce: 'string' },
  image: { path: 'image', coerce: 'string' },
  hours: { path: 'hours', coerce: 'string' },
  features: { path: 'features', coerce: 'array' },
  popularity: { path: 'popularity', coerce: 'number' },
  address: { path: 'address', coerce: 'string' },
  phone: { path: 'phone', coerce: 'string' },
  coords: { path: 'coords', coerce: 'coords' },
  website: { path: 'website', coerce: 'string' },
  description: { path: 'description', coerce: 'string' },
  distance: { path: 'considerations.distance', coerce: 'string' },
  difficulty: { path: 'considerations.difficulty', coerce: 'string' },
  duration: { path: 'considerations.duration', coerce: 'string' },
  elevationGain: { path: 'considerations.elevationGain', coerce: 'string' },
  trailType: { path: 'considerations.trailType', coerce: 'string' },
  dogFriendly: { path: 'considerations.dogFriendly', coerce: 'bool' },
};

const SPECS: Record<ImportKind, CsvSpec> = {
  listings: LISTINGS_SPEC,
  events: EVENTS_SPEC,
  passes: PASSES_SPEC,
  trails: TRAILS_SPEC,
};

const SCHEMAS = {
  listings: ListingItemSchema,
  events: EventItemSchema,
  passes: PassItemSchema,
  trails: TrailItemSchema,
} as const;

/* ──────────────────────────────────────────────────────────────────────── */
/*  Object-builder + coerce de una row CSV                                  */
/* ──────────────────────────────────────────────────────────────────────── */

function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let cursor: Record<string, unknown> = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const existing = cursor[key];
    if (
      existing === undefined ||
      existing === null ||
      typeof existing !== 'object' ||
      Array.isArray(existing)
    ) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]] = value;
}

function applyCsvSpec(spec: CsvSpec, row: Record<string, string>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [col, def] of Object.entries(spec)) {
    if (!(col in row)) continue;
    const raw = row[col];
    if (raw === undefined) continue;
    let value: unknown;
    switch (def.coerce) {
      case 'string': {
        const s = coerceString(raw);
        if (s === '') continue; // deja default
        value = s;
        break;
      }
      case 'number': {
        const n = coerceNumber(raw);
        if (n === undefined) continue;
        value = n;
        break;
      }
      case 'bool': {
        const b = coerceBool(raw);
        if (b === undefined) continue;
        value = b;
        break;
      }
      case 'array': {
        value = coerceArray(raw);
        break;
      }
      case 'coords': {
        const c = coerceCoords(raw);
        if (c === undefined) continue;
        value = c;
        break;
      }
    }
    setPath(out, def.path, value);
  }
  return out;
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Coerce + validate de un objeto plano (CSV ya aplicado, o JSON)          */
/* ──────────────────────────────────────────────────────────────────────── */

export type CoerceResult<K extends ImportKind> =
  | { ok: true; item: ImportItem<K> }
  | { ok: false; errors: string[] };

export function coerceCatalogRow<K extends ImportKind>(
  kind: K,
  raw: Record<string, unknown>,
): CoerceResult<K> {
  const schema = SCHEMAS[kind];

  // auto-slug si falta
  if ((!raw.slug || raw.slug === '') && typeof raw.title === 'string' && raw.title.trim() !== '') {
    const candidate = slugify(raw.title);
    if (candidate) raw.slug = candidate;
  }

  const parsed = schema.safeParse(raw);
  if (parsed.success) {
    return { ok: true, item: parsed.data as ImportItem<K> };
  }

  const errors = parsed.error.issues.map((iss) => {
    const path = iss.path.length > 0 ? iss.path.join('.') : '(root)';
    return `${path}: ${iss.message}`;
  });
  return { ok: false, errors };
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  normalizeImport — pipeline completo                                     */
/* ──────────────────────────────────────────────────────────────────────── */

export interface NormalizeOptions<K extends ImportKind> {
  kind: K;
  /** Texto original del archivo. */
  text: string;
  /** Detección por extensión + content sniff. */
  format: 'csv' | 'json';
  mode: ImportMode;
  /** Items existentes en el editor. Solo se usa para stats added/updated. */
  existing: ImportItem<K>[];
}

export function normalizeImport<K extends ImportKind>(
  opts: NormalizeOptions<K>,
): ImportResult<K> {
  const { kind, text, format, existing } = opts;
  const errors: ImportRowError[] = [];
  const items: ImportItem<K>[] = [];

  if (format === 'csv') {
    let parsed: ParsedCsv;
    try {
      parsed = parseCsv(text);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ row: 0, message: `CSV parse error: ${msg}` });
      return emptyResult(errors);
    }
    if (parsed.headers.length === 0) {
      errors.push({ row: 0, message: 'CSV is empty.' });
      return emptyResult(errors);
    }
    const spec = SPECS[kind];
    parsed.rows.forEach((row, idx) => {
      const obj = applyCsvSpec(spec, row);
      const res = coerceCatalogRow(kind, obj);
      if (res.ok) {
        items.push(res.item);
      } else {
        res.errors.forEach((m) => errors.push({ row: idx + 2, message: m }));
      }
    });
  } else {
    let raw: unknown;
    try {
      raw = parseJson(text);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push({ row: 0, message: msg });
      return emptyResult(errors);
    }
    const arr = extractJsonArray(raw, kind);
    if (!arr) {
      errors.push({
        row: 0,
        message: `JSON must be an array or contain a "${kind}" array.`,
      });
      return emptyResult(errors);
    }
    arr.forEach((entry, idx) => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        errors.push({ row: idx + 1, message: 'Entry must be an object.' });
        return;
      }
      const res = coerceCatalogRow(kind, { ...(entry as Record<string, unknown>) });
      if (res.ok) {
        items.push(res.item);
      } else {
        res.errors.forEach((m) => errors.push({ row: idx + 1, message: m }));
      }
    });
  }

  // dedupe por slug dentro del payload (último gana)
  const dedupedMap = new Map<string, ImportItem<K>>();
  for (const it of items) {
    const slug = (it as { slug: string }).slug;
    dedupedMap.set(slug, it);
  }
  const deduped = Array.from(dedupedMap.values());

  const existingSlugs = new Set(existing.map((i) => (i as { slug: string }).slug));
  let added = 0;
  let updated = 0;
  for (const it of deduped) {
    const slug = (it as { slug: string }).slug;
    if (existingSlugs.has(slug)) updated++;
    else added++;
  }

  return {
    items: deduped,
    errors,
    stats: {
      added,
      updated,
      skipped: items.length - deduped.length,
      errors: errors.length,
      total: deduped.length,
    },
  };
}

function emptyResult<K extends ImportKind>(errors: ImportRowError[]): ImportResult<K> {
  return {
    items: [],
    errors,
    stats: {
      added: 0,
      updated: 0,
      skipped: 0,
      errors: errors.length,
      total: 0,
    },
  };
}

function extractJsonArray(raw: unknown, kind: ImportKind): unknown[] | null {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj[kind])) return obj[kind] as unknown[];
    // formatos comunes de export del Studio
    if (kind === 'listings' && obj.catalog && typeof obj.catalog === 'object') {
      const cat = obj.catalog as Record<string, unknown>;
      if (Array.isArray(cat.listings)) return cat.listings as unknown[];
    }
    if (Array.isArray(obj.items)) return obj.items as unknown[];
  }
  return null;
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Detección de formato                                                    */
/* ──────────────────────────────────────────────────────────────────────── */

export function detectFormat(filename: string, text: string): 'csv' | 'json' {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.csv')) return 'csv';
  const trimmed = text.trimStart();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  return 'csv';
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Headers de ejemplo (para mostrar en el modal)                           */
/* ──────────────────────────────────────────────────────────────────────── */

export function csvTemplateFor(kind: ImportKind): string {
  return Object.keys(SPECS[kind]).join(',');
}

/* ──────────────────────────────────────────────────────────────────────── */
/*  Serialización (export desde el editor)                                  */
/* ──────────────────────────────────────────────────────────────────────── */

function getPath(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let cursor: unknown = obj;
  for (const part of parts) {
    if (cursor === null || cursor === undefined || typeof cursor !== 'object') {
      return undefined;
    }
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor;
}

function escapeCsvCell(raw: string): string {
  if (raw === '') return '';
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

function serializeValue(value: unknown, coerce: FieldSpec['coerce']): string {
  if (value === null || value === undefined) return '';
  switch (coerce) {
    case 'string':
      return String(value);
    case 'number':
      return typeof value === 'number' ? String(value) : '';
    case 'bool':
      return value === true ? 'true' : value === false ? 'false' : '';
    case 'array':
      return Array.isArray(value)
        ? (value as unknown[]).filter((v) => typeof v === 'string').join(';')
        : '';
    case 'coords': {
      if (
        value &&
        typeof value === 'object' &&
        'lat' in value &&
        'lng' in value &&
        typeof (value as { lat: unknown }).lat === 'number' &&
        typeof (value as { lng: unknown }).lng === 'number'
      ) {
        return `${(value as { lat: number }).lat},${(value as { lng: number }).lng}`;
      }
      return '';
    }
  }
}

export function serializeCsv<K extends ImportKind>(
  kind: K,
  items: ImportItem<K>[],
): string {
  const spec = SPECS[kind];
  const cols = Object.keys(spec);
  const lines: string[] = [cols.join(',')];
  for (const item of items) {
    const cells = cols.map((col) => {
      const def = spec[col];
      const raw = getPath(item, def.path);
      return escapeCsvCell(serializeValue(raw, def.coerce));
    });
    lines.push(cells.join(','));
  }
  return lines.join('\n') + '\n';
}

export function serializeJson<K extends ImportKind>(
  kind: K,
  items: ImportItem<K>[],
): string {
  return JSON.stringify({ [kind]: items }, null, 2) + '\n';
}

export function serializeCatalog<K extends ImportKind>(
  kind: K,
  items: ImportItem<K>[],
  format: 'csv' | 'json',
): string {
  return format === 'csv' ? serializeCsv(kind, items) : serializeJson(kind, items);
}
