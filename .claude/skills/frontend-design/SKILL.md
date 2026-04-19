# Frontend Design Skill

---

name: frontend-design
description: Production-quality frontend interface design and implementation patterns for Next.js 15 + React 19 + Tailwind CSS v4 + Framer Motion + shadcn/ui + Payload CMS 3. Covers component architecture, animation presets, responsive design, accessibility, performance, and block-based page builder patterns.
triggers:

- Building or refactoring UI components
- Implementing animations or micro-interactions
- Creating page layouts or section blocks
- Optimizing performance (Core Web Vitals)
- Deciding Server vs Client components
- Implementing responsive or dark mode design
- Building Payload CMS block components
- Setting up Tailwind v4 configuration
- Implementing accessibility features

---

## Purpose

This skill provides the complete frontend implementation reference for the TrueOmni website. It covers every aspect of translating design into production-quality code using the project's specific stack: Next.js 15 (App Router), React 19, Tailwind CSS v4, Framer Motion, shadcn/ui, and Payload CMS 3.

---

## 1. Component Architecture: Atomic Design for React

### Hierarchy

```
ATOMS (src/components/ui/)
│  Smallest, most reusable building blocks.
│  Built on shadcn/ui primitives. No business logic.
│  Examples: Button, Badge, Input, Avatar, Separator, Skeleton
│
├── MOLECULES (src/components/shared/)
│   Composed of 2+ atoms working together.
│   May have minimal internal state. Reusable across pages.
│   Examples: SearchInput, NavLink, TestimonialCard, StatCard, PricingToggle
│
├── ORGANISMS (src/blocks/ or src/components/sections/)
│   Complex UI sections with business logic.
│   Composed of molecules and atoms.
│   Often correspond to Payload CMS blocks.
│   Examples: HeroSection, PricingTable, TestimonialCarousel, FeatureGrid
│
├── TEMPLATES (src/components/layout/)
│   Page-level layout structures.
│   Define the skeleton: header, footer, sidebar, content area.
│   Examples: DefaultLayout, LandingLayout, BlogLayout, DocsLayout
│
└── PAGES (src/app/(frontend)/)
    Next.js App Router pages.
    Compose templates with organisms.
    Handle data fetching (Server Components).
    Examples: page.tsx, /pricing/page.tsx, /blog/[slug]/page.tsx
```

### File Structure Convention

```
src/components/ui/button.tsx          ← Atom (shadcn/ui base)
src/components/ui/badge.tsx           ← Atom
src/components/ui/input.tsx           ← Atom
src/components/shared/stat-card.tsx   ← Molecule
src/components/shared/nav-link.tsx    ← Molecule
src/components/shared/logo-cloud.tsx  ← Molecule
src/components/sections/hero.tsx      ← Organism (non-CMS section)
src/components/layout/header.tsx      ← Template part
src/components/layout/footer.tsx      ← Template part
src/components/layout/default-layout.tsx ← Template

src/blocks/Hero/Component.tsx         ← Organism (CMS block)
src/blocks/Hero/config.ts            ← Payload schema
src/blocks/Features/Component.tsx     ← Organism (CMS block)
src/blocks/Features/config.ts        ← Payload schema
```

### Component Template

```tsx
// Standard component template
// File: src/components/ui/example.tsx

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';

const exampleVariants = cva(
  // Base classes (always applied)
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input bg-background hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
);

interface ExampleProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof exampleVariants> {
  /** Whether the component is in a loading state */
  isLoading?: boolean;
}

const Example = forwardRef<HTMLDivElement, ExampleProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(exampleVariants({ variant, size }), className)} {...props}>
        {isLoading ? <Skeleton /> : children}
      </div>
    );
  },
);
Example.displayName = 'Example';

export { Example, exampleVariants };
export type { ExampleProps };
```

---

## 2. Framer Motion Animation Presets & Patterns

### Basic Animation Presets

