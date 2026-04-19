# Theme Factory — Design System Theme Generator

---

name: theme-factory
description: Complete design system theme generator. Creates full color palettes, typography scales, spacing systems, shadows, borders, transitions, and Tailwind v4 theme configs from a single brand color. Includes dark mode strategy, WCAG contrast checking, and multi-format token export.
triggers:

- theme
- design tokens
- color palette
- typography scale
- spacing system
- dark mode
- generate theme
- brand colors
- design system tokens
- tailwind theme
- shadow system
- border radius
- animation timing

---

## 1. Color Palette Generator

### 1.1 From Brand Color to Full Palette (HSL Manipulation Algorithm)

Given a single brand/primary color (e.g., `#0066FF`), generate an entire design system palette.

#### Step 1 — Convert Hex to HSL

```
HEX → RGB → HSL

#0066FF → rgb(0, 102, 255) → hsl(216, 100%, 50%)

Formula:
  R' = R/255, G' = G/255, B' = B/255
  Cmax = max(R', G', B')
  Cmin = min(R', G', B')
  Δ = Cmax - Cmin

  L = (Cmax + Cmin) / 2

  S = 0 if Δ = 0
  S = Δ / (1 - |2L - 1|) otherwise

  H = 60 × ((G'-B')/Δ mod 6)  if Cmax = R'
  H = 60 × ((B'-R')/Δ + 2)    if Cmax = G'
  H = 60 × ((R'-G')/Δ + 4)    if Cmax = B'
```

#### Step 2 — Generate Primary Scale (50–950)

From the base HSL, generate a lightness scale by adjusting L while slightly shifting S:

```
Scale Generation Algorithm:
┌──────────┬──────────────────────────────────────────────────────┐
│  Step    │  HSL Adjustment                                      │
├──────────┼──────────────────────────────────────────────────────┤
│  50      │  H, S - 30%, L = 97%    (near white tint)           │
│  100     │  H, S - 25%, L = 93%                                │
│  200     │  H, S - 15%, L = 86%                                │
│  300     │  H, S - 5%,  L = 74%                                │
│  400     │  H, S,       L = 62%                                │
│  500     │  H, S,       L = 50%    (base — the brand color)    │
│  600     │  H, S + 5%,  L = 42%                                │
│  700     │  H, S + 10%, L = 34%                                │
│  800     │  H, S + 10%, L = 26%                                │
│  900     │  H, S + 5%,  L = 18%                                │
│  950     │  H, S,       L = 10%    (near black shade)          │
└──────────┴──────────────────────────────────────────────────────┘

Notes:
- Saturation decreases in lighter shades (tints feel washed if too saturated)
- Saturation increases slightly in mid-darks (600-800) for richness
- Hue stays constant for the primary; shift ±2-5° for warmth/coolness fine-tuning
- Always clamp S to 0-100% and L to 0-100%
```

#### Step 3 — Generate Secondary Color

Strategy options (pick one based on brand guidelines):

```
ANALOGOUS (30° hue shift — harmonious):
  Secondary H = Primary H + 30  (or - 30)
  Keep similar S and L

COMPLEMENTARY (180° hue shift — high contrast):
  Secondary H = (Primary H + 180) % 360
  Reduce S by 10-15% to avoid clashing

SPLIT-COMPLEMENTARY (150° / 210° — balanced contrast):
  Secondary H = (Primary H + 150) % 360
  Good for professional/enterprise sites

TRIADIC (120° — vibrant):
  Secondary H = (Primary H + 120) % 360
  Works well for playful/creative brands

RECOMMENDED FOR TRUEOMNI:
  Use ANALOGOUS or SPLIT-COMPLEMENTARY for a professional tech brand.
  Generate the same 50-950 scale for secondary.
```

#### Step 4 — Generate Accent Color

```
Accent should be visually distinct from both primary and secondary.

Strategy:
  Accent H = (Primary H + 60) % 360   (if secondary is analogous)
  Accent H = (Primary H + 270) % 360  (if secondary is complementary)

  Accent S = Primary S + 10%  (slightly more vivid)
  Accent L = Primary L        (same lightness base)

Generate the same 50-950 scale.
```

#### Step 5 — Generate Neutral Scale (Gray)

```
Neutral grays should have a SLIGHT hue tint from the primary for visual cohesion.

Algorithm:
  Neutral H = Primary H       (same hue as brand)
  Neutral S = 3-8%            (barely perceptible saturation)
  Neutral L = [scale values]  (97% → 5%)

┌──────────┬──────────────────────────────────────────────────────┐
│  Step    │  HSL Values                                          │
├──────────┼──────────────────────────────────────────────────────┤
│  50      │  H, 5%, 97%    →  #F8F9FA (background-lightest)     │
│  100     │  H, 5%, 93%    →  #F1F3F5 (background)              │
│  200     │  H, 5%, 86%    →  #DEE2E6 (border-light)            │
│  300     │  H, 4%, 74%    →  #ADB5BD (border)                  │
│  400     │  H, 3%, 55%    →  #868E96 (placeholder text)        │
│  500     │  H, 3%, 45%    →  #6C757D (muted text)              │
│  600     │  H, 4%, 35%    →  #495057 (secondary text)          │
│  700     │  H, 5%, 25%    →  #343A40 (body text)               │
│  800     │  H, 6%, 15%    →  #212529 (heading text)            │
│  900     │  H, 8%, 9%     →  #141719 (near-black)              │
│  950     │  H, 10%, 5%    →  #0B0D0E (true dark)               │
└──────────┴──────────────────────────────────────────────────────┘

WHY tinted grays?
Pure grays (#808080) feel cold and disconnected from the brand.
Tinting with the primary hue creates subtle visual harmony.
```

### 1.2 Semantic Colors

```
Semantic colors communicate status/meaning. Derive from fixed hues:

SUCCESS (Green):
  H = 142, S = 71%, L = 45%
  Base: #22C55E
  Scale: 50 (#F0FDF4) → 950 (#052E16)
  Usage: confirmations, positive states, completion

WARNING (Amber/Yellow):
  H = 38, S = 92%, L = 50%
  Base: #F59E0B
  Scale: 50 (#FFFBEB) → 950 (#451A03)
  Usage: caution states, important notices, pending

ERROR (Red):
  H = 0, S = 84%, L = 60%
  Base: #EF4444
  Scale: 50 (#FEF2F2) → 950 (#450A0A)
  Usage: errors, destructive actions, invalid states

INFO (Blue):
  H = 199, S = 89%, L = 48%
  Base: #0EA5E9
  Scale: 50 (#F0F9FF) → 950 (#082F49)
  Usage: informational messages, help text, tooltips

RULES:
- Semantic colors should NOT be overridden by brand colors
- Always check contrast ratios for text on semantic backgrounds
- Use the 50 shade as background, 700-900 as text on light mode
- Use the 950 shade as background, 200-400 as text on dark mode
```

