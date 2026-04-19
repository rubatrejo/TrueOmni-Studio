---
name: senior-frontend
description: Frontend development skill for the TrueOmni Website 2026 project built with Next.js 15 (App Router), Payload CMS 3 (headless CMS with block-based page builder), Tailwind CSS v4, Framer Motion, and shadcn/ui. Includes component scaffolding, Payload block development, performance optimization, bundle analysis, and UI best practices. Use when developing frontend features, creating Payload CMS blocks, optimizing performance, implementing UI/UX designs, managing state, or reviewing frontend code.
---

# Senior Frontend — TrueOmni Website 2026

Complete toolkit for frontend development on the TrueOmni corporate website redesign. Stack: Next.js 15 + Payload CMS 3 + Tailwind v4 + Framer Motion + shadcn/ui.

## Quick Start

### Main Capabilities

This skill provides three core capabilities through automated scripts:

```bash
# Script 1: Component Generator
python scripts/component_generator.py [options]

# Script 2: Bundle Analyzer
python scripts/bundle_analyzer.py [options]

# Script 3: Frontend Scaffolder
python scripts/frontend_scaffolder.py [options]
```

## Core Capabilities

### 1. Component Generator

Automated tool for component generator tasks.

**Features:**

- Automated scaffolding
- Best practices built-in
- Configurable templates
- Quality checks

**Usage:**

```bash
python scripts/component_generator.py <project-path> [options]
```

### 2. Bundle Analyzer

Comprehensive analysis and optimization tool.

**Features:**

- Deep analysis
- Performance metrics
- Recommendations
- Automated fixes

**Usage:**

```bash
python scripts/bundle_analyzer.py <target-path> [--verbose]
```

### 3. Frontend Scaffolder

Advanced tooling for specialized tasks.

**Features:**

- Expert-level automation
- Custom configurations
- Integration ready
- Production-grade output

**Usage:**

```bash
python scripts/frontend_scaffolder.py [arguments] [options]
```

## Reference Documentation

### React Patterns

Comprehensive guide available in `references/react_patterns.md`:

- Detailed patterns and practices
- Code examples
- Best practices
- Anti-patterns to avoid
- Real-world scenarios

### Nextjs Optimization Guide

Complete workflow documentation in `references/nextjs_optimization_guide.md`:

- Step-by-step processes
- Optimization strategies
- Tool integrations
- Performance tuning
- Troubleshooting guide

### Frontend Best Practices

Technical reference guide in `references/frontend_best_practices.md`:

- Technology stack details
- Configuration examples
- Integration patterns
- Security considerations
- Scalability guidelines

## Tech Stack

**Languages:** TypeScript, JavaScript
**Frontend:** React 19, Next.js 15 (App Router), Tailwind CSS v4, Framer Motion, shadcn/ui
**CMS:** Payload CMS 3 (block-based page builder, Lexical rich text editor, admin dashboard)
**Backend:** Node.js, Next.js API Routes, Payload REST + GraphQL APIs
**Database:** PostgreSQL (via Payload CMS adapter)
**Validation:** Zod
**Forms:** React Hook Form
**Deploy:** Vercel (auto-deploy from GitHub)
**Monitoring:** Vercel Analytics, Vercel Speed Insights, Sentry

## TrueOmni Website Context

### Project Structure

```
src/
├── app/
│   ├── (frontend)/              # Public-facing routes (homepage, product, pricing, etc.)
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Homepage
│   │   ├── product/
│   │   ├── solutions/
│   │   ├── pricing/
│   │   ├── customers/
│   │   ├── resources/
│   │   ├── company/
│   │   ├── demo/
│   │   └── legal/
│   ├── (payload)/admin/         # Payload CMS admin dashboard
│   │   └── [[...segments]]/
│   │       └── page.tsx
│   ├── api/                     # API routes
│   └── globals.css
│
├── blocks/                      # Gutenberg-style page builder blocks
│   ├── Hero/
│   │   ├── config.ts            # Payload CMS block schema definition
│   │   └── Component.tsx        # Frontend React component
│   ├── Features/
│   ├── Pricing/
│   ├── Testimonials/
│   ├── CTA/
│   ├── FAQ/
│   ├── Stats/
│   ├── LogoCloud/
│   ├── RichText/
│   ├── ContactForm/
│   └── index.ts                 # Export all blocks for Payload config
│
├── collections/                 # Payload CMS collections
│   ├── Pages.ts                 # Pages with block-based layout builder
│   ├── Posts.ts                 # Blog posts
│   ├── CaseStudies.ts
│   ├── TeamMembers.ts
│   ├── Testimonials.ts
│   ├── Media.ts                 # Media library
│   └── Users.ts                 # Admin users
│
├── globals/                     # Payload CMS globals (site-wide settings)
│   ├── Header.ts
│   ├── Footer.ts
│   └── SiteSettings.ts
│
├── components/
│   ├── ui/                      # shadcn/ui primitives (Button, Card, etc.)
│   ├── sections/                # Page sections composed from blocks
│   ├── layout/                  # Header, Footer, Navigation
│   └── shared/                  # Reusable across pages
│
├── lib/
│   ├── payload.ts               # Payload client helpers
│   ├── animations.ts            # Framer Motion presets
│   └── utils.ts                 # cn(), formatDate, etc.
│
├── hooks/
└── types/
```