```tsx
// src/lib/animations.ts
// Reusable animation presets for Framer Motion

// ============================================================
// FADE ANIMATIONS
// ============================================================

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.5, ease: 'easeOut' },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.5, ease: 'easeOut' },
};

export const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.5, ease: 'easeOut' },
};

export const fadeInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.5, ease: 'easeOut' },
};

// ============================================================
// SCALE ANIMATIONS
// ============================================================

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.3, ease: 'easeOut' },
};

export const scaleInBounce = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.8 },
  transition: { type: 'spring', stiffness: 300, damping: 20 },
};

export const popIn = {
  initial: { opacity: 0, scale: 0.5 },
  animate: { opacity: 1, scale: 1 },
  transition: { type: 'spring', stiffness: 400, damping: 15 },
};

// ============================================================
// SLIDE ANIMATIONS
// ============================================================

export const slideInFromLeft = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-100%', opacity: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

export const slideInFromRight = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '100%', opacity: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

export const slideInFromBottom = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '100%', opacity: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

export const slideInFromTop = {
  initial: { y: '-100%', opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: '-100%', opacity: 0 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
};

// ============================================================
// STAGGER ANIMATIONS
// ============================================================

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerSlow = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

export const staggerItemFromLeft = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

// ============================================================
// SCROLL-TRIGGERED ANIMATIONS
// ============================================================

// Use with whileInView prop on motion components
export const scrollFadeUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: 'easeOut' },
};

export const scrollFadeIn = {
  initial: { opacity: 0 },
  whileInView: { opacity: 1 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.8, ease: 'easeOut' },
};

export const scrollScaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: 'easeOut' },
};

export const scrollSlideInLeft = {
  initial: { opacity: 0, x: -60 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.7, ease: 'easeOut' },
};

export const scrollSlideInRight = {
  initial: { opacity: 0, x: 60 },
  whileInView: { opacity: 1, x: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.7, ease: 'easeOut' },
};

// ============================================================
// LAYOUT ANIMATIONS
// ============================================================

// For AnimatePresence + layout prop
export const layoutTransition = {
  layout: true,
  transition: {
    layout: { type: 'spring', stiffness: 300, damping: 30 },
  },
};

// Shared layout animation ID generator
export const createLayoutId = (prefix: string, id: string | number) => `${prefix}-${id}`;

// ============================================================
// GESTURE ANIMATIONS
// ============================================================

export const buttonTap = {
  whileTap: { scale: 0.98 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
};

export const cardHover = {
  whileHover: { y: -4, transition: { duration: 0.2 } },
};

export const imageHover = {
  whileHover: { scale: 1.05, transition: { duration: 0.3 } },
};

export const linkHover = {
  whileHover: { x: 4, transition: { duration: 0.2 } },
};

// ============================================================
// EXIT ANIMATIONS
// ============================================================

export const exitFade = {
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const exitSlideDown = {
  exit: { y: 20, opacity: 0, transition: { duration: 0.3 } },
};

export const exitScaleOut = {
  exit: { scale: 0.95, opacity: 0, transition: { duration: 0.2 } },
};

// ============================================================
// REDUCED MOTION HELPER
// ============================================================

export const getReducedMotionPreset = (animation: Record<string, unknown>) => {
  // Returns a no-op animation for users who prefer reduced motion
  // Use with useReducedMotion() hook from framer-motion
  return {
    initial: {},
    animate: {},
    exit: {},
    transition: { duration: 0 },
  };
};
```

### Usage Patterns

```tsx
// Pattern 1: Scroll-triggered section with staggered children
'use client';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, scrollFadeUp } from '@/lib/animations';

function FeatureSection({ features }) {
  return (
    <motion.section {...scrollFadeUp}>
      <h2>Features</h2>
      <motion.div
        variants={staggerContainer}
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, margin: '-100px' }}
        className="grid grid-cols-1 gap-8 md:grid-cols-3"
      >
        {features.map((feature) => (
          <motion.div key={feature.id} variants={staggerItem}>
            <FeatureCard {...feature} />
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}

// Pattern 2: AnimatePresence for mount/unmount animations
import { AnimatePresence } from 'framer-motion';

function Modal({ isOpen, onClose, children }) {
  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-40 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            key="modal"
            className="fixed inset-0 z-50 flex items-center justify-center"
            {...scaleIn}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Pattern 3: Shared layout animation (tabs, toggles)
import { LayoutGroup } from 'framer-motion';

function Tabs({ items, activeId, onChange }) {
  return (
    <LayoutGroup>
      <div className="flex gap-2">
        {items.map((item) => (
          <button key={item.id} onClick={() => onChange(item.id)}>
            {item.label}
            {activeId === item.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
    </LayoutGroup>
  );
}

// Pattern 4: Counter animation (for stats)
import { useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';

function AnimatedCounter({ value, suffix = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));

  useEffect(() => {
    if (isInView) {
      animate(count, value, { duration: 2, ease: 'easeOut' });
    }
  }, [isInView, value, count]);

  return (
    <span ref={ref}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

// Pattern 5: Reduced motion support
import { useReducedMotion } from 'framer-motion';

function AnimatedSection({ children }) {
  const prefersReducedMotion = useReducedMotion();

  const animation = prefersReducedMotion ? { initial: {}, animate: {} } : scrollFadeUp;

  return <motion.div {...animation}>{children}</motion.div>;
}
```

---

## 3. Tailwind CSS v4 Patterns

### New @theme Directive (Tailwind v4)

