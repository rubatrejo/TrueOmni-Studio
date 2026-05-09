/**
 * Guestbook backend — endpoints públicos del runtime del kiosk.
 *
 * Reemplaza el sessionStorage local por persistencia real en Vercel KV
 * (cierra TODO viejo de Fase 5+ del proyecto: "Backend real para Guestbook").
 *
 *   GET  /api/guestbook/{slug} → { pins: GuestbookUserPin[] }
 *   POST /api/guestbook/{slug} body: { pin } → { ok: true, count }
 *
 * Sin auth — el kiosk es público y supervisado físicamente; el throttle
 * es a nivel storage (cap 1000 pins per kiosk con FIFO drop) y validación
 * de shape via Zod.
 *
 * Si KV no está configurado (env vars KV_REST_API_*), el endpoint cae al
 * in-memory KV del kiosk dev local. En Vercel siempre usa Upstash.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { kv } from '@/lib/studio/kv';

const MAX_PINS_PER_SLUG = 1000;
const MAX_COMMENT_LENGTH = 280;
const MAX_AUTHOR_LENGTH = 80;

const PinSchema = z.object({
  id: z.string().min(1).max(64),
  authorName: z.string().min(1).max(MAX_AUTHOR_LENGTH),
  zipCode: z.string().max(20),
  coords: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  pinOptionId: z.string().min(1).max(64),
  pinImage: z.string().max(2048),
  comment: z.string().max(MAX_COMMENT_LENGTH).optional(),
  createdAt: z.string(),
  address: z.string().max(280).optional(),
});

const PostBodySchema = z.object({
  pin: PinSchema,
});

type Pin = z.infer<typeof PinSchema>;

function kvKey(slug: string): string {
  return `guestbook:${slug}:pins`;
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,63}$/.test(slug);
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: 'Invalid slug.' }, { status: 400 });
  }

  const stored = (await kv.get<Pin[]>(kvKey(slug))) ?? [];
  return NextResponse.json({ pins: stored });
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isValidSlug(slug)) {
    return NextResponse.json({ error: 'Invalid slug.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid pin shape.', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const pin = parsed.data.pin;
  const key = kvKey(slug);
  const existing = (await kv.get<Pin[]>(key)) ?? [];

  // Si por alguna razón el id ya existe (replay del POST por mala conexión),
  // lo ignoramos como idempotencia. El cliente seguirá viendo su pin.
  if (existing.some((p) => p.id === pin.id)) {
    return NextResponse.json({ ok: true, count: existing.length, deduped: true });
  }

  const next = [...existing, pin];
  // FIFO drop si pasa el cap. 1000 pins ≈ 250KB serializado — encaja en
  // un slot KV sin acercarse a los 950KB cap del Studio.
  const trimmed = next.length > MAX_PINS_PER_SLUG ? next.slice(-MAX_PINS_PER_SLUG) : next;

  await kv.set(key, trimmed);
  return NextResponse.json({ ok: true, count: trimmed.length });
}
