# Protocolo pixel-perfect para replicar SVGs del XD

> **Contexto:** este protocolo surgió tras Billboard 0 (Fase 3.1). El usuario
> tuvo que pedirme 4 rondas de correcciones porque me salté pasos al
> implementar. La meta es que NUNCA vuelva a pasar.

Cualquier pantalla nueva del kiosk (Fase 3 en adelante) se construye siguiendo
estos 5 pasos **sin saltarse ninguno**.

---

## 1. Inventario completo antes de tocar código

Antes de escribir TSX, listar TODOS los `<g id=...>` del SVG:

```bash
grep -oE '<g id="[^"]+"' designs/NN-pantalla.svg | sort -u
```

Escribir un checklist en `.planning/3-NN-COVERAGE.md` con un item por group.

**Ejemplo real (Billboard 0):**

```markdown
## Elementos del SVG (13)

- [ ] Splash-Background (hero image fondo full-bleed)
- [ ] Logo-White (logo grande blanco @ y=371)
- [ ] Buttons_with_icons (ENGLISH button olive con globe+chevron)
- [ ] Button_Touch_Here (CTA central con doble borde)
- [ ] Splash-Footer-1:
  - [ ] Back_Tab (trapezoide lighter blue #1796d6)
  - [ ] Front_Tab (trapezoide dark blue #004f8b)
  - [ ] Logo-White-Footer (logo en el footer)
  - [ ] Wheelchair (icono accesibilidad)
  - [ ] Powered*by*-\_4 (texto + mini logo)
```

La pantalla no está lista hasta que cada item tenga ✅.

---

## 2. Copiar paths verbatim del SVG

**Nunca reescribir coordenadas a mano.** Mantener el `transform="translate(...)"`
original en cada path. El navegador aplica la matriz — no hace falta
"normalizar" los coords.

### ✅ Correcto

```tsx
<path d="M249.069,52.364a15.4,15.4,0,0,0-6.351,1.37..." transform="translate(-113.467 -22.211)" />
```

### ❌ Incorrecto

```tsx
{
  /* Reescribí coords "normalizando" los transforms → introduje errores */
}
<path d="M135.603 30.153..." />;
```

Los hand-rewrites se equivocan con coordenadas absolutas vs relativas (H
vs h, V vs v) y el render sale roto.

---

## 3. Cero substituciones de iconos

Si el SVG trae un `<path>` para un icono, **copiarlo a un `<svg>` inline**. NO
reemplazar con lucide-react u otra librería.

### Ejemplo real de error

Primer intento de Billboard 0: usé `<Accessibility>` de lucide para el
wheelchair del footer. El usuario lo notó inmediatamente:

> "por qué usaste otro icono de Wheelchair?"

Lucide usa proporciones/huecos/strokes distintos. No es 1:1 con el SVG.

### Regla

Solo usar lucide-react cuando:

- El SVG **no contiene** el path del icono.
- El usuario explícitamente pide usar una librería.

---

## 4. Diff visual obligatorio antes del commit

Antes de declarar la pantalla "hecha":

1. Generar PNG del SVG:
   ```bash
   qlmanage -t -s 1080 -o /tmp/thumbs "designs/NN-pantalla.svg"
   ```
2. Tomar screenshot del render via Playwright MCP a la misma resolución.
3. Invocar el subagent `revisor-visual` (vive en `.claude/agents/`) para
   hacer overlay/diff.
4. Si hay drift > 2px en **cualquier** bloque del SVG → volver al paso 1.

"Pixel-perfect ±2px" no es negociable. Lo dice CLAUDE.md §6.

---

## 5. Audit contra checklist antes del commit

Antes de `git commit`:

1. Abrir `.planning/3-NN-COVERAGE.md`.
2. Revisar que **todos** los groups estén marcados ✅.
3. Si alguno falta → volver al paso 1.

Solo entonces es válido commitear.

---

## Subagentes relevantes

- `.claude/agents/revisor-visual.md` — diff render vs SVG.
- `.claude/agents/auditor-white-label.md` — detecta colores/textos/paths hardcoded fuera de config.

Ambos deben correr limpios antes de declarar la pantalla terminada.

---

## Si alguno de estos pasos falla

- Paso 1 incompleto → inventario se hace ANTES del plan XML. Si descubro
  elementos nuevos durante la construcción, re-abrir el COVERAGE y
  añadirlos como nuevos items pendientes.
- Paso 2 tentación de reescribir → pegar el path tal cual, nada más.
  Si el path es enorme (>1kb), dejarlo en su propia línea.
- Paso 3 tentación de usar librería → NO. Copiar el path.
- Paso 4 no puedo correr `revisor-visual` → comunicarlo al usuario, NO
  commitear como hecho.
- Paso 5 → si falta un item del checklist y creí que no era relevante,
  preguntarle al usuario antes de decidir saltarlo.
