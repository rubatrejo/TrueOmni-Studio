#!/usr/bin/env node
// One-shot: desplaza las fechas de events para que el min coincida con hoy.
// Mantiene el orden relativo y la distribución; reescribe los config.json.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TODAY = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const FILES = [
  'clients/default/config.json',
  'clients/_template/config.json',
  'clients/demo-cliente-a/config.json',
];

function addDays(iso, days) {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function diffDays(a, b) {
  const ms = new Date(a + 'T00:00:00Z') - new Date(b + 'T00:00:00Z');
  return Math.round(ms / 86400000);
}

for (const rel of FILES) {
  const path = resolve(rel);
  const raw = readFileSync(path, 'utf8');
  const cfg = JSON.parse(raw);
  const events = cfg?.features?.home?.modules?.events?.events;
  if (!Array.isArray(events) || events.length === 0) {
    console.log(`[skip] ${rel}: no events`);
    continue;
  }
  const dates = events.map((e) => e.date).filter(Boolean).sort();
  const minDate = dates[0];
  const shift = diffDays(TODAY, minDate);
  let changed = 0;
  for (const e of events) {
    if (typeof e.date === 'string') {
      e.date = addDays(e.date, shift);
      changed++;
    }
  }
  writeFileSync(path, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
  console.log(
    `[ok]   ${rel}: ${changed} dates shifted ${shift >= 0 ? '+' : ''}${shift}d (min ${minDate} → ${TODAY})`,
  );
}
