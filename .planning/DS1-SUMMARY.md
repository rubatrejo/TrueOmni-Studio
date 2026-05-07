# DS1-SUMMARY.md — `<SignageHeader>` pixel-perfect

**Fecha:** 2026-05-06
**Estado:** ✅ completado, aprobado visualmente por Rubén
**Plan ejecutado:** `.planning/DS1-PLAN.md`
**Coverage:** `.planning/DS1-COVERAGE.md`

---

## Hecho

### 1. Inventario completo del SVG (Display_Info_Header)

Extraído del group `Display_Info_Header` de `designs/signage/01-full-events.svg`
(idéntico en los 8 templates). 18+ elementos cubiertos en `.planning/DS1-COVERAGE.md`.

### 2. Componente principal `<SignageHeader>` (`src/components/signage/header/SignageHeader.tsx`)

- 'use client' (necesita hook live de clock).
- Inline `<svg viewBox="0 0 1920 155">` con paths verbatim del XD.
- Tokens consumidos: `--signage-header-bg`, `--signage-header-text`.
- Excepción documentada: `#0088ce` en Path_12/Path_13 (puntos cyan del isotipo TrueOmni — brand identity del producto, no del cliente; comentario en código).
- Estructura del SVG completa:
  - Background rect 1920×155
  - Display_Time_Info (translate 1693, 29) → clock + date dynamic
  - Display_Weather_Info (translate 388, 0):
    - Current temp text dynamic
    - Sun-rays icon (path id="icon")
    - Sun+cloud composite (Group_4 con clipPath)
    - Cloud-only icon (path id="ic_weather", stroke 5)
    - 2 dividers verticales 2×113
    - 3 forecast cards FRI/SAT/SUN cada una con day label + high (Bold) + low (Light) + divider 2×90 rotado 90°
  - Group_12 (TrueOmni logo, translate 18 -15.67) con clipPath y 13 paths del wordmark + isotipo

### 3. Hook live clock (`src/components/signage/header/use-signage-clock.ts`)

- `useSignageClock(initialState, locale, timezone, clockFormat)` actualiza cada 1s vía `setInterval`.
- Acepta valor inicial computed server-side → cero hydration mismatch.
- Cleanup correcto en unmount.

### 4. Date helpers (`src/lib/signage/dates.ts`)

- `formatSignageClock(date, locale, timezone, '12h'|'24h')` → "3:08 PM" o "15:08"
- `formatSignageDate(date, locale, timezone)` → "Mon Apr 15" (sin coma — el SVG no la lleva)
- `formatDayAbbr(date, locale, timezone)` → "FRI" / "VIE" (uppercase 3-letter)
- Locale + timezone aware vía `Intl.DateTimeFormat`.

### 5. Weather adapter (`src/lib/signage/weather-adapter.ts`)

- `mapWeatherToHeader(data, locale, timezone, forecastDays)` adapta `WeatherData` del kiosk a `SignageHeaderWeather`.
- Skip `forecast5[0]` (today), toma siguientes N días.
- Genera `dayLabel` localizado per slot.
- Fallback con `--°` si data === null o el API falla.
- Soporta `forecastDays` 0 | 3 | 5 (5 clamped a 3 en DS1; 5 lo expande sub-fase futura cuando haya espacio en SVG).

### 6. Page `[client]/[display]/page.tsx`

- Server fetch de weather con `fetchWeather(lat, lon)` (Open-Meteo, cacheado 10min).
- `try/catch` silencioso: si el API falla, `weatherData=null` y el header muestra `--°`.
- Pasa `weather` ya adaptado al `<SignagePlaceholder>`.

### 7. SignagePlaceholder limpio

- Removido el header stub interno y la tarjeta de metadata diagnóstica de DS0.
- Renderea `<SignageHeader>` real arriba + body blanco vacío abajo (los templates aterrizan ahí en DS3+).
- Refleja exactamente el estado actual del producto: header cerrado, body sin templates.

### 8. Tokens

`--signage-header-height: 80px` → `155px` en `_template/tokens.css` y `default/tokens.css`.

---

## Verificado

| Check | Resultado |
|---|---|
| `pnpm typecheck` | ✅ limpio |
| `pnpm lint` (signage files) | ✅ cero issues nuevos |
| `pnpm kiosk:dev` arranca limpio | ✅ Ready in 1.2s |
| GET `/signage/default/lobby-tv` | ✅ HTTP 200, 609KB |
| GET `/` (kiosk) | ✅ HTTP 200 (no rompí kiosk) |
| Smoke contenido HTML | ✅ contiene `SignageHeader`, `sig-clip-sun-cloud`, `sig-clip-logo`, `signage-header-bg`, `signage-header-text`, `Montserrat-Bold`, `OpenSans-Semibold`, FRI/SAT/SUN, `#0088ce` (logo dots) |
| Datos weather reales del API | ✅ Phoenix forecast: 78°/96°/58°/99°/63°... (rangos típicos de mayo) |
| Cero touch handlers en árbol header/page | ✅ grep limpio |
| Aprobación visual de Rubén | ✅ confirmado en pantalla 2026-05-06 |

---

## Decisiones tomadas

- **Iconos weather estáticos en DS1.** Las 3 posiciones del SVG (sun-rays / sun+cloud / cloud-only) se renderean siempre, matching el SVG. Mapping dinámico `weatherCode → icon` se difiere a sub-fase posterior para preservar pixel-perfect contra el XD.
- **Clock como hook custom**, no componente. Más limpio que prop drilling y mantiene el SVG en un solo árbol JSX declarativo.
- **`#0088ce` hardcoded en Path_12/Path_13.** Brand identity del producto TrueOmni, no del cliente. Comentario explícito en el componente. El auditor flagueará pero la justificación es que el TrueOmni logo es placeholder hasta que el cliente onboardee su propio logo (sub-fase futura).
- **Body vacío post-header.** Removí la tarjeta diagnóstica de DS0 — visual más limpio, refleja exactamente lo que DS1 entrega. Templates llegan en DS3+.
- **Server-side weather fetch + initialClock SSR.** Hydration sin mismatch — el initial state del hook coincide con el HTML server-rendered.

---

## Pendiente / siguiente

- **DS2 — `<SignagePlayer>`**: rotación básica + transition `cut` simple + 2 placeholder slides. Reemplaza el body vacío con un slot rotativo.
- **Pulido del logo**: Path_12/Path_13 tokenize a `--signage-logo-accent` con default `#0088ce` (opcional, sub-fase tardía).
- **Iconos weather dinámicos** por `weatherCode` (sub-fase tardía).
- **Header position toggle (top/bottom)** runtime — DS11.
