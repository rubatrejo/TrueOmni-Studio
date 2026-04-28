#!/usr/bin/env node
// One-shot: re-fecha N events ticketables a hoy y mantiene el resto en futuro.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const TODAY = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const N = Number(process.argv[3] ?? 9);
const FILE = 'clients/default/config.json';

const path = resolve(FILE);
const cfg = JSON.parse(readFileSync(path, 'utf8'));
const events = cfg.features.home.modules.events.events;
const ticketables = events.filter((e) => e.ticket);

let touched = 0;
for (let i = 0; i < Math.min(N, ticketables.length); i++) {
  ticketables[i].date = TODAY;
  touched++;
}
writeFileSync(path, JSON.stringify(cfg, null, 2) + '\n', 'utf8');

const counts = {};
for (const t of ticketables) counts[t.date] = (counts[t.date] || 0) + 1;
console.log(`[ok] ${FILE}: ${touched} tickets re-fechados a ${TODAY}`);
console.log(`Total ticketables: ${ticketables.length}`);
console.log('Distribución:');
for (const [d, c] of Object.entries(counts).sort()) {
  console.log(`  ${d} x${c}${d === TODAY ? ' <-- TODAY' : ''}`);
}
