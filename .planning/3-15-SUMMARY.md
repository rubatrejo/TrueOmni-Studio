# Fase 3.15 — Ask AI module (avatar IA flotante) — SUMMARY

**Fecha:** 2026-04-23
**Estado:** ✅ cerrada (typecheck + lint + auditor white-label + verificación visual Playwright)

---

## Qué se hizo

Integrar el módulo "Ask AI" (avatar IA flotante en el Home + modal full-canvas con suggested questions, typewriter mock, input + on-screen keyboard, mic con Web Speech API) a partir del paquete portable en `_packaged/ask-ai-module/`. Adaptación full white-label preservando la UI/transiciones idénticas al paquete original.

### Decisiones cerradas en brainstorming

1. **P1 — Modelo de integración:** A — overlay flotante global (modal + trigger), sin tile en el grid del Home, sin URL propia.
2. **P2 — Visibilidad del trigger:** A — solo en el Main Dashboard por el momento.
3. **P3 — Nivel de white-label:** C — fully white-label (tokens, textos, assets por cliente, suggested questions configurables) preservando UI idéntica.

### Componentes nuevos

```
src/lib/ask-ai.ts                       # helpers server-only: getAskAiConfig, resolveAiAssetPath
src/stores/ai-store.ts                  # zustand: isOpen, hydrate, askQuestion (typewriter mock)
src/components/ai/ai-modal.tsx          # modal con hero video + chips + input + voice mic
src/components/ai/ai-modal-host.tsx     # gate por enabled del cliente; hidrata el store
src/components/ai/ask-ai-trigger.tsx    # botón avatar circular (right:24, bottom:24, 82px)
src/components/ai/suggested-questions.tsx # chips horizontales con stagger GSAP
```

### Cambios en config

- `src/lib/config.ts`: 2 interfaces nuevas (`AskAiSuggestedQuestion`, `AskAiConfig`) + campo opcional `features.home.askAi?: AskAiConfig`. NO se añade a `HomeModuleVariant` porque no es un tile/módulo del grid.
- `clients/{default,_template,demo-cliente-a}/tokens.css`: 8 tokens nuevos `--ai-*` (`-surface`, `-text`, `-text-soft`, `-accent-from`, `-accent-to`, `-keyboard-bg`, `-trigger-shadow`, `-input-bg`).
- `clients/{default,_template,demo-cliente-a}/config.json`: 8 textos nuevos `ai_*` (title, subtitle, input_placeholder, send_label, loading_label, aria_open, aria_close, aria_mic). El template/demo en español, default en inglés.
- `clients/default/config.json`: bloque `home.askAi` completo con greeting + 8 suggested questions semilla en inglés (San Diego — verbatim del paquete original).
- `clients/default/assets/ai/avatar.png` (4.5 MB) y `hero-video.mp4` (52 MB) copiados desde el paquete (`olivia-v3.png` y `avatar-tavus.mp4`).
- `clients/{_template,demo-cliente-a}` no añaden `home.askAi` porque no tienen `features.home` configurado en v1.

### Integración

- `src/app/(kiosk)/home/page.tsx`: lee `home.askAi`, monta `<AskAiTrigger />` y `<AiModalHost />` como hermanos de `<HomeShell />`/`<AdsSlot />`/`<SurveyHost />`. Si `askAi.enabled === false` → no renderiza nada (guard temprano).

### Decisiones de implementación

