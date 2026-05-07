# DS1-PLAN.md — `<SignageHeader>` pixel-perfect

Replicar el header común de los 8 templates contra `designs/signage/01-full-events.svg`
(idéntico en todos los SVGs). Reemplaza el header stub de DS0 por el real.

```xml
<task type="auto">
  <name>DS1 — SignageHeader pixel-perfect (logo + current temp + 3-day forecast + clock+date)</name>
  <files>
    src/components/signage/header/SignageHeader.tsx                  (NEW server component, recibe weather + client + locale)
    src/components/signage/header/SignageHeaderSvg.tsx                (NEW: paths verbatim del SVG, dynamic text holes)
    src/components/signage/header/SignageClock.tsx                    (NEW client component live)
    src/lib/signage/weather-adapter.ts                                 (NEW: adapter WeatherData → header props)
    src/lib/signage/dates.ts                                           (NEW: helpers locale/timezone para day-of-week + clock + date)
    src/components/signage/runtime/SignagePlaceholder.tsx              (MODIFY: usar SignageHeader real, eliminar header stub interno)
    src/app/(signage)/signage/[client]/[display]/page.tsx              (MODIFY: fetch weather server-side, pasar al placeholder)
    clients-signage/_template/tokens.css                               (MODIFY: --signage-header-height: 155px)
    clients-signage/default/tokens.css                                 (MODIFY: idem)
    .planning/DS1-COVERAGE.md                                          (NEW: checklist pixel-perfect del header)
  </files>
  <action>
    Pasos del protocolo pixel-perfect aplicado al group `Display_Info_Header` del SVG:

    1. **Inventario** (DS1-COVERAGE.md): groups del header
       - `Header_Background` (rect 1920×155 fill #004f8b)
       - `Display_Time_Info` (translate 1693,29) — clock + date right
       - `Display_Weather_Info` (translate 388,0) — current temp + sun+cloud icon + 3 forecast cards
         - text "20°" (Open Sans Semibold 70) — current temp, dynamic
         - path "icon" (sun rays) at translate(428.5, 37.86) — current weather icon (DS1: estático SVG; mapping codeToIcon en sub-fase futura)
         - Group_4 (sun+cloud composite, clipPath) at translate(641.25, 36.39) — current weather icon big composite
         - rect Rectangle_Copy-2 (divider 2×113) at translate(518.64, 19)
         - rect Rectangle_Copy (divider 2×113) at translate(756, 19)
         - path ic_weather (cloud only, stroke 5) at translate(878, 56.68) — current weather icon cloud
         - Group_1 (FRI card) at translate(-345.5, 41): texts FRI / 50° / 20° + divider 2×90
         - Group_8 (SAT card) at translate(-195.36, -28): texts SAT / 50° / 20° + divider 2×90
         - Group_9 (SUN card) at translate(-66.75, -60.5): texts SUN / 50° / 20° + divider + Group_3759 (sub-group)
       - `Group_12` (TrueOmni logo) at translate(18, -15.67) — paths verbatim

    2. **`SignageHeaderSvg`** — single inline `<svg viewBox="0 0 1920 155">` con TODO el group verbatim.
       Dynamic holes:
       - `{currentTempText}` reemplaza `<tspan>20°</tspan>` en text id="_50_4"
       - `{forecast[0..2].dayLabel}` reemplaza FRI/SAT/SUN
       - `{forecast[0..2].highF}°` y `{forecast[0..2].lowF}°` reemplazan los 50°/20°
       - `{clockText}` reemplaza `<tspan>3:08 PM</tspan>` en text id="date_copy"
       - `{dateText}` reemplaza `<tspan>Mon Apr 15</tspan>` en text id="_20_"
       Logo TrueOmni y SVG icons paths quedan verbatim, fill="#fff" → fill="hsl(var(--signage-header-text))".
       Background fill "#004f8b" → fill="hsl(var(--signage-header-bg))".

    3. **`SignageClock`** — client component:
       - Props: locale, timezone, clockFormat ('12h'|'24h')
       - Live: actualiza cada 1s
       - Output: `{ clockText, dateText }` — los pasa al hijo (idealmente vía render prop o context, pero más simple: SignageClock renderea ambos placeholders dentro del SVG vía portal o vía consumer pattern). Solución pragmática: SignageClock devuelve un objeto, y se invoca desde SignageHeader como hook.
       - **Implementación:** `useSignageClock(locale, timezone, clockFormat)` hook custom que devuelve `{ clockText, dateText }`. Más limpio que componente.

    4. **`weather-adapter.ts`**:
       - `mapWeatherToHeader(data: WeatherData, locale: 'en'|'es'|...)` → `{ currentTemp: string, forecast: Array<{ dayLabel: string, highF: number, lowF: number }> }`
       - Skip `forecast5[0]` (today); toma `forecast5[1..3]`.
       - `dayLabel` = abreviatura 3-letter del weekday en el locale (FRI, SAT, SUN o VIE, SÁB, DOM).
       - Si weather no carga (network error), devolver fallback con `--°` placeholders.

    5. **`dates.ts`**:
       - `formatSignageClock(date, locale, timezone, '12h'|'24h')` → "3:08 PM" o "15:08"
       - `formatSignageDate(date, locale, timezone)` → "Mon Apr 15" o "Lun 15 Abr"
       - `formatDayAbbr(date, locale)` → "FRI" / "VIE" (uppercase 3-letter)
       - Usa `Intl.DateTimeFormat`.

    6. **`SignageHeader`** server component:
       - Props: `client: SignageClientResolved`, `weather: WeatherData | null`
       - Calcula `mapWeatherToHeader(weather, client.locale)` o fallback
       - Pasa props a `SignageHeaderSvg`
       - El clock es client component anidado que recibe locale+timezone y se actualiza

    7. **Modificar `page.tsx`**:
       - Importar `fetchWeather` desde `@/lib/weather`
       - Llamar `fetchWeather(client.location.lat, client.location.lon)` con try/catch (si falla → null, header muestra placeholders --°)
       - Pasar `weather` al `<SignagePlaceholder>` (o renombrar — ver paso siguiente)

    8. **Modificar `SignagePlaceholder`**:
       - Quitar el header stub interno (ese `bg-signage-header-bg` con "Default Signage Client" y reloj custom)
       - Reemplazar con `<SignageHeader client={client} weather={weather} />` arriba del 1920×1080
       - Mantener solo la tarjeta de metadata centrada bajo el header
       - Compensar la posición de la tarjeta para que NO la tape el header (margin-top = 155px o similar — usar flex-col gap)

    9. **Modificar tokens.css** (template + default):
       - `--signage-header-height: 155px` (era 80px)

    10. **DS1-COVERAGE.md**: checklist atómica de los 18+ groups del header.
  </action>
  <verify>
    - `pnpm typecheck && pnpm lint` limpios.
    - `pnpm kiosk:dev` arranca limpio.
    - GET `/signage/default/lobby-tv` → render del header con:
      - Background dark blue ocupa 1920×155
      - Logo TrueOmni izquierda (paths verbatim)
      - Big "current temp" (font Open Sans Semibold 70) — valor real del weather API o "--°" si falla
      - Sun-rays icon + sun+cloud composite + cloud-only icon presentes (verbatim del SVG)
      - 2 dividers verticales 2×113 entre bloques
      - 3 cards FRI/SAT/SUN con day label uppercase 3-letter, high (Bold 22), low (Light 22), divider 2×90
      - Clock "h:mm AM/PM" Montserrat Bold 40 derecha
      - Date "Mon Apr 15" Montserrat Medium 28 debajo
    - Diff visual contra el header del SVG: ±2px máx. Para DS1 manual (revisor-visual subagent puede correr en sub-fase de template completo).
    - Test no-touch: cero handlers en árbol del header.
    - Cero hex hardcoded en JSX (todo via tokens).
    - Locale en + timezone Phoenix → clock muestra hora local Phoenix correctamente.
  </verify>
  <done>
    - `<SignageHeader>` reemplaza el stub del DS0.
    - 3 forecast cards con datos reales del API.
    - Clock + date live con timezone aplicado.
    - SVG paths del logo + 3 weather icons verbatim del XD.
    - Diff visual aprobado contra el header del SVG (manual o subagent).
    - DS1-SUMMARY.md escrito.
    - Roadmap actualizado: DS1 [x].
    - Commit propuesto.
  </done>
</task>
```