### 1.3 Contrast Ratio Calculation (WCAG)

```
WCAG 2.1 Minimum Requirements:
┌─────────────────────┬───────────────┬─────────────────────┐
│  Level              │  Ratio        │  Applies To         │
├─────────────────────┼───────────────┼─────────────────────┤
│  AA Normal Text     │  ≥ 4.5:1      │  Text < 18pt        │
│  AA Large Text      │  ≥ 3:1        │  Text ≥ 18pt bold   │
│  AA UI Components   │  ≥ 3:1        │  Icons, borders     │
│  AAA Normal Text    │  ≥ 7:1        │  Enhanced (ideal)   │
│  AAA Large Text     │  ≥ 4.5:1      │  Enhanced (ideal)   │
└─────────────────────┴───────────────┴─────────────────────┘

Contrast Ratio Formula:
  L1 = relative luminance of lighter color
  L2 = relative luminance of darker color
  Ratio = (L1 + 0.05) / (L2 + 0.05)

Relative Luminance:
  L = 0.2126 * R' + 0.7152 * G' + 0.0722 * B'

  Where R', G', B' are linearized:
    if Csrgb <= 0.04045: C' = Csrgb / 12.92
    else: C' = ((Csrgb + 0.055) / 1.055) ^ 2.4

PRACTICAL CHECKER (TypeScript):
```

```typescript
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return [r, g, b];
}

function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = luminance(r1, g1, b1);
  const l2 = luminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function meetsWCAG(
  foreground: string,
  background: string,
  level: "AA" | "AAA" = "AA",
  isLargeText: boolean = false,
): boolean {
  const ratio = contrastRatio(foreground, background);
  if (level === "AA") return isLargeText ? ratio >= 3 : ratio >= 4.5;
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}
```

```
CONTRAST PAIRING GUIDE:
┌────────────────────────┬──────────────────────────────────────┐
│  Background            │  Safe Text Colors                    │
├────────────────────────┼──────────────────────────────────────┤
│  White (#FFFFFF)       │  600+ on primary/secondary scale     │
│  50 shade              │  700+ for body, 600+ for large text  │
│  100 shade             │  700+ for body, 600+ for large text  │
│  500 shade (brand)     │  White or 50 shade                   │
│  800-950 shades        │  White, 50-200 shades                │
│  Dark mode bg (950)    │  100-400 shades                      │
└────────────────────────┴──────────────────────────────────────┘
```

### 1.4 Dark Mode Color Mapping Strategy

```
APPROACH: Invert the lightness scale but NOT the hue or saturation.

Light Mode → Dark Mode Mapping:
┌──────────────────────────┬──────────────────────────────────┐
│  Light Mode Usage        │  Dark Mode Equivalent            │
├──────────────────────────┼──────────────────────────────────┤
│  bg-white                │  bg-neutral-950                  │
│  bg-neutral-50           │  bg-neutral-900                  │
│  bg-neutral-100          │  bg-neutral-800                  │
│  border-neutral-200      │  border-neutral-700              │
│  text-neutral-500        │  text-neutral-400                │
│  text-neutral-700        │  text-neutral-300                │
│  text-neutral-900        │  text-neutral-100                │
│  bg-primary-500          │  bg-primary-400 (brighter)       │
│  text-primary-600        │  text-primary-400                │
│  bg-primary-50 (tint)    │  bg-primary-950 (shade)          │
│  shadow-md               │  shadow-none or shadow-glow      │
│  ring-primary-500        │  ring-primary-400                │
└──────────────────────────┴──────────────────────────────────┘

KEY RULES:
1. Backgrounds get DARKER (invert lightness scale)
2. Text gets LIGHTER (invert lightness scale)
3. Brand colors get SLIGHTLY LIGHTER (shift -100 on scale) for visibility
4. Borders get lighter (from 200 → 700)
5. Shadows become less visible or use glow effects
6. Semantic colors stay the same hue but shift lightness for readability
7. NEVER use pure black (#000000) as dark mode bg — use tinted 950
```

---

## 2. Typography Scale Calculator

### 2.1 Modular Scales

A modular scale creates harmonious size relationships using a mathematical ratio.

```
AVAILABLE SCALES:
┌────────────────────────┬────────┬──────────────────────────────────┐
│  Scale Name            │  Ratio │  Character / Best For            │
├────────────────────────┼────────┼──────────────────────────────────┤
│  Minor Second          │  1.067 │  Subtle, dense UIs, dashboards   │
│  Major Second          │  1.125 │  Balanced, content-heavy sites   │
│  Minor Third           │  1.200 │  ★ RECOMMENDED for most sites    │
│  Major Third           │  1.250 │  Bold, marketing pages           │
│  Perfect Fourth        │  1.333 │  Strong hierarchy, editorial      │
│  Augmented Fourth      │  1.414 │  Dramatic, hero-heavy layouts    │
│  Perfect Fifth         │  1.500 │  Very dramatic, minimal pages    │
│  Golden Ratio          │  1.618 │  Classical proportion, artistic   │
└────────────────────────┴────────┴──────────────────────────────────┘
```

### 2.2 Scale Generation Formula

```
Given:
  base = 16px (1rem)
  ratio = 1.25 (Major Third)

Generated Scale:
  step(-2) = base / ratio^2 = 16 / 1.5625 = 10.24px → text-xs
  step(-1) = base / ratio^1 = 16 / 1.25   = 12.80px → text-sm
  step(0)  = base            = 16          = 16.00px → text-base
  step(1)  = base × ratio^1 = 16 × 1.25   = 20.00px → text-lg
  step(2)  = base × ratio^2 = 16 × 1.5625 = 25.00px → text-xl
  step(3)  = base × ratio^3 = 16 × 1.953  = 31.25px → text-2xl
  step(4)  = base × ratio^4 = 16 × 2.441  = 39.06px → text-3xl
  step(5)  = base × ratio^5 = 16 × 3.052  = 48.83px → text-4xl
  step(6)  = base × ratio^6 = 16 × 3.815  = 61.04px → text-5xl
  step(7)  = base × ratio^7 = 16 × 4.768  = 76.29px → text-6xl
  step(8)  = base × ratio^8 = 16 × 5.960  = 95.37px → text-7xl

FORMULA:
  size(n) = base × ratio^n
  Round to 2 decimal places, then convert to rem: size / 16
```

