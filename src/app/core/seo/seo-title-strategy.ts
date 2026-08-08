import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { SeoService } from '../services/seo.service';
import { breadcrumbSchema } from './seo.schema';

const HOME_PATH = '/home';

/**
 * Applies title *and* description/canonical/social tags on every navigation.
 *
 * Angular's default strategy only consumes a route's `title`, which left the
 * `data: { description }` already declared on every static route in
 * `app.routes.ts` as dead configuration. This reads it.
 *
 * Detail routes (`projects/:slug`, `blogs/:slug`) carry only a generic
 * placeholder title and no description, so they intentionally get overwritten by
 * their component once the CMS responds — this runs first and establishes a
 * sane baseline, the component refines it.
 */
@Injectable({ providedIn: 'root' })
export class SeoTitleStrategy extends TitleStrategy {
    private readonly seo = inject(SeoService);

    override updateTitle(snapshot: RouterStateSnapshot): void {
        const title = this.buildTitle(snapshot);
        const path = stripQueryAndFragment(snapshot.url);

        this.seo.update({
            title,
            description: resolveDescription(snapshot.root),
            path,
            jsonLd: buildBreadcrumb(path, title),
        });
    }
}

/**
 * A trail for the current page, or undefined on home where a single-entry
 * breadcrumb would be noise. Detail routes replace this with a fuller trail once
 * their component knows the entity's real name.
 */
function buildBreadcrumb(path: string, title: string | undefined): Record<string, unknown> | undefined {
    if (!title || path === HOME_PATH || path === '/') {
        return undefined;
    }

    return breadcrumbSchema([
        { name: 'Home', path: HOME_PATH },
        { name: title, path },
    ]);
}

/** Walks to the deepest route that declares a description, so children win. */
function resolveDescription(root: ActivatedRouteSnapshot): string | undefined {
    let route: ActivatedRouteSnapshot | null = root;
    let description: string | undefined;

    while (route) {
        const value: unknown = route.data['description'];
        if (typeof value === 'string' && value.length > 0) {
            description = value;
        }
        route = route.firstChild;
    }

    return description;
}

/** Canonical URLs must not carry query strings or fragments. */
function stripQueryAndFragment(url: string): string {
    return url.split(/[?#]/)[0];
}
