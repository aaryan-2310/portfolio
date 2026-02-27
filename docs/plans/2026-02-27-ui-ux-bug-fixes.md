# UI/UX Bug Fixes & Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all identified bugs, memory leaks, accessibility issues, and UX gaps found in the portfolio UI audit.

**Architecture:** Fixes are isolated to individual component files. No new components are added — all changes are in-place edits. Tasks proceed from most critical (rendering bugs, memory leaks, security) to lower-priority (a11y, UX polish, performance).

**Tech Stack:** Angular 19 standalone components, RxJS (`takeUntilDestroyed`, `DestroyRef`), `marked`, TypeScript strict mode, SCSS

---

## Task 1: Fix duplicate `*ngFor` in Blogs (Critical rendering bug)

**Files:**
- Modify: `src/app/pages/blogs/blogs.component.html:34-66`

**What's wrong:** Lines 35–36 have a nested `*ngFor` — `ng-container` iterates `filteredBlogs$ | async`, then `portfolio-card` inside it iterates the **same observable again**. This subscribes twice and renders n² cards.

**Step 1: Open the file and verify the bug**

The inner section currently looks like this:
```html
<ng-container *ngFor="let post of filteredBlogs$ | async; trackBy: trackByPost">
  <portfolio-card *ngFor="let post of filteredBlogs$ | async; trackBy: trackByPost" ...>
```

**Step 2: Remove the outer `ng-container` wrapper loop**

Replace lines 34–67 with:
```html
<div class="blogs__grid" *ngIf="!isLoading">
  <portfolio-card *ngFor="let post of filteredBlogs$ | async; trackBy: trackByPost"
    [title]="post.title" [description]="post.excerpt" [image]="post.coverImage"
    [routerLink]="['/blogs', post.slug]">

    <!-- Category Pill -->
    <span card-media-extra class="blog-card__category" *ngIf="post.tags.length > 0">{{ post.tags[0] }}</span>

    <!-- Footer (Meta + Tags + Action) -->
    <div card-footer>
      <div class="blog-card__meta">
        <span class="meta-item">{{ formatDate(post.publishedAt) }}</span>
        <span class="meta-dot">·</span>
        <span class="meta-item">{{ post.readTime }} min read</span>
      </div>
      <div class="blog-card__footer">
        <div class="blog-card__tags">
          <span *ngFor="let tag of post.tags.slice(0, 2); trackBy: trackByTag" class="tag-pill">{{ tag }}</span>
          <span *ngIf="post.tags.length > 2" class="tag-pill more">+{{ post.tags.length - 2 }}</span>
        </div>
        <span class="read-action">
          Read
          <span class="material-icons">arrow_forward</span>
        </span>
      </div>
    </div>
  </portfolio-card>
</div>
```

**Step 3: Run the dev server and verify blogs page renders correctly**

```bash
yarn start
```

Navigate to `/blogs`. Confirm each post renders exactly once. Previously each post rendered N times (where N = total post count).

**Step 4: Commit**

```bash
git add src/app/pages/blogs/blogs.component.html
git commit -m "fix: remove duplicate ngFor in blogs grid causing n² rendering"
```

---

## Task 2: Fix memory leaks — add `takeUntilDestroyed` to `blog-detail`

**Files:**
- Modify: `src/app/pages/blog-detail/blog-detail.component.ts`

**What's wrong:** `ngOnInit` subscribes to `this.route.paramMap.pipe(switchMap(...))` with no cleanup. If the user navigates away while a request is in-flight, the subscription persists.

**Step 1: Inject `DestroyRef` in the constructor**

The current constructor is:
```typescript
constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blogService: BlogService,
    private sanitizer: DomSanitizer
) { }
```

Add `DestroyRef` import and injection:
```typescript
import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
```

Add `private destroyRef = inject(DestroyRef);` as a class property (before constructor):
```typescript
private destroyRef = inject(DestroyRef);
```

**Step 2: Add `takeUntilDestroyed` to the ngOnInit subscription**

Change `ngOnInit` from:
```typescript
ngOnInit(): void {
    this.route.paramMap.pipe(
        switchMap(params => {
```

To:
```typescript
ngOnInit(): void {
    this.route.paramMap.pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(params => {
```

**Step 3: Verify the file compiles**