```css
/* src/app/globals.css */

/* Tailwind v4 uses @theme instead of tailwind.config.ts for theming */
@import 'tailwindcss';

@theme {
  /* Colors - Design System */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;
  --color-primary-950: #172554;

  /* Semantic Colors */
  --color-background: #ffffff;
  --color-foreground: #0f172a;
  --color-muted: #f1f5f9;
  --color-muted-foreground: #64748b;
  --color-border: #e2e8f0;
  --color-ring: #3b82f6;

  /* Typography */
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-heading: 'Space Grotesk', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'Geist Mono', ui-monospace, monospace;

  /* Custom spacing */
  --spacing-section: 6rem;
  --spacing-section-lg: 8rem;

  /* Container */
  --container-max-width: 80rem;

  /* Animations */
  --animate-fade-in: fade-in 0.5s ease-out;
  --animate-fade-in-up: fade-in-up 0.5s ease-out;
  --animate-slide-in: slide-in 0.4s ease-out;

  /* Shadows */
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-card-hover: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

/* Dark mode overrides */
@theme dark {
  --color-background: #0f172a;
  --color-foreground: #f8fafc;
  --color-muted: #1e293b;
  --color-muted-foreground: #94a3b8;
  --color-border: #334155;
}

/* Keyframe definitions */
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
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(0);
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Container Queries (Tailwind v4)

```tsx
// Container queries allow components to respond to their container size
// instead of the viewport — perfect for reusable blocks

// Parent: mark as container
<div className="@container">
  <Card />
</div>;

// Child: respond to container width
function Card() {
  return (
    <div className="@md:flex-row @lg:gap-8 flex flex-col gap-4">
      <div className="@md:w-1/3">
        <Image />
      </div>
      <div className="@md:w-2/3">
        <h3 className="@lg:text-2xl text-lg">Title</h3>
        <p className="@md:text-base text-sm">Description</p>
      </div>
    </div>
  );
}

// Named containers for nested queries
<div className="@container/sidebar">
  <div className="@sm/sidebar:grid-cols-2">...</div>
</div>;
```

### Custom Variants

```css
/* In globals.css — Tailwind v4 custom variants */

/* Group hover with named groups */
/* Usage: group/card:hover:shadow-lg */

/* Data attribute variants */
@custom-variant data-active (&[data-active="true"]);
@custom-variant data-error (&[data-state="error"]);
@custom-variant data-loading (&[data-loading="true"]);

/* Usage: data-active:bg-primary data-error:border-red-500 */
```

### Utility Patterns

```tsx
// cn() utility for merging Tailwind classes (from shadcn/ui)
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage in components:
<div
  className={cn(
    'rounded-lg border p-4', // base
    variant === 'primary' && 'bg-primary text-white', // conditional
    className, // override from props
  )}
/>;

// Common Tailwind patterns for the project:

// Section container
const sectionClasses = 'py-16 md:py-24 lg:py-32';
const containerClasses = 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8';

// Responsive grid
const gridClasses = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8';

// Card
const cardClasses =
  'rounded-xl border border-border bg-background p-6 shadow-card transition-shadow hover:shadow-card-hover';

// Prose/Content
const proseClasses =
  'prose prose-slate max-w-none prose-headings:font-heading prose-a:text-primary';

// Gradient text
const gradientTextClasses =
  'bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent';

// Glass effect
const glassClasses = 'backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border border-white/20';
```

---

## 4. Design-to-Code Workflow

### Figma Tokens to Tailwind Config to Components

```
STEP 1: Extract Design Tokens from Figma (via Figma MCP or manual)
├── Colors (primitives + semantic)
├── Typography (families, sizes, weights, line-heights)
├── Spacing (scale)
├── Shadows
├── Border radius
└── Breakpoints

STEP 2: Map to @theme in globals.css (Tailwind v4)
├── --color-* for colors
├── --font-* for font families
├── --shadow-* for shadows
├── Custom keyframes for animations
└── Dark mode overrides with @theme dark

STEP 3: Create Base Components (shadcn/ui + customization)
├── npx shadcn@latest init (if not already)
├── npx shadcn@latest add button input card badge (etc.)
├── Customize each component to match design tokens
├── Add CVA variants matching design system variants
└── Export from barrel file

STEP 4: Compose into Blocks
├── Combine atoms into molecules
├── Combine molecules into organisms (blocks)
├── Each block gets a Payload CMS config.ts
├── Each block gets a Component.tsx
└── Register blocks in Payload config

STEP 5: Verify
├── Screenshot with Playwright
├── Compare against design reference
├── Check responsive breakpoints
├── Check dark mode
├── Check accessibility
└── Check Payload admin preview
```

---

## 5. Performance Patterns

### Lazy Loading

```tsx
// Dynamic imports for heavy components
import dynamic from 'next/dynamic';

