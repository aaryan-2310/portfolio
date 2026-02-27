# UX Improvements (User/Viewer Perspective) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix seven UX issues that real visitors encounter when browsing the portfolio — broken links, wrong mobile layout, invisible navigation indicators, and annoyingly infinite animations.

**Architecture:** Pure HTML/SCSS changes in existing standalone Angular components. No new components, services, or dependencies needed. Each task is self-contained to one or two files.

**Tech Stack:** Angular 19 standalone components, SCSS with CSS custom properties, Angular Router

---

## How to Verify Each Task

After every change, run:
```bash
yarn lint
```
Expected: zero errors. If lint errors appear, fix them before committing.

For HTML changes, also run:
```bash
yarn build 2>&1 | tail -20
```
Expected: `Build at: ... - Hash: ...` with no errors.

---

### Task 1: Fix Footer Broken Links

**Why it matters from the user's perspective:** Clicking "Articles" or "Support" in the footer takes the visitor to the 404 Not Found page. Clicking "Privacy Policy", "Terms of Service", or "Cookies Settings" silently scrolls the page to the top (`href="#"`). Both break trust.

**Files:**
- Modify: `src/app/shared/components/footer/footer.component.html:57-77`

**Current broken state (lines 57–77):**
```html
<div>
  <h4>Resources</h4>
  <a routerLink="/blogs">Blog</a>
  <a routerLink="/articles">Articles</a>   <!-- route does not exist → 404 -->
  <a routerLink="/support">Support</a>     <!-- route does not exist → 404 -->
</div>
...
<div class="legal-links">
  <a href="#">Privacy Policy</a>           <!-- href="#" scrolls to top -->
  <a href="#">Terms of Service</a>         <!-- href="#" scrolls to top -->
  <a href="#">Cookies Settings</a>         <!-- href="#" scrolls to top -->
</div>
```

**Step 1: Remove the two non-existent route links**

In the "Resources" `<div>` (lines 56–61), remove the two broken `<a>` tags:
```html
<div>
  <h4>Resources</h4>
  <a routerLink="/blogs">Blog</a>
</div>
```

**Step 2: Remove the broken legal links section**

Replace the `<div class="legal-links">` block (lines 73–77) with just the copyright paragraph — no legal links until real pages exist:
```html
<div class="footer-bottom">
  <p>© {{ year }} Aryan Mishra. All rights reserved</p>
</div>
```

**Step 3: Verify lint passes**
```bash
yarn lint
```
Expected: zero errors.

**Step 4: Commit**
```bash
git add src/app/shared/components/footer/footer.component.html
git commit -m "fix: remove broken footer links and placeholder legal links"
```

---

### Task 2: Fix Contact Form Mobile Order

**Why it matters from the user's perspective:** On mobile, the sidebar (location, response time, social links) appears _above_ the contact form. Visitors arrive at `/contact` wanting to send a message but are shown info cards first. The form — the primary action — is buried below.

**Files:**
- Modify: `src/app/pages/contact/contact.component.scss:218-221` and `277-279`

**Current broken state:**
```scss
// Line 218–220
.contact-form-wrapper {
  order: 2;   // ← form is SECOND on mobile
}

// Line 277–279
.contact-sidebar {
  order: 1;   // ← sidebar is FIRST on mobile
}
```

**Step 1: Swap the order values**

Change `.contact-form-wrapper`:
```scss
.contact-form-wrapper {
  order: 1;
}
```

Change `.contact-sidebar`:
```scss
.contact-sidebar {
  order: 2;
}
```

**Step 2: Verify lint and build**
```bash
yarn lint && yarn build 2>&1 | tail -5
```
Expected: zero errors and successful build.

**Step 3: Commit**
```bash
git add src/app/pages/contact/contact.component.scss
git commit -m "fix: show contact form before sidebar on mobile"
```

---

### Task 3: Fix Nav Active Indicator

**Why it matters from the user's perspective:** The main navigation has no clear visual indicator of which page is active. The active state uses `height: 1px; background: var(--theme-on-surface)` — a one-pixel gray line that's nearly invisible. Visitors can't orient themselves in the site. The contextual sub-nav (for detail pages) already has the correct style (`height: 2px; background: var(--theme-accent)`) — the main nav needs to match.