### 2.3 Recommended Typography Scale for TrueOmni

```
Using Minor Third (1.2) — balanced for SaaS/tech sites:

┌──────────┬────────────┬─────────┬──────────────────────────────────┐
│  Token   │  Size      │  rem    │  Usage                           │
├──────────┼────────────┼─────────┼──────────────────────────────────┤
│  xs      │  11.11px   │  0.694  │  Captions, footnotes, badges     │
│  sm      │  13.33px   │  0.833  │  Helper text, metadata, labels   │
│  base    │  16.00px   │  1.000  │  Body text, paragraphs           │
│  lg      │  19.20px   │  1.200  │  Lead text, card titles          │
│  xl      │  23.04px   │  1.440  │  Section subtitles, H4           │
│  2xl     │  27.65px   │  1.728  │  Section titles, H3              │
│  3xl     │  33.18px   │  2.074  │  Page subtitles, H2              │
│  4xl     │  39.81px   │  2.488  │  Page titles, H1                 │
│  5xl     │  47.78px   │  2.986  │  Hero subtitles                  │
│  6xl     │  57.33px   │  3.583  │  Hero headlines                  │
│  7xl     │  68.80px   │  4.300  │  Display text, oversized hero    │
│  8xl     │  82.56px   │  5.160  │  Massive display (use sparingly) │
│  9xl     │  99.07px   │  6.192  │  Super display (rare)            │
└──────────┴────────────┴─────────┴──────────────────────────────────┘
```

### 2.4 Line Height Calculations

```
RULES:
┌──────────────────────┬──────────────┬──────────────────────────────┐
│  Text Type           │  Line Height │  Reasoning                   │
├──────────────────────┼──────────────┼──────────────────────────────┤
│  Display (5xl-9xl)   │  1.0 - 1.1   │  Tight for visual impact     │
│  Headings (2xl-4xl)  │  1.1 - 1.2   │  Slightly tighter than body  │
│  Subheadings (lg-xl) │  1.3 - 1.4   │  Between heading and body    │
│  Body (base)         │  1.5 - 1.6   │  Optimal readability         │
│  Small text (xs-sm)  │  1.6 - 1.75  │  More space for small sizes  │
│  Long-form body      │  1.6 - 1.8   │  Blog posts, documentation   │
│  UI labels           │  1.0 - 1.2   │  Compact for buttons/badges  │
└──────────────────────┴──────────────┴──────────────────────────────┘

FORMULA (approximate):
  lineHeight = 1.8 - (0.1 × log2(fontSize / 16))
  Clamp between 1.0 and 1.8

TAILWIND MAPPING:
  leading-none:    1.0
  leading-tight:   1.25
  leading-snug:    1.375
  leading-normal:  1.5
  leading-relaxed: 1.625
  leading-loose:   2.0
```

### 2.5 Letter Spacing Guidelines

```
RULES:
┌──────────────────────┬────────────────┬─────────────────────────────┐
│  Text Type           │  Tracking      │  Reasoning                  │
├──────────────────────┼────────────────┼─────────────────────────────┤
│  Display (5xl+)      │  -0.02em       │  Tighten large text         │
│  Headings (2xl-4xl)  │  -0.015em      │  Slight tightening          │
│  Body (base-lg)      │  0em (normal)  │  Default tracking is fine   │
│  Small text (xs-sm)  │  +0.02em       │  Open up small text         │
│  ALL CAPS text       │  +0.05-0.1em   │  Always widen caps          │
│  UI labels/buttons   │  +0.01-0.02em  │  Slight widening for caps   │
│  Monospace/code      │  0em           │  Keep default               │
└──────────────────────┴────────────────┴─────────────────────────────┘

TAILWIND MAPPING:
  tracking-tighter:  -0.05em
  tracking-tight:    -0.025em
  tracking-normal:   0em
  tracking-wide:     0.025em
  tracking-wider:    0.05em
  tracking-widest:   0.1em
```

### 2.6 Font Weight Usage Patterns

```
WEIGHT USAGE GUIDE:
┌───────────┬──────────────────────────────────────────────────────┐
│  Weight   │  Usage                                               │
├───────────┼──────────────────────────────────────────────────────┤
│  100 Thin │  Decorative only, display text > 48px                │
│  200 XLt  │  Decorative, display text > 36px                     │
│  300 Lt   │  Subheadings, secondary headings, large body text    │
│  400 Reg  │  Body text, paragraphs, descriptions                 │
│  500 Med  │  ★ Emphasized body text, navigation links, labels    │
│  600 Semi │  ★ Card titles, section subtitles, buttons           │
│  700 Bold │  ★ Headings, hero text, CTAs                         │
│  800 XBd  │  Display headings, high-impact hero text             │
│  900 Blk  │  Extreme emphasis only, very large display text      │
└───────────┴──────────────────────────────────────────────────────┘

RULES:
- Use MAX 3 weights per font family (e.g., 400, 500, 700)
- Body text: 400 or 500
- Headings: 600 or 700
- If using a geometric sans-serif (Inter, Geist): 500 for body reads well
- If using a humanist sans-serif (Source Sans, Open Sans): 400 for body
- NEVER use thin (100-200) at body text size — unreadable
```

---

## 3. Spacing System Builder

### 3.1 Base Unit Scale Generation

