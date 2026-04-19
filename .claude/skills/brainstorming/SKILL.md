# Brainstorming Skill

---

name: brainstorming
description: Explore intention, requirements, and design BEFORE implementing. Structured brainstorming framework for product decisions, feature design, and architecture planning. Forces thinking before coding.
triggers:

- Starting a new feature or page
- Evaluating design direction or architecture decisions
- Plan Mode activated (Shift+Tab x2)
- User says "brainstorm", "let's think about", "explore options", "what should we do"
- Before any significant implementation work
- When requirements are unclear or ambiguous

---

## Purpose

This skill enforces disciplined thinking BEFORE any code is written. It provides structured frameworks for exploring problems, generating options, evaluating trade-offs, and reaching decisions. Every brainstorming session produces a documented output that feeds directly into Plan Mode execution.

**Core Principle:** Never write code without first understanding WHY, for WHOM, and WHAT SUCCESS looks like.

---

## 1. Brainstorming Framework: The 6-Step Process

Every brainstorming session follows this sequence:

```
STEP 1 — PROBLEM STATEMENT
├── What problem are we solving?
├── Why does this problem matter?
├── Who experiences this problem?
├── What happens if we don't solve it?
├── What does success look like? (measurable outcome)
└── Output: 2-3 sentence problem statement

STEP 2 — USERS & CONTEXT
├── Who are the primary users of this feature/page?
├── What are they trying to accomplish?
├── What is their current workflow (before this feature)?
├── What frustrations do they have with the current state?
├── What devices/contexts will they use this in?
├── What is their technical sophistication level?
└── Output: User profile + context map

STEP 3 — REQUIREMENTS
├── Functional requirements (what it MUST do)
├── Non-functional requirements (performance, accessibility, SEO)
├── Content requirements (what content is needed, who provides it)
├── CMS requirements (what should be editable from Payload admin)
├── Design requirements (alignment with design system, moodboard)
├── Integration requirements (APIs, third-party services)
├── Constraints (time, budget, technical limitations)
└── Output: Prioritized requirements list (MoSCoW: Must/Should/Could/Won't)

STEP 4 — CONSTRAINTS & BOUNDARIES
├── Technical constraints (stack: Next.js 15, Payload CMS 3, Tailwind v4)
├── Design constraints (design system tokens, brand guidelines)
├── Performance constraints (Core Web Vitals budgets)
├── Accessibility constraints (WCAG AA minimum)
├── Timeline constraints (which sprint does this belong to?)
├── Content constraints (what content exists vs needs creation)
├── Scope boundary: what is explicitly OUT of scope
└── Output: Constraints document

STEP 5 — OPTIONS GENERATION
├── Generate 3-5 distinct approaches
├── For each option:
│   ├── Brief description (2-3 sentences)
│   ├── Pros (at least 3)
│   ├── Cons (at least 2)
│   ├── Effort estimate (T-shirt: XS/S/M/L/XL)
│   ├── Risk level (Low/Medium/High)
│   └── Dependencies
├── Include at least one "simple" option and one "ambitious" option
├── Consider: build vs buy vs adapt existing
└── Output: Options table

STEP 6 — DECISION
├── Apply decision matrix (see template below)
├── Select recommended option with justification
├── Define acceptance criteria (how we know it's done)
├── Define verification method (how we test it)
├── Identify risks and mitigation strategies
├── Document the decision in docs/decisions/[YYYYMMDD]-[topic].md
└── Output: Decision record (ADR format)
```

---

## 2. Brainstorming Templates by Feature Type

### Template A: New Page

```markdown
## Brainstorm: New Page — [Page Name]

### Problem Statement

Why does this page need to exist? What user need does it serve?
What action should a user take after visiting this page?

### Target Audience

- Primary: [who]
- Secondary: [who]
- User intent: [informational / transactional / navigational]

### Content Inventory

- [ ] Headline / H1 (keyword-optimized)
- [ ] Subheadline / description
- [ ] Primary CTA (what action, where it goes)
- [ ] Secondary CTA (optional)
- [ ] Visual assets needed (images, illustrations, icons, video)
- [ ] Social proof elements (testimonials, logos, stats)
- [ ] FAQ content (if applicable)
- [ ] SEO metadata (title, description, og:image)

### Block Composition (Gutenberg-style)

Which blocks from the block library will compose this page?
Order them top-to-bottom:

1. [Block Name] — variant: [which variant] — purpose: [why this block here]
2. [Block Name] — variant: [which variant] — purpose: [why this block here]
3. ...

### Responsive Considerations

- Mobile: [how does the page adapt?]
- Tablet: [layout changes?]
- Desktop: [full layout description]

### SEO Strategy

- Target keyword: [primary keyword]
- Secondary keywords: [2-3 keywords]
- Internal links to: [related pages]
- Internal links from: [pages that should link here]
- Structured data type: [Organization / Product / Article / FAQ / etc.]

### Performance Budget

- LCP element: [what is the largest contentful paint element?]
- Above-the-fold weight: [target KB]
- Total page weight: [target KB]

### CMS Configuration

- Editable from Payload admin: [yes/no — which fields?]
- Uses page builder blocks: [yes/no]
- Dynamic content: [what comes from collections?]
- Static content: [what is hardcoded?]

### Success Metrics

- Primary KPI: [what metric defines success]
- Secondary KPI: [supporting metric]
- How to measure: [analytics events, tools]
```

