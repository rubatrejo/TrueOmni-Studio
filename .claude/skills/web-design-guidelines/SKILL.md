# Web Design Guidelines

---

name: web-design-guidelines
description: |
Comprehensive web design guidelines covering WCAG accessibility, usability heuristics,
mobile-first patterns, form design, navigation, error/loading/empty states, modals,
scroll patterns, search UX, data visualization, and copy/content guidelines.
Applied to modern web projects using Next.js, Tailwind CSS, and component-based architectures.
triggers:

- web design guidelines
- accessibility check
- WCAG audit
- usability review
- form design
- navigation patterns
- error states
- loading states
- empty states
- UX best practices
- mobile design
- responsive design
- modal design
- toast notifications
- search UX
- data visualization
- microcopy
- content guidelines

---

## Table of Contents

1. [WCAG 2.1 Complete Checklist](#1-wcag-21-complete-checklist)
2. [Nielsen's 10 Usability Heuristics](#2-nielsens-10-usability-heuristics)
3. [Mobile-First Design Patterns](#3-mobile-first-design-patterns)
4. [Form Design Best Practices](#4-form-design-best-practices)
5. [Navigation Patterns](#5-navigation-patterns)
6. [Error State Design](#6-error-state-design)
7. [Loading State Patterns](#7-loading-state-patterns)
8. [Empty State Design](#8-empty-state-design)
9. [Toast/Notification Patterns](#9-toastnotification-patterns)
10. [Modal/Dialog Best Practices](#10-modaldialog-best-practices)
11. [Scroll Patterns](#11-scroll-patterns)
12. [Search UX Patterns](#12-search-ux-patterns)
13. [Data Visualization Guidelines](#13-data-visualization-guidelines)
14. [Copy/Content Guidelines](#14-copycontent-guidelines)

---

## 1. WCAG 2.1 Complete Checklist

> Web Content Accessibility Guidelines (WCAG) 2.1 organized by the four principles: Perceivable, Operable, Understandable, Robust. Each criterion includes its level (A, AA, or AAA) and implementation guidance.

### 1.1 Perceivable

Users must be able to perceive the information being presented. Content cannot be invisible to all of their senses.

#### 1.1.1 Text Alternatives (Level A)

**Criterion:** All non-text content has a text alternative that serves the equivalent purpose.

```tsx
// CORRECT: Informative image with descriptive alt text
<Image
  src="/product-dashboard.png"
  alt="TrueOmni dashboard showing real-time analytics with conversion metrics and user activity graphs"
  width={1200}
  height={630}
/>

// CORRECT: Decorative image with empty alt
<Image src="/decorative-wave.svg" alt="" role="presentation" width={100} height={20} />

// CORRECT: Icon button with accessible label
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>

// CORRECT: Complex image with extended description
<figure>
  <Image src="/infographic.png" alt="Q4 2026 growth summary" width={800} height={600} />
  <figcaption>
    Revenue grew 45% year-over-year, with enterprise segment leading at 62% growth.
    Customer acquisition cost decreased 18% through organic channel optimization.
  </figcaption>
</figure>

// WRONG: Missing alt text
<img src="/chart.png" />

// WRONG: Non-descriptive alt text
<img src="/dashboard.png" alt="image" />
<img src="/dashboard.png" alt="screenshot" />
```

**Rules for alt text:**

- Informative images: Describe the content and function (max 125 characters recommended)
- Decorative images: Use `alt=""` and `role="presentation"`
- Functional images (buttons, links): Describe the action, not the image
- Complex images (charts, infographics): Provide a summary in alt, full description in figcaption or linked text
- Image of text: Include the full text in the alt attribute
- Background images in CSS: Ensure they are purely decorative or provide text alternative in HTML
- SVG icons: Use `aria-hidden="true"` when paired with text, or `role="img"` with `aria-label` when standalone

#### 1.1.2 Time-Based Media (Level A)

**Criterion:** Alternatives are provided for time-based media (audio, video).

```tsx
// Video with captions and transcript
<figure>
  <video controls>
    <source src="/product-demo.mp4" type="video/mp4" />
    <track
      kind="captions"
      src="/captions/product-demo-en.vtt"
      srcLang="en"
      label="English"
      default
    />
    <track
      kind="descriptions"
      src="/descriptions/product-demo-en.vtt"
      srcLang="en"
      label="English Audio Description"
    />
    Your browser does not support video. <a href="/product-demo.mp4">Download the video</a>.
  </video>
  <figcaption>
    <a href="/transcripts/product-demo.html">Read full transcript</a>
  </figcaption>
</figure>

// Audio with transcript
<audio controls>
  <source src="/podcast-episode-12.mp3" type="audio/mpeg" />
</audio>
<a href="/transcripts/podcast-episode-12.html">Read transcript</a>
```

**Requirements by level:**

- Level A: Captions for prerecorded audio; audio description or media alternative for prerecorded video
- Level AA: Captions for live audio; audio description for prerecorded video
- Level AAA: Sign language interpretation; extended audio description; media alternative for prerecorded video; captions for live audio

#### 1.1.3 Adaptable (Level A)

**Criterion:** Content can be presented in different ways without losing information or structure.

**1.3.1 Info and Relationships (Level A):**

```tsx
// CORRECT: Semantic HTML structure
<article>
  <header>
    <h1>Product Features</h1>
    <p>Published <time dateTime="2026-03-15">March 15, 2026</time></p>
  </header>
  <section aria-labelledby="ai-features">
    <h2 id="ai-features">AI-Powered Features</h2>
    <ul>
      <li>Natural language processing</li>
      <li>Predictive analytics</li>
    </ul>
  </section>
  <aside aria-label="Related content">
    <h3>Related Articles</h3>
  </aside>
</article>

// CORRECT: Data table with proper headers
<table>
  <caption>Pricing Plans Comparison</caption>
  <thead>
    <tr>
      <th scope="col">Feature</th>
      <th scope="col">Starter</th>
      <th scope="col">Pro</th>
      <th scope="col">Enterprise</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">API Calls</th>
      <td>10,000/mo</td>
      <td>100,000/mo</td>
      <td>Unlimited</td>
    </tr>
  </tbody>
</table>

// CORRECT: Form with proper labels and grouping
<fieldset>
  <legend>Contact Information</legend>
  <div>
    <label htmlFor="name">Full Name</label>
    <input id="name" type="text" required />
  </div>
  <div>
    <label htmlFor="email">Email Address</label>
    <input id="email" type="email" required />
  </div>
</fieldset>
```

**1.3.2 Meaningful Sequence (Level A):**

- DOM order must match visual order
- CSS flexbox `order` and grid placement must not create a confusing tab sequence
- Content should make sense when CSS is disabled

**1.3.3 Sensory Characteristics (Level A):**

```tsx
// WRONG: Relying only on color
<p>Fields marked in red are required.</p>

// CORRECT: Using multiple cues
<p>Fields marked with <span className="text-red-600">* (asterisk)</span> are required.</p>

// WRONG: Relying only on position
<p>Click the button on the right to submit.</p>

// CORRECT: Using label reference
<p>Click the "Submit Application" button to proceed.</p>
```

**1.3.4 Orientation (Level AA - WCAG 2.1):**

- Content must not be restricted to a single display orientation (portrait or landscape) unless essential
- Do not use CSS that locks orientation: avoid `@media (orientation: portrait) { transform: rotate(90deg); }`

**1.3.5 Identify Input Purpose (Level AA - WCAG 2.1):**

```tsx
// CORRECT: Using autocomplete attributes for user data
<input type="text" autoComplete="given-name" name="firstName" />
<input type="text" autoComplete="family-name" name="lastName" />
<input type="email" autoComplete="email" name="email" />
<input type="tel" autoComplete="tel" name="phone" />
<input type="text" autoComplete="street-address" name="address" />
<input type="text" autoComplete="postal-code" name="zipCode" />
<input type="text" autoComplete="organization" name="company" />
```

**1.3.6 Identify Purpose (Level AAA - WCAG 2.1):**

- Use ARIA landmarks (`role="banner"`, `role="navigation"`, `role="main"`, `role="contentinfo"`)
- Use semantic HTML5 elements (`<header>`, `<nav>`, `<main>`, `<footer>`, `<aside>`)
- Identify icons and regions programmatically

#### 1.1.4 Distinguishable (Level A/AA/AAA)

**1.4.1 Use of Color (Level A):**

```tsx
// WRONG: Color-only status indication
<span className="text-green-500">Active</span>
<span className="text-red-500">Inactive</span>

// CORRECT: Color + icon + text
<span className="text-green-600 flex items-center gap-1">
  <CheckCircle className="h-4 w-4" aria-hidden="true" />
  Active
</span>
<span className="text-red-600 flex items-center gap-1">
  <XCircle className="h-4 w-4" aria-hidden="true" />
  Inactive
</span>

// CORRECT: Link distinguished by underline, not just color
<a href="/pricing" className="text-blue-600 underline hover:text-blue-800">
  View pricing
</a>
```

**1.4.2 Audio Control (Level A):**

- Any audio that plays automatically for more than 3 seconds must have pause/stop/volume controls
- Prefer no autoplay audio at all

**1.4.3 Contrast (Minimum) (Level AA):**

```
Normal text (< 18pt / < 14pt bold): Minimum 4.5:1 contrast ratio
Large text (>= 18pt / >= 14pt bold): Minimum 3:1 contrast ratio
Incidental or decorative text: No requirement

// Tailwind examples meeting AA contrast on white (#FFFFFF):
text-gray-900 (#111827) → 15.39:1 ✅ (excellent)
text-gray-700 (#374151) → 10.31:1 ✅ (excellent)
text-gray-600 (#4B5563) → 7.45:1  ✅ (good)
text-gray-500 (#6B7280) → 5.09:1  ✅ (passes for normal text)
text-gray-400 (#9CA3AF) → 3.03:1  ⚠️ (only large text)
text-gray-300 (#D1D5DB) → 1.77:1  ❌ (fails)

// Tools for checking contrast:
// - WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
// - Chrome DevTools: Elements > Styles > color > contrast ratio
// - axe DevTools browser extension
```

**1.4.4 Resize Text (Level AA):**

- Text must be resizable up to 200% without loss of content or functionality
- Use relative units (`rem`, `em`) not fixed pixels for font sizes
- Test with browser zoom at 200%

**1.4.5 Images of Text (Level AA):**

- Do not use images for text that can be rendered as HTML text
- Exception: Logos, brand marks
- Use CSS for visual presentation of text (gradients, shadows, custom fonts)

**1.4.6 Contrast (Enhanced) (Level AAA):**

```
Normal text: Minimum 7:1 contrast ratio
Large text: Minimum 4.5:1 contrast ratio
```

**1.4.7 Low or No Background Audio (Level AAA):**

- Speech recordings: Background sounds should be at least 20 dB lower than foreground speech
- Or provide a way to turn off background audio

**1.4.8 Visual Presentation (Level AAA):**

- Width no more than 80 characters (40 for CJK)
- Text is not justified (use `text-left` not `text-justify`)
- Line spacing at least 1.5x font size (`leading-relaxed` or `leading-loose`)
- Paragraph spacing at least 1.5x line spacing
- User can select foreground/background colors

**1.4.9 Images of Text (No Exception) (Level AAA):**

- Images of text are only used for pure decoration or where particular visual presentation is essential

**1.4.10 Reflow (Level AA - WCAG 2.1):**

```css
/* Content must reflow at 320px CSS width (equivalent to 400% zoom at 1280px)
   without requiring horizontal scrolling */

/* CORRECT: Responsive container */
.container {
  max-width: 100%;
  padding-inline: 1rem;
}

/* Exceptions: data tables, maps, diagrams, video, toolbars may scroll horizontally */
```

**1.4.11 Non-Text Contrast (Level AA - WCAG 2.1):**

```tsx
// UI components and graphical objects need 3:1 contrast ratio against adjacent colors

// CORRECT: Form input with visible border
<input className="border-2 border-gray-400 rounded-md" />
// border-gray-400 (#9CA3AF) on white → 3.03:1 ✅

// CORRECT: Focus indicator with sufficient contrast
<button className="focus:outline-2 focus:outline-offset-2 focus:outline-blue-600">
  Submit
</button>

// WRONG: Low contrast icon
<Icon className="text-gray-300" /> // 1.77:1 on white ❌
```

**1.4.12 Text Spacing (Level AA - WCAG 2.1):**

```css
/* Content must remain functional when user overrides these properties:
   - Line height to at least 1.5x font size
   - Paragraph spacing to at least 2x font size
   - Letter spacing to at least 0.12x font size
   - Word spacing to at least 0.16x font size */

/* Do NOT use fixed heights on text containers */
/* WRONG */
.text-box {
  height: 100px;
  overflow: hidden;
}

/* CORRECT */
.text-box {
  min-height: 100px;
}
```

**1.4.13 Content on Hover or Focus (Level AA - WCAG 2.1):**

```tsx
// Tooltips/popovers that appear on hover/focus must be:
// 1. Dismissable (Escape key closes it)
// 2. Hoverable (user can move pointer over the tooltip without it disappearing)
// 3. Persistent (stays visible until user dismisses, removes hover, or removes focus)

// Using Radix UI Tooltip (shadcn/ui):
<TooltipProvider delayDuration={300}>
  <Tooltip>
    <TooltipTrigger asChild>
      <button>
        <HelpCircle className="h-4 w-4" />
        <span className="sr-only">More information about API limits</span>
      </button>
    </TooltipTrigger>
    <TooltipContent side="top" sideOffset={4}>
      <p>API calls are counted per calendar month and reset on the 1st.</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### 1.2 Operable

Users must be able to operate the interface. The interface cannot require interaction that a user cannot perform.

#### 2.1 Keyboard Accessible

**2.1.1 Keyboard (Level A):**

```tsx
// ALL interactive elements must be keyboard accessible
// Use native HTML elements when possible — they get keyboard support for free

// CORRECT: Native button (Enter/Space activates)
<button onClick={handleClick}>Submit</button>

// WRONG: Div as button (no keyboard support)
<div onClick={handleClick}>Submit</div>

// If you must use a non-native element:
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }}
>
  Submit
</div>

// Custom keyboard shortcuts
// Use event.key, not event.keyCode (deprecated)
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') closeDialog()
    if (e.key === '/' && !isInputFocused()) openSearch()
  }
  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}, [])
```

**2.1.2 No Keyboard Trap (Level A):**

- Users must be able to navigate away from any component using only the keyboard
- Exception: Modal dialogs should trap focus, but must have a clear exit (Escape key, close button)

```tsx
// Focus trap for modals (using Radix UI Dialog from shadcn/ui)
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    {/* Focus is trapped here automatically by Radix */}
    {/* Escape key closes the dialog */}
    {/* Focus returns to trigger element on close */}
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**2.1.3 Keyboard (No Exception) (Level AAA):**

- ALL functionality must be operable through keyboard with no exceptions

**2.1.4 Character Key Shortcuts (Level A - WCAG 2.1):**

- If single-character key shortcuts exist, provide a way to turn them off, remap them, or make them active only on focus

#### 2.2 Enough Time

**2.2.1 Timing Adjustable (Level A):**

- If there is a time limit, user must be able to turn off, adjust, or extend it
- Session timeouts: Warn at least 20 seconds before expiration, allow extension

```tsx
// Session timeout warning
function SessionTimeoutWarning() {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes warning

  return showWarning ? (
    <Dialog open={showWarning} onOpenChange={setShowWarning}>
      <DialogContent>
        <DialogTitle>Session Expiring</DialogTitle>
        <DialogDescription>
          Your session will expire in {timeLeft} seconds. Would you like to continue?
        </DialogDescription>
        <DialogFooter>
          <Button onClick={extendSession}>Continue Session</Button>
          <Button variant="outline" onClick={logout}>
            Log Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null;
}
```

**2.2.2 Pause, Stop, Hide (Level A):**

- Moving, blinking, scrolling content that starts automatically and lasts more than 5 seconds: Provide pause/stop/hide control
- Auto-updating content: Provide pause/stop/hide control or frequency control
- Applies to: Carousels, auto-playing videos, live feeds, animations

```tsx
// Carousel with pause control
function HeroCarousel({ slides }: { slides: Slide[] }) {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      <Carousel autoPlay={!isPaused} interval={5000}>
        {slides.map((slide) => (
          <CarouselSlide key={slide.id} {...slide} />
        ))}
      </Carousel>
      <button
        onClick={() => setIsPaused(!isPaused)}
        aria-label={isPaused ? 'Play carousel' : 'Pause carousel'}
      >
        {isPaused ? <Play /> : <Pause />}
      </button>
    </div>
  );
}
```

**2.2.3-2.2.6 (Level AAA):**

- No Timing: No time limits at all
- Interruptions: User can postpone or suppress interruptions
- Re-authenticating: Data is preserved after re-authentication
- Timeouts: Warn users about data loss from inactivity timeouts

#### 2.3 Seizures and Physical Reactions

**2.3.1 Three Flashes or Below Threshold (Level A):**

- No content flashes more than 3 times per second
- Applies to: Videos, animations, GIFs, rapid transitions

```tsx
// SAFE: Framer Motion with reasonable animation speeds
<motion.div
  animate={{ opacity: [0, 1] }}
  transition={{ duration: 0.3 }} // 0.3s = ~3.3 flashes/sec max — but this is a single fade, OK
/>

// DANGEROUS: Rapid flashing — NEVER do this
<motion.div
  animate={{ opacity: [0, 1, 0, 1, 0, 1, 0, 1] }}
  transition={{ duration: 1 }} // 8 flashes in 1 second ❌
/>

// Respect prefers-reduced-motion
const prefersReducedMotion = usePrefersReducedMotion()
<motion.div
  animate={prefersReducedMotion ? {} : { y: [0, -10, 0] }}
  transition={{ repeat: Infinity, duration: 2 }}
/>
```

**2.3.2 Three Flashes (Level AAA):**

- No content flashes more than 3 times per second, period (no threshold exception)

**2.3.3 Animation from Interactions (Level AAA - WCAG 2.1):**

```tsx
// Respect prefers-reduced-motion media query
import { useReducedMotion } from 'framer-motion'

function AnimatedComponent() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5 }}
    />
  )
}

// Global CSS approach
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

#### 2.4 Navigable

**2.4.1 Bypass Blocks (Level A):**

```tsx
// Skip to main content link
function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-blue-600 focus:shadow-lg focus:outline-2 focus:outline-blue-600"
    >
      Skip to main content
    </a>
  );
}

// In layout.tsx
<body>
  <SkipToContent />
  <Header />
  <main id="main-content" tabIndex={-1}>
    {children}
  </main>
  <Footer />
</body>;
```

**2.4.2 Page Titled (Level A):**

```tsx
// Every page must have a unique, descriptive title
// In Next.js App Router:
export const metadata: Metadata = {
  title: 'Pricing Plans | TrueOmni', // Specific → General
  description: 'Compare TrueOmni pricing plans...',
};

// Dynamic titles:
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  return {
    title: `${post.title} | TrueOmni Blog`,
  };
}

// Title format: [Page Name] | [Site Name]
// Examples:
// "Pricing Plans | TrueOmni"
// "How to Set Up Analytics | TrueOmni Blog"
// "About Our Team | TrueOmni"
```

**2.4.3 Focus Order (Level A):**

- Focus order must be logical and meaningful (generally follows DOM order)
- Tab order: left-to-right, top-to-bottom for LTR languages
- Do not use `tabIndex` values greater than 0

**2.4.4 Link Purpose (In Context) (Level A):**

```tsx
// WRONG: Ambiguous link text
<a href="/pricing">Click here</a>
<a href="/docs">Read more</a>
<a href="/blog/post-1">Learn more</a>

// CORRECT: Descriptive link text
<a href="/pricing">View pricing plans</a>
<a href="/docs">Read the documentation</a>
<a href="/blog/post-1">Read "How to Set Up Analytics"</a>

// When the visual design requires "Read more":
<a href="/blog/post-1">
  Read more<span className="sr-only"> about How to Set Up Analytics</span>
</a>

// External links: indicate they open in a new window
<a href="https://docs.example.com" target="_blank" rel="noopener noreferrer">
  Documentation
  <span className="sr-only"> (opens in new tab)</span>
  <ExternalLink className="h-3 w-3 inline ml-1" aria-hidden="true" />
</a>
```

**2.4.5 Multiple Ways (Level AA):**

- Provide at least two ways to find any page: navigation menu, sitemap, search, links within content

**2.4.6 Headings and Labels (Level AA):**

```tsx
// Headings must be descriptive and in logical hierarchy
<h1>Product Features</h1>           // One h1 per page
  <h2>AI-Powered Analytics</h2>     // Section heading
    <h3>Predictive Models</h3>      // Subsection
    <h3>Custom Dashboards</h3>      // Subsection
  <h2>Integration Hub</h2>          // Section heading
    <h3>API Connections</h3>        // Subsection

// Never skip heading levels (h1 → h3 without h2)
// Labels must clearly describe the purpose of the input
```

**2.4.7 Focus Visible (Level AA):**

```css
/* ALWAYS provide visible focus indicators */
/* Tailwind CSS approach: */
.interactive-element {
  @apply focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600;
  @apply focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2;
}

/* Global focus styles */
*:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* NEVER do this: */
*:focus {
  outline: none;
} /* ❌ Removes all focus indicators */

/* It is OK to remove default outline IF you replace it with a custom visible indicator: */
button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}
```

**2.4.8-2.4.10 (Level AAA):**

- Location: Provide breadcrumbs or other way-finding mechanism
- Link Purpose (Link Only): Link text alone is sufficient to identify purpose
- Section Headings: Use headings to organize content into sections

**2.4.11 Focus Not Obscured (Minimum) (Level AA - WCAG 2.2):**

- When an element receives focus, it is not entirely hidden by author-created content (sticky headers, footers, overlays)

```css
/* Account for sticky header height in scroll-padding */
html {
  scroll-padding-top: 80px; /* Height of sticky header */
}

/* Ensure focused elements scroll into view below sticky elements */
:focus {
  scroll-margin-top: 80px;
}
```

#### 2.5 Input Modalities (WCAG 2.1)

**2.5.1 Pointer Gestures (Level A):**

- Any multipoint or path-based gesture (pinch, swipe) must have a single-pointer alternative
- Provide buttons for map zoom instead of requiring pinch gestures

**2.5.2 Pointer Cancellation (Level A):**

- Use `onClick` (fires on release), not `onMouseDown` (fires on press)
- User must be able to abort an action by moving the pointer away before releasing

**2.5.3 Label in Name (Level A):**

```tsx
// The accessible name must contain the visible text label

// CORRECT: aria-label matches visible text
<button aria-label="Submit form">Submit</button>

// WRONG: aria-label contradicts visible text
<button aria-label="Send data to server">Submit</button>
// Screen reader says "Send data to server" but sighted user sees "Submit"

// CORRECT: Just use visible text as the label
<button>Submit</button>
```

**2.5.4 Motion Actuation (Level A):**

- Functionality triggered by device motion (shake, tilt) must have a UI alternative
- Provide a way to disable motion-based input to prevent accidental activation

**2.5.5-2.5.6 (Level AAA):**

- Target Size: Interactive targets should be at least 44x44 CSS pixels
- Concurrent Input Mechanisms: Do not restrict input to a single modality

### 1.3 Understandable

Users must be able to understand the information and the operation of the interface.

#### 3.1 Readable

**3.1.1 Language of Page (Level A):**

```tsx
// Set language on the html element
// In Next.js App Router layout.tsx:
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

**3.1.2 Language of Parts (Level AA):**

```tsx
// Mark content in a different language
<p>
  The French term <span lang="fr">mise en place</span> means everything in its place.
</p>
```

**3.1.3-3.1.6 (Level AAA):**

- Unusual Words: Provide definitions for jargon or idioms
- Abbreviations: Provide expanded form on first use or via `<abbr title="...">`
- Reading Level: Provide simplified version for content above lower secondary education level
- Pronunciation: Provide pronunciation for ambiguous words

#### 3.2 Predictable

**3.2.1 On Focus (Level A):**

- Focus must not trigger a change of context (page navigation, form submission, dialog opening)

**3.2.2 On Input (Level A):**

- Changing a form input must not automatically trigger a change of context unless the user is warned beforehand

```tsx
// WRONG: Auto-submitting on select change without warning
<select onChange={(e) => navigateTo(e.target.value)}>
  <option value="/pricing/starter">Starter</option>
  <option value="/pricing/pro">Pro</option>
</select>

// CORRECT: Using a submit button
<form onSubmit={handleSubmit}>
  <select name="plan">
    <option value="starter">Starter</option>
    <option value="pro">Pro</option>
  </select>
  <button type="submit">View Plan</button>
</form>

// ALSO CORRECT: Auto-submit with clear warning
<label htmlFor="sort">
  Sort by (changes results automatically):
</label>
<select id="sort" onChange={(e) => sortResults(e.target.value)}>
  <option value="date">Date</option>
  <option value="name">Name</option>
</select>
```

**3.2.3 Consistent Navigation (Level AA):**

- Navigation menus appear in the same order across pages
- Same components in same relative position across pages

**3.2.4 Consistent Identification (Level AA):**

- Components with the same function have the same label across the site
- If a search icon is used in the header, it should have the same label everywhere

**3.2.5 Change on Request (Level AAA):**

- Changes of context are initiated only by user request

#### 3.3 Input Assistance

**3.3.1 Error Identification (Level A):**

```tsx
// Errors must be identified in text, not just color

// CORRECT: Error with icon, color, and text message
<div>
  <label htmlFor="email" className="block text-sm font-medium">
    Email Address{' '}
    <span aria-hidden="true" className="text-red-500">
      *
    </span>
  </label>
  <input
    id="email"
    type="email"
    aria-invalid={!!errors.email}
    aria-describedby={errors.email ? 'email-error' : undefined}
    className={cn(
      'w-full rounded-md border px-3 py-2',
      errors.email ? 'border-red-500' : 'border-gray-300',
    )}
  />
  {errors.email && (
    <p id="email-error" role="alert" className="mt-1 flex items-center gap-1 text-sm text-red-600">
      <AlertCircle className="h-4 w-4" aria-hidden="true" />
      {errors.email.message}
    </p>
  )}
</div>
```

**3.3.2 Labels or Instructions (Level A):**

- Inputs have visible labels (not just placeholder text)
- Instructions are provided before the form or inline with fields
- Required fields are clearly indicated

**3.3.3 Error Suggestion (Level AA):**

```tsx
// Provide specific suggestions for fixing errors

// WRONG: "Invalid input"
// CORRECT: "Email must be in the format name@example.com"

// WRONG: "Password too weak"
// CORRECT: "Password must be at least 8 characters and include a number and special character"

// WRONG: "Invalid date"
// CORRECT: "Please enter a date in the format MM/DD/YYYY"
```

**3.3.4 Error Prevention - Legal, Financial, Data (Level AA):**

- Submissions that are legal, financial, or modify/delete user data:
  - Reversible: Allow undo
  - Checked: Data is validated and user gets chance to correct
  - Confirmed: Review step before final submission

```tsx
// Confirmation step before destructive action
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete Account</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete your account and remove all your
        data from our servers.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={deleteAccount}>Yes, delete my account</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**3.3.5-3.3.6 (Level AAA):**

- Help: Context-sensitive help is available
- Error Prevention (All): Confirmation step for any form submission

### 1.4 Robust

Content must be robust enough to be reliably interpreted by a wide variety of user agents, including assistive technologies.

#### 4.1 Compatible

**4.1.1 Parsing (Level A - Obsolete in WCAG 2.2):**

- Valid HTML: No duplicate IDs, proper nesting, complete start/end tags
- Use an HTML validator regularly

**4.1.2 Name, Role, Value (Level A):**

```tsx
// All UI components must expose name, role, and value to assistive technology

// Custom toggle switch
<Switch
  id="notifications"
  checked={enabled}
  onCheckedChange={setEnabled}
  aria-label="Enable email notifications"
/>

// Custom dropdown
<Select value={selected} onValueChange={setSelected}>
  <SelectTrigger aria-label="Select pricing plan">
    <SelectValue placeholder="Choose a plan" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="starter">Starter</SelectItem>
    <SelectItem value="pro">Pro</SelectItem>
  </SelectContent>
</Select>

// Custom tab component
<Tabs defaultValue="features" aria-label="Product information">
  <TabsList>
    <TabsTrigger value="features">Features</TabsTrigger>
    <TabsTrigger value="pricing">Pricing</TabsTrigger>
    <TabsTrigger value="faq">FAQ</TabsTrigger>
  </TabsList>
  <TabsContent value="features">...</TabsContent>
  <TabsContent value="pricing">...</TabsContent>
  <TabsContent value="faq">...</TabsContent>
</Tabs>
```

**4.1.3 Status Messages (Level AA - WCAG 2.1):**

```tsx
// Status messages must be announced to screen readers without receiving focus

// Success message using role="status"
<div role="status" aria-live="polite">
  {submitted && 'Your demo request has been submitted successfully.'}
</div>

// Error summary using role="alert"
<div role="alert" aria-live="assertive">
  {errors.length > 0 && `There are ${errors.length} errors in the form. Please review and fix them.`}
</div>

// Loading state using aria-busy
<div aria-busy={isLoading} aria-live="polite">
  {isLoading ? 'Loading results...' : `${results.length} results found.`}
</div>

// Search results count update
<div role="status" aria-live="polite" className="sr-only">
  {`${filteredItems.length} items match your search criteria.`}
</div>
```

### WCAG 2.1 Quick Reference Checklist

```
LEVEL A (Minimum — MUST comply):
□ 1.1.1  Text Alternatives
□ 1.2.1  Audio-only and Video-only (Prerecorded)
□ 1.2.2  Captions (Prerecorded)
□ 1.2.3  Audio Description or Media Alternative
□ 1.3.1  Info and Relationships
□ 1.3.2  Meaningful Sequence
□ 1.3.3  Sensory Characteristics
□ 1.3.4  Orientation (2.1)
□ 1.3.5  Identify Input Purpose (2.1)
□ 1.4.1  Use of Color
□ 1.4.2  Audio Control
□ 2.1.1  Keyboard
□ 2.1.2  No Keyboard Trap
□ 2.1.4  Character Key Shortcuts (2.1)
□ 2.2.1  Timing Adjustable
□ 2.2.2  Pause, Stop, Hide
□ 2.3.1  Three Flashes or Below Threshold
□ 2.4.1  Bypass Blocks
□ 2.4.2  Page Titled
□ 2.4.3  Focus Order
□ 2.4.4  Link Purpose (In Context)
□ 2.5.1  Pointer Gestures (2.1)
□ 2.5.2  Pointer Cancellation (2.1)
□ 2.5.3  Label in Name (2.1)
□ 2.5.4  Motion Actuation (2.1)
□ 3.1.1  Language of Page
□ 3.2.1  On Focus
□ 3.2.2  On Input
□ 3.3.1  Error Identification
□ 3.3.2  Labels or Instructions
□ 4.1.2  Name, Role, Value

LEVEL AA (Recommended — SHOULD comply):
□ 1.2.4  Captions (Live)
□ 1.2.5  Audio Description (Prerecorded)
□ 1.3.4  Orientation (2.1)
□ 1.3.5  Identify Input Purpose (2.1)
□ 1.4.3  Contrast (Minimum) — 4.5:1 normal, 3:1 large
□ 1.4.4  Resize Text — up to 200%
□ 1.4.5  Images of Text
□ 1.4.10 Reflow (2.1)
□ 1.4.11 Non-Text Contrast (2.1)
□ 1.4.12 Text Spacing (2.1)
□ 1.4.13 Content on Hover or Focus (2.1)
□ 2.4.5  Multiple Ways
□ 2.4.6  Headings and Labels
□ 2.4.7  Focus Visible
□ 2.4.11 Focus Not Obscured (2.2)
□ 3.1.2  Language of Parts
□ 3.2.3  Consistent Navigation
□ 3.2.4  Consistent Identification
□ 3.3.3  Error Suggestion
□ 3.3.4  Error Prevention (Legal, Financial, Data)
□ 4.1.3  Status Messages (2.1)

LEVEL AAA (Best Practice — MAY comply):
□ 1.2.6  Sign Language
□ 1.2.7  Extended Audio Description
□ 1.2.8  Media Alternative
□ 1.2.9  Audio-only (Live)
□ 1.3.6  Identify Purpose (2.1)
□ 1.4.6  Contrast (Enhanced) — 7:1 normal, 4.5:1 large
□ 1.4.7  Low or No Background Audio
□ 1.4.8  Visual Presentation
□ 1.4.9  Images of Text (No Exception)
□ 2.1.3  Keyboard (No Exception)
□ 2.2.3  No Timing
□ 2.2.4  Interruptions
□ 2.2.5  Re-authenticating
□ 2.2.6  Timeouts
□ 2.3.2  Three Flashes
□ 2.3.3  Animation from Interactions (2.1)
□ 2.4.8  Location
□ 2.4.9  Link Purpose (Link Only)
□ 2.4.10 Section Headings
□ 2.5.5  Target Size (2.1)
□ 2.5.6  Concurrent Input Mechanisms (2.1)
□ 3.1.3  Unusual Words
□ 3.1.4  Abbreviations
□ 3.1.5  Reading Level
□ 3.1.6  Pronunciation
□ 3.2.5  Change on Request
□ 3.3.5  Help
□ 3.3.6  Error Prevention (All)
```

---

## 2. Nielsen's 10 Usability Heuristics

> Jakob Nielsen's heuristics applied to modern web design with practical examples for Next.js + Tailwind + shadcn/ui projects.

### Heuristic 1: Visibility of System Status

**Principle:** The system should always keep users informed about what is going on through appropriate feedback within reasonable time.

**Web Application Examples:**

```tsx
// Loading indicator for async operations
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Submitting...
        </>
      ) : (
        'Submit'
      )}
    </Button>
  );
}

// Progress indicator for multi-step processes
function StepIndicator({ currentStep, totalSteps }: Props) {
  return (
    <div
      className="flex items-center gap-2"
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
    >
      {Array.from({ length: totalSteps }, (_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 flex-1 rounded-full transition-colors',
            i < currentStep ? 'bg-blue-600' : i === currentStep ? 'bg-blue-300' : 'bg-gray-200',
          )}
        />
      ))}
      <span className="text-sm text-gray-600">
        Step {currentStep + 1} of {totalSteps}
      </span>
    </div>
  );
}

