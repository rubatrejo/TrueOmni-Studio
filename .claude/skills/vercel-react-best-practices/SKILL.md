# Vercel + React Best Practices

---

name: vercel-react-best-practices
description: |
Comprehensive best practices for Next.js 15 App Router, React 19, and Vercel deployment.
Covers Server/Client Components, data fetching, rendering strategies, image/font optimization,
metadata, middleware, caching, performance, and Vercel-specific features.
Tailored for production-grade applications with Payload CMS 3, Tailwind v4, and Framer Motion.
triggers:

- next.js patterns
- react best practices
- vercel deployment
- server components
- client components
- data fetching
- server actions
- caching strategy
- performance optimization
- image optimization
- font loading
- metadata SEO
- middleware
- ISR
- SSG
- SSR
- streaming
- suspense
- react 19

---

## Table of Contents

1. [Next.js 15 App Router Patterns](#1-nextjs-15-app-router-patterns)
2. [Server Components vs Client Components](#2-server-components-vs-client-components)
3. [Data Fetching Patterns](#3-data-fetching-patterns)
4. [Rendering Strategies](#4-rendering-strategies)
5. [Image Optimization](#5-image-optimization)
6. [Font Loading](#6-font-loading)
7. [Metadata API](#7-metadata-api)
8. [Middleware Patterns](#8-middleware-patterns)
9. [Vercel-Specific Features](#9-vercel-specific-features)
10. [Caching Strategies](#10-caching-strategies)
11. [Performance Optimization](#11-performance-optimization)
12. [React 19 Features](#12-react-19-features)

---

## 1. Next.js 15 App Router Patterns

### File-Based Routing Conventions

```
src/app/
├── layout.tsx              ← Root layout (wraps ALL pages)
├── page.tsx                ← Homepage (/)
├── loading.tsx             ← Loading UI (Suspense fallback for page.tsx)
├── error.tsx               ← Error boundary (catches errors in page/children)
├── not-found.tsx           ← 404 page (triggered by notFound())
├── global-error.tsx        ← Root error boundary (catches layout errors)
├── template.tsx            ← Re-mounts on navigation (vs layout which persists)
├── default.tsx             ← Fallback for parallel routes
│
├── (frontend)/             ← Route group (no URL impact)
│   ├── layout.tsx          ← Shared layout for frontend pages
│   ├── page.tsx            ← / (if no parent page.tsx)
│   ├── product/
│   │   ├── page.tsx        ← /product
│   │   └── [slug]/
│   │       └── page.tsx    ← /product/analytics, /product/integrations
│   ├── blog/
│   │   ├── page.tsx        ← /blog
│   │   └── [slug]/
│   │       └── page.tsx    ← /blog/my-post-title
│   └── [...catchAll]/
│       └── page.tsx        ← Catches all unmatched routes
│
├── (payload)/              ← Route group for CMS admin
│   └── admin/
│       └── [[...segments]]/
│           └── page.tsx    ← /admin, /admin/collections/pages, etc.
│
├── api/                    ← API route handlers
│   ├── og/
│   │   └── route.ts        ← GET /api/og (OG image generation)
│   ├── contact/
│   │   └── route.ts        ← POST /api/contact
│   └── webhook/
│       └── route.ts        ← POST /api/webhook
│
└── sitemap.ts              ← Dynamic sitemap.xml generation
```

### Special File Hierarchy

```
The rendering hierarchy for a route segment:

layout.tsx
  └── template.tsx
        └── error.tsx (ErrorBoundary)
              └── loading.tsx (Suspense)
                    └── not-found.tsx (NotFoundBoundary)
                          └── page.tsx

Each file wraps the one below it. This means:
- layout.tsx persists across navigations (state preserved)
- template.tsx re-mounts on navigation (state reset)
- error.tsx catches errors from page.tsx AND nested layouts
- loading.tsx shows while page.tsx is loading (streaming)
- not-found.tsx shows when notFound() is called
```

### Route Groups `(group)`

```tsx
// Route groups create organizational boundaries without affecting URL structure

// src/app/(marketing)/         → All marketing pages share a layout
//   layout.tsx                 → Marketing layout (with header/footer)
//   page.tsx                   → / (homepage)
//   pricing/page.tsx           → /pricing
//   about/page.tsx             → /about

// src/app/(dashboard)/         → All dashboard pages share a layout
//   layout.tsx                 → Dashboard layout (with sidebar)
//   dashboard/page.tsx         → /dashboard
//   settings/page.tsx          → /settings

// src/app/(payload)/           → Payload CMS admin
//   admin/[[...segments]]/page.tsx → /admin/*

// Benefits:
// 1. Different layouts for different sections without URL prefixes
// 2. Organize related routes together
// 3. Separate concerns (marketing vs app vs admin)
```

### Dynamic Routes

```tsx
// [slug] — Single dynamic segment
// src/app/blog/[slug]/page.tsx
export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; // Next.js 15: params is async
  const post = await getPost(slug);
  if (!post) notFound();
  return <article>{/* ... */}</article>;
}

// Generate static pages at build time
export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

// [...slug] — Catch-all segment
// src/app/docs/[...slug]/page.tsx
// Matches: /docs/getting-started, /docs/api/authentication, /docs/a/b/c
export default async function DocsPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  // slug = ['getting-started'] or ['api', 'authentication'] or ['a', 'b', 'c']
  const doc = await getDoc(slug.join('/'));
  return <div>{/* ... */}</div>;
}

// [[...slug]] — Optional catch-all segment
// src/app/admin/[[...segments]]/page.tsx
// Matches: /admin, /admin/collections, /admin/collections/pages
// The segments param may be undefined (when at /admin)
export default async function AdminPage({ params }: { params: Promise<{ segments?: string[] }> }) {
  const { segments } = await params;
  // segments = undefined (at /admin) or ['collections'] or ['collections', 'pages']
  return <PayloadAdminPanel />;
}
```

### Parallel Routes `@slot`

```tsx
// Parallel routes render multiple pages in the same layout simultaneously

// src/app/@analytics/page.tsx     → Analytics panel
// src/app/@notifications/page.tsx → Notifications panel
// src/app/layout.tsx              → Receives both as props

// layout.tsx
export default function Layout({
  children,
  analytics,
  notifications,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  notifications: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <main className="col-span-8">{children}</main>
      <aside className="col-span-4 space-y-4">
        {analytics}
        {notifications}
      </aside>
    </div>
  );
}

// Each slot loads independently with its own loading.tsx and error.tsx
// Great for: dashboards, split views, modals as routes

// default.tsx — Fallback when a parallel route doesn't match
// Required for parallel routes to prevent 404 on navigation
// src/app/@analytics/default.tsx
export default function Default() {
  return null; // or a fallback UI
}
```

### Intercepting Routes

```tsx
// Intercepting routes show a route in a modal while preserving context

// Convention:
// (.)route   — same level
// (..)route  — one level up
// (..)(..)route — two levels up
// (...)route — from root

// Example: Photo gallery with modal preview

// src/app/photos/page.tsx           → Photo grid
// src/app/photos/[id]/page.tsx      → Full photo page (direct URL)
// src/app/@modal/(.)photos/[id]/page.tsx → Photo in modal (intercepted)

// When clicking a photo link in the grid:
// → Shows the photo in a modal (intercepted route)
// When navigating directly to /photos/123:
// → Shows the full photo page

// layout.tsx
export default function Layout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}

// @modal/(.)photos/[id]/page.tsx
export default async function PhotoModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const photo = await getPhoto(id);
  return (
    <Dialog defaultOpen>
      <DialogContent>
        <Image src={photo.url} alt={photo.alt} width={800} height={600} />
      </DialogContent>
    </Dialog>
  );
}
```

### Route Handlers (API Routes)

```tsx
// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10).max(2000),
});

// Named exports for HTTP methods
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = contactSchema.parse(body);

    // Process the contact form
    await sendEmail(data);

    return NextResponse.json(
      { success: true, message: 'Message sent successfully' },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// GET with search params
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const { items, total } = await getItems({ page, limit });

  return NextResponse.json({ items, total, page, limit });
}

// Dynamic route handler
// src/app/api/posts/[slug]/route.ts
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json(post);
}

// Route handler config
export const runtime = 'edge'; // or 'nodejs' (default)
export const dynamic = 'force-dynamic'; // Skip caching
export const revalidate = 3600; // Cache for 1 hour

// Supported HTTP methods:
// GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
```

---

## 2. Server Components vs Client Components

### Decision Matrix

```
USE SERVER COMPONENTS WHEN:
──────────────────────────────────────────────────────
✅ Fetching data (database queries, API calls)
✅ Accessing backend resources directly (filesystem, DB)
✅ Keeping sensitive info on server (API keys, tokens)
✅ Rendering static or mostly static content
✅ Heavy dependencies that don't need client-side JS
✅ SEO-critical content (rendered in initial HTML)
✅ Page layouts and structural components
✅ Payload CMS data rendering
✅ Markdown/rich text rendering

USE CLIENT COMPONENTS WHEN:
──────────────────────────────────────────────────────
✅ Using React hooks (useState, useEffect, useRef, etc.)
✅ Event handlers (onClick, onChange, onSubmit)
✅ Browser APIs (localStorage, window, navigator)
✅ Interactive UI (forms, modals, dropdowns, tabs)
✅ Animations (Framer Motion)
✅ Third-party client libraries (maps, charts, rich editors)
✅ Custom hooks that use state or effects
✅ Context providers (theme, auth, locale)

EXAMPLES FOR TRUEOMNI:
──────────────────────────────────────────────────────
Server Component:
- Page layouts (layout.tsx, page.tsx)
- Blog post content rendering
- Pricing table (static comparison)
- Team member cards
- Footer with links
- SEO metadata generation
- Payload CMS block rendering

Client Component:
- Mobile navigation menu (Sheet with open/close state)
- Contact form (React Hook Form + validation)
- Pricing toggle (monthly/annual switch)
- Hero animation (Framer Motion)
- Cookie consent banner
- Image carousel/lightbox
- Search command palette (Cmd+K)
- Tab switching in features section
```

### Data Fetching in Server Components

```tsx
// Server Components can be async — fetch data directly

// page.tsx (Server Component by default)
export default async function ProductPage() {
  // Direct database/CMS query — no API needed
  const features = await payload.find({
    collection: 'features',
    where: { status: { equals: 'published' } },
    sort: 'order',
  });

  // Multiple parallel data fetches
  const [testimonials, stats] = await Promise.all([getTestimonials(), getStats()]);

  return (
    <div>
      <FeaturesSection features={features.docs} />
      <TestimonialsSection testimonials={testimonials} />
      <StatsSection stats={stats} />
    </div>
  );
}

// Component that fetches its own data
async function RecentPosts() {
  const posts = await payload.find({
    collection: 'posts',
    limit: 3,
    sort: '-publishedAt',
    where: { status: { equals: 'published' } },
  });

  return (
    <section>
      <h2>Recent Blog Posts</h2>
      {posts.docs.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </section>
  );
}
```

### Passing Data from Server to Client

```tsx
// Pattern: Server Component fetches data, passes to Client Component as props

// page.tsx (Server Component)
export default async function PricingPage() {
  const plans = await getPlans(); // Fetch on server

  return (
    <div>
      <h1>Pricing</h1>
      {/* Pass serializable data as props */}
      <PricingToggle plans={plans} />
    </div>
  );
}

// PricingToggle.tsx (Client Component)
('use client');

import { useState } from 'react';

interface Plan {
  id: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
}

export function PricingToggle({ plans }: { plans: Plan[] }) {
  const [isAnnual, setIsAnnual] = useState(true); // Client-side state

  return (
    <div>
      <Switch checked={isAnnual} onCheckedChange={setIsAnnual}>
        {isAnnual ? 'Annual' : 'Monthly'}
      </Switch>
      <div className="grid grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            price={isAnnual ? plan.annualPrice : plan.monthlyPrice}
            period={isAnnual ? '/year' : '/month'}
          />
        ))}
      </div>
    </div>
  );
}

// IMPORTANT: Props passed from Server to Client must be serializable
// ✅ Strings, numbers, booleans, arrays, plain objects, Date (as string), null
// ❌ Functions, class instances, Symbols, Map, Set, WeakMap, WeakSet
// ❌ React elements (JSX) — use children pattern instead
```

### `use client` Boundary Optimization

```tsx
// WRONG: Making the entire page a Client Component
'use client' // ❌ Marks EVERYTHING below as client

export default function ProductPage() {
  const [activeTab, setActiveTab] = useState('features')

  return (
    <div>
      <HeroSection />           {/* Static — shouldn't be client */}
      <FeaturesSection />        {/* Static — shouldn't be client */}
      <TabSwitcher              {/* Interactive — needs client */}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <TestimonialsSection />    {/* Static — shouldn't be client */}
      <FooterCTA />             {/* Static — shouldn't be client */}
    </div>
  )
}

// CORRECT: Push 'use client' boundary down to the leaf
// page.tsx (Server Component — no 'use client')
export default async function ProductPage() {
  const features = await getFeatures()
  const testimonials = await getTestimonials()

  return (
    <div>
      <HeroSection />                                    {/* Server */}
      <FeaturesSection features={features} />            {/* Server */}
      <InteractiveTabSwitcher features={features} />     {/* Client */}
      <TestimonialsSection testimonials={testimonials} />{/* Server */}
      <FooterCTA />                                      {/* Server */}
    </div>
  )
}

// InteractiveTabSwitcher.tsx
'use client'  // Only this component is a Client Component
import { useState } from 'react'
export function InteractiveTabSwitcher({ features }: Props) {
  const [activeTab, setActiveTab] = useState('all')
  // ...interactive logic
}
```

### Composition Patterns

```tsx
// Pattern: Server Component wrapping Client Component with children

// ServerWrapper.tsx (Server Component)
export default async function ServerWrapper() {
  const data = await fetchData(); // Server-side data fetch

  return (
    <ClientInteractiveWrapper>
      {/* These children are Server Components rendered on the server */}
      <ServerRenderedContent data={data} />
      <AnotherServerComponent />
    </ClientInteractiveWrapper>
  );
}

// ClientInteractiveWrapper.tsx
('use client');
export function ClientInteractiveWrapper({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <motion.div animate={{ opacity: isVisible ? 1 : 0 }}>
      <button onClick={() => setIsVisible(!isVisible)}>Toggle</button>
      {children} {/* Server-rendered content passed through */}
    </motion.div>
  );
}

// Pattern: Context provider at the boundary
// providers.tsx
('use client');
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        {children}
      </TooltipProvider>
    </ThemeProvider>
  );
}

// layout.tsx (Server Component)
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {' '}
          {/* Client boundary for context */}
          {children} {/* Can still be Server Components */}
        </Providers>
      </body>
    </html>
  );
}
```

---

## 3. Data Fetching Patterns

### Server Actions (Form Handling & Mutations)

```tsx
// Server Action defined in a separate file
// src/app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const demoSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().min(1),
  companySize: z.enum(['1-10', '11-50', '51-200', '200+']),
  message: z.string().max(500).optional(),
});

export async function submitDemoRequest(formData: FormData) {
  // Validate
  const rawData = Object.fromEntries(formData);
  const result = demoSchema.safeParse(rawData);

  if (!result.success) {
    return { success: false, errors: result.error.flatten().fieldErrors };
  }

  // Save to Payload CMS
  try {
    await payload.create({
      collection: 'demo-requests',
      data: result.data,
    });

    // Send confirmation email
    await sendConfirmationEmail(result.data.email, result.data.name);

    // Revalidate relevant pages
    revalidatePath('/demo');

    return { success: true };
  } catch (error) {
    return {
      success: false,
      errors: { _form: ['Failed to submit. Please try again.'] },
    };
  }
}

// Usage with useActionState (React 19)
// DemoForm.tsx
('use client');

import { useActionState } from 'react';
import { submitDemoRequest } from '@/app/actions';

export function DemoForm() {
  const [state, formAction, isPending] = useActionState(submitDemoRequest, null);

  return (
    <form action={formAction}>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required />
        {state?.errors?.name && <p className="text-sm text-red-600">{state.errors.name[0]}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
        {state?.errors?.email && <p className="text-sm text-red-600">{state.errors.email[0]}</p>}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          'Request Demo'
        )}
      </Button>

      {state?.success && (
        <Alert className="mt-4">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Demo requested!</AlertTitle>
          <AlertDescription>We will contact you within 24 hours.</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
```

### fetch() with Caching

```tsx
// Next.js 15: fetch caching behavior
// By default, fetch is NOT cached (changed from Next.js 14)
// You must explicitly opt into caching

// No caching (default in Next.js 15)
const data = await fetch('https://api.example.com/data');

// Cache indefinitely (equivalent to SSG)
const data = await fetch('https://api.example.com/data', {
  cache: 'force-cache',
});

// Revalidate every 60 seconds (ISR)
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 60 },
});

// Revalidate by tag (on-demand revalidation)
const data = await fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] },
});
// Later, to revalidate:
import { revalidateTag } from 'next/cache';
revalidateTag('posts');

// No cache, always fresh
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store',
});

// For Payload CMS (local API — no fetch needed):
// Use unstable_cache for caching direct function calls
import { unstable_cache } from 'next/cache';

const getCachedPosts = unstable_cache(
  async () => {
    return payload.find({
      collection: 'posts',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
    });
  },
  ['published-posts'], // Cache key
  {
    revalidate: 60, // Revalidate every 60 seconds
    tags: ['posts'], // Tag for on-demand revalidation
  },
);
```

### Streaming with Suspense

```tsx
// Stream content as it becomes ready using Suspense

// page.tsx
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* This renders immediately */}
      <div className="col-span-12">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {/* These stream in as they load */}
      <div className="col-span-8">
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart /> {/* Async Server Component */}
        </Suspense>
      </div>

      <div className="col-span-4 space-y-6">
        <Suspense fallback={<MetricsSkeleton />}>
          <MetricsPanel /> {/* Another async component */}
        </Suspense>

        <Suspense fallback={<ActivitySkeleton />}>
          <RecentActivity /> {/* Another async component */}
        </Suspense>
      </div>
    </div>
  );
}

// Each component fetches its own data independently
async function RevenueChart() {
  const data = await getRevenueData(); // May take 2 seconds
  return <Chart data={data} />;
}

async function MetricsPanel() {
  const metrics = await getMetrics(); // May take 500ms
  return <Metrics data={metrics} />;
}

async function RecentActivity() {
  const activity = await getActivity(); // May take 1 second
  return <ActivityFeed items={activity} />;
}

// Benefits:
// - Page shell renders immediately (good LCP)
// - Each section streams in independently
// - No waterfall (all fetches start in parallel)
// - User sees content progressively
```

### Parallel Data Fetching

```tsx
// WRONG: Sequential data fetching (waterfall)
async function Page() {
  const posts = await getPosts(); // 500ms
  const categories = await getCategories(); // 300ms
  const featured = await getFeatured(); // 400ms
  // Total: 1200ms (sequential)

  return <div>...</div>;
}

// CORRECT: Parallel data fetching
async function Page() {
  // All fetches start simultaneously
  const [posts, categories, featured] = await Promise.all([
    getPosts(), // 500ms ┐
    getCategories(), // 300ms ├─ Total: 500ms (parallel)
    getFeatured(), // 400ms ┘
  ]);

  return <div>...</div>;
}

// BEST: Parallel with Suspense streaming
function Page() {
  return (
    <div>
      <Suspense fallback={<PostsSkeleton />}>
        <Posts /> {/* Streams when ready */}
      </Suspense>
      <Suspense fallback={<CategoriesSkeleton />}>
        <Categories /> {/* Streams when ready */}
      </Suspense>
      <Suspense fallback={<FeaturedSkeleton />}>
        <Featured /> {/* Streams when ready */}
      </Suspense>
    </div>
  );
}

// AVOIDING WATERFALLS IN CLIENT COMPONENTS:
// Don't fetch in useEffect one after another
// Use React Query (TanStack Query) for parallel client-side fetches

// PRELOADING PATTERN:
// Start fetching data before it's needed
import { preload } from 'react-dom';

// In a Server Component:
export default function Layout({ children }: { children: React.ReactNode }) {
  // Preload data that child pages will need
  preloadPosts();
  preloadCategories();
  return <div>{children}</div>;
}

function preloadPosts() {
  void getPosts(); // Start the fetch but don't await it
}
```

---

## 4. Rendering Strategies

### SSG (Static Site Generation)

```tsx
// Pages with generateStaticParams are statically generated at build time

// src/app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    select: { slug: true },
    limit: 0, // Get all
  });

  return posts.docs.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  return <article>...</article>;
}

// Config for fully static pages:
export const dynamic = 'force-static';
export const revalidate = false; // Never revalidate

// When to use SSG:
// - Blog posts that rarely change
// - Documentation pages
// - Legal pages (privacy, terms)
// - Marketing landing pages with infrequent updates
```

### ISR (Incremental Static Regeneration)

```tsx
// Time-based revalidation
export const revalidate = 3600; // Revalidate every hour

export default async function PricingPage() {
  const plans = await getPlans();
  return <PricingTable plans={plans} />;
}

// On-demand revalidation (triggered by CMS webhook)
// src/app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-revalidate-secret');
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const body = await request.json();

  // Revalidate by path
  if (body.path) {
    revalidatePath(body.path);
  }

  // Revalidate by tag
  if (body.tag) {
    revalidateTag(body.tag);
  }

  // Revalidate specific content types
  switch (body.collection) {
    case 'posts':
      revalidateTag('posts');
      revalidatePath('/blog');
      if (body.slug) revalidatePath(`/blog/${body.slug}`);
      break;
    case 'pages':
      revalidateTag('pages');
      if (body.slug) revalidatePath(`/${body.slug}`);
      break;
    case 'case-studies':
      revalidateTag('case-studies');
      revalidatePath('/customers');
      break;
  }

  return NextResponse.json({ revalidated: true, now: Date.now() });
}

// Payload CMS webhook hook (in collection config):
// hooks: {
//   afterChange: [
//     async ({ doc, collection }) => {
//       await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/revalidate`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'x-revalidate-secret': process.env.REVALIDATION_SECRET,
//         },
//         body: JSON.stringify({ collection: collection.slug, slug: doc.slug }),
//       })
//     }
//   ]
// }
```

### SSR (Server-Side Rendering)

```tsx
// Force dynamic rendering (SSR on every request)
export const dynamic = 'force-dynamic';

export default async function SearchResults({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;

  if (!q) return <SearchEmptyState />;

  const results = await search(q, parseInt(page || '1'));
  return <SearchResultsList results={results} query={q} />;
}

// When to use SSR:
// - Search results pages (query-dependent)
// - User-specific content (dashboard, profile)
// - Real-time data that can't be stale
// - Content that depends on request headers (geo, auth)

// Dynamic rendering triggers:
// Next.js automatically switches to SSR when:
// - Using searchParams
// - Using headers() or cookies()
// - Using dynamic = 'force-dynamic'
// - Using cache: 'no-store' in fetch
// - Using unstable_noStore()
```

### PPR (Partial Prerendering) — Next.js 15

```tsx
// Partial Prerendering combines static and dynamic in one page
// Static shell is served immediately, dynamic parts stream in

// next.config.ts
const nextConfig = {
  experimental: {
    ppr: true, // Enable Partial Prerendering
  },
};

// page.tsx
import { Suspense } from 'react';
import { unstable_noStore } from 'next/cache';

export default function ProductPage() {
  return (
    <div>
      {/* STATIC: Pre-rendered at build time */}
      <Header />
      <HeroSection />
      <FeaturesSection />

      {/* DYNAMIC: Streamed on each request */}
      <Suspense fallback={<PriceSkeleton />}>
        <DynamicPrice /> {/* Uses cookies/headers for geo-pricing */}
      </Suspense>

      {/* STATIC */}
      <TestimonialsSection />

      {/* DYNAMIC */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <PersonalizedRecommendations /> {/* Based on user data */}
      </Suspense>

      {/* STATIC */}
      <Footer />
    </div>
  );
}

// The dynamic component opts out of static rendering:
async function DynamicPrice() {
  unstable_noStore(); // Mark as dynamic
  const geo = headers().get('x-vercel-ip-country') || 'US';
  const price = await getGeoPrice(geo);
  return <PriceDisplay price={price} />;
}

// Benefits of PPR:
// - Static shell loads instantly (great TTFB and LCP)
// - Dynamic parts stream in (no blocking)
// - Best of SSG and SSR combined
// - Especially powerful for e-commerce, personalized content
```

---

## 5. Image Optimization

### next/image Component Patterns

```tsx
import Image from 'next/image'

// 1. Local image (automatically gets width/height from import)
import heroImage from '@/public/images/hero.jpg'

<Image
  src={heroImage}
  alt="TrueOmni platform dashboard showing analytics overview"
  placeholder="blur"  // Automatic blur placeholder from import
  priority            // Preload — use for LCP image
  className="rounded-xl"
/>

// 2. Remote image (must specify width/height or fill)
<Image
  src="https://cms.trueomni.com/media/feature-screenshot.jpg"
  alt="Analytics feature showing real-time data processing"
  width={1200}
  height={630}
  className="rounded-lg"
/>

// 3. Fill mode (responsive, fills parent container)
<div className="relative aspect-video">
  <Image
    src="/images/hero-bg.jpg"
    alt=""
    fill
    className="object-cover rounded-xl"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    priority
  />
</div>

// 4. Responsive image with sizes
<Image
  src="/images/feature.jpg"
  alt="Feature illustration"
  width={800}
  height={600}
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  // At < 640px viewport: image is 100% of viewport width
  // At < 1024px: image is 50%
  // At >= 1024px: image is 33%
  // Next.js generates the right srcset based on these sizes
/>

// 5. Avatar/small image (disable optimization for tiny images)
<Image
  src={user.avatar}
  alt={user.name}
  width={40}
  height={40}
  className="rounded-full"
  // For very small images, the optimization overhead may not be worth it
/>
```

### Blur Placeholders

```tsx
// Option 1: Automatic blur from local import
import heroImage from '@/public/images/hero.jpg'
<Image src={heroImage} alt="..." placeholder="blur" />

// Option 2: Generate blur data URL for remote images
// Using plaiceholder library:
// npm install plaiceholder sharp

// src/lib/images.ts
import { getPlaiceholder } from 'plaiceholder'

export async function getBlurDataURL(src: string): Promise<string> {
  const buffer = await fetch(src).then((res) => res.arrayBuffer())
  const { base64 } = await getPlaiceholder(Buffer.from(buffer))
  return base64
}

// In a Server Component:
async function HeroSection() {
  const blurDataURL = await getBlurDataURL(heroImageUrl)
  return (
    <Image
      src={heroImageUrl}
      alt="..."
      width={1200}
      height={630}
      placeholder="blur"
      blurDataURL={blurDataURL}
    />
  )
}

// Option 3: Static color placeholder
<Image
  src={imageUrl}
  alt="..."
  width={1200}
  height={630}
  placeholder="blur"
  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BfwAJhAPk5YpJYAAAAABJRU5ErkJggg=="
/>

// Option 4: Empty placeholder (just fade in)
<Image
  src={imageUrl}
  alt="..."
  width={1200}
  height={630}
  placeholder="empty"
  className="transition-opacity duration-300"
  onLoad={(e) => {
    (e.target as HTMLImageElement).classList.remove('opacity-0')
  }}
  // Start hidden
  style={{ opacity: 0 }}
/>
```

### Remote Image Configuration

```tsx
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    // Remote image domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cms.trueomni.com',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],

    // Output formats (default: ['image/webp'])
    formats: ['image/avif', 'image/webp'],

    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],

    // Image sizes for the sizes prop
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Minimum cache TTL (seconds)
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
};
```

### Priority Loading for LCP Images

```tsx
// ALWAYS use priority for the Largest Contentful Paint (LCP) image
// This is typically the hero image or main product image

// Hero section — LCP image
<Image
  src="/images/hero.jpg"
  alt="TrueOmni platform"
  width={1200}
  height={630}
  priority // Adds preload link tag to <head>
  fetchPriority="high" // Browser resource priority hint
  sizes="100vw" // Full viewport width
/>

// Rules for priority:
// - Use on the FIRST visible image above the fold
// - Only use on 1-2 images per page (overusing defeats the purpose)
// - Hero images: ALWAYS priority
// - Carousel first slide: priority
// - Below-fold images: NEVER priority (use loading="lazy" — default)
// - Thumbnails: NEVER priority

// Checking LCP in Lighthouse:
// 1. Run Lighthouse
// 2. Look at "Largest Contentful Paint element"
// 3. If it's an image, add priority to that <Image>
```

---

## 6. Font Loading

### next/font/google

```tsx
// src/app/layout.tsx
import { Inter, Space_Grotesk } from 'next/font/google';

// Body font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Show fallback font immediately, swap when loaded
  variable: '--font-inter', // CSS variable for Tailwind
});

// Heading font
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  weight: ['400', '500', '600', '700'], // Only load needed weights
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

// In Tailwind v4 config (or CSS):
// @theme {
//   --font-sans: var(--font-inter), system-ui, sans-serif;
//   --font-heading: var(--font-heading), system-ui, sans-serif;
// }

// Usage in components:
// <h1 className="font-heading text-4xl font-bold">Heading</h1>
// <p className="font-sans text-base">Body text</p>
```

### next/font/local

```tsx
// For custom fonts not on Google Fonts
import localFont from 'next/font/local';

const satoshi = localFont({
  src: [
    {
      path: '../../public/fonts/Satoshi-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Satoshi-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Satoshi-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Satoshi-Italic.woff2',
      weight: '400',
      style: 'italic',
    },
  ],
  display: 'swap',
  variable: '--font-satoshi',
});

// Variable font (single file, all weights)
const interVariable = localFont({
  src: '../../public/fonts/InterVariable.woff2',
  display: 'swap',
  variable: '--font-inter',
  // Weight range for variable fonts
  weight: '100 900',
});
```

### Font Display Strategies

```
FONT DISPLAY VALUES:
─────────────────────────────────────────────────────
swap    → Show fallback immediately, swap when font loads
         Best for: Body text, most use cases
         Tradeoff: FOUT (Flash of Unstyled Text) but no invisible text

block   → Hide text for up to 3 seconds, then show fallback
         Best for: Icon fonts, display text where layout shift matters
         Tradeoff: FOIT (Flash of Invisible Text)

fallback → Hide text briefly (100ms), then show fallback, swap if font
           loads within 3 seconds
         Best for: Balanced approach for headers

optional → Hide briefly, only use font if already cached
         Best for: Non-essential decorative fonts
         Tradeoff: May never show custom font on first visit

auto    → Browser default (usually similar to block)
         Best for: Almost never — be explicit

RECOMMENDATION FOR TRUEOMNI:
- Body font: display: 'swap'
- Heading font: display: 'swap'
- Icon font: display: 'block'
```

### Preloading Critical Fonts

```tsx
// next/font automatically preloads fonts when used in layout.tsx
// This adds <link rel="preload"> to the <head>

// For fonts used above the fold, ensure they're defined in the ROOT layout
// (not in a page or nested layout)

// Font loading best practices:
// 1. Use next/font (handles preloading, self-hosting, and subsetting)
// 2. Only load needed weights (don't load 100-900 if you only use 400/600/700)
// 3. Only load needed subsets ('latin' for English-only sites)
// 4. Use variable fonts when possible (one file, all weights)
// 5. Use display: 'swap' for body text
// 6. Define fonts in the root layout for preloading
// 7. Use CSS variables + Tailwind for easy font switching
// 8. Test with slow 3G to verify font loading behavior
```

---

## 7. Metadata API

### Static Metadata

```tsx
// src/app/layout.tsx — Base metadata for the entire site
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://trueomni.com'),
  title: {
    default: 'TrueOmni — The Omnichannel Platform',
    template: '%s | TrueOmni', // "%s" is replaced by child page titles
  },
  description:
    'The complete omnichannel solution for modern businesses. Unify your customer experience across all channels.',
  keywords: ['omnichannel', 'customer experience', 'unified commerce', 'analytics'],
  authors: [{ name: 'TrueOmni', url: 'https://trueomni.com' }],
  creator: 'TrueOmni',
  publisher: 'TrueOmni',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://trueomni.com',
    siteName: 'TrueOmni',
    title: 'TrueOmni — The Omnichannel Platform',
    description: 'The complete omnichannel solution for modern businesses.',
    images: [
      {
        url: '/og/default.png',
        width: 1200,
        height: 630,
        alt: 'TrueOmni Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrueOmni — The Omnichannel Platform',
    description: 'The complete omnichannel solution for modern businesses.',
    images: ['/og/default.png'],
    creator: '@trueomni',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  alternates: {
    canonical: 'https://trueomni.com',
  },
  verification: {
    google: 'google-verification-code',
  },
};

// Child pages inherit and override parent metadata:
// src/app/(frontend)/pricing/page.tsx
export const metadata: Metadata = {
  title: 'Pricing Plans', // Becomes "Pricing Plans | TrueOmni" (template)
  description: 'Compare TrueOmni pricing plans. Start free, upgrade as you grow.',
  alternates: {
    canonical: '/pricing',
  },
};
```

### Dynamic Metadata

```tsx
// src/app/(frontend)/blog/[slug]/page.tsx
import type { Metadata } from 'next';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.title,
    description: post.excerpt || post.metaDescription,
    authors: [{ name: post.author.name }],
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt,
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt,
      url: `/blog/${slug}`,
      images: [
        post.ogImage?.url
          ? { url: post.ogImage.url, width: 1200, height: 630, alt: post.title }
          : {
              url: `/api/og?title=${encodeURIComponent(post.title)}&type=blog`,
              width: 1200,
              height: 630,
            },
      ],
      publishedTime: post.publishedAt,
      authors: [post.author.name],
      tags: post.tags,
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}
```

### Open Graph Image Generation

```tsx
// src/app/api/og/route.tsx
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get('title') || 'TrueOmni';
  const subtitle = searchParams.get('subtitle') || 'The Omnichannel Platform';
  const type = searchParams.get('type') || 'page'; // page, blog, product

  // Load custom font
  const interBold = await fetch(
    new URL('../../../../public/fonts/Inter-Bold.ttf', import.meta.url),
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        fontFamily: 'Inter',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: '#3b82f6',
            marginRight: '16px',
          }}
        />
        <span style={{ color: '#94a3b8', fontSize: '24px', fontWeight: 600 }}>TrueOmni</span>
      </div>

      {/* Title */}
      <h1
        style={{
          color: '#f8fafc',
          fontSize: title.length > 50 ? '48px' : '64px',
          fontWeight: 700,
          lineHeight: 1.1,
          marginBottom: '20px',
          maxWidth: '900px',
        }}
      >
        {title}
      </h1>

      {/* Subtitle */}
      <p
        style={{
          color: '#94a3b8',
          fontSize: '28px',
          lineHeight: 1.4,
          maxWidth: '700px',
        }}
      >
        {subtitle}
      </p>

      {/* Type badge */}
      {type !== 'page' && (
        <div
          style={{
            position: 'absolute',
            top: '40px',
            right: '80px',
            background: '#3b82f6',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '16px',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          {type}
        </div>
      )}
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: 'Inter',
          data: interBold,
          weight: 700,
        },
      ],
    },
  );
}
```

### JSON-LD Structured Data

```tsx
// src/lib/structured-data.ts
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'TrueOmni',
    url: 'https://trueomni.com',
    logo: 'https://trueomni.com/logo.png',
    sameAs: [
      'https://twitter.com/trueomni',
      'https://linkedin.com/company/trueomni',
      'https://github.com/trueomni',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'designers@trueomni.com',
      contactType: 'sales',
    },
  };
}

export function generateArticleSchema(post: Post) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image:
      post.ogImage?.url || `https://trueomni.com/api/og?title=${encodeURIComponent(post.title)}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author.name,
      url: `https://trueomni.com/team/${post.author.slug}`,
    },
    publisher: {
      '@type': 'Organization',
      name: 'TrueOmni',
      logo: {
        '@type': 'ImageObject',
        url: 'https://trueomni.com/logo.png',
      },
    },
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `https://trueomni.com${item.url}`,
    })),
  };
}