```
BASE: 4px (0.25rem)

The entire spacing system is built from multiples of 4px.
This ensures pixel-perfect alignment on most screens (even 1.5x DPR).

FULL SCALE:
┌──────────┬────────┬─────────┬──────────────────────────────────┐
│  Token   │  px    │  rem    │  Common Usage                    │
├──────────┼────────┼─────────┼──────────────────────────────────┤
│  0       │  0     │  0      │  Reset                           │
│  px      │  1     │  0.0625 │  Hairline borders                │
│  0.5     │  2     │  0.125  │  Micro spacing                   │
│  1       │  4     │  0.25   │  Tight padding, icon gaps        │
│  1.5     │  6     │  0.375  │  Small internal padding          │
│  2       │  8     │  0.5    │  ★ Small padding, icon spacing   │
│  2.5     │  10    │  0.625  │  Button padding-y (small)        │
│  3       │  12    │  0.75   │  ★ Medium-small padding          │
│  3.5     │  14    │  0.875  │  Button padding-y (default)      │
│  4       │  16    │  1      │  ★ Default padding, gap          │
│  5       │  20    │  1.25   │  Medium padding                  │
│  6       │  24    │  1.5    │  ★ Card padding, common gap      │
│  7       │  28    │  1.75   │  Medium-large spacing            │
│  8       │  32    │  2      │  ★ Section padding (mobile)      │
│  9       │  36    │  2.25   │  —                               │
│  10      │  40    │  2.5    │  Large padding                   │
│  11      │  44    │  2.75   │  —                               │
│  12      │  48    │  3      │  ★ Section gap                   │
│  14      │  56    │  3.5    │  Large section spacing           │
│  16      │  64    │  4      │  ★ Section padding (desktop)     │
│  20      │  80    │  5      │  Large section padding           │
│  24      │  96    │  6      │  ★ Page section spacing          │
│  28      │  112   │  7      │  Hero spacing                    │
│  32      │  128   │  8      │  Extra large sections            │
│  36      │  144   │  9      │  —                               │
│  40      │  160   │  10     │  Maximum section spacing         │
│  44      │  176   │  11     │  —                               │
│  48      │  192   │  12     │  Full page section spacing       │
│  56      │  224   │  14     │  —                               │
│  64      │  256   │  16     │  Hero section height-like        │
│  72      │  288   │  18     │  —                               │
│  80      │  320   │  20     │  Large vertical rhythm           │
│  96      │  384   │  24     │  Extra large vertical rhythm     │
└──────────┴────────┴─────────┴──────────────────────────────────┘
```

### 3.2 T-Shirt Sizing (Semantic Spacing Aliases)

```
Map semantic names to the numeric scale for easier team communication:

┌────────┬──────────────┬──────────────────────────────────────────┐
│  Size  │  Maps To     │  Usage                                   │
├────────┼──────────────┼──────────────────────────────────────────┤
│  3xs   │  1 (4px)     │  Hairline gaps, icon-to-text             │
│  2xs   │  2 (8px)     │  Tight component padding                 │
│  xs    │  3 (12px)    │  Small component padding                 │
│  sm    │  4 (16px)    │  Default component padding               │
│  md    │  6 (24px)    │  Card padding, standard gap              │
│  lg    │  8 (32px)    │  Section inner padding (mobile)          │
│  xl    │  12 (48px)   │  Section gap                             │
│  2xl   │  16 (64px)   │  Section padding (desktop)               │
│  3xl   │  24 (96px)   │  Page section vertical rhythm            │
│  4xl   │  32 (128px)  │  Hero sections                           │
│  5xl   │  40 (160px)  │  Maximum spacing                         │
└────────┴──────────────┴──────────────────────────────────────────┘
```

### 3.3 Component-Specific Spacing

```
BUTTON SPACING:
  padding-y:  sm=6px, md=10px, lg=14px
  padding-x:  sm=12px, md=16px, lg=24px
  gap (icon): sm=6px, md=8px, lg=10px

CARD SPACING:
  padding:    sm=16px, md=24px, lg=32px
  gap:        12-16px between elements
  margin:     16-24px between cards

INPUT/FORM SPACING:
  padding-y:  8-12px
  padding-x:  12-16px
  label gap:  6-8px above input
  field gap:  16-24px between fields
  section:    32-48px between form sections

NAVIGATION SPACING:
  item gap:   24-32px horizontal, 8-12px vertical
  padding-x:  16-24px (container)
  padding-y:  12-16px (nav bar height)
  dropdown:   8px padding, 4px item gap

SECTION SPACING (Vertical Rhythm):
  mobile:     48-64px between sections
  tablet:     64-80px between sections
  desktop:    80-96px between sections (max 128px)
```

### 3.4 Responsive Spacing Adjustments

```
Strategy: Scale spacing DOWN on mobile, not up on desktop.

┌──────────────┬────────────────┬───────────────┬────────────────┐
│  Context     │  Mobile (<640) │  Tablet (768) │  Desktop (1024)│
├──────────────┼────────────────┼───────────────┼────────────────┤
│  Container   │  px-4 (16px)   │  px-8 (32px)  │  px-16 (64px)  │
│  Section py  │  py-12 (48px)  │  py-16 (64px) │  py-24 (96px)  │
│  Card padding│  p-4 (16px)    │  p-6 (24px)   │  p-8 (32px)    │
│  Grid gap    │  gap-4 (16px)  │  gap-6 (24px) │  gap-8 (32px)  │
│  Heading mb  │  mb-4 (16px)   │  mb-6 (24px)  │  mb-8 (32px)   │
│  Stack gap   │  gap-3 (12px)  │  gap-4 (16px) │  gap-6 (24px)  │
└──────────────┴────────────────┴───────────────┴────────────────┘

TAILWIND PATTERN:
  className="px-4 md:px-8 lg:px-16"
  className="py-12 md:py-16 lg:py-24"
  className="gap-4 md:gap-6 lg:gap-8"
```

---

## 4. Shadow System

### 4.1 Elevation Levels

```
ELEVATION SCALE (Light Mode):
┌──────────┬───────────────────────────────────────────────────────┐
│  Level   │  CSS Box-Shadow Value                                 │
├──────────┼───────────────────────────────────────────────────────┤
│  0       │  none                                                 │
│  (ring)  │  0 0 0 1px rgba(0,0,0,0.05)                          │
│  sm      │  0 1px 2px 0 rgba(0,0,0,0.05)                        │
│  DEFAULT │  0 1px 3px 0 rgba(0,0,0,0.1),                        │
│          │  0 1px 2px -1px rgba(0,0,0,0.1)                      │
│  md      │  0 4px 6px -1px rgba(0,0,0,0.1),                     │
│          │  0 2px 4px -2px rgba(0,0,0,0.1)                      │
│  lg      │  0 10px 15px -3px rgba(0,0,0,0.1),                   │
│          │  0 4px 6px -4px rgba(0,0,0,0.1)                      │
│  xl      │  0 20px 25px -5px rgba(0,0,0,0.1),                   │
│          │  0 8px 10px -6px rgba(0,0,0,0.1)                     │
│  2xl     │  0 25px 50px -12px rgba(0,0,0,0.25)                  │
└──────────┴───────────────────────────────────────────────────────┘

USAGE GUIDE:
  0       →  Flat elements (inline text, basic layout)
  ring    →  Subtle card borders
  sm      →  Buttons at rest, inputs
  DEFAULT →  Cards, dropdowns at rest
  md      →  Cards on hover, floating elements
  lg      →  Modals, popovers, tooltips
  xl      →  Dialogs, command palettes
  2xl     →  Full-page overlays, drawers
```

