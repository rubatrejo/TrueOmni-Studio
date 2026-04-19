---
name: shadcn-awesome-libs
description: 'Curated shadcn/ui component libraries and registry references. Use when building UI with shadcn/ui, React, Next.js, Tailwind CSS. Triggers: shadcn component, ui component, form builder, data table, file upload, date picker, phone input, image cropper, drag and drop, spinner, loading, rich text editor, kanban, charts, dashboard, landing page, animation.'
---

# Shadcn/ui Awesome Libraries Reference

Curated selection of the best shadcn/ui compatible libraries for Next.js + React + Tailwind + TypeScript projects.

## NPM Packages (install with npm/yarn)

### Core Components

| Package        | Install                      | Description                                            |
| -------------- | ---------------------------- | ------------------------------------------------------ |
| vaul           | `npm install vaul`           | Drawer component - dialog on desktop, drawer on mobile |
| novel          | `npm install novel`          | Notion-style WYSIWYG editor with AI autocompletion     |
| @udecode/plate | `npm install @udecode/plate` | Powerful AI-enabled rich-text editor framework         |
| number-flow    | `npm install number-flow`    | Animated number transitions for stats/counters         |
| next-stepper   | `npm install next-stepper`   | Dynamic multi-step forms with validation               |

### React 18 Only (use --legacy-peer-deps with React 19)

| Package       | Install                     | Description                       |
| ------------- | --------------------------- | --------------------------------- |
| emblor        | `npm install emblor`        | Customizable accessible tag input |
| @tremor/react | `npm install @tremor/react` | Charts and dashboard components   |

## Shadcn Registry Components (copy-paste / CLI)

### Forms & Inputs

| Component          | Source                                                      | Usage                                                                                                                                                  |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| auto-form          | https://github.com/vantezzen/auto-form                      | Auto-generates shadcn forms from Zod schemas. `npx shadcn@latest add https://raw.githubusercontent.com/vantezzen/autoform/main/registry/autoform.json` |
| shadcn-phone-input | https://github.com/omeralpi/shadcn-phone-input              | Phone input with country flag and validation                                                                                                           |
| date-range-picker  | https://github.com/johnpolacek/date-range-picker-for-shadcn | Multi-month date range picker with presets                                                                                                             |

### Tables & Data

| Component       | Source                                   | Usage                                                              |
| --------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| shadcn-table-v2 | https://github.com/sadmann7/shadcn-table | Advanced DataTable with server-side sorting, filtering, pagination |

### Media & Files

| Component            | Source                                          | Usage                                        |
| -------------------- | ----------------------------------------------- | -------------------------------------------- |
| file-uploader        | https://github.com/sadmann7/file-uploader       | File upload with react-dropzone and progress |
| shadcn-image-cropper | https://github.com/sujjeee/shadcn-image-cropper | Image cropping with react-image-crop         |

### Modals & Overlays

| Component | Source                                    | Usage                                                                         |
| --------- | ----------------------------------------- | ----------------------------------------------------------------------------- |
| credenza  | https://github.com/redpangilinan/credenza | Responsive modal - auto switches between Dialog (desktop) and Drawer (mobile) |

### Drag & Drop

| Component                        | Source                                                          | Usage                                |
| -------------------------------- | --------------------------------------------------------------- | ------------------------------------ |
| react-dnd-kit-tailwind-shadcn-ui | https://github.com/Georgegriff/react-dnd-kit-tailwind-shadcn-ui | Accessible Kanban board with dnd-kit |

### Loading & Feedback

| Component      | Source                                           | Usage                     |
| -------------- | ------------------------------------------------ | ------------------------- |
| shadcn-spinner | https://github.com/allipiopereira/shadcn-spinner | Spinner/loading component |

## Animation & Landing Page Libraries

| Library | Source                 | Usage                                                                                                              |
| ------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| magicui | https://magicui.design | Animated landing page components. Install via: `npx shadcn@latest add "https://magicui.design/r/[component-name]"` |
| animata | https://animata.design | Hand-crafted interaction animations. Copy from site.                                                               |

## Usage Patterns