export function generateProductSchema(product: {
  name: string;
  description: string;
  url: string;
  offers?: { price: number; currency: string; planName: string }[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: product.name,
    description: product.description,
    url: product.url,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: product.offers?.map((offer) => ({
      '@type': 'Offer',
      name: offer.planName,
      price: offer.price,
      priceCurrency: offer.currency,
      url: product.url,
    })),
  };
}

// Usage in page.tsx:
export default function Page() {
  const jsonLd = generateOrganizationSchema();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Page content */}
    </>
  );
}
```

### Sitemap Generation

```tsx
// src/app/sitemap.ts
import type { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://trueomni.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/product`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/customers`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/company/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/company/contact`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/demo`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
  ];

  // Dynamic pages from CMS
  const posts = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'published' } },
    select: { slug: true, updatedAt: true },
    limit: 0,
  });

  const blogPages: MetadataRoute.Sitemap = posts.docs.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const caseStudies = await payload.find({
    collection: 'case-studies',
    where: { status: { equals: 'published' } },
    select: { slug: true, updatedAt: true },
    limit: 0,
  });

  const caseStudyPages: MetadataRoute.Sitemap = caseStudies.docs.map((cs) => ({
    url: `${baseUrl}/customers/${cs.slug}`,
    lastModified: new Date(cs.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages, ...caseStudyPages];
}

// robots.txt
// src/app/robots.ts
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/preview/'],
      },
    ],
    sitemap: 'https://trueomni.com/sitemap.xml',
  };
}
```

---

## 8. Middleware Patterns

### Authentication Checks

```tsx
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('payload-token');
    if (!token) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect API routes (require API key)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