### Payload CMS Block Development Patterns

Each block in `src/blocks/` follows this structure:

#### Block Schema (`config.ts`)

```typescript
import { Block } from 'payload';

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Heroes' },
  imageURL: '/blocks/hero-preview.png', // Preview in admin
  fields: [
    {
      name: 'headline',
      type: 'text',
      required: true,
    },
    {
      name: 'subheadline',
      type: 'textarea',
    },
    {
      name: 'variant',
      type: 'select',
      options: [
        { label: 'With Image', value: 'withImage' },
        { label: 'With Video', value: 'withVideo' },
        { label: 'Minimal', value: 'minimal' },
      ],
      defaultValue: 'withImage',
    },
    {
      name: 'cta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'link', type: 'text' },
      ],
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
    },
  ],
};
```

#### Block Component (`Component.tsx`)

```tsx
'use client';

import { motion } from 'framer-motion';
import type { HeroBlock as HeroBlockType } from '@/payload-types';

export function HeroBlock({ headline, subheadline, variant, cta, backgroundImage }: HeroBlockType) {
  return (
    <section className="relative flex min-h-[80vh] items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-5xl font-bold tracking-tight">{headline}</h1>
        {subheadline && <p className="mt-4 text-xl text-muted-foreground">{subheadline}</p>}
      </motion.div>
    </section>
  );
}
```

#### Registering Blocks in Payload Config

```typescript
// payload.config.ts
import { HeroBlock } from '@/blocks/Hero/config';
import { FeaturesBlock } from '@/blocks/Features/config';
// ... import all blocks

export default buildConfig({
  collections: [
    {
      slug: 'pages',
      fields: [
        {
          name: 'layout',
          type: 'blocks',
          blocks: [HeroBlock, FeaturesBlock /* ... */],
        },
      ],
    },
  ],
});
```

#### Rendering Blocks on Pages

```tsx
// src/app/(frontend)/[slug]/page.tsx
import { HeroBlock } from '@/blocks/Hero/Component';
import { FeaturesBlock } from '@/blocks/Features/Component';

const blockComponents = {
  hero: HeroBlock,
  features: FeaturesBlock,
  // ... map all block slugs to components
};

export default async function Page({ params }) {
  const page = await getPayloadPage(params.slug);
  return (
    <>
      {page.layout?.map((block, i) => {
        const Component = blockComponents[block.blockType];
        return Component ? <Component key={i} {...block} /> : null;
      })}
    </>
  );
}
```

### Key Conventions

- **Server Components by default** — use `'use client'` only when needed (Framer Motion, interactivity)
- **Tailwind v4** — use the new CSS-first configuration, `@theme` directive
- **shadcn/ui** — all primitive components live in `src/components/ui/`
- **Framer Motion** — for all premium animations, define presets in `src/lib/animations.ts`
- **Zod** — for form validation schemas in `src/lib/schemas.ts`
- **TypeScript strict mode** — no `any`, use Payload auto-generated types from `npx payload generate:types`

## Development Workflow

### 1. Setup and Configuration

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Generate Payload CMS types
npx payload generate:types

# Start development server (frontend + CMS admin)
npm run dev
# Frontend: http://localhost:3000
# CMS Admin: http://localhost:3000/admin
```

### 2. Run Quality Checks

```bash
# TypeScript check
npx tsc --noEmit

# Lint
npm run lint

# Build (production)
npm run build
```

### 3. Implement Best Practices

Follow the patterns and practices documented in:

- `references/react_patterns.md`
- `references/nextjs_optimization_guide.md`
- `references/frontend_best_practices.md`

## Best Practices Summary

### Code Quality

- Follow established patterns
- Write comprehensive tests
- Document decisions
- Review regularly

### Performance

- Measure before optimizing
- Use appropriate caching
- Optimize critical paths
- Monitor in production

### Security

- Validate all inputs
- Use parameterized queries
- Implement proper authentication
- Keep dependencies updated

### Maintainability

- Write clear code
- Use consistent naming
- Add helpful comments
- Keep it simple

## Common Commands

```bash
# Development
npm run dev              # Start dev server (frontend + Payload admin)
npm run build            # Production build
npm run lint             # ESLint
npm run lint:fix         # ESLint with auto-fix
npx tsc --noEmit         # TypeScript type check

# Payload CMS
npx payload generate:types    # Regenerate TypeScript types from CMS schemas
npx payload migrate:create    # Create new database migration
npx payload migrate           # Run pending migrations

# Testing
npm run test             # Run all tests
npm run test:watch       # Watch mode

# Analysis
python scripts/bundle_analyzer.py .
python scripts/frontend_scaffolder.py --analyze

# Deployment (Vercel auto-deploys from GitHub)
git push origin main     # Triggers production deploy
```

## Troubleshooting

### Common Issues

Check the comprehensive troubleshooting section in `references/frontend_best_practices.md`.

### Getting Help

- Review reference documentation
- Check script output messages
- Consult tech stack documentation
- Review error logs

## Resources

- Pattern Reference: `references/react_patterns.md`
- Workflow Guide: `references/nextjs_optimization_guide.md`
- Technical Guide: `references/frontend_best_practices.md`
- Tool Scripts: `scripts/` directory