// File upload progress
function FileUpload() {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>report.pdf</span>
        <span>{progress}%</span>
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-xs text-gray-500">{progress < 100 ? 'Uploading...' : 'Upload complete'}</p>
    </div>
  );
}

// Active navigation state
<nav>
  {links.map((link) => (
    <Link
      key={link.href}
      href={link.href}
      className={cn(
        'rounded-md px-3 py-2 text-sm font-medium',
        pathname === link.href
          ? 'bg-blue-100 text-blue-700' // Active state
          : 'text-gray-600 hover:bg-gray-100',
      )}
      aria-current={pathname === link.href ? 'page' : undefined}
    >
      {link.label}
    </Link>
  ))}
</nav>;
```

**Checklist:**

- [ ] Loading states for all async operations (data fetches, form submissions, file uploads)
- [ ] Progress indicators for long-running processes
- [ ] Active/selected states in navigation and tabs
- [ ] Success/error feedback after user actions
- [ ] Real-time validation feedback in forms
- [ ] Cursor changes on interactive elements (`cursor-pointer`, `cursor-wait`, `cursor-not-allowed`)
- [ ] Hover/focus states on all interactive elements

### Heuristic 2: Match Between System and the Real World

**Principle:** The system should speak the user's language, with words, phrases, and concepts familiar to the user, rather than system-oriented terms.

**Examples:**

```tsx
// WRONG: Technical jargon
<p>Error: 422 Unprocessable Entity — Validation failed on field 'email' with constraint 'unique'</p>
<button>Instantiate new resource</button>
<label>RFC 5322 compliant identifier</label>

