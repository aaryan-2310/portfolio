import { SEO_CONFIG } from './seo.config';

/**
 * Builders for the schema.org structured data emitted across the site.
 *
 * Everything that describes the site owner points at {@link PERSON_ID} rather
 * than repeating the Person object, so a consumer resolving the graph sees one
 * entity described once and referenced everywhere.
 */

/** Stable node identity for the site owner, referenced as `author`/`publisher`. */
export const PERSON_ID = `${SEO_CONFIG.origin}/#person`;
const WEBSITE_ID = `${SEO_CONFIG.origin}/#website`;

/**
 * Reference to the Person node defined in the site-level graph.
 *
 * Carries `@type`/`name` alongside `@id` deliberately: the full node lives in a
 * separate `<script>` block, and while consumers that merge all JSON-LD on a page
 * resolve the bare `@id` fine, a naive one would be left with an unresolvable
 * pointer. This stays valid JSON-LD while being self-describing either way.
 */
export const personRef = {
    '@id': PERSON_ID,
    '@type': 'Person',
    name: SEO_CONFIG.siteName,
} as const;

export function personSchema(sameAs: string[] = []): Record<string, unknown> {
    return {
        '@type': 'Person',
        '@id': PERSON_ID,
        name: SEO_CONFIG.siteName,
        jobTitle: SEO_CONFIG.jobTitle,
        url: SEO_CONFIG.origin,
        image: `${SEO_CONFIG.origin}${SEO_CONFIG.defaultImage}`,
        description: SEO_CONFIG.defaultDescription,
        ...(sameAs.length > 0 ? { sameAs } : {}),
    };
}

export function webSiteSchema(): Record<string, unknown> {
    return {
        '@type': 'WebSite',
        '@id': WEBSITE_ID,
        name: SEO_CONFIG.siteName,
        url: SEO_CONFIG.origin,
        description: SEO_CONFIG.defaultDescription,
        publisher: personRef,
    };
}

export interface BreadcrumbItem {
    name: string;
    /** Site-relative path, e.g. `/projects`. */
    path: string;
}

export function breadcrumbSchema(trail: BreadcrumbItem[]): Record<string, unknown> {
    return {
        '@type': 'BreadcrumbList',
        itemListElement: trail.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `${SEO_CONFIG.origin}${item.path}`,
        })),
    };
}