### Template B: New Block (Gutenberg-style)

```markdown
## Brainstorm: New Block — [Block Name]

### Purpose

What role does this block serve in the page builder?
When should an editor choose this block?

### Variants

List all visual/functional variants this block should support:

1. [Variant Name] — [description] — [when to use]
2. [Variant Name] — [description] — [when to use]
3. [Variant Name] — [description] — [when to use]

### Content Schema (Payload CMS)

Define every field the editor will see in the admin:
| Field | Type | Required | Description |
|----------------|---------------|----------|--------------------------|
| heading | text | yes | Main heading text |
| subheading | textarea | no | Supporting text |
| ... | ... | ... | ... |

### Visual Design

- References from moodboard: [which reference sites show similar patterns?]
- Design system tokens used: [colors, spacing, typography]
- Animations: [entrance, hover, scroll-triggered]
- Dark mode considerations: [how does it adapt?]

### Responsive Behavior

- Mobile (< 768px): [layout description]
- Tablet (768-1024px): [layout description]
- Desktop (> 1024px): [layout description]

### Edge Cases

- Minimum content: [what if editor provides minimal content?]
- Maximum content: [what if editor provides lots of content?]
- Empty state: [what if optional fields are empty?]
- Long text: [how does overflow behave?]

### Accessibility

- Semantic HTML elements: [which tags?]
- ARIA attributes needed: [list]
- Keyboard navigation: [tab order, focus]
- Screen reader experience: [how is it announced?]

### Performance

- Lazy loadable: [yes/no]
- Images: [how many, optimization strategy]
- Animations: [reduce-motion support?]

### Acceptance Criteria

- [ ] Renders correctly in frontend with all variants
- [ ] All fields editable in Payload admin
- [ ] Preview works in Payload admin
- [ ] Responsive on mobile, tablet, desktop
- [ ] Accessible (WCAG AA)
- [ ] Animations respect prefers-reduced-motion
- [ ] Works with minimum content
- [ ] Works with maximum content
- [ ] TypeScript types generated from schema
```

### Template C: New Feature

```markdown
## Brainstorm: New Feature — [Feature Name]

### Problem Statement

[2-3 sentences: what problem, for whom, why now]

### User Stories

- As a [user type], I want to [action] so that [benefit]
- As a [user type], I want to [action] so that [benefit]
- As a [admin type], I want to [action] so that [benefit]

### Requirements (MoSCoW)

**Must Have:**

- [ ] [requirement]
- [ ] [requirement]

**Should Have:**

- [ ] [requirement]

**Could Have:**

- [ ] [requirement]

**Won't Have (this iteration):**

- [ ] [requirement]

### Technical Approach Options

| Option | Description | Pros | Cons | Effort | Risk |
| ------ | ----------- | ---- | ---- | ------ | ---- |
| A      | ...         | ...  | ...  | S      | Low  |
| B      | ...         | ...  | ...  | M      | Med  |
| C      | ...         | ...  | ...  | L      | High |

### Recommended Option

[Which option and why]

### Implementation Plan

1. [Step 1 — what to build first]
2. [Step 2 — what to build next]
3. [Step 3 — integration and testing]

### Testing Strategy

- Unit tests: [what to test]
- Integration tests: [what to test]
- Visual QA: [screenshots needed]
- Manual testing: [user flows to verify]
```

### Template D: Design Direction