**Files:**
- Modify: `src/app/layout/layout.component.scss:110-111`

**Current broken state (lines 100–113):**
```scss
&.active {
  color: var(--theme-on-surface);
  font-weight: 600;

  &::after {
    content: '';
    position: absolute;
    bottom: 0px;
    left: 12px;
    right: 12px;
    height: 1px;                          // ← too thin, invisible
    background: var(--theme-on-surface);  // ← gray, not accent color
  }
}
```

**Step 1: Update the active indicator to match context-nav style**

Change `height: 1px` to `height: 2px` and `background: var(--theme-on-surface)` to `background: var(--theme-accent)`:
```scss
&.active {
  color: var(--theme-on-surface);
  font-weight: 600;

  &::after {
    content: '';
    position: absolute;
    bottom: 0px;
    left: 12px;
    right: 12px;
    height: 2px;
    background: var(--theme-accent);
  }
}
```

**Step 2: Verify lint**
```bash
yarn lint
```
Expected: zero errors.

**Step 3: Commit**
```bash
git add src/app/layout/layout.component.scss
git commit -m "fix: increase nav active indicator visibility using accent color"
```

---

### Task 4: Limit Infinite Scroll-Hint Bounce Animations

**Why it matters from the user's perspective:** Both the Projects page and the Contact page have a "scroll down" chevron icon that bounces continuously (`animation: bounce 2s infinite`). Once the user scrolls past the hero, the hint has served its purpose — but it keeps bouncing forever, wasting GPU and distracting peripheral vision. Limit it to 3 loops so it catches the eye then stops.

**Files:**
- Modify: `src/app/pages/projects/projects.component.scss:116`
- Modify: `src/app/pages/contact/contact.component.scss:153`

**Current broken state:**
```scss
// projects.component.scss:116
animation: bounce 2s infinite;

// contact.component.scss:153
animation: bounce 2s infinite;
```

**Step 1: Change both to finite iterations**

In `projects.component.scss` line 116:
```scss
animation: bounce 2s ease-in-out 3;
```

In `contact.component.scss` line 153:
```scss
animation: bounce 2s ease-in-out 3;
```

`3` at the end means 3 iterations. The scroll hint bounces three times to draw attention, then stops.

**Step 2: Verify lint**
```bash
yarn lint
```
Expected: zero errors.

**Step 3: Commit**
```bash
git add src/app/pages/projects/projects.component.scss src/app/pages/contact/contact.component.scss
git commit -m "fix: limit scroll-hint bounce to 3 iterations instead of infinite"
```

---

### Task 5: Fix Blog Category Badge for Theme-Awareness

**Why it matters from the user's perspective:** The category badge overlaid on blog card images uses `background: rgba(0, 0, 0, 0.6)` — a hardcoded black. In dark theme this creates a near-invisible dark badge on dark card images. In light theme it looks jarring and out of character with the rest of the design system. The badge should blend with the theme.

**Files:**
- Modify: `src/app/pages/blogs/blogs.component.scss:133-146`

**Current broken state (lines 133–146):**
```scss
.blog-card__category {
  position: absolute;
  top: var(--space-12);
  left: var(--space-12);
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.6);     // ← hardcoded black
  backdrop-filter: blur(8px);
  color: white;                        // ← hardcoded white
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
```

**Step 1: Replace hardcoded colors with theme-aware values**

```scss
.blog-card__category {
  position: absolute;
  top: var(--space-12);
  left: var(--space-12);
  padding: 4px 10px;
  background: color-mix(in oklab, var(--theme-surface) 75%, transparent);
  backdrop-filter: blur(8px);
  color: var(--theme-on-surface);
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border: 1px solid color-mix(in oklab, var(--theme-border) 60%, transparent);
}
```

`color-mix(in oklab, var(--theme-surface) 75%, transparent)` creates a frosted glass pill that works in both light and dark themes. The border adds subtle definition.

**Step 2: Verify lint**
```bash
yarn lint
```
Expected: zero errors.

**Step 3: Commit**
```bash
git add src/app/pages/blogs/blogs.component.scss
git commit -m "fix: make blog category badge theme-aware instead of hardcoded black"
```

---