// CORRECT: User-friendly language
<p>This email address is already registered. Please sign in or use a different email.</p>
<button>Create new project</button>
<label>Email address</label>

// WRONG: System dates
<span>2026-03-17T14:30:00Z</span>

// CORRECT: Human-readable dates
<span>March 17, 2026 at 2:30 PM</span>
<span>2 hours ago</span>
<span>Tomorrow at 3:00 PM</span>

// WRONG: Raw file sizes
<span>10485760 bytes</span>

// CORRECT: Human-readable sizes
<span>10 MB</span>

// Use metaphors users understand
// "Dashboard" (car dashboard → overview)
// "Shopping cart" (physical cart → online cart)
// "Bookmark" (physical bookmark → saved item)
// "Folder" (physical folder → file organization)
```

**Checklist:**

- [ ] Error messages use plain language, not error codes
- [ ] Dates and times are formatted for the user's locale
- [ ] Numbers use appropriate formatting (currency, percentages, file sizes)
- [ ] Labels and instructions avoid technical jargon
- [ ] Icons use universally recognized metaphors
- [ ] Processes follow real-world conventions (checkout flow matches physical shopping)

### Heuristic 3: User Control and Freedom

**Principle:** Users often choose system functions by mistake and need a clearly marked "emergency exit" to leave the unwanted state without having to go through an extended dialogue.

**Examples:**

```tsx
// Undo for destructive actions
function DeleteItemButton({ item, onDelete, onUndo }: Props) {
  const handleDelete = () => {
    onDelete(item.id)
    toast({
      title: 'Item deleted',
      description: item.name,
      action: (
        <ToastAction altText="Undo delete" onClick={() => onUndo(item.id)}>
          Undo
        </ToastAction>
      ),
      duration: 8000, // Give enough time to undo
    })
  }
  return <Button variant="destructive" onClick={handleDelete}>Delete</Button>
}

// Modal with clear exit
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    {/* X button in corner */}
    {/* Escape key closes */}
    {/* Clicking outside closes */}
    {/* Cancel button in footer */}
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      <Button onClick={handleSave}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// Multi-step form with back navigation
<div className="flex justify-between">
  <Button variant="outline" onClick={goToPreviousStep} disabled={currentStep === 0}>
    <ChevronLeft className="mr-1 h-4 w-4" />
    Back
  </Button>
  <Button onClick={goToNextStep}>
    {currentStep === totalSteps - 1 ? 'Submit' : 'Next'}
    <ChevronRight className="ml-1 h-4 w-4" />
  </Button>
</div>

// Browser back button support
// Use Next.js router.back() and ensure URLs reflect state
// Don't break the browser's back button with client-side navigation
```

**Checklist:**

- [ ] Undo available for destructive actions (delete, archive, move)
- [ ] Clear cancel/close buttons on all modals and forms
- [ ] Back navigation in multi-step processes
- [ ] Escape key closes modals, dropdowns, popovers
- [ ] Browser back button works as expected
- [ ] Unsaved changes warning when navigating away from forms
- [ ] Clear way to return to the previous state from any page

### Heuristic 4: Consistency and Standards

**Principle:** Users should not have to wonder whether different words, situations, or actions mean the same thing. Follow platform conventions.

**Examples:**

```tsx
// Consistent button hierarchy across the site
<Button variant="default">Primary Action</Button>      // Always for main CTA
<Button variant="outline">Secondary Action</Button>     // Always for secondary actions
<Button variant="ghost">Tertiary Action</Button>        // Always for subtle actions
<Button variant="destructive">Destructive</Button>      // Always for delete/remove
<Button variant="link">Link Style</Button>              // Always for navigation-style actions

// Consistent icon usage
<Search />     // Always means "search"
<Plus />       // Always means "create new"
<Trash2 />     // Always means "delete"
<Pencil />     // Always means "edit"
<X />          // Always means "close"
<Check />      // Always means "confirm/success"
<ChevronDown /> // Always means "expand/dropdown"