### 4.2 Focus Ring Shadows

```
FOCUS RING (Accessibility — CRITICAL):

Primary focus ring:
  0 0 0 2px var(--color-background),
  0 0 0 4px var(--color-primary-500)

  → Creates a 2px ring with a 2px gap (visible on any background)

Semantic focus rings:
  Error:   0 0 0 2px var(--bg), 0 0 0 4px var(--color-error-500)
  Success: 0 0 0 2px var(--bg), 0 0 0 4px var(--color-success-500)

TAILWIND:
  focus-visible:ring-2
  focus-visible:ring-primary-500
  focus-visible:ring-offset-2
```

### 4.3 Colored Shadows

```
Colored shadows use the brand color with low opacity for a premium feel:

Primary colored shadow:
  0 4px 14px 0 hsla(var(--primary-hue), 80%, 50%, 0.25)

Usage:
  - Primary CTA buttons on hover
  - Featured cards
  - Pricing "recommended" card

TAILWIND (custom utility):
  shadow-primary: 0 4px 14px 0 hsl(var(--primary-500) / 0.25)
  shadow-primary-lg: 0 10px 25px -3px hsl(var(--primary-500) / 0.3)
```

### 4.4 Inner Shadows

```
INNER SHADOW:
  inset 0 2px 4px 0 rgba(0,0,0,0.05)

Usage:
  - Input fields (subtle depth)
  - Recessed containers
  - Toggle switches (off state)

TAILWIND: shadow-inner
```

### 4.5 Dark Mode Shadow Adjustments

```
In dark mode, traditional shadows are invisible against dark backgrounds.

STRATEGIES:
1. REDUCE or REMOVE shadows (preferred — dark mode is already "elevated")
2. Use GLOW effects instead:
   0 0 20px rgba(var(--primary-rgb), 0.15)
3. Use SUBTLE BORDERS instead of shadows:
   border: 1px solid rgba(255, 255, 255, 0.1)
4. Use LIGHTER BACKGROUND for elevation:
   bg-neutral-800 (elevated) vs bg-neutral-900 (base)

DARK MODE ELEVATION:
  Level 0: bg-neutral-950 (base surface)
  Level 1: bg-neutral-900 (card, sidebar)
  Level 2: bg-neutral-800 (dropdown, modal)
  Level 3: bg-neutral-700 (tooltip, popover)
```

---

## 5. Border Radius System

```
RADIUS SCALE:
┌──────────┬────────┬──────────────────────────────────────────────┐
│  Token   │  Value │  Usage                                       │
├──────────┼────────┼──────────────────────────────────────────────┤
│  none    │  0px   │  Sharp edges (tables, code blocks)            │
│  sm      │  4px   │  Subtle rounding (badges, small cards)        │
│  DEFAULT │  6px   │  ★ Inputs, buttons (default)                 │
│  md      │  8px   │  ★ Cards, containers                         │
│  lg      │  12px  │  Large cards, modals                          │
│  xl      │  16px  │  Hero cards, featured sections                │
│  2xl     │  24px  │  Large panels, image containers               │
│  3xl     │  32px  │  Extra large panels                           │
│  full    │  9999px│  Circles (avatars, dots)                      │
│  pill    │  9999px│  Pill-shaped buttons, tags (same as full)     │
└──────────┴────────┴──────────────────────────────────────────────┘

COMPONENT-SPECIFIC RADIUS:
┌──────────────────────┬──────────────────────────────────────────┐
│  Component           │  Recommended Radius                      │
├──────────────────────┼──────────────────────────────────────────┤
│  Button (sm)         │  md (6-8px) or pill for CTAs             │
│  Button (lg)         │  lg (12px) or pill for hero CTAs         │
│  Input               │  DEFAULT (6px) or md (8px)               │
│  Card                │  lg (12px) or xl (16px)                  │
│  Modal               │  xl (16px) or 2xl (24px)                 │
│  Dropdown            │  md (8px) or lg (12px)                   │
│  Avatar              │  full (circle)                           │
│  Badge / Tag         │  full (pill) or sm (4px)                 │
│  Image               │  lg (12px) or xl (16px)                  │
│  Tooltip             │  md (8px)                                │
│  Toast / Alert       │  lg (12px)                               │
│  Sidebar             │  none (flush to edge)                    │
│  Table               │  lg (12px) on container, none on cells   │
└──────────────────────┴──────────────────────────────────────────┘

BRAND RADIUS DIRECTION:
  Sharp (0-4px)    →  Corporate, enterprise, editorial
  Medium (6-12px)  →  ★ Balanced, modern SaaS (RECOMMENDED)
  Large (16-24px)  →  Friendly, consumer, playful
  Pill (full)      →  Trendy, app-like, very modern
```

---

## 6. Transition and Animation Timing

### 6.1 Duration Scale

```
DURATION TOKENS:
┌──────────┬────────┬──────────────────────────────────────────────┐
│  Token   │  ms    │  Usage                                       │
├──────────┼────────┼──────────────────────────────────────────────┤
│  instant │  0ms   │  No transition (skip animation)              │
│  fastest │  75ms  │  Micro-interactions: checkbox, toggle         │
│  faster  │  100ms │  Small state changes: hover color, opacity   │
│  fast    │  150ms │  ★ Button hover, focus states, icon changes  │
│  normal  │  200ms │  ★ Most UI transitions (DEFAULT)             │
│  relaxed │  300ms │  ★ Dropdowns, tooltips, panels open/close   │
│  slow    │  500ms │  Modals, page transitions, larger movements  │
│  slower  │  700ms │  Complex animations, stagger parent          │
│  slowest │  1000ms│  Full page transitions, hero animations      │
└──────────┴────────┴──────────────────────────────────────────────┘

RULE OF THUMB:
  - Hover/focus: 100-150ms (instant feedback)
  - Show/hide: 200-300ms (visible but not sluggish)
  - Layout shift: 300-500ms (smooth rearrangement)
  - Entrance animations: 500-700ms (dramatic but not slow)
  - Page transitions: 300-500ms (smooth navigation)
```