// Only run middleware on specific paths
export const config = {
  matcher: [
    '/admin/:path*',
    '/api/:path*',
    // Exclude static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
```

### Redirects and Rewrites

```tsx
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect old URLs to new ones
  const redirects: Record<string, string> = {
    '/features': '/product',
    '/about': '/company/about',
    '/blog/old-slug': '/blog/new-slug',
  };

  if (redirects[pathname]) {
    return NextResponse.redirect(new URL(redirects[pathname], request.url), 301);
  }

  // Rewrite (proxy) — URL stays the same, content is different
  if (pathname === '/docs') {
    return NextResponse.rewrite(new URL('/api/docs-proxy', request.url));
  }

  // Add trailing slash redirect
  if (pathname !== '/' && pathname.endsWith('/')) {
    return NextResponse.redirect(new URL(pathname.slice(0, -1), request.url), 308);
  }

  return NextResponse.next();
}
```

### Geolocation-Based Routing

```tsx
export function middleware(request: NextRequest) {
  // Vercel provides geo data automatically
  const country = request.geo?.country || 'US';
  const city = request.geo?.city || 'Unknown';
  const region = request.geo?.region || 'Unknown';

  // Set headers for use in Server Components
  const response = NextResponse.next();
  response.headers.set('x-user-country', country);
  response.headers.set('x-user-city', city);

  // Redirect EU users to GDPR-compliant version
  const euCountries = [
    'DE',
    'FR',
    'ES',
    'IT',
    'NL',
    'BE',
    'AT',
    'SE',
    'DK',
    'FI',
    'IE',
    'PT',
    'GR',
    'PL',
    'CZ',
    'RO',
    'HU',
    'BG',
    'HR',
    'SK',
    'SI',
    'LT',
    'LV',
    'EE',
    'LU',
    'MT',
    'CY',
  ];
  if (euCountries.includes(country) && !request.cookies.get('gdpr-consent')) {
    // Show GDPR consent banner
    response.headers.set('x-show-gdpr-banner', 'true');
  }

  return response;
}
```

### A/B Testing

```tsx
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only A/B test specific pages
  if (pathname === '/' || pathname === '/pricing') {
    // Check if user already has a variant assigned
    let variant = request.cookies.get('ab-variant')?.value;

    if (!variant) {
      // Assign variant randomly (50/50)
      variant = Math.random() < 0.5 ? 'a' : 'b';
    }

    const response = NextResponse.next();

    // Set cookie for consistent experience
    response.cookies.set('ab-variant', variant, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: 'lax',
    });

    // Set header for use in Server Components
    response.headers.set('x-ab-variant', variant);

    return response;
  }

  return NextResponse.next();
}