- **Voice (Web Speech API)** se mueve del keyboard del paquete al **botón mic del hero del modal** (los rings GSAP que ya estaban). Mismo comportamiento end-to-end (transcript final → askQuestion).
- **OnScreenKeyboard del kiosk** se reusa (no se importa el `virtual-keyboard.tsx` del paquete con drag + voice). Mantiene consistencia con Search, Guestbook, Survey, etc.
- **Adapter en ai-modal.tsx** traduce los `KeyboardKey` del kiosk (`BACKSPACE/SPACE/ENTER/SHIFT/CLOSE/AT/DOT_COM`) a operaciones sobre el input string. Patrón idéntico al usado en `SearchOverlay`/`SendToEmailModal`/`GuestbookFormScreen`.
- **Tokens**: los hex del paquete (`#F9F6F0`, `#079EE2`, `#0E8C7E`, `#172133`, `#2C4560`, `#0D1321`, `#FFFFFF`) se convirtieron a HSL y se añadieron como tokens `--ai-*` para preservar UI idéntica permitiendo customización por cliente.
- **Mock vs LLM real**: v1 usa typewriter mock matcheando `question.text` contra `suggestedQuestions[]` (matcheo exacto). Si no hay match → fallback string genérico. v2 (Fase 5+) integrará endpoint real.
- **Hidratación del store**: `<AiModalHost>` recibe `greeting`/`suggestedQuestions` por prop desde el server component (`home/page.tsx`) y los inyecta al store via `hydrate()` en `useEffect`. Server-driven, client-rendered.

### Verificado

- `pnpm typecheck` limpio.
- `pnpm lint` limpio en todos los archivos AI (errores residuales son pre-existentes del Guestbook).
- `pnpm format:check` limpio en todos los archivos AI.
- Auditor white-label: 0 hallazgos en src/components/ai/ tras añadir `--ai-input-bg` token (el único hallazgo era `#FFFFFF` literal en el input bg).
- Playwright (`KIOSK_CLIENT=default`):
  - `/home` con avatar circular Olivia en bottom-right (right:24, bottom:24, 82px).
  - Tap avatar → modal sube con slide-up Framer (0.4s ease).
  - Hero video Tavus loopeando, mic gradient azul-teal en top-right del hero, X close en top-left.
  - Greeting "Hi! I'm your guide to San Diego..." renderizado.
  - 8 chips horizontales scrolleables con la sintaxis del paquete.
  - Tap chip "Best restaurants nearby?" → typewriter mostró respuesta completa (Harbor Grill + Gowoondon).
  - Tap input → modal expande a 85%, OnScreenKeyboard del kiosk sube; tap tecla `a` → input mostró `a` + apareció botón Send (SendHorizontal cyan).

### Screenshots

- `.planning/verifications/3-15-home-clean.png` — home con avatar trigger.
- `.planning/verifications/3-15-modal-open.png` — modal recién abierto con greeting.
- `.planning/verifications/3-15-modal-typewriter.png` — modal con respuesta typewriter.
- `.planning/verifications/3-15-modal-keyboard.png` — modal expandido con OnScreenKeyboard visible.
- `.planning/verifications/3-15-modal-typing.png` — input con `a` + Send button.

---

## Pendiente / siguiente

- **LLM real** (Fase 5+): endpoint `/api/ai` que llame a Anthropic Claude con el contexto del cliente (`clients/{slug}/config.json` como system prompt). Reemplazar el mock typewriter en `ai-store.askQuestion()`.
- **Voice lang dinámico**: `recognition.lang = 'en-US'` está hardcoded; debería leer de `config.client.locale` o `askAi.voiceLang` para soportar clientes ES.
- **Fallback response configurable**: el string `'I can help with that! Let me look into it for you.'` en `ai-store.ts:56` podría moverse a `config.textos.ai_fallback_response` (auditor lo notó como mejora opcional).
- **Bloque askAi en demo-cliente-a y \_template**: añadir cuando estos clientes tengan `features.home` configurado.
- **Cross-cliente**: verificación visual con `KIOSK_CLIENT=demo-cliente-a` pendiente (requiere primero configurar `features.home` para ese cliente, ahora muestra placeholder).
- **Photo Booth, Itinerary Builder**: módulos del Home aún sin construir.

---

## Fase

3.15 Ask AI cerrada (módulo funcional con UI idéntica al paquete original, integrado white-label en el Home del kiosk).