// Consistent spacing scale (Tailwind)
// gap-2 (8px) — between inline elements
// gap-4 (16px) — between form fields
// gap-6 (24px) — between sections within a card
// gap-8 (32px) — between cards
// gap-12 (48px) — between page sections
// gap-16+ (64px+) — between major page regions

// Consistent card pattern
function FeatureCard({ title, description, icon: Icon }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
        <Icon className="h-5 w-5 text-blue-600" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}
```

**Checklist:**

- [ ] Same component = same visual treatment everywhere
- [ ] Same action = same label everywhere ("Delete" not sometimes "Remove")
- [ ] Consistent color semantics (red = error/destructive, green = success, yellow = warning, blue = info/primary)
- [ ] Consistent spacing scale throughout the site
- [ ] Consistent border radius across components
- [ ] Consistent shadow levels across elevation layers
- [ ] Follow platform conventions (links underlined, checkboxes square, radio buttons round)
- [ ] Consistent heading hierarchy and typography scale

### Heuristic 5: Error Prevention

**Principle:** Even better than good error messages is a careful design which prevents a problem from occurring in the first place.

**Examples:**

```tsx
// Disable submit until form is valid
<Button type="submit" disabled={!isValid || isSubmitting}>
  {isSubmitting ? 'Submitting...' : 'Submit'}
</Button>

// Constrained input to prevent invalid data
<input
  type="email"
  inputMode="email"         // Mobile: show email keyboard
  autoComplete="email"      // Browser autofill
  pattern="[^@]+@[^@]+\.[^@]+"  // Basic email pattern
  required
/>

<input
  type="tel"
  inputMode="tel"           // Mobile: show phone keyboard
  autoComplete="tel"
  placeholder="(555) 123-4567"
/>

// Date picker instead of free text date input
<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className={cn(!date && 'text-muted-foreground')}>
      <CalendarIcon className="mr-2 h-4 w-4" />
      {date ? format(date, 'PPP') : 'Pick a date'}
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      disabled={(date) => date < new Date()} // Prevent past dates
    />
  </PopoverContent>
</Popover>

// Confirmation for irreversible actions
const handleDeleteAccount = () => {
  // Require typing the account name to confirm
  if (confirmText !== accountName) {
    setError('Please type your account name to confirm deletion.')
    return
  }
  deleteAccount()
}

// Inline validation as user types
<input
  type="text"
  value={username}
  onChange={(e) => {
    setUsername(e.target.value)
    // Debounced check for availability
    debouncedCheckAvailability(e.target.value)
  }}