## Decisiones específicas

- **Iconos weather estáticos en DS1.** Las 3 posiciones del SVG (sun-rays, sun+cloud, cloud-only) se renderean siempre. Mapping dinámico `weatherCode → icon` se difiere a sub-fase posterior (después de DS10) para preservar pixel-perfect contra el SVG.
- **Clock implementado como hook**, no componente, para evitar prop-drilling y mantener el SVG completo en un solo árbol declarativo.
- **fetchWeather con try/catch silencioso.** Si el API de Open-Meteo falla, el header muestra `--°` como placeholders. La página NO cae en notFound por error de weather.
- **Day abbreviation en uppercase 3-letter.** En `en`: FRI/SAT/SUN. En `es`: VIE/SÁB/DOM. La función `formatDayAbbr` extrae `'short'` weekday y aplica uppercase + truncate a 3 chars.

## Riesgos

- **Open-Meteo lat/lon de Phoenix**: 33.4484, -112.074. Si la API devuelve datos en F (forzados con `temperature_unit=fahrenheit`), encajan con el SVG ("50°" sin unidad explícita en el diseño).
- **Headeer height 155px** ahora es la única variante. El plan original mencionaba presets 80/100/120. Cuando entre el editor en DSS1, el cliente podrá ajustar; por ahora es fijo a lo que dice el SVG.
- **TrueOmni logo paths verbatim** tienen un color `#0088ce` (puntos del logo) que NO es token actualmente. Decisión: mantenerlo hardcoded en el SVG inline porque es parte de la identidad visual del logo TrueOmni (producto), no del cliente. Igual que el kiosk hace en sus billboards. (Verificar con auditor — si se queja, exempt el archivo del logo o tokenizar a `--signage-logo-dot` con default `#0088ce`.)
