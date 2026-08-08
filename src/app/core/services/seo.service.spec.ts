import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Title } from '@angular/platform-browser';

import { SeoService } from './seo.service';
import { SEO_CONFIG } from '../seo/seo.config';

describe('SeoService', () => {
    let service: SeoService;
    let doc: Document;

    const metaContent = (selector: string): string | null =>
        doc.head.querySelector<HTMLMetaElement>(`meta[${selector}]`)?.content ?? null;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(SeoService);
        doc = TestBed.inject(DOCUMENT);
    });

    afterEach(() => {
        // These tests write to the real document head; leaving tags behind would
        // leak into sibling specs.
        doc.head
            .querySelectorAll(
                'link[rel="canonical"], script[data-seo-jsonld-page], script[data-seo-jsonld-site], ' +
                'meta[name="description"], meta[name^="twitter:"], meta[property^="og:"], meta[property^="article:"]',
            )
            .forEach(node => node.remove());
    });

    describe('title', () => {
        it('appends the site suffix to a page title', () => {
            service.update({ title: 'About' });
            expect(TestBed.inject(Title).getTitle()).toBe(`About | ${SEO_CONFIG.titleSuffix}`);
        });

        it('falls back to the default title when none is given', () => {
            service.update({});
            expect(TestBed.inject(Title).getTitle()).toBe(SEO_CONFIG.defaultTitle);
        });
    });

    describe('description', () => {
        it('uses the supplied description', () => {
            service.update({ description: 'A specific page description.' });
            expect(metaContent('name="description"')).toBe('A specific page description.');
        });

        it('falls back to the default when the description is blank', () => {
            service.update({ description: '   ' });
            expect(metaContent('name="description"')).toBe(SEO_CONFIG.defaultDescription);
        });
    });

    describe('canonical', () => {
        it('builds an absolute URL from a route path', () => {
            service.update({ path: '/about' });
            const link = doc.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
            expect(link?.getAttribute('href')).toBe(`${SEO_CONFIG.origin}/about`);
        });

        it('reuses a single canonical element across navigations', () => {
            service.update({ path: '/about' });
            service.update({ path: '/contact' });

            const links = doc.head.querySelectorAll('link[rel="canonical"]');
            expect(links.length).toBe(1);
            expect(links[0].getAttribute('href')).toBe(`${SEO_CONFIG.origin}/contact`);
        });
    });

    describe('images', () => {
        it('resolves a site-relative image against the origin', () => {
            service.update({ image: '/assets/img/cover.png' });
            expect(metaContent('property="og:image"')).toBe(`${SEO_CONFIG.origin}/assets/img/cover.png`);
        });

        it('leaves an absolute CMS image URL untouched', () => {
            service.update({ image: 'https://cdn.example.com/cover.png' });
            expect(metaContent('property="og:image"')).toBe('https://cdn.example.com/cover.png');
        });

        it('falls back to the default image', () => {
            service.update({});
            expect(metaContent('property="og:image"')).toBe(`${SEO_CONFIG.origin}${SEO_CONFIG.defaultImage}`);
        });
    });

    describe('article tags', () => {
        it('emits publish/modify times for articles', () => {
            service.update({
                type: 'article',
                publishedTime: '2026-01-02T00:00:00.000Z',
                modifiedTime: '2026-03-04T00:00:00.000Z',
            });

            expect(metaContent('property="og:type"')).toBe('article');
            expect(metaContent('property="article:published_time"')).toBe('2026-01-02T00:00:00.000Z');
            expect(metaContent('property="article:modified_time"')).toBe('2026-03-04T00:00:00.000Z');
        });

        it('clears article times when navigating to a non-article page', () => {
            service.update({ type: 'article', publishedTime: '2026-01-02T00:00:00.000Z' });
            service.update({ title: 'Contact' });

            expect(metaContent('property="og:type"')).toBe('website');
            expect(metaContent('property="article:published_time"')).toBeNull();
        });
    });

    describe('structured data', () => {
        const pageScripts = () => doc.head.querySelectorAll('script[data-seo-jsonld-page]');

        it('injects page-level JSON-LD', () => {
            service.update({ jsonLd: { '@type': 'BlogPosting', headline: 'Hello' } });

            expect(pageScripts().length).toBe(1);
            expect(JSON.parse(pageScripts()[0].textContent ?? '{}')).toEqual({
                '@type': 'BlogPosting',
                headline: 'Hello',
            });
        });

        it('replaces rather than accumulates page-level JSON-LD', () => {
            service.update({ jsonLd: { '@type': 'BlogPosting' } });
            service.update({ jsonLd: { '@type': 'CreativeWork' } });

            expect(pageScripts().length).toBe(1);
            expect(pageScripts()[0].textContent).toContain('CreativeWork');
        });

        it('removes page-level JSON-LD when the next page supplies none', () => {
            service.update({ jsonLd: { '@type': 'BlogPosting' } });
            service.update({ title: 'Contact' });

            expect(pageScripts().length).toBe(0);
        });

        it('keeps site-level JSON-LD across navigations', () => {
            service.setSiteJsonLd({ '@type': 'Person', name: 'Aryan Mishra' });
            service.update({ title: 'About' });
            service.update({ title: 'Contact', jsonLd: { '@type': 'BlogPosting' } });

            const siteScripts = doc.head.querySelectorAll('script[data-seo-jsonld-site]');
            expect(siteScripts.length).toBe(1);
            expect(siteScripts[0].textContent).toContain('Person');
        });

        it('combines multiple schemas into a single @graph', () => {
            service.update({
                jsonLd: [{ '@type': 'BreadcrumbList' }, { '@type': 'BlogPosting' }],
            });

            expect(pageScripts().length).toBe(1);
            const payload = JSON.parse(pageScripts()[0].textContent ?? '{}');
            expect(payload['@context']).toBe('https://schema.org');
            expect(payload['@graph'].map((node: { '@type': string }) => node['@type'])).toEqual([
                'BreadcrumbList',
                'BlogPosting',
            ]);
        });

        it('emits nothing for an empty schema array', () => {
            service.update({ jsonLd: [] });
            expect(pageScripts().length).toBe(0);
        });

        it('escapes angle brackets so a payload cannot break out of the script tag', () => {
            service.update({ jsonLd: { headline: '</script><img src=x>' } });

            const raw = pageScripts()[0].textContent ?? '';
            expect(raw).not.toContain('</script>');
            expect(raw).toContain('\\u003c');
            expect(JSON.parse(raw).headline).toBe('</script><img src=x>');
        });
    });
});