/>
{usernameStatus === 'available' && (
  <p className="text-sm text-green-600">Username is available</p>
)}
{usernameStatus === 'taken' && (
  <p className="text-sm text-red-600">Username is already taken</p>
)}
```

**Checklist:**

- [ ] Constrain inputs where possible (dropdowns instead of free text, date pickers, number inputs with min/max)
- [ ] Real-time validation before form submission
- [ ] Confirmation dialogs for destructive actions
- [ ] Disable buttons when action is not possible
- [ ] Smart defaults and autofill
- [ ] Undo instead of confirm-before-delete when possible
- [ ] Character counters for text inputs with limits
- [ ] Prevent double-submission of forms

### Heuristic 6: Recognition Rather Than Recall

**Principle:** Minimize the user's memory load by making elements, actions, and options visible. Users should not have to remember information from one part of the dialogue to another.

**Examples:**

```tsx
// Recent searches
function SearchWithHistory() {
  const recentSearches = useRecentSearches()
  return (
    <Command>
      <CommandInput placeholder="Search..." />
      <CommandList>
        <CommandGroup heading="Recent Searches">
          {recentSearches.map(search => (
            <CommandItem key={search}>
              <Clock className="mr-2 h-4 w-4 text-gray-400" />
              {search}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  )
}

// Breadcrumbs for location awareness
<nav aria-label="Breadcrumb">
  <ol className="flex items-center gap-2 text-sm text-gray-500">
    <li><Link href="/" className="hover:text-gray-900">Home</Link></li>
    <li><ChevronRight className="h-4 w-4" /></li>
    <li><Link href="/product" className="hover:text-gray-900">Product</Link></li>
    <li><ChevronRight className="h-4 w-4" /></li>
    <li aria-current="page" className="text-gray-900 font-medium">Analytics</li>
  </ol>
</nav>

// Show selected filters with clear affordance
<div className="flex flex-wrap gap-2">
  {activeFilters.map(filter => (
    <Badge key={filter.id} variant="secondary" className="flex items-center gap-1">
      {filter.label}
      <button onClick={() => removeFilter(filter.id)} aria-label={`Remove ${filter.label} filter`}>
        <X className="h-3 w-3" />
      </button>
    </Badge>
  ))}
  {activeFilters.length > 0 && (
    <button onClick={clearAllFilters} className="text-sm text-blue-600 hover:underline">
      Clear all
    </button>
  )}
</div>

// Tooltip reminders for icon-only buttons
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon" aria-label="Settings">
        <Settings className="h-4 w-4" />
      </Button>
    </TooltipTrigger>
    <TooltipContent>Settings</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

**Checklist:**

- [ ] Breadcrumbs on multi-level pages
- [ ] Recently used/viewed items
- [ ] Autocomplete and suggestions in search
- [ ] Visible labels (not just icons) for important actions
- [ ] Tooltips for icon-only buttons
- [ ] Persistent filters and sort options in URL
- [ ] Form values preserved when navigating back
- [ ] Inline help text for complex form fields

### Heuristic 7: Flexibility and Efficiency of Use

**Principle:** Accelerators, unseen by the novice user, may speed up the interaction for the expert user.

**Examples:**

```tsx
// Keyboard shortcuts for power users
function KeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'k': e.preventDefault(); openCommandPalette(); break
          case '/': e.preventDefault(); focusSearch(); break
          case 's': e.preventDefault(); saveDocument(); break
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
  return null
}

// Command palette (Cmd+K) for quick navigation
<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Type a command or search..." />
  <CommandList>
    <CommandGroup heading="Pages">
      <CommandItem onSelect={() => navigate('/dashboard')}>
        <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
      </CommandItem>
      <CommandItem onSelect={() => navigate('/settings')}>
        <Settings className="mr-2 h-4 w-4" /> Settings
      </CommandItem>
    </CommandGroup>
    <CommandGroup heading="Actions">
      <CommandItem onSelect={createNewProject}>
        <Plus className="mr-2 h-4 w-4" /> Create New Project
      </CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>

// Bulk actions for power users
<div className="flex items-center gap-4 border-b pb-3">
  <Checkbox
    checked={allSelected}
    onCheckedChange={toggleSelectAll}
    aria-label="Select all items"
  />
  {selectedCount > 0 && (
    <>
      <span className="text-sm text-gray-600">{selectedCount} selected</span>
      <Button variant="outline" size="sm" onClick={bulkArchive}>Archive</Button>
      <Button variant="outline" size="sm" onClick={bulkExport}>Export</Button>
      <Button variant="destructive" size="sm" onClick={bulkDelete}>Delete</Button>
    </>
  )}
</div>

// Customizable dashboard (save layout preference)
// Drag-and-drop reordering
// Saved views and presets
```

**Checklist:**

- [ ] Keyboard shortcuts for common actions
- [ ] Command palette for quick navigation
- [ ] Bulk actions for multi-item operations
- [ ] Customizable views and layouts
- [ ] Saved searches and filters
- [ ] Quick actions (right-click context menus, swipe actions on mobile)
- [ ] Keyboard shortcut cheat sheet accessible via `?` key

### Heuristic 8: Aesthetic and Minimalist Design

**Principle:** Interfaces should not contain information which is irrelevant or rarely needed. Every extra unit of information in a dialogue competes with the relevant units and diminishes their relative visibility.

**Examples:**

```tsx
// WRONG: Cluttered card with too much information
<div className="p-6">
  <span className="text-xs text-gray-400">ID: 12345</span>
  <span className="text-xs text-gray-400">Created: 2026-01-01T00:00:00Z</span>
  <span className="text-xs text-gray-400">Modified: 2026-03-17T14:30:00Z</span>
  <span className="text-xs text-gray-400">Status Code: 200</span>
  <h3>Project Alpha</h3>
  <p>A very long description that goes on for multiple paragraphs...</p>
  <span>Owner: John Doe (john@example.com) - Admin Role - Last Login: 2h ago</span>
  <div>12 buttons here</div>
</div>

// CORRECT: Clean card with essential information, details on demand
<div className="p-6">
  <div className="flex items-center justify-between mb-2">
    <h3 className="font-semibold">Project Alpha</h3>
    <Badge>Active</Badge>
  </div>
  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
    Brief description with overflow handling...
  </p>
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <Avatar className="h-5 w-5"><AvatarImage src={owner.avatar} /></Avatar>
      {owner.name}
    </div>
    <span className="text-xs text-gray-400">Updated 2h ago</span>
  </div>
</div>

// Progressive disclosure: show details on demand
<Accordion type="single" collapsible>
  <AccordionItem value="advanced">
    <AccordionTrigger>Advanced Settings</AccordionTrigger>
    <AccordionContent>
      {/* Less commonly used settings hidden until needed */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

**Checklist:**

- [ ] Only essential information visible by default
- [ ] Progressive disclosure for advanced options
- [ ] Clear visual hierarchy (primary, secondary, tertiary content)
- [ ] Adequate whitespace between elements
- [ ] No redundant labels or instructions
- [ ] Truncate long content with "show more" or tooltips
- [ ] Consistent use of color to create hierarchy (not decoration)

### Heuristic 9: Help Users Recognize, Diagnose, and Recover from Errors

**Principle:** Error messages should be expressed in plain language (no codes), precisely indicate the problem, and constructively suggest a solution.

**Examples:**

```tsx
// WRONG error messages:
"Error 500"
"Invalid input"
"Something went wrong"
"Validation failed"
"null is not an object"

// CORRECT error messages:
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Unable to save changes</AlertTitle>
  <AlertDescription>
    Your session has expired. Please <a href="/login" className="underline font-medium">sign in again</a> to continue editing.
    Your changes have been saved as a draft.
  </AlertDescription>
</Alert>

// Form error with specific guidance
<div>
  <Label htmlFor="password">Password</Label>
  <Input id="password" type="password" aria-invalid={!!error} aria-describedby="password-error password-requirements" />
  {error && (
    <p id="password-error" className="text-sm text-red-600 mt-1">
      Password must include at least one uppercase letter.
    </p>
  )}
  <p id="password-requirements" className="text-xs text-gray-500 mt-1">
    Must be at least 8 characters with 1 uppercase, 1 number, and 1 special character.
  </p>
</div>

// 404 page with helpful recovery options
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-4xl font-bold mb-4">Page not found</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <div className="flex gap-4">
        <Button asChild><Link href="/">Go to Homepage</Link></Button>
        <Button variant="outline" asChild><Link href="/sitemap">View Sitemap</Link></Button>
      </div>
      <div className="mt-8">
        <p className="text-sm text-gray-500 mb-2">Or try searching:</p>
        <SearchInput />
      </div>
    </div>
  )
}
```

**Checklist:**

- [ ] Error messages in plain language (no error codes shown to users)
- [ ] Error messages explain what went wrong specifically
- [ ] Error messages suggest how to fix the problem
- [ ] Provide a way to recover (retry button, undo, contact support)
- [ ] Form errors appear next to the relevant field
- [ ] Error summary at the top of form for multiple errors
- [ ] 404/500 pages offer helpful navigation options

### Heuristic 10: Help and Documentation

**Principle:** Even though it is better if the system can be used without documentation, it may be necessary to provide help. Any such information should be easy to search, focused on the user's task, list concrete steps, and not be too large.

**Examples:**

```tsx
// Contextual help tooltips
<div className="flex items-center gap-1">
  <Label htmlFor="api-key">API Key</Label>
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <button aria-label="What is an API key?">
          <HelpCircle className="h-4 w-4 text-gray-400" />
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>Your API key authenticates requests to our service. Find it in Settings → API.</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</div>;

// Onboarding checklist for first-time users
function OnboardingChecklist({ steps }: { steps: OnboardingStep[] }) {
  const completedCount = steps.filter((s) => s.completed).length;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Getting Started</CardTitle>
        <CardDescription>
          {completedCount} of {steps.length} complete
        </CardDescription>
        <Progress value={(completedCount / steps.length) * 100} />
      </CardHeader>
      <CardContent>
        {steps.map((step) => (
          <div key={step.id} className="flex items-start gap-3 border-b py-3 last:border-0">
            {step.completed ? (
              <CheckCircle className="mt-0.5 h-5 w-5 text-green-500" />
            ) : (
              <Circle className="mt-0.5 h-5 w-5 text-gray-300" />
            )}
            <div>
              <p className={cn('font-medium', step.completed && 'text-gray-400 line-through')}>
                {step.title}
              </p>
              <p className="text-sm text-gray-500">{step.description}</p>
              {!step.completed && (
                <Button variant="link" size="sm" className="mt-1 px-0" asChild>
                  <Link href={step.actionUrl}>{step.actionLabel}</Link>
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Empty state with guidance
function EmptyProjectList() {
  return (
    <div className="py-12 text-center">
      <FolderOpen className="mx-auto mb-4 h-12 w-12 text-gray-300" />
      <h3 className="mb-1 text-lg font-medium">No projects yet</h3>
      <p className="mx-auto mb-6 max-w-sm text-sm text-gray-500">
        Create your first project to start tracking analytics and managing your team.
      </p>
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Create Project
      </Button>
      <p className="mt-4 text-xs text-gray-400">
        Need help?{' '}
        <a href="/docs/getting-started" className="text-blue-600 underline">
          Read our getting started guide
        </a>
      </p>
    </div>
  );
}
```

**Checklist:**

- [ ] Contextual help available where users need it (tooltips, inline text)
- [ ] Onboarding flow for first-time users
- [ ] Searchable help center / documentation
- [ ] Empty states with guidance on next steps
- [ ] FAQ section on relevant pages
- [ ] Contact support option available from error states
- [ ] Keyboard shortcut reference (accessible via `?` key)

---

## 3. Mobile-First Design Patterns

### Thumb Zone Design

```
THUMB ZONES (right-handed, portrait mode):
┌─────────────────────────┐
│     HARD TO REACH       │  ← Secondary actions, menu, logo
│                         │
│─────────────────────────│
│                         │
│     COMFORTABLE         │  ← Primary content
│                         │
│─────────────────────────│
│                         │
│     EASY TO REACH       │  ← Primary CTA, navigation, tabs
│     (Natural thumb zone)│
└─────────────────────────┘

IMPLICATIONS:
- Place primary CTAs at the bottom of the screen
- Bottom navigation bar for main navigation
- FABs (Floating Action Buttons) in bottom-right
- Avoid important actions in top-left corner
- Action sheets slide up from bottom, not drop down from top
```

### Touch Target Sizes

```css
/* Minimum touch target: 44x44px (WCAG) / 48x48dp (Material) */
/* Recommended: 48x48px with 8px spacing between targets */

/* Tailwind: Use min-h-11 min-w-11 (44px) at minimum */
.touch-target {
  @apply min-h-11 min-w-11; /* 44px minimum */
  @apply min-h-12 min-w-12; /* 48px recommended */
}

/* Spacing between touch targets: at least 8px */
.touch-target-group {
  @apply gap-2; /* 8px gap */
}

/* For icon buttons, use padding to expand the touch target */
.icon-button {
  @apply p-3; /* 12px padding around a 24px icon = 48px total */
}
```

### Gesture Patterns

```
STANDARD MOBILE GESTURES:
Gesture          → Expected Action
─────────────────────────────────────────
Tap              → Activate/select
Long press       → Context menu / selection mode
Swipe left       → Delete / archive (with undo)
Swipe right      → Mark as read / complete (with undo)
Pull down        → Refresh content
Pinch            → Zoom in/out (maps, images)
Swipe up         → Close bottom sheet / dismiss

RULES:
- Always provide a non-gesture alternative (button, menu item)
- Swipe actions must have visual indicators (reveal behind the item)
- Pull-to-refresh must show loading indicator
- Long press should show a visual cue after ~500ms
- Never require complex gestures (three-finger swipe, etc.)
```

### Viewport Considerations

```tsx
// Breakpoints (Tailwind v4 defaults)
// sm: 640px   — Large phones in landscape, small tablets
// md: 768px   — Tablets in portrait
// lg: 1024px  — Tablets in landscape, small desktops
// xl: 1280px  — Standard desktops
// 2xl: 1536px — Large desktops

// Mobile-first approach: default styles are for mobile
<div className="
  px-4                    /* Mobile: 16px padding */
  sm:px-6                 /* Tablet: 24px padding */
  lg:px-8                 /* Desktop: 32px padding */
  grid
  grid-cols-1             /* Mobile: single column */
  sm:grid-cols-2          /* Tablet: two columns */
  lg:grid-cols-3          /* Desktop: three columns */
  gap-4
  sm:gap-6
  lg:gap-8
">

// Dynamic viewport height (accounts for mobile browser chrome)
<div className="min-h-dvh">  {/* dvh = dynamic viewport height */}
  {/* This accounts for mobile browser toolbar changes */}
</div>

// Safe area insets (for notched devices)
<div className="pb-safe">  {/* Padding for home indicator area */}
  <BottomNavigation />
</div>

// In CSS:
.bottom-nav {
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

// Viewport meta tag (in layout.tsx)
export const metadata: Metadata = {
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,  // Allow zoom (accessibility)
    // NEVER set user-scalable=no or maximum-scale=1 (breaks accessibility)
  },
}
```

### Mobile-Specific Patterns

```tsx
// Responsive navigation: tabs on mobile, sidebar on desktop
function Navigation() {
  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:block w-64 border-r min-h-screen p-4">
        <SidebarLinks />
      </nav>

      {/* Mobile bottom tabs */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden border-t bg-white z-50 pb-safe">
        <div className="flex justify-around py-2">
          <TabLink href="/" icon={Home} label="Home" />
          <TabLink href="/search" icon={Search} label="Search" />
          <TabLink href="/create" icon={Plus} label="Create" />
          <TabLink href="/notifications" icon={Bell} label="Alerts" />
          <TabLink href="/profile" icon={User} label="Profile" />
        </div>
      </nav>
    </>
  )
}

// Bottom sheet instead of modal on mobile
function ResponsiveDialog({ children, ...props }: Props) {
  const isMobile = useMediaQuery('(max-width: 640px)')

  if (isMobile) {
    return (
      <Drawer {...props}>
        <DrawerContent>{children}</DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog {...props}>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  )
}

// Horizontal scroll for content overflow on mobile
<div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide sm:grid sm:grid-cols-3 sm:overflow-visible">
  {items.map(item => (
    <div key={item.id} className="flex-shrink-0 w-72 snap-center sm:w-auto">
      <Card {...item} />
    </div>
  ))}
</div>

// Stack buttons vertically on mobile
<div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
  <Button className="w-full sm:w-auto">Primary Action</Button>
  <Button variant="outline" className="w-full sm:w-auto">Secondary Action</Button>
</div>

// Collapsible content on mobile
<div className="space-y-4">
  {/* On mobile: accordion style, one at a time */}
  <div className="block sm:hidden">
    <Accordion type="single" collapsible>
      {sections.map(section => (
        <AccordionItem key={section.id} value={section.id}>
          <AccordionTrigger>{section.title}</AccordionTrigger>
          <AccordionContent>{section.content}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>

  {/* On desktop: all visible */}
  <div className="hidden sm:grid sm:grid-cols-3 gap-6">
    {sections.map(section => (
      <div key={section.id}>
        <h3 className="font-semibold mb-2">{section.title}</h3>
        <div>{section.content}</div>
      </div>
    ))}
  </div>
</div>
```

### Mobile Form Optimization

```tsx
// Use appropriate input types for mobile keyboards
<input type="email" inputMode="email" />           // @ and . key shown
<input type="tel" inputMode="tel" />               // Phone keypad
<input type="number" inputMode="numeric" />        // Numeric keypad
<input type="url" inputMode="url" />               // .com and / keys
<input type="search" inputMode="search" />         // Search key on keyboard
<input type="text" inputMode="decimal" />          // Numbers with decimal point

// Large, tappable form elements on mobile
<Input className="h-12 text-base" />  // Taller input, 16px font (prevents iOS zoom)

// Note: iOS Safari zooms in on inputs with font-size < 16px
// Always use text-base (16px) or larger on mobile inputs

// Single column forms on mobile
<form className="space-y-4 max-w-lg">
  {/* Full width inputs on mobile, always */}
  <div className="grid gap-4 sm:grid-cols-2">
    <div>
      <Label htmlFor="firstName">First name</Label>
      <Input id="firstName" className="h-12 text-base sm:h-10 sm:text-sm" />
    </div>
    <div>
      <Label htmlFor="lastName">Last name</Label>
      <Input id="lastName" className="h-12 text-base sm:h-10 sm:text-sm" />
    </div>
  </div>
</form>
```

---

## 4. Form Design Best Practices

### Input Types and Validation Patterns

```tsx
// Email validation
const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .min(1, 'Email is required');

// Password validation with strength indicator
const passwordSchema = z
  .string()
  .min(8, 'Must be at least 8 characters')
  .regex(/[A-Z]/, 'Must include an uppercase letter')
  .regex(/[0-9]/, 'Must include a number')
  .regex(/[^A-Za-z0-9]/, 'Must include a special character');

// URL validation
const urlSchema = z
  .string()
  .url('Please enter a valid URL starting with https://')
  .startsWith('https://', 'URL must use HTTPS');

// Phone validation (flexible international format)
const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-()]+$/, 'Please enter a valid phone number')
  .min(7, 'Phone number is too short');

// Credit card (use input masking library like react-input-mask)
// Pattern: #### #### #### ####

// Date validation
const dateSchema = z.coerce
  .date()
  .min(new Date('2020-01-01'), 'Date must be after January 1, 2020')
  .max(new Date('2030-12-31'), 'Date must be before December 31, 2030');

// Form with React Hook Form + Zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  company: z.string().min(1, 'Company name is required'),
  role: z.enum(['developer', 'designer', 'manager', 'executive', 'other']),
  companySize: z.enum(['1-10', '11-50', '51-200', '200+']),
  message: z.string().max(500, 'Message must be under 500 characters').optional(),
});

function DemoForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      message: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Full Name <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input {...field} autoComplete="name" aria-required="true" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* ... other fields ... */}
      </form>
    </Form>
  );
}
```

### Error Message Design

```tsx
// 1. INLINE ERRORS (preferred — next to the field)
<FormItem>
  <FormLabel>Email</FormLabel>
  <FormControl>
    <Input
      {...field}
      aria-invalid={!!fieldState.error}
      aria-describedby={fieldState.error ? 'email-error' : 'email-hint'}
    />
  </FormControl>
  <FormDescription id="email-hint">We'll never share your email with anyone.</FormDescription>
  <FormMessage id="email-error" /> {/* Shows Zod error message */}
</FormItem>;

// 2. ERROR SUMMARY (at top of form, for multiple errors)
function FormErrorSummary({ errors }: { errors: FieldErrors }) {
  const errorEntries = Object.entries(errors);
  if (errorEntries.length === 0) return null;

  return (
    <Alert variant="destructive" role="alert">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Please fix the following errors:</AlertTitle>
      <AlertDescription>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {errorEntries.map(([field, error]) => (
            <li key={field}>
              <a href={`#${field}`} className="underline">
                {error?.message as string}
              </a>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}

// 3. TOAST ERRORS (for server-side errors after submission)
const onSubmit = async (data: FormData) => {
  try {
    await submitForm(data);
    toast({ title: 'Success', description: 'Your demo has been requested.' });
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Submission failed',
      description: 'Please try again or contact support@trueomni.com.',
      action: (
        <ToastAction altText="Try again" onClick={() => form.handleSubmit(onSubmit)()}>
          Try Again
        </ToastAction>
      ),
    });
  }
};

// Error message copywriting rules:
// ✅ "Please enter a valid email address" (specific, helpful)
// ✅ "Password must be at least 8 characters" (actionable)
// ❌ "Invalid" (too vague)
// ❌ "Error" (says nothing)
// ❌ "This field is wrong" (not specific)
// ❌ "Validation failed on constraint 'minLength'" (too technical)
```

### Multi-Step Form Patterns

```tsx
function MultiStepForm() {
  const [step, setStep] = useState(0);
  const steps = [
    { title: 'Contact Info', component: ContactInfoStep },
    { title: 'Company Details', component: CompanyStep },
    { title: 'Your Needs', component: NeedsStep },
    { title: 'Review', component: ReviewStep },
  ];

  return (
    <div className="mx-auto max-w-2xl">
      {/* Step indicator */}
      <nav aria-label="Form progress" className="mb-8">
        <ol className="flex items-center">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium',
                  i < step && 'border-blue-600 bg-blue-600 text-white',
                  i === step && 'border-blue-600 text-blue-600',
                  i > step && 'border-gray-300 text-gray-400',
                )}
              >
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  'ml-2 hidden text-sm sm:inline',
                  i <= step ? 'text-gray-900' : 'text-gray-400',
                )}
              >
                {s.title}
              </span>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    'mx-2 h-0.5 w-12 sm:w-24',
                    i < step ? 'bg-blue-600' : 'bg-gray-200',
                  )}
                />
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Current step */}
      <div role="group" aria-label={`Step ${step + 1}: ${steps[step].title}`}>
        {React.createElement(steps[step].component, { form })}
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={() => validateAndAdvance()}>
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={form.handleSubmit(onSubmit)}>Submit Request</Button>
        )}
      </div>
    </div>
  );
}

// Multi-step form rules:
// - Validate each step before allowing progression
// - Allow going back without losing data
// - Show clear step indicator (current position, total steps)
// - Save progress (localStorage or server) for long forms
// - Review step before final submission
// - Keep each step focused on one topic (3-5 fields max per step)
// - Show completion percentage or step count
```

### Autofill and Browser Integration

```tsx
// Autocomplete attribute reference
// These enable browser autofill and password managers

// Personal info
autoComplete="name"              // Full name
autoComplete="given-name"        // First name
autoComplete="family-name"       // Last name
autoComplete="email"             // Email
autoComplete="tel"               // Phone
autoComplete="tel-national"      // National phone number
autoComplete="bday"              // Birthday
autoComplete="sex"               // Gender

// Address
autoComplete="street-address"    // Street address
autoComplete="address-line1"     // Address line 1
autoComplete="address-line2"     // Address line 2
autoComplete="address-level2"    // City
autoComplete="address-level1"    // State/Province
autoComplete="postal-code"       // ZIP/Postal code
autoComplete="country"           // Country
autoComplete="country-name"      // Country name

// Organization
autoComplete="organization"      // Company name
autoComplete="organization-title" // Job title

