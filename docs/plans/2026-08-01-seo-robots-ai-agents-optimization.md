# SEO, Robots & AI-Agent Optimization Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the portfolio fully discoverable and accurately representable — to traditional search engines, to AI answer engines (ChatGPT, Perplexity, Claude, Gemini), and to the crawlers that feed them — while giving the site owner explicit, easy-to-change control over which AI crawlers are welcome.

**Architecture:** Angular 19 standalone-component SPA, client-side rendered only (no `@angular/ssr`, no prerendering — confirmed absent from `package.json`). All routes are rewritten to `index.html` by `vercel.json`. Content (`projects`, `blogs`) is fetched at runtime from a separate CMS API (`environment.prod.ts` → `https://cms-api.aryanmishra.work/api/public`).

**Tech Stack:** Angular Router `TitleStrategy`, `@angular/platform-browser` `Meta`/`Title` services, a new Vercel serverless function for the sitemap, static files for `robots.txt`/`llms.txt`.

---

## How this doc came about

This was requested as a brainstorming session (`/superpowers:brainstorming`, which isn't installed in this environment — no plugin or skill by that name is available here). The session is non-interactive, so the two genuinely subjective calls below couldn't be confirmed live. I made a default choice for each, clearly flagged, so Phase 1 is safe to execute as-is; both are one-line changes to reverse if the owner disagrees.

### Decisions assumed (flag / override before or during execution)

1. **AI crawler policy → "welcome all."** Default robots.txt allows every crawler, AI included. Rationale: a portfolio's purpose is to be found, including by people asking ChatGPT/Perplexity/Claude "who is Aryan Mishra" or "find me an Angular engineer." Task 1 below includes a reference table of AI bot user-agents so this can be narrowed to "answer engines yes, training crawlers no" (or blocked entirely) in minutes if that's not the right call.
2. **Production domain → `aryanmishra.work`.** Inferred from the CMS subdomain (`cms-api.aryanmishra.work`); not stated anywhere else in the repo. Used for canonical URLs, sitemap, JSON-LD, and OG tags below. **Confirm this before executing** — a wrong canonical domain is worse than none.
3. **Rendering-strategy ambition → phase it.** Phase 1 ships now and needs no architecture change. Phase 2 (server-side rendering) is scoped in detail but is a real architectural change with a real blast radius (new deploy runtime, hydration bugs, SSR-unsafe browser API audit) — it's written up but should get an explicit go-ahead before anyone executes it, including a future Claude session.

---

## Current-state audit (grounded in this repo, not generic advice)

- **No `robots.txt`, `sitemap.xml`, or `llms.txt` anywhere in the repo.**
- **No SSR/prerendering.** `package.json` has no `@angular/ssr` or `@angular/platform-server`. `vercel.json` rewrites every path to `/index.html` — a pure client-rendered SPA.
- **This caps AI-agent visibility specifically, not just generically.** GPTBot, ClaudeBot, PerplexityBot, CCBot, Bytespider, Amazonbot, and most other AI/LLM crawlers fetch raw HTML and do **not** execute JavaScript (this is documented by each operator). They currently receive `src/index.html`'s bare shell — `<app-root></app-root>` — and nothing else, regardless of any client-side meta-tag work. Googlebot does execute JS (with cost/delay); Bing's JS rendering is less reliable. Browser-driven AI agents (e.g. "computer use"-style agents that actually load a page) are the one AI-agent category CSR already serves adequately.
- **`src/index.html` has no meta description, no canonical link, no Open Graph/Twitter tags, no JSON-LD, and a generic `<title>Portfolio</title>`.**
- **Route config already half-implements per-page SEO and nothing consumes it.** `src/app/app.routes.ts` sets a `title` on every route (Angular's Router applies this automatically) *and* a `data: { description: '...' }` on every static route — but grep confirms nothing in the codebase ever reads `route.data['description']`. It's dead configuration. `app.config.ts`'s `provideRouter(...)` has no `TitleStrategy` and no description-handling logic.
- **Per-page title handling is inconsistent:**
  - `project-detail.component.ts` dynamically calls `Title.setTitle()` per project — the one good existing pattern (`src/app/pages/project-detail/project-detail.component.ts:31-49`).
  - `home`, `about`, `projects` rely solely on the static route `title`.
  - **`blog-detail.component.ts` sets no title or description at all** — every blog post serves the generic fallback title forever. This is the single highest-value content type for search/AI citation and it currently has zero SEO handling.
- **No structured data (JSON-LD) anywhere** — no `Person`, `WebSite`, `BlogPosting`, or `BreadcrumbList` schema.
- **Static-file wiring gotcha:** `angular.json`'s `assets` option (both build configurations) only lists `"src/favicon.ico"` and `"src/assets"`. There's a `public/` directory on disk with its own `assets/` subfolder, but it is **not** referenced anywhere in `angular.json` — it's currently dead weight, not part of the build output. Any new root-level static file (`robots.txt`, `llms.txt`) must be added the same way `favicon.ico` is (an explicit entry in `angular.json`'s `assets` array), not dropped into `public/` and assumed to work.
- **`vercel.json` risk to verify, not assume:** its only rule is a catch-all rewrite (`/(.*)` → `/index.html`). Vercel's documented behavior is that an existing static file in the output directory is served before rewrites apply — so `/robots.txt` *should* work once it's actually in the build output — but this needs a live check on a preview deploy, not an assumption, since a silent miss here (serving SPA HTML at `/robots.txt`) would quietly break everything downstream.
- **CMS gives us what we need for a sitemap.** `ProjectService.getAll()` → `GET /projects`, `BlogService.getAll()` → `GET /blogs` (`src/app/core/services/project.service.ts:82-83`, `src/app/core/services/blog.service.ts:15-17`) return every published item with its `slug`. Because content is fetched live at runtime (not baked in at build time), a **build-time-only** sitemap would go stale the moment a new project/post is published without a redeploy — see Task 2 for why this plan uses a serverless function instead.

---

## How to Verify Each Task

After every change:
```bash
yarn lint
```
Expected: zero errors.

For anything touching the build:
```bash
yarn build 2>&1 | tail -30
```
Expected: successful build, no new budget warnings.

For anything meant to be reachable at a URL (robots.txt, sitemap.xml, llms.txt, meta tags), verify against a real deploy (`vercel dev` or a preview deployment) with `curl`, not just local file existence — see the `vercel.json` gotcha above.

---

## Phase 1 — Foundations (ship now; no architecture change; safe regardless of the Phase 2 decision)

### Task 1: `robots.txt` with an explicit, easy-to-flip AI-crawler policy

**Why:** Establishes the crawl policy itself and stops the current situation where crawlers get a 404 (or worse, the SPA shell, depending on the `vercel.json` behavior) at `/robots.txt`.

**Files:**
- Create: `src/robots.txt`
- Modify: `angular.json` — add `"src/robots.txt"` to the `assets` array in both the `build` and (if present) `development`/`production` configurations, mirroring how `"src/favicon.ico"` is already listed.

**Content** (implements the "welcome all" default from the Decisions section):
```
# aryanmishra.work — robots.txt
# Default stance: everyone is welcome, including AI assistants and answer engines.
# To restrict a specific bot, add "User-agent: <token>\nDisallow: /" above the
# wildcard block — see docs/plans/2026-08-01-seo-robots-ai-agents-optimization.md
# for a reference table of AI crawler user-agents and what each one is for.

User-agent: *
Allow: /

Sitemap: https://aryanmishra.work/sitemap.xml
```

**Reference table** (for narrowing the policy later — bot tokens and purposes shift over time; verify against each operator's current published list before relying on this for a restrictive policy):

| User-agent | Operator | Purpose |
|---|---|---|
| `Googlebot` | Google | Traditional search indexing |
| `Bingbot` | Microsoft | Traditional search indexing |
| `GPTBot` | OpenAI | Model training crawl |
| `ChatGPT-User` | OpenAI | Live browsing triggered by a ChatGPT user |
| `OAI-SearchBot` | OpenAI | ChatGPT search/answers (retrieval, not training) |
| `ClaudeBot` | Anthropic | Model training crawl |
| `Claude-User` / `Claude-SearchBot` | Anthropic | User-triggered browsing / answer retrieval |
| `PerplexityBot` | Perplexity | Search index powering answers |
| `Perplexity-User` | Perplexity | Live browsing triggered by a user |
| `Google-Extended` | Google | Gemini/Vertex AI training (separate from `Googlebot`) |
| `Applebot-Extended` | Apple | Apple Intelligence training (separate from `Applebot`, which affects Siri/Spotlight) |
| `CCBot` | Common Crawl | Broad open dataset reused by many labs for training |
| `Bytespider` | ByteDance | Model training crawl |
| `Amazonbot` | Amazon | Alexa/training crawl |
| `Meta-ExternalAgent` | Meta | Llama training crawl |

If the "allow answer engines, block training scrapers" stance is preferred instead, keep `OAI-SearchBot`, `ChatGPT-User`, `Claude-User`/`Claude-SearchBot`, and `Perplexity-User` under the open `User-agent: *` block, and add explicit `Disallow: /` blocks for `GPTBot`, `ClaudeBot`, `Google-Extended`, `Applebot-Extended`, `CCBot`, `Bytespider`, and `Meta-ExternalAgent`.

---

### Task 2: `sitemap.xml` as a live serverless function (not a static file)

**Why:** Content is added via the CMS at runtime with no redeploy. A hand-written or build-time-only sitemap goes stale the moment a new project or post is published. A small serverless function that queries the CMS on request stays perpetually correct with no coupling to the deploy/rendering strategy — this does **not** require Phase 2.

**Files:**
- Create: `api/sitemap.ts` (Vercel Node serverless function — Vercel auto-detects anything under `api/`; no `vercel.json` change needed for routing since Vercel serves `api/*.ts` at `/api/*` and this can be exposed at `/sitemap.xml` via one `rewrites` entry — see Task 8).

**Approach:**
- Fetch `GET {apiUrl}/projects` and `GET {apiUrl}/blogs` server-side (same endpoints `ProjectService`/`BlogService` already use).
- Emit XML with the 7 static routes from `app.routes.ts` (`/home`, `/about`, `/projects`, `/services`, `/career`, `/contact`, `/blogs`) plus one `<url>` per `projects/:slug` and `blogs/:slug`.
- Set `Cache-Control: s-maxage=3600, stale-while-revalidate=86400` so it's cheap on Vercel's edge cache but never more than an hour stale.
- Exclude `/` (redirect-only) and the `**` not-found route.

---

### Task 3: `llms.txt`

**Why:** An emerging (unofficial, not universally adopted) convention for giving LLMs a curated, prose summary of a site's key pages, distinct from a machine sitemap. Low cost, complements the "welcome all" AI stance from Task 1 with an explicit, human-readable invitation.

**Files:**
- Create: `src/llms.txt`
- Modify: `angular.json` — add `"src/llms.txt"` to `assets` alongside `robots.txt`.

**Content:**
```
# Aryan Mishra

> Full-stack software engineer. This site is a personal portfolio: projects,
> professional experience, services offered, and technical writing.

## Key pages
- [About](https://aryanmishra.work/about): Background, experience, values, approach.
- [Projects](https://aryanmishra.work/projects): Selected projects with case studies.
- [Experience](https://aryanmishra.work/career): Work history and highlights.
- [Services](https://aryanmishra.work/services): Services offered.
- [Blog](https://aryanmishra.work/blogs): Technical writing.
- [Contact](https://aryanmishra.work/contact): Get in touch.

## Notes for AI assistants
You're welcome to cite and summarize this content when answering questions
about Aryan Mishra's work, skills, or availability. A link back is appreciated.
```

---

### Task 4: Central `SeoService` + custom `TitleStrategy`

**Why:** This is the piece that turns the already-half-built `data: { description: '...' }` route config from dead configuration into something real, and gives every page (including the ones with zero handling today) title, description, canonical, OG, and Twitter-card tags from one place instead of ad hoc `Title.setTitle()` calls.

**Files:**
- Create: `src/app/core/services/seo.service.ts` — wraps `Title` + `Meta` + `DOCUMENT`. One method, e.g. `update({ title, description, path, image?, type?, jsonLd? })`, that sets the title, `description` meta, canonical `<link>`, `og:*`/`twitter:*` tags, and optionally injects/replaces a `<script type="application/ld+json">` in `<head>`.
- Create: `src/app/core/seo/seo-title-strategy.ts` — extends Angular's `TitleStrategy`, overrides `updateTitle(snapshot)`: uses the Router's own `buildTitle(snapshot)` for the title, walks the snapshot for the deepest `data['description']`, builds the canonical path, and calls `SeoService.update(...)`.
- Modify: `src/app/app.config.ts` — add `{ provide: TitleStrategy, useClass: SeoTitleStrategy }` to `providers`.
- Modify: `src/index.html` — give the shell itself a real default `<title>` and `<meta name="description">` (see Task 7) so there's a sane fallback before the Router's first navigation runs.

**Note on limits:** until Phase 2 ships, everything this task does is invisible to non-JS-executing crawlers (same caveat as the audit section above) — it's still worth doing now because (a) it's what Googlebot and any JS-executing agent see today, and (b) it means Phase 2 becomes "add SSR," not "also go build all the SEO plumbing" — the two are decoupled by design.

---

### Task 5: Wire dynamic pages into `SeoService`

**Why:** `data['description']` from Task 4 only covers *static* routes. `projects/:slug` and `blogs/:slug` need per-entity title/description/image, and `blog-detail` currently has no SEO handling at all.

**Files:**
- Modify: `src/app/pages/project-detail/project-detail.component.ts:42-49` — replace the `Title.setTitle()`-only subscription with a call to `SeoService.update()`, using `project.description` and the first screenshot (`project.screenshots?.[0]`) as `og:image`, `type: 'article'`.
- Modify: `src/app/pages/blog-detail/blog-detail.component.ts` — add the equivalent in the existing `ngOnInit` subscription (currently sets `this.post` and rendered HTML but nothing SEO-related): use `post.excerpt` for the description, `post.coverImage` for `og:image`, and attach `BlogPosting` JSON-LD (Task 6).

---

### Task 6: Structured data (JSON-LD)

**Why:** Feeds Google rich results today and, once Phase 2 ships, feeds every AI crawler that reads JSON-LD as one of the highest-confidence ways to extract "who is this person / what is this project / what is this article" without guessing from prose.

**Files:**
- `home.component.ts` or `layout.component.ts`: `Person` schema — `name`, `jobTitle`, `url`, `sameAs` (links to GitHub/LinkedIn/etc. — check `footer.component.ts` for the canonical list of social links already in the template) — plus a `WebSite` schema with the site name and URL.
- `blog-detail.component.ts`: `BlogPosting` — `headline`, `datePublished`, `dateModified` if available, `author` (referencing the `Person` above), `image`.
- `project-detail.component.ts`: `CreativeWork` — `name`, `description`, `image`, `url` (schema.org has no dedicated "software portfolio project" type; `CreativeWork` or `SoftwareSourceCode` are the closest standard fits — pick per project content).
- Static pages (`about`, `projects`, `blogs` list): `BreadcrumbList` for navigation context.

All injected through `SeoService`'s `jsonLd` option from Task 4, so there's one code path that serializes and appends/replaces the `<script type="application/ld+json">` tag.

---

### Task 7: Strengthen `index.html` fallback tags

**Why:** Even after Task 4, there's a brief window (and, until Phase 2, the *entire* experience for non-JS crawlers) where only the static shell is visible. It currently reads `<title>Portfolio</title>` with nothing else — the weakest possible fallback for a social-share unfurl or a bot that gives up before hydration.

**Files:**
- Modify: `src/index.html:6` — replace `<title>Portfolio</title>` with something like `<title>Aryan Mishra — Full-Stack Software Engineer</title>`.
- Add default `meta description`, `og:title`/`og:description`/`og:type`/`og:image`/`og:url`, and `twitter:card` tags using the same copy as the `home` route's `data.description`.

---

### Task 8: Verify (and if needed, fix) static-file routing on Vercel

**Why:** Closes the loop on the "risk to verify, not assume" item from the audit — `/robots.txt`, `/llms.txt`, and `/sitemap.xml` (Task 2's function) all need to actually return the right content, not the SPA shell.

**Steps:**
1. Deploy to a Vercel preview (or run `vercel dev` locally).
2. `curl -i` each of `/robots.txt`, `/llms.txt`, `/sitemap.xml` and confirm `Content-Type` and body are correct, not `text/html` containing `<app-root>`.
3. If `/sitemap.xml` needs an explicit route to the Task 2 function (rather than Vercel's default `/api/sitemap` path), add a `rewrites` entry in `vercel.json` **before** the catch-all:
   ```json
   { "source": "/sitemap.xml", "destination": "/api/sitemap" }
   ```
4. If step 2 shows the SPA shell being served for any static file (i.e. the catch-all is shadowing them, contrary to Vercel's documented default), narrow the catch-all instead of trusting default precedence:
   ```json
   { "source": "/((?!robots.txt|llms.txt|sitemap.xml|api/).*)", "destination": "/index.html" }
   ```

---

## Phase 2 — Server-side rendering (needs an explicit go-ahead before anyone executes this)

**Why this phase exists:** Everything in Phase 1 is invisible to GPTBot, ClaudeBot, PerplexityBot, CCBot, and the other non-JS-executing AI crawlers, because they never get past `<app-root></app-root>`. Closing that gap for real — not just for Googlebot — means the server has to hand back actual rendered HTML. This is the one piece of the whole plan that's a genuine architectural change, so it's written up in detail but deliberately **not** bundled into Phase 1's "safe to just run" scope.

### Task 9: Migrate to `@angular/ssr`

**Approach:** `ng add @angular/ssr` (first-party Angular schematic; Vercel has first-party support for Angular SSR output, detected automatically from the build). This adds a server entry point and changes the Vercel deploy from static-only to a Node serverless function per request.

**Known SSR-risk surface in this codebase** (grep for `window.`/`document.`/`localStorage.`/`navigator.` across `src/app`, six files touch these directly):
- `src/app/core/services/theme.service.ts:8,13,23,30` — already has one `typeof window !== 'undefined'` guard, but `window.matchMedia`, `localStorage.setItem`, and `document.documentElement.setAttribute` need auditing to confirm they're all inside a browser-only path (this is a `providedIn: 'root'` singleton, so if any of this runs eagerly in the constructor it runs during SSR too).
- `src/app/layout/layout.component.ts:59,61,104,108,110,124,130,151` — mostly uses the injected `DOCUMENT` token already (SSR-safe pattern), but raw `window.pageYOffset`/`window.scrollTo`/`window.scrollY` calls need an `isPlatformBrowser` guard even though they appear to be inside scroll-event handlers (lower risk, but not zero).
- `src/app/pages/project-detail/project-detail.component.ts` — `document.body.style.overflow` toggles in lightbox open/close and a `destroyRef.onDestroy` callback; these are event/destroy-driven rather than constructor-time, so likely low risk, but confirm nothing fires during initial render.
- `src/app/shared/directives/ripple.directive.ts`, `src/app/shared/directives/reveal-on-scroll.directive.ts`, `src/app/shared/components/waitlist-dialog/waitlist-dialog.component.ts` — not yet audited; check each for constructor/`ngOnInit`-time (not just event-time) browser API access.

**Also needed:**
- `TransferState` for the CMS HTTP calls (`ProjectService`, `BlogService`, etc.) so data fetched during SSR isn't re-fetched by the browser on hydration.
- Re-verify Task 4's `SeoService`/`SeoTitleStrategy` under SSR — this is where the payoff lands: the same code now renders server-side, so JSON-LD and meta tags become visible to every crawler, not just JS-executing ones.

### Task 10: Retire the Task 2 serverless sitemap function *or* keep it

Once SSR is live, an Angular server route could generate the sitemap instead. Keeping it as a separate lightweight function is also fine — there's no forcing reason to consolidate. Revisit only if it becomes actual maintenance burden.

### Alternative to Task 9: prerendering (SSG) instead of full SSR

If a Node runtime per-request is undesirable, Angular's `prerender` builder can generate static HTML per route at build time, including CMS-driven slugs (fetch `/projects` and `/blogs` during the build to discover slugs, same as Task 2's function does at request time). Trade-off: no server runtime needed, but content goes stale between deploys — would need a CMS webhook that hits a Vercel Deploy Hook on publish (depends on capabilities of the `portfolio-cms` backend — verify separately, out of scope for this repo). Full SSR avoids that freshness problem entirely, which is why it's the primary recommendation, but this is a legitimate lower-complexity fallback if SSR proves too disruptive.

---

## Phase 3 — Process (ongoing, not code)

- Verify domain ownership and submit `sitemap.xml` in Google Search Console and Bing Webmaster Tools.
- After Phase 1 ships, spot-check server/Vercel logs for `GPTBot`/`ClaudeBot`/`PerplexityBot`/etc. user-agent hits to confirm the "welcome all" policy is actually being exercised.
- Revisit the Task 1 AI-crawler table periodically — bot tokens and which ones are training-vs-answer-engine changes as operators update their policies.