```markdown
## Brainstorm: Design Direction — [Topic]

### Context

What design decision are we making? Why now?

### Current State

What exists today? What are the problems with the current approach?

### References & Inspiration

| Reference | URL | What to take | What to avoid |
| --------- | --- | ------------ | ------------- |
| ...       | ... | ...          | ...           |

### Options

**Direction A: [Name]**

- Visual characteristics: [describe]
- Mood/feeling: [describe]
- Pros: [list]
- Cons: [list]
- Best for: [when this is the right choice]

**Direction B: [Name]**

- Visual characteristics: [describe]
- Mood/feeling: [describe]
- Pros: [list]
- Cons: [list]
- Best for: [when this is the right choice]

**Direction C: [Name]**

- Visual characteristics: [describe]
- Mood/feeling: [describe]
- Pros: [list]
- Cons: [list]
- Best for: [when this is the right choice]

### Recommendation

[Which direction and detailed justification]

### Design Tokens Impact

What design tokens need to change or be created?

- Colors: [changes]
- Typography: [changes]
- Spacing: [changes]
- Other: [changes]
```

---

## 3. Question Checklists by Feature Type

### UI Component Questions

```
VISUAL:
□ What design system tokens does this use? (colors, spacing, typography)
□ How many variants/sizes? (sm, md, lg / primary, secondary, ghost)
□ What states does it have? (default, hover, active, focus, disabled, loading, error)
□ Does it need dark mode support?
□ What are the animation requirements? (entrance, hover, click, exit)
□ Is there a reference from the moodboard or design system?

FUNCTIONALITY:
□ Is it interactive? (button, input, toggle, dropdown)
□ Does it accept children or is it self-contained?
□ What props does it need? (list with types)
□ Does it need to manage internal state?
□ Does it emit events/callbacks? (onClick, onChange, onSubmit)
□ Should it be a Server Component or Client Component?

ACCESSIBILITY:
□ What is the correct semantic HTML element?
□ Does it need ARIA attributes?
□ Is it keyboard navigable? (Tab, Enter, Escape, Arrow keys)
□ What is the focus indicator style?
□ Does it need a visible label or aria-label?
□ How does it behave with screen readers?

COMPOSITION:
□ Where will this component be used? (which pages, blocks, sections)
□ Does it compose other primitives? (shadcn/ui base components)
□ Can it be used standalone or only within a parent?
□ Does it need a compound component pattern?

TECHNICAL:
□ File path: src/components/ui/[name].tsx or src/components/shared/[name].tsx?
□ Export from barrel file?
□ TypeScript interface for props?
□ Default values for optional props?
□ Should it forward refs?
□ Does it need to use cn() for class merging?
```

### CMS Block Questions

```
CONTENT:
□ What content does the editor need to enter?
□ Which fields are required vs optional?
□ What field types? (text, textarea, richText, select, upload, array, group, relationship)
□ Are there sub-fields (groups, arrays of objects)?
□ What are the validation rules for each field?
□ What are sensible default values?
□ What is the admin field label and help text for each field?

VARIANTS:
□ How many visual variants does this block have?
□ How does the editor select the variant? (select field, radio, conditional fields)
□ Do variants change the available fields? (conditional logic in Payload)

PRESENTATION:
□ What is the layout for each variant? (grid, flex, single column)
□ What background options? (none, color, image, gradient)
□ What spacing/padding options? (compact, default, spacious)
□ Does it have configurable alignment? (left, center, right)

ADMIN EXPERIENCE:
□ Is the preview useful in the Payload admin?
□ Are fields grouped logically? (tabs, collapsible groups)
□ Is the field ordering intuitive for editors?
□ Are there helpful descriptions/placeholders?

DATA:
□ Does this block reference other collections? (relationships)
□ Does it need to fetch data at render time? (Server Component)
□ Is the content static or dynamic?
```

### Page Layout Questions

```
STRUCTURE:
□ What blocks compose this page? (ordered list)
□ Is this a static page or CMS-driven (page builder)?
□ Does it use the default layout (header + footer) or a custom layout?
□ What is the URL pattern? (static path vs dynamic [slug])

CONTENT:
□ Who provides the content? (editor via CMS, developer, API)
□ What content exists today vs needs to be created?
□ Are there dynamic content sections? (blog posts, case studies, testimonials)
□ What is the content update frequency?

SEO:
□ What is the target keyword for this page?
□ What structured data type? (WebPage, Product, Article, FAQ, Organization)
□ Does it need a custom og:image?
□ What pages should link to/from this page?

CONVERSION:
□ What is the primary CTA on this page?
□ What conversion action should the user take?
□ What analytics events should fire?
□ What is the expected conversion rate?

PERFORMANCE:
□ What is the LCP element?
□ Are there heavy assets (images, videos) above the fold?
□ Should any sections be lazy-loaded?
□ Is this page SSG, SSR, or ISR?
```

### API Integration Questions