// Lazy load below-the-fold sections
const TestimonialCarousel = dynamic(() => import('@/blocks/Testimonials/Component'), {
  loading: () => <TestimonialSkeleton />,
  ssr: true, // SSR by default, set false for client-only
});

// Lazy load heavy libraries
const ReactPlayer = dynamic(() => import('react-player/lazy'), {
  ssr: false,
  loading: () => <VideoSkeleton />,
});

// Lazy load modals (not needed until user interaction)
const DemoModal = dynamic(() => import('@/components/shared/demo-modal'), {
  ssr: false,
});
```

### Code Splitting

```tsx
// Route-based splitting (automatic in Next.js App Router)
// Each page in src/app/ is automatically a separate chunk

// Component-based splitting for large blocks
const PricingCalculator = dynamic(() => import('@/blocks/Pricing/Calculator'), {
  ssr: false,
});

// Library-based splitting
const Chart = dynamic(() => import('recharts').then((mod) => ({ default: mod.LineChart })), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
```

### Suspense Boundaries

```tsx
// Wrap async Server Components in Suspense
import { Suspense } from 'react';

export default function Page() {
  return (
    <main>
      {/* Hero loads immediately (static) */}
      <HeroSection />

      {/* Blog posts load asynchronously with fallback */}
      <Suspense fallback={<BlogGridSkeleton />}>
        <LatestBlogPosts />
      </Suspense>

      {/* Testimonials load asynchronously */}
      <Suspense fallback={<TestimonialSkeleton />}>
        <Testimonials />
      </Suspense>
    </main>
  );
}

// Streaming: heavy data fetches don't block the entire page
async function LatestBlogPosts() {
  const posts = await payload.find({
    collection: 'posts',
    limit: 6,
    sort: '-publishedAt',
  });
  return <BlogGrid posts={posts.docs} />;
}
```

---

## 6. Server vs Client Component Decision Tree

```
START: Does this component need...

├── Browser APIs (window, document, localStorage)?
│   └── YES → Client Component ('use client')
│
├── React hooks (useState, useEffect, useRef)?
│   └── YES → Client Component ('use client')
│
├── Event handlers (onClick, onChange, onSubmit)?
│   └── YES → Client Component ('use client')
│
├── Framer Motion animations?
│   └── YES → Client Component ('use client')
│   NOTE: Wrap the animated part in a client component,
│         keep data fetching in a server component parent.
│
├── Third-party libraries that use browser APIs?
│   └── YES → Client Component ('use client')
│
├── Access to request-time data (cookies, headers)?
│   └── YES → Server Component (default)
│
├── Direct database/CMS access (Payload API)?
│   └── YES → Server Component (default) ← PREFERRED
│
├── Sensitive data (API keys, tokens)?
│   └── YES → Server Component (default)
│
└── None of the above?
    └── Server Component (default) ← PREFERRED

PATTERN: Server Component Parent + Client Component Child

// Server Component (data fetching)
// src/app/(frontend)/page.tsx
export default async function HomePage() {
  const heroData = await payload.findGlobal({ slug: 'homepage' })
  return <HeroClient data={heroData} />  // pass data as props
}

// Client Component (interactivity + animation)
// src/blocks/Hero/Client.tsx
'use client'
import { motion } from 'framer-motion'

export function HeroClient({ data }) {
  return (
    <motion.section {...fadeInUp}>
      <h1>{data.headline}</h1>
      <button onClick={() => openDemoModal()}>
        {data.ctaText}
      </button>
    </motion.section>
  )
}
```

### Component Boundary Best Practices

```
✅ Push 'use client' as far DOWN the tree as possible
✅ Keep data fetching in Server Components
✅ Only the interactive leaf components should be Client Components
✅ Use composition: Server Component wraps Client Component

❌ Don't make entire pages Client Components
❌ Don't fetch data in Client Components if avoidable
❌ Don't add 'use client' to components that don't need it
❌ Don't import Server Components into Client Components
```

---

## 7. Block-Based Page Builder Patterns (Payload CMS)

### Block Architecture

```
Each block has two files:
├── config.ts    → Payload CMS field schema (what editors see in admin)
└── Component.tsx → React component (what users see on frontend)

Registration in payload.config.ts:
  Pages collection → layout field → blocks: [HeroBlock, FeaturesBlock, ...]
```

### Block Config Template (Payload CMS 3)

```typescript
// src/blocks/Hero/config.ts
import type { Block } from 'payload';

export const HeroBlock: Block = {
  slug: 'hero',
  labels: {
    singular: 'Hero Section',
    plural: 'Hero Sections',
  },
  imageURL: '/blocks/hero-preview.png', // Preview image in admin
  fields: [
    {
      name: 'variant',
      type: 'select',
      required: true,
      defaultValue: 'centered',
      options: [
        { label: 'Centered Text', value: 'centered' },
        { label: 'Split Content-Image', value: 'split' },
        { label: 'Full-Bleed Image', value: 'fullBleed' },
      ],
      admin: {
        description: 'Choose the visual layout variant for this hero section.',
      },
    },
    {
      name: 'heading',
      type: 'text',
      required: true,
      admin: {
        description: 'Main headline. Keep under 8 words for maximum impact.',
      },
    },
    {
      name: 'subheading',
      type: 'textarea',
      admin: {
        description: 'Supporting text. 15-25 words recommended.',
      },
    },
    {
      name: 'primaryCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text', required: true },
        { name: 'url', type: 'text', required: true },
        {
          name: 'style',
          type: 'select',
          options: ['primary', 'secondary', 'ghost'],
        },
      ],
    },
    {
      name: 'secondaryCta',
      type: 'group',
      fields: [
        { name: 'label', type: 'text' },
        { name: 'url', type: 'text' },
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        condition: (data, siblingData) =>
          siblingData.variant === 'split' || siblingData.variant === 'fullBleed',
        description: 'Hero image. Recommended: 1920x1080 or larger.',
      },
    },
    {
      name: 'backgroundColor',
      type: 'select',
      defaultValue: 'white',
      options: [
        { label: 'White', value: 'white' },
        { label: 'Light Gray', value: 'gray' },
        { label: 'Primary', value: 'primary' },
        { label: 'Dark', value: 'dark' },
      ],
    },
  ],
};
```

### Block Component Template

```tsx
// src/blocks/Hero/Component.tsx
import { cn } from '@/lib/utils';
import { HeroClient } from './Client';
import type { HeroBlock as HeroBlockType } from '@/payload-types';

