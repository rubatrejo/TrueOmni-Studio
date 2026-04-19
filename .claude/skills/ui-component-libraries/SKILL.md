---
name: ui-component-libraries
description: "UI component libraries reference: Aceternity UI, Magic UI, Origin UI, Animata, Lunar UI, Tremor. Use when building animated components, landing pages, dashboards, charts, bento grids, hero sections, marquees, cards, or any visual UI element. Triggers: aceternity, magic ui, origin ui, animata, lunar ui, tremor, animated component, landing page component, bento grid, marquee, hero section, chart component, dashboard component, 3d card, spotlight, parallax scroll, text reveal, sparkles, meteor, globe."
---

# UI Component Libraries

Reference for 6 installed UI component libraries. All compatible with React + Next.js + Tailwind CSS + shadcn/ui.

## 1. Aceternity UI

**Type:** shadcn registry
**Site:** https://ui.aceternity.com/
**Best for:** Animated effects, 3D cards, spotlights, parallax, text reveals, hero sections

### Install components

```bash
# Single component
npx shadcn@latest add "https://ui.aceternity.com/registry/[component-name].json"

# With registry alias (configured in components.json)
npx shadcn@latest add @aceternity/[component-name]
```

### Popular components

- `3d-card-effect` - Interactive 3D card with hover
- `bento-grid` - Bento grid layout
- `spotlight` - Spotlight cursor effect
- `text-generate-effect` - Text typing animation
- `meteor-effect` - Falling meteors background
- `moving-border` - Animated gradient border
- `parallax-scroll` - Parallax scrolling images
- `sparkles` - Sparkle particle effects
- `lamp` - Lamp/glow effect
- `hero-highlight` - Highlighted hero text
- `floating-navbar` - Animated sticky navbar
- `infinite-moving-cards` - Infinite scroll testimonials
- `tracing-beam` - Scroll tracing beam effect
- `wavy-background` - Animated wavy background
- `aurora-background` - Northern lights background

### Peer deps

```bash
npm install motion clsx tailwind-merge react-icons
```

---

## 2. Magic UI

**Type:** shadcn registry
**Site:** https://magicui.design/
**Best for:** Landing page components, animated counters, marquees, particles, globe

### Install components

```bash
npx shadcn@latest add "https://magicui.design/r/[component-name]"

# With registry alias
npx shadcn@latest add @magicui/[component-name]
```

### Popular components

- `bento-grid` - Bento grid layout
- `marquee` - Infinite scrolling marquee
- `animated-beam` - Animated connection beams
- `border-beam` - Animated border beam
- `magic-card` - Interactive hover card
- `meteors` - Meteor shower effect
- `number-ticker` - Animated number counter
- `particles` - Particle background
- `globe` - 3D interactive globe
- `dock` - macOS-style dock
- `shimmer-button` - Shimmer effect button
- `animated-list` - Staggered list animation
- `confetti` - Confetti celebration
- `ripple` - Ripple effect background
- `retro-grid` - Retro grid background

---

## 3. Origin UI

**Type:** shadcn registry
**Site:** https://originui.com/
**Best for:** Production-ready form inputs, buttons, selects, modals, navigation, tables

### Install components

```bash
npx shadcn@latest add "https://originui.com/r/[comp-id].json"

# With registry alias
npx shadcn@latest add @originui/[comp-id]
```

### Component categories

- Inputs (text, number, password, search, file)
- Buttons (variants, loading states, icon buttons)
- Selects & dropdowns
- Checkboxes & radios
- Modals & dialogs
- Navigation (tabs, breadcrumbs, pagination)
- Tables & data display
- Notifications & toasts
- Avatars & badges
- Sliders & toggles

---

## 4. Animata

**Type:** Copy-paste only
**Site:** https://animata.design/
**Best for:** Micro-interactions, hover effects, scroll animations, text effects

### Setup

```bash
npm install tailwind-merge clsx lucide-react tailwindcss-animate
```

### Usage

Copy component code directly from https://animata.design/ into your `/components` directory. No CLI or registry.

### Popular components

- Text animations (typewriter, fade, reveal)
- Card hover effects
- Button interactions
- Loading animations
- Scroll-triggered animations
- Background effects
- Container animations