```bash
yarn build --configuration development 2>&1 | head -30
```

Expected: No TypeScript errors.

**Step 4: Commit**

```bash
git add src/app/pages/blog-detail/blog-detail.component.ts
git commit -m "fix: add takeUntilDestroyed to blog-detail to prevent memory leak"
```

---

## Task 3: Fix memory leak — `project-detail` title subscription

**Files:**
- Modify: `src/app/pages/project-detail/project-detail.component.ts`

**What's wrong:** Lines 42–46 subscribe to `this.project$` with no cleanup:
```typescript
this.project$.subscribe(project => {
    if (project) {
        this.titleService.setTitle(`${project.title} | Aryan Mishra`);
    }
});
```

**Step 1: Inject `DestroyRef`**

Add import at top:
```typescript
import { Component, OnInit, HostListener, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
```

Add as class property:
```typescript
private destroyRef = inject(DestroyRef);
```

**Step 2: Pipe `takeUntilDestroyed` onto the title subscription**

Change:
```typescript
this.project$.subscribe(project => {
    if (project) {
        this.titleService.setTitle(`${project.title} | Aryan Mishra`);
    }
});
```

To:
```typescript
this.project$.pipe(
    takeUntilDestroyed(this.destroyRef)
).subscribe(project => {
    if (project) {
        this.titleService.setTitle(`${project.title} | Aryan Mishra`);
    }
});
```

**Step 3: Verify compile**

```bash
yarn build --configuration development 2>&1 | head -30
```

**Step 4: Commit**

```bash
git add src/app/pages/project-detail/project-detail.component.ts
git commit -m "fix: add takeUntilDestroyed to project-detail title subscription"
```

---

## Task 4: Fix XSS risk — sanitize markdown output in `blog-detail`

**Files:**
- Modify: `src/app/pages/blog-detail/blog-detail.component.ts`

**What's wrong:** Line 57 calls `bypassSecurityTrustHtml()` on raw `marked()` output. If the CMS is ever compromised or injects `<script>` tags, it executes in the user's browser.

**Step 1: Install DOMPurify**

```bash
yarn add dompurify
yarn add -D @types/dompurify
```

**Step 2: Import DOMPurify in the component**

Add at top of file:
```typescript
import DOMPurify from 'dompurify';
```

**Step 3: Replace `bypassSecurityTrustHtml` with sanitized output**

Change:
```typescript
if (post.content) {
    const html = marked(post.content) as string;
    this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(html);
}
```

To:
```typescript
if (post.content) {
    const rawHtml = marked(post.content) as string;
    const cleanHtml = DOMPurify.sanitize(rawHtml);
    this.renderedContent = this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
}
```

Note: We still use `bypassSecurityTrustHtml` after DOMPurify because Angular's built-in sanitizer strips safe but valid HTML like `<pre>`, `<code>`, `<table>`. DOMPurify is purpose-built for this — it allows safe HTML and removes only dangerous content.

**Step 4: Verify compile and blog detail renders correctly**

```bash
yarn build --configuration development 2>&1 | head -30
```

Navigate to `/blogs/:slug` in dev server. Verify code blocks, lists, and headings still render.

**Step 5: Commit**

```bash
git add src/app/pages/blog-detail/blog-detail.component.ts
git commit -m "fix: sanitize markdown HTML with DOMPurify before rendering in blog-detail"
```

---

## Task 5: Add error handling + remove debug log in `blogs.component.ts`

**Files:**
- Modify: `src/app/pages/blogs/blogs.component.ts`

**What's wrong:**
1. `blogService.getAll()` at line 56 has no `catchError` — if the API fails, the observable errors silently and `isLoading` stays `true` forever.
2. Line 80 has a `console.log` debug statement left in production code.

**Step 1: Add `catchError` to the blogs fetch**

Add `catchError, of` to the rxjs import:
```typescript
import { Observable, BehaviorSubject, combineLatest, map, tap, catchError, of } from 'rxjs';
```

Change the fetch block from:
```typescript
this.blogService.getAll().pipe(
    map(posts => posts.map(p => BlogService.toView(p)))
).subscribe(views => {
    this.blogsSource$.next(views);
    this.allTags = [...new Set(views.flatMap(v => v.tags))].sort();
    this.isLoading = false;
});
```