// In Server Component:
import { headers } from 'next/headers';

export default async function HomePage() {
  const headerList = await headers();
  const variant = headerList.get('x-ab-variant') || 'a';

  return variant === 'a' ? <HeroVariantA /> : <HeroVariantB />;
}
```

---

## 9. Vercel-Specific Features

### Vercel Analytics Integration

```tsx
// Install: npm install @vercel/analytics @vercel/speed-insights

// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics /> {/* Page view tracking */}
        <SpeedInsights /> {/* Core Web Vitals monitoring */}
      </body>
    </html>
  );
}

// Custom events tracking
import { track } from '@vercel/analytics';

// Track in Client Components:
function DemoButton() {
  return (
    <Button
      onClick={() => {
        track('demo_requested', {
          source: 'hero',
          plan: 'enterprise',
        });
      }}
    >
      Request Demo
    </Button>
  );
}

// Track in Server Actions:
('use server');
import { track } from '@vercel/analytics/server';

export async function submitForm(data: FormData) {
  await track('form_submitted', { type: 'contact' });
  // ... process form
}
```

### @vercel/og for Dynamic OG Images

```tsx
// Already covered in Metadata section (section 7)
// Key points:
// - Uses Edge Runtime for fast generation
// - Supports custom fonts, images, and layouts
// - Auto-cached by Vercel CDN
// - Maximum 1200x630 resolution recommended
// - Use with generateMetadata for dynamic pages
```

### Edge Config

```tsx
// Edge Config: Ultra-fast key-value store for configuration
// Use for: Feature flags, redirects, A/B test configs
// Install: npm install @vercel/edge-config

