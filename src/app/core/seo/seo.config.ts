/**
 * Site-wide SEO constants.
 *
 * `origin` is the canonical production domain. Every absolute URL in meta tags
 * and structured data is built from it, so it must stay in sync with the two
 * places outside the Angular app that hardcode the same value:
 * `src/robots.txt` (Sitemap directive) and `api/sitemap.ts` (SITE_ORIGIN).
 */
export const SEO_CONFIG = {
    siteName: 'Aryan Mishra',
    origin: 'https://aryanmishra.work',
    /** Appended to per-page titles, producing e.g. "About | Aryan Mishra". */
    titleSuffix: 'Aryan Mishra',
    defaultTitle: 'Aryan Mishra — Full-Stack Software Engineer',
    defaultDescription:
        'Full-stack software engineer specialising in TypeScript and Angular products. ' +
        'Selected projects, professional experience, services, and technical writing.',
    /** Site-relative; resolved against `origin` when emitted as og:image. */
    defaultImage: '/assets/img/my_pic.jpg',
    jobTitle: 'Full-Stack Software Engineer',
} as const;