To:
```typescript
this.blogService.getAll().pipe(
    map(posts => posts.map(p => BlogService.toView(p))),
    catchError(err => {
        console.error('BlogsComponent: Failed to load blogs', err);
        return of([]);
    })
).subscribe(views => {
    this.blogsSource$.next(views);
    this.allTags = [...new Set(views.flatMap(v => v.tags))].sort();
    this.isLoading = false;
});
```

**Step 2: Remove the debug `console.log` at line 80**

Remove this from the `tap` block:
```typescript
tap(results => {
    console.log(`Filtered blogs: ${results.length} results for tag="${this.selectedTag}" and query="${this.searchQuery$.value}"`);
    // TODO: Haptic/Shake on "No Results" ...
})
```

Since the `tap` now has no body, remove the entire `.pipe(tap(...))` call or the tap operator entirely:
```typescript
// Remove the tap entirely from filteredBlogs$ pipeline
this.filteredBlogs$ = combineLatest([
    this.blogsSource$,
    this.selectedTag$,
    this.searchQuery$
]).pipe(
    map(([blogs, tag, query]) => {
        return blogs.filter(post => {
            const matchesTag = tag === null || post.tags.includes(tag);
            const matchesSearch = query === '' ||
                post.title.toLowerCase().includes(query.toLowerCase()) ||
                post.excerpt.toLowerCase().includes(query.toLowerCase());
            return matchesTag && matchesSearch;
        });
    })
);
```

**Step 3: Verify compile**

```bash
yarn build --configuration development 2>&1 | head -30
```

**Step 4: Commit**

```bash
git add src/app/pages/blogs/blogs.component.ts
git commit -m "fix: add catchError to blogs fetch and remove debug console.log"
```

---

## Task 6: Fix `toolbar-search` — clear debounce timer on destroy

**Files:**
- Modify: `src/app/shared/components/toolbar-search/toolbar-search.component.ts`

**What's wrong:** `ngOnDestroy` at line 54 only disconnects the `IntersectionObserver`. The `debounceTimer` from line 77 is never cleared, leaving a dangling 500ms timeout after the component unmounts.

**Step 1: Add `clearTimeout` to `ngOnDestroy`**

Change:
```typescript
ngOnDestroy() {
    this.observer?.disconnect();
}
```

To:
```typescript
ngOnDestroy() {
    this.observer?.disconnect();
    clearTimeout(this.debounceTimer);
}
```

**Step 2: Commit**

```bash
git add src/app/shared/components/toolbar-search/toolbar-search.component.ts
git commit -m "fix: clear debounce timer in toolbar-search ngOnDestroy"
```

---

## Task 7: Fix `any` type on router event in `layout.component.ts`

**Files:**
- Modify: `src/app/layout/layout.component.ts:86`

**What's wrong:** The `filter(event => event instanceof NavigationEnd)` pipe guarantees the event is `NavigationEnd`, but the subscribe callback still types it as `any`.

**Step 1: Fix the type**

Change:
```typescript
).subscribe((event: any) => {
    this.isProjectDetailPage = event.url.includes('/projects/') && !event.url.endsWith('/projects');
```

To:
```typescript
).subscribe((event: NavigationEnd) => {
    this.isProjectDetailPage = event.url.includes('/projects/') && !event.url.endsWith('/projects');
```

`NavigationEnd` is already imported at line 7.

**Step 2: Commit**

```bash
git add src/app/layout/layout.component.ts
git commit -m "fix: use NavigationEnd type instead of any in layout router subscription"
```

---

## Task 8: Add loading skeletons to the Projects grid

**Files:**
- Modify: `src/app/pages/projects/projects.component.html`

**What's wrong:** `isLoading` is tracked in TS but the template at line 62 always renders the grid container regardless of loading state. The `#loading` template at line 126 is defined but never referenced. Users see a blank grid while data loads.

**Step 1: Add loading skeleton section to the projects grid**

Replace the projects section (lines 61–122) opening to add a loading state. Add this block **above** the `<div class="projects__grid">`:

```html
<!-- Loading Skeletons -->
<div class="projects__grid" *ngIf="isLoading">
  <portfolio-skeleton *ngFor="let i of [1,2,3,4,5,6]" variant="card" height="320px"></portfolio-skeleton>
</div>
```