---

## 5. Lunar UI

**Type:** Paid ($59), copy-paste
**Site:** https://lunarui.dev/
**Best for:** Premium Tailwind components for React and Vue

### Access

Purchase at https://store.lunarui.dev/ then copy-paste into project.

---

## 6. Tremor

**Type:** npm package (legacy) + copy-paste (Tremor Raw)
**Site:** https://www.tremor.so/
**Best for:** Charts, dashboards, analytics, KPIs, data visualization

### npm install (legacy v3)

```bash
npm install @tremor/react
# Note: requires React 18. Use --legacy-peer-deps for React 19
```

### Tremor Raw (modern, copy-paste)

```bash
npm install tailwind-variants clsx tailwind-merge @remixicon/react recharts
```

Then copy components from https://tremor.so/

### Key components

- `AreaChart` - Area charts
- `BarChart` - Bar charts
- `LineChart` - Line charts
- `DonutChart` - Donut/pie charts
- `Tracker` - Status tracker
- `SparkChart` - Inline spark charts
- `BarList` - Horizontal bar list
- `KPI cards` - Key performance indicators
- `Tables` - Data tables with sorting

### Usage (npm version)

```tsx
import { AreaChart, Card, Title } from "@tremor/react";

<Card>
  <Title>Revenue over time</Title>
  <AreaChart
    data={chartData}
    index="date"
    categories={["Revenue", "Expenses"]}
    colors={["blue", "red"]}
  />
</Card>;
```

---

## Registry Aliases (components.json)

These are configured in `components.json` for quick installs:

```json
{
  "registries": {
    "@aceternity": "https://ui.aceternity.com/registry/{name}.json",
    "@magicui": "https://magicui.design/r/{name}",
    "@originui": "https://originui.com/r/{name}.json"
  }
}
```

## Choosing the Right Library

| Need                                        | Library       |
| ------------------------------------------- | ------------- |
| Animated hero/landing sections              | Aceternity UI |
| Landing page blocks (marquee, globe, beams) | Magic UI      |
| Production form inputs & buttons            | Origin UI     |
| Micro-interactions & hover effects          | Animata       |
| Charts & analytics dashboards               | Tremor        |
| Premium polished components                 | Lunar UI      |

## TrueOmni Website — Recommended Components

Mapping of TrueOmni website page sections to specific components from the libraries above. Use these as the starting point when building each block in `src/blocks/`.

### Homepage

| Section                   | Library       | Component               | Install                                                   |
| ------------------------- | ------------- | ----------------------- | --------------------------------------------------------- |
| Hero Background           | Aceternity UI | `aurora-background`     | `npx shadcn@latest add @aceternity/aurora-background`     |
| Hero Text Animation       | Aceternity UI | `hero-highlight`        | `npx shadcn@latest add @aceternity/hero-highlight`        |
| Logo Cloud / Client Logos | Magic UI      | `marquee`               | `npx shadcn@latest add @magicui/marquee`                  |
| Features Overview         | Magic UI      | `bento-grid`            | `npx shadcn@latest add @magicui/bento-grid`               |
| Features (alt)            | Aceternity UI | `3d-card-effect`        | `npx shadcn@latest add @aceternity/3d-card-effect`        |
| Stats / Metrics           | Magic UI      | `number-ticker`         | `npx shadcn@latest add @magicui/number-ticker`            |
| Testimonials              | Aceternity UI | `infinite-moving-cards` | `npx shadcn@latest add @aceternity/infinite-moving-cards` |
| CTA Section Button        | Magic UI      | `shimmer-button`        | `npx shadcn@latest add @magicui/shimmer-button`           |
| CTA Connection Visual     | Magic UI      | `animated-beam`         | `npx shadcn@latest add @magicui/animated-beam`            |

### Navigation & Layout

| Section           | Library       | Component                              | Install                                                           |
| ----------------- | ------------- | -------------------------------------- | ----------------------------------------------------------------- |
| Sticky Navigation | Aceternity UI | `floating-navbar`                      | `npx shadcn@latest add @aceternity/floating-navbar`               |
| Footer            | Origin UI     | Standard navigation + input components | `npx shadcn@latest add @originui/input @originui/navigation-menu` |