import { get } from '@vercel/edge-config';

// In middleware or Edge functions:
export async function middleware(request: NextRequest) {
  // Read feature flags (< 1ms read time)
  const maintenanceMode = await get<boolean>('maintenance_mode');

  if (maintenanceMode) {
    return NextResponse.rewrite(new URL('/maintenance', request.url));
  }

  // Read A/B test config
  const abConfig = await get<{ enabled: boolean; splitPercentage: number }>('ab_hero_test');

  if (abConfig?.enabled) {
    // Apply A/B test logic
  }

  return NextResponse.next();
}

// In Server Components:
import { get } from '@vercel/edge-config';

async function FeatureSection() {
  const features = await get<string[]>('enabled_features');
  // Render only enabled features
}
```

### Cron Jobs

```tsx
// vercel.json — Define cron schedule
{
  "crons": [
    {
      "path": "/api/cron/daily-report",
      "schedule": "0 9 * * *"  // Every day at 9 AM UTC
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 0 * * 0"  // Every Sunday at midnight UTC
    },
    {
      "path": "/api/cron/sitemap-ping",
      "schedule": "0 */6 * * *"  // Every 6 hours
    }
  ]
}

// src/app/api/cron/daily-report/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Execute cron job logic
  await generateDailyReport()
  await sendReportEmail()

  return NextResponse.json({ success: true })
}
```

### Preview Deployments

```tsx
// Vercel creates preview deployments for every git push