And wrap the existing grid with `*ngIf="!isLoading"`:
```html
<div class="projects__grid" *ngIf="!isLoading">
  <portfolio-card *ngFor="let p of data.projects; ...">
```

Also remove the now-unused `#loading` template at lines 126–128.

**Step 2: Verify the loading state appears briefly on slow networks**

In Chrome DevTools → Network tab → throttle to "Slow 4G". Navigate to `/projects`. Confirm skeleton cards are shown before real data loads.

**Step 3: Commit**

```bash
git add src/app/pages/projects/projects.component.html
git commit -m "feat: add loading skeleton state to projects grid"
```

---

## Task 9: Fix `prefers-reduced-motion` transform in `projects.component.scss`

**Files:**
- Modify: `src/app/pages/projects/projects.component.scss`

**What's wrong:** The `@media (prefers-reduced-motion: reduce)` block still applies `transform: translateX(-50%)` to `.hero-badge`, which contradicts the intent of no-motion mode.

**Step 1: Find the reduced-motion block**

Search for `prefers-reduced-motion` in the file and locate the block containing:
```scss
transform: translateX(-50%);
```

**Step 2: Replace the offending transform with `none`**

Change any `transform: translateX(-50%)` (or similar) inside the `@media (prefers-reduced-motion: reduce)` block to:
```scss
transform: none;
```

**Step 3: Commit**

```bash
git add src/app/pages/projects/projects.component.scss
git commit -m "fix: correct prefers-reduced-motion transform in projects hero"
```

---

## Task 10: Add `aria-label` and `aria-pressed` to filter chip buttons

**Files:**
- Modify: `src/app/pages/blogs/blogs.component.html:19-25`
- Modify: `src/app/pages/projects/projects.component.html:51-57`

**What's wrong:** Filter buttons have no `aria-label` and no `aria-pressed` state. Screen readers can't tell which filter is active or what each button does.

**Step 1: Update Blogs filter bar**

Change:
```html
<button class="filter-chip" [class.active]="selectedTag === null" (click)="onTagChange(null)">
  All
</button>
<button class="filter-chip" *ngFor="let tag of allTags" [class.active]="selectedTag === tag"
  (click)="onTagChange(tag)">
  {{ tag }}
</button>
```

To:
```html
<button class="filter-chip"
  [class.active]="selectedTag === null"
  [attr.aria-pressed]="selectedTag === null"
  aria-label="Show all articles"
  (click)="onTagChange(null)">
  All
</button>
<button class="filter-chip"
  *ngFor="let tag of allTags"
  [class.active]="selectedTag === tag"
  [attr.aria-pressed]="selectedTag === tag"
  [attr.aria-label]="'Filter articles by ' + tag"
  (click)="onTagChange(tag)">
  {{ tag }}
</button>
```

**Step 2: Update Projects filter bar (same pattern)**

Change:
```html
<button class="filter-chip" [class.active]="selectedTag === null" (click)="onTagChange(null)">
  All
</button>
<button class="filter-chip" *ngFor="let tag of allTags" [class.active]="selectedTag === tag"
  (click)="onTagChange(tag)">
  {{ tag }}
</button>
```

To:
```html
<button class="filter-chip"
  [class.active]="selectedTag === null"
  [attr.aria-pressed]="selectedTag === null"
  aria-label="Show all projects"
  (click)="onTagChange(null)">
  All
</button>
<button class="filter-chip"
  *ngFor="let tag of allTags"
  [class.active]="selectedTag === tag"
  [attr.aria-pressed]="selectedTag === tag"
  [attr.aria-label]="'Filter projects by ' + tag"
  (click)="onTagChange(tag)">
  {{ tag }}
</button>
```

**Step 3: Commit**

```bash
git add src/app/pages/blogs/blogs.component.html src/app/pages/projects/projects.component.html
git commit -m "a11y: add aria-label and aria-pressed to filter chip buttons"
```

---

## Task 11: Add `trackBy` to filter tags in `toolbar-search`

**Files:**
- Modify: `src/app/shared/components/toolbar-search/toolbar-search.component.html`
- Modify: `src/app/shared/components/toolbar-search/toolbar-search.component.ts`