### Auto-form with Zod (most useful for CMS)

```tsx
import AutoForm from '@autoform/react';
import { ZodProvider } from '@autoform/zod';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['admin', 'user', 'viewer']),
});

<AutoForm schema={schema} onSubmit={handleSubmit} />;
```

### Vaul Drawer

```tsx
import { Drawer } from 'vaul';

<Drawer.Root>
  <Drawer.Trigger>Open</Drawer.Trigger>
  <Drawer.Content>
    <Drawer.Title>Title</Drawer.Title>
    {/* content */}
  </Drawer.Content>
</Drawer.Root>;
```

### Novel Editor

```tsx
import { Editor } from 'novel';

<Editor defaultValue={content} onUpdate={handleUpdate} />;
```

### Number Flow

```tsx
import NumberFlow from 'number-flow';

<NumberFlow value={1234} format={{ style: 'currency', currency: 'USD' }} />;
```

## Full Awesome List Reference

For the complete list of 700+ shadcn/ui resources: https://github.com/birobirobiro/awesome-shadcn-ui

## Corporate Website Components

Components most relevant for the TrueOmni corporate website (trueomni.com):

### Pricing Comparison Tables

| Component        | Source                                   | Usage                                                     |
| ---------------- | ---------------------------------------- | --------------------------------------------------------- |
| Origin UI tables | `npx shadcn@latest add @originui/table`  | Production-ready data tables for plan comparison          |
| shadcn-table-v2  | https://github.com/sadmann7/shadcn-table | Advanced tables with sorting for feature comparison grids |
| number-flow      | `npm install number-flow`                | Animated price transitions when toggling monthly/annual   |

### Feature Comparison Grids

| Component                 | Source                                             | Usage                                        |
| ------------------------- | -------------------------------------------------- | -------------------------------------------- |
| Magic UI bento-grid       | `npx shadcn@latest add @magicui/bento-grid`        | Bento grid layout for feature showcases      |
| Aceternity 3d-card-effect | `npx shadcn@latest add @aceternity/3d-card-effect` | Interactive 3D cards for individual features |

### Testimonial Carousels

| Component                        | Source                                                    | Usage                                             |
| -------------------------------- | --------------------------------------------------------- | ------------------------------------------------- |
| Aceternity infinite-moving-cards | `npx shadcn@latest add @aceternity/infinite-moving-cards` | Auto-scrolling testimonial carousel               |
| Magic UI marquee                 | `npx shadcn@latest add @magicui/marquee`                  | Infinite scrolling marquee for testimonial strips |

### Hero Section Builders

| Component                    | Source                                                | Usage                                   |
| ---------------------------- | ----------------------------------------------------- | --------------------------------------- |
| Aceternity aurora-background | `npx shadcn@latest add @aceternity/aurora-background` | Northern lights animated background     |
| Aceternity hero-highlight    | `npx shadcn@latest add @aceternity/hero-highlight`    | Highlighted hero text with animation    |
| Aceternity lamp              | `npx shadcn@latest add @aceternity/lamp`              | Dramatic lamp glow effect for headlines |
| Aceternity spotlight         | `npx shadcn@latest add @aceternity/spotlight`         | Cursor-following spotlight effect       |
| Magic UI particles           | `npx shadcn@latest add @magicui/particles`            | Particle background for hero sections   |

### Contact Form Components

| Component          | Source                                                                                                   | Usage                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| auto-form          | `npx shadcn@latest add https://raw.githubusercontent.com/vantezzen/autoform/main/registry/autoform.json` | Auto-generates forms from Zod schemas (demo request, contact) |
| shadcn-phone-input | https://github.com/omeralpi/shadcn-phone-input                                                           | Phone input with country flags for contact forms              |
| next-stepper       | `npm install next-stepper`                                                                               | Multi-step demo request forms                                 |

### Newsletter Signup

| Component               | Source                                          | Usage                                             |
| ----------------------- | ----------------------------------------------- | ------------------------------------------------- |
| Origin UI inputs        | `npx shadcn@latest add @originui/input`         | Polished email input fields                       |
| Magic UI shimmer-button | `npx shadcn@latest add @magicui/shimmer-button` | Eye-catching subscribe button with shimmer effect |

