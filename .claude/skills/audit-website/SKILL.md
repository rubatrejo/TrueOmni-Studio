# Audit Website

---

name: audit-website
description: |
Comprehensive website audit framework covering technical performance, visual design,
content quality, and SEO. Includes Lighthouse automation, screenshot workflows,
competitive analysis frameworks, Core Web Vitals interpretation, and detailed
report templates. Used for auditing reference sites, the current TrueOmni site,
and competitors during the design and development process.
triggers:

- audit website
- audit site
- website audit
- performance audit
- lighthouse audit
- SEO audit
- visual audit
- content audit
- competitive analysis
- benchmark site
- analyze website
- core web vitals
- page speed
- accessibility audit

---

## Table of Contents

1. [Complete Audit Framework](#1-complete-audit-framework)
2. [Pillar 1: Technical Audit](#2-pillar-1-technical-audit)
3. [Pillar 2: Visual Audit](#3-pillar-2-visual-audit)
4. [Pillar 3: Content Audit](#4-pillar-3-content-audit)
5. [Pillar 4: SEO Audit](#5-pillar-4-seo-audit)
6. [Lighthouse Automation Guide](#6-lighthouse-automation-guide)
7. [Screenshot Capture Workflow](#7-screenshot-capture-workflow)
8. [Competitive Analysis Framework](#8-competitive-analysis-framework)
9. [Output Report Templates](#9-output-report-templates)
10. [Core Web Vitals Interpretation](#10-core-web-vitals-interpretation)
11. [SEO Checklist by Page Type](#11-seo-checklist-by-page-type)
12. [Accessibility Quick Audit](#12-accessibility-quick-audit)
13. [Performance Budget Template](#13-performance-budget-template)
14. [Tools Reference](#14-tools-reference)

---

## 1. Complete Audit Framework

### Audit Process Overview

```
COMPLETE WEBSITE AUDIT — 4 PILLARS
═══════════════════════════════════════════════════════════════

┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PILLAR 1      │  │   PILLAR 2      │  │   PILLAR 3      │  │   PILLAR 4      │
│   TECHNICAL     │  │   VISUAL        │  │   CONTENT       │  │   SEO           │
│                 │  │                 │  │                 │  │                 │
│ - Performance   │  │ - Design System │  │ - Copy Quality  │  │ - Meta Tags     │
│ - Core Web      │  │ - Spacing       │  │ - Heading       │  │ - Sitemap       │
│   Vitals        │  │ - Typography    │  │   Hierarchy     │  │ - robots.txt    │
│ - Build Size    │  │ - Color Usage   │  │ - Alt Texts     │  │ - Canonical     │
│ - TTFB, FCP,    │  │ - Responsive    │  │ - Structured    │  │ - Open Graph    │
│   LCP, CLS, INP│  │ - Animations    │  │   Data          │  │ - Twitter Cards │
│ - Lighthouse    │  │ - Consistency   │  │ - Readability   │  │ - JSON-LD       │
│ - Security      │  │ - Accessibility │  │ - CTA Strategy  │  │ - Internal      │
│   Headers       │  │   Visual        │  │ - Tone/Voice    │  │   Linking       │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │                    │
         └────────────────────┴────────────────────┴────────────────────┘
                                      │
                              ┌───────┴───────┐
                              │  AUDIT REPORT │
                              │  + SCORECARD  │
                              └───────────────┘
```

### When to Run Each Audit Type

```
AUDIT TYPE          WHEN TO RUN                       OUTPUT
────────────────────────────────────────────────────────────────
Full 4-pillar       Reference sites during Moodboard  docs/audits/[site]-summary.md
Technical only      After each sprint (QA)             docs/audits/sprint-[n]-tech.md
Visual only         After UI changes                   docs/audits/visual-[date].md
Content only        Before content migration           docs/audits/content-[date].md
SEO only            Before launch + monthly            docs/audits/seo-[date].md
Competitive         Phase 0 (PRD) + quarterly          docs/competitive-analysis.md
Quick health check  Before every deploy                Inline in PR description
────────────────────────────────────────────────────────────────
```

### Scoring System

```
SCORING RUBRIC (1-5 scale for each category):

5 — EXCELLENT
    Industry-leading. Could be used as a reference/inspiration.
    No significant issues found. Exceeds best practices.

4 — GOOD
    Above average. Minor issues that don't significantly impact UX.
    Follows most best practices with room for minor improvements.

3 — ADEQUATE
    Meets minimum standards. Some notable issues that should be addressed.
    Functional but not optimized.

2 — BELOW AVERAGE
    Several significant issues. Noticeably impacts user experience.
    Below industry standard. Needs attention.

1 — POOR
    Major issues across the board. Significantly impacts usability,
    performance, or findability. Requires immediate remediation.

OVERALL SCORE CALCULATION:
Technical × 0.30 + Visual × 0.25 + Content × 0.20 + SEO × 0.25 = Weighted Score
```

---

## 2. Pillar 1: Technical Audit

### Performance Metrics

```
CORE WEB VITALS (measured by Lighthouse, Chrome UX Report, or PageSpeed Insights):

METRIC   FULL NAME                    GOOD      NEEDS WORK    POOR
─────────────────────────────────────────────────────────────────────
LCP      Largest Contentful Paint     < 2.5s    2.5-4.0s      > 4.0s
INP      Interaction to Next Paint    < 200ms   200-500ms     > 500ms
CLS      Cumulative Layout Shift      < 0.1     0.1-0.25      > 0.25

OTHER IMPORTANT METRICS:
─────────────────────────────────────────────────────────────────────
TTFB     Time to First Byte           < 800ms   800-1800ms    > 1800ms
FCP      First Contentful Paint       < 1.8s    1.8-3.0s      > 3.0s
SI       Speed Index                  < 3.4s    3.4-5.8s      > 5.8s
TBT      Total Blocking Time          < 200ms   200-600ms     > 600ms
TTI      Time to Interactive          < 3.8s    3.8-7.3s      > 7.3s
```

### Technical Audit Checklist

```
PERFORMANCE:
□ Lighthouse Performance score (target: 90+)
□ LCP < 2.5s on mobile
□ CLS < 0.1
□ INP < 200ms
□ TTFB < 800ms
□ FCP < 1.8s
□ Total JavaScript bundle size < 200KB (compressed)
□ Total CSS bundle size < 50KB (compressed)
□ No render-blocking resources
□ Images optimized (WebP/AVIF, proper sizing, lazy loading)
□ Fonts optimized (preloaded, swap display, subset)
□ Third-party scripts minimized and deferred
□ HTTP/2 or HTTP/3 enabled
□ Compression enabled (Gzip/Brotli)
□ CDN in use for static assets
□ Browser caching configured (Cache-Control headers)

INFRASTRUCTURE:
□ HTTPS enabled with valid certificate
□ HTTP → HTTPS redirect in place
□ www → non-www redirect (or vice versa) — consistent
□ Response codes correct (200 for pages, 301 for redirects, 404 for missing)
□ No 5xx errors in server logs
□ Uptime monitoring in place
□ Error tracking in place (Sentry or similar)

SECURITY HEADERS:
□ Content-Security-Policy (CSP) — or at least a report-only policy
□ X-Content-Type-Options: nosniff
□ X-Frame-Options: DENY (or SAMEORIGIN)
□ Strict-Transport-Security (HSTS)
□ Referrer-Policy: strict-origin-when-cross-origin
□ Permissions-Policy (camera, microphone, geolocation restrictions)
□ No sensitive data in HTML source (API keys, credentials, internal URLs)

BUILD & DEPLOYMENT:
□ Build completes without errors
□ No TypeScript errors (npx tsc --noEmit passes)
□ No linting errors (npm run lint passes)
□ No console errors in production
□ No console.log statements in production code
□ Environment variables properly configured
□ Preview deployments working
□ Rollback capability available
```

### How to Run Technical Audit

```bash
# 1. Lighthouse CLI (comprehensive)
npx lighthouse https://example.com \
  --output json --output html \
  --output-path ./docs/audits/example-lighthouse \
  --chrome-flags="--headless" \
  --throttling-method=devtools \
  --preset=desktop

# Also run for mobile:
npx lighthouse https://example.com \
  --output json --output html \
  --output-path ./docs/audits/example-lighthouse-mobile \
  --chrome-flags="--headless" \
  --form-factor=mobile \
  --throttling.cpuSlowdownMultiplier=4

# 2. Core Web Vitals field data (real user data from Chrome UX Report)
# Visit: https://pagespeed.web.dev/analysis?url=https://example.com

# 3. Check security headers
curl -I https://example.com 2>/dev/null | grep -i -E "content-security|x-frame|x-content|strict-transport|referrer-policy|permissions-policy"

# 4. Check for HTTP/2
curl -I --http2 https://example.com 2>/dev/null | head -1

# 5. Check SSL certificate
echo | openssl s_client -connect example.com:443 2>/dev/null | openssl x509 -noout -dates

# 6. Check response times from multiple endpoints
for page in "" "/pricing" "/blog" "/product"; do
  echo -n "$page: "
  curl -o /dev/null -s -w "%{time_total}s\n" "https://example.com$page"
done

# 7. Check for common issues
# Broken links (install linkinator):
npx linkinator https://example.com --recurse --verbosity error

# 8. WebPageTest (more detailed than Lighthouse)
# Visit: https://www.webpagetest.org/
# Run from multiple locations and connection speeds
```

---

## 3. Pillar 2: Visual Audit

### Visual Audit Checklist

```
DESIGN CONSISTENCY:
□ Consistent color palette throughout the site
□ Colors match brand guidelines (if available)
□ Color contrast meets WCAG AA (4.5:1 for normal text, 3:1 for large text)
□ Consistent use of primary, secondary, and accent colors
□ Semantic colors used correctly (red for errors, green for success, etc.)

TYPOGRAPHY:
□ Consistent font family usage (max 2-3 font families)
□ Consistent type scale (heading sizes follow a logical progression)
□ Body text is readable (>= 16px, >= 1.5 line-height)
□ Heading hierarchy is visually clear (H1 > H2 > H3 > H4)
□ Font weights used consistently (not random bold/regular)
□ No tiny text (< 12px)
□ Text contrast sufficient against all backgrounds

SPACING:
□ Consistent spacing rhythm (4px or 8px base)
□ Adequate whitespace between sections
□ Consistent padding within cards/containers
□ Consistent margin between elements
□ No cramped areas or wasted space
□ Grid alignment is consistent

LAYOUT:
□ Grid system is consistent across pages
□ Container max-width is appropriate (usually 1200-1440px)
□ Content is centered and well-framed
□ Visual hierarchy guides the eye (most important content is most prominent)
□ Above-the-fold content communicates the core value proposition
□ No horizontal overflow at any viewport

RESPONSIVE BEHAVIOR:
□ Layout adapts gracefully from desktop to mobile
□ No content is lost or hidden on mobile (or hidden content is accessible)
□ Touch targets are large enough on mobile (>= 44px)
□ Text is readable without zooming on mobile
□ Images scale appropriately
□ Navigation is usable on all devices
□ Test at: 320px, 375px, 414px, 768px, 1024px, 1280px, 1440px, 1920px

ANIMATIONS & TRANSITIONS:
□ Animations are purposeful (guide attention, provide feedback)
□ Animations are not distracting or excessive
□ Transitions are smooth (not janky)
□ Animations respect prefers-reduced-motion
□ Loading states have appropriate animations
□ No animation causes layout shift
□ Duration is appropriate (200-500ms for UI transitions)

IMAGERY:
□ Images are high quality (not pixelated)
□ Images support the content (not generic stock photos)
□ Consistent image style (photography, illustration, icons)
□ Images have appropriate aspect ratios
□ No broken images
□ Icons are from a consistent set
□ Logo is displayed correctly at all sizes

COMPONENTS:
□ Buttons have consistent styling across the site
□ Form inputs have consistent styling
□ Cards have consistent styling
□ Navigation has clear active/current states
□ Links are visually distinguishable from body text
□ Hover/focus/active states are consistent
□ Disabled states are clearly communicable
```

### Visual Audit Process

```
STEP 1: Capture screenshots at multiple viewports
├── Mobile portrait (375px)
├── Mobile landscape (667px)
├── Tablet portrait (768px)
├── Tablet landscape (1024px)
├── Desktop (1280px)
├── Desktop large (1440px)
└── Desktop extra large (1920px)

STEP 2: For each page, document:
├── Screenshot with annotations
├── Color usage (extract palette with eyedropper)
├── Typography (identify fonts, sizes, weights used)
├── Spacing patterns (measure margins, padding, gaps)
├── Component patterns (buttons, cards, forms, nav)
└── Accessibility issues (contrast, focus states)

STEP 3: Cross-page comparison
├── Is the header consistent across pages?
├── Is the footer consistent?
├── Are component styles consistent (buttons, cards, etc.)?
├── Is the spacing rhythm consistent?
├── Is the color usage consistent?
└── Are animations consistent in style and duration?

STEP 4: Rate each subcategory (1-5) and provide notes
└── Output: docs/audits/[site]-visual.md
```

---

## 4. Pillar 3: Content Audit

### Content Audit Checklist

```
COPY QUALITY:
□ Headlines are clear, specific, and value-oriented
□ Subheadlines support headlines with additional detail
□ Body copy is concise and scannable
□ No jargon without explanation
□ No placeholder/lorem ipsum text in production
□ Grammar and spelling are correct
□ Tone of voice is consistent across the site
□ CTAs are specific and action-oriented

HEADING HIERARCHY:
□ Every page has exactly one H1
□ H1 contains the primary topic/keyword
□ Heading levels are sequential (H1 → H2 → H3, no skipping)
□ Headings are descriptive (not "Section 1" or "More Info")
□ Headings create a logical table of contents when read alone

SEO CONTENT:
□ Meta titles are unique per page (< 60 characters)
□ Meta descriptions are unique per page (120-160 characters)
□ Meta descriptions include a call to action
□ URLs are clean, descriptive, and lowercase
□ No duplicate content across pages
□ Content is original (not copied from other sites)
□ Target keywords appear naturally in content

ALT TEXTS:
□ All informative images have descriptive alt text
□ Decorative images have empty alt (alt="")
□ Alt text describes the content, not "image of..."
□ Alt text is concise (< 125 characters)
□ No images with missing alt attribute

STRUCTURED DATA:
□ Organization schema on homepage
□ BreadcrumbList schema on sub-pages
□ Article schema on blog posts
□ Product/SoftwareApplication schema on product pages
□ FAQPage schema on FAQ sections
□ Validate with: https://search.google.com/test/rich-results

READABILITY:
□ Paragraphs are short (3-4 sentences max on web)
□ Bullet points used for lists (not wall of text)
□ Key information is bold or highlighted
□ Content follows inverted pyramid (most important first)
□ Flesch-Kincaid readability score is appropriate for audience
□ Reading grade level matches target audience (aim for 8th grade for general)

CTA STRATEGY:
□ Primary CTA is clear on every page
□ CTA buttons use action verbs ("Request Demo" not "Submit")
□ CTAs are positioned at natural decision points
□ Secondary CTAs provide an alternative path
□ No dead ends (every section has a next step)
□ Social proof near CTAs (testimonials, logos, stats)

SOCIAL PROOF:
□ Customer logos are present and recognizable
□ Testimonials include name, role, company
□ Case study results include specific metrics
□ Trust badges displayed (certifications, awards, security)
□ Numbers are specific ("5,000+ companies" not "many companies")
```

### Content Audit Process

```
STEP 1: Page inventory
├── List all pages on the site (use sitemap.xml or crawler)
├── Categorize: landing page, product, blog, legal, utility
├── Note: which pages have thin content (< 100 words)
└── Note: which pages have duplicate content

STEP 2: Per-page content analysis
├── Extract: H1, page title, meta description, URL
├── Analyze: word count, readability score, keyword usage
├── Check: heading hierarchy (H1 → H2 → H3)
├── Check: alt texts on all images
├── Check: internal links (to and from this page)
├── Check: CTAs (primary and secondary)
└── Rate: copy quality (1-5)

STEP 3: Cross-site content analysis
├── Is the tone of voice consistent?
├── Are CTAs consistent in style and language?
├── Is the value proposition clear and repeated?
├── Are keywords well-distributed (not cannibalized)?
├── Is there a clear content hierarchy (pillar → cluster)?
└── Is social proof used effectively?

STEP 4: Content gaps analysis
├── What topics are missing?
├── What questions do users have that aren't answered?
├── What competitor content is missing?
├── Where do users drop off (if analytics available)?
└── What content would improve conversion?
```

---

## 5. Pillar 4: SEO Audit

### SEO Audit Checklist

```
ON-PAGE SEO:
□ Unique, descriptive title tag per page (< 60 chars)
□ Unique meta description per page (120-160 chars)
□ One H1 per page containing target keyword
□ Heading hierarchy is logical (H1 → H2 → H3)
□ Target keyword in first 100 words of body
□ Target keyword in URL slug
□ Image alt texts include relevant keywords naturally
□ Internal links to related pages
□ External links to authoritative sources (blog posts)

TECHNICAL SEO:
□ sitemap.xml exists and is valid (https://www.xml-sitemaps.com/validate-xml-sitemap.html)
□ sitemap.xml includes all important pages
□ sitemap.xml excludes admin, API, and utility pages
□ robots.txt exists and is correct (https://example.com/robots.txt)
□ robots.txt does not block important pages
□ robots.txt references sitemap
□ Canonical URLs set on all pages
□ No duplicate pages without canonical (www vs non-www, HTTP vs HTTPS, trailing slash)
□ hreflang tags if multilingual
□ 301 redirects for old/moved URLs
□ No redirect chains (A → B → C, should be A → C)
□ No soft 404s (pages returning 200 but showing error content)
□ No noindex on important pages
□ Server returns correct HTTP status codes

OPEN GRAPH:
□ og:title set on all pages
□ og:description set on all pages
□ og:image set on all pages (1200x630 recommended)
□ og:url set on all pages (canonical URL)
□ og:type set correctly (website, article, product)
□ og:site_name set
□ og:locale set
□ Preview with: https://www.opengraph.xyz/

TWITTER CARDS:
□ twitter:card set (summary_large_image recommended)
□ twitter:title set
□ twitter:description set
□ twitter:image set (same or different from og:image)
□ twitter:site set (your Twitter handle)
□ Preview with: https://cards-dev.twitter.com/validator

STRUCTURED DATA (JSON-LD):
□ Organization schema on homepage
□ WebSite schema with SearchAction on homepage
□ BreadcrumbList on all sub-pages
□ Article schema on blog posts
□ Product/SoftwareApplication on product pages
□ FAQPage on pages with FAQ sections
□ Person schemas for team members
□ Validate: https://search.google.com/test/rich-results
□ Validate: https://validator.schema.org/

PERFORMANCE (SEO impact):
□ Mobile-friendly (passes Google Mobile-Friendly Test)
□ Core Web Vitals in "Good" range
□ Page load time < 3 seconds
□ No CLS (layout shift) issues

INDEXING:
□ Pages appear in Google search (site:example.com)
□ Google Search Console connected and verified
□ No crawl errors in Search Console
□ Index coverage report shows expected pages
□ No pages with "Crawled - currently not indexed" issues
```

### SEO Audit Process

```
STEP 1: Crawl the site
# Use a crawler to inventory all URLs
# Options: Screaming Frog, Sitebulb, or:
npx linkinator https://example.com --recurse --format json > crawl-results.json

STEP 2: Check indexing
# How many pages does Google know about?
# Search: site:example.com
# Compare with sitemap page count

STEP 3: Per-page SEO check
# For each important page, verify:
curl -s https://example.com/page | grep -E '<title>|<meta name="description"|<meta property="og:|<link rel="canonical"|<script type="application/ld\+json"'

STEP 4: Structured data validation
# For each page with JSON-LD:
# 1. Copy the JSON-LD from page source
# 2. Validate at https://search.google.com/test/rich-results
# 3. Fix any errors or warnings

STEP 5: Open Graph preview
# For each important page:
# 1. Check OG tags in page source
# 2. Preview at https://www.opengraph.xyz/
# 3. Verify image, title, description display correctly

STEP 6: Generate report
# Compile findings into docs/audits/[site]-seo.md
```

---

## 6. Lighthouse Automation Guide

### Running Lighthouse via CLI

```bash
# Install globally (optional — npx works too)
npm install -g lighthouse

# Basic run (HTML + JSON output)
npx lighthouse https://example.com \
  --output json --output html \
  --output-path ./docs/audits/example \
  --chrome-flags="--headless"

# Mobile simulation (default)
npx lighthouse https://example.com \
  --output json \
  --output-path ./docs/audits/example-mobile \
  --chrome-flags="--headless" \
  --form-factor=mobile \
  --throttling.cpuSlowdownMultiplier=4

# Desktop simulation
npx lighthouse https://example.com \
  --output json \
  --output-path ./docs/audits/example-desktop \
  --chrome-flags="--headless" \
  --preset=desktop

# Multiple pages
for page in "" "/pricing" "/blog" "/product" "/company/about"; do
  slug=$(echo "$page" | sed 's/\//-/g' | sed 's/^-//')
  [ -z "$slug" ] && slug="homepage"
  echo "Auditing: $page → $slug"
  npx lighthouse "https://example.com$page" \
    --output json --output html \
    --output-path "./docs/audits/${slug}" \
    --chrome-flags="--headless" \
    --quiet
done

# Custom configuration
npx lighthouse https://example.com \
  --output json \
  --config-path=./lighthouse-config.js \
  --chrome-flags="--headless"

# Only specific categories
npx lighthouse https://example.com \
  --only-categories=performance,accessibility \
  --output json \
  --chrome-flags="--headless"
```

### Custom Lighthouse Config

```js
// lighthouse-config.js
module.exports = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'desktop',
    screenEmulation: {
      mobile: false,
      width: 1350,
      height: 940,
      deviceScaleFactor: 1,
      disabled: false,
    },
    throttling: {
      rttMs: 40,
      throughputKbps: 10240,
      cpuSlowdownMultiplier: 1,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
    },
    emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  },
  // Custom performance budgets
  budgets: [
    {
      path: '/*',
      resourceSizes: [
        { resourceType: 'script', budget: 150 }, // KB
        { resourceType: 'stylesheet', budget: 30 },
        { resourceType: 'image', budget: 500 },
        { resourceType: 'total', budget: 1000 },
      ],
      resourceCounts: [
        { resourceType: 'third-party', budget: 10 },
        { resourceType: 'script', budget: 15 },
      ],
      timings: [
        { metric: 'interactive', budget: 3000 }, // ms
        { metric: 'first-contentful-paint', budget: 1500 },
        { metric: 'largest-contentful-paint', budget: 2500 },
        { metric: 'cumulative-layout-shift', budget: 0.1 },
        { metric: 'total-blocking-time', budget: 200 },
      ],
    },
  ],
};
```

### CI Integration Pattern

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Start server
        run: npm run start &
        env:
          PORT: 3000

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v11
        with:
          urls: |
            http://localhost:3000/
            http://localhost:3000/pricing
            http://localhost:3000/blog
            http://localhost:3000/product
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true

      - name: Assert Lighthouse scores
        run: |
          # Parse Lighthouse results and check thresholds
          node -e "
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('.lighthouseci/lhr-*.json', 'utf-8'));
            const perf = results.categories.performance.score * 100;
            const a11y = results.categories.accessibility.score * 100;
            const seo = results.categories.seo.score * 100;
            console.log('Performance:', perf, 'Accessibility:', a11y, 'SEO:', seo);
            if (perf < 90) process.exit(1);
            if (a11y < 90) process.exit(1);
            if (seo < 90) process.exit(1);
          "
```

### Budget Assertions

```json
// lighthouse-budget.json
[
  {
    "path": "/*",
    "timings": [
      { "metric": "interactive", "budget": 3500 },
      { "metric": "first-contentful-paint", "budget": 1800 },
      { "metric": "largest-contentful-paint", "budget": 2500 },
      { "metric": "cumulative-layout-shift", "budget": 0.1 },
      { "metric": "total-blocking-time", "budget": 300 }
    ],
    "resourceSizes": [
      { "resourceType": "script", "budget": 170 },
      { "resourceType": "stylesheet", "budget": 40 },
      { "resourceType": "image", "budget": 500 },
      { "resourceType": "font", "budget": 100 },
      { "resourceType": "total", "budget": 1000 },
      { "resourceType": "third-party", "budget": 100 }
    ],
    "resourceCounts": [
      { "resourceType": "script", "budget": 20 },
      { "resourceType": "third-party", "budget": 10 }
    ]
  }
]
```

### Reading Lighthouse JSON Output

```tsx
// Parse Lighthouse JSON for specific metrics
interface LighthouseResult {
  categories: {
    performance: { score: number };
    accessibility: { score: number };
    'best-practices': { score: number };
    seo: { score: number };
  };
  audits: {
    'largest-contentful-paint': { numericValue: number; displayValue: string };
    'cumulative-layout-shift': { numericValue: number; displayValue: string };
    'total-blocking-time': { numericValue: number; displayValue: string };
    'first-contentful-paint': { numericValue: number; displayValue: string };
    'speed-index': { numericValue: number; displayValue: string };
    interactive: { numericValue: number; displayValue: string };
    'server-response-time': { numericValue: number; displayValue: string };
  };
}

// Extract key metrics:
function extractMetrics(result: LighthouseResult) {
  return {
    scores: {
      performance: Math.round(result.categories.performance.score * 100),
      accessibility: Math.round(result.categories.accessibility.score * 100),
      bestPractices: Math.round(result.categories['best-practices'].score * 100),
      seo: Math.round(result.categories.seo.score * 100),
    },
    metrics: {
      lcp: result.audits['largest-contentful-paint'].displayValue,
      cls: result.audits['cumulative-layout-shift'].displayValue,
      tbt: result.audits['total-blocking-time'].displayValue,
      fcp: result.audits['first-contentful-paint'].displayValue,
      si: result.audits['speed-index'].displayValue,
      tti: result.audits['interactive'].displayValue,
      ttfb: result.audits['server-response-time'].displayValue,
    },
  };
}
```

---

## 7. Screenshot Capture Workflow

### Playwright Screenshot Commands

```bash
# Install Playwright
npm install -D @playwright/test
npx playwright install chromium

# Single page screenshot at multiple viewports
npx playwright screenshot \
  --browser chromium \
  --viewport-size="375,812" \
  "https://example.com" \
  "screenshots/mobile-375.png"

npx playwright screenshot \
  --browser chromium \
  --viewport-size="768,1024" \
  "https://example.com" \
  "screenshots/tablet-768.png"

npx playwright screenshot \
  --browser chromium \
  --viewport-size="1280,800" \
  "https://example.com" \
  "screenshots/desktop-1280.png"

npx playwright screenshot \
  --browser chromium \
  --viewport-size="1440,900" \
  "https://example.com" \
  "screenshots/desktop-1440.png"

# Full page screenshot (captures entire scrollable page)
npx playwright screenshot \
  --browser chromium \
  --viewport-size="1280,800" \
  --full-page \
  "https://example.com" \
  "screenshots/full-page.png"
```

### Automated Screenshot Script

```typescript
// scripts/capture-screenshots.ts
import { chromium, type Page } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'desktop-lg', width: 1440, height: 900 },
  { name: 'desktop-xl', width: 1920, height: 1080 },
];

const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'product', path: '/product' },
  { name: 'pricing', path: '/pricing' },
  { name: 'blog', path: '/blog' },
  { name: 'about', path: '/company/about' },
  { name: 'contact', path: '/company/contact' },
  { name: 'demo', path: '/demo' },
];

async function captureScreenshots(baseUrl: string) {
  const date = new Date().toISOString().split('T')[0];
  const outputDir = path.join(process.cwd(), 'screenshots', date);
  await fs.mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch();

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.width <= 768 ? 2 : 1,
    });

    for (const pageConfig of PAGES) {
      const page = await context.newPage();
      const url = `${baseUrl}${pageConfig.path}`;

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        // Wait for images and animations to settle
        await page.waitForTimeout(1000);

        // Viewport screenshot
        await page.screenshot({
          path: path.join(outputDir, `${pageConfig.name}-${viewport.name}.png`),
          type: 'png',
        });

        // Full page screenshot (desktop only — mobile full pages are very long)
        if (viewport.name === 'desktop') {
          await page.screenshot({
            path: path.join(outputDir, `${pageConfig.name}-full.png`),
            fullPage: true,
            type: 'png',
          });
        }

        console.log(`OK: ${pageConfig.name} @ ${viewport.name}`);
      } catch (error) {
        console.error(`FAIL: ${pageConfig.name} @ ${viewport.name}: ${error}`);
      }

      await page.close();
    }

    await context.close();
  }

  await browser.close();
  console.log(`\nScreenshots saved to: ${outputDir}`);
}

// Run:
captureScreenshots('https://example.com');
```

### Before/After Comparison Strategy

```
VISUAL REGRESSION TESTING:

SETUP:
1. Capture "baseline" screenshots before changes
2. Make changes
3. Capture "current" screenshots after changes
4. Compare side-by-side or with diff tool

TOOLS FOR COMPARISON:
- Playwright Visual Comparisons (built-in):
  expect(page).toHaveScreenshot('homepage.png', { maxDiffPixelRatio: 0.01 })

- Percy (cloud-based visual testing):
  npx percy snapshot ./screenshots/

- BackstopJS (self-hosted visual regression):
  npx backstop test

- Manual comparison:
  Place screenshots side by side in a document
  Annotate differences

DIRECTORY STRUCTURE:
screenshots/
├── baseline/              ← Reference screenshots (pre-change)
│   ├── 2026-03-15/
│   │   ├── homepage-mobile.png
│   │   ├── homepage-desktop.png
│   │   └── ...
│
├── current/               ← Post-change screenshots
│   ├── 2026-03-17/
│   │   ├── homepage-mobile.png
│   │   ├── homepage-desktop.png
│   │   └── ...
│
└── diff/                  ← Generated diff images
    ├── homepage-mobile-diff.png
    └── ...
```

---

## 8. Competitive Analysis Framework

### Evaluation Criteria Matrix

```
COMPETITIVE ANALYSIS MATRIX
═══════════════════════════════════════════════════════════════

                    Site A    Site B    Site C    TrueOmni
                    ───────   ───────   ───────   ─────────
TECHNICAL (30%)
  Performance       4/5       3/5       5/5       __/5
  Mobile Speed      3/5       4/5       5/5       __/5
  Security          4/5       3/5       4/5       __/5
  Subtotal          3.7       3.3       4.7       __

VISUAL (25%)
  Design Quality    5/5       3/5       4/5       __/5
  Consistency       4/5       3/5       5/5       __/5
  Responsive        4/5       4/5       5/5       __/5
  Accessibility     3/5       2/5       4/5       __/5
  Subtotal          4.0       3.0       4.5       __

CONTENT (20%)
  Copy Quality      4/5       3/5       5/5       __/5
  Value Prop        5/5       3/5       4/5       __/5
  Social Proof      4/5       4/5       5/5       __/5
  CTA Strategy      5/5       3/5       4/5       __/5
  Subtotal          4.5       3.3       4.5       __

SEO (25%)
  Meta Tags         4/5       3/5       5/5       __/5
  Structured Data   3/5       2/5       5/5       __/5
  Content SEO       4/5       3/5       4/5       __/5
  Subtotal          3.7       2.7       4.7       __

WEIGHTED TOTAL      3.95      3.10      4.60      __
═══════════════════════════════════════════════════════════════
```

### Feature Comparison Template

```markdown
# Feature Comparison — [Industry/Category]

## Competitors Analyzed

| #   | Company | URL   | Category              | Notes           |
| --- | ------- | ----- | --------------------- | --------------- |
| 1   | [Name]  | [URL] | Direct competitor     | [notable trait] |
| 2   | [Name]  | [URL] | Direct competitor     | [notable trait] |
| 3   | [Name]  | [URL] | Indirect/aspirational | [notable trait] |

## Feature Matrix

| Feature            | TrueOmni | Comp A | Comp B  | Comp C |
| ------------------ | -------- | ------ | ------- | ------ |
| Free trial         | ?        | Yes    | No      | Yes    |
| Self-serve pricing | ?        | Yes    | No      | Yes    |
| Demo request form  | ?        | Yes    | Yes     | Yes    |
| Blog/content       | ?        | Weekly | Monthly | Daily  |
| Case studies       | ?        | 12     | 5       | 20+    |
| API documentation  | ?        | Yes    | Partial | Yes    |
| Video content      | ?        | Yes    | No      | Yes    |
| Chat support       | ?        | Yes    | No      | Yes    |
| Multi-language     | ?        | 3      | 1       | 8      |

## Messaging Analysis

| Company | Primary Headline | Value Proposition | Primary CTA |
| ------- | ---------------- | ----------------- | ----------- |
| Comp A  | "[headline]"     | [1 sentence]      | [CTA text]  |
| Comp B  | "[headline]"     | [1 sentence]      | [CTA text]  |
| Comp C  | "[headline]"     | [1 sentence]      | [CTA text]  |

## Key Takeaways

### What to Adopt

1. [Pattern/feature from competitors that we should implement]
2. [...]
3. [...]

### What to Avoid

1. [Anti-pattern or poor implementation to avoid]
2. [...]
3. [...]

### Differentiation Opportunities

1. [Where TrueOmni can stand out]
2. [...]
3. [...]
```

### Tech Stack Detection

```
HOW TO DETECT A SITE'S TECH STACK:

1. BROWSER DEVTOOLS:
   - View Source → Look for framework signatures
   - Network tab → Check for specific request patterns
   - Application tab → Check cookies and local storage

2. FRAMEWORK SIGNATURES:
   Next.js:    Look for __NEXT_DATA__ in source, /_next/ in URLs
   Nuxt:       Look for __NUXT__ in source
   Gatsby:     Look for ___gatsby in source
   WordPress:  Look for wp-content/ in source, /wp-json/ API
   Webflow:    Look for webflow.js, data-wf attributes
   Framer:     Look for framer-motion classes
   Shopify:    Look for cdn.shopify.com, Shopify.theme
   Squarespace: Look for squarespace.com in source
   Wix:        Look for wix.com in source

3. HTTP HEADERS:
   curl -I https://example.com | grep -i "x-powered-by\|server\|x-vercel\|x-amz\|cf-ray"

   Vercel:       x-vercel-id header
   Netlify:      x-nf-request-id header
   AWS:          x-amz-* headers
   Cloudflare:   cf-ray header
   Nginx:        server: nginx
   Apache:       server: Apache

4. ONLINE TOOLS:
   - BuiltWith: https://builtwith.com/example.com
   - Wappalyzer: Browser extension
   - WhatCMS: https://whatcms.org/
   - W3Techs: https://w3techs.com/

5. DNS / HOSTING:
   dig example.com +short
   # If points to vercel-dns.com → Vercel
   # If points to *.netlify.app → Netlify
   # If points to *.cloudfront.net → AWS CloudFront

6. SSL CERTIFICATE:
   echo | openssl s_client -connect example.com:443 2>/dev/null | openssl x509 -noout -issuer
   # Shows: Let's Encrypt, DigiCert, Amazon, Cloudflare, etc.
```

---

## 9. Output Report Templates

### Technical Audit Report Template

```markdown
# Technical Audit — [Site Name]

Date: [YYYY-MM-DD]
URL: [https://example.com]
Auditor: Claude (Automated + Manual Review)

## Executive Summary

**Overall Technical Score: [X/5]**
[1-2 sentence summary of findings]

## Lighthouse Scores

| Category       | Mobile | Desktop | Target |
| -------------- | ------ | ------- | ------ |
| Performance    | XX     | XX      | 90+    |
| Accessibility  | XX     | XX      | 90+    |
| Best Practices | XX     | XX      | 90+    |
| SEO            | XX     | XX      | 90+    |

## Core Web Vitals

| Metric | Value | Rating               | Target  |
| ------ | ----- | -------------------- | ------- |
| LCP    | X.Xs  | Good/Needs Work/Poor | < 2.5s  |
| CLS    | X.XX  | Good/Needs Work/Poor | < 0.1   |
| INP    | XXms  | Good/Needs Work/Poor | < 200ms |
| TTFB   | XXXms | Good/Needs Work/Poor | < 800ms |
| FCP    | X.Xs  | Good/Needs Work/Poor | < 1.8s  |

## Performance Details

### Bundle Size

- Total JS: XXX KB (compressed)
- Total CSS: XX KB (compressed)
- Largest JS chunk: XXX KB
- Third-party scripts: X (list them)

### Loading Performance

- [Detail about LCP element and optimization opportunities]
- [Detail about render-blocking resources]
- [Detail about image optimization]

## Security

| Header                 | Present | Value   |
| ---------------------- | ------- | ------- |
| HTTPS                  | Yes/No  |         |
| HSTS                   | Yes/No  | [value] |
| CSP                    | Yes/No  | [value] |
| X-Frame-Options        | Yes/No  | [value] |
| X-Content-Type-Options | Yes/No  | [value] |

## Infrastructure

- Hosting: [Vercel/AWS/Netlify/etc.]
- CDN: [Yes/No — provider]
- HTTP version: [2/3]
- Compression: [Gzip/Brotli]

## Critical Issues (Must Fix)

1. [Issue description + impact + recommendation]
2. [...]

## Improvements (Should Fix)

1. [Issue description + impact + recommendation]
2. [...]

## Nice to Have

1. [Optimization opportunity]
2. [...]
```

### Visual Audit Report Template

```markdown
# Visual Audit — [Site Name]

Date: [YYYY-MM-DD]
URL: [https://example.com]

## Executive Summary

**Overall Visual Score: [X/5]**
[1-2 sentence summary]

## Color Palette

| Color      | Hex     | Usage       | Contrast (on white) |
| ---------- | ------- | ----------- | ------------------- |
| Primary    | #XXXXXX | CTAs, links | X.X:1               |
| Secondary  | #XXXXXX | Accents     | X.X:1               |
| Text       | #XXXXXX | Body text   | X.X:1               |
| Background | #XXXXXX | Main bg     | —                   |
| [more...]  |         |             |                     |

## Typography

| Element | Font   | Weight | Size | Line Height |
| ------- | ------ | ------ | ---- | ----------- |
| H1      | [font] | [wt]   | Xpx  | X.X         |
| H2      | [font] | [wt]   | Xpx  | X.X         |
| H3      | [font] | [wt]   | Xpx  | X.X         |
| Body    | [font] | [wt]   | Xpx  | X.X         |
| Small   | [font] | [wt]   | Xpx  | X.X         |

## Spacing

- Base unit: Xpx
- Container max-width: Xpx
- Section padding: Xpx (mobile) / Xpx (desktop)
- Card padding: Xpx
- Element gap: Xpx

## Component Patterns

### Buttons

[Description of button styles, variants, sizes]

### Cards

[Description of card styles, shadows, borders]

### Navigation

[Description of navigation pattern]

## Screenshots

[Reference screenshots at key viewpoints with annotations]

## Strengths

1. [What works well visually]
2. [...]

## Issues

1. [Visual inconsistency or problem + recommendation]
2. [...]

## Patterns to Adopt

1. [Specific design pattern that could inspire TrueOmni]
2. [...]

## Patterns to Avoid

1. [Anti-pattern or poor design decision]
2. [...]
```

### Summary / Scorecard Template

```markdown
# Website Audit Scorecard — [Site Name]

Date: [YYYY-MM-DD] | URL: [https://example.com]
Stack: [Next.js / WordPress / etc.] | Hosting: [Vercel / AWS / etc.]

## Overall Score: [X.X / 5.0]

| Pillar    | Score | Weight   | Weighted |
| --------- | ----- | -------- | -------- |
| Technical | X/5   | 30%      | X.X      |
| Visual    | X/5   | 25%      | X.X      |
| Content   | X/5   | 20%      | X.X      |
| SEO       | X/5   | 25%      | X.X      |
| **Total** |       | **100%** | **X.X**  |

## Top 3 Strengths

1. [Strength with specific example]
2. [Strength with specific example]
3. [Strength with specific example]

## Top 3 Weaknesses

1. [Weakness with specific impact]
2. [Weakness with specific impact]
3. [Weakness with specific impact]

## Takeaways for TrueOmni

### Adopt

- [Pattern/feature to implement, with reference to where it was seen]

### Avoid

- [Anti-pattern to avoid, with explanation of why]

### Differentiate

- [Opportunity to do better than this competitor]

## Detailed Reports

- Technical: docs/audits/[site]-tech.md
- Visual: docs/audits/[site]-visual.md
- Content: docs/audits/[site]-content.md
- SEO: docs/audits/[site]-seo.md
```

---

## 10. Core Web Vitals Interpretation

### LCP (Largest Contentful Paint)

```
WHAT IT MEASURES:
Time until the largest visible content element is rendered.
Usually: hero image, hero headline, or main banner.

THRESHOLDS:
Good:         < 2.5 seconds
Needs Work:   2.5 - 4.0 seconds
Poor:         > 4.0 seconds

COMMON CAUSES OF SLOW LCP:
1. Slow server response (high TTFB)
   → Fix: Use CDN, optimize server, use SSG/ISR
   → Fix: Reduce server-side processing time

2. Render-blocking resources (CSS/JS blocking paint)
   → Fix: Inline critical CSS
   → Fix: Defer non-critical JavaScript
   → Fix: Use async/defer on script tags

3. Slow resource load time (large hero image)
   → Fix: Use next/image with priority
   → Fix: Use WebP/AVIF format
   → Fix: Add proper sizes attribute
   → Fix: Preload LCP image

4. Client-side rendering (content not in initial HTML)
   → Fix: Use Server Components
   → Fix: Use SSG or ISR instead of client-side fetching
   → Fix: Stream content with Suspense

HOW TO IDENTIFY THE LCP ELEMENT:
1. Chrome DevTools → Performance tab → Record → Look for "LCP" marker
2. Lighthouse → "Largest Contentful Paint element" audit
3. Web Vitals extension → Shows LCP element on click
```

### CLS (Cumulative Layout Shift)

```
WHAT IT MEASURES:
Total of all unexpected layout shifts that occur during the page's lifetime.
Measures visual stability — how much content "jumps around."

THRESHOLDS:
Good:         < 0.1
Needs Work:   0.1 - 0.25
Poor:         > 0.25

COMMON CAUSES OF HIGH CLS:
1. Images without dimensions
   → Fix: Always set width/height on <img> or use aspect-ratio CSS
   → Fix: Use next/image (handles dimensions automatically)

2. Ads, embeds, or iframes without reserved space
   → Fix: Reserve space with min-height on container
   → Fix: Use aspect-ratio CSS on embed containers

3. Dynamically injected content
   → Fix: Reserve space for dynamic content
   → Fix: Use skeleton loaders that match content dimensions
   → Fix: Load content before it's needed (prefetch)

4. Web fonts causing text reflow (FOIT/FOUT)
   → Fix: Use next/font (handles font matching)
   → Fix: Use font-display: swap with size-adjusted fallback
   → Fix: Preload critical fonts

5. Actions waiting for a network response before updating DOM
   → Fix: Use optimistic UI updates
   → Fix: Use skeleton/placeholder of known size

HOW TO DIAGNOSE CLS:
1. Chrome DevTools → Performance tab → Look for "Layout Shift" entries
2. Chrome DevTools → Rendering → Check "Layout Shift Regions" (highlights shifts)
3. Lighthouse → "Avoid large layout shifts" audit
4. Web Vitals extension → Click CLS value to see individual shifts
```

### INP (Interaction to Next Paint)

```
WHAT IT MEASURES:
Time from user interaction (click, tap, key press) to the next visual update.
Replaced FID (First Input Delay) in March 2024 as a Core Web Vital.

THRESHOLDS:
Good:         < 200 milliseconds
Needs Work:   200 - 500 milliseconds
Poor:         > 500 milliseconds

COMMON CAUSES OF SLOW INP:
1. Long-running JavaScript on main thread
   → Fix: Break up long tasks with requestIdleCallback or setTimeout
   → Fix: Move heavy computation to Web Workers
   → Fix: Use React.startTransition for non-urgent updates

2. Heavy component re-renders
   → Fix: Use React.memo for expensive components
   → Fix: Use useMemo/useCallback for expensive computations
   → Fix: Reduce state updates scope (don't update root state for leaf changes)

3. Hydration delay (SSR → interactive)
   → Fix: Minimize client-side JavaScript
   → Fix: Use Server Components (no hydration needed)
   → Fix: Use selective hydration with Suspense

4. Third-party scripts blocking main thread
   → Fix: Load third-party scripts with async/defer
   → Fix: Use partytown for heavy third-party scripts
   → Fix: Remove unnecessary third-party scripts

5. Large DOM size
   → Fix: Virtualize long lists (react-virtual)
   → Fix: Lazy load off-screen content
   → Fix: Simplify DOM structure

HOW TO DIAGNOSE INP:
1. Chrome DevTools → Performance tab → Record interactions → Look for Long Tasks
2. Lighthouse → "Total Blocking Time" (correlates with INP)
3. Web Vitals extension → Shows INP value and worst interaction
4. Chrome DevTools → Performance → Look for yellow "Long Task" bars
```

### TTFB (Time to First Byte)

```
WHAT IT MEASURES:
Time from the browser's request to receiving the first byte of response.
Indicates server responsiveness.

THRESHOLDS:
Good:         < 800 milliseconds
Needs Work:   800 - 1800 milliseconds
Poor:         > 1800 milliseconds

COMMON CAUSES OF SLOW TTFB:
1. Slow server processing
   → Fix: Optimize database queries
   → Fix: Add caching layer (Redis, in-memory)
   → Fix: Use SSG/ISR to pre-render pages

2. No CDN
   → Fix: Deploy on Vercel/Netlify (CDN included)
   → Fix: Add Cloudflare or other CDN in front

3. Server far from users
   → Fix: Deploy to multiple regions (Edge)
   → Fix: Use CDN with global PoPs

4. Large server-side computation
   → Fix: Cache computed results
   → Fix: Use streaming SSR (send head immediately)
   → Fix: Move computation to build time (SSG)

5. SSL/TLS handshake overhead
   → Fix: Use HTTP/2 or HTTP/3
   → Fix: Enable OCSP stapling
   → Fix: Use CDN (handles TLS at edge)
```

---

## 11. SEO Checklist by Page Type

### Homepage

```
□ Title: "[Brand] — [Value Proposition]" (< 60 chars)
□ Meta description: What you do + who it's for + CTA hint (120-160 chars)
□ H1: Primary headline (matches value proposition)
□ Organization schema (JSON-LD)
□ WebSite schema with SearchAction (if site has search)
□ og:type = "website"
□ Canonical URL: https://trueomni.com (without trailing slash)
□ Internal links to all main sections (product, pricing, blog, etc.)
□ No index/follow (this page should be indexed)
□ Logo links to homepage (self-referencing canonical)
```

### Product / Feature Page

```
□ Title: "[Feature Name] — [Benefit] | [Brand]" (< 60 chars)
□ Meta description: What the feature does + key benefit + CTA (120-160 chars)
□ H1: Feature name + benefit
□ SoftwareApplication or Product schema
□ BreadcrumbList schema (Home > Product > Feature)
□ og:type = "product" or "website"
□ Canonical URL set
□ Internal links to related features
□ Internal link to pricing page
□ CTA to demo/trial
□ Screenshots/images with descriptive alt text
```

### Blog Post

```
□ Title: "[Post Title] | [Brand] Blog" (< 60 chars)
□ Meta description: Summary of post + what reader will learn (120-160 chars)
□ H1: Post title (contains target keyword)
□ Article schema with author, datePublished, dateModified
□ BreadcrumbList schema (Home > Blog > Post Title)
□ og:type = "article"
□ og:image: Custom image or auto-generated
□ publishedTime and modifiedTime in meta tags
□ Canonical URL set
□ Author bio with Person schema
□ Internal links to related blog posts
□ Internal links to relevant product pages
□ Tags/categories for content organization
□ Table of contents for long posts (> 1500 words)
□ Reading time estimate
```

### Landing Page

```
□ Title: "[Targeted Headline] | [Brand]" (< 60 chars)
□ Meta description: Specific to campaign/audience (120-160 chars)
□ H1: Campaign headline (contains target keyword)
□ FAQ section with FAQPage schema (if applicable)
□ og:type = "website"
□ Canonical URL set (if not a/b test variant)
□ noindex if temporary/test page
□ Strong CTA above the fold
□ Social proof elements
□ Minimal navigation (focused on conversion)
□ Form with proper input types and autocomplete
```

### Pricing Page

```
□ Title: "Pricing Plans | [Brand]" (< 60 chars)
□ Meta description: Plan overview + starting price + CTA (120-160 chars)
□ H1: "Pricing" or "Choose Your Plan"
□ Product schema with Offer for each plan
□ FAQPage schema for pricing FAQ
□ BreadcrumbList schema
□ Comparison table with proper HTML table semantics
□ Clear CTA for each plan
□ FAQ section addressing common pricing questions
□ Internal link to demo/trial
```

---

## 12. Accessibility Quick Audit

> Top 10 accessibility issues to check on any page. These catch ~80% of accessibility problems.

### Quick Audit Checklist

```
1. KEYBOARD NAVIGATION
   □ Can you Tab through all interactive elements?
   □ Can you see where focus is (visible focus indicator)?
   □ Can you activate buttons/links with Enter/Space?
   □ Can you close modals with Escape?
   □ Is tab order logical (follows visual order)?
   HOW TO TEST: Put mouse away, use only keyboard to navigate the entire page.

2. COLOR CONTRAST
   □ Body text contrast >= 4.5:1 against background
   □ Large text (18px+) contrast >= 3:1 against background
   □ UI elements (borders, icons) contrast >= 3:1
   □ Links distinguishable from body text (not just color)
   HOW TO TEST: Chrome DevTools → Elements → select text → check contrast ratio
   TOOL: https://webaim.org/resources/contrastchecker/

3. IMAGE ALT TEXT
   □ All <img> elements have alt attribute
   □ Informative images have descriptive alt text
   □ Decorative images have alt="" (empty)
   □ Complex images have extended description
   HOW TO TEST: Chrome DevTools → Elements → search for img → check alt attributes
   TOOL: axe DevTools browser extension

4. HEADING STRUCTURE
   □ Page has exactly one <h1>
   □ Headings are in logical order (h1 → h2 → h3, no skipping)
   □ Headings describe the content (not just styling)
   HOW TO TEST: Chrome DevTools → Elements → search for h1, h2, h3, etc.
   TOOL: HeadingsMap browser extension

5. FORM LABELS
   □ Every input has a visible <label>
   □ Labels are associated (htmlFor matches id)
   □ Required fields are indicated
   □ Error messages are associated with inputs (aria-describedby)
   HOW TO TEST: Click on a label — does it focus the input? If not, they're not associated.

6. ARIA AND SEMANTIC HTML
   □ Landmarks used: <header>, <nav>, <main>, <footer>
   □ Buttons use <button>, not <div> with onClick
   □ Links use <a> with href
   □ Lists use <ul>/<ol>/<li>
   □ aria-label on icon-only buttons
   HOW TO TEST: axe DevTools extension → analyze page

7. FOCUS MANAGEMENT
   □ Focus moves to modal content when modal opens
   □ Focus returns to trigger when modal closes
   □ Focus is trapped within modal (can't Tab behind it)
   □ Skip to content link exists
   HOW TO TEST: Open modals/dialogs and check focus behavior

8. RESPONSIVE & ZOOM
   □ Page is usable at 200% browser zoom
   □ No horizontal scroll at any zoom level up to 400%
   □ Text wraps properly when zoomed
   □ Touch targets >= 44px on mobile
   HOW TO TEST: Ctrl/Cmd + to zoom to 200% and 400%

9. MOTION & ANIMATION
   □ Animations respect prefers-reduced-motion
   □ No auto-playing content that can't be paused
   □ No content that flashes more than 3 times per second
   HOW TO TEST: Enable "Reduce motion" in OS settings, reload page

10. SCREEN READER BASICS
    □ Page title is descriptive
    □ Links have meaningful text (not "click here")
    □ Images have alt text
    □ Dynamic content updates are announced (aria-live regions)
    □ Error messages are announced
    HOW TO TEST: macOS: Cmd+F5 to toggle VoiceOver, then navigate the page
    TOOL: NVDA (free, Windows), VoiceOver (free, macOS), JAWS (paid, Windows)
```

### Automated Accessibility Testing

```bash
# axe-core CLI
npx @axe-core/cli https://example.com
npx @axe-core/cli https://example.com/pricing

# Pa11y (accessibility testing tool)
npx pa11y https://example.com
npx pa11y https://example.com --standard WCAG2AA

# Playwright + axe-core (in tests)
# Install: npm install -D @axe-core/playwright

import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('homepage has no accessibility violations', async ({ page }) => {
  await page.goto('/')
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})

# Lighthouse accessibility audit (included in standard Lighthouse run)
npx lighthouse https://example.com --only-categories=accessibility --output json
```

---

## 13. Performance Budget Template

```markdown
# Performance Budget — TrueOmni Website 2026

## Core Web Vitals Budget

| Metric | Budget (Good) | Fail Threshold | Measured | Status      |
| ------ | ------------- | -------------- | -------- | ----------- |
| LCP    | < 1.8s        | > 2.5s         | [__]s    | [PASS/FAIL] |
| CLS    | < 0.05        | > 0.1          | [__]     | [PASS/FAIL] |
| INP    | < 100ms       | > 200ms        | [__]ms   | [PASS/FAIL] |
| TTFB   | < 600ms       | > 800ms        | [__]ms   | [PASS/FAIL] |
| FCP    | < 1.0s        | > 1.8s         | [__]s    | [PASS/FAIL] |

## Bundle Size Budget

| Resource               | Budget  | Fail Threshold | Measured | Status      |
| ---------------------- | ------- | -------------- | -------- | ----------- |
| Total JS (compressed)  | < 150KB | > 200KB        | [__]KB   | [PASS/FAIL] |
| Initial JS             | < 80KB  | > 120KB        | [__]KB   | [PASS/FAIL] |
| Total CSS (compressed) | < 30KB  | > 50KB         | [__]KB   | [PASS/FAIL] |
| Largest JS chunk       | < 50KB  | > 80KB         | [__]KB   | [PASS/FAIL] |
| Third-party JS         | < 50KB  | > 100KB        | [__]KB   | [PASS/FAIL] |

## Page Weight Budget

| Page      | Budget  | Fail Threshold | Measured | Status      |
| --------- | ------- | -------------- | -------- | ----------- |
| Homepage  | < 500KB | > 800KB        | [__]KB   | [PASS/FAIL] |
| Product   | < 600KB | > 900KB        | [__]KB   | [PASS/FAIL] |
| Blog post | < 400KB | > 700KB        | [__]KB   | [PASS/FAIL] |
| Pricing   | < 300KB | > 500KB        | [__]KB   | [PASS/FAIL] |

## Image Budget

| Context    | Max Size | Format    | Measured | Status      |
| ---------- | -------- | --------- | -------- | ----------- |
| Hero image | < 100KB  | WebP/AVIF | [__]KB   | [PASS/FAIL] |
| Card image | < 50KB   | WebP/AVIF | [__]KB   | [PASS/FAIL] |
| Thumbnail  | < 20KB   | WebP/AVIF | [__]KB   | [PASS/FAIL] |
| OG image   | < 100KB  | PNG/JPEG  | [__]KB   | [PASS/FAIL] |
| Icon/logo  | < 10KB   | SVG       | [__]KB   | [PASS/FAIL] |

## Request Count Budget

| Resource Type        | Budget | Measured | Status      |
| -------------------- | ------ | -------- | ----------- |
| Total requests       | < 50   | [__]     | [PASS/FAIL] |
| JavaScript files     | < 15   | [__]     | [PASS/FAIL] |
| CSS files            | < 5    | [__]     | [PASS/FAIL] |
| Image requests       | < 20   | [__]     | [PASS/FAIL] |
| Font files           | < 4    | [__]     | [PASS/FAIL] |
| Third-party requests | < 10   | [__]     | [PASS/FAIL] |

## Lighthouse Score Budget

| Category       | Budget | Fail Threshold | Measured | Status      |
| -------------- | ------ | -------------- | -------- | ----------- |
| Performance    | >= 95  | < 90           | [__]     | [PASS/FAIL] |
| Accessibility  | >= 95  | < 90           | [__]     | [PASS/FAIL] |
| Best Practices | >= 95  | < 90           | [__]     | [PASS/FAIL] |
| SEO            | >= 95  | < 90           | [__]     | [PASS/FAIL] |

## Monitoring Schedule

| Check                   | Frequency     | Tool                  | Owner     |
| ----------------------- | ------------- | --------------------- | --------- |
| Lighthouse CI           | Every PR      | GitHub Actions        | Automated |
| Core Web Vitals (field) | Weekly        | PageSpeed Insights    | Ruben     |
| Bundle analysis         | Every release | @next/bundle-analyzer | Dev       |
| Full audit              | Monthly       | Manual + Lighthouse   | Dev       |
| Uptime                  | Continuous    | Better Stack / Vercel | Automated |

Last Updated: [YYYY-MM-DD]
```

---

## 14. Tools Reference

### Performance Testing Tools

```
TOOL                    TYPE          COST        USE CASE
────────────────────────────────────────────────────────────────
Lighthouse              Lab data      Free        Comprehensive audit (CLI + DevTools)
PageSpeed Insights      Lab + Field   Free        Quick check + real user data (CrUX)
WebPageTest             Lab data      Free        Detailed waterfall + filmstrip
GTmetrix                Lab data      Freemium    Visual reports + monitoring
Chrome DevTools         Lab data      Free        Deep debugging (Performance tab)
Chrome UX Report        Field data    Free        Real user metrics (BigQuery)
Vercel Analytics        Field data    Included    Real user Web Vitals on Vercel
Vercel Speed Insights   Field data    Included    Core Web Vitals dashboard
@next/bundle-analyzer   Build-time    Free        Bundle size visualization
web-vitals (npm)        Field data    Free        Measure CWV in production code
────────────────────────────────────────────────────────────────

HOW TO ACCESS:

Lighthouse:
  npx lighthouse [URL] --output html --output json --chrome-flags="--headless"
  Or: Chrome DevTools → Lighthouse tab

PageSpeed Insights:
  https://pagespeed.web.dev/analysis?url=[URL]

WebPageTest:
  https://www.webpagetest.org/
  Run from: Dulles, VA / London / Tokyo (test multiple locations)
  Connection: Cable / 3G / 4G

GTmetrix:
  https://gtmetrix.com/
  Free: 1 test location, limited history

Chrome DevTools Performance:
  F12 → Performance → Record → Interact → Stop → Analyze

Bundle Analyzer:
  ANALYZE=true npm run build (with @next/bundle-analyzer configured)
```

### SEO Tools

```
TOOL                    COST          USE CASE
────────────────────────────────────────────────────────────────
Google Search Console   Free          Index status, search queries, errors
Google Rich Results     Free          Validate structured data
Schema Validator        Free          Validate JSON-LD/Microdata
OpenGraph.xyz           Free          Preview OG tags
Twitter Card Validator  Free          Preview Twitter Cards
Screaming Frog          Freemium      Crawl site for SEO issues (500 URLs free)
Ahrefs                  Paid          Backlinks, keyword research, site audit
SEMrush                 Paid          Keyword research, competitive analysis
Moz                     Paid          Domain authority, keyword research
────────────────────────────────────────────────────────────────

Google Search Console:
  https://search.google.com/search-console

Rich Results Test:
  https://search.google.com/test/rich-results

Schema Validator:
  https://validator.schema.org/

OG Preview:
  https://www.opengraph.xyz/

XML Sitemap Validator:
  https://www.xml-sitemaps.com/validate-xml-sitemap.html
```

### Accessibility Tools

```
TOOL                    TYPE          COST        USE CASE
────────────────────────────────────────────────────────────────
axe DevTools            Extension     Free/Paid   In-browser a11y testing
WAVE                    Extension     Free        Visual a11y evaluation
Lighthouse a11y         CLI/DevTools  Free        Automated a11y audit
Pa11y                   CLI           Free        CI/CD a11y testing
axe-core/playwright     Code          Free        Automated a11y in tests
VoiceOver               Built-in      Free        macOS screen reader testing
NVDA                    Software      Free        Windows screen reader testing
WebAIM Contrast         Web tool      Free        Color contrast checker
Sim Daltonism           macOS app     Free        Color blindness simulator
HeadingsMap             Extension     Free        Heading structure visualizer
────────────────────────────────────────────────────────────────

axe DevTools:
  Chrome extension → Install → F12 → axe tab → Analyze

WAVE:
  Chrome extension → Click WAVE icon on any page

WebAIM Contrast Checker:
  https://webaim.org/resources/contrastchecker/

Pa11y CLI:
  npx pa11y [URL] --standard WCAG2AA

axe + Playwright:
  npm install -D @axe-core/playwright
  // In test: new AxeBuilder({ page }).analyze()
```

### Visual Testing Tools

```
TOOL                    TYPE          COST        USE CASE
────────────────────────────────────────────────────────────────
Playwright              CLI/Code      Free        Automated screenshots + testing
Percy                   Cloud         Freemium    Visual regression testing
BackstopJS              Self-hosted   Free        Visual regression testing
Chromatic               Cloud         Freemium    Storybook visual testing
Storybook               Dev tool      Free        Component visual development
Responsive Viewer       Extension     Free        Multi-viewport preview
────────────────────────────────────────────────────────────────

Playwright screenshot:
  npx playwright screenshot --viewport-size="1280,800" [URL] [output.png]

Playwright full page:
  npx playwright screenshot --viewport-size="1280,800" --full-page [URL] [output.png]
```

### Tech Stack Detection Tools

```
TOOL                    TYPE          COST        USE CASE
────────────────────────────────────────────────────────────────
Wappalyzer              Extension     Freemium    Detect technologies on any site
BuiltWith               Web tool      Freemium    Comprehensive tech profiling
WhatCMS                 Web tool      Free        CMS detection
WhatRuns                Extension     Free        Technology detection
SimilarTech             Web tool      Paid        Technology market share
────────────────────────────────────────────────────────────────

BuiltWith:
  https://builtwith.com/[domain]

WhatCMS:
  https://whatcms.org/

Manual detection (CLI):
  curl -sI [URL] | grep -i "x-powered-by\|server\|x-vercel\|cf-ray"
  curl -s [URL] | grep -o '__NEXT_DATA__\|__NUXT__\|___gatsby\|wp-content'
```

---

## Audit Execution Workflow

```
COMPLETE AUDIT WORKFLOW (for reference/competitor sites):
═══════════════════════════════════════════════════════════

STEP 1: PREPARATION (5 min)
├── Document: site URL, company name, industry
├── Identify: what aspect of this site are we interested in?
├── Create: docs/audits/[sitename]/ directory
└── Note: date of audit

STEP 2: TECHNICAL AUDIT (15 min)
├── Run Lighthouse (mobile + desktop)
├── Check security headers (curl -I)
├── Check Core Web Vitals (PageSpeed Insights)
├── Note: hosting, CDN, HTTP version
└── Save: [sitename]-tech.md

STEP 3: VISUAL AUDIT (20 min)
├── Capture screenshots at 5 viewports
├── Extract color palette
├── Identify typography (fonts, sizes, weights)
├── Note spacing patterns
├── Evaluate component consistency
├── Evaluate responsive behavior
└── Save: [sitename]-visual.md

STEP 4: CONTENT AUDIT (15 min)
├── Read and evaluate headlines and copy
├── Check heading hierarchy
├── Check alt texts (sample of 10+ images)
├── Evaluate CTA strategy
├── Note tone of voice
└── Save: [sitename]-content.md

STEP 5: SEO AUDIT (15 min)
├── Check meta tags on 5+ pages
├── Check sitemap.xml and robots.txt
├── Check structured data (Rich Results Test)
├── Check Open Graph (opengraph.xyz)
├── Note: indexed page count (site:domain.com)
└── Save: [sitename]-seo.md

STEP 6: SYNTHESIS (10 min)
├── Calculate scores for each pillar
├── Identify top 3 strengths
├── Identify top 3 weaknesses
├── Note: what to adopt for TrueOmni
├── Note: what to avoid
├── Note: differentiation opportunities
└── Save: [sitename]-summary.md

TOTAL TIME: ~80 minutes per site
```

---

_This skill provides a comprehensive framework for auditing websites across technical, visual, content, and SEO dimensions. Use it during the Moodboard phase (Phase 1.5) to audit reference sites, during development for quality assurance, and before launch for final validation of the TrueOmni Website 2026._
