
import { Injectable, inject, DOCUMENT } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SEO_CONFIG } from '../seo/seo.config';

export interface SeoMetadata {
    /** Page title *without* the site suffix — the suffix is appended here. */
    title?: string;
    description?: string;
    /** Route path such as `/about`, used to build the canonical URL. */
    path?: string;
    /** Absolute URL, or a site-relative path which is resolved against the origin. */
    image?: string;
    type?: 'website' | 'article';
    /** ISO-8601. Only emitted when `type` is `'article'`. */
    publishedTime?: string;
    /** ISO-8601. Only emitted when `type` is `'article'`. */
    modifiedTime?: string;
    /**
     * Page-level structured data; an array is emitted as a single `@graph`.
     * Omitting this **removes** any block a previous page injected — that is what
     * stops one page's structured data from leaking onto the next during
     * client-side navigation.
     */
    jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Attributes marking the `<script>` tags this service owns. Two separate blocks:
 * the site-level one describes the person/site and persists across navigation,
 * the page-level one is replaced on every navigation.
 */
const PAGE_JSONLD_ATTR = 'data-seo-jsonld-page';
const SITE_JSONLD_ATTR = 'data-seo-jsonld-site';

/**
 * Single entry point for every SEO-relevant tag in `<head>`.
 *
 * Note the standing limitation while the app is client-rendered only: crawlers
 * that don't execute JavaScript never see anything written here — they get the
 * static fallbacks in `src/index.html` instead. This is still worth doing, since
 * it is what Googlebot and browser-driven agents see today, and it means an SSR
 * migration later becomes purely a rendering change rather than also having to
 * build the SEO plumbing from scratch.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
    private readonly title = inject(Title);
    private readonly meta = inject(Meta);
    private readonly document = inject(DOCUMENT);

    update(metadata: SeoMetadata): void {
        const title = metadata.title
            ? `${metadata.title} | ${SEO_CONFIG.titleSuffix}`
            : SEO_CONFIG.defaultTitle;
        const description = metadata.description?.trim() || SEO_CONFIG.defaultDescription;
        const url = this.absoluteUrl(metadata.path ?? '/');
        const image = this.absoluteUrl(metadata.image ?? SEO_CONFIG.defaultImage);
        const type = metadata.type ?? 'website';

        this.title.setTitle(title);
        this.setTag('name', 'description', description);
        this.setCanonical(url);

        this.setTag('property', 'og:title', title);
        this.setTag('property', 'og:description', description);
        this.setTag('property', 'og:url', url);
        this.setTag('property', 'og:type', type);
        this.setTag('property', 'og:image', image);
        this.setTag('property', 'og:site_name', SEO_CONFIG.siteName);

        this.setTag('name', 'twitter:card', 'summary_large_image');
        this.setTag('name', 'twitter:title', title);
        this.setTag('name', 'twitter:description', description);
        this.setTag('name', 'twitter:image', image);

        // Cleared when not an article, so a blog post's dates don't linger on the
        // next page navigated to.
        const isArticle = type === 'article';
        this.setTag('property', 'article:published_time', isArticle ? metadata.publishedTime : undefined);
        this.setTag('property', 'article:modified_time', isArticle ? metadata.modifiedTime : undefined);

        this.setJsonLd(PAGE_JSONLD_ATTR, metadata.jsonLd);
    }

    /**
     * Sets the persistent site-level structured data (Person / WebSite).
     * Unaffected by navigation, unlike the page-level block in `update()`.
     */
    setSiteJsonLd(jsonLd: Record<string, unknown> | Record<string, unknown>[]): void {
        this.setJsonLd(SITE_JSONLD_ATTR, jsonLd);
    }

    /** Leaves absolute URLs untouched; resolves anything else against the origin. */
    absoluteUrl(value: string): string {
        if (/^https?:\/\//i.test(value)) {
            return value;
        }
        return `${SEO_CONFIG.origin}${value.startsWith('/') ? '' : '/'}${value}`;
    }

    private setTag(attr: 'name' | 'property', key: string, content: string | undefined): void {
        if (content) {
            this.meta.updateTag({ [attr]: key, content });
        } else {
            this.meta.removeTag(`${attr}="${key}"`);
        }
    }

    private setCanonical(url: string): void {
        const head = this.document.head;
        let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
        if (!link) {
            link = this.document.createElement('link');
            link.setAttribute('rel', 'canonical');
            head.appendChild(link);
        }
        link.setAttribute('href', url);
    }

    private setJsonLd(
        attr: string,
        data: Record<string, unknown> | Record<string, unknown>[] | undefined,
    ): void {
        const head = this.document.head;
        head.querySelector(`script[${attr}]`)?.remove();

        if (!data || (Array.isArray(data) && data.length === 0)) {
            return;
        }

        // Multiple schemas describing one page belong in a single @graph rather
        // than competing top-level blocks.
        const payload = Array.isArray(data)
            ? { '@context': 'https://schema.org', '@graph': data }
            : data;

        const script = this.document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.setAttribute(attr, '');
        // Assigning to textContent does not re-parse as HTML, so this is already
        // safe; escaping `<` is belt-and-braces given the payload carries
        // CMS-authored titles and excerpts.
        script.textContent = JSON.stringify(payload).replace(/</g, '\\u003c');
        head.appendChild(script);
    }
}
