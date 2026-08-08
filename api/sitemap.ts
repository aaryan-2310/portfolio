/**
 * Live `sitemap.xml`, exposed at the site root by the rewrite in `vercel.json`.
 *
 * Projects and posts are published through the CMS at runtime with no redeploy,
 * so a build-time sitemap would go stale the moment new content landed. This
 * queries the CMS per request instead and leans on Vercel's edge cache to keep
 * that cheap. Deliberately independent of the rendering strategy — it works the
 * same whether the app stays client-rendered or moves to SSR later.
 */

const SITE_ORIGIN = 'https://aryanmishra.work';
const CMS_API_URL = process.env['CMS_API_URL'] ?? 'https://cms-api.aryanmishra.work/api/public';
const FETCH_TIMEOUT_MS = 5000;

/** The subset of CMS fields a sitemap actually needs. */
interface CmsEntry {
    slug?: string;
    status?: string;
    updatedAt?: string;
    publishedAt?: string;
}

interface SitemapUrl {
    path: string;
    changefreq: string;
    priority: string;
    lastmod?: string;
}

/**
 * Mirrors the navigable routes in `src/app/app.routes.ts`. Excludes `''`
 * (redirect-only) and `**` (not-found) — neither is a real, indexable page.
 */
const STATIC_ROUTES: readonly SitemapUrl[] = [
    { path: '/home', changefreq: 'monthly', priority: '1.0' },
    { path: '/projects', changefreq: 'weekly', priority: '0.9' },
    { path: '/blogs', changefreq: 'weekly', priority: '0.9' },
    { path: '/about', changefreq: 'monthly', priority: '0.8' },
    { path: '/career', changefreq: 'monthly', priority: '0.7' },
    { path: '/services', changefreq: 'monthly', priority: '0.7' },
    { path: '/contact', changefreq: 'yearly', priority: '0.6' },
];

function escapeXml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/** ISO-8601 timestamp for `<lastmod>`, or undefined if the CMS value is unusable. */
function toLastmod(value: string | undefined): string | undefined {
    if (!value) {
        return undefined;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

async function fetchCollection(path: string): Promise<CmsEntry[]> {
    try {
        const response = await fetch(`${CMS_API_URL}${path}`, {
            headers: { accept: 'application/json' },
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        if (!response.ok) {
            return [];
        }
        const body: unknown = await response.json();
        return Array.isArray(body) ? (body as CmsEntry[]) : [];
    } catch {
        // A CMS hiccup shouldn't 500 the sitemap. Degrading to the static routes
        // keeps the document valid and crawlable rather than breaking it outright.
        return [];
    }
}

/**
 * `/api/public` is expected to return only published content, so the status
 * check is belt-and-braces: drop an entry only when it explicitly says it isn't
 * published.
 */
function toUrls(entries: CmsEntry[], prefix: string, changefreq: string, priority: string): SitemapUrl[] {
    return entries
        .filter(entry => Boolean(entry.slug) && (!entry.status || entry.status === 'PUBLISHED'))
        .map(entry => ({
            path: `${prefix}/${entry.slug}`,
            changefreq,
            priority,
            lastmod: toLastmod(entry.updatedAt ?? entry.publishedAt),
        }));
}

function renderUrl({ path, changefreq, priority, lastmod }: SitemapUrl): string {
    const lines = [
        '  <url>',
        `    <loc>${escapeXml(`${SITE_ORIGIN}${path}`)}</loc>`,
        lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
        `    <changefreq>${changefreq}</changefreq>`,
        `    <priority>${priority}</priority>`,
        '  </url>',
    ];
    return lines.filter((line): line is string => line !== null).join('\n');
}

function renderSitemap(urls: readonly SitemapUrl[]): string {
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...urls.map(renderUrl),
        '</urlset>',
        '',
    ].join('\n');
}

export default {
    async fetch(): Promise<Response> {
        const [projects, blogs] = await Promise.all([
            fetchCollection('/projects'),
            fetchCollection('/blogs'),
        ]);

        const urls: SitemapUrl[] = [
            ...STATIC_ROUTES,
            ...toUrls(projects, '/projects', 'monthly', '0.8'),
            ...toUrls(blogs, '/blogs', 'monthly', '0.7'),
        ];

        return new Response(renderSitemap(urls), {
            status: 200,
            headers: {
                'content-type': 'application/xml; charset=utf-8',
                // Cheap on the edge, never more than an hour stale.
                'cache-control': 's-maxage=3600, stale-while-revalidate=86400',
            },
        });
    },
};