```
□ What is the external service/API?
□ What data do we send? What data do we receive?
□ What is the authentication method? (API key, OAuth, JWT)
□ Where is the secret stored? (.env.local)
□ What happens if the API is down? (fallback, error handling)
□ What is the rate limit?
□ Should we cache responses? (duration, invalidation strategy)
□ Is this called server-side (API route, Server Component) or client-side?
□ What Zod schema validates the response?
□ Do we need a webhook endpoint?
```

### Form Questions

```
□ What fields does the form have? (name, type, required, validation rules)
□ What is the Zod schema for validation?
□ Where is the form displayed? (page, modal, sidebar, inline)
□ What happens on successful submission? (redirect, toast, thank you page)
□ What happens on error? (inline errors, toast, retry)
□ Where is the submission stored? (Payload collection, external CRM, email)
□ What notifications are sent? (email to user, email to team, Slack webhook)
□ What analytics events fire? (form_started, form_completed, form_abandoned)
□ Does it need multi-step/wizard flow?
□ Is there spam protection? (honeypot, rate limiting, reCAPTCHA)
□ Is it a Server Action or API route submission?
```

---

## 4. Integration with Plan Mode

### How Brainstorming Feeds into Planning

```
BRAINSTORMING                         PLAN MODE
─────────────────────────────────────────────────────────
Problem Statement          →    Task description
Users & Context            →    Acceptance criteria
Requirements (MoSCoW)      →    Scope definition
Constraints                →    Technical boundaries
Options + Decision         →    Implementation approach
Acceptance Criteria        →    Definition of Done

SEQUENCE:
1. User requests a feature/page/block
2. Claude activates BRAINSTORMING skill
3. Walk through 6-step framework with user
4. Document decisions in docs/decisions/
5. Claude enters PLAN MODE (Shift+Tab x2)
6. Plan is built FROM brainstorming outputs
7. User approves plan
8. Claude executes in auto-accept mode
```

### Brainstorming Output Format

Every brainstorming session produces this output document:

```markdown
# Brainstorm Output: [Topic]

**Date:** [YYYY-MM-DD]
**Participants:** Ruben + Claude
**Status:** [Draft / Approved]

## Problem Statement

[2-3 sentences]

## Decision

[Selected approach with justification]

## Key Requirements

1. [Must have]
2. [Must have]
3. [Should have]

## Constraints

- [constraint 1]
- [constraint 2]

## Acceptance Criteria

- [ ] [criterion 1]
- [ ] [criterion 2]
- [ ] [criterion 3]

## Next Steps

1. [First implementation step]
2. [Second implementation step]

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| ...  | ...        | ...    | ...        |
```

---

## 5. Creative Thinking Techniques (Adapted for Code)

### SCAMPER for Features

```
S — SUBSTITUTE:  What component/library/pattern could replace the current approach?
C — COMBINE:     Can we merge two blocks/features into one more useful one?
A — ADAPT:       What existing pattern from another site can we adapt?
M — MODIFY:      What if we changed the size, shape, order, or emphasis?
P — PUT TO OTHER USE: Can this component serve a different purpose elsewhere?
E — ELIMINATE:   What can we remove without losing value?
R — REVERSE:     What if the user flow went in the opposite direction?

Usage: When stuck on a design decision, run each letter as a prompt.
```

### How Might We (HMW)

```
Convert problems into opportunities:

Problem: "Users don't understand our pricing"
→ HMW make pricing self-explanatory at a glance?
→ HMW help users find the right plan in under 10 seconds?
→ HMW reduce pricing page bounce rate by 30%?
→ HMW use social proof to make pricing feel justified?

Format: "How might we [desired outcome] for [user] when [context]?"

Apply to any challenge:
- HMW make the hero section convert visitors to demo requests?
- HMW present case studies so prospects see themselves in the stories?
- HMW make the admin experience so intuitive editors never need training?
```

### Crazy 8s (Rapid Ideation)

```
Generate 8 different approaches in 8 minutes:

For a BLOCK: sketch 8 different layout/visual treatments
For a PAGE: sketch 8 different content arrangements
For a FEATURE: list 8 different implementation approaches
For a CTA: write 8 different headline + button combinations

Rules:
- No filtering during generation (quantity over quality)
- Each must be meaningfully different (not just color swaps)
- Time-boxed: force speed over perfection
- Evaluate AFTER generating all 8

Output: Numbered list of 8 ideas, then star the top 2-3.
```

### Design Sprint Methods