**What's wrong:** The `*ngFor="let tag of tags"` loop at line 36 of the template has no `trackBy`. Angular re-renders all tag buttons on every change detection cycle unnecessarily.

**Step 1: Open `toolbar-search.component.html` and find the tags loop**

Locate the line:
```html
<button *ngFor="let tag of tags" class="filter-chip" ...>
```

Change to:
```html
<button *ngFor="let tag of tags; trackBy: trackByTag" class="filter-chip" ...>
```

**Step 2: Add `trackByTag` method to `toolbar-search.component.ts`**

Add at the bottom of the class (before closing `}`):
```typescript
trackByTag = (_: number, tag: string): string => tag;
```

**Step 3: Commit**

```bash
git add src/app/shared/components/toolbar-search/toolbar-search.component.html src/app/shared/components/toolbar-search/toolbar-search.component.ts
git commit -m "perf: add trackBy to filter tags loop in toolbar-search"
```

---

## Task 12: Improve empty state messages (distinguish search vs no data)

**Files:**
- Modify: `src/app/pages/blogs/blogs.component.html:69-74`
- Modify: `src/app/pages/projects/projects.component.html:104-110`

**What's wrong:** Both pages show "Try adjusting your search or filter..." even when there are legitimately zero items and no filter is active.

**Step 1: Update blogs empty state to be context-aware**

Change:
```html
<div class="blogs__empty" *ngIf="!isLoading && (filteredBlogs$ | async)?.length === 0">
  <portfolio-empty-state icon="article" title="No articles found"
    message="Try adjusting your search or filter to find what you're looking for.">
  </portfolio-empty-state>
</div>
```

To:
```html
<ng-container *ngIf="!isLoading && (filteredBlogs$ | async)?.length === 0">
  <!-- Active search/filter: user can adjust -->
  <div class="blogs__empty" *ngIf="selectedTag || (searchQuery$ | async)">
    <portfolio-empty-state icon="search_off" title="No results found"
      message="Try adjusting your search or filter to find what you're looking for.">
    </portfolio-empty-state>
  </div>
  <!-- No filter active and no data: content hasn't been published yet -->
  <div class="blogs__empty" *ngIf="!selectedTag && !(searchQuery$ | async)">
    <portfolio-empty-state icon="article" title="No articles yet"
      message="Check back soon — new content is on the way.">
    </portfolio-empty-state>
  </div>
</ng-container>
```

Note: `searchQuery$` is a private `BehaviorSubject`. Expose it as a public observable for template use by adding to the class:
```typescript
readonly hasActiveSearch$ = combineLatest([this.selectedTag$, this.searchQuery$]).pipe(
    map(([tag, q]) => tag !== null || q !== '')
);
```

Then simplify the empty state to:
```html
<div class="blogs__empty" *ngIf="!isLoading && (filteredBlogs$ | async)?.length === 0">
  <portfolio-empty-state
    [icon]="(hasActiveSearch$ | async) ? 'search_off' : 'article'"
    [title]="(hasActiveSearch$ | async) ? 'No results found' : 'No articles yet'"
    [message]="(hasActiveSearch$ | async) ? 'Try adjusting your search or filter.' : 'Check back soon — new content is on the way.'">
  </portfolio-empty-state>
</div>
```

**Step 2: Apply the same pattern to projects empty state**

Add to `projects.component.ts`:
```typescript
readonly hasActiveSearch$ = combineLatest([this.selectedTag$, this.searchQuery$]).pipe(
    map(([tag, q]) => tag !== null || q !== '')
);
```

Update projects empty state:
```html
<div class="projects__empty" *ngIf="!isLoading && data.projects?.length === 0"
  style="grid-column: 1/-1; display: flex; justify-content: center; padding: 48px 0;">
  <portfolio-empty-state
    [icon]="(hasActiveSearch$ | async) ? 'search_off' : 'folder_off'"
    [title]="(hasActiveSearch$ | async) ? 'No projects found' : 'No projects yet'"
    [message]="(hasActiveSearch$ | async) ? 'Try different keywords or clear your filter.' : 'Check back soon.'">
  </portfolio-empty-state>
</div>
```

**Step 3: Verify both empty states work as expected**