interface HeroProps {
  block: HeroBlockType;
}

const bgMap = {
  white: 'bg-white',
  gray: 'bg-muted',
  primary: 'bg-primary text-primary-foreground',
  dark: 'bg-slate-900 text-white',
} as const;

export function HeroBlock({ block }: HeroProps) {
  const { variant, heading, subheading, primaryCta, secondaryCta, image, backgroundColor } = block;

  return (
    <section className={cn('relative py-20 md:py-32', bgMap[backgroundColor || 'white'])}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <HeroClient
          variant={variant}
          heading={heading}
          subheading={subheading}
          primaryCta={primaryCta}
          secondaryCta={secondaryCta}
          image={image}
        />
      </div>
    </section>
  );
}
```

### Block Renderer (renders all blocks on a page)

```tsx
// src/blocks/RenderBlocks.tsx
import { HeroBlock } from './Hero/Component';
import { FeaturesBlock } from './Features/Component';
import { PricingBlock } from './Pricing/Component';
import { TestimonialsBlock } from './Testimonials/Component';
import { CTABlock } from './CTA/Component';
import { FAQBlock } from './FAQ/Component';
// ... import all blocks

const blockComponents = {
  hero: HeroBlock,
  features: FeaturesBlock,
  pricing: PricingBlock,
  testimonials: TestimonialsBlock,
  cta: CTABlock,
  faq: FAQBlock,
  // ... register all blocks
} as const;

interface RenderBlocksProps {
  blocks: Array<{ blockType: string; [key: string]: unknown }>;
}

export function RenderBlocks({ blocks }: RenderBlocksProps) {
  if (!blocks || blocks.length === 0) return null;

  return (
    <>
      {blocks.map((block, index) => {
        const Component = blockComponents[block.blockType as keyof typeof blockComponents];
        if (!Component) return null;

        return <Component key={`${block.blockType}-${index}`} block={block as never} />;
      })}
    </>
  );
}
```

### Page Template Using Block Renderer

```tsx
// src/app/(frontend)/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { getPayload } from 'payload';
import config from '@payload-config';
import { RenderBlocks } from '@/blocks/RenderBlocks';
import { generateMetadata as genMeta } from '@/lib/seo';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const payload = await getPayload({ config });
  const page = await payload.find({
    collection: 'pages',
    where: { slug: { equals: params.slug } },
    limit: 1,
  });
  if (!page.docs[0]) return {};
  const doc = page.docs[0];
  return genMeta({
    title: doc.metaTitle || doc.title,
    description: doc.metaDescription || '',
    path: `/${doc.slug}`,
  });
}

export default async function Page({ params }: { params: { slug: string } }) {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: 'pages',
    where: { slug: { equals: params.slug } },
    limit: 1,
  });

  const page = result.docs[0];
  if (!page) notFound();

  return (
    <main>
      <RenderBlocks blocks={page.layout} />
    </main>
  );
}
```

---

## 8. Responsive Design Implementation

### Mobile-First with Tailwind

```tsx
// RULE: Write mobile styles first, then add breakpoints for larger screens