// Useful patterns for preview deployments:

// 1. Draft mode for CMS preview
// src/app/api/preview/route.ts
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');
  const slug = request.nextUrl.searchParams.get('slug');

  if (secret !== process.env.PREVIEW_SECRET) {
    return new Response('Invalid token', { status: 401 });
  }

  const draft = await draftMode();
  draft.enable();
  redirect(slug || '/');
}

// 2. Check if running in preview
const isPreview = process.env.VERCEL_ENV === 'preview';

// 3. Preview banner component
function PreviewBanner() {
  return (
    <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-amber-950">
      Preview Mode —{' '}
      <a href="/api/exit-preview" className="underline">
        Exit
      </a>
    </div>
  );
}

// 4. Exit preview mode
// src/app/api/exit-preview/route.ts
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET() {
  const draft = await draftMode();
  draft.disable();
  redirect('/');
}
```

---

## 10. Caching Strategies

### Full Route Cache

```
FULL ROUTE CACHE:
- Caches the entire rendered HTML of a route
- Applied to statically rendered routes at build time
- Invalidated by: revalidatePath(), revalidateTag(), redeploying

WHEN IT APPLIES:
- Routes without dynamic functions (headers, cookies, searchParams)
- Routes with export const dynamic = 'force-static'
- Routes with generateStaticParams

WHEN IT DOES NOT APPLY:
- Routes using dynamic functions
- Routes with export const dynamic = 'force-dynamic'
- Routes during draft mode
```

### Data Cache

```tsx
// The Data Cache stores fetch results and unstable_cache results

// Cached fetch (opt-in in Next.js 15)
const data = await fetch('https://api.example.com/data', {
  next: {
    revalidate: 3600, // Cache for 1 hour
    tags: ['data-tag'], // Tag for on-demand revalidation
  },
});

// unstable_cache for non-fetch operations (database queries, etc.)
import { unstable_cache } from 'next/cache';

const getCachedData = unstable_cache(
  async (id: string) => {
    return await db.query(`SELECT * FROM items WHERE id = $1`, [id]);
  },
  ['item-by-id'], // Cache key parts
  {
    revalidate: 3600, // 1 hour
    tags: ['items'], // For on-demand revalidation
  },
);