// Payment
autoComplete="cc-name"           // Cardholder name
autoComplete="cc-number"         // Card number
autoComplete="cc-exp"            // Expiration date
autoComplete="cc-csc"            // Security code

// Login
autoComplete="username"          // Username
autoComplete="new-password"      // New password (registration)
autoComplete="current-password"  // Existing password (login)
autoComplete="one-time-code"     // OTP/2FA code

// Usage in forms:
<form>
  <input name="name" autoComplete="name" type="text" />
  <input name="email" autoComplete="email" type="email" />
  <input name="company" autoComplete="organization" type="text" />
  <input name="phone" autoComplete="tel" type="tel" />
  <input name="password" autoComplete="new-password" type="password" />
</form>
```

### Form Accessibility Checklist

```
□ Every input has a visible <label> element (not just placeholder)
□ Labels are associated with inputs (htmlFor/id or wrapping)
□ Required fields are indicated (text + aria-required="true")
□ Error messages are associated with inputs (aria-describedby)
□ Error state is communicated (aria-invalid="true")
□ Form groups use <fieldset> and <legend>
□ Submit button text describes the action ("Submit Request" not "Submit")
□ Tab order follows visual order
□ All form controls are keyboard accessible
□ Error messages are announced by screen readers (role="alert" or aria-live)
□ Help text is associated with inputs (aria-describedby)
□ Autocomplete attributes are set correctly
□ Input types match the expected data (email, tel, url, number)
□ Focus moves to first error on form submission failure
□ Success state is announced to screen readers
□ Form can be submitted with Enter key
```

---

## 5. Navigation Patterns

### Mega Menu Implementation

```tsx
// Mega menu with keyboard navigation and accessibility
function MegaMenu() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid w-[600px] gap-3 p-6 lg:w-[800px] lg:grid-cols-[.75fr_1fr]">
              {/* Featured item */}
              <div className="row-span-3 rounded-md bg-gradient-to-b from-blue-50 to-blue-100 p-6">
                <h3 className="mb-2 text-lg font-semibold">TrueOmni Platform</h3>
                <p className="mb-4 text-sm text-gray-600">
                  The complete omnichannel solution for modern businesses.
                </p>
                <NavigationMenuLink asChild>
                  <Link href="/product" className="text-sm font-medium text-blue-600">
                    Explore platform →
                  </Link>
                </NavigationMenuLink>
              </div>

              {/* Feature links */}
              <NavigationMenuLink asChild>
                <Link href="/product/analytics" className="block rounded-md p-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Analytics</p>
                      <p className="text-xs text-gray-500">Real-time insights and reporting</p>
                    </div>
                  </div>
                </Link>
              </NavigationMenuLink>
              {/* ... more links ... */}
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Simple link (no dropdown) */}
        <NavigationMenuItem>
          <Link href="/pricing" legacyBehavior passHref>
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              Pricing
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

// Mega menu accessibility rules:
// - Trigger opens on click (not hover alone — hover can also open, but click must work)
// - Escape closes the menu
// - Arrow keys navigate between items
// - Tab moves through items sequentially
// - Focus is trapped within the open menu
// - Menu closes when focus moves outside
// - aria-expanded on trigger, aria-haspopup="true"
```

### Mobile Drawer / Hamburger Menu

```tsx
function MobileNavigation() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle>
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8" />
              <span className="font-bold">TrueOmni</span>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <nav className="mt-8 flex flex-col gap-1">
          {/* Expandable sections */}
          <Accordion type="single" collapsible>
            <AccordionItem value="product" className="border-0">
              <AccordionTrigger className="rounded-md px-4 py-3 hover:bg-gray-50">
                Product
              </AccordionTrigger>
              <AccordionContent className="pl-4">
                <Link
                  href="/product/analytics"
                  className="block rounded-md px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Analytics
                </Link>
                <Link
                  href="/product/integrations"
                  className="block rounded-md px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Integrations
                </Link>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Simple links */}
          <Link href="/pricing" className="rounded-md px-4 py-3 font-medium hover:bg-gray-50">
            Pricing
          </Link>
          <Link href="/customers" className="rounded-md px-4 py-3 font-medium hover:bg-gray-50">
            Customers
          </Link>
        </nav>

        {/* CTA at bottom */}
        <div className="absolute bottom-8 left-6 right-6 space-y-3">
          <Button className="w-full" asChild>
            <Link href="/demo">Request Demo</Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Mobile navigation rules:
// - Hamburger icon is universally recognized — use it
// - Menu slides in from the side (Sheet) or drops down
// - Close button is visible and easy to reach
// - Current page is highlighted
// - CTA buttons are prominently placed
// - Touch targets are at least 44px
// - Escape key closes the menu
// - Focus is trapped within the open menu
// - Body scroll is locked when menu is open
```

### Breadcrumbs

```tsx
function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol
        className="flex flex-wrap items-center gap-1 text-sm"
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {items.map((item, index) => (
          <li
            key={item.href}
            className="flex items-center gap-1"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />}
            {index === items.length - 1 ? (
              <span className="font-medium text-gray-900" aria-current="page" itemProp="name">
                {item.label}
              </span>
            ) : (
              <Link href={item.href} className="text-gray-500 hover:text-gray-700" itemProp="item">
                <span itemProp="name">{item.label}</span>
              </Link>
            )}
            <meta itemProp="position" content={String(index + 1)} />
          </li>
        ))}
      </ol>
    </nav>
  );
}

// Usage:
<Breadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: 'Product', href: '/product' },
    { label: 'Analytics', href: '/product/analytics' },
  ]}
/>;

// Breadcrumb rules:
// - Include structured data (Schema.org BreadcrumbList)
// - Last item is current page (not a link, aria-current="page")
// - Use chevron (>) separator, not slash (/)
// - Don't show breadcrumbs on the homepage
// - On mobile: show collapsed breadcrumbs if path is too long (... / Parent / Current)
```

### Sticky Header Patterns

```tsx
function StickyHeader() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm py-2'
          : 'bg-transparent py-4'
      )}
    >
      <div className="container mx-auto flex items-center justify-between">
        <Logo />
        <Navigation />
        <CTAButtons />
      </div>
    </header>
  )
}

// Account for sticky header in scroll behavior
// In global CSS:
html {
  scroll-padding-top: 80px; /* Height of sticky header */
}

// For anchor links:
[id] {
  scroll-margin-top: 80px;
}

// Sticky header patterns:
// 1. Always visible (standard sticky)
// 2. Hide on scroll down, show on scroll up (smart sticky)
// 3. Compact on scroll (shrinks logo, reduces padding)
// 4. Transform on scroll (transparent → solid background)
```

### Tab Navigation

```tsx
// Accessible tab component (using Radix Tabs from shadcn/ui)
<Tabs defaultValue="features" className="w-full">
  <TabsList className="grid w-full grid-cols-3" aria-label="Product information">
    <TabsTrigger value="features">Features</TabsTrigger>
    <TabsTrigger value="pricing">Pricing</TabsTrigger>
    <TabsTrigger value="faq">FAQ</TabsTrigger>
  </TabsList>
  <TabsContent value="features" className="mt-6">
    <FeaturesContent />
  </TabsContent>
  <TabsContent value="pricing" className="mt-6">
    <PricingContent />
  </TabsContent>
  <TabsContent value="faq" className="mt-6">
    <FAQContent />
  </TabsContent>
</Tabs>

// Tab navigation rules:
// - Arrow keys move between tabs
// - Tab key moves to tab content
// - aria-selected on active tab
// - role="tablist", role="tab", role="tabpanel"
// - Only active tab content is in the DOM (or others are hidden with aria-hidden)
// - On mobile: horizontally scrollable tabs if they don't fit
// - Consider converting to accordion on mobile for long content

// Scrollable tabs on mobile:
<TabsList className="flex w-full overflow-x-auto scrollbar-hide">
  {tabs.map(tab => (
    <TabsTrigger key={tab.value} value={tab.value} className="flex-shrink-0 whitespace-nowrap">
      {tab.label}
    </TabsTrigger>
  ))}
</TabsList>
```

### Bottom Navigation (Mobile)

```tsx
function BottomNavigation() {
  const pathname = usePathname();
  const items = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/product', icon: Box, label: 'Product' },
    { href: '/pricing', icon: CreditCard, label: 'Pricing' },
    { href: '/company', icon: Building2, label: 'Company' },
    { href: '/demo', icon: CalendarDays, label: 'Demo' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Main navigation"
    >
      <div className="flex justify-around py-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-[64px] flex-col items-center gap-0.5 px-3 py-2 text-xs',
                isActive ? 'text-blue-600' : 'text-gray-500',
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Bottom nav rules:
// - Maximum 5 items (3-5 ideal)
// - Icons + labels (not icons alone)
// - Active state clearly distinguished
// - Account for safe area insets (notched devices)
// - Add padding-bottom to body to account for nav height
// - Do not use bottom nav and hamburger menu simultaneously
```

---

## 6. Error State Design

### Error Page Templates

```tsx
// 404 Not Found
function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-8">
        <p className="mb-2 text-6xl font-bold text-gray-200">404</p>
        <h1 className="mb-3 text-2xl font-bold text-gray-900">Page not found</h1>
        <p className="max-w-md text-gray-600">
          The page you are looking for does not exist or may have been moved to a new URL.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/">Return to homepage</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/contact">Contact support</Link>
        </Button>
      </div>
    </div>
  );
}

// 500 Server Error
function ServerErrorPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-8">
        <ServerCrash className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <h1 className="mb-3 text-2xl font-bold text-gray-900">Something went wrong</h1>
        <p className="max-w-md text-gray-600">
          We are experiencing technical difficulties. Our team has been notified and is working on a
          fix.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Return to homepage</Link>
        </Button>
      </div>
      <p className="mt-8 text-xs text-gray-400">
        If this problem persists, contact us at{' '}
        <a href="mailto:support@trueomni.com" className="underline">
          support@trueomni.com
        </a>
      </p>
    </div>
  );
}

// Network Error (offline state)
function NetworkError({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert>
      <WifiOff className="h-4 w-4" />
      <AlertTitle>No internet connection</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>Please check your connection and try again.</span>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="mr-1 h-3 w-3" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// Inline component error (error boundary fallback)
function ComponentErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-400" />
      <h3 className="mb-1 font-medium text-red-800">Unable to load this section</h3>
      <p className="mb-4 text-sm text-red-600">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
        Try Again
      </Button>
    </div>
  );
}