### 6.2 Easing Functions

```
EASING TOKENS:
┌──────────────────┬──────────────────────────────┬──────────────────────┐
│  Token           │  CSS Value                   │  Usage               │
├──────────────────┼──────────────────────────────┼──────────────────────┤
│  ease-linear     │  linear                      │  Continuous motions  │
│  ease-in         │  cubic-bezier(0.4, 0, 1, 1)  │  Elements leaving    │
│  ease-out        │  cubic-bezier(0, 0, 0.2, 1)  │  ★ Elements entering │
│  ease-in-out     │  cubic-bezier(0.4, 0, 0.2, 1)│  ★ DEFAULT for most │
│  ease-spring     │  cubic-bezier(0.34,1.56,      │  Playful overshoots  │
│                  │   0.64, 1)                    │  (buttons, toggles)  │
│  ease-bounce     │  cubic-bezier(0.34, 1.61,     │  Bouncy (attention)  │
│                  │   0.7, 1)                     │                      │
│  ease-smooth     │  cubic-bezier(0.25, 0.1,      │  Premium, smooth     │
│                  │   0, 1)                       │  (page transitions)  │
│  ease-snappy     │  cubic-bezier(0.2, 0, 0, 1)  │  Quick start, slow   │
│                  │                               │  end (dropdowns)     │
└──────────────────┴──────────────────────────────┴──────────────────────┘

WHICH TO USE WHERE:
  ENTERING the screen:     ease-out (decelerating — natural arrival)
  LEAVING the screen:      ease-in (accelerating — natural departure)
  STATE CHANGES (hover):   ease-in-out (smooth both ways)
  INTERACTIVE (drag/drop): ease-spring (playful feedback)
  PAGE TRANSITIONS:        ease-smooth (premium feel)
  DROPDOWN/POPOVER:        ease-snappy (responsive UI)
```

### 6.3 Framer Motion Presets

```typescript
// src/lib/animations.ts

export const transitions = {
  fast: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
  normal: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  relaxed: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  slow: { duration: 0.5, ease: [0.25, 0.1, 0, 1] },
  spring: { type: "spring", stiffness: 400, damping: 30 },
  springBouncy: { type: "spring", stiffness: 300, damping: 20 },
  springGentle: { type: "spring", stiffness: 200, damping: 25 },
} as const;

export const variants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: transitions.normal },
  },
  fadeInUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: transitions.relaxed },
  },
  fadeInDown: {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: transitions.relaxed },
  },
  fadeInLeft: {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: transitions.relaxed },
  },
  fadeInRight: {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: transitions.relaxed },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: transitions.relaxed },
  },
  slideUp: {
    hidden: { y: "100%" },
    visible: { y: 0, transition: transitions.slow },
  },
  stagger: {
    visible: { transition: { staggerChildren: 0.08 } },
  },
  staggerSlow: {
    visible: { transition: { staggerChildren: 0.15 } },
  },
} as const;
```

---

## 7. Tailwind v4 Theme Config Generator

### 7.1 Complete @theme Directive Example

Tailwind v4 uses CSS-first configuration with the `@theme` directive:

```css
/* src/app/globals.css */

@import "tailwindcss";

@theme {
  /* ========== COLORS ========== */

  /* Primary */
  --color-primary-50: oklch(0.97 0.01 240);
  --color-primary-100: oklch(0.93 0.03 240);
  --color-primary-200: oklch(0.86 0.06 240);
  --color-primary-300: oklch(0.74 0.12 240);
  --color-primary-400: oklch(0.62 0.18 240);
  --color-primary-500: oklch(0.5 0.22 240);
  --color-primary-600: oklch(0.42 0.2 240);
  --color-primary-700: oklch(0.34 0.17 240);
  --color-primary-800: oklch(0.26 0.13 240);
  --color-primary-900: oklch(0.18 0.09 240);
  --color-primary-950: oklch(0.1 0.05 240);

  /* Secondary */
  --color-secondary-50: oklch(0.97 0.01 270);
  --color-secondary-100: oklch(0.93 0.02 270);
  --color-secondary-200: oklch(0.86 0.05 270);
  --color-secondary-300: oklch(0.74 0.1 270);
  --color-secondary-400: oklch(0.62 0.15 270);
  --color-secondary-500: oklch(0.5 0.18 270);
  --color-secondary-600: oklch(0.42 0.16 270);
  --color-secondary-700: oklch(0.34 0.14 270);
  --color-secondary-800: oklch(0.26 0.1 270);
  --color-secondary-900: oklch(0.18 0.07 270);
  --color-secondary-950: oklch(0.1 0.04 270);

  /* Accent */
  --color-accent-50: oklch(0.97 0.01 180);
  --color-accent-100: oklch(0.93 0.03 180);
  --color-accent-200: oklch(0.86 0.06 180);
  --color-accent-300: oklch(0.74 0.1 180);
  --color-accent-400: oklch(0.62 0.14 180);
  --color-accent-500: oklch(0.5 0.16 180);
  --color-accent-600: oklch(0.42 0.14 180);
  --color-accent-700: oklch(0.34 0.12 180);
  --color-accent-800: oklch(0.26 0.08 180);
  --color-accent-900: oklch(0.18 0.06 180);
  --color-accent-950: oklch(0.1 0.03 180);

  /* Neutral (tinted with primary hue) */
  --color-neutral-50: oklch(0.98 0.005 240);
  --color-neutral-100: oklch(0.94 0.005 240);
  --color-neutral-200: oklch(0.87 0.005 240);
  --color-neutral-300: oklch(0.75 0.004 240);
  --color-neutral-400: oklch(0.58 0.003 240);
  --color-neutral-500: oklch(0.48 0.003 240);
  --color-neutral-600: oklch(0.38 0.004 240);
  --color-neutral-700: oklch(0.28 0.005 240);
  --color-neutral-800: oklch(0.18 0.006 240);
  --color-neutral-900: oklch(0.12 0.008 240);
  --color-neutral-950: oklch(0.07 0.01 240);

  /* Semantic */
  --color-success-50: oklch(0.97 0.02 145);
  --color-success-500: oklch(0.55 0.18 145);
  --color-success-700: oklch(0.38 0.14 145);
  --color-success-950: oklch(0.12 0.06 145);

  --color-warning-50: oklch(0.97 0.03 80);
  --color-warning-500: oklch(0.7 0.17 80);
  --color-warning-700: oklch(0.5 0.14 80);
  --color-warning-950: oklch(0.14 0.06 80);

  --color-error-50: oklch(0.97 0.02 25);
  --color-error-500: oklch(0.55 0.2 25);
  --color-error-700: oklch(0.4 0.16 25);
  --color-error-950: oklch(0.12 0.06 25);

  --color-info-50: oklch(0.97 0.02 230);
  --color-info-500: oklch(0.58 0.18 230);
  --color-info-700: oklch(0.4 0.14 230);
  --color-info-950: oklch(0.12 0.06 230);

  /* ========== TYPOGRAPHY ========== */

  --font-sans: "Inter", "system-ui", "-apple-system", "Segoe UI", sans-serif;
  --font-heading: "Geist", "Inter", sans-serif;
  --font-mono: "Geist Mono", "JetBrains Mono", "Fira Code", monospace;

  /* Type Scale (Minor Third 1.2) */
  --text-xs: 0.694rem;
  --text-sm: 0.833rem;
  --text-base: 1rem;
  --text-lg: 1.2rem;
  --text-xl: 1.44rem;
  --text-2xl: 1.728rem;
  --text-3xl: 2.074rem;
  --text-4xl: 2.488rem;
  --text-5xl: 2.986rem;
  --text-6xl: 3.583rem;
  --text-7xl: 4.3rem;
  --text-8xl: 5.16rem;
  --text-9xl: 6.192rem;

  /* ========== SPACING (uses default Tailwind 4px base) ========== */

  /* ========== SHADOWS ========== */

  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.03);
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  --shadow-md:
    0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg:
    0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl:
    0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);

  /* ========== BORDER RADIUS ========== */

  --radius-sm: 0.25rem;
  --radius: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-3xl: 2rem;
  --radius-full: 9999px;

  /* ========== ANIMATIONS ========== */

  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-bounce: cubic-bezier(0.34, 1.61, 0.7, 1);
  --ease-smooth: cubic-bezier(0.25, 0.1, 0, 1);

  --animate-fade-in: fade-in 0.3s var(--ease-out);
  --animate-fade-in-up: fade-in-up 0.4s var(--ease-out);
  --animate-fade-in-down: fade-in-down 0.4s var(--ease-out);
  --animate-scale-in: scale-in 0.2s var(--ease-spring);
  --animate-slide-in-right: slide-in-right 0.3s var(--ease-out);
  --animate-slide-in-left: slide-in-left 0.3s var(--ease-out);
  --animate-slide-up: slide-up 0.3s var(--ease-out);
  --animate-slide-down: slide-down 0.3s var(--ease-out);
  --animate-spin: spin 1s linear infinite;
  --animate-pulse: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  --animate-bounce: bounce 1s infinite;

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fade-in-down {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes scale-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes slide-in-right {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes slide-in-left {
    from {
      transform: translateX(-100%);
    }
    to {
      transform: translateX(0);
    }
  }

  @keyframes slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes slide-down {
    from {
      transform: translateY(-100%);
    }
    to {
      transform: translateY(0);
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse {
    50% {
      opacity: 0.5;
    }
  }

  @keyframes bounce {
    0%,
    100% {
      transform: translateY(-25%);
      animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    50% {
      transform: none;
      animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
  }

  /* ========== BREAKPOINTS ========== */

  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

### 7.2 CSS Custom Properties Strategy

```css
/* Layer semantic tokens on top of primitive tokens */

:root {
  /* Surface colors (semantic) */
  --surface-primary: var(--color-neutral-50);
  --surface-secondary: var(--color-neutral-100);
  --surface-elevated: white;
  --surface-overlay: rgba(0, 0, 0, 0.5);

  /* Text colors (semantic) */
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-600);
  --text-muted: var(--color-neutral-400);
  --text-inverse: white;
  --text-link: var(--color-primary-600);

  /* Border colors (semantic) */
  --border-default: var(--color-neutral-200);
  --border-strong: var(--color-neutral-300);
  --border-focus: var(--color-primary-500);
}

.dark {
  --surface-primary: var(--color-neutral-950);
  --surface-secondary: var(--color-neutral-900);
  --surface-elevated: var(--color-neutral-800);
  --surface-overlay: rgba(0, 0, 0, 0.7);

  --text-primary: var(--color-neutral-100);
  --text-secondary: var(--color-neutral-400);
  --text-muted: var(--color-neutral-500);
  --text-inverse: var(--color-neutral-950);
  --text-link: var(--color-primary-400);

  --border-default: var(--color-neutral-700);
  --border-strong: var(--color-neutral-600);
  --border-focus: var(--color-primary-400);
}
```

---

## 8. Dark Mode Strategy

### 8.1 Implementation Approaches

```
APPROACH 1 — CLASS-BASED TOGGLE (RECOMMENDED):
  <html class="dark">
  Pros: Full user control, works with server rendering
  Cons: Requires JavaScript for toggle

APPROACH 2 — MEDIA QUERY AUTO:
  @media (prefers-color-scheme: dark) { ... }
  Pros: No JS needed, respects system
  Cons: No user override

APPROACH 3 — SYSTEM + MANUAL TOGGLE (BEST):
  Default: follow system preference
  User can override with toggle
  Store preference in localStorage + cookie (for SSR)
  Implementation with next-themes:
```

```typescript
// src/components/theme-provider.tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"           // Uses class="dark" on <html>
      defaultTheme="system"       // Follow system by default
      enableSystem                // Enable system preference detection
      disableTransitionOnChange   // Prevent flash during theme change
      storageKey="trueomni-theme" // localStorage key
    >
      {children}
    </NextThemesProvider>
  );
}
```

### 8.2 Component-Specific Dark Mode Patterns

```
CARDS:
  Light: bg-white border-neutral-200 shadow-sm
  Dark:  bg-neutral-900 border-neutral-700 shadow-none

BUTTONS (Primary):
  Light: bg-primary-600 text-white hover:bg-primary-700
  Dark:  bg-primary-500 text-white hover:bg-primary-400

INPUTS:
  Light: bg-white border-neutral-300
  Dark:  bg-neutral-800 border-neutral-600