// Direct Payload CMS queries with caching
const getCachedPosts = unstable_cache(
  async (options?: { limit?: number; page?: number }) => {
    return await payload.find({
      collection: 'posts',
      where: { status: { equals: 'published' } },
      sort: '-publishedAt',
      limit: options?.limit || 10,
      page: options?.page || 1,
    });
  },
  ['published-posts'],
  {
    revalidate: 300, // 5 minutes
    tags: ['posts'],
  },
);
```

### Request Memoization

```tsx
// React automatically deduplicates identical fetch requests in a single render pass

// This is AUTOMATIC — no configuration needed
// Multiple components calling the same fetch get a single network request

// Component A
async function Header() {
  const settings = await getSiteSettings(); // Fetch #1
  return <nav>{settings.siteName}</nav>;
}

// Component B
async function Footer() {
  const settings = await getSiteSettings(); // Same fetch — deduplicated!
  return <footer>{settings.copyright}</footer>;
}

// Both components are rendered in the same request
// Only ONE actual fetch/database query is made

// This works for:
// - fetch() calls with the same URL and options
// - React.cache() wrapped functions

import { cache } from 'react';

export const getSiteSettings = cache(async () => {
  return await payload.findGlobal({ slug: 'site-settings' });
});

// Now getSiteSettings() is memoized per request
// Called 10 times = 1 actual database query
```

### revalidatePath and revalidateTag

```tsx
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

// Revalidate a specific page
export async function updatePost(id: string, data: PostData) {
  await payload.update({ collection: 'posts', id, data });

  // Option 1: Revalidate by path
  revalidatePath('/blog'); // Blog listing
  revalidatePath(`/blog/${data.slug}`); // Specific post
  revalidatePath('/', 'layout'); // Entire layout tree

  // Option 2: Revalidate by tag (preferred — more granular)
  revalidateTag('posts'); // All cached data tagged 'posts'
  revalidateTag(`post-${data.slug}`); // Specific post cache
}

// In Payload CMS hook (afterChange):
// This revalidates pages when content is edited in the admin
export const afterChangeHook: CollectionAfterChangeHook = async ({ doc, collection }) => {
  revalidateTag(collection.slug); // Revalidate all data for this collection

  if (doc.slug) {
    // Revalidate the specific page
    switch (collection.slug) {
      case 'posts':
        revalidatePath(`/blog/${doc.slug}`);
        revalidatePath('/blog');
        break;
      case 'pages':
        revalidatePath(`/${doc.slug}`);
        break;
      case 'case-studies':
        revalidatePath(`/customers/${doc.slug}`);
        revalidatePath('/customers');
        break;
    }
  }
};

// PATH vs TAG revalidation:
// revalidatePath('/blog')     → Clears ALL cached data on the /blog route
// revalidateTag('posts')      → Clears ONLY data tagged 'posts' (more precise)
// Prefer tags when you have multiple data sources on one page
```

---

## 11. Performance Optimization

### Bundle Analysis

```bash
# Analyze bundle size
# Install: npm install @next/bundle-analyzer

# next.config.ts
import withBundleAnalyzer from '@next/bundle-analyzer'

const config = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})({
  // ... other config
})

# Run analysis:
ANALYZE=true npm run build
# Opens interactive treemap in browser
```

### Tree Shaking

```tsx
// CORRECT: Named imports (tree-shakeable)
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

// WRONG: Default imports of large libraries
import _ from 'lodash'; // Imports ALL of lodash (~70KB)
import * as Icons from 'lucide-react'; // Imports ALL icons

// CORRECT: Import only what you need
import debounce from 'lodash/debounce'; // Only debounce (~1KB)
import { Search, Menu, X } from 'lucide-react'; // Only 3 icons

// Check if a library is tree-shakeable:
// 1. Look for "sideEffects: false" in its package.json
// 2. Check if it uses ES modules (import/export)
// 3. Test with bundle analyzer
```

### Code Splitting

```tsx
// Automatic code splitting:
// - Each page.tsx is automatically a separate chunk
// - Each layout.tsx is a separate chunk
// - Each route group is a separate chunk

// Manual code splitting with dynamic imports:
import dynamic from 'next/dynamic';

// Heavy component loaded only when needed
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Client-only component (e.g., uses canvas/WebGL)
});

// Conditionally loaded component
const AdminPanel = dynamic(() => import('@/components/AdminPanel'), {
  loading: () => <Spinner />,
});

function Dashboard({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div>
      <MainContent />
      {isAdmin && <AdminPanel />} {/* Only loaded for admins */}
    </div>
  );
}

// Dynamic import for utilities
async function handleExport() {
  const { exportToPDF } = await import('@/lib/pdf-export');
  await exportToPDF(data);
}

// Route-based code splitting is automatic in App Router
// Each page only loads the JavaScript it needs
```

### React.lazy and Suspense

```tsx
// For Client Components that are heavy and not needed immediately
'use client';

import { lazy, Suspense } from 'react';

// Lazy load a heavy client component
const MapComponent = lazy(() => import('@/components/Map'));
const VideoPlayer = lazy(() => import('@/components/VideoPlayer'));
const RichTextEditor = lazy(() => import('@/components/RichTextEditor'));

function ContactPage() {
  return (
    <div>
      <ContactForm />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-gray-100" />}>
        <MapComponent location={{ lat: 40.7128, lng: -74.006 }} />
      </Suspense>
    </div>
  );
}

// In Server Components, use dynamic imports with next/dynamic instead of React.lazy
```

### Prefetching

```tsx
// Next.js Link prefetches by default in production
import Link from 'next/link'

// Prefetching behavior:
<Link href="/pricing">Pricing</Link>
// ↑ Prefetches /pricing when the link enters the viewport
//   (in production only, not in development)

// Disable prefetch for links that are rarely clicked
<Link href="/legal/privacy" prefetch={false}>Privacy Policy</Link>

// Programmatic prefetch
import { useRouter } from 'next/navigation'

function SearchButton() {
  const router = useRouter()

  return (
    <button
      onMouseEnter={() => router.prefetch('/search')} // Prefetch on hover
      onClick={() => router.push('/search')}
    >
      Search
    </button>
  )
}

// Route prefetching in App Router:
// - Static routes: Full page is prefetched and cached
// - Dynamic routes: Only shared layout is prefetched (30 second cache)
// - Loading.tsx is prefetched (shows immediately during navigation)
```

### Performance Checklist

```
CORE WEB VITALS TARGETS:
LCP  < 2.5s  (1.8s for excellent)
CLS  < 0.1   (0.05 for excellent)
INP  < 200ms (100ms for excellent)
TTFB < 800ms (600ms for excellent)
FCP  < 1.8s  (1.0s for excellent)

LCP OPTIMIZATION:
□ Hero image uses priority and fetchPriority="high"
□ Fonts are preloaded via next/font in root layout
□ No render-blocking JavaScript above the fold
□ Server Components for above-fold content (no client-side rendering delay)
□ Streaming with Suspense (shell renders fast)
□ Images use next/image with proper sizes
□ No large client-side libraries imported in above-fold components

CLS OPTIMIZATION:
□ All images have explicit width and height (or aspect-ratio)
□ No dynamically injected content above the fold
□ Font loading uses display: 'swap' with matched fallback metrics
□ Skeleton loaders match content dimensions
□ No layout-shifting ads or embeds
□ reserve space for dynamic content with min-height

INP OPTIMIZATION:
□ Event handlers are lightweight (< 50ms)
□ Heavy computation offloaded to Web Workers
□ Use startTransition for non-urgent state updates
□ Debounce rapid user inputs (search, scroll)
□ Avoid large component re-renders (use React.memo, useMemo)
□ Keep main thread free (no synchronous long tasks)

