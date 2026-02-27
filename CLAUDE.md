# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development server (localhost:4200)
yarn start

# Production build
yarn build

# Unit tests (Karma + Jasmine, Chrome headless)
yarn test

# Lint TypeScript and HTML
yarn lint
yarn lint:fix
```

Run a single test file by passing `--include` to `ng test`:
```bash
ng test --include='src/app/path/to/component.spec.ts'
```

## Architecture

This is an **Angular 19 standalone-component portfolio site** that consumes data from the `portfolio-cms` backend API.

### Key Patterns

- **Standalone components**: No `NgModule` declarations. Each component uses `imports: []` directly.
- **Lazy-loaded pages**: All routes in `app.routes.ts` use `loadComponent()`. The layout shell (`src/app/layout/`) is eagerly loaded.
- **Environment-based API URL**: `src/environments/environment.ts` (dev) and `environment.prod.ts` (prod) hold the CMS API base URL used by services in `src/app/core/services/`.
- **Proxy in dev**: `proxy.conf.json` forwards `/api/*` to the CMS backend, so local dev doesn't need CORS config.
- **Global error handler**: `src/app/core/error/` overrides Angular's default `ErrorHandler` for centralized exception logging.
- **Theming**: Material theme tokens are set in `src/styles/_theme.scss`; per-component theme mixins live in `*-component.theme.scss` files. Global design tokens (`_colors.scss`, `_palette.scss`, `_mixins.scss`) are imported in `src/styles/styles.scss`.

### Routing

`/home` is the default redirect. Slug-based detail pages (`/projects/:slug`, `/blogs/:slug`) receive the slug via `ActivatedRoute` and fetch content from the CMS. The `not-found` component handles the `**` wildcard.

### Shared vs. Core

- `src/app/core/` — singleton services and global error handler (provided in root).
- `src/app/shared/` — reusable components, directives, models, and utilities imported by multiple feature pages.

## Tooling Notes

- Package manager: **Yarn** (use `yarn`, not `npm`).
- Node 22.x required (see `.nvmrc` / engine constraints).
- Git hooks via Husky + lint-staged run ESLint before commits.
- Deployment target: **Vercel** (`vercel.json` at root).