### Logo Cloud / Marquee

| Component        | Source                                   | Usage                                                  |
| ---------------- | ---------------------------------------- | ------------------------------------------------------ |
| Magic UI marquee | `npx shadcn@latest add @magicui/marquee` | Infinite scrolling logo cloud for client/partner logos |

### Stats / Metrics Displays

| Component              | Source                                         | Usage                                        |
| ---------------------- | ---------------------------------------------- | -------------------------------------------- |
| number-flow            | `npm install number-flow`                      | Animated number counters for stats sections  |
| Magic UI number-ticker | `npx shadcn@latest add @magicui/number-ticker` | Animated number tickers for KPIs             |
| @tremor/react          | `npm install @tremor/react`                    | Charts and KPI cards for data-heavy sections |

### Team Member Cards

| Component                 | Source                                             | Usage                                    |
| ------------------------- | -------------------------------------------------- | ---------------------------------------- |
| Aceternity 3d-card-effect | `npx shadcn@latest add @aceternity/3d-card-effect` | Interactive team member cards with hover |
| Magic UI magic-card       | `npx shadcn@latest add @magicui/magic-card`        | Hover effect cards for team grid         |

### FAQ Accordions

| Component            | Source                                      | Usage                                                      |
| -------------------- | ------------------------------------------- | ---------------------------------------------------------- |
| shadcn Accordion     | Built into shadcn/ui                        | `npx shadcn@latest add accordion` — standard FAQ component |
| Origin UI accordions | `npx shadcn@latest add @originui/accordion` | Enhanced accordion variants                                |

### Navigation

| Component                  | Source                                              | Usage                                         |
| -------------------------- | --------------------------------------------------- | --------------------------------------------- |
| Aceternity floating-navbar | `npx shadcn@latest add @aceternity/floating-navbar` | Animated sticky navbar that appears on scroll |
| Origin UI navigation       | `npx shadcn@latest add @originui/navigation-menu`   | Production-ready mega menu and nav items      |

## Payload CMS Integration

### Using shadcn Components Inside Payload Blocks

Payload CMS 3 blocks render as React components on the frontend. shadcn/ui components integrate directly:

```tsx
// src/blocks/CTA/Component.tsx
'use client';

import { Button } from '@/components/ui/button'; // shadcn button
import { motion } from 'framer-motion';
import type { CTABlock as CTABlockType } from '@/payload-types';

export function CTABlock({ headline, description, buttonLabel, buttonLink }: CTABlockType) {
  return (
    <section className="py-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-4xl font-bold">{headline}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">{description}</p>
        <Button asChild size="lg" className="mt-8">
          <a href={buttonLink}>{buttonLabel}</a>
        </Button>
      </motion.div>
    </section>
  );
}
```

### Pattern for Forms in Payload Blocks

Use auto-form with Zod schemas for CMS-driven forms:

```tsx
// src/blocks/ContactForm/Component.tsx
'use client';

import AutoForm from '@autoform/react';
import { ZodProvider } from '@autoform/zod';
import { contactSchema } from '@/lib/schemas';

export function ContactFormBlock({ title, description }: ContactFormBlockType) {
  return (
    <section className="mx-auto max-w-2xl py-24">
      <h2 className="text-3xl font-bold">{title}</h2>
      <p className="mt-2 text-muted-foreground">{description}</p>
      <div className="mt-8">
        <AutoForm schema={contactSchema} onSubmit={handleSubmit} />
      </div>
    </section>
  );
}
```

### Key Integration Rules

1. **All shadcn primitives live in `src/components/ui/`** — imported by blocks and page components
2. **Blocks are `'use client'`** only when they need interactivity (forms, animations, hover effects)
3. **Static blocks remain Server Components** for better performance (RichText, simple content blocks)
4. **Framer Motion** wraps shadcn components for entrance animations in blocks
5. **Payload auto-generates TypeScript types** — run `npx payload generate:types` after schema changes