NAVIGATION:
  Light: bg-white/80 backdrop-blur border-b border-neutral-200
  Dark:  bg-neutral-950/80 backdrop-blur border-b border-neutral-800

HERO SECTIONS:
  Light: bg-gradient-to-b from-primary-50 to-white
  Dark:  bg-gradient-to-b from-primary-950 to-neutral-950

CODE BLOCKS:
  Light: bg-neutral-100 text-neutral-800
  Dark:  bg-neutral-900 text-neutral-200
```

---

## 9. Design Token Export Formats

### 9.1 JSON Format (Style Dictionary Compatible)

```json
{
  "color": {
    "primary": {
      "50": { "value": "#EFF6FF", "type": "color" },
      "100": { "value": "#DBEAFE", "type": "color" },
      "500": { "value": "#0066FF", "type": "color" },
      "900": { "value": "#1E3A5F", "type": "color" }
    },
    "semantic": {
      "text": {
        "primary": { "value": "{color.neutral.900}", "type": "color" },
        "secondary": { "value": "{color.neutral.600}", "type": "color" }
      },
      "surface": {
        "primary": { "value": "{color.neutral.50}", "type": "color" },
        "elevated": { "value": "#FFFFFF", "type": "color" }
      }
    }
  },
  "typography": {
    "fontSize": {
      "xs": { "value": "0.694rem", "type": "dimension" },
      "base": { "value": "1rem", "type": "dimension" },
      "4xl": { "value": "2.488rem", "type": "dimension" }
    },
    "fontFamily": {
      "sans": { "value": "Inter, system-ui, sans-serif", "type": "fontFamily" },
      "heading": { "value": "Geist, Inter, sans-serif", "type": "fontFamily" }
    }
  },
  "spacing": {
    "1": { "value": "4px", "type": "dimension" },
    "2": { "value": "8px", "type": "dimension" },
    "4": { "value": "16px", "type": "dimension" }
  },
  "borderRadius": {
    "sm": { "value": "4px", "type": "dimension" },
    "md": { "value": "8px", "type": "dimension" },
    "full": { "value": "9999px", "type": "dimension" }
  }
}
```

### 9.2 CSS Custom Properties Format

```css
:root {
  --color-primary-50: #eff6ff;
  --color-primary-500: #0066ff;
  --color-primary-900: #1e3a5f;
  --font-size-xs: 0.694rem;
  --font-size-base: 1rem;
  --spacing-1: 4px;
  --spacing-2: 8px;
  --radius-md: 8px;
}
```

### 9.3 Figma Variables Format (Reference)

```
Figma uses a collection/mode/variable structure:

Collection: "Primitives"
├── Color/Primary/50 = #EFF6FF
├── Color/Primary/500 = #0066FF
├── Spacing/1 = 4
├── Spacing/2 = 8
└── Radius/md = 8

Collection: "Semantic" (references Primitives)
├── Mode: Light
│   ├── Surface/Primary = {Color/Neutral/50}
│   ├── Text/Primary = {Color/Neutral/900}
│   └── Border/Default = {Color/Neutral/200}
├── Mode: Dark
│   ├── Surface/Primary = {Color/Neutral/950}
│   ├── Text/Primary = {Color/Neutral/100}
│   └── Border/Default = {Color/Neutral/700}
```

---

## 10. Complete Example: Full Theme from "#0066FF"

### Input

```
Brand color: #0066FF
Style: Modern SaaS / Professional Tech
Scale: Minor Third (1.2)
Radius: Medium (8px default)
```

### Generated Theme Summary

```
PRIMARY:    #0066FF (hsl 216, 100%, 50%)
SECONDARY:  #7C3AED (hsl 246, 85%, 58%) — analogous +30°
ACCENT:     #06B6D4 (hsl 186, 95%, 42%) — split-complementary
NEUTRALS:   Blue-tinted grays (hue 216, saturation 3-8%)

FONTS:
  Headlines: Geist, weight 700, tracking -0.025em
  Body: Inter, weight 400/500, tracking 0em
  Code: Geist Mono

SCALE: Minor Third (1.2) from 16px base
SPACING: 4px base unit
RADIUS: 8px default, 12px cards, pill CTAs
SHADOWS: Standard Tailwind scale with blue tint
TRANSITIONS: 150ms fast, 200ms normal, 300ms relaxed
DARK MODE: Class-based with next-themes, system default
```

### CSS Output

```css
@import "tailwindcss";

@theme {
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #0066ff;
  --color-primary-600: #0052cc;
  --color-primary-700: #003d99;
  --color-primary-800: #002966;
  --color-primary-900: #001a42;
  --color-primary-950: #000d21;

  --color-secondary-50: #f5f3ff;
  --color-secondary-100: #ede9fe;
  --color-secondary-200: #ddd6fe;
  --color-secondary-300: #c4b5fd;
  --color-secondary-400: #a78bfa;
  --color-secondary-500: #7c3aed;
  --color-secondary-600: #6d28d9;
  --color-secondary-700: #5b21b6;
  --color-secondary-800: #4c1d95;
  --color-secondary-900: #3b0f7a;
  --color-secondary-950: #1e0740;

  --color-accent-50: #ecfeff;
  --color-accent-100: #cffafe;
  --color-accent-200: #a5f3fc;
  --color-accent-300: #67e8f9;
  --color-accent-400: #22d3ee;
  --color-accent-500: #06b6d4;
  --color-accent-600: #0891b2;
  --color-accent-700: #0e7490;
  --color-accent-800: #155e75;
  --color-accent-900: #164e63;
  --color-accent-950: #083344;

  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --font-heading: "Geist", "Inter", sans-serif;
  --font-mono: "Geist Mono", "JetBrains Mono", monospace;

  --text-xs: 0.694rem;
  --text-sm: 0.833rem;
  --text-base: 1rem;
  --text-lg: 1.2rem;
  --text-xl: 1.44rem;
  --text-2xl: 1.728rem;
  --text-3xl: 2.074rem;
  --text-4xl: 2.488rem;
  --text-5xl: 2.986rem;
  --text-6xl: 3.583rem;
  --text-7xl: 4.3rem;

  --radius-sm: 0.25rem;
  --radius: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-2xl: 1.5rem;
  --radius-full: 9999px;
}
```

This theme factory skill provides everything needed to generate a complete, production-ready design system theme from minimal inputs, ensuring consistency, accessibility, and seamless integration with Tailwind v4 and the TrueOmni tech stack.