// Form validation error summary
function ValidationErrorSummary({ errors }: { errors: Record<string, string> }) {
  const errorList = Object.entries(errors);
  if (errorList.length === 0) return null;

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 p-4"
      tabIndex={-1}
      ref={(el) => el?.focus()} // Focus on error summary when it appears
    >
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
        <div>
          <h3 className="font-medium text-red-800">
            Please fix {errorList.length} {errorList.length === 1 ? 'error' : 'errors'}:
          </h3>
          <ul className="mt-2 space-y-1">
            {errorList.map(([field, message]) => (
              <li key={field}>
                <a href={`#${field}`} className="text-sm text-red-700 underline hover:text-red-900">
                  {message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
```

---

## 7. Loading State Patterns

### Skeleton Loading

```tsx
// Skeleton component (using shadcn/ui Skeleton)
import { Skeleton } from '@/components/ui/skeleton';

// Card skeleton
function CardSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border p-6">
      <Skeleton className="h-4 w-3/4" /> {/* Title */}
      <Skeleton className="h-3 w-full" /> {/* Description line 1 */}
      <Skeleton className="h-3 w-5/6" /> {/* Description line 2 */}
      <div className="flex items-center gap-2 pt-2">
        <Skeleton className="h-8 w-8 rounded-full" /> {/* Avatar */}
        <Skeleton className="h-3 w-24" /> {/* Name */}
      </div>
    </div>
  );
}

// Page skeleton with Suspense
function BlogPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-8 text-3xl font-bold">Blog</h1>
      <Suspense fallback={<BlogGridSkeleton />}>
        <BlogGrid />
      </Suspense>
    </div>
  );
}

function BlogGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// Table skeleton
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 border-b pb-3">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}
```

### Shimmer Effect

```css
/* Shimmer animation for skeleton components */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton-shimmer {
  background: linear-gradient(90deg, hsl(0 0% 93%) 25%, hsl(0 0% 97%) 50%, hsl(0 0% 93%) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
```

### Spinner

```tsx
// Spinner component
function Spinner({ size = 'default', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2
      className={cn('animate-spin text-blue-600', sizeClasses[size], className)}
      aria-hidden="true"
    />
  );
}

// Inline loading with spinner
function LoadingButton({ isLoading, children, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={isLoading} {...props}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? 'Loading...' : children}
    </Button>
  );
}

// Full-page loading
function PageLoading() {
  return (
    <div
      className="flex min-h-[60vh] items-center justify-center"
      role="status"
      aria-label="Loading page"
    >
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}
```

### Progressive Loading

```tsx
// Progressive image loading with blur placeholder
import Image from 'next/image';

<Image
  src="/hero-image.jpg"
  alt="TrueOmni platform dashboard"
  width={1200}
  height={630}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..." // Generate with plaiceholder
  priority // For LCP images
/>;

// Streaming with Suspense (Next.js)
async function BlogPosts() {
  const posts = await getPosts(); // This streams as it loads
  return (
    <div className="grid gap-6">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

// In the page:
<Suspense fallback={<BlogGridSkeleton />}>
  <BlogPosts />
</Suspense>;
```

### Optimistic Updates

```tsx
// Optimistic UI update pattern
function LikeButton({ postId, initialLikes, initialLiked }: Props) {
  const [optimisticState, setOptimisticState] = useOptimistic(
    { likes: initialLikes, liked: initialLiked },
    (state, action: 'like' | 'unlike') => ({
      likes: action === 'like' ? state.likes + 1 : state.likes - 1,
      liked: action === 'like',
    }),
  );

  async function handleToggle() {
    const action = optimisticState.liked ? 'unlike' : 'like';
    setOptimisticState(action);
    try {
      await toggleLike(postId, action);
    } catch {
      // Revert happens automatically when the state re-renders from server
      toast({
        variant: 'destructive',
        title: 'Failed to update. Please try again.',
      });
    }
  }

  return (
    <button onClick={handleToggle} className="flex items-center gap-1">
      <Heart className={cn('h-5 w-5', optimisticState.liked && 'fill-red-500 text-red-500')} />
      <span>{optimisticState.likes}</span>
    </button>
  );
}
```

### Loading State Rules

```
WHEN TO USE EACH PATTERN:
─────────────────────────────────────────────────
Skeleton    → Page/section initial load (content layout is predictable)
Shimmer     → Within skeletons for visual polish
Spinner     → Button actions, inline loading (content layout is unknown)
Progressive → Images, heavy media, above-the-fold content
Optimistic  → Toggle actions (like, bookmark, follow)
─────────────────────────────────────────────────

RULES:
- Always show loading state within 100ms of starting a fetch
- Skeleton shapes should match the actual content layout
- Do not show spinners for operations under 300ms (feels jarring)
- For operations over 10 seconds, show progress indicator or status messages
- Include aria-label or role="status" with descriptive text for screen readers
- Use aria-busy="true" on containers being loaded
```

---

## 8. Empty State Design

### First Use / Onboarding Empty States

```tsx
function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-6 rounded-full bg-blue-50 p-4">
        <Sparkles className="h-8 w-8 text-blue-500" />
      </div>
      <h2 className="mb-2 text-xl font-semibold">Welcome to TrueOmni</h2>
      <p className="mb-8 max-w-md text-gray-600">
        Start by setting up your first project. We will guide you through connecting your data
        sources and creating your first dashboard.
      </p>
      <Button size="lg">
        <Plus className="mr-2 h-5 w-5" />
        Create First Project
      </Button>
      <p className="mt-6 text-xs text-gray-400">
        Need help?{' '}
        <Link href="/docs/quickstart" className="text-blue-600 underline">
          Read our quickstart guide
        </Link>
      </p>
    </div>
  );
}
```

### No Results Empty State

```tsx
function NoSearchResults({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <SearchX className="mb-4 h-12 w-12 text-gray-300" />
      <h3 className="mb-1 text-lg font-medium">No results found</h3>
      <p className="mb-6 max-w-sm text-gray-600">
        No results match "{query}". Try adjusting your search or filters.
      </p>
      <div className="space-y-2 text-sm text-gray-500">
        <p>Suggestions:</p>
        <ul className="list-disc space-y-1 pl-4 text-left">
          <li>Check for typos or try different keywords</li>
          <li>Remove some filters to broaden your search</li>
          <li>Try a more general search term</li>
        </ul>
      </div>
    </div>
  );
}
```

### Error Recovery Empty State

```tsx
function DataLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertTriangle className="mb-4 h-12 w-12 text-amber-400" />
      <h3 className="mb-1 text-lg font-medium">Unable to load data</h3>
      <p className="mb-6 max-w-sm text-gray-600">
        We could not load your data. This might be a temporary issue.
      </p>
      <Button onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}
```

### Empty State Design Rules

```
STRUCTURE (every empty state should have):
1. Visual element (illustration or icon — not too large, not distracting)
2. Headline (clear, concise — what is this state)
3. Description (helpful context — why is it empty, what to do)
4. Primary action (button to resolve the empty state)
5. Secondary help (link to docs or support — optional)

RULES:
- Never show a completely blank area with no explanation
- First-use empty states should be welcoming and encouraging
- No-results states should offer recovery suggestions
- Error states should include a retry mechanism
- Use appropriate tone (first-use: friendly; error: empathetic; no-results: helpful)
- Icon/illustration should be subdued (gray/muted), not distracting from the message
- Keep text concise — max 2 short sentences for description
```

---

## 9. Toast/Notification Patterns

### Toast Types

```tsx
// Using shadcn/ui toast system (Sonner or shadcn toast)
import { toast } from 'sonner';

// SUCCESS: Confirm completed action
toast.success('Changes saved successfully');

// ERROR: Report failed action
toast.error('Failed to save changes. Please try again.');

// WARNING: Alert about potential issues
toast.warning('Your session will expire in 5 minutes');

// INFO: Neutral information
toast.info('New feature available: Check out our updated analytics dashboard');

// WITH ACTION: Toast with undo or retry
toast('Item deleted', {
  action: {
    label: 'Undo',
    onClick: () => restoreItem(itemId),
  },
  duration: 8000,
});

// WITH DESCRIPTION: More detail
toast.error('Upload failed', {
  description: 'The file exceeds the maximum size of 10 MB. Please compress it and try again.',
});

// PROMISE: Auto-handle loading/success/error
toast.promise(saveData(), {
  loading: 'Saving changes...',
  success: 'Changes saved successfully',
  error: 'Failed to save changes',
});

// CUSTOM: Rich toast content
toast.custom((t) => (
  <div className="flex items-center gap-4 rounded-lg border bg-white p-4 shadow-lg">
    <Avatar>
      <AvatarImage src={user.avatar} />
    </Avatar>
    <div>
      <p className="font-medium">{user.name} invited you to a project</p>
      <div className="mt-2 flex gap-2">
        <Button
          size="sm"
          onClick={() => {
            acceptInvite();
            toast.dismiss(t);
          }}
        >
          Accept
        </Button>
        <Button size="sm" variant="outline" onClick={() => toast.dismiss(t)}>
          Decline
        </Button>
      </div>
    </div>
  </div>
));
```

### Toast Design Rules

```
POSITIONING:
- Bottom-right (most common for web apps)
- Top-right (alternative, visible without scrolling)
- Top-center (for important alerts)
- Bottom-center (mobile)
- NEVER overlay important content or CTAs

TIMING:
- Success: 3-5 seconds auto-dismiss
- Error: Persist until dismissed (or 8+ seconds)
- Warning: 5-8 seconds auto-dismiss
- Info: 3-5 seconds auto-dismiss
- With actions: Persist until dismissed (or 8+ seconds)

STACKING:
- Maximum 3-5 visible toasts at once
- Stack vertically, newest on top
- Older toasts compress or auto-dismiss

ACCESSIBILITY:
- role="status" for success/info (polite)
- role="alert" for error/warning (assertive)
- Dismiss with Escape key
- Dismiss with swipe on mobile
- Pause auto-dismiss on hover/focus
- Action buttons must be keyboard accessible

CONTENT:
- Keep text short (1 sentence, max 2)
- Lead with the outcome, not the action ("Changes saved" not "The system has saved your changes")
- Include specific details when helpful ("3 items deleted")
- Error toasts should suggest next steps
```

---

## 10. Modal/Dialog Best Practices

### Confirmation Dialog

```tsx
// Destructive confirmation
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive" size="sm">
      <Trash2 className="mr-2 h-4 w-4" />
      Delete Project
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete "Project Alpha"?</AlertDialogTitle>
      <AlertDialogDescription>
        This will permanently delete the project and all its data, including 12 dashboards, 45
        reports, and 3 team members' access. This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
        Delete Project
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### Form Dialog

```tsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="sm:max-w-lg">
    <DialogHeader>
      <DialogTitle>Create New Project</DialogTitle>
      <DialogDescription>Set up a new project to start tracking your analytics.</DialogDescription>
    </DialogHeader>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="project-name">Project Name</Label>
        <Input id="project-name" placeholder="My New Project" autoFocus />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" placeholder="Brief description..." />
      </div>
      <DialogFooter>
        <Button variant="outline" type="button" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit">Create Project</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

### Modal Design Rules

```
SIZING:
- sm: max-w-sm (384px) — Simple confirmations, alerts
- md: max-w-md (448px) — Short forms (1-3 fields)
- lg: max-w-lg (512px) — Standard forms (4-6 fields)
- xl: max-w-xl (576px) — Complex forms with grouped fields
- 2xl: max-w-2xl (672px) — Content with sidebars or preview
- Full-screen: For complex workflows, mobile views, media viewers

BEHAVIOR:
- Focus first interactive element on open (or the close button if no form)
- Trap focus within the modal
- Close on Escape key
- Close on overlay/backdrop click (except for critical confirmations)
- Return focus to trigger element on close
- Lock body scroll when open
- Animate in (scale + fade), animate out (fade)

CONTENT:
- Clear, specific title (not "Are you sure?")
- Description provides context for the action
- Primary action button label matches the dialog title verb
  ("Delete Project" title → "Delete Project" button, not "OK")
- Destructive actions use red button on the right
- Cancel button always available and clearly visible
- If form: auto-focus first input

ANTI-PATTERNS:
- ❌ Modal over modal (dialog inception)
- ❌ Modal for content that should be a page
- ❌ Modals that cannot be closed
- ❌ "OK" as the only action (what does OK mean?)
- ❌ Using modals for non-blocking information (use toast instead)
- ❌ Opening modals without user initiation (except critical alerts)
```

---

## 11. Scroll Patterns

### Infinite Scroll

```tsx
// Infinite scroll with intersection observer
function InfiniteList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(...)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '200px' } // Trigger 200px before reaching the bottom
    )
    if (loadMoreRef.current) observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div>
      {data?.pages.map(page =>
        page.items.map(item => <ItemCard key={item.id} item={item} />)
      )}
      <div ref={loadMoreRef}>
        {isFetchingNextPage && <Spinner />}
        {!hasNextPage && <p className="text-center text-gray-500 py-8">You have reached the end</p>}
      </div>
    </div>
  )
}

// Infinite scroll rules:
// - Show loading indicator when fetching more
// - Indicate when all items are loaded ("You've reached the end")
// - Preserve scroll position on back navigation
// - Provide a "Back to top" button when scrolled far down
// - Consider SEO: Use pagination for crawlable pages, infinite scroll for app-like views
// - Accessibility: Announce new items to screen readers
```

### Pagination

```tsx
function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = generatePageNumbers(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={page === currentPage ? 'default' : 'outline'}
            size="icon"
            onClick={() => onPageChange(page as number)}
            aria-label={`Go to page ${page}`}
            aria-current={page === currentPage ? 'page' : undefined}
          >
            {page}
          </Button>
        ),
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}

// Page number generation: 1 2 3 ... 8 9 10 (show first, last, and around current)
function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  if (current <= 3) return [1, 2, 3, 4, '...', total];
  if (current >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}