```
DAY 1 — MAP:     Map the user journey for this feature
DAY 2 — SKETCH:  Generate multiple solutions (Crazy 8s)
DAY 3 — DECIDE:  Vote on best solution, create storyboard
DAY 4 — BUILD:   Prototype (in this case, implement)
DAY 5 — TEST:    Verify with screenshots, Playwright, user feedback

Compressed version for Claude Code (same session):
1. MAP (5 min):    Understand the user flow and problem
2. SKETCH (5 min): Generate 3+ approaches
3. DECIDE (3 min): Select approach with Ruben
4. BUILD:          Implement in Plan Mode
5. TEST:           Verify with screenshots and Playwright
```

---

## 6. Decision Matrix Template

Use this to evaluate options systematically:

```markdown
## Decision Matrix: [Topic]

### Criteria (weighted)

| Criterion             | Weight | Description                                |
| --------------------- | ------ | ------------------------------------------ |
| User Impact           | 5      | How much does this improve user experience |
| Implementation Effort | 4      | How much work to build                     |
| Maintainability       | 3      | How easy to maintain long-term             |
| Performance Impact    | 4      | Effect on Core Web Vitals                  |
| Design Consistency    | 3      | Alignment with design system               |
| CMS Editability       | 3      | How easily can editors manage this         |
| Accessibility         | 4      | WCAG AA compliance ease                    |
| SEO Impact            | 2      | Effect on search rankings                  |

### Scoring (1-5 scale, 5 = best)

| Option   | User | Effort | Maintain | Perf | Design | CMS | A11y | SEO | TOTAL |
| -------- | ---- | ------ | -------- | ---- | ------ | --- | ---- | --- | ----- |
| Option A | ?    | ?      | ?        | ?    | ?      | ?   | ?    | ?   | ?     |
| Option B | ?    | ?      | ?        | ?    | ?      | ?   | ?    | ?   | ?     |
| Option C | ?    | ?      | ?        | ?    | ?      | ?   | ?    | ?   | ?     |

### Weighted Score Calculation

Total = (User _ 5) + (Effort _ 4) + (Maintain _ 3) + (Perf _ 4) + (Design _ 3) + (CMS _ 3) + (A11y _ 4) + (SEO _ 2)

### Winner: [Option X]

**Justification:** [Why this option wins beyond just the score]
```

---

## 7. When to Trigger Brainstorming

### Always Brainstorm When:

```
MANDATORY TRIGGERS:
✅ Starting a brand new page
✅ Creating a new CMS block (Gutenberg-style)
✅ Adding a significant new feature
✅ Making a design direction decision
✅ Choosing between multiple technical approaches
✅ Planning a sprint or major milestone
✅ When requirements are ambiguous or unclear
✅ When Ruben says "I'm not sure" or "what do you think"
✅ Before creating a new Payload CMS collection or global
✅ Before adding a third-party integration

SKIP BRAINSTORMING WHEN:
⏭️ Bug fix with obvious cause and solution
⏭️ Minor styling adjustment (padding, color tweak)
⏭️ Adding content to existing CMS structure
⏭️ Updating dependencies
⏭️ Following an already-approved plan
```

### Quick Brainstorm (5-minute version)

For smaller decisions that don't need the full framework:

```
1. WHAT: [one sentence describing what we're deciding]
2. OPTIONS: [2-3 options, one line each]
3. PICK: [selected option + one sentence why]
4. DO: [next action]
```

---

## 8. ADR (Architecture Decision Record) Format

Save decisions to `docs/decisions/[YYYYMMDD]-[topic].md`:

```markdown
# ADR: [Title]

**Date:** [YYYY-MM-DD]
**Status:** [Proposed / Accepted / Deprecated / Superseded]
**Deciders:** Ruben, Claude

## Context

[What is the situation that motivates this decision?]

## Decision

[What is the change we are making?]

## Consequences

### Positive

- [benefit 1]
- [benefit 2]

### Negative

- [trade-off 1]
- [trade-off 2]

### Neutral

- [observation]

## Alternatives Considered

1. [Alternative A] — rejected because [reason]
2. [Alternative B] — rejected because [reason]

## References

- [link to relevant docs, issues, or discussions]
```

---

## 9. Brainstorming Session Checklist

Before closing a brainstorming session, verify:

```
□ Problem statement is clear and specific (not vague)
□ Target users are identified (not "everyone")
□ Requirements are prioritized (MoSCoW)
□ At least 3 options were considered
□ Decision is documented with justification
□ Acceptance criteria are measurable (not subjective)
□ Constraints are acknowledged
□ Risks are identified with mitigations
□ Next steps are concrete and actionable
□ Decision record saved to docs/decisions/ (if significant)
□ Ruben has approved (or knows the decision is pending)
```