BUNDLE SIZE:
□ Total JavaScript < 150KB (compressed)
□ No unused dependencies in bundle
□ Tree shaking working (no default imports of large libraries)
□ Dynamic imports for heavy client components
□ Analyzed with @next/bundle-analyzer
□ No duplicate dependencies (check with npm ls <package>)
```

---

## 12. React 19 Features

### useActionState for Forms

```tsx
// Replaces useFormState (deprecated in React 19)
// Manages form state including pending, errors, and response

'use client';

import { useActionState } from 'react';

interface FormState {
  success: boolean;
  errors?: Record<string, string[]>;
  message?: string;
}

async function submitAction(prevState: FormState | null, formData: FormData): Promise<FormState> {
  'use server';

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  if (!name || name.length < 2) {
    return {
      success: false,
      errors: { name: ['Name must be at least 2 characters'] },
    };
  }

  if (!email || !email.includes('@')) {
    return {
      success: false,
      errors: { email: ['Please enter a valid email'] },
    };
  }

  await saveToDatabase({ name, email });
  return { success: true, message: 'Submitted successfully!' };
}

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitAction, null);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" disabled={isPending} />
        {state?.errors?.name && <p className="mt-1 text-sm text-red-600">{state.errors.name[0]}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" disabled={isPending} />
        {state?.errors?.email && (
          <p className="mt-1 text-sm text-red-600">{state.errors.email[0]}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Submitting...' : 'Submit'}
      </Button>

      {state?.success && (
        <p className="text-green-600" role="status">
          {state.message}
        </p>
      )}
    </form>
  );
}
```

### useFormStatus for Pending States

```tsx
// useFormStatus reads the status of the parent <form>
// Must be used inside a component rendered within a <form>

'use client';

import { useFormStatus } from 'react-dom';

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending, data, method, action } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Submitting...
        </>
      ) : (
        children
      )}
    </Button>
  );
}

// Usage:
function MyForm() {
  return (
    <form action={submitAction}>
      <Input name="email" type="email" />
      <SubmitButton>Subscribe</SubmitButton> {/* Reads parent form status */}
    </form>
  );
}

// IMPORTANT: useFormStatus reads the status of the PARENT <form>
// It must be rendered as a CHILD of the form, not a sibling
// WRONG: <div><form>...</form><SubmitButton /></div>
// CORRECT: <form>...<SubmitButton /></form>
```

### useOptimistic for Optimistic Updates

```tsx
// useOptimistic provides immediate UI feedback before server confirmation

'use client';

import { useOptimistic } from 'react';

interface Message {
  id: string;
  content: string;
  sending?: boolean;
}

export function MessageList({
  messages: serverMessages,
  sendAction,
}: {
  messages: Message[];
  sendAction: (formData: FormData) => Promise<void>;
}) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    serverMessages,
    (state: Message[], newMessage: string) => [
      ...state,
      {
        id: `temp-${Date.now()}`,
        content: newMessage,
        sending: true, // Visual indicator
      },
    ],
  );

  async function handleSubmit(formData: FormData) {
    const content = formData.get('content') as string;
    addOptimisticMessage(content); // Update UI immediately
    await sendAction(formData); // Then send to server
    // When server responds, React reconciles with real data
  }

  return (
    <div>
      <ul className="space-y-2">
        {optimisticMessages.map((msg) => (
          <li
            key={msg.id}
            className={cn('rounded-lg p-3', msg.sending ? 'bg-blue-50 opacity-70' : 'bg-white')}
          >
            {msg.content}
            {msg.sending && <span className="ml-2 text-xs text-gray-400">Sending...</span>}
          </li>
        ))}
      </ul>

      <form action={handleSubmit} className="mt-4 flex gap-2">
        <Input name="content" placeholder="Type a message..." />
        <Button type="submit">Send</Button>
      </form>
    </div>
  );
}

// Common use cases for useOptimistic:
// - Like/unlike buttons (show filled heart immediately)
// - Todo completion (show strikethrough immediately)
// - Message sending (show message immediately with "sending..." indicator)
// - Form submissions (show success state immediately)
// - Delete actions (remove item from list immediately)
```

### Server Functions

```tsx
// Server Functions run exclusively on the server
// They can be called from Client Components

// 'use server' at the top of a file makes ALL exports server functions
// src/app/actions.ts
'use server';

export async function getUser(id: string) {
  return await db.user.findUnique({ where: { id } });
}

export async function updateUser(id: string, data: Partial<User>) {
  return await db.user.update({ where: { id }, data });
}

export async function deleteUser(id: string) {
  await db.user.delete({ where: { id } });
  revalidatePath('/admin/users');
}

// 'use server' inline makes a single function a server function
export default function Page() {
  async function handleSubmit(formData: FormData) {
    'use server';
    // This runs on the server
    await processFormData(formData);
  }

  return <form action={handleSubmit}>...</form>;
}

// Server Functions can be:
// - Passed as action prop to <form>
// - Called from event handlers in Client Components
// - Used with useActionState, useFormStatus

// Security considerations:
// - Server Functions are POST endpoints — treat inputs as untrusted
// - Always validate and sanitize inputs (use Zod)
// - Check authentication and authorization
// - Rate limit if exposed to users
// - Never trust client-side data — always re-validate on server

// Example with auth check:
('use server');

import { auth } from '@/lib/auth';

export async function createProject(formData: FormData) {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');

  const data = projectSchema.parse({
    name: formData.get('name'),
    description: formData.get('description'),
  });

  return await payload.create({
    collection: 'projects',
    data: { ...data, createdBy: session.user.id },
  });
}
```

---

## Quick Reference Cards

### Next.js 15 Config Options

```tsx
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Rendering
  reactStrictMode: true,

  // Experimental
  experimental: {
    ppr: true, // Partial Prerendering
    reactCompiler: true, // React Compiler (auto-memoization)
    serverActions: {
      bodySizeLimit: '2mb', // Server Action body size limit
    },
    optimizePackageImports: [
      // Optimize barrel imports
      'lucide-react',
      '@radix-ui/react-icons',
      'date-fns',
      'lodash',
    ],
  },

  // Images
  images: {
    remotePatterns: [{ hostname: 'cms.trueomni.com' }],
    formats: ['image/avif', 'image/webp'],
  },

  // Redirects
  async redirects() {
    return [{ source: '/old-path', destination: '/new-path', permanent: true }];
  },

  // Headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },

  // Webpack (for custom configs)
  webpack: (config) => {
    // Custom webpack config
    return config;
  },
};

export default nextConfig;
```

### Route Segment Config

```tsx
// These exports in any page.tsx, layout.tsx, or route.ts
// control the behavior of that route segment

// Force static rendering
export const dynamic = 'force-static';

// Force dynamic rendering (SSR)
export const dynamic = 'force-dynamic';

// Revalidation interval (ISR)
export const revalidate = 3600; // seconds (0 = always revalidate)
export const revalidate = false; // never revalidate (static)

// Runtime
export const runtime = 'nodejs'; // default
export const runtime = 'edge'; // Edge Runtime

// Preferred region (Vercel)
export const preferredRegion = 'iad1'; // US East
export const preferredRegion = ['iad1', 'sfo1']; // Multiple regions
export const preferredRegion = 'auto'; // Vercel decides

// Maximum duration (Vercel)
export const maxDuration = 30; // seconds (default: 10 on Hobby, 60 on Pro)

// Fetch cache
export const fetchCache = 'default-cache'; // Cache by default
export const fetchCache = 'default-no-store'; // No cache by default
```

---

_This skill provides comprehensive patterns for building production-grade Next.js 15 applications deployed on Vercel. Apply these patterns during the implementation phase of the TrueOmni Website 2026 project for optimal performance, developer experience, and user experience._