### Task 6: Add Touch :active State to Service Cards

**Why it matters from the user's perspective:** On mobile (touch), CSS `:hover` doesn't trigger on tap. Service cards on the home page have rich hover effects (lift, accent border, icon color change) but zero touch feedback. Tapping a service card on mobile feels unresponsive — there's no tactile acknowledgement that the touch registered.

**Files:**
- Modify: `src/app/pages/home/home.component.scss` — around line 330 (after `.service-card:hover`)

**Current state (lines 330–338):**
```scss
.service-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--elev-2);
  border-color: color-mix(in oklab, var(--theme-accent) 50%, var(--theme-border));
}

.service-card:hover .service-icon-wrapper {
  background: var(--theme-accent);
}
```

**Step 1: Add :active styles immediately after the :hover block**

Add after line 338 (after the `.service-card:hover .service-icon` block at ~line 341):
```scss
.service-card:active {
  transform: translateY(-2px);
  box-shadow: var(--elev-1);
  border-color: color-mix(in oklab, var(--theme-accent) 50%, var(--theme-border));
}

.service-card:active .service-icon-wrapper {
  background: color-mix(in oklab, var(--theme-accent) 60%, transparent);
}
```

The `:active` state is a softer version of `:hover` — slight lift without full elevation — giving clear feedback without feeling like a mis-tap.

**Step 2: Verify lint**
```bash
yarn lint
```
Expected: zero errors.

**Step 3: Commit**
```bash
git add src/app/pages/home/home.component.scss
git commit -m "fix: add touch :active state to service cards for mobile feedback"
```

---

### Task 7: Fix prefers-reduced-motion for Hero Eyebrow and Trust Section

**Why it matters from the user's perspective:** Users who enable "reduce motion" in their OS do so because animations cause them discomfort or are a medical necessity. On the home page, `.hero-eyebrow` and `.hero-trust` have `opacity: 0` with an entrance animation. The `@media (prefers-reduced-motion: reduce)` block handles `.hero-title`, `.hero-sub`, and `.hero-buttons` — but NOT `.hero-eyebrow` or `.hero-trust`. When a user enables reduced motion, the eyebrow badge and trust stats remain invisible. Content disappears for users who need accessibility support.

**Files:**
- Modify: `src/app/pages/home/home.component.scss:216-230`

**Current broken state (lines 216–230):**
```scss
@media (prefers-reduced-motion: reduce) {
  .hero-title,
  .hero-sub,
  .hero-buttons {
    opacity: 1;
    transform: none;
    animation: none;
  }

  .hero-surface::before,
  .hero-surface::after {
    animation: none;
  }
}
```

**Step 1: Add .hero-eyebrow and .hero-trust to the reduced-motion block**

Update the selector list to include both missing elements:
```scss
@media (prefers-reduced-motion: reduce) {
  .hero-eyebrow,
  .hero-title,
  .hero-sub,
  .hero-buttons,
  .hero-trust {
    opacity: 1;
    transform: none;
    animation: none;
  }

  .hero-surface::before,
  .hero-surface::after {
    animation: none;
  }
}
```

**Step 2: Verify lint**
```bash
yarn lint
```
Expected: zero errors.

**Step 3: Commit**
```bash
git add src/app/pages/home/home.component.scss
git commit -m "fix: add hero-eyebrow and hero-trust to prefers-reduced-motion block"
```

---

## Summary of Changes

| # | File | Issue | Priority |
|---|------|-------|----------|
| 1 | `footer.component.html` | Broken `/articles`, `/support` routes + `href="#"` legal links | Critical |
| 2 | `contact.component.scss` | Form `order: 2` / sidebar `order: 1` on mobile | Critical |
| 3 | `layout.component.scss` | Active nav indicator: 1px gray → 2px accent | High |
| 4 | `projects.component.scss`, `contact.component.scss` | Scroll hint `bounce 2s infinite` → 3 iterations | High |
| 5 | `blogs.component.scss` | Category badge `rgba(0,0,0,0.6)` → theme-aware | High |
| 6 | `home.component.scss` | Service cards missing `:active` for touch | Medium |
| 7 | `home.component.scss` | Missing `.hero-eyebrow`, `.hero-trust` in reduced-motion | Medium |