In dev: search for a term that returns no results → see "No results found". Clear the search with no data → see "No articles yet" (may require mocking API to return empty).

**Step 4: Commit**

```bash
git add src/app/pages/blogs/blogs.component.html src/app/pages/blogs/blogs.component.ts src/app/pages/projects/projects.component.html src/app/pages/projects/projects.component.ts
git commit -m "ux: differentiate empty state messages for search vs no content"
```

---

## Task 13: Close mobile menu on navigation

**Files:**
- Modify: `src/app/layout/layout.component.ts`

**What's wrong:** The router subscription (lines 83–92) updates `isProjectDetailPage` on `NavigationEnd`, but does not close the mobile menu. If a user taps a nav link in the open mobile menu, the menu stays open after navigation.

**Step 1: Add `this.mobileMenuOpen = false` in the NavigationEnd handler**

Change:
```typescript
this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    takeUntilDestroyed()
).subscribe((event: NavigationEnd) => {
    this.isProjectDetailPage = event.url.includes('/projects/') && !event.url.endsWith('/projects');
    if (this.isProjectDetailPage) {
        this.activeSection = 'overview';
    }
});
```

To:
```typescript
this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    takeUntilDestroyed()
).subscribe((event: NavigationEnd) => {
    this.isProjectDetailPage = event.url.includes('/projects/') && !event.url.endsWith('/projects');
    if (this.isProjectDetailPage) {
        this.activeSection = 'overview';
    }
    // Always close mobile menu on navigation
    this.mobileMenuOpen = false;
});
```

**Step 2: Verify behavior**

Open mobile menu → tap a nav link → menu should close and the new page should render.

**Step 3: Commit**

```bash
git add src/app/layout/layout.component.ts
git commit -m "fix: close mobile menu on route navigation"
```

---

## Task 14: Add image lazy loading to Home page skill icons

**Files:**
- Modify: `src/app/pages/home/home.component.html`

**What's wrong:** Skill icon `<img>` elements that use `[ngSrc]` load eagerly by default. These are below the fold and should load lazily.

**Step 1: Find all skill icon `<img>` tags in the template**

Search for `class="skill-icon custom"` in `home.component.html`.

**Step 2: Add `loading="lazy"` attribute**

Change:
```html
<img *ngIf="skill.icon.startsWith('http')" [ngSrc]="skill.icon" [alt]="skill.name"
  width="24" height="24" class="skill-icon custom" />
```

To:
```html
<img *ngIf="skill.icon.startsWith('http')" [ngSrc]="skill.icon" [alt]="skill.name"
  width="24" height="24" class="skill-icon custom" loading="lazy" />
```

**Step 3: Commit**

```bash
git add src/app/pages/home/home.component.html
git commit -m "perf: add lazy loading to skill icons on home page"
```

---

## Task 15: Final lint check and build verification

**Step 1: Run linter**

```bash
yarn lint
```

Fix any lint errors reported (most will be auto-fixable).

**Step 2: Auto-fix lint errors**

```bash
yarn lint:fix
```

**Step 3: Run production build and confirm no errors**

```bash
yarn build
```

Expected: Build completes successfully with no errors or warnings.

**Step 4: Commit any lint fixes**

```bash
git add -A
git commit -m "chore: fix lint warnings after bug-fix and a11y improvements"
```

---

## Summary of Changes

| Task | File(s) | Type |
|------|---------|------|
| 1 | `blogs.component.html` | Bug fix |
| 2 | `blog-detail.component.ts` | Memory leak |
| 3 | `project-detail.component.ts` | Memory leak |
| 4 | `blog-detail.component.ts` | Security |
| 5 | `blogs.component.ts` | Error handling + cleanup |
| 6 | `toolbar-search.component.ts` | Resource cleanup |
| 7 | `layout.component.ts` | Type safety |
| 8 | `projects.component.html` | UX / Loading state |
| 9 | `projects.component.scss` | Accessibility |
| 10 | `blogs.component.html`, `projects.component.html` | Accessibility |
| 11 | `toolbar-search.component.html/.ts` | Performance |
| 12 | `blogs.component.html/.ts`, `projects.component.html/.ts` | UX |
| 13 | `layout.component.ts` | UX |
| 14 | `home.component.html` | Performance |
| 15 | All | Code quality |