```

### Load More Button

```tsx
function LoadMoreList() {
  return (
    <div>
      <div className="grid gap-4">
        {items.map((item) => (
          <ItemCard key={item.id} item={item} />
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-sm text-gray-500">
            Showing {items.length} of {totalCount} items
          </p>
          <Button variant="outline" onClick={loadMore} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
```

### Virtual Scroll

```tsx
// For very large lists (1000+ items), use virtualization
// Libraries: @tanstack/react-virtual, react-window, react-virtuoso

import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Estimated row height
    overscan: 5, // Render 5 extra items above/below viewport
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ItemRow item={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Scroll Pattern Decision Matrix

```
PATTERN          BEST FOR                     NOT FOR
────────────────────────────────────────────────────────────
Infinite Scroll  Social feeds, discovery       SEO-critical content, deep linking
Pagination       Search results, data tables   Casual browsing, feeds
Load More        Blog listings, portfolios     Large datasets (1000+ items)
Virtual Scroll   Very large datasets           Small lists, SSR/SSG pages
────────────────────────────────────────────────────────────

RULES:
- Always communicate total count and current position
- Preserve scroll position on back navigation
- Support keyboard navigation (arrow keys, Page Up/Down)
- Announce loading state to screen readers
- Provide "Back to top" affordance for long scroll
```

---

## 12. Search UX Patterns

### Autocomplete Search

```tsx
function SearchCommand() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { results, isLoading } = useSearch(query);

  // Open with Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex w-64 items-center gap-2 rounded-lg border px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-auto rounded bg-gray-100 px-1.5 py-0.5 text-xs">⌘K</kbd>
      </button>

      {/* Search dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search pages, posts, features..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && <CommandLoading>Searching...</CommandLoading>}
          <CommandEmpty>No results found for "{query}"</CommandEmpty>

          {/* Recent searches */}
          {!query && (
            <CommandGroup heading="Recent">
              {recentSearches.map((search) => (
                <CommandItem key={search} onSelect={() => navigate(search)}>
                  <Clock className="mr-2 h-4 w-4 text-gray-400" />
                  {search}
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Results grouped by type */}
          {results?.pages?.length > 0 && (
            <CommandGroup heading="Pages">
              {results.pages.map((page) => (
                <CommandItem key={page.slug} onSelect={() => navigate(page.url)}>
                  <FileText className="mr-2 h-4 w-4" />
                  <div>
                    <p>{page.title}</p>
                    <p className="text-xs text-gray-500">{page.description}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {results?.posts?.length > 0 && (
            <CommandGroup heading="Blog Posts">
              {results.posts.map((post) => (
                <CommandItem key={post.slug} onSelect={() => navigate(post.url)}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  <div>
                    <p>{post.title}</p>
                    <p className="text-xs text-gray-500">{post.excerpt}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
```

### Faceted Search / Filters

```tsx
function FilteredSearch() {
  const [filters, setFilters] = useState<Filters>({
    category: [],
    dateRange: null,
    status: [],
    sortBy: 'relevance',
  });

  return (
    <div className="flex flex-col gap-8 lg:flex-row">
      {/* Filter sidebar */}
      <aside className="w-full flex-shrink-0 lg:w-64">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Filters</h2>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear all
            </Button>
          )}
        </div>

        {/* Active filters */}
        {hasActiveFilters && (
          <div className="mb-4 flex flex-wrap gap-2 border-b pb-4">
            {activeFilters.map((filter) => (
              <Badge key={filter.id} variant="secondary" className="flex items-center gap-1">
                {filter.label}
                <button
                  onClick={() => removeFilter(filter.id)}
                  aria-label={`Remove ${filter.label} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Filter groups */}
        <Accordion type="multiple" defaultValue={['category', 'status']}>
          <AccordionItem value="category">
            <AccordionTrigger>Category</AccordionTrigger>
            <AccordionContent>
              {categories.map((cat) => (
                <label key={cat.value} className="flex cursor-pointer items-center gap-2 py-1.5">
                  <Checkbox
                    checked={filters.category.includes(cat.value)}
                    onCheckedChange={(checked) => toggleFilter('category', cat.value)}
                  />
                  <span className="text-sm">{cat.label}</span>
                  <span className="ml-auto text-xs text-gray-400">{cat.count}</span>
                </label>
              ))}
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="status">
            <AccordionTrigger>Status</AccordionTrigger>
            <AccordionContent>
              {statuses.map((status) => (
                <label key={status.value} className="flex cursor-pointer items-center gap-2 py-1.5">
                  <Checkbox
                    checked={filters.status.includes(status.value)}
                    onCheckedChange={() => toggleFilter('status', status.value)}
                  />
                  <span className="text-sm">{status.label}</span>
                </label>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </aside>

      {/* Results */}
      <main className="flex-1">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            <span role="status">{totalResults} results</span>
          </p>
          <Select value={filters.sortBy} onValueChange={(v) => updateSort(v)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Most Relevant</SelectItem>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Results grid */}
      </main>
    </div>
  );
}
```

### Search UX Rules

```
AUTOCOMPLETE:
- Debounce input (300ms recommended)
- Show results as user types (after 2+ characters)
- Highlight matching text in results
- Keyboard navigation: arrow keys to select, Enter to confirm, Escape to close
- Show loading state during search
- Show "no results" with suggestions when empty
- Group results by type (pages, blog posts, documentation)

FILTERS:
- Show result count for each filter option
- Update results in real-time as filters change
- Show active filters with clear "remove" affordance
- Provide "clear all filters" button
- Persist filters in URL (for sharing and back button)
- On mobile: filters in a bottom sheet or collapsible panel

RECENT/SAVED:
- Show recent searches when search is focused (empty query)
- Allow clearing recent search history
- Consider saved searches for frequent queries

SEARCH INPUT:
- Large, prominent search field on search-centric pages
- Placeholder text: "Search for..." (describe what can be searched)
- Clear button (X) when input has value
- Keyboard shortcut hint (⌘K or /) shown near the input
```

---

## 13. Data Visualization Guidelines

### Chart Design Principles

```
CHOOSING THE RIGHT CHART:
─────────────────────────────────────────────────
Data Type                → Chart Type
─────────────────────────────────────────────────
Comparison               → Bar chart (horizontal or vertical)
Trend over time          → Line chart
Part of a whole          → Pie/donut (max 5-7 segments) or stacked bar
Distribution             → Histogram, box plot
Relationship             → Scatter plot
Geographic               → Map / choropleth
Single value             → Big number with trend indicator
Progress                 → Progress bar, gauge
Ranking                  → Horizontal bar (sorted)
─────────────────────────────────────────────────

RULES:
- Always start Y-axis at zero for bar charts (to avoid misleading proportions)
- Use consistent colors across charts on the same page
- Include clear labels, units, and a title for every chart
- Provide accessible alternatives (data table behind every chart)
- Use color-blind-safe palettes (avoid red-green only differentiation)
- Add annotations for significant events or data points
- Responsive: Simplify charts on mobile (fewer data points, smaller labels)
```

### KPI / Metric Cards

```tsx
function MetricCard({ title, value, change, changeType, description }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">{title}</CardTitle>
        {changeType === 'increase' ? (
          <TrendingUp className="h-4 w-4 text-green-500" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <div className="mt-1 flex items-center gap-1">
          <span
            className={cn(
              'text-xs font-medium',
              changeType === 'increase' ? 'text-green-600' : 'text-red-600',
            )}
          >
            {changeType === 'increase' ? '+' : ''}
            {change}
          </span>
          <span className="text-xs text-gray-500">{description}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// Usage
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <MetricCard
    title="Total Revenue"
    value="$45,231"
    change="20.1%"
    changeType="increase"
    description="from last month"
  />
  <MetricCard
    title="Subscriptions"
    value="2,350"
    change="180"
    changeType="increase"
    description="new this month"
  />
  <MetricCard
    title="Churn Rate"
    value="3.2%"
    change="0.5%"
    changeType="decrease"
    description="from last month"
  />
  <MetricCard
    title="Active Users"
    value="12,234"
    change="19%"
    changeType="increase"
    description="from last month"
  />
</div>;
```

### Data Table Design

```tsx
// Accessible, sortable data table
function DataTable({ columns, data }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-gray-50">
            {columns.map((col) => (
              <th
                key={col.id}
                scope="col"
                className="h-10 px-4 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                {col.sortable ? (
                  <button
                    className="flex items-center gap-1 hover:text-gray-900"
                    onClick={() => toggleSort(col.id)}
                    aria-label={`Sort by ${col.label}`}
                  >
                    {col.label}
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={row.id} className="border-b transition-colors hover:bg-gray-50">
              {columns.map((col) => (
                <td key={col.id} className="px-4 py-3 text-sm">
                  {col.render ? col.render(row) : row[col.id]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Data table rules:
// - Horizontal scroll on mobile with sticky first column
// - Sortable column headers with aria-sort attribute
// - Zebra striping OR hover highlight (not both)
// - Text left-aligned, numbers right-aligned
// - Action buttons in the last column
// - Empty state when no data
// - Loading skeleton matching table structure
// - Pagination or virtual scroll for large datasets
```

### Accessibility for Data Visualization

```
□ Every chart has a text alternative (summary, data table, or aria-label)
□ Color is not the only differentiator (use patterns, labels, or shapes)
□ Use color-blind-safe palette (test with Coblis or Sim Daltonism)
□ Interactive charts are keyboard navigable
□ Tooltips appear on focus, not just hover
□ Data tables behind charts are available (toggle or link)
□ Sufficient contrast for all text and data elements
□ Animated charts respect prefers-reduced-motion
```

---

## 14. Copy/Content Guidelines

### Microcopy

```
BUTTON LABELS:
- Use specific verbs: "Save Changes" not "Submit"
- Match the dialog title: "Delete Project" dialog → "Delete Project" button
- Describe the outcome: "Send Invitation" not "OK"
- Progressive: "Sign Up Free" → "Create Account" → "Complete Setup"

FORM LABELS:
- Use sentence case: "Email address" not "EMAIL ADDRESS"
- Be specific: "Work email" not just "Email"
- Indicate optional fields: "Phone (optional)" not leaving it ambiguous
- Help text under inputs: "We'll use this to send you a confirmation."

PLACEHOLDER TEXT:
- Show format examples: "name@company.com" not "Enter your email"
- Never use placeholder as the only label (disappears on input)
- Use a lighter color: text-gray-400

ERROR MESSAGES:
- Lead with what went wrong: "Email is already registered"
- Follow with how to fix: "Please sign in or use a different email."
- Be specific, not generic: ❌ "Invalid" ✅ "Must be at least 8 characters"
- Be empathetic: ❌ "Wrong password" ✅ "Incorrect password. Try again or reset it."

CONFIRMATION MESSAGES:
- Confirm what happened: "Your demo has been requested"
- Set expectations: "We'll contact you within 24 hours."
- Provide next step: "Check your email for a confirmation."

EMPTY STATES:
- Explain what the area is for: "This is where your projects will appear."
- Guide to action: "Create your first project to get started."
- Be encouraging, not blaming: ❌ "No data" ✅ "No projects yet"
```

### CTA Best Practices

```
HIERARCHY:
- Primary CTA: 1 per page section (max). Bold, filled button.
- Secondary CTA: Outline or ghost button. Alternative action.
- Tertiary CTA: Text link. Least important option.

PLACEMENT:
- Above the fold for primary conversion CTAs
- After value proposition (user understands why they should act)
- At natural decision points (end of features section, after pricing comparison)
- Sticky CTA on mobile for long pages

WRITING CTAs:
✅ "Start Free Trial" (specific, value-oriented)
✅ "Request a Demo" (clear action)
✅ "See All Features" (describes what happens next)
✅ "Download the Report" (specific outcome)
❌ "Submit" (too generic)
❌ "Click Here" (meaningless)
❌ "Learn More" (vague — learn more about what?)
❌ "Get Started" (started with what?)

REDUCING FRICTION:
- Add reassurance: "Start free — no credit card required"
- Set expectations: "Book a 15-minute demo"
- Show social proof near CTA: "Join 5,000+ companies"
- Urgency without manipulation: "Limited beta spots available" (only if true)
```

### Content Hierarchy Rules

```
INVERTED PYRAMID (most important first):
1. Headline: Core message in 3-8 words
2. Subheadline: Supporting detail in 10-20 words
3. Body: Full explanation, benefits, details
4. CTA: Clear next step

SCANNABILITY:
- Headlines: Communicate value, not just topic
  ❌ "Our Features"
  ✅ "Reduce churn by 40% with predictive analytics"

- Bullet points: Start each with a verb or benefit
  ❌ "Analytics dashboard"
  ✅ "Track user behavior in real-time with customizable dashboards"

- Short paragraphs: Max 3-4 sentences per paragraph on web
- Bold key phrases: Help scanner find relevant info
- Visual anchors: Icons, numbers, and images break up text

HEADING RULES:
- H1: One per page. The primary topic/value proposition.
- H2: Major sections. Should make sense as a table of contents.
- H3: Subsections within H2. Supporting details.
- Never skip heading levels (H1 → H3 without H2)
- Headings are for structure, not styling (don't use H3 because it's smaller)

WORD COUNT GUIDELINES:
- Homepage headline: 3-8 words
- Homepage subheadline: 10-25 words
- Feature description: 15-30 words
- Blog post: 800-2000 words (depending on topic depth)
- Meta description: 120-160 characters
- CTA button: 2-5 words
```

### Tone of Voice Matrix

```
CONTEXT           TONE                EXAMPLE
────────────────────────────────────────────────────────────
Marketing pages   Confident, clear    "Reduce churn by 40%"
Error messages    Helpful, empathetic "We couldn't save. Try again?"
Success messages  Encouraging         "You're all set!"
Onboarding        Friendly, guiding   "Let's set up your first project"
Documentation     Clear, precise      "To configure, add the following..."
Legal pages       Formal, transparent "We collect the following data..."
────────────────────────────────────────────────────────────

RULES:
- Consistent across the same context type
- Never condescending or overly casual in error states
- Never overly formal in marketing (sounds corporate and cold)
- Match the brand personality defined in the design system
```

---

## Quick Reference: Design Review Checklist

```
BEFORE SHIPPING ANY PAGE OR COMPONENT:

□ ACCESSIBILITY
  □ Keyboard navigable (Tab, Enter, Escape, Arrow keys)
  □ Screen reader tested (VoiceOver on Mac, NVDA on Windows)
  □ Color contrast meets AA (4.5:1 text, 3:1 UI components)
  □ Focus indicators visible
  □ Alt text on all images
  □ Form labels and error messages associated correctly
  □ Skip to content link present
  □ Heading hierarchy is logical
  □ prefers-reduced-motion respected

□ RESPONSIVE
  □ Tested at 320px, 375px, 768px, 1024px, 1280px, 1536px
  □ No horizontal scroll at any viewport
  □ Touch targets >= 44px on mobile
  □ Text readable without zoom (>= 16px base)
  □ Images responsive with appropriate sizes

□ LOADING & ERROR STATES
  □ Loading state exists for all async content
  □ Error state exists for all fallible operations
  □ Empty state exists for lists/data that could be empty
  □ Skeleton/placeholder matches content layout

□ INTERACTIONS
  □ All interactive elements have hover, focus, active, disabled states
  □ Feedback for all user actions (toast, status change, animation)
  □ Destructive actions have confirmation
  □ Forms validate on blur/submit with clear messages

□ PERFORMANCE
  □ LCP image uses priority loading
  □ Images use next/image with proper sizing
  □ No layout shift (CLS < 0.1)
  □ Bundle size within budget

□ SEO
  □ Unique, descriptive page title
  □ Meta description (120-160 chars)
  □ Open Graph image (1200x630)
  □ Structured data where applicable
  □ Canonical URL set
```

---

_This skill provides comprehensive web design guidelines for building accessible, usable, and well-designed web interfaces. Apply these guidelines during design, development, and review phases of the TrueOmni Website 2026 project._
