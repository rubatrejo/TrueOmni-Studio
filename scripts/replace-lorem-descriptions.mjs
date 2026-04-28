#!/usr/bin/env node
/**
 * Sustituye descripciones Lorem Ipsum en clients/default/config.json por
 * descripciones reales contextuales basadas en title + subcategory + city.
 *
 * No traduce: las descripciones quedan en inglés (canónico). i18n se aplica
 * vía keys, no vía content del config — content multi-idioma será otra fase.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const path = resolve('clients/default/config.json');
const cfg = JSON.parse(readFileSync(path, 'utf8'));

function cityFromAddr(addr) {
  if (typeof addr !== 'string') return 'the area';
  const m = addr.split(',');
  return (m[m.length - 2] ?? '').trim() || 'the area';
}

function descFor(item) {
  const title = item.title ?? 'This venue';
  const sub = (item.subcategory ?? '').toLowerCase();
  const city = cityFromAddr(item.address);
  const cat = (item.category ?? '').toLowerCase();

  // Templates por subcategoría — distintos para variar el catálogo.
  const T = {
    'fine dining': `${title} delivers a polished fine-dining experience in ${city}, with seasonal tasting menus, an award-winning wine list, and impeccable service in an elegant setting. Reservations recommended for weekends.`,
    'american': `${title} is a beloved ${city} spot for classic American comfort food. Expect generous portions, fresh local ingredients, friendly service, and a welcoming dining room that fills up fast at lunch and dinner.`,
    'mexican': `${title} brings authentic Mexican flavors to ${city}, from handmade tortillas and slow-braised meats to fresh salsas and house margaritas. Casual ambiance, perfect for groups and family meals.`,
    'italian': `${title} serves rustic Italian fare in ${city}: house-made pastas, wood-fired pizzas, and seasonal antipasti paired with a curated selection of regional Italian wines.`,
    'bbq': `${title} smokes meats low and slow over Arizona mesquite. Brisket, ribs, and pulled pork are the stars, served with classic sides and house-made sauces in a relaxed ${city} setting.`,
    'bakery': `${title} bakes everything from scratch each morning — sourdough loaves, flaky pastries, and signature cakes. A favorite ${city} stop for breakfast, coffee, or a sweet take-home treat.`,
    'cafes': `${title} is a neighborhood café in ${city} pouring single-origin coffee and serving fresh breakfast and lunch options. Quiet workspace vibe in the morning, social hub by afternoon.`,
    'bars': `${title} is a go-to ${city} bar for craft cocktails, local beer on tap, and an inviting happy-hour crowd. Snug interior, friendly bartenders, and rotating live music on weekends.`,
    'boutique': `${title} is a curated ${city} boutique featuring locally designed apparel, accessories, and gifts. Personal styling on request and limited-run pieces you won't find anywhere else.`,
    'museum': `${title} preserves and presents the rich cultural heritage of ${city}, with rotating exhibits, permanent collections, and family-friendly programming. Audio guides and guided tours available.`,
    'theater': `${title} hosts live performances year-round in ${city} — from touring Broadway productions to local theater, comedy, and seasonal shows. Restored historic venue with great sightlines.`,
    'sports': `${title} is the home of high-energy sports action in ${city}. Catch a game, pre-game in the plaza, or grab tickets to upcoming events. Family-friendly amenities throughout.`,
    'park': `${title} is a sprawling ${city} park ideal for a casual walk, picnic, or sunset jog. Open green spaces, shaded paths, playgrounds, and seasonal events for the whole family.`,
    'zoo': `${title} houses a diverse collection of animals from across the globe in carefully designed habitats. Interactive exhibits, educational shows, and seasonal events make it a ${city} favorite.`,
    'attraction': `${title} is one of ${city}'s most-visited attractions — an immersive experience the whole family will remember. Plan ahead during peak hours.`,
    'mountain': `${title} offers breathtaking mountain scenery near ${city}. Whether you're hiking, photographing, or simply enjoying the view, plan for layered clothing and water.`,
    'desert': `${title} shows off the stark beauty of the Sonoran desert near ${city}. Look for native flora, wildlife, and dramatic vistas — best at sunrise or sunset.`,
    'canyon': `${title} reveals dramatic canyon landscapes carved over millennia. Trails range from short rim walks to ambitious descents — bring water and sturdy footwear.`,
    'urban': `${title} is the urban heart of ${city} — a lively district with shopping, dining, and street-level culture. Easy to explore on foot any time of day.`,
    'hotel': `${title} offers contemporary accommodations in ${city}, with comfortable rooms, on-site dining, and amenities including pool, fitness center, and complimentary Wi-Fi. Great location for business or leisure.`,
    'b&b': `${title} is a charming ${city} bed-and-breakfast with handsomely appointed rooms, a homemade breakfast each morning, and warm hosts who can recommend the best of the area.`,
    'resort': `${title} is a full-service resort in ${city}: spacious rooms or suites, multiple dining options, spa, pools, and curated activities for every kind of traveler.`,
    'luxury': `${title} delivers a luxurious stay in ${city} with refined design, top-tier service, gourmet dining, and exclusive amenities for the discerning guest.`,
    'hike': `${title} is a popular hike near ${city} with well-marked trails and rewarding views. Check current conditions, bring plenty of water, and start early in summer.`,
  };

  if (T[sub]) return T[sub];

  // Fallback genérico por categoría/módulo
  if (cat === 'restaurants' || cat === 'food') {
    return `${title} is a popular dining spot in ${city}, known for fresh ingredients, friendly service, and a memorable menu. Walk-ins welcome, reservations recommended for peak hours.`;
  }
  if (cat === 'things-to-do') {
    return `${title} is a top thing to do in ${city}. Visitors enjoy unique experiences, family-friendly activities, and easy access from downtown. Check ahead for seasonal hours.`;
  }
  if (cat === 'stay') {
    return `${title} provides comfortable accommodations in ${city}, with thoughtful amenities and convenient access to the main attractions. Book early during peak travel season.`;
  }
  return `${title} is a notable destination in ${city}, well worth a visit. Plan ahead for the best experience.`;
}

let count = 0;
function walk(o) {
  if (!o || typeof o !== 'object') return;
  if (Array.isArray(o)) {
    o.forEach(walk);
    return;
  }
  if (typeof o.description === 'string' && /Lorem|lorem|ipsum/i.test(o.description)) {
    o.description = descFor(o);
    count++;
  }
  for (const k of Object.keys(o)) walk(o[k]);
}

walk(cfg);
writeFileSync(path, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
console.log(`[ok] ${path}: ${count} descripciones reemplazadas`);