// BAD: Desktop-first (overriding down)
<div className="grid-cols-3 md:grid-cols-2 sm:grid-cols-1">

// GOOD: Mobile-first (building up)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">

// Common responsive patterns:

// Typography scaling
<h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold">

// Spacing scaling
<section className="py-12 md:py-16 lg:py-24">

// Layout changes
<div className="flex flex-col md:flex-row gap-6 md:gap-8 lg:gap-12">

// Show/hide elements
<nav className="hidden md:flex">           // Desktop nav
<button className="md:hidden">            // Mobile menu button

// Image sizing
<div className="w-full md:w-1/2 lg:w-1/3">

// Padding adjustments
<div className="px-4 sm:px-6 lg:px-8">
```

### Responsive Testing Checklist

```
□ 375px   — iPhone SE (smallest common phone)
□ 390px   — iPhone 14 (common phone)
□ 768px   — iPad portrait (tablet breakpoint)
□ 1024px  — iPad landscape (lg breakpoint)
□ 1280px  — Laptop (xl breakpoint)
□ 1536px  — Desktop monitor (2xl breakpoint)
□ 1920px  — Full HD monitor
□ Touch targets are at least 44x44px on mobile
□ No horizontal scroll at any breakpoint
□ Text is readable without zooming on mobile
□ Images don't overflow their containers
□ Forms are usable on mobile (proper input types)
```

---

## 9. Dark Mode Implementation

### Strategy: CSS Variables + Tailwind dark: Variant

```css
/* globals.css */
@theme {
  --color-background: #ffffff;
  --color-foreground: #0f172a;
  --color-card: #ffffff;
  --color-card-foreground: #0f172a;
  --color-muted: #f1f5f9;
  --color-muted-foreground: #64748b;
  --color-border: #e2e8f0;
}

@theme dark {
  --color-background: #0f172a;
  --color-foreground: #f8fafc;
  --color-card: #1e293b;
  --color-card-foreground: #f8fafc;
  --color-muted: #1e293b;
  --color-muted-foreground: #94a3b8;
  --color-border: #334155;
}
```

```tsx
// Theme toggle component
'use client';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

// Layout setup with ThemeProvider
// src/app/layout.tsx
import { ThemeProvider } from 'next-themes';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Dark Mode Checklist

```
□ All text has sufficient contrast in dark mode
□ Images/illustrations work on dark backgrounds (no white halos)
□ Shadows are adjusted (lighter shadows or no shadows in dark mode)
□ Brand colors are adjusted if needed (lighter tints in dark mode)
□ Form inputs are visible and readable
□ Code blocks/syntax highlighting adapts
□ Charts and data visualizations adapt
□ Social media embeds don't clash
□ No flash of wrong theme on page load (suppressHydrationWarning)
```

---

## 10. Image Optimization Strategies

### next/image Patterns

```tsx
// Hero image (above the fold — priority loading)
import Image from 'next/image'

<Image
  src="/images/hero.webp"
  alt="TrueOmni platform dashboard"
  width={1920}
  height={1080}
  priority                          // Preload — disables lazy loading
  quality={85}
  className="w-full h-auto"
  sizes="100vw"                     // Full width hero
/>

// Card image (below the fold — lazy loaded)
<Image
  src={post.featuredImage.url}
  alt={post.featuredImage.alt || post.title}
  width={640}
  height={360}
  className="w-full h-48 object-cover rounded-t-lg"
  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
  placeholder="blur"
  blurDataURL={post.featuredImage.blurDataURL}  // From Payload
/>

// Avatar (small, fixed size)
<Image
  src={member.photo.url}
  alt={member.name}
  width={64}
  height={64}
  className="rounded-full"
  sizes="64px"
/>

// Background image with overlay
<div className="relative">
  <Image
    src="/images/bg.webp"
    alt=""                          // Decorative image, empty alt
    fill                            // Fill parent container
    className="object-cover"
    sizes="100vw"
    quality={75}                    // Lower quality for backgrounds
  />
  <div className="absolute inset-0 bg-black/60" />  {/* Overlay */}
  <div className="relative z-10">Content</div>
</div>
```

### Image Sizes Guide

```
Hero (full-width):     sizes="100vw"
Half-width section:    sizes="(max-width: 768px) 100vw, 50vw"
Third-width card:      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
Quarter-width grid:    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
Thumbnail/avatar:      sizes="64px" (or whatever the fixed size is)

Rule: Always provide sizes prop. Without it, Next.js assumes 100vw
      and generates unnecessarily large images.
```

### Payload CMS Image Configuration