### Product / Platform Page

| Section           | Library       | Component       | Install                                          |
| ----------------- | ------------- | --------------- | ------------------------------------------------ |
| Feature Cards     | Magic UI      | `magic-card`    | `npx shadcn@latest add @magicui/magic-card`      |
| Feature Bento     | Magic UI      | `bento-grid`    | `npx shadcn@latest add @magicui/bento-grid`      |
| Integration Beams | Magic UI      | `animated-beam` | `npx shadcn@latest add @magicui/animated-beam`   |
| Scroll Experience | Aceternity UI | `tracing-beam`  | `npx shadcn@latest add @aceternity/tracing-beam` |

### Pricing Page

| Section                | Library   | Component                   | Install                                         |
| ---------------------- | --------- | --------------------------- | ----------------------------------------------- |
| Pricing Table          | Origin UI | Tables + comparison layouts | `npx shadcn@latest add @originui/table`         |
| Pricing CTA Button     | Magic UI  | `shimmer-button`            | `npx shadcn@latest add @magicui/shimmer-button` |
| Price Toggle Animation | npm       | `number-flow`               | `npm install number-flow`                       |
| FAQ Section            | Origin UI | Accordion components        | `npx shadcn@latest add @originui/accordion`     |

### Customers / Case Studies

| Section            | Library       | Component               | Install                                                   |
| ------------------ | ------------- | ----------------------- | --------------------------------------------------------- |
| Case Study Cards   | Magic UI      | `magic-card`            | `npx shadcn@latest add @magicui/magic-card`               |
| Metrics Display    | Magic UI      | `number-ticker`         | `npx shadcn@latest add @magicui/number-ticker`            |
| Testimonial Quotes | Aceternity UI | `infinite-moving-cards` | `npx shadcn@latest add @aceternity/infinite-moving-cards` |

### Blog

| Section          | Library       | Component      | Install                                          |
| ---------------- | ------------- | -------------- | ------------------------------------------------ |
| Blog Post Cards  | Magic UI      | `magic-card`   | `npx shadcn@latest add @magicui/magic-card`      |
| Reading Progress | Aceternity UI | `tracing-beam` | `npx shadcn@latest add @aceternity/tracing-beam` |

### Company / About

| Section            | Library       | Component        | Install                                            |
| ------------------ | ------------- | ---------------- | -------------------------------------------------- |
| Team Member Cards  | Aceternity UI | `3d-card-effect` | `npx shadcn@latest add @aceternity/3d-card-effect` |
| Company Stats      | Magic UI      | `number-ticker`  | `npx shadcn@latest add @magicui/number-ticker`     |
| Timeline / History | Aceternity UI | `tracing-beam`   | `npx shadcn@latest add @aceternity/tracing-beam`   |

### Demo / Contact

| Section           | Library   | Component                          | Install                                                  |
| ----------------- | --------- | ---------------------------------- | -------------------------------------------------------- |
| Form Inputs       | Origin UI | Input, select, textarea components | `npx shadcn@latest add @originui/input @originui/select` |
| Submit Button     | Magic UI  | `shimmer-button`                   | `npx shadcn@latest add @magicui/shimmer-button`          |
| Success Animation | Magic UI  | `confetti`                         | `npx shadcn@latest add @magicui/confetti`                |

### Background Effects (usable on any page)

| Effect                   | Library       | Component           | Install                                               |
| ------------------------ | ------------- | ------------------- | ----------------------------------------------------- |
| Aurora / Northern Lights | Aceternity UI | `aurora-background` | `npx shadcn@latest add @aceternity/aurora-background` |
| Wavy Background          | Aceternity UI | `wavy-background`   | `npx shadcn@latest add @aceternity/wavy-background`   |
| Retro Grid               | Magic UI      | `retro-grid`        | `npx shadcn@latest add @magicui/retro-grid`           |
| Particles                | Magic UI      | `particles`         | `npx shadcn@latest add @magicui/particles`            |
| Dot Pattern              | Magic UI      | `dot-pattern`       | `npx shadcn@latest add @magicui/dot-pattern`          |
| Spotlight                | Aceternity UI | `spotlight`         | `npx shadcn@latest add @aceternity/spotlight`         |