```typescript
// src/collections/Media.ts
import type { CollectionConfig } from 'payload';

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'image/gif'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 768, height: 432 },
      { name: 'hero', width: 1920, height: 1080 },
    ],
    adminThumbnail: 'thumbnail',
  },
  fields: [
    { name: 'alt', type: 'text', required: true },
    { name: 'caption', type: 'text' },
  ],
};
```

---

## 11. CSS Animation vs Framer Motion Decision Guide

```
USE CSS/TAILWIND ANIMATIONS WHEN:
  ✅ Simple hover effects (color, shadow, transform)
  ✅ Loading spinners and skeletons
  ✅ Infinite/loop animations
  ✅ Performance-critical animations on many elements
  ✅ Animations that don't need JavaScript control
  ✅ Pseudo-element animations (::before, ::after)
  ✅ The component is a Server Component (no 'use client')

  Example: transition-colors duration-200, animate-pulse, animate-spin

USE FRAMER MOTION WHEN:
  ✅ Scroll-triggered animations (whileInView)
  ✅ Enter/exit animations (AnimatePresence)
  ✅ Layout animations (layout prop, LayoutGroup)
  ✅ Spring physics / complex easing
  ✅ Gesture-based animations (drag, whileHover, whileTap)
  ✅ Orchestrated sequences (stagger children)
  ✅ Shared layout animations (layoutId)
  ✅ Animations that depend on state

  Example: Scroll-reveal sections, modal enter/exit, tab indicator animation

RULE: If you can do it with CSS, prefer CSS.
      Use Framer Motion for animations that CSS can't easily handle.
```

---

## 12. Component Composition Patterns

### Compound Components

```tsx
// Compound component pattern for complex UI elements
// Example: Card with composable sub-components

import { cn } from '@/lib/utils';

function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-card shadow-card rounded-xl border', className)} {...props}>
      {children}
    </div>
  );
}

function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
      {children}
    </div>
  );
}

function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('font-heading text-2xl font-semibold leading-tight', className)} {...props}>
      {children}
    </h3>
  );
}

function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

// Usage:
<Card>
  <CardHeader>
    <CardTitle>Feature Name</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Description here</p>
  </CardContent>
  <CardFooter>
    <Button>Learn More</Button>
  </CardFooter>
</Card>;
```

### Custom Hooks for UI Logic

```tsx
// src/hooks/use-media-query.ts
import { useEffect, useState } from 'react';

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

// Usage: const isMobile = useMediaQuery('(max-width: 768px)')

// src/hooks/use-scroll-direction.ts
import { useEffect, useState } from 'react';

export function useScrollDirection() {
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const [prevScroll, setPrevScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setDirection(currentScroll > prevScroll ? 'down' : 'up');
      setPrevScroll(currentScroll);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [prevScroll]);

  return direction;
}

// Usage: const scrollDir = useScrollDirection()
// <header className={cn('sticky top-0', scrollDir === 'down' && '-translate-y-full')}>

// src/hooks/use-intersection-observer.ts
import { useEffect, useRef, useState } from 'react';

export function useIntersectionObserver(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold: 0.1, ...options },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isIntersecting };
}
```

---

## 13. Accessibility Implementation

### ARIA Patterns

```tsx
// Navigation with ARIA
<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="/" aria-current={isHome ? 'page' : undefined}>Home</a></li>
    <li><a href="/product">Product</a></li>
  </ul>
</nav>

// Mobile menu with ARIA
<button
  aria-expanded={isMenuOpen}
  aria-controls="mobile-menu"
  aria-label="Toggle navigation menu"
  onClick={toggleMenu}
>
  <MenuIcon />
</button>
<div id="mobile-menu" role="dialog" aria-modal="true" aria-label="Navigation menu">
  {/* menu content */}
</div>

// Tab component with ARIA
<div role="tablist" aria-label="Product features">
  {tabs.map((tab) => (
    <button
      key={tab.id}
      role="tab"
      id={`tab-${tab.id}`}
      aria-selected={activeTab === tab.id}
      aria-controls={`panel-${tab.id}`}
      tabIndex={activeTab === tab.id ? 0 : -1}
      onClick={() => setActiveTab(tab.id)}
    >
      {tab.label}
    </button>
  ))}
</div>
{tabs.map((tab) => (
  <div
    key={tab.id}
    role="tabpanel"
    id={`panel-${tab.id}`}
    aria-labelledby={`tab-${tab.id}`}
    hidden={activeTab !== tab.id}
    tabIndex={0}
  >
    {tab.content}
  </div>
))}

// Loading state announcement
<div aria-live="polite" aria-busy={isLoading}>
  {isLoading ? 'Loading...' : 'Content loaded'}
</div>

// Form error announcement
<input
  id="email"
  type="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>
{errors.email && (
  <p id="email-error" role="alert" className="text-sm text-red-500">
    {errors.email.message}
  </p>
)}
```

### Keyboard Navigation

```tsx
// Focus trap for modals
// Use @radix-ui/react-focus-scope (included with shadcn/ui)
import { FocusScope } from '@radix-ui/react-focus-scope'

<FocusScope trapped={isOpen} onMountAutoFocus={(e) => e.preventDefault()}>
  <div role="dialog">{/* modal content */}</div>
</FocusScope>

// Keyboard handler for custom components
function handleKeyDown(e: React.KeyboardEvent) {
  switch (e.key) {
    case 'Enter':
    case ' ':
      e.preventDefault()
      handleSelect()
      break
    case 'Escape':
      handleClose()
      break
    case 'ArrowDown':
      e.preventDefault()
      focusNext()
      break
    case 'ArrowUp':
      e.preventDefault()
      focusPrevious()
      break
  }
}

// Skip to content link (first element in body)
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg"
>
  Skip to main content
</a>

// Main content landmark
<main id="main-content" tabIndex={-1}>
  {/* page content */}
</main>
```

### Focus Management

```tsx
// Focus visible ring (Tailwind)
// Applied globally via globals.css or per-component:
const focusClasses =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

// Auto-focus on route change (for SPA navigation)
('use client');
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function RouteAnnouncer() {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, [pathname]);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="sr-only"
      role="status"
      aria-live="assertive"
      aria-atomic="true"
    >
      Navigated to {pathname}
    </div>
  );
}
```

### Screen Reader Utilities

```tsx
// Visually hidden but accessible to screen readers
// Tailwind: className="sr-only"

// Visible only on focus (skip links, focus-only labels)
// Tailwind: className="sr-only focus:not-sr-only"

// Hide from screen readers (decorative elements)
<div aria-hidden="true">
  <DecorativeShape />
</div>

// Alternative text for icons used as buttons
<button aria-label="Close dialog">
  <XIcon aria-hidden="true" />
</button>

// Announce dynamic content changes
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>
```

### Accessibility Checklist

```
SEMANTIC HTML:
□ One <main> per page
□ Proper heading hierarchy (H1 → H2 → H3, no skipping)
□ <nav> for navigation, <header> for header, <footer> for footer
□ <article> for blog posts, <aside> for sidebars
□ <button> for actions, <a> for navigation
□ Lists use <ul>/<ol> with <li>
□ Tables use <thead>, <tbody>, <th scope="col">

KEYBOARD:
□ All interactive elements reachable via Tab
□ Tab order matches visual order
□ Focus indicators visible (ring-2 or similar)
□ Escape closes modals/dropdowns
□ Enter/Space activates buttons
□ Arrow keys navigate within groups (tabs, menus)
□ Skip to content link present

ARIA:
□ aria-label on icon-only buttons
□ aria-expanded on toggles/menus
□ aria-current="page" on active nav item
□ aria-live regions for dynamic content
□ aria-invalid + aria-describedby on form errors
□ role="dialog" + aria-modal="true" on modals

VISUAL:
□ Contrast ratios meet WCAG AA (4.5:1 normal, 3:1 large)
□ Text resizable to 200% without breaking layout
□ No information conveyed by color alone
□ Focus indicators have 3:1 contrast
□ prefers-reduced-motion respected
□ prefers-color-scheme respected
□ Touch targets minimum 44x44px
```

---

## 14. Quick Reference: Common Patterns

### Section Wrapper

```tsx
// Reusable section wrapper with consistent spacing and container
interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  background?: 'white' | 'muted' | 'primary' | 'dark';
}

export function Section({ children, className, id, background = 'white' }: SectionProps) {
  const bgClasses = {
    white: 'bg-background',
    muted: 'bg-muted',
    primary: 'bg-primary text-primary-foreground',
    dark: 'bg-slate-900 text-white',
  };

  return (
    <section id={id} className={cn('py-16 md:py-24 lg:py-32', bgClasses[background], className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}
```

### Section Header

```tsx
// Reusable section header (eyebrow + heading + description)
interface SectionHeaderProps {
  eyebrow?: string;
  heading: string;
  description?: string;
  align?: 'left' | 'center';
}

export function SectionHeader({
  eyebrow,
  heading,
  description,
  align = 'center',
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-12 md:mb-16', align === 'center' && 'text-center')}>
      {eyebrow && (
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-primary">
          {eyebrow}
        </p>
      )}
      <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
        {heading}
      </h2>
      {description && (
        <p
          className={cn(
            'mt-4 text-lg text-muted-foreground',
            align === 'center' && 'mx-auto max-w-2xl',
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
```
